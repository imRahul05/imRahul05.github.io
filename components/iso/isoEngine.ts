/**
 * Tiny isometric (axonometric) canvas engine shared by the blog dioramas:
 * orbitable camera, shaded boxes, polygons and mono labels.
 * Units are scene cells; z is height. Elevation is fixed at 30°.
 */

export type RGB = [number, number, number];
export type P3 = [number, number, number]; // screen x, screen y, depth

export interface BoxSpec {
  x: number;
  y: number;
  z?: number;
  w: number;
  d: number;
  h: number;
}

export interface BoxStyle {
  base?: RGB;
  tint?: RGB;
  tintAmt?: number;
  stroke?: string | null;
  alpha?: number;
  lw?: number;
  /** Skip the top face (open box, e.g. glass walls) */
  noTop?: boolean;
  /** Draw only faces pointing away from the viewer (inside of a box) */
  inside?: boolean;
}

const ELEV = Math.PI / 6;
export const SIN_E = Math.sin(ELEV);
export const COS_E = Math.cos(ELEV);

export const parseColor = (value: string, fallback: RGB): RGB => {
  const v = value.trim();
  if (/^#([0-9a-f]{6})$/i.test(v)) {
    return [
      parseInt(v.slice(1, 3), 16),
      parseInt(v.slice(3, 5), 16),
      parseInt(v.slice(5, 7), 16),
    ];
  }
  const m = v.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const [r, g, b] = m[1].split(",").map((n) => parseFloat(n));
    return [r, g, b];
  }
  return fallback;
};

export const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

export const rgba = (c: RGB, a = 1) =>
  `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${Math.max(0, Math.min(1, a)).toFixed(3)})`;

export interface Theme {
  fg: RGB;
  card: RGB;
  accent: RGB;
  isDark: boolean;
}

export const readTheme = (prev?: Theme): Theme => {
  const cs = getComputedStyle(document.documentElement);
  return {
    fg: parseColor(
      cs.getPropertyValue("--foreground"),
      prev?.fg ?? [10, 10, 10],
    ),
    card: parseColor(
      cs.getPropertyValue("--card"),
      prev?.card ?? [255, 255, 255],
    ),
    accent: parseColor(
      cs.getPropertyValue("--accent"),
      prev?.accent ?? [0, 107, 255],
    ),
    isDark: document.documentElement.classList.contains("dark"),
  };
};

export const createIso = (ctx: CanvasRenderingContext2D) => {
  const cam = { cx: 0, cy: 0, ox: 0, oy: 0, s: 20, cosY: 1, sinY: 0 };
  let theme: Theme = {
    fg: [10, 10, 10],
    card: [255, 255, 255],
    accent: [0, 107, 255],
    isDark: false,
  };

  const setTheme = (t: Theme) => {
    theme = t;
  };

  const setYaw = (yaw: number) => {
    cam.cosY = Math.cos(yaw);
    cam.sinY = Math.sin(yaw);
  };

  const proj = (x: number, y: number, z: number): P3 => {
    const dx = x - cam.cx;
    const dy = y - cam.cy;
    const X = dx * cam.cosY - dy * cam.sinY;
    const Y = dx * cam.sinY + dy * cam.cosY;
    return [
      cam.ox + X * cam.s,
      cam.oy + Y * cam.s * SIN_E - z * cam.s * COS_E,
      Y,
    ];
  };

  const depthOf = (x: number, y: number) =>
    (x - cam.cx) * cam.sinY + (y - cam.cy) * cam.cosY;

  const poly = (
    pts: P3[],
    fill: string | null,
    stroke: string | null,
    lw = 1,
    dash?: number[],
  ) => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.setLineDash(dash ?? []);
      ctx.lineWidth = lw;
      ctx.strokeStyle = stroke;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  const line = (a: P3, b: P3, stroke: string, lw = 1, dash?: number[]) => {
    ctx.setLineDash(dash ?? []);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  /** Draws a box's visible faces; returns the projected top face. */
  const box = (b: BoxSpec, st: BoxStyle = {}): P3[] => {
    const { fg, card, isDark } = theme;
    const z = b.z ?? 0;
    const x0 = b.x;
    const x1 = b.x + b.w;
    const y0 = b.y;
    const y1 = b.y + b.d;
    const bot = [
      proj(x0, y0, z),
      proj(x1, y0, z),
      proj(x1, y1, z),
      proj(x0, y1, z),
    ];
    const top = [
      proj(x0, y0, z + b.h),
      proj(x1, y0, z + b.h),
      proj(x1, y1, z + b.h),
      proj(x0, y1, z + b.h),
    ];
    const a = st.alpha ?? 1;
    let base = st.base ?? card;
    if (st.tint) base = mix(base, st.tint, st.tintAmt ?? 0.3);
    const stroke =
      st.stroke === undefined
        ? rgba(fg, (isDark ? 0.55 : 0.6) * Math.min(1, a * 1.2))
        : st.stroke;
    const lw = st.lw ?? 1;
    const faces: Array<[number, number, number, number]> = [
      [0, -1, 0, 1],
      [1, 0, 1, 2],
      [0, 1, 2, 3],
      [-1, 0, 3, 0],
    ];
    for (const [nx, ny, i, j] of faces) {
      const nY = nx * cam.sinY + ny * cam.cosY;
      const visible = st.inside ? nY < -0.001 : nY > 0.001;
      if (!visible) continue;
      const nX = nx * cam.cosY - ny * cam.sinY;
      const shade = nX < 0 ? (isDark ? 0.16 : 0.07) : isDark ? 0.3 : 0.17;
      poly(
        [bot[i], bot[j], top[j], top[i]],
        rgba(mix(base, isDark ? [0, 0, 0] : fg, shade), a),
        stroke,
        lw,
      );
    }
    if (!st.noTop) poly(top, rgba(base, a), stroke, lw);
    return top;
  };

  const label = (
    x: number,
    y: number,
    z: number,
    text: string,
    color: RGB,
    alpha: number,
    size = 10,
    weight = 500,
    align: CanvasTextAlign = "center",
  ) => {
    const p = proj(x, y, z);
    ctx.font = `${weight} ${size}px "Geist Mono", ui-monospace, monospace`;
    ctx.textAlign = align;
    ctx.fillStyle = rgba(color, alpha);
    ctx.fillText(text, p[0], p[1]);
  };

  /**
   * Fit a scene into W×H regardless of yaw: uses the scene's bounding radius
   * on the ground plane plus its tallest height.
   */
  const fit = (
    W: number,
    H: number,
    bounds: { x0: number; y0: number; x1: number; y1: number; top: number },
    pad = { x: 16, y: 40 },
  ) => {
    cam.cx = (bounds.x0 + bounds.x1) / 2;
    cam.cy = (bounds.y0 + bounds.y1) / 2;
    const r = Math.hypot(bounds.x1 - bounds.x0, bounds.y1 - bounds.y0) / 2;
    const s1 = (W - pad.x) / (2 * r);
    const s2 = (H - pad.y) / (2 * r * SIN_E + bounds.top * COS_E);
    cam.s = Math.min(s1, s2);
    cam.ox = W / 2;
    cam.oy = H / 2 + (bounds.top * COS_E * cam.s) / 2 + 8;
  };

  return {
    cam,
    setTheme,
    get theme() {
      return theme;
    },
    setYaw,
    proj,
    depthOf,
    poly,
    line,
    box,
    label,
    fit,
  };
};

export type Iso = ReturnType<typeof createIso>;
