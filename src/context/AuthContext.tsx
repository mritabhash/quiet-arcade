import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { setServerSyncEnabled } from "../lib/repo";
import { fullSync } from "../lib/sync";
import { identifyUser, resetAnalytics, track } from "../lib/analytics";

/**
 * Session + profile state for the whole app.
 *
 * - "guest": no Supabase session (unconfigured deployment, offline, or after
 *   signing out). Pure localStorage — the original arcade, untouched.
 * - "anonymous": an automatic Supabase anonymous identity. Play data write-
 *   throughs to the server so a later signup keeps everything.
 * - "account": a permanent (email or Google) identity, synced across devices.
 *
 * The anonymous identity is created lazily on first load when the network
 * allows; failures are silent and the app stays a guest.
 */

export interface Profile {
  handle: string | null;
  avatar: string;
  show_on_leaderboard: boolean;
}

export type AuthStatus = "guest" | "anonymous" | "account";

interface AuthContextValue {
  /** false when the deployment has no Supabase env vars — hide account UI */
  configured: boolean;
  status: AuthStatus;
  user: User | null;
  profile: Profile | null;
  /** upgrade the anonymous identity (or create a fresh account) — returns an error message or null */
  signUpEmail: (email: string, password: string) => Promise<string | null>;
  signInEmail: (email: string, password: string) => Promise<string | null>;
  signInGoogle: () => Promise<string | null>;
  signOut: () => Promise<void>;
  /** permanently delete the account and every server + local row */
  deleteAccount: () => Promise<string | null>;
  updateProfile: (patch: Partial<Profile>) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function friendlyProfileError(code: string | undefined, message: string): string {
  if (code === "23505") return "That handle is already taken.";
  if (code === "23514") return "Handles are 3–20 characters: letters, numbers, - or _.";
  return message;
}

/** every arcade key, including per-game extras like trivia setup */
function clearAllArcadeData(): void {
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("quietArcade.")) doomed.push(key);
    }
    doomed.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const syncedFor = useRef<string | null>(null);

  const refreshProfile = useCallback(async (current: User | null) => {
    if (!supabase || !current) {
      setProfile(null);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("handle, avatar, show_on_leaderboard")
      .maybeSingle();
    setProfile(data ?? null);
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setServerSyncEnabled(nextUser !== null);
      if (nextUser) identifyUser(nextUser.id);
      else resetAnalytics();
      if (nextUser && syncedFor.current !== nextUser.id) {
        syncedFor.current = nextUser.id;
        // merge this browser's data with the account, then push the union up
        void fullSync().then(() => refreshProfile(nextUser));
      } else {
        void refreshProfile(nextUser);
      }
    });

    // create the automatic anonymous identity when there's no session yet
    // (once per load; offline or disabled anonymous auth just leaves a guest)
    void supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        void supabase!.auth.signInAnonymously().catch(() => {});
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, [refreshProfile]);

  const signUpEmail = useCallback(async (email: string, password: string) => {
    if (!supabase) return "Accounts aren't set up on this deployment.";
    const { data } = await supabase.auth.getSession();
    if (data.session?.user.is_anonymous) {
      // upgrade in place: same user id, so every synced row survives
      const res = await supabase.auth.updateUser({ email, password });
      if (res.error) return res.error.message;
      track("account_created", { method: "email", upgraded: true });
      return null;
    }
    const res = await supabase.auth.signUp({ email, password });
    if (res.error) return res.error.message;
    track("account_created", { method: "email", upgraded: false });
    return null;
  }, []);

  const signInEmail = useCallback(async (email: string, password: string) => {
    if (!supabase) return "Accounts aren't set up on this deployment.";
    const res = await supabase.auth.signInWithPassword({ email, password });
    return res.error ? res.error.message : null;
  }, []);

  const signInGoogle = useCallback(async () => {
    if (!supabase) return "Accounts aren't set up on this deployment.";
    const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}account`;
    const { data } = await supabase.auth.getSession();
    if (data.session?.user.is_anonymous) {
      // preferred: link Google to the anonymous identity (keeps the user id)
      const linked = await supabase.auth.linkIdentity({
        provider: "google",
        options: { redirectTo },
      });
      if (!linked.error) return null;
      // manual linking disabled on the project → plain OAuth sign-in;
      // local data still joins the account via the post-sign-in merge
    }
    const res = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    return res.error ? res.error.message : null;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    // stay a pure local guest until the next full page load; local data remains
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!supabase) return "Accounts aren't set up on this deployment.";
    const { error } = await supabase.rpc("delete_account");
    if (error) return error.message;
    await supabase.auth.signOut();
    clearAllArcadeData();
    return null;
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<Profile>) => {
      if (!supabase) return "Accounts aren't set up on this deployment.";
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user.id;
      if (!uid) return "Not signed in.";
      const { error } = await supabase
        .from("profiles")
        .upsert({ user_id: uid, ...patch }, { onConflict: "user_id" });
      if (error) return friendlyProfileError(error.code, error.message);
      await refreshProfile(data.session!.user);
      return null;
    },
    [refreshProfile],
  );

  const status: AuthStatus = !user ? "guest" : user.is_anonymous ? "anonymous" : "account";

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: isSupabaseConfigured(),
      status,
      user,
      profile,
      signUpEmail,
      signInEmail,
      signInGoogle,
      signOut,
      deleteAccount,
      updateProfile,
    }),
    [status, user, profile, signUpEmail, signInEmail, signInGoogle, signOut, deleteAccount, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
