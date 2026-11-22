// LONDON · -1,1 · The Shard & City Skyline (grid pass: every solid through P(u,v,z), inside the 10x10 footprint)
// Layout (u,v):  back row, three podiums with the towers on them:
//   Walkie-Talkie  podium u 0.5-2.8  v 2.0-4.1, tower base u 0.8-2.2 v 2.3-3.7 (widens to the roof, ribs on L and R faces)
//   The Shard      podium u 4.0-6.8  v 0.6-3.4, base 2.2 x 2.2 centred (5.4,2.0), 11 units tall, splintered top
//   Gherkin        podium u 7.1-9.5  v 0.4-2.8, plates centred (8.3,1.6)
//   office blocks  B1 u 0.5-1.9 v 4.5-5.9 (crane), B2 u 7.7-9.5 v 3.9-5.2 (crane)
//   front half     plaza: fountain (6.4,7.0), glass café pavilion u 0.5-3.8 v 6.75-9.2, plane trees, commuters
import { P, CTS, INK, shade, lerp, clamp, rng, hash } from "../../lib/vec-kit.js";
import { keepOut, dense } from "./_props.js";
import { umbrellaOver } from "./_props_d.js";
import { makeShard, makeGherkin, makeWalkie, drawCrane } from "./shard.js";
import { CAFE, FOUNT, fountain, cafe, planter, pigeon } from "./_g-1_1.js";

export const camera = { u: 5.2, v: 3.2, z: 5.2, zoom: 1.05 };

const SHARD = makeShard(5.4, 2.0, 0.5, 1.1, 11);
const GHERKIN = makeGherkin(8.3, 1.6, 0.35, 7.0, 1.05);
const WALKIE = makeWalkie(0.8, 2.3, 1.4, 1.4, 0.5, 5.4, 0.42);

const B1 = { u: 0.5, v: 4.5, du: 1.4, dv: 1.4, h: 1.7, col: "#b9b0a2", seed: 3 };
const B2 = { u: 7.7, v: 3.9, du: 1.8, dv: 1.3, h: 1.45, col: "#c3bbae", seed: 8 };
const TREES = [[4.2, 4.9], [6.3, 4.8], [7.6, 5.9], [9.2, 6.3], [4.5, 9.3], [8.9, 9.2], [9.2, 7.8]];
const BENCHES = [[4.9, 4.2, "u"], [5.3, 9.4, "u"], [3.6, 5.5, "u"], [8.2, 6.2, "u"]];
const KEEP = [[FOUNT[0], FOUNT[1], FOUNT[2] + 0.55], ...TREES.map(([u, v]) => [u, v, 0.55]), [CAFE.u0 + CAFE.du / 2, CAFE.v0 + CAFE.dv / 2, 2.3], [B1.u + B1.du / 2, B1.v + B1.dv / 2, 1.3], [B2.u + B2.du / 2, B2.v + B2.dv / 2, 1.3]];
const ROUTES = {
  A: keepOut(dense([[4.7, 4.5], [4.8, 6.2], [4.9, 8.2], [5.0, 9.4]]), KEEP),
  B: keepOut(dense([[4.0, 9.5], [6.0, 9.5], [8.0, 9.4], [9.4, 8.6], [9.5, 6.8]]), KEEP),
  C: keepOut(dense([[4.0, 5.2], [4.2, 6.2], [4.2, 7.4], [4.2, 8.6]]), KEEP),
  D: keepOut(dense([[5.2, 5.5], [7.0, 5.7], [8.6, 5.7], [9.4, 6.4]]), KEEP),
  E: keepOut(dense([[8.5, 7.6], [8.7, 8.7], [7.6, 9.4]]), KEEP),
  F: keepOut(dense([[0.6, 6.25], [2.5, 6.25], [3.8, 6.25]]), KEEP),
  G: keepOut(dense([[2.6, 4.4], [3.9, 4.4], [3.9, 5.6]]), KEEP),
  H: keepOut(dense([[3.5, 4.0], [5.5, 4.0], [7.3, 4.0]]), KEEP),
  I: keepOut(dense([[2.5, 5.6], [2.5, 6.2]]), KEEP),
};
const UMB = ["#d9524a", "#3f6fb0", "#e9892f", "#d9524a", "#3f6fb0"];

function pavement(k) {
  const c = k.ctx;
  c.strokeStyle = "rgba(120,95,60,0.28)"; c.lineWidth = 0.8; c.beginPath();
  for (let a = 0; a <= 10; a += 0.7) { c.moveTo(...P(a, 0, 0)); c.lineTo(...P(a, 10, 0)); c.moveTo(...P(0, a, 0)); c.lineTo(...P(10, a, 0)); }
  c.stroke();
  const R = rng(5); c.fillStyle = "rgba(255,255,255,0.18)";
  for (let i = 0; i < 70; i++) { const [x, y] = P(0.4 + R() * 9.2, 0.4 + R() * 9.2, 0); c.beginPath(); c.ellipse(x, y, 7 + R() * 9, 2.5 + R() * 3, 0, 0, 7); c.fill(); }
}

// ---------- low blocks (axis-aligned boxes with window grids) ----------
function podium(k, u, v, du, dv, h, col, seed) {
  k.box(u, v, 0, du, dv, h, col, { hatch: false, top: shade(col, 0.1) });
  k.windows(u, v, 0, du, dv, h, { side: "L", rows: Math.max(1, Math.round(h * 1.5)), cols: Math.round(du * 2.2), color: "#8fb0c4", lit: 0.5, seed, mx: 0.12, my: 0.12, w: 0.8, h: 0.6 });
  k.windows(u, v, 0, du, dv, h, { side: "R", rows: Math.max(1, Math.round(h * 1.5)), cols: Math.round(dv * 2.2), color: "#7898ae", lit: 0.5, seed: seed + 3, mx: 0.12, my: 0.12, w: 0.8, h: 0.6 });
}
function plinth(k, u, v, du, dv, h, col) {
  k.box(u, v, 0, du, dv, h, col, { hatch: false, shadow: false, top: shade(col, 0.1) });
  const c = k.ctx; c.strokeStyle = "rgba(120,100,70,0.3)"; c.lineWidth = 0.8; c.beginPath();
  for (let a = u + 0.4; a < u + du; a += 0.4) { c.moveTo(...P(a, v, h)); c.lineTo(...P(a, v + dv, h)); }
  for (let a = v + 0.4; a < v + dv; a += 0.4) { c.moveTo(...P(u, a, h)); c.lineTo(...P(u + du, a, h)); }
  c.stroke();
}
function rooftop(k, b) { k.box(b.u + 0.2, b.v + 0.25, b.h, 0.45, 0.4, 0.28, "#9aa4a8", { hatch: false, shadow: false }); }
function bench(k, u, v) { k.bench(u, v, { along: "u" }); }

export default function draw(k, t) {
  const c = k.ctx;
  k.slab("#dcc9a6");
  pavement(k);
  k.ground([[0.4, 4.2], [9.6, 4.2], [9.6, 9.6], [0.4, 9.6]], "rgba(226,208,170,0.5)", { stroke: false });
  k.ground([[FOUNT[0] - 1.9, FOUNT[1] - 1.9], [FOUNT[0] + 1.9, FOUNT[1] - 1.9], [FOUNT[0] + 1.9, FOUNT[1] + 1.9], [FOUNT[0] - 1.9, FOUNT[1] + 1.9]], "#ece0c4", { lw: 1.1, wobble: 0 });

  // ---------- skyline (back row) ----------
  k.q(1.5, () => plinth(k, 0.5, 2.0, 2.3, 2.1, 0.5, "#d8cdb8"));
  k.q(2.5, () => plinth(k, 4.0, 0.6, 2.8, 2.8, 0.5, "#d8cdb8"));
  k.q(3.5, () => plinth(k, 7.1, 0.4, 2.4, 2.4, 0.35, "#d8cdb8"));
  k.q(5.0, () => WALKIE.draw(k, t));
  k.q(7.4, () => SHARD.draw(k, t));
  k.q(9.6, () => GHERKIN.draw(k, t));
  k.q(B1.u + B1.du + B1.v + B1.dv - 0.3, () => { podium(k, B1.u, B1.v, B1.du, B1.dv, B1.h, B1.col, B1.seed); rooftop(k, B1); drawCrane(k, t, B1.u + 0.95, B1.v + 0.75, B1.h + 0.28, 2.6, 0.0, { jib: 1.15, cw: 0.4 }); });
  k.q(B2.u + B2.du + B2.v + B2.dv - 0.3, () => { podium(k, B2.u, B2.v, B2.du, B2.dv, B2.h, B2.col, B2.seed); rooftop(k, B2); drawCrane(k, t, B2.u + 0.8, B2.v + 0.65, B2.h + 0.28, 2.3, 2.4, { jib: 1.0, cw: 0.38, load: "#4a7fb0" }); });

  // ---------- plaza ----------
  for (const [u, v] of TREES) k.q(u + v + 0.3, () => k.tree(u, v, { r: 0.55, h: 1.5, seed: Math.round(u * 9), col: "#9bbf55" }));
  k.q(FOUNT[0] + FOUNT[1] + 0.4, () => fountain(k, t));
  for (const [u, v] of BENCHES) k.q(u + v + 0.4, () => bench(k, u, v));
  k.q(CAFE.u0 + CAFE.du + CAFE.v0 + CAFE.dv, () => cafe(k, t));
  k.q(13.0, () => planter(k, 3.9, 9.1)); k.q(10.3, () => planter(k, 4.0, 6.3)); k.q(14.0, () => planter(k, 9.0, 5.4));

  // seated readers on benches
  k.q(4.9 + 4.2 + 0.7, () => k.person(5.25, 4.4, { pose: "sit", bench: true, seatZ: 0.26, dir: [0.1, 1], seed: 141 }));
  k.q(5.3 + 9.4 + 0.7, () => k.person(5.7, 9.58, { pose: "sit", bench: true, seatZ: 0.26, dir: [0.1, 1], seed: 142 }));

  // commuters with umbrellas and briefcases
  const spec = [["A", 0.0, 21, 0], ["A", 0.5, 22, 1], ["B", 0.1, 23, 2], ["B", 0.6, 24, 3], ["C", 0.3, 25, -1], ["D", 0.2, 26, 4], ["D", 0.7, 27, -1], ["E", 0.4, 28, -1], ["F", 0.2, 29, 0], ["G", 0.5, 30, -1], ["H", 0.3, 31, 1], ["H", 0.8, 33, -1], ["I", 0.5, 34, 2], ["E", 0.9, 32, 2]];
  for (const [r, off, seed, um] of spec) {
    const path = ROUTES[r], o = { speed: 0.42 + (seed % 5) * 0.03, offset: off, seed, dwell: 1.2 + (seed % 3) * 0.6, bag: true, bagCol: "#6a4a30" };
    const s = k.walkerState(path, o);
    k.q(s.u + s.v, () => { const p = k.walker(path, o); if (um >= 0) umbrellaOver(c, p, UMB[um % UMB.length], t); });
  }
  k.qperson(8.3, 7.0, { pose: "stand", dir: [-1, 0.3], seed: 151 });
  k.qperson(8.3, 7.65, { pose: "wave", dir: [-1, -0.3], seed: 152 });
  k.qperson(2.9, 9.55, { pose: "photo", dir: [0.3, -1], seed: 153 });
  for (let i = 0; i < 3; i++) k.q(8 + i, () => pigeon(k, 6.9 + i * 0.5 + Math.sin(t * 0.8 + i) * 0.1, 5.4 + (i % 2) * 0.35, { phase: i * 2 }));
  k.flush();

  // ---------- sky ----------
  k.circlingBird(520, 330, 90, 28, { speed: 0.7, phase: 0 });
  k.circlingBird(520, 330, 90, 28, { speed: 0.7, phase: 0.6, size: 0.8 });
  k.cloud(200, 170, { s: 0.8, phase: 1 });
  k.cloud(820, 130, { s: 0.7, phase: 3 });
}
