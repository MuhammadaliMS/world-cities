// PARIS · 1,0 · Arc de Triomphe on the grid: axis-aligned arch in a round cobbled place, closed roundabout inside the tile.
import { P, INK, shade, rng } from "../../lib/vec-kit.js";
import { cobbles, flock } from "./_props.js";
import { CX, CY, archFaces, archInterior, flame, drawCar } from "./_g1_0.js";

const ROAD = "#b8b4ac", COB = "#d3cbbb", R_IN = 3.1, R_OUT = 4.35, R_L1 = 3.45, R_L2 = 4.0;
const circ = (r, n = 72) => Array.from({ length: n }, (_, i) => [CX + Math.cos((i / n) * 6.2832) * r, CY + Math.sin((i / n) * 6.2832) * r]);
const arcPts = (r, d0, d1) => { const n = Math.max(3, Math.round(Math.abs(d1 - d0) / 12)); return Array.from({ length: n + 1 }, (_, i) => { const a = ((d0 + ((d1 - d0) * i) / n) * Math.PI) / 180; return [CX + Math.cos(a) * r, CY + Math.sin(a) * r]; }); };
const LAWNS = [[0.5, 0.5, 1.7, 1.7, 3], [8.3, 0.5, 9.5, 1.7, 5], [0.5, 8.5, 1.7, 9.5, 4], [8.3, 8.5, 9.5, 9.5, 6]];
const rect = (u0, v0, u1, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];

function ground(k) {
  const c = k.ctx, ring = (r, n = 96) => circ(r, n).map(([u, v]) => P(u, v));
  k.groundTrace({ lawn: [], water: [], walks: [] }, { paved: COB, side: "#e3d3b0", stipple: 6 });
  cobbles(k, rect(0.3, 0.3, 9.7, 9.7), { gap: 0.24, line: "rgba(110,100,85,0.22)", seed: 9 });
  // paved approaches: four short axis-aligned aprons from the ring to the pavement rim
  const apr = [[R_OUT - 0.3, 0.4], [R_OUT - 0.3, 0.4]];
  const W = 0.95;
  k.ground(rect(CX - W, 0.4, CX + W, CY - R_OUT + 0.4), "#c9bfa9", { lw: 1.1 });
  k.ground(rect(CX - W, CY + R_OUT - 0.4, CX + W, 9.6), "#c9bfa9", { lw: 1.1 });
  k.ground(rect(0.4, CY - W, CX - R_OUT + 0.4, CY + W), "#c9bfa9", { lw: 1.1 });
  k.ground(rect(CX + R_OUT - 0.4, CY - W, 9.6, CY + W), "#c9bfa9", { lw: 1.1 });
  // ring road
  c.beginPath(); ring(R_OUT).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
  ring(R_IN).reverse().forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
  c.fillStyle = ROAD; c.fill("evenodd");
  c.strokeStyle = "rgba(60,55,50,0.55)"; c.lineWidth = 1.2;
  for (const r of [R_OUT, R_IN]) { c.beginPath(); ring(r).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.stroke(); }
  c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 1.6; c.setLineDash([7, 8]);
  c.beginPath(); ring((R_L1 + R_L2) / 2, 120).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.stroke(); c.setLineDash([]);
  // zebra stripes on the ring at the four mouths
  for (const ang of [0, 90, 180, 270]) {
    const a = (ang * Math.PI) / 180, du = Math.cos(a), dv = Math.sin(a), nu = -dv, nv = du;
    for (let i = -3; i <= 3; i++) { const pu = CX + du * 3.72 + nu * i * 0.25, pv = CY + dv * 3.72 + nv * i * 0.25; k.ground([[pu - du * 0.3 - nu * 0.07, pv - dv * 0.3 - nv * 0.07], [pu + du * 0.3 - nu * 0.07, pv + dv * 0.3 - nv * 0.07], [pu + du * 0.3 + nu * 0.07, pv + dv * 0.3 + nv * 0.07], [pu - du * 0.3 + nu * 0.07, pv - dv * 0.3 + nv * 0.07]], "#f6f3ea", { stroke: false }); }
  }
  // round cobbled place
  k.ground(circ(R_IN, 72), "#d9d0bd", { lw: 1.4 });
  c.save(); c.beginPath(); ring(R_IN, 72).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.clip();
  c.strokeStyle = "rgba(110,100,85,0.22)"; c.lineWidth = 0.7; c.beginPath();
  for (let r = 0.4; r < R_IN; r += 0.3) { ring(r, 60).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); }
  for (let a = 0; a < 6.283; a += 0.26) { c.moveTo(...P(CX + Math.cos(a) * 2.2, CY + Math.sin(a) * 2.2)); c.lineTo(...P(CX + Math.cos(a) * R_IN, CY + Math.sin(a) * R_IN)); }
  c.stroke(); c.restore();
  // corner lawns
  for (const [u0, v0, u1, v1, seed] of LAWNS) { const pts = rect(u0, v0, u1, v1); k.ground(pts, "#a4c266", { lw: 1.3 }); k.grass(pts, { density: 12, seed }); k.ground(pts, null, { stroke: "rgba(60,90,30,0.5)", lw: 3, alpha: 0.5 }); k.ground(pts, null, { lw: 1.3 }); }
}

function bollards(k) {
  const c = k.ctx;
  for (let i = 0; i < 44; i++) {
    const a = (i / 44) * Math.PI * 2, u = CX + Math.cos(a) * 3.0, v = CY + Math.sin(a) * 3.0;
    k.q(u + v + 0.2, () => { const [x, y] = P(u, v, 0); c.fillStyle = "#e8e2d2"; c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.ellipse(x, y - 3, 2.4, 4, 0, 0, 7); c.fill(); c.stroke(); c.fillStyle = "#333"; c.beginPath(); c.arc(x, y - 6.5, 2, 0, 7); c.fill(); });
  }
}

// closed loops: every vehicle circles the ring, nothing leaves the tile. Same angular rate in both lanes.
const TAXI = "#f0e4c0", BUS = "#e9e6da", W_ANG = 0.3;
const LOOP_CARS = [
  [R_L1, 0.0, TAXI, true], [R_L1, 0.25, "#2f3a5c"], [R_L1, 0.5, "#d9544b"], [R_L1, 0.75, "#e8c14a", true],
  [R_L2, 0.08, BUS, false, true], [R_L2, 0.42, "#6a8f5a"], [R_L2, 0.62, TAXI, true], [R_L2, 0.85, "#3f73b5"],
];
function cars(k, t) {
  const c = k.ctx;
  for (const [r, off, col, taxi, bus] of LOOP_CARS) {
    const a = off * 6.2832 + t * W_ANG, u = CX + Math.cos(a) * r, v = CY + Math.sin(a) * r;
    k.q(u + v + (bus ? 0.9 : 0.4), () => drawCar(k, u, v, -Math.sin(a), Math.cos(a), col, { taxi, bus, wid: bus ? 0.5 : undefined }));
  }
}

const ROUTES = {
  thruR: [[7.5, 5.5], [2.8, 5.5]],
  thruR2: [[2.9, 6.2], [7.4, 6.2]],
  thruL: [[4.25, 7.9], [4.25, 2.7]],
  arcA: arcPts(2.65, 20, 75), arcB: arcPts(2.65, 100, 170), arcC: arcPts(2.65, 200, 250), arcD: arcPts(2.65, 280, 345),
  c1: [[0.6, 2.1], [1.9, 2.0], [2.3, 0.6]], c2: [[7.9, 0.6], [8.2, 2.0], [9.5, 2.1]],
  c3: [[0.6, 7.8], [1.9, 7.9], [2.3, 9.5]], c4: [[7.9, 9.5], [8.2, 7.9], [9.5, 7.8]],
};
const bikeLoop = arcPts(2.5, 0, 340);

export const camera = { u: 5.1, v: 5.3, z: 2.5, zoom: 2.0 };

export default function draw(k, t) {
  const c = k.ctx;
  ground(k);
  k.shadow([[6.6, 3.6, 0], [8.6, 4.2, 0], [8.6, 7.7, 0], [6.6, 7.0, 0]], 0.1);
  k.shadow([[3.6, 7.0, 0], [6.6, 7.0, 0], [7.0, 8.6, 0], [4.0, 8.6, 0]], 0.08);
  k.q(9.15, () => archInterior(k, t));
  k.q(9.2, () => archFaces(k, t));
  bollards(k);
  k.q(CX + CY + 1.9, () => flame(k, 5.7, 7.6, t));
  const TREE = [[0.9, 0.9, 1], [1.45, 1.35, 2], [8.9, 0.9, 3], [8.45, 1.4, 4], [0.9, 9.05, 5], [1.4, 8.7, 6], [9.0, 9.05, 7], [8.5, 8.75, 8]];
  const cols = ["#86b05a", "#7fae55", "#8cb85f"];
  for (const [u, v, s] of TREE) k.q(u + v + 0.3, () => k.tree(u, v, s >= 7 ? { r: 0.45, h: 1.2, seed: s * 5, col: cols[s % 3] } : { r: 0.55 + (s % 3) * 0.06, h: 1.5, seed: s * 5, col: cols[s % 3] }));
  for (const [u, v] of [[1.95, 2.0], [8.1, 2.0], [1.95, 8.2], [8.1, 8.2]]) k.q(u + v, () => k.lamp(u, v, { col: "#2f4a3c" }));
  cars(k, t);
  const W = (name, off, seed, sp = 0.42, extra = {}) => k.qwalker(ROUTES[name], { speed: sp, offset: off, seed, dwell: 1.2 + (seed % 3) * 0.6, ...extra });
  W("thruR", 0.0, 26, 0.3); W("thruR", 0.5, 34, 0.28); W("thruR2", 0.4, 27, 0.28); W("thruL", 0.2, 28, 0.3); W("thruL", 0.7, 35, 0.3);
  W("arcA", 0.0, 21); W("arcA", 0.5, 22, 0.4); W("arcB", 0.2, 23); W("arcC", 0.0, 24); W("arcD", 0.3, 25, 0.4);
  W("c1", 0.1, 29); W("c2", 0.4, 30); W("c3", 0.2, 31); W("c4", 0.6, 32);
  k.qcyclist(bikeLoop, { speed: 0.8, offset: 0.1, seed: 33, col: "#c8403a", basket: true });
  k.qperson(6.4, 8.0 - 0.1, { pose: "stand", dir: [0, -1], seed: 71 }); k.qperson(5.0, 7.9, { pose: "stand", dir: [0.2, -1], seed: 72, hat: "cap", hatCol: "#2f4b6c", top: "#2f4b6c" });
  k.qperson(7.55, 3.9, { pose: "photo", dir: [-1, 0.2], seed: 73 }); k.qperson(2.7, 4.6, { pose: "wave", dir: [1, 0], seed: 74 }); k.qperson(3.0, 7.4, { pose: "photo", dir: [1, -0.4], seed: 75 }); k.qperson(6.0, 2.7, { pose: "cheer", dir: [0, 1], seed: 76 });
  k.flush();
  flock(k, 480, 280, 7, t, 3);
  k.circlingBird(520, 250, 90, 26, { speed: 0.6, phase: 1 });
  k.cloud(220, 260, { s: 0.85, phase: 1 }); k.cloud(800, 230, { s: 0.7, phase: 3 });
}
