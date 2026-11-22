// Terrain for Dubai -1,0 (Desert Safari): a dune height-field h(u,v) that lives INSIDE the 10x10 footprint,
// drawn as a mesh of P(u,v,h) triangles (soft shading, ripples, crest lines). It is zero at the slab edge and
// on the flat front half, so the standard slab edge stays flat. Private to this tile.
import { P, clamp, lerp, mix, rng } from "../../lib/vec-kit.js";

// crest polylines [u, v, height, slipWidth, windWidth]; the slip face is the side facing `slip` ([du, dv])
const RIDGES = [
  { name: "corner", slip: [1, 1], pts: [[0.9, 5.4, 1.5, 1.1, 1.2], [1.1, 3.6, 2.5, 1.2, 1.3], [1.6, 1.9, 3.1, 1.3, 1.3], [2.8, 1.1, 3.1, 1.3, 1.3], [4.5, 0.9, 2.5, 1.2, 1.2], [6.2, 1.1, 1.7, 1.1, 1.1]] },
  { name: "mid", slip: [1, 1], pts: [[1.9, 5.5, 1.2, 0.9, 1.0], [2.6, 4.2, 1.9, 1.0, 1.0], [3.7, 3.1, 2.1, 1.1, 1.0], [5.2, 2.5, 1.9, 1.0, 1.0], [6.7, 2.4, 1.3, 0.9, 0.9], [7.8, 2.7, 0.8, 0.8, 0.8]] },
  { name: "right", slip: [0.4, 1], pts: [[6.0, 1.4, 1.2, 0.8, 0.9], [7.4, 1.0, 1.7, 0.9, 0.9], [8.6, 1.6, 1.9, 0.9, 0.9], [9.2, 2.6, 1.3, 0.9, 0.9]] },
  { name: "low", slip: [1, 0.6], pts: [[0.9, 5.9, 0.7, 0.7, 0.8], [1.3, 6.6, 0.6, 0.7, 0.8]] },
];
for (const r of RIDGES) {
  const l = Math.hypot(r.slip[0], r.slip[1]); r.slip = [r.slip[0] / l, r.slip[1] / l];
  r.segs = [];
  for (let i = 0; i < r.pts.length - 1; i++) {
    const a = r.pts[i], b = r.pts[i + 1], du = b[0] - a[0], dv = b[1] - a[1], L = Math.hypot(du, dv);
    let n = [-dv / L, du / L]; if (n[0] * r.slip[0] + n[1] * r.slip[1] < 0) n = [-n[0], -n[1]];
    r.segs.push({ a, b, du, dv, L, n });
  }
}
function ridgeH(r, u, v) {
  let best = 1e9, bh = 0, bws = 1, bww = 1, bd = 0;
  for (const s of r.segs) {
    let f = ((u - s.a[0]) * s.du + (v - s.a[1]) * s.dv) / (s.L * s.L); f = clamp(f);
    const qu = s.a[0] + s.du * f, qv = s.a[1] + s.dv * f, d = Math.hypot(u - qu, v - qv);
    if (d < best) { best = d; bh = lerp(s.a[2], s.b[2], f); bws = lerp(s.a[3], s.b[3], f); bww = lerp(s.a[4], s.b[4], f); bd = (u - qu) * s.n[0] + (v - qv) * s.n[1]; }
  }
  const x = bd >= 0 ? best : -best;
  const fw = x < 0 ? (x < -bww ? 0 : bh * (1 - Math.pow(-x / bww, 1.25))) : bh * (1 + 0.25 * x / bww);
  const fs = x < 0 ? bh * (1 - 1.7 * x / bws) : (x < bws ? bh * Math.pow(1 - x / bws, 1.7) : 0);
  const k = 0.16 + bh * 0.04, hh = Math.max(0, k - Math.abs(fw - fs)) / k;
  return Math.max(0, Math.min(fw, fs) - hh * hh * k * 0.25);
}
const smax = (a, b, k = 0.22) => { const h = Math.max(0, k - Math.abs(a - b)) / k; return Math.max(a, b) + h * h * k * 0.25; };
const sm = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
// keeps the slab edge (0.3 rim) and the whole flat front half at height 0
const mask = (u, v) => sm((Math.min(u, v, 10 - u, 10 - v) - 0.3) / 1.5) * Math.max(sm((7.7 - (u + v)) / 2.2), sm((3.0 - v) / 1.0) * sm((u - 3) / 2));
function hRaw(u, v) {
  let h = 0;
  for (const r of RIDGES) { const x = ridgeH(r, u, v); if (x > 0) h = h > 0 ? smax(h, x) : x; }
  return h * mask(u, v) * 0.75;
}

const N = 100, D = 10 / N;
const HF = new Float32Array((N + 1) * (N + 1));
for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) HF[j * (N + 1) + i] = hRaw(i * D, j * D);
export function H(u, v) {
  const x = clamp(u / D, 0, N - 1e-4), y = clamp(v / D, 0, N - 1e-4), i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
  const a = HF[j * (N + 1) + i], b = HF[j * (N + 1) + i + 1], c = HF[(j + 1) * (N + 1) + i], d = HF[(j + 1) * (N + 1) + i + 1];
  return lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
}
export const PT = (u, v, dz = 0) => P(u, v, H(u, v) + dz);

// ---- shading ----
const LV = (() => { const l = [-0.5, 0.55, 0.68], m = Math.hypot(...l); return l.map((x) => x / m); })();
const RAMP = [[0.0, "#dc9f4e"], [0.2, "#e4aa59"], [0.4, "#ebb665"], [0.6, "#f0c070"], [0.74, "#f4ca7b"], [0.84, "#f6d28a"], [0.93, "#f9de9c"], [1.0, "#fcead0"]];
function ramp(x) {
  x = clamp(x);
  for (let i = 1; i < RAMP.length; i++) if (x <= RAMP[i][0]) return mix(RAMP[i - 1][1], RAMP[i][1], (x - RAMP[i - 1][0]) / (RAMP[i][0] - RAMP[i - 1][0]));
  return RAMP[RAMP.length - 1][1];
}
const LEVELS = 30;
const lamOf = (n) => { const l = n[0] * LV[0] + n[1] * LV[1] + n[2] * LV[2]; return LV[2] + (l - LV[2]) * (l < LV[2] ? 1.25 : 1.0); };
const levelOf = (lam) => Math.round(clamp(lam) * LEVELS);
export const SAND = ramp(levelOf(LV[2]) / LEVELS);
const COLS = Array.from({ length: LEVELS + 1 }, (_, i) => ramp(i / LEVELS));
const normAt = (u, v) => { const e = 0.06, hx = (H(u + e, v) - H(u - e, v)) / (2 * e), hy = (H(u, v + e) - H(u, v - e)) / (2 * e), m = Math.hypot(hx, hy, 1); return [-hx / m, -hy / m, 1 / m]; };

let STRIPS = null, RIPPLES = null, CRESTS = null;
const strip = (u, v) => clamp(Math.floor((u + v) / D), 0, 2 * N - 1);
function build() {
  STRIPS = Array.from({ length: 2 * N }, () => new Map());
  const VL = new Float32Array((N + 1) * (N + 1));
  const hf = (i, j) => HF[clamp(j, 0, N) * (N + 1) + clamp(i, 0, N)];
  for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
    const hx = (hf(i + 1, j) - hf(i - 1, j)) / (D * ((i > 0 && i < N) ? 2 : 1)), hy = (hf(i, j + 1) - hf(i, j - 1)) / (D * ((j > 0 && j < N) ? 2 : 1)), m = Math.hypot(hx, hy, 1);
    VL[j * (N + 1) + i] = lamOf([-hx / m, -hy / m, 1 / m]);
  }
  const v3 = (i, j) => [i * D, j * D, HF[j * (N + 1) + i], VL[j * (N + 1) + i]];
  const add = (s, tri) => {
    const a = tri, e1 = [a[1][0] - a[0][0], a[1][1] - a[0][1], a[1][2] - a[0][2]], e2 = [a[2][0] - a[0][0], a[2][1] - a[0][1], a[2][2] - a[0][2]];
    let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    if (n[2] < 0) n = n.map((x) => -x);
    const m = Math.hypot(...n); n = n.map((x) => x / m);
    const hAvg = (a[0][2] + a[1][2] + a[2][2]) / 3;
    const lam = (a[0][3] + a[1][3] + a[2][3]) / 3 * 0.65 + lamOf(n) * 0.35;
    const lvl = clamp(levelOf(lam + hAvg * 0.012), 0, LEVELS);
    const pts = a.map((p) => P(p[0], p[1], p[2]));
    const cx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3, cy = (pts[0][1] + pts[1][1] + pts[2][1]) / 3;
    let path = STRIPS[s].get(lvl); if (!path) { path = new Path2D(); STRIPS[s].set(lvl, path); }
    pts.forEach(([x, y], q) => { const dx = x - cx, dy = y - cy, l = Math.hypot(dx, dy) || 1, ex = x + (dx / l) * 0.45, ey = y + (dy / l) * 0.45; q ? path.lineTo(ex, ey) : path.moveTo(ex, ey); });
    path.closePath();
  };
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const A = v3(i, j), B = v3(i + 1, j), C = v3(i, j + 1), Dd = v3(i + 1, j + 1), eps = 0.03;
    if (A[2] > eps || B[2] > eps || C[2] > eps) add(i + j, [A, B, C]);
    if (B[2] > eps || Dd[2] > eps || C[2] > eps) add(i + j + 1, [B, Dd, C]);
  }
  RIPPLES = Array.from({ length: 2 * N }, () => new Path2D());
  CRESTS = Array.from({ length: 2 * N }, () => new Path2D());
  const seg = (u0, v0, u1, v1, arr) => { const s = strip((u0 + u1) / 2, (v0 + v1) / 2); arr[s].moveTo(...PT(u0, v0, 0.005)); arr[s].lineTo(...PT(u1, v1, 0.005)); };
  const R = rng(77);
  // wind ripples: family A runs along v (left/back), family B along u (right)
  for (let c = 0; c < 10; c += 0.12) {
    const ph = R() * 6.28, amp = 0.05 + R() * 0.05;
    let prev = null;
    for (let v = 0; v <= 10.001; v += 0.07) {
      const u = c + amp * Math.sin(v * 1.6 + ph) + 0.03 * Math.sin(v * 4.7 + ph * 2), w = clamp((5.5 - u) / 2.5);
      const ok = u > 0.3 && u < 9.7 && v > 0.3 && v < 9.7 && H(u, v) > 0.1 && w > 0 && (() => { const n = normAt(u, v); return lamOf(n) > 0.62 && n[2] > 0.55; })() && R() < 0.93 * w + 0.07;
      if (ok && prev) seg(prev[0], prev[1], u, v, RIPPLES);
      prev = ok ? [u, v] : null;
    }
  }
  for (let c = 0; c < 6; c += 0.12) {
    const ph = R() * 6.28, amp = 0.05 + R() * 0.05;
    let prev = null;
    for (let u = 0; u <= 10.001; u += 0.07) {
      const v = c + amp * Math.sin(u * 1.5 + ph) + 0.03 * Math.sin(u * 4.3 + ph * 2), w = clamp((u - 4.2) / 1.5);
      const ok = u > 0.3 && u < 9.7 && v > 0.3 && v < 9.7 && H(u, v) > 0.1 && w > 0 && (() => { const n = normAt(u, v); return lamOf(n) > 0.5 && n[2] > 0.5; })() && R() < 0.93 * w + 0.07;
      if (ok && prev) seg(prev[0], prev[1], u, v, RIPPLES);
      prev = ok ? [u, v] : null;
    }
  }
  // crest lines where the ridge is the visible surface
  for (const r of RIDGES) for (const s of r.segs) {
    const n = Math.max(2, Math.ceil(s.L / 0.06));
    let prev = null;
    for (let i = 0; i <= n; i++) {
      const f = i / n, u = s.a[0] + s.du * f, v = s.a[1] + s.dv * f;
      const ok = H(u, v) > 0.35 && ridgeH(r, u, v) * mask(u, v) * 0.75 >= H(u, v) - 0.05;
      if (ok && prev) { const sI = strip((u + prev[0]) / 2, (v + prev[1]) / 2); CRESTS[sI].moveTo(...P(prev[0], prev[1], H(prev[0], prev[1]) + 0.01)); CRESTS[sI].lineTo(...P(u, v, H(u, v) + 0.01)); }
      prev = ok ? [u, v] : null;
    }
  }
}

// Standard slab + flat sand first; then queues the dune strips so props interleave by depth.
export function terrain(k) {
  if (!STRIPS) build();
  const c = k.ctx;
  k.slab(SAND, { side: "#e8c892" });
  { // gentle warm/cool variation over the flat sand, clipped to the footprint
    c.save(); c.beginPath(); [P(0, 0), P(10, 0), P(10, 10), P(0, 10)].forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.clip();
    const g = c.createLinearGradient(...P(10, 0), ...P(0, 10)); g.addColorStop(0, "rgba(255,240,200,0.0)"); g.addColorStop(0.6, "rgba(255,236,190,0.12)"); g.addColorStop(1, "rgba(190,120,60,0.10)");
    c.fillStyle = g; c.fill(); c.restore();
  }
  for (let s = 0; s < 2 * N; s++) {
    const m = STRIPS[s];
    if (!m.size) continue;
    k.q((s + 0.5) * D, () => {
      for (const [lvl, path] of m) { c.fillStyle = COLS[lvl]; c.fill(path); }
      c.strokeStyle = "rgba(160,96,40,0.42)"; c.lineWidth = 0.85; c.stroke(RIPPLES[s]);
      c.strokeStyle = "rgba(120,70,30,0.5)"; c.lineWidth = 1.1; c.lineCap = "round"; c.stroke(CRESTS[s]);
    });
  }
}
