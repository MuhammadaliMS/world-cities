// PARIS · -1,-1 · The Louvre & Glass Pyramid (code-drawn, traced over assets/paris/-1_-1.png)
import { P, CTS, INK, shade, lerp, clamp, rng, hash } from "../../lib/vec-kit.js";
import GROUND from "./-1_-1.ground.js";
import { inPoly, uv, uvs, facade, plane, opening, frustums, dormer, chimney, statue, jet, pigeon, flock, sparkle, planter, cobbles, drop, avoidCircles, dense, scalePoly, debugRoutes, GOLD } from "./_props.js";
const STONE = "#dcc283", SLATE = "#74829f";

const SAND = "#e9dcc0";
const WP = 0.45, E = 3.5; // wing facade plane + eave height

// ---------- Louvre palace wings + pavilions ----------
const FLOORS = [
  { z0: 0.08, z1: 1.15, w: 0.46, arch: true, mull: false, glass: "#403a3c", fw: 0.04 },
  { z0: 1.42, z1: 2.4, w: 0.34, ped: "alt", lit: 0.12 },
  { z0: 2.68, z1: 3.15, w: 0.26, lit: 0.15, sill: false },
];
const BANDS = [[1.22, 0.1, 0.07], [2.52, 0.08, 0.06], [3.3, 0.2, 0.12]];
function wingRoofs(k) {
  // slate mansards: left wing (ridge along v) then right wing (ridge along u)
  const prof = [[0, 0], [0.1, 0.55], [0.3, 0.95]];
  frustums(k, -0.1, 0.0, 0.65, 10, E + 0.12, prof, SLATE, { n: 5 });
  frustums(k, 0.0, -0.1, 10, 0.65, E + 0.12, prof, SLATE, { n: 5 });
  for (let u = 1.2; u < 9.8; u += 0.62) if (u < 5.2 || u > 7.5) dormer(k, u, 0.5, E + 0.45, { w: 4.5, h: 6, roof: "#5d6c88" });
  for (let v = 1.2; v < 9.8; v += 0.62) if (v < 5.2 || v > 7.5) dormer(k, 0.5, v, E + 0.45, { w: 4.5, h: 6, roof: "#4a5873", frame: shade(STONE, -0.1) });
}
function wings(k, t) {
  // masses
  k.box(0, 0, 0, 10, WP, E, STONE, { hatch: false, shadow: false, noTop: true });
  k.box(0, WP, 0, WP, 10 - WP, E, STONE, { hatch: false, shadow: false, noTop: true });
  const fr = { z1: E, col: STONE, bay: 0.62, floors: FLOORS, bands: BANDS, seed: 3 };
  facade(k, { ...fr, side: "L", c: WP, s0: WP, s1: 10 });
  facade(k, { ...fr, side: "R", c: WP, s0: WP, s1: 10 - 0.0 });
  // wing ends
  facade(k, { ...fr, side: "R", c: 10, s0: 0, s1: WP, floors: [FLOORS[1]], bands: [BANDS[2]], bay: 0.55 });
  facade(k, { ...fr, side: "L", c: 10, s0: 0, s1: WP, floors: [FLOORS[1]], bands: [BANDS[2]], bay: 0.55 });
  wingRoofs(k);
}
function balustrade(k, Q, s0, s1, z, side, c) {
  const ctx = k.ctx;
  const O = side === "L" ? (s, zz) => P(s, c + 0.07, zz) : (s, zz) => P(c + 0.07, s, zz);
  ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(...O(s0, z + 0.2)); ctx.lineTo(...O(s1, z + 0.2)); ctx.stroke();
  ctx.strokeStyle = shade(STONE, 0.25); ctx.lineWidth = 1.2; ctx.stroke();
  ctx.strokeStyle = "rgba(60,40,20,0.5)"; ctx.lineWidth = 0.9; ctx.beginPath();
  for (let s = s0; s <= s1; s += 0.1) { ctx.moveTo(...O(s, z)); ctx.lineTo(...O(s, z + 0.2)); }
  ctx.stroke();
}
function pavilion(k, t, u0, v0, du, dv, seedBase) {
  const Ep = E + 0.6;
  k.box(u0, v0, 0, du, dv, Ep, STONE, { hatch: false, shadow: false, noTop: true });
  const fl = [
    { z0: 0.08, z1: 1.2, w: 0.5, arch: true, mull: false, glass: "#403a3c" },
    { z0: 1.5, z1: 2.55, w: 0.36, ped: "tri", lit: 0.1 },
    { z0: 2.85, z1: 3.55, w: 0.3, arch: true, lit: 0.2, sill: false },
  ];
  const bands = [[1.28, 0.1, 0.09], [2.68, 0.1, 0.09], [Ep - 0.28, 0.28, 0.15]];
  facade(k, { side: "L", c: v0 + dv, s0: u0, s1: u0 + du, z1: Ep, col: STONE, bay: 0.56, floors: fl, bands, seed: seedBase });
  facade(k, { side: "R", c: u0 + du, s0: v0, s1: v0 + dv, z1: Ep, col: STONE, bay: 0.56, floors: fl, bands, seed: seedBase + 1 });
  // coupled columns on the corners (pilasters thicker)
  for (const [Q, a, b] of [[plane("L", v0 + dv), u0, u0 + du], [plane("R", u0 + du), v0, v0 + dv]]) for (const s of [a + 0.02, b - 0.02]) {
    k.path([Q(s - 0.07, 0), Q(s + 0.07, 0), Q(s + 0.07, Ep), Q(s - 0.07, Ep)], { fill: shade(STONE, 0.14), lw: 0.8, wobble: 0 });
  }
  // statues on the cornice
  for (let i = 0; i < 4; i++) { const f = (i + 0.5) / 4; statue(k, u0 + du * f, v0 + dv, Ep + 0.08, { s: 0.9 }); statue(k, u0 + du, v0 + dv * f, Ep + 0.08, { s: 0.9 }); }
  // curved mansard dome
  const prof = [[0, 0], [0.04, 0.4], [0.14, 0.95], [0.3, 1.5], [0.5, 1.95], [0.66, 2.15]];
  const z = Ep + 0.1;
  const T = frustums(k, u0, v0, du, dv, z, prof, "#5a6d92", { n: 4, noCap: true });
  // roundel dormers on the lower dome faces
  for (let i = 0; i < 3; i++) {
    const f = (i + 0.5) / 3;
    dormer(k, u0 + 0.12 + (du - 0.24) * f, v0 + dv - 0.1, z + 0.55, { w: 6, h: 8, roof: "#43587c" });
    dormer(k, u0 + du - 0.1, v0 + 0.12 + (dv - 0.24) * f, z + 0.55, { w: 6, h: 8, roof: "#39496a", frame: shade(STONE, -0.1) });
  }
  // gilded crown + lantern + flag
  const zt = z + 2.15;
  // pedimented central porch with paired columns on both faces
  for (const side of ["L", "R"]) {
    const c0 = side === "L" ? v0 + dv : u0 + du, mid = side === "L" ? u0 + du / 2 : v0 + dv / 2, Q = plane(side, c0), o = side === "L" ? 1 : 0;
    const wcol = shade(STONE, side === "R" ? -0.2 : 0.02);
    const a = mid - 0.5, b = mid + 0.5, ctx = k.ctx;
    for (const [x0, x1] of [[a, a + 0.14], [a + 0.2, a + 0.34], [b - 0.34, b - 0.2], [b - 0.14, b]]) {
      k.path([Q(x0, 0.2), Q(x1, 0.2), Q(x1, Ep - 0.1), Q(x0, Ep - 0.1)], { fill: shade(STONE, side === "R" ? -0.05 : 0.2), lw: 0.8, wobble: 0 });
    }
    k.path([Q(a - 0.08, Ep - 0.12), Q(b + 0.08, Ep - 0.12), Q(b + 0.08, Ep + 0.02), Q(a - 0.08, Ep + 0.02)], { fill: shade(STONE, 0.25), lw: 0.9, wobble: 0 });
    k.path([Q(a - 0.08, Ep + 0.02), Q(b + 0.08, Ep + 0.02), Q(mid, Ep + 0.55)], { fill: wcol, lw: 1.1, wobble: 0 });
    const g = Q(mid, Ep + 0.17); ctx.fillStyle = shade(STONE, -0.3); ctx.beginPath(); ctx.arc(g[0], g[1], 3.2, 0, 7); ctx.fill();
    k.path([Q(mid - 0.2, Ep + 0.08), Q(mid + 0.2, Ep + 0.08), Q(mid, Ep + 0.32)], { fill: "none", lw: 0.7, wobble: 0 });
  }
  frustums(k, u0 + 0.62, v0 + 0.58, du - 1.24, dv - 1.16, zt, [[0, 0], [0.06, 0.16], [0.14, 0.3]], GOLD, { n: 2, cap: "#e9c565" });
  const cu = u0 + du / 2, cv = v0 + dv / 2;
  k.cyl(cu, cv, zt + 0.3, 0.05, 0.4, GOLD);
  chimney(k, u0 + 0.12, v0 + dv - 0.4, Ep + 0.1, { w: 0.2, h: 0.55 }); chimney(k, u0 + du - 0.4, v0 + 0.12, Ep + 0.1, { w: 0.2, h: 0.55 });
  k.circle(...P(cu, cv, zt + 0.74), 2.4, GOLD, { lw: 0.8 });
  k.flag(cu, cv, zt + 0.7, { h: 0.9, w: 0.55, fh: 0.34 });
}

function palace(k, t) {
  wings(k, t);
  balustrade(k, null, WP, 10, E - 0.0, "L", WP);
  balustrade(k, null, WP, 10, E - 0.0, "R", WP);
  pavilion(k, t, 5.35, 0.0, 1.9, 1.3, 11);
  pavilion(k, t, 0.0, 5.35, 1.3, 1.9, 21);
  // statues along the cornice
  for (let u = 1.1; u < 10; u += 0.62) if (u < 5.3 || u > 7.4) statue(k, u, WP + 0.06, E + 0.08, { s: 0.9, arm: u % 1.3 < 0.62 });
  for (let v = 1.1; v < 10; v += 0.62) if (v < 5.3 || v > 7.4) statue(k, WP + 0.06, v, E + 0.08, { s: 0.9, arm: v % 1.3 < 0.62 });
  chimney(k, 4.2, 0.05, E + 1.1, { smoke: true, seed: 2 });
  chimney(k, 0.05, 4.6, E + 1.1, { smoke: true, seed: 5 });
  chimney(k, 8.6, 0.05, E + 1.1);
  chimney(k, 0.05, 9.0, E + 1.1);
}

// ---------- pools ----------
const POOLS = [
  [[383, 587], [650, 587], [513, 513]],
  [[360, 598], [448, 598], [360, 683]],
  [[585, 598], [668, 598], [668, 688]],
  [[215, 678], [348, 603], [348, 679]],
  [[688, 610], [828, 690], [697, 757]],
  [[520, 768], [680, 693], [680, 768]],
  [[523, 778], [672, 778], [530, 855]],
].map(uvs);
const FOUNTS = [[513, 538], [398, 618], [632, 618], [300, 640], [744, 668], [630, 740], [575, 805]].map(([x, y]) => uv(x, y));
function pool(k, poly) {
  k.ground(poly, "#8e939b", { lw: 1.4 });
  // coping thickness: a raised rim then the water
  const inner = scalePoly(poly, 0.9);
  k.ground(poly, "#aab0b8", { stroke: false, z: 0.05 });
  k.ground(poly, null, { lw: 1.4, z: 0.05 });
  const c = k.ctx;
  k.water(inner, { color: "#8fc2da", z: 0.03, density: 1.6, flow: 0.5 });
  k.ground(inner, null, { lw: 1.1, z: 0.03 });
}
function smallPyramid(k, u, v, s, t, seed) {
  const h = s * 0.95, a = s / 2;
  k.box(u - a - 0.06, v - a - 0.06, 0, s + 0.12, s + 0.12, 0.08, "#8d949c", { hatch: false, shadow: false });
  glassPyramid(k, u, v, a, h, t, seed, 3);
}

// ---------- the glass pyramid ----------
function glassPyramid(k, cu, cv, a, h, t, seed = 0, grid = 8) {
  const c = k.ctx;
  const A = [cu - a, cv - a], B = [cu + a, cv - a], C = [cu + a, cv + a], D = [cu - a, cv + a];
  const T = P(cu, cv, h);
  const pt = (p) => P(p[0], p[1], 0);
  const faces = [
    { id: "L", pts: [pt(D), pt(C)], sh: 0 },  // v+dv face (front-left)
    { id: "R", pts: [pt(B), pt(C)], sh: 1 },  // u+du face (front-right)
  ];
  const backFaces = [[pt(A), pt(B)], [pt(A), pt(D)]];
  const lat = (p0, p1, n, col, lw) => {
    c.strokeStyle = col; c.lineWidth = lw; c.beginPath();
    for (let i = 1; i < n; i++) {
      const f = i / n, X = [lerp(p0[0], p1[0], f), lerp(p0[1], p1[1], f)];
      const Y = [lerp(T[0], p1[0], f), lerp(T[1], p1[1], f)], Z = [lerp(p0[0], T[0], f), lerp(p0[1], T[1], f)];
      c.moveTo(...X); c.lineTo(...Y); c.moveTo(...X); c.lineTo(...Z);
    }
    c.stroke();
  };
  // back faces seen through the glass
  for (const [p0, p1] of backFaces) {
    c.beginPath(); c.moveTo(...p0); c.lineTo(...p1); c.lineTo(...T); c.closePath();
    c.fillStyle = "rgba(150,196,216,0.55)"; c.fill(); c.strokeStyle = "rgba(40,60,76,0.7)"; c.lineWidth = 1; c.stroke();
    lat(p0, p1, grid, "rgba(40,70,92,0.4)", 0.7);
  }
  // visible faces
  faces.forEach(({ pts: [p0, p1], sh }, fi) => {
    c.beginPath(); c.moveTo(...p0); c.lineTo(...p1); c.lineTo(...T); c.closePath();
    const g = c.createLinearGradient(p0[0], T[1], p1[0], p0[1]);
    if (sh === 0) { g.addColorStop(0, "rgba(206,234,244,0.9)"); g.addColorStop(0.5, "rgba(138,188,214,0.88)"); g.addColorStop(1, "rgba(84,138,172,0.9)"); }
    else { g.addColorStop(0, "rgba(120,176,204,0.92)"); g.addColorStop(1, "rgba(60,112,148,0.94)"); }
    c.fillStyle = g; c.fill();
    c.save(); c.clip();
    // drifting sky reflections (cloud blobs slide across)
    c.fillStyle = "rgba(255,255,255,0.28)";
    for (let i = 0; i < 4; i++) {
      const ph = ((t * 0.035 + i * 0.27 + seed * 0.1 + fi * 0.13) % 1);
      const x = lerp(p0[0] - 40, p1[0] + 40, ph), y = lerp(T[1] + 20, p0[1] - 8, (i * 0.37 + 0.2) % 1);
      c.beginPath(); c.ellipse(x, y, 26 * a, 8 * a, -0.15, 0, 7); c.fill();
    }
    // travelling highlight band
    const sw = ((t * 0.22 + seed * 0.2 + fi * 0.05) % 1.6) - 0.3;
    const bx = lerp(p0[0], p1[0], sw), g2 = c.createLinearGradient(bx - 24 * a, 0, bx + 24 * a, 0);
    g2.addColorStop(0, "rgba(255,255,255,0)"); g2.addColorStop(0.5, "rgba(255,255,255,0.5)"); g2.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g2; c.fillRect(Math.min(p0[0], p1[0]) - 10, T[1] - 4, Math.abs(p1[0] - p0[0]) + 20, Math.abs(p0[1] - T[1]) + 30);
    lat(p0, p1, grid, "rgba(36,56,72,0.62)", 0.9);
    // diamond frame: diagonals of the rhombus lattice
    c.strokeStyle = "rgba(230,245,255,0.35)"; c.lineWidth = 0.5; c.beginPath();
    for (let i = 1; i < grid * 2; i++) { const f = i / (grid * 2); const X = [lerp(p0[0], p1[0], f), lerp(p0[1], p1[1], f)]; c.moveTo(...X); c.lineTo(lerp(X[0], T[0], 1), lerp(X[1], T[1], 1)); }
    c.stroke();
    c.restore();
    c.beginPath(); c.moveTo(...p0); c.lineTo(...p1); c.lineTo(...T); c.closePath();
    c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
  });
  // steel ridge edges
  c.strokeStyle = "#4a5560"; c.lineWidth = 3; c.lineCap = "round";
  for (const p of [pt(D), pt(C), pt(B)]) { c.beginPath(); c.moveTo(...p); c.lineTo(...T); c.stroke(); }
  c.strokeStyle = "#9aa6b0"; c.lineWidth = 1.2; for (const p of [pt(D), pt(C), pt(B)]) { c.beginPath(); c.moveTo(...p); c.lineTo(...T); c.stroke(); }
  // base rail
  c.strokeStyle = "#3a434c"; c.lineWidth = 2.6; c.beginPath(); c.moveTo(...pt(D)); c.lineTo(...pt(C)); c.lineTo(...pt(B)); c.stroke();
  // sparkles
  for (let i = 0; i < 3 + grid / 3; i++) {
    const f = hash(i * 3.7 + seed), g = hash(i * 9.1 + seed), fx = lerp(pt(D)[0], pt(C)[0], f), fy = lerp(pt(D)[1], T[1], 0.2 + 0.6 * g) + (1 - Math.abs(f - 0.5) * 2) * 0;
    sparkle(k, lerp(lerp(pt(D)[0], pt(C)[0], f), T[0], g * 0.6), lerp(lerp(pt(D)[1], pt(C)[1], f), T[1], g * 0.6), t * 1.6 + i * 2.3 + seed, 1.1);
  }
  if (k.night) {
    // lit from inside: warm-white glass, bright lattice
    const big = grid > 5, pulse = 0.94 + 0.06 * Math.sin(t * 1.7 + seed);
    k.lit(() => {
      c.save();
      for (const [p0, p1] of [[pt(D), pt(C)], [pt(B), pt(C)]]) {
        c.beginPath(); c.moveTo(...p0); c.lineTo(...p1); c.lineTo(...T); c.closePath();
        const g = c.createLinearGradient(0, pt(C)[1], 0, T[1]);
        g.addColorStop(0, `rgba(255,236,170,${0.9 * pulse})`); g.addColorStop(1, `rgba(255,252,226,${0.97 * pulse})`);
        c.fillStyle = g; c.fill();
        c.save(); c.clip(); lat(p0, p1, grid, "rgba(150,110,50,0.55)", 0.9); c.restore();
        c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke();
      }
      c.restore();
    });
    k.glow(cu, cv, h * 0.45, big ? 3.6 : 1.1, "#ffd78a", big ? 0.55 : 0.4);
    if (big) k.glow(cu, cv, 0.1, 5.2, "#ffd78a", 0.35, { flat: true });
  }
}
function mainPyramid(k, t) {
  const cu = 5.0, cv = 5.0, a = 1.75, h = 2.85;
  k.box(cu - a - 0.1, cv - a - 0.1, 0, a * 2 + 0.2, a * 2 + 0.2, 0.1, "#9aa1a9", { hatch: false, shadow: false });
  glassPyramid(k, cu, cv, a, h, t, 1, 9);
  // entrance: a dark stair cut at the foot of the front-left face
  const c = k.ctx, u0 = cu - a + 0.35, u1 = cu - a + 0.95, v = cv + a + 0.02;
  c.beginPath(); c.moveTo(...P(u0, v, 0)); c.lineTo(...P(u1, v, 0)); c.lineTo(...P(u1, v, 0.42)); c.lineTo(...P(u0, v, 0.42)); c.closePath();
  c.fillStyle = "#2c3b48"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
  const gl = 0.55 + 0.15 * Math.sin(t * 2);
  c.fillStyle = `rgba(255,214,130,${gl * 0.7})`; c.fillRect(...P(u0 + 0.15, v, 0.28), 9, 6);
  for (let i = 0; i < 3; i++) k.line([P(u0 - i * 0.07, v + 0.08 + i * 0.1, 0), P(u1 + i * 0.07, v + 0.08 + i * 0.1, 0)], { lw: 0.9, wobble: 0 });
}

// queue stanchions in front of the entrance
function stanchions(k) {
  const c = k.ctx;
  const line = [[3.7, 7.6], [3.9, 8.2], [4.1, 8.8], [4.3, 9.3]];
  for (const side of [-0.35, 0.35]) for (let i = 0; i < line.length; i++) {
    const [u, v] = line[i]; const [x, y] = P(u + side, v - side, 0);
    c.fillStyle = "#33373d"; c.beginPath(); c.arc(x, y - 3.5, 1.6, 0, 7); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 3.5); c.stroke();
    if (i) { const [px, py] = P(line[i - 1][0] + side, line[i - 1][1] - side, 0); c.strokeStyle = "#b8342f"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(px, py - 3.5); c.lineTo(x, y - 3.5); c.stroke(); }
  }
}

// ---------- routes (from grid px, then cleaned against every obstacle) ----------
const px = (pts) => uvs(pts);
const LAMPS = [[128, 693], [237, 750], [357, 818], [572, 862], [688, 792], [790, 737], [896, 672], [682, 790]].map(([x, y]) => uv(x, y));
const PLANTERS = [[150, 726], [207, 738], [392, 850], [430, 874], [607, 865], [648, 836], [822, 740], [858, 728]].map(([x, y]) => uv(x, y));
const EASELS = [[462, 862], [506, 898], [304, 730]].map(([x, y]) => uv(x, y));
const CIRCLES = [...LAMPS.map(([u, v]) => [u, v, 0.32]), ...PLANTERS.map(([u, v]) => [u, v, 0.62]), ...EASELS.map(([u, v]) => [u, v, 0.55])];
const BLOCKS = [
  [[3.0, 3.0], [7.0, 3.0], [7.0, 7.0], [3.0, 7.0]],               // pyramid + plinth
  [[4.9, -1], [7.7, -1], [7.7, 1.9], [4.9, 1.9]], [[-1, 4.9], [1.9, 4.9], [1.9, 7.7], [-1, 7.7]], // pavilions
  [[-1, -1], [11, -1], [11, 0.95], [-1, 0.95]], [[-1, -1], [0.95, -1], [0.95, 11], [-1, 11]],     // walls
  [[3.5, 7.3], [4.5, 7.3], [4.7, 9.6], [3.5, 9.6]],             // stanchion queue lane
];
const KEEP_POLYS = [...POOLS.map((p) => scalePoly(p, 1.14)), ...BLOCKS];
function clean(route) {
  const d = dense(route, 0.2);
  const ok = (p) => p[0] > 0.3 && p[0] < 9.8 && p[1] > 0.3 && p[1] < 9.8 && CIRCLES.every(([u, v, r]) => Math.hypot(p[0] - u, p[1] - v) > r) && KEEP_POLYS.every((q) => !inPoly(p, q));
  let best = [], cur = [];
  for (const p of d) { if (ok(p)) cur.push(p); else { if (cur.length > best.length) best = cur; cur = []; } }
  if (cur.length > best.length) best = cur;
  const out = best.filter((_, i) => i % 3 === 0 || i === best.length - 1);
  return out.length >= 2 ? out : d.slice(0, 2);
}
const raw = {
  front: px([[120, 676], [230, 722], [330, 775], [440, 832], [520, 870]]),
  backL: px([[75, 640], [150, 640], [215, 610], [330, 545], [440, 490]]),
  backR: px([[945, 640], [880, 640], [800, 610], [690, 555], [580, 495]]),
  frontR: px([[890, 690], [820, 710], [740, 760], [660, 805], [610, 840]]),
  entr: px([[300, 790], [380, 760], [430, 725]]),
  mid: px([[470, 860], [580, 830], [700, 815]]),
  queue: px([[487, 808], [468, 772], [452, 738], [441, 712]]),
  midL: px([[200, 700], [290, 700], [350, 700]]),
  rite: px([[950, 690], [900, 680], [850, 660]]),
};
const loopify = (r) => {
  if (r.length < 2) return r;
  const a = r[0], b = r[r.length - 1], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L * 0.32, ny = dx / L * 0.32;
  return [...r, ...r.slice().reverse().map(([u, v]) => [u + nx, v + ny])];
};
const ROUTES = Object.fromEntries(Object.entries(raw).map(([k2, v]) => [k2, k2 === "queue" ? v : loopify(clean(v))]));

export default function draw(k, t) {
  const c = k.ctx;
  k.groundTrace({ lawn: [], water: [], walks: [] }, { paved: SAND, side: "#e3d3b0", stipple: 6 });
  cobbles(k, [[0, 0], [10, 0], [10, 10], [0, 10]], { gap: 0.26, line: "rgba(130,100,60,0.2)" });
  // palace (behind everything)
  palace(k, t);
  // pools + their jets
  for (const p of POOLS) pool(k, p);
  const pollen = [];
  // small pyramids + main pyramid + props, depth sorted
  k.q(5.4, () => smallPyramid(k, ...uv(341, 578), 0.8, t, 2));
  k.q(5.4, () => smallPyramid(k, ...uv(694, 576), 0.8, t, 3));
  k.q(14.2, () => smallPyramid(k, ...uv(728, 780), 1.0, t, 4));
  FOUNTS.forEach(([u, v], i) => k.q(u + v + 0.4, () => jet(k, u, v, 0.03, 0.95 + (i % 3) * 0.12, t, { seed: i + 1, n: 12, spread: 0.55 })));
  k.q(10.0, () => mainPyramid(k, t));
  k.q(10.1, () => stanchions(k));
  // lamps, planters
  for (const [u, v] of LAMPS) k.q(u + v, () => k.lamp(u, v, { col: "#2f4a3c" }));
  for (const [x, y, tall] of [[150, 726, 0], [207, 738, 1], [392, 850, 1], [430, 874, 0], [607, 865, 0], [648, 836, 1], [822, 740, 1], [858, 728, 0]]) {
    const [u, v] = uv(x, y);
    k.q(u + v + 0.6, () => { planter(k, u - 0.35, v - 0.17); if (tall) { const [bx, by] = P(u, v, 0.3); c.fillStyle = "#6f9f52"; c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.ellipse(bx, by - 15, 5.6, 9, 0, 0, 7); c.fill(); c.stroke(); } });
  }
  // painters at easels
  for (const [x, y, s] of [[462, 862, 1], [506, 898, 2]]) {
    const [u, v] = uv(x, y);
    k.q(u + v, () => {
      const [ex, ey] = P(u - 0.3, v + 0.1, 0); c.strokeStyle = "#7a5233"; c.lineWidth = 2; c.beginPath(); c.moveTo(ex - 6, ey); c.lineTo(ex, ey - 24); c.lineTo(ex + 6, ey); c.stroke();
      k.path([[ex - 8, ey - 28], [ex + 8, ey - 30], [ex + 8, ey - 15], [ex - 8, ey - 13]], { fill: "#fbf8ef", lw: 1.1, wobble: 0 });
      const pr = (t * 0.2 + s * 0.3) % 1; c.strokeStyle = "#5a8fbf"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(ex - 6, ey - 16); c.lineTo(ex - 6 + pr * 12, ey - 16 - pr * 9); c.stroke();
      k.person(u, v, { pose: "paint", dir: [-0.9, 0.35], seed: 80 + s, hat: "beret", hatCol: s % 2 ? "#c8403a" : "#2a2420", style: s % 2 ? "coat" : "stripes" });
    });
  }
  // pigeons
  for (const [x, y, s] of [[572, 512, 1], [603, 535, 2], [660, 741, 3], [850, 575, 4], [538, 888, 5], [228, 630, 6]]) { const [u, v] = uv(x, y); k.q(u + v, () => pigeon(k, u, v, t, s)); }

  // ---------- life ----------
  const keep = [[5, 5, 2.7]];
  const spec = [
    ["front", 0.0, 21, 0.5], ["front", 0.07, 22, 0.5], ["front", 0.14, 23, 0.5],
    ["backL", 0.2, 24, 0.45], ["backL", 0.28, 25, 0.45], ["backL", 0.36, 40, 0.45],
    ["backR", 0.1, 26, 0.47], ["backR", 0.18, 27, 0.47], ["backR", 0.26, 41, 0.47],
    ["frontR", 0.0, 28, 0.48], ["frontR", 0.08, 29, 0.48], ["frontR", 0.16, 30, 0.48],
    ["entr", 0.3, 31, 0.4], ["entr", 0.38, 32, 0.4],
    ["mid", 0.4, 33, 0.46], ["midL", 0.2, 34, 0.4], ["rite", 0.5, 35, 0.35],
    ["queue", 0.0, 36, 0.1], ["queue", 0.25, 37, 0.1], ["queue", 0.5, 38, 0.1], ["queue", 0.75, 39, 0.1],
  ];
  for (const [r, off, seed, sp] of spec) k.qwalker(ROUTES[r], { loop: r !== "queue", speed: sp, offset: off, seed, dwell: r === "queue" ? 5 : 1.2 + (seed % 3) * 0.6 });
  // tourists posing / photographing the pyramid
  k.qperson(...uv(385, 716), { pose: "photo", dir: [0.7, -0.6], seed: 71 });
  k.qperson(...uv(358, 722), { pose: "wave", dir: [0.8, 0.2], seed: 72 });
  k.qperson(...uv(405, 722), { pose: "cheer", dir: [0.3, 0.8], seed: 73 });
  k.qperson(...uv(574, 760), { pose: "photo", dir: [-0.2, -1], seed: 75 });
  k.qcyclist(ROUTES.front, { loop: true, speed: 0.9, offset: 0.55, seed: 76, col: "#c8403a", basket: true });
  debugRoutes(k, Object.values(ROUTES), KEEP_POLYS);
  k.flush();
  // sky
  flock(k, 640, 300, 5, t, 2);
  k.circlingBird(480, 250, 80, 22, { speed: 0.6, phase: 0 });
  k.cloud(220, 210, { s: 0.8, phase: 1 });
  k.cloud(800, 190, { s: 0.7, phase: 3 });
}
