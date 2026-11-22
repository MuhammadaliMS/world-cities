// Covent Garden Market Hall, grid pass: an axis-aligned stone building across the back (long axis along u),
// built from solids through P(). Left face (v+ side) = arcaded facade + Tuscan portico with pediment;
// right face (u+ end) = arcaded pavilion end. Glazed iron-ribbed hipped vault over the nave, slate mansard
// pavilions with dormers and chimneys.
import { P, INK, shade, lerp, mix, rng } from "../../lib/vec-kit.js";

const ST = "#e8d5a9", ST_L = "#f3e6c3", ST_D = "#cbb386", SL = "#6f7388", BRICK = "#b5553c", IRON = "#35544f";
// footprint
const U0 = 0.8, U1 = 9.2, V0 = 0.6, VF = 3.3;           // whole hall, front plane v = VF
const PU0 = 2.48, PU1 = 7.52;                            // pavilions are outside this span
const ZS = 1.72;                                         // string course
const ZW = 2.9, ZP = 3.1;                                // wing parapet, pavilion eave
const BAY = 0.84;
// portico
const PCOL = [4.16, 4.72, 5.28, 5.84], PV = 3.95;
export const COLUMNS = PCOL;

const arch = (Pf, c0, z0, zs, r, n = 12) => {
  const o = [Pf(c0 - r, z0), Pf(c0 - r, zs)];
  for (let i = 1; i < n; i++) { const a = Math.PI - (i / n) * Math.PI; o.push(Pf(c0 + Math.cos(a) * r, zs + Math.sin(a) * r)); }
  o.push(Pf(c0 + r, zs), Pf(c0 + r, z0));
  return o;
};
const PL = (vF) => (a, z) => P(a, vF, z);
const PR = (uF) => (a, z) => P(uF, a, z);

// lit shop / market opening
function shopArch(k, Pf, c0, z0, zs, r, seed, t, ring = true) {
  const c = k.ctx;
  if (ring) k.path(arch(Pf, c0, z0, zs, r + 0.07), { fill: ST_D, lw: 1, wobble: 0 });
  const pts = arch(Pf, c0, z0, zs, r);
  c.save(); k._trace(pts, true, 0); c.clip();
  const y0 = Pf(c0, z0)[1], y1 = Pf(c0, zs + r)[1];
  const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, "#f29a3a"); g.addColorStop(0.5, "#ffc65e"); g.addColorStop(1, "#ffe596");
  c.fillStyle = g; c.fillRect(Pf(c0 - r, z0)[0] - 40, y1 - 4, 200, y0 - y1 + 8);
  const R = rng(seed);
  for (let i = 0; i < 14; i++) {
    const [x, y] = Pf(c0 - r * 0.8 + R() * r * 1.6, z0 + (zs - z0) * (0.1 + R() * 0.7));
    c.fillStyle = ["#d9544b", "#f4c542", "#6aa05a", "#f08bb5", "#fff3d8", "#8a5a30"][i % 6]; c.beginPath(); c.arc(x, y, 1.8, 0, 7); c.fill();
  }
  const [cx, cy] = Pf(c0, (z0 + zs) / 2), rg = c.createRadialGradient(cx, cy, 1, cx, cy, 34); rg.addColorStop(0, `rgba(255,248,205,${0.5 + Math.sin(t * 2.2 + seed) * 0.06})`); rg.addColorStop(1, "rgba(255,230,150,0)");
  c.fillStyle = rg; c.fillRect(cx - 40, cy - 40, 80, 80);
  c.strokeStyle = "rgba(53,84,79,0.85)"; c.lineWidth = 1.1;
  c.beginPath();
  const a = Pf(c0, z0), b = Pf(c0, zs + r); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]);
  const zt = z0 + (zs - z0) * 0.6, p = Pf(c0 - r, zt), q = Pf(c0 + r, zt); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]);
  c.stroke();
  c.restore();
  k.path(pts, { fill: null, lw: 1.2, wobble: 0 });
  const [kx, ky] = Pf(c0, zs + r + 0.07); k.path([[kx - 2.6, ky - 1], [kx + 2.6, ky - 1], [kx + 1.8, ky + 5], [kx - 1.8, ky + 5]], { fill: ST_L, lw: 0.8, wobble: 0 });
}
// first-floor window with hood
function upperWin(k, Pf, c0, z0, w, h, seed, t) {
  const q = [Pf(c0 - w / 2, z0), Pf(c0 + w / 2, z0), Pf(c0 + w / 2, z0 + h), Pf(c0 - w / 2, z0 + h)];
  const lit = ((seed * 7) % 5) === 0;
  const c = k.ctx;
  k.path([Pf(c0 - w / 2 - 0.05, z0 - 0.03), Pf(c0 + w / 2 + 0.05, z0 - 0.03), Pf(c0 + w / 2 + 0.05, z0 + h + 0.05), Pf(c0 - w / 2 - 0.05, z0 + h + 0.05)], { fill: ST_L, lw: 0.9, wobble: 0 });
  k.path(q, { fill: lit ? "#f3d57a" : "#5d7486", lw: 1, wobble: 0 });
  c.strokeStyle = lit ? "rgba(120,80,30,0.7)" : "#e8e1cf"; c.lineWidth = 0.9; c.beginPath();
  let a = Pf(c0, z0), b = Pf(c0, z0 + h); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]);
  a = Pf(c0 - w / 2, z0 + h * 0.62); b = Pf(c0 + w / 2, z0 + h * 0.62); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
  if (!lit) { c.fillStyle = "rgba(255,255,255,0.22)"; const g = Pf(c0 - w / 2 + 0.02, z0 + h - 0.02), g2 = Pf(c0 - w / 2 + w * 0.3, z0 + h - 0.02), g3 = Pf(c0 - w / 2 + 0.02, z0 + h * 0.55); c.beginPath(); c.moveTo(...g); c.lineTo(...g2); c.lineTo(...g3); c.closePath(); c.fill(); }
  // pediment hood
  k.path([Pf(c0 - w / 2 - 0.07, z0 + h + 0.05), Pf(c0 + w / 2 + 0.07, z0 + h + 0.05), Pf(c0, z0 + h + 0.05 + w * 0.38)], { fill: ST, lw: 0.9, wobble: 0 });
}
function awningOn(k, Pf, vF, c0, w, z, seed) {
  // striped shop awning over an opening on the left face (projects toward +v)
  const n = 5, d = 0.42, drop = 0.3;
  for (let i = 0; i < n; i++) {
    const a = c0 - w / 2 + (w * i) / n, b = c0 - w / 2 + (w * (i + 1)) / n, col = i % 2 ? "#f7efe2" : "#d63e3c";
    k.poly([[a, vF, z], [b, vF, z], [b, vF + d, z - drop], [a, vF + d, z - drop]], col, { lw: 0.9, wobble: 0 });
    const [x0, y0] = P(a, vF + d, z - drop), [x1, y1] = P(b, vF + d, z - drop), c = k.ctx;
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 4, x1, y1); c.lineTo(x1, y1 - 2.5); c.lineTo(x0, y0 - 2.5); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
  }
}

function basket(k, Pf, c0, z, seed, t) {
  const c = k.ctx, R = rng(seed), [x, y] = Pf(c0, z);
  c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - 8, y - 12); c.lineTo(x - 6, y); c.moveTo(x + 8, y - 12); c.lineTo(x + 6, y); c.stroke();
  c.fillStyle = "#4f7036"; c.beginPath(); c.ellipse(x, y + 1.5, 9, 6, 0, 0, 7); c.fill(); c.stroke();
  for (let i = 0; i < 16; i++) { const a = R() * 6.28, d = Math.sqrt(R()) * 8; c.fillStyle = ["#f08bb5", "#e8607a", "#ffffff", "#f4a2c4", "#d94a7a"][i % 5]; c.beginPath(); c.arc(x + Math.cos(a) * d, y - 2 + Math.sin(a) * d * 0.55 + Math.sin(t * 1.5 + i + seed) * 0.3, 2, 0, 7); c.fill(); }
  c.fillStyle = "#6a9a48"; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(x - 7 + i * 3.5, y + 6 + (i % 2) * 1.5, 1.7, 0, 7); c.fill(); }
}

// one stretch of the left facade (plane v = VF) between u a and b, in bays; opts say which bays are special
function facadeL(k, t, a, b, o = {}) {
  const Pf = PL(VF), n = Math.round((b - a) / BAY), bw = (b - a) / n;
  // rustication on the ground floor
  for (let z = 0.2; z < ZS - 0.1; z += 0.2) k.line3([[a, VF, z], [b, VF, z]], { stroke: "rgba(120,95,60,0.2)", lw: 0.8, wobble: 0 });
  for (let i = 0; i < n; i++) {
    const c0 = a + (i + 0.5) * bw, skip = o.skip && o.skip(c0);
    if (skip) continue;
    shopArch(k, Pf, c0, 0.04, 1.2, bw * 0.34, (c0 * 17) | 0, t);
    if (o.awn && o.awn(i)) awningOn(k, Pf, VF, c0, bw * 0.78, 1.5, i);
    if (!(o.noUpper && o.noUpper(c0))) upperWin(k, Pf, c0, ZS + 0.3, bw * 0.34, 0.6, i + (a * 3 | 0), t);
  }
  // piers
  for (let i = 0; i <= n; i++) { const u = a + i * bw; k.line3([[u, VF, 0], [u, VF, ZW]], { stroke: "rgba(120,95,60,0.5)", lw: 1, wobble: 0 }); }
  // string course
  k.box(a - 0.02, VF, ZS - 0.04, b - a + 0.04, 0.06, 0.09, ST_L, { shadow: false, hatch: false });
}

// chimney with pots
function chimney(k, u, v, z, h) {
  const bx = k.box(u, v, z, 0.34, 0.28, h, BRICK, { shadow: false, hatch: false });
  const c = k.ctx;
  c.strokeStyle = "rgba(60,25,15,0.35)"; c.lineWidth = 0.7;
  for (let zz = z + 0.12; zz < z + h; zz += 0.12) { const a = P(u, v + 0.28, zz), b = P(u + 0.34, v + 0.28, zz), d = P(u + 0.34, v, zz); c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.lineTo(...d); c.stroke(); }
  k.box(u - 0.03, v - 0.03, z + h, 0.4, 0.34, 0.08, ST_L, { shadow: false, hatch: false });
  for (let i = 0; i < 3; i++) k.cyl(u + 0.08 + i * 0.09, v + 0.14, z + h + 0.08, 0.04, 0.2, "#c8693d");
}
function dormerL(k, u, vF, z, w, h, seed, t) {
  const bx = k.box(u, vF - 0.3, z, w, 0.3, h, ST, { shadow: false, hatch: false });
  const Pf = PL(vF);
  k.path([Pf(u + w * 0.2, z + h * 0.12), Pf(u + w * 0.8, z + h * 0.12), Pf(u + w * 0.8, z + h * 0.88), Pf(u + w * 0.2, z + h * 0.88)], { fill: ((seed * 5) % 3 === 0) ? "#f3d57a" : "#5d7486", lw: 0.9, wobble: 0 });
  k.gable(u - 0.04, vF - 0.34, z + h, w + 0.08, 0.34, 0.22, SL, { ridge: "v" });
}
function dormerR(k, uF, v, z, w, h, seed) {
  const bx = k.box(uF - 0.3, v, z, 0.3, w, h, ST, { shadow: false, hatch: false });
  const Pf = PR(uF);
  k.path([Pf(v + w * 0.2, z + h * 0.12), Pf(v + w * 0.8, z + h * 0.12), Pf(v + w * 0.8, z + h * 0.88), Pf(v + w * 0.2, z + h * 0.88)], { fill: ((seed * 5) % 3 === 0) ? "#f3d57a" : "#5d7486", lw: 0.9, wobble: 0 });
  k.gable(uF - 0.34, v - 0.04, z + h, 0.34, w + 0.08, 0.22, SL, { ridge: "u" });
}
function slateCourses(k, u, v, z, du, dv, h, inset) {
  // horizontal slate courses on the visible mansard slopes (left, right)
  const c = k.ctx; c.strokeStyle = "rgba(30,32,50,0.35)"; c.lineWidth = 0.7;
  for (let f = 0.12; f < 0.95; f += 0.14) {
    const i = inset * f, zz = z + h * f;
    c.beginPath(); c.moveTo(...P(u + i, v + dv - i, zz)); c.lineTo(...P(u + du - i, v + dv - i, zz)); c.lineTo(...P(u + du - i, v + i, zz)); c.stroke();
  }
}
function balustrade(k, u0, u1, v, z, h) {
  const c = k.ctx, step = 0.1;
  c.strokeStyle = INK; c.lineWidth = 1.8; c.lineCap = "round";
  for (let u = u0 + 0.05; u < u1; u += step) { const a = P(u, v, z), b = P(u, v, z + h * 0.82); c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); }
  c.strokeStyle = ST_L; c.lineWidth = 1;
  for (let u = u0 + 0.05; u < u1; u += step) { const a = P(u, v, z), b = P(u, v, z + h * 0.82); c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); }
  k.box(u0, v - 0.04, z + h * 0.8, u1 - u0, 0.1, 0.07, ST_L, { shadow: false, hatch: false });
  k.box(u0, v - 0.04, z - 0.02, u1 - u0, 0.1, 0.06, ST_L, { shadow: false, hatch: false });
}
function urn(k, u, v, z) {
  k.box(u - 0.07, v - 0.07, z, 0.14, 0.14, 0.1, ST_L, { shadow: false, hatch: false });
  k.cyl(u, v, z + 0.1, 0.09, 0.14, ST_L, { top: false });
  k.cyl(u, v, z + 0.24, 0.05, 0.06, ST_L);
}

// ---------- the glazed iron vault ----------
const VA = { u0: 2.75, u1: 7.25, vc: 2.0, w: 1.22, ze: 3.15, h: 2.5, e: 1.1 };
function vaultPt(a, th) {
  const L = VA.u1 - VA.u0, d = Math.min(a, 1 - a) * L, g = d < VA.e ? Math.sqrt(1 - (1 - d / VA.e) ** 2) : 1;
  return [VA.u0 + a * L, VA.vc + Math.sin(th) * VA.w * g, VA.ze + VA.h * g * Math.cos(th)];
}
const VP = (a, th, dz = 0) => { const [u, v, z] = vaultPt(a, th); return P(u, v, z - dz); };
let VCELLS = null;
function vault(k, t) {
  const c = k.ctx, NA = 30, NT = 15, T0 = -0.45, T1 = Math.PI / 2;
  if (!VCELLS) {
    VCELLS = [];
    for (let i = 0; i < NA; i++) for (let j = 0; j < NT; j++) {
      const a0 = i / NA, a1 = (i + 1) / NA, t0 = T0 + (T1 - T0) * (j / NT), t1 = T0 + (T1 - T0) * ((j + 1) / NT);
      const m = vaultPt((a0 + a1) / 2, (t0 + t1) / 2);
      VCELLS.push({ i, j, a0, a1, t0, t1, d: m[0] + m[1], hgt: Math.cos((t0 + t1) / 2) });
    }
    VCELLS.sort((p, q) => p.d - q.d);
  }
  // plinth ring
  k.box(2.65, 0.7, ZW, 4.7, 2.55, 0.2, ST, { shadow: false, hatch: false, top: "#9a9aa0" });
  const sparkle = (i, j) => Math.max(0, Math.sin(t * 1.7 + i * 0.9 + j * 1.9)) ** 12;
  for (const cl of VCELLS) {
    const q = [VP(cl.a0, cl.t0), VP(cl.a1, cl.t0), VP(cl.a1, cl.t1), VP(cl.a0, cl.t1)];
    let col = mix("#d6eeec", "#6f9fb5", Math.pow(1 - cl.hgt, 1.3));
    const endR = cl.a0 > 1 - VA.e / (VA.u1 - VA.u0);
    if (endR) col = shade(col, -0.1);
    col = shade(col, ((cl.i + cl.j) % 2 ? 0.035 : -0.02) + sparkle(cl.i, cl.j) * 0.18);
    k.path(q, { fill: col, stroke: "rgba(53,84,79,0.5)", lw: 0.6, wobble: 0 });
  }
  const NG = NT;
  // long iron bars every 3rd
  c.lineCap = "round"; c.lineJoin = "round";
  for (let j = 0; j <= NT; j += 3) {
    const th = T0 + (T1 - T0) * (j / NT);
    c.beginPath(); for (let i = 0; i <= NA * 2; i++) { const p = VP(i / (NA * 2), th); if (i) c.lineTo(...p); else c.moveTo(...p); }
    c.strokeStyle = "rgba(30,50,46,0.7)"; c.lineWidth = 1.1; c.stroke();
  }
  // trussed arch ribs (outer + inner arc + cross ties) at every 5th bay line
  for (let i = 3; i < NA; i += 5) {
    const a = i / NA;
    for (const [dz, lw] of [[0, 2.6], [0.28, 1.4]]) {
      c.beginPath(); for (let j = 0; j <= 30; j++) { const th = T0 + (T1 - T0) * (j / 30), p = VP(a, th, dz); if (j) c.lineTo(...p); else c.moveTo(...p); }
      c.strokeStyle = INK; c.lineWidth = lw + 1.4; c.stroke(); c.strokeStyle = IRON; c.lineWidth = lw; c.stroke();
      c.strokeStyle = "rgba(190,225,215,0.45)"; c.lineWidth = Math.max(0.5, lw * 0.28); c.stroke();
    }
    c.strokeStyle = IRON; c.lineWidth = 0.9; c.beginPath();
    for (let j = 1; j < 30; j += 2) { const th = T0 + (T1 - T0) * (j / 30); const p = VP(a, th, 0), q = VP(a, th, 0.28); c.moveTo(...p); c.lineTo(...q); }
    c.stroke();
  }
  // ridge spine
  c.beginPath(); for (let i = 0; i <= 60; i++) { const p = VP(i / 60, 0); if (i) c.lineTo(...p); else c.moveTo(...p); }
  c.strokeStyle = INK; c.lineWidth = 4; c.stroke(); c.strokeStyle = IRON; c.lineWidth = 2.4; c.stroke();
  // finials
  for (const [a, h] of [[0.5, 0.85], [0.15, 0.45], [0.85, 0.45]]) {
    const [u, v, z] = vaultPt(a, 0), [x, y] = P(u, v, z), [, yt] = P(u, v, z + h);
    c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt); c.stroke(); c.strokeStyle = "#cbb386"; c.lineWidth = 1.2; c.stroke();
    c.fillStyle = "#e2bd55"; c.beginPath(); c.arc(x, yt - 2, a === 0.5 ? 3 : 2.2, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
  }
}

// ---------- pavilions ----------
function pavilion(k, t, side) {
  const u0 = side < 0 ? U0 : PU1, u1 = side < 0 ? PU0 : U1, du = u1 - u0, dv = VF - V0;
  k.box(u0, V0, 0, du, dv, ZP, ST, { shadow: false, hatch: false });
  facadeL(k, t, u0, u1, { awn: (i) => (side < 0 ? i === 1 : i === 0) });
  if (side > 0) {
    // right end (u = U1): three bays along v
    const Pf = PR(U1), n = 3, bw = dv / n;
    for (let z = 0.2; z < ZS - 0.1; z += 0.2) k.line3([[U1, V0, z], [U1, VF, z]], { stroke: "rgba(120,95,60,0.2)", lw: 0.8, wobble: 0 });
    for (let i = 0; i < n; i++) { const c0 = V0 + (i + 0.5) * bw; shopArch(k, Pf, c0, 0.04, 1.2, bw * 0.34, 90 + i, t); upperWin(k, Pf, c0, ZS + 0.3, bw * 0.34, 0.65, i + 3, t); }
    for (let i = 0; i <= n; i++) { const v = V0 + i * bw; k.line3([[U1, v, 0], [U1, v, ZP]], { stroke: "rgba(120,95,60,0.5)", lw: 1, wobble: 0 }); }
    k.box(U1 - 0.02, V0 - 0.02, ZS - 0.04, 0.06, dv + 0.04, 0.09, ST_L, { shadow: false, hatch: false });
    // awning on the end bay nearest the viewer
    { const c0 = V0 + 2.5 * bw; for (let i = 0; i < 5; i++) { const a = c0 - bw * 0.39 + (bw * 0.78 * i) / 5, b = c0 - bw * 0.39 + (bw * 0.78 * (i + 1)) / 5; k.poly([[U1, a, 1.5], [U1, b, 1.5], [U1 + 0.42, b, 1.2], [U1 + 0.42, a, 1.2]], i % 2 ? "#f7efe2" : "#d63e3c", { lw: 0.9, wobble: 0 }); } }
  }
  // cornice
  k.box(u0 - 0.06, VF, ZP - 0.12, du + 0.06 + (side > 0 ? 0.06 : 0), 0.14, 0.12, ST_L, { shadow: false, hatch: false });
  if (side > 0) k.box(U1, V0 - 0.06, ZP - 0.12, 0.14, dv + 0.06, 0.12, ST_L, { shadow: false, hatch: false });
  // mansard
  const inset = 0.42, hh = 0.95;
  k.hip(u0 - 0.04, V0 - 0.04, ZP, du + 0.08, dv + 0.08, hh, SL, { inset });
  slateCourses(k, u0 - 0.04, V0 - 0.04, ZP, du + 0.08, dv + 0.08, hh, inset);
  // dormers
  if (side < 0) { for (const f of [0.28, 0.72]) dormerL(k, u0 + du * f - 0.17, VF - 0.12, ZP + 0.18, 0.34, 0.4, f * 9, t); }
  else { for (const f of [0.28, 0.72]) dormerL(k, u0 + du * f - 0.17, VF - 0.12, ZP + 0.18, 0.34, 0.4, f * 9 + 2, t); for (const f of [0.28, 0.72]) dormerR(k, U1 - 0.12, V0 + dv * f - 0.17, ZP + 0.18, 0.34, 0.4, f * 7); }
  // flat deck + chimneys
  if (side < 0) { chimney(k, u0 + 0.3, V0 + 0.7, ZP + 0.5, 0.95); chimney(k, u0 + 1.0, V0 + 0.7, ZP + 0.5, 0.8); }
  else { chimney(k, u1 - 0.7, V0 + 0.7, ZP + 0.5, 0.95); chimney(k, u1 - 1.4, V0 + 0.7, ZP + 0.5, 0.8); }
  void t;
}

export function makeHall() {
  return {
    columns: PCOL,
    // everything behind the people: pavilions, nave, glass vault
    body(k, t) {
      const c = k.ctx;
      // plinth + shadow in front
      k.ground([[U0 - 0.12, V0 - 0.12], [U1 + 0.12, V0 - 0.12], [U1 + 0.12, VF + 0.08], [U0 - 0.12, VF + 0.08]], "#d9cfb8", { lw: 1 });
      const g = c.createLinearGradient(...P(0, VF), ...P(0, VF + 0.9));
      g.addColorStop(0, "rgba(70,45,45,0.22)"); g.addColorStop(1, "rgba(70,45,45,0)");
      k.ground([[U0, VF + 0.08], [U1, VF + 0.08], [U1, VF + 0.9], [U0, VF + 0.9]], g, { stroke: false });
      k.shadow([[U1 + 0.12, V0, 0], [U1 + 0.6, V0 + 0.2, 0], [U1 + 0.6, VF + 0.4, 0], [U1 + 0.12, VF, 0]], 0.1);
      // portico floor + steps
      k.ground([[3.85, VF], [6.15, VF], [6.15, 4.3], [3.85, 4.3]], "#e6d7b6", { lw: 1 });
      k.box(3.8, 4.2, 0, 2.4, 0.18, 0.06, "#dccaa0", { shadow: false, hatch: false });
      pavilion(k, t, -1);
      // wings + nave front block
      const w0 = PU0, w1 = PU1;
      k.box(w0, V0, 0, w1 - w0, VF - V0, ZW, ST, { shadow: false, hatch: false, top: "#9a9aa0" });
      facadeL(k, t, w0, w1, {
        skip: (c0) => c0 > 4.2 && c0 < 5.8, noUpper: (c0) => c0 > 3.9 && c0 < 6.1, awn: () => false,
      });
      // grand arch in the middle (market interior glimpsed behind the portico)
      {
        const Pf = PL(VF);
        const r = 0.7, c0 = 5.0;
        k.path(arch(Pf, c0, 0.04, 1.45, r + 0.12), { fill: ST_D, lw: 1.1, wobble: 0 });
        const pts = arch(Pf, c0, 0.04, 1.45, r);
        c.save(); k._trace(pts, true, 0); c.clip();
        const y0 = P(c0, VF, 0)[1], y1 = P(c0, VF, 2.2)[1];
        const gg = c.createLinearGradient(0, y0, 0, y1); gg.addColorStop(0, "#c8742f"); gg.addColorStop(0.5, "#f7b658"); gg.addColorStop(1, "#ffe9a8");
        c.fillStyle = gg; c.fillRect(P(c0 - r, VF)[0] - 4, y1 - 4, 2 * r * 45 + 8, y0 - y1 + 8);
        // receding arcades (nested arches, darker toward the back)
        for (let i = 1; i <= 3; i++) { const rr = r * (1 - i * 0.2), zz = 1.45 - i * 0.12; const ap = arch((a, z) => P(a, VF - i * 0.35, z), c0, 0.04, zz, rr); k.path(ap, { fill: mix("#ffe3a0", "#9a5a28", i / 3.3), stroke: "rgba(80,50,20,0.7)", lw: 0.9, wobble: 0 }); }
        // stalls in the depth
        const R = rng(7); for (let i = 0; i < 26; i++) { const [x, y] = P(c0 - 0.6 + R() * 1.2, VF - 0.3 - R() * 0.9, 0.1 + R() * 0.55); c.fillStyle = ["#d9544b", "#f4c542", "#6aa05a", "#f08bb5", "#fff3d8", "#7a4ea8"][i % 6]; c.beginPath(); c.arc(x, y, 2.1, 0, 7); c.fill(); }
        // wrought-iron fanlight
        c.strokeStyle = "rgba(30,50,46,0.8)"; c.lineWidth = 1; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(...P(c0, VF, 1.45)); c.lineTo(...P(c0 + Math.sin(i * 0.5) * r, VF, 1.45 + Math.cos(i * 0.5) * r)); c.stroke(); }
        const bloom = c.createRadialGradient(...P(c0, VF, 0.9), 2, ...P(c0, VF, 0.9), 60); bloom.addColorStop(0, `rgba(255,236,170,${0.5 + Math.sin(t * 2.1) * 0.05})`); bloom.addColorStop(1, "rgba(255,226,150,0)");
        c.fillStyle = bloom; c.fillRect(P(c0, VF)[0] - 70, P(c0, VF, 2)[1] - 10, 140, 130);
        c.restore();
        k.path(pts, { fill: null, lw: 1.3, wobble: 0 });
        k.box(c0 - 0.1, VF - 0.0, 1.45 + r + 0.1, 0.2, 0.06, 0.18, ST_L, { shadow: false, hatch: false });
      }
      // cornice + balustrade with urns
      k.box(w0 - 0.04, VF, ZW - 0.12, w1 - w0 + 0.08, 0.14, 0.12, ST_L, { shadow: false, hatch: false });
      balustrade(k, w0, 3.8, VF + 0.0, ZW, 0.3); balustrade(k, 6.2, w1, VF + 0.0, ZW, 0.3);
      for (const u of [w0 + 0.1, 3.7, 6.3, w1 - 0.1]) urn(k, u, VF + 0.05, ZW + 0.3);
      // hanging baskets on the piers
      for (let i = 0; i < 12; i++) { const u = U0 + i * BAY; if (u < 1.0 || u > 9.0 || (u > 3.9 && u < 6.2)) continue; basket(k, PL(VF + 0.04), u, 1.42, i * 3 + 1, t); }
      vault(k, t);
      pavilion(k, t, 1);
    },
    // portico drawn per column (people pass between) + entablature and pediment
    column(k, t, u) {
      const c = k.ctx;
      k.box(u - 0.16, PV - 0.16, 0, 0.32, 0.32, 0.14, ST_L, { shadow: false, hatch: false });
      k.cyl(u, PV, 0.14, 0.105, 1.88, ST_L, { top: false });
      // fluting
      c.strokeStyle = "rgba(120,95,60,0.3)"; c.lineWidth = 0.7;
      for (const f of [-0.045, 0.0, 0.05]) { const [x, y0] = P(u, PV, 0.2), [, y1] = P(u, PV, 1.96); c.beginPath(); c.moveTo(x + f * 90, y0); c.lineTo(x + f * 90, y1); c.stroke(); }
      k.box(u - 0.17, PV - 0.17, 2.02, 0.34, 0.34, 0.18, ST_L, { shadow: false, hatch: false });
      k.ell(u + 0.2, PV + 0.1, 0, 0.3, "rgba(60,45,30,0.12)", { stroke: false });
    },
    lanterns(k, t) {
      const c = k.ctx;
      for (const u of [4.44, 5.0, 5.56]) {
        const [x, y] = P(u, 3.75, 1.7), f = 0.85 + Math.sin(t * 7 + u * 5) * 0.08, sw = Math.sin(t * 1.6 + u) * 0.8;
        const gl = c.createRadialGradient(x, y + 6, 1, x, y + 6, 22); gl.addColorStop(0, `rgba(255,214,120,${0.5 * f})`); gl.addColorStop(1, "rgba(255,214,120,0)"); c.fillStyle = gl; c.beginPath(); c.arc(x, y + 6, 22, 0, 7); c.fill();
        c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x, y - 24); c.lineTo(x + sw * 0.3, y - 2); c.stroke();
        c.fillStyle = "#2b2622"; c.beginPath(); c.moveTo(x - 5 + sw, y - 2); c.lineTo(x + 5 + sw, y - 2); c.lineTo(x + 2 + sw, y - 6); c.lineTo(x - 2 + sw, y - 6); c.closePath(); c.fill();
        c.fillStyle = `rgba(255,222,130,${f})`; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.roundRect(x - 4 + sw, y - 2, 8, 10, 1.5); c.fill(); c.stroke();
      }
    },
    pediment(k, t) {
      const c = k.ctx, U = 3.95, W = 2.1, V = VF, D = 0.95;
      // entablature: architrave, frieze (text), cornice
      k.box(U, V, 2.2, W, D, 0.22, ST, { shadow: false, hatch: false });
      k.box(U - 0.06, V, 2.42, W + 0.12, D + 0.07, 0.1, ST_L, { shadow: false, hatch: false });
      const Pf = PL(V + D);
      c.fillStyle = "rgba(90,70,40,0.65)"; c.font = "bold 5px serif"; c.textAlign = "center";
      const [tx, ty] = Pf(U + W / 2, 2.27); c.fillText("COVENT GARDEN MARKET", tx, ty);
      // pediment: triangle in the front plane + roof slope
      k.gable(U - 0.06, V, 2.52, W + 0.12, D + 0.07, 0.72, ST_L, { ridge: "v" });
      const f = (a, z) => P(a, V + D + 0.07, z);
      const apex = f(U + W / 2, 2.52 + 0.72);
      c.beginPath(); c.moveTo(...f(U + 0.12, 2.56)); c.lineTo(...f(U + W - 0.12, 2.56)); c.lineTo(...f(U + W / 2, 2.52 + 0.6)); c.closePath();
      c.fillStyle = ST_D; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
      // round window / wreath in the tympanum
      const [ox, oy] = f(U + W / 2, 2.84); c.fillStyle = "#6b7f8e"; c.beginPath(); c.ellipse(ox, oy, 6.5, 6.5, 0, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
      c.strokeStyle = ST_L; c.lineWidth = 0.8; c.beginPath(); c.moveTo(ox - 6, oy); c.lineTo(ox + 6, oy); c.moveTo(ox, oy - 6); c.lineTo(ox, oy + 6); c.stroke();
      // acroterion urns + apex ball
      urn(k, U - 0.02, V + D, 2.52); urn(k, U + W + 0.02, V + D, 2.52);
      c.fillStyle = ST_L; c.beginPath(); c.arc(apex[0], apex[1] - 4, 3, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
    },
  };
}
