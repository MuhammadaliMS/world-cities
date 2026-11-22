// SHANGHAI · centre tile · Lujiazui: Oriental Pearl Tower on its plaza, Shanghai Tower, SWFC, Jin Mao,
// a curved glass skywalk ring with split stairs, fountain garden with willows and cherry trees.
import { P, CTS, INK, shade, mix, lerp, clamp, rng, hash, ellipsePts, glint, SKYC } from "./_props.js";
import { makePearl, shanghaiTower, swfc, jinMao } from "./pearl.js";
import { SQ2, tracePts, bil, block, slabRim, roofKit, spireLine, willow, blossom, bush, parkLamp, faceQuads, glassFace, stoneFace } from "./_t0_0.js";

// ---------- layout (all measured off assets/shanghai/0_0.png) ----------
const DECK = 1.3;
const TC = [3.567, 3.633];            // Pearl Tower axis (stands on the plaza at deck height)
const RC = [5.95, 6.15], RA = 4.45, RB = 3.15, DW = 0.74; // ring: centre, outer semi-axes (screen-x, depth), deck width
const FC = [5.53, 5.53], FA = 1.35, FB = 0.75;         // fountain basin
// ring coordinates: x to screen-right, y toward the viewer
const fromR = (x, y) => [RC[0] + (x + y) / SQ2, RC[1] + (y - x) / SQ2];
const toR = (u, v) => [((u - RC[0]) - (v - RC[1])) / SQ2, ((u - RC[0]) + (v - RC[1])) / SQ2];
const TR = toR(TC[0], TC[1]), TA = 1.9, TB = 1.35;      // plaza ellipse around the tower (ring coords)
const inPlaza = (x, y, m = 0) => ((x - TR[0]) / (TA + m)) ** 2 + ((y - TR[1]) / (TB + m)) ** 2 < 1;
const plazaFront = (x) => TR[1] + TB * Math.sqrt(Math.max(0, 1 - ((x - TR[0]) / TA) ** 2));
const NSEG = 120;
const ringPt = (th, a, b) => fromR(Math.cos(th) * a, Math.sin(th) * b);
const STAIR_X = [TR[0] - 0.55, TR[0] + 0.6];            // grand stair from the plaza down to the fountain (ring x)

const TOWER = (() => { // makePearl expects (C, PZ) with u = v = C; shift by the tiny u-v offset in screen space
  const m = makePearl((TC[0] + TC[1]) / 2, DECK), dx = (TC[0] - TC[1]) * CTS.S;
  return { drawBack: (k, t) => { k.ctx.save(); k.ctx.translate(dx, 0); m.drawBack(k, t); k.ctx.restore(); }, draw: (k, t) => { k.ctx.save(); k.ctx.translate(dx, 0); m.draw(k, t); k.ctx.restore(); } };
})();

// ---------- skyline (front-corner screen x, face widths px, top y px; u0 / v0 = back edge in the tile) ----------
function placeL(x, wl, wr, u0) { const du = wl / 45, dv = wr / 45, uf = u0 + du, vf = uf - (x - 512) / 45; return { u: u0, v: vf - dv, du, dv, yb: P(uf, vf)[1] }; }
function placeR(x, wl, wr, v0) { const du = wl / 45, dv = wr / 45, vf = v0 + dv, uf = vf + (x - 512) / 45; return { u: uf - du, v: v0, du, dv, yb: P(uf, vf)[1] }; }
const hOf = (g, top) => (g.yb - top) / (CTS.S * CTS.ZS);

function hipCap(k, g, z, h, col) { slabRim(k, g.u, g.v, g.du, g.dv, z, 0.12, "#efe3c8", 0.06); slabRim(k, g.u + 0.04, g.v + 0.04, g.du - 0.08, g.dv - 0.08, z + 0.12, 0.08, "#e4d6b8", 0.0); z += 0.08; k.hip(g.u + 0.02, g.v + 0.02, z + 0.12, g.du - 0.04, g.dv - 0.04, h, col, { inset: Math.min(g.du, g.dv) * 0.42 }); }
function decoTop(k, g, z, steps, col, kind, seed) {
  let s = 1, zz = z;
  for (let i = 0; i < steps; i++) {
    s *= 0.78; const du = g.du * s, dv = g.dv * s, u = g.u + (g.du - du) / 2, v = g.v + (g.dv - dv) / 2, h = 0.32 - i * 0.05;
    slabRim(k, u + 0.05, v + 0.05, du - 0.1, dv - 0.1, zz - 0.06, 0.06, "#e8ddc6", 0.06);
    block(k, u, v, du, dv, zz, zz + h, { kind, col, seed: seed + i, shadow: false, floors: 2, cols: 3, colsR: 3 });
    // corner turrets
    if (i === 0) for (const [a, b] of [[0, 1], [1, 0], [1, 1]]) k.box(u + a * du - 0.06, v + b * dv - 0.06, zz, 0.12, 0.12, h + 0.12, "#d9cdb4", { hatch: false, shadow: false });
    zz += h;
  }
  return [g.u + g.du / 2, g.v + g.dv / 2, zz];
}

function skyline(k, t) {
  const c = k.ctx;
  const Q = (d, fn) => k.q(d, fn);
  const dep = (g) => g.u + g.du + g.v + g.dv;
  // --- left group (along the u = 0 edge) ---
  const L3 = placeL(262, 27, 28, 0.05);
  Q(dep(L3), () => { const h = hOf(L3, 382); block(k, L3.u, L3.v, L3.du, L3.dv, 0, h, { col: "#7ea4c0", seed: 31, band: 6, pier: 1.2, pierEvery: 2 }); const top = decoTop(k, L3, h, 3, "#8fb2cb", "glass", 40); spireLine(k, top[0], top[1], top[2], top[2] + 1.0); });
  const L2b = placeL(234, 32, 26, 0.05);
  Q(dep(L2b), () => { const h = hOf(L2b, 412); block(k, L2b.u, L2b.v, L2b.du, L2b.dv, 0, h, { kind: "stone", col: "#d8c8a6", seed: 33, band: 5 }); hipCap(k, L2b, h, 0.45, "#dccaa6"); });
  const L6 = placeL(409, 18, 22, 0.05);
  Q(dep(L6), () => { const h = hOf(L6, 384); block(k, L6.u, L6.v, L6.du, L6.dv, 0, h, { col: "#86a9c2", seed: 35, band: 5 }); slabRim(k, L6.u, L6.v, L6.du, L6.dv, h, 0.08, "#dfe6ea", 0.03); const ug = L6.u + L6.du * 0.25, vg = L6.v + L6.dv * 0.25; block(k, ug, vg, L6.du * 0.5, L6.dv * 0.5, h + 0.08, h + 0.4, { col: "#9ab9cf", seed: 36, shadow: false, floors: 2, cols: 2, colsR: 2 }); spireLine(k, L6.u + L6.du / 2, L6.v + L6.dv / 2, h + 0.4, h + 0.75); });
  const L7 = placeL(442, 14, 17, 0.05);
  Q(dep(L7), () => { const h = hOf(L7, 401); block(k, L7.u, L7.v, L7.du, L7.dv, 0, h, { kind: "stone", col: "#dfd2b4", seed: 37, band: 3 }); slabRim(k, L7.u, L7.v, L7.du, L7.dv, h, 0.1, "#eadfc6", 0.04); });
  // Shanghai Tower on its glass podium
  const ST = [0.98, 4.71];
  Q(ST[0] + ST[1] + 0.9, () => shanghaiTower(k, ST[0], ST[1], (P(ST[0], ST[1])[1] - 51) / (CTS.S * CTS.ZS), t));
  const L5 = placeL(352, 30, 28, 0.95);
  Q(dep(L5), () => { const h = hOf(L5, 514); block(k, L5.u, L5.v, L5.du, L5.dv, 0, h, { col: "#8fb6cb", seed: 39, floors: 4 }); slabRim(k, L5.u, L5.v, L5.du, L5.dv, h, 0.1, "#ece2cd", 0.06); roofKit(k, L5.u + 0.1, L5.v + 0.1, L5.du - 0.2, L5.dv - 0.2, h + 0.1, 3); });
  const L4 = placeL(282, 39, 39, 0.32);
  Q(dep(L4), () => { const h = hOf(L4, 461); block(k, L4.u, L4.v, L4.du, L4.dv, 0, h, { kind: "stone", col: "#dccaa3", seed: 41, band: 3, litWin: 0.08 }); hipCap(k, L4, h, 0.35, "#ddcca8"); });
  const L2a = placeL(199, 35, 33, 0.25);
  Q(dep(L2a), () => { const h = hOf(L2a, 436); block(k, L2a.u, L2a.v, L2a.du, L2a.dv, 0, h, { col: "#7fa7bf", seed: 43, band: 4, pier: 1.4, pierEvery: 3 }); hipCap(k, L2a, h, 0.4, "#ddcda9"); });
  const L1 = placeL(144, 22, 20, 0.3);
  Q(dep(L1), () => { const h = hOf(L1, 503); block(k, L1.u, L1.v, L1.du, L1.dv, 0, h, { col: "#8bb2c8", seed: 45, band: 4 }); const ug = L1.u + 0.1, vg = L1.v + 0.1; block(k, ug, vg, L1.du * 0.55, L1.dv * 0.55, h, h + 0.35, { col: "#9cbfd2", seed: 46, shadow: false, floors: 2, cols: 2, colsR: 2 }); });
  const L8 = placeL(223, 30, 33, 1.32);
  Q(dep(L8), () => { const h = 1.25; block(k, L8.u, L8.v, L8.du, L8.dv, 0, h, { col: "#9fc1cf", seed: 47, floors: 3 }); slabRim(k, L8.u, L8.v, L8.du, L8.dv, h, 0.1, "#efe4cc", 0.08); k.hip(L8.u - 0.04, L8.v - 0.04, h + 0.1, L8.du + 0.08, L8.dv + 0.08, 0.5, "#bcd3dc", { inset: 0.32 }); });

  // --- right group (along the v = 0 edge) ---
  const R1 = placeR(601, 28, 22, 0.05);
  Q(dep(R1), () => { const h = hOf(R1, 373); block(k, R1.u, R1.v, R1.du, R1.dv, 0, h, { col: "#82a8c3", seed: 51, band: 5, pier: 1.1 }); const top = decoTop(k, R1, h, 2, "#92b5cc", "glass", 52); spireLine(k, top[0], top[1], top[2], top[2] + 0.55); });
  const R2 = placeR(613, 23, 23, 0.36);
  Q(dep(R2), () => { const h = hOf(R2, 396); block(k, R2.u, R2.v, R2.du, R2.dv, 0, h, { kind: "stone", col: "#e1d3b3", seed: 53, band: 4 }); slabRim(k, R2.u, R2.v, R2.du, R2.dv, h, 0.1, "#ece2cb", 0.04); roofKit(k, R2.u, R2.v, R2.du, R2.dv, h + 0.1, 8); });
  const SW = placeR(667, 32, 54, 0.05);
  Q(dep(SW), () => swfc(k, SW.u, SW.v, SW.du, SW.dv, hOf(SW, 160) - 0.45, t));
  const R3 = placeR(731, 10, 14, 0.05);
  Q(dep(R3), () => { const h = hOf(R3, 398); block(k, R3.u, R3.v, R3.du, R3.dv, 0, h, { col: "#5f86a9", seed: 55, cols: 2, colsR: 3 }); });
  const JM = placeR(767, 30, 33, 0.05);
  Q(dep(JM), () => jinMao(k, JM.u, JM.v, JM.du, JM.dv, hOf(JM, 384), t));
  const R6 = placeR(736, 52, 34, 0.42);
  Q(dep(R6), () => { const h = hOf(R6, 500); block(k, R6.u, R6.v, R6.du, R6.dv, 0, h - 0.5, { kind: "stone", col: "#e2d4b4", seed: 57, band: 3, litWin: 0.1 }); block(k, R6.u + 0.06, R6.v + 0.06, R6.du - 0.12, R6.dv - 0.12, h - 0.5, h, { col: "#8fb9c9", seed: 58, shadow: false, floors: 2 }); slabRim(k, R6.u, R6.v, R6.du, R6.dv, h, 0.1, "#efe5ce", 0.06); roofKit(k, R6.u + 0.1, R6.v + 0.1, R6.du - 0.2, R6.dv - 0.2, h + 0.1, 12); });
  // cylinder tower with a stepped glass crown and a cream spine
  const CY = [7.42, 0.72], CH = (P(...CY)[1] - 424) / (CTS.S * CTS.ZS);
  Q(CY[0] + CY[1] + 0.85, () => cylTower(k, CY[0], CY[1], 0.61, CH, t));
  const R7 = placeR(762, 24, 18, 1.62);
  Q(dep(R7), () => { const h = hOf(R7, 553); block(k, R7.u, R7.v, R7.du, R7.dv, 0, h, { kind: "stone", col: "#e4d6b6", seed: 59, band: 3 }); slabRim(k, R7.u, R7.v, R7.du, R7.dv, h, 0.1, "#efe5ce", 0.05); });
  const R8 = placeR(876, 20, 22, 0.3);
  Q(dep(R8), () => { const h = hOf(R8, 507); block(k, R8.u, R8.v, R8.du, R8.dv, 0, h - 0.4, { col: "#86aec4", seed: 61, band: 4 }); block(k, R8.u + 0.05, R8.v + 0.05, R8.du - 0.1, R8.dv - 0.1, h - 0.4, h, { kind: "stone", col: "#e3d5b5", seed: 62, shadow: false, floors: 1 }); slabRim(k, R8.u, R8.v, R8.du, R8.dv, h, 0.1, "#efe5ce", 0.05); });
}
function cylTower(k, u, v, r, H, t) {
  const c = k.ctx, [x, y0] = P(u, v, 0), rx = r * CTS.S * SQ2, ry = rx * 0.42, zs = H * 0.86;
  k.ell(u + 0.6, v + 0.25, 0, r * 1.2, "rgba(60,45,30,0.13)", { stroke: false });
  const drum = (zb, zt, rr, body) => {
    const [, yb] = P(u, v, zb), [, yt] = P(u, v, zt), rxx = rr * CTS.S * SQ2, ryy = rxx * 0.42;
    c.save(); c.beginPath(); c.moveTo(x - rxx, yt); c.lineTo(x - rxx, yb); c.ellipse(x, yb, rxx, ryy, 0, Math.PI, 0, true); c.lineTo(x + rxx, yt); c.ellipse(x, yt, rxx, ryy, 0, 0, Math.PI, false); c.closePath();
    const g = c.createLinearGradient(x - rxx, 0, x + rxx, 0); g.addColorStop(0, "#a9d2d8"); g.addColorStop(0.3, "#d8eef0"); g.addColorStop(0.55, "#7fb5c2"); g.addColorStop(1, "#3f7488"); c.fillStyle = g; c.fill(); c.clip();
    // horizontal spandrels + vertical mullions following the curvature
    c.lineWidth = 0.6; c.strokeStyle = "rgba(20,60,75,0.4)"; c.beginPath(); for (let z = zb + 0.14; z < zt; z += 0.14) { const [, yy] = P(u, v, z); c.moveTo(x - rxx, yy); c.ellipse(x, yy, rxx, ryy, 0, Math.PI, 0, true); } c.stroke();
    c.strokeStyle = "rgba(255,255,255,0.5)"; c.beginPath(); for (let z = zb + 0.56; z < zt; z += 0.56) { const [, yy] = P(u, v, z); c.moveTo(x - rxx, yy + 1); c.ellipse(x, yy + 1, rxx, ryy, 0, Math.PI, 0, true); } c.stroke();
    c.strokeStyle = "rgba(20,60,75,0.3)"; c.beginPath(); for (let i = -10; i <= 10; i++) { const s = Math.sin((i / 10.5) * Math.PI / 2); c.moveTo(x + s * rxx, yb + Math.sqrt(1 - s * s) * ryy); c.lineTo(x + s * rxx, yt + Math.sqrt(1 - s * s) * ryy); } c.stroke();
    if (body) { c.fillStyle = "#e6dbc2"; c.fillRect(x - rxx, yt, rxx * 0.32, yb - yt + ryy); c.strokeStyle = "rgba(90,70,40,0.35)"; c.beginPath(); for (let z = zb + 0.28; z < zt; z += 0.28) { const [, yy] = P(u, v, z); c.moveTo(x - rxx, yy + ryy * 0.3); c.lineTo(x - rxx * 0.68, yy + ryy * 0.75); } c.stroke(); }
    c.restore();
    c.beginPath(); c.moveTo(x - rxx, yt); c.lineTo(x - rxx, yb); c.ellipse(x, yb, rxx, ryy, 0, Math.PI, 0, true); c.lineTo(x + rxx, yt); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
    c.beginPath(); c.ellipse(x, yt, rxx + 1.5, ryy + 0.8, 0, 0, 7); c.fillStyle = "#e7eef0"; c.fill(); c.stroke();
  };
  drum(0, zs, r, true);
  drum(zs, H, r * 0.83, false);
  const [, yt] = P(u, v, H); c.beginPath(); c.ellipse(x, yt, rx * 0.83 * 0.72, ry * 0.83 * 0.72, 0, 0, 7); c.fillStyle = "#d9e6ea"; c.fill(); c.strokeStyle = "rgba(60,80,90,0.6)"; c.lineWidth = 1; c.stroke();
  const s = Math.max(0, Math.sin(t * 1.4 + 2)); if (s > 0.85) glint(c, x - rx * 0.4, yt + 40, (s - 0.85) / 0.15 * 7 + 2);
}

// ---------- plaza (raised to deck height) + grand stair ----------
const plazaPts = (m = 0, n = 64) => ellipsePts(...fromR(TR[0], TR[1]), TA + m, TB + m, n);
function plaza(k, t) {
  const c = k.ctx, z = DECK, pts = plazaPts(), n = pts.length;
  // retaining wall (front half): cream stone with coursing
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n], [ax, ay] = toR(...a), [bx, by] = toR(...b);
    if ((ay + by) / 2 < TR[1] + 0.05) continue;
    const q = [[a[0], a[1], 0], [b[0], b[1], 0], [b[0], b[1], z], [a[0], a[1], z]];
    const lit = (bx - ax) > 0 ? 0 : -0.06;
    k.poly(q, shade("#e2d3b6", lit - (ax + bx) * 0.012), { lw: 0.8, wobble: 0, stroke: shade("#e2d3b6", -0.08) });
  }
  // coursing lines + outline
  c.strokeStyle = "rgba(120,95,60,0.35)"; c.lineWidth = 0.7;
  for (let zz = 0.3; zz < z; zz += 0.3) { c.beginPath(); let pen = false; for (let i = 0; i <= n; i++) { const a = pts[i % n], [, ay] = toR(...a); if (ay < TR[1] + 0.05) { pen = false; continue; } const p = P(a[0], a[1], zz); pen ? c.lineTo(...p) : c.moveTo(...p); pen = true; } c.stroke(); }
  // top paving
  k.poly(pts.map(([u, v]) => [u, v, z]), "#eedfc6", { lw: 1.4, wobble: 0 });
  c.save(); tracePts(c, pts.map(([u, v]) => P(u, v, z))); c.clip();
  c.strokeStyle = "rgba(160,120,90,0.25)"; c.lineWidth = 0.7;
  for (const m of [-0.4, -0.8, -1.15]) { c.beginPath(); plazaPts(m).forEach(([u, v], i) => { const p = P(u, v, z); i ? c.lineTo(...p) : c.moveTo(...p); }); c.closePath(); c.stroke(); }
  c.beginPath(); for (let i = 0; i < 24; i++) { const th = (i / 24) * 6.283; c.moveTo(...P(...fromR(TR[0] + Math.cos(th) * 0.75, TR[1] + Math.sin(th) * 0.55), z)); c.lineTo(...P(...fromR(TR[0] + Math.cos(th) * TA, TR[1] + Math.sin(th) * TB), z)); } c.stroke();
  // pink granite inlay ring
  c.strokeStyle = "rgba(214,120,150,0.45)"; c.lineWidth = 2.2; c.beginPath(); plazaPts(-0.95).forEach(([u, v], i) => { const p = P(u, v, z); i ? c.lineTo(...p) : c.moveTo(...p); }); c.closePath(); c.stroke();
  c.restore();
}
// glass balustrade along a list of (u,v) points at height z
function balustrade(k, pts, z, o = {}) {
  const c = k.ctx, H = o.h ?? 0.42;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    k.poly([[a[0], a[1], z], [b[0], b[1], z], [b[0], b[1], z + H], [a[0], a[1], z + H]], "rgba(165,215,225,0.38)", { lw: 0.6, wobble: 0, stroke: "rgba(60,90,100,0.45)" });
    if (i % 2 === 0) { const p = P((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z + H * 0.55); c.strokeStyle = "rgba(255,255,255,0.75)"; c.lineWidth = 1; c.beginPath(); c.moveTo(p[0] - 4, p[1] + 3); c.lineTo(p[0] + 2, p[1] - 3); c.stroke(); }
  }
  for (let i = 0; i < pts.length; i += o.postEvery ?? 2) { const a = pts[i], p0 = P(a[0], a[1], z), p1 = P(a[0], a[1], z + H + 0.03); c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(...p0); c.lineTo(...p1); c.stroke(); c.strokeStyle = "#9aa3a8"; c.lineWidth = 1.2; c.stroke(); }
  const top = pts.map(([u, v]) => P(u, v, z + H + 0.03));
  c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); top.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.stroke();
  c.strokeStyle = "#e9eef0"; c.lineWidth = 1.8; c.stroke();
  const bot = pts.map(([u, v]) => P(u, v, z + 0.04)); c.strokeStyle = "rgba(60,70,75,0.6)"; c.lineWidth = 1.2; c.beginPath(); bot.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.stroke();
}
// a solid block in ring coordinates (convex quad) from z0 to z1
function blockR(k, q, z0, z1, col, o = {}) {
  const pts = q.map(([x, y]) => fromR(x, y)), n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n], eu = b[0] - a[0], ev = b[1] - a[1];
    const nu = ev, nv = -eu; // outward for ccw in (u,v)
    if (nu + nv <= 0.0001) continue;
    k.poly([[a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1], [a[0], a[1], z1]], shade(col, nu > nv ? -0.2 : -0.06), { lw: o.lw ?? 0.9, wobble: 0 });
  }
  k.poly(pts.map(([u, v]) => [u, v, z1]), o.top || shade(col, 0.05), { lw: o.lw ?? 0.9, wobble: 0 });
}
const ccw = (q) => { const pts = q.map(([x, y]) => fromR(x, y)); let s = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; s += a[0] * b[1] - b[0] * a[1]; } return s > 0 ? q : [...q].reverse(); };
const STAIR_Y0 = () => plazaFront((STAIR_X[0] + STAIR_X[1]) / 2) - 0.02, STAIR_Y1 = -1.62, NSTEP = 10;
function grandStair(k) {
  const x0 = STAIR_X[0], x1 = STAIR_X[1], y0 = STAIR_Y0(), y1 = STAIR_Y1, cw = 0.13;
  const yAt = (s) => lerp(y0, y1, s);
  // left cheek wall (sloped)
  const cheek = (xa, xb) => { for (let i = 0; i < NSTEP; i++) { const s0 = i / NSTEP, s1 = (i + 1) / NSTEP; blockR(k, ccw([[xa, yAt(s0) - 0.02], [xb, yAt(s0) - 0.02], [xb, yAt(s1)], [xa, yAt(s1)]]), 0, DECK * (1 - s0) + 0.12, "#e6d8bc", { lw: 0.7 }); } };
  cheek(x0 - cw, x0);
  for (let i = 0; i < NSTEP; i++) { const s0 = i / NSTEP, s1 = (i + 1) / NSTEP; blockR(k, ccw([[x0, yAt(s0) - 0.01], [x1, yAt(s0) - 0.01], [x1, yAt(s1)], [x0, yAt(s1)]]), 0, DECK * (1 - s0) - DECK / NSTEP * 0.0, i % 2 ? "#ecdcc2" : "#f0e2ca", { lw: 0.7, top: i % 2 ? "#f3e6d0" : "#f6ead6" }); }
  cheek(x1, x1 + cw);
  for (const xx of [x0 - cw / 2, x1 + cw / 2]) {
    const pts = Array.from({ length: NSTEP + 1 }, (_, i) => fromR(xx, yAt(i / NSTEP)));
    const c = k.ctx; const top = pts.map(([u, v], i) => P(u, v, DECK * (1 - i / NSTEP) + 0.12 + 0.42));
    for (let i = 0; i < NSTEP; i++) k.poly([[...pts[i], DECK * (1 - i / NSTEP) + 0.12], [...pts[i + 1], DECK * (1 - (i + 1) / NSTEP) + 0.12], [...pts[i + 1], DECK * (1 - (i + 1) / NSTEP) + 0.54], [...pts[i], DECK * (1 - i / NSTEP) + 0.54]], "rgba(165,215,225,0.35)", { lw: 0.5, wobble: 0, stroke: "rgba(60,90,100,0.4)" });
    c.strokeStyle = INK; c.lineWidth = 3.2; c.lineCap = "round"; c.beginPath(); top.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.stroke(); c.strokeStyle = "#e9eef0"; c.lineWidth = 1.7; c.stroke();
  }
}

// ---------- skywalk ring ----------
function ringGeom() {
  const segs = [];
  for (let i = 0; i < NSEG; i++) {
    const th0 = (i / NSEG) * 6.283, th1 = ((i + 1) / NSEG) * 6.283, thm = (th0 + th1) / 2;
    const xm = Math.cos(thm) * (RA - DW / 2), ym = Math.sin(thm) * (RB - DW / 2);
    if (inPlaza(xm, ym, -0.08)) continue;
    segs.push({ i, th0, th1, thm, o0: ringPt(th0, RA, RB), o1: ringPt(th1, RA, RB), i0: ringPt(th0, RA - DW, RB - DW), i1: ringPt(th1, RA - DW, RB - DW), near: Math.sin(thm) > 0 });
  }
  return segs;
}
const SEGS = ringGeom();
// front walkway just outside the ring, kept inside the tile
const WALK_R = Array.from({ length: 61 }, (_, i) => { const th = lerp(0.3, 2.85, i / 60); return [Math.cos(th) * (RA + 0.4), Math.sin(th) * (RB + 0.4)]; }).filter(([x, y]) => { const [u, v] = fromR(x, y); return u < 9.6 && v < 9.6; });
function ring(k, t) {
  const c = k.ctx, z = DECK, TH = 0.27;
  for (const s of SEGS) {
    const { o0, o1, i0, i1, near, i } = s;
    const dm = (o0[0] + o0[1] + o1[0] + o1[1] + i0[0] + i0[1] + i1[0] + i1[1]) / 4;
    k.q(dm - 0.25, () => {
      // fascia: white band on the visible edge, darker soffit
      const [e0, e1] = near ? [o0, o1] : [i0, i1];
      k.poly([[e0[0], e0[1], z], [e1[0], e1[1], z], [e1[0], e1[1], z - TH], [e0[0], e0[1], z - TH]], near ? "#f4efe6" : "#d9cfbf", { lw: 0.9, wobble: 0 });
      if (near) { const s0 = P(e0[0], e0[1], z - TH), s1 = P(e1[0], e1[1], z - TH); c.strokeStyle = "rgba(90,80,65,0.55)"; c.lineWidth = 2.2; c.beginPath(); c.moveTo(s0[0], s0[1] + 1); c.lineTo(s1[0], s1[1] + 1); c.stroke(); const a = P(e0[0], e0[1], z - TH * 0.35), b = P(e1[0], e1[1], z - TH * 0.35); c.strokeStyle = "rgba(160,140,110,0.5)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); }
      k.poly([[o0[0], o0[1], z], [o1[0], o1[1], z], [i1[0], i1[1], z], [i0[0], i0[1], z]], i % 2 ? "#eadbc3" : "#eddfc9", { stroke: false, wobble: 0 });
      // plank joints across the deck + centre line
      const a = P(o0[0], o0[1], z), b = P(i0[0], i0[1], z); c.strokeStyle = "rgba(150,120,90,0.3)"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke();
      const m0 = P((o0[0] + i0[0]) / 2, (o0[1] + i0[1]) / 2, z), m1 = P((o1[0] + i1[0]) / 2, (o1[1] + i1[1]) / 2, z); c.strokeStyle = "rgba(214,150,120,0.35)"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(...m0); c.lineTo(...m1); c.stroke();
    });
    // pillars under the deck midline
    if (i % 7 === 3) k.q(dm - 0.7, () => {
      const m = [(o0[0] + i0[0]) / 2, (o0[1] + i0[1]) / 2], [x, y0] = P(m[0], m[1], 0), [, y1] = P(m[0], m[1], z - TH);
      k.ell(m[0] + 0.15, m[1] + 0.05, 0, 0.16, "rgba(60,45,30,0.15)", { stroke: false });
      const g = c.createLinearGradient(x - 5, 0, x + 5, 0); g.addColorStop(0, "#fbf7ef"); g.addColorStop(0.6, "#e3d9c7"); g.addColorStop(1, "#b7ab96");
      c.fillStyle = g; c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x - 4.6, y1); c.lineTo(x - 4.6, y0); c.ellipse(x, y0, 4.6, 2, 0, Math.PI, 0, true); c.lineTo(x + 4.6, y1); c.fill(); c.stroke();
      c.fillStyle = "#e8dfcf"; c.beginPath(); c.ellipse(x, y1 + 2, 7, 2.6, 0, 0, 7); c.fill(); c.stroke();
    });
    // glass rails (outer + inner), posts, handrail
    for (const [a, b, e] of [[o0, o1, "o"], [i0, i1, "i"]]) {
      if (inPlaza(...toR(...a), 0.02) || inPlaza(...toR(...b), 0.02)) continue;
      const front = (e === "o") === near;
      k.q(dm + (front ? 0.55 : -0.55), () => {
        k.poly([[a[0], a[1], z], [b[0], b[1], z], [b[0], b[1], z + 0.44], [a[0], a[1], z + 0.44]], front ? "rgba(170,215,225,0.22)" : "rgba(170,215,225,0.34)", { lw: 0.5, wobble: 0, stroke: "rgba(60,90,100,0.35)" });
        if (i % 2 === 0) { const p = P(a[0], a[1], z), q = P(a[0], a[1], z + 0.47); c.strokeStyle = INK; c.lineWidth = 2.4; c.beginPath(); c.moveTo(...p); c.lineTo(...q); c.stroke(); c.strokeStyle = "#a3abb0"; c.lineWidth = 1.1; c.stroke(); }
        if (i % 3 === 0) { const p = P((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z + 0.24); c.strokeStyle = "rgba(255,255,255,0.7)"; c.lineWidth = 1; c.beginPath(); c.moveTo(p[0] - 4, p[1] + 3); c.lineTo(p[0] + 2, p[1] - 4); c.stroke(); }
        const p = P(a[0], a[1], z + 0.47), q = P(b[0], b[1], z + 0.47); c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 3.2; c.beginPath(); c.moveTo(...p); c.lineTo(...q); c.stroke(); c.strokeStyle = "#eef1f2"; c.lineWidth = 1.7; c.stroke();
        const p2 = P(a[0], a[1], z + 0.03), q2 = P(b[0], b[1], z + 0.03); c.strokeStyle = "rgba(70,80,85,0.65)"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(...p2); c.lineTo(...q2); c.stroke();
      });
    }
  }
}
// curved stair hugging the ring's outer edge, from deck (thTop) down to the ground (thBot)
function ringStair(k, thTop, thBot) {
  const n = 11, r0 = 0.03, r1 = 0.45, z = DECK, sh = DECK / n;
  const pt = (th, off) => { const x = Math.cos(th) * RA, y = Math.sin(th) * RB, nx = x / (RA * RA), ny = y / (RB * RB), L = Math.hypot(nx, ny); return [x + nx / L * off, y + ny / L * off]; };
  const th = (i) => lerp(thTop, thBot, i / n), zAt = (i) => z * (1 - i / n);
  const blocks = [];
  for (let i = 0; i < n; i++) { const m = fromR(...pt((th(i) + th(i + 1)) / 2, (r0 + r1) / 2)); blocks.push({ q: ccw([pt(th(i), r0), pt(th(i), r1), pt(th(i + 1), r1), pt(th(i + 1), r0)]), h: zAt(i), d: m[0] + m[1] }); }
  const dmax = Math.max(...blocks.map((b) => b.d));
  const c = k.ctx;
  const stringer = (off, col) => {
    const pts = Array.from({ length: n + 1 }, (_, i) => fromR(...pt(th(i), off)));
    for (let i = 0; i < n; i++) k.poly([[...pts[i], zAt(i) + 0.02], [...pts[i + 1], zAt(i + 1) + 0.02], [...pts[i + 1], Math.max(0, zAt(i + 1) - sh * 1.6)], [...pts[i], Math.max(0, zAt(i) - sh * 1.6)]], col, { lw: 0.8, wobble: 0, stroke: shade(col, -0.2) });
    return pts;
  };
  const rail = (pts) => {
    for (let i = 0; i < n; i++) k.poly([[...pts[i], zAt(i)], [...pts[i + 1], zAt(i + 1)], [...pts[i + 1], zAt(i + 1) + 0.44], [...pts[i], zAt(i) + 0.44]], "rgba(165,215,225,0.33)", { lw: 0.5, wobble: 0, stroke: "rgba(60,90,100,0.4)" });
    for (let i = 0; i <= n; i += 2) { const p = P(...pts[i], zAt(i)), q = P(...pts[i], zAt(i) + 0.47); c.strokeStyle = INK; c.lineWidth = 2.2; c.beginPath(); c.moveTo(...p); c.lineTo(...q); c.stroke(); c.strokeStyle = "#a3abb0"; c.lineWidth = 1; c.stroke(); }
    const top = pts.map(([u, v], i) => P(u, v, zAt(i) + 0.47));
    c.strokeStyle = INK; c.lineWidth = 3; c.lineCap = "round"; c.beginPath(); top.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.stroke(); c.strokeStyle = "#eef1f2"; c.lineWidth = 1.6; c.stroke();
  };
  k.q(dmax + 0.3, () => {
    // support posts under the flight
    for (const i of [3, 7]) { const m = fromR(...pt(th(i), (r0 + r1) / 2)), [x, y0] = P(m[0], m[1], 0), [, y1] = P(m[0], m[1], zAt(i) - sh * 1.4); c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke(); c.strokeStyle = "#e6dccb"; c.lineWidth = 3.6; c.stroke(); k.ell(m[0] + 0.1, m[1] + 0.04, 0, 0.12, "rgba(60,45,30,0.15)", { stroke: false }); }
    const inner = stringer(r0, "#d9cfbf"); rail(inner);
    [...blocks].sort((a, b) => a.d - b.d).forEach((b, j) => blockR(k, b.q, b.h - sh, b.h, "#e9dcc5", { lw: 0.7, top: j % 2 ? "#f4e8d3" : "#f7ecd9" }));
    const outer = stringer(r1, "#f4efe6"); rail(outer);
  });
}

// ---------- fountain ----------
function fountainBasin(k, t) {
  const c = k.ctx, E = (a, b, n = 64) => ellipsePts(FC[0], FC[1], a, b, n);
  k.ground(E(FA + 0.18, FB + 0.12), "#d9ccb2", { lw: 1.2 });
  // rim wall (front half visible)
  const rim = E(FA, FB), h = 0.16;
  for (let i = 0; i < rim.length; i++) { const a = rim[i], b = rim[(i + 1) % rim.length]; const [, ay] = toR(...a); if (ay < toR(...FC)[1]) continue; k.poly([[a[0], a[1], 0], [b[0], b[1], 0], [b[0], b[1], h], [a[0], a[1], h]], "#e9dfcb", { lw: 0.6, wobble: 0, stroke: "#c9bca2" }); }
  k.poly(E(FA, FB).map(([u, v]) => [u, v, h]), "#efe6d4", { lw: 1.3, wobble: 0 });
  k.water(E(FA - 0.12, FB - 0.08), { color: "#74c3cf", seed: 4, density: 2.6, flow: 0.3, z: h - 0.04 });
  // tiled floor shimmer + ripple rings from the jets
  c.save(); tracePts(c, E(FA - 0.12, FB - 0.08).map(([u, v]) => P(u, v, h - 0.04))); c.clip();
  const [fx, fy] = P(FC[0], FC[1], h);
  const g = c.createRadialGradient(fx, fy, 4, fx, fy, 90); g.addColorStop(0, "rgba(220,250,250,0.45)"); g.addColorStop(1, "rgba(40,120,140,0.2)"); c.fillStyle = g; c.fillRect(fx - 100, fy - 40, 200, 80);
  c.strokeStyle = "rgba(255,255,255,0.75)"; c.lineWidth = 1.1;
  for (let i = 0; i < 3; i++) { const ph = (t * 0.45 + i / 3) % 1; c.globalAlpha = 1 - ph; c.beginPath(); c.ellipse(fx, fy, 8 + ph * 70, (8 + ph * 70) * 0.32, 0, 0, 7); c.stroke(); }
  for (let a = 0; a < 8; a++) { const th = (a / 8) * 6.283 + 0.4, [x, y] = P(...ellipsePts(FC[0], FC[1], 0.95, 0.52, 1, th)[0], h); const ph = (t * 0.9 + a * 0.13) % 1; c.globalAlpha = 1 - ph; c.beginPath(); c.ellipse(x, y, 3 + ph * 10, (3 + ph * 10) * 0.35, 0, 0, 7); c.stroke(); }
  c.globalAlpha = 1; c.restore();
}
function jets(k, t) {
  const c = k.ctx, z0 = 0.12;
  const jet = (u1, v1, hgt, spd, n, ph, sz) => {
    c.strokeStyle = "rgba(225,247,252,0.65)"; c.lineWidth = sz * 1.1; c.lineCap = "round"; c.beginPath();
    for (let j = 0; j <= 12; j++) { const s = j / 12, z = z0 + 4 * hgt * s * (1 - s); const p = P(lerp(FC[0], u1, s * 0.5 + 0.5), lerp(FC[1], v1, s * 0.5 + 0.5), z); j ? c.lineTo(...p) : c.moveTo(...p); }
    c.stroke();
    for (let i = 0; i < n; i++) { const s = (t * spd + i / n + ph) % 1, z = z0 + 4 * hgt * s * (1 - s); const p = P(lerp(FC[0], u1, s * 0.5 + 0.5), lerp(FC[1], v1, s * 0.5 + 0.5), z); c.fillStyle = `rgba(245,253,255,${0.5 + 0.45 * (1 - s)})`; c.beginPath(); c.arc(p[0], p[1], sz * (1.1 - s * 0.4), 0, 7); c.fill(); }
  };
  // ring of 8 vertical jets
  const ringJ = ellipsePts(FC[0], FC[1], 0.95, 0.52, 8, 0.4);
  for (const [i, [u, v]] of ringJ.entries()) {
    const hh = 0.7 + 0.18 * Math.sin(t * 2.2 + i * 0.8), p0 = P(u, v, z0), p1 = P(u, v, z0 + hh);
    c.strokeStyle = "rgba(230,248,252,0.85)"; c.lineWidth = 2.6; c.lineCap = "round"; c.beginPath(); c.moveTo(...p0); c.lineTo(...p1); c.stroke();
    c.strokeStyle = "rgba(255,255,255,0.95)"; c.lineWidth = 1; c.beginPath(); c.moveTo(p0[0] - 0.5, p0[1]); c.lineTo(p1[0] - 0.5, p1[1]); c.stroke();
    for (let d = 0; d < 4; d++) { const s = (t * 1.6 + d / 4 + i * 0.1) % 1, ang = (d - 1.5) * 0.9; c.fillStyle = `rgba(245,253,255,${0.85 - s * 0.6})`; c.beginPath(); c.arc(p1[0] + Math.sin(ang) * s * 7, p1[1] - 2 + s * s * 14 - s * 6, 1.5, 0, 7); c.fill(); }
  }
  // inner arcing jets
  for (let a = 0; a < 6; a++) { const th = (a / 6) * 6.283; jet(...ellipsePts(FC[0], FC[1], 0.6, 0.34, 1, th)[0], 0.55, 1.1, 4, a * 0.17, 1.6); }
  // tall central plume, breathing
  const H = 1.75 + 0.22 * Math.sin(t * 1.3) + 0.08 * Math.sin(t * 4.1), [x0, y0] = P(FC[0], FC[1], z0), [, yT] = P(FC[0], FC[1], z0 + H);
  const g = c.createLinearGradient(0, yT, 0, y0); g.addColorStop(0, "rgba(255,255,255,0.95)"); g.addColorStop(1, "rgba(200,238,246,0.75)");
  c.fillStyle = g; c.beginPath(); c.moveTo(x0 - 6, y0); c.quadraticCurveTo(x0 - 3.5, (y0 + yT) / 2, x0 - 2, yT + 4); c.quadraticCurveTo(x0, yT - 4, x0 + 2, yT + 4); c.quadraticCurveTo(x0 + 3.5, (y0 + yT) / 2, x0 + 6, y0); c.closePath(); c.fill();
  c.strokeStyle = "rgba(150,200,215,0.6)"; c.lineWidth = 0.8; c.stroke();
  for (let i = 0; i < 16; i++) { const s = (t * 0.9 + i / 16) % 1, sp = (hash(i * 3.1) - 0.5) * 2, x = x0 + sp * (4 + s * 20), y = yT + 2 + s * s * 50 - s * 8; c.fillStyle = `rgba(245,253,255,${0.9 - s * 0.7})`; c.beginPath(); c.arc(x, y, 2 - s, 0, 7); c.fill(); }
  // mist sparkle
  const sp = (t * 0.7) % 1; if (sp < 0.3) glint(c, x0 + 6, yT + 20, 4 * Math.sin((sp / 0.3) * Math.PI) + 1);
}

// ---------- ground ----------
function ground(k, t) {
  const c = k.ctx;
  k.groundTrace({ lawn: [[[0.08, 0.08], [9.92, 0.08], [9.92, 9.92], [0.08, 9.92]]], water: [] }, { lawn: "#a0c45e", paved: "#ecdcc3", side: "#e6d4b0", tufts: 8 });
  // mown-stripe darker tone patches for depth
  c.save(); tracePts(c, [P(0, 0), P(10, 0), P(10, 10), P(0, 10)]); c.clip();
  const R = rng(17); for (let i = 0; i < 40; i++) { const u = R() * 10, v = R() * 10, [x, y] = P(u, v); c.fillStyle = R() < 0.5 ? "rgba(70,110,40,0.1)" : "rgba(255,255,210,0.1)"; c.beginPath(); c.ellipse(x, y, 20 + R() * 30, 7 + R() * 9, 0, 0, 7); c.fill(); }
  c.restore();
  const PAVE = "#ecd8bf", EDGE = "#c9b190";
  const strip = (pts, w) => { const ptsUV = pts.map(([x, y]) => fromR(x, y)); k.path2ground(ptsUV, w + 0.08, EDGE); k.path2ground(ptsUV, w, PAVE); for (const p of ptsUV) k.ell(p[0], p[1], 0, w * 0.5, PAVE, { stroke: false }); };
  // paths: fountain spokes, under the ring, front walkway
  strip([[-1.55, -0.55], [-2.2, 0.15], [-2.8, 1.0], [-3.2, 1.65]], 0.55);
  strip([[1.95, -0.6], [2.6, -0.35], [3.35, 0.0], [4.2, 0.4]], 0.5);
  strip([[0.14, 0.2], [0.0, 0.9], [-0.25, 1.7], [-0.45, 2.55], [-0.5, 3.4]], 0.55);
  strip([[-1.4, -1.25], [-2.3, -1.4], [-3.1, -1.25]], 0.45);
  strip([[1.7, -1.3], [2.5, -1.55], [3.3, -1.45]], 0.45);
  strip(WALK_R, 0.5);
  // stair landings
  strip([[STAIR_X[0] + 0.1, STAIR_Y1 + 0.05], [STAIR_X[1] - 0.1, STAIR_Y1 + 0.05]], 0.5);
  // fountain apron (annulus)
  k.ground(ellipsePts(FC[0], FC[1], 2.2, 1.24, 64), EDGE, { stroke: false });
  k.ground(ellipsePts(FC[0], FC[1], 2.14, 1.19, 64), PAVE, { lw: 1, stroke: EDGE });
  c.save(); tracePts(c, ellipsePts(FC[0], FC[1], 2.14, 1.19, 64).map(([u, v]) => P(u, v))); c.clip();
  c.strokeStyle = "rgba(170,130,95,0.3)"; c.lineWidth = 0.7; c.beginPath();
  for (let i = 0; i < 36; i++) { const th = (i / 36) * 6.283, a = P(...ellipsePts(FC[0], FC[1], FA + 0.2, FB + 0.13, 1, th)[0]), b = P(...ellipsePts(FC[0], FC[1], 2.14, 1.19, 1, th)[0]); c.moveTo(...a); c.lineTo(...b); }
  c.stroke(); c.beginPath(); ellipsePts(FC[0], FC[1], 1.78, 0.98, 64).forEach(([u, v], i) => { const p = P(u, v); i ? c.lineTo(...p) : c.moveTo(...p); }); c.closePath(); c.strokeStyle = "rgba(214,140,150,0.45)"; c.lineWidth = 2; c.stroke();
  c.restore();
  // shadow of the ring deck on the lawn
  c.save(); c.fillStyle = "rgba(50,60,30,0.12)"; c.beginPath();
  const so = [0.32, 0.1];
  for (const s of SEGS) { const q = [s.o0, s.o1, s.i1, s.i0].map(([u, v]) => P(u + so[0], v + so[1])); c.moveTo(...q[0]); q.slice(1).forEach((p) => c.lineTo(...p)); c.closePath(); }
  c.fill(); c.restore();
  k.stipple([[0, 0], [10, 0], [10, 10], [0, 10]], { density: 4, seed: 7 });
}

// ---------- people helpers ----------
function laneLoop(off, clampY) {
  const out = [];
  for (let i = 0; i < 96; i++) {
    const th = (i / 96) * 6.283; let x = Math.cos(th) * (RA - DW / 2 + off), y = Math.sin(th) * (RB - DW / 2 + off);
    if (y < 0 && Math.abs(x - TR[0]) < 1.75) { const w = 1 - ((x - TR[0]) / 1.75) ** 2; y = Math.max(y, lerp(y, clampY, Math.min(1, w * 2.2))); }
    out.push(fromR(x, y));
  }
  return out;
}
function stairWalker(k, seed, offset, xLane, up) {
  // up/down the grand stair: z follows the steps
  const side = up ? -1 : 1, path = [fromR(xLane + side * 1.0, STAIR_Y1 + 0.06), fromR(xLane + side * 0.35, STAIR_Y1 + 0.06), fromR(xLane, STAIR_Y1 - 0.02), fromR(xLane, STAIR_Y0()), fromR(xLane, STAIR_Y0() - 0.4)];
  const st = k.walkerState(path, { speed: 0.32, offset, dwell: 1.4 });
  const [, y] = toR(st.u, st.v), s = clamp((y - STAIR_Y1) / (STAIR_Y0() - STAIR_Y1)), z = Math.ceil(s * NSTEP - 0.15) / NSTEP * DECK;
  const onStair = y < STAIR_Y1 + 0.03 && y > STAIR_Y0() - 0.05, sd = STAIR_Y1 * SQ2 + RC[0] + RC[1] + 0.1;
  k.q(onStair ? sd + 0.01 : st.u + st.v + 0.02, () => k.person(st.u, st.v, { z, dir: [st.du, st.dv], pose: st.moving ? "walk" : "stand", p: st.p, seed }));
}

export default function draw(k, t) {
  const c = k.ctx;
  ground(k, t);
  fountainBasin(k, t);
  k.q(FC[0] + FC[1] + FB * SQ2 + 0.2, () => jets(k, t));

  skyline(k, t);

  // ---------- plaza + tower ----------
  k.q(6.3, () => plaza(k, t));
  k.q(6.6, () => TOWER.drawBack(k, t));
  k.q(7.9, () => TOWER.draw(k, t));
  // plaza balustrade (between the ring arms, broken by the grand stair)
  {
    const xs = [], n = 26, xa = TR[0] - 1.02, xb = TR[0] + 1.06;
    for (let i = 0; i <= n; i++) xs.push(lerp(xa, xb, i / n));
    const runL = xs.filter((x) => x <= STAIR_X[0] - 0.13).map((x) => fromR(x, plazaFront(x) - 0.03));
    const runR = xs.filter((x) => x >= STAIR_X[1] + 0.13).map((x) => fromR(x, plazaFront(x) - 0.03));
    for (const run of [runL, runR]) { const d = Math.min(...run.map(([u, v]) => u + v)); k.q(d + 0.05, () => balustrade(k, run, DECK)); }
  }
  k.q(STAIR_Y1 * SQ2 + RC[0] + RC[1] + 0.1, () => grandStair(k));

  // ---------- ring ----------
  ring(k, t);
  ringStair(k, 1.74, 2.0);
  ringStair(k, 1.4, 1.1);

  // ---------- trees, beds, lamps, benches ----------
  const T = (u, v, o) => k.q(u + v + 0.5, () => k.tree(u, v, o));
  const B = (u, v, o) => k.q(u + v + 0.4, () => blossom(k, u, v, o));
  // back band between the skyline and the plaza
  T(1.9, 4.2, { r: 0.5, h: 1.15, seed: 1, col: "#8bb455" }); T(1.55, 5.45, { r: 0.55, h: 1.2, seed: 2 }); T(2.35, 6.3, { r: 0.5, h: 1.0, seed: 3, col: "#9cc25c" }); T(2.4, 3.2, { r: 0.45, h: 1.05, seed: 4 });
  T(4.35, 1.85, { r: 0.5, h: 1.15, seed: 5 }); T(5.6, 1.6, { r: 0.55, h: 1.2, seed: 6, col: "#8bb455" }); T(6.35, 2.45, { r: 0.5, h: 1.0, seed: 7, col: "#9cc25c" }); T(3.2, 2.35, { r: 0.45, h: 1.05, seed: 8, col: "#9cc25c" });
  T(5.35, 3.05, { r: 0.45, h: 0.9, seed: 9 }); T(3.0, 5.35, { r: 0.42, h: 0.85, seed: 10, col: "#8bb455" });
  // trees behind the tower legs
  T(2.15, 2.1, { r: 0.55, h: 1.3, seed: 47, col: "#9cc25c" }); T(2.9, 1.55, { r: 0.5, h: 1.2, seed: 48 }); T(1.55, 2.95, { r: 0.5, h: 1.2, seed: 49 });
  // tree row hiding the skyline bases (as in the painting)
  T(1.35, 5.95, { r: 0.6, h: 1.3, seed: 41 }); T(1.2, 6.95, { r: 0.65, h: 1.35, seed: 42, col: "#9cc25c" }); T(1.6, 7.75, { r: 0.55, h: 1.2, seed: 43 }); T(1.75, 4.9, { r: 0.5, h: 1.15, seed: 44, col: "#9cc25c" });
  T(6.1, 1.3, { r: 0.55, h: 1.25, seed: 45, col: "#9cc25c" }); T(7.0, 1.0, { r: 0.6, h: 1.35, seed: 46 });
  // corner trees (left, right, front)
  T(0.55, 9.3, { r: 0.85, h: 1.8, seed: 11 }); T(0.9, 8.35, { r: 0.75, h: 1.7, seed: 12, col: "#8bb455" }); T(0.45, 7.45, { r: 0.6, h: 1.4, seed: 13, col: "#9cc25c" });
  T(9.2, 0.45, { r: 0.85, h: 1.8, seed: 14 }); T(8.25, 0.95, { r: 0.75, h: 1.7, seed: 15, col: "#8bb455" }); T(9.45, 1.6, { r: 0.6, h: 1.4, seed: 16, col: "#9cc25c" }); T(7.35, 1.6, { r: 0.55, h: 1.3, seed: 17 });
  T(8.95, 9.3, { r: 0.85, h: 1.75, seed: 18 }); T(9.45, 6.5, { r: 0.55, h: 1.3, seed: 19, col: "#9cc25c" }); T(6.3, 9.45, { r: 0.55, h: 1.3, seed: 20, col: "#9cc25c" });
  // inside the ring
  T(6.7, 7.05, { r: 0.6, h: 1.25, seed: 21 }); T(5.25, 4.1, { r: 0.5, h: 0.95, seed: 22, col: "#8bb455" });
  B(3.15, 5.75, { r: 0.6, h: 0.75, seed: 31 }); B(3.95, 5.55, { r: 0.55, h: 0.7, seed: 32, col: "#f4b3cd" }); B(7.45, 6.2, { r: 0.68, h: 1.05, seed: 33 }); B(5.85, 7.55, { r: 0.5, h: 0.9, seed: 34, col: "#f4b3cd" });
  B(8.05, 2.75, { r: 0.55, h: 1.0, seed: 35 }); B(2.75, 8.05, { r: 0.55, h: 1.0, seed: 36, col: "#f4b3cd" });
  k.q(4.14 + 7.69 + 0.6, () => willow(k, 4.14, 7.69, 1.95, 2, t));
  k.q(6.82 + 4.04 + 0.6, () => willow(k, 6.82, 4.04, 1.95, 3, t));
  // shrubs and flowering bushes
  const FL1 = ["#f08bb5", "#ffffff", "#f4c542"], FL2 = ["#b07ad6", "#f08bb5", "#ffffff"], FL3 = ["#f4c542", "#e9813c", "#ffffff"];
  [[4.7, 6.6, 0.3, FL1], [5.2, 7.2, 0.26, FL2], [7.0, 5.0, 0.3, FL1], [6.4, 4.6, 0.25, FL3], [3.6, 6.7, 0.28, FL2], [4.0, 4.5, 0.3, FL3], [6.1, 3.2, 0.27, FL2], [7.8, 4.7, 0.28, FL1], [8.4, 5.6, 0.3, FL2], [5.0, 8.6, 0.28, FL1], [3.2, 7.3, 0.28, FL3], [6.9, 8.0, 0.3, FL2], [2.4, 7.2, 0.27, FL1], [7.6, 3.4, 0.26, FL3],
    [1.4, 6.5, 0.32, FL1], [1.9, 7.4, 0.3, FL2], [6.6, 1.3, 0.3, FL1], [7.4, 2.4, 0.28, FL2], [3.6, 9.2, 0.3, FL3], [9.2, 3.8, 0.3, FL3], [8.3, 8.4, 0.3, FL1], [7.4, 9.0, 0.28, FL2], [9.1, 7.6, 0.28, FL2]]
    .forEach(([u, v, r, f], i) => k.q(u + v + 0.3, () => bush(k, u, v, r, i % 2 ? "#79a84c" : "#86b257", 70 + i, f)));
  // denser understorey inside the ring (the painting is packed with flowering shrubs)
  { const R2 = rng(808), F = [FL1, FL2, FL3]; for (let i = 0; i < 60; i++) { const th = R2() * 6.283, rr = 0.25 + R2() * 0.7; const x = Math.cos(th) * (RA - DW - 0.25) * rr, y = Math.sin(th) * (RB - DW - 0.2) * rr; const [u, v] = fromR(x, y); const [fx, fy] = toR(...FC); if (((x - fx) / 2.35) ** 2 + ((y - fy) / 1.32) ** 2 < 1) continue; if (inPlaza(x, y, 0.35)) continue; if (Math.abs(x - (STAIR_X[0] + STAIR_X[1]) / 2) < 0.8 && y < STAIR_Y1 + 0.3) continue; const onPath = [[-2.2, 0.15], [-2.8, 1.0], [2.6, -0.35], [0.0, 0.9], [-0.25, 1.7], [-2.3, -1.4], [2.5, -1.55]].some(([a, b]) => Math.hypot(a - x, b - y) < 0.5); if (onPath) continue; k.q(u + v + 0.3, () => bush(k, u, v, 0.16 + R2() * 0.12, R2() < 0.5 ? "#79a84c" : "#8bb85a", 300 + i, R2() < 0.75 ? F[i % 3] : null)); } }
  // flower beds along the front edges and round the fountain apron
  k.q(17.8, () => k.flowerCurve([[3.0, 9.72], [4.2, 9.78], [5.4, 9.7], [6.6, 9.76], [7.8, 9.7]], 0.34, { seed: 51, cols: ["#e8607a", "#f4c542", "#f39ac0", "#ffffff", "#b07ad6"] }));
  k.q(17.8, () => k.flowerCurve([[9.72, 2.8], [9.78, 4.0], [9.7, 5.2], [9.76, 6.4], [9.7, 7.6]], 0.34, { seed: 52, cols: ["#f4c542", "#f08bb5", "#ffffff", "#e8607a", "#b07ad6"] }));
  k.q(19.2, () => k.flowerCurve([[8.2, 9.75], [9.0, 9.7], [9.7, 9.0], [9.75, 8.2]], 0.34, { seed: 53 }));
  k.q(10.8, () => k.flowerCurve(ellipsePts(FC[0], FC[1], 2.45, 1.4, 14, 0.25).slice(0, 6), 0.3, { seed: 54, cols: ["#f08bb5", "#ffffff", "#f4c542"] }));
  k.q(9.9, () => k.flowerCurve(ellipsePts(FC[0], FC[1], 2.45, 1.4, 14, 3.4).slice(0, 5), 0.3, { seed: 55, cols: ["#b07ad6", "#f08bb5", "#ffffff"] }));
  // lamps: ground + on the deck + plaza
  const LMP = (u, v, z) => k.q(u + v + 0.25, () => parkLamp(k, u, v, z));
  LMP(3.36, 8.58, 0); LMP(8.15, 3.48, 0); LMP(8.97, 2.2, 0); LMP(0.95, 8.0, 0); LMP(6.2, 9.0, 0); LMP(5.4, 4.0, 0);
  { const deckLamp = (th) => { const [u, v] = ringPt(th, RA - 0.05, RB - 0.05); LMP(u, v, DECK); }; deckLamp(1.95); deckLamp(1.2); deckLamp(2.75); deckLamp(0.45); deckLamp(3.6); deckLamp(5.7); }
  { const [u, v] = fromR(TR[0] - 1.45, TR[1] + 0.55); LMP(u, v, DECK); const [u2, v2] = fromR(TR[0] + 1.5, TR[1] + 0.55); LMP(u2, v2, DECK); }
  // benches
  const BEN = (u, v, along) => k.q(u + v + 0.3, () => k.bench(u, v, { along }));
  BEN(7.3, 3.6, "v"); BEN(7.75, 9.55, "u"); BEN(9.5, 7.15, "v"); BEN(3.8, 8.2, "u");

  // ---------- life ----------
  // skywalk: two lanes each way, people at deck height
  const laneA = laneLoop(0.11, TR[1] + TB * 0.92 - 0.2), laneB = laneLoop(-0.11, TR[1] + TB * 0.92 - 0.42);
  const deck = (pts, off, seed, sp, extra) => { const st = k.walkerState(pts, { loop: true, speed: sp, offset: off }); const [x, y] = toR(st.u, st.v), near = y > 0; const d = st.u + st.v + (near ? 0.05 : 0.05); k.q(d, () => k.walker(pts, { loop: true, speed: sp, offset: off, seed, z: DECK, ...(extra || {}) })); };
  [[0.0, 101], [0.07, 102], [0.16, 103], [0.27, 104], [0.33, 105], [0.45, 106], [0.56, 107], [0.63, 108], [0.74, 109], [0.86, 110], [0.93, 111]].forEach(([o, s]) => deck(laneA, o, s, 0.36 + (s % 3) * 0.02));
  const laneBr = [...laneB].reverse();
  [[0.03, 121], [0.12, 122, { kid: true }], [0.22, 123], [0.36, 124], [0.47, 125], [0.58, 126], [0.69, 127], [0.8, 128], [0.9, 129]].forEach(([o, s, ex]) => deck(laneBr, o, s, 0.34 + (s % 3) * 0.02, ex));
  // people pausing at the rail looking at the fountain, taking photos
  const railP = (th, off, o) => { const [u, v] = ringPt(th, RA - DW / 2 + off, RB - DW / 2 + off); k.qperson(u, v, { z: DECK, ...o }); };
  railP(2.35, -0.3, { pose: "photo", dir: [0.6, -0.5], seed: 141 }); railP(2.43, -0.3, { pose: "wave", dir: [0.5, -0.6], seed: 142, kid: true });
  railP(0.8, -0.3, { pose: "stand", dir: [-0.5, -0.6], seed: 143 }); railP(1.62, 0.3, { pose: "photo", dir: [0.1, 1], seed: 144 });
  // plaza visitors
  { const P2 = (x, y, o) => { const [u, v] = fromR(TR[0] + x, TR[1] + y); k.qperson(u, v, { z: DECK, ...o }); };
    P2(-0.9, 0.95, { pose: "photo", dir: [-0.6, -0.6], seed: 151 }); P2(-0.75, 1.02, { pose: "wave", dir: [-0.5, -0.7], seed: 152 }); P2(1.05, 0.85, { pose: "stand", dir: [-0.7, -0.4], seed: 153 }); P2(0.6, 1.05, { pose: "photo", dir: [-0.6, -0.6], seed: 154 }); P2(-0.35, 1.18, { pose: "stand", dir: [0.6, 0.6], seed: 155, kid: true }); }
  stairWalker(k, 161, 0.0, STAIR_X[0] + 0.25, true); stairWalker(k, 162, 0.5, STAIR_X[1] - 0.25, false); stairWalker(k, 163, 0.25, (STAIR_X[0] + STAIR_X[1]) / 2, true);
  // garden walkers on the paths
  const RT = {
    fount: ellipsePts(FC[0], FC[1], 1.86, 1.03, 40),
    left: [[-1.6, -0.5], [-2.2, 0.15], [-2.8, 1.0], [-3.15, 1.6]].map(([x, y]) => fromR(x, y)),
    right: [[1.95, -0.6], [2.6, -0.35], [3.3, -0.02]].map(([x, y]) => fromR(x, y)),
    front: [[0.1, 0.3], [0.0, 0.9], [-0.25, 1.7], [-0.45, 2.55], [-0.5, 3.35]].map(([x, y]) => fromR(x, y)),
    walk: WALK_R.map(([x, y]) => fromR(x, y)),
    bl: [[-1.45, -1.25], [-2.3, -1.4], [-3.0, -1.27]].map(([x, y]) => fromR(x, y)),
    br: [[1.75, -1.3], [2.5, -1.55], [3.2, -1.46]].map(([x, y]) => fromR(x, y)),
  };
  for (const [o, s, dirn] of [[0, 171, 1], [0.33, 172, 1], [0.66, 173, -1], [0.15, 174, -1]]) { const pts = dirn > 0 ? RT.fount : [...RT.fount].reverse(); const st = k.walkerState(pts, { loop: true, speed: 0.38, offset: o }); k.q(st.u + st.v, () => k.walker(pts, { loop: true, speed: 0.38, offset: o, seed: s })); }
  for (const [r, o, s] of [["left", 0.1, 181], ["left", 0.6, 182], ["right", 0.3, 183], ["front", 0.2, 184], ["front", 0.7, 185], ["walk", 0.05, 186], ["walk", 0.45, 187], ["walk", 0.8, 188], ["bl", 0.4, 189], ["br", 0.2, 190]]) k.qwalker(RT[r], { speed: 0.36 + (s % 4) * 0.03, offset: o, seed: s, dwell: 1.2 + (s % 3) * 0.5 });
  // bench sitters + a kid by the fountain + a tai-chi elder
  k.qperson(7.42, 3.85, { pose: "sit", bench: true, seatZ: 0.2, dir: [-1, 0.1], seed: 191 }); k.qperson(7.42, 4.2, { pose: "sit", bench: true, seatZ: 0.2, dir: [-1, 0.1], seed: 192, gesture: true });
  k.qperson(8.1, 9.68, { pose: "sit", bench: true, seatZ: 0.2, dir: [0.1, 1], seed: 193 }); k.qperson(9.62, 7.5, { pose: "sit", bench: true, seatZ: 0.2, dir: [1, 0.1], seed: 194, gesture: true });
  { const [u, v] = ellipsePts(FC[0], FC[1], FA + 0.3, FB + 0.2, 1, 1.2)[0]; k.qperson(u, v, { pose: Math.sin(t * 0.8) > 0 ? "wave" : "stand", dir: [-0.6, -0.6], seed: 195, kid: true }); }
  { const [u, v] = ellipsePts(FC[0], FC[1], FA + 0.35, FB + 0.22, 1, 2.3)[0]; k.qperson(u, v, { pose: "photo", dir: [0.7, -0.5], seed: 196 }); }
  k.flush();

  // ---------- sky ----------
  k.circlingBird(430, 300, 80, 24, { speed: 0.6, phase: 0 }); k.circlingBird(430, 300, 80, 24, { speed: 0.6, phase: 0.55, size: 0.8 });
  k.circlingBird(600, 120, 60, 18, { speed: -0.5, phase: 2 });
  k.cloud(170, 200, { s: 0.85, phase: 1 }); k.cloud(860, 150, { s: 0.75, phase: 3 }); k.cloud(660, 70, { s: 0.5, phase: 5 });
}

// close-up framing: tilt from the crowd on the grand stair up to the upper sphere
export const camera = { u: 5.0, v: 5.0, z: 5.5, zoom: 1.6, baseU: 4.55, baseV: 4.6, baseZ: 1.5, topZ: 10.5 };
