// LONDON · St Paul's Cathedral rebuilt on the isometric grid (grid pass).
// Cruciform plan, every wall axis-aligned. The nave runs along v (west front on the LEFT face, v+ side), transepts
// along u, the crossing carries the dome:
//   choir        u 2.9-5.1  v 0.4-1.8   | transepts u 0.9-7.1 v 1.8-3.3 | nave u 2.6-5.4 v 3.3-5.7
//   west front   central block u 3.3-4.7 v 5.2-5.7, towers u 2.3-3.3 / 4.7-5.7 v 4.7-5.7, two-tier portico to v 6.3
//   dome centre  (4.0, 2.55): plinth, peristyle drum, ribbed lead dome, lantern, gold ball + cross
import { P, CTS, INK, shade, lerp, clamp, hash, bx, face, win, wins, niche, course, pil, cornice, balus, column, curvedWall, arcPoly, leadDome, goldBall, cross, pg, ST, ST_L, ST_D, ST_DD, LEAD, LEAD_L, LEAD_D, GL, GD, GOLDC } from "./_g1_0.js";

export const DU = 4.0, DV = 2.55;
const PI = Math.PI;

// ---------- wing roofs ----------
function leadGableU(k, u, v, z, du, dv, h) {          // ridge along u (transept), end gable on the right face
  const r0 = [u, v + dv / 2, z + h], r1 = [u + du, v + dv / 2, z + h];
  pg(k, [[u + du, v, z], [u + du, v + dv, z], r1], shade(LEAD, -0.3), 1);
  pg(k, [[u, v + dv, z], [u + du, v + dv, z], r1, r0], LEAD, 1);
  const c = k.ctx; c.strokeStyle = "rgba(35,38,58,0.3)"; c.lineWidth = 0.7; c.beginPath();
  for (let i = 1; i < 5; i++) { const f = i / 5; c.moveTo(...P(u, v + dv - (dv / 2) * f, z + h * f)); c.lineTo(...P(u + du, v + dv - (dv / 2) * f, z + h * f)); }
  for (let a = u + 0.4; a < u + du; a += 0.4) { c.moveTo(...P(a, v + dv, z)); c.lineTo(...P(a, v + dv / 2, z + h)); }
  c.stroke();
}
function leadGableV(k, u, v, z, du, dv, h) {          // ridge along v (nave)
  const r0 = [u + du / 2, v, z + h], r1 = [u + du / 2, v + dv, z + h];
  pg(k, [[u, v + dv, z], [u + du, v + dv, z], r1], shade(LEAD, -0.12), 1);
  pg(k, [[u + du, v, z], [u + du, v + dv, z], r1, r0], shade(LEAD, -0.22), 1);
  const c = k.ctx; c.strokeStyle = "rgba(35,38,58,0.3)"; c.lineWidth = 0.7; c.beginPath();
  for (let i = 1; i < 5; i++) { const f = i / 5; c.moveTo(...P(u + du - (du / 2) * f, v, z + h * f)); c.lineTo(...P(u + du - (du / 2) * f, v + dv, z + h * f)); }
  for (let a = v + 0.4; a < v + dv; a += 0.4) { c.moveTo(...P(u + du, a, z)); c.lineTo(...P(u + du / 2, a, z + h)); }
  c.stroke();
}

// ---------- choir (behind everything) ----------
function choir(k) {
  const U0 = 2.9, U1 = 5.1, V0 = 0.4, V1 = 1.8, ZT = 2.3;
  bx(k, U0, U1, V0, V1, 0, ZT, ST);
  course(k, "R", U1, V0, V1, 0, ZT, 0.2);
  wins(k, "R", U1, V0 + 0.12, V1 - 0.12, [0.45], 3, 0.17, 0.62, { arch: true, sur: false });
  wins(k, "R", U1, V0 + 0.12, V1 - 0.12, [1.5], 3, 0.15, 0.4);
  cornice(k, U0, U1, V0, V1, ZT, 0.14);
  leadGableU(k, U0, V0, ZT + 0.14, U1 - U0, V1 - V0, 0.5);
}
// ---------- transepts ----------
function transept(k) {
  const U0 = 0.9, U1 = 7.1, V0 = 1.8, V1 = 3.3, ZT = 2.4;
  bx(k, U0, U1, V0, V1, 0, ZT, ST);
  course(k, "L", V1, U0, U1, 0, ZT, 0.2); course(k, "R", U1, V0, V1, 0, ZT, 0.2);
  // left face (v = 3.3): bays of arched windows over square niches
  wins(k, "L", V1, U0 + 0.12, 2.6, [0.45], 3, 0.18, 0.66, { arch: true, sur: false });
  wins(k, "L", V1, 5.4, U1 - 0.12, [0.45], 3, 0.18, 0.66, { arch: true, sur: false });
  wins(k, "L", V1, U0 + 0.12, 2.6, [1.62], 3, 0.16, 0.4);
  wins(k, "L", V1, 5.4, U1 - 0.12, [1.62], 3, 0.16, 0.4);
  for (const a of [U0 + 0.06, 1.75, 5.6, 6.35, U1 - 0.06]) pil(k, "L", V1, a, 0.12, 0, ZT - 0.02);
  // south end wall (right face, u = 7.1): big window over a semicircular porch (drawn later), niches either side
  niche(k, "R", U1, 1.95, 1.0, 0.16, 0.7, { arch: true }); niche(k, "R", U1, 3.15, 1.0, 0.16, 0.7, { arch: true });
  win(k, face("R", U1), 2.55, 1.55, 0.4, 0.7, { arch: true, sur: true });
  win(k, face("R", U1), 2.55, 1.3, 0.34, 0.2, { sur: false });
  for (const a of [V0 + 0.06, 2.2, 2.9, V1 - 0.06]) pil(k, "R", U1, a, 0.12, 0, ZT - 0.02);
  cornice(k, U0, U1, V0, V1, ZT, 0.14);
  leadGableU(k, U0, V0, ZT + 0.14, U1 - U0, V1 - V0, 0.55);
}
function southPorch(k) {
  const cu = 7.1, cv = DV, R = 0.62, Z0 = 0.12, ZC = 1.4;
  // half-round platform + steps
  curvedWall(k, cu, cv, R + 0.15, -PI / 2, PI / 2, 0, Z0 + 0.04, ST_D, 14);
  pg(k, arcPoly(cu, cv, R + 0.15, -PI / 2, PI / 2, Z0 + 0.04), ST_L, 0.9);
  // back wall behind columns already is the end wall; columns on a half circle
  const cols = []; for (let i = 0; i < 7; i++) { const a = -PI / 2 + (i / 6) * PI; cols.push([cu + 0.5 * Math.cos(a), cv + 0.5 * Math.sin(a), a]); }
  cols.sort((p, q) => p[0] + p[1] - (q[0] + q[1]));
  for (const [u, v] of cols) column(k, u, v, Z0 + 0.04, ZC, 0.045);
  // entablature + lead half-roof
  curvedWall(k, cu, cv, 0.6, -PI / 2, PI / 2, ZC, ZC + 0.18, ST_L, 14);
  pg(k, arcPoly(cu, cv, 0.6, -PI / 2, PI / 2, ZC + 0.18), shade(LEAD, 0.08), 0.9);
  pg(k, [...arcPoly(cu, cv, 0.6, -PI / 2, PI / 2, ZC + 0.18, 10), ...arcPoly(cu, cv, 0.22, PI / 2, -PI / 2, ZC + 0.4, 10)], LEAD, 0.9);
}
// ---------- nave ----------
function nave(k) {
  const U0 = 2.6, U1 = 5.4, V0 = 3.3, V1 = 5.7, ZT = 2.2;
  bx(k, U0, U1, V0, V1, 0, ZT, ST);
  // south wall = right face u = 5.4: seven bays, arched windows below, wreath niches / windows above
  course(k, "R", U1, V0, V1, 0, ZT, 0.2);
  const bays = 6, a0 = 3.42, a1 = 5.58, st = (a1 - a0) / bays;
  for (let i = 0; i < bays; i++) {
    const a = a0 + (i + 0.5) * st;
    win(k, face("R", U1), a, 0.42, 0.2, 0.78, { arch: true, sur: true, dk: true, lit: 0.12, seed: i });
    if (i % 2) niche(k, "R", U1, a, 1.46, 0.2, 0.34, {}); else win(k, face("R", U1), a, 1.46, 0.18, 0.4, { dk: true });
  }
  for (let i = 0; i <= bays; i++) pil(k, "R", U1, a0 + i * st, 0.1, 0, ZT - 0.02);
  cornice(k, U0, U1, V0, V1, ZT, 0.14);
  // balustrade along the wall top and a clerestory glimpse
  balus(k, "R", U1 + 0.0, V0, V1, ZT + 0.14, 0.14);
  leadGableV(k, U0 + 0.05, V0, ZT + 0.14, U1 - U0 - 0.1, V1 - V0, 0.55);
}

// ---------- the dome stack ----------
function dome(k, t) {
  const c = k.ctx;
  // square plinth on the crossing
  bx(k, 2.95, 5.05, 1.5, 3.6, 2.0, 3.0, ST);
  course(k, "L", 3.6, 2.95, 5.05, 2.0, 3.0, 0.2); course(k, "R", 5.05, 1.5, 3.6, 2.0, 3.0, 0.2);
  for (const a of [3.25, 4.0, 4.75]) win(k, face("L", 3.6), a, 2.3, 0.18, 0.4, { arch: true, sur: true });
  cornice(k, 2.95, 5.05, 1.5, 3.6, 3.0, 0.1);
  const Z0 = 3.14, ZC = 4.3, RW = 0.9, RC = 0.99;
  // peristyle drum: wall with windows between the 32 columns, then the column ring (front half), entablature
  k.cyl(DU, DV, Z0, RW, ZC - Z0, shade(ST, -0.1), { top: false });
  const NC = 32;
  for (let i = 0; i < NC; i++) {
    const a = ((i + 0.5) / NC) * 2 * PI; if (Math.cos(a) + Math.sin(a) < -0.35) continue;
    const a2 = a, w = PI / NC * 0.9, pts = [[a2 - w, Z0 + 0.25], [a2 + w, Z0 + 0.25], [a2 + w, ZC - 0.22], [a2 - w, ZC - 0.22]].map(([an, z]) => P(DU + RW * Math.cos(an), DV + RW * Math.sin(an), z));
    if (i % 2 === 0) k.path(pts, { fill: GD, lw: 0.5, wobble: 0 });
  }
  const order = []; for (let i = 0; i < NC; i++) { const a = (i / NC) * 2 * PI; if (Math.cos(a) + Math.sin(a) < -0.3) continue; order.push(a); }
  order.sort((p, q) => Math.cos(p) + Math.sin(p) - (Math.cos(q) + Math.sin(q)));
  for (const a of order) {
    const u = DU + RC * Math.cos(a), v = DV + RC * Math.sin(a), tone = 0.5 - 0.5 * Math.cos(a - 0.4);
    k.cyl(u, v, Z0, 0.04, ZC - Z0 - 0.1, shade("#f6e8c8", -0.2 * tone), { top: false });
  }
  k.cyl(DU, DV, ZC - 0.1, 1.04, 0.14, ST_L, { topCol: ST_D });         // entablature
  // balustrade ring + inner attic stage
  k.cyl(DU, DV, ZC + 0.04, 1.0, 0.12, ST, { top: false });
  c.strokeStyle = "#a88e64"; c.lineWidth = 0.9; c.beginPath();
  for (let i = 0; i < 40; i++) { const a = (i / 40) * 2 * PI; if (Math.cos(a) + Math.sin(a) < 0) continue; c.moveTo(...P(DU + 1.0 * Math.cos(a), DV + 1.0 * Math.sin(a), ZC + 0.04)); c.lineTo(...P(DU + 1.0 * Math.cos(a), DV + 1.0 * Math.sin(a), ZC + 0.14)); }
  c.stroke();
  const ZA = ZC + 0.16;
  k.cyl(DU, DV, ZA, 0.86, 0.5, shade(ST, 0.0), { topCol: ST_D });
  for (let i = 0; i < 16; i++) {
    const a = ((i + 0.5) / 16) * 2 * PI; if (Math.cos(a) + Math.sin(a) < -0.2) continue; const w = PI / 16 * 0.55;
    if (i % 2 === 0) k.path([[a - w, ZA + 0.08], [a + w, ZA + 0.08], [a + w, ZA + 0.4], [a - w, ZA + 0.4]].map(([an, z]) => P(DU + 0.86 * Math.cos(an), DV + 0.86 * Math.sin(an), z)), { fill: GD, lw: 0.5, wobble: 0 });
    else k.line3([[DU + 0.86 * Math.cos(a), DV + 0.86 * Math.sin(a), ZA + 0.02], [DU + 0.86 * Math.cos(a), DV + 0.86 * Math.sin(a), ZA + 0.48]], { lw: 1.4, wobble: 0, stroke: ST_L });
  }
  k.cyl(DU, DV, ZA + 0.5, 0.9, 0.1, ST_L, { topCol: ST_D });
  const ZD = ZA + 0.6;
  leadDome(k, DU, DV, ZD, 0.84, 1.55);
  // lantern
  const ZL = ZD + 1.52, LU = DU, LV = DV, h = 0.2;
  k.cyl(LU, LV, ZL - 0.04, 0.3, 0.1, ST_L, { topCol: ST_D });
  bx(k, LU - h, LU + h, LV - h, LV + h, ZL + 0.06, ZL + 0.7, ST, { lw: 0.9 });
  for (const [a0, a1, side, cc] of [[LU - h, LU + h, "L", LV + h], [LV - h, LV + h, "R", LU + h]]) {
    for (let i = 0; i < 3; i++) { const a = lerp(a0, a1, (i + 0.5) / 3); win(k, face(side, cc), a, ZL + 0.2, 0.07, 0.34, { arch: true, sur: false, sill: false, dk: side === "R" }); }
    for (const a of [a0 + 0.01, a1 - 0.01]) pil(k, side, cc, a, 0.05, ZL + 0.06, ZL + 0.7);
  }
  bx(k, LU - 0.25, LU + 0.25, LV - 0.25, LV + 0.25, ZL + 0.7, ZL + 0.8, ST_L, { lw: 0.8 });
  leadDome(k, LU, LV, ZL + 0.8, 0.2, 0.3, { col: GOLDC, ribs: 8, bands: [0.4] });
  goldBall(k, LU, LV, ZL + 1.16, 4.2);
  cross(k, LU, LV, ZL + 1.22, 0.62);
}

// ---------- west towers ----------
function tower(k, U0, U1, lit) {
  const V0 = 4.7, V1 = 5.7, ZT = 3.1, cu = (U0 + U1) / 2, cv = (V0 + V1) / 2;
  bx(k, U0, U1, V0, V1, 0, ZT, ST);
  course(k, "L", V1, U0, U1, 0, ZT, 0.2); course(k, "R", U1, V0, V1, 0, ZT, 0.2);
  // left face (west front): arched door/window, pilasters, windows, clock disc
  win(k, face("L", V1), cu, 0.34, 0.22, 0.8, { arch: true, sur: true });
  win(k, face("L", V1), cu, 1.38, 0.2, 0.5, { sur: true, surCol: ST_L });
  niche(k, "L", V1, U0 + 0.18, 1.1, 0.12, 0.5, { arch: true }); niche(k, "L", V1, U1 - 0.18, 1.1, 0.12, 0.5, { arch: true });
  for (const a of [U0 + 0.05, U0 + 0.3, U1 - 0.3, U1 - 0.05]) pil(k, "L", V1, a, 0.1, 0, ZT - 0.02);
  // right face
  wins(k, "R", U1, V0 + 0.2, V1 - 0.2, [0.34], 3, 0.17, 0.78, { arch: true, sur: true, lit: 0.25, seed: lit });
  wins(k, "R", U1, V0 + 0.2, V1 - 0.2, [1.4], 3, 0.15, 0.5, { sur: true });
  for (const a of [V0 + 0.05, V0 + 0.3, V1 - 0.3, V1 - 0.05]) pil(k, "R", U1, a, 0.1, 0, ZT - 0.02);
  // oculus clock on each face (ellipse in the plane of the wall)
  for (const [side, cc, a] of [["L", V1, cu], ["R", U1, cv]]) {
    const F = face(side, cc), pts = []; for (let i = 0; i < 20; i++) { const th = (i / 20) * 2 * PI; pts.push(P(...F(a + Math.cos(th) * 0.16, 2.35 + Math.sin(th) * 0.16))); }
    const ring = []; for (let i = 0; i < 20; i++) { const th = (i / 20) * 2 * PI; ring.push(P(...F(a + Math.cos(th) * 0.21, 2.35 + Math.sin(th) * 0.21))); }
    k.path(ring, { fill: side === "R" ? shade(ST_L, -0.2) : ST_L, lw: 0.7, wobble: 0 });
    k.path(pts, { fill: side === "R" ? "#cfc6ae" : "#fbf6e6", lw: 0.7, wobble: 0 });
    const c = k.ctx, [x, y] = P(...F(a, 2.35)); c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 0.5, y - 3.4); c.moveTo(x, y); c.lineTo(x + 2.6, y + 0.4); c.stroke();
  }
  cornice(k, U0, U1, V0, V1, ZT, 0.14);
  // second stage: belfry with paired columns in arches
  const u0 = U0 + 0.14, u1 = U1 - 0.14, v0 = V0 + 0.14, v1 = V1 - 0.14, Z1 = ZT + 0.14, Z2 = Z1 + 0.9;
  bx(k, u0, u1, v0, v1, Z1, Z2, ST);
  for (const [side, cc, a0, a1] of [["L", v1, u0, u1], ["R", u1, v0, v1]]) {
    win(k, face(side, cc), (a0 + a1) / 2, Z1 + 0.18, 0.22, 0.58, { arch: true, sur: true, dk: side === "R" });
    for (const a of [a0 + 0.05, (a0 + a1) / 2 - 0.15, (a0 + a1) / 2 + 0.15, a1 - 0.05]) pil(k, side, cc, a, 0.07, Z1, Z2 - 0.02);
  }
  cornice(k, u0, u1, v0, v1, Z2, 0.12);
  // statues on the corners of the first cornice
  for (const [su, sv] of [[U0 + 0.1, V1 - 0.08], [U1 - 0.1, V1 - 0.08]]) { const [x, y] = P(su, sv, ZT + 0.14); const c = k.ctx; c.fillStyle = ST_L; c.strokeStyle = INK; c.lineWidth = 0.7; c.fillRect(x - 1.8, y - 8, 3.6, 8); c.strokeRect(x - 1.8, y - 8, 3.6, 8); c.beginPath(); c.arc(x, y - 9.4, 1.9, 0, 7); c.fill(); c.stroke(); }
  // third stage: round cupola with eight columns and a lead dome + gold ball
  const Z3 = Z2 + 0.12, rr = 0.27;
  k.cyl(cu, cv, Z3, rr + 0.04, 0.08, ST_L, { topCol: ST_D });
  k.cyl(cu, cv, Z3 + 0.08, rr - 0.04, 0.36, shade(ST, -0.1), { top: false });
  const cs = []; for (let i = 0; i < 8; i++) { const a = (i / 8) * 2 * PI; if (Math.cos(a) + Math.sin(a) < -0.2) continue; cs.push(a); }
  cs.sort((p, q) => Math.cos(p) + Math.sin(p) - (Math.cos(q) + Math.sin(q)));
  for (const a of cs) k.cyl(cu + rr * Math.cos(a), cv + rr * Math.sin(a), Z3 + 0.08, 0.025, 0.34, "#f6e8c8", { top: false });
  k.cyl(cu, cv, Z3 + 0.42, rr + 0.04, 0.07, ST_L, { topCol: ST_D });
  leadDome(k, cu, cv, Z3 + 0.49, rr, 0.46, { ribs: 10, bands: [0.3, 0.6] });
  goldBall(k, cu, cv, Z3 + 0.96, 3.2);
  cross(k, cu, cv, Z3 + 0.99, 0.28);
}

// ---------- west front block + two-tier portico ----------
function westBlock(k) {
  const U0 = 3.3, U1 = 4.7, V0 = 5.2, V1 = 5.7, ZT = 3.1;
  bx(k, U0, U1, V0, V1, 0, ZT, ST);
  course(k, "L", V1, U0, U1, 0, ZT, 0.2);
  pil(k, "L", V1, U0 + 0.05, 0.1, 0, ZT - 0.02); pil(k, "L", V1, U1 - 0.05, 0.1, 0, ZT - 0.02);
  cornice(k, U0, U1, V0, V1, ZT, 0.14);
  bx(k, U0 + 0.1, U1 - 0.1, V0 + 0.04, V1 - 0.04, ZT + 0.14, ZT + 0.38, ST_L, { lw: 0.8 });
}
function portico(k) {
  const PU0 = 3.2, PU1 = 4.8, PV0 = 5.7, PV1 = 6.3, ZP = 0.4;
  // platform
  bx(k, PU0, PU1, PV0, PV1, 0, ZP, ST_D, { top: ST_L });
  // recessed wall: three doors + two niches (left face of the west block)
  const F = face("L", PV0 + 0.02);
  for (const [a, w, h] of [[3.5, 0.2, 0.7], [4.0, 0.3, 0.95], [4.5, 0.2, 0.7]]) win(k, F, a, ZP + 0.02, w, h, { arch: true, sur: true, lit: 0.0 });
  k.path([P(...F(3.9, ZP + 0.02)), P(...F(4.1, ZP + 0.02)), P(...F(4.1, ZP + 0.72)), P(...F(3.9, ZP + 0.72))], { fill: "#6a4a2c", lw: 0.7, wobble: 0 });
  niche(k, "L", PV0 + 0.02, 3.72, 0.95, 0.1, 0.34, { arch: true }); niche(k, "L", PV0 + 0.02, 4.28, 0.95, 0.1, 0.34, { arch: true });
  // lower-tier columns: front row v = 6.2 (paired), right-hand side row u = 4.7
  const ZC1 = 1.65, cols = [];
  const centres = [3.42, 3.76, 4.1, 4.44]; for (const cc of centres) for (const d of [-0.07, 0.07]) cols.push([cc + d, 6.2]);
  for (const v of [5.95, 5.78]) cols.push([4.72, v]);
  cols.sort((p, q) => p[0] + p[1] - (q[0] + q[1]));
  // back row hint behind the front pairs
  for (const [u, v] of cols) column(k, u, v, ZP, ZC1, 0.055);
  // lower entablature (box wrapping the colonnade)
  bx(k, PU0 + 0.02, PU1 - 0.02, PV0, PV1 - 0.02, ZC1, ZC1 + 0.2, ST_L, { lw: 0.8 });
  for (let a = PU0 + 0.15; a < PU1 - 0.1; a += 0.12) { k.ctx.strokeStyle = "rgba(110,78,40,0.3)"; k.ctx.lineWidth = 0.6; k.ctx.beginPath(); k.ctx.moveTo(...P(a, PV1 - 0.02, ZC1 + 0.05)); k.ctx.lineTo(...P(a, PV1 - 0.02, ZC1 + 0.15)); k.ctx.stroke(); }
  // upper tier (set back): six columns on the entablature, entablature, pediment with tympanum
  const ZU = ZC1 + 0.2, ZC2 = ZU + 0.95, ucs = [], UV = 5.98;
  for (const cc of [3.62, 3.96, 4.3]) for (const d of [-0.06, 0.06]) ucs.push([cc + d, UV]);
  ucs.push([4.43, 5.85]);
  // backing wall of the upper tier
  const FU = face("L", PV0 + 0.02);
  for (const a of [3.62, 3.96, 4.3]) win(k, FU, a, ZU + 0.1, 0.16, 0.6, { sur: true, lit: 0.0 });
  for (const [u, v] of ucs.sort((p, q) => p[0] + p[1] - (q[0] + q[1]))) column(k, u, v, ZU, ZC2, 0.045);
  bx(k, 3.44, 4.56, PV0, UV + 0.06, ZC2, ZC2 + 0.16, ST_L, { lw: 0.8 });
  const ZG = ZC2 + 0.16;
  k.gable(3.4, PV0, ZG, 1.2, UV + 0.1 - PV0, 0.58, ST, { ridge: "v" });
  // tympanum + raking cornice + sculpture
  const Vf = UV + 0.1;
  pg(k, [[3.5, Vf, ZG + 0.04], [4.3 + 0.2, Vf, ZG + 0.04], [4.0, Vf, ZG + 0.5]], "#e0c89a", 0.6);
  pg(k, [[3.4, Vf, ZG], [4.6, Vf, ZG], [4.0, Vf, ZG + 0.58]], null, 1.1);
  const c = k.ctx; c.fillStyle = ST_L; c.strokeStyle = "rgba(60,40,20,0.7)"; c.lineWidth = 0.5;
  for (const [a, h] of [[3.65, 0.09], [3.8, 0.14], [3.95, 0.2], [4.1, 0.14], [4.25, 0.09], [4.4, 0.06]]) { const [x, y] = P(a, Vf, ZG + 0.06); c.beginPath(); c.rect(x - 1.1, y - h * 40, 2.2, h * 40); c.fill(); c.stroke(); c.beginPath(); c.arc(x, y - h * 40 - 1.2, 1.1, 0, 7); c.fill(); c.stroke(); }
  // statues on the apex and corners of the pediment
  for (const [a, h] of [[4.0, 0.7], [3.42, 0.2], [4.58, 0.2]]) { const [x, y] = P(a, Vf - 0.05, ZG + h - 0.05); c.fillStyle = ST_L; c.strokeStyle = INK; c.lineWidth = 0.7; c.fillRect(x - 1.8, y - 9, 3.6, 9); c.strokeRect(x - 1.8, y - 9, 3.6, 9); c.beginPath(); c.arc(x, y - 10.4, 1.9, 0, 7); c.fill(); c.stroke(); }
}
function steps(k) {
  const U0 = 3.0, U1 = 5.0;
  for (const [vf, z, du] of [[6.46, 0.3, 0], [6.62, 0.2, 0.06], [6.78, 0.1, 0.12]]) bx(k, U0 - du, U1 + du, 6.3 - 0.02, vf, 0, z, ST_L, { right: shade(ST_L, -0.18), lw: 0.9 });
  // stair cheeks (low walls with plinth balls)
  for (const [u0, u1] of [[2.82, 3.0], [5.0, 5.18]]) { bx(k, u0, u1, 6.1, 6.9, 0, 0.5, ST, { lw: 0.9 }); }
  for (const u of [2.91, 5.09]) { const [x, y] = P(u, 6.84, 0.5); const c = k.ctx; c.fillStyle = ST_L; c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.arc(x, y - 3, 3, 0, 7); c.fill(); c.stroke(); }
}

export function makeStPauls() {
  // each layer is drawn back-to-front; the tile queues them in this order
  return {
    layers: [
      choir, transept, southPorch, nave, (k, t) => dome(k, t),
      (k) => tower(k, 2.3, 3.3, 1), westBlock, (k) => tower(k, 4.7, 5.7, 2),
      portico, steps,
    ],
    draw(k, t, depth = 5) { this.layers.forEach((fn, i) => k.q(depth + i * 0.01, () => fn(k, t))); },
  };
}
