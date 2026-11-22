// DUBAI shared helpers: people looks, date palms, arabic arches/buildings, boats + wakes, glass towers, rails.
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
export function crowd(k, routes, specs) {
  for (const [r, off, seed, sp, ex] of specs) k.qwalker(routes[r], { speed: sp ?? 0.4 + (seed % 5) * 0.03, offset: off, seed, dwell: 1.2 + (seed % 3) * 0.6, ...look(seed), ...(ex || {}) });
}

// ---------- ground bits ----------
// Sutherland-Hodgman clip of a (u,v) polygon by a half plane f(u,v) >= 0
export function clipPoly(poly, f) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], fa = f(a[0], a[1]), fb = f(b[0], b[1]);
    if (fa >= 0) out.push(a);
    if ((fa >= 0) !== (fb >= 0)) { const s = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s]); }
  }
  return out;
}
export const circlePoly = (u, v, r, n = 28, sq = 1) => Array.from({ length: n }, (_, i) => [u + Math.cos((i / n) * 6.2832) * r, v + Math.sin((i / n) * 6.2832) * r * sq]);
export const rect = (u, v, du, dv) => [[u, v], [u + du, v], [u + du, v + dv], [u, v + dv]];

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
// point on a building face: face "L" runs along u at v+dv, face "R" along v at u+du
export const facePt = (face, u, v, du, dv) => (a, z) => (face === "L" ? P(u + a, v + dv, z) : P(u + du, v + a, z));
export function archShape(F, a0, z0, w, h, n = 10) {
  const r = w / 2, zs = z0 + h - r, pts = [F(a0, z0), F(a0, zs)];
  for (let i = 1; i < n; i++) { const th = Math.PI * (i / n); pts.push(F(a0 + r - Math.cos(th) * r, zs + Math.sin(th) * r * 1.1)); }
  pts.push(F(a0 + w, zs), F(a0 + w, z0));
  return pts;
}
export function arches(k, face, u, v, du, dv, z0, n, o = {}) {
  const run = face === "L" ? du : dv, F = facePt(face, u, v, du, dv), c = k.ctx;
  const mx = o.mx ?? 0.2, w = o.w ?? (run - mx * 2) / n * 0.62, h = o.h ?? 0.8, cw = (run - mx * 2) / n;
  for (let i = 0; i < n; i++) {
    const a0 = mx + i * cw + (cw - w) / 2, sh = shade(o.col || "#8c5a35", face === "R" ? -0.25 : 0);
    const pts = archShape(F, a0, z0, w, h);
    k.path(pts, { fill: o.lit ? "#ffd27a" : sh, lw: 1.1, wobble: 0 });
    if (o.lit) { c.save(); c.beginPath(); pts.forEach((p, j) => (j ? c.lineTo(...p) : c.moveTo(...p))); c.clip(); const g = c.createLinearGradient(0, F(0, z0)[1], 0, F(0, z0 + h)[1]); g.addColorStop(0, "rgba(255,200,100,0.95)"); g.addColorStop(1, "rgba(200,120,50,0.9)"); c.fillStyle = g; c.fillRect(0, 0, 1024, 1024); c.restore(); k.path(pts, { lw: 1.1, wobble: 0 }); }
    // frame / sill
    k.line([F(a0 - 0.03, z0), F(a0 - 0.03, z0 + h - w / 2), F(a0 + w + 0.03, z0 + h - w / 2), F(a0 + w + 0.03, z0)], { lw: 0.6, stroke: "rgba(80,50,25,0.45)", wobble: 0 });
  }
}
export function merlons(k, u, v, du, dv, z, n = 8, col = SAND) {
  for (let i = 0; i < n; i++) { const a = (i + 0.2) / n; k.box(u + du * a, v + dv - 0.06, z, du / n * 0.55, 0.06, 0.16, col, { hatch: false, shadow: false }); }
  for (let i = 0; i < Math.max(2, Math.round(n * dv / du)); i++) { const m = Math.max(2, Math.round(n * dv / du)); k.box(u + du - 0.06, v + dv * (i + 0.2) / m, z, 0.06, dv / m * 0.55, 0.16, col, { hatch: false, shadow: false }); }
}
// sandstone building: box + arches on both faces + merlon roofline
export function sandBldg(k, u, v, du, dv, h, o = {}) {
  const col = o.col || SAND;
  k.box(u, v, 0, du, dv, h, col, { hatch: false, left: o.left, right: o.right });
  const rows = o.rows ?? 2, fh = h / rows;
  for (let r = 0; r < rows; r++) {
    const lit = r === 0 && o.arcade;
    const hh = lit ? Math.min(1.0, fh * 0.8) : fh * 0.5;
    arches(k, "L", u, v, du, dv, r * fh + (lit ? 0.05 : fh * 0.28), Math.max(2, Math.round(du / (o.pitch ?? 0.62))), { h: hh, lit, mx: 0.15 });
    arches(k, "R", u, v, du, dv, r * fh + (lit ? 0.05 : fh * 0.28), Math.max(2, Math.round(dv / (o.pitch ?? 0.62))), { h: hh, lit, mx: 0.15 });
  }
  // cornice line
  k.line([P(u, v + dv, h - 0.1), P(u + du, v + dv, h - 0.1), P(u + du, v, h - 0.1)], { lw: 1.2, stroke: shade(col, -0.3), wobble: 0 });
  if (o.merlons !== false) merlons(k, u, v, du, dv, h, Math.max(4, Math.round(du / 0.4)), col);
}
// traditional wind tower (barjeel): square shaft + louvred top, flat cap
export function windTower(k, u, v, z, s, h, col = SAND_L) {
  k.box(u, v, z, s, s, h, col, { hatch: false });
  const top = z + h - 0.55;
  for (const face of ["L", "R"]) {
    const F = facePt(face, u, v, s, s);
    for (let i = 0; i < 3; i++) {
      const a0 = 0.14 + i * (s - 0.28) / 3;
      k.path(archShape(F, a0, top, (s - 0.28) / 3 - 0.05, 0.42, 6), { fill: "#5a3a22", lw: 0.7, wobble: 0 });
    }
  }
  k.box(u - 0.05, v - 0.05, z + h, s + 0.1, s + 0.1, 0.1, shade(col, -0.08), { hatch: false, shadow: false });
}
// geometric dome / minaret-ish lamp post in gold
export function goldLamp(k, u, v, h = 1.5) { k.lamp(u, v, { col: "#3a3028", h }); }

// ---------- water traffic ----------
// hull polygon along direction [du,dv]; len/wid in tile units, returns nothing. cabin: {l,w,h,col}
export function boat(k, u, v, dir, o = {}) {
  const c = k.ctx, L = o.len ?? 1.2, W = o.wid ?? 0.4, H = o.h ?? 0.2, col = o.col || "#f4f1e8";
  let [a, b] = dir; const l = Math.hypot(a, b) || 1; a /= l; b /= l; const n = [-b, a];
  const pt = (f, s, z) => P(u + a * f * L / 2 + n[0] * s * W / 2, v + b * f * L / 2 + n[1] * s * W / 2, z + (o.z ?? 0));
  const prof = [[1, 0], [0.75, 0.82], [0.2, 1], [-0.7, 1], [-1, 0.78], [-1, -0.78], [-0.7, -1], [0.2, -1], [0.75, -0.82]];
  // soft shadow on water
  k.ell(u + 0.05, v + 0.04, 0, W * 0.9, "rgba(20,60,80,0.18)", { stroke: false });
  const hull = (z) => prof.map(([f, s]) => pt(f, s, z));
  const top = hull(H), bot = hull(0);
  for (let i = 0; i < prof.length; i++) { const j = (i + 1) % prof.length; k.path([bot[i], bot[j], top[j], top[i]], { fill: shade(o.hullCol || col, -0.22), lw: 1, wobble: 0 }); }
  k.path(top, { fill: o.deck || shade(col, 0.04), lw: 1.4, wobble: 0 });
  if (o.cabin) {
    const cb = o.cabin, cl = cb.l ?? 0.5, cw = cb.w ?? 0.5, ch = cb.h ?? 0.25, cf = cb.f ?? -0.1;
    const q = (f, s, z) => pt(cf + f * cl / L * 1, s * cw, z + H);
    const f0 = q(-1, -1, 0), f1 = q(1, -1, 0), f2 = q(1, 1, 0), f3 = q(-1, 1, 0), t0 = q(-1, -1, ch), t1 = q(1, -1, ch), t2 = q(1, 1, ch), t3 = q(-1, 1, ch);
    const faces = [[f0, f1, t1, t0], [f1, f2, t2, t1], [f2, f3, t3, t2], [f3, f0, t0, t3]];
    faces.sort((p, q2) => (p[0][1] + p[1][1]) - (q2[0][1] + q2[1][1]));
    for (const fc of faces) k.path(fc, { fill: cb.glass ? "#8fb7cc" : shade(cb.col || col, -0.12), lw: 1, wobble: 0 });
    k.path([t0, t1, t2, t3], { fill: cb.roof || "#fff", lw: 1.2, wobble: 0 });
  }
  if (o.canopy) { // awning on poles (abra)
    const cz = H + 0.38, q = (f, s) => pt(f, s, cz);
    for (const [f, s] of [[-0.6, -0.8], [-0.6, 0.8], [0.45, -0.8], [0.45, 0.8]]) { const p0 = pt(f, s, H), p1 = pt(f, s, cz); c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.moveTo(...p0); c.lineTo(...p1); c.stroke(); }
    k.path([q(-0.75, -0.95), q(0.6, -0.95), q(0.6, 0.95), q(-0.75, 0.95)], { fill: o.canopy, lw: 1.3, wobble: 0 });
  }
}
// V-shaped wake trailing behind a moving boat; speed 0 draws only ripples
export function wake(k, u, v, dir, o = {}) {
  const c = k.ctx, t = k.t;
  let [a, b] = dir; const l = Math.hypot(a, b) || 1; a /= l; b /= l; const n = [-b, a], len = o.len ?? 2.2, w = o.w ?? 0.5;
  c.lineCap = "round";
  for (const sd of [-1, 1]) {
    const pts = []; for (let i = 0; i <= 8; i++) { const f = i / 8; pts.push(P(u - a * (0.2 + f * len) + n[0] * sd * (0.15 + f * w), v - b * (0.2 + f * len) + n[1] * sd * (0.15 + f * w), 0)); }
    for (let i = 0; i < 8; i++) { c.strokeStyle = `rgba(255,255,255,${0.75 * (1 - i / 8)})`; c.lineWidth = 2.2 * (1 - i / 10); c.beginPath(); c.moveTo(...pts[i]); c.lineTo(...pts[i + 1]); c.stroke(); }
  }
  for (let i = 0; i < 5; i++) { const f = ((t * 0.9 + i / 5) % 1); const [x, y] = P(u - a * (0.25 + f * len * 0.8), v - b * (0.25 + f * len * 0.8), 0); c.fillStyle = `rgba(255,255,255,${0.8 * (1 - f)})`; c.beginPath(); c.ellipse(x, y, 3 + f * 4, 1.4 + f * 1.6, 0, 0, 6.3); c.fill(); }
}
// a looped route position {u,v,du,dv}; speed in units/s
export function onLoop(k, path, speed, off = 0) { const sp = k.along(path, (k.t * speed + off) / 1, "loop"); return sp; }
export function loopPos(k, path, speed, off = 0) {
  // k.along(path, f, 'loop') samples f * L; we want distance = t*speed+off, so f = dist / L
  const s0 = k.along(path, 0, "loop"), L = s0.L;
  return k.along(path, (k.t * speed + off) / L, "loop");
}

// ---------- railings ----------
export function rail(k, pts, h = 0.38, o = {}) {
  const c = k.ctx, col = o.col || "#7a5a38";
  const n = pts.length;
  c.lineCap = "round";
  // posts
  for (let i = 0; i < n - 1; i++) {
    const [u0, v0] = pts[i], [u1, v1] = pts[i + 1], L = Math.hypot(u1 - u0, v1 - v0), m = Math.max(1, Math.round(L / (o.gap ?? 0.28)));
    for (let j = 0; j <= m; j++) { if (i > 0 && j === 0) continue; const [x, y] = P(lerp(u0, u1, j / m), lerp(v0, v1, j / m), o.z ?? 0), [, yt] = P(lerp(u0, u1, j / m), lerp(v0, v1, j / m), (o.z ?? 0) + h); c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt); c.stroke(); }
  }
  k.line(pts.map(([u, v]) => P(u, v, (o.z ?? 0) + h)), { lw: 1.8, wobble: 0, stroke: INK });
  k.line(pts.map(([u, v]) => P(u, v, (o.z ?? 0) + h)), { lw: 0.9, wobble: 0, stroke: col });
}

// ---------- glass towers ----------
export function glassCyl(k, u, v, z0, z1, r, o = {}) {
  const c = k.ctx, t = k.t, [x, yb] = P(u, v, z0), [, yt] = P(u, v, z1);
  const rx = r * CTS.S * Math.SQRT2, ry = rx * CTS.YS, seed = o.seed ?? 1;
  const cols = o.cols || ["#e9d6a4", "#a9cde2", "#6e9cc0", "#3f6c94"];
  const g = c.createLinearGradient(x - rx, 0, x + rx, 0);
  g.addColorStop(0, cols[0]); g.addColorStop(0.3, cols[1]); g.addColorStop(0.7, cols[2]); g.addColorStop(1, cols[3]);
  c.beginPath(); c.moveTo(x - rx, yt); c.lineTo(x - rx, yb); c.ellipse(x, yb, rx, ry, 0, Math.PI, 0, true); c.lineTo(x + rx, yt); c.closePath();
  c.fillStyle = g; c.fill();
  c.save(); c.clip();
  // vertical fins
  c.lineWidth = 0.9;
  const nf = Math.max(3, Math.round(rx / 3.4));
  for (let i = 1; i < nf; i++) { const s = -1 + (2 * i) / nf, xx = x + s * rx; c.strokeStyle = `rgba(30,60,90,${0.18 + 0.12 * (s + 1) / 2})`; c.beginPath(); c.moveTo(xx, yt); c.lineTo(xx, yb + ry); c.stroke(); }
  // window bands (curved)
  const band = o.band ?? 0.2;
  c.strokeStyle = "rgba(255,255,255,0.22)"; c.lineWidth = 0.8;
  for (let z = z0 + band; z < z1; z += band) { const [, yy] = P(u, v, z); c.beginPath(); c.moveTo(x - rx, yy); c.quadraticCurveTo(x, yy + ry * 2, x + rx, yy); c.stroke(); }
  // sun glint sweeping across
  const gx = x - rx + ((t * 0.12 + seed * 0.37) % 1.6 - 0.3) * rx * 2;
  const gg = c.createLinearGradient(gx - 8, 0, gx + 8, 0); gg.addColorStop(0, "rgba(255,255,255,0)"); gg.addColorStop(0.5, "rgba(255,255,255,0.4)"); gg.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = gg; c.fillRect(gx - 8, yt, 16, yb - yt + ry);
  // twinkling panes
  const R = rng(seed * 91 + Math.round(z0 * 10));
  for (let i = 0; i < Math.round((yb - yt) / 7); i++) { const px = x + (R() * 2 - 1) * rx * 0.85, py = yt + R() * (yb - yt), ph = R() * 6.28, a = Math.max(0, Math.sin(t * 2.2 + ph)); if (a > 0.7) { c.fillStyle = `rgba(255,255,255,${(a - 0.7) * 2.4})`; c.fillRect(px - 1, py - 1, 2, 2); } }
  c.restore();
  c.strokeStyle = INK; c.lineWidth = o.lw ?? 1.5; c.lineJoin = "round";
  c.beginPath(); c.moveTo(x - rx, yt); c.lineTo(x - rx, yb); c.ellipse(x, yb, rx, ry, 0, Math.PI, 0, true); c.lineTo(x + rx, yt); c.stroke();
  if (o.cap !== false) { // silver mechanical band + roof
    const [, yc] = P(u, v, z1 - 0.1);
    c.beginPath(); c.ellipse(x, yt, rx, ry, 0, 0, 6.3); c.fillStyle = o.capCol || "#d4dbe0"; c.fill(); c.stroke();
    c.beginPath(); c.ellipse(x, yt, rx * 0.62, ry * 0.62, 0, 0, 6.3); c.fillStyle = "#bfc8cf"; c.fill(); c.lineWidth = 0.8; c.stroke();
  }
}

// a rectangular glass tower slab (for the marina): box with window rows on both faces
export function glassBox(k, u, v, du, dv, h, o = {}) {
  const c = k.ctx, col = o.col || "#7fa9c6";
  const f = k.box(u, v, 0, du, dv, h, col, { hatch: false, left: o.left || "#9cc3dc", right: o.right || "#5d86a6", top: o.top || "#c9d6de" });
  const band = o.band ?? 0.24;
  for (const [face, poly, a] of [["L", f.left, 0.5], ["R", f.right, 0.3]]) {
    c.save(); c.beginPath(); poly.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.clip();
    c.strokeStyle = `rgba(255,255,255,${a * 0.55})`; c.lineWidth = 0.8;
    const F = facePt(face, u, v, du, dv), run = face === "L" ? du : dv;
    c.beginPath(); for (let z = band; z < h; z += band) { c.moveTo(...F(0, z)); c.lineTo(...F(run, z)); } c.stroke();
    c.strokeStyle = "rgba(20,50,80,0.28)"; c.beginPath(); const m = Math.max(2, Math.round(run / 0.18)); for (let i = 1; i < m; i++) { c.moveTo(...F(run * i / m, 0)); c.lineTo(...F(run * i / m, h)); } c.stroke();
    c.restore();
  }
  return f;
}

// sparkles on water (cheap twinkles) inside a polygon bbox in (u,v)
export function glitter(k, u0, v0, u1, v1, n = 40, seed = 3) {
  const c = k.ctx, R = rng(seed), t = k.t;
  for (let i = 0; i < n; i++) { const [x, y] = P(lerp(u0, u1, R()), lerp(v0, v1, R()), 0), a = Math.max(0, Math.sin(t * 2.4 + R() * 6.28)); if (a > 0.6) { c.fillStyle = `rgba(255,255,255,${(a - 0.6) * 2})`; c.fillRect(x - 1.5, y - 0.5, 3, 1); c.fillRect(x - 0.5, y - 1.5, 1, 3); } }
}

export function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }
