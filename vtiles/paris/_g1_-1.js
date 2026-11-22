// PARIS 1,-1 grid helpers (copied from the old 1_-1.js): terrace lawn, wall courses, balustrade, stair flight, elevation helper.
import { P, CTS, INK, shade, lerp, rng } from "../../lib/vec-kit.js";
export const ZS = CTS.S * CTS.ZS;
// run fn with everything drawn z units up (props standing on an elevated terrace at their true u,v)
export const at = (k, z, fn) => { const c = k.ctx; c.save(); c.translate(0, -z * ZS); fn(); c.restore(); };
export function lawnTufts(k, u, v, du, dv, z, seed, n = 380) {
  const c = k.ctx;
  const poly = [[u, v], [u + du, v], [u + du, v + dv], [u, v + dv]].map(([a, b]) => P(a, b, z));
  c.save(); k._trace(poly, true, 0); c.clip();
  const R2 = rng(seed); c.strokeStyle = "rgba(62,98,40,0.55)"; c.lineWidth = 0.9; c.beginPath();
  for (let i = 0; i < n; i++) { const [x, y] = P(u + R2() * du, v + R2() * dv, z); c.moveTo(x - 2, y); c.lineTo(x - 0.7, y - 3); c.moveTo(x, y); c.lineTo(x, y - 3.6); c.moveTo(x + 2, y); c.lineTo(x + 0.7, y - 3); }
  c.stroke();
  c.fillStyle = "rgba(255,255,230,0.2)"; for (let i = 0; i < 50; i++) { const [x, y] = P(u + R2() * du, v + R2() * dv, z); c.beginPath(); c.ellipse(x, y, 6 + R2() * 5, 2 + R2() * 2, 0, 0, 7); c.fill(); }
  // shaded lawn rim
  c.strokeStyle = "rgba(60,90,35,0.4)"; c.lineWidth = 3; k._trace(poly, true, 0); c.stroke();
  c.restore();
}
export function wallCourses(k, u0, u1, v, z0, z1, side = "L", step = 0.4) {
  const c = k.ctx; c.strokeStyle = "rgba(120,90,50,0.28)"; c.lineWidth = 0.7; c.beginPath();
  const Q = side === "L" ? (s, z) => P(s, v, z) : (s, z) => P(v, s, z);
  for (let z = z0 + 0.25; z < z1; z += 0.25) { c.moveTo(...Q(u0, z)); c.lineTo(...Q(u1, z)); }
  for (let s = u0; s < u1; s += step) for (let z = z0, r = 0; z < z1; z += 0.25, r++) { c.moveTo(...Q(s + (r % 2) * step * 0.5, z)); c.lineTo(...Q(s + (r % 2) * step * 0.5, z + 0.25)); }
  c.stroke();
}
// stone balustrade: posts + top rail + baluster rows
export function balustrade(k, A, B, z) {
  const c = k.ctx, L = Math.hypot(B[0] - A[0], B[1] - A[1]), n = Math.max(2, Math.round(L / 0.14));
  const pt = (f, zz) => P(lerp(A[0], B[0], f), lerp(A[1], B[1], f), z + zz);
  c.strokeStyle = "rgba(120,95,55,0.8)"; c.lineWidth = 1.1; c.beginPath();
  for (let i = 0; i <= n; i++) { const f = i / n; c.moveTo(...pt(f, 0)); c.lineTo(...pt(f, 0.26)); }
  c.stroke();
  c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.moveTo(...pt(0, 0.3)); c.lineTo(...pt(1, 0.3)); c.stroke();
  c.strokeStyle = "#f2e7c8"; c.lineWidth = 2; c.stroke();
  const np = Math.max(2, Math.round(L / 0.8));
  for (let i = 0; i <= np; i++) { const f = i / np; c.strokeStyle = INK; c.lineWidth = 3.6; c.beginPath(); c.moveTo(...pt(f, 0)); c.lineTo(...pt(f, 0.36)); c.stroke(); c.strokeStyle = "#ead9b3"; c.lineWidth = 2.2; c.stroke(); }
}
// a straight flight of steps climbing toward -v, with iron rails
export function flight(k, u0, w, vb, vt, z0, z1, n = 9, o = {}) {
  const d = (vb - vt) / n, h = (z1 - z0) / n, c = k.ctx;
  for (let i = n; i >= 1; i--) k.box(u0, vb - i * d, z0, w, d, i * h, o.col || "#ddd0ac", { hatch: false, shadow: false, top: shade(o.col || "#ddd0ac", 0.12) });
  for (const uu of [u0 + 0.04, u0 + w - 0.04]) {
    c.strokeStyle = "#26352c"; c.lineWidth = 2.6; c.beginPath(); c.moveTo(...P(uu, vb, z0 + 0.4)); c.lineTo(...P(uu, vt, z1 + 0.4)); c.stroke();
    c.lineWidth = 0.9; c.strokeStyle = "#1c2620"; c.beginPath(); for (let i = 0; i <= n * 2; i++) { const f = i / (n * 2); c.moveTo(...P(uu, lerp(vb, vt, f), lerp(z0, z1, f) + 0.05)); c.lineTo(...P(uu, lerp(vb, vt, f), lerp(z0, z1, f) + 0.4)); } c.stroke();
  }
}
