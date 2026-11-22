// LONDON · centre tile · Big Ben & Westminster (grid pass: everything on the isometric grid)
// Layout (u,v), all ground inside 0.3..9.7:
//   palace range u 1.9-8.2, v 0.7-2.5 with Victoria Tower (u 0.4-1.9) and Elizabeth Tower (u 8.2-9.4)   [westminster.js]
//   stone forecourt v 0.3-3.5 (iron railing + gate piers at v 3.45), sand walk v 3.5-4.2
//   two lawns v 4.2-6.55 (u 0.9-4.25 and 5.75-9.1) split by the gate path u 4.35-5.65; statue on the right lawn
//   front sand walk v 6.55-7.25, stone pavement v 7.25-7.8 (phone box, pillar box, bus stop), road v 7.8-9.55
// Life: Routemaster + black cab loop the road (U-turns inside the tile, both wait at the bus stop), clock hands
// sweep with a flock lifting off the belfry, walkers on the sand walks, picnickers, bench sitters, tourists, pigeons.
import { P, INK, shade, lerp, clamp, rng, spline } from "../../lib/vec-kit.js";
import { makeWestminster } from "./westminster.js";
import { bus, cab, phoneBox, pillarBox, pigeon } from "./_props.js";
import { bx, railU, railV, pier } from "./_g0_0.js";

const WEST = makeWestminster();
const IRONLAMP = "#23282b";
const SAND = "#e6d3a2", STONE = "#d9cdb3", LAWNC = "#a5bc5c";

// rounded-rectangle lawn polygon (u,v)
function lawn(u0, u1, v0, v1, r = 0.4) {
  const pts = [], n = 5;
  for (const [cu, cv, a0] of [[u1 - r, v0 + r, -90], [u1 - r, v1 - r, 0], [u0 + r, v1 - r, 90], [u0 + r, v0 + r, 180]])
    for (let i = 0; i <= n; i++) { const a = ((a0 + (i / n) * 90) * Math.PI) / 180; pts.push([cu + Math.cos(a) * r, cv + Math.sin(a) * r]); }
  return pts;
}
const LAWNS = [lawn(0.9, 4.25, 4.2, 6.55), lawn(5.75, 9.1, 4.2, 6.55)];

// ---------- road loop (both vehicles), U-turns inside the tile ----------
const LOOP = (() => {
  const pts = [], r = 0.375, va = 8.3, vb = 9.05, vm = (va + vb) / 2, ul = 2.0, ur = 8.0;
  pts.push([ul, va], [(ul + ur) / 2, va]);
  for (let i = 0; i <= 8; i++) { const th = -Math.PI / 2 + (i / 8) * Math.PI; pts.push([ur + Math.cos(th) * r, vm + Math.sin(th) * r]); }
  pts.push([(ul + ur) / 2, vb]);
  for (let i = 0; i <= 8; i++) { const th = Math.PI / 2 + (i / 8) * Math.PI; pts.push([ul + Math.cos(th) * r, vm + Math.sin(th) * r]); }
  return spline(pts.filter((p, i, a) => i === 0 || Math.hypot(p[0] - a[i - 1][0], p[1] - a[i - 1][1]) > 0.02), true);
})();
const STOP_S = (() => { let best = 0, bd = 1e9; for (let s = 0; s < LOOP.L; s += 0.02) { const p = LOOP.sample(s), d = Math.hypot(p.u - 6.0, p.v - 8.3); if (d < bd) { bd = d; best = s; } } return best; })();
const LAP_DRIVE = LOOP.L / 0.8, DWELL = 2.6, LAP = LAP_DRIVE + DWELL;
function loopDist(t) {
  const lap = Math.floor(t / LAP), e = t - lap * LAP, v = LOOP.L / LAP_DRIVE, tStop = STOP_S / v;
  let d; if (e < tStop) d = e * v; else if (e < tStop + DWELL) d = STOP_S; else d = STOP_S + (e - tStop - DWELL) * v;
  return lap * LOOP.L + d;
}
function vehicleAt(t, lag) {
  const d = loopDist(t) - lag, s = ((d % LOOP.L) + LOOP.L) % LOOP.L, p = LOOP.sample(s), q = LOOP.sample((s + 0.05) % LOOP.L);
  return { u: p.u, v: p.v, ang: Math.atan2(q.v - p.v, q.u - p.u) };
}

// ---------- walking routes (all on the sand walks / gate path) ----------
const RING = (() => {
  const pts = [], U0 = 0.62, U1 = 9.38, V0 = 3.85, V1 = 6.9;
  for (let u = U0 + 0.4; u <= U1 - 0.4 + 0.01; u += 0.8) pts.push([u, V0]);
  pts.push([U1 - 0.1, V0 + 0.1], [U1, V0 + 0.4]);
  for (let v = V0 + 1.0; v <= V1 - 0.9; v += 1.0) pts.push([U1, v]);
  pts.push([U1, V1 - 0.4], [U1 - 0.1, V1 - 0.1]);
  for (let u = U1 - 0.4; u >= U0 + 0.4 - 0.01; u -= 0.8) pts.push([u, V1]);
  pts.push([U0 + 0.1, V1 - 0.1], [U0, V1 - 0.4]);
  for (let v = V1 - 1.0; v >= V0 + 0.9; v -= 1.0) pts.push([U0, v]);
  pts.push([U0, V0 + 0.4], [U0 + 0.1, V0 + 0.1]);
  return pts;
})();
const CROSS_A = [[4.72, 3.95], [4.72, 5.5], [4.72, 6.85]];
const CROSS_B = [[5.3, 6.85], [5.3, 5.2], [5.3, 3.95]];
const COURT_A = [[1.0, 3.02], [2.2, 3.05], [3.4, 3.02]];
const COURT_B = [[9.1, 3.0], [8.3, 3.05], [7.6, 3.02]];

// ---------- props ----------
function statue(k, u, v, t) {
  const c = k.ctx;
  bx(k, u - 0.5, u + 0.5, v - 0.5, v + 0.5, 0, 0.16, "#d6ccb8", { lw: 0.9 });
  bx(k, u - 0.4, u + 0.4, v - 0.4, v + 0.4, 0.16, 1.0, "#d2c8b3", { lw: 0.9 });
  for (let i = 0; i < 3; i++) k.line3([[u - 0.22, v + 0.4, 0.8 - i * 0.12], [u + 0.22, v + 0.4, 0.8 - i * 0.12]], { lw: 1, wobble: 0, stroke: "rgba(70,60,45,0.6)" });
  bx(k, u - 0.46, u + 0.46, v - 0.46, v + 0.46, 1.0, 1.1, "#e0d7c4", { lw: 0.8 });
  const [x, y] = P(u, v, 1.1), B = "#4d4c43", BL = "#77766a", BD = "#34332d";
  c.lineCap = "round"; c.lineJoin = "round";
  c.fillStyle = "rgba(60,45,30,0.2)"; c.beginPath(); c.ellipse(x + 5, y + 2, 14, 5, 0, 0, 7); c.fill();
  c.strokeStyle = INK; c.lineWidth = 11; c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x - 4, y - 24); c.moveTo(x + 5, y); c.lineTo(x + 5, y - 24); c.stroke();
  c.strokeStyle = B; c.lineWidth = 8; c.stroke();
  c.beginPath(); c.moveTo(x - 13, y - 20); c.quadraticCurveTo(x - 16, y - 50, x - 9, y - 68); c.lineTo(x + 11, y - 68); c.quadraticCurveTo(x + 18, y - 50, x + 14, y - 20); c.closePath();
  c.fillStyle = B; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
  c.fillStyle = BL; c.beginPath(); c.moveTo(x - 12, y - 24); c.quadraticCurveTo(x - 15, y - 50, x - 9, y - 66); c.lineTo(x - 4, y - 66); c.quadraticCurveTo(x - 8, y - 48, x - 6, y - 24); c.fill();
  c.fillStyle = BD; c.beginPath(); c.moveTo(x + 6, y - 22); c.quadraticCurveTo(x + 12, y - 48, x + 9, y - 66); c.lineTo(x + 11, y - 68); c.quadraticCurveTo(x + 18, y - 50, x + 14, y - 20); c.closePath(); c.fill();
  c.strokeStyle = "#2c2c26"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x + 1, y - 65); c.lineTo(x + 2, y - 21); c.moveTo(x - 6, y - 61); c.lineTo(x + 1, y - 53); c.lineTo(x + 8, y - 61); c.stroke();
  c.fillStyle = B; c.beginPath(); c.ellipse(x - 1, y - 69, 11, 4, 0, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  c.fillStyle = B; c.beginPath(); c.arc(x + 1, y - 76, 6.6, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
  c.fillStyle = BL; c.beginPath(); c.arc(x - 1.2, y - 78, 3, 0, 7); c.fill();
  c.strokeStyle = INK; c.lineWidth = 4.6; c.beginPath(); c.moveTo(x - 10, y - 61); c.lineTo(x - 17, y - 43); c.stroke(); c.strokeStyle = B; c.lineWidth = 2.8; c.stroke();
  c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(x - 18, y - 43); c.lineTo(x - 22, y + 1); c.stroke(); c.strokeStyle = "#5a4a32"; c.lineWidth = 1.2; c.stroke();
  // a pigeon lands on his head now and then
  const ph = (t * 0.17) % 1, here = ph > 0.25 && ph < 0.85;
  if (here) { const bob = Math.max(0, Math.sin(t * 6)) * 1.2; c.fillStyle = "#8f9aa6"; c.beginPath(); c.ellipse(x + 2, y - 84 - bob, 3.6, 2.2, 0, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke(); c.beginPath(); c.arc(x + 5, y - 86 - bob, 1.5, 0, 7); c.fill(); c.stroke(); }
  else { const f = ph <= 0.25 ? ph / 0.25 : (ph - 0.85) / 0.15; const a = ph <= 0.25 ? 1 - f : f; k.bird(x + 2 + (ph <= 0.25 ? -1 : 1) * a * 70, y - 84 - a * 45, { size: 0.55, phase: ph * 8 }); }
}

function picnic(k, u, v, t) {
  const c = k.ctx, du = 0.62, dv = 0.46;
  k.poly([[u - du, v - dv, 0.02], [u + du, v - dv, 0.02], [u + du, v + dv, 0.02], [u - du, v + dv, 0.02]], "#ec9aa6", { lw: 1.2, wobble: 0 });
  for (let i = 1; i < 4; i++) k.line3([[u - du + i * 0.31, v - dv, 0.02], [u - du + i * 0.31, v + dv, 0.02]], { stroke: "rgba(255,255,255,0.7)", lw: 1.4, wobble: 0 });
  for (let j = 1; j < 3; j++) k.line3([[u - du, v - dv + j * 0.31, 0.02], [u + du, v - dv + j * 0.31, 0.02]], { stroke: "rgba(255,255,255,0.7)", lw: 1.4, wobble: 0 });
  const [bx2, by] = P(u + 0.05, v + 0.05, 0.05); c.fillStyle = "#b07a45"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.roundRect(bx2 - 7, by - 6, 14, 8, 2); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(bx2 - 5, by - 6); c.quadraticCurveTo(bx2, by - 13, bx2 + 5, by - 6); c.stroke();
  k.person(u - 0.4, v - 0.28, { pose: "sitground", dir: [0.6, 0.5], seed: 301 });
  k.person(u + 0.02, v - 0.3, { pose: "sitground", dir: [0.2, 1], seed: 302 });
  const p = k.person(u + 0.42, v + 0.14, { pose: "sitground", dir: [-0.6, -0.35], seed: 303, gesture: true });
  const lift = Math.max(0, Math.sin(t * 1.3)) * 7;
  c.fillStyle = "#c9415a"; c.beginPath(); c.arc(p.aR[0], p.aR[1] - lift, 2.6, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.6; c.stroke();
}
function lamp(k, u, v) { k.lamp(u, v, { col: IRONLAMP, h: 1.95 }); }
function shrub(k, u, v, r, seed, col = "#7e9a40") { k.ell(u + 0.15, v + 0.08, 0, r * 0.9, "rgba(60,45,30,0.14)", { stroke: false }); const [x, y] = P(u, v, r * 0.55); k._lobe(x, y, r * 40, col, seed, { squash: 0.82, bumps: 11 }); }
const TREE = "#9aae48", TREE2 = "#a8b852", TREE3 = "#8fa343";
const LOBES = [[-0.42, -0.3, 0.6], [0.4, -0.36, 0.58], [0, -0.66, 0.6], [-0.2, -0.95, 0.42], [0.3, -0.9, 0.4], [-0.62, 0.12, 0.54], [0.6, 0.08, 0.56], [0, -0.05, 0.66], [-0.3, 0.42, 0.5], [0.32, 0.4, 0.5]];

function ground(k) {
  const c = k.ctx;
  k.groundTrace({ lawn: LAWNS }, { lawn: LAWNC, paved: SAND, side: "#e0cd9f", tufts: 12 });
  // gravel speckle on the sand
  { const Rr = rng(5); c.fillStyle = "rgba(150,120,70,0.32)"; for (let i = 0; i < 300; i++) { const [x, y] = P(0.3 + Rr() * 9.4, 3.5 + Rr() * 3.75, 0); c.fillRect(x, y, 1.6, 1.1); } }
  // stone forecourt behind the railing (palace sits on it)
  k.poly([[0.3, 0.3, 0], [9.7, 0.3, 0], [9.7, 3.5, 0], [0.3, 3.5, 0]], STONE, { lw: 1.1, wobble: 0 });
  c.save(); k._trace([P(0.3, 0.3), P(9.7, 0.3), P(9.7, 3.5), P(0.3, 3.5)], true, 0); c.clip();
  c.strokeStyle = "rgba(120,100,70,0.3)"; c.lineWidth = 0.7; c.beginPath();
  for (let v = 0.3; v <= 3.5; v += 0.3) { c.moveTo(...P(0.3, v)); c.lineTo(...P(9.7, v)); }
  for (let u = 0.3; u <= 9.7; u += 0.3) for (let v = 0.3; v < 3.5; v += 0.6) { const o = (Math.round((u - 0.3) / 0.3) % 2) * 0.3; c.moveTo(...P(u, v + o)); c.lineTo(...P(u, Math.min(3.5, v + o + 0.3))); }
  c.stroke();
  { const Rr = rng(11); for (let i = 0; i < 90; i++) { const [x, y] = P(0.4 + Rr() * 9.2, 0.4 + Rr() * 3, 0); c.fillStyle = Rr() < 0.5 ? "rgba(255,255,255,0.25)" : "rgba(110,90,60,0.12)"; c.fillRect(x - 5, y - 1.5, 10, 3); } }
  c.restore();
  // sand walks: edge + centre tone
  for (const [u0, u1, v0, v1] of [[0.3, 9.7, 3.5, 4.2], [0.3, 9.7, 6.55, 7.25], [4.35, 5.65, 4.2, 6.55], [0.3, 0.9, 4.2, 6.55], [9.1, 9.7, 4.2, 6.55]]) k.poly([[u0, v0, 0], [u1, v0, 0], [u1, v1, 0], [u0, v1, 0]], "#ecdcb0", { stroke: false });
  { const Rr = rng(9); c.fillStyle = "rgba(140,112,64,0.4)"; for (let i = 0; i < 260; i++) { const [x, y] = P(0.3 + Rr() * 9.4, [3.5, 6.55][i % 2] + Rr() * 0.7, 0); c.fillRect(x, y, 1.3, 1); } }
  // stone pavement + kerb + road
  k.poly([[0.3, 7.25, 0], [9.7, 7.25, 0], [9.7, 7.8, 0], [0.3, 7.8, 0]], STONE, { lw: 1, wobble: 0 });
  c.strokeStyle = "rgba(120,100,70,0.3)"; c.lineWidth = 0.7; c.beginPath(); for (let u = 0.3; u <= 9.7; u += 0.5) { c.moveTo(...P(u, 7.25)); c.lineTo(...P(u, 7.8)); } c.moveTo(...P(0.3, 7.52)); c.lineTo(...P(9.7, 7.52)); c.stroke();
  k.poly([[0.3, 7.8, 0], [9.7, 7.8, 0], [9.7, 9.55, 0], [0.3, 9.55, 0]], "#7b7e86", { lw: 1.1, wobble: 0 });
  c.save(); k._trace([P(0.3, 7.8), P(9.7, 7.8), P(9.7, 9.55), P(0.3, 9.55)], true, 0); c.clip();
  { const Rr = rng(21); for (let i = 0; i < 220; i++) { const [x, y] = P(0.3 + Rr() * 9.4, 7.8 + Rr() * 1.75, 0); c.fillStyle = Rr() < 0.5 ? "rgba(255,255,255,0.1)" : "rgba(30,30,40,0.12)"; c.fillRect(x, y, 1.6, 1.1); } }
  c.strokeStyle = "rgba(60,62,70,0.22)"; c.lineWidth = 15; c.beginPath(); for (let s = 0; s <= LOOP.L + 0.01; s += 0.1) { const p = LOOP.sample(s % LOOP.L), [x, y] = P(p.u, p.v); s ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); c.stroke();
  c.restore();
  // lane marks: dashed centre line, solid edge lines, zebra
  c.strokeStyle = "#f2efe2"; c.lineWidth = 2; c.setLineDash([9, 8]); c.beginPath(); c.moveTo(...P(0.4, 8.675)); c.lineTo(...P(9.6, 8.675)); c.stroke(); c.setLineDash([]);
  c.lineWidth = 1.6; c.beginPath(); c.moveTo(...P(0.4, 7.92)); c.lineTo(...P(9.6, 7.92)); c.moveTo(...P(0.4, 9.43)); c.lineTo(...P(9.6, 9.43)); c.stroke();
  for (let i = 0; i < 7; i++) { const u = 3.7 + i * 0.28; k.poly([[u, 7.98, 0], [u + 0.14, 7.98, 0], [u + 0.14, 9.4, 0], [u, 9.4, 0]], "rgba(242,239,226,0.8)", { stroke: false }); }
  // kerb stones + rim pavement
  k.poly([[0.3, 7.8, 0], [9.7, 7.8, 0], [9.7, 7.87, 0], [0.3, 7.87, 0]], "#bdb39b", { stroke: false });
  k.poly([[0.3, 9.55, 0], [9.7, 9.55, 0], [9.7, 9.7, 0], [0.3, 9.7, 0]], STONE, { lw: 1, wobble: 0 });
}

export default function draw(k, t) {
  const c = k.ctx;
  ground(k);
  // forecourt shadows of the buildings (soft, inside the tile)
  k.poly([[0.4, 2.66, 0], [8.0, 2.66, 0], [8.0, 2.95, 0], [0.4, 2.95, 0]], "rgba(70,55,35,0.12)", { stroke: false });
  k.poly([[9.4, 1.3, 0], [9.7, 1.3, 0], [9.7, 2.8, 0], [9.4, 2.8, 0]], "rgba(70,55,35,0.12)", { stroke: false });

  // ---------- the palace (behind everything) ----------
  k.q(0, () => WEST.draw(k, t));

  // ---------- railing + gate piers along the forecourt ----------
  const RV = 3.45;
  for (let u = 0.45; u < 9.5; u += 0.5) { const a = u, b = Math.min(u + 0.5, 9.55); if (b > 4.45 && a < 5.55) continue; k.q((a + b) / 2 + RV + 0.02, () => railU(k, a, b, RV)); }
  for (const u of [0.45, 4.4, 5.6, 9.55]) k.q(u + RV + 0.2, () => pier(k, u, RV));

  // ---------- trees, shrubs, beds ----------
  k.q(1.3 + 4.7 + 0.5, () => k.tree(1.3, 4.7, { r: 0.7, h: 1.8, seed: 31, col: TREE2, lobes: LOBES }));
  k.q(3.5 + 6.0 + 0.4, () => k.tree(3.5, 5.95, { r: 0.6, h: 1.5, seed: 32, col: TREE, lobes: LOBES }));
  k.q(6.2 + 6.0 + 0.4, () => k.tree(6.2, 6.0, { r: 0.55, h: 1.4, seed: 33, col: TREE3, lobes: LOBES }));
  k.q(8.6 + 4.85 + 0.4, () => k.tree(8.6, 4.85, { r: 0.75, h: 1.9, seed: 34, col: TREE2, lobes: LOBES }));
  k.q(0.9 + 7.45 + 0.4, () => k.tree(0.8, 7.5, { r: 0.45, h: 1.3, seed: 35, col: TREE, lobes: LOBES }));
  k.q(9.0 + 4.0 + 0.4, () => k.tree(9.35, 3.9, { r: 0.42, h: 1.2, seed: 36, col: TREE3, lobes: LOBES }));
  k.q(2.4 + 4.6, () => k.flowerCurve([[1.4, 4.45], [2.6, 4.4], [4.0, 4.45]], 0.35, { seed: 41, cols: ["#f39ac0", "#e8607a", "#ffffff", "#f6b8d0"] }));
  k.q(7.5 + 4.6, () => k.flowerCurve([[6.0, 4.45], [7.2, 4.4], [8.6, 4.45]], 0.35, { seed: 42, cols: ["#f4c542", "#e9813c", "#d94a5c", "#f39ac0"] }));
  k.q(2.2 + 6.4, () => k.flowerCurve([[1.2, 6.25], [2.0, 6.35], [2.9, 6.3]], 0.32, { seed: 43, cols: ["#e8607a", "#d94a5c", "#f39ac0", "#f4c542"] }));
  k.q(8.0 + 6.4, () => k.flowerCurve([[7.2, 6.3], [8.0, 6.35], [8.8, 6.25]], 0.32, { seed: 44, cols: ["#e03a3a", "#e8607a", "#d94a5c", "#f4c542"] }));
  k.q(5.0 + 4.0, () => { shrub(k, 4.12, 4.45, 0.3, 51); shrub(k, 5.88, 4.45, 0.3, 52, "#86a246"); });
  k.q(5.0 + 6.4, () => { shrub(k, 4.12, 6.35, 0.3, 53); shrub(k, 5.88, 6.35, 0.3, 54, "#86a246"); });

  // ---------- street furniture ----------
  k.q(7.3 + 5.4 + 0.6, () => statue(k, 7.3, 5.4, t));
  k.q(9.0 + 7.3 + 0.5, () => phoneBox(k, 9.0, 7.3));
  k.q(1.5 + 7.45, () => pillarBox(k, 1.6, 7.5));
  for (const [u, v] of [[4.25, 3.75], [5.75, 3.75], [0.7, 7.45], [3.4, 7.45], [8.2, 7.45], [9.25, 6.2]]) k.q(u + v + 0.2, () => lamp(k, u, v));
  k.q(2.6 + 6.2 + 0.4, () => k.bench(2.6, 6.15, { along: "u" }));
  k.q(6.4 + 6.2 + 0.4, () => k.bench(6.4, 6.15, { along: "u" }));
  k.q(2.3 + 5.4, () => picnic(k, 2.3, 5.35, t));
  // bus stop pole + sign
  k.q(6.0 + 7.5 + 0.3, () => { const [x, y] = P(6.0, 7.5, 0), [, yt] = P(6.0, 7.5, 1.8); c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt); c.stroke(); c.fillStyle = "#c8362f"; c.beginPath(); c.arc(x, yt - 5, 6, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke(); c.fillStyle = "#f5f2ea"; c.fillRect(x - 6, yt - 6.5, 12, 3); c.fillStyle = "#23407c"; c.font = "bold 4px sans-serif"; c.textAlign = "center"; c.fillText("BUS", x, yt - 4.2); });

  // ---------- life ----------
  const bp = vehicleAt(t, 0), cp = vehicleAt(t, LOOP.L * 0.5);
  k.q(bp.u + bp.v + 0.9, () => bus(k, bp.u, bp.v, bp.ang, { len: 1.7 }));
  k.q(cp.u + cp.v + 0.4, () => cab(k, cp.u, cp.v, cp.ang));

  const nR = 9;
  for (let i = 0; i < nR; i++) k.qwalker(RING, { loop: true, speed: 0.34 + (i % 3) * 0.02, offset: i / nR, seed: 140 + i * 3, ...(i === 3 ? { kid: true } : i === 6 ? { hat: true } : {}) });
  k.qwalker(CROSS_A, { speed: 0.4, offset: 0.1, seed: 171, dwell: 1.4 });
  k.qwalker(CROSS_B, { speed: 0.38, offset: 0.55, seed: 172, dwell: 1.8 });
  k.qwalker(COURT_A, { speed: 0.36, offset: 0.2, seed: 173, dwell: 1.2 });
  k.qwalker(COURT_B, { speed: 0.4, offset: 0.7, seed: 174, dwell: 1.5 });
  // tourists at the phone box + the photographer at the gate framing Big Ben
  k.qperson(8.6, 7.55, { pose: "photo", dir: [0.2, -1], seed: 71 });
  k.qperson(8.8, 7.45, { pose: "stand", dir: [0.1, 1], seed: 72 });
  k.qperson(8.45, 7.45, { pose: "wave", dir: [0.2, 1], seed: 73, kid: true });
  k.qperson(4.1, 3.15, { pose: "photo", dir: [0.6, -1], seed: 75 });
  k.qperson(4.3, 3.0, { pose: "stand", dir: [0.4, -1], seed: 76 });
  k.qperson(5.3, 3.0, { pose: "cheer", dir: [0.5, -1], seed: 77 });
  // by the statue: two looking up
  k.qperson(6.45, 5.15, { pose: "stand", dir: [0.9, 0.3], seed: 78 });
  k.qperson(6.5, 5.75, { pose: "photo", dir: [0.9, -0.1], seed: 79 });
  // bench sitters
  k.q(2.6 + 6.2 + 0.9, () => { k.person(2.85, 6.38, { pose: "sit", bench: true, seatZ: 0.28, dir: [0.1, 1], seed: 80 }); k.person(3.2, 6.38, { pose: "sit", bench: true, seatZ: 0.28, dir: [0.1, 1], seed: 81, gesture: true }); });
  k.q(6.4 + 6.2 + 0.9, () => k.person(6.75, 6.38, { pose: "sit", bench: true, seatZ: 0.28, dir: [0.1, 1], seed: 82 }));
  // pigeons pecking on the forecourt
  for (let i = 0; i < 5; i++) { const u = 5.85 + i * 0.32 + Math.sin(t * 0.6 + i) * 0.1, v = 3.1 + (i % 2) * 0.25; k.q(u + v, () => pigeon(k, u, v, { phase: i * 2 })); }
  k.flush();

  // ---------- sky: a flock circles the belfry and lifts off on every bong ----------
  const since = (((t / 12 + 0.62) % 1) + 1) % 1 * 12;
  const [bx0, by0] = WEST.belfry();
  for (let i = 0; i < 6; i++) {
    const a = t * 0.55 + i * 1.05, rr = 70 + (i % 3) * 18;
    let x = bx0 + Math.cos(a) * rr, y = by0 - 30 + Math.sin(a) * rr * 0.35 - (i % 2) * 14;
    if (since < 3) { const e = since / 3, burst = Math.sin(e * Math.PI) * 40; x += Math.cos(i * 2.1) * burst; y -= burst * 0.7; }
    k.bird(x, y, { size: 0.6 + (i % 3) * 0.12, phase: i * 1.7 });
  }
  k.circlingBird(380, 220, 55, 20, { speed: -0.5, phase: 2 });
  k.cloud(330, 150, { s: 0.85, phase: 1 });
  k.cloud(905, 150, { s: 0.7, phase: 3 });
}

// close-up framing: tilt from the crowd under the tower up its shaft to the clock, belfry and spire
export const camera = { u: 7.2, v: 2.6, z: 5.6, zoom: 1.35, baseU: 8.8, baseV: 3.3, baseZ: 0.8, topZ: 12.4 };
