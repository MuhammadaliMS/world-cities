// PARIS · 1,-1 · Montmartre & Sacré-Cœur (code-drawn, traced over assets/paris/1_-1.png)
import { P, CTS, INK, shade, lerp, clamp, rng, hash } from "../../lib/vec-kit.js";
import * as G from "./_g1_-1.js";
import { uv, facade, plane, opening, band, frustums, slateQuad, dormer, chimney, statue, pigeon, flock, sparkle, cobbles, planter, dense, inPoly, debugRoutes, SLATE } from "./_props.js";

const PAVE = "#e9ddc0", WALL = "#e6d6ad", LAWN = "#a4c566", SOIL = "#b78b5d", CREAM = "#f0e3c2";
const Z1 = 1.0, Z2 = 2.0;
// elevated ground -> ground coords that land at the same screen spot
const { at, lawnTufts, wallCourses, balustrade, flight } = G;
export const camera = { u: 3.4, v: 3.6, z: 2.6, zoom: 1.5 };
const PF = 5.2; // front edge of the church platform (v)

// ---------- terrain ----------
const SOILD = "#b78b5d";
function terraces(k, t) {
  const c = k.ctx;
  // T2 church platform (paved) + lawn to its right; T1 front lawn terrace; right hill strip. All inside 0.3..9.7.
  k.box(0.3, 0.3, 0, 3.2, PF - 0.3, Z2, WALL, { hatch: false, shadow: false, top: CREAM });
  k.box(3.5, 0.3, 0, 2.2, PF - 0.3, Z2, WALL, { hatch: false, shadow: false, top: LAWN, right: shade(SOILD, 0.05), left: shade(WALL, -0.04) });
  k.box(0.3, PF, 0, 5.4, 7.0 - PF, Z1, WALL, { hatch: false, shadow: false, top: LAWN });
  k.box(6.6, 0.3, 0, 3.1, 6.7, Z1, WALL, { hatch: false, shadow: false, top: LAWN, right: SOILD, left: shade(SOILD, 0.1) });
  lawnTufts(k, 0.3, PF, 5.4, 7.0 - PF, Z1, 4); lawnTufts(k, 6.7, 0.3, 3.0, 6.7, Z1, 8); lawnTufts(k, 3.5, 0.3, 2.2, PF - 0.3, Z2, 3, 220);
  // church platform paving (flagstones)
  { const poly = [[0.3, 0.3], [3.5, 0.3], [3.5, PF], [0.3, PF]].map(([a, b]) => P(a, b, Z2)); c.save(); k._trace(poly, true, 0); c.clip(); c.strokeStyle = "rgba(150,120,70,0.16)"; c.lineWidth = 0.7; c.beginPath(); for (let a = 0.3; a < 3.6; a += 0.32) { c.moveTo(...P(a, 0.3, Z2)); c.lineTo(...P(a, PF, Z2)); } for (let b = 0.3; b < PF + 0.1; b += 0.32) { c.moveTo(...P(0.3, b, Z2)); c.lineTo(...P(3.5, b, Z2)); } c.stroke(); c.restore(); }
  // stone retaining walls: courses
  wallCourses(k, 0.3, 5.7, PF, Z1, Z2, "L"); wallCourses(k, 0.3, 5.7, 7.0, 0, Z1, "L"); wallCourses(k, 6.6, 9.7, 7.0, 0, Z1, "L");
  wallCourses(k, 0.3, PF, 5.7, 0, Z2, "R", 0.4);
  // soil face (right end of the tile)
  c.save(); c.beginPath(); c.moveTo(...P(9.7, 0.3, 0)); c.lineTo(...P(9.7, 7.0, 0)); c.lineTo(...P(9.7, 7.0, Z1)); c.lineTo(...P(9.7, 0.3, Z1)); c.closePath(); c.clip();
  c.strokeStyle = "rgba(80,50,20,0.28)"; c.lineWidth = 1; for (let i = 1; i < 4; i++) { c.beginPath(); for (let v = 0.3; v <= 7; v += 0.4) { const z = Z1 * (i / 4) + Math.sin(v * 1.7 + i) * 0.05; v > 0.3 ? c.lineTo(...P(9.7, v, z)) : c.moveTo(...P(9.7, v, z)); } c.stroke(); }
  c.fillStyle = "rgba(90,60,30,0.35)"; const R3 = rng(5); for (let i = 0; i < 60; i++) { const [x, y] = P(9.7, 0.3 + R3() * 6.7, R3() * Z1); c.fillRect(x, y, 2.2, 1.6); }
  c.restore();
}
const FZ = 0.47, FV0 = 7.6, FV1 = 1.32;
const zRail = (v) => clamp((FV0 - v) * FZ, 0, (FV0 - FV1) * FZ); // funicular slope height at v
function funicularTrack(k, t) {
  const c = k.ctx;
  const v0 = FV0, v1 = FV1, ua = 5.7, ub = 6.5;
  // embankment wedge (visible u+ face) and inclined bed
  c.beginPath(); c.moveTo(...P(ub, v0, 0)); c.lineTo(...P(ub, v1, 0)); c.lineTo(...P(ub, v1, zRail(v1))); c.lineTo(...P(ub, v0, 0)); c.closePath();
  { const g = c.createLinearGradient(0, P(ub, v1, zRail(v1))[1], 0, P(ub, v0, 0)[1]); g.addColorStop(0, shade(LAWN, -0.1)); g.addColorStop(0.3, shade(LAWN, -0.2)); g.addColorStop(0.4, "#b99a6a"); g.addColorStop(1, "#a88458"); c.fillStyle = g; c.fill(); } c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
  c.beginPath(); c.moveTo(...P(ua, v0, 0)); c.lineTo(...P(ub, v0, 0)); c.lineTo(...P(ub, v1, zRail(v1))); c.lineTo(...P(ua, v1, zRail(v1))); c.closePath(); c.fillStyle = "#cfc4a8"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke();
  c.strokeStyle = "#6a5a46"; c.lineWidth = 1.6; c.beginPath(); for (let v = v0; v > v1; v -= 0.14) { c.moveTo(...P(ua + 0.04, v, zRail(v) + 0.01)); c.lineTo(...P(ub - 0.04, v, zRail(v) + 0.01)); } c.stroke();
  for (const uu of [ua + 0.14, ub - 0.14]) { c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(...P(uu, v0, 0.02)); c.lineTo(...P(uu, v1, zRail(v1) + 0.02)); c.stroke(); c.strokeStyle = "#a9b0b6"; c.lineWidth = 1.3; c.stroke(); }
  // centre cable
  c.strokeStyle = "rgba(40,40,40,0.8)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(...P(6.1, v0, 0.04)); c.lineTo(...P(6.1, v1, zRail(v1) + 0.04)); c.stroke();
}
function station(k, t, v, zb, label, col) {
  // small tidy station: stone plinth, cream walls, slate hip roof, sign
  const u0 = 5.55, du = 1.1, dv = 1.0, h = 1.15;
  k.box(u0, v, zb, du, dv, h, "#eadcb8", { hatch: false, shadow: false, noTop: true });
  const Qz = (ss, zz) => P(ss, v + dv, zz + zb);
  for (const [s2, w] of [[u0 + 0.28, 0.3], [u0 + du - 0.3, 0.3]]) opening(k, Qz, s2, w, 0.12, 0.8, { side: "L", arch: true, glass: "#6f8796", mull: true, sill: false, wall: "#eadcb8", fw: 0.03 });
  { const QR = (ss, zz) => P(u0 + du, ss, zz + zb); for (const s2 of [v + 0.3, v + 0.7]) opening(k, QR, s2, 0.22, 0.14, 0.78, { side: "R", arch: true, glass: "#55697a", mull: true, sill: false, wall: "#eadcb8", fw: 0.03 }); }
  k.hip(u0 - 0.08, v - 0.08, zb + h, du + 0.16, dv + 0.16, 0.55, "#6e7c92", { inset: 0.22 });
  const [x, y] = P(u0 + 0.55, v + dv, zb + h + 0.0);
  k.path([[x - 21, y + 4], [x + 21, y + 4], [x + 21, y - 5], [x - 21, y - 5]], { fill: col, lw: 0.9, wobble: 0 });
  const c = k.ctx; c.fillStyle = "#fff"; c.font = "bold 5.5px sans-serif"; c.textAlign = "center"; c.fillText(label, x, y + 2); c.textAlign = "left";
}
function funicularCar(k, t) {
  const c = k.ctx, u = 6.1;
  const dwell = 2.5, run = 7.5, tot = 2 * (run + dwell), tt = (t + 3) % tot;
  let f; if (tt < run) f = smooth(tt / run); else if (tt < run + dwell) f = 1; else if (tt < 2 * run + dwell) f = 1 - smooth((tt - run - dwell) / run); else f = 0;
  const vc = lerp(6.35, 2.2, f);
  const body = (vA, vB, col) => {
    const zA = zRail(vA) + 0.08, zB = zRail(vB) + 0.08, hh = 0.62;
    const ua = u - 0.28, ub = u + 0.28;
    k.path([P(ub, vB, zB), P(ub, vA, zA), P(ub, vA, zA + hh), P(ub, vB, zB + hh)], { fill: shade(col, -0.2), lw: 1.2, wobble: 0 });
    k.path([P(ua, vA, zA), P(ub, vA, zA), P(ub, vA, zA + hh), P(ua, vA, zA + hh)], { fill: col, lw: 1.2, wobble: 0 });
    for (let i = 0; i < 3; i++) { const a = lerp(vB, vA, 0.12 + i * 0.3), b = lerp(vB, vA, 0.12 + i * 0.3 + 0.2); k.path([P(ub, b, lerp(zB, zA, 0.12 + i * 0.3) + 0.3), P(ub, a, lerp(zB, zA, 0.12 + i * 0.3 + 0.2) + 0.3), P(ub, a, lerp(zB, zA, 0.12 + i * 0.3 + 0.2) + 0.52), P(ub, b, lerp(zB, zA, 0.12 + i * 0.3) + 0.52)].reverse(), { fill: "#e8f2f4", lw: 0.8, wobble: 0 }); }
    k.path([P(ua, vB, zB + hh), P(ub, vB, zB + hh), P(ub, vA, zA + hh), P(ua, vA, zA + hh)], { fill: "#f1ede2", lw: 1.1, wobble: 0 });
  };
  body(vc + 0.1, vc + 0.95, "#c9453b");
  body(vc - 0.85, vc, "#e0b84a");
  const [x, y] = P(u, vc + 0.5, zRail(vc + 0.5) + 0.72); c.fillStyle = "#fff"; c.beginPath(); c.arc(x, y - 3, 1.7, 0, 7); c.fill();
}
function smooth(x) { x = clamp(x); return x * x * (3 - 2 * x); }

// ---------- Sacré-Cœur (Romano-Byzantine, white Château-Landon stone) ----------
const TR = "#f1e4c2", TRD = shade("#f1e4c2", -0.18), DOMEC = "#ecd9aa";
// ring of arched windows + engaged columns on the visible half of a drum
function drumArcade(k, u, v, z, r, h, n, o = {}) {
  const c = k.ctx, [x, y0] = P(u, v, z), rx = r * CTS.S * Math.SQRT2, ry = rx * CTS.YS, hp = h * CTS.S * CTS.ZS;
  const ww = o.w ?? 3.4, wh = hp * (o.hf ?? 0.55);
  // base + top cornice rings
  c.strokeStyle = "rgba(120,92,50,0.55)"; c.lineWidth = 1.1;
  for (const f of [0.08, 0.92]) { c.beginPath(); c.ellipse(x, y0 - hp * f, rx, ry, 0, 0, Math.PI); c.stroke(); }
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (0.06 + 0.88 * (i + 0.5) / n), xx = x - Math.cos(a) * rx, yy = y0 - hp * 0.2 + Math.sin(a) * ry;
    const sw = Math.max(0.45, Math.sin(a)) * ww;
    c.beginPath(); c.moveTo(xx - sw, yy); c.lineTo(xx - sw, yy - wh * 0.7); c.quadraticCurveTo(xx - sw, yy - wh * 1.05, xx, yy - wh * 1.05); c.quadraticCurveTo(xx + sw, yy - wh * 1.05, xx + sw, yy - wh * 0.7); c.lineTo(xx + sw, yy);
    c.closePath(); c.fillStyle = o.glass || "#5b5048"; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.7; c.stroke();
    // column between windows
    const a2 = Math.PI * (0.06 + 0.88 * (i + 1) / n);
    if (i < n - 1) { const cx = x - Math.cos(a2) * rx, cy = y0 + Math.sin(a2) * ry; c.strokeStyle = "rgba(255,248,225,0.8)"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(cx, cy - hp * 0.12); c.lineTo(cx, cy - hp * 0.88); c.stroke(); c.strokeStyle = "rgba(100,80,45,0.5)"; c.lineWidth = 0.6; c.stroke(); }
  }
}
// ovoid tiled dome with horizontal courses and meridian ribs
function ovoid(k, u, v, z, r, h, col = DOMEC, o = {}) {
  const c = k.ctx, [x, y] = P(u, v, z), rx = r * CTS.S * Math.SQRT2, ry = rx * CTS.YS, hh = h * CTS.S * CTS.ZS;
  const g = c.createLinearGradient(x - rx, y - hh, x + rx, y);
  g.addColorStop(0, shade(col, 0.2)); g.addColorStop(0.45, col); g.addColorStop(1, shade(col, -0.3));
  const prof = (f) => rx * Math.pow(Math.max(0, 1 - Math.pow(f, 2.3)), 0.52); // ovoid half-width at height fraction f
  c.beginPath(); c.moveTo(x - rx, y);
  for (let i = 1; i <= 24; i++) { const f = i / 24; c.lineTo(x - prof(f), y - hh * f); }
  for (let i = 23; i >= 0; i--) { const f = i / 24; c.lineTo(x + prof(f), y - hh * f); }
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI);
  c.closePath(); c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = k.lw; c.stroke();
  c.save(); c.clip();
  // courses
  c.strokeStyle = "rgba(125,95,50,0.38)"; c.lineWidth = 0.7;
  const nc = o.courses ?? 12;
  for (let i = 1; i < nc; i++) { const f = i / nc, w = prof(f); c.beginPath(); c.ellipse(x, y - hh * f, w, w * CTS.YS, 0, 0.02, Math.PI - 0.02); c.stroke(); }
  // ribs
  c.strokeStyle = "rgba(125,95,50,0.5)"; c.lineWidth = 0.9;
  const nr = o.ribs ?? 8;
  for (let i = 1; i < nr; i++) { const a = Math.PI * i / nr; c.beginPath(); for (let j = 0; j <= 14; j++) { const f = j / 14, w = prof(f), xx = x - Math.cos(a) * w, yy = y - hh * f + Math.sin(a) * w * CTS.YS; j ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); }
  // light patch
  c.fillStyle = "rgba(255,250,225,0.28)"; c.beginPath(); c.ellipse(x - rx * 0.38, y - hh * 0.5, rx * 0.2, hh * 0.28, -0.25, 0, 7); c.fill();
  c.restore();
}
function lantern(k, u, v, z, r, h, o = {}) {
  const c = k.ctx;
  k.cyl(u, v, z - 0.03, r * 1.5, 0.12, TR, { topCol: shade(TR, 0.1) });          // base ring
  k.cyl(u, v, z + 0.09, r, h * 0.55, TR);
  // little arched slits in the lantern
  const [x, y] = P(u, v, z + 0.09 + h * 0.25), rx = r * CTS.S * Math.SQRT2;
  c.fillStyle = "#554a40"; for (const dx of [-0.5, 0, 0.5]) c.fillRect(x + dx * rx * 1.1 - 0.9, y - 3, 1.8, 6);
  k.cyl(u, v, z + 0.09 + h * 0.55, r * 1.25, 0.06, TR);
  ovoid(k, u, v, z + 0.15 + h * 0.55, r * 1.1, h * 0.55, DOMEC, { courses: 5, ribs: 4 });
  const top = z + 0.15 + h * 1.1;
  c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); c.moveTo(...P(u, v, top)); c.lineTo(...P(u, v, top + (o.spike ?? r * 3))); c.stroke();
  c.strokeStyle = "#caa84a"; c.lineWidth = 0.7; c.stroke();
  const [cx, cy] = P(u, v, top + (o.spike ?? r * 3) * 0.7); c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(cx - 3, cy); c.lineTo(cx + 3, cy); c.stroke();
}
// drum + ovoid dome + lantern
function domeOnDrum(k, u, v, z, r, dh, h, o = {}) {
  k.cyl(u, v, z, r, dh, TR, { top: false });
  drumArcade(k, u, v, z, r, dh, o.n ?? 8, { w: o.w, hf: o.hf });
  // cornice ledge
  k.cyl(u, v, z + dh - 0.02, r * 1.08, 0.1, shade(TR, 0.04), { topCol: shade(TR, 0.1) });
  ovoid(k, u, v, z + dh + 0.08, r * 0.93, h, DOMEC, { ribs: o.ribs ?? 8, courses: o.courses ?? 12 });
  lantern(k, u, v, z + dh + 0.08 + h * 0.97, o.lr ?? r * 0.2, o.lh ?? r * 1.7, { spike: r * 0.8 });
}
function pinnacle(k, u, v, z, h = 0.6, r = 0.07) {
  k.box(u - r, v - r, z, r * 2, r * 2, h * 0.65, TR, { hatch: false, shadow: false });
  k.cone(u, v, z + h * 0.65 + h * 0.35, r * 1.4, h * 0.35, DOMEC);
  k.ctx.strokeStyle = INK; k.ctx.lineWidth = 1; k.ctx.beginPath(); k.ctx.moveTo(...P(u, v, z + h)); k.ctx.lineTo(...P(u, v, z + h + 0.18)); k.ctx.stroke();
}
function pilasterRow(k, Q, side, s0, s1, z0, z1, n, col, c0) {
  const c = k.ctx;
  for (let i = 0; i <= n; i++) {
    const s = lerp(s0, s1, i / n), w = 0.05, d = 0.05, o = side === "L" ? [-d * CTS.S, d * CTS.S * CTS.YS] : [d * CTS.S, d * CTS.S * CTS.YS];
    const a = Q(s - w, z0), b = Q(s + w, z0), cc = Q(s + w, z1), dd = Q(s - w, z1);
    k.path([a, b, cc, dd], { fill: shade(col, side === "R" ? -0.05 : 0.1), lw: 0.7, wobble: 0 });
  }
}
function sacre(k, t) {
  const c = k.ctx, zp = Z2, H = 2.25, zr = zp + H, zu = zr + 0.35;
  // the basilica is modelled around v=0; sit it on the platform by moving it +0.5 along v (exact grid shift: P(0,0.5,0) - P(0,0,0))
  const [sx, sy] = P(0, 0.5, 0), [ox, oy] = P(0, 0, 0); c.save(); c.translate(sx - ox, sy - oy);
  const BU0 = 0.4, BU1 = 3.1, BV0 = 0.0, BV1 = 3.1;
  // ---- apse (rounded, behind-right), ribbed cone roof
  { const au = 2.7, av = 0.6, ar = 0.8;
    k.cyl(au, av, zp, ar, H - 0.7, TR, { top: false });
    drumArcade(k, au, av, zp + 0.35, ar, H - 1.3, 7, { w: 2.6, hf: 0.7 });
    k.cyl(au, av, zp + H - 0.76, ar * 1.06, 0.12, shade(TR, 0.04), { topCol: shade(TR, -0.05) });
    k.cone(au, av, zp + H - 0.64, ar * 1.02, 0.85, "#e6d3a2");
    c.strokeStyle = "rgba(110,85,45,0.5)"; c.lineWidth = 0.8; const [ax, ay] = P(au, av, zp + H - 0.64), rr = ar * CTS.S * Math.SQRT2;
    for (let i = 1; i < 9; i++) { const a = Math.PI * i / 9; c.beginPath(); c.moveTo(ax - Math.cos(a) * rr, ay + Math.sin(a) * rr * CTS.YS); c.lineTo(...P(au, av, zp + H + 0.21)); c.stroke(); }
  }
  // ---- body
  k.box(BU0, BV0, zp, BU1 - BU0, BV1 - BV0, H, TR, { hatch: false, shadow: false, top: shade(TR, 0.04) });
  // upper crossing block under the main dome
  k.box(0.75, 0.55, zr, 2.05, 2.3, zu - zr, TR, { hatch: false, shadow: false, top: shade(TR, 0.04) });
  { const Qa = (ss, zz) => P(ss, 2.85, zz + zr), Qb = (ss, zz) => P(2.8, ss, zz + zr);
    for (let i = 0; i < 4; i++) opening(k, Qa, 0.95 + i * 0.5, 0.14, 0.08, 0.3, { side: "L", arch: true, glass: "#5a5a63", mull: false, sill: false, fw: 0.02, wall: TR });
    for (let i = 0; i < 4; i++) opening(k, Qb, 0.8 + i * 0.5, 0.14, 0.08, 0.3, { side: "R", arch: true, glass: "#4a4a53", mull: false, sill: false, fw: 0.02, wall: TR }); }
  const QL = plane("L", BV1), QR = plane("R", BU1);
  for (const [Q, s0, s1, side, cc] of [[QL, BU0, BU1, "L", BV1], [QR, BV0, BV1, "R", BU1]]) {
    const Qz = (ss, zz) => Q(ss, zz + zp);
    k.path([Qz(s0, 0), Qz(s1, 0), Qz(s1, H), Qz(s0, H)], { fill: side === "R" ? TRD : shade(TR, -0.05), lw: 1.4, wobble: 0 });
    c.strokeStyle = side === "R" ? "rgba(100,80,40,0.16)" : "rgba(140,110,60,0.22)"; c.lineWidth = 0.7; c.beginPath(); for (let z = 0.2; z < H; z += 0.2) { c.moveTo(...Qz(s0, z)); c.lineTo(...Qz(s1, z)); } c.stroke();
    const n = Math.round((s1 - s0) / 0.45);
    for (let i = 0; i < n; i++) {
      const s2 = s0 + ((i + 0.5) * (s1 - s0)) / n;
      // lower tall arched windows, upper round-arched pairs, corbel arcade under the cornice
      opening(k, Qz, s2, 0.16, 0.25, 1.1, { side, arch: true, glass: shade(TR, side === "R" ? -0.42 : -0.32), mull: false, sill: false, fw: 0.03, wall: TR });
      opening(k, Qz, s2, 0.13, 1.3, 1.85, { side, arch: true, glass: "#5a5a63", mull: false, sill: false, fw: 0.025, wall: TR });
      for (const sg of [-1, 1]) opening(k, Qz, s2 + sg * 0.1, 0.045, 1.95, 2.1, { side, arch: true, glass: "#4a4a53", mull: false, sill: false, fw: 0.01, wall: TR });
    }
    pilasterRow(k, Qz, side, s0, s1, 0.0, H - 0.1, n, TR);
    band(k, Qz, s0, s1, 1.2, 0.08, TR, { side, c: cc, out: 0.05, dark: side === "R" });
        band(k, Qz, s0, s1, H - 0.22, 0.22, TR, { side, c: cc, out: 0.08, dark: side === "R" });
  }
  // ---- roofs (pale lead/stone gables between the domes)
  k.gable(1.15, 2.1, zr, 1.1, 1.0, 0.45, "#e3d2a4", { ridge: "v" });
  k.gable(2.05, 0.35, zr, 1.0, 1.1, 0.5, "#dccb9c", { ridge: "u" });
  // ---- campanile (tall, slim, arched belfry) rooted on the roof behind the right dome
  { const cu = 2.25, cv = 0.8, w = 0.6, hb = 3.7, zb = zr - 0.85;
    k.box(cu - w / 2, cv - w / 2, zb, w, w, hb, TR, { hatch: false, shadow: false });
    for (const [QQ, a2, side, cc] of [[plane("L", cv + w / 2), cu, "L", cv + w / 2], [plane("R", cu + w / 2), cv, "R", cu + w / 2]]) {
      const Qz = (ss, zz) => QQ(ss, zz + zb);
      for (const z of [1.2, 2.2, hb - 0.35]) band(k, Qz, a2 - w / 2, a2 + w / 2, z, 0.1, TR, { side, c: cc, out: 0.05, dark: side === "R" });
      for (const z0 of [0.3, 1.3]) opening(k, Qz, a2, 0.16, z0, z0 + 0.8, { side, arch: true, glass: "#4a4038", mull: false, sill: false, fw: 0.02, wall: TR });
      for (const sg of [-1, 1]) opening(k, Qz, a2 + sg * 0.15, 0.2, 2.45, hb - 0.55, { side, arch: true, glass: "#3b332c", mull: true, sill: false, fw: 0.025, wall: TR });
      c.strokeStyle = "rgba(100,80,45,0.35)"; c.lineWidth = 0.6; c.beginPath(); for (let z = 0.15; z < hb; z += 0.15) { c.moveTo(...Qz(a2 - w / 2, z)); c.lineTo(...Qz(a2 + w / 2, z)); } c.stroke();
    }
    const zt = zb + hb;
    k.box(cu - w / 2 - 0.04, cv - w / 2 - 0.04, zt, w + 0.08, w + 0.08, 0.12, shade(TR, 0.04), { hatch: false, shadow: false });
    k.cyl(cu, cv, zt + 0.12, 0.34, 0.18, TR);
    k.cone(cu, cv, zt + 0.3, 0.37, 1.35, "#e8d6a6");
    { const [px, py] = P(cu, cv, zt + 0.3), rr = 0.37 * CTS.S * Math.SQRT2; c.strokeStyle = "rgba(115,88,46,0.5)"; c.lineWidth = 0.7; for (let i = 1; i < 6; i++) { const a = Math.PI * i / 6; c.beginPath(); c.moveTo(px - Math.cos(a) * rr, py + Math.sin(a) * rr * CTS.YS); c.lineTo(...P(cu, cv, zt + 1.65)); c.stroke(); } for (let i = 1; i < 6; i++) { const f = i / 6, w2 = rr * (1 - f); c.beginPath(); c.ellipse(px, py - f * 1.35 * CTS.S * CTS.ZS, w2, w2 * CTS.YS, 0, 0.02, Math.PI - 0.02); c.stroke(); } }
    k.cyl(cu, cv, zt + 1.6, 0.09, 0.28, TR); k.cone(cu, cv, zt + 1.88, 0.13, 0.22, DOMEC);
    c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); c.moveTo(...P(cu, cv, zt + 2.1)); c.lineTo(...P(cu, cv, zt + 2.4)); c.stroke();
  }
  // ---- domes, back to front: main, right, left, front
  domeOnDrum(k, 1.45, 2.25, zu, 0.66, 1.25, 1.35, { n: 11, ribs: 10, courses: 14, lr: 0.14, lh: 1.15, w: 3.4, hf: 0.58 });
  domeOnDrum(k, 2.65, 1.55, zr, 0.36, 1.0, 1.0, { n: 6, ribs: 6, courses: 8, w: 2.4, lh: 0.62, hf: 0.4 });
  domeOnDrum(k, 0.85, 3.05, zr, 0.34, 1.0, 1.0, { n: 6, ribs: 6, courses: 8, w: 2.4, lh: 0.62 });
  domeOnDrum(k, 2.75, 2.85, zr, 0.37, 1.05, 1.1, { n: 6, ribs: 6, courses: 8, w: 2.5, lh: 0.68 });
  // ---- corner pinnacles on the facade and flanks
  for (const [pu, pv] of [[0.5, 3.0], [1.9, 3.1], [3.05, 3.05], [3.05, 1.7], [0.5, 1.0]]) pinnacle(k, pu, pv, zr + 0.02, 0.7);
  // ---- porch with three arches, gable pediment with gilt mosaic, statues
  { const pu0 = 0.4, pu1 = 2.2, pv0 = BV1, pv1 = 3.9, ph = 1.35;
    // central facade gable on the wall above the porch
    const QF = (s, z) => P(s, BV1, z + zp);
    k.path([QF(0.55, ph + 0.3), QF(2.05, ph + 0.3), QF(2.05, H - 0.1), QF(1.3, H + 0.5), QF(0.55, H - 0.1)], { fill: shade(TR, 0.03), lw: 1.2, wobble: 0 });
    opening(k, QF, 1.3, 0.3, 1.65, 2.2, { side: "L", arch: true, glass: "#5a5a63", mull: true, sill: false, fw: 0.04, wall: TR });
    k.circle(...QF(1.3, 2.55), 5.5, "#b9a36a", { lw: 1 }); k.circle(...QF(1.3, 2.55), 3.2, "#6a6a73", { lw: 0.7 });
    k.box(pu0, pv0, zp, pu1 - pu0, pv1 - pv0, ph, TR, { hatch: false, shadow: false, top: shade(TR, 0.02) });
    const Q = (s, z) => P(s, pv1, z + zp);
    for (let i = 0; i < 3; i++) { const a2 = 0.6 + i * 0.54; c.beginPath(); c.moveTo(...Q(a2, 0)); c.lineTo(...Q(a2 + 0.4, 0)); c.lineTo(...Q(a2 + 0.4, 0.7)); c.quadraticCurveTo(...Q(a2 + 0.2, 1.05), ...Q(a2, 0.7)); c.closePath(); c.fillStyle = "#4b4038"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke(); }
    for (let i = 0; i <= 3; i++) { const s2 = 0.55 + i * 0.54; k.path([Q(s2 - 0.05, 0), Q(s2 + 0.05, 0), Q(s2 + 0.05, 1.2), Q(s2 - 0.05, 1.2)], { fill: shade(TR, 0.1), lw: 0.8, wobble: 0 }); }
    k.path([Q(0.45, 1.2), Q(2.25, 1.2), Q(2.25, 1.35), Q(0.45, 1.35)], { fill: TR, lw: 0.8, wobble: 0 });
    // balustrade on the porch roof + gable and gilt mosaic
    c.strokeStyle = "rgba(120,95,55,0.75)"; c.lineWidth = 1; c.beginPath(); for (let s2 = 0.5; s2 <= 2.2; s2 += 0.1) { c.moveTo(...Q(s2, 1.35)); c.lineTo(...Q(s2, 1.6)); } c.stroke();
    c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(...Q(0.45, 1.62)); c.lineTo(...Q(2.25, 1.62)); c.stroke(); c.strokeStyle = "#f2e7c8"; c.lineWidth = 1.4; c.stroke();
    k.path([Q(0.8, 1.68), Q(1.9, 1.68), Q(1.35, 2.2)], { fill: shade(TR, 0.05), lw: 1, wobble: 0 });
    k.path([Q(1.05, 1.75), Q(1.65, 1.75), Q(1.35, 2.05)], { fill: "#d6b44c", lw: 0.8, wobble: 0 });
    // steps up to the porch
    for (let i = 0; i < 3; i++) k.box(0.3 - i * 0.0, pv1 + (2 - i) * 0.12, zp, 2.0 + 0.0, 0.12, 0.08 * (3 - i) - 0.0 + 0.0, "#e6d8b4", { hatch: false, shadow: false });
  }
  { const g = (s, z) => P(s, 3.9, z + zp); c.fillStyle = "#6f8f6a"; for (const s2 of [0.5, 2.1]) { const [x, y] = g(s2, 1.4); k.ctx.fillRect(x - 2.4, y - 14, 4.8, 12); c.beginPath(); c.arc(x, y - 16, 2.4, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.6; c.strokeRect(x - 2.4, y - 14, 4.8, 12); } }
  // gilt cross-topped finials are in lantern(); small bell-cote spire on the facade gable
  pinnacle(k, 1.3, 3.1, zr + 0.35, 0.9, 0.06);
  c.restore();
}
// ---------- Haussmann buildings with cafés ----------
function haussmann(k, t, u0, v0, du, dv, H, o) {
  const col = o.col || "#e6cf9a";
  k.box(u0, v0, 0, du, dv, H, col, { hatch: false, shadow: true, noTop: true });
  const fl = [
    { z0: 0.1, z1: 1.35, w: 0.62, arch: false, glass: "#6a5a48", mull: true, sill: false },
    { z0: 1.7, z1: 2.6, w: 0.36, balcony: true, ped: "seg", lit: 0.2, shutters: "#8a9b8c", glass: "#6d7d86" },
    { z0: 2.85, z1: 3.65, w: 0.32, lit: 0.2, shutters: "#8a9b8c", glass: "#6d7d86" },
  ];
  const bands = [[1.5, 0.1, 0.07], [2.72, 0.07, 0.06], [H - 0.2, 0.2, 0.1]];
  facade(k, { side: "L", c: v0 + dv, s0: u0, s1: u0 + du, z1: H, col, bay: o.bay ?? 0.62, floors: fl, bands, seed: o.seed });
  facade(k, { side: "R", c: u0 + du, s0: v0, s1: v0 + dv, z1: H, col, bay: o.bay ?? 0.62, floors: fl, bands, seed: o.seed + 1 });
  // striped awning along the shopfront (L face)
  if (o.awning) { const a = k.ctx; k.awning(u0 + 0.12, v0 + dv, 1.45, du - 0.24, { stripes: Math.round(du * 5), depth: 0.5, drop: 0.35, c1: o.awning, c2: "#f6f0e2" }); }
  // mansard roof + dormers + chimneys
  const h = 0.85;
  frustums(k, u0 - 0.04, v0 - 0.04, du + 0.08, dv + 0.08, H + 0.12, [[0, 0], [0.08, 0.4], [0.3, h]], o.slate || "#6e7c92", { n: 3 });
  const zD = H + 0.3;
  for (let i = 0; i < Math.round(du / 0.62); i++) dormer(k, u0 + 0.35 + i * (du - 0.55) / Math.max(1, Math.round(du / 0.62) - 1 || 1), v0 + dv - 0.02, zD, { w: 6, h: 8, roof: "#5c6b82", lit: i % 2 === 0 });
  for (let i = 0; i < Math.round(dv / 0.7); i++) dormer(k, u0 + du - 0.02, v0 + 0.4 + i * (dv - 0.6) / Math.max(1, Math.round(dv / 0.7) - 1 || 1), zD, { w: 6, h: 8, roof: "#46546a", frame: shade("#e6cf9a", -0.15) });
  chimney(k, u0 + 0.15, v0 + 0.15, H + 0.55, { smoke: !!o.smoke, seed: o.seed, h: 0.5 });
  chimney(k, u0 + du - 0.45, v0 + 0.2, H + 0.55, { w: 0.24, h: 0.45 });
}
function cafeTable(k, u, v, t, seed, col = "#d9544b", sit = 2) {
  const c = k.ctx;
  const [x, y] = P(u, v, 0);
  k.ell(u, v, 0, 0.22, "rgba(60,45,30,0.15)", { stroke: false });
  c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 10); c.stroke();
  k.circle(x, y - 11, 5.4, "#f4efe3", { lw: 1.1 }); c.fillStyle = col; c.beginPath(); c.arc(x, y - 11, 3.2, 0, 7); c.fill();
  // cup steam
  const ph = (t * 0.6 + seed) % 1; c.strokeStyle = `rgba(255,255,255,${0.6 * (1 - ph)})`; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 1, y - 13); c.quadraticCurveTo(x + 3, y - 17 - ph * 5, x, y - 21 - ph * 6); c.stroke();
}
function umbrellaTable(k, u, v, t, seed) { cafeTable(k, u, v, t, seed, "#3f6fb8"); k.umbrella(u, v, { h: 1.2, r: 0.55, col: seed % 2 ? "#e6dcc4" : "#c8403a" }); }

// ---------- trees on terraces ----------
function terraceTree(k, u, v, z, o = {}) { k.q(u + v + 0.2, () => at(k, z, () => k.tree(u, v, o))); }

// ---------- routes ----------
const STAIRS = {
  s1: { u0: 2.3, w: 1.0, vb: 8.4, vt: 7.0, z0: 0, z1: Z1, n: 8 },
  s4: { u0: 4.5, w: 0.9, vb: 8.4, vt: 7.0, z0: 0, z1: Z1, n: 8 },
  s2: { u0: 0.6, w: 0.9, vb: 6.6, vt: PF, z0: Z1, z1: Z2, n: 8 },
  s2b: { u0: 3.9, w: 0.9, vb: 6.6, vt: PF, z0: Z1, z1: Z2, n: 8 },
  s3: { u0: 7.0, w: 0.9, vb: 8.4, vt: 7.0, z0: 0, z1: Z1, n: 8 },
};
function climber(k, t, st, off, seed, sp = 0.3) {
  const a = [st.u0 + st.w / 2, st.vb], b = [st.u0 + st.w / 2, st.vt];
  const s = k.walkerState([a, b], { speed: sp, offset: off, dwell: 2.0 });
  const f = clamp(Math.hypot(s.u - a[0], s.v - a[1]) / Math.hypot(b[0] - a[0], b[1] - a[1]));
  const n = st.n, zz = lerp(st.z0, st.z1, Math.min(n, Math.ceil(f * n)) / n);
  k.q(s.u + s.v + 0.3, () => k.person(s.u, s.v, { dir: [s.du, s.dv], pose: s.moving ? "walk" : "stand", p: s.p, seed, z: zz }));
}
const ROUTES = {
  plazaA: [[2.0, 8.75], [3.8, 8.75], [5.4, 8.75], [7.6, 8.75]],
  plazaB: [[3.7, 9.55], [5.8, 9.55]],
  plazaC: [[2.0, 7.4], [2.0, 8.3]],
  plat: [[0.5, 4.85], [3.3, 4.85]],
  plat2: [[3.9, 3.7], [4.4, 2.0], [4.7, 0.7]],
  lawn: [[1.7, 6.2], [3.3, 6.3]],
  lawn2: [[5.1, 5.5], [5.1, 6.2]],
  hill: [[7.2, 1.8], [8.2, 3.4], [7.6, 5.0], [8.4, 6.3]],
  hill2: [[7.6, 1.3], [8.0, 2.6], [8.8, 5.2]],
  low: [[8.0, 8.9], [8.0, 9.5]],
};
function easel(k, u, v, z, s2, t) {
  const c = k.ctx;
  k.q(u + v + 0.2, () => {
    const [ex, ey] = P(u - 0.3, v + 0.1, z); c.strokeStyle = "#7a5233"; c.lineWidth = 2; c.beginPath(); c.moveTo(ex - 6, ey); c.lineTo(ex, ey - 24); c.lineTo(ex + 6, ey); c.stroke();
    k.path([[ex - 8, ey - 28], [ex + 8, ey - 30], [ex + 8, ey - 15], [ex - 8, ey - 13]], { fill: "#fbf8ef", lw: 1.1, wobble: 0 });
    // the painting grows, loops
    const pr = (t * 0.2 + s2 * 0.3) % 1; c.fillStyle = s2 % 2 ? "#d97b5f" : "#6a9fd0"; c.fillRect(ex - 6, ey - 26, 12 * Math.min(1, pr * 1.4 + 0.2), 5);
    c.fillStyle = "#79a85a"; c.fillRect(ex - 6, ey - 20, 12 * Math.min(1, pr * 1.2 + 0.1), 4);
    c.strokeStyle = s2 % 2 ? "#c8403a" : "#3f6fb8"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(ex - 6, ey - 16); c.lineTo(ex - 6 + pr * 12, ey - 16 - pr * 9); c.stroke();
    k.person(u, v, { z, pose: "paint", dir: [-0.9, 0.35], seed: 80 + s2, hat: "beret", hatCol: s2 % 2 ? "#c8403a" : "#2a2420", style: s2 % 2 ? "coat" : "stripes" });
  });
}

export default function draw(k, t) {
  const c = k.ctx;
  k.groundTrace({ lawn: [], water: [], walks: [] }, { paved: PAVE, side: "#e3d3b0", stipple: 6 });
  cobbles(k, [[0.3, 7.0], [9.7, 7.0], [9.7, 9.7], [0.3, 9.7]], { gap: 0.28, line: "rgba(130,100,60,0.2)" });
  terraces(k, t);
  k.q(4.2, () => sacre(k, t));
  // balustrades round the church platform (gap at the stair head)
  k.q(9.0, () => { balustrade(k, [0.35, PF - 0.07], [0.5, PF - 0.07], Z2); balustrade(k, [1.6, PF - 0.07], [3.45, PF - 0.07], Z2); });
  k.q(5.0, () => { balustrade(k, [3.5, 0.4], [3.5, 3.4], Z2); balustrade(k, [3.5, 4.0], [3.5, PF - 0.07], Z2); });
  // hedges and flowers on the lawn terraces
  k.q(8.5, () => at(k, Z1, () => { k.hedge(1.8, 6.65, 1.6, 0.25, { h: 0.34, col: "#6f9f55" }); k.hedge(4.95, 6.6, 0.65, 0.25, { h: 0.34, col: "#6f9f55" }); }));
  k.q(5.0, () => at(k, Z2, () => k.hedge(4.4, 0.4, 0.32, 2.4, { h: 0.32, col: "#6f9f55" })));
  k.q(9.0, () => at(k, Z1, () => {
    k.flowerCurve([[1.8, 5.6], [2.3, 5.85], [2.9, 5.7]], 0.4, { seed: 31, cols: ["#8aa6e0", "#a98ad8", "#e8f0ff", "#f0a0c0"] });
    k.flowerCurve([[8.3, 5.6], [8.8, 6.0]], 0.4, { seed: 32, cols: ["#8aa6e0", "#a98ad8", "#e8f0ff"] });
    k.flowerCurve([[3.3, 5.7], [3.5, 6.2]], 0.35, { seed: 33, cols: ["#e8a0c0", "#f4c0d8", "#b8a0e8"] });
  }));
  for (const s2 of Object.values(STAIRS)) k.q(s2.vt + s2.u0 + 0.5, () => flight(k, s2.u0, s2.w, s2.vb, s2.vt, s2.z0, s2.z1, s2.n));
  k.q(14, () => funicularTrack(k, t));
  k.q(13.9, () => { k.box(5.5, 0.32, 0, 1.2, 1.1, zRail(FV1), "#d9c9a0", { hatch: false, shadow: false, noTop: true }); station(k, t, 0.32, zRail(FV1), "MONTMARTRE", "#3a5a48"); });
  k.q(14.1, () => funicularCar(k, t));
  k.q(14.2, () => station(k, t, 7.3, 0, "FUNICULAIRE", "#3a5a48"));
  terraceTree(k, 0.55, 5.8, Z1, { r: 0.7, h: 1.5, seed: 11 }); terraceTree(k, 3.3, 6.0, Z1, { r: 0.6, h: 1.4, seed: 12, col: "#7fae55" });
  k.q(7, () => at(k, Z1, () => { k.conifer(0.4, 6.5, { h: 2.4, r: 0.3 }); k.conifer(5.4, 5.7, { h: 2.0, r: 0.28 }); }));
  terraceTree(k, 8.6, 0.7, Z1, { r: 0.8, h: 1.7, seed: 13 }); terraceTree(k, 9.3, 2.0, Z1, { r: 0.7, h: 1.5, seed: 14, col: "#7fae55" });
  terraceTree(k, 9.1, 3.8, Z1, { r: 0.8, h: 1.6, seed: 15 }); terraceTree(k, 9.3, 5.6, Z1, { r: 0.7, h: 1.4, seed: 16, col: "#8cb85f" });
  k.q(6, () => at(k, Z1, () => k.conifer(7.4, 0.8, { h: 2.6, r: 0.3 })));
  terraceTree(k, 5.2, 0.6, Z2, { r: 0.85, h: 1.7, seed: 17 }); terraceTree(k, 5.2, 2.7, Z2, { r: 0.6, h: 1.4, seed: 18, col: "#7fae55" });
  k.q(12, () => { for (const [u, v] of [[7.0, 7.7], [7.4, 9.4]]) k.tree(u, v, { r: 0.4, h: 0.7, seed: Math.round(u * 5 + v), col: "#6f9f55", lobes: [[0, 0, 0.9], [-0.5, 0.2, 0.6], [0.5, 0.2, 0.6]] }); });
  for (const [u, v, z] of [[0.45, 5.1, Z2], [3.35, 5.1, Z2], [3.4, 3.7, Z2], [0.45, 6.9, Z1], [3.45, 6.9, Z1], [5.5, 6.9, Z1], [1.9, 9.5, 0], [5.0, 9.5, 0], [7.4, 9.5, 0]]) k.q(u + v + 0.3, () => at(k, z, () => k.lamp(u, v, { col: "#2f4a3c" })));
  k.q(1.7 + 9.7 + 0.5, () => haussmann(k, t, 0.3, 7.2, 1.4, 2.5, 3.6, { col: "#e5c98e", awning: "#c8403a", seed: 2, smoke: true, slate: "#6b7a92" }));
  k.q(9.7 + 9.7 + 0.5, () => haussmann(k, t, 8.2, 7.5, 1.5, 2.2, 3.7, { col: "#ead7a8", awning: "#c8403a", seed: 6, slate: "#76849a", bay: 0.6 }));
  for (const [u, v, s2, col] of [[2.4, 9.35, 1, "#d9544b"], [3.3, 9.4, 2, "#e8c14a"]]) k.q(u + v, () => cafeTable(k, u, v, t, s2, col));
  k.q(6.5 + 9.3, () => umbrellaTable(k, 6.5, 9.3, t, 4));
  k.qperson(2.15, 9.35, { pose: "sit", seatZ: 0.3, dir: [1, 0.2], seed: 61, bench: true }); k.qperson(2.65, 9.35, { pose: "sit", seatZ: 0.3, dir: [-1, 0.1], seed: 62, bench: true });
  k.qperson(3.3, 9.0, { pose: "sit", seatZ: 0.3, dir: [0.3, 1], seed: 63, bench: true });
  easel(k, 4.3, 9.1, 0, 1, t); easel(k, 4.9, 9.2, 0, 2, t);
  const W = (name, off, seed, sp = 0.42, z = 0) => k.qwalker(ROUTES[name], { speed: sp, offset: off, seed, dwell: 1.2 + (seed % 3) * 0.6, z });
  W("plazaA", 0.0, 21); W("plazaA", 0.1, 22, 0.4); W("plazaB", 0.3, 23, 0.46); W("plazaB", 0.55, 46, 0.44); W("plazaC", 0.5, 24, 0.3);
  W("plat", 0.0, 25, 0.3, Z2); W("plat", 0.5, 26, 0.28, Z2); W("plat2", 0.5, 27, 0.4, Z2);
  W("lawn", 0.2, 28, 0.4, Z1); W("lawn2", 0.5, 29, 0.35, Z1);
  W("hill", 0.1, 30, 0.38, Z1); W("hill2", 0.6, 31, 0.36, Z1); W("low", 0.3, 32, 0.35, 0);
  climber(k, t, STAIRS.s1, 0.0, 41); climber(k, t, STAIRS.s1, 0.5, 42, 0.3); climber(k, t, STAIRS.s2, 0.2, 43); climber(k, t, STAIRS.s2b, 0.7, 44); climber(k, t, STAIRS.s3, 0.35, 45); climber(k, t, STAIRS.s4, 0.6, 47);
  for (const [u, v, pose, s2] of [[2.3, 5.0, "photo", 71], [2.7, 5.0, "wave", 72], [3.1, 5.0, "photo", 73], [1.9, 5.0, "cheer", 74]]) k.qperson(u, v, { z: Z2, pose, dir: [-0.1, 1], seed: s2 });
  for (const [u, v, z, s2] of [[2.3, 4.8, Z2, 1], [4.6, 3.3, Z2, 2], [6.0, 9.0, 0, 3], [3.8, 9.65, 0, 4]]) k.q(u + v, () => at(k, z, () => pigeon(k, u, v, t, s2)));
  k.flush();
  flock(k, 470, 140, 6, t, 7);
  k.circlingBird(600, 130, 80, 22, { speed: 0.6, phase: 1 });
  k.cloud(200, 230, { s: 0.85, phase: 1 }); k.cloud(820, 300, { s: 0.7, phase: 3 });
}
