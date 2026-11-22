// DUBAI · -1,0 · Desert Safari (grid pass: a self-contained diorama inside the 10x10 footprint)
// Layout (u,v): dune height-field in the back corner (ridges to ~2.2, zero at the slab edge and on the flat front half);
// 4x4 loop through the dune valley + over the low tails (dust trail); Bedouin tent u 0.85-3.3, v 6.15-8.85 (ridge along u, open
// to the right face), fire (4.0,7.4); oasis pool (7.2,7.6) with date palms; camel caravan loop u 5-9.3, v 5.25-9.4; falconer (4.1,5.6).
import { P, CTS, INK, shade, lerp, clamp, rng, spline } from "../../lib/vec-kit.js";
import { terrain, H, PT } from "./_t-1_0.js";
import { blob, rock, tuft, bush, reeds, datePalm, camel, camelHead, CAMEL_COLS, flames, smoke, lantern, falcon } from "./_t-1_0p.js";
import { look, circlePoly, TAU, distTo } from "./_g-1_0.js";

export const camera = { u: 4.4, v: 7.0, z: 0.8, zoom: 2.0 };
const ZP = CTS.S * CTS.ZS;
const at = (u, v, z = 0) => P(u, v, z);

// ---------- routes (u,v) ----------
const LOOP = [[5.2, 5.7], [6.4, 5.3], [8.4, 5.3], [9.15, 5.8], [9.3, 7.2], [9.3, 8.6], [8.7, 9.3], [7.0, 9.4], [5.7, 9.3], [5.2, 8.7], [5.1, 7.2]];
const LSP = spline(LOOP, true);
const CAM_SPEED = 0.42, HEAD0 = 5.4, dHead = (t) => HEAD0 + (t - 3) * CAM_SPEED;
const LPTS = Array.from({ length: 80 }, (_, i) => { const s = LSP.sample((i / 80) * LSP.L); return [s.u, s.v]; });
const JLOOP = [[2.6, 2.6], [4.2, 2.1], [6.0, 1.8], [7.6, 2.5], [7.4, 3.3], [5.2, 3.6], [3.4, 3.9], [2.5, 3.4]];
const JSP = spline(JLOOP, true);
const JEEP_SPEED = 0.75;
const JPTS = Array.from({ length: 60 }, (_, i) => { const s = JSP.sample((i / 60) * JSP.L); return [s.u, s.v]; });
const wrap = (sp, d) => sp.sample(((d % sp.L) + sp.L) % sp.L);

// ---------- layout data ----------
const POOL = Array.from({ length: 18 }, (_, i) => { const a = (i / 18) * TAU, r = 1 + 0.13 * Math.sin(3 * a + 1) + 0.07 * Math.sin(5 * a); return [7.2 + Math.cos(a) * 1.4 * r, 7.6 + Math.sin(a) * 0.95 * r]; });
const grow = (pts, f) => { const cu = pts.reduce((s, p) => s + p[0], 0) / pts.length, cv = pts.reduce((s, p) => s + p[1], 0) / pts.length; return pts.map(([u, v]) => [cu + (u - cu) * f, cv + (v - cv) * f]); };
const TENT = { u0: 0.85, u1: 3.3, v0: 6.15, v1: 8.85, vm: 7.5, zr: 2.45, ze: 1.75 };
const FIRE = [4.15, 7.5];
const PALMS = [ // u, v, trunk px, lean px, crown radius px, seed
  [8.55, 6.8, 100, 6, 42, 1], [6.05, 6.95, 92, -6, 40, 2], [7.85, 6.55, 84, 3, 38, 3], [6.0, 8.95, 60, -3, 32, 7], [8.65, 8.85, 56, 4, 30, 8],
];
const BUSHES = [ // u, v, r px, seed, flower colour
  [6.05, 6.6, 15, 1, "#e07aa0"], [6.9, 6.4, 14, 2, 0], [8.1, 6.35, 15, 3, "#d86a96"], [8.7, 6.9, 14, 4, 0], [5.75, 7.6, 13, 5, 0], [6.1, 8.7, 14, 6, "#e8a0c0"],
  [8.65, 8.5, 15, 7, "#e07aa0"], [7.7, 8.85, 12, 8, 0], [6.8, 8.9, 13, 9, "#d86a96"], [7.25, 6.2, 12, 10, 0], [8.95, 7.2, 13, 11, 0], [5.9, 6.3, 12, 12, 0],
];
const TENT_COLS = ["#f4ead0", "#f4ead0", "#b6382b", "#f4ead0", "#e6c88a", "#a8402e", "#f4ead0", "#8a2a2a", "#f4ead0", "#d99a4a"];

// deterministic scatter of rocks and tufts on flat sand clear of everything
const clear = (u, v) => H(u, v) < 0.02 && distTo(LPTS, u, v) > 0.7 && distTo(JPTS, u, v) > 0.7
  && !(u > 5.3 && u < 9.3 && v > 6.0 && v < 9.1) && !(u > 0.6 && u < 4.7 && v > 5.9 && v < 9.2) && Math.hypot(u - 4.1, v - 5.6) > 0.8;
const SCATTER = (() => {
  const R = rng(17), rocks = [], tufts = [];
  for (let i = 0; i < 400 && (rocks.length < 9 || tufts.length < 24); i++) {
    const u = lerp(0.6, 9.4, R()), v = lerp(0.6, 9.4, R());
    if (!clear(u, v)) continue;
    if (rocks.length < 9 && R() < 0.3) rocks.push([u, v, 0.8 + R() * 0.5, rocks.length + 1]);
    else if (tufts.length < 24) tufts.push([u, v, 0.8 + R() * 0.5, tufts.length + 1]);
  }
  return { rocks, tufts };
})();

export default function draw(k, t) {
  const c = k.ctx;
  terrain(k);
  groundDetail(k, t);
  oasis(k, t);
  rugAndCampGround(k);

  // ---- oasis props ----
  for (const [u, v, h, lean, L, sd] of PALMS) k.q(u + v, () => {
    const [x, y] = at(u, v, 0); at(u, v, h / ZP * 0.5); at(u, v, h / ZP);
    datePalm(c, t, x, y, { h, lean, L: L * 0.88, seed: sd, tw: 3 + h / 22 });
  });
  for (const [u, v, r, sd, fl] of BUSHES) k.q(u + v, () => { const [x, y] = at(u, v, 0); bush(c, x, y, r, sd, t, { flowers: fl || null, col: ["#5f8f45", "#74a050", "#4f7f3e", "#68963f"][sd % 4] }); });
  for (const [u, v, s, sd] of SCATTER.rocks) k.q(u + v, () => { const [x, y] = at(u, v, 0); rock(c, x, y, s, sd); });
  for (const [u, v, s, sd] of SCATTER.tufts) k.q(u + v, () => { const [x, y] = at(u, v, 0); tuft(c, x, y, s, sd, t); });
  for (const [u, v, s, sd] of [[8.2, 8.45, 1.0, 1], [6.35, 8.55, 0.9, 2], [6.6, 6.55, 1.0, 3]]) k.q(u + v + 0.2, () => { const [x, y] = at(u, v, 0); reeds(c, x, y, s, sd, t); });

  camp(k, t);
  caravan(k, t);
  falconer(k, t);
  jeepRun(k, t);
  poolPeople(k, t);
  wisps(k, t);
  // hawks overhead: circles in the air above the footprint
  k.q(60, () => {
    for (const [cu, cv, r, sp, ph, sz] of [[6.0, 3.2, 3.2, 0.5, 0, 1.6], [3.0, 6.2, 2.4, 0.4, 2, 1.3]]) {
      const a = t * sp + ph, [x, y] = at(cu + Math.cos(a) * r, cv + Math.sin(a) * r * 0.8, 6.2);
      k.bird(x, y, { size: sz, phase: ph });
    }
  });
}

// ---------- flat ground: tracks, footprints, trodden camp, fire scorch ----------
function groundDetail(k, t) {
  const c = k.ctx;
  // tyre tracks along the jeep loop
  c.save(); c.lineCap = "round";
  for (const off of [-0.09, 0.09]) {
    c.beginPath();
    for (let i = 0; i <= 90; i++) { const s = JSP.sample((i / 90) * JSP.L), l = Math.hypot(s.du, s.dv) || 1, u = s.u - (s.dv / l) * off, v = s.v + (s.du / l) * off, p = PT(u, v, 0.02); i ? c.lineTo(...p) : c.moveTo(...p); }
    c.strokeStyle = "rgba(130,80,35,0.4)"; c.lineWidth = 1.1; c.stroke();
  }
  c.restore();
  // camel track beside the live loop: two dotted lanes of hoof prints
  for (let i = 0; i < 70; i++) {
    const s = LSP.sample((i / 70) * LSP.L), l = Math.hypot(s.du, s.dv) || 1, side = i % 2 ? 0.12 : -0.12;
    const [x, y] = at(s.u - (s.dv / l) * side, s.v + (s.du / l) * side, 0);
    c.beginPath(); c.ellipse(x, y, 2.2, 1.1, -0.35, 0, TAU); c.fillStyle = "rgba(140,90,40,0.3)"; c.fill();
  }
  // trodden sand around the camp and a path to the pool
  k.ground([[0.7, 6.0], [4.7, 6.0], [4.9, 8.9], [3.8, 9.1], [0.8, 9.1]], "rgba(190,140,80,0.22)", { stroke: false });
  k.ground(circlePoly(FIRE[0], FIRE[1], 0.62, 20), "rgba(70,45,25,0.3)", { stroke: false });
}

// ---------- the oasis pool ----------
function oasis(k, t) {
  const c = k.ctx;
  k.ground(grow(POOL, 1.28), "rgba(150,120,60,0.5)", { stroke: false });
  k.ground(grow(POOL, 1.12), "rgba(110,120,60,0.45)", { stroke: false });
  k.water(POOL, { color: "#35bfc4", seed: 4, density: 2.4, flow: 0.4, dir: [0.6, -0.4] });
  c.save(); c.beginPath(); POOL.forEach(([u, v], i) => { const p = P(u, v, 0); i ? c.lineTo(...p) : c.moveTo(...p); }); c.closePath(); c.clip();
  const g = c.createLinearGradient(...P(5.8, 6.6), ...P(8.6, 8.6)); g.addColorStop(0, "rgba(20,110,130,0.45)"); g.addColorStop(0.5, "rgba(60,200,205,0.0)"); g.addColorStop(1, "rgba(200,245,235,0.30)");
  c.fillStyle = g; c.fill();
  // palm reflections
  c.globalAlpha = 0.22; c.strokeStyle = "#1a5a3c"; c.lineWidth = 5; c.lineCap = "round";
  for (const [u, v] of [PALMS[1], PALMS[2], PALMS[0]]) { const [x, y] = P(u, v + 0.15, 0); c.beginPath(); c.moveTo(x, y + 4); c.lineTo(x + Math.sin(t * 1.4 + u) * 4, y + 40); c.stroke(); }
  c.globalAlpha = 1;
  // expanding ripples (circles on the water plane)
  for (let i = 0; i < 4; i++) {
    const a = (t * 0.28 + i * 0.27) % 1, [ru, rv] = [[6.7, 7.3], [7.6, 7.9], [8.0, 7.4], [7.1, 8.0]][i], [cx, cy] = P(ru, rv, 0), r = (0.08 + a * 0.5) * CTS.S * Math.SQRT2;
    c.strokeStyle = `rgba(255,255,255,${0.7 * (1 - a)})`; c.lineWidth = 1.4; c.beginPath(); c.ellipse(cx, cy, r, r * CTS.YS, 0, 0, TAU); c.stroke();
  }
  // sparkles
  const R = rng(21);
  for (let i = 0; i < 26; i++) { const [x, y] = P(lerp(5.9, 8.5, R()), lerp(6.7, 8.5, R()), 0), a = Math.max(0, Math.sin(t * (2 + R() * 2) + R() * 6)); if (a > 0.7) { c.fillStyle = `rgba(255,255,255,${a})`; c.fillRect(x - 1.2, y - 1.2, 2.4, 2.4); c.fillRect(x - 3.5, y - 0.4, 7, 0.8); } }
  c.restore();
  k.ground(POOL, null, { stroke: "#356a6a", lw: 1.4 });
}

// ---------- rug (ground) ----------
function rugAndCampGround(k) {
  const c = k.ctx, cu = 2.4, cv = 7.5, RUG = [[1.15, 6.7], [3.9, 6.7], [3.9, 8.3], [1.15, 8.3]];
  k.ground(RUG, "#a9382c", { lw: 1.4 });
  for (const [f, col] of [[0.9, "#e8d6b0"], [0.8, "#2b4a78"], [0.7, "#b9503a"], [0.52, "#e4cc98"], [0.36, "#8a2f2a"]]) k.ground(RUG.map(([u, v]) => [cu + (u - cu) * f * 1.0 - 0.0, cv + (v - cv) * f]), col, { stroke: false });
  const R = rng(3);
  for (let i = 0; i < 60; i++) { const [x, y] = P(lerp(1.3, 3.75, R()), lerp(6.85, 8.15, R()), 0); c.beginPath(); c.arc(x, y, 1.5, 0, TAU); c.fillStyle = R() < 0.5 ? "#f1dcae" : "#2b4a78"; c.fill(); }
  for (let i = 0; i < 14; i++) { const v = lerp(6.75, 8.25, i / 13), [x, y] = P(3.9, v, 0); c.beginPath(); c.moveTo(x, y); c.lineTo(x + 2, y + 4); c.strokeStyle = "#e8d6b0"; c.lineWidth = 1.1; c.stroke(); }
}

// ---------- Bedouin camp ----------
const fabric = (k, ptsFn, n, w, cols, shd = 0) => { // stripes across a plane: ptsFn(a,b) -> 4 world points for the band [a,b] of 0..1
  for (let i = 0; i < n; i++) k.poly(ptsFn(i / n, (i + 1) / n), shade(cols[i % cols.length], shd), { lw: 0.7, wobble: 0 });
  void w;
};
function dallah(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath(); c.moveTo(-5, 0); c.quadraticCurveTo(-8, -9, -3, -13); c.lineTo(3, -13); c.quadraticCurveTo(8, -9, 5, 0); c.closePath(); c.fillStyle = "#d0a03a"; c.fill(); c.strokeStyle = "#5a3c10"; c.lineWidth = 1.2; c.stroke();
  c.beginPath(); c.moveTo(-3, -13); c.lineTo(-2, -19); c.lineTo(2, -19); c.lineTo(3, -13); c.fillStyle = "#c08e2c"; c.fill(); c.stroke();
  c.beginPath(); c.moveTo(5, -8); c.quadraticCurveTo(12, -12, 14, -20); c.lineTo(11, -19); c.quadraticCurveTo(9, -13, 4, -9); c.fillStyle = "#c9972f"; c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-5, -10); c.quadraticCurveTo(-11, -12, -8, -4); c.strokeStyle = "#5a3c10"; c.lineWidth = 1.4; c.stroke();
  c.restore();
}
const CUSH = ["#c04a34", "#e0a850", "#a03a2c", "#d89a48"];
function tentBack(k, t) {
  const { u0, u1, v0, v1, zr } = TENT, c = k.ctx, vm0 = TENT.vm;
  // back wall (u = u0 plane, faces the viewer) with woven hangings, far wall (v = v0 plane)
  k.poly([[u0, v0, 0], [u0, v1, 0], [u0, v1, TENT.ze], [u0, vm0, zr], [u0, v0, TENT.ze]], "#5a2418", { lw: 1.4 });
  for (let i = 0; i < 12; i++) { const a = v0 + 0.15 + i * 0.2; k.poly([[u0, a, 0.5], [u0, a + 0.12, 0.5], [u0, a + 0.12, 1.5], [u0, a, 1.5]], i % 2 ? "rgba(214,150,70,0.6)" : "rgba(160,50,40,0.7)", { stroke: false }); }
  k.poly([[u0, v0, 0], [u1, v0, 0], [u1, v0, TENT.ze], [u0, v0, TENT.ze]], "#7a3a28", { lw: 1.4 });
  for (let i = 0; i < 9; i++) { const a = u0 + 0.15 + i * 0.27; k.poly([[a, v0, 0.4], [a + 0.15, v0, 0.4], [a + 0.15, v0, 1.25], [a, v0, 1.25]], i % 2 ? "rgba(236,200,120,0.55)" : "rgba(150,45,38,0.6)", { stroke: false }); }
  void zr; void c; void t;
}
function cushionBox(k, u, v, du, dv, col) { k.box(u, v, 0, du, dv, 0.22, col, { shadow: false, hatch: false }); }
function camp(k, t) {
  const c = k.ctx, { u0, u1, v0, v1, vm, zr, ze } = TENT;
  // tent interior (queued early so people and cushions sort over it)
  k.q(7.7, () => tentBack(k, t));
  // cushions along the back wall and the far wall
  [[1.0, 6.45], [1.0, 6.95], [1.0, 7.5], [1.0, 8.0]].forEach(([u, v], i) => k.q(u + v + 0.5, () => cushionBox(k, u, v, 0.5, 0.46, CUSH[i % 4])));
  [[1.8, 6.3], [2.35, 6.3], [2.9, 6.3]].forEach(([u, v], i) => k.q(u + v + 0.5, () => cushionBox(k, u, v, 0.5, 0.42, CUSH[(i + 1) % 4])));
  // brass tray with dallah and cups
  k.q(3.1 + 7.45 - 0.3, () => {
    const [x, y] = at(3.1, 7.45, 0); blob(c, x + 2, y + 5, 24, 6, "rgba(60,30,15,0.3)");
    c.beginPath(); c.ellipse(x, y, 20, 8, 0, 0, TAU); c.fillStyle = "#c9972f"; c.fill(); c.strokeStyle = "#5a3c10"; c.lineWidth = 1.2; c.stroke();
    c.beginPath(); c.ellipse(x, y - 1, 14, 5, 0, 0, TAU); c.strokeStyle = "#8a6420"; c.lineWidth = 0.9; c.stroke();
    dallah(c, x - 3, y - 1, 0.8); for (const [dx, dy] of [[-14, 1], [11, 2], [6, -3]]) { c.beginPath(); c.ellipse(x + dx, y + dy, 2.6, 1.6, 0, 0, TAU); c.fillStyle = "#f4ecd8"; c.fill(); c.strokeStyle = "#5a4a30"; c.lineWidth = 0.7; c.stroke(); }
  });
  // lanterns hang from the ridge
  k.q(10.8, () => { for (const [u, v, z, s, sd] of [[3.3, 6.9, 1.75, 1.3, 1], [3.3, 8.1, 1.75, 1.3, 2]]) { const [x, y] = at(u, v, z); lantern(c, x, y + 14, s, t, sd); } });
  // seated men around the tray
  const fits = [{ top: "#efe6d2", bottom: "#efe6d2", skin: "#c68a62" }, { top: "#f4eee0", bottom: "#f4eee0", skin: "#e0ac84" }, { top: "#d9ccae", bottom: "#d9ccae", skin: "#9a6544" }, { top: "#8fa6bd", bottom: "#8fa6bd", skin: "#c68a62" }];
  [[3.1, 6.75, [0, 1], 0, 1], [3.1, 8.15, [0, -1], 4, 1], [2.5, 7.45, [1, 0], 2, 0], [3.95, 7.0, [-0.8, 0.3], 6, 1]].forEach(([u, v, dir, sd, gest], i) => {
    k.qperson(u, v, { pose: "sitground", dir, seed: 40 + sd + i, style: "coat", hairStyle: "short", hat: "cap", hatCol: "#f6f2e8", shoes: "#6a4a30", gesture: !!gest, phaseOff: i * 0.23, ...fits[i] });
  });
  // host pours from the standing position behind the rug
  k.qperson(4.0, 6.3, { pose: "stand", dir: [-0.6, 0.8], seed: 71, style: "coat", top: "#f6f3ec", bottom: "#f6f3ec", hat: "cap", hatCol: "#f8f6f0", skin: "#c68a62" });
  // wooden chest and saddles by the tent
  k.q(3.6 + 8.95, () => { k.box(3.45, 8.55, 0, 0.6, 0.4, 0.32, "#a8743c", { shadow: true, hatch: false }); k.poly([[3.45, 8.55, 0.32], [4.05, 8.55, 0.32], [4.05, 8.95, 0.32], [3.45, 8.95, 0.32]], "#b98448", { lw: 1 }); });
  k.q(0.9 + 9.0 + 0.4, () => { k.box(0.95, 9.0, 0, 0.5, 0.35, 0.28, "#9a6a3a", { shadow: true, hatch: false }); k.box(1.6, 9.05, 0, 0.45, 0.3, 0.22, "#7a4a2a", { shadow: true, hatch: false }); });
  // dallah on the ground by the fire
  k.q(4.6 + 6.9, () => { const [x, y] = at(4.5, 6.8, 0); blob(c, x + 3, y + 4, 14, 4, "rgba(60,40,20,0.3)"); dallah(c, x, y, 1.3); });
  // fire: stone ring (back half), logs, flames, front stones
  k.q(FIRE[0] + FIRE[1], () => {
    const ring = (front) => { for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU, sy = Math.sin(a + 0.8); if ((sy > 0) !== front) continue; const [x, y] = at(FIRE[0] + Math.cos(a) * 0.36, FIRE[1] + Math.sin(a) * 0.36, 0); rock(c, x, y, 0.95, i + 30, i % 2 ? "#b9a88a" : "#a89880"); } };
    ring(false);
    for (let i = 0; i < 3; i++) { const a = i * 1.05 + 0.4, du = Math.cos(a) * 0.3, dv = Math.sin(a) * 0.3; k.poly([[FIRE[0] - du - 0.04, FIRE[1] - dv - 0.04, 0.05], [FIRE[0] + du - 0.04, FIRE[1] + dv - 0.04, 0.05], [FIRE[0] + du + 0.04, FIRE[1] + dv + 0.04, 0.05], [FIRE[0] - du + 0.04, FIRE[1] - dv + 0.04, 0.05]], "#4a3020", { lw: 0.9, wobble: 0 }); }
    const [fx, fy] = at(FIRE[0], FIRE[1], 0.05); flames(c, fx, fy, t);
    ring(true);
  });
  k.q(FIRE[0] + FIRE[1] + 3, () => { const [x, y] = at(FIRE[0], FIRE[1], 0.9); for (const z of [1.6, 2.4, 3.1]) at(FIRE[0], FIRE[1], z); smoke(c, x, y, t); });
  // woman in an abaya, kid circling the fire
  k.qwalker([[3.5, 8.95], [3.95, 8.65], [4.5, 8.45]], { speed: 0.3, offset: 0.1, seed: 83, dwell: 1.4, style: "coat", top: "#26222a", bottom: "#26222a", hat: "beret", hatCol: "#26222a", hairStyle: "bun", shoes: "#26222a" });
  k.qwalker(circlePoly(FIRE[0], FIRE[1], 0.75, 16), { speed: 0.55, offset: 0.2, seed: 91, loop: true, kid: true, dwell: 0, top: "#e8c14a", bottom: "#4a3b30" });
  // tent front layers over the people
  k.q(9.4, () => post(k, 3.3, v0));
  k.q(10.7, () => tentRoof(k, t));
  k.q(12.2, () => post(k, 3.3, v1));
}

function post(k, u, v) {
  const c = k.ctx, a = at(u, v, 0), b = at(u, v, TENT.ze);
  c.lineCap = "round";
  c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); c.strokeStyle = "#a8842c"; c.lineWidth = 3; c.stroke();
}
function tentRoof(k, t) {
  const c = k.ctx, { u0, u1, v0, v1, vm, zr, ze } = TENT, sway = Math.sin(t * 0.9) * 0.012;
  const w = 0.3, nb = Math.round((u1 - u0) / w);
  // right (far) roof plane first, then the near left plane
  fabric(k, (a, b) => { const ua = lerp(u0, u1, a), ub = lerp(u0, u1, b); return [[ua, v0, ze], [ub, v0, ze], [ub, vm, zr], [ua, vm, zr]]; }, nb, w, TENT_COLS, -0.22);
  fabric(k, (a, b) => { const ua = lerp(u0, u1, a), ub = lerp(u0, u1, b); return [[ua, vm, zr], [ub, vm, zr], [ub, v1, ze], [ua, v1, ze]]; }, nb, w, TENT_COLS, -0.03);
  // valance hanging from the near eave, with beaded fringe
  fabric(k, (a, b) => { const ua = lerp(u0, u1, a), ub = lerp(u0, u1, b); return [[ua, v1, ze], [ub, v1, ze], [ub, v1 + sway, ze - 0.26], [ua, v1 + sway, ze - 0.26]]; }, nb, w, TENT_COLS.slice().reverse(), -0.1);
  for (let i = 0; i < 40; i++) { const u = lerp(u0, u1, (i + 0.5) / 40), [x, y] = at(u, v1 + sway, ze - 0.26); c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 5 + (i % 3) * 2); c.strokeStyle = "#e6b650"; c.lineWidth = 1; c.stroke(); c.beginPath(); c.arc(x, y + 6 + (i % 3) * 2, 1.3, 0, TAU); c.fillStyle = "#f2cc60"; c.fill(); }
  // front (u1) gable-end header band over the open side
  fabric(k, (a, b) => { const va = lerp(v0, vm, a), vb = lerp(v0, vm, b), za = lerp(ze, zr, a), zb = lerp(ze, zr, b); return [[u1, va, za], [u1, vb, zb], [u1, vb, zb - 0.26], [u1, va, za - 0.26]]; }, 6, w, TENT_COLS, -0.2);
  fabric(k, (a, b) => { const va = lerp(vm, v1, a), vb = lerp(vm, v1, b), za = lerp(zr, ze, a), zb = lerp(zr, ze, b); return [[u1, va, za], [u1, vb, zb], [u1, vb, zb - 0.26], [u1, va, za - 0.26]]; }, 6, w, TENT_COLS, -0.2);
  for (let i = 0; i < 26; i++) { const f = (i + 0.5) / 26, v = lerp(v0, v1, f), z = (f < 0.5 ? lerp(ze, zr, f * 2) : lerp(zr, ze, (f - 0.5) * 2)) - 0.26, [x, y] = at(u1, v, z); c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 6 + (i % 3) * 2); c.strokeStyle = "#e6b650"; c.lineWidth = 1; c.stroke(); c.beginPath(); c.arc(x, y + 7 + (i % 3) * 2, 1.3, 0, TAU); c.fillStyle = "#f2cc60"; c.fill(); }
  // centre pole at the front of the ridge, tassels, guy ropes + pegs
  c.lineCap = "round";
  for (const [u, v, z] of [[u0, v1, ze], [u1, v1, ze], [u1, v0, ze], [u1, vm, zr]]) { const [x, y] = at(u, v, z); c.beginPath(); c.moveTo(x, y); c.lineTo(x + 1, y + 6); c.strokeStyle = "#e6b650"; c.lineWidth = 1.5; c.stroke(); c.beginPath(); c.arc(x + 1, y + 7, 2, 0, TAU); c.fillStyle = "#c2432f"; c.fill(); }
  c.strokeStyle = "#6a5230"; c.lineWidth = 1.3;
  for (const [u, v, z, pu, pv] of [[u0, v1, ze, 0.4, 9.5], [u1, v1, ze, 3.9, 9.4], [u0, v0, ze, 0.5, 5.6], [u1, v0, ze, 3.8, 5.8]]) { const a = at(u, v, z), b = at(pu, pv, 0); c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); c.beginPath(); c.arc(b[0], b[1], 2, 0, TAU); c.fillStyle = "#4a3820"; c.fill(); }
}

// ---------- camel caravan ----------
function caravan(k, t) {
  const c = k.ctx, dh = dHead(t), heads = [];
  [[1.6, 0], [3.4, 1], [5.2, 2], [7.0, 3]].forEach(([off, i]) => {
    const d = dh - off, s = wrap(LSP, d);
    k.q(s.u + s.v + 0.2, () => {
      const [x, y] = at(s.u, s.v, 0), l = Math.hypot(s.du, s.dv) || 1;
      const vx = ((s.du - s.dv) / l) * 45, vy = ((s.du + s.dv) / l) * 26, flip = vx < 0, tilt = Math.atan2(vy, Math.abs(vx)) * 0.25;
      const sq = clamp(Math.abs(vx) / 36 + 0.3, 0.35, 1); // squash through the turn instead of popping
      c.save(); c.translate(x, y); c.scale(sq, 1); c.translate(-x, -y);
      camel(c, x, y, { sc: 1.3, p: d / 0.75, flip, tilt, seed: i + 1, t, blanket: CAMEL_COLS[i], load: i % 2, moving: 1 });
      c.restore();
      heads[i] = camelHead(x, y, flip, 1.3, tilt);
    });
  });
  // handler leads camel 1 by a rope
  {
    const d = dh, s = wrap(LSP, d);
    k.q(s.u + s.v + 0.3, () => {
      const [x, y] = at(s.u, s.v, 0.5);
      if (heads[0]) { c.beginPath(); c.moveTo(...heads[0]); c.quadraticCurveTo((heads[0][0] + x) / 2, Math.max(heads[0][1], y) + 7, x, y); c.strokeStyle = "#7a4a2a"; c.lineWidth = 1.5; c.stroke(); }
      k.person(s.u, s.v, { pose: "walk", dir: [s.du, s.dv], p: d / 0.27, seed: 100, style: "coat", top: "#f6f3ec", bottom: "#f6f3ec", hat: "cap", hatCol: "#f8f6f0", skin: "#c68a62", shoes: "#6a4a30" });
    });
  }
  { const d = dh - 8.9, s = wrap(LSP, d); k.q(s.u + s.v + 0.3, () => k.person(s.u, s.v, { pose: "walk", dir: [s.du, s.dv], p: d / 0.27, seed: 101, style: "coat", top: "#5f84b0", bottom: "#4f6f98", hat: "cap", hatCol: "#f2eee2", skin: "#9a6544", shoes: "#5a4028" })); }
  // two tourists photographing the camels from the sand inside the loop's back lane
  [[6.5, 6.2, [0.2, -1], 110], [7.0, 6.1, [0.3, -1], 112]].forEach(([u, v, dir, sd]) => k.qperson(u, v, { pose: "photo", dir, seed: sd, phaseOff: sd * 0.07, style: sd % 2 ? "tee" : "dress", hat: "sunhat", hatCol: "#f1e6c8" }));
}

// ---------- people by the pool ----------
function poolPeople(k, t) {
  k.qperson(5.7, 7.9, { pose: "stand", dir: [1, 0.1], seed: 131, ...look(131) });
  k.qperson(7.2, 8.85, { pose: "sitground", dir: [0.1, -1], seed: 132, kid: true, top: "#48a3a0", bottom: "#4a3b30" });
  k.qwalker([[6.4, 5.95], [7.3, 5.9], [8.3, 5.95]], { speed: 0.28, offset: 0.4, seed: 133, dwell: 1.6, ...look(133) });
}

// ---------- falconer ----------
function falconer(k, t) {
  const c = k.ctx, u = 4.1, v = 5.6, T = 16, cyc = (t % T) / T;
  k.q(u + v, () => {
    k.person(u, v, { pose: "stand", dir: [0.9, 0.3], seed: 120, style: "coat", top: "#e8dcc2", bottom: "#e8dcc2", hat: "cap", hatCol: "#f6f2e8", skin: "#c68a62", shoes: "#6a4a30" });
    if (cyc < 0.55 || cyc > 0.92) {
      const [gx, gy] = at(u + 0.22, v - 0.1, 0.62), fl = cyc > 0.92 ? Math.sin((cyc - 0.92) * 120) : (cyc < 0.08 ? Math.sin(cyc * 100) : 0);
      c.fillStyle = "#4a3320"; c.beginPath(); c.roundRect(gx - 3, gy - 2, 7, 5, 2); c.fill();
      falcon(c, gx + 1, gy - 5, 0, fl > 0 ? t * 20 : 0, 0.8);
    }
  });
  if (cyc >= 0.55 && cyc <= 0.92) {
    const s = (cyc - 0.55) / 0.37, fade = Math.min(1, s * 8, (1 - s) * 8);
    const pos = (q) => { const a = q * TAU, r = 1.7, h = 1.6 + (1 - Math.cos(a)) * 0.9 + Math.sin(a * 2) * 0.12; return [u + 0.2 + Math.sin(a) * r * fade2(q), v - 0.1 + (1 - Math.cos(a)) * r * 0.5, lerp(0.8, h, fade2(q))]; };
    const fade2 = (q) => Math.min(1, q * 8, (1 - q) * 8);
    const p0 = pos(s), p1 = pos(Math.min(1, s + 0.01));
    k.q(30, () => { const [x, y] = at(...p0), [nx, ny] = at(...p1); falcon(c, x, y, Math.atan2(ny - y, nx - x) * 0.6, t * 14, 1.0 + Math.sin(Math.PI * s) * 0.3); });
  }
}

// ---------- 4x4 looping over the dunes, with a dust trail ----------
function jeepAxis(s) { const ax = Math.abs(s.du) > Math.abs(s.dv); return { ax: ax ? "u" : "v", dir: ax ? Math.sign(s.du) : Math.sign(s.dv) }; }
function jeep(k, u, v, z, ax, dir, t) {
  const c = k.ctx, W = "#f1eee4", bz = z + 0.2, L = 1.2, Wd = 0.54;
  // world box from local (a along heading, b across): a in [a0,a0+da]
  const B = (a0, b0, zz, da, db, dz, col) => (ax === "v" ? k.box(u + b0, v + a0, zz, db, da, dz, col, { shadow: false, hatch: false }) : k.box(u + a0, v + b0, zz, da, db, dz, col, { shadow: false, hatch: false }));
  const A0 = -L / 2, B0 = -Wd / 2;
  // shadow
  k.poly(ax === "v" ? [[u - 0.25, v - 0.7, z + 0.01], [u + 0.45, v - 0.5, z + 0.01], [u + 0.45, v + 0.75, z + 0.01], [u - 0.25, v + 0.6, z + 0.01]] : [[u - 0.7, v - 0.25, z + 0.01], [u + 0.75, v - 0.5, z + 0.01], [u + 0.6, v + 0.45, z + 0.01], [u - 0.5, v + 0.45, z + 0.01]], "rgba(80,50,20,0.22)", { stroke: false });
  B(A0, B0, bz, L, Wd, 0.3, W);
  const cab = dir > 0 ? A0 : A0 + 0.32; // cabin set back from the front
  B(cab + 0.06, B0 + 0.02, bz + 0.3, 0.82, Wd - 0.04, 0.32, shade(W, 0.02));
  B(cab + 0.08, B0 + 0.02, bz + 0.62, 0.8, Wd - 0.04, 0.05, "#5a4a3a");
  B(cab + 0.12, B0 + 0.08, bz + 0.67, 0.3, Wd - 0.16, 0.14, "#9a6a3a");
  B(cab + 0.46, B0 + 0.08, bz + 0.67, 0.26, Wd - 0.16, 0.1, "#3a5a78");
  // windows + wheels on the visible long side (right face for v-heading, left face for u-heading) and on the end face
  const S = CTS.S, wheel = (px, py, rr, col) => { c.beginPath(); c.arc(px, py, rr, 0, TAU); c.fillStyle = col; c.fill(); };
  const sideP = (a, zz) => (ax === "v" ? P(u + Wd / 2, v + a, zz) : P(u + a, v + Wd / 2, zz));
  for (let i = 0; i < 3; i++) { const a0 = cab + 0.12 + i * 0.25; const pts = [[a0, bz + 0.34], [a0 + 0.21, bz + 0.34], [a0 + 0.21, bz + 0.54], [a0, bz + 0.54]].map(([a, zz]) => sideP(a, zz)); k.path(pts, { fill: "#3d5062", lw: 0.9, wobble: 0 }); }
  for (const wa of [A0 + 0.2, A0 + L - 0.2]) {
    const [ox, oy] = sideP(wa, z + 0.13);
    c.save(); c.transform(ax === "v" ? -S : S, S * CTS.YS, 0, -S * CTS.ZS, ox, oy); c.beginPath(); c.arc(0, 0, 0.19, 0, TAU); c.restore(); c.fillStyle = "#26221e"; c.fill();
    c.save(); c.transform(ax === "v" ? -S : S, S * CTS.YS, 0, -S * CTS.ZS, ox, oy); c.beginPath(); c.arc(0, 0, 0.08, 0, TAU); c.restore(); c.fillStyle = "#9a9aa0"; c.fill();
  }
  // headlights at the front end when it faces the viewer (towards +u or +v)
  if (dir > 0) { const fe = A0 + L; for (const bb of [B0 + 0.08, B0 + Wd - 0.08]) { const [x, y] = ax === "v" ? P(u + bb, v + fe, bz + 0.12) : P(u + fe, v + bb, bz + 0.12); c.beginPath(); c.arc(x, y, 2.4, 0, TAU); c.fillStyle = "#fff6c0"; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke(); } }
}
function jeepRun(k, t) {
  const st = (tt) => wrap(JSP, tt * JEEP_SPEED), s = st(t), { ax, dir } = jeepAxis(s);
  const z0 = (a) => Math.max(H(a.u, a.v), H(a.u + a.du * 0.4, a.v + a.dv * 0.4), H(a.u - a.du * 0.4, a.v - a.dv * 0.4));
  const bounce = Math.abs(Math.sin(t * 9)) * 0.05 + 0.03 * Math.sin(t * 5.3);
  k.q(s.u + s.v + 0.9, () => {
    const c = k.ctx;
    for (let i = 0; i < 18; i++) {
      const age = i * 0.09, a = st(t - age), [x, y] = P(a.u + 0.08 * Math.sin(i * 2), a.v, H(a.u, a.v) + 0.15 + age * 0.9);
      const r = 5 + age * 16, al = 0.5 * (1 - age / 1.65);
      const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(238,205,150,${al})`); g.addColorStop(1, "rgba(238,205,150,0)");
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    }
  });
  k.q(s.u + s.v + 0.4, () => jeep(k, s.u, s.v, z0(s) + bounce, ax, dir, t));
}

// ---------- wind-blown sand wisps off the crests ----------
function wisps(k, t) {
  k.q(25, () => {
    const c = k.ctx; c.save(); c.lineCap = "round";
    const R = rng(33), base = [[1.3, 2.6], [1.2, 4.2], [1.5, 1.7], [2.8, 1.2], [4.4, 1.0], [5.6, 1.4], [7.2, 1.2], [8.4, 1.8], [3.6, 3.0], [5.2, 2.6], [6.8, 2.6], [1.0, 5.3]];
    for (let i = 0; i < base.length; i++) {
      const ph = (t * (0.18 + R() * 0.1) + R()) % 1, a = Math.sin(Math.PI * ph), [u, v] = [base[i][0] + ph * 0.6, base[i][1] + ph * 0.5];
      const [x0, y0] = PT(u, v, 0.1 + ph * 0.25), len = 16 + R() * 14;
      c.beginPath(); c.moveTo(x0, y0); c.bezierCurveTo(x0 + len * 0.4, y0 - 3, x0 + len * 0.7, y0 + 2, x0 + len, y0 - 1);
      c.strokeStyle = `rgba(245,215,160,${0.55 * a})`; c.lineWidth = 2.4; c.stroke();
      c.strokeStyle = `rgba(255,240,205,${0.5 * a})`; c.lineWidth = 1; c.stroke();
    }
    c.restore();
  });
}
