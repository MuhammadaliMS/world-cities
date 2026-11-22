// PARIS shared helpers for the 8 outer tiles: facades, slate roofs, jets, route tools, small props.
import { P, CTS, INK, shade, mix, lerp, clamp, rng, hash, smooth } from "../../lib/vec-kit.js";

export const GOLD = "#d8a93c", STONE = "#e6d3a2", SLATE = "#6679a0";

// screen px of the tile reference -> (u,v) on the ground (z = 0)
export const uv = (x, y) => { const a = (x - 512) / 45, b = (y - 405) / 25.965; return [(a + b) / 2, (b - a) / 2]; };
export const uvs = (pts) => pts.map(([x, y]) => uv(x, y));
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const DBG = () => !!globalThis.__DBG;

// ---------- route tools ----------
// longest stretch of a polyline outside keep-out circles [u,v,r]
export function avoidCircles(w, circles) {
  const ok = (p) => circles.every(([u, v, r]) => Math.hypot(p[0] - u, p[1] - v) > r);
  let best = [], cur = [];
  for (const p of w) { if (ok(p)) cur.push(p); else { if (cur.length > best.length) best = cur; cur = []; } }
  if (cur.length > best.length) best = cur;
  return best.length >= 2 ? best : w.slice(0, 2);
}
// densify a polyline so keep-out tests are meaningful
export function dense(pts, step = 0.25) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], n = Math.max(1, Math.ceil(dist(a, b) / step));
    for (let j = 1; j <= n; j++) out.push([lerp(a[0], b[0], j / n), lerp(a[1], b[1], j / n)]);
  }
  return out;
}
export function inPoly(p, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
// shrink / grow a polygon about its centroid
export function scalePoly(poly, f) {
  const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length, cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
  return poly.map(([u, v]) => [cx + (u - cx) * f, cy + (v - cy) * f]);
}
export function debugRoutes(k, routes, polys = []) {
  if (!DBG()) return;
  const c = k.ctx;
  c.save();
  routes.forEach((r, i) => { c.strokeStyle = `hsl(${(i * 47) % 360},90%,45%)`; c.lineWidth = 2; c.beginPath(); r.forEach((p, j) => { const [x, y] = P(p[0], p[1]); j ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); });
  for (const poly of polys) { c.strokeStyle = "rgba(255,0,0,0.8)"; c.lineWidth = 1.5; c.beginPath(); poly.forEach((p, j) => { const [x, y] = P(p[0], p[1]); j ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); c.stroke(); }
  c.restore();
}

// ---------- planes + openings ----------
// side 'L': plane v = c running along u;  side 'R': plane u = c running along v
export const plane = (side, c) => (s, z) => (side === "L" ? P(s, c, z) : P(c, s, z));
export function quadQ(k, Q, s0, s1, z0, z1, fill, o = {}) {
  k.path([Q(s0, z0), Q(s1, z0), Q(s1, z1), Q(s0, z1)], { fill, lw: o.lw ?? 1, wobble: 0, stroke: o.stroke, alpha: o.alpha });
}
// a window / door opening on a plane. o: arch, pediment ('tri'|'seg'), frame, glass, lit, balcony, mull, shutters, sill
export function opening(k, Q, s, w, z0, z1, o = {}) {
  const c = k.ctx, side = o.side || "L";
  const fr = o.frame ?? shade(o.wall || STONE, 0.18);
  const glass = o.glass || (side === "R" ? "#43515f" : "#566a7c");
  const fw = o.fw ?? 0.045;
  const pointed = o.arch === "pointed";
  const ah = o.arch ? (pointed ? Math.min(w * 0.95, (z1 - z0) * 0.5) : Math.min(w * 0.5, (z1 - z0) * 0.4)) : 0;
  const shape = (ww, zz0, zz1, aah) => {
    const a = Q(s - ww / 2, zz0), b = Q(s + ww / 2, zz0), cc = Q(s + ww / 2, zz1 - aah), d = Q(s - ww / 2, zz1 - aah);
    c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.lineTo(...cc);
    if (aah > 0 && pointed) { const ap = Q(s, zz1); c.quadraticCurveTo(...Q(s + ww * 0.46, zz1 - aah * 0.08), ...ap); c.quadraticCurveTo(...Q(s - ww * 0.46, zz1 - aah * 0.08), ...d); }
    else if (aah > 0) { const ctrl = Q(s, zz1 + aah * 0.55); c.quadraticCurveTo(ctrl[0], ctrl[1], ...d); } else c.lineTo(...d);
    c.closePath();
  };
  // pediment
  if (o.pediment) {
    const pz = z1 + (o.arch ? 0 : 0), pw = w * 0.5 + fw + 0.04, ph = o.pediment === "tri" ? w * 0.42 : w * 0.3;
    const a = Q(s - pw, pz + 0.03), b = Q(s + pw, pz + 0.03), t = Q(s, pz + 0.03 + ph);
    c.beginPath(); c.moveTo(...a);
    if (o.pediment === "tri") c.lineTo(...t); else c.quadraticCurveTo(t[0], t[1] - ph * 20, ...b);
    if (o.pediment === "tri") c.lineTo(...b);
    c.closePath(); c.fillStyle = shade(o.wall || STONE, side === "R" ? -0.12 : 0.1); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
  }
  shape(w + fw * 2, z0 - fw * 0.6, z1 + fw, ah > 0 ? ah + fw : 0); c.fillStyle = fr; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
  shape(w, z0, z1, ah);
  c.fillStyle = o.lit ? "#f6dc86" : glass; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
  if (o.mull !== false) { // mullion + transom
    c.strokeStyle = o.lit ? "rgba(120,80,20,0.6)" : "rgba(20,26,34,0.65)"; c.lineWidth = 0.8; c.beginPath();
    c.moveTo(...Q(s, z0)); c.lineTo(...Q(s, z1 - ah)); const zt = lerp(z0, z1 - ah, 0.62); c.moveTo(...Q(s - w / 2, zt)); c.lineTo(...Q(s + w / 2, zt)); c.stroke();
  }
  if (o.shutters) for (const sg of [-1, 1]) { const a = Q(s + sg * (w / 2 + fw), z0), b = Q(s + sg * (w / 2 + fw + w * 0.32), z0), cc = Q(s + sg * (w / 2 + fw + w * 0.32), z1 - ah), d = Q(s + sg * (w / 2 + fw), z1 - ah); k.path([a, b, cc, d], { fill: o.shutters, lw: 0.8, wobble: 0 }); }
  if (o.sill !== false) { const a = Q(s - w / 2 - 0.05, z0 - 0.045), b = Q(s + w / 2 + 0.05, z0 - 0.045), cc = Q(s + w / 2 + 0.05, z0 + 0.02), d = Q(s - w / 2 - 0.05, z0 + 0.02); k.path([a, b, cc, d], { fill: shade(o.wall || STONE, 0.22), lw: 0.7, wobble: 0 }); }
  if (o.balcony) { // wrought-iron rail across the opening, with little uprights
    const zb = z0 + (z1 - z0) * 0.34, sw = w * 0.5 + 0.12;
    c.strokeStyle = "#262b30"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(...Q(s - sw, zb)); c.lineTo(...Q(s + sw, zb)); c.stroke();
    c.lineWidth = 0.7; c.beginPath(); for (let i = 0; i <= 6; i++) { const ss = lerp(s - sw, s + sw, i / 6); c.moveTo(...Q(ss, zb)); c.lineTo(...Q(ss, zb - 0.16)); } c.stroke();
    c.lineWidth = 1.2; c.beginPath(); c.moveTo(...Q(s - sw, zb - 0.16)); c.lineTo(...Q(s + sw, zb - 0.16)); c.stroke();
  }
}
// horizontal moulding band
export function band(k, Q, s0, s1, z, h, col, o = {}) {
  const side = o.side || "L", d = o.out ?? 0.07;
  const O = (s, zz) => { const q = Q(s, zz); return side === "L" ? [q[0] - d * CTS.S, q[1] + d * CTS.S * CTS.YS] : [q[0] + d * CTS.S, q[1] + d * CTS.S * CTS.YS]; };
  k.path([Q(s0, z), Q(s1, z), O(s1, z), O(s0, z)], { fill: shade(col, -0.18), lw: 0.8, wobble: 0 });
  k.path([O(s0, z), O(s1, z), O(s1, z + h), O(s0, z + h)], { fill: shade(col, o.dark ? -0.1 : 0.12), lw: 0.9, wobble: 0 });
  k.path([O(s0, z + h), O(s1, z + h), Q(s1, z + h + 0.02), Q(s0, z + h + 0.02)], { fill: shade(col, 0.2), lw: 0.7, wobble: 0 });
}

// A classical facade on one plane. Draws wall + openings. o:
//  side, c, s0, s1, z1 (top), col, bay, floors:[{z0,z1,type,...}], seed, pilasters
export function facade(k, o) {
  const { side, c, s0, s1 } = o;
  const z1 = o.z1, col = o.col || STONE, Q = plane(side, c);
  const wall = side === "R" ? shade(col, -0.2) : shade(col, -0.07);
  k.path([Q(s0, 0), Q(s1, 0), Q(s1, z1), Q(s0, z1)], { fill: wall, lw: 1.5, wobble: 0 });
  const n = Math.max(1, Math.round((s1 - s0) / (o.bay ?? 0.62))), bw = (s1 - s0) / n;
  const c2 = k.ctx;
  // ashlar courses (subtle)
  c2.strokeStyle = side === "R" ? "rgba(60,40,20,0.13)" : "rgba(120,90,50,0.16)"; c2.lineWidth = 0.7; c2.beginPath();
  for (let z = 0.3; z < z1; z += 0.3) { c2.moveTo(...Q(s0, z)); c2.lineTo(...Q(s1, z)); }
  c2.stroke();
  // cornice + string courses
  for (const b of o.bands || []) band(k, Q, s0, s1, b[0], b[1], col, { side, c, out: b[2] ?? 0.07, dark: side === "R" });
  for (let i = 0; i < n; i++) {
    const s = s0 + bw * (i + 0.5);
    for (const f of o.floors || []) {
      if (f.skip && f.skip(i, n)) continue;
      const lit = f.lit && hash(i * 7.3 + (o.seed || 0) * 3 + f.z0 * 11) < f.lit && Math.sin(k.t * 0.5 + i * 2.1 + f.z0 * 5) > -0.3;
      opening(k, Q, s, bw * (f.w ?? 0.5), f.z0, f.z1, { side, wall: col, arch: f.arch, pediment: f.ped === "alt" ? (i % 2 ? "tri" : "seg") : f.ped, lit, balcony: f.balcony, shutters: f.shutters, glass: f.glass, mull: f.mull, fw: f.fw, sill: f.sill });
    }
  }
  if (o.pilasters !== false) for (let i = 0; i <= n; i++) {
    const s = s0 + bw * i; const e = i === 0 || i === n;
    const a = Q(s - 0.035, 0), b = Q(s + 0.035, 0), cc = Q(s + 0.035, z1), d = Q(s - 0.035, z1);
    k.path([a, b, cc, d], { fill: shade(col, side === "R" ? -0.12 : 0.1), lw: 0.7, wobble: 0, alpha: e ? 1 : 0.8 });
  }
  return { Q, n, bw };
}

// ---------- roofs ----------
// slate bands: quad = [bl, br, tr, tl]  (2D) with horizontal courses
export function slateQuad(k, quad, col, o = {}) {
  if (quad.length === 3) quad = [quad[0], quad[1], quad[2], quad[2]];
  k.path(quad, { fill: col, lw: o.lw ?? 1.2, wobble: 0 });
  const c = k.ctx, n = o.n ?? 5;
  c.save(); k._trace(quad, true, 0); c.clip();
  c.strokeStyle = "rgba(20,30,50,0.4)"; c.lineWidth = 0.8; c.beginPath();
  for (let i = 1; i < n; i++) { const f = i / n; c.moveTo(lerp(quad[0][0], quad[3][0], f), lerp(quad[0][1], quad[3][1], f)); c.lineTo(lerp(quad[1][0], quad[2][0], f), lerp(quad[1][1], quad[2][1], f)); }
  c.stroke();
  c.strokeStyle = "rgba(210,225,245,0.22)"; c.lineWidth = 0.7; c.beginPath();
  for (let i = 0; i < n; i++) { const f = (i + 0.5) / n; const a = [lerp(quad[0][0], quad[3][0], f), lerp(quad[0][1], quad[3][1], f)], b = [lerp(quad[1][0], quad[2][0], f), lerp(quad[1][1], quad[2][1], f)]; c.moveTo(...a); c.lineTo(...b); }
  c.stroke(); c.restore();
}
// stacked frustums (curved mansard / dome / spire). prof: [[inset, z], ...] from the bottom up. rect = u,v,du,dv
export function frustums(k, u, v, du, dv, z, prof, col, o = {}) {
  const R = (a, dz) => [[u + a, v + a, z + dz], [u + du - a, v + a, z + dz], [u + du - a, v + dv - a, z + dz], [u + a, v + dv - a, z + dz]];
  for (let i = 0; i < prof.length - 1; i++) {
    const A = R(prof[i][0], prof[i][1]), B = R(prof[i + 1][0], prof[i + 1][1]);
    const sh = (i / prof.length) * 0.12;
    // visible: right face (u+du side) and left face (v+dv side)
    slateQuad(k, [A[1], A[2], B[2], B[1]].map((p) => P(...p)), shade(col, -0.2 + sh * 0.5), { n: o.n ?? 3 });
    slateQuad(k, [A[2], A[3], B[3], B[2]].map((p) => P(...p)), shade(col, -0.02 + sh), { n: o.n ?? 3 });
    // rib line at the corner
    k.line([A[2], B[2]].map((p) => P(...p)), { lw: 0.9, wobble: 0 });
  }
  const T = R(prof[prof.length - 1][0], prof[prof.length - 1][1]);
  if (!o.noCap) k.path(T.map((p) => P(...p)), { fill: o.cap || shade(col, 0.12), lw: 1, wobble: 0 });
  return T;
}
// a small gabled dormer window on a slope, placed at (u,v,z) on the slope face (screen-space)
export function dormer(k, u, v, z, o = {}) {
  const [x, y] = P(u, v, z), w = (o.w ?? 7), h = o.h ?? 9, c = k.ctx;
  k.path([[x - w, y], [x + w, y], [x + w, y - h], [x - w, y - h]], { fill: o.frame || shade(STONE, 0.1), lw: 0.9, wobble: 0 });
  k.path([[x - w + 2, y - 1], [x + w - 2, y - 1], [x + w - 2, y - h + 2.5], [x - w + 2, y - h + 2.5]], { fill: o.lit ? "#f6dc86" : "#4f6073", lw: 0.7, wobble: 0 });
  k.path([[x - w - 1.5, y - h], [x + w + 1.5, y - h], [x, y - h - 8]], { fill: o.roof || "#5a6c8c", lw: 0.9, wobble: 0 });
  c.fillStyle = o.gold || GOLD; c.beginPath(); c.arc(x, y - h - 8.6, 1.3, 0, 7); c.fill();
}
export function chimney(k, u, v, z, o = {}) {
  const w = o.w ?? 0.28, h = o.h ?? 0.8;
  k.box(u, v, z, w, w, h, o.col || "#d8c08a", { hatch: false, shadow: false });
  for (const [du, dv] of [[0.05, 0.05], [0.16, 0.05], [0.05, 0.16], [0.16, 0.16]]) k.box(u + du, v + dv, z + h, 0.07, 0.07, 0.16, "#9a5a3a", { hatch: false, shadow: false });
  if (o.smoke) smoke(k, u + w / 2, v + w / 2, z + h + 0.18, o.seed || 1);
}
export function smoke(k, u, v, z, seed = 1) {
  const c = k.ctx, t = k.t;
  for (let i = 0; i < 5; i++) {
    const ph = (t * 0.28 + i / 5 + seed * 0.13) % 1;
    const [x, y] = P(u, v, z + ph * 1.5);
    const r = 3 + ph * 7, a = (1 - ph) * 0.55;
    c.fillStyle = `rgba(245,240,232,${a})`; c.strokeStyle = `rgba(80,70,60,${a * 0.6})`; c.lineWidth = 0.8;
    c.beginPath(); c.arc(x + Math.sin(ph * 5 + seed) * 4 + ph * 9, y, r, 0, 7); c.fill(); c.stroke();
  }
}
export function statue(k, u, v, z, o = {}) {
  const [x, y] = P(u, v, z), c = k.ctx, col = o.col || "#cdb98a", s = o.s ?? 1;
  c.fillStyle = shade(col, -0.2); c.strokeStyle = INK; c.lineWidth = 0.9;
  c.beginPath(); c.rect(x - 3 * s, y - 3 * s, 6 * s, 3 * s); c.fill(); c.stroke();
  c.fillStyle = col; c.beginPath(); c.moveTo(x - 2.4 * s, y - 3 * s); c.lineTo(x - 1.6 * s, y - 11 * s); c.lineTo(x + 1.6 * s, y - 11 * s); c.lineTo(x + 2.4 * s, y - 3 * s); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.arc(x, y - 13 * s, 1.9 * s, 0, 7); c.fill(); c.stroke();
  if (o.arm) { c.beginPath(); c.moveTo(x + 1.5 * s, y - 10 * s); c.lineTo(x + 4.5 * s, y - 15 * s); c.lineWidth = 1.4; c.stroke(); }
}

// ---------- water + jets ----------
export function jet(k, u, v, z, h, t, o = {}) {
  const c = k.ctx, n = o.n ?? 14, spread = o.spread ?? 0.5, seed = o.seed ?? 1;
  const [bx, by] = P(u, v, z), top = h * CTS.S * CTS.ZS;
  c.save();
  // ripple rings
  for (let i = 0; i < 3; i++) { const ph = (t * 0.7 + i / 3) % 1; c.strokeStyle = `rgba(255,255,255,${(1 - ph) * 0.85})`; c.lineWidth = 1.2; c.beginPath(); c.ellipse(bx, by, 5 + ph * 30 * spread * 1.6, (5 + ph * 30 * spread * 1.6) * 0.5, 0, 0, 7); c.stroke(); }
  // central column (breathes)
  const hh = top * (0.92 + 0.08 * Math.sin(t * 3 + seed));
  c.lineCap = "round";
  c.strokeStyle = "rgba(60,110,150,0.6)"; c.lineWidth = 4.4; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx, by - hh); c.stroke();
  c.strokeStyle = "rgba(250,254,255,0.96)"; c.lineWidth = 2.6; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx, by - hh); c.stroke();
  // droplets: parabolas out of the top
  for (let i = 0; i < n; i++) {
    const ph = (t * (0.85 + (i % 3) * 0.08) + i / n + seed * 0.1) % 1;
    const ang = (i / n) * Math.PI * 2 + seed, rr = spread * CTS.S * (0.5 + 0.5 * hash(i + seed));
    const dx = Math.cos(ang) * rr * ph, dy = Math.sin(ang) * rr * ph * 0.5;
    const yy = by - hh + (ph * ph * 1.0 * (hh + 4) * 1.0) - Math.sin(ph * Math.PI) * -0 ;
    const x = bx + dx, y = by - hh * (1 - 0) + ph * ph * hh + dy;
    c.fillStyle = `rgba(255,255,255,${0.95 - ph * 0.3})`; c.strokeStyle = "rgba(70,120,160,0.7)"; c.lineWidth = 0.7;
    c.beginPath(); c.arc(x, y, 1.9 - ph * 0.5, 0, 7); c.fill(); c.stroke();
  }
  c.restore();
}

// ---------- little life ----------
export function pigeon(k, u, v, t, seed = 1) {
  const c = k.ctx, [x, y] = P(u, v, 0), ph = t * 2.2 + seed * 3, peck = Math.max(0, Math.sin(ph)) ** 3, face = seed % 2 ? 1 : -1;
  const hop = Math.max(0, Math.sin(t * 0.7 + seed * 5) - 0.93) * 40;
  c.fillStyle = "rgba(60,45,30,0.15)"; c.beginPath(); c.ellipse(x, y + 1, 4.5, 1.6, 0, 0, 7); c.fill();
  c.fillStyle = "#9a9fa6"; c.strokeStyle = INK; c.lineWidth = 0.8;
  c.beginPath(); c.ellipse(x, y - 4 - hop, 4.4, 2.8, face * 0.2, 0, 7); c.fill(); c.stroke();
  c.fillStyle = "#6e7a8a"; c.beginPath(); c.arc(x + face * (4.2 + peck), y - 6 - hop + peck * 3, 1.9, 0, 7); c.fill(); c.stroke();
  c.fillStyle = "#e0a040"; c.fillRect(x + face * (5.8 + peck), y - 6 - hop + peck * 3, 1.3 * face, 0.9);
  c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - 1, y - 1.5); c.lineTo(x - 1, y); c.moveTo(x + 1, y - 1.5); c.lineTo(x + 1, y); c.stroke();
}
// pigeon flock lifting off and circling over a spot
export function flock(k, cx, cy, n, t, seed = 1) {
  for (let i = 0; i < n; i++) {
    const a = t * (0.55 + (i % 3) * 0.07) + i * 1.3 + seed;
    k.bird(cx + Math.cos(a) * (60 + i * 11), cy + Math.sin(a * 1.2) * (22 + i * 3) - (i % 2) * 14, { phase: i * 0.8, size: 0.8 });
  }
}
export function sparkle(k, x, y, ph, s = 1) {
  const a = Math.max(0, Math.sin(ph)) ** 3; if (a < 0.05) return;
  const c = k.ctx; c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = 1.3; c.lineCap = "round";
  c.beginPath(); c.moveTo(x - 5 * s * a, y); c.lineTo(x + 5 * s * a, y); c.moveTo(x, y - 5 * s * a); c.lineTo(x, y + 5 * s * a); c.stroke();
}
// planter box with a clipped bush
export function planter(k, u, v, o = {}) {
  const du = o.du ?? 0.7, dv = o.dv ?? 0.34;
  k.box(u, v, 0, du, dv, 0.26, "#8d6d4e", { hatch: false, shadow: true });
  k.ell(u + du / 2, v + dv / 2, 0.26, 0.2, "#6e9a50", { lw: 0.5 });
  const [x, y] = P(u + du / 2, v + dv / 2, 0.3);
  k._lobe(x, y - 7, 9, "#6f9f52", Math.round(u * 17 + v * 5), { squash: 1.1, bumps: 8 });
}
// paving: cobble dots on a (u,v) polygon, clipped (cheap)
export function cobbles(k, pts, o = {}) {
  const c = k.ctx, R = rng(o.seed ?? 4), P2 = pts.map(([u, v]) => P(u, v, 0));
  c.save(); k._trace(P2, true, 0); c.clip();
  c.strokeStyle = o.line || "rgba(120,95,60,0.16)"; c.lineWidth = 0.7; c.beginPath();
  const g = o.gap ?? 0.34;
  for (let a = 0; a <= 10.01; a += g) { c.moveTo(...P(a, 0)); c.lineTo(...P(a, 10)); c.moveTo(...P(0, a)); c.lineTo(...P(10, a)); }
  c.stroke();
  c.fillStyle = "rgba(255,250,235,0.35)";
  for (let i = 0; i < 260; i++) { const [x, y] = P(R() * 10, R() * 10); c.fillRect(x, y, 2, 1); }
  c.restore();
}
// ground ellipse shadow for any prop
export function drop(k, u, v, r = 0.3, a = 0.15) { k.ell(u + 0.1, v + 0.05, 0, r, `rgba(60,45,30,${a})`, { stroke: false }); }
export { P, CTS, INK, shade, mix, lerp, clamp, rng, hash, smooth };
