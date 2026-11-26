import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  BELT,
  BELT_LENGTH,
  BELT_WIDTH,
  CENTER,
  PLATE,
  SAMPLE_CODES,
  STATIONS,
  beltPoint,
  type BoxSpec,
  type StationKind,
} from "./isoScene";

/**
 * "Claims Foundry" — an animated isometric diorama of an AI medical-coding &
 * claims pipeline, hand-rendered on a 2D canvas (no 3D library):
 * orbitable axonometric camera, painter's-algorithm depth sorting, per-face
 * shading from theme tokens, and machines that react as packets pass.
 */

type RGB = [number, number, number];
type P3 = [number, number, number]; // screen x, screen y, depth

const TAU = Math.PI * 2;
const ELEV = Math.PI / 6; // 30° — classic isometric-ish elevation
const SIN_E = Math.sin(ELEV);
const COS_E = Math.cos(ELEV);
const ISO_YAW = Math.PI / 4;
const SPEED = 1.5; // belt units / second
const SPAWN_EVERY = 1.45; // seconds
const PACKET = 0.5;
const GREEN: RGB = [63, 178, 127];
const RED: RGB = [235, 87, 87];

const parseColor = (value: string, fallback: RGB): RGB => {
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

const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

const rgba = (c: RGB, a = 1) =>
  `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${Math.max(0, Math.min(1, a)).toFixed(3)})`;

interface Packet {
  s: number;
  code: string;
  passed: number; // bitmask of stations already triggered
}

interface Drawable {
  depth: number;
  draw: () => void;
}

export const ClaimsFoundry: React.FC<{ className?: string }> = ({
  className,
}) => {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [active, setActive] = useState<StationKind>("intake");
  const [userPick, setUserPick] = useState<StationKind | null>(null);

  // Imperative bridges between React UI and the render loop
  const ctrl = useRef<{
    yawTarget: number;
    pick: StationKind | null;
    hover: StationKind | null;
    setActive: (k: StationKind) => void;
    redraw: () => void;
  }>({
    yawTarget: ISO_YAW,
    pick: null,
    hover: null,
    setActive: () => undefined,
    redraw: () => undefined,
  });

  useEffect(() => {
    ctrl.current.pick = userPick;
  }, [userPick]);

  useEffect(() => {
    ctrl.current.setActive = (k) =>
      setActive((prev) => (prev === k ? prev : k));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    /* ---------------- theme ---------------- */
    let fg: RGB = [10, 10, 10];
    let card: RGB = [255, 255, 255];
    let accent: RGB = [0, 107, 255];
    let isDark = false;
    const readTheme = () => {
      const cs = getComputedStyle(document.documentElement);
      fg = parseColor(cs.getPropertyValue("--foreground"), fg);
      card = parseColor(cs.getPropertyValue("--card"), card);
      accent = parseColor(cs.getPropertyValue("--accent"), accent);
      isDark = document.documentElement.classList.contains("dark");
    };

    /* ---------------- sizing ---------------- */
    let W = 0;
    let H = 0;
    let dpr = 1;
    let s = 20;
    let ox = 0;
    let oy = 0;
    const resize = () => {
      W = wrap.clientWidth;
      H = Math.round(Math.max(250, Math.min(400, W * 0.54)));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      // Rotation-invariant fit: use the plate's half-diagonal
      const r = Math.hypot(PLATE.w, PLATE.d) / 2;
      const topH = 3.6;
      const s1 = (W - 16) / (2 * r);
      const s2 = (H - 44) / (2 * r * SIN_E + topH * COS_E);
      s = Math.min(s1, s2);
      ox = W / 2;
      oy = H / 2 + (topH * COS_E * s) / 2 + 10;
    };

    /* ---------------- camera ---------------- */
    let yaw = ISO_YAW;
    let cosY = Math.cos(yaw);
    let sinY = Math.sin(yaw);

    const proj = (x: number, y: number, z: number): P3 => {
      const dx = x - CENTER[0];
      const dy = y - CENTER[1];
      const X = dx * cosY - dy * sinY;
      const Y = dx * sinY + dy * cosY;
      return [ox + X * s, oy + Y * s * SIN_E - z * s * COS_E, Y];
    };
    const depthOf = (x: number, y: number) =>
      (x - CENTER[0]) * sinY + (y - CENTER[1]) * cosY;

    /* ---------------- primitives ---------------- */
    const poly = (
      pts: P3[],
      fill: string | null,
      stroke: string | null,
      lw = 1,
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
        ctx.lineWidth = lw;
        ctx.strokeStyle = stroke;
        ctx.stroke();
      }
    };

    interface BoxStyle {
      base?: RGB;
      tint?: RGB;
      tintAmt?: number;
      stroke?: string;
      alpha?: number;
      lw?: number;
    }

    /** Draws a box's visible faces; returns the projected top face. */
    const box = (b: BoxSpec, st: BoxStyle = {}): P3[] => {
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
      const stroke = st.stroke ?? rgba(fg, isDark ? 0.55 : 0.6);
      const lw = st.lw ?? 1;
      // faces: [normalX, normalY, i, j]
      const faces: Array<[number, number, number, number]> = [
        [0, -1, 0, 1],
        [1, 0, 1, 2],
        [0, 1, 2, 3],
        [-1, 0, 3, 0],
      ];
      for (const [nx, ny, i, j] of faces) {
        const nY = nx * sinY + ny * cosY; // toward viewer if > 0
        if (nY <= 0.001) continue;
        const nX = nx * cosY - ny * sinY; // screen-left (<0) is lit
        const shade = nX < 0 ? (isDark ? 0.16 : 0.07) : isDark ? 0.3 : 0.17;
        poly(
          [bot[i], bot[j], top[j], top[i]],
          rgba(mix(base, isDark ? [0, 0, 0] : fg, shade), a),
          stroke,
          lw,
        );
      }
      poly(top, rgba(base, a), stroke, lw);
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
    ) => {
      const p = proj(x, y, z);
      ctx.font = `${weight} ${size}px "Geist Mono", ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.fillStyle = rgba(color, alpha);
      ctx.fillText(text, p[0], p[1]);
    };

    /* ---------------- simulation ---------------- */
    const packets: Packet[] = [];
    let spawnClock = 0;
    let codeIdx = 0;
    let processed = 128;
    const flash: Record<StationKind, number> = {
      intake: 0,
      parse: 0,
      coder: 0,
      rules: 0,
      submit: 0,
      payer: 0,
    };
    const lift: Record<StationKind, number> = { ...flash };
    let rulesLit = 0;

    // Pre-populate the belt so the first frame is already "running"
    for (let d = BELT_LENGTH - 0.6; d > 0; d -= SPEED * SPAWN_EVERY) {
      const p: Packet = {
        s: d,
        code: SAMPLE_CODES[codeIdx++ % SAMPLE_CODES.length],
        passed: 0,
      };
      STATIONS.forEach((st, i) => {
        if (d >= st.at) p.passed |= 1 << i;
      });
      packets.push(p);
    }

    const step = (dt: number) => {
      spawnClock += dt;
      if (spawnClock >= SPAWN_EVERY) {
        spawnClock -= SPAWN_EVERY;
        packets.push({
          s: 0,
          code: SAMPLE_CODES[codeIdx++ % SAMPLE_CODES.length],
          passed: 0,
        });
        flash.intake = 1;
      }
      for (let k = packets.length - 1; k >= 0; k--) {
        const p = packets[k];
        p.s += SPEED * dt;
        STATIONS.forEach((st, i) => {
          if (!(p.passed & (1 << i)) && p.s >= st.at) {
            p.passed |= 1 << i;
            flash[st.id] = 1;
            if (st.id === "rules") rulesLit = (rulesLit % 3) + 1;
          }
        });
        if (p.s >= BELT_LENGTH) {
          packets.splice(k, 1);
          processed++;
        }
      }
      for (const k of Object.keys(flash) as StationKind[]) {
        flash[k] = Math.max(0, flash[k] - dt * 1.6);
      }
    };

    /* ---------------- interaction ---------------- */
    let pointer: { x: number; y: number } | null = null;
    let dragging = false;
    let dragStartX = 0;
    let dragYaw = 0;
    let moved = false;
    let lastInteraction = -1e9;
    let stationRects: Array<{
      id: StationKind;
      r: [number, number, number, number];
      depth: number;
    }> = [];

    const hitTest = (x: number, y: number): StationKind | null => {
      let best: { id: StationKind; depth: number } | null = null;
      for (const sr of stationRects) {
        const [l, t, r, b] = sr.r;
        if (x >= l && x <= r && y >= t && y <= b) {
          if (!best || sr.depth > best.depth)
            best = { id: sr.id, depth: sr.depth };
        }
      }
      return best?.id ?? null;
    };

    const localXY = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      moved = false;
      dragStartX = e.clientX;
      dragYaw = ctrl.current.yawTarget;
      lastInteraction = performance.now();
    };
    const onPointerMove = (e: PointerEvent) => {
      pointer = localXY(e);
      if (dragging) {
        const dx = e.clientX - dragStartX;
        if (Math.abs(dx) > 4) {
          moved = true;
          canvas.setPointerCapture?.(e.pointerId);
        }
        if (moved) ctrl.current.yawTarget = dragYaw + dx * 0.012;
        lastInteraction = performance.now();
      }
      if (e.pointerType === "mouse")
        ctrl.current.hover = hitTest(pointer.x, pointer.y);
      if (reduce) requestDraw();
    };
    const onPointerUp = (e: PointerEvent) => {
      if (dragging && !moved) {
        const p = localXY(e);
        const hit = hitTest(p.x, p.y);
        // Tap a machine to pin it; tap empty floor to resume the auto-tour
        ctrl.current.pick = hit;
        setUserPick(hit);
      }
      dragging = false;
      if (canvas.hasPointerCapture?.(e.pointerId))
        canvas.releasePointerCapture(e.pointerId);
      if (reduce) requestDraw();
    };
    const onPointerLeave = () => {
      pointer = null;
      ctrl.current.hover = null;
    };

    /* ---------------- frame ---------------- */
    let t = 0;
    let tourIdx = 0;
    let tourClock = 0;

    const frame = (dt: number) => {
      if (!reduce) {
        t += dt;
        step(dt);
      }

      // Camera: ease toward target + gentle idle drift
      const idle = performance.now() - lastInteraction > 2500 && !dragging;
      const drift = reduce || !idle ? 0 : Math.sin(t * 0.25) * 0.09;
      const target = ctrl.current.yawTarget + drift;
      yaw = dragging || reduce ? target : yaw + (target - yaw) * 0.08;
      cosY = Math.cos(yaw);
      sinY = Math.sin(yaw);

      // Which station is "active"
      tourClock += dt;
      if (tourClock > 3.2) {
        tourClock = 0;
        tourIdx = (tourIdx + 1) % STATIONS.length;
      }
      const activeId: StationKind =
        ctrl.current.hover ?? ctrl.current.pick ?? STATIONS[tourIdx].id;
      ctrl.current.setActive(activeId);
      for (const st of STATIONS) {
        const goal = st.id === activeId ? 1 : 0;
        lift[st.id] += (goal - lift[st.id]) * (reduce ? 1 : 0.12);
      }

      /* ----- draw ----- */
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const lineSoft = rgba(fg, isDark ? 0.1 : 0.08);

      // Plate + grid
      box(PLATE, { base: mix(card, fg, isDark ? 0.04 : 0.02) });
      ctx.lineWidth = 1;
      ctx.strokeStyle = lineSoft;
      for (let gx = Math.ceil(PLATE.x); gx <= PLATE.x + PLATE.w; gx++) {
        const a = proj(gx, PLATE.y, 0);
        const b = proj(gx, PLATE.y + PLATE.d, 0);
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
      }
      for (let gy = Math.ceil(PLATE.y); gy <= PLATE.y + PLATE.d; gy++) {
        const a = proj(PLATE.x, gy, 0);
        const b = proj(PLATE.x + PLATE.w, gy, 0);
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
      }

      // Belt (ground layer)
      const hw = BELT_WIDTH / 2;
      for (let i = 0; i < BELT.length - 1; i++) {
        const [ax, ay] = BELT[i];
        const [bx, by] = BELT[i + 1];
        box(
          {
            x: Math.min(ax, bx) - hw,
            y: Math.min(ay, by) - hw,
            w: Math.abs(bx - ax) + BELT_WIDTH,
            d: Math.abs(by - ay) + BELT_WIDTH,
            z: 0,
            h: 0.12,
          },
          { base: mix(card, fg, isDark ? 0.12 : 0.08) },
        );
      }
      // Moving chevrons on the belt
      const pitch = 0.7;
      const offset = (t * SPEED) % pitch;
      ctx.strokeStyle = rgba(fg, isDark ? 0.32 : 0.28);
      ctx.lineWidth = 1;
      for (let d = offset; d < BELT_LENGTH; d += pitch) {
        const [px, py] = beltPoint(d);
        const [qx, qy] = beltPoint(d + 0.01);
        const len = Math.hypot(qx - px, qy - py) || 1;
        const nx = -(qy - py) / len;
        const ny = (qx - px) / len;
        const tx = (qx - px) / len;
        const ty = (qy - py) / len;
        const a = proj(
          px + nx * hw * 0.7 - tx * 0.12,
          py + ny * hw * 0.7 - ty * 0.12,
          0.12,
        );
        const m = proj(px + tx * 0.12, py + ty * 0.12, 0.12);
        const b = proj(
          px - nx * hw * 0.7 - tx * 0.12,
          py - ny * hw * 0.7 - ty * 0.12,
          0.12,
        );
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(m[0], m[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
      }

      // Collect depth-sorted drawables
      const drawables: Drawable[] = [];
      stationRects = [];

      for (const st of STATIONS) {
        const L = lift[st.id] * 0.3;
        const on = lift[st.id];
        const b = st.base;
        const lifted: BoxSpec = { ...b, z: (b.z ?? 0) + L };
        const cx = b.x + b.w / 2;
        const cy = b.y + b.d / 2;
        const stroke = rgba(
          mix(fg, accent, on),
          isDark ? 0.55 + on * 0.4 : 0.6 + on * 0.4,
        );
        const style: BoxStyle = {
          tint: accent,
          tintAmt: on * (isDark ? 0.18 : 0.1),
          stroke,
          lw: 1 + on * 0.4,
        };

        // Hit rect from projected corners
        const corners = [
          proj(b.x, b.y, 0),
          proj(b.x + b.w, b.y, 0),
          proj(b.x + b.w, b.y + b.d, 0),
          proj(b.x, b.y + b.d, 0),
          proj(b.x, b.y, b.h + L + 0.6),
          proj(b.x + b.w, b.y, b.h + L + 0.6),
          proj(b.x + b.w, b.y + b.d, b.h + L + 0.6),
          proj(b.x, b.y + b.d, b.h + L + 0.6),
        ];
        stationRects.push({
          id: st.id,
          r: [
            Math.min(...corners.map((c) => c[0])),
            Math.min(...corners.map((c) => c[1])),
            Math.max(...corners.map((c) => c[0])),
            Math.max(...corners.map((c) => c[1])),
          ],
          depth: depthOf(cx, cy),
        });

        drawables.push({
          depth: depthOf(cx, cy),
          draw: () => {
            // Lift shadow
            if (L > 0.01) {
              const sh = [
                proj(b.x, b.y, 0.01),
                proj(b.x + b.w, b.y, 0.01),
                proj(b.x + b.w, b.y + b.d, 0.01),
                proj(b.x, b.y + b.d, 0.01),
              ];
              poly(sh, rgba(accent, 0.18 * on), null);
            }
            const top = box(lifted, style);
            const zTop = (b.z ?? 0) + b.h + L;

            switch (st.id) {
              case "intake": {
                for (let i = 0; i < 3; i++) {
                  const bob = reduce ? 0 : Math.sin(t * 2 + i) * 0.03;
                  box(
                    {
                      x: b.x + 0.45 + i * 0.06,
                      y: b.y + 0.25 - i * 0.04,
                      z:
                        zTop +
                        i * 0.13 +
                        bob +
                        flash.intake * 0.08 * (i === 2 ? 1 : 0),
                      w: 1.3,
                      d: 0.85,
                      h: 0.07,
                    },
                    { base: card, stroke },
                  );
                }
                break;
              }
              case "parse": {
                // Screen / readout on top
                box(
                  {
                    x: b.x + 0.3,
                    y: b.y + 0.2,
                    z: zTop,
                    w: 0.9,
                    d: 0.6,
                    h: 0.35,
                  },
                  {
                    base: mix(card, accent, 0.25 + flash.parse * 0.4),
                    stroke,
                  },
                );
                break;
              }
              case "coder": {
                // Floating wireframe crystal (the model)
                const ocx = cx;
                const ocy = cy;
                const oz =
                  zTop + 0.95 + (reduce ? 0 : Math.sin(t * 1.6) * 0.12);
                const r = 0.55 + flash.coder * 0.12;
                const spin = t * 0.9;
                const verts: Array<[number, number, number]> = [
                  [r, 0, 0],
                  [-r, 0, 0],
                  [0, r, 0],
                  [0, -r, 0],
                  [0, 0, r * 1.25],
                  [0, 0, -r * 1.25],
                ].map(([x, y, z]) => [
                  ocx + x * Math.cos(spin) - y * Math.sin(spin),
                  ocy + x * Math.sin(spin) + y * Math.cos(spin),
                  oz + z,
                ]);
                const pv = verts.map(([x, y, z]) => proj(x, y, z));
                const c = proj(ocx, ocy, oz);
                const g = ctx.createRadialGradient(
                  c[0],
                  c[1],
                  0,
                  c[0],
                  c[1],
                  r * s * 2.4,
                );
                g.addColorStop(0, rgba(accent, 0.28 + flash.coder * 0.3));
                g.addColorStop(1, rgba(accent, 0));
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(c[0], c[1], r * s * 2.4, 0, TAU);
                ctx.fill();
                const edges = [
                  [0, 2],
                  [2, 1],
                  [1, 3],
                  [3, 0],
                  [4, 0],
                  [4, 1],
                  [4, 2],
                  [4, 3],
                  [5, 0],
                  [5, 1],
                  [5, 2],
                  [5, 3],
                ];
                // translucent faces for a crystal feel
                for (const [a2, b2] of [
                  [0, 2],
                  [2, 1],
                  [1, 3],
                  [3, 0],
                ]) {
                  poly([pv[4], pv[a2], pv[b2]], rgba(accent, 0.1), null);
                }
                ctx.lineWidth = 1.3;
                ctx.strokeStyle = rgba(accent, 0.95);
                for (const [a2, b2] of edges) {
                  ctx.beginPath();
                  ctx.moveTo(pv[a2][0], pv[a2][1]);
                  ctx.lineTo(pv[b2][0], pv[b2][1]);
                  ctx.stroke();
                }
                // Coding beam down to the belt
                if (flash.coder > 0.02) {
                  const [bx, by] = beltPoint(st.at);
                  const bot = proj(ocx, ocy, oz - r * 1.25);
                  const hit = proj(bx, by, 0.4);
                  ctx.strokeStyle = rgba(accent, flash.coder);
                  ctx.lineWidth = 2;
                  ctx.setLineDash([3, 3]);
                  ctx.beginPath();
                  ctx.moveTo(bot[0], bot[1]);
                  ctx.lineTo(hit[0], hit[1]);
                  ctx.stroke();
                  ctx.setLineDash([]);
                }
                // vents
                for (let i = 0; i < 3; i++) {
                  box(
                    {
                      x: b.x + 0.35 + i * 0.75,
                      y: b.y + 0.3,
                      z: zTop,
                      w: 0.5,
                      d: 0.95,
                      h: 0.06,
                    },
                    {
                      base: mix(card, fg, 0.15),
                      stroke,
                    },
                  );
                }
                break;
              }
              case "rules": {
                for (let i = 0; i < 3; i++) {
                  const lit = i < rulesLit;
                  const flip = reduce
                    ? 1
                    : Math.abs(
                        Math.cos(
                          Math.min(1, flash.rules * 2) *
                            Math.PI *
                            (i === rulesLit - 1 ? 1 : 0),
                        ),
                      );
                  box(
                    {
                      x: b.x + 0.25 + i * 0.62,
                      y: b.y + 0.35,
                      z: zTop,
                      w: 0.48,
                      d: 0.5 * Math.max(0.15, flip),
                      h: 0.08,
                    },
                    {
                      base: lit ? mix(card, GREEN, 0.75) : mix(card, fg, 0.1),
                      stroke,
                    },
                  );
                }
                break;
              }
              case "submit": {
                // LED strip along the top front edge
                for (let i = 0; i < 6; i++) {
                  const phase = (t * 3 - i * 0.5) % 3;
                  const lit =
                    flash.submit > 0.1 ? true : phase > 0 && phase < 0.6;
                  box(
                    {
                      x: b.x + 0.2 + i * 0.32,
                      y: b.y + b.d - 0.3,
                      z: zTop,
                      w: 0.18,
                      d: 0.18,
                      h: 0.14,
                    },
                    {
                      base: lit ? mix(card, accent, 0.85) : mix(card, fg, 0.12),
                      stroke,
                    },
                  );
                }
                break;
              }
              case "payer": {
                // Window grid on the top face area + antenna beacon
                const tz = zTop;
                const ant = proj(cx, cy, tz + 0.9);
                const antB = proj(cx, cy, tz);
                ctx.strokeStyle = stroke;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(antB[0], antB[1]);
                ctx.lineTo(ant[0], ant[1]);
                ctx.stroke();
                const blink = reduce ? 1 : (Math.sin(t * 4) + 1) / 2;
                ctx.fillStyle = rgba(RED, 0.4 + blink * 0.6);
                ctx.beginPath();
                ctx.arc(ant[0], ant[1], 2.6, 0, TAU);
                ctx.fill();
                // Floors: thin bands around the tower
                for (let f = 1; f < 5; f++) {
                  const zf = (b.z ?? 0) + L + (b.h * f) / 5;
                  const ring = [
                    proj(b.x, b.y + b.d, zf),
                    proj(b.x + b.w, b.y + b.d, zf),
                    proj(b.x + b.w, b.y, zf),
                  ];
                  ctx.strokeStyle = rgba(fg, 0.25);
                  ctx.beginPath();
                  ctx.moveTo(ring[0][0], ring[0][1]);
                  ctx.lineTo(ring[1][0], ring[1][1]);
                  ctx.lineTo(ring[2][0], ring[2][1]);
                  ctx.stroke();
                }
                if (flash.payer > 0.02) {
                  poly(top, rgba(GREEN, flash.payer * 0.5), null);
                }
                break;
              }
            }
          },
        });

        // Parse arm + laser over the belt: drawn above packets beneath it
        if (st.id === "parse") {
          const armX = b.x + 0.8;
          drawables.push({
            depth: depthOf(armX + 0.3, 2.2) + 0.7,
            draw: () => {
              box(
                { x: armX, y: b.y + 0.9, z: 1.25 + L, w: 0.6, d: 1.9, h: 0.22 },
                style,
              );
              const sweep = reduce ? 0 : Math.sin(t * 3) * 0.32;
              const ex = armX + 0.3 + sweep;
              const emit = proj(armX + 0.3, 2.2, 1.25 + L);
              const l1 = proj(ex, 2.2 - hw * 0.9, 0.13);
              const l2 = proj(ex, 2.2 + hw * 0.9, 0.13);
              poly(
                [emit, l1, l2],
                rgba(accent, 0.12 + flash.parse * 0.25),
                null,
              );
              ctx.strokeStyle = rgba(accent, 0.9);
              ctx.lineWidth = 1.6;
              ctx.beginPath();
              ctx.moveTo(l1[0], l1[1]);
              ctx.lineTo(l2[0], l2[1]);
              ctx.stroke();
            },
          });
        }
      }

      // Packets
      const parseAt = STATIONS[1].at;
      const coderAt = STATIONS[2].at;
      const rulesAt = STATIONS[3].at;
      for (const p of packets) {
        const [px, py] = beltPoint(p.s);
        drawables.push({
          depth: depthOf(px, py),
          draw: () => {
            const fade = Math.max(0, Math.min(1, (BELT_LENGTH - p.s) / 1.2));
            const appear = Math.min(1, p.s / 0.5);
            const a = fade * appear;
            let base = card;
            let stroke = rgba(fg, 0.65 * a);
            if (p.s >= rulesAt) {
              base = mix(card, GREEN, 0.7);
              stroke = rgba(mix(GREEN, fg, 0.3), a);
            } else if (p.s >= coderAt) {
              base = mix(card, accent, 0.75);
              stroke = rgba(mix(accent, fg, 0.25), a);
            } else if (p.s >= parseAt) {
              stroke = rgba(accent, a);
            }
            const half = PACKET / 2;
            const top = box(
              {
                x: px - half,
                y: py - half,
                z: 0.12,
                w: PACKET,
                d: PACKET,
                h: PACKET * 0.8,
              },
              { base, stroke, alpha: a },
            );
            if (p.s < coderAt) {
              // "document" lines on raw / parsed packets
              ctx.strokeStyle = rgba(p.s >= parseAt ? accent : fg, 0.45 * a);
              ctx.lineWidth = 1;
              for (let i = 1; i <= 2; i++) {
                const u = i / 3;
                const l = [
                  top[0][0] + (top[3][0] - top[0][0]) * u,
                  top[0][1] + (top[3][1] - top[0][1]) * u,
                ];
                const r2 = [
                  top[1][0] + (top[2][0] - top[1][0]) * u,
                  top[1][1] + (top[2][1] - top[1][1]) * u,
                ];
                ctx.beginPath();
                ctx.moveTo(
                  l[0] + (r2[0] - l[0]) * 0.2,
                  l[1] + (r2[1] - l[1]) * 0.2,
                );
                ctx.lineTo(
                  l[0] + (r2[0] - l[0]) * 0.8,
                  l[1] + (r2[1] - l[1]) * 0.8,
                );
                ctx.stroke();
              }
            } else if (W >= 420 && p.s < rulesAt - 0.6) {
              label(
                px,
                py,
                1.05,
                p.code,
                p.s >= rulesAt ? mix(GREEN, fg, 0.2) : accent,
                a,
                8.5,
                600,
              );
            }
          },
        });
      }

      drawables.sort((a, b) => a.depth - b.depth);
      for (const d of drawables) d.draw();

      // Station labels (always on top)
      const compact = W < 480;
      for (const st of STATIONS) {
        const on = lift[st.id];
        const b = st.base;
        const cx = b.x + b.w / 2;
        const cy = b.y + b.d / 2;
        const ztop =
          b.h +
          0.3 * on +
          (st.id === "coder" ? 2.3 : st.id === "payer" ? 1.3 : 0.9);
        const p0 = proj(
          cx,
          cy,
          b.h + 0.3 * on + (st.id === "coder" ? 1.75 : 0.15),
        );
        const p1 = proj(cx, cy, ztop);
        ctx.strokeStyle = rgba(on > 0.5 ? accent : fg, 0.35 + on * 0.5);
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(p0[0], p0[1]);
        ctx.lineTo(p1[0], p1[1] + 4);
        ctx.stroke();
        ctx.setLineDash([]);
        const text =
          compact && on < 0.5
            ? st.index
            : `${st.index} ${st.name.toUpperCase()}`;
        label(
          cx,
          cy,
          ztop,
          text,
          on > 0.5 ? accent : fg,
          0.6 + on * 0.4,
          compact ? 9 : 10,
          on > 0.5 ? 700 : 500,
        );
      }

      // HUD
      ctx.font = `500 ${compact ? 9 : 10}px "Geist Mono", ui-monospace, monospace`;
      ctx.textAlign = "left";
      ctx.fillStyle = rgba(fg, 0.55);
      ctx.fillText("FIG. 01 — CLAIMS FOUNDRY (CONCEPT)", 10, 16);
      ctx.fillText(`PROCESSED ${String(processed).padStart(5, "0")}`, 10, 30);
      ctx.textAlign = "right";
      const deg = ((((yaw * 180) / Math.PI) % 360) + 360) % 360;
      ctx.fillText(
        `AXO · θ ${deg.toFixed(0).padStart(3, "0")}° · φ 30°`,
        W - 10,
        H - 10,
      );
      ctx.textAlign = "left";
      ctx.fillStyle = rgba(fg, 0.4);
      ctx.fillText(
        window.matchMedia("(pointer: fine)").matches
          ? "DRAG TO ORBIT · HOVER A MACHINE"
          : "DRAG TO ORBIT · TAP A MACHINE",
        10,
        H - 10,
      );
    };

    /* ---------------- loop ---------------- */
    let raf: number | null = null;
    let last = performance.now();
    let visible = false;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      frame(dt);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (raf !== null || reduce) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    let pending = false;
    const requestDraw = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        frame(0);
      });
    };
    // Expose redraw for UI buttons in reduced-motion mode
    ctrl.current.redraw = requestDraw;

    readTheme();
    resize();
    requestDraw();

    const ro = new ResizeObserver(() => {
      resize();
      requestDraw();
    });
    ro.observe(wrap);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !document.hidden) start();
        else stop();
      },
      { rootMargin: "100px" },
    );
    io.observe(canvas);

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (visible) start();
    };
    const mo = new MutationObserver(() => {
      readTheme();
      requestDraw();
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
    document.fonts?.ready.then(requestDraw).catch(() => undefined);

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const rotate = (delta: number | "iso") => {
    const c = ctrl.current;
    if (delta === "iso") {
      // nearest isometric angle to where we are now
      const k = Math.round((c.yawTarget - ISO_YAW) / (Math.PI / 2));
      c.yawTarget = ISO_YAW + k * (Math.PI / 2);
    } else {
      c.yawTarget += delta;
    }
    c.redraw();
  };

  const station = STATIONS.find((s) => s.id === active) ?? STATIONS[0];

  return (
    <div className={cn("cad-card relative overflow-hidden", className)}>
      <div ref={wrapRef} className="relative w-full">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Animated isometric diagram of an AI medical-coding and claims pipeline: documents move on a conveyor through Intake, Parse, AI Coder, Rules, Submit and Payer stations."
          className="block w-full cursor-grab touch-pan-y active:cursor-grabbing"
        />
        {/* CAD view controls */}
        <div className="absolute top-2 right-2 flex gap-1">
          {[
            { label: "⟲", title: "Rotate view left 90°", v: -Math.PI / 2 },
            { label: "ISO", title: "Snap to isometric", v: "iso" as const },
            { label: "⟳", title: "Rotate view right 90°", v: Math.PI / 2 },
          ].map((b) => (
            <button
              key={b.label}
              type="button"
              title={b.title}
              aria-label={b.title}
              onClick={() => rotate(b.v)}
              className="cad-btn flex h-7 min-w-7 cursor-pointer items-center justify-center bg-card/80 px-1.5 font-mono text-[0.65rem] font-medium tracking-[0.06em] text-foreground backdrop-blur-sm"
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Station legend + caption */}
      <div className="border-t border-border px-4 py-3">
        <div
          className="mb-2.5 flex flex-wrap gap-1.5"
          role="tablist"
          aria-label="Pipeline stations"
        >
          {STATIONS.map((st) => (
            <button
              key={st.id}
              type="button"
              role="tab"
              aria-selected={active === st.id}
              onMouseEnter={() => {
                ctrl.current.hover = st.id;
              }}
              onMouseLeave={() => {
                ctrl.current.hover = null;
              }}
              onClick={() =>
                setUserPick((prev) => (prev === st.id ? null : st.id))
              }
              className={cn(
                "cad-chip cursor-pointer bg-card px-2 py-1 text-[0.66rem] tracking-[0.04em] text-secondary-foreground uppercase",
                active === st.id && "border-accent text-accent",
                userPick === st.id && "bg-accent/10",
              )}
            >
              <span className="mr-1 opacity-60">{st.index}</span>
              {st.name}
            </button>
          ))}
        </div>
        <p
          className="m-0 min-h-[2.6em] text-[0.85rem] leading-[1.55] text-secondary-foreground"
          aria-live="polite"
        >
          <span className="mr-1.5 font-mono text-[0.7rem] text-accent uppercase">
            {station.index} · {station.name}
          </span>
          {station.blurb}
        </p>
      </div>
    </div>
  );
};

export default ClaimsFoundry;
