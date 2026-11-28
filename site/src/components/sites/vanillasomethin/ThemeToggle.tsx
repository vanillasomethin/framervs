"use client";

import { useSyncExternalStore } from "react";
import { MOON_PATH, SUN_PATH } from "./icons";

type Theme = "light" | "dark";

// The theme lives on <html data-theme>, set before paint by the layout script.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function getTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

/**
 * Source behaviour: "light" = maroon tokens (shows Sun), "dark" = cream tokens (shows Moon).
 * Choice persists in localStorage "theme". Icon 20px, grows to 24px on hover.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore<Theme>(subscribe, getTheme, () => "light");

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to maroon theme" : "Switch to cream theme"}
      className={`group flex h-10 w-10 items-center justify-center text-vs-fg ${className ?? ""}`}
    >
      <svg
        viewBox="0 0 256 256"
        fill="currentColor"
        aria-hidden="true"
        className="h-5 w-5 transition-[width,height] duration-300 ease-out group-hover:h-6 group-hover:w-6"
      >
        <path d={theme === "dark" ? MOON_PATH : SUN_PATH} />
      </svg>
    </button>
  );
}
