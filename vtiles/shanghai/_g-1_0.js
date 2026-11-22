// SHANGHAI -1,0 grid helpers: (u,v) wrappers around the pixel-space tree / lake helpers in _t-1_0.js,
// closed-curve smoothing, ribbons and arc-length lanes. Every anchor goes through P() before anything is drawn.
import { P, INK, shade, lerp, clamp, rng, hash, smooth, oak, cherry, willowW, bush, pad, lotusFlower, stone, reeds } from "./_t-1_0.js";
export * from "./_t-1_0.js";

// Chaikin corner cutting (closed or open) on (u,v) points
export function chaikin(pts, n = 3, closed = false) {
  for (let i = 0; i < n; i++) {
    const o = [], m = pts.length, segs = closed ? m : m - 1;
    if (!closed) o.push(pts[0]);
    for (let j = 0; j < segs; j++) {
      const a = pts[j], b = pts[(j + 1) % m];
      o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    if (!closed) o.push(pts[m - 1]);
    pts = o;
  }
  return pts;
}
// ribbon of width w around a polyline (closed: seam wraps)
export function ribbon(pts, w, closed = false) {
  const L = [], R = [], n = pts.length;
  const at = (i) => closed ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  const N = closed ? n + 1 : n;
  for (let i = 0; i < N; i++) {
    const p = at(i), a = at(i - 1), b = at(i + 1), l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nu = (-(b[1] - a[1]) / l) * w / 2, nv = ((b[0] - a[0]) / l) * w / 2;
    L.push([p[0] + nu, p[1] + nv]); R.push([p[0] - nu, p[1] - nv]);
  }
  return [...L, ...R.reverse()];
}
// arc-length sampler on a closed polyline
export function makeLoop(pts) {
  const n = pts.length, cum = [0];
  for (let i = 1; i <= n; i++) { const a = pts[i - 1], b = pts[i % n]; cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const L = cum[n];
  const at = (f, off = 0) => {
    f = ((f % 1) + 1) % 1; const s = f * L; let i = 0; while (i < n - 1 && cum[i + 1] < s) i++;
    const a = pts[i], b = pts[(i + 1) % n], q = (s - cum[i]) / ((cum[i + 1] - cum[i]) || 1);
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    return [lerp(a[0], b[0], q) - (dy / l) * off, lerp(a[1], b[1], q) + (dx / l) * off];
  };
  const lane = (f0, f1, off, step = 0.012) => { const o = []; for (let f = f0; f < f1 + 1e-6; f += step) o.push(at(f, off)); return o; };
  return { at, lane, L };
}
export function inPoly(pts, u, v) { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const a = pts[i], b = pts[j]; if ((a[1] > v) !== (b[1] > v) && u < ((b[0] - a[0]) * (v - a[1])) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
export function distToPoly(pts, u, v) { let d = 1e9; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 1, t = clamp(((u - a[0]) * dx + (v - a[1]) * dy) / l2); d = Math.min(d, Math.hypot(u - a[0] - dx * t, v - a[1] - dy * t)); } return d; }

// ---- trees at (u,v): trunk base and canopy centre come from P() ----
export function oakUV(k, u, v, o = {}) {
  const r = o.r ?? 0.8, h = o.h ?? 1.9, [bx, by] = P(u, v, 0), [cx, cy] = P(u, v, h); P(u, v, h * 0.5);
  oak(k, bx, by, cx, cy, r * 52, r * 44, o.seed ?? 3, o.col ?? "#86b155", { lean: o.lean || 0 });
}
export function bushUV(k, u, v, o = {}) {
  const r = o.r ?? 0.45, [cx, cy] = P(u, v, r * 0.7); P(u, v, 0);
  bush(k, cx, cy, r * 48, r * 36, o.seed ?? 5, o.col ?? "#6b9a45");
}
export function cherryUV(k, u, v, o = {}) {
  const r = o.r ?? 0.8, h = o.h ?? 1.8, [bx, by] = P(u, v, 0), [cx, cy] = P(u, v, h); P(u, v, h * 0.5);
  cherry(k, bx, by, cx, cy, r * 54, r * 40, o.seed ?? 31);
}
export function willowUV(k, u, v, o = {}) {
  const r = o.r ?? 0.9, h = o.h ?? 2.0, [bx, by] = P(u, v, 0), [cx, cy] = P(u, v, h); P(u, v, h * 0.5);
  willowW(k, bx, by, cx + (o.dx || 0), cy, r * 58, r * 38, (o.hang ?? 1.5) * 42, o.seed ?? 3, { trunkX: bx + (o.dx || 0) * 0.3, col: o.col ?? "#a8c64c", tw: o.tw });
}
export function padUV(c, u, v, r, rot, col) { const [x, y] = P(u, v, 0); pad(c, x, y, r, rot, col); }
export function lotusUV(c, u, v, size, ph, t, bud, bob = 0) { const [x, y] = P(u, v, 0); lotusFlower(c, x, y - 11 + bob, size, ph, t, bud); }
export function stoneUV(c, u, v, r, seed) { const [x, y] = P(u, v, 0); stone(c, x, y + 2, r, seed); }
export function reedsUV(k, u, v, n, seed, h) { const [x, y] = P(u, v, 0); reeds(k, x, y, n, seed, h); }
