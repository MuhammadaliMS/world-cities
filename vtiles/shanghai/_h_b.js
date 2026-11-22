// helpers for Tianzifang + Jing'an tiles
import { P, CTS, INK, shade, mix, lerp, clamp, rng, hash, lantern } from "./_props.js";

// string of lanterns between two screen points (catenary), swaying
export function lanternString(k, a, b, n, seed, cols = ["#d8392e", "#e8553a", "#e8a23a"]) {
  const c = k.ctx, t = k.t, sag = 12 + Math.abs(b[0] - a[0]) * 0.04;
  const pt = (f) => [lerp(a[0], b[0], f), lerp(a[1], b[1], f) + Math.sin(Math.PI * f) * sag];
  c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); for (let i = 0; i <= 20; i++) { const p = pt(i / 20); i ? c.lineTo(...p) : c.moveTo(...p); } c.stroke();
  for (let i = 0; i < n; i++) { const f = (i + 0.5) / n, p = pt(f); lantern(k, p[0], p[1] - 4, { s: 0.7, col: cols[(i + seed) % cols.length], ph: i * 1.7 + seed }); }
}
export function stoneLantern(k, u, v, h = 1.1) {
  const c = k.ctx, t = k.t;
  k.ell(u + 0.12, v + 0.06, 0, 0.3, "rgba(60,45,30,0.15)", { stroke: false });
  k.box(u - 0.18, v - 0.18, 0, 0.36, 0.36, 0.14, "#cfc8b6", { hatch: false, shadow: false });
  k.cyl(u, v, 0.14, 0.09, h * 0.4, "#d6cfbd");
  k.box(u - 0.14, v - 0.14, 0.14 + h * 0.4, 0.28, 0.28, 0.26, "#d0c9b6", { hatch: false, shadow: false });
  const [x, y] = P(u, v, 0.14 + h * 0.4 + 0.13); c.fillStyle = `rgba(255,214,120,${0.7 + 0.2 * Math.sin(t * 4 + u)})`; c.fillRect(x - 3, y - 4, 6, 7);
  k.box(u - 0.22, v - 0.22, 0.4 + h * 0.4, 0.44, 0.44, 0.09, "#c4bca8", { hatch: false, shadow: false });
  k.cyl(u, v, 0.49 + h * 0.4, 0.1, 0.12, "#cfc8b6");
  k.dome(u, v, 0.61 + h * 0.4, 0.14, 0.14, "#bdb5a1");
}
export function planter(k, u, v, du, dv, cols, seed) {
  k.box(u, v, 0, du, dv, 0.28, "#cdbd9f", { hatch: false, shadow: false });
  k.flowers(u + 0.06, v + 0.06, du - 0.12, dv - 0.12, { seed, bed: "#6f9f55", density: 110, cols });
}
export function pot(k, u, v, col = "#b86a46", cols = ["#f39ac0", "#ffffff", "#e8607a"], seed = 1) {
  const c = k.ctx, [x, y] = P(u, v, 0), R = rng(seed + 5);
  k.ell(u + 0.1, v + 0.04, 0, 0.2, "rgba(60,45,30,0.15)", { stroke: false });
  c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - 7, y - 11); c.lineTo(x + 7, y - 11); c.lineTo(x + 5, y); c.lineTo(x - 5, y); c.closePath(); c.fill(); c.stroke();
  for (let i = 0; i < 4; i++) k._lobe(x + (R() - 0.5) * 9, y - 17 - R() * 5, 6 + R() * 2, "#78a850", seed * 7 + i, { bumps: 6 });
  for (let i = 0; i < 6; i++) { c.fillStyle = cols[i % cols.length]; c.beginPath(); c.arc(x + (R() - 0.5) * 16, y - 18 - R() * 8, 2.1, 0, 7); c.fill(); }
}
// bonsai pine: twisted trunk + flat cloud pads
export function bonsai(k, u, v, seed = 1, sc = 1) {
  const c = k.ctx, t = k.t, [x, y] = P(u, v, 0.28), R = rng(seed * 11 + 3);
  c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 8 * sc; c.beginPath(); c.moveTo(x + 4, y); c.bezierCurveTo(x - 14, y - 16 * sc, x + 10, y - 28 * sc, x - 4, y - 44 * sc); c.stroke();
  c.strokeStyle = "#8a6446"; c.lineWidth = 5 * sc; c.stroke();
  c.strokeStyle = INK; c.lineWidth = 5 * sc; c.beginPath(); c.moveTo(x - 6, y - 24 * sc); c.lineTo(x - 34 * sc, y - 34 * sc); c.moveTo(x + 2, y - 34 * sc); c.lineTo(x + 32 * sc, y - 46 * sc); c.stroke(); c.strokeStyle = "#8a6446"; c.lineWidth = 3 * sc; c.stroke();
  const pads = [[-4, -50, 30], [-34, -38, 22], [32, -49, 24], [-18, -60, 18], [16, -60, 18]];
  pads.forEach(([dx, dy, r], i) => {
    const sw = Math.sin(t * 1.2 + seed + i) * 1.4, cx = x + dx * sc + sw, cy = y + dy * sc;
    c.beginPath(); c.ellipse(cx, cy, r * sc, r * sc * 0.5, 0, 0, 7); c.fillStyle = i % 2 ? "#4d7a3e" : "#5b8a47"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
    c.strokeStyle = "rgba(25,50,25,0.5)"; c.lineWidth = 0.9; for (let j = 0; j < 7; j++) { const a = (j / 7) * 6.28; c.beginPath(); c.moveTo(cx + Math.cos(a) * r * sc * 0.3, cy + Math.sin(a) * r * sc * 0.15); c.lineTo(cx + Math.cos(a) * r * sc * 0.85, cy + Math.sin(a) * r * sc * 0.42); c.stroke(); }
    c.fillStyle = "rgba(190,230,140,0.45)"; c.beginPath(); c.ellipse(cx - r * sc * 0.25, cy - r * sc * 0.16, r * sc * 0.4, r * sc * 0.16, 0, 0, 7); c.fill();
  });
}
export function bike(k, u, v, dir, col) { k.bike(u, v, { dir, col }); }
