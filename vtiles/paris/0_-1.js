// PARIS · 0,-1 · Notre-Dame & the Seine (code-drawn, traced over assets/paris/0_-1.png)
import { P, CTS, INK, shade, lerp, clamp, rng, hash } from "../../lib/vec-kit.js";
import { uv, uvs, dist, dense, inPoly, scalePoly, plane, opening, band, facade, slateQuad, frustums, statue, pigeon, flock, sparkle, cobbles, drop, debugRoutes, SLATE, smooth } from "./_props.js";

const SAND = "#e8dcc2", ST = "#d9bf8a", STD = shade(ST, -0.2);
const WZ = -0.3; // river surface
const RIVA = [[8.1, 0], [10, 0], [10, 5.4], [8.1, 5.4]];
const RIVB = [[6.9, 6.8], [10, 6.8], [10, 10], [6.9, 10]];
const ZT = (u) => 0.72 + 0.3 * Math.exp(-(((u - 7.9) / 1.7) ** 2));

import { tower, facadeMid, cathedral, FV, ST as NST } from "./notre.js";

// ---------- river + bridge ----------
function riverBox(k, poly, t, o = {}) {
  const c = k.ctx;
  const pr = (u, v, z) => P(u, v, z);
  // water surface with a faint stone floor tint at the walls
  k.water(poly, { color: "#62b2c2", z: WZ, density: 3.2, flow: 0.8, dir: [0, 1], seed: o.seed || 3 });
  // sheen bands drifting along the flow
  c.save(); k._trace(poly.map(([u, v]) => P(u, v, WZ)), true, 0); c.clip();
  for (let i = 0; i < 6; i++) {
    const ph = (t * 0.07 + i / 6) % 1;
    const u = lerp(poly[0][0], poly[1][0], (i + 0.5) / 6), v = lerp(poly[0][1], poly[2][1], ph);
    c.strokeStyle = "rgba(255,255,255,0.28)"; c.lineWidth = 3; c.lineCap = "round"; c.beginPath(); c.moveTo(...P(u - 0.25, v, WZ)); c.lineTo(...P(u + 0.25, v + 0.15, WZ)); c.stroke();
  }
  c.restore();
  k.ground(poly, null, { z: WZ, lw: 1.3 });
}
function waterSides(k) {
  const c = k.ctx;
  // glass sides of the slab where the river meets the tile edge
  for (const [a, b] of [[0, 5.4], [6.8, 10]]) {
    c.beginPath(); c.moveTo(...P(10, a, WZ)); c.lineTo(...P(10, b, WZ)); c.lineTo(...P(10, b, -CTS.SLAB)); c.lineTo(...P(10, a, -CTS.SLAB)); c.closePath();
    c.fillStyle = "rgba(70,150,176,0.85)"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
  }
  c.beginPath(); c.moveTo(...P(6.9, 10, WZ)); c.lineTo(...P(10, 10, WZ)); c.lineTo(...P(10, 10, -CTS.SLAB)); c.lineTo(...P(6.9, 10, -CTS.SLAB)); c.closePath();
  c.fillStyle = "rgba(90,166,190,0.85)"; c.fill(); c.stroke();
}
function quayWalls(k) {
  // river walls: u=8.1 face (arm A) and u=7.4 face (basin B), stone with joints
  const walls = [[8.1, 0, 5.4], [6.9, 6.8, 10]];
  const c = k.ctx;
  for (const [u, v0, v1] of walls) {
    k.path([P(u, v0, 0), P(u, v1, 0), P(u, v1, WZ), P(u, v0, WZ)], { fill: shade(ST, -0.22), lw: 1.3, wobble: 0 });
    c.strokeStyle = "rgba(60,40,20,0.3)"; c.lineWidth = 0.7; c.beginPath(); for (let v = v0; v < v1; v += 0.35) { c.moveTo(...P(u, v, 0)); c.lineTo(...P(u, v, WZ)); } c.stroke();
  }
  // back end of arm A (river continues off the tile): water face
  k.path([P(8.1, 0, 0), P(10, 0, 0), P(10, 0, WZ), P(8.1, 0, WZ)], { fill: "#5fb0c0", lw: 1, wobble: 0 });
}
function parapet(k, u, v0, v1) {
  // low stone parapet wall along v at plane u, top z 0.55
  const c = k.ctx;
  k.box(u, v0, 0, 0.26, v1 - v0, 0.55, "#dccb9c", { hatch: false, shadow: true });
  k.box(u - 0.03, v0, 0.55, 0.32, v1 - v0, 0.07, "#efe3bd", { hatch: false, shadow: false });
  c.strokeStyle = "rgba(60,40,20,0.25)"; c.lineWidth = 0.7; c.beginPath(); for (let v = v0; v < v1; v += 0.3) { c.moveTo(...P(u + 0.26, v, 0)); c.lineTo(...P(u + 0.26, v, 0.55)); } c.stroke();
}
function bridgeFace(k) {
  const c = k.ctx, v = 6.8, uA = 5.9, uB = 10;
  const zt = ZT;
  c.beginPath();
  c.moveTo(...P(uA, v, 0)); c.lineTo(...P(6.9, v, 0)); c.lineTo(...P(6.9, v, WZ));
  c.lineTo(...P(10, v, WZ));
  for (let u = 10; u >= uA; u -= 0.2) c.lineTo(...P(u, v, zt(u)));
  c.closePath();
  // arch hole (evenodd)
  const cx = 7.95, hw = 1.05, springZ = WZ + 0.02, crown = 0.5;
  c.moveTo(...P(cx - hw, v, springZ));
  for (let i = 0; i <= 14; i++) { const a = Math.PI - (i / 14) * Math.PI; c.lineTo(...P(cx + Math.cos(a) * hw, v, springZ + Math.sin(a) * (crown - springZ))); }
  c.closePath();
  c.fillStyle = shade(ST, -0.04); c.fill("evenodd"); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
  // voussoirs
  c.strokeStyle = "rgba(60,40,20,0.45)"; c.lineWidth = 0.9; c.beginPath();
  for (let i = 0; i <= 14; i++) { const a = Math.PI - (i / 14) * Math.PI; c.moveTo(...P(cx + Math.cos(a) * hw, v, springZ + Math.sin(a) * (crown - springZ))); c.lineTo(...P(cx + Math.cos(a) * (hw + 0.17), v, springZ + Math.sin(a) * (crown - springZ + 0.17))); }
  c.stroke();
  // ashlar
  c.strokeStyle = "rgba(60,40,20,0.2)"; c.lineWidth = 0.7; c.beginPath(); for (let z = 0.2; z < 1.0; z += 0.2) { c.moveTo(...P(uA, v, z)); c.lineTo(...P(6.85, v, z)); c.moveTo(...P(9.1, v, z)); c.lineTo(...P(10, v, z)); } c.stroke();
  c.strokeStyle = "rgba(60,40,20,0.14)"; c.lineWidth = 0.6; c.beginPath(); for (let u = uA; u < 10; u += 0.22) { if (u > 6.8 && u < 9.1) continue; for (let z = 0.1; z < 0.95; z += 0.4) { c.moveTo(...P(u + (z * 7 % 0.2), v, z)); c.lineTo(...P(u + (z * 7 % 0.2), v, z + 0.2)); } } c.stroke();
  // parapet along the deck (front face)
  c.beginPath(); for (let u = uA; u <= 10; u += 0.2) c.lineTo(...P(u, v, zt(u) + 0.5)); c.strokeStyle = INK; c.lineWidth = 2.4; c.stroke(); c.strokeStyle = "#efe3bd"; c.lineWidth = 1.2; c.stroke();
  c.strokeStyle = "rgba(60,40,20,0.5)"; c.lineWidth = 0.9; c.beginPath(); for (let u = uA; u <= 10; u += 0.14) { c.moveTo(...P(u, v, zt(u))); c.lineTo(...P(u, v, zt(u) + 0.5)); } c.stroke();
  return zt;
}
function bridgeDeck(k, zt) {
  const c = k.ctx;
  // deck surface + the far parapet
  const pts = []; for (let u = 5.9; u <= 10.001; u += 0.2) pts.push(P(u, 5.4, zt(u)));
  const pts2 = []; for (let u = 10; u >= 5.9; u -= 0.2) pts2.push(P(u, 6.8, zt(u)));
  c.beginPath(); [...pts, ...pts2].forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.fillStyle = "#cfc2a2"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
  c.save(); c.clip(); c.strokeStyle = "rgba(110,85,50,0.3)"; c.lineWidth = 0.7; c.beginPath(); for (let u = 5.9; u < 10; u += 0.2) { c.moveTo(...P(u, 5.4, zt(u))); c.lineTo(...P(u, 6.8, zt(u))); } for (let v = 5.6; v < 6.8; v += 0.28) { c.moveTo(...P(5.9, v, zt(5.9))); for (let u = 6.1; u <= 10; u += 0.2) c.lineTo(...P(u, v, zt(u))); } c.stroke(); c.restore();
  // far parapet (behind the deck)
  c.beginPath(); for (let u = 5.9; u <= 10; u += 0.2) c.lineTo(...P(u, 5.4, zt(u) + 0.5)); c.strokeStyle = INK; c.lineWidth = 2.4; c.stroke(); c.strokeStyle = "#efe3bd"; c.lineWidth = 1.2; c.stroke();
}

// ---------- the bateau-mouche ----------
function boat(k, t, o = {}) {
  const c = k.ctx, u = o.u, v = o.v;
  const L = 3.0, W = 0.86, z = WZ, H1 = 0.3;
  // wake
  c.save(); c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 1.6; c.lineCap = "round";
  for (let i = 0; i < 6; i++) { const ph = (t * 0.6 + i / 6) % 1, d = 0.2 + ph * 1.6; c.globalAlpha = 1 - ph; c.beginPath(); c.moveTo(...P(u - 0.4 - d * 0.55, v - 0.6 - d * 0.0 - 0.0 + 0.2 - d, z)); c.lineTo(...P(u - 0.4 - d * 0.55 + 0.25, v - 0.6 - d, z)); c.moveTo(...P(u + 0.4 + d * 0.55, v - 0.6 - d, z)); c.lineTo(...P(u + 0.4 + d * 0.55 - 0.25, v - 0.6 - d, z)); c.stroke(); }
  c.restore();
  const bow = v + L / 2, stern = v - L / 2;
  // hull (box with a pointed bow)
  const h0 = [[u - W / 2, stern], [u + W / 2, stern], [u + W / 2, bow - 0.35], [u, bow], [u - W / 2, bow - 0.35]];
  const hz = z + 0.02, ht = z + H1;
  k.path([P(u - W / 2, bow - 0.35, hz), P(u, bow, hz), P(u, bow, ht), P(u - W / 2, bow - 0.35, ht)], { fill: "#d9763f", lw: 1.1, wobble: 0 });
  k.path([P(u, bow, hz), P(u + W / 2, bow - 0.35, hz), P(u + W / 2, bow - 0.35, ht), P(u, bow, ht)], { fill: "#b95e2e", lw: 1.1, wobble: 0 });
  k.path([P(u + W / 2, bow - 0.35, hz), P(u + W / 2, stern, hz), P(u + W / 2, stern, ht), P(u + W / 2, bow - 0.35, ht)], { fill: "#b95e2e", lw: 1.1, wobble: 0 });
  k.path([P(u - W / 2, stern, hz), P(u - W / 2, bow - 0.35, hz), P(u - W / 2, bow - 0.35, ht), P(u - W / 2, stern, ht)].reverse().slice(0, 4), { fill: "#d9763f", lw: 0.0, wobble: 0, stroke: false });
  c.strokeStyle = "#f4f0e6"; c.lineWidth = 2.2; c.beginPath(); c.moveTo(...P(u + W / 2, stern, z + 0.2)); c.lineTo(...P(u + W / 2, bow - 0.35, z + 0.2)); c.lineTo(...P(u, bow, z + 0.2)); c.stroke();
  // open deck, stern: railing + passengers
  k.path(h0.map(([a, b]) => P(a, b, ht)), { fill: "#a3794f", lw: 1, wobble: 0 });
  // glass saloon
  const su0 = u - W / 2 + 0.07, sv0 = stern + 0.55, sw = W - 0.14, sl = L - 1.35;
  const zs = ht + 0.02, zh = ht + 0.42;
  { const cols = ["#d9b08c", "#8a5a3c", "#e8c9a0", "#b7835a"], hc = ["#2a2018", "#c8a04a", "#7a3b2a", "#d9d2c0", "#3a4a6a"];
    for (let i = 0; i < 9; i++) for (const row of [0, 1]) { const uu = su0 + sw * (row ? 0.28 : 0.74), vv = sv0 + sl * (i + 0.5) / 9; const [x, y] = P(uu, vv, zs + 0.12 + (row ? 0.0 : 0.02)); c.fillStyle = hc[(i * 2 + row) % 5]; c.fillRect(x - 2, y - 3.5, 4, 4.5); c.fillStyle = cols[(i + row * 2) % 4]; c.strokeStyle = INK; c.lineWidth = 0.5; c.beginPath(); c.arc(x, y - 6, 2, 0, 7); c.fill(); c.stroke(); } }
  k.path([P(su0, sv0 + sl, zs), P(su0 + sw, sv0 + sl, zs), P(su0 + sw, sv0 + sl, zh), P(su0, sv0 + sl, zh)], { fill: "rgba(170,220,236,0.8)", lw: 1, wobble: 0 });
  k.path([P(su0 + sw, sv0, zs), P(su0 + sw, sv0 + sl, zs), P(su0 + sw, sv0 + sl, zh), P(su0 + sw, sv0, zh)], { fill: "rgba(120,180,204,0.85)", lw: 1, wobble: 0 });
  c.strokeStyle = "rgba(30,50,64,0.7)"; c.lineWidth = 0.9; c.beginPath();
  for (let i = 1; i < 7; i++) { const vv = sv0 + (sl * i) / 7; c.moveTo(...P(su0 + sw, vv, zs)); c.lineTo(...P(su0 + sw, vv, zh)); } for (let i = 1; i < 3; i++) { const uu = su0 + (sw * i) / 3; c.moveTo(...P(uu, sv0 + sl, zs)); c.lineTo(...P(uu, sv0 + sl, zh)); } c.stroke();
  k.path([P(su0 - 0.03, sv0, zh), P(su0 + sw + 0.03, sv0, zh), P(su0 + sw + 0.03, sv0 + sl + 0.03, zh), P(su0 - 0.03, sv0 + sl + 0.03, zh)], { fill: "#f4efe3", lw: 1, wobble: 0 });
  // flag at the stern + wheelhouse bump
  k.flag(u, stern + 0.12, ht, { h: 0.7, w: 0.4, fh: 0.24 });
  // passengers on the open stern deck + bow
  k.person(u - 0.12, stern + 0.28, { z: ht, pose: "wave", dir: [0.1, 1], seed: 91, kid: false, scale: 0.6, shadow: false });
  k.person(u + 0.14, stern + 0.3, { z: ht, pose: "stand", dir: [0.1, 1], seed: 92, shadow: false });
  k.person(u, bow - 0.5, { z: ht, pose: "photo", dir: [0.1, 1], seed: 93, shadow: false });
}

// ---------- props ----------
function stall(k, u, v, t, seed, along = false) {
  const c = k.ctx, du = along ? 0.85 : 0.42, dv = along ? 0.42 : 0.85, h = 0.42;
  k.box(u, v, 0, du, dv, h, "#2f5d49", { hatch: false });
  k.box(u + 0.03, v + 0.03, h, du - 0.06, dv - 0.06, 0.04, "#3c6e57", { hatch: false, shadow: false });
  const R = rng(seed);
  for (let i = 0; i < 8; i++) { const [x, y] = P(u + 0.08 + (along ? i * 0.095 : (i % 2) * 0.17), v + 0.08 + (along ? (i % 2) * 0.17 : i * 0.095), h + 0.05); c.fillStyle = ["#c8403a", "#e9c24d", "#3f6fb8", "#f2efe6", "#7a5ea8"][Math.floor(R() * 5)]; c.strokeStyle = INK; c.lineWidth = 0.6; c.fillRect(x - 2.2, y - 3.8, 4.4, 3.8); c.strokeRect(x - 2.2, y - 3.8, 4.4, 3.8); }
}
function lampPost(k, u, v) { k.lamp(u, v, { col: "#2f4a3c" }); }
function trees(k) {
  for (const [u, v, s] of [[0.2, 8.5, 1], [1.35, 8.1, 2], [2.95, 8.2, 3], [4.45, 8.25, 4]]) k.q(u + v, () => k.tree(u, v, { r: 0.9, h: 1.55, seed: s * 7, col: s % 2 ? "#7fae55" : "#8cb85f" }));
  k.q(8.6, () => k.tree(7.3, 0.6, { r: 0.75, h: 1.6, seed: 31 }));
}

// ---------- routes ----------
const CIR = [[0.2, 8.5, 0.6], [1.35, 8.1, 0.6], [2.95, 8.2, 0.6], [4.45, 8.25, 0.6], [7.3, 0.6, 0.6]];
const STALLP = [[6.75, 0.7], [6.75, 1.6], [6.75, 2.5], [6.75, 3.4], [6.75, 4.3]];
const BOXP = [[0.5, 9.1], [1.5, 9.1], [2.6, 9.1], [3.7, 9.1], [5.0, 9.1], [6.4, 9.1]];
const BLOCKS = [
  [[-1, -1], [4.9, -1], [4.9, 4.3], [4.3, 4.3], [4.3, 5.7], [-1, 5.7]],         // cathedral footprint
  [[7.6, -1], [11, -1], [11, 5.5], [7.6, 5.5]], [[7.2, 6.7], [11, 6.7], [11, 11], [7.2, 11]], // river
  [[5.7, 5.3], [11, 5.3], [11, 6.9], [5.7, 6.9]],                                  // bridge approach handled separately
  [[6.55, 0.2], [7.5, 0.2], [7.5, 4.8], [6.55, 4.8]],                              // stalls
];
function clean(route, extra = []) {
  const d = dense(route, 0.2);
  const ok = (p) => p[0] > 0.2 && p[0] < 9.85 && p[1] > 0.2 && p[1] < 9.85 && CIR.every(([u, v, r]) => Math.hypot(p[0] - u, p[1] - v) > r) && BLOCKS.every((q, i) => (extra.includes(i) ? true : !inPoly(p, q)));
  let best = [], cur = [];
  for (const p of d) { if (ok(p)) cur.push(p); else { if (cur.length > best.length) best = cur; cur = []; } }
  if (cur.length > best.length) best = cur;
  const out = best.filter((_, i) => i % 3 === 0 || i === best.length - 1);
  return out.length >= 2 ? out : d.slice(0, 2);
}
const ROUTES = {
  plazaA: clean([[0.7, 6.1], [2.0, 6.5], [3.4, 6.6], [5.0, 6.1]], [3]),
  plazaB: clean([[0.6, 7.3], [2.2, 7.4], [4.0, 7.2], [5.5, 7.4]]),
  quay: clean([[6.1, 0.7], [6.1, 2.2], [6.0, 3.8], [6.0, 5.0], [5.7, 6.2]]),
  bridge: [[5.9, 6.1], [7.2, 6.1], [8.4, 6.1], [9.6, 6.1]],
  front: clean([[5.8, 7.4], [6.9, 8.0], [8.6, 9.0]]),
  edge: clean([[0.7, 9.6], [2.5, 9.6], [4.5, 9.6], [6.5, 9.6]]),
  gate: clean([[2.4, 5.95], [2.4, 6.4], [1.8, 7.0]]),
  plaza2: clean([[3.4, 5.95], [3.8, 6.5], [4.6, 7.2]]),
  stalls: clean([[5.9, 0.9], [5.9, 2.0], [5.9, 3.2], [6.0, 4.4]]),
  deckB: [[6.1, 6.3], [7.2, 6.3], [8.4, 6.3]],
  lane2: clean([[5.3, 5.0], [5.2, 3.0], [5.3, 0.8]]),
};

function hullOf(pts) {
  pts = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = []; for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  const up = []; for (const p of [...pts].reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
const HULL = hullOf([[8.1, 0], [9.0, 0], [9.0, 10], [8.1, 10]].flatMap(([u, v]) => [P(u, v, WZ - 0.05), P(u, v, 2.2)]));
export default function draw(k, t) {
  const c = k.ctx;
  k.groundTrace({ lawn: [], water: [], walks: [] }, { paved: SAND, side: "#e3d3b0", stipple: 6 });
  cobbles(k, [[0, 0], [10, 0], [10, 10], [0, 10]], { gap: 0.3, line: "rgba(130,100,60,0.18)" });
  // river carved out of the slab
  k.ground(RIVA, "#5fb0c0", { stroke: false }); k.ground(RIVB, "#5fb0c0", { stroke: false });
  quayWalls(k);
  riverBox(k, RIVA, t, { seed: 3 }); riverBox(k, RIVB, t, { seed: 5 });
  waterSides(k);
  // left-front balustrade along the slab edge (v = 10)
  { const Q = (s, z) => P(s, 9.95, z); const n = 30; for (let i = 0; i < n; i++) { const a = (i / n) * 10; if (a > 7.2) continue; k.box(a + 0.1, 9.85, 0, 0.12, 0.12, 0.45, "#e2d3aa", { hatch: false, shadow: false }); } k.box(0, 9.85, 0.45, 7.3, 0.14, 0.07, "#efe3bd", { hatch: false, shadow: false }); }
  // cathedral (everything behind the plaza)
  k.q(0.01, () => cathedral(k, t));
  k.q(0.02, () => tower(k, t, 0.25, FV - 1.25, 1.25, 1.25, 6.3, 1, {}));
  k.q(0.03, () => tower(k, t, 2.7, FV - 1.25, 1.25, 1.25, 6.3, 2, {}));
  k.q(0.04, () => facadeMid(k, t));
  // re-draw tower faces over the facade where the facade continues: the towers' L faces were drawn by tower(); facadeMid repaints the facade plane first
  parapet(k, 7.55, 0.0, 5.4);
  k.q(7, () => parapet(k, 6.55, 6.8, 10) && 0);
  // stalls (bouquinistes)
  STALLP.forEach(([u, v], i) => k.q(u + v + 0.8, () => stall(k, u, v, t, i + 1)));
  BOXP.forEach(([u, v], i) => k.q(u + v + 0.8, () => stall(k, u - 0.3, v - 0.2, t, i + 9, true)));
  trees(k);
  // lamps
  for (const [u, v] of [[0.3, 6.0], [4.35, 6.0], [5.9, 5.55], [7.7, 5.2], [7.7, 0.5], [6.2, 9.5], [3.3, 9.5]]) k.q(u + v, () => lampPost(k, u, v));
  // bridge
  let zt;
  k.q(15.7, () => { zt = bridgeFace(k); });
  // deck (behind the front face): draw it right before the face
  k.q(15.65, () => { bridgeDeck(k, ZT); });
  // bateau-mouche loop: enters at the back edge, glides under the bridge, leaves at the front
  { const period = 46, sp = 0.5, tt = ((t + 7) % period); const v = -2.0 + tt * sp, u = 8.58;
    if (v > -2.0 && v < 12.5) {
      const draw1 = () => { c.save(); c.beginPath(); for (const poly of [RIVA, RIVB]) poly.forEach(([a, b], i) => { const [x, y] = P(a, b, WZ); i ? c.lineTo(x, y) : c.moveTo(x, y); }), c.closePath && 0; c.restore(); };
      // clip to the water column so it slides in/out of the tile edge
      k.q(u + v + 0.2, () => {
        c.save(); c.beginPath();
        HULL.forEach((p2, i) => (i ? c.lineTo(...p2) : c.moveTo(...p2))); c.closePath(); c.clip();
        boat(k, t, { u, v }); c.restore();
      });
    } }
  // small rowing boats in the front basin
  k.q(17.8, () => {
    const v = 8.0 + Math.sin(t * 0.4) * 0.5, u = 8.4 + Math.sin(t * 0.3 + 1) * 0.2;
    k.box(u - 0.15, v - 0.35, WZ, 0.3, 0.7, 0.12, "#e8d9b0", { hatch: false, shadow: false });
    k.person(u, v, { z: WZ + 0.12, pose: "sit", seatZ: 0.06, dir: [0.1, 1], seed: 95, shadow: false, bench: true });
    c.strokeStyle = "#7a5233"; c.lineWidth = 1.4; const sw = Math.sin(t * 2.2) * 0.3; c.beginPath(); c.moveTo(...P(u - 0.2, v, WZ + 0.25)); c.lineTo(...P(u - 0.5, v + sw, WZ)); c.stroke();
  });
  // pigeons around the portals
  for (const [u, v, s] of [[1.4, 5.95, 1], [2.9, 6.1, 2], [3.4, 6.3, 3], [5.1, 6.6, 4], [0.9, 6.8, 5]]) k.q(u + v, () => pigeon(k, u, v, t, s));

  // ---------- people ----------
  const W = (name, off, seed, sp = 0.45, extra = {}) => k.qwalker(ROUTES[name], { speed: sp, offset: off, seed, dwell: 1.2 + (seed % 3) * 0.6, ...extra });
  W("plazaA", 0.0, 21); W("plazaA", 0.1, 22, 0.42); W("plazaB", 0.2, 23); W("plazaB", 0.3, 24, 0.5);
  W("quay", 0.1, 25); W("quay", 0.2, 26, 0.5); W("bridge", 0.0, 27, 0.5); W("bridge", 0.15, 28, 0.46); W("deckB", 0.4, 29, 0.4);
  W("front", 0.2, 30); W("edge", 0.3, 33); W("edge", 0.4, 34, 0.5); W("gate", 0.5, 35, 0.35); W("plaza2", 0.2, 36); W("stalls", 0.5, 37, 0.3); W("lane2", 0.0, 38, 0.44);
  k.qcyclist(ROUTES.edge, { speed: 0.95, offset: 0.7, seed: 39, col: "#3f73b5", basket: true });
  // photographers + browsers
  k.qperson(...[1.2, 6.3], { pose: "photo", dir: [0, -1], seed: 71 }); k.qperson(...[1.6, 6.45], { pose: "wave", dir: [0.1, -1], seed: 72 });
  k.qperson(...[3.2, 6.25], { pose: "photo", dir: [0.2, -1], seed: 73 }); k.qperson(...[3.55, 6.35], { pose: "cheer", dir: [0.3, -1], seed: 74 });
  k.qperson(...[2.4, 6.5], { pose: "stand", dir: [0, -1], seed: 75 });
  k.qperson(...[7.0, 2.1], { pose: "stand", dir: [1, 0.2], seed: 76 }); k.qperson(...[7.15, 3.1], { pose: "stand", dir: [1, 0.1], seed: 77 });
  k.qperson(...[7.15, 5.1], { pose: "photo", dir: [1, 0.4], seed: 78 });
  debugRoutes(k, Object.values(ROUTES), BLOCKS);
  k.flush();
  // sky: swifts around the spire, clouds
  flock(k, 560, 230, 6, t, 4);
  k.circlingBird(540, 200, 70, 24, { speed: 0.7, phase: 1 });
  k.cloud(220, 210, { s: 0.85, phase: 1 }); k.cloud(800, 250, { s: 0.7, phase: 4 });
}
