import { useEffect, useRef, type ReactNode, type ButtonHTMLAttributes } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE } from "./motion";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-clay-500 text-sand-50 hover:bg-clay-600 shadow-[0_4px_0_0_#511f12] active:shadow-none active:translate-y-[3px]",
  secondary:
    "bg-[var(--card)] text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--card-2)] shadow-[0_3px_0_0_var(--line)] active:shadow-none active:translate-y-[2px]",
  ghost: "bg-transparent text-[var(--ink)] hover:bg-[var(--card-2)]",
  danger:
    "bg-clay-700 text-sand-50 hover:bg-clay-800 shadow-[0_4px_0_0_#33130b] active:shadow-none active:translate-y-[3px]",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0 ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Chip({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--card)] px-2.5 py-0.5 text-xs font-medium qa-muted ${className}`}
    >
      {children}
    </span>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <p className="font-semibold">{label}</p>
        {description && <p className="mt-0.5 text-sm qa-muted">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ${
          checked ? "bg-teal-600" : "bg-[var(--line)]"
        }`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className={`absolute top-1 h-5 w-5 rounded-full bg-sand-50 shadow ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

export function ConfirmModal({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            aria-label="Close dialog"
            className="absolute inset-0 bg-pine-950/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="qa-card relative w-full max-w-md rounded-2xl p-6 shadow-2xl"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <h2 className="font-display text-xl font-semibold">{title}</h2>
            <p className="mt-2 text-sm qa-muted">{body}</p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={onClose}>
                Keep everything
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
