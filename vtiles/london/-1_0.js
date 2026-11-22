// LONDON · Notting Hill & Regent's Canal (traced over assets/london/-1_0.png)
// An L of pastel stucco houses (terrace.js) round a flagstone market square; six striped stalls; a canal
// basin with stone quays and iron railings; one narrowboat moored, one cruising a loop with a wake;
// willows, Victorian lamps, ducks, and ~20 people.
import { P, INK, shade, lerp, clamp, rng } from "../../lib/vec-kit.js";
import { drive, pigeon, keepOut, dense } from "./_props.js";
import { makeTerrace } from "./terrace.js";
import { stall, victorianLamp, quayRail, narrowboat, duck, weepingWillow } from "./_t-1_0.js";

const TERRACE = makeTerrace();
const WZ = -0.42;
const Q0 = 4.4, Q1 = 9.4; // the basin: u, v in [Q0, Q1], in the front-right corner
const WATER = [[Q0, Q0], [Q1, Q0], [Q1, Q1], [Q0, Q1]];
const QUAY = [[Q0, Q1], [Q0, Q0], [Q1, Q0]]; // the visible quay walls (far sides)
const PAVE = "#eadcbc";

// stalls: back wing (A) opens toward +v, left wing (B) opens toward +u
const SA = 2.45;
const STALLS = [
  { o: [3.9, SA], w: [1, 0], n: [0, 1], c1: "#e8b93a", kind: "flowers", cloth: "#f2e3b0", seed: 4, sign: "FLOWERS" },
  { o: [5.7, SA], w: [1, 0], n: [0, 1], c1: "#5f9a6a", kind: "brass", cloth: "#e9a7b0", seed: 3 },
  { o: [7.5, SA], w: [1, 0], n: [0, 1], c1: "#6f74b8", kind: "antiques", cloth: "#e58f9c", seed: 2, sign: "ANTIQUES" },
  { o: [SA, 3.9], w: [0, 1], n: [1, 0], c1: "#d9534f", kind: "antiques", cloth: "#d9c29a", seed: 1 },
  { o: [SA, 5.7], w: [0, 1], n: [1, 0], c1: "#5a78b8", kind: "china", cloth: "#e3eaf2", seed: 6, sign: "CHINA" },
  { o: [SA, 7.5], w: [0, 1], n: [1, 0], c1: "#e8607a", kind: "flowers", cloth: "#f4d6df", seed: 5 },
];
const sp = (S, a, d) => [S.o[0] + S.w[0] * a + S.n[0] * d, S.o[1] + S.w[1] * a + S.n[1] * d];

// lamps, trees, keep-out zones for walkers
const LAMPS = [[4.2, 4.2], [9.5, 4.2], [4.2, 9.5]];
const WILLOWS = [[2.7, 9.4], [9.4, 2.7]];
const KEEP = [...LAMPS.map(([u, v]) => [u, v, 0.3]), ...WILLOWS.map(([u, v]) => [u, v, 0.45])];
const ROUTES = {
  A1: keepOut(dense([[4.8, 3.84], [9.1, 3.84]]), KEEP), A2: keepOut(dense([[9.1, 4.02], [4.8, 4.02]]), KEEP), A3: keepOut(dense([[4.8, 4.2], [9.1, 4.2]]), KEEP),
  B1: keepOut(dense([[3.84, 4.8], [3.84, 9.1]]), KEEP), B2: keepOut(dense([[4.02, 9.1], [4.02, 4.8]]), KEEP), B3: keepOut(dense([[4.2, 4.8], [4.2, 9.1]]), KEEP),
  P1: dense([[2.75, 2.75], [3.6, 2.75]]), P2: dense([[3.6, 3.45], [2.75, 3.45]]), P3: dense([[3.15, 2.95], [3.15, 3.3]]),
  P4: keepOut(dense([[2.8, 4.3], [2.8, 6.2]]), KEEP), P5: keepOut(dense([[4.3, 2.9], [6.3, 2.9]]), KEEP),
};
// the cruising boat: a circle in the basin, clear of the moored boat
const LOOP = Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2; return [7.35 + Math.cos(a) * 0.9, 6.95 + Math.sin(a) * 0.9]; });

// flagstones (running bond) clipped to a polygon in (u, v)
function flags(k, poly) {
  const c = k.ctx, R = rng(17);
  c.save(); k._trace(poly.map(([u, v]) => P(u, v)), true, 0); c.clip();
  for (let i = 0; i < 20; i++) for (let j = 0; j < 20; j++) {
    const off = (i % 2) * 0.25, u0 = i * 0.5, v0 = j * 0.5 - off;
    const q = [P(u0, v0), P(u0 + 0.5, v0), P(u0 + 0.5, v0 + 0.5), P(u0, v0 + 0.5)];
    c.beginPath(); q.forEach((p, n) => (n ? c.lineTo(...p) : c.moveTo(...p))); c.closePath();
    c.fillStyle = shade(PAVE, (R() - 0.5) * 0.07); c.fill();
    c.strokeStyle = "rgba(150,125,90,0.32)"; c.lineWidth = 0.7; c.stroke();
  }
  c.restore();
}

function ground(k, t) {
  const c = k.ctx;
  k.slab(PAVE, { side: "#e3d3b0" });
  flags(k, [[0, 0], [10, 0], [10, 10], [0, 10]]);
  // lawn corners under the willows
  k.ground([[8.3, 0.3], [9.7, 0.3], [9.7, 2.3], [8.3, 2.3]].map(([u, v]) => [u, v]), "#a6c466", { lw: 1, wobble: 0 });
  k.ground([[0.3, 8.3], [2.3, 8.3], [2.3, 9.7], [0.3, 9.7]], "#a6c466", { lw: 1, wobble: 0 });
  k.grass([[8.3, 0.3], [9.7, 0.3], [9.7, 2.3], [8.3, 2.3]], { density: 9, seed: 3 });
  k.grass([[0.3, 8.3], [2.3, 8.3], [2.3, 9.7], [0.3, 9.7]], { density: 9, seed: 4 });

  // ---- canal basin ----
  k.water(WATER, { z: WZ, color: "#5aa9a3", density: 0, seed: 4 });
  { const g = c.createLinearGradient(...P(Q0, Q0, WZ), ...P(Q1, Q1, WZ)); g.addColorStop(0, "rgba(20,70,80,0.28)"); g.addColorStop(0.45, "rgba(255,255,255,0.06)"); g.addColorStop(1, "rgba(20,70,80,0.12)"); k.path(WATER.map(([u, v]) => P(u, v, WZ)), { fill: g, stroke: false, wobble: 0 }); }
  // reflections of the pastel houses: soft vertical streaks drifting with the ripples
  c.save(); k._trace(WATER.map(([u, v]) => P(u, v, WZ)), true, 0); c.clip();
  const cols = ["#f5dd80", "#f4bac7", "#abc7eb", "#c9b5e3", "#f7f2e6"];
  const RR = rng(5);
  for (let i = 0; i < 120; i++) {
    const u = lerp(Q0, Q1, RR()), v = lerp(Q0, Q1, RR()), [x, y] = P(u, v, WZ), len = 10 + RR() * 30, w = 5 + RR() * 9;
    c.globalAlpha = 0.2 + RR() * 0.2; c.fillStyle = cols[i % 5];
    c.beginPath();
    for (let s = 0; s <= 6; s++) { const yy = y + (s / 6) * len, xx = x + Math.sin(t * 1.3 + i + s * 0.9) * 2.4; s ? c.lineTo(xx - w / 2, yy) : c.moveTo(xx - w / 2, yy); }
    for (let s = 6; s >= 0; s--) { const yy = y + (s / 6) * len, xx = x + Math.sin(t * 1.3 + i + s * 0.9) * 2.4; c.lineTo(xx + w / 2, yy); }
    c.closePath(); c.fill();
  }
  c.globalAlpha = 1;
  // ripple glints
  c.strokeStyle = "rgba(255,255,255,0.7)"; c.lineWidth = 1.2; c.lineCap = "round";
  for (let i = 0; i < 90; i++) {
    const u0 = lerp(Q0 + 0.1, Q1 - 0.1, RR()), v0 = lerp(Q0 + 0.1, Q1 - 0.4, RR()), ph = RR() * 6.28, a = 0.5 + 0.5 * Math.sin(t * 1.5 + ph);
    const [x, y] = P(u0, v0 + ((t * 0.05 + RR()) % 1) * 0.3, WZ);
    c.globalAlpha = a * 0.75; c.beginPath(); c.moveTo(x - 5, y); c.quadraticCurveTo(x - 2.5, y - 1.8, x, y); c.quadraticCurveTo(x + 2.5, y + 1.8, x + 5, y); c.stroke();
  }
  c.globalAlpha = 1;
  // a shadow band along the foot of the quay walls
  for (let i = 0; i < QUAY.length - 1; i++) { const [a, b] = [QUAY[i], QUAY[i + 1]]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]); const nu = (b[1] - a[1]) / L, nv = -(b[0] - a[0]) / L; const s = nu + nv > 0 ? 1 : -1; k.poly([[a[0], a[1], WZ], [b[0], b[1], WZ], [b[0] + nu * s * 0.35, b[1] + nv * s * 0.35, WZ], [a[0] + nu * s * 0.35, a[1] + nv * s * 0.35, WZ]], "rgba(20,60,70,0.18)", { stroke: false }); }
  c.restore();
  // quay walls: stone blocks between the coping and the water
  for (let i = 0; i < QUAY.length - 1; i++) {
    const a = QUAY[i], b = QUAY[i + 1];
    const q = [[a[0], a[1], 0], [b[0], b[1], 0], [b[0], b[1], WZ], [a[0], a[1], WZ]];
    k.poly(q, i === 0 ? "#b5a68a" : "#c4b597", { lw: 1.1, wobble: 0 });
    c.save(); c.beginPath(); q.forEach((p, n) => { const s = P(...p); n ? c.lineTo(...s) : c.moveTo(...s); }); c.closePath(); c.clip();
    c.strokeStyle = "rgba(80,62,40,0.4)"; c.lineWidth = 0.7; c.beginPath();
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let row = 0;
    for (let z = -0.04; z > WZ; z -= 0.12, row++) {
      c.moveTo(...P(a[0], a[1], z)); c.lineTo(...P(b[0], b[1], z));
      for (let s = (row % 2) * 0.17; s < L; s += 0.34) { const f = s / L; const u = lerp(a[0], b[0], f), v = lerp(a[1], b[1], f); c.moveTo(...P(u, v, z)); c.lineTo(...P(u, v, Math.max(WZ, z - 0.12))); }
    }
    c.stroke();
    c.fillStyle = "rgba(60,90,70,0.25)"; c.beginPath(); [[a[0], a[1], WZ + 0.08], [b[0], b[1], WZ + 0.08], [b[0], b[1], WZ], [a[0], a[1], WZ]].forEach((p, n) => { const s = P(...p); n ? c.lineTo(...s) : c.moveTo(...s); }); c.fill();
    c.restore();
  }
  // the near rims hide the water strip behind them; flagstones again, then coping stones
  for (const rim of [[[Q1, Q0 - 0.1], [10, Q0 - 0.1], [10, 10], [Q1, 10]], [[Q0 - 0.1, Q1], [Q1, Q1], [Q1, 10], [Q0 - 0.1, 10]]]) { k.poly(rim.map(([u, v]) => [u, v, 0]), PAVE, { stroke: false }); flags(k, rim); }
  k.line3(QUAY.map(([u, v]) => [u, v, 0.02]), { lw: 3.4, stroke: "#e2d6bd", wobble: 0 });
  k.line3([[Q1, Q0, 0.02], [Q1, Q1, 0.02], [Q0, Q1, 0.02]], { lw: 3.4, stroke: "#e2d6bd", wobble: 0 });
}

// shrubs and flower clumps
function shrub(k, u, v, r, seed, flowers) {
  const c = k.ctx, R = rng(seed), [x, y] = P(u, v, 0);
  k.ell(u + 0.1, v + 0.05, 0, r * 0.9, "rgba(60,45,30,0.15)", { stroke: false });
  const px = r * 45;
  for (let i = 0; i < 9; i++) { const a = R() * 6.28, rr = R() * px * 0.6; const bx = x + Math.cos(a) * rr, by = y - px * 0.5 + Math.sin(a) * rr * 0.55; c.fillStyle = INK; c.beginPath(); c.arc(bx, by, px * 0.42 + 1.4, 0, 7); c.fill(); }
  for (let i = 0; i < 9; i++) { const R2 = rng(seed); for (let s = 0; s < i * 2; s++) R2(); }
  const R3 = rng(seed);
  for (let i = 0; i < 9; i++) { const a = R3() * 6.28, rr = R3() * px * 0.6; const bx = x + Math.cos(a) * rr, by = y - px * 0.5 + Math.sin(a) * rr * 0.55; c.fillStyle = i % 3 ? "#6b9a48" : "#88b55a"; c.beginPath(); c.arc(bx, by, px * 0.42, 0, 7); c.fill(); }
  if (flowers) for (let i = 0; i < Math.round(px * 1.4); i++) { c.fillStyle = flowers[i % flowers.length]; c.beginPath(); c.arc(x + (R() - 0.5) * px * 1.5, y - px * 0.5 + (R() - 0.5) * px * 0.9, 1.9, 0, 7); c.fill(); }
}

export default function draw(k, t) {
  const c = k.ctx;
  ground(k, t);

  // ---------- the terrace (behind everything in the street) ----------
  k.q(-5, () => TERRACE.draw(k, t));

  // ---------- market ----------
  for (const s of STALLS) {
    const mid = sp(s, 0.7, 0.6);
    k.q(mid[0] + mid[1], () => stall(k, { o: s.o, w: s.w, n: s.n }, { ...s, keeper: ([u, v]) => k.person(u, v, { pose: s.seed % 2 ? "wave" : "stand", dir: s.n, seed: 60 + s.seed, hat: s.kind === "flowers" ? "sunhat" : undefined }) }));
  }
  for (const [u, v] of LAMPS) k.q(u + v + 0.1, () => victorianLamp(k, u, v, { h: 2.15 }));
  // planters and shrubs
  k.q(11.4, () => shrub(k, 2.0, 9.45, 0.3, 11, ["#f3f0e6", "#f6d2df"]));
  k.q(11.4, () => shrub(k, 9.45, 2.0, 0.3, 12, ["#f08bb5", "#ffffff"]));
  k.q(13.6, () => shrub(k, 4.05, 9.5, 0.28, 13, ["#f08bb5", "#e8607a", "#ffffff"]));
  k.q(13.6, () => shrub(k, 9.5, 4.05, 0.28, 14, ["#f4c542", "#ffffff", "#f4c542"]));
  k.q(10.0, () => k.flowerCurve([[0.5, 9.2], [0.6, 9.5], [1.3, 9.6]], 0.3, { seed: 41, cols: ["#f08bb5", "#e8607a", "#ffffff"] }));
  k.q(8.6, () => k.flowerCurve([[8.7, 0.45], [9.3, 0.45], [9.6, 0.7]], 0.3, { seed: 42, cols: ["#f08bb5", "#ffffff", "#f4c542"] }));

  // ---------- quay railings (chunked so people and boats sort against them) ----------
  const railRuns = [[[Q0, Q1 - 0.1], [Q0, Q0]], [[Q0, Q0], [Q1 - 0.1, Q0]], [[Q1, Q0 + 0.1], [Q1, Q1]], [[Q0 + 0.1, Q1], [Q1, Q1]]];
  for (const [a, b] of railRuns) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / 0.55));
    for (let i = 0; i < n; i++) {
      const p0 = [lerp(a[0], b[0], i / n), lerp(a[1], b[1], i / n)], p1 = [lerp(a[0], b[0], (i + 1) / n), lerp(a[1], b[1], (i + 1) / n)];
      const dep = (p0[0] + p1[0] + p0[1] + p1[1]) / 2 + 0.05;
      k.q(dep, () => quayRail(k, p0, p1, { skipFirst: i > 0, step: 0.55 }));
    }
  }
  // mooring bollard + rope for the moored boat
  k.q(12.4, () => { const [x, y] = P(Q0 - 0.18, 8.1, 0); c.fillStyle = "#1e1c1c"; c.beginPath(); c.roundRect(x - 3.5, y - 9, 7, 9, 2.5); c.fill(); c.beginPath(); c.ellipse(x, y - 9, 4.5, 2, 0, 0, 7); c.fill(); });

  // ---------- boats ----------
  // moored against the left quay (heading +v, bow toward the viewer)
  k.q(4.95 + 7.0 + 0.5, () => {
    const info = narrowboat(k, 5.0, 7.0, Math.PI / 2, { L: 2.9, z0: WZ, hull: "#2d5a3c", cabin: "#a8322f", phase: 1, name: "ROSIE", planters: [[-0.45, 0], [0.05, 1], [0.5, 0]], rope: true });
    const [bx, by] = P(Q0 - 0.18, 8.1, 0.25), [sx, sy] = P(info.bow[0] - 0.2, info.bow[1], WZ + 0.5);
    c.strokeStyle = "#c9a86a"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo((bx + sx) / 2, Math.max(by, sy) + 8, sx, sy); c.stroke();
    k.person(info.stern[0] + 0.05, info.stern[1] + 0.05, { z: info.z - 0.02, pose: "sitground", dir: [1, 0.2], seed: 88, shadow: false, gesture: true });
  });
  // cruising: a circle round the middle of the basin
  {
    const b = drive(LOOP, t, { loop: true, speed: 0.34, offset: 0.0 });
    k.q(b.u + b.v + 0.6, () => {
      const info = narrowboat(k, b.u, b.v, b.ang, { L: 2.4, z0: WZ, hull: "#2a4f86", cabin: "#a52f38", roof: "#cfd6dc", phase: 3, moving: true, planters: [[-0.2, 0], [0.4, 1]], bike: true });
      k.person(info.stern[0] - Math.cos(b.ang) * 0.05, info.stern[1] - Math.sin(b.ang) * 0.05, { z: info.z, pose: "stand", dir: [Math.cos(b.ang), Math.sin(b.ang)], seed: 90, hat: "sunhat", hatCol: "#e9d48a", shadow: false });
    });
  }
  // ducks paddling in the far corner of the basin
  for (let i = 0; i < 3; i++) {
    const a = t * 0.25 + i * 0.6, u = 6.3 + Math.cos(a) * 0.28 + i * 0.3, v = 5.0 + Math.sin(a) * 0.2 + i * 0.12;
    k.q(u + v, () => duck(k, u, v, -Math.sin(a) - Math.cos(a), WZ, { phase: i, female: i === 1 }));
  }

  // ---------- willows (street ends) ----------
  k.q(12.1, () => weepingWillow(k, WILLOWS[0][0], WILLOWS[0][1], { r: 1.1, h: 2.3, seed: 5, col: "#b8cc52" }));
  k.q(12.1, () => weepingWillow(k, WILLOWS[1][0], WILLOWS[1][1], { r: 1.1, h: 2.4, seed: 8, col: "#aec64e" }));

  // ---------- life ----------
  const walkers = [
    ["A1", 0.0, 21], ["A2", 0.45, 22, { bag: true }], ["A3", 0.7, 23],
    ["B1", 0.2, 24], ["B2", 0.6, 25], ["B3", 0.9, 26],
    ["P1", 0.1, 27], ["P2", 0.5, 28], ["P3", 0.3, 29], ["P4", 0.4, 30], ["P5", 0.7, 31],
  ];
  for (const [r, off, seed, extra] of walkers) k.qwalker(ROUTES[r], { speed: 0.34, offset: off, seed, dwell: 1.4 + (seed % 3) * 0.7, ...(extra || {}) });
  // browsers at the stalls (standing in front of the tables)
  const browse = [[0, 0.5], [1, 0.45], [2, 0.8], [3, 0.7], [4, 0.45], [5, 0.9]];
  browse.forEach(([i, a], n) => { const S = STALLS[i], [u, v] = sp(S, a, 1.15); k.qperson(u, v, { pose: n === 2 ? "photo" : "stand", dir: [-S.n[0], -S.n[1]], seed: 71 + n, bag: n % 2 === 0 }); });
  // pigeons pecking on the flagstones
  for (let i = 0; i < 3; i++) { const u = 3.0 + i * 0.3 + Math.sin(t * 0.7 + i) * 0.08, v = 4.9 + (i % 2) * 0.3; k.q(u + v, () => pigeon(k, u, v, { phase: i * 2 })); }
  k.flush();

  // ---------- sky ----------
  k.circlingBird(470, 110, 70, 20, { speed: 0.6, phase: 0 });
  k.circlingBird(470, 110, 70, 20, { speed: 0.6, phase: 0.7, size: 0.8 });
  k.cloud(200, 140, { s: 0.75, phase: 2 });
  k.cloud(830, 120, { s: 0.65, phase: 4 });
}

export const camera = { u: 4.2, v: 4.2, z: 2.2, zoom: 2.1 };
