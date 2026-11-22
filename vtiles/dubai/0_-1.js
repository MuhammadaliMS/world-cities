// DUBAI · 0,-1 · Palm Jumeirah & Atlantis (code-drawn, traced over assets/dubai/0_-1.png)
// Laid out in frontal plan coordinates (a = u - v, d = u + v), mirrored about the trunk a = 0.
import { P, CTS, INK, shade, lerp, clamp, rng } from "../../lib/vec-kit.js";
import { makeAtlantis } from "./atlantis.js";
import { look } from "./_props.js";
import {
  AD, PA, SAND, SAND_D, SEA, SEA_L, POOL, TERRA, VILLA, PINK, PINK_L, CREAM, TEAL, DOMEC, BOUG,
  FRONDS, frontD, LAND, CROWN, isLand, chaikin, tr, landPath, prism, rectAD, domeDrum, onion, bays, band, archPath, crenel,
  opalm, shrub, villa, pool, lounger, parasol, cabana, shuttle, wakeAD, sailboat, jetski, speedboat, parasail, trainCar,
} from "./_t0_-1.js";

const ATL = makeAtlantis();
export const camera = { u: 2.6, v: 2.6, z: 1.3, zoom: 2.0 };

// the beach curve in front of the crown (copied from the helper, not exported there)
const BEACH = [[0.6, 6.5], [1.5, 6.5], [2.5, 6.5], [3.0, 6.52], [3.5, 6.58], [4.0, 6.64], [4.5, 6.76], [5.0, 6.92], [5.5, 7.08], [6.0, 7.27], [6.5, 7.5], [7.0, 7.8], [7.5, 8.2], [8.0, 8.66], [8.32, 8.82]];
const beachD = (s) => { s = Math.abs(s); if (s <= BEACH[0][0]) return BEACH[0][1]; for (let i = 0; i < BEACH.length - 1; i++) if (s <= BEACH[i + 1][0]) return lerp(BEACH[i][1], BEACH[i + 1][1], (s - BEACH[i][0]) / (BEACH[i + 1][0] - BEACH[i][0])); return BEACH[BEACH.length - 1][1]; };
const uv = (a, d) => AD(a, d);
const q = (k, d, fn) => k.q(d, fn);

// ---------- ground ----------
const mirror = (pts) => pts.slice().reverse().map(([a, d]) => [-a, d]);
function greenPoly(fi, side) {
  const F = FRONDS[fi], top = [], front = [];
  const s0 = 0.82, s1 = F.tip - 0.34;
  for (let s = s0; s <= s1 + 1e-6; s += 0.25) { top.push([side * s, frontD(fi, s) - F.w + 0.2]); front.push([side * s, frontD(fi, s) - 0.28]); }
  const tc = [side * s1, frontD(fi, s1) - (F.w - 0.2 + 0.28) / 2 - 0.28 + 0.14 + (F.w - 0.2) / 2 - (F.w - 0.2) / 2], cap = [];
  const r = (F.w - 0.2 - 0.28) / 2, cd = frontD(fi, s1) - 0.28 - r;
  for (let i = 0; i <= 8; i++) { const th = -Math.PI / 2 + (i / 8) * Math.PI; cap.push([side * s1 + side * Math.cos(th) * r, cd + Math.sin(th) * r]); }
  return chaikin([...top, ...cap, ...front.reverse()], 2);
}
const GREENS = [0, 1, 2, 3, 4].flatMap((i) => [greenPoly(i, -1), greenPoly(i, 1)]);

function ground(k, t) {
  const c = k.ctx, D = 0.46, SIDE = "#e7d4a9";
  k.poly([[0, 10, 0], [10, 10, 0], [10, 10, -D], [0, 10, -D]], SIDE, { lw: 1.4 });
  k.poly([[10, 0, 0], [10, 10, 0], [10, 10, -D], [10, 0, -D]], shade(SIDE, -0.14), { lw: 1.4 });
  // sandy grain on the cut faces
  { const R = rng(4); c.save(); c.fillStyle = "rgba(150,112,60,0.28)"; for (let i = 0; i < 380; i++) { const f = R(), z = -R() * D, [x, y] = i % 2 ? P(f * 10, 10, z) : P(10, f * 10, z); c.fillRect(x, y, 1.3, 1.1); } c.restore(); }
  // sea surface
  const TOP = [[0, 0], [10, 0], [10, 10], [0, 10]];
  k.poly(TOP.map(([u, v]) => [u, v, 0]), SEA, { lw: 1.6 });
  c.save(); k._trace(TOP.map(([u, v]) => P(u, v, 0)), true, 0); c.clip();
  const g = c.createLinearGradient(...P(0, 0), ...P(10, 10)); g.addColorStop(0, "#58c7bd"); g.addColorStop(0.5, "#35b4b4"); g.addColorStop(1, "#2ea6ae"); c.fillStyle = g; c.fillRect(0, 0, 1024, 1024);
  // shallows halo around every island
  c.lineJoin = "round";
  for (const [w, col] of [[30, "rgba(150,230,210,0.30)"], [18, "rgba(170,236,216,0.42)"], [9, "rgba(205,245,228,0.55)"]]) { landPath(c, LAND); c.lineWidth = w; c.strokeStyle = col; c.stroke(); }
  // ripples
  { const R = rng(23); c.lineCap = "round"; for (let i = 0; i < 260; i++) {
    const a = lerp(-10, 10, R()), d = lerp(0, 20, R()), ph = R() * 6.28, sp = 0.5 + R() * 0.6;
    const [uu, vv] = uv(a, d); if (uu < 0 || vv < 0 || uu > 10 || vv > 10 || isLand(a, d, 0.25)) continue;
    const al = 0.5 + 0.5 * Math.sin(t * 1.4 * sp + ph), dr = ((t * 0.1 * sp + R()) % 1) * 0.5;
    const [x, y] = P(uu + dr, vv, 0); c.globalAlpha = al * 0.8; c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(x - 6, y); c.quadraticCurveTo(x - 3, y - 2.2, x, y); c.quadraticCurveTo(x + 3, y + 2.2, x + 6, y); c.stroke(); }
    c.globalAlpha = 1; }
  c.restore();
  // foam lapping the shore
  c.save(); k._trace(TOP.map(([u, v]) => P(u, v, 0)), true, 0); c.clip();
  landPath(c, LAND, 0, 2); c.lineWidth = 3.4; c.strokeStyle = "rgba(255,255,255,0.65)"; c.setLineDash([9, 7]); c.lineDashOffset = -t * 6; c.stroke(); c.setLineDash([]);
  // sand body
  landPath(c, LAND); c.fillStyle = SAND; c.fill(); c.lineWidth = 1.7; c.strokeStyle = INK; c.stroke();
  // wet-sand rim just inside the shore
  c.save(); landPath(c, LAND); c.clip(); c.lineWidth = 7; c.strokeStyle = "rgba(205,170,110,0.45)"; c.stroke(); c.restore();
  // grain
  { const R = rng(31); c.save(); landPath(c, LAND); c.clip(); c.fillStyle = "rgba(160,120,64,0.3)"; for (let i = 0; i < 1400; i++) { const a = lerp(-9, 9, R()), d = lerp(2, 19, R()), [x, y] = PA(a, d, 0); c.fillRect(x, y, 1.3, 1.1); } c.restore(); }
  // hotel lawn (the crown minus the beach band)
  const bl = BEACH.slice(1).map(([s, d]) => [s, d - 0.52]);
  const lawn = [[0, 0], [8.2, 8.2], [8.22, 8.33], ...bl.slice().reverse(), [0.5, beachD(0.6) - 0.52]];
  const lawnFull = [...lawn, ...mirror(lawn.slice(1, -1))];
  const lw = chaikin(lawnFull.slice(0, 1).concat(lawnFull.slice(1)), 1);
  c.save(); landPath(c, [CROWN]); c.clip();
  c.beginPath(); lw.forEach(([a, d], i) => { const [x, y] = PA(a, d, 0); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath();
  c.fillStyle = "#9cc060"; c.fill(); c.lineWidth = 1.5; c.strokeStyle = INK; c.stroke();
  c.restore();
  // paved plaza in front of the hotel
  const PZ = [[-4.75, 4.25], [4.75, 4.25], [4.75, 5.2], [3.6, 5.95], [1.5, 6.0], [-1.5, 6.0], [-3.6, 5.95], [-4.75, 5.2]];
  const pz = chaikin(PZ, 2);
  c.beginPath(); pz.forEach(([a, d], i) => { const [x, y] = PA(a, d, 0); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath();
  c.fillStyle = "#ecd9b2"; c.fill(); c.lineWidth = 1.3; c.strokeStyle = INK; c.stroke();
  c.save(); c.clip(); c.strokeStyle = "rgba(170,130,80,0.3)"; c.lineWidth = 0.8; c.beginPath();
  for (let a = -5; a <= 5; a += 0.5) { c.moveTo(...PA(a, 4)); c.lineTo(...PA(a, 6.4)); }
  for (let d = 4.25; d <= 6.4; d += 0.45) { c.moveTo(...PA(-5, d)); c.lineTo(...PA(5, d)); }
  c.stroke(); c.restore();
  // beach band (light sand) in front of the lawn
  const bandPts = [...BEACH.map(([s, d]) => [s, d - 0.52]), ...BEACH.slice().reverse().map(([s, d]) => [s, d])];
  const bp = chaikin(bandPts.filter((p, i) => i < 2 || true), 0);
  void bp;
  // fronds: grass strips
  for (const gp of GREENS) {
    c.beginPath(); gp.forEach(([a, d], i) => { const [x, y] = PA(a, d, 0); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath();
    c.fillStyle = "#9cc060"; c.fill(); c.lineWidth = 1.4; c.strokeStyle = INK; c.stroke();
    c.save(); c.clip(); c.lineWidth = 5; c.strokeStyle = "rgba(60,100,30,0.22)"; c.stroke(); c.restore();
  }
  // grass tufts
  { const R = rng(55); c.strokeStyle = "rgba(70,110,40,0.55)"; c.lineWidth = 1; c.beginPath();
    for (let i = 0; i < 420; i++) { const a = lerp(-8, 8, R()), d = lerp(1, 15.5, R()); if (!GREENS.some((gp) => inPoly2([a, d], gp)) && !inPoly2([a, d], lw)) continue; const [x, y] = PA(a, d, 0); c.moveTo(x, y); c.lineTo(x - 1.5, y - 3); c.moveTo(x, y); c.lineTo(x + 1.5, y - 3); }
    c.stroke(); }
  c.restore();
  // trunk boulevard + gateway island pavement drawn in the dedicated pass
  trunkRoad(k, t);
}
function inPoly2(pt, poly) { let ins = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) ins = !ins; } return ins; }

// ---------- trunk boulevard (road, sidewalks, lane marks) ----------
const TR_D0 = 6.3, TR_D1 = 16.6;
function trunkRoad(k, t) {
  const c = k.ctx;
  const strip = (a0, a1, d0, d1, col, lw = 0) => { c.beginPath(); [[a0, d0], [a1, d0], [a1, d1], [a0, d1]].forEach(([a, d], i) => { const [x, y] = PA(a, d, 0); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); c.fillStyle = col; c.fill(); if (lw) { c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); } };
  strip(-0.62, 0.62, TR_D0, TR_D1, "#e9d5ad", 1.3);          // sidewalks + verge
  strip(-0.3, 0.3, TR_D0, TR_D1, "#8e8a86", 1.2);            // asphalt
  strip(-0.3, -0.26, TR_D0, TR_D1, "#f1ece0"); strip(0.26, 0.3, TR_D0, TR_D1, "#f1ece0");
  c.strokeStyle = "rgba(250,246,230,0.9)"; c.lineWidth = 1.4; c.setLineDash([7, 8]); c.beginPath(); c.moveTo(...PA(0, TR_D0)); c.lineTo(...PA(0, TR_D1)); c.stroke(); c.setLineDash([]);
}

// ---------- helpers ----------
const rr = (seed) => rng(seed);
const chanD = (i, s) => (frontD(i, s) + frontD(i + 1, s) - FRONDS[i + 1].w) / 2;
const sideName = [-1, 1];
function fromAD(pts) { return pts.map(([a, d]) => AD(a, d)); }

// ---------- static scene lists (deterministic) ----------
const VILLAS = [], PALMS = [], SHRUBS = [], POOLS = [];
{
  const R = rr(77);
  const WALLS = ["#f4e3c5", "#f1dcb8", "#f6ead2", "#efd5ae"], ROOFS = [TERRA, "#d4552f", "#c9633a"];
  FRONDS.forEach((F, fi) => {
    for (const sd of sideName) {
      let sIdx = 0;
      for (let s = 1.35; s < F.tip - 1.0; s += 1.12) {
        const a = sd * s, d = frontD(fi, s) - 0.74;
        const [u, v] = AD(a, d);
        VILLAS.push({ u: u - 0.15, v: v - 0.13, seed: fi * 31 + Math.round(s * 7) + (sd > 0 ? 100 : 0), wall: WALLS[(sIdx + fi) % 4], roof: ROOFS[(sIdx + fi * 2) % 3] });
        if (sIdx % 2 === 0) { const [pu, pv] = AD(a + sd * 0.55, d + 0.12); POOLS.push({ u: pu - 0.15, v: pv - 0.1, du: 0.22, dv: 0.15, seed: fi * 9 + sIdx }); }
        sIdx++;
      }
      // palms: back edge of the green strip + tip + between villas
      for (let s = 0.95; s < F.tip - 0.3; s += 0.52 + R() * 0.2) {
        const a = sd * s, d = frontD(fi, s) - F.w + 0.34 + R() * 0.14, [u, v] = AD(a, d);
        PALMS.push({ u, v, h: 0.5 + R() * 0.2, seed: Math.round(u * 100 + v * 10), len: 0.27 + R() * 0.04, fronds: 9, lean: (R() - 0.5) * 0.2 });
      }
      { const s = F.tip - 0.45, d = frontD(fi, s) - F.w / 2 - 0.05, [u, v] = AD(sd * s, d); PALMS.push({ u, v, h: 0.6, seed: fi * 5 + 3 + (sd > 0 ? 40 : 0), len: 0.28, fronds: 9, lean: 0 }); }
      for (let s = 1.0; s < F.tip - 0.4; s += 0.42 + R() * 0.2) {
        const a = sd * s, d = frontD(fi, s) - 0.46 - R() * 0.16, [u, v] = AD(a, d);
        SHRUBS.push({ u, v, r: 0.07 + R() * 0.05, flowers: R() < 0.55 ? BOUG : null, seed: Math.round(u * 40 + v * 7), col: R() < 0.5 ? "#5f8a3a" : "#6b9440" });
      }
    }
  });
  // crown lawn: palms + bougainvillea at the wing ends
  const inLawn = (a, d) => isLand(a, d, 0.1) && d < beachD(a) - 0.65 && !(d < 5.9 && Math.abs(a) < 4.9) && d > Math.abs(a) + 0.4 && Math.abs(a) > 0.9 && u2ok(a, d);
  function u2ok(a, d) { const [u, v] = AD(a, d); return u > 0.3 && v > 0.3 && u < 9.7 && v < 9.7; }
  for (let i = 0, n = 0; i < 500 && n < 46; i++) {
    const a = lerp(-8.3, 8.3, R()), d = lerp(4.6, 8.8, R());
    if (!inLawn(a, d) || (Math.abs(a) < 5.2 && d < 6.0)) continue;
    const [u, v] = AD(a, d); PALMS.push({ u, v, h: 0.55 + R() * 0.2, seed: 900 + i, len: 0.27, fronds: 9, lean: 0.05 }); n++;
  }
  for (let i = 0, n = 0; i < 500 && n < 34; i++) {
    const a = lerp(-8.3, 8.3, R()), d = lerp(4.6, 8.8, R());
    if (!inLawn(a, d)) continue;
    const [u, v] = AD(a, d); SHRUBS.push({ u, v, r: 0.08 + R() * 0.05, flowers: R() < 0.6 ? BOUG : null, seed: 1500 + i, col: "#5f8a3a" }); n++;
  }
  // plaza ring: palms around the lagoon and hotel foot
  for (const [a, d] of [[-1.7, 5.15], [1.7, 5.15], [-2.3, 5.8], [2.3, 5.8], [-3.3, 5.75], [3.3, 5.75], [-4.3, 5.6], [4.3, 5.6], [-1.65, 4.6], [1.65, 4.6], [-3.1, 4.6], [3.1, 4.6]]) { const [u, v] = AD(a, d); PALMS.push({ u, v, h: 0.55, seed: 700 + Math.round(a * 9), len: 0.27, fronds: 9, lean: 0.05 }); }
  for (const [a, d] of [[-1.4, 5.6], [1.4, 5.6], [-0.55, 6.0], [0.55, 6.0], [-4.5, 5.0], [4.5, 5.0], [-2.7, 5.2], [2.7, 5.2]]) { const [u, v] = AD(a, d); SHRUBS.push({ u, v, r: 0.09, flowers: BOUG, seed: 3000 + Math.round(a * 11 + d), col: "#5f8a3a" }); }
}
// trunk palms (two rows of tall palms + under-planting)
const TRUNK_PALMS = [];
for (let d = 6.8; d < 16.3; d += 1.0) for (const sd of sideName) TRUNK_PALMS.push({ a: sd * 0.5, d: d + (sd > 0 ? 0.3 : 0), h: 0.95 + ((Math.round(d * 10) % 3) * 0.06), seed: Math.round(d * 20) + (sd > 0 ? 1000 : 0) });

// ---------- walking routes (a,d) ----------
const beachRoute = (sd, s0, s1) => { const pts = []; for (let s = s0; s <= s1 + 1e-6; s += 0.5) pts.push([sd * s, beachD(s) - 0.11]); return fromAD(pts); };
const fRoute = (fi, sd, s0, s1) => { const pts = []; for (let s = s0; s <= s1 + 1e-6; s += 0.45) pts.push([sd * s, frontD(fi, s) - 0.12]); return fromAD(pts); };
const ROUTES = {
  beachL: beachRoute(-1, 1.6, 5.8), beachR: beachRoute(1, 1.6, 5.8), beachL2: beachRoute(-1, 3.4, 7.4), beachR2: beachRoute(1, 3.4, 7.4),
  plazaL: fromAD([[-4.4, 5.55], [-3.4, 5.5], [-2.2, 5.45], [-1.8, 5.75]]), plazaR: fromAD([[4.4, 5.55], [3.4, 5.5], [2.2, 5.45], [1.8, 5.75]]),
  doorL: fromAD([[-2.2, 4.85], [-0.8, 4.85], [-0.8, 5.35], [-2.2, 5.35]]), doorR: fromAD([[2.2, 4.85], [0.8, 4.85], [0.8, 5.35], [2.2, 5.35]]),
  frL1: fRoute(0, -1, 1.2, 4.2), frR1: fRoute(1, 1, 1.4, 6.8), frL2: fRoute(1, -1, 1.4, 6.8), frR2: fRoute(2, 1, 1.4, 6.6), frL3: fRoute(2, -1, 1.4, 6.6),
  frR3: fRoute(3, 1, 1.2, 4.8), frL4: fRoute(3, -1, 1.2, 4.8), frR0: fRoute(0, 1, 1.2, 4.2), frL5: fRoute(4, -1, 1.2, 3.2), frR5: fRoute(4, 1, 1.2, 3.2),
  trunkL: fromAD([[-0.42, 7.0], [-0.42, 11.0], [-0.42, 15.2]]), trunkR: fromAD([[0.42, 15.2], [0.42, 11.0], [0.42, 7.0]]), trunkL2: fromAD([[-0.42, 8.0], [-0.42, 12.5]]), trunkR2: fromAD([[0.42, 13.5], [0.42, 9.0]]),
  isl: fromAD([[-1.5, 16.3], [-1.2, 17.6], [-0.2, 18.1], [0.8, 17.7], [1.4, 16.4]]),
};
const PEOPLE = [
  ["beachL", 0.0, 11], ["beachL", 0.5, 14, 0.36], ["beachR", 0.25, 18], ["beachR", 0.75, 21], ["beachL2", 0.3, 24], ["beachR2", 0.6, 27],
  ["plazaL", 0.0, 30], ["plazaR", 0.4, 33], ["doorL", 0.0, 36, 0.45], ["doorR", 0.5, 39, 0.45],
  ["frL1", 0.1, 42], ["frR1", 0.6, 45], ["frL2", 0.4, 48], ["frR2", 0.2, 51], ["frL3", 0.8, 54], ["frR3", 0.5, 57], ["frL4", 0.3, 60], ["frR0", 0.2, 63], ["frL5", 0.5, 66], ["frR5", 0.1, 69],
  ["trunkL", 0.2, 72, 0.4], ["trunkR", 0.55, 75, 0.4], ["trunkL2", 0.5, 78], ["trunkR2", 0.1, 81], ["isl", 0.5, 84, 0.3],
];

// ---------- water traffic routes (a,d) ----------
const chanPath = (i, s0, s1, sd) => { const pts = []; for (let s = s0; s <= s1 + 1e-6; s += 0.5) pts.push([sd * s, chanD(i, s)]); return pts; };
const BOATS = [
  { type: "jet", path: chanPath(0, 1.2, 4.3, -1), speed: 1.6, off: 0.1, col: "#2f6fb5" },
  { type: "jet", path: chanPath(1, 1.2, 6.6, 1), speed: 1.9, off: 0.6, col: "#d8433a" },
  { type: "jet", path: chanPath(2, 1.2, 5.6, -1), speed: 1.7, off: 0.3, col: "#2aa876" },
  { type: "jet", path: chanPath(3, 1.2, 4.6, 1), speed: 1.5, off: 0.8, col: "#e8a22a" },
  { type: "jet", path: chanPath(1, 1.2, 6.4, -1), speed: 1.4, off: 0.9, col: "#7a46c8" },
  { type: "speed", path: fromAD0([[-1.4, 6.95], [-2.4, 6.95], [-3.6, 7.05]]), speed: 1.2, off: 0.2 },
  { type: "sail", path: [[-9.0, 10.8], [-8.6, 11.8], [-8.1, 12.6]], speed: 0.35, off: 0.0, hull: "#e0683a" },
  { type: "sail", path: [[8.7, 10.9], [8.3, 11.7], [8.0, 12.0]], speed: 0.3, off: 0.4, hull: "#2f7fb0" },
  { type: "sail", path: [[3.1, 15.5], [2.9, 16.3], [2.7, 17.0]], speed: 0.3, off: 0.2, hull: "#e0683a" },
];
function fromAD0(p) { return p; }

function boatItem(k, t, B, idx) {
  const sh = shuttle(B.path, t, { speed: B.speed, turn: 2.0, offset: B.off });
  const { a, d, ta, td } = sh, m = sh.mv ?? 0.6;
  k.q(d + 0.3, () => {
    if (B.type === "jet") { wakeAD(k, a, d, ta, td, m, { len: 1.0, w: 0.22 }); jetski(k, a, d, ta, td, { col: B.col, mv: m, ph: idx, seed: 90 + idx, vest: ["#f0c43c", "#e85a3a", "#3ab0e0"][idx % 3] }); }
    else if (B.type === "speed") { wakeAD(k, a, d, ta, td, m, { len: 1.3, w: 0.3 }); const r = speedboat(k, a, d, ta, td, { ph: idx }); parasail(k, r.stern, a, d, ta, td, { back: 1.8 }); }
    else sailboat(k, a, d, ta, td, { ph: idx, hull: B.hull });
  });
}

// ---------- monorail + trunk furniture ----------
function monorail(k, t) {
  const c = k.ctx;
  for (let d = 7.2; d < 16.4; d += 0.5) k.q(d + 0.5, () => {
    const f = prism(k, rectAD(-0.1, 0.1, d, d + 0.5), 0.62, 0.72, "#e9e4d8", { lw: 1, topCol: "#f6f2e8" });
    void f;
  });
  for (let d = 7.6; d < 16.4; d += 1.5) k.q(d + 0.2, () => prism(k, rectAD(-0.08, 0.08, d, d + 0.16), 0, 0.62, "#d8d0c0", { lw: 1, topCol: "#efe9dc" }));
  // train: two cars, ping-pong with dwell at the stations
  const sh = shuttle([[0, 8.0], [0, 11.8], [0, 15.6]], t, { speed: 1.5, turn: 2.6, offset: 0.0 });
  for (const off of [0, 0.9]) {
    const dd = sh.d - sh.td * off * 0.0 - (sh.td > 0 ? off : -off) * 1.0;
    k.q(dd + 0.35, () => trainCar(k, 0, dd, 0, sh.td >= 0 ? 1 : -1, { z: 0.74, len: 0.7 }));
  }
}

// ---------- gateway island ----------
function gateway(k, t) {
  k.q(16.9, () => {
    const faces = prism(k, rectAD(-0.95, 0.95, 16.3, 17.0), 0, 0.62, PINK, { topCol: "#f2d6aa" });
    const f = faces.find((x) => x.nd > 0.5); if (!f) return;
    band(k, f, 0, 0.1, "#d9866a");
    for (const [s0, s1] of [[0.05, 0.3], [0.7, 0.95]]) bays(k, f, { n: 3, z0: 0.18, z1: 0.52, rows: 2, arch: 0.07, mx: 0, fill: 0.62, seed: 9 }), void [s0, s1];
    k.path(archPath(f.F, 0.4, 0.6, 0, 0.3, 0.12, 6), { fill: "#5a3a2a", lw: 0.9, wobble: 0 });
    band(k, f, 0.55, 0.61, CREAM); crenel(k, f, 0.62, 12, CREAM, 0.05);
    domeDrum(k, 0, 16.65, 0.62, 0.22, 0.12, 0.26, "#f8c4a8", DOMEC, { win: 3, ribs: 6, fs: 0.8 });
    for (const s of [-1, 1]) onion(k, s * 0.8, 16.6, 0.62, 0.08, 0.2, DOMEC, { fs: 0.5 });
  });
  for (const [a, d] of [[-1.35, 16.5], [1.35, 16.5], [-1.0, 17.5], [1.0, 17.5], [-0.4, 17.9], [0.4, 17.9], [-1.6, 17.0], [1.6, 17.0], [-0.9, 15.9], [0.9, 15.9]]) { const [u, v] = AD(a, d); const o = { u, v, h: 0.6, seed: Math.round(a * 13 + d * 7), len: 0.28, fronds: 9, lean: 0 }; k.q(u + v + 0.1, () => opalm(k, o.u, o.v, o)); }
  for (const [a, d] of [[-0.6, 18.2], [0.6, 18.2], [-1.2, 17.7], [1.2, 17.7]]) { const [u, v] = AD(a, d); k.q(u + v, () => shrub(k, u, v, { r: 0.09, flowers: BOUG, seed: Math.round(a * 17 + d) })); }
}

// ---------- hotel forecourt ----------
function forecourt(k, t) {
  const c = k.ctx;
  // lagoon pool in front of the arch
  const shape = chaikin([[-1.35, 5.2], [-0.5, 5.05], [0.5, 5.05], [1.35, 5.2], [1.5, 5.6], [0.9, 5.95], [-0.9, 5.95], [-1.5, 5.6]], 2);
  const pp = shape.map(([a, d]) => PA(a, d, 0.01));
  k.q(5.1, () => {
    tr(c, shape.map(([a, d]) => PA(a, d, 0.01))); c.fillStyle = "#f6efe2"; c.fill(); c.lineWidth = 1.2; c.strokeStyle = INK; c.stroke();
    const inner = shape.map(([a, d]) => [a * 0.93, 5.57 + (d - 5.57) * 0.88]);
    tr(c, inner.map(([a, d]) => PA(a, d, 0.02))); c.fillStyle = POOL; c.fill(); c.lineWidth = 0.9; c.stroke();
    c.save(); tr(c, inner.map(([a, d]) => PA(a, d, 0.02))); c.clip();
    const R = rr(8); c.strokeStyle = "rgba(255,255,255,0.75)"; c.lineWidth = 0.9;
    for (let i = 0; i < 18; i++) { const a = lerp(-1.4, 1.4, R()), d = lerp(5.1, 5.9, R()), ph = R() * 6.28, al = 0.5 + 0.5 * Math.sin(t * 2.2 + ph); const [x, y] = PA(a, d, 0.02); c.globalAlpha = al; c.beginPath(); c.moveTo(x - 4, y); c.quadraticCurveTo(x - 2, y - 1.6, x, y); c.quadraticCurveTo(x + 2, y + 1.6, x + 4, y); c.stroke(); }
    c.globalAlpha = 1; c.restore();
    void pp;
  });
  // loungers + parasols along the beach band, cabana strips
  for (const sd of sideName) {
    let n = 0;
    for (let s = 1.45; s < 5.9; s += 0.42) {
      const a = sd * s, d = beachD(s) - 0.4, [u, v] = AD(a, d);
      k.q(u + v + 0.05, () => { const col = n % 3 === 1 ? "#f3d9a8" : "#fbf8f0", x0 = u - 0.11, y0 = v - 0.05; k.poly([[x0, y0, 0.03], [x0 + 0.22, y0, 0.03], [x0 + 0.22, y0 + 0.1, 0.03], [x0, y0 + 0.1, 0.03]], col, { lw: 0.8, wobble: 0 }); k.poly([[x0, y0, 0.03], [x0 + 0.07, y0, 0.03], [x0 + 0.07, y0 + 0.1, 0.03], [x0, y0 + 0.1, 0.03]], shade(col, -0.12), { lw: 0.7, wobble: 0 }); });
      if (n % 3 === 2) { const [pu, pv] = AD(a + sd * 0.1, d - 0.28); k.q(pu + pv + 0.3, () => parasol(k, pu, pv, { col: n % 6 === 2 ? "#f7f2e6" : "#f2d9b0", stripe: n % 6 === 2 ? null : "#d8613d" })); }
      n++;
    }
    for (const a of [2.2, 3.4]) { const d = 5.85; k.q(d + 0.4, () => cabana(k, sd * a, d)); }
  }
}

// ---------- draw ----------
export default function draw(k, t) {
  const c = k.ctx;
  ground(k, t);
  ATL.shadow(k);
  ATL.queue(k, t);
  forecourt(k, t);
  monorail(k, t);
  gateway(k, t);
  // villas, pools
  for (const o of VILLAS) k.q(o.u + o.v + 0.9, () => villa(k, o.u, o.v, { seed: o.seed, wall: o.wall, roof: o.roof, wing: (o.seed % 2 ? "u" : "v"), du: 0.3, dv: 0.26, h: 0.34 }));
  for (const o of POOLS) k.q(o.u + o.v + 0.2, () => pool(k, o.u, o.v, o.du, o.dv, { seed: o.seed }));
  for (const o of SHRUBS) k.q(o.u + o.v + 0.1, () => shrub(k, o.u, o.v, o));
  for (const o of PALMS) k.q(o.u + o.v + 0.2, () => opalm(k, o.u, o.v, o));
  for (const o of TRUNK_PALMS) { const [u, v] = AD(o.a, o.d); k.q(u + v + 0.2, () => opalm(k, u, v, { h: o.h, seed: o.seed, len: 0.27, fronds: 9, lean: o.a > 0 ? 0.06 : -0.06 })); }
  BOATS.forEach((B, i) => boatItem(k, t, B, i));
  for (const [r, off, seed, sp] of PEOPLE) k.qwalker(ROUTES[r], { speed: sp ?? 0.36 + (seed % 5) * 0.03, offset: off, seed, dwell: 1.4 + (seed % 3) * 0.7, h: 0.62, ...look(seed % 9 === 1 || seed % 9 === 6 ? seed + 1 : seed) });
}
