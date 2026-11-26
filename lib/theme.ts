/**
 * Calls `cb` only when the colour theme actually changes. Watching <html>
 * attributes directly also fired on unrelated class toggles (scroll-reveal,
 * theme-switch freezes…), and each call re-read computed styles.
 */
export const onThemeChange = (cb: () => void): (() => void) => {
  const root = document.documentElement;
  const key = () =>
    `${root.getAttribute("data-theme")}|${root.classList.contains("dark")}`;
  let last = key();
  const mo = new MutationObserver(() => {
    const next = key();
    if (next === last) return;
    last = next;
    cb();
  });
  mo.observe(root, {
    attributes: true,
    attributeFilter: ["class", "data-theme"],
  });
  return () => mo.disconnect();
};
