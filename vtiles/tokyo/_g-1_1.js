// TOKYO · -1,1 · Meiji Jingu grid pass: everything rebuilt on the u/v grid through P().
// Layout (u,v): gravel avenue u 4..6 running along v from the front edge to the hall stairs, forecourt v 3.4-4.6;
// hall (axis-aligned, copper hip roof, entrance on the LEFT face) u 2.7-7.3 v 0.5-2.9 at the back; great torii
// pillars at u 3.7 / 6.3 on v 6.6; sake-barrel rack u 1.9-2.8 v 4.1-7.9 (left of the path); purification
// pavilion u 6.8-9.2 v 4.85-7.15 (right of the path); cedar forest everywhere else (trunks inside 0.4..9.6).
import { P, INK, shade, lerp, rng, hash } from "../../lib/vec-kit.js";
import { FONT } from "./_props.js";
import { pad, kiku, GOLD, GOLD_D } from "./meiji.js";

const TAU = Math.PI * 2;
const COP = "#94b59c", WOOD = "#c68a52", WOOD_D = "#8c5a32", WOOD_L = "#e0a86e", PLASTER = "#e9e0c8";
export const AVE = [[4, 9.7], [4, 4.6], [3.4, 4.2], [3.4, 3.4], [6.6, 3.4], [6.6, 4.2], [6, 4.6], [6, 9.7]];
const W0 = { wobble: 0 };
const fp = (k, pts, col, o = {}) => k.poly(pts, col, { wobble: 0, ...o });

// ---------------------------------------------------------------- ground
export function ground(k, t) {
  const c = k.ctx;
  k.groundTrace({ lawn: [[[0.7, 0.7], [9.3, 0.7], [9.3, 9.3], [0.7, 9.3]]] }, { paved: "#d8cfb6", lawn: "#768f45", side: "#e6d6b2", tufts: 14 });
  const diamond = [P(0.3, 0.3), P(9.7, 0.3), P(9.7, 9.7), P(0.3, 9.7)];
  c.save(); k._trace(diamond, true, 0); c.clip();
  const R = rng(9);
  for (let i = 0; i < 70; i++) {
    const [x, y] = P(0.7 + R() * 8.6, 0.7 + R() * 8.6);
    c.fillStyle = R() < 0.5 ? "rgba(150,170,70,0.25)" : "rgba(50,70,30,0.2)";
    c.beginPath(); c.ellipse(x, y, 14 + R() * 20, 5 + R() * 6, 0, 0, TAU); c.fill();
  }
  c.restore();
}

export function gravel(k, t) {
  const c = k.ctx;
  c.save(); k._trace(AVE.map(([u, v]) => P(u, v)), true, 0); c.clip();
  k.ground(AVE, "#e9dfca", { lw: 0.01, stroke: false });
  const R = rng(17);
  for (let i = 0; i < 1500; i++) {
    const [x, y] = P(3.4 + R() * 3.2, 3.4 + R() * 6.3), r = R();
    c.fillStyle = r < 0.35 ? "rgba(150,120,95,0.45)" : r < 0.6 ? "rgba(200,170,150,0.5)" : r < 0.8 ? "rgba(255,255,250,0.7)" : "rgba(120,110,100,0.35)";
    c.fillRect(x, y, 1.6, 1.2);
  }
  // raked lines in the forecourt
  c.strokeStyle = "rgba(150,130,100,0.28)"; c.lineWidth = 0.8; c.beginPath();
  for (let v = 3.55; v < 4.15; v += 0.14) { const a = P(3.5, v), b = P(6.5, v); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
  c.stroke();
  // dappled forest shade drifting over the gravel
  const R2 = rng(23);
  for (let i = 0; i < 110; i++) {
    const [x0, y0] = P(3.4 + R2() * 3.2, 3.4 + R2() * 6.3), rr = 6 + R2() * 12, ph = R2() * 6;
    const x = x0 + Math.sin(t * 0.35 + ph) * 3, a = 0.12 + 0.05 * Math.sin(t * 0.6 + ph);
    c.fillStyle = `rgba(90,85,60,${a})`; c.beginPath();
    for (let j = 0; j < 3; j++) { const ox = (hash(i * 3 + j) - 0.5) * rr * 2, oy = (hash(i * 5 + j) - 0.5) * rr * 0.8; c.moveTo(x + ox + rr * 0.8, y0 + oy); c.ellipse(x + ox, y0 + oy, rr * 0.8, rr * 0.36, 0, 0, TAU); }
    c.fill();
  }
  c.restore();
  k.ground(AVE, null, { lw: 1.5 });
}

// ---------------------------------------------------------------- roofs
function ribsL(k, u0, u1, d0, d1, v1, z, vt, zt, n, col) { // ribs on a left (v+) face from eave to ridge edge
  const c = k.ctx; c.strokeStyle = col; c.lineWidth = 0.75; c.beginPath();
  for (let i = 1; i < n; i++) { const f = i / n, a = P(lerp(u0, u1, f), v1, z), b = P(lerp(d0, d1, f), vt, zt); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
  c.stroke();
}
// hip roof over u0..u1 x v0..v1 at z, rising h, hips inset by `inset` (ridge when inset == half the short side)
export function hipRoof(k, u0, v0, u1, v1, z, h, inset, col, o = {}) {
  const c = k.ctx, zt = z + h;
  const a = [u0 + inset, v0 + inset, zt], b = [u1 - inset, v0 + inset, zt], cc = [u1 - inset, v1 - inset, zt], d = [u0 + inset, v1 - inset, zt];
  fp(k, [[u0, v1, z], [u1, v1, z], [u1, v1, z - 0.14], [u0, v1, z - 0.14]], "#6f9480");
  fp(k, [[u1, v0, z], [u1, v1, z], [u1, v1, z - 0.14], [u1, v0, z - 0.14]], "#587a68");
  // gold studs along the left fascia
  c.fillStyle = GOLD; for (let u = u0 + 0.2; u < u1; u += 0.32) { const [x, y] = P(u, v1, z - 0.07); c.beginPath(); c.arc(x, y, 1.3, 0, TAU); c.fill(); }
  const L = [[u0, v1, z], [u1, v1, z], cc, d], Rr = [[u1, v0, z], [u1, v1, z], cc, b];
  const g = c.createLinearGradient(...P(u0, v1, z), ...P((u0 + u1) / 2, (v0 + v1) / 2, zt));
  g.addColorStop(0, shade(col, 0.08)); g.addColorStop(1, shade(col, -0.1));
  fp(k, L, g); fp(k, Rr, shade(col, -0.24));
  if (inset < Math.min(u1 - u0, v1 - v0) / 2 - 0.01) fp(k, [a, b, cc, d], shade(col, 0.1));
  const n = Math.round((u1 - u0) / 0.13);
  ribsL(k, u0, u1, d[0], cc[0], v1, z, d[1], zt, n, "rgba(38,62,50,0.42)");
  c.strokeStyle = "rgba(38,62,50,0.42)"; c.lineWidth = 0.75; c.beginPath();
  const nr = Math.round((v1 - v0) / 0.13);
  for (let i = 1; i < nr; i++) { const f = i / nr, p = P(u1, lerp(v0, v1, f), z), q = P(b[0], lerp(b[1], cc[1], f), zt); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); }
  c.stroke();
  // tile courses
  c.strokeStyle = "rgba(230,245,232,0.28)"; c.beginPath();
  for (let j = 1; j < 7; j++) { const f = j / 7; const p = P(lerp(u0, d[0], f), lerp(v1, d[1], f), lerp(z, zt, f)), q = P(lerp(u1, cc[0], f), lerp(v1, cc[1], f), lerp(z, zt, f)); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); }
  for (let j = 1; j < 7; j++) { const f = j / 7; const p = P(lerp(u1, b[0], f), lerp(v0, b[1], f), lerp(z, zt, f)), q = P(lerp(u1, cc[0], f), lerp(v1, cc[1], f), lerp(z, zt, f)); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); }
  c.stroke();
  // dappled sun drifting over the copper
  c.fillStyle = "rgba(255,250,200,0.16)";
  for (let i = 0; i < 4; i++) { const f = 0.25 + 0.12 * Math.sin(k.t * 0.7 + i), p = P(lerp(u0, d[0], f) + 0.5 + i * (u1 - u0) / 5, lerp(v1, d[1], f), lerp(z, zt, f)); c.beginPath(); c.ellipse(p[0], p[1], 9, 3, 0, 0, TAU); c.fill(); }
  // ridge cap
  if (o.ridge !== false) {
    k.line3([d, cc], { lw: 4, stroke: "#b8d0bd" }); k.line3([d, cc], { lw: 1.2, stroke: INK });
    if (o.katsuogi) for (let u = d[0] + 0.12; u < cc[0]; u += 0.3) k.line3([[u, d[1] - 0.2, zt + 0.12], [u, d[1] + 0.2, zt + 0.12]], { lw: 3.2, stroke: WOOD_D });
    for (const u of [d[0], cc[0]]) { const [x, y] = P(u, d[1], zt + 0.1); c.fillStyle = GOLD; c.beginPath(); c.arc(x, y - 3, 3.6, 0, TAU); c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke(); }
  }
}
// gable roof, ridge along v (gable end on the LEFT / +v face)
export function gableV(k, u, v, z, du, dv, h, col, o = {}) {
  const c = k.ctx, um = u + du / 2;
  fp(k, [[u + du, v, z], [u + du, v + dv, z], [u + du, v + dv, z - 0.13], [u + du, v, z - 0.13]], "#587a68");
  fp(k, [[u + du, v, z], [u + du, v + dv, z], [um, v + dv, z + h], [um, v, z + h]], shade(col, -0.2));
  c.strokeStyle = "rgba(38,62,50,0.42)"; c.lineWidth = 0.75; c.beginPath();
  const n = Math.round(dv / 0.13);
  for (let i = 1; i < n; i++) { const s = i / n, a = P(u + du, v + dv * s, z), b = P(um, v + dv * s, z + h); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
  c.stroke();
  fp(k, [[u, v + dv, z], [u + du, v + dv, z], [um, v + dv, z + h]], o.ped || PLASTER);
  c.strokeStyle = "rgba(90,60,35,0.5)"; c.lineWidth = 1; c.beginPath();
  for (const f of [0.3, 0.5, 0.7]) { const a = P(lerp(u, um, 0.0) + du * f, v + dv, z), b = P(u + du * f, v + dv, z + h * (1 - Math.abs(2 * f - 1))); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
  c.stroke();
  k.line3([[u - 0.05, v + dv + 0.02, z - 0.05], [um, v + dv + 0.02, z + h + 0.05], [u + du + 0.05, v + dv + 0.02, z - 0.05]], { lw: 4.4, stroke: INK });
  k.line3([[u - 0.05, v + dv + 0.02, z - 0.05], [um, v + dv + 0.02, z + h + 0.05], [u + du + 0.05, v + dv + 0.02, z - 0.05]], { lw: 2.8, stroke: "#6f9480" });
  k.line3([[um, v, z + h + 0.04], [um, v + dv, z + h + 0.04]], { lw: 3.4, stroke: "#b8d0bd" });
  if (o.crest !== false) { const [x, y] = P(um, v + dv, z + h * 0.36); kiku(c, x, y, Math.min(7, du * 3.4), GOLD); }
}
// gable roof, ridge along u (gable end on the RIGHT / +u face)
export function gableU(k, u, v, z, du, dv, h, col, o = {}) {
  const c = k.ctx, vm = v + dv / 2;
  fp(k, [[u, v + dv, z], [u + du, v + dv, z], [u + du, v + dv, z - 0.13], [u, v + dv, z - 0.13]], "#6f9480");
  const g = c.createLinearGradient(...P(u, vm, z + h), ...P(u + du / 2, v + dv, z));
  g.addColorStop(0, shade(col, 0.12)); g.addColorStop(1, shade(col, -0.08));
  fp(k, [[u, v + dv, z], [u + du, v + dv, z], [u + du, vm, z + h], [u, vm, z + h]], g);
  c.strokeStyle = "rgba(38,62,50,0.42)"; c.lineWidth = 0.75; c.beginPath();
  const n = Math.round(du / 0.13);
  for (let i = 1; i < n; i++) { const s = i / n, a = P(u + du * s, v + dv, z), b = P(u + du * s, vm, z + h); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
  c.stroke();
  c.strokeStyle = "rgba(230,245,232,0.28)"; c.beginPath();
  for (let j = 1; j < 5; j++) { const f = j / 5, a = P(u, lerp(v + dv, vm, f), lerp(z, z + h, f)), b = P(u + du, lerp(v + dv, vm, f), lerp(z, z + h, f)); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
  c.stroke();
  // pediment on the +u end
  fp(k, [[u + du, v, z], [u + du, v + dv, z], [u + du, vm, z + h]], "#8a5a34");
  c.strokeStyle = "rgba(255,220,160,0.4)"; c.lineWidth = 0.8; c.beginPath();
  for (let i = 1; i < 6; i++) { const f = i / 6, a = P(u + du, lerp(v, v + dv, f), z), b = P(u + du, lerp(v, v + dv, f), z + h * (1 - Math.abs(2 * f - 1))); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
  c.stroke();
  k.line3([[u + du, v - 0.05, z - 0.05], [u + du, vm, z + h + 0.05], [u + du, v + dv + 0.05, z - 0.05]], { lw: 4.4, stroke: INK });
  k.line3([[u + du, v - 0.05, z - 0.05], [u + du, vm, z + h + 0.05], [u + du, v + dv + 0.05, z - 0.05]], { lw: 2.8, stroke: "#6f9480" });
  k.line3([[u, vm, z + h + 0.04], [u + du, vm, z + h + 0.04]], { lw: 3.4, stroke: "#b8d0bd" });
  const [x, y] = P(u + du, vm, z + h * 0.34); kiku(c, x, y, 4.2, GOLD);
}

// ---------------------------------------------------------------- the honden (hall)
const HU0 = 3.1, HU1 = 6.9, BAYS = 6;
export function hall(k, t) {
  const c = k.ctx;
  // stone platform + stairs (down to the forecourt along +v)
  k.box(2.7, 0.5, 0, 4.6, 2.4, 0.4, "#cbc2ae", { hatch: false });
  c.strokeStyle = "rgba(90,80,60,0.35)"; c.lineWidth = 0.7; c.beginPath();
  for (let u = 2.7; u <= 7.3; u += 0.46) { const a = P(u, 2.9, 0), b = P(u, 2.9, 0.4); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
  { const a = P(2.7, 2.9, 0.2), b = P(7.3, 2.9, 0.2); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
  c.stroke();
  // veranda planks
  c.strokeStyle = "rgba(120,100,70,0.3)"; c.lineWidth = 0.6; c.beginPath();
  for (let v = 0.6; v < 2.9; v += 0.2) { const a = P(2.8, v, 0.4), b = P(7.2, v, 0.4); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
  c.stroke();
  [[0.3, 0.22], [0.2, 0.22], [0.1, 0.22]].forEach(([h, dv], i) => k.box(4.3, 2.9 + i * 0.22, 0, 1.4, dv, h, "#d4ccb9", { hatch: false, shadow: false }));
  // body: plastered walls, shoji bays, dark timber columns, entrance
  k.box(HU0, 0.9, 0.4, HU1 - HU0, 1.5, 1.6, PLASTER, { hatch: false });
  const bw = (HU1 - HU0) / BAYS, FV = 2.4;
  for (let i = 0; i < BAYS; i++) {
    const u0 = HU0 + i * bw + 0.07, u1 = HU0 + (i + 1) * bw - 0.07, door = i === 2 || i === 3;
    if (door) {
      fp(k, [[u0, FV, 0.4], [u1, FV, 0.4], [u1, FV, 1.7], [u0, FV, 1.7]], "#3f2a1c", { lw: 1.1 });
      c.strokeStyle = "rgba(226,178,58,0.7)"; c.lineWidth = 1; c.beginPath();
      for (let s = 1; s < 4; s++) { const a = P(lerp(u0, u1, s / 4), FV, 0.45), b = P(lerp(u0, u1, s / 4), FV, 1.65); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
      c.stroke();
    } else {
      fp(k, [[u0, FV, 0.65], [u1, FV, 0.65], [u1, FV, 1.65], [u0, FV, 1.65]], "#f4edd8", { lw: 1.1 });
      c.strokeStyle = "rgba(110,80,50,0.6)"; c.lineWidth = 0.7; c.beginPath();
      for (let s = 1; s < 4; s++) { const a = P(lerp(u0, u1, s / 4), FV, 0.65), b = P(lerp(u0, u1, s / 4), FV, 1.65); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
      for (let s = 1; s < 3; s++) { const a = P(u0, FV, lerp(0.65, 1.65, s / 3)), b = P(u1, FV, lerp(0.65, 1.65, s / 3)); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
      c.stroke();
      fp(k, [[u0, FV, 0.4], [u1, FV, 0.4], [u1, FV, 0.65], [u0, FV, 0.65]], "#a8794a", { lw: 1 });
    }
  }
  // two shoji bays on the right face too
  for (const [v0, v1] of [[1.05, 1.55], [1.7, 2.2]]) fp(k, [[HU1, v0, 0.65], [HU1, v1, 0.65], [HU1, v1, 1.65], [HU1, v0, 1.65]], "#e2d7bb", { lw: 1.1 });
  for (let i = 0; i <= BAYS; i++) k.box(HU0 + i * bw - 0.07, 2.4, 0.4, 0.14, 0.16, 1.6, WOOD_D, { hatch: false, shadow: false });
  k.box(HU0 - 0.15, 2.4, 1.64, HU1 - HU0 + 0.3, 0.22, 0.26, WOOD, { hatch: false, shadow: false });
  // offering box (saisen-bako) in the central bay
  k.box(4.6, 2.0, 0.4, 0.8, 0.28, 0.3, WOOD, { hatch: false, shadow: false });
  c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath();
  for (let s = 1; s < 6; s++) { const a = P(4.6 + s * 0.8 / 6, 2.28, 0.7), b = P(4.6 + s * 0.8 / 6, 2.4, 0.7); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
  c.stroke();
  // main hip roof (copper green, gold ridge ends, katsuogi logs)
  hipRoof(k, 2.4, 0.4, 7.6, 3.2, 2.05, 2.0, 1.4, COP, { katsuogi: true });
}
// entrance gable (chidori-style) + the two porch posts, drawn after people on the veranda
export function porch(k, t) {
  for (const u of [4.1, 5.8]) k.box(u, 2.7, 0.4, 0.14, 0.14, 1.4, WOOD_D, { hatch: false });
  k.box(4.0, 2.65, 1.72, 1.95, 0.24, 0.2, WOOD, { hatch: false, shadow: false });
  gableV(k, 3.85, 2.3, 1.92, 2.3, 1.05, 0.95, COP);
}

// ---------------------------------------------------------------- great torii
export function torii(k, t) {
  const c = k.ctx, VM = 6.6, UL = 3.7, UR = 6.3, HZ = 3.85;
  const grain = (a, b) => { c.strokeStyle = "rgba(90,50,22,0.4)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); };
  // base stones with copper band
  for (const u of [UL, UR]) { k.cyl(u, VM, 0, 0.3, 0.16, "#d8d2c4", { topCol: "#e6e1d4" }); k.cyl(u, VM, 0.16, 0.23, 0.2, "#6f8a6e", { top: false }); }
  // nuki tie beam passing through the pillars + wedges
  k.box(3.0, VM - 0.13, 2.85, 4.0, 0.26, 0.3, WOOD, { hatch: false, shadow: false, left: "#c98d55", right: "#8e5a32", top: "#d9a066" });
  for (const u of [UL, UR]) k.box(u + 0.22, VM - 0.1, 2.88, 0.1, 0.2, 0.24, "#9a6438", { hatch: false, shadow: false });
  // pillars (round, slightly rust coloured) + gakuzuka strut
  for (const u of [UL, UR]) {
    k.cyl(u, VM, 0.36, 0.2, HZ - 0.36, "#c98d55", { top: false });
    const [x, y0] = P(u - 0.1, VM + 0.15, 0.5), [, y1] = P(u - 0.1, VM + 0.15, HZ - 0.1); c.strokeStyle = "rgba(255,230,190,0.5)"; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y0); c.lineTo(x + 1, y1); c.stroke();
    const [gx, gy0] = P(u + 0.07, VM + 0.18, 0.5); grain([gx, gy0], [gx, P(u + 0.07, VM + 0.18, HZ - 0.2)[1]]);
  }
  k.box(4.9, VM - 0.1, HZ - 0.4, 0.2, 0.2, 0.42, "#c98d55", { hatch: false, shadow: false });
  // shimaki (straight) + kasagi (upswept ends, copper cap)
  k.box(3.2, VM - 0.2, HZ - 0.02, 3.6, 0.4, 0.22, WOOD, { hatch: false, shadow: false, left: "#c98d55", right: "#8e5a32", top: "#d9a066" });
  const U0 = 2.85, U1 = 7.15, N = 20, vA = VM - 0.35, vB = VM + 0.35, zb = HZ + 0.2, zt = HZ + 0.58;
  const up = (s) => Math.pow(Math.abs(2 * s - 1), 3) * 0.3;
  const bot = [], top = [];
  for (let i = 0; i <= N; i++) { const s = i / N, u = lerp(U0, U1, s); bot.push([u, vB, zb + up(s) * 0.6]); top.push([u, vB, zt + up(s)]); }
  fp(k, [[U1, vA, zb + up(1) * 0.6], [U1, vB, zb + up(1) * 0.6], [U1, vB, zt + up(1)], [U1, vA, zt + up(1)]], "#8e5a32");
  const lg = c.createLinearGradient(...P(U0, vB, zt), ...P(U1, vB, zb));
  lg.addColorStop(0, "#e2ae74"); lg.addColorStop(0.5, "#c98d55"); lg.addColorStop(1, "#a8683a");
  fp(k, [...top, ...[...bot].reverse()], lg);
  const topA = top.map(([u, , z]) => [u, vA, z + 0.0]);
  fp(k, [...topA, ...[...top].reverse()], "#9aa59a");
  const gx = U0 + ((t * 0.9) % 6) * 1; // a glint running along the copper cap
  if (gx < U1) { const s = (gx - U0) / (U1 - U0), [x, y] = P(gx, VM, zt + up(s) + 0.05); const g = c.createRadialGradient(x, y, 0, x, y, 12); g.addColorStop(0, "rgba(255,255,240,0.55)"); g.addColorStop(1, "rgba(255,255,240,0)"); c.fillStyle = g; c.fillRect(x - 12, y - 12, 24, 24); }
  // three gold chrysanthemum crests on the shimaki
  for (const u of [UL, 5, UR]) { const [x, y] = P(u, VM + 0.2, HZ + 0.09); c.beginPath(); c.arc(x, y, 6.5, 0, TAU); c.fillStyle = GOLD_D; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke(); kiku(c, x, y, 5.6, GOLD); }
}

// ---------------------------------------------------------------- sake barrel wall (kazaridaru)
const RK = { u0: 2.0, u1: 2.7, v0: 4.2, v1: 7.8 };
export function barrels(k, t) {
  const c = k.ctx, { u0, u1, v0, v1 } = RK, LAB = [["#d94a3a", "#3f6fb0"], ["#3f6fb0", "#d94a3a"], ["#4f8f5a", "#e0a03a"], ["#e0a03a", "#4f8f5a"], ["#c9567a", "#3f6fb0"]];
  const TXT = ["菊正", "白鷹", "寿", "福禄", "大関", "鶴", "清酒", "祝", "松竹", "朝日"];
  // stone plinth
  k.box(u0 - 0.1, v0 - 0.1, 0, u1 - u0 + 0.2, v1 - v0 + 0.2, 0.32, "#cbc2ae", { hatch: false });
  c.strokeStyle = "rgba(80,70,55,0.5)"; c.lineWidth = 0.8; c.beginPath();
  for (let r = 0; r < 2; r++) for (let v = v0 - 0.1; v < v1 + 0.1; v += 0.55) { const a = P(u1 + 0.1, v + (r % 2) * 0.27, r * 0.16), b = P(u1 + 0.1, v + (r % 2) * 0.27, r * 0.16 + 0.16); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
  { const a = P(u1 + 0.1, v0 - 0.1, 0.16), b = P(u1 + 0.1, v1 + 0.1, 0.16); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
  c.stroke();
  // back board
  k.box(u0, v0, 0.32, u1 - u0, v1 - v0, 1.78, "#4a3324", { hatch: false, shadow: false });
  const cols = 6, rows = 3, bw = (v1 - v0) / cols, bh = 1.62 / rows;
  for (let r = rows - 1; r >= 0; r--) for (let q = 0; q < cols; q++) {
    const i = r * cols + q, vm = v0 + (q + 0.5) * bw, zc = 0.32 + 0.1 + (r + 0.5) * bh, hw = bw * 0.46, hh = bh * 0.46;
    const pt = (a, b) => P(u1, vm - a, zc - b); // a runs along -v (screen right), b runs down
    const ring = []; for (let s = 0; s < 28; s++) { const th = (s / 28) * TAU, cs = Math.cos(th), sn = Math.sin(th); ring.push(pt(Math.sign(cs) * Math.pow(Math.abs(cs), 0.62) * hw, Math.sign(sn) * Math.pow(Math.abs(sn), 0.62) * hh)); }
    const p0 = pt(0, 0), gR = c.createLinearGradient(pt(-hw, 0)[0], 0, pt(hw, 0)[0], 0);
    gR.addColorStop(0, "#f8eed6"); gR.addColorStop(0.55, "#efe0bd"); gR.addColorStop(1, "#cdb88e");
    k.path(ring, { fill: gR, lw: 1.5, wobble: 0 });
    c.save(); k._trace(ring, true, 0); c.clip();
    const [A, B] = LAB[(i * 3 + r) % LAB.length], cx0 = hw * 0.1, rr = hh * 0.62, motif = (i * 7 + r) % 3;
    if (motif === 0) { c.fillStyle = A; for (let p = 0; p < 12; p++) { const a = (p / 12) * TAU, [x, y] = pt(-hw * 0.28 + Math.cos(a) * rr * 0.5, Math.sin(a) * rr * 0.5); c.beginPath(); c.ellipse(x, y, 4.2, 1.7, a, 0, TAU); c.fill(); } }
    else if (motif === 1) { const [x, y] = pt(-hw * 0.28, 0); c.strokeStyle = A; c.lineWidth = 2.2; for (let j = 0; j < 3; j++) { c.beginPath(); c.ellipse(x, y + 3, 4 + j * 4, 2.4 + j * 2.4, 0, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); } c.fillStyle = B; c.beginPath(); c.arc(x, y - 3, 2.2, 0, TAU); c.fill(); }
    else { const [x, y] = pt(-hw * 0.28, 0); c.fillStyle = A; c.beginPath(); c.arc(x, y, 7, 0, TAU); c.fill(); c.fillStyle = B; c.beginPath(); c.arc(x, y, 3.2, 0, TAU); c.fill(); }
    // vertical brewery text in the barrel's own plane
    const ox = pt(hw * 0.42, -hh * 0.55), ex = pt(hw * 0.42 + 1, -hh * 0.55), ey = pt(hw * 0.42, -hh * 0.55 + 1);
    c.save(); c.transform(ex[0] - ox[0], ex[1] - ox[1], ey[0] - ox[0], ey[1] - ox[1], ox[0], ox[1]); c.scale(0.01, 0.01);
    c.fillStyle = "#231a14"; c.font = `bold 20px ${FONT}`; c.textAlign = "center"; c.textBaseline = "middle";
    [...TXT[i % TXT.length]].forEach((ch, j) => c.fillText(ch, 0, j * 24 + 12));
    c.restore();
    // straw rope bands
    c.strokeStyle = "#8a6a3a"; c.lineWidth = 2.4; c.beginPath();
    for (const f of [-0.78, 0.78]) { const a = pt(-hw, hh * f), b = pt(hw, hh * f); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
    c.stroke();
    void p0; void cx0;
    c.restore();
  }
  // wooden posts + tiled roof (gable ridge along v)
  for (let i = 0; i <= 4; i++) k.box(u1 - 0.02, v0 + i * (v1 - v0) / 4 - 0.07, 0.32, 0.1, 0.14, 1.78, WOOD, { hatch: false, shadow: false });
  k.box(u1 - 0.02, v0 - 0.07, 2.04, 0.1, v1 - v0 + 0.14, 0.12, "#a86f40", { hatch: false, shadow: false });
  gableV(k, 1.7, v0 - 0.2, 2.16, 1.3, v1 - v0 + 0.4, 0.55, COP, { ped: "#8a5a34", crest: true });
}
export const RACK = RK;

// ---------------------------------------------------------------- temizuya (purification pavilion)
export const TZ = { u0: 7.1, u1: 9.3, v0: 4.95, v1: 7.1 };
const post = (k, u, v, h) => { k.box(u - 0.08, v - 0.08, 0.1, 0.16, 0.16, h, WOOD, { hatch: false, shadow: false }); k.box(u - 0.14, v - 0.14, 0.1, 0.28, 0.28, 0.1, "#d8d0bf", { hatch: false, shadow: false }); };
export function temizuyaBack(k, t) {
  const c = k.ctx;
  k.box(7.3, 5.1, 0, 2.0, 1.95, 0.1, "#d4ccb9", { hatch: false });
  c.strokeStyle = "rgba(90,80,60,0.4)"; c.lineWidth = 0.7; c.beginPath();
  for (let u = 7.7; u < 9.3; u += 0.4) { const a = P(u, 5.1, 0.1), b = P(u, 7.05, 0.1); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
  for (let v = 5.5; v < 7.0; v += 0.4) { const a = P(7.3, v, 0.1), b = P(9.3, v, 0.1); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
  c.stroke();
  for (const [pu, pv] of [[7.45, 5.25], [9.15, 5.25], [7.45, 6.9]]) post(k, pu, pv, 2.1);
  // basin (granite block, water, ladles rack)
  k.box(7.95, 5.55, 0.1, 1.05, 0.75, 0.5, "#b9b5aa", { hatch: false, shadow: false, top: false });
  fp(k, [[7.95, 5.55, 0.6], [9.0, 5.55, 0.6], [9.0, 6.3, 0.6], [7.95, 6.3, 0.6]], "#a9a497", { lw: 1.1 });
  fp(k, [[8.05, 5.63, 0.6], [8.9, 5.63, 0.6], [8.9, 6.22, 0.6], [8.05, 6.22, 0.6]], "#5f9da4", { lw: 0.9 });
  for (let i = 0; i < 3; i++) { const f = (t * 0.6 + i / 3) % 1, [x, y] = P(8.2 + i * 0.25, 5.9, 0.6); c.strokeStyle = `rgba(255,255,255,${0.75 * (1 - f)})`; c.lineWidth = 0.9; c.beginPath(); c.ellipse(x, y, 3 + f * 9, 1.4 + f * 4, 0, 0, TAU); c.stroke(); }
  for (let i = 0; i < 4; i++) { const [x, y] = P(8.05 + i * 0.22, 5.55, 0.66), [x2, y2] = P(8.15 + i * 0.22, 6.2, 0.66); c.strokeStyle = INK; c.lineWidth = 2.6; c.lineCap = "round"; c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke(); c.strokeStyle = "#e3c776"; c.lineWidth = 1.2; c.stroke(); }
  // bamboo spout with a running trickle
  { const [x, y] = P(9.1, 5.9, 0.95), [x2, y2] = P(8.7, 5.9, 0.88); c.strokeStyle = INK; c.lineWidth = 4; c.lineCap = "round"; c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke(); c.strokeStyle = "#8fae5a"; c.lineWidth = 2.2; c.stroke();
    c.strokeStyle = "rgba(190,235,245,0.9)"; c.lineWidth = 1.3; c.setLineDash([3, 3]); c.lineDashOffset = -t * 14; c.beginPath(); c.moveTo(x2, y2); c.lineTo(x2, P(8.7, 5.9, 0.62)[1]); c.stroke(); c.setLineDash([]); }
}
export function temizuyaFront(k, t) {
  post(k, 9.15, 6.9, 2.1);
  k.box(7.3, 6.9, 2.05, 1.95, 0.16, 0.2, WOOD, { hatch: false, shadow: false });
  k.box(9.14, 5.1, 2.05, 0.16, 1.9, 0.2, WOOD_D, { hatch: false, shadow: false });
  gableU(k, TZ.u0, TZ.v0, 2.25, TZ.u1 - TZ.u0, TZ.v1 - TZ.v0, 0.95, COP);
}

// ---------------------------------------------------------------- cedar forest
const TONE = { low: ["#3b5531", "#536e30", "#718a34"], mid: ["#536e30", "#718a34", "#a2ac3c"], high: ["#536e30", "#a2ac3c", "#d3c64c"], shade: ["#2a3f2a", "#3b5531", "#536e30"] };
function trunk(k, T, topZ) {
  const c = k.ctx, w0 = T.w / 2, w1 = Math.max(2, T.w * 0.24), lean = T.lean || 0;
  const [bx, by] = P(T.u, T.v, 0), [tx, ty] = P(T.u + lean, T.v, topZ);
  c.fillStyle = "rgba(60,45,30,0.16)"; c.beginPath(); c.ellipse(bx + 6, by + 1, T.w * 1.2, T.w * 0.35, 0, 0, TAU); c.fill();
  const pts = [[bx - w0 * 1.25, by], [bx - w0, by - 8], [tx - w1, ty], [tx + w1, ty], [bx + w0, by - 8], [bx + w0 * 1.25, by]];
  const g = c.createLinearGradient(bx - w0, 0, bx + w0, 0); g.addColorStop(0, "#c98552"); g.addColorStop(0.35, "#a8623a"); g.addColorStop(1, "#5e3420");
  k.path(pts, { fill: g, lw: 1.4, wobble: 0 });
  c.save(); k._trace(pts, true, 0); c.clip(); c.strokeStyle = "rgba(55,26,12,0.45)"; c.lineWidth = 0.9; c.beginPath();
  for (let i = -3; i <= 3; i++) { c.moveTo(bx + i * w0 * 0.3, by); c.lineTo(tx + i * w1 * 0.3, ty); }
  c.stroke(); c.strokeStyle = "rgba(255,210,160,0.35)"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(bx - w0 * 0.55, by - 6); c.lineTo(tx - w1 * 0.5, ty); c.stroke(); c.restore();
  c.fillStyle = "rgba(120,150,60,0.7)"; for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(bx + (hash(T.seed + i) - 0.5) * T.w, by - 3 - hash(T.seed * 2 + i) * 10, 3, 1.6, 0, 0, TAU); c.fill(); }
}
export function cedar(k, t, T) {
  const c = k.ctx, R = rng(T.seed * 97 + 13), lean = T.lean || 0;
  if (T.kind === "kusu") {
    trunk(k, T, T.h * 0.62);
    const sw = Math.sin(t * 0.8 + T.seed) * 1.4;
    const n = 6, list = [];
    for (let i = 0; i < n; i++) { const a = Math.PI * (1.05 + (i / (n - 1)) * 0.9) + (R() - 0.5) * 0.3, d = 0.35 + R() * 0.6; list.push([a, d, T.R * (0.7 + R() * 0.4)]); }
    const [ax, ay] = P(T.u, T.v, T.h * 0.78);
    const cy = ay;
    list.forEach(([a, d, pw], i) => { const x = ax + Math.cos(a) * T.R * d + sw * 0.5, y = cy + Math.sin(a) * T.R * 0.55 * d + T.R * 0.1; pad(c, x, y, pw, pw * 0.42, i % 2 ? TONE.high : TONE.mid, T.seed * 131 + i * 7, 0.75); });
    pad(c, ax + sw * 0.4, cy + T.R * 0.2, T.R * 1.1, T.R * 0.45, TONE.low, T.seed * 131 + 99, 0.75);
    return;
  }
  trunk(k, T, T.h - 0.12);
  const span = (T.h - 0.9) * 0.64, tiers = Math.max(4, Math.round(span * 42.3 / 18)), sw = Math.sin(t * 0.8 + T.seed) * 1.5, sw2 = Math.sin(t * 1.7 + T.seed * 2) * 0.5;
  c.lineCap = "round";
  for (let i = 0; i < tiers; i++) {
    const f = i / (tiers - 1), z = T.h - 0.12 - f * span, reach = T.R * (0.22 + 0.78 * Math.pow(f, 0.7)) * (0.8 + R() * 0.4);
    const sides = f < 0.12 ? [0] : R() < 0.6 ? [-1, 1] : [i % 2 ? 1 : -1, 0];
    const [ax, ay] = P(T.u + lean * z / T.h, T.v, z), dx = (sw + sw2) * (1 - f * 0.7);
    for (const sd of sides) {
      const px = ax + sd * reach * (0.6 + R() * 0.3), pw = 16 + reach * 0.6 + R() * 10, ph = 8 + pw * 0.22;
      const tone = (T.dim ? 1 : 0) ? "shade" : f < 0.45 ? "high" : f < 0.75 ? (R() < 0.55 ? "high" : "mid") : R() < 0.5 ? "mid" : "low";
      if (sd) { c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.moveTo(ax, ay + 12); c.lineTo(px - sd * pw * 0.15 + dx, ay + 1); c.stroke(); c.strokeStyle = "#94552f"; c.lineWidth = 1.8; c.stroke(); }
      pad(c, px + dx, ay, pw, ph, TONE[tone], T.seed * 131 + i * 7 + (sd + 1), 0.75);
    }
  }
}
const blocked = (u, v, m = 0) =>
  (u > 3.3 - m && u < 6.7 + m && v > 3.1 - m) ||            // avenue corridor incl. fences + lanterns
  (u > 2.2 - m && u < 7.8 + m && v < 3.6 + m) ||            // hall + stairs
  (u > 1.45 - m && u < 3.2 + m && v > 3.75 - m && v < 8.2 + m) || // barrel rack
  (u > 6.7 - m && u < 9.5 + m && v > 4.4 - m && v < 7.5 + m) ||
  (u > 7.2 - m && u < 8.8 + m && v < 4.4 + m) ||
  (v > 7.2 && u > 6.3);    // temizuya
export const TREES = (() => {
  const R = rng(5), out = []; let seed = 100;
  for (let gv = 0.55; gv < 9.6; gv += 0.92) for (let gu = 0.5; gu < 9.6; gu += 0.98) {
    const u = gu + (R() - 0.5) * 0.55, v = gv + (R() - 0.5) * 0.5, a = R(), b = R(), c2 = R();
    if (u < 0.45 || u > 9.55 || v < 0.45 || v > 9.55 || blocked(u, v)) continue;
    seed++;
    if (v > 7.4) out.push({ u, v, h: 2.3 + a * 0.8, R: 26 + b * 8, w: 10, kind: "kusu", seed, lean: 0 });
    else out.push({ u, v, h: 4.0 + a * 2.2, R: 46 + b * 20, w: 12 + b * 5, kind: c2 < 0.8 ? "sugi" : "kusu", seed, lean: (c2 - 0.5) * 0.3 });
  }
  return out;
})();
export const UNDER = (() => {
  const R = rng(77), out = [];
  for (let v = 3.3; v < 9.6; v += 0.78) for (let u = 0.45; u < 9.6; u += 0.85) {
    const x = u + (R() - 0.5) * 0.5, y = v + (R() - 0.5) * 0.45, r = 10 + R() * 7, f = R() < 0.22 ? 3 + Math.floor(R() * 4) : 0;
    if (x < 0.45 || x > 9.55 || y > 9.55 || blocked(x, y, 0.25)) continue;
    out.push([x, y, r, f, Math.round(x * 71 + y * 33)]);
  }
  return out;
})();
export const ROCKS = [[1.2, 6.8, 12], [0.9, 4.6, 9], [3.05, 8.9, 10], [8.9, 8.3, 12], [7.4, 8.4, 10], [9.1, 3.8, 11], [6.9, 3.7, 9]];
