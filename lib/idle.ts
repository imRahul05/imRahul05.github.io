/**
 * Scheduling helpers for non-critical work, so it never competes with the
 * first paint or the user's first interactions.
 */

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

/** Run `cb` when the browser is idle (falls back to a timeout in Safari). */
export const onIdle = (cb: () => void, timeout = 2000): (() => void) => {
  const w = window as IdleWindow;
  if (w.requestIdleCallback) {
    const id = w.requestIdleCallback(cb, { timeout });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(cb, Math.min(timeout, 300));
  return () => window.clearTimeout(id);
};

/**
 * Run `cb` once the page has fully loaded *and* the main thread is idle.
 * Use for third-party scripts, analytics, prefetching and decorative extras.
 */
export const afterLoadIdle = (
  cb: () => void,
  { delay = 0, timeout = 3000 }: { delay?: number; timeout?: number } = {},
): (() => void) => {
  let cancelIdle: (() => void) | null = null;
  let timer: number | null = null;
  let done = false;

  const schedule = () => {
    timer = window.setTimeout(() => {
      cancelIdle = onIdle(() => {
        if (done) return;
        done = true;
        cb();
      }, timeout);
    }, delay);
  };

  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });

  return () => {
    done = true;
    window.removeEventListener("load", schedule);
    if (timer !== null) window.clearTimeout(timer);
    cancelIdle?.();
  };
};
