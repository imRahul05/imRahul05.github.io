import React, { useEffect, useState } from "react";

/**
 * Liquid Glass — real refraction for `backdrop-filter`.
 *
 * We render a displacement map for a rounded shape on a canvas: pixels near the
 * rim are pushed along the surface normal (a convex bezel bending light), and
 * an optional magnification pulls samples toward the centre (a lens). That map
 * drives an SVG `feDisplacementMap`, run three times at slightly different
 * strengths per colour channel for a hint of chromatic aberration.
 *
 * Chromium is the only engine that accepts `url(#filter)` in `backdrop-filter`
 * today, so everything else gets a clean blur fallback (see `useLiquidGlass`).
 */

interface MapOptions {
  width: number;
  height: number;
  radius: number;
  /** Width of the refracting rim, in px */
  bezel: number;
  /** 0 = flat pane, 0.3 = noticeable lens magnification */
  magnify: number;
}

const buildDisplacementMap = ({
  width,
  height,
  radius,
  bezel,
  magnify,
}: MapOptions): string => {
  const w = Math.max(2, Math.round(width));
  const h = Math.max(2, Math.round(height));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(w, h);
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(radius, cx, cy);
  const hx = cx - r;
  const hy = cy - r;

  // Signed distance to a rounded rectangle centred at origin
  const sdf = (x: number, y: number) => {
    const qx = Math.abs(x) - hx;
    const qy = Math.abs(y) - hy;
    const ox = Math.max(qx, 0);
    const oy = Math.max(qy, 0);
    return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
  };

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const x = px + 0.5 - cx;
      const y = py + 0.5 - cy;
      const d = sdf(x, y); // negative inside
      let dx = 0;
      let dy = 0;

      if (d < 0) {
        // Rim refraction: strongest at the edge, eases to 0 at `bezel` depth
        const depth = -d;
        if (depth < bezel) {
          const e = 0.5;
          const nx = sdf(x + e, y) - sdf(x - e, y);
          const ny = sdf(x, y + e) - sdf(x, y - e);
          const nl = Math.hypot(nx, ny) || 1;
          const t = 1 - depth / bezel;
          // Convex "squircle" profile → smooth bend that ramps up at the lip
          const k = t * t * (3 - 2 * t);
          // Sample inward (against the outward normal)
          dx -= (nx / nl) * k;
          dy -= (ny / nl) * k;
        }
        if (magnify > 0) {
          dx -= (x / cx) * magnify;
          dy -= (y / cy) * magnify;
        }
      }

      const i = (py * w + px) * 4;
      img.data[i] = Math.round(128 + Math.max(-1, Math.min(1, dx)) * 127);
      img.data[i + 1] = Math.round(128 + Math.max(-1, Math.min(1, dy)) * 127);
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL("image/png");
};

const CHANNELS: Array<{ key: "r" | "g" | "b"; matrix: string; k: number }> = [
  { key: "r", matrix: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0", k: 1 },
  { key: "g", matrix: "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0", k: 0.97 },
  { key: "b", matrix: "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0", k: 0.94 },
];

export const LiquidGlassFilter: React.FC<
  MapOptions & { id: string; strength: number; blur?: number }
> = ({ id, strength, blur = 0, ...map }) => {
  const [href, setHref] = useState("");
  const { width, height, radius, bezel, magnify } = map;

  useEffect(() => {
    if (width < 2 || height < 2) return;
    setHref(buildDisplacementMap({ width, height, radius, bezel, magnify }));
  }, [width, height, radius, bezel, magnify]);

  if (!href) return null;

  return (
    <svg
      aria-hidden="true"
      width="0"
      height="0"
      style={{ position: "absolute", pointerEvents: "none" }}
    >
      <defs>
        <filter
          id={id}
          x="0"
          y="0"
          width={width}
          height={height}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feImage
            href={href}
            x="0"
            y="0"
            width={width}
            height={height}
            preserveAspectRatio="none"
            result="map"
          />
          {/* Frost first, then bend — blur in CSS is dropped by some
              engines when chained after url(), so it lives here. */}
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation={blur}
            result="frost"
          />
          {CHANNELS.map(({ key, matrix, k }) => (
            <React.Fragment key={key}>
              <feDisplacementMap
                in="frost"
                in2="map"
                scale={strength * k}
                xChannelSelector="R"
                yChannelSelector="G"
                result={`d-${key}`}
              />
              <feColorMatrix
                in={`d-${key}`}
                type="matrix"
                values={matrix}
                result={`c-${key}`}
              />
            </React.Fragment>
          ))}
          <feBlend in="c-r" in2="c-g" mode="screen" result="rg" />
          <feBlend in="rg" in2="c-b" mode="screen" />
        </filter>
      </defs>
    </svg>
  );
};

/** Whether real refraction can run, and whether glass should be toned down. */
export const useLiquidGlass = () => {
  const [state, setState] = useState({ refract: false, reduced: false });
  useEffect(() => {
    const nav = navigator as Navigator & {
      userAgentData?: { brands?: Array<{ brand: string }> };
    };
    const chromium = !!nav.userAgentData?.brands?.some(
      (b) => b.brand === "Chromium",
    );
    const reducedTransparency = window.matchMedia(
      "(prefers-reduced-transparency: reduce)",
    ).matches;
    setState({
      refract: chromium && !reducedTransparency,
      reduced: reducedTransparency,
    });
  }, []);
  return state;
};
