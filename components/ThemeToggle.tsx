"use client";

import { useEffect, useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY, type ThemePreference } from "@/lib/constants";

const THEME_EVENT = "course-manager-theme-change";

function readPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY) as ThemePreference | null;
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    /* ignore */
  }
  return "system";
}

function applyTheme(pref: ThemePreference) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (pref === "light") root.classList.add("light");
  else if (pref === "dark") root.classList.add("dark");
}

function subscribe(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener("storage", handler);
  window.addEventListener(THEME_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(THEME_EVENT, handler);
  };
}

export function ThemeToggle() {
  const pref = useSyncExternalStore<ThemePreference>(
    subscribe,
    readPreference,
    () => "system",
  );

  useEffect(() => {
    applyTheme(pref);
  }, [pref]);

  const setPreference = (next: ThemePreference) => {
    try {
      if (next === "system") localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    applyTheme(next);
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  return (
    <div
      className="inline-flex rounded-lg border border-border bg-card p-0.5 text-sm"
      role="group"
      aria-label="Theme"
    >
      {(
        [
          ["system", "System"],
          ["light", "Light"],
          ["dark", "Dark"],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => setPreference(value)}
          className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
            pref === value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
