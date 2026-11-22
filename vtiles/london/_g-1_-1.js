// Grid-pass helpers for London -1,-1 (Tower Bridge & the Thames). Private to this tile.
import { P, INK, lerp, shade, rng } from "../../lib/vec-kit.js";
import { obox, fquad, bus, cab } from "./_props.js";

// ---------- monotone cubic through keyframes [t, d], periodic: d gains `dper` every `period` ----------
export function monoEval(pts, period, dper, t) {
  const t0 = pts[0][0];
  const x = ((t - t0) % period + period) % period + t0, laps = Math.round((t - x) / period);
  const ext = [];
  for (const k of [-1, 0, 1]) for (const [tt, d] of pts) ext.push([tt + k * period, d + k * dper]);
  const n = ext.length, del = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) del.push((ext[i + 1][1] - ext[i][1]) / (ext[i + 1][0] - ext[i][0]));
  for (let i = 1; i < n - 1; i++) {
    const a = del[i - 1], b = del[i];
    if (a * b <= 0) m[i] = 0; else { const h0 = ext[i][0] - ext[i - 1][0], h1 = ext[i + 1][0] - ext[i][0], w1 = 2 * h1 + h0, w2 = h1 + 2 * h0; m[i] = (w1 + w2) / (w1 / a + w2 / b); }
  }
  let i = 0; while (i < n - 2 && ext[i + 1][0] <= x) i++;
  const h = ext[i + 1][0] - ext[i][0], s = (x - ext[i][0]) / h, s2 = s * s, s3 = s2 * s;
  const d = (2 * s3 - 3 * s2 + 1) * ext[i][1] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * ext[i + 1][1] + (s3 - s2) * h * m[i + 1];
  return d + laps * dper;
}

// ---------- vehicle loop (stadium along u): lane A v=4.25 east, lane B v=4.75 west ----------
export const UL = 0.85, UR = 9.15, VA = 4.25, VB = 4.75, VC = 4.5, AR = 0.25;
export const LANE = UR - UL, ARC = Math.PI * AR, LOOP = 2 * LANE + 2 * ARC;
export function loopPos(d) {
  d = ((d % LOOP) + LOOP) % LOOP;
  const at = (dd) => {
    dd = ((dd % LOOP) + LOOP) % LOOP;
    if (dd < LANE) return [UL + dd, VA];
    dd -= LANE; if (dd < ARC) { const p = dd / AR; return [UR + AR * Math.sin(p), VC - AR * Math.cos(p)]; }
    dd -= ARC; if (dd < LANE) return [UR - dd, VB];
    dd -= LANE; const p = dd / AR; return [UL - AR * Math.sin(p), VC + AR * Math.cos(p)];
  };
  const [u, v] = at(d), [u2, v2] = at(d + 0.03), [u1, v1] = at(d - 0.03);
  return { u, v, ang: Math.atan2(v2 - v1, u2 - u1) };
}
// keyframes for a vehicle whose queue slot is dq (distance from the lane-A start) leaving at time s0 (period 22)
export function vehKF(dq, s0, sp = 1.6) {
  const t1 = s0 + (LANE - dq) / sp, t2 = t1 + 0.7, t3 = t2 + LANE / (sp * 0.98), t4 = t3 + 0.8, t5 = t4 + Math.max(dq, 0.4);
  return [[s0, dq], [t1, LANE], [t2, LANE + ARC], [t3, 2 * LANE + ARC], [t4, LOOP], [t5, LOOP + dq]];
}
export const vehD = (kf, off, t) => monoEval(kf, 22, LOOP, t) + off;

// draw a bus / cab (size scaled about its ground anchor, lifted to z)
export function vehicle(k, kind, u, v, ang, z) {
  const c = k.ctx, [px, py] = P(u, v, z), s = kind === "bus" ? 0.55 : 0.7;
  // simple and explicit: draw at z = 0 then shift so its anchor lands on P(u, v, z)
  c.save();
  const [gx, gy] = P(u, v, 0);
  c.translate(px, py); c.scale(s, s); c.translate(-gx, -gy);
  if (kind === "bus") bus(k, u, v, ang, {}); else cab(k, u, v, ang, {});
  c.restore();
}

// ---------- tour boat ----------
export const BL = 4.6, BR = 5.4, BV0 = 1.4, BV1 = 8.4, BAR = 0.4, BLANE = BV1 - BV0, BARC = Math.PI * BAR, BLOOP = 2 * BLANE + 2 * BARC;
export function boatPos(d) {
  const at = (dd) => {
    dd = ((dd % BLOOP) + BLOOP) % BLOOP;
    if (dd < BLANE) return [BL, BV1 - dd];
    dd -= BLANE; if (dd < BARC) { const p = dd / BAR; return [5.0 - BAR * Math.cos(p), BV0 - BAR * Math.sin(p)]; }
    dd -= BARC; if (dd < BLANE) return [BR, BV0 + dd];
    dd -= BLANE; const p = dd / BAR; return [5.0 + BAR * Math.cos(p), BV1 + BAR * Math.sin(p)];
  };
  const [u, v] = at(d), [u2, v2] = at(d + 0.03), [u1, v1] = at(d - 0.03);
  return { u, v, ang: Math.atan2(v2 - v1, u2 - u1) };
}
// keyframes (period 44): lane passes under the open bridge at 7.5-13.5 and 29.5-35.5
export const BOAT_KF = [[7.5, 2.4], [13.5, 5.4], [21.0, 7.6], [29.5, 9.857], [35.5, 12.857], [42.0, 15.0]];
export const boatD = (t) => monoEval(BOAT_KF, 44, BLOOP, t);

export function cruiser(k, u, v, ang, t) {
  const c = k.ctx, dx = Math.cos(ang), dy = Math.sin(ang), W = 0.46, H = 0.24;
  const pu = (a, b) => [u + dx * a - dy * b, v + dy * a + dx * b];
  const pt = (a, b, z) => P(...pu(a, b), z);
  const out = [[-0.75, -W / 2], [0.4, -W / 2], [0.75, 0], [0.4, W / 2], [-0.75, W / 2]];
  // water ring
  const [sx, sy] = P(u, v, 0); c.fillStyle = "rgba(255,255,255,0.5)"; c.beginPath(); c.ellipse(sx, sy + 2, 40, 17, 0, 0, 7); c.fill();
  // visible side faces (outward normal toward +u/+v)
  const faces = [];
  for (let i = 0; i < out.length; i++) {
    const A = out[i], B = out[(i + 1) % out.length], ea = [B[0] - A[0], B[1] - A[1]];
    const n = [ea[1], -ea[0]], nu = dx * n[0] - dy * n[1], nv = dy * n[0] + dx * n[1];
    if (nu + nv > 0.01) faces.push({ A, B, k: (nu + nv) });
  }
  const hullCol = "#e9e6dc";
  for (const f of faces) {
    c.beginPath(); [pt(...f.A, 0), pt(...f.B, 0), pt(...f.B, H), pt(...f.A, H)].forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath();
    c.fillStyle = shade(hullCol, -0.05 - 0.1 * Math.min(1, f.k)); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke();
    c.beginPath(); [pt(...f.A, 0), pt(...f.B, 0), pt(...f.B, 0.07), pt(...f.A, 0.07)].forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.fillStyle = "#c8362f"; c.fill(); c.lineWidth = 0.6; c.stroke();
  }
  c.beginPath(); out.forEach(([a, b], i) => { const p = pt(a, b, H); i ? c.lineTo(...p) : c.moveTo(...p); }); c.closePath(); c.fillStyle = "#b9a07a"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke();
  // saloon + wheelhouse
  const sa = obox(k, u - dx * 0.12, v - dy * 0.12, ang, 0.72, 0.36, H, 0.3, "#dcebf2", { lw: 1, topCol: "#f1ead8" });
  for (const f of sa.faces) if (f.long) for (let i = 0; i < 5; i++) fquad(k, f, 0.07 + i * 0.18, 0.07 + i * 0.18 + 0.13, 0.08, 0.24, "#6f9db8", { lw: 0.5 });
  obox(k, u - dx * 0.38, v - dy * 0.38, ang, 0.24, 0.26, H + 0.3, 0.34, "#f1ead8", { lw: 1, topCol: "#c8362f" });
  // passengers on the bow deck
  const cols = ["#d9544b", "#3e6fa8", "#e9c24d", "#5f9d6d", "#e88c3d"];
  for (let i = 0; i < 5; i++) { const [x, y] = pt(0.42 + 0.03 * (i % 2), (i - 2) * 0.07, H); c.fillStyle = cols[i]; c.beginPath(); c.arc(x, y - 5 + Math.sin(t * 2 + i) * 0.5, 2.2, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.5; c.stroke(); }
  // mast + flag
  const [fx, fy] = pt(-0.65, 0, H); c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx, fy - 20); c.stroke();
  c.fillStyle = "#c8362f"; c.beginPath(); c.moveTo(fx, fy - 20); c.lineTo(fx + 10 + Math.sin(t * 5) * 1.5, fy - 17); c.lineTo(fx, fy - 13); c.fill();
}
export function boatWake(k, u0, v0, ang, t) {
  const c = k.ctx, dx = Math.cos(ang), dy = Math.sin(ang);
  c.lineCap = "round";
  for (let i = 0; i < 9; i++) for (const sg of [-1, 1]) {
    const a = -0.8 - i * 0.28, w = 0.25 + i * 0.06, p0 = [u0 + dx * a - dy * sg * w, v0 + dy * a + dx * sg * w], p1 = [u0 + dx * (a - 0.2) - dy * sg * (w + 0.1), v0 + dy * (a - 0.2) + dx * sg * (w + 0.1)];
    c.strokeStyle = `rgba(255,255,255,${0.8 - i * 0.08})`; c.lineWidth = 1.5; c.beginPath(); c.moveTo(...P(...p0, 0)); c.lineTo(...P(...p1, 0)); c.stroke();
  }
}

export const clip = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.clip(); };
