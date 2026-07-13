import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MotionConfig } from "framer-motion";
import type { Settings } from "../types";
import { loadSettings } from "../lib/storage";
import { saveSettings } from "../lib/repo";
import { SYNC_EVENT } from "../lib/sync";

interface SettingsContextValue {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  /** true when it is OK to run decorative motion */
  motionOK: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function systemPrefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [systemReduced, setSystemReduced] = useState(systemPrefersReducedMotion);

  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setSystemReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // account sync may merge server settings into localStorage — pick them up
  useEffect(() => {
    const onSync = () => setSettings(loadSettings());
    window.addEventListener(SYNC_EVENT, onSync);
    return () => window.removeEventListener(SYNC_EVENT, onSync);
  }, []);

  useEffect(() => {
    saveSettings(settings);
    const root = document.documentElement;
    root.classList.toggle("dark", settings.darkMode);
    root.classList.toggle("hc", settings.highContrast);
    root.classList.toggle("rm", settings.reducedMotion);
  }, [settings]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const motionOK = !settings.reducedMotion && !systemReduced;

  const value = useMemo(() => ({ settings, update, motionOK }), [settings, update, motionOK]);

  return (
    <SettingsContext.Provider value={value}>
      <MotionConfig reducedMotion={settings.reducedMotion ? "always" : "user"}>
        {children}
      </MotionConfig>
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
