// vec-kit — everything-in-code isometric drawing kit for World Cities v7.
//
// Canonical tile space (CTS): one tile = 10 x 10 ground units (u to the right-back corner,
// v to the left-back corner, z up). CTS pixels: 1024 x 1024 canvas, same projection as the
// stage (xScale 1, yScale 0.577, zScale 0.94), S px per unit. The stage maps CTS pixels to the
// screen with one uniform scale + translate, so a traced tile lands exactly on the grid.
//
// Visible faces from the camera: TOP (z+dz), LEFT = the v+dv face, RIGHT = the u+du face.
// Depth: larger u+v is nearer the viewer. Use k.q(depth, fn) + k.flush() to interleave
// moving people/cars with static props.
//
// Style (matches the SF reference): flat fills, one warm-black outline, left faces a touch
// darker than top, right faces darker again, light hatching on right faces, chunky round people.

import { drawHuman, walkState, spline, outfit } from "./vec-people.js";
export { drawHuman, walkState, spline, outfit };

export const CTS = { W: 1024, H: 1024, S: 45, X0: 512, Y0: 405, XS: 1, YS: 0.577, ZS: 0.94, SLAB: 0.46 };

// audit hook: tools/audit-tiles.mjs sets AUDIT.on to count projected points and how many lie outside the tile
export const AUDIT = { on: false, n: 0, out: 0, recent: [] };
export function P(u, v, z = 0) {
  if (AUDIT.on) {
    AUDIT.n++; if (u < -0.35 || u > 10.35 || v < -0.35 || v > 10.35) AUDIT.out++;
    const r = AUDIT.recent; r.push(CTS.X0 + (u - v) * CTS.S * CTS.XS, CTS.Y0 + (u + v) * CTS.S * CTS.YS - z * CTS.S * CTS.ZS); if (r.length > 160) r.splice(0, 2);
  }
  return [CTS.X0 + (u - v) * CTS.S * CTS.XS, CTS.Y0 + (u + v) * CTS.S * CTS.YS - z * CTS.S * CTS.ZS];
}

export const INK = "#2a2420";

// ---------- colour + maths helpers ----------
export const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
export function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
export function rng(seed) {
  let a = (seed * 2654435761) >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function hexToRgb(h) { h = h.replace("#", ""); if (h.length === 3) h = h.split("").map((c) => c + c).join(""); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
export function shade(hex, pct) {
  if (!hex || hex[0] !== "#") return hex;
  const [r, g, b] = hexToRgb(hex);
  const f = (c) => Math.round(clamp(pct < 0 ? c * (1 + pct) : c + (255 - c) * pct, 0, 255));
  return "#" + [f(r), f(g), f(b)].map((c) => c.toString(16).padStart(2, "0")).join("");
}
export function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return "#" + A.map((c, i) => Math.round(lerp(c, B[i], t)).toString(16).padStart(2, "0")).join("");
}

// palettes for people / cars
export const SKIN = ["#f1c9a5", "#e0ac84", "#c68a62", "#9a6544", "#6e4630", "#f5d6bc"];
export const HAIR = ["#2a211c", "#4a3424", "#7a4f2c", "#c99a5a", "#1c1a1a", "#8c8c8c", "#a8442e"];
export const SHIRT = ["#d9534a", "#3f6fa8", "#e8c14a", "#5f9e6e", "#f2efe6", "#e58a3c", "#7a5ea8", "#2e4a6b", "#e27fa0", "#48a3a0"];
export const PANTS = ["#2e3d5c", "#3b3b3b", "#6b5a45", "#25324a", "#7d8a99", "#4a3b30"];
export const CARS = ["#d64e46", "#3f73b5", "#f0c94a", "#f2efe6", "#5f9e6e", "#2b3f5c", "#e58a3c", "#9aa7b3"];

// ---------- the kit ----------
export class Kit {
  constructor(ctx, t = 0, opts = {}) {
    this.ctx = ctx;
    this.t = t;
    this.lw = opts.lw ?? 1.7;
    this.wob = opts.wobble ?? 0.55;
    this.inStage = !!opts.stage; // in the city video: skip per-tile sky clutter (clouds)
    this._q = [];
    this.P = P;
  }

  // ----- low level paths -----
  _trace(pts, close, wob) {
    const c = this.ctx;
    c.beginPath();
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const [x, y] = pts[i];
      if (i === 0) { c.moveTo(x, y); continue; }
      const [px, py] = pts[i - 1];
      this._seg(px, py, x, y, wob, i);
    }
    if (close && n > 2) {
      const [px, py] = pts[n - 1];
      this._seg(px, py, pts[0][0], pts[0][1], wob, n);
      c.closePath();
    }
  }
  _seg(x0, y0, x1, y1, wob, i) {
    const c = this.ctx;
    const len = Math.hypot(x1 - x0, y1 - y0);
    if (!wob || len < 18) { c.lineTo(x1, y1); return; }
    // one gentle bow per edge, seeded by the edge's endpoints (stable for static geometry)
    const s = hash(Math.round(x0) * 13.1 + Math.round(y0) * 7.7 + Math.round(x1) * 3.3 + Math.round(y1) * 1.9);
    const amp = (s - 0.5) * 2 * wob * Math.min(1.6, len / 60);
    const nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
    c.quadraticCurveTo((x0 + x1) / 2 + nx * amp, (y0 + y1) / 2 + ny * amp, x1, y1);
  }
  // pts: 2D CTS pixels
  path(pts, o = {}) {
    const c = this.ctx;
    const close = o.close ?? true;
    this._trace(pts, close, o.wobble ?? this.wob);
    if (o.alpha != null) c.globalAlpha = o.alpha;
    if (o.fill && close) { c.fillStyle = o.fill; c.fill(); }
    if (o.stroke !== false) {
      c.strokeStyle = o.stroke || INK;
      c.lineWidth = o.lw ?? this.lw;
      c.lineJoin = "round"; c.lineCap = "round";
      c.stroke();
    }
    if (o.alpha != null) c.globalAlpha = 1;
  }
  line(pts, o = {}) { this.path(pts, { ...o, close: false, fill: null }); }
  poly(pts3, fill, o = {}) { this.path(pts3.map((p) => P(p[0], p[1], p[2] || 0)), { ...o, fill }); }
  line3(pts3, o = {}) { this.line(pts3.map((p) => P(p[0], p[1], p[2] || 0)), o); }
  circle(x, y, r, fill, o = {}) {
    const c = this.ctx;
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (o.stroke !== false) { c.strokeStyle = o.stroke || INK; c.lineWidth = o.lw ?? this.lw; c.stroke(); }
  }
  // ground-plane ellipse (circle of radius r units at height z)
  ell(u, v, z, r, fill, o = {}) {
    const [x, y] = P(u, v, z);
    const c = this.ctx;
    c.beginPath();
    c.ellipse(x, y, r * CTS.S * Math.SQRT2, r * CTS.S * Math.SQRT2 * CTS.YS, 0, 0, Math.PI * 2);
    if (o.alpha != null) c.globalAlpha = o.alpha;
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (o.stroke !== false) { c.strokeStyle = o.stroke || INK; c.lineWidth = o.lw ?? this.lw; c.stroke(); }
    c.globalAlpha = 1;
  }
  shadow(pts3, a = 0.13) { this.poly(pts3, `rgba(60,45,30,${a})`, { stroke: false }); }
  hatch(pts2, o = {}) {
    // light diagonal hatching clipped to a 2D polygon
    const c = this.ctx;
    c.save();
    this._trace(pts2, true, 0); c.clip();
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    for (const [x, y] of pts2) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    c.strokeStyle = o.color || "rgba(42,36,32,0.22)";
    c.lineWidth = o.lw ?? 1;
    const gap = o.gap ?? 6, ang = o.ang ?? -1.1;
    const dx = Math.cos(ang), dy = Math.sin(ang);
    const L = (maxX - minX) + (maxY - minY);
    c.beginPath();
    for (let s = -L; s < L; s += gap) {
      const ox = minX + s, oy = maxY;
      c.moveTo(ox - dx * L, oy - dy * L); c.lineTo(ox + dx * L, oy + dy * L);
    }
    c.stroke();
    c.restore();
  }

  // ----- solids -----
  // box faces: returns the three 2D face polygons so callers can add windows/hatching
  box(u, v, z, du, dv, dz, col, o = {}) {
    const top = [[u, v, z + dz], [u + du, v, z + dz], [u + du, v + dv, z + dz], [u, v + dv, z + dz]];
    const left = [[u, v + dv, z], [u + du, v + dv, z], [u + du, v + dv, z + dz], [u, v + dv, z + dz]];
    const right = [[u + du, v, z], [u + du, v + dv, z], [u + du, v + dv, z + dz], [u + du, v, z + dz]];
    const cl = o.left || shade(col, -0.07), cr = o.right || shade(col, -0.2), ct = o.top || shade(col, 0.06);
    if (o.shadow !== false && z <= 0.01) this.shadow([[u + du, v, 0], [u + du + dz * 0.45, v + dz * 0.12, 0], [u + du + dz * 0.45, v + dv + dz * 0.12, 0], [u + du, v + dv, 0]], 0.1);
    const f = { top: top.map((p) => P(...p)), left: left.map((p) => P(...p)), right: right.map((p) => P(...p)) };
    this.path(f.left, { fill: cl });
    this.path(f.right, { fill: cr });
    if (o.hatch !== false && dz > 0.6) this.hatch(f.right, { gap: 7 });
    if (o.noTop !== true) this.path(f.top, { fill: ct });
    return f;
  }
  // grid of windows on a face. side 'L' (v+dv face, runs along u) or 'R' (u+du face, runs along v)
  windows(u, v, z, du, dv, dz, o = {}) {
    const rows = o.rows ?? 3, cols = o.cols ?? 4, side = o.side || "L";
    const run = side === "L" ? du : dv;
    const mx = o.mx ?? 0.18, my = o.my ?? 0.2;
    const cw = (run - mx * 2) / cols, rh = (dz - (o.base ?? my) - my) / rows;
    const ww = cw * (o.w ?? 0.55), wh = rh * (o.h ?? 0.6);
    const col = o.color || "#5d7486";
    for (let r = 0; r < rows; r++) for (let ci = 0; ci < cols; ci++) {
      const a = mx + ci * cw + (cw - ww) / 2;
      const zb = z + (o.base ?? my) + r * rh + (rh - wh) / 2;
      let q;
      if (side === "L") q = [[u + a, v + dv, zb], [u + a + ww, v + dv, zb], [u + a + ww, v + dv, zb + wh], [u + a, v + dv, zb + wh]];
      else q = [[u + du, v + a, zb], [u + du, v + a + ww, zb], [u + du, v + a + ww, zb + wh], [u + du, v + a, zb + wh]];
      const lit = o.lit && hash(r * 31 + ci * 7 + (o.seed || 0)) < o.lit;
      this.poly(q, lit ? "#f3d57a" : (side === "R" ? shade(col, -0.15) : col), { lw: o.lw ?? 1.3, wobble: 0 });
      if (o.arch) { const [x0, y0] = P(...q[3]); const [x1, y1] = P(...q[2]); this.ctx.beginPath(); this.ctx.moveTo(x0, y0); this.ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 - wh * CTS.S * 0.45, x1, y1); this.ctx.fillStyle = col; this.ctx.fill(); this.ctx.strokeStyle = INK; this.ctx.lineWidth = 1.2; this.ctx.stroke(); }
      if (o.balcony) { const b = side === "L" ? [[u + a - 0.05, v + dv + 0.12, zb], [u + a + ww + 0.05, v + dv + 0.12, zb]] : [[u + du + 0.12, v + a - 0.05, zb], [u + du + 0.12, v + a + ww + 0.05, zb]]; this.line3(b, { lw: 1.6, wobble: 0 }); }
    }
  }
  // pitched roof over a box footprint; ridge along 'u' or 'v'
  gable(u, v, z, du, dv, h, col, o = {}) {
    const ridge = o.ridge || "u";
    const cl = shade(col, -0.05), cr = shade(col, -0.22);
    if (ridge === "u") {
      const r0 = [u, v + dv / 2, z + h], r1 = [u + du, v + dv / 2, z + h];
      this.poly([[u + du, v, z], [u + du, v + dv, z], r1], shade(col, -0.28)); // gable end (right)
      this.poly([[u, v + dv, z], [u + du, v + dv, z], r1, r0], cl);
    } else {
      const r0 = [u + du / 2, v, z + h], r1 = [u + du / 2, v + dv, z + h];
      this.poly([[u, v + dv, z], [u + du, v + dv, z], r1], shade(col, -0.12));
      this.poly([[u + du, v, z], [u + du, v + dv, z], r1, r0], cr);
    }
  }
  hip(u, v, z, du, dv, h, col, o = {}) {
    const inset = o.inset ?? Math.min(du, dv) * 0.35;
    const a = [u + inset, v + inset, z + h], b = [u + du - inset, v + inset, z + h], c = [u + du - inset, v + dv - inset, z + h], d = [u + inset, v + dv - inset, z + h];
    this.poly([[u, v + dv, z], [u + du, v + dv, z], c, d], shade(col, -0.04));
    this.poly([[u + du, v, z], [u + du, v + dv, z], c, b], shade(col, -0.2));
    if (inset < Math.min(du, dv) / 2 - 0.01) this.poly([a, b, c, d], shade(col, 0.08));
  }
  // vertical cylinder (r in units)
  cyl(u, v, z, r, h, col, o = {}) {
    const [x, y0] = P(u, v, z), [, y1] = P(u, v, z + h);
    const rx = r * CTS.S * Math.SQRT2, ry = rx * CTS.YS;
    const c = this.ctx;
    const g = c.createLinearGradient(x - rx, 0, x + rx, 0);
    g.addColorStop(0, shade(col, -0.02)); g.addColorStop(0.55, shade(col, -0.1)); g.addColorStop(1, shade(col, -0.26));
    c.beginPath(); c.moveTo(x - rx, y1); c.lineTo(x - rx, y0); c.ellipse(x, y0, rx, ry, 0, Math.PI, 0, true); c.lineTo(x + rx, y1); c.closePath();
    c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = this.lw; c.stroke();
    if (o.top !== false) { c.beginPath(); c.ellipse(x, y1, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = o.topCol || shade(col, 0.08); c.fill(); c.stroke(); }
  }
  dome(u, v, z, r, h, col, o = {}) {
    const [x, y] = P(u, v, z);
    const rx = r * CTS.S * Math.SQRT2, ry = rx * CTS.YS, hh = h * CTS.S * CTS.ZS;
    const c = this.ctx;
    const g = c.createLinearGradient(x - rx, y - hh, x + rx, y);
    g.addColorStop(0, shade(col, 0.12)); g.addColorStop(0.6, col); g.addColorStop(1, shade(col, -0.25));
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI); c.bezierCurveTo(x - rx, y - hh * 0.75, x - rx * 0.55, y - hh, x, y - hh); c.bezierCurveTo(x + rx * 0.55, y - hh, x + rx, y - hh * 0.75, x + rx, y);
    c.closePath(); c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = this.lw; c.stroke();
    if (o.ribs) { c.lineWidth = 1.1; for (let i = 1; i < o.ribs; i++) { const f = i / o.ribs; const xx = x - rx + 2 * rx * f; c.beginPath(); c.moveTo(xx, y + Math.sin(Math.acos(2 * f - 1)) * ry); c.quadraticCurveTo(lerp(xx, x, 0.4), y - hh * 0.8, x, y - hh); c.stroke(); } }
  }
  cone(u, v, z, r, h, col) {
    const [x, y] = P(u, v, z), [, yt] = P(u, v, z + h);
    const rx = r * CTS.S * Math.SQRT2, ry = rx * CTS.YS;
    const c = this.ctx;
    c.beginPath(); c.moveTo(x - rx, y); c.ellipse(x, y, rx, ry, 0, Math.PI, 0, true); c.lineTo(x, yt); c.closePath();
    const g = c.createLinearGradient(x - rx, 0, x + rx, 0); g.addColorStop(0, shade(col, 0.05)); g.addColorStop(1, shade(col, -0.25));
    c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = this.lw; c.stroke();
  }

  // ----- ground -----
  // the tile slab: top surface + two visible sides
  slab(top = "#ece4d3", o = {}) {
    const d = o.depth ?? CTS.SLAB;
    const side = o.side || "#d9cdb5";
    this.poly([[0, 10, 0], [10, 10, 0], [10, 10, -d], [0, 10, -d]], side);
    this.poly([[10, 0, 0], [10, 10, 0], [10, 10, -d], [10, 0, -d]], shade(side, -0.14));
    this.poly([[0, 0, 0], [10, 0, 0], [10, 10, 0], [0, 10, 0]], top);
  }
  // ground from tools/trace-ground.py output: paving, lawns (outlined, tufted), water
  groundTrace(d, o = {}) {
    const lawnCol = o.lawn || "#a2c265", paved = o.paved || "#f2e5c5", waterCol = o.water || "#86b9d2";
    this.slab(paved, { side: o.side || "#e3d3b0" });
    this.stipple([[0, 0], [10, 0], [10, 10], [0, 10]], { density: o.stipple ?? 9 });
    const c = this.ctx; c.save(); this._trace([P(0, 0), P(10, 0), P(10, 10), P(0, 10)], true, 0); c.clip();
    for (const w of d.water || []) this.water(w, { color: waterCol });
    for (const l of d.lawn || []) {
      this.ground(l, lawnCol, { lw: 1.4 });
      { const g = c.createLinearGradient(...P(0, 0), ...P(10, 10)); g.addColorStop(0, "rgba(255,250,200,0.22)"); g.addColorStop(0.55, "rgba(255,250,200,0)"); g.addColorStop(1, "rgba(40,60,20,0.14)"); this.ground(l, g, { stroke: false }); }
      this.grass(l, { density: o.tufts ?? 10, seed: Math.round(l[0][0] * 100) });
      // darker rim just inside the lawn edge
      this.ground(l, null, { stroke: shade(lawnCol, -0.18), lw: 3.2, alpha: 0.5 });
      this.ground(l, null, { lw: 1.4 });
    }
    for (const h of d.lawnHoles || []) this.ground(h, paved, { lw: 1.2 });
    c.restore();
    this.poly([[0, 0, 0], [10, 0, 0], [10, 10, 0], [0, 10, 0]], null, { lw: 1.6 });
  }
  // any flat ground region (pts in u,v)
  ground(pts, col, o = {}) { this.poly(pts.map(([u, v]) => [u, v, o.z || 0]), col, o); }
  // raised kerb/lawn block
  plot(u, v, du, dv, col, h = 0.08, o = {}) { this.box(u, v, 0, du, dv, h, col, { shadow: false, hatch: false, ...o }); }
  water(pts, o = {}) {
    const t = this.t, c = this.ctx;
    const col = o.color || "#7fb3cf";
    const P2 = pts.map(([u, v]) => P(u, v, o.z || 0));
    this.path(P2, { fill: col });
    c.save(); this._trace(P2, true, 0); c.clip();
    let minU = 1e9, maxU = -1e9, minV = 1e9, maxV = -1e9;
    for (const [u, v] of pts) { minU = Math.min(minU, u); maxU = Math.max(maxU, u); minV = Math.min(minV, v); maxV = Math.max(maxV, v); }
    c.strokeStyle = "rgba(255,255,255,0.75)"; c.lineWidth = 1.5; c.lineCap = "round";
    const R = rng(o.seed || 9);
    const n = Math.round((maxU - minU) * (maxV - minV) * (o.density ?? 1.4));
    for (let i = 0; i < n; i++) {
      const u0 = lerp(minU, maxU, R()), v0 = lerp(minV, maxV, R()), ph = R() * 6.28, sp = 0.6 + R() * 0.6;
      const drift = ((t * 0.12 * sp + R()) % 1) * (o.flow ?? 0.6);
      const a = 0.5 + 0.5 * Math.sin(t * 1.6 * sp + ph);
      const [x, y] = P(u0 + drift * (o.dir?.[0] ?? 1), v0 + drift * (o.dir?.[1] ?? 0), o.z || 0);
      c.globalAlpha = a * 0.9;
      c.beginPath(); c.moveTo(x - 6, y); c.quadraticCurveTo(x - 3, y - 2.2, x, y); c.quadraticCurveTo(x + 3, y + 2.2, x + 6, y); c.stroke();
    }
    c.globalAlpha = 1; c.restore();
  }
  path2ground(pts, w, col, o = {}) {
    // a walkway polyline of width w (units) on the ground
    for (let i = 0; i < pts.length - 1; i++) {
      const [u0, v0] = pts[i], [u1, v1] = pts[i + 1];
      const L = Math.hypot(u1 - u0, v1 - v0) || 1, nu = -(v1 - v0) / L * w / 2, nv = (u1 - u0) / L * w / 2;
      this.ground([[u0 + nu, v0 + nv], [u1 + nu, v1 + nv], [u1 - nu, v1 - nv], [u0 - nu, v0 - nv]], col, { stroke: false });
    }
  }

  // ----- props -----
  // scalloped canopy blob: a union of bumps around a lobe. returns nothing; draws outline then fill
  _lobe(cx, cy, R, col, seed, o = {}) {
    const c = this.ctx, rnd = rng(seed);
    const n = o.bumps ?? Math.max(9, Math.round(R / 2.6));
    const bumps = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rnd() * 0.3;
      const rr = R * (0.74 + rnd() * 0.12);
      bumps.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * (o.squash ?? 0.92), R * (0.3 + rnd() * 0.1)]);
    }
    const all = (fn) => { c.beginPath(); for (const [x, y, r] of bumps) { c.moveTo(x + r, y); c.arc(x, y, r, 0, Math.PI * 2); } c.moveTo(cx + R * 0.82, cy); c.arc(cx, cy, R * 0.82, 0, Math.PI * 2); fn(); };
    all(() => { c.strokeStyle = INK; c.lineWidth = (o.lw ?? this.lw) * 2; c.stroke(); });
    all(() => { c.fillStyle = col; c.fill(); });
    // leaf texture: little scallop marks + light dabs
    c.save(); all(() => c.clip());
    c.fillStyle = shade(col, 0.16);
    for (let i = 0; i < 3; i++) { const a = -2.3 + rnd() * 0.9, d = R * (0.25 + rnd() * 0.35); c.beginPath(); c.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, R * (0.2 + rnd() * 0.12), 0, Math.PI * 2); c.fill(); }
    c.fillStyle = shade(col, -0.16);
    c.beginPath(); c.arc(cx + R * 0.45, cy + R * 0.5, R * 0.55, 0, Math.PI * 2); c.fill();
    c.strokeStyle = shade(col, -0.38); c.lineWidth = 0.9;
    const marks = Math.round(R * R / 30);
    for (let i = 0; i < marks; i++) { const x = cx + (rnd() - 0.5) * R * 1.6, y = cy + (rnd() - 0.5) * R * 1.5, r = 1.6 + rnd() * 1.4, a0 = 0.2 + rnd() * 0.6; c.beginPath(); c.arc(x, y, r, a0, a0 + 2.2); c.stroke(); }
    c.restore();
  }
  tree(u, v, o = {}) {
    const t = this.t, c = this.ctx;
    const r = o.r ?? 0.6, h = o.h ?? 1.4, col = o.col || "#86b05a", seed = o.seed ?? Math.round(u * 7 + v * 13);
    const rnd = rng(seed * 31 + 7);
    this.ell(u + 0.3, v + 0.12, 0, r * 0.85, "rgba(60,45,30,0.14)", { stroke: false });
    const [bx, by] = P(u, v, 0), [cx0, cy0] = P(u, v, h);
    const R = r * CTS.S * 1.05;
    // trunk with a fork
    const ty = cy0 + R * 0.35;
    c.lineCap = "round";
    for (const [w, sc] of [[7.5, INK], [4.8, "#8a6446"]]) { c.strokeStyle = sc; c.lineWidth = w; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx, ty); c.moveTo(bx, ty + 4); c.lineTo(bx - R * 0.35, ty - R * 0.3); c.moveTo(bx, ty + 2); c.lineTo(bx + R * 0.3, ty - R * 0.4); c.stroke(); }
    // lobes back-to-front, top sways most
    const lobes = o.lobes || [[-0.38, -0.32, 0.62], [0.36, -0.36, 0.6], [0, -0.62, 0.6], [-0.55, 0.12, 0.56], [0.55, 0.1, 0.58], [0, 0, 0.66], [-0.22, 0.42, 0.5], [0.28, 0.4, 0.5]];
    lobes.forEach(([dx, dy, s], i) => {
      const sway = (Math.sin(t * 1.15 + seed + i * 0.7) * 1.8 + Math.sin(t * 2.4 + seed * 2 + i) * 0.6) * (1 - dy) * 0.8;
      const shadeAmt = (dx + dy) * 0.08;
      this._lobe(cx0 + dx * R + sway, cy0 + dy * R, R * s, shade(col, -shadeAmt), seed * 17 + i);
    });
    // a branch peeking through a gap
    if (o.peek !== false) { c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(cx0 - R * 0.05, cy0 + R * 0.25); c.lineTo(cx0 - R * 0.22, cy0 - R * 0.02); c.stroke(); c.strokeStyle = "#7a5638"; c.lineWidth = 1.2; c.stroke(); }
  }
  conifer(u, v, o = {}) {
    const h = o.h ?? 2.0, r = o.r ?? 0.24, col = o.col || "#5f8f4e", c = this.ctx;
    this.ell(u + 0.22, v + 0.1, 0, r * 1.1, "rgba(60,45,30,0.14)", { stroke: false });
    const sway = Math.sin(this.t * 1.1 + u * 3 + v) * 1.4;
    const [x, y] = P(u, v, 0.1), [, yt] = P(u, v, h);
    const w = r * CTS.S * 1.3, Hh = y - yt;
    // flame silhouette from stacked scallop lobes
    // cypress flame: one tall scalloped silhouette, shaded right, with a few inner scallop marks
    const pts = [];
    const N = 28;
    for (let i = 0; i <= N; i++) { const f = i / N, yy = lerp(y, yt, f); const half = w * 0.95 * Math.sin(Math.PI * Math.pow(f, 0.62)) * (1 - f * 0.15); pts.push([x - half + sway * f, yy]); }
    for (let i = N; i >= 0; i--) { const f = i / N, yy = lerp(y, yt, f); const half = w * 0.95 * Math.sin(Math.PI * Math.pow(f, 0.62)) * (1 - f * 0.15); pts.push([x + half + sway * f, yy]); }
    c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath();
    c.fillStyle = col; c.fill(); c.strokeStyle = INK; c.lineWidth = this.lw; c.stroke();
    c.save(); c.clip();
    c.fillStyle = shade(col, -0.18); c.fillRect(x + w * 0.1, yt, w * 2, y - yt);
    c.strokeStyle = shade(col, -0.35); c.lineWidth = 0.9;
    const R = rng(Math.round(u * 50 + v * 7));
    for (let i = 0; i < 14; i++) { const f = 0.08 + R() * 0.8, yy = lerp(y, yt, f), xx = x + (R() - 0.5) * w * 1.2 * Math.sin(Math.PI * f) + sway * f; c.beginPath(); c.arc(xx, yy, 2.4, 0.3, 2.6); c.stroke(); }
    c.restore();
  }
  hedge(u, v, du, dv, o = {}) {
    // scalloped clipped hedge: a row of overlapping lobes
    const h = o.h ?? 0.3, col = o.col || "#6f9e52";
    const n = Math.max(2, Math.round(Math.max(du, dv) / 0.32));
    const R = CTS.S * Math.min(du, dv) * 0.75;
    for (let i = 0; i < n; i++) {
      const f = (i + 0.5) / n;
      const [x, y] = P(u + (du > dv ? du * f : du / 2), v + (du > dv ? dv / 2 : dv * f), h * 0.6);
      this._lobe(x, y, Math.max(7, R), shade(col, (i % 2) * 0.04), Math.round(u * 31 + v * 17 + i), { squash: 0.8, bumps: 8 });
    }
  }
  flowers(u, v, du, dv, o = {}) {
    // a mounded bed: leafy lobes along the bed, blossoms dotted on top
    const R = rng(o.seed ?? Math.round(u * 100 + v * 10));
    const cols = o.cols || ["#e8607a", "#f4c542", "#f39ac0", "#ffffff", "#e9813c", "#d94a5c"];
    const n = Math.max(2, Math.round(Math.max(du, dv) / 0.28));
    const rad = CTS.S * Math.min(du, dv) * 0.78;
    const tops = [];
    for (let i = 0; i < n * 2; i++) {
      const f = (i * 0.5 + 0.35 + (R() - 0.5) * 0.3) / n;
      const off = (i % 2 ? 0.25 : 0.75);
      const [x, y] = P(u + (du > dv ? du * Math.min(1, f) : du * off), v + (du > dv ? dv * off : dv * Math.min(1, f)), 0.1 + R() * 0.06);
      const rr = Math.max(6, rad * (0.85 + R() * 0.5));
      this._lobe(x, y, rr, R() < 0.5 ? "#6c9c4c" : "#77a653", Math.round(u * 13 + v * 29 + i), { squash: 0.78, bumps: 8 });
      tops.push([x, y, rr]);
    }
    const c = this.ctx;
    const per = Math.round((o.density ?? 1) * 7);
    for (const [x, y, r] of tops) for (let j = 0; j < per; j++) {
      const a = R() * Math.PI * 2, d = Math.sqrt(R()) * r * 0.85;
      const fx = x + Math.cos(a) * d, fy = y + Math.sin(a) * d * 0.75, col = cols[Math.floor(R() * cols.length)];
      const pr = 1.7 + R() * 0.9;
      c.fillStyle = col;
      for (let k2 = 0; k2 < 5; k2++) { const b = (k2 / 5) * Math.PI * 2; c.beginPath(); c.arc(fx + Math.cos(b) * pr, fy + Math.sin(b) * pr, pr * 0.75, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = col === "#f4c542" ? "#c46b2a" : "#f6e08a"; c.beginPath(); c.arc(fx, fy, pr * 0.45, 0, Math.PI * 2); c.fill();
    }
  }
  // an organic flower bed following a curve of (u,v) points; width in units
  flowerCurve(pts, width = 0.35, o = {}) {
    const sp = spline(pts, false), R = rng(o.seed ?? Math.round(pts[0][0] * 97 + pts[0][1] * 13));
    const cols = o.cols || ["#e8607a", "#f4c542", "#f39ac0", "#ffffff", "#e9813c", "#d94a5c"];
    const n = Math.max(3, Math.round(sp.L / 0.16));
    const tops = [];
    for (let i = 0; i < n; i++) {
      const s = sp.sample((i + 0.5) / n * sp.L), L = Math.hypot(s.du, s.dv) || 1;
      const side = (R() - 0.5) * width * 0.6, w = width * (0.7 + 0.5 * Math.sin((i / n) * Math.PI));
      const [x, y] = P(s.u - (s.dv / L) * side, s.v + (s.du / L) * side, 0.1);
      const rr = CTS.S * w * (0.55 + R() * 0.3);
      this._lobe(x, y, rr, R() < 0.5 ? "#6c9c4c" : "#77a653", Math.round(s.u * 131 + s.v * 71 + i), { squash: 0.78, bumps: 8 });
      tops.push([x, y, rr]);
    }
    const c = this.ctx;
    for (const [x, y, r] of tops) for (let j = 0; j < 6; j++) {
      const a = R() * Math.PI * 2, d = Math.sqrt(R()) * r * 0.8;
      const fx = x + Math.cos(a) * d, fy = y + Math.sin(a) * d * 0.75, col = cols[Math.floor(R() * cols.length)], pr = 1.7 + R() * 0.9;
      c.fillStyle = col;
      for (let k2 = 0; k2 < 5; k2++) { const b = (k2 / 5) * Math.PI * 2; c.beginPath(); c.arc(fx + Math.cos(b) * pr, fy + Math.sin(b) * pr, pr * 0.75, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = "#f6e08a"; c.beginPath(); c.arc(fx, fy, pr * 0.45, 0, Math.PI * 2); c.fill();
    }
  }
  // grass tufts + mow stripes clipped to a lawn polygon (u,v)
  grass(pts, o = {}) {
    const c = this.ctx, R = rng(o.seed ?? 5);
    const P2 = pts.map(([u, v]) => P(u, v, 0));
    c.save(); this._trace(P2, true, 0); c.clip();
    let minU = 1e9, maxU = -1e9, minV = 1e9, maxV = -1e9;
    for (const [u, v] of pts) { minU = Math.min(minU, u); maxU = Math.max(maxU, u); minV = Math.min(minV, v); maxV = Math.max(maxV, v); }
    c.strokeStyle = o.tuft || "rgba(62,98,40,0.55)"; c.lineWidth = 0.9; c.lineCap = "round";
    const n = Math.round((maxU - minU) * (maxV - minV) * (o.density ?? 9));
    c.beginPath();
    for (let i = 0; i < n; i++) {
      const [x, y] = P(lerp(minU, maxU, R()), lerp(minV, maxV, R()), 0);
      c.moveTo(x - 2.2, y); c.lineTo(x - 0.8, y - 3); c.moveTo(x, y); c.lineTo(x, y - 3.8); c.moveTo(x + 2.2, y); c.lineTo(x + 0.8, y - 3);
    }
    c.stroke();
    c.fillStyle = "rgba(255,255,230,0.18)";
    for (let i = 0; i < n / 3; i++) { const [x, y] = P(lerp(minU, maxU, R()), lerp(minV, maxV, R()), 0); c.beginPath(); c.ellipse(x, y, 5 + R() * 6, 2 + R() * 2, 0, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }
  stipple(pts, o = {}) {
    const c = this.ctx, R = rng(o.seed ?? 3);
    const P2 = pts.map(([u, v]) => P(u, v, 0));
    c.save(); this._trace(P2, true, 0); c.clip();
    let minU = 1e9, maxU = -1e9, minV = 1e9, maxV = -1e9;
    for (const [u, v] of pts) { minU = Math.min(minU, u); maxU = Math.max(maxU, u); minV = Math.min(minV, v); maxV = Math.max(maxV, v); }
    const n = Math.round((maxU - minU) * (maxV - minV) * (o.density ?? 14));
    for (let i = 0; i < n; i++) { const [x, y] = P(lerp(minU, maxU, R()), lerp(minV, maxV, R()), 0); c.fillStyle = R() < 0.5 ? "rgba(150,120,80,0.28)" : "rgba(255,255,255,0.35)"; c.fillRect(x, y, 1.4, 1.1); }
    c.restore();
  }
  palm(u, v, o = {}) {
    const h = o.h ?? 2.2, c = this.ctx, t = this.t;
    const [bx, by] = P(u, v, 0), [tx, ty] = P(u, v, h);
    const lean = (o.lean ?? 0.3) * CTS.S;
    c.strokeStyle = INK; c.lineWidth = 6.5; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + lean * 0.2, (by + ty) / 2, tx + lean, ty); c.stroke();
    c.strokeStyle = "#a07850"; c.lineWidth = 3.8; c.stroke();
    const sw = Math.sin(t * 1.4 + u + v) * 0.08;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + sw;
      const L = CTS.S * 0.9;
      const ex = tx + lean + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.45 + L * 0.25;
      c.beginPath(); c.moveTo(tx + lean, ty); c.quadraticCurveTo(tx + lean + Math.cos(a) * L * 0.5, ty - L * 0.25, ex, ey);
      c.strokeStyle = INK; c.lineWidth = 6; c.stroke(); c.strokeStyle = "#6fa25a"; c.lineWidth = 3.6; c.stroke();
    }
  }
  // Parisian street lamp: flared base, fluted post, four-pane lantern with a crown
  lamp(u, v, o = {}) {
    const h = o.h ?? 1.55, c = this.ctx, col = o.col || "#2f4a3c";
    const [x, y] = P(u, v, 0), [, yt] = P(u, v, h);
    this.ell(u + 0.12, v + 0.05, 0, 0.12, "rgba(60,45,30,0.15)", { stroke: false });
    // base
    this.path([[x - 4.5, y], [x + 4.5, y], [x + 2.6, y - 7], [x - 2.6, y - 7]], { fill: col, lw: 1.1, wobble: 0 });
    // post
    c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 4.2; c.beginPath(); c.moveTo(x, y - 6); c.lineTo(x, yt + 2); c.stroke();
    c.strokeStyle = col; c.lineWidth = 2.4; c.stroke();
    c.strokeStyle = shade(col, 0.25); c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - 0.6, y - 8); c.lineTo(x - 0.6, yt + 4); c.stroke();
    // collar + arms
    c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - 4, yt + 3); c.quadraticCurveTo(x, yt - 1, x + 4, yt + 3); c.stroke();
    // lantern: tapered glass box with mullions, warm glow
    const lit = o.lit ?? 0.55;
    this.path([[x - 4.2, yt - 1], [x + 4.2, yt - 1], [x + 5.2, yt - 11], [x - 5.2, yt - 11]], { fill: `rgba(250,228,150,${lit + 0.3})`, lw: 1.2, wobble: 0 });
    c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x, yt - 1); c.lineTo(x, yt - 11); c.stroke();
    this.path([[x - 6.2, yt - 11], [x + 6.2, yt - 11], [x + 2.5, yt - 15], [x - 2.5, yt - 15]], { fill: col, lw: 1.1, wobble: 0 });
    this.circle(x, yt - 16.5, 1.6, col, { lw: 0.9 });
  }
  // slatted park bench with cast-iron ends
  bench(u, v, o = {}) {
    const along = o.along || "u", L = o.len ?? 0.85, c = this.ctx;
    const iron = "#2c3530", wood = o.wood || "#a8743f";
    const A = (f, d, z) => (along === "u" ? P(u + f * L, v + d, z) : P(u + d, v + f * L, z));
    this.shadow(along === "u" ? [[u, v, 0], [u + L, v, 0], [u + L + 0.12, v + 0.3, 0], [u + 0.12, v + 0.3, 0]] : [[u, v, 0], [u + 0.3, v, 0], [u + 0.3, v + L + 0.12, 0], [u, v + L + 0.12, 0]], 0.12);
    // iron ends (legs + armrest)
    for (const f of [0.06, 0.94]) { c.strokeStyle = INK; c.lineWidth = 3; c.lineCap = "round"; c.beginPath(); c.moveTo(...A(f, 0.22, 0)); c.lineTo(...A(f, 0.18, 0.2)); c.lineTo(...A(f, 0.02, 0.48)); c.moveTo(...A(f, 0.02, 0)); c.lineTo(...A(f, 0.18, 0.2)); c.stroke(); c.strokeStyle = iron; c.lineWidth = 1.5; c.stroke(); }
    // back slats then seat slats
    for (let i = 0; i < 3; i++) { const z = 0.28 + i * 0.07, d = 0.04 - i * 0.008; this.path([A(0, d, z), A(1, d, z), A(1, d, z + 0.045), A(0, d, z + 0.045)], { fill: shade(wood, -0.08 * i), lw: 0.9, wobble: 0 }); }
    for (let i = 0; i < 3; i++) { const d = 0.08 + i * 0.065; this.path([A(0, d, 0.2), A(1, d, 0.2), A(1, d + 0.05, 0.2), A(0, d + 0.05, 0.2)], { fill: shade(wood, 0.06), lw: 0.9, wobble: 0 }); }
  }
  flag(u, v, z, o = {}) {
    const t = this.t, c = this.ctx;
    const h = o.h ?? 1.6, w = (o.w ?? 0.9) * CTS.S, fh = (o.fh ?? 0.55) * CTS.S;
    const [x, y] = P(u, v, z), [, yt] = P(u, v, z + h);
    c.strokeStyle = INK; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt - 3); c.stroke();
    const cols = o.cols || ["#2c4f8c", "#f4f1e8", "#d7413b"];
    const stripes = o.horizontal ? cols.length : cols.length;
    const wave = (s) => Math.sin(t * 5 - s * 4) * 3.2 * s;
    for (let i = 0; i < stripes; i++) {
      const s0 = i / stripes, s1 = (i + 1) / stripes;
      let q;
      if (o.horizontal) q = [[0, s0], [1, s0], [1, s1], [0, s1]];
      else q = [[s0, 0], [s1, 0], [s1, 1], [s0, 1]];
      const pts = [];
      const seg = 6;
      // build a waving quad strip
      const edge = (a, b, n) => { const out = []; for (let k = 0; k <= n; k++) { const f = k / n; out.push([lerp(a[0], b[0], f), lerp(a[1], b[1], f)]); } return out; };
      for (const [fx, fy] of [...edge(q[0], q[1], seg), ...edge(q[1], q[2], 2), ...edge(q[2], q[3], seg), ...edge(q[3], q[0], 2)]) pts.push([x + fx * w, yt + fy * fh + wave(fx)]);
      this.path(pts, { fill: cols[i], stroke: false, wobble: 0 });
    }
    const out = [[x, yt], [x + w, yt + wave(1)], [x + w, yt + fh + wave(1)], [x, yt + fh]];
    this.path(out, { lw: 1.6, wobble: 0 });
  }
  awning(u, v, z, len, o = {}) {
    // striped awning on a L-face (along u) projecting toward +v
    const n = o.stripes ?? 6, d = o.depth ?? 0.45, drop = o.drop ?? 0.35;
    const c1 = o.c1 || "#d64e46", c2 = o.c2 || "#f6f0e2";
    for (let i = 0; i < n; i++) {
      const a = u + (len * i) / n, b = u + (len * (i + 1)) / n;
      this.poly([[a, v, z], [b, v, z], [b, v + d, z - drop], [a, v + d, z - drop]], i % 2 ? c2 : c1, { lw: 1.4, wobble: 0 });
    }
  }
  umbrella(u, v, o = {}) {
    const h = o.h ?? 1.1, r = o.r ?? 0.5, col = o.col || "#d64e46";
    const [x, y] = P(u, v, 0), [, yt] = P(u, v, h);
    const c = this.ctx;
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt); c.stroke();
    const rx = r * CTS.S * 1.3, ry = rx * 0.45;
    c.beginPath(); c.ellipse(x, yt + ry * 0.3, rx, ry, 0, Math.PI, 0); c.quadraticCurveTo(x, yt - ry * 1.6, x - rx, yt + ry * 0.3);
    c.fillStyle = col; c.fill(); c.lineWidth = this.lw; c.stroke();
  }

  // ----- people (articulated rig in vec-people.js) -----
  // o: { dir:[du,dv] | face:+1/-1, pose, seed, kid, h, z, outfit fields... }
  person(u, v, o = {}) {
    let dir = o.dir;
    if (!dir) dir = (o.face ?? 1) > 0 ? [1, 0.05] : [0.05, 1];
    const kid = o.kid ?? ((o.scale ?? 0.62) < 0.55);
    let pose = o.pose || "stand";
    if (pose === "sit" && !o.seatZ && !o.bench) pose = "sitground";
    const r = drawHuman(this, u, v, { ...o, dir, kid, pose });
    return { ...r, aR: r.hand, aL: r.hand };
  }
  walkerState(path, o = {}) { return walkState(path, this.t, { loop: o.mode === "loop" || o.loop, speed: o.speed ?? 0.45, offset: o.offset ?? 0, dwell: o.dwell ?? 1.6, stride: o.stride }); }
  walker(path, o = {}) {
    const s = this.walkerState(path, o);
    return drawHuman(this, s.u, s.v, { ...o, dir: [s.du, s.dv], pose: s.moving ? "walk" : (o.idle || "stand"), p: s.p, kid: o.kid ?? ((o.scale ?? 0.62) < 0.55) });
  }
  qwalker(path, o = {}) { const s = this.walkerState(path, o); this.q(s.u + s.v, () => this.walker(path, o)); }
  qperson(u, v, o = {}) { this.q(u + v, () => this.person(u, v, o)); }
  along(path, f, mode = "pingpong") {
    // legacy helper: position + direction along a smooth path, f in path-lengths
    const sp = spline(path, mode === "loop");
    if (mode === "loop") { const s = sp.sample(f * sp.L); return { ...s, L: sp.L }; }
    const g = ((f % 2) + 2) % 2, fwd = g < 1;
    const s = sp.sample((fwd ? g : 2 - g) * sp.L);
    return { ...s, du: fwd ? s.du : -s.du, dv: fwd ? s.dv : -s.dv, L: sp.L };
  }

  // ----- vehicles -----
  // dir: 'u+' 'u-' 'v+' 'v-'
  car(u, v, dir = "u+", col = "#d64e46", o = {}) {
    const L = o.len ?? 0.95, W = o.wid ?? 0.5, H = o.h ?? 0.32;
    const along = dir[0];
    const [du, dv] = along === "u" ? [L, W] : [W, L];
    const u0 = u - du / 2, v0 = v - dv / 2;
    this.box(u0, v0, 0.08, du, dv, H, col, { hatch: false, shadow: false });
    // cabin
    const ci = 0.18;
    const cab = along === "u" ? [u0 + (dir === "u+" ? L * 0.15 : L * 0.3), v0 + 0.03, L * 0.55, W - 0.06] : [u0 + 0.03, v0 + (dir === "v+" ? L * 0.15 : L * 0.3), W - 0.06, L * 0.55];
    const f = this.box(cab[0], cab[1], 0.08 + H, cab[2], cab[3], H * 0.75, "#cfe3ee", { hatch: false, shadow: false, top: shade(col, 0.05) });
    // wheels
    const c = this.ctx; c.fillStyle = INK;
    const wh = along === "u" ? [[u0 + L * 0.22, v0 + W], [u0 + L * 0.78, v0 + W]] : [[u0 + W, v0 + L * 0.22], [u0 + W, v0 + L * 0.78]];
    for (const [a, b] of wh) { const [x, y] = P(a, b, 0.08); c.beginPath(); c.ellipse(x, y, 4.2, 4.2, 0, 0, Math.PI * 2); c.fill(); }
    return f;
  }
  // bicycle on the ground plane, pointing along dir; wheels spin when moving
  bike(u, v, o = {}) {
    const c = this.ctx, t = this.t;
    let [du, dv] = o.dir || [1, 0]; const L = Math.hypot(du, dv) || 1; du /= L; dv /= L;
    const r = 0.17, half = 0.3;
    const wheel = (cu, cv) => {
      const pts = []; for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; pts.push(P(cu + du * Math.cos(a) * r, cv + dv * Math.cos(a) * r, r + Math.sin(a) * r)); }
      c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath();
      c.strokeStyle = INK; c.lineWidth = 2.2; c.stroke();
      const spin = o.moving ? (o.dist ?? t) / r : 0;
      c.lineWidth = 0.7; c.beginPath();
      for (let k2 = 0; k2 < 3; k2++) { const a = spin + (k2 * Math.PI) / 3; c.moveTo(...P(cu + du * Math.cos(a) * r, cv + dv * Math.cos(a) * r, r + Math.sin(a) * r)); c.lineTo(...P(cu - du * Math.cos(a) * r, cv - dv * Math.cos(a) * r, r - Math.sin(a) * r)); }
      c.stroke();
    };
    const back = [u - du * half, v - dv * half], front = [u + du * half, v + dv * half];
    c.fillStyle = "rgba(60,45,30,0.15)"; const [sx, sy] = P(u, v, 0); c.beginPath(); c.ellipse(sx, sy, 15, 5, 0, 0, Math.PI * 2); c.fill();
    wheel(...back); wheel(...front);
    const col = o.col || "#3f73b5";
    const pr = (a, b2, z) => P(a, b2, z);
    const bb = pr(u - du * 0.02, v - dv * 0.02, r * 1.05), seat = pr(u - du * 0.12, v - dv * 0.12, 0.46), bar = pr(front[0] - du * 0.04, front[1] - dv * 0.04, 0.5);
    const hb = P(back[0], back[1], r), hf = P(front[0], front[1], r);
    c.lineCap = "round"; c.lineJoin = "round";
    for (const [w, sc] of [[4.2, INK], [2.4, col]]) { c.strokeStyle = sc; c.lineWidth = w; c.beginPath(); c.moveTo(...hb); c.lineTo(...bb); c.lineTo(...seat); c.lineTo(...hb); c.moveTo(...bb); c.lineTo(...bar); c.lineTo(...hf); c.moveTo(...seat); c.lineTo(...bar); c.stroke(); }
    c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); const s2 = P(u - du * 0.12, v - dv * 0.12, 0.49); c.moveTo(s2[0] - 3, s2[1]); c.lineTo(s2[0] + 3, s2[1]); c.stroke();
    if (o.basket) { const bk = P(front[0], front[1], 0.5); c.fillStyle = "#c8a46a"; c.beginPath(); c.roundRect(bk[0] - 4, bk[1] - 3, 8, 6, 1.5); c.fill(); c.stroke(); }
  }
  cyclist(path, o = {}) {
    const s = walkState(path, this.t, { loop: o.mode === "loop" || o.loop, speed: o.speed ?? 1.1, offset: o.offset ?? 0, dwell: o.dwell ?? 0.8, stride: 1 });
    const dir = [s.du, s.dv];
    this.bike(s.u, s.v, { dir, moving: s.moving, col: o.col, dist: s.p, basket: o.basket });
    drawHuman(this, s.u - (s.du / (Math.hypot(s.du, s.dv) || 1)) * 0.1, s.v - (s.dv / (Math.hypot(s.du, s.dv) || 1)) * 0.1, { ...o, dir, pose: "ride", z: 0, cadence: s.moving ? 7 : 0, shadow: false });
  }
  qcyclist(path, o = {}) {
    const s = walkState(path, this.t, { loop: o.mode === "loop" || o.loop, speed: o.speed ?? 1.1, offset: o.offset ?? 0, dwell: o.dwell ?? 0.8 });
    this.q(s.u + s.v, () => this.cyclist(path, o));
  }
  bird(x, y, o = {}) {
    const t = this.t, c = this.ctx;
    const ph = t * 9 + (o.phase ?? 0);
    const s = (o.size ?? 1) * 7, f = Math.sin(ph) * s * 0.7;
    c.strokeStyle = INK; c.lineWidth = 1.8; c.lineCap = "round";
    c.beginPath(); c.moveTo(x - s, y - f); c.quadraticCurveTo(x - s * 0.4, y - s * 0.3, x, y); c.quadraticCurveTo(x + s * 0.4, y - s * 0.3, x + s, y - f); c.stroke();
  }
  // a bird circling around a point (CTS px)
  circlingBird(cx, cy, rx, ry, o = {}) {
    const a = this.t * (o.speed ?? 0.6) + (o.phase ?? 0);
    this.bird(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, o);
  }
  cloud(x, y, o = {}) {
    if (this.inStage) return;
    const c = this.ctx, s = o.s ?? 1;
    const dx = Math.sin(this.t * 0.15 + (o.phase ?? 0)) * 10;
    const blobs = [[0, 0, 22], [24, 4, 18], [-24, 5, 17], [10, -12, 17], [-10, -9, 15]];
    c.beginPath();
    for (const [bx, by, r] of blobs) { c.moveTo(x + dx + bx * s + r * s, y + by * s); c.arc(x + dx + bx * s, y + by * s, r * s, 0, Math.PI * 2); }
    c.lineWidth = this.lw * 1.8; c.strokeStyle = INK; c.stroke(); c.fillStyle = "#fbf8f0"; c.fill();
  }

  // ----- depth queue -----
  q(depth, fn) { this._q.push([depth, this._q.length, fn]); }
  flush() {
    this._q.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    for (const [, , fn] of this._q) fn();
    this._q = [];
  }
}
