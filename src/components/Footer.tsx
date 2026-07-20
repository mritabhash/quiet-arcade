import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--line)] bg-[var(--bg-soft)]">
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <p className="qa-fleuron text-lg" aria-hidden>
          ✦
        </p>
      </div>
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 pb-10 pt-6 sm:flex-row sm:items-center sm:px-6">
        <div>
          <p className="font-display text-2xl font-medium">Quiet Arcade</p>
          <p className="mt-1 max-w-sm text-sm qa-muted">
            A small hall of nightly puzzles, lit low. Everything you do here stays in this
            browser — nothing is sent anywhere, ever.
          </p>
          <p className="mt-2 text-xs qa-muted opacity-70">Quietly improving itself.</p>
        </div>
        <nav className="flex gap-5 text-sm font-medium" aria-label="Footer">
          <Link className="hover:text-gold-600 dark:hover:text-gold-300" to="/games">Games</Link>
          <Link className="hover:text-gold-600 dark:hover:text-gold-300" to="/stats">Stats</Link>
          <Link className="hover:text-gold-600 dark:hover:text-gold-300" to="/settings">Settings</Link>
        </nav>
      </div>
    </footer>
  );
}
