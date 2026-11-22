// LONDON · Buckingham Palace, rebuilt on the grid (grid pass).
// One axis-aligned range along u across the back of the tile (u 0.5-9.5, v 0.5-2.8). The main facade is the LEFT face
// (v+ side), the end walls are on the RIGHT face (u+ side). Everything goes through P().
//   corner pavilions  u 0.5-2.3 and 7.7-9.5, front v 2.8, three storeys, hipped slate roofs, chimneys
//   wings             u 2.3-4.1 and 5.9-7.7, front v 2.5 (set back 0.3), two storeys + balustrade
//   central block     u 4.1-5.9, front v 2.8, arcaded ground floor with the balcony terrace (to v 3.1),
//                     six columns, entablature, pediment; the Royal Standard flies from the roof
import { P, CTS, INK, shade, lerp, hash } from "../../lib/vec-kit.js";

const ST = "#e8dec6", ST_L = "#f3ebd8", ST_D = "#cdc1a3", RUST = "#e0d4b8", SLATE = "#6a7289", GOLD = "#d9b24a";
const GL = "#566b82", GD = "#38485c", LIT = "#f3d57a";
const VB = 0.5, VW = 2.5, VP = 2.8, VF = 3.1;
const Z1 = 1.1, ZC = 2.45, ZP = 3.0; // ground floor top, wing cornice, pavilion cornice

// ---------- primitives (all through P) ----------
const pg = (k, pts3, fill, lw = 0.9) => k.poly(pts3, fill, { lw, wobble: 0 });
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
// window with surround, glazing bars, sill and an optional pediment (tri / seg) on the plane of the face
function win(k, F, a, z, w, h, o = {}) {
  const dk = o.dk, c = k.ctx, lit = o.lit && hash((o.seed || 0) + a * 17.3 + z * 31.1) < o.lit;
  if (o.sur !== false) k.path(outline(F, a, z - 0.02, w + 0.07, h + 0.05, o.arch), { fill: dk ? shade(ST_L, -0.2) : ST_L, lw: 0.6, wobble: 0 });
  k.path(outline(F, a, z, w, h, o.arch), { fill: lit ? LIT : dk ? GD : GL, lw: 0.7, wobble: 0 });
  c.strokeStyle = "rgba(20,30,40,0.55)"; c.lineWidth = 0.6; c.beginPath();
  const zs = o.arch ? z + h - w / 2 : z + h;
  c.moveTo(...P(...F(a, z))); c.lineTo(...P(...F(a, zs + (o.arch ? w / 2 : 0))));
  if (h > 0.3) { c.moveTo(...P(...F(a - w / 2, z + h * 0.45))); c.lineTo(...P(...F(a + w / 2, z + h * 0.45))); }
  c.stroke();
  if (o.sill !== false) { c.strokeStyle = dk ? shade(ST_D, -0.2) : ST_D; c.lineWidth = 1.5; c.beginPath(); c.moveTo(...P(...F(a - w / 2 - 0.04, z - 0.02))); c.lineTo(...P(...F(a + w / 2 + 0.04, z - 0.02))); c.stroke(); }
  if (o.ped) {
    const zt = z + h + 0.05, ww = w / 2 + 0.07, fill = dk ? shade(ST_L, -0.18) : ST_L;
    if (o.ped === "tri") k.path([P(...F(a - ww, zt)), P(...F(a + ww, zt)), P(...F(a, zt + w * 0.42))], { fill, lw: 0.7, wobble: 0 });
    else { const pts = [P(...F(a - ww, zt))]; for (let i = 1; i < 8; i++) { const th = Math.PI - (i / 8) * Math.PI; pts.push(P(...F(a + Math.cos(th) * ww, zt + Math.sin(th) * w * 0.34))); } pts.push(P(...F(a + ww, zt))); k.path(pts, { fill, lw: 0.7, wobble: 0 }); }
    c.strokeStyle = shade(ST_D, -0.1); c.lineWidth = 1.3; c.beginPath(); c.moveTo(...P(...F(a - ww - 0.02, zt))); c.lineTo(...P(...F(a + ww + 0.02, zt))); c.stroke();
  }
}
function wins(k, side, c, a0, a1, zs, cols, w, h, o = {}) {
  const F = face(side, c), st = (a1 - a0) / cols;
  zs.forEach((z, r) => { for (let i = 0; i < cols; i++) win(k, F, a0 + (i + 0.5) * st, z, w, h, { ...o, dk: side === "R", ped: o.peds ? o.peds(r, i) : o.ped }); });
}
function course(k, side, c, a0, a1, z0, z1, step, alpha = 0.3) {
  const F = face(side, c), cx = k.ctx; cx.strokeStyle = `rgba(110,90,60,${alpha})`; cx.lineWidth = 0.8; cx.beginPath();
  let r = 0;
  for (let z = z0 + step; z < z1 - 0.01; z += step) { cx.moveTo(...P(...F(a0, z))); cx.lineTo(...P(...F(a1, z))); }
  for (let z = z0; z < z1 - 0.01; z += step, r++) for (let a = a0 + (r % 2 ? 0.2 : 0.4); a < a1; a += 0.4) { cx.moveTo(...P(...F(a, z))); cx.lineTo(...P(...F(a, Math.min(z + step, z1)))); }
  cx.stroke();
}
function pil(k, a, v, w, z0, z1, col = ST_L) { bx(k, a - w / 2, a + w / 2, v, v + 0.07, z0, z1, col, { lw: 0.7 }); }
function balus(k, u0, u1, v, z, h = 0.2, sideU = null, v0 = null) {
  const c = k.ctx; c.strokeStyle = "#a89a78"; c.lineWidth = 1.3; c.beginPath();
  for (let u = u0; u <= u1 + 0.001; u += 0.1) { c.moveTo(...P(u, v, z)); c.lineTo(...P(u, v, z + h)); }
  if (sideU != null) for (let vv = v0; vv <= v + 0.001; vv += 0.1) { c.moveTo(...P(sideU, vv, z)); c.lineTo(...P(sideU, vv, z + h)); }
  c.stroke();
  bx(k, u0, u1, v - 0.03, v + 0.03, z + h, z + h + 0.05, ST_L, { lw: 0.6 });
  bx(k, u0, u1, v - 0.03, v + 0.03, z, z + 0.04, ST_L, { lw: 0.5 });
  if (sideU != null) bx(k, sideU - 0.03, sideU + 0.03, v0, v, z + h, z + h + 0.05, ST_L, { lw: 0.6 });
}
function slateHip(k, u, v, z, du, dv, h, inset) {
  k.hip(u, v, z, du, dv, h, SLATE, { inset });
  const c = k.ctx; c.strokeStyle = "rgba(25,35,55,0.35)"; c.lineWidth = 0.7; c.beginPath();
  for (let i = 1; i < 5; i++) { const f = i / 5, vv = v + dv - inset * f; c.moveTo(...P(u + inset * f, vv, z + h * f)); c.lineTo(...P(u + du - inset * f, vv, z + h * f)); }
  c.stroke();
}
function chimney(k, u, v, z, h) {
  bx(k, u - 0.09, u + 0.09, v - 0.09, v + 0.09, z, z + h, "#d9c3a0", { lw: 0.7 });
  bx(k, u - 0.12, u + 0.12, v - 0.12, v + 0.12, z + h, z + h + 0.05, ST_L, { lw: 0.6 });
  k.cyl(u - 0.04, v, z + h + 0.05, 0.035, 0.12, "#b9684a", { top: true }); k.cyl(u + 0.05, v, z + h + 0.05, 0.035, 0.12, "#b9684a");
}
function column(k, u, v, z0, z1, r = 0.065) {
  k.cyl(u, v, z0, r, z1 - z0, "#f1e8d2", { top: false });
  bx(k, u - r * 1.4, u + r * 1.4, v - r * 1.4, v + r * 1.4, z1 - 0.07, z1, ST_L, { lw: 0.6 });
  bx(k, u - r * 1.4, u + r * 1.4, v - r * 1.4, v + r * 1.4, z0, z0 + 0.05, ST_D, { lw: 0.6 });
}

// ---------- parts ----------
function pavilion(k, u0, u1, right) {
  bx(k, u0, u1, VB, VP, 0, ZP, ST);
  course(k, "L", VP, u0, u1, 0, Z1, 0.2);
  // plinth band, string courses
  bx(k, u0 - 0.03, u1 + 0.03, VB, VP + 0.04, Z1 - 0.04, Z1 + 0.05, ST_L, { lw: 0.7, top: ST_L });
  bx(k, u0 - 0.03, u1 + 0.03, VB, VP + 0.04, 2.3, 2.38, ST_L, { lw: 0.7 });
  // ground floor: round-headed windows, piano nobile with pediments, attic squares
  wins(k, "L", VP, u0 + 0.05, u1 - 0.05, [0.25], 3, 0.24, 0.62, { arch: true, sur: false });
  wins(k, "L", VP, u0 + 0.05, u1 - 0.05, [1.38], 3, 0.26, 0.82, { peds: (r, i) => (i === 1 ? "seg" : "tri") });
  wins(k, "L", VP, u0 + 0.05, u1 - 0.05, [2.55], 3, 0.2, 0.3, { sill: false });
  pil(k, u0 + 0.08, VP, 0.12, Z1, 2.3); pil(k, u1 - 0.08, VP, 0.12, Z1, 2.3);
  pil(k, (u0 + u1) / 2 - 0.3, VP, 0.08, Z1, 2.3); pil(k, (u0 + u1) / 2 + 0.3, VP, 0.08, Z1, 2.3);
  // right-hand end wall (u+ side), only the end pavilion shows it in full
  if (right) {
    course(k, "R", u1, VB, VP, 0, Z1, 0.2);
    wins(k, "R", u1, VB + 0.1, VP - 0.1, [0.25], 4, 0.2, 0.62, { arch: true, sur: false });
    wins(k, "R", u1, VB + 0.1, VP - 0.1, [1.38], 4, 0.22, 0.82, {});
    wins(k, "R", u1, VB + 0.1, VP - 0.1, [2.55], 4, 0.18, 0.3, { sill: false });
  } else {
    wins(k, "R", u1, VP - 0.28, VP - 0.02, [0.25, 1.38], 1, 0.12, 0.7, { sur: false, sill: false });
  }
  bx(k, u0 - 0.07, u1 + 0.07, VB, VP + 0.1, ZP, ZP + 0.14, ST_L, { lw: 0.8 });
  slateHip(k, u0 + 0.02, VB + 0.02, ZP + 0.14, u1 - u0 - 0.04, VP - VB - 0.04, 0.65, 0.5);
  chimney(k, lerp(u0, u1, 0.3), 1.35, ZP + 0.79, 0.5); chimney(k, lerp(u0, u1, 0.7), 1.35, ZP + 0.79, 0.5);
  balus(k, u0 - 0.02, u1 + 0.02, VP + 0.07, ZP + 0.14, 0.2, u1 + 0.02, VB);
}

function wing(k, u0, u1, right) {
  bx(k, u0, u1, VB, VW, 0, ZC, ST);
  course(k, "L", VW, u0, u1, 0, Z1, 0.2);
  bx(k, u0, u1 + 0.02, VB, VW + 0.04, Z1 - 0.04, Z1 + 0.05, ST_L, { lw: 0.7, top: ST_L });
  wins(k, "L", VW, u0 + 0.05, u1 - 0.05, [0.25], 3, 0.24, 0.62, { arch: true, sur: false });
  wins(k, "L", VW, u0 + 0.05, u1 - 0.05, [1.38], 3, 0.26, 0.82, { peds: (r, i) => (i % 2 ? "seg" : "tri") });
  for (let i = 1; i < 3; i++) pil(k, lerp(u0 + 0.05, u1 - 0.05, i / 3), VW, 0.07, Z1, ZC - 0.1);
  bx(k, u0, u1 + 0.05, VB, VW + 0.1, ZC - 0.06, ZC + 0.1, ST_L, { lw: 0.8 });
  slateHip(k, u0 + 0.02, VB + 0.02, ZC + 0.1, u1 - u0 - 0.04, VW - VB - 0.06, 0.5, 0.55);
  chimney(k, lerp(u0, u1, 0.5), 1.35, ZC + 0.6, 0.45);
  balus(k, u0, u1 + 0.03, VW + 0.07, ZC + 0.1, 0.2);
}

function centre(k, t) {
  const u0 = 4.1, u1 = 5.9, uc = 5.0;
  // block behind the portico
  bx(k, u0, u1, VB, VP, 0, ZC + 0.05, ST);
  course(k, "L", VP, u0, u1, 0, Z1, 0.2);
  bx(k, u0 - 0.03, u1 + 0.03, VB, VP + 0.04, ZC - 0.06, ZC + 0.1, ST_L, { lw: 0.8 });
  slateHip(k, u0 + 0.02, VB + 0.02, ZC + 0.1, u1 - u0 - 0.04, VP - VB - 0.08, 0.55, 0.7);
  balus(k, u0, u1 + 0.02, VP + 0.07, ZC + 0.1, 0.16, u1 + 0.02, VB);
  // arcaded ground floor projecting to the terrace edge
  bx(k, 4.2, 5.8, VP, VF, 0, Z1, RUST, { top: "#efe6cf" });
  course(k, "L", VF, 4.2, 5.8, 0, Z1, 0.2);
  const F = face("L", VF);
  for (let i = 0; i < 5; i++) { const a = 4.2 + 0.16 + i * 0.32; win(k, F, a, 0.08, 0.2, 0.86, { arch: true, sur: true, sill: false }); }
  // terrace: balustrade at the front and both sides, double steps down the middle
  balus(k, 4.2, 5.8, VF - 0.04, Z1, 0.2, 5.8, VP);
  { const c = k.ctx; c.strokeStyle = "#a89a78"; c.lineWidth = 1.3; c.beginPath(); for (let vv = VP; vv <= VF; vv += 0.1) { c.moveTo(...P(4.2, vv, Z1)); c.lineTo(...P(4.2, vv, Z1 + 0.2)); } c.stroke(); }
  // French windows to the balcony, centre one with a gold balconette
  { const w = 0.3; for (const a of [4.45, 5.0, 5.55]) win(k, face("L", VP), a, Z1 + 0.05, w, 1.0, { sur: true, arch: true }); }
  // six columns of the portico, entablature, pediment
  for (let i = 0; i < 6; i++) column(k, 4.32 + i * 0.272, VF - 0.12, Z1 + 0.05, 2.42);
  bx(k, 4.18, 5.82, VP - 0.1, VF + 0.02, 2.42, 2.6, ST_L, { lw: 0.9 });
  { // frieze triglyph hints
    const c = k.ctx; c.strokeStyle = "rgba(120,100,70,0.5)"; c.lineWidth = 0.9; c.beginPath();
    for (let a = 4.25; a < 5.8; a += 0.12) { c.moveTo(...P(a, VF + 0.02, 2.46)); c.lineTo(...P(a, VF + 0.02, 2.56)); }
    c.stroke();
  }
  // gable roof of the portico (ridge along v): right slope, then the tympanum on the front plane
  pg(k, [[5.84, VF + 0.02, 2.6], [5.84, VP - 0.1, 2.6], [uc, VP - 0.1, 3.3], [uc, VF + 0.02, 3.3]], "#a9a79a", 0.9);
  pg(k, [[4.14, VF + 0.02, 2.6], [5.86, VF + 0.02, 2.6], [uc, VF + 0.02, 3.33]], ST_L, 1);
  pg(k, [[4.3, VF + 0.03, 2.66], [5.7, VF + 0.03, 2.66], [uc, VF + 0.03, 3.18]], "#dfd4b8", 0.7);
  { // sculpted group in the tympanum: seated figures + gold shield
    const c = k.ctx, pos = [[4.62, 2.74, 0.1], [4.82, 2.76, 0.14], [uc, 2.78, 0.18], [5.18, 2.76, 0.14], [5.38, 2.74, 0.1]];
    for (const [a, z, s] of pos) { const [x, y] = P(a, VF + 0.03, z); c.fillStyle = "#f6efdc"; c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.ellipse(x, y - 4, 2.2, 4.4 * (s / 0.1) * 0.55 + 1, 0, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.arc(x, y - 4 - 4.4 * (s / 0.1) * 0.55 - 3, 1.6, 0, 7); c.fill(); c.stroke(); }
    const [sx, sy] = P(uc, VF + 0.03, 3.02); c.fillStyle = GOLD; c.beginPath(); c.arc(sx, sy, 3.2, 0, 7); c.fill(); c.stroke();
  }
  // pavilion-style side pieces of the central right wall
  wins(k, "R", u1, VB + 0.1, VP - 0.28, [0.25], 3, 0.2, 0.62, { arch: true, sur: false });
  wins(k, "R", u1, VB + 0.1, VP - 0.28, [1.38], 3, 0.22, 0.82, {});
}

// the Royal Standard: quartered lions + harp, waving in screen space around a P() anchor
function royalStandard(k, t) {
  const c = k.ctx, [x, y0] = P(5.0, 1.35, 3.25), [, yt] = P(5.0, 1.35, 5.3);
  c.strokeStyle = INK; c.lineWidth = 3.4; c.lineCap = "round"; c.beginPath(); c.moveTo(x, y0); c.lineTo(x, yt); c.stroke();
  c.strokeStyle = GOLD; c.lineWidth = 1.8; c.stroke();
  c.fillStyle = "#e6bd45"; c.beginPath(); c.arc(x, yt - 3, 2.6, 0, 7); c.fill();
  const w = 56, h = 44, ox = x + 2, oy = yt + 4, wave = (s) => Math.sin(t * 5 - s * 4) * 3.6 * s;
  const X = (s, d) => [ox + s * w, oy + d * h + wave(s)];
  const outlinePts = []; for (let i = 0; i <= 12; i++) outlinePts.push(X(i / 12, 0)); for (let i = 12; i >= 0; i--) outlinePts.push(X(i / 12, 1));
  c.save(); c.beginPath(); outlinePts.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.clip();
  const q = (s0, s1, d0, d1, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(...X(s0, d0)); c.lineTo(...X(s1, d0)); c.lineTo(...X(s1, d1)); c.lineTo(...X(s0, d1)); c.closePath(); c.fill(); };
  q(0, 1, 0, 1, "#d6402c"); q(0, 0.5, 0, 0.5, "#e8b23a"); q(0.5, 1, 0.5, 1, "#e8b23a"); q(0.5, 1, 0, 0.5, "#d6402c"); q(0, 0.5, 0.5, 1, "#2a4d9a");
  c.fillStyle = "#c92e22"; for (const [s, d] of [[0.25, 0.25], [0.75, 0.75], [0.75, 0.25]]) { const [px, py] = X(s, d); c.fillRect(px - 6, py - 3, 12, 6); c.fillRect(px + 2, py - 7, 4, 4); }
  c.strokeStyle = "#e8b23a"; c.lineWidth = 1.6; { const [hx, hy] = X(0.25, 0.75); c.beginPath(); c.moveTo(hx - 3, hy + 7); c.lineTo(hx - 3, hy - 6); c.quadraticCurveTo(hx + 7, hy - 6, hx + 5, hy + 7); c.stroke(); }
  c.restore();
  c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); outlinePts.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.stroke();
}

export function makePalace() {
  return {
    draw(k, t) {
      // low stone plinth platform under the whole range (axis-aligned, inside the footprint)
      bx(k, 0.4, 9.6, 0.4, 3.0, 0, 0.06, "#d9ceb4", { lw: 0.8, noR: false });
      pavilion(k, 0.5, 2.3, false);
      wing(k, 2.3, 4.1);
      centre(k, t);
      wing(k, 5.9, 7.7);
      pavilion(k, 7.7, 9.5, true);
      royalStandard(k, t);
    },
  };
}
