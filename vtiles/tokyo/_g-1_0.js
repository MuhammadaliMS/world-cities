// TOKYO -1,0 grid helpers (copied/adapted from -1_0.js + _props.js): signboard art, wall ACs, balconies, roof kit, tower solid.
import { P, INK, shade, lerp, rng, hash } from "../../lib/vec-kit.js";
import { stdProj, mbox, mwin, mband, faceSign, acUnit, antenna } from "./_props.js";

export function artPanel(g, w, h, kind) {
  const P1 = [["#e84a3a", "#2f5fb5", "#f4c542", "#f4efe4", "#35b0a8"], ["#2f5fb5", "#f4c542", "#e84a3a", "#f4efe4", "#35b0a8"]][kind % 2];
  g.fillStyle = P1[3]; g.fillRect(0, 0, w, h);
  g.fillStyle = P1[0]; g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.55, 0); g.lineTo(w * 0.15, h * 0.7); g.lineTo(0, h * 0.7); g.fill();
  g.fillStyle = P1[1]; g.beginPath(); g.moveTo(w * 0.55, 0); g.lineTo(w, 0); g.lineTo(w, h * 0.5); g.lineTo(w * 0.25, h * 0.78); g.fill();
  g.fillStyle = P1[2]; g.beginPath(); g.arc(w * 0.38, h * 0.62, w * 0.28, 0, 6.3); g.fill();
  g.fillStyle = P1[4]; g.beginPath(); g.moveTo(w, h * 0.55); g.lineTo(w, h); g.lineTo(w * 0.4, h); g.fill();
}
export function stripeBanner(g, w, h, cols) {
  g.fillStyle = cols[0]; g.fillRect(0, 0, w, h);
  g.fillStyle = cols[1]; g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.5, 0); g.lineTo(0, h * 0.42); g.fill();
  g.fillStyle = cols[2]; g.beginPath(); g.moveTo(w, 0); g.lineTo(w, h * 0.34); g.lineTo(w * 0.1, h * 0.76); g.lineTo(0, h * 0.7); g.lineTo(0, h * 0.5); g.lineTo(w * 0.5, 0); g.closePath(); g.fill();
  g.fillStyle = cols[3]; g.beginPath(); g.moveTo(w, h * 0.55); g.lineTo(w, h); g.lineTo(0, h); g.lineTo(0, h * 0.82); g.fill();
}
// wall AC: side L sits on the v+dv face at u=a (face plane v=bb); side R on the u+du face (plane u=a, near corner v=bb)
export function wallAC(k, a, bb, z, side) {
  const c = k.ctx, s = 0.34;
  const bx = side === "L" ? mbox(k, stdProj, a, bb, z, s, 0.22, 0.26, "#dedad2", { wobble: 0, lw: 0.8 }) : mbox(k, stdProj, a, bb - s, z, 0.22, s, 0.26, "#dedad2", { wobble: 0, lw: 0.8 });
  const [x, y] = bx.fp(side, 0.5, 0.13), spin = k.t * 8 + a * 4;
  c.fillStyle = "#59616c"; c.beginPath(); c.ellipse(x, y, 6, 4.2, 0, 0, 6.3); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.7; c.stroke();
  c.beginPath(); c.moveTo(x - Math.cos(spin) * 5, y - Math.sin(spin) * 3.5); c.lineTo(x + Math.cos(spin) * 5, y + Math.sin(spin) * 3.5); c.stroke();
}
export function balcony(k, a0, a1, bb, z, o = {}) {
  const c = k.ctx;
  mbox(k, stdProj, a0, bb, z, a1 - a0, 0.2, 0.06, o.col || "#cbc4b4", { wobble: 0, lw: 0.9 });
  c.strokeStyle = "rgba(42,36,32,0.85)"; c.lineWidth = 0.9; c.beginPath();
  const p0 = P(a0, bb + 0.2, z + 0.06), p1 = P(a1, bb + 0.2, z + 0.06), q0 = P(a0, bb + 0.2, z + 0.42), q1 = P(a1, bb + 0.2, z + 0.42);
  c.moveTo(...q0); c.lineTo(...q1);
  const n = Math.max(3, Math.round((a1 - a0) / 0.14));
  for (let i = 0; i <= n; i++) { const f = i / n; c.moveTo(lerp(p0[0], p1[0], f), lerp(p0[1], p1[1], f)); c.lineTo(lerp(q0[0], q1[0], f), lerp(q0[1], q1[1], f)); }
  c.stroke();
  if (o.laundry) { for (let i = 0; i < 3; i++) { const f = (i + 0.7) / 3.4, x = lerp(q0[0], q1[0], f), y = lerp(q0[1], q1[1], f) + 2; c.fillStyle = ["#f2efe6", "#6aa0d8", "#e8a0a8"][i]; c.fillRect(x - 3, y, 5.5, 8 + Math.sin(k.t * 2 + i) * 0.7); c.strokeStyle = INK; c.lineWidth = 0.6; c.strokeRect(x - 3, y, 5.5, 8); } }
}
export function waterTank(k, x, y) {
  const c = k.ctx; c.strokeStyle = INK; c.lineWidth = 1.6;
  c.beginPath(); for (const dx of [-12, -4, 4, 12]) { c.moveTo(x + dx, y); c.lineTo(x + dx * 0.55, y - 22); } c.stroke();
  c.lineWidth = 1; c.beginPath(); c.moveTo(x - 12, y); c.lineTo(x + 4, y - 22); c.moveTo(x + 12, y); c.lineTo(x - 4, y - 22); c.moveTo(x - 8, y - 10); c.lineTo(x + 8, y - 10); c.stroke();
  c.fillStyle = "#bfc3c5"; c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.rect(x - 11, y - 52, 22, 30); c.fill(); c.stroke();
  c.strokeStyle = "rgba(60,60,64,0.5)"; c.lineWidth = 0.8; c.beginPath(); for (const yy of [-42, -34, -27]) { c.moveTo(x - 11, y + yy); c.lineTo(x + 11, y + yy); } c.stroke();
  c.beginPath(); c.ellipse(x, y - 52, 11, 4.5, 0, 0, 6.3); c.fillStyle = "#d6dadc"; c.fill(); c.strokeStyle = INK; c.stroke();
  c.beginPath(); c.moveTo(x - 11, y - 52); c.lineTo(x, y - 62); c.lineTo(x + 11, y - 52); c.fillStyle = "#9fa4a8"; c.fill(); c.stroke();
}
export function roofKit(k, u0, v0, du, dv, h, n, seed, o = {}) {
  const R = rng(seed), c = k.ctx;
  for (let i = 0; i < n; i++) acUnit(k, stdProj, u0 + 0.12 + R() * Math.max(0.1, du - 0.55), v0 + 0.1 + R() * Math.max(0.1, dv - 0.45), h, { s: 0.34 + R() * 0.12 });
  if (o.ant) { const [x, y] = P(u0 + du * 0.3, v0 + dv * 0.3, h); antenna(k, x, y, o.ant, { light: true, seed }); }
  if (o.dish) { const [x, y] = P(u0 + du * 0.75, v0 + dv * 0.55, h); c.fillStyle = "#e6e6e0"; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.ellipse(x, y - 8, 7, 5, -0.5, 0, 6.3); c.fill(); c.stroke(); c.beginPath(); c.moveTo(x, y - 8); c.lineTo(x, y); c.stroke(); }
  if (o.tank) { const [x, y] = P(u0 + du * 0.55, v0 + dv * 0.5, h); waterTank(k, x, y); }
  if (o.pipe) { const A = P(u0 + 0.2, v0 + 0.12, h), B = P(u0 + 0.2, v0 + 0.12, h + 0.8), C = P(u0 + du * 0.6, v0 + 0.12, h + 0.8); c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(...A); c.lineTo(...B); c.lineTo(...C); c.stroke(); c.strokeStyle = "#c9ccce"; c.lineWidth = 2.2; c.stroke(); }
}
// axis-aligned signboard tower: box at (u,v) footprint du x dv, height h; o.draw(b,h,g) adds signs
export function tower(k, o) {
  const { u, v, du, dv, h } = o, c = k.ctx, col = o.col || "#ece3d0";
  const b = mbox(k, stdProj, u, v, 0, du, dv, h, col, { wobble: 0, left: o.left, right: o.right || shade(col, -0.16), top: o.top });
  const floors = Math.max(3, Math.round(h / 0.64)), cols = Math.max(2, Math.round(du * 1.7));
  if (!o.noWin) {
    mwin(k, b, "L", { rows: floors, cols, z0: 0.35, z1: h - 0.3, color: o.win || "#9ab2cc", lit: o.lit ?? 0.5, litCol: o.litCol, gap: 0.34, mx: 0.07, seed: o.seed, lw: 0.8, sheen: true });
    mwin(k, b, "R", { rows: floors, cols: Math.max(2, Math.round(dv * 1.5)), z0: 0.35, z1: h - 0.3, color: shade(o.win || "#9ab2cc", -0.1), lit: o.rlit ?? o.lit ?? 0.5, litCol: o.litCol, gap: 0.34, mx: 0.08, seed: o.seed + 9, lw: 0.8 });
  }
  for (const side of ["L", "R"]) { mband(k, b, side, h - 0.14, h, shade(col, -0.2)); for (let i = 1; i < floors; i += 2) mband(k, b, side, 0.35 + i * (h - 0.65) / floors - 0.07, 0.35 + i * (h - 0.65) / floors - 0.03, shade(col, -0.12), { lw: 0.4 }); }
  if (o.draw) o.draw(b, h, { u, v, du, dv });
  roofKit(k, u, v, du, dv, h, o.ac ?? 3, o.seed, o);
  c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); b.T.forEach((q, i) => (i ? c.lineTo(...q) : c.moveTo(...q))); c.closePath(); c.stroke();
  return b;
}
// convex hull of px points (monotone chain)
export function hull(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
