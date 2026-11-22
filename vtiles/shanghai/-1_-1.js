// SHANGHAI · The Bund & Huangpu River (grid pass)
// Layout (u,v), everything inside 0.3..9.7:
//   facade row, axis-aligned along u (bund.js): v 0.7-3.1 (portico/tower fronts to ~3.5)
//   promenade v 3.1-5.6: back lane v 4.0, planters/trees/benches v ~4.3-4.6, front lane v 4.88, railing v 5.35
//   river v 5.6-9.7 (sunk to ZW behind a granite quay wall); cruiser + ferry race a closed lane loop along u.
import { P, INK, shade, mix, lerp, clamp, rng, hash } from "./_props.js";
import { spline } from "../../lib/vec-kit.js";
import { makeBund } from "./bund.js";
import { ZW, WATER, railPanel, post, bundLamp, cruiser, ferry, trail, balloonVendor } from "./_g-1_-1.js";

const BUND = makeBund();
const PAVE = "#ead6b2";
const RAILV = 5.35;

function ground(k, t) {
  const c = k.ctx;
  k.slab(PAVE);
  // paving: slab joints + tinted slabs on the promenade, darker strip along the facades and the quay
  c.save(); k._trace([P(0.3, 0.3), P(9.7, 0.3), P(9.7, 5.6), P(0.3, 5.6)], true, 0); c.clip();
  k.poly([[0.3, 3.1, 0], [9.7, 3.1, 0], [9.7, 3.35, 0], [0.3, 3.35, 0]], "#dcc39a", { stroke: false });
  k.poly([[0.3, 5.3, 0], [9.7, 5.3, 0], [9.7, 5.6, 0], [0.3, 5.6, 0]], "#dcc39a", { stroke: false });
  const R = rng(5);
  for (let i = 0; i < 19; i++) for (let j = 0; j < 5; j++) if (R() < 0.2) { const u = 0.3 + i * 0.5, v = 3.35 + j * 0.45; k.poly([[u, v, 0], [u + 0.5, v, 0], [u + 0.5, v + 0.45, 0], [u, v + 0.45, 0]], "rgba(205,175,130,0.28)", { stroke: false }); }
  c.strokeStyle = "rgba(150,112,66,0.26)"; c.lineWidth = 0.8; c.beginPath();
  for (let i = 0; i <= 19; i++) { c.moveTo(...P(0.3 + i * 0.5, 3.35, 0)); c.lineTo(...P(0.3 + i * 0.5, 5.3, 0)); }
  for (let j = 0; j <= 4; j++) { c.moveTo(...P(0.3, 3.35 + j * 0.45, 0)); c.lineTo(...P(9.7, 3.35 + j * 0.45, 0)); }
  c.stroke();
  k.stipple([[0.3, 0.3], [9.7, 0.3], [9.7, 5.6], [0.3, 5.6]], { density: 5 });
  c.restore();
  river(k, t);
}

function river(k, t) {
  const c = k.ctx, W2 = WATER.map(([u, v]) => P(u, v, ZW));
  const g = c.createLinearGradient(...P(0.3, 5.6, ZW), ...P(9.7, 9.7, ZW)); g.addColorStop(0, "#5aa99d"); g.addColorStop(0.5, "#3f978f"); g.addColorStop(1, "#2f8381");
  k.path(W2, { fill: g, lw: 1.4, wobble: 0 });
  c.save(); k._trace(W2, true, 0); c.clip();
  // quay shadow band on the water, wavelets drifting along the river (+u), golden glints
  c.strokeStyle = "rgba(20,70,70,0.22)"; c.lineWidth = 9; c.beginPath(); c.moveTo(...P(0.3, 5.72, ZW)); c.lineTo(...P(9.7, 5.72, ZW)); c.moveTo(...P(0.42, 5.6, ZW)); c.lineTo(...P(0.42, 9.7, ZW)); c.stroke();
  const R = rng(17); c.lineCap = "round";
  for (let i = 0; i < 130; i++) {
    const u0 = 0.4 + R() * 9.2, v0 = 5.7 + R() * 4, ph = R() * 6.28, sp = 0.6 + R() * 0.6, len = 4 + R() * 5;
    const du = ((t * 0.09 * sp + R()) % 1) * 0.8;
    const [x, y] = P(u0 + du, v0, ZW), a = 0.5 + 0.5 * Math.sin(t * 1.4 * sp + ph);
    c.globalAlpha = 0.35 + a * 0.5; c.strokeStyle = i % 3 ? "rgba(255,255,255,0.8)" : "rgba(20,80,80,0.45)"; c.lineWidth = i % 3 ? 1.3 : 1.1;
    c.beginPath(); c.moveTo(x - len, y); c.quadraticCurveTo(x - len / 2, y - 2, x, y); c.quadraticCurveTo(x + len / 2, y + 2, x + len, y); c.stroke();
  }
  for (let i = 0; i < 60; i++) {
    const u0 = 0.5 + R() * 9.1, v0 = 5.8 + R() * 3.8, s = Math.sin(t * (1.2 + R() * 1.5) + R() * 9);
    if (s > 0.35) { const [x, y] = P(u0, v0, ZW); c.globalAlpha = (s - 0.35) * 1.4; c.fillStyle = "#ffe59a"; c.beginPath(); c.ellipse(x, y, 3 + R() * 4, 1.1, 0, 0, 7); c.fill(); }
  }
  c.globalAlpha = 1; c.restore();
  // granite quay walls (the two visible sides of the sunken river), coping, block joints
  k.poly([[0.3, 5.6, ZW], [9.7, 5.6, ZW], [9.7, 5.6, 0], [0.3, 5.6, 0]], "#d3bd94", { lw: 1.1, wobble: 0 });
  k.poly([[0.3, 5.6, ZW], [0.3, 9.7, ZW], [0.3, 9.7, 0], [0.3, 5.6, 0]], "#b9a27a", { lw: 1.1, wobble: 0 });
  c.strokeStyle = "rgba(110,80,44,0.4)"; c.lineWidth = 0.7; c.beginPath();
  c.moveTo(...P(0.3, 5.6, ZW * 0.5)); c.lineTo(...P(9.7, 5.6, ZW * 0.5));
  for (let u = 0.5, r = 0; u < 9.7; u += 0.42, r++) { c.moveTo(...P(u, 5.6, r % 2 ? 0 : ZW * 0.5)); c.lineTo(...P(u, 5.6, r % 2 ? ZW * 0.5 : ZW)); }
  c.moveTo(...P(0.3, 5.6, ZW * 0.5)); c.lineTo(...P(0.3, 9.7, ZW * 0.5));
  for (let v = 5.8, r = 0; v < 9.7; v += 0.42, r++) { c.moveTo(...P(0.3, v, r % 2 ? 0 : ZW * 0.5)); c.lineTo(...P(0.3, v, r % 2 ? ZW * 0.5 : ZW)); }
  c.stroke();
  c.strokeStyle = "rgba(40,90,80,0.35)"; c.lineWidth = 2; c.beginPath(); c.moveTo(...P(0.3, 5.6, ZW + 0.03)); c.lineTo(...P(9.7, 5.6, ZW + 0.03)); c.moveTo(...P(0.3, 5.6, ZW + 0.03)); c.lineTo(...P(0.3, 9.7, ZW + 0.03)); c.stroke();
  // coping + near/right pavement rim redrawn over the water overhang
  k.poly([[0.3, 9.7, 0], [10, 9.7, 0], [10, 10, 0], [0.3, 10, 0]], PAVE, { lw: 1.2, wobble: 0 });
  k.poly([[9.7, 5.6, 0], [10, 5.6, 0], [10, 10, 0], [9.7, 10, 0]], PAVE, { lw: 1.2, wobble: 0 });
  k.poly([[0, 9.7, 0], [0.3, 9.7, 0], [0.3, 10, 0], [0, 10, 0]], PAVE, { lw: 1.2, wobble: 0 });
}

// raised stone planter (axis-aligned) with a mounded flower bed
function planter(k, u0, u1, v0, v1, seed) {
  const c = k.ctx, z = 0.3;
  k.box(u0, v0, 0, u1 - u0, v1 - v0, z, "#e0cda6", { shadow: false, hatch: false, left: "#e6d4ae", right: "#c9b48c", top: "#efe1c2" });
  k.poly([[u0 + 0.05, v0 + 0.05, z], [u1 - 0.05, v0 + 0.05, z], [u1 - 0.05, v1 - 0.05, z], [u0 + 0.05, v1 - 0.05, z]], "#6a5a40", { lw: 0.7, wobble: 0 });
  const R = rng(seed), cols = ["#f08aa8", "#f6b8cc", "#f4c542", "#ffffff", "#e8607a", "#f9a8c0"], n = Math.round((u1 - u0) / 0.13), tops = [];
  for (let i = 0; i < n; i++) for (const nf of [0.3, 0.7]) {
    const u = lerp(u0 + 0.1, u1 - 0.1, (i + 0.5 + (R() - 0.5) * 0.4) / n), v = lerp(v0, v1, nf + (R() - 0.5) * 0.15);
    const [x, y] = P(u, v, z + 0.08 + R() * 0.05), rr = 6 + R() * 3;
    k._lobe(x, y, rr, R() < 0.5 ? "#6c9c4c" : "#7aab55", seed * 31 + i * 7 + (nf > 0.5 ? 3 : 0), { squash: 0.75, bumps: 8 });
    tops.push([x, y, rr]);
  }
  for (const [x, y, r] of tops) for (let j = 0; j < 5; j++) {
    const a = R() * 6.283, d = Math.sqrt(R()) * r * 0.8, fx = x + Math.cos(a) * d, fy = y + Math.sin(a) * d * 0.7, col = cols[Math.floor(R() * cols.length)], pr = 1.6 + R() * 0.9;
    c.fillStyle = col; for (let q = 0; q < 5; q++) { const b = (q / 5) * 6.283; c.beginPath(); c.arc(fx + Math.cos(b) * pr, fy + Math.sin(b) * pr, pr * 0.75, 0, 7); c.fill(); }
    c.fillStyle = "#f6e08a"; c.beginPath(); c.arc(fx, fy, pr * 0.45, 0, 7); c.fill();
  }
}
function pitTree(k, u, v, o) {
  k.ell(u, v, 0.01, 0.3, "#d4bf96", { lw: 0.9 }); k.ell(u, v, 0.02, 0.22, "#7a6648", { lw: 0.6 });
  k.tree(u, v, o);
}

// ---------- river lane loop: out along lane A (+u), U-turn, back along lane B (-u), U-turn ----------
const UL = 2.2, UR = 7.6, VA = 6.75, VB = 8.25, VM = (VA + VB) / 2, RT = (VB - VA) / 2;
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

  // ---------- the facade row (behind everything else) ----------
  k.q(-100, () => BUND.draw(k, t));

  // ---------- quay railing, piers, lamps ----------
  const PX = []; for (let i = 0; i < 8; i++) PX.push(0.55 + i * 1.27);
  PX.forEach((u, i) => {
    if (i < PX.length - 1) {
      const u2 = PX[i + 1], m = (u + u2) / 2;
      k.q(m + RAILV + 0.1, () => railPanel(k, [u + 0.13, RAILV], [m, RAILV]));
      k.q(u2 + RAILV - 0.05, () => railPanel(k, [m, RAILV], [u2 - 0.13, RAILV]));
    }
    k.q(u + RAILV + 0.2, () => { post(k, { u, v: RAILV, eu: 1, ev: 0, wu: 0, wv: 1 }); if (i % 2 === 0) bundLamp(k, u, RAILV, 0.9, i); });
  });

  // ---------- planters, trees, benches ----------
  const TV = 4.45;
  [[1.05, 71, "#79ab52"], [3.6, 72, "#8cb55c"], [8.95, 73, "#79ab52"]].forEach(([u, seed, col]) => k.q(u + TV + 0.1, () => pitTree(k, u, TV, { r: 0.62, h: 1.5, seed, col })));
  [[1.5, 3.0, 3], [5.9, 7.2, 4]].forEach(([u0, u1, seed]) => k.q(u1 + 4.62 + 0.05, () => planter(k, u0, u1, 4.3, 4.62, seed)));
  const benches = [[4.1, 4.3], [7.55, 4.3]];
  benches.forEach(([u, v]) => k.q(u + v + 0.5, () => k.bench(u, v, { along: "u", len: 0.85 })));
  benches.forEach(([u, v], i) => {
    k.qperson(u + 0.28, v + 0.17, { pose: "sit", bench: true, seatZ: 0.2, dir: [0.1, 1], seed: 137 + i });
    k.qperson(u + 0.62, v + 0.17, { pose: "sit", bench: true, seatZ: 0.2, dir: [0.1, 1], seed: 150 + i * 3 });
  });
  k.q(5.45 + 4.45 + 0.1, () => balloonVendor(k, 5.45, 4.45, t));

  // ---------- people ----------
  // one closed promenade loop: east on the back lane, west on the front lane (one direction per lane: no head-on meets)
  const loop = [];
  for (let u = 0.95; u <= 9.1; u += 0.8) loop.push([u, 4.0]);
  loop.push([9.38, 4.12], [9.52, 4.45], [9.38, 4.78]);
  for (let u = 9.1; u >= 0.95; u -= 0.8) loop.push([u, 4.88]);
  loop.push([0.62, 4.78], [0.5, 4.45], [0.62, 4.12]);
  const nW = 11;
  for (let i = 0; i < nW; i++) {
    const seed = 140 + i * 3, o = { loop: true, speed: 0.34, offset: i / nW, seed, ...(i === 3 ? { kid: true } : i === 7 ? { hat: true } : {}) };
    const st = k.walkerState(loop, o);
    k.q(st.u + st.v, () => k.walker(loop, o));
  }
  // at the railing: photographers, a couple, a kid waving at the boats
  [[1.75, "photo", 131], [2.05, "stand", 132], [3.85, "wave", 133, true], [4.15, "stand", 134], [6.45, "photo", 135], [6.8, "stand", 160], [8.65, "cheer", 136]].forEach(([u, pose, seed, kid]) => k.qperson(u, 5.2, { pose, dir: [0.15, 1], seed, ...(kid ? { kid: true } : {}) }));

  // ---------- river traffic (always in front of the promenade) ----------
  const sc = 0.72, v1 = 0.5 * t + 1.6, v2 = v1 + LOOP / 2;
  const A = lanePos(v1), B = lanePos(v2);
  k.q(99, () => { trail(k, lanePos, v1, 0.9, t, 1, 3.4); trail(k, lanePos, v2, 0.7, t, 1, 2.6); });
  const pax1 = [[0.0, -0.38, 301], [0.35, 0.36, 302, "wave"], [0.6, -0.36, 303, "photo"], [0.9, 0.35, 304], [1.2, -0.3, 305, "cheer"], [1.45, 0.25, 306], [0.2, 0.0, 307], [0.75, 0.02, 308, "wave"], [1.55, -0.05, 309]];
  k.q(100 + B.u + B.v, () => ferry(k, B.u, B.v, B.h, t, 1, [[-1.0, -0.2, 321], [-0.6, 0.22, 322, "wave"], [-0.3, -0.18, 323]], 0.8));
  k.q(100 + A.u + A.v, () => cruiser(k, A.u, A.v, A.h, t, 1, pax1, sc));
  k.flush();

  // ---------- sky: gulls over the river, clouds ----------
  const [gx, gy] = P(6.2, 8.2, 5.5);
  k.circlingBird(gx, gy, 70, 22, { speed: 0.55, phase: 0 });
  k.circlingBird(gx, gy, 70, 22, { speed: 0.55, phase: 1.1, size: 0.8 });
  const [hx, hy] = P(2, 2, 11);
  k.circlingBird(hx, hy, 60, 18, { speed: -0.45, phase: 2 });
  k.cloud(160, 250, { s: 0.8, phase: 2 }); k.cloud(860, 150, { s: 0.7, phase: 4 });
}

// close-up framing: the Customs clock tower and the HSBC dome over the promenade
export const camera = { u: 4.6, v: 3.2, z: 4.2, zoom: 1.45 };
