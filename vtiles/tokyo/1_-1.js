// TOKYO · Shinkansen & Mt. Fuji view — v8 grid diorama. Everything stands on the 10x10 footprint, every point through P(u,v,z).
// Layout (u right-back, v left-back, larger u+v = nearer):
//   back corner   Mt Fuji model (u .4-5.1, v .3-5.0, 6 high), foothill tea terraces
//   back right    terraced tea hill (tiers T1-T4), farmhouse + kura, pickers
//   v 4.5-6.45    axis-aligned Shinkansen viaduct along u, tunnel mounds at both ends (train slides into them), masts + wires
//   front         garden: stone path along v, koi pond + red arched bridge along u, willow, sakura, lantern, walkers
import { P, CTS, INK, shade, mix, lerp, clamp, rng, hash, smooth, drawHuman } from "../../lib/vec-kit.js";
import * as G from "./_g1_-1.js";

export const camera = { u: 5.0, v: 5.0, z: 2.2, zoom: 1.35 };

const ZS = CTS.S * CTS.ZS;
const POND = [[4.9, 7.3], [5.7, 7.0], [7.0, 6.95], [8.2, 7.05], [8.55, 7.6], [8.6, 8.6], [8.1, 9.2], [6.8, 9.35], [5.5, 9.2], [4.85, 8.5]];
const LAWN = [[0.4, 0.4], [9.6, 0.4], [9.6, 9.6], [0.4, 9.6]];
const inPoly = (pts, x, y) => { let r = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) r = !r; } return r; };
const treeAt = (k, u, v, z, o) => { const c = k.ctx; c.save(); c.translate(0, -z * ZS); k.tree(u, v, o); c.restore(); };
const PINK = ["#f2b3c7", "#f4bccd", "#eea6bd"];

// tiers of the tea hill: [v, dv, z]
const TIERS = [[0.4, 1.4, 1.2], [1.8, 0.8, 0.9], [2.6, 0.8, 0.6], [3.4, 1.0, 0.3]];
const TU = 5.5, TDU = 4.05;
const LMOUND = [0.45, 4.5, 1.2, 1.95], RMOUND = [8.4, 4.5, 1.2, 1.95]; // u, v, du, dv

const OUT = {
  hiker: { style: "shirt", top: "#4b6fae", bottom: "#c9b98a", hat: "cap", bag: true, bagCol: "#7a5a3a", hairStyle: "short" },
  kimono: { style: "dress", top: "#f1b7c8", bottom: "#f5e3e8", hairStyle: "bun", hat: null },
  sun: { style: "dress", top: "#f4efe6", bottom: "#c78aa5", hairStyle: "long", hat: "sunhat" },
  photo: { style: "shirt", top: "#4a6c9c", bottom: "#c6b685", hat: null, hairStyle: "short", bag: true, bagCol: "#6b4a30" },
  picker: (i) => ({ style: i % 2 ? "dress" : "shirt", top: ["#e8e4d6", "#7fa3c9", "#f1ece0"][i % 3], bottom: ["#3a5a4a", "#4a5a7a", "#4a5f48"][i % 3], hat: "sunhat", bag: true, bagCol: "#9a7a4a", hairStyle: "bun" }),
};

// ---------------- routes (u,v)
const R_PATH_UP = [[1.98, 9.3], [1.98, 8.4], [2.05, 7.5], [2.05, 6.6], [2.05, 5.45]];
const R_PATH_DN = [[2.33, 5.5], [2.33, 6.6], [2.3, 7.6], [2.3, 8.9]];
const R_BR1 = [[2.4, 7.92], [4.7, 7.92], [8.8, 7.92], [9.3, 7.92]];
const R_BR2 = [[9.3, 8.1], [8.8, 8.1], [4.7, 8.1], [2.4, 8.1]];
const R_KID = [[0.9, 9.35], [1.5, 9.35], [1.5, 8.7]];
const R_BANK = [[9.0, 7.9], [9.25, 8.5], [9.1, 9.25]];
const R_FRONT = [[2.9, 6.5], [7.6, 6.5]];
const R_STRIP = [[3.5, 4.75], [6.6, 4.75]];
const R_TIER = { 1: [[5.95, 2.2], [9.2, 2.2]], 2: [[5.95, 3.0], [9.2, 3.0]], 3: [[5.95, 3.9], [9.2, 3.9]] };
const OBST_ROUTE = [];

// ---------------- ground
function ground(k, t) {
  k.groundTrace({ lawn: [LAWN] }, { lawn: "#88b458", paved: "#dbd0ae", tufts: 7 });
  const c = k.ctx;
  // stone path: main spine along v, branch along u to the bridge, bank pad
  const pathLine = (pts, w) => {
    k.path2ground(pts, w + 0.1, "#a89a74");
    k.path2ground(pts, w, "#e8dec3");
  };
  pathLine([[2.15, 9.6], [2.15, 5.0]], 0.7);
  pathLine([[2.15, 8.0], [4.8, 8.0]], 0.62);
  pathLine([[8.75, 8.0], [9.5, 8.0]], 0.62);
  pathLine([[2.3, 6.5], [7.8, 6.5]], 0.5);
  const R = rng(12);
  for (let i = 0; i < 60; i++) { const v = lerp(5.1, 9.55, R()), u = 2.15 + (R() - 0.5) * 0.5; k.ground([[u, v], [u + 0.2, v], [u + 0.2, v + 0.13], [u, v + 0.13]], "#d8ccae", { stroke: "rgba(110,95,70,0.4)", lw: 0.8, wobble: 0 }); }
  // pond
  k.ground(POND, "#8a8f78", { lw: 1.6, stroke: "rgba(60,60,40,0.8)" });
  k.water(POND.map(([u, v]) => [u + (u < 6.7 ? 0.07 : -0.07), v + (v < 8.1 ? 0.07 : -0.07)]), { color: "#32a39b", seed: 4, density: 2.0, dir: [0, 1] });
  k.ground(POND, null, { stroke: "rgba(30,70,60,0.65)", lw: 1.2 });
  for (const [u, v, r, col] of [[7.6, 7.3, 0.75, "#8cb64a"], [5.9, 7.2, 0.55, "#4f8a4a"], [6.8, 8.0, 0.4, "#c9382c"], [8.3, 8.8, 0.4, "#e8a0b6"], [5.4, 8.7, 0.3, "#f2b3c7"]])
    k.ell(u + Math.sin(t * 1.3 + u) * 0.04, v, 0, r, col, { alpha: 0.28, stroke: false });
  G.koi(k, t, [[6.4, 7.35, 0.8, 0.12, 0.35, 0], [7.5, 7.3, 0.45, 0.1, -0.4, 2], [5.9, 8.9, 0.5, 0.14, 0.35, 1], [7.0, 8.85, 0.9, 0.18, -0.3, 4], [6.3, 7.4, 0.35, 0.1, 0.45, 5]]);
}

// ---------------- scenery (queued)
const FLOW = [
  [3.55, 9.2, 0.45, ["#4f8a3c", "#5b9a40"], ["#e0345a", "#f0587a", "#d62c50"], 66], [1.9, 9.3, 0.4, ["#5b9a3c", "#6aa845"], ["#fafafa", "#f2eef6", "#fff4f8"], 67],
  [3.5, 7.2, 0.4, ["#4f8a3c", "#3f7a34"], ["#d83a56", "#e8506a", "#f0788c"], 62], [0.9, 9.0, 0.35, ["#5b9a3c", "#6aa845"], ["#f4f0f2", "#e8e0f0"], 65],
  [9.3, 9.35, 0.45, ["#4f8a3c", "#5b9a40"], ["#e4488c", "#f06aa4", "#d63a7a"], 72], [4.35, 9.35, 0.32, ["#4f8a3c"], ["#e0457b", "#f26a94"], 76],
  [8.9, 6.7, 0.35, ["#4f8a3c"], ["#e83a62", "#f06484"], 78], [0.9, 6.9, 0.38, ["#4f8a3c", "#5b9a40"], ["#f0a0bc", "#f7c0d2"], 79],
];
const BUSH = [[1.6, 9.0, 0.5, 1], [3.6, 6.8, 0.45, 2], [9.4, 7.0, 0.42, 3], [4.0, 9.25, 0.4, 4], [0.8, 8.3, 0.45, 5], [2.15, 7.0, 0.38, 6], [4.2, 6.75, 0.35, 7], [9.35, 8.8, 0.4, 8], [3.55, 7.8, 0.3, 9], [4.4, 8.75, 0.34, 10]];
const POND_ROCKS = [[5.2, 7.6, 0.8], [5.9, 6.9, 0.75], [7.3, 6.9, 0.7], [8.5, 7.1, 0.9], [8.8, 8.55, 0.8], [8.4, 9.25, 0.85], [7.2, 9.5, 0.9], [6.2, 9.5, 0.7], [5.1, 9.2, 0.85], [4.6, 8.7, 0.7], [4.55, 7.55, 0.6], [6.4, 6.85, 0.55]];

function scatter(k) {
  const items = [], R = rng(333);
  for (let i = 0; i < 400 && items.length < 34; i++) {
    const u = lerp(0.6, 9.4, R()), v = lerp(6.7, 9.4, R()), kind = items.length % 4;
    if (inPoly(POND.map(([a, b]) => [a + (a < 6.7 ? -0.5 : 0.5), b + (b < 8 ? -0.4 : 0.4)]), u, v)) continue;
    if (Math.abs(u - 2.15) < 0.6 || Math.abs(v - 8) < 0.5 && u < 5.2) continue;
    if (Math.hypot(u - 0.95, v - 7.9) < 0.8 || Math.hypot(u - 9.0, v - 7.15) < 0.9) continue;
    if (Math.hypot(u - 3.7, v - 8.75) < 0.5) continue;
    items.push([u, v, kind, R()]);
  }
  return items;
}
let SCAT = null;

function peopleBack(k) {
  // pickers on tiers (behind the viaduct): depth key = tier key + a hair
  TIERS.slice(0, 4).forEach(([tv, dv, tz], i) => {
    if (i === 0) return;
    const ti = i - 1, route = R_TIER[i];
    k.q(tv + dv + 0.0005 + 0.0001 * ti, () => k.walker(route, { speed: 0.2 - ti * 0.02, offset: 0.1 + ti * 0.3, seed: 820 + ti, dwell: 1.4 + ti * 0.4, z: tz, ...OUT.picker(ti) }));
  });
  k.q(1.8 + 0.002, () => k.person(7.05, 1.65, { pose: "stand", dir: [0.5, 1], seed: 830, z: 1.2, style: "shirt", top: "#7fb08f", bottom: "#353b4d", hat: "cap" }));
  k.q(4.75 + 0.01, () => k.walker(R_STRIP, { speed: 0.3, offset: 0.2, seed: 831, dwell: 1.6, ...OUT.photo }));
}

export default function draw(k, t) {
  const c = k.ctx;
  // ===== phase 0: ground
  ground(k, t);

  // ===== phase 1: Fuji + terraced hill (back to front by v)
  G.mountain(k, t);
  TIERS.forEach(([tv, dv, tz], i) => {
    const key = tv + dv;
    k.q(key, () => G.teaTier(k, TU, tv, TDU, dv, tz, t, { rows: i === 0 ? 0 : 5 }));
  });
  k.q(1.801, () => G.farmhouse(k, 5.95, 0.62, 1.2, 1.9, 0.8, t, { smoke: true }));
  k.q(1.802, () => G.kura(k, 8.3, 0.65, 1.2, 0.85, 0.55));
  k.q(1.803, () => { treeAt(k, 8.95, 1.45, 1.2, { r: 0.7, h: 1.6, col: PINK[0], seed: 51 }); });
  k.q(1.804, () => { G.bush(k, 5.75, 1.45, 0.34, ["#6aa845", "#58963c"], 21, 1.2); G.rock(k, 7.95, 1.6, 1.2, 0.8, "#8d8a85", 3); G.bush(k, 8.2, 1.55, 0.3, ["#7fb04a", "#6a9c3c"], 22, 1.2); });
  k.q(4.6, () => { treeAt(k, 6.2, 4.85, 0, { r: 0.7, h: 1.6, col: PINK[1], seed: 52 }); G.bush(k, 5.6, 4.85, 0.4, ["#6a9c3c", "#7fb04a"], 23); G.rock(k, 7.2, 4.9, 0, 0.8, "#8d8a85", 4); G.bush(k, 7.0, 4.65, 0.34, ["#7fb04a"], 24); });
  k.q(4.3, () => { for (const [u, v, s] of [[5.3, 3.3, 0.5], [5.35, 1.4, 0.45], [5.25, 4.4, 0.4]]) G.bush(k, u, v, s, ["#5b8c45", "#6a9a4e", "#7aa856"], Math.round(u * 5 + v)); });
  peopleBack(k);
  k.flush();

  // ===== phase 2: viaduct, train, tunnel mounds, masts (left mound is behind the train, right mound in front)
  G.mound(k, ...LMOUND, t, { portal: true, vc: G.VIA.vt });
  { const [mu, mv, mdu, mdv] = LMOUND; const Z = 3.55;
    G.pine(c, mu + 0.45, mv + 0.8, Z, 0.9, 1, t); G.pine(c, mu + 0.8, mv + 1.3, 3.35, 0.7, 2, t); treeAt(k, mu + 0.6, mv + 0.5, 3.35, { r: 0.5, h: 1.0, col: PINK[0], seed: 61 }); G.pine(c, mu + 0.5, mv + 1.6, 3.35, 0.6, 3, t); }
  G.viaductPiers(k);
  G.viaductDeck(k);
  G.drawTrain(k, t);
  G.viaductFront(k);
  G.masts(k);
  G.mound(k, ...RMOUND, t, {});
  { const [mu, mv] = RMOUND; const Z = 3.55;
    G.pine(c, mu + 0.5, mv + 0.8, Z, 0.85, 4, t); treeAt(k, mu + 0.8, mv + 1.15, 3.35, { r: 0.45, h: 0.95, col: "#86b05a", seed: 62 }); G.pine(c, mu + 0.5, mv + 1.6, 3.35, 0.6, 5, t); }

  // ===== phase 3: front garden (depth sorted)
  const q = (u, v, fn) => k.q(u + v, fn);
  // sakura (left) and willow (back right of the pond)
  q(0.95, 7.9, () => { treeAt(k, 0.95, 7.9, 0, { r: 0.85, h: 1.9, col: PINK[0], seed: 3 }); });
  q(0.85, 9.0, () => { treeAt(k, 0.85, 9.0, 0, { r: 0.6, h: 1.4, col: PINK[2], seed: 9 }); });
  q(9.0, 7.15, () => G.willow(k, t, 9.0, 7.15, { h: 2.3, r: 1.1 }));
  q(3.7, 8.75, () => G.lantern(k, 3.7, 8.75, t));
  // trees under the viaduct
  q(3.9, 5.75, () => { k.tree(3.9, 5.75, { r: 0.5, h: 1.15, col: "#9bb94a", seed: 5 }); });
  q(5.35, 5.7, () => { k.tree(5.35, 5.7, { r: 0.45, h: 1.1, col: "#7fae4c", seed: 6 }); });
  q(6.8, 5.6, () => G.bush(k, 6.8, 5.55, 0.34, ["#7fae4c", "#9bb94a"], 31));
  q(2.7, 5.4, () => G.bush(k, 2.7, 5.35, 0.3, ["#6a9a4e"], 32));
  for (const [u, v, r, leaf, bloom, seed] of FLOW) q(u, v, () => G.flowerBush(k, u, v, r, leaf, bloom, seed, t));
  for (const [u, v, r, s] of BUSH) q(u, v, () => G.bush(k, u, v, r, ["#7fb04a", "#6a9c3c", "#8bbb54"], s));
  for (const [u, v, s] of POND_ROCKS) q(u, v, () => G.rock(k, u, v, 0, s, "#8d8a85", Math.round(u * 3 + v)));
  q(2.2, 8.5, () => { G.rock(k, 1.9, 8.6, 0, 0.9, "#8d8a85", 12); G.rock(k, 2.2, 6.9, 0, 0.7, "#979389", 13); });
  q(3.4, 7.6, () => { G.rock(k, 3.4, 7.6, 0, 0.8, "#8d8a85", 14); });
  q(2.6, 9.0, () => G.fencePosts(k, [[2.62, 9.3], [2.62, 8.85], [2.62, 8.4]]));
  q(2.6, 7.4, () => G.fencePosts(k, [[2.62, 7.7], [2.62, 7.3], [2.62, 6.9]]));
  q(1.7, 7.4, () => G.fencePosts(k, [[1.7, 7.7], [1.7, 7.3], [1.7, 6.9]]));
  if (!SCAT) SCAT = scatter(k);
  SCAT.forEach(([u, v, kind, r], i) => q(u, v, () => {
    if (kind === 0) G.flowerBush(k, u, v, 0.18 + r * 0.14, ["#4f8a3c", "#5f9a44"], [["#f0a0bc", "#f7c0d2"], ["#fff", "#f3eef6"], ["#e83a62", "#f06484"], ["#f3d95a", "#f7e68a"]][i % 4], 100 + i, t);
    else if (kind === 1) G.bush(k, u, v, 0.2 + r * 0.15, ["#7fb04a", "#6a9c3c"], 120 + i);
    else if (kind === 2) G.rock(k, u, v, 0, 0.4 + r * 0.4, "#8d8a85", 140 + i);
    else G.flowerBush(k, u, v, 0.16 + r * 0.1, ["#5b9a3c", "#6aa845"], ["#f4f0f2", "#d0b0e0", "#f3d95a"], 160 + i, t);
  }));

  // bridge unit: far rail + deck, bridge walkers, near fascia + rail
  k.q(14.85, () => {
    G.bridgeBack(k);
    const zf = (u) => (u > G.BR.u0 && u < G.BR.u1 ? G.bridgeZ(u) : 0);
    const items = [];
    const walk = (route, o) => { const s = k.walkerState(route, o); items.push([s.u + s.v, () => G.zWalker(k, route, o, zf)]); };
    walk(R_BR1, { speed: 0.5, offset: 0, seed: 801, dwell: 1.6, ...OUT.hiker });
    walk(R_BR2, { speed: 0.42, offset: 0.55, seed: 802, dwell: 1.4, ...OUT.kimono });
    items.push([6.2 + 8.3, () => k.person(6.2, 8.3, { pose: "stand", dir: [0.3, 1], seed: 840, z: G.bridgeZ(6.2), style: "shirt", top: "#f3d56a", bottom: "#353b4d", hat: null, hairStyle: "short" })]);
    items.sort((a, b) => a[0] - b[0]); for (const it of items) it[1]();
    G.bridgeFront(k);
  });
  // people
  const W = (route, o) => k.qwalker(route, o);
  W(R_PATH_UP, { speed: 0.42, offset: 0.0, seed: 803, dwell: 1.6, ...OUT.hiker });
  W(R_PATH_DN, { speed: 0.36, offset: 0.55, seed: 804, dwell: 1.4, ...OUT.sun });
  W(R_KID, { speed: 0.3, offset: 0.2, seed: 805, dwell: 1.2, kid: true, style: "shirt", top: "#e8c14a", bottom: "#2e3d5c", hat: null });
  W(R_BANK, { speed: 0.3, offset: 0.0, seed: 806, dwell: 1.6, style: "shirt", top: "#c6574a", bottom: "#2f3a52", hat: null, hairStyle: "short" });
  W(R_FRONT, { speed: 0.34, offset: 0.35, seed: 807, dwell: 1.7, ...OUT.kimono, top: "#f3d56a", bottom: "#d98a3c" });
  q(3.9, 9.05, () => k.person(3.95, 9.05, { pose: "photo", dir: [1, -0.4], seed: 808, ...OUT.photo }));
  q(1.4, 8.4, () => k.person(1.4, 8.4, { pose: "stand", dir: [0.9, 0.3], seed: 809, style: "dress", top: "#c9567a", bottom: "#f5e3e8", hairStyle: "bun", hat: null }));
  k.flush();

  // petals over the sakura, the willow side and the hill
  G.petals(k, t, 0.5, 1.9, 7.2, 8.7, 2.3, 22, { seed: 3, T: 8 });
  G.petals(k, t, 8.3, 9.5, 8.2, 9.4, 1.6, 12, { seed: 6, T: 9, col: "#f4c6d4" });
  G.petals(k, t, 8.2, 9.4, 0.6, 1.6, 2.6, 12, { seed: 8, T: 10 });
  // birds over Fuji, orbit kept inside the footprint
  for (let b = 0; b < 3; b++) { const a = t * 0.35 + b * 0.6, [x, y] = P(3.0 + Math.cos(a) * 1.7, 2.9 + Math.sin(a) * 1.4, 6.6 + 0.3 * Math.sin(a * 2 + b)); k.bird(x, y, { phase: b * 1.7, size: 0.85 - b * 0.1 }); }
}
