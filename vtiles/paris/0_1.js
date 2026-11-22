// PARIS · 0,1 · Palais Garnier, the Opéra (code-drawn, traced over assets/paris/0_1.png)
import { P, CTS, INK, shade, lerp, clamp, rng, hash, walkState, smooth } from "../../lib/vec-kit.js";
import { uv, facade, plane, opening, band, frustums, slateQuad, dormer, chimney, statue, pigeon, flock, sparkle, cobbles, debugRoutes, dense, inPoly } from "./_props.js";

const PAVE = "#dccfb0", STONE = "#dcbf80", STONEL = shade("#e3c88c", 0.05), GOLDC = "#e6b43c", GREEN = "#7bb59d", GREEND = "#5f9b86";
const BU0 = 0.8, BU1 = 8.1, BV0 = 0.2, BV1 = 6.2, HB = 4.35, HA = 5.15; // footprint, cornice height, attic top

// ---------- gilded statue groups ----------
function gilded(k, u, v, z, t, o = {}) {
  const c = k.ctx, s = o.s ?? 1;
  k.box(u - 0.25, v - 0.25, z, 0.5, 0.5, 0.45, "#d7c08a", { hatch: false, shadow: false });
  const [x, y] = P(u, v, z + 0.45);
  c.fillStyle = GOLDC; c.strokeStyle = INK; c.lineWidth = 1;
  // winged figure: body, wings, raised torch/lyre
  c.beginPath(); c.moveTo(x - 4 * s, y); c.lineTo(x - 3 * s, y - 14 * s); c.lineTo(x + 3 * s, y - 14 * s); c.lineTo(x + 4 * s, y); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.arc(x, y - 17 * s, 3 * s, 0, 7); c.fill(); c.stroke();
  for (const sg of [-1, 1]) { c.beginPath(); c.moveTo(x + sg * 3 * s, y - 12 * s); c.quadraticCurveTo(x + sg * 16 * s, y - 24 * s, x + sg * 12 * s, y - 34 * s); c.quadraticCurveTo(x + sg * 8 * s, y - 24 * s, x + sg * 3 * s, y - 8 * s); c.fill(); c.stroke(); }
  c.lineWidth = 2; c.beginPath(); c.moveTo(x + 2 * s, y - 14 * s); c.lineTo(x + 8 * s, y - 28 * s); c.stroke();
  sparkle(k, x - 6 * s, y - 24 * s, t * 1.7 + u * 3, 1.0);
}

// ---------- the palace ----------
function palaceBody(k, t) {
  const c = k.ctx, du = BU1 - BU0, dv = BV1 - BV0;
  k.box(BU0, BV0, 0, du, dv, HB, STONE, { hatch: false, shadow: true, noTop: true });
  // --- L facade (v = BV1): arcade, loggia with paired columns, avant-corps ---
  const QL = plane("L", BV1), QR = plane("R", BU1);
  const faceL = (Q, s0, s1, side, wall) => k.path([Q(s0, 0), Q(s1, 0), Q(s1, HB), Q(s0, HB)], { fill: wall, lw: 1.5, wobble: 0 });
  faceL(QL, BU0, BU1, "L", shade(STONE, -0.07));
  const c2 = k.ctx; c2.strokeStyle = "rgba(120,90,50,0.16)"; c2.lineWidth = 0.7; c2.beginPath(); for (let z = 0.3; z < HB; z += 0.3) { c2.moveTo(...QL(BU0, z)); c2.lineTo(...QL(BU1, z)); } c2.stroke();
  // ground arcade
  const nA = 9, wA = (BU1 - BU0 - 2.0) / nA;
  for (let i = 0; i < nA; i++) {
    const s = BU0 + 1.1 + wA * (i + 0.5);
    opening(k, QL, s, wA * 0.62, 0.0, 1.85, { arch: true, glass: "#3a2d22", mull: false, sill: false, fw: 0.05, wall: STONE, frame: shade(STONE, 0.18) });
    // lit interior glow
    const [gx, gy] = QL(s, 0.6); c.fillStyle = `rgba(255,214,130,${0.35 + 0.15 * Math.sin(t * 1.5 + i)})`; c.fillRect(gx - 3, gy - 14, 6, 14);
  }
  // piers between the arches: gilded statues in niches, roundels, keystones, rustication
  for (let i = 0; i <= nA; i++) {
    const s0 = BU0 + 1.1 + wA * i;
    k.path([QL(s0 - 0.09, 0.1), QL(s0 + 0.09, 0.1), QL(s0 + 0.09, 1.75), QL(s0 - 0.09, 1.75)], { fill: shade(STONE, 0.1), lw: 0.8, wobble: 0 });
    if (i > 0 && i < nA) {
      const [nx, ny] = QL(s0, 1.0); c.fillStyle = "#6a5238"; c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.roundRect(nx - 3.6, ny - 17, 7.2, 20, [3.6, 3.6, 0, 0]); c.fill(); c.stroke();
      c.fillStyle = GOLDC; c.beginPath(); c.moveTo(nx - 2, ny + 1); c.lineTo(nx - 1.4, ny - 8); c.lineTo(nx + 1.4, ny - 8); c.lineTo(nx + 2, ny + 1); c.fill(); c.beginPath(); c.arc(nx, ny - 10.5, 1.6, 0, 7); c.fill();
      const [rx, ry] = QL(s0, 1.88); c.fillStyle = GOLDC; c.beginPath(); c.arc(rx, ry, 3, 0, 7); c.fill(); c.stroke();
    }
  }
  for (let i = 0; i < nA; i++) { const s = BU0 + 1.1 + wA * (i + 0.5); const [kx, ky] = QL(s, 1.88); c.fillStyle = shade(STONE, 0.22); c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.moveTo(kx - 2.5, ky - 3); c.lineTo(kx + 2.5, ky - 3); c.lineTo(kx + 1.4, ky + 4); c.lineTo(kx - 1.4, ky + 4); c.closePath(); c.fill(); c.stroke(); }
  // balcony band + balustrade
  band(k, QL, BU0, BU1, 1.95, 0.16, STONE, { side: "L", c: BV1, out: 0.16 });
  { const c3 = k.ctx; c3.strokeStyle = "rgba(70,45,15,0.6)"; c3.lineWidth = 0.9; c3.beginPath(); for (let s = BU0; s <= BU1; s += 0.1) { const a = P(s, BV1 + 0.16, 2.1), b = P(s, BV1 + 0.16, 2.5); c3.moveTo(...a); c3.lineTo(...b); } c3.stroke(); c3.strokeStyle = INK; c3.lineWidth = 2.4; c3.beginPath(); c3.moveTo(...P(BU0, BV1 + 0.16, 2.5)); c3.lineTo(...P(BU1, BV1 + 0.16, 2.5)); c3.stroke(); c3.strokeStyle = shade(STONE, 0.25); c3.lineWidth = 1.1; c3.stroke(); }
  // loggia: dark recess with glowing tall windows, then paired columns in front
  k.path([QL(BU0 + 1.1, 2.55), QL(BU1 - 1.2, 2.55), QL(BU1 - 1.2, 4.0), QL(BU0 + 1.1, 4.0)], { fill: "#4a3a2c", lw: 1.2, wobble: 0 });
  for (let i = 0; i < 7; i++) { const s = BU0 + 1.1 + (BU1 - BU0 - 2.3) * ((i + 0.5) / 7); const lit = 0.55 + 0.2 * Math.sin(t * 1.3 + i * 2); opening(k, QL, s, 0.34, 2.6, 3.9, { arch: true, glass: `rgb(${Math.round(200 + 40 * lit)},${Math.round(150 + 50 * lit)},90)`, mull: true, sill: false, fw: 0.03, wall: STONE }); }
  const nC = 8; // paired columns
  for (let i = 0; i <= nC; i++) {
    const s = BU0 + 1.0 + (BU1 - BU0 - 2.1) * (i / nC);
    for (const off of [-0.07, 0.07]) {
      const a = QL(s + off - 0.045, 2.5), b = QL(s + off + 0.045, 2.5), d = QL(s + off - 0.045, 4.05), e = QL(s + off + 0.045, 4.05);
      c.fillStyle = shade(STONE, 0.12); c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.lineTo(...e); c.lineTo(...d); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = GOLDC; c.fillRect(d[0] - 3, d[1] - 2, 9, 3); // gilt capital
    }
  }
  // gilded garlands + medallions on the loggia spandrels, lyre-and-mask tablets
  for (let i = 0; i < nC; i++) { const s0 = BU0 + 1.0 + (BU1 - BU0 - 2.1) * ((i + 0.5) / nC); const [gx, gy] = QL(s0, 4.12); c.strokeStyle = "#b8862c"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(gx - 9, gy - 2); c.quadraticCurveTo(gx, gy + 7, gx + 9, gy - 2); c.stroke(); c.fillStyle = GOLDC; c.beginPath(); c.arc(gx, gy + 3, 1.8, 0, 7); c.fill(); }
  // entablature, gilded frieze, attic with statues
  band(k, QL, BU0, BU1, 4.0, 0.35, STONE, { side: "L", c: BV1, out: 0.18 });
  { const c4 = k.ctx; c4.fillStyle = GOLDC; for (let s = BU0 + 1.1; s < BU1 - 1.1; s += 0.22) { const [x, y] = P(s, BV1 + 0.18, 4.2); c4.beginPath(); c4.arc(x, y, 2.2, 0, 7); c4.fill(); } }
  // left pavilion: framed window, arched pediment
  for (const [a, b, lt] of [[BU0, BU0 + 1.1, 1], [BU1 - 1.2, BU1, 2]]) {
    k.path([QL(a, 0), QL(b, 0), QL(b, HA), QL(a, HA)], { fill: shade(STONE, 0.04), lw: 1.4, wobble: 0 });
    opening(k, QL, (a + b) / 2, 0.42, 0.15, 1.7, { arch: true, glass: "#3a2d22", mull: false, sill: false, fw: 0.05, wall: STONE, frame: shade(STONE, 0.18) });
    opening(k, QL, (a + b) / 2, 0.4, 2.7, 4.0, { arch: true, glass: "#5a4a3a", mull: true, sill: false, fw: 0.05, wall: STONE, ped: 1, frame: shade(STONE, 0.2) });
    for (const sg of [-1, 1]) { const s = (a + b) / 2 + sg * 0.44; k.path([QL(s - 0.05, 2.1), QL(s + 0.05, 2.1), QL(s + 0.05, 4.1), QL(s - 0.05, 4.1)], { fill: shade(STONE, 0.15), lw: 0.8, wobble: 0 }); }
    band(k, QL, a, b, 1.95, 0.16, STONE, { side: "L", c: BV1, out: 0.16 }); band(k, QL, a, b, 4.0, 0.35, STONE, { side: "L", c: BV1, out: 0.18 });
    // curved gable cap
    c.beginPath(); c.moveTo(...QL(a - 0.04, 4.35)); c.quadraticCurveTo(...QL((a + b) / 2, 5.5), ...QL(b + 0.04, 4.35)); c.closePath(); c.fillStyle = shade(STONE, 0.1); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke();
    c.fillStyle = GOLDC; c.beginPath(); c.arc(...QL((a + b) / 2, 4.75), 5, 0, 7); c.fill(); c.stroke();
  }
  // projecting avant-corps with pilasters and a gilded pediment at each end
  for (const [a, b] of [[BU0 - 0.05, BU0 + 1.15], [BU1 - 1.25, BU1 + 0.05]]) {
    const d = 0.28, O = (s, z) => P(s, BV1 + d, z);
    k.path([QL(b, 0), O(b, 0), O(b, HB), QL(b, HB)], { fill: shade(STONE, -0.2), lw: 1, wobble: 0 });
    k.path([O(a, 0), O(b, 0), O(b, HB), O(a, HB)], { fill: shade(STONE, 0.02), lw: 1.3, wobble: 0 });
    opening(k, (s, z) => O(s, z), (a + b) / 2, 0.5, 0.15, 1.75, { arch: true, glass: "#3a2d22", mull: false, sill: false, fw: 0.05, wall: STONE });
    opening(k, (s, z) => O(s, z), (a + b) / 2, 0.44, 2.55, 3.95, { arch: true, glass: "#5a4a3a", mull: true, sill: false, fw: 0.05, wall: STONE, ped: 1 });
    for (const sg of [a + 0.07, b - 0.07]) k.path([O(sg - 0.06, 0), O(sg + 0.06, 0), O(sg + 0.06, HB), O(sg - 0.06, HB)], { fill: shade(STONE, 0.18), lw: 0.8, wobble: 0 });
    c.fillStyle = GOLDC; c.beginPath(); c.arc(...O((a + b) / 2, 4.65), 4.5, 0, 7); c.fill(); c.strokeStyle = INK; c.stroke();
  }
  // attic statues on the cornice
  for (let s = BU0 + 1.3; s < BU1 - 1.2; s += 0.62) k.q(s + BV1 + 0.1, () => statue(k, s, BV1 + 0.1, HB + 0.38, { s: 1.0, arm: Math.round(s * 10) % 2 === 0 }));
  // --- R facade (u = BU1): windows, columns ---
  faceL(QR, BV0, BV1, "R", shade(STONE, -0.22));
  c2.strokeStyle = "rgba(60,40,15,0.15)"; c2.beginPath(); for (let z = 0.3; z < HB; z += 0.3) { c2.moveTo(...QR(BV0, z)); c2.lineTo(...QR(BV1, z)); } c2.stroke();
  const nR = 7;
  for (let i = 0; i < nR; i++) {
    const s = BV0 + 0.9 + (BV1 - BV0 - 2.0) * ((i + 0.5) / nR);
    opening(k, QR, s, 0.4, 0.15, 1.8, { side: "R", arch: true, glass: "#3a2d22", mull: false, sill: false, fw: 0.04, wall: STONE });
    opening(k, QR, s, 0.34, 2.4, 3.9, { side: "R", arch: true, glass: "#6a5a48", mull: true, sill: false, fw: 0.04, wall: STONE, lit: i % 3 === 0 });
    k.path([QR(s + 0.34, 2.2), QR(s + 0.43, 2.2), QR(s + 0.43, 4.0), QR(s + 0.34, 4.0)], { fill: shade(STONE, -0.08), lw: 0.7, wobble: 0 });
  }
  band(k, QR, BV0, BV1, 1.95, 0.16, STONE, { side: "R", c: BU1, out: 0.14, dark: true }); band(k, QR, BV0, BV1, 4.0, 0.35, STONE, { side: "R", c: BU1, out: 0.16, dark: true });
  // right-end pavilion (R face pediment)
  k.path([QR(BV1 - 1.1, 0), QR(BV1, 0), QR(BV1, HA), QR(BV1 - 1.1, HA)], { fill: shade(STONE, -0.12), lw: 1.3, wobble: 0 });
  opening(k, QR, BV1 - 0.55, 0.42, 0.15, 1.7, { side: "R", arch: true, glass: "#3a2d22", mull: false, sill: false, wall: STONE });
  opening(k, QR, BV1 - 0.55, 0.4, 2.6, 3.9, { side: "R", arch: true, glass: "#5a4a3a", mull: true, sill: false, wall: STONE });
  // top cornice slab
  k.path([P(BU0, BV1, HA), P(BU1, BV1, HA), P(BU1, BV0, HA), P(BU0, BV0, HA)], { fill: "#d6c08a", lw: 1.1, wobble: 0 });
  // dentil attic band across L and R
  band(k, QL, BU0, BU1, HB + 0.36, 0.5, STONE, { side: "L", c: BV1, out: 0.1 }); band(k, QR, BV0, BV1, HB + 0.36, 0.5, STONE, { side: "R", c: BU1, out: 0.1, dark: true });
}
function roofs(k, t) {
  const c = k.ctx, z0 = HA + 0.05;
  // copper hip roof, with a lower pitch ridge system
  frustums(k, BU0 + 0.15, BV0 + 0.15, BU1 - BU0 - 0.3, BV1 - BV0 - 0.3, z0, [[0, 0], [0.35, 0.55], [1.0, 1.2], [1.5, 1.45]], GREEN, { n: 5, cap: shade(GREEN, 0.05) });
  // ridge cresting along the roof edges + dormers on the front slope
  { c.strokeStyle = "#c9a54a"; c.lineWidth = 1.6; c.beginPath(); for (const [u, v] of [[BU0 + 0.15, BV1 - 0.15], [BU1 - 0.15, BV1 - 0.15], [BU1 - 0.15, BV0 + 0.15]]) { const [x, y] = P(u, v, z0); c.lineTo(x, y); } c.stroke(); }
  for (let i = 0; i < 6; i++) { const u = BU0 + 1.3 + i * 1.05; k.q(u + BV1 + 0.5, () => dormer(k, u, BV1 - 0.42, z0 + 0.28, { w: 6, h: 8, lit: i % 2 === 0, roof: "#5f9b86", frame: "#e8d6a0" })); }
  // lanterns / skylight boxes on the flat of the roof
  for (const [u, v, w] of [[2.4, 1.4, 0.7], [6.2, 2.0, 0.6], [2.2, 3.6, 0.6]]) k.box(u, v, z0 + 1.35, w, 0.45, 0.28, "#c9d8cf", { hatch: false, shadow: false });
  // stage-house gable at the rear (cream pediment) — a tall box with a triangular cap
  k.box(5.6, 0.2, z0 + 0.5, 2.2, 1.8, 1.2, "#e8d7a8", { hatch: false, shadow: false });
  k.path([P(5.6, 2.0, z0 + 1.7), P(7.8, 2.0, z0 + 1.7), P(6.7, 2.0, z0 + 2.4)], { fill: "#e8d7a8", lw: 1.2, wobble: 0 });
  slateQuad(k, [P(7.8, 0.2, z0 + 1.7), P(7.8, 2.0, z0 + 1.7), P(6.7, 2.0, z0 + 2.4), P(6.7, 0.2, z0 + 2.4)], shade(GREEN, -0.2), { n: 3 });
  slateQuad(k, [P(5.6, 2.0, z0 + 1.7), P(7.8, 2.0, z0 + 1.7), P(6.7, 2.0, z0 + 2.4)], shade(GREEN, -0.08), { n: 3 });
  chimney(k, 7.5, 0.4, z0 + 2.0, { w: 0.3, h: 0.6 });
  // right-end pavilion roof (green mansard)
  frustums(k, BU1 - 1.2, BV1 - 1.3, 1.25, 1.3, z0 + 0.0, [[0, 0], [0.15, 0.4], [0.35, 0.8]], GREEND, { n: 3 });
}
function dome(k, t) {
  const c = k.ctx, cu = 5.1, cv = 3.7, zb = HA + 1.0, R = 1.85;
  // drum: stone ring with windows and a gilded cornice
  k.cyl(cu, cv, zb, R, 0.95, "#d8bb7c");
  const [x, y] = P(cu, cv, zb + 0.45), rx = R * CTS.S * Math.SQRT2;
  for (let i = 0; i < 15; i++) { const a = Math.PI * (0.04 + 0.92 * (i / 14)); const xx = x - Math.cos(a) * rx * 0.97, yy = y + Math.sin(a) * rx * CTS.YS * 0.97; c.fillStyle = "#5a4a38"; c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.ellipse(xx, yy, 3.3, 5, 0, 0, 7); c.fill(); c.stroke(); }
  for (let i = 0; i <= 15; i++) { const a = Math.PI * (0.0 + 1.0 * (i / 15)); const xx = x - Math.cos(a) * rx * 0.99, yy = y + Math.sin(a) * rx * CTS.YS * 0.99; c.strokeStyle = "rgba(255,246,214,0.8)"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(xx, yy - 18); c.lineTo(xx, yy + 14); c.stroke(); }
  k.cyl(cu, cv, zb + 0.95, R * 1.04, 0.14, "#c9ae6a");
  { const [bx, by] = P(cu, cv, zb + 1.2); c.strokeStyle = "rgba(90,60,20,0.8)"; c.lineWidth = 1; for (let i = 0; i <= 40; i++) { const a = Math.PI * (i / 40); const xx = bx - Math.cos(a) * rx * 1.04, yy = by + Math.sin(a) * rx * 1.04 * CTS.YS; c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx, yy - 5); c.stroke(); } }
  // the copper dome: ribbed with scalloped gold ribs
  const zd = zb + 1.09, [dx, dy] = P(cu, cv, zd), dh = 2.0 * CTS.S * CTS.ZS, ry = rx * 0.98 * CTS.YS;
  const g = c.createLinearGradient(dx - rx, dy - dh, dx + rx, dy); g.addColorStop(0, shade(GREEN, 0.18)); g.addColorStop(0.55, GREEN); g.addColorStop(1, shade(GREEND, -0.2));
  c.beginPath(); c.ellipse(dx, dy, rx * 0.98, ry, 0, 0, Math.PI); c.bezierCurveTo(dx - rx * 0.98, dy - dh * 0.8, dx - rx * 0.5, dy - dh, dx, dy - dh); c.bezierCurveTo(dx + rx * 0.5, dy - dh, dx + rx * 0.98, dy - dh * 0.8, dx + rx * 0.98, dy); c.closePath(); c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
  c.save(); c.clip(); c.lineWidth = 1.1;
  for (let i = 1; i < 14; i++) { const f = i / 14, xx = dx - rx * 0.98 + 2 * rx * 0.98 * f; const y0 = dy + Math.sin(Math.acos(2 * f - 1)) * ry; c.strokeStyle = "rgba(30,70,55,0.6)"; c.beginPath(); c.moveTo(xx, y0); c.quadraticCurveTo(lerp(xx, dx, 0.5), dy - dh * 0.75, dx, dy - dh); c.stroke(); c.strokeStyle = "rgba(226,184,78,0.55)"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(xx + 2, y0); c.quadraticCurveTo(lerp(xx, dx, 0.5) + 2, dy - dh * 0.75, dx, dy - dh); c.stroke(); c.lineWidth = 1.1; }
  c.fillStyle = "rgba(255,255,230,0.2)"; c.beginPath(); c.ellipse(dx - rx * 0.3, dy - dh * 0.55, rx * 0.22, dh * 0.3, -0.3, 0, 7); c.fill();
  // shimmer sweeping across the copper
  const sw = ((t * 0.18) % 1.4) - 0.2, sx = lerp(dx - rx, dx + rx, sw), g2 = c.createLinearGradient(sx - 30, 0, sx + 30, 0); g2.addColorStop(0, "rgba(255,255,255,0)"); g2.addColorStop(0.5, "rgba(255,255,255,0.25)"); g2.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = g2; c.fillRect(dx - rx, dy - dh, rx * 2, dh + 20);
  c.restore();
  // lantern + the golden Apollo
  const zt = zd + 2.0;
  k.cyl(cu, cv, zt - 0.05, 0.34, 0.5, "#c9ae6a"); k.dome(cu, cv, zt + 0.45, 0.26, 0.3, GREEND);
  const [ax, ay] = P(cu, cv, zt + 0.75);
  c.fillStyle = GOLDC; c.strokeStyle = INK; c.lineWidth = 1.1;
  c.fillRect(ax - 7, ay - 5, 14, 5); c.strokeRect(ax - 7, ay - 5, 14, 5);
  c.beginPath(); c.moveTo(ax - 5, ay - 5); c.lineTo(ax - 3.5, ay - 30); c.lineTo(ax + 3.5, ay - 30); c.lineTo(ax + 5, ay - 5); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.arc(ax, ay - 34, 4.4, 0, 7); c.fill(); c.stroke();
  c.lineWidth = 2.6; c.beginPath(); c.moveTo(ax + 3, ay - 28); c.quadraticCurveTo(ax + 11, ay - 36, ax + 9, ay - 52); c.stroke(); // raised arm
  c.lineWidth = 1.6; c.beginPath(); c.arc(ax + 12, ay - 54, 4.2, 0, Math.PI * 2); c.stroke(); // the lyre
  c.beginPath(); c.moveTo(ax - 4, ay - 26); c.quadraticCurveTo(ax - 16, ay - 24, ax - 18, ay - 12); c.stroke(); // cloak
  sparkle(k, ax + 8, ay - 44, t * 2.2, 1.6);
}

// ---------- the grand stairs: a fan of curved tiers in front of the arcade ----------
const SN = 6, SCU = 4.6, SA = (i) => 1.3 + (SN - 1 - i) * 0.26, SD = (i) => 0.4 * (SN - i);
function stairZ(u, v) {
  let z = 0;
  for (let i = 0; i < SN; i++) { const m = Math.hypot((u - SCU) / SA(i), (v - BV1) / SD(i)); z += 0.15 * smooth(clamp((1.02 - m) * 9)); }
  return z;
}
function stairs(k, t) {
  const c = k.ctx, M = 26;
  for (let i = 0; i < SN; i++) {
    const a = SA(i), d = SD(i), z0 = 0.15 * i, z1 = 0.15 * (i + 1), pts = [];
    for (let j = 0; j <= M; j++) { const th = Math.PI * (j / M); pts.push([SCU + a * Math.cos(th), BV1 + d * Math.sin(th)]); }
    for (let j = 0; j < M; j++) {
      const [u0, v0] = pts[j], [u1, v1] = pts[j + 1], mu = (u0 + u1) / 2 - SCU, mv = (v0 + v1) / 2 - BV1;
      const nu = mu / (a * a), nv = mv / (d * d), nl = Math.hypot(nu, nv) || 1, rf = clamp(0.5 + 0.5 * (nu / nl));
      k.path([P(u0, v0, z0), P(u1, v1, z0), P(u1, v1, z1), P(u0, v0, z1)], { fill: shade("#e4d2a6", -0.04 - 0.14 * rf), lw: 0.9, wobble: 0 });
    }
    k.path(pts.map(([u, v]) => P(u, v, z1)), { fill: i === SN - 1 ? "#f6ecd0" : "#efe2c2", lw: 1.1, wobble: 0 });
    c.strokeStyle = "rgba(255,255,240,0.7)"; c.lineWidth = 1.1; c.beginPath();
    pts.forEach(([u, v], j) => { const [x, y] = P(u, v, z1); j ? c.lineTo(x, y + 1) : c.moveTo(x, y + 1); }); c.stroke();
  }
  for (const u of [SCU - 2.0, SCU + 2.0]) { const [x, y] = P(u, BV1 + 0.35, 0.3); c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 30); c.stroke(); c.strokeStyle = "#8a6a2c"; c.lineWidth = 1.8; c.stroke(); const g = 0.75 + 0.25 * Math.sin(t * 2 + u); c.fillStyle = `rgba(255,226,150,${g})`; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.arc(x, y - 33, 4, 0, 7); c.fill(); c.stroke(); }
}
function climber(k, t, a, b, o) {
  const s = walkState([a, b], t, { speed: o.speed ?? 0.42, offset: o.offset ?? 0, dwell: o.dwell ?? 2 });
  k.q(s.u + s.v + 0.2, () => k.person(s.u, s.v, { ...o, z: stairZ(s.u, s.v), dir: [s.du, s.dv], pose: s.moving ? "walk" : "stand", p: s.p }));
}
function metro(k, t) {
  const c = k.ctx, u0 = 7.5, v0 = 7.9, du = 1.7, dv = 1.2;
  // sunken stair well
  k.poly([[u0, v0, 0], [u0 + du, v0, 0], [u0 + du, v0 + dv, 0], [u0, v0 + dv, 0]], "#2d3a34", { lw: 1.4 });
  for (let i = 1; i <= 5; i++) { const f = i / 6; k.line([P(u0, v0 + dv * f, -0.05 * i), P(u0 + du, v0 + dv * f, -0.05 * i)], { lw: 0.9, wobble: 0 }); }
  const G = "#3f7358", GL = "#6aa588";
  // railing: whiplash posts with arched sign
  const post = (u, v, h) => { const [x, y] = P(u, v, 0); c.strokeStyle = INK; c.lineWidth = 4; c.lineCap = "round"; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 3, y - h * 21, x - 2, y - h * 42); c.stroke(); c.strokeStyle = G; c.lineWidth = 2.4; c.stroke(); };
  const rail = (a, b) => { c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(...P(a[0], a[1], 0.55)); c.lineTo(...P(b[0], b[1], 0.55)); c.stroke(); c.strokeStyle = G; c.lineWidth = 1.5; c.stroke(); c.lineWidth = 0.9; c.strokeStyle = GL; c.beginPath(); const L = Math.hypot(b[0] - a[0], b[1] - a[1]); for (let s = 0; s <= L; s += 0.13) { const f = s / L; const p = [lerp(a[0], b[0], f), lerp(a[1], b[1], f)]; c.moveTo(...P(p[0], p[1], 0.02)); c.quadraticCurveTo(...P(p[0] + 0.03, p[1] + 0.03, 0.3), ...P(p[0], p[1], 0.55)); } c.stroke(); };
  rail([u0, v0], [u0 + du, v0]); rail([u0 + du, v0], [u0 + du, v0 + dv]); rail([u0, v0], [u0, v0 + dv]);
  post(u0, v0 + dv, 1.1); post(u0 + du, v0 + dv, 1.1);
  // twin amber lamps with arched sign "MÉTRO"
  const [lx, ly] = P(u0, v0 + dv, 1.1);
  c.strokeStyle = G; c.lineWidth = 2.4; c.beginPath(); c.moveTo(lx, ly - 14); c.quadraticCurveTo(lx + 22, ly - 40, lx + 46, ly - 14); c.stroke();
  c.fillStyle = "#e8e0c4"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.roundRect(lx + 6, ly - 34, 34, 13, 4); c.fill(); c.stroke();
  c.fillStyle = G; c.font = "bold 7.5px sans-serif"; c.textAlign = "center"; c.fillText("MÉTRO", lx + 23, ly - 24.5);
  for (const dx of [-3, 49]) { const g = 0.7 + 0.3 * Math.sin(t * 2 + dx); c.fillStyle = `rgba(255,190,70,${g})`; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.ellipse(lx + dx, ly - 50, 5, 6.5, 0, 0, 7); c.fill(); c.stroke(); c.fillStyle = `rgba(255,200,90,${0.22 * g})`; c.beginPath(); c.arc(lx + dx, ly - 50, 14, 0, 7); c.fill(); }
}
function candelabra(k, u, v, t) {
  const c = k.ctx, [x, y] = P(u, v, 0); k.ell(u + 0.1, v + 0.05, 0, 0.2, "rgba(60,45,30,0.15)", { stroke: false });
  c.strokeStyle = INK; c.lineWidth = 4.4; c.lineCap = "round"; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 44); c.stroke(); c.strokeStyle = "#8a6a2c"; c.lineWidth = 2.6; c.stroke();
  c.fillStyle = "#6a4f20"; c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x + 6, y); c.lineTo(x + 3, y - 10); c.lineTo(x - 3, y - 10); c.closePath(); c.fill(); c.stroke();
  for (const [dx, dy] of [[-10, -50], [10, -50], [0, -62]]) { const g = 0.75 + 0.25 * Math.sin(t * 2 + dx); c.strokeStyle = "#8a6a2c"; c.lineWidth = 1.8; c.beginPath(); c.moveTo(x, y - 40); c.quadraticCurveTo(x + dx * 0.8, y - 40 + dy * 0.2, x + dx, y + dy + 6); c.stroke(); c.fillStyle = `rgba(255,236,170,${g})`; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.arc(x + dx, y + dy, 5, 0, 7); c.fill(); c.stroke(); c.fillStyle = `rgba(255,230,140,${0.2 * g})`; c.beginPath(); c.arc(x + dx, y + dy, 12, 0, 7); c.fill(); }
}
function cafe(k, t) {
  const c = k.ctx;
  // striped awning on the R side at ground level
  for (let i = 0; i < 12; i++) { const a = BV0 + 3.6 + (i * 2.4) / 12, b = BV0 + 3.6 + ((i + 1) * 2.4) / 12; k.poly([[BU1, a, 1.5], [BU1, b, 1.5], [BU1 + 0.6, b, 1.1], [BU1 + 0.6, a, 1.1]], i % 2 ? "#f3e6c4" : "#d9a95e", { lw: 1, wobble: 0 }); }
}
function bistro(k, u, v, t, seed) {
  const c = k.ctx, [x, y] = P(u, v, 0);
  k.ell(u, v, 0, 0.2, "rgba(60,45,30,0.15)", { stroke: false });
  c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 8); c.stroke(); k.circle(x, y - 9, 5.4, "#f4efe3", { lw: 1 });
  const ph = (t * 0.6 + seed) % 1; c.strokeStyle = `rgba(255,255,255,${0.6 * (1 - ph)})`; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 1, y - 12); c.quadraticCurveTo(x + 3, y - 15 - ph * 5, x, y - 19 - ph * 6); c.stroke();
}
function wicker(k, u, v, face) { const c = k.ctx, [x, y] = P(u, v, 0.28); c.fillStyle = "#b5824a"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.ellipse(x, y, 4.6, 2.4, 0, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.arc(x - face * 3, y - 5.5, 4.6, Math.PI * 0.9, Math.PI * 2.1); c.stroke(); c.beginPath(); c.moveTo(x - 3, y + 2); c.lineTo(x - 3, y + 7); c.moveTo(x + 3, y + 2); c.lineTo(x + 3, y + 7); c.stroke(); }

// ---------- routes ----------
const CIRC = [[0.25, 9.1, 0.7], [0.05, 7.05, 0.7], [8.3, 1.5, 0.7], [9.5, 0.6, 0.7], [3.25, 9.6, 0.4], [6.9, 9.5, 0.4]];
const BLOCKS = [[[0.6, -1], [8.4, -1], [8.4, 6.4], [0.6, 6.4]], [[1.1, 6.1], [7.4, 6.1], [7.4, 8.5], [1.1, 8.5]], [[7.3, 7.7], [9.4, 7.7], [9.4, 9.2], [7.3, 9.2]]];
function clean(route, skip = []) {
  const d = dense(route, 0.2);
  const ok = (p) => p[0] > 0.2 && p[0] < 9.85 && p[1] > 0.2 && p[1] < 9.85 && CIRC.every(([u, v, r]) => Math.hypot(p[0] - u, p[1] - v) > r) && BLOCKS.every((q, i) => skip.includes(i) || !inPoly(p, q));
  let best = [], cur = [];
  for (const p of d) { if (ok(p)) cur.push(p); else { if (cur.length > best.length) best = cur; cur = []; } }
  if (cur.length > best.length) best = cur;
  const out = best.filter((_, i) => i % 3 === 0 || i === best.length - 1);
  return out.length >= 2 ? out : d.slice(0, 2);
}
const ROUTES = {
  front1: clean([[1.0, 8.8], [3.0, 8.9], [5.5, 8.8], [7.0, 8.7]]),
  front2: clean([[1.2, 9.5], [3.6, 9.5], [6.0, 9.4], [8.0, 9.3]]),
  left: clean([[0.8, 6.4], [1.0, 8.0], [1.9, 9.2]]),
  rightw: clean([[8.5, 2.5], [8.7, 4.5], [8.6, 6.5], [8.3, 7.4]]),
  rightw2: clean([[9.4, 3.0], [9.5, 5.2], [9.4, 7.4]]),
  metro: clean([[5.9, 9.2], [6.4, 9.7], [7.6, 9.8]]),
  diag: clean([[1.6, 7.2], [2.6, 8.4], [4.4, 9.0]]),
};

export default function draw(k, t) {
  const c = k.ctx;
  k.groundTrace({ lawn: [], water: [], walks: [] }, { paved: PAVE, side: "#e3d3b0", stipple: 5 });
  cobbles(k, [[0, 0], [10, 0], [10, 10], [0, 10]], { gap: 0.3, line: "rgba(130,105,70,0.2)", seed: 6 });
  // palace + roofs + dome
  palaceBody(k, t);
  roofs(k, t);
  dome(k, t);
  // golden groups on the corner pedestals
  k.q(0.2, () => gilded(k, 1.05, BV1 - 0.2, HA + 0.05, t, { s: 1.7 }));
  k.q(0.3, () => gilded(k, BU1 - 1.3, BV1 - 0.2, HA + 0.05, t, { s: 1.7 }));
  k.q(BV1 + 0.3, () => stairs(k, t));
  k.q(18, () => cafe(k, t));
  k.q(16.2, () => metro(k, t));
  for (const [u, v] of [[3.25, 9.6], [6.9, 9.5]]) k.q(u + v, () => candelabra(k, u, v, t));
  // trees
  for (const [u, v, s, col] of [[0.25, 9.1, 1, "#9bc255"], [0.05, 7.05, 2, "#8cb85f"], [8.3, 1.5, 3, "#86b05a"], [9.5, 0.7, 4, "#9bc255"]]) k.q(u + v + 0.3, () => k.tree(u, v, { r: 0.9, h: 1.9, seed: s * 7, col }));
  for (const [u, v] of [[0.25, 9.1], [0.05, 7.05], [8.3, 1.5]]) k.q(u + v - 0.1, () => k.ell(u, v, 0, 0.3, "#8b8372", { lw: 0.8 }));
  // benches
  k.q(5, () => k.bench(0.6, 8.0, { along: "v" }));
  // café on the right
  for (const [u, v, s] of [[8.9, 4.5, 1], [9.1, 5.6, 2], [8.8, 6.7, 3]]) {
    k.q(u + v, () => bistro(k, u, v, t, s)); k.q(u + v - 0.3, () => wicker(k, u - 0.4, v, 1)); k.q(u + v + 0.3, () => wicker(k, u + 0.4, v + 0.1, -1));
    k.qperson(u - 0.4, v, { pose: "sit", seatZ: 0.3, dir: [1, 0.2], seed: 60 + s, bench: true }); k.qperson(u + 0.42, v + 0.12, { pose: "sit", seatZ: 0.3, dir: [-1, 0.1], seed: 70 + s, bench: true, gesture: s % 2 === 0 });
  }
  // pigeons on the steps and cobbles
  for (const [u, v, z, s] of [[3.0, 6.8, 0.5, 1], [5.5, 7.4, 0.2, 2], [4.2, 9.3, 0, 3], [7.2, 9.0, 0, 4], [2.0, 8.2, 0, 5]]) k.q(u + v, () => { const [x, y] = [0, 0]; pigeon(k, u, v, t, s); });
  // people
  const W = (name, off, seed, sp = 0.42, extra = {}) => k.qwalker(ROUTES[name], { speed: sp, offset: off, seed, dwell: 1.2 + (seed % 3) * 0.6, ...extra });
  W("front1", 0.0, 21); W("front1", 0.1, 22, 0.4); W("front2", 0.3, 23, 0.46); W("front2", 0.4, 24, 0.44); W("left", 0.2, 25); W("rightw", 0.2, 28); W("rightw2", 0.6, 29, 0.4); W("metro", 0.4, 30, 0.34); W("diag", 0.7, 31);
  k.qcyclist(ROUTES.front2, { speed: 0.9, offset: 0.7, seed: 33, col: "#c8403a", basket: true });
  // people on the steps: climbing, descending, sitting, posing, photographing the facade
  climber(k, t, [3.9, 8.3], [3.9, 6.5], { seed: 26, speed: 0.4, offset: 0.0 });
  climber(k, t, [5.5, 8.4], [5.3, 6.5], { seed: 27, speed: 0.36, offset: 0.5, dwell: 2.6 });
  climber(k, t, [4.7, 8.5], [4.7, 6.45], { seed: 34, speed: 0.34, offset: 0.2 });
  climber(k, t, [2.9, 8.0], [3.4, 6.9], { seed: 35, speed: 0.38, offset: 0.65 });
  for (const [u, v, pose, s, d] of [[2.6, 7.9, "photo", 71, [0.2, -1]], [6.4, 7.8, "stand", 75, [-0.5, -1]], [3.4, 7.55, "sit", 72, [0.1, 1]], [4.1, 7.55, "sit", 73, [0.1, 1]], [5.0, 7.15, "sit", 78, [0.1, 1]], [5.9, 7.15, "wave", 74, [0.3, 1]], [4.4, 6.75, "stand", 79, [0.2, -1]], [4.9, 6.75, "stand", 80, [-0.2, -1]]]) { const z = stairZ(u, v); k.qperson(u, v + 0.15, { z: pose === "sit" ? z - 0.05 : z, pose, dir: d, seed: s, seatZ: pose === "sit" ? 0.3 : undefined, bench: pose === "sit" }); }
  k.qperson(6.8, 9.35, { pose: "stand", dir: [1, 0], seed: 76 });
  debugRoutes(k, Object.values(ROUTES), BLOCKS);
  k.flush();
  flock(k, 600, 170, 6, t, 2);
  k.circlingBird(580, 150, 95, 24, { speed: 0.6, phase: 1 });
  k.cloud(180, 200, { s: 0.85, phase: 1 }); k.cloud(840, 180, { s: 0.7, phase: 3 });
}
