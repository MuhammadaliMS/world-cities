// SHANGHAI 1,0 grid pass: everything through P(u,v,z). Axis-aligned barrel-vault terminal (axis along u), elevated
// guideway along u that enters the hall through a portal, T-piers, stone end block, maglev train. Pure function of t.
import { P, CTS, INK, shade, lerp, clamp, rng } from "./_props.js";
export { willow } from "./_props.js";

export const H = { u0: 0.7, u1: 5.6, v0: 2.0, v1: 4.8, vc: 3.4, hw: 1.4, wall: 1.5, rise: 3.1 };
export const zArc = (v) => { const s = (v - H.vc) / H.hw; return H.wall + H.rise * Math.sqrt(Math.max(0, 1 - s * s)); };
export const BEAM = { v0: 3.05, v1: 3.75, z0: 2.0, z1: 2.5 };
export const SHED = { u0: 7.9, u1: 8.65, v0: 2.8, v1: 4.0, h: 3.7 };
const TR = { v0: 3.12, v1: 3.68, z0: 2.55, z1: 3.35 };
export const STONE = "#d9d1c0";
const WOB = { wobble: 0 };

// ---------------------------------------------------------------- guideway
export function beam(k, ua, ub) {
  const { v0, v1, z0, z1 } = BEAM;
  k.box(ua, v0, z0, ub - ua, v1 - v0, z1 - z0, STONE, { shadow: false, hatch: false });
  k.line3([[ua, v1, z0 + 0.17], [ub, v1, z0 + 0.17]], { stroke: "#a29a86", lw: 1.1, ...WOB });
  k.line3([[ua, 3.28, z1], [ub, 3.28, z1]], { stroke: "#8a8576", lw: 1.2, ...WOB });
  k.line3([[ua, 3.52, z1], [ub, 3.52, z1]], { stroke: "#8a8576", lw: 1.2, ...WOB });
}
export function tpier(k, u, h = BEAM.z0) {
  const col = "#d4ccba", cl = shade(col, -0.07), cr = shade(col, -0.2), ct = shade(col, 0.06);
  k.shadow([[u + 0.18, 3.22, 0], [u + 0.75, 3.42, 0], [u + 0.75, 3.82, 0], [u + 0.18, 3.58, 0]], 0.1);
  k.box(u - 0.18, 3.22, 0, 0.36, 0.36, 1.3, col, { shadow: false, hatch: false, noTop: true });
  k.poly([[u + 0.18, 3.22, 1.3], [u + 0.18, 3.58, 1.3], [u + 0.2, 3.98, h], [u + 0.2, 2.82, h]], cr);
  k.poly([[u - 0.18, 3.58, 1.3], [u + 0.18, 3.58, 1.3], [u + 0.2, 3.98, h], [u - 0.2, 3.98, h]], cl);
  k.poly([[u - 0.2, 2.82, h], [u + 0.2, 2.82, h], [u + 0.2, 3.98, h], [u - 0.2, 3.98, h]], ct);
}

// stone terminus block the train slides into (its open face looks away from the camera)
export function shed(k, t) {
  const { u0, u1, v0, v1, h } = SHED, W = u1 - u0, D = v1 - v0;
  k.box(u0, v0, 0, W, D, h, "#cbc3b2", { shadow: true, hatch: false });
  // slit windows on the left face (v1) and the right face (u1)
  for (let i = 0; i < 4; i++) {
    const a = u0 + 0.08 + i * 0.14;
    k.poly([[a, v1, 0.5], [a + 0.07, v1, 0.5], [a + 0.07, v1, 3.2], [a, v1, 3.2]], "#6d8fa3", { lw: 1, ...WOB });
  }
  for (let i = 0; i < 5; i++) {
    const a = v0 + 0.08 + i * 0.2;
    k.poly([[u1, a, 0.5], [u1, a + 0.1, 0.5], [u1, a + 0.1, 3.2], [u1, a, 3.2]], "#587a8e", { lw: 1, ...WOB });
  }
  // blue signal band + sign
  k.poly([[u0, v1, 3.45], [u1, v1, 3.45], [u1, v1, 3.8], [u0, v1, 3.8]], "#2a5fc4", { lw: 1, ...WOB });
  k.poly([[u1, v0, 3.45], [u1, v1, 3.45], [u1, v1, 3.8], [u1, v0, 3.8]], "#1f4a9e", { lw: 1, ...WOB });
  k.line3([[u0, v1, 3.12], [u1, v1, 3.12]], { stroke: "#9d957f", lw: 1.1, ...WOB });
  k.box(u0 - 0.08, v0 - 0.08, h, W + 0.16, D + 0.16, 0.14, "#e8e2d4", { shadow: false, hatch: false });
  // blinking signal on top
  const [x, y] = P((u0 + u1) / 2, (v0 + v1) / 2, h + 0.14);
  const on = Math.sin(t * 3.2) > 0;
  k.ctx.fillStyle = on ? "#ff5a4a" : "#6e2a24"; k.ctx.strokeStyle = INK; k.ctx.lineWidth = 1;
  k.ctx.beginPath(); k.ctx.arc(x, y - 5, 3.2, 0, 7); k.ctx.fill(); k.ctx.stroke();
}

// ---------------------------------------------------------------- train
const FRONT0 = 5.0, FRONT1 = 8.5, PERIOD = 14;
export const trainFront = (t) => lerp(FRONT0, FRONT1, 0.5 + 0.5 * Math.sin((2 * Math.PI * t) / PERIOD));
const CARS = 4, CAR_L = 0.6, GAP = 0.05, NOSE = 0.45;

// one train box segment [A,B] cut from the car [a,b]
function seg(k, A, B, endFace, z0 = TR.z0, z1 = TR.z1, vl = TR.v0, vr = TR.v1) {
  const lc = "#f2f5f8", tc = "#ffffff", rc = "#c9d1d8";
  k.poly([[A, vl, z1], [B, vl, z1], [B, vr, z1], [A, vr, z1]], tc, { lw: 1.2, ...WOB });
  k.poly([[A, vr, z0], [B, vr, z0], [B, vr, z1], [A, vr, z1]], lc, { lw: 1.3, ...WOB });
  if (endFace) k.poly([[B, vl, z0], [B, vr, z0], [B, vr, z1], [B, vl, z1]], rc, { lw: 1.2, ...WOB });
  // skirt + blue stripe
  k.poly([[A, vr, z0], [B, vr, z0], [B, vr, z0 + 0.13], [A, vr, z0 + 0.13]], "#76828c", { stroke: false });
  k.poly([[A, vr, z0 + 0.25], [B, vr, z0 + 0.25], [B, vr, z0 + 0.33], [A, vr, z0 + 0.33]], "#2a5fc4", { stroke: false });
}
function windowsOn(k, a, b, lo, hi, n, off = 0.06) {
  const w = (b - a - off * 2) / n;
  for (let i = 0; i < n; i++) {
    const wa = a + off + i * w + w * 0.15, wb = wa + w * 0.7;
    if (wa < lo || wb > hi) continue;
    k.poly([[wa, TR.v1, TR.z0 + 0.42], [wb, TR.v1, TR.z0 + 0.42], [wb, TR.v1, TR.z0 + 0.66], [wa, TR.v1, TR.z0 + 0.66]], "#3a587a", { lw: 0.9, ...WOB });
  }
}
// lo/hi: only the part of the train with lo <= u <= hi is drawn (cars cut exactly, noses by their middle)
export function drawTrain(k, t, lo = -1e9, hi = 1e9) {
  const uf = trainFront(t);
  const { z0, z1, v0, v1 } = TR, T = 0.14, zt = z0 + 0.4;
  // front nose (+u)
  {
    const a = uf - NOSE, b = uf;
    if ((a + b) / 2 >= lo && (a + b) / 2 <= hi) {
      k.poly([[a, v0, z1], [a, v1, z1], [b, v1 - T, zt], [b, v0 + T, zt]], "#ffffff", { lw: 1.2, ...WOB });
      k.poly([[a, v1, z0], [b, v1 - T, z0 + 0.05], [b, v1 - T, zt], [a, v1, z1]], "#f2f5f8", { lw: 1.3, ...WOB });
      k.poly([[b, v0 + T, z0 + 0.05], [b, v1 - T, z0 + 0.05], [b, v1 - T, zt], [b, v0 + T, zt]], "#c9d1d8", { lw: 1.2, ...WOB });
      // windscreen on the slope
      k.poly([[a + 0.09, v0 + 0.07, z1 - 0.02], [a + 0.09, v1 - 0.07, z1 - 0.02], [b - 0.07, v1 - T - 0.03, zt + 0.02], [b - 0.07, v0 + T + 0.03, zt + 0.02]], "#2f4a68", { lw: 1, ...WOB });
      k.poly([[a, v1, z0 + 0.25], [b, v1 - T, z0 + 0.27], [b, v1 - T, z0 + 0.33], [a, v1, z0 + 0.33]], "#2a5fc4", { stroke: false });
      k.poly([[a + 0.09, v1, z0 + 0.42], [a + 0.24, v1, z0 + 0.42], [a + 0.24, v1, z0 + 0.64], [a + 0.09, v1, z0 + 0.64]], "#3a587a", { lw: 0.9, ...WOB });
    }
  }
  for (let i = 0; i < CARS; i++) {
    const b = uf - NOSE - i * (CAR_L + GAP), a = b - CAR_L;
    const A = Math.max(a, lo), B = Math.min(b, hi);
    if (B - A < 0.004) continue;
    seg(k, A, B, B >= b - 1e-6 && hi >= b);
    windowsOn(k, a, b, lo, hi, 5);
    // coupling shadow
    if (i > 0 && b + GAP / 2 >= lo && b + GAP / 2 <= hi) k.poly([[b, v0, z0 + 0.05], [b + GAP, v0, z0 + 0.05], [b + GAP, v1, z0 + 0.05], [b, v1, z0 + 0.05]], "#4a525a", { stroke: false });
  }
  // tail nose (-u), tapering away
  {
    const b = uf - NOSE - (CARS - 1) * (CAR_L + GAP) - CAR_L - GAP, a = b - NOSE;
    if ((a + b) / 2 >= lo && (a + b) / 2 <= hi) {
      k.poly([[a, v0 + T, zt], [b, v0, z1], [b, v1, z1], [a, v1 - T, zt]], "#ffffff", { lw: 1.2, ...WOB });
      k.poly([[a, v1 - T, z0 + 0.05], [b, v1, z0], [b, v1, z1], [a, v1 - T, zt]], "#f2f5f8", { lw: 1.3, ...WOB });
      k.poly([[a + 0.02, v0 + T + 0.03, zt + 0.02], [a + 0.02, v1 - T - 0.03, zt + 0.02], [b - 0.09, v1 - 0.07, z1 - 0.02], [b - 0.09, v0 + 0.07, z1 - 0.02]], "#2f4a68", { lw: 1, ...WOB });
      k.poly([[a, v1 - T, z0 + 0.27], [b, v1, z0 + 0.25], [b, v1, z0 + 0.33], [a, v1 - T, z0 + 0.33]], "#2a5fc4", { stroke: false });
    }
  }
}

// ---------------------------------------------------------------- terminal hall
const archPts = (u, steps = 24) => { const o = []; for (let i = 0; i <= steps; i++) { const v = H.v0 + ((H.v1 - H.v0) * i) / steps; o.push([u, v, zArc(v)]); } return o; };

export function hallInterior(k) {
  const { u0, u1, v0, v1, wall } = H;
  k.poly([[u0, v0, 0.04], [u1, v0, 0.04], [u1, v1, 0.04], [u0, v1, 0.04]], "#d3d6d6", { lw: 1, ...WOB });
  k.poly([[u0, v0, 0], ...archPts(u0), [u0, v1, 0]], "#c6dfe8", { lw: 1, ...WOB });
  for (let v = v0 + 0.35; v < v1; v += 0.4) k.line3([[u0, v, 0.04], [u0, v, zArc(v)]], { stroke: "rgba(255,255,255,0.7)", lw: 1, ...WOB });
  k.poly([[u0, v0, 0], [u1, v0, 0], [u1, v0, wall], [u0, v0, wall]], "#b7d2dc", { lw: 1, ...WOB });
  // platform edge band along the guideway
  k.poly([[u0, 3.9, 0.05], [u1, 3.9, 0.05], [u1, 3.96, 0.05], [u0, 3.96, 0.05]], "#e8c34a", { stroke: false });
}

export function hallRoof(k, t) {
  const { u0, u1, vc, hw } = H, c = k.ctx, N = 30, strips = [];
  for (let i = 0; i < N; i++) {
    const sa = -1 + (2 * i) / N, sb = -1 + (2 * (i + 1)) / N;
    if ((sa + sb) / 2 < -0.48) continue; // strips facing away from the camera
    const va = vc + sa * hw, vb = vc + sb * hw;
    strips.push([va, zArc(va), vb, zArc(vb), (sa + sb) / 2, i]);
  }
  c.save(); c.globalAlpha = 0.82;
  for (const [va, za, vb, zb, sm, i] of strips) {
    const col = shade(i % 2 ? "#a9d3e6" : "#b6dbe9", 0.07 - 0.17 * Math.abs(sm) * Math.abs(sm) - (sm > 0 ? 0.03 : 0));
    k.poly([[u0, va, za], [u1, va, za], [u1, vb, zb], [u0, vb, zb]], col, { stroke: false });
  }
  c.globalAlpha = 1;
  // moving sheen, clipped to the roof
  c.save(); c.beginPath();
  for (const [va, za, vb, zb] of strips) { const q = [[u0, va, za], [u1, va, za], [u1, vb, zb], [u0, vb, zb]].map((p) => P(...p)); c.moveTo(...q[0]); q.slice(1).forEach((p) => c.lineTo(...p)); c.closePath(); }
  c.clip();
  const g = c.createLinearGradient(...P(u0, vc, 3.5), ...P(u1, vc, 3.5)), f = ((t * 0.09) % 1.5) - 0.25;
  g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(clamp(f - 0.1), "rgba(255,255,255,0)"); g.addColorStop(clamp(f), "rgba(255,255,255,0.5)"); g.addColorStop(clamp(f + 0.1), "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = g; c.fillRect(0, 0, CTS.W, CTS.H);
  c.restore();
  // bars: longitudinal + arch ribs
  for (let i = 0; i <= N; i += 2) {
    const s = -1 + (2 * i) / N; if (s < -0.48) continue;
    const v = vc + s * hw, z = zArc(v);
    k.line3([[u0, v, z], [u1, v, z]], { stroke: "rgba(255,255,255,0.7)", lw: 0.9, ...WOB });
  }
  const ribs = [];
  for (let u = u0; u <= u1 + 1e-6; u += 0.7) ribs.push(Math.min(u, u1));
  for (const u of ribs) {
    const pts = []; for (let i = 0; i <= N; i++) { const s = -1 + (2 * i) / N; if (s < -0.48) continue; const v = vc + s * hw; pts.push([u, v, zArc(v)]); }
    k.line3(pts, { stroke: "#68808c", lw: 2.0, ...WOB }); k.line3(pts, { stroke: "#eaf2f5", lw: 0.9, ...WOB });
  }
  // crown ridge line + outline of the vault
  k.line3([[u0, vc, zArc(vc)], [u1, vc, zArc(vc)]], { stroke: INK, lw: 1.3, ...WOB });
  c.restore();
}

export function hallLeft(k) {
  const { u0, u1, v1, wall } = H, c = k.ctx;
  c.save(); c.globalAlpha = 0.5; k.poly([[u0, v1, 0], [u1, v1, 0], [u1, v1, wall], [u0, v1, wall]], "#9fcfe0", { stroke: false }); c.restore();
  for (let u = u0; u <= u1 + 1e-6; u += 0.49) k.line3([[u, v1, 0], [u, v1, wall]], { stroke: "#e6eff3", lw: 1.3, ...WOB });
  k.line3([[u0, v1, 0.78], [u1, v1, 0.78]], { stroke: "#e6eff3", lw: 1.2, ...WOB });
  k.poly([[u0, v1, 0], [u1, v1, 0], [u1, v1, 0.1], [u0, v1, 0.1]], "#8d9aa2", { lw: 1, ...WOB });
  k.poly([[u0, v1, wall - 0.1], [u1, v1, wall - 0.1], [u1, v1, wall], [u0, v1, wall]], "#e8eef2", { lw: 1.2, ...WOB });
  k.poly([[u0, v1, 0], [u1, v1, 0], [u1, v1, wall], [u0, v1, wall]], null, { lw: 1.5, ...WOB });
}

// entrance doors, canopy and the blade sign (all on / over the left face)
export function hallDoors(k, t) {
  const { v1 } = H, c = k.ctx, ua = 2.55, ub = 3.75;
  k.poly([[ua, v1, 0.1], [ub, v1, 0.1], [ub, v1, 1.35], [ua, v1, 1.35]], "#6a95aa", { lw: 1.3, ...WOB });
  for (let i = 1; i < 4; i++) { const u = lerp(ua, ub, i / 4); k.line3([[u, v1, 0.1], [u, v1, 1.35]], { stroke: i === 2 ? INK : "#dfeaf0", lw: i === 2 ? 1.4 : 1.1, ...WOB }); }
  // sliding door leaves breathing open and shut
  const open = 0.5 + 0.5 * Math.sin(t * 0.9), g = 0.12 * open;
  k.poly([[3.15 - g, v1 + 0.01, 0.1], [3.15 + 0.0, v1 + 0.01, 0.1], [3.15 + 0.0, v1 + 0.01, 1.25], [3.15 - g, v1 + 0.01, 1.25]], "rgba(255,255,255,0.35)", { stroke: false });
  // canopy
  k.box(2.2, v1, 1.45, 1.9, 0.55, 0.3, "#e9edf0", { shadow: false, hatch: false });
  k.box(2.25, v1 + 0.5, 0, 0.07, 0.07, 1.45, "#9aa5ad", { shadow: false, hatch: false });
  k.box(3.95, v1 + 0.5, 0, 0.07, 0.07, 1.45, "#9aa5ad", { shadow: false, hatch: false });
  // blade sign on the roof edge
  k.box(2.3, v1 - 0.06, 1.95, 1.7, 0.1, 0.42, "#f6f1e6", { shadow: false, hatch: false });
  const [x, y] = P(2.3, v1 + 0.04, 1.95);
  c.save(); c.translate(x, y - 3); c.transform(1, CTS.YS, 0, 1, 0, 0);
  c.font = "bold 11px 'Helvetica Neue', Arial, sans-serif"; c.fillStyle = "#1f4a9e"; c.textBaseline = "alphabetic";
  c.fillText("MAGLEV 磁浮", 5, -8);
  c.restore();
}

export function hallEnd(k) {
  const { u1, v0, v1 } = H, c = k.ctx;
  const outline = [[u1, v0, 0], ...archPts(u1), [u1, v1, 0]].map((p) => P(...p));
  const hole = []; { const a = 2.9, b = 3.9, zb = 1.75, zs = 3.3, rise = 0.7;
    hole.push([u1, a, zb], [u1, a, zs]); for (let i = 1; i < 12; i++) { const s = -1 + (2 * i) / 12; hole.push([u1, (a + b) / 2 + (s * (b - a)) / 2, zs + rise * Math.sqrt(1 - s * s)]); } hole.push([u1, b, zs], [u1, b, zb]); }
  const holeP = hole.map((p) => P(...p));
  c.save();
  const pathFn = () => { c.beginPath(); outline.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); holeP.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); };
  pathFn(); c.fillStyle = "rgba(118,176,200,0.66)"; c.fill("evenodd");
  c.save(); pathFn(); c.clip("evenodd");
  for (let v = v0 + 0.3; v < v1; v += 0.35) { c.beginPath(); c.moveTo(...P(u1, v, 0)); c.lineTo(...P(u1, v, 4.7)); c.strokeStyle = "rgba(230,240,245,0.85)"; c.lineWidth = 1.2; c.stroke(); }
  for (const z of [0.8, 1.6, 2.4, 3.2, 4.0]) { c.beginPath(); c.moveTo(...P(u1, v0, z)); c.lineTo(...P(u1, v1, z)); c.strokeStyle = "rgba(230,240,245,0.8)"; c.lineWidth = 1.2; c.stroke(); }
  c.restore();
  pathFn(); c.strokeStyle = INK; c.lineWidth = 1.6; c.lineJoin = "round"; c.stroke();
  // steel frame round the portal
  c.beginPath(); holeP.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.strokeStyle = INK; c.lineWidth = 4.4; c.stroke(); c.strokeStyle = "#c3ced5"; c.lineWidth = 2.6; c.stroke();
  // arch edge beam
  c.beginPath(); archPts(u1).forEach((p, i) => { const q = P(...p); i ? c.lineTo(...q) : c.moveTo(...q); }); c.strokeStyle = INK; c.lineWidth = 4.6; c.stroke(); c.strokeStyle = "#dbe5ea"; c.lineWidth = 2.6; c.stroke();
  c.restore();
}

// ---------------------------------------------------------------- little extras
export function suitcase(k, st, col) {
  if (!st.moving) return;
  const c = k.ctx, L = Math.hypot(st.du, st.dv) || 1;
  const bu = st.u - (st.du / L) * 0.36 - (st.dv / L) * 0.1, bv = st.v - (st.dv / L) * 0.36 + (st.du / L) * 0.1;
  const [x, y] = P(bu, bv, 0);
  c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.rect(x - 4.5, y - 13, 9, 13); c.fill(); c.stroke();
  const [hx, hy] = P(st.u - (st.du / L) * 0.06, st.v - (st.dv / L) * 0.06, 0.4);
  c.beginPath(); c.moveTo(x, y - 13); c.lineTo(hx, hy); c.stroke();
}
export function duck(k, u, v, dir, t, seed) {
  const c = k.ctx, [x, y] = P(u, v, 0), s = dir >= 0 ? 1 : -1, bob = Math.sin(t * 2 + seed) * 0.6;
  c.strokeStyle = "rgba(255,255,255,0.7)"; c.lineWidth = 1.1;
  c.beginPath(); c.moveTo(x - s * 7, y + 2); c.lineTo(x - s * 16, y + 4); c.moveTo(x - s * 6, y + 3.5); c.lineTo(x - s * 13, y + 7); c.stroke();
  c.fillStyle = seed % 2 ? "#f4f0e4" : "#8a6a3c"; c.strokeStyle = INK; c.lineWidth = 1;
  c.beginPath(); c.ellipse(x, y - 2 + bob, 6, 3.4, 0, 0, 7); c.fill(); c.stroke();
  c.fillStyle = "#2f7a52"; c.beginPath(); c.arc(x + s * 5, y - 6 + bob, 2.6, 0, 7); c.fill(); c.stroke();
  c.fillStyle = "#f0b030"; c.beginPath(); c.moveTo(x + s * 7.4, y - 6 + bob); c.lineTo(x + s * 10.4, y - 5.2 + bob); c.lineTo(x + s * 7.4, y - 4.4 + bob); c.closePath(); c.fill();
}
