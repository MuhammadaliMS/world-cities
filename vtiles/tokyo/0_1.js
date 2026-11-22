// TOKYO · Ueno Park & Swan Pond (grid pass). Everything is laid out in (u,v) inside 0.45..9.55.
// Pond fills the centre (u,v 1.8..8.2). Bentendo hall = regular octagon (sides along u and v) on an island at (4.05,4.0),
// red arched bridge runs along u at v=4.0 from the island steps to the east bank. Sand path ring round the pond,
// stone lanterns on its outer edge, cherry trees along the lawn rim, four swan boats on closed loops.
import { P, INK, shade, lerp, clamp, rng, hash, chaikin, ribbon, offsetPoly, makeLoop, inPoly, distToPoly, ellUV,
  cherryAt, oakAt, willowAt, reedsAt, padAt, lotusAt, stoneAt, shrubAt, petalFall, swanAt, swanWake } from "./_g0_1.js";
import { PX, toro } from "./_props.js";

export const camera = { u: 4.4, v: 4.3, z: 0.9, zoom: 1.6 };

// ---------- layout ----------
const POND = chaikin([[2.9, 1.85], [5.0, 1.75], [7.0, 1.9], [8.05, 2.9], [8.2, 5.0], [8.05, 7.0], [7.1, 8.15], [5.0, 8.25], [3.0, 8.1], [1.9, 7.1], [1.75, 5.0], [1.9, 2.9]], 3, true);
const RING = offsetPoly(POND, 0.62);
const LOOP = makeLoop(RING);
const PATH_W = 0.74;
const HC = [4.05, 4.0];
const ISL = ellUV(HC[0], HC[1], 1.75, 1.5, 30, 0.04, 7);
const ISL_RIM = ellUV(HC[0], HC[1], 1.86, 1.6, 30, 0.04, 7);
// outward side of the ring: pick the sign of the lane offset that moves away from the pond centre
const OUT = (() => { const a = LOOP.at(0, 0.3), b = LOOP.at(0, -0.3); return Math.hypot(a[0] - 5, a[1] - 5) > Math.hypot(b[0] - 5, b[1] - 5) ? 1 : -1; })();

// swan boats: [centre u, centre v, radius u, radius v, angular speed, phase]
const BOATS = [[3.7, 6.75, 1.0, 0.55, 0.2, 0.0], [6.5, 6.8, 0.95, 0.5, -0.18, 2.0], [7.0, 2.95, 0.5, 0.3, 0.2, 4.0], [7.05, 5.1, 0.55, 0.28, -0.17, 1.0]];
const boatAt = (b, t) => { const [cu, cv, ru, rv, sp, ph] = b, a = t * sp + ph; return { u: cu + Math.cos(a) * ru, v: cv + Math.sin(a) * rv, du: -Math.sin(a) * ru * sp, dv: Math.cos(a) * rv * sp, sp: Math.abs(sp) }; };

// bridge
const BR = { u0: 5.6, u1: 8.3, v: 4.0, w: 0.58 };
const bz = (u) => 0.08 + 0.52 * Math.sin(Math.PI * clamp((u - BR.u0) / (BR.u1 - BR.u0)));

// lily pads: dense by the shore, none under the island, bridge or boat loops
const PADS = (() => {
  const R = rng(77), out = [];
  let tries = 0;
  while (out.length < 70 && tries++ < 6000) {
    const u = 1.9 + R() * 6.2, v = 1.9 + R() * 6.2;
    if (!inPoly(POND, u, v)) continue;
    const d = distToPoly(POND, u, v); if (d < 0.18) continue;
    if (Math.hypot((u - HC[0]) / 2.1, (v - HC[1]) / 1.85) < 1) continue;
    if (u > BR.u0 - 0.2 && Math.abs(v - BR.v) < 0.6) continue;
    if (BOATS.some(([cu, cv, ru, rv]) => Math.hypot((u - cu) / (ru + 0.75), (v - cv) / (rv + 0.6)) < 1)) continue;
    const pr = d < 0.4 ? 0.9 : d < 0.8 ? 0.4 : 0.1;
    if (R() > pr) continue;
    if (out.some((p) => Math.hypot(p.u - u, p.v - v) < 0.3)) continue;
    out.push({ u, v, r: 7 + R() * 5, rot: R() * 6.28, fl: R() < 0.4 ? (R() < 0.3 ? 2 : 1) : 0, ph: R() * 6.28, sz: 4 + R() * 2 });
  }
  return out;
})();
const STONES = (() => {
  const R = rng(31), out = [];
  for (let i = 0; i < POND.length; i++) {
    const a = POND[i], b = POND[(i + 1) % POND.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let s = R() * 0.2; s < L; s += 0.3 + R() * 0.2) { const f = s / L; out.push({ u: lerp(a[0], b[0], f), v: lerp(a[1], b[1], f), r: 4 + R() * 3, seed: out.length }); }
  }
  return out;
})();

// ---------------- Bentendo: regular octagon, sides along u and v, curved slate roof, gold finial ----------------
function hall(k, t) {
  const [cx, cy] = HC, c = k.ctx, A8 = Math.PI / 8;
  const V = (R, i) => [cx + R * Math.cos(A8 + (i * Math.PI) / 4), cy + R * Math.sin(A8 + (i * Math.PI) / 4)];
  const VIS = [7, 0, 1]; // faces seen by the camera: +u (right), diagonal, +v (left)
  const FS = { 7: -0.2, 0: -0.13, 1: -0.05 };
  const fpt = (R, i, s, z) => { const a = V(R, i), b = V(R, i + 1); return [lerp(a[0], b[0], s), lerp(a[1], b[1], s), z]; };
  const fq = (R, i, s0, s1, z0, z1) => [fpt(R, i, s0, z0), fpt(R, i, s1, z0), fpt(R, i, s1, z1), fpt(R, i, s0, z1)];
  const prism = (R, z0, z1, col, o = {}) => {
    for (const i of VIS) k.poly(fq(R, i, 0, 1, z0, z1), shade(col, FS[i]), { lw: 1, wobble: 0 });
    k.poly([0, 1, 2, 3, 4, 5, 6, 7].map((i) => [...V(R, i), z1]), shade(col, 0.1), { lw: 1, wobble: 0 });
  };
  k.ell(cx + 0.35, cy + 0.15, 0, 1.45, "rgba(60,45,30,0.14)", { stroke: false });
  prism(1.25, 0, 0.15, "#a79f8f");
  // steps up to the bridge (+u face)
  k.box(cx + 1.15, cy - 0.34, 0, 0.3, 0.68, 0.07, "#aaa292", { hatch: false, shadow: false });
  prism(1.12, 0.15, 0.3, "#b07a48");
  // walls with pillars between the panels
  const WZ0 = 0.3, WZ1 = 1.55, WR = 0.85;
  for (const i of VIS) {
    k.poly(fq(WR, i, 0, 1, WZ0, WZ1), shade(PX.red, FS[i] * 0.8), { lw: 1, wobble: 0 });
    if (i === 7) {
      k.poly(fq(WR, i, 0.24, 0.76, WZ0, 1.25), "#5a3a22", { lw: 1, wobble: 0 });
      const g = 0.7 + 0.3 * Math.sin(t * 3);
      k.poly(fq(WR, i, 0.28, 0.72, WZ0 + 0.04, 1.21), `rgba(255,196,110,${0.3 * g + 0.2})`, { stroke: false });
      k.line3([fpt(WR, i, 0.5, WZ0 + 0.04), fpt(WR, i, 0.5, 1.21)], { stroke: "rgba(240,205,150,0.85)", lw: 1, wobble: 0 });
      for (const zz of [0.6, 0.95]) for (const s of [0.43, 0.57]) { const [x, y] = P(...fpt(WR, i, s, zz)); k.circle(x, y, 1.3, PX.gold, { stroke: false }); }
    } else {
      k.poly(fq(WR, i, 0.18, 0.82, 0.55, 1.25), i === 1 ? "#3e6e50" : "#4a8260", { lw: 1, wobble: 0 });
      for (let m = 1; m < 4; m++) k.line3([fpt(WR, i, 0.18 + 0.64 * m / 4, 0.55), fpt(WR, i, 0.18 + 0.64 * m / 4, 1.25)], { stroke: "rgba(240,235,215,0.75)", lw: 0.8, wobble: 0 });
      for (let m = 1; m < 3; m++) k.line3([fpt(WR, i, 0.18, 0.55 + 0.23 * m), fpt(WR, i, 0.82, 0.55 + 0.23 * m)], { stroke: "rgba(240,235,215,0.75)", lw: 0.8, wobble: 0 });
    }
    k.poly(fq(WR, i, 0, 1, 1.4, 1.55), "#efe4c8", { lw: 0.8, wobble: 0 });
    k.line3([fpt(WR, i, 0, 1.33), fpt(WR, i, 1, 1.33)], { stroke: PX.gold, lw: 1.6, wobble: 0 });
  }
  for (const j of [6, 7, 0, 1, 2]) {
    const [u, v] = V(WR, j), [x0, y0] = P(u, v, WZ0), [x1, y1] = P(u, v, WZ1);
    c.lineCap = "butt"; c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = "#d94a30"; c.lineWidth = 4; c.stroke();
    c.fillStyle = PX.gold; c.fillRect(x1 - 3.6, y1 - 1, 7.2, 3); c.fillRect(x0 - 3.6, y0 - 4, 7.2, 3);
  }
  // deck railing on the three front faces (a gap at the steps)
  const RR = 1.02;
  for (const i of VIS) {
    for (let m = 0; m <= 6; m++) {
      const s = m / 6; if (i === 7 && s > 0.28 && s < 0.72) continue;
      const a = fpt(RR, i, s, 0.3), b = fpt(RR, i, s, 0.58), [x0, y0] = P(...a), [x1, y1] = P(...b);
      c.strokeStyle = INK; c.lineWidth = 3.2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = "#e0583a"; c.lineWidth = 1.7; c.stroke();
    }
    for (const z of [0.58, 0.4]) {
      const segs = i === 7 ? [[0, 0.28], [0.72, 1]] : [[0, 1]];
      for (const [s0, s1] of segs) k.line3([fpt(RR, i, s0, z), fpt(RR, i, s1, z)], { stroke: "#e9604a", lw: z > 0.5 ? 3.4 : 2.4, wobble: 0 });
    }
  }
  // roof: eave octagon with upswept corners, concave ridges up to the apex
  const ZE = 1.6, RE = 1.42, ZA = 2.85, LIFT = 0.17;
  const E = (i) => { const [x, y] = V(RE, i); return [x, y, ZE + LIFT]; };
  k.poly([0, 1, 2, 3, 4, 5, 6, 7].map((i) => [...V(RE, i), ZE - 0.02]), "#3a2a22", { lw: 1, wobble: 0 });
  const prof = (f, z0) => z0 + (ZA - z0) * Math.pow(1 - f, 1.9);
  const eaveZ = (s) => ZE + LIFT * (1 - Math.sin(Math.PI * s));
  const eavePt = (i, s) => { const a = V(RE, i), b = V(RE, i + 1); return [lerp(a[0], b[0], s), lerp(a[1], b[1], s)]; };
  const ridgePt = (i, f) => { const [x, y, z0] = E(i); return [lerp(cx, x, f), lerp(cy, y, f), prof(f, z0)]; };
  const RS = { 0: -0.06, 1: 0.05, 2: -0.1, 3: -0.16, 4: -0.2, 5: -0.16, 6: -0.1, 7: -0.2 };
  const order = [0, 1, 2, 3, 4, 5, 6, 7].sort((a, b) => { const m = (i) => { const [x, y] = eavePt(i, 0.5); return x + y; }; return m(a) - m(b); });
  for (const i of order) {
    const pts = [];
    for (let j = 0; j <= 6; j++) pts.push(ridgePt(i, j / 6));
    for (let j = 1; j <= 8; j++) { const s = j / 8, [x, y] = eavePt(i, s); pts.push([x, y, eaveZ(s)]); }
    for (let j = 5; j >= 0; j--) pts.push(ridgePt((i + 1) % 8, j / 6));
    k.poly(pts, shade("#7f8aa0", RS[i]), { lw: 1.3, wobble: 0 });
    const sl = "rgba(18,24,36,0.34)";
    for (let m = 1; m < 9; m++) { const s = m / 9, [x, y] = eavePt(i, s), ez = eaveZ(s), L = []; for (let j = 0; j <= 8; j++) { const f = j / 8; L.push([lerp(cx, x, f), lerp(cy, y, f), prof(f, ez)]); } k.line3(L, { stroke: sl, lw: 0.8, wobble: 0 }); }
    for (let m = 1; m < 6; m++) { const f = m / 6, L = []; for (let j = 0; j <= 8; j++) { const s = j / 8, [x, y] = eavePt(i, s), ez = eaveZ(s); L.push([lerp(cx, x, f), lerp(cy, y, f), prof(f, ez)]); } k.line3(L, { stroke: "rgba(18,24,36,0.24)", lw: 0.7, wobble: 0 }); }
    { const f = 0.62, L = []; for (let j = 0; j <= 8; j++) { const s = j / 8, [x, y] = eavePt(i, s), ez = eaveZ(s); L.push([lerp(cx, x, f), lerp(cy, y, f), prof(f, ez)]); } k.line3(L, { stroke: "rgba(235,200,120,0.85)", lw: 1.5, wobble: 0 }); }
    const eave = []; for (let j = 0; j <= 8; j++) { const s = j / 8, [x, y] = eavePt(i, s); eave.push([x, y, eaveZ(s) - 0.02]); }
    k.line3(eave, { stroke: PX.red, lw: 2.6, wobble: 0 });
    if (RS[i] > -0.15 || i === 6) for (let m = 0; m < 5; m++) { const s = m / 5 + 0.06, [x, y] = eavePt(i, s), [px, py] = P(x, y, eaveZ(s) - 0.05); k.circle(px, py, 1.2, PX.gold, { stroke: false }); }
    const [ex, ey] = P(...E(i)); k.circle(ex, ey - 1, 2.5, PX.gold, { lw: 0.8 });
  }
  // gold cap and finial
  k.cyl(cx, cy, ZA - 0.02, 0.2, 0.16, PX.gold);
  const [fx, fy] = P(cx, cy, ZA + 0.34);
  c.fillStyle = PX.gold; c.beginPath(); c.arc(fx, fy, 6, 0, 6.3); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke();
  c.fillStyle = "#fff0b0"; c.beginPath(); c.arc(fx - 2, fy - 2, 1.7, 0, 6.3); c.fill();
  const [px0, py0] = P(cx, cy, ZA + 0.45), [, py1] = P(cx, cy, ZA + 1.0);
  c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.moveTo(px0, py0); c.lineTo(px0, py1); c.stroke(); c.strokeStyle = PX.gold; c.lineWidth = 1.7; c.stroke();
  for (let i = 0; i < 4; i++) { c.fillStyle = PX.gold; c.beginPath(); c.ellipse(px0, py0 - 4 - i * 6, 4 - i * 0.7, 1.6, 0, 0, 6.3); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.7; c.stroke(); }
}

// ---------------- red arched bridge along u (v = 4.0) ----------------
function bridge(k, t) {
  const c = k.ctx, N = 20, vA = BR.v - BR.w / 2, vB = BR.v + BR.w / 2;
  const us = (i) => lerp(BR.u0, BR.u1, i / N);
  // piers in the water
  for (const f of [0.22, 0.4, 0.6, 0.78]) for (const v of [vA + 0.04, vB - 0.04]) { const u = lerp(BR.u0, BR.u1, f), [x0, y0] = P(u, v, 0), [x1, y1] = P(u, v, bz(u) - 0.1); c.lineCap = "butt"; c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = "#a63a2a"; c.lineWidth = 3.6; c.stroke(); }
  const railAt = (v, back) => {
    for (let i = 0; i <= 10; i++) { const u = lerp(BR.u0 + 0.04, BR.u1 - 0.04, i / 10), z = bz(u), [x0, y0] = P(u, v, z), [x1, y1] = P(u, v, z + 0.34); c.strokeStyle = INK; c.lineWidth = 3.2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = "#e0583a"; c.lineWidth = 1.7; c.stroke(); }
    for (const [h, w] of [[0.34, 4], [0.17, 2.6]]) { const L = []; for (let i = 0; i <= 28; i++) { const u = lerp(BR.u0 + 0.04, BR.u1 - 0.04, i / 28); L.push([u, v, bz(u) + h]); } k.line3(L, { stroke: "#ea6a50", lw: w, wobble: 0 }); }
    for (let i = 0; i <= 5; i++) { const u = lerp(BR.u0 + 0.04, BR.u1 - 0.04, i / 5), [x, y] = P(u, v, bz(u) + 0.37); c.fillStyle = PX.gold; c.beginPath(); c.arc(x, y - 1, 2.2, 0, 6.3); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.7; c.stroke(); }
  };
  railAt(vA, true);
  // deck planks (top) and the red fascia on the +v side
  for (let i = 0; i < N; i++) {
    const u0 = us(i), u1 = us(i + 1), z0 = bz(u0), z1 = bz(u1);
    k.poly([[u0, vB, z0 - 0.16], [u1, vB, z1 - 0.16], [u1, vB, z1], [u0, vB, z0]], "#b8392a", { lw: 0.9, wobble: 0 });
    k.poly([[u0, vA, z0], [u1, vA, z1], [u1, vB, z1], [u0, vB, z0]], i % 2 ? "#b9863f" : "#c0903f", { lw: 0.8, wobble: 0 });
  }
  // people cross at arch height
  const walk = (path, o) => { const s = k.walkerState(path, o); k.person(s.u, s.v, { ...o, pose: s.moving ? "walk" : "stand", p: s.p, dir: [s.du, s.dv], z: bz(s.u), h: 1.05 }); };
  const cross = (v0, o) => walk([[BR.u0 + 0.35, v0], [BR.u1 - 0.3, v0]], o);
  cross(BR.v - 0.1, { speed: 0.2, dwell: 2.2, seed: 301, style: "dress", top: "#e8a0a8", hairStyle: "long", offset: 0.0 });
  cross(BR.v + 0.14, { speed: 0.22, dwell: 2.2, seed: 302, style: "shirt", top: "#4a79b0", offset: 0.5 });
  railAt(vB, false);
}

const pl3 = (u0, v0, u1, v1, z = 0.02) => [[u0, v0, z], [u1, v0, z], [u1, v1, z], [u0, v1, z]];

export default function draw(k, t) {
  const c = k.ctx;
  // ---------- ground ----------
  k.groundTrace({ lawn: [[[0.45, 0.45], [9.55, 0.45], [9.55, 9.55], [0.45, 9.55]]], water: [] }, { lawn: "#a9c66c", paved: "#d8c9a6", side: "#e3d3b0", tufts: 24 });
  c.save(); k._trace([P(0.3, 0.3), P(9.7, 0.3), P(9.7, 9.7), P(0.3, 9.7)], true, 0); c.clip();
  { // sand path ring round the pond
    k.ground(ribbon(RING, PATH_W, true), "#e0cc9d", { stroke: false });
    k.ground(ribbon(RING, PATH_W - 0.14, true), "#ead9b4", { stroke: false });
    const R = rng(9); c.fillStyle = "rgba(170,135,90,0.4)";
    for (let i = 0; i < 260; i++) { const [u, v] = LOOP.at(R(), (R() - 0.5) * PATH_W * 0.7), [x, y] = P(u, v, 0); c.fillRect(x, y, 1.5, 1.1); }
    c.strokeStyle = "rgba(120,90,50,0.5)"; c.lineWidth = 1.1;
    for (const off of [PATH_W / 2, -PATH_W / 2]) { c.beginPath(); for (let i = 0; i <= 200; i++) { const [u, v] = LOOP.at(i / 200, off), [x, y] = P(u, v, 0); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
  }
  // pond: stone rim, water, reflections
  k.ground(offsetPoly(POND, 0.1), "#c7bc9f", { lw: 1.4 });
  k.water(POND, { color: "#5ab9b1", density: 2.0, seed: 8, dir: [0.4, 0.5], flow: 0.5 });
  c.save(); k._trace(POND.map(([u, v]) => P(u, v, 0)), true, 0); c.clip();
  { const [, y0] = P(5, 1.8, 0), [, y1] = P(5, 8.2, 0); const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, "rgba(30,100,95,0.35)"); g.addColorStop(0.5, "rgba(60,150,140,0.05)"); g.addColorStop(1, "rgba(210,245,235,0.12)"); c.fillStyle = g; c.fillRect(0, y0 - 20, 1024, y1 - y0 + 40); }
  for (const [u, v, w, h, col] of [[3.0, 2.0, 60, 18, "rgba(70,100,60,0.38)"], [5.2, 1.95, 46, 16, "rgba(70,100,60,0.34)"], [7.2, 2.2, 40, 14, "rgba(70,100,60,0.34)"], [2.0, 5.0, 14, 34, "rgba(70,100,60,0.3)"]]) { const [x, y] = P(u, v, 0); c.fillStyle = col; c.beginPath(); c.ellipse(x, y + 4, w, h, 0, 0, 6.3); c.fill(); }
  { // soft reflection of the hall roof in the water in front of the island
    const [x, y] = P(HC[0] + 0.6, 5.8, 0); const g = c.createRadialGradient(x, y, 4, x, y, 70); g.addColorStop(0, "rgba(207,59,44,0.28)"); g.addColorStop(1, "rgba(207,59,44,0)"); c.fillStyle = g; c.beginPath(); c.ellipse(x, y, 70, 26, 0, 0, 6.3); c.fill();
  }
  // floating petals + sun glints
  for (let i = 0; i < 38; i++) {
    const h1 = hash(i * 3.3), h2 = hash(i * 8.1 + 2), u = 2.0 + h1 * 6.0 + Math.sin(t * 0.3 + i) * 0.1 + (((t * 0.08 + i * 0.13) % 1) * 0.4), v = 2.0 + h2 * 6.0;
    if (!inPoly(POND, u, v)) continue;
    const [x, y] = P(u, v, 0); c.fillStyle = "rgba(250,200,215,0.9)"; c.beginPath(); c.ellipse(x, y, 2.2, 1.1, 0.4, 0, 6.3); c.fill();
  }
  c.restore();
  // island: stone rim then lawn, sand strip from the hall steps to the bridge
  k.ground(ISL_RIM, "#9a9486", { lw: 1.4 });
  k.ground(ISL, "#b7c97a", { lw: 1.4 });
  k.ground(pl3(5.3, 3.72, 5.95, 4.28), "#e6d3a8", { stroke: false });
  c.restore();
  // rim rocks and stones
  for (const s of STONES) stoneAt(c, s.u, s.v, s.r, s.seed);
  for (let i = 0; i < 40; i++) { const a = (i / 40) * 6.2832, u = HC[0] + Math.cos(a) * 1.86, v = HC[1] + Math.sin(a) * 1.6; if (Math.sin(a) < -0.2) continue; stoneAt(c, u, v, 4 + hash(i) * 3, 400 + i); }
  // wakes first, then lily pads on the water
  const boats = BOATS.map((b) => boatAt(b, t));
  boats.forEach((b, i) => swanWake(k, b.u, b.v, b.du, b.dv, t, i));
  for (const p of PADS) padAt(c, p.u, p.v, p.r, p.rot, p.r > 10 ? "#5d9b45" : "#6aa84d", Math.sin(t * 1.3 + p.ph) * 0.8);

  // ---------- depth-sorted scene ----------
  const Qd = (u, v, fn, bias = 0) => k.q(u + v + bias, fn);
  // island
  Qd(HC[0], HC[1], () => hall(k, t), 0.0);
  Qd(2.7, 3.0, () => willowAt(k, 2.7, 3.0, { r: 0.7, h: 1.7, hang: 1.0, seed: 3 }));
  Qd(5.3, 2.95, () => shrubAt(k, 5.3, 2.95, ["#f2a6c0", "#fff"], 3));
  Qd(5.2, 4.9, () => shrubAt(k, 5.2, 4.9, ["#f2a6c0", "#fff"], 5));
  Qd(2.6, 4.2, () => shrubAt(k, 2.6, 4.2, ["#f2a6c0", "#f4d24a"], 7));
  Qd(4.9, 5.3, () => shrubAt(k, 4.9, 5.3, ["#f4d24a", "#fff"], 9));
  Qd(BR.u0 + (BR.u1 - BR.u0) / 2, BR.v, () => bridge(k, t), 0.5);
  // cherry trees round the lawn rim (trunks inside 0.45..9.55)
  const CH = [[0.75, 0.75, 38, 1], [2.9, 0.62, 36, 2], [5.0, 0.62, 38, 3], [7.1, 0.62, 36, 4], [9.0, 0.75, 34, 5], [0.62, 2.9, 36, 6], [0.62, 5.0, 38, 7], [0.62, 7.1, 36, 8], [0.75, 9.0, 30, 9], [9.4, 2.9, 30, 10], [9.4, 5.2, 30, 11], [9.38, 7.2, 28, 12]];
  for (const [u, v, R, s] of CH) Qd(u, v, () => cherryAt(k, u, v, R, s, t));
  // a few oaks on the front rim so the rim is not all pink
  Qd(2.9, 9.4, () => oakAt(k, 2.9, 9.4, { r: 0.5, h: 1.3, seed: 21, col: "#7ea551" }));
  Qd(5.2, 9.4, () => oakAt(k, 5.2, 9.4, { r: 0.45, h: 1.2, seed: 22, col: "#86b05a" }));
  Qd(7.2, 9.4, () => oakAt(k, 7.2, 9.4, { r: 0.5, h: 1.3, seed: 23, col: "#7aa24e" }));
  // reeds and shrubs on the banks
  for (const [u, v, n, s] of [[2.1, 2.2, 3, 1], [8.0, 2.35, 3, 2], [8.0, 7.7, 3, 3], [2.05, 7.7, 3, 4], [1.9, 5.5, 3, 5]]) Qd(u, v, () => reedsAt(k, u, v, n, s), 0.05);
  for (const [u, v, col, s] of [[1.4, 1.55, ["#f2a6c0", "#fff"], 11], [8.6, 1.5, ["#f4d24a", "#fff"], 12], [1.45, 8.55, ["#f2a6c0", "#f4d24a"], 13], [8.6, 8.55, ["#8a7ad0", "#b0a2e8"], 14], [9.0, 4.3, ["#f2a6c0", "#fff"], 15], [1.0, 4.1, ["#f4d24a", "#fff"], 16]]) Qd(u, v, () => shrubAt(k, u, v, col, s), 0.1);
  // lotus
  for (const p of PADS) if (p.fl) Qd(p.u, p.v, () => lotusAt(c, p.u, p.v, p.sz, p.ph, t, p.fl === 2, Math.sin(t * 1.3 + p.ph) * 0.8), 0.1);
  // stone lanterns lining the outer edge of the path
  for (let i = 0; i < 12; i++) { const [u, v] = LOOP.at((i + 0.5) / 12, OUT * 0.5); if (u < 0.5 || v < 0.5 || u > 9.5 || v > 9.5) continue; Qd(u, v, () => toro(k, u, v, { h: 0.8 }), 0.05); }
  // benches on the lawn rim, with sitters
  const bench = (u, v, along, seed, top) => {
    Qd(u + (along === "u" ? 0.5 : 0.2), v + (along === "u" ? 0.2 : 0.5), () => k.bench(u, v, { along, len: 1.15 }));
    Qd(u + 0.5, v + 0.45, () => k.person(along === "u" ? u + 0.57 : u + 0.2, along === "u" ? v + 0.07 : v + 0.57, { pose: "sit", bench: true, seatZ: 0.28, dir: along === "u" ? [0.05, 1] : [1, 0.05], seed, top }), 0.4);
  };
  bench(3.7, 0.4, "u", 1201, "#d8c28a"); bench(8.3, 8.95, "u", 1202, "#6a9a80");

  // picnics: blankets with hampers, people sitting on them
  const picnic = (u, v, col, seed, a, b) => {
    Qd(u, v, () => { k.poly(pl3(u - 0.45, v - 0.35, u + 0.45, v + 0.35), col, { lw: 1.1, wobble: 0 }); k.poly(pl3(u - 0.45, v - 0.1, u + 0.45, v + 0.1, 0.03), "rgba(255,255,255,0.4)", { stroke: false }); k.box(u - 0.06, v - 0.08, 0.02, 0.2, 0.16, 0.12, "#c9884a", { hatch: false, shadow: false }); });
    Qd(u, v, () => k.person(u - 0.25, v - 0.05, { pose: "sitground", dir: [0.6, 0.8], seed: seed + 1, ...a }), 0.3);
    Qd(u, v, () => k.person(u + 0.27, v + 0.04, { pose: "sitground", dir: [-0.5, -0.4], seed: seed + 2, ...b }), 0.35);
  };
  picnic(1.0, 1.0, "#8fc2e0", 1010, { style: "dress", top: "#e8a0a8", hairStyle: "long" }, { style: "shirt", top: "#4a79b0" });
  picnic(8.95, 1.05, "#f1b0b8", 1020, { style: "tee", top: "#e8c14a" }, { style: "dress", top: "#c9567a", hairStyle: "long" });
  picnic(1.0, 8.95, "#b9d98a", 1030, { style: "coat", top: "#d8c28a" }, { style: "stripes", top: "#f2efe6" });
  picnic(3.05, 5.0, "#8fc2e0", 1040, { style: "shirt", top: "#7a9fd0" }, { style: "dress", top: "#f2f2ee", hairStyle: "long" });

  // ---------- swan pedal boats ----------
  boats.forEach((b, i) => { const face = b.du - b.dv >= 0 ? 1 : -1; Qd(b.u, b.v, () => swanAt(k, b.u, b.v, face, t, i, b.sp), 0.3); });

  // ---------- walkers on the ring ----------
  const outs = [{ style: "dress", top: "#e8a0a8", bottom: "#c9567a", hairStyle: "long" }, { style: "shirt", top: "#4a79b0", bottom: "#2b3040", bag: true }, { style: "tee", top: "#e8c14a", bottom: "#25334b" }, { style: "coat", top: "#d8c28a", bottom: "#3c3c3c", bag: true }, { style: "stripes", top: "#f2efe6", bottom: "#2f3e5e" }, { style: "dress", top: "#6a5aa8", bottom: "#3c3c3c", hairStyle: "long" }];
  const IN1 = -OUT * 0.27, IN2 = -OUT * 0.06;
  const W = (f0, f1, off, o, i) => k.qwalker(LOOP.lane(f0, f1, off), { h: 1.1, stride: 0.66, seed: 1100 + i, ...outs[i % outs.length], ...o });
  let n = 0;
  W(0.03, 0.13, IN1, { speed: 0.2, dwell: 2.8 }, n++); W(0.03, 0.13, IN2, { speed: 0.2, dwell: 2.8, offset: 0.02 }, n++);
  W(0.18, 0.28, IN1, { speed: 0.17, dwell: 3.4, offset: 0.4 }, n++); W(0.18, 0.28, IN2, { speed: 0.17, dwell: 3.4, offset: 0.42 }, n++);
  W(0.33, 0.43, IN1, { speed: 0.22, dwell: 2.4 }, n++);
  W(0.48, 0.58, IN1, { speed: 0.16, dwell: 3.2, offset: 0.1 }, n++); W(0.48, 0.58, IN2, { speed: 0.16, dwell: 3.2, offset: 0.1, kid: true, h: 0.7 }, n++);
  W(0.63, 0.73, IN1, { speed: 0.21, dwell: 2.6, offset: 0.5 }, n++); W(0.63, 0.73, IN2, { speed: 0.21, dwell: 2.6, offset: 0.52 }, n++);
  W(0.78, 0.88, IN1, { speed: 0.19, dwell: 3.0, offset: 0.2 }, n++); W(0.78, 0.88, IN2, { speed: 0.19, dwell: 3.0, offset: 0.22 }, n++);
  W(0.92, 0.99, IN1, { speed: 0.2, dwell: 2.4, offset: 0.6 }, n++);
  // jogger round the whole ring on the outer lane
  k.qwalker(LOOP.lane(0, 1, OUT * 0.27, 0.01).slice(0, -1), { h: 1.1, speed: 0.6, dwell: 0, seed: 1190, shorts: true, style: "tee", top: "#e2483a", offset: 0.3, stride: 0.5, loop: true });

  k.flush();
  // falling petals under each cherry
  for (const [u, v, , s] of CH) petalFall(k, u, v, 8, { h: 1.7, spread: 0.55, seed: s * 5, T: 6 + (s % 3) });
  { const [bx, by] = P(4.5, 2.0, 6); k.circlingBird(bx, by, 90, 22, { speed: 0.6, phase: 0 }); const [b2x, b2y] = P(7.5, 5.0, 5); k.circlingBird(b2x, b2y, 60, 18, { speed: -0.5, phase: 2 }); }
}
