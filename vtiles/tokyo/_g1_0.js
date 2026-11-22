// TOKYO 1,0 grid helpers: cobbles, lobby, blade signs as thin boxes, R-face awning, pipes and wires (all through P/mbox)
import { P, INK, shade, lerp, rng } from "../../lib/vec-kit.js";
import { stdProj, mbox, faceDraw, neon } from "./_props.js";

const TAU = Math.PI * 2;

export function cobbles(k) {
  const c = k.ctx, R = rng(77);
  c.save(); c.beginPath(); [P(0, 0), P(10, 0), P(10, 10), P(0, 10)].forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.clip();
  const n = 44, st = 10 / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const u = i * st + ((j % 2) * st) / 2, v = j * st, h = R();
    c.fillStyle = `rgb(${Math.round(176 + h * 56)},${Math.round(158 + h * 50)},${Math.round(126 + h * 52)})`;
    c.beginPath(); c.moveTo(...P(u + 0.012, v + 0.012)); c.lineTo(...P(u + st - 0.012, v + 0.012)); c.lineTo(...P(u + st - 0.012, v + st - 0.012)); c.lineTo(...P(u + 0.012, v + st - 0.012)); c.closePath(); c.fill();
  }
  c.strokeStyle = "rgba(95,72,48,0.55)"; c.lineWidth = 0.9; c.beginPath();
  for (let i = 0; i <= n; i++) { c.moveTo(...P(i * st, 0)); c.lineTo(...P(i * st, 10)); } c.stroke();
  c.strokeStyle = "rgba(95,72,48,0.35)"; c.lineWidth = 0.7; c.beginPath(); for (let j = 0; j <= n; j++) { c.moveTo(...P(0, j * st)); c.lineTo(...P(10, j * st)); } c.stroke();
  const g = c.createRadialGradient(...P(5, 6), 10, ...P(5, 6), 230); g.addColorStop(0, "rgba(255,196,110,0.4)"); g.addColorStop(1, "rgba(255,190,100,0)"); c.fillStyle = g; c.fillRect(0, 0, 1024, 1024);
  c.restore();
}

const LOBBY_PPL = [[0.06, 0.8], [0.1, 0.75], [0.17, 0.82], [0.23, 0.78], [0.3, 0.8], [0.4, 0.76], [0.48, 0.81], [0.55, 0.77], [0.64, 0.8], [0.72, 0.78], [0.8, 0.82], [0.9, 0.78]];
export function lobby(k, b, side, z0, z1, cols) {
  faceDraw(k, b, side, 0.02, 0.98, z0, z1, 300, 80, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#f6c766"); gr.addColorStop(1, "#ffe9a8"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(120,70,30,0.45)";
    LOBBY_PPL.forEach(([s], i) => { const x = s * w, hh = 26 + (i % 3) * 5; g.beginPath(); g.arc(x, h - hh - 2, 4, 0, TAU); g.fill(); g.fillRect(x - 4, h - hh + 3, 8, hh - 3); });
    g.strokeStyle = "rgba(40,50,70,0.8)"; g.lineWidth = 3; for (let i = 0; i <= cols; i++) { g.beginPath(); g.moveTo(i * w / cols, 0); g.lineTo(i * w / cols, h); g.stroke(); }
    g.beginPath(); g.moveTo(0, h * 0.25); g.lineTo(w, h * 0.25); g.stroke();
  });
}

// blade sign: a thin box sticking out of a wall. axis "u" (off an R face, text on its L face) or "v" (off an L face, text on its R face)
export function bladeBox(k, u, v, z, h, text, o = {}) {
  const ax = o.axis || "u", len = o.len ?? 0.5, th = 0.08;
  const du = ax === "u" ? len : th, dv = ax === "u" ? th : len;
  const on = o.blink ? (Math.sin(k.t * 4 + (o.seed || 0)) > -0.3 ? 1 : 0.4) : 1;
  const b = mbox(k, stdProj, u, v, z, du, dv, h, o.bg || "#201830", { wobble: 0, lw: 1 });
  neon(k, b, ax === "u" ? "L" : "R", 0.06, 0.94, 0.08, h - 0.08, text, { col: o.col, bg: o.bg || "#201830", fg: o.fg, ar: 0.36, vertical: true, blink: o.blink, seed: o.seed });
  const [x, y] = P(u + du / 2, v + dv / 2, z + h / 2), c = k.ctx;
  const g = c.createRadialGradient(x, y, 2, x, y, h * 36); g.addColorStop(0, `rgba(${o.glow || "255,160,90"},${0.3 * on})`); g.addColorStop(1, "rgba(255,160,90,0)"); c.fillStyle = g; c.beginPath(); c.arc(x, y, h * 36, 0, TAU); c.fill();
  return b;
}

// striped awning on an R face (u fixed, projects +u, runs along v)
export function awnR(k, u, v, z, len, o = {}) {
  const n = o.stripes ?? 6, d = o.depth ?? 0.45, drop = o.drop ?? 0.35, c1 = o.c1 || "#d64e46", c2 = o.c2 || "#f6f0e2";
  for (let i = 0; i < n; i++) {
    const a = v + (len * i) / n, b = v + (len * (i + 1)) / n;
    k.poly([[u, a, z], [u, b, z], [u + d, b, z - drop], [u + d, a, z - drop]], i % 2 ? c2 : c1, { lw: 1.4, wobble: 0 });
  }
}

export const pipe = (k, u, v, z, hgt, w = 3) => { const c = k.ctx, [x, y] = P(u, v, z); c.fillStyle = "#b9b5aa"; c.fillRect(x - w, y - hgt, w * 2, hgt); c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(x - w, y - hgt, w * 2, hgt); c.fillStyle = "rgba(255,255,255,0.35)"; c.fillRect(x - w + 1, y - hgt, 1.6, hgt); };
export const wire = (k, A, B, sag = 8) => { const c = k.ctx; c.strokeStyle = "rgba(40,36,34,0.85)"; c.lineWidth = 1; c.beginPath(); for (let i = 0; i <= 14; i++) { const f = i / 14, x = lerp(A[0], B[0], f), y = lerp(A[1], B[1], f) + Math.sin(f * Math.PI) * sag; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); };
