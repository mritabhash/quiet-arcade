import { useState } from "react";
import { BlurReveal } from "../components/motion";
import { Button, ConfirmModal, Toggle } from "../components/ui";
import { useSettings } from "../context/SettingsContext";
import { clearAllData, DEFAULT_SETTINGS } from "../lib/storage";

export function SettingsPage() {
  const { settings, update } = useSettings();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cleared, setCleared] = useState(false);

  return (
    <div className="mx-auto max-w-2xl px-4 pt-10 sm:px-6">
      <BlurReveal>
        <h1 className="font-display text-4xl font-semibold">Settings</h1>
        <p className="mt-2 qa-muted">
          Tune the arcade to your eyes and your nerves. Saved instantly, kept in this browser.
        </p>
      </BlurReveal>

      <BlurReveal delay={0.1} className="mt-8">
        <div className="qa-card divide-y divide-[var(--line)] rounded-2xl px-6">
          <Toggle
            label="Dark mode"
            description="A desert night: deep pine greens and warm lamplight."
            checked={settings.darkMode}
            onChange={(v) => update({ darkMode: v })}
          />
          <Toggle
            label="Reduced motion"
            description="Stills the parallax, drifts, reveals, and confetti. Also honours your system setting automatically."
            checked={settings.reducedMotion}
            onChange={(v) => update({ reducedMotion: v })}
          />
          <Toggle
            label="Show explanations"
            description="Display the 'How to play' panel at the top of every game."
            checked={settings.showExplanations}
            onChange={(v) => update({ showExplanations: v })}
          />
          <Toggle
            label="High contrast"
            description="Stronger text and borders for easier reading."
            checked={settings.highContrast}
            onChange={(v) => update({ highContrast: v })}
          />
        </div>
      </BlurReveal>

      <BlurReveal delay={0.15} className="mt-10">
        <div className="rounded-2xl border border-clay-300 bg-clay-50 p-6 dark:border-clay-800 dark:bg-clay-900/30">
          <h2 className="font-display text-lg font-semibold">Clear all local data</h2>
          <p className="mt-1 text-sm qa-muted">
            Removes settings, stats, streaks, daily completions, reports, and in-progress saves —
            everything Quiet Arcade keeps in this browser.
          </p>
          <Button variant="danger" className="mt-4" onClick={() => setConfirmOpen(true)}>
            Clear all data
          </Button>
          {cleared && (
            <p className="mt-3 text-sm font-semibold text-sage-700 dark:text-sage-300" role="status">
              All clear. The arcade is as new.
            </p>
          )}
        </div>
      </BlurReveal>

      <ConfirmModal
        open={confirmOpen}
        title="Clear everything?"
        body="Settings, stats, streaks, daily completions, and saves will all be deleted from this browser. There is no undo."
        confirmLabel="Yes, clear it all"
        onConfirm={() => {
          clearAllData();
          update({ ...DEFAULT_SETTINGS });
          setCleared(true);
        }}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
