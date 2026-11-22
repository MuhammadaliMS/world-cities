// helpers for the Dubai centre tile (private copy; the shared _props.js is untouched)
import { P, CTS, INK, shade, lerp, clamp, rng } from "../../lib/vec-kit.js";
import { sandBldg, windTower, merlons, arches, rail, SAND, SAND_D, SAND_L, GOLD, look } from "./_g0_0.js";

// ---------- lake: a regular rectangle on the grid ----------
export const LAKE = [[3.4, 3.4], [8.4, 3.4], [8.4, 8.4], [3.4, 8.4]];
export const COPING = [[3.2, 3.2], [8.6, 3.2], [8.6, 8.6], [3.2, 8.6]];
const BRU = 7.8, BRW = 0.8; // bridge axis (u) and width

// stone coping + teal railing along the four lake edges (gap where the bridge crosses)
export function lakeEdge(k) {
  const segs = [];
  const cut = (fixed, axis) => { // edge along u at v=fixed (axis 0) or along v at u=fixed (axis 1)
    const pieces = [[3.4, 8.4]];
    const out = [];
    for (const [a, b] of pieces) {
      if (axis === 0) { out.push([a, BRU - BRW / 2 - 0.02], [BRU + BRW / 2 + 0.02, b]); } else out.push([a, b]);
    }
    for (const [a, b] of out) {
      const n = Math.max(1, Math.round((b - a) / 1.0));
      for (let i = 0; i < n; i++) { const x0 = lerp(a, b, i / n), x1 = lerp(a, b, (i + 1) / n); segs.push(axis === 0 ? [[x0, fixed], [x1, fixed]] : [[fixed, x0], [fixed, x1]]); }
    }
  };
  cut(3.4, 0); cut(8.4, 0); cut(3.4, 1); cut(8.4, 1);
  for (const [a, b] of segs) {
    const d = (a[0] + b[0] + a[1] + b[1]) / 2;
    k.q(d + 0.05, () => {
      k.line3([[a[0], a[1], 0], [b[0], b[1], 0]], { lw: 5, stroke: "#ede0bd", wobble: 0 });
      k.line3([[a[0], a[1], 0.02], [b[0], b[1], 0.02]], { lw: 1.2, stroke: "rgba(120,95,60,0.5)", wobble: 0 });
      rail(k, [a, b], 0.34, { col: "#2e8d96", gap: 0.26 });
    });
  }
}

// ---------- fountain ----------
export const SPINE = [[4.3, 5.6], [5.5, 5.6], [6.7, 5.6]];
const spine = (s) => { const L = SPINE.length - 1, f = clamp(s) * L, i = Math.min(L - 1, Math.floor(f)), g = f - i; return [lerp(SPINE[i][0], SPINE[i + 1][0], g), lerp(SPINE[i][1], SPINE[i + 1][1], g)]; };
const TAN = (() => { const a = SPINE[0], b = SPINE[2], l = Math.hypot(b[0] - a[0], b[1] - a[1]); return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; })();
const NRM = [-TAN[1], TAN[0]]; // toward the viewer
const wv = (t, s, sp = 1, ph = 0) => 0.5 + 0.5 * Math.sin(Math.PI * 2 * (t * 0.115 * sp - s * 1.1 + ph));
const burst = (t) => { const m = (t % 13) / 13; return Math.exp(-Math.pow((m - 0.62) * 9, 2)); }; // a crescendo every 13 s

function stream(k, u, v, dir, reach, h, o = {}) {
  const c = k.ctx, t = k.t, a = o.a ?? 1, pts = [];
  for (let i = 0; i <= 16; i++) { const s = i / 16; pts.push(P(u + dir[0] * reach * s, v + dir[1] * reach * s, 4 * h * s * (1 - s) + 0.03)); }
  c.lineCap = "round"; c.lineJoin = "round";
  c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p)));
  c.strokeStyle = `rgba(185,232,244,${0.38 * a})`; c.lineWidth = o.w ?? 3.2; c.stroke();
  c.strokeStyle = `rgba(255,255,255,${0.92 * a})`; c.lineWidth = (o.w ?? 3.2) * 0.42; c.setLineDash([6, 2.5]); c.lineDashOffset = -(t * 46 + (o.ph ?? 0) * 17); c.stroke(); c.setLineDash([]);
  // landing splash
  const e = pts[pts.length - 1], f = (t * 1.1 + (o.ph ?? 0)) % 1;
  c.strokeStyle = `rgba(255,255,255,${0.55 * a * (1 - f)})`; c.lineWidth = 1; c.beginPath(); c.ellipse(e[0], e[1], 3 + f * 8, 1.4 + f * 3.4, 0, 0, 6.3); c.stroke();
}
function column(k, u, v, h, ph, w = 1) {
  const c = k.ctx, t = k.t, [x, y] = P(u, v, 0.03), [, yt] = P(u, v, h);
  c.lineCap = "round";
  const g = c.createLinearGradient(0, y, 0, yt); g.addColorStop(0, "rgba(255,255,255,0.97)"); g.addColorStop(1, "rgba(225,247,255,0.55)");
  c.strokeStyle = "rgba(180,230,244,0.42)"; c.lineWidth = 7 * w; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt + 3); c.stroke();
  c.strokeStyle = g; c.lineWidth = 3.4 * w; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt); c.stroke();
  c.strokeStyle = "rgba(255,255,255,0.9)"; c.lineWidth = 1.1; c.setLineDash([5, 4]); c.lineDashOffset = -t * 66; c.beginPath(); c.moveTo(x - 2.2, y); c.lineTo(x - 1.8, yt + 6); c.stroke(); c.setLineDash([]);
  const R = rng(Math.round(u * 40 + v * 10 + 3));
  for (let i = 0; i < 12; i++) { const a = R() * 6.28, r = 3 + R() * 9, f = ((t * 1.5 + R()) % 1); c.fillStyle = `rgba(255,255,255,${0.85 * (1 - f)})`; c.beginPath(); c.arc(x + Math.cos(a) * r * f * 1.2, yt + 4 + f * f * 28, 1.3, 0, 6.3); c.fill(); }
  const k2 = (t * 0.8 + ph) % 1; c.strokeStyle = `rgba(255,255,255,${0.7 * (1 - k2)})`; c.lineWidth = 1.4; c.beginPath(); c.ellipse(x, y, 6 + k2 * 15, (6 + k2 * 15) * 0.5, 0, 0, 6.3); c.stroke();
}
// a curtain of arcs thrown from a line of nozzles
function curtain(k, list, u0, v0, u1, v1, n, dir, reach, h, o = {}) {
  for (let i = 0; i < n; i++) {
    const s = n === 1 ? 0.5 : i / (n - 1), u = lerp(u0, u1, s), v = lerp(v0, v1, s), hh = typeof h === "function" ? h(s) : h;
    list.push([u + v + 0.15, () => stream(k, u, v, dir, reach, hh, { a: o.a ?? 0.9, w: o.w ?? 3.4, ph: s * 2 + (o.ph ?? 0) })]);
  }
}
export function fountain(k, t) {
  const L = [], B = burst(t);
  // 1. left bowl: a ring of jets arching inward + a central spike
  const [cu, cv] = [4.6, 7.4], rr = 0.78, N = 22;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * 6.2832, u = cu + Math.cos(a) * rr, v = cv + Math.sin(a) * rr, w = wv(t, i / N * 0.6, 1.4, 0.1), hh = 0.55 + 1.0 * w + 0.5 * B;
    L.push([u + v + 0.1, () => stream(k, u, v, [-Math.cos(a), -Math.sin(a)], rr * 0.96, hh, { a: 0.8, w: 2.4, ph: i * 0.2 })]);
  }
  for (const [du, dv, hk] of [[0, 0, 2.0], [0.28, 0.12, 1.5], [-0.25, -0.1, 1.4]]) L.push([cu + du + cv + dv + 0.2, () => column(k, cu + du, cv + dv, 0.7 + hk * (0.5 + 0.5 * wv(t, 0.05, 1, 0.2)) + 0.7 * B, 0, 0.9)]);
  // 2. central comb: tall columns marching along the spine, mirrored fans
  const NC = 27;
  for (let i = 0; i < NC; i++) {
    const s = 0.2 + 0.6 * (i / (NC - 1)), [u, v] = spine(s), w = wv(t, s), mid = 1 - Math.abs(s - 0.5) * 1.5, hh = 0.6 + (2.1 + 1.4 * ((i * 7) % 5) / 4) * w * (0.4 + 0.6 * mid) + 0.9 * B * mid;
    L.push([u + v + 0.2, () => column(k, u, v, hh, s * 3, i % 2 ? 0.7 : 0.95)]);
    if (i % 3 === 0) for (const sg of [-1, 1]) L.push([u + v + 0.1, () => stream(k, u, v, [NRM[0] * sg * 0.75 + TAN[0] * sg * 0.35, NRM[1] * sg * 0.75 + TAN[1] * sg * 0.35], 1.0 + 0.7 * w, 0.7 + 0.7 * w, { a: 0.7, w: 3, ph: s * 4 + sg })]);
  }
  // 3. left curtain sweeping toward the centre
  const [lu, lv] = spine(0.17);
  curtain(k, L, lu - TAN[0] * 0.5, lv - TAN[1] * 0.5, lu + TAN[0] * 0.5, lv + TAN[1] * 0.5, 9, [TAN[0] * 0.55 + NRM[0] * 0.45, TAN[1] * 0.55 + NRM[1] * 0.45], 1.9, (s) => 0.9 + 0.7 * wv(t, 0.17 + s * 0.1, 1, 0.3) + 0.4 * B);
  // 4. right pair of curtains arching toward the viewer and back
  const [ru, rv] = spine(0.86);
  curtain(k, L, ru - TAN[0] * 0.55, rv - TAN[1] * 0.55, ru + TAN[0] * 0.55, rv + TAN[1] * 0.55, 10, [-TAN[0] * 0.5 - NRM[0] * 0.5, -TAN[1] * 0.5 - NRM[1] * 0.5], 2.2, (s) => 1.0 + 1.0 * wv(t, 0.86 + s * 0.12, 1, 0.5) + 0.5 * B, { a: 0.9 });
  curtain(k, L, ru - TAN[0] * 0.4, rv - TAN[1] * 0.4, ru + TAN[0] * 0.4, rv + TAN[1] * 0.4, 7, [NRM[0] * 0.7 + TAN[0] * 0.3, NRM[1] * 0.7 + TAN[1] * 0.3], 1.3, (s) => 0.6 + 0.6 * wv(t, 0.9 + s * 0.1, 1.2, 0.8), { a: 0.7 });
  const [tu, tv] = spine(0.95);
  L.push([tu + tv + 0.3, () => column(k, tu, tv, 1.2 + 1.3 * wv(t, 0.95, 1, 0.1) + 0.9 * B, 1, 1.1)]);
  L.sort((a, b) => a[0] - b[0]);
  for (const [, fn] of L) fn();
}

// ---------- the arched bridge: runs along v at u = 7.8, lands on both promenades ----------
export const BR = { u: BRU, a: 2.9, b: 8.9, w: BRW };
export const brLen = BR.b - BR.a;
export const BRK = [0, 0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6]; // 7 segments: 2 land ramps + 5 water arches
export const brDeck = (s) => 0.5 + 0.05 * Math.sin(Math.PI * clamp(s / brLen));
export const brPt = (s, o = 0, z = 0) => P(BR.u + o, BR.a + s, z);
export const brUV = (s, o = 0) => [BR.u + o, BR.a + s];
export const brSegDepth = (j) => BR.u - BR.w / 2 + BR.a + BRK[j];
export const brRailDepth = (j) => BR.u + BR.w / 2 + BR.a + BRK[j + 1] + 0.1;
export function bridgeSeg(k, j) {
  const c = k.ctx, hw = BR.w / 2, ST = "#e6d3a6", STD = "#d3bd8c", s0 = BRK[j], s1 = BRK[j + 1];
  const sl = (a, b, n = 4) => Array.from({ length: n + 1 }, (_, i) => lerp(a, b, i / n));
  // near wall (+u face) from water to deck
  const face = [...sl(s0, s1).map((s) => brPt(s, hw, brDeck(s))), ...sl(s1, s0).map((s) => brPt(s, hw, 0))];
  k.path(face, { fill: ST, lw: 1.5, wobble: 0 });
  c.save(); c.beginPath(); face.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.clip();
  c.strokeStyle = "rgba(130,100,60,0.25)"; c.lineWidth = 0.7;
  for (let z = 0.1; z < 0.6; z += 0.1) { c.beginPath(); sl(s0, s1).forEach((s, i) => { const p = brPt(s, hw, z); i ? c.lineTo(...p) : c.moveTo(...p); }); c.stroke(); }
  c.restore();
  if (j >= 1 && j <= 5) { // arch opening
    const a0 = s0 + 0.12, a1 = s1 - 0.12, pts = [brPt(a0, hw, 0)];
    for (let q = 0; q <= 14; q++) { const th = Math.PI * q / 14, s = lerp(a0, a1, (1 - Math.cos(th)) / 2); pts.push(brPt(s, hw, Math.sin(th) * 0.32 + 0.02)); }
    pts.push(brPt(a1, hw, 0));
    k.path(pts, { fill: "#2a8fa3", lw: 1.4, wobble: 0 });
    c.strokeStyle = "rgba(110,80,45,0.55)"; c.lineWidth = 1.6; c.beginPath();
    for (let q = 0; q <= 14; q++) { const th = Math.PI * q / 14, s = lerp(a0, a1, (1 - Math.cos(th)) / 2), p = brPt(s, hw, Math.sin(th) * 0.32 + 0.05); q ? c.lineTo(...p) : c.moveTo(...p); } c.stroke();
    c.save(); c.beginPath(); pts.forEach((p, q) => (q ? c.lineTo(...p) : c.moveTo(...p))); c.clip();
    c.fillStyle = "rgba(255,255,255,0.35)";
    for (let q = 0; q < 5; q++) { const ph = (k.t * 0.5 + q * 0.37 + j) % 1, p = brPt(lerp(a0, a1, 0.15 + 0.7 * ph), hw, 0.05 + 0.1 * ((q * 7) % 3)); c.fillRect(p[0] - 3, p[1], 6, 1.2); }
    c.restore();
  }
  // deck + kerb joints
  k.path([...sl(s0, s1).map((s) => brPt(s, -hw, brDeck(s))), ...sl(s1, s0).map((s) => brPt(s, hw, brDeck(s)))], { fill: "#f0e1bb", lw: 1.4, wobble: 0 });
  c.strokeStyle = "rgba(150,120,80,0.35)"; c.lineWidth = 0.7;
  for (let s = Math.ceil(s0 * 5) / 5 + 0.2; s < s1 - 0.01; s += 0.2) { c.beginPath(); c.moveTo(...brPt(s, -hw, brDeck(s))); c.lineTo(...brPt(s, hw, brDeck(s))); c.stroke(); }
  // pier buttress with gold finial at the segment start (and the very end)
  for (const s of j === 6 ? [s0, s1] : [s0]) {
    const sc = Math.min(0.995 * brLen, Math.max(0.005, s)), z = brDeck(sc);
    const [x, y] = brPt(sc, hw + 0.02, 0), [, yt] = brPt(sc, hw + 0.02, z + 0.2);
    c.fillStyle = STD; c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.roundRect(x - 4.4, yt, 8.8, y - yt, 1.5); c.fill(); c.stroke();
    c.fillStyle = "#d9a84a"; c.beginPath(); c.arc(x, yt - 1.5, 2.6, 0, 6.3); c.fill(); c.stroke();
  }
  // far rail (behind the walkers)
  railSeg(k, j, -1);
}
function railSeg(k, j, side) {
  const c = k.ctx, hw = BR.w / 2, s0 = BRK[j], s1 = BRK[j + 1], n = Math.max(2, Math.round((s1 - s0) / 0.25));
  const o = side * (hw - 0.04), lw = side > 0 ? 2 : 1.8;
  for (let i = 0; i <= n; i++) { const s = lerp(s0, s1, i / n), [x, y] = brPt(s, o, brDeck(s)), [, yt] = brPt(s, o, brDeck(s) + 0.38); c.strokeStyle = INK; c.lineWidth = lw; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt); c.stroke(); c.strokeStyle = "#2f9aa2"; c.lineWidth = 0.9; c.stroke(); }
  c.beginPath(); for (let i = 0; i <= n; i++) { const s = lerp(s0, s1, i / n), p = brPt(s, o, brDeck(s) + 0.38); i ? c.lineTo(...p) : c.moveTo(...p); }
  c.strokeStyle = INK; c.lineWidth = 2.6; c.stroke(); c.strokeStyle = "#ece0c0"; c.lineWidth = 1.2; c.stroke();
}
export function bridgeRailNear(k, j) { railSeg(k, j, 1); }

// ---------- souk buildings ----------
// pergola of dark timber on a roof: posts + rafters + slats, optional parasols underneath
export function pergola(k, u, v, du, dv, z, h = 0.5, o = {}) {
  const c = k.ctx, col = o.col || "#6b4426";
  const posts = [[u, v], [u + du, v], [u, v + dv], [u + du, v + dv]];
  const beam = (a, b, zz, w = 3) => { const A = P(a[0], a[1], zz), B = P(b[0], b[1], zz); c.strokeStyle = INK; c.lineWidth = w + 1.6; c.beginPath(); c.moveTo(...A); c.lineTo(...B); c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
  for (const [a, b] of [[posts[0], posts[1]], [posts[0], posts[2]]]) beam(a, b, z + h, 2.4);
  for (const p of posts.slice(0, 1)) { const A = P(p[0], p[1], z), B = P(p[0], p[1], z + h); c.strokeStyle = col; c.lineWidth = 2.4; c.beginPath(); c.moveTo(...A); c.lineTo(...B); c.stroke(); }
  if (o.umbrellas) for (const [pu, pv, uc] of o.umbrellas) parasol(k, pu, pv, z, uc, 9, 0.5);
  const n = o.slats ?? 6; for (let i = 0; i <= n; i++) beam([u + du * i / n, v], [u + du * i / n, v + dv], z + h, 1.6);
  for (const p of posts.slice(1)) { const A = P(p[0], p[1], z), B = P(p[0], p[1], z + h); c.strokeStyle = INK; c.lineWidth = 3.6; c.beginPath(); c.moveTo(...A); c.lineTo(...B); c.stroke(); c.strokeStyle = col; c.lineWidth = 2.2; c.stroke(); }
  for (const [a, b] of [[posts[1], posts[3]], [posts[2], posts[3]]]) beam(a, b, z + h, 2.4);
}
// row of hanging gold lanterns along a face
export function lanternRow(k, face, u, v, du, dv, z, n, t, seed = 1) {
  const c = k.ctx, F = face === "L" ? (a, zz) => P(u + a, v + dv, zz) : (a, zz) => P(u + du, v + a, zz), run = face === "L" ? du : dv;
  for (let i = 0; i < n; i++) {
    const a = run * (i + 0.5) / n, [x, y] = F(a, z), fl = 0.75 + 0.25 * Math.sin(t * 3 + i * 1.7 + seed);
    c.strokeStyle = "rgba(42,36,32,0.7)"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x, y - 6); c.lineTo(x, y); c.stroke();
    const g = c.createRadialGradient(x, y + 2, 0.5, x, y + 2, 9); g.addColorStop(0, `rgba(255,214,120,${0.55 * fl})`); g.addColorStop(1, "rgba(255,214,120,0)"); c.fillStyle = g; c.fillRect(x - 9, y - 7, 18, 18);
    c.fillStyle = `rgba(255,${190 + 40 * fl | 0},90,1)`; c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.roundRect(x - 1.8, y, 3.6, 5, 1.2); c.fill(); c.stroke();
  }
}
// a sandstone block facing the lake: arcade at ground, arched upper windows, terrace parapet, string lanterns
export function souk(k, u, v, du, dv, h, o = {}) {
  const t = k.t;
  sandBldg(k, u, v, du, dv, h, { rows: o.rows ?? 2, arcade: true, pitch: o.pitch ?? 0.62, col: o.col, merlons: o.merlons });
  const face = o.face || "R";
  lanternRow(k, face, u, v, du, dv, 0.95, Math.round((face === "L" ? du : dv) / 0.55), t, u * 3 + v);
  // cornice band + upper-floor mashrabiya balconies
  const c = k.ctx;
  const F = face === "L" ? (a, z) => P(u + a, v + dv, z) : (a, z) => P(u + du, v + a, z), run = face === "L" ? du : dv;
  const nb = Math.max(2, Math.round(run / 0.9));
  for (let i = 0; i < nb; i++) {
    const a = run * (i + 0.5) / nb, z = h * 0.55;
    const p = [F(a - 0.22, z), F(a + 0.22, z), F(a + 0.22, z + 0.36), F(a - 0.22, z + 0.36)];
    k.path(p, { fill: "#8a5a34", lw: 0.9, wobble: 0 });
    c.strokeStyle = "rgba(255,220,150,0.5)"; c.lineWidth = 0.6; c.beginPath(); for (let q = 1; q < 4; q++) { const [x0, y0] = F(a - 0.22 + q * 0.11, z), [x1, y1] = F(a - 0.22 + q * 0.11, z + 0.36); c.moveTo(x0, y0); c.lineTo(x1, y1); } c.stroke();
  }
  if (o.pergola) pergola(k, u + 0.1, v + 0.1, du * 0.55, dv * 0.55, h, 0.5, { umbrellas: o.umbrellas });
}

// terraced café table with parasol and chairs
export function parasol(k, u, v, z, col, r = 11, hgt = 0.95) {
  const c = k.ctx, [x, y] = P(u, v, z), [, yt] = P(u, v, z + hgt);
  c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt); c.stroke();
  c.beginPath(); c.moveTo(x - r, yt + 2); c.quadraticCurveTo(x, yt - r * 0.9, x + r, yt + 2); c.quadraticCurveTo(x, yt + 6, x - r, yt + 2); c.closePath();
  c.fillStyle = col; c.fill(); c.lineWidth = 1.1; c.stroke();
  c.strokeStyle = "rgba(42,36,32,0.45)"; c.lineWidth = 0.7; c.beginPath(); for (const f of [-0.5, 0, 0.5]) { c.moveTo(x, yt - r * 0.38); c.lineTo(x + f * r * 1.8, yt + 3); } c.stroke();
}
export function cafe(k, u, v, col = "#e9b04a") {
  const c = k.ctx, [x, y] = P(u, v, 0);
  parasol(k, u, v, 0, col, 13, 1.0);
  c.fillStyle = "#6b4a2c"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.ellipse(x, y - 7, 5.5, 2.6, 0, 0, 6.3); c.fill(); c.stroke();
  for (const [du, dv] of [[0.3, 0.05], [-0.1, 0.3], [0.05, -0.3]]) { const [cx2, cy2] = P(u + du, v + dv, 0); c.fillStyle = "#3a2a1c"; c.fillRect(cx2 - 2, cy2 - 6, 4, 5); }
}

// mini hedge-lined flower bed using the kit
export const bed = (k, pts, w, seed) => k.flowerCurve(pts, w, { seed, cols: ["#e0457a", "#f06ba8", "#ffffff", "#f4a640", "#f7d44c", "#c2428a"] });
