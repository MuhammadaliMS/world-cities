// props for the Notting Hill + Shard tiles
import { P, CTS, INK, shade, lerp, clamp, rng, smooth, spline } from "../../lib/vec-kit.js";
import { obox, fquad } from "./_props.js";

// ---------- weeping willow: trunk, domed crown, swaying curtain of strands ----------
export function willow(k, u, v, o = {}) {
  const c = k.ctx, t = k.t, h = o.h ?? 2.2, r = o.r ?? 1.0, seed = o.seed ?? 5, R = rng(seed * 11 + 3);
  const [bx, by] = P(u, v, 0), [cx, cy] = P(u, v, h);
  k.ell(u + 0.3, v + 0.15, 0, r * 0.9, "rgba(60,45,30,0.16)", { stroke: false });
  c.lineCap = "round";
  c.strokeStyle = INK; c.lineWidth = 9; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + 5, (by + cy) / 2, cx + 3, cy + 6); c.stroke();
  c.strokeStyle = "#8a6a4c"; c.lineWidth = 6; c.stroke();
  const Rr = r * CTS.S * 1.05;
  const col = o.col || "#aac24c", dark = shade(col, -0.2), light = shade(col, 0.18);
  // crown blobs
  const blobs = [[-0.55, 0.05, 0.62], [0.55, 0.0, 0.62], [0, -0.3, 0.72], [-0.2, 0.2, 0.6], [0.3, 0.22, 0.6]];
  for (const [dx, dy, s] of blobs) k._lobe(cx + dx * Rr + Math.sin(t * 0.9 + seed + dx) * 1.5, cy + dy * Rr, Rr * s, col, seed * 9 + Math.round(dx * 10), { bumps: 9 });
  // hanging strands: wavy curves with a phase lag toward the tip
  const n = Math.round(Rr * 0.95);
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1), x0 = cx + (f - 0.5) * Rr * 2.05, a = Math.abs(f - 0.5) * 2;
    const y0 = cy + Rr * (0.15 + a * a * 0.45) + R() * 4;
    const len = Rr * (0.8 + R() * 0.55) * (1 - a * 0.35);
    const ph = R() * 6.28, sw = 1.2 + R() * 1.4;
    c.beginPath(); c.moveTo(x0, y0);
    for (let s = 1; s <= 6; s++) { const q = s / 6; c.lineTo(x0 + Math.sin(t * 1.3 + ph + q * 1.4) * sw * q * 2.2 + (f - 0.5) * q * 6, y0 + q * len); }
    c.strokeStyle = R() < 0.5 ? col : (R() < 0.5 ? dark : light); c.lineWidth = 2.4; c.stroke();
  }
}

// ---------- iron railing run (posts + two rails), along u or v ----------
export function railing(k, u0, v0, u1, v1, o = {}) {
  const c = k.ctx, h = o.h ?? 0.55, n = Math.max(2, Math.round(Math.hypot(u1 - u0, v1 - v0) / (o.step ?? 0.42)));
  const z0 = o.z ?? 0;
  c.lineCap = "round";
  c.strokeStyle = "#1e1c1c"; c.lineWidth = 1.2;
  for (const f of [h * 0.35, h * 0.85]) { c.beginPath(); c.moveTo(...P(u0, v0, z0 + f)); c.lineTo(...P(u1, v1, z0 + f)); c.stroke(); }
  for (let i = 0; i <= n; i++) {
    const u = lerp(u0, u1, i / n), v = lerp(v0, v1, i / n), [x, y] = P(u, v, z0), [, yt] = P(u, v, z0 + h);
    c.lineWidth = i % 4 === 0 ? 2.8 : 1.2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt); c.stroke();
    c.beginPath(); c.arc(x, yt - 1, i % 4 === 0 ? 2 : 1.3, 0, 7); c.fillStyle = "#1e1c1c"; c.fill();
  }
}

// ---------- market stall: striped awning, table with goods; face = "u" (opens toward +u) or "v" (toward +v) ----------
export function stall(k, u, v, o = {}) {
  const c = k.ctx, t = k.t, face = o.face || "u", L = o.len ?? 1.5, D = o.depth ?? 0.9, c1 = o.c1 || "#d64e46", c2 = "#f6f0e2";
  // frame coordinates: a along the stall, d outward (toward the viewer)
  const A = (a, d, z) => (face === "u" ? P(u + d, v + a, z) : P(u + a, v + d, z));
  const AP = (a, d, z) => (face === "u" ? [u + d, v + a, z] : [u + a, v + d, z]);
  k.shadow([AP(0, 0, 0), AP(L, 0, 0), AP(L, D + 0.3, 0), AP(0, D + 0.3, 0)], 0.1);
  // back posts + front posts
  c.lineCap = "round";
  for (const [a, d] of [[0.04, 0.0], [L - 0.04, 0.0], [0.04, D], [L - 0.04, D]]) { const [x, y] = A(a, d, 0), [, yt] = A(a, d, d === 0 ? 1.55 : 1.2); c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt); c.stroke(); c.strokeStyle = "#8a6a46"; c.lineWidth = 1.5; c.stroke(); }
  // back cloth
  k.poly([AP(0, 0, 0.25), AP(L, 0, 0.25), AP(L, 0, 1.5), AP(0, 0, 1.5)], o.back || "#e9d9c0", { lw: 1, wobble: 0 });
  // goods hung on the back: mirrors, plates, framed pictures
  const R = rng(o.seed ?? 3);
  for (let i = 0; i < 6; i++) { const [x, y] = A(0.12 + i * (L - 0.24) / 5, 0.0, 0.85 + (i % 2) * 0.28); c.beginPath(); c.ellipse(x, y, 4.2, 5, 0, 0, 7); c.fillStyle = i % 3 === 0 ? "#cfe3ee" : (i % 3 === 1 ? "#e0b84c" : "#b7d2c0"); c.fill(); c.strokeStyle = "#8a6a2a"; c.lineWidth = 1.4; c.stroke(); }
  // table + cloth
  k.poly([AP(0.02, 0.15, 0.55), AP(L - 0.02, 0.15, 0.55), AP(L - 0.02, D - 0.02, 0.55), AP(0.02, D - 0.02, 0.55)], o.cloth || "#d98fa0", { lw: 1.1, wobble: 0 });
  k.poly([AP(0.02, D - 0.02, 0.55), AP(L - 0.02, D - 0.02, 0.55), AP(L - 0.02, D - 0.02, 0.18), AP(0.02, D - 0.02, 0.18)], shade(o.cloth || "#d98fa0", -0.1), { lw: 1, wobble: 0 });
  // goods on the table: lamps, jugs, flowers
  const gk = o.goods || "mix";
  for (let i = 0; i < 6; i++) {
    const [x, y] = A(0.18 + i * (L - 0.36) / 5, 0.4 + (i % 2) * 0.28, 0.58), kind = (i + (o.seed || 0)) % 3;
    if (gk === "flowers" || kind === 0) { c.fillStyle = "#c97a5a"; c.beginPath(); c.roundRect(x - 3, y - 5, 6, 5, 1); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.7; c.stroke(); for (let j = 0; j < 4; j++) { c.fillStyle = ["#e8607a", "#f4c542", "#ffffff", "#c9415a"][(i + j) % 4]; c.beginPath(); c.arc(x + (j - 1.5) * 2.2, y - 8 - (j % 2) * 2, 2, 0, 7); c.fill(); } }
    else if (kind === 1) { c.fillStyle = "#f4e6a8"; c.beginPath(); c.moveTo(x - 3.2, y - 8); c.lineTo(x + 3.2, y - 8); c.lineTo(x + 4.5, y - 14); c.lineTo(x - 4.5, y - 14); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.7; c.stroke(); c.strokeStyle = INK; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 8); c.stroke(); }
    else { c.fillStyle = "#6fa3b8"; c.beginPath(); c.ellipse(x, y - 4, 3.2, 4.4, 0, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.7; c.stroke(); }
  }
  // striped awning (sloping from high back to low front, scalloped edge)
  const n = o.stripes ?? 8, zb = 1.6, zf = 1.2, d0 = -0.05, d1 = D + 0.18;
  for (let i = 0; i < n; i++) {
    const a = (L + 0.2) * i / n - 0.1, b = (L + 0.2) * (i + 1) / n - 0.1;
    const col = i % 2 ? c2 : c1;
    k.poly([AP(a, d0, zb + 0.18), AP(b, d0, zb + 0.18), AP(b, d1, zf), AP(a, d1, zf)], col, { lw: 1, wobble: 0 });
    const [x0, y0] = A(a, d1, zf), [x1, y1] = A(b, d1, zf);
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 5, x1, y1); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
  }
}

// ---------- narrowboat ----------
export function narrowboat(k, u, v, ang, o = {}) {
  const Z = o.z0 ?? 0, c = k.ctx, t = k.t, L = o.L ?? 3.0, W = 0.56, dx = Math.cos(ang), dy = Math.sin(ang);
  const [sx, sy] = P(u, v, Z);
  const bob = Math.sin(t * 1.5 + (o.phase ?? 0)) * 0.012;
  c.fillStyle = "rgba(20,70,80,0.25)"; c.beginPath(); c.ellipse(sx, sy + 2, L * 26, L * 10, 0, 0, 7); c.fill();
  const hull = o.hull || "#2d4c3c", cab = o.cabin || "#a8322f", stripe = "#e8d9a0";
  const b = obox(k, u, v, ang, L, W, Z - 0.06 + bob, 0.4, hull, { lw: 1.2 });
  for (const f of b.faces) if (f.long) fquad(k, f, 0.02, 0.98, 0.26, 0.32, stripe, { lw: 0.5 });
  // cabin (long) + bow well
  const cu = u - dx * L * 0.1, cv = v - dy * L * 0.1;
  const cb = obox(k, cu, cv, ang, L * 0.66, W * 0.84, Z + 0.34 + bob, 0.52, cab, { lw: 1.1, topCol: "#d8c9a0" });
  for (const f of cb.faces) {
    if (f.long) { for (let i = 0; i < 5; i++) { const s0 = 0.08 + i * 0.18; fquad(k, f, s0, s0 + 0.12, 0.17, 0.4, "#d9ecf2", { lw: 0.7 }); } fquad(k, f, 0.0, 1, 0.0, 0.07, "#e8d9a0", { lw: 0.4 }); }
  }
  // roof: planters with flowers + chimney with smoke
  const nP = 3;
  for (let i = 0; i < nP; i++) {
    const f = -0.45 + i * 0.42, [x, y] = P(cu + dx * f * L * 0.5, cv + dy * f * L * 0.5, Z + 0.9 + bob);
    c.fillStyle = "#c97a5a"; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.roundRect(x - 7, y - 3, 14, 5, 1.5); c.fill(); c.stroke();
    for (let j = 0; j < 6; j++) { c.fillStyle = ["#e8607a", "#f39ac0", "#f4c542", "#ffffff"][(i + j) % 4]; c.beginPath(); c.arc(x - 6 + j * 2.4, y - 5 - (j % 2) * 2, 2.1, 0, 7); c.fill(); }
  }
  const [chx, chy] = P(cu + dx * L * 0.18, cv + dy * L * 0.18, Z + 0.88 + bob);
  c.fillStyle = "#222"; c.fillRect(chx - 2, chy - 11, 4, 11); c.fillStyle = "#c8a24a"; c.fillRect(chx - 3, chy - 12, 6, 2);
  for (let i = 0; i < 4; i++) { const s = ((t * 0.5 + i / 4) % 1); c.fillStyle = `rgba(235,235,235,${0.55 * (1 - s)})`; c.beginPath(); c.arc(chx + s * 8 + Math.sin(t + i) * 2, chy - 14 - s * 22, 2.5 + s * 4, 0, 7); c.fill(); }
  // tiller + stern deck: a little brass lamp on the bow
  const [lx, ly] = P(u + dx * L * 0.46, v + dy * L * 0.46, Z + 0.4 + bob);
  c.fillStyle = "#f2c94c"; c.beginPath(); c.arc(lx, ly - 4, 2, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.7; c.stroke();
  return { sternU: u - dx * L * 0.42, sternV: v - dy * L * 0.42, bob };
}
export function ripples(k, u, v, ang, a = 0.55) {
  const c = k.ctx, t = k.t, dx = Math.cos(ang), dy = Math.sin(ang);
  c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = 1.4; c.lineCap = "round";
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(...P(u + dx * 1.5, v + dy * 1.5, -0.05)); c.quadraticCurveTo(...P(u + dx * 0.4 - dy * s * 0.4, v + dy * 0.4 + dx * s * 0.4, -0.05), ...P(u - dx * 1.3 - dy * s * 0.9, v - dy * 1.3 + dx * s * 0.9, -0.05)); c.stroke(); }
  for (let i = 0; i < 3; i++) { const f = ((t * 0.4 + i / 3) % 1); c.globalAlpha = a * (1 - f); c.beginPath(); c.ellipse(...P(u - dx * (1.5 + f * 1.2), v - dy * (1.5 + f * 1.2), -0.05), 6 + f * 22, 2.5 + f * 9, 0, 0, 7); c.stroke(); } c.globalAlpha = 1;
}
export function umbrellaOver(c, p, col, t) {
  const x = p.x + 4, y = p.headY - 8, r = 16;
  c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x, y + 6); c.lineTo(x, y - 8); c.stroke();
  c.beginPath(); c.moveTo(x - r, y - 8); c.quadraticCurveTo(x, y - 8 - r * 1.15, x + r, y - 8); c.quadraticCurveTo(x + r * 0.5, y - 5, x, y - 8); c.quadraticCurveTo(x - r * 0.5, y - 5, x - r, y - 8); c.closePath();
  c.fillStyle = col; c.fill(); c.lineWidth = 1.4; c.stroke();
  c.strokeStyle = "rgba(255,255,255,0.4)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x, y - 8 - r * 0.58); c.lineTo(x - r * 0.45, y - 8); c.moveTo(x, y - 8 - r * 0.58); c.lineTo(x + r * 0.45, y - 8); c.stroke();
}
