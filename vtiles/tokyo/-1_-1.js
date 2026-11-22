// TOKYO · Shibuya Scramble Crossing (traced over assets/tokyo/-1_-1.png) — polish pass
import { P, CTS, INK, shade, lerp, clamp, rng, hash, smooth } from "../../lib/vec-kit.js";
import { mbox, mwin, mband, faceDraw, faceSign, petals, vending, bollard, FONT, acUnit, antenna } from "./_props.js";
import { extrude, roundedRect, screenRun, edgeSign, edgeAwning, roofKit, glassHouse, roofGarden, mural } from "./_t-1_-1.js";
import { stdProj } from "./_props.js";

// crossing square and cycle
const S0 = 2.1, S1 = 7.1, T = 22;
const PED = [0.4, 13.2];      // scramble window (cars red)
const CAR_GO = 13.8, TOFF = 1.6;          // cars released
export const camera = { u: 4.6, v: 4.8, z: 0.5, zoom: 2.3 };

const pick = (b, key) => b.edges.filter((e) => e[key] > 0.9).sort((p, q) => q.L - p.L)[0];
// ---------------- the cylinder tower (109 style) ----------------
function cylinderTower(k, t) {
  const c = k.ctx, u = 1.6, v = 1.4, r = 0.74, H = 5.45, [x, y] = P(u, v, 0), [, yt] = P(u, v, H);
  const rx = r * CTS.S * Math.SQRT2, ry = rx * CTS.YS;
  k.cyl(u, v, 0, r, H, "#e7dccb");
  // tile grid on the shaft
  c.save(); c.beginPath(); c.moveTo(x - rx, yt); c.lineTo(x - rx, y); c.ellipse(x, y, rx, ry, 0, Math.PI, 0, true); c.lineTo(x + rx, yt); c.closePath(); c.clip();
  c.strokeStyle = "rgba(120,105,90,0.2)"; c.lineWidth = 0.6;
  for (let i = 1; i < 60; i++) { const yy = y - i * 7.2; c.beginPath(); c.ellipse(x, yy, rx, ry, 0, 0, Math.PI); c.stroke(); }
  for (let i = -7; i <= 7; i++) { const a = i / 7.5 * rx; c.beginPath(); c.moveTo(x + a, yt); c.lineTo(x + a, y + ry * Math.sqrt(1 - (a / rx) ** 2)); c.stroke(); }
  // shaded right side
  const g = c.createLinearGradient(x - rx, 0, x + rx, 0); g.addColorStop(0, "rgba(255,255,255,0.12)"); g.addColorStop(0.6, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(60,40,20,0.2)"); c.fillStyle = g; c.fillRect(x - rx, yt, rx * 2, y - yt + ry);
  // ground floor glass wrap (warm shop floors with shoppers)
  for (let f = 0; f < 3; f++) {
    const y0 = y - 6 - f * 24;
    for (let i = 0; i < 14; i++) {
      const a0 = Math.PI * (i / 14) + 0.02, a1 = Math.PI * ((i + 1) / 14) - 0.02, am = (a0 + a1) / 2;
      const xa = x - Math.cos(a0) * rx, xb = x - Math.cos(a1) * rx, ya = y0 + Math.sin(a0) * ry, yb = y0 + Math.sin(a1) * ry;
      const hh = hash(i * 3.3 + f * 7.1);
      c.beginPath(); c.moveTo(xa, ya); c.lineTo(xb, yb); c.lineTo(xb, yb - 19); c.lineTo(xa, ya - 19); c.closePath();
      c.fillStyle = hh < 0.85 ? ["#f4c35a", "#eeb04a", "#f8d27c"][i % 3] : "#9fb9c8"; c.fill(); c.strokeStyle = "rgba(42,36,32,0.55)"; c.lineWidth = 0.6; c.stroke();
      if (hh < 0.7) { c.fillStyle = ["#5a3a3a", "#3b4a66", "#c9567a"][i % 3]; const sx = (xa + xb) / 2, sy = (ya + yb) / 2 - 8; c.beginPath(); c.arc(sx, sy - 3, 1.7, 0, 6.3); c.fill(); c.fillRect(sx - 1.5, sy - 1.5, 3, 5); }
    }
    c.fillStyle = "#6d6a66"; c.beginPath(); c.ellipse(x, y0 - 20, rx, ry, 0, 0, Math.PI); c.lineTo(x + rx, y0 - 22); c.ellipse(x, y0 - 22, rx, ry, 0, Math.PI, 0, true); c.fill();
  }
  // vertical glass slit up the left (stair void) and right
  c.fillStyle = "rgba(143,168,191,0.0)"; c.restore();
  // entrance canopy
  c.beginPath(); c.ellipse(x, y - 78, rx * 0.8, ry * 0.8, 0, 0, Math.PI); c.lineTo(x + rx * 0.8, y - 84); c.ellipse(x, y - 84, rx * 0.8, ry * 0.8, 0, Math.PI, 0, true); c.fillStyle = "#6e9aa8"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  // curved mural screen on the front
  const w = rx * 1.45, sy0 = y - 92, sy1 = y - 200, bow = 14, left = x - w / 2, right = x + w / 2;
  c.save(); c.beginPath(); c.moveTo(left, sy0 - bow * 0.2); c.quadraticCurveTo(x, sy0 + bow * 1.1, right, sy0 - bow * 0.2); c.lineTo(right, sy1 - bow * 0.2); c.quadraticCurveTo(x, sy1 + bow * 1.1, left, sy1 - bow * 0.2); c.closePath(); c.clip();
  c.translate(left, sy1 - 4); mural(c, w, sy0 - sy1 + 26, t, 0, ["渋谷", "SHIBUYA", "TOKYO"]);
  c.restore();
  c.beginPath(); c.moveTo(left, sy0 - bow * 0.2); c.quadraticCurveTo(x, sy0 + bow * 1.1, right, sy0 - bow * 0.2); c.lineTo(right, sy1 - bow * 0.2); c.quadraticCurveTo(x, sy1 + bow * 1.1, left, sy1 - bow * 0.2); c.closePath(); c.strokeStyle = INK; c.lineWidth = 1.8; c.stroke();
  // roof ring + plant
  c.beginPath(); c.ellipse(x, yt, rx - 5, ry - 3, 0, 0, 6.3); c.strokeStyle = "rgba(60,50,40,0.5)"; c.lineWidth = 1.2; c.stroke();
  for (const [dx, dz, s] of [[-24, -4, 1.1], [6, -8, 1.5], [26, -2, 0.9], [-4, 4, 0.8]]) { const rx2 = x + dx, ry2 = yt + dz; c.fillStyle = "#d6d1c5"; c.strokeStyle = INK; c.lineWidth = 1; c.fillRect(rx2 - 8 * s, ry2 - 14 * s, 16 * s, 12 * s); c.strokeRect(rx2 - 8 * s, ry2 - 14 * s, 16 * s, 12 * s); c.beginPath(); c.ellipse(rx2, ry2 - 14 * s, 8 * s, 3.5 * s, 0, 0, 6.3); c.fillStyle = "#6c7480"; c.fill(); c.stroke(); const a = t * 9 + dx; c.beginPath(); c.moveTo(rx2 - Math.cos(a) * 7 * s, ry2 - 14 * s - Math.sin(a) * 3 * s); c.lineTo(rx2 + Math.cos(a) * 7 * s, ry2 - 14 * s + Math.sin(a) * 3 * s); c.stroke(); }
  for (const [dx, h2] of [[28, 38], [34, 30], [18, 26]]) antenna(k, x + dx, yt + 2, h2, { light: dx === 28, seed: dx });
}

// ---------------- generic tower with mural ----------------
function tower(k, u0, v0, u1, v1, h, o = {}) {
  const b = extrude(k, roundedRect(u0, v0, u1, v1, 0, ""), h, { col: o.col || "#e9dfcb", lit: o.lit ?? 0.3, seed: o.seed || 1, glass: o.glass, floors: o.floors, cell: o.cell, warmFloors: o.warm ?? 0 });
  roofKit(k, u0, v0, u1, v1, h, o.seed || 1, { ac: o.ac ?? 3, antenna: o.antenna ?? 1 });
  return b;
}

// big curved glass block (QFRONT style): rounded corner, shop floors, mural, roof garden + glass house
function glassBlock(k, t, o) {
  const { u0, v0, u1, v1, rad, corner, h } = o;
  const pts = roundedRect(u0, v0, u1, v1, rad, corner, 8);
  const b = extrude(k, pts, h, { col: "#e6dcc8", glass: "#a9bfc9", glassFrom: 0.15, glassTo: h - 0.18, floors: Math.round(h / 0.42), warmFloors: 4, lit: 0.18, seed: o.seed, cell: 0.3 });
  return { b, pts };
}

// ---------------- Hachiko + plinth ----------------
function hachiko(k, u, v, t) {
  const c = k.ctx, [x, y] = P(u, v, 0);
  k.ell(u + 0.25, v + 0.15, 0, 0.9, "rgba(60,45,30,0.16)", { stroke: false });
  k.box(u - 0.5, v - 0.5, 0, 1.0, 1.0, 0.18, "#cfc4b4", { hatch: false, shadow: false });
  k.box(u - 0.38, v - 0.38, 0.18, 0.76, 0.76, 0.72, "#b6ada0", { hatch: false, shadow: false });
  const by = y - 40;
  const B = "#8c6a3a", BD = "#5e4524", BL = "#b78f55";
  c.beginPath(); c.ellipse(x, by - 4, 11, 14, 0, 0, 6.3); c.fillStyle = B; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
  c.beginPath(); c.ellipse(x + 3, by + 8, 12, 6, 0, 0, 6.3); c.fillStyle = BD; c.fill(); c.stroke();
  c.beginPath(); c.ellipse(x - 1, by - 22, 7, 7.5, 0, 0, 6.3); c.fillStyle = BL; c.fill(); c.stroke();
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x - 1 + s * 3, by - 26); c.lineTo(x - 1 + s * 7, by - 39); c.lineTo(x - 1 + s * 8, by - 24); c.closePath(); c.fillStyle = B; c.fill(); c.stroke(); }
  c.beginPath(); c.moveTo(x - 4, by - 20); c.lineTo(x - 12, by - 19); c.lineTo(x - 5, by - 16); c.fillStyle = BL; c.fill(); c.stroke();
  c.fillStyle = INK; c.fillRect(x - 4, by - 24, 1.6, 1.8);
  c.strokeStyle = BD; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 11, by + 8); c.quadraticCurveTo(x + 18, by + 6, x + 19 + Math.sin(t * 5) * 2.5, by - 2); c.stroke();
  // plaque
  c.fillStyle = "#4a3a24"; c.fillRect(x - 6, y - 21, 12, 7); c.fillStyle = "#e9dcb4"; c.font = `bold 6px ${FONT}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("忠犬ハチ公", x, y - 17.5, 11);
}

// ---------------- green Toden tram (stops, loads) ----------------
function tram(k, u, v, t) {
  const c = k.ctx, G = "#4f8f5f", W = "#e9e4d0", len = 3.0, wid = 0.95, h = 0.95;
  k.ell(u + len / 2 + 0.2, v + wid / 2 + 0.1, 0, 1.4, "rgba(60,45,30,0.14)", { stroke: false });
  const b = mbox(k, stdProj, u, v, 0.12, len, wid, h, G, { wobble: 0, top: "#d9d4c0", left: "#58a06a", right: "#3c7449" });
  mband(k, b, "L", h * 0.55, h * 0.68, W, { s0: 0, s1: 1 });
  mwin(k, b, "L", { rows: 1, cols: 7, z0: h * 0.3, z1: h * 0.9, color: "#e9d9a0", lit: 0.8, gap: 0.2, mx: 0.04, seed: 2 });
  mwin(k, b, "R", { rows: 1, cols: 2, z0: h * 0.3, z1: h * 0.9, color: "#cfe3ec", gap: 0.3, mx: 0.1 });
  faceDraw(k, b, "L", 0.02, 0.22, h * 0.02, h * 0.25, 100, 60, (g, w, h2) => { g.fillStyle = "#f2efe6"; g.fillRect(0, 0, w, h2); g.fillStyle = "#1c5a38"; g.font = `bold 40px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("都電", w / 2, h2 / 2); });
  faceDraw(k, b, "L", 0.3, 0.7, h * 0.7, h * 0.97, 160, 40, (g, w, h2) => { g.fillStyle = "#101820"; g.fillRect(0, 0, w, h2); g.fillStyle = "#ffb347"; g.font = `bold 30px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; const o = (t * 40) % (w + 140); g.fillText("渋谷駅前 ゆき", w - o + 30, h2 / 2); });
  const [px, py] = P(u + len * 0.5, v + wid * 0.5, 0.12 + h);
  c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath(); c.moveTo(px - 8, py); c.lineTo(px, py - 10); c.lineTo(px + 8, py); c.moveTo(px - 8, py - 12); c.lineTo(px + 8, py - 10); c.stroke();
}

// ---------------- pedestrians ----------------
const KERB = [
  (f) => [1.75, lerp(2.6, 6.6, f)],   // back-left side, walks +u
  (f) => [lerp(2.6, 6.6, f), 1.75],   // back-right side, walks +v
  (f) => [lerp(4.2, 6.7, f), 7.45],    // front-left, walks -v
  (f) => [7.45, lerp(4.2, 6.7, f)],    // front-right, walks -u
];
function pedState(i, t) {
  t += TOFF; const n = Math.floor(t / T), ph = t - n * T;
  let side = i % 4, f = ((i >> 2) + hash(i * 1.7 + 4) * 0.8) / 24 % 1;
  let a = KERB[side](f), b = a, dside = side, g = f;
  for (let q = 0; q <= n; q++) {
    a = KERB[side](f);
    { const r = hash(i * 7.7 + q * 3.1); dside = r < 0.68 ? (side + 2) % 4 : r < 0.84 ? (side + 1) % 4 : (side + 3) % 4; }
    g = hash(i * 5.3 + q * 2.9 + 1);
    b = KERB[dside](g);
    if (q < n) { side = dside; f = g; }
  }
  { const ddx = b[0] - a[0], ddy = b[1] - a[1], LL = Math.hypot(ddx, ddy) || 1, off = (hash(i * 4.1 + n * 1.9) - 0.5) * 1.3; if (side !== undefined) { a = [a[0] - ddy / LL * off * 0.0, a[1]]; } var sh = [-ddy / LL * off, ddx / LL * off]; }
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
  const start = PED[0] + hash(i * 9.1 + n * 1.3) * 3.2, spd = 0.78 + hash(i * 2.2 + n) * 0.4, dur = L / spd;
  const fr = clamp((ph - start) / dur), moving = fr > 0 && fr < 1;
  const e = fr; // constant pace, tiny ease at ends
  const w = Math.sin(fr * Math.PI * 4 + i) * 0.05 * moving; // sidestep weave
  let u = lerp(a[0], b[0], e) - dy / L * w + sh[0] * Math.sin(fr * Math.PI), v = lerp(a[1], b[1], e) + dx / L * w + sh[1] * Math.sin(fr * Math.PI);
  let dir = [dx / L, dy / L];
  if (!moving) {
    const cc = fr <= 0 ? a : b;
    u = cc[0]; v = cc[1];
    // face the crossing while waiting, face away after arriving
    const inward = [[1, 0.0], [0.0, 1], [0, -1], [-1, 0]][fr <= 0 ? side : dside];
    dir = inward;
    if (fr >= 1) dir = [-inward[0], -inward[1]]; // arrived: walks on, faces away
  }
  return { u, v, moving, dir, dist: fr * L };
}
const PED_OUT = [
  { style: "shirt", top: "#2f3e5e", bottom: "#25334b", bag: true }, { style: "dress", top: "#f2c9d0", bottom: "#c9567a", hairStyle: "long" }, { style: "coat", top: "#3c3c3c", bottom: "#3c3c3c", bag: true },
  { style: "tee", top: "#e8c14a", bottom: "#4a5a7a" }, { style: "stripes", top: "#f2efe6", bottom: "#25334b", bag: true }, { style: "skirt", top: "#7b5fa8", bottom: "#3c3c3c" },
  { style: "shirt", top: "#f2efe6", bottom: "#4b3c31", bag: true, bagCol: "#2a2420" }, { style: "tee", top: "#d9544b", bottom: "#2f3e5e", hat: "cap" }, { style: "dress", top: "#e88c3d", bottom: "#4b3c31" },
  { style: "coat", top: "#6a7f9a", bottom: "#2f3e5e" }, { style: "tee", top: "#4a8f8a", bottom: "#4b3c31" }, { style: "skirt", top: "#f2efe6", bottom: "#c9567a", hairStyle: "long" },
];

function umbrella(k, u, v, col) {
  const c = k.ctx, [x, y] = P(u, v, 0), top = y - 30;
  c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, y - 14); c.lineTo(x, top); c.stroke();
  c.beginPath(); c.ellipse(x, top + 2, 10, 4.5, 0, Math.PI, 0); c.lineTo(x + 10, top + 2); c.quadraticCurveTo(x, top + 6, x - 10, top + 2); c.fillStyle = col; c.fill(); c.lineWidth = 1.3; c.stroke();
}

// ---------------- cars on the L-shaped road wrapping the back corner ----------------
const ROADS = [
  // outer lane: from left stub (heading -v) turn toward +u out of the right stub
  { pts: [[2.75, 10.4], [2.75, 4.2], [2.8, 3.4], [3.3, 2.85], [4.2, 2.8], [10.4, 2.8]], stop: 6.9 + 0 },
  // inner lane: from right stub (heading -u) turn toward +v out of the left stub
  { pts: [[10.4, 3.35], [4.4, 3.35], [3.6, 3.4], [3.3, 3.8], [3.3, 4.6], [3.3, 10.4]], stop: 6.9 },
];
function pathInfo(pts) { const seg = []; let L = 0; for (let i = 0; i < pts.length - 1; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); seg.push([L, l]); L += l; } return { seg, L }; }
function pathAt(pts, info, s) {
  s = clamp(s, 0, info.L);
  let i = 0; while (i < info.seg.length - 1 && s > info.seg[i][0] + info.seg[i][1]) i++;
  const [s0, l] = info.seg[i], f = (s - s0) / l, A = pts[i], B = pts[i + 1];
  const dx = B[0] - A[0], dy = B[1] - A[1];
  return { u: A[0] + dx * f, v: A[1] + dy * f, dir: Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "u+" : "u-") : (dy > 0 ? "v+" : "v-") };
}
const CARCOL = ["#d64e46", "#f2efe6", "#2b3f5c", "#e8c14a", "#9aa7b3", "#3f73b5", "#5f9e6e", "#f2efe6"];
function traffic(k, t) {
  t += TOFF; const ph = ((t % T) + T) % T, rel = ((ph - CAR_GO) % T + T) % T; // time since release
  ROADS.forEach((rd, ri) => {
    const info = pathInfo(rd.pts);
    // path distance of the stop line: first point where the path reaches the crossing edge
    const stopS = 10.4 - 7.55;
    for (let q = 0; q < 3; q++) {
      const slot = stopS - q * 1.15, delay = q * 0.55;
      let s;
      const go = rel - delay;
      if (rel < 8.5) { // moving through (release then exit)
        if (go <= 0) s = slot; else { const f = clamp(go / 6.2); s = slot + (info.L + 1.2 - slot) * f * f * (3 - 2 * f) * 0.35 + (info.L + 1.2 - slot) * 0.65 * f * f; }
      } else { // approach new slot during red
        const f = clamp((rel - 8.5 - q * 1.1) / 7.2); s = lerp(-1.2, slot, 1 - Math.pow(1 - f, 2.2));
        if (rel - 8.5 - q * 1.1 < 0) s = -1.3;
      }
      if (s < -1 || s > info.L + 1) continue;
      const p = pathAt(rd.pts, info, s);
      k.q(p.u + p.v + 0.3, () => k.car(p.u, p.v, p.dir, CARCOL[(ri * 3 + q * 2 + 1) % CARCOL.length], { len: 0.85, wid: 0.45 }));
    }
  });
}

// ---------------- sidewalk walkers ----------------
const R = (pts, o = {}) => [pts, o];
const WALKS = [
  [[1.75, 3.2], [1.75, 6.6]], [[1.9, 6.8], [1.9, 3.0]], [[3.0, 1.75], [6.6, 1.75]], [[6.8, 1.9], [3.0, 1.9]],
  [[7.45, 4.2], [7.45, 6.7]], [[7.6, 6.6], [7.6, 4.1]], [[4.2, 7.5], [6.7, 7.5]], [[6.6, 7.65], [4.1, 7.65]],
  [[0.6, 2.0], [1.7, 2.0], [2.3, 1.2]], [[1.8, 8.9], [2.5, 8.9], [3.0, 7.6]], [[2.0, 9.4], [3.6, 9.4]], [[9.2, 2.4], [8.4, 2.1], [7.0, 1.9]],
  [[9.3, 4.2], [9.3, 5.4]], [[8.6, 6.8], [9.1, 7.6], [9.3, 9.0]], [[5.3, 9.3], [6.6, 9.3]], [[3.4, 0.9], [4.4, 1.4]],
];

// ground
function ground(k) {
  const c = k.ctx;
  k.groundTrace({}, { paved: "#e6d8c4", side: "#e3d3b0", stipple: 5 });
  c.save(); c.beginPath(); [P(0, 0), P(10, 0), P(10, 10), P(0, 10)].forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.clip();
  // pink plaza paving (front)
  k.ground([[S1 + 0.4, 4.0], [10, 4.0], [10, 10], [4.0, 10], [4.0, S1 + 0.4], [S1 + 0.4, S1 + 0.4]], "#e5ccc0", { stroke: false });
  // paving joints
  c.strokeStyle = "rgba(140,110,90,0.2)"; c.lineWidth = 0.7; c.beginPath(); for (let i = 0; i <= 40; i++) { const f = i * 0.25; c.moveTo(...P(f, 0)); c.lineTo(...P(f, 10)); c.moveTo(...P(0, f)); c.lineTo(...P(10, f)); } c.stroke();
  // asphalt: the square + the two stubs (L road)
  const asph = "#a9a6aa";
  k.ground([[S0, S0], [S1, S0], [S1, S1], [S0, S1]], asph, { stroke: false });
  k.ground([[S0, S1 - 0.1], [3.7, S1 - 0.1], [3.7, 10], [S0, 10]], asph, { stroke: false });
  k.ground([[S1 - 0.1, S0], [10, S0], [10, 3.7], [S1 - 0.1, 3.7]], asph, { stroke: false });
  const Rr = rng(5); c.fillStyle = "rgba(60,60,70,0.22)"; for (let i = 0; i < 700; i++) { const a = lerp(S0, S1, Rr()), b = lerp(S0, S1, Rr()); const [x, y] = P(a, b); c.fillRect(x, y, 1.3, 1); }
  // tactile yellow kerb strips
  c.strokeStyle = "#e9c24a"; c.lineWidth = 3; c.beginPath();
  const seg = (a, b) => { c.moveTo(...P(a[0], a[1])); c.lineTo(...P(b[0], b[1])); };
  seg([S0 - 0.12, S0 - 0.12], [S0 - 0.12, S1 + 0.1]); seg([S0 - 0.12, S0 - 0.12], [S1 + 0.1, S0 - 0.12]);
  seg([3.8, S1 + 0.12], [S1 + 0.12, S1 + 0.12]); seg([S1 + 0.12, 3.8], [S1 + 0.12, S1 + 0.12]);
  seg([S0 - 0.12, S1 + 0.12], [S0 - 0.12, 10]); seg([3.82, S1 + 0.12], [3.82, 10]); seg([S1 + 0.12, S0 - 0.12], [10, S0 - 0.12]); seg([S1 + 0.12, 3.82], [10, 3.82]);
  c.stroke();
  // stop lines + lane dashes on stubs
  c.fillStyle = "rgba(255,255,255,0.95)";
  const bar = (u0, v0, u1, v1) => { c.beginPath(); [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].forEach(([a, b], i) => (i ? c.lineTo(...P(a, b)) : c.moveTo(...P(a, b)))); c.closePath(); c.fill(); };
  bar(S0 + 0.05, S1 - 0.15, 3.65, S1 - 0.05); bar(S1 - 0.15, S0 + 0.05, S1 - 0.05, 3.65);
  c.setLineDash([9, 8]); c.strokeStyle = "rgba(255,255,255,0.9)"; c.lineWidth = 1.6; c.beginPath(); seg([3.0, 7.4], [3.0, 10]); seg([7.4, 3.0], [10, 3.0]); c.stroke(); c.setLineDash([]);
  // zebra on 4 sides
  const zebra = (axis, e0, e1, lo, hi, step = 0.34, wd = 0.18) => { for (let s = lo; s < hi; s += step) axis === "u" ? bar(s, e0, s + wd, e1) : bar(e0, s, e1, s + wd); };
  c.fillStyle = "rgba(255,255,255,0.93)";
  zebra("v", S0 + 0.05, S0 + 0.6, S0 + 0.6, S1 - 0.6, 0.3, 0.14);
  zebra("u", S0 + 0.05, S0 + 0.6, S0 + 0.6, S1 - 0.6, 0.3, 0.14);
  zebra("v", S1 - 0.65, S1 - 0.05, S0 + 0.6, S1 - 0.6, 0.3, 0.14);
  zebra("u", S1 - 0.65, S1 - 0.05, S0 + 0.6, S1 - 0.6, 0.3, 0.14);
  // diagonals: bands of bars
  const diag = (A, B) => {
    const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy), ex = dx / L, ey = dy / L, nx = -ey, ny = ex;
    for (let s = 1.0; s < L - 1.0; s += 0.42) {
      const p = [A[0] + ex * s, A[1] + ey * s], hw = 0.62, w1 = 0.07;
      c.beginPath(); [[p[0] - nx * hw - ex * w1, p[1] - ny * hw - ey * w1], [p[0] + nx * hw - ex * w1, p[1] + ny * hw - ey * w1], [p[0] + nx * hw + ex * w1, p[1] + ny * hw + ey * w1], [p[0] - nx * hw + ex * w1, p[1] - ny * hw + ey * w1]].forEach(([a, b], i) => (i ? c.lineTo(...P(a, b)) : c.moveTo(...P(a, b)))); c.closePath(); c.fill();
    }
  };
  diag([S0, S0], [S1, S1]); diag([S1, S0], [S0, S1]);
  c.restore();
}

function signal(k, u, v, go) {
  const c = k.ctx, [x, y] = P(u, v, 0), [, yt] = P(u, v, 1.8);
  c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt); c.stroke(); c.strokeStyle = "#4a4f57"; c.lineWidth = 1.6; c.stroke();
  c.fillStyle = "#2a2a30"; c.beginPath(); c.roundRect(x - 6, yt - 8, 12, 17, 3); c.fill(); c.stroke();
  for (let i = 0; i < 3; i++) { c.fillStyle = (i === 0 && go === 2) || (i === 2 && go === 1) ? (go === 2 ? "#ff4040" : "#35e07a") : "#3a3a40"; c.beginPath(); c.arc(x, yt - 4 + i * 5.5, 2, 0, 6.3); c.fill(); }
}

// ===================================================================
export default function draw(k, t) {
  const c = k.ctx;
  ground(k);
  const ph = (((t + TOFF) % T) + T) % T, pedGo = ph >= PED[0] - 0.3 && ph <= PED[1] + 0.5;

  // ---------- buildings ----------
  // back tower behind the cylinder, left (orange mural)
  k.q(0.3, () => { const b = tower(k, 0.0, 1.2, 1.15, 3.3, 5.1, { seed: 3, ac: 4, antenna: 2, col: "#e8ddc9" }); screenRun(k, b, [pick(b, 'nu')?.i ?? 0].filter((x) => x !== undefined), 0.1, 0.9, 1.1, 4.4, { seed: 3 }); edgeSign(k, pick(b, 'nv') || b.edges[0], 0, 0.15, 0.4, 3.0, 4.1, "カフェ", { vertical: true, ar: 0.35, bg: "#c2402f", seed: 1 }); });
  k.q(0.6, () => cylinderTower(k, t));
  // right of the cylinder: two blocks with murals
  k.q(1.4, () => { const b = tower(k, 2.55, 0.1, 3.4, 1.5, 4.5, { seed: 6, ac: 3, antenna: 1 }); const e = pick(b, 'nu'); if (e) screenRun(k, b, [e.i], 0.12, 0.88, 1.0, 3.8, { seed: 1 }); roofGarden(k, [[2.7, 0.3], [2.95, 0.55], [3.2, 0.3]], 4.5, 4); });
  k.q(1.9, () => { const b = tower(k, 3.4, 0.0, 4.5, 1.0, 3.7, { seed: 8, ac: 2, antenna: 0 }); const e = pick(b, 'nu'); if (e) screenRun(k, b, [e.i], 0.12, 0.88, 0.9, 3.1, { seed: 2 }); });
  // left: tower B with big mural on its u+ face, A (curved glass) in front
  k.q(3.2, () => { const b = tower(k, 0.0, 3.5, 1.0, 5.1, 4.5, { seed: 11, ac: 4, antenna: 2, col: "#ece2cf" }); const e = pick(b, 'nu'); if (e) screenRun(k, b, [e.i], 0.12, 0.92, 0.9, 3.9, { seed: 1, ar: 0.7 }); roofGarden(k, [[0.2, 3.7], [0.5, 3.9]], 4.5, 9); });
  // A2: upper setback behind A
  k.q(5.3, () => { const b = tower(k, 0.0, 5.2, 1.2, 7.4, 4.9, { seed: 13, ac: 5, antenna: 3, glass: "#a9bfc9", warm: 0, floors: 3, cell: 0.34 }); });
  k.q(9.0, () => {
    const { b, pts } = glassBlock(k, t, { u0: 0.0, v0: 5.0, u1: 1.6, v1: 8.1, rad: 1.1, corner: "uv", h: 3.6, seed: 5 });
    // mural wraps the round corner + u+ face
    const idx = b.edges.map((e) => e.i).sort((p, q) => q - p);
    screenRun(k, b, idx, 0.2, 0.72, 1.35, 3.1, { seed: 3, ar: 1.8 });
    const flat = pick(b, 'nu');
    const flatV = pick(b, 'nv');
    if (flat) edgeAwning(k, flat, 0, 0.05, 0.95, 0.75, "#e0516a", 0.3);
    if (flatV) { edgeAwning(k, flatV, 0, 0.1, 0.9, 0.8, "#e0516a", 0.28); edgeSign(k, flatV, 0, 0.12, 0.5, 0.95, 1.5, "ファッション", { ar: 2.6, bg: "#f2efe6", fg: "#c0392b", size: 44, border: "#c0392b" }); }
    roofGarden(k, [[0.2, 5.3], [0.55, 5.5], [0.9, 5.9], [1.1, 6.3], [1.3, 6.9], [1.2, 7.5]], 3.6, 17);
    glassHouse(k, 0.2, 5.5, 0.9, 1.3, 3.6, 0.55);
    roofKit(k, 0.1, 6.9, 0.9, 7.8, 3.6, 21, { ac: 3 });
    // vending machines
    vending(k, 1.5, 8.35, { side: "R", col: "#3f73b5", seed: 1 }); vending(k, 1.5, 8.85, { side: "R", col: "#d8392f", seed: 2 });
  });
  k.q(8.5, () => { const b = tower(k, 0.0, 8.1, 1.3, 9.3, 3.1, { seed: 51, ac: 2, antenna: 0, col: "#e6d8c6" }); const e = pick(b, 'nv'); if (e) screenRun(k, b, [e.i], 0.1, 0.9, 0.9, 2.6, { seed: 3, ar: 0.9 }); });
  // right: QFRONT-style curved glass block + annex
  k.q(2.2, () => { // annex (back right strip) first
    const b = tower(k, 8.7, 0.0, 9.7, 3.0, 3.4, { seed: 31, ac: 3, antenna: 1, col: "#e6dcc8" });
    roofGarden(k, [[9.1, 2.4], [9.35, 2.6], [9.6, 2.8]], 3.4, 33);
  });
  k.q(4.6, () => {
    const { b } = glassBlock(k, t, { u0: 4.9, v0: 0.0, u1: 8.8, v1: 1.65, rad: 0.9, corner: "Uv", h: 3.9, seed: 7 });
    const idx = b.edges.map((e) => e.i).sort((p, q) => p - q);
    // mural on the long v+ face
    const flatV = pick(b, 'nv');
    if (flatV) screenRun(k, b, [flatV.i], 0.08, 0.5, 1.3, 3.2, { seed: 2, ar: 1.7 });
    if (flatV) { edgeAwning(k, flatV, 0, 0.55, 0.97, 0.78, "#f2efe6", 0.25, "#d9544b"); edgeSign(k, flatV, 0, 0.58, 0.9, 1.0, 1.5, "SHIBUYA 109", { ar: 3.4, bg: "#101820", fg: "#ffd24a", size: 38, blink: true }); }
    glassHouse(k, 6.0, 0.4, 1.6, 0.9, 3.9, 0.6);
    roofGarden(k, [[5.3, 0.4], [5.7, 1.4], [6.3, 1.6], [7.0, 1.6], [7.7, 1.55], [8.4, 1.6]], 3.9, 41);
    roofKit(k, 7.4, 0.2, 8.9, 1.2, 3.9, 43, { ac: 5, antenna: 2 });
    const rf = pick(b, 'nu');
    if (rf) edgeSign(k, rf, 0, 0.1, 0.4, 0.4, 3.2, "カラオケ", { vertical: true, ar: 0.3, bg: "#a12b52", seed: 5 });
    vending(k, 8.9, 3.05, { side: "L", col: "#d8392f", seed: 3 });
  });

  // ---------- street trees, lamps, signals, bollards ----------
  for (const [tu, tv, s] of [[1.3, 3.2, 1], [1.9, 3.9, 2], [2.9, 1.0, 3], [3.7, 1.7, 4], [9.5, 4.8, 5], [0.7, 9.4, 6], [1.0, 5.5, 7], [6.0, 9.4, 8]]) k.q(tu + tv + 0.5, () => k.tree(tu, tv, { r: 0.62, h: 1.8, seed: s + 40, col: "#a3c25a" }));
  k.q(4.3, () => k.lamp(2.0, 2.45, { col: "#2f3a30", h: 1.9 })); k.q(7.9, () => k.lamp(1.85, 6.3, { col: "#2f3a30", h: 1.9 })); k.q(7.7, () => k.lamp(6.3, 1.85, { col: "#2f3a30", h: 1.9 })); k.q(14, () => k.lamp(7.6, 7.6, { col: "#2f3a30", h: 1.9 }));
  for (const [bx, by] of [[2.1, 7.2], [2.1, 9.7], [3.7, 9.7], [7.3, 2.1], [9.7, 2.1], [9.7, 3.7], [7.2, 7.2], [4.1, 7.2], [9.2, 9.6], [8.3, 9.7]]) k.q(bx + by, () => bollard(k, bx, by));
  k.q(8.0, () => signal(k, 1.9, 5.8, pedGo ? 2 : 1)); k.q(6.0, () => signal(k, 5.8, 1.9, pedGo ? 2 : 1)); k.q(14.5, () => signal(k, 7.5, 7.5, pedGo ? 1 : 2));

  // ---------- plaza ----------
  k.q(14.5, () => hachiko(k, 7.6, 7.8, t));
  k.q(17.0, () => { k.box(6.8, 9.2, 0, 1.7, 0.7, 0.22, "#b8a690", { hatch: false, shadow: false }); k.flowers(6.95, 9.3, 1.3, 0.45, { seed: 3 }); });
  k.q(13.5, () => { k.box(5.6, 7.7, 0, 1.3, 0.9, 0.22, "#b8a690", { hatch: false, shadow: false }); k.flowers(5.8, 7.85, 0.9, 0.6, { seed: 4 }); });
    k.q(13.0, () => { k.box(9.0, 6.6, 0, 0.9, 1.2, 0.22, "#b8a690", { hatch: false, shadow: false }); k.flowers(9.1, 6.8, 0.6, 0.9, { seed: 5 }); });
  k.q(19.0, () => k.tree(5.2, 9.5, { r: 1.15, h: 1.7, seed: 8, col: "#f2b3c7" })); k.q(13.5, () => k.tree(9.0, 4.9, { r: 1.05, h: 1.7, seed: 9, col: "#f2b3c7" }));
  k.q(15.5, () => { k.bench(5.5, 9.2, { along: "u" }); k.bench(8.2, 9.5, { along: "u" }); k.bench(9.5, 8.1, { along: "v" }); });
  k.q(12.8, () => tram(k, 7.2, 5.6, t));
  // tram queue + people around Hachiko + sitters
  const around = [[6.7, 7.6, [1, 0.3], "photo"], [7.1, 8.5, [0.3, -1], "stand"], [8.5, 8.4, [-1, -0.2], "stand"], [8.2, 7.2, [-0.6, 1], "photo"], [6.6, 8.3, [1, 0], "stand"], [8.6, 7.7, [-1, 0], "stand"], [7.3, 6.9, [0.2, 1], "stand"], [8.0, 8.9, [0, -1], "stand"]];
  around.forEach(([pu, pv, d, pose], i) => k.qperson(pu, pv, { pose, dir: d, seed: 150 + i, scale: 0.62 }));
  [[7.0, 6.35], [7.6, 6.45], [8.3, 6.5]].forEach(([pu, pv], i) => k.qperson(pu, pv, { pose: "stand", dir: [0.1, -1], seed: 170 + i, scale: 0.62 }));
  k.qperson(5.6, 9.45, { pose: "sit", seatZ: 0.3, bench: true, dir: [0, -1], seed: 160 }); k.qperson(8.3, 9.75, { pose: "sit", seatZ: 0.3, bench: true, dir: [0, -1], seed: 161 });

  // ---------- traffic ----------
  traffic(k, t);

  // ---------- the scramble ----------
  const NPED = 96;
  for (let i = 0; i < NPED; i++) {
    const s = pedState(i, t), o = PED_OUT[i % PED_OUT.length];
    k.q(s.u + s.v, () => {
      const base = { ...o, seed: 500 + i, hat: o.hat ?? null };
      if (s.moving) {
        k.person(s.u, s.v, { ...base, scale: 0.44, kid: false, pose: "walk", p: s.dist / 0.27 + i * 0.37, dir: s.dir });
        if (i % 13 === 0) umbrella(k, s.u, s.v, ["#e84a5f", "#f2c14e", "#4aa3a0", "#7a9fd0"][i % 4]);
      } else k.person(s.u, s.v, { ...base, scale: 0.44, kid: false, pose: "stand", dir: s.dir });
    });
  }
  // sidewalk walkers
  WALKS.forEach((r, i) => { for (let j = 0; j < 2; j++) k.qwalker(r, { speed: 0.42 + ((i + j) % 4) * 0.04, offset: j * 0.5 + i * 0.1, seed: 600 + i * 2 + j, dwell: 0.8 + (i % 3) * 0.5, ...PED_OUT[(i + j * 3) % PED_OUT.length], hat: null, scale: 0.44, kid: false }); });
  k.flush();
  petals(k, 140, 560, 520, 900, 12, { seed: 2 }); petals(k, 560, 520, 900, 860, 12, { seed: 5 });
  k.circlingBird(480, 140, 80, 22, { speed: 0.5 }); k.cloud(220, 200, { s: 0.8, phase: 1 }); k.cloud(800, 160, { s: 0.7, phase: 2 });
}
