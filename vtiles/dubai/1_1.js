// DUBAI · 1,1 · Al Fahidi & Dubai Creek (grid pass: everything axis-aligned and inside the 10x10 footprint)
// Layout (u,v):
//   back row along u (v 0.3-2.5): B1 u .3-2.35 (tall, tower) | alley | B2 u 3.3-5.6 | B3 u 6.0-7.8 | B4 u 8.1-9.7  (left faces -> souk)
//   left row along v (u .3-2.35): L1 v 2.9-5.0, L2 v 5.4-7.5, L3 v 7.9-9.7 (right faces -> the lane u 2.35-3.3)
//   souk on the quay v 2.5-3.3 (stalls under draped awnings), walk lanes v 3.62 / 3.98, coping at v 4.5
//   creek (sunk) u 5.6-9.7, v 4.5-9.7 behind stone quay walls; three abras loop along two lanes with U-turns.
import { P, CTS, INK, shade, lerp, rng } from "../../lib/vec-kit.js";
import { look, LF, RF, house, paving, rug, stackTable } from "./_g1_1.js";
import { WALL, WALL_L, WOOD, awning, lantern, spiceBasket, sack, urn, cloth, garland, arabLamp, bollard, bougain, shrub, opalm, abra, beam, tr, solid } from "./_t1_1.js";

export const camera = { u: 5.4, v: 3.9, z: 2.1, zoom: 1.55 };

const ZW = -0.38; // water level
const WU0 = 5.6, WV0 = 4.5, WU1 = 9.7, WV1 = 9.7; // creek basin
const SV = 2.5; // face line of the back row (left faces)
const PAVE = "#ecd5a6";

// ---------- ground ----------
function ground(k, t) {
  const c = k.ctx;
  k.slab(PAVE);
  // paving courses, a darker strip along the house fronts, the lane, and the quay edge
  paving(k, 0.3, 0.3, 9.7, 9.7, 0.5, 5);
  k.poly([[2.35, 2.5, 0], [3.3, 2.5, 0], [3.3, 9.7, 0], [2.35, 9.7, 0]], "rgba(150,110,60,0.14)", { stroke: false });
  k.poly([[3.3, 2.5, 0], [9.7, 2.5, 0], [9.7, 3.3, 0], [3.3, 3.3, 0]], "rgba(150,110,60,0.12)", { stroke: false });
  k.poly([[3.3, 4.38, 0], [9.7, 4.38, 0], [9.7, 4.5, 0], [3.3, 4.5, 0]], "#f4e4bc", { stroke: false });
  k.poly([[WU0 - 0.12, WV0, 0], [WU0, WV0, 0], [WU0, WV1, 0], [WU0 - 0.12, WV1, 0]], "#f4e4bc", { stroke: false });
  k.stipple([[0.3, 0.3], [9.7, 0.3], [9.7, 9.7], [0.3, 9.7]], { density: 6 });
  creek(k, t);
}

const REFL = [[6.4, 4.95, "#f0c64a"], [7.0, 4.95, "#e8b724"], [7.7, 4.95, "#d33c44"], [8.6, 4.95, "#e8683c"], [9.2, 4.95, "#4b82c6"], [6.0, 5.15, "#d98a5a"], [8.0, 5.1, "#f4efe4"]];
function creek(k, t) {
  const c = k.ctx, W2 = [[WU0, WV0], [WU1, WV0], [WU1, WV1], [WU0, WV1]].map(([u, v]) => P(u, v, ZW));
  const g = c.createLinearGradient(...P(WU0, WV0, ZW), ...P(WU1, WV1, ZW)); g.addColorStop(0, "#5cd0c5"); g.addColorStop(0.5, "#2fb3b4"); g.addColorStop(1, "#1f98a8");
  k.path(W2, { fill: g, lw: 1.4, wobble: 0 });
  c.save(); k._trace(W2, true, 0); c.clip();
  // quay shadow bands on the water
  c.strokeStyle = "rgba(20,70,70,0.25)"; c.lineWidth = 9; c.beginPath(); c.moveTo(...P(WU0, WV0 + 0.12, ZW)); c.lineTo(...P(WU1, WV0 + 0.12, ZW)); c.moveTo(...P(WU0 + 0.12, WV0, ZW)); c.lineTo(...P(WU0 + 0.12, WV1, ZW)); c.stroke();
  // reflections of the souk awnings: wobbling colour bars
  for (const [u, v, col] of REFL) {
    const [x, y] = P(u, v, ZW);
    for (let j = 0; j < 6; j++) { const yy = y + j * 7 + Math.sin(t * 1.4 + u * 3 + j) * 1.2, w = 8 + Math.sin(t * 1.1 + j * 1.7 + u) * 2.2; c.fillStyle = col; c.globalAlpha = 0.45 * (1 - j / 7); c.fillRect(x - w + Math.sin(t * 1.6 + j + u * 5) * 2, yy, w * 2, 3); }
  }
  c.globalAlpha = 1;
  const R = rng(17); c.lineCap = "round";
  for (let i = 0; i < 120; i++) {
    const u0 = lerp(WU0 + 0.1, WU1 - 0.1, R()), v0 = lerp(WV0 + 0.2, WV1 - 0.1, R()), ph = R() * 6.28, sp = 0.5 + R() * 0.7, w = 5 + R() * 9;
    const a = 0.5 + 0.5 * Math.sin(t * 1.5 * sp + ph), [x, y] = P(u0 + ((t * 0.08 * sp + R()) % 1) * 0.5, v0, ZW);
    c.strokeStyle = `rgba(255,255,255,${0.28 + a * 0.4})`; c.lineWidth = 1.1; c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x - w / 2, y - 2, x, y); c.quadraticCurveTo(x + w / 2, y + 2, x + w, y); c.stroke();
  }
  for (let i = 0; i < 50; i++) { const u0 = lerp(WU0, WU1, R()), v0 = lerp(WV0, WV1, R()), ph = R() * 6.28, a = Math.sin(t * 2.6 + ph); if (a > 0.8) { const [x, y] = P(u0, v0, ZW); c.fillStyle = `rgba(255,255,255,${(a - 0.8) * 4})`; c.fillRect(x - 1, y - 1, 3, 1.4); c.fillRect(x, y - 2, 1, 4); } }
  // wakes (always behind the boats)
  for (let i = 0; i < 3; i++) trail(k, t * SPEED + i * LOOP / 3, i);
  c.restore();
  // stone quay walls (back and left of the sunken creek), coping, block joints
  const wall = (pts, col) => k.poly(pts, col, { lw: 1.1, wobble: 0 });
  wall([[WU0, WV0, ZW], [WU1, WV0, ZW], [WU1, WV0, 0], [WU0, WV0, 0]], "#d3bd94");
  wall([[WU0, WV0, ZW], [WU0, WV1, ZW], [WU0, WV1, 0], [WU0, WV0, 0]], "#b9a27a");
  c.strokeStyle = "rgba(110,80,44,0.4)"; c.lineWidth = 0.7; c.beginPath();
  c.moveTo(...P(WU0, WV0, ZW / 2)); c.lineTo(...P(WU1, WV0, ZW / 2));
  for (let u = WU0 + 0.2, r = 0; u < WU1; u += 0.42, r++) { c.moveTo(...P(u, WV0, r % 2 ? 0 : ZW / 2)); c.lineTo(...P(u, WV0, r % 2 ? ZW / 2 : ZW)); }
  c.moveTo(...P(WU0, WV0, ZW / 2)); c.lineTo(...P(WU0, WV1, ZW / 2));
  for (let v = WV0 + 0.2, r = 0; v < WV1; v += 0.42, r++) { c.moveTo(...P(WU0, v, r % 2 ? 0 : ZW / 2)); c.lineTo(...P(WU0, v, r % 2 ? ZW / 2 : ZW)); }
  c.stroke();
  c.strokeStyle = "rgba(40,90,80,0.35)"; c.lineWidth = 2; c.beginPath(); c.moveTo(...P(WU0, WV0, ZW + 0.03)); c.lineTo(...P(WU1, WV0, ZW + 0.03)); c.moveTo(...P(WU0, WV0, ZW + 0.03)); c.lineTo(...P(WU0, WV1, ZW + 0.03)); c.stroke();
  c.strokeStyle = "rgba(255,246,222,0.8)"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(...P(WU0, WV0, 0)); c.lineTo(...P(WU1, WV0, 0)); c.moveTo(...P(WU0, WV0, 0)); c.lineTo(...P(WU0, WV1, 0)); c.stroke();
  // pavement rim in front / right (hides the sunken water edge)
  k.poly([[WU0, WV1, 0], [10, WV1, 0], [10, 10, 0], [WU0, 10, 0]], PAVE, { lw: 1.2, wobble: 0 });
  k.poly([[WU1, WV0, 0], [10, WV0, 0], [10, 10, 0], [WU1, 10, 0]], PAVE, { lw: 1.2, wobble: 0 });
  k.poly([[0, WV1, 0], [WU0, WV1, 0], [WU0, 10, 0], [0, 10, 0]], PAVE, { lw: 0.01, stroke: false });
}

// ---------- the boat loop: two lanes along v with U-turns inside the water ----------
const UL = 6.75, UR = 8.55, VA = 5.95, VB = 7.95, UM = (UL + UR) / 2, RT = (UR - UL) / 2;
const LS = VB - VA, LT = Math.PI * RT, LOOP = 2 * LS + 2 * LT, SPEED = 0.5;
function lanePos(s) {
  s = ((s % LOOP) + LOOP) % LOOP;
  if (s < LS) return { u: UL, v: VA + s, d: [0, 1] };
  s -= LS;
  if (s < LT) { const th = s / RT; return { u: UM - RT * Math.cos(th), v: VB + RT * Math.sin(th), d: [Math.sin(th), Math.cos(th)] }; }
  s -= LT;
  if (s < LS) return { u: UR, v: VB - s, d: [0, -1] };
  s -= LS;
  const th = s / RT; return { u: UM + RT * Math.cos(th), v: VA - RT * Math.sin(th), d: [-Math.sin(th), -Math.cos(th)] };
}
function trail(k, s, i) { // V wake + foam following the lane path behind the boat
  const c = k.ctx, t = k.t; c.lineCap = "round";
  for (const sd of [-1, 1]) {
    let prev = null;
    for (let j = 0; j <= 12; j++) {
      const p = lanePos(s - 0.75 - j * 0.14), nu = -p.d[1], nv = p.d[0], off = sd * (0.2 + j * 0.022 + Math.sin(t * 6 + j * 1.3) * 0.015);
      const q = P(p.u + nu * off, p.v + nv * off, ZW);
      if (prev) { c.strokeStyle = `rgba(255,255,255,${0.85 * (1 - j / 13)})`; c.lineWidth = 2.4 * (1 - j / 15); c.beginPath(); c.moveTo(...prev); c.lineTo(...q); c.stroke(); }
      prev = q;
    }
  }
  for (let j = 0; j < 9; j++) { const f = (t * 1.1 + j / 9) % 1, p = lanePos(s - 0.8 - f * 1.3), [x, y] = P(p.u, p.v, ZW); c.fillStyle = `rgba(255,255,255,${0.7 * (1 - f)})`; c.beginPath(); c.ellipse(x + Math.sin(j * 2.1) * 2, y, 2.5 + f * 4, 1.2 + f * 1.6, 0, 0, 6.3); c.fill(); }
  const p = lanePos(s + 0.9), [x, y] = P(p.u, p.v, ZW); c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 1.5; c.beginPath(); c.ellipse(x, y, 7, 3, 0, 0, 6.3); c.stroke();
  void i;
}

// ---------- small furniture ----------
function post(k, u, v) { // mooring post rising out of the creek
  const c = k.ctx;
  k.cyl(u, v, ZW - 0.05, 0.085, 0.75, "#74502f");
  const [x, y] = P(u, v, ZW - 0.05 + 0.85); c.fillStyle = "#4e3320"; c.beginPath(); c.ellipse(x, y, 4.8, 2.4, 0, 0, 6.3); c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  c.strokeStyle = "#caa86a"; c.lineWidth = 1.6; c.beginPath(); const [, y2] = P(u, v, 0.25); c.moveTo(x - 4.6, y2); c.quadraticCurveTo(x, y2 + 3.2, x + 4.6, y2); c.stroke();
}

// freestanding market hut: back posts, striped sloping canopy with front poles, goods in front
function hut(k, u0, u1, v0, v1, z, c1, c2) {
  const c = k.ctx;
  for (const u of [u0 + 0.05, u1 - 0.05]) beam(c, P(u, v0 + 0.05, 0), P(u, v0 + 0.05, z - 0.03), WOOD, 1.8);
  const F = LF(v0, 0);
  awning(k, F, u0, u1, z, { depth: v1 - v0, drop: 0.34, c1, c2, stripes: 8 });
}

// ---------- the town ----------
const HOUSES = [
  // back row
  { id: "B1", u0: 0.3, u1: 2.35, v0: 0.3, v1: 2.5, h: 3.4, col: "#e2c18a", seed: 21, tower: [0.62, 0.62, 1.0, 2.7],
    L: [["win", 0.35, 2.7, 0.26, 0.45, { shutters: "#7a4a28" }], ["win", 1.3, 2.7, 0.26, 0.45], ["beams", [0.25, 1.0, 1.75], 3.1, 0.25]],
    R: [["door", 0.9, 0.62, 1.5, { z: 0 }], ["lamp", 0.7, 1.95], ["gyp", 1.6, 1.8, 0.42, 0.8], ["win", 0.4, 1.9, 0.26, 0.5, { shutters: "#7a4a28" }], ["beams", [0.2, 1.1, 1.8], 2.95, 0.25], ["win", 1.0, 2.55, 0.24, 0.42]] },
  { id: "B2", u0: 3.3, u1: 5.6, v0: 0.3, v1: 2.5, h: 2.95, col: "#e6c692", seed: 22, tower: [3.7, 0.62, 1.0, 2.6],
    L: [["win", 0.3, 1.95, 0.26, 0.5, { shutters: "#7a4a28" }], ["mash", 0.9, 1.75, 1.0, 0.8], ["gyp", 2.0, 1.85, 0.3, 0.65], ["beams", [0.2, 0.8, 1.9, 2.2], 2.6, 0.25]],
    R: [["win", 0.4, 1.7, 0.24, 0.5]] },
  { id: "B3", u0: 6.0, u1: 7.8, v0: 0.3, v1: 2.5, h: 2.7, col: "#dfbb84", seed: 23, tower: [6.35, 0.62, 0.9, 2.3],
    L: [["win", 0.25, 1.95, 0.26, 0.45], ["mash", 0.75, 1.75, 0.9, 0.75], ["beams", [0.15, 0.7, 1.7], 2.4, 0.25]],
    R: [["win", 0.5, 1.7, 0.22, 0.45]] },
  { id: "B4", u0: 8.1, u1: 9.7, v0: 0.3, v1: 2.5, h: 2.7, col: "#e8c998", seed: 24, tower: [8.45, 0.62, 0.85, 2.2],
    L: [["fn", (k, F) => rug(k, F, 0.15, 1.78, 0.8, 0.5)], ["gyp", 1.15, 1.85, 0.3, 0.5], ["beams", [0.15, 1.0, 1.4], 2.4, 0.25]],
    R: [["door", 1.35, 0.6, 1.45], ["lamp", 1.2, 1.9], ["mash", 0.25, 1.4, 0.85, 0.8], ["gyp", 1.4, 1.85, 0.4, 0.7], ["win", 0.35, 2.4, 0.24, 0.3], ["beams", [0.2, 1.0, 1.8], 2.5, 0.25]] },
  // left row (right faces -> lane)
  { id: "L1", u0: 0.3, u1: 2.35, v0: 2.9, v1: 5.0, h: 2.5, col: "#e0bd86", seed: 31, tower: [0.62, 3.25, 0.85, 2.1],
    R: [["door", 0.4, 0.6, 1.4], ["lamp", 0.3, 1.9], ["gyp", 1.35, 1.35, 0.4, 0.7], ["win", 0.4, 1.85, 0.24, 0.32], ["beams", [0.2, 1.1, 1.85], 2.15, 0.25]],
    L: [] },
  { id: "L2", u0: 0.3, u1: 2.35, v0: 5.4, v1: 7.5, h: 3.05, col: "#e6c692", seed: 32, tower: [0.62, 5.8, 0.95, 2.5],
    R: [["mash", 0.2, 1.65, 0.9, 0.8], ["door", 1.35, 0.6, 1.45], ["lamp", 1.2, 1.95], ["gyp", 1.35, 1.95, 0.4, 0.6], ["beams", [0.3, 1.1, 1.8], 2.7, 0.25], ["win", 0.4, 2.6, 0.24, 0.3]],
    L: [] },
  { id: "L3", u0: 0.3, u1: 2.35, v0: 7.9, v1: 9.7, h: 2.45, col: "#e2c18a", seed: 33, tower: [0.62, 8.25, 0.85, 1.95],
    R: [["door", 0.4, 0.6, 1.4], ["lamp", 0.3, 1.85], ["win", 1.25, 1.35, 0.26, 0.5, { shutters: "#7a4a28" }], ["gyp", 0.4, 1.9, 0.35, 0.3], ["beams", [0.2, 1.0, 1.6], 2.1, 0.25]],
    L: [["door", 0.55, 0.62, 1.45], ["lamp", 0.4, 1.9], ["win", 1.5, 1.3, 0.26, 0.5, { shutters: "#7a4a28" }], ["gyp", 1.0, 1.35, 0.35, 0.65], ["beams", [0.2, 1.2, 1.8], 2.1, 0.25]] },
];
function town(k) {
  for (const H of HOUSES) {
    const extra = {};
    if (H.id === "B4") extra.roof = (kk, z) => { urn(kk, 9.2, 1.6, { z, h: 0.5, w: 0.2 }); urn(kk, 8.7, 2.1, { z, h: 0.35, w: 0.16 }); };
    if (H.id === "B2") extra.roof = (kk, z) => { urn(kk, 5.0, 2.0, { z, h: 0.45, w: 0.2 }); urn(kk, 4.9, 1.5, { z, h: 0.3, w: 0.16 }); };
    if (H.id === "L3") extra.roof = (kk, z) => { urn(kk, 1.7, 9.3, { z, h: 0.4, w: 0.18 }); };
    if (H.id === "L1") extra.roof = (kk, z) => { urn(kk, 1.9, 4.5, { z, h: 0.4, w: 0.18 }); urn(kk, 1.4, 4.7, { z, h: 0.28, w: 0.14 }); };
    k.q(H.u0 + H.v1, () => house(k, { ...H, ...extra }));
  }
}

// ---------- souk ----------
const SPICE = ["#e8661c", "#c9302c", "#e8b324", "#8a4a9a", "#b8c26a", "#d9a05a", "#c2436a", "#7f9a3c", "#e0a030"];
function souk(k, t) {
  const F = LF(SV, 0);
  const Q = (u, v, fn, off = 0) => k.q(u + v + off, fn);
  // A: spice stall (red/white)
  Q(4.05, SV + 0.75, () => { awning(k, F, 3.4, 4.7, 1.62, { depth: 0.75, drop: 0.35, c1: "#d64b44", c2: "#f7f1e6", stripes: 8 }); }, 0.6);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const u = 3.5 + i * 0.2 + r * 0.1, v = SV + 0.58 + r * 0.28; Q(u, v, () => spiceBasket(k, u, v, SPICE[(i + r * 3) % SPICE.length], { r: 0.15, h: 0.17, heap: 0.14 })); }
  for (const [u, v, col] of [[3.45, SV + 0.45, "#c4a46e"], [4.62, SV + 0.45, "#a88a58"], [4.62, SV + 0.78, "#d9bf8c"]]) Q(u, v, () => sack(k, u, v, col, { w: 0.16, h: 0.3 }));
  Q(4.05, SV + 0.8, () => { for (let i = 0; i < 4; i++) { const [x, y] = F(3.6 + i * 0.3, 1.27, 0.7); garland(k, x, y, 4 + (i % 2), i % 2 ? ["#e8c84a", "#d9a02a"] : ["#c9302c", "#e8661c"], i); } }, 0.7);
  // B: brass lantern stall (blue/white)
  Q(5.2, SV + 0.75, () => { awning(k, F, 4.82, 5.55, 1.62, { depth: 0.75, drop: 0.35, c1: "#3f79c4", c2: "#f7f1e6", stripes: 6 }); for (let i = 0; i < 3; i++) { const [x, y] = F(4.95 + i * 0.25, 1.27, 0.7); lantern(k, x, y, { s: 1, chain: 6 + i * 2, ph: i * 1.3, glass: i % 2 ? "rgba(255,150,70,0.95)" : undefined }); } }, 0.6);
  Q(5.2, SV + 0.55, () => stackTable(k, 4.9, 5.5, SV + 0.4, SV + 0.78, 0.4, ["#c9a046", "#b88a3a", "#d6b25e"], 4));
  // C: fabric stall (yellow/white)
  Q(6.9, SV + 0.75, () => { awning(k, F, 6.12, 7.7, 1.62, { depth: 0.75, drop: 0.35, c1: "#e8b724", c2: "#f7f1e6", stripes: 10 });
    for (let i = 0; i < 6; i++) { const [x, y] = F(6.3 + i * 0.25, 1.27, 0.68); cloth(k, x, y, 7, 24 + (i % 3) * 4, [["#c9506a", "#e8c84a"], ["#4a8aa8", "#f4efe4"], ["#d98a3a", "#6a3a8a"]][i % 3], i + 3); } }, 0.6);
  Q(6.9, SV + 0.62, () => stackTable(k, 6.3, 7.55, SV + 0.45, SV + 0.82, 0.42, ["#c9a0c0", "#6a9ad0", "#e8c84a", "#e8f0f0", "#d86a6a"], 3));
  // D: pottery stall (red/white), urns on the ground
  Q(8.9, SV + 0.75, () => { awning(k, F, 8.22, 9.6, 1.62, { depth: 0.75, drop: 0.35, c1: "#d64b44", c2: "#f7f1e6", stripes: 8 }); }, 0.6);
  [[8.4, 0.6, 0.42, "#b9763f"], [8.62, 0.82, 0.3, "#c98f62"], [8.85, 0.6, 0.5, "#a85f35"], [9.1, 0.82, 0.34, "#d9a05a"], [9.32, 0.6, 0.44, "#b08040"], [9.5, 0.85, 0.3, "#c98f62"]].forEach(([u, d, h, col]) => Q(u, SV + d, () => urn(k, u, SV + d, { h, w: 0.19, col })));
  // freestanding huts on the plaza
  for (const [u0, u1, v0, v1, c1, c2, seed] of [[3.6, 4.65, 5.3, 6.15, "#3f79c4", "#f7f1e6", 1], [3.6, 4.65, 7.3, 8.15, "#e8b724", "#f7f1e6", 2]]) {
    Q((u0 + u1) / 2, v1, () => hut(k, u0, u1, v0, v1, 1.38, c1, c2), 0.5);
    Q((u0 + u1) / 2, v0 + 0.3, () => stackTable(k, u0 + 0.12, u1 - 0.12, v0 + 0.2, v0 + 0.55, 0.4, ["#e0a030", "#c9506a", "#4a8aa8", "#d86a3a", "#e8c84a"], seed));
    for (let i = 0; i < 4; i++) { const u = u0 + 0.2 + i * 0.25; Q(u, v1 + 0.15, () => spiceBasket(k, u, v1 + 0.18, SPICE[(i + seed * 3) % SPICE.length], { r: 0.14, h: 0.16 })); }
    Q((u0 + u1) / 2, v1 + 0.2, () => { for (let i = 0; i < 3; i++) { const [x, y] = P(u0 + 0.25 + i * 0.3, v1 + 0.02, 1.0); lantern(k, x, y, { s: 0.9, chain: 6, ph: seed * 2 + i }); } }, 0.8);
  }
}

function furniture(k, t) {
  const Q = (u, v, fn, off = 0) => k.q(u + v + off, fn);
  for (const u of [5.95, 7.15, 9.15]) Q(u, 4.36, () => bollard(k, u, 4.36), 0.2);
  for (const [u, v] of [[6.2, 4.33], [8.0, 4.33], [3.45, 3.3], [2.55, 3.2], [3.2, 9.5]]) Q(u, v, () => arabLamp(k, u, v, { h: 1.65 }), 0.2);
  // mooring posts in the creek, near the back wall
  for (const [u, v] of [[6.1, 4.75], [7.7, 4.75], [9.3, 4.75]]) Q(u, v, () => post(k, u, v), 0.3);
  // planting
  for (const [u, v, h, seed, lean] of [[3.55, 4.85, 3.0, 3, -0.3], [5.15, 4.85, 2.7, 7, 0.2], [3.0, 9.45, 2.6, 9, 0.1], [4.9, 9.45, 2.4, 15, 0.2]])
    Q(u, v, () => opalm(k, u, v, { h, lean, seed, len: 1.2, wide: 1.0, fronds: 22 }), 0.2);
  Q(2.55, 4.3, () => { const [x, y] = P(2.35, 4.0, 2.55); bougain(k, x + 6, y + 10, 70, 30, 4); }, 0.9);
  Q(2.4, 6.6, () => { const [x, y] = P(2.35, 6.8, 3.1); bougain(k, x + 4, y + 10, 80, 32, 6); }, 0.9);
  Q(4.0, 6.7, () => shrub(k, 4.9, 6.6, 0.4, 3));
  Q(5.0, 8.8, () => shrub(k, 5.0, 8.7, 0.4, 5));
  Q(2.9, 8.5, () => shrub(k, 2.9, 8.4, 0.34, 9));
  k.q(8, () => { const [x, y] = P(8.2, 2.1, 2.7); bougain(k, x + 10, y + 12, 60, 24, 11); });
}

// ---------- boats ----------
function boats(k, t) {
  const B = [
    { c1: "#d64b44", band: "#2f7d6a", seeds: [3, 9, 14, 21, 25, 30, 36], pilot: 40 },
    { c1: "#3f79c4", band: "#c9a046", seeds: [4, 7, 12, 19, 22, 28, 33], pilot: 44 },
    { c1: "#e8b724", band: "#8a3a3a", seeds: [5, 10, 15, 20, 26, 31, 37], pilot: 48 },
  ];
  B.forEach((o, i) => {
    const p = lanePos(t * SPEED + (i * LOOP) / 3);
    k.q(p.u + p.v + 0.4, () => abra(k, p.u, p.v, p.d, { ...o, z: ZW, ph: i * 2, look, seats: 7, len: 2.4, wid: 0.72, h: 0.3 }));
  });
}

// ---------- people ----------
function people(k, t) {
  const Q = (u, v, fn) => k.q(u + v, fn);
  // closed loops, one direction per lane (no head-on meets)
  const souk = [];
  for (let u = 3.7; u <= 9.0; u += 0.9) souk.push([u, 3.62]);
  souk.push([9.3, 3.68], [9.45, 3.8], [9.3, 3.92]);
  for (let u = 9.0; u >= 3.7; u -= 0.9) souk.push([u, 3.98]);
  souk.push([3.5, 3.9], [3.4, 3.8], [3.5, 3.7]);
  const lane = [];
  for (let v = 1.0; v <= 9.0; v += 1.0) lane.push([2.65, v]);
  lane.push([2.75, 9.2], [2.95, 9.2]);
  for (let v = 9.0; v >= 1.0; v -= 1.0) lane.push([3.02, v]);
  lane.push([2.95, 0.8], [2.75, 0.8]);
  const prom = [];
  for (let v = 5.2; v <= 9.1; v += 0.8) prom.push([4.98, v]);
  prom.push([5.05, 9.3], [5.25, 9.3]);
  for (let v = 9.1; v >= 5.2; v -= 0.8) prom.push([5.3, v]);
  prom.push([5.25, 5.0], [5.05, 5.0]);
  const W = (route, off, seed, sp, ex = {}) => k.qwalker(route, { loop: true, speed: sp ?? 0.3 + (seed % 5) * 0.02, offset: off, seed, ...look(seed), ...ex });
  [0, 0.18, 0.37, 0.55, 0.76].forEach((o, i) => W(souk, o, 51 + i * 4, 0.3, i === 2 ? { kid: true } : {}));
  [0, 0.27, 0.52, 0.77].forEach((o, i) => W(lane, o, 62 + i * 5, 0.32, i === 3 ? { kid: true } : {}));
  [0.05, 0.4, 0.72].forEach((o, i) => W(prom, o, 81 + i * 3, 0.3));
  // vendors and customers
  const stand = (u, v, seed, extra = {}) => Q(u, v, () => k.person(u, v, { seed, dir: [0.12, 1], gesture: true, ...look(seed), ...extra }));
  stand(4.05, SV + 0.28, 36, { style: "coat", top: "#f6f3ec", bottom: "#f6f3ec" });
  stand(5.2, SV + 0.22, 28);
  stand(6.9, SV + 0.24, 22);
  stand(8.9, SV + 0.28, 45);
  stand(4.1, 5.5, 18); stand(4.1, 7.5, 10);
  stand(3.85, 3.2, 3); stand(4.45, 3.22, 2, { gesture: false });
  stand(7.2, 3.22, 6, { gesture: false }); stand(7.55, 3.18, 0, { gesture: false }); stand(8.7, 3.2, 4);
  stand(4.4, 6.65, 12, { gesture: false }); stand(4.3, 8.6, 1, { gesture: false });
  stand(8.0, 3.5, 31, { kid: true, shorts: true });
  // watching the abras from the quay
  stand(6.45, 4.28, 13, { pose: "photo", gesture: false }); stand(6.7, 4.28, 5, { gesture: false });
  stand(8.3, 4.28, 14, { pose: "wave", gesture: false }); stand(8.5, 4.28, 32, { kid: true, pose: "wave", gesture: false });
  // roof watcher on B3
  k.q(7.8 + 2.4, () => k.person(7.2, 1.9, { z: 2.7, seed: 33, dir: [0.2, 1], style: "coat", top: "#2f6a5a", bottom: "#2f6a5a", hat: "cap", hatCol: "#2f6a5a" }));
}

export default function draw(k, t) {
  ground(k, t);
  town(k);
  souk(k, t);
  furniture(k, t);
  boats(k, t);
  people(k, t);
}
