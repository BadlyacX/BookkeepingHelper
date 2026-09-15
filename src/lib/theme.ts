export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

export function getStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");

  // Keep the mobile browser chrome / PWA status bar color in sync too.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#0f172a" : "#4f46e5");

  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Private browsing / storage disabled — theme just won't persist.
  }
}

/**
 * Inline script source, run from a blocking <script> in the root
 * layout so the correct theme class is set before first paint —
 * avoids a flash of the wrong theme on load. Defaults to light
 * (this app doesn't follow prefers-color-scheme, only the explicit
 * toggle) when nothing is stored yet.
 */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    if (localStorage.getItem('${STORAGE_KEY}') === 'dark') {
      document.documentElement.classList.add('dark');
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', '#0f172a');
    }
  } catch (e) {}
})();
`;
