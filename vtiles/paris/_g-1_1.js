// PARIS -1,1 helpers (grid pass): garden props, all positioned through P().
import { P, INK, shade, lerp, rng } from "../../lib/vec-kit.js";

export function pedestal(k, u, v, h, w = 0.42) {
  k.box(u - w / 2 - 0.06, v - w / 2 - 0.06, 0, w + 0.12, w + 0.12, 0.16, "#e2d3ae", { hatch: false });
  k.box(u - w / 2, v - w / 2, 0.16, w, w, h - 0.16, "#ebdfbc", { hatch: false, shadow: false });
  k.box(u - w / 2 - 0.05, v - w / 2 - 0.05, h, w + 0.1, w + 0.1, 0.1, "#f2e8c9", { hatch: false, shadow: false });
}
// marble statue on a pedestal (small figure drawn around a projected anchor)
export function statueFig(k, u, v, h, t, seed) {
  const c = k.ctx;
  pedestal(k, u, v, h);
  const [x, y] = P(u, v, h + 0.1), s = 1.45 + (seed % 2) * 0.06, sw = Math.sin(t * 0.8 + seed) * 0.4;
  c.lineJoin = "round"; c.lineCap = "round";
  c.fillStyle = "#f4eedf"; c.strokeStyle = INK; c.lineWidth = 1;
  c.beginPath(); c.moveTo(x - 7 * s, y); c.quadraticCurveTo(x - 8 * s, y - 14, x - 5 * s, y - 24 * s); c.lineTo(x + 4 * s, y - 24 * s); c.quadraticCurveTo(x + 8 * s, y - 14, x + 7 * s, y); c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = "rgba(120,100,70,0.55)"; c.lineWidth = 0.7; c.beginPath(); for (const dx of [-4, -1.5, 1.5, 4]) { c.moveTo(x + dx, y - 2); c.quadraticCurveTo(x + dx * 1.3, y - 12, x + dx * 0.6, y - 22); } c.stroke();
  c.fillStyle = "rgba(140,120,90,0.18)"; c.fillRect(x + 2 * s, y - 24 * s, 5 * s, 24 * s);
  c.strokeStyle = INK; c.lineWidth = 1; c.fillStyle = "#f6f1e3"; c.beginPath(); c.arc(x - 0.5 * s, y - 29 * s, 4 * s, 0, 7); c.fill(); c.stroke();
  c.lineWidth = 2.8; c.strokeStyle = INK; c.beginPath(); c.moveTo(x + 3 * s, y - 22 * s); c.lineTo(x + (9 + sw) * s, y - 33 * s); c.stroke();
  c.lineWidth = 1.6; c.strokeStyle = "#f4eedf"; c.stroke();
  c.lineWidth = 2.2; c.strokeStyle = INK; c.beginPath(); c.moveTo(x - 4 * s, y - 21 * s); c.lineTo(x - 7 * s, y - 12 * s); c.stroke(); c.lineWidth = 1.2; c.strokeStyle = "#f4eedf"; c.stroke();
}
// Luxembourg chair: green metal, slatted seat, curved back on the side away from `face` (an axis direction [fu, fv])
export function chair(k, u, v, face) {
  const c = k.ctx, [fu, fv] = face, h = 0.12, GRN = "#4f8765";
  const A = (a, b, z) => P(u + fu * a - fv * b, v + fv * a + fu * b, z); // a = forward, b = sideways
  k.shadow([[u - 0.15, v - 0.15, 0], [u + 0.25, v - 0.1, 0], [u + 0.25, v + 0.25, 0], [u - 0.1, v + 0.25, 0]], 0.1);
  c.lineCap = "round"; c.lineJoin = "round";
  for (const [w, col] of [[3, INK], [1.6, GRN]]) {
    c.strokeStyle = col; c.lineWidth = w; c.beginPath();
    for (const [a, b] of [[h, -h], [h, h], [-h, -h], [-h, h]]) { c.moveTo(...A(a, b, 0)); c.lineTo(...A(a, b, 0.3)); }
    for (const b of [-h, h]) { c.moveTo(...A(-h, b, 0.3)); c.quadraticCurveTo(...A(-h - 0.1, b, 0.55), ...A(-h - 0.05, b, 0.75)); }
    c.stroke();
  }
  k.path([A(-h, -h, 0.3), A(h, -h, 0.3), A(h, h, 0.3), A(-h, h, 0.3)], { fill: "#6aa57d", lw: 0.9, wobble: 0 });
  c.strokeStyle = "rgba(255,255,255,0.35)"; c.lineWidth = 0.6; c.beginPath(); for (let i = -1; i <= 1; i++) { c.moveTo(...A(-h, i * 0.08, 0.3)); c.lineTo(...A(h, i * 0.08, 0.3)); } c.stroke();
  k.path([A(-h - 0.06, -h, 0.38), A(-h - 0.06, h, 0.38), A(-h - 0.06, h, 0.72), A(-h - 0.06, -h, 0.72)], { fill: "rgba(95,155,115,0.85)", lw: 0.8, wobble: 0 });
}
export function topiary(k, u, v) {
  const c = k.ctx, [x, y] = P(u, v, 0); k.ell(u + 0.1, v + 0.05, 0, 0.3, "rgba(60,45,30,0.14)", { stroke: false });
  c.fillStyle = "#5e8f3f"; c.strokeStyle = INK; c.lineWidth = 1.1; c.beginPath(); c.moveTo(x - 8, y); c.quadraticCurveTo(x - 10, y - 18, x, y - 30); c.quadraticCurveTo(x + 10, y - 18, x + 8, y); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = "rgba(20,50,10,0.22)"; c.beginPath(); c.moveTo(x + 1, y - 29); c.quadraticCurveTo(x + 10, y - 18, x + 8, y); c.lineTo(x + 1, y); c.closePath(); c.fill();
  c.strokeStyle = "rgba(30,60,20,0.5)"; c.lineWidth = 0.8; c.beginPath(); for (let i = 1; i < 5; i++) { const yy = y - i * 6; c.moveTo(x - 7 + i * 0.6, yy); c.quadraticCurveTo(x, yy + 2, x + 7 - i * 0.6, yy); } c.stroke();
}
export function chestnut(k, u, v, seed, big) {
  k.tree(u, v, { r: big ? 0.78 : 0.62, h: big ? 1.9 : 1.6, seed, col: "#8cb05a" });
  const c = k.ctx, [x, y] = P(u, v, big ? 1.9 : 1.6), R = rng(seed); c.fillStyle = "rgba(255,248,240,0.95)";
  for (let i = 0; i < (big ? 20 : 12); i++) { const a = R() * 6.28, d = R() * (big ? 34 : 26); c.beginPath(); c.ellipse(x + Math.cos(a) * d, y - 6 + Math.sin(a) * d * 0.7 - R() * 10, 1.8, 3.4, 0.3, 0, 7); c.fill(); }
}
export function sailboat(k, u, v, f, t, col, seed) {
  const c = k.ctx, [x, y] = P(u, v, 0.02), bob = Math.sin(t * 2 + seed) * 0.7;
  c.strokeStyle = "rgba(255,255,255,0.85)"; c.lineWidth = 1.1; for (let i = 0; i < 3; i++) { const ph = (t * 0.7 + i / 3 + seed * 0.13) % 1; c.globalAlpha = (1 - ph) * 0.9; c.beginPath(); c.ellipse(x - f * (4 + ph * 12), y + 1.5, 4 + ph * 11, (4 + ph * 11) * 0.34, 0, 0, 7); c.stroke(); } c.globalAlpha = 1;
  c.fillStyle = "rgba(20,70,90,0.22)"; c.beginPath(); c.ellipse(x, y + 3, 10, 2.6, 0, 0, 7); c.fill();
  c.fillStyle = "#7a4a2a"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 9 * f, y - 2 + bob); c.lineTo(x + 9 * f, y - 2 + bob); c.lineTo(x + 6 * f, y + 2.4 + bob); c.lineTo(x - 6 * f, y + 2.4 + bob); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = "#e9dcc0"; c.fillRect(x - 6, y - 0.6 + bob, 12, 1.2);
  c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x, y - 2 + bob); c.lineTo(x, y - 25 + bob); c.stroke();
  const sw = Math.sin(t * 2.6 + seed) * 1.6;
  c.fillStyle = col; c.beginPath(); c.moveTo(x + 1 * f, y - 24 + bob); c.quadraticCurveTo(x + (11 + sw) * f, y - 12 + bob, x + 8.5 * f, y - 4 + bob); c.lineTo(x + 1 * f, y - 4 + bob); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
  c.fillStyle = "#f6f2e6"; c.beginPath(); c.moveTo(x - 1 * f, y - 21 + bob); c.lineTo(x - 8 * f, y - 5 + bob); c.lineTo(x - 1 * f, y - 5 + bob); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = "#e04b3c"; c.beginPath(); c.moveTo(x, y - 25 + bob); c.lineTo(x - 4 * f, y - 24 + bob); c.lineTo(x, y - 22.6 + bob); c.fill();
}
// flower parterre: an axis-aligned bed of coloured blocks and stripes in a pattern, plus a clipped box-hedge border
export function parterre(k, u, v, du, dv, seed, t) {
  const R = rng(seed * 7 + 3), c = k.ctx;
  const sets = [["#e8607a", "#f39ac0", "#fff"], ["#f4c542", "#e9813c", "#fff2b0"], ["#7a6ad8", "#c9a5f0", "#fff"], ["#e8607a", "#f4c542", "#fff"]][seed % 4];
  const hedge = "#5a8a3a";
  const pad = 0.12;
  k.box(u, v, 0, du, dv, 0.07, "#7aa150", { hatch: false, shadow: false, top: "#6f9a48" });
  // inner pattern cells
  const nu = Math.max(2, Math.round(du / 0.42)), nv = Math.max(2, Math.round(dv / 0.42));
  const cu = (du - pad * 2) / nu, cv = (dv - pad * 2) / nv;
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const col = sets[(i + j + (seed % 3)) % sets.length];
    const u0 = u + pad + i * cu + 0.03, v0 = v + pad + j * cv + 0.03;
    k.poly([[u0, v0, 0.075], [u0 + cu - 0.06, v0, 0.075], [u0 + cu - 0.06, v0 + cv - 0.06, 0.075], [u0, v0 + cv - 0.06, 0.075]], shade(col, -0.18), { lw: 0.6, wobble: 0 });
    for (let s = 0; s < 5; s++) {
      const [x, y] = P(u0 + R() * (cu - 0.08) + 0.01, v0 + R() * (cv - 0.08) + 0.01, 0.11);
      c.fillStyle = col; c.beginPath(); c.arc(x + Math.sin(t * 1.3 + s + i + j) * 0.35, y - 1.5, 2.1, 0, 7); c.fill();
      c.fillStyle = "rgba(255,240,170,0.9)"; c.beginPath(); c.arc(x, y - 1.5, 0.7, 0, 7); c.fill();
    }
  }
  // hedge border drawn as a raised rim
  const e = 0.1, hh = 0.16;
  for (const [a, b, d, w] of [[u, v, du, e], [u, v + dv - e, du, e]]) k.box(a, b, 0.0, d, w, hh, hedge, { hatch: false, shadow: false, top: "#6f9e4c", right: shade(hedge, -0.2) });
  for (const [a, b, d, w] of [[u, v + e, e, dv - 2 * e], [u + du - e, v + e, e, dv - 2 * e]]) k.box(a, b, 0.0, d, w, hh, hedge, { hatch: false, shadow: false, top: "#6f9e4c", right: shade(hedge, -0.2) });
}
