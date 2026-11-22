// LONDON · 1,1 · Covent Garden Piazza (grid pass). Market hall as an axis-aligned building across the back
// (u 0.8-9.2, v 0.6-3.3): arcaded left face with a Tuscan portico + pediment, glazed iron vault over the nave,
// slate mansard end pavilions with dormers and chimneys. Cobbled piazza in front with two stalls, cafe tables,
// the juggler and his ring of spectators, lamps, tubs and a pillar box. Everything inside 0.3..9.7.
import { P, INK, lerp } from "../../lib/vec-kit.js";
import { makeHall } from "./coventgarden.js";
import { cobbles, victorianLamp, tub, plantedTree, flowerStall, potteryStall, bucket, cafeTable, drawDiner, parasol, clubs, postBox, pigeon, keepOut, dense } from "./_g1_1.js";

export const camera = { u: 5, v: 5.0, z: 1.6, zoom: 1.45 };

const HALL = makeHall();
const J = [5.0, 6.9];
const FS = { u0: 0.7, v0: 5.2, v1: 7.6 };          // flower stall (axis along v)
const PS = { u0: 7.6, u1: 9.2, v0: 6.9, v1: 8.0 };  // pottery stall (axis along u)
const TABLES = [
  { u: 3.2, v: 4.6, seats: [[-0.5, 0.0, [1, 0.1]], [0.5, 0.1, [-1, 0.2]]], seed: 441 },
  { u: 2.2, v: 4.4, seats: [[-0.1, 0.5, [0.2, -1]], [0.15, -0.5, [-0.1, 1]]], seed: 442 },
  { u: 7.0, v: 4.75, seats: [[-0.5, 0.0, [1, 0.1]], [0.45, 0.2, [-0.8, 0.5]]], seed: 443, umbrella: "#d94a44" },
  { u: 8.0, v: 4.9, seats: [[-0.45, 0.1, [1, 0.2]], [0.45, 0.05, [-0.8, 0.5]]], seed: 445 },
];
const RING = [
  [3.9, 6.2, "clap", 461, 0], [3.85, 7.25, "clap", 462, 0], [4.4, 8.05, "cheer", 463, 1], [5.55, 8.2, "clap", 464, 0],
  [6.4, 7.7, "clap", 465, 0], [6.5, 6.7, "clap", 466, 0], [6.0, 5.8, "cheer", 468, 0], [4.3, 5.8, "clap", 467, 0],
];
const SEATED_KIDS = [[5.25, 7.75, 471], [5.65, 7.55, 472]];
const toJ = (u, v) => { const du = J[0] - u, dv = J[1] - v, L = Math.hypot(du, dv) || 1; return [du / L, dv / L]; };

export default function draw(k, t) {
  const c = k.ctx;
  k.groundTrace({ lawn: [], water: [] }, { paved: "#e8d6b8", side: "#e8d6b0", stipple: 2 });
  cobbles(k);

  // ---------- the hall ----------
  k.q(0, () => HALL.body(k, t));
  for (const u of HALL.columns) k.q(u + 3.95, () => HALL.column(k, t, u));
  k.q(5 + 3.9, () => HALL.lanterns(k, t));
  k.q(6 + 4.2, () => HALL.pediment(k, t));

  // portico tubs with tall flowers
  k.q(3.55 + 4.2, () => tub(k, 3.55, 4.2, 411, 1.2, true));
  k.q(6.35 + 4.15, () => tub(k, 6.35, 4.15, 412, 1.2, true));

  // ---------- trees, lamps, post box ----------
  k.q(0.85 + 4.6, () => plantedTree(k, 0.85, 4.6, 401, "#8fb35a", 0.6, 1.7));
  k.q(9.25 + 4.6, () => plantedTree(k, 9.25, 4.6, 402, "#8fb35a", 0.6, 1.7));
  k.q(0.85 + 4.6 + 0.7, () => tub(k, 0.9, 5.0, 413, 0.9));
  k.q(9.2 + 5.1, () => tub(k, 9.2, 5.2, 414, 0.9));
  k.q(8.9 + 9.1, () => plantedTree(k, 8.9, 9.1, 403, "#9bbd5a", 0.5, 1.0));
  k.q(8.9 + 9.1 + 0.5, () => tub(k, 8.55, 9.15, 415, 0.9));
  k.q(1.6 + 4.3, () => victorianLamp(k, 1.6, 4.3, 2.3));
  k.q(8.5 + 4.3, () => victorianLamp(k, 8.5, 4.3, 2.3));
  k.q(2.5 + 7.9, () => victorianLamp(k, 2.5, 7.95, 1.7));
  k.q(7.4 + 8.9, () => postBox(k, 7.4, 8.9));

  // ---------- flower stall (left) ----------
  { const s = flowerStall(k, FS.u0, FS.v0, FS.v1, t), mid = (FS.v0 + FS.v1) / 2;
    k.q(FS.u0 + mid - 0.5, s.back);
    k.q(FS.u0 + 1.0 + FS.v1 + 0.3, () => k.person(FS.u0 + 1.0, FS.v1 + 0.3, { pose: "stand", dir: [0.5, -0.8], seed: 431, top: "#e9dcc4", hat: null }));
    k.q(FS.u0 + mid + 0.1, s.front);
    ["sun", "mix", "lav", "mix", "sun"].forEach((kind, i) => { const v = FS.v0 + 0.35 + i * 0.5; k.q(FS.u0 + 1.55 + v, () => bucket(k, FS.u0 + 1.55, v, 420 + i, kind)); });
    k.q(FS.u0 + 1.5 + FS.v1 + 0.3, s.awning);
    k.q(2.9 + 6.5, () => k.person(2.85, 6.5, { pose: "stand", dir: [-1, 0.1], seed: 435, top: "#3f6fa8" }));
  }
  // ---------- pottery stall (right) ----------
  { const s = potteryStall(k, PS.u0, PS.u1, PS.v0, PS.v1), mid = (PS.u0 + PS.u1) / 2;
    k.q(mid + PS.v0 - 0.1, s.back);
    k.q(mid + PS.v0 + 0.3, () => k.person(mid + 0.1, PS.v1 - 0.95, { pose: "stand", dir: [0.1, 1], seed: 432, top: "#7a5ea8", hat: "cap" }));
    k.q(mid + PS.v1 - 0.1, s.front);
    k.q(mid + PS.v1 + 0.2, s.awning);
    k.q(PS.u0 - 0.35 + 8.1, () => k.person(PS.u0 - 0.35, 8.1, { pose: "stand", dir: [0.6, -0.7], seed: 436, top: "#d9544b" }));
  }

  // ---------- cafe tables + diners ----------
  for (const T of TABLES) {
    k.q(T.u + T.v, () => { cafeTable(k, T.u, T.v, T.seats, t, T.seed); });
    // chairs + diners sorted individually
    T.seats.forEach(([du, dv, dir], i) => { const s = { u: T.u + du, v: T.v + dv, dir, i }; k.q(s.u + s.v + (dv > 0 ? 0.2 : 0.05), () => drawDiner(k, s, T.seed, t)); });
    if (T.umbrella) k.q(T.u + T.v + 2.5, () => parasol(k, T.u, T.v, 1.45, 0.7, T.umbrella));
  }

  // ---------- the juggler (faces the viewer) with a ring of clapping spectators ----------
  k.q(J[0] + J[1] + 0.4, () => {
    const [bx, by] = P(J[0] + 0.85, J[1] - 0.4, 0); c.fillStyle = "#6b4325"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.roundRect(bx - 9, by - 6, 18, 7, 2); c.fill(); c.stroke(); c.fillStyle = "#e9c24d"; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(bx - 6 + i * 3, by - 6, 1, 0, 7); c.fill(); }
    k.person(J[0], J[1], { pose: "cheer", dir: [1, 1], seed: 451, top: "#c63a32", bottom: "#a8864a", hat: "beret", hatCol: "#2a2420", style: "tee" });
    const [x, y] = P(J[0], J[1], 0); clubs(k, x, y, t);
  });
  for (const [u, v, pose, seed, kid] of RING) k.qperson(u, v, { pose, dir: toJ(u, v), seed, kid: !!kid, hat: seed === 464 ? "sunhat" : undefined });
  for (const [u, v, seed] of SEATED_KIDS) k.qperson(u, v, { pose: "sitground", dir: toJ(u, v), seed, kid: true });

  // ---------- passers-by ----------
  const KEEP = [[...J, 0.75], [2.2, 6.4, 0.7], [8.4, 7.4, 0.9], [3.3, 4.6, 0.95], [2.2, 4.4, 0.7], [7.0, 4.75, 0.95], [8.0, 4.9, 0.9], [2.5, 7.95, 0.3], [7.4, 8.9, 0.45], [8.7, 9.1, 0.6], [3.55, 4.2, 0.4], [6.35, 4.15, 0.4], ...RING.map(([u, v]) => [u, v, 0.4]), ...SEATED_KIDS.map(([u, v]) => [u, v, 0.35])];
  const mk = (pts) => keepOut(dense(pts), KEEP);
  const routes = [
    mk([[5.0, 4.5], [5.0, 5.3], [3.3, 5.35], [3.3, 7.0], [3.3, 8.7]]),
    mk([[5.2, 4.5], [5.2, 5.3], [7.0, 5.4], [7.0, 7.0], [7.0, 8.7]]),
    mk([[1.4, 8.85], [3.4, 8.85], [5.4, 8.85], [7.4, 8.85]]),
    [[4.45, 3.65], [5.55, 3.65]],
    [[5.6, 3.62], [4.4, 3.62]],
    mk([[1.7, 8.2], [1.7, 7.9], [2.4, 8.45]]),
  ];
  const wspec = [[0, 0.0, 481], [0, 0.55, 483], [1, 0.1, 484], [1, 0.62, 485], [2, 0.2, 486], [2, 0.7, 489], [3, 0.1, 490], [4, 0.4, 491]];
  for (const [r, off, seed] of wspec) k.qwalker(routes[r], { speed: 0.4 + (seed % 5) * 0.03, offset: off, seed, dwell: 1.2 + (seed % 3) * 0.6, kid: seed === 489 });
  for (let i = 0; i < 4; i++) { const u = [1.6, 2.1, 6.3, 6.7][i], v = [8.6, 8.9, 8.45, 8.7][i]; k.q(u + v, () => pigeon(k, u + Math.sin(t * 0.5 + i) * 0.15, v, { phase: i * 1.7 })); }
  k.flush();

  k.circlingBird(520, 190, 110, 30, { speed: 0.6, phase: 0 }); k.circlingBird(520, 190, 110, 30, { speed: 0.6, phase: 0.7, size: 0.8 }); k.circlingBird(380, 120, 60, 20, { speed: -0.5, phase: 2 });
  k.cloud(250, 150, { s: 0.8, phase: 1 }); k.cloud(820, 130, { s: 0.7, phase: 3 });
}
