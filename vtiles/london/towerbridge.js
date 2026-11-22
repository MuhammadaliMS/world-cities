// Tower Bridge, grid pass: everything through P(u, v, z), every wall along u or v.
// Layout (u,v): river u 2.2-7.8; towers 1.5 square (u 2.3-3.8 and 6.2-7.7, v 3.75-5.25) on round piers; the bascule gap is
// u 3.8-6.2; deck v 3.75-5.25 at z 0.9; abutment pylons flank the road at u 1.0-1.5 / 8.5-9.0.
import { P, INK, shade, lerp, clamp, smooth } from "../../lib/vec-kit.js";

export const STONE = "#e4d4b0", STONE_D = "#bfa97c", BLUE = "#5d90c4", BLUE_D = "#3d6c9c", BLUE_L = "#d9e8f4", GOLD = "#e2bd55", SLATE = "#5e6571";
export const ZD = 0.9;                       // deck height
export const V0 = 3.75, V1 = 5.25;           // deck edges
export const T1 = [2.3, 3.8], T2 = [6.2, 7.7]; // tower u ranges
export const PERIOD = 22;
export const bascule = (t) => {
  const x = ((t % PERIOD) + PERIOD) % PERIOD;
  if (x < 5.5) return 0;
  if (x < 8.5) return smooth((x - 5.5) / 3);
  if (x < 12.5) return 1;
  if (x < 15.5) return 1 - smooth((x - 12.5) / 3);
  return 0;
};

function poly(c, pts, fill, lw = 1, stroke = INK) {
  c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (lw) { c.strokeStyle = stroke; c.lineWidth = lw; c.lineJoin = "round"; c.stroke(); }
}
const lp = (a, b, f) => [lerp(a[0], b[0], f), lerp(a[1], b[1], f)];

// pointed-arch outline (a = lateral, z) around centre a0, base z0, width w, height h -> array of [a,z]
function archPts(a0, z0, w, h, n = 6) {
  const pts = [[a0 - w / 2, z0], [a0 - w / 2, z0 + h * 0.68]];
  for (let i = 1; i < n; i++) { const s = i / n, x = -w / 2 + w / 2 * s; pts.push([a0 + x, z0 + h * 0.68 + (h * 0.32) * Math.sqrt(1 - Math.pow(1 - s, 2) * 0.999) * (1 - 0 * s)]); }
  pts.push([a0, z0 + h]);
  for (let i = n - 1; i >= 1; i--) { const s = i / n, x = w / 2 - w / 2 * s; pts.push([a0 + x, z0 + h * 0.68 + (h * 0.32) * Math.sqrt(1 - Math.pow(1 - s, 2) * 0.999)]); }
  pts.push([a0 + w / 2, z0 + h * 0.68], [a0 + w / 2, z0]);
  return pts;
}

// tunnel opening on the R face (u = u1): v 4.0-5.0, z up to ~2.55
const HOLE = archPts(4.5, ZD, 1.0, 1.65);
const DOORS = [archPts(3.88, ZD, 0.15, 0.8, 3), archPts(5.12, ZD, 0.15, 0.8, 3)];
export const towerGeom = (u0, u1) => {
  const hole = HOLE.map(([v, z]) => P(u1, v, z));
  const doors = DOORS.map((d) => d.map(([v, z]) => P(u1, v, z)));
  const sil = [P(u0, V1, 0), P(u1, V1, 0), P(u1, V0, 0), P(u1, V0, 5.5), P(u0, V0, 5.5), P(u0, V1, 5.5)];
  return { hole, doors, sil };
};
export function clipOutsideTower(c, u0, u1, withDoors = false) {
  const g = towerGeom(u0, u1), subs = [g.sil, g.hole, ...(withDoors ? g.doors : [])];
  c.beginPath(); c.rect(-4000, -4000, 9000, 9000);
  for (const s of subs) { s.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); }
  c.clip("evenodd");
}

// dark tunnel interior, drawn BEFORE the vehicles (so they show through the arch)
export function tunnelInterior(k, u0, u1) {
  const c = k.ctx, g = towerGeom(u0, u1);
  poly(c, g.hole, "#2b3440", 0); for (const d of g.doors) poly(c, d, "#2b3440", 0);
  // road floor + a glimpse of light at the far end
  poly(c, [P(u1, 4.0, ZD), P(u1, 5.0, ZD), P(u0, 5.0, ZD), P(u0, 4.0, ZD)], "#4a525c", 0);
}

function gothic(c, f, a, z0, w, h, glass = "#46536a", frame = "#fbf3dc") {
  const pts = archPts(a, z0, w, h, 4).map(([aa, z]) => f(aa, z));
  poly(c, pts, null, 0); c.strokeStyle = frame; c.lineWidth = 2.2; c.lineJoin = "round"; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.stroke();
  poly(c, pts, glass, 0.6);
  c.strokeStyle = "rgba(240,225,180,0.6)"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(...f(a, z0)); c.lineTo(...f(a, z0 + h * 0.85)); c.stroke();
}

function turret(k, u, v, w, z0, z1, zs) {
  const c = k.ctx;
  k.box(u, v, z0, w, w, z1 - z0, "#e8d8b2", { hatch: false, shadow: false });
  // lancet slits on both faces
  for (const zz of [z0 + 0.35, z0 + 0.95, z0 + 1.55]) {
    if (zz > z1 - 0.5) continue;
    const fL = (a, z) => P(u + a * w, v + w, z), fR = (a, z) => P(u + w, v + a * w, z);
    for (const f of [fL, fR]) { const pts = archPts(0.5, zz, 0.2, 0.36, 3).map(([a, z]) => f(a, z)); poly(c, pts, "#3b4658", 0.5); }
  }
  k.box(u - 0.03, v - 0.03, z1, w + 0.06, w + 0.06, 0.07, "#efe0bc", { hatch: false, shadow: false });
  k.hip(u - 0.02, v - 0.02, z1 + 0.07, w + 0.04, w + 0.04, zs, "#59525a", {});
  const [gx, gy] = P(u + w / 2, v + w / 2, z1 + 0.07 + zs);
  c.fillStyle = GOLD; c.beginPath(); c.arc(gx, gy - 1, 2, 0, 7); c.fill(); c.strokeStyle = GOLD; c.lineWidth = 1.4; c.beginPath(); c.moveTo(gx, gy - 2); c.lineTo(gx, gy - 9); c.moveTo(gx - 2.5, gy - 6.5); c.lineTo(gx + 2.5, gy - 6.5); c.stroke();
}

// the gothic tower on its pier
export function drawTower(k, t, [u0, u1]) {
  const c = k.ctx, W = u1 - u0, ZT = 5.2, ZB = 0.5;
  const cu = (u0 + u1) / 2, cv = (V0 + V1) / 2;
  // pier
  k.cyl(cu, cv, 0, 1.12, 0.55, "#d8c79c", { top: true, topCol: "#e4d6b2" });
  { const [px, py] = P(cu, cv, 0), rx = 1.12 * 45 * Math.SQRT2, ry = rx * 0.577;
    c.save(); c.strokeStyle = "rgba(90,70,40,0.5)"; c.lineWidth = 0.8;
    for (let i = 1; i < 3; i++) { const [, yy] = P(cu, cv, i * 0.18); c.beginPath(); c.ellipse(px, yy, rx, ry, 0, 0, Math.PI); c.stroke(); }
    c.strokeStyle = `rgba(255,255,255,${0.65 + 0.2 * Math.sin(t * 2 + u0)})`; c.lineWidth = 1.6; c.beginPath(); c.ellipse(px, py + 1, rx + 3, ry + 2, 0, 0, Math.PI); c.stroke(); c.restore(); }
  // shaft faces
  const fL = (a, z) => P(u0 + a, V1, z), fR = (a, z) => P(u1, V0 + a, z);
  const L = [fL(0, ZB), fL(W, ZB), fL(W, ZT), fL(0, ZT)];
  poly(c, L, "#e6d6b0", 1.3);
  // R face with the tunnel + door holes (even-odd)
  const g = towerGeom(u0, u1);
  c.beginPath(); [fR(0, ZB), fR(1.5, ZB), fR(1.5, ZT), fR(0, ZT)].forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath();
  for (const s of [g.hole, ...g.doors]) { s.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); }
  c.fillStyle = "#bba682"; c.fill("evenodd"); c.strokeStyle = INK; c.lineWidth = 1.3; c.lineJoin = "round"; c.stroke();
  // stone coursing + pilasters + string courses
  for (const [f, lenA, col, dk] of [[fL, W, "#efe2c2", "#d8c8a0"], [fR, 1.5, "#cdb88f", "#a8946c"]]) {
    c.strokeStyle = dk; c.lineWidth = 0.55; c.beginPath();
    for (let z = ZB + 0.3; z < ZT; z += 0.3) { c.moveTo(...f(0, z)); c.lineTo(...f(lenA, z)); }
    c.stroke();
    for (const a of [0.04, lenA / 2, lenA - 0.04]) poly(c, [f(a - 0.05, ZB), f(a + 0.05, ZB), f(a + 0.05, ZT), f(a - 0.05, ZT)], col, 0.6);
    for (const z of [2.7, 3.9, 4.95]) poly(c, [f(0, z), f(lenA, z), f(lenA, z + 0.08), f(0, z + 0.08)], col, 0.5);
  }
  // windows: L face (3 per row), R face (above the tunnel)
  for (const [z0, h] of [[1.15, 0.85], [2.0, 0.55]]) for (const a of [0.3, 0.75, 1.2]) gothic(c, fL, a, z0, 0.14, h);
  for (const z0 of [3.0, 4.15]) for (const a of [0.3, 0.75, 1.2]) { gothic(c, fL, a, z0, 0.16, 0.75); }
  for (const z0 of [3.0, 4.15]) for (const a of [0.3, 0.75, 1.2]) { gothic(c, fR, a, z0, 0.16, 0.75, "#3c485c", "#d9c7a0"); }
  for (const a of [0.3, 1.2]) gothic(c, fR, a, 2.75, 0.14, 0.5, "#3c485c", "#d9c7a0");
  // tunnel jamb, arch ring
  c.strokeStyle = "#e9dcbc"; c.lineWidth = 2; c.beginPath(); g.hole.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.stroke();
  c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  // oriel balcony, L face centre
  { const p = (a, z, o) => P(u0 + a, V1 + o, z); poly(c, [p(0.5, 2.55, 0.1), p(1.0, 2.55, 0.1), p(1.0, 2.75, 0.1), p(0.5, 2.55 + 0.2, 0.1)], "#f0e4c6", 0.8); }
  // parapet + corbels
  k.box(u0 - 0.06, V0 - 0.06, ZT, W + 0.12, 1.5 + 0.12, 0.16, "#ead9b2", { hatch: false, shadow: false });
  k.box(u0 + 0.05, V0 + 0.05, ZT + 0.16, W - 0.1, 1.4, 0.08, "#c9b68e", { hatch: false, shadow: false });
  // turrets (back, roof, sides, front)
  const tw = 0.3;
  turret(k, u0 - 0.02, V0 - 0.02, tw, 3.7, 5.95, 1.15);
  k.hip(u0 + 0.25, V0 + 0.25, ZT + 0.24, W - 0.5, 1.0, 1.55, SLATE, {});
  // dormers on the roof (L + R)
  { const f1 = (a, z) => P(u0 + 0.3 + a, V1 - 0.28, z); }
  turret(k, u1 - tw + 0.02, V0 - 0.02, tw, 3.7, 5.95, 1.15);
  turret(k, u0 - 0.02, V1 - tw + 0.02, tw, 3.7, 5.95, 1.15);
  turret(k, u1 - tw + 0.02, V1 - tw + 0.02, tw, 3.7, 5.95, 1.15);
  // gold crown on the roof ridge
  { const [gx, gy] = P(cu, cv, ZT + 0.24 + 1.55); c.fillStyle = GOLD; c.beginPath(); c.moveTo(gx - 6, gy + 1); c.lineTo(gx - 6, gy - 8); c.lineTo(gx - 3, gy - 4); c.lineTo(gx, gy - 12); c.lineTo(gx + 3, gy - 4); c.lineTo(gx + 6, gy - 8); c.lineTo(gx + 6, gy + 1); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke(); }
}

// ---- decks ----
const asphalt = "#868b92", foot = "#e4d7b6";
export const zRoad = (u) => (u <= 0.9 || u >= 9.1 ? 0 : u < 1.6 ? ZD * (u - 0.9) / 0.7 : u > 8.4 ? ZD * (9.1 - u) / 0.7 : ZD);

// one slab of road between u a and b (full deck width v 3.75-5.25); girder face on the near edge
export function deckSeg(k, a, b, o = {}) {
  const c = k.ctx, za = zRoad(a), zb = zRoad(b), thk = o.thk ?? 0.28;
  const flat = Math.min(za, zb) > 0.85;
  if (thk > 0 && (za > 0.02 || zb > 0.02)) {
    // girder (near face, v = V1)
    poly(c, [P(a, V1, za), P(b, V1, zb), P(b, V1, zb - thk), P(a, V1, za - thk)], flat ? BLUE : "#d4c39b", 1);
    if (flat) { c.save(); poly(c, [P(a, V1, za), P(b, V1, zb), P(b, V1, zb - thk), P(a, V1, za - thk)], null, 0); c.clip(); c.strokeStyle = BLUE_L; c.lineWidth = 1.2; c.beginPath();
      const n = Math.max(1, Math.round((b - a) / 0.2)); for (let i = 0; i < n; i++) { const u0 = lerp(a, b, i / n), u1 = lerp(a, b, (i + 1) / n); c.moveTo(...P(u0, V1, za)); c.lineTo(...P(u1, V1, za - thk)); c.moveTo(...P(u1, V1, za)); c.lineTo(...P(u0, V1, za - thk)); } c.stroke(); c.restore(); }
  }
  const q = (v0, v1, col, lw = 0.6) => poly(c, [P(a, v0, za), P(b, v0, zb), P(b, v1, zb), P(a, v1, za)], col, lw);
  q(V0, V1, asphalt, 0.9); q(V0, 4.0, foot); q(5.0, V1, foot);
  c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 1; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(...P(a, 4.5, za)); c.lineTo(...P(b, 4.5, zb)); c.stroke(); c.setLineDash([]);
  c.strokeStyle = "rgba(120,100,70,0.6)"; c.lineWidth = 0.9; c.beginPath(); for (const v of [4.0, 5.0]) { c.moveTo(...P(a, v, za)); c.lineTo(...P(b, v, zb)); } c.stroke();
}
// railing on one edge (v = V0 or V1): posts + top rail
export function deckRail(k, a, b, v, h = 0.28) {
  const c = k.ctx, za = zRoad(a), zb = zRoad(b);
  c.strokeStyle = BLUE_D; c.lineWidth = 1.2; c.lineCap = "round"; c.beginPath();
  const n = Math.max(2, Math.round((b - a) / 0.12)); for (let i = 0; i <= n; i++) { const u = lerp(a, b, i / n), z = lerp(za, zb, i / n); c.moveTo(...P(u, v, z)); c.lineTo(...P(u, v, z + h)); }
  c.stroke(); c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(...P(a, v, za + h)); c.lineTo(...P(b, v, zb + h)); c.stroke(); c.strokeStyle = BLUE_L; c.lineWidth = 1.2; c.stroke();
}

// ---- bascule leaf: side "L" hinged at u = 4.4 (tip 5.0), "R" hinged at u = 5.6 (tip 5.0) ----
export function leafShape(side, lift) {
  const Lb = (T2[0] - T1[1]) / 2, th = lift * (Math.PI / 180) * 68, hinge = side === "L" ? T1[1] : T2[0], dir = side === "L" ? 1 : -1;
  const pt = (s, v, dz = 0) => P(hinge + dir * s * Lb * Math.cos(th), v, ZD + s * Lb * Math.sin(th) + dz);
  return { pt, th, hinge };
}
export function drawLeaf(k, side, lift) {
  const c = k.ctx, { pt, th } = leafShape(side, lift), thk = 0.28;
  // steel underside + girder (near face), tip end face
  poly(c, [pt(0, V1), pt(1, V1), pt(1, V1, -thk), pt(0, V1, -thk)], BLUE, 1.1);
  c.save(); poly(c, [pt(0, V1), pt(1, V1), pt(1, V1, -thk), pt(0, V1, -thk)], null, 0); c.clip(); c.strokeStyle = BLUE_L; c.lineWidth = 1.2; c.beginPath();
  for (let i = 0; i < 4; i++) { const s0 = i / 4, s1 = (i + 1) / 4; c.moveTo(...pt(s0, V1)); c.lineTo(...pt(s1, V1, -thk)); c.moveTo(...pt(s1, V1)); c.lineTo(...pt(s0, V1, -thk)); } c.stroke(); c.restore();
  if (side === "L") poly(c, [pt(1, V0), pt(1, V1), pt(1, V1, -thk), pt(1, V0, -thk)], BLUE_D, 1);
  const q = (v0, v1, col) => poly(c, [pt(0, v0), pt(1, v0), pt(1, v1), pt(0, v1)], col, 0.7);
  const topVisible = side === "R" || Math.tan(th) < 1.3;
  if (topVisible) {
    q(V0, V1, asphalt); q(V0, 4.0, foot); q(5.0, V1, foot);
    c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 1; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(...pt(0, 4.5)); c.lineTo(...pt(1, 4.5)); c.stroke(); c.setLineDash([]);
  } else {
    poly(c, [pt(0, V0, -thk), pt(1, V0, -thk), pt(1, V1, -thk), pt(0, V1, -thk)], BLUE_D, 1);
    c.strokeStyle = BLUE_L; c.lineWidth = 1; c.beginPath(); for (let i = 1; i < 4; i++) { c.moveTo(...pt(i / 4, V0, -thk)); c.lineTo(...pt(i / 4, V1, -thk)); } c.stroke();
  }
  // near rail
  c.strokeStyle = BLUE_D; c.lineWidth = 1.2; c.lineCap = "round"; c.beginPath(); for (let i = 0; i <= 4; i++) { const s = i / 4; c.moveTo(...pt(s, V1)); c.lineTo(...pt(s, V1, 0.28)); } c.stroke();
  c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(...pt(0, V1, 0.28)); c.lineTo(...pt(1, V1, 0.28)); c.stroke(); c.strokeStyle = BLUE_L; c.lineWidth = 1.2; c.stroke();
}
// back rail of a leaf (drawn first)
export function drawLeafBackRail(k, side, lift) {
  const c = k.ctx, { pt } = leafShape(side, lift);
  c.strokeStyle = BLUE_D; c.lineWidth = 1.1; c.beginPath(); for (let i = 0; i <= 4; i++) { const s = i / 4; c.moveTo(...pt(s, V0)); c.lineTo(...pt(s, V0, 0.28)); } c.stroke();
  c.strokeStyle = INK; c.lineWidth = 2.4; c.beginPath(); c.moveTo(...pt(0, V0, 0.28)); c.lineTo(...pt(1, V0, 0.28)); c.stroke(); c.strokeStyle = BLUE; c.lineWidth = 1.1; c.stroke();
}
// shadow of the closed deck on the water
export function deckShadow(k, lift) {
  const a = 0.2 * (1 - lift);
  if (a > 0.01) k.poly([[T1[1] + 0.2, V0 + 0.15, 0], [T2[0] + 0.2, V0 + 0.15, 0], [T2[0] + 0.2, V1 + 0.15, 0], [T1[1] + 0.2, V1 + 0.15, 0]], `rgba(25,55,95,${a})`, { stroke: false });
}

// ---- high-level walkway between the towers ----
export function drawHighWalk(k) {
  const c = k.ctx, a = T1[1], b = T2[0], z0 = 4.05, z1 = 4.75, va = 4.12, vb = 4.88;
  // back inner panel
  poly(c, [P(a, va, z0), P(b, va, z0), P(b, va, z1), P(a, va, z1)], "#cdbd98", 0.8);
  // roof + top
  k.box(a, va, z0, b - a, vb - va, z1 - z0, BLUE, { hatch: false, shadow: false, left: BLUE, right: BLUE_D, top: "#d9c9a6" });
  // lattice on the near (L) face
  c.save(); poly(c, [P(a, vb, z0), P(b, vb, z0), P(b, vb, z1), P(a, vb, z1)], null, 0); c.clip(); c.strokeStyle = BLUE_L; c.lineWidth = 1.4; c.beginPath();
  const n = 5; for (let i = 0; i < n; i++) { const u0 = lerp(a, b, i / n), u1 = lerp(a, b, (i + 1) / n); c.moveTo(...P(u0, vb, z0)); c.lineTo(...P(u1, vb, z1)); c.moveTo(...P(u1, vb, z0)); c.lineTo(...P(u0, vb, z1)); } c.stroke(); c.restore();
  c.strokeStyle = BLUE_D; c.lineWidth = 1.2; c.beginPath(); c.moveTo(...P(a, vb, z0 + 0.12)); c.lineTo(...P(b, vb, z0 + 0.12)); c.moveTo(...P(a, vb, z1 - 0.12)); c.lineTo(...P(b, vb, z1 - 0.12)); c.stroke();
  // gold crest on the walkway
  const [gx, gy] = P((a + b) / 2, vb, (z0 + z1) / 2);
  poly(c, [[gx - 8, gy + 8], [gx + 8, gy + 8], [gx + 8, gy - 6], [gx, gy - 12], [gx - 8, gy - 6]], "#ede0b8", 0.9);
  c.fillStyle = GOLD; c.beginPath(); c.moveTo(gx, gy + 5); c.quadraticCurveTo(gx - 5, gy - 1, gx, gy - 8); c.quadraticCurveTo(gx + 5, gy - 1, gx, gy + 5); c.fill();
}

// ---- abutment pylon: stone shaft, lancet slits, spire ----
export function drawPylon(k, u, v, w = 0.42) {
  const c = k.ctx;
  k.box(u - w / 2, v - w / 2, 0, w, w, 1.9, "#e8d8b2", { hatch: false });
  for (const z of [0.5, 1.1]) {
    const fL = (a, zz) => P(u - w / 2 + a * w, v + w / 2, zz), fR = (a, zz) => P(u + w / 2, v - w / 2 + a * w, zz);
    for (const f of [fL, fR]) poly(c, archPts(0.5, z, 0.22, 0.38, 3).map(([a, zz]) => f(a, zz)), "#3b4658", 0.5);
  }
  k.box(u - w / 2 - 0.04, v - w / 2 - 0.04, 1.9, w + 0.08, w + 0.08, 0.08, "#efe0bc", { hatch: false, shadow: false });
  k.hip(u - w / 2 - 0.02, v - w / 2 - 0.02, 1.98, w + 0.04, w + 0.04, 0.55, "#59525a", {});
  const [gx, gy] = P(u, v, 2.53); c.fillStyle = GOLD; c.beginPath(); c.arc(gx, gy - 1, 1.8, 0, 7); c.fill();
}

// ---- suspension chain in the plane v: tower attach (uT, zT) to pylon (uP, zP) ----
export function drawChain(k, v, uT, zT, uP, zP, sag = 0.35) {
  const c = k.ctx, N = 24, pts = [];
  for (let i = 0; i <= N; i++) { const f = i / N; pts.push([lerp(uT, uP, f), lerp(zT, zP, f) - sag * Math.sin(Math.PI * f)]); }
  c.lineCap = "round";
  // hangers to the deck rail
  c.strokeStyle = "#7f97ad"; c.lineWidth = 1.1; c.beginPath();
  for (let i = 2; i < N; i += 2) { const [u, z] = pts[i]; if (u > 0.9 && u < 9.1) { c.moveTo(...P(u, v, z)); c.lineTo(...P(u, v, Math.max(zRoad(u), ZD) + 0.28)); } }
  c.stroke();
  for (const [w, col] of [[8, INK], [5.6, BLUE], [1.6, BLUE_L]]) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); pts.forEach(([u, z], i) => { const p = P(u, v, z); i ? c.lineTo(...p) : c.moveTo(...p); }); c.stroke(); }
}
