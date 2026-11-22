// DUBAI · 1,-1 · Museum of the Future & Metro (grid pass: everything through P(u,v,z), inside the 10x10 footprint)
// Layout (u,v):
//   green mound u 0.5-7.7, v 0.5-6.0 (top z 0.8); the Museum is an upright elliptical torus in the u-z plane standing on it
//   (centre 4.1,3.3, z 3.55); lobby glass cut into the mound's front slope; palms/bushes/lamps on the mound.
//   Metro viaduct along v at u 8.2-9.0 (deck z 1.35-1.75): portal block at v 0.65-1.4, Y-piers, gold-shell station v 6.4-9.3.
//   The train shuttles portal <-> station and is cut exactly at the portal face, so it never pops.
//   Plaza (front half): palms, lamps, benches, flower beds, 25+ people.
import { P, CTS, INK, shade, lerp, clamp, rng } from "../../lib/vec-kit.js";
import { look, dpalm, makeMuseum, makeShell, rrect, elev, drawTrain } from "./_g1_-1.js";
import { bedPoly, balloon, inPoly } from "./_t1_-1.js";

export const camera = { u: 4.4, v: 4.4, z: 2.6, zoom: 1.3 };

const MUS = makeMuseum();
const SHELL = makeShell();
const MZ = 0.8; // mound height
const TOP = rrect(1.2, 7.0, 1.2, 5.3, 0.9), BASE = rrect(0.5, 7.7, 0.5, 6.0, 1.3);
const SX = CTS.S * CTS.ZS, SY = CTS.S * CTS.YS, VIEW = (() => { const d = [1, 1, SX / SY], l = Math.hypot(...d); return d.map((x) => x / l); })();

const hx = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mxc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rg = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const tr = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };

// ---------------------------------------------------------------- layout tables
const DECK = { u: 8.2, w: 0.8, z0: 1.35, z1: 1.75, v0: 1.4, v1: 6.4 }, TRK = 8.6, PORTAL = { u: 8.0, du: 1.2, v: 0.65, dv: 0.75, h: 2.9 };
const ST = { u: 7.5, du: 2.0, v: 6.4, dv: 2.9 };
const PIERS = [2.7, 4.7];

const BEDS = [ // [polygon u,v], seed, palette
  [[[2.4, 8.85], [6.3, 8.85], [6.3, 9.45], [2.4, 9.45]], 11],
  [[[0.5, 8.5], [1.6, 8.5], [1.6, 9.45], [0.5, 9.45]], 12],
  [[[9.15, 1.1], [9.65, 1.1], [9.65, 5.6], [9.15, 5.6]], 13],
  [[[6.6, 8.85], [7.2, 8.85], [7.2, 9.45], [6.6, 9.45]], 14],
  [[[0.5, 7.6], [1.3, 7.6], [1.3, 8.2], [0.5, 8.2]], 15],
];
const MPALMS = [ // on the mound: u, v, h, lean, seed, behind-the-ring?
  [2.4, 1.9, 2.3, 0.15, 1, true], [3.7, 1.6, 2.7, -0.1, 2, true], [5.5, 2.0, 2.4, 0.2, 3, true], [6.3, 1.5, 2.2, -0.15, 4, true],
  [1.7, 4.6, 2.0, 0.2, 5, false], [6.5, 4.7, 2.2, -0.2, 6, false],
];
const PALMS = [[1.3, 6.95, 2.3, 0.15, 21], [3.5, 6.95, 2.5, -0.15, 22], [5.7, 6.95, 2.4, 0.2, 23], [6.8, 8.1, 2.6, -0.1, 24], [0.7, 8.3, 2.3, 0.2, 25], [7.2, 0.9, 2.4, 0.1, 27]];
const LAMPS = [[2.4, 6.95], [4.6, 6.95], [6.6, 6.95], [3.5, 8.45], [6.2, 8.45], [7.1, 9.5 - 0.35], [1.8, 8.45]];
const BENCHES = [[[2.6, 7.75], "u", 211], [[4.4, 7.75], "u", 212], [[5.2, 8.05], "u", 213]];

// ---------------------------------------------------------------- mound
function mound(k, t) {
  const c = k.ctx, n = TOP.length;
  // walls: sloped grass between base outline (z 0) and top outline (z MZ)
  const cu = 4.1, cv = 3.25, walls = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, b0 = [...BASE[i], 0], b1 = [...BASE[j], 0], t1 = [...TOP[j], MZ], t0 = [...TOP[i], MZ];
    const e = [b1[0] - b0[0], b1[1] - b0[1], 0], s = [t0[0] - b0[0], t0[1] - b0[1], MZ];
    let nn = [e[1] * s[2] - e[2] * s[1], e[2] * s[0] - e[0] * s[2], e[0] * s[1] - e[1] * s[0]];
    const out = [(b0[0] + b1[0]) / 2 - cu, (b0[1] + b1[1]) / 2 - cv, 0]; if (nn[0] * out[0] + nn[1] * out[1] > 0 === false) nn = nn.map((x) => -x);
    const l = Math.hypot(...nn) || 1; nn = nn.map((x) => x / l);
    if (nn[0] * VIEW[0] + nn[1] * VIEW[1] + nn[2] * VIEW[2] <= 0) continue;
    walls.push({ i, j, b0, b1, t1, t0, lam: clamp(nn[0] * 0.12 + nn[1] * 0.42 + nn[2] * 0.9) , d: (b0[0] + b0[1] + b1[0] + b1[1]) / 2 });
  }
  walls.sort((p, q) => p.d - q.d);
  const G0 = hx("#6f9c3e"), G1 = hx("#b2cc6c");
  for (const w of walls) {
    const quad = [P(...w.b0), P(...w.b1), P(...w.t1), P(...w.t0)];
    const g = c.createLinearGradient(0, Math.max(quad[0][1], quad[1][1]), 0, Math.min(quad[2][1], quad[3][1]));
    const base = mxc(G0, G1, clamp(w.lam * 0.9 - 0.15)); g.addColorStop(0, rg(mxc(base, hx("#9aac68"), 0.4))); g.addColorStop(1, rg(mxc(base, G1, 0.35)));
    tr(c, quad); c.fillStyle = g; c.fill(); c.strokeStyle = rg(base); c.lineWidth = 0.8; c.stroke();
    // pale kerb at the foot
    const f = 0.13, k0 = [lerp(w.b0[0], w.t0[0], f), lerp(w.b0[1], w.t0[1], f), MZ * f], k1 = [lerp(w.b1[0], w.t1[0], f), lerp(w.b1[1], w.t1[1], f), MZ * f];
    tr(c, [P(...w.b0), P(...w.b1), P(...k1), P(...k0)]); c.fillStyle = "#f7edd2"; c.fill();
    // grass blades along the slope
    const R = rng(w.i * 7 + 3); c.strokeStyle = "rgba(55,90,30,0.45)"; c.lineWidth = 0.8; c.beginPath();
    for (let m = 0; m < 5; m++) { const a = R(), b = 0.25 + R() * 0.6, u = lerp(lerp(w.b0[0], w.b1[0], a), lerp(w.t0[0], w.t1[0], a), b), v = lerp(lerp(w.b0[1], w.b1[1], a), lerp(w.t0[1], w.t1[1], a), b), [x, y] = P(u, v, MZ * b); c.moveTo(x - 1.5, y); c.lineTo(x - 0.5, y - 3); }
    c.stroke();
  }
  // outline of the foot (visible arcs) and the top rim
  c.strokeStyle = INK; c.lineWidth = 1.7; c.lineJoin = "round";
  for (const w of walls) { c.beginPath(); c.moveTo(...P(...w.b0)); c.lineTo(...P(...w.b1)); c.stroke(); }
  // top face
  const topPx = TOP.map(([u, v]) => P(u, v, MZ));
  const gr = c.createLinearGradient(...P(1.2, 1.2, MZ), ...P(7, 5.3, MZ)); gr.addColorStop(0, "#b3cf6c"); gr.addColorStop(0.5, "#92b955"); gr.addColorStop(1, "#78a244");
  tr(c, topPx); c.fillStyle = gr; c.fill();
  c.save(); tr(c, topPx); c.clip();
  // mowing contours that follow the mound
  c.strokeStyle = "rgba(235,246,175,0.32)"; c.lineWidth = 1.5;
  for (let i = 1; i <= 4; i++) { const s = 0.28 * i; c.beginPath(); rrect(1.2 + s, 7.0 - s, 1.2 + s, 5.3 - s, Math.max(0.2, 0.9 - s * 0.6), 6).forEach(([u, v], m) => { const [x, y] = P(u, v, MZ); m ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); c.stroke(); }
  const R = rng(5); c.strokeStyle = "rgba(55,90,30,0.55)"; c.lineWidth = 0.9; c.lineCap = "round"; c.beginPath();
  for (let i = 0; i < 520; i++) { const u = lerp(1.2, 7, R()), v = lerp(1.2, 5.3, R()); if (!inPoly([u, v], TOP)) continue; const [x, y] = P(u, v, MZ), sw = Math.sin(t * 1.3 + x * 0.05) * 0.7; c.moveTo(x - 2, y); c.lineTo(x - 0.8 + sw, y - 3); c.moveTo(x, y); c.lineTo(x + sw, y - 3.8); }
  c.stroke();
  // pale winding path along the front of the top
  const path = [[1.7, 4.55], [3.0, 4.75], [4.3, 4.85], [5.6, 4.75], [6.4, 4.5]];
  c.lineCap = "round"; c.lineJoin = "round"; c.strokeStyle = INK; c.lineWidth = 14; c.beginPath(); path.forEach(([u, v], i) => { const [x, y] = P(u, v, MZ); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke();
  c.strokeStyle = "#f4e6c4"; c.lineWidth = 11; c.stroke();
  c.restore();
  c.strokeStyle = INK; c.lineWidth = 1.7; tr(c, topPx); c.stroke();
  c.save(); c.translate(0, -1.4); c.strokeStyle = "#f7efd2"; c.lineWidth = 2; c.beginPath(); topPx.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.stroke(); c.restore();
  MUS.shadow(k, MZ);
}

// glass lobby band cut into the mound's front slope (plane v = 6.0 - 0.875 z) and a short one on the right slope
function lobbyBand(k, t, face, a0, a1, seed) {
  const c = k.ctx, z0 = 0.1, z1 = 0.62;
  const S = face === "L" ? (a, z) => P(a, 6.0 - (0.7 / MZ) * z, z) : (a, z) => P(7.7 - (0.7 / MZ) * z, a, z);
  const poly = [S(a0, z0), S(a1, z0), S(a1, z1), S(a0, z1)];
  const g = c.createLinearGradient(0, poly[0][1], 0, poly[3][1]); g.addColorStop(0, "#d8c08a"); g.addColorStop(0.45, "#7aa3b8"); g.addColorStop(1, "#3d5f77");
  tr(c, poly); c.fillStyle = g; c.fill();
  c.save(); tr(c, poly); c.clip();
  c.strokeStyle = "rgba(255,238,180,0.6)"; c.lineWidth = 2; c.beginPath(); c.moveTo(...S(a0, z1 - 0.07)); c.lineTo(...S(a1, z1 - 0.07)); c.stroke();
  const R = rng(seed); // visitors inside
  for (let i = 0; i < Math.round((a1 - a0) * 3.2); i++) { const a = lerp(a0 + 0.1, a1 - 0.1, (i + R() * 0.6) / ((a1 - a0) * 3.2)) + Math.sin(t * 0.5 + i * 1.7) * 0.05, [x, y] = S(a, z0 + 0.04); c.fillStyle = "rgba(38,48,60,0.5)"; c.beginPath(); c.arc(x, y - 11, 2.3, 0, 6.3); c.fill(); c.fillRect(x - 2.3, y - 9, 4.6, 9); }
  c.strokeStyle = "rgba(25,35,45,0.85)"; c.lineWidth = 1; c.beginPath();
  for (let a = a0; a <= a1 + 0.01; a += 0.3) { c.moveTo(...S(a, z0)); c.lineTo(...S(a, z1)); }
  c.moveTo(...S(a0, 0.36)); c.lineTo(...S(a1, 0.36)); c.stroke();
  const sw = a0 + (((t * 0.35) % 1.5) - 0.2) * (a1 - a0), gg = c.createLinearGradient(...S(sw - 0.4, 0.3), ...S(sw + 0.4, 0.3)); gg.addColorStop(0, "rgba(255,255,255,0)"); gg.addColorStop(0.5, "rgba(255,255,255,0.35)"); gg.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = gg; c.fillRect(Math.min(...poly.map((p) => p[0])), Math.min(...poly.map((p) => p[1])) - 2, 400, 60);
  c.restore();
  tr(c, poly); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
  // concrete lip above
  const lip = [S(a0 - 0.05, z1), S(a1 + 0.05, z1), S(a1 + 0.05, z1 + 0.09), S(a0 - 0.05, z1 + 0.09)]; tr(c, lip); c.fillStyle = "#efe4cd"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
}

// ---------------------------------------------------------------- shrubs and flowers (anchored with P at a height)
const FLOW = ["#e0457a", "#f06ba8", "#f58bbd", "#ffffff", "#d93a86"];
function bushAt(k, u, v, z, r, seed, col = "#6f9f45") {
  const c = k.ctx, [x, y] = P(u, v, z); c.fillStyle = "rgba(50,70,30,0.2)"; c.beginPath(); c.ellipse(x + 3, y + r * 0.45, r, r * 0.4, 0, 0, 6.3); c.fill();
  k._lobe(x, y - r * 0.3, r, col, seed, { squash: 0.85, lw: 1.1 });
}
function blossomsAt(k, u, v, z, ru, rv, seed, n = 30) {
  const c = k.ctx, R = rng(seed);
  for (let i = 0; i < n; i++) {
    const a = R() * 6.283, d = Math.sqrt(R()), [fx, fy] = P(u + Math.cos(a) * d * ru, v + Math.sin(a) * d * rv, z), pr = 2 + R() * 1.5, sw = Math.sin(k.t * 1.2 + i) * 0.5;
    c.fillStyle = "#4f8238"; c.beginPath(); c.arc(fx + sw, fy + 2, pr * 1.2, 0, 6.3); c.fill();
    c.fillStyle = FLOW[Math.floor(R() * FLOW.length)];
    for (let q = 0; q < 5; q++) { const b = (q / 5) * 6.28; c.beginPath(); c.arc(fx + sw + Math.cos(b) * pr * 0.9, fy + Math.sin(b) * pr * 0.9, pr * 0.7, 0, 6.3); c.fill(); }
    c.fillStyle = "#f6e08a"; c.beginPath(); c.arc(fx + sw, fy, pr * 0.4, 0, 6.3); c.fill();
  }
}

// ---------------------------------------------------------------- viaduct, portal, station
function portal(k, t) {
  const c = k.ctx, { u, du, v, dv, h } = PORTAL, fv = v + dv;
  k.box(u, v, 0, du, dv, h, "#e4d7bc");
  const F = (a, z) => P(a, fv, z);
  // arch opening on the left face
  const a0 = TRK - 0.36, a1 = TRK + 0.36, zb = DECK.z1, zt = 2.55, pts = [F(a0, zb), F(a1, zb), F(a1, zt)];
  for (let i = 1; i < 8; i++) { const a = (i / 8) * Math.PI; pts.push(F(TRK + Math.cos(a) * 0.36, zt + Math.sin(a) * 0.36)); }
  pts.push(F(a0, zt));
  const g = c.createLinearGradient(...F(TRK, zb), ...F(TRK, zt + 0.4)); g.addColorStop(0, "#3a4650"); g.addColorStop(1, "#14181c"); k.path(pts, { fill: g, lw: 1.6, wobble: 0 });
  // teal band + sign
  k.poly([[u, fv, 2.95], [u + du, fv, 2.95], [u + du, fv, 3.25], [u, fv, 3.25]], "#18a5c8", { lw: 1.2, wobble: 0 });
  c.save(); const [ox, oy] = P(u + 0.18, fv, 3.0); c.translate(ox, oy); c.transform(CTS.S / 100, SY / 100, 0, SX / 100, 0, 0); c.font = "700 20px sans-serif"; c.fillStyle = "#fff"; c.fillText("METRO", 0, 0); c.restore();
  // roof cap
  k.box(u - 0.06, v - 0.06, h, du + 0.12, dv + 0.12, 0.1, "#efe4cd", { shadow: false });
}

function pier(k, v) {
  k.box(8.4, v, 0, 0.4, 0.5, 1.0, "#e6d9bc");
  k.box(7.95, v - 0.05, 1.0, 1.3, 0.6, 0.35, "#e9dcc3", { shadow: false });
  // flare between head and column
  k.poly([[8.4, v + 0.5, 1.0], [8.8, v + 0.5, 1.0], [8.95, v + 0.55, 1.1], [8.25, v + 0.55, 1.1]], "#cdbd9d", { lw: 0.01, stroke: false, wobble: 0 });
}

function deck(k, t) {
  const { u, w, z0, z1, v0, v1 } = DECK;
  k.box(u, v0, z0, w, v1 - v0, z1 - z0, "#e9dcc3", { shadow: false });
  // fascia underside shadow + top kerbs, rails, sleepers
  k.poly([[u + w, v0, z0], [u + w, v1, z0], [u + w, v1, z0 + 0.12], [u + w, v0, z0 + 0.12]], "#d6c6a6", { lw: 0.01, stroke: false, wobble: 0 });
  rails(k, v0, v1);
  // guideway shadow on the paving, falling toward +u
  k.poly([[u + w, v0, 0], [u + w + 0.7, v0 + 0.15, 0], [u + w + 0.7, v1 + 0.15, 0], [u + w, v1, 0]], "rgba(110,80,50,0.12)", { stroke: false });
}
function rails(k, v0, v1) {
  const c = k.ctx; c.lineCap = "round";
  k.poly([[DECK.u + 0.1, v0, DECK.z1 + 0.005], [DECK.u + DECK.w - 0.1, v0, DECK.z1 + 0.005], [DECK.u + DECK.w - 0.1, v1, DECK.z1 + 0.005], [DECK.u + 0.1, v1, DECK.z1 + 0.005]], "#cfc4af", { lw: 0.01, stroke: false, wobble: 0 });
  for (const d of [TRK - 0.17, TRK + 0.17]) { c.strokeStyle = "#5a5148"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(...P(d, v0, DECK.z1 + 0.02)); c.lineTo(...P(d, v1, DECK.z1 + 0.02)); c.stroke(); c.strokeStyle = "#e9e7e2"; c.lineWidth = 0.7; c.stroke(); }
  c.strokeStyle = "rgba(60,50,40,0.45)"; c.lineWidth = 0.8; c.beginPath(); for (let s = v0 + 0.1; s < v1; s += 0.22) { c.moveTo(...P(TRK - 0.24, s, DECK.z1 + 0.015)); c.lineTo(...P(TRK + 0.24, s, DECK.z1 + 0.015)); } c.stroke();
}

function station(k, t) {
  const c = k.ctx, { u, du, v, dv } = ST, fv = v + dv, ru = u + du;
  k.box(u, v, 0, du, dv, DECK.z1, "#d9e3e6", { shadow: false });
  // glass lobby on the left (v+) face and right (u+) face, below the platform slab
  const glass = (S, a0, a1, seed) => {
    const z0 = 0.12, z1 = 1.25, poly = [S(a0, z0), S(a1, z0), S(a1, z1), S(a0, z1)];
    const g = c.createLinearGradient(0, poly[0][1], 0, poly[3][1]); g.addColorStop(0, "#d9c28a"); g.addColorStop(0.5, "#6f9bb2"); g.addColorStop(1, "#3d5f77");
    tr(c, poly); c.fillStyle = g; c.fill(); c.save(); tr(c, poly); c.clip();
    const R = rng(seed); for (let i = 0; i < 6; i++) { const a = lerp(a0 + 0.1, a1 - 0.1, R()) + Math.sin(t * 0.6 + i * 2) * 0.04, [x, y] = S(a, z0 + 0.03); c.fillStyle = "rgba(34,44,58,0.5)"; c.beginPath(); c.arc(x, y - 15, 2.6, 0, 6.3); c.fill(); c.fillRect(x - 2.6, y - 12.5, 5.2, 12.5); }
    c.strokeStyle = "rgba(25,35,45,0.85)"; c.lineWidth = 1; c.beginPath(); for (let a = a0; a <= a1 + 0.01; a += (a1 - a0) / Math.round((a1 - a0) / 0.28)) { c.moveTo(...S(a, z0)); c.lineTo(...S(a, z1)); } c.moveTo(...S(a0, 0.7)); c.lineTo(...S(a1, 0.7)); c.stroke();
    const sx = a0 + (((t * 0.4 + seed * 0.2) % 1.5) - 0.25) * (a1 - a0), gg = c.createLinearGradient(...S(sx - 0.3, 0.6), ...S(sx + 0.3, 0.6)); gg.addColorStop(0, "rgba(255,255,255,0)"); gg.addColorStop(0.5, "rgba(255,255,255,0.4)"); gg.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = gg; c.fillRect(Math.min(...poly.map((p) => p[0])), Math.min(...poly.map((p) => p[1])), 300, 100);
    c.restore(); tr(c, poly); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
  };
  glass((a, z) => P(a, fv, z), u + 0.15, ru - 0.15, 3);
  glass((a, z) => P(ru, a, z), v + 0.15, fv - 0.15, 5);
  // platform slab edge band + sign
  k.poly([[u, fv, 1.35], [ru, fv, 1.35], [ru, fv, DECK.z1], [u, fv, DECK.z1]], "#efe4cd", { lw: 1.2, wobble: 0 });
  k.poly([[ru, v, 1.35], [ru, fv, 1.35], [ru, fv, DECK.z1], [ru, v, DECK.z1]], "#d8cbb0", { lw: 1.2, wobble: 0 });
  c.save(); const [ox, oy] = P(u + 0.55, fv, 1.46); c.translate(ox, oy); c.transform(CTS.S / 100, SY / 100, 0, SX / 100, 0, 0); c.font = "700 17px sans-serif"; c.fillStyle = "#18a5c8"; c.fillText("METRO", 0, 0); c.restore();
  // platform floor, rails continue
  k.poly([[u, v, DECK.z1], [ru, v, DECK.z1], [ru, fv, DECK.z1], [u, fv, DECK.z1]], "#dcd0b8", { lw: 1.2, wobble: 0 });
  rails(k, v, fv - 0.15);
  // platform edge line + a few waiting passengers
  k.poly([[u + 0.1, v, DECK.z1 + 0.003], [u + 0.18, v, DECK.z1 + 0.003], [u + 0.18, fv, DECK.z1 + 0.003], [u + 0.1, fv, DECK.z1 + 0.003]], "#f0c94a", { lw: 0.01, stroke: false, wobble: 0 });
  k.poly([[ru - 0.18, v, DECK.z1 + 0.003], [ru - 0.1, v, DECK.z1 + 0.003], [ru - 0.1, fv, DECK.z1 + 0.003], [ru - 0.18, fv, DECK.z1 + 0.003]], "#f0c94a", { lw: 0.01, stroke: false, wobble: 0 });
}

// train head position: 0-1.5 s hidden in the portal, glide out to the station, dwell, reverse back in
function trainHead(t) {
  const T = 20, ph = ((t % T) + T) % T, ease = (x) => x * x * (3 - 2 * x), VH = 1.4, VS = 7.95;
  let p = 0;
  if (ph < 1.5) p = 0; else if (ph < 7.5) p = ease((ph - 1.5) / 6); else if (ph < 12) p = 1; else if (ph < 18) p = 1 - ease((ph - 12) / 6);
  return VH + (VS - VH) * p;
}

// ---------------------------------------------------------------- draw
export default function draw(k, t) {
  const c = k.ctx;
  // ground
  k.groundTrace({ lawn: [], water: [] }, { paved: "#f3dfbd", side: "#ecd6ae" });
  c.save(); k._trace([P(0.3, 0.3), P(9.7, 0.3), P(9.7, 9.7), P(0.3, 9.7)], true, 0); c.clip();
  c.strokeStyle = "rgba(170,125,80,0.2)"; c.lineWidth = 0.8; c.beginPath();
  for (let i = 1; i < 20; i++) { const f = i * 0.5; c.moveTo(...P(f, 0)); c.lineTo(...P(f, 10)); c.moveTo(...P(0, f)); c.lineTo(...P(10, f)); }
  c.stroke(); c.restore();
  mound(k, t);
  lobbyBand(k, t, "L", 2.0, 6.2, 4);
  lobbyBand(k, t, "R", 2.2, 4.4, 9);

  // ---- behind the ring (seen through the hole)
  for (const [u, v, h, lean, seed, back] of MPALMS) if (back) { const [uu, vv] = elev(u, v, MZ); k.q(u + v - 100, () => dpalm(k, uu, vv, { h, lean, seed })); }
  k.q(-99, () => { for (const [u, v, r, s] of [[2.0, 1.6, 0.26, 1], [3.1, 1.4, 0.24, 2], [4.6, 1.5, 0.25, 3], [5.9, 1.7, 0.27, 4], [6.6, 2.2, 0.24, 5], [1.6, 2.4, 0.25, 6]]) bushAt(k, u, v, MZ, r * CTS.S * 0.9, 100 + s, s % 2 ? "#6f9f45" : "#82ad50"); blossomsAt(k, 4.0, 1.9, MZ, 0.8, 0.2, 31, 16); });
  k.q(-98, () => { const [uu, vv] = elev(4.5, 2.4, MZ); k.lamp(uu, vv, { col: "#2a2622", h: 1.25, lit: 0.8 }); });
  // ---- the Museum of the Future
  k.q(-50, () => MUS.draw(k, t));

  // ---- mound front: shrubs, flowers, side palms, lamps, walkers
  [[1.6, 3.9, 0.3], [2.6, 4.3, 0.27], [3.4, 5.15, 0.25], [4.6, 5.15, 0.26], [5.4, 4.2, 0.28], [6.2, 3.8, 0.3], [1.5, 5.0, 0.26], [6.9, 5.0, 0.26], [2.2, 3.0, 0.27], [6.7, 2.8, 0.27]].forEach(([u, v, r], i) => k.q(u + v, () => bushAt(k, u, v, MZ, r * CTS.S * 0.85, 40 + i, i % 3 === 0 ? "#76a64a" : i % 3 === 1 ? "#6a9a41" : "#82ad50")));
  [[2.6, 5.05, 1.1, 0.12, 71], [5.2, 5.0, 1.0, 0.1, 72], [6.4, 3.4, 0.5, 0.5, 73]].forEach(([u, v, ru, rv, sd]) => k.q(u + v + 0.2, () => blossomsAt(k, u, v, MZ, ru, rv, sd, 24)));
  for (const [u, v, h, lean, seed, back] of MPALMS) if (!back) { const [uu, vv] = elev(u, v, MZ); k.q(u + v, () => dpalm(k, uu, vv, { h, lean, seed })); }
  for (const [u, v] of [[1.9, 4.95], [6.4, 4.95]]) { const [uu, vv] = elev(u, v, MZ); k.q(u + v, () => k.lamp(uu, vv, { col: "#2a2622", h: 1.3, lit: 0.7 + 0.2 * Math.sin(t * 1.3 + u) })); }
  // on the mound: two walkers on the pale path, a couple on the lawn
  const mp = [[1.7, 4.55], [3.0, 4.75], [4.3, 4.85], [5.6, 4.75], [6.4, 4.5]];
  k.qwalker(mp, { speed: 0.34, offset: 0.1, seed: 301, dwell: 1.6, z: MZ, ...look(301), scale: 0.8 });
  k.qwalker(mp, { speed: 0.3, offset: 0.65, seed: 302, dwell: 2.0, z: MZ, ...look(302), scale: 0.8 });
  k.qperson(5.0, 4.15, { pose: "photo", dir: [0.3, 1], seed: 303, z: MZ, scale: 0.8, ...look(303) });
  k.qperson(2.4, 3.55, { pose: "sitground", dir: [0.6, 1], seed: 304, z: MZ, scale: 0.78, gesture: true, ...look(304) });
  k.qperson(2.65, 3.7, { pose: "sitground", dir: [-0.4, 1], seed: 305, z: MZ, scale: 0.6, kid: true, ...look(305) });

  // ---- beds
  BEDS.forEach(([pts, seed]) => { let d = 0; for (const [u, v] of pts) d = Math.max(d, u + v); k.q(d - 0.3, () => bedPoly(k, pts, seed, { cols: FLOW })); });

  // ---- viaduct: portal, piers, deck, train, station
  k.q(PORTAL.u + PORTAL.v + 0.6, () => portal(k, t));
  for (const v of PIERS) k.q(8.8 + v + 0.5, () => pier(k, v));
  k.q(14.9, () => deck(k, t));
  k.q(17.5, () => station(k, t));
  k.q(17.8, () => drawTrain(k, t, trainHead(t), { vmin: DECK.v0, u: TRK }));
  k.q(18.1, () => SHELL.draw(k, t));

  // ---- palms, lamps, benches
  for (const [u, v, h, lean, seed] of PALMS) k.q(u + v, () => dpalm(k, u, v, { h, lean, seed }));
  for (const [u, v] of LAMPS) k.q(u + v, () => k.lamp(u, v, { col: "#2b2a28", lit: 0.6 + 0.2 * Math.sin(t * 1.3 + u) }));
  for (const [[u, v], al] of BENCHES) k.q(u + v, () => k.bench(u, v, { along: al }));
  BENCHES.slice(0, 2).forEach(([[u, v], , seed], i) => {
    k.qperson(u + 0.28, v + 0.12, { pose: "sit", seatZ: 0.3, dir: [0.1, 1], seed, scale: 0.78, ...look(seed), shadow: false });
    if (i === 0) k.qperson(u + 0.6, v + 0.12, { pose: "sit", seatZ: 0.3, dir: [0.1, 1], seed: seed + 9, scale: 0.78, ...look(seed + 5), shadow: false });
  });
  k.qperson(5.6, 8.17, { pose: "sit", seatZ: 0.3, dir: [0.1, 1], seed: 214, scale: 0.78, ...look(214), shadow: false });

  // ---- plaza life
  const R = {
    prom: [[0.95, 6.5], [3.2, 6.5], [5.2, 6.5], [7.1, 6.5]],
    mid: [[1.0, 7.45], [3.0, 7.45], [5.0, 7.45], [6.9, 7.45]],
    low: [[1.1, 8.4], [3.0, 8.4], [5.0, 8.4], [6.9, 8.4]],
    left: [[1.0, 6.6], [1.0, 7.5], [1.0, 8.3]],
    court: [[7.05, 6.55], [7.05, 7.8], [7.05, 9.15]],
    court2: [[7.4, 9.5], [7.1, 9.5]],
  };
  const W = (r, off, seed, sp, ex = {}) => k.qwalker(R[r], { speed: sp ?? 0.36 + (seed % 5) * 0.03, offset: off, seed, dwell: 1.2 + (seed % 3) * 0.6, scale: 0.8, ...look(seed), ...ex });
  W("prom", 0.0, 401); W("prom", 0.35, 402, 0.4); W("prom", 0.7, 403, 0.34);
  W("mid", 0.1, 404); W("mid", 0.5, 405, 0.38); W("mid", 0.85, 406, 0.33, { kid: true, scale: 0.58 });
  W("low", 0.2, 407); W("low", 0.65, 408, 0.4);
  W("left", 0.3, 409); W("left", 0.9, 410, 0.33);
  W("court", 0.0, 411, 0.3); W("court", 0.5, 412, 0.32); W("court", 0.8, 413, 0.34);
  k.qcyclist(R.mid, { speed: 0.9, offset: 0.4, seed: 414, col: "#3f73b5" });
  // standing groups
  [[[4.1, 7.18], "photo", [0, 1], 421], [[4.38, 7.2], "stand", [0.2, 1], 422], [[2.9, 7.15], "stand", [1, 0.3], 423], [[3.12, 7.1], "stand", [-0.4, 1], 424], [[6.0, 7.15], "wave", [0.3, 1], 425],
    [[7.0, 8.55], "stand", [0.2, 1], 426], [[7.28, 8.45], "stand", [0.2, 1], 427], [[8.1, 9.5], "stand", [0.2, 1], 428], [[8.4, 9.58], "stand", [0.2, 1], 429], [[1.7, 7.15], "stand", [1, 0.3], 430]].forEach(([[u, v], pose, dir, seed]) => {
    k.qperson(u, v, { pose, dir, seed, scale: seed % 4 === 0 ? 0.6 : 0.8, ...look(seed) });
  });
  { // family with a balloon
    const fam = [[5.7, 7.7, 441, false], [5.95, 7.62, 442, true]];
    for (const [u, v, sd, kid] of fam) k.q(u + v, () => { const p = k.person(u, v, { pose: kid ? "wave" : "stand", dir: [0.1, 1], seed: sd, kid, scale: kid ? 0.58 : 0.8, ...look(sd) }); if (kid) balloon(k, p.hand, "#d83a33", t, sd, p.headY); });
  }

  k.flush();
  const [bx, by] = P(4.1, 3.3, 7.4);
  k.circlingBird(bx, by, 70, 24, { speed: 0.7, phase: 0 });
  k.circlingBird(bx, by, 70, 24, { speed: 0.7, phase: 0.6, size: 0.8 });
}
