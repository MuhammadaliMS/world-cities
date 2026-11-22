// TOKYO · Odaiba & Rainbow Bridge — v8 grid diorama. Everything stands on the 10x10 footprint, every point through P(u,v,z).
// Layout (u right-front, v left-front, larger u+v = nearer):
//   v 0.6-2.4     Rainbow Bridge along u across the back: anchorage blocks at both ends, towers at u 2.6 / 7.4 (rainbowbridge.js)
//   v 0.55-4.9    the bay (u 1.2-8.8) with the houseboat, water bus and a paddle-boarder looping; stone kerb round it
//   front-left    sand beach (u 0.3-4.7, v 4.9-6.2) with umbrellas, cabanas, waders, fence; brick boardwalk v 6.3-7.2
//   front-right   stone plaza: RX-78-2 Gundam (gundam.js) inside its railing at u 5.85 v 7.25; glass-fronted mall u 7.4-9.55 v 5.55-7.55
import { P, CTS, INK, shade, lerp, clamp, rng, hash, spline } from "../../lib/vec-kit.js";
import { FONT, mbox, faceSign, stdProj } from "./_props.js";
import { drawBridge } from "./rainbowbridge.js";
import { makeGundam } from "./gundam.js";
import * as G from "./_g1_1.js";

export const camera = { u: 5.2, v: 4.6, z: 2.6, zoom: 1.5 };

const GU = [6.5, 7.1];
const GUNDAM = makeGundam(GU[0], GU[1]);
const PINK = ["#f2b3c7", "#f4bccd", "#eea6bd"];

// ---------------- regions (u,v)
const sv = (u) => 4.92 + 0.1 * Math.sin(2.3 * u + 0.5); // wavy shoreline of the beach
const SHORE = []; for (let u = 1.2; u <= 4.71; u += 0.25) SHORE.push([u, sv(u)]);
const WATER = [[1.2, 0.55], [8.8, 0.55], [8.8, 4.9], [4.7, 4.9], ...[...SHORE].reverse(), [1.2, 4.9]];
const SAND = [[0.3, 4.9], ...SHORE, [4.7, 6.15], [0.3, 6.15]];
const WET = [...SHORE, ...[...SHORE].reverse().map(([u, v]) => [u, v + 0.16])];
const LAWN_L = [[0.3, 0.3], [0.95, 0.3], [0.95, 4.9], [0.3, 4.9]];
const LAWN_R = [[9.05, 0.3], [9.7, 0.3], [9.7, 5.1], [9.05, 5.1]];
const LAWN_F = [[0.55, 7.8], [3.0, 7.75], [3.35, 8.4], [3.2, 9.3], [0.55, 9.35]];
const LAWN_B = [[7.5, 8.75], [9.6, 8.75], [9.6, 9.55], [7.5, 9.55]];

const lawn = (k, pts, seed) => {
  k.ground(pts, "#98bf5d", { lw: 1.3 });
  k.grass(pts, { density: 9, seed });
  k.ground(pts, null, { stroke: shade("#98bf5d", -0.2), lw: 3, alpha: 0.45 });
  k.ground(pts, null, { lw: 1.3 });
};
const gridLines = (k, u0, u1, v0, v1, st) => {
  for (let u = u0; u <= u1 + 0.01; u += st) k.line3([[u, v0, 0], [u, v1, 0]], { lw: 0.7, stroke: "rgba(120,100,70,0.2)", wobble: 0 });
  for (let v = v0; v <= v1 + 0.01; v += st) k.line3([[u0, v, 0], [u1, v, 0]], { lw: 0.7, stroke: "rgba(120,100,70,0.2)", wobble: 0 });
};
const KERB = "#d4cdbd";
const kerb = (k, u, v, du, dv) => k.box(u, v, 0, du, dv, 0.22, KERB, { hatch: false, shadow: false, lw: 1.2 });

function ground(k, t) {
  const c = k.ctx;
  k.groundTrace({}, { paved: "#e8dfc8", stipple: 5 });
  gridLines(k, 0.6, 9.6, 7.35, 9.6, 0.6);
  gridLines(k, 4.8, 9.6, 5.1, 7.35, 0.6);
  // brick boardwalk along the back of the plaza
  k.ground([[0.3, 6.3], [4.7, 6.3], [4.7, 7.2], [0.3, 7.2]], "#c88c76", { lw: 1.3 });
  for (let v = 6.3; v < 7.2; v += 0.18) k.line3([[0.3, v, 0], [4.7, v, 0]], { lw: 0.8, stroke: "rgba(95,45,35,0.35)", wobble: 0 });
  for (let r = 0; r < 5; r++) for (let u = 0.3 + (r % 2) * 0.2; u < 4.7; u += 0.4) k.line3([[u, 6.3 + r * 0.18, 0], [u, 6.48 + r * 0.18, 0]], { lw: 0.7, stroke: "rgba(95,45,35,0.3)", wobble: 0 });
  // sand + wet band
  k.ground(SAND, "#efd9a0", { lw: 1.3 });
  { const R = rng(21); c.fillStyle = "rgba(170,130,70,0.25)"; for (let i = 0; i < 70; i++) { const [x, y] = P(lerp(0.4, 4.6, R()), lerp(5.1, 6.1, R()), 0); c.beginPath(); c.ellipse(x, y, 1.6, 0.8, 0, 0, 6.3); c.fill(); } }
  k.ground(WET, "rgba(176,140,80,0.35)", { stroke: false });
  lawn(k, LAWN_L, 3); lawn(k, LAWN_R, 4); lawn(k, LAWN_F, 5); lawn(k, LAWN_B, 6);
  // the bay
  k.water(WATER, { color: "#37a9b6", seed: 4, density: 2.6, dir: [1, 0.2], flow: 0.5 });
  { // depth gradient: deep teal at the back, light near the beach, sun glints
    c.save(); k._trace(WATER.map(([u, v]) => P(u, v, 0)), true, 0); c.clip();
    const g = c.createLinearGradient(...P(5, 0.5, 0), ...P(5, 4.9, 0));
    g.addColorStop(0, "rgba(10,90,120,0.38)"); g.addColorStop(0.55, "rgba(20,130,150,0.1)"); g.addColorStop(1, "rgba(190,240,225,0.35)");
    c.fillStyle = g; c.fillRect(0, 0, CTS.W, CTS.H);
    const R = rng(77);
    for (let i = 0; i < 46; i++) {
      const [x, y] = P(lerp(1.5, 8.5, R()), lerp(2.7, 4.8, R()), 0), a = 0.5 + 0.5 * Math.sin(t * 2 + i * 1.7);
      c.fillStyle = `rgba(255,248,200,${0.5 * a})`; c.fillRect(x - 3, y, 6, 1.4);
    }
    c.restore();
    c.lineWidth = 1.6; c.strokeStyle = INK; k._trace(WATER.map(([u, v]) => P(u, v, 0)), true, 0); c.stroke();
    // foam lapping the beach
    c.lineCap = "round";
    for (let i = 0; i < SHORE.length - 1; i++) {
      const [u, v] = SHORE[i], a = 0.45 + 0.4 * Math.sin(t * 1.5 + i * 0.9), [x, y] = P(u + 0.12, v - 0.06 - 0.04 * Math.sin(t * 1.5 + i), 0);
      c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - 6, y); c.quadraticCurveTo(x, y - 2.5, x + 6, y); c.stroke();
    }
  }
  // stone kerb round the bay (beach side stays open)
  kerb(k, 0.95, 0.3, 8.1, 0.25); kerb(k, 0.95, 0.55, 0.25, 4.4); kerb(k, 8.8, 0.55, 0.25, 4.55); kerb(k, 4.7, 4.9, 4.35, 0.2);
  // plinth under the Gundam
  k.ground([[5.2, 6.3], [7.55, 6.3], [7.55, 8.1], [5.2, 8.1]], "#efe8d6", { lw: 1.3 });
  gridLines(k, 5.2, 7.55, 6.3, 8.1, 0.32);
  GUNDAM.shadow(k);
  // towels + sandcastle
  for (const [u, v, col] of [[2.15, 5.5, "#e8607a"], [3.45, 5.2, "#3f77c2"], [0.9, 5.85, "#f3c63f"]]) G.towel(k, u, v, col);
}

// ---------------- the mall (axis-aligned boxes, glass front on the left face)
function mall(k, t) {
  const c = k.ctx, U0 = 7.75, U1 = 9.6, V0 = 5.55, V1 = 7.55;
  // glass podium
  k.box(U0, V0, 0, U1 - U0, V1 - V0, 1.18, "#dcd8cc", { hatch: false, shadow: true, lw: 1.3 });
  const glass = (plane, a0, a1, z0, z1, axis, shadeAmt) => { // glass wall on plane (v = plane for axis 'u', u = plane for axis 'v')
    const pt = (a, z) => (axis === "u" ? P(a, plane, z) : P(plane, a, z));
    const q = [pt(a0, z0), pt(a1, z0), pt(a1, z1), pt(a0, z1)];
    const g = c.createLinearGradient(0, q[3][1], 0, q[0][1]); g.addColorStop(0, shade("#9cc6dc", shadeAmt)); g.addColorStop(0.5, shade("#f3d79a", shadeAmt)); g.addColorStop(1, shade("#e7b56a", shadeAmt));
    k.path(q, { fill: g, lw: 1.3, wobble: 0 });
    c.save(); k._trace(q, true, 0); c.clip();
    if (axis === "u") for (let i = 0; i < 6; i++) { // shoppers drifting behind the glass
      const f = ((hash(i * 3.3) + t * 0.01 * (i % 2 ? 1 : -1)) % 1 + 1) % 1, [x, y] = P(lerp(a0 + 0.1, a1 - 0.1, f), plane - 0.2, 0.1 + (i % 3) * 0.04);
      c.fillStyle = "rgba(90,70,60,0.45)"; c.beginPath(); c.arc(x, y - 13, 2.3, 0, 6.3); c.fill(); c.fillRect(x - 2.3, y - 10.5, 4.6, 10.5);
    }
    const sw = ((t * 0.09) % 1) * (a1 - a0 + 0.8) + a0 - 0.4; // reflection sweeping across
    const sp = (s, z) => (axis === "u" ? P(clamp(s, a0, a1), plane, z) : P(plane, clamp(s, a0, a1), z));
    c.fillStyle = "rgba(255,255,255,0.28)"; c.beginPath(); for (const [s, z] of [[sw, z0], [sw + 0.2, z0], [sw + 0.55, z1], [sw + 0.35, z1]]) { const p = sp(s, z); c.lineTo(p[0], p[1]); } c.fill();
    c.restore();
    c.strokeStyle = "#5d6b78"; c.lineWidth = 1.1; c.beginPath();
    const n = Math.round((a1 - a0) / 0.36);
    for (let i = 1; i < n; i++) { const a = lerp(a0, a1, i / n); c.moveTo(...pt(a, z0)); c.lineTo(...pt(a, z1)); }
    for (const z of [lerp(z0, z1, 0.4), lerp(z0, z1, 0.75)]) { c.moveTo(...pt(a0, z)); c.lineTo(...pt(a1, z)); }
    c.stroke();
  };
  glass(V1, U0 + 0.06, U1 - 0.06, 0.1, 1.06, "u", 0);
  glass(U1, V0 + 0.06, V1 - 0.06, 0.1, 1.06, "v", -0.22);
  // entrance canopy with posts and a dark doorway
  k.poly([[8.1, V1, 0.1], [8.6, V1, 0.1], [8.6, V1, 0.9], [8.1, V1, 0.9]], "rgba(60,40,30,0.55)", { lw: 1, wobble: 0 });
  k.box(7.85, V1, 0.98, 1.0, 0.42, 0.1, "#e4e6ea", { hatch: false, shadow: false, lw: 1.2 });
  for (const u of [7.9, 8.8]) k.line3([[u, V1 + 0.38, 0], [u, V1 + 0.38, 0.98]], { lw: 2.2, stroke: "#9aa0a8", wobble: 0 });
  // overhanging roof slab, then the upper tiers
  k.box(U0 - 0.06, V0 - 0.06, 1.18, U1 - U0 + 0.12, V1 - V0 + 0.12, 0.12, "#d3d6da", { hatch: false, shadow: false, lw: 1.2 });
  const b1 = mbox(k, stdProj, 7.95, 5.8, 1.3, 1.5, 1.4, 1.0, "#ebe5d6", { wobble: 0, lw: 1.3 });
  k.windows(7.95, 5.8, 1.3, 1.5, 1.4, 1.0, { rows: 1, cols: 7, side: "L", color: "#7b97ad", mx: 0.15, base: 0.18, my: 0.4, w: 0.7, h: 0.6, lw: 1 });
  k.windows(7.95, 5.8, 1.3, 1.5, 1.4, 1.0, { rows: 1, cols: 5, side: "R", color: "#7b97ad", mx: 0.15, base: 0.18, my: 0.4, w: 0.7, h: 0.6, lw: 1 });
  faceSign(k, b1, "L", 0.1, 0.9, 0.7, 0.9, "DiverCity Tokyo Plaza", { ar: 6.2, bg: "#2b3a4f", fg: "#fff", size: 54 });
  k.box(8.6, 5.95, 2.3, 0.8, 0.7, 0.62, "#e0d9ca", { hatch: false, shadow: false, lw: 1.3 });
  // rooftop plant: AC units and a vent fan that turns
  k.box(8.05, 5.95, 2.3, 0.45, 0.36, 0.22, "#e9e4d8", { hatch: false, shadow: false, lw: 1.1 });
  k.box(8.1, 6.55, 2.3, 0.34, 0.3, 0.18, "#dcd5c6", { hatch: false, shadow: false, lw: 1.1 });
  k.box(8.9, 6.75, 2.3, 0.4, 0.3, 0.2, "#e9e4d8", { hatch: false, shadow: false, lw: 1.1 });
  { const [fx, fy] = P(8.28, 6.13, 2.55); c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.ellipse(fx, fy, 6, 2.6, 0, 0, 6.3); c.stroke();
    for (let i = 0; i < 3; i++) { const a = t * 6 + (i * 2 * Math.PI) / 3; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + Math.cos(a) * 5.4, fy + Math.sin(a) * 2.3); c.stroke(); } }
}

// ---------------- boats on closed axis-aligned loops (corners rounded by the spline, never leave the water)
const LOOP_Y = [[4.5, 2.95], [7.8, 2.95], [7.8, 3.65], [4.5, 3.65]];
const LOOP_B = [[2.6, 4.45], [8.2, 4.45], [8.2, 4.2], [2.6, 4.2]];
const LOOP_S = [[1.95, 3.2], [3.15, 3.2], [3.15, 3.9], [1.95, 3.9]];
const boatAt = (loop, speed, off) => (t) => {
  const sp = spline(loop, true), s = sp.sample(t * speed + off * sp.L);
  return { u: s.u, v: s.v, fu: s.du, fv: s.dv };
};
const PY = boatAt(LOOP_Y, 0.42, 0.1), PB = boatAt(LOOP_B, 0.9, 0.5), PS = boatAt(LOOP_S, 0.22, 0.2);

// ---------------- beach / plaza props + people
const OUT = {
  swim: (top) => ({ style: "shirt", top, bottom: "#25334b", shorts: true, hat: null, bag: false }),
  walkerA: { style: "shirt", top: "#4b6fae", bottom: "#c9b98a", hat: "cap", bag: true, bagCol: "#7a5a3a", hairStyle: "short" },
  walkerB: { style: "dress", top: "#f1b7c8", bottom: "#f5e3e8", hairStyle: "bun", hat: null },
  walkerC: { style: "dress", top: "#f4efe6", bottom: "#c78aa5", hairStyle: "long", hat: "sunhat" },
  walkerD: { style: "shirt", top: "#e8c14a", bottom: "#2e3d5c", hat: null, hairStyle: "short" },
  walkerE: { style: "shirt", top: "#c6574a", bottom: "#2f3a52", hat: null, hairStyle: "short" },
};
let FENCE_BEACH = [];
for (let u = 0.45; u < 4.6; u += 0.42) FENCE_BEACH.push(u);
const gFence = []; // railing round the Gundam: [u,v] posts every 0.35
{ const A = [5.1, 6.15], B = [7.65, 8.2]; const side = (p, q) => { const L = Math.hypot(q[0] - p[0], q[1] - p[1]), n = Math.round(L / 0.35); for (let i = 0; i < n; i++) gFence.push([[lerp(p[0], q[0], i / n), lerp(p[1], q[1], i / n)], [lerp(p[0], q[0], (i + 1) / n), lerp(p[1], q[1], (i + 1) / n)]]); };
  side([A[0], A[1]], [B[0], A[1]]); side([B[0], A[1]], [B[0], B[1]]); side([A[0], A[1]], [A[0], B[1]]);
  // front side with a gate gap (u 5.8-6.6)
  side([A[0], B[1]], [6.1, B[1]]); side([6.9, B[1]], [B[0], B[1]]); }
function railPanel(k, a, b) {
  const c = k.ctx;
  for (const z of [0.2, 0.46]) k.line3([[a[0], a[1], z], [b[0], b[1], z]], { lw: 1.3, stroke: "#6b6f76", wobble: 0 });
  for (const p of [a, b]) { const [x, y] = P(p[0], p[1], 0), [, y2] = P(p[0], p[1], 0.56); c.strokeStyle = INK; c.lineWidth = 2.2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y2); c.stroke(); c.strokeStyle = "#8d9097"; c.lineWidth = 1; c.stroke(); }
}
function fencePanel(k, u) { // beach picket fence along u at v = 6.2
  const c = k.ctx;
  k.line3([[u, 6.2, 0.2], [u + 0.42, 6.2, 0.2]], { lw: 1.5, stroke: "#a07a52", wobble: 0 }); k.line3([[u, 6.2, 0.4], [u + 0.42, 6.2, 0.4]], { lw: 1.5, stroke: "#a07a52", wobble: 0 });
  const [x, y] = P(u, 6.2, 0), [, y2] = P(u, 6.2, 0.5); c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y2); c.stroke(); c.strokeStyle = "#b88c5e"; c.lineWidth = 1.3; c.stroke();
}
const petal = (k, t, u0, u1, v0, v1, ztop, n, seed, col = "#f6c3d3") => {
  const c = k.ctx, R = rng(seed);
  for (let i = 0; i < n; i++) {
    const ph = R(), f = (t / 9 + ph) % 1, [x, y] = P(lerp(u0, u1, R()), lerp(v0, v1, R()), ztop * (1 - f) + 0.05);
    c.fillStyle = col; c.globalAlpha = Math.sin(f * Math.PI) * 0.9; c.beginPath(); c.ellipse(x + Math.sin(t * 1.5 + i) * 4, y, 2.1, 1.1, t + i, 0, 6.3); c.fill(); c.globalAlpha = 1;
  }
};

export default function draw(k, t) {
  const c = k.ctx;
  ground(k, t);
  const q = (u, v, fn) => k.q(u + v, fn);

  // ---- the bridge (everything behind it is the sky, everything else queues after it)
  k.q(3.0, () => drawBridge(k, t));

  // ---- bay traffic
  { const s = PY(t); k.q(s.u + s.v, () => { G.wake(k, PY, t, 8, 0.05); G.yakatabune(k, s, t); }); }
  { const s = PB(t); k.q(s.u + s.v, () => { G.wake(k, PB, t, 8, 0.03, { a: 0.8 }); G.waterBus(k, s, t); }); }
  { const s = PS(t); k.q(s.u + s.v, () => G.paddler(k, s, t)); }
  for (const [u, v, seed, o] of [[2.35, 4.72, 531, { pose: "stand", dir: [0.4, 0.8], top: "#e85d4a" }], [3.0, 4.66, 532, { pose: "stand", dir: [1, 0.3], top: "#f3c63f", splash: true }], [3.95, 4.74, 533, { kid: true, dir: [0.2, 1], top: "#3f77c2" }]])
    q(u, v, () => G.wader(k, u, v, seed, t, o));

  // ---- left & right banks: sakura, bushes
  for (const [u, v, r, h, col, seed] of [[0.62, 3.2, 0.6, 1.5, PINK[0], 11], [0.68, 4.3, 0.55, 1.4, PINK[2], 12], [9.4, 3.0, 0.6, 1.5, PINK[1], 13], [9.4, 4.3, 0.5, 1.3, "#86b05a", 14], [0.6, 2.75, 0.4, 1.0, "#7fae4c", 15]])
    q(u, v, () => k.tree(u, v, { r, h, col, seed }));
  for (const [u, v, w] of [[0.4, 3.7, 0.5], [9.15, 3.65, 0.5], [0.45, 4.7, 0.45], [9.2, 4.9, 0.4]]) q(u, v, () => k.hedge(u, v, w, 0.3, { h: 0.3 }));

  // ---- beach
  q(0.55, 5.15, () => G.cabana(k, 0.55, 5.15, "#3a6fc0", t));
  q(1.25, 5.2, () => G.cabana(k, 1.25, 5.2, "#d8453a", t));
  q(1.95, 5.55, () => G.umbrella(k, 1.95, 5.55, ["#e0453a", "#f6f0e2"]));
  q(3.2, 5.55, () => G.umbrella(k, 3.2, 5.55, ["#f3c63f", "#3f77c2"], { r: 0.45 }));
  q(3.85, 5.95, () => G.umbrella(k, 3.85, 5.95, ["#e0453a", "#f6f0e2"]));
  q(4.15, 5.35, () => G.sandcastle(k, 4.15, 5.35));
  for (const [u, v, h, lean, seed] of [[0.72, 5.8, 2.4, 0.2, 1], [2.75, 6.0, 2.2, -0.2, 2], [4.4, 5.6, 2.0, 0.15, 3], [5.2, 5.4, 2.3, -0.2, 4], [6.6, 5.45, 2.2, 0.2, 5]])
    q(u, v, () => G.palm(k, u, v, { h, lean, seed }));
  q(2.45, 5.85, () => k.person(2.45, 5.85, { pose: "sitground", dir: [0.2, 1], seed: 541, style: "dress", top: "#f08aa4", bottom: "#f08aa4", hairStyle: "long", hat: "sunhat" }));
  q(3.6, 5.45, () => k.person(3.6, 5.45, { pose: "sitground", dir: [0.5, 0.8], seed: 542, ...OUT.swim("#e8c14a"), top: "#e8c14a" }));
  q(4.4, 5.75, () => k.person(4.4, 5.75, { pose: "sitground", dir: [-0.3, -0.9], seed: 543, kid: true, ...OUT.swim("#d9544b") }));
  k.qwalker([[1.4, 5.95], [4.3, 5.95]], { speed: 0.3, offset: 0.2, seed: 551, dwell: 1.6, ...OUT.walkerC });
  for (const u of FENCE_BEACH) q(u + 0.21, 6.2, () => fencePanel(k, u));

  // ---- boardwalk, lawn, plaza life
  for (const [u, v] of [[0.55, 7.05], [2.5, 7.05], [4.2, 7.0]]) q(u, v, () => k.lamp(u, v, { col: "#2c3238", h: 1.5 }));
  q(1.9, 7.3, () => k.bench(1.9, 7.3, { along: "u" }));
  q(3.3, 7.3, () => k.bench(3.3, 7.3, { along: "u" }));
  k.qwalker([[0.7, 6.55], [4.3, 6.55]], { speed: 0.4, offset: 0.0, seed: 561, dwell: 1.6, ...OUT.walkerA });
  k.qwalker([[4.3, 6.95], [0.7, 6.95]], { speed: 0.34, offset: 0.4, seed: 562, dwell: 1.4, ...OUT.walkerB });
  k.qwalker([[0.7, 7.5], [4.3, 7.5]], { speed: 0.3, offset: 0.7, seed: 563, dwell: 1.8, ...OUT.walkerD });
  // front-left lawn with trees, planters and a bench
  q(2.3, 8.45, () => k.tree(2.3, 8.45, { r: 0.8, h: 1.9, col: "#7fae4c", seed: 21 }));
  q(1.0, 8.1, () => k.tree(1.0, 8.1, { r: 0.6, h: 1.5, col: PINK[0], seed: 22 }));
  q(1.7, 9.15, () => k.bench(1.7, 9.15, { along: "u" }));
  q(0.9, 9.1, () => k.flowers(0.7, 8.8, 0.7, 0.4, { seed: 31 }));
  q(2.9, 9.05, () => G.planterBox(k, 2.55, 9.0, 0.9, 0.4, 32));
  q(3.8, 8.1, () => G.planterBox(k, 3.5, 7.9, 0.8, 0.4, 33));
  q(4.0, 9.1, () => k.lamp(4.0, 9.1, { col: "#2c3238", h: 1.5 }));
  q(0.55, 7.55, () => k.lamp(0.55, 7.55, { col: "#2c3238", h: 1.5 }));
  // Gundam: back railing, statue, front railing
  gFence.forEach(([a, b]) => { const mid = (a[1] + b[1]) / 2 + (a[0] + b[0]) / 2; q(0, mid, () => railPanel(k, a, b)); });
  k.q(GU[0] + GU[1] + 0.05, () => GUNDAM.draw(k, t));
  // plaza life
  k.qwalker([[3.6, 8.85], [8.1, 8.85]], { speed: 0.36, offset: 0.2, seed: 571, dwell: 1.6, ...OUT.walkerE });
  k.qwalker([[7.9, 8.25], [9.3, 8.25]], { speed: 0.3, offset: 0.1, seed: 572, dwell: 1.8, ...OUT.walkerB, top: "#9ec3e6" });
  k.qwalker([[3.6, 9.4], [9.2, 9.4]], { speed: 0.42, offset: 0.6, seed: 573, dwell: 1.5, ...OUT.walkerA, top: "#7fb08f" });
  k.qwalker([[5.0, 5.85], [7.2, 5.85]], { speed: 0.3, offset: 0.4, seed: 574, dwell: 1.7, ...OUT.walkerC });
  k.qwalker([[7.7, 9.1], [7.7, 8.55]], { speed: 0.2, offset: 0.0, seed: 575, dwell: 2.0, kid: true, ...OUT.walkerD, top: "#e58a3c" });
  q(6.3, 8.65, () => k.person(6.3, 8.65, { pose: "photo", dir: [0.1, -1], seed: 581, style: "shirt", top: "#4a6c9c", bottom: "#c6b685", hat: null, hairStyle: "short", bag: true }));
  q(6.95, 8.7, () => k.person(6.95, 8.7, { pose: "stand", dir: [-0.3, -1], seed: 582, style: "dress", top: "#c9567a", bottom: "#f5e3e8", hairStyle: "bun", hat: null }));
  q(5.6, 8.7, () => k.person(5.6, 8.7, { pose: "wave", dir: [0.3, -1], seed: 583, kid: true, style: "shirt", top: "#e8c14a", bottom: "#2e3d5c", hat: null }));
  q(8.5, 8.4, () => k.person(8.5, 8.4, { pose: "stand", dir: [0.6, -0.5], seed: 584, style: "shirt", top: "#f3f0e6", bottom: "#3b3b3b", hat: null, hairStyle: "short" }));
  // mall + its planters, trees
  q(8.7, 6.55, () => mall(k, t));
  q(7.9, 8.8, () => G.planterBox(k, 7.9, 8.55, 1.0, 0.4, 34));
  q(9.1, 8.9, () => k.tree(9.1, 8.95, { r: 0.7, h: 1.7, col: "#86b05a", seed: 41 }));
  q(9.4, 7.8, () => k.lamp(9.4, 7.85, { col: "#2c3238", h: 1.5 }));
  q(5.0, 9.45, () => k.bench(5.0, 9.45, { along: "u" }));
  q(4.6, 5.7, () => k.lamp(4.8, 5.7, { col: "#2c3238", h: 1.5 }));
  k.flush();

  // ---- air: petals over the sakura, gulls over the bay (orbit kept inside the footprint)
  petal(k, t, 0.4, 0.9, 2.9, 4.5, 1.6, 8, 3);
  petal(k, t, 9.2, 9.6, 2.7, 4.5, 1.6, 8, 4);
  petal(k, t, 0.7, 1.4, 7.9, 8.4, 1.8, 6, 5);
  for (let b = 0; b < 3; b++) { const a = t * 0.35 + b * 0.6, [x, y] = P(5.0 + Math.cos(a) * 2.6, 3.4 + Math.sin(a) * 1.0, 6.2 + 0.3 * Math.sin(a * 2 + b)); k.bird(x, y, { phase: b * 1.7, size: 0.85 - b * 0.1 }); }
}
