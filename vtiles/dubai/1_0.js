// DUBAI · 1,0 · Dubai Frame & Zabeel Park (grid pass: true-solid frame, everything inside the 10x10 footprint)
// Layout (u,v): frame towers u 2.6-3.7 and 7.4-8.5 at v 3.4-4.5 (opening faces the left face), gallery between
// them; promenade v~5.2; fountain plaza centre (5,7.2) r1.9; ring path around the lawn; back lawn behind the frame.
import { P, INK, shade, lerp, clamp, rng, smooth } from "../../lib/vec-kit.js";
import { makeFrame } from "./frame.js";
import { dpalm, look, circlePoly } from "./_g1_0.js";

const FR = makeFrame();
export const camera = { u: 5, v: 4.6, z: 5.2, zoom: 1.2 };
const FC = [5, 7.2], SC = 0.74;

const chaikin = (pts, n = 3) => { for (let i = 0; i < n; i++) { const o = [pts[0]]; for (let j = 0; j < pts.length - 1; j++) { const a = pts[j], b = pts[j + 1]; o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } o.push(pts[pts.length - 1]); pts = o; } return pts; };
const ribbon = (pts, w) => { // smooth walkway polyline -> closed outline polygon in (u,v)
  const sm = chaikin(pts), L = [], R = [];
  sm.forEach((p, i) => { const a = sm[Math.max(0, i - 1)], b = sm[Math.min(sm.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nu = -(b[1] - a[1]) / l * w / 2, nv = (b[0] - a[0]) / l * w / 2; L.push([p[0] + nu, p[1] + nv]); R.push([p[0] - nu, p[1] - nv]); });
  return [...L, ...R.reverse()];
};

const MIX = {
  pink: ["#e86f9a", "#f3a6c4", "#fbe1ea", "#d8527c"],
  warm: ["#f4c542", "#e8803c", "#d94a3c", "#fbe28a"],
  rose: ["#e8607a", "#f39ac0", "#ffffff", "#c9486a"],
  white: ["#ffffff", "#f4efe0", "#f6d36e", "#f3a6c4"],
};

function bed(k, pts, mix, seed, t) {
  const c = k.ctx, R = rng(seed * 97 + 3), cols = MIX[mix];
  k.ground(pts, "#5f9340", { lw: 1.2 });
  k.ground(pts, null, { stroke: "#3f6b2c", lw: 3, alpha: 0.5 });
  const xs = pts.map((p) => P(p[0], p[1])), x0 = Math.min(...xs.map((p) => p[0])), x1 = Math.max(...xs.map((p) => p[0])), y0 = Math.min(...xs.map((p) => p[1])), y1 = Math.max(...xs.map((p) => p[1]));
  const inside = (x, y) => { let ins = false; for (let i = 0, j = xs.length - 1; i < xs.length; j = i++) { if ((xs[i][1] > y) !== (xs[j][1] > y) && x < ((xs[j][0] - xs[i][0]) * (y - xs[i][1])) / (xs[j][1] - xs[i][1]) + xs[i][0]) ins = !ins; } return ins; };
  const dots = [];
  for (let i = 0, n = 0; n < 40 && i < 600; i++) { const x = lerp(x0, x1, R()), y = lerp(y0, y1, R()); if (inside(x, y)) { dots.push([x, y, R(), R()]); n++; } }
  dots.sort((a, b) => a[1] - b[1]);
  for (const [x, y, r1, r2] of dots) {
    const sw = Math.sin(t * 1.4 + x * 0.05 + y * 0.03) * 0.6, s = 3.4 + r1 * 2.4;
    c.fillStyle = shade("#6fa24a", (r2 - 0.5) * 0.3); c.strokeStyle = INK; c.lineWidth = 0.7;
    c.beginPath(); c.arc(x + sw, y - 2, s, 0, 6.3); c.fill(); c.stroke();
    const col = cols[Math.floor(r2 * 4)];
    c.fillStyle = col; c.beginPath(); c.arc(x + sw - 0.8, y - 3.6, s * 0.62, 0, 6.3); c.fill(); c.stroke();
    c.fillStyle = "rgba(255,255,255,0.5)"; c.beginPath(); c.arc(x + sw - 1.6, y - 4.4, s * 0.2, 0, 6.3); c.fill();
  }
}


function fountainGround(k) {
  // paved plaza + 8-pointed star with grass kites, stone rim, turquoise basin
  const [u, v] = FC;
  k.ground(circlePoly(u, v, 2.55 * SC, 40), "#f6e9ce", { lw: 1.3 });
  for (let i = 0; i < 8; i++) {
    const th = (i + 0.5) * Math.PI / 4, a = (r, d) => [u + Math.cos(th + d) * r * SC, v + Math.sin(th + d) * r * SC];
    const kite = [a(1.72, -0.3), a(2.15, 0), a(2.62, 0), a(2.15, 0.34), a(1.72, 0.3)];
    const tri = [a(1.78, -0.3), a(2.52, 0), a(1.78, 0.3)];
    k.ground(tri, "#8dba4d", { lw: 1.2 }); k.ground(tri, null, { stroke: "#5f8a34", lw: 2.6, alpha: 0.5 });
    void kite;
  }
  k.ground(circlePoly(u, v, 1.66 * SC, 40), "#e2cf9f", { lw: 1.4 });
  k.ground(circlePoly(u, v, 1.5 * SC, 40), "#c8b78c", { lw: 1.2 });
}

function fountainWater(k, t) {
  const [u, v] = FC, c = k.ctx;
  k.ground(circlePoly(u, v, 1.42 * SC, 40), "#59b9c3", { lw: 1.3 });
  const [cx, cy] = P(u, v, 0);
  c.save(); k._trace(circlePoly(u, v, 1.42 * SC, 40).map(([a, b]) => P(a, b)), true, 0); c.clip();
  const gr = c.createRadialGradient(cx - 20, cy - 8, 4, cx, cy, 72); gr.addColorStop(0, "rgba(190,240,240,0.55)"); gr.addColorStop(1, "rgba(20,110,130,0.35)");
  c.fillStyle = gr; c.fillRect(cx - 100, cy - 60, 200, 120);
  for (let i = 0; i < 4; i++) for (const [ox, oy] of [[0, 0], [0.55, 0.35], [-0.5, -0.3], [-0.2, 0.55], [0.4, -0.5]]) {
    const ph = (t * 0.45 + i / 4 + ox * 0.3) % 1, r = (0.15 + ph * 0.7) * 0.9, [px, py] = P(u + ox, v + oy, 0);
    c.strokeStyle = `rgba(255,255,255,${0.55 * (1 - ph)})`; c.lineWidth = 1.1; c.beginPath(); c.ellipse(px, py, r * 64, r * 37, 0, 0, 6.3); c.stroke();
  }
  c.restore();
  k.ground(circlePoly(u, v, 1.42 * SC, 40), null, { lw: 1.6 });
}

function jets(k, t) {
  const [u, v] = FC, c = k.ctx;
  c.lineCap = "round";
  const stream = (u0, v0, h, reach, ang, w, ph) => {
    // parabolic arcs flowing outwards
    for (const [lw, col] of [[w + 1.6, "rgba(40,100,120,0.55)"], [w, "rgba(235,250,255,0.95)"]]) {
      c.strokeStyle = col; c.lineWidth = lw; c.beginPath();
      for (let s = 0; s <= 1.001; s += 0.08) { const z = h * 4 * s * (1 - s) + 0.02, r = reach * s, [x, y] = P(u0 + Math.cos(ang) * r, v0 + Math.sin(ang) * r, z); s ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke();
    }
    // droplets
    c.fillStyle = "rgba(255,255,255,0.9)";
    for (let i = 0; i < 6; i++) { const s = (t * 0.9 + ph + i / 6) % 1, z = h * 4 * s * (1 - s) + 0.04, r = reach * s, [x, y] = P(u0 + Math.cos(ang) * r, v0 + Math.sin(ang) * r, z); c.beginPath(); c.arc(x, y, 1.1, 0, 6.3); c.fill(); }
  };
  const [bx, by] = P(u, v, 0);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.2832 + 0.2, r0 = 0.85 * SC; stream(u + Math.cos(a) * r0, v + Math.sin(a) * r0, 0.55 + 0.18 * Math.sin(t * 2.2 + i), 0.45 * SC, a + Math.PI, 1.3, i * 0.13); }
  for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.2832; stream(u, v, 1.0 + 0.28 * Math.sin(t * 2.6 + i), (0.55 + 0.1 * Math.sin(t * 2.6 + i)) * SC, a, 1.5, i * 0.17); }
  // central column
  const H = 2.2 + 0.3 * Math.sin(t * 2.1) + 0.15 * Math.sin(t * 5.3);
  const [, ty] = P(u, v, H);
  for (const [lw, col] of [[11, "rgba(40,100,120,0.5)"], [8, "rgba(240,252,255,0.95)"]]) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(bx, by - 2); c.lineTo(bx, ty); c.stroke(); }
  c.strokeStyle = "rgba(255,255,255,0.9)"; c.lineWidth = 2; c.beginPath(); c.moveTo(bx - 1.6, by); c.lineTo(bx - 2.2, ty + 8); c.stroke();
  // plume + falling spray at the head
  for (let i = 0; i < 16; i++) {
    const s = (t * 1.3 + i * 0.173) % 1, a = i * 2.4, rr = (0.1 + s * 0.35) * SC, z = H * (0.92 - s * s * 0.55);
    const [x, y] = P(u + Math.cos(a) * rr, v + Math.sin(a) * rr, Math.max(0.05, z)); c.fillStyle = `rgba(250,255,255,${0.9 - s * 0.6})`; c.beginPath(); c.arc(x, y, 1.6 - s * 0.7, 0, 6.3); c.fill();
  }
  c.fillStyle = "rgba(255,255,255,0.8)"; c.beginPath(); c.arc(bx, ty, 5, 0, 6.3); c.fill(); c.strokeStyle = "rgba(60,130,150,0.6)"; c.lineWidth = 1; c.stroke();
  // mist where it lands
  for (let i = 0; i < 9; i++) { const ph = (t * 0.7 + i / 9) % 1, a = i * 0.7, [x, y] = P(u + Math.cos(a) * 0.42 * SC, v + Math.sin(a) * 0.42 * SC, 0.08 + ph * 0.25); c.fillStyle = `rgba(255,255,255,${0.35 * (1 - ph)})`; c.beginPath(); c.arc(x, y, 3 + ph * 4, 0, 6.3); c.fill(); }
}


function picnic(k, px, t, seed, col) {
  const c = k.ctx, [u, v] = px;
  k.ground([[u - 0.55, v - 0.45], [u + 0.55, v - 0.45], [u + 0.55, v + 0.45], [u - 0.55, v + 0.45]], col, { lw: 1.2 });
  k.ground([[u - 0.45, v - 0.35], [u + 0.45, v - 0.35], [u + 0.45, v + 0.35], [u - 0.45, v + 0.35]], null, { stroke: "rgba(255,255,255,0.7)", lw: 1 });
  // basket + plates
  const [bx, by] = P(u + 0.05, v + 0.02, 0);
  c.fillStyle = "#c68a4a"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.roundRect(bx - 5, by - 6, 10, 6, 1.5); c.fill(); c.stroke();
  for (const [du, dv, cc] of [[-0.18, -0.12, "#ffffff"], [0.2, 0.18, "#f4c542"], [0.18, -0.2, "#e8607a"]]) { const [x, y] = P(u + du, v + dv, 0); c.fillStyle = cc; c.beginPath(); c.ellipse(x, y, 3.2, 1.7, 0, 0, 6.3); c.fill(); c.stroke(); }
  return [u, v];
}
function picnicPeople(k, px, t, seed) {
  const [u, v] = px;
  const spots = [[-0.32, -0.15, [1, 0.3]], [0.3, -0.2, [-0.5, 0.8]], [-0.3, 0.2, [0.8, -0.2]], [0.32, 0.22, [-1, -0.2]]];
  spots.forEach(([du, dv, dir], i) => k.qperson(u + du, v + dv, { pose: "sitground", dir, seed: seed + i, gesture: (i + seed) % 2 === 0, scale: i === 3 ? 0.58 : 0.78, ...look(seed + i), shadow: true }));
}


// ---------- layout (all in u,v) ----------
const rim = (pts, w) => ribbon(pts, w);
const WALKS = [
  rim([[0.95, 5.2], [3, 5.2], [5, 5.2], [7, 5.2], [9.05, 5.2]], 0.95),             // promenade in front of the gallery
  rim([[1.2, 5.2], [1.2, 7.2], [1.2, 9.2], [3, 9.25], [5, 9.25], [7, 9.25], [8.8, 9.2], [8.8, 7.2], [8.8, 5.2]], 0.8), // ring
  rim([[1.2, 7.2], [2.4, 7.2], [3.5, 7.2]], 0.8), rim([[6.5, 7.2], [7.6, 7.2], [8.8, 7.2]], 0.8), // cross paths
  rim([[5, 4.7], [5, 5.2], [5, 5.6]], 1.1),                                          // gallery door to plaza
  rim([[1.0, 2.45], [2.6, 2.45], [3.2, 2.45]], 0.8),                                  // back lawn path
];
const ov = (cx, cy, rx, ry, n = 14) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * 6.2832) * rx, cy + Math.sin(i / n * 6.2832) * ry]);
const BEDS = [
  [ov(2.9, 5.95, 0.55, 0.16), "pink", 1], [ov(7.1, 5.95, 0.55, 0.16), "warm", 2],
  [ov(2.4, 6.35, 0.5, 0.3), "rose", 3], [ov(7.6, 8.3, 0.55, 0.32), "pink", 4],
  [ov(2.4, 8.35, 0.5, 0.3), "white", 5], [ov(7.6, 6.3, 0.5, 0.3), "warm", 6],
  [ov(1.5, 3.9, 0.45, 0.8), "pink", 7], [ov(9.1, 4.0, 0.35, 0.8), "rose", 8],
  [ov(4.2, 1.7, 0.9, 0.35), "warm", 9], [ov(6.2, 1.7, 0.9, 0.35), "pink", 10],
  [ov(2.1, 1.1, 0.5, 0.3), "rose", 11], [ov(8.2, 1.2, 0.5, 0.3), "white", 12],
];
const PALMS = [ // u, v, trunk h, lean, seed
  [1.2, 1.0, 2.4, 0.15, 1], [3.1, 1.2, 2.6, -0.15, 2], [5.2, 0.8, 2.8, 0.1, 3], [7.2, 1.2, 2.5, -0.2, 4], [8.9, 0.9, 2.6, 0.2, 5],
  [1.0, 3.3, 2.5, 0.15, 6], [9.3, 3.2, 2.5, -0.2, 7], [1.9, 5.8, 2.3, 0.2, 8], [8.1, 5.8, 2.3, -0.2, 9], [2.0, 7.9, 2.2, 0.2, 10], [8.0, 7.9, 2.2, -0.2, 11],
];
const FLTREES = [[[1.9, 2.8], 0.7, 1.6, 1, "#e0803a"], [[8.5, 2.6], 0.72, 1.6, 2, "#e0803a"], [[2.6, 9.15], 0.42, 0.9, 3, "#86b05a"], [[7.5, 9.15], 0.42, 0.9, 4, "#d9604a"]];
const LAMPS = [[2.0, 5.65], [4.0, 5.65], [6.0, 5.65], [8.0, 5.65], [1.7, 7.7], [8.3, 7.7], [1.7, 8.7], [8.3, 8.7], [3.5, 2.0], [6.5, 2.0]];
const BENCHES = [[[2.2, 7.85], "u", 211], [[7.4, 7.85], "u", 212], [[1.7, 6.0], "v", 213], [[8.3, 6.0], "v", 214], [[2.8, 3.0], "u", 215]];

function jogRoute() { return [[1.2, 5.4], [1.2, 7.0], [1.2, 8.8], [2.5, 9.25], [4.0, 9.25]]; }

export default function draw(k, t) {
  const c = k.ctx;
  // ---------- ground ----------
  k.groundTrace({ lawn: [[[0.7, 0.7], [9.3, 0.7], [9.3, 9.3], [0.7, 9.3]]], water: [] }, { lawn: "#8cb94b", paved: "#f1e0bc", side: "#ecd9b2", tufts: 14 });
  c.save(); k._trace([P(0.3, 0.3), P(9.7, 0.3), P(9.7, 9.7), P(0.3, 9.7)], true, 0); c.clip();
  for (const w of WALKS) k.ground(w, "#f1e0bc", { lw: 1.3 });
  c.restore();
  fountainGround(k); fountainWater(k, t);
  FR.shadow(k);

  BEDS.forEach(([pts, m, seed]) => { let d = 0; for (const [u, v] of pts) d = Math.max(d, u + v); k.q(d - 0.3, () => bed(k, pts, m, seed, t)); });

  // ---------- the Frame: three depth-sorted solids ----------
  FR.parts(k, t);

  // ---------- palms, trees, lamps, benches ----------
  for (const [u, v, h, lean, seed] of PALMS) k.q(u + v, () => dpalm(k, u, v, { h: h * 1.1, lean, seed }));
  for (const [[u, v], r, h, seed, col] of FLTREES) k.q(u + v, () => { k.tree(u, v, { r, h, seed, col, lobes: undefined });
    if (col !== "#86b05a") { const R = rng(seed * 11), [cx, cy] = P(u, v, h), RR = r * 47; for (let i = 0; i < 34; i++) { const a = R() * 6.3, d = Math.sqrt(R()) * RR * 0.95, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.85 - RR * 0.2; c.fillStyle = ["#e34a36", "#f2b83a", "#d9382e", "#f08a3a"][i % 4]; c.beginPath(); c.arc(x, y, 2.4 + R() * 1.4, 0, 6.3); c.fill(); } } });
  for (const [u, v] of LAMPS) k.q(u + v, () => k.lamp(u, v, { col: "#2b2a28", lit: 0.6 + 0.2 * Math.sin(t * 1.3 + u) }));
  for (const [[u, v], al] of BENCHES) k.q(u + v, () => k.bench(u, v, { along: al }));
  k.q(FC[0] + FC[1] + 1.4, () => jets(k, t));

  // seated on benches
  BENCHES.slice(0, 4).forEach(([[u, v], al, seed], i) => {
    const du = al === "u" ? 0.42 : 0.12, dv = al === "u" ? 0.12 : 0.42;
    k.qperson(u + du, v + dv, { pose: "sit", seatZ: 0.3, dir: al === "u" ? [0.1, 1] : [1, 0.1], seed, scale: 0.78, ...look(seed), shadow: false });
    if (i === 1) k.qperson(u + 0.18, v + 0.32, { pose: "sit", seatZ: 0.3, dir: [0.1, 1], seed: seed + 9, scale: 0.78, ...look(seed + 5), shadow: false });
  });

  // ---------- picnics on the lawns ----------
  [[[2.3, 4.0 + 2.5], "#eaa0ae", 1], [[7.7, 7.0], "#8fc0dc", 2], [[2.2, 8.6 - 0.05], "#e9a1a8", 3], [[8.2, 2.1], "#f1d98a", 4]].forEach(([px, col, seed]) => {
    const [u, v] = px;
    k.q(u + v - 0.4, () => picnic(k, px, t, seed, col));
    k.q(u + v + 0.2, () => picnicPeople(k, px, t, 220 + seed * 7));
  });

  // ---------- walkers ----------
  const route = {
    prom: [[1.2, 5.1], [3, 5.1], [5, 5.15], [7, 5.1], [8.8, 5.1]],
    prom2: [[1.5, 5.35], [3.2, 5.35], [4.6, 5.45], [6.8, 5.35], [8.5, 5.35]],
    ringL: [[1.2, 5.4], [1.2, 7.2], [1.2, 9.0], [2.6, 9.3], [4.0, 9.3]],
    ringB: [[4.0, 9.3], [5.5, 9.3], [7.0, 9.3], [8.8, 9.0], [8.8, 7.2], [8.8, 5.4]],
    crossL: [[1.3, 7.2], [2.4, 7.2], [3.3, 7.2]],
    crossR: [[6.7, 7.2], [7.7, 7.2], [8.7, 7.2]],
    door: [[5.0, 4.85], [5.0, 5.3], [5.0, 5.7]],
    back: [[1.0, 2.45], [2.2, 2.45], [3.4, 2.45]],
    ringA: circlePoly(FC[0], FC[1], 1.55, 24),
    ringB2: circlePoly(FC[0], FC[1], 1.68, 24).reverse(),
    jog: jogRoute(),
  };
  const W = (r, off, seed, sp, ex = {}) => k.qwalker(route[r], { speed: sp ?? 0.4 + (seed % 5) * 0.03, offset: off, seed, dwell: 1.2 + (seed % 3) * 0.6, ...look(seed), scale: 0.8, ...ex });
  W("prom", 0.0, 21); W("prom", 0.5, 22, 0.42); W("prom2", 0.25, 23, 0.36); W("prom2", 0.8, 24, 0.38);
  W("ringL", 0.0, 25); W("ringL", 0.55, 26, 0.34, { kid: true, scale: 0.58 });
  W("ringB", 0.2, 27); W("ringB", 0.7, 28, 0.38);
  W("crossL", 0.1, 29); W("crossR", 0.6, 30);
  W("door", 0.0, 31, 0.3); W("door", 0.55, 32, 0.3);
  W("ringA", 0.0, 35, 0.5, { loop: true }); W("ringA", 0.5, 36, 0.5, { loop: true }); W("ringB2", 0.25, 37, 0.45, { loop: true, dwell: 0 });
  // back lawn walkers stay behind the frame in draw order
  { const o = { speed: 0.36, offset: 0.2, seed: 61, dwell: 1.4, ...look(61), scale: 0.8 }; const s = k.walkerState(route.back, o); k.q(Math.min(s.u + s.v, 7.0), () => k.walker(route.back, o)); }
  // jogger + cyclists
  k.qwalker(route.jog, { speed: 0.95, offset: 0.1, seed: 41, stride: 1.5, style: "tee", shorts: true, dwell: 0.3 });
  k.qcyclist(route.prom, { speed: 1.0, offset: 0.4, seed: 42, col: "#c8403a", basket: false });
  k.qcyclist(route.ringB, { speed: 0.9, offset: 0.8, seed: 43, col: "#3f73b5" });
  // standing groups
  [[[5.9, 6.05], "photo", [0, 1], 51], [[6.1, 6.25], "stand", [0.2, 1], 52], [[4.2, 5.8], "stand", [0.2, 1], 53], [[3.4, 6.0], "stand", [1, 0.3], 54],
    [[2.9, 6.6], "stand", [1, 0.3], 55], [[7.2, 6.7], "wave", [0.3, 1], 56], [[8.4, 7.7], "stand", [0.2, 1], 57], [[8.55, 7.55], "stand", [0.2, 1], 58], [[1.5, 8.3], "stand", [0.3, 1], 59], [[1.65, 8.4], "stand", [0.3, 1], 60]].forEach(([[u, v], pose, dir, seed]) => {
    k.qperson(u, v, { pose, dir, seed, scale: seed % 4 === 0 ? 0.6 : 0.8, ...look(seed) });
  });
  { const [u, v] = [8.2, 5.7]; k.q(u + v, () => { const [x, y] = P(u, v, 0); c.strokeStyle = INK; c.lineWidth = 1.6; c.fillStyle = "#3d4a5c"; c.beginPath(); c.roundRect(x - 7, y - 14, 14, 9, 3); c.fill(); c.stroke(); for (const dx of [-5, 5]) { c.fillStyle = "#222"; c.beginPath(); c.arc(x + dx, y - 2, 2.6, 0, 6.3); c.fill(); } }); }

  k.flush();
  k.circlingBird(480, 150, 70, 24, { speed: 0.7, phase: 0 });
  k.circlingBird(480, 150, 70, 24, { speed: 0.7, phase: 0.6, size: 0.8 });
}
