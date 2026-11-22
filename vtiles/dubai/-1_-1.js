// DUBAI · -1,-1 · Burj Al Arab & Jumeirah Beach (grid pass)
// Layout (u,v), everything inside 0.3..9.7, every wall along u or v:
//   sea           v 0.3-6.6, whole width (kerbed on its three edges), breakers roll to the shore at v 6.6
//   hotel island  u 0.9-7.6, v 0.7-3.7 (rock revetment); Burj Al Arab on it: spine at u 1.9, sail faces +v (front-left)
//   causeway      along v at u 6.6 (deck u 5.9-7.3) from the island (v 3.7) to the beach apron (v 7.0-7.8)
//   beach         v 6.6-9.2 (sand), promenade v 9.2-9.7; umbrellas at v 7.8-8.6, cabana at right, palms + shrubs on the rim
//   sea life      superyacht on an ellipse (3.4, 5.0), jet ski on an ellipse (8.4, 5.15), swimmers in the shallows
import { P, CTS, INK, lerp, clamp, rng, smooth } from "../../lib/vec-kit.js";
import { makeBurjAlArab } from "./burjalarab.js";
import { look } from "./_props.js";
import {
  sea, wetSand, surf, islandBody, bed, shrubStrip, parasol, lounger, sunbather, cabana, swimmer, jetski,
  superyacht, helicopter, sandcastle, bucket, towel, carAny, palmZ, trailWake,
} from "./_t-1_-1.js";
import { PAVE, CU, HW, V_ISL, V_SHORE, V_END, zDeck, seaKerbs, deckSeg, rail, pier, apron, promenade, sand } from "./_g-1_-1.js";

const ZI = 0.4;                                   // island top height
const BA = makeBurjAlArab({ TU: 1.9, TV: 1.2, ZI });
export const camera = { u: 4.2, v: 3.0, z: 4.6, zoom: 1.28 };

const ISLAND = [[0.9, 0.7], [7.6, 0.7], [7.6, V_ISL], [0.9, V_ISL]];
const SEA = [[0.3, 0.3], [9.7, 0.3], [9.7, V_SHORE], [0.3, V_SHORE]];
const SHORE = []; for (let i = 0; i <= 19; i++) SHORE.push([9.7 - i * 0.5, V_SHORE]);
const LV0 = V_ISL - 0.1, LV1 = V_END;           // deck run

// ---------- sea, sand, island ----------
function ground(k, t) {
  const c = k.ctx;
  k.slab(PAVE);
  sand(k);
  sea(k, SEA);
  const c2 = k.ctx; c2.save(); c2.beginPath(); [P(0.3, 0.3), P(9.7, 0.3), P(9.7, 9.7), P(0.3, 9.7)].forEach((p, i) => (i ? c2.lineTo(...p) : c2.moveTo(...p))); c2.closePath(); c2.clip();
  wetSand(k, SHORE);
  surf(k, SHORE, t);
  c2.restore();
  seaKerbs(k);
  promenade(k);
  apron(k);
  k.poly([[0, 0, 0], [10, 0, 0], [10, 10, 0], [0, 10, 0]], null, { lw: 1.6 });
  islandBody(k, ISLAND, ZI, { seed: 7 });
}

// ---------- the causeway ----------
const NSEG = 17;
function causeway(k, t) {
  const vs = (i) => lerp(LV0, LV1, i / NSEG);
  for (let i = 0; i < NSEG; i++) {
    const v0 = vs(i), v1 = vs(i + 1), vm = (v0 + v1) / 2;
    k.q(CU - HW + vm, () => { deckSeg(k, v0, v1, t); rail(k, -1, v0, v1); });
    k.q(CU + HW + vm - 0.02, () => rail(k, 1, v0, v1));
  }
  for (let v = 4.25; v < V_SHORE - 0.2; v += 0.85) for (const du of [-0.5, 0.5]) k.q(CU + du + v - 0.3, () => pier(k, CU + du, v, zDeck(v) - 0.2, t));
  // lamps on both rails
  for (const v of [4.2, 5.3, 6.35]) for (const sd of [-1, 1]) k.q(CU + sd * (HW - 0.04) + v + 0.15, () => k.lamp(CU + sd * (HW - 0.04), v, { z: zDeck(v), col: "#3a3228", h: 0.85 }));
}

// cars: a closed stadium loop (lane in, U-turn on the island apron, lane out, U-turn on the beach forecourt)
const LR = 0.2, VT = 3.5, VB = 7.4;             // lane offset / turning radius, island end, beach end
const LANE = VB - VT, ARC = Math.PI * LR, LOOP = 2 * LANE + 2 * ARC;
function carAt(d) {
  d = ((d % LOOP) + LOOP) % LOOP;
  if (d < LANE) return { u: CU + LR, v: VB - d, du: 0, dv: -1 };                                  // inbound (toward the island)
  d -= LANE;
  if (d < ARC) { const p = d / ARC * Math.PI; return { u: CU + LR * Math.cos(p), v: VT - LR * Math.sin(p), du: 0, dv: -1, arc: true, ph: p, end: "I" }; }
  d -= ARC;
  if (d < LANE) return { u: CU - LR, v: VT + d, du: 0, dv: 1 };                                   // outbound
  d -= LANE;
  const p = d / ARC * Math.PI; return { u: CU - LR * Math.cos(p), v: VB + LR * Math.sin(p), du: Math.sin(p), dv: Math.cos(p), arc: true, ph: p, end: "B" };
}
const CARS = [{ col: "#d63a3a", off: 0 }, { col: "#f4f2ee", off: LOOP / 3 }, { col: "#2a2e36", off: 2 * LOOP / 3 }, { col: "#e9b43a", off: 0.5 * LOOP / 3 }];
function cars(k, t) {
  const SP = 0.5;
  for (const cr of CARS) {
    const s = carAt(t * SP + cr.off);
    // heading on the arcs: derivative of the position
    let du = s.du, dv = s.dv;
    if (s.arc) { const e = carAt(t * SP + cr.off + 0.01); du = e.u - s.u; dv = e.v - s.v; }
    k.q(s.u + s.v + 0.3, () => carAny(k, s.u, s.v, [du, dv], cr.col, { z: zDeck(s.v) }));
  }
}

// walkers on the causeway footways (stay on the flat part)
function deckPeople(k) {
  const R = [
    { v0: 4.1, v1: 6.3, side: -1, off: 0.0, sp: 0.2, seed: 31 }, { v0: 4.1, v1: 6.3, side: -1, off: 0.45, sp: 0.18, seed: 32 },
    { v0: 4.2, v1: 6.3, side: 1, off: 0.2, sp: 0.22, seed: 33 }, { v0: 4.2, v1: 6.3, side: 1, off: 0.7, sp: 0.2, seed: 34 },
  ];
  for (const r of R) {
    const route = [[CU + r.side * 0.55, r.v0], [CU + r.side * 0.55, (r.v0 + r.v1) / 2], [CU + r.side * 0.55, r.v1]];
    k.qwalker(route, { speed: r.sp, offset: r.off, dwell: 2.4, seed: r.seed, z: zDeck(5), h: undefined, ...look(r.seed) });
  }
  // a photographer at the rail
  k.qperson(CU + 0.58, 5.0, { pose: "photo", dir: [1, 0], seed: 35, z: zDeck(5), ...look(35) });
}

// ---------- the island ----------
const PLAZA_ROUTES = [
  { v: 2.98, off: 0.0, sp: 0.3, seed: 80 }, { v: 3.0, off: 0.5, sp: 0.28, seed: 81 },
  { v: 3.22, off: 0.2, sp: 0.32, seed: 82 }, { v: 3.2, off: 0.7, sp: 0.3, seed: 83 },
  { v: 3.44, off: 0.35, sp: 0.27, seed: 84 }, { v: 3.42, off: 0.85, sp: 0.3, seed: 85 },
];
function island(k, t) {
  // palms behind / beside the tower (queued by depth so the tower stands in front of the ones behind it)
  for (const [u, v, h, sd, l] of [[1.25, 0.95, 1.0, 61, -0.2], [1.5, 1.05, 0.85, 62, -0.3], [6.4, 0.95, 1.0, 63, 0.25], [7.0, 1.4, 0.9, 64, 0.3], [6.5, 2.0, 0.7, 65, 0.2]]) k.q(u + v, () => palmZ(k, u, v, ZI, { h, seed: sd, lean: l, len: 0.5, fronds: 9, wide: 0.7 }));
  // planting beds in front of the lobby
  const BEDS = [[[1.9, 2.4], [3.3, 2.4], [3.3, 2.7], [1.9, 2.7]], [[4.3, 2.4], [5.7, 2.4], [5.7, 2.7], [4.3, 2.7]], [[6.1, 1.0], [7.2, 1.0], [7.2, 1.8], [6.1, 1.8]]];
  BEDS.forEach((pts, i) => { let d = 0; for (const [u, v] of pts) d = Math.max(d, u + v); k.q(d - 0.1, () => bed(k, pts, ZI, 70 + i)); });
  // front palms and lamps
  for (const [u, v, h, sd, l] of [[1.4, 3.3, 0.8, 66, -0.2], [7.25, 2.9, 0.75, 68, 0.25]]) k.q(u + v, () => palmZ(k, u, v, ZI, { h, seed: sd, lean: l, len: 0.5, fronds: 9, wide: 0.7 }));
  for (const [u, v] of [[1.2, 2.0], [3.8, 3.6], [5.4, 3.6], [7.35, 3.5]]) k.q(u + v, () => k.lamp(u, v, { z: ZI, col: "#3a3228", h: 0.9 }));
  // tower shadow + the tower itself (depth low: everything on the plaza in front of the lobby draws after it)
  k.q(2.0, () => BA.shadow(k));
  k.q(3.05, () => BA.draw(k, t));
  // plaza walkers: three lanes, two walkers each, ping-pong with pauses
  for (const r of PLAZA_ROUTES) k.qwalker([[1.7, r.v], [3.4, r.v], [5.3, r.v]], { speed: r.sp, offset: r.off, dwell: 2.0, seed: r.seed, z: ZI, ...look(r.seed) });
  // valets, greeter and a family at the car drop
  [[7.15, 3.3, 91, false, "wave"], [7.28, 3.45, 92, false, "stand"], [5.7, 2.9, 93, false, "stand"], [5.85, 3.0, 94, true, "stand"], [1.5, 2.85, 95, true, "stand"]].forEach(([u, v, sd, kid, pose]) => {
    k.qperson(u, v, { pose, dir: [0.4, 1], seed: sd, kid, z: ZI, ...look(sd) });
  });
}

// ---------- beach ----------
const SETS = [
  { u: 1.8, c: ["#d8403a", "#f6f1e6"], seed: 1 },
  { u: 4.5, c: ["#4a86b8", "#f6f1e6"], seed: 3 },
];
const UV = 7.8; // umbrella row
function beach(k, t) {
  SETS.forEach((S) => {
    // loungers lie along u on either side of the umbrella, not under its canopy
    [[S.u - 0.62, UV + 0.35, 0], [S.u + 1.5, UV + 0.35, 1]].forEach(([u, v, j]) => {
      k.q(u + v + 0.4, () => { const Lg = lounger(k, u, v, [-1, 0], {}); sunbather(k, Lg, { seed: S.seed * 5 + j, back: 0.7 }); });
    });
    k.q(S.u + UV + 0.9, () => parasol(k, S.u, UV, S.c[0], S.c[1], { h: 1.6, r: 0.52 }));
  });
  // cabana (right side), towels, castle
  k.q(8.2 + 8.0 + 1.0, () => cabana(k, 8.2, 8.0, t, {}));
  k.q(7.4 + 7.55, () => towel(k, 7.4, 7.55, [1, 0], "#e56b6b", "#f6f1e6"));
  k.q(8.35 + 7.45, () => towel(k, 8.35, 7.45, [1, 0], "#4a86b8", "#f6f1e6"));
  k.q(3.2 + 8.5, () => sandcastle(k, 3.2, 8.5)); k.q(3.45 + 8.55, () => bucket(k, 3.45, 8.55));
  // a family on the sand: parents sitting, kid at the castle, someone reading on a towel
  [[2.8, 8.75, 111, false, "sitground"], [3.55, 8.8, 112, false, "sitground"], [3.15, 8.85, 113, true, "sitground"], [7.7, 7.6, 114, false, "sitground"], [8.7, 7.5, 115, false, "sitground"]].forEach(([u, v, sd, kid, pose]) => k.qperson(u, v, { pose, dir: [0.2, 1], seed: sd, kid, ...look(sd) }));
  // lady in the white dress and sun hat
  k.qperson(5.3, 8.3, { pose: "stand", dir: [0.3, 1], seed: 120, h: 0.64, style: "dress", top: "#f6f1e6", bottom: "#f6f1e6", hat: "sunhat", hatCol: "#f1e6c8", hairStyle: "long" });
  // walkers along the waterline, pausing and turning back
  k.qwalker([[0.8, 7.0], [2.4, 7.04], [4.2, 7.0]], { speed: 0.16, offset: 0, seed: 131, dwell: 2.4, ...look(131) });
  k.qwalker([[0.9, 7.2], [2.5, 7.24], [4.3, 7.2]], { speed: 0.16, offset: 0, seed: 132, dwell: 2.4, ...look(132) });
  k.qwalker([[2.6, 6.95], [4.0, 6.98], [5.4, 6.95]], { speed: 0.18, offset: 0.5, seed: 133, dwell: 2.0, ...look(133) });
  k.qwalker([[2.7, 7.15], [4.1, 7.18], [5.5, 7.15]], { speed: 0.18, offset: 0.5, seed: 134, dwell: 2.0, kid: true, ...look(134) });
  k.qwalker([[7.7, 7.0], [8.5, 7.04], [9.3, 7.0]], { speed: 0.2, offset: 0.2, seed: 135, dwell: 3.0, ...look(135) });
  // standing at the water's edge, two wading men
  [[5.5, 6.8, 141, false], [5.7, 6.85, 142, true], [8.6, 6.72, 143, false], [9.1, 6.7, 144, false]].forEach(([u, v, sd, kid]) => k.qperson(u, v, { pose: sd === 143 ? "wave" : "stand", dir: [-0.5, -1], seed: sd, kid, ...look(sd) }));
  // date palms along the promenade rim
  [[0.75, 9.4, 1.8, 151, -0.2], [5.6, 9.45, 1.5, 153, 0.1], [9.3, 9.4, 1.6, 155, 0.15]].forEach(([u, v, h, sd, l]) => k.q(u + v, () => palmZ(k, u, v, 0, { h, seed: sd, lean: l, len: 0.95 })));
  // shrub strips + flowers, axis-aligned along u at the promenade edge
  for (const [u0, u1, sd] of [[1.5, 2.6, 201], [3.5, 4.6, 202], [5.5, 6.7, 203], [7.7, 8.6, 204]]) {
    const pts = [[u0, 9.3], [(u0 + u1) / 2, 9.3], [u1, 9.3]]; k.q(u1 + 9.3 + 0.2, () => shrubStrip(k, pts, 0.4, sd, {}));
  }
}

// ---------- sea life ----------
const YC = [3.4, 5.0], YR = [1.65, 0.55];
function yachtPos(t) { const a = t * 0.08 + 0.3; return { u: YC[0] + Math.cos(a) * YR[0], v: YC[1] + Math.sin(a) * YR[1], du: -Math.sin(a) * YR[0], dv: Math.cos(a) * YR[1] }; }
const JC = [8.4, 5.15], JR = [0.8, 0.65];
function jsPos(t) { const a = t * 0.45; return { u: JC[0] + Math.cos(a) * JR[0], v: JC[1] + Math.sin(a) * JR[1], du: -Math.sin(a) * JR[0], dv: Math.cos(a) * JR[1] }; }
function seaLife(k, t) {
  trailWake(k, yachtPos, t, { n: 22, dt: 0.6, w0: 0.26, spread: 0.07, lw: 3, skip: 3, a: 0.8 });
  trailWake(k, jsPos, t, { n: 14, dt: 0.16, w0: 0.14, spread: 0.06, lw: 2.2, skip: 2, a: 0.8 });
  const y = yachtPos(t); k.q(y.u + y.v + 0.1, () => superyacht(k, y.u, y.v, [y.du, y.dv], { len: 1.7, wid: 0.5 }));
  const j = jsPos(t); k.q(j.u + j.v + 0.1, () => jetski(k, j.u, j.v, [j.du, j.dv], { bank: Math.sin(t * 0.45) * 0.6 }));
  // swimmers drifting in the shallows (sea side of the surf line)
  const SW = [[0.9, 6.1, 1, 0], [1.8, 5.85, 2, 1.2], [5.0, 6.05, 3, 2.1], [5.4, 5.8, 4, 3.3], [2.9, 6.25, 5, 4.4], [8.6, 6.15, 6, 5.1], [4.1, 6.3, 7, 0.6]];
  for (const [u0, v0, sd, ph] of SW) {
    const u = u0 + Math.sin(t * 0.18 + ph) * 0.28, v = v0 + Math.cos(t * 0.15 + ph) * 0.12;
    k.q(u + v, () => swimmer(k, u, v, [Math.cos(t * 0.18 + ph), -Math.sin(t * 0.15 + ph)], { seed: sd }));
  }
}

// ---------- sky (positions go through P at an altitude) ----------
function sky(k, t) {
  k.q(99, () => {
    const a = t * 0.18, [x, y] = P(5.5 + Math.cos(a) * 2.6, 4.5 + Math.sin(a) * 1.8, 11.5);
    helicopter(k, x, y, Math.cos(a + 1.57), t * 34, { s: 0.7 });
  });
  const b1 = P(3.0, 5.0, 8), b2 = P(7.0, 3.0, 9), b3 = P(2.0, 8.0, 6);
  k.circlingBird(b1[0], b1[1], 90, 22, { seed: 1, speed: 0.4 });
  k.circlingBird(b2[0], b2[1], 120, 26, { seed: 2, speed: 0.33 });
  k.circlingBird(b3[0], b3[1], 60, 16, { seed: 3, speed: 0.5 });
}

export default function draw(k, t) {
  ground(k, t);
  causeway(k, t);
  cars(k, t);
  deckPeople(k);
  island(k, t);
  beach(k, t);
  seaLife(k, t);
  sky(k, t);
}
