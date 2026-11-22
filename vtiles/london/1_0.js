// LONDON · St Paul's & the Millennium Bridge (grid pass: everything through P(), axis-aligned, inside 0.3..9.7)
// Layout (u,v):
//   cathedral (stpauls.js): choir v 0.4-1.8, transepts u 0.9-7.1 v 1.8-3.3, nave u 2.6-5.4 v 3.3-5.7, dome (4.0, 2.55),
//     west front + towers v 4.7-5.7 (portico to v 6.3, steps to v 6.78) on the LEFT face
//   plaza v 6.8-7.2, quay wall v = 7.2, Thames v 7.2-9.5 (sunk), near bank v 9.5-9.7
//   Millennium Bridge along v at u 3.7-4.3 from the quay (v 7.2) to the landing (v 9.5), Y-arm pier at v 8.35
//   lawns left (u<2.1) and right (u>6.2), plane trees, lamps, benches
import { P, INK, shade, lerp, clamp, rng } from "../../lib/vec-kit.js";
import { makeStPauls } from "./stpauls.js";
import { keepOut, dense, pigeon, drive } from "./_props.js";
import { bx, rboat, rwake, ST, ST_L, ST_D } from "./_g1_0.js";

const CATH = makeStPauls();
const ZW = -0.25;
const RV0 = 7.2, RV1 = 9.5;
const BU0 = 3.7, BU1 = 4.3, BZ = 0.22, PIERV = 8.35;
const PAVE = "#e9d2ae";

const chaikin = (pts, n = 2) => { for (let i = 0; i < n; i++) { const o = []; for (let j = 0; j < pts.length; j++) { const a = pts[j], b = pts[(j + 1) % pts.length]; o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } pts = o; } return pts; };
const LAWNS = [
  chaikin([[0.5, 3.7], [2.05, 3.7], [2.1, 6.55], [0.5, 6.65]]),
  chaikin([[6.3, 3.8], [9.5, 3.8], [9.5, 6.65], [6.45, 6.7], [6.2, 5.0]]),
  chaikin([[7.5, 0.6], [9.5, 0.6], [9.5, 3.2], [7.5, 3.2]]),
  chaikin([[0.5, 0.6], [2.6, 0.6], [2.6, 1.55], [0.5, 1.55]]),
];

function ground(k, t) {
  const c = k.ctx;
  k.groundTrace({ lawn: LAWNS, water: [] }, { lawn: "#8aab4f", paved: PAVE, side: "#dcc79f", stipple: 11, tufts: 11 });
  // flagstone setts on the paving (outside the lawns), plaza only
  c.save();
  c.beginPath(); [[0.3, 0.3], [9.7, 0.3], [9.7, RV0], [0.3, RV0]].forEach(([u, v], i) => (i ? c.lineTo(...P(u, v)) : c.moveTo(...P(u, v)))); c.closePath();
  for (const poly of LAWNS) { poly.forEach(([u, v], i) => (i ? c.lineTo(...P(u, v)) : c.moveTo(...P(u, v)))); c.closePath(); }
  c.clip("evenodd");
  const RS = rng(5);
  for (let j = 0; j < 21; j++) for (let i = 0; i < 29; i++) {
    const u = 0.3 + i * 0.34 + (j % 2) * 0.17, v = 0.3 + j * 0.34, w = 0.3 + RS() * 0.05;
    const pts = [[u, v], [u + w, v], [u + w, v + 0.3], [u, v + 0.3]].map(([a, b]) => P(a, b));
    c.beginPath(); pts.forEach((p, n) => (n ? c.lineTo(...p) : c.moveTo(...p))); c.closePath();
    const tone = RS(); c.fillStyle = tone < 0.33 ? "rgba(255,240,215,0.28)" : tone < 0.66 ? "rgba(190,140,100,0.10)" : "rgba(160,110,80,0.06)"; c.fill();
    c.strokeStyle = "rgba(150,110,75,0.30)"; c.lineWidth = 0.6; c.stroke();
  }
  c.restore();
  river(k, t);
}

function river(k, t) {
  const c = k.ctx, W = [[0.3, RV0], [9.7, RV0], [9.7, RV1], [0.3, RV1]];
  const W2 = W.map(([u, v]) => P(u, v, ZW));
  k.path(W2, { fill: "#4f8a93", lw: 1.3, wobble: 0 });
  c.save(); k._trace(W2, true, 0); c.clip();
  k.water(W, { z: ZW, color: "#4f8a93", density: 3.4, flow: 0.5, seed: 4, dir: [1, 0] });
  // quay shadow, bridge shadow, golden sparkle
  c.strokeStyle = "rgba(20,70,70,0.22)"; c.lineWidth = 9; c.beginPath(); c.moveTo(...P(0.3, RV0 + 0.1, ZW)); c.lineTo(...P(9.7, RV0 + 0.1, ZW)); c.stroke();
  k.poly([[BU0 + 0.12, RV0, ZW], [BU1 + 0.12, RV0, ZW], [BU1 + 0.12, RV1, ZW], [BU0 + 0.12, RV1, ZW]], "rgba(15,50,60,0.2)", { stroke: false });
  const R = rng(3);
  for (let i = 0; i < 60; i++) { const u = 0.5 + R() * 9, v = RV0 + 0.2 + R() * 2.1, tw = Math.max(0, Math.sin(t * 2.4 + i * 1.7)); const [x, y] = P(u, v, ZW); c.fillStyle = `rgba(255,230,140,${0.15 + tw * 0.6})`; c.fillRect(x - 3, y - 0.8, 6, 1.6); }
  c.restore();
  // quay wall (faces the plaza side +v) and the left end wall (faces +u)
  k.poly([[0.3, RV0, ZW], [9.7, RV0, ZW], [9.7, RV0, 0], [0.3, RV0, 0]], "#d6c29a", { lw: 1.2, wobble: 0 });
  k.poly([[0.3, RV0, ZW], [0.3, RV1, ZW], [0.3, RV1, 0], [0.3, RV0, 0]], "#b9a27a", { lw: 1.2, wobble: 0 });
  c.save(); c.strokeStyle = "rgba(110,85,50,0.45)"; c.lineWidth = 0.7; c.beginPath();
  c.moveTo(...P(0.3, RV0, ZW / 2)); c.lineTo(...P(9.7, RV0, ZW / 2));
  for (let u = 0.5, r = 0; u < 9.7; u += 0.42, r++) { c.moveTo(...P(u, RV0, r % 2 ? 0 : ZW / 2)); c.lineTo(...P(u, RV0, r % 2 ? ZW / 2 : ZW)); }
  c.moveTo(...P(0.3, RV0, ZW / 2)); c.lineTo(...P(0.3, RV1, ZW / 2));
  for (let v = RV0 + 0.2, r = 0; v < RV1; v += 0.42, r++) { c.moveTo(...P(0.3, v, r % 2 ? 0 : ZW / 2)); c.lineTo(...P(0.3, v, r % 2 ? ZW / 2 : ZW)); }
  c.stroke(); c.restore();
  // coping along the plaza edge
  k.poly([[0.3, RV0 - 0.14, 0], [9.7, RV0 - 0.14, 0], [9.7, RV0, 0], [0.3, RV0, 0]], "#f0e3c4", { lw: 0.8, wobble: 0 });
  // near bank and right rim redrawn over the sunk water
  k.poly([[0, RV1, 0], [10, RV1, 0], [10, 10, 0], [0, 10, 0]], PAVE, { lw: 1.3, wobble: 0 });
  k.poly([[9.7, 0, 0], [10, 0, 0], [10, 10, 0], [9.7, 10, 0]], PAVE, { lw: 1.3, wobble: 0 });
  k.poly([[0, RV0, 0], [0.3, RV0, 0], [0.3, RV1, 0], [0, RV1, 0]], PAVE, { lw: 1.3, wobble: 0 });
  // flagstones on the near bank
  c.strokeStyle = "rgba(150,110,75,0.3)"; c.lineWidth = 0.6; c.beginPath();
  for (let u = 0.3; u < 9.7; u += 0.34) { c.moveTo(...P(u, RV1, 0)); c.lineTo(...P(u, 10, 0)); }
  c.stroke();
}

// ---------- Millennium Bridge ----------
const NSEG = 8, SEGV = (RV1 - RV0) / NSEG;
const cableZ = (v) => 0.4 - 0.11 * Math.min(1, Math.abs(v - PIERV) / 1.15) - 0.035 * Math.sin(Math.PI * clamp(1 - Math.abs(v - PIERV) / 1.15));
const cableU = (side, v) => (side < 0 ? lerp(3.45, 3.62, Math.min(1, Math.abs(v - PIERV) / 1.15)) : lerp(4.55, 4.38, Math.min(1, Math.abs(v - PIERV) / 1.15)));
function deckSeg(k, v0, v1, last) {
  k.poly([[BU1, v0, BZ - 0.1], [BU1, v1, BZ - 0.1], [BU1, v1, BZ], [BU1, v0, BZ]], "#a39c90", { lw: 0.9, wobble: 0 });
  if (last) k.poly([[BU0, v1, BZ - 0.1], [BU1, v1, BZ - 0.1], [BU1, v1, BZ], [BU0, v1, BZ]], "#bdb6a8", { lw: 0.9, wobble: 0 });
  k.poly([[BU0, v0, BZ], [BU1, v0, BZ], [BU1, v1, BZ], [BU0, v1, BZ]], "#e4ddcf", { lw: 0.9, wobble: 0 });
  const c = k.ctx; c.strokeStyle = "rgba(120,105,80,0.38)"; c.lineWidth = 0.6; c.beginPath();
  for (let i = 1; i < 6; i++) { const v = lerp(v0, v1, i / 6); c.moveTo(...P(BU0, v, BZ)); c.lineTo(...P(BU1, v, BZ)); }
  c.moveTo(...P(4.0, v0, BZ)); c.lineTo(...P(4.0, v1, BZ)); c.stroke();
}
function sideRig(k, side, v0, v1) {
  const c = k.ctx, eu = side < 0 ? BU0 + 0.03 : BU1 - 0.03; c.lineCap = "round";
  // handrail + posts at deck edge
  c.strokeStyle = "#8f9297"; c.lineWidth = 1; c.beginPath();
  for (let i = 0; i <= 3; i++) { const v = lerp(v0, v1, i / 3); c.moveTo(...P(eu, v, BZ)); c.lineTo(...P(eu, v, BZ + 0.15)); }
  c.stroke();
  c.strokeStyle = INK; c.lineWidth = 2.2; c.beginPath(); c.moveTo(...P(eu, v0, BZ + 0.15)); c.lineTo(...P(eu, v1, BZ + 0.15)); c.stroke();
  c.strokeStyle = "#d3d6da"; c.lineWidth = 1; c.stroke();
  // main cable + hangers
  const pts = []; for (let i = 0; i <= 4; i++) { const v = lerp(v0, v1, i / 4); pts.push([cableU(side, v), v, cableZ(v)]); }
  c.strokeStyle = "rgba(90,94,100,0.8)"; c.lineWidth = 0.7; c.beginPath();
  for (let i = 0; i <= 3; i++) { const v = lerp(v0, v1, i / 3), cz = cableZ(v); c.moveTo(...P(cableU(side, v), v, cz)); c.lineTo(...P(eu, v, BZ + 0.15)); }
  c.stroke();
  k.line3(pts, { lw: 2.6, wobble: 0, stroke: INK }); k.line3(pts, { lw: 1.3, wobble: 0, stroke: "#c9ccd1" });
}
function pierDraw(k, t) {
  const c = k.ctx, rp = (Math.sin(t * 1.6) + 1) / 2;
  c.save(); c.strokeStyle = "rgba(255,255,255,0.5)"; c.lineWidth = 1;
  for (const r of [0.34 + rp * 0.06, 0.46 + (1 - rp) * 0.06, 0.6 + rp * 0.05]) { c.globalAlpha = 0.65 - r * 0.6; k.ell(4.0, PIERV, ZW, r, null, { stroke: "rgba(255,255,255,0.55)", lw: 1 }); }
  c.restore();
  k.cyl(4.0, PIERV, ZW, 0.19, 0.4, "#d8c8a4", { top: false });
  c.strokeStyle = "rgba(100,80,50,0.35)"; c.lineWidth = 0.6;
  for (let z = ZW + 0.08; z < 0.1; z += 0.08) { k.ell(4.0, PIERV, z, 0.185, null, { stroke: "rgba(100,80,50,0.3)", lw: 0.6 }); }
}
function arm(k, side) {
  const c = k.ctx, tipU = side < 0 ? 3.45 : 4.55;
  const eU = side < 0 ? BU0 : BU1, pts = [[eU, PIERV, 0.2], [lerp(eU, tipU, 0.5), PIERV, 0.3], [tipU, PIERV, 0.4]];
  k.line3(pts, { lw: 6.4, wobble: 0, stroke: INK }); k.line3(pts, { lw: 4.4, wobble: 0, stroke: "#cfd2d6" }); k.line3(pts, { lw: 1.4, wobble: 0, stroke: "rgba(255,255,255,0.85)" });
  const [x, y] = P(tipU, PIERV, 0.4); c.fillStyle = "#e1e3e6"; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.arc(x, y, 2.6, 0, 7); c.fill(); c.stroke();
}
function bridgeEnds(k) {
  for (const v of [RV0 + 0.04, RV1 - 0.14]) for (const u of [BU0 - 0.12, BU1 + 0.02]) {
    bx(k, u, u + 0.1, v, v + 0.1, 0, 0.5, "#d8d0bd", { lw: 0.8 });
    bx(k, u - 0.02, u + 0.12, v - 0.02, v + 0.12, 0.5, 0.56, ST_L, { lw: 0.7 });
    const [x, y] = P(u + 0.05, v + 0.05, 0.62); const c = k.ctx; c.fillStyle = "#e9e2d0"; c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.arc(x, y, 2.6, 0, 7); c.fill(); c.stroke();
  }
}

function lampPost(k, u, v, h = 1.7) { k.lamp(u, v, { col: "#26292c", h }); }

export default function draw(k, t) {
  const c = k.ctx;
  ground(k, t);

  // ---------- river traffic: two boats loop along the Thames, under the bridge ----------
  const LOOP = [[1.3, 8.85], [8.3, 8.85], [8.95, 8.3], [8.3, 7.75], [1.3, 7.75], [0.75, 8.3]];
  for (const [off, hull, roof] of [[0.0, "#2f4a62", "#c8362f"], [0.5, "#7a3b34", "#2f4a62"]]) {
    const b = drive(LOOP, t, { loop: true, speed: 0.5, offset: off });
    k.q(b.u > 3.0 && b.u < 5.0 ? 3.0 + b.v : b.u + b.v + 0.5, () => { rwake(k, b.u, b.v, b.ang, 0.7, 0.4); rboat(k, b.u, b.v, b.ang, { L: 1.05, W: 0.38, hull, cabin: "#f4eddc", roof, windows: 4 }); });
  }

  // ---------- the cathedral ----------
  CATH.draw(k, t, 5);

  // ---------- bridge: pier first, then deck / rails per segment so people sort between the sides ----------
  k.q(3.0 + PIERV, () => pierDraw(k, t));
  for (let i = 0; i < NSEG; i++) {
    const v0 = RV0 + i * SEGV, v1 = v0 + SEGV;
    k.q(3.55 + v0, () => deckSeg(k, v0, v1, i === NSEG - 1));
    k.q(3.72 + v0, () => { sideRig(k, -1, v0, v1); if (PIERV >= v0 && PIERV < v1) arm(k, -1); });
    k.q(4.35 + v1, () => { sideRig(k, 1, v0, v1); if (PIERV >= v0 && PIERV < v1) arm(k, 1); });
  }
  k.q(3.5 + RV0, () => bridgeEnds(k));

  // ---------- trees, beds, lamps, benches ----------
  const TREES = [[0.9, 6.0, 0.7, 1.7, 71], [1.0, 4.3, 0.6, 1.5, 72], [8.3, 5.6, 0.8, 1.9, 73], [6.95, 6.1, 0.55, 1.35, 74], [8.8, 3.9, 0.7, 1.6, 75], [8.7, 1.7, 0.75, 1.8, 76]];
  const greens = ["#9bb84e", "#a1bb4b", "#8eb351", "#93b457", "#8fb455", "#a7bf4c", "#97b64f"];
  TREES.forEach(([u, v, r, h, seed], i) => k.q(u + v, () => k.tree(u, v, { r, h, seed, col: greens[i] })));
  const lav = ["#a58acb", "#8f74b8", "#c1a8e0", "#7c63aa"], yel = ["#f4c630", "#a58acb", "#f6d44a"];
  k.q(8.6, () => k.flowerCurve([[0.7, 5.2], [0.8, 5.9], [0.7, 6.4]], 0.3, { seed: 78, cols: lav }));
  k.q(12.0, () => k.flowerCurve([[1.5, 6.5], [1.9, 6.45]], 0.3, { seed: 79, cols: yel }));
  k.q(13.6, () => k.flowerCurve([[6.6, 6.35], [7.3, 6.5]], 0.3, { seed: 80, cols: lav }));
  k.q(13.0, () => k.flowerCurve([[9.1, 4.4], [9.35, 5.2], [9.2, 6.0]], 0.35, { seed: 81, cols: yel }));
  const LAMPS = [[2.6, 7.0], [5.35, 7.0], [1.95, 5.9], [6.05, 4.2], [6.1, 6.7], [9.2, 6.6]];
  for (const [u, v] of LAMPS) k.q(u + v + 0.2, () => lampPost(k, u, v, 1.8));
  k.q(7.3, () => k.bench(1.35, 5.0, { along: "v" }));
  k.q(14.4, () => k.bench(7.6, 6.35, { along: "u" }));

  // ---------- life ----------
  const KEEP = [...TREES.map(([u, v, r]) => [u, v, r * 0.85]), ...LAMPS.map(([u, v]) => [u, v, 0.28]), [1.5, 5.3, 0.55], [8.0, 6.5, 0.6]];
  const R = {
    lA: keepOut(dense([[2.0, 3.9], [2.0, 5.4], [2.05, 6.6]], 0.1), KEEP),
    lB: keepOut(dense([[0.7, 6.95], [1.6, 6.9], [2.9, 6.95]], 0.1), KEEP),
    fL: keepOut(dense([[0.9, 7.0], [3.3, 7.0]], 0.1), KEEP),
    fR: keepOut(dense([[4.75, 7.0], [9.3, 7.0]], 0.1), KEEP),
    rA: keepOut(dense([[6.0, 3.9], [6.0, 5.3], [6.0, 6.7]], 0.1), KEEP),
    rB: keepOut(dense([[6.5, 6.95], [7.9, 6.9], [9.2, 6.95]], 0.1), KEEP),
    rC: keepOut(dense([[6.1, 4.1], [7.3, 4.0], [8.5, 4.5]], 0.1), KEEP),
    rD: keepOut(dense([[7.5, 3.5], [8.6, 3.4], [9.3, 2.6]], 0.1), KEEP),
  };
  const walk = (r, off, seed, sp, ex) => k.qwalker(R[r], { speed: sp ?? 0.4 + (seed % 5) * 0.03, offset: off, seed, dwell: 1.2 + (seed % 3) * 0.6, ...(ex || {}) });
  [["lA", 0.0, 81], ["lA", 0.55, 82], ["lB", 0.2, 83], ["fL", 0.1, 84], ["fL", 0.7, 85], ["fR", 0.2, 86], ["fR", 0.6, 87], ["rA", 0.1, 88], ["rA", 0.6, 89], ["rB", 0.3, 90], ["rC", 0.4, 91], ["rD", 0.5, 92]].forEach(([r, off, seed]) => walk(r, off, seed));
  // bridge pedestrians: both lanes, both directions, at deck height
  const LA = [[3.88, RV0 + 0.28], [3.88, RV1 - 0.25]], LB = [[4.14, RV0 + 0.28], [4.14, RV1 - 0.25]];
  [[LA, 0.0, 93], [LA, 0.45, 94], [LA, 0.8, 95], [LB, 0.2, 96], [LB, 0.62, 97], [LB, 0.92, 98]].forEach(([p, off, seed]) => k.qwalker(p, { speed: 0.5, offset: off, seed, dwell: 0.8, z: BZ }));
  // on the cathedral steps and portico platform
  k.qperson(3.22, 6.38, { pose: "stand", dir: [0.1, 1], seed: 101, z: 0.3 });
  k.qperson(4.7, 6.54, { pose: "photo", dir: [0.2, 1], seed: 102, z: 0.2 });
  k.qperson(4.05, 6.7, { pose: "stand", dir: [0.1, 1], seed: 103, z: 0.1 });
  k.qperson(3.6, 6.28, { pose: "wave", dir: [0.1, 1], seed: 104, z: 0.4, kid: true });
  // bench sitters
  k.q(7.35, () => { k.person(1.38, 5.2, { pose: "sit", bench: true, seatZ: 0.28, dir: [1, 0.15], seed: 105 }); k.person(1.4, 5.55, { pose: "sit", bench: true, seatZ: 0.28, dir: [1, 0.15], seed: 106 }); });
  k.q(14.5, () => { k.person(7.85, 6.5, { pose: "sit", bench: true, seatZ: 0.28, dir: [0.15, 1], seed: 107 }); k.person(8.2, 6.5, { pose: "sit", bench: true, seatZ: 0.28, dir: [0.15, 1], seed: 108 }); });
  k.qperson(5.6, 6.95, { pose: "photo", dir: [-0.3, 1], seed: 109 });
  for (let i = 0; i < 3; i++) k.q(11 + i, () => pigeon(k, 5.3 + i * 0.35 + Math.sin(t * 0.6 + i) * 0.08, 6.6 + (i % 2) * 0.2, { phase: i * 2 }));
  k.flush();

  // ---------- sky (anchored through P) ----------
  const [gx, gy] = P(5.5, 3.0, 8.5), [hx, hy] = P(2.0, 6.5, 5.5);
  k.circlingBird(gx, gy, 90, 26, { speed: 0.6, phase: 0 });
  k.circlingBird(gx, gy, 90, 26, { speed: 0.6, phase: 0.8, size: 0.8 });
  k.circlingBird(hx, hy, 50, 18, { speed: -0.5, phase: 2 });
  const [cx1, cy1] = P(0.5, 0.5, 9), [cx2, cy2] = P(9, 0.5, 8);
  k.cloud(cx1, cy1, { s: 0.9, phase: 1 });
  k.cloud(cx2, cy2, { s: 0.75, phase: 3 });
}

export const camera = { u: 4.4, v: 3.9, z: 4.0, zoom: 1.45 };
