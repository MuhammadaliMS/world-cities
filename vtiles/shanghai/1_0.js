// SHANGHAI · 1,0 · Maglev viaduct (grid pass). Axis-aligned glazed barrel-vault terminal (axis along u) at u 0.7-5.6, v 2-4.8;
// the guideway runs along u at v 3.05-3.75 on T-piers: out of the hall portal, across the back lawn, into a stone end block.
// Stream with willows along the back edge, luggage plaza in front. Everything inside 0.3..9.7.
import { P, INK, shade, lerp, rng } from "./_props.js";
import { H, BEAM, SHED, beam, tpier, shed, drawTrain, hallInterior, hallRoof, hallLeft, hallDoors, hallEnd, suitcase, duck, willow } from "./_g1_0.js";

export const camera = { u: 4.9, v: 4.0, z: 2.4, zoom: 1.45 };

const STREAM = [[0.9, 0.85], [9.1, 0.85], [9.4, 1.05], [9.4, 1.5], [9.1, 1.75], [0.9, 1.75], [0.6, 1.5], [0.6, 1.05]];
const LAWN_BACK = [[0.5, 0.45], [9.5, 0.45], [9.5, 0.85], [0.5, 0.85]];
const LAWN_MID = [[0.5, 1.8], [9.5, 1.8], [9.5, 4.8], [0.5, 4.8]];
const BED_L = [[0.6, 8.9], [8.9, 8.9], [8.9, 5.3], [9.6, 5.3], [9.6, 9.6], [0.6, 9.6]];

const PINK = ["#f08bb5", "#e8607a", "#ffffff", "#f6b4cf"], YEL = ["#f4c542", "#e9813c", "#fbe17a"], PUR = ["#8e7ad8", "#a89be6", "#6a5bc0"];

export default function draw(k, t) {
  const c = k.ctx;
  // ---------- ground ----------
  k.groundTrace({ lawn: [LAWN_BACK, LAWN_MID], water: [STREAM] }, { lawn: "#8fb85a", paved: "#ecdcc4", side: "#dec8a2", water: "#52bdb0", tufts: 12, stipple: 5 });
  k.ground(STREAM, null, { stroke: "#b9ae92", lw: 3 });
  // plaza paving + pavers
  k.ground([[0.3, 4.85], [9.7, 4.85], [9.7, 9.7], [0.3, 9.7]], "#efdfc6", { stroke: false });
  for (let s = 5.0; s < 9.7; s += 0.5) k.line3([[0.3, s], [9.7, s]], { stroke: "rgba(150,115,90,0.22)", lw: 0.9, wobble: 0 });
  for (let s = 0.5; s < 9.7; s += 0.5) k.line3([[s, 4.85], [s, 9.7]], { stroke: "rgba(150,115,90,0.22)", lw: 0.9, wobble: 0 });
  // hall plinth + shadows
  k.ground([[H.u0 - 0.12, H.v0 - 0.12], [H.u1 + 0.12, H.v0 - 0.12], [H.u1 + 0.12, H.v1 + 0.12], [H.u0 - 0.12, H.v1 + 0.12]], "#d9d2c3", { lw: 1.1 });
  k.shadow([[H.u1 + 0.12, H.v0, 0], [H.u1 + 1.2, H.v0 + 0.3, 0], [H.u1 + 1.2, H.v1 + 0.3, 0], [H.u1 + 0.12, H.v1, 0]], 0.1);
  k.shadow([[6.0, 3.95, 0], [9.0, 3.95, 0], [9.0, 4.55, 0], [6.0, 4.55, 0]], 0.08);
  // beds
  k.ground([[0.5, 8.8], [9.0, 8.8], [9.0, 5.2], [9.7, 5.2], [9.7, 9.7], [0.5, 9.7]], "#e7dcc3", { lw: 1.3 });
  k.ground(BED_L, "#5f8f48", { stroke: false });
  // bank stones
  for (let u = 0.9; u < 9.0; u += 0.62) { k.box(u, 0.7, 0, 0.34, 0.15, 0.12, ["#cfc7b4", "#bfb7a4", "#d9d2c1"][Math.round(u * 5) % 3], { shadow: false, hatch: false }); }
  for (let u = 0.9; u < 9.0; u += 0.62) { k.box(u + 0.2, 1.75, 0, 0.34, 0.18, 0.12, ["#bfb7a4", "#d9d2c1", "#cfc7b4"][Math.round(u * 7) % 3], { shadow: false, hatch: false }); }
  // ducks on the stream
  [[0.2, 1.2, 0], [0.6, 1.5, 1], [0.9, 1.0, 2]].forEach(([ph, v, sd]) => {
    const w = Math.sin(t * 0.22 + ph * 6.28 + sd), u = 4.8 + 3.7 * w, dir = Math.cos(t * 0.22 + ph * 6.28 + sd);
    duck(k, u, v, dir, t, sd);
  });
  // back willows (behind the hall, drawn first)
  [[2.2, 0.58, 1.8, 4], [5.9, 0.58, 1.8, 6], [8.8, 0.58, 1.7, 8]].forEach(([u, v, h, s]) => willow(k, u, v, h, s, ["#abc944", "#a4c63e", "#a6c63f"][s % 3]));
  // back-lawn shrubs
  [[0.8, 0.5, 5], [4.0, 0.5, 3], [7.4, 0.5, 4]].forEach(([u, v, s]) => k.hedge(u, v, 0.6, 0.35, { h: 0.5, col: s % 2 ? "#4f8c42" : "#5f9a3e" }));

  // ---------- the terminal hall (before everything else in the sort) ----------
  k.q(0, () => {
    hallInterior(k);
    // two columns of the guideway inside the hall, then the deck, then the train inside
    tpier(k, 2.0); tpier(k, 4.1);
    beam(k, 0.95, H.u1);
    drawTrain(k, t, -1e9, H.u1);
    // concourse people behind the glass
    [[[[1.1, 4.3], [2.6, 4.35], [4.0, 4.3], [5.2, 4.35]], 0.0, 301, 0.3], [[[1.3, 4.4], [2.4, 4.4], [3.4, 4.4]], 0.5, 302, 0.28], [[[5.3, 4.2], [4.2, 4.2], [3.2, 4.25], [2.0, 4.2]], 0.3, 303, 0.32]].forEach(([r, off, seed, sp]) => k.walker(r, { speed: sp, offset: off, seed, dwell: 1.2 }));
    k.person(4.7, 4.55, { pose: "stand", dir: [0.3, 1], seed: 304 }); k.person(1.6, 3.95, { pose: "stand", dir: [1, 0.2], seed: 305 });
    hallRoof(k, t);
    hallLeft(k);
    hallEnd(k);
    hallDoors(k, t);
  });

  // ---------- guideway outside the hall: piers, deck, train, end block ----------
  k.q(1.0, () => { tpier(k, 6.7); });
  k.q(1.1, () => beam(k, H.u1, SHED.u0 + 0.05));
  k.q(1.2, () => drawTrain(k, t, H.u1, 1e9));
  k.q(1.3, () => shed(k, t));

  // back-lawn life (behind the guideway)
  const bank = [[5.9, 2.35], [7.4, 2.4], [8.9, 2.35]];
  k.q(0.5, () => k.walker(bank, { speed: 0.3, offset: 0.1, seed: 311, dwell: 1.5 }));
  k.q(0.5, () => k.walker([[8.6, 2.25], [7.0, 2.3], [6.0, 2.25]], { speed: 0.28, offset: 0.4, seed: 312, dwell: 1.8 }));
  k.q(0.45, () => k.hedge(6.1, 2.6, 0.7, 0.3, { h: 0.5, col: "#4f8c42" }));
  k.q(0.45, () => k.hedge(9.0, 2.6, 0.5, 0.3, { h: 0.5, col: "#5f9a3e" }));
  // flower strip + hedges along the front of the lawn under the viaduct
  k.q(10.0, () => k.tree(9.0, 3.6, { r: 0.6, h: 1.5, col: "#e6a0c0", seed: 21 }));
  k.q(10.5, () => k.flowers(5.9, 4.2, 2.6, 0.45, { cols: YEL.concat(PINK), seed: 41 }));

  // ---------- plaza ----------
  // raised planters beside the door
  const planter = (u, v, du, dv, seed) => k.q(u + v + dv, () => {
    k.box(u, v, 0, du, dv, 0.28, "#e9e4da", { shadow: false, hatch: false });
    k.hedge(u + 0.04, v + 0.04, du - 0.08, dv - 0.08, { h: 0.9, col: seed % 2 ? "#4f8c42" : "#5f9a3e" });
  });
  planter(1.1, 5.2, 0.95, 0.5, 1); planter(4.5, 5.2, 0.95, 0.5, 2);
  // pink flowering trees
  k.q(1.4 + 6.3, () => k.tree(1.4, 6.3, { r: 0.65, h: 1.6, col: "#e993b9", seed: 9 }));
  k.q(8.3 + 5.4, () => k.tree(8.3, 5.4, { r: 0.62, h: 1.5, col: "#e6a0c0", seed: 10 }));
  // front beds (flower strips) and willows
  for (let u = 0.8; u < 8.4; u += 1.3) k.q(u + 9.0 + 0.5, () => k.flowers(u, 9.0, 1.4, 0.55, { cols: [PUR, PINK, YEL, PINK, YEL, PUR][Math.round(u / 1.3) % 6], seed: Math.round(u * 10) }));
  for (let v = 5.6; v < 8.8; v += 1.3) k.q(9.0 + v + 0.5, () => k.flowers(9.0, v, 0.55, 1.4, { cols: [PINK, YEL, PUR][Math.round(v / 1.3) % 3], seed: Math.round(v * 10) + 7 }));
  k.q(1.5 + 9.1 + 0.6, () => willow(k, 1.5, 9.1, 1.9, 11, "#a9c944"));
  k.q(9.15 + 6.4 + 0.6, () => willow(k, 9.15, 6.4, 1.9, 13, "#a8c840"));
  k.q(5.4 + 9.2 + 0.6, () => k.tree(5.4, 9.25, { r: 0.55, h: 1.3, col: "#d777a4", seed: 14 }));
  // bollards, lamps, benches
  [[0.8, 6.6], [0.8, 7.9], [8.5, 8.4], [6.3, 5.15]].forEach(([u, v]) => k.q(u + v, () => k.box(u, v, 0, 0.16, 0.16, 0.55, "#9aa1a8", { shadow: true, hatch: false })));
  [[5.4, 5.4], [8.4, 7.9], [1.0, 8.0]].forEach(([u, v]) => k.q(u + v, () => k.lamp(u, v, { col: "#3a4048", lit: 0.5 + 0.2 * Math.sin(t * 1.2 + u) })));
  const BENCH = [[2.6, 8.45, 321], [6.6, 8.45, 322]];
  BENCH.forEach(([u, v, seed], i) => {
    k.q(u + v + 0.1, () => k.bench(u, v, { along: "u" }));
    k.qperson(u + 0.42, v + 0.18, { pose: "sit", bench: true, seatZ: 0.3, dir: [0.1, 1], seed, shadow: false });
    if (i === 1) k.qperson(u + 0.62, v + 0.2, { pose: "sit", bench: true, seatZ: 0.3, dir: [0.1, 1], seed: seed + 5, shadow: false });
  });

  // ---------- people ----------
  const R = {
    r1: [[3.1, 5.7], [3.5, 6.5], [4.6, 7.3], [6.0, 7.8], [7.4, 8.0]],
    r2: [[8.3, 6.3], [7.2, 6.0], [5.8, 5.9], [4.4, 5.85], [3.5, 5.6]],
    r3: [[1.2, 6.8], [1.9, 6.1], [2.8, 5.7], [3.2, 5.55]],
    r4: [[2.2, 7.9], [2.6, 7.0], [3.0, 6.3], [3.3, 5.7]],
    r5: [[4.0, 8.0], [5.2, 7.7], [6.5, 7.0], [7.8, 6.5]],
    r6: [[1.4, 8.05], [3.0, 8.1], [5.0, 8.15], [7.0, 8.2], [8.3, 8.2]],
    r7: [[8.2, 5.7], [8.2, 6.8], [8.2, 7.9]],
    r8: [[6.2, 5.45], [7.0, 5.4], [8.0, 5.45]],
  };
  const lug = (route, off, seed, col, speed = 0.42) => {
    const o = { speed, offset: off, dwell: 1.4, seed }, st = k.walkerState(route, o);
    k.q(st.u + st.v + 0.05, () => { k.walker(route, o); suitcase(k, st, col); });
  };
  lug(R.r1, 0.05, 71, "#c9382f"); lug(R.r1, 0.55, 72, "#2f5fc0"); lug(R.r2, 0.2, 73, "#e0a83a"); lug(R.r2, 0.7, 74, "#3a8a5a");
  lug(R.r3, 0.1, 75, "#7a4ea8"); lug(R.r4, 0.35, 76, "#c9382f"); lug(R.r5, 0.3, 77, "#2f5fc0");
  const free = (route, off, seed, extra = {}) => k.qwalker(route, { speed: 0.38, offset: off, seed, dwell: 1.2, ...extra });
  free(R.r6, 0.1, 79); free(R.r6, 0.7, 80); free(R.r7, 0.4, 81); free(R.r8, 0.85, 82); free(R.r8, 0.2, 83); free(R.r5, 0.8, 84, { kid: true });
  k.qperson(5.2, 7.05, { pose: "photo", dir: [-0.3, -1], seed: 90 }); k.qperson(5.5, 7.15, { pose: "stand", dir: [-0.3, -1], seed: 91 });
  k.qperson(7.5, 7.35, { pose: "stand", dir: [0.4, -1], seed: 92 }); k.qperson(7.8, 7.45, { pose: "stand", dir: [-0.4, -1], seed: 93, kid: true });
  k.qperson(2.0, 6.7, { pose: "wave", dir: [0.2, -1], seed: 94 }); k.qperson(6.1, 6.15, { pose: "stand", dir: [0, 1], seed: 95 });
  // suitcases parked beside the standing travellers
  [[5.0, 7.25, "#e0a83a"], [7.35, 7.5, "#3a8a5a"]].forEach(([u, v, col]) => k.q(u + v + 0.1, () => { const [x, y] = P(u, v, 0); c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.rect(x - 4.5, y - 13, 9, 13); c.fill(); c.stroke(); }));
  k.flush();

  // sky life
  k.circlingBird(430, 190, 90, 22, { speed: 0.6, phase: 0 }); k.circlingBird(620, 250, 60, 18, { speed: -0.5, phase: 2 });
}
