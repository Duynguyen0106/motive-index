"use client";

import { useState } from "react";

export type ThemeMode = "dark" | "light";

const STORAGE_KEY = "motive-index-theme";

function applyTheme(mode: ThemeMode) {
  document.documentElement.setAttribute("data-theme", mode);
  localStorage.setItem(STORAGE_KEY, mode);
  window.dispatchEvent(new CustomEvent("motive-theme-change", { detail: mode }));
}

function readTheme(): ThemeMode {
  if (typeof document === "undefined") return "dark";
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "light" ? "light" : "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(() =>
    typeof document !== "undefined" ? readTheme() : "dark",
  );

  function toggle() {
    const next: ThemeMode = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      <span className="theme-toggle-icon" aria-hidden>
        {theme === "dark" ? "☀" : "◐"}
      </span>
      <span className="theme-toggle-label">{theme === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
}

export function getStoredTheme(): ThemeMode {
  try {
    const t = localStorage.getItem(STORAGE_KEY);
    return t === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}
