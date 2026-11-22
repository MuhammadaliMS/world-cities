// DUBAI · -1,1 · Ain Dubai & Bluewaters Island (grid pass)
// Layout (u,v): wheel in the vertical plane v=3.2 (hub u=5, z=5.6, R 4.2), A-frame legs splayed along v, boarding
// pavilion under the rim at (5,3.2); striped-awning café block along u at v 4.3-5.5 (u 6.8-9.5), plaza v 5.5-7.05;
// timber boardwalk + sunken marina basin u 4.6-9.4, v 7.6-9.4 with a tied-arch footbridge along v at u 7.0-7.6;
// sandstone café at u 0.85-2.4, v 7.8-9.45; pergola kiosk behind-left at u 1.55-2.85, v 3.4-4.35.
import { P, INK, shade, lerp, clamp, rng } from "../../lib/vec-kit.js";
import { makeAinDubai } from "./aindubai.js";
import { look } from "./_props.js";
import { bedPoly, stoneJoints, glazing, awningF, slats, cafeSet, ropeRail, boardwalk, yacht, abra, wakeZ, balloon, bougain, opalm } from "./_t-1_1.js";
import { rect, brZ, BRU, BRV0, BRV1, loopSample } from "./_g-1_1.js";

const AD = makeAinDubai();
export const camera = { u: 5, v: 4.2, z: 4.9, zoom: 1.12, baseU: 5, baseV: 3.2, baseZ: 0.6, topZ: 10.4 };

// ---------- basin geometry ----------
const BU0 = 4.6, BU1 = 9.4, BV0 = 7.6, BV1 = 9.4; // sunken marina basin
const WZ = -0.25; // water level

// ---------- planting (axis-aligned beds, clockwise on screen) ----------
const BEDS = [
  [rect(0.4, 1.4, 1.0, 6.4), 19], [rect(1.5, 0.4, 3.7, 0.95), 20], [rect(0.4, 0.4, 1.0, 1.0), 21], [rect(6.0, 0.4, 9.3, 0.95), 22],
  [rect(2.0, 4.9, 3.0, 5.5), 23], [rect(6.2, 2.0, 7.0, 2.7), 24], [rect(9.0, 1.3, 9.5, 2.9), 25], [rect(0.4, 7.2, 1.0, 9.4), 26],
];
const BACK_PALMS = [[0.7, 3.0, 1.5], [0.7, 5.0, 1.45], [2.2, 0.62, 1.4], [3.2, 0.62, 1.45], [6.6, 0.62, 1.4], [8.0, 0.62, 1.45]];
const PALMS = [ // u, v, height, lean, size
  [0.75, 7.0, 2.3, 0.2, 1.3], [2.2, 6.8, 1.6, -0.25, 1.15], [3.6, 6.1, 1.75, 0.15, 1.15], [4.15, 9.2, 1.8, -0.15, 1.3],
  [6.3, 1.7, 2.0, 0.1, 1.3], [7.8, 3.0, 1.7, -0.2, 1.25], [9.35, 3.4, 1.45, 0.3, 1.1], [2.5, 2.3, 1.35, -0.2, 1.1],
];
const LAMPS = [[4.2, 7.2], [5.6, 7.1], [8.6, 7.1], [3.6, 9.3], [4.1, 5.9]];
const B1 = [2.85, 6.35], B2 = [7.35, 2.9];
const LC = [[3.15, 8.3, 1, "#f3ead6"], [3.15, 9.0, 2, "#f1e4c8"]];
const RC = [[7.0, 6.55, 4, false], [8.0, 6.55, 5, false], [9.0, 6.55, 6, "#f3ead6"], [5.6, 6.8, 7, "#efe3c6"]];
const BIN = [6.1, 6.9];

export default function draw(k, t) {
  const c = k.ctx;
  ground(k, t);
  AD.shadow(k);

  // ---------- back greenery ----------
  k.q(4.9, () => { for (const [u, v, r, h, col, sd] of [[2.4, 2.8, 0.36, 0.95, "#6f9f4a", 3], [3.0, 2.2, 0.4, 1.05, "#7fa850", 4], [6.9, 1.3, 0.34, 0.9, "#6a9a48", 5]]) k.tree(u, v, { r, h, seed: sd, col }); });
  k.q(7.4, () => backPavilion(k, t));
  BEDS.forEach(([pts, seed]) => { let d = 0, vm = 0; for (const [u, v] of pts) { d = Math.max(d, u + v); vm = Math.max(vm, v); } k.q(vm < 3.2 ? Math.min(d - 0.25, 5.8) : d - 0.25, () => bedPoly(k, pts, seed)); });

  // ---------- Ain Dubai ----------
  k.q(5.5, () => AD.drawBackLegs(k));
  k.q(6.0, () => AD.drawWheel(k, t));
  k.q(8.1, () => AD.drawBoarding(k, t));
  k.q(8.2, () => AD.pavilion(k, t));
  k.q(9.2, () => AD.drawFrontLeg(k, "FR"));
  k.q(9.21, () => AD.drawFrontLeg(k, "FL"));
  k.q(9.22, () => AD.drawHubCap(k, t));

  // ---------- buildings ----------
  k.q(12.4, () => rightBuilding(k, t));
  k.q(11.0, () => leftBuilding(k, t));

  // ---------- palms, lamps, benches ----------
  for (const [u, v, h] of BACK_PALMS) k.q(v < 3.2 ? Math.min(u + v, 5.8) : u + v, () => opalm(k, u, v, { h, lean: 0.1, len: 1.15, fronds: 20, wide: 1.1, seed: Math.round(u * 37 + v * 11) }));
  for (const [u, v, h, lean, sz] of PALMS) k.q(v < 3.2 ? Math.min(u + v, 5.8) : u + v + 0.15, () => opalm(k, u, v, { h, lean, len: sz, fronds: 20, wide: 1.1, seed: Math.round(u * 29 + v * 13) }));
  for (const [u, v] of LAMPS) k.q(u + v + 0.1, () => k.lamp(u, v, { col: "#26221e", h: 1.6, lit: 0.75 }));
  const [b1, b2] = [B1, B2];
  k.q(b1[0] + b1[1] + 0.3, () => { k.bench(b1[0], b1[1], { along: "u" }); k.person(b1[0] + 0.25, b1[1] + 0.15, { pose: "sit", seatZ: 0.2, dir: [0.1, 1], seed: 411, h: 0.62, ...look(411) }); k.person(b1[0] + 0.6, b1[1] + 0.15, { pose: "sit", seatZ: 0.2, dir: [0.1, 1], seed: 412, h: 0.62, gesture: true, ...look(412) }); });
  k.q(b2[0] + b2[1] + 0.3, () => { k.bench(b2[0], b2[1], { along: "u" }); k.person(b2[0] + 0.3, b2[1] + 0.15, { pose: "sit", seatZ: 0.2, dir: [0.1, 1], seed: 421, h: 0.62, ...look(421) }); });
  k.q(BIN[0] + BIN[1], () => k.cyl(BIN[0], BIN[1], 0, 0.12, 0.34, "#4b4b48"));

  // ---------- café terraces ----------
  for (const [u, v, s, col] of LC) k.q(u + v + 0.2, () => cafeSet(k, u, v, s, { col: col || "#f3ead6", parasol: !!col, sitters: s === 3 ? 1 : 2 }));
  for (const [u, v, sd, col] of RC) k.q(u + v + 0.2, () => cafeSet(k, u, v, sd, { col: col || "#f3ead6", parasol: !!col, sitters: sd === 8 ? 1 : 2, lookOff: 3 }));

  // ---------- waterfront: rope rails, bridge, boats ----------
  { // along the far boardwalk (v), leaving a gap at the bridge; along the left boardwalk (u)
    const segs = [[[4.7, 7.55], [6.9, 7.55]], [[7.7, 7.55], [9.3, 7.55]], [[4.65, 7.7], [4.65, 9.3]]];
    for (const [a, b] of segs) { const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.7)); for (let i = 0; i < n; i++) { const p = [lerp(a[0], b[0], i / n), lerp(a[1], b[1], i / n)], q = [lerp(a[0], b[0], (i + 1) / n), lerp(a[1], b[1], (i + 1) / n)]; k.q((p[0] + p[1] + q[0] + q[1]) / 2 + 0.05, () => ropeRail(k, [p, q])); } }
  }
  const BRD = 15.2;
  k.q(BRD, () => bridge(k, t));
  boats(k, t, BRD);

  // ---------- people ----------
  crowd(k, t);
  k.flush();

  // ---------- sky ----------
  k.circlingBird(300, 260, 60, 22, { speed: 0.55, phase: 0 });
  k.circlingBird(300, 260, 60, 22, { speed: 0.55, phase: 0.8, size: 0.8 });
  k.circlingBird(760, 330, 50, 18, { speed: -0.7, phase: 2 });
  k.cloud(170, 330, { s: 0.75, phase: 1 });
  k.cloud(850, 250, { s: 0.65, phase: 3 });
}

// ---------- ground ----------
function ground(k, t) {
  const c = k.ctx;
  k.slab("#e9d3a6", { side: "#e2cb9c" });
  const DIAMOND = [[0, 0], [10, 0], [10, 10], [0, 10]];
  // paving: large square slabs, a lighter ring round the pavilion, radial joints
  c.save(); k._trace(DIAMOND.map(([u, v]) => P(u, v, 0)), true, 0); c.clip();
  c.strokeStyle = "rgba(150,118,78,0.2)"; c.lineWidth = 0.8; c.beginPath();
  for (let i = 1; i < 20; i++) { const f = i * 0.5; c.moveTo(...P(f, 0)); c.lineTo(...P(f, 10)); c.moveTo(...P(0, f)); c.lineTo(...P(10, f)); }
  c.stroke();
  const PC = AD.PC;
  for (const [r0, r1, col] of [[1.9, 2.25, "rgba(255,248,232,0.75)"], [2.95, 3.1, "rgba(201,170,124,0.35)"]]) {
    c.beginPath(); for (let i = 0; i <= 72; i++) { const a = (i / 72) * 6.2832, p = P(PC[0] + Math.cos(a) * r1, PC[1] + Math.sin(a) * r1); i ? c.lineTo(...p) : c.moveTo(...p); }
    for (let i = 72; i >= 0; i--) { const a = (i / 72) * 6.2832, p = P(PC[0] + Math.cos(a) * r0, PC[1] + Math.sin(a) * r0); c.lineTo(...p); }
    c.fillStyle = col; c.fill("evenodd");
  }
  c.strokeStyle = "rgba(150,118,78,0.3)"; c.beginPath(); for (let i = 0; i < 36; i++) { const a = (i / 36) * 6.2832; c.moveTo(...P(PC[0] + Math.cos(a) * 1.9, PC[1] + Math.sin(a) * 1.9)); c.lineTo(...P(PC[0] + Math.cos(a) * 2.25, PC[1] + Math.sin(a) * 2.25)); } c.stroke();
  c.restore();
  k.stipple(DIAMOND, { density: 10 });

  // ---------- sunken basin: far walls, water clipped to the kerb outline ----------
  const out = [[BU0, BV0], [BU1, BV0], [BU1, BV1], [BU0, BV1]];
  c.save(); k._trace(out.map(([u, v]) => P(u, v, 0)), true, 0); c.clip();
  k.poly([[BU0, BV0, 0], [BU1, BV0, 0], [BU1, BV0, WZ], [BU0, BV0, WZ]], "#cdb894", { lw: 1.2 }); // far wall (faces +v)
  k.poly([[BU0, BV0, 0], [BU0, BV1, 0], [BU0, BV1, WZ], [BU0, BV0, WZ]], shade("#cdb894", -0.12), { lw: 1.2 }); // left wall (faces +u)
  const wp = out.map(([u, v]) => P(u, v, WZ));
  k.poly(out.map(([u, v]) => [u, v, WZ]), "#45c2c2", { lw: 1.3 });
  const gw = c.createLinearGradient(...P(BU0, BV0, WZ), ...P(BU1, BV1, WZ)); gw.addColorStop(0, "#6fd6cc"); gw.addColorStop(0.5, "#3fbcbf"); gw.addColorStop(1, "#2a9fae"); c.beginPath(); wp.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.fillStyle = gw; c.fill();
  // soft shade under the far walls
  const sh = c.createLinearGradient(...P(BU0, BV0, WZ), ...P(BU0 + 0.5, BV0 + 0.5, WZ)); sh.addColorStop(0, "rgba(0,50,70,0.28)"); sh.addColorStop(1, "rgba(0,50,70,0)"); c.fillStyle = sh; c.fill();
  c.strokeStyle = "rgba(255,255,255,0.22)"; c.lineWidth = 1;
  const R = rng(17);
  for (let i = 0; i < 60; i++) {
    const u0 = lerp(BU0, BU1 - 0.5, R()), v0 = lerp(BV0, BV1, R()), ph = R() * 6.28, sp = 0.5 + R() * 0.6;
    const dr = ((t * 0.07 * sp + R()) % 1) * 0.4, [x, y] = P(Math.min(u0 + dr, BU1), v0, WZ), a = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.2 * sp + ph));
    c.globalAlpha = a; c.beginPath(); c.moveTo(x - 7, y); c.quadraticCurveTo(x - 3.5, y - 2.4, x, y); c.quadraticCurveTo(x + 3.5, y + 2.4, x + 7, y); c.stroke();
  }
  c.globalAlpha = 1;
  for (let i = 0; i < 40; i++) { const [x, y] = P(lerp(BU0 + 0.2, BU1, R()), lerp(BV0 + 0.2, BV1, R()), WZ), a = Math.max(0, Math.sin(t * 2.3 + R() * 6.28)); if (a > 0.65) { c.fillStyle = `rgba(255,255,255,${(a - 0.65) * 2.2})`; c.fillRect(x - 2, y - 0.6, 4, 1.2); c.fillRect(x - 0.6, y - 2, 1.2, 4); } }
  // lapping foam line along the foot of the two far walls
  c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 1.6; c.setLineDash([5, 4]); c.lineDashOffset = -t * 6;
  c.beginPath(); for (let i = 0; i <= 24; i++) { const u = lerp(BU0, BU1, i / 24), p = P(u, BV0 + 0.06 + Math.sin(t * 1.6 + i) * 0.02, WZ); i ? c.lineTo(...p) : c.moveTo(...p); } c.stroke();
  c.beginPath(); for (let i = 0; i <= 14; i++) { const v = lerp(BV0, BV1, i / 14), p = P(BU0 + 0.06 + Math.sin(t * 1.6 + i) * 0.02, v, WZ); i ? c.lineTo(...p) : c.moveTo(...p); } c.stroke(); c.setLineDash([]);
  c.restore();
  // stone kerb round the basin
  k.poly(out.map(([u, v]) => [u, v, 0]), null, { lw: 2 });
  // timber boardwalk: far strip (along u) and left strip (along v)
  boardwalk(k, [BU0 - 0.55, BV0], [BU1, BV0], [0, 1], 0.55);
  boardwalk(k, [BU0, BV0], [BU0, BV1], [1, 0], 0.55);
}

// ---------- the small kiosk behind-left (pergola roof) ----------
function backPavilion(k, t) {
  const u = 1.55, v = 3.4, du = 1.3, dv = 0.95;
  k.box(u, v, 0, du, dv, 0.95, "#e8d7b6", { hatch: false });
  glazing(k, (s, z) => P(u + s, v + dv, z), 0.1, 1.2, 0.1, 0.75, 2, { mull: 2 });
  slats(k, (s, z) => P(u + s, v + dv - 0.1, z), 0, du, 1.25, [0, -1], 0.85, 8);
}

// ---------- left café building (axis aligned) ----------
function leftBuilding(k, t) {
  const u0 = 0.85, v0 = 7.8, du = 1.55, dv = 1.65, H = 2.35, c = k.ctx, SAND = "#e6d1aa";
  k.box(u0, v0, 0, du, dv, H, SAND, { hatch: false });
  const FLf = (s, z) => P(u0 + s, v0 + dv, z), FRf = (s, z) => P(u0 + du, v0 + s, z);
  stoneJoints(k, FLf, du, 0, H); stoneJoints(k, FRf, dv, 0, H, { col: "rgba(100,72,40,0.3)" });
  glazing(k, FLf, 0.15, du - 0.15, 0.12, 1.55, 2, { mull: 3, transom: true });
  glazing(k, FRf, 0.15, dv - 0.15, 0.12, 1.15, 3, { mull: 2, transom: true, dark: true });
  glazing(k, FRf, 0.15, dv - 0.15, 1.38, 2.0, 3, { mull: 2 });
  k.box(u0 - 0.04, v0 - 0.04, H, du + 0.08, dv + 0.08, 0.1, "#efe1c2", { hatch: false, shadow: false });
  k.box(u0 + 0.15, v0 + 0.12, H + 0.1, 0.7, 0.55, 0.3, "#d9d4c8", { hatch: false, shadow: false });
  c.strokeStyle = "rgba(60,60,60,0.5)"; c.lineWidth = 0.7; c.beginPath(); for (let i = 1; i < 7; i++) { const s = i / 7 * 0.7; c.moveTo(...P(u0 + 0.15 + s, v0 + 0.67, H + 0.14)); c.lineTo(...P(u0 + 0.15 + s, v0 + 0.67, H + 0.36)); } c.stroke();
  slats(k, (s, z) => P(u0 + 0.2 + s, v0 + dv - 0.15, z), 0, du - 0.35, H + 0.55, [0, -1], 0.8, 9);
  const [sx, sy] = FRf(dv * 0.5, 1.27);
  c.save(); c.fillStyle = "#3a3026"; c.font = "bold 5.6px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
  c.translate(sx, sy); c.transform(1, -0.577, 0, 1, 0, 0); c.fillText("BLUEWATERS CAFÉ", 0, 0); c.restore();
  const [cx1, cy1] = P(u0 + du, v0 + dv, 0), [cx2, cy2] = P(u0 + 0.1, v0 + dv, 0);
  bougain(k, cx1 + 1, cy1 - 8, 16, 62, 31); bougain(k, cx2 + 5, cy2 - 4, 14, 40, 32);
  const [cx3, cy3] = P(u0 + du, v0 + 0.05, 0); bougain(k, cx3, cy3 - 6, 12, 50, 33);
}

// ---------- right building: three sandstone blocks along u behind a striped-awning café ----------
const RBV = 4.3, RBD = 1.2, RBF = RBV + RBD; // footprint v 4.3-5.5, main facade = left face at v 5.5
function rightBuilding(k, t) {
  const c = k.ctx, SAND = "#e8d4ae", TOPC = "#f0e2c4";
  const FA = (s, z) => P(6.8 + s, RBF, z), FB = (s, z) => P(7.7 + s, RBF, z), FC = (s, z) => P(8.7 + s, RBF, z), EC = (s, z) => P(9.5, RBV + s, z);
  // A (left, café), B (tall middle), C (right, seafood) drawn back-to-front
  k.box(6.8, RBV, 0, 0.9, RBD, 1.95, "#e9d6b0", { hatch: false });
  stoneJoints(k, FA, 0.9, 0, 1.95); glazing(k, FA, 0.08, 0.82, 0.12, 1.12, 2, { mull: 2, transom: true }); glazing(k, FA, 0.12, 0.78, 1.38, 1.75, 2, { mull: 1 });
  k.box(6.76, RBV - 0.04, 1.95, 0.98, RBD + 0.08, 0.1, TOPC, { hatch: false, shadow: false });
  slats(k, (s, z) => P(6.9 + s, RBF - 0.1, z), 0, 0.7, 2.55, [0, -1], 0.9, 7);
  k.box(7.7, RBV, 0, 1.0, RBD, 2.5, SAND, { hatch: false });
  stoneJoints(k, FB, 1.0, 0, 2.5); glazing(k, FB, 0.08, 0.92, 0.12, 1.12, 2, { mull: 2, transom: true });
  glazing(k, FB, 0.12, 0.88, 1.42, 2.3, 1, { mull: 1, warm: true });
  for (let i = 0; i <= 8; i++) { const s = 0.12 + i * (0.76 / 8), p0 = FB(s, 1.42), p1 = FB(s, 2.3); c.strokeStyle = INK; c.lineWidth = 3.2; c.beginPath(); c.moveTo(...p0); c.lineTo(...p1); c.stroke(); c.strokeStyle = "#8a5a33"; c.lineWidth = 1.8; c.stroke(); }
  k.box(7.66, RBV - 0.04, 2.5, 1.08, RBD + 0.08, 0.1, TOPC, { hatch: false, shadow: false });
  k.box(7.95, RBV + 0.2, 2.6, 0.7, 0.55, 0.3, "#dcd8cf", { hatch: false, shadow: false });
  c.strokeStyle = "rgba(60,60,60,0.45)"; c.lineWidth = 0.7; c.beginPath(); for (let i = 1; i < 8; i++) { const s = (i / 8) * 0.7; c.moveTo(...P(7.95 + s, RBV + 0.75, 2.63)); c.lineTo(...P(7.95 + s, RBV + 0.75, 2.87)); } c.stroke();
  k.box(8.7, RBV, 0, 0.8, RBD, 1.85, "#ead8b4", { hatch: false });
  stoneJoints(k, FC, 0.8, 0, 1.85); glazing(k, FC, 0.1, 0.7, 0.12, 0.95, 2, { mull: 2 }); glazing(k, FC, 0.1, 0.7, 1.12, 1.62, 2, { mull: 1 });
  glazing(k, EC, 0.15, 1.05, 0.12, 1.12, 2, { mull: 2, dark: true }); stoneJoints(k, EC, 1.2, 1.15, 1.85, { col: "rgba(120,90,55,0.2)" });
  k.box(8.66, RBV - 0.04, 1.85, 0.88, RBD + 0.08, 0.1, TOPC, { hatch: false, shadow: false });
  // striped awnings over the two shopfronts, shop sign on C
  awningF(k, FA, 0.05, 0.85, 1.32, [0, 1], { stripes: 8, depth: 0.45, drop: 0.3 });
  awningF(k, FB, 0.05, 0.95, 1.36, [0, 1], { stripes: 9, depth: 0.45, drop: 0.3 });
  { const [sx, sy] = FC(0.4, 1.38); c.save(); c.fillStyle = "#3a3026"; c.font = "bold 6px sans-serif"; c.textAlign = "center"; c.translate(sx, sy); c.transform(1, 0.577, 0, 1, 0, 0); c.fillText("SEAFOOD", 0, 0); c.restore(); }
  const [bx, by] = P(9.5, RBF, 0); bougain(k, bx - 3, by - 6, 14, 56, 41);
  const [bx2, by2] = P(6.8, RBF, 0); bougain(k, bx2 + 4, by2 - 4, 12, 40, 42);
}

// ---------- footbridge across the basin: tied steel arch, glass balustrade, people crossing ----------
function bridge(k, t) {
  const c = k.ctx, u0 = BRU[0], u1 = BRU[1], N = 24;
  const vs = Array.from({ length: N + 1 }, (_, i) => lerp(BRV0, BRV1, i / N));
  const fas = [...vs.map((v) => P(u1, v, brZ(v))), ...[...vs].reverse().map((v) => P(u1, v, brZ(v) - 0.16))];
  k.path(fas, { fill: "#e9e6df", lw: 1.3, wobble: 0 });
  k.path([...vs.map((v) => P(u0, v, brZ(v))), ...[...vs].reverse().map((v) => P(u1, v, brZ(v)))], { fill: "#cfc6b6", lw: 1.3, wobble: 0 });
  c.strokeStyle = "rgba(110,90,60,0.4)"; c.lineWidth = 0.7; c.beginPath(); for (const v of vs) { c.moveTo(...P(u0, v, brZ(v))); c.lineTo(...P(u1, v, brZ(v))); } c.stroke();
  k.path([P(u0, BRV1, brZ(BRV1)), P(u1, BRV1, brZ(BRV1)), P(u1, BRV1, brZ(BRV1) - 0.16), P(u0, BRV1, brZ(BRV1) - 0.16)], { fill: "#bdb3a2", lw: 1.1, wobble: 0 });
  balustrade(c, u0, vs);
  const route = [[7.3, BRV0 + 0.05], [7.3, 8.4], [7.3, BRV1 - 0.1]];
  for (const [off, sd, sp] of [[0.0, 501, 0.33], [0.45, 502, 0.3], [0.8, 503, 0.36]]) {
    const st = k.walkerState(route, { speed: sp, offset: off, dwell: 2.6 });
    const lane = sd === 502 ? 0.12 : -0.1;
    k.walker(route.map(([u, v]) => [u + lane, v]), { speed: sp, offset: off, dwell: 2.6, seed: sd, z: brZ(st.v), h: 0.62, idle: sd === 501 ? "photo" : "stand", ...look(sd) });
  }
  balustrade(c, u1, vs);
  const ar = (f) => { const v = lerp(BRV0, BRV1, f); return [v, brZ(v) + 0.15 + 0.85 * Math.sin(Math.PI * f)]; };
  const arc = []; for (let i = 0; i <= 30; i++) { const [v, z] = ar(i / 30); arc.push(P(u1 + 0.02, v, z)); }
  c.strokeStyle = "rgba(42,36,32,0.75)"; c.lineWidth = 0.8; c.beginPath();
  for (let i = 1; i < 30; i += 2) { const [v, z] = ar(i / 30); c.moveTo(...P(u1 + 0.02, v, z)); c.lineTo(...P(u1 + 0.02, v, brZ(v) + 0.3)); }
  c.stroke();
  c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); arc.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.stroke();
  c.strokeStyle = "#f6f3ee"; c.lineWidth = 3; c.stroke();
}
function balustrade(c, u, vs) {
  const top = vs.map((v) => P(u, v, brZ(v) + 0.32)), bot = vs.map((v) => P(u, v, brZ(v)));
  c.beginPath(); top.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); for (let i = bot.length - 1; i >= 0; i--) c.lineTo(...bot[i]); c.closePath();
  c.fillStyle = "rgba(170,215,228,0.35)"; c.fill();
  c.strokeStyle = "rgba(42,36,32,0.55)"; c.lineWidth = 0.8; c.beginPath(); for (let i = 0; i < vs.length; i += 2) { c.moveTo(...bot[i]); c.lineTo(...top[i]); } c.stroke();
  c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); top.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.stroke();
  c.strokeStyle = "#e9e6df"; c.lineWidth = 0.9; c.stroke();
}

// ---------- boats: each circles its own half of the basin (nothing crosses the tile edge) ----------
function boats(k, t, BRD) {
  const run = (cx, cy, a, b, period, ph, drawFn) => {
    const s = loopSample(cx, cy, a, b, period, t, ph), dir = [s.du, s.dv];
    k.q(s.u < BRU[0] ? BRD - 0.01 : Math.max(BRD + 0.01, s.u + s.v), () => { const c = k.ctx; wakeZ(k, s.u, s.v, dir, WZ, { len: 1.5 }); drawFn(s.u, s.v, dir); });
  };
  run(5.85, 8.5, 0.62, 0.45, 26, 0, (u, v, dir) => yacht(k, u, v, dir, { z: WZ, ph: 1 }));
  run(8.5, 8.5, 0.55, 0.4, 22, 0.4, (u, v, dir) => abra(k, u, v, dir, { z: WZ, ph: 2 }));
}

// ---------- crowd ----------
const ROUTES = {
  board: [[4.95, 7.3], [5.9, 7.3], [6.6, 7.3]],
  boardR: [[7.9, 7.3], [8.3, 7.3]],
  leftProm: [[4.3, 7.8], [4.3, 9.1]],
  prom: [[4.45, 6.3], [5.4, 6.3], [6.3, 6.3]],
  lane: [[6.5, 5.85], [8.0, 5.85], [9.3, 5.85]],
  left: [[1.45, 5.6], [1.5, 6.7]],
  forecourt: [[3.4, 6.9], [3.9, 6.5], [4.1, 6.2]],
  backTop: [[1.6, 1.5], [3.0, 1.45], [3.9, 1.5]],
  backTopR: [[6.4, 1.5], [7.6, 1.55], [8.6, 1.5]],
  backLeft: [[1.2, 1.9], [1.2, 3.3], [1.2, 5.3]],
  backRight: [[7.4, 2.6], [8.2, 2.55], [8.85, 2.5]],
  mid: [[3.4, 4.9], [3.55, 5.7]],
  entry: [[6.45, 4.8], [6.45, 5.5]],
  upperLeft: [[2.8, 2.9], [3.2, 2.0]],
};
function crowd(k, t) {
  const R = ROUTES;
  const specs = [
    ["board", 0.0, 601], ["board", 0.5, 602], ["boardR", 0.3, 603], ["leftProm", 0.1, 604], ["leftProm", 0.6, 605],
    ["prom", 0.2, 606], ["prom", 0.7, 607], ["lane", 0.1, 608], ["lane", 0.6, 609], ["left", 0.3, 610], ["forecourt", 0.1, 611],
    ["forecourt", 0.6, 612], ["backTop", 0.2, 618], ["backTop", 0.7, 619], ["backTopR", 0.4, 613], ["backLeft", 0.5, 620],
    ["backRight", 0.2, 614], ["backRight", 0.7, 615], ["mid", 0.5, 617], ["entry", 0.3, 622], ["upperLeft", 0.4, 623],
  ];
  for (const [r, off, seed] of specs) k.qwalker(R[r], { speed: 0.34 + (seed % 5) * 0.03, offset: off, seed, dwell: 1.4 + (seed % 3) * 0.7, h: 0.62, ...look(seed) });
  // boarding queue at the pavilion door (door faces +u, queue runs along u toward the right)
  const ea = AD.EA, eu = AD.PC[0] + Math.cos(ea) * 1.42, ev = AD.PC[1] + Math.sin(ea) * 1.42, nu = Math.cos(ea), nv = Math.sin(ea);
  [0.7, 1.0, 1.3, 1.6, 1.9].forEach((d, i) => {
    const shuffle = Math.max(0, Math.sin(t * 0.6 + i * 1.1)) * 0.05;
    const u = eu + nu * (d - shuffle) + (i % 2 ? 0.05 : -0.04), v = ev + nv * (d - shuffle) + (i % 2 ? 0.08 : -0.06);
    k.qperson(u, v, { pose: i === 2 ? "photo" : "stand", dir: [-nu, -nv], seed: 700 + i, h: i === 3 ? 0.42 : 0.62, kid: i === 3, ...look(700 + i) });
  });
  { const pts = [0.65, 1.3, 1.95, 2.4].map((d) => [eu + nu * d + nv * 0.3, ev + nv * d - nu * 0.3]);
    for (let i = 0; i < pts.length; i++) k.q(pts[i][0] + pts[i][1], () => {
      const c = k.ctx, [u, v] = pts[i];
      if (i < pts.length - 1) { const a = P(u, v, 0.36), b = P(pts[i + 1][0], pts[i + 1][1], 0.36); c.strokeStyle = "#b8292f"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(...a); c.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 4, ...b); c.stroke(); }
      const [x, y] = P(u, v, 0), [, yt] = P(u, v, 0.4); c.strokeStyle = INK; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt); c.stroke(); c.strokeStyle = "#c9a447"; c.lineWidth = 1.2; c.stroke(); c.fillStyle = "#c9a447"; c.beginPath(); c.arc(x, yt, 1.8, 0, 6.3); c.fill();
    }); }
  // family with red balloons on the plaza
  const fam = [[5.75, 6.55, 711, false, [0.2, 1]], [6.1, 6.4, 712, false, [0.2, 1]], [5.95, 6.8, 713, true, [0.6, 0.8]], [6.3, 6.7, 714, true, [-0.2, 1]]];
  for (const [u, v, sd, kid, dir] of fam) k.q(u + v, () => {
    const p = k.person(u, v, { pose: kid && sd === 714 ? "wave" : "stand", dir, seed: sd, kid, h: kid ? 0.42 : 0.64, ...look(sd) });
    if (kid) balloon(k, p.hand, "#d83a33", t, sd, p.headY);
  });
  // second family at the boardwalk rail + a photographer and a stroller
  [[8.5, 7.25, 721, false], [8.8, 7.15, 722, false], [8.65, 7.0, 723, true], [9.05, 7.2, 724, true]].forEach(([u, v, sd, kid]) => k.qperson(u, v, { pose: sd === 724 ? "cheer" : "stand", dir: [0.3, 1], seed: sd, kid, h: kid ? 0.42 : 0.64, ...look(sd) }));
  k.qperson(5.3, 7.3, { pose: "photo", dir: [0.1, 1], seed: 731, h: 0.62, ...look(731) });
  k.qperson(4.3, 8.2, { pose: "stand", dir: [1, 0.2], seed: 732, h: 0.62, ...look(732) });
  // people at the right end + under the wheel looking up
  k.qperson(8.9, 3.0, { pose: "stand", dir: [0.5, 1], seed: 741, h: 0.62, ...look(741) });
  k.qperson(9.1, 3.2, { pose: "stand", dir: [0.3, 1], seed: 742, h: 0.62, ...look(742) });
  k.qperson(3.5, 5.4, { pose: "photo", dir: [0.9, -0.5], seed: 743, h: 0.62, ...look(743) });
  k.qperson(3.75, 5.55, { pose: "wave", dir: [0.9, -0.5], seed: 744, h: 0.62, ...look(744) });
}
// obstacles for route checks: circles [u,v,r] + polygons (u,v)
export const OBST = {
  circles: [
    ...Object.values(AD.LEGS).map((L) => [L.f[0], L.f[1], 0.62]), [AD.PC[0], AD.PC[1], 1.62],
    ...LAMPS.map(([u, v]) => [u, v, 0.18]), ...PALMS.map(([u, v]) => [u, v, 0.22]), ...BACK_PALMS.map(([u, v]) => [u, v, 0.22]),
    ...LC.map(([u, v]) => [u, v, 0.48]), ...RC.map(([u, v]) => [u, v, 0.48]),
    [B1[0] + 0.42, B1[1] + 0.12, 0.42], [B2[0] + 0.42, B2[1] + 0.12, 0.42], [BIN[0], BIN[1], 0.14],
  ],
  polys: [...BEDS.map(([p]) => p), rect(0.85, 7.8, 2.4, 9.45), rect(6.8, RBV, 9.5, RBF), rect(1.55, 3.4, 2.85, 4.35)],
  water: (u, v) => u > BU0 - 0.02 && v > BV0 - 0.02,
};
export { ROUTES, BEDS };
