// DUBAI · 0,1 · Dubai Marina & Yacht Harbor (grid pass: everything through P(u,v,z), nothing outside the 10x10 footprint)
// Layout (u,v):  Cayan Tower (twisting stack of rotated floor plates) on a corner plaza at (1.65,1.65)
//   back row  : four axis-aligned glass towers on podiums, u 2.9-9.3, v 0.6-1.9, podium front v 2.75 (broad face = LEFT face)
//   left row  : four towers on podiums, u 0.6-1.9, v 3.0-9.4, podium front u 2.75 (broad face = RIGHT face)
//   basin     : u,v 3.9-8.6, water at -0.28, quay rails all round, pontoons P1 (u4.8) P2 (u7.7) along v and P3 (v7.6) along u
//   promenade : cafes at v=3.0 / u=3.0, two walking lanes round the basin, palms, lamps, planters
import { P, CTS, INK, shade, lerp, clamp, rng, spline } from "../../lib/vec-kit.js";
import { bedPoly, abra, wakeZ, cafeSet, parasolBig, opalm, hullBoat } from "./_t0_1.js";
import { makeTower, makeCayan, arcFin, sail, spire, frameBox } from "./marina.js";
import { WZ, tr, yacht2, wake2, bollard, railSeg, moorPeople, pot, planter, lampM, look2, podBox, pontoon } from "./_g0_1.js";

export const camera = { u: 5.4, v: 5.4, z: 3.4, zoom: 1.25 };

const PAVE = "#ecd6a8", STONE = "#e4cc9a";
const BE = "#e8c88e", PH = 1.0; // tower beige, podium height
const W0 = 3.9, W1 = 8.6, CH = 0.35;
const WATER = [[W0 + CH, W0], [W1 - CH, W0], [W1, W0 + CH], [W1, W1 - CH], [W1 - CH, W1], [W0 + CH, W1], [W0, W1 - CH], [W0, W0 + CH]];

// ---------- the eight towers ----------
const PIERS = (a, b) => [[0, 0.07, "p"], [0.07, a, "b"], [a, a + 0.06, "p"], [a + 0.06, b, "g"], [b, b + 0.06, "p"], [b + 0.06, 0.94, "b"], [0.94, 1, "p"]];
const BAL = [[0, 0.08, "p"], [0.08, 0.92, "b"], [0.92, 1, "p"]];
const GLS = [[0, 0.08, "p"], [0.08, 0.92, "g"], [0.92, 1, "p"]];
const ST = (h, i, L, R) => ({ h, ins: [i, i, i, i], L, R: R || L, capH: 0.05 });
const T = {};
// L-face crowns (back row) and R-face crowns (left row)
const FLb = (top) => (s, z) => P(top.u + s, top.v + top.dv, z);
const FRl = (top) => (s, z) => P(top.u + top.du, top.v + s, z);
function buildTowers() {
  // ----- back row: broad face = LEFT face (v + dv) -----
  T.b1 = makeTower({ u: 2.9, v: 0.6, du: 1.5, dv: 1.3, z0: PH, beige: BE, seed: 1, floor: 0.25, tiers: [
    { h: 4.6, L: [[0, 0.05, "p"], [0.05, 0.4, "b"], [0.4, 0.46, "p"], [0.46, 0.98, "g"], [0.98, 1, "p"]], R: BAL },
    ST(0.5, 0.15, [[0, 1, "g"]]), ST(0.4, 0.45, [[0, 1, "p"]], [[0, 1, "g"]])],
  crown: (k, t, top) => frameBox(k, t, top.u + 0.05, top.v + 0.05, top.du - 0.1, top.dv - 0.1, top.z1, 0.34, { seed: 1, beige: BE }) });
  T.b2 = makeTower({ u: 4.6, v: 0.7, du: 1.4, dv: 1.2, z0: PH, beige: BE, seed: 2, floor: 0.2, tiers: [
    { h: 6.5, L: PIERS(0.32, 0.76), R: BAL }, ST(0.5, 0.12, [[0, 1, "g"]]), ST(0.42, 0.35, [[0, 0.1, "p"], [0.1, 1, "g"]], [[0, 1, "g"]])],
  crown: (k, t, top) => spire(k, top.u + top.du * 0.5, top.v + top.dv * 0.5, top.z1, 1.3, { ph: 1.3 }) });
  T.b3 = makeTower({ u: 6.2, v: 0.6, du: 1.4, dv: 1.3, z0: PH, beige: BE, seed: 3, floor: 0.2, tiers: [
    { h: 3.9, L: [[0, 0.1, "p"], [0.1, 0.9, "b"], [0.9, 1, "p"]], R: GLS }, ST(0.36, 0.1, [[0, 1, "g"]])],
  crown: (k, t, top) => sail(k, t, FLb(top), 0.02, top.du - 0.02, top.z1, 0.8, [0, -0.5]) });
  T.b4 = makeTower({ u: 7.8, v: 0.6, du: 1.5, dv: 1.3, z0: PH, beige: BE, seed: 4, floor: 0.17, tiers: [
    { h: 5.7, L: PIERS(0.3, 0.74), R: BAL }, ST(0.45, 0.1, [[0, 1, "g"]]), ST(0.25, 0.3, [[0, 1, "g"]])],
  crown: (k, t, top) => arcFin(k, FLb(top), 0.05, top.du * 0.95, top.z1, 0.55, 0.09, { depth: [0, -3] }) });
  // ----- left row: broad face = RIGHT face (u + du) -----
  T.l1 = makeTower({ u: 0.6, v: 3.0, du: 1.3, dv: 1.5, z0: PH, beige: BE, seed: 5, floor: 0.25, tiers: [
    { h: 4.2, R: [[0, 0.05, "p"], [0.05, 0.4, "b"], [0.4, 0.46, "p"], [0.46, 0.98, "g"], [0.98, 1, "p"]], L: GLS },
    ST(0.5, 0.14, [[0, 1, "g"]]), ST(0.36, 0.42, [[0, 1, "p"]], [[0, 1, "g"]])],
  crown: (k, t, top) => frameBox(k, t, top.u + 0.04, top.v + 0.05, top.du - 0.08, top.dv - 0.1, top.z1, 0.34, { seed: 5, beige: BE }) });
  T.l2 = makeTower({ u: 0.6, v: 4.7, du: 1.2, dv: 1.4, z0: PH, beige: BE, seed: 6, floor: 0.2, tiers: [
    { h: 6.2, R: PIERS(0.3, 0.74), L: BAL }, ST(0.5, 0.12, [[0, 1, "g"]]), ST(0.4, 0.33, [[0, 0.1, "p"], [0.1, 1, "g"]], [[0, 1, "g"]])],
  crown: (k, t, top) => spire(k, top.u + top.du * 0.5, top.v + top.dv * 0.5, top.z1, 1.2, { ph: 0.4 }) });
  T.l3 = makeTower({ u: 0.6, v: 6.3, du: 1.3, dv: 1.4, z0: PH, beige: BE, seed: 7, floor: 0.2, tiers: [
    { h: 3.7, R: [[0, 0.1, "p"], [0.1, 0.9, "b"], [0.9, 1, "p"]], L: GLS }, ST(0.34, 0.1, [[0, 1, "g"]])],
  crown: (k, t, top) => arcFin(k, FRl(top), 0.05, top.dv * 0.95, top.z1, 0.55, 0.09, { depth: [-3, -1.7] }) });
  T.l4 = makeTower({ u: 0.6, v: 7.9, du: 1.3, dv: 1.5, z0: PH, beige: BE, seed: 8, floor: 0.17, tiers: [
    { h: 5.3, R: [[0, 0.07, "p"], [0.07, 0.42, "b"], [0.42, 0.48, "p"], [0.48, 0.98, "g"], [0.98, 1, "p"]], L: BAL }, ST(0.45, 0.1, [[0, 1, "g"]]), ST(0.25, 0.3, [[0, 1, "g"]])],
  crown: (k, t, top) => sail(k, t, FRl(top), 0.02, top.dv - 0.02, top.z1, 0.8, [-0.5, 0]) });
}
buildTowers();
const CAY = makeCayan(1.65, 1.65, 0.5, 7.6, { z0: 0.3, levels: 50 });

// podiums: back row (broad L face) and left row (broad R face); gr = roof-garden rectangle in front of the tower
const PODS = [
  { u: 2.8, v: 0.4, du: 1.7, dv: 2.35, h: PH, seed: 11, T: "b1", gr: [3.0, 2.05, 4.3, 2.6], row: "b" },
  { u: 4.5, v: 0.4, du: 1.6, dv: 2.35, h: PH, seed: 12, T: "b2", gr: [4.7, 2.05, 5.9, 2.6], row: "b" },
  { u: 6.1, v: 0.4, du: 1.6, dv: 2.35, h: PH, seed: 13, T: "b3", gr: [6.3, 2.05, 7.5, 2.6], row: "b" },
  { u: 7.7, v: 0.4, du: 1.7, dv: 2.35, h: PH, seed: 14, T: "b4", gr: [7.9, 2.05, 9.2, 2.6], row: "b" },
  { u: 0.4, v: 2.9, du: 2.35, dv: 1.7, h: PH, seed: 15, T: "l1", gr: [2.05, 3.1, 2.6, 4.4], row: "l" },
  { u: 0.4, v: 4.6, du: 2.35, dv: 1.6, h: PH, seed: 16, T: "l2", gr: [2.05, 4.8, 2.6, 6.0], row: "l" },
  { u: 0.4, v: 6.2, du: 2.35, dv: 1.6, h: PH, seed: 17, T: "l3", gr: [2.05, 6.4, 2.6, 7.6], row: "l" },
  { u: 0.4, v: 7.8, du: 2.35, dv: 1.7, h: PH, seed: 18, T: "l4", gr: [2.05, 8.0, 2.6, 9.3], row: "l" },
];
// depth of a long podium / its tower: the point of its front face nearest the middle of the run
const pdepth = (p) => (p.row === "b" ? (p.u + p.du * 0.5) + (p.v + p.dv) : (p.u + p.du) + (p.v + p.dv * 0.5)) - 0.25;

function roofGarden(k, t, gr, h, seed) {
  const c = k.ctx, R = rng(seed * 31 + 7), n = Math.round((gr[2] - gr[0]) * (gr[3] - gr[1]) * 6) + 3, spots = [];
  for (let i = 0; i < n; i++) spots.push([lerp(gr[0], gr[2], R()), lerp(gr[1], gr[3], R()), R()]);
  spots.sort((a, b) => a[0] + a[1] - b[0] - b[1]);
  for (const [uu, vv, r] of spots) {
    const [x, y] = P(uu, vv, h + 0.02), sw = Math.sin(t * 1.1 + r * 20) * 0.8;
    if (r < 0.22) {
      const [, yt] = P(uu, vv, h + 0.5);
      c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt + 4); c.stroke(); c.strokeStyle = "#8a6446"; c.lineWidth = 1.5; c.stroke();
      k._lobe(x - 5 + sw, yt - 1, 7, "#5f9a45", Math.round(r * 900), { bumps: 7, lw: 0.8 }); k._lobe(x + 5 + sw, yt, 7, "#6faa4e", Math.round(r * 900) + 1, { bumps: 7, lw: 0.8 }); k._lobe(x + sw, yt - 7, 8, "#78ae52", Math.round(r * 900) + 2, { bumps: 7, lw: 0.8 });
    } else {
      k._lobe(x, y - 3, 5 + r * 4, r < 0.6 ? "#5f9a45" : "#78ae52", Math.round(r * 700), { bumps: 7, lw: 0.8 });
      if (r > 0.6) { c.fillStyle = ["#e0457a", "#f06ba8", "#fff", "#f4a640"][Math.floor(r * 40) % 4]; for (let j = 0; j < 4; j++) { c.beginPath(); c.arc(x + (R() - 0.5) * 9, y - 5 + (R() - 0.5) * 4, 1.4, 0, 6.3); c.fill(); } }
    }
  }
}

// ---------- layout data ----------
const PONT = [
  { A: [4.8, 3.95], B: [4.8, 6.3] }, { A: [7.7, 3.95], B: [7.7, 6.1] }, { A: [3.95, 7.6], B: [6.0, 7.6] },
];
// moored craft: [u, v, dir, len, wid, seed, kind]
const MOOR = [
  [5.3, 5.1, [0, 1], 1.8, 0.5, 1, "y"], [4.35, 5.2, [0, 1], 0.9, 0.32, 2, "t"],
  [7.25, 5.1, [0, 1], 1.7, 0.48, 3, "y"], [8.15, 4.9, [0, 1], 0.9, 0.32, 4, "a"],
  [4.95, 7.1, [1, 0], 1.7, 0.48, 5, "y"], [4.95, 8.1, [1, 0], 1.7, 0.48, 6, "y"],
];
// gliding loop inside the basin
const LOOP = Array.from({ length: 16 }, (_, i) => [7.25 + Math.cos((i / 16) * 6.2832) * 0.9, 7.4 + Math.sin((i / 16) * 6.2832) * 0.9]);
const LSP = spline(LOOP, true);

const PALMS = [ // u, v, h, lean
  [3.4, 3.2, 2.0, 0.08], [6.95, 3.2, 1.9, 0.1], [8.9, 3.2, 2.1, -0.1],
  [3.2, 6.95, 1.9, 0.1], [3.2, 8.9, 2.1, -0.1],
  [9.45, 4.2, 2.0, -0.1], [9.45, 7.6, 2.0, -0.08], [4.4, 9.45, 2.1, 0.1], [7.8, 9.45, 2.2, 0.08],
  [0.55, 2.55, 2.3, 0.1], [2.65, 0.55, 2.4, -0.1],
];
const CAFES = [[4.3, 3.0, 1], [6.1, 3.0, 2], [8.0, 3.0, 3], [3.0, 4.3, 4], [3.0, 6.1, 5], [3.0, 8.0, 6]];
const LAMPS = [[4.2, 3.88], [5.9, 3.88], [7.2, 3.88], [8.3, 3.88], [3.88, 4.4], [3.88, 6.0], [3.88, 7.0], [3.88, 8.2], [8.62, 4.6], [8.62, 6.2], [8.62, 7.8], [4.6, 8.62], [6.2, 8.62], [7.8, 8.62]];

// ---------- main ----------
export default function draw(k, t) {
  const Q = (d, fn) => k.q(d, fn);
  ground(k, t);
  Q(CAYAN_D, () => cayanPlaza(k, t));
  for (const p of PODS) {
    Q(pdepth(p), () => podBox(k, t, { ...p, garden: false, awn: null }));
    Q(pdepth(p) + 0.05, () => T[p.T].draw(k, t));
    Q(pdepth(p) + 0.1, () => roofGarden(k, t, p.gr, p.h, p.seed));
  }
  furniture(k, t);
  boatsAll(k, t);
  crowd(k, t);
  k.flush();
}
const CAYAN_D = 4.6;

function cayanPlaza(k, t) {
  const base = k.box(0.9, 0.9, 0, 1.5, 1.5, 0.3, "#f0e3c4", { shadow: false, hatch: false });
  void base;
  CAY.draw(k, t);
}

// ---------- ground, water, quay ----------
function ground(k, t) {
  const c = k.ctx;
  k.slab(PAVE);
  c.save(); k._trace([P(0, 0), P(10, 0), P(10, 10), P(0, 10)], true, 0); c.clip();
  c.strokeStyle = "rgba(160,125,80,0.24)"; c.lineWidth = 0.8; c.beginPath();
  for (let i = 1; i < 20; i++) { const f = i * 0.5; c.moveTo(...P(f, 0)); c.lineTo(...P(f, 10)); c.moveTo(...P(0, f)); c.lineTo(...P(10, f)); }
  c.stroke();
  // darker inlaid stripe round the basin + stone plaza under Cayan
  c.strokeStyle = "rgba(190,150,98,0.42)"; c.lineWidth = 5; c.beginPath();
  [...WATER, WATER[0]].forEach(([u, v], i) => { const a = u < 6.25 ? -0.34 : 0.34, b = v < 6.25 ? -0.34 : 0.34, p = P(u + a, v + b, 0); i ? c.lineTo(...p) : c.moveTo(...p); }); c.stroke();
  c.restore();
  k.ground([[0.45, 0.45], [2.8, 0.45], [2.8, 2.8], [0.45, 2.8]], "#e9d9b4", { lw: 1.1 });
  waterBasin(k, t);
}

function bankY(x) { return CTS.Y0 + (W0 * 2 + Math.abs(x - CTS.X0) / CTS.S) * CTS.S * CTS.YS; }
function waterBasin(k, t) {
  const c = k.ctx;
  const outline0 = WATER.map(([u, v]) => P(u, v, 0)), pts = WATER.map(([u, v]) => P(u, v, WZ));
  c.save(); tr(c, outline0); c.clip();
  tr(c, pts);
  const g = c.createLinearGradient(0, P(4, 4, 0)[1], 0, P(9, 9, 0)[1]);
  g.addColorStop(0, "#2fb7b2"); g.addColorStop(0.45, "#28a9ae"); g.addColorStop(1, "#1d94a8");
  c.fillStyle = g; c.fill();
  c.save(); tr(c, pts); c.clip();
  // tower reflections: wobbling dash columns under every tower
  const ref = [];
  for (const key of ["b1", "b2", "b3", "b4", "l1", "l2", "l3", "l4"]) {
    const s = T[key].spec, x0 = P(s.u, s.v + s.dv)[0], x1 = P(s.u + s.du, s.v)[0], w = (x1 - x0) / 3;
    ref.push([x0 + 2, x0 + w, "rgba(250,214,110,0.8)"], [x0 + w + 2, x0 + 2 * w, "rgba(70,150,200,0.55)"], [x0 + 2 * w + 2, x1 - 2, "rgba(250,210,105,0.75)"]);
  }
  for (const [x0, x1, col] of ref) {
    c.fillStyle = col;
    const yb = bankY((x0 + x1) / 2);
    for (let y = yb, i = 0; y < yb + 150; y += 5.5, i++) {
      const wob = Math.sin(t * 1.4 + y * 0.09 + x0 * 0.05) * 3.2 + Math.sin(t * 2.7 + i) * 1.1;
      const len = (x1 - x0) * (0.55 + 0.45 * Math.abs(Math.sin(i * 1.7 + x0)));
      const a = clamp(1 - (y - yb) / 150) * (0.65 + 0.35 * Math.sin(t * 1.9 + i * 0.8));
      c.globalAlpha = Math.min(1, a * 1.1); c.beginPath(); c.roundRect(x0 + wob + (x1 - x0 - len) / 2, y, len, 4, 2); c.fill();
    }
  }
  c.globalAlpha = 1;
  // ripples
  c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 1.3; c.lineCap = "round";
  const R = rng(41);
  for (let i = 0; i < 150; i++) {
    const u0 = lerp(W0, W1, R()), v0 = lerp(W0, W1, R()), ph = R() * 6.28, sp = 0.6 + R() * 0.7;
    const a = 0.5 + 0.5 * Math.sin(t * 1.6 * sp + ph), drift = ((t * 0.05 * sp + R()) % 1) * 0.4;
    const uu = u0 + drift * 0.8, vv = v0 - drift * 0.2;
    if (uu > W1 - 0.2 || vv < W0 + 0.1) continue;
    const [x, y] = P(uu, vv, WZ);
    c.globalAlpha = a * 0.85; c.beginPath(); c.moveTo(x - 6, y); c.quadraticCurveTo(x - 3, y - 2, x, y); c.quadraticCurveTo(x + 3, y + 2, x + 6, y); c.stroke();
  }
  c.globalAlpha = 1;
  c.restore(); c.restore();
  // quay walls facing the water: back (v=W0) and left (u=W0)
  const wall = (a, b, col) => k.path([P(a[0], a[1], 0), P(b[0], b[1], 0), P(b[0], b[1], WZ), P(a[0], a[1], WZ)], { fill: col, lw: 1.1, wobble: 0 });
  for (let u = W0 + CH, i = 0; u < W1 - CH - 0.01; u += 0.7, i++) wall([u, W0], [Math.min(u + 0.7, W1 - CH), W0], i % 2 ? STONE : shade(STONE, -0.05));
  for (let v = W0 + CH, i = 0; v < W1 - CH - 0.01; v += 0.7, i++) wall([W0, v], [W0, Math.min(v + 0.7, W1 - CH)], i % 2 ? shade(STONE, -0.1) : shade(STONE, -0.15));
  c.strokeStyle = "rgba(255,255,255,0.65)"; c.lineWidth = 1.4; c.beginPath();
  c.moveTo(...P(W0, W1 - CH, WZ - 0.02)); c.lineTo(...P(W0, W0 + CH, WZ - 0.02)); c.lineTo(...P(W0 + CH, W0, WZ - 0.02)); c.lineTo(...P(W1 - CH, W0, WZ - 0.02)); c.stroke();
  // coping rim
  c.strokeStyle = "#f5e6c2"; c.lineWidth = 3; c.beginPath(); WATER.forEach(([u, v], i) => { const p = P(u, v, 0); i ? c.lineTo(...p) : c.moveTo(...p); }); c.closePath(); c.stroke();
  c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
}

// ---------- boats, pontoons, rails ----------
function boatsAll(k, t) {
  const c = k.ctx, Q = (d, fn) => k.q(d, fn);
  for (const p of PONT) {
    Q((p.A[0] + p.A[1] + p.B[0] + p.B[1]) / 2 + 0.25, () => pontoon(k, p));
    for (const e of [p.A, p.B]) Q(e[0] + e[1] + 0.3, () => bollard(k, e[0], e[1], -0.08, 0.5));
  }
  for (const [u, v, dir, len, wid, seed, kind] of MOOR) {
    Q(u + v + 0.8, () => {
      if (kind === "y") { const Y = yacht2(k, u, v, dir, { len, wid, ph: seed * 1.7 }); moorPeople(k, Y, seed); }
      else if (kind === "a") abra(k, u, v, dir, { z: WZ + 0.1, len, wid, ph: seed });
      else hullBoat(k, u, v, dir, { len, wid, h: 0.16, z: WZ + 0.02, col: "#f6f3ec", hull: "#2f6f9e", stripe: "#c8402f", ph: seed });
    });
  }
  // two craft glide round the loop (counter-clockwise on screen), opposite sides of the circle
  [0, 0.5].forEach((off, i) => {
    const s = LSP.sample(((t * 0.62 + off * LSP.L) % LSP.L + LSP.L) % LSP.L), dir = [s.du, s.dv];
    Q(s.u + s.v + 0.9, () => {
      if (i === 0) { wake2(k, s.u, s.v, dir, WZ, { len: 1.6, w: 0.5, hl: 0.65 }); yacht2(k, s.u, s.v, dir, { len: 1.3, wid: 0.36, ph: 7, guests: [[0.1, 0]] }); }
      else { wakeZ(k, s.u, s.v, dir, WZ, { len: 1.4, w: 0.45 }); abra(k, s.u, s.v, dir, { z: WZ + 0.1, len: 1.1, wid: 0.4, ph: 3 }); }
    });
  });
  // rails round the basin in short segments, each at its own depth so boats and walkers sort correctly
  const gaps = PONT.map((p) => [p.A[0], p.A[1], 0.42]);
  const seg = (a, b) => Q((a[0] + a[1] + b[0] + b[1]) / 2, () => railSeg(k, a, b, gaps));
  const N = 6, e0 = W0 + CH, e1 = W1 - CH, st = (e1 - e0) / N;
  for (let i = 0; i < N; i++) {
    const a = e0 + i * st, b = a + st;
    seg([a, W0], [b, W0]); seg([W0, a], [W0, b]); seg([W1, a], [W1, b]); seg([a, W1], [b, W1]);
  }
  seg([W0, W0 + CH], [W0 + CH, W0]); seg([W1 - CH, W0], [W1, W0 + CH]); seg([W0, W1 - CH], [W0 + CH, W1]); seg([W1, W1 - CH], [W1 - CH, W1]);
}

// ---------- furniture ----------
function furniture(k, t) {
  const Q = (d, fn) => k.q(d, fn);
  PALMS.forEach(([u, v, h, l], i) => Q(u + v + 0.15, () => opalm(k, u, v, { h, lean: l, seed: 100 + i, len: 0.62, wide: 1.2, fronds: 20 })));
  CAFES.forEach(([u, v, sd], i) => Q(u + v + 0.45, () => cafeSet(k, u, v, sd, { col: i % 2 ? "#f1e6c8" : "#f4ecd8", sitters: 3, seats: [[0.3, 0.0], [-0.28, 0.05], [0.04, 0.3], [0.05, -0.28]], ph: sd })));
  LAMPS.forEach(([u, v]) => Q(u + v + 0.2, () => lampM(k, u, v)));
  [[9.3, 9.3, 1], [3.15, 9.45, 2], [9.45, 3.15, 3]].forEach(([u, v, s]) => Q(u + v + 0.3, () => pot(k, u, v, s)));
  [[9.3, 5.0], [9.3, 6.7], [5.2, 9.3], [7.0, 9.3]].forEach(([u, v], i) => Q(u + v + 0.5, () => (i < 2 ? planter(k, u, v, 0.38) : planter(k, u, v, 0.5))));
  // Cayan plaza beds
  Q(0.5 + 2.3 + 0.5, () => bedPoly(k, [[0.5, 1.0], [0.8, 1.0], [0.8, 2.5], [0.5, 2.5]], 1, { density: 12 }));
}

// ---------- people ----------
const dens = (pts, closed, step = 0.9) => {
  const out = [], m = pts.length;
  for (let i = 0; i < (closed ? m : m - 1); i++) {
    const a = pts[i], b = pts[(i + 1) % m], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let j = 0; j < n; j++) out.push([lerp(a[0], b[0], j / n), lerp(a[1], b[1], j / n)]);
  }
  if (!closed) out.push(pts[m - 1]);
  return out;
};
const RING_A = dens([[3.4, 3.4], [8.85, 3.4], [8.85, 8.85], [3.4, 8.85]], true);
const RING_B = dens([[3.72, 3.72], [3.72, 9.15], [9.15, 9.15], [9.15, 3.72]], true);
const PL = dens([[2.62, 1.0], [2.62, 2.4]], false);
const PL2 = dens([[0.95, 0.65], [2.55, 0.65]], false);
const PW = [[[4.8, 4.2], [4.8, 6.25]], [[7.7, 4.2], [7.7, 6.05]], [[4.1, 7.6], [5.95, 7.6]]];
function crowd(k, t) {
  const A = [[0.0, 601, 0.36], [0.2, 602, 0.32], [0.4, 603, 0.4], [0.62, 604, 0.3], [0.82, 605, 0.34]];
  const B = [[0.1, 606, 0.34], [0.3, 607, 0.3], [0.5, 608, 0.38], [0.7, 609, 0.32], [0.9, 610, 0.36]];
  for (const [off, seed, sp] of A) k.qwalker(RING_A, { speed: sp, offset: off, seed, loop: true, ...look2(seed) });
  for (const [off, seed, sp] of B) k.qwalker(RING_B.slice().reverse(), { speed: sp, offset: off, seed, loop: true, ...look2(seed) });
  k.qwalker(PL, { speed: 0.35, offset: 0.1, seed: 611, dwell: 1.8, ...look2(611) });
  k.qwalker(PL2, { speed: 0.3, offset: 0.55, seed: 612, dwell: 2.0, ...look2(612) });
  PW.forEach((r, i) => k.qwalker(r, { speed: 0.3, offset: 0.2 + i * 0.3, seed: 613 + i, dwell: 2.4, ...look2(613 + i) }));
  [[[1.3, 2.62], 621, "stand", [0.6, -0.5]], [[1.55, 2.62], 622, "wave", [-0.6, -0.5]], [[2.05, 2.6], 623, "photo", [-0.3, -1]]]
    .forEach(([[u, v], sd, pose, dir]) => k.qperson(u, v, { pose, dir, seed: sd, ...look2(sd) }));
}
