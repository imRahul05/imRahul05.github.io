import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  createIso,
  mix,
  readTheme,
  rgba,
  type BoxSpec,
  type RGB,
} from "./isoEngine";

/**
 * "Inside the browser" — isometric explainer for the Shortlist blog post.
 * One 8s loop: scan the job page → skills fly into the deterministic
 * matcher → weight bars grow → score counts up. A packet that tries to reach
 * a server bounces off the browser's glass wall; Gemini Nano is an optional,
 * on-device side channel. Drag to orbit.
 */

const LOOP = 8;
const ISO_YAW = Math.PI / 4;
const TAU = Math.PI * 2;
const GREEN: RGB = [63, 178, 127];
const RED: RGB = [235, 87, 87];
const SCORE = 82;

// Scene layout (cells)
const PLATE: BoxSpec = { x: 0, y: 0, z: -0.3, w: 12.4, d: 8.4, h: 0.3 };
const WALL_H = 1.5;
const JOB: BoxSpec = { x: 0.7, y: 0.7, w: 3.9, d: 3.1, h: 0.18 };
const RESUME: BoxSpec = { x: 0.7, y: 4.7, w: 3.9, d: 2.9, h: 0.18 };
const MATCH_PAD: BoxSpec = { x: 5.7, y: 2.7, w: 3.0, d: 2.4, h: 0.14 };
const SCORE_CARD: BoxSpec = { x: 9.3, y: 2.3, w: 2.4, d: 2.6, h: 0.12 };
const VAULT: BoxSpec = { x: 9.5, y: 6.0, w: 2.0, d: 1.6, h: 0.9 };
const NANO: BoxSpec = { x: 6.2, y: 6.1, w: 1.5, d: 1.3, h: 0.22 };
const SERVER: BoxSpec = { x: 14.2, y: -1.8, w: 2.0, d: 2.4, h: 1.9 };

const WEIGHTS = [
  { label: "SKILLS", w: 55 },
  { label: "EXP", w: 15 },
  { label: "KEYWORDS", w: 15 },
  { label: "TITLE", w: 10 },
  { label: "EDU", w: 5 },
];
// Share of each weight this example resume earns (for bar fill)
const EARNED = [0.86, 0.9, 0.7, 0.8, 1];

const JOB_CHIPS = ["React", "TypeScript", "Node.js", "Kafka"];
const RESUME_HAS = [true, true, true, false];

const ease = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));
const seg = (t: number, a: number, b: number) => ease((t - a) / (b - a));

export const ShortlistIso: React.FC<{ className?: string }> = ({
  className,
}) => {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const iso = createIso(ctx);
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let W = 0;
    let H = 0;
    let dpr = 1;
    const resize = () => {
      W = wrap.clientWidth;
      H = Math.round(Math.max(240, Math.min(400, W * 0.56)));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      iso.fit(W, H, { x0: -0.2, y0: -2.0, x1: 16.4, y1: 8.6, top: 3.6 });
    };

    let yawTarget = ISO_YAW;
    let yaw = ISO_YAW;
    let dragging = false;
    let dragX = 0;
    let dragYaw = 0;
    let lastInteraction = -1e9;

    const frame = (time: number) => {
      const { fg, card, accent, isDark } = iso.theme;
      const t = reduce ? 6.2 : time % LOOP;
      const idle = performance.now() - lastInteraction > 2500 && !dragging;
      const drift = reduce || !idle ? 0 : Math.sin(time * 0.22) * 0.1;
      yaw =
        dragging || reduce
          ? yawTarget + drift
          : yaw + (yawTarget + drift - yaw) * 0.08;
      iso.setYaw(yaw);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const compact = W < 460;
      const fade = 1 - seg(t, 7.4, 8); // reset at loop end
      // Station name tags, drawn last so objects never cover them
      const tags: Array<[number, number, string]> = [];

      /* ---- server (outside the browser) ---- */
      const drawServer = () => {
        iso.box(SERVER, {
          base: card,
          alpha: 0.25,
          stroke: rgba(fg, 0.45),
          lw: 1,
        });
        // dashed outline emphasis + red X on top
        const z = SERVER.h;
        const a = iso.proj(SERVER.x + 0.4, SERVER.y + 0.4, z);
        const b = iso.proj(
          SERVER.x + SERVER.w - 0.4,
          SERVER.y + SERVER.d - 0.4,
          z,
        );
        const c = iso.proj(SERVER.x + SERVER.w - 0.4, SERVER.y + 0.4, z);
        const d = iso.proj(SERVER.x + 0.4, SERVER.y + SERVER.d - 0.4, z);
        iso.line(a, b, rgba(RED, 0.85), 2);
        iso.line(c, d, rgba(RED, 0.85), 2);
        iso.label(
          SERVER.x + SERVER.w / 2,
          SERVER.y + SERVER.d / 2,
          SERVER.h + 0.9,
          compact ? "NO SERVER" : "NO SERVER · 0 REQUESTS",
          RED,
          0.9,
          compact ? 8.5 : 10,
          600,
        );
      };

      /* ---- plate + inner (back) glass walls ---- */
      const glassStroke = rgba(accent, 0.55);
      const glass: BoxSpec = {
        x: PLATE.x,
        y: PLATE.y,
        z: 0,
        w: PLATE.w,
        d: PLATE.d,
        h: WALL_H,
      };

      // Server sits outside: draw it before or after the browser by depth
      const serverBehind =
        iso.depthOf(SERVER.x + 1, SERVER.y + 1.3) < iso.depthOf(PLATE.w, 4.2);
      if (serverBehind) drawServer();

      iso.box(PLATE, { base: mix(card, fg, isDark ? 0.05 : 0.03) });
      // grid
      ctx.lineWidth = 1;
      for (let gx = 1; gx < PLATE.w; gx++)
        iso.line(
          iso.proj(gx, 0, 0),
          iso.proj(gx, PLATE.d, 0),
          rgba(fg, isDark ? 0.08 : 0.06),
        );
      for (let gy = 1; gy < PLATE.d; gy++)
        iso.line(
          iso.proj(0, gy, 0),
          iso.proj(PLATE.w, gy, 0),
          rgba(fg, isDark ? 0.08 : 0.06),
        );
      iso.box(glass, {
        inside: true,
        noTop: true,
        base: card,
        alpha: 0,
        stroke: glassStroke,
      });
      // tint the inside walls
      iso.box(glass, {
        inside: true,
        noTop: true,
        base: accent,
        alpha: isDark ? 0.05 : 0.035,
        stroke: null,
      });

      /* ---- job page slab + scan ---- */
      const scanP = seg(t, 0.2, 2.1);
      iso.box(JOB, {});
      const jTop = JOB.h;
      // text lines
      for (let i = 0; i < 4; i++) {
        const yy = JOB.y + 0.45 + i * 0.32;
        iso.line(
          iso.proj(JOB.x + 0.35, yy, jTop),
          iso.proj(JOB.x + 0.35 + (i % 2 ? 2.2 : 3.0), yy, jTop),
          rgba(fg, 0.25),
          2,
        );
      }
      const chipPos = (i: number): [number, number] => [
        JOB.x + 0.35 + (i % 2) * 1.75,
        JOB.y + 1.85 + Math.floor(i / 2) * 0.55,
      ];
      const scanX = JOB.x + scanP * JOB.w;
      JOB_CHIPS.forEach((name, i) => {
        const [cx, cy] = chipPos(i);
        const lit = scanX > cx + 0.6 && t < 7.4;
        const flying = seg(t, 2.2 + i * 0.12, 3.4 + i * 0.12);
        iso.box(
          { x: cx, y: cy, z: jTop, w: 1.5, d: 0.4, h: 0.07 },
          {
            base: lit
              ? mix(card, accent, 0.55 * (1 - flying * 0.6))
              : mix(card, fg, 0.06),
            stroke: rgba(lit ? accent : fg, lit ? 0.9 : 0.4),
          },
        );
      });
      if (scanP > 0 && scanP < 1) {
        // translucent scan plane
        const pts = [
          iso.proj(scanX, JOB.y, jTop),
          iso.proj(scanX, JOB.y + JOB.d, jTop),
          iso.proj(scanX, JOB.y + JOB.d, jTop + 0.9),
          iso.proj(scanX, JOB.y, jTop + 0.9),
        ];
        iso.poly(pts, rgba(accent, 0.16), null);
        iso.line(pts[0], pts[1], rgba(accent, 0.95), 2);
      }
      tags.push([JOB.x + JOB.w / 2, JOB.y + JOB.d + 0.5, "JOB PAGE · DOM"]);

      /* ---- resume slab ---- */
      iso.box(RESUME, {});
      const rTop = RESUME.h;
      for (let i = 0; i < 3; i++) {
        const yy = RESUME.y + 0.45 + i * 0.32;
        iso.line(
          iso.proj(RESUME.x + 0.35, yy, rTop),
          iso.proj(RESUME.x + 0.35 + (i % 2 ? 2.4 : 3.0), yy, rTop),
          rgba(fg, 0.25),
          2,
        );
      }
      const resPos = (i: number): [number, number] => [
        RESUME.x + 0.35 + (i % 2) * 1.75,
        RESUME.y + 1.55 + Math.floor(i / 2) * 0.55,
      ];
      const checked = seg(t, 3.5, 4.2);
      JOB_CHIPS.forEach((name, i) => {
        const [cx, cy] = resPos(i);
        const has = RESUME_HAS[i];
        const col = checked > 0.5 && fade > 0.5 ? (has ? GREEN : RED) : fg;
        iso.box(
          { x: cx, y: cy, z: rTop, w: 1.5, d: 0.4, h: 0.07 },
          {
            base: col === fg ? mix(card, fg, 0.06) : mix(card, col, 0.5),
            stroke: rgba(col, col === fg ? 0.4 : 0.9),
          },
        );
      });
      tags.push([
        RESUME.x + RESUME.w / 2,
        RESUME.y + RESUME.d + 0.5,
        "YOUR RESUME · LOCAL",
      ]);

      /* ---- depth-sorted objects ---- */
      const items: Array<{ d: number; draw: () => void }> = [];

      // Matcher: pad + 5 weight bars
      items.push({
        d: iso.depthOf(
          MATCH_PAD.x + MATCH_PAD.w / 2,
          MATCH_PAD.y + MATCH_PAD.d / 2,
        ),
        draw: () => {
          iso.box(MATCH_PAD, { tint: accent, tintAmt: 0.06 });
          const grow = seg(t, 3.6, 5.2) * fade;
          WEIGHTS.forEach((wt, i) => {
            const bx = MATCH_PAD.x + 0.25 + i * 0.55;
            const by = MATCH_PAD.y + 0.9;
            const maxH = 0.25 + (wt.w / 55) * 2.1;
            // ghost (full weight) + earned fill
            iso.box(
              { x: bx, y: by, z: MATCH_PAD.h, w: 0.38, d: 0.6, h: maxH },
              { base: card, alpha: 0.15, stroke: rgba(fg, 0.25) },
            );
            const hh = Math.max(0.02, maxH * EARNED[i] * grow);
            iso.box(
              { x: bx, y: by, z: MATCH_PAD.h, w: 0.38, d: 0.6, h: hh },
              {
                base: mix(card, accent, 0.7),
                stroke: rgba(mix(accent, fg, 0.25), 0.9),
              },
            );
            if (!compact && grow > 0.95)
              iso.label(
                bx + 0.19,
                by + 0.3,
                MATCH_PAD.h + maxH + 0.25,
                `${wt.w}`,
                accent,
                0.9,
                8,
                600,
              );
          });
          iso.label(
            MATCH_PAD.x + MATCH_PAD.w / 2,
            MATCH_PAD.y + 0.2,
            MATCH_PAD.h + 3.1,
            compact ? "MATCHER" : "MATCHER · DETERMINISTIC",
            accent,
            0.95,
            compact ? 8.5 : 10,
            700,
          );
        },
      });

      // Score card floating
      const bob = reduce ? 0 : Math.sin(time * 1.4) * 0.08;
      const scoreZ = 1.25 + bob;
      items.push({
        d: iso.depthOf(
          SCORE_CARD.x + SCORE_CARD.w / 2,
          SCORE_CARD.y + SCORE_CARD.d / 2,
        ),
        draw: () => {
          // shadow
          iso.poly(
            [
              iso.proj(SCORE_CARD.x, SCORE_CARD.y, 0.01),
              iso.proj(SCORE_CARD.x + SCORE_CARD.w, SCORE_CARD.y, 0.01),
              iso.proj(
                SCORE_CARD.x + SCORE_CARD.w,
                SCORE_CARD.y + SCORE_CARD.d,
                0.01,
              ),
              iso.proj(SCORE_CARD.x, SCORE_CARD.y + SCORE_CARD.d, 0.01),
            ],
            rgba(fg, isDark ? 0.25 : 0.08),
            null,
          );
          const prog = seg(t, 3.8, 5.4) * fade;
          iso.box(
            { ...SCORE_CARD, z: scoreZ },
            {
              tint: GREEN,
              tintAmt: 0.12 * prog,
              stroke: rgba(mix(fg, GREEN, prog), 0.8),
            },
          );
          // ring as a projected circle on the card's top face
          const ccx = SCORE_CARD.x + SCORE_CARD.w / 2;
          const ccy = SCORE_CARD.y + SCORE_CARD.d / 2;
          const R = 0.85;
          const ring = (
            from: number,
            to: number,
            color: string,
            lw: number,
          ) => {
            ctx.beginPath();
            for (let k = 0; k <= 48; k++) {
              const a = from + ((to - from) * k) / 48;
              const p = iso.proj(
                ccx + Math.cos(a) * R,
                ccy + Math.sin(a) * R,
                scoreZ + SCORE_CARD.h,
              );
              if (k === 0) ctx.moveTo(p[0], p[1]);
              else ctx.lineTo(p[0], p[1]);
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = lw;
            ctx.stroke();
          };
          ring(0, TAU, rgba(fg, 0.15), 3);
          if (prog > 0)
            ring(
              -Math.PI / 2,
              -Math.PI / 2 + TAU * (SCORE / 100) * prog,
              rgba(GREEN, 0.95),
              3.5,
            );
          const n = Math.round(SCORE * prog);
          const c = iso.proj(ccx, ccy, scoreZ + SCORE_CARD.h);
          ctx.font = `700 ${compact ? 13 : 17}px "Geist Mono", ui-monospace, monospace`;
          ctx.textAlign = "center";
          ctx.fillStyle = rgba(prog > 0.02 ? GREEN : fg, 0.95);
          ctx.fillText(`${n}%`, c[0], c[1] + 5);
          iso.label(
            ccx,
            SCORE_CARD.y + 0.1,
            scoreZ + 1.2,
            "MATCH SCORE",
            fg,
            0.7,
            compact ? 8 : 9.5,
            600,
          );
        },
      });

      // Vault: chrome.storage.local
      items.push({
        d: iso.depthOf(VAULT.x + VAULT.w / 2, VAULT.y + VAULT.d / 2),
        draw: () => {
          iso.box(VAULT, { base: mix(card, fg, 0.06) });
          // keyhole on top
          const k = iso.proj(
            VAULT.x + VAULT.w / 2,
            VAULT.y + VAULT.d / 2,
            VAULT.h,
          );
          ctx.fillStyle = rgba(fg, 0.6);
          ctx.beginPath();
          ctx.arc(k[0], k[1] - 2, 3, 0, TAU);
          ctx.fill();
          ctx.fillRect(k[0] - 1.2, k[1] - 1, 2.4, 6);
          tags.push([
            VAULT.x + VAULT.w / 2,
            VAULT.y + VAULT.d + 0.5,
            compact ? "STORAGE" : "chrome.storage.local",
          ]);
        },
      });

      // Gemini Nano chip (optional, on-device)
      const nanoPulse = seg(t, 5.5, 6.0) * (1 - seg(t, 7.0, 7.4));
      items.push({
        d: iso.depthOf(NANO.x + NANO.w / 2, NANO.y + NANO.d / 2),
        draw: () => {
          iso.box(NANO, {
            base: mix(card, fg, isDark ? 0.22 : 0.7),
            stroke: rgba(fg, 0.7),
          });
          for (let i = 0; i < 4; i++) {
            const px = NANO.x + 0.2 + i * 0.32;
            iso.box(
              { x: px, y: NANO.y - 0.18, w: 0.12, d: 0.18, h: 0.06 },
              { base: mix(card, fg, 0.3) },
            );
            iso.box(
              { x: px, y: NANO.y + NANO.d, w: 0.12, d: 0.18, h: 0.06 },
              { base: mix(card, fg, 0.3) },
            );
          }
          const glow = iso.proj(
            NANO.x + NANO.w / 2,
            NANO.y + NANO.d / 2,
            NANO.h,
          );
          if (nanoPulse > 0) {
            const g = ctx.createRadialGradient(
              glow[0],
              glow[1],
              0,
              glow[0],
              glow[1],
              26,
            );
            g.addColorStop(0, rgba(accent, 0.45 * nanoPulse));
            g.addColorStop(1, rgba(accent, 0));
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(glow[0], glow[1], 26, 0, TAU);
            ctx.fill();
          }
          tags.push([
            NANO.x + NANO.w / 2,
            NANO.y + NANO.d + 0.95,
            compact ? "NANO (OPT.)" : "GEMINI NANO · OPTIONAL",
          ]);
        },
      });

      items.sort((a, b) => a.d - b.d);
      for (const it of items) it.draw();

      /* ---- flying skill chips (job + resume → matcher) ---- */
      const mx = MATCH_PAD.x + MATCH_PAD.w / 2;
      const my = MATCH_PAD.y + MATCH_PAD.d / 2;
      const fly = (from: [number, number], start: number, color: RGB) => {
        const p = seg(t, start, start + 1.1);
        if (p <= 0 || p >= 1) return;
        const x = from[0] + 0.75 + (mx - from[0] - 0.75) * p;
        const y = from[1] + 0.2 + (my - from[1] - 0.2) * p;
        const z = 0.3 + Math.sin(p * Math.PI) * 1.6;
        iso.box(
          { x: x - 0.17, y: y - 0.17, z, w: 0.34, d: 0.34, h: 0.28 },
          {
            base: mix(card, color, 0.7),
            stroke: rgba(color, 0.95),
          },
        );
      };
      JOB_CHIPS.forEach((_, i) => fly(chipPos(i), 2.2 + i * 0.12, accent));
      JOB_CHIPS.forEach((_, i) => fly(resPos(i), 2.5 + i * 0.12, GREEN));

      // Score → matcher link
      if (seg(t, 3.8, 4.2) > 0 && fade > 0.2) {
        iso.line(
          iso.proj(MATCH_PAD.x + MATCH_PAD.w, my, 0.6),
          iso.proj(SCORE_CARD.x, SCORE_CARD.y + SCORE_CARD.d / 2, scoreZ),
          rgba(accent, 0.6 * fade),
          1.2,
          [4, 4],
        );
      }
      // Nano → score (optional insights)
      if (nanoPulse > 0) {
        iso.line(
          iso.proj(NANO.x + NANO.w, NANO.y + NANO.d / 2, NANO.h),
          iso.proj(
            SCORE_CARD.x + SCORE_CARD.w / 2,
            SCORE_CARD.y + SCORE_CARD.d,
            scoreZ,
          ),
          rgba(accent, 0.8 * nanoPulse),
          1.4,
          [3, 4],
        );
      }

      /* ---- the packet that tries to leave ---- */
      const out = seg(t, 4.4, 5.2);
      const back = seg(t, 5.2, 6.0);
      if (out > 0 && back < 1) {
        const wallX = PLATE.w;
        const sx = mx + 1.5;
        const x =
          back > 0
            ? wallX - 0.2 - (wallX - 0.2 - sx) * back
            : sx + (wallX - 0.2 - sx) * out;
        const y = 0.45;
        const z = 0.9;
        const a = 1 - back * 0.9;
        iso.box(
          { x: x - 0.17, y: y - 0.17, z, w: 0.34, d: 0.34, h: 0.28 },
          {
            base: mix(card, accent, 0.6),
            stroke: rgba(accent, a),
            alpha: a,
          },
        );
        if (out >= 1 && back < 0.6) {
          // impact flash on the wall
          const hit = iso.proj(wallX, y, z + 0.15);
          ctx.strokeStyle = rgba(RED, 1 - back / 0.6);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(hit[0], hit[1], 6 + back * 22, 0, TAU);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(hit[0] - 5, hit[1] + 5);
          ctx.lineTo(hit[0] + 5, hit[1] - 5);
          ctx.stroke();
        }
      }

      /* ---- front glass walls (outer faces) ---- */
      iso.box(glass, {
        noTop: true,
        base: accent,
        alpha: isDark ? 0.05 : 0.035,
        stroke: glassStroke,
      });
      iso.label(
        0.2,
        PLATE.d - 0.1,
        WALL_H + 0.25,
        compact ? "BROWSER" : "CHROME · YOUR DEVICE",
        accent,
        0.9,
        compact ? 8.5 : 10,
        700,
        "left",
      );

      if (!serverBehind) drawServer();

      /* ---- station tags (floor labels on pills) ---- */
      ctx.font = `600 ${compact ? 8 : 9.5}px "Geist Mono", ui-monospace, monospace`;
      ctx.textAlign = "center";
      for (const [tx, ty, text] of tags) {
        const p = iso.proj(tx, ty, 0);
        const w = ctx.measureText(text).width + 10;
        const h = compact ? 13 : 15;
        ctx.fillStyle = rgba(card, 0.92);
        ctx.strokeStyle = rgba(fg, 0.25);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(p[0] - w / 2, p[1] - h / 2, w, h);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = rgba(fg, 0.85);
        ctx.fillText(text, p[0], p[1] + (compact ? 3 : 3.5));
      }

      /* ---- HUD ---- */
      ctx.font = `500 ${compact ? 9 : 10}px "Geist Mono", ui-monospace, monospace`;
      ctx.textAlign = "left";
      ctx.fillStyle = rgba(fg, 0.55);
      ctx.fillText("FIG. 01 — INSIDE THE BROWSER", 10, 16);
      ctx.fillStyle = rgba(GREEN, 0.9);
      ctx.fillText("NETWORK REQUESTS: 0", 10, 30);
      ctx.fillStyle = rgba(fg, 0.4);
      ctx.fillText("DRAG TO ORBIT", 10, H - 10);
      ctx.textAlign = "right";
      ctx.fillText(
        `t ${t.toFixed(1).padStart(4, "0")}s / ${LOOP}s`,
        W - 10,
        H - 10,
      );
    };

    /* ---- loop / lifecycle ---- */
    let raf: number | null = null;
    let clock = 0;
    let last = performance.now();
    const loop = (now: number) => {
      clock += Math.min(0.05, (now - last) / 1000);
      last = now;
      frame(clock);
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
    const redraw = () => requestAnimationFrame(() => frame(clock));

    iso.setTheme(readTheme());
    resize();
    redraw();

    const ro = new ResizeObserver(() => {
      resize();
      redraw();
    });
    ro.observe(wrap);
    let visible = false;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !document.hidden) start();
      else stop();
    });
    io.observe(canvas);
    const onVis = () => (document.hidden ? stop() : visible && start());
    document.addEventListener("visibilitychange", onVis);
    const mo = new MutationObserver(() => {
      iso.setTheme(readTheme(iso.theme));
      redraw();
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
    document.fonts?.ready.then(redraw).catch(() => undefined);

    const onDown = (e: PointerEvent) => {
      dragging = true;
      dragX = e.clientX;
      dragYaw = yawTarget;
      lastInteraction = performance.now();
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - dragX;
      if (Math.abs(dx) > 4) canvas.setPointerCapture?.(e.pointerId);
      yawTarget = dragYaw + dx * 0.012;
      lastInteraction = performance.now();
      if (reduce) redraw();
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      if (canvas.hasPointerCapture?.(e.pointerId))
        canvas.releasePointerCapture(e.pointerId);
    };
    const onDbl = () => {
      yawTarget = ISO_YAW;
      if (reduce) redraw();
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("dblclick", onDbl);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("dblclick", onDbl);
    };
  }, []);

  return (
    <figure className={cn("cad-card my-6 overflow-hidden", className)}>
      <div ref={wrapRef} className="relative w-full">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Animated isometric diagram: inside a browser boundary, Shortlist scans a job page, matches its skills against your local resume with a deterministic weighted matcher, and shows a match score. A packet trying to reach a server bounces off the browser wall; zero network requests are made. Gemini Nano is an optional on-device helper."
          className="block w-full cursor-grab touch-pan-y active:cursor-grabbing"
        />
      </div>
      <figcaption className="border-t border-border px-4 py-2.5 font-mono text-[0.66rem] leading-[1.6] tracking-[0.04em] text-muted-foreground uppercase">
        Fig. 01 — Everything happens inside the browser. Drag to orbit ·
        double-click to reset.
      </figcaption>
    </figure>
  );
};

export default ShortlistIso;
