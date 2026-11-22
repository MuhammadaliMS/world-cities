// London 0,0 grid-pass helpers (copied from shanghai/bund.js, extended with gothic parts).
// Everything goes through P(); faces are planes along u (side "L": v = c) or along v (side "R": u = c).
import { P, CTS, INK, shade, mix, lerp, clamp, hash, rng, spline } from "../../lib/vec-kit.js";
export { P, CTS, INK, shade, mix, lerp, clamp, hash, rng, spline };

export const ST = "#dcb672", ST_L = "#f0d59c", ST_M = "#c9a060", ST_D = "#a9813f", ST_DD = "#7b5b2b";
export const SL = "#5d6478", SL_L = "#8b92a6", SL_D = "#40465a";
export const GOLD = "#e3bd52", GOLD_D = "#a8832b", GOLD_L = "#f7df8c";
export const GLASS = "#4b5e7b", GLASS_L = "#91a6c0", RECESS = "#5b4528";

export const pg = (k, pts3, fill, lw = 0.9) => k.poly(pts3, fill, { lw, wobble: 0 });
// axis-aligned box: right face (u1), left face (v1), top
export function bx(k, u0, u1, v0, v1, z0, z1, col, o = {}) {
  const lw = o.lw ?? 1;
  if (o.noR !== true) pg(k, [[u1, v0, z0], [u1, v1, z0], [u1, v1, z1], [u1, v0, z1]], o.right || shade(col, -0.2), lw);
  pg(k, [[u0, v1, z0], [u1, v1, z0], [u1, v1, z1], [u0, v1, z1]], o.left || col, lw);
  if (o.noTop !== true) pg(k, [[u0, v0, z1], [u1, v0, z1], [u1, v1, z1], [u0, v1, z1]], o.top || shade(col, 0.1), lw);
}
export const face = (side, c) => (side === "L" ? (a, z) => [a, c, z] : (a, z) => [c, a, z]);

// pointed (equilateral) arch outline of a window on face F: centre a, base z, width w, height h
export function lancetPts(F, a, z, w, h, n = 6) {
  const zs = z + h - w * 0.866, pts = [F(a - w / 2, z), F(a + w / 2, z), F(a + w / 2, zs)];
  for (let i = 1; i <= n; i++) { const th = (i / n) * (Math.PI / 3); pts.push(F(a - w / 2 + w * Math.cos(th), zs + w * Math.sin(th))); }
  for (let i = n - 1; i >= 0; i--) { const th = (i / n) * (Math.PI / 3); pts.push(F(a + w / 2 - w * Math.cos(th), zs + w * Math.sin(th))); }
  pts.push(F(a - w / 2, zs));
  return pts;
}
const P3 = (pts) => pts.map((p) => P(...p));
// gothic window with stone surround, glass, mullions, transom and a rose in the head
export function gwin(k, F, a, z, w, h, o = {}) {
  const c = k.ctx, dk = o.dk, lit = o.lit && hash((o.seed || 0) + a * 17.3 + z * 31.1) < o.lit;
  if (o.sur !== false) k.path(P3(lancetPts(F, a, z - 0.02, w + 0.07, h + 0.06)), { fill: dk ? shade(ST_L, -0.22) : ST_L, lw: 0.6, wobble: 0 });
  k.path(P3(lancetPts(F, a, z, w, h)), { fill: lit ? "#f3d57a" : dk ? "#34445c" : GLASS, lw: 0.7, wobble: 0 });
  const zs = z + h - w * 0.866;
  c.strokeStyle = "rgba(240,228,190,0.7)"; c.lineWidth = 0.6; c.beginPath();
  c.moveTo(...P(...F(a, z))); c.lineTo(...P(...F(a, zs + w * 0.45)));
  if (h > 0.5) { c.moveTo(...P(...F(a - w / 2, z + (zs - z) * 0.55))); c.lineTo(...P(...F(a + w / 2, z + (zs - z) * 0.55))); }
  c.stroke();
  if (o.rose !== false && w > 0.16 && h > 0.4) { // quatrefoil dot in the head
    const [x, y] = P(...F(a, zs + w * 0.36)); c.fillStyle = "rgba(240,228,190,0.8)"; c.beginPath(); c.arc(x, y, 1.0, 0, 7); c.fill();
  }
  if (o.sill !== false) { c.strokeStyle = dk ? shade(ST_D, -0.2) : ST_D; c.lineWidth = 1.4; c.beginPath(); c.moveTo(...P(...F(a - w / 2 - 0.04, z - 0.02))); c.lineTo(...P(...F(a + w / 2 + 0.04, z - 0.02))); c.stroke(); }
}
// flat rectangular window with stone surround (ground floor)
export function rwin(k, F, a, z, w, h, o = {}) {
  const dk = o.dk, rect = (a0, a1, z0, z1) => [F(a0, z0), F(a1, z0), F(a1, z1), F(a0, z1)].map((p) => P(...p));
  k.path(rect(a - w / 2 - 0.035, a + w / 2 + 0.035, z - 0.02, z + h + 0.035), { fill: dk ? shade(ST_L, -0.22) : ST_L, lw: 0.6, wobble: 0 });
  k.path(rect(a - w / 2, a + w / 2, z, z + h), { fill: dk ? "#34445c" : GLASS, lw: 0.7, wobble: 0 });
  const c = k.ctx; c.strokeStyle = "rgba(240,228,190,0.6)"; c.lineWidth = 0.6; c.beginPath();
  c.moveTo(...P(...F(a, z))); c.lineTo(...P(...F(a, z + h))); c.moveTo(...P(...F(a - w / 2, z + h * 0.5))); c.lineTo(...P(...F(a + w / 2, z + h * 0.5))); c.stroke();
}
// stone course lines
export function course(k, side, c, a0, a1, z0, z1, step, alpha = 0.28) {
  const F = face(side, c), cx = k.ctx; cx.strokeStyle = `rgba(110,78,40,${alpha})`; cx.lineWidth = 0.8; cx.beginPath();
  for (let z = z0 + step; z < z1 - 0.01; z += step) { cx.moveTo(...P(...F(a0, z))); cx.lineTo(...P(...F(a1, z))); }
  cx.stroke();
}
// horizontal band standing proud of a face
export function band(k, side, c, a0, a1, z0, z1, col = ST_L, proud = 0.05) {
  if (side === "L") bx(k, a0 - proud, a1 + proud, c - 0.02, c + proud, z0, z1, col, { lw: 0.7 });
  else bx(k, c - 0.02, c + proud, a0 - proud, a1 + proud, z0, z1, col, { lw: 0.7 });
}
// buttress strip with an optional pinnacle on top
export function buttress(k, side, c, a, w, z0, z1, o = {}) {
  const pr = o.proud ?? 0.08, col = o.col || ST_M;
  if (side === "L") bx(k, a - w / 2, a + w / 2, c - 0.02, c + pr, z0, z1, col, { lw: 0.7 });
  else bx(k, c - 0.02, c + pr, a - w / 2, a + w / 2, z0, z1, col, { lw: 0.7 });
  if (o.pin) {
    const [u, v] = side === "L" ? [a, c + pr / 2] : [c + pr / 2, a], hw = Math.max(w * 0.55, 0.06), h = o.pin;
    pyr(k, u - hw, u + hw, v - hw, v + hw, z1, h, o.pinCol || ST_L, { gold: o.gold !== false });
  }
}
// tiny stone pyramid (pinnacle spire) with gold ball
export function pyr(k, u0, u1, v0, v1, z, h, col, o = {}) {
  const au = (u0 + u1) / 2, av = (v0 + v1) / 2, zt = z + h;
  pg(k, [[u1, v0, z], [u1, v1, z], [au, av, zt]], shade(col, -0.24), 0.8);
  pg(k, [[u0, v1, z], [u1, v1, z], [au, av, zt]], col, 0.8);
  if (o.gold) { const [x, y] = P(au, av, zt); k.ctx.fillStyle = GOLD; k.ctx.beginPath(); k.ctx.arc(x, y - 1, 1.5, 0, 7); k.ctx.fill(); k.ctx.strokeStyle = INK; k.ctx.lineWidth = 0.6; k.ctx.stroke(); }
}
// pierced parapet: dark openings in a band between z0 and z1 on a face
export function pierced(k, side, c, a0, a1, z0, z1, step = 0.1, col = "#6a5232") {
  const F = face(side, c), cx = k.ctx; cx.fillStyle = col;
  const n = Math.max(1, Math.round((a1 - a0) / step)), st = (a1 - a0) / n;
  for (let i = 0; i < n; i++) {
    const a = a0 + (i + 0.5) * st, w = st * 0.52, h = (z1 - z0) * 0.5, zb = z0 + (z1 - z0) * 0.22;
    cx.beginPath();
    const p = [F(a - w / 2, zb), F(a + w / 2, zb), F(a + w / 2, zb + h * 0.7), F(a, zb + h), F(a - w / 2, zb + h * 0.7)].map((q) => P(...q));
    p.forEach((q, j) => (j ? cx.lineTo(...q) : cx.moveTo(...q))); cx.closePath(); cx.fill();
  }
}
// battlement teeth on top of a face line (small boxes)
export function crenels(k, side, c, a0, a1, z, h = 0.1, col = ST_L, step = 0.16) {
  for (let a = a0; a < a1 - 0.04; a += step) {
    if (side === "L") bx(k, a, a + step * 0.55, c - 0.05, c + 0.02, z, z + h, col, { lw: 0.5 });
    else bx(k, c - 0.02, c + 0.05, a, a + step * 0.55, z, z + h, col, { lw: 0.5 });
  }
}
// steep slate roof, ridge along u. Draws the front (v1) slope + right gable end, slate courses and cresting.
export function roofU(k, u0, u1, v0, v1, z, h, o = {}) {
  const col = o.col || SL, vm = (v0 + v1) / 2, zt = z + h, c = k.ctx;
  pg(k, [[u1, v0, z], [u1, v1, z], [u1, vm, zt]], shade(col, -0.28), 1);
  pg(k, [[u0, v1, z], [u1, v1, z], [u1, vm, zt], [u0, vm, zt]], col, 1);
  c.strokeStyle = "rgba(20,26,45,0.32)"; c.lineWidth = 0.7; c.beginPath();
  const rows = o.rows ?? 7;
  for (let i = 1; i < rows; i++) { const f = i / rows; c.moveTo(...P(u0, lerp(v1, vm, f), z + h * f)); c.lineTo(...P(u1, lerp(v1, vm, f), z + h * f)); }
  const cols = Math.round((u1 - u0) / 0.12);
  for (let i = 1; i < cols; i++) { const a = lerp(u0, u1, i / cols); c.moveTo(...P(a, v1, z)); c.lineTo(...P(a, vm, zt)); }
  c.stroke();
  // lit patches on a few slates
  c.strokeStyle = "rgba(190,200,225,0.18)"; c.lineWidth = 0.9; c.beginPath();
  for (let i = 1; i < rows; i += 2) { const f = i / rows; c.moveTo(...P(u0, lerp(v1, vm, f) + 0.02, z + h * f)); c.lineTo(...P(u1, lerp(v1, vm, f) + 0.02, z + h * f)); }
  c.stroke();
  // ridge cresting: little gold fleurs
  if (o.crest !== false) {
    c.strokeStyle = GOLD_D; c.lineWidth = 1.4; c.beginPath(); c.moveTo(...P(u0, vm, zt)); c.lineTo(...P(u1, vm, zt)); c.stroke();
    c.fillStyle = GOLD; c.strokeStyle = INK; c.lineWidth = 0.5;
    for (let a = u0 + 0.06; a < u1 - 0.02; a += 0.14) { const [x, y] = P(a, vm, zt); c.beginPath(); c.moveTo(x - 1.5, y); c.lineTo(x, y - 4.5); c.lineTo(x + 1.5, y); c.closePath(); c.fill(); c.stroke(); }
  }
}
// small dormer (lucarne) on a roof slope facing +v, base at roof height z over v
export function dormer(k, a, v, z, o = {}) {
  const w = o.w ?? 0.2, d = o.d ?? 0.2, h = o.h ?? 0.26, col = o.col || ST_L;
  bx(k, a - w / 2, a + w / 2, v - d, v, z, z + h, col, { lw: 0.7, top: col });
  gwin(k, face("L", v), a, z + 0.03, w * 0.55, h * 0.8, { sur: false, sill: false, rose: false });
  pg(k, [[a + w / 2 + 0.02, v - d, z + h], [a + w / 2 + 0.02, v + 0.02, z + h], [a, v + 0.02, z + h + w * 0.7], [a, v - d, z + h + w * 0.7]], shade(SL, -0.18), 0.6);
  pg(k, [[a - w / 2 - 0.02, v + 0.02, z + h], [a + w / 2 + 0.02, v + 0.02, z + h], [a, v + 0.02, z + h + w * 0.7]], SL, 0.6);
  const [x, y] = P(a, v + 0.02, z + h + w * 0.7); k.ctx.fillStyle = GOLD; k.ctx.beginPath(); k.ctx.arc(x, y - 1, 1.2, 0, 7); k.ctx.fill();
}
export function chimney(k, u, v, z, h) { bx(k, u - 0.09, u + 0.09, v - 0.09, v + 0.09, z, z + h, ST_M, { lw: 0.7 }); bx(k, u - 0.12, u + 0.12, v - 0.12, v + 0.12, z + h, z + h + 0.07, ST_L, { lw: 0.6 }); }
// square slate pyramid roof with gilt hips
export function pyramid(k, u0, u1, v0, v1, z, h, col, o = {}) {
  const au = (u0 + u1) / 2, av = (v0 + v1) / 2, zt = z + h, c = k.ctx;
  pg(k, [[u1, v0, z], [u1, v1, z], [au, av, zt]], shade(col, -0.26), 1);
  pg(k, [[u0, v1, z], [u1, v1, z], [au, av, zt]], col, 1);
  c.strokeStyle = "rgba(20,26,45,0.3)"; c.lineWidth = 0.7; c.beginPath();
  for (let i = 1; i < 6; i++) { const f = i / 6; c.moveTo(...P(lerp(u0, au, f), lerp(v1, av, f), z + h * f)); c.lineTo(...P(lerp(u1, au, f), lerp(v1, av, f), z + h * f)); }
  const n = o.seams ?? 5;
  for (let i = 1; i < n; i++) { c.moveTo(...P(lerp(u0, u1, i / n), v1, z)); c.lineTo(...P(au, av, zt)); }
  c.stroke();
  if (o.gold !== false) { c.strokeStyle = GOLD; c.lineWidth = 1.5; c.lineCap = "round"; c.beginPath(); c.moveTo(...P(u0, v1, z)); c.lineTo(...P(au, av, zt)); c.moveTo(...P(u1, v1, z)); c.lineTo(...P(au, av, zt)); c.moveTo(...P(u1, v0, z)); c.lineTo(...P(au, av, zt)); c.stroke(); }
}
// gilt finial: spike + ball (+ cross) anchored at a projected point
export function finial(k, u, v, z, h = 0.5, o = {}) {
  const c = k.ctx, [x, y0] = P(u, v, z), [, y1] = P(u, v, z + h);
  c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 2.2; c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke(); c.strokeStyle = GOLD; c.lineWidth = 1.1; c.stroke();
  if (o.ball !== false) { c.fillStyle = GOLD; c.beginPath(); c.arc(x, y0 - (y0 - y1) * 0.5, 2.6, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.7; c.stroke(); }
  if (o.cross) { c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 3, y1 + 4); c.lineTo(x + 3, y1 + 4); c.stroke(); c.strokeStyle = GOLD; c.lineWidth = 1; c.stroke(); }
}
// clock disc drawn on a vertical plane: L (along +u) or R (along +v read right to left)
export function clockOn(k, side, c0, a, z, r, t, ph) {
  const cx = k.ctx, [x, y] = P(...face(side, c0)(a, z)), S = CTS.S;
  cx.save(); cx.translate(x, y);
  if (side === "L") cx.transform(S, S * CTS.YS, 0, -S * CTS.ZS, 0, 0); else cx.transform(S, -S * CTS.YS, 0, -S * CTS.ZS, 0, 0);
  cx.beginPath(); cx.arc(0, 0, r * 1.22, 0, 7); cx.fillStyle = GOLD; cx.fill(); cx.lineWidth = 0.03; cx.strokeStyle = INK; cx.stroke();
  cx.beginPath(); cx.arc(0, 0, r * 1.08, 0, 7); cx.fillStyle = "#2a3550"; cx.fill();
  cx.beginPath(); cx.arc(0, 0, r, 0, 7); cx.fillStyle = "#fbf6e6"; cx.fill(); cx.lineWidth = 0.03; cx.strokeStyle = INK; cx.stroke();
  cx.lineWidth = 0.025; for (let i = 0; i < 12; i++) { const an = (i / 12) * 6.283, r0 = i % 3 ? 0.84 : 0.7; cx.beginPath(); cx.moveTo(Math.sin(an) * r * r0, Math.cos(an) * r * r0); cx.lineTo(Math.sin(an) * r * 0.94, Math.cos(an) * r * 0.94); cx.stroke(); }
  cx.strokeStyle = INK; cx.lineWidth = 0.03; cx.beginPath(); cx.arc(0, 0, r * 0.97, 0, 7); cx.stroke();
  cx.fillStyle = INK; for (let i = 0; i < 12; i++) { const an = (i / 12) * 6.283; cx.save(); cx.translate(Math.sin(an) * r * 0.8, Math.cos(an) * r * 0.8); cx.rotate(-an); cx.fillRect(-0.035, -0.07, 0.07, 0.14); cx.restore(); }
  const m = t * 0.5 + ph, hh = m / 12 + 1.9;
  cx.lineCap = "round"; cx.strokeStyle = INK; cx.lineWidth = 0.045; cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(Math.sin(m) * r * 0.84, Math.cos(m) * r * 0.84); cx.stroke();
  cx.lineWidth = 0.07; cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(Math.sin(hh) * r * 0.54, Math.cos(hh) * r * 0.54); cx.stroke();
  cx.beginPath(); cx.arc(0, 0, r * 0.09, 0, 7); cx.fillStyle = GOLD; cx.fill(); cx.lineWidth = 0.02; cx.stroke();
  cx.restore();
}

// ---------- ground / street props, all axis-aligned ----------
// iron railing along u (v fixed) or along v (u fixed): posts with spear tips, two rails
export function railU(k, u0, u1, v, h = 0.34) {
  const c = k.ctx; c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 2.4; c.beginPath();
  c.moveTo(...P(u0, v, h * 0.3)); c.lineTo(...P(u1, v, h * 0.3)); c.moveTo(...P(u0, v, h * 0.85)); c.lineTo(...P(u1, v, h * 0.85)); c.stroke();
  c.strokeStyle = "#2f3a38"; c.lineWidth = 1.2; c.stroke();
  c.strokeStyle = INK; c.lineWidth = 2; c.beginPath();
  for (let a = u0; a <= u1 + 0.001; a += 0.12) { c.moveTo(...P(a, v, 0)); c.lineTo(...P(a, v, h)); }
  c.stroke(); c.strokeStyle = "#2f3a38"; c.lineWidth = 0.9; c.stroke();
  c.fillStyle = GOLD; for (let a = u0; a <= u1 + 0.001; a += 0.36) { const [x, y] = P(a, v, h); c.beginPath(); c.arc(x, y - 1, 1.5, 0, 7); c.fill(); }
}
export function railV(k, v0, v1, u, h = 0.34) {
  const c = k.ctx; c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 2.4; c.beginPath();
  c.moveTo(...P(u, v0, h * 0.3)); c.lineTo(...P(u, v1, h * 0.3)); c.moveTo(...P(u, v0, h * 0.85)); c.lineTo(...P(u, v1, h * 0.85)); c.stroke();
  c.strokeStyle = "#2f3a38"; c.lineWidth = 1.2; c.stroke();
  c.strokeStyle = INK; c.lineWidth = 2; c.beginPath();
  for (let a = v0; a <= v1 + 0.001; a += 0.12) { c.moveTo(...P(u, a, 0)); c.lineTo(...P(u, a, h)); }
  c.stroke(); c.strokeStyle = "#2f3a38"; c.lineWidth = 0.9; c.stroke();
}
// stone gate pier (axis-aligned box + cap + ball)
export function pier(k, u, v, h = 0.55) {
  bx(k, u - 0.1, u + 0.1, v - 0.1, v + 0.1, 0, h, "#d6ccb8", { lw: 0.8 });
  bx(k, u - 0.13, u + 0.13, v - 0.13, v + 0.13, h, h + 0.07, "#e4dac6", { lw: 0.7 });
  const [x, y] = P(u, v, h + 0.12); k.ctx.fillStyle = "#e4dac6"; k.ctx.strokeStyle = INK; k.ctx.lineWidth = 0.8; k.ctx.beginPath(); k.ctx.arc(x, y - 2, 3.4, 0, 7); k.ctx.fill(); k.ctx.stroke();
}
