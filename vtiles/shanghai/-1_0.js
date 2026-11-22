// SHANGHAI · Century Park (grid pass): everything laid out in (u,v) inside 0.4..9.6.
// Lake back-right (u 5.1-9.3, v 0.8-4.3), tai chi lawn front-left (u 1.5-5.8, v 5.5-8.7), a looping path between
// and round them, kite meadow front-right, willows on the lake shore, cherry + oak groves round the edges.
import { P, INK, pad, shade, lerp, clamp, rng, hash, smooth, boatWake, rowBoat, kite, taiChi, buildSkel, drawPerson,
  chaikin, ribbon, makeLoop, inPoly, distToPoly, oakUV, bushUV, cherryUV, willowUV, padUV, lotusUV, stoneUV, reedsUV } from "./_g-1_0.js";

export const camera = { u: 4.8, v: 4.6, z: 0.3, zoom: 2.2 };

// ---------- layout ----------
const LAKE = chaikin([[5.3, 2.7], [5.55, 1.7], [6.4, 1.05], [7.5, 0.85], [8.7, 0.95], [9.25, 1.6], [9.3, 2.8], [9.1, 3.7], [8.2, 4.25], [7.1, 3.95], [6.2, 4.3], [5.5, 3.95], [5.2, 3.3]], 3, true);
const RING_PTS = [[1.05, 3.0], [2.2, 4.15], [4.0, 4.85], [6.2, 5.25], [8.1, 5.3], [8.8, 6.0], [8.8, 7.5], [8.1, 8.5], [6.5, 8.7], [4.5, 8.7], [2.4, 8.6], [1.35, 8.0], [1.05, 6.6], [1.05, 4.6]];
const RING = chaikin(RING_PTS, 3, true);
const LOOP = makeLoop(RING);
const PATH_W = 0.9;

const FLOWERS = [
  [[[2.9, 5.35], [3.8, 5.55], [4.7, 5.7]], 0.5, 41, ["#f08bb5", "#ffffff", "#e8607a"]],
  [[[1.7, 3.4], [2.2, 3.0]], 0.36, 42, ["#f39ac0", "#ffffff"]],
  [[[5.9, 6.2], [6.9, 6.35], [8.0, 6.3]], 0.5, 44, ["#f08bb5", "#ffffff", "#e8607a"]],
  [[[1.75, 5.7], [1.8, 6.4]], 0.34, 45, ["#f4c542", "#e9813c"]],
  [[[5.4, 8.15], [6.0, 8.2], [6.5, 8.15]], 0.5, 48, ["#f08bb5", "#ffffff", "#e8607a", "#f7b6cf"]],
  [[[3.2, 8.0], [3.9, 8.1]], 0.34, 46, ["#f4c542", "#f4c542", "#e9813c"]],
  [[[5.3, 3.95], [4.5, 3.6]], 0.34, 52, ["#f4c542", "#e9813c"]],
];

// lotus pads in the lake: dense by the shore, open water in the middle for the boats
const BOATC = [7.3, 2.55], BOATR = [1.4, 0.85];
const PADS = (() => {
  const R = rng(77), out = [];
  let tries = 0;
  while (out.length < 120 && tries++ < 8000) {
    const u = 5.2 + R() * 4.2, v = 0.8 + R() * 3.5;
    if (!inPoly(LAKE, u, v)) continue;
    const d = distToPoly(LAKE, u, v), pr = d < 0.35 ? 0.95 : d < 0.7 ? 0.5 : d < 1.0 ? 0.16 : 0.03;
    if (R() > pr) continue;
    if (Math.hypot((u - BOATC[0]) / (BOATR[0] + 0.55), (v - BOATC[1]) / (BOATR[1] + 0.45)) < 1) continue;
    if (out.some((p) => Math.hypot(p.u - u, (p.v - v)) < 0.34)) continue;
    out.push({ u, v, r: 8 + R() * 6, rot: R() * 6.28, fl: R() < 0.32 ? (R() < 0.2 ? 2 : 1) : 0, ph: R() * 6.28, sz: 4.6 + R() * 2.6 });
  }
  return out;
})();
const STONES = (() => {
  const R = rng(31), out = [];
  for (let i = 0; i < LAKE.length; i++) {
    const a = LAKE[i], b = LAKE[(i + 1) % LAKE.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let s = R() * 0.3; s < L; s += 0.38 + R() * 0.3) {
      const f = s / L, u = lerp(a[0], b[0], f), v = lerp(a[1], b[1], f);
      if (v < 1.25) continue; // under the willows at the back
      out.push({ u, v, r: 5.5 + R() * 4.5, seed: out.length });
    }
  }
  return out;
})();

// boats follow one loop in the same direction half a lap apart, so they never meet; period 52 s
const OM = (Math.PI * 2) / 52;
function boatState(ph, t) {
  const a = OM * t + ph, u = BOATC[0] + Math.cos(a) * BOATR[0], v = BOATC[1] + Math.sin(a) * BOATR[1];
  const du = -Math.sin(a) * BOATR[0], dv = Math.cos(a) * BOATR[1];
  return { u, v, ang: Math.atan2(dv, du) };
}

function stroller(k, u, v, du, dv) {
  const c = k.ctx, L = Math.hypot(du, dv) || 1, [x, y] = P(u + (du / L) * 0.34, v + (dv / L) * 0.34, 0);
  c.fillStyle = "rgba(60,45,30,0.18)"; c.beginPath(); c.ellipse(x + 2, y + 1, 14, 5, 0, 0, 7); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.2; c.fillStyle = "#3c5473";
  c.beginPath(); c.moveTo(x - 9, y - 6); c.lineTo(x + 9, y - 6); c.lineTo(x + 8, y - 14); c.lineTo(x - 8, y - 14); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = "#e8d9a4"; c.beginPath(); c.arc(x - 1, y - 14, 9, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = INK; for (const dx of [-7, 7]) { c.beginPath(); c.arc(x + dx, y - 1.5, 3, 0, 7); c.fill(); }
}

export default function draw(k, t) {
  const c = k.ctx;
  // ---------- ground ----------
  k.groundTrace({ lawn: [[[0.7, 0.7], [9.3, 0.7], [9.3, 9.3], [0.7, 9.3]]], water: [] }, { lawn: "#a6c457", paved: "#efe4c8", side: "#ebdcb4", tufts: 16 });
  c.save(); k._trace([P(0.3, 0.3), P(9.7, 0.3), P(9.7, 9.7), P(0.3, 9.7)], true, 0); c.clip();
  { const [gx, gy] = P(3.5, 6.8, 0); const g = c.createRadialGradient(gx, gy, 20, gx, gy, 330); g.addColorStop(0, "rgba(226,230,120,0.45)"); g.addColorStop(0.55, "rgba(190,210,90,0.1)"); g.addColorStop(1, "rgba(70,110,40,0.28)"); k.ground([[0.7, 0.7], [9.3, 0.7], [9.3, 9.3], [0.7, 9.3]], g, { stroke: false }); }
  // soft mowing stripes on the tai chi lawn
  c.globalAlpha = 0.6; for (let i = 0; i < 5; i++) k.ground([[1.5 + i * 0.9, 5.5], [1.95 + i * 0.9, 5.5], [1.95 + i * 0.9, 8.6], [1.5 + i * 0.9, 8.6]], "rgba(255,255,200,0.07)", { stroke: false }); c.globalAlpha = 1;
  // curved path: a closed loop round the lake and the lawn
  {
    const outer = ribbon(RING, PATH_W, true), inner = ribbon(RING, PATH_W - 0.14, true);
    k.ground(outer, "#e3c690", { stroke: false });
    k.ground(inner, "#fbe6bd", { stroke: false });
    const R = rng(9); c.fillStyle = "rgba(190,150,100,0.45)";
    for (let i = 0; i < 260; i++) { const [u, v] = LOOP.at(R(), (R() - 0.5) * PATH_W * 0.7), [x, y] = P(u, v, 0); c.fillRect(x, y, 1.5, 1.1); }
    c.strokeStyle = "rgba(120,90,50,0.55)"; c.lineWidth = 1.2;
    for (const off of [PATH_W / 2, -PATH_W / 2]) { c.beginPath(); for (let i = 0; i <= 160; i++) { const [u, v] = LOOP.at(i / 160, off), [x, y] = P(u, v, 0); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
  }
  c.restore();
  // ---------- lake ----------
  k.ground(LAKE, null, { stroke: "#7c8a57", lw: 9 });
  k.water(LAKE, { color: "#8cc8b8", seed: 7, density: 0.5, flow: 0.4 });
  { const [, y0] = P(7, 0.8, 0), [, y1] = P(7, 4.3, 0); const g = c.createLinearGradient(0, y0, 0, y1 + 70); g.addColorStop(0, "rgba(40,110,100,0.5)"); g.addColorStop(0.35, "rgba(70,150,140,0.18)"); g.addColorStop(0.7, "rgba(210,245,230,0.12)"); g.addColorStop(1, "rgba(60,130,120,0.25)"); k.ground(LAKE, g, { stroke: false }); }
  // tree reflections + sun glints, clipped to the lake
  c.save(); c.beginPath(); LAKE.forEach(([u, v], i) => { const [x, y] = P(u, v, 0); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.clip();
  for (const [u, v, w, h, col] of [[6.3, 1.25, 70, 30, "rgba(60,95,45,0.4)"], [8.1, 1.15, 56, 24, "rgba(70,100,50,0.38)"], [5.5, 3.0, 24, 40, "rgba(80,110,50,0.35)"], [9.1, 3.1, 24, 40, "rgba(80,110,50,0.35)"]]) { const [x, y] = P(u, v, 0); c.fillStyle = col; for (let i = 0; i < 9; i++) { const px = x - w / 2 + (i / 8) * w + Math.sin(t * 1.2 + i) * 2; c.beginPath(); c.ellipse(px, y + Math.sin(t * 1.6 + i * 2) * 1.2, 3.5, h * (0.5 + 0.5 * hash(i + u * 7)), 0, 0, 7); c.fill(); } }
  const Rg = rng(55); c.fillStyle = "#ffffff"; for (let i = 0; i < 26; i++) { const u = 5.3 + Rg() * 4, v = 1 + Rg() * 3.2; const ph = Rg() * 6.28; if (!inPoly(LAKE, u, v)) continue; const [x, y] = P(u, v, 0); const a = Math.max(0, Math.sin(t * 2.2 + ph)); if (a < 0.6) continue; c.globalAlpha = (a - 0.6) * 2; c.fillRect(x - 3, y, 6, 1); c.fillRect(x, y - 1.5, 1, 3); }
  c.restore();
  // wakes, pads, shore stones
  const b1 = boatState(0.5, t), b2 = boatState(0.5 + Math.PI, t);
  boatWake(k, b1.u, b1.v, b1.ang, 0.7, 0); boatWake(k, b2.u, b2.v, b2.ang, 0.7, 2);
  for (const p of PADS) { const bob = Math.sin(t * 1.3 + p.ph) * 0.8, [x, y] = P(p.u, p.v, 0); pad(c, x, y + bob, p.r, p.rot, p.r > 11 ? "#5d9b45" : "#6aa84d"); }
  for (const s of STONES) stoneUV(c, s.u, s.v, s.r, s.seed);

  // ---------- depth-sorted scene ----------
  const Qd = (u, v, fn, bias = 0) => k.q(u + v + bias, fn);
  // back grove: oaks and bushes along the back-left and behind the lake
  Qd(1.5, 0.95, () => oakUV(k, 1.5, 0.95, { r: 0.9, h: 1.9, seed: 3, col: "#7aa84a" }));
  Qd(3.0, 0.8, () => oakUV(k, 3.0, 0.8, { r: 0.8, h: 1.8, seed: 4, col: "#86b155" }));
  Qd(4.4, 0.8, () => oakUV(k, 4.4, 0.8, { r: 0.75, h: 1.7, seed: 7, col: "#7fae4c" }));
  Qd(0.8, 2.0, () => oakUV(k, 0.8, 2.0, { r: 0.85, h: 1.9, seed: 5, col: "#8bb55a", lean: -3 }));
  Qd(2.4, 2.4, () => oakUV(k, 2.4, 2.4, { r: 0.8, h: 1.8, seed: 6, col: "#86b155" }));
  Qd(3.7, 3.0, () => oakUV(k, 3.7, 3.0, { r: 0.7, h: 1.7, seed: 8, col: "#8fb85d" }));
  Qd(1.0, 3.5, () => bushUV(k, 1.0, 3.7, { r: 0.5, seed: 25, col: "#7fae50" }));
  Qd(9.3, 0.55, () => bushUV(k, 9.3, 0.6, { r: 0.55, seed: 21, col: "#628f3e" }), -1);
  // weeping willows on the lake shore (trunks inside the footprint)
  Qd(6.2, 0.75, () => willowUV(k, 6.2, 0.75, { r: 1.0, h: 2.1, hang: 1.5, seed: 3, col: "#a8c64c" }));
  Qd(8.0, 0.65, () => willowUV(k, 8.0, 0.65, { r: 0.85, h: 1.9, hang: 1.3, seed: 4, col: "#b1cc52", tw: 7 }));
  Qd(5.0, 2.2, () => willowUV(k, 5.0, 2.2, { r: 0.8, h: 1.8, hang: 1.2, seed: 5, col: "#a5c44a" }));
  Qd(9.35, 3.5, () => willowUV(k, 9.35, 3.5, { r: 0.8, h: 1.8, hang: 1.2, seed: 6, col: "#a9c84e", tw: 9 }));
  // cherry blossom and oaks round the lawn and meadow
  Qd(0.6, 5.8, () => cherryUV(k, 0.55, 5.8, { r: 0.65, h: 1.8, seed: 31 }));
  Qd(0.6, 7.6, () => cherryUV(k, 0.55, 7.6, { r: 0.65, h: 1.7, seed: 33 }));
  Qd(3.0, 9.4, () => cherryUV(k, 3.0, 9.4, { r: 0.8, h: 1.8, seed: 35 }));
  Qd(5.4, 9.4, () => cherryUV(k, 5.4, 9.4, { r: 0.7, h: 1.6, seed: 37 }));
  Qd(9.35, 8.6, () => oakUV(k, 9.35, 8.6, { r: 0.75, h: 1.7, seed: 10, col: "#86b155" }));
  Qd(9.3, 6.6, () => bushUV(k, 9.3, 6.6, { r: 0.45, seed: 26, col: "#7fae50" }));
  Qd(5.7, 6.0, () => bushUV(k, 5.8, 5.9, { r: 0.4, seed: 27, col: "#79a84c" }));
  // flower beds
  FLOWERS.forEach(([pts, w, seed, cols]) => { const m = pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]); Qd(m[0], m[1], () => k.flowerCurve(pts, w, { seed, cols })); });
  // lamps + benches along the path
  const lampAt = (u, v, h) => Qd(u, v, () => k.lamp(u, v, { h, col: "#2c3a33" }), 0.3);
  lampAt(3.4, 5.25, 1.95); lampAt(7.2, 5.85, 1.95); lampAt(8.0, 7.7, 1.95); lampAt(1.7, 3.9, 1.45); lampAt(2.6, 8.0, 1.95); lampAt(5.8, 4.6, 1.45);
  const benchAt = (u, v, along) => Qd(u + (along === "u" ? 0.5 : 0.2), v + (along === "u" ? 0.2 : 0.5), () => k.bench(u, v, { along, len: 1.15 }));
  benchAt(6.6, 5.9, "u"); benchAt(1.6, 6.9, "v");
  // reeds at the lake corners
  for (const [u, v, n, s] of [[5.4, 3.6, 3, 1], [6.4, 4.3, 3, 2], [8.7, 4.2, 3, 3], [9.2, 2.9, 3, 4], [5.25, 2.4, 3, 5], [9.2, 1.3, 3, 6]]) Qd(u, v, () => reedsUV(k, u, v, n, s, 30 + (s % 3) * 4), 0.05);
  // lotus flowers
  for (const p of PADS) if (p.fl) Qd(p.u, p.v, () => lotusUV(c, p.u, p.v, p.sz, p.ph, t, p.fl === 2, Math.sin(t * 1.3 + p.ph) * 0.8), 0.1);

  // ---------- rowboats ----------
  Qd(b1.u, b1.v, () => rowBoat(k, b1.u, b1.v, b1.ang, { s: 0.7, ph: 0, seedA: 71, seedB: 72, hatA: "sunhat", styleA: "shirt", styleB: "dress", stroke: 2.9, h: 0.92 }), 0.4);
  Qd(b2.u, b2.v, () => rowBoat(k, b2.u, b2.v, b2.ang, { s: 0.7, ph: 2, hull: "#b88050", seedA: 73, seedB: 74, parasol: true, styleA: "shirt", styleB: "dress", stroke: 3.1, h: 0.92 }), 0.4);

  // ---------- tai chi: two rows of four, perfectly in sync ----------
  const TOP1 = ["#f4f1ea", "#e8a2b0", "#8fb0d8", "#f0cf78"], TOP2 = ["#6a7fa8", "#f1ead4", "#c85a4a", "#b79ad0"];
  const HAIRS1 = ["#b8b8b4", "#2a211c", "#1d1b1b", "#2a211c"], HAIRS2 = ["#2a211c", "#4a3424", "#1d1b1b", "#2a211c"], HS = ["short", "bun", "short", "bun"];
  const SK = ["#f1c9a5", "#e8bb92", "#f5d6bc"];
  const TU = [2.0, 2.9, 3.8, 4.7];
  [[6.4, TOP1, HAIRS1, 101, 0], [7.8, TOP2, HAIRS2, 111, 1]].forEach(([v, tops, hairs, seed, off]) => TU.forEach((u, i) => Qd(u, v, () => taiChi(k, u, v, { skin: SK[(i + off) % 3], seed: seed + i, top: tops[i], hair: hairs[i], hairStyle: HS[i], h: 1.3, phi0: 0 }), 0.2)));

  // ---------- kite flyers (front-right meadow) ----------
  const KIDS = [[6.6, 6.9, 121, "#8fb4d8", "#e2483a", "#3f8fd0", "#ffffff", 0, [7.8, 5.9, 3.9]], [7.6, 7.6, 122, "#e58aa6", "#f4c542", "#f4c542", "#e2483a", 1.7, [8.6, 6.6, 4.2]], [6.4, 7.9, 123, "#6a8caf", "#e58a3c", "#e2483a", "#f4c542", 3.1, [7.2, 7.0, 3.7]]];
  KIDS.forEach(([u, v, seed, top, bot, c1, c2, ph, kt]) => Qd(u, v, () => {
    const phi = 0.5 + Math.sin(t * 0.7 + ph) * 0.05, H = 1.0, pull = Math.sin(t * 1.1 + ph) * 0.03;
    const skel = buildSkel(H, phi, { hip: [0, 0, 0.45], lean: -0.04, shYaw: 0.2, handYaw: 0.1, feet: [[0.06, 0.1], [-0.08, -0.1]], hands: [[0.14, 0.1, 0.62 + pull], [0.1, -0.12, 0.98 + pull]] });
    const r = drawPerson(k, u, v, { pose: "custom", skel, dir: [Math.cos(phi), Math.sin(phi)], seed, h: H, kid: true, style: "tee", top, bottom: bot, hat: null, bag: false });
    const [kx, ky] = P(kt[0] + Math.sin(t * 0.9 + ph) * 0.15, kt[1] + Math.cos(t * 1.2 + ph) * 0.1, kt[2]);
    kite(k, r.hand[0], r.hand[1] - 1, kx, ky, ph, c1, c2, 1);
  }, 0.2));
  // parents watching the kites
  k.qperson(7.3, 7.2, { pose: "stand", dir: [0.7, -0.3], seed: 131, style: "shirt", top: "#8a96a8" });
  k.qperson(7.0, 7.7, { pose: "wave", dir: [0.6, -0.6], seed: 132, style: "dress", top: "#f2f2ee" });

  // ---------- walkers on the loop path ----------
  const walker = (path, o, bias = 0) => { const st = k.walkerState(path, o); k.q(st.u + st.v + bias, () => k.walker(path, o)); return st; };
  const W = (f0, f1, off, o) => walker(LOOP.lane(f0, f1, off), { h: 1.12, stride: 0.66, ...o });
  // stroller couple (back left)
  W(0.0, 0.14, -0.2, { speed: 0.2, dwell: 3.2, seed: 201, style: "coat" });
  { const path = LOOP.lane(0.0, 0.14, -0.05), o = { h: 1.12, stride: 0.66, speed: 0.2, dwell: 3.2, seed: 202, style: "dress" }; const st = walker(path, o, 0); k.q(st.u + st.v + 0.35, () => stroller(k, st.u, st.v, st.du, st.dv)); }
  // two elders in sun hats, slowly (left side)
  W(0.82, 0.93, -0.2, { speed: 0.14, dwell: 4.2, seed: 211, hair: "#9a9a96", hat: "sunhat", hatCol: "#e8dcb2", style: "shirt", top: "#4c6d9a" });
  W(0.82, 0.93, 0.0, { speed: 0.14, dwell: 4.2, seed: 212, hair: "#9a9a96", hat: "sunhat", hatCol: "#e8dcb2", style: "dress", offset: 0.008 });
  // jogger round the whole loop
  k.qwalker(LOOP.lane(0, 1, 0.22, 0.01).slice(0, -1), { h: 1.12, speed: 0.78, dwell: 0, seed: 221, shorts: true, style: "tee", top: "#e2483a", offset: 0.3, stride: 0.5, loop: true });
  // couple strolling the front path
  W(0.55, 0.7, -0.17, { speed: 0.22, dwell: 2.4, seed: 231, style: "shirt", offset: 0.4 });
  W(0.55, 0.7, 0.08, { speed: 0.22, dwell: 2.4, seed: 232, style: "dress", offset: 0.4 });
  // family (right)
  W(0.4, 0.5, -0.24, { speed: 0.17, dwell: 3.4, seed: 241, style: "shirt", top: "#8a96a8", offset: 0.1 });
  W(0.4, 0.5, -0.02, { speed: 0.17, dwell: 3.4, seed: 242, kid: true, h: 0.7, style: "tee", top: "#d9544b", offset: 0.1 });
  W(0.4, 0.5, 0.2, { speed: 0.17, dwell: 3.4, seed: 243, style: "dress", top: "#f2f2ee", offset: 0.1 });
  // walkers beside the lake
  W(0.24, 0.34, -0.12, { speed: 0.2, dwell: 2.8, seed: 251, style: "coat", offset: 0.5 });
  W(0.24, 0.34, 0.14, { speed: 0.2, dwell: 2.8, seed: 252, style: "shirt", top: "#c85a4a", offset: 0.5 });
  // readers on benches
  const sitter = (u, v, along, seed, top) => Qd(u, v, () => { const dir = along === "u" ? [0.1, -1] : [1, 0.1]; k.person(along === "u" ? u + 0.57 : u + 0.2, along === "u" ? v + 0.07 : v + 0.57, { pose: "sit", bench: true, seatZ: 0.26, dir, seed, h: 1.05, top }); }, 0.9);
  sitter(6.6, 5.9, "u", 253, "#6a9a78"); sitter(1.6, 6.9, "v", 254, "#c8b48e");

  // butterflies over the flowers
  Qd(6.0, 8.4, () => { for (let i = 0; i < 3; i++) { const a = t * 0.9 + i * 2.1, [x, y] = P(5.6 + i * 0.4 + Math.cos(a) * 0.5, 8.0 + Math.sin(a * 1.3) * 0.3, 0.7 + i * 0.15), fl = Math.abs(Math.sin(t * 12 + i)); c.fillStyle = ["#f4c542", "#ffffff", "#f08bb5"][i]; c.strokeStyle = INK; c.lineWidth = 0.7; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(x + s * 2.5 * fl, y, 3.2 * fl + 0.5, 2.4, s * 0.4, 0, 7); c.fill(); c.stroke(); } } }, 3);

  k.flush();
  { const [bx, by] = P(4.5, 2.0, 7); k.circlingBird(bx, by, 90, 22, { speed: 0.6, phase: 0 }); const [b2x, b2y] = P(7.5, 3.0, 6); k.circlingBird(b2x, b2y, 60, 18, { speed: -0.5, phase: 2 }); }
}
