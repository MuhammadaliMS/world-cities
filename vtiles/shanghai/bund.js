// SHANGHAI · The Bund facade row, rebuilt on the grid (grid pass).
// Five axis-aligned buildings stand side by side along u across the back of the tile (v 0.7 - 3.1). Every
// main facade is on the LEFT face (v+ side, facing the river), every end wall on the RIGHT face (u+ side).
//   HSBC (u 0.4-3.2) dome + portico | narrow bank (3.2-4.1) | Customs House (4.1-6.3) clock tower |
//   narrow bank (6.3-7.2) | Peace Hotel (7.2-9.6) green pyramid.
// Everything goes through P(); the clock faces are drawn on the vertical planes of the tower.
import { P, CTS, INK, shade, mix, lerp, clamp, hash } from "./_props.js";

export const ST = "#ead09c", ST_L = "#f5e2b8", ST_D = "#d2b27c", GRANITE = "#cdb48a", SLATE = "#6f7f96", VERD = "#79ad8f";
const GL = "#566a80", GD = "#3b4c60", LIT = "#f3d57a";

// ---------- primitives (all through P) ----------
const pg = (k, pts3, fill, lw = 0.9) => k.poly(pts3, fill, { lw, wobble: 0 });
// axis-aligned box: right face (u1), left face (v1), top
function bx(k, u0, u1, v0, v1, z0, z1, col, o = {}) {
  const lw = o.lw ?? 1;
  if (o.noR !== true) pg(k, [[u1, v0, z0], [u1, v1, z0], [u1, v1, z1], [u1, v0, z1]], o.right || shade(col, -0.17), lw);
  pg(k, [[u0, v1, z0], [u1, v1, z0], [u1, v1, z1], [u0, v1, z1]], o.left || col, lw);
  if (o.noTop !== true) pg(k, [[u0, v0, z1], [u1, v0, z1], [u1, v1, z1], [u0, v1, z1]], o.top || shade(col, 0.1), lw);
}
const face = (side, c) => (side === "L" ? (a, z) => [a, c, z] : (a, z) => [c, a, z]);
function outline(F, a, z, w, h, arch) {
  const pts = [F(a - w / 2, z), F(a + w / 2, z)];
  if (arch) {
    const zs = z + h - w / 2; pts.push(F(a + w / 2, zs));
    for (let i = 1; i < 8; i++) { const th = (i / 8) * Math.PI; pts.push(F(a + Math.cos(th) * w / 2, zs + Math.sin(th) * w / 2)); }
    pts.push(F(a - w / 2, zs));
  } else pts.push(F(a + w / 2, z + h), F(a - w / 2, z + h));
  return pts.map((p) => P(...p));
}
function win(k, F, a, z, w, h, o = {}) {
  const dk = o.dk, c = k.ctx, lit = o.lit && hash((o.seed || 0) + a * 17.3 + z * 31.1) < o.lit;
  if (o.sur !== false) k.path(outline(F, a, z - 0.02, w + 0.07, h + 0.05, o.arch), { fill: dk ? shade(o.surCol || ST_L, -0.2) : o.surCol || ST_L, lw: 0.6, wobble: 0 });
  k.path(outline(F, a, z, w, h, o.arch), { fill: lit ? LIT : dk ? GD : GL, lw: 0.7, wobble: 0 });
  c.strokeStyle = "rgba(20,30,40,0.55)"; c.lineWidth = 0.6; c.beginPath();
  const zs = o.arch ? z + h - w / 2 : z + h;
  c.moveTo(...P(...F(a, z))); c.lineTo(...P(...F(a, zs + (o.arch ? w / 2 : 0))));
  if (h > 0.3) { c.moveTo(...P(...F(a - w / 2, z + h * 0.45))); c.lineTo(...P(...F(a + w / 2, z + h * 0.45))); }
  c.stroke();
  if (o.sill !== false) { c.strokeStyle = dk ? shade(ST_D, -0.2) : ST_D; c.lineWidth = 1.5; c.beginPath(); c.moveTo(...P(...F(a - w / 2 - 0.04, z - 0.02))); c.lineTo(...P(...F(a + w / 2 + 0.04, z - 0.02))); c.stroke(); }
}
// window grid on a face: side L (plane v = c, runs along u) or R (plane u = c, runs along v)
function wins(k, side, c, a0, a1, zs, cols, w, h, o = {}) {
  const F = face(side, c), st = (a1 - a0) / cols;
  for (const z of zs) for (let i = 0; i < cols; i++) win(k, F, a0 + (i + 0.5) * st, z, w, h, { ...o, dk: side === "R" });
}
// stone course lines (rustication / bands)
function course(k, side, c, a0, a1, z0, z1, step, alpha = 0.28) {
  const F = face(side, c), cx = k.ctx; cx.strokeStyle = `rgba(110,78,40,${alpha})`; cx.lineWidth = 0.8; cx.beginPath();
  for (let z = z0 + step; z < z1 - 0.01; z += step) { cx.moveTo(...P(...F(a0, z))); cx.lineTo(...P(...F(a1, z))); }
  cx.stroke();
}
// pilaster strip standing proud of a facade
function pil(k, side, c, a, w, z0, z1, col = ST_L) {
  if (side === "L") bx(k, a - w / 2, a + w / 2, c, c + 0.07, z0, z1, col, { lw: 0.7 });
  else bx(k, c, c + 0.07, a - w / 2, a + w / 2, z0, z1, col, { lw: 0.7 });
}
const cornice = (k, u0, u1, v0, v1, z, h = 0.16, col = ST_L) => bx(k, u0 - 0.07, u1 + 0.07, v0 - 0.02, v1 + 0.09, z, z + h, col, { lw: 0.8 });
function balus(k, u0, u1, v, z, h = 0.2) {
  const c = k.ctx; c.strokeStyle = "#8a6c40"; c.lineWidth = 1.1; c.beginPath();
  for (let u = u0; u <= u1 + 0.001; u += 0.1) { c.moveTo(...P(u, v, z)); c.lineTo(...P(u, v, z + h)); }
  c.stroke();
  bx(k, u0, u1, v - 0.03, v + 0.03, z + h, z + h + 0.05, ST_L, { lw: 0.6 });
}
function slateHip(k, u, v, z, du, dv, h, inset, o = {}) {
  k.hip(u, v, z, du, dv, h, o.col || SLATE, { inset });
  // slate courses on the left slope
  const c = k.ctx; c.strokeStyle = "rgba(25,35,55,0.35)"; c.lineWidth = 0.7; c.beginPath();
  for (let i = 1; i < 4; i++) { const f = (i / 4) * (h > 0 ? 1 : 0), vv = v + dv - inset * f; c.moveTo(...P(u + inset * f, vv, z + h * f)); c.lineTo(...P(u + du - inset * f, vv, z + h * f)); }
  c.stroke();
}
function dormer(k, a, v, z, o = {}) {
  const w = o.w ?? 0.2, d = o.d ?? 0.2, h = o.h ?? 0.22, col = o.col || ST_L, roof = o.roof || shade(col, -0.05);
  bx(k, a - w / 2, a + w / 2, v - d, v, z, z + h, col, { lw: 0.7, top: col });
  win(k, face("L", v), a, z + 0.04, w * 0.5, h * 0.62, { sur: false, sill: false, arch: o.arch });
  pg(k, [[a + w / 2 + 0.02, v - d, z + h], [a + w / 2 + 0.02, v + 0.02, z + h], [a, v + 0.02, z + h + w * 0.55], [a, v - d, z + h + w * 0.55]], shade(roof, -0.18), 0.6);
  pg(k, [[a - w / 2 - 0.02, v + 0.02, z + h], [a + w / 2 + 0.02, v + 0.02, z + h], [a, v + 0.02, z + h + w * 0.55]], roof, 0.6);
}
function chimney(k, u, v, z, h) { bx(k, u - 0.08, u + 0.08, v - 0.08, v + 0.08, z, z + h, "#d9b98a", { lw: 0.7 }); bx(k, u - 0.1, u + 0.1, v - 0.1, v + 0.1, z + h, z + h + 0.05, ST_L, { lw: 0.6 }); }
// column (round shaft in screen space, cap + base through P)
function column(k, u, v, z0, z1, r = 0.085, col = "#f3e3bf") {
  k.cyl(u, v, z0, r, z1 - z0, col, { top: false });
  bx(k, u - r * 1.3, u + r * 1.3, v - r * 1.3, v + r * 1.3, z1 - 0.07, z1, ST_L, { lw: 0.6 });
  bx(k, u - r * 1.3, u + r * 1.3, v - r * 1.3, v + r * 1.3, z0, z0 + 0.06, ST_D, { lw: 0.6 });
}
// four-sided pyramid roof (square-ish base) with standing seams
function pyramid(k, u0, u1, v0, v1, z, h, col, o = {}) {
  const au = (u0 + u1) / 2 + (o.du || 0), av = (v0 + v1) / 2 + (o.dv || 0), zt = z + h, c = k.ctx;
  pg(k, [[u1, v0, z], [u1, v1, z], [au, av, zt]], shade(col, -0.22), 1.1);
  pg(k, [[u0, v1, z], [u1, v1, z], [au, av, zt]], col, 1.1);
  c.lineCap = "round";
  const n = o.seams ?? 6; c.strokeStyle = o.seamCol || "rgba(30,70,55,0.38)"; c.lineWidth = 0.8; c.beginPath();
  for (let i = 1; i < n; i++) { c.moveTo(...P(lerp(u0, u1, i / n), v1, z)); c.lineTo(...P(au, av, zt)); }
  c.stroke();
  c.strokeStyle = o.seamCol || "rgba(30,70,55,0.3)"; c.beginPath();
  for (let i = 1; i < 5; i++) { const f = i / 5; c.moveTo(...P(lerp(u0, au, f), lerp(v1, av, f), z + h * f)); c.lineTo(...P(lerp(u1, au, f), lerp(v1, av, f), z + h * f)); }
  c.stroke();
}
// clock disc drawn on a vertical plane: L (along +u) or R (along -v as it reads left to right)
function clockOn(k, side, c0, a, z, r, t, ph) {
  const cx = k.ctx, [x, y] = P(...face(side, c0)(a, z)), S = CTS.S;
  cx.save(); cx.translate(x, y);
  if (side === "L") cx.transform(S, S * CTS.YS, 0, -S * CTS.ZS, 0, 0); else cx.transform(S, -S * CTS.YS, 0, -S * CTS.ZS, 0, 0);
  cx.beginPath(); cx.arc(0, 0, r * 1.2, 0, 7); cx.fillStyle = "#c9a96a"; cx.fill(); cx.lineWidth = 0.03; cx.strokeStyle = INK; cx.stroke();
  cx.beginPath(); cx.arc(0, 0, r, 0, 7); cx.fillStyle = "#fbf6e6"; cx.fill(); cx.lineWidth = 0.035; cx.stroke();
  cx.lineWidth = 0.022; for (let i = 0; i < 12; i++) { const an = (i / 12) * 6.283, r0 = i % 3 ? 0.84 : 0.72; cx.beginPath(); cx.moveTo(Math.sin(an) * r * r0, Math.cos(an) * r * r0); cx.lineTo(Math.sin(an) * r * 0.94, Math.cos(an) * r * 0.94); cx.stroke(); }
  const m = t * 0.5 + ph, hh = m / 12 + 1.9;
  cx.lineCap = "round"; cx.lineWidth = 0.04; cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(Math.sin(m) * r * 0.82, Math.cos(m) * r * 0.82); cx.stroke();
  cx.lineWidth = 0.06; cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(Math.sin(hh) * r * 0.52, Math.cos(hh) * r * 0.52); cx.stroke();
  cx.beginPath(); cx.arc(0, 0, r * 0.08, 0, 7); cx.fillStyle = INK; cx.fill();
  cx.restore();
}
const spire = (k, u, v, z0, z1, ball = true) => {
  const c = k.ctx, [x, y0] = P(u, v, z0), [, y1] = P(u, v, z1);
  c.strokeStyle = INK; c.lineWidth = 2; c.lineCap = "round"; c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke(); c.strokeStyle = "#caa65a"; c.lineWidth = 1; c.stroke();
  if (ball) { c.fillStyle = "#e6c36a"; c.beginPath(); c.arc(x, y0 - (y0 - y1) * 0.55, 2.4, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke(); }
};

// ---------- HSBC: u 0.4-3.2, v 0.7-3.1 ----------
function hsbc(k, t) {
  const U0 = 0.4, U1 = 3.2, V0 = 0.7, V1 = 3.1, ZT = 3.1;
  bx(k, U0 - 0.05, U1 + 0.05, V0 - 0.05, V1 + 0.05, 0, 0.12, GRANITE, { lw: 0.8 });
  bx(k, U0, U1, V0, V1, 0.12, ZT, ST);
  // ground floor rustication + arched windows, upper floors
  course(k, "L", V1, U0, U1, 0.12, 1.1, 0.19); course(k, "R", U1, V0, V1, 0.12, 1.1, 0.19);
  wins(k, "L", V1, U0 + 0.1, U1 - 0.1, [0.32], 8, 0.17, 0.62, { arch: true, sur: false });
  wins(k, "L", V1, U0 + 0.1, U1 - 0.1, [1.28, 1.88, 2.46], 8, 0.16, 0.42, { lit: 0.1, seed: 4 });
  wins(k, "R", U1, V0 + 0.1, V1 - 0.1, [0.32], 4, 0.17, 0.62, { arch: true, sur: false });
  wins(k, "R", U1, V0 + 0.1, V1 - 0.1, [1.28, 1.88, 2.46], 4, 0.16, 0.42, { lit: 0.1, seed: 5 });
  for (const a of [U0 + 0.1, 1.15, 2.45, U1 - 0.1]) pil(k, "L", V1, a, 0.13, 1.1, ZT - 0.02);
  for (const a of [V0 + 0.1, V1 - 0.1]) pil(k, "R", U1, a, 0.13, 1.1, ZT - 0.02);
  course(k, "L", V1, U0, U1, 1.08, 1.12, 0.1, 0.5);
  cornice(k, U0, U1, V0, V1, ZT, 0.17);
  // end pavilions: slate hip roofs with dormers + chimneys
  slateHip(k, U0, V0, ZT + 0.17, 0.78, V1 - V0, 0.62, 0.2);
  slateHip(k, 2.42, V0, ZT + 0.17, 0.78, V1 - V0, 0.62, 0.2);
  for (const a of [U0 + 0.28, U0 + 0.55, 2.7, 2.97]) dormer(k, a, V1 - 0.06, ZT + 0.22, { w: 0.16, d: 0.16, h: 0.2, roof: SLATE });
  chimney(k, 0.72, 1.4, ZT + 0.55, 0.38); chimney(k, 2.9, 1.5, ZT + 0.55, 0.38);
  // middle roof terrace + balustrade
  k.poly([[1.18, V0 + 0.02, ZT + 0.17], [2.42, V0 + 0.02, ZT + 0.17], [2.42, V1 + 0.02, ZT + 0.17], [1.18, V1 + 0.02, ZT + 0.17]], "#d8c294", { lw: 0.8, wobble: 0 });
  balus(k, 1.18, 2.42, V1 + 0.02, ZT + 0.17, 0.22);
  // drum + dome behind the portico
  const DU = 1.8, DV = 1.95;
  bx(k, DU - 0.88, DU + 0.88, DV - 0.88, DV + 0.88, ZT + 0.17, ZT + 0.5, ST, { lw: 0.9 });
  bx(k, DU - 0.91, DU + 0.91, DV - 0.91, DV + 0.91, ZT + 0.5, ZT + 0.58, ST_L, { lw: 0.8 });
  k.cyl(DU, DV, ZT + 0.6, 0.78, 0.82, "#efd9a8", { top: false });
  { // drum windows + pilasters, drawn in screen space around projected anchors
    const c = k.ctx;
    for (const th of [-0.3, 0.25, 0.8, 1.35, 1.9]) {
      const [x, y] = P(DU + Math.cos(th) * 0.78, DV + Math.sin(th) * 0.78, ZT + 0.98), wd = 3.6 * Math.max(0.5, Math.cos(th - 0.75) * 0.6 + 0.55);
      c.fillStyle = "#4d6076"; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x - wd, y + 7); c.lineTo(x - wd, y - 4); c.quadraticCurveTo(x, y - 12, x + wd, y - 4); c.lineTo(x + wd, y + 7); c.closePath(); c.fill(); c.stroke();
    }
  }
  k.cyl(DU, DV, ZT + 1.42, 0.83, 0.1, ST_L, { top: false });
  k.dome(DU, DV, ZT + 1.52, 0.78, 1.1, "#e9d3a2", { ribs: 8 });
  k.cyl(DU, DV, ZT + 2.58, 0.2, 0.34, ST_L);
  k.dome(DU, DV, ZT + 2.92, 0.2, 0.22, "#e9d3a2");
  spire(k, DU, DV, ZT + 3.1, ZT + 3.85);
  // portico: platform, steps, recessed door, six columns, entablature, pediment
  const PU0 = 1.2, PU1 = 2.4, PV = 3.52;
  k.poly([[PU0 + 0.1, V1, 0.3], [PU1 - 0.1, V1, 0.3], [PU1 - 0.1, V1, 2.4], [PU0 + 0.1, V1, 2.4]], "rgba(70,50,28,0.35)", { stroke: false });
  win(k, face("L", V1 + 0.005), 1.8, 0.3, 0.42, 1.0, { arch: true, sur: true, lit: 0, seed: 1 });
  wins(k, "L", V1 + 0.005, 1.35, 2.25, [1.3, 1.85], 3, 0.15, 0.4, { sur: false });
  bx(k, PU0 - 0.05, PU1 + 0.05, V1, PV, 0, 0.3, GRANITE, { lw: 0.9 });
  bx(k, 1.6, 2.0, PV, PV + 0.2, 0, 0.12, GRANITE, { lw: 0.7 }); bx(k, 1.5, 2.1, PV + 0.2, PV + 0.34, 0, 0.06, GRANITE, { lw: 0.7 });
  for (let i = 5; i >= 0; i--) column(k, PU0 + 0.1 + i * 0.2, PV - 0.12, 0.3, 2.4);
  column(k, PU1 - 0.1, 3.3, 0.3, 2.4, 0.075);
  bx(k, PU0 - 0.05, PU1 + 0.05, V1 - 0.02, PV + 0.03, 2.4, 2.64, ST_L, { lw: 0.8 });
  k.gable(PU0 - 0.05, V1 - 0.02, 2.64, PU1 - PU0 + 0.1, PV - V1 + 0.05, 0.45, "#ecd9ac", { ridge: "v" });
  { const [x, y] = P(1.8, PV + 0.03, 2.82); const c = k.ctx; c.fillStyle = "#d8bc84"; c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.ellipse(x, y, 7, 4.4, 0, 0, 7); c.fill(); c.stroke(); }
}

// ---------- narrow banks ----------
function bank(k, U0, U1, V0, V1, ZT, o = {}) {
  const col = o.col || "#e6c993", ar = o.arch;
  bx(k, U0 - 0.04, U1 + 0.04, V0 - 0.04, V1 + 0.04, 0, 0.1, GRANITE, { lw: 0.7 });
  bx(k, U0, U1, V0, V1, 0.1, ZT, col);
  course(k, "L", V1, U0, U1, 0.1, 1.0, 0.18); course(k, "R", U1, V0, V1, 0.1, 1.0, 0.18);
  const cols = o.cols ?? 3, zs = o.zs;
  wins(k, "L", V1, U0 + 0.06, U1 - 0.06, [0.3], cols, 0.17, 0.58, { arch: true, sur: false });
  wins(k, "L", V1, U0 + 0.06, U1 - 0.06, zs, cols, 0.17, 0.4, { arch: ar, lit: 0.12, seed: o.seed });
  wins(k, "R", U1, V0 + 0.2, V1 - 0.2, [0.3], 2, 0.17, 0.58, { arch: true, sur: false });
  wins(k, "R", U1, V0 + 0.2, V1 - 0.2, zs, 2, 0.17, 0.4, { arch: ar, lit: 0.12, seed: o.seed + 1 });
  pil(k, "L", V1, U0 + 0.06, 0.1, 0.9, ZT - 0.02); pil(k, "L", V1, U1 - 0.06, 0.1, 0.9, ZT - 0.02);
  cornice(k, U0, U1, V0, V1, ZT, 0.15);
  if (o.mansard) {
    slateHip(k, U0, V0, ZT + 0.15, U1 - U0, V1 - V0, o.mansard, 0.18);
    dormer(k, (U0 + U1) / 2 - 0.2, V1 - 0.06, ZT + 0.2, { w: 0.15, d: 0.15, h: 0.18, roof: SLATE });
    dormer(k, (U0 + U1) / 2 + 0.2, V1 - 0.06, ZT + 0.2, { w: 0.15, d: 0.15, h: 0.18, roof: SLATE });
  } else {
    balus(k, U0, U1, V1 + 0.05, ZT + 0.15, 0.18);
    k.poly([[U0, V0, ZT + 0.15], [U1, V0, ZT + 0.15], [U1, V1 + 0.05, ZT + 0.15], [U0, V1 + 0.05, ZT + 0.15]], "#8a99ad", { lw: 0.7, wobble: 0 });
    bx(k, U0 + 0.2, U1 - 0.2, V0 + 0.3, V1 - 0.5, ZT + 0.15, ZT + 0.55, "#d9b98a", { lw: 0.8 });
    chimney(k, U0 + 0.25, V0 + 0.4, ZT + 0.15, 0.4);
  }
}

// ---------- Customs House: u 4.1-6.3, clock tower over the middle ----------
function customs(k, t) {
  const U0 = 4.1, U1 = 6.3, V0 = 0.8, V1 = 3.1, ZT = 3.95;
  bx(k, U0 - 0.05, U1 + 0.05, V0 - 0.05, V1 + 0.05, 0, 0.12, GRANITE, { lw: 0.8 });
  bx(k, U0, U1, V0, V1, 0.12, ZT, "#eed3a0");
  course(k, "L", V1, U0, U1, 0.12, 1.2, 0.2); course(k, "R", U1, V0, V1, 0.12, 1.2, 0.2);
  wins(k, "L", V1, U0 + 0.1, U1 - 0.1, [0.3], 6, 0.17, 0.66, { arch: true, sur: false });
  wins(k, "L", V1, U0 + 0.1, U1 - 0.1, [1.42, 2.0, 2.58, 3.16], 6, 0.17, 0.42, { lit: 0.1, seed: 9 });
  wins(k, "R", U1, V0 + 0.1, V1 - 0.1, [0.3], 5, 0.17, 0.66, { arch: true, sur: false });
  wins(k, "R", U1, V0 + 0.1, V1 - 0.1, [1.42, 2.0, 2.58, 3.16], 5, 0.17, 0.42, { lit: 0.1, seed: 10 });
  course(k, "L", V1, U0, U1, 1.3, 1.34, 0.1, 0.5);
  // central pavilion on the facade: proud block, big order of pilasters, ground colonnade
  const CU0 = 4.65, CU1 = 5.75, CV = 3.3;
  bx(k, CU0, CU1, V1, CV, 0.12, ZT, "#f0d8a8", { lw: 0.9 });
  course(k, "L", CV, CU0, CU1, 0.12, 1.2, 0.2);
  wins(k, "L", CV, CU0 + 0.15, CU1 - 0.15, [1.5, 2.1, 2.7], 3, 0.17, 0.5, { lit: 0.1, seed: 3 });
  for (const a of [CU0 + 0.07, (CU0 + CU1) / 2 - 0.2, (CU0 + CU1) / 2 + 0.2, CU1 - 0.07]) pil(k, "L", CV, a, 0.1, 1.3, ZT - 0.02);
  // ground-floor loggia: dark recess, four columns, arches
  k.poly([[CU0 + 0.1, CV, 0.12], [CU1 - 0.1, CV, 0.12], [CU1 - 0.1, CV, 1.25], [CU0 + 0.1, CV, 1.25]], "rgba(60,42,24,0.55)", { stroke: false });
  for (let i = 3; i >= 0; i--) column(k, CU0 + 0.15 + i * 0.267, CV + 0.1, 0.12, 1.2, 0.07);
  bx(k, CU0 - 0.03, CU1 + 0.03, CV, CV + 0.2, 1.2, 1.34, ST_L, { lw: 0.8 });
  balus(k, CU0, CU1, CV + 0.17, 1.34, 0.16);
  cornice(k, U0, U1, V0, CV, ZT, 0.17);
  // wings: slate hips with dormers
  slateHip(k, U0, V0, ZT + 0.17, 0.62, V1 - V0, 0.5, 0.16);
  slateHip(k, 5.68, V0, ZT + 0.17, 0.62, V1 - V0, 0.5, 0.16);
  for (const a of [U0 + 0.2, U0 + 0.42, 5.9, 6.12]) dormer(k, a, V1 - 0.06, ZT + 0.22, { w: 0.15, d: 0.14, h: 0.17, roof: SLATE });
  // tower
  const TU0 = 4.75, TU1 = 5.65, TV0 = 1.45, TV1 = 2.35, Z1 = ZT + 0.17;
  k.poly([[U0 + 0.62, V0, Z1], [5.68, V0, Z1], [5.68, V1 + 0.05, Z1], [U0 + 0.62, V1 + 0.05, Z1]], "#d8c294", { lw: 0.7, wobble: 0 });
  balus(k, 4.72, 5.68, CV + 0.02, Z1, 0.17);
  bx(k, TU0 - 0.08, TU1 + 0.08, TV0 - 0.08, TV1 + 0.08, Z1, Z1 + 0.18, ST_L, { lw: 0.8 });
  const Z2 = Z1 + 0.18;
  bx(k, TU0, TU1, TV0, TV1, Z2, Z2 + 2.1, "#efd6a4");
  for (const a of [TU0 + 0.05, TU1 - 0.05]) pil(k, "L", TV1, a, 0.1, Z2, Z2 + 2.08);
  for (const a of [TV0 + 0.05, TV1 - 0.05]) pil(k, "R", TU1, a, 0.1, Z2, Z2 + 2.08);
  wins(k, "L", TV1, TU0 + 0.12, TU1 - 0.12, [Z2 + 0.2], 3, 0.1, 0.5, { arch: true, sur: true });
  wins(k, "R", TU1, TV0 + 0.12, TV1 - 0.12, [Z2 + 0.2], 3, 0.1, 0.5, { arch: true, sur: true });
  const zc = Z2 + 1.35;
  // clock faces on the left and right faces of the tower
  clockOn(k, "L", TV1 + 0.005, (TU0 + TU1) / 2, zc, 0.29, t, 0);
  clockOn(k, "R", TU1 + 0.005, (TV0 + TV1) / 2, zc, 0.29, t, 0.7);
  const Z3 = Z2 + 2.1;
  bx(k, TU0 - 0.1, TU1 + 0.1, TV0 - 0.1, TV1 + 0.1, Z3, Z3 + 0.17, ST_L, { lw: 0.8 });
  // belfry
  const BU0 = 4.88, BU1 = 5.52, BV0 = 1.58, BV1 = 2.22, Z4 = Z3 + 0.17;
  bx(k, BU0, BU1, BV0, BV1, Z4, Z4 + 0.85, "#efd6a4");
  wins(k, "L", BV1, BU0 + 0.08, BU1 - 0.08, [Z4 + 0.15], 2, 0.15, 0.55, { arch: true, sur: true });
  wins(k, "R", BU1, BV0 + 0.08, BV1 - 0.08, [Z4 + 0.15], 2, 0.15, 0.55, { arch: true, sur: true });
  for (const [u, v] of [[BU0, BV1], [BU1, BV1], [BU1, BV0]]) bx(k, u - 0.03, u + 0.03, v - 0.03, v + 0.03, Z4, Z4 + 0.85, ST_L, { lw: 0.6 });
  bx(k, BU0 - 0.08, BU1 + 0.08, BV0 - 0.08, BV1 + 0.08, Z4 + 0.85, Z4 + 1.0, ST_L, { lw: 0.8 });
  const Z5 = Z4 + 1.0;
  pyramid(k, BU0 - 0.06, BU1 + 0.06, BV0 - 0.06, BV1 + 0.06, Z5, 0.95, "#8a9cb2", { seams: 5, seamCol: "rgba(20,30,50,0.4)" });
  spire(k, (BU0 + BU1) / 2, (BV0 + BV1) / 2, Z5 + 0.95, Z5 + 1.75, true);
}

// ---------- Peace Hotel: u 7.2-9.6, green pyramid on a setback tower ----------
function peace(k, t) {
  const U0 = 7.2, U1 = 9.6, V0 = 0.8, V1 = 3.1, ZB = 3.7;
  bx(k, U0 - 0.05, U1 + 0.05, V0 - 0.05, V1 + 0.05, 0, 0.12, GRANITE, { lw: 0.8 });
  bx(k, U0, U1, V0, V1, 0.12, ZB, "#ebcf9b");
  course(k, "L", V1, U0, U1, 0.12, 1.15, 0.19); course(k, "R", U1, V0, V1, 0.12, 1.15, 0.19);
  wins(k, "L", V1, U0 + 0.08, U1 - 0.08, [0.3], 6, 0.2, 0.68, { arch: true, sur: false });
  wins(k, "L", V1, U0 + 0.08, U1 - 0.08, [1.35, 1.9, 2.45, 3.0], 9, 0.14, 0.4, { lit: 0.12, seed: 21 });
  wins(k, "R", U1, V0 + 0.1, V1 - 0.1, [0.3], 4, 0.2, 0.68, { arch: true, sur: false });
  wins(k, "R", U1, V0 + 0.1, V1 - 0.1, [1.35, 1.9, 2.45, 3.0], 7, 0.14, 0.4, { lit: 0.12, seed: 22 });
  for (const a of [U0 + 0.08, 8.0, 8.8, U1 - 0.08]) pil(k, "L", V1, a, 0.11, 1.15, ZB - 0.02);
  course(k, "L", V1, U0, U1, 1.13, 1.17, 0.1, 0.5);
  cornice(k, U0, U1, V0, V1, ZB, 0.17);
  // corner porch with arches + balcony
  bx(k, 8.3, 8.9, V1, 3.3, 0.12, 1.4, "#f0d8a8", { lw: 0.8 });
  win(k, face("L", 3.3 + 0.005), 8.6, 0.12, 0.34, 1.0, { arch: true, sur: true });
  balus(k, 8.3, 8.9, 3.3 + 0.1, 1.4, 0.16);
  // setback tower
  const TU0 = 7.5, TU1 = 9.3, TV0 = 1.0, TV1 = 2.8, ZT0 = ZB + 0.17;
  bx(k, TU0, TU1, TV0, TV1, ZT0, ZT0 + 3.0, "#efd4a2");
  wins(k, "L", TV1, TU0 + 0.1, TU1 - 0.1, [ZT0 + 0.22, ZT0 + 0.76, ZT0 + 1.3, ZT0 + 1.84, ZT0 + 2.36], 8, 0.13, 0.4, { lit: 0.1, seed: 31 });
  wins(k, "R", TU1, TV0 + 0.1, TV1 - 0.1, [ZT0 + 0.22, ZT0 + 0.76, ZT0 + 1.3, ZT0 + 1.84, ZT0 + 2.36], 7, 0.13, 0.4, { lit: 0.1, seed: 32 });
  for (const a of [TU0 + 0.08, 8.4, TU1 - 0.08]) pil(k, "L", TV1, a, 0.1, ZT0, ZT0 + 2.98);
  for (const a of [TV0 + 0.08, 1.9, TV1 - 0.08]) pil(k, "R", TU1, a, 0.1, ZT0, ZT0 + 2.98);
  const Z2 = ZT0 + 3.0;
  cornice(k, TU0, TU1, TV0, TV1, Z2, 0.17);
  // right annex with slate roof
  slateHip(k, 9.05, 1.2, ZB + 0.17, 0.55, 1.7, 0.5, 0.14);
  dormer(k, 9.3, 2.84, ZB + 0.22, { w: 0.15, d: 0.14, h: 0.17, roof: SLATE });
  // green pyramid with dormers
  const Z3 = Z2 + 0.17, PU0 = 7.62, PU1 = 9.18, PV0 = 1.12, PV1 = 2.68, H = 2.3;
  pyramid(k, PU0, PU1, PV0, PV1, Z3, H, VERD, { seams: 9 });
  // dormers sit on the left slope (the plane rises from v=PV1 at Z3 to the apex)
  const slope = (f) => ({ v: PV1 - (PV1 - (PV0 + PV1) / 2) * f, z: Z3 + H * f, lo: lerp(PU0, (PU0 + PU1) / 2, f), hi: lerp(PU1, (PU0 + PU1) / 2, f) });
  for (const [f, us] of [[0.2, [7.98, 8.28, 8.58, 8.88]], [0.46, [8.17, 8.63]]]) {
    const s = slope(f);
    for (const a of us) dormer(k, a, s.v + 0.03, s.z, { w: 0.2, d: 0.2, h: 0.2, col: ST_L, roof: "#8dbba0", arch: true });
  }
  const ap = [(PU0 + PU1) / 2, (PV0 + PV1) / 2];
  k.cyl(ap[0], ap[1], Z3 + H, 0.09, 0.2, "#caa65a");
  spire(k, ap[0], ap[1], Z3 + H + 0.2, Z3 + H + 0.95, true);
}

export function makeBund() {
  return {
    draw(k, t) {
      const lw0 = k.lw; k.lw = 1.4;
      // contact shadow along the base of the row
      k.poly([[0.4, 3.12, 0], [9.6, 3.12, 0], [9.6, 3.45, 0], [0.4, 3.45, 0]], "rgba(70,50,30,0.1)", { stroke: false });
      hsbc(k, t);
      bank(k, 3.2, 4.1, 1.0, 2.7, 3.5, { zs: [1.25, 1.8, 2.35, 2.9], cols: 3, seed: 40, mansard: 0.55 });
      customs(k, t);
      bank(k, 6.3, 7.2, 1.0, 2.6, 4.3, { zs: [1.25, 1.8, 2.35, 2.9, 3.45], cols: 3, arch: true, seed: 50, mansard: 0.6 });
      peace(k, t);
      k.lw = lw0;
    },
  };
}
