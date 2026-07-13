import { useState, type FormEvent } from "react";
import { BlurReveal } from "../components/motion";
import { Button, ConfirmModal, Toggle } from "../components/ui";
import { useAuth } from "../context/AuthContext";

const AVATARS = ["🦊", "🐫", "🦉", "🐍", "🦂", "🦎", "🌵", "🏜️", "🌙", "⭐", "🔮", "🗝️"];
const HANDLE_RE = /^[A-Za-z0-9_-]{3,20}$/;

export function AccountPage() {
  const { configured, status } = useAuth();

  return (
    <div className="mx-auto max-w-2xl px-4 pt-10 sm:px-6">
      <BlurReveal>
        <h1 className="font-display text-4xl font-semibold">Account</h1>
        <p className="mt-2 qa-muted">
          Playing as a guest keeps everything in this browser. An account tucks your progress
          safely on the server — private to you — and follows you between devices.
        </p>
      </BlurReveal>

      <BlurReveal delay={0.1} className="mt-8">
        {!configured ? (
          <div className="qa-card rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold">Accounts are asleep here</h2>
            <p className="mt-2 text-sm qa-muted">
              This deployment isn't connected to a server, so accounts and leaderboards are off.
              Everything else works — your play lives in this browser, as always.
            </p>
          </div>
        ) : status === "account" ? (
          <ProfilePanel />
        ) : status === "anonymous" ? (
          <AnonymousPanel />
        ) : (
          <SignInPanel />
        )}
      </BlurReveal>
    </div>
  );
}

/**
 * Username + avatar + leaderboard opt-in. Works for any signed-in identity —
 * including the automatic anonymous one — because the profiles table lets any
 * `authenticated` user write their own row. So a guest can name themselves with
 * no sign-up, and the choice survives when they later create an account (same
 * user id).
 */
function IdentityEditor() {
  const { profile, updateProfile } = useAuth();
  const [handle, setHandle] = useState(profile?.handle ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const saveHandle = async () => {
    setError(null);
    setSaved(false);
    if (!HANDLE_RE.test(handle)) {
      setError("Usernames are 3–20 characters: letters, numbers, - or _.");
      return;
    }
    const fail = await updateProfile({ handle });
    if (fail) setError(fail);
    else setSaved(true);
  };

  const pickAvatar = async (avatar: string) => {
    setError(null);
    const fail = await updateProfile({ avatar });
    if (fail) setError(fail);
  };

  return (
    <>
      <div>
        <label className="block">
          <span className="text-sm font-semibold">Username</span>
          <span className="ml-2 text-xs qa-muted">shown on leaderboards — nothing else ever is</span>
          <div className="mt-1 flex gap-2">
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="quiet_fox"
              maxLength={20}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--card-2)] px-4 py-2.5 outline-none focus:border-teal-500"
            />
            <Button variant="secondary" onClick={saveHandle}>
              Save
            </Button>
          </div>
        </label>
        {error && (
          <p className="mt-2 text-sm font-semibold text-clay-600 dark:text-clay-300" role="alert">
            {error}
          </p>
        )}
        {saved && (
          <p className="mt-2 text-sm font-semibold text-sage-700 dark:text-sage-300" role="status">
            Saved.
          </p>
        )}
      </div>

      <div className="mt-6">
        <p className="text-sm font-semibold">Avatar</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              onClick={() => pickAvatar(a)}
              aria-label={`Avatar ${a}`}
              aria-pressed={profile?.avatar === a}
              className={`h-11 w-11 rounded-xl border text-xl transition-colors ${
                profile?.avatar === a
                  ? "border-teal-500 bg-teal-600/15"
                  : "border-[var(--line)] bg-[var(--card-2)] hover:border-teal-600"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 border-t border-[var(--line)]">
        <Toggle
          label="Show me on leaderboards"
          description="Lists your username, scores, and rank publicly. Off by default; flip it off again any time."
          checked={profile?.show_on_leaderboard ?? false}
          onChange={(v) => void updateProfile({ show_on_leaderboard: v })}
        />
      </div>
    </>
  );
}

/**
 * Automatic guest identity: they can pick a username immediately, and are
 * nudged (not forced) to create an account to keep it across devices.
 */
function AnonymousPanel() {
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      <div className="qa-card rounded-2xl p-6">
        <p className="text-sm font-semibold uppercase tracking-widest qa-muted">Your player name</p>
        <p className="mt-1 font-display text-2xl font-semibold">
          {profile?.avatar ?? "🦊"} {profile?.handle ?? "Pick a username"}
        </p>
        <p className="mt-1 text-sm qa-muted">
          You're playing as a guest on this browser — no sign-up needed. Choose a username to
          appear on the leaderboards.
        </p>

        <div className="mt-6">
          <IdentityEditor />
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold">Keep it across devices</h2>
        <p className="mt-1 text-sm qa-muted">
          Create an account and your username, scores, and streaks follow you to any device.
          Nothing you've already played is lost.
        </p>
        <div className="mt-4">
          <SignInPanel />
        </div>
      </div>
    </div>
  );
}

function SignInPanel() {
  const { signUpEmail, signInEmail, signInGoogle } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const fail = mode === "signup" ? await signUpEmail(email, password) : await signInEmail(email, password);
    setBusy(false);
    if (fail) {
      setError(fail);
    } else if (mode === "signup") {
      setNotice(
        "Account created — your progress from this browser is joining it now. " +
          "If email confirmation is enabled, check your inbox to finish up.",
      );
    }
  };

  const google = async () => {
    setError(null);
    const fail = await signInGoogle();
    if (fail) setError(fail);
  };

  return (
    <div className="qa-card rounded-2xl p-6">
      <div className="flex rounded-xl border border-[var(--line)] bg-[var(--card-2)] p-1" role="tablist" aria-label="Sign in or sign up">
        {(["signup", "signin"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
              setNotice(null);
            }}
            className={`flex-1 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
              mode === m ? "bg-teal-600 text-sand-50" : "qa-muted hover:text-[var(--ink)]"
            }`}
          >
            {m === "signup" ? "Create account" : "Sign in"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block">
          <span className="text-sm font-semibold">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--card-2)] px-4 py-2.5 outline-none focus:border-teal-500"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Password</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--card-2)] px-4 py-2.5 outline-none focus:border-teal-500"
          />
        </label>
        {error && (
          <p className="text-sm font-semibold text-clay-600 dark:text-clay-300" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="text-sm font-semibold text-sage-700 dark:text-sage-300" role="status">
            {notice}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? "One moment…" : mode === "signup" ? "Create account" : "Sign in"}
          </Button>
          <Button type="button" variant="secondary" onClick={google}>
            <span
              aria-hidden
              className="grid h-5 w-5 place-items-center rounded-full border border-[var(--line)] text-xs font-bold"
            >
              G
            </span>
            Continue with Google
          </Button>
        </div>
      </form>

      <p className="mt-5 text-xs qa-muted">
        Creating an account keeps every game you've already played here — nothing is lost, and
        nothing is shared unless you opt into the leaderboards.
      </p>
    </div>
  );
}

function ProfilePanel() {
  const { user, profile, signOut, deleteAccount } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="qa-card rounded-2xl p-6">
        <p className="text-sm font-semibold uppercase tracking-widest qa-muted">Signed in</p>
        <p className="mt-1 font-display text-2xl font-semibold">
          {profile?.avatar ?? "🦊"} {profile?.handle ?? "No username yet"}
        </p>
        <p className="mt-1 text-sm qa-muted">{user?.email ?? "Google account"}</p>

        <div className="mt-6">
          <IdentityEditor />
        </div>

        <div className="mt-4">
          <Button variant="secondary" onClick={() => void signOut()}>
            Sign out
          </Button>
          <p className="mt-2 text-xs qa-muted">
            Signing out keeps a copy of your progress in this browser.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-clay-300 bg-clay-50 p-6 dark:border-clay-800 dark:bg-clay-900/30">
        <h2 className="font-display text-lg font-semibold">Delete account &amp; data</h2>
        <p className="mt-1 text-sm qa-muted">
          Permanently removes your account and every scrap of your data from the server — scores,
          stats, completions, profile — and clears this browser too. There is no undo.
        </p>
        <Button variant="danger" className="mt-4" onClick={() => setConfirmDelete(true)}>
          Delete my account
        </Button>
        {deleteError && (
          <p className="mt-3 text-sm font-semibold text-clay-600 dark:text-clay-300" role="alert">
            {deleteError}
          </p>
        )}
      </div>

      <ConfirmModal
        open={confirmDelete}
        title="Delete your account?"
        body="Your account and all of its data — scores, stats, streaks, completions, profile — will be permanently deleted from the server and this browser. There is no undo."
        confirmLabel="Yes, delete everything"
        onConfirm={() => {
          void deleteAccount().then((fail) => setDeleteError(fail));
        }}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
