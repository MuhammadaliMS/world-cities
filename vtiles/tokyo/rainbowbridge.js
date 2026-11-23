// Rainbow Bridge (Odaiba) — v8 grid version. Everything stands on the 10x10 footprint, every point through P(u,v,z).
// The bridge runs along u across the back of the tile (centre line v = 1.5). Two anchorage blocks (u 0.35-1.75 and
// 8.25-9.65) hold the cables and swallow the traffic; two white portal towers (u 2.6 and 7.4, twin legs, arched portal)
// carry the main cables; the double deck is a Warren-truss box: expressway on top, Yurikamome line + roads below.
// Traffic shuttles between the anchorages and turns round inside them (left block: vehicles slide out of a tunnel mouth,
// right block: they pass behind the tall block), so nothing ever pops.
import { P, INK, shade, lerp, clamp, hash, CARS } from "../../lib/vec-kit.js";

export const BR = {
  u0: 1.5, u1: 8.5,          // open span between the anchorages
  vA: 0.9, vB: 2.1,            // deck edges (far, near)
  vcF: 0.72, vcN: 2.28,        // cable planes (far, near)
  zLow: 1.5, zMid: 2.1, zTop: 2.2, // lower road, slab underside, upper road
  towers: [2.6, 7.4], H: 5.35,
  blocks: [[0.4, 0.6, 1.1, 1.8, 2.7], [8.5, 0.6, 1.1, 1.8, 2.7]], // u, v, du, dv, h
};
const W = "#f3f1ea", WS = "#dedbd1", WD = "#bdb9ad", ROAD = "#7f8289", STEEL = "#8d9097";
const ZTOP = 5.0;

// cable height along u (both planes)
export const cableZ = (u) => {
  const [a, b] = BR.towers;
  if (u >= a && u <= b) return 2.78 + (ZTOP - 2.78) * ((u - 5) / 2.4) ** 2;
  if (u < a) { const f = clamp((a - u) / (a - 0.95)); return lerp(ZTOP, 3.1, f) - 0.2 * Math.sin(Math.PI * f); }
  const f = clamp((u - b) / (9.05 - b)); return lerp(ZTOP, 3.1, f) - 0.2 * Math.sin(Math.PI * f);
};
const CU0 = 0.95, CU1 = 9.05; // cable anchor u

function L3(c, pts, w, col, ink = true) {
  c.lineCap = "round"; c.lineJoin = "round";
  c.beginPath(); pts.forEach((p, i) => { const q = P(...p); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); });
  if (ink) { c.strokeStyle = INK; c.lineWidth = w + 1.5; c.stroke(); }
  c.strokeStyle = col; c.lineWidth = w; c.stroke();
}
const quad = (k, q, fill, o = {}) => k.poly(q, fill, { lw: o.lw ?? 0.9, wobble: 0, ...o });

// ---------- water effects ----------
export function drawReflections(k, t) {
  const c = k.ctx;
  // cast shadows of the deck and the tower legs, falling toward +u +v
  k.poly([[2.7, 1.3, 0], [8.8, 1.3, 0], [8.8, 2.55, 0], [2.7, 2.55, 0]], "rgba(20,70,90,0.13)", { stroke: false, wobble: 0 });
  for (const tu of BR.towers) {
    for (const v0 of [0.58, 2.14]) {
      const a = tu - 0.17, b = tu + 0.17, dx = 2.0, dv = 0.55;
      const pts = [[a, v0, 0], [b, v0, 0], [b + dx, v0 + 0.28 + dv, 0], [a + dx, v0 + 0.28 + dv, 0]].map(([u, v, z]) => [clamp(u, 0.4, 8.8), clamp(v, 0.55, 4.8), z]);
      k.poly(pts, "rgba(20,70,90,0.12)", { stroke: false, wobble: 0 });
    }
    // wavering tower reflections just in front of the piers
    c.lineCap = "round";
    for (let i = 0; i < 7; i++) {
      const [x, y] = P(tu + (i - 3) * 0.12, 2.75 + (i % 3) * 0.12, 0);
      const ph = t * 1.4 + i * 1.3 + tu;
      c.strokeStyle = `rgba(250,252,255,${0.34 + 0.2 * Math.sin(ph)})`; c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(x - 5 + Math.sin(ph) * 2, y + 2); c.lineTo(x + 5 + Math.sin(ph) * 2, y + 2); c.stroke();
    }
  }
}

// ---------- parts ----------
function pier(k, tu) {
  const u0 = tu - 0.5, v0 = 0.55;
  k.box(u0, v0, 0, 1.0, 2.0, 0.55, "#cfc9bb", { hatch: false, shadow: false });
  // waterline foam + collar course
  k.box(u0 - 0.03, v0 - 0.03, 0.36, 1.06, 2.06, 0.06, "#ddd8ca", { hatch: false, shadow: false, lw: 1 });
}

function leg(k, tu, v0) {
  const du = 0.34, dv = 0.28, H = BR.H, x0 = tu - du / 2;
  k.box(x0, v0, 0.55, du, dv, H - 0.55, W, { hatch: false, shadow: false, left: "#f6f4ee", right: "#cbc7bb" });
  // recessed channel on the left (v+dv) face, precast joints on both faces
  quad(k, [[x0 + du * 0.36, v0 + dv, 0.9], [x0 + du * 0.64, v0 + dv, 0.9], [x0 + du * 0.64, v0 + dv, H - 0.5], [x0 + du * 0.36, v0 + dv, H - 0.5]], "rgba(160,152,138,0.3)", { lw: 0.6 });
  const c = k.ctx; c.strokeStyle = "rgba(42,36,32,0.22)"; c.lineWidth = 0.7; c.beginPath();
  for (let z = 0.95; z < H - 0.3; z += 0.6) { let p = P(x0, v0 + dv, z), q = P(x0 + du, v0 + dv, z); c.moveTo(...p); c.lineTo(...q); p = P(x0 + du, v0, z); q = P(x0 + du, v0 + dv, z); c.moveTo(...p); c.lineTo(...q); }
  c.stroke();
  // saddle cap + finial
  k.box(x0 - 0.04, v0 - 0.03, H, du + 0.08, dv + 0.06, 0.12, WS, { hatch: false, shadow: false, lw: 1.1 });
  k.box(tu - 0.06, v0 + dv / 2 - 0.06, H + 0.12, 0.12, 0.12, 0.26, WS, { hatch: false, shadow: false, lw: 1 });
}

function portal(k, tu, t, idx) {
  const du = 0.34, x0 = tu - du / 2, vA = 0.58 + 0.28, vB = 2.14;
  const H = BR.H;
  // top beam, lower strut, arch
  k.box(x0 - 0.02, vA, H - 0.8, du + 0.04, vB - vA, 0.5, W, { hatch: false, shadow: false, left: "#f6f4ee", right: "#cbc7bb" });
  k.box(x0, vA, 3.35, du, vB - vA, 0.3, W, { hatch: false, shadow: false, left: "#f6f4ee", right: "#cbc7bb" });
  // arch: curved band under the top beam, in the plane u = tu + du/2 (right face side, visible)
  const ua = tu + du / 2, pts = [], pts2 = [];
  const vm = (vA + vB) / 2, hw = (vB - vA) / 2;
  for (let i = 0; i <= 14; i++) { const a = Math.PI * i / 14, v = vm - Math.cos(a) * hw, z = 3.65 + Math.sin(a) * (H - 0.8 - 3.65) * 0.95; pts.push([ua, v, z]); pts2.push([ua, v, z - 0.14]); }
  k.poly([...pts, ...pts2.reverse()], "#e9e6dd", { lw: 1.2, wobble: 0 });
  // X bracing under the strut
  L3(k.ctx, [[ua, vA, 3.35], [ua, vB, 3.35 - 0.0]], 1, "#cbc7bb", false);
  // aircraft beacon on the finial, blinking
  const [bx, by] = P(tu, 0.58 + 0.14, H + 0.5);
  const on = (Math.sin(t * 2.6 + idx * 1.7) + 1) / 2;
  const g = k.ctx.createRadialGradient(bx, by, 0, bx, by, 11); g.addColorStop(0, `rgba(255,70,50,${0.55 * on})`); g.addColorStop(1, "rgba(255,70,50,0)");
  k.ctx.fillStyle = g; k.ctx.beginPath(); k.ctx.arc(bx, by, 11, 0, 6.3); k.ctx.fill();
  k.circle(bx, by, 2.1, `rgb(${Math.round(190 + 60 * on)},${Math.round(50 + 20 * on)},45)`, { lw: 0.9 });
}

// main cables, side-span cables, hangers on one plane (v = plane)
function cables(k, v, deckEdge) {
  const c = k.ctx, [a, b] = BR.towers;
  const run = (u0, u1, n) => { const o = []; for (let i = 0; i <= n; i++) { const u = lerp(u0, u1, i / n); o.push([u, v, cableZ(u) + (u < a || u > b ? 0 : 0)]); } return o; };
  const main = run(a, b, 36), sl = run(CU0, a, 12), sr = run(b, CU1, 12);
  for (const pts of [sl, main, sr]) { L3(c, pts, 3.4, "#e9e7df"); }
  // second strand just below (the painted cables read as a doubled line)
  for (const pts of [sl, main, sr]) { L3(c, pts.map(([u, vv, z]) => [u, vv, z - 0.1]), 1.6, "#cfccc2", false); }
  if (k.night) {
    // the Rainbow Bridge: white-lit cables with a slow rainbow of lamps
    const RB = ["#ff5a5a", "#ffa040", "#ffe060", "#60e080", "#50b8ff", "#b080ff"];
    k.lit(() => { for (const pts of [sl, main, sr]) pts.forEach(([u, vv, z], i) => { const [x, y] = P(u, vv, z); c.fillStyle = RB[(i + Math.floor(k.t * 2)) % 6]; c.beginPath(); c.arc(x, y, 1.9, 0, 6.3); c.fill(); }); });
    for (let u = a; u <= b; u += 0.9) k.glow(u, v, cableZ(u), 0.55, RB[Math.round(u * 3) % 6], 0.35);
    k.glow(a, v, BR.H, 0.8, "#fff4d8", 0.7); k.glow(b, v, BR.H, 0.8, "#fff4d8", 0.7);
  }
  // hangers
  const hang = (u) => { const z = cableZ(u); L3(c, [[u, v, z], [u, v, BR.zTop - 0.05], [u, deckEdge, BR.zMid]], 0.9, "#b8b4a8", true); };
  for (let u = a + 0.45; u < b - 0.3; u += 0.36) hang(u);
  for (let u = CU0 + 0.5; u < a - 0.25; u += 0.4) hang(u);
  for (let u = b + 0.3; u < CU1 - 0.45; u += 0.4) hang(u);
}

function lattice(k, v, uA, uB, z0, z1, n, col, lw, fade = 1) {
  const c = k.ctx, w = (uB - uA) / n;
  c.globalAlpha = fade;
  L3(c, [[uA, v, z1], [uB, v, z1]], lw + 1, col);
  L3(c, [[uA, v, z0], [uB, v, z0]], lw + 1, col);
  for (let i = 0; i < n; i++) {
    const a = uA + i * w, b = a + w;
    L3(c, i % 2 ? [[a, v, z1], [b, v, z0]] : [[a, v, z0], [b, v, z1]], lw, col);
    if (i % 2 === 0) L3(c, [[a, v, z0], [a, v, z1]], lw * 0.8, col);
  }
  c.globalAlpha = 1;
}

function block(k, [u, v, du, dv, h], side) {
  const left = "#e3dfd3", right = "#b7b2a4";
  k.box(u, v, 0, du, dv, h, "#d6d2c5", { hatch: false, shadow: false, left, right, top: "#ece8dc" });
  // precast panel joints on both faces
  const c = k.ctx; c.strokeStyle = "rgba(42,36,32,0.2)"; c.lineWidth = 0.8; c.beginPath();
  for (let z = 0.7; z < h; z += 0.7) { let p = P(u, v + dv, z), q = P(u + du, v + dv, z); c.moveTo(...p); c.lineTo(...q); p = P(u + du, v, z); q = P(u + du, v + dv, z); c.moveTo(...p); c.lineTo(...q); }
  for (let a = u + du / 4; a < u + du - 0.1; a += du / 4) { const p = P(a, v + dv, 0), q = P(a, v + dv, h); c.moveTo(...p); c.lineTo(...q); }
  c.stroke();
  k.box(u - 0.05, v - 0.05, 0, du + 0.1, dv + 0.1, 0.45, "#b9b3a4", { hatch: false, shadow: false, lw: 1.1 });
  // cornice
  k.box(u - 0.04, v - 0.04, h - 0.1, du + 0.08, dv + 0.08, 0.1, "#cfcabb", { hatch: false, shadow: false, lw: 1.1 });
  // cable housings on top (one per cable plane)
  for (const pv of [BR.vcF, BR.vcN]) k.box(side < 0 ? 0.65 : 8.75, pv - 0.16, h, 0.35, 0.32, 0.3, "#c9c4b6", { hatch: false, shadow: false, lw: 1.1 });
  if (side < 0) {
    // tunnel mouths on the u = 1.75 face: expressway (top) and Yurikamome + roads (below)
    const ua = u + du;
    for (const [z0, z1, va, vb] of [[BR.zTop, BR.zTop + 0.58, 0.96, 2.04], [BR.zLow, BR.zMid - 0.06, 1.0, 2.0]]) {
      quad(k, [[ua, va, z0], [ua, vb, z0], [ua, vb, z1], [ua, va, z1]], "#2d3038", { lw: 1.3 });
      quad(k, [[ua, va + 0.04, z1 - 0.05], [ua, vb - 0.04, z1 - 0.05], [ua, vb - 0.04, z1], [ua, va + 0.04, z1]], "#aaa699", { lw: 0.6 });
    }
  }
}

// vehicle with a left cut (u >= uMin): used where traffic emerges from the left tunnel mouth
function carZ(k, u, v, dir, col, z, o = {}) {
  const L = o.len ?? 0.5, Wd = o.wid ?? 0.26, H = o.h ?? 0.14, uMin = o.uMin ?? -9;
  const u0 = u - L / 2, u1 = u + L / 2;
  const cu0 = Math.max(u0, uMin);
  if (u1 - cu0 < 0.02) return;
  const v0 = v - Wd / 2;
  k.box(cu0, v0, z + 0.04, u1 - cu0, Wd, H, col, { hatch: false, shadow: false, lw: 1.1 });
  const a = dir > 0 ? u0 + L * 0.2 : u0 + L * 0.3, b = a + L * 0.5, ca = Math.max(a, uMin);
  if (b - ca > 0.03) k.box(ca, v0 + 0.025, z + 0.04 + H, b - ca, Wd - 0.05, H * 0.8, o.cab || "#cfe3ee", { hatch: false, shadow: false, top: shade(col, 0.05), lw: 1 });
  const c = k.ctx; c.fillStyle = INK;
  for (const f of [0.22, 0.78]) { const wu = u0 + L * f; if (wu < uMin) continue; const [x, y] = P(wu, v0 + Wd, z + 0.04); c.beginPath(); c.arc(x, y, 2.6, 0, 6.3); c.fill(); }
}

// a looped shuttle: lane A (+u) from uA to uB, hidden turn at the right anchorage, lane B (-u) back, hidden turn at the left anchorage
function shuttle(t, speed, off, uA, uB, vA, vB) {
  const Ln = uB - uA, H = 0.9, tot = 2 * Ln + 2 * H;
  let s = (((t * speed + off * tot) % tot) + tot) % tot;
  if (s < Ln) return { u: uA + s, v: vA, d: 1, vis: true };
  s -= Ln; if (s < H) return { u: uB + 0.15 * (s / H), v: lerp(vA, vB, s / H), d: 1, vis: false };
  s -= H; if (s < Ln) return { u: uB - s + 0.15 * 0, v: vB, d: -1, vis: true };
  s -= Ln; return { u: uA, v: lerp(vB, vA, s / H), d: -1, vis: false };
}

function lamps(k, v, side) {
  const c = k.ctx;
  for (let u = 2.2; u < 8.0; u += 1.15) {
    const a = P(u, v, BR.zTop), b = P(u, v, BR.zTop + 0.78), e = P(u, v + side * 0.0 + (side > 0 ? -0.22 : 0.22), BR.zTop + 0.86);
    c.strokeStyle = INK; c.lineWidth = 2.6; c.lineCap = "round"; c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.quadraticCurveTo(b[0], b[1] - 4, e[0], e[1]); c.stroke();
    c.strokeStyle = "#b5b8be"; c.lineWidth = 1.2; c.stroke();
    k.circle(e[0], e[1] + 1.5, 2.1, "#fff3c0", { lw: 0.9 });
  }
}

// ---------- the whole bridge ----------
export function drawBridge(k, t) {
  const c = k.ctx, [LB, RB] = BR.blocks, [tA, tB] = BR.towers;
  drawReflections(k, t);
  // piers
  pier(k, tA); pier(k, tB);
  // far plane: legs, cables, hangers
  for (const tu of [tA, tB]) leg(k, tu, 0.58);
  cables(k, BR.vcF, BR.vA);
  // far truss + lower floor
  const { u0, u1, vA, vB, zLow, zMid, zTop } = BR;
  lattice(k, vA, u0, u1, zLow - 0.06, zMid, 18, "#6f737b", 1.1, 0.85);
  quad(k, [[u0, vA, zLow], [u1, vA, zLow], [u1, vB, zLow], [u0, vB, zLow]], "#5d6068", { lw: 0.8 });
  // left anchorage (vehicles come out of its tunnel mouths, so it goes under them)
  block(k, LB, -1);
  // lower deck: roads at the sides, Yurikamome rails in the middle
  for (const v of [1.55, 1.62]) k.line3([[u0, v, zLow + 0.01], [u1, v, zLow + 0.01]], { lw: 1, stroke: "#c7c9ce", wobble: 0 });
  for (let u = u0 + 0.1; u < u1; u += 0.22) k.line3([[u, 1.5, zLow + 0.01], [u, 1.67, zLow + 0.01]], { lw: 1, stroke: "rgba(40,40,40,0.55)", wobble: 0 });
  // Yurikamome: three white cars with a teal stripe, shuttling between the anchorages
  {
    const s = shuttle(t, 1.35, 0.15, 0.95, 8.95, 1.78, 1.78);
    if (s.vis || s.u > 1.2) {
      for (let i = 0; i < 3; i++) {
        const cu = s.u + (i - 1) * 0.46 * (s.d > 0 ? 1 : 1), u0c = cu - 0.22;
        const uMin = BR.u0, cu0 = Math.max(u0c, uMin);
        if (cu + 0.22 - cu0 < 0.02) continue;
        k.box(cu0, 1.6, zLow + 0.02, cu + 0.22 - cu0, 0.36, 0.36, "#f4f6f8", { hatch: false, shadow: false, lw: 1.1 });
        const nu = Math.max(cu0 + 0.03, 0); if (cu + 0.2 - nu > 0.02) k.poly([[nu, 1.96, zLow + 0.2], [cu + 0.2, 1.96, zLow + 0.2], [cu + 0.2, 1.96, zLow + 0.26], [nu, 1.96, zLow + 0.26]], "#2f9aa6", { lw: 0.5, wobble: 0 });
        for (let w = 0; w < 3; w++) { const a = cu0 + 0.03 + w * 0.13; if (a + 0.08 < cu + 0.22) k.poly([[a, 1.96, zLow + 0.28], [a + 0.08, 1.96, zLow + 0.28], [a + 0.08, 1.96, zLow + 0.34], [a, 1.96, zLow + 0.34]], "#7fb4c8", { lw: 0.5, wobble: 0 }); }
      }
    }
  }
  // upper expressway slab: concrete edges, asphalt, lane marks
  k.box(u0, vA, zMid, u1 - u0, vB - vA, zTop - zMid, "#d9d6cc", { hatch: false, shadow: false, top: ROAD, left: "#d9d6cc", right: "#aaa69a", lw: 1.1 });
  for (let u = u0 + 0.1; u < u1 - 0.2; u += 0.5) k.line3([[u, 1.5, zTop + 0.005], [u + 0.26, 1.5, zTop + 0.005]], { lw: 1.4, stroke: "#f0efe6", wobble: 0 });
  k.line3([[u0, 0.98, zTop + 0.005], [u1, 0.98, zTop + 0.005]], { lw: 1, stroke: "#e8e6dc", wobble: 0 });
  k.line3([[u0, 2.02, zTop + 0.005], [u1, 2.02, zTop + 0.005]], { lw: 1, stroke: "#e8e6dc", wobble: 0 });
  // far parapet + lamps
  quad(k, [[u0, vA + 0.04, zTop], [u1, vA + 0.04, zTop], [u1, vA + 0.04, zTop + 0.26], [u0, vA + 0.04, zTop + 0.26]], "rgba(225,232,238,0.5)", { lw: 0.8 });
  lamps(k, vA + 0.04, -1);
  // traffic on the upper deck (depth-sorted)
  const cars = [], laneA = 1.27, laneB = 1.73;
  const spec = [[0.0, 0], [0.14, 3], [0.29, 5], [0.43, 1], [0.58, 6], [0.72, 2], [0.86, 4]];
  spec.forEach(([off, ci], i) => { const s = shuttle(t, 1.9, off, 0.95, 8.9, laneA, laneB); if (s.vis || s.u > 1.3) cars.push({ ...s, col: CARS[ci], long: i === 3 }); });
  cars.sort((a, b) => a.u + a.v - (b.u + b.v));
  for (const s of cars) carZ(k, s.u, s.v, s.d, s.col, zTop, { uMin: BR.u0, len: s.long ? 0.78 : 0.5, h: s.long ? 0.2 : 0.14 });
  // right anchorage (traffic passes behind it)
  block(k, RB, 1);
  // near truss + fascia plate, near parapet and lamps
  lattice(k, vB, u0, u1, zLow - 0.06, zMid, 18, "#5e626a", 1.25, 1);
  quad(k, [[u0, vB, zLow - 0.1], [u1, vB, zLow - 0.1], [u1, vB, zLow - 0.04], [u0, vB, zLow - 0.04]], "#d3cfc3", { lw: 1 });
  quad(k, [[u0, vB - 0.04, zTop], [u1, vB - 0.04, zTop], [u1, vB - 0.04, zTop + 0.26], [u0, vB - 0.04, zTop + 0.26]], "rgba(225,232,238,0.45)", { lw: 0.8 });
  c.strokeStyle = INK; c.lineWidth = 1; c.beginPath();
  for (let u = u0; u <= u1 + 0.01; u += 0.4) { const p = P(u, vB - 0.04, zTop), q = P(u, vB - 0.04, zTop + 0.26); c.moveTo(...p); c.lineTo(...q); }
  c.stroke();
  k.line3([[u0, vB - 0.04, zTop + 0.26], [u1, vB - 0.04, zTop + 0.26]], { lw: 1.6, stroke: "#cfd2d8", wobble: 0 });
  lamps(k, vB - 0.04, 1);
  // near legs + portals + near cables
  for (const [i, tu] of [tA, tB].entries()) { portal(k, tu, t, i); leg(k, tu, 2.14); }
  cables(k, BR.vcN, BR.vB);
}
