import { useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { EASE, EASE_IN_OUT } from "./motion";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/games", label: "Games" },
  { to: "/stats", label: "Stats" },
  { to: "/leaderboards", label: "Ranks" },
  { to: "/lore", label: "Lore" },
  { to: "/cast", label: "Cast" },
  { to: "/settings", label: "Settings" },
  { to: "/account", label: "Account" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  // Versus has no nav entry of its own — each game's page carries its own 1v1
  // panel, and match rooms are reached by shared link (/versus/<code>).
  const links = LINKS;

  return (
    // A floating glass bar rather than an edge-to-edge bordered strip: it sits
    // inset from the top, rounded and lifted, so the page reads like a set of
    // cards under it instead of generic app chrome.
    <div className="sticky top-0 z-40 px-3 pt-3 sm:px-4 sm:pt-4">
      <nav
        aria-label="Main"
        className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--bg)]/70 pl-4 pr-2 shadow-[0_12px_34px_-18px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-colors sm:h-16 sm:pl-5 sm:pr-3"
      >
        <Link
          to="/"
          className="flex items-center gap-2.5 font-display text-2xl font-medium transition-opacity hover:opacity-80"
        >
          {/* the gate sigil: an ogive arch with a glowing keystone */}
          <svg viewBox="0 0 64 64" className="h-8 w-8" aria-hidden>
            <path d="M12 58 L12 34 L32 14 L52 34 L52 58 L42 58 L42 40 Q42 28 32 24 Q22 28 22 40 L22 58 Z" fill="#ae4d2c" />
            <path d="M26 58 L26 42 Q26 32 32 30 Q38 32 38 42 L38 58 Z" fill="#44a0af" />
            <rect x="28" y="14" width="8" height="8" transform="rotate(45 32 18)" fill="#d19e34" />
            <rect x="8" y="58" width="48" height="4" fill="#443021" />
          </svg>
          <span className="hidden sm:inline">Quiet Arcade</span>
        </Link>

        <div className="hidden items-center gap-0.5 sm:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className="relative rounded-xl px-3 py-1.5 text-sm font-medium transition-colors"
            >
              {({ isActive }) => (
                <>
                  {/* the active room glides between links as one lit pill */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-xl bg-[var(--card-2)] shadow-[inset_0_0_0_1px_var(--line)]"
                      transition={{ duration: 0.45, ease: EASE }}
                    />
                  )}
                  <span
                    className={`relative ${
                      isActive
                        ? "text-gold-600 dark:text-gold-300"
                        : "qa-muted hover:text-[var(--ink)]"
                    }`}
                  >
                    {l.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        <button
          className="rounded-xl p-2 transition-colors hover:bg-[var(--card-2)] sm:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            {open ? <path d="M6 6 L18 18 M18 6 L6 18" /> : <path d="M4 7 H20 M4 12 H20 M4 17 H20" />}
          </svg>
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="mx-auto mt-2 max-w-6xl overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg)]/80 shadow-[0_12px_34px_-18px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_IN_OUT }}
          >
            <div className="flex flex-col gap-1 p-3">
              {links.map((l, i) => (
                <motion.div
                  key={l.to}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 + 0.05 * i, duration: 0.4, ease: EASE }}
                >
                  <NavLink
                    to={l.to}
                    end={l.to === "/"}
                    onClick={() => setOpen(false)}
                    className={() =>
                      `block rounded-xl px-3 py-2.5 font-medium transition-colors ${
                        location.pathname === l.to
                          ? "bg-[var(--card-2)] text-gold-600 dark:text-gold-300"
                          : "hover:bg-[var(--card-2)]"
                      }`
                    }
                  >
                    {l.label}
                  </NavLink>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
