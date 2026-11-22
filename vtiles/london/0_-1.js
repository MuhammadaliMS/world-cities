// LONDON · 0,-1 · The London Eye & South Bank (grid pass)
// Layout (u,v), everything inside 0.3..9.7:
//   wheel: vertical plane along u at v 3.4 (centre u 5, hub z 5.4, R 4.2), A-frame legs lean back to v 1.0, backstays to v 0.5
//   glass boarding pavilion u 3.55-6.45, v 2.85-4.35 under the wheel
//   promenade v 0.3-6.2 (back lane v ~1.8, mid v 4.95, front lane v 5.6), buskers at (2,4.2) and (7.4,4.3), BOOKS stall u 8-9.2 v 2.2-3.5
//   railing v 6.15, quay wall v 6.4, Thames v 6.4-9.7 (sunk to ZW); the cruiser loops inside it with a wake.
import { P, INK, shade, mix, lerp, clamp, rng, ZW, WATER, railPanel, post, trail, cruiser, prism } from "./_g0_-1.js";
import { pigeon } from "./_props.js";
import { makeEye } from "./eye.js";
import { planeTree, guitarist, juggler } from "./_t0_-1.js";

export const camera = { u: 5, v: 3.6, z: 4.6, zoom: 1.45 };

const EYE = makeEye();
const PAVE = "#ecdcb6";
const RAILV = 6.15;

function ground(k, t) {
  const c = k.ctx;
  k.slab(PAVE);
  c.save(); k._trace([P(0.3, 0.3), P(9.7, 0.3), P(9.7, 6.4), P(0.3, 6.4)], true, 0); c.clip();
  // darker strips: edge rim at the back, kerb along the quay, a diagonal-free grid of slabs
  k.poly([[0.3, 0.3, 0], [9.7, 0.3, 0], [9.7, 0.6, 0], [0.3, 0.6, 0]], "#dcc79c", { stroke: false });
  k.poly([[0.3, 6.1, 0], [9.7, 6.1, 0], [9.7, 6.4, 0], [0.3, 6.4, 0]], "#dcc39a", { stroke: false });
  const R = rng(5);
  for (let i = 0; i < 19; i++) for (let j = 0; j < 12; j++) if (R() < 0.18) { const u = 0.3 + i * 0.5, v = 0.6 + j * 0.48; k.poly([[u, v, 0], [u + 0.5, v, 0], [u + 0.5, v + 0.48, 0], [u, v + 0.48, 0]], "rgba(205,175,130,0.28)", { stroke: false }); }
  c.strokeStyle = "rgba(150,112,66,0.24)"; c.lineWidth = 0.8; c.beginPath();
  for (let i = 0; i <= 19; i++) { c.moveTo(...P(0.3 + i * 0.5, 0.6, 0)); c.lineTo(...P(0.3 + i * 0.5, 6.1, 0)); }
  for (let j = 0; j <= 11; j++) { c.moveTo(...P(0.3, 0.6 + j * 0.5, 0)); c.lineTo(...P(9.7, 0.6 + j * 0.5, 0)); }
  c.stroke();
  k.stipple([[0.3, 0.3], [9.7, 0.3], [9.7, 6.4], [0.3, 6.4]], { density: 5 });
  c.restore();
  river(k, t);
}

function river(k, t) {
  const c = k.ctx, W2 = WATER.map(([u, v]) => P(u, v, ZW));
  const g = c.createLinearGradient(...P(0.3, 6.4, ZW), ...P(9.7, 9.7, ZW)); g.addColorStop(0, "#7ba3b6"); g.addColorStop(0.5, "#5b86a8"); g.addColorStop(1, "#4a7499");
  k.path(W2, { fill: g, lw: 1.4, wobble: 0 });
  c.save(); k._trace(W2, true, 0); c.clip();
  c.strokeStyle = "rgba(30,60,90,0.22)"; c.lineWidth = 9; c.beginPath(); c.moveTo(...P(0.3, 6.52, ZW)); c.lineTo(...P(9.7, 6.52, ZW)); c.moveTo(...P(0.42, 6.4, ZW)); c.lineTo(...P(0.42, 9.7, ZW)); c.stroke();
  const R = rng(17); c.lineCap = "round";
  for (let i = 0; i < 150; i++) {
    const u0 = 0.4 + R() * 9.2, v0 = 6.5 + R() * 3.2, ph = R() * 6.28, sp = 0.6 + R() * 0.6, len = 4 + R() * 6;
    const du = ((t * 0.08 * sp + R()) % 1) * 0.8;
    const [x, y] = P(u0 + du, v0, ZW), a = 0.5 + 0.5 * Math.sin(t * 1.4 * sp + ph);
    c.globalAlpha = 0.35 + a * 0.5;
    c.strokeStyle = i % 3 === 0 ? "rgba(252,228,150,0.9)" : i % 3 === 1 ? "rgba(40,70,100,0.45)" : "rgba(235,245,255,0.85)"; c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(x - len, y); c.quadraticCurveTo(x - len / 2, y - 2, x, y); c.quadraticCurveTo(x + len / 2, y + 2, x + len, y); c.stroke();
  }
  c.globalAlpha = 1; c.restore();
  // quay walls: the two visible sides of the sunken river, coping, block joints
  k.poly([[0.3, 6.4, ZW], [9.7, 6.4, ZW], [9.7, 6.4, 0], [0.3, 6.4, 0]], "#d1c19a", { lw: 1.1, wobble: 0 });
  k.poly([[0.3, 6.4, ZW], [0.3, 9.7, ZW], [0.3, 9.7, 0], [0.3, 6.4, 0]], "#b9a27a", { lw: 1.1, wobble: 0 });
  c.strokeStyle = "rgba(110,80,44,0.4)"; c.lineWidth = 0.7; c.beginPath();
  c.moveTo(...P(0.3, 6.4, ZW * 0.5)); c.lineTo(...P(9.7, 6.4, ZW * 0.5));
  for (let u = 0.5, r = 0; u < 9.7; u += 0.42, r++) { c.moveTo(...P(u, 6.4, r % 2 ? 0 : ZW * 0.5)); c.lineTo(...P(u, 6.4, r % 2 ? ZW * 0.5 : ZW)); }
  c.moveTo(...P(0.3, 6.4, ZW * 0.5)); c.lineTo(...P(0.3, 9.7, ZW * 0.5));
  for (let v = 6.6, r = 0; v < 9.7; v += 0.42, r++) { c.moveTo(...P(0.3, v, r % 2 ? 0 : ZW * 0.5)); c.lineTo(...P(0.3, v, r % 2 ? ZW * 0.5 : ZW)); }
  c.stroke();
  c.strokeStyle = "rgba(255,255,255,0.6)"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(...P(0.3, 6.4, ZW + 0.03)); c.lineTo(...P(9.7, 6.4, ZW + 0.03)); c.stroke();
  // pavement rim redrawn over the water overhang
  k.poly([[0.3, 9.7, 0], [10, 9.7, 0], [10, 10, 0], [0.3, 10, 0]], PAVE, { lw: 1.2, wobble: 0 });
  k.poly([[9.7, 6.4, 0], [10, 6.4, 0], [10, 10, 0], [9.7, 10, 0]], PAVE, { lw: 1.2, wobble: 0 });
  k.poly([[0, 9.7, 0], [0.3, 9.7, 0], [0.3, 10, 0], [0, 10, 0]], PAVE, { lw: 1.2, wobble: 0 });
}

// ---------- plane tree: the canopy is drawn around the projected trunk/crown anchors ----------
function planeAt(k, u, v, h, R, seed, col) {
  const [bx, by] = P(u, v, 0), [cx, cy] = P(u, v, h);
  planeTree(k, bx, by, cx, cy, R, { seed, col });
}

function dolphinLamp(k, u, v) {
  const c = k.ctx, h = 2.1;
  k.ell(u + 0.1, v + 0.05, 0, 0.2, "rgba(60,45,30,0.15)", { stroke: false });
  k.box(u - 0.17, v - 0.17, 0, 0.34, 0.34, 0.26, "#c9c2b0", { hatch: false, shadow: false });
  const [px, py] = P(u, v, 0.26), [, pt] = P(u, v, h);
  c.strokeStyle = INK; c.lineWidth = 7; c.lineCap = "round"; c.beginPath(); c.moveTo(px, py); c.lineTo(px, pt + 6); c.stroke(); c.strokeStyle = "#2a2d2f"; c.lineWidth = 5; c.stroke();
  c.strokeStyle = "#6a6f72"; c.lineWidth = 1; c.beginPath(); c.moveTo(px - 1, py - 4); c.lineTo(px - 1, pt + 10); c.stroke();
  c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(px, pt + 8); c.quadraticCurveTo(px - 11, pt + 2, px - 8, pt - 6); c.moveTo(px, pt + 8); c.quadraticCurveTo(px + 11, pt + 2, px + 8, pt - 6); c.stroke();
  c.strokeStyle = "#2a2d2f"; c.lineWidth = 1.6; c.stroke();
  const glow = 0.8 + 0.2 * Math.sin(k.t * 3 + u);
  const grd = c.createRadialGradient(px - 2, pt - 14, 1, px, pt - 12, 10); grd.addColorStop(0, "#fffbe6"); grd.addColorStop(1, `rgba(240,214,130,${glow})`);
  c.beginPath(); c.arc(px, pt - 12, 8.5, 0, 7); c.fillStyle = grd; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
  c.fillStyle = "#2a2d2f"; c.beginPath(); c.moveTo(px - 4, pt - 20); c.lineTo(px, pt - 25); c.lineTo(px + 4, pt - 20); c.fill();
}
function planter(k, u, v, du, dv, seed) {
  k.box(u, v, 0, du, dv, 0.3, "#d8c9a6", { hatch: false, shadow: false });
  k.flowers(u + 0.05, v + 0.05, du - 0.1, dv - 0.1, { seed, bed: "#6c9c4c", cols: ["#e8607a", "#f39ac0", "#ffffff", "#f4c542"], density: 80 });
}
function cafe(k, u, v, col, seed) {
  k.cyl(u, v, 0, 0.28, 0.42, "#f1ead8");
  for (const [du, dv] of [[-0.5, 0.05], [0.5, 0.1], [0.05, 0.5]]) k.box(u + du - 0.12, v + dv - 0.12, 0, 0.24, 0.24, 0.3, "#8a5a38", { hatch: false, shadow: false });
  k.umbrella(u, v, { h: 1.55, r: 0.72, col });
  k.person(u - 0.5, v + 0.05, { pose: "sit", bench: true, seatZ: 0.3, dir: [0.7, 0.2], seed });
  k.person(u + 0.5, v + 0.1, { pose: "sit", bench: true, seatZ: 0.3, dir: [-0.7, 0.3], seed: seed + 1 });
}

// striped bookstall: counter, back shelves, posts and a sloping red/white roof; all walls axis-aligned
function stallBack(k) {
  const c = k.ctx;
  k.box(8.0, 2.25, 0, 1.2, 0.22, 1.35, "#7a5233", { hatch: false });
  const cols = ["#d9544b", "#3e6fa8", "#e9c24d", "#5f9d6d", "#f4f0e6", "#e88c3d"];
  for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) k.poly([[8.04 + i * 0.19, 2.47, 0.35 + r * 0.38], [8.04 + i * 0.19 + 0.15, 2.47, 0.35 + r * 0.38], [8.04 + i * 0.19 + 0.15, 2.47, 0.65 + r * 0.38], [8.04 + i * 0.19, 2.47, 0.65 + r * 0.38]], cols[(i + r * 2) % 6], { lw: 0.5, wobble: 0 });
}
function stallFront(k, t) {
  const c = k.ctx;
  k.box(8.0, 3.0, 0, 1.2, 0.4, 0.7, "#a86f46", { hatch: false });
  const cols = ["#d9544b", "#3e6fa8", "#e9c24d", "#5f9d6d", "#f4f0e6"];
  for (let i = 0; i < 5; i++) k.box(8.1 + i * 0.22, 3.12, 0.7, 0.16, 0.14, 0.1 + (i % 2) * 0.06, cols[i], { hatch: false, shadow: false });
  for (const [u, v] of [[8.0, 2.45], [9.2, 2.45], [8.0, 3.4], [9.2, 3.4]]) k.line3([[u, v, 0], [u, v, 1.55]], { stroke: "#5a4632", lw: 1.8, wobble: 0 });
  // roof strips slope down to the front
  for (let i = 0; i < 8; i++) {
    const a = 7.92 + (i * 1.36) / 8, b = 7.92 + ((i + 1) * 1.36) / 8;
    k.poly([[a, 2.35, 1.75], [b, 2.35, 1.75], [b, 3.62, 1.4], [a, 3.62, 1.4]], i % 2 ? "#f6f0e2" : "#d9433a", { lw: 0.8, wobble: 0 });
  }
  for (let i = 0; i < 8; i++) { const a = 7.92 + (i * 1.36) / 8, b = 7.92 + ((i + 1) * 1.36) / 8; k.poly([[a, 3.62, 1.4], [b, 3.62, 1.4], [b, 3.62, 1.27], [a, 3.62, 1.27]], i % 2 ? "#f6f0e2" : "#d9433a", { lw: 0.7, wobble: 0 }); }
  k.box(8.25, 3.64, 1.0, 0.7, 0.04, 0.2, "#2f4b6c", { hatch: false, shadow: false });
  textU(k.ctx, "BOOKS", 8.6, 3.69, 1.1, 6.5, "#f4f0e6");
}
function textU(c, text, u, v, z, size, col) {
  const [x, y] = P(u, v, z);
  c.save(); c.transform(1, 0.577, 0, 1, x, y); c.font = `bold ${size}px sans-serif`; c.fillStyle = col; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(text, 0, 0); c.restore();
}

// ---------- river lane loop for the cruiser ----------
const UL = 3.0, UR = 7.0, VA = 7.35, VB = 8.75, VM = (VA + VB) / 2, RT = (VB - VA) / 2;
const LS = UR - UL, LT = Math.PI * RT, LOOP = 2 * LS + 2 * LT;
function lanePos(s) {
  s = ((s % LOOP) + LOOP) % LOOP;
  if (s < LS) return { u: UL + s, v: VA, h: 0 };
  s -= LS;
  if (s < LT) { const th = s / RT; return { u: UR + RT * Math.sin(th), v: VM - RT * Math.cos(th), h: th }; }
  s -= LT;
  if (s < LS) return { u: UR - s, v: VB, h: Math.PI };
  s -= LS;
  const ph = s / RT; return { u: UL - RT * Math.sin(ph), v: VM + RT * Math.cos(ph), h: Math.PI + ph };
}

export default function draw(k, t) {
  const c = k.ctx;
  ground(k, t);

  // ---------- behind: trees, wheel legs, stall shelves ----------
  const TREES = [[0.8, 2.3, 51, "#97ad4c"], [0.8, 0.9, 52, "#9db44e"], [8.1, 1.2, 53, "#93ab4a"], [9.05, 2.0, 54, "#9bb24d"]];
  for (const [u, v, s, col] of TREES) k.q(3.3, () => planeAt(k, u, v, 1.75, 40, s, col));
  k.q(3.0, () => EYE.drawHubLegs(k, t));
  k.q(3.4, () => stallBack(k));
  k.q(3.6, () => EYE.drawWheel(k, t));
  k.q(8.2, () => EYE.pavilion(k, t));

  // ---------- front-of-promenade trees, café, stall ----------
  const FT = [[0.95, 5.4, 55, "#8fa84a"]];
  for (const [u, v, s, col] of FT) k.q(u + v, () => planeAt(k, u, v, 1.75, 42, s, col));
  k.q(1.1 + 4.15 + 0.2, () => cafe(k, 1.1, 4.15, "#e9d6a8", 61));
  k.q(12.0, () => stallFront(k, t));
  k.q(3.45, () => k.person(8.6, 2.85, { pose: "stand", dir: [0.2, 1], seed: 441, top: "#d9433a" }));
  k.qperson(8.5, 4.05, { pose: "stand", dir: [0.1, -1], seed: 442 });
  k.qperson(9.0, 4.15, { pose: "photo", dir: [-0.3, -1], seed: 443 });
  k.q(3.3, () => planter(k, 0.5, 0.6, 0.8, 0.45, 7));
  k.q(9.0 + 4.0, () => planter(k, 9.0, 3.65, 0.5, 0.3, 8));
  k.q(3.4 + 5.9, () => k.bench(3.4, 5.75, { along: "u", len: 0.9 }));
  k.q(6.9 + 5.9, () => k.bench(6.2, 5.75, { along: "u", len: 0.9 }));
  k.qperson(3.65, 5.9, { pose: "sit", bench: true, seatZ: 0.28, dir: [0.1, 1], seed: 92 });
  k.qperson(3.95, 5.9, { pose: "sit", bench: true, seatZ: 0.28, dir: [0.1, 1], seed: 93 });
  k.qperson(6.45, 5.9, { pose: "sit", bench: true, seatZ: 0.28, dir: [0.1, 1], seed: 96 });

  // ---------- railing, posts, dolphin lamps ----------
  const PX = []; for (let i = 0; i < 8; i++) PX.push(0.55 + i * 1.27);
  PX.forEach((u, i) => {
    if (i < PX.length - 1) {
      const u2 = PX[i + 1], m = (u + u2) / 2;
      k.q(m + RAILV + 0.1, () => railPanel(k, [u + 0.13, RAILV], [m, RAILV]));
      k.q(u2 + RAILV - 0.05, () => railPanel(k, [m, RAILV], [u2 - 0.13, RAILV]));
    }
    k.q(u + RAILV + 0.2, () => post(k, { u, v: RAILV, eu: 1, ev: 0, wu: 0, wv: 1 }));
  });
  for (const u of [1.2, 3.75, 6.3, 8.85]) k.q(u + 5.98 + 0.3, () => dolphinLamp(k, u, 5.98));

  // ---------- people ----------
  const A = [[0.9, 5.55], [9.0, 5.55]];
  const B = [[3.6, 4.95], [6.5, 4.95]];
  const C = [[0.9, 1.9], [3.1, 1.9]];
  const D = [[6.6, 1.9], [7.8, 2.0]];
  const E = [[0.7, 4.9], [2.4, 5.3]];
  const F = [[6.9, 5.2], [8.9, 4.7]];
  const spec = [[A, 0.0, 71], [A, 0.2, 72], [A, 0.45, 73], [A, 0.7, 74], [A, 0.9, 75], [B, 0.1, 76], [B, 0.55, 77], [C, 0.2, 78], [C, 0.75, 79], [D, 0.3, 80], [D, 0.8, 81], [A, 0.33, 82], [F, 0.3, 83], [F, 0.85, 84]];
  for (const [r, off, seed] of spec) (r === C || r === D ? (o) => k.q(3.4, () => k.walker(r, o)) : (o) => k.qwalker(r, o))( { speed: 0.34 + (seed % 5) * 0.02, offset: off, seed, dwell: 1.2 + (seed % 3) * 0.5, ...(seed === 74 ? { kid: true } : seed === 80 ? { hat: true } : {}) });
  // kid with a red balloon, photographer facing the wheel, someone waving at the boat
  k.q(5.4 + 5.2, () => { const p = k.person(5.4, 5.2, { pose: "stand", kid: true, seed: 91, dir: [0.3, 1] }); const bx = p.aR[0] + Math.sin(t * 1.7) * 4, by = p.headY - 30 + Math.sin(t * 2.3) * 2.5; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.moveTo(p.aR[0], p.aR[1]); c.quadraticCurveTo(bx - 3, by + 14, bx, by + 7); c.stroke(); c.beginPath(); c.ellipse(bx, by, 6, 7.2, 0, 0, 7); c.fillStyle = "#d84840"; c.fill(); c.lineWidth = 1.4; c.stroke(); });
  k.qperson(4.7, 5.05, { pose: "photo", dir: [-0.2, -1], seed: 94 });
  k.qperson(5.9, 4.8, { pose: "wave", dir: [0.3, 1], seed: 95 });
  // boarding queue at the pavilion
  k.qperson(4.6, 4.7, { pose: "stand", dir: [0.1, -1], seed: 341 }); k.qperson(4.85, 4.75, { pose: "stand", kid: true, dir: [0.1, -1], seed: 342 }); k.qperson(5.3, 4.7, { pose: "stand", dir: [0.1, -1], seed: 344 });
  for (let i = 0; i < 3; i++) k.q(5.6 + i * 0.4 + 5.1, () => pigeon(k, 5.6 + i * 0.4 + Math.sin(t * 0.5 + i) * 0.1, 5.1 + (i % 2) * 0.2, { phase: i * 2 }));

  // buskers with audiences
  k.q(7.4 + 4.3, () => juggler(k, 7.4, 4.3, 301));
  [[6.8, 4.8, "clap", 311], [7.9, 4.75, "cheer", 312], [7.0, 3.8, "photo", 313], [8.1, 3.9, "stand", 314]].forEach(([u, v, pose, sd]) => k.qperson(u, v, { pose, dir: [7.4 - u, 4.3 - v], seed: sd }));
  k.q(2.5 + 4.2, () => guitarist(k, 2.5, 4.2, 321));
  [[1.95, 4.8, "clap", 322], [3.05, 4.75, "stand", 323], [2.5, 3.65, "photo", 324]].forEach(([u, v, pose, sd]) => k.qperson(u, v, { pose, dir: [2.5 - u, 4.2 - v], seed: sd }));
  // painter at an easel by the railing
  k.qperson(1.1, 5.9, { pose: "paint", dir: [0.4, 0.9], seed: 331 });

  // ---------- river cruiser, always in front ----------
  const s1 = 0.5 * t + 0.5;
  const Bt = lanePos(s1);
  k.q(99, () => trail(k, lanePos, s1, 0.8, t, 1, 3.2));
  const pax = [[0.0, -0.38, 301], [0.35, 0.36, 302, "wave"], [0.6, -0.36, 303, "photo"], [0.9, 0.35, 304], [1.2, -0.3, 305, "cheer"], [1.45, 0.25, 306], [0.2, 0.0, 307], [0.75, 0.02, 308, "wave"], [1.55, -0.05, 309]];
  k.q(100 + Bt.u + Bt.v, () => cruiser(k, Bt.u, Bt.v, Bt.h, t, 1, pax, 0.6));
  k.flush();

  // ---------- sky ----------
  const [gx, gy] = P(6.0, 8.0, 6);
  k.circlingBird(gx, gy, 70, 22, { speed: 0.6, phase: 0 });
  k.circlingBird(gx, gy, 70, 22, { speed: 0.6, phase: 0.5, size: 0.8 });
  const [hx, hy] = P(2, 2, 11);
  k.circlingBird(hx, hy, 60, 18, { speed: -0.5, phase: 2 });
}
