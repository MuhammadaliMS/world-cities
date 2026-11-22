// LONDON 0,1 (Hyde Park) grid helpers: curve maths in (u,v) for the Serpentine, its bank ring, boat loops and the riding track.
// Sprites (oak, bandstand, rowing boat, swan, newspaper, reeds, lilies) live in _t0_1.js and are all anchored with P().
import { P, CTS, INK, shade, lerp, clamp, rng, hash } from "../../lib/vec-kit.js";
export { P, CTS, INK, shade, lerp, clamp, rng, hash };
export * from "./_t0_1.js";

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

// open polyline with arclength parameter f in 0..1; at(f, off) = point pushed sideways by off (left normal)
export function makeLine(pts) {
  const n = pts.length, cum = [0];
  for (let i = 1; i < n; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = cum[n - 1];
  const at = (f, off = 0) => {
    f = clamp(f); const s = f * L; let i = 0; while (i < n - 2 && cum[i + 1] < s) i++;
    const a = pts[i], b = pts[i + 1], q = (s - cum[i]) / (cum[i + 1] - cum[i] || 1);
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    return [lerp(a[0], b[0], q) - (dy / l) * off, lerp(a[1], b[1], q) + (dx / l) * off];
  };
  return { at, L };
}

// closed polygon from a centre line and a half-width function of f
export function ribbonVar(line, hw, n = 90) {
  const Lf = [], Rf = [];
  for (let i = 0; i <= n; i++) { const f = i / n, h = hw(f); Lf.push(line.at(f, h)); Rf.push(line.at(f, -h)); }
  return [...Lf, ...Rf.reverse()];
}

// push a closed polygon outward by d (normals averaged; fine for the smooth banana lake)
export function offsetPoly(pts, d) {
  const n = pts.length; let area = 0;
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
  const sg = area > 0 ? 1 : -1;
  return pts.map((p, i) => {
    const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [p[0] + sg * ((b[1] - a[1]) / l) * d, p[1] - sg * ((b[0] - a[0]) / l) * d];
  });
}

export function makeLoop(pts) {
  const n = pts.length, cum = [0];
  for (let i = 1; i <= n; i++) { const a = pts[i - 1], b = pts[i % n]; cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const L = cum[n];
  const at = (f) => {
    f = ((f % 1) + 1) % 1; const s = f * L; let i = 0; while (i < n - 1 && cum[i + 1] < s) i++;
    const a = pts[i], b = pts[(i + 1) % n], q = (s - cum[i]) / (cum[i + 1] - cum[i] || 1);
    return [lerp(a[0], b[0], q), lerp(a[1], b[1], q)];
  };
  // position + heading at distance-parameter f
  const state = (f) => { const p = at(f), q = at(f + 0.004); return { u: p[0], v: p[1], du: q[0] - p[0], dv: q[1] - p[1], ang: Math.atan2(q[1] - p[1], q[0] - p[0]) }; };
  return { at, state, L };
}

export function distToPoly(pts, u, v) {
  let d = 1e9;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 1;
    const t = clamp(((u - a[0]) * dx + (v - a[1]) * dy) / l2, 0, 1);
    d = Math.min(d, Math.hypot(u - (a[0] + dx * t), v - (a[1] + dy * t)));
  }
  return d;
}

// thin white post-and-rail fence along a polyline (all in u,v,z)
export function rail(k, pts, o = {}) {
  const c = k.ctx, h = o.h ?? 0.34, step = o.step ?? 0.5;
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, b] = [pts[i], pts[i + 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / step));
    for (let j = 0; j <= n; j++) {
      if (i > 0 && j === 0) continue;
      const u = lerp(a[0], b[0], j / n), v = lerp(a[1], b[1], j / n), [x0, y0] = P(u, v, 0), [x1, y1] = P(u, v, h);
      c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 3.6; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      c.strokeStyle = o.col || "#f4f0e6"; c.lineWidth = 2; c.stroke();
    }
    for (const z of [h, h * 0.55]) { k.line3([[a[0], a[1], z], [b[0], b[1], z]], { stroke: INK, lw: 3, wobble: 0 }); k.line3([[a[0], a[1], z], [b[0], b[1], z]], { stroke: o.col || "#f4f0e6", lw: 1.6, wobble: 0 }); }
  }
}
