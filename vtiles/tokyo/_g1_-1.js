// TOKYO 1,-1 grid helpers: everything through P(u,v,z). Fuji model, tea tiers, farmhouse, viaduct, train, bridge, willow, rocks.
import { P, CTS, INK, shade, mix, lerp, clamp, smooth, rng, hash, drawHuman } from "../../lib/vec-kit.js";

export const TAU = Math.PI * 2;
const ZS = CTS.S * CTS.ZS;
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm3 = (a) => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const LIGHT = norm3([-0.25, 0.5, 0.82]);

// ------------------------------------------------------------------ Mt Fuji (heightfield model, painter-sorted cells)
export const FUJI = { cu: 2.75, cv: 2.65, R: 2.35, H: 5.6 };
const BUMPS = [[1.2, 3.55, 0.88, 1.5], [4.3, 4.05, 0.82, 0.95], [4.35, 0.95, 0.8, 1.0]];
const bumps = (u, v) => { let h = 0; for (const [bu, bv, br, bh] of BUMPS) { const f = 1 - Math.hypot(u - bu, v - bv) / br; if (f > 0) h += bh * f * f * (3 - 2 * f) * (1 + 0.1 * Math.sin(u * 7 + v * 5)); } return h; };
const fujiRaw = (u, v) => {
  const { cu, cv, R, H } = FUJI;
  const du = u - cu, dv = v - cv, r = Math.hypot(du, dv), a = Math.atan2(dv, du);
  const f = 1 - r / R; if (f <= 0) return bumps(u, v);
  let h = H * (0.62 * Math.pow(f, 2.5) + 0.38 * Math.pow(f, 1.12));
  if (f > 0.92) { const g = smooth((f - 0.92) / 0.08); h = lerp(h, H * 0.93 + (h - H * 0.93) * 0.3, g * (h > H * 0.93 ? 1 : 0)); }
  const amp = smooth((1 - f) * 2.2) * smooth(f * 5);
  h *= 1 + amp * (0.11 * Math.sin(7 * a + 1.3) + 0.06 * Math.sin(13 * a + r * 2.1) + 0.04 * Math.sin(23 * a + 0.4));
  h += 0.07 * Math.sin(u * 5.3 + v * 3.1) * f;
  return Math.max(0, h + bumps(u, v));
};
const terrace = (h) => { // soft staircase for the tea terraces on the foothills
  if (h > 1.0) return h;
  const step = 0.2, x = h / step, fl = Math.floor(x), fr = x - fl;
  const q = (fl + smooth((fr - 0.62) / 0.38)) * step;
  return lerp(q, h, smooth((h - 0.7) / 0.3));
};
const fujiH = (u, v) => terrace(fujiRaw(u, v));
const snowLine = (a) => 3.15 + 0.8 * Math.max(0, Math.sin(9 * a + 0.7)) + 0.3 * Math.sin(5 * a + 2) - 0.15;

let FUJI_ITEMS = null, FUJI_ENV = null, FUJI_GULLY = null;
function buildFuji() {
  const { cu, cv, R } = FUJI, N = 38, u0 = cu - R - 0.05, st = (R * 2 + 0.1) / N, items = [];
  const hh = [];
  for (let i = 0; i <= N; i++) { hh[i] = []; for (let j = 0; j <= N; j++) hh[i][j] = fujiH(u0 + i * st, cv - R - 0.05 + j * st); }
  const v0 = cv - R - 0.05, env = new Map();
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const za = hh[i][j], zb = hh[i + 1][j], zc = hh[i + 1][j + 1], zd = hh[i][j + 1];
    const zm = (za + zb + zc + zd) / 4; if (zm < 0.004 && Math.max(za, zb, zc, zd) < 0.004) continue;
    const u = u0 + i * st, v = v0 + j * st, uc = u + st / 2, vc = v + st / 2;
    const dhu = ((zb + zc) - (za + zd)) / (2 * st), dhv = ((zd + zc) - (za + zb)) / (2 * st);
    const lam = dot3(norm3([-dhu, -dhv, 1]), LIGHT);
    const a = Math.atan2(vc - cv, uc - cu), hr = fujiRaw(uc, vc), hs = hash(i * 13.1 + j * 7.7);
    let col;
    if (hr > snowLine(a) + (hs - 0.5) * 0.12) col = mix("#f3f7ff", "#cfdcf2", clamp(0.8 - lam) * 1.1);
    else if (hr > 1.7 + (hs - 0.5) * 0.35) col = mix("#7a8fbe", "#93a0c6", hash(i * 3.3 + j * 5.1));
    else if (hr > 1.0) col = mix("#3f7d46", "#5d9a4c", hs);
    else { const band = Math.floor(zm / 0.2 + 0.5); col = band % 2 ? "#79b24c" : "#5c9a3c"; if (hr < 0.06) col = "#7fb050"; }
    const pts = [P(u, v, za), P(u + st, v, zb), P(u + st, v + st, zc), P(u, v + st, zd)];
    items.push({ d: uc + vc + zm * 0.01, pts, col: shade(col, (lam - 0.72) * 0.6) });
    for (const [x, y] of pts) { const b = Math.round(x / 3); const e = env.get(b); if (e == null || y < e) env.set(b, y); }
  }
  // pines on the forest band of the front-facing slopes
  const R2 = rng(41);
  for (let n = 0; n < 150; n++) {
    const a = R2() * TAU, r = FUJI.R * (0.55 + R2() * 0.42), u = cu + Math.cos(a) * r, v = cv + Math.sin(a) * r;
    const z = fujiH(u, v), hr = fujiRaw(u, v);
    if (hr < 0.75 || hr > 1.9 || Math.cos(a - Math.PI / 4) < -0.35) continue;
    items.push({ d: u + v + 0.02, tree: [u, v, z, 0.42 + R2() * 0.3, n] });
  }
  for (let n = 0; n < 70; n++) {
    const [bu, bv, br] = BUMPS[n % 2 === 0 ? 0 : (n % 3 === 1 ? 2 : 0)], a = R2() * TAU, r = br * Math.sqrt(R2()) * 0.8, u = bu + Math.cos(a) * r, v = bv + Math.sin(a) * r;
    if (Math.hypot(u - cu, v - cv) < R * 0.55 || fujiRaw(u, v) < 0.8) continue;
    items.push({ d: u + v + 0.02, tree: [u, v, fujiH(u, v), 0.36 + R2() * 0.26, 200 + n] });
  }
  FUJI_ITEMS = items.sort((p, q) => p.d - q.d);
  FUJI_ENV = [...env.entries()].sort((p, q) => p[0] - q[0]).map(([b, y]) => [b * 3, y]);
  // gullies down the front-facing flanks
  FUJI_GULLY = [];
  for (let g = 0; g < 16; g++) {
    const a = ((g + hash(g * 2.7) * 0.6) / 16) * TAU, line = [];
    if (Math.cos(a - Math.PI / 4) < 0.0) continue;
    for (let s = 0.97; s > 0.34; s -= 0.04) { const r = FUJI.R * s, u = cu + Math.cos(a) * r, v = cv + Math.sin(a) * r; if (fujiRaw(u, v) < 2.0) break; line.push(P(u, v, fujiRaw(u, v) + 0.01)); }
    if (line.length > 2) FUJI_GULLY.push(line);
  }
}
export function pine(c, u, v, z, h, seed, t = 0) {
  const [x, y] = P(u, v, z), s = h * ZS, w = h * 0.22 * CTS.S * 1.4, sway = Math.sin(t * 1.2 + seed) * 0.8;
  c.fillStyle = "rgba(40,50,30,0.2)"; c.beginPath(); c.ellipse(x + 4, y + 1, w * 0.8, w * 0.25, 0, 0, TAU); c.fill();
  c.strokeStyle = "#4a3426"; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - s * 0.25); c.stroke();
  for (let i = 0; i < 3; i++) {
    const by = y - s * (0.14 + i * 0.27), ty = by - s * 0.5, ww = w * (1 - i * 0.28);
    c.beginPath(); c.moveTo(x - ww + sway * i, by); c.lineTo(x + sway * (i + 1), ty); c.lineTo(x + ww + sway * i, by); c.closePath();
    c.fillStyle = [ "#2f6a40", "#3a7a48", "#468856"][i]; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.1; c.lineJoin = "round"; c.stroke();
    c.fillStyle = "rgba(0,30,10,0.28)"; c.beginPath(); c.moveTo(x + sway * i, by); c.lineTo(x + sway * (i + 1), ty); c.lineTo(x + ww + sway * i, by); c.closePath(); c.fill();
  }
}
export function mountain(k, t) {
  if (!FUJI_ITEMS) buildFuji();
  const c = k.ctx;
  // soft ground shadow under the massif
  k.ell(FUJI.cu + 0.5, FUJI.cv + 0.4, 0, FUJI.R * 1.02, "rgba(40,60,30,0.16)", { stroke: false });
  c.lineJoin = "round";
  for (const it of FUJI_ITEMS) {
    if (it.tree) { pine(c, it.tree[0], it.tree[1], it.tree[2], it.tree[3], it.tree[4], t); continue; }
    c.beginPath(); c.moveTo(...it.pts[0]); for (let i = 1; i < 4; i++) c.lineTo(...it.pts[i]); c.closePath();
    c.fillStyle = it.col; c.fill(); c.strokeStyle = it.col; c.lineWidth = 0.9; c.stroke();
  }
  c.strokeStyle = "rgba(48,60,110,0.5)"; c.lineWidth = 1.3; c.lineCap = "round";
  for (const line of FUJI_GULLY) { c.beginPath(); line.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.stroke(); }
  // silhouette
  c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); FUJI_ENV.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
  // drifting cloud streaks hugging the peak, kept over the footprint
  for (let n = 0; n < 2; n++) {
    const ph = t * 0.12 + n * 0.5, du = Math.sin(ph * TAU) * 0.7, z = 4.7 + n * 0.5 + 0.5 * n, rr = 1.1 - n * 0.2;
    const [x, y] = P(FUJI.cu + 0.2 + du, FUJI.cv + 0.3 + du, z);
    c.fillStyle = "rgba(255,255,255,0.82)"; c.beginPath();
    for (const [dx, dy, r] of [[-26, 0, 11], [-8, -4, 14], [12, -1, 13], [30, 1, 10]]) { c.moveTo(x + dx * rr + r * rr, y + dy); c.ellipse(x + dx * rr, y + dy, r * rr * 1.4, r * rr * 0.62, 0, 0, TAU); }
    c.fill();
  }
}

// ------------------------------------------------------------------ tea terrace tier
export function teaTier(k, u, v, du, dv, z, t, o = {}) {
  const wallL = o.wallL || "#b4a98a", wallR = o.wallR || "#948b72";
  k.box(u, v, 0, du, dv, z, "#a79d80", { left: wallL, right: wallR, top: "#6fa94a", hatch: false, shadow: false });
  const rows = o.rows ?? 4, R = rng(Math.round(u * 17 + v * 31));
  const rv = o.rowsAt || Array.from({ length: rows }, (_, i) => (i < rows / 2 ? 0.1 + i * 0.16 : 0.9 - (rows - 1 - i) * 0.16));
  for (const f of rv) k.box(u + 0.08, v + f * dv - 0.09, z, du - 0.16, 0.18, 0.2, "#5b9c3b", { left: "#62a842", right: "#3f8030", top: "#95d062", hatch: false, shadow: false, lw: 1 });
  // little tufts along the retaining wall
  const c = k.ctx; c.strokeStyle = "#6b9a3c"; c.lineWidth = 1.2; c.lineCap = "round";
  for (let i = 0; i < du * 3; i++) { const uu = u + 0.2 + R() * (du - 0.4), [x, y] = P(uu, v + dv, z - 0.05 - R() * 0.15); c.beginPath(); c.moveTo(x, y); c.lineTo(x - 1.5, y - 3); c.moveTo(x, y); c.lineTo(x + 1.5, y - 3); c.stroke(); }
}

// ------------------------------------------------------------------ rocks (faceted, grid-aligned light)
export function rock(k, u, v, z, s, col = "#8f8c86", seed = 1) {
  const c = k.ctx, R = rng(seed * 7 + Math.round(u * 5 + v * 3)), n = 8, rx = 0.34 * s, ry = 0.26 * s, hgt = 0.34 * s;
  const rings = [[0, 1], [0.5, 1.08], [1, 0.58]].map(([hz, rr]) => Array.from({ length: n }, (_, i) => { const a = (i / n) * TAU, j = 0.72 + R() * 0.55; return [u + Math.cos(a) * rx * rr * j, v + Math.sin(a) * ry * rr * j, z + hz * hgt * (0.85 + R() * 0.3)]; }));
  k.ell(u + 0.12 * s, v + 0.07 * s, z, rx * 1.05, "rgba(40,45,30,0.22)", { stroke: false });
  for (let ri = 0; ri < 2; ri++) for (let i = 0; i < n; i++) {
    const a = ((i + 0.5) / n) * TAU; if (Math.cos(a) + Math.sin(a) < -0.5) continue;
    const j = (i + 1) % n, q = [rings[ri][i], rings[ri][j], rings[ri + 1][j], rings[ri + 1][i]];
    const lit = (-Math.cos(a) * 0.3 + Math.sin(a) * 0.6) * 0.18 + (ri ? 0.1 : -0.05);
    k.poly(q, shade(col, lit), { lw: 0.9, wobble: 0 });
  }
  k.poly(rings[2], shade(col, 0.2), { lw: 0.9, wobble: 0 });
  const [mx, my] = P(u - 0.05 * s, v - 0.03 * s, z + hgt * 0.98); c.fillStyle = "rgba(111,154,70,0.75)"; c.beginPath(); c.ellipse(mx, my, 3.2 * s + 1, 1.7 * s + 0.6, 0, 0, TAU); c.fill();
}

// ------------------------------------------------------------------ farmhouse (hip roof, plaster + timber)
export function farmhouse(k, u, v, z, du, dv, t, o = {}) {
  const c = k.ctx, H = o.h ?? 0.7, wall = o.wall || "#eadfc4", roof = o.roof || "#6a5f56", rh = o.rh ?? 0.72, ov = 0.26;
  k.box(u - 0.05, v - 0.05, z, du + 0.1, dv + 0.1, 0.12, "#9a9486", { hatch: false, shadow: false });
  const z1 = z + 0.12;
  k.box(u, v, z1, du, dv, H, wall, { hatch: false, shadow: false, noTop: true });
  const tim = { stroke: "#5a4030", lw: 1.7, wobble: 0 };
  const nL = Math.max(2, Math.round(du / 0.42)), nR = Math.max(2, Math.round(dv / 0.42));
  for (let i = 0; i <= nL; i++) k.line3([[u + (du * i) / nL, v + dv, z1], [u + (du * i) / nL, v + dv, z1 + H]], tim);
  for (let i = 0; i <= nR; i++) k.line3([[u + du, v + (dv * i) / nR, z1], [u + du, v + (dv * i) / nR, z1 + H]], tim);
  for (const zz of [0.12, H - 0.1]) { k.line3([[u, v + dv, z1 + zz], [u + du, v + dv, z1 + zz]], tim); k.line3([[u + du, v, z1 + zz], [u + du, v + dv, z1 + zz]], tim); }
  k.windows(u, v, z1, du, dv, H, { side: "L", rows: 1, cols: nL, mx: 0.12, my: 0.16, base: 0.2, w: 0.7, h: 0.72, color: "#f0e6c6", lw: 0.9, wobble: 0 });
  k.windows(u, v, z1, du, dv, H, { side: "R", rows: 1, cols: nR, mx: 0.12, my: 0.16, base: 0.2, w: 0.7, h: 0.72, color: "#e6dcba", lw: 0.9 });
  // roof: hip with ridge, tile courses, ridge cap
  const U0 = u - ov, V0 = v - ov, U1 = u + du + ov, V1 = v + dv + ov, zr = z1 + H, ins = Math.min(U1 - U0, V1 - V0) / 2 - 0.0005;
  const a = [U0 + ins, V0 + ins, zr + rh], b = [U1 - ins, V0 + ins, zr + rh], cc = [U1 - ins, V1 - ins, zr + rh], d = [U0 + ins, V1 - ins, zr + rh];
  k.poly([[U0, V1, zr], [U1, V1, zr], cc, d], shade(roof, -0.04));
  k.poly([[U1, V0, zr], [U1, V1, zr], cc, b], shade(roof, -0.22));
  k.poly([[U0, V0, zr], [U0, V1, zr], d, a], shade(roof, 0.02), { stroke: false });
  c.strokeStyle = "rgba(20,15,12,0.38)"; c.lineWidth = 0.9;
  for (let f = 0.2; f < 0.95; f += 0.2) {
    c.beginPath(); c.moveTo(...P(lerp(U0, d[0], f), lerp(V1, d[1], f), zr + rh * f)); c.lineTo(...P(lerp(U1, cc[0], f), lerp(V1, cc[1], f), zr + rh * f)); c.stroke();
    c.beginPath(); c.moveTo(...P(lerp(U1, cc[0], f), lerp(V0, b[1], f), zr + rh * f)); c.lineTo(...P(lerp(U1, cc[0], f), lerp(V1, cc[1], f), zr + rh * f)); c.stroke();
  }
  k.line3([d, cc], { stroke: "#3a322c", lw: 2.4, wobble: 0 });
  if (o.smoke) smokePuff(k, u + du * 0.62, v + dv * 0.5, zr + rh * 0.95, t);
}
export function smokePuff(k, u, v, z, t, o = {}) {
  const c = k.ctx, [x, y] = P(u, v, z);
  for (let i = 0; i < 8; i++) {
    const f = (((t * 0.3 + i / 8) % 1) + 1) % 1, px = x + Math.sin(f * 6 + i * 1.7 + t * 0.6) * (4 + f * 10) + 8 * f, py = y - f * 46, r = 3 + f * 8;
    c.fillStyle = `rgba(255,255,255,${(1 - f) * 0.5 * Math.min(1, f * 8)})`; c.beginPath(); c.arc(px, py, r, 0, TAU); c.fill();
  }
}
// small white storehouse (kura) with a black gable roof, ridge along u
export function kura(k, u, v, z, du, dv) {
  k.box(u, v, z, du, dv, 0.62, "#f1ece0", { hatch: false, shadow: false, noTop: true });
  k.line3([[u, v + dv, z + 0.2], [u + du, v + dv, z + 0.2]], { stroke: "#2c2a28", lw: 1.4, wobble: 0 });
  k.poly([[u + du * 0.3, v + dv, z], [u + du * 0.3 + 0.28, v + dv, z], [u + du * 0.3 + 0.28, v + dv, z + 0.4], [u + du * 0.3, v + dv, z + 0.4]], "#4a3a2c", { lw: 0.9, wobble: 0 });
  k.gable(u - 0.1, v - 0.1, z + 0.62, du + 0.2, dv + 0.2, 0.45, "#3b3a40", { ridge: "u" });
}

// ------------------------------------------------------------------ tunnel mound (retaining wall + grass cap, optional portal on the u+ face)
export function mound(k, u, v, du, dv, t, o = {}) {
  const H = 3.1, wallC = "#c9bd9e";
  { const ue = Math.min(u + du + 0.55, 9.7); k.poly([[u + du, v + 0.1, 0], [ue, v + 0.2, 0], [ue, v + dv + 0.2, 0], [u + du, v + dv, 0]], "rgba(60,45,30,0.12)", { stroke: false }); }
  k.box(u, v, 0, du, dv, H, wallC, { left: "#bdb08f", right: "#9e9274", noTop: true, hatch: false, shadow: false });
  // horizontal course lines and joints
  const c = k.ctx;
  for (const zz of [0.55, 1.1, 1.65, 2.2, 2.75]) { k.line3([[u, v + dv, zz], [u + du, v + dv, zz]], { stroke: "rgba(42,36,32,0.28)", lw: 1, wobble: 0 }); k.line3([[u + du, v, zz], [u + du, v + dv, zz]], { stroke: "rgba(42,36,32,0.28)", lw: 1, wobble: 0 }); }
  for (let i = 1; i < Math.round(dv / 0.5); i++) k.line3([[u + du, v + (dv * i) / Math.round(dv / 0.5), 0], [u + du, v + (dv * i) / Math.round(dv / 0.5), H]], { stroke: "rgba(42,36,32,0.22)", lw: 1, wobble: 0 });
  const R3 = rng(Math.round(u * 17 + 5));
  for (let i = 0; i < Math.round(dv * 5); i++) { const f = (i + R3()) / Math.round(dv * 5), [x, y] = P(u + du, v + dv * f, H - 0.04); c.fillStyle = ["#5f9a40", "#76ad4c", "#4f8a38"][i % 3]; c.beginPath(); c.ellipse(x, y, 5 + R3() * 3, 3.6, 0, 0, TAU); c.fill(); if (R3() < 0.6) { c.strokeStyle = "#5a9540"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (R3() - 0.5) * 3, y + 8 + R3() * 28); c.stroke(); } }
  for (let i = 0; i < Math.round(du * 5); i++) { const f = (i + R3()) / Math.round(du * 5), [x, y] = P(u + du * f, v + dv, H - 0.04); c.fillStyle = ["#5f9a40", "#76ad4c", "#4f8a38"][i % 3]; c.beginPath(); c.ellipse(x, y, 5 + R3() * 3, 3.6, 0, 0, TAU); c.fill(); if (R3() < 0.6) { c.strokeStyle = "#5a9540"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (R3() - 0.5) * 3, y + 8 + R3() * 28); c.stroke(); } }
  // grass cap, stepped in like a hill
  k.box(u + 0.08, v + 0.1, H, du - 0.16, dv - 0.2, 0.25, "#78ad4e", { left: "#6aa044", right: "#58903a", top: "#8bc05a", hatch: false, shadow: false });
  k.box(u + 0.35, v + 0.45, H + 0.25, du - 0.7, dv - 0.9, 0.2, "#78ad4e", { left: "#6aa044", right: "#58903a", top: "#93c862", hatch: false, shadow: false });
  if (o.portal) { // concrete portal frame + dark arch on the u+ face
    const uf = u + du, vc = o.vc, w = 0.42;
    k.poly([[uf, vc - w - 0.12, 1.7], [uf, vc + w + 0.12, 1.7], [uf, vc + w + 0.12, 2.95], [uf, vc - w - 0.12, 2.95]], "#e0dacb", { lw: 1.2, wobble: 0 });
    const arch = [[uf, vc - w, 1.72], [uf, vc + w, 1.72], [uf, vc + w, 2.32]];
    for (let i = 1; i < 10; i++) { const a = (i / 10) * Math.PI; arch.push([uf, vc + Math.cos(a) * w, 2.32 + Math.sin(a) * 0.42]); }
    arch.push([uf, vc - w, 2.32]);
    k.poly(arch, "#1b1d22", { lw: 1.2, wobble: 0 });
    k.line3([[uf, vc - w - 0.12, 2.97], [uf, vc + w + 0.12, 2.97]], { stroke: INK, lw: 1.5, wobble: 0 });
    // signal lamp
    const [sx, sy] = P(uf, vc + w + 0.3, 2.3); c.fillStyle = "#3be26b"; c.beginPath(); c.arc(sx, sy, 2.4, 0, TAU); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
  }
}

// ------------------------------------------------------------------ viaduct (axis-aligned along u)
export const VIA = { u0: 1.65, u1: 8.4, v0: 5.15, v1: 6.15, z0: 1.2, z1: 1.7, vt: 5.65 };
export const PIERS = [3.2, 4.65, 6.1, 7.5];
export function viaductPiers(k) {
  for (const pu of PIERS) {
    k.box(pu - 0.25, 5.4, 0, 0.5, 0.6, VIA.z0 - 0.3, "#cfc9b9", { hatch: true, shadow: true });
    k.box(pu - 0.4, 5.32, VIA.z0 - 0.32, 0.8, 0.76, 0.32, "#d3cdbd", { hatch: false, shadow: false });
  }
}
export function viaductDeck(k) {
  const { u0, u1, v0, v1, z0, z1 } = VIA, c = k.ctx;
  k.box(u0, v0, z0, u1 - u0, v1 - v0, z1 - z0, "#d1ccbd", { hatch: false, shadow: false, top: "#cdc7b8" });
  // expansion joints + underside shadow line on the girder face
  for (let u = u0 + 0.9; u < u1 - 0.3; u += 0.9) k.line3([[u, v1, z0], [u, v1, z1]], { stroke: "rgba(42,36,32,0.28)", lw: 1, wobble: 0 });
  k.line3([[u0, v1, z0 + 0.12], [u1, v1, z0 + 0.12]], { stroke: "rgba(42,36,32,0.3)", lw: 1, wobble: 0 });
  // ballast bed, sleepers, rails
  k.poly([[u0, v0 + 0.14, z1 + 0.04], [u1, v0 + 0.14, z1 + 0.04], [u1, v1 - 0.14, z1 + 0.04], [u0, v1 - 0.14, z1 + 0.04]], "#9f9788", { stroke: false });
  c.strokeStyle = "rgba(70,56,40,0.7)"; c.lineWidth = 1.4;
  for (let u = u0 + 0.05; u < u1; u += 0.14) { c.beginPath(); c.moveTo(...P(u, VIA.vt - 0.24, z1 + 0.05)); c.lineTo(...P(u, VIA.vt + 0.24, z1 + 0.05)); c.stroke(); }
  for (const dv of [-0.14, 0.14]) { k.line3([[u0, VIA.vt + dv, z1 + 0.07], [u1, VIA.vt + dv, z1 + 0.07]], { stroke: INK, lw: 2.3, wobble: 0 }); k.line3([[u0, VIA.vt + dv, z1 + 0.07], [u1, VIA.vt + dv, z1 + 0.07]], { stroke: "#cfd4da", lw: 1, wobble: 0 }); }
  // back parapet (far side)
  k.box(u0, v0, z1, u1 - u0, 0.1, 0.24, "#c9c3b4", { hatch: false, shadow: false });
}
export function viaductFront(k) { // near fence, drawn after the train
  const { u0, u1, v1, z1 } = VIA;
  k.line3([[u0, v1 - 0.04, z1 + 0.3], [u1, v1 - 0.04, z1 + 0.3]], { stroke: INK, lw: 2.4, wobble: 0 });
  k.line3([[u0, v1 - 0.04, z1 + 0.3], [u1, v1 - 0.04, z1 + 0.3]], { stroke: "#a9b0b8", lw: 1.1, wobble: 0 });
  for (let u = u0 + 0.05; u <= u1; u += 0.25) k.line3([[u, v1 - 0.04, z1], [u, v1 - 0.04, z1 + 0.3]], { stroke: "#7e868f", lw: 1.1, wobble: 0 });
  k.box(u0, v1 - 0.14, z1, u1 - u0, 0.12, 0.1, "#c9c3b4", { hatch: false, shadow: false });
}
export const MASTS = [1.95, 3.9, 5.85, 7.8];
export function masts(k) {
  const { z1, v0 } = VIA, c = k.ctx;
  for (const mu of MASTS) {
    k.box(mu - 0.045, v0 - 0.02, z1, 0.09, 0.09, 1.85, "#a3abb5", { hatch: false, shadow: false, lw: 1 });
    k.line3([[mu, v0 + 0.04, z1 + 1.65], [mu, VIA.vt, z1 + 1.65]], { stroke: INK, lw: 2.4, wobble: 0 });
    k.line3([[mu, v0 + 0.04, z1 + 1.65], [mu, VIA.vt, z1 + 1.65]], { stroke: "#9aa2ab", lw: 1.1, wobble: 0 });
  }
  const MU = [VIA.u0 + 0.12, ...MASTS, VIA.u1 - 0.12].sort((a, b) => a - b);
  for (let i = 0; i < MU.length - 1; i++) {
    const a = MU[i], b = MU[i + 1];
    for (const [z, lw] of [[z1 + 1.65, 1.1], [z1 + 1.25, 1.1]]) {
      c.strokeStyle = "rgba(42,36,32,0.8)"; c.lineWidth = lw; c.beginPath();
      for (let s = 0; s <= 8; s++) { const f = s / 8, p = P(lerp(a, b, f), VIA.vt, z - (z === z1 + 1.65 ? 0.06 : 0) * Math.sin(f * Math.PI)); s ? c.lineTo(...p) : c.moveTo(...p); } c.stroke();
    }
  }
}

// ------------------------------------------------------------------ Shinkansen
export const CAR_L = 1.25, CAR_N = 4, NOSE_L = 0.95, TRAIN_W = 0.54, TRAIN_H = 0.8, TZ = 1.82;
export const TRAIN_LEN = CAR_N * CAR_L + NOSE_L * 2;
// dir -1: heads toward -u (head at the low-u end). x = u of the head tip.
export function trainState(t) {
  const span = VIA.u1 - VIA.u0, total = TRAIN_LEN + span, T = 5.2, gap = 1.6, per = 2 * (T + gap);
  const cyc = ((t % per) + per) % per;
  if (cyc < T) { const f = cyc / T; return { dir: -1, tip: VIA.u1 - f * total }; }
  if (cyc >= T + gap && cyc < 2 * T + gap) { const f = (cyc - T - gap) / T; return { dir: 1, tip: VIA.u0 + f * total }; }
  return null;
}
const noseProfile = (f) => ({ w: 0.28 + 0.72 * Math.pow(f, 0.7), h: 0.34 + 0.66 * Math.pow(f, 0.55) });
export function drawTrain(k, t) {
  const st = trainState(t); if (!st) return;
  const { dir } = st, c = k.ctx, lo = VIA.u0, hi = VIA.u1, vc = VIA.vt, W = TRAIN_W, H = TRAIN_H;
  // layout along u as intervals [a,b] with a<b: nose (head end), cars, nose (tail end)
  let head = dir < 0 ? st.tip : st.tip; // head tip coordinate
  const segs = []; let cur = head;
  const mk = (len, kind, idx) => { const a = dir < 0 ? cur : cur - len, b = dir < 0 ? cur + len : cur; segs.push({ a, b, kind, idx }); cur += dir < 0 ? len : -len; };
  mk(NOSE_L, "nose", 0); for (let i = 0; i < CAR_N; i++) mk(CAR_L, "car", i); mk(NOSE_L, "tailnose", 0);
  // dir<0: head is at low-u: segments extend toward +u. dir>0: head at high-u (tip = max u)
  const items = segs.filter((s) => s.b > lo && s.a < hi).sort((p, q) => p.a - q.a);
  for (const s of items) { // lower-u first (farther)
    const a = Math.max(s.a, lo), b = Math.min(s.b, hi);
    if (b - a < 0.01) continue;
    if (s.kind === "car") bodySeg(k, a, b, s, vc, W, H);
    else noseSeg(k, a, b, s, vc, W, H, (s.kind === "nose") === (dir < 0));
  }
  // pantograph on car 2
  const car2 = segs.find((s) => s.kind === "car" && s.idx === 1);
  if (car2 && car2.a > lo + 0.1 && car2.b < hi - 0.1) { const pu = (car2.a + car2.b) / 2; k.line3([[pu - 0.2, vc, TZ + H], [pu, vc, TZ + H + 0.36], [pu + 0.2, vc, TZ + H]], { stroke: INK, lw: 1.8, wobble: 0 }); k.line3([[pu - 0.14, vc, TZ + H + 0.38], [pu + 0.14, vc, TZ + H + 0.38]], { stroke: INK, lw: 2.4, wobble: 0 }); }
}
function bodySeg(k, a, b, s, vc, W, H) {
  const v0 = vc - W / 2;
  k.box(a, v0, TZ, b - a, W, H, "#f4f6f8", { hatch: false, shadow: false, top: "#fbfcfd", left: "#eef1f4", right: "#c9d0d8", lw: 1.3 });
  const v1 = v0 + W;
  k.poly([[a, v1, TZ + H * 0.22], [b, v1, TZ + H * 0.22], [b, v1, TZ + H * 0.34], [a, v1, TZ + H * 0.34]], "#2457a6", { stroke: false });
  k.poly([[a, v1, TZ], [b, v1, TZ], [b, v1, TZ + H * 0.1], [a, v1, TZ + H * 0.1]], "#8a95a3", { stroke: false });
  const len = s.b - s.a, n = 8, c = k.ctx;
  for (let i = 0; i < n; i++) {
    const wa = s.a + len * (0.1 + i * 0.1), wb = wa + len * 0.06; if (wa < a || wb > b) continue;
    k.poly([[wa, v1, TZ + H * 0.5], [wb, v1, TZ + H * 0.5], [wb, v1, TZ + H * 0.8], [wa, v1, TZ + H * 0.8]], "#34445f", { lw: 0.7, wobble: 0 });
    if (k.night) k.lit(() => k.poly([[wa, v1, TZ + H * 0.5], [wb, v1, TZ + H * 0.5], [wb, v1, TZ + H * 0.8], [wa, v1, TZ + H * 0.8]], (i * 3 + Math.round(a * 7)) % 11 === 4 ? "#a9bddd" : "#ffe8a8", { lw: 0.7, wobble: 0 }));
  }
  k.glow(s.a + len * 0.5, v1 + 0.2, TZ + H * 0.2, 1.0, "#ffe0a0", 0.12, { flat: true });
  if (s.a >= VIA.u0 && a === s.a) k.line3([[a, v1, TZ + 0.02], [a, v1, TZ + H]], { stroke: "rgba(42,36,32,0.55)", lw: 1, wobble: 0 });
}
function noseSeg(k, a, b, s, vc, W, H, tipAtLow) {
  const L = s.b - s.a, N = 7, c = k.ctx; // section i at fraction f of the way from tip(0) to base(1)
  const secAt = (u) => { const f = tipAtLow ? (u - s.a) / L : (s.b - u) / L, p = noseProfile(clamp(f)); return { u, w: p.w * W, h: p.h * H }; };
  const us = Array.from({ length: N + 1 }, (_, i) => lerp(a, b, i / N)), S = us.map(secAt);
  const L3 = (sx, i, sideV, z) => [sx.u, vc + sideV * sx.w / 2, TZ + z * sx.h];
  // left (v+) side strips, then top strips
  for (let i = 0; i < N; i++) { const p = S[i], q = S[i + 1]; k.poly([L3(p, i, 1, 0), L3(q, i, 1, 0), L3(q, i, 1, 1), L3(p, i, 1, 1)], "#eef1f4", { lw: 0.7, wobble: 0, stroke: "rgba(42,36,32,0.35)" }); }
  for (let i = 0; i < N; i++) { const p = S[i], q = S[i + 1]; k.poly([L3(p, i, -1, 1), L3(p, i, 1, 1), L3(q, i, 1, 1), L3(q, i, -1, 1)], "#fbfcfd", { lw: 0.7, wobble: 0, stroke: "rgba(42,36,32,0.35)" }); }
  // blue stripe on the nose side
  for (let i = 0; i < N; i++) { const p = S[i], q = S[i + 1]; k.poly([[p.u, vc + p.w / 2, TZ + p.h * 0.22], [q.u, vc + q.w / 2, TZ + q.h * 0.22], [q.u, vc + q.w / 2, TZ + q.h * 0.34], [p.u, vc + p.w / 2, TZ + p.h * 0.34]], "#2457a6", { stroke: false }); }
  // windscreen on the top slope near the tip (head only)
  if (s.kind === "nose") for (let i = 0; i < N; i++) { const p = S[i], q = S[i + 1], f = tipAtLow ? (p.u - s.a) / L : (s.b - p.u) / L; if (f > 0.25 && f < 0.85) k.poly([[p.u, vc - p.w * 0.36, TZ + p.h], [p.u, vc + p.w * 0.36, TZ + p.h], [q.u, vc + q.w * 0.36, TZ + q.h], [q.u, vc - q.w * 0.36, TZ + q.h]], "#27324a", { stroke: false }); }
  // tip cap faces +u when the tip is the high end
  if (!tipAtLow && b === s.b) { const e = S[N]; k.poly([[e.u, vc - e.w / 2, TZ], [e.u, vc + e.w / 2, TZ], [e.u, vc + e.w / 2, TZ + e.h], [e.u, vc - e.w / 2, TZ + e.h]], "#dfe4ea", { lw: 0.8, wobble: 0 }); }
  if (!tipAtLow) { // windscreen on the right-facing slope sections: end-facing glass is on the cap side
    for (let i = 0; i < N; i++) { const p = S[i], q = S[i + 1], f = (s.b - p.u) / L; if (f < 0.55 && f > 0.1 && s.kind === "nose") k.poly([[p.u, vc - p.w * 0.36, TZ + p.h], [p.u, vc + p.w * 0.36, TZ + p.h], [q.u, vc + q.w * 0.36, TZ + q.h], [q.u, vc - q.w * 0.36, TZ + q.h]], "#27324a", { stroke: false }); }
  }
}

// ------------------------------------------------------------------ red arched bridge along u
export const BR = { u0: 4.7, u1: 8.8, v0: 7.76, v1: 8.44 };
export const bridgeZ = (u) => { const s = clamp((u - BR.u0) / (BR.u1 - BR.u0)); return 0.34 + 1.0 * Math.pow(Math.sin(Math.PI * s), 0.85); };
const arc = (v, hgt, n = 24) => Array.from({ length: n + 1 }, (_, i) => { const u = lerp(BR.u0, BR.u1, i / n); return [u, v, bridgeZ(u) + hgt]; });
const strip = (k, pts, o) => { k.line3(pts, { stroke: INK, lw: o.w + 2, wobble: 0 }); k.line3(pts, { stroke: o.col, lw: o.w, wobble: 0 }); };
export function bridgeBack(k) {
  const n = 28, c = k.ctx;
  // shadow on the water + underside
  k.poly([[BR.u0 + 0.1, BR.v0 + 0.2, 0.02], [BR.u1 - 0.1, BR.v0 + 0.2, 0.02], [BR.u1 - 0.1, BR.v1 + 0.5, 0.02], [BR.u0 + 0.1, BR.v1 + 0.5, 0.02]], "rgba(10,60,70,0.32)", { stroke: false });
  // far rails
  const vr = BR.v0 + 0.03;
  for (const [h, w] of [[0.55, 2.4], [0.28, 1.8]]) strip(k, arc(vr, h), { w, col: "#d83a2c" });
  for (let i = 0; i <= 14; i++) { const u = lerp(BR.u0, BR.u1, i / 14); k.line3([[u, vr, bridgeZ(u)], [u, vr, bridgeZ(u) + 0.55]], { stroke: "#c93326", lw: 1.5, wobble: 0 }); }
  // deck planks
  for (let i = 0; i < n; i++) { const ua = lerp(BR.u0, BR.u1, i / n), ub = lerp(BR.u0, BR.u1, (i + 1) / n); k.poly([[ua, BR.v0, bridgeZ(ua)], [ub, BR.v0, bridgeZ(ub)], [ub, BR.v1, bridgeZ(ub)], [ua, BR.v1, bridgeZ(ua)]], i % 2 ? "#d5ab72" : "#dcb67e", { lw: 0.8, wobble: 0, stroke: "rgba(110,70,30,0.45)" }); }
}
export function bridgeFront(k) {
  const n = 28, vf = BR.v1;
  // red fascia: upper curve is deck level, lower curve the arch intrados
  const up = [], lo = [];
  for (let i = 0; i <= n; i++) { const u = lerp(BR.u0, BR.u1, i / n), s = i / n; up.push([u, vf, bridgeZ(u)]); lo.push([u, vf, bridgeZ(u) - 0.26 - 0.12 * Math.sin(Math.PI * s)]); }
  k.poly([...up, ...lo.reverse()], "#c9362a", { lw: 1.6, wobble: 0 });
  k.line3(up.map(([u, v, z]) => [u, v, z - 0.06]), { stroke: "rgba(255,160,130,0.55)", lw: 1.4, wobble: 0 });
  for (const [h, w] of [[0.55, 3], [0.28, 2.2]]) strip(k, arc(vf - 0.03, h), { w, col: "#e0402f" });
  for (let i = 0; i <= 14; i++) { const u = lerp(BR.u0, BR.u1, i / 14); k.line3([[u, vf - 0.03, bridgeZ(u)], [u, vf - 0.03, bridgeZ(u) + 0.55]], { stroke: INK, lw: 3, wobble: 0 }); k.line3([[u, vf - 0.03, bridgeZ(u)], [u, vf - 0.03, bridgeZ(u) + 0.55]], { stroke: "#d63628", lw: 1.6, wobble: 0 }); }
  const c = k.ctx;
  for (const s of [0.015, 0.26, 0.5, 0.74, 0.985]) {
    const u = lerp(BR.u0, BR.u1, s), z = bridgeZ(u);
    k.line3([[u, vf - 0.03, z], [u, vf - 0.03, z + 0.72]], { stroke: INK, lw: 7, wobble: 0 }); k.line3([[u, vf - 0.03, z], [u, vf - 0.03, z + 0.72]], { stroke: "#dc3b2b", lw: 4.6, wobble: 0 });
    const [x, y] = P(u, vf - 0.03, z + 0.74); c.fillStyle = "#3b2a24"; c.beginPath(); c.arc(x, y - 3, 4.6, 0, TAU); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke(); c.fillStyle = "rgba(255,255,255,0.35)"; c.beginPath(); c.arc(x - 1.4, y - 4.6, 1.4, 0, TAU); c.fill();
  }
  // far posts (shorter, behind)
}
export function bridgePost(k) {} // reserved

// ------------------------------------------------------------------ koi, willow, lantern, petals
export function koi(k, t, boxes) {
  const c = k.ctx, cols = ["#f26a2a", "#f4f0e8", "#f09a30", "#e9482a", "#f2f2ea"];
  boxes.forEach(([cu, cv, ru, rv, sp, ph], i) => {
    const a = t * sp + ph, u = cu + Math.cos(a) * ru, v = cv + Math.sin(a) * rv, du = -Math.sin(a) * ru * Math.sign(sp), dv = Math.cos(a) * rv * Math.sign(sp);
    const L = Math.hypot(du, dv) || 1, ux = du / L, vx = dv / L, wig = Math.sin(t * 6 + i * 2) * 0.05;
    const body = [[0.18, 0], [0.06, 0.07], [-0.1, 0.05], [-0.2, wig]].map(([f, s]) => [u + ux * f - vx * s, v + vx * f + ux * s, 0.015]);
    const body2 = [[0.18, 0], [0.06, -0.07], [-0.1, -0.05], [-0.2, wig]].map(([f, s]) => [u + ux * f - vx * s, v + vx * f + ux * s, 0.015]);
    k.poly([...body, ...body2.reverse()], cols[i % cols.length], { lw: 0.8, wobble: 0, stroke: "rgba(40,50,60,0.6)" });
    k.poly([[u - ux * 0.2, v - vx * 0.2, 0.015], [u - ux * 0.34 + vx * (0.08 + wig), v - vx * 0.34 - ux * (0.08 + wig), 0.015], [u - ux * 0.34 - vx * (0.08 - wig), v - vx * 0.34 + ux * (0.08 - wig), 0.015]], cols[i % cols.length], { lw: 0.7, wobble: 0, stroke: "rgba(40,50,60,0.5)" });
    if (i % 2 === 0) k.ell(u + ux * 0.02, v + vx * 0.02, 0.015, 0.05, "rgba(220,50,30,0.8)", { stroke: false });
    const f = ((t * 0.6 + i * 0.37) % 1); k.ell(u, v, 0.012, 0.1 + f * 0.3, null, { stroke: `rgba(255,255,255,${0.45 * (1 - f)})`, lw: 1 });
  });
}
export function willow(k, t, u, v, o = {}) {
  const c = k.ctx, H = o.h ?? 2.4, seed = o.seed ?? 77, rr = o.r ?? 1.15, R = rng(seed);
  const trunk = (pts, w0, w1) => { for (const [col, kk] of [[INK, 1.4], ["#6d4f35", 1]]) { c.strokeStyle = col; c.lineCap = "round"; for (let i = 0; i < pts.length - 1; i++) { c.lineWidth = lerp(w0, w1, i / (pts.length - 1)) * kk; c.beginPath(); c.moveTo(...P(...pts[i])); c.lineTo(...P(...pts[i + 1])); c.stroke(); } } };
  k.ell(u + 0.3, v + 0.15, 0, rr * 0.9, "rgba(40,60,30,0.18)", { stroke: false });
  trunk([[u, v, 0], [u + 0.05, v, H * 0.35], [u + 0.02, v, H * 0.62], [u - 0.12, v, H * 0.8]], 11, 6);
  trunk([[u - 0.1, v, H * 0.74], [u - 0.5, v - 0.1, H * 0.9], [u - 0.8, v - 0.2, H * 1.0]], 5, 2.5);
  trunk([[u - 0.05, v, H * 0.8], [u + 0.4, v + 0.1, H * 0.95], [u + 0.75, v + 0.2, H * 1.0]], 5, 2.5);
  const cz = H * 1.02;
  for (let i = 0; i < 22; i++) { const a = R() * TAU, d = Math.sqrt(R()), [x, y] = P(u - 0.1 + Math.cos(a) * d * rr * 0.9, v + Math.sin(a) * d * rr * 0.9, cz + 0.06 * Math.sin(a)); c.fillStyle = ["#a9cd47", "#c6e05e", "#8fba3a", "#d3e97a"][i % 4]; c.globalAlpha = 0.9; c.beginPath(); c.ellipse(x, y, 16 + R() * 12, 7 + R() * 5, 0, 0, TAU); c.fill(); }
  c.globalAlpha = 1;
  const n = 150;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU * 2.3, d = 0.35 + 0.65 * Math.sqrt(hash(i * 1.7 + seed)), bu = u - 0.1 + Math.cos(a) * d * rr * 0.92, bv = v + Math.sin(a) * d * rr * 0.92;
    const len = (0.85 + hash(i * 3.7) * 0.8) * (H / 2.4), sw = Math.sin(t * 1.25 + i * 0.37 + a * 2) * 0.05 + Math.sin(t * 2.7 + i) * 0.012;
    const [x0, y0] = P(bu, bv, cz - 0.02), [ex, ey] = P(bu + sw, bv + sw * 0.4, cz - len * 0.95);
    const col = ["#b7d84c", "#9ec23c", "#cde866", "#86b232", "#d9ee7c"][i % 5], midx = (x0 + ex) / 2 + sw * 18;
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(midx, lerp(y0, ey, 0.55), ex, ey); c.strokeStyle = col; c.lineWidth = 1.7 + hash(i) * 1.1; c.stroke();
    c.fillStyle = col; for (let j = 1; j < 4; j++) { const f = j / 4; c.beginPath(); c.ellipse(lerp(x0, ex, f) + (j % 2 ? 1.6 : -1.6) + sw * 6 * f, lerp(y0, ey, f), 1.5, 3.2, 0.3, 0, TAU); c.fill(); }
  }
}
export function lantern(k, u, v, t) {
  const c = k.ctx, lit = 0.8 + 0.2 * Math.sin(t * 6 + 1);
  k.ell(u + 0.12, v + 0.06, 0, 0.34, "rgba(40,50,30,0.22)", { stroke: false });
  k.box(u - 0.22, v - 0.22, 0, 0.44, 0.44, 0.12, "#b9b3a5", { hatch: false, shadow: false });
  k.box(u - 0.09, v - 0.09, 0.12, 0.18, 0.18, 0.48, "#c4beb0", { hatch: false, shadow: false });
  k.box(u - 0.21, v - 0.21, 0.6, 0.42, 0.42, 0.07, "#bdb7a8", { hatch: false, shadow: false });
  k.box(u - 0.14, v - 0.14, 0.67, 0.28, 0.28, 0.3, "#c9c3b4", { hatch: false, shadow: false, noTop: true });
  k.poly([[u - 0.1, v + 0.14, 0.72], [u + 0.1, v + 0.14, 0.72], [u + 0.1, v + 0.14, 0.92], [u - 0.1, v + 0.14, 0.92]], `rgb(255,${Math.round(190 + 30 * lit)},110)`, { lw: 0.8, wobble: 0 });
  const [gx, gy] = P(u, v + 0.14, 0.82); c.fillStyle = "rgba(255,200,110,0.2)"; c.beginPath(); c.arc(gx, gy, 14 + lit * 3, 0, TAU); c.fill();
  k.hip(u - 0.34, v - 0.34, 0.97, 0.68, 0.68, 0.3, "#b0aa9b", { inset: 0.2 });
  const [jx, jy] = P(u, v, 1.3); k.circle(jx, jy, 2.4, "#c9c3b4", { lw: 0.9 });
}
export function fencePosts(k, pts) {
  for (let i = 0; i < pts.length; i++) {
    const [u, v] = pts[i];
    if (i) { const [pu, pv] = pts[i - 1]; k.line3([[pu, pv, 0.3], [u, v, 0.3]], { stroke: "#7a5a34", lw: 1.3, wobble: 0 }); k.line3([[pu, pv, 0.16], [u, v, 0.16]], { stroke: "#7a5a34", lw: 1.3, wobble: 0 }); }
  }
  for (const [u, v] of pts) { k.line3([[u, v, 0], [u, v, 0.4]], { stroke: INK, lw: 5, wobble: 0 }); k.line3([[u, v, 0], [u, v, 0.4]], { stroke: "#a07a46", lw: 3, wobble: 0 }); }
}
export function bush(k, u, v, r, pal, seed, z = 0) {
  const c = k.ctx, R = rng(seed + Math.round(u * 9 + v * 5)); k.ell(u + 0.1, v + 0.05, z, r * 0.9, "rgba(40,50,30,0.2)", { stroke: false });
  for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU + R(), [x, y] = P(u + Math.cos(a) * r * 0.5, v + Math.sin(a) * r * 0.5, z + r * (0.3 + R() * 0.25)); k._lobe(x, y, CTS.S * r * (0.5 + R() * 0.15), pal[i % pal.length], seed * 11 + i, { squash: 0.82, bumps: 7, lw: 1.1 }); }
}
export function flowerBush(k, u, v, r, leaf, bloom, seed, t = 0, z = 0) {
  bush(k, u, v, r, leaf, seed, z);
  const R = rng(seed * 3 + 5), c = k.ctx, n = Math.round(r * 26);
  for (let i = 0; i < n; i++) { const a = R() * TAU, d = Math.sqrt(R()) * r * 0.85, [x, y] = P(u + Math.cos(a) * d, v + Math.sin(a) * d, z + r * (0.35 + R() * 0.5)), col = bloom[i % bloom.length], pr = 1.7 + R() * 1.2 + Math.sin(t * 2 + i) * 0.15; c.fillStyle = col; c.beginPath(); c.arc(x, y, pr, 0, TAU); c.fill(); c.fillStyle = "rgba(255,230,140,0.8)"; c.beginPath(); c.arc(x, y, pr * 0.32, 0, TAU); c.fill(); }
}
// falling petals over a ground rectangle, deterministic; every petal anchored to P()
export function petals(k, t, u0, u1, v0, v1, zTop, n, o = {}) {
  const c = k.ctx, col = o.col || "#f7bccb";
  for (let i = 0; i < n; i++) {
    const h1 = hash(i * 1.37 + (o.seed || 0)), h2 = hash(i * 7.11 + 3 + (o.seed || 0)), h3 = hash(i * 3.3 + 9 + (o.seed || 0)), T = (o.T ?? 7) * (0.7 + h2 * 0.6);
    const f = ((t / T + h1) % 1 + 1) % 1;
    const u = clamp(lerp(u0, u1, h2) + Math.sin(t * 1.3 + h1 * 12) * 0.12 + f * 0.3, u0, u1), v = clamp(lerp(v0, v1, h3) + Math.cos(t * 1.1 + h2 * 9) * 0.1, v0, v1);
    const [x, y] = P(u, v, zTop * (1 - f)), a = Math.min(1, f * 6, (1 - f) * 4);
    c.save(); c.translate(x, y); c.rotate(t * 2 + i); c.globalAlpha = a * 0.95; c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, 2.6, 1.5 + Math.sin(t * 5 + i) * 0.6, 0, 0, TAU); c.fill(); c.restore();
  }
  c.globalAlpha = 1;
}
// walker with a z profile (bridge / tiers)
export function zWalker(k, route, o, zf) {
  const s = k.walkerState(route, o);
  drawHuman(k, s.u, s.v, { ...o, z: zf(s.u, s.v), dir: [s.du, s.dv], pose: s.moving ? "walk" : (o.idle || "stand"), p: s.p, kid: o.kid ?? false });
  return s;
}
export const stoneStep = (k, u, v, du, dv, seed) => k.ground([[u, v], [u + du, v], [u + du, v + dv], [u, v + dv]], "#ece3cb", { lw: 0.9, wobble: 0, stroke: "rgba(110,95,70,0.55)" });
