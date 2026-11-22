// PARIS · -1,0 · Canal Saint-Martin (grid pass). The canal runs along v through the middle of the tile (u 3.7..6.3), ends INSIDE the
// tile at a basin wall (v 1.4) and at the lock (gates v 6.9, lower gate v 8.95). Two green iron footbridges cross it along u, a barge
// waits, passes the lock (gates open, water drops and rises), reverses out, turns round and goes back. Haussmann rows on the left
// edge (u 0.35..2.0) and the back-right corner, a lock-keeper's house, plane trees, café terraces. Pure function of t.
import { P, INK, shade, lerp, clamp, rng } from "../../lib/vec-kit.js";
import { facade, frustums, dormer, smoke, pigeon, flock } from "./_props.js";
import {
  WZ, GREEN, smooth, prism, planeTree, chimneyStack, awningG, shopFrontG, ivyG, flowerBoxes, bankWall, coping, waterTexture, cobbleField,
  windlass, gateLeaf, ironRail, foam, makeBridge, barge, bistro, wicker, bollard, pot, picnic, plane,
} from "./_g-1_0.js";

const PAVE = "#dac5aa", STONE = "#dcc9a0";
const CU0 = 3.7, CU1 = 6.3, CV0 = 1.4, HV = 6.9, CV1 = 8.95; // canal, gate hinges, lower gate
const LOW = 0.45; // how far the lock chamber drops

// ---------- barge schedule (period 54 s) ----------
const PER = 54, V_BACK = 2.55, V_WAIT = 4.7, V_LOCK = 7.9, V_MID = 4.65;
const SEG = [
  [0, 6, V_BACK, V_WAIT, 0, 0], [6, 10.5, V_WAIT, V_WAIT, 0, 0], [10.5, 17, V_WAIT, V_LOCK, 0, 0], [17, 28, V_LOCK, V_LOCK, 0, 0],
  [28, 35, V_LOCK, V_MID, 0, 0], [35, 39, V_MID, V_MID, 0, Math.PI], [39, 46, V_MID, V_BACK, Math.PI, Math.PI],
  [46, 50, V_BACK, V_BACK, Math.PI, 2 * Math.PI], [50, 54, V_BACK, V_BACK, 2 * Math.PI, 2 * Math.PI],
];
function bargeState(t) {
  const tt = ((t % PER) + PER) % PER;
  let v = V_BACK, th = 0, fwd = false;
  for (const [a, b, v0, v1, h0, h1] of SEG) if (tt >= a && tt < b) { const f = smooth((tt - a) / (b - a)); v = lerp(v0, v1, f); th = lerp(h0, h1, f); fwd = (v1 - v0) * Math.cos(h0) > 0.01 && f > 0.02 && f < 0.98; }
  const ramp = (a, b) => smooth((tt - a) / (b - a));
  const g = ramp(7.5, 10.5) - ramp(17, 19.5) + ramp(25.5, 28) - ramp(33, 35.5);
  const lv = ramp(19.5, 22.5) - ramp(22.5, 25.5);
  return { v, th, g: clamp(g), lv: clamp(lv), moving: fwd, tt };
}

// ---------- Haussmann block on the left edge: right face (u = U1) is the street facade ----------
const U0 = 0.35, U1 = 2.0;
function leftBlock(k, t, v0, v1, H, col, seed, o = {}) {
  k.box(U0, v0, 0, U1 - U0, v1 - v0, H, col, { hatch: false, shadow: true, noTop: true });
  const gl = "#667a86";
  const floors = [
    { z0: 0.25, z1: 2.0, w: 0.34, glass: "#6f6252", lit: 0.3, shutters: "#6d8374" },
    { z0: 2.45, z1: 3.5, w: 0.3, balcony: true, ped: "alt", lit: 0.18, shutters: "#8a9b8c", glass: gl },
    { z0: 3.72, z1: H - 0.3, w: 0.28, lit: 0.18, shutters: "#8a9b8c", glass: gl },
  ];
  const bands = [[2.25, 0.1, 0.09], [3.6, 0.07, 0.07], [H - 0.2, 0.2, 0.12]];
  facade(k, { side: "R", c: U1, s0: v0, s1: v1, z1: H, col, bay: 0.66, floors, bands, seed });
  facade(k, { side: "L", c: v1, s0: U0, s1: U1, z1: H, col: shade(col, 0.02), bay: 0.7, floors: floors.map((f) => ({ ...f, lit: 0.1 })), bands, seed: seed + 1 });
  flowerBoxes(k, "R", U1, v0, v1, 2.62);
  frustums(k, U0 - 0.04, v0 - 0.04, U1 - U0 + 0.08, v1 - v0 + 0.08, H + 0.1, [[0, 0], [0.05, 0.3], [0.25, 0.8], [0.45, 1.05]], o.slate || "#6f7f98", { n: 4 });
  const nV = Math.max(2, Math.round((v1 - v0) / 0.85));
  for (let i = 0; i < nV; i++) dormer(k, U1 - 0.12, v0 + 0.45 + (i * (v1 - v0 - 0.9)) / Math.max(1, nV - 1), H + 0.3, { w: 7, h: 10, roof: "#48566c", frame: shade(col, -0.12), lit: (i + seed) % 3 === 0 });
  for (let i = 0; i < 3; i++) dormer(k, U0 + 0.4 + i * 0.5, v1 - 0.12, H + 0.3, { w: 6, h: 9, roof: "#48566c", frame: shade(col, -0.12), lit: false });
  for (const [a, b] of o.chim || []) chimneyStack(k, a, b, H + 0.75, o.ch || 0.8);
  if (o.smoke) smoke(k, o.chim[0][0] + 0.21, o.chim[0][1] + 0.21, H + 1.7, seed);
}

// ---------- back-right corner block: left face (v = V1) carries the café ----------
const RU0 = 7.0, RU1 = 9.7, RV0 = 0.3, RV1 = 2.3, RH = 5.2;
function rightBlock(k, t) {
  const col = "#e8d9b8", gl = "#667a86";
  k.box(RU0, RV0, 0, RU1 - RU0, RV1 - RV0, RH, col, { hatch: false, shadow: false, noTop: true });
  const fl = [
    { z0: 2.45, z1: 3.5, w: 0.32, balcony: true, ped: "alt", lit: 0.25, shutters: "#8a9b8c", glass: gl },
    { z0: 3.72, z1: RH - 0.3, w: 0.3, lit: 0.2, shutters: "#8a9b8c", glass: gl },
  ];
  const bands = [[2.25, 0.1, 0.09], [3.6, 0.07, 0.07], [RH - 0.2, 0.2, 0.12]];
  facade(k, { side: "L", c: RV1, s0: RU0, s1: RU1, z1: RH, col, bay: 0.68, floors: [{ z0: 0.25, z1: 2.0, w: 0.4, glass: "#6f6252", lit: 0.3 }, ...fl], bands, seed: 5 });
  facade(k, { side: "R", c: RU1, s0: RV0, s1: RV1, z1: RH, col, bay: 0.66, floors: [{ z0: 0.25, z1: 2.0, w: 0.34, glass: "#6f6252", lit: 0.3, shutters: "#6d8374" }, ...fl], bands, seed: 6 });
  flowerBoxes(k, "L", RV1, RU0, RU1, 2.62, 0.68);
  frustums(k, RU0 - 0.04, RV0 - 0.04, RU1 - RU0 + 0.08, RV1 - RV0 + 0.08, RH + 0.1, [[0, 0], [0.05, 0.3], [0.25, 0.85], [0.45, 1.1]], "#6f7f98", { n: 4 });
  for (let i = 0; i < 3; i++) dormer(k, RU0 + 0.5 + i * 0.95, RV1 - 0.12, RH + 0.3, { w: 7, h: 10, roof: "#48566c", frame: "#d9c9a0", lit: i === 1 });
  for (let i = 0; i < 2; i++) dormer(k, RU1 - 0.12, RV0 + 0.5 + i * 0.9, RH + 0.3, { w: 7, h: 10, roof: "#3e4b64", frame: "#cdb98c", lit: i === 0 });
  chimneyStack(k, 8.0, 0.8, RH + 0.8, 0.9); chimneyStack(k, 9.0, 1.3, RH + 0.8, 0.8);
  smoke(k, 8.21, 1.01, RH + 1.8, 7);
  shopFrontG(k, t, "L", RV1, RU0 + 0.3, RU1 - 0.3, { frame: "#3a2c24", glass: "#7d6a52", goods: ["#e8d8a0", "#d9954a", "#c27a35"], sign: "#7a2f2a", signText: "#f1dca0", text: "CAFE DES ECLUSES" });
}

// ---------- lock keeper's house ----------
const HU = 8.5, HV0 = 6.3, HDU = 1.0, HDV = 1.7, HH = 2.2;
function lockHouse(k, t) {
  const col = "#e6d6b0";
  k.box(HU, HV0, 0, HDU, HDV, HH, col, { hatch: false, shadow: true, noTop: true });
  const fl = [{ z0: 0.2, z1: 1.45, w: 0.5, glass: "#5d6e78", shutters: "#4d7a62", lit: 0.4 }];
  facade(k, { side: "L", c: HV0 + HDV, s0: HU, s1: HU + HDU, z1: HH, col, bay: 0.5, floors: [{ z0: 0.2, z1: 1.55, w: 0.5, glass: "#5d6e78", shutters: "#4d7a62", lit: 0.5 }, { z0: 1.7, z1: 2.05, w: 0.4, glass: "#5d6e78", lit: 0 }], bands: [[HH - 0.12, 0.12, 0.08]], seed: 12, pilasters: false });
  facade(k, { side: "R", c: HU + HDU, s0: HV0, s1: HV0 + HDV, z1: HH, col, bay: 0.55, floors: fl, bands: [[HH - 0.12, 0.12, 0.08]], seed: 13, pilasters: false });
  k.gable(HU - 0.08, HV0 - 0.08, HH, HDU + 0.16, HDV + 0.16, 0.85, "#b8583c", { ridge: "v" });
  chimneyStack(k, HU + 0.2, HV0 + 0.25, HH + 0.45, 0.55, 0.3);
  smoke(k, HU + 0.35, HV0 + 0.4, HH + 1.1, 3);
  const c = k.ctx, [sx, sy] = P(HU + HDU / 2, HV0 + HDV + 0.002, 1.8);
  c.save(); c.translate(sx, sy); c.transform(1, 0.577, 0, 1, 0, 0); c.fillStyle = "#24402f"; c.fillRect(-26, -5, 52, 11); c.strokeStyle = INK; c.lineWidth = 0.8; c.strokeRect(-26, -5, 52, 11); c.fillStyle = "#f1dca0"; c.font = "bold 8px Georgia, serif"; c.textAlign = "center"; c.fillText("ECLUSE", 0, 3); c.restore();
}

// ---------- the ground (everything inside the diamond) ----------
function ground(k, t, bs) {
  const c = k.ctx;
  k.slab(PAVE);
  // canal walls: left bank (face looks toward +u), basin wall (face looks toward +v)
  bankWall(k, [[CU0, CV0], [CU0, CV1]], shade(STONE, -0.2), 0, -1.0);
  bankWall(k, [[CU0, CV0], [CU1, CV0]], shade(STONE, -0.1), 0, WZ);
  // upstream water, lock sill, chamber water (it drops and rises)
  const WA = [[CU0, CV0], [CU1, CV0], [CU1, HV], [CU0, HV]];
  k.ground(WA, "#4f9d9a", { z: WZ, stroke: false });
  waterTexture(k, t, WA, WZ, 11);
  bankWall(k, [[CU0, HV], [CU1, HV]], shade(STONE, -0.25), WZ, -1.0);
  const wc = WZ - LOW * bs.lv, WC = [[CU0, HV], [CU1, HV], [CU1, CV1], [CU0, CV1]];
  k.ground(WC, "#4f9d9a", { z: wc, stroke: false });
  waterTexture(k, t + 3, WC, wc, 23, [0, 0.3]);
  // paving on both banks, behind and in front of the lock (drawn after the water so low water never spills over it)
  const dry = [[[0, 0], [CU0, 0], [CU0, 10], [0, 10]], [[CU1, 0], [10, 0], [10, 10], [CU1, 10]], [[CU0, 0], [CU1, 0], [CU1, CV0], [CU0, CV0]], [[CU0, CV1], [CU1, CV1], [CU1, 10], [CU0, 10]]];
  dry.forEach((poly, i) => { k.ground(poly, PAVE, { stroke: false }); cobbleField(k, poly, i < 2 ? 1500 : 250, 40 + i); });
  c.strokeStyle = "rgba(100,75,40,0.2)"; c.lineWidth = 0.8; c.beginPath();
  for (let u = 0.35; u < 10; u += 0.65) if (u < CU0 - 0.2 || u > CU1 + 0.2) { c.moveTo(...P(u, 0.3, 0)); c.lineTo(...P(u, 9.7, 0)); }
  for (let v = 0.35; v < 10; v += 0.65) { if (v > CV0 - 0.1 && v < CV1 + 0.1) { c.moveTo(...P(0.3, v, 0)); c.lineTo(...P(CU0 - 0.2, v, 0)); c.moveTo(...P(CU1 + 0.2, v, 0)); c.lineTo(...P(9.7, v, 0)); } else { c.moveTo(...P(0.3, v, 0)); c.lineTo(...P(9.7, v, 0)); } }
  c.stroke();
  // coping stones along the edges
  coping(k, [[CU0 - 0.06, CV0 - 0.06], [CU0 - 0.06, CV1 + 0.04]]); coping(k, [[CU1 + 0.06, CV0 - 0.06], [CU1 + 0.06, CV1 + 0.04]]);
  coping(k, [[CU0 - 0.06, CV0 - 0.06], [CU1 + 0.06, CV0 - 0.06]]);
}

function lowerGate(k, t, bs) {
  // closed wooden gate with a walkway on top, foam spilling in front of it
  k.box(CU0, CV1 - 0.05, -0.6, CU1 - CU0, 0.25, 1.0, "#6a4a2e", { hatch: false, shadow: false, left: "#7a5638", right: "#5a3e26", top: "#8a6a44" });
  const c = k.ctx; c.strokeStyle = "rgba(25,14,6,0.65)"; c.lineWidth = 0.9; c.beginPath();
  for (let i = 1; i < 12; i++) { const u = lerp(CU0, CU1, i / 12); c.moveTo(...P(u, CV1 + 0.23, -0.9)); c.lineTo(...P(u, CV1 + 0.23, 0.45)); }
  c.stroke();
  ironRail(k, [[CU0 + 0.05, CV1 + 0.2], [CU1 - 0.05, CV1 + 0.2]], 0.55 + 0.0);
  const dz = LOW * bs.lv, rate = Math.abs(Math.sin(Math.PI * clamp((bs.tt - 19.5) / 3)) * (bs.tt > 19.5 && bs.tt < 22.5 ? 1 : 0)) + Math.abs(Math.sin(Math.PI * clamp((bs.tt - 22.5) / 3)) * (bs.tt > 22.5 && bs.tt < 25.5 ? 1 : 0));
  foam(k, t, CU0 + 0.15, CU1 - 0.15, CV1 - 0.02, WZ - dz + 0.02, 0.35 + 0.65 * rate, 1);
}

function upperGates(k, t, bs) {
  const a = lerp(-0.333, 1.49, smooth(bs.g)), Lf = 1.38, z0 = -0.95, z1 = 0.45;
  k.q(CU0 + HV + 0.6, () => gateLeaf(k, CU0 + 0.1, HV, a, false, Lf, z0, z1));
  k.q(CU1 + HV + 0.6, () => gateLeaf(k, CU1 - 0.1, HV, a, true, Lf, z0, z1));
  // windlasses at each hinge
  k.q(CU0 + HV + 0.3, () => windlass(k, t, ...P(CU0 - 0.45, HV + 0.05, 0), bs.g));
  k.q(CU1 + HV + 0.3, () => windlass(k, t, ...P(CU1 + 0.45, HV + 0.05, 0), bs.g));
  // a little spill at the apex while closed
  k.q(5 + HV + 0.7, () => foam(k, t, 4.75, 5.25, HV - 0.4, WZ, 0.5 * (1 - bs.g), 5));
}

// ---------- people routes (u,v) ----------
const R = (...pts) => pts;
const ROUTES = {
  LA: R([3.0, 0.95], [3.0, 2.6]), LB: R([3.02, 3.75], [3.02, 5.45]), LC: R([3.0, 6.5], [3.0, 8.6]),
  B1: R([2.4, 1.05], [6.8, 1.05]), B2: R([6.7, 1.1], [3.6, 1.1]),
  RW: R([7.3, 3.6], [7.3, 8.5]), RW2: R([7.15, 8.4], [7.15, 3.7]),
  F1: R([4.0, 9.4], [6.0, 9.4]),
  bike: R([7.8, 3.6], [7.8, 8.4]),
};

export default function draw(k, t) {
  const c = k.ctx, bs = bargeState(t);
  ground(k, t, bs);
  ironRail(k, [[CU0 - 0.14, HV - 0.5], [CU0 - 0.14, CV1 - 0.2]], 0.62); ironRail(k, [[CU1 + 0.14, HV - 0.5], [CU1 + 0.14, CV1 - 0.2]], 0.62);
  // left row: depth by the block's back so terraces on the quay sort in front
  k.q(0.4 + 0.1, () => {
    leftBlock(k, t, 0.35, 3.2, 4.6, "#e7d8b5", 3, { chim: [[0.6, 1.0], [0.6, 2.4]], ch: 1.0, smoke: true });
    shopFrontG(k, t, "R", U1, 0.85, 2.7, { frame: "#5a3a24", glass: "#7d5a35", goods: ["#d9954a", "#c27a35", "#e8b868", "#b8652c"], sign: "#2f4a3c", signText: "#f1dca0", text: "BOULANGERIE" });
  });
  k.q(3.3 + 0.1, () => {
    leftBlock(k, t, 3.2, 6.1, 4.0, "#e9dcc0", 8, { chim: [[0.6, 3.6], [0.6, 5.3]], ch: 0.85, slate: "#76849a" });
    shopFrontG(k, t, "R", U1, 3.6, 5.7, { frame: "#2f5a45", glass: "#6a5a40", goods: ["#e8d8a0", "#d9954a"], sign: "#24402f", signText: "#f1dca0", text: "CAFE DU CANAL" });
    ivyG(k, "R", U1 + 0.04, 6.0, 0.6, 3.2, 5);
  });
  k.q(6.2 + 0.1, () => {
    leftBlock(k, t, 6.1, 9.1, 4.8, "#e6d4ac", 13, { chim: [[0.6, 6.6], [0.6, 8.2]], ch: 0.8, slate: "#7a889d", smoke: true });
    shopFrontG(k, t, "R", U1, 6.5, 8.7, { frame: "#6a3a52", glass: "#6a5a50", goods: ["#e8607a", "#f4c542", "#f39ac0", "#8fc060"], sign: "#4a2a3a", signText: "#f6dce6", text: "FLEURS" });
  });
  // awnings (after the people beneath them)
  k.q(2.5 + 1.7 + 0.85, () => awningG(k, t, "R", U1, 0.85, 1.85, "#d9503f", "#f6e1c0", 2.35, 0.8, 1));
  k.q(2.5 + 4.65 + 0.6, () => awningG(k, t, "R", U1, 3.6, 2.1, "#4d7a62", "#ecebd0", 2.6, 0.95, 2));
  k.q(2.5 + 7.6 + 0.6, () => awningG(k, t, "R", U1, 6.5, 2.2, "#c9627e", "#f6e6ec", 2.4, 0.8, 3));
  // right corner block
  k.q(RU0 + RV0 + 0.1, () => rightBlock(k, t));
  k.q(RU0 + 3.0 + 1.5, () => awningG(k, t, "L", RV1, RU0 + 0.3, 2.1, "#b8402f", "#f6e1c0", 2.35, 0.85, 4));
  // lock keeper's house
  k.q(HU + HV0 + 0.2, () => lockHouse(k, t));
  // lock
  k.q(CU0 + CV1 + 0.2, () => lowerGate(k, t, bs));
  upperGates(k, t, bs);
  // lamps along the quay edges
  for (const [u, v] of [[3.5, 2.45], [3.5, 5.25], [3.5, 8.3], [6.5, 2.4], [6.5, 5.3], [6.5, 8.3]]) k.q(u + v + 0.2, () => k.lamp(u, v, { col: GREEN, h: 3.4 }));
  // bollards on the coping
  for (const [u, v] of [[3.62, 1.7], [3.62, 4.25], [3.62, 4.95], [3.62, 8.5], [6.38, 1.8], [6.38, 4.4], [6.38, 7.3], [6.38, 8.6], [4.3, 1.5], [5.7, 1.5]]) k.q(u + v, () => bollard(k, u, v));
  // pots by the doors
  for (const [u, v] of [[2.2, 3.55], [2.2, 5.8], [2.2, 6.4], [2.2, 8.8], [2.2, 0.8], [7.1, 2.5], [9.5, 2.5]]) k.q(u + v + 0.1, () => pot(k, u, v));
  // café terraces: table + two chairs, two patrons
  const terr = [[2.45, 3.95, "#c9402f"], [2.45, 4.8, "#e8c14a"], [2.45, 5.4, "#3f6fb8"], [2.45, 1.75, "#c9402f"], [7.9, 2.8, "#e8c14a"], [8.9, 2.8, "#3f6fb8"]];
  terr.forEach(([u, v, col], i) => {
    k.q(u + v, () => bistro(k, u, v, t, i, col));
    k.q(u + v - 0.4, () => wicker(k, u - 0.42, v, 1)); k.q(u + v + 0.4, () => wicker(k, u + 0.42, v, -1));
    k.qperson(u - 0.42, v, { pose: "sit", seatZ: 0.3, dir: [1, 0.1], seed: 60 + i, bench: true });
    if (i !== 2) k.qperson(u + 0.42, v, { pose: "sit", seatZ: 0.3, dir: [-1, 0.1], seed: 70 + i, bench: true, gesture: i % 2 === 0 });
  });
  // plane trees (trunks inside the footprint, one row per quay, three behind the basin)
  const TR = [
    [3.45, 1.9, 1.8, 58, 1, { tw: 8, bend: -3 }], [3.45, 4.7, 1.9, 60, 2, { tw: 8, bend: 4 }], [3.45, 7.7, 1.8, 58, 3, { tw: 8, bend: -2 }],
    [8.9, 3.9, 1.9, 60, 4, { tw: 8, bend: 3 }], [9.1, 5.6, 1.8, 58, 5, { tw: 8, bend: -4 }], [6.75, 1.5, 2.0, 60, 6, { tw: 8, bend: 5 }],
    [3.2, 0.7, 2.0, 60, 7, { tw: 8, bend: 2 }], [5.0, 0.65, 2.2, 64, 8, { tw: 8, bend: -3 }],
  ];
  for (const [u, v, h, Rr, s, o] of TR) k.q(u + v + 0.8, () => planeTree(k, t, u, v, { h, R: Rr, seed: s * 9, ...o }));
  // bridges (arched lattice spans along u)
  const BR = [makeBridge([CU0, 3.2], [CU1, 3.2], { zE: 0.55, zH: 1.4, w: 0.34 }), makeBridge([CU0, 6.0], [CU1, 6.0], { zE: 0.55, zH: 1.35, w: 0.34 })];
  const bq = BR.map((b) => (b.A[0] + b.B[0]) / 2 + b.A[1] + 0.6);
  BR.forEach((b, i) => { k.q(bq[i] - 0.3, () => b.far(k)); k.q(bq[i] - 0.2, () => b.mid(k)); k.q(bq[i], () => b.near(k)); });
  // people crossing at deck height (z follows the stairs and the arch)
  const cross = [[0, -0.12, 0.0, 41, 0.4], [0, 0.1, 0.3, 42, 0.38], [0, 0.0, 0.62, 43, 0.34], [1, -0.1, 0.1, 44, 0.4], [1, 0.12, 0.5, 45, 0.37], [1, 0.0, 0.8, 47, 0.33]];
  for (const [bi, off, o, seed, sp] of cross) {
    const b = BR[bi], vb = b.A[1], route = [[b.A[0] - b.SL + 0.05, vb + off], [b.B[0] + b.SL - 0.05, vb + off]];
    const s = k.walkerState(route, { speed: sp, offset: o, dwell: 2.2 + (seed % 3) * 0.6 });
    k.q(bq[bi] - 0.1, () => k.person(s.u, s.v, { dir: [s.du, s.dv], pose: s.moving ? "walk" : "stand", p: s.p, seed, z: b.zAt(s.u) }));
  }
  // barge: sorted between the layers of a bridge when it is under it
  {
    let q = bs.v + 5 + 0.3;
    BR.forEach((b, i) => { if (Math.abs(bs.v - b.A[1]) < 1.2) q = bq[i] - 0.1; });
    const z = bs.v > HV + 0.8 ? WZ - LOW * bs.lv : WZ;
    k.q(q, () => barge(k, t, { u: 5.0, v: bs.v, th: bs.th, z, moving: bs.moving }));
  }
  // picnic on the front-right quay, a couple on the canal edge, a photographer, a reader
  k.q(8.7 + 9.0 + 0.5, () => picnic(k, 8.7, 9.0, t));
  k.qperson(6.55, 4.3, { pose: "sitground", dir: [-1, 0.2], seed: 86 }); k.qperson(6.55, 4.9, { pose: "sitground", dir: [-1, 0.1], seed: 87, gesture: true });
  k.qperson(3.5, 7.05, { pose: "photo", dir: [1, 0.2], seed: 89 });
  k.qperson(6.55, 1.9, { pose: "sitground", dir: [-1, 0.3], seed: 88 });
  // parked bikes, pigeons
  for (const [u, v, col, d] of [[2.3, 3.0, "#3f73b5", [0.2, 1]], [7.0, 8.9, "#4a4a4a", [0.2, 1]]]) k.q(u + v + 0.3, () => k.bike(u, v, { dir: d, col }));
  for (const [u, v, s] of [[2.8, 7.4, 1], [6.9, 6.9, 2], [5.0, 0.95, 3], [8.2, 5.6, 4], [4.6, 9.3, 5]]) k.q(u + v, () => pigeon(k, u, v, t, s));
  // walkers
  const Wk = (name, off, seed, sp = 0.4) => k.qwalker(ROUTES[name], { speed: sp, offset: off, seed, dwell: 1.2 + (seed % 3) * 0.6 });
  Wk("LA", 0.0, 21); Wk("LB", 0.3, 23, 0.36); Wk("LC", 0.5, 24, 0.36); Wk("LC", 0.1, 25, 0.38);
  Wk("B1", 0.1, 26, 0.36); Wk("B2", 0.45, 27, 0.34); Wk("RW", 0.1, 28); Wk("RW2", 0.4, 29, 0.38); Wk("F1", 0.5, 35, 0.34);
  k.qcyclist(ROUTES.bike, { speed: 0.9, offset: 0.35, seed: 33, col: "#d9544b", basket: true });
  // birds
  flock(k, 560, 150, 5, t, 4);
  k.circlingBird(520, 140, 90, 22, { speed: 0.5, phase: 1 });
  k.flush();
}
export const camera = { u: 4.8, v: 4.6, z: 1.0, zoom: 2.0 };
