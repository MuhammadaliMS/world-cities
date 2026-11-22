// LONDON · Hyde Park & Serpentine (grid pass). Everything is laid out in (u,v) inside 0.5..9.5 and projected with P().
// Bandstand = regular octagon (sides along u and v) at (3.3,2.6) with the seven-piece band. The Serpentine is one long
// banana-shaped lake curving across the front half (centre line below), ringed by a sand promenade; sand riding track with
// white rail along the u = 8..9.4 edge (horse + rider loop inside it); rowing boats and swans on closed loops that follow the lake.
import { P, INK, shade, lerp, clamp, rng, chaikin, makeLine, ribbonVar, offsetPoly, makeLoop, distToPoly, inPoly, rail,
  oak, bandstand, rowingBoat, swanGlide, newspaper, reeds2, lily2 } from "./_g0_1.js";
import { pigeon } from "./_props.js";
import { deckchair, horse, dog } from "./_props_c.js";

export const camera = { u: 4.5, v: 4.3, z: 0.9, zoom: 1.7 };

// ---------- layout ----------
const BAND = [3.3, 2.6];
const CL = chaikin([[2.0, 4.9], [2.5, 6.1], [3.7, 6.9], [5.4, 7.15], [6.9, 6.7], [7.5, 5.8]], 3);
const LINE = makeLine(CL);
const HW = (f) => 0.28 + 0.5 * Math.pow(Math.sin(Math.PI * f), 0.7) + 0.04 * Math.sin(f * 17);
const LAKE = chaikin(ribbonVar(LINE, HW, 18), 1, true); // 76 points, so every ground polygon stays inside the audit's projection window
const SAND_OUT = offsetPoly(LAKE, 0.85), SAND_IN = offsetPoly(LAKE, 0.72), BANK = offsetPoly(LAKE, 0.1);
const RING_PTS = (() => { const p = offsetPoly(LAKE, 0.5), o = []; for (let i = 0; i < p.length; i += 3) o.push(p[i]); return o; })();
const RING_REV = [...RING_PTS].reverse();
const TRK = { u0: 8.0, u1: 9.35, v0: 0.95, v1: 4.5 };
const R_RIDE = chaikin([[8.45, 1.45], [8.95, 1.45], [8.95, 4.0], [8.45, 4.0]], 3, true);
const R_AVE = [[5.1, 2.65], [7.7, 2.65]];
const R_SPUR = [[3.95, 3.7], [4.55, 5.5]];

// ---------- water traffic: closed loops that follow the centre line (never pop, never leave the lake) ----------
function lakeLoop(a, b, d) {
  const pts = [];
  for (let i = 0; i <= 14; i++) pts.push(LINE.at(lerp(a, b, i / 14), d));
  for (let i = 14; i >= 0; i--) pts.push(LINE.at(lerp(a, b, i / 14), -d));
  return makeLoop(chaikin(pts, 3, true));
}
const BOATS = [
  { lp: lakeLoop(0.15, 0.42, 0.27), sp: 0.34, ph: 0.0, top: "#f0e6d0", pcol: "#d9a0b4", hat: "#6d4b2a" },
  { lp: lakeLoop(0.47, 0.66, 0.24), sp: 0.3, ph: 0.4, top: "#e7e0cf", pcol: "#e4b0b8", hat: "#4a3a2a" },
  { lp: lakeLoop(0.76, 0.92, 0.12), sp: 0.3, ph: 0.7, top: "#f3ead4", pcol: "#cfa7c4", hat: "#3a3a44" },
];
const SWANS = [
  { lp: lakeLoop(0.07, 0.17, 0.1), sp: 0.16, ph: 0.0 }, { lp: lakeLoop(0.07, 0.17, 0.1), sp: 0.16, ph: 0.12 },
  { lp: lakeLoop(0.42, 0.5, 0.12), sp: 0.15, ph: 0.5 }, { lp: lakeLoop(0.69, 0.74, 0.08), sp: 0.15, ph: 0.2 },
];
export const _check = () => {
  const bad = [];
  for (const [nm, arr] of [["boat", BOATS], ["swan", SWANS]]) arr.forEach((b, i) => { for (let s = 0; s < 80; s++) { const r = b.lp.state(s / 80); const d = distToPoly(LAKE, r.u, r.v); if (!inPoly(LAKE, r.u, r.v) || d < (nm === "boat" ? 0.3 : 0.12)) bad.push([nm, i, s, r.u.toFixed(2), r.v.toFixed(2), d.toFixed(2)]); } });
  const ext = (poly) => poly.reduce((a, [u, v]) => [Math.min(a[0], u), Math.max(a[1], u), Math.min(a[2], v), Math.max(a[3], v)], [9, 0, 9, 0]);
  return { bad, lake: ext(LAKE), sand: ext(SAND_OUT) };
};

function picnic(k, u, v, t, people, cloth, ph = 0) {
  const c = k.ctx;
  k.poly([[u - 0.7, v - 0.5, 0.02], [u + 0.7, v - 0.5, 0.02], [u + 0.7, v + 0.5, 0.02], [u - 0.7, v + 0.5, 0.02]], cloth, { lw: 1.2, wobble: 0 });
  c.strokeStyle = "rgba(255,255,255,0.55)"; c.lineWidth = 1; for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(...P(u - 0.7 + i * 0.28, v - 0.5, 0.03)); c.lineTo(...P(u - 0.7 + i * 0.28, v + 0.5, 0.03)); c.stroke(); c.beginPath(); c.moveTo(...P(u - 0.7, v - 0.5 + i * 0.2, 0.03)); c.lineTo(...P(u + 0.7, v - 0.5 + i * 0.2, 0.03)); c.stroke(); }
  // basket + teapot with steam
  const [bx, by] = P(u + 0.15, v + 0.05, 0.04); c.fillStyle = "#b07a45"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.roundRect(bx - 8, by - 7, 16, 9, 2); c.fill(); c.stroke(); c.beginPath(); c.arc(bx, by - 7, 6, Math.PI, 0); c.stroke();
  const [tx, ty] = P(u - 0.15, v - 0.1, 0.04); c.fillStyle = "#f4efe3"; c.beginPath(); c.ellipse(tx, ty - 3, 4, 3.2, 0, 0, 7); c.fill(); c.stroke();
  for (let i = 0; i < 3; i++) { const q = (t * 0.5 + i / 3 + ph) % 1; c.strokeStyle = `rgba(255,255,255,${0.7 * (1 - q)})`; c.lineWidth = 1.2; c.beginPath(); c.moveTo(tx + Math.sin(q * 5 + i) * 2, ty - 7 - q * 12); c.lineTo(tx + Math.sin(q * 5 + i + 1) * 2.5, ty - 10 - q * 12); c.stroke(); }
  people.forEach(([du, dv, seed, o], i) => k.person(u + du, v + dv, { pose: "sitground", dir: [0.3, 1], seed, ...o, gesture: ((Math.floor(t * 0.5 + i * 0.37 + ph) % 3) === 0) || o.gest }));
}

function benchReader(k, u, v, seeds, t, ph, flipDir = [0.1, 1]) {
  const r = seeds.map(([du, dv, seed, o], i) => k.person(u + du, v + dv, { pose: "sit", bench: true, seatZ: 0.26, dir: flipDir, seed, ...o }));
  return r;
}


export default function draw(k, t) {
  const c = k.ctx;
  // ---------- ground ----------
  k.groundTrace({ lawn: [[[0.5, 0.5], [9.5, 0.5], [9.5, 9.5], [0.5, 9.5]]], water: [] }, { lawn: "#aac866", paved: "#e8dbb4", side: "#e3d3b0", tufts: 22 });
  // sand promenade ring round the lake, spur to the bandstand, avenue to the riding track
  k.ground(SAND_OUT, "#d6c28d", { lw: 1.2, wobble: 0 });
  k.ground(SAND_IN, "#ebdcb0", { stroke: false });
  k.path2ground([[3.9, 3.55], [4.55, 5.6]], 0.55, "#d6c28d"); k.path2ground([[3.9, 3.55], [4.55, 5.6]], 0.43, "#ebdcb0");
  k.path2ground([[4.9, 2.65], [8.0, 2.65]], 0.6, "#d6c28d"); k.path2ground([[4.9, 2.65], [8.0, 2.65]], 0.48, "#ebdcb0");
  // riding track: raked sand, hoof tracks, white rail on the inner side
  k.ground([[TRK.u0, TRK.v0], [TRK.u1, TRK.v0], [TRK.u1, TRK.v1], [TRK.u0, TRK.v1]], "#dcbb84", { lw: 1.2, wobble: 0 });
  k.ground([[TRK.u0 + 0.12, TRK.v0 + 0.12], [TRK.u1 - 0.12, TRK.v0 + 0.12], [TRK.u1 - 0.12, TRK.v1 - 0.12], [TRK.u0 + 0.12, TRK.v1 - 0.12]], "#e6c994", { stroke: false });
  c.strokeStyle = "rgba(150,110,60,0.45)"; c.lineWidth = 1;
  for (const ln of [8.45, 8.95]) { c.beginPath(); for (let v = TRK.v0 + 0.2; v <= TRK.v1 - 0.2; v += 0.2) { const [x, y] = P(ln + Math.sin(v * 5) * 0.03, v, 0); v === TRK.v0 + 0.2 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); }
  // lake: bank rim, water, soft depth shading, shore ripples
  k.ground(BANK, "#bdb084", { lw: 1.2, wobble: 0 });
  k.water(LAKE, { color: "#74abc6", density: 3, seed: 4, flow: 0.4 });
  c.save(); c.beginPath(); LAKE.forEach(([u, v], i) => { const [x, y] = P(u, v); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); c.clip();
  k.ground(LAKE, null, { stroke: "rgba(30,80,110,0.28)", lw: 16, wobble: 0 }); k.ground(LAKE, null, { stroke: "rgba(255,255,255,0.35)", lw: 6, wobble: 0 }); c.restore();
  k.ground(LAKE, null, { stroke: "rgba(60,100,130,0.6)", lw: 3, wobble: 0 });

  // ---------- reeds, lilies on the lake ----------
  [[0.1, 1], [0.2, -1], [0.43, 1], [0.5, -1], [0.62, -1], [0.82, 1], [0.9, -1], [0.3, 1]].forEach(([f, s], i) => { const [u, v] = LINE.at(f, s * (HW(f) - 0.16)); k.q(u + v + 0.1, () => reeds2(k, u, v, 4, i + 1)); });
  [[0.06, 0], [0.97, 0], [0.55, 0.25], [0.36, -0.3], [0.66, 0.3]].forEach(([f, o], i) => { const [u, v] = LINE.at(f, o); k.q(u + v - 0.3, () => lily2(k, u, v, i + 3)); });

  // ---------- oaks (trunks inside the footprint) ----------
  const O = (u, v, o) => k.q(u + v + 0.3, () => oak(k, u, v, o));
  O(0.85, 2.7, { H: 40, cx: 0, cy: -70, rx: 60, ry: 42, n: 56, leaf: 0.19, col: "#b0c25c", seed: 305, tw: 11, sparse: 0.25 });
  O(6.2, 0.9, { H: 34, cx: 0, cy: -56, rx: 48, ry: 34, n: 40, leaf: 0.22, col: "#a9c05a", seed: 308, tw: 9 });
  O(1.2, 3.7, { H: 34, cx: 0, cy: -58, rx: 50, ry: 36, n: 44, leaf: 0.21, col: "#a4be5e", seed: 304, tw: 9 });
  O(8.9, 5.1, { H: 30, cx: 0, cy: -52, rx: 42, ry: 30, n: 34, leaf: 0.23, col: "#9db95e", seed: 302, tw: 8 });
  O(0.8, 5.3, { H: 32, cx: 0, cy: -54, rx: 44, ry: 32, n: 38, leaf: 0.22, col: "#8cb45c", seed: 303, tw: 8 });

  // ---------- flower beds ----------
  const PINK = ["#e8607a", "#f39ac0", "#d94a5c", "#ffffff"];
  const FB = (pts, seed, cols, w = 0.45) => k.q(pts[0][0] + pts[0][1] + 0.4, () => k.flowerCurve(pts, w, { seed, cols }));
  FB([[3.0, 4.65], [3.5, 4.7]], 321, PINK, 0.3); FB([[5.4, 1.7], [5.9, 1.55], [6.4, 1.6]], 322, PINK, 0.4);
  FB([[8.2, 5.35], [8.7, 5.45]], 323, ["#f4c542", "#e9813c", "#f39ac0"], 0.35); FB([[4.9, 4.7], [5.4, 4.8]], 324, PINK, 0.3);
  FB([[1.1, 2.2], [1.1, 2.9]], 325, ["#f4c542", "#e9813c", "#9a7ad0"], 0.35);

  // ---------- bandstand ----------
  k.q(BAND[0] + BAND[1] + 1.6, () => bandstand(k, BAND[0], BAND[1], t, 1.05));

  // ---------- rail round the riding track (in 3 depth-sorted pieces) ----------
  for (const [a, b] of [[0.95, 2.2], [2.2, 3.4], [3.4, 4.5]]) k.q(TRK.u0 - 0.1 + (a + b) / 2, () => rail(k, [[TRK.u0 - 0.1, a], [TRK.u0 - 0.1, b]], { h: 0.36 }));

  // ---------- benches and sitters ----------
  const B = (u, v, along) => k.q(u + v + 0.3, () => k.bench(u, v, { along, len: 0.9 }));
  B(2.4, 4.0, "u"); B(6.2, 5.0, "u");
  k.q(2.4 + 4.0 + 0.95, () => {
    const r = benchReader(k, 2.4, 4.0, [[0.2, 0.15, 341, { hair: "#9a9a96" }], [0.62, 0.15, 342, { hair: "#9a9a96", hat: "cap", gesture: Math.floor(t * 0.45) % 3 === 0 }]], t, 0);
    newspaper(c, r[0].hand[0] + 6, r[0].hand[1] - 2, t, 0.1, 0.9);
  });
  k.q(6.2 + 5.0 + 0.95, () => { const r = k.person(6.2 + 0.3, 5.0 + 0.17, { pose: "sit", bench: true, seatZ: 0.26, dir: [0.2, 1], seed: 344, hat: "sunhat" }); newspaper(c, r.hand[0] + 5, r.hand[1] - 3, t, 0.5, 0.85); });
  { // deckchairs facing the bandstand lawn
    [["#d64e46", "#f6f0e2", 5.0, 3.4], ["#3f73b5", "#f6f0e2", 5.8, 3.4], ["#e8b23c", "#f6f0e2", 5.4, 3.95]].forEach(([a, b, u, v], i) => {
      k.q(u + v + 0.5, () => { deckchair(k, u, v, a, b); const r = k.person(u + 0.25, v + 0.25, { pose: "sit", bench: true, seatZ: 0.22, dir: [0.2, 1], seed: 360 + i, hat: i === 1 ? "sunhat" : undefined, gesture: i === 0 && Math.floor(t * 0.4) % 3 === 0 }); if (i === 2) newspaper(c, r.hand[0] + 4, r.hand[1] - 3, t, 0.3, 0.75); });
    });
  }
  k.q(1.45 + 8.3 + 0.7, () => picnic(k, 1.45, 8.3, t, [[-0.15, -0.15, 351, { hat: "cap" }], [0.35, 0.2, 352, { hat: "sunhat" }]], "#c9455f", 0));
  k.q(8.3 + 8.6 + 0.7, () => picnic(k, 8.3, 8.6, t, [[-0.35, -0.1, 353, {}], [0.15, 0.3, 354, { hat: "sunhat" }], [0.45, -0.2, 355, { kid: true, scale: 0.45 }]], "#4a78b8", 0.4));
  k.q(6.5 + 1.6 + 0.7, () => picnic(k, 6.5, 1.6, t, [[-0.3, -0.1, 356, { hat: "cap" }], [0.3, 0.15, 357, {}]], "#e0b13c", 0.7));

  // ---------- fetch: thrower, ball, dog (all on the east lawn strip) ----------
  { const T0 = [8.95, 5.95], T1 = [8.95, 7.6], cyc = 9, q = (t % cyc) / cyc;
    k.q(T0[0] + T0[1] + 0.5, () => {
      const throwing = q > 0.05 && q < 0.16;
      k.person(T0[0], T0[1], { pose: throwing ? "wave" : "stand", dir: [0.3, 1], seed: 399, top: "#e9dcc4", hat: "cap" });
      let bu, bv, bz = 0.05, dogU, dogV, moving = true, gait = t * 14;
      if (q < 0.16) { bu = T0[0]; bv = T0[1] + 0.1; bz = 0.9; dogU = T0[0] + 0.1; dogV = T0[1] + 0.7; moving = false; }
      else if (q < 0.34) { const f = (q - 0.16) / 0.18; bu = lerp(T0[0], T1[0], f); bv = lerp(T0[1], T1[1], f); bz = 0.1 + Math.sin(f * Math.PI) * 2.2; dogU = lerp(T0[0] + 0.1, T1[0], clamp(f * 1.15)); dogV = lerp(T0[1] + 0.7, T1[1], clamp(f * 1.15)); }
      else if (q < 0.42) { bu = T1[0]; bv = T1[1]; dogU = T1[0]; dogV = T1[1]; moving = false; bz = 0.12; }
      else if (q < 0.7) { const f = (q - 0.42) / 0.28; dogU = lerp(T1[0], T0[0] + 0.1, f); dogV = lerp(T1[1], T0[1] + 0.7, f); bu = dogU; bv = dogV; bz = 0.28; }
      else { bu = T0[0] + 0.1; bv = T0[1] + 0.7; dogU = bu; dogV = bv; moving = q < 0.76; bz = 0.05; }
      const dvz = (q >= 0.16 && q < 0.42 ? 1 : -1);
      const [x, y] = P(dogU, dogV, 0); dog(k, x, y, dvz > 0 ? -1 : 1, gait, moving);
      const carry = q >= 0.42 && q < 0.7, [bx, by] = P(bu, bv, bz); c.fillStyle = "#e9d34a"; c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.arc(bx + (carry ? 7 : 0), by - (carry ? 6 : 0), 2.2, 0, 7); c.fill(); c.stroke();
    }); }

  // ---------- life on the water ----------
  BOATS.forEach((b, i) => { const r = b.lp.state(t * b.sp / b.lp.L + b.ph); k.q(r.u + r.v + 0.5, () => rowingBoat(k, r.u, r.v, r.ang, t, { ph: b.ph * 7, top: b.top, pcol: b.pcol, hat: b.hat })); });
  SWANS.forEach((s, i) => { const r = s.lp.state(t * s.sp / s.lp.L + s.ph); k.q(r.u + r.v + 0.2, () => swanGlide(k, r.u, r.v, r.du - r.dv >= 0 ? 1 : -1, t, s.ph * 9 + i)); });

  // ---------- people on the paths ----------
  const W = (route, off, seed, sp = 0.4, extra) => k.qwalker(route, { speed: sp, offset: off, seed, loop: route === RING_PTS || route === RING_REV || route === R_RIDE, dwell: 1.5, ...(extra || {}) });
  W(RING_PTS, 0.02, 381); W(RING_PTS, 0.075, 382, 0.4, { scale: 0.5 }); W(RING_PTS, 0.45, 383, 0.36); W(RING_REV, 0.2, 384, 0.38, { top: "#e27fa0" }); W(RING_REV, 0.62, 387, 0.36, { hat: "sunhat" });
  W(RING_PTS, 0.3, 385, 1.0, { bottom: "#25334b", top: "#d9544b", shorts: true, stride: 0.5 });
  W(RING_REV, 0.85, 386, 1.0, { bottom: "#3c3c3c", top: "#4aa5a1", shorts: true, hat: "cap", stride: 0.5 });
  W(R_AVE, 0.1, 388, 0.42); W(R_AVE, 0.62, 389, 0.38, { top: "#e9dcc4", hat: "cap" });
  { const o = { speed: 0.34, offset: 0.2, dwell: 2 }, st = k.walkerState(R_SPUR, o);
    k.q(st.u + st.v + 0.5, () => { const L = Math.hypot(st.du, st.dv) || 1, du = st.du / L, dv = st.dv / L, [x, y] = P(st.u + du * 0.6, st.v + dv * 0.6, 0); dog(k, x, y, du - dv >= 0 ? 1 : -1, st.moving ? st.p * Math.PI * 4 : 0, st.moving); k.walker(R_SPUR, { ...o, seed: 391, top: "#e9dcc4", hair: "#a8442e" }); }); }
  { const st = k.walkerState(R_RIDE, { speed: 0.75, offset: 0.35, loop: true, stride: 0.5 });
    k.q(st.u + st.v + 0.6, () => { horse(k, st.u, st.v, st.du, st.dv, st.p, { moving: true }); k.person(st.u, st.v, { pose: "ride", seatZ: 0.78, z: 0, dir: [st.du, st.dv], seed: 395, hat: "cap", hatCol: "#2a2420", top: "#b33a30", shadow: false, cadence: 0 }); }); }
  for (let i = 0; i < 3; i++) k.q(4.6 + 2.5, () => pigeon(k, 4.9 + i * 0.35 + Math.sin(t * 0.6 + i) * 0.1, 2.9 + (i % 2) * 0.3, { phase: i * 2 }));
  k.flush();
  // ---------- sky ----------
  k.circlingBird(520, 300, 90, 30, { speed: 0.6, phase: 0 }); k.circlingBird(520, 300, 90, 30, { speed: 0.6, phase: 0.7, size: 0.8 }); k.circlingBird(700, 380, 60, 20, { speed: -0.5, phase: 2 });
}
