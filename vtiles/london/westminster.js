// Palace of Westminster + Elizabeth Tower + Victoria Tower, rebuilt on the isometric grid (grid pass).
// Everything is an axis-aligned solid drawn through P(). The river facade is on the LEFT face (v+ side).
//   Victoria Tower   u 0.4-1.9,  v 1.1-2.6   (left end, 7.2 + turrets + flag)
//   Palace range     u 1.9-8.2,  v 0.7-2.5   (steep slate roof, 15 bays, 3 projecting pavilions, Central Tower)
//   Elizabeth Tower  u 8.2-9.4,  v 1.3-2.5   (right end, clock faces on the LEFT and RIGHT faces, hands move)
// Painter order: Victoria, palace (+ Central Tower, pavilions), Elizabeth (nearer = larger u).
import {
  P, INK, shade, lerp, clamp, ST, ST_L, ST_M, ST_D, ST_DD, SL, SL_L, SL_D, GOLD, GOLD_D, GOLD_L, GLASS, RECESS,
  pg, bx, face, gwin, rwin, band, buttress, pyr, pierced, crenels, roofU, dormer, chimney, pyramid, finial, clockOn,
} from "./_g0_0.js";
import { unionFlag } from "./_props.js";

// one gothic wall in bays along a face (windows between pinnacled buttresses)
function wall(k, side, c, a0, a1, zTop, o = {}) {
  const F = face(side, c), dk = side === "R", bw = o.bw ?? 0.42, n = Math.max(1, Math.round((a1 - a0) / bw)), st = (a1 - a0) / n;
  const skip = o.skip || [], inSkip = (a) => skip.some(([x, y]) => a > x + 0.01 && a < y - 0.01);
  band(k, side, c, a0, a1, 1.14, 1.21, ST_L, 0.04);
  if (zTop > 3.0) band(k, side, c, a0, a1, 2.34, 2.4, ST_L, 0.04);
  for (let i = 0; i < n; i++) {
    const a = a0 + (i + 0.5) * st; if (inSkip(a)) continue;
    rwin(k, F, a, 0.4, st * 0.42, 0.52, { dk });
    gwin(k, F, a, 1.38, st * 0.46, zTop - 0.14 - 1.38 - (zTop > 3.0 ? 0.95 : 0), { dk, lit: 0.1, seed: o.seed || 3 });
    if (zTop > 3.0) gwin(k, F, a, 2.46, st * 0.4, zTop - 0.14 - 2.46, { dk, lit: 0.1, seed: (o.seed || 3) + 5 });
  }
  for (let i = 0; i <= n; i++) {
    const a = a0 + i * st; if (inSkip(a)) continue;
    buttress(k, side, c, a, 0.075, 0, zTop + 0.38, { proud: 0.08, pin: 0.3, col: dk ? shade(ST_M, -0.1) : ST_M });
  }
}
// gothic block: body, walls, cornice, pierced parapet (roof is added by the caller)
function block(k, u0, u1, v0, v1, zTop, o = {}) {
  bx(k, u0 - 0.03, u1 + 0.03, v0 - 0.03, v1 + 0.05, 0, 0.18, ST_D, { lw: 0.8 });
  bx(k, u0, u1, v0, v1, 0.18, zTop, o.col || ST);
  wall(k, "L", v1, u0, u1, zTop, { skip: o.skip, seed: o.seed });
  if (o.right !== false) wall(k, "R", u1, v0, v1, zTop, { seed: (o.seed || 3) + 9, bw: 0.45 });
  band(k, "L", v1, u0, u1, zTop - 0.1, zTop, ST_L, 0.07);
  bx(k, u0 - 0.03, u1 + 0.03, v0 - 0.03, v1 + 0.05, zTop, zTop + 0.38, ST_M, { lw: 0.8 });
  pierced(k, "L", v1 + 0.05, u0, u1, zTop, zTop + 0.38, 0.1);
  pierced(k, "R", u1 + 0.03, v0, v1, zTop, zTop + 0.38, 0.1);
  band(k, "L", v1 + 0.05, u0 - 0.03, u1 + 0.03, zTop + 0.34, zTop + 0.4, ST_L, 0.02);
}

// ---------------------------------------------------------------- Victoria Tower
const VU0 = 0.4, VU1 = 1.9, VV0 = 1.1, VV1 = 2.6, VZ = 7.0;
function victoria(k, t) {
  const F = face("L", VV1), cu = (VU0 + VU1) / 2;
  bx(k, VU0 - 0.05, VU1 + 0.05, VV0 - 0.05, VV1 + 0.05, 0, 0.3, ST_D, { lw: 0.8 });
  bx(k, VU0, VU1, VV0, VV1, 0.3, VZ, ST);
  // Sovereign's Entrance: tall pointed arch, recess, niches with statues, rose above
  band(k, "L", VV1, VU0 + 0.18, VU1 - 0.18, 0.3, 0.4, ST_L, 0.07);
  gwin(k, F, cu, 0.4, 0.74, 1.75, { rose: false, sill: false, sur: true });
  k.path([[cu - 0.28, 0.4, 0], [cu + 0.28, 0.4, 0]].map(([a, z]) => P(...F(a, z))).concat([P(...F(cu + 0.28, 1.2)), P(...F(cu - 0.28, 1.2))]), { fill: RECESS, lw: 0.7, wobble: 0 });
  const dk = k.ctx; dk.strokeStyle = "#e8d8a8"; dk.lineWidth = 0.7; dk.beginPath(); dk.moveTo(...P(...F(cu, 0.4))); dk.lineTo(...P(...F(cu, 1.2))); dk.stroke();
  for (const a of [cu - 0.52, cu + 0.52]) { gwin(k, F, a, 0.95, 0.14, 0.52, { rose: false, sur: true, sill: false }); }
  // upper stages: string courses + pairs of tall lancets
  const rows = [[2.35, 0.95], [3.7, 0.95], [5.05, 0.95]];
  for (const [z] of rows) band(k, "L", VV1, VU0, VU1, z - 0.18, z - 0.11, ST_L, 0.05);
  rows.forEach(([z, h], r) => { for (const a of [cu - 0.34, cu + 0.34]) gwin(k, F, a, z, 0.22, h, { lit: 0.12, seed: 11 + r }); });
  rows.forEach(([z, h], r) => { for (const a of [VV0 + 0.35, VV0 + 1.15]) gwin(k, face("R", VU1), a, z, 0.22, h, { dk: true, seed: 21 + r }); });
  // big traceried window stage under the crown
  band(k, "L", VV1, VU0, VU1, 6.0, 6.08, ST_L, 0.05);
  for (const a of [cu - 0.45, cu, cu + 0.45]) gwin(k, F, a, 6.15, 0.26, 0.62, { rose: true, lit: 0.0 });
  // crown: pierced parapet band + crenels
  band(k, "L", VV1, VU0 + 0.3, VU1 - 0.3, 6.78, 7.05, ST_L, 0.07);
  pierced(k, "L", VV1 + 0.07, VU0 + 0.3, VU1 - 0.3, 6.78, 7.05, 0.1);
  band(k, "R", VU1, VV0 + 0.3, VV1 - 0.3, 6.78, 7.05, shade(ST_L, -0.1), 0.07);
  // lead roof + lantern base
  pg(k, [[VU0, VV0, VZ], [VU1, VV0, VZ], [VU1, VV1, VZ], [VU0, VV1, VZ]], "#8a93a4", 0.9);
  bx(k, 1.0, 1.3, 1.7, 2.0, VZ, VZ + 0.3, ST_M, { lw: 0.7 });
  // corner turrets (back to front), each topped with a crocketed pinnacle
  for (const [u, v] of [[VU0, VV0], [VU1 - 0.3, VV0], [VU0, VV1 - 0.3], [VU1 - 0.3, VV1 - 0.3]]) {
    const du = u === VU0 ? -0.04 : 0, dv = v === VV0 ? -0.04 : 0;
    bx(k, u + du, u + 0.3 + (u === VU0 ? 0 : 0.04), v + dv, v + 0.3 + (v === VV0 ? 0 : 0.04), 0.3, VZ + 0.55, ST_M, { lw: 0.8 });
    const uu = u + 0.15, vv = v + 0.15;
    // gablet band + pyramid spire
    bx(k, uu - 0.2, uu + 0.2, vv - 0.2, vv + 0.2, VZ + 0.55, VZ + 0.66, ST_L, { lw: 0.7 });
    pyr(k, uu - 0.16, uu + 0.16, vv - 0.16, vv + 0.16, VZ + 0.66, 0.95, ST_L, { gold: true });
  }
  // corner turret windows (small slits on the two visible faces of the front-left turret)
  for (const z of [1.6, 3.0, 4.4, 5.8]) {
    gwin(k, face("L", VV1 + 0.04), VU0 + 0.17, z, 0.09, 0.42, { sur: false, rose: false, sill: false });
    gwin(k, face("L", VV1 + 0.04), VU1 - 0.17, z, 0.09, 0.42, { sur: false, rose: false, sill: false });
  }
  // flagstaff with the Union flag
  unionFlag(k, 1.15, 1.85, VZ + 0.3, { h: 1.7, w: 1.05, fh: 0.62 });
}

// ---------------------------------------------------------------- Palace range
const PU0 = 1.9, PU1 = 8.2, PV0 = 0.7, PV1 = 2.5, ZE = 2.5, BAY = (PU1 - PU0) / 15;
const PAV = [[PU0 + 2 * BAY, PU0 + 4 * BAY], [PU0 + 6 * BAY, PU0 + 9 * BAY], [PU0 + 11 * BAY, PU0 + 13 * BAY]];
const ZROOF0 = ZE + 0.38, HROOF = 1.15;
const roofZ = (v) => { const vm = (PV0 + PV1) / 2; return ZROOF0 + ((PV1 - v) / (PV1 - vm)) * HROOF; };

function centralTower(k) {
  const cu = (PU[1][0] + PU[1][1]) / 2, cv = 2.0, h = 0.5, z0 = 3.78;
  bx(k, cu - h, cu + h, cv - h, cv + h, z0, 4.95, ST);
  const F = face("L", cv + h), FR = face("R", cu + h);
  band(k, "L", cv + h, cu - h, cu + h, 4.02, 4.08, ST_L, 0.04);
  for (const a of [cu - 0.28, cu, cu + 0.28]) gwin(k, F, a, 4.16, 0.17, 0.62, { rose: true });
  for (const a of [cv - 0.28, cv, cv + 0.28]) gwin(k, FR, a, 4.16, 0.17, 0.62, { dk: true });
  band(k, "L", cv + h, cu - h, cu + h, 4.85, 4.95, ST_L, 0.07);
  for (const [a, b] of [[cu - h, cv + h], [cu + h, cv + h], [cu + h, cv - h]]) pyr(k, a - 0.07, a + 0.07, b - 0.07, b + 0.07, 4.95, 0.55, ST_L, { gold: true });
  bx(k, cu - 0.34, cu + 0.34, cv - 0.34, cv + 0.34, 4.95, 5.45, ST_M);
  for (const a of [cu - 0.15, cu + 0.15]) gwin(k, face("L", cv + 0.34), a, 5.07, 0.14, 0.28, { rose: false, lit: 0 });
  band(k, "L", cv + 0.34, cu - 0.34, cu + 0.34, 5.4, 5.48, ST_L, 0.06);
  pyramid(k, cu - 0.36, cu + 0.36, cv - 0.36, cv + 0.36, 5.48, 1.65, SL, { seams: 6 });
  finial(k, cu, cv, 7.13, 0.55, { cross: true });
}
const PU = PAV;

function palace(k, t) {
  // body, bays, parapet
  block(k, PU0, PU1, PV0, PV1, ZE, { skip: PAV, seed: 3, right: false });
  // steep slate roof with cresting
  roofU(k, PU0, PU1, PV0, PV1 - 0.02, ZROOF0, HROOF, { col: SL, rows: 8 });
  // pinnacle row already stands on the buttresses; lucarnes on the slope
  for (const a of [2.1, 2.5, 3.85, 4.25, 5.85, 6.25, 7.55, 7.85]) { if (!PAV.some(([x, y]) => a > x - 0.1 && a < y + 0.1)) dormer(k, a, 2.12, roofZ(2.12) - 0.02, { w: 0.2, d: 0.2, h: 0.26 }); }
  for (const a of [3.6, 6.2, 7.9]) chimney(k, a, 1.5, ZROOF0 + HROOF - 0.3, 0.55);
  // projecting pavilions (A, Central porch, C): taller, own steep pyramid roofs
  PAV.forEach(([a, b], i) => {
    const central = i === 1, zt = central ? 3.4 : 3.2, v0 = 1.5, v1 = 2.68;
    block(k, a, b, v0, v1, zt, { seed: 40 + i * 7, right: true });
    if (central) { pg(k, [[a, v0, zt + 0.38], [b, v0, zt + 0.38], [b, v1, zt + 0.38], [a, v1, zt + 0.38]], "#8a93a4", 0.8); centralTower(k); return; }
    pyramid(k, a - 0.02, b + 0.02, v0 - 0.02, v1 + 0.05, zt + 0.38, 1.0, SL, { seams: Math.round((b - a) / 0.15) });
    finial(k, (a + b) / 2, (v0 + v1) / 2 + 0.02, zt + 0.38 + 1.0, 0.45);
  });
  // central porch: grand pointed arch door on the front of the middle pavilion
  const [a, b] = PAV[1], F = face("L", 2.68), mid = (a + b) / 2;
  bx(k, mid - 0.34, mid + 0.34, 2.66, 2.78, 0.18, 0.28, ST_D, { lw: 0.8 });
  gwin(k, F, mid, 0.28, 0.56, 1.3, { rose: false, sill: false });
}

// ---------------------------------------------------------------- Elizabeth Tower (Big Ben)
const EU0 = 8.2, EU1 = 9.4, EV0 = 1.3, EV1 = 2.5, ECU = (EU0 + EU1) / 2, ECV = (EV0 + EV1) / 2;
export const BELFRY_Z = 8.1;
function elizabeth(k, t) {
  const FL = face("L", EV1), FR = face("R", EU1);
  bx(k, EU0 - 0.06, EU1 + 0.06, EV0 - 0.06, EV1 + 0.06, 0, 0.3, ST_D, { lw: 0.8 });
  bx(k, EU0, EU1, EV0, EV1, 0.3, 5.4, ST);
  // vertical panel joints on the shaft
  { const c = k.ctx; c.strokeStyle = "rgba(110,78,40,0.3)"; c.lineWidth = 0.8; c.beginPath();
    for (const f of [0.27, 0.73]) { c.moveTo(...P(lerp(EU0, EU1, f), EV1, 0.4)); c.lineTo(...P(lerp(EU0, EU1, f), EV1, 5.3)); c.moveTo(...P(EU1, lerp(EV0, EV1, f), 0.4)); c.lineTo(...P(EU1, lerp(EV0, EV1, f), 5.3)); }
    c.stroke(); }
  // door + slit windows stacked up the shaft, string courses between
  gwin(k, FL, ECU, 0.3, 0.34, 0.8, { rose: false, sill: false });
  for (const z of [1.25, 2.15, 3.05, 3.95, 4.75]) { gwin(k, FL, ECU, z, 0.14, 0.52, { rose: false }); gwin(k, FR, ECV, z, 0.14, 0.52, { rose: false, dk: true }); }
  for (const z of [1.05, 1.95, 2.85, 3.75, 4.55, 5.2]) { band(k, "L", EV1, EU0, EU1, z, z + 0.06, ST_L, 0.04); band(k, "R", EU1, EV0, EV1, z, z + 0.06, shade(ST_L, -0.08), 0.04); }
  // corner buttress strips
  buttress(k, "L", EV1, EU0 + 0.07, 0.14, 0.3, 5.4, { proud: 0.07 }); buttress(k, "L", EV1, EU1 - 0.07, 0.14, 0.3, 5.4, { proud: 0.07 });
  buttress(k, "R", EU1, EV0 + 0.07, 0.14, 0.3, 5.4, { proud: 0.07, col: shade(ST_M, -0.1) });
  // corbelled gallery with pierced parapet and corner pinnacles
  bx(k, EU0 - 0.12, EU1 + 0.12, EV0 - 0.12, EV1 + 0.12, 5.4, 5.6, ST_L, { lw: 0.8 });
  bx(k, EU0 - 0.1, EU1 + 0.1, EV0 - 0.1, EV1 + 0.1, 5.6, 5.88, ST_M, { lw: 0.8 });
  pierced(k, "L", EV1 + 0.1, EU0 - 0.1, EU1 + 0.1, 5.6, 5.88, 0.1);
  pierced(k, "R", EU1 + 0.1, EV0 - 0.1, EV1 + 0.1, 5.6, 5.88, 0.1);
  // clock stage
  bx(k, EU0 - 0.03, EU1 + 0.03, EV0 - 0.03, EV1 + 0.03, 5.88, 7.5, ST);
  band(k, "L", EV1 + 0.03, EU0, EU1, 5.88, 5.98, ST_L, 0.04);
  for (const s of ["L", "R"]) {
    const c = s === "L" ? EV1 + 0.03 : EU1 + 0.03, a = s === "L" ? ECU : ECV, a0 = s === "L" ? EU0 : EV0, F = face(s, c);
    // recessed clock panel + gablet over it
    k.path([F(a0 + 0.06, 5.98), F(a0 + 1.14, 5.98), F(a0 + 1.14, 7.12), F(a0 + 0.06, 7.12)].map((p) => P(...p)), { fill: s === "L" ? shade(ST, -0.08) : shade(ST, -0.26), lw: 0.7, wobble: 0 });
    pg(k, [F(a - 0.52, 7.12), F(a + 0.52, 7.12), F(a, 7.46)], s === "L" ? ST_L : shade(ST_L, -0.15), 0.8);
    k.ctx.fillStyle = GOLD; const [gx, gy] = P(...F(a, 7.3)); k.ctx.beginPath(); k.ctx.arc(gx, gy, 1.6, 0, 7); k.ctx.fill();
  }
  clockOn(k, "L", EV1 + 0.04, ECU, 6.5, 0.46, t, 0);
  clockOn(k, "R", EU1 + 0.04, ECV, 6.5, 0.46, t, 0.37);
  buttress(k, "L", EV1 + 0.03, EU0 + 0.05, 0.1, 5.88, 7.5, { proud: 0.06, pin: 0.4, gold: true });
  buttress(k, "L", EV1 + 0.03, EU1 - 0.05, 0.1, 5.88, 7.5, { proud: 0.06, pin: 0.4, gold: true });
  buttress(k, "R", EU1 + 0.03, EV0 + 0.05, 0.1, 5.88, 7.5, { proud: 0.06, pin: 0.4, gold: true, col: shade(ST_M, -0.1) });
  // cornice + belfry
  bx(k, EU0 - 0.1, EU1 + 0.1, EV0 - 0.1, EV1 + 0.1, 7.5, 7.68, ST_L, { lw: 0.8 });
  bx(k, EU0 + 0.04, EU1 - 0.04, EV0 + 0.04, EV1 - 0.04, 7.68, 8.7, ST_M);
  for (const [s, c, f0] of [["L", EV1 - 0.04, EU0], ["R", EU1 - 0.04, EV0]]) {
    const F = face(s, c), a = s === "L" ? ECU : ECV;
    for (const d of [-0.3, 0, 0.3]) {
      gwin(k, F, a + d, 7.8, 0.22, 0.8, { rose: false, dk: true, lit: 0 });
      const cx = k.ctx; cx.strokeStyle = "rgba(20,28,48,0.55)"; cx.lineWidth = 0.7; cx.beginPath();
      for (let z = 7.88; z < 8.5; z += 0.08) { cx.moveTo(...P(...F(a + d - 0.09, z))); cx.lineTo(...P(...F(a + d + 0.09, z))); }
      cx.stroke();
    }
    band(k, s, c, s === "L" ? EU0 + 0.04 : EV0 + 0.04, s === "L" ? EU1 - 0.04 : EV1 - 0.04, 8.6, 8.7, ST_L, 0.05);
  }
  buttress(k, "L", EV1 - 0.04, EU0 + 0.1, 0.12, 7.68, 8.7, { proud: 0.06, pin: 0.42, gold: true });
  buttress(k, "L", EV1 - 0.04, EU1 - 0.1, 0.12, 7.68, 8.7, { proud: 0.06, pin: 0.42, gold: true });
  buttress(k, "R", EU1 - 0.04, EV0 + 0.1, 0.12, 7.68, 8.7, { proud: 0.06, pin: 0.42, gold: true, col: shade(ST_M, -0.1) });
  // steep slate roof with a row of gilt dormers, lantern stage, tall slim spire, gilt finial
  bx(k, EU0 - 0.02, EU1 + 0.02, EV0 - 0.02, EV1 + 0.02, 8.7, 8.82, ST_L, { lw: 0.8 });
  const RZ = 8.82, RH = 1.45;
  pyramid(k, EU0, EU1, EV0, EV1, RZ, RH, SL, { seams: 8 });
  for (const f of [0.28, 0.72]) { // gilt dormers on the left slope
    const v = lerp(EV1, ECV, 0.32), z = RZ + RH * 0.32;
    dormer(k, lerp(EU0, EU1, f), v, z - 0.02, { w: 0.18, d: 0.12, h: 0.22 });
  }
  { const v = lerp(EV1, ECV, 0.62), z = RZ + RH * 0.62; dormer(k, ECU, v, z - 0.02, { w: 0.16, d: 0.1, h: 0.18 }); }
  const LZ = RZ + RH; // lantern stage
  bx(k, ECU - 0.2, ECU + 0.2, ECV - 0.2, ECV + 0.2, LZ - 0.04, LZ + 0.1, ST_L, { lw: 0.7 });
  bx(k, ECU - 0.14, ECU + 0.14, ECV - 0.14, ECV + 0.14, LZ + 0.1, LZ + 0.42, GOLD, { lw: 0.7 });
  gwin(k, face("L", ECV + 0.14), ECU, LZ + 0.14, 0.12, 0.22, { sur: false, rose: false, sill: false });
  bx(k, ECU - 0.18, ECU + 0.18, ECV - 0.18, ECV + 0.18, LZ + 0.42, LZ + 0.5, ST_L, { lw: 0.7 });
  pyramid(k, ECU - 0.14, ECU + 0.14, ECV - 0.14, ECV + 0.14, LZ + 0.5, 1.1, SL, { seams: 3 });
  finial(k, ECU, ECV, LZ + 1.6, 0.6);
}

export function makeWestminster() {
  return {
    draw(k, t) { victoria(k, t); palace(k, t); elizabeth(k, t); },
    // projected anchor helper: point on the Elizabeth Tower axis
    belfry: () => P(ECU, ECV, 8.4),
  };
}
