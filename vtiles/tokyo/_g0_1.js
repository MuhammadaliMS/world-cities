// TOKYO 0,1 (Ueno Park) grid helpers: closed-curve maths in (u,v), and sprites drawn around a P()-projected anchor.
import { P, CTS, INK, shade, lerp, clamp, rng, hash } from "../../lib/vec-kit.js";
export { P, CTS, INK, shade, lerp, clamp, rng, hash };

export function chaikin(pts, n = 3, closed = false) {
  for (let i = 0; i < n; i++) {
    const o = [], m = pts.length, segs = closed ? m : m - 1;
    if (!closed) o.push(pts[0]);
    for (let j = 0; j < segs; j++) {
      const a = pts[j], b = pts[(j + 1) % m];
      o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    if (!closed) o.push(pts[m - 1]);
    pts = o;
  }
  return pts;
}
export function ribbon(pts, w, closed = false) {
  const L = [], R = [], n = pts.length;
  const at = (i) => (closed ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const N = closed ? n + 1 : n;
  for (let i = 0; i < N; i++) {
    const p = at(i), a = at(i - 1), b = at(i + 1), l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nu = (-(b[1] - a[1]) / l) * w / 2, nv = ((b[0] - a[0]) / l) * w / 2;
    L.push([p[0] + nu, p[1] + nv]); R.push([p[0] - nu, p[1] - nv]);
  }
  return [...L, ...R.reverse()];
}
// push a closed polygon outward by d (normals averaged; the pond is convex enough for this)
export function offsetPoly(pts, d) {
  const n = pts.length; let area = 0;
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
  const sg = area > 0 ? 1 : -1;
  return pts.map((p, i) => {
    const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [p[0] + sg * ((b[1] - a[1]) / l) * d, p[1] - sg * ((b[0] - a[0]) / l) * d];
  });
}
export function makeLoop(pts) {
  const n = pts.length, cum = [0];
  for (let i = 1; i <= n; i++) { const a = pts[i - 1], b = pts[i % n]; cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const L = cum[n];
  const at = (f, off = 0) => {
    f = ((f % 1) + 1) % 1; const s = f * L; let i = 0; while (i < n - 1 && cum[i + 1] < s) i++;
    const a = pts[i], b = pts[(i + 1) % n], q = (s - cum[i]) / (cum[i + 1] - cum[i] || 1);
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    return [lerp(a[0], b[0], q) - (dy / l) * off, lerp(a[1], b[1], q) + (dx / l) * off];
  };
  const lane = (f0, f1, off, step = 0.01) => { const o = []; for (let f = f0; f < f1 + 1e-6; f += step) o.push(at(f, off)); return o; };
  return { at, lane, L };
}
export function inPoly(pts, u, v) { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const a = pts[i], b = pts[j]; if ((a[1] > v) !== (b[1] > v) && u < ((b[0] - a[0]) * (v - a[1])) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
export function distToPoly(pts, u, v) { let d = 1e9; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 1, t = clamp(((u - a[0]) * dx + (v - a[1]) * dy) / l2); d = Math.min(d, Math.hypot(u - a[0] - dx * t, v - a[1] - dy * t)); } return d; }
export const ellUV = (cu, cv, ru, rv, n = 28, wob = 0, seed = 1) => { const o = []; for (let i = 0; i < n; i++) { const a = (i / n) * 6.2832, w = 1 + (hash(i * 3.3 + seed) - 0.5) * wob * 2; o.push([cu + Math.cos(a) * ru * w, cv + Math.sin(a) * rv * w]); } return o; };

// ---- sprites around an anchor (local offsets are a few px only; the anchor always comes from P) ----
export function cherryAt(k, u, v, R, seed, t) {
  const c = k.ctx, rnd = rng(seed * 7 + 3), [x, by] = P(u, v, 0), cyc = by - R * 1.5;
  k.ell(u + 0.3, v + 0.12, 0, R / 45 * 1.1, "rgba(60,45,30,0.16)", { stroke: false });
  c.lineCap = "round";
  for (const [w, col] of [[R * 0.2, INK], [R * 0.12, "#6e4a3a"]]) {
    c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x, by); c.quadraticCurveTo(x - 2, by - R * 0.8, x + 1, by - R * 1.3); c.stroke();
    for (const [dx, dy] of [[-0.55, -1.7], [0.55, -1.65], [0, -1.85]]) { c.lineWidth = w * 0.65; c.beginPath(); c.moveTo(x + 1, by - R * 1.15); c.lineTo(x + dx * R, by + dy * R * 0.8); c.stroke(); }
  }
  const lobes = [[-0.62, 0.05, 0.5], [0.62, 0.0, 0.5], [0, 0.18, 0.55], [-0.38, -0.38, 0.5], [0.4, -0.4, 0.5], [0, -0.62, 0.48], [-0.75, -0.3, 0.38], [0.75, -0.28, 0.38], [-0.2, 0.42, 0.4], [0.28, 0.4, 0.4]];
  const pals = ["#f4b8cb", "#f8c6d6", "#ee9db8", "#f9d0dc"];
  lobes.forEach(([dx, dy, s], i) => {
    const sway = Math.sin(t * 1.1 + seed + i * 0.7) * 1.2 * (1 - dy);
    k._lobe(x + dx * R + sway, cyc + dy * R * 0.85, R * s * 1.12, shade(pals[i % 4], -(dx + dy) * 0.06), seed * 17 + i, { squash: 0.85, bumps: 11, lw: 0.55 });
  });
  const N = Math.round(R * 1.2);
  for (let i = 0; i < N; i++) {
    const a = rnd() * 6.28, d = Math.sqrt(rnd()) * 0.95, fx = x + Math.cos(a) * d * R * 1.05 + Math.sin(t * 1.1 + seed + i * 0.3) * 0.6, fy = cyc + Math.sin(a) * d * R * 0.78, tone = rnd();
    c.fillStyle = tone < 0.3 ? "#ffffff" : tone < 0.65 ? "#fbd9e4" : "#e87fa5";
    for (let p = 0; p < 5; p++) { const pa = p * 1.257 + i; c.beginPath(); c.arc(fx + Math.cos(pa) * 1.5, fy + Math.sin(pa) * 1.5, 1.2, 0, 6.3); c.fill(); }
  }
}
export function oakAt(k, u, v, o = {}) { k.tree(u, v, { r: o.r ?? 0.55, h: o.h ?? 1.5, col: o.col || "#7ea551", seed: o.seed ?? 3 }); }

export function willowAt(k, u, v, o = {}) {
  const c = k.ctx, t = k.t, [bx, by] = P(u, v, 0), [cx, cy] = P(u, v, o.h ?? 1.7), r = (o.r ?? 0.7) * 45, hang = (o.hang ?? 1.0) * 42, seed = o.seed ?? 3, rnd = rng(seed * 11 + 5), col = o.col || "#a8c64c";
  k.ell(u + 0.3, v + 0.12, 0, 0.6, "rgba(60,45,30,0.15)", { stroke: false });
  c.lineCap = "round";
  for (const [w, cc] of [[6.5, INK], [4, "#7a5a3a"]]) { c.strokeStyle = cc; c.lineWidth = w; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx - 3, (by + cy) / 2, cx - 2, cy + r * 0.2); c.stroke(); }
  k._lobe(cx, cy, r * 0.8, shade(col, -0.06), seed * 3, { squash: 0.7, bumps: 10, lw: 0.8 });
  k._lobe(cx - r * 0.35, cy + 3, r * 0.55, col, seed * 3 + 1, { squash: 0.7, bumps: 8, lw: 0.8 });
  k._lobe(cx + r * 0.4, cy + 2, r * 0.55, shade(col, 0.05), seed * 3 + 2, { squash: 0.7, bumps: 8, lw: 0.8 });
  const n = 15;
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1) * 2 - 1, sx = cx + f * r * 0.95, sy = cy + r * 0.2 * (1 - f * f), len = hang * (0.65 + rnd() * 0.45), sw = Math.sin(t * 1.3 + i * 0.7 + seed) * 2.4;
    c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(sx + sw * 0.4 + f * 4, sy + len * 0.5, sx + sw + f * 6, sy + len); c.strokeStyle = INK; c.lineWidth = 3; c.stroke(); c.strokeStyle = i % 2 ? shade(col, 0.08) : col; c.lineWidth = 1.7; c.stroke();
  }
}

export function reedsAt(k, u, v, n, seed, h = 26) {
  const c = k.ctx, t = k.t, [x, y] = P(u, v, 0), R = rng(seed * 3 + 9);
  for (let i = 0; i < n; i++) {
    const bx = x + (R() - 0.5) * 14, by = y + (R() - 0.5) * 4, hh = h * (0.7 + R() * 0.6), sw = Math.sin(t * 1.4 + i * 1.3 + seed) * 2.4 + (R() - 0.5) * 3, tx = bx + sw, ty = by - hh;
    c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + sw * 0.2, by - hh * 0.5, tx, ty); c.stroke();
    c.strokeStyle = i % 2 ? "#7ea64c" : "#92b95a"; c.lineWidth = 1.6; c.stroke();
    if (i % 3 === 0) { c.strokeStyle = INK; c.lineWidth = 4.4; c.beginPath(); c.moveTo(tx, ty + 7); c.lineTo(tx + sw * 0.1, ty - 2); c.stroke(); c.strokeStyle = "#6b4a2a"; c.lineWidth = 2.8; c.stroke(); }
  }
}
export function padAt(c, u, v, r, rot, col, bob = 0) {
  const [x, y] = P(u, v, 0); r *= 0.78; c.save(); c.translate(x, y + bob);
  const n0 = rot % 6.28; c.beginPath(); c.ellipse(0, 0, r, r * 0.46, 0, n0 + 0.3, n0 + Math.PI * 2); c.lineTo(0, 0); c.closePath();
  c.fillStyle = col; c.fill(); c.strokeStyle = "#1f3a22"; c.lineWidth = 1; c.stroke();
  c.fillStyle = "rgba(255,255,200,0.16)"; c.beginPath(); c.ellipse(-r * 0.2, -r * 0.1, r * 0.55, r * 0.22, 0, 0, 7); c.fill();
  c.restore();
}
export function lotusAt(c, u, v, size, ph, t, bud, bob = 0) {
  const [x, y0] = P(u, v, 0), y = y0 - 9 + bob, sw = Math.sin(t * 1.2 + ph) * 0.8;
  c.save(); c.translate(x + sw, y);
  c.strokeStyle = "#3d6a36"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-sw * 0.5, size * 1.4); c.lineTo(0, 0); c.stroke();
  if (bud) { c.fillStyle = "#f4a7c4"; c.strokeStyle = "#a54a72"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(0, size * 0.9); c.quadraticCurveTo(-size * 0.7, 0, 0, -size * 1.3); c.quadraticCurveTo(size * 0.7, 0, 0, size * 0.9); c.fill(); c.stroke(); }
  else {
    for (const [dx, dy, lt] of [[-1.0, 0.25, 0], [1.0, 0.25, 0], [-0.55, -0.1, 0.35], [0.55, -0.1, 0.35], [0, -0.35, 0.5]]) { c.beginPath(); c.moveTo(0, size * 0.5); c.quadraticCurveTo(dx * size * 0.95, dy * size * 0.6 - size * 0.6, dx * size * 0.5, -size * (0.45 + lt)); c.quadraticCurveTo(dx * size * 0.15, -size * 0.1, 0, size * 0.5); c.fillStyle = lt > 0.3 ? "#fbc3d8" : "#f08ab4"; c.fill(); c.strokeStyle = "#a54a72"; c.lineWidth = 0.7; c.stroke(); }
    c.fillStyle = "#f7e08a"; c.beginPath(); c.ellipse(0, size * 0.1, size * 0.25, size * 0.14, 0, 0, 7); c.fill();
  }
  c.restore();
}
export function stoneAt(c, u, v, r, seed) {
  const [x, y0] = P(u, v, 0), y = y0 + 1, R = rng(seed * 5 + 2);
  c.beginPath(); for (let i = 0; i <= 10; i++) { const a = (i / 10) * 6.283, rr = r * (0.85 + R() * 0.25), px = x + Math.cos(a) * rr * 1.25, py = y + Math.sin(a) * rr * 0.72; i ? c.lineTo(px, py) : c.moveTo(px, py); }
  c.closePath(); const g = c.createLinearGradient(x - r, y - r, x + r, y + r); g.addColorStop(0, "#d8d2c0"); g.addColorStop(1, "#8d8774"); c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
}
export function shrubAt(k, u, v, col, seed) {
  const c = k.ctx, R = rng(seed), [x, y] = P(u, v, 0);
  for (let i = 0; i < 3; i++) k._lobe(x - 10 + i * 10, y - 4 - (i % 2) * 4, 8, i % 2 ? "#6f9e52" : "#7aa858", seed + i, { squash: 0.8, bumps: 8 });
  for (let i = 0; i < 14; i++) { const fx = x - 16 + R() * 32, fy = y - 12 + R() * 10; c.fillStyle = col[i % col.length]; c.beginPath(); c.arc(fx, fy, 1.8, 0, 6.3); c.fill(); }
}

// falling petals from a canopy: pure function of t, ending on the ground inside the footprint
export function petalFall(k, u, v, n, o = {}) {
  const c = k.ctx, t = k.t, h0 = o.h ?? 1.5, spread = o.spread ?? 0.7;
  for (let i = 0; i < n; i++) {
    const h1 = hash(i * 1.37 + (o.seed || 0)), h2 = hash(i * 7.11 + 3 + (o.seed || 0)), T = (o.T ?? 6) * (0.75 + h2 * 0.5);
    const f = (((t / T + h1) % 1) + 1) % 1, a = h1 * 6.28, d = Math.sqrt(h2) * spread;
    const pu = u + Math.cos(a) * d + f * 0.5 + Math.sin(t * 1.2 + h1 * 12) * 0.12, pv = v + Math.sin(a) * d + f * 0.2;
    if (pu < 0.3 || pu > 9.7 || pv < 0.3 || pv > 9.7) continue;
    const [x, y] = P(pu, pv, h0 * (1 - f)), al = Math.min(1, f * 6, (1 - f) * 3);
    c.save(); c.translate(x, y); c.rotate(t * 2 + i); c.globalAlpha = al * 0.95; c.fillStyle = o.col || "#f7bccb"; c.beginPath(); c.ellipse(0, 0, 2.3, 1.3 + Math.sin(t * 5 + i) * 0.5, 0, 0, 6.3); c.fill(); c.restore();
  }
  c.globalAlpha = 1;
}

// ---- swan pedal boat sprite (anchor from P), wake is drawn separately on the ground ----
export function swanAt(k, u, v, face, t, seed, spd, sc = 0.82) {
  const c = k.ctx, [x, y] = P(u, v, 0), bob = Math.sin(t * 1.8 + seed) * 1.0;
  c.save(); c.translate(x, y + bob); c.scale(face * sc, sc);
  c.lineCap = "round"; c.lineJoin = "round";
  c.fillStyle = "rgba(10,70,80,0.25)"; c.beginPath(); c.ellipse(2, 9, 28, 6.5, 0, 0, 6.3); c.fill();
  c.beginPath(); c.moveTo(-26, 0); c.quadraticCurveTo(-37, -6, -34, -17); c.quadraticCurveTo(-27, -9, -20, -8); c.fillStyle = "#fdfdfb"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
  c.beginPath(); c.moveTo(-27, -1); c.quadraticCurveTo(-24, -18, -2, -17); c.quadraticCurveTo(22, -15, 30, -3); c.quadraticCurveTo(12, 9, -14, 9); c.quadraticCurveTo(-25, 7, -27, -1); c.fillStyle = "#fdfdfb"; c.fill(); c.stroke();
  c.fillStyle = "rgba(160,185,205,0.55)"; c.beginPath(); c.moveTo(-24, 3); c.quadraticCurveTo(0, 10, 24, 0); c.quadraticCurveTo(10, 8, -14, 8); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-20, -8); c.quadraticCurveTo(-6, -22, 12, -10); c.quadraticCurveTo(0, -5, -20, -8); c.fillStyle = "#f2f4f6"; c.fill(); c.strokeStyle = "rgba(120,140,160,0.9)"; c.lineWidth = 0.9; c.stroke();
  for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-14 + i * 6, -10); c.lineTo(-10 + i * 6, -6); c.stroke(); }
  c.strokeStyle = INK;
  c.beginPath(); c.moveTo(18, -9); c.quadraticCurveTo(36, -14, 31, -30); c.quadraticCurveTo(29, -41, 37, -43); c.lineTo(41, -39); c.quadraticCurveTo(35, -34, 39, -22); c.quadraticCurveTo(43, -6, 25, 0); c.closePath(); c.fillStyle = "#fdfdfb"; c.fill(); c.lineWidth = 1.5; c.stroke();
  c.beginPath(); c.arc(39, -43, 5.2, 0, 6.3); c.fill(); c.stroke(); c.beginPath(); c.moveTo(43, -44); c.lineTo(54, -42); c.lineTo(43, -40); c.closePath(); c.fillStyle = "#f08a1e"; c.fill(); c.stroke(); c.fillStyle = INK; c.beginPath(); c.arc(41, -45, 1.1, 0, 6.3); c.fill();
  // riders: pedalling legs, swinging arms, bobbing heads
  const ph = t * (2.4 + spd * 4) + seed;
  [[-8, "#e87a8a", "#2a211c", 0], [8, "#4a79b0", "#4d3524", Math.PI]].forEach(([dx, col, hair, off]) => {
    const rx = dx, ry = 0;
    c.strokeStyle = INK; c.lineWidth = 3.6; const kn = Math.sin(ph + off) * 2.4; c.beginPath(); c.moveTo(rx, ry - 12); c.lineTo(rx + 5 + kn, ry - 9 + kn * 0.3); c.lineTo(rx + 4, ry - 3); c.stroke(); c.strokeStyle = "#31405e"; c.lineWidth = 2; c.stroke();
    c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.roundRect(rx - 3.6, ry - 24, 7.2, 13, 2.4); c.fill(); c.stroke();
    const arm = Math.sin(ph * 0.5 + off) * 2; c.strokeStyle = INK; c.lineWidth = 2.8; c.beginPath(); c.moveTo(rx + 1, ry - 21); c.lineTo(rx + 6, ry - 17 + arm); c.stroke(); c.strokeStyle = col; c.lineWidth = 1.5; c.stroke();
    c.fillStyle = "#f0c9a5"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.arc(rx, ry - 28 + Math.sin(ph * 0.5 + off) * 0.5, 3.6, 0, 6.3); c.fill(); c.stroke(); c.fillStyle = hair; c.beginPath(); c.arc(rx, ry - 29.3, 3.6, Math.PI, 0); c.fill();
  });
  c.restore();
}
// wake rings + V trail on the water, all in (u,v)
export function swanWake(k, u, v, du, dv, t, seed) {
  const c = k.ctx, L = Math.hypot(du, dv) || 1, a = du / L, b = dv / L;
  c.save(); c.lineCap = "round";
  for (let i = 0; i < 3; i++) {
    const f = (t * 0.45 + i / 3 + seed * 0.37) % 1, ru = 0.35 + f * 0.55;
    c.globalAlpha = (1 - f) * 0.6; c.strokeStyle = "#ffffff"; c.lineWidth = 1.1;
    c.beginPath(); for (let j = 0; j <= 20; j++) { const q = (j / 20) * 6.2832, [x, y] = P(u + Math.cos(q) * ru, v + Math.sin(q) * ru, 0); j ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
  }
  c.globalAlpha = 0.75; c.strokeStyle = "#ffffff"; c.lineWidth = 1.4;
  for (const s of [-1, 1]) { c.beginPath(); for (let j = 0; j <= 6; j++) { const back = 0.3 + j * 0.1, sp = s * (0.03 + j * 0.035); c.lineTo(...P(u - a * back - b * sp, v - b * back + a * sp, 0)); } c.stroke(); }
  c.restore();
}
