// TOKYO -1,1 · Meiji Jingu hero module: honden hall (copper roofs), cedar/camphor forest, great torii,
// sake-barrel wall (kazaridaru), temizuya basin, mossy stone lanterns, rope fences, rocks, shrubs.
// Everything is placed in CTS px traced from assets/tokyo/-1_1.png (the painting is not true iso).
import { glow as nightGlow } from "../../lib/night.js";
import { P, INK, shade, lerp, rng, hash } from "../../lib/vec-kit.js";
import { FONT, uvOf, depthOf } from "./_props.js";

const TAU = Math.PI * 2;
// Everything here was measured in raw painting px. GA maps the painting's own ground surface
// (corners (78,662) (510,938) (965,668)) onto the CTS diamond at z=0: ground geometry goes through
// the full affine (RC); upright objects are placed at their mapped base with a plain x/y scale so
// verticals stay vertical. (The trace view's ref warp for this tile uses the slab-bottom corner from
// the manifest and is sheared, so the onion view drifts ~1 unit near the top; this mapping keeps the
// scene on the real ground.)
export const AFF = [1.0143671, -0.0064318, 0.0427297, 0.950828, -45.407729, 35.703563];
export const RC = (x, y) => [AFF[0] * x + AFF[2] * y + AFF[4], AFF[1] * x + AFF[3] * y + AFF[5]];
export const RCs = (pts) => pts.map(([x, y]) => RC(x, y));
export const SC = 0.951;
export function place(c, ax, ay, fn) { const [X, Y] = RC(ax, ay); c.save(); c.translate(X, Y); c.scale(1.0144, SC); c.translate(-ax, -ay); fn(); c.restore(); }
export const uvR = (x, y) => uvOf(...RC(x, y));
export const depthR = (x, y) => depthOf(...RC(x, y));
export const GOLD = "#e2b23a", GOLD_L = "#fbe7a0", GOLD_D = "#a87a1c";
const COP = "#94b59c"; // weathered copper roof
const WOOD = "#c68a52", WOOD_D = "#8c5a32", WOOD_L = "#e0a86e";

// ---------- small px helpers ----------
export function pl(c, pts, close = true) { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); if (close) c.closePath(); }
export function poly(c, pts, fill, lw = 1.2, stroke = INK) {
  pl(c, pts); if (fill) { c.fillStyle = fill; c.fill(); }
  if (lw) { c.strokeStyle = stroke; c.lineWidth = lw; c.lineJoin = "round"; c.stroke(); }
}
const L2 = (a, b, f) => [lerp(a[0], b[0], f), lerp(a[1], b[1], f)];

// ---------- hall projection (near-frontal oblique fitted to the painting) ----------
export const HP = (x, y, z = 0) => [448 + 25.5 * x + 4 * y, 415 + 6.4 * x - 8.5 * y - 42.3 * z];
const H = (p) => HP(p[0], p[1], p[2]);

// a roof plane: E = eave points (local), T = top points (local, same count or 2 ends)
function plane(c, E, T, col, o = {}) {
  const e = E.map(H), tt = T.length === E.length ? T.map(H) : E.map((_, i) => L2(H(T[0]), H(T[T.length - 1]), i / (E.length - 1)));
  const polyPts = [...e, ...[...tt].reverse()];
  const mid = Math.floor(e.length / 2);
  const g = c.createLinearGradient(tt[mid][0], tt[mid][1], e[mid][0], e[mid][1]);
  g.addColorStop(0, shade(col, (o.shd ?? 0) + 0.1)); g.addColorStop(1, shade(col, (o.shd ?? 0) - 0.06));
  poly(c, polyPts, g, 0);
  c.save(); pl(c, polyPts); c.clip();
  // copper seams eave->ridge
  c.strokeStyle = "rgba(38,62,50,0.42)"; c.lineWidth = 0.75; c.beginPath();
  const n = o.ribs ?? 30;
  for (let i = 1; i < n; i++) { const f = i / n, ei = f * (e.length - 1), i0 = Math.floor(ei), fr = ei - i0; const a = L2(e[i0], e[Math.min(e.length - 1, i0 + 1)], fr), b = L2(tt[i0], tt[Math.min(tt.length - 1, i0 + 1)], fr); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
  c.stroke();
  // courses (lighter) parallel to the eave
  c.strokeStyle = "rgba(230,245,232,0.28)"; c.lineWidth = 0.7; c.beginPath();
  const m = o.courses ?? 7;
  for (let j = 1; j < m; j++) { const f = j / m; e.forEach((p, i) => { const q = L2(p, tt[i], f); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); }
  c.stroke();
  // patina dabs
  const R = rng(o.seed ?? 7); c.fillStyle = "rgba(200,225,205,0.25)";
  for (let i = 0; i < (o.dabs ?? 10); i++) { const f = R(), ii = Math.floor(R() * e.length); const q = L2(e[ii], tt[ii], f); c.beginPath(); c.ellipse(q[0], q[1], 3 + R() * 5, 1.2 + R() * 1.5, 0, 0, TAU); c.fill(); }
  c.restore();
  poly(c, polyPts, null, o.lw ?? 1.3);
  return { e, tt };
}
// eave polyline with turned-up corners
function eave(x0, y0, x1, y1, z, lift, n = 16) { const out = []; for (let i = 0; i <= n; i++) { const s = i / n; out.push([lerp(x0, x1, s), lerp(y0, y1, s), z + lift * Math.pow(Math.abs(2 * s - 1), 2.6)]); } return out; }
// fascia board + gold studs under an eave, and a dark rafter band beneath it
function fascia(c, E, o = {}) {
  const raft = E.map((p) => H([p[0], p[1] + (o.inset ?? 0.18), p[2] - 0.08])), raftB = E.map((p) => H([p[0], p[1] + (o.inset ?? 0.18), p[2] - (o.raft ?? 0.24)]));
  if (o.rafters !== false) {
    poly(c, [...raft, ...[...raftB].reverse()], "#4a3524", 0.9);
    c.strokeStyle = "rgba(220,170,110,0.55)"; c.lineWidth = 1; c.beginPath();
    for (let i = 0; i < raft.length * 3; i++) { const f = i / (raft.length * 3), k = f * (raft.length - 1), i0 = Math.floor(k); const a = L2(raft[i0], raft[Math.min(raft.length - 1, i0 + 1)], k - i0), b = L2(raftB[i0], raftB[Math.min(raftB.length - 1, i0 + 1)], k - i0); c.moveTo(a[0], a[1] + 1); c.lineTo(b[0], b[1] - 1); }
    c.stroke();
  }
  const top = E.map(H), bot = E.map((p) => H([p[0], p[1], p[2] - (o.h ?? 0.1)]));
  poly(c, [...top, ...[...bot].reverse()], o.col || "#6f9480", 0.9);
  c.strokeStyle = GOLD; c.lineWidth = 1.1; c.beginPath(); bot.forEach((p, i) => (i ? c.lineTo(p[0], p[1] - 1) : c.moveTo(p[0], p[1] - 1))); c.stroke();
  c.fillStyle = GOLD;
  const nb = o.studs ?? E.length * 2;
  for (let i = 0; i <= nb; i++) { const k = (i / nb) * (top.length - 1), i0 = Math.floor(k); const a = L2(L2(top[i0], bot[i0], 0.5), L2(top[Math.min(top.length - 1, i0 + 1)], bot[Math.min(bot.length - 1, i0 + 1)], 0.5), k - i0); c.beginPath(); c.arc(a[0], a[1], 1.3, 0, TAU); c.fill(); }
}
function cap(c, A, B, w, col = "#b8d0bd") { c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = w + 2; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke(); c.strokeStyle = "rgba(255,255,255,0.45)"; c.lineWidth = 1; c.beginPath(); c.moveTo(A[0], A[1] - w * 0.25); c.lineTo(B[0], B[1] - w * 0.25); c.stroke(); }
export function curl(c, x, y, s = 1, flip = 1) {
  c.beginPath(); c.moveTo(x - 2 * s * flip, y + 2 * s); c.quadraticCurveTo(x - 1 * s * flip, y - 6 * s, x + 4 * s * flip, y - 9 * s); c.quadraticCurveTo(x + 8 * s * flip, y - 10 * s, x + 7 * s * flip, y - 6 * s); c.quadraticCurveTo(x + 4 * s * flip, y - 7 * s, x + 3 * s * flip, y - 4 * s); c.quadraticCurveTo(x + 3 * s * flip, y, x + 3 * s * flip, y + 2 * s); c.closePath();
  c.fillStyle = GOLD; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
  c.fillStyle = GOLD_L; c.beginPath(); c.arc(x + 5 * s * flip, y - 7.5 * s, 1.1 * s, 0, TAU); c.fill();
}
function stud(c, x, y, r = 2.4) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = GOLD; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke(); c.fillStyle = GOLD_L; c.beginPath(); c.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, TAU); c.fill(); }

// hip roof in hall coords: eave rect x0..x1 / y0..y1 (already incl. overhang), ridge z zr
function hipRoof(c, x0, x1, y0, y1, ze, zr, o = {}) {
  const lift = o.lift ?? 0.35, hi = o.hipIn ?? (y1 - y0) / 2, ym = (y0 + y1) / 2;
  const R0 = [x0 + hi, ym, zr], R1 = [x1 - hi, ym, zr];
  const Ef = eave(x0, y0, x1, y0, ze, lift, 22);
  const El = eave(x0, y1, x0, y0, ze, lift, 8), Er = eave(x1, y0, x1, y1, ze, lift, 8);
  if (o.fasciaEnds !== false) { fascia(c, El, { rafters: false, studs: 6 }); fascia(c, Er, { rafters: false, studs: 6 }); }
  plane(c, El, [R0, R0], col(o), { shd: -0.12, ribs: 12, seed: 3, dabs: 3 });
  plane(c, Er, [R1, R1], col(o), { shd: -0.2, ribs: 12, seed: 4, dabs: 3 });
  fascia(c, Ef, { raft: o.raft ?? 0.24 });
  plane(c, Ef, [R0, R1], col(o), { shd: 0, ribs: o.ribs ?? 34, seed: 5, courses: o.courses ?? 8, dabs: 14 });
  cap(c, H(R0), H(R1), 4.2); cap(c, H(Ef[0]), H(R0), 2.8); cap(c, H(Ef[Ef.length - 1]), H(R1), 2.8);
  if (o.orn !== false) { const a = H(R0), b = H(R1); curl(c, a[0] - 1, a[1] - 1, o.ornS ?? 1.1, -1); curl(c, b[0] + 1, b[1] - 1, o.ornS ?? 1.1, 1); for (let i = 1; i < 6; i++) { const q = L2(a, b, i / 6); stud(c, q[0], q[1] - 2.5, 1.6); } }
  return { Ef, R0, R1 };
}
const col = (o) => o.col || COP;

// ---------- the honden ----------
export function drawHall(k, t) { place(k.ctx, 600, 435, () => drawHall0(k, t)); }
function drawHall0(k, t) {
  const c = k.ctx;
  // back-left side hall roof (peeks out behind on the left)
  hipRoof(c, -1.6, 2.6, 2.2, 6.4, 2.05, 2.85, { lift: 0.25, hipIn: 1.2, ornS: 0.9, ribs: 18 });
  // upper main roof (big hip, ridge with gold curls)
  hipRoof(c, 1.0, 9.6, 0.6, 6.4, 2.3, 3.3, { lift: 0.42, hipIn: 1.5, ornS: 1.0, ribs: 44, courses: 9 });
  chidori(c, 6.3, 1.0, 3.6, 2.45, 3.25, 1.45, t, true);
  // right wing (set back): body then roof
  const wy = 1.6;
  poly(c, [HP(6.9, wy - 0.5, 0), HP(13.1, wy - 0.5, 0), HP(13.1, wy - 0.5, 0.32), HP(6.9, wy - 0.5, 0.32)], "#cfc6b2", 1);
  poly(c, [HP(6.9, wy - 0.5, 0.32), HP(13.1, wy - 0.5, 0.32), HP(13.1, wy + 0.8, 0.32), HP(6.9, wy + 0.8, 0.32)], "#e3dccb", 1);
  wallBays(c, 6.95, 13.0, wy + 0.6, 0.32, 1.28, 7, t);
  for (let i = 0; i <= 7; i++) column(c, 7.0 + i * 0.86, wy, 0.32, 1.32, 0.9);
  beams(c, 6.85, 13.15, wy, 1.22, 1.5, 14);
  hipRoof(c, 6.5, 13.6, wy - 0.85, wy + 2.4, 1.48, 2.25, { lift: 0.3, hipIn: 1.2, ornS: 0.9, ribs: 34, orn: false });

  // main body: stone platform, veranda, latticed walls, sanctum, columns
  poly(c, [HP(-1.3, -0.5, 0), HP(7.3, -0.5, 0), HP(7.3, -0.5, 0.35), HP(-1.3, -0.5, 0.35)], "#cbc2ae", 1);
  c.strokeStyle = "rgba(90,80,60,0.35)"; c.lineWidth = 0.7; c.beginPath(); for (let x = -1.3; x < 7.3; x += 0.55) { const a = HP(x, -0.5, 0), b = HP(x, -0.5, 0.35); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } { const a = HP(-1.3, -0.5, 0.17), b = HP(7.3, -0.5, 0.17); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } c.stroke();
  poly(c, [HP(-1.3, -0.5, 0.35), HP(7.3, -0.5, 0.35), HP(7.3, 0.9, 0.35), HP(-1.3, 0.9, 0.35)], "#e8e1cf", 1);
  // veranda planks
  c.strokeStyle = "rgba(120,100,70,0.25)"; c.lineWidth = 0.6; c.beginPath(); for (let y = -0.3; y < 0.9; y += 0.22) { const a = HP(-1.2, y, 0.35), b = HP(7.2, y, 0.35); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } c.stroke();
  wallBays(c, -1.2, 7.2, 0.75, 0.35, 1.3, 9, t, true);
  // offering box (saisen-bako) in the central bay
  saisen(c, 3.15, 0.05);
  for (let i = 0; i <= 8; i++) column(c, -1.15 + i * 1.04, 0, 0.35, 1.33, 1);
  beams(c, -1.4, 7.4, 0, 1.24, 1.52, 9);
  // front skirt roof (hisashi) spanning the facade
  const top = eave(-1.5, 0.95, 8.1, 0.95, 2.02, 0, 22), Ef = eave(-1.9, -1.05, 8.5, -1.05, 1.5, 0.3, 22);
  const El = eave(-1.9, 0.95, -1.9, -1.05, 1.5, 0, 6);
  fascia(c, El, { rafters: false, studs: 5 });
  plane(c, El, [[-1.5, 0.95, 2.02], [-1.5, 0.95, 2.02]], COP, { shd: -0.12, ribs: 8, dabs: 2 });
  fascia(c, Ef, { raft: 0.22 });
  plane(c, Ef, top, COP, { ribs: 46, courses: 6, seed: 9, dabs: 16 });
  cap(c, H(Ef[0]), H(top[0]), 2.6);
  // chidori gable over the entrance (front-facing triangle with gold crest)
  chidori(c, 4.0, -0.9, 3.0, 1.55, 2.78, 2.25, t);
  // stairs down to the forecourt
  stairs(c, 0.2, 6.9, -0.5, -3.7, 0.35, 8);
}

function column(c, x, y, z0, z1, s = 1) {
  const a = HP(x, y, z0), b = HP(x, y, z1), w = 4.1 * s;
  const g = c.createLinearGradient(a[0] - w, 0, a[0] + w, 0); g.addColorStop(0, WOOD_L); g.addColorStop(0.45, WOOD); g.addColorStop(1, WOOD_D);
  poly(c, [[a[0] - w, a[1]], [b[0] - w, b[1]], [b[0] + w, b[1]], [a[0] + w, a[1]]], g, 1);
  // stone base + gold cap band
  poly(c, [[a[0] - w - 1.6, a[1] + 1], [a[0] - w - 1, a[1] - 3], [a[0] + w + 1, a[1] - 3], [a[0] + w + 1.6, a[1] + 1]], "#d9d1bf", 0.8);
  poly(c, [[b[0] - w - 0.5, b[1] + 6], [b[0] + w + 0.5, b[1] + 6], [b[0] + w + 0.5, b[1] + 3], [b[0] - w - 0.5, b[1] + 3]], GOLD, 0.7);
}
function beams(c, x0, x1, y, z0, z1, n) {
  const zm = lerp(z0, z1, 0.42);
  poly(c, [HP(x0, y, z0), HP(x1, y, z0), HP(x1, y, zm), HP(x0, y, zm)], WOOD, 1);
  // bracket band (kumimono): dark with light block rhythm and gold studs
  poly(c, [HP(x0, y + 0.1, zm), HP(x1, y + 0.1, zm), HP(x1, y + 0.1, z1), HP(x0, y + 0.1, z1)], "#5a3e28", 1);
  c.fillStyle = "#d9b27c"; c.strokeStyle = INK; c.lineWidth = 0.6;
  const m = Math.round((x1 - x0) * 3.2);
  for (let i = 0; i <= m; i++) { const x = lerp(x0 + 0.1, x1 - 0.1, i / m), p = HP(x, y + 0.1, lerp(zm, z1, 0.55)); c.fillRect(p[0] - 2.4, p[1] - 2.6, 4.8, 4.2); c.strokeRect(p[0] - 2.4, p[1] - 2.6, 4.8, 4.2); }
  for (let i = 0; i <= n; i++) { const p = HP(lerp(x0 + 0.25, x1 - 0.25, i / n), y, lerp(z0, zm, 0.5)); stud(c, p[0], p[1], 1.7); }
}
function wallBays(c, x0, x1, y, z0, z1, n, t, sanctum) {
  for (let i = 0; i < n; i++) {
    const a = lerp(x0, x1, i / n), b = lerp(x0, x1, (i + 1) / n), mid = sanctum && (i === Math.floor(n / 2) || i === Math.floor(n / 2) - 1 + (n % 2 ? 1 : 0));
    const q = [HP(a, y, z0), HP(b, y, z0), HP(b, y, z1), HP(a, y, z1)];
    if (sanctum && i === Math.floor(n / 2)) {
      poly(c, q, "#1f160f", 0.9);
      // white curtain (tobari) with the kiku crest, swaying gently
      const sw = Math.sin(t * 0.9) * 0.6, top = HP(a, y, z1), tr = HP(b, y, z1), bl = HP(a, y, z1 - 0.32);
      poly(c, [top, tr, [tr[0] + sw, tr[1] + (bl[1] - top[1])], [bl[0] + sw, bl[1]]], "#f6f1e4", 0.8);
      const cc = L2(L2(top, tr, 0.5), L2(bl, [tr[0], tr[1] + (bl[1] - top[1])], 0.5), 0.5); kiku(c, cc[0] + sw, cc[1], 3.6, "#6b4c8a");
      // hanging lantern glow inside
      const g = c.createRadialGradient(cc[0], cc[1] + 14, 0, cc[0], cc[1] + 14, 14); g.addColorStop(0, "rgba(255,200,110,0.55)"); g.addColorStop(1, "rgba(255,200,110,0)"); c.fillStyle = g; c.beginPath(); c.arc(cc[0], cc[1] + 14, 14, 0, TAU); c.fill();
      if (c.__ns?.n) { nightGlow(c, cc[0], cc[1] + 8, 52, "#ffbc60", 0.85); nightGlow(c, cc[0], cc[1] + 40, 70, "#ffc880", 0.3); }
      continue;
    }
    poly(c, q, "#7a5434", 0.9);
    // shitomi lattice
    c.save(); pl(c, q); c.clip(); c.strokeStyle = "rgba(240,205,150,0.55)"; c.lineWidth = 0.7; c.beginPath();
    for (let j = 1; j < 6; j++) { const p0 = L2(q[0], q[1], j / 6), p1 = L2(q[3], q[2], j / 6); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); }
    for (let j = 1; j < 7; j++) { const p0 = L2(q[0], q[3], j / 7), p1 = L2(q[1], q[2], j / 7); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); }
    c.stroke(); c.fillStyle = "rgba(30,18,10,0.25)"; const m = L2(q[0], q[3], 0.5), m2 = L2(q[1], q[2], 0.5); c.fillRect(Math.min(m[0], m2[0]), Math.min(m[1], m2[1]) - 1, Math.abs(m2[0] - m[0]), 3); c.restore();
  }
}
export function kiku(c, x, y, r, colr = GOLD) {
  c.fillStyle = colr; c.strokeStyle = INK; c.lineWidth = 0.6;
  for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; c.beginPath(); c.ellipse(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.42, r * 0.16, a, 0, TAU); c.fill(); }
  c.beginPath(); c.arc(x, y, r * 0.38, 0, TAU); c.fill(); c.stroke();
}
function saisen(c, x, y) {
  const z0 = 0.35, w = 1.25, d = 0.45, h = 0.42;
  poly(c, [HP(x, y, z0), HP(x + w, y, z0), HP(x + w, y, z0 + h), HP(x, y, z0 + h)], "#9a6a3a", 1);
  poly(c, [HP(x, y, z0 + h), HP(x + w, y, z0 + h), HP(x + w, y + d, z0 + h), HP(x, y + d, z0 + h)], "#6a4526", 1);
  c.strokeStyle = "rgba(255,220,160,0.6)"; c.lineWidth = 0.8; c.beginPath(); for (let i = 1; i < 8; i++) { const a = HP(x + (w * i) / 8, y, z0 + h), b = HP(x + (w * i) / 8, y + d, z0 + h); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } c.stroke();
  const m = HP(x + w / 2, y, z0 + h * 0.55); kiku(c, m[0], m[1], 3.2);
  for (const f of [0.08, 0.92]) { const p = HP(x + w * f, y, z0 + h * 0.85); stud(c, p[0], p[1], 1.3); }
}
function chidori(c, xc, yF, yB, ze, zr, w, t, small) {
  const over = 0.35;
  const El = eave(xc - w - over, yB, xc - w - over, yF - over, ze, 0, 10), Er = eave(xc + w + over, yF - over, xc + w + over, yB, ze, 0, 10);
  // the two slopes rise to the ridge; front eave tips curl up (karahafu-like sweep)
  El[El.length - 1][2] += 0.28; El[El.length - 2][2] += 0.12; Er[0][2] += 0.28; Er[1][2] += 0.12;
  const Rf = [xc, yF - over, zr], Rb = [xc, yB, zr];
  fascia(c, El, { rafters: false, studs: 8 }); fascia(c, Er, { rafters: false, studs: 8 });
  plane(c, El, [Rb, Rf], COP, { shd: -0.02, ribs: 22, seed: 11, courses: 7, dabs: 8 });
  plane(c, Er, [Rf, Rb], COP, { shd: -0.16, ribs: 22, seed: 12, courses: 7, dabs: 8 });
  // pediment (tsumakazari): wooden board, gold fittings and the crest
  const A = HP(xc - w + 0.25, yF, ze + 0.15), B = HP(xc, yF, zr - 0.2), Cc = HP(xc + w - 0.25, yF, ze + 0.15);
  poly(c, [A, B, Cc], "#9c6a3e", 1);
  c.save(); pl(c, [A, B, Cc]); c.clip(); c.strokeStyle = "rgba(60,30,14,0.45)"; c.lineWidth = 0.8; c.beginPath(); for (let i = 1; i < 12; i++) { const x = lerp(A[0], Cc[0], i / 12); c.moveTo(x, A[1] - 60); c.lineTo(x, Cc[1] + 4); } c.stroke();
  // horizontal tie beam + struts in gold
  const m1 = L2(A, Cc, 0), m2 = L2(A, Cc, 1); c.strokeStyle = GOLD; c.lineWidth = 2; c.beginPath(); c.moveTo(m1[0], m1[1] - 9); c.lineTo(m2[0], m2[1] - 9); c.stroke(); c.restore();
  const cr = L2(L2(A, Cc, 0.5), B, 0.45); kiku(c, cr[0], cr[1], small ? 4.5 : 7);
  stud(c, cr[0] - 16, cr[1] + 9, 1.8); stud(c, cr[0] + 16, cr[1] + 9, 1.8);
  // bargeboards: curved copper boards with gold rims and gegyo pendant
  const bargeL = [HP(xc - w - over, yF - over, ze + 0.3), HP(xc - w * 0.45, yF - over, ze + 1.25), HP(xc, yF - over, zr + 0.06)];
  const bargeR = [HP(xc + w + over, yF - over, ze + 0.3), HP(xc + w * 0.45, yF - over, ze + 1.25), HP(xc, yF - over, zr + 0.06)];
  for (const bb of [bargeL, bargeR]) {
    c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 7.5; c.beginPath(); c.moveTo(bb[0][0], bb[0][1]); c.quadraticCurveTo(bb[1][0], bb[1][1] + 4, bb[2][0], bb[2][1]); c.stroke();
    c.strokeStyle = "#6f9480"; c.lineWidth = 5.4; c.stroke();
    c.strokeStyle = GOLD; c.lineWidth = 1.4; c.beginPath(); c.moveTo(bb[0][0], bb[0][1] + 2.2); c.quadraticCurveTo(bb[1][0], bb[1][1] + 6.2, bb[2][0], bb[2][1] + 2.2); c.stroke();
    for (let i = 1; i < 6; i++) { const f = i / 6, p = L2(L2(bb[0], [bb[1][0], bb[1][1] + 4], f), L2([bb[1][0], bb[1][1] + 4], bb[2], f), f); stud(c, p[0], p[1], 1.4); }
  }
  const apex = HP(xc, yF - over, zr + 0.06);
  poly(c, [[apex[0] - 6, apex[1] + 2], [apex[0] + 6, apex[1] + 2], [apex[0] + 4, apex[1] + 13], [apex[0], apex[1] + 17], [apex[0] - 4, apex[1] + 13]], GOLD, 1);
  cap(c, HP(...Rf), HP(...Rb), 4.4);
  curl(c, apex[0] - 1, apex[1] - 1, 0.75, -1); curl(c, apex[0] + 1, apex[1] - 1, 0.75, 1);
}
function stairs(c, x0, x1, yTop, yBot, zTop, n) {
  for (let i = n - 1; i >= 0; i--) {
    const y0 = lerp(yTop, yBot, i / n), y1 = lerp(yTop, yBot, (i + 1) / n), z = zTop * (1 - i / n), z1 = zTop * (1 - (i + 1) / n);
    poly(c, [HP(x0, y1, z1), HP(x1, y1, z1), HP(x1, y1, z), HP(x0, y1, z)], i % 2 ? "#d6cebb" : "#d0c8b4", 0.8);
    poly(c, [HP(x0, y1, z), HP(x1, y1, z), HP(x1, y0, z), HP(x0, y0, z)], "#ece6d6", 0.8);
  }
  // side stringers
  for (const x of [x0, x1]) poly(c, [HP(x - 0.18, yTop, zTop + 0.06), HP(x + 0.18, yTop, zTop + 0.06), HP(x + 0.18, yBot, 0.06), HP(x - 0.18, yBot, 0.06)], "#c4bba6", 0.9);
}

// ---------- forest ----------
// a cedar spray: union of small round lobes, ink rim, fill, highlight + scallop marks
function spray(c, x, y, r, colr, seed, lw = 1.4) {
  const R = rng(seed), n = 5 + Math.floor(R() * 3), pts = [[x, y, r * 0.72]];
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU + R() * 0.5; pts.push([x + Math.cos(a) * r * 0.72, y + Math.sin(a) * r * 0.5, r * (0.36 + R() * 0.16)]); }
  const all = () => { c.beginPath(); for (const [px, py, pr] of pts) { c.moveTo(px + pr, py); c.arc(px, py, pr, 0, TAU); } };
  all(); c.strokeStyle = INK; c.lineWidth = lw * 2; c.stroke();
  all(); c.fillStyle = colr; c.fill();
  return pts;
}
const PAL = { deep: "#2a3f2a", dark: "#3b5531", mid: "#536e30", mid2: "#718a34", lite: "#a2ac3c", sun: "#d3c64c" };
function tuftDetail(c, pts, colr, R) {
  c.save(); c.beginPath(); for (const [px, py, pr] of pts) { c.moveTo(px + pr, py); c.arc(px, py, pr, 0, TAU); } c.clip();
  const [x, y, r] = pts[0];
  c.fillStyle = shade(colr, 0.16); c.beginPath(); c.arc(x - r * 0.35, y - r * 0.35, r * 0.55, 0, TAU); c.fill();
  c.fillStyle = shade(colr, -0.2); c.beginPath(); c.arc(x + r * 0.4, y + r * 0.55, r * 0.7, 0, TAU); c.fill();
  c.strokeStyle = shade(colr, -0.42); c.lineWidth = 0.8; c.beginPath();
  for (let i = 0; i < 3; i++) { const ax = x + (R() - 0.5) * r * 1.6, ay = y + (R() - 0.4) * r, a0 = 0.3 + R() * 0.5; c.moveTo(ax + Math.cos(a0) * 2, ay + Math.sin(a0) * 2); c.arc(ax, ay, 2, a0, a0 + 2.2); }
  c.stroke(); c.restore();
}
const treeCache = new Map();
// foliage pad: a flattened cluster of small leaf scallops; dark underside, mid body, sunlit top edge
export function pad(c, x, y, w, h, pal, seed, lw = 1.5) {
  const R = rng(seed), n = Math.max(6, Math.round((w * h) / 34)), cs = [];
  for (let i = 0; i < n; i++) { const a = R() * TAU, d = Math.sqrt(R()); cs.push([x + Math.cos(a) * d * w * 0.5, y + Math.sin(a) * d * h * 0.5, 4.2 + R() * 2.8]); }
  // fringe of small scallops on the rim for a feathery cedar edge
  const m = Math.round(w / 6);
  for (let i = 0; i < m; i++) { const a = Math.PI * (0.95 + (i / (m - 1)) * 1.1) + (R() - 0.5) * 0.2; cs.push([x + Math.cos(a) * w * 0.5, y + Math.sin(a) * h * 0.5 + 1, 3.4 + R() * 1.6]); }
  const path = (list, dy = 0, k = 1) => { c.beginPath(); for (const [px, py, pr] of list) { c.moveTo(px + pr * k, py + dy); c.arc(px, py + dy, pr * k, 0, TAU); } };
  path(cs); c.strokeStyle = INK; c.lineWidth = lw * 2; c.stroke();
  path(cs); c.fillStyle = pal[0]; c.fill();
  const up = cs.filter((q) => q[1] < y + h * 0.18), top = cs.filter((q) => q[1] < y - h * 0.12);
  path(up, -1.6, 0.86); c.fillStyle = pal[1]; c.fill();
  path(top, -2.8, 0.7); c.fillStyle = pal[2]; c.fill();
  // leaf ticks
  c.strokeStyle = shade(pal[0], -0.35); c.lineWidth = 0.7; c.beginPath();
  for (let i = 0; i < n / 2; i++) { const q = cs[Math.floor(R() * cs.length)]; const a0 = 0.3 + R() * 0.6; c.moveTo(q[0] + Math.cos(a0) * 2.2, q[1] + Math.sin(a0) * 2.2); c.arc(q[0], q[1], 2.2, a0, a0 + 2); }
  c.stroke();
}
const PADS = {
  low: [PAL.dark, PAL.mid, PAL.mid2], mid: [PAL.mid, PAL.mid2, PAL.lite], high: [PAL.mid, PAL.lite, PAL.sun], shade: [PAL.deep, PAL.dark, PAL.mid],
};
function treeLayout(T) {
  const key = T.seed; if (treeCache.has(key)) return treeCache.get(key);
  const R = rng(T.seed * 97 + 13), pads = [], branches = [];
  const h = T.yb - T.yt, lean = T.lean ?? 0, tx = (y) => T.x + lean * (T.yb - y);
  if (T.kind === "sugi") {
    const span = h * (T.crown ?? 0.62), tiers = Math.max(4, Math.round(span / 18));
    for (let i = 0; i < tiers; i++) {
      const f = i / (tiers - 1), ty = T.yt + 6 + f * span, reach = T.R * (0.22 + 0.78 * Math.pow(f, 0.7)) * (0.8 + R() * 0.4);
      const sides = f < 0.12 ? [0] : R() < 0.6 ? [-1, 1] : [i % 2 ? 1 : -1, 0];
      for (const sd of sides) {
        const px = tx(ty) + sd * reach * (0.6 + R() * 0.3), pw = 16 + reach * 0.6 + R() * 10, ph = 8 + pw * 0.22;
        const tone = f < 0.45 ? "high" : f < 0.75 ? (R() < 0.55 ? "high" : "mid") : R() < 0.5 ? "mid" : "low";
        pads.push({ x: px, y: ty, w: pw, h: ph, tone, seed: T.seed * 131 + i * 7 + (sd + 1), f });
        if (sd) branches.push([tx(ty + 14), ty + 14, px - sd * pw * 0.15, ty + 1]);
      }
    }
  } else {
    const cy = T.yt + T.R * 0.7, n = Math.max(5, Math.round(T.R / 7));
    for (let i = 0; i < n; i++) {
      const a = Math.PI * (1.05 + (i / (n - 1)) * 0.9) + (R() - 0.5) * 0.3, d = 0.35 + R() * 0.6, px = T.x + Math.cos(a) * T.R * d, py = cy + Math.sin(a) * T.R * 0.75 * d + T.R * 0.2;
      const pw = T.R * (0.7 + R() * 0.4), ph = pw * 0.42, f = (py - T.yt) / (T.R * 1.6);
      pads.push({ x: px, y: py, w: pw, h: ph, tone: f < 0.45 ? "high" : "mid", seed: T.seed * 131 + i * 7, f });
      branches.push([T.x, cy + T.R * 0.6, px, py + 3]);
    }
    pads.push({ x: T.x, y: cy + T.R * 0.25, w: T.R * 1.1, h: T.R * 0.45, tone: "low", seed: T.seed * 131 + 99, f: 0.9 });
    pads.sort((a, b) => a.y - b.y);
  }
  const lay = { pads, branches };
  treeCache.set(key, lay); return lay;
}
function trunk(c, T) {
  const top = T.yt + (T.kind === "sugi" ? 6 : T.R * 0.9), w0 = T.w / 2, w1 = Math.max(2.5, T.w * 0.24), lean = T.lean ?? 0, h = T.yb - top;
  const xt = T.x + lean * h;
  const pts = [[T.x - w0 * 1.25, T.yb], [T.x - w0, T.yb - 8], [xt - w1, top], [xt + w1, top], [T.x + w0, T.yb - 8], [T.x + w0 * 1.25, T.yb]];
  const g = c.createLinearGradient(T.x - w0, 0, T.x + w0, 0); g.addColorStop(0, "#c98552"); g.addColorStop(0.35, "#a8623a"); g.addColorStop(1, "#5e3420");
  poly(c, pts, g, 1.5);
  c.save(); pl(c, pts); c.clip(); c.strokeStyle = "rgba(55,26,12,0.45)"; c.lineWidth = 0.9; c.beginPath();
  for (let i = -3; i <= 3; i++) { const R = rng(T.seed + i * 7); c.moveTo(T.x + i * w0 * 0.3, T.yb); let px = T.x + i * w0 * 0.3; for (let y = T.yb; y > top; y -= 14) { px = lerp(T.x + i * w0 * 0.3, xt + i * w1 * 0.3, (T.yb - y) / h) + (R() - 0.5) * 1.6; c.lineTo(px, y); } }
  c.stroke(); c.strokeStyle = "rgba(255,210,160,0.35)"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(T.x - w0 * 0.55, T.yb - 6); c.lineTo(xt - w1 * 0.5, top); c.stroke(); c.restore();
  // branch stubs reaching into the tiers
  if (T.kind === "sugi") { const R = rng(T.seed * 3); c.lineCap = "round"; for (let i = 0; i < 4; i++) { const y = top + 18 + i * (h * (T.crown ?? 0.55) - 18) / 4, x = lerp(xt, T.x, (y - top) / h), s = i % 2 ? 1 : -1, L = 10 + R() * 12; c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x + s * L, y - 6); c.stroke(); c.strokeStyle = "#8a4f2e"; c.lineWidth = 1.6; c.stroke(); } }
  else { c.lineCap = "round"; for (const s of [-1, 1]) { const x = xt, y = top + 4; c.strokeStyle = INK; c.lineWidth = 4.4; c.beginPath(); c.moveTo(x, y + 10); c.quadraticCurveTo(x + s * 6, y, x + s * T.R * 0.45, y - T.R * 0.3); c.stroke(); c.strokeStyle = "#8a4f2e"; c.lineWidth = 2.4; c.stroke(); } }
  // root flare + moss
  c.fillStyle = "rgba(60,45,30,0.18)"; c.beginPath(); c.ellipse(T.x + 6, T.yb + 1, T.w * 1.2, T.w * 0.35, 0, 0, TAU); c.fill();
  c.fillStyle = "rgba(120,150,60,0.7)"; for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(T.x + (hash(T.seed + i) - 0.5) * T.w, T.yb - 3 - hash(T.seed * 2 + i) * 10, 3, 1.6, 0, 0, TAU); c.fill(); }
}
function paletteFor(light, dim) {
  const L = light - (dim || 0);
  return L > 0.9 ? PAL.sun : L > 0.5 ? PAL.lite : L > 0.1 ? PAL.mid2 : L > -0.35 ? PAL.mid : PAL.dark;
}
export function drawTree(k, t, T) { place(k.ctx, T.x, T.yb, () => drawTree0(k, t, T)); }
function drawTree0(k, t, T) {
  const c = k.ctx, lay = treeLayout(T);
  trunk(c, T);
  const sw = (T.sway ?? 1) * Math.sin(t * 0.8 + T.seed) * 1.5, sw2 = Math.sin(t * 1.7 + T.seed * 2) * 0.5;
  c.lineCap = "round";
  for (const [x0, y0, x1, y1] of lay.branches) { const dx = (sw + sw2) * 0.5; c.strokeStyle = INK; c.lineWidth = 3.8; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(lerp(x0, x1, 0.6), y0 + 1, x1 + dx, y1); c.stroke(); c.strokeStyle = "#94552f"; c.lineWidth = 2; c.stroke(); c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(lerp(x0, x1, 0.5), y0 - 1); c.lineTo(lerp(x0, x1, 0.7), y1 - 9); c.stroke(); }
  for (const p of lay.pads) {
    const dx = (sw + sw2) * (1 - p.f * 0.7), tone = T.dim ? (p.tone === "high" ? "mid" : p.tone === "mid" ? "low" : "shade") : p.tone;
    pad(c, p.x + dx, p.y, p.w, p.h, PADS[tone], p.seed, T.lw ?? 0.75);
  }
}
// the dark forest mass behind everything (scalloped silhouette traced from the painting)
const SIL = [[66, 640], [80, 479], [100, 455], [120, 397], [140, 372], [160, 338], [180, 330], [200, 317], [220, 330], [240, 280], [260, 264], [280, 238], [300, 234], [320, 229], [340, 209], [360, 190], [380, 185], [400, 174], [420, 151], [440, 139], [460, 129], [480, 120], [500, 103], [520, 94], [540, 107], [560, 124], [580, 136], [600, 150], [620, 166], [640, 165], [660, 187], [680, 202], [700, 232], [720, 229], [740, 233], [760, 244], [780, 265], [800, 285], [820, 311], [840, 324], [860, 339], [880, 385], [900, 403], [920, 418], [940, 480], [948, 560], [958, 655]];
export function drawForestMass(k, t) { const c = k.ctx; c.save(); pl(c, [[62, 0], [962, 0], [962, 665], [512, 924], [62, 665]]); c.clip(); c.transform(...AFF); drawForestMass0(k, t); c.restore(); }
function drawForestMass0(k, t) {
  const c = k.ctx, R = rng(41);
  const body = [...SIL.map(([x, y]) => [x, y + 14]), [962, 668], [512, 430], [62, 668]];
  const bumps = SIL.slice(1, -2).map(([x, y], i) => [x + (R() - 0.5) * 6, y + 16, 15 + R() * 8]);
  const all = () => { pl(c, body); for (const [x, y, r] of bumps) { c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); } };
  all(); c.strokeStyle = INK; c.lineWidth = 2.6; c.stroke(); all(); c.fillStyle = PAL.deep; c.fill();
  // textured inner foliage: dim sprays everywhere inside the silhouette (no outline wobble cost)
  c.save(); pl(c, body); for (const [x, y, r] of bumps) { c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); } c.clip();
  const sw = Math.sin(t * 0.6) * 1.0;
  for (let i = 0; i < 230; i++) {
    const x = 70 + R() * 880, y = 90 + R() * 560, s = R(), w = 26 + R() * 26;
    pad(c, x + sw * (1 - y / 700), y, w, w * 0.36, s < 0.5 ? PADS.shade : s < 0.85 ? PADS.low : PADS.mid, 900 + i, 0.6);
  }
  c.restore();
}
// trees: x (trunk), yb (ground), yt (crown top), w (trunk px), R (crown half-width), kind, seed, layer
export const TREES = [
  // layer 0: behind the hall, fills the crown of the silhouette
  { x: 405, yb: 360, yt: 175, w: 14, R: 58, kind: "sugi", seed: 1, layer: 0 },
  { x: 462, yb: 335, yt: 125, w: 16, R: 66, kind: "sugi", seed: 2, layer: 0 },
  { x: 530, yb: 300, yt: 96, w: 15, R: 70, kind: "sugi", seed: 3, layer: 0 },
  { x: 590, yb: 300, yt: 140, w: 12, R: 60, kind: "kusu", seed: 4, layer: 0 },
  { x: 632, yb: 300, yt: 168, w: 16, R: 58, kind: "sugi", seed: 5, layer: 0 },
  { x: 700, yb: 330, yt: 228, w: 13, R: 55, kind: "kusu", seed: 6, layer: 0 },
  { x: 345, yb: 380, yt: 212, w: 12, R: 52, kind: "sugi", seed: 7, layer: 0 },
  { x: 770, yb: 360, yt: 250, w: 12, R: 54, kind: "sugi", seed: 8, layer: 0 },
  { x: 225, yb: 470, yt: 300, w: 13, R: 56, kind: "sugi", seed: 41, layer: 0 },
  { x: 150, yb: 520, yt: 365, w: 12, R: 54, kind: "sugi", seed: 42, layer: 0 },
  { x: 100, yb: 560, yt: 440, w: 10, R: 44, kind: "kusu", seed: 43, layer: 0 },
  { x: 290, yb: 420, yt: 250, w: 12, R: 52, kind: "sugi", seed: 44, layer: 0 },
  { x: 830, yb: 470, yt: 300, w: 13, R: 54, kind: "sugi", seed: 45, layer: 0 },
  { x: 885, yb: 540, yt: 375, w: 12, R: 52, kind: "sugi", seed: 46, layer: 0 },
  { x: 935, yb: 590, yt: 460, w: 10, R: 40, kind: "kusu", seed: 47, layer: 0 },
  { x: 680, yb: 380, yt: 200, w: 12, R: 50, kind: "sugi", seed: 48, layer: 0 },
  { x: 560, yb: 330, yt: 120, w: 12, R: 52, kind: "sugi", seed: 49, layer: 0 },
  // layer 1: flanking the forecourt
  { x: 300, yb: 565, yt: 232, w: 17, R: 70, kind: "sugi", seed: 11, layer: 1 },
  { x: 372, yb: 610, yt: 186, w: 22, R: 60, kind: "sugi", seed: 12, layer: 1, crown: 0.4 },
  { x: 248, yb: 600, yt: 268, w: 12, R: 62, kind: "kusu", seed: 13, layer: 1 },
  { x: 418, yb: 565, yt: 405, w: 11, R: 40, kind: "kusu", seed: 14, layer: 1 },
  { x: 165, yb: 640, yt: 335, w: 12, R: 62, kind: "sugi", seed: 15, layer: 1 },
  { x: 752, yb: 565, yt: 228, w: 19, R: 52, kind: "sugi", seed: 16, layer: 1, crown: 0.3 },
  { x: 800, yb: 615, yt: 285, w: 12, R: 54, kind: "sugi", seed: 17, layer: 1, crown: 0.38 },
  { x: 700, yb: 548, yt: 492, w: 10, R: 30, kind: "kusu", seed: 18, layer: 1 },
  { x: 865, yb: 640, yt: 330, w: 16, R: 62, kind: "sugi", seed: 19, layer: 1 },
  { x: 905, yb: 652, yt: 405, w: 11, R: 50, kind: "kusu", seed: 20, layer: 1 },
  // understory camphor/sasakaki filling the band between the big trunks
  { x: 135, yb: 640, yt: 520, w: 9, R: 40, kind: "kusu", seed: 31, layer: 1 },
  { x: 268, yb: 585, yt: 470, w: 9, R: 38, kind: "kusu", seed: 32, layer: 1 },
  { x: 330, yb: 610, yt: 500, w: 9, R: 36, kind: "kusu", seed: 33, layer: 1 },
  { x: 205, yb: 610, yt: 490, w: 9, R: 40, kind: "kusu", seed: 34, layer: 1 },
  { x: 780, yb: 600, yt: 500, w: 9, R: 36, kind: "kusu", seed: 35, layer: 1 },
  { x: 845, yb: 625, yt: 505, w: 9, R: 40, kind: "kusu", seed: 36, layer: 1 },
  { x: 900, yb: 640, yt: 540, w: 9, R: 34, kind: "kusu", seed: 37, layer: 1 },
  { x: 725, yb: 595, yt: 510, w: 8, R: 32, kind: "kusu", seed: 38, layer: 1 },
  { x: 668, yb: 560, yt: 490, w: 8, R: 28, kind: "kusu", seed: 39, layer: 1 },
  // layer 2: big front trunks
  { x: 112, yb: 690, yt: 450, w: 12, R: 52, kind: "kusu", seed: 21, layer: 2 },
  { x: 192, yb: 708, yt: 325, w: 28, R: 82, kind: "sugi", seed: 22, layer: 2, crown: 0.5 },
  { x: 226, yb: 610, yt: 372, w: 15, R: 56, kind: "sugi", seed: 23, layer: 1 },
  { x: 828, yb: 708, yt: 300, w: 34, R: 86, kind: "sugi", seed: 24, layer: 2, crown: 0.5 },
  { x: 930, yb: 668, yt: 430, w: 11, R: 46, kind: "kusu", seed: 25, layer: 2 },
];

// ---------- great torii (unpainted hinoki), px billboard ----------
export const TORII = { lx: 413, rx: 543, ly: 757, ry: 762 };
export function drawTorii(k, t) { place(k.ctx, 478, 760, () => drawTorii0(k, t)); }
function drawTorii0(k, t) {
  const c = k.ctx, { lx, rx, ly, ry } = TORII;
  const woodGrad = (x0, x1) => { const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, "#e2ae74"); g.addColorStop(0.4, "#c98d55"); g.addColorStop(1, "#8e5a32"); return g; };
  const grain = (pts, vertical) => { c.save(); pl(c, pts); c.clip(); c.strokeStyle = "rgba(90,50,22,0.4)"; c.lineWidth = 0.8; c.beginPath(); const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys); const R = rng(Math.round(x0 + y0)); if (vertical) for (let x = x0 + 3; x < x1; x += 3.2) { c.moveTo(x, y1); c.bezierCurveTo(x + (R() - 0.5) * 3, y1 - (y1 - y0) * 0.3, x + (R() - 0.5) * 3, y0 + (y1 - y0) * 0.3, x + (R() - 0.5) * 2, y0); } else for (let y = y0 + 3; y < y1; y += 3) { c.moveTo(x0, y); c.bezierCurveTo(x0 + (x1 - x0) * 0.3, y + (R() - 0.5) * 2.5, x0 + (x1 - x0) * 0.7, y + (R() - 0.5) * 2.5, x1, y); } c.stroke(); c.restore(); };
  // shadows on the gravel
  c.fillStyle = "rgba(70,55,35,0.16)";
  for (const [x, y] of [[lx, ly], [rx, ry]]) { c.beginPath(); c.moveTo(x - 12, y); c.lineTo(x + 70, y + 22); c.lineTo(x + 76, y + 14); c.lineTo(x + 12, y - 4); c.closePath(); c.fill(); }
  // pillars (slight taper), base stones
  for (const [x, yb] of [[lx, ly], [rx, ry]]) {
    const top = 600, p = [[x - 13.5, yb - 4], [x - 11, top], [x + 11, top], [x + 13.5, yb - 4]];
    poly(c, p, woodGrad(x - 13, x + 13), 1.6); grain(p, true);
    c.strokeStyle = "rgba(255,230,190,0.5)"; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 7, yb - 8); c.lineTo(x - 6, top + 4); c.stroke();
    // kamebara base: copper ring + stone
    poly(c, [[x - 15, yb - 10], [x + 15, yb - 10], [x + 15, yb - 4], [x - 15, yb - 4]], "#6f8a6e", 1);
    c.beginPath(); c.ellipse(x, yb, 19, 7, 0, 0, TAU); c.fillStyle = "#d8d2c4"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
    c.beginPath(); c.ellipse(x, yb - 2, 16, 5, 0, Math.PI, TAU); c.strokeStyle = "rgba(255,255,255,0.6)"; c.lineWidth = 1; c.stroke();
  }
  // nuki (tie beam) passes through the pillars, with wedges
  const nk = [[378, 617], [584, 619], [584, 638], [378, 636]]; poly(c, nk, woodGrad(378, 584), 1.4); grain(nk, false);
  for (const x of [lx, rx]) { poly(c, [[x + 11, 619], [x + 17, 620], [x + 17, 635], [x + 11, 636]], "#9a6438", 1); }
  poly(c, [[378, 617], [384, 617], [384, 636], [378, 636]], "#b07546", 1); poly(c, [[578, 619], [584, 619], [584, 638], [578, 638]], "#8e5a32", 1);
  // gakuzuka (centre strut)
  poly(c, [[470, 600], [486, 600], [486, 618], [470, 618]], woodGrad(470, 486), 1.2);
  // shimaki + kasagi with upswept ends and copper cap
  const kb = [], kt = [];
  for (let i = 0; i <= 20; i++) { const s = i / 20, x = lerp(356, 600, s), up = Math.pow(Math.abs(2 * s - 1), 3) * 9; kb.push([x, 590 - up * 0.6 + (s - 0.5) * 4]); kt.push([x, 570 - up + (s - 0.5) * 4]); }
  const shim = [[366, 586], [590, 590], [590, 604], [366, 600]]; poly(c, shim, woodGrad(366, 590), 1.4); grain(shim, false);
  const kas = [...kt, ...[...kb].reverse()]; poly(c, kas, woodGrad(356, 600), 1.5); grain(kas, false);
  const capT = kt.map(([x, y]) => [x, y - 6]); poly(c, [...capT, ...[...kt].reverse()], "#9aa59a", 1.3);
  c.strokeStyle = "rgba(255,255,255,0.55)"; c.lineWidth = 1; c.beginPath(); capT.forEach(([x, y], i) => (i ? c.lineTo(x, y + 1.5) : c.moveTo(x, y + 1.5))); c.stroke();
  // end grain caps
  poly(c, [kt[0], [kt[0][0] - 3, kt[0][1] + 2], [kb[0][0] - 3, kb[0][1] - 1], kb[0]], "#a86f40", 1);
  // three gold chrysanthemum crests
  for (const x of [414, 478, 541]) { c.beginPath(); c.arc(x, 596, 8.5, 0, TAU); c.fillStyle = GOLD_D; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke(); kiku(c, x, 596, 7.4, GOLD); }
  // glint travelling along the kasagi cap
  const gx = 356 + ((t * 40) % 520); if (gx < 600) { const g = c.createRadialGradient(gx, 566, 0, gx, 566, 14); g.addColorStop(0, "rgba(255,255,240,0.55)"); g.addColorStop(1, "rgba(255,255,240,0)"); c.fillStyle = g; c.fillRect(gx - 14, 560, 28, 12); }
}

// ---------- sake barrel wall (kazaridaru) ----------
const BW = { TL: [236, 594], TR: [340, 549], BL: [236, 692], BR: [340, 652] };

export function drawBarrels(k, t) { place(k.ctx, 290, 700, () => drawBarrels0(k, t)); }
function drawBarrels0(k, t) {
  const c = k.ctx;
  // stone plinth (ishigaki): top, front
  const top = [[222, 694], [356, 643], [368, 650], [234, 702]];
  poly(c, top, "#d8d0bf", 1);
  const fr = [[222, 694], [234, 702], [234, 742], [222, 734]]; poly(c, fr, "#bdb4a1", 1);
  const face = [[234, 702], [368, 650], [368, 692], [234, 742]]; poly(c, face, "#cbc2ae", 1.2);
  c.save(); pl(c, face); c.clip(); c.strokeStyle = "rgba(80,70,55,0.55)"; c.lineWidth = 0.9; c.beginPath();
  for (let r = 0; r < 4; r++) { const f = r / 4; const a = L2([234, 702], [234, 742], f), b = L2([368, 650], [368, 692], f); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); for (let j = 0; j < 8; j++) { const s = (j + (r % 2) * 0.5) / 8, p = L2(a, b, s), q = L2(L2([234, 702], [234, 742], f + 0.25), L2([368, 650], [368, 692], f + 0.25), s); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); } }
  c.stroke(); c.fillStyle = "rgba(110,140,60,0.55)"; for (let i = 0; i < 10; i++) { const p = L2(L2([234, 742], [368, 692], hash(i * 3.1)), L2([234, 702], [368, 650], hash(i * 3.1)), hash(i * 7.7) * 0.4); c.beginPath(); c.ellipse(p[0], p[1], 5, 2.2, -0.36, 0, TAU); c.fill(); } c.restore();
  // back board + barrels drawn in the wall plane (affine)
  const { TL, TR, BL } = BW, w = 520, h = 490;
  c.save(); c.transform((TR[0] - TL[0]) / w, (TR[1] - TL[1]) / w, (BL[0] - TL[0]) / h, (BL[1] - TL[1]) / h, TL[0], TL[1]);
  c.fillStyle = "#4a3324"; c.fillRect(0, 0, w, h);
  const cols = 4, rows = 4, bw = w / cols, bh = h / rows;
  const LAB = [["#d94a3a", "#3f6fb0"], ["#3f6fb0", "#d94a3a"], ["#4f8f5a", "#e0a03a"], ["#e0a03a", "#4f8f5a"], ["#c9567a", "#3f6fb0"]];
  const TXT = ["菊正", "白鷹", "寿", "福禄", "大関", "鶴", "清酒", "祝", "松竹", "朝日"];
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
    const x = q * bw + 5, y = r * bh + 7, W = bw - 10, Hh = bh - 12, i = r * cols + q, [A, B] = LAB[(i * 3 + r) % LAB.length];
    // drum: bulging straw-wrapped barrel
    c.beginPath(); c.moveTo(x + 6, y); c.quadraticCurveTo(x + W / 2, y - 6, x + W - 6, y); c.quadraticCurveTo(x + W + 5, y + Hh / 2, x + W - 6, y + Hh); c.quadraticCurveTo(x + W / 2, y + Hh + 6, x + 6, y + Hh); c.quadraticCurveTo(x - 5, y + Hh / 2, x + 6, y); c.closePath();
    const g = c.createLinearGradient(x, 0, x + W, 0); g.addColorStop(0, "#f8eed6"); g.addColorStop(0.55, "#efe0bd"); g.addColorStop(1, "#cdb88e"); c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 5; c.stroke();
    c.save(); c.clip();
    // big painted crest: chrysanthemum / waves / fan
    const cx = x + W * 0.42, cy = y + Hh * 0.5, rr = Math.min(W, Hh) * 0.3, motif = (i * 7 + r) % 3;
    if (motif === 0) { c.fillStyle = A; for (let p = 0; p < 14; p++) { const a = (p / 14) * TAU; c.beginPath(); c.ellipse(cx + Math.cos(a) * rr * 0.55, cy + Math.sin(a) * rr * 0.55, rr * 0.45, rr * 0.16, a, 0, TAU); c.fill(); } c.fillStyle = "#f6e7b0"; c.beginPath(); c.arc(cx, cy, rr * 0.3, 0, TAU); c.fill(); }
    else if (motif === 1) { c.strokeStyle = A; c.lineWidth = 7; for (let j = 0; j < 3; j++) { c.beginPath(); c.arc(cx, cy + rr * 0.9, rr * (0.35 + j * 0.35), Math.PI * 1.1, Math.PI * 1.9); c.stroke(); } c.fillStyle = B; c.beginPath(); c.arc(cx + rr * 0.6, cy - rr * 0.55, rr * 0.28, 0, TAU); c.fill(); }
    else { c.fillStyle = A; c.beginPath(); c.moveTo(cx, cy + rr * 0.8); c.arc(cx, cy + rr * 0.8, rr * 1.3, Math.PI * 1.2, Math.PI * 1.8); c.closePath(); c.fill(); c.strokeStyle = "rgba(255,255,255,0.7)"; c.lineWidth = 3; for (let j = 0; j < 6; j++) { const a = Math.PI * (1.2 + j * 0.12); c.beginPath(); c.moveTo(cx, cy + rr * 0.8); c.lineTo(cx + Math.cos(a) * rr * 1.3, cy + rr * 0.8 + Math.sin(a) * rr * 1.3); c.stroke(); } }
    // vertical brewery text (black brush)
    c.fillStyle = "#231a14"; c.font = `bold ${Math.round(W * 0.2)}px ${FONT}`; c.textAlign = "center"; c.textBaseline = "middle";
    [...TXT[i % TXT.length]].forEach((ch, j, arr) => c.fillText(ch, x + W * 0.84, y + Hh * (0.3 + j * 0.42 / Math.max(1, arr.length - 1 || 1))));
    // straw rope bands
    c.strokeStyle = "#8a6a3a"; c.lineWidth = 7; for (const f of [0.1, 0.9]) { c.beginPath(); c.moveTo(x - 6, y + Hh * f); c.quadraticCurveTo(x + W / 2, y + Hh * f + (f < 0.5 ? -4 : 4), x + W + 6, y + Hh * f); c.stroke(); }
    c.fillStyle = "rgba(60,40,20,0.18)"; c.fillRect(x + W * 0.72, y - 8, W * 0.4, Hh + 16);
    c.restore();
  }
  c.restore();
  // wooden frame: posts, top rail, small roof
  const post = (x, yb, yt) => { const p = [[x - 5, yb], [x - 5, yt], [x + 5, yt - 2], [x + 5, yb - 2]]; poly(c, p, WOOD, 1.3); c.strokeStyle = "rgba(80,40,18,0.4)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - 1, yb - 2); c.lineTo(x - 1, yt); c.stroke(); };
  post(230, 700, 585); post(344, 652, 538);
  poly(c, [[222, 592], [352, 537], [352, 545], [222, 600]], "#a86f40", 1.2);
  // roof: tiled slope + ridge, small gable end on the left
  const eL = [212, 604], eR = [362, 538], tL = [222, 582], tR = [358, 522];
  const rf = [eL, eR, tR, tL]; const g = c.createLinearGradient(0, 520, 0, 605); g.addColorStop(0, "#a8bba5"); g.addColorStop(1, "#7f9883"); poly(c, rf, g, 1.3);
  c.save(); pl(c, rf); c.clip(); c.strokeStyle = "rgba(40,60,45,0.45)"; c.lineWidth = 0.8; c.beginPath(); for (let i = 1; i < 26; i++) { const a = L2(eL, eR, i / 26), b = L2(tL, tR, i / 26); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } c.stroke(); c.strokeStyle = "rgba(240,250,240,0.3)"; c.beginPath(); for (const f of [0.33, 0.66]) { const a = L2(eL, tL, f), b = L2(eR, tR, f); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } c.stroke(); c.restore();
  poly(c, [eL, eR, [eR[0], eR[1] + 4], [eL[0], eL[1] + 4]], "#5d4a34", 1);
  cap(c, [224, 579], [358, 520], 3.4, "#c3d1c0");
  poly(c, [[212, 604], [222, 582], [228, 597]], "#8a5a34", 1);
}

// ---------- temizuya (purification pavilion), standard iso ----------
export const TEMIZU = { u0: 6.75, u1: 9.15, v0: 2.55, v1: 4.55 };
export const TZ_SHIFT = [0, 0];
export function drawTemizuya(k, t, back) { const c = k.ctx, [du, dv] = TZ_SHIFT; c.save(); c.translate((du - dv) * 45, (du + dv) * 45 * 0.577); drawTemizuya0(k, t, back); c.restore(); }
function drawTemizuya0(k, t, back) {
  const c = k.ctx, { u0, u1, v0, v1 } = TEMIZU, vm = (v0 + v1) / 2;
  if (back) {
    // stone floor + basin (drawn before people stand at it)
    k.box(u0, v0, 0, u1 - u0, v1 - v0, 0.1, "#d4ccb9", { hatch: false, shadow: false, wobble: 0 });
    c.strokeStyle = "rgba(90,80,60,0.4)"; c.lineWidth = 0.7; c.beginPath();
    for (let u = u0 + 0.4; u < u1; u += 0.4) { const a = P(u, v0, 0.1), b = P(u, v1, 0.1); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
    for (let v = v0 + 0.4; v < v1; v += 0.4) { const a = P(u0, v, 0.1), b = P(u1, v, 0.1); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
    c.stroke();
    for (const [pu, pv] of [[7.15, 2.85], [7.15, 4.25]]) post3(k, pu, pv);
    // basin (one granite block, water surface, bamboo ladles on a rack)
    k.box(7.45, 3.2, 0.1, 1.15, 0.72, 0.52, "#b9b5aa", { hatch: false, shadow: false, wobble: 0, top: false });
    k.poly([[7.45, 3.2, 0.62], [8.6, 3.2, 0.62], [8.6, 3.92, 0.62], [7.45, 3.92, 0.62]], "#a9a497", { wobble: 0, lw: 1.1 });
    k.poly([[7.55, 3.28, 0.62], [8.5, 3.28, 0.62], [8.5, 3.84, 0.62], [7.55, 3.84, 0.62]], "#5f9da4", { wobble: 0, lw: 0.9 });
    for (let i = 0; i < 3; i++) { const f = ((t * 0.6 + i / 3) % 1), [x, y] = P(7.7 + i * 0.25, 3.5, 0.62); c.strokeStyle = `rgba(255,255,255,${0.75 * (1 - f)})`; c.lineWidth = 0.9; c.beginPath(); c.ellipse(x, y, 2 + f * 9, 1 + f * 4, 0, 0, TAU); c.stroke(); }
    c.fillStyle = "rgba(255,255,255,0.35)"; { const [x, y] = P(8.1, 3.4, 0.62); c.beginPath(); c.ellipse(x, y, 10, 2.5, 0.5, 0, TAU); c.fill(); }
    // ladles (hishaku) resting across the rim
    for (let i = 0; i < 5; i++) { const [x, y] = P(7.6 + i * 0.2, 3.2, 0.66), [x2, y2] = P(7.75 + i * 0.2, 3.95, 0.66); c.strokeStyle = INK; c.lineWidth = 2.6; c.lineCap = "round"; c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke(); c.strokeStyle = "#e3c776"; c.lineWidth = 1.3; c.stroke(); c.beginPath(); c.ellipse(x2, y2 + 1, 2.8, 2, 0, 0, TAU); c.fillStyle = "#d6b866"; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke(); }
    // bamboo spout with a running trickle
    { const [x, y] = P(8.95, 3.55, 0.95), [x2, y2] = P(8.45, 3.55, 0.9); c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke(); c.strokeStyle = "#8fae5a"; c.lineWidth = 2.4; c.stroke(); const [, yw] = P(8.45, 3.55, 0.62); c.strokeStyle = "rgba(170,220,235,0.95)"; c.lineWidth = 1.6; c.setLineDash([3, 2]); c.lineDashOffset = -t * 30; c.beginPath(); c.moveTo(x2, y2 + 1); c.lineTo(x2 + 1, yw); c.stroke(); c.setLineDash([]); }
    return;
  }
  for (const [pu, pv] of [[8.75, 2.85], [8.75, 4.25]]) post3(k, pu, pv);
  // tie beams under the roof
  k.poly([[7.05, 4.25, 1.78], [8.85, 4.25, 1.78], [8.85, 4.25, 1.95], [7.05, 4.25, 1.95]], WOOD, { wobble: 0, lw: 1.1 });
  k.poly([[8.75, 2.75, 1.78], [8.75, 4.35, 1.78], [8.75, 4.35, 1.95], [8.75, 2.75, 1.95]], WOOD_D, { wobble: 0, lw: 1.1 });
  // gable roof along u: back slope, front (+v) slope, gable end on the +u face
  const ze = 1.95, zr = 3.1, lift = 0.32;
  const EL = [], ER = [];
  for (let i = 0; i <= 16; i++) { const s = i / 16, up = lift * Math.pow(Math.abs(2 * s - 1), 2.6); EL.push([lerp(u0 - 0.1, u1 + 0.1, s), v1 + 0.15, ze + up]); }
  const ridge = [[u0 + 0.05, vm, zr], [u1 - 0.05, vm, zr]];
  const toPx = (p) => P(p[0], p[1], p[2]);
  // back (-v) slope shows as a strip right of the ridge
  { const EB = EL.map((p) => [p[0], v0 - 0.15, p[2]]), back = [...EB.map(toPx), toPx(ridge[1]), toPx(ridge[0])]; poly(c, back, shade(COP, -0.18), 1.2); c.save(); pl(c, back); c.clip(); c.strokeStyle = "rgba(38,62,50,0.4)"; c.lineWidth = 0.7; c.beginPath(); for (let i = 1; i < 24; i++) { const f = i / 24, e = toPx(EB[Math.round(f * 16)]), r = L2(toPx(ridge[0]), toPx(ridge[1]), f); c.moveTo(e[0], e[1]); c.lineTo(r[0], r[1]); } c.stroke(); c.restore(); }
  const front = [...EL.map(toPx), toPx(ridge[1]), toPx(ridge[0])];
  const g = c.createLinearGradient(...toPx(ridge[0]), ...toPx(EL[8])); g.addColorStop(0, shade(COP, 0.12)); g.addColorStop(1, shade(COP, -0.08));
  // fascia under the front eave
  { const top = EL.map(toPx), bot = EL.map((p) => P(p[0], p[1], p[2] - 0.12)); poly(c, [...top, ...[...bot].reverse()], "#6f9480", 0.9); c.fillStyle = GOLD; for (let i = 0; i < top.length; i += 1) { const q = L2(top[i], bot[i], 0.5); c.beginPath(); c.arc(q[0], q[1], 1.2, 0, TAU); c.fill(); } const r1 = EL.map((p) => P(p[0], p[1] - 0.15, p[2] - 0.12)), r2 = EL.map((p) => P(p[0], p[1] - 0.15, p[2] - 0.3)); poly(c, [...r1, ...[...r2].reverse()], "#4a3524", 0.8); }
  poly(c, front, g, 0);
  c.save(); pl(c, front); c.clip(); c.strokeStyle = "rgba(38,62,50,0.42)"; c.lineWidth = 0.75; c.beginPath();
  for (let i = 1; i < 24; i++) { const f = i / 24, e = toPx(EL[Math.round(f * 16)]), r = L2(toPx(ridge[0]), toPx(ridge[1]), f); c.moveTo(e[0], e[1]); c.lineTo(r[0], r[1]); } c.stroke();
  c.strokeStyle = "rgba(230,245,232,0.3)"; c.beginPath(); for (let j = 1; j < 6; j++) { const f = j / 6; EL.forEach((p, i) => { const q = L2(toPx(p), L2(toPx(ridge[0]), toPx(ridge[1]), i / 16), f); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); } c.stroke();
  // dappled sun on the copper
  const sx = (t * 0.25) % 1; c.fillStyle = "rgba(255,250,200,0.18)"; for (let i = 0; i < 4; i++) { const q = L2(toPx(EL[2 + i * 3]), toPx(ridge[0]), 0.3 + 0.12 * Math.sin(t * 0.7 + i)); c.beginPath(); c.ellipse(q[0] + sx * 6, q[1], 9, 3, 0.5, 0, TAU); c.fill(); }
  c.restore(); poly(c, front, null, 1.3);
  // gable end (+u): pediment triangle + bargeboards with gold
  const ge = [P(u1 + 0.1, v1 + 0.15, ze + lift), P(u1 + 0.1, vm, zr + 0.05), P(u1 + 0.1, v0 - 0.15, ze + lift)];
  const pe = [P(u1, v1, ze + 0.1), P(u1, vm, zr - 0.12), P(u1, v0, ze + 0.1)];
  poly(c, pe, "#8a5a34", 1); c.save(); pl(c, pe); c.clip(); c.strokeStyle = "rgba(255,220,160,0.4)"; c.lineWidth = 0.8; c.beginPath(); for (let i = 1; i < 8; i++) { const q = L2(pe[0], pe[2], i / 8); c.moveTo(q[0], q[1]); c.lineTo(q[0], q[1] - 40); } c.stroke(); c.restore();
  c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 6.5; c.beginPath(); c.moveTo(...ge[0]); c.quadraticCurveTo(ge[1][0] + 2, ge[1][1] + 10, ge[1][0], ge[1][1]); c.quadraticCurveTo(ge[1][0] - 6, ge[1][1] + 14, ge[2][0], ge[2][1]); c.stroke();
  c.strokeStyle = "#6f9480"; c.lineWidth = 4.4; c.stroke(); c.strokeStyle = GOLD; c.lineWidth = 1.1; c.stroke();
  { const [x, y] = ge[1]; poly(c, [[x - 4, y + 2], [x + 4, y + 2], [x + 3, y + 10], [x, y + 13], [x - 3, y + 10]], GOLD, 0.9); kiku(c, x, y + 20, 3.4); }
  cap(c, toPx(ridge[0]), toPx([u1 + 0.1, vm, zr + 0.05]), 3.6);
  { const a = toPx(ridge[0]); curl(c, a[0] - 1, a[1] - 1, 0.95, -1); const b = toPx([u1 + 0.1, vm, zr + 0.05]); curl(c, b[0] + 1, b[1] - 1, 0.95, 1); }
  for (let i = 1; i < 4; i++) { const q = L2(toPx(ridge[0]), toPx(ridge[1]), i / 4); stud(c, q[0], q[1] - 2.5, 1.5); }
}
function post3(k, u, v) {
  const c = k.ctx, [x, y] = P(u, v, 0.1), [, yt] = P(u, v, 1.95), w = 4.2;
  c.fillStyle = "rgba(60,45,30,0.18)"; c.beginPath(); c.ellipse(x + 4, y + 1, 8, 3, 0, 0, TAU); c.fill();
  const g = c.createLinearGradient(x - w, 0, x + w, 0); g.addColorStop(0, WOOD_L); g.addColorStop(0.5, WOOD); g.addColorStop(1, WOOD_D);
  poly(c, [[x - w, y], [x - w, yt], [x + w, yt], [x + w, y]], g, 1.2);
  poly(c, [[x - w - 2, y + 1], [x - w - 1, y - 4], [x + w + 1, y - 4], [x + w + 2, y + 1]], "#d8d0bf", 0.8);
}

// ---------- mossy stone lantern (ishidoro), px anchored at base centre ----------
export function lantern(k, t, x, yb, s = 1, seed = 1, base = false) {
  const c = k.ctx, S = (v) => v * s, st = "#cfc8b8", stD = "#a9a292", moss = "#9aa83f", mossD = "#6f8030";
  c.fillStyle = "rgba(60,45,30,0.18)"; c.beginPath(); c.ellipse(x + S(10), yb + 2, S(26), S(8), 0, 0, TAU); c.fill();
  const blk = (w, y0, y1, d, colT) => { poly(c, [[x - w, y1], [x + w, y1], [x + w, y0], [x - w, y0]], st, 1.1); poly(c, [[x - w, y0], [x + w, y0], [x + w + d, y0 - d * 0.6], [x - w + d, y0 - d * 0.6]], colT || "#ddd7c9", 1.1); poly(c, [[x + w, y1], [x + w + d, y1 - d * 0.6], [x + w + d, y0 - d * 0.6], [x + w, y0]], stD, 1.1); };
  let y = yb;
  if (base) { blk(S(19), y - S(30), y, S(6)); mossPatch(c, x, y - S(14), S(18), seed); y -= S(30); }
  blk(S(14), y - S(9), y, S(5)); y -= S(9);
  // shaft
  poly(c, [[x - S(6), y], [x - S(5), y - S(26)], [x + S(5), y - S(26)], [x + S(6), y]], st, 1.1); c.strokeStyle = "rgba(80,70,55,0.4)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - S(6), y - S(13)); c.lineTo(x + S(6), y - S(13)); c.stroke(); y -= S(26);
  blk(S(12), y - S(6), y, S(4)); y -= S(6);
  if (k.night) { nightGlow(k.ctx, x, yb - 30 * s, 34 * s, "#ffb860", 0.8); nightGlow(k.ctx, x, yb, 60 * s, "#ffb860", 0.22); k.lit(() => { k.ctx.fillStyle = "#ffd987"; k.ctx.fillRect(x - 3.5 * s, yb - 36 * s, 7 * s, 8 * s); }); }
  // firebox with flickering light
  const fl = 0.75 + 0.25 * Math.sin(t * 6 + seed * 3) * Math.sin(t * 2.3 + seed);
  poly(c, [[x - S(9), y], [x - S(9), y - S(17)], [x + S(9), y - S(17)], [x + S(9), y]], st, 1.1);
  const glow = c.createRadialGradient(x, y - S(8), 0, x, y - S(8), S(18)); glow.addColorStop(0, `rgba(255,200,110,${0.35 * fl})`); glow.addColorStop(1, "rgba(255,200,110,0)"); c.fillStyle = glow; c.beginPath(); c.arc(x, y - S(8), S(18), 0, TAU); c.fill();
  poly(c, [[x - S(5.5), y - S(3)], [x - S(5.5), y - S(14)], [x + S(5.5), y - S(14)], [x + S(5.5), y - S(3)]], `rgb(255,${Math.round(196 + 30 * fl)},${Math.round(110 + 40 * fl)})`, 0.9);
  c.strokeStyle = "rgba(90,60,30,0.6)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x, y - S(3)); c.lineTo(x, y - S(14)); c.moveTo(x - S(5.5), y - S(8.5)); c.lineTo(x + S(5.5), y - S(8.5)); c.stroke();
  y -= S(17);
  // roof (kasa) with upturned corners and a thick moss cap
  const rw = S(19), rh = S(10);
  const roof = [[x - rw - S(3), y + S(1)], [x - rw, y - S(3)], [x - S(4), y - rh], [x + S(4), y - rh], [x + rw, y - S(3)], [x + rw + S(3), y + S(1)], [x + rw - S(2), y + S(3)], [x - rw + S(2), y + S(3)]];
  poly(c, roof, st, 1.1);
  const mc = [[x - rw + S(1), y - S(2)], [x - S(5), y - rh - S(1)], [x + S(5), y - rh - S(1)], [x + rw - S(1), y - S(2)], [x + rw - S(5), y + S(0.5)], [x + S(2), y - S(3)], [x - S(4), y + S(0.5)], [x - rw + S(6), y]];
  c.beginPath(); c.moveTo(mc[0][0], mc[0][1]); for (let i = 1; i < mc.length; i++) { const p = mc[i - 1], q = mc[i]; c.quadraticCurveTo(p[0] + (q[0] - p[0]) / 2 + (hash(seed + i) - 0.5) * 4, (p[1] + q[1]) / 2 - 2, q[0], q[1]); } c.closePath();
  c.fillStyle = moss; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  c.fillStyle = "rgba(220,230,120,0.6)"; c.beginPath(); c.ellipse(x - S(6), y - rh + S(2), S(6), S(2), -0.2, 0, TAU); c.fill();
  c.fillStyle = mossD; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(x + (hash(seed * 5 + i) - 0.5) * rw * 1.6, y - S(2) - hash(seed + i * 9) * S(5), S(1.4), 0, TAU); c.fill(); }
  // finial (hoju)
  poly(c, [[x - S(3.5), y - rh], [x + S(3.5), y - rh], [x + S(2.5), y - rh - S(4)], [x - S(2.5), y - rh - S(4)]], st, 1);
  c.beginPath(); c.moveTo(x, y - rh - S(13)); c.quadraticCurveTo(x + S(6), y - rh - S(7), x + S(4), y - rh - S(4)); c.lineTo(x - S(4), y - rh - S(4)); c.quadraticCurveTo(x - S(6), y - rh - S(7), x, y - rh - S(13)); c.fillStyle = moss; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  mossPatch(c, x - S(2), yb - S(5), S(14), seed + 3);
}
function mossPatch(c, x, y, r, seed) { c.fillStyle = "rgba(130,160,55,0.85)"; for (let i = 0; i < 7; i++) { c.beginPath(); c.ellipse(x + (hash(seed * 3 + i) - 0.5) * r * 2, y + (hash(seed * 7 + i) - 0.5) * r * 0.8, 3 + hash(i + seed) * 3, 1.8, 0, 0, TAU); c.fill(); } }

// ---------- rope fence posts ----------
export function fence(k, t, pts) {
  const c = k.ctx;
  // rope sags between posts (shimenawa-like straw rope), swaying very slightly
  c.lineCap = "round";
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], sag = 7 + Math.sin(t * 1.2 + i) * 0.6;
    c.strokeStyle = INK; c.lineWidth = 3.2; c.beginPath(); c.moveTo(x0, y0 - 20); c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 - 20 + sag, x1, y1 - 20); c.stroke();
    c.strokeStyle = "#d8c08a"; c.lineWidth = 1.8; c.stroke();
  }
  for (const [x, y] of pts) {
    poly(c, [[x - 3.2, y], [x - 3.2, y - 26], [x + 3.2, y - 27], [x + 3.2, y - 1]], WOOD, 1.1);
    c.beginPath(); c.ellipse(x, y - 26.5, 3.2, 1.6, 0, 0, TAU); c.fillStyle = "#e7c28e"; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
    c.fillStyle = "rgba(60,45,30,0.18)"; c.beginPath(); c.ellipse(x + 4, y + 1, 6, 2, 0, 0, TAU); c.fill();
  }
}

// ---------- rocks + shrubs ----------
export function rock(k, x, y, r, seed) {
  const c = k.ctx, R = rng(seed), pts = [];
  for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI; pts.push([x + Math.cos(a) * r * (0.85 + R() * 0.3), y + Math.sin(a) * r * 0.75 * (0.85 + R() * 0.3)]); }
  pts.push([x + r * 0.9, y + r * 0.15], [x - r * 0.9, y + r * 0.15]);
  const g = c.createLinearGradient(x - r, y - r, x + r, y + r * 0.3); g.addColorStop(0, "#c8c2b2"); g.addColorStop(1, "#8f897b");
  poly(c, pts, g, 1.3);
  c.fillStyle = "rgba(125,155,55,0.85)"; c.beginPath(); c.ellipse(x - r * 0.2, y - r * 0.5, r * 0.5, r * 0.18, -0.2, 0, TAU); c.fill();
  c.strokeStyle = "rgba(70,60,50,0.45)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - r * 0.3, y - r * 0.2); c.lineTo(x + r * 0.1, y + r * 0.1); c.stroke();
}
export function shrub(k, t, x, y, r, seed, flowers = 0) {
  const c = k.ctx, R = rng(seed), n = 4 + Math.round(r / 8), sw = Math.sin(t * 1.1 + seed) * 0.8;
  c.fillStyle = "rgba(60,45,30,0.16)"; c.beginPath(); c.ellipse(x + 4, y + 2, r * 1.2, r * 0.35, 0, 0, TAU); c.fill();
  const parts = [];
  for (let i = 0; i < n; i++) { const a = R() * Math.PI, d = R() * r * 0.8; parts.push([x + Math.cos(a) * d * 1.3 - r * 0.0, y - Math.sin(a) * d * 0.9 - r * 0.25, r * (0.42 + R() * 0.25), R()]); }
  parts.sort((a, b) => a[1] - b[1]);
  for (const [px, py, pr, l] of parts) { const colr = l > 0.65 ? PAL.lite : l > 0.3 ? PAL.mid2 : PAL.mid; const pts = spray(c, px + sw * (1 - (y - py) / 40), py, pr, colr, seed * 7 + Math.round(px), 0.7); tuftDetail(c, pts, colr, R); }
  if (flowers) { for (let i = 0; i < flowers; i++) { const fx = x + (R() - 0.5) * r * 2, fy = y - r * 0.2 - R() * r * 0.9; c.fillStyle = "#fbf8ee"; c.beginPath(); c.arc(fx, fy, 2.2, 0, TAU); c.fill(); c.strokeStyle = "rgba(60,60,40,0.5)"; c.lineWidth = 0.5; c.stroke(); c.fillStyle = "#e9d27a"; c.fillRect(fx - 0.5, fy - 0.5, 1, 1); } }
}
export { uvOf, depthOf };
