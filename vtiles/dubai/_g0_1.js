// DUBAI 0,1 helpers (grid pass): private copies of the boat, quay, pot, lamp and podium helpers from the old
// tile, with layout moved onto the u,v grid. Used only by vtiles/dubai/0_1.js.
import { P, CTS, INK, shade, lerp, clamp, rng } from "../../lib/vec-kit.js";
import { look } from "./_props.js";
import { glazing, awningF } from "./_t0_1.js";

export const WZ = -0.28;
const SX = CTS.S * CTS.XS, SY = CTS.S * CTS.YS;
export const tr = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };

export function extrude(k, pt, poly, zlo, zhi, o = {}) {
  const c = k.ctx, n = poly.length, sides = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, lo = [pt(poly[i][0], poly[i][1], zlo), pt(poly[j][0], poly[j][1], zlo)], hi = [pt(poly[j][0], poly[j][1], zhi), pt(poly[i][0], poly[i][1], zhi)];
    sides.push({ q: [lo[0], lo[1], hi[0], hi[1]], d: lo[0][1] + lo[1][1], i });
  }
  sides.sort((a, b) => a.d - b.d);
  for (const sd of sides) {
    const [a, b, cc, d] = sd.q, dx = b[0] - a[0];
    // darker the more the wall faces away from the light (left), lightest on walls facing the viewer-left
    const sh = o.shade ?? 0; const base = dx > 0 ? shade(o.wall || "#f6f3ec", -0.06 + sh) : shade(o.wall || "#f6f3ec", -0.16 + sh);
    tr(c, sd.q); c.fillStyle = base; c.fill(); c.strokeStyle = INK; c.lineWidth = o.lw ?? 1.1; c.lineJoin = "round"; c.stroke();
    if (o.win) {
      const [w0, w1] = o.win, Q = (fa, fb) => [lerp(lerp(a[0], b[0], fa), lerp(d[0], cc[0], fa), fb), lerp(lerp(a[1], b[1], fa), lerp(d[1], cc[1], fa), fb)];
      const m = o.winM ?? 0.07, wp = [Q(m, w0), Q(1 - m, w0), Q(1 - m, w1), Q(m, w1)];
      if (Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]) > 5) {
        tr(c, wp); const g = c.createLinearGradient(0, wp[2][1], 0, wp[0][1]); g.addColorStop(0, "#5d8aa6"); g.addColorStop(1, "#1f3d54"); c.fillStyle = g; c.fill();
        c.save(); tr(c, wp); c.clip(); c.fillStyle = "rgba(255,255,255,0.22)"; tr(c, [Q(m, w0), Q(m + 0.22, w0), Q(m + 0.32, w1), Q(m + 0.1, w1)]); c.fill();
        c.strokeStyle = "rgba(230,240,245,0.7)"; c.lineWidth = 0.8; c.beginPath(); const nm = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 13)); for (let q = 1; q < nm; q++) { const f = lerp(m, 1 - m, q / nm); c.moveTo(...Q(f, w0)); c.lineTo(...Q(f, w1)); } c.stroke(); c.restore();
        c.strokeStyle = "rgba(20,30,40,0.8)"; c.lineWidth = 0.9; tr(c, wp); c.stroke();
      }
    }
  }
  const top = poly.map(([f, s]) => pt(f, s, zhi));
  tr(c, top); c.fillStyle = o.roof || "#fbfaf5"; c.fill(); c.strokeStyle = INK; c.lineWidth = o.lw ?? 1.2; c.stroke();
  return top;
}
// the harbour yacht: white hull with navy band, teak decks, tinted cabin, flybridge, radar, domes, flag, guests
export function yacht2(k, u, v, dir, o = {}) {
  const c = k.ctx, t = k.t, L = o.len ?? 2.7, W = o.wid ?? 0.95, z0 = o.z ?? WZ, ph = o.ph ?? 0, s0 = L / 2.7;
  let [a, b] = dir; const l = Math.hypot(a, b) || 1; a /= l; b /= l; const n = [-b, a];
  const bob = Math.sin(t * 1.9 + ph) * 0.022, roll = Math.sin(t * 1.4 + ph * 1.7) * 0.02;
  const pt = (f, s, z) => P(u + a * f + n[0] * s, v + b * f + n[1] * s, z0 + z + bob + s * roll);
  const hw = W / 2, hl = L / 2;
  const hull = [[hl, 0], [hl * 0.8, hw * 0.4], [hl * 0.5, hw * 0.82], [hl * 0.15, hw], [-hl * 0.7, hw], [-hl, hw * 0.9], [-hl, -hw * 0.9], [-hl * 0.7, -hw], [hl * 0.15, -hw], [hl * 0.5, -hw * 0.82], [hl * 0.8, -hw * 0.4]];
  const H = 0.2;
  // soft shadow + contact ripple
  c.fillStyle = "rgba(10,70,85,0.25)"; { const [x, y] = P(u, v, z0); c.beginPath(); c.ellipse(x + 6, y + 3, hl * SX * 1.0, hw * SX * 0.7, Math.atan2(b * SY, a * SX), 0, 6.3); c.fill(); }
  // hull: navy boot stripe below the white topsides
  extrude(k, (f, s, z) => pt(f * 0.97, s * 0.9, z), hull, -0.05, 0.06, { wall: "#26486e", roof: "#26486e" });
  const top = extrude(k, pt, hull, 0.04, H, { wall: "#faf6ea", roof: "#f3ecda", win: [0.4, 0.62], winM: 0.1, lw: 1.2 });
  // teak aft cockpit + foredeck with plank lines
  const teak = (f0, f1, w0, w1) => { k.path([pt(f0, -w0, H), pt(f1, -w1, H), pt(f1, w1, H), pt(f0, w0, H)], { fill: "#cf9f68", lw: 0.8, wobble: 0 }); c.strokeStyle = "rgba(110,70,35,0.45)"; c.lineWidth = 0.6; c.beginPath(); for (let q = -3; q <= 3; q++) { c.moveTo(...pt(f0, q * w0 / 3.4, H)); c.lineTo(...pt(f1, q * w1 / 3.4, H)); } c.stroke(); };
  teak(-hl * 0.97, -hl * 0.55, hw * 0.82, hw * 0.82); teak(hl * 0.3, hl * 0.78, hw * 0.62, hw * 0.28);
  // swim platform
  extrude(k, pt, [[-hl - 0.3 * s0, hw * 0.7], [-hl, hw * 0.78], [-hl, -hw * 0.78], [-hl - 0.3 * s0, -hw * 0.7]], 0.04, 0.12, { wall: "#e8d2a8", roof: "#d9b27a", lw: 1 });
  // foredeck: sun pads + anchor cleat + bow rail
  const pad = (f0, f1, s1) => k.path([pt(f0, -s1, H), pt(f1, -s1, H), pt(f1, s1, H), pt(f0, s1, H)], { fill: "#fbf6ea", lw: 0.9, wobble: 0 });
  pad(0.5 * s0, 0.78 * s0, hw * 0.26);
  for (const [f, s] of [[1.15 * s0, 0.22], [1.15 * s0, -0.22], [0.85 * s0, 0.34], [0.85 * s0, -0.34], [0.55 * s0, 0.4], [0.55 * s0, -0.4], [-0.3 * s0, hw - 0.05], [-0.8 * s0, hw - 0.05]]) { const p0 = pt(f, s, H), p1 = pt(f, s, H + 0.12); c.strokeStyle = "#e9e9e9"; c.lineWidth = 1; c.beginPath(); c.moveTo(...p0); c.lineTo(...p1); c.stroke(); }
  c.strokeStyle = "rgba(235,240,245,0.9)"; c.lineWidth = 1; c.beginPath(); [[1.15 * s0, 0.22], [0.85 * s0, 0.34], [0.55 * s0, 0.4], [-0.3 * s0, hw - 0.05], [-0.8 * s0, hw - 0.05]].forEach(([f, s], i) => { const p = pt(f, s, H + 0.12); i ? c.lineTo(...p) : c.moveTo(...p); }); c.stroke();
  { // stainless rails along the deck edge (aft to bow) with posts
    const rail = (sg) => { const pts = []; for (let i = 0; i <= 14; i++) { const f = lerp(-hl * 0.92, hl * 0.62, i / 14); const wd = f > hl * 0.15 ? hw * (1 - (f - hl * 0.15) / (hl * 0.85) * 0.9) : hw; pts.push([f, sg * wd * 0.92]); } return pts; };
    for (const sg of [-1, 1]) { const pts = rail(sg);
      for (let i = 0; i < pts.length; i += 2) { const p0 = pt(pts[i][0], pts[i][1], H), p1 = pt(pts[i][0], pts[i][1], H + 0.1); c.strokeStyle = "#dfe5e8"; c.lineWidth = 1; c.beginPath(); c.moveTo(...p0); c.lineTo(...p1); c.stroke(); }
      c.strokeStyle = INK; c.lineWidth = 2.2; c.beginPath(); pts.forEach(([f, s2], i) => { const p = pt(f, s2, H + 0.1); i ? c.lineTo(...p) : c.moveTo(...p); }); c.stroke(); c.strokeStyle = "#eef2f4"; c.lineWidth = 1; c.stroke(); }
  }
  // main saloon (raked, windows all round)
  const cab = [[0.42 * s0, hw * 0.42], [0.12 * s0, hw * 0.72], [-0.8 * s0, hw * 0.72], [-0.8 * s0, -hw * 0.72], [0.12 * s0, -hw * 0.72], [0.42 * s0, -hw * 0.42]];
  const cabTop = extrude(k, pt, cab, H, H + 0.15, { wall: "#f8f2e2", roof: "#fffdf6", win: [0.22, 0.82], winM: 0.06 });
  // cabin roof: lip + flybridge on top
  const fb = [[-0.05 * s0, hw * 0.42], [-0.2 * s0, hw * 0.58], [-0.62 * s0, hw * 0.58], [-0.62 * s0, -hw * 0.58], [-0.2 * s0, -hw * 0.58], [-0.05 * s0, -hw * 0.42]];
  const fbTop = extrude(k, pt, fb, H + 0.15, H + 0.27, { wall: "#fbfaf5", roof: "#ffffff", win: [0.3, 0.85], winM: 0.08 });
  // seating + helm on the flybridge roof
  const lounge = (f, s) => k.path([pt(f - 0.18, s - 0.07, H + 0.27), pt(f + 0.18, s - 0.07, H + 0.27), pt(f + 0.18, s + 0.07, H + 0.27), pt(f - 0.18, s + 0.07, H + 0.27)], { fill: "#d7c3a0", lw: 0.7, wobble: 0 });
  // radar arch + domes
  const mast = pt(-0.32 * s0, 0, H + 0.27), mTop = pt(-0.32 * s0, 0, H + 0.52);
  c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(...mast); c.lineTo(...mTop); c.stroke(); c.strokeStyle = "#f2f0ea"; c.lineWidth = 1.4; c.stroke();
  c.save(); c.translate(mTop[0], mTop[1]); c.scale(Math.cos(t * 3 + ph), 1); c.fillStyle = "#eceae2"; c.fillRect(-7, -2.2, 14, 3.8); c.strokeStyle = INK; c.lineWidth = 0.9; c.strokeRect(-7, -2.2, 14, 3.8); c.restore();
  for (const [f, s, r] of [[-0.05 * s0, 0.18, 4.6], [-0.05 * s0, -0.18, 4.6]]) { const p = pt(f, s, H + 0.27 + 0.12); c.beginPath(); c.arc(p[0], p[1] - r * 0.6, r, 0, 6.3); c.fillStyle = "#fbfbf8"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke(); c.fillStyle = "rgba(255,255,255,0.8)"; c.beginPath(); c.arc(p[0] - r * 0.3, p[1] - r * 0.9, r * 0.3, 0, 6.3); c.fill(); }
  // ensign + stern flag
  const fp = pt(-hl + 0.05, 0, H), ft = pt(-hl + 0.05, 0, H + 0.38);
  c.strokeStyle = INK; c.lineWidth = 1.1; c.beginPath(); c.moveTo(...fp); c.lineTo(...ft); c.stroke();
  const w = Math.sin(t * 6 + ph) * 1.6; c.fillStyle = "#c8322f"; c.beginPath(); c.moveTo(ft[0], ft[1]); c.lineTo(ft[0] - 9, ft[1] + 1 + w); c.lineTo(ft[0] - 9, ft[1] + 6 + w * 0.6); c.lineTo(ft[0], ft[1] + 5); c.closePath(); c.fill(); c.fillStyle = "#fff"; c.fillRect(ft[0] - 9, ft[1] + 3 + w * 0.8, 9, 2); c.fillStyle = "#1f8a4c"; c.fillRect(ft[0] - 9, ft[1] + 1 + w * 0.5, 3, 5);
  // guests
  const guests = o.guests ?? [[0.7 * s0, -0.12, 0], [0.64 * s0, 0.15, 1]];
  const pep = [];
  for (const [f, s, i] of guests) pep.push({ f, s, i });
  return { pt, H, a, b, n, guests: pep, mast: mTop, hl, hw };
}
export function wake2(k, u, v, dir, z, o = {}) {
  const c = k.ctx, t = k.t;
  let [a, b] = dir; const l = Math.hypot(a, b) || 1; a /= l; b /= l; const n = [-b, a], len = o.len ?? 2.4, w = o.w ?? 0.9, hl = o.hl ?? 1.3;
  c.lineCap = "round";
  for (const sd of [-1, 1]) {
    const pts = []; for (let i = 0; i <= 12; i++) { const f = i / 12, wig = Math.sin(t * 6 + i * 1.3) * 0.02; pts.push(P(u - a * (hl * 0.5 + f * len) + n[0] * sd * (0.3 + f * w + wig), v - b * (hl * 0.5 + f * len) + n[1] * sd * (0.3 + f * w + wig), z)); }
    for (let i = 0; i < 12; i++) { c.strokeStyle = `rgba(255,255,255,${0.9 * (1 - i / 12)})`; c.lineWidth = 2.8 * (1 - i / 14); c.beginPath(); c.moveTo(...pts[i]); c.lineTo(...pts[i + 1]); c.stroke(); }
  }
  for (let i = 0; i < 9; i++) { const f = (t * 0.9 + i / 9) % 1, [x, y] = P(u - a * (hl + f * len * 0.7), v - b * (hl + f * len * 0.7), z); c.fillStyle = `rgba(255,255,255,${0.8 * (1 - f)})`; c.beginPath(); c.ellipse(x + Math.sin(i * 2.1) * 3, y + Math.cos(i * 1.7) * 1.5, 3 + f * 5, 1.4 + f * 2, 0, 0, 6.3); c.fill(); }
  for (const sd of [-1, 1]) { const p = P(u + a * hl, v + b * hl, z), q = P(u + a * (hl - 0.5) + n[0] * sd * 0.5, v + b * (hl - 0.5) + n[1] * sd * 0.5, z); c.strokeStyle = "rgba(255,255,255,0.9)"; c.lineWidth = 1.8; c.beginPath(); c.moveTo(...p); c.quadraticCurveTo((p[0] + q[0]) / 2, (p[1] + q[1]) / 2 - 3, ...q); c.stroke(); }
}

export function bollard(k, u, v, z = 0, h = 0.8) {
  const c = k.ctx, [x, y] = P(u, v, z), [, yt] = P(u, v, z + h);
  c.fillStyle = "rgba(20,70,85,0.22)"; c.beginPath(); c.ellipse(x + 3, y + 2, 5, 2.2, 0, 0, 6.3); c.fill();
  tr(c, [[x - 3.6, y], [x + 3.6, y], [x + 3.6, yt + 4], [x - 3.6, yt + 4]]); const g = c.createLinearGradient(x - 5, 0, x + 5, 0); g.addColorStop(0, "#a9b0b6"); g.addColorStop(0.5, "#666c73"); g.addColorStop(1, "#3a3f45"); c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
  c.beginPath(); c.ellipse(x, y, 3.6, 1.6, 0, 0, Math.PI); c.fillStyle = "#3a3f45"; c.fill(); c.stroke();
  c.beginPath(); c.moveTo(x - 4, yt + 4); c.quadraticCurveTo(x - 4, yt - 3, x, yt - 4); c.quadraticCurveTo(x + 4, yt - 3, x + 4, yt + 4); c.closePath(); c.fillStyle = "#f4f4f1"; c.fill(); c.stroke();
  c.fillStyle = "rgba(255,255,255,0.8)"; c.beginPath(); c.ellipse(x - 2, yt - 1.5, 1.3, 2.4, 0, 0, 6.3); c.fill();
}
// stainless handrail between two (u,v) points, with gaps
export function railSeg(k, a, b, gaps = []) {
  const c = k.ctx, L = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(1, Math.round(L / 0.42)), z = 0.0;
  const pos = (f) => [lerp(a[0], b[0], f), lerp(a[1], b[1], f)];
  const gap = (u, v) => gaps.some(([gu, gv, r]) => Math.hypot(u - gu, v - gv) < r);
  const posts = []; for (let i = 0; i <= m; i++) { const [u, v] = pos(i / m); posts.push([u, v, gap(u, v)]); }
  for (const zz of [0.38, 0.22]) { c.beginPath(); let pen = false; for (const [u, v, g] of posts) { const p = P(u, v, zz); if (g) { pen = false; continue; } pen ? c.lineTo(...p) : c.moveTo(...p); pen = true; } c.strokeStyle = INK; c.lineWidth = zz > 0.3 ? 3 : 2.1; c.stroke(); c.strokeStyle = zz > 0.3 ? "#e3e8ea" : "#9aa3a8"; c.lineWidth = zz > 0.3 ? 1.5 : 0.9; c.stroke(); }
  for (const [u, v, g] of posts) { if (g) continue; const [x, y] = P(u, v, z), [, yt] = P(u, v, 0.4); c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt); c.stroke(); c.strokeStyle = "#b9c1c6"; c.lineWidth = 1.1; c.stroke(); }
}
export function moorPeople(k, Y, seed) {
  const c = k.ctx;
  [[0.8 * (Y.hl / 1.35), -0.08], [-0.05, 0.28]].forEach(([f, s], i) => {
    const sd = 40 + seed * 3 + i, [x, y] = Y.pt(f, s, Y.H);
    drawFig(k, x, y, sd, i);
  });
}
// tiny screen-space guest (torso + head + arm) standing on the deck
export function drawFig(k, x, y, sd, i) {
  const c = k.ctx, t = k.t, cols = ["#d9544b", "#e9c24d", "#3e6fa8", "#f6f3ec", "#2f9a7a"], col = cols[sd % cols.length], bob = Math.sin(t * 1.6 + sd) * 0.6;
  c.strokeStyle = INK; c.lineWidth = 1; c.fillStyle = "#2a2f45"; c.fillRect(x - 2, y - 5, 1.8, 5); c.fillRect(x + 0.4, y - 5, 1.8, 5);
  c.fillStyle = col; c.beginPath(); c.roundRect(x - 3, y - 12 + bob, 6, 8, 1.8); c.fill(); c.stroke();
  const arm = Math.sin(t * 2.2 + sd) > 0.7 ? -4 : 0; c.beginPath(); c.moveTo(x + 3, y - 10 + bob); c.lineTo(x + 5.5, y - 8 + bob + arm); c.stroke();
  c.fillStyle = ["#e8b48a", "#b98258", "#7a4e30"][sd % 3]; c.beginPath(); c.arc(x, y - 15 + bob, 2.7, 0, 6.3); c.fill(); c.stroke();
  c.fillStyle = ["#2a2420", "#6a4a30", "#f1d36a"][(sd >> 1) % 3]; c.beginPath(); c.arc(x, y - 16.3 + bob, 2.7, Math.PI, 0); c.fill();
}

export function pot(k, u, v, seed = 1) {
  const c = k.ctx, [x, y] = P(u, v, 0), R = rng(seed * 9 + 1);
  c.fillStyle = "rgba(60,45,30,0.16)"; c.beginPath(); c.ellipse(x + 5, y + 2, 13, 4.5, 0, 0, 6.3); c.fill();
  tr(c, [[x - 10, y - 14], [x + 10, y - 14], [x + 8, y], [x - 8, y]]); const g = c.createLinearGradient(x - 10, 0, x + 10, 0); g.addColorStop(0, "#f3e6c8"); g.addColorStop(1, "#d3bc8c"); c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
  c.beginPath(); c.ellipse(x, y, 8, 3, 0, 0, Math.PI); c.fillStyle = "#d3bc8c"; c.fill(); c.stroke();
  c.beginPath(); c.ellipse(x, y - 14, 10, 3.4, 0, 0, 6.3); c.fillStyle = "#6f8f45"; c.fill(); c.stroke();
  k._lobe(x, y - 20, 12, "#4f8a3e", seed * 31, { bumps: 8, lw: 0.9 });
  for (let i = 0; i < 20; i++) { const a = R() * 6.28, d = Math.sqrt(R()) * 11; c.fillStyle = ["#e0457a", "#f06ba8", "#c2428a", "#f7a3c4"][Math.floor(R() * 4)]; c.beginPath(); c.arc(x + Math.cos(a) * d, y - 22 + Math.sin(a) * d * 0.7, 2 + R() * 1.4, 0, 6.3); c.fill(); }
  c.fillStyle = "#f6e08a"; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(x - 6 + i * 4, y - 22 + (i % 2) * 3, 0.8, 0, 6.3); c.fill(); }
}
export function planter(k, u, v, w = 0.6) {
  const c = k.ctx;
  k.box(u, v, 0, w, 0.5, 0.16, "#ead5a8", { shadow: false, hatch: false });
  const [x, y] = P(u + w / 2, v + 0.25, 0.2);
  for (let i = -1; i <= 1; i++) k._lobe(x + i * 9, y - 3 + Math.abs(i) * 1.2, 8, i ? "#5f9a45" : "#6faa4e", u * 20 + i, { bumps: 7, lw: 0.8 });
}
export function lampM(k, u, v, h = 1.7) {
  const c = k.ctx, [x, y] = P(u, v, 0), [, yt] = P(u, v, h), glow = 0.4 + 0.2 * Math.sin(k.t * 1.2 + u);
  c.fillStyle = "rgba(60,45,30,0.15)"; c.beginPath(); c.ellipse(x + 4, y + 2, 8, 3, 0, 0, 6.3); c.fill();
  c.strokeStyle = INK; c.lineWidth = 4; c.lineCap = "round"; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt); c.stroke(); c.strokeStyle = "#3a4048"; c.lineWidth = 2.1; c.stroke();
  for (const dx of [-7, 7]) { c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(x, yt + 3); c.quadraticCurveTo(x + dx * 0.4, yt - 3, x + dx, yt - 1); c.stroke(); c.strokeStyle = "#3a4048"; c.lineWidth = 1.2; c.stroke(); c.beginPath(); c.arc(x + dx, yt + 3, 4.2, 0, 6.3); c.fillStyle = `rgba(255,243,200,${0.85 + glow * 0.15})`; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke(); }
}
export const TOPS = ["#e9553f", "#2f86d6", "#f2c744", "#2fa37a", "#e87aa6", "#f6f1e6", "#7a5bd1", "#ef8a2e"], BOTS = ["#2b3445", "#c9b690", "#3d5a80", "#f2ece0", "#5b4636"];
export function look2(sd) {
  const m = sd % 11;
  if (m === 0 || m === 5) return look(0);
  if (m === 3 || m === 8) return look(1);
  if (m === 2 || m === 9) return { style: "dress", top: TOPS[sd % 8], bottom: TOPS[(sd + 3) % 8], hat: m === 2 ? "sunhat" : null, hatCol: "#f1e6c8" };
  return { style: sd % 2 ? "tee" : "shirt", top: TOPS[(sd * 3) % 8], bottom: BOTS[sd % 5], shorts: m === 6, hat: m === 4 ? "cap" : null };
}
export function podBox(k, t, { u, v, du, dv, h, seed = 1, col = "#ecd2a2", shop = true, garden = true, flowers = false, awn = null, gr = null }) {
  const c = k.ctx, R = rng(seed * 13 + 3);
  { const e = Math.min(0.5, 9.65 - (u + du)), f = Math.min(0.15, 9.65 - (v + dv)); if (e > 0.05) k.shadow([[u + du, v, 0], [u + du + e, v + f * 0, 0], [u + du + e, Math.min(9.65, v + dv + f), 0], [u + du, v + dv, 0]], 0.09); }
  const FL = (s, z) => P(u + s, v + dv, z), FR = (s, z) => P(u + du, v + s, z);
  const fL = [FL(0, 0), FL(du, 0), FL(du, h), FL(0, h)], fR = [FR(0, 0), FR(dv, 0), FR(dv, h), FR(0, h)];
  k.path(fL, { fill: col, lw: 1.4, wobble: 0 }); k.path(fR, { fill: shade(col, -0.16), lw: 1.4, wobble: 0 });
  // upper floor windows
  const zs = 0.62, ze = h - 0.2;
  glazing(k, FL, 0.12, du - 0.12, zs, ze, Math.max(2, Math.round(du / 0.55)), { warm: false, mull: 2, frame: "#6b5638" });
  glazing(k, FR, 0.12, dv - 0.12, zs, ze, Math.max(1, Math.round(dv / 0.6)), { warm: false, mull: 2, frame: "#6b5638", dark: true });
  // ground floor: warm shopfronts
  if (shop) { glazing(k, FL, 0.1, du - 0.1, 0.06, 0.52, Math.max(2, Math.round(du / 0.62)), { warm: true, mull: 2, transom: true });
    glazing(k, FR, 0.1, dv - 0.1, 0.06, 0.52, Math.max(1, Math.round(dv / 0.62)), { warm: true, mull: 2, dark: true }); }
  // shopfront dressing: pilasters, fascia sign with lettering, striped awnings
  if (shop) {
    const SG = ["CAFE", "MARINA", "BISTRO", "GELATO", "SPA", "BOOKS", "DELI", "SUSHI"], AW = [["#d64b44", "#f7f1e6"], ["#2f7fb0", "#f7f1e6"], ["#e9a43a", "#f7f1e6"], ["#3a9a6a", "#f7f1e6"]];
    const nb = Math.max(2, Math.round(du / 0.62));
    for (let i = 0; i <= nb; i++) { const sL = 0.08 + i * (du - 0.16) / nb; k.path([FL(sL - 0.025, 0.06), FL(sL + 0.025, 0.06), FL(sL + 0.025, 0.58), FL(sL - 0.025, 0.58)], { fill: shade(col, 0.12), lw: 0.6, wobble: 0 }); }
    const nr = Math.max(1, Math.round(dv / 0.62));
    for (let i = 0; i <= nr; i++) { const sR = 0.08 + i * (dv - 0.16) / nr; k.path([FR(sR - 0.025, 0.06), FR(sR + 0.025, 0.06), FR(sR + 0.025, 0.58), FR(sR - 0.025, 0.58)], { fill: shade(col, -0.04), lw: 0.6, wobble: 0 }); }
    for (let i = 0; i < nb; i += 2) { const a = 0.1 + i * (du - 0.2) / nb, b = 0.1 + Math.min(nb, i + 2) * (du - 0.2) / nb; awningF(k, FL, a + 0.06, b - 0.06, 0.55, [0, 1], { stripes: Math.max(4, Math.round((b - a) * 6)), depth: 0.3, drop: 0.16, c1: AW[(seed + i) % 4][0], c2: AW[(seed + i) % 4][1] }); }
    for (let i = 0; i < nb; i += 2) { const a = 0.1 + i * (du - 0.2) / nb, b = 0.1 + Math.min(nb, i + 2) * (du - 0.2) / nb, sm = (a + b) / 2, [x, y] = FL(sm, 0.64);
      k.path([FL(a + 0.1, 0.6), FL(b - 0.1, 0.6), FL(b - 0.1, 0.7), FL(a + 0.1, 0.7)], { fill: "#23586f", lw: 0.8, wobble: 0 });
      c.save(); c.translate(x, y + 1); c.transform(1, 0.577, 0, 1, 0, 0); c.fillStyle = "#fbf3dc"; c.font = "700 6px sans-serif"; c.textAlign = "center"; c.fillText(SG[(seed * 3 + i) % 8], 0, 0); c.restore(); }
  }
  // cornice band + joints
  k.path([FL(0, h - 0.13), FL(du, h - 0.13), FL(du, h), FL(0, h)], { fill: shade(col, 0.08), lw: 1, wobble: 0 });
  k.path([FR(0, h - 0.13), FR(dv, h - 0.13), FR(dv, h), FR(0, h)], { fill: shade(col, -0.1), lw: 1, wobble: 0 });
  k.path([FL(0, 0.58), FL(du, 0.58), FL(du, 0.62), FL(0, 0.62)], { fill: shade(col, 0.04), lw: 0.7, wobble: 0 });
  // roof + parapet
  k.poly([[u, v, h], [u + du, v, h], [u + du, v + dv, h], [u, v + dv, h]], "#e9dcc2", { lw: 1.3, wobble: 0 });
  const w = 0.1;
  k.poly([[u + w, v + w, h], [u + du - w, v + w, h], [u + du - w, v + dv - w, h], [u + w, v + dv - w, h]], "#9db46a", { lw: 0.9, wobble: 0 });
  if (garden) {
    const n = gr ? Math.round((gr[2] - gr[0]) * (gr[3] - gr[1]) * 3.4) + 2 : Math.round(du * dv * 2.6) + 3, spots = [];
    for (let i = 0; i < n; i++) { const g = gr || [u + 0.2, v + 0.2, u + du - 0.2, v + dv - 0.2]; spots.push([lerp(g[0], g[2], R()), lerp(g[1], g[3], R()), R()]); }
    spots.sort((a, b) => a[0] + a[1] - b[0] - b[1]);
    for (const [uu, vv, r] of spots) {
      const [x, y] = P(uu, vv, h + 0.02), sw = Math.sin(t * 1.1 + r * 20) * 0.8;
      if (r < 0.2) { // small roof tree
        const [, yt] = P(uu, vv, h + 0.5);
        c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt + 4); c.stroke(); c.strokeStyle = "#8a6446"; c.lineWidth = 1.5; c.stroke();
        k._lobe(x - 5 + sw, yt - 1, 7, "#5f9a45", Math.round(r * 900), { bumps: 7, lw: 0.8 }); k._lobe(x + 5 + sw, yt, 7, "#6faa4e", Math.round(r * 900) + 1, { bumps: 7, lw: 0.8 }); k._lobe(x + sw, yt - 7, 8, "#78ae52", Math.round(r * 900) + 2, { bumps: 7, lw: 0.8 });
      } else { k._lobe(x, y - 3, 5 + r * 4, r < 0.6 ? "#5f9a45" : "#78ae52", Math.round(r * 700), { bumps: 7, lw: 0.8 }); if (flowers || r > 0.8) { c.fillStyle = ["#e0457a", "#f06ba8", "#fff", "#f4a640"][Math.floor(r * 40) % 4]; for (let j = 0; j < 4; j++) { c.beginPath(); c.arc(x + (R() - 0.5) * 9, y - 5 + (R() - 0.5) * 4, 1.4, 0, 6.3); c.fill(); } } }
    }
  }
  // parapet rail front + right (glass rail with steel top)
  const rl = (a, b) => { c.strokeStyle = "rgba(210,238,246,0.55)"; c.lineWidth = 3; c.beginPath(); c.moveTo(...P(a[0], a[1], h + 0.2)); c.lineTo(...P(b[0], b[1], h + 0.2)); c.stroke(); c.strokeStyle = "#faf6ec"; c.lineWidth = 1; c.stroke(); };
  rl([u + 0.03, v + dv - 0.03], [u + du - 0.03, v + dv - 0.03]); rl([u + du - 0.03, v + dv - 0.03], [u + du - 0.03, v + 0.03]);
  if (awn) awningF(k, FL, 0.2, du - 0.2, 0.62, [0, 1], { stripes: Math.round(du * 2.5), depth: 0.4, c1: awn[0], c2: awn[1] });
}
export function pontoon(k, p) {
  const c = k.ctx, w = 0.3, z = -0.08, [au, av] = p.A, [bu, bv] = p.B, L = Math.hypot(bu - au, bv - av), d = [(bu - au) / L, (bv - av) / L], n = [-d[1], d[0]];
  const q = (f, s, zz = z) => [au + d[0] * f + n[0] * s, av + d[1] * f + n[1] * s, zz];
  // fascia on the near sides + top deck
  const sideA = n[0] + n[1] > 0 ? 1 : -1; // which long side faces the viewer
  k.poly([q(0, sideA * w / 2, z - 0.18), q(L, sideA * w / 2, z - 0.18), q(L, sideA * w / 2, z), q(0, sideA * w / 2, z)], "#8a6440", { lw: 1.1, wobble: 0 });
  const endF = d[0] + d[1] > 0 ? L : 0;
  k.poly([q(endF, -w / 2, z - 0.18), q(endF, w / 2, z - 0.18), q(endF, w / 2, z), q(endF, -w / 2, z)], "#6f4f32", { lw: 1.1, wobble: 0 });
  k.poly([q(0, -w / 2), q(L, -w / 2), q(L, w / 2), q(0, w / 2)], "#c39560", { lw: 1.3, wobble: 0 });
  c.strokeStyle = "rgba(90,58,30,0.55)"; c.lineWidth = 0.8; c.beginPath();
  for (let f = 0.12; f < L; f += 0.12) { c.moveTo(...P(...q(f, -w / 2))); c.lineTo(...P(...q(f, w / 2))); }
  c.stroke();
  c.strokeStyle = "rgba(255,232,190,0.4)"; c.beginPath(); for (let f = 0.2; f < L; f += 0.36) { c.moveTo(...P(...q(f, -w * 0.4))); c.lineTo(...P(...q(f, -w * 0.05))); } c.stroke();
  for (let f = 0.5; f < L - 0.2; f += 0.65) { const [x, y] = P(...q(f, -sideA * w * 0.35)); c.fillStyle = "#e9e9ea"; c.fillRect(x - 2.2, y - 2.5, 4.4, 2.5); c.strokeStyle = INK; c.lineWidth = 0.7; c.strokeRect(x - 2.2, y - 2.5, 4.4, 2.5); }
}
