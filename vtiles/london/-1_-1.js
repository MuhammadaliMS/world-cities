// LONDON · -1,-1 · Tower Bridge & the Thames (grid pass)
// Layout (u,v), everything inside 0.3..9.7, every wall along u or v:
//   river            u 2.2-7.8, whole v length, stone kerb on all four sides
//   banks            u 0.3-2.2 and 7.8-9.7: promenade along v, quay kerb, plane trees, lamps, benches, walkers
//   Tower Bridge     crosses along u at v 3.75-5.25 (centre 4.5): gothic towers on piers (u 2.9-4.4, 5.6-7.1), high walkway,
//                    two bascule leaves (u 4.4-5.6) that rise 5.5-8.5 s and lower 12.5-15.5 s of every 22 s,
//                    blue suspension chains to abutment pylons (u 1.0-1.5 / 8.5-9.0), road ramps down to the banks
//   traffic          2 buses + 2 cabs on a stadium loop (U-turn bulbs at u 0.6 / 9.4); they queue at the bank gates while open
//   tour boat        loops the river along v (lanes u 4.75 / 5.25), under the open bridge at 7.5-13.5 s and 29.5-35.5 s (44 s loop)
import { P, INK, lerp, clamp, rng, smooth } from "../../lib/vec-kit.js";
import { pillarBox, phoneBox, pigeon } from "./_props.js";
import {
  ZD, V0, V1, T1, T2, PERIOD, bascule, drawTower, tunnelInterior, clipOutsideTower, zRoad, deckSeg, deckRail, drawLeaf, drawLeafBackRail,
  deckShadow, drawHighWalk, drawPylon, drawChain, BLUE,
} from "./towerbridge.js";
import { vehKF, vehD, loopPos, vehicle, boatD, boatPos, cruiser, boatWake, UL, UR, VC, LOOP, AR, VA, VB } from "./_g-1_-1.js";

export const camera = { u: 5.0, v: 4.6, z: 3.2, zoom: 1.12 };
const PAVE = "#e7dabb", BANK = "#eadfc2", KERB = "#d4c39b";

// ---------- ground ----------
function ground(k, t) {
  const c = k.ctx;
  k.slab(PAVE);
  // banks (flat), paving lines
  for (const [u0, u1] of [[0.3, 1.8], [8.2, 9.7]]) {
    k.poly([[u0, 0.3, 0], [u1, 0.3, 0], [u1, 9.7, 0], [u0, 9.7, 0]], BANK, { lw: 1 });
    c.save(); c.beginPath(); [P(u0, 0.3), P(u1, 0.3), P(u1, 9.7), P(u0, 9.7)].forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.clip();
    c.strokeStyle = "rgba(120,98,66,0.22)"; c.lineWidth = 0.8; c.beginPath();
    for (let v = 0.3; v <= 9.7; v += 0.5) { c.moveTo(...P(u0, v)); c.lineTo(...P(u1, v)); }
    for (let u = u0; u <= u1 + 0.01; u += 0.5) { c.moveTo(...P(u, 0.3)); c.lineTo(...P(u, 9.7)); }
    c.stroke(); c.restore();
  }
  // river
  const W = [[1.8, 0.3], [8.2, 0.3], [8.2, 9.7], [1.8, 9.7]];
  k.water(W, { color: "#6f9bc0", seed: 4, density: 2.2, dir: [0, 1], flow: 1.0 });
  c.save(); c.beginPath(); W.forEach(([u, v], i) => { const p = P(u, v); i ? c.lineTo(...p) : c.moveTo(...p); }); c.closePath(); c.clip();
  // darker current bands + golden tower reflections
  c.fillStyle = "rgba(40,80,125,0.12)";
  for (let i = 0; i < 7; i++) { const v = 1 + i * 1.3, u = 5 + Math.sin(t * 0.4 + i) * 0.5; const [x, y] = P(u, v); c.beginPath(); c.ellipse(x, y, 90, 11, 0.5, 0, 7); c.fill(); }
  for (const cu of [3.65, 6.35]) for (let i = 0; i < 12; i++) { const r = rng(i + cu * 7); const u = cu + (r() - 0.5) * 1.2, v = 5.7 + r() * 1.8; const [x, y] = P(u, v + Math.sin(t * 1.2 + i) * 0.03); c.strokeStyle = `rgba(250,225,150,${0.3 + 0.25 * Math.sin(t * 1.5 + i)})`; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 8, y); c.lineTo(x + 8, y); c.stroke(); }
  c.restore();
  // stone kerbs: left quay (face visible), right quay, back and front edges of the river
  const o = { hatch: false, shadow: false, left: "#cdbb92", right: "#b9a67c", top: "#eadcb8" };
  k.box(1.6, 0.3, 0, 0.2, 9.4, 0.14, KERB, o);
  k.box(8.2, 0.3, 0, 0.2, 9.4, 0.14, KERB, o);
  k.box(1.8, 0.3, 0, 6.4, 0.2, 0.14, KERB, o);
  k.box(1.8, 9.5, 0, 6.4, 0.2, 0.14, KERB, o);
  // the road on the banks: asphalt + footway + U-turn bulbs
  const road = (a, b, col) => k.poly([[a, V0, 0], [b, V0, 0], [b, V1, 0], [a, V1, 0]], col, { lw: 0.8 });
  for (const [a, b] of [[UL, 0.9], [9.1, UR]]) { road(a, b, "#868b92"); }
  for (const [cu, sg] of [[UL, -1], [UR, 1]]) {
    const pts = []; for (let i = 0; i <= 12; i++) { const p = i / 12 * Math.PI; pts.push([cu + sg * 0.5 * Math.sin(p), VC - 0.5 * Math.cos(p), 0]); }
    k.poly(pts, "#868b92", { lw: 0.9 });
    const ring = []; for (let i = 0; i <= 12; i++) { const p = i / 12 * Math.PI; ring.push([cu + sg * 0.5 * Math.sin(p), VC - 0.5 * Math.cos(p), 0]); }
    k.line3(ring, { lw: 1.4, stroke: "#c9b88e", wobble: 0 });
    k.poly([[cu, 4.35, 0], [cu + sg * 0.12, 4.35, 0], [cu + sg * 0.12, 4.65, 0], [cu, 4.65, 0]], "#868b92", { stroke: false });
  }
  c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 1; c.setLineDash([4, 4]); c.beginPath();
  for (const [a, b] of [[UL, 0.9], [9.1, UR]]) { c.moveTo(...P(a, VC, 0)); c.lineTo(...P(b, VC, 0)); } c.stroke(); c.setLineDash([]);
  // deck + tower shadows on the water / bank
  k.poly([[1.8, V0 + 0.2, 0], [T1[0], V0 + 0.2, 0], [T1[0], V1 + 0.2, 0], [1.8, V1 + 0.2, 0]], "rgba(25,55,95,0.22)", { stroke: false });
  k.poly([[T2[1], V0 + 0.2, 0], [8.2, V0 + 0.2, 0], [8.2, V1 + 0.2, 0], [T2[1], V1 + 0.2, 0]], "rgba(25,55,95,0.22)", { stroke: false });
  k.poly([[1.6, V0 + 0.15, 0], [1.8, V0 + 0.15, 0], [1.8, V1 + 0.15, 0], [1.6, V1 + 0.15, 0]], "rgba(80,60,30,0.16)", { stroke: false });
  k.poly([[8.2, V0 + 0.15, 0], [8.4, V0 + 0.15, 0], [8.4, V1 + 0.15, 0], [8.2, V1 + 0.15, 0]], "rgba(80,60,30,0.16)", { stroke: false });
  k.poly([[0.3, 0.3, 0], [9.7, 0.3, 0], [9.7, 9.7, 0], [0.3, 9.7, 0]], null, { lw: 1.6 });
}

// ---------- bridge structure ----------
function bridge(k, t, lift) {
  const c = k.ctx;
  // chains (back plane first)
  k.q(5.5, () => drawChain(k, V0, T1[0], 4.3, 1.2, 1.95));
  k.q(7.0, () => drawChain(k, V1, T1[0], 4.3, 1.2, 1.95));
  k.q(12.4, () => drawChain(k, V0, T2[1], 4.3, 8.8, 1.95));
  k.q(14.4, () => drawChain(k, V1, T2[1], 4.3, 8.8, 1.95));
  // pylons
  for (const [u, v] of [[1.2, V0], [1.2, V1], [8.8, V0], [8.8, V1]]) k.q(u + v + 0.25, () => drawPylon(k, u, v));
  // deck slabs: left ramp + side span, right side span + ramp
  const segs = []; for (let a = 0.9; a < T1[0] - 1e-6; a += 0.25) segs.push([a, Math.min(a + 0.25, T1[0])]); for (let a = T2[1]; a < 9.1 - 1e-6; a += 0.25) segs.push([a, Math.min(a + 0.25, 9.1)]);
  for (const [a, b] of segs) {
    k.q(a + V0 + 0.05, () => { deckSeg(k, a, b); deckRail(k, a, b, V0); });
    k.q(b + V1 + 0.02, () => deckRail(k, a, b, V1));
  }
  // bascule leaves (back rail, body, front rail inside leaf)
  const LIFT = lift;
  k.q(8.1, () => { drawLeafBackRail(k, "L", LIFT); drawLeaf(k, "L", LIFT); });
  k.q(8.7, () => { drawLeafBackRail(k, "R", LIFT); drawLeaf(k, "R", LIFT); });
  // towers + tunnel interiors
  k.q(T1[0] + V0 - 0.3, () => tunnelInterior(k, ...T1));
  k.q(T2[0] + V0 - 0.3, () => tunnelInterior(k, ...T2));
  k.q(T1[1] + V1, () => drawTower(k, t, T1));
  k.q(10.48, () => drawHighWalk(k));
  k.q(T2[1] + V1, () => drawTower(k, t, T2));
}

// ---------- traffic ----------
const FLEET = [
  { kind: "bus", kf: vehKF(0.95, 16.0), off: 0 }, { kind: "cab", kf: vehKF(0.0, 16.8), off: 0 },
  { kind: "bus", kf: vehKF(0.95, 16.9), off: 9.085 }, { kind: "cab", kf: vehKF(0.0, 17.7), off: 9.085 },
];
const HL = { bus: 0.58, cab: 0.37 };
function traffic(k, t) {
  const c = k.ctx;
  for (const f of FLEET) {
    const s = loopPos(vehD(f.kf, f.off, t)), u = s.u, v = s.v, z = zRoad(u), hl = HL[f.kind];
    const draw = (clip) => () => { c.save(); if (clip) clipOutsideTower(c, ...clip); vehicle(k, f.kind, u, v, s.ang, z); c.restore(); };
    if (u >= T1[0] - 0.3 && u < T1[1] + hl) k.q(T1[1] + V1 + 0.001, draw(T1));
    else if (u >= T1[1] + hl && u < T2[0]) k.q(Math.max(u + v, T1[1] + V1 + 0.002), draw(null));
    else if (u >= T2[0] && u < T2[1] + hl) k.q(T2[1] + V1 + 0.001, draw(T2));
    else if (u >= T2[1] + hl) k.q(Math.max(u + v, T2[1] + V1 + 0.002), draw(null));
    else k.q(u + v + 0.3, draw(null));
  }
}

// ---------- people ----------
function stopPeople(k, t) {
  const stand = (u, v, seed, o = {}) => k.qperson(u, v, { pose: "stand", dir: [1, 0.1], seed, ...o });
  stand(1.4, 5.8, 401); stand(1.55, 5.95, 402, { kid: true }); stand(1.15, 5.9, 403, { pose: "wave" });
  stand(8.7, 3.05, 404, { dir: [-1, 0] }); stand(8.55, 3.2, 405, { dir: [-1, 0] });
  // photographers at the quay
  k.qperson(1.5, 7.4, { pose: "photo", dir: [1, 0.2], seed: 406 }); k.qperson(8.5, 2.3, { pose: "photo", dir: [-1, 0.2], seed: 407 });
}
function promenade(k, t) {
  const W = (route, o) => k.qwalker(route, { dwell: 1.6, speed: 0.3 + (o.seed % 5) * 0.025, ...o });
  // left bank
  const lb = [[1.4, 0.8], [1.4, 3.0]], lf = [[1.4, 6.5], [1.4, 9.1]], lf2 = [[1.05, 6.5], [1.05, 7.1]];
  W(lb, { offset: 0.1, seed: 411 }); W(lb, { offset: 0.6, seed: 412 });
  W(lf, { offset: 0.0, seed: 413 }); W(lf, { offset: 0.4, seed: 414 }); W(lf, { offset: 0.75, seed: 415, kid: true });
  W(lf2, { offset: 0.3, seed: 416 });
  // right bank
  const rb = [[8.6, 0.8], [8.6, 3.0]], rf = [[8.6, 6.0], [8.6, 9.1]], rf2 = [[9.05, 6.9], [9.05, 8.2]];
  W(rb, { offset: 0.2, seed: 421 }); W(rb, { offset: 0.7, seed: 422 });
  W(rf, { offset: 0.1, seed: 423 }); W(rf, { offset: 0.5, seed: 424 }); W(rf, { offset: 0.85, seed: 425 });
  W(rf2, { offset: 0.5, seed: 426 });
  // benches with sitters
  k.q(0.9 + 7.6 + 0.2, () => { k.bench(0.85, 7.35, { along: "v", len: 0.8 }); });
  k.q(0.9 + 7.6 + 0.4, () => { k.person(0.97, 7.55, { pose: "sit", bench: true, seatZ: 0.28, dir: [1, 0.1], seed: 431 }); k.person(0.97, 7.85, { pose: "sit", bench: true, seatZ: 0.28, dir: [1, 0.1], seed: 432 }); });
  k.q(9.0 + 2.0 + 0.2, () => { k.bench(9.0, 1.6, { along: "v", len: 0.8 }); });
  k.q(9.0 + 2.0 + 0.4, () => { k.person(9.12, 1.8, { pose: "sit", bench: true, seatZ: 0.28, dir: [-1, 0.1], seed: 433 }); });
}
function deckPeople(k, t) {
  // side spans: pause-and-turn on the footways
  const sw = (route, o) => k.qwalker(route, { dwell: 1.6, z: ZD, ...o });
  sw([[1.7, 3.88], [2.2, 3.88]], { speed: 0.26, offset: 0.1, seed: 441 });
  sw([[1.7, 5.12], [2.2, 5.12]], { speed: 0.28, offset: 0.6, seed: 442 });
  sw([[7.8, 3.88], [8.3, 3.88]], { speed: 0.27, offset: 0.4, seed: 443 });
  sw([[7.8, 5.12], [8.3, 5.12]], { speed: 0.25, offset: 0.9, seed: 444 });
  // central span: walkers cross from the tower-1 doors to tower 2 only while the leaves are down
  const tt = ((t % PERIOD) + PERIOD) % PERIOD, c = k.ctx;
  for (const [t0, v, seed] of [[16.0, 3.88, 451], [17.4, 5.12, 452], [18.8, 3.88, 453], [20.2, 5.12, 454], [21.4, 3.88, 455]]) {
    const ph = (tt - (t0 % PERIOD) + PERIOD) % PERIOD, sp = 0.5;
    if (ph > 5.4) continue;
    const u = T1[1] - 0.2 + sp * ph;
    k.q(T1[1] + V1 + 0.0015, () => { c.save(); clipOutsideTower(c, ...T1, true); k.person(u, v, { pose: "walk", p: (sp * ph * 1.3) % 1, dir: [1, 0], seed, z: ZD }); c.restore(); });
  }
}

// ---------- bank furniture, trees ----------
function bankLife(k, t) {
  const trees = [[0.65, 1.3, 0.55, 1.7, 1], [0.8, 2.6, 0.5, 1.5, 2], [0.6, 6.4, 0.55, 1.8, 3], [0.7, 8.8, 0.55, 1.6, 4],
    [9.35, 1.1, 0.55, 1.7, 5], [9.2, 2.7, 0.5, 1.5, 6], [9.4, 6.3, 0.55, 1.8, 7], [9.25, 8.7, 0.55, 1.6, 8]];
  for (const [u, v, r, h, s] of trees) if (r) k.q(u + v, () => k.tree(u, v, { r, h, seed: 60 + s, col: s % 2 ? "#86b05a" : "#8fb55a" }));
  const lamps = [[1.55, 1.6], [1.55, 3.1], [1.55, 6.2], [1.55, 8.3], [8.45, 1.5], [8.45, 3.0], [8.45, 6.3], [8.45, 8.4]];
  for (const [u, v] of lamps) k.q(u + v + 0.1, () => k.lamp(u, v, { col: "#23282b", h: 1.7 }));
  k.q(1.2 + 6.9, () => pillarBox(k, 0.8, 5.9)); k.q(9.0 + 3.8, () => phoneBox(k, 9.0, 3.25));
  // flower planters along the quay
  for (const [u, v, sd] of [[0.85, 2.0, 1], [0.85, 9.0, 2], [9.05, 7.4, 3]]) k.q(u + v + 0.6, () => { k.box(u, v, 0, 0.3, 0.7, 0.2, "#d8c9a6", { hatch: false, shadow: false }); k.flowers(u + 0.03, v + 0.04, 0.24, 0.62, { seed: sd, bed: "#6c9c4c", cols: ["#e8607a", "#f39ac0", "#ffffff", "#f4c542"], density: 60 }); });
  for (let i = 0; i < 3; i++) { const u = 1.2 + i * 0.18, v = 9.1 - i * 0.12; k.q(u + v, () => pigeon(k, u + Math.sin(t * 0.6 + i) * 0.06, v, { phase: i * 2 })); }
}

// ---------- the river boat ----------
function river(k, t) {
  const c = k.ctx, s = boatPos(boatD(t));
  k.q(Math.max(s.u + s.v, 2.5), () => {
    c.save(); c.beginPath(); [P(1.8, 0.3), P(8.2, 0.3), P(8.2, 9.7), P(1.8, 9.7)].forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.clip();
    boatWake(k, s.u, s.v, s.ang, t); cruiser(k, s.u, s.v, s.ang, t);
    c.restore();
  });
  // swans in the quiet corners
  for (const [u, v, ph] of [[3.2, 1.3, 0], [6.7, 8.5, 1.7]]) { const a = t * 0.15 + ph; const uu = u + Math.sin(a) * 0.4, vv = v + Math.cos(a) * 0.15; k.q(uu + vv, () => swanG(k, uu, vv, ph)); }
}
function swanG(k, u, v, ph) {
  const c = k.ctx, [x, y] = P(u, v, 0), t = k.t;
  c.fillStyle = "rgba(255,255,255,0.5)"; c.beginPath(); c.ellipse(x, y + 2, 13, 4.2, 0, 0, 7); c.fill();
  c.fillStyle = "#fbfaf5"; c.strokeStyle = INK; c.lineWidth = 1.1; c.beginPath(); c.ellipse(x, y - 2, 8.5, 4.4, 0, 0, 7); c.fill(); c.stroke();
  const bob = Math.sin(t * 1.6 + ph) * 0.8;
  c.lineWidth = 3.4; c.beginPath(); c.moveTo(x + 5, y - 3); c.quadraticCurveTo(x + 10, y - 8, x + 6, y - 14 + bob); c.stroke(); c.lineWidth = 1.8; c.strokeStyle = "#fbfaf5"; c.stroke();
  c.beginPath(); c.arc(x + 6.4, y - 15 + bob, 2.4, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
  c.fillStyle = "#e9873b"; c.beginPath(); c.moveTo(x + 8.4, y - 15.5 + bob); c.lineTo(x + 11.6, y - 14.6 + bob); c.lineTo(x + 8.4, y - 13.8 + bob); c.fill();
}

export default function draw(k, t) {
  const lift = bascule(t);
  ground(k, t);
  deckShadow(k, lift);
  bridge(k, t, lift);
  traffic(k, t);
  deckPeople(k, t);
  stopPeople(k, t);
  promenade(k, t);
  bankLife(k, t);
  river(k, t);
  k.flush();
  // sky
  const b1 = P(3.0, 3.0, 8.5), b2 = P(7.0, 6.5, 7);
  k.circlingBird(b1[0], b1[1], 90, 24, { speed: 0.6, phase: 0 }); k.circlingBird(b1[0], b1[1], 90, 24, { speed: 0.6, phase: 0.5, size: 0.8 });
  k.circlingBird(b2[0], b2[1], 60, 18, { speed: -0.5, phase: 2 });
  k.cloud(180, 180, { s: 0.8, phase: 1 }); k.cloud(880, 140, { s: 0.65, phase: 3 });
}
