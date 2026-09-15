"use client";

import { useEffect, useState } from "react";
import { applyTheme, type Theme } from "@/lib/theme";

export function ThemeToggle() {
  // Always starts as "light" so the very first client render matches
  // the statically-built HTML (avoids a hydration mismatch on this
  // component's markup). The blocking init script in layout.tsx has
  // already set the real theme on <html> before hydration though, so
  // this effect just syncs local state from that external DOM state
  // — a legitimate use of setState-in-effect, not a workaround.
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "切換成亮色模式" : "切換成暗色模式"}
      className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full transition-colors duration-300 ${
        isDark ? "bg-indigo-900" : "bg-sky-200"
      }`}
    >
      <span className="absolute left-1.5 text-xs">☀️</span>
      <span className="absolute right-1.5 text-xs">🌙</span>
      <span
        className={`relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] shadow transition-transform duration-300 ${
          isDark ? "translate-x-8" : "translate-x-1"
        }`}
      >
        {isDark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
