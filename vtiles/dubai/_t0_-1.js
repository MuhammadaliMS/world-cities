// helpers for the Dubai 0,-1 tile (Palm Jumeirah & Atlantis). Private to this tile; _props.js is untouched.
// The tile is laid out in "frontal" plan coordinates: a = u - v (screen x / 45) and d = u + v (depth, larger = nearer).
// (a,d) is an isotropic rotation of (u,v), so circles and right angles survive; the palm is symmetric about a = 0.
import { P, CTS, INK, shade, lerp, clamp, rng, smooth, spline } from "../../lib/vec-kit.js";

export const AD = (a, d) => [(d + a) / 2, (d - a) / 2];
export const PA = (a, d, z = 0) => P((d + a) / 2, (d - a) / 2, z);
export const SAND = "#f0d7a2", SAND_D = "#dcb97e", SAND_W = "#d9b47a", SEA = "#45b3ad", SEA_L = "#7fd3c6", POOL = "#5fd0d6";
export const PINK = "#f0a585", PINK_L = "#f8c4a8", PINK_D = "#d9866a", CREAM = "#f7e2c4", TEAL = "#2c7377", TEAL_L = "#5fa9a4", DOMEC = "#3f9e94", GOLD = "#e2ab3c";
export const TERRA = "#d8613d", VILLA = "#f4e3c5";

export const tr = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
// Chaikin smoothing of a closed (a,d) polygon
export function chaikin(pts, it = 2, closed = true) {
  let p = pts;
  for (let k = 0; k < it; k++) {
    const o = [], n = p.length;
    for (let i = 0; i < (closed ? n : n - 1); i++) { const a = p[i], b = p[(i + 1) % n]; o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); }
    if (!closed) { o.unshift(p[0]); o.push(p[n - 1]); }
    p = o;
  }
  return p;
}
export function inPoly(pt, poly) {
  let ins = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}
const interp = (knots, s) => {
  if (s <= knots[0][0]) return knots[0][1];
  for (let i = 0; i < knots.length - 1; i++) if (s <= knots[i + 1][0]) { const f = (s - knots[i][0]) / (knots[i + 1][0] - knots[i][0]); return lerp(knots[i][1], knots[i + 1][1], f); }
  const n = knots.length, [s0, d0] = knots[n - 2], [s1, d1] = knots[n - 1];
  return d1 + ((d1 - d0) / (s1 - s0)) * (s - s1);
};

// ---------- the palm: fronds, trunk, crown, crescent, gateway island ----------
// front (sand) edge of each frond as knots [s = |a|, d], tip s, sand band width (in d)
export const FRONDS = [
  { k: [[0.5, 8.85], [1.5, 8.78], [2.5, 8.5], [3.5, 8.3], [4.5, 8.15]], tip: 4.85, w: 0.98 },
  { k: [[0.5, 10.45], [1.5, 10.4], [2.5, 10.12], [3.5, 9.98], [4.5, 9.94], [5.5, 9.98], [6.5, 10.12], [7.0, 10.18]], tip: 7.55, w: 0.98 },
  { k: [[0.5, 11.85], [1.5, 11.8], [2.5, 11.66], [3.5, 11.68], [4.5, 11.8], [5.5, 12.08], [6.5, 12.36], [7.0, 12.48]], tip: 7.2, w: 1.0 },
  { k: [[0.5, 13.22], [1.5, 13.26], [2.5, 13.32], [3.5, 13.5], [4.5, 13.74], [5.2, 13.94]], tip: 5.55, w: 1.0 },
  { k: [[0.5, 14.72], [1.5, 14.84], [2.5, 15.12], [3.3, 15.42]], tip: 3.85, w: 0.95 },
];
export const frontD = (fi, s) => interp(FRONDS[fi].k, s);
export function frondPoly(fi, side) {
  const F = FRONDS[fi], w = F.w, top = [], front = [];
  for (let s = 0.35; s < F.tip; s += 0.25) { top.push([side * s, frontD(fi, s) - w]); front.push([side * s, frontD(fi, s)]); }
  const tc = [side * F.tip, frontD(fi, F.tip) - w / 2], cap = [];
  for (let i = 0; i <= 10; i++) { const th = -Math.PI / 2 + (i / 10) * Math.PI; cap.push([tc[0] + side * Math.cos(th) * w / 2, tc[1] + Math.sin(th) * w / 2]); }
  return chaikin([...top, ...cap, ...front.reverse()], 2);
}
// crown: hotel grounds + beach + both crescents + the trunk + the gateway island, as one polygon
const BEACH = [[0.6, 6.5], [1.5, 6.5], [2.5, 6.5], [3.0, 6.52], [3.5, 6.58], [4.0, 6.64], [4.5, 6.76], [5.0, 6.92], [5.5, 7.08], [6.0, 7.27], [6.5, 7.5], [7.0, 7.8], [7.5, 8.2], [8.0, 8.66], [8.32, 8.82], [8.5, 8.66]];
const ISLAND = [[0.6, 15.85], [1.3, 15.75], [1.95, 15.95], [2.3, 16.5], [2.25, 17.15], [1.75, 17.75], [1.0, 18.35], [0.0, 18.75]];
export function crownPoly() {
  const right = [[0, 0], [8.5, 8.5], ...BEACH.slice().reverse().map(([s, d]) => [s, d]), [0.72, 6.62], [0.76, 15.6], ...ISLAND];
  const left = right.slice(1, -1).reverse().map(([a, d]) => [-a, d]);
  const raw = [...right, ...left];
  // smooth everything except the two back edges (keep the tile corner crisp)
  return raw;
}
export const CROWN = (() => {
  const r = crownPoly();
  // smooth beach + island stretches only
  const n = r.length, sm = chaikin(r.slice(2, n - 1), 2, false);
  return [r[0], r[1], ...sm, r[n - 1]];
})();
const ccw = (p) => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s > 0 ? p : [...p].reverse(); };
export const LAND = [CROWN, ...[0, 1, 2, 3, 4].flatMap((i) => [frondPoly(i, -1), frondPoly(i, 1)])].map(ccw);
export const isLand = (a, d, pad = 0) => {
  if (pad === 0) return LAND.some((p) => inPoly([a, d], p));
  for (let i = 0; i < 8; i++) { const th = (i / 8) * 6.2832; if (LAND.some((p) => inPoly([a + Math.cos(th) * pad, d + Math.sin(th) * pad], p))) return true; }
  return LAND.some((p) => inPoly([a, d], p));
};

// ---------- generic frontal-plan prism (convex footprint in (a,d)) ----------
// returns visible faces {A,B,na,F(s,z),poly,len} ordered left to right on screen
export function prism(k, foot, z0, z1, col, o = {}) {
  let ca = 0, cd = 0; for (const [a, d] of foot) { ca += a; cd += d; } ca /= foot.length; cd /= foot.length;
  const faces = [];
  for (let i = 0; i < foot.length; i++) {
    const p = foot[i], q = foot[(i + 1) % foot.length];
    let na = q[1] - p[1], nd = -(q[0] - p[0]);
    if (na * ((p[0] + q[0]) / 2 - ca) + nd * ((p[1] + q[1]) / 2 - cd) < 0) { na = -na; nd = -nd; }
    const L = Math.hypot(na, nd) || 1; na /= L; nd /= L;
    if (nd <= 0.03) continue;
    const [A, B] = p[0] <= q[0] ? [p, q] : [q, p];
    const poly = [PA(A[0], A[1], z0), PA(B[0], B[1], z0), PA(B[0], B[1], z1), PA(A[0], A[1], z1)];
    const F = (s, z) => PA(lerp(A[0], B[0], s), lerp(A[1], B[1], s), z);
    faces.push({ A, B, na, nd, F, poly, z0, z1, len: Math.hypot(B[0] - A[0], B[1] - A[1]) / Math.SQRT2 });
  }
  faces.sort((f, g) => f.A[0] - g.A[0]);
  for (const f of faces) {
    const fc = o.faceCol ? o.faceCol(f.na) : shade(col, -0.1 - 0.14 * f.na);
    k.path(f.poly, { fill: fc, lw: o.lw ?? 1.3, wobble: 0 });
    if (o.hatch && f.na > 0.3 && z1 - z0 > 0.3) k.hatch(f.poly, { gap: 6, color: "rgba(42,36,32,0.13)" });
  }
  if (o.top !== false) k.path(foot.map(([a, d]) => PA(a, d, z1)), { fill: o.topCol || shade(col, 0.07), lw: o.lw ?? 1.3, wobble: 0 });
  return faces;
}
export const rectAD = (a0, a1, d0, d1) => [[a0, d0], [a1, d0], [a1, d1], [a0, d1]];
export function octAD(ac, dF, hw, dep, ch) { return [[ac - hw, dF - ch], [ac - hw + ch, dF], [ac + hw - ch, dF], [ac + hw, dF - ch], [ac + hw, dF - dep + ch], [ac + hw - ch, dF - dep], [ac - hw + ch, dF - dep], [ac - hw, dF - dep + ch]]; }
// oriented rectangle footprint centred (a,d), heading (ta,td), length L, width W (plan units)
export function orect(a, d, ta, td, L, W, nose = 0) {
  const l = Math.hypot(ta, td) || 1; ta /= l; td /= l; const na = -td, nd = ta;
  const s = Math.SQRT2; // plan units -> (a,d) units
  const hl = (L / 2) * s, hw = (W / 2) * s;
  const pts = [[-hl, -hw], [hl - nose * s, -hw], [hl, -hw * 0.45], [hl, hw * 0.45], [hl - nose * s, hw], [-hl, hw]];
  return pts.map(([x, y]) => [a + ta * x + na * y, d + td * x + nd * y]);
}

// pointed (moorish) arch outline on a face: s0..s1 along the face, spring z, peak height above spring
export function archPath(F, s0, s1, z0, zs, ph, n = 8) {
  const m = (s0 + s1) / 2, pts = [F(s0, z0), F(s0, zs)];
  for (let i = 1; i <= n; i++) { const th = (i / n) * (Math.PI / 2); pts.push(F(m - (m - s0) * Math.cos(th) * (1 - 0.15 * Math.sin(th)), zs + ph * Math.sin(th) * (0.75 + 0.25 * (i / n)))); }
  for (let i = n - 1; i >= 1; i--) { const th = (i / n) * (Math.PI / 2); pts.push(F(m + (s1 - m) * Math.cos(th) * (1 - 0.15 * Math.sin(th)), zs + ph * Math.sin(th) * (0.75 + 0.25 * (i / n)))); }
  pts.push(F(s1, zs), F(s1, z0));
  return pts;
}
// window bays: recessed teal strips between piers, with storey spandrels and arched heads
export function bays(k, f, o = {}) {
  const c = k.ctx, n = o.n ?? 4, z0 = o.z0 ?? f.z0 + 0.2, z1 = o.z1 ?? f.z1 - 0.2, rows = o.rows ?? 5, fill = o.fill ?? 0.56, mx = o.mx ?? 0.04;
  const dark = f.na > 0.3, col = shade(o.col || TEAL, dark ? -0.22 : f.na < -0.3 ? 0.05 : -0.06);
  const t = k.t, cw = (1 - 2 * mx) / n, ah = o.arch ?? 0.12;
  for (let i = 0; i < n; i++) {
    const s0 = mx + i * cw + cw * (1 - fill) / 2, s1 = s0 + cw * fill;
    const pts = archPath(f.F, s0, s1, z0, z1 - ah, ah, 5);
    k.path(pts, { fill: col, lw: o.lw ?? 0.9, wobble: 0 });
    // glazing: mullion + storey spandrels + a few lit panes / sun glints
    c.save(); tr(c, pts); c.clip();
    c.strokeStyle = o.spandrel || shade(o.pier || PINK, dark ? -0.2 : 0.02); c.lineWidth = Math.max(1.1, ((z1 - z0) / rows) * 9);
    c.beginPath(); for (let r = 1; r < rows; r++) { const z = lerp(z0, z1 - ah, r / rows); c.moveTo(...f.F(s0, z)); c.lineTo(...f.F(s1, z)); } c.stroke();
    c.strokeStyle = "rgba(20,40,45,0.45)"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(...f.F((s0 + s1) / 2, z0)); c.lineTo(...f.F((s0 + s1) / 2, z1)); c.stroke();
    const R = rng((o.seed ?? 1) * 31 + i);
    for (let r = 0; r < rows; r++) {
      const zz = lerp(z0, z1 - ah, (r + 0.5) / rows), g = Math.max(0, Math.sin(t * 0.9 + R() * 6.28 + i * 0.4));
      if (g > 0.8) { const [x, y] = f.F(lerp(s0, s1, 0.3), zz); c.fillStyle = `rgba(255,255,240,${(g - 0.8) * 3})`; c.fillRect(x - 1, y - 2.5, 2, 4); }
      else if (R() < 0.25) { const [x, y] = f.F(lerp(s0, s1, 0.25), zz); c.fillStyle = "rgba(160,220,215,0.55)"; c.fillRect(x - 0.6, y - 2, 1.4, 3); }
    }
    c.restore();
  }
}
export function band(k, f, z0, z1, col, o = {}) { k.path([f.F(o.s0 ?? 0, z0), f.F(o.s1 ?? 1, z0), f.F(o.s1 ?? 1, z1), f.F(o.s0 ?? 0, z1)], { fill: shade(col, f.na > 0.3 ? -0.18 : f.na < -0.3 ? 0.03 : -0.05), lw: o.lw ?? 0.9, wobble: 0 }); }
// merlons along the top edge of a face
export function crenel(k, f, z, n, col, h = 0.07) {
  for (let i = 0; i < n; i++) { const s0 = (i + 0.2) / n, s1 = (i + 0.75) / n; k.path([f.F(s0, z), f.F(s1, z), f.F(s1, z + h), f.F(s0, z + h)], { fill: shade(col, f.na > 0.3 ? -0.15 : 0), lw: 0.8, wobble: 0 }); }
}

// onion dome (teal) with ribs + gold finial
export function onion(k, a, d, z, r, h, col = DOMEC, o = {}) {
  const c = k.ctx, [x, y] = PA(a, d, z), rx = r * CTS.S * Math.SQRT2, ry = rx * CTS.YS, hh = h * CTS.S * CTS.ZS;
  const g = c.createLinearGradient(x - rx, y - hh, x + rx, y);
  g.addColorStop(0, shade(col, 0.35)); g.addColorStop(0.45, col); g.addColorStop(1, shade(col, -0.32));
  c.beginPath(); c.moveTo(x - rx * 0.92, y);
  c.bezierCurveTo(x - rx * 1.18, y - hh * 0.3, x - rx * 0.9, y - hh * 0.62, x - rx * 0.2, y - hh * 0.84);
  c.quadraticCurveTo(x - rx * 0.04, y - hh * 0.9, x, y - hh);
  c.quadraticCurveTo(x + rx * 0.04, y - hh * 0.9, x + rx * 0.2, y - hh * 0.84);
  c.bezierCurveTo(x + rx * 0.9, y - hh * 0.62, x + rx * 1.18, y - hh * 0.3, x + rx * 0.92, y);
  c.ellipse(x, y, rx * 0.92, ry * 0.92, 0, 0, Math.PI);
  c.closePath(); c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = o.lw ?? 1.2; c.stroke();
  if (o.ribs !== false && rx > 5) { c.save(); c.clip(); c.strokeStyle = "rgba(20,60,55,0.45)"; c.lineWidth = 0.7; for (const f of [-0.55, 0, 0.55]) { c.beginPath(); c.moveTo(x + f * rx * 0.9, y + ry * 0.8 * Math.sqrt(1 - f * f)); c.quadraticCurveTo(x + f * rx * 1.05, y - hh * 0.5, x, y - hh); c.stroke(); } c.strokeStyle = "rgba(255,255,255,0.55)"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - rx * 0.62, y - hh * 0.15); c.quadraticCurveTo(x - rx * 0.75, y - hh * 0.45, x - rx * 0.32, y - hh * 0.7); c.stroke(); c.restore(); }
  if (o.finial !== false) finial(k, x, y - hh, o.fs ?? Math.max(0.6, rx / 12));
}
export function finial(k, x, y, s = 1) {
  const c = k.ctx;
  c.strokeStyle = INK; c.lineWidth = 2.2 * s; c.lineCap = "round"; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 9 * s); c.stroke();
  c.strokeStyle = GOLD; c.lineWidth = 1.1 * s; c.stroke();
  c.fillStyle = GOLD; c.strokeStyle = INK; c.lineWidth = 0.8;
  for (const [yy, r] of [[-3 * s, 2.1 * s], [-6.5 * s, 1.5 * s]]) { c.beginPath(); c.arc(x, y + yy, r, 0, 6.3); c.fill(); c.stroke(); }
}
// plain dome on a drum (white / teal)
export function domeDrum(k, a, d, z, r, hDrum, hDome, wall, dome, o = {}) {
  const [u, v] = AD(a, d);
  k.cyl(u, v, z, r, hDrum, wall, { topCol: shade(wall, 0.05) });
  // arched windows on the front half of the drum
  const c = k.ctx, n = o.win ?? 5;
  for (let i = 0; i < n; i++) {
    const th = Math.PI * (0.15 + (0.7 * i) / (n - 1)), ca = Math.cos(th), sa = Math.sin(th);
    const pa = a - ca * r * Math.SQRT2 * 0.98, pd = d + sa * r * Math.SQRT2 * 0.98;
    const [x, y0] = PA(pa, pd, z + hDrum * 0.18), [, y1] = PA(pa, pd, z + hDrum * 0.78), w = 2.6 * sa + 0.6;
    c.fillStyle = shade(TEAL, ca < -0.3 ? -0.25 : 0); c.strokeStyle = INK; c.lineWidth = 0.6;
    c.beginPath(); c.moveTo(x - w, y0); c.lineTo(x - w, y1 + w); c.quadraticCurveTo(x, y1 - w * 0.8, x + w, y1 + w); c.lineTo(x + w, y0); c.closePath(); c.fill(); c.stroke();
  }
  // cornice ring
  const [x, y] = PA(a, d, z + hDrum), rx = r * CTS.S * Math.SQRT2 * 1.06;
  c.beginPath(); c.ellipse(x, y, rx, rx * CTS.YS, 0, 0, 6.3); c.fillStyle = CREAM; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  if (o.onion) onion(k, a, d, z + hDrum, r * 0.98, hDome, dome, { fs: o.fs });
  else { k.dome(u, v, z + hDrum, r * 0.98, hDome, dome, { ribs: o.ribs ?? 6 }); const [tx, ty] = PA(a, d, z + hDrum + hDome); finial(k, tx, ty, o.fs ?? 0.8); }
}

// ---------- olive date palm (fuller crown, scaled for this aerial tile) ----------
export function opalm(k, u, v, o = {}) {
  const c = k.ctx, t = k.t, h = o.h ?? 1.0, seed = o.seed ?? Math.round(u * 17 + v * 29), R = rng(seed * 13 + 5);
  const [bx, by] = P(u, v, o.z ?? 0), [tx0, ty] = P(u, v, (o.z ?? 0) + h);
  const lean = (o.lean ?? (R() - 0.5) * 0.5) * CTS.S, tx = tx0 + lean, sc = o.len ?? 0.55;
  c.fillStyle = "rgba(50,70,40,0.16)"; c.beginPath(); c.ellipse(bx + 9 * sc, by + 2, 22 * sc, 7 * sc, 0, 0, 6.3); c.fill();
  const sway = Math.sin(t * 0.9 + seed) * 1.0;
  const tw = Math.max(3.2, 6 * sc + 0.6);
  c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = tw + 2.2; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + lean * 0.1, (by + ty) / 2, tx + sway, ty); c.stroke();
  c.strokeStyle = "#a57f52"; c.lineWidth = tw; c.stroke();
  c.strokeStyle = "rgba(70,44,22,0.6)"; c.lineWidth = 0.9; c.setLineDash([1, 2.6]); c.beginPath(); c.moveTo(bx - 1, by); c.quadraticCurveTo(bx + lean * 0.1 - 1, (by + ty) / 2, tx + sway - 1, ty); c.stroke(); c.setLineDash([]);
  const N = o.fronds ?? 16, L0 = sc * CTS.S * 1.05, frs = [];
  for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2 + R() * 0.3, s = Math.sin(a); frs.push({ a, s, L: L0 * (0.8 + R() * 0.3), ph: R() * 6.28 }); }
  frs.sort((p, q) => p.s - q.s);
  const cx = tx + sway, cy = ty, wd = 6.4 * Math.min(1.1, sc / 0.55 + 0.2);
  const draw = (f) => {
    const sw = Math.sin(t * 1.5 + f.ph) * 0.05;
    const dx = Math.cos(f.a + sw), dy = Math.sin(f.a + sw) * 0.5;
    const p0 = [cx, cy], p1 = [cx + dx * f.L * 0.5, cy + dy * f.L * 0.5 - f.L * 0.38], p2 = [cx + dx * f.L, cy + dy * f.L + f.L * 0.3 + Math.sin(t * 2 + f.ph) * 1.2];
    const pt = (s) => { const q = 1 - s; return [q * q * p0[0] + 2 * q * s * p1[0] + s * s * p2[0], q * q * p0[1] + 2 * q * s * p1[1] + s * s * p2[1]]; };
    const left = [], right = [], n = 12;
    for (let j = 0; j <= n; j++) {
      const s = j / n, a = pt(s), b = pt(Math.min(1, s + 0.04)), a2 = pt(Math.max(0, s - 0.04));
      const tx2 = b[0] - a2[0], ty2 = b[1] - a2[1], l = Math.hypot(tx2, ty2) || 1, nx = -ty2 / l, ny = tx2 / l;
      const w = Math.pow(Math.sin(Math.PI * Math.min(0.97, s * 0.92 + 0.06)), 0.8) * wd * (o.wide ?? 1) * (j % 2 ? 1 : 0.6);
      left.push([a[0] + nx * w, a[1] + ny * w]); right.push([a[0] - nx * w, a[1] - ny * w]);
    }
    tr(c, [...left, ...right.reverse()]);
    c.fillStyle = f.s > 0.25 ? "#8fa848" : f.s > -0.3 ? "#73923c" : "#5a7832"; c.fill(); c.lineWidth = 1.2; c.strokeStyle = INK; c.lineJoin = "round"; c.stroke();
    c.strokeStyle = "rgba(220,230,150,0.55)"; c.lineWidth = 0.8; c.beginPath(); for (let j = 1; j <= n; j++) { const p = pt(j / n); j > 1 ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke();
  };
  for (const f of frs) if (f.s < 0) draw(f);
  c.fillStyle = "#7a5c34"; c.beginPath(); c.arc(cx, cy + 1, 2.8, 0, 6.3); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
  if (o.dates !== false) { c.fillStyle = "#d9892f"; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(cx - 2 + i * 2, cy + 3.5 + (i % 2), 1.2, 0, 6.3); c.fill(); } }
  for (const f of frs) if (f.s >= 0) draw(f);
}
// rounded shrub / bougainvillea mound at ground point
export function shrub(k, u, v, o = {}) {
  const c = k.ctx, [x, y] = P(u, v, o.z ?? 0), r = (o.r ?? 0.16) * CTS.S, R = rng(o.seed ?? Math.round(u * 71 + v * 37));
  c.fillStyle = "rgba(50,70,40,0.15)"; c.beginPath(); c.ellipse(x + r * 0.4, y + 1, r * 1.2, r * 0.45, 0, 0, 6.3); c.fill();
  const blobs = []; const nb = o.n ?? 5;
  for (let i = 0; i < nb; i++) blobs.push([x + (R() - 0.5) * r * 1.3, y - r * 0.55 - R() * r * 0.55, r * (0.45 + R() * 0.25)]);
  const all = (fn) => { c.beginPath(); for (const [bx, by, br] of blobs) { c.moveTo(bx + br, by); c.arc(bx, by, br, 0, 6.3); } fn(); };
  all(() => { c.strokeStyle = INK; c.lineWidth = 2.2; c.stroke(); });
  all(() => { c.fillStyle = o.col || "#5f8a3a"; c.fill(); });
  c.save(); all(() => c.clip()); c.fillStyle = shade(o.col || "#5f8a3a", -0.2); c.beginPath(); c.arc(x + r * 0.5, y, r * 0.8, 0, 6.3); c.fill();
  if (o.flowers) { const fc = o.flowers; for (let i = 0; i < nb * 5; i++) { const [bx, by, br] = blobs[i % nb], th = R() * 6.28, dd = Math.sqrt(R()) * br * 0.9; c.fillStyle = fc[Math.floor(R() * fc.length)]; c.beginPath(); c.arc(bx + Math.cos(th) * dd, by + Math.sin(th) * dd * 0.8, 1.1 + R() * 0.9, 0, 6.3); c.fill(); } }
  else { c.fillStyle = "rgba(200,230,140,0.4)"; for (const [bx, by, br] of blobs) { c.beginPath(); c.arc(bx - br * 0.3, by - br * 0.3, br * 0.35, 0, 6.3); c.fill(); } }
  c.restore();
}
export const BOUG = ["#d8337f", "#ec5c9f", "#c42a6c", "#f287bd", "#ffffff"];

// ---------- villa: two-storey Mediterranean house, terracotta hip roofs, private pool ----------
export function villa(k, u, v, o = {}) {
  const c = k.ctx, R = rng(o.seed ?? 1), wall = o.wall || VILLA, roof = o.roof || TERRA;
  const du = o.du ?? 0.44, dv = o.dv ?? 0.44, h = o.h ?? 0.4, wing = o.wing ?? (R() < 0.5 ? "u" : "v");
  const parts = [];
  // wing (one storey) on +u or +v side, then the main block; drawn far-to-near
  const W = wing === "u" ? [u + du - 0.02, v + 0.06, du * 0.6, dv - 0.1, h * 0.6] : [u + 0.06, v + dv - 0.02, du - 0.1, dv * 0.6, h * 0.6];
  const main = [u, v, du, dv, h];
  const order = wing === "u" ? [main, W] : [main, W];
  for (const [bu, bv, bdu, bdv, bh] of order) {
    const f = k.box(bu, bv, 0, bdu, bdv, bh, wall, { hatch: false, shadow: true, noTop: true });
    // windows / doors
    const two = bh > 0.3;
    k.windows(bu, bv, 0, bdu, bdv, bh, { side: "L", rows: two ? 2 : 1, cols: Math.max(1, Math.round(bdu / 0.17)), color: "#3b6b74", w: 0.42, h: two ? 0.5 : 0.55, base: 0.05, my: 0.05, arch: true, lw: 0.8 });
    k.windows(bu, bv, 0, bdu, bdv, bh, { side: "R", rows: two ? 2 : 1, cols: Math.max(1, Math.round(bdv / 0.17)), color: "#3b6b74", w: 0.42, h: two ? 0.5 : 0.55, base: 0.05, my: 0.05, arch: true, lw: 0.8 });
    // cornice under the eaves
    k.line3([[bu, bv + bdv, bh - 0.03], [bu + bdu, bv + bdv, bh - 0.03], [bu + bdu, bv, bh - 0.03]], { lw: 1, stroke: "rgba(150,110,70,0.6)", wobble: 0 });
    // hip roof with eave overhang + tile courses
    const e = 0.05, rh = Math.min(bdu, bdv) * 0.5;
    const ru = bu - e, rv = bv - e, rdu = bdu + 2 * e, rdv = bdv + 2 * e, inset = Math.min(rdu, rdv) * 0.45;
    const A = [ru + inset, rv + inset, bh + rh], B = [ru + rdu - inset, rv + inset, bh + rh], C = [ru + rdu - inset, rv + rdv - inset, bh + rh], D = [ru + inset, rv + rdv - inset, bh + rh];
    const fl = [[ru, rv + rdv, bh], [ru + rdu, rv + rdv, bh], C, D], fr = [[ru + rdu, rv, bh], [ru + rdu, rv + rdv, bh], C, B];
    k.poly(fl, shade(roof, 0.02), { lw: 1.1, wobble: 0 });
    k.poly(fr, shade(roof, -0.2), { lw: 1.1, wobble: 0 });
    // tile courses (lines parallel to the eaves)
    c.save();
    for (const [face, col] of [[fl, "rgba(120,40,20,0.35)"], [fr, "rgba(90,30,15,0.4)"]]) {
      const pp = face.map((p) => P(...p)); tr(c, pp); c.save(); c.clip(); c.strokeStyle = col; c.lineWidth = 0.7; c.beginPath();
      for (let i = 1; i < 4; i++) { const f2 = i / 4, a0 = face[0].map((x, j) => lerp(x, face[3][j], f2)), b0 = face[1].map((x, j) => lerp(x, face[2][j], f2)); c.moveTo(...P(...a0)); c.lineTo(...P(...b0)); }
      c.stroke(); c.restore();
    }
    c.restore();
    if (inset < Math.min(rdu, rdv) / 2 - 0.01) k.poly([A, B, C, D], shade(roof, 0.1), { lw: 1, wobble: 0 });
    // eave fascia lines
    k.line3([[ru, rv + rdv, bh], [ru + rdu, rv + rdv, bh], [ru + rdu, rv, bh]], { lw: 1.4, wobble: 0 });
    parts.push(f);
  }
  // chimney on the main roof
  if (R() < 0.6) k.box(u + du * 0.25, v + dv * 0.3, h + 0.08, 0.06, 0.06, 0.14, wall, { hatch: false, shadow: false });
  // front door with a small arched porch on the L face
  const dd = [[u + du * 0.38, v + dv, 0], [u + du * 0.62, v + dv, 0], [u + du * 0.62, v + dv, 0.16], [u + du * 0.38, v + dv, 0.16]];
  k.poly(dd, "#7a4a2e", { lw: 0.8, wobble: 0 });
  return parts;
}
// private pool: stone coping + water with caustic shimmer (u,v box)
export function pool(k, u, v, du, dv, o = {}) {
  const c = k.ctx, t = k.t, e = 0.04;
  k.poly([[u - e, v - e, 0.02], [u + du + e, v - e, 0.02], [u + du + e, v + dv + e, 0.02], [u - e, v + dv + e, 0.02]], o.coping || "#f6efe2", { lw: 1, wobble: 0 });
  const wpts = [[u, v, 0.02], [u + du, v, 0.02], [u + du, v + dv, 0.02], [u, v + dv, 0.02]];
  k.poly(wpts, o.col || POOL, { lw: 0.9, wobble: 0 });
  c.save(); tr(c, wpts.map((p) => P(...p))); c.clip();
  // inner wall (darker band along the back edges)
  k.poly([[u, v, 0.02], [u + du, v, 0.02], [u + du, v + 0.05, 0.02], [u, v + 0.05, 0.02]], "rgba(20,110,130,0.35)", { stroke: false });
  k.poly([[u, v, 0.02], [u + 0.05, v, 0.02], [u + 0.05, v + dv, 0.02], [u, v + dv, 0.02]], "rgba(20,110,130,0.25)", { stroke: false });
  c.strokeStyle = "rgba(255,255,255,0.7)"; c.lineWidth = 0.8;
  const R = rng(o.seed ?? Math.round(u * 50 + v * 13));
  for (let i = 0; i < Math.max(2, Math.round(du * dv * 60)); i++) { const pu = u + R() * du, pv = v + R() * dv, ph = R() * 6.28, a = 0.5 + 0.5 * Math.sin(t * 2.2 + ph); const [x, y] = P(pu, pv, 0.02); c.globalAlpha = a; c.beginPath(); c.moveTo(x - 2.5, y); c.quadraticCurveTo(x, y - 1.2, x + 2.5, y); c.stroke(); }
  c.globalAlpha = 1; c.restore();
}
export function lounger(k, u, v, o = {}) {
  const along = o.along || "u", L = 0.32, W = 0.12, col = o.col || "#f6f3ec";
  const box = along === "u" ? [u, v, L, W] : [u, v, W, L];
  k.box(box[0], box[1], 0.04, box[2], box[3], 0.04, col, { hatch: false, shadow: false, lw: 0.8 });
  // raised back
  if (along === "u") k.poly([[u, v, 0.08], [u, v + W, 0.08], [u + 0.1, v + W, 0.18], [u + 0.1, v, 0.18]], shade(col, -0.05), { lw: 0.8, wobble: 0 });
  else k.poly([[u, v, 0.08], [u + W, v, 0.08], [u + W, v + 0.1, 0.18], [u, v + 0.1, 0.18]], shade(col, -0.05), { lw: 0.8, wobble: 0 });
}
export function parasol(k, u, v, o = {}) {
  const c = k.ctx, h = o.h ?? 0.42, r = o.r ?? 0.2, col = o.col || "#f7f2e6";
  const [x, y] = P(u, v, 0), [, yt] = P(u, v, h);
  c.fillStyle = "rgba(60,45,30,0.13)"; c.beginPath(); c.ellipse(x + 5, y + 1, r * 60, r * 22, 0, 0, 6.3); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt); c.stroke();
  const rx = r * CTS.S * 1.35, ry = rx * 0.42;
  c.beginPath(); c.moveTo(x - rx, yt + ry * 0.4); c.quadraticCurveTo(x - rx * 0.5, yt - ry * 1.2, x, yt - ry * 1.3); c.quadraticCurveTo(x + rx * 0.5, yt - ry * 1.2, x + rx, yt + ry * 0.4);
  for (let i = 4; i >= 0; i--) { const f = i / 4, xx = lerp(x - rx, x + rx, f); c.quadraticCurveTo(xx + rx / 4, yt + ry * 0.9, xx, yt + ry * 0.4); }
  c.closePath(); c.fillStyle = col; c.fill(); c.lineWidth = 1.1; c.stroke();
  if (o.stripe) { c.save(); c.clip(); c.fillStyle = o.stripe; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(x, yt - ry * 1.3); c.lineTo(x - rx + (i * 2 + 0.5) * rx / 4, yt + ry); c.lineTo(x - rx + (i * 2 + 1.5) * rx / 4, yt + ry); c.closePath(); c.fill(); } c.restore(); }
}
// white tented cabana (frontal), opening toward the viewer
export function cabana(k, a, d, o = {}) {
  const c = k.ctx, w = 0.26, dep = 0.32, h = 0.24, col = "#fbf6ec";
  const f = prism(k, rectAD(a - w, a + w, d - dep, d), 0, h, col, { top: false, lw: 1 });
  // dark open front with cushions
  const F = f.find((x) => Math.abs(x.na) < 0.2)?.F; if (F) { k.path([F(0.12, 0), F(0.88, 0), F(0.88, h * 0.8), F(0.12, h * 0.8)], { fill: "#9c8a72", lw: 0.8, wobble: 0 }); k.path([F(0.18, 0.02), F(0.82, 0.02), F(0.82, 0.08), F(0.18, 0.08)], { fill: o.cushion || "#3f9e94", lw: 0.6, wobble: 0 }); }
  // peaked canvas roof
  const r0 = PA(a - w - 0.04, d + 0.03, h), r1 = PA(a + w + 0.04, d + 0.03, h), r2 = PA(a + w + 0.04, d - dep - 0.03, h), r3 = PA(a - w - 0.04, d - dep - 0.03, h), pk0 = PA(a - w, d - dep / 2, h + 0.16), pk1 = PA(a + w, d - dep / 2, h + 0.16);
  k.path([r3, r2, pk1, pk0], { fill: "#e9e2d2", lw: 1, wobble: 0 });
  k.path([r0, r1, pk1, pk0], { fill: col, lw: 1, wobble: 0 });
  // scalloped valance
  c.strokeStyle = "rgba(150,130,100,0.6)"; c.lineWidth = 0.7; c.beginPath(); for (let i = 0; i <= 6; i++) { const p = PA(a - w + (2 * w * i) / 6, d + 0.03, h - 0.03); i ? c.lineTo(...p) : c.moveTo(...p); } c.stroke();
}

// ---------- water traffic ----------
// ping-pong along an open path with a pivoting turn at each end: {a,d,ta,td,speed01}
export function shuttle(path, t, o = {}) {
  const sp = spline(path, false), speed = o.speed ?? 0.8, turn = o.turn ?? 2.2, L = sp.L;
  const run = L / speed, period = 2 * (run + turn), tt = (((t + (o.offset ?? 0) * period) % period) + period) % period;
  const ease = (x) => L * lerp(x, smooth(x), Math.min(0.6, 1.2 / L));
  const vel = (x) => (smooth(Math.min(1, x / 0.08)) * smooth(Math.min(1, (1 - x) / 0.08)));
  let s, dir = 1, mv = 0;
  if (tt < run) { const x = tt / run; s = sp.sample(ease(x)); mv = vel(x); }
  else if (tt < run + turn) { s = sp.sample(L); const f = smooth((tt - run) / turn), th = f * Math.PI * (o.cw ?? 1); const ca = Math.cos(th), sa = Math.sin(th); return { a: s.u, d: s.v, ta: s.du * ca - s.dv * sa, td: s.du * sa + s.dv * ca, mv: 0.15 * Math.sin(f * Math.PI) }; }
  else if (tt < 2 * run + turn) { const x = (tt - run - turn) / run; s = sp.sample(L - ease(x)); dir = -1; mv = vel(x); }
  else { s = sp.sample(0); const f = smooth((tt - 2 * run - turn) / turn), th = Math.PI + f * Math.PI * (o.cw ?? 1); const ca = Math.cos(th), sa = Math.sin(th); return { a: s.u, d: s.v, ta: s.du * ca - s.dv * sa, td: s.du * sa + s.dv * ca, mv: 0.15 * Math.sin(f * Math.PI) }; }
  return { a: s.u, d: s.v, ta: s.du * dir, td: s.dv * dir, mv };
}
// wake on the sea surface behind (a,d) heading (ta,td); strength 0..1
export function wakeAD(k, a, d, ta, td, m, o = {}) {
  if (m < 0.02) return;
  const c = k.ctx, t = k.t, l = Math.hypot(ta, td) || 1; ta /= l; td /= l; const na = -td, nd = ta, len = (o.len ?? 1.6) * m, w = o.w ?? 0.45, b0 = o.back ?? 0.3;
  c.lineCap = "round";
  for (const sd of [-1, 1]) {
    const pts = []; for (let i = 0; i <= 10; i++) { const f = i / 10, wig = Math.sin(t * 6 + i * 1.3) * 0.02; pts.push(PA(a - ta * (b0 + f * len) + na * sd * (0.1 + f * w * m + wig), d - td * (b0 + f * len) + nd * sd * (0.1 + f * w * m + wig))); }
    for (let i = 0; i < 10; i++) { c.strokeStyle = `rgba(255,255,255,${0.9 * m * (1 - i / 10)})`; c.lineWidth = 2.2 * (1 - i / 12); c.beginPath(); c.moveTo(...pts[i]); c.lineTo(...pts[i + 1]); c.stroke(); }
  }
  for (let i = 0; i < 7; i++) { const f = (t * 1.3 + i / 7) % 1, [x, y] = PA(a - ta * (b0 + f * len * 0.8), d - td * (b0 + f * len * 0.8)); c.fillStyle = `rgba(255,255,255,${0.8 * m * (1 - f)})`; c.beginPath(); c.ellipse(x + Math.sin(i * 2.1) * 2, y, 2.2 + f * 4, 1 + f * 1.5, 0, 0, 6.3); c.fill(); }
}
// hull drawn as a stack of oriented outlines (deck + hull side)
function hullPts(a, d, ta, td, L, W, z, bow = 0.35) {
  const l = Math.hypot(ta, td) || 1; ta /= l; td /= l; const na = -td, nd = ta, s = Math.SQRT2, hl = (L / 2) * s, hw = (W / 2) * s;
  const prof = [[1, 0], [0.62, 0.78], [0.2, 1], [-0.75, 0.96], [-1, 0.72], [-1, -0.72], [-0.75, -0.96], [0.2, -1], [0.62, -0.78]];
  return prof.map(([f, g]) => PA(a + ta * f * hl + na * g * hw, d + td * f * hl + nd * g * hw, z));
}
export function hull(k, a, d, ta, td, o = {}) {
  const c = k.ctx, L = o.len ?? 0.8, W = o.wid ?? 0.3, H = o.h ?? 0.1, z = o.z ?? 0;
  const [sx, sy] = PA(a, d); c.fillStyle = "rgba(10,60,70,0.2)"; c.beginPath(); c.ellipse(sx + 3, sy + 2, L * 30, L * 13, Math.atan2(td * 25.97, (ta) * 45) , 0, 6.3); c.fill();
  const bot = hullPts(a, d, ta, td, L * 0.94, W * 0.86, z), top = hullPts(a, d, ta, td, L, W, z + H);
  // side skin: draw quads between bottom + top outline; back-to-front by screen y
  const quads = []; for (let i = 0; i < bot.length; i++) { const j = (i + 1) % bot.length; quads.push([bot[i], bot[j], top[j], top[i]]); }
  quads.sort((p, q) => (p[0][1] + p[1][1]) - (q[0][1] + q[1][1]));
  for (const q of quads) k.path(q, { fill: o.hull || "#e46a3c", lw: 0.9, wobble: 0 });
  k.path(top, { fill: o.deck || "#f6f1e6", lw: 1.1, wobble: 0 });
  return { top, H, z };
}
export function sailboat(k, a, d, ta, td, o = {}) {
  const c = k.ctx, t = k.t, bob = Math.sin(t * 1.6 + (o.ph ?? 0)) * 0.015;
  hull(k, a, d, ta, td, { len: 0.78, wid: 0.28, h: 0.09, z: bob, hull: o.hull || "#e0683a", deck: "#f3e3c4" });
  const l = Math.hypot(ta, td) || 1, ua = ta / l, ud = td / l;
  const mast = [a + ua * 0.12, d + ud * 0.12], heel = Math.sin(t * 0.8 + (o.ph ?? 0)) * 2.2;
  const [mx, my] = PA(mast[0], mast[1], 0.1 + bob), [, mt] = PA(mast[0], mast[1], 1.15);
  const tx = mx + heel;
  // sails: main (aft of mast) + jib (fore), billow with the breeze
  const aft = PA(mast[0] - ua * 0.5, mast[1] - ud * 0.5, 0.2 + bob), fore = PA(a + ua * 0.5, d + ud * 0.5, 0.14 + bob);
  const bil = 4 + Math.sin(t * 1.3 + (o.ph ?? 0)) * 1.5;
  c.lineJoin = "round";
  c.beginPath(); c.moveTo(tx, mt + 2); c.quadraticCurveTo((tx + aft[0]) / 2 + bil, (mt + aft[1]) / 2, aft[0], aft[1]); c.lineTo(mx, my - 3); c.closePath();
  c.fillStyle = "#fbf8f0"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
  c.strokeStyle = "rgba(150,140,120,0.5)"; c.lineWidth = 0.6; c.beginPath(); for (let i = 1; i < 4; i++) { const f = i / 4; c.moveTo(lerp(tx, mx, f) , lerp(mt + 2, my - 3, f)); c.lineTo(lerp(aft[0], aft[0], f) + (1 - f) * 0, lerp(aft[1], aft[1], f)); } c.stroke();
  c.beginPath(); c.moveTo(tx, mt + 5); c.quadraticCurveTo((tx + fore[0]) / 2 - bil * 0.6, (mt + fore[1]) / 2, fore[0], fore[1]); c.lineTo(mx + 1, my - 2); c.closePath();
  c.fillStyle = "#f1ece0"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke();
  c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(mx, my); c.lineTo(tx, mt); c.stroke(); c.strokeStyle = "#8a6a42"; c.lineWidth = 0.9; c.stroke();
  // pennant
  const w = Math.sin(t * 6 + (o.ph ?? 0)) * 1.5; c.fillStyle = o.flag || "#d8433a"; c.beginPath(); c.moveTo(tx, mt); c.lineTo(tx + 7, mt + 1.5 + w); c.lineTo(tx, mt + 3); c.closePath(); c.fill();
  // reflection shimmer
  c.strokeStyle = "rgba(255,255,255,0.55)"; c.lineWidth = 1; for (let i = 0; i < 3; i++) { const yy = my + 6 + i * 3, ww = 6 - i * 1.5 + Math.sin(t * 2 + i) * 1.5; c.beginPath(); c.moveTo(mx - ww, yy); c.lineTo(mx + ww, yy); c.stroke(); }
}
export function jetski(k, a, d, ta, td, o = {}) {
  const t = k.t, bob = Math.sin(t * 5 + (o.ph ?? 0)) * 0.01 * (o.mv ?? 1);
  const hb = hull(k, a, d, ta, td, { len: 0.42, wid: 0.17, h: 0.07, z: bob, hull: o.col || "#2f6fb5", deck: "#f4f4f2" });
  const l = Math.hypot(ta, td) || 1, ua = ta / l, ud = td / l;
  // handlebar post
  const [hx, hy] = PA(a + ua * 0.1, d + ud * 0.1, 0.07 + bob), [, hy2] = PA(a + ua * 0.1, d + ud * 0.1, 0.17 + bob);
  const c = k.ctx; c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx, hy2); c.stroke();
  const [u, v] = AD(a - ua * 0.04, d - ud * 0.04), [du, dv] = [(ta + td) / 2, (td - ta) / 2];
  k.person(u, v, { pose: "sit", seatZ: 0.1, z: 0.04 + bob, dir: [du, dv], h: 0.3, seed: o.seed ?? 5, lw: 0.7, top: o.vest || "#f0c43c", shorts: true, hat: null });
}
export function speedboat(k, a, d, ta, td, o = {}) {
  const c = k.ctx, t = k.t, bob = Math.sin(t * 4 + (o.ph ?? 0)) * 0.012;
  const hb = hull(k, a, d, ta, td, { len: 0.86, wid: 0.3, h: 0.11, z: bob, hull: o.col || "#f6f3ec", deck: "#d9c7a3" });
  const l = Math.hypot(ta, td) || 1, ua = ta / l, ud = td / l, na = -ud, nd = ua;
  // stripe along the hull side
  // windscreen + console
  const s = Math.SQRT2, q = (f, g, z) => PA(a + ua * f * s + na * g * s, d + ud * f * s + nd * g * s, z + bob);
  k.path([q(0.06, -0.1, 0.11), q(0.06, 0.1, 0.11), q(0.02, 0.1, 0.22), q(0.02, -0.1, 0.22)], { fill: "rgba(120,180,200,0.8)", lw: 0.9, wobble: 0 });
  const [u, v] = AD(a - ua * 0.08, d - ud * 0.08), [du, dv] = [(ta + td) / 2, (td - ta) / 2];
  k.person(u, v, { pose: "stand", z: 0.11 + bob, dir: [du, dv], h: 0.3, seed: o.seed ?? 7, lw: 0.7 });
  return { stern: q(-0.42, 0, 0.14), q };
}
// parasail canopy flying behind/above a towing boat
export function parasail(k, stern, a, d, ta, td, o = {}) {
  const c = k.ctx, t = k.t, l = Math.hypot(ta, td) || 1, ua = ta / l, ud = td / l;
  const back = o.back ?? 2.4, alt = (o.alt ?? 3.2) + Math.sin(t * 0.7) * 0.15, sway = Math.sin(t * 0.5) * 0.25;
  const pa = a - ua * back * Math.SQRT2 + -ud * sway, pd = d - ud * back * Math.SQRT2 + ua * sway;
  const [hx, hy] = PA(pa, pd, alt), [cx, cy] = PA(pa, pd, alt + 0.75);
  // tow rope (sagging)
  c.strokeStyle = "rgba(42,36,32,0.8)"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(...stern); c.quadraticCurveTo((stern[0] + hx) / 2, (stern[1] + hy) / 2 + 14, hx, hy); c.stroke();
  // shroud lines
  const cw = 26, ch = 9;
  c.lineWidth = 0.6; c.beginPath(); for (const f of [-1, -0.5, 0, 0.5, 1]) { c.moveTo(hx, hy - 4); c.lineTo(cx + f * cw, cy + ch * 0.5 - Math.abs(f) * 2); } c.stroke();
  // canopy: arched wing with coloured cells
  const cols = o.cols || ["#e94f3d", "#f6c343", "#2f8fd0", "#f6c343", "#e94f3d"];
  for (let i = 0; i < 5; i++) {
    const f0 = -1 + (2 * i) / 5, f1 = -1 + (2 * (i + 1)) / 5;
    const y0 = (f) => cy - Math.cos((f * Math.PI) / 2.2) * ch;
    c.beginPath(); c.moveTo(cx + f0 * cw, y0(f0)); c.lineTo(cx + f1 * cw, y0(f1)); c.lineTo(cx + f1 * cw * 0.98, y0(f1) + 6); c.lineTo(cx + f0 * cw * 0.98, y0(f0) + 6); c.closePath();
    c.fillStyle = cols[i]; c.fill();
  }
  c.beginPath(); for (let i = 0; i <= 10; i++) { const f = -1 + i / 5; const y = cy - Math.cos((f * Math.PI) / 2.2) * ch; i ? c.lineTo(cx + f * cw, y) : c.moveTo(cx + f * cw, y); }
  for (let i = 10; i >= 0; i--) { const f = -1 + i / 5; const y = cy - Math.cos((f * Math.PI) / 2.2) * ch + 6; c.lineTo(cx + f * cw * 0.98, y); }
  c.closePath(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
  // the flyer dangling in the harness, legs swinging
  const sw = Math.sin(t * 1.4) * 1.5;
  c.strokeStyle = INK; c.lineWidth = 2.6; c.lineCap = "round"; c.beginPath(); c.moveTo(hx, hy - 3); c.lineTo(hx, hy + 4); c.moveTo(hx, hy + 4); c.lineTo(hx - 2 + sw, hy + 10); c.moveTo(hx, hy + 4); c.lineTo(hx + 2 + sw, hy + 10); c.stroke();
  c.strokeStyle = "#f0c43c"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(hx, hy - 3); c.lineTo(hx, hy + 4); c.stroke();
  c.fillStyle = "#e0ac84"; c.beginPath(); c.arc(hx, hy - 5, 2.2, 0, 6.3); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
}

// ---------- monorail ----------
export function trainCar(k, a, d, ta, td, o = {}) {
  const z = o.z ?? 1.42, L = o.len ?? 0.78, W = 0.24, H = 0.28;
  const foot = orect(a, d, ta, td, L, W, o.nose ?? 0);
  const faces = prism(k, foot, z, z + H, "#f4f6f4", { top: false, lw: 1.1, faceCol: (na) => shade("#f4f6f4", -0.05 - 0.16 * na) });
  for (const f of faces) {
    // blue window band + pinstripe
    k.path([f.F(0.06, z + H * 0.45), f.F(0.94, z + H * 0.45), f.F(0.94, z + H * 0.8), f.F(0.06, z + H * 0.8)], { fill: shade("#2d4f7c", f.na > 0.3 ? -0.15 : 0), lw: 0.7, wobble: 0 });
    k.path([f.F(0.04, z + H * 0.24), f.F(0.96, z + H * 0.24), f.F(0.96, z + H * 0.32), f.F(0.04, z + H * 0.32)], { fill: "#3f86c4", stroke: false, wobble: 0 });
    if (f.len > 0.3) { const c = k.ctx; c.strokeStyle = "rgba(255,255,255,0.65)"; c.lineWidth = 0.8; c.beginPath(); for (let i = 1; i < 6; i++) { c.moveTo(...f.F(i / 6, z + H * 0.47)); c.lineTo(...f.F(i / 6, z + H * 0.78)); } c.stroke(); }
  }
  // rounded roof
  k.path(foot.map(([pa, pd]) => PA(pa, pd, z + H)), { fill: "#fbfcfb", lw: 1.1, wobble: 0 });
  const inner = orect(a, d, ta, td, L * 0.8, W * 0.5, (o.nose ?? 0) * 0.6);
  k.path(inner.map(([pa, pd]) => PA(pa, pd, z + H + 0.03)), { fill: "#e8ecec", lw: 0.8, wobble: 0 });
}

// ---------- shoreline: foam lapping just outside the land ----------
export function landPath(c, polys, z = 0, dy = 0) { c.beginPath(); for (const p of polys) { p.forEach(([a, d], i) => { const [x, y] = PA(a, d, z); i ? c.lineTo(x, y + dy) : c.moveTo(x, y + dy); }); c.closePath(); } }
