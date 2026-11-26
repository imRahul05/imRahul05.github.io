/**
 * Tiny shared, mutable state between the Orrery canvas and the DOM HUD.
 * Written every frame by the canvas loop, read on a slow interval by the HUD,
 * so no React re-renders happen per frame.
 */
export const orreryState = {
  yaw: 0,
  pitch: 0,
  fps: 60,
  focused: null as string | null,
};

export const ORRERY_FOCUS_EVENT = "orrery:focus";

/** Highlight a body in the background orrery (pass null to clear). */
export const focusOrreryBody = (name: string | null) => {
  window.dispatchEvent(
    new CustomEvent<string | null>(ORRERY_FOCUS_EVENT, { detail: name }),
  );
};
