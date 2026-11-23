// DUBAI 1,-1 private helpers (copied from _props.js: people looks, date palm, circle polygons).
import { P, CTS, INK, shade, lerp, clamp, rng, smooth } from "../../lib/vec-kit.js";

export const SAND = "#e6cfa0", SAND_D = "#d2b684", SAND_L = "#f0dfb8", TERRA = "#c98f62", GOLD = "#d7a845";

// ---------- people: thobe / abaya / tourists, deterministic from a seed ----------
export function look(seed) {
  const m = seed % 9;
  if (m === 0 || m === 4) return { style: "coat", top: "#f6f3ec", bottom: "#f6f3ec", hat: "cap", hatCol: "#f8f6f0", hairStyle: "short", shoes: "#6a4a30" }; // thobe + ghutra
  if (m === 1 || m === 6) return { style: "coat", top: "#26222a", bottom: "#26222a", hat: "beret", hatCol: "#26222a", hairStyle: "bun", shoes: "#26222a" }; // abaya
  if (m === 2) return { style: "dress", hat: "sunhat", hatCol: "#f1e6c8" };
  if (m === 3) return { style: "shirt", hat: "cap" };
  if (m === 5) return { style: "tee", shorts: true, hat: null };
  return {};
}
// routes: array of polylines; specs: [routeIndex, offset, seed, speed?, extra?]
export const circlePoly = (u, v, r, n = 28, sq = 1) => Array.from({ length: n }, (_, i) => [u + Math.cos((i / n) * 6.2832) * r, v + Math.sin((i / n) * 6.2832) * r * sq]);
// ---------- date palm with feather fronds ----------
export function dpalm(k, u, v, o = {}) {
  const c = k.ctx, t = k.t, h = o.h ?? 2.3, seed = o.seed ?? Math.round(u * 17 + v * 29), R = rng(seed * 13 + 5);
  const [bx, by] = P(u, v, 0), [tx0, ty] = P(u, v, h);
  const lean = (o.lean ?? (R() - 0.5) * 0.9) * CTS.S, tx = tx0 + lean;
  c.fillStyle = "rgba(60,45,30,0.16)"; c.beginPath(); c.ellipse(bx + 8, by + 2, 17, 5, 0, 0, 6.3); c.fill();
  // trunk
  const sway = Math.sin(t * 0.9 + seed) * 1.2;
  c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 7; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + lean * 0.1, (by + ty) / 2, tx + sway, ty); c.stroke();
  c.strokeStyle = "#a98258"; c.lineWidth = 4.4; c.stroke();
  c.strokeStyle = "rgba(70,44,22,0.55)"; c.lineWidth = 1; c.setLineDash([1.2, 4.2]); c.beginPath(); c.moveTo(bx - 1.5, by); c.quadraticCurveTo(bx + lean * 0.1 - 1.5, (by + ty) / 2, tx + sway - 1.5, ty); c.stroke(); c.setLineDash([]);
  const N = o.fronds ?? 11, L0 = (o.len ?? 1) * CTS.S * 1.05, frs = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + R() * 0.25, s = Math.sin(a);
    frs.push({ a, s, L: L0 * (0.8 + R() * 0.3), ph: R() * 6.28 });
  }
  frs.sort((p, q) => p.s - q.s);
  const cx = tx + sway, cy = ty;
  const draw = (f) => {
    const sw = Math.sin(t * 1.5 + f.ph) * 0.05;
    const dx = Math.cos(f.a + sw), dy = Math.sin(f.a + sw) * 0.48;
    const p0 = [cx, cy], p1 = [cx + dx * f.L * 0.5, cy + dy * f.L * 0.5 - f.L * 0.42], p2 = [cx + dx * f.L, cy + dy * f.L + f.L * 0.28 + Math.sin(t * 2 + f.ph) * 1.4];
    const pt = (s) => { const q = 1 - s; return [q * q * p0[0] + 2 * q * s * p1[0] + s * s * p2[0], q * q * p0[1] + 2 * q * s * p1[1] + s * s * p2[1]]; };
    const left = [], right = [], n = 14;
    for (let j = 0; j <= n; j++) {
      const s = j / n, a = pt(s), b = pt(Math.min(1, s + 0.03)), a2 = pt(Math.max(0, s - 0.03));
      const tx2 = b[0] - a2[0], ty2 = b[1] - a2[1], l = Math.hypot(tx2, ty2) || 1, nx = -ty2 / l, ny = tx2 / l;
      const w = Math.pow(Math.sin(Math.PI * Math.min(0.97, s * 0.92 + 0.06)), 0.8) * 7.2 * (o.wide ?? 1) * (j % 2 ? 1 : 0.62);
      left.push([a[0] + nx * w, a[1] + ny * w]); right.push([a[0] - nx * w, a[1] - ny * w]);
    }
    const poly = [...left, ...[...right].reverse()];
    c.beginPath(); poly.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
    c.fillStyle = f.s > 0.2 ? "#6aa653" : "#4f8c43"; c.fill(); c.lineWidth = 1.5; c.strokeStyle = INK; c.lineJoin = "round"; c.stroke();
    c.strokeStyle = "rgba(190,230,140,0.7)"; c.lineWidth = 1; c.beginPath(); for (let j = 0; j <= n; j++) { const p = pt(j / n); j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke();
  };
  for (const f of frs) if (f.s < 0) draw(f);
  c.fillStyle = "#8a6a3e"; c.beginPath(); c.arc(cx, cy + 1, 3.6, 0, 6.3); c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  if (o.dates !== false) { c.fillStyle = "#d9892f"; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(cx - 3 + i * 2, cy + 4 + (i % 2), 1.5, 0, 6.3); c.fill(); } }
  for (const f of frs) if (f.s >= 0) draw(f);
}

// ---------- arabic architecture ----------

// =====================================================================================================
// Grid-pass additions for 1,-1: everything below is built from P(u,v,z) points only.
// =====================================================================================================
const SX = CTS.S * CTS.ZS, SY = CTS.S * CTS.YS;
const VIEW = (() => { const d = [1, 1, SX / SY], l = Math.hypot(...d); return d.map((x) => x / l); })(); // toward the viewer
const LIGHT = (() => { const d = [0.12, 0.42, 0.9], l = Math.hypot(...d); return d.map((x) => x / l); })();
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const nrm = (a) => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const hexc = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
// a ground-point lifted to height z keeps the same screen position at (u - e, v - e), e = z * SX / SY / 2 (used to stand ground props on the mound)
export const elev = (u, v, z) => { const e = (z * SX / SY) / 2; return [u - e, v - e]; };

// ---------- the Museum of the Future: an upright elliptical torus in the u-z plane ----------
export function makeMuseum(o = {}) {
  const U0 = o.u ?? 4.1, V0 = o.v ?? 3.3, Z0 = o.z ?? 3.55, A = o.A ?? 3.0, B = o.B ?? 2.2, RP = o.rp ?? 0.6, RW = o.rw ?? 0.55;
  const NT = 160, NP = 24, KT = 2.7, KP = 0.62;
  const th = (i) => (i / NT) * 6.2832, ph = (j) => (j / NP) * 6.2832;
  const surf = (a, f) => { const n = nrm([B * Math.cos(a), 0, A * Math.sin(a)]), cf = Math.cos(f), sf = Math.sin(f);
    return { p: [U0 + A * Math.cos(a) + RP * cf * n[0], V0 + RW * sf, Z0 + B * Math.sin(a) + RP * cf * n[2]], n: nrm([n[0] * cf / RP, sf / RW, n[2] * cf / RP]) }; };
  const V = [], N = [];
  for (let i = 0; i < NT; i++) { V.push([]); N.push([]); for (let j = 0; j < NP; j++) { const s = surf(th(i), ph(j)); V[i].push(s.p); N[i].push(s.n); } }
  const items = [];
  for (let i = 0; i < NT; i++) for (let j = 0; j < NP; j++) {
    const i1 = (i + 1) % NT, j1 = (j + 1) % NP, a = [V[i][j], V[i1][j], V[i1][j1], V[i][j1]];
    const nq = nrm([0, 1, 2].map((k2) => N[i][j][k2] + N[i1][j][k2] + N[i1][j1][k2] + N[i][j1][k2]));
    const c = [0, 1, 2].map((k2) => (a[0][k2] + a[2][k2]) / 2);
    items.push({ q: 1, i, j, i1, j1, nq, front: dot(nq, VIEW) > 0, d: dot(c, VIEW) });
  }
  // calligraphy ribbons in (theta, phi): flowing curves with hooks, loops and dots
  const R = rng(77), strokes = [];
  for (let s = 0; s < 80; s++) {
    const a0 = R() * 6.2832, f0 = R() * 6.2832, L = 0.45 + R() * 0.9, amp = 0.5 + R() * 0.9, k = 2 + R() * 3, p = R() * 6.28, dir = R() < 0.5 ? 1 : -1, w = 0.05 + R() * 0.04, hook = R() < 0.6, loop = R() < 0.3;
    const pts = [], n = 40;
    for (let m = 0; m <= n; m++) { const u = m / n; let a = a0 + dir * L * u, f = f0 + amp * Math.sin(k * u + p) * 0.6 + 0.5 * u * (R() < 0 ? 1 : 0);
      if (hook && u > 0.8) { const h = (u - 0.8) / 0.2; a -= dir * 0.16 * Math.sin(h * 2.2); f += 0.8 * h * h; }
      if (loop && u > 0.35 && u < 0.65) { const h = (u - 0.35) / 0.3; a += dir * 0.12 * Math.sin(h * 6.28); f += 0.75 * (1 - Math.cos(h * 6.28)) * 0.5; }
      pts.push([a, f, w * (0.3 + Math.pow(Math.sin(Math.PI * Math.min(0.98, u + 0.01)), 0.6))]); }
    strokes.push(pts);
    if (R() < 0.55) { const e = pts[n]; strokes.push([[e[0] + dir * 0.09, e[1] + 0.35, 0.04], [e[0] + dir * 0.1, e[1] + 0.38, 0.05], [e[0] + dir * 0.11, e[1] + 0.41, 0.04]]); }
  }
  for (const pts of strokes) {
    const rail = pts.map((q, m) => { const pa = pts[Math.max(0, m - 1)], pb = pts[Math.min(pts.length - 1, m + 1)], tx = (pb[0] - pa[0]) * KT, ty = (pb[1] - pa[1]) * KP, l = Math.hypot(tx, ty) || 1, nx = -ty / l, ny = tx / l;
      return [[q[0] + nx * q[2] / KT, q[1] + ny * q[2] / KP], [q[0] - nx * q[2] / KT, q[1] - ny * q[2] / KP]].map(([a2, f2]) => surf(a2, f2)); });
    for (let m = 0; m < pts.length - 1; m++) {
      const sv = [rail[m][0], rail[m + 1][0], rail[m + 1][1], rail[m][1]], cn = nrm([0, 1, 2].map((k2) => sv.reduce((s2, q) => s2 + q.n[k2], 0))), cc = [0, 1, 2].map((k2) => sv.reduce((s2, q) => s2 + q.p[k2], 0) / 4);
      const lift = (q) => [q.p[0] + q.n[0] * 0.012, q.p[1] + q.n[1] * 0.012, q.p[2] + q.n[2] * 0.012];
      items.push({ q: 0, v3: sv.map(lift), nq: cn, front: dot(cn, VIEW) > 0.05, d: dot(cc, VIEW) + 0.16 });
    }
  }
  items.sort((p, q) => p.d - q.d);
  const F = new Uint8Array(NT * NP); items.forEach((q) => { if (q.q) F[q.i * NP + q.j] = q.front ? 1 : 0; });
  const SILV0 = hexc("#8f9ba8"), SILV1 = hexc("#eef0f1"), WARM = hexc("#e8dfcc"), HV = nrm([VIEW[0] + LIGHT[0], VIEW[1] + LIGHT[1], VIEW[2] + LIGHT[2]]);
  return {
    shadow(k, zm) {
      const c = k.ctx; c.save(); c.lineJoin = "round"; c.strokeStyle = "rgba(40,70,25,0.20)"; c.lineWidth = 26; c.beginPath();
      for (let i = 0; i <= NT; i += 2) { const a = th(i), z = Z0 + B * Math.sin(a), [x, y] = P(U0 + A * Math.cos(a) + 0.38 * z * 0.7 + 0.5, V0 + 0.22 * z * 0.7 + 0.15, zm); i ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.closePath(); c.stroke(); c.restore();
    },
    draw(k, t) {
      const c = k.ctx; c.lineJoin = "round"; c.lineCap = "round";
      const pp = (i, j) => P(V[i][j][0], V[i][j][1], V[i][j][2]);
      if (k.night) { // the ring glows: cool white off the steel, gold off the calligraphy windows
        for (let i = 0; i < NT; i += 5) { const v3 = V[i][Math.floor(NP / 2)]; k.glow(v3[0], v3[1], v3[2], 0.95, i % 10 ? "#cfe0ff" : "#ffe0a0", 0.2); }
      }
      const fillp = (pts, fill, stroke) => { c.beginPath(); pts.forEach((p, n) => (n ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = 0.8; c.stroke(); } };
      for (const q of items) {
        if (!q.front) continue;
        const lam = clamp(dot(q.nq, LIGHT) * 0.5 + 0.5);
        if (q.q) {
          const a = th(q.i), f = ph(q.j), band = 0.5 + 0.5 * Math.sin(f * 2 + 0.6) * 0.9 + 0.12 * Math.sin(a * 5);
          let col = mixc(SILV0, SILV1, clamp(lam * 0.95 + (band - 0.5) * 0.3));
          col = mixc(col, WARM, 0.16 * (1 - lam));
          const spec = Math.pow(Math.max(0, dot(q.nq, HV)), 14); col = mixc(col, [255, 255, 255], clamp(spec * 0.9));
          const gl = Math.max(0, Math.sin(a * 2 + f * 0.6 - t * 0.9) - 0.93) * 9 + Math.max(0, Math.sin(a * 3 - f * 0.8 - t * 0.55 + 2) - 0.95) * 10;
          if (gl > 0.02) col = mixc(col, [255, 255, 255], Math.min(0.7, gl * lam));
          fillp([pp(q.i, q.j), pp(q.i1, q.j), pp(q.i1, q.j1), pp(q.i, q.j1)], rgb(col), rgb(col));
          if (k.night) k.lit(() => fillp([pp(q.i, q.j), pp(q.i1, q.j), pp(q.i1, q.j1), pp(q.i, q.j1)], `rgba(214,228,255,${0.34 + 0.3 * lam})`));
        } else {
          const pts = q.v3.map((p) => P(p[0], p[1], p[2])), g = clamp(lam * 0.8);
          const col = mixc(hexc("#0f1c30"), hexc("#35557a"), g);
          fillp(pts, rgb(col), rgb(col));
          if (k.night) k.lit(() => fillp(pts, "rgba(255,204,96,0.97)"));
          c.strokeStyle = `rgba(215,232,245,${0.35 + 0.4 * lam})`; c.lineWidth = 0.7; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[1][0], pts[1][1]); c.stroke();
        }
      }
      c.strokeStyle = INK; c.lineWidth = 1.9; c.beginPath();
      for (let i = 0; i < NT; i++) for (let j = 0; j < NP; j++) {
        const i1 = (i + 1) % NT, j1 = (j + 1) % NP;
        if (F[i * NP + j] !== F[i1 * NP + j]) { c.moveTo(...pp(i1, j)); c.lineTo(...pp(i1, j1)); }
        if (F[i * NP + j] !== F[i * NP + j1]) { c.moveTo(...pp(i, j1)); c.lineTo(...pp(i1, j1)); }
      }
      c.stroke();
    },
  };
}

// ---------- the gold shell over the station: leaf extruded along v, glass on the +u half ----------
export function makeShell(o = {}) {
  const UC = o.u ?? 8.55, V0 = o.v0 ?? 6.55, V1 = o.v1 ?? 9.25, Z0 = o.z ?? 1.75, HW = o.hw ?? 0.98, HH = o.h ?? 1.3;
  const NS = 18, NA = 16, V = [];
  const wv = (s) => HW * (1 - 0.3 * s * s), hv = (s) => HH * (1 - Math.pow(s, 1.8)) + 0.12;
  for (let i = 0; i <= NS; i++) { V.push([]); const s = i / NS; for (let j = 0; j <= NA; j++) { const a = (j / NA) * Math.PI; V[i].push([UC + wv(s) * Math.cos(a), V0 + (V1 - V0) * s, Z0 + hv(s) * Math.pow(Math.sin(a), 0.6)]); } }
  const quads = [];
  for (let i = 0; i < NS; i++) for (let j = 0; j < NA; j++) {
    const a = [V[i][j], V[i + 1][j], V[i + 1][j + 1], V[i][j + 1]];
    let n = nrm(cross(sub(a[1], a[0]), sub(a[3], a[0]))); if (n[2] < 0 && j > 0 && j < NA - 1) n = n.map((x) => -x);
    const cc = [(a[0][0] + a[2][0]) / 2, (a[0][1] + a[2][1]) / 2, (a[0][2] + a[2][2]) / 2];
    quads.push({ i, j, a, n, d: dot(cc, VIEW), glass: j < NA * 0.4 });
  }
  quads.sort((p, q) => p.d - q.d);
  return {
    draw(k, t) {
      const c = k.ctx; c.lineJoin = "round";
      for (const q of quads) {
        // outward normal: orient so it points away from the axis line
        const ax = [q.a[0][0] - UC, 0, q.a[0][2] - Z0]; let n = q.n; if (dot(n, ax) < 0 && Math.hypot(...ax) > 0.05) n = n.map((x) => -x);
        if (dot(n, VIEW) <= 0.02) continue;
        const lam = clamp(dot(n, LIGHT) * 0.5 + 0.5), pts = q.a.map((p) => P(p[0], p[1], p[2]));
        c.beginPath(); pts.forEach((p, m) => (m ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
        if (q.glass) { c.fillStyle = `rgba(${96 + lam * 70 | 0},${170 + lam * 50 | 0},${190 + lam * 40 | 0},0.30)`; c.fill(); c.strokeStyle = "rgba(231,196,110,0.9)"; c.lineWidth = 1; c.stroke(); }
        else { const col = mixc(hexc("#b9852c"), hexc("#fbe39a"), clamp(lam * 1.15 + 0.06 * Math.sin(q.i * 1.7 + q.j))); const rr = rgb(col); c.fillStyle = rr; c.fill(); c.strokeStyle = "rgba(120,78,22,0.5)"; c.lineWidth = 0.8; c.stroke();
          const gl = Math.max(0, Math.sin((q.i * 0.45 + q.j * 0.2) - t * 1.1) - 0.9) * 6; if (gl > 0.02) { c.fillStyle = `rgba(255,252,225,${Math.min(0.65, gl)})`; c.fill(); } }
      }
      // silhouette of the shell: base edges + crest
      c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath();
      for (let i = 0; i <= NS; i++) { const p = P(...V[i][0]); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }
      c.stroke(); c.beginPath();
      for (let i = 0; i <= NS; i++) { const p = P(...V[i][NA]); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }
      c.stroke();
      c.beginPath(); for (let i = 0; i <= NS; i++) { const p = P(...V[i][NA / 2]); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.strokeStyle = "rgba(90,60,15,0.7)"; c.lineWidth = 1.2; c.stroke();
    },
  };
}

// ---------- rounded rectangle outline in (u,v), n points per corner ----------
export function rrect(u0, u1, v0, v1, r, n = 6) {
  const out = [], corners = [[u1 - r, v0 + r, -Math.PI / 2], [u1 - r, v1 - r, 0], [u0 + r, v1 - r, Math.PI / 2], [u0 + r, v0 + r, Math.PI]];
  for (const [cu, cv, a0] of corners) for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * Math.PI / 2; out.push([cu + Math.cos(a) * r, cv + Math.sin(a) * r]); }
  return out;
}

// ---------- the Metro train: 3 cars on a v-axis guideway, both ends cabbed, geometry clamped to [vmin, vmax] ----------
export function drawTrain(k, t, head, o = {}) {
  const c = k.ctx, uc = o.u ?? 8.6, W = 0.26, z0 = o.z ?? 1.78, z1 = z0 + 0.86, vmin = o.vmin ?? -1e9, vmax = o.vmax ?? 1e9;
  const CL = 1.02, GAP = 0.05, NC = 3, tail = head - (NC * CL + (NC - 1) * GAP);
  const cl = (s) => clamp(s, vmin, vmax);
  const R = (s, z) => P(uc + W, cl(s), z), Lf = (u, s, z) => P(u, cl(s), z);
  for (let i = 0; i < NC; i++) {
    const a = tail + i * (CL + GAP), b = a + CL; if (b <= vmin + 0.01 || a >= vmax) continue;
    const endF = i === NC - 1, endB = i === 0, ns = 0.24;
    const sa = cl(a), sb = cl(b);
    const fa = endB ? a + ns : a, fb = endF ? b - ns : b;
    // roof
    k.path([P(uc - W, cl(fa), z1), P(uc + W, cl(fa), z1), P(uc + W, cl(fb), z1), P(uc - W, cl(fb), z1)], { fill: "#f1f4f6", lw: 1.2, wobble: 0 });
    // side (+u): outline incl. cab slope
    const side = [R(a, z0), R(a, endB ? z0 + 0.4 : z1), ...(endB ? [R(fa, z1)] : []), ...(endF ? [R(fb, z1), R(b, z0 + 0.4)] : [R(b, z1)]), R(b, z0)];
    if (!endB) side.splice(1, 1, R(a, z1)); // plain car start
    const sidePts = endB ? [R(a, z0), R(a, z0 + 0.42), R(fa, z1), ...(endF ? [R(fb, z1), R(b, z0 + 0.42)] : [R(b, z1)]), R(b, z0)] : [R(a, z0), R(a, z1), ...(endF ? [R(fb, z1), R(b, z0 + 0.42)] : [R(b, z1)]), R(b, z0)];
    k.path(sidePts, { fill: "#cfd7de", lw: 1.4, wobble: 0 });
    c.save(); c.beginPath(); sidePts.forEach((p, n) => (n ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.clip();
    const band = (s0, s1, za, zb, col) => { c.fillStyle = col; c.beginPath(); [R(s0, za), R(s1, za), R(s1, zb), R(s0, zb)].forEach((p, n) => (n ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.fill(); };
    band(a - 0.1, b + 0.1, z0 + 0.06, z0 + 0.24, "#18a5c8"); band(a - 0.1, b + 0.1, z0 + 0.24, z0 + 0.28, "#76d2e4"); band(a - 0.1, b + 0.1, z1 - 0.05, z1, "#e7edf0");
    // windows + doors
    const win = (s0, s1) => { if (s1 - s0 < 0.05) return; const g = c.createLinearGradient(0, R(s0, z1)[1], 0, R(s0, z0)[1]); g.addColorStop(0, "#1f3646"); g.addColorStop(1, "#6a97ad"); c.fillStyle = g; c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); [R(s0, z0 + 0.34), R(s1, z0 + 0.34), R(s1, z1 - 0.12), R(s0, z1 - 0.12)].forEach((p, n) => (n ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill(); c.stroke(); };
    const d1 = a + (endB ? 0.38 : 0.2), d2 = b - (endF ? 0.62 : 0.4);
    win(a + (endB ? 0.3 : 0.05), d1 - 0.03); win(d1 + 0.27, d2 - 0.03); win(d2 + 0.27, b - 0.04);
    for (const d of [d1, d2]) { if (d + 0.24 < vmin) continue; c.fillStyle = "#f2f5f6"; c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); [R(d, z0 + 0.06), R(d + 0.24, z0 + 0.06), R(d + 0.24, z1 - 0.1), R(d, z1 - 0.1)].forEach((p, n) => (n ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = "#4b7890"; c.beginPath(); [R(d + 0.03, z0 + 0.36), R(d + 0.21, z0 + 0.36), R(d + 0.21, z1 - 0.16), R(d + 0.03, z1 - 0.16)].forEach((p, n) => (n ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.fill(); }
    // passengers as soft silhouettes
    c.fillStyle = "rgba(30,42,56,0.5)"; for (let m = 0; m < 4; m++) { const s = a + 0.25 + m * 0.22 + (i % 2) * 0.05; if (s < vmin || s > vmax) continue; const [x, y] = R(s, z1 - 0.2); c.beginPath(); c.arc(x, y + 2, 2.3, 0, 6.3); c.fill(); c.fillRect(x - 2.2, y + 4, 4.4, 5); }
    const gx = a + ((t * 0.4 + i * 0.37) % 1.6) - 0.3; c.fillStyle = "rgba(255,255,255,0.33)"; c.beginPath(); [R(gx, z1), R(gx + 0.12, z1), R(gx + 0.02, z0), R(gx - 0.1, z0)].forEach((p, n) => (n ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.fill();
    c.restore();
    k.path(sidePts, { fill: null, lw: 1.4, wobble: 0 });
    // end caps (+v faces / slopes): front cab and rear cab are both cabbed
    if (endF && b <= vmax) {
      const ws = [Lf(uc - W, fb, z1), Lf(uc + W, fb, z1), Lf(uc + W * 0.95, b, z0 + 0.42), Lf(uc - W * 0.95, b, z0 + 0.42)];
      const g = c.createLinearGradient(...ws[0], ...ws[2]); g.addColorStop(0, "#1a2f3d"); g.addColorStop(1, "#4e7e95"); k.path(ws, { fill: g, lw: 1.3, wobble: 0 });
      k.path([Lf(uc - W * 0.95, b, z0 + 0.42), Lf(uc + W * 0.95, b, z0 + 0.42), Lf(uc + W * 0.9, b, z0), Lf(uc - W * 0.9, b, z0)], { fill: "#18a5c8", lw: 1.2, wobble: 0 });
      const hl = Lf(uc, b, z0 + 0.22); c.fillStyle = "#fff6c8"; c.beginPath(); c.arc(hl[0], hl[1], 2, 0, 6.3); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.7; c.stroke();
    }
    if (i < NC - 1) k.path([Lf(uc - W * 0.9, b, z1 - 0.12), Lf(uc + W * 0.9, b, z1 - 0.12), Lf(uc + W * 0.9, b + GAP, z1 - 0.12), Lf(uc - W * 0.9, b + GAP, z1 - 0.12)], { fill: "#2b3238", lw: 0.7, wobble: 0 });
    void sa; void sb;
  }
}
