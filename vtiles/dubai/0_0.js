// DUBAI · centre tile · Burj Khalifa & the Dubai Fountain (grid pass: everything through P(), inside 0.3..9.7)
// Layout (u,v): tower + podium drums back-centre (2.7,2.7); lake [3.4,8.4]^2 with coping + rails; fountain spine along u at v=5.6,
// bowl at (4.6,7.4); arched bridge along v at u=7.8 (v 2.9-8.9); souk arcades on the left edge (u .4-1.7, v 5.25-7.9) and the right
// edge (v .4-1.7, u 5.25-9.0) facing the lake; palm rows between arcades and lake; flower beds inside the front/right rim.
import { P, CTS, INK, shade, lerp, clamp, rng } from "../../lib/vec-kit.js";
import { makeBurj } from "./burj.js";
import { dpalm, windTower, glitter, SAND_L, look } from "./_g0_0.js";
import { LAKE, COPING, lakeEdge, fountain, BR, BRK, bridgeSeg, bridgeRailNear, brSegDepth, brRailDepth, brUV, souk, cafe, bed } from "./_t0_0.js";

const C = 2.7;
const BURJ = makeBurj(C);
export const camera = { u: 2.9, v: 2.9, z: 5.2, zoom: 1.5, baseU: 3.4, baseV: 3.3, baseZ: 0.6, topZ: 11.4 };

const LAWN = [[[0.5, 8.3], [3.1, 8.3], [3.1, 9.2], [0.5, 9.2]]];

// ---------- people routes (u,v), all on the promenades / bridge ----------
const ROUTES = {
  L1: [[2.45, 4.5], [2.45, 6.3], [2.45, 8.1]],
  L2: [[2.72, 4.4], [2.72, 6.2], [2.72, 8.0]],
  R1: [[5.2, 2.45], [7.1, 2.45], [9.0, 2.45]],
  R2: [[5.0, 2.7], [7.0, 2.7], [9.1, 2.7]],
  Rr: [[9.1, 3.4], [9.1, 6.0], [9.1, 8.5]],
  F: [[3.5, 8.82], [5.3, 8.82], [7.0, 8.82]],
  bridge: [[BR.u, 3.1], [BR.u, 6.0], [BR.u, 8.7]],
  bridge2: [[BR.u - 0.18, 8.7], [BR.u - 0.18, 6.0], [BR.u - 0.18, 3.1]],
};

const PALMS = [ // [u, v, h, lean]
  [2.95, 5.4, 2.1, 0.3], [2.95, 6.7, 1.9, -0.2], [2.95, 8.0, 2.1, 0.2],
  [5.6, 2.95, 2.0, -0.3], [6.7, 2.95, 2.1, 0.3], [8.75, 2.95, 1.9, 0.1],
  [8.85, 4.2, 2.0, -0.2], [8.85, 6.9, 1.9, 0.3],
];
const TREES = [[0.65, 1.9, 0.55, 1.5, "#6f9f4a"], [1.3, 0.65, 0.5, 1.4, "#7fb25a"], [4.95, 0.65, 0.5, 1.4, "#6a9a4a"], [0.8, 8.7, 0.45, 1.2, "#e0618a"], [3.0, 8.75, 0.45, 1.1, "#e87a3a"], [9.3, 9.25, 0.4, 1.0, "#7fb25a"]];
const LAMPS = [[3.15, 4.7], [3.15, 6.05], [3.15, 7.35], [3.15, 8.6], [5.0, 3.15], [6.3, 3.15], [8.6, 3.15], [4.4, 8.62], [6.0, 8.62], [8.6, 8.62]];
const BEDS = [
  [[[3.5, 9.45], [5.2, 9.45], [6.9, 9.45], [8.6, 9.45]], 0.3, 63],
  [[[0.7, 9.45], [1.8, 9.45], [2.9, 9.45]], 0.3, 64],
  [[[9.42, 3.2], [9.42, 5.0], [9.42, 6.8], [9.42, 8.6]], 0.3, 65],
  [[[1.9, 4.2], [2.2, 4.2], [2.5, 4.2]], 0.28, 66],
];
// lake-rim spectators: [u, v, pose, dir]
const RIM = [
  [3.05, 4.95, "photo", [1, 0.1]], [3.05, 5.75, "stand", [1, 0.1]], [3.05, 6.35, "wave", [1, 0.2]], [3.05, 7.2, "photo", [1, 0.1]], [3.05, 7.7, "stand", [1, 0.1]],
  [5.5, 3.05, "stand", [0.1, 1]], [6.2, 3.05, "photo", [0.1, 1]], [4.4, 3.8, "stand", [0.2, 1]],
  [8.75, 4.4, "photo", [-1, 0.1]], [8.75, 5.9, "stand", [-1, 0.1]], [8.75, 7.4, "wave", [-1, 0.1]],
  [4.0, 8.7, "photo", [0.1, -1]], [5.6, 8.7, "stand", [0.1, -1]], [6.5, 8.7, "photo", [0.1, -1]],
];

export default function draw(k, t) {
  const c = k.ctx;
  // ---------- ground + water ----------
  k.groundTrace({ lawn: LAWN }, { lawn: "#8fc25a", paved: "#eddcb6", water: "#35bfc9", side: "#e8d3a2", stipple: 12 });
  k.ground(COPING, "#efe2c0", { lw: 1.4 });
  // paving joints on the promenades
  c.strokeStyle = "rgba(150,120,80,0.22)"; c.lineWidth = 0.8;
  for (let v = 4.4; v < 8.3; v += 0.5) k.line3([[1.75, v], [3.2, v]], { lw: 0.8, stroke: "rgba(150,120,80,0.22)", wobble: 0 });
  for (let u = 5.25; u < 9.0; u += 0.5) k.line3([[u, 1.75], [u, 3.2]], { lw: 0.8, stroke: "rgba(150,120,80,0.22)", wobble: 0 });
  k.water(LAKE, { color: "#35bfc9", flow: 0.5 });
  k.ground(LAKE, null, { lw: 1.6 });
  glitter(k, 3.5, 3.5, 8.3, 8.3, 90, 11);
  BURJ.shadow(k);
  lakeEdge(k);

  // ---------- back: trees, podium, tower ----------
  for (const [u, v, r, h, col] of TREES.slice(0, 3)) k.q(u + v, () => k.tree(u, v, { r, h, seed: Math.round(u * 10), col }));
  k.q(C * 2 + 0.3, () => BURJ.draw(k, t));
  BURJ.podium(k, t);

  // ---------- left souk arcade (faces the lake along +u) ----------
  k.q(6.4, () => windTower(k, 0.4, 4.45, 0, 0.75, 2.6, SAND_L));
  k.q(1.7 + 6.55, () => souk(k, 0.4, 5.25, 1.3, 1.3, 1.7, { face: "R", pitch: 0.6, pergola: true, umbrellas: [[0.75, 5.75, "#e9b04a"], [1.05, 6.2, "#d9544b"]] }));
  k.q(1.7 + 6.55 + 0.1, () => { cafe(k, 1.98, 5.6, "#d9544b"); cafe(k, 1.98, 6.3, "#e9b04a"); });
  k.q(1.7 + 7.85, () => souk(k, 0.4, 6.55, 1.3, 1.3, 2.1, { face: "R", rows: 3, pitch: 0.55 }));
  k.q(1.7 + 7.85 + 0.1, () => { cafe(k, 1.98, 7.1, "#3a9aa6"); cafe(k, 1.98, 7.75, "#e9b04a"); });
  // ---------- right souk arcade (faces the lake along +v) ----------
  k.q(5.25 + 1.7, () => souk(k, 5.25, 0.4, 1.3, 1.3, 1.7, { face: "L", pitch: 0.58, pergola: true, umbrellas: [[5.6, 0.8, "#e9b04a"], [5.95, 1.15, "#d9544b"]] }));
  k.q(5.25 + 1.7 + 0.1, () => { cafe(k, 5.75, 2.0, "#e9b04a"); cafe(k, 6.4, 2.0, "#3a9aa6"); });
  k.q(6.55 + 1.7, () => souk(k, 6.55, 0.4, 1.3, 1.3, 2.1, { face: "L", rows: 3, pitch: 0.6 }));
  k.q(6.55 + 1.7 + 0.1, () => { cafe(k, 7.0, 2.0, "#d9544b"); cafe(k, 7.62, 2.0, "#e9b04a"); });
  k.q(7.85 + 1.5, () => souk(k, 7.85, 0.4, 1.1, 1.1, 1.5, { face: "L", pitch: 0.6, pergola: true, umbrellas: [[8.25, 0.8, "#e9b04a"]] }));
  k.q(8.95 + 1.1, () => windTower(k, 8.95, 0.4, 0, 0.75, 2.6, SAND_L));

  // ---------- planting ----------
  for (const [u, v, h, lean] of PALMS) { const big = h > 2; k.q(u + v + 0.1, () => dpalm(k, u, v, { h, seed: Math.round(u * 7 + v * 13), lean, len: big ? 1.15 : 1.0, fronds: big ? 16 : 14, wide: 1.2 })); }
  for (const [u, v, r, h, col] of TREES.slice(3)) k.q(u + v, () => k.tree(u, v, { r, h, seed: Math.round(u * 10), col }));
  BEDS.forEach(([pts, w, seed]) => { const d = (pts[0][0] + pts[0][1] + pts[pts.length - 1][0] + pts[pts.length - 1][1]) / 2 + 0.6; k.q(d, () => bed(k, pts, w, seed)); });
  for (const [u, v] of LAMPS) k.q(u + v + 0.2, () => k.lamp(u, v, { col: "#2b2620", h: 1.55, lit: 0.8 }));
  k.q(4.6 + 9.05 + 0.2, () => k.bench(4.6, 9.05, { along: "u" }));
  k.q(6.2 + 9.05 + 0.2, () => k.bench(6.2, 9.05, { along: "u" }));
  k.q(2.2 + 4.8 + 0.2, () => k.bench(2.2, 4.8, { along: "v" }));
  // picnic on the front-left lawn
  k.q(1.6 + 8.8 + 0.3, () => {
    const u = 1.55, v = 8.75;
    k.poly([[u - 0.35, v - 0.25, 0.02], [u + 0.35, v - 0.25, 0.02], [u + 0.35, v + 0.25, 0.02], [u - 0.35, v + 0.25, 0.02]], "#e8a0b0", { lw: 1.2, wobble: 0 });
    k.person(u - 0.15, v - 0.08, { pose: "sitground", dir: [0.6, 0.5], seed: 41, h: 0.4, ...look(41) });
    k.person(u + 0.15, v + 0.06, { pose: "sitground", dir: [-0.6, -0.4], seed: 42, gesture: true, h: 0.4, ...look(42) });
    k.person(u + 0.02, v - 0.17, { pose: "sitground", dir: [0.2, 1], seed: 43, kid: true, h: 0.28, ...look(43) });
  });

  // ---------- fountain ----------
  k.q(11.8, () => fountain(k, t));

  // ---------- bridge, built in 7 depth-sorted segments ----------
  for (let j = 0; j < BRK.length - 1; j++) {
    k.q(brSegDepth(j), () => bridgeSeg(k, j));
    k.q(brRailDepth(j), () => bridgeRailNear(k, j));
  }
  for (const [rt, off, seed, sp] of [["bridge", 0.0, 71, 0.28], ["bridge", 2.6, 72, 0.3], ["bridge2", 0.8, 73, 0.26], ["bridge2", 3.4, 74, 0.3]]) {
    const w = k.walkerState(ROUTES[rt], { speed: sp, offset: off, dwell: 2.5 });
    k.q(w.u + w.v + 0.3, () => k.walker(ROUTES[rt], { speed: sp, offset: off, seed, dwell: 2.5, z: 0.55, h: 0.46, ...look(seed) }));
  }
  // spectators on the bridge rail
  [[4.2, 0.0, 81, "photo"], [4.9, 0.0, 82, "stand"], [5.6, 0.0, 83, "wave"]].forEach(([s, o, sd, pose]) => {
    const [u, v] = brUV(s, 0.18); k.qperson(u, v, { pose, dir: [1, 0.2], seed: sd, z: 0.55, h: 0.46, ...look(sd) });
  });

  // ---------- crowd ----------
  const R = ROUTES;
  const specs = [
    ["L1", 0.0, 91], ["L1", 1.3, 92], ["L1", 2.6, 93], ["L1", 3.9, 94], ["L2", 0.5, 95], ["L2", 2.0, 96], ["L2", 3.4, 97],
    ["R1", 0.0, 98], ["R1", 1.6, 99], ["R1", 3.2, 100], ["R1", 4.8, 101], ["R2", 0.8, 102], ["R2", 2.4, 103], ["R2", 4.0, 104],
    ["Rr", 0.0, 105], ["Rr", 1.5, 106], ["Rr", 3.0, 107], ["F", 0.0, 108], ["F", 1.5, 109], ["F", 3.0, 110],
  ];
  for (const [r, off, seed] of specs) k.qwalker(R[r], { speed: 0.36 + (seed % 5) * 0.03, offset: off, seed, dwell: 1.4 + (seed % 3) * 0.7, ...look(seed), h: 0.46 });
  RIM.forEach(([u, v, pose, dir], i) => k.qperson(u, v, { pose, dir, seed: 120 + i, h: 0.46, ...look(120 + i) }));
  // kids on the lawn
  k.qperson(2.5, 8.55, { pose: "cheer", kid: true, dir: [1, 0.3], seed: 130, h: 0.33 });
  k.qperson(0.95, 8.7, { pose: "stand", kid: true, dir: [1, 0.2], seed: 131, h: 0.33 });
  k.flush();

  // ---------- sky ----------
  k.circlingBird(470, 330, 80, 26, { speed: 0.6, phase: 0 });
  k.circlingBird(470, 330, 80, 26, { speed: 0.6, phase: 0.7, size: 0.8 });
  k.cloud(240, 260, { s: 0.8, phase: 1 });
  k.cloud(760, 300, { s: 0.7, phase: 3 });
}
