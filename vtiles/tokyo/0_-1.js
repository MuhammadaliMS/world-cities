// TOKYO · Tokyo Tower & Shiba Park (traced over assets/tokyo/0_-1.png)
import { P, CTS, INK, shade, lerp, clamp, rng, hash, spline } from "../../lib/vec-kit.js";
import { PX, stdProj, mbox, mwin, mband, mroof, chochin, toro, petals, smoke, sakura, uvOf, FONT, faceSign } from "./_props.js";
import { makeTower } from "./tokyotower.js";

const C = 3.4, TOWER = makeTower(C);
const LAWN = [[0, 0], [10, 0], [10, 10], [0, 10]];
const PATHS = [
  [[4.7, 5.4], [4.6, 7.0], [4.3, 8.6], [3.9, 10.3]],
  [[5.0, 5.8], [6.8, 6.1], [8.6, 6.3], [10.2, 6.4]],
  [[4.5, 8.3], [3.4, 9.0], [2.6, 9.3]],
  [[4.2, 5.2], [3.0, 5.6], [1.4, 5.7]],
  [[4.6, 4.2], [4.9, 2.4], [5.1, 0.2]],
];
const ROUTES = [
  [[4.7, 5.6], [4.6, 7.0], [4.3, 8.6], [3.9, 9.8]],
  [[5.2, 5.9], [6.8, 6.2], [8.6, 6.4], [9.6, 6.4]],
  [[4.5, 8.3], [3.5, 8.9], [2.9, 9.1]],
  [[4.4, 5.3], [3.0, 5.7], [1.8, 5.8]],
  [[4.8, 4.5], [5.0, 3.0], [5.2, 1.2]],
  [[4.7, 6.8], [5.3, 6.1]],
  [[2.4, 5.2], [3.4, 5.6], [4.2, 5.9]],
  [[5.7, 2.6], [5.7, 4.0], [5.4, 5.6]],
];
const OBST = [[0.9, 5.8, 3.7, 8.6], [8.4, 3.0, 9.4, 4.6]];
export { ROUTES, OBST };
export const camera = { u: 3.8, v: 3.8, z: 6.5, zoom: 1.45, baseU: 2.9, baseV: 2.9, baseZ: 0.8, topZ: 13 };

function hall(k, u, v, t) {
  const c = k.ctx, W = 2.3, D = 2.1, z0 = 0.35;
  mbox(k, stdProj, u - 0.2, v - 0.2, 0, W + 0.4, D + 0.4, z0, "#cfc7b4", { wobble: 0 });
  // stairs
  for (let i = 0; i < 5; i++) mbox(k, stdProj, u + W * 0.35, v + D + 0.2 + (4 - i) * 0.0 + (i) * 0.07, 0, 0.9, 0.07, z0 - i * 0.07, "#e0d8c4", { wobble: 0, lw: 0.7 });
  const b = mbox(k, stdProj, u, v, z0, W, D, 1.2, "#f2e9d6", { wobble: 0, left: "#efe5d0", right: "#d4c9b2" });
  mwin(k, b, "L", { rows: 1, cols: 5, z0: 0.1, z1: 1.0, color: "#3c2b20", gap: 0.5, mx: 0.05, lit: 0.0, lw: 0.9 });
  for (const s of [0, 0.2, 0.4, 0.6, 0.8, 1.0]) k.path([b.fp("L", Math.max(0, s - 0.018), 0), b.fp("L", Math.min(1, s + 0.018), 0), b.fp("L", Math.min(1, s + 0.018), 1.2), b.fp("L", Math.max(0, s - 0.018), 1.2)], { fill: PX.red, wobble: 0, lw: 0.9 });
  for (const s of [0, 0.33, 0.66, 1.0]) k.path([b.fp("R", Math.max(0, s - 0.02), 0), b.fp("R", Math.min(1, s + 0.02), 0), b.fp("R", Math.min(1, s + 0.02), 1.2), b.fp("R", Math.max(0, s - 0.02), 1.2)], { fill: PX.redD, wobble: 0, lw: 0.9 });
  mwin(k, b, "R", { rows: 1, cols: 3, z0: 0.1, z1: 1.0, color: "#6a4a30", gap: 0.3, mx: 0.05, lw: 0.9 });
  // red railing
  c.strokeStyle = INK; c.lineWidth = 3.4; c.lineCap = "round"; c.beginPath(); [[u - 0.1, v + D + 0.12], [u + W + 0.12, v + D + 0.12], [u + W + 0.12, v - 0.1]].forEach(([a, bb], i) => { const p = P(a, bb, z0 + 0.35); i ? c.lineTo(...p) : c.moveTo(...p); }); c.stroke(); c.strokeStyle = "#e0583a"; c.lineWidth = 2; c.stroke();
  mroof(k, stdProj, u, v, z0 + 1.2, W, D, 1.2, { over: 0.45, lift: 0.4, hip: 0.5, curve: 2, col: "#79849a", trimH: 0.14, ornS: 1.0, ribs: 22 });
  // gold plaque + lantern
  const [lx, ly] = b.fp("L", 0.5, 0.75); chochin(k, lx, ly + 6, { r: 4, col: "#d9372b", glow: true, seed: 3 });
}

export default function draw(k, t) {
  const c = k.ctx;
  k.groundTrace({ lawn: [LAWN] }, { paved: "#e3c9ab", lawn: "#aebf68", side: "#e3d3b0", tufts: 22 });
  // gravel + paved paths over the lawn
  c.save(); c.beginPath(); [P(0, 0), P(10, 0), P(10, 10), P(0, 10)].forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.clip();
  for (const p of PATHS) { k.path2ground(p, 1.5, "#d6b99a", {}); k.path2ground(p, 1.3, "#ebd2b6", {}); }
  c.strokeStyle = "rgba(150,105,80,0.28)"; c.lineWidth = 0.8; c.beginPath();
  for (const p of PATHS) for (let i = 0; i < p.length - 1; i++) { const [u0, v0] = p[i], [u1, v1] = p[i + 1], L = Math.hypot(u1 - u0, v1 - v0), nu = -(v1 - v0) / L * 0.65, nv = (u1 - u0) / L * 0.65; for (let s = 0; s < L; s += 0.22) { const uu = u0 + (u1 - u0) * s / L, vv = v0 + (v1 - v0) * s / L; c.moveTo(...P(uu + nu, vv + nv)); c.lineTo(...P(uu - nu, vv - nv)); } }
  c.stroke();
  // tower plaza
  k.ground([[0.9, 0.9], [5.4, 0.9], [5.4, 5.8], [0.9, 5.8]].map(([a, b]) => [a + 0.2, b + 0.2]), "#ead6b8", { stroke: false });
  c.strokeStyle = "rgba(140,110,80,0.25)"; c.lineWidth = 0.7; c.beginPath(); for (let i = 0; i <= 28; i++) { const f = 2.4 + i * 0.16; c.moveTo(...P(f, 2.4)); c.lineTo(...P(f, 7.0)); c.moveTo(...P(2.4, f)); c.lineTo(...P(7.0, f)); } c.stroke();
  c.restore();
  TOWER.shadow(k);

  // ---- back trees (green + sakura) ----
  const back = [[0.5, 2.2, 0, 1], [0.4, 3.4, 1, 2], [1.2, 0.5, 0, 3], [2.4, 0.4, 0, 4], [3.6, 0.5, 1, 5], [6.0, 0.4, 0, 6], [7.4, 0.6, 0, 7], [8.8, 0.6, 1, 8], [0.4, 4.6, 0, 9], [9.5, 1.6, 0, 10], [9.4, 3.0, 1, 11], [1.1, 1.4, 1, 12], [0.3, 1.0, 0, 13], [2.0, 2.8, 0, 14], [0.6, 3.2, 0, 15], [4.8, 0.3, 0, 16], [5.4, 1.0, 1, 17], [3.0, 0.9, 1, 31], [0.5, 5.8, 1, 33]];
  for (const [u, v, pink, s] of back) k.q(u + v, () => k.tree(u, v, { r: pink ? 1.0 : 1.15, h: 2.1, seed: 70 + s, col: pink ? (s % 2 ? "#f4b6c8" : "#f8cdd9") : (s % 3 ? "#7f9a45" : (s % 2 ? "#97ab52" : "#6d8a3c")) }));
  k.q(2.0, () => TOWER.drawBack(k, t));
  // glass podium building under the tower
  k.q(6.8, () => { const b = mbox(k, stdProj, 1.8, 1.8, 0, 2.2, 2.2, 0.95, "#d8d2c0", { wobble: 0, left: "#e0dac8", right: "#b9b29e" }); mwin(k, b, "L", { rows: 1, cols: 9, z0: 0.15, z1: 0.8, color: "#ffe39a", lit: 1, gap: 0.12, mx: 0.03, lw: 0.6 }); mwin(k, b, "R", { rows: 1, cols: 9, z0: 0.15, z1: 0.8, color: "#d9bb70", lit: 1, gap: 0.12, mx: 0.03, lw: 0.6 }); mbox(k, stdProj, 2.3, 2.3, 0.95, 0.8, 0.7, 0.4, "#c9c3b0", { wobble: 0 }); mbox(k, stdProj, 3.2, 2.2, 0.95, 0.6, 0.6, 0.3, "#c9c3b0", { wobble: 0 }); });
  k.q(10.6, () => TOWER.draw(k, t));

  // ---- temple hall ----
  k.q(14.4, () => hall(k, 1.0, 6.2, t));
  // ---- park furniture ----
  k.q(14.0, () => toro(k, 6.1, 8.0, { h: 1.5 })); k.q(12.5, () => toro(k, 8.9, 4.2, { h: 1.5 })); k.q(15.8, () => toro(k, 4.9, 9.1, { h: 1.5 }));
  k.q(12.0, () => { k.bench(7.4, 7.2, { along: "u" }); k.bench(8.2, 3.6, { along: "u" }); k.bench(5.8, 8.8, { along: "u" }); });
  for (const [u, v, pink, s] of [[8.8, 5.8, 1, 21], [6.8, 8.6, 1, 22], [3.2, 9.6, 1, 24], [5.5, 9.4, 0, 25], [1.6, 9.5, 0, 26], ]) k.q(u + v + 0.2, () => k.tree(u, v, { r: pink ? 1.1 : 0.85, h: pink ? 1.9 : 1.5, seed: 90 + s, col: pink ? (s % 2 ? "#f4b6c8" : "#f8cdd9") : "#86a24c" }));
  k.q(14.0, () => { k.hedge(2.0, 9.9, 0.6, 0.3, { h: 0.3 }); k.hedge(7.0, 9.9, 0.6, 0.3, { h: 0.3 }); });
  // shrubs lining the paths
  for (const [u, v, s] of [[5.3, 6.2, 1], [3.6, 7.2, 2], [5.4, 8.0, 3], [6.6, 9.4, 4], [3.4, 9.2, 5], [6.5, 5.3, 6], [7.5, 6.9, 7], [9.0, 6.9, 8], [3.9, 6.1, 9], [5.7, 5.2, 10], [4.0, 4.6, 11], [7.9, 9.5, 12], [2.1, 8.7, 13], [2.7, 9.8, 14]]) k.q(u + v + 0.1, () => k.tree(u, v, { r: 0.38 + (s % 3) * 0.06, h: 0.5, seed: 400 + s, col: s % 3 ? "#7d9a43" : "#96ab4f" }));
  // picnic blankets
  const picnic = (u, v, col, seed) => k.q(u + v + 0.3, () => { k.poly([[u - 0.5, v - 0.4, 0.02], [u + 0.5, v - 0.4, 0.02], [u + 0.5, v + 0.4, 0.02], [u - 0.5, v + 0.4, 0.02]], col, { lw: 1.1, wobble: 0 }); k.person(u - 0.25, v - 0.1, { pose: "sitground", dir: [0.6, 0.5], seed }); k.person(u + 0.25, v + 0.1, { pose: "sitground", dir: [-0.6, -0.3], seed: seed + 1, gesture: true }); });
  picnic(7.7, 5.2, "#e8a0a8", 201); picnic(6.4, 7.0, "#8fc2e0", 203);
  // ---- people ----
  const outs = [{ style: "dress", top: "#e8a0a8", bottom: "#4a3b30", hairStyle: "long" }, { style: "tee", top: "#e8c14a", bottom: "#25334b", bag: true }, { style: "shirt", top: "#3b4f6e", bottom: "#2b3040" }, { style: "coat", top: "#d8c28a", bottom: "#3c3c3c" }, { style: "stripes", top: "#f2efe6", bottom: "#4a5a7a", bag: true }, { style: "skirt", top: "#7b5fa8", bottom: "#3c3c3c" }];
  const spec = [[0, 0.0], [0, 0.45], [0, 0.75], [1, 0.1], [1, 0.55], [1, 0.85], [2, 0.3], [2, 0.8], [3, 0.2], [3, 0.65], [4, 0.0], [4, 0.5], [5, 0.2], [0, 0.25], [6, 0.0], [6, 0.5], [7, 0.1], [7, 0.6]];
  spec.forEach(([r, off], i) => k.qwalker(ROUTES[r], { speed: 0.38 + (i % 4) * 0.035, offset: off, seed: 700 + i, dwell: 1 + (i % 3) * 0.6, ...outs[i % outs.length], hat: i % 5 === 0 ? "sunhat" : null }));
  // tourists photographing the tower
  k.qperson(5.9, 8.2, { pose: "photo", dir: [-0.6, -0.8], seed: 220, scale: 0.62 }); k.qperson(6.3, 7.6, { pose: "wave", dir: [-0.5, -0.6], seed: 221 });
  k.flush();
  petals(k, 120, 560, 420, 880, 16, { seed: 3 }); petals(k, 600, 520, 900, 860, 18, { seed: 8 });
  k.circlingBird(380, 280, 90, 30, { speed: 0.6 }); k.circlingBird(650, 300, 70, 24, { speed: -0.5, phase: 1 }); k.circlingBird(380, 280, 90, 30, { speed: 0.6, phase: 0.6, size: 0.8 });
  k.cloud(230, 220, { s: 0.85, phase: 1 }); k.cloud(800, 160, { s: 0.7, phase: 2 });
}
