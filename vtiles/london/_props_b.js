// helpers for the Buckingham Palace + St Paul's tiles
import { P, INK, shade, lerp, rng } from "../../lib/vec-kit.js";

export function quad(c, pts, fill, lw = 0.9, stroke = INK) {
  c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (lw) { c.strokeStyle = stroke; c.lineWidth = lw; c.lineJoin = "round"; c.stroke(); }
}

// ornate three-globe gold lamp on a black pole
export function tripleLamp(k, u, v, h = 1.9) {
  const c = k.ctx, [x, y] = P(u, v, 0), [, yt] = P(u, v, h);
  k.ell(u + 0.1, v + 0.05, 0, 0.13, "rgba(60,45,30,0.16)", { stroke: false });
  quad(c, [[x - 5, y], [x + 5, y], [x + 3, y - 9], [x - 3, y - 9]], "#25282b", 1);
  c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 4.2; c.beginPath(); c.moveTo(x, y - 8); c.lineTo(x, yt + 4); c.stroke(); c.strokeStyle = "#2c3034"; c.lineWidth = 2.4; c.stroke();
  c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - 9, yt + 4); c.quadraticCurveTo(x, yt + 10, x + 9, yt + 4); c.stroke();
  for (const [dx, dy, r] of [[-9, 2, 4.4], [9, 2, 4.4], [0, -6, 5.2]]) {
    c.beginPath(); c.arc(x + dx, yt + dy, r, 0, 7); c.fillStyle = "#f0cf68"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
    c.fillStyle = "rgba(255,255,255,0.65)"; c.beginPath(); c.arc(x + dx - r * 0.3, yt + dy - r * 0.3, r * 0.3, 0, 7); c.fill();
  }
  c.fillStyle = "#e0b640"; c.beginPath(); c.arc(x, yt - 13, 1.8, 0, 7); c.fill();
}

// sentry box (green/red with a guard silhouette)
export function sentryBox(k, u, v, guard = true) {
  const c = k.ctx, [x, y] = P(u, v, 0);
  k.ell(u + 0.1, v + 0.05, 0, 0.3, "rgba(60,45,30,0.16)", { stroke: false });
  quad(c, [[x - 12, y], [x + 12, y], [x + 12, y - 50], [x, y - 58], [x - 12, y - 50]], "#2f6a58", 1.2);
  quad(c, [[x - 8, y - 2], [x + 8, y - 2], [x + 8, y - 46], [x - 8, y - 46]], "#7a4a32", 0.9);
  c.fillStyle = "#c8362f"; c.fillRect(x - 6, y - 38, 12, 34);
  c.fillStyle = "#e4c150"; c.fillRect(x - 12, y - 51, 24, 2.4);
  if (guard) {
    c.fillStyle = "#c8362f"; c.fillRect(x - 4, y - 34, 8, 20); c.strokeStyle = INK; c.lineWidth = 0.8; c.strokeRect(x - 4, y - 34, 8, 20);
    c.fillStyle = "#e9c4a0"; c.beginPath(); c.arc(x, y - 38, 3, 0, 7); c.fill(); c.stroke();
    c.fillStyle = "#1e1c1c"; c.beginPath(); c.roundRect(x - 3.6, y - 51, 7.2, 11, 3); c.fill();
  }
}

// bearskin cap on a person returned by k.person/k.walker
export function bearskin(k, r) {
  const c = k.ctx, w = r.hr * 1.5, h = r.hr * 2.5;
  c.fillStyle = "#1e1c1c"; c.strokeStyle = INK; c.lineWidth = 0.8;
  c.beginPath(); c.moveTo(r.x - w * 0.75, r.headY - r.hr * 0.4); c.quadraticCurveTo(r.x - w * 0.85, r.headY - h * 0.95, r.x, r.headY - h); c.quadraticCurveTo(r.x + w * 0.85, r.headY - h * 0.95, r.x + w * 0.75, r.headY - r.hr * 0.4); c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = "rgba(255,255,255,0.18)"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(r.x - w * 0.3, r.headY - r.hr * 0.6); c.lineTo(r.x - w * 0.3, r.headY - h * 0.8); c.stroke();
  c.fillStyle = "#f2efe6"; c.fillRect(r.x + w * 0.45, r.headY - h * 0.8, 1.6, 4);
}

// iron fence along a screen-space polyline with gold-tipped spears
export function fence(k, pts, h = 24, o = {}) {
  const c = k.ctx;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], L = Math.hypot(x1 - x0, y1 - y0), n = Math.round(L / 5.4);
    c.lineCap = "round";
    c.strokeStyle = "#1c1b1b"; c.lineWidth = 1.5;
    c.beginPath();
    for (let j = 0; j <= n; j++) { const f = j / n, x = lerp(x0, x1, f), y = lerp(y0, y1, f); c.moveTo(x, y); c.lineTo(x, y - h); }
    c.stroke();
    c.lineWidth = 1.3; c.beginPath();
    for (const dz of [4, h * 0.78]) { c.moveTo(x0, y0 - dz); c.lineTo(x1, y1 - dz); }
    c.stroke();
    c.fillStyle = o.tip || "#e4b940";
    for (let j = 0; j <= n; j++) { const f = j / n, x = lerp(x0, x1, f), y = lerp(y0, y1, f) - h; c.beginPath(); c.moveTo(x - 1.7, y + 1); c.lineTo(x, y - 5); c.lineTo(x + 1.7, y + 1); c.closePath(); c.fill(); }
  }
}
export function pier(k, x, y, h = 46, w = 11, o = {}) {
  const c = k.ctx, col = o.col || "#e1cfae";
  quad(c, [[x - w, y], [x, y + w * 0.5], [x, y - h + w * 0.5], [x - w, y - h]], shade(col, 0.02), 1);
  quad(c, [[x, y + w * 0.5], [x + w, y], [x + w, y - h], [x, y - h + w * 0.5]], shade(col, -0.16), 1);
  quad(c, [[x - w - 2, y - h], [x, y - h + w * 0.5 + 1], [x + w + 2, y - h], [x, y - h - w * 0.5 - 1]], shade(col, 0.08), 1);
  c.strokeStyle = "rgba(120,90,60,0.35)"; c.lineWidth = 0.7; for (let i = 1; i < 5; i++) { const yy = y - h * i / 5; c.beginPath(); c.moveTo(x - w, yy); c.lineTo(x, yy + w * 0.5); c.lineTo(x + w, yy); c.stroke(); }
  if (o.lamp) return;
  c.beginPath(); c.arc(x, y - h - w * 0.5 - 5, 4.8, 0, 7); c.fillStyle = "#e4b940"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
}
export function chimney(c, x, y, w = 15, h = 20) {
  quad(c, [[x - w / 2, y], [x, y + 3], [x, y - h + 3], [x - w / 2, y - h]], "#e6d1ae", 0.9);
  quad(c, [[x, y + 3], [x + w / 2, y], [x + w / 2, y - h], [x, y - h + 3]], "#c4a97f", 0.9);
  quad(c, [[x - w / 2 - 2, y - h], [x, y - h + 4], [x + w / 2 + 2, y - h], [x, y - h - 4]], "#efdfc0", 0.9);
}
