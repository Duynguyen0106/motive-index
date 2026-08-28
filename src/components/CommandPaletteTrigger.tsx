"use client";

type Props = {
  className?: string;
  label?: string;
  /** Shown on screen readers when label is icon-only */
  ariaLabel?: string;
};

export function CommandPaletteTrigger({
  className = "command-palette-trigger btn btn-ghost text-sm",
  label = "Jump…",
  ariaLabel = "Open command palette",
}: Props) {
  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      onClick={() => window.dispatchEvent(new Event("command-palette:open"))}
    >
      {label}
    </button>
  );
}
