// Yu Garden tile helpers (only vtiles/shanghai/0_-1.js + huxinting.js import this):
// concave tiled roof faces with upswept hooks, corridor galleries, the dragon wall, taihu rocks, willows, lotus.
// Everything is a pure function of k.t.
import { P, CTS, INK, shade, mix, lerp, clamp, rng } from "../../lib/vec-kit.js";
export { P, CTS, INK, shade, mix, lerp, clamp, rng };

export const TILE = "#70747c", TILE_L = "#7d818a", TILE_D = "#3d4048", RIDGE = "#c9c6bd", RIDGE_D = "#2c2e34";
export const RED = "#a3302a", RED_D = "#6b1d17", RED_L = "#c4483a", LAT = "#7a241b";
export const PLASTER = "#f2ede2", STONE = "#e8dec8", STONE_D = "#c7b998", WARM = "#f7cf7a", WARM_D = "#dd8f3e";

const ZS = CTS.S * CTS.ZS;
export const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const lerp3 = (a, b, f) => [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)];
const sampleArr = (A, s) => { const n = A.length - 1, x = clamp(s, 0, 1) * n, i = Math.min(n - 1, Math.floor(x)); return lerp3(A[i], A[i + 1], x - i); };
// concave roof profile: quadratic from eave point e to top point tp, the middle sagging by `sag` (z units)
export const qpt = (e, tp, f, sag) => { const m = [(e[0] + tp[0]) / 2, (e[1] + tp[1]) / 2, (e[2] + tp[2]) / 2 - sag], a = (1 - f) * (1 - f), b = 2 * f * (1 - f), d = f * f; return [a * e[0] + b * m[0] + d * tp[0], a * e[1] + b * m[1] + d * tp[1], a * e[2] + b * m[2] + d * tp[2]]; };

// ---------- a tiled roof face between an eave polyline E and a top polyline T (same sample count) ----------
// o: col, sag, ribs, rows, fascia (bool), discs (bool), light (-1..1 shading)
export function tileFace(k, E, T, o = {}) {
  const c = k.ctx, n = E.length - 1, sag = o.sag ?? 0.1, col = shade(o.col || TILE, o.light ?? 0), F = 10;
  const out = [];
  for (let i = 0; i <= n; i++) out.push(P(...E[i]));
  for (let j = 1; j <= F; j++) out.push(P(...qpt(E[n], T[n], j / F, sag)));
  for (let i = n; i >= 0; i--) out.push(P(...T[i]));
  for (let j = F - 1; j >= 1; j--) out.push(P(...qpt(E[0], T[0], j / F, sag)));
  c.save();
  c.beginPath(); out.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
  const pe = P(...sampleArr(E, 0.5)), pt = P(...sampleArr(T, 0.5));
  const g = c.createLinearGradient(pe[0], pe[1], pt[0], pt[1]);
  g.addColorStop(0, shade(col, -0.1)); g.addColorStop(0.45, col); g.addColorStop(1, shade(col, 0.12));
  c.fillStyle = g; c.fill();
  c.save(); c.clip();
  // tubular tile ribs: dark groove + light crest
  const nr = o.ribs ?? 20;
  for (let r = 0; r < nr; r++) {
    const s = (r + 0.5) / nr, e = sampleArr(E, s), tp = sampleArr(T, s);
    const line = []; for (let j = 0; j <= 8; j++) line.push(P(...qpt(e, tp, j / 8, sag)));
    c.beginPath(); line.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
    c.strokeStyle = "rgba(18,18,26,0.62)"; c.lineWidth = 1.5; c.stroke();
    c.beginPath(); line.forEach((p, i) => (i ? c.lineTo(p[0] + 1.3, p[1] - 0.3) : c.moveTo(p[0] + 1.3, p[1] - 0.3)));
    c.strokeStyle = "rgba(225,225,230,0.28)"; c.lineWidth = 0.9; c.stroke();
  }
  // tile courses
  const rows = o.rows ?? 7;
  c.strokeStyle = "rgba(18,18,26,0.3)"; c.lineWidth = 0.7;
  for (let j = 1; j < rows; j++) {
    const f = j / rows; c.beginPath();
    for (let i = 0; i <= 16; i++) { const s = i / 16, p = P(...qpt(sampleArr(E, s), sampleArr(T, s), f, sag)); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }
    c.stroke();
  }
  c.restore();
  c.beginPath(); out.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
  c.strokeStyle = INK; c.lineWidth = 1.2; c.lineJoin = "round"; c.stroke();
  // fascia + dripping tile ends along the eave
  if (o.fascia !== false) {
    c.beginPath(); E.forEach((p3, i) => { const p = P(...p3); i ? c.lineTo(p[0], p[1] + 1.2) : c.moveTo(p[0], p[1] + 1.2); });
    c.strokeStyle = RIDGE_D; c.lineWidth = 3.2; c.lineCap = "round"; c.stroke();
    if (o.discs !== false) {
      const p0 = P(...E[0]), p1 = P(...E[n]), L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), nd = Math.max(2, Math.round(L / 5.2));
      for (let i = 0; i <= nd; i++) { const p = P(...sampleArr(E, i / nd)); c.fillStyle = "#8e9198"; c.beginPath(); c.arc(p[0], p[1] + 2.4, 1.6, 0, 7); c.fill(); c.lineWidth = 0.6; c.strokeStyle = INK; c.stroke(); }
    }
  }
  c.restore();
}

// hip/verge ridge: a beaded rounded ridge from a to b (3D) following the concave profile
export function ridge3(k, a, b, o = {}) {
  const c = k.ctx, sag = o.sag ?? 0, pts = []; for (let j = 0; j <= 12; j++) pts.push(P(...qpt(a, b, j / 12, sag)));
  const st = (w, col) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.strokeStyle = col; c.lineWidth = w; c.lineCap = "round"; c.lineJoin = "round"; c.stroke(); };
  const w = o.w ?? 4.6;
  st(w + 2, INK); st(w, o.col || "#8d9097"); st(Math.max(1, w * 0.35), o.hi || RIDGE);
}
// upswept eave hook at screen point (x,y), sweeping toward screen direction (dx,dy) (unit), size s
export function hook(c, x, y, dx, dy, s = 1, o = {}) {
  const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
  const ax = x + dx * 7 * s, ay = y + dy * 4 * s - 2 * s, bx = x + dx * 13 * s, by = y + dy * 4 * s - 11 * s, ex = x + dx * 11 * s, ey = y - 20 * s;
  const path = () => { c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(ax, ay, bx, by, ex, ey); };
  path(); c.strokeStyle = INK; c.lineWidth = 5.6 * Math.min(1.2, s); c.lineCap = "round"; c.stroke();
  path(); c.strokeStyle = o.col || "#8d9097"; c.lineWidth = 3.4 * Math.min(1.2, s); c.stroke();
  path(); c.strokeStyle = o.hi || RIDGE; c.lineWidth = 1.2; c.stroke();
  // little curl at the tip
  c.beginPath(); c.arc(ex - dx * 2 * s, ey + 1.5 * s, 2.2 * s, 0, 7); c.fillStyle = o.col || "#8d9097"; c.fill(); c.lineWidth = 1; c.strokeStyle = INK; c.stroke();
}

// ---------- octagonal plan helpers (elongated along screen-x) ----------
// plan point at angle th on an octagon of semi-axes A (along (1,-1), screen right) and B (along (1,1), toward viewer)
export function ring(cu, cv, A, B, z, rot = (80 * Math.PI) / 180, n = 8) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const th = rot + (i * 2 * Math.PI) / n, x = Math.cos(th) * A, y = Math.sin(th) * B;
    out.push([cu + (x + y) / Math.SQRT2, cv + (y - x) / Math.SQRT2, z]);
  }
  return out;
}
// visible faces of a ring (outward normal toward the viewer), sorted back to front: [{i, j, a, b, lit, d}]
export function ringFaces(R, cu, cv, minFacing = -0.05) {
  const n = R.length, out = [];
  for (let i = 0; i < n; i++) {
    const a = R[i], b = R[(i + 1) % n], mu = (a[0] + b[0]) / 2 - cu, mv = (a[1] + b[1]) / 2 - cv;
    let nu = b[1] - a[1], nv = -(b[0] - a[0]); if (nu * mu + nv * mv < 0) { nu = -nu; nv = -nv; }
    const L = Math.hypot(nu, nv) || 1; nu /= L; nv /= L;
    const facing = (nu + nv) / Math.SQRT2;
    if (facing < minFacing) continue;
    const lit = clamp(0.5 + (nv - nu) * 0.5, 0, 1); // faces turned left (toward +v) are lit
    out.push({ i, j: (i + 1) % n, a, b, lit, facing, d: a[0] + a[1] + b[0] + b[1] });
  }
  return out.sort((p, q) => p.d - q.d);
}
// a full octagonal (or n-gon) roof tier: eave ring (corners lifted) up to an inner ring or apex
// o: cu, cv, A, B, z (eave), lift, top: {A, B, z} | apex z, sag, col, hooks, hookS, ribsPerFace
export function ringRoof(k, o) {
  const c = k.ctx, { cu, cv } = o, n = o.n ?? 8, rot = o.rot ?? (80 * Math.PI) / 180;
  const E = o.E || ring(cu, cv, o.A, o.B, o.z, rot, n);
  const T = o.T || (o.apex != null ? E.map(() => [cu, cv, o.apex]) : ring(cu, cv, o.top.A, o.top.B, o.top.z, rot, n));
  const lift = o.lift ?? 0.4, sagE = o.sagE ?? 0.06;
  const edge = (a, b) => { const out = []; for (let s = 0; s <= 14; s++) { const f = s / 14, e = Math.pow(Math.abs(2 * f - 1), 2.6); out.push([lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f) + lift * e - sagE * Math.sin(Math.PI * f)]); } return out; };
  const faces = ringFaces(E, cu, cv, -0.25);
  for (const f of faces) {
    const Ee = edge(E[f.i], E[f.j]);
    const Tt = []; for (let s = 0; s <= 14; s++) Tt.push(lerp3(T[f.i], T[f.j], s / 14));
    tileFace(k, Ee, Tt, { col: o.col || TILE, sag: o.sag ?? 0.12, ribs: o.ribs ?? Math.max(8, Math.round(Math.hypot(...[0, 1].map((q) => E[f.j][q] - E[f.i][q])) * 9)), rows: o.rows ?? 7, light: (f.lit - 0.5) * 0.24 - (f.facing < 0.1 ? 0.12 : 0) });
  }
  // hips + hooks on the corners between drawn faces
  const corners = new Set(); faces.forEach((f) => { corners.add(f.i); corners.add(f.j); });
  const list = [...corners].sort((a, b) => (E[a][0] + E[a][1]) - (E[b][0] + E[b][1]));
  for (const i of list) {
    const e = [E[i][0], E[i][1], E[i][2] + lift];
    ridge3(k, e, T[i], { sag: o.sag ?? 0.12, w: o.hipW ?? 4.2 });
  }
  if (o.hooks !== false) for (const i of list) {
    const e = [E[i][0], E[i][1], E[i][2] + lift], p = P(...e), q = P(e[0] + (E[i][0] - cu) * 0.3, e[1] + (E[i][1] - cv) * 0.3, e[2]);
    hook(c, p[0], p[1], q[0] - p[0], (q[1] - p[1]) * 0.5, o.hookS ?? 1.1);
  }
  return { E, T, corners: list, lift };
}

// ---------- facade pieces on a vertical face from a (3D, base) to b (3D, base) ----------
export const fp = (a, b, s, z) => P(lerp(a[0], b[0], s), lerp(a[1], b[1], s), z);
export function fquad(c, a, b, s0, s1, z0, z1) { const q = [fp(a, b, s0, z0), fp(a, b, s1, z0), fp(a, b, s1, z1), fp(a, b, s0, z1)]; c.beginPath(); q.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); return q; }
// red lattice panel (balustrade or window grille) in face coords
export function latticePanel(c, a, b, s0, s1, z0, z1, o = {}) {
  fquad(c, a, b, s0, s1, z0, z1); c.fillStyle = o.bg || RED_D; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
  const L = Math.hypot(...[0, 1].map((q) => (b[q] - a[q]) * (s1 - s0))) * CTS.S, nx = Math.max(2, Math.round(L / (o.cell || 6))), nz = Math.max(1, Math.round(((z1 - z0) * ZS) / (o.cell || 6)));
  c.strokeStyle = o.col || RED_L; c.lineWidth = o.lw || 1.1; c.beginPath();
  const m = 0.08;
  for (let i = 0; i <= nx; i++) { const s = lerp(s0, s1, lerp(m, 1 - m, i / nx)); const p = fp(a, b, s, z0 + (z1 - z0) * m), q = fp(a, b, s, z1 - (z1 - z0) * m); c.moveTo(...p); c.lineTo(...q); }
  for (let j = 0; j <= nz; j++) { const z = lerp(z0 + (z1 - z0) * m, z1 - (z1 - z0) * m, j / nz); c.moveTo(...fp(a, b, lerp(s0, s1, m), z)); c.lineTo(...fp(a, b, lerp(s0, s1, 1 - m), z)); }
  c.stroke();
  if (o.fret) { // key-fret diamonds in each cell
    c.strokeStyle = o.fretCol || "#d8a24a"; c.lineWidth = 0.6; c.beginPath();
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const sa = lerp(s0, s1, lerp(m, 1 - m, (i + 0.5) / nx)), za = lerp(z0 + (z1 - z0) * m, z1 - (z1 - z0) * m, (j + 0.5) / nz), ds = (s1 - s0) * (1 - 2 * m) / nx * 0.3, dz = (z1 - z0) * (1 - 2 * m) / nz * 0.3;
      c.moveTo(...fp(a, b, sa - ds, za)); c.lineTo(...fp(a, b, sa, za + dz)); c.lineTo(...fp(a, b, sa + ds, za)); c.lineTo(...fp(a, b, sa, za - dz)); c.closePath();
    }
    c.stroke();
  }
}
// red timber column at base point p (3D) from z0 to z1
export function column3(c, p, z0, z1, w = 5) {
  const [x, y0] = P(p[0], p[1], z0), [, y1] = P(p[0], p[1], z1);
  c.lineCap = "butt"; c.strokeStyle = INK; c.lineWidth = w + 2; c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke();
  c.strokeStyle = RED; c.lineWidth = w; c.stroke();
  c.strokeStyle = "rgba(255,190,150,0.45)"; c.lineWidth = 1; c.beginPath(); c.moveTo(x - w * 0.22, y0); c.lineTo(x - w * 0.22, y1); c.stroke();
}
// seated / standing figure silhouettes behind a window (screen px)
export function figure(c, x, y, s, seed, t, o = {}) {
  const R = rng(seed), shirt = ["#3f6fa8", "#e8e2d4", "#d9534a", "#2e4a6b", "#5f9e6e", "#7a5ea8", "#c99a5a", "#e8c14a"][Math.floor(R() * 8)], hair = R() < 0.8 ? "#221a16" : "#8c8c8c";
  const bob = Math.sin(t * (1.2 + R()) + seed) * 0.6 * s, turn = Math.sin(t * 0.7 + seed * 3) > 0.6 ? 1 : 0;
  c.fillStyle = shirt; c.strokeStyle = "rgba(40,20,10,0.8)"; c.lineWidth = 0.7;
  c.beginPath(); c.moveTo(x - 4.2 * s, y); c.quadraticCurveTo(x - 4.4 * s, y - 7 * s + bob, x, y - 7.6 * s + bob); c.quadraticCurveTo(x + 4.4 * s, y - 7 * s + bob, x + 4.2 * s, y); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = "#e6b48c"; c.beginPath(); c.arc(x + turn * 0.6 * s, y - 10 * s + bob, 2.7 * s, 0, 7); c.fill(); c.stroke();
  c.fillStyle = hair; c.beginPath(); c.arc(x + turn * 0.6 * s, y - 10.8 * s + bob, 2.8 * s, Math.PI * 1.05, Math.PI * 1.95); c.fill();
  if (o.cup) { c.fillStyle = "#f4f0e6"; c.fillRect(x + 3 * s, y - 4 * s, 2 * s, 2 * s); }
}

// ---------- straight corridor gallery (long tiled roof, red posts, lattice, whitewashed rear wall) ----------
// axis 'v': runs along v at u in [cR (rear), cF (front)];  axis 'u': runs along u at v in [cR, cF].
// o: a0, a1, cR, cF, zF (floor), H (post height), rise, people(k, map) callback, cross: [b0, b1] raised cross-gable section,
// endWall (bool, at a1, with octagonal window), seed
export function corridor(k, t, o) {
  const c = k.ctx, ax = o.axis, M = (a, cc, z = 0) => (ax === "v" ? [cc, a, z] : [a, cc, z]);
  const { a0, a1, cR, cF, zF, H } = o, zT = zF + H;
  // stone base (from slab bottom to the floor) + piers
  const base = (z0, z1, col) => {
    const pts = [M(a0, cF + 0.12, z0), M(a1, cF + 0.12, z0), M(a1, cF + 0.12, z1), M(a0, cF + 0.12, z1)];
    k.poly(pts, col, { lw: 1.2, wobble: 0 });
    const endF = [M(a1, cR - 0.05, z0), M(a1, cF + 0.12, z0), M(a1, cF + 0.12, z1), M(a1, cR - 0.05, z1)];
    k.poly(endF, shade(col, ax === "v" ? -0.02 : -0.14), { lw: 1.2, wobble: 0 });
  };
  base(o.zBase ?? -0.46, zF, STONE_D);
  // dark water gaps between piers + block lines
  const nP = Math.max(2, Math.round((a1 - a0) / 0.9));
  for (let i = 0; i < nP; i++) {
    const s0 = a0 + ((a1 - a0) * (i + 0.18)) / nP, s1 = a0 + ((a1 - a0) * (i + 0.82)) / nP;
    k.poly([M(s0, cF + 0.12, (o.zBase ?? -0.46) + 0.02), M(s1, cF + 0.12, (o.zBase ?? -0.46) + 0.02), M(s1, cF + 0.12, zF - 0.14), M(s0, cF + 0.12, zF - 0.14)], "#2f5a52", { lw: 0.9, wobble: 0 });
  }
  k.poly([M(a0, cF + 0.12, zF - 0.12), M(a1, cF + 0.12, zF - 0.12), M(a1, cF + 0.12, zF), M(a0, cF + 0.12, zF)], STONE, { lw: 1, wobble: 0 });
  // rear wall face (whitewashed) with lattice leak windows
  const wallTop = zT + 0.35;
  k.poly([M(a0, cR, zF), M(a1, cR, zF), M(a1, cR, wallTop), M(a0, cR, wallTop)], shade(PLASTER, -0.06), { lw: 1.1, wobble: 0 });
  const nW = Math.max(1, Math.floor((a1 - a0) / 1.25));
  for (let i = 0; i < nW; i++) {
    const am = a0 + ((a1 - a0) * (i + 0.5)) / nW, [x, y] = P(...M(am, cR, zF + H * 0.55));
    const shape = i % 3;
    c.save(); c.beginPath();
    if (shape === 0) c.ellipse(x, y, 7, 9, 0, 0, 7); else if (shape === 1) { for (let q = 0; q < 8; q++) { const a = (q / 8) * 6.283 + 0.39; q ? c.lineTo(x + Math.cos(a) * 8, y + Math.sin(a) * 9) : c.moveTo(x + Math.cos(a) * 8, y + Math.sin(a) * 9); } c.closePath(); } else { c.rect(x - 7, y - 7, 14, 14); }
    c.fillStyle = "#a9c79a"; c.fill(); c.strokeStyle = "#7b7468"; c.lineWidth = 2.4; c.stroke(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
    c.clip(); c.strokeStyle = "#6f6a60"; c.lineWidth = 1; c.beginPath(); for (let d = -14; d <= 14; d += 4.5) { c.moveTo(x + d - 10, y - 10); c.lineTo(x + d + 10, y + 10); c.moveTo(x + d + 10, y - 10); c.lineTo(x + d - 10, y + 10); } c.stroke(); c.restore();
  }
  // floor
  k.poly([M(a0, cR, zF), M(a1, cR, zF), M(a1, cF + 0.12, zF), M(a0, cF + 0.12, zF)], "#b9a27c", { lw: 1, wobble: 0 });
  // people inside the gallery
  if (o.people) o.people(k, M);
  // front: posts, bench-railing (meirenkao), hanging lattice frieze, beam
  const nB = Math.max(2, Math.round((a1 - a0) / (o.bay ?? 0.85)));
  const fa = M(a0, cF, 0), fb = M(a1, cF, 0);
  for (let i = 0; i < nB; i++) {
    const s0 = i / nB, s1 = (i + 1) / nB;
    latticePanel(c, fa, fb, s0 + 0.01, s1 - 0.01, zF + 0.06, zF + 0.42, { cell: 5.5, bg: RED_D, col: RED_L });
    // bench seat board
    const q = [fp(fa, fb, s0, zF + 0.42), fp(fa, fb, s1, zF + 0.42)]; c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.moveTo(...q[0]); c.lineTo(...q[1]); c.stroke(); c.strokeStyle = "#8a3a26"; c.lineWidth = 2; c.stroke();
    // hanging lattice (guazi) under the beam, open in the middle
    latticePanel(c, fa, fb, s0 + 0.01, s1 - 0.01, zT - 0.28, zT - 0.04, { cell: 4.5, bg: "rgba(0,0,0,0)", col: RED_L, lw: 0.9 });
    fquad(c, fa, fb, s0 + 0.06, s1 - 0.06, zT - 0.3, zT - 0.26); c.fillStyle = RED; c.fill();
  }
  for (let i = 0; i <= nB; i++) column3(c, M(lerp(a0, a1, i / nB), cF, 0), zF, zT, 4.6);
  fquad(c, fa, fb, 0, 1, zT - 0.04, zT + 0.12); c.fillStyle = RED_D; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  fquad(c, fa, fb, 0, 1, zT + 0.04, zT + 0.08); c.fillStyle = "#2f6f64"; c.fill();
  // end gable wall (whitewashed, grey coping, octagonal lattice window)
  const over = o.over ?? 0.3, zE = zT + 0.12, zR = zT + (o.rise ?? 0.75), mid = (cR + cF) / 2;
  if (o.endWall) {
    const wa = M(a1, cR - 0.08, 0), wb = M(a1, cF + 0.16, 0);
    const prof = [fp(wa, wb, 0, zF), fp(wa, wb, 1, zF), fp(wa, wb, 1, zE + 0.1), fp(wa, wb, 0.5, zR + 0.15), fp(wa, wb, 0, zE + 0.1)];
    c.beginPath(); prof.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath();
    c.fillStyle = ax === "v" ? PLASTER : shade(PLASTER, -0.12); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
    // octagonal lattice window
    const [x, y] = fp(wa, wb, 0.5, zF + H * 0.5), r = 11;
    c.save(); c.beginPath(); for (let q = 0; q < 8; q++) { const a = (q / 8) * 6.283 + 0.39; q ? c.lineTo(x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r) : c.moveTo(x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r); } c.closePath();
    c.fillStyle = "#4c463c"; c.fill(); c.strokeStyle = "#8d877a"; c.lineWidth = 3; c.stroke(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke(); c.clip();
    c.strokeStyle = "#cfc6b2"; c.lineWidth = 1.1; c.beginPath();
    for (let q = 0; q < 6; q++) { const a = (q / 6) * Math.PI; c.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r); c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    c.moveTo(x + r * 0.5, y); c.arc(x, y, r * 0.5, 0, 7); c.stroke(); c.restore();
  }
  // main roof: front slope (eave -> ridge), verge at a1, hooks at the ends
  const E = [], T = [], N = 24, liftE = o.lift ?? 0.32;
  for (let i = 0; i <= N; i++) { const f = i / N, a = lerp(a0 - 0.18, a1 + 0.22, f), e = Math.pow(Math.abs(2 * f - 1), 6); E.push(M(a, cF + over, zE + liftE * e - 0.05 * Math.sin(Math.PI * f))); T.push(M(lerp(a0 - 0.05, a1 + 0.12, f), mid, zR)); }
  tileFace(k, E, T, { sag: 0.12, ribs: Math.round((a1 - a0) * 9), rows: 6, light: ax === "v" ? -0.06 : 0.04 });
  // the verge face at the a1 end (visible gable-side tiles)
  const vE = [], vT = [];
  for (let i = 0; i <= 8; i++) { const f = i / 8; vE.push(M(a1 + 0.22, lerp(cF + over, mid, f), lerp(zE + liftE, zR, f))); vT.push(M(a1 + 0.05, lerp(cF + over * 0.4, mid, f), lerp(zE + 0.1, zR, f))); }
  ridge3(k, M(a1 + 0.22, cF + over, zE + liftE), M(a1 + 0.12, mid, zR), { sag: 0.08, w: 3.6 });
  // ridge line along the top
  { const r0 = M(a0 - 0.05, mid, zR), r1 = M(a1 + 0.12, mid, zR); ridge3(k, r0, r1, { w: 5.2 }); }
  for (const [a, sd] of [[a0 - 0.18, -1], [a1 + 0.22, 1]]) {
    const p = P(...M(a, cF + over, zE + liftE)), q = P(...M(a + sd * 0.4, cF + over + 0.2, zE + liftE));
    hook(c, p[0], p[1], q[0] - p[0], (q[1] - p[1]) * 0.4, 0.95);
  }
  // raised pavilion section: hip-gable (xieshan) roof with its ridge across the corridor and a plaster gable to the front
  if (o.cross) {
    const [b0, b1] = o.cross, bm = (b0 + b1) / 2, zE2 = zR - 0.18, zR2 = zR + 0.75, ov2 = over + 0.1;
    const E = [M(b0 - 0.28, cR - 0.2, zE2), M(b1 + 0.28, cR - 0.2, zE2), M(b1 + 0.28, cF + ov2, zE2), M(b0 - 0.28, cF + ov2, zE2)];
    const tb = M(bm, cR + 0.25, zR2), tf = M(bm, cF + ov2 - 0.38, zR2), T = [tb, tb, tf, tf];
    const cm = M(bm, mid, 0);
    const r = ringRoof(k, { cu: cm[0], cv: cm[1], E, T, n: 4, lift: 0.36, sag: 0.08, hookS: 1.1, rows: 5, ribs: 14 });
    // gable triangle (plaster) on the front hip
    const hipPt = (e, f) => qpt([e[0], e[1], e[2] + 0.36], tf, f, 0.08);
    const g1 = hipPt(E[2], 0.5), g2 = hipPt(E[3], 0.5);
    const tri = [P(...tf), P(...g1), P(...g2)];
    c.beginPath(); tri.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.fillStyle = PLASTER; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke();
    c.strokeStyle = "rgba(120,110,95,0.6)"; c.lineWidth = 0.8; c.beginPath(); const m1 = P(...lerp3(g1, g2, 0.5)); c.moveTo(...P(...tf)); c.lineTo(...m1); c.stroke();
    ridge3(k, tb, tf, { w: 5 });
    for (const p of [tf]) { const [x, y] = P(...p); hook(c, x, y + 2, 1, 0, 0.7); hook(c, x, y + 2, -1, 0, 0.7); }
  }
}

// ---------- taihu scholar rock: lumpy, pale, deeply holed ----------
export function taihu(k, u, v, h, w, seed, o = {}) {
  const c = k.ctx, [x, y] = P(u, v, o.z || 0), R = rng(seed * 7 + 3), H = h * ZS, W = w * CTS.S;
  k.ell(u + 0.12, v + 0.06, 0, w * 0.42, "rgba(50,40,25,0.16)", { stroke: false });
  // outline: a union of irregular lumps stacked up (eroded limestone)
  const lumps = [], nl = 4 + Math.round(h * 2);
  for (let i = 0; i < nl; i++) { const f = (i + 0.5) / nl, wf = (0.75 + 0.35 * Math.sin(Math.PI * Math.pow(f, 0.7))) * (1 - 0.3 * f); lumps.push([x + (R() - 0.5) * W * 0.55 * wf + (o.lean || 0) * f * W * 0.3, y - f * H * 0.92, W * (0.22 + 0.16 * R()) * wf, H / nl * (0.75 + 0.4 * R())]); }
  for (let i = 0; i < 4; i++) lumps.push([x + (R() - 0.5) * W * 0.9, y - H * (0.15 + 0.5 * R()), W * (0.12 + 0.1 * R()), H * 0.12]);
  const path = () => { c.beginPath(); for (const [lx, ly, rx, ry] of lumps) { c.moveTo(lx + rx, ly); c.ellipse(lx, ly, rx, ry, 0, 0, 7); } };
  c.save(); path(); c.strokeStyle = INK; c.lineWidth = 3.2; c.lineJoin = "round"; c.stroke(); c.restore();
  path();
  const g = c.createLinearGradient(x - W * 0.6, y - H, x + W * 0.6, y);
  g.addColorStop(0, "#f2ede0"); g.addColorStop(0.55, "#d9d1bf"); g.addColorStop(1, "#a59c88");
  c.fillStyle = g; c.fill();
  c.save(); path(); c.clip();
  // eroded folds
  c.strokeStyle = "rgba(110,100,80,0.55)"; c.lineWidth = 1;
  for (let i = 0; i < 9; i++) { const sx = x + (R() - 0.5) * W, sy = y - R() * H; c.beginPath(); c.moveTo(sx, sy); c.bezierCurveTo(sx + 6, sy - 4, sx + 2, sy - 10, sx + 7, sy - 14); c.stroke(); }
  // holes: dark with a pale lower lip
  const nh = o.holes ?? Math.round(5 + h * 3);
  for (let i = 0; i < nh; i++) {
    const hx = x + (R() - 0.5) * W * 0.7, hy = y - H * (0.12 + 0.76 * R()), rw = W * (0.028 + 0.05 * R()), rh = rw * (1.0 + 0.8 * R()), ang = (R() - 0.5) * 0.8;
    c.fillStyle = "rgba(120,110,92,0.55)"; c.beginPath(); c.ellipse(hx, hy, rw + 2.2, rh + 2.2, ang, 0, 7); c.fill();
    const gg = c.createRadialGradient(hx - rw * 0.3, hy - rh * 0.4, 0.5, hx, hy, rh * 1.1); gg.addColorStop(0, "#1f1c18"); gg.addColorStop(1, "#5a5346");
    c.fillStyle = gg; c.beginPath(); c.ellipse(hx, hy, rw, rh, ang, 0, 7); c.fill();
    c.strokeStyle = "rgba(255,255,248,0.7)"; c.lineWidth = 1.1; c.beginPath(); c.ellipse(hx, hy, rw + 1.2, rh + 1.2, ang, 0.3, Math.PI - 0.3); c.stroke();
  }
  // shallow pits
  c.fillStyle = "rgba(140,130,110,0.5)"; for (let i = 0; i < nh; i++) { c.beginPath(); c.ellipse(x + (R() - 0.5) * W * 0.8, y - H * (0.1 + 0.8 * R()), 1.6 + R() * 2, 1.2 + R() * 1.5, 0, 0, 7); c.fill(); }
  // light top facets
  c.fillStyle = "rgba(255,255,255,0.35)"; for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(x - W * 0.2 + (R() - 0.5) * W * 0.5, y - H * (0.55 + 0.4 * R()), W * 0.12, 2.5, -0.3, 0, 7); c.fill(); }
  c.restore();
}

// ---------- weeping willow (big, layered strands that sway) ----------
export function bigWillow(k, u, v, h, sz, seed, o = {}) {
  const c = k.ctx, t = k.t, [bx, by] = P(u, v, 0), [cx, cy] = P(u, v, h), R = rng(seed * 11 + 5), col = o.col || "#b2cc56";
  k.ell(u + 0.2, v + 0.1, 0, 0.6 * sz, "rgba(50,45,25,0.15)", { stroke: false });
  const lean = o.lean ?? 14, W = 80 * sz, Hh = 40 * sz;
  // crown mass behind the strands
  for (let i = 0; i < 5; i++) { const a = (i / 5) * 6.283; k._lobe(cx + Math.cos(a) * W * 0.5, cy - Hh * 0.35 + Math.sin(a) * Hh * 0.35, W * 0.42, shade(col, -0.2 + (i % 2) * 0.05), seed + i, { squash: 0.62, bumps: 10, lw: 0.8 }); }
  // gnarled trunk + boughs
  c.lineCap = "round";
  for (const [w, col2] of [[13, INK], [9.5, "#7a5a3c"]]) { c.strokeStyle = col2; c.lineWidth = w; c.beginPath(); c.moveTo(bx, by); c.bezierCurveTo(bx - 4, by - 30, cx + lean * 0.4, cy + 40, cx + lean, cy + 10); c.stroke(); }
  for (const [w, col2] of [[6, INK], [3.8, "#7a5a3c"]]) { c.strokeStyle = col2; c.lineWidth = w; c.beginPath(); c.moveTo(cx + lean * 0.6, cy + 24); c.quadraticCurveTo(cx - 20 * sz, cy, cx - 44 * sz, cy - 10); c.moveTo(cx + lean, cy + 12); c.quadraticCurveTo(cx + 30 * sz, cy - 4, cx + 48 * sz, cy - 8); c.moveTo(cx + lean * 0.8, cy + 14); c.quadraticCurveTo(cx, cy - 20, cx - 6, cy - 34 * sz); c.stroke(); }
  c.strokeStyle = "rgba(60,40,20,0.6)"; c.lineWidth = 1; c.beginPath(); for (let i = 0; i < 5; i++) { const yy = by - 8 - i * 10; c.moveTo(bx - 3, yy); c.quadraticCurveTo(bx, yy - 3, bx + 3, yy - 1); } c.stroke();
  // hanging strands: anchors over the dome, drawn top to bottom
  const strands = [];
  for (let i = 0; i < 190; i++) {
    const xr = R() * 2 - 1, edge = Math.sqrt(1 - xr * xr), x0 = cx + xr * W, y0 = cy - Hh * 0.9 * edge + R() * Hh * 0.9 * edge + Hh * 0.15;
    strands.push({ x0, y0, len: (14 + R() * 22 + edge * 46) * sz * (o.len ?? 1), ph: R() * 6.28, sh: R() });
  }
  strands.sort((p, q) => p.y0 - q.y0);
  for (const st of strands) {
    const sw = Math.sin(t * 1.25 + st.ph) * 3.2 + Math.sin(t * 2.3 + st.ph * 2) * 1.1, out = (st.x0 - cx) / W;
    const ox = out * 20, ex = st.x0 + ox + sw, ey = st.y0 + st.len;
    const lc = shade(col, -0.2 + st.sh * 0.32);
    const pth = () => { c.beginPath(); c.moveTo(st.x0, st.y0); c.bezierCurveTo(st.x0 + ox * 0.7, st.y0 - 7, st.x0 + ox + sw * 0.2, st.y0 + st.len * 0.25, ex, ey); };
    pth(); c.strokeStyle = "rgba(46,66,18,0.7)"; c.lineWidth = 3.4; c.stroke(); pth(); c.strokeStyle = lc; c.lineWidth = 2; c.stroke();
    // leaves along the strand (bezier samples)
    c.fillStyle = shade(lc, 0.14);
    for (let j = 2; j <= 7; j++) {
      const f = j / 7.5, a = (1 - f) ** 3, b = 3 * f * (1 - f) ** 2, d = 3 * f * f * (1 - f), e = f ** 3;
      const px = a * st.x0 + b * (st.x0 + ox * 0.7) + d * (st.x0 + ox + sw * 0.2) + e * ex, py = a * st.y0 + b * (st.y0 - 7) + d * (st.y0 + st.len * 0.25) + e * ey, sd = j % 2 ? 1 : -1;
      c.beginPath(); c.ellipse(px + sd * 1.7, py, 1.1, 2.5, sd * 0.5, 0, 7); c.fill();
    }
  }
}

// ---------- lotus: flat pads on the water + raised pads + pink flowers on stems ----------
export function lotusCluster(k, u, v, n, seed, o = {}) {
  const c = k.ctx, t = k.t, R = rng(seed * 13 + 1), sp = o.spread ?? 0.7;
  const items = [];
  for (let i = 0; i < n; i++) items.push({ du: (R() - 0.5) * 2 * sp, dv: (R() - 0.5) * 2 * sp * 0.8, r: 9 + R() * 7, up: R() < 0.3 ? 4 + R() * 9 : 0, fl: R() < 0.35, bud: R() < 0.2, ph: R() * 6 });
  items.sort((a, b) => (a.du + a.dv) - (b.du + b.dv));
  for (const it of items) {
    const [x, y0] = P(u + it.du, v + it.dv, 0), bob = Math.sin(t * 1.2 + it.ph) * 0.7, y = y0 - it.up + bob;
    if (it.up) { c.strokeStyle = "#4f7a35"; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y); c.stroke(); }
    const r = it.r;
    c.fillStyle = it.up ? "#6aa84e" : "#5b9a44"; c.strokeStyle = "#1f3a22"; c.lineWidth = 1.1;
    c.beginPath(); c.ellipse(x, y, r, r * (it.up ? 0.62 : 0.5), 0, 0.3, Math.PI * 2 - 0.3); c.lineTo(x, y); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = "rgba(220,240,180,0.45)"; c.lineWidth = 0.7; c.beginPath(); for (let a = 0; a < 7; a++) { const an = 0.5 + a * 0.85; c.moveTo(x, y); c.lineTo(x + Math.cos(an) * r * 0.85, y + Math.sin(an) * r * 0.45); } c.stroke();
    c.fillStyle = "rgba(255,255,255,0.18)"; c.beginPath(); c.ellipse(x - r * 0.3, y - r * 0.12, r * 0.35, r * 0.14, 0, 0, 7); c.fill();
  }
  // flowers on taller stems, petals open and close very slowly
  for (const it of items) if (it.fl || it.bud) {
    const [x, y0] = P(u + it.du + 0.08, v + it.dv - 0.05, 0), sw = Math.sin(t * 1.1 + it.ph) * 1.4, hgt = 16 + it.r, fx = x + sw, fy = y0 - hgt;
    c.strokeStyle = "#3f6a2c"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, y0); c.quadraticCurveTo(x, y0 - hgt * 0.5, fx, fy); c.stroke();
    if (it.bud) { c.fillStyle = "#f08db0"; c.strokeStyle = "#a33f68"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(fx, fy - 9); c.quadraticCurveTo(fx + 4.5, fy - 3, fx, fy + 1); c.quadraticCurveTo(fx - 4.5, fy - 3, fx, fy - 9); c.fill(); c.stroke(); continue; }
    const open = 0.85 + 0.15 * Math.sin(t * 0.6 + it.ph);
    for (const [rad, cnt, col] of [[7.5, 7, "#f6a9c6"], [5, 5, "#fbd0df"]]) for (let p = 0; p < cnt; p++) {
      const a = -Math.PI / 2 + ((p - (cnt - 1) / 2) / cnt) * Math.PI * 1.15 * open;
      c.fillStyle = col; c.strokeStyle = "#b24d78"; c.lineWidth = 0.8;
      c.beginPath(); c.ellipse(fx + Math.cos(a) * rad * 0.45, fy + Math.sin(a) * rad * 0.55, 2.4, rad * 0.62, a + Math.PI / 2, 0, 7); c.fill(); c.stroke();
    }
    c.fillStyle = "#f4d564"; c.beginPath(); c.ellipse(fx, fy - 1, 2.6, 1.6, 0, 0, 7); c.fill(); c.strokeStyle = "#a07a20"; c.lineWidth = 0.6; c.stroke();
  }
}

// ---------- shrub mound with optional azalea flowers ----------
export function shrub(k, u, v, r, seed, o = {}) {
  const c = k.ctx, R = rng(seed * 3 + 7), [x, y] = P(u, v, 0.12), Rpx = r * CTS.S;
  k._lobe(x, y - Rpx * 0.25, Rpx, o.col || (R() < 0.5 ? "#6f9e45" : "#7fae4f"), seed, { squash: 0.72, bumps: 9 });
  if (o.flowers) {
    const cols = o.flowers;
    for (let i = 0; i < Math.round(r * 26); i++) { const a = R() * 6.283, d = Math.sqrt(R()) * Rpx * 0.8, fx = x + Math.cos(a) * d, fy = y - Rpx * 0.3 + Math.sin(a) * d * 0.6; c.fillStyle = cols[Math.floor(R() * cols.length)]; for (let q = 0; q < 5; q++) { const b = (q / 5) * 6.283; c.beginPath(); c.arc(fx + Math.cos(b) * 1.6, fy + Math.sin(b) * 1.6, 1.3, 0, 7); c.fill(); } c.fillStyle = "#f8e7a0"; c.beginPath(); c.arc(fx, fy, 0.8, 0, 7); c.fill(); }
  }
}
// blossom tree (pink plum / cherry): lobed canopy dotted with blossom
export function blossomTree(k, u, v, r, h, seed, o = {}) {
  k.tree(u, v, { r, h, seed, col: o.col || "#f0a6c2", peek: true });
  const c = k.ctx, R = rng(seed * 5 + 1), [cx, cy] = P(u, v, h), Rp = r * CTS.S * 1.05;
  for (let i = 0; i < Math.round(r * 60); i++) { const a = R() * 6.283, d = Math.sqrt(R()) * Rp * 1.05, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.85 - Rp * 0.1; c.fillStyle = R() < 0.5 ? "#fbd3e2" : "#e2709a"; c.beginPath(); c.arc(x, y, 1.3 + R(), 0, 7); c.fill(); }
}
