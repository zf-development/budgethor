export const THEME_STORAGE_KEY = "theme";

/** Runs before paint so the saved theme is applied without a flash. */
export const THEME_INIT_SCRIPT = `(function(){
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}) || "light";
    var theme = stored === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : stored;
    var root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    if (theme === "dark" || theme === "light") root.style.colorScheme = theme;
  } catch (e) {}
})();`;
