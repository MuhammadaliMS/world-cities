// Covent Garden / Hyde Park helpers (own file; shared kit lives in _props.js)
import { P, CTS, INK, shade, lerp, clamp, rng, walkState } from "../../lib/vec-kit.js";
import { obox, fquad, boat, wake } from "./_props.js";

export const BIG_LOBES = [[-0.8, -0.25, 0.55], [0.8, -0.3, 0.55], [-0.35, -0.7, 0.55], [0.4, -0.72, 0.55], [0, -0.95, 0.5], [-1.0, 0.1, 0.45], [1.0, 0.05, 0.47], [-0.55, 0.1, 0.62], [0.5, 0.1, 0.62], [0, -0.3, 0.7], [-0.3, 0.45, 0.45], [0.35, 0.45, 0.45]];

// ---- Victorian bandstand: octagonal platform, cast-iron posts, slate roof, lantern, finial, steps ----
export function bandstand(k, u, v, t, R = 1.15) {
  const c = k.ctx, G = "#2c5a48", GL = "#4a8068";
  k.ell(u + 0.15, v + 0.1, 0, R * 1.2, "rgba(60,45,30,0.15)", { stroke: false });
  // paved patio
  k.ell(u, v, 0, R * 1.55, "#e4d7b6", { lw: 1.1 });
  k.ell(u, v, 0, R * 1.3, "#d6c7a2", { lw: 0.8 });
  // steps toward the viewer
  k.box(u + R * 0.15, v + R * 0.78, 0, R * 0.7, 0.5, 0.2, "#d8cfbb", { hatch: false, shadow: false });
  k.box(u + R * 0.25, v + R * 0.85, 0, R * 0.5, 0.35, 0.34, "#d8cfbb", { hatch: false, shadow: false });
  // octagonal drum
  const oct = (r, z) => { const pts = []; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; pts.push([u + Math.cos(a) * r, v + Math.sin(a) * r, z]); } return pts; };
  const lo = oct(R, 0), hi = oct(R, 0.55);
  for (let i = 0; i < 8; i++) { const j = (i + 1) % 8; const a = (i / 8) * Math.PI * 2 + Math.PI / 8 + Math.PI / 8; if (Math.cos(a) + Math.sin(a) > -0.1) k.poly([lo[i], lo[j], hi[j], hi[i]], i % 2 ? "#d4c9b2" : "#c6baa2", { lw: 1, wobble: 0 }); }
  k.poly(hi, "#e8dfc8", { lw: 1.1, wobble: 0 });
  // ironwork balustrade on the front arcs
  const posts = oct(R * 0.92, 0.55);
  const rail = [];
  for (const p of posts) rail.push(P(p[0], p[1], 1.1));
  // back posts + roof structure first (behind band)
  const postTop = 2.5;
  const band = (u2, v2) => { const [x, y] = P(u2, v2, 0.55), [, yt] = P(u2, v2, postTop); c.strokeStyle = INK; c.lineWidth = 4.2; c.lineCap = "round"; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt); c.stroke(); c.strokeStyle = G; c.lineWidth = 2.4; c.stroke(); };
  const sorted = posts.map((p) => p).sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  for (const p of sorted.slice(0, 4)) band(p[0], p[1]);
  // musicians (brass band) on the platform, seated, arms working
  const mus = [[-0.6, 0.15, 11], [-0.2, 0.0, 12], [0.2, -0.05, 13], [0.6, 0.12, 14]];
  const cols = ["#b33a30", "#b33a30", "#b33a30", "#b33a30"];
  mus.forEach(([du, dv, seed], i) => {
    const p = k.person(u + du * 0.62, v + dv * 0.62 - 0.05, { pose: "sit", bench: true, seatZ: 0.78, z: 0.34, dir: [0.15, 1], seed, top: cols[i], bottom: "#2d2b3c", hat: i % 2 ? "cap" : null, hatCol: "#b33a30" });
    // horn: gold bell bobbing in time
    const bob = Math.sin(t * 5.5 + i * 1.3) * 1.6;
    c.fillStyle = "#e7bc45"; c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.ellipse(p.aR[0] + 1, p.aR[1] - 3 + bob, 3.2, 2.4, 0.3, 0, 7); c.fill(); c.stroke();
  });
  // conductor's stand + music notes drifting up
  for (let i = 0; i < 3; i++) { const ph = (t * 0.5 + i / 3) % 1; const [nx, ny] = P(u + 0.1, v - 0.1, 2.0); c.fillStyle = `rgba(42,36,32,${1 - ph})`; c.beginPath(); c.ellipse(nx - 6 + i * 6 + Math.sin(ph * 6 + i) * 4, ny - ph * 30, 2.2, 1.6, -0.4, 0, 7); c.fill(); c.fillRect(nx - 4.2 + i * 6 + Math.sin(ph * 6 + i) * 4, ny - ph * 30 - 7, 0.9, 7); }
  for (const p of sorted.slice(4)) band(p[0], p[1]);
  // front balustrade
  for (let i = 4; i < 8; i++) { const a = sorted[i], b = sorted[(i + 1) % 8 > 3 ? (i + 1) % 8 : i]; }
  c.strokeStyle = G; c.lineWidth = 1.6; c.beginPath(); const front = sorted.slice(3).sort((a, b) => a[0] - a[1] - (b[0] - b[1])); front.forEach((p, i) => { const q = P(p[0], p[1], 1.0); i ? c.lineTo(...q) : c.moveTo(...q); }); c.stroke();
  // frieze ring + roof
  c.strokeStyle = INK; c.lineWidth = 1; for (let i = 0; i < 8; i++) { const a = P(posts[i][0], posts[i][1], postTop - 0.15), b = P(posts[(i + 1) % 8][0], posts[(i + 1) % 8][1], postTop - 0.15); c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); for (let j = 1; j < 5; j++) { const f = j / 5; c.beginPath(); c.arc(lerp(a[0], b[0], f), lerp(a[1], b[1], f) + 3, 1.4, 0, 7); c.stroke(); } }
  const rr = R * 0.95, cx = P(u, v, postTop)[0];
  const [x0, y0] = P(u, v, postTop), [, ytop] = P(u, v, postTop + 1.0);
  const rx = rr * CTS.S * Math.SQRT2, ry = rx * CTS.YS;
  const g = c.createLinearGradient(x0 - rx, 0, x0 + rx, 0); g.addColorStop(0, "#b3b8c6"); g.addColorStop(0.5, "#8e95aa"); g.addColorStop(1, "#5d6580");
  c.beginPath(); c.ellipse(x0, y0, rx, ry, 0, 0, Math.PI); c.lineTo(x0, ytop); c.closePath(); c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
  c.beginPath(); c.moveTo(x0 - rx, y0); c.lineTo(x0, ytop); c.lineTo(x0 + rx, y0); c.ellipse(x0, y0, rx, ry, 0, 0, Math.PI * 2, true); c.fillStyle = g; c.fill(); c.stroke();
  c.strokeStyle = "rgba(20,24,40,0.45)"; c.lineWidth = 0.8; for (let i = 1; i < 8; i++) { const f = i / 8; c.beginPath(); c.moveTo(x0, ytop); c.lineTo(lerp(x0 - rx, x0 + rx, f), y0 + Math.sin(Math.acos(2 * f - 1)) * ry); c.stroke(); }
  k.cyl(u, v, postTop + 0.95, 0.09, 0.22, G, { topCol: GL });
  c.strokeStyle = "#d3a93a"; c.lineWidth = 2; const [fx, fy] = P(u, v, postTop + 1.2); c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx, fy - 15); c.moveTo(fx - 4, fy - 10); c.lineTo(fx + 4, fy - 10); c.stroke();
}

export function deckchair(k, u, v, col = "#d64e46", col2 = "#f6f0e2") {
  const c = k.ctx;
  k.shadow([[u, v, 0], [u + 0.55, v, 0], [u + 0.65, v + 0.45, 0], [u + 0.1, v + 0.45, 0]], 0.1);
  const A = (a, b, z) => P(u + a, v + b, z);
  c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(...A(0.05, 0.4, 0)); c.lineTo(...A(0.05, 0.1, 0.5)); c.moveTo(...A(0.5, 0.4, 0)); c.lineTo(...A(0.5, 0.1, 0.5)); c.stroke();
  c.strokeStyle = "#a8743f"; c.lineWidth = 1.4; c.stroke();
  const n = 6;
  for (let i = 0; i < n; i++) { const f0 = i / n, f1 = (i + 1) / n; const p = (f, a) => A(a, 0.05 + 0.4 * f, 0.5 - 0.42 * f + (f < 0.5 ? 0 : 0)); k.path([p(f0, 0.02), p(f0, 0.53), p(f1, 0.53), p(f1, 0.02)], { fill: i % 2 ? col2 : col, lw: 0.7, wobble: 0 }); }
}

export function reeds(k, u, v, n = 5, seed = 1) {
  const c = k.ctx, t = k.t, R = rng(seed);
  c.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const [x, y] = P(u + (R() - 0.5) * 0.5, v + (R() - 0.5) * 0.5, 0), h = 18 + R() * 12, sw = Math.sin(t * 1.4 + i + seed) * 2.2;
    c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + sw * 0.4, y - h * 0.5, x + sw, y - h); c.stroke();
    c.strokeStyle = "#7b9a4a"; c.lineWidth = 1.4; c.stroke();
    if (i % 2 === 0) { c.fillStyle = "#7a5a3a"; c.beginPath(); c.ellipse(x + sw, y - h, 1.6, 4, 0, 0, 7); c.fill(); }
  }
}
export function lily(k, u, v, seed = 1) {
  const c = k.ctx, R = rng(seed), t = k.t;
  for (let i = 0; i < 4; i++) { const [x, y] = P(u + (R() - 0.5) * 0.7, v + (R() - 0.5) * 0.7, 0), r = 5 + R() * 3; c.fillStyle = "#6f9f4e"; c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.ellipse(x, y + Math.sin(t + i) * 0.4, r, r * 0.5, 0, 0.3, Math.PI * 2 - 0.3); c.lineTo(x, y); c.closePath(); c.fill(); c.stroke(); if (i === 1) { c.fillStyle = "#fbe3ef"; c.beginPath(); c.arc(x, y - 1, 2.2, 0, 7); c.fill(); } }
}

// ---- horse (screen-space side view, heading from (du,dv)), optional rider handled by caller ----
export function horse(k, u, v, du, dv, p, o = {}) {
  const c = k.ctx, face = du - dv >= 0 ? 1 : -1, [x, y] = P(u, v, 0);
  const col = o.col || "#8a5a38", dark = shade(col, -0.3), gait = p * Math.PI * 2, moving = o.moving ?? true;
  c.fillStyle = "rgba(60,45,30,0.18)"; c.beginPath(); c.ellipse(x, y + 1, 19, 6, 0, 0, 7); c.fill();
  const bob = moving ? Math.abs(Math.sin(gait)) * 1.4 : 0;
  c.lineCap = "round"; c.lineJoin = "round";
  const leg = (lx, ph) => { const sw = moving ? Math.sin(gait + ph) * 5 : 0, lift = moving ? Math.max(0, Math.cos(gait + ph)) * 3.5 : 0; c.strokeStyle = INK; c.lineWidth = 4.2; c.beginPath(); c.moveTo(x + lx * face, y - 15 - bob); c.lineTo(x + lx * face + sw * face * 0.6, y - lift - 1); c.stroke(); c.strokeStyle = dark; c.lineWidth = 2.4; c.stroke(); };
  leg(-11, 0); leg(9, Math.PI); leg(-8, Math.PI); leg(12, 0);
  // body
  c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 1.3;
  c.beginPath(); c.ellipse(x, y - 19 - bob, 17, 8.5, 0, 0, 7); c.fill(); c.stroke();
  // neck + head
  c.beginPath(); c.moveTo(x + face * 11, y - 23 - bob); c.quadraticCurveTo(x + face * 18, y - 32 - bob, x + face * 20, y - 37 - bob); c.lineTo(x + face * 26, y - 33 - bob); c.quadraticCurveTo(x + face * 22, y - 28 - bob, x + face * 17, y - 18 - bob); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.ellipse(x + face * 26, y - 32 - bob, 4.8, 2.8, face * 0.6, 0, 7); c.fill(); c.stroke();
  c.fillStyle = INK; c.beginPath(); c.arc(x + face * 24, y - 35 - bob, 0.9, 0, 7); c.fill();
  c.strokeStyle = dark; c.lineWidth = 2; c.beginPath(); c.moveTo(x + face * 12, y - 26 - bob); c.quadraticCurveTo(x + face * 15, y - 33 - bob, x + face * 19, y - 38 - bob); c.stroke();
  // tail
  const tw = moving ? Math.sin(gait * 1.5) * 2.5 : Math.sin(k.t * 2) * 1.5;
  c.strokeStyle = INK; c.lineWidth = 3.6; c.beginPath(); c.moveTo(x - face * 16, y - 22 - bob); c.quadraticCurveTo(x - face * 22, y - 20 - bob, x - face * 21 + tw, y - 10 - bob); c.stroke(); c.strokeStyle = dark; c.lineWidth = 2; c.stroke();
  // saddle
  c.fillStyle = "#3a2a22"; c.beginPath(); c.ellipse(x - face * 1, y - 26 - bob, 7, 2.6, 0, 0, 7); c.fill();
  return { saddle: [x - face, y - 27 - bob], bob };
}

// ---- small dog on a lead ----
export function dog(k, x, y, face, gait, moving, col = "#d9904a") {
  const c = k.ctx, bob = moving ? Math.abs(Math.sin(gait)) * 1 : 0;
  c.fillStyle = "rgba(60,45,30,0.15)"; c.beginPath(); c.ellipse(x, y, 7, 2.6, 0, 0, 7); c.fill();
  for (const [lx, ph] of [[-4, 0], [-2, Math.PI], [3, Math.PI], [5, 0]]) { const sw = moving ? Math.sin(gait + ph) * 2 : 0; c.strokeStyle = INK; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x + lx * face, y - 3.5 - bob); c.lineTo(x + lx * face + sw, y); c.stroke(); c.strokeStyle = col; c.lineWidth = 1; c.stroke(); }
  c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 1;
  c.beginPath(); c.ellipse(x, y - 5.5 - bob, 6.5, 3.2, 0, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.arc(x + face * 7, y - 8 - bob, 3, 0, 7); c.fill(); c.stroke();
  c.fillStyle = "#fff"; c.beginPath(); c.arc(x + face * 8.5, y - 6.8 - bob, 1.4, 0, 7); c.fill();
  c.fillStyle = INK; c.beginPath(); c.arc(x + face * 9.6, y - 8 - bob, 0.8, 0, 7); c.fill();
  const wag = Math.sin(k.t * 14) * 2.6; c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x - face * 6, y - 6 - bob); c.quadraticCurveTo(x - face * 9, y - 10 - bob, x - face * 9 + wag, y - 12 - bob); c.stroke();
}

// painted-pixel (CTS ref frame) -> (u,v) on the tile; the painted slab diamond is (65,690) (505,440) (945,690) (505,940)
export const PX = (x, y) => { const d = ((x - 505) / 440) * 10, s = 10 + ((y - 690) / 250) * 10; return [(s + d) / 2, (s - d) / 2]; };
export const PXS = (pts) => pts.map(([x, y]) => PX(x, y));
