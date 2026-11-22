// SHANGHAI · Zhujiajiao water town (grid pass).
// Layout (u,v): main canal along v (u 4.2-6.2, v 2.5-9.0, sunk) with a side canal branching along u (u 6.2-8.7, v 6.4-7.7).
// Triple-arch Fangsheng bridge crosses the main canal along u at v 3.5-4.6 (stepped ramps run through the alley v 3.35-4.7).
// Back row of houses along u (v .55-1.85), left bank row along v (u 1.3-2.7), right row along the side canal (v 4.85-6.0).
// Front half is open: cafes with umbrellas, willows, steps. Three poled sampans loop inside the canals with U-turns.
import { P, CTS, INK, shade, lerp, rng, lantern, willow, koi } from "./_props.js";
import { racetrack } from "./_h_c.js";
import { zhouse } from "./_t-1_1.js";
import { ZW, WATER, MAIN, SIDE, bridgeS, deckZ, drawBridge, mirror, mirrorBridge, steps, terrace, shrub, pot, sampanG, trail, zt, sOfU, BA, BB } from "./_g-1_1.js";

export const camera = { u: 5.3, v: 5.0, z: 1.2, zoom: 1.9 };

// ---------- depth helpers: things under the bridge draw before it, things in front of it after it ----------
const inSpan = (u) => u > 2.45 && u < 8.1;
const bd = (u, v, d) => (inSpan(u) ? (v > 4.62 ? Math.max(d, 11 + d * 0.001) : v > 3.42 ? 9.0 : d) : d);

// ---------- boats ----------
const LOOP_A = { cu: 5.2, cv: 5.6, hl: 2.35, ro: 0.45 };
const posA = (d) => racetrack(LOOP_A.cu, LOOP_A.cv, LOOP_A.hl, LOOP_A.ro, d, "v");
const posC = (d) => racetrack(7.35, 7.05, 0.5, 0.3, d, "u");
const LA = 2 * (2 * LOOP_A.hl) + 2 * Math.PI * LOOP_A.ro, LC = 2 * (2 * 0.5) + 2 * Math.PI * 0.3;
const BOATS = [
  (t) => ({ pos: posA, d: t * 0.5 + 0.0, s: 0.8, o: { ph: 0, seed: 11 }, pas: [[0.74, 0, 61]] }),
  (t) => ({ pos: posA, d: t * 0.5 + LA / 2, s: 0.8, o: { ph: 2, seed: 12, stripe: "#2f6c8f" }, pas: [[0.74, 0, 62]] }),
  (t) => ({ pos: posC, d: t * 0.34 + 0.4, s: 0.62, o: { ph: 4, seed: 13, stripe: "#e0a63a" }, pas: [[0.74, 0, 63]] }),
];

// ---------- ground ----------
const LAND = [[0, 4.2, 0, 10], [4.2, 6.2, 0, 2.5], [4.2, 6.2, 9.0, 10], [6.2, 10, 0, 6.4], [6.2, 8.7, 7.7, 10], [8.7, 10, 6.4, 10]];
const PAVE = "#d6cbb2", PAVE2 = "#cbbe9f", COPING = "#efe6cf";
const rect = (u0, u1, v0, v1, z = 0) => [[u0, v0, z], [u1, v0, z], [u1, v1, z], [u0, v1, z]];

function canals(k, t) {
  const c = k.ctx, W2 = WATER.map(([u, v]) => P(u, v, ZW));
  const g = c.createLinearGradient(...P(4, 2, ZW), ...P(8, 9, ZW)); g.addColorStop(0, "#5fb5a4"); g.addColorStop(0.5, "#3f9d90"); g.addColorStop(1, "#318a82");
  k.path(W2, { fill: g, lw: 1.4, wobble: 0 });
  k.water(WATER, { color: null, z: ZW, seed: 17, density: 4, flow: 0.4, dir: [0.2, 1] });
  c.save(); k._trace(W2, true, 0); c.clip();
  // shade under the bridge and along the walls
  c.strokeStyle = "rgba(15,70,70,0.28)"; c.lineWidth = 10; c.beginPath(); c.moveTo(...P(4.2 + 0.1, 2.5, ZW)); c.lineTo(...P(4.2 + 0.1, 9.0, ZW)); c.moveTo(...P(4.2, 2.5 + 0.1, ZW)); c.lineTo(...P(6.2, 2.5 + 0.1, ZW)); c.moveTo(...P(6.2, 6.4 + 0.1, ZW)); c.lineTo(...P(8.7, 6.4 + 0.1, ZW)); c.stroke();
  k.poly(rect(4.2, 6.2, 3.45, 4.7, ZW), "rgba(10,60,60,0.3)", { stroke: false });
  // reflections: bridge, houses
  mirrorBridge(k, t);
  const HB = (f1, h) => [["#b9ae98", 0.16], ["#8d5d38", f1 - 0.16], ["#f4efe3", h - f1], ["#58524c", 0.6]];
  mirror(k, t, [
    { axis: "v", fixed: 1.85, a0: 3.85, a1: 5.25, bands: HB(1.45, 2.9) }, { axis: "v", fixed: 1.85, a0: 5.4, a1: 6.7, bands: HB(1.2, 2.4) },
    { axis: "u", fixed: 2.7, a0: 4.7, a1: 6.0, bands: HB(1.05, 2.1) }, { axis: "u", fixed: 2.7, a0: 6.1, a1: 7.45, bands: HB(0.9, 1.8) },
    { axis: "v", fixed: 6.0, a0: 8.45, a1: 9.5, bands: HB(0.95, 1.9), a: 0.5 },
  ]);
  // lantern reflections (red + gold glints)
  const R = rng(9);
  for (let i = 0; i < 26; i++) {
    const inS = i % 4 === 0, u = inS ? 6.5 + R() * 2.0 : 4.4 + R() * 1.6, v = inS ? 6.55 + R() * 1.0 : 3.0 + R() * 5.7, s = 0.5 + 0.5 * Math.sin(t * (1.4 + R()) + R() * 9);
    const [x, y] = P(u, v, ZW); c.fillStyle = `rgba(${i % 3 ? "230,70,50" : "240,190,80"},${0.3 + 0.4 * s})`; c.fillRect(x - 1.4, y, 2.8, 7 + s * 5);
  }
  // wakes behind each boat
  for (const mk of BOATS) { const b = mk(t); trail(k, b.pos, b.d, { w: b.s }); }
  c.restore();
  // stone quay walls facing the viewer: left wall of the main canal, back wall (canal end), back wall of the side canal
  const wall = (pts, col) => k.poly(pts, col, { lw: 1.1, wobble: 0 });
  wall([[4.2, 2.5, ZW], [4.2, 9.0, ZW], [4.2, 9.0, 0], [4.2, 2.5, 0]], "#b9a27a");
  wall([[4.2, 2.5, ZW], [6.2, 2.5, ZW], [6.2, 2.5, 0], [4.2, 2.5, 0]], "#d3bd94");
  wall([[6.2, 6.4, ZW], [8.7, 6.4, ZW], [8.7, 6.4, 0], [6.2, 6.4, 0]], "#d3bd94");
  c.strokeStyle = "rgba(110,80,44,0.4)"; c.lineWidth = 0.7; c.beginPath();
  c.moveTo(...P(4.2, 2.5, ZW / 2)); c.lineTo(...P(4.2, 9.0, ZW / 2));
  for (let v = 2.7, r = 0; v < 9.0; v += 0.42, r++) { c.moveTo(...P(4.2, v, r % 2 ? 0 : ZW / 2)); c.lineTo(...P(4.2, v, r % 2 ? ZW / 2 : ZW)); }
  for (const [u0, u1, v] of [[4.2, 6.2, 2.5], [6.2, 8.7, 6.4]]) { c.moveTo(...P(u0, v, ZW / 2)); c.lineTo(...P(u1, v, ZW / 2)); for (let u = u0 + 0.2, r = 0; u < u1; u += 0.42, r++) { c.moveTo(...P(u, v, r % 2 ? 0 : ZW / 2)); c.lineTo(...P(u, v, r % 2 ? ZW / 2 : ZW)); } }
  c.stroke();
  c.strokeStyle = "rgba(40,90,80,0.35)"; c.lineWidth = 2; c.beginPath(); c.moveTo(...P(4.2, 2.5, ZW + 0.03)); c.lineTo(...P(4.2, 9.0, ZW + 0.03)); c.moveTo(...P(4.2, 2.5, ZW + 0.03)); c.lineTo(...P(6.2, 2.5, ZW + 0.03)); c.moveTo(...P(6.2, 6.4, ZW + 0.03)); c.lineTo(...P(8.7, 6.4, ZW + 0.03)); c.stroke();
}

function land(k) {
  const c = k.ctx;
  for (const [u0, u1, v0, v1] of LAND) k.poly(rect(u0, u1, v0, v1), PAVE, { stroke: false });
  // promenades and lanes (all on land)
  const lanes = [[0.3, 9.7, 1.85, 2.5], [2.7, 4.2, 2.5, 9.7], [6.2, 7.1, 2.5, 6.4], [6.2, 9.7, 6.0, 6.4], [0.3, 9.7, 3.35, 4.7], [4.2, 6.2, 9.0, 9.7]];
  for (const [u0, u1, v0, v1] of lanes) {
    if (u0 < 4.2 && u1 > 4.2 && v0 >= 2.5 && v1 <= 9.0 && u0 !== 2.7) { k.poly(rect(u0, 4.2, v0, v1), PAVE2, { stroke: false }); k.poly(rect(6.2, u1, v0, v1), PAVE2, { stroke: false }); continue; }
    k.poly(rect(u0, u1, v0, v1), PAVE2, { stroke: false });
  }
  // the lanes above are clipped below to the land pieces by redrawing the canal edge land over them
  // cobbles
  c.save(); c.strokeStyle = "rgba(140,115,80,0.3)"; c.lineWidth = 0.7;
  for (const [u0, u1, v0, v1] of LAND) {
    c.save(); c.beginPath(); rect(u0, u1, v0, v1).forEach((p, i) => { const [x, y] = P(...p); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); c.clip(); c.beginPath();
    for (let v = Math.ceil(v0 / 0.5) * 0.5; v < v1; v += 0.5) { c.moveTo(...P(u0, v)); c.lineTo(...P(u1, v)); }
    for (let u = Math.ceil(u0 / 0.5) * 0.5; u < u1; u += 0.5) for (let v = v0; v < v1; v += 1.0) { const o = (Math.round(u / 0.5) % 2) * 0.5, a = Math.max(v0, v + o), b = Math.min(v1, v + o + 0.5); if (b > a) { c.moveTo(...P(u, a)); c.lineTo(...P(u, b)); } }
    c.stroke(); c.restore();
  }
  c.restore();
  // coping lips along every water edge (light stone), and the stone kerb faces on the front sides
  const cp = (u0, u1, v0, v1) => k.poly(rect(u0, u1, v0, v1), COPING, { lw: 0.8, wobble: 0 });
  cp(4.08, 4.2, 2.38, 9.0); cp(4.2, 6.2, 2.38, 2.5); cp(6.2, 6.32, 2.38, 6.4); cp(6.2, 6.32, 7.7, 9.0); cp(4.2, 6.2, 9.0, 9.12);
  cp(6.2, 8.7, 6.28, 6.4); cp(8.7, 8.82, 6.4, 7.7); cp(6.2, 8.7, 7.7, 7.82);
  // front-side stone faces (the wall tops you see from above) as thin courses
  c.strokeStyle = "rgba(90,70,45,0.4)"; c.lineWidth = 0.7; c.beginPath();
  for (let v = 2.5; v < 9; v += 0.3) { c.moveTo(...P(4.08, v)); c.lineTo(...P(4.2, v)); }
  c.stroke();
  // tunnel shade under the side arches
  k.poly(rect(3.3, 4.1, 3.5, 4.6), "rgba(60,45,30,0.16)", { stroke: false }); k.poly(rect(6.3, 7.1, 3.5, 4.6), "rgba(60,45,30,0.16)", { stroke: false });
  k.poly([[0, 0, 0], [10, 0, 0], [10, 10, 0], [0, 10, 0]], null, { lw: 1.6 });
}

// ---------- houses ----------
const HOUSES = [
  // back row (ridge u, facade on the left face toward the back lane)
  [0.6, 0.55, 1.6, 1.3, 2.2, { ridge: "u", up: "timber", seed: 21 }],
  [2.35, 0.55, 1.35, 1.3, 2.5, { ridge: "u", up: "white", seed: 22 }],
  [3.85, 0.55, 1.4, 1.3, 2.9, { ridge: "u", up: "timber", seed: 23, sign: "茶馆", f1: 1.45 }],
  [5.4, 0.55, 1.3, 1.3, 2.4, { ridge: "u", up: "white", seed: 24 }],
  [6.85, 0.55, 1.3, 1.3, 2.1, { ridge: "u", up: "timber", seed: 25 }],
  [8.3, 0.55, 1.2, 1.3, 2.6, { ridge: "u", up: "white", seed: 26 }],
  // left: alley shop + two bank houses (ridge v, facade on the right face toward the canal quay)
  [0.8, 2.35, 1.4, 0.95, 2.0, { ridge: "u", up: "white", seed: 27 }],
  [1.3, 4.7, 1.4, 1.3, 2.1, { ridge: "v", up: "timber", seed: 28 }],
  [1.3, 6.1, 1.4, 1.35, 1.8, { ridge: "v", up: "white", seed: 29 }],
  // right: two houses along the side canal quay (ridge u, facade toward the side canal)
  [8.45, 5.0, 1.05, 1.0, 1.9, { ridge: "u", up: "timber", seed: 31, sign: "酒家" }],
];

export default function draw(k, t) {
  const c = k.ctx;
  k.slab(PAVE, { side: "#e0d3b0" });
  k.stipple([[0, 0], [10, 0], [10, 10], [0, 10]], { density: 7 });
  canals(k, t);
  land(k);
  steps(k, 4.2, 5.45, "u", 3); steps(k, 4.2, 7.45, "u", 3, { w: 0.7 }); steps(k, 8.7, 6.85, "-u", 3, { w: 0.6 }); steps(k, 4.85, 9.0, "-v", 3, { w: 0.9 });

  // ---------- back greenery ----------
  k.q(1.5, () => k.tree(0.55, 3.3, { h: 1.9, r: 0.7, seed: 8, col: "#9bbd5c" }));
  k.q(6.0, () => k.tree(9.1, 3.1, { h: 1.9, r: 0.62, seed: 21, col: "#9bbd5c" }));
  k.q(7.0, () => k.tree(0.55, 7.0, { h: 1.9, r: 0.62, seed: 3, col: "#8fb55a" }));

  // ---------- houses ----------
  for (const [u, v, du, dv, h, o] of HOUSES) k.q(u + du + v + dv - 0.3, () => zhouse(k, u, v, du, dv, h, o));

  // ---------- willows ----------
  k.q(6.2, () => willow(k, 3.95, 2.3, 2.9, 3));
  k.q(11.0, () => willow(k, 2.0, 9.0, 2.4, 5));
  k.q(16.5, () => willow(k, 9.5, 6.9, 2.3, 7));

  // ---------- cafes on the quays ----------
  const Q = (u, v, fn, e = 0) => k.q(bd(u, v, u + v + e), fn);
  Q(3.05, 5.45, () => terrace(k, 3.05, 5.45, "#e8b94a"), 0.25); Q(3.05, 6.75, () => terrace(k, 3.05, 6.75, "#c9382f"), 0.25); Q(3.05, 7.95, () => terrace(k, 3.05, 7.95, "#d8602f"), 0.25);
  Q(7.3, 8.75, () => terrace(k, 7.3, 8.75, "#e8b94a"), 0.25); Q(8.5, 9.1, () => terrace(k, 8.5, 9.1, "#c9382f"), 0.25); Q(9.15, 7.95, () => terrace(k, 9.15, 7.95, "#d8602f"), 0.25); Q(8.0, 5.45, () => terrace(k, 8.0, 5.45, "#e8b94a"), 0.25);
  const seat = (u, v, seed, dir, pose = "sit") => Q(u, v, () => k.person(u, v, { pose, bench: true, seatZ: 0.26, dir, seed }), 0.3);
  seat(2.75, 5.5, 51, [1, 0.1]); seat(3.35, 5.62, 52, [-1, 0.1]); seat(2.75, 6.8, 53, [1, 0.1]); seat(3.35, 6.93, 54, [-1, 0.1]);
  seat(7.0, 8.8, 55, [1, 0.1]); seat(7.6, 8.93, 56, [-1, 0.1]); seat(8.85, 8.05, 57, [-1, 0.1]); seat(7.7, 5.5, 58, [1, 0.1]); seat(8.3, 5.62, 59, [-1, 0.1]);

  // ---------- shrubs, flower tubs, lanterns on the quays ----------
  [[0.5, 0.45, 0.4], [0.45, 4.1, 0.42], [0.5, 5.4, 0.4], [0.5, 9.4, 0.42], [1.5, 9.5, 0.4], [2.5, 9.55, 0.38], [9.5, 2.4, 0.38], [9.5, 3.3, 0.36], [9.5, 5.0, 0.4], [9.55, 9.5, 0.42], [9.45, 6.6, 0.36], [8.1, 9.55, 0.38], [6.5, 9.55, 0.36], [5.2, 9.5, 0.34], [1.2, 8.2, 0.4], [0.7, 8.8, 0.38]]
    .forEach(([u, v, r], i) => Q(u, v, () => shrub(k, u, v, { r, seed: 70 + i, pink: i % 4 === 3 ? null : (i % 2 ? "#f08bb5" : "#e8607a") }), 0.3));
  for (let v = 2.9; v < 9.4; v += 0.62) { if (v > 3.3 && v < 4.7) continue; Q(4.05, v, () => pot(k, 4.05, v, Math.round(v * 10)), 0.35); }
  for (let v = 2.9; v < 6.0; v += 0.62) { if (v > 3.3 && v < 4.7) continue; Q(6.38, v, () => pot(k, 6.38, v, Math.round(v * 10) + 5), 0.35); }
  for (let u = 6.7; u < 8.6; u += 0.55) Q(u, 6.2, () => pot(k, u, 6.2, Math.round(u * 10) + 9), 0.35);
  for (let u = 6.5; u < 8.6; u += 0.6) Q(u, 7.9, () => pot(k, u, 7.9, Math.round(u * 10) + 3), 0.35);
  // lantern string across the main canal on two wooden posts
  const PA = [4.05, 8.15, 1.75], PB = [6.4, 8.15, 1.75];
  k.q(12.6, () => {
    for (const [u, v, z] of [PA, PB]) { c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.moveTo(...P(u, v, 0)); c.lineTo(...P(u, v, z)); c.stroke(); c.strokeStyle = "#8a5a36"; c.lineWidth = 1.8; c.stroke(); }
    const pa = P(...PA), pb = P(...PB); c.strokeStyle = "rgba(40,30,20,0.85)"; c.lineWidth = 1; c.beginPath(); c.moveTo(...pa); c.quadraticCurveTo((pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2 + 18, ...pb); c.stroke();
    for (let i = 1; i < 6; i++) { const f = i / 6; lantern(k, lerp(pa[0], pb[0], f), lerp(pa[1], pb[1], f) + 18 * 2 * f * (1 - f), { s: 0.75, ph: i * 1.3 }); }
  });

  // ---------- bridge ----------
  drawBridge(k, t, (d, f) => k.q(d, f));

  // ---------- boats ----------
  for (const mk of BOATS) {
    const b = mk(t), p = b.pos(b.d);
    k.q(bd(p.u, p.v, p.u + p.v + 0.2), () => {
      const r = sampanG(k, p.u, p.v, p.ang, { ...b.o, s: b.s });
      for (const [x, y, seed] of b.pas) {
        const pu = p.u + Math.cos(p.ang) * x * b.s - Math.sin(p.ang) * y * b.s, pv = p.v + Math.sin(p.ang) * x * b.s + Math.cos(p.ang) * y * b.s;
        k.person(pu, pv, { z: r.z, seed, pose: "sit", bench: true, seatZ: r.z + 0.1, dir: [-Math.cos(p.ang), -Math.sin(p.ang)], shadow: false, kid: seed % 2 === 0 });
      }
    });
  }
  // koi
  for (const [cu, cv, ph, col] of [[5.2, 8.3, 0, "#f08a3c"], [7.4, 7.1, 2, "#f4f0e6"], [4.7, 3.0, 1, "#e0502f"]]) { const a = t * 0.6 + ph, u = cu + Math.cos(a) * 0.3, v = cv + Math.sin(a) * 0.2; const [x, y] = P(u, v, ZW), [x2, y2] = P(u - Math.sin(a) * 0.7, v + Math.cos(a) * 0.5, ZW); k.q(bd(u, v, u + v - 0.1), () => koi(k, x, y, Math.atan2(y2 - y, x2 - x), { s: 0.8, col, ph })); }

  // ---------- people ----------
  const walk = (path, o, deck = false) => {
    const s = k.walkerState(path, o), u = s.u, v = s.v, onDeck = deck && u > BA[0] + 0.05 && u < BB[0] - 0.05;
    const d = onDeck ? 10.4 + (u + v) * 0.001 : bd(u, v, u + v + 0.05);
    k.q(d, () => k.person(u, v, { ...o, dir: [s.du, s.dv], pose: s.moving ? "walk" : (o.idle || "stand"), p: s.p, z: deck ? deckZ(u) : 0 }));
  };
  // bridge: two lanes on the deck + a through route from the alley to the east garden
  const lane = (off, a = 0.0, b = 1.0) => [0, 0.25, 0.5, 0.75, 1].map((f) => bridgeS(lerp(a, b, f), off));
  walk(lane(-0.2), { speed: 0.4, offset: 0.0, seed: 41, dwell: 1.2 }, true);
  walk(lane(0.2), { speed: 0.4, offset: 0.5, seed: 42, dwell: 1.2 }, true);
  walk(lane(-0.08), { speed: 0.34, offset: 0.78, seed: 45, dwell: 1.6 }, true);
  walk(lane(0.08), { speed: 0.36, offset: 0.25, seed: 46, dwell: 1.4 }, true);
  walk([[0.9, 4.02], [2.4, 4.02], [5.2, 4.02], [8.0, 4.02], [9.2, 4.02]], { speed: 0.38, offset: 0.35, seed: 47, dwell: 1.5 }, true);
  walk([[9.2, 4.12], [8.0, 4.12], [5.2, 4.12], [2.4, 4.12], [0.9, 4.12]], { speed: 0.36, offset: 0.1, seed: 48, dwell: 1.5 }, true);
  { const p1 = bridgeS(0.42, 0.32), p2 = bridgeS(0.55, 0.32);
    k.q(10.5, () => k.person(p1[0], p1[1], { pose: "photo", dir: [0.7, 0.7], seed: 43, z: zt(0.42) }));
    k.q(10.5, () => k.person(p2[0], p2[1], { pose: "wave", dir: [0.7, 0.7], seed: 44, z: zt(0.55), kid: true })); }
  // quay promenades (through the arches), back lane, plaza, garden
  walk([[3.8, 2.7], [3.8, 8.9]], { speed: 0.36, offset: 0.1, seed: 21, dwell: 1.6 });
  walk([[3.7, 8.9], [3.7, 2.8]], { speed: 0.32, offset: 0.55, seed: 23, dwell: 1.8 });
  walk([[6.62, 2.8], [6.62, 6.1]], { speed: 0.34, offset: 0.2, seed: 24, dwell: 1.6 });
  walk([[2.6, 2.2], [9.2, 2.2]], { speed: 0.36, offset: 0.0, seed: 25, dwell: 1.4 });
  walk([[9.2, 2.2], [2.6, 2.2]], { speed: 0.32, offset: 0.4, seed: 26, dwell: 1.8 });
  walk([[6.5, 8.2], [9.3, 8.2]], { speed: 0.34, offset: 0.2, seed: 27, dwell: 1.4 });
  walk([[9.3, 8.35], [6.6, 8.35]], { speed: 0.3, offset: 0.6, seed: 28, dwell: 2.0 });
  walk([[1.0, 8.5], [3.4, 8.5]], { speed: 0.3, offset: 0.3, seed: 29, dwell: 1.6 });
  walk([[8.9, 6.2], [6.6, 6.2]], { speed: 0.3, offset: 0.5, seed: 30, dwell: 1.6 });
  k.q(bd(5.6, 9.45, 15.0), () => k.person(5.6, 9.45, { pose: "photo", dir: [0, -1], seed: 49 }));
  k.flush();
  // ---------- sky ----------
  k.circlingBird(480, 260, 90, 22, { speed: 0.6, phase: 0 }); k.circlingBird(640, 330, 60, 18, { speed: -0.5, phase: 2 });
  k.cloud(180, 300, { s: 0.8, phase: 1 }); k.cloud(820, 240, { s: 0.7, phase: 3 });
}
