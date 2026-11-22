// Notre-Dame de Paris, code-drawn hero module for tile 0,-1 (imported only by 0_-1.js)
import { P, CTS, INK, shade, lerp } from "../../lib/vec-kit.js";
import { opening, band, slateQuad, frustums, plane } from "./_props.js";

export const ST = "#d9bf8a";
export const FV = 5.4; // west facade plane (v)
const SL = "#7d8896";
const LIGHT = "#efe0b8";
const bez = (a, b, c, f) => [(1 - f) * (1 - f) * a[0] + 2 * (1 - f) * f * b[0] + f * f * c[0], (1 - f) * (1 - f) * a[1] + 2 * (1 - f) * f * b[1] + f * f * c[1]];

function poly(k, pts, fill, lw = 0.8) { k.path(pts, { fill, lw, wobble: 0 }); }
function discAt(k, x, y, rx, ry, fill, lw = 0.6) { const c = k.ctx; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fillStyle = fill; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); }

// ---------- portals ----------
function pointedPortal(k, Q, s, w, z1, gable) {
  const c = k.ctx;
  if (gable) {
    poly(k, [Q(s - w / 2 - 0.3, z1 - 0.12), Q(s + w / 2 + 0.3, z1 - 0.12), Q(s, z1 + 0.62)], shade(ST, 0.12), 1);
    poly(k, [Q(s - w / 2 - 0.16, z1 - 0.08), Q(s + w / 2 + 0.16, z1 - 0.08), Q(s, z1 + 0.46)], shade(ST, -0.1), 0.7);
    for (let i = 0; i < 6; i++) { const f = (i + 0.5) / 6; const [x, y] = Q(lerp(s - w / 2 - 0.2, s, f), lerp(z1 - 0.06, z1 + 0.4, f)); discAt(k, x - 1, y - 1, 1.2, 1.2, LIGHT, 0.4); const [x2, y2] = Q(lerp(s + w / 2 + 0.2, s, f), lerp(z1 - 0.06, z1 + 0.4, f)); discAt(k, x2 + 1, y2 - 1, 1.2, 1.2, LIGHT, 0.4); }
  }
  for (let i = 4; i >= 0; i--) {
    const ww = w + i * 0.1, zz = z1 + i * 0.07;
    opening(k, Q, s, ww, 0, zz, { arch: "pointed", glass: i ? shade(ST, i % 2 ? 0.1 : -0.12) : "#3a2c25", frame: shade(ST, 0.18), mull: false, sill: false, fw: 0.02 });
  }
  // little figures in the archivolts
  { const ww = w + 0.2, zz = z1 + 0.14, ah = Math.min(ww * 0.95, zz * 0.5), a = Q(s + ww / 2, zz - ah), b = Q(s + ww * 0.46, zz - ah * 0.08), e = Q(s, zz);
    for (let i = 0; i < 9; i++) { const f = i / 8, p = bez(a, b, e, f); discAt(k, p[0] + 1.2, p[1] + 1.2, 1.3, 1.6, LIGHT, 0.4); const a2 = Q(s - ww / 2, zz - ah), b2 = Q(s - ww * 0.46, zz - ah * 0.08), p2 = bez(a2, b2, e, f); discAt(k, p2[0] - 1.2, p2[1] + 1.2, 1.3, 1.6, LIGHT, 0.4); } }
  // tympanum bands + door leaves
  opening(k, Q, s, w * 0.82, 0, z1 * 0.58, { glass: "#5b4636", frame: "#2a2018", mull: false, sill: false, fw: 0.015 });
  c.strokeStyle = "#2a2018"; c.lineWidth = 1.1; c.beginPath(); c.moveTo(...Q(s, 0)); c.lineTo(...Q(s, z1 * 0.58)); c.stroke();
  c.strokeStyle = "rgba(210,170,100,0.5)"; c.lineWidth = 0.6; c.beginPath(); for (let z = 0.2; z < z1 * 0.52; z += 0.2) { c.moveTo(...Q(s - w * 0.38, z)); c.lineTo(...Q(s + w * 0.38, z)); } c.stroke();
  // lintel band of the tympanum
  poly(k, [Q(s - w * 0.4, z1 * 0.6), Q(s + w * 0.4, z1 * 0.6), Q(s + w * 0.4, z1 * 0.6 + 0.08), Q(s - w * 0.4, z1 * 0.6 + 0.08)], shade(ST, 0.22), 0.6);
  // jamb statues
  for (let i = 0; i < 3; i++) for (const sg of [-1, 1]) { const [x, y] = Q(s + sg * (w / 2 + 0.03 + i * 0.035), 0.5 + i * 0.32); c.fillStyle = "#e6d4a8"; c.strokeStyle = INK; c.lineWidth = 0.6; c.fillRect(x - 1.3, y - 7, 2.6, 7); c.strokeRect(x - 1.3, y - 7, 2.6, 7); c.beginPath(); c.arc(x, y - 8.4, 1.5, 0, 7); c.fill(); c.stroke(); }
}

// ---------- rose window ----------
function circPts(Q, s, zc, rr, n = 20, a0 = 0) { const o = []; for (let i = 0; i < n; i++) { const a = a0 + (i / n) * Math.PI * 2; o.push(Q(s + Math.cos(a) * rr * 0.81, zc + Math.sin(a) * rr)); } return o; }
function rose(k, Q, s, zc, r, t, seed = 0) {
  const c = k.ctx, cols = ["#c8403a", "#3f6fb8", "#e9b43c", "#5f9d6d", "#8a4fa8"];
  poly(k, circPts(Q, s, zc, r * 1.3, 28), shade(ST, 0.16), 1.1);
  poly(k, circPts(Q, s, zc, r * 1.1, 28), shade(ST, -0.12), 0.8);
  poly(k, circPts(Q, s, zc, r, 28), "#232c4a", 1);
  // outer ring of 12 small rosettes
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, tw = 0.75 + 0.25 * Math.sin(t * 1.4 + i * 1.7 + seed);
    const cx = s + Math.cos(a) * r * 0.74 * 0.81, cz = zc + Math.sin(a) * r * 0.74;
    k.path(circPts(Q, cx, cz, r * 0.2, 10), { fill: cols[i % 5], lw: 0.6, wobble: 0, alpha: tw });
  }
  // inner wedges
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, a2 = ((i + 1) / 12) * Math.PI * 2, tw = 0.8 + 0.2 * Math.sin(t * 1.7 + i * 2.3 + seed);
    c.beginPath(); c.moveTo(...Q(s, zc)); c.lineTo(...Q(s + Math.cos(a) * r * 0.5 * 0.81, zc + Math.sin(a) * r * 0.5)); c.lineTo(...Q(s + Math.cos(a2) * r * 0.5 * 0.81, zc + Math.sin(a2) * r * 0.5)); c.closePath();
    c.fillStyle = cols[(i + 2) % 5]; c.globalAlpha = tw; c.fill(); c.globalAlpha = 1;
  }
  c.strokeStyle = "#241a12"; c.lineWidth = 0.9; c.beginPath();
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; c.moveTo(...Q(s + Math.cos(a) * r * 0.5 * 0.81, zc + Math.sin(a) * r * 0.5)); c.lineTo(...Q(s + Math.cos(a) * r * 0.97 * 0.81, zc + Math.sin(a) * r * 0.97)); }
  c.stroke();
  k.path(circPts(Q, s, zc, r * 0.5, 24), { fill: null, lw: 1, wobble: 0 });
  k.path(circPts(Q, s, zc, r * 0.18, 12), { fill: "#f4dc8a", lw: 0.8, wobble: 0 });
  k.path(circPts(Q, s, zc, r, 28), { fill: null, lw: 1.3, wobble: 0 });
}

// ---------- galleries ----------
function kings(k, Q, s0, s1, z0, z1, n) {
  const c = k.ctx;
  poly(k, [Q(s0, z0), Q(s1, z0), Q(s1, z1), Q(s0, z1)], shade(ST, -0.1), 0.9);
  for (let i = 0; i < n; i++) {
    const a = lerp(s0, s1, (i + 0.12) / n), b = lerp(s0, s1, (i + 0.88) / n), m = (a + b) / 2;
    c.beginPath(); c.moveTo(...Q(a, z0 + 0.03)); c.lineTo(...Q(b, z0 + 0.03)); c.lineTo(...Q(b, z1 - 0.08)); c.quadraticCurveTo(...Q(m, z1 + 0.04), ...Q(a, z1 - 0.08)); c.closePath();
    c.fillStyle = "#54432f"; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.5; c.stroke();
    const [x, y] = Q(m, z0 + 0.04); c.fillStyle = LIGHT; c.strokeStyle = INK; c.lineWidth = 0.5;
    c.fillRect(x - 1.1, y - 5, 2.2, 5); c.strokeRect(x - 1.1, y - 5, 2.2, 5); c.beginPath(); c.arc(x, y - 6.2, 1.4, 0, 7); c.fill(); c.stroke();
  }
}
function colonnade(k, Q, s0, s1, z0, z1, n, wall) {
  const c = k.ctx;
  poly(k, [Q(s0, z0), Q(s1, z0), Q(s1, z1), Q(s0, z1)], "#3e3226", 0.9);
  // pointed arches between slender double colonnettes
  for (let i = 0; i < n; i++) {
    const a = lerp(s0, s1, i / n), b = lerp(s0, s1, (i + 1) / n), m = (a + b) / 2;
    c.beginPath(); c.moveTo(...Q(a + 0.025, z0)); c.lineTo(...Q(a + 0.025, z1 - 0.1)); c.quadraticCurveTo(...Q(m - 0.02, z1 - 0.04), ...Q(m, z1 - 0.01)); c.quadraticCurveTo(...Q(m + 0.02, z1 - 0.04), ...Q(b - 0.025, z1 - 0.1)); c.lineTo(...Q(b - 0.025, z0)); c.closePath();
    c.fillStyle = "#6b563f"; c.fill();
  }
  c.strokeStyle = shade(wall, 0.2); c.lineWidth = 1.1; c.beginPath();
  for (let i = 0; i <= n; i++) { const a = lerp(s0, s1, i / n); c.moveTo(...Q(a, z0)); c.lineTo(...Q(a, z1)); }
  c.stroke(); c.strokeStyle = INK; c.lineWidth = 0.5; c.beginPath();
  for (let i = 0; i <= n; i++) { const a = lerp(s0, s1, i / n); c.moveTo(...Q(a - 0.012, z0)); c.lineTo(...Q(a - 0.012, z1)); } c.stroke();
}
function crenel(k, Q, s0, s1, z) {
  const n = Math.round((s1 - s0) / 0.12);
  for (let i = 0; i < n; i++) { if (i % 2) continue; const a = lerp(s0, s1, i / n), b = lerp(s0, s1, (i + 1) / n); k.path([Q(a, z), Q(b, z), Q(b, z + 0.12), Q(a, z + 0.12)], { fill: shade(ST, 0.1), lw: 0.7, wobble: 0 }); }
}
function chimera(k, Q, s, z, dir = 1) {
  const c = k.ctx, [x, y] = Q(s, z);
  c.fillStyle = "#6f6a60"; c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath();
  c.moveTo(x, y); c.lineTo(x + 1 * dir, y - 5); c.lineTo(x + 3 * dir, y - 6.5); c.lineTo(x + 5 * dir, y - 4); c.lineTo(x + 3 * dir, y - 3); c.lineTo(x + 3 * dir, y); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(x + 1 * dir, y - 5); c.lineTo(x - 1 * dir, y - 8); c.lineTo(x + 2 * dir, y - 6); c.stroke();
}

// louvred twin-lancet bay on a tower face
function belfryBay(k, Q, s, w, z0, z1, side, wall) {
  const c = k.ctx;
  opening(k, Q, s, w, z0 - 0.04, z1 + 0.16, { side, arch: "pointed", glass: shade(wall, side === "R" ? -0.1 : 0.04), frame: shade(wall, 0.2), mull: false, sill: false, fw: 0.03, wall });
  for (const sg of [-1, 1]) {
    const sa = s + sg * w * 0.255, ww = w * 0.38;
    opening(k, Q, sa, ww, z0, z1, { side, arch: "pointed", glass: "#2b211b", frame: shade(wall, 0.14), mull: false, sill: false, fw: 0.022, wall });
    c.strokeStyle = "rgba(205,175,120,0.65)"; c.lineWidth = 0.75; c.beginPath();
    for (let z = z0 + 0.06; z < z1 - ww * 0.8; z += 0.085) { c.moveTo(...Q(sa - ww / 2, z)); c.lineTo(...Q(sa + ww / 2, z + 0.035)); }
    c.stroke();
  }
  // colonnette between the lancets
  poly(k, [Q(s - 0.012, z0), Q(s + 0.012, z0), Q(s + 0.012, z1 - 0.1), Q(s - 0.012, z1 - 0.1)], shade(wall, 0.25), 0.4);
}

// ---------- towers ----------
export function tower(k, t, u0, v0, du, dv, H, seed, o = {}) {
  k.box(u0, v0, 0, du, dv, H, ST, { hatch: false, shadow: false, noTop: true });
  const QL = plane("L", v0 + dv), QR = plane("R", u0 + du);
  for (const [Q, s0, s1, side] of [[QL, u0, u0 + du, "L"], [QR, v0, v0 + dv, "R"]]) {
    const wall = side === "R" ? shade(ST, -0.2) : shade(ST, -0.07), base = side === "R" ? shade(ST, -0.2) : ST;
    k.path([Q(s0, 0), Q(s1, 0), Q(s1, H), Q(s0, H)], { fill: wall, lw: 1.4, wobble: 0 });
    const c2 = k.ctx; c2.strokeStyle = side === "R" ? "rgba(60,40,20,0.14)" : "rgba(120,90,50,0.18)"; c2.lineWidth = 0.7; c2.beginPath();
    for (let z = 0.25; z < H; z += 0.25) { c2.moveTo(...Q(s0, z)); c2.lineTo(...Q(s1, z)); } c2.stroke();
    const mid = (s0 + s1) / 2, wd = s1 - s0, bo = { side, c: side === "L" ? v0 + dv : u0 + du, out: 0.06, dark: side === "R" };
    for (const z of [2.0, 4.05]) band(k, Q, s0, s1, z, 0.1, ST, bo);
    // R faces: lower lancets + blind arcade above the aisle line
    if (side === "R") {
      for (const sg of [-1, 0, 1]) opening(k, Q, mid + sg * wd * 0.3, wd * 0.14, 2.3, 3.8, { side, arch: "pointed", glass: "#43382d", mull: false, sill: false, fw: 0.02, wall: ST });
      for (const sg of [-1, 0, 1]) opening(k, Q, mid + sg * wd * 0.3, wd * 0.13, 0.5, 1.8, { side, arch: "pointed", glass: "#3a3040", mull: true, sill: false, fw: 0.02, wall: ST });
    }
    // belfry: two louvred twin-lancet bays per face
    band(k, Q, s0, s1, 4.82, 0.08, ST, bo);
    for (const sg of [-1, 1]) belfryBay(k, Q, mid + sg * wd * 0.25, wd * 0.4, 4.98, H - 0.32, side, ST);
    // vertical corner shafts
    for (const sEdge of [s0 + 0.06, s1 - 0.06]) poly(k, [Q(sEdge - 0.05, 4.9), Q(sEdge + 0.05, 4.9), Q(sEdge + 0.05, H), Q(sEdge - 0.05, H)], shade(ST, 0.16), 0.7);
    // pierced parapet under the roof
    colonnade(k, Q, s0, s1, H - 0.26, H - 0.1, 12, ST);
    band(k, Q, s0, s1, H - 0.1, 0.1, ST, bo);
    crenel(k, Q, s0, s1, H);
  }
  const topz = H + 0.1;
  k.path([[u0, v0 + dv, topz], [u0 + du, v0 + dv, topz], [u0 + du, v0, topz], [u0, v0, topz]].map((p) => P(...p)), { fill: shade(ST, 0.1), lw: 1, wobble: 0 });
  for (const [pu, pv] of [[u0 + 0.06, v0 + dv - 0.06], [u0 + du - 0.06, v0 + dv - 0.06], [u0 + du - 0.06, v0 + 0.06]]) k.cone(pu, pv, topz, 0.07, 0.5, shade(ST, 0.05));
  const cu = u0 + du / 2, cv = v0 + dv / 2;
  k.cyl(cu, cv, topz, 0.34, 0.2, shade(ST, 0.1));
  k.cone(cu, cv, topz + 0.2, 0.38, 0.2, "#a3a8ae");
  { const [x, y] = P(cu, cv, topz + 0.42), c = k.ctx; c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 22); c.stroke(); }
}

// ---------- west facade ----------
export function facadeMid(k, t) {
  const Q = plane("L", FV), c = k.ctx;
  const u0 = 0.25, u1 = 3.95, HM = 4.75;
  // the deck of the gallery between the towers (top plane only)
  k.path([[1.5, FV - 1.25, HM], [2.7, FV - 1.25, HM], [2.7, FV, HM], [1.5, FV, HM]].map((p) => P(...p)), { fill: shade(ST, 0.1), lw: 1, wobble: 0 });
  k.path([Q(u0, 0), Q(u1, 0), Q(u1, HM), Q(u0, HM)], { fill: shade(ST, -0.07), lw: 1.5, wobble: 0 });
  c.strokeStyle = "rgba(120,90,50,0.18)"; c.lineWidth = 0.7; c.beginPath(); for (let z = 0.25; z < HM; z += 0.25) { c.moveTo(...Q(u0, z)); c.lineTo(...Q(u1, z)); } c.stroke();
  // plinth
  band(k, Q, u0, u1, 0.0, 0.14, ST, { c: FV, out: 0.07 });
  // portals (left, centre with gable, right)
  pointedPortal(k, Q, 0.9, 0.66, 1.6, false); pointedPortal(k, Q, 2.2, 0.84, 1.95, true); pointedPortal(k, Q, 3.3, 0.66, 1.6, false);
  // gallery of kings
  kings(k, Q, u0 + 0.05, u1 - 0.05, 2.5, 2.9, 28);
  band(k, Q, u0, u1, 2.42, 0.08, ST, { c: FV, out: 0.07 });
  band(k, Q, u0, u1, 2.9, 0.1, ST, { c: FV, out: 0.07 });
  // upper stage: central rose with flanking lancets, tall paired windows in the tower bays
  rose(k, Q, 2.2, 3.55, 0.5, t, 1);
  for (const sg of [-1, 1]) opening(k, Q, 2.2 + sg * 0.66, 0.16, 3.1, 4.25, { arch: "pointed", glass: "#3b3d57", mull: true, sill: false, fw: 0.03, wall: ST });
  for (const s2 of [0.9, 3.3]) for (const sg of [-1, 1]) {
    opening(k, Q, s2 + sg * 0.22, 0.2, 3.1, 4.4, { arch: "pointed", glass: "#3b3d57", mull: true, sill: false, fw: 0.03, wall: ST });
  }
  // upper open gallery + balustrade
  band(k, Q, u0, u1, 4.32, 0.08, ST, { c: FV, out: 0.07 });
  colonnade(k, Q, u0 + 0.05, u1 - 0.05, 4.4, 4.7, 40, ST);
  band(k, Q, u0, u1, 4.7, 0.1, ST, { c: FV, out: 0.1 });
  crenel(k, Q, u0, u1, HM + 0.05);
  // set-off buttresses that divide the facade into three bays, crowned with pinnacles
  for (const s2 of [u0 + 0.02, 1.5, 2.7, u1 - 0.02]) {
    const w = 0.26;
    k.box(s2 - w / 2, FV, 0, w, 0.16, 2.4, ST, { hatch: false, shadow: false });
    k.box(s2 - w / 2 + 0.03, FV, 2.4, w - 0.06, 0.13, 2.1, ST, { hatch: false, shadow: false });
    k.box(s2 - w / 2 + 0.05, FV, 4.5, w - 0.1, 0.11, 0.55, ST, { hatch: false, shadow: false });
    k.cone(s2, FV + 0.055, 5.05, 0.09, 0.55, shade(ST, 0.1));
    for (const z of [2.4, 4.5]) { const [x, y] = Q(s2 + 0.1, z); c.fillStyle = LIGHT; c.strokeStyle = INK; c.lineWidth = 0.6; c.beginPath(); c.arc(x, y - 2, 2.3, 0, 7); c.fill(); c.stroke(); }
  }
  // chimeras on the gallery
  for (const [s2, d] of [[0.55, -1], [1.2, 1], [1.85, -1], [2.5, 1], [3.15, -1], [3.7, 1]]) chimera(k, Q, s2, HM + 0.1, d);
}

// ---------- nave, transept, buttresses, spire ----------
const N0 = 1.8, N1 = 3.4; // nave walls in u
function aisle(k, v0, v1) {
  k.box(N1, v0, 0, 4.0 - N1, v1 - v0, 2.0, ST, { hatch: false, shadow: false, noTop: true });
  const Q = plane("R", 4.0); k.path([Q(v0, 0), Q(v1, 0), Q(v1, 2.0), Q(v0, 2.0)], { fill: shade(ST, -0.2), lw: 1.2, wobble: 0 });
  for (let s2 = v0 + 0.18; s2 < v1 - 0.05; s2 += 0.36) {
    opening(k, Q, s2, 0.16, 0.45, 1.65, { side: "R", arch: "pointed", glass: "#3a3548", mull: true, sill: false, fw: 0.02, wall: ST });
  }
  band(k, Q, v0, v1, 1.95, 0.06, ST, { side: "R", c: 4.0, out: 0.05, dark: true });
  slateQuad(k, [P(4.0, v0, 2.0), P(4.0, v1, 2.0), P(N1, v1, 2.55), P(N1, v0, 2.55)], shade(SL, -0.15), { n: 4 });
}
function flyingButtress(k, v) {
  const c = k.ctx;
  k.box(3.98, v - 0.1, 0, 0.3, 0.2, 2.5, ST, { hatch: false, shadow: false });
  k.box(4.02, v - 0.07, 2.5, 0.22, 0.14, 0.5, shade(ST, 0.04), { hatch: false, shadow: false });
  k.cone(4.13, v, 3.0, 0.09, 0.62, shade(ST, 0.12));
  const arch = (z0, z1, bulge, lwI, lwS) => {
    const pts = []; for (let i = 0; i <= 12; i++) { const f = i / 12; pts.push(P(lerp(4.04, N1 - 0.02, f), v, lerp(z0, z1, f) + Math.sin(f * Math.PI) * bulge)); }
    c.lineCap = "round"; c.lineJoin = "round";
    for (const [w2, col] of [[lwI, INK], [lwS, shade(ST, 0.08)]]) { c.strokeStyle = col; c.lineWidth = w2; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.stroke(); }
    return pts;
  };
  const top = arch(2.95, 3.35, 0.14, 4.6, 3.0), low = arch(2.15, 2.75, 0.2, 4.6, 3.0);
  // tracery between the two arches (small colonnettes)
  c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); for (let i = 2; i <= 10; i += 2) { c.moveTo(...top[i]); c.lineTo(...low[i]); } c.stroke();
  c.strokeStyle = shade(ST, 0.15); c.lineWidth = 0.5; c.beginPath(); for (let i = 2; i <= 10; i += 2) { c.moveTo(...top[i]); c.lineTo(...low[i]); } c.stroke();
}
function ridgeV(k, u0, u1, v0, v1, z, h, col, n) {
  const um = (u0 + u1) / 2, r0 = [um, v0, z + h], r1 = [um, v1, z + h];
  slateQuad(k, [P(u1, v0, z), P(u1, v1, z), P(...r1), P(...r0)], shade(col, -0.18), { n });
  slateQuad(k, [P(u0, v1, z), P(u1, v1, z), P(...r1)], shade(col, -0.05), { n: 3 });
  slateQuad(k, [P(u0, v0, z), P(u0, v1, z), P(...r1), P(...r0)], col, { n });
  k.line([P(...r0), P(...r1)], { lw: 1.6, wobble: 0 });
}
export function cathedral(k, t) {
  const z = 3.2, ridge = 4.6, c = k.ctx;
  k.box(N0, -0.2, 0, N1 - N0, 4.4, z, ST, { hatch: false, shadow: false, noTop: true });
  { const Q = plane("R", N1); k.path([Q(-0.2, 0), Q(4.2, 0), Q(4.2, z), Q(-0.2, z)], { fill: shade(ST, -0.2), lw: 1.3, wobble: 0 });
    for (let i = 0; i < 8; i++) opening(k, Q, 0.12 + i * 0.55, 0.19, 2.0, 3.0, { side: "R", arch: "pointed", glass: "#3a3548", mull: true, sill: false, fw: 0.025, wall: ST });
    band(k, Q, -0.2, 4.2, 3.05, 0.07, ST, { side: "R", c: N1, out: 0.05, dark: true });
    crenel(k, Q, -0.2, 4.2, z); }
  ridgeV(k, N0 - 0.1, N1 + 0.1, -0.2, 4.2, z, ridge - z, SL, 8);
  aisle(k, 0.0, 1.45);
  for (const v of [0.15, 0.5, 0.85, 1.2]) flyingButtress(k, v);
  // transept: ridge along u, stone gable + rose on the south end
  const TZ = 3.7, TR = 5.1, tv0 = 1.45, tv1 = 2.7, tm = (tv0 + tv1) / 2;
  k.box(0.8, tv0, 0, 3.9, tv1 - tv0, TZ, ST, { hatch: false, shadow: false, noTop: true });
  { const Q = plane("R", 4.7); k.path([Q(tv0, 0), Q(tv1, 0), Q(tv1, TZ), Q(tv0, TZ)], { fill: shade(ST, -0.2), lw: 1.3, wobble: 0 });
    // gable
    k.path([Q(tv0, TZ), Q(tv1, TZ), Q(tm, TR)], { fill: shade(ST, -0.16), lw: 1.3, wobble: 0 });
    for (let zz = 0.25; zz < TR; zz += 0.25) { const hw = zz < TZ ? (tv1 - tv0) / 2 : (tv1 - tv0) / 2 * (1 - (zz - TZ) / (TR - TZ)); c.strokeStyle = "rgba(60,40,20,0.15)"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(...Q(tm - hw, zz)); c.lineTo(...Q(tm + hw, zz)); c.stroke(); }
    opening(k, Q, tm, 0.46, 0, 1.2, { side: "R", arch: "pointed", glass: "#3a2c25", mull: false, sill: false, wall: ST });
    opening(k, Q, tm, 0.7, 0, 1.4, { side: "R", arch: "pointed", glass: shade(ST, -0.1), mull: false, sill: false, wall: ST, fw: 0.02 });
    opening(k, Q, tm, 0.44, 0, 1.2, { side: "R", arch: "pointed", glass: "#3a2c25", mull: false, sill: false, wall: ST });
    rose(k, Q, tm, 2.65, 0.5, t, 3);
    for (const sg of [-1, 1]) opening(k, Q, tm + sg * 0.5, 0.12, 1.55, 2.9, { side: "R", arch: "pointed", glass: "#3a3548", mull: false, sill: false, fw: 0.02, wall: ST });
    rose(k, Q, tm, 4.1, 0.2, t, 5);
    for (const s2 of [tv0 + 0.03, tv1 - 0.03]) { poly(k, [Q(s2 - 0.08, 0), Q(s2 + 0.08, 0), Q(s2 + 0.08, TZ), Q(s2 - 0.08, TZ)], shade(ST, 0.04), 0.9); k.cone(4.7, s2, TZ, 0.1, 0.5, shade(ST, 0.1)); }
    band(k, Q, tv0, tv1, 1.55, 0.06, ST, { side: "R", c: 4.7, out: 0.05, dark: true });
    crenel(k, Q, tv0, tv1, TZ); }
  { const u0 = 0.7, u1 = 4.7, vm = tm, r0 = [u0, vm, TR], r1 = [u1, vm, TR];
    slateQuad(k, [P(u0, tv1, TZ), P(u1, tv1, TZ), P(...r1), P(...r0)], SL, { n: 6 });
    k.line([P(...r0), P(...r1)], { lw: 1.6, wobble: 0 });
  }
  aisle(k, 2.7, 4.2);
  for (const v of [2.95, 3.3, 3.65, 4.0]) flyingButtress(k, v);
  // spire on the crossing
  const su = 2.5, sv = 2.075, zb = ridge - 0.1;
  for (const [du, dv] of [[-0.36, -0.36], [0.36, -0.36], [-0.36, 0.36], [0.36, 0.36]]) k.cone(su + du, sv + dv, zb, 0.06, 0.8, "#6d7781");
  k.box(su - 0.22, sv - 0.22, zb, 0.44, 0.44, 0.6, "#8a929b", { hatch: false, shadow: false });
  for (const [du, dv] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]]) k.cone(su + du * 0.9, sv + dv * 0.9, zb + 0.6, 0.05, 0.4, "#7d8791");
  frustums(k, su - 0.17, sv - 0.17, 0.34, 0.34, zb + 0.6, [[0, 0], [0.025, 0.55], [0.055, 1.3], [0.09, 2.1], [0.13, 2.9], [0.155, 3.3]], "#626d78", { n: 3, noCap: true });
  // openwork tiers + crockets
  for (const [dz, r] of [[1.0, 0.12], [1.8, 0.09], [2.5, 0.07]]) { const [x, y] = P(su, sv, zb + 0.6 + dz); discAt(k, x, y, r * 52 * 0.35, 2.2, "#9aa3ac", 0.6); }
  const [tx, ty] = P(su, sv, zb + 3.95);
  c.strokeStyle = INK; c.lineWidth = 2.4; c.beginPath(); c.moveTo(...P(su, sv, zb + 3.6)); c.lineTo(tx, ty); c.stroke(); c.strokeStyle = "#c9a74a"; c.lineWidth = 1.1; c.stroke();
  c.strokeStyle = "#c9a74a"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(tx - 3, ty + 5); c.lineTo(tx + 3, ty + 5); c.stroke();
}
