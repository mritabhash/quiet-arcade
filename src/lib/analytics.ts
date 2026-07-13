import posthog from "posthog-js";

/**
 * PostHog product analytics — off by default and privacy-first, in the spirit
 * of the rest of the arcade:
 *
 * - No key in the environment → analytics never loads (exactly like the guest,
 *   server-less experience). See `.env.example`.
 * - Honors the browser's Do-Not-Track signal: if the visitor asked not to be
 *   tracked, we never initialise PostHog at all.
 * - Identification uses only the Supabase user UUID — never an email or any
 *   other personal detail.
 *
 * Every export is a no-op until `initAnalytics()` has actually turned it on, so
 * call sites never need to guard.
 */

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? "https://us.i.posthog.com";

let enabled = false;

/** Browsers expose the Do-Not-Track preference in a few different places. */
function doNotTrack(): boolean {
  const nav = navigator as Navigator & { msDoNotTrack?: string };
  const win = window as Window & { doNotTrack?: string };
  const dnt = nav.doNotTrack ?? win.doNotTrack ?? nav.msDoNotTrack;
  return dnt === "1" || dnt === "yes";
}

export function initAnalytics(): void {
  if (enabled) return;
  if (!KEY) return; // analytics is simply off on this deployment
  if (doNotTrack()) return; // respect the visitor's choice
  posthog.init(KEY, {
    api_host: HOST,
    capture_pageview: false, // captured manually on route change (SPA)
    autocapture: true, // clicks / inputs / form submits
    persistence: "localStorage",
    person_profiles: "identified_only",
  });
  enabled = true;
}

/** Tie events to a stable player. UUID only — no email or PII is sent. */
export function identifyUser(userId: string): void {
  if (!enabled) return;
  posthog.identify(userId);
}

/** Forget the current person (on sign-out) so events don't bleed across users. */
export function resetAnalytics(): void {
  if (!enabled) return;
  posthog.reset();
}

export function track(event: string, props?: Record<string, unknown>): void {
  if (!enabled) return;
  posthog.capture(event, props);
}

export function capturePageview(path: string): void {
  if (!enabled) return;
  posthog.capture("$pageview", { $current_url: path });
}

export function analyticsEnabled(): boolean {
  return enabled;
}
