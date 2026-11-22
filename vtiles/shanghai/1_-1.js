// SHANGHAI · Nanjing Road pedestrian mall: beaux-arts department stores with clock domes, art-deco tower, neon banners, tourist tram, shoppers
import { P, INK, shade, mix, lerp, clamp, hash, crowd, textSign } from "./_props.js";
import { lanternLamp, planter } from "./_h_a.js";
import { fp, makeWall, storeWall, slateRoof, dormer, chimney, clockDome, bladeSign, zigSign, decoTower, arcade, course, STONE } from "./_t1_-1.js";

export const camera = { u: 5, v: 5.4, z: 1.6, zoom: 2.1 };

// ---------------- tram ----------------
const TU = 4.85, TV0 = 3.5, TV1 = 7.3;
function tramState(t) {
  const L = TV1 - TV0, speed = 0.5, dwell = 2.8, wt = L / speed, per = 2 * (wt + dwell), tt = ((t % per) + per) % per, ease = (x) => x * x * (3 - 2 * x);
  let f, dir, mv = true;
  if (tt < dwell) { f = 0; dir = 1; mv = false; } else if (tt < dwell + wt) { f = ease((tt - dwell) / wt); dir = 1; } else if (tt < 2 * dwell + wt) { f = 1; dir = -1; mv = false; } else { f = 1 - ease((tt - 2 * dwell - wt) / wt); dir = -1; }
  return { v: TV0 + f * L, dir, moving: mv, dist: f * L + (dir < 0 ? 0 : 0) };
}
function tram(k, t) {
  const c = k.ctx, s = tramState(t), u0 = TU, v0 = s.v, bob = s.moving ? Math.sin(t * 15) * 0.006 : 0, half = 1.45, hw = 0.5, M = "#8e2a24";
  const dirv = s.dir;
  k.ell(u0, v0, 0, 1.15, "rgba(60,45,30,0.17)", { stroke: false });
  // wheels
  for (const x of [-0.95, -0.45, 0.45, 0.95]) for (const y of [-hw + 0.02, hw - 0.02]) {
    const [px, py] = P(u0 + y, v0 + x, 0.14 + bob); c.fillStyle = INK; c.beginPath(); c.ellipse(px, py, 5.4, 6.4, 0, 0, 7); c.fill();
    c.strokeStyle = "#c9b27a"; c.lineWidth = 1; const a = (s.v + (s.dir < 0 ? 0 : 0)) * 6 + x; c.beginPath(); c.moveTo(px - Math.cos(a) * 4, py - Math.sin(a) * 4.8); c.lineTo(px + Math.cos(a) * 4, py + Math.sin(a) * 4.8); c.moveTo(px + Math.sin(a) * 4, py - Math.cos(a) * 4.8); c.lineTo(px - Math.sin(a) * 4, py + Math.cos(a) * 4.8); c.stroke();
  }
  const Z = 0.2 + bob;
  k.box(u0 - hw, v0 - half, Z, 0.08, half * 2, 0.55, M, { hatch: false, shadow: false, left: "#a03229", right: "#74201b" });          // far wall
  k.box(u0 - hw, v0 - half, Z, hw * 2, half * 2, 0.1, "#6e5a40", { hatch: false, shadow: false });                                   // floor
  k.box(u0 - hw, v0 - half, Z, hw * 2, 0.08, 0.55, M, { hatch: false, shadow: false, left: "#a03229", right: "#74201b" });            // back end wall
  // passengers (seated heads and shoulders above the panel)
  const pass = [[-1.1, -0.15, 401], [-0.7, 0.12, 402], [-0.3, -0.12, 403], [0.1, 0.14, 404], [0.5, -0.1, 405], [0.9, 0.1, 406]];
  pass.forEach(([x, y, sd], i) => { if (i !== 3 || true) k.person(u0 + y, v0 + x, { z: 0.3 + bob, seed: sd, pose: sd === 403 ? "wave" : "stand", dir: [0.7, 0.7], shadow: false, h: 0.6, kid: sd === 404 }); });
  const dx = dirv > 0 ? 1.28 : -1.28;
  k.person(u0, v0 + dx, { z: 0.3 + bob, seed: 410, pose: "stand", dir: [0, dirv], shadow: false, h: 0.62, hat: "cap", hatCol: "#2f4b6c" });
  k.box(u0 + hw - 0.08, v0 - half, Z, 0.08, half * 2, 0.55, M, { hatch: false, shadow: false, left: "#a03229", right: "#74201b" });      // near wall
  k.box(u0 - hw, v0 + half - 0.08, Z, hw * 2, 0.08, 0.55, M, { hatch: false, shadow: false, left: "#a03229", right: "#74201b" });     // front end wall
  // gold trim line along near wall
  c.strokeStyle = "#e3b54c"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(...P(u0 + hw, v0 - half, Z + 0.4)); c.lineTo(...P(u0 + hw, v0 + half, Z + 0.4)); c.stroke();
  c.beginPath(); c.moveTo(...P(u0 + hw, v0 + half, Z + 0.4)); c.lineTo(...P(u0 - hw, v0 + half, Z + 0.4)); c.stroke();
  // posts + roof beam
  c.lineCap = "round";
  for (let i = 0; i < 7; i++) for (const y of [-hw + 0.04, hw - 0.04]) {
    const x = -half + 0.1 + i * ((half * 2 - 0.2) / 6), p0 = P(u0 + y, v0 + x, 0.75 + bob), p1 = P(u0 + y, v0 + x, 1.55 + bob);
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(...p0); c.lineTo(...p1); c.stroke(); c.strokeStyle = "#e0b64e"; c.lineWidth = 1.3; c.stroke();
  }
  // barrel roof in strips (far to near)
  const ns = 13, zr = (y) => 1.55 + bob + 0.36 * (1 - (y / (hw + 0.08)) ** 2);
  for (let i = 0; i < ns; i++) {
    const y0 = -hw - 0.08 + (i / ns) * (hw * 2 + 0.16), y1 = -hw - 0.08 + ((i + 1) / ns) * (hw * 2 + 0.16), vx0 = v0 - half - 0.12, vx1 = v0 + half + 0.12;
    const col = i % 4 === 2 ? "#b2342c" : "#f6ebcc", sh = 0;
    fp(c, [P(u0 + y0, vx0, zr(y0)), P(u0 + y0, vx1, zr(y0)), P(u0 + y1, vx1, zr(y1)), P(u0 + y1, vx0, zr(y1))], shade(col, 0.07 - 0.24 * Math.pow(i / (ns - 1), 1.2)), "rgba(42,36,32,0.65)", 0.6);
  }
  // roof edge valance + front scallops
  c.strokeStyle = "#e3b54c"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(...P(u0 + hw + 0.08, v0 - half - 0.12, zr(hw + 0.08))); c.lineTo(...P(u0 + hw + 0.08, v0 + half + 0.12, zr(hw + 0.08))); c.stroke();
  for (let i = 0; i < 18; i++) { const x = v0 - half - 0.1 + (i + 0.5) * ((half * 2 + 0.2) / 18), [px, py] = P(u0 + hw + 0.08, x, zr(hw + 0.08)); c.fillStyle = i % 2 ? "#f3e7c6" : "#b2342c"; c.beginPath(); c.arc(px, py + 1.5, 3.6, 0, Math.PI); c.fill(); c.strokeStyle = "rgba(42,36,32,0.7)"; c.lineWidth = 0.6; c.stroke(); }
  // pantograph pole + destination board + headlamp
  const [pa, pb] = P(u0, v0, 2.0 + bob), [, pb2] = P(u0, v0, 2.5); c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(pa - 5, pa * 0 + pb); c.lineTo(pa, pb2); c.lineTo(pa + 5, pb); c.stroke();
  const [bx, by] = P(u0, v0 + (dirv > 0 ? half : -half) + 0.04, 1.3 + bob);
  textSign(k, bx, by - 20, 28, 9, "南京路", { bg: "#6e1b16", fg: "#f6d878", size: 7 });
  const [hx, hy] = P(u0 + 0.0, v0 + dx * 1.07, 0.55 + bob); c.save(); c.globalAlpha = 0.65; c.fillStyle = "#ffe9a0"; c.beginPath(); c.arc(hx, hy, 4.5 + (s.moving ? 1 : 0), 0, 7); c.fill(); c.restore();
  c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.arc(hx, hy, 4.5, 0, 7); c.stroke();
}

// ---------------- buildings ----------------
const SL = "#566f9a";
const awnL = (i) => i % 2 === 0, awnR = (i) => i % 2 === 1;
const awnGreen = (i) => (i % 4 === 1 || i % 4 === 3 ? "#2f6a4a" : "#c9322b");
function leftTower(k, t) {
  const c = k.ctx, H = 6.0, D = 9.4;
  // faces: L front (v=D), chamfer, R side (u=2.9)
  k.q(0.2 + D + 0.3, () => {
    k.shadow([[2.9, 7.7, 0], [4.4, 8.1, 0], [4.4, 9.3, 0], [2.9, 9.4, 0]], 0.1);
    const Wl = makeWall([0.2, D], [1.95, D], [0, 1]), Wc = makeWall([1.95, D], [2.9, D - 0.95], [0.707, 0.707]), Wr = makeWall([2.9, D - 0.95], [2.9, 7.7], [1, 0]);
    // flat roof top
    const top = [[0.2, D], [1.95, D], [2.9, D - 0.95], [2.9, 7.7], [0.2, 7.7]].map((p) => P(p[0], p[1], H));
    fp(c, top, "#d8c595", INK, 1.2);
    storeWall(c, Wr, { H, g: 2.0, bw: 0.8, t, seed: 3, awn: awnL, rows: 3 });
    storeWall(c, Wl, { H, g: 2.0, bw: 0.85, t, seed: 4, awn: (i) => i === 0, awnCol: () => "#c9322b", rows: 3 });
    storeWall(c, Wc, { H, g: 2.0, bw: 0.7, t, seed: 5, rows: 3, lit: 0.1 });
    clockDome(k, 1.55, 8.55, H, { r: 0.85, drumH: 1.3, domeH: 1.05, ph: 0.2 });
  });
}
function leftBody(k, t) {
  const U = 2.4, H = 6.2;
  k.q(U + 7.7 + 0.2, () => {
    k.shadow([[U, 3.0, 0], [U + 1.5, 3.4, 0], [U + 1.5, 7.7, 0], [U, 7.7, 0]], 0.1);
    const W = makeWall([U, 7.7], [U, 3.0], [1, 0]);
    storeWall(c0(k), W, { H, g: 2.0, bw: 0.95, t, seed: 7, awn: (i) => i % 2 === 1, awnCol: awnGreen, rows: 3 });
    const inset = 0.9;
    slateRoof(k, 0.2, 3.0, U - 0.2, 4.7, H + 0.02, 1.4, inset, SL);
    for (const a of [3.6, 4.5, 5.4, 6.3, 7.1]) dormer(k, "R", 0.2, 3.0, U - 0.2, 4.7, H + 0.02, 1.4, inset, a - 3.0, hash(a * 9) < 0.3);
    chimney(k, 0.7, 3.4, H + 0.9, 0.34, 1.0); chimney(k, 0.8, 6.4, H + 0.9, 0.3, 0.8);
  });
}
const c0 = (k) => k.ctx;
function leftPavilion(k, t) {
  const U = 2.62, H = 6.2;
  k.q(U + 3.0 + 0.3, () => {
    const W = makeWall([U, 3.0], [U, 1.0], [1, 0]);
    k.shadow([[U, 1.0, 0], [U + 1.4, 1.3, 0], [U + 1.4, 3.0, 0], [U, 3.0, 0]], 0.1);
    storeWall(c0(k), W, { H, g: 2.0, bw: 0.7, t, seed: 11, awn: (i) => i === 1, rows: 3, balcony: true });
    fp(c0(k), [[0.2, 3.0], [U, 3.0], [U, 1.0], [0.2, 1.0]].map((p) => P(p[0], p[1], H)), "#d8c595", INK, 1.2);
    clockDome(k, 1.5, 2.0, H, { r: 0.8, drumH: 1.0, domeH: 1.15, clock: false, ph: 0.9 });
  });
}
function leftEnd(k, t) {
  const U = 2.4, H = 5.6;
  k.q(U + 1.0 + 0.2, () => {
    const W = makeWall([U, 1.0], [U, 0.2], [1, 0]);
    storeWall(c0(k), W, { H, g: 2.0, bw: 0.8, t, seed: 13, rows: 2, awn: () => false });
    slateRoof(k, 0.2, 0.2, U - 0.2, 0.8, H + 0.02, 1.0, 0.5, SL, { courses: 5 });
  });
}
function rightTower(k, t) {
  const H = 6.0, V = 2.9;
  k.q(10 + V + 0.4, () => {
    k.shadow([[10, 1.0, 0], [11.5, 1.4, 0], [11.5, 2.9, 0], [10, 2.9, 0]], 0.1);
    const Wl = makeWall([7.9, V], [9.05, V], [0, 1]), Wc = makeWall([9.05, V], [10, V - 0.95], [0.707, 0.707]), Wr = makeWall([10, V - 0.95], [10, 0.5], [1, 0]);
    fp(c0(k), [[7.9, V], [9.05, V], [10, V - 0.95], [10, 0.5], [7.9, 0.5]].map((p) => P(p[0], p[1], H)), "#d8c595", INK, 1.2);
    storeWall(c0(k), Wl, { H, g: 2.0, bw: 0.95, t, seed: 21, rows: 3, awn: (i) => i === 0, awnCol: () => "#c9322b" });
    storeWall(c0(k), Wc, { H, g: 2.0, bw: 0.7, t, seed: 22, rows: 3, lit: 0.1 });
    storeWall(c0(k), Wr, { H, g: 2.0, bw: 0.75, t, seed: 23, rows: 3, awn: awnL });
    clockDome(k, 8.85, 1.9, H, { r: 0.85, drumH: 1.3, domeH: 1.05, ph: 1.6 });
  });
}
function rightBody(k, t) {
  const V = 2.55, H = 6.2;
  k.q(7.9 + V + 0.2, () => {
    k.shadow([[6.3, V, 0], [7.9, V, 0], [7.9, V + 1.4, 0], [6.3, V + 1.4, 0]], 0.1);
    const W = makeWall([6.3, V], [7.9, V], [0, 1]);
    storeWall(c0(k), W, { H, g: 2.0, bw: 0.8, t, seed: 31, rows: 3, awn: awnR, awnCol: () => "#c9322b" });
    const inset = 0.8;
    slateRoof(k, 6.3, 0.5, 1.6, V - 0.5, H + 0.02, 1.4, inset, SL);
    for (const a of [6.7, 7.5]) dormer(k, "L", 6.3, 0.5, 1.6, V - 0.5, H + 0.02, 1.4, inset, a - 6.3, hash(a * 5) < 0.4);
    chimney(k, 7.0, 0.9, H + 0.8, 0.3, 0.8);
  });
}
function rightTowerRoof(k) {
  // slate mansard behind the right tower clock dome, spanning the right wing
  const H = 6.0;
  k.q(9 + 1.5 + 0.1, () => { slateRoof(k, 7.9, 0.5, 2.1, 2.4, H + 0.02, 0.0001, 0.0001, SL); });
}
function decoBlock(k, t) {
  k.q(4.6 + 2.2 + 3.0, () => {
    const c = k.ctx; k.shadow([[4.6, 2.2, 0], [6.3, 2.2, 0], [7.2, 3.4, 0], [5.5, 3.4, 0]], 0.1);
    decoTower(k, 4.6, 0.3, 1.7, 1.9, t);
    const W = makeWall([4.6, 2.2], [6.3, 2.2], [0, 1]);
    fp(c, [W.pt(0, 0, 0.02), W.pt(W.len, 0, 0.02), W.pt(W.len, 2.1, 0.02), W.pt(0, 2.1, 0.02)], "#dcc58f", INK, 1.3);
    arcade(c, W, { a0: 0, a1: W.len, gh: 2.0, bw: 0.85, t, seed: 41, awn: (i) => i === 1, awnCol: () => "#c9322b" });
    course(c, W, -0.03, W.len + 0.03, 2.0, 0.2, 0.2, "#f3e6c0");
  });
}

export default function draw(k, t) {
  const c = k.ctx;
  // ---------- ground: warm herringbone paving ----------
  k.slab("#ecd2ae", { side: "#e7cf9c" });
  k.stipple([[0, 0], [10, 0], [10, 10], [0, 10]], { density: 10, seed: 5 });
  c.save(); k._trace([P(0, 0), P(10, 0), P(10, 10), P(0, 10)], true, 0); c.clip();
  // darker kerb apron along building fronts
  k.ground([[0, 0], [2.7, 0], [2.7, 10], [0, 10]], "#e1c59d", { stroke: false });
  k.ground([[0, 0], [10, 0], [10, 2.7], [0, 2.7]], "#e1c59d", { stroke: false });
  c.strokeStyle = "rgba(150,105,70,0.32)"; c.lineWidth = 0.8; c.beginPath();
  for (let i = 0; i <= 62; i++) { const s = i * 0.16; c.moveTo(...P(s, 0)); c.lineTo(...P(s, 10)); c.moveTo(...P(0, s)); c.lineTo(...P(10, s)); }
  c.stroke();
  for (let i = 0; i < 60; i++) for (let j = 0; j < 60; j++) { const h = hash(i * 97 + j * 31); if (h < 0.22) k.ground([[i * 0.166, j * 0.166], [i * 0.166 + 0.166, j * 0.166], [i * 0.166 + 0.166, j * 0.166 + 0.166], [i * 0.166, j * 0.166 + 0.166]], h < 0.11 ? "rgba(205,150,120,0.22)" : "rgba(255,240,210,0.3)", { stroke: false }); }
  // inlaid border
  k.ground([[3.1, 3.0], [9.8, 3.0], [9.8, 9.7], [3.1, 9.7]], null, { stroke: "rgba(176,128,84,0.65)", lw: 2 });
  for (const uu of [TU - 0.3, TU + 0.3]) k.ground([[uu - 0.02, 2.7], [uu + 0.02, 2.7], [uu + 0.02, 9.2], [uu - 0.02, 9.2]], "#7a6f60", { lw: 0.6, wobble: 0 });
  c.restore();

  // ---------- buildings ----------
  leftEnd(k, t); leftPavilion(k, t); leftBody(k, t); leftTower(k, t);
  decoBlock(k, t); rightBody(k, t); rightTower(k, t);

  // ---------- neon banners ----------
  k.q(2.4 + 5.0 + 3.0, () => bladeSign(k, 372, 424, 52, 168, "dia", "南京东路", ["#ff4a5a", "#ffd24a", "#ff4a5a", "#ffd24a"], 0));
  k.q(5.5 + 2.4 + 3.2, () => zigSign(k, 631, 358, 48, 150, "步行街", 1.7));
  k.q(8.2 + 2.9 + 3.0, () => bladeSign(k, 746, 494, 46, 112, "tri", "百货店", ["#e8353a", "#ffd24a", "#e8353a"], 3.1));
  // red hanging lantern strings
  [[2.7, 8.0], [3.1, 4.5], [9.1, 2.95]].forEach(([u, v], i) => k.q(u + v + 1.5, () => { for (let j = 0; j < 3; j++) { const [x, y] = P(u, v + j * 0.5, 2.6); const sw = Math.sin(t * 1.9 + i + j) * 1.8; c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x, y - 6); c.lineTo(x + sw, y + 2); c.stroke(); c.fillStyle = "#d8392e"; c.beginPath(); c.ellipse(x + sw, y + 8, 4.6, 6, 0, 0, 7); c.fill(); c.lineWidth = 0.9; c.stroke(); c.fillStyle = "#e8bd4a"; c.fillRect(x + sw - 2, y + 1.5, 4, 1.4); c.fillRect(x + sw - 2, y + 13, 4, 1.4); } }));

  // ---------- plaza furniture ----------
  const PL = (u, v, s) => k.q(u + v + 1.2, () => { planter(k, u - 0.4, v - 0.4, 0.8, 0.8, s); k.tree(u, v, { r: 1.0, h: 1.95, seed: 60 + s, col: s % 2 ? "#8fa94f" : "#86a548" }); });
  PL(3.65, 6.35, 1); PL(2.7, 1.5, 2); PL(3.9, 9.2, 3); PL(9.2, 9.3, 4); PL(8.5, 4.6, 5);
  [[3.85, 8.4], [3.3, 3.9], [7.6, 5.6], [9.0, 8.2], [6.4, 3.0]].forEach(([u, v], i) => k.q(u + v + 0.3, () => { const [lx, ly] = P(u, v, 0); c.save(); c.translate(lx, ly); c.scale(1.35, 1.35); c.translate(-lx, -ly); lanternLamp(k, u, v, i * 1.7); c.restore(); }));
  k.q(3.3 + 7.0 + 0.5, () => k.bench(3.1, 6.9, { along: "v" })); k.q(4.4 + 9.6 + 0.5, () => k.bench(4.6, 9.55, { along: "u" }));
  k.q(8.3 + 3.1 + 0.5, () => k.bench(8.3, 3.2, { along: "v" })); k.q(8.4 + 6.3 + 0.5, () => k.bench(8.5, 6.0, { along: "v" }));

  // ---------- tram ----------
  k.q(TU + tramState(t).v + 1.2, () => tram(k, t));

  // ---------- shoppers ----------
  const routes = [
    [[2.95, 8.6], [2.95, 7.0], [3.0, 5.0], [3.1, 3.2]],
    [[6.25, 8.9], [6.15, 6.6], [6.05, 4.6], [6.2, 3.1]],
    [[7.4, 9.0], [7.5, 6.6], [7.3, 4.2], [7.6, 3.3]],
    [[4.9, 9.5], [6.4, 9.6], [7.9, 9.55], [8.8, 8.7]],
    [[9.4, 8.2], [9.4, 6.0], [9.25, 3.9]],
    [[6.4, 2.95], [7.8, 3.0], [9.0, 3.3]],
    [[5.2, 8.7], [5.0, 8.7]],
    [[4.2, 8.0], [4.15, 6.6], [4.05, 5.0]],
  ];
  crowd(k, routes, [[0, 0.0, 201], [0, 0.45, 202], [0, 0.8, 203], [1, 0.1, 204], [1, 0.55, 205], [1, 0.85, 206], [2, 0.2, 207], [2, 0.65, 208], [3, 0.3, 209], [3, 0.75, 210], [4, 0.2, 211], [4, 0.6, 212], [5, 0.1, 213], [5, 0.6, 214], [7, 0.3, 215], [7, 0.8, 216]], { bag: true, h: 1.05 });
  k.qperson(8.65, 6.1, { pose: "sit", bench: true, seatZ: 0.25, dir: [1, 0], seed: 221, h: 0.95 });
  k.qperson(3.25, 7.1, { pose: "sit", bench: true, seatZ: 0.25, dir: [1, 0], seed: 222, h: 0.95 });
  k.qperson(8.45, 3.4, { pose: "sit", bench: true, seatZ: 0.25, dir: [1, 0], seed: 225, h: 0.95 });
  k.qperson(5.9, 8.9, { pose: "photo", dir: [-0.7, -0.7], seed: 223, h: 1.05 }); k.qperson(6.2, 9.0, { pose: "wave", dir: [-0.7, -0.7], seed: 224, h: 1.05 });
  k.flush();
  k.circlingBird(520, 220, 90, 22, { speed: 0.6, phase: 0 }); k.cloud(160, 200, { s: 0.8, phase: 2 }); k.cloud(850, 190, { s: 0.7, phase: 4 });
}
