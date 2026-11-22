// SHANGHAI · Yu Garden (grid pass): Huxinting teahouse (regular octagon, layered upswept roofs) on its stone deck in the back-centre,
// zigzag bridge in axis-aligned zigs from the front bank, covered corridors along the two back edges, dragon wall along the
// back-right edge (head at its front end), rockery, willows, lotus, koi. Everything lies inside 0.3..9.7 on the grid.
import { P, CTS, INK, shade, mix, lerp, clamp, rng, TILE, RED, RED_D, RED_L, PLASTER, STONE, STONE_D,
  tileFace, ridge3, hook, ringRoof, corridor, taihu, bigWillow, lotusCluster, shrub, blossomTree, fp, fquad, latticePanel, column3, qpt } from "./_t0_-1.js";
import { koi } from "./_props.js";
import { makeHuxinting } from "./huxinting.js";
import { makeDragonWall, makeBridge } from "./_g0_-1.js";

const HUX = makeHuxinting(4.5, 4.5);
const WALL = makeDragonWall({ UA: 5.45, UB: 9.45, V0: 0.45, V1: 0.8 });
const WATER = "#3f9483";
// pond (also runs under the two covered corridors, which stand on the water)
const POND = [[1.5, 0.5], [5.0, 0.5], [5.0, 1.45], [8.1, 1.45], [8.75, 1.7], [8.85, 3.0], [8.7, 4.6], [8.85, 6.2], [8.7, 7.4], [8.3, 8.2], [7.7, 8.65], [6.5, 8.8], [5.0, 8.85], [3.6, 8.8], [2.4, 8.75], [1.5, 8.7], [0.5, 8.7], [0.5, 1.5], [1.5, 1.5]];
const PLAZA = [[7.45, 9.0], [9.5, 9.0], [9.5, 9.6], [7.45, 9.6]];
const WALK = [[5.4, 0.8], [9.5, 0.8], [9.5, 9.0], [9.0, 9.0], [9.0, 1.4], [5.4, 1.4]];
// zigzag bridge centre line: legs alternate along v and along u, ending at the teahouse's +v door
const BR = [[8.6, 9.2], [8.6, 8.6], [7.5, 8.6], [7.5, 7.8], [6.4, 7.8], [6.4, 7.1], [4.5, 7.1], [4.5, 6.55]];
const DZ = 0.6;
const BRIDGE = makeBridge(BR, { BW: 0.62, DZ, DTH: 0.14 });
const shift = (pts, d) => pts.map(([u, v]) => [u + d, v + d]);

// ---------------- ground ----------------
function ground(k, t) {
  const c = k.ctx;
  k.slab("#7fa252", { side: "#d9c9a4" });
  c.save(); k._trace([P(0, 0), P(10, 0), P(10, 10), P(0, 10)], true, 0); c.clip();
  const land = [[0, 0], [10, 0], [10, 10], [0, 10]];
  k.ground(land, "#86a956", { stroke: false }); k.grass(land, { density: 5, seed: 4 });
  // pond: stone rim, water with depth gradient, shimmer
  k.ground(POND, null, { stroke: "#b8ad92", lw: 8 });
  pondWater(k, t, POND);
  // paved walk along the dragon wall and the right bank, hex plaza at the bridge foot
  for (const poly of [WALK, PLAZA]) {
    k.ground(poly, "#e4d8bd", { lw: 1.2 });
    c.save(); k._trace(poly.map(([u, v]) => P(u, v)), true, 0); c.clip();
    c.strokeStyle = "rgba(120,100,70,0.45)"; c.lineWidth = 0.8;
    for (let i = -2; i < 18; i++) for (let j = -2; j < 40; j++) {
      const u = 5.3 + i * 0.26 + (j % 2) * 0.13, v = 0.7 + j * 0.22; const p = [];
      for (let q = 0; q < 6; q++) { const a = (q / 6) * 6.283; p.push(P(u + Math.cos(a) * 0.14, v + Math.sin(a) * 0.12)); }
      c.beginPath(); p.forEach((pp, n) => (n ? c.lineTo(...pp) : c.moveTo(...pp))); c.closePath(); c.stroke();
    }
    c.restore();
  }
  c.restore();
  k.poly([[0, 0, 0], [10, 0, 0], [10, 10, 0], [0, 10, 0]], null, { lw: 1.6 });
}
function pondWater(k, t, poly) {
  const c = k.ctx, P2 = poly.map(([u, v]) => P(u, v, 0));
  c.save(); c.beginPath(); P2.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath();
  const g = c.createLinearGradient(...P(0, 0), ...P(10, 10)); g.addColorStop(0, "#2f7e70"); g.addColorStop(0.5, WATER); g.addColorStop(1, "#4fa391");
  c.fillStyle = g; c.fill(); c.clip();
  // soft light patches + ripple dashes drifting
  const R = rng(21);
  c.fillStyle = "rgba(190,235,215,0.12)";
  for (let i = 0; i < 26; i++) { const [x, y] = P(R() * 10, R() * 10); c.beginPath(); c.ellipse(x, y, 30 + R() * 30, 8 + R() * 6, 0, 0, 7); c.fill(); }
  c.strokeStyle = "rgba(225,250,240,0.7)"; c.lineWidth = 1.2; c.lineCap = "round";
  for (let i = 0; i < 150; i++) {
    const u0 = R() * 10.5 - 0.3, v0 = R() * 10.5 - 0.3, ph = R() * 6.28, sp = 0.6 + R() * 0.6, drift = ((t * 0.08 * sp + R()) % 1) * 0.5;
    const [x, y] = P(u0 + drift, v0 + drift * 0.3, 0); c.globalAlpha = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * 1.5 * sp + ph));
    c.beginPath(); c.moveTo(x - 5, y); c.quadraticCurveTo(x - 2.5, y - 1.8, x, y); c.quadraticCurveTo(x + 2.5, y + 1.8, x + 5, y); c.stroke();
  }
  c.globalAlpha = 1; c.restore();
  k.path(P2, { fill: null, lw: 1.5, wobble: 0 });
}
const KOI = [[7.3, 3.2, 0.9, 0.55, 0.0, "#f08a3c"], [2.9, 6.4, 0.7, 0.9, 1.7, "#f4f0e6"], [7.7, 5.8, 0.55, 1.1, 3.1, "#e0502f"], [6.4, 2.4, 0.5, 0.45, 2.2, "#f4c24a"],
  [7.0, 7.2, 0.5, 0.35, 4.4, "#f08a3c"], [3.8, 8.0, 0.8, 0.35, 5.3, "#f4f0e6"], [2.9, 2.3, 0.5, 0.45, 0.9, "#e0502f"], [6.2, 5.9, 0.45, 0.5, 3.7, "#f08a3c"], [5.8, 2.1, 0.4, 0.3, 2.9, "#f4f0e6"]];
function koiAll(k, t) {
  const c = k.ctx;
  KOI.forEach(([cu, cv, ru, rv, ph, col], i) => {
    const dir = i % 2 ? 1 : -1, a = dir * t * (0.42 + (i % 3) * 0.06) + ph, u = cu + Math.cos(a) * ru, v = cv + Math.sin(a) * rv, du = -Math.sin(a) * ru * dir, dv = Math.cos(a) * rv * dir;
    const [x, y] = P(u, v), [x2, y2] = P(u + du * 0.1, v + dv * 0.1);
    // soft shadow under the fish
    c.fillStyle = "rgba(10,40,35,0.25)"; c.beginPath(); c.ellipse(x + 2, y + 3, 9, 3.5, Math.atan2(y2 - y, x2 - x), 0, 7); c.fill();
    koi(k, x, y, Math.atan2(y2 - y, x2 - x), { s: 1.15, col, ph, spot: col === "#f4f0e6" ? "#e0502f" : "#fff6ea" });
    const rr = (t * 0.8 + ph) % 1; c.save(); c.globalAlpha = 0.3 * (1 - rr); c.strokeStyle = "#fff"; c.lineWidth = 1; c.beginPath(); c.ellipse(x - (x2 - x) * 3, y - (y2 - y) * 3, 4 + rr * 12, (4 + rr * 12) * 0.45, 0, 0, 7); c.stroke(); c.restore();
  });
}
function dragonflies(k, t) {
  const c = k.ctx;
  for (const [cu, cv, ph] of [[2.6, 6.9, 0], [7.8, 2.4, 2.1], [2.0, 3.3, 4.2]]) {
    const a = t * 0.9 + ph, dart = Math.floor(t * 0.7 + ph) * 1.7, u = cu + Math.cos(a + dart) * 0.5, v = cv + Math.sin(a * 1.3 + dart) * 0.4, [x, y] = P(u, v, 1.1 + 0.15 * Math.sin(t * 3 + ph));
    const fl = Math.sin(t * 40 + ph) * 0.5 + 0.5;
    c.strokeStyle = "#1d4f6e"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - 5, y); c.lineTo(x + 4, y); c.stroke();
    c.fillStyle = `rgba(220,240,255,${0.5 + fl * 0.3})`; c.strokeStyle = "rgba(40,60,80,0.6)"; c.lineWidth = 0.5;
    for (const sd of [-1, 1]) { c.beginPath(); c.ellipse(x + 1, y + sd * (2 + fl), 4, 1.3, sd * 0.4, 0, 7); c.fill(); c.stroke(); }
  }
}


// ---------------- people ----------------
const LEFTC = { axis: "v", a0: 1.6, a1: 8.55, cR: 0.45, cF: 1.35, zF: 0.35, H: 2.0, rise: 0.75, cross: [5.6, 7.2], endWall: true, zBase: 0, bay: 0.8 };
const BACKC = { axis: "u", a0: 1.5, a1: 4.95, cR: 0.45, cF: 1.35, zF: 0.35, H: 2.0, rise: 0.75, cross: [2.7, 4.1], endWall: true, zBase: 0, bay: 0.8 };
function corridorPeople(which) {
  return (k, M) => {
    const zF = which.zF;
    const lanes = which === LEFTC
      ? [[0.72, 2.2, 8.0, 0.0, 61], [0.94, 2.4, 8.2, 0.55, 62], [0.82, 2.3, 7.8, 0.3, 66]]
      : [[0.72, 1.9, 4.5, 0.2, 71], [0.97, 2.0, 4.6, 0.7, 72]];
    const items = [];
    for (const [cc, a0, a1, off, seed] of lanes) { const path = [M(a0, cc).slice(0, 2), M(a1, cc).slice(0, 2)]; const st = k.walkerState(path, { speed: 0.32, offset: off, dwell: 2.2 }); items.push([st.u + st.v, () => k.walker(path, { speed: 0.32, offset: off, dwell: 2.2, seed, z: zF })]); }
    const lean = which === LEFTC ? [[1.22, 6.6, 63], [1.22, 4.2, 64]] : [[3.4, 1.22, 73]];
    for (const [u, v, seed] of lean) items.push([u + v, () => k.person(u, v, { z: zF, seed, pose: seed % 2 ? "photo" : "stand", dir: [1, 1] })]);
    items.sort((p, q) => p[0] - q[0]).forEach(([, f]) => f());
  };
}

// shrubs, azaleas and edging stones along the banks
const AZ = [["#f39ac0", "#e8607a", "#ffffff"], ["#f08bb5", "#fbd0df"], ["#e8607a", "#f39ac0"], null, null];
function bankPlanting(k) {
  const R = rng(77);
  const spots = [];
  for (let u = 0.5; u < 7.3; u += 0.42) spots.push([u + (R() - 0.5) * 0.2, 9.2 + R() * 0.45]);
  for (let u = 0.9; u < 7.0; u += 0.6) spots.push([u + (R() - 0.5) * 0.2, 8.95 + R() * 0.12]);
  for (let v = 1.7; v < 8.7; v += 0.5) spots.push([9.6, v + (R() - 0.5) * 0.2]);
  for (let u = 6.0; u < 9.4; u += 0.7) spots.push([u, 0.95 + R() * 0.3]);
  for (const p of [[1.0, 1.0], [0.6, 0.7], [1.2, 0.55], [0.55, 1.3], [5.2, 1.25]]) spots.push(p);
  const keep = [[2.6, 9.25, 0.5], [9.55, 4.3, 0.5], [5.0, 9.3, 0.9], [9.5, 6.7, 0.5], [1.3, 9.35, 0.4], [0.9, 0.95, 0.5], [5.2, 0.75, 0.4], [1.0, 8.95, 0.5]];
  for (const [u, v] of spots) {
    if (keep.some(([a, b, r]) => Math.hypot(u - a, v - b) < r)) continue;
    if (u > 7.35 && v > 8.9 && u < 9.55) continue;
    const r = 0.2 + R() * 0.14, fl = AZ[Math.floor(R() * AZ.length)];
    k.q(u + v + 0.1, () => shrub(k, u, v, r, Math.round(u * 37 + v * 91), fl ? { flowers: fl } : {}));
  }
  for (let i = 0; i < POND.length; i++) {
    const a = POND[i], b = POND[(i + 1) % POND.length];
    if ((a[0] <= 1.55 && b[0] <= 1.55) || (a[1] <= 0.55 && b[1] <= 0.55) || (a[1] <= 1.5 && b[1] <= 1.5 && a[0] <= 5.0 && b[0] <= 5.0)) continue;
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L / 0.3);
    for (let j = 0; j < n; j++) { const f = (j + R() * 0.5) / n, u = lerp(a[0], b[0], f), v = lerp(a[1], b[1], f), s = 4 + R() * 4, col = R() < 0.5 ? "#d9d1bd" : "#c4baa3"; k.q(u + v, () => { const [x, y] = P(u, v, 0.05); const cc = k.ctx; cc.fillStyle = col; cc.strokeStyle = INK; cc.lineWidth = 0.9; cc.beginPath(); cc.ellipse(x, y - s * 0.3, s, s * 0.6, 0, 0, 7); cc.fill(); cc.stroke(); }); }
  }
}

export const camera = { u: 4.8, v: 4.7, z: 3.0, zoom: 1.7 };

export default function draw(k, t) {
  const c = k.ctx;
  ground(k, t);
  // water life (under everything that stands), clipped to the pond
  c.save(); c.beginPath(); POND.forEach(([u, v], i) => { const p = P(u, v, 0); i ? c.lineTo(...p) : c.moveTo(...p); }); c.closePath(); c.clip();
  koiAll(k, t);
  BRIDGE.ripples(k, t);
  for (const [u, v, n, s, sp] of [[2.0, 3.3, 14, 1, 0.45], [2.5, 7.5, 16, 2, 0.5], [2.0, 5.0, 8, 3, 0.35], [7.9, 2.2, 14, 4, 0.5], [8.0, 4.6, 10, 5, 0.4], [7.0, 6.6, 9, 6, 0.4], [3.7, 2.1, 6, 7, 0.3], [8.1, 7.0, 8, 8, 0.4], [2.0, 8.2, 7, 9, 0.35]]) lotusCluster(k, u, v, n, s, { spread: sp });
  c.restore();

  // ---------- back layer: trees behind the galleries, dragon wall ----------
  k.tree(0.9, 0.95, { r: 0.8, h: 1.9, seed: 6, col: "#86b052" });
  blossomTree(k, 5.2, 0.75, 0.6, 1.9, 8);
  WALL.draw(k, t);
  // rockery in the back gap and island rocks in the pond
  k.q(6.3, () => { taihu(k, 5.2, 1.2, 1.4, 0.9, 21); });
  k.q(10.8, () => { taihu(k, 7.4, 3.4, 1.6, 1.0, 22); taihu(k, 7.0, 3.9, 0.8, 0.6, 24); });
  // galleries
  k.q(4.2, () => corridor(k, t, { ...BACKC, people: corridorPeople(BACKC) }));
  k.q(5.5, () => corridor(k, t, { ...LEFTC, people: corridorPeople(LEFTC) }));
  k.q(9.6, () => HUX.draw(k, t));
  BRIDGE.draw(k);

  // ---------- banks: rocks, willows, shrubs ----------
  k.q(10.0, () => { taihu(k, 1.0, 8.95, 1.2, 0.8, 23); shrub(k, 1.5, 9.1, 0.3, 8, { flowers: ["#f39ac0", "#ffffff"] }); });
  k.q(11.9, () => bigWillow(k, 2.6, 9.25, 2.3, 1.0, 31, { lean: 12 }));
  k.q(10.65, () => { k.tree(1.3, 9.35, { r: 0.65, h: 1.7, seed: 3, col: "#8ab456" }); });
  k.q(14.3, () => { taihu(k, 5.0, 9.3, 2.0, 1.3, 25, { holes: 9 }); });
  k.q(15.6, () => { shrub(k, 6.4, 9.5, 0.4, 13, { flowers: ["#f39ac0", "#e8607a", "#ffffff"] }); shrub(k, 3.9, 9.5, 0.36, 14, { flowers: ["#f08bb5"] }); });
  k.q(13.9, () => bigWillow(k, 9.55, 4.3, 2.2, 0.95, 32, { lean: -10 }));
  k.q(16.2, () => { taihu(k, 9.5, 6.7, 1.5, 0.9, 27, { holes: 7 }); });
  k.q(10.5, () => { shrub(k, 9.6, 1.5, 0.34, 15); shrub(k, 9.6, 2.7, 0.32, 16, { flowers: ["#f08bb5", "#ffffff"] }); });
  k.q(18.6, () => { shrub(k, 9.2, 9.65, 0.3, 21, { flowers: ["#e8607a"] }); shrub(k, 7.6, 9.62, 0.3, 22); });
  bankPlanting(k);

  // ---------- life: bridge, plaza, wall walk ----------
  const lanes = [-0.17, -0.06, 0.06, 0.17].map((d) => shift(BR, d));
  const specs = [[0, 0.0, 81, 0.36], [1, 0.42, 82, 0.4], [2, 0.18, 83, 0.34], [3, 0.7, 84, 0.38]];
  for (const [li, off, seed, sp] of specs) k.qwalker(lanes[li], { speed: sp, offset: off, seed, dwell: 1.8, z: DZ });
  const couple = BR.slice(0, 5);
  k.qwalker(shift(couple, -0.1), { speed: 0.3, offset: 0.1, seed: 91, dwell: 2.4, z: DZ, hat: "sunhat" });
  k.qwalker(shift(couple, 0.1), { speed: 0.3, offset: 0.1, seed: 92, dwell: 2.4, z: DZ });
  k.qperson(9.2, 9.35, { pose: "photo", dir: [-1, -1], seed: 95 });
  k.qwalker([[7.8, 9.35], [9.3, 9.35]], { speed: 0.3, offset: 0.5, seed: 96, dwell: 2.0 });
  k.q(17.9, () => { k.box(8.32, 9.34, 0, 0.56, 0.12, 0.45, "#ddd1b6", { hatch: false, shadow: false, top: "#eee6d2" }); k.box(8.32, 9.46, 0, 0.56, 0.12, 0.3, "#ddd1b6", { hatch: false, shadow: false, top: "#eee6d2" }); k.box(8.32, 9.58, 0, 0.56, 0.12, 0.15, "#ddd1b6", { hatch: false, shadow: false, top: "#eee6d2" }); });
  k.qperson(6.3, 7.95, { z: DZ, pose: "photo", dir: [-1, -1], seed: 93 });
  k.qperson(4.3, 7.3, { z: DZ, pose: "wave", dir: [-1, 0.3], seed: 94, kid: true, scale: 0.5 });
  // strollers on the walk under the dragon wall and down the right bank
  k.qwalker([[5.9, 1.1], [8.9, 1.1]], { speed: 0.3, offset: 0.2, seed: 97, dwell: 2.2 });
  k.qwalker([[6.6, 1.2], [9.2, 1.2]], { speed: 0.26, offset: 0.65, seed: 98, dwell: 2.6 });
  k.qwalker([[9.25, 1.8], [9.25, 8.4]], { speed: 0.34, offset: 0.4, seed: 99, dwell: 2.0 });
  k.qperson(9.2, 2.6, { pose: "photo", dir: [-1, 0.2], seed: 100 });
  k.flush();
  dragonflies(k, t);
  k.circlingBird(470, 190, 80, 20, { speed: 0.55, phase: 0 }); k.circlingBird(720, 170, 60, 16, { speed: -0.45, phase: 2 });
}
