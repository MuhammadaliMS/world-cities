// Palais du Luxembourg, rebuilt on the grid (grid pass).
// One axis-aligned range along u across the back (u 0.8-9.2, v 0.7-2.95) standing on a stone terrace (u 0.5-9.5, v 0.5-3.6, z 0.28).
// The garden facade is the LEFT face (v+ side); end walls are on the RIGHT face (u+ side). Everything goes through P().
//   end pavilions  u 0.8-2.5 and 7.5-9.2, front v 2.95, mansard roofs with dormers and smoking chimneys
//   wings          u 2.5-4.2 and 5.8-7.5, front v 2.45
//   central block  u 4.0-6.0, front v 2.75, balcony + paired columns, clock stage, ribbed dome, lantern, flag
//   terrace        balustrade along v 3.52 with urns, five-step stairs (u 4.2-5.8, v 3.6-4.16)
import { P as P0, INK, shade, lerp, hash } from "../../lib/vec-kit.js";
import { smoke } from "./_props.js";

const Z0 = 0.28;
const P = (u, v, z = 0) => P0(u, v, z + Z0);
const ST = "#e8d6a4", ST_L = "#f2e4bb", ST_D = "#cdb883", RUST = "#dcc78f", GOLD = "#d8a93c";
const SLATE = "#7184a8", SLATE_D = "#586b90";
const GL = "#566a82", GD = "#38485c", LIT = "#f3d57a";
const VB = 0.7, VW = 2.45, VP = 2.95, VC = 2.75;
const Z1 = 0.85, ZW = 2.1, ZP = 2.35, ZC = 2.5;
export const TERR = { u0: 0.5, u1: 9.5, v0: 0.5, v1: 3.6, z: Z0, stairU0: 4.2, stairU1: 5.8, stairV1: 4.16 };

const pg = (k, pts3, fill, lw = 0.9) => k.path(pts3.map((p) => P(...p)), { fill, lw, wobble: 0 });
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
// window with surround, glazing bars, sill, optional pediment and balconette, on the plane of its face
function win(k, F, a, z, w, h, o = {}) {
  const dk = o.dk, c = k.ctx, lit = o.lit && hash((o.seed || 0) + a * 17.3 + z * 31.1) < o.lit;
  if (o.sur !== false) k.path(outline(F, a, z - 0.02, w + 0.07, h + 0.05, o.arch), { fill: dk ? shade(ST_L, -0.2) : ST_L, lw: 0.6, wobble: 0 });
  k.path(outline(F, a, z, w, h, o.arch), { fill: o.dark ? "#2c3442" : lit ? LIT : dk ? GD : GL, lw: 0.7, wobble: 0 });
  if (!o.dark) {
    c.strokeStyle = "rgba(20,30,40,0.55)"; c.lineWidth = 0.6; c.beginPath();
    const zs = o.arch ? z + h - w / 2 : z + h;
    c.moveTo(...P(...F(a, z))); c.lineTo(...P(...F(a, zs + (o.arch ? w / 2 : 0))));
    if (h > 0.3) { c.moveTo(...P(...F(a - w / 2, z + h * 0.45))); c.lineTo(...P(...F(a + w / 2, z + h * 0.45))); }
    c.stroke();
  }
  if (o.sill !== false) { c.strokeStyle = dk ? shade(ST_D, -0.2) : ST_D; c.lineWidth = 1.5; c.beginPath(); c.moveTo(...P(...F(a - w / 2 - 0.04, z - 0.02))); c.lineTo(...P(...F(a + w / 2 + 0.04, z - 0.02))); c.stroke(); }
  if (o.bal) { // iron balconette
    const zb = z + 0.05; c.strokeStyle = "#252a30"; c.lineWidth = 1.2; c.beginPath();
    for (let i = 0; i <= 5; i++) { const s = a - w / 2 - 0.05 + ((w + 0.1) * i) / 5; c.moveTo(...P(...F(s, zb))); c.lineTo(...P(...F(s, zb + 0.15))); }
    c.moveTo(...P(...F(a - w / 2 - 0.05, zb + 0.15))); c.lineTo(...P(...F(a + w / 2 + 0.05, zb + 0.15))); c.stroke();
  }
  if (o.ped) {
    const zt = z + h + 0.05, ww = w / 2 + 0.07, fill = dk ? shade(ST_L, -0.18) : ST_L;
    if (o.ped === "tri") k.path([P(...F(a - ww, zt)), P(...F(a + ww, zt)), P(...F(a, zt + w * 0.42))], { fill, lw: 0.7, wobble: 0 });
    else { const pts = [P(...F(a - ww, zt))]; for (let i = 1; i < 8; i++) { const th = Math.PI - (i / 8) * Math.PI; pts.push(P(...F(a + Math.cos(th) * ww, zt + Math.sin(th) * w * 0.34))); } pts.push(P(...F(a + ww, zt))); k.path(pts, { fill, lw: 0.7, wobble: 0 }); }
    c.strokeStyle = shade(ST_D, -0.1); c.lineWidth = 1.3; c.beginPath(); c.moveTo(...P(...F(a - ww - 0.02, zt))); c.lineTo(...P(...F(a + ww + 0.02, zt))); c.stroke();
  }
}
function wins(k, side, c, a0, a1, zs, cols, w, h, o = {}) {
  const F = face(side, c), st = (a1 - a0) / cols;
  zs.forEach((z, r) => { for (let i = 0; i < cols; i++) win(k, F, a0 + (i + 0.5) * st, z, w, h, { ...o, dk: side === "R", ped: o.peds ? o.peds(r, i) : o.ped, bal: o.bals ? o.bals(r, i) : o.bal }); });
}
// rusticated masonry courses on a face
function course(k, side, c, a0, a1, z0, z1, step, alpha = 0.3) {
  const F = face(side, c), cx = k.ctx; cx.strokeStyle = `rgba(110,90,60,${alpha})`; cx.lineWidth = 0.8; cx.beginPath();
  let r = 0;
  for (let z = z0 + step; z < z1 - 0.01; z += step) { cx.moveTo(...P(...F(a0, z))); cx.lineTo(...P(...F(a1, z))); }
  for (let z = z0; z < z1 - 0.01; z += step, r++) for (let a = a0 + (r % 2 ? 0.2 : 0.4); a < a1; a += 0.4) { cx.moveTo(...P(...F(a, z))); cx.lineTo(...P(...F(a, Math.min(z + step, z1)))); }
  cx.stroke();
}
function ashlar(k, side, c, a0, a1, z0, z1, step) { // fine dressed-stone coursing on the upper storeys
  const F = face(side, c), cx = k.ctx; cx.strokeStyle = "rgba(120,98,60,0.16)"; cx.lineWidth = 0.6; cx.beginPath();
  for (let z = z0 + step; z < z1 - 0.01; z += step) { cx.moveTo(...P(...F(a0, z))); cx.lineTo(...P(...F(a1, z))); }
  cx.stroke();
}
function quoins(k, side, c, a, dir, z0, z1) { // alternating corner stones
  const F = face(side, c); let i = 0;
  for (let z = z0; z < z1 - 0.05; z += 0.2, i++) {
    const w = i % 2 ? 0.16 : 0.26, a0 = dir > 0 ? a : a - w, a1 = dir > 0 ? a + w : a;
    k.path([P(...F(a0, z)), P(...F(a1, z)), P(...F(a1, z + 0.18)), P(...F(a0, z + 0.18))], { fill: shade(ST_L, -0.03), lw: 0.6, wobble: 0 });
  }
}
function pil(k, a, v, w, z0, z1, col = ST_L) { bx(k, a - w / 2, a + w / 2, v, v + 0.06, z0, z1, col, { lw: 0.7 }); }
function balus(k, u0, u1, v, z, h = 0.2, sideU = null, v0 = null) {
  const c = k.ctx; c.strokeStyle = "#a89a78"; c.lineWidth = 1.3; c.beginPath();
  for (let u = u0; u <= u1 + 0.001; u += 0.1) { c.moveTo(...P(u, v, z)); c.lineTo(...P(u, v, z + h)); }
  if (sideU != null) for (let vv = v0; vv <= v + 0.001; vv += 0.1) { c.moveTo(...P(sideU, vv, z)); c.lineTo(...P(sideU, vv, z + h)); }
  c.stroke();
  bx(k, u0, u1, v - 0.03, v + 0.03, z + h, z + h + 0.05, ST_L, { lw: 0.6 });
  bx(k, u0, u1, v - 0.03, v + 0.03, z, z + 0.04, ST_L, { lw: 0.5 });
  if (sideU != null) bx(k, sideU - 0.03, sideU + 0.03, v0, v, z + h, z + h + 0.05, ST_L, { lw: 0.6 });
}
// gabled dormer on a slope of the roof: on a left-facing slope (plane v = vd) or a right-facing slope (plane u = ud)
function dormL(k, u, vd, z, lit) {
  const w = 0.1, h = 0.3, d = 0.2;
  pg(k, [[u + w, vd, z], [u + w, vd - d, z], [u + w, vd - d, z + h], [u + w, vd, z + h]], shade(ST_L, -0.18), 0.8); // cheek
  pg(k, [[u - w, vd, z], [u + w, vd, z], [u + w, vd, z + h], [u - w, vd, z + h]], ST_L, 0.8);
  pg(k, [[u - w + 0.025, vd, z + 0.035], [u + w - 0.025, vd, z + 0.035], [u + w - 0.025, vd, z + h - 0.03], [u - w + 0.025, vd, z + h - 0.03]], lit ? LIT : "#4f6073", 0.6);
  pg(k, [[u + w + 0.03, vd, z + h], [u, vd, z + h + 0.12], [u, vd - d, z + h + 0.12], [u + w + 0.03, vd - d, z + h]], SLATE_D, 0.8);
  pg(k, [[u - w - 0.03, vd, z + h], [u + w + 0.03, vd, z + h], [u, vd, z + h + 0.12]], ST_L, 0.8);
}
function dormR(k, ud, v, z, lit) {
  const w = 0.1, h = 0.3, d = 0.2;
  pg(k, [[ud, v + w, z], [ud - d, v + w, z], [ud - d, v + w, z + h], [ud, v + w, z + h]], ST_L, 0.8); // left cheek, faces the viewer
  pg(k, [[ud, v - w, z], [ud, v + w, z], [ud, v + w, z + h], [ud, v - w, z + h]], shade(ST_L, -0.17), 0.8);
  pg(k, [[ud, v - w + 0.025, z + 0.035], [ud, v + w - 0.025, z + 0.035], [ud, v + w - 0.025, z + h - 0.03], [ud, v - w + 0.025, z + h - 0.03]], lit ? LIT : "#3f5062", 0.6);
  pg(k, [[ud, v - w - 0.03, z + h], [ud, v + w + 0.03, z + h], [ud, v, z + h + 0.12]], shade(ST_L, -0.17), 0.8);
  pg(k, [[ud, v + w + 0.03, z + h], [ud - d, v + w + 0.03, z + h], [ud - d, v, z + h + 0.12], [ud, v, z + h + 0.12]], shade(SLATE, 0.06), 0.8);
}
// curved (two-stage) mansard roof over a box footprint, with slate courses, dormers and a gilt crest
function mansard(k, u0, u1, v0, v1, z, o = {}) {
  const h1 = o.h1 ?? 0.55, i1 = o.i1 ?? 0.2, h2 = o.h2 ?? 0.22, i2 = o.i2 ?? 0.26, c = k.ctx;
  const fl = (a, b, zz, ii) => [[a, v1 - ii, zz], [b, v1 - ii, zz]];
  pg(k, [[u0 - 0.04, v1 + 0.04, z], [u1 + 0.04, v1 + 0.04, z], [u1 - i1, v1 - i1, z + h1], [u0 + i1, v1 - i1, z + h1]], SLATE, 0.9);
  pg(k, [[u1 + 0.04, v0 - 0.04, z], [u1 + 0.04, v1 + 0.04, z], [u1 - i1, v1 - i1, z + h1], [u1 - i1, v0 + i1, z + h1]], shade(SLATE, -0.2), 0.9);
  const a0 = u0 + i1, a1 = u1 - i1, b0 = v0 + i1, b1 = v1 - i1, zt = z + h1 + h2;
  pg(k, [[a0, b1, z + h1], [a1, b1, z + h1], [a1 - i2, b1 - i2, zt], [a0 + i2, b1 - i2, zt]], shade(SLATE, 0.1), 0.9);
  pg(k, [[a1, b0, z + h1], [a1, b1, z + h1], [a1 - i2, b1 - i2, zt], [a1 - i2, b0 + i2, zt]], shade(SLATE, -0.12), 0.9);
  pg(k, [[a0 + i2, b0 + i2, zt], [a1 - i2, b0 + i2, zt], [a1 - i2, b1 - i2, zt], [a0 + i2, b1 - i2, zt]], shade(SLATE, 0.2), 0.9);
  // slate courses
  c.strokeStyle = "rgba(25,35,55,0.32)"; c.lineWidth = 0.7; c.beginPath();
  for (let i = 1; i < 5; i++) { const f = i / 5, vv = v1 + 0.04 - (i1 + 0.04) * f, zz = z + h1 * f; c.moveTo(...P(u0 - 0.04 + (i1 + 0.04) * f, vv, zz)); c.lineTo(...P(u1 + 0.04 - (i1 + 0.04) * f, vv, zz)); }
  for (let i = 1; i < 5; i++) { const f = i / 5, uu = u1 + 0.04 - (i1 + 0.04) * f, zz = z + h1 * f; c.moveTo(...P(uu, v0 - 0.04 + (i1 + 0.04) * f, zz)); c.lineTo(...P(uu, v1 + 0.04 - (i1 + 0.04) * f, zz)); }
  for (let i = 1; i < 3; i++) { const f = i / 3, vv = b1 - i2 * f, zz = z + h1 + h2 * f; c.moveTo(...P(a0 + i2 * f, vv, zz)); c.lineTo(...P(a1 - i2 * f, vv, zz)); }
  c.stroke();
  // gilt crest
  c.strokeStyle = GOLD; c.lineWidth = 1.5; c.beginPath(); c.moveTo(...P(a0 + i2, b1 - i2, zt)); c.lineTo(...P(a1 - i2, b1 - i2, zt)); c.lineTo(...P(a1 - i2, b0 + i2, zt)); c.stroke();
  // dormers
  const n = o.dorm ?? 3, f = 0.5, vd = v1 + 0.04 - (i1 + 0.04) * f, zd = z + h1 * f - 0.05, ST2 = (u1 - u0 - 0.5) / n;
  for (let i = 0; i < n; i++) dormL(k, u0 + 0.25 + (i + 0.5) * ST2, vd + 0.04, zd, hash(i + (o.seed || 0)) < 0.4);
  if (o.dormR) { const ud = u1 + 0.04 - (i1 + 0.04) * f, m = o.dormR, SV = (v1 - v0 - 0.5) / m; for (let i = 0; i < m; i++) dormR(k, ud + 0.04, v0 + 0.25 + (i + 0.5) * SV, zd, hash(i * 3 + (o.seed || 0)) < 0.4); }
  return zt;
}
function chimney(k, u, v, z, h, seed) {
  bx(k, u - 0.09, u + 0.09, v - 0.09, v + 0.09, z, z + h, "#d9c3a0", { lw: 0.7 });
  bx(k, u - 0.12, u + 0.12, v - 0.12, v + 0.12, z + h, z + h + 0.05, ST_L, { lw: 0.6 });
  k.cyl(u - 0.04, v, z + h + 0.05 + Z0, 0.035, 0.12, "#b9684a", { top: true }); k.cyl(u + 0.05, v, z + h + 0.05 + Z0, 0.035, 0.12, "#b9684a");
  smoke(k, u, v, z + h + Z0 + 0.2, seed);
}
function column(k, u, v, z0, z1, r = 0.065) {
  k.cyl(u, v, z0 + Z0, r, z1 - z0, "#f1e8d2", { top: false });
  bx(k, u - r * 1.4, u + r * 1.4, v - r * 1.4, v + r * 1.4, z1 - 0.07, z1, ST_L, { lw: 0.6 });
  bx(k, u - r * 1.4, u + r * 1.4, v - r * 1.4, v + r * 1.4, z0, z0 + 0.05, ST_D, { lw: 0.6 });
}

// ---------- parts ----------
function pavilion(k, u0, u1, right, seed) {
  const uc = (u0 + u1) / 2;
  bx(k, u0, u1, VB, VP, 0, ZP, ST);
  course(k, "L", VP, u0, u1, 0, Z1, 0.2);
  ashlar(k, "L", VP, u0, u1, Z1, ZP, 0.2);
  quoins(k, "L", VP, u0, 1, 0, ZP - 0.1); quoins(k, "L", VP, u1, -1, 0, ZP - 0.1);
  bx(k, u0 - 0.03, u1 + 0.03, VB, VP + 0.04, Z1 - 0.04, Z1 + 0.05, ST_L, { lw: 0.7, top: ST_L });
  bx(k, u0 - 0.03, u1 + 0.03, VB, VP + 0.04, 1.68, 1.74, ST_L, { lw: 0.7 });
  wins(k, "L", VP, u0 + 0.3, u1 - 0.3, [0.1], 3, 0.26, 0.62, { arch: true, sur: true, sill: false });
  wins(k, "L", VP, u0 + 0.3, u1 - 0.3, [1.0], 3, 0.26, 0.62, { peds: (r, i) => (i === 1 ? "tri" : "seg"), bals: (r, i) => i === 1 });
  wins(k, "L", VP, u0 + 0.3, u1 - 0.3, [1.9], 3, 0.2, 0.3, { sill: false, lit: 0.3, seed });
  pil(k, u0 + 0.25, VP, 0.1, Z1 + 0.05, 1.68); pil(k, u1 - 0.25, VP, 0.1, Z1 + 0.05, 1.68);
  if (right) {
    course(k, "R", u1, VB, VP, 0, Z1, 0.2); ashlar(k, "R", u1, VB, VP, Z1, ZP, 0.2);
    quoins(k, "R", u1, VP, -1, 0, ZP - 0.1);
    bx(k, u1 - 0.0, u1 + 0.03, VB, VP + 0.04, Z1 - 0.04, Z1 + 0.05, ST_L, { lw: 0.6, noTop: true, noR: false });
    wins(k, "R", u1, VB + 0.12, VP - 0.3, [0.1], 4, 0.2, 0.62, { arch: true, sur: true, sill: false });
    wins(k, "R", u1, VB + 0.12, VP - 0.3, [1.0], 4, 0.2, 0.62, { ped: "seg" });
    wins(k, "R", u1, VB + 0.12, VP - 0.3, [1.9], 4, 0.16, 0.3, { sill: false, lit: 0.3, seed: seed + 5 });
  } else {
    course(k, "R", u1, VW, VP, 0, Z1, 0.2); ashlar(k, "R", u1, VW, VP, Z1, ZP, 0.2);
    wins(k, "R", u1, VW + 0.06, VP - 0.06, [0.1], 1, 0.2, 0.62, { arch: true, sur: true, sill: false });
    wins(k, "R", u1, VW + 0.06, VP - 0.06, [1.0], 1, 0.2, 0.62, { ped: "tri" });
    wins(k, "R", u1, VW + 0.06, VP - 0.06, [1.9], 1, 0.16, 0.3, { sill: false });
  }
  bx(k, u0 - 0.07, u1 + 0.07, VB, VP + 0.1, ZP - 0.05, ZP + 0.1, ST_L, { lw: 0.8 });
  const zt = mansard(k, u0 + 0.0, u1 + 0.0, VB, VP, ZP + 0.1, { h1: 0.62, i1: 0.22, h2: 0.3, i2: 0.3, dorm: 2, dormR: right ? 2 : 0, seed });
  chimney(k, uc - 0.2, 1.35, zt, 0.4, seed); chimney(k, uc + 0.2, 1.35, zt, 0.45, seed + 1);
}

function wing(k, u0, u1, seed) {
  bx(k, u0, u1, VB, VW, 0, ZW, ST);
  course(k, "L", VW, u0, u1, 0, Z1, 0.2); ashlar(k, "L", VW, u0, u1, Z1, ZW, 0.2);
  bx(k, u0, u1 + 0.02, VB, VW + 0.04, Z1 - 0.04, Z1 + 0.05, ST_L, { lw: 0.7, top: ST_L });
  bx(k, u0, u1 + 0.02, VB, VW + 0.04, 1.62, 1.68, ST_L, { lw: 0.7 });
  wins(k, "L", VW, u0 + 0.04, u1 - 0.04, [0.1], 4, 0.25, 0.62, { arch: true, sur: true, sill: false });
  wins(k, "L", VW, u0 + 0.04, u1 - 0.04, [1.0], 4, 0.25, 0.6, { peds: (r, i) => (i % 2 ? "seg" : "tri"), bals: (r, i) => i === 1 || i === 2 });
  wins(k, "L", VW, u0 + 0.04, u1 - 0.04, [1.78], 4, 0.2, 0.2, { sill: false, lit: 0.25, seed });
  for (let i = 1; i < 4; i++) pil(k, lerp(u0 + 0.04, u1 - 0.04, i / 4), VW, 0.06, Z1 + 0.05, 1.62);
  bx(k, u0, u1 + 0.05, VB, VW + 0.1, ZW - 0.05, ZW + 0.1, ST_L, { lw: 0.8 });
  const zt = mansard(k, u0, u1, VB, VW, ZW + 0.1, { h1: 0.5, i1: 0.18, h2: 0.2, i2: 0.24, dorm: 3, seed });
  chimney(k, lerp(u0, u1, 0.5), 1.3, zt, 0.4, seed);
}

function clock(k, t, u, v, z, r) {
  const F = (a, b) => P(u + a, v, z + b), c = k.ctx;
  const ring = (rr, n = 28) => Array.from({ length: n }, (_, i) => F(Math.cos((i / n) * 6.2832) * rr, Math.sin((i / n) * 6.2832) * rr));
  k.path(ring(r + 0.07), { fill: GOLD, lw: 1, wobble: 0 });
  k.path(ring(r), { fill: "#f6f0dc", lw: 0.9, wobble: 0 });
  c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath();
  for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.2832, r0 = r * 0.82; c.moveTo(...F(Math.cos(a) * r0, Math.sin(a) * r0)); c.lineTo(...F(Math.cos(a) * r * 0.96, Math.sin(a) * r * 0.96)); }
  c.stroke();
  const min = -t * 0.26 + 1.1, hr = min / 12 - 0.4; // a visibly fast clock
  c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(...F(0, 0)); c.lineTo(...F(Math.cos(hr) * r * 0.5, Math.sin(hr) * r * 0.5)); c.stroke();
  c.lineWidth = 1.3; c.beginPath(); c.moveTo(...F(0, 0)); c.lineTo(...F(Math.cos(min) * r * 0.8, Math.sin(min) * r * 0.8)); c.stroke();
}

function centre(k, t) {
  const u0 = 4.0, u1 = 6.0, uc = 5.0;
  bx(k, u0, u1, VB, VC, 0, ZC, ST);
  course(k, "L", VC, u0, u1, 0, Z1 + 0.1, 0.2); ashlar(k, "L", VC, u0, u1, Z1 + 0.1, ZC, 0.2);
  quoins(k, "L", VC, u0, 1, 0, ZC - 0.1); quoins(k, "L", VC, u1, -1, 0, ZC - 0.1);
  // right wall of the central block above the wings
  ashlar(k, "R", u1, VB, VC, ZW + 0.1, ZC, 0.2);
  wins(k, "R", u1, VB + 0.15, VC - 0.2, [2.18], 4, 0.18, 0.2, { sill: false });
  // ground floor: five arched openings, big door in the middle
  const F = face("L", VC);
  for (const a of [4.2, 4.6, 5.4, 5.8]) win(k, F, a, 0.08, 0.26, 0.72, { arch: true, sur: true, sill: false });
  win(k, F, uc, 0.0, 0.4, 0.86, { arch: true, sur: true, sill: false, dark: true });
  // balcony slab and iron rail
  bx(k, 4.08, 5.92, VC, VC + 0.1, Z1 + 0.04, Z1 + 0.1, ST_L, { lw: 0.8 });
  balus(k, 4.08, 5.92, VC + 0.08, Z1 + 0.1, 0.17, 5.92, VC);
  // piano nobile: three tall windows, pediments, between paired columns
  for (const [a, ped] of [[4.45, "tri"], [5.0, "seg"], [5.55, "tri"]]) win(k, F, a, Z1 + 0.15, 0.28, 0.98, { ped, sur: true });
  for (const a of [4.14, 4.74, 5.26, 5.86]) column(k, a, VC + 0.06, Z1 + 0.1, 2.2, 0.065);
  bx(k, 4.04, 5.96, VC - 0.04, VC + 0.14, 2.2, 2.34, ST_L, { lw: 0.9 });
  { const c = k.ctx; c.strokeStyle = "rgba(120,100,70,0.5)"; c.lineWidth = 0.9; c.beginPath(); for (let a = 4.1; a < 5.95; a += 0.1) { c.moveTo(...P(a, VC + 0.14, 2.23)); c.lineTo(...P(a, VC + 0.14, 2.31)); } c.stroke(); }
  bx(k, 3.98, 6.02, VC - 0.08, VC + 0.18, 2.34, ZC + 0.04, ST_L, { lw: 0.9 });
  balus(k, 4.0, 6.0, VC + 0.12, ZC + 0.04, 0.16, 6.0, VB);
  // clock stage
  const a0 = 4.3, a1 = 5.7, b0 = 1.0, b1 = 2.5, ZA = 3.35;
  bx(k, a0, a1, b0, b1, ZC + 0.04, ZA, ST_L);
  ashlar(k, "L", b1, a0, a1, ZC + 0.04, ZA, 0.2); ashlar(k, "R", a1, b0, b1, ZC + 0.04, ZA, 0.2);
  quoins(k, "L", b1, a0, 1, ZC + 0.04, ZA); quoins(k, "L", b1, a1, -1, ZC + 0.04, ZA);
  clock(k, t, uc, b1, ZC + 0.5, 0.26);
  const FA = face("L", b1);
  for (const a of [4.58, 5.42]) win(k, FA, a, ZC + 0.22, 0.2, 0.55, { arch: true, sur: true, sill: true });
  for (const a of [4.52, 5.48]) { const [x, y] = P(a, b1 + 0.02, ZC + 0.82); k.ctx.fillStyle = GOLD; k.ctx.beginPath(); k.ctx.arc(x, y, 2.4, 0, 7); k.ctx.fill(); }
  wins(k, "R", a1, b0 + 0.2, b1 - 0.2, [ZC + 0.22], 3, 0.18, 0.5, { arch: true, sur: true });
  bx(k, a0 - 0.07, a1 + 0.07, b0 - 0.07, b1 + 0.07, ZA, ZA + 0.1, ST_L, { lw: 0.9 });
  // drum, ribbed dome, lantern
  const dcu = uc, dcv = 1.75, zd = ZA + 0.1;
  k.cyl(dcu, dcv, zd + Z0, 0.64, 0.32, ST_L, { top: false });
  { const c = k.ctx; for (let i = 0; i < 9; i++) { const th = (i + 0.5) / 9 * Math.PI * 2; if (Math.cos(th) + Math.sin(th) < 0.35) continue; const [x, y] = P(dcu + Math.cos(th) * 0.64, dcv + Math.sin(th) * 0.64, zd + 0.1); c.fillStyle = "#3d4a5c"; c.fillRect(x - 2.2, y - 5, 4.4, 8); c.strokeStyle = INK; c.lineWidth = 0.7; c.strokeRect(x - 2.2, y - 5, 4.4, 8); } }
  k.cyl(dcu, dcv, zd + 0.32 + Z0, 0.7, 0.07, ST_L, { top: true });
  k.dome(dcu, dcv, zd + 0.39 + Z0, 0.66, 0.9, "#7e93b5", { ribs: 9 });
  const zl = zd + 0.39 + 0.9;
  k.cyl(dcu, dcv, zl - 0.02 + Z0, 0.13, 0.34, ST_L, { top: false });
  { const c = k.ctx; for (const dx of [-0.05, 0.05]) { const [x, y] = P(dcu + 0.09, dcv + 0.09 + dx, zl + 0.15); c.fillStyle = "#3d4a5c"; c.fillRect(x - 1.5, y - 5, 3, 8); } }
  k.cyl(dcu, dcv, zl + 0.32 + Z0, 0.17, 0.05, GOLD, { top: true });
  k.cone(dcu, dcv, zl + 0.37 + Z0, 0.12, 0.28, "#7e93b5");
  { // tricolour on the lantern
    const c = k.ctx, [x, y0] = P(dcu, dcv, zl + 0.65), yt = y0 - 22; c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y0); c.lineTo(x, yt); c.stroke();
    for (let s = 0; s < 3; s++) { c.fillStyle = ["#2a4d9a", "#f6f2e6", "#d6402c"][s]; c.beginPath(); const x0 = x + s * 6, w = (m) => Math.sin(t * 5 - m * 0.5 + s) * 1.6; c.moveTo(x0, yt); c.lineTo(x0 + 6, yt + w(x0 + 6)); c.lineTo(x0 + 6, yt + 9 + w(x0 + 6)); c.lineTo(x0, yt + 9); c.closePath(); c.fill(); }
  }
}

// terrace platform + balustrade + stairs
function terraceBase(k) {
  bx(k, TERR.u0, TERR.u1, TERR.v0, TERR.v1, -Z0, 0, "#e3d3a8", { top: "#ecdcb4", lw: 1.1 });
  const c = k.ctx; c.strokeStyle = "rgba(110,90,60,0.35)"; c.lineWidth = 0.8; c.beginPath();
  for (let a = TERR.u0; a < TERR.u1; a += 0.4) { c.moveTo(...P(a, TERR.v1, -Z0)); c.lineTo(...P(a, TERR.v1, 0)); }
  for (let a = TERR.v0 + 0.1; a < TERR.v1; a += 0.35) { c.moveTo(...P(TERR.u1, a, -Z0)); c.lineTo(...P(TERR.u1, a, 0)); }
  c.moveTo(...P(TERR.u0, TERR.v1, -Z0 * 0.5)); c.lineTo(...P(TERR.u1, TERR.v1, -Z0 * 0.5)); c.stroke();
  // paving pattern on the terrace top
  c.strokeStyle = "rgba(130,105,65,0.18)"; c.beginPath();
  for (let a = 1; a < 9.5; a += 0.5) { c.moveTo(...P(a, 2.95, 0)); c.lineTo(...P(a, 3.6, 0)); }
  for (let a = 3.1; a < 3.6; a += 0.25) { c.moveTo(...P(TERR.u0, a, 0)); c.lineTo(...P(TERR.u1, a, 0)); }
  c.stroke();
}
function stairs(k) {
  const n = 4, v0 = TERR.v1, dv = (TERR.stairV1 - v0) / n, h = Z0 / n;
  for (let i = 0; i < n; i++) { // i = 0 is the top step (nearest the terrace)
    const top = -Z0 + h * (n - i);
    bx(k, TERR.stairU0, TERR.stairU1, v0 + dv * i, v0 + dv * (i + 1), -Z0, top, "#e9dab0", { top: "#f0e3bf", lw: 0.9 });
  }
}
function pedestalZ(k, u, v, z, h, w) {
  bx(k, u - w / 2 - 0.05, u + w / 2 + 0.05, v - w / 2 - 0.05, v + w / 2 + 0.05, z, z + 0.12, "#e2d3ae", { lw: 0.8 });
  bx(k, u - w / 2, u + w / 2, v - w / 2, v + w / 2, z + 0.12, z + h, "#ebdfbc", { lw: 0.8 });
  bx(k, u - w / 2 - 0.04, u + w / 2 + 0.04, v - w / 2 - 0.04, v + w / 2 + 0.04, z + h, z + h + 0.07, "#f2e8c9", { lw: 0.8 });
}
function urn(k, u, v, z, t, seed) {
  const c = k.ctx; pedestalZ(k, u, v, z, 0.34, 0.2);
  const [x, y] = P(u, v, z + 0.41);
  c.fillStyle = "#f0e6c8"; c.strokeStyle = INK; c.lineWidth = 0.9;
  c.beginPath(); c.moveTo(x - 3, y); c.lineTo(x - 5.5, y - 6); c.quadraticCurveTo(x - 7.5, y - 10, x - 6, y - 12); c.lineTo(x + 6, y - 12); c.quadraticCurveTo(x + 7.5, y - 10, x + 5.5, y - 6); c.lineTo(x + 3, y); c.closePath(); c.fill(); c.stroke();
  const cols = ["#e8607a", "#f39ac0", "#fff", "#f4c542"];
  for (let i = 0; i < 9; i++) { c.fillStyle = "#6a9a48"; c.beginPath(); c.arc(x + (i - 4) * 1.5, y - 14 - Math.cos((i - 4) * 0.3) * 2, 2.6, 0, 7); c.fill(); }
  for (let i = 0; i < 9; i++) { c.fillStyle = cols[(i + seed) % 4]; c.beginPath(); c.arc(x + (i - 4) * 1.5 + Math.sin(t * 1.4 + i) * 0.3, y - 15 - Math.cos((i - 4) * 0.3) * 3 - (i % 3), 1.7, 0, 7); c.fill(); }
}
// terrace front: queued so people strolling behind it stay behind it
export const URN_U = [1.2, 2.9, 3.9, 6.1, 7.1, 8.8];
function terraceFront(k, t) {
  const v = TERR.v1 - 0.1, segs = [[0.55, 4.15], [5.85, 9.45]];
  for (const [a, b] of segs) for (let u = a; u < b - 0.01; u += 0.9) {
    const e = Math.min(b, u + 0.9);
    k.q((u + e) / 2 + v + 0.05, () => { balus(k, u, e, v, 0, 0.22); bx(k, u - 0.02, u + 0.05, v - 0.05, v + 0.05, 0, 0.3, ST_L, { lw: 0.6 }); if (e >= b - 0.01) bx(k, e - 0.05, e + 0.02, v - 0.05, v + 0.05, 0, 0.3, ST_L, { lw: 0.6 }); });
  }
  // stair rails with end pillars
  for (const a of [TERR.stairU0 - 0.05, TERR.stairU1 + 0.05]) k.q(a + v + 0.06, () => bx(k, a - 0.05, a + 0.05, v - 0.05, v + 0.05, 0, 0.34, ST_L, { lw: 0.7 }));
  URN_U.forEach((u, i) => k.q(u + v + 0.1, () => urn(k, u, v, 0, t, i)));
}

export default function drawPalace(k, t) {
  terraceBase(k);
  pavilion(k, 0.8, 2.5, false, 3);
  wing(k, 2.5, 4.2, 5);
  centre(k, t);
  wing(k, 5.8, 7.5, 9);
  pavilion(k, 7.5, 9.2, true, 12);
  stairs(k);
  terraceFront(k, t);
}
export function urnTop() {}
