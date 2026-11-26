import React, { useEffect, useRef } from "react";
import { DATA } from "../../data/data";
import { ORRERY_FOCUS_EVENT, orreryState } from "./orreryState";

/**
 * "Blueprint Orrery" — a hand-rolled 3D wireframe solar system rendered on a
 * 2D canvas (no WebGL / no extra deps). Every skill is a body on an orbit,
 * annotated like a CAD drawing. The camera drifts on its own, follows the
 * pointer, and dollies with scroll. Hovering a skill chip highlights its body.
 *
 * Perf: DPR capped, rAF paused when hidden, a single static frame when the
 * user prefers reduced motion.
 */

type Vec3 = [number, number, number];
type Vec4 = [number, number, number, number];
type RGB = [number, number, number];

interface Body {
  name: string;
  orbit: number; // world radius
  phase: number;
  speed: number;
  size: number;
  ringed: boolean;
  tilt: number;
}

const TAU = Math.PI * 2;

const parseColor = (value: string, fallback: RGB): RGB => {
  const v = value.trim();
  if (/^#([0-9a-f]{3}){1,2}$/i.test(v)) {
    const hex =
      v.length === 4
        ? v
            .slice(1)
            .split("")
            .map((c) => c + c)
            .join("")
        : v.slice(1);
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }
  const m = v.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const [r, g, b] = m[1].split(",").map((n) => parseFloat(n));
    return [r, g, b];
  }
  return fallback;
};

const rgba = (c: RGB, a: number) =>
  `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a)).toFixed(3)})`;

// Deterministic PRNG so the star field is stable between renders
const mulberry32 = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const buildIcosahedron = () => {
  const p = (1 + Math.sqrt(5)) / 2;
  const verts: Vec3[] = [
    [-1, p, 0],
    [1, p, 0],
    [-1, -p, 0],
    [1, -p, 0],
    [0, -1, p],
    [0, 1, p],
    [0, -1, -p],
    [0, 1, -p],
    [p, 0, -1],
    [p, 0, 1],
    [-p, 0, -1],
    [-p, 0, 1],
  ];
  const len = Math.hypot(1, p);
  const norm = verts.map(([x, y, z]) => [x / len, y / len, z / len] as Vec3);
  const edges: Array<[number, number]> = [];
  for (let i = 0; i < verts.length; i++) {
    for (let j = i + 1; j < verts.length; j++) {
      const d = Math.hypot(
        verts[i][0] - verts[j][0],
        verts[i][1] - verts[j][1],
        verts[i][2] - verts[j][2],
      );
      if (Math.abs(d - 2) < 0.01) edges.push([i, j]);
    }
  }
  return { verts: norm, edges };
};

const buildBodies = (): Body[] => {
  const skills = DATA.skills;
  const orbitCount = Math.ceil(skills.length / 2);
  return skills.map((name, i) => {
    const ring = Math.floor(i / 2);
    const orbit = 0.62 + (ring / Math.max(1, orbitCount - 1)) * 0.98;
    return {
      name,
      orbit,
      phase: (i % 2) * Math.PI + ring * 1.17,
      // Kepler-ish: outer bodies move slower
      speed: 0.11 / Math.pow(orbit + 0.25, 1.5),
      size: 0.018 + ((i * 7) % 5) * 0.004,
      ringed: i % 5 === 2,
      tilt: ((i * 37) % 30) / 100,
    };
  });
};

export const OrreryCanvas: React.FC<{ className?: string }> = ({
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const ico = buildIcosahedron();
    const bodies = buildBodies();

    // Star field on a large shell
    const rand = mulberry32(1337);
    const stars: Vec3[] = [];
    const starCount = window.innerWidth < 640 ? 120 : 260;
    for (let i = 0; i < starCount; i++) {
      const u = rand() * 2 - 1;
      const th = rand() * TAU;
      const r = 2.2 + rand() * 2.4;
      const s = Math.sqrt(1 - u * u);
      stars.push([r * s * Math.cos(th), r * u, r * s * Math.sin(th)]);
    }

    let width = 0;
    let height = 0;
    let dpr = 1;
    let fg: RGB = [10, 10, 10];
    let bg: RGB = [248, 248, 248];
    let accent: RGB = [0, 107, 255];
    let isDark = false;

    const readTheme = () => {
      const cs = getComputedStyle(document.documentElement);
      fg = parseColor(cs.getPropertyValue("--foreground"), fg);
      bg = parseColor(cs.getPropertyValue("--background"), bg);
      accent = parseColor(cs.getPropertyValue("--accent"), accent);
      isDark = document.documentElement.classList.contains("dark");
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, width < 768 ? 1.5 : 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    // Pointer (smoothed) and focus target
    let pointerX = 0;
    let pointerY = 0;
    let smoothX = 0;
    let smoothY = 0;
    let focused: string | null = null;
    let focusGlow = 0;

    const onPointer = (e: PointerEvent) => {
      pointerX = (e.clientX / Math.max(1, width)) * 2 - 1;
      pointerY = (e.clientY / Math.max(1, height)) * 2 - 1;
      if (reduceMotion) requestDraw();
    };

    const onFocus = (e: Event) => {
      const detail = (e as CustomEvent<string | null>).detail;
      focused = detail;
      orreryState.focused = detail;
      if (reduceMotion) requestDraw();
    };

    // Camera
    let yaw = 0;
    // "Frame selection": extra yaw that swings a focused body into view
    let yawBias = 0;
    let pitch = 0;
    let camDist = 3.1;
    let F = 1;
    let cx = 0;
    let cy = 0;
    let cosY = 1;
    let sinY = 0;
    let cosP = 1;
    let sinP = 0;

    const setCamera = (t: number) => {
      const doc = document.documentElement;
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));

      smoothX += (pointerX - smoothX) * 0.04;
      smoothY += (pointerY - smoothY) * 0.04;

      const baseYaw = t * 0.035 + smoothX * 0.22 + progress * 1.6;
      const target = focused ? bodies.find((b) => b.name === focused) : null;
      if (target) {
        // Screen-x of a body ∝ cos(angle + yaw): park it at 0 or π
        // (far left / right of the reading column), whichever is nearer.
        const angle = target.phase + t * target.speed;
        const current = baseYaw + yawBias;
        const k = Math.round((current + angle) / Math.PI);
        const desired = k * Math.PI - angle;
        yawBias += (desired - baseYaw - yawBias) * (reduceMotion ? 1 : 0.06);
      }
      yaw = baseYaw + yawBias;
      // Look down onto the ecliptic; scroll flattens the view slightly
      pitch = 0.98 - smoothY * 0.1 - progress * 0.42;
      camDist = 3.1 - progress * 0.45;

      cosY = Math.cos(yaw);
      sinY = Math.sin(yaw);
      cosP = Math.cos(pitch);
      sinP = Math.sin(pitch);

      cx = width / 2;
      cy = height * (width < 768 ? 0.42 : 0.5);
      // Inner orbit clears the reading column; outer one bleeds off-screen
      F =
        width < 768
          ? Math.max(width * 1.7, height * 0.9)
          : Math.max(width * 1.32, height * 1.4);

      orreryState.yaw = yaw;
      orreryState.pitch = pitch;
    };

    // Projects world → screen; returns [sx, sy, depth, scale]
    const project = (x: number, y: number, z: number): Vec4 => {
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;
      const y2 = y * cosP + z1 * sinP;
      const z2 = -y * sinP + z1 * cosP;
      const zc = Math.max(0.2, z2 + camDist);
      const s = F / zc;
      return [cx + x1 * s, cy - y2 * s, zc, s];
    };

    const depthAlpha = (z: number) =>
      Math.max(0.25, Math.min(1, 1.35 - (z - camDist) * 0.55));

    const drawRing = (
      r: number,
      color: (z: number) => string,
      dash: number[] | null,
      segments = 160,
      lineWidth = 1,
    ) => {
      ctx.lineWidth = lineWidth;
      ctx.setLineDash(dash ?? []);
      // Split into 4 arcs so near/far halves can differ in alpha
      const chunk = segments / 8;
      for (let c = 0; c < 8; c++) {
        ctx.beginPath();
        let zSum = 0;
        for (let i = 0; i <= chunk; i++) {
          const a = ((c * chunk + i) / segments) * TAU;
          const p = project(Math.cos(a) * r, 0, Math.sin(a) * r);
          zSum += p[2];
          if (i === 0) ctx.moveTo(p[0], p[1]);
          else ctx.lineTo(p[0], p[1]);
        }
        ctx.strokeStyle = color(zSum / (chunk + 1));
        ctx.stroke();
      }
      ctx.setLineDash([]);
    };

    const monoFont = (px: number, weight = 500) =>
      `${weight} ${px}px "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace`;

    let last = performance.now();
    let frames = 0;
    let fpsClock = last;
    let start = last;
    let rafId: number | null = null;

    const draw = (now: number) => {
      const t = reduceMotion ? 18 : (now - start) / 1000;
      setCamera(t);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const lineA = isDark ? 1 : 1.35;
      const mobile = width < 768;

      // ---- Stars -------------------------------------------------------
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const p = project(s[0], s[1], s[2]);
        if (p[0] < -4 || p[0] > width + 4 || p[1] < -4 || p[1] > height + 4)
          continue;
        const tw = reduceMotion ? 0.7 : 0.55 + 0.45 * Math.sin(t * 1.3 + i);
        ctx.fillStyle = rgba(fg, (isDark ? 0.6 : 0.4) * tw);
        const size = i % 17 === 0 ? 1.6 : 1;
        ctx.fillRect(p[0], p[1], size, size);
      }

      // ---- Protractor / ecliptic grid ---------------------------------
      const outer = bodies[bodies.length - 1].orbit + 0.22;
      // Radial spokes every 15°
      for (let k = 0; k < 24; k++) {
        const a = (k / 24) * TAU;
        const inner = project(Math.cos(a) * 0.16, 0, Math.sin(a) * 0.16);
        const out = project(Math.cos(a) * outer, 0, Math.sin(a) * outer);
        ctx.beginPath();
        ctx.moveTo(inner[0], inner[1]);
        ctx.lineTo(out[0], out[1]);
        ctx.strokeStyle = rgba(fg, (k % 6 === 0 ? 0.09 : 0.04) * lineA);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // Outer degree scale with ticks + labels
      drawRing(outer, (z) => rgba(fg, 0.16 * depthAlpha(z) * lineA), null);
      for (let deg = 0; deg < 360; deg += 5) {
        const a = (deg / 360) * TAU;
        const major = deg % 30 === 0;
        const len = major ? 0.07 : 0.03;
        const p1 = project(Math.cos(a) * outer, 0, Math.sin(a) * outer);
        const p2 = project(
          Math.cos(a) * (outer + len),
          0,
          Math.sin(a) * (outer + len),
        );
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.strokeStyle = rgba(fg, (major ? 0.3 : 0.14) * depthAlpha(p1[2]));
        ctx.stroke();
        if (major && !mobile) {
          const pl = project(
            Math.cos(a) * (outer + 0.14),
            0,
            Math.sin(a) * (outer + 0.14),
          );
          ctx.font = monoFont(9);
          ctx.fillStyle = rgba(fg, 0.34 * depthAlpha(pl[2]));
          ctx.textAlign = "center";
          ctx.fillText(`${deg}°`, pl[0], pl[1] + 3);
        }
      }

      // ---- Orbits ------------------------------------------------------
      const orbitsDrawn = new Set<number>();
      bodies.forEach((b, i) => {
        if (orbitsDrawn.has(b.orbit)) return;
        orbitsDrawn.add(b.orbit);
        drawRing(
          b.orbit,
          (z) => rgba(fg, 0.15 * depthAlpha(z) * lineA),
          i % 4 === 2 ? [3, 5] : null,
        );
      });

      // ---- Collect bodies with positions for depth sorting -------------
      type Drawable = {
        z: number;
        render: () => void;
      };
      const drawables: Drawable[] = [];

      // Sun: wireframe icosahedron + glow
      const sunR = 0.14;
      const spin = t * 0.25;
      const cs = Math.cos(spin);
      const sn = Math.sin(spin);
      const sunCenter = project(0, 0, 0);
      drawables.push({
        z: sunCenter[2],
        render: () => {
          const glowR = sunR * sunCenter[3] * 3.2;
          const g = ctx.createRadialGradient(
            sunCenter[0],
            sunCenter[1],
            0,
            sunCenter[0],
            sunCenter[1],
            glowR,
          );
          g.addColorStop(0, rgba(accent, isDark ? 0.32 : 0.2));
          g.addColorStop(1, rgba(accent, 0));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(sunCenter[0], sunCenter[1], glowR, 0, TAU);
          ctx.fill();

          const pts = ico.verts.map(([x, y, z]) => {
            // own spin (around y then x) before camera
            const x1 = x * cs - z * sn;
            const z1 = x * sn + z * cs;
            const y1 = y * Math.cos(spin * 0.6) - z1 * Math.sin(spin * 0.6);
            const z2 = y * Math.sin(spin * 0.6) + z1 * Math.cos(spin * 0.6);
            return project(x1 * sunR, y1 * sunR, z2 * sunR);
          });
          ctx.lineWidth = 1.1;
          for (const [a, b] of ico.edges) {
            const zA = (pts[a][2] + pts[b][2]) / 2;
            const front = zA < sunCenter[2];
            ctx.beginPath();
            ctx.moveTo(pts[a][0], pts[a][1]);
            ctx.lineTo(pts[b][0], pts[b][1]);
            ctx.strokeStyle = rgba(accent, front ? 0.95 : 0.3);
            ctx.stroke();
          }
          for (const p of pts) {
            ctx.fillStyle = rgba(accent, 0.9);
            ctx.fillRect(p[0] - 1.5, p[1] - 1.5, 3, 3);
          }
          // Vertical axis of the sun
          const top = project(0, sunR * 1.9, 0);
          const bot = project(0, -sunR * 1.9, 0);
          ctx.setLineDash([2, 3]);
          ctx.strokeStyle = rgba(accent, 0.55);
          ctx.beginPath();
          ctx.moveTo(top[0], top[1]);
          ctx.lineTo(bot[0], bot[1]);
          ctx.stroke();
          ctx.setLineDash([]);
        },
      });

      // Planets
      focusGlow += ((focused ? 1 : 0) - focusGlow) * 0.12;

      bodies.forEach((b) => {
        const a = b.phase + t * b.speed;
        const x = Math.cos(a) * b.orbit;
        const z = Math.sin(a) * b.orbit;
        const p = project(x, 0, z);
        const isFocused = focused === b.name;
        const dim = focused && !isFocused ? 1 - focusGlow * 0.6 : 1;

        drawables.push({
          z: p[2],
          render: () => {
            const da = depthAlpha(p[2]) * dim;

            // Comet-like trail along the orbit
            const trailSeg = 18;
            for (let k = 0; k < trailSeg; k++) {
              const a1 = a - (k / trailSeg) * 0.75;
              const a2 = a - ((k + 1) / trailSeg) * 0.75;
              const q1 = project(
                Math.cos(a1) * b.orbit,
                0,
                Math.sin(a1) * b.orbit,
              );
              const q2 = project(
                Math.cos(a2) * b.orbit,
                0,
                Math.sin(a2) * b.orbit,
              );
              ctx.beginPath();
              ctx.moveTo(q1[0], q1[1]);
              ctx.lineTo(q2[0], q2[1]);
              ctx.strokeStyle = rgba(
                isFocused ? accent : fg,
                (1 - k / trailSeg) * (isFocused ? 0.9 : 0.42) * da,
              );
              ctx.lineWidth = isFocused ? 2 : 1.4;
              ctx.stroke();
            }

            // Drop line to the ecliptic & body
            const r = Math.max(2.5, b.size * p[3]);
            ctx.fillStyle = rgba(bg, 1);
            ctx.beginPath();
            ctx.arc(p[0], p[1], r, 0, TAU);
            ctx.fill();
            ctx.lineWidth = isFocused ? 1.6 : 1.1;
            ctx.strokeStyle = rgba(isFocused ? accent : fg, 0.85 * da);
            ctx.stroke();
            // Equator ellipse for a wireframe-sphere feel
            ctx.beginPath();
            ctx.ellipse(p[0], p[1], r, r * Math.abs(cosP) * 0.45, 0, 0, TAU);
            ctx.strokeStyle = rgba(isFocused ? accent : fg, 0.4 * da);
            ctx.lineWidth = 0.8;
            ctx.stroke();

            if (b.ringed) {
              ctx.beginPath();
              ctx.ellipse(
                p[0],
                p[1],
                r * 2.1,
                r * 2.1 * Math.abs(cosP) * 0.55,
                -0.3 + b.tilt,
                0,
                TAU,
              );
              ctx.strokeStyle = rgba(isFocused ? accent : fg, 0.55 * da);
              ctx.lineWidth = 1;
              ctx.stroke();
            }

            // Focus reticle
            if (isFocused) {
              const rr = r + 7 + Math.sin(t * 4) * 1.5;
              const arm = 5;
              ctx.strokeStyle = rgba(accent, focusGlow);
              ctx.lineWidth = 1.4;
              for (const [sx, sy] of [
                [-1, -1],
                [1, -1],
                [1, 1],
                [-1, 1],
              ]) {
                ctx.beginPath();
                ctx.moveTo(p[0] + sx * rr, p[1] + sy * (rr - arm));
                ctx.lineTo(p[0] + sx * rr, p[1] + sy * rr);
                ctx.lineTo(p[0] + sx * (rr - arm), p[1] + sy * rr);
                ctx.stroke();
              }
            }

            // CAD-style leader annotation
            if (!mobile || isFocused) {
              const dir = p[0] >= cx ? 1 : -1;
              const lx = p[0] + dir * (r + 14);
              const ly = p[1] - (r + 14);
              const shelf = 10;
              ctx.beginPath();
              ctx.moveTo(p[0] + dir * r * 0.7, p[1] - r * 0.7);
              ctx.lineTo(lx, ly);
              ctx.lineTo(lx + dir * shelf, ly);
              ctx.strokeStyle = rgba(isFocused ? accent : fg, 0.45 * da);
              ctx.lineWidth = 1;
              ctx.stroke();

              ctx.textAlign = dir > 0 ? "left" : "right";
              ctx.font = monoFont(isFocused ? 11 : 10, isFocused ? 600 : 500);
              ctx.fillStyle = rgba(
                isFocused ? accent : fg,
                (isFocused ? 1 : 0.62) * da,
              );
              ctx.fillText(
                b.name.toUpperCase(),
                lx + dir * (shelf + 4),
                ly + 3,
              );
              ctx.font = monoFont(8.5, 400);
              ctx.fillStyle = rgba(fg, 0.36 * da);
              const deg = ((((a * 180) / Math.PI) % 360) + 360) % 360;
              ctx.fillText(
                `r ${b.orbit.toFixed(2)} · θ ${deg.toFixed(0).padStart(3, "0")}°`,
                lx + dir * (shelf + 4),
                ly + 14,
              );
            }
          },
        });
      });

      drawables.sort((a, b) => b.z - a.z);
      for (const d of drawables) d.render();

      // ---- View gizmo (bottom-left) -----------------------------------
      if (!mobile) {
        const gx = 56;
        const gy = height - 64;
        const L = 26;
        const axes: Array<{ v: Vec3; label: string; color: RGB }> = [
          { v: [1, 0, 0], label: "X", color: [235, 87, 87] },
          { v: [0, 1, 0], label: "Y", color: [76, 190, 110] },
          { v: [0, 0, 1], label: "Z", color: accent },
        ];
        ctx.beginPath();
        ctx.arc(gx, gy, L + 10, 0, TAU);
        ctx.fillStyle = rgba(bg, 0.6);
        ctx.fill();
        ctx.strokeStyle = rgba(fg, 0.15);
        ctx.lineWidth = 1;
        ctx.stroke();
        const proj = axes
          .map((ax) => {
            const [x, y, z] = ax.v;
            const x1 = x * cosY - z * sinY;
            const z1 = x * sinY + z * cosY;
            const y2 = y * cosP + z1 * sinP;
            const z2 = -y * sinP + z1 * cosP;
            return { ...ax, sx: gx + x1 * L, sy: gy - y2 * L, z: z2 };
          })
          .sort((a, b) => b.z - a.z);
        for (const ax of proj) {
          ctx.beginPath();
          ctx.moveTo(gx, gy);
          ctx.lineTo(ax.sx, ax.sy);
          ctx.strokeStyle = rgba(ax.color, 0.9);
          ctx.lineWidth = 1.6;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(ax.sx, ax.sy, 6.5, 0, TAU);
          ctx.fillStyle = rgba(ax.color, 0.95);
          ctx.fill();
          ctx.font = monoFont(8, 700);
          ctx.textAlign = "center";
          ctx.fillStyle = "#fff";
          ctx.fillText(ax.label, ax.sx, ax.sy + 3);
        }
      }

      // FPS
      frames++;
      if (now - fpsClock > 500) {
        orreryState.fps = Math.round((frames * 1000) / (now - fpsClock));
        frames = 0;
        fpsClock = now;
      }
      last = now;
    };

    const loop = (now: number) => {
      draw(now);
      rafId = requestAnimationFrame(loop);
    };

    let pending = false;
    const requestDraw = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame((now) => {
        pending = false;
        // In reduced-motion mode, snap the smoothed pointer immediately
        smoothX = pointerX;
        smoothY = pointerY;
        draw(now);
      });
    };

    readTheme();
    resize();

    const onResize = () => {
      resize();
      if (reduceMotion) requestDraw();
    };
    const onScroll = () => {
      if (reduceMotion) requestDraw();
    };

    const themeObserver = new MutationObserver(() => {
      readTheme();
      if (reduceMotion) requestDraw();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    const onVisibility = () => {
      if (reduceMotion) return;
      if (document.hidden) {
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = null;
      } else if (rafId === null) {
        // Avoid a time jump after returning to the tab
        const gap = performance.now() - last;
        start += gap;
        rafId = requestAnimationFrame(loop);
      }
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener(ORRERY_FOCUS_EVENT, onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    // Fonts can land after first paint — redraw labels once they do
    document.fonts?.ready.then(() => requestDraw()).catch(() => undefined);

    if (reduceMotion) requestDraw();
    else rafId = requestAnimationFrame(loop);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      themeObserver.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener(ORRERY_FOCUS_EVENT, onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      data-testid="orrery-canvas"
    />
  );
};

export default OrreryCanvas;
