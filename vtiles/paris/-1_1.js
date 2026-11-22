// PARIS · -1,1 · Jardin du Luxembourg (grid pass: everything axis-aligned on P(u,v,z), inside 0.3..9.7)
//   palace range across the back (luxpalace.js), terrace v 0.5-3.6 with stairs, octagonal basin (sides along u and v) centre (5, 6.55),
//   four rectangular parterre lawns beside it, green chairs facing the water, chestnuts along both sides, a walking lane round the basin.
import { P, INK, shade, lerp, rng, hash } from "../../lib/vec-kit.js";
import drawPalace from "./luxpalace.js";
import { scalePoly, pigeon, flock, debugRoutes } from "./_props.js";
import { pedestal, statueFig, chair, topiary, chestnut, sailboat, parterre } from "./_g-1_1.js";

const GRAVEL = "#f0dab6", WATER = "#6fb0b2";
// ---------- basin: regular octagon, four sides along u / v ----------
const CX = 5, CY = 6.55, R = 1.8, CUT = R * 0.41421;
const BASIN = [[CX - CUT, CY - R], [CX + CUT, CY - R], [CX + R, CY - CUT], [CX + R, CY + CUT], [CX + CUT, CY + R], [CX - CUT, CY + R], [CX - R, CY + CUT], [CX - R, CY - CUT]];
const CEN = [CX, CY];
const NB = BASIN.length;
// ---------- lawns (rectangles) and parterres ----------
const LAWNS = [[0.55, 4.0, 1.3, 2.45], [0.55, 6.85, 1.3, 2.45], [8.15, 4.0, 1.3, 2.45], [8.15, 6.85, 1.3, 2.45]];
const lawnPoly = ([u, v, du, dv]) => [[u, v], [u + du, v], [u + du, v + dv], [u, v + dv]];
const PARTERRES = [[1.1, 4.3, 0.7, 1.85, 0], [1.1, 7.15, 0.7, 1.95, 1], [8.2, 4.3, 0.7, 1.85, 2], [8.2, 7.15, 0.7, 1.95, 3]];

const CHAIRS = [[2.0, 4.85, [1, 0]], [2.0, 5.3, [1, 0]], [2.0, 7.55, [1, 0]], [2.0, 8.0, [1, 0]],
  [8.0, 4.85, [-1, 0]], [8.0, 5.3, [-1, 0]], [8.0, 7.55, [-1, 0]], [8.0, 8.0, [-1, 0]],
  [3.8, 9.45, [0, -1]], [6.2, 9.45, [0, -1]]];
const STATUES = [[2.9, 3.95, 1.0], [7.1, 3.95, 1.0], [1.2, 6.65, 1.0], [8.8, 6.65, 1.0], [5.0, 9.4, 1.15]];
const TOPI = [[0.85, 4.25], [0.85, 9.05], [9.15, 4.25], [9.15, 9.05]];
const LAMPS = [[2.15, 6.65], [7.85, 6.65], [3.3, 3.95], [6.7, 3.95]];
const TREES = [[0.7, 4.7, 3, 1], [0.7, 7.2, 4, 1], [0.7, 8.9, 5, 0], [9.3, 4.7, 6, 1], [9.3, 7.2, 7, 1], [9.3, 8.9, 8, 0]];

// kids at the basin rim, pushing toy boats with sticks: [u, v, nu, nv, colour]
const KIDS = [
  [CX - R - 0.22, CY - 0.9, 1, 0], [CX - R - 0.22, CY - 0.05, 1, 0], [CX - R - 0.22, CY + 0.8, 1, 0],
  [CX + R + 0.22, CY - 0.7, -1, 0], [CX + R + 0.22, CY + 0.2, -1, 0], [CX + R + 0.22, CY + 0.9, -1, 0],
  [CX - 0.8, CY + R + 0.22, 0, -1], [CX + 0.5, CY + R + 0.22, 0, -1],
].map(([u, v, nx, ny], i) => ({ u, v, nx, ny, tx: -ny, ty: nx, i, col: ["#d9544b", "#3f6fb8", "#f6f2e6", "#e9c24d"][i % 4] }));
function boatOf(kd, t) {
  const d = 0.5 + 0.26 * Math.sin(t * 0.45 + kd.i * 1.7) + 0.06 * Math.sin(t * 1.1 + kd.i), s = 0.2 * Math.sin(t * 0.33 + kd.i * 2.3);
  return [kd.u + kd.nx * (d + 0.32) + kd.tx * s, kd.v + kd.ny * (d + 0.32) + kd.ty * s, d];
}
const FREE = [{ a: [4.6, 5.7], b: [5.2, 6.5], col: "#e9c24d", ph: 0.2, seed: 11 }, { a: [5.4, 7.2], b: [4.7, 6.8], col: "#3f6fb8", ph: 0.7, seed: 12 }];

// walking lane round the basin, and terrace routes
const LANE = [[3.0, 4.4], [7.0, 4.4], [7.55, 4.95], [7.55, 8.45], [7.0, 8.95], [3.0, 8.95], [2.45, 8.45], [2.45, 4.95]];
const TA = [[1.0, 3.35], [4.0, 3.35]], TB = [[9.0, 3.35], [6.0, 3.35]], TC = [[3.0, 3.15], [7.2, 3.15]];

export const camera = { u: 5, v: 4.6, z: 2.0, zoom: 1.4 };

export default function draw(k, t) {
  const c = k.ctx;
  k.groundTrace({ lawn: LAWNS.map(lawnPoly), water: [] }, { paved: GRAVEL, side: "#e8d6ae", stipple: 9, lawn: "#8fb355", tufts: 8 });
  // raked gravel, axis-aligned
  { c.save(); k._trace([P(0, 0), P(10, 0), P(10, 10), P(0, 10)], true, 0); c.clip(); c.strokeStyle = "rgba(170,130,95,0.13)"; c.lineWidth = 0.7; c.beginPath(); for (let i = 0; i <= 10; i += 0.32) { c.moveTo(...P(i, 0)); c.lineTo(...P(i, 10)); } c.stroke(); c.restore(); }
  // lane edging in darker gravel
  k.ground(LANE.concat([LANE[0]]), null, { stroke: "rgba(160,120,80,0.22)", lw: 7, alpha: 1 });
  drawPalace(k, t);

  // basin: stone rim with a visible wall, then water
  {
    const rimTop = scalePoly(BASIN, 1.035);
    for (let e = 0; e < NB; e++) {
      const a = rimTop[e], b = rimTop[(e + 1) % NB], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      if ((mx - CX) + (my - CY) > 0.01) k.poly([[a[0], a[1], 0], [b[0], b[1], 0], [b[0], b[1], 0.2], [a[0], a[1], 0.2]], "#d8c699", { lw: 1.3, hatch: false });
    }
    k.ground(rimTop, "#efe3c1", { lw: 1.5, z: 0.2 });
    k.ground(scalePoly(BASIN, 0.985), null, { lw: 1, z: 0.2, stroke: "rgba(120,95,55,0.5)" });
  }
  const inner = scalePoly(BASIN, 0.94);
  k.water(inner, { color: WATER, density: 2.4, flow: 0.5, seed: 3, z: 0.02 });
  c.save(); k._trace(inner.map(([u, v]) => P(u, v, 0.02)), true, 0); c.clip();
  { const g = c.createLinearGradient(...P(CX - 2, CY - 2), ...P(CX + 2, CY + 2)); g.addColorStop(0, "rgba(160,140,100,0.30)"); g.addColorStop(0.5, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(30,90,110,0.20)"); c.fillStyle = g; c.fillRect(0, 380, 1024, 520); }
  // palace reflection: soft cream streaks along the far edge
  for (let i = 0; i < 9; i++) { const [x, y] = P(CX - 1.4 + i * 0.35, CY - 1.55 + (i % 3) * 0.12, 0.02); c.fillStyle = `rgba(232,214,164,${0.22 + 0.08 * Math.sin(t * 0.9 + i)})`; c.fillRect(x - 3, y, 6, 10 + (i % 4) * 4); }
  for (let i = 0; i < 12; i++) { const ph = (t * 0.05 + i / 12) % 1; c.strokeStyle = `rgba(255,255,255,${0.4 * Math.sin(ph * Math.PI)})`; c.lineWidth = 2.6; c.lineCap = "round"; c.beginPath(); const [x, y] = P(lerp(CX - 1.6, CX + 1.6, ph), lerp(CY + 1.5, CY - 1.5, (i * 0.37) % 1), 0.02); c.moveTo(x - 14, y); c.lineTo(x + 14, y - 3); c.stroke(); }
  c.restore();
  k.ground(inner, null, { lw: 1.3, z: 0.02 });

  // lawns: clipped hedge borders, then flower parterres
  for (const l of LAWNS.map(lawnPoly)) { k.ground(l, null, { stroke: "#5a8a3a", lw: 5, alpha: 0.9 }); k.ground(l, null, { stroke: "#7fb054", lw: 2.2, alpha: 0.9 }); k.ground(l, null, { lw: 1.1 }); }
  for (const [u, v, du, dv, s] of PARTERRES) parterre(k, u, v, du, dv, s, t);

  // statues, topiary, lamps, chairs, trees (depth sorted)
  STATUES.forEach(([u, v, h], i) => k.q(u + v + 0.3, () => statueFig(k, u, v, h, t, i)));
  for (const [u, v] of TOPI) k.q(u + v, () => topiary(k, u, v));
  for (const [u, v] of LAMPS) k.q(u + v, () => k.lamp(u, v, { col: "#2c4a3c", h: 1.9 }));
  CHAIRS.forEach(([u, v, f]) => k.q(u + v, () => chair(k, u, v, f)));
  for (const [u, v, s, big] of TREES) k.q(u + v + 0.4, () => chestnut(k, u, v, s * 5, big));
  [[3.6, 4.25, 1], [6.3, 4.2, 2], [3.4, 9.1, 3], [6.8, 9.2, 4], [2.6, 6.6, 5], [7.4, 6.5, 6]].forEach(([u, v, s]) => k.q(u + v, () => pigeon(k, u, v, t, s)));

  // seated readers
  CHAIRS.forEach(([u, v, f], s) => k.qperson(u, v, { pose: "sit", seatZ: 0.3, dir: f, seed: 40 + s, bench: true, gesture: s % 3 === 0 }));
  // kids at the rim pushing toy sailboats with sticks
  KIDS.forEach((kd, i) => {
    k.qperson(kd.u, kd.v, { pose: "stand", kid: true, h: 0.62 + (i % 3) * 0.03, dir: [kd.nx, kd.ny], seed: 60 + i, hat: i % 3 === 0 });
    const [bu, bv] = boatOf(kd, t), f = (kd.nx - kd.ny) >= 0 ? 1 : -1;
    k.q(bu + bv + 0.05, () => sailboat(k, bu, bv, f, t, kd.col, i + 1));
    k.q(Math.max(kd.u + kd.v, bu + bv) + 0.1, () => { // the stick: hand -> stern, reaching further as the boat drifts away
      const [hx, hy] = P(kd.u + kd.nx * 0.14, kd.v + kd.ny * 0.14, 0.78), [sx, sy] = P(bu - kd.nx * 0.1, bv - kd.ny * 0.1, 0.06);
      c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(hx, hy); c.lineTo(sx, sy); c.stroke();
      c.strokeStyle = "#b98d56"; c.lineWidth = 1.4; c.stroke();
      c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 1; c.globalAlpha = 0.7; c.beginPath(); c.ellipse(sx, sy + 2, 5 + Math.sin(t * 3 + i) * 1.2, 1.9, 0, 0, 7); c.stroke(); c.globalAlpha = 1;
    });
  });
  // two free boats drifting mid-pond
  for (const b of FREE) {
    const period = 22, tt = (((t + b.ph * period) % period) + period) % period, h = period / 2, ff = tt < h ? tt / h : 1 - (tt - h) / h, s = ff * ff * (3 - 2 * ff);
    const u = lerp(b.a[0], b.b[0], s), v = lerp(b.a[1], b.b[1], s), dx = (b.b[0] - b.a[0]) - (b.b[1] - b.a[1]);
    k.q(u + v + 0.2, () => sailboat(k, u, v, (tt < h ? 1 : -1) * (dx >= 0 ? 1 : -1), t, b.col, b.seed));
  }
  // walkers round the lane (loop), strollers on the terrace behind the balustrade
  const loopW = (pts, n, seed0, sp) => { for (let i = 0; i < n; i++) k.qwalker(pts, { loop: true, mode: "loop", speed: sp, offset: i / n + (seed0 % 5) * 0.01, seed: seed0 + i }); };
  loopW(LANE, 7, 21, 0.36);
  k.qwalker(TA, { speed: 0.3, offset: 0.1, seed: 91, dwell: 2.2, z: 0.28 }); k.qwalker(TB, { speed: 0.3, offset: 0.3, seed: 92, dwell: 2.2, z: 0.28 });
  k.qwalker(TC, { speed: 0.34, offset: 0.55, seed: 93, dwell: 1.4, z: 0.28 });
  // a couple chatting by the stairs, a photographer
  k.qperson(3.75, 4.15, { pose: "stand", dir: [0.6, 0.4], seed: 151 }); k.qperson(4.0, 4.15, { pose: "wave", dir: [-0.6, 0.4], seed: 152 });
  k.qperson(6.2, 4.15, { pose: "photo", dir: [-0.3, -1], seed: 153 });
  debugRoutes(k, [LANE.concat([LANE[0]]), TA, TB, TC], [BASIN]);
  k.flush();
  flock(k, 500, 170, 7, t, 3);
  k.circlingBird(520, 150, 110, 26, { speed: 0.6, phase: 1 });
  k.cloud(180, 150, { s: 0.85, phase: 1 }); k.cloud(850, 140, { s: 0.7, phase: 3 });
}
