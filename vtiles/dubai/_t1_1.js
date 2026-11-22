// helpers for the Dubai 1,1 tile (Al Fahidi & Dubai Creek). Private to this tile; _props.js is untouched.
import { P, CTS, INK, shade, lerp, clamp, rng, hash, drawHuman } from "../../lib/vec-kit.js";
import { clipPoly } from "./_props.js";

export const WALL = "#e2c18a", WALL_L = "#ecd2a2", WALL_D = "#cfa56c", TRIM = "#f2e3c0", WOOD = "#7a4a28", WOOD_D = "#5a331b", WOOD_L = "#a26c3e";
const tr = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
const ln = (c, a, b, col, w) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); };
// stroke with an ink outline (beam / pole look)
export function beam(c, a, b, col, w) { c.lineCap = "round"; ln(c, a, b, INK, w + 1.8); ln(c, a, b, col, w); }

// ---------- rotated frames (the reference's shallow-V quay) ----------
// O = quay corner, B = far end of the quay; s runs O->B, d runs back from the quay line (away from the water)
export function frame(O, B, toward = [10, 10]) {
  const L = Math.hypot(B[0] - O[0], B[1] - O[1]), e = [(B[0] - O[0]) / L, (B[1] - O[1]) / L];
  let n = [e[1], -e[0]]; if (n[0] * (toward[0] - O[0]) + n[1] * (toward[1] - O[1]) < 0) n = [-n[0], -n[1]];
  const p = (s, d) => [O[0] + e[0] * s - n[0] * d, O[1] + e[1] * s - n[1] * d];
  return {
    O, e, n, L, p,
    rect: (s0, s1, d0, d1) => [p(s0, d0), p(s1, d0), p(s1, d1), p(s0, d1)],
    // front facade at depth d: pt(s, z, out) with out toward the water
    front: (d) => (s, z, o = 0) => P(...p(s, d - o), z),
    // end facade at s = s1 (normal +e): param a runs along d from d0
    end: (s1, d0) => (a, z, o = 0) => P(...p(s1 + o, d0 + a), z),
    // ground point in front of the facade
    g: (s, d) => p(s, d),
  };
}
export const tileClip = (poly) => [(u, v) => u, (u, v) => v, (u, v) => 10 - u, (u, v) => 10 - v].reduce((pp, f) => clipPoly(pp, f), poly);
export const half = (poly, f) => clipPoly(poly, f);

// ---------- solids with plaster texture ----------
const faceShade = (nu, nv) => -0.04 - 0.14 * Math.max(0, nu) * Math.max(0, nu) + 0.03 * Math.max(0, -nu);
export function solid(k, foot, z0, z1, col, o = {}) {
  const c = k.ctx, n = foot.length; let cu = 0, cv = 0; for (const [u, v] of foot) { cu += u; cv += v; } cu /= n; cv /= n;
  const faces = [];
  for (let i = 0; i < n; i++) {
    const a = foot[i], b = foot[(i + 1) % n], du = b[0] - a[0], dv = b[1] - a[1], L = Math.hypot(du, dv);
    if (L < 1e-4) continue;
    let nu = dv / L, nv = -du / L; const mu = (a[0] + b[0]) / 2, mv = (a[1] + b[1]) / 2;
    if ((mu - cu) * nu + (mv - cv) * nv < 0) { nu = -nu; nv = -nv; }
    if (nu + nv > 0.02) faces.push({ a, b, nu, nv, L, e: [du / L, dv / L], d: mu + mv });
  }
  faces.sort((p, q) => p.d - q.d);
  for (const f of faces) {
    f.pt = (s, z, oo = 0) => P(f.a[0] + f.e[0] * s + f.nu * oo, f.a[1] + f.e[1] * s + f.nv * oo, z);
    const poly = [f.pt(0, z0), f.pt(f.L, z0), f.pt(f.L, z1), f.pt(0, z1)];
    f.poly = poly;
    k.path(poly, { fill: shade(col, faceShade(f.nu, f.nv) + (o.dark ?? 0)), lw: o.lw ?? 1.5, wobble: o.wobble ?? 0.3 });
    if (o.tex !== false && z1 - z0 > 0.3) plaster(k, f, z0, z1, col, o.seed ?? 1);
  }
  if (o.top !== false) k.poly(foot.map(([u, v]) => [u, v, z1]), o.topCol || shade(col, 0.07), { lw: o.lw ?? 1.5, wobble: 0.2 });
  return faces;
}
// rough coral-stone plaster: soft blotches, broken course lines, grime at the foot, light under the parapet
function plaster(k, f, z0, z1, col, seed) {
  const c = k.ctx, R = rng(Math.round(f.a[0] * 131 + f.a[1] * 71 + z0 * 13 + seed));
  c.save(); tr(c, f.poly); c.clip();
  const n = Math.round(f.L * (z1 - z0) * 5);
  for (let i = 0; i < n; i++) {
    const [x, y] = f.pt(R() * f.L, z0 + R() * (z1 - z0));
    c.fillStyle = R() < 0.5 ? "rgba(255,240,205,0.16)" : "rgba(120,80,40,0.08)";
    c.beginPath(); c.ellipse(x, y, 4 + R() * 9, 2 + R() * 4, 0, 0, 6.3); c.fill();
  }
  c.strokeStyle = "rgba(120,85,45,0.16)"; c.lineWidth = 0.7; c.beginPath();
  for (let z = z0 + 0.28; z < z1 - 0.1; z += 0.28) {
    let s = R() * 0.4;
    while (s < f.L) { const l = 0.2 + R() * 0.5; c.moveTo(...f.pt(s, z + (R() - 0.5) * 0.03)); c.lineTo(...f.pt(Math.min(f.L, s + l), z + (R() - 0.5) * 0.03)); s += l + 0.15 + R() * 0.4; }
  }
  c.stroke();
  // grime band at the foot + pale band under the top
  const g = c.createLinearGradient(0, f.pt(0, z0)[1], 0, f.pt(0, z0 + 0.5)[1]); g.addColorStop(0, "rgba(110,70,35,0.18)"); g.addColorStop(1, "rgba(110,70,35,0)");
  c.fillStyle = g; c.fillRect(0, 0, 1024, 1024);
  // a few hairline cracks
  c.strokeStyle = "rgba(90,60,30,0.25)"; c.lineWidth = 0.6;
  for (let i = 0; i < Math.round(f.L * 0.6); i++) { let s = R() * f.L, z = z0 + 0.3 + R() * (z1 - z0 - 0.5); c.beginPath(); c.moveTo(...f.pt(s, z)); for (let j = 0; j < 3; j++) { s += (R() - 0.5) * 0.12; z -= 0.08 + R() * 0.08; c.lineTo(...f.pt(s, z)); } c.stroke(); }
  c.restore();
}
// crenellated parapet around a roof: low band + square merlons with stepped tips on every edge
export function crown(k, foot, z, col, o = {}) {
  const n = foot.length, t = o.t ?? 0.1, mh = o.mh ?? 0.2, bh = o.bh ?? 0.08, w = o.w ?? 0.15, gap = o.gap ?? 0.09;
  let cu = 0, cv = 0; for (const [u, v] of foot) { cu += u; cv += v; } cu /= n; cv /= n;
  const edges = [];
  for (let i = 0; i < n; i++) {
    const a = foot[i], b = foot[(i + 1) % n], du = b[0] - a[0], dv = b[1] - a[1], L = Math.hypot(du, dv);
    if (L < 0.05) continue;
    let nu = dv / L, nv = -du / L; if (((a[0] + b[0]) / 2 - cu) * nu + ((a[1] + b[1]) / 2 - cv) * nv < 0) { nu = -nu; nv = -nv; }
    edges.push({ a, b, e: [du / L, dv / L], nu, nv, L, d: (a[0] + b[0] + a[1] + b[1]) / 2 });
  }
  edges.sort((p, q) => p.d - q.d);
  const pc = shade(col, 0.04);
  for (const E of edges) {
    if (o.skip && o.skip(E)) continue;
    const at = (s, dd) => [E.a[0] + E.e[0] * s - E.nu * dd, E.a[1] + E.e[1] * s - E.nv * dd];
    solid(k, [at(0, 0), at(E.L, 0), at(E.L, t), at(0, t)], z, z + bh, pc, { tex: false, lw: 1.1, wobble: 0 });
    const m = Math.max(1, Math.floor((E.L - gap) / (w + gap))), off = (E.L - m * (w + gap) + gap) / 2;
    for (let j = 0; j < m; j++) {
      const s = off + j * (w + gap);
      solid(k, [at(s, 0), at(s + w, 0), at(s + w, t), at(s, t)], z + bh, z + bh + mh * 0.7, pc, { tex: false, lw: 1, wobble: 0 });
      solid(k, [at(s + w * 0.22, 0.015), at(s + w * 0.78, 0.015), at(s + w * 0.78, t - 0.015), at(s + w * 0.22, t - 0.015)], z + bh + mh * 0.7, z + bh + mh, pc, { tex: false, lw: 0.9, wobble: 0 });
    }
  }
}

// ---------- facade details (F = (s, z, out) -> px) ----------
// carved wooden door in a stone surround with a pointed arch, studs and a ring
export function door(k, F, s, w, h, o = {}) {
  const c = k.ctx, z0 = o.z ?? 0, fr = 0.07;
  const arch = (a0, a1, zt, rise, out = 0) => { const pts = [F(a0, z0, out), F(a0, zt, out)]; for (let i = 1; i < 10; i++) { const f = i / 10; pts.push(F(lerp(a0, a1, f), zt + Math.sin(Math.PI * f) * rise + (o.pointed ? (0.5 - Math.abs(f - 0.5)) * rise * 0.5 : 0), out)); } pts.push(F(a1, zt, out), F(a1, z0, out)); return pts; };
  k.path(arch(s - fr, s + w + fr, z0 + h, w * 0.32), { fill: o.frame || TRIM, lw: 1.1, wobble: 0 });
  k.path(arch(s, s + w, z0 + h, w * 0.26), { fill: "#3a2416", lw: 1, wobble: 0 });
  // two leaves with plank lines + carved panels
  const lc = o.col || "#7b4724";
  for (const [a0, a1] of [[s + 0.02, s + w / 2 - 0.005], [s + w / 2 + 0.005, s + w - 0.02]]) {
    const q = [F(a0, z0), F(a1, z0), F(a1, z0 + h - 0.02), F(a0, z0 + h - 0.02)];
    k.path(q, { fill: lc, lw: 0.9, wobble: 0 });
    c.strokeStyle = "rgba(40,20,8,0.45)"; c.lineWidth = 0.6; c.beginPath();
    for (let j = 1; j < 3; j++) { const a = lerp(a0, a1, j / 3); c.moveTo(...F(a, z0 + 0.02)); c.lineTo(...F(a, z0 + h - 0.04)); } c.stroke();
    for (const [zz0, zz1] of [[0.12, 0.42], [0.5, h - 0.12]]) k.path([F(lerp(a0, a1, 0.18), z0 + zz0), F(lerp(a0, a1, 0.82), z0 + zz0), F(lerp(a0, a1, 0.82), z0 + Math.min(zz1, h - 0.08)), F(lerp(a0, a1, 0.18), z0 + Math.min(zz1, h - 0.08))], { fill: shade(lc, 0.1), lw: 0.6, wobble: 0, stroke: "rgba(40,20,8,0.6)" });
    c.fillStyle = "#d6b25e"; for (let j = 0; j < 3; j++) for (let r = 0; r < 4; r++) { const [x, y] = F(lerp(a0, a1, 0.25 + j * 0.25), z0 + 0.1 + r * (h - 0.2) / 3); c.fillRect(x - 0.6, y - 0.6, 1.3, 1.3); }
  }
  // ring knocker
  const [rx, ry] = F(s + w / 2 + 0.06, z0 + h * 0.5); c.strokeStyle = "#c9a046"; c.lineWidth = 1; c.beginPath(); c.arc(rx, ry + 1.5, 1.6, 0, 6.3); c.stroke();
  // step
  k.path([F(s - fr - 0.04, z0, 0.12), F(s + w + fr + 0.04, z0, 0.12), F(s + w + fr + 0.04, z0 + 0.05, 0.12), F(s - fr - 0.04, z0 + 0.05, 0.12)], { fill: shade(TRIM, -0.08), lw: 0.8, wobble: 0 });
}
// small window: stone sill + lintel beam, dark recess, wooden shutter grille
export function win(k, F, s, z, w, h, o = {}) {
  const c = k.ctx;
  k.path([F(s - 0.04, z - 0.04), F(s + w + 0.04, z - 0.04), F(s + w + 0.04, z + h + 0.04), F(s - 0.04, z + h + 0.04)], { fill: o.frame || TRIM, lw: 0.9, wobble: 0 });
  k.path([F(s, z), F(s + w, z), F(s + w, z + h), F(s, z + h)], { fill: "#3b2618", lw: 0.9, wobble: 0 });
  if (o.lit) { const a = 0.35 + 0.25 * Math.sin(k.t * 1.3 + s * 7); k.path([F(s + 0.02, z + 0.02), F(s + w - 0.02, z + 0.02), F(s + w - 0.02, z + h - 0.02), F(s + 0.02, z + h - 0.02)], { fill: `rgba(255,196,96,${a})`, stroke: false, wobble: 0 }); }
  c.strokeStyle = o.grille || "#8a5730"; c.lineWidth = 1.1; c.beginPath();
  const nb = Math.max(2, Math.round(w / 0.07));
  for (let j = 1; j < nb; j++) { const a = s + (w * j) / nb; c.moveTo(...F(a, z)); c.lineTo(...F(a, z + h)); }
  for (let j = 1; j < 3; j++) { const zz = z + (h * j) / 3; c.moveTo(...F(s, zz)); c.lineTo(...F(s + w, zz)); }
  c.stroke();
  if (o.shutters) for (const [a0, a1] of [[s - w * 0.48, s - 0.02], [s + w + 0.02, s + w * 1.48]]) {
    k.path([F(a0, z), F(a1, z), F(a1, z + h), F(a0, z + h)], { fill: o.shutters, lw: 0.8, wobble: 0 });
    c.strokeStyle = "rgba(30,20,10,0.4)"; c.lineWidth = 0.5; c.beginPath(); for (let j = 1; j < 5; j++) { const zz = z + (h * j) / 5; c.moveTo(...F(a0, zz)); c.lineTo(...F(a1, zz)); } c.stroke();
  }
  // timber lintel poking out both sides
  beam(c, F(s - 0.1, z + h + 0.07, 0.02), F(s + w + 0.1, z + h + 0.07, 0.02), WOOD, 2);
}
// carved gypsum panel in an arched recess (geometric lattice)
export function gypsum(k, F, s, z, w, h, o = {}) {
  const c = k.ctx, rise = w * 0.45;
  const outline = (a0, a1, zb, zt, r) => { const pts = [F(a0, zb), F(a0, zt)]; for (let i = 1; i < 12; i++) { const f = i / 12; pts.push(F(lerp(a0, a1, f), zt + (Math.sin(Math.PI * f) * 0.7 + (0.5 - Math.abs(f - 0.5)) * 0.6) * r)); } pts.push(F(a1, zt), F(a1, zb)); return pts; };
  k.path(outline(s - 0.05, s + w + 0.05, z - 0.05, z + h, rise * 1.1), { fill: shade(WALL, -0.12), lw: 1, wobble: 0 });
  const inner = outline(s, s + w, z, z + h - 0.03, rise);
  k.path(inner, { fill: o.fill || "#efe0bf", lw: 0.9, wobble: 0 });
  c.save(); tr(c, inner); c.clip();
  c.strokeStyle = "rgba(120,85,45,0.55)"; c.lineWidth = 0.7; c.beginPath();
  const step = 0.06;
  for (let a = s - h; a < s + w + h; a += step) { c.moveTo(...F(a, z)); c.lineTo(...F(a + h + rise, z + h + rise)); c.moveTo(...F(a, z + h + rise)); c.lineTo(...F(a + h + rise, z)); }
  c.stroke();
  // rosette dots at lattice crossings
  c.fillStyle = "rgba(110,75,40,0.6)"; for (let a = s + step / 2; a < s + w; a += step * 2) for (let zz = z + 0.05; zz < z + h; zz += step * 2) { const [x, y] = F(a, zz); c.fillRect(x - 0.6, y - 0.6, 1.2, 1.2); }
  c.restore();
}
// arched opening (loggia / niche) with a warm interior glow
export function archOpen(k, F, s, z, w, h, o = {}) {
  const c = k.ctx, r = w / 2;
  const pts = [F(s, z), F(s, z + h - r)]; for (let i = 1; i < 12; i++) { const f = i / 12; pts.push(F(s + w * f, z + h - r + Math.sin(Math.PI * f) * r * 1.15 + (0.5 - Math.abs(f - 0.5)) * r * 0.3)); } pts.push(F(s + w, z + h - r), F(s + w, z));
  const fr = pts.map((p, i) => p); k.path(fr, { fill: o.dark ?? "#4b3020", lw: 1.1, wobble: 0 });
  c.save(); tr(c, pts); c.clip();
  const g = c.createLinearGradient(0, F(s, z + h)[1], 0, F(s, z)[1]); g.addColorStop(0, "rgba(90,55,30,0.9)"); g.addColorStop(1, o.glow || "rgba(214,150,80,0.85)"); c.fillStyle = g; c.fillRect(0, 0, 1024, 1024);
  if (o.lamp) { const [x, y] = F(s + w / 2, z + h - r * 0.9); c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x, y - 6); c.lineTo(x, y); c.stroke(); c.fillStyle = "#ffd77a"; c.beginPath(); c.arc(x, y + 2, 2.2, 0, 6.3); c.fill(); }
  c.restore();
  k.path(pts, { lw: 1.2, wobble: 0 });
  // pale stucco rim
  c.strokeStyle = "rgba(255,244,220,0.8)"; c.lineWidth = 1.2; c.beginPath(); pts.slice(1, -1).forEach((p, i) => (i ? c.lineTo(p[0] - 1, p[1] - 1) : c.moveTo(p[0] - 1, p[1] - 1))); c.stroke();
}
// projecting wooden mashrabiya oriel: lattice front, side panels, little roof, brackets
export function mashrabiya(k, F, s, z, w, h, dep = 0.28) {
  const c = k.ctx;
  // brackets
  for (const a of [s + 0.08, s + w - 0.08]) { k.path([F(a - 0.03, z, 0), F(a + 0.03, z, 0), F(a + 0.03, z, dep), F(a, z - 0.25, 0.02)], { fill: WOOD_D, lw: 0.8, wobble: 0 }); }
  // floor slab
  k.path([F(s - 0.03, z, 0), F(s + w + 0.03, z, 0), F(s + w + 0.03, z, dep + 0.03), F(s - 0.03, z, dep + 0.03)], { fill: WOOD, lw: 0.9, wobble: 0 });
  k.path([F(s - 0.03, z, dep + 0.03), F(s + w + 0.03, z, dep + 0.03), F(s + w + 0.03, z - 0.07, dep + 0.03), F(s - 0.03, z - 0.07, dep + 0.03)], { fill: WOOD_D, lw: 0.9, wobble: 0 });
  // side panel (the one toward the viewer: s+w side when the face runs left->right on screen)
  const sideA = F(s + w, z, 0)[0] > F(s, z, 0)[0] ? s + w : s;
  k.path([F(sideA, z, 0), F(sideA, z, dep), F(sideA, z + h, dep), F(sideA, z + h, 0)], { fill: shade(WOOD, -0.25), lw: 0.9, wobble: 0 });
  // front lattice panel
  const fp = [F(s, z, dep), F(s + w, z, dep), F(s + w, z + h, dep), F(s, z + h, dep)];
  k.path(fp, { fill: "#3a2314", lw: 1, wobble: 0 });
  c.save(); tr(c, fp); c.clip();
  c.strokeStyle = WOOD_L; c.lineWidth = 1.1; c.beginPath();
  const st = 0.055;
  for (let a = s - h; a < s + w + h; a += st) { c.moveTo(...F(a, z, dep)); c.lineTo(...F(a + h, z + h, dep)); c.moveTo(...F(a, z + h, dep)); c.lineTo(...F(a + h, z, dep)); }
  c.stroke();
  c.fillStyle = "rgba(255,190,100,0.35)"; c.fillRect(0, 0, 1024, 1024);
  c.restore();
  // frame bars
  c.strokeStyle = WOOD_D; c.lineWidth = 1.6; c.beginPath(); for (const a of [s + w / 3, s + (2 * w) / 3]) { c.moveTo(...F(a, z, dep)); c.lineTo(...F(a, z + h, dep)); } c.moveTo(...F(s, z + h * 0.35, dep)); c.lineTo(...F(s + w, z + h * 0.35, dep)); c.stroke();
  k.path(fp, { lw: 1.2, wobble: 0 });
  // little roof with a carved fringe
  k.path([F(s - 0.06, z + h, 0), F(s + w + 0.06, z + h, 0), F(s + w + 0.06, z + h + 0.02, dep + 0.08), F(s - 0.06, z + h + 0.02, dep + 0.08)], { fill: shade(WOOD, 0.08), lw: 1, wobble: 0 });
  k.path([F(s - 0.06, z + h + 0.02, dep + 0.08), F(s + w + 0.06, z + h + 0.02, dep + 0.08), F(s + w + 0.06, z + h - 0.06, dep + 0.08), F(s - 0.06, z + h - 0.06, dep + 0.08)], { fill: WOOD_D, lw: 0.8, wobble: 0 });
  c.fillStyle = WOOD_D; for (let a = s; a <= s + w + 0.01; a += 0.06) { const [x, y] = F(a, z + h - 0.06, dep + 0.08); c.beginPath(); c.moveTo(x - 1.5, y); c.lineTo(x + 1.5, y); c.lineTo(x, y + 2.5); c.fill(); }
}
// wooden roof beams (danchal) sticking out of a wall
export function beams(k, F, list, z, len = 0.22) { for (const s of list) { const a = F(s, z, 0), b = F(s, z, len); beam(k.ctx, a, b, WOOD_L, 2.2); k.ctx.fillStyle = "#5c3a1f"; k.ctx.beginPath(); k.ctx.arc(b[0], b[1], 1.2, 0, 6.3); k.ctx.fill(); } }
// timber rain spout
export function spout(k, F, s, z) { beam(k.ctx, F(s, z, 0), F(s, z - 0.04, 0.3), "#8b5a32", 2.6); }

// ---------- wind tower (barjeel) ----------
// footprint = 4 (u,v) corners of a square; z0 = roof, z1 = cap top
export function barjeel(k, foot, z0, z1, o = {}) {
  const c = k.ctx, col = o.col || WALL_L;
  const zm = lerp(z0, z1, 0.32), zc = z1 - 0.22; // lower shaft / louvre zone / cap
  const faces = solid(k, foot, z0, zc, col, { seed: 7, top: false });
  for (const f of faces) {
    const L = f.L, F = f.pt, n = o.bays ?? 3;
    // lower shaft: two slit windows + a carved band
    for (let i = 0; i < 2; i++) { const a = L * (0.28 + i * 0.32); k.path([F(a, z0 + 0.25), F(a + 0.09, z0 + 0.25), F(a + 0.09, zm - 0.2), F(a, zm - 0.2)], { fill: "#3d2718", lw: 0.8, wobble: 0 }); beam(c, F(a - 0.05, zm - 0.13, 0.02), F(a + 0.14, zm - 0.13, 0.02), WOOD, 1.4); }
    k.path([F(0, zm - 0.05), F(L, zm - 0.05), F(L, zm + 0.02), F(0, zm + 0.02)], { fill: shade(col, -0.12), lw: 0.8, wobble: 0 });
    // louvre zone: tall pointed openings separated by piers
    const m = 0.07, bw = (L - m * 2) / n;
    for (let i = 0; i < n; i++) {
      const a0 = m + i * bw + 0.035, a1 = m + (i + 1) * bw - 0.035, zt = zc - 0.12, zb = zm + 0.12, r = (a1 - a0) / 2;
      const pts = [F(a0, zb), F(a0, zt - r)]; for (let j = 1; j < 10; j++) { const ff = j / 10; pts.push(F(lerp(a0, a1, ff), zt - r + Math.sin(Math.PI * ff) * r * 0.9 + (0.5 - Math.abs(ff - 0.5)) * r * 0.5)); } pts.push(F(a1, zt - r), F(a1, zb));
      k.path(pts, { fill: "#2f1d12", lw: 1, wobble: 0 });
      // inner partition wall catching light + horizontal tie poles
      c.save(); tr(c, pts); c.clip();
      const g = c.createLinearGradient(...F(a0, zb), ...F(a1, zb)); g.addColorStop(0, "rgba(120,80,45,0.0)"); g.addColorStop(1, "rgba(200,150,95,0.55)"); c.fillStyle = g; c.fillRect(0, 0, 1024, 1024);
      c.restore();
      for (const zz of [lerp(zb, zt, 0.25), lerp(zb, zt, 0.55)]) beam(c, F(a0 - 0.03, zz, 0.01), F(a1 + 0.03, zz, 0.01), WOOD_L, 1.4);
    }
    // corner pilasters
    for (const a of [0.035, L - 0.035]) k.path([F(a - 0.035, zm + 0.02), F(a + 0.035, zm + 0.02), F(a + 0.035, zc), F(a - 0.035, zc)], { fill: shade(col, -0.03 - 0.12 * Math.max(0, f.nu)), lw: 0.8, wobble: 0 });
    // projecting poles at two heights
    for (const [a, zz] of [[0.0, lerp(zm, zc, 0.35)], [L, lerp(zm, zc, 0.35)], [0, lerp(zm, zc, 0.75)], [L, lerp(zm, zc, 0.75)], [L / 2, zm - 0.02]]) { const p0 = F(a, zz, 0), p1 = F(a, zz - 0.02, 0.32); beam(c, p0, p1, WOOD_L, 2); }
  }
  // cap: overhanging cornice + parapet with merlons
  let cu = 0, cv = 0; for (const [u, v] of foot) { cu += u; cv += v; } cu /= 4; cv /= 4;
  const grow = (g) => foot.map(([u, v]) => [cu + (u - cu) * g, cv + (v - cv) * g]);
  solid(k, grow(1.12), zc, zc + 0.08, shade(col, -0.05), { tex: false, lw: 1.2, wobble: 0 });
  solid(k, grow(1.18), zc + 0.08, zc + 0.14, col, { tex: false, lw: 1.2, wobble: 0, topCol: shade(col, 0.1) });
  crown(k, grow(1.18), zc + 0.14, col, { t: 0.08, mh: 0.12, bh: 0.04, w: 0.1, gap: 0.06 });
  return faces;
}

// ---------- souk ----------
// striped awning sloping out of a facade; valance flutters
function awningOld(k, F, s0, s1, z, o = {}) {
  const c = k.ctx, t = k.t, n = o.stripes ?? 8, d = o.depth ?? 0.55, drop = o.drop ?? 0.3, c1 = o.c1 || "#d64b44", c2 = o.c2 || "#f7f1e6";
  // poles at the front corners
  if (o.poles !== false) for (const s of [s0 + 0.03, s1 - 0.03]) beam(c, F(s, 0, d - 0.02), F(s, z - drop, d - 0.02), WOOD, 1.6);
  for (let i = 0; i < n; i++) {
    const a = lerp(s0, s1, i / n), b = lerp(s0, s1, (i + 1) / n), col = i % 2 ? c2 : c1;
    k.path([F(a, z, 0), F(b, z, 0), F(b, z - drop, d), F(a, z - drop, d)], { fill: col, lw: 0.9, wobble: 0 });
    const fl = Math.sin(t * 3.2 + i * 0.9 + s0 * 3) * 1.2;
    const p0 = F(a, z - drop, d), p1 = F(b, z - drop, d);
    c.beginPath(); c.moveTo(...p0); c.lineTo(p0[0], p0[1] + 4 + fl); c.quadraticCurveTo((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 + 8 + fl, p1[0], p1[1] + 4 + fl); c.lineTo(...p1); c.closePath();
    c.fillStyle = col; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
  }
  // shading under the awning ridge
  k.line([F(s0, z, 0), F(s1, z, 0)], { lw: 1.6, wobble: 0 });
}
export function lantern(k, x, y, o = {}) {
  const c = k.ctx, t = k.t, s = o.s ?? 1, a = Math.sin(t * 1.7 + (o.ph ?? 0)) * 0.14, L = (o.chain ?? 8) * s;
  c.save(); c.translate(x, y); c.rotate(a);
  c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, L); c.stroke();
  const glow = 0.75 + 0.25 * Math.sin(t * 5 + (o.ph ?? 0) * 3);
  const gr = c.createRadialGradient(0, L + 6 * s, 1, 0, L + 6 * s, 11 * s); gr.addColorStop(0, `rgba(255,214,120,${0.45 * glow})`); gr.addColorStop(1, "rgba(255,214,120,0)"); c.fillStyle = gr; c.beginPath(); c.arc(0, L + 6 * s, 11 * s, 0, 6.3); c.fill();
  // cap dome, faceted glass body, base, finial
  c.fillStyle = o.metal || "#b88a3a"; c.beginPath(); c.moveTo(-3 * s, L + 2 * s); c.quadraticCurveTo(0, L - 3 * s, 3 * s, L + 2 * s); c.closePath(); c.fill(); c.lineWidth = 0.8; c.stroke();
  c.beginPath(); c.moveTo(-3.4 * s, L + 2 * s); c.lineTo(3.4 * s, L + 2 * s); c.lineTo(2.4 * s, L + 9 * s); c.lineTo(-2.4 * s, L + 9 * s); c.closePath();
  c.fillStyle = o.glass || `rgba(255,${190 + 30 * glow | 0},90,0.95)`; c.fill(); c.stroke();
  c.beginPath(); c.moveTo(0, L + 2 * s); c.lineTo(0, L + 9 * s); c.moveTo(-1.6 * s, L + 2 * s); c.lineTo(-1.1 * s, L + 9 * s); c.moveTo(1.6 * s, L + 2 * s); c.lineTo(1.1 * s, L + 9 * s); c.lineWidth = 0.5; c.stroke();
  c.fillStyle = o.metal || "#b88a3a"; c.beginPath(); c.moveTo(-2.4 * s, L + 9 * s); c.lineTo(2.4 * s, L + 9 * s); c.lineTo(0, L + 12.5 * s); c.closePath(); c.fill(); c.lineWidth = 0.8; c.stroke();
  c.restore();
}
// woven basket heaped with spice (u,v ground)
export function spiceBasket(k, u, v, col, o = {}) {
  const c = k.ctx, r = o.r ?? 0.13, h = o.h ?? 0.16, z = o.z ?? 0;
  const [x, y0] = P(u, v, z), [, y1] = P(u, v, z + h), rx = r * CTS.S * 1.25, ry = rx * 0.5;
  c.fillStyle = "rgba(60,40,20,0.18)"; c.beginPath(); c.ellipse(x + 2, y0 + 1, rx * 1.1, ry, 0, 0, 6.3); c.fill();
  c.beginPath(); c.moveTo(x - rx, y1); c.lineTo(x - rx * 0.86, y0); c.ellipse(x, y0, rx * 0.86, ry * 0.86, 0, Math.PI, 0, true); c.lineTo(x + rx, y1); c.closePath();
  const g = c.createLinearGradient(x - rx, 0, x + rx, 0); g.addColorStop(0, "#d6ae6a"); g.addColorStop(1, "#9c7440"); c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
  c.save(); c.clip(); c.strokeStyle = "rgba(90,60,25,0.55)"; c.lineWidth = 0.6; c.beginPath(); for (let yy = y1 + 2; yy < y0 + ry; yy += 2.2) { c.moveTo(x - rx, yy); c.quadraticCurveTo(x, yy + ry * 0.9, x + rx, yy); } c.stroke(); c.restore();
  // heap (cone) with a speckle
  const hh = (o.heap ?? 0.12) * CTS.S;
  c.beginPath(); c.ellipse(x, y1, rx, ry, 0, 0, Math.PI); c.quadraticCurveTo(x + rx * 0.4, y1 - hh * 1.1, x, y1 - hh); c.quadraticCurveTo(x - rx * 0.4, y1 - hh * 1.1, x - rx, y1); c.closePath();
  const g2 = c.createLinearGradient(x - rx, y1 - hh, x + rx, y1); g2.addColorStop(0, shade(col, 0.2)); g2.addColorStop(1, shade(col, -0.2)); c.fillStyle = g2; c.fill(); c.lineWidth = 0.9; c.stroke();
  const R = rng(Math.round(u * 97 + v * 31)); c.fillStyle = "rgba(255,255,255,0.35)"; for (let i = 0; i < 5; i++) c.fillRect(x + (R() - 0.5) * rx * 1.2, y1 - R() * hh * 0.8, 1, 1);
  c.beginPath(); c.ellipse(x, y1, rx, ry, 0, 0, 6.3); c.strokeStyle = "#7a5530"; c.lineWidth = 1.4; c.stroke(); c.strokeStyle = INK; c.lineWidth = 0.6; c.stroke();
}
// hessian sack, rolled top, filled with grain/beans
export function sack(k, u, v, col, o = {}) {
  const c = k.ctx, [x, y] = P(u, v, 0), w = (o.w ?? 0.16) * CTS.S * 1.3, h = (o.h ?? 0.3) * CTS.S;
  c.fillStyle = "rgba(60,40,20,0.18)"; c.beginPath(); c.ellipse(x + 3, y, w * 0.9, w * 0.35, 0, 0, 6.3); c.fill();
  c.beginPath(); c.moveTo(x - w * 0.8, y); c.quadraticCurveTo(x - w * 1.05, y - h * 0.6, x - w * 0.85, y - h); c.lineTo(x + w * 0.85, y - h); c.quadraticCurveTo(x + w * 1.05, y - h * 0.6, x + w * 0.8, y); c.quadraticCurveTo(x, y + w * 0.35, x - w * 0.8, y); c.closePath();
  const g = c.createLinearGradient(x - w, 0, x + w, 0); g.addColorStop(0, "#d9bf8c"); g.addColorStop(1, "#a88a58"); c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
  c.beginPath(); c.ellipse(x, y - h, w * 0.85, w * 0.32, 0, 0, 6.3); c.fillStyle = "#c4a46e"; c.fill(); c.stroke();
  c.beginPath(); c.ellipse(x, y - h - 0.5, w * 0.62, w * 0.22, 0, 0, 6.3); c.fillStyle = col; c.fill(); c.lineWidth = 0.6; c.stroke();
  const R = rng(Math.round(u * 53 + v * 17)); c.fillStyle = shade(col, -0.3); for (let i = 0; i < 6; i++) c.fillRect(x + (R() - 0.5) * w, y - h - 1 + (R() - 0.5) * w * 0.3, 1.1, 1.1);
}
// clay water jar / urn
export function urn(k, u, v, o = {}) {
  const c = k.ctx, [x, y] = P(u, v, o.z ?? 0), h = (o.h ?? 0.4) * CTS.S * CTS.ZS, w = (o.w ?? 0.17) * CTS.S * 1.3, col = o.col || "#b9763f";
  c.fillStyle = "rgba(60,40,20,0.18)"; c.beginPath(); c.ellipse(x + 3, y, w * 0.9, w * 0.35, 0, 0, 6.3); c.fill();
  c.beginPath(); c.moveTo(x - w * 0.35, y); c.bezierCurveTo(x - w * 1.2, y - h * 0.25, x - w * 1.1, y - h * 0.8, x - w * 0.35, y - h * 0.9); c.lineTo(x - w * 0.42, y - h); c.lineTo(x + w * 0.42, y - h); c.lineTo(x + w * 0.35, y - h * 0.9); c.bezierCurveTo(x + w * 1.1, y - h * 0.8, x + w * 1.2, y - h * 0.25, x + w * 0.35, y); c.closePath();
  const g = c.createLinearGradient(x - w, 0, x + w, 0); g.addColorStop(0, shade(col, 0.2)); g.addColorStop(0.6, col); g.addColorStop(1, shade(col, -0.3)); c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  c.strokeStyle = shade(col, -0.35); c.lineWidth = 0.6; c.beginPath(); c.moveTo(x - w * 0.9, y - h * 0.55); c.quadraticCurveTo(x, y - h * 0.45, x + w * 0.9, y - h * 0.55); c.stroke();
  c.beginPath(); c.ellipse(x, y - h, w * 0.42, w * 0.14, 0, 0, 6.3); c.fillStyle = "#3a2416"; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
}
// a hanging cloth (scarf / textile) that sways; x,y = top centre px
export function cloth(k, x, y, w, h, cols, ph = 0) {
  const c = k.ctx, t = k.t, sw = Math.sin(t * 2.1 + ph) * 2.2, sw2 = Math.sin(t * 2.6 + ph * 1.7) * 1.4;
  const pts = [[x - w / 2, y], [x + w / 2, y], [x + w / 2 + sw * 0.6, y + h * 0.5], [x + w / 2 + sw + sw2, y + h], [x - w / 2 + sw - sw2 * 0.5, y + h + 1.5], [x - w / 2 + sw * 0.5, y + h * 0.5]];
  tr(c, pts); c.fillStyle = cols[0]; c.fill();
  c.save(); tr(c, pts); c.clip(); c.fillStyle = cols[1]; for (let i = 1; i < 4; i++) c.fillRect(x - w, y + (h * i) / 4 - 1, w * 2 + 6, 1.6); if (cols[2]) { c.fillStyle = cols[2]; c.fillRect(x - w, y + h - 3, w * 2 + 6, 3); } c.restore();
  tr(c, pts); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
}
// string of dried goods (lemons / chillies / gourds) hanging from an awning
export function garland(k, x, y, n, cols, ph = 0) {
  const c = k.ctx, t = k.t, sw = Math.sin(t * 1.9 + ph) * 1.5;
  c.strokeStyle = "#6b4a2a"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x, y); c.lineTo(x + sw, y + n * 3.6); c.stroke();
  for (let i = 0; i < n; i++) { const f = (i + 0.6) / n, xx = x + sw * f + (i % 2 ? 1.6 : -1.6), yy = y + i * 3.6 + 2; c.fillStyle = cols[i % cols.length]; c.beginPath(); c.ellipse(xx, yy, 2.2, 2.6, 0, 0, 6.3); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.6; c.stroke(); }
}

// ---------- quay furniture ----------
export function bollard(k, u, v) {
  const c = k.ctx;
  k.cyl(u, v, 0, 0.075, 0.34, "#6e4a2c");
  const [x, y] = P(u, v, 0.34); c.fillStyle = "#4e3320"; c.beginPath(); c.ellipse(x, y, 4.6, 2.3, 0, 0, 6.3); c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  c.strokeStyle = "rgba(40,25,12,0.5)"; c.lineWidth = 0.6; for (const z of [0.1, 0.22]) { const [, yy] = P(u, v, z); c.beginPath(); c.moveTo(x - 4.7, yy); c.quadraticCurveTo(x, yy + 2.6, x + 4.7, yy); c.stroke(); }
}
// heritage street lamp: dark iron post, scroll arm, pointed Arabic lantern
export function arabLamp(k, u, v, o = {}) {
  const c = k.ctx, h = o.h ?? 1.65, t = k.t;
  const [x, y] = P(u, v, 0), [, yt] = P(u, v, h);
  k.ell(u + 0.12, v + 0.05, 0, 0.13, "rgba(60,45,30,0.16)", { stroke: false });
  k.path([[x - 5, y], [x + 5, y], [x + 3, y - 4], [x + 2.2, y - 9], [x - 2.2, y - 9], [x - 3, y - 4]], { fill: "#2c2622", lw: 1, wobble: 0 });
  c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 4.2; c.beginPath(); c.moveTo(x, y - 8); c.lineTo(x, yt + 4); c.stroke(); c.strokeStyle = "#3a332d"; c.lineWidth = 2.4; c.stroke();
  for (const zz of [0.45, 0.9]) { const [, yy] = P(u, v, zz); c.fillStyle = "#2c2622"; c.fillRect(x - 2.6, yy - 1.2, 5.2, 2.4); }
  // glow
  const gl = 0.8 + 0.2 * Math.sin(t * 4.3 + u * 3);
  const gr = c.createRadialGradient(x, yt - 7, 1, x, yt - 7, 16); gr.addColorStop(0, `rgba(255,220,140,${0.5 * gl})`); gr.addColorStop(1, "rgba(255,220,140,0)"); c.fillStyle = gr; c.beginPath(); c.arc(x, yt - 7, 16, 0, 6.3); c.fill();
  k.path([[x - 3.5, yt + 1], [x + 3.5, yt + 1], [x + 5, yt - 11], [x - 5, yt - 11]], { fill: `rgba(255,${200 + 30 * gl | 0},120,0.95)`, lw: 1.1, wobble: 0 });
  c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x, yt + 1); c.lineTo(x, yt - 11); c.moveTo(x - 4.3, yt - 5); c.lineTo(x + 4.3, yt - 5); c.stroke();
  k.path([[x - 6.5, yt - 11], [x + 6.5, yt - 11], [x, yt - 20]], { fill: "#2c2622", lw: 1, wobble: 0 });
  c.fillStyle = "#2c2622"; c.beginPath(); c.arc(x, yt - 21.5, 1.6, 0, 6.3); c.fill();
  c.fillStyle = "#2c2622"; c.fillRect(x - 3.5, yt + 1, 7, 2);
}
// bougainvillea mass: dark leaves + magenta blossom clusters, gently swaying
export function bougain(k, x, y, w, h, seed = 1) {
  const c = k.ctx, R = rng(seed), t = k.t, N = Math.round((w * h) / 10);
  for (let pass = 0; pass < 3; pass++) for (let i = 0; i < N; i++) {
    const fx = x + (R() - 0.5) * w, fy = y - R() * h * (1 - Math.abs(R() - 0.5) * 0.6), r = 2 + R() * 2.6, sw = Math.sin(t * 1.3 + i) * 0.7;
    if (pass === 0) { c.fillStyle = R() < 0.5 ? "#3c6a30" : "#4c843b"; c.beginPath(); c.arc(fx + sw, fy, r * 1.25, 0, 6.3); c.fill(); }
    else if (pass === 1) { c.fillStyle = ["#d4357a", "#e6559a", "#c22a6a", "#f07bb4"][Math.floor(R() * 4)]; c.beginPath(); c.arc(fx + sw, fy, r * 0.75, 0, 6.3); c.fill(); }
    else if (R() < 0.3) { c.fillStyle = "rgba(255,210,235,0.8)"; c.beginPath(); c.arc(fx + sw - 0.6, fy - 0.6, r * 0.3, 0, 6.3); c.fill(); }
  }
}
// shrub: clump of small lobes
export function shrub(k, u, v, r = 0.32, seed = 1) {
  const c = k.ctx, R = rng(seed), [x, y] = P(u, v, 0), t = k.t, rr = r * CTS.S;
  c.fillStyle = "rgba(60,45,30,0.16)"; c.beginPath(); c.ellipse(x + 4, y + 1, rr * 1.2, rr * 0.45, 0, 0, 6.3); c.fill();
  const lobes = []; for (let i = 0; i < 9; i++) lobes.push([x + (R() - 0.5) * rr * 1.8, y - rr * 0.35 - R() * rr * 0.7, rr * (0.32 + R() * 0.2)]);
  lobes.sort((a, b) => a[1] - b[1]);
  for (const [lx, ly, lr] of lobes) { const sw = Math.sin(t * 1.4 + lx) * 0.6; c.beginPath(); c.arc(lx + sw, ly, lr, 0, 6.3); c.fillStyle = "#5d8a3e"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke(); c.fillStyle = "#79a650"; c.beginPath(); c.arc(lx + sw - lr * 0.3, ly - lr * 0.3, lr * 0.5, 0, 6.3); c.fill(); }
}

// ---------- date palm (olive greens, full crown) ----------
export function opalm(k, u, v, o = {}) {
  const c = k.ctx, t = k.t, h = o.h ?? 2.3, seed = o.seed ?? Math.round(u * 17 + v * 29), R = rng(seed * 13 + 5), z0 = o.z ?? 0;
  const [bx, by] = P(u, v, z0), [tx0, ty] = P(u, v, z0 + h);
  const lean = (o.lean ?? (R() - 0.5) * 0.9) * CTS.S, tx = tx0 + lean;
  c.fillStyle = "rgba(60,45,30,0.16)"; c.beginPath(); c.ellipse(bx + 8, by + 2, 17, 5, 0, 0, 6.3); c.fill();
  const sway = Math.sin(t * 0.9 + seed) * 1.2;
  c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 7.5; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + lean * 0.1, (by + ty) / 2, tx + sway, ty); c.stroke();
  c.strokeStyle = "#9c7a52"; c.lineWidth = 5; c.stroke();
  // diamond leaf-base pattern on the trunk
  c.strokeStyle = "rgba(70,44,22,0.6)"; c.lineWidth = 0.8;
  for (let i = 1; i < 14; i++) { const f = i / 14, q = 1 - f, xx = q * q * bx + 2 * q * f * (bx + lean * 0.1) + f * f * (tx + sway), yy = q * q * by + 2 * q * f * ((by + ty) / 2) + f * f * ty; c.beginPath(); c.moveTo(xx - 2.4, yy + 1.2); c.lineTo(xx, yy - 0.6); c.lineTo(xx + 2.4, yy + 1.2); c.stroke(); }
  const N = o.fronds ?? 20, L0 = (o.len ?? 1) * CTS.S * 1.05, frs = [];
  for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2 + R() * 0.25; frs.push({ a, s: Math.sin(a), L: L0 * (0.8 + R() * 0.3), ph: R() * 6.28 }); }
  frs.sort((p, q) => p.s - q.s);
  const cx = tx + sway, cy = ty;
  const draw = (f) => {
    const sw = Math.sin(t * 1.5 + f.ph) * 0.05, dx = Math.cos(f.a + sw), dy = Math.sin(f.a + sw) * 0.48;
    const p0 = [cx, cy], p1 = [cx + dx * f.L * 0.5, cy + dy * f.L * 0.5 - f.L * 0.42], p2 = [cx + dx * f.L, cy + dy * f.L + f.L * 0.28 + Math.sin(t * 2 + f.ph) * 1.4];
    const pt = (s) => { const q = 1 - s; return [q * q * p0[0] + 2 * q * s * p1[0] + s * s * p2[0], q * q * p0[1] + 2 * q * s * p1[1] + s * s * p2[1]]; };
    const left = [], right = [], n = 16;
    for (let j = 0; j <= n; j++) {
      const s = j / n, a = pt(s), b = pt(Math.min(1, s + 0.03)), a2 = pt(Math.max(0, s - 0.03));
      const tx2 = b[0] - a2[0], ty2 = b[1] - a2[1], l = Math.hypot(tx2, ty2) || 1, nx = -ty2 / l, ny = tx2 / l;
      const w = Math.pow(Math.sin(Math.PI * Math.min(0.97, s * 0.92 + 0.06)), 0.8) * 5.2 * (o.wide ?? 1) * (j % 2 ? 1 : 0.8);
      left.push([a[0] + nx * w, a[1] + ny * w]); right.push([a[0] - nx * w, a[1] - ny * w]);
    }
    tr(c, [...left, ...[...right].reverse()]);
    c.fillStyle = f.s > 0.2 ? "#8aa650" : "#628240"; c.fill(); c.lineWidth = 0.9; c.strokeStyle = "rgba(42,36,32,0.75)"; c.lineJoin = "round"; c.stroke();
    c.strokeStyle = "rgba(210,225,150,0.6)"; c.lineWidth = 1; c.beginPath(); for (let j = 0; j <= n; j++) { const p = pt(j / n); j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke();
  };
  for (const f of frs) if (f.s < 0) draw(f);
  c.fillStyle = "#8a6a3e"; c.beginPath(); c.arc(cx, cy + 1, 3.8, 0, 6.3); c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  c.fillStyle = "#d9892f"; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(cx - 4 + i * 1.7, cy + 4 + (i % 2) * 1.5, 1.5, 0, 6.3); c.fill(); }
  for (const f of frs) if (f.s >= 0) draw(f);
}

// ---------- boats ----------
// generic wooden hull: pointed bow and stern with sheer; returns a point fn pt(f along -1..1, s across -1..1, z)
function hull(k, u, v, dir, o) {
  const c = k.ctx, t = k.t, L = o.len, W = o.wid, H = o.h, z0 = o.z ?? 0;
  let [a, b] = dir; const l = Math.hypot(a, b) || 1; a /= l; b /= l; const n = [-b, a];
  const bob = Math.sin(t * 2.0 + (o.ph ?? 0)) * 0.022, roll = Math.sin(t * 1.6 + (o.ph ?? 0)) * 0.025;
  const sheer = (f) => (o.sheer ?? 0.08) * f * f * (f > 0 ? 1 : o.sternUp ?? 1);
  const pt = (f, s, z) => P(u + a * f * L / 2 + n[0] * s * W / 2, v + b * f * L / 2 + n[1] * s * W / 2, z0 + z + bob + s * roll);
  const prof = [[1, 0], [0.82, 0.55], [0.5, 0.92], [0, 1], [-0.55, 0.95], [-0.88, 0.6], [-1, 0], [-0.88, -0.6], [-0.55, -0.95], [0, -1], [0.5, -0.92], [0.82, -0.55]];
  k.ell(u, v, z0, W * 0.85, "rgba(10,60,70,0.22)", { stroke: false });
  const top = prof.map(([f, s]) => pt(f, s, H + sheer(f))), bot = prof.map(([f, s]) => pt(f * 0.9, s * 0.75, 0));
  const sides = prof.map((_, i) => { const j = (i + 1) % prof.length; return { i, j, q: [bot[i], bot[j], top[j], top[i]], d: (top[i][1] + top[j][1]) / 2 }; }).sort((p, q) => p.d - q.d);
  for (const sd of sides) {
    k.path(sd.q, { fill: shade(o.hull, -0.08), lw: 1, wobble: 0 });
    // plank seams + a painted gunwale band
    c.strokeStyle = "rgba(40,22,10,0.35)"; c.lineWidth = 0.6; c.beginPath(); for (const ff of [0.35, 0.65]) { c.moveTo(lerp(sd.q[0][0], sd.q[3][0], ff), lerp(sd.q[0][1], sd.q[3][1], ff)); c.lineTo(lerp(sd.q[1][0], sd.q[2][0], ff), lerp(sd.q[1][1], sd.q[2][1], ff)); } c.stroke();
    if (o.band) { c.strokeStyle = o.band; c.lineWidth = 2; c.beginPath(); c.moveTo(lerp(sd.q[0][0], sd.q[3][0], 0.85), lerp(sd.q[0][1], sd.q[3][1], 0.85)); c.lineTo(lerp(sd.q[1][0], sd.q[2][0], 0.85), lerp(sd.q[1][1], sd.q[2][1], 0.85)); c.stroke(); }
  }
  k.path(top, { fill: o.deck, lw: 1.3, wobble: 0 });
  // gunwale rim
  const rim = prof.map(([f, s]) => pt(f * 0.93, s * 0.85, H + sheer(f) - 0.01));
  k.path(rim, { fill: shade(o.deck, -0.18), lw: 0.8, wobble: 0 });
  return { pt, a, b, n, H, L, W, sheer };
}
// abra: long wooden water taxi, striped flat canopy, passengers back to back, boatman at the stern
export function abra(k, u, v, dir, o = {}) {
  const c = k.ctx, t = k.t;
  const B = hull(k, u, v, dir, { len: 1.6, wid: 0.5, h: 0.2, hull: "#8c5630", deck: "#b98450", band: o.band || "#2f7d6a", sheer: 0.1, ...o });
  const { pt, H } = B, dz = H - 0.04;
  // fender tyres on the near side
  for (const f of [-0.45, 0, 0.45]) { const p = pt(f, 1.02, H * 0.55); c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.ellipse(p[0], p[1], 2.6, 2, 0, 0, 6.3); c.stroke(); c.strokeStyle = "#333"; c.lineWidth = 1.4; c.stroke(); }
  // central bench + engine box
  const bench = [pt(-0.6, -0.12, dz), pt(0.55, -0.12, dz), pt(0.55, 0.12, dz), pt(-0.6, 0.12, dz)];
  k.path(bench, { fill: "#6d4224", lw: 0.8, wobble: 0 });
  // passengers: far row faces away, near row faces the viewer
  const sideNear = (pt(0, 1, 0)[1] > pt(0, -1, 0)[1]) ? 1 : -1;
  const seats = o.seats || 7, seeds = o.seeds || [1, 2, 3, 4, 5, 6, 7, 8];
  const rows = [-sideNear, sideNear];
  let idx = 0;
  for (const row of rows) {
    const nn = row === sideNear ? Math.ceil(seats / 2) : Math.floor(seats / 2);
    for (let i = 0; i < nn; i++, idx++) {
      const f = lerp(-0.48, 0.42, nn === 1 ? 0.5 : i / (nn - 1));
      const uu = u + B.a * f * B.L * 0.5 + B.n[0] * row * B.W * 0.2, vv = v + B.b * f * B.L * 0.5 + B.n[1] * row * B.W * 0.2;
      const sd = seeds[idx % seeds.length];
      drawHuman(k, uu, vv, { pose: "sit", seatZ: 0.2, z: (o.z ?? 0) + dz + Math.sin(t * 2.0 + (o.ph ?? 0)) * 0.022, dir: [B.n[0] * row, B.n[1] * row], h: o.ph0 ?? 0.8, seed: sd, shadow: false, gesture: sd % 3 === 0, ...(o.look ? o.look(sd) : {}) });
    }
  }
  // boatman standing at the stern, steering
  const bu = u - B.a * B.L * 0.4, bv = v - B.b * B.L * 0.4;
  drawHuman(k, bu, bv, { pose: "stand", z: (o.z ?? 0) + dz + 0.02, dir: [B.a, B.b], h: 0.9, seed: o.pilot ?? 77, shadow: false, ...(o.look ? o.look(o.pilot ?? 0) : {}) });
  baluster(k, B, sideNear, H);
  // canopy: posts, flat striped roof with a scalloped fringe
  const pz = dz + 1.12, posts = [[-0.62, -0.85], [0.5, -0.85], [-0.62, 0.85], [0.5, 0.85], [-0.06, -0.85], [-0.06, 0.85]];
  for (const [f, s] of posts) { const p0 = pt(f, s, dz), p1 = pt(f, s, pz); c.strokeStyle = INK; c.lineWidth = 2.1; c.beginPath(); c.moveTo(...p0); c.lineTo(...p1); c.stroke(); c.strokeStyle = "#d9c6a0"; c.lineWidth = 0.9; c.stroke(); }
  const ns = 9, c1 = o.c1 || "#d64b44", c2 = o.c2 || "#f7f1e6";
  for (let i = 0; i < ns; i++) { const f0 = lerp(-0.78, 0.66, i / ns), f1 = lerp(-0.78, 0.66, (i + 1) / ns); k.path([pt(f0, -1, pz), pt(f1, -1, pz), pt(f1, 1, pz), pt(f0, 1, pz)], { fill: i % 2 ? c2 : c1, lw: 0.8, wobble: 0 }); }
  k.path([pt(-0.78, -1, pz), pt(0.66, -1, pz), pt(0.66, 1, pz), pt(-0.78, 1, pz)], { lw: 1.3, wobble: 0 });
  for (let i = 0; i < ns; i++) { const f0 = lerp(-0.78, 0.66, i / ns), f1 = lerp(-0.78, 0.66, (i + 1) / ns), p0 = pt(f0, sideNear, pz), p1 = pt(f1, sideNear, pz), fl = Math.sin(t * 4 + i) * 0.8; c.beginPath(); c.moveTo(...p0); c.quadraticCurveTo((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 + 5 + fl, ...p1); c.closePath(); c.fillStyle = i % 2 ? c2 : c1; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.7; c.stroke(); }
  // little flag at the bow
  const fb = pt(0.95, 0, H + B.sheer(0.95)), w = Math.sin(t * 7 + (o.ph ?? 0)) * 1.4;
  c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(...fb); c.lineTo(fb[0], fb[1] - 12); c.stroke();
  c.fillStyle = "#1f8a4c"; c.fillRect(fb[0] + 1.5, fb[1] - 12, 6, 1.4); c.fillStyle = "#f4f1e8"; c.fillRect(fb[0] + 1.5, fb[1] - 10.6 + w * 0.2, 6, 1.4); c.fillStyle = "#2a2420"; c.fillRect(fb[0] + 1.5, fb[1] - 9.2 + w * 0.3, 6, 1.4); c.fillStyle = "#d33a32"; c.fillRect(fb[0], fb[1] - 12, 2, 4.2);
}
// moored dhow: deep teak hull, high transom, mast + furled lateen yard, cargo heaped on deck
export function dhow(k, u, v, dir, o = {}) {
  const c = k.ctx, t = k.t;
  const B = hull(k, u, v, dir, { len: 2.1, wid: 0.66, h: 0.42, hull: "#7a4a26", deck: "#a7774a", band: "#e9d9b6", sheer: 0.22, sternUp: 1.3, ...o });
  const { pt, H, sheer } = B, dz = H - 0.05;
  // raised poop deck at the stern with a carved rail
  const pd = [pt(-0.98, -0.6, H + 0.2), pt(-0.6, -0.85, H + 0.14), pt(-0.6, 0.85, H + 0.14), pt(-0.98, 0.6, H + 0.2)];
  k.path(pd, { fill: "#9b6a3e", lw: 1, wobble: 0 });
  c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); for (let i = 0; i <= 5; i++) { const s = lerp(-0.85, 0.85, i / 5), p0 = pt(-0.62, s, H + 0.14), p1 = pt(-0.62, s, H + 0.3); c.moveTo(...p0); c.lineTo(...p1); } c.stroke();
  k.line([pt(-0.62, -0.85, H + 0.3), pt(-0.62, 0.85, H + 0.3)], { lw: 1.6, wobble: 0, stroke: "#5a331b" });
  // cargo: sacks, crates, a barrel and a stack of tyres
  const items = [[-0.3, -0.35, "crate"], [-0.32, 0.3, "sack"], [-0.05, -0.32, "sack"], [-0.08, 0.32, "crate"], [0.22, 0, "sack"], [0.2, -0.4, "barrel"], [0.45, 0.25, "crate"], [-0.15, 0, "crate2"]];
  items.sort((p, q) => (pt(p[0], p[1], 0)[1]) - (pt(q[0], q[1], 0)[1]));
  for (const [f, s, kind] of items) {
    const [x, y] = pt(f, s, dz);
    if (kind === "crate" || kind === "crate2") { const hgt = kind === "crate2" ? 16 : 10; c.fillStyle = kind === "crate2" ? "#c79b5e" : "#b98a50"; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.rect(x - 6, y - hgt, 12, hgt); c.fill(); c.stroke(); c.fillStyle = shade("#b98a50", 0.15); c.beginPath(); c.moveTo(x - 6, y - hgt); c.lineTo(x - 2, y - hgt - 3); c.lineTo(x + 10, y - hgt - 3); c.lineTo(x + 6, y - hgt); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.moveTo(x + 6, y); c.lineTo(x + 10, y - 3); c.lineTo(x + 10, y - hgt - 3); c.lineTo(x + 6, y - hgt); c.closePath(); c.fillStyle = shade("#b98a50", -0.2); c.fill(); c.stroke(); c.strokeStyle = "rgba(60,35,15,0.6)"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x - 6, y - hgt / 2); c.lineTo(x + 6, y - hgt / 2); c.stroke(); }
    else if (kind === "sack") { c.fillStyle = "#d9c08e"; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.ellipse(x, y - 4, 7, 4.5, 0, 0, 6.3); c.fill(); c.stroke(); c.beginPath(); c.ellipse(x + 2, y - 8, 6, 4, 0.2, 0, 6.3); c.fill(); c.stroke(); }
    else { c.fillStyle = "#5a7d8c"; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.rect(x - 4, y - 11, 8, 11); c.fill(); c.stroke(); c.beginPath(); c.ellipse(x, y - 11, 4, 1.8, 0, 0, 6.3); c.fill(); c.stroke(); }
  }
  // crew member lifting a sack now and then
  const lift = Math.max(0, Math.sin(t * 0.9 + (o.ph ?? 0)));
  const cu = u + B.a * 0.05 + B.n[0] * 0.05, cv = v + B.b * 0.05 + B.n[1] * 0.05;
  const r = drawHuman(k, cu, cv, { pose: lift > 0.5 ? "cheer" : "stand", z: (o.z ?? 0) + dz, dir: [B.n[0], B.n[1]], h: 0.62, seed: 913, shadow: false, style: "shirt", top: "#3f6fa8", bottom: "#4a3b30", hat: "cap", hatCol: "#f6f3ec" });
  if (lift > 0.5) { const [hx, hy] = r.hand; c.fillStyle = "#d9c08e"; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.ellipse(hx - 3, hy - 3, 6, 4, 0.1, 0, 6.3); c.fill(); c.stroke(); }
  // mast, lateen yard with the sail furled along it, stays
  const m0 = pt(0.3, 0, dz), m1 = pt(0.3, 0, dz + 2.2);
  beam(c, m0, m1, "#8a5a32", 3);
  const y0 = pt(0.95, 0, dz + 0.9), y1 = pt(-0.85, 0, dz + 2.6);
  beam(c, y0, y1, "#7a4a28", 2.2);
  c.strokeStyle = INK; c.lineWidth = 6.5; c.lineCap = "round"; c.beginPath(); c.moveTo(lerp(y0[0], y1[0], 0.12), lerp(y0[1], y1[1], 0.12)); c.lineTo(lerp(y0[0], y1[0], 0.88), lerp(y0[1], y1[1], 0.88)); c.stroke();
  c.strokeStyle = "#efe6d0"; c.lineWidth = 4.5; c.stroke();
  c.strokeStyle = "rgba(120,100,70,0.6)"; c.lineWidth = 0.8; c.beginPath(); for (let i = 1; i < 8; i++) { const f = lerp(0.15, 0.85, i / 8), x = lerp(y0[0], y1[0], f), y = lerp(y0[1], y1[1], f); c.moveTo(x - 2, y - 3); c.lineTo(x + 2, y + 3); } c.stroke();
  c.strokeStyle = "rgba(42,36,32,0.7)"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(...m1); c.lineTo(...pt(1.0, 0, H + sheer(1))); c.moveTo(...m1); c.lineTo(...pt(-0.95, 0, H + 0.2)); c.stroke();
  // pennant
  const w = Math.sin(t * 6 + (o.ph ?? 0)) * 2; c.fillStyle = "#d33a32"; c.beginPath(); c.moveTo(m1[0], m1[1]); c.lineTo(m1[0] + 12, m1[1] + 2 + w); c.lineTo(m1[0], m1[1] + 5); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.7; c.stroke();
  return B;
}
// V wake + churned water behind a moving boat at height z
export function wakeZ(k, u, v, dir, z, o = {}) {
  const c = k.ctx, t = k.t;
  let [a, b] = dir; const l = Math.hypot(a, b) || 1; a /= l; b /= l; const n = [-b, a], len = o.len ?? 1.8, w = o.w ?? 0.6;
  c.lineCap = "round";
  for (const sd of [-1, 1]) {
    const pts = []; for (let i = 0; i <= 10; i++) { const f = i / 10, wig = Math.sin(t * 6 + i * 1.3) * 0.02; pts.push(P(u - a * (0.7 + f * len) + n[0] * sd * (0.2 + f * w + wig), v - b * (0.7 + f * len) + n[1] * sd * (0.2 + f * w + wig), z)); }
    for (let i = 0; i < 10; i++) { c.strokeStyle = `rgba(255,255,255,${0.85 * (1 - i / 10)})`; c.lineWidth = 2.4 * (1 - i / 12); c.beginPath(); c.moveTo(...pts[i]); c.lineTo(...pts[i + 1]); c.stroke(); }
  }
  for (let i = 0; i < 8; i++) { const f = (t * 1.1 + i / 8) % 1, [x, y] = P(u - a * (0.75 + f * len * 0.7), v - b * (0.75 + f * len * 0.7), z); c.fillStyle = `rgba(255,255,255,${0.75 * (1 - f)})`; c.beginPath(); c.ellipse(x + Math.sin(i * 2.1) * 2, y, 2.5 + f * 4, 1.2 + f * 1.6, 0, 0, 6.3); c.fill(); }
  for (const sd of [-1, 1]) { const p = P(u + a * 0.8, v + b * 0.8, z), q = P(u + a * 0.4 + n[0] * sd * 0.3, v + b * 0.4 + n[1] * sd * 0.3, z); c.strokeStyle = "rgba(255,255,255,0.85)"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(...p); c.lineTo(...q); c.stroke(); }
}
export { tr };

// draped fabric awning: sloped canopy that sags between the poles, striped, with a scalloped swaying valance and shading
export function awning(k, F, s0, s1, z, o = {}) {
  const c = k.ctx, t = k.t, n = o.stripes ?? 8, d = o.depth ?? 0.65, drop = o.drop ?? 0.35, c1 = o.c1 || "#d64b44", c2 = o.c2 || "#f7f1e6";
  const poleZ = z - drop;
  if (o.poles !== false) for (const s of [s0 + 0.04, s1 - 0.04]) beam(c, F(s, 0, d - 0.03), F(s, poleZ - 0.02, d - 0.03), WOOD, 1.8);
  const sag = (f) => Math.sin(Math.PI * f) * 0.05; // fabric sags between the poles
  const top = (s) => F(s, z, 0), bot = (s, f) => F(s, poleZ - sag(f), d);
  const col = (i) => (i % 2 ? c2 : c1);
  // canopy
  for (let i = 0; i < n; i++) {
    const f0 = i / n, f1 = (i + 1) / n, a = lerp(s0, s1, f0), b = lerp(s0, s1, f1), m = lerp(s0, s1, (f0 + f1) / 2);
    const q = [top(a), top(b), bot(b, f1), bot(a, f0)];
    k.path(q, { fill: col(i), lw: 0.8, wobble: 0 });
    // fold shading: soft dark crease down the middle of each stripe, brighter toward the front edge
    c.save(); tr(c, q); c.clip();
    const g = c.createLinearGradient(...top(m), ...bot(m, (f0 + f1) / 2)); g.addColorStop(0, "rgba(60,30,10,0.22)"); g.addColorStop(0.55, "rgba(60,30,10,0)"); g.addColorStop(1, "rgba(255,255,255,0.12)");
    c.fillStyle = g; c.fillRect(0, 0, 1024, 1024);
    c.strokeStyle = "rgba(60,30,10,0.28)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(...top(m)); c.lineTo(...bot(m, (f0 + f1) / 2)); c.stroke();
    c.restore();
  }
  // scalloped valance that swings a little in the breeze
  for (let i = 0; i < n; i++) {
    const f0 = i / n, f1 = (i + 1) / n, a = lerp(s0, s1, f0), b = lerp(s0, s1, f1), p0 = bot(a, f0), p1 = bot(b, f1);
    const fl = Math.sin(t * 2.6 + i * 0.8 + s0 * 3) * 1.1, hgt = 6.5;
    c.beginPath(); c.moveTo(...p0); c.lineTo(...p1);
    c.quadraticCurveTo(p1[0] + 0.8, p1[1] + hgt * 0.7 + fl, (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 + hgt + fl);
    c.quadraticCurveTo(p0[0] - 0.8, p0[1] + hgt * 0.7 + fl, p0[0], p0[1]); c.closePath();
    c.fillStyle = shade(col(i), -0.05); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
  }
  // rail along the wall
  k.line([top(s0), top(s1)], { lw: 1.6, wobble: 0 });
  // side flaps (triangles) at both ends
  for (const [s, ss] of [[s0, 0], [s1, 1]]) { const pa = F(s, z, 0), pb = F(s, poleZ, d); if (!ss) continue; c.beginPath(); c.moveTo(...pa); c.lineTo(...pb); c.lineTo(...F(s, z - 0.02, d * 0.2)); c.closePath(); c.fillStyle = shade(c1, -0.22); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke(); }
}
// moulded cornice band under a parapet
export function cornice(k, F, s0, s1, z, o = {}) {
  const c = k.ctx;
  k.path([F(s0, z - 0.09, 0.04), F(s1, z - 0.09, 0.04), F(s1, z - 0.02, 0.04), F(s0, z - 0.02, 0.04)], { fill: shade(WALL, 0.1), lw: 0.8, wobble: 0 });
  k.path([F(s0, z - 0.2, 0.0), F(s1, z - 0.2, 0.0), F(s1, z - 0.09, 0.04), F(s0, z - 0.09, 0.04)], { fill: shade(WALL, -0.1), lw: 0.6, wobble: 0, stroke: false });
  c.fillStyle = "rgba(90,60,30,0.5)"; for (let s = s0; s < s1; s += 0.09) { const [x, y] = F(s, z - 0.15, 0.03); c.fillRect(x - 1, y - 1, 2, 2.4); }
}
// timber balustrade of an abra (near side)
export function baluster(k, B, side, z) {
  const c = k.ctx, { pt, H } = B;
  c.lineCap = "round";
  for (let i = 0; i <= 14; i++) { const f = lerp(-0.8, 0.8, i / 14), p0 = pt(f, side, z), p1 = pt(f, side, z + 0.16); c.strokeStyle = INK; c.lineWidth = 2.4; c.beginPath(); c.moveTo(...p0); c.lineTo(...p1); c.stroke(); c.strokeStyle = "#c9a066"; c.lineWidth = 1.1; c.stroke(); }
  const pts = []; for (let i = 0; i <= 14; i++) pts.push(pt(lerp(-0.8, 0.8, i / 14), side, z + 0.17));
  k.line(pts, { lw: 3, wobble: 0, stroke: INK }); k.line(pts, { lw: 1.6, wobble: 0, stroke: "#d6b27a" });
}
