// LONDON 1,0 grid-pass helpers (copied/rebuilt axis-aligned; everything projects through P()).
import { P, CTS, INK, shade, lerp, clamp, rng, hash } from "../../lib/vec-kit.js";
import { obox, fquad } from "./_props.js";
export { P, CTS, INK, shade, lerp, clamp, rng, hash, obox, fquad };

export const ST = "#ecd6b0", ST_L = "#f8ead0", ST_D = "#d4b88e", ST_DD = "#b79c70";
export const LEAD = "#8f95a6", LEAD_L = "#a9aebd", LEAD_D = "#5f6475";
export const GL = "#4e627f", GD = "#34445c", GOLDC = "#e3b53f", GOLD_D = "#b98a22";
const LIT = "#f3d57a";

export const pg = (k, pts3, fill, lw = 0.9) => k.poly(pts3, fill, { lw, wobble: 0 });

// axis-aligned box: right face (u1), left face (v1), top
export function bx(k, u0, u1, v0, v1, z0, z1, col, o = {}) {
  const lw = o.lw ?? 1;
  if (o.noR !== true) pg(k, [[u1, v0, z0], [u1, v1, z0], [u1, v1, z1], [u1, v0, z1]], o.right || shade(col, -0.17), lw);
  if (o.noL !== true) pg(k, [[u0, v1, z0], [u1, v1, z0], [u1, v1, z1], [u0, v1, z1]], o.left || col, lw);
  if (o.noTop !== true) pg(k, [[u0, v0, z1], [u1, v0, z1], [u1, v1, z1], [u0, v1, z1]], o.top || shade(col, 0.1), lw);
}
// face parametrisation: "L" = plane v=c running along u, "R" = plane u=c running along v
export const face = (side, c) => (side === "L" ? (a, z) => [a, c, z] : (a, z) => [c, a, z]);
function outline(F, a, z, w, h, arch) {
  const pts = [F(a - w / 2, z), F(a + w / 2, z)];
  if (arch) {
    const zs = z + h - w / 2; pts.push(F(a + w / 2, zs));
    for (let i = 1; i < 8; i++) { const th = (i / 8) * Math.PI; pts.push(F(a + Math.cos(th) * w / 2, zs + Math.sin(th) * w / 2)); }
    pts.push(F(a - w / 2, zs));
  } else pts.push(F(a + w / 2, z + h), F(a - w / 2, z + h));
  return pts.map((p) => P(...p));
}
export function win(k, F, a, z, w, h, o = {}) {
  const dk = o.dk, c = k.ctx, lit = o.lit && hash((o.seed || 0) + a * 17.3 + z * 31.1) < o.lit;
  if (o.sur !== false) k.path(outline(F, a, z - 0.02, w + 0.07, h + 0.05, o.arch), { fill: dk ? shade(o.surCol || ST_L, -0.2) : o.surCol || ST_L, lw: 0.6, wobble: 0 });
  k.path(outline(F, a, z, w, h, o.arch), { fill: lit ? LIT : dk ? GD : GL, lw: 0.7, wobble: 0 });
  c.strokeStyle = "rgba(20,30,40,0.55)"; c.lineWidth = 0.6; c.beginPath();
  const zs = o.arch ? z + h - w / 2 : z + h;
  c.moveTo(...P(...F(a, z))); c.lineTo(...P(...F(a, zs + (o.arch ? w / 2 : 0))));
  if (h > 0.3) { c.moveTo(...P(...F(a - w / 2, z + h * 0.45))); c.lineTo(...P(...F(a + w / 2, z + h * 0.45))); }
  c.stroke();
  if (o.sill !== false) { c.strokeStyle = dk ? shade(ST_D, -0.2) : ST_D; c.lineWidth = 1.4; c.beginPath(); c.moveTo(...P(...F(a - w / 2 - 0.04, z - 0.02))); c.lineTo(...P(...F(a + w / 2 + 0.04, z - 0.02))); c.stroke(); }
}
export function wins(k, side, c, a0, a1, zs, cols, w, h, o = {}) {
  const F = face(side, c), st = (a1 - a0) / cols;
  for (const z of zs) for (let i = 0; i < cols; i++) win(k, F, a0 + (i + 0.5) * st, z, w, h, { ...o, dk: side === "R" });
}
// blind niche (recessed panel, no glass)
export function niche(k, side, c, a, z, w, h, o = {}) {
  const F = face(side, c), dk = side === "R";
  k.path(outline(F, a, z, w, h, o.arch), { fill: dk ? shade(ST_D, -0.12) : ST_D, lw: 0.6, wobble: 0 });
  k.path(outline(F, a, z + 0.03, w * 0.7, h - 0.07, o.arch), { fill: dk ? shade(ST_DD, -0.1) : ST_DD, lw: 0.4, wobble: 0, stroke: "rgba(60,40,20,0.4)" });
}
export function course(k, side, c, a0, a1, z0, z1, step, alpha = 0.26) {
  const F = face(side, c), cx = k.ctx; cx.strokeStyle = `rgba(110,78,40,${alpha})`; cx.lineWidth = 0.8; cx.beginPath();
  for (let z = z0 + step; z < z1 - 0.01; z += step) { cx.moveTo(...P(...F(a0, z))); cx.lineTo(...P(...F(a1, z))); }
  cx.stroke();
}
export function pil(k, side, c, a, w, z0, z1, col = ST_L) {
  if (side === "L") bx(k, a - w / 2, a + w / 2, c, c + 0.06, z0, z1, col, { lw: 0.7 });
  else bx(k, c, c + 0.06, a - w / 2, a + w / 2, z0, z1, col, { lw: 0.7 });
}
export const cornice = (k, u0, u1, v0, v1, z, h = 0.14, col = ST_L) => bx(k, u0 - 0.06, u1 + 0.06, v0 - 0.02, v1 + 0.07, z, z + h, col, { lw: 0.8 });
export function balus(k, side, c, a0, a1, z, h = 0.18, step = 0.09) {
  const cx = k.ctx, F = face(side, c); cx.strokeStyle = "#a88e64"; cx.lineWidth = 1; cx.beginPath();
  for (let a = a0; a <= a1 + 0.001; a += step) { cx.moveTo(...P(...F(a, z))); cx.lineTo(...P(...F(a, z + h))); }
  cx.stroke();
  cx.strokeStyle = INK; cx.lineWidth = 1.2; cx.beginPath(); cx.moveTo(...P(...F(a0, z + h))); cx.lineTo(...P(...F(a1, z + h))); cx.stroke();
}
// round column (cylinder shaft + square cap/base through P)
export function column(k, u, v, z0, z1, r = 0.05, col = "#f6e8c8") {
  k.cyl(u, v, z0, r, z1 - z0, col, { top: false });
  const q = r * 1.5;
  bx(k, u - q, u + q, v - q, v + q, z1 - 0.05, z1, ST_L, { lw: 0.5 });
  bx(k, u - q, u + q, v - q, v + q, z0, z0 + 0.04, ST_D, { lw: 0.5 });
}
// strip of a curved wall between angles a0..a1 around (cu,cv), only visible segments
export function curvedWall(k, cu, cv, r, a0, a1, z0, z1, col, n = 12, lw = 0.7) {
  for (let i = 0; i < n; i++) {
    const t0 = lerp(a0, a1, i / n), t1 = lerp(a0, a1, (i + 1) / n), tm = (t0 + t1) / 2;
    const nu = Math.cos(tm), nv = Math.sin(tm);
    if (nu + nv <= 0.02) continue;
    const f = clamp(nu / (nu + nv + 1e-6));
    pg(k, [[cu + r * Math.cos(t0), cv + r * Math.sin(t0), z0], [cu + r * Math.cos(t1), cv + r * Math.sin(t1), z0], [cu + r * Math.cos(t1), cv + r * Math.sin(t1), z1], [cu + r * Math.cos(t0), cv + r * Math.sin(t0), z1]], shade(col, -0.05 - 0.17 * f), lw);
  }
}
export function arcPoly(cu, cv, r, a0, a1, z, n = 14) { const o = []; for (let i = 0; i <= n; i++) { const t = lerp(a0, a1, i / n); o.push([cu + r * Math.cos(t), cv + r * Math.sin(t), z]); } return o; }

// ---------- lead dome with ribs (surface of revolution, all through P) ----------
export function leadDome(k, u, v, z0, R, H, o = {}) {
  const c = k.ctx, S = CTS.S, [x, yb] = P(u, v, z0), rx = R * S * Math.SQRT2;
  const g = c.createLinearGradient(x - rx, 0, x + rx, 0);
  const col = o.col || LEAD;
  g.addColorStop(0, shade(col, 0.28)); g.addColorStop(0.4, shade(col, 0.06)); g.addColorStop(0.75, shade(col, -0.18)); g.addColorStop(1, shade(col, -0.36));
  // silhouette
  const left = [], right = [], N = 28;
  for (let i = 0; i <= N; i++) { const ph = (i / N) * (Math.PI / 2) * 0.985, [cx, cy] = P(u, v, z0 + H * Math.sin(ph)), r = rx * Math.cos(ph); left.push([cx - r, cy]); right.push([cx + r, cy]); }
  c.beginPath(); c.moveTo(...left[0]); left.forEach((p) => c.lineTo(...p)); right.reverse().forEach((p) => c.lineTo(...p)); c.ellipse(x, yb, rx, rx * CTS.YS, 0, 0, Math.PI, false); c.closePath();
  c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.3; c.lineJoin = "round"; c.stroke();
  // lead-sheet bands (front arcs) and ribs (front meridians)
  c.save(); c.clip();
  c.strokeStyle = "rgba(35,38,58,0.30)"; c.lineWidth = 0.8;
  for (const f of o.bands ?? [0.14, 0.3, 0.46, 0.62, 0.78]) {
    const ph = f * (Math.PI / 2), r = R * Math.cos(ph), z = z0 + H * Math.sin(ph);
    c.beginPath();
    for (let i = 0; i <= 18; i++) { const a = -Math.PI * 0.25 + (i / 18) * Math.PI, p = P(u + r * Math.cos(a), v + r * Math.sin(a), z); i ? c.lineTo(...p) : c.moveTo(...p); }
    c.stroke();
  }
  const nr = o.ribs ?? 16; c.strokeStyle = "rgba(30,32,50,0.42)"; c.lineWidth = 0.9;
  for (let j = 0; j < nr; j++) {
    const a = -Math.PI * 0.25 + ((j + 0.5) / nr) * Math.PI;
    c.beginPath();
    for (let i = 0; i <= 14; i++) { const ph = (i / 14) * (Math.PI / 2) * 0.98, p = P(u + R * Math.cos(ph) * Math.cos(a), v + R * Math.cos(ph) * Math.sin(a), z0 + H * Math.sin(ph)); i ? c.lineTo(...p) : c.moveTo(...p); }
    c.stroke();
  }
  // highlight streak
  c.strokeStyle = "rgba(255,255,255,0.28)"; c.lineWidth = 2; c.beginPath();
  for (let i = 0; i <= 14; i++) { const ph = (i / 14) * (Math.PI / 2) * 0.9, p = P(u + R * Math.cos(ph) * Math.cos(-0.1 - 0.9), v + R * Math.cos(ph) * Math.sin(-0.1 - 0.9) * 0.9, z0 + H * Math.sin(ph)); i ? c.lineTo(...p) : c.moveTo(...p); }
  c.stroke();
  c.restore();
}
export function goldBall(k, u, v, z, r = 3) {
  const c = k.ctx, [x, y] = P(u, v, z);
  c.fillStyle = GOLDC; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.stroke();
  c.fillStyle = "rgba(255,255,255,0.75)"; c.beginPath(); c.arc(x - r * 0.35, y - r * 0.35, r * 0.3, 0, 7); c.fill();
}
export function cross(k, u, v, z0, h) {
  const c = k.ctx; c.lineCap = "round";
  for (const [lw, col] of [[3, INK], [1.6, GOLDC]]) {
    c.strokeStyle = col; c.lineWidth = lw; c.beginPath();
    c.moveTo(...P(u, v, z0)); c.lineTo(...P(u, v, z0 + h));
    c.moveTo(...P(u - 0.15, v - 0.15, z0 + h * 0.68)); c.lineTo(...P(u + 0.15, v + 0.15, z0 + h * 0.68));
    c.stroke();
  }
}

// ---------- river boat that sits at the sunk water level ----------
export function rboat(k, u, v, ang, o = {}) {
  const L = o.L ?? 1.1, W = o.W ?? 0.4, c = k.ctx, zw = o.zw ?? -0.25;
  const [sx, sy] = P(u, v, zw);
  c.fillStyle = "rgba(255,255,255,0.5)"; c.beginPath(); c.ellipse(sx, sy + 1, L * 26 + 3, L * 10 + 2, 0, 0, 7); c.fill();
  obox(k, u, v, ang, L, W, zw + 0.02, 0.22, o.hull || "#2f4a62", { lw: 1.1 });
  const cb = obox(k, u - Math.cos(ang) * L * 0.06, v - Math.sin(ang) * L * 0.06, ang, L * 0.55, W * 0.8, zw + 0.24, 0.3, o.cabin || "#f4eddc", { lw: 1.0, topCol: o.roof || "#c8362f" });
  for (const f of cb.faces) if (f.long) { const n = o.windows ?? 4; for (let i = 0; i < n; i++) fquad(k, f, 0.08 + i * 0.9 / n, 0.08 + i * 0.9 / n + 0.9 / n * 0.7, 0.08, 0.22, "#a9c6d4", { lw: 0.6 }); }
}
export function rwake(k, u, v, ang, len = 1.0, a = 0.5, zw = -0.25) {
  const c = k.ctx, dx = Math.cos(ang), dy = Math.sin(ang);
  c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = 1.5; c.lineCap = "round";
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(...P(u - dx * 0.5, v - dy * 0.5, zw)); c.lineTo(...P(u - dx * (0.5 + len) - dy * s * 0.4, v - dy * (0.5 + len) + dx * s * 0.4, zw)); c.stroke(); }
}
