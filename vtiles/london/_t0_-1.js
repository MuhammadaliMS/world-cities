// London 0,-1 local helpers (copied/extended; the shared _props*.js are not touched): plane tree, river cruiser, buskers.
import { P, INK, shade, lerp, clamp, rng } from "../../lib/vec-kit.js";

const TAU = Math.PI * 2;

// ---------- London plane tree: mottled trunk, forking boughs, canopy of palmate-leaf clusters ----------
function leaf(c, x, y, r, rot, col) {
  c.beginPath();
  for (let i = 0; i < 10; i++) { const a = rot + (i / 10) * TAU, rr = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.85); }
  c.closePath(); c.fillStyle = col; c.fill();
}
export function planeTree(k, bx, by, cx, cy, R, o = {}) {
  const c = k.ctx, t = k.t, seed = o.seed ?? 1, rnd = rng(seed * 37 + 5);
  const base = o.col || "#8fa84a";
  // ground shadow
  c.fillStyle = "rgba(60,45,30,0.13)"; c.beginPath(); c.ellipse(bx + R * 0.35, by + 2, R * 0.95, R * 0.28, 0, 0, 7); c.fill();
  // trunk: pale mottled bark, forks into three boughs
  const fx = bx + (cx - bx) * 0.15, fy = by - (by - cy) * 0.5;
  c.lineCap = "round"; c.lineJoin = "round";
  const bough = (pts, w) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.strokeStyle = INK; c.lineWidth = w + 2.4; c.stroke(); c.strokeStyle = "#a79a82"; c.lineWidth = w; c.stroke(); c.strokeStyle = "rgba(120,125,80,0.55)"; c.lineWidth = w * 0.4; c.stroke(); };
  bough([[bx, by], [bx + (fx - bx) * 0.5 + 1, lerp(by, fy, 0.5)], [fx, fy]], R * 0.17);
  bough([[fx, fy], [fx - R * 0.42, cy + R * 0.1]], R * 0.09);
  bough([[fx, fy], [fx + R * 0.05, cy - R * 0.2]], R * 0.1);
  bough([[fx, fy], [fx + R * 0.45, cy + R * 0.05]], R * 0.09);
  // bark patches
  c.fillStyle = "rgba(95,110,60,0.6)"; for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(bx + (rnd() - 0.5) * R * 0.1, lerp(by, fy, 0.15 + i * 0.2), R * 0.035, R * 0.05, 0, 0, 7); c.fill(); }
  // clusters (back to front)
  const cl = [];
  const N = o.n ?? 15;
  for (let i = 0; i < N; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * 0.72; cl.push([Math.cos(a) * d * R * 1.1, Math.sin(a) * d * R * 0.85 - R * 0.05, R * (0.4 + rnd() * 0.18), i]); }
  cl.sort((p, q) => p[1] - q[1]);
  const geo = cl.map(([dx, dy, r, i]) => {
    const sway = (Math.sin(t * 1.1 + seed + i * 0.8) * 1.4 + Math.sin(t * 2.2 + seed * 2 + i) * 0.5) * (1 - (dy / R + 0.7) * 0.4);
    const rr = rng(seed * 101 + i), pts = [], M = 20;
    for (let j = 0; j < M; j++) { const a = (j / M) * TAU, q = r * (0.9 + rr() * 0.2); pts.push([Math.cos(a) * q, Math.sin(a) * q * 0.82]); }
    return { x: cx + dx + sway, y: cy + dy, r, i, pts, light: clamp(0.5 - (dx * 0.5 + dy * 0.9) / R * 0.5, 0, 1) };
  });
  // ink silhouette halo for the whole canopy
  c.fillStyle = INK;
  for (const g of geo) { c.beginPath(); g.pts.forEach(([px, py], j) => { const k2 = 1.03; j ? c.lineTo(g.x + px * k2 + Math.sign(px) * 0.9, g.y + py * k2 + Math.sign(py) * 0.9) : c.moveTo(g.x + px * k2 + Math.sign(px) * 0.9, g.y + py * k2 + Math.sign(py) * 0.9); }); c.closePath(); c.fill(); }
  for (const g of geo) {
    const { x, y, r, i, light } = g;
    c.beginPath(); g.pts.forEach(([px, py], j) => (j ? c.lineTo(x + px, y + py) : c.moveTo(x + px, y + py))); c.closePath();
    c.fillStyle = shade(base, -0.24 + light * 0.12); c.fill();
    const L = rng(seed * 733 + i * 17);
    for (let j = 0; j < 34; j++) {
      const a = L() * TAU, d = Math.sqrt(L()) * 0.86, lx = x + Math.cos(a) * d * r, ly = y + Math.sin(a) * d * r * 0.78;
      const up = clamp((-Math.sin(a) * 0.5 + 0.5) * 0.6 + light * 0.6 + (L() - 0.5) * 0.4, 0, 1);
      const cc = up > 0.75 ? "#d3d654" : up > 0.55 ? "#b3c24c" : up > 0.35 ? "#93ac45" : "#6e8d3a";
      leaf(c, lx, ly, r * 0.17 + L() * 2.4, L() * TAU, cc);
    }
  }
}

// ---------- river cruiser (own ground frame so it runs parallel to the quay like the reference) ----------
const GA = [0.964, 0.265], GB = [-0.5, 0.62];                     // ground X axis (along the river) and Y axis (towards the viewer)
const GO = [342, 808.5];
export const gpt = (gx, gy, z = 0) => [GO[0] + gx * GA[0] + gy * GB[0], GO[1] + gx * GA[1] + gy * GB[1] - z];
const LANE = 36, XE = 215, LOOP = 4 * XE / 2 * 2 + 2 * Math.PI * LANE; // 430*2 + 2*pi*36
const TOTAL = 2 * 2 * XE + 2 * Math.PI * LANE;
export function cruiserPose(t, speed = 30, s0 = 156) {
  const at = (s) => {
    s = ((s % TOTAL) + TOTAL) % TOTAL;
    const a = 2 * XE, h = Math.PI * LANE;
    if (s < a) return [XE - s, -LANE];
    s -= a; if (s < h) { const f = s / h, ph = -Math.PI / 2 - Math.PI * f; return [-XE + LANE * Math.cos(ph), LANE * Math.sin(ph)]; }
    s -= h; if (s < a) return [-XE + s, LANE];
    s -= a; { const f = s / h, ph = Math.PI / 2 - Math.PI * f; return [XE + LANE * Math.cos(ph), LANE * Math.sin(ph)]; }
  };
  const s = t * speed + s0, p = at(s), q = at(s + 2), r = at(s - 2);
  return { gx: p[0], gy: p[1], th: Math.atan2(q[1] - r[1], q[0] - r[0]) };
}
export function cruiser(k, t, clipFn) {
  const c = k.ctx, { gx, gy, th } = cruiserPose(t);
  const L = 176, W = 40, hz = 13, lw = 1.3;
  const ct = Math.cos(th), st = Math.sin(th);
  const pt = (s, w, z) => gpt(gx + ct * s - st * w, gy + st * s + ct * w, z);
  const sideSign = gpt(gx - st, gy + ct)[1] > gpt(gx + st, gy - ct)[1] ? 1 : -1;     // lateral sign facing the viewer
  const poly = (pts, fill, w = lw) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (w) { c.strokeStyle = INK; c.lineWidth = w; c.lineJoin = "round"; c.stroke(); } };
  // --- wake + reflection (clipped to water by the caller) ---
  c.save(); clipFn();
  const [rx, ry] = pt(0, 0, 0);
  c.fillStyle = "rgba(25,50,80,0.28)"; c.beginPath(); c.ellipse(rx + 4, ry + 5, 94, 20, Math.atan2(GA[1], GA[0]), 0, 7); c.fill();
  for (let side of [-1, 1]) for (let j = 0; j < 3; j++) {
    c.strokeStyle = `rgba(255,255,255,${0.55 - j * 0.14})`; c.lineWidth = 2.3 - j * 0.5; c.lineCap = "round"; c.setLineDash([9, 6 + j * 3]); c.lineDashOffset = -t * (22 + j * 6);
    c.beginPath(); c.moveTo(...pt(-L * 0.46, side * W * 0.42, 0)); c.quadraticCurveTo(...pt(-L * 0.46 - 60, side * (W * 0.55 + 14 + j * 8), 0), ...pt(-L * 0.46 - 150 - j * 20, side * (W * 0.55 + 46 + j * 12), 0)); c.stroke();
  }
  c.setLineDash([]);
  // prop wash behind the stern
  for (let i = 0; i < 9; i++) { const f = i / 9, w = Math.sin(t * 6 + i * 1.7) * 6, p = pt(-L * 0.5 - 6 - f * 70, w * f, 0); c.fillStyle = `rgba(255,255,255,${0.7 * (1 - f)})`; c.beginPath(); c.ellipse(p[0], p[1], 9 - f * 5, 3.8 - f * 2, Math.atan2(GA[1], GA[0]), 0, 7); c.fill(); }
  // bow wave
  for (const sd of [-1, 1]) { c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 2; c.beginPath(); c.moveTo(...pt(L * 0.5, 0, 0)); c.quadraticCurveTo(...pt(L * 0.3, sd * W * 0.62, 0), ...pt(L * 0.1, sd * W * 0.78, 0)); c.stroke(); }
  c.restore();
  // --- hull ---
  const prof = (s) => { const f = s / (L / 2); return W / 2 * (f > 0.55 ? Math.max(0.08, 1 - Math.pow((f - 0.55) / 0.45, 1.8) * 0.92) : 1); };
  const sheer = (s) => hz + 3.5 * Math.pow((s + L / 2) / L, 2.5);
  const S = []; for (let i = 0; i <= 24; i++) S.push(-L / 2 + (i / 24) * L);
  const far = -sideSign, near = sideSign;
  poly([...S.map((s) => pt(s, far * prof(s), sheer(s))), ...[...S].reverse().map((s) => pt(s, far * prof(s), 0))], "#e7e3d6");
  poly(S.map((s) => pt(s, 0, 0)).concat([]), null, 0);
  // deck
  poly([...S.map((s) => pt(s, near * prof(s), sheer(s))), ...[...S].reverse().map((s) => pt(s, far * prof(s), sheer(s)))], "#bfa27a");
  // near hull side (white, red + navy bands, windows row of portholes)
  const side = [...S.map((s) => pt(s, near * prof(s), sheer(s))), ...[...S].reverse().map((s) => pt(s, near * prof(s), 0))];
  poly(side, "#f6f3ea");
  const band = (z0, z1, col) => { poly([...S.map((s) => pt(s, near * prof(s), z0 + (sheer(s) - hz))), ...[...S].reverse().map((s) => pt(s, near * prof(s), z1 + (sheer(s) - hz)))], col, 0); };
  band(0, 3.2, "#2f4b6c"); band(3.2, 6, "#c8362f");
  c.beginPath(); S.forEach((s, i) => { const p = pt(s, near * prof(s), sheer(s)); i ? c.lineTo(...p) : c.moveTo(...p); }); c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
  c.beginPath(); S.forEach((s, i) => { const p = pt(s, near * prof(s), 0); i ? c.lineTo(...p) : c.moveTo(...p); }); c.stroke();
  c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.moveTo(...pt(-L / 2, near * W / 2, 0)); c.lineTo(...pt(-L / 2, near * W / 2, hz)); c.stroke();
  // life rings
  for (const s of [-30, 8, 48]) { const p = pt(s, near * prof(s), 9); c.beginPath(); c.arc(p[0], p[1], 4.2, 0, 7); c.fillStyle = "#d94a40"; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke(); c.beginPath(); c.arc(p[0], p[1], 1.8, 0, 7); c.fillStyle = "#f6f3ea"; c.fill(); c.stroke(); }
  // --- superstructure: boxes with only the viewer-facing faces ---
  const box = (s0, s1, w, z0, z1, col, top = "#f6f3ea") => {
    const cs = [[s0, -w], [s1, -w], [s1, w], [s0, w]];
    const faces = [[0, 1, -1], [1, 2, 0], [2, 3, 1], [3, 0, 2]];
    // outward ground normal of each face in (s,w): -w,+s,+w,-s
    const nrm = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    const fs = [];
    for (let i = 0; i < 4; i++) {
      const [ns, nw] = nrm[i], gx1 = ct * ns - st * nw, gy1 = st * ns + ct * nw;
      const sy = GA[1] * gx1 + GB[1] * gy1;      // screen y of the outward normal
      if (sy > 0.02) { const A = cs[i], B = cs[(i + 1) % 4]; fs.push({ A, B, long: i % 2 === 0, sy }); }
    }
    for (const f of fs) { poly([pt(f.A[0], f.A[1], z0), pt(f.B[0], f.B[1], z0), pt(f.B[0], f.B[1], z1), pt(f.A[0], f.A[1], z1)], shade(col, f.long ? -0.04 : -0.16)); }
    poly(cs.map(([a, b]) => pt(a, b, z1)), top);
    return fs;
  };
  const near3 = (f, a, b, z, col) => { // painted quad on a face (a..b along face, z0..z1)
    const A = f.A, B = f.B, q = (s, zz) => pt(lerp(A[0], B[0], s), lerp(A[1], B[1], s), zz);
    poly([q(a, z[0]), q(b, z[0]), q(b, z[1]), q(a, z[1])], col, 0.8);
  };
  const heads = (f, n, z, ph) => { const A = f.A, B = f.B; for (let i = 0; i < n; i++) { const s = 0.08 + (i + 0.5) * 0.84 / n, p = pt(lerp(A[0], B[0], s), lerp(A[1], B[1], s), z + Math.sin(t * 1.8 + i + ph) * 0.4); c.fillStyle = ["#f1c9a5", "#c68a62", "#9a6544", "#f5d6bc"][(i + ph) % 4]; c.beginPath(); c.arc(p[0], p[1], 2.6, 0, 7); c.fill(); c.fillStyle = ["#2a211c", "#7a4f2c", "#c99a5a", "#1c1a1a"][(i * 3 + ph) % 4]; c.beginPath(); c.arc(p[0], p[1] - 0.6, 2.7, Math.PI * 1.05, Math.PI * 1.98); c.fill(); } };
  const deckZ = hz + 2;
  // transom (stern face)
  poly([pt(-L / 2, -W / 2 * 1, hz), pt(-L / 2, W / 2, hz), pt(-L / 2, W / 2, 0), pt(-L / 2, -W / 2, 0)], "#e9e5d8", 0.9);
  // lower saloon (full length of the middle) with window band
  const lc = box(-L * 0.46, L * 0.3, W * 0.4, deckZ, deckZ + 13, "#f1efe6", "#dcd9ce");
  for (const f of lc) if (f.long) { near3(f, 0.03, 0.97, [3.5, 10.5], "#6f97a9"); heads(f, 9, deckZ + 7.5, 3); c.strokeStyle = "#f6f3ea"; c.lineWidth = 1.3; c.beginPath(); for (let i = 0; i <= 11; i++) { const s = 0.03 + i * 0.94 / 11, A = f.A, B = f.B; c.moveTo(...pt(lerp(A[0], B[0], s), lerp(A[1], B[1], s), deckZ + 3.5)); c.lineTo(...pt(lerp(A[0], B[0], s), lerp(A[1], B[1], s), deckZ + 10.5)); } c.stroke(); }
  // open top deck: slab, seated passengers (two rows), railing, small wheelhouse
  box(-L * 0.44, L * 0.28, W * 0.4, deckZ + 13, deckZ + 15, "#efece2", "#e6e3d8");
  const tz = deckZ + 15;
  const pc = ["#d9544b", "#3e6fa8", "#e9c24d", "#5f9d6d", "#e88c3d", "#7b5fa8", "#e27fa0", "#2e4a6b"], pk = ["#f1c9a5", "#c68a62", "#f5d6bc", "#9a6544", "#e0ac84"];
  const wh = box(L * 0.04, L * 0.16, W * 0.3, tz, tz + 13, "#f4f1e8", "#d9453b");
  for (const f of wh) near3(f, 0.1, 0.9, [4, 10], "#6f97a9");
  for (let r = 0; r < 2; r++) for (let i = 0; i < 10; i++) {
    const s = -L * 0.38 + i * 10.2 + (r ? 4 : 0), w = near * W * (r ? 0.12 : 0.3);
    if (s > L * 0.02 && s < L * 0.18 && r === 1) continue;
    const p = pt(s, w, tz + 3 + Math.sin(t * 1.5 + i * 0.9 + r) * 0.35), sk = pk[(i + r) % 5];
    c.fillStyle = pc[(i * 3 + r) % 8]; c.beginPath(); c.roundRect(p[0] - 2.7, p[1] - 1.5, 5.4, 6.5, 1.5); c.fill(); c.strokeStyle = "rgba(30,25,20,0.7)"; c.lineWidth = 0.6; c.stroke();
    c.fillStyle = sk; c.beginPath(); c.arc(p[0], p[1] - 4.4, 2.5, 0, 7); c.fill(); c.fillStyle = ["#2a211c", "#7a4f2c", "#c99a5a", "#1c1a1a", "#a8442e"][(i * 2 + r) % 5]; c.beginPath(); c.arc(p[0], p[1] - 4.9, 2.6, Math.PI * 1.05, Math.PI * 1.98); c.fill();
    if ((i + r) % 4 === 1) { c.strokeStyle = sk; c.lineWidth = 1.2; c.lineCap = "round"; c.beginPath(); c.moveTo(p[0] + 2.4, p[1] - 0.5); c.lineTo(p[0] + 4.2, p[1] - 8 - Math.abs(Math.sin(t * 4 + i)) * 2); c.stroke(); }
  }
  // railing round the top deck
  c.strokeStyle = "#f6f3ea"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(...pt(-L * 0.4, near * W * 0.4, tz + 8)); c.lineTo(...pt(L * 0.28, near * W * 0.4, tz + 8)); c.lineTo(...pt(L * 0.28, 0, tz + 8)); c.stroke();
  c.strokeStyle = "rgba(30,30,30,0.7)"; c.lineWidth = 0.8; c.beginPath(); for (let i = 0; i <= 12; i++) { const s = -L * 0.4 + i * (L * 0.68 / 12); c.moveTo(...pt(s, near * W * 0.4, tz)); c.lineTo(...pt(s, near * W * 0.4, tz + 8)); } c.stroke();
  // bow foredeck rail
  c.strokeStyle = "#e9e5d6"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(...pt(L * 0.3, near * W * 0.36, hz + 8)); c.lineTo(...pt(L * 0.47, near * W * 0.2, hz + 8)); c.stroke();
  // mast + flag
  const m0 = pt(L * 0.1, 0, tz + 13), m1 = pt(L * 0.1, 0, tz + 36);
  c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(...m0); c.lineTo(...m1); c.stroke(); c.strokeStyle = "#e9e5d6"; c.lineWidth = 0.9; c.stroke();
  const fl = Math.sin(t * 6) * 1.5; c.beginPath(); c.moveTo(m1[0], m1[1]); c.lineTo(m1[0] - 15, m1[1] + 3 + fl); c.lineTo(m1[0], m1[1] + 8); c.closePath(); c.fillStyle = "#c8362f"; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
  // bow rail pole and a waving child up front
  const wv = pt(L * 0.38, near * W * 0.18, deckZ + 6); c.strokeStyle = "#f1c9a5"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(wv[0], wv[1] + 1); c.lineTo(wv[0] + 3, wv[1] - 6 - Math.abs(Math.sin(t * 5)) * 3); c.stroke();
}

// ---------- buskers ----------
export function guitarist(k, u, v, seed) {
  const c = k.ctx, t = k.t, p = k.person(u, v, { pose: "stand", dir: [0.3, 1], seed, top: "#2e4a6b" });
  const [x, y] = P(u, v, 0), gx = x + 3, gy = y - 14;
  c.save(); c.translate(gx, gy); c.rotate(-0.55 + Math.sin(t * 5) * 0.03);
  c.fillStyle = "#b3743c"; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.ellipse(0, 0, 6.5, 4.6, 0, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.ellipse(5, -0.5, 4.2, 3.6, 0, 0, 7); c.fill(); c.stroke(); c.fillStyle = "#2a211c"; c.beginPath(); c.arc(2.2, 0, 1.4, 0, 7); c.fill();
  c.strokeStyle = INK; c.lineWidth = 2.3; c.beginPath(); c.moveTo(8, -1); c.lineTo(20, -3); c.stroke(); c.strokeStyle = "#5a3a22"; c.lineWidth = 1.1; c.stroke();
  c.restore();
  // open case + coins
  const [cu, cv] = [u + 0.45, v + 0.35], [cx, cy] = P(cu, cv, 0);
  c.fillStyle = "#2a2420"; c.beginPath(); c.moveTo(cx - 8, cy); c.lineTo(cx, cy + 4); c.lineTo(cx + 8, cy); c.lineTo(cx, cy - 4); c.fill(); c.fillStyle = "#6a1f2c"; c.beginPath(); c.moveTo(cx - 6, cy); c.lineTo(cx, cy + 2.6); c.lineTo(cx + 6, cy); c.lineTo(cx, cy - 2.6); c.fill();
  c.fillStyle = "#e9c24d"; for (const [a, b] of [[-2, 0], [1, 1], [3, -1]]) c.fillRect(cx + a, cy + b - 0.5, 1.6, 1.2);
  // music notes
  for (let i = 0; i < 3; i++) { const f = ((t * 0.5 + i / 3) % 1), nx = x + 8 + Math.sin(f * 6 + i) * 6 + f * 8, ny = y - 30 - f * 28; c.globalAlpha = 1 - f; c.fillStyle = "#2a2420"; c.beginPath(); c.ellipse(nx, ny, 2.4, 1.8, -0.4, 0, 7); c.fill(); c.strokeStyle = "#2a2420"; c.lineWidth = 1; c.beginPath(); c.moveTo(nx + 2, ny); c.lineTo(nx + 2, ny - 7); c.stroke(); c.globalAlpha = 1; }
  return p;
}
export function juggler(k, u, v, seed) {
  const c = k.ctx, t = k.t, p = k.person(u, v, { pose: "cheer", dir: [0.2, 1], seed, top: "#d9433a", bottom: "#2e3d5c" });
  const [x, y] = P(u, v, 0), hy = y - 31;
  const cols = ["#e9c24d", "#3e8fd0", "#d9433a"];
  for (let i = 0; i < 3; i++) {
    const f = ((t * 1.1 + i / 3) % 1), ph = f * TAU;
    const px = x + Math.cos(ph) * 8, py = hy + 8 - Math.abs(Math.sin(ph / 2)) * 26 + Math.sin(ph) * 0;
    c.beginPath(); c.arc(px, hy - 6 - Math.abs(Math.sin(f * Math.PI)) * 22 + 6, 3, 0, 7); c.fillStyle = cols[i]; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
  }
  return p;
}
