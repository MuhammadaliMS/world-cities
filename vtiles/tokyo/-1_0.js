// TOKYO · Akihabara Electric Town (grid pass: everything on the 10x10 footprint, axis-aligned boxes)
// Layout (u,v): viaduct deck u 1.3-8.7 x v 2.0-3.5 (z 3.65) with a station/portal box at each end (u 0.3-1.3 and 8.7-9.7);
// the Yamanote train loops through the portals; shop arches face the plaza (L face); five signboard towers behind
// (v 0.3-1.9, u 0.3-9.7); plaza v 4-9.7: mural block + electronics shop left, gacha shop + kiosk right, tree bed centre.
import { P, INK, shade, lerp, clamp, rng, hash } from "../../lib/vec-kit.js";
import { stdProj, mbox, mwin, mband, faceDraw, faceSign, chochin, lanternString, petals, screenFace, vending, planter, acUnit } from "./_props.js";
import { artPanel, stripeBanner, wallAC, balcony, tower, hull, roofKit } from "./_g-1_0.js";

const U0 = 1.3, U1 = 8.7, V0 = 2.0, V1 = 3.5, DECK = 3.65, GIRD = 0.7, PH = DECK + 1.9;
const PIERS = [3.1, 5.0, 6.9];
const ARCH = [[1.55, 2.65], [3.55, 4.55], [5.45, 6.45], [7.35, 8.5]];

const ROUTES = [
  [[3.2, 5.0], [4.0, 5.1], [6.0, 5.0], [7.2, 5.2]],
  [[5.0, 4.7], [5.0, 6.2], [5.0, 8.0], [5.3, 9.0]],
  [[7.2, 5.3], [7.2, 6.8], [7.2, 8.3], [6.3, 8.9]],
  [[5.0, 8.6], [6.4, 8.6], [8.0, 8.5], [9.2, 8.7]],
  [[1.0, 5.3], [1.9, 5.6], [3.0, 5.7], [3.9, 5.3]],
];
const OBST = [[0.3, 6.1, 2.1, 9.6], [2.0, 6.2, 3.2, 9.1], [3.1, 6.3, 4.5, 9.0], [5.5, 6.5, 6.8, 7.8], [7.6, 5.4, 9.6, 7.7], [8.5, 4.0, 9.6, 5.1]];
export { ROUTES, OBST };

export const camera = { u: 5, v: 4.8, z: 3.6, zoom: 1.3 };

const T_LED = ["秋葉原", "新作入荷", "アニメ", "セール中"];
const sgn = faceSign;

// ---- back towers (behind the viaduct; signs above the train line, z > 5) -----------------------------
function backTowers(k, t) {
  const c = k.ctx;
  tower(k, { u: 0.3, v: 0.3, du: 1.7, dv: 1.6, h: 7.0, col: "#e9d7a0", seed: 1, ac: 2, ant: 28, lit: 0.6,
    draw: (b, h) => {
      sgn(k, b, "L", 0.06, 0.4, 4.9, h - 0.4, "ゲーム", { bg: "#2f5fb5", fg: "#fff", vertical: true, ar: 0.34 });
      sgn(k, b, "L", 0.5, 0.95, 5.4, 6.4, "中古", { bg: "#f4c542", fg: "#c8342a", size: 70, ar: 1.0 });
      sgn(k, b, "R", 0.02, 0.3, 4.9, h - 0.4, "新品", { bg: "#c8342a", fg: "#fff", vertical: true, ar: 0.25 });
    } });
  tower(k, { u: 2.0, v: 0.3, du: 1.7, dv: 1.1, h: 7.4, col: "#efe6d4", seed: 3, ac: 4, ant: 34, lit: 0.55,
    draw: (b, h, g) => {
      faceDraw(k, b, "L", 0.27, 0.8, 5.0, h - 0.4, 100 * 0.62, 100 * 1.7, (gg, w, hh) => stripeBanner(gg, w, hh, ["#f4efe4", "#2f5fb5", "#e8412e", "#35b0a8"]));
      sgn(k, b, "L", 0.06, 0.2, 4.9, h - 0.4, "電気", { bg: "#c8342a", fg: "#fff", vertical: true, ar: 0.32 });
      sgn(k, b, "L", 0.82, 0.97, 4.9, h - 0.4, "秋葉原", { bg: "#1f2a44", fg: "#ffcf3a", vertical: true, ar: 0.32 });
      for (let i = 0; i < 3; i++) wallAC(k, g.u + 0.15 + i * 0.5, g.v + g.dv, 4.5 + (i % 2) * 0.1, "L");
    } });
  // hero glass tower
  tower(k, { u: 3.7, v: 0.3, du: 2.2, dv: 1.65, h: 8.8, col: "#c4d6e4", left: "#cfe0ec", right: "#9db7cc", win: "#7fa6cf", lit: 0.7, seed: 4, ac: 0, tank: true, ant: 40, noWin: true,
    draw: (b, h) => {
      const glass = (zA, zB) => {
        const fl = Math.max(1, Math.round((zB - zA) / 0.62)), dz = (zB - zA) / fl;
        for (const side of ["L", "R"]) for (let r = 0; r < fl; r++) {
          const z0 = zA + r * dz, z1 = z0 + dz - 0.07, cols = side === "L" ? 6 : 3, litp = side === "L" ? 0.5 : 0.85;
          for (let q = 0; q < cols; q++) {
            const s0 = 0.04 + q * 0.92 / cols, s1 = 0.04 + (q + 1) * 0.92 / cols - 0.012;
            const lit = hash(r * 7.3 + q * 3.1 + zA * 5 + (side === "R" ? 40 : 0)) < litp;
            const bl = lit ? "#ffcb68" : (r % 2 ? "#7fb0e0" : "#a6c8ea");
            k.path([b.fp(side, s0, z0), b.fp(side, s1, z0), b.fp(side, s1, z1), b.fp(side, s0, z1)], { fill: side === "R" && !lit ? shade(bl, -0.15) : bl, wobble: 0, lw: 0.7 });
            if (lit) { const [x, y] = b.fp(side, (s0 + s1) / 2, z0 + 0.12); c.fillStyle = "#b6492f"; c.beginPath(); c.arc(x, y - 2, 1.7, 0, 6.3); c.fill(); c.fillStyle = "rgba(60,30,10,0.6)"; c.fillRect(x - 2.5, y, 5, 3.2); }
          }
          mband(k, b, side, z1, z1 + 0.07, "#eef1f2", { lw: 0.5 });
        }
      };
      const c = k.ctx;
      glass(0.3, 4.9); glass(6.15, h - 0.3);
      for (const side of ["L", "R"]) mband(k, b, side, 4.9, 6.15, side === "L" ? "#d9483a" : "#b3382d");
      const ph = Math.floor(t / 2.4) % T_LED.length;
      sgn(k, b, "L", 0.05, 0.95, 5.0, 6.05, T_LED[ph], { bg: Math.sin(t * 6) > -0.5 ? "#c8342a" : "#8d241d", fg: "#fff3b0", size: 66, ar: 4.2 });
      sgn(k, b, "L", 0.0, 0.07, 6.3, h - 0.5, "ガチャ", { bg: "#2f5fb5", fg: "#fff", vertical: true, ar: 0.25 });
      sgn(k, b, "R", 0.04, 0.4, 5.0, h - 0.6, "ゲーム", { bg: "#e8412e", fg: "#fff", vertical: true, ar: 0.32 });
    } });
  tower(k, { u: 5.9, v: 0.3, du: 1.8, dv: 0.9, h: 7.2, col: "#dc5a4a", left: "#e2665a", right: "#b8443a", win: "#f0b8a8", lit: 0.35, seed: 5, ac: 3, ant: 30,
    draw: (b, h, g) => {
      faceDraw(k, b, "L", 0.3, 0.88, 5.3, h - 0.3, 100 * 0.62, 100 * 1.9, (gg, w, hh) => stripeBanner(gg, w, hh, ["#f4efe4", "#e0b02e", "#2f5fb5", "#b84a8a"]));
      sgn(k, b, "L", 0.04, 0.2, 5.3, h - 0.3, "アニメ", { bg: "#2f5fb5", fg: "#fff", vertical: true, ar: 0.3 });
      sgn(k, b, "R", 0.12, 0.88, 5.95, 6.85, "メイド", { bg: "#ff6aa8", fg: "#fff", size: 52, ar: 1.6, border: "#fff" });
    } });
  tower(k, { u: 7.7, v: 0.3, du: 2.0, dv: 1.2, h: 6.6, col: "#eadfca", right: "#ddd0b6", seed: 6, ac: 3, ant: 26, lit: 0.45, pipe: true, dish: true,
    draw: (b, h, g) => {
      faceDraw(k, b, "R", 0.2, 0.92, 1.2, h - 0.4, 100 * 0.62, 100 * 1.7, (gg, w, hh) => stripeBanner(gg, w, hh, ["#f4efe4", "#2f5fb5", "#35b0a8", "#e8412e"]));
      screenFace(k, b, "L", 0.08, 0.5, 5.2, 6.3, { text: T_LED, dur: 2.4 });
      sgn(k, b, "L", 0.56, 0.7, 4.8, h - 0.3, "電気街", { bg: "#c8342a", fg: "#ffe06a", vertical: true, ar: 0.3 });
      sgn(k, b, "L", 0.76, 0.93, 4.8, h - 0.3, "買取", { bg: "#1f2a44", fg: "#fff", vertical: true, ar: 0.3 });
    } });
}

// ---- station portals at both ends of the viaduct ----------------------------------------------------------
function portal(k, t, side) {
  const c = k.ctx, left = side === "left", u = left ? 0.3 : 8.7, v = 1.9, du = 1.0, dv = 1.65, h = PH;
  const b = mbox(k, stdProj, u, v, 0, du, dv, h, "#d6cbb4", { wobble: 0, left: "#ddd2bb", right: "#bcb099" });
  // ground-floor entrance + ticket windows on the L face
  k.path([b.fp("L", 0.14, 0), b.fp("L", 0.86, 0), b.fp("L", 0.86, 2.2), b.fp("L", 0.14, 2.2)], { fill: "#3a2616", wobble: 0, lw: 1.3 });
  k.path([b.fp("L", 0.2, 0.05), b.fp("L", 0.8, 0.05), b.fp("L", 0.8, 2.1), b.fp("L", 0.2, 2.1)], { fill: "#ffd98a", wobble: 0, lw: 0.8 });
  for (const s of [0.35, 0.5, 0.65]) mband(k, b, "L", 0.05, 2.1, "rgba(120,70,30,0.45)", { s0: s - 0.004, s1: s + 0.004, lw: 0.1 });
  sgn(k, b, "L", 0.1, 0.9, 2.35, 3.0, left ? "秋葉原駅" : "電気街口", { bg: "#1f6a3a", fg: "#fff", size: 54, ar: 3.2 });
  mwin(k, b, "L", { rows: 2, cols: 2, z0: 3.2, z1: h - 0.35, color: "#8aa6c4", lit: 0.4, gap: 0.3, mx: 0.12, seed: left ? 3 : 8, lw: 0.9, sheen: true });
  mband(k, b, "L", h - 0.16, h, "#b3a78f"); mband(k, b, "R", h - 0.16, h, "#9e927a");
  if (left) {
    // tunnel mouth on the R face (the train emerges here)
    const s0 = (V1 + 0.05 - 3.45) / dv, s1 = (V1 + 0.05 - 2.4) / dv, z0 = DECK + 0.05, z1 = DECK + 1.75;
    const pts = [b.fp("R", s0, z0), b.fp("R", s1, z0)];
    for (let i = 0; i <= 8; i++) { const f = i / 8, s = lerp(s1, s0, f); pts.push(b.fp("R", s, z1 + Math.sin(f * Math.PI) * 0.22 - 0.1)); }
    k.path(pts, { fill: "#16181c", wobble: 0, lw: 1.4 });
    const [lx, ly] = b.fp("R", (s0 + s1) / 2, z1 + 0.18); c.fillStyle = "#ff9a2e"; c.beginPath(); c.arc(lx, ly, 2, 0, 6.3); c.fill();
  } else {
    sgn(k, b, "R", 0.15, 0.85, 3.0, 4.6, "出口", { bg: "#c8342a", fg: "#fff", size: 60, ar: 1.0, border: "#f4efe4" });
    mwin(k, b, "R", { rows: 1, cols: 2, z0: 0.5, z1: 2.4, color: "#8aa6c4", lit: 0.5, gap: 0.3, mx: 0.12, seed: 11, lw: 0.9 });
  }
  roofKit(k, u, v, du, dv, h, 3, left ? 31 : 32, { ant: left ? 24 : 0 });
  // parapet lip
  c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); b.T.forEach((q, i) => (i ? c.lineTo(...q) : c.moveTo(...q))); c.closePath(); c.stroke();
}

// ---- viaduct -----------------------------------------------------------------------------------------
function viaduct(k, t) {
  const c = k.ctx, W = U1 - U0, S = (a) => (a - U0) / W;
  const b = mbox(k, stdProj, U0, V0, 0, W, V1 - V0, DECK, "#cfc5b2", { wobble: 0, left: "#d6cdb9", right: "#b8ad98" });
  const hz = DECK - GIRD - 0.55, rise = 0.5;
  ARCH.forEach(([a0, a1], i) => {
    const edge = (f) => hz - rise + Math.sqrt(Math.max(0, Math.sin(f * Math.PI))) * rise;
    const top = []; for (let j = 0; j <= 20; j++) { const f = j / 20; top.push(b.fp("L", S(lerp(a0, a1, f)), j === 0 || j === 20 ? hz - rise : edge(f))); }
    const poly = [b.fp("L", S(a0), 0), ...top, b.fp("L", S(a1), 0)];
    k.path(poly, { fill: "#3a2616", wobble: 0, lw: 1.5 });
    c.save(); c.beginPath(); poly.forEach((p, j) => (j ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.clip();
    const [x0, y0] = b.fp("L", S(a0), 0), [x1, y1] = b.fp("L", S(a1), 0), [, yt] = b.fp("L", S(a0), hz);
    const g = c.createLinearGradient(0, yt, 0, y0); g.addColorStop(0, "#ffe2a0"); g.addColorStop(1, "#f0a050"); c.fillStyle = g; c.fillRect(Math.min(x0, x1) - 4, yt - 8, Math.abs(x1 - x0) + 70, y0 - yt + 70);
    const R = rng(i * 11 + 3), nq = Math.max(3, Math.round((a1 - a0) * 3));
    for (let r = 0; r < 4; r++) for (let q = 0; q < nq; q++) { const f = (q + 0.5) / nq, [sx, sy] = b.fp("L", S(lerp(a0, a1, f)), 0.18 + r * 0.46); c.fillStyle = ["#e8607a", "#4aa3d8", "#f4c542", "#7cc47a", "#f4efe4", "#e9813c", "#8a6ad0"][Math.floor(R() * 7)]; c.fillRect(sx - 3.5, sy - 7, 7.5, 7); c.strokeStyle = "rgba(60,30,10,0.7)"; c.lineWidth = 0.6; c.strokeRect(sx - 3.5, sy - 7, 7.5, 7); }
    c.strokeStyle = "rgba(90,50,20,0.75)"; c.lineWidth = 1.2; c.beginPath(); for (let r = 0; r < 4; r++) { c.moveTo(...b.fp("L", S(a0), 0.18 + r * 0.46)); c.lineTo(...b.fp("L", S(a1), 0.18 + r * 0.46)); } c.stroke();
    const ntv = Math.max(1, Math.round((a1 - a0) / 0.9));
    for (let q = 0; q < ntv; q++) { const [sx, sy] = b.fp("L", S(lerp(a0, a1, (q + 0.5) / ntv)), 0.1); const ph = Math.floor(t * 3 + q * 2 + i * 5) % 3; c.fillStyle = ["#7fd0ff", "#ffb0d0", "#a6ff9a"][ph]; c.fillRect(sx - 7, sy - 15, 14, 11); c.strokeStyle = INK; c.lineWidth = 0.9; c.strokeRect(sx - 7, sy - 15, 14, 11); }
    const nc = Math.max(1, Math.round((a1 - a0) / 0.7));
    for (let q = 0; q < nc; q++) { const f = (q + 0.5) / nc, sway = Math.sin(t * 0.9 + q * 2 + i) * 0.08; const [sx, sy] = b.fp("L", S(lerp(a0, a1, f) + sway), 0.0); c.fillStyle = ["#2f3e5e", "#6a4a3a", "#3a5a4a"][(q + i) % 3]; c.beginPath(); c.roundRect(sx - 4, sy - 22, 8, 22, 3); c.fill(); c.fillStyle = "#e8c4a0"; c.beginPath(); c.arc(sx, sy - 25, 3.6, 0, 6.3); c.fill(); }
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath(); poly.forEach((p, j) => (j ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.stroke();
    const names = ["ラジオ", "ゲーム", "パーツ", "PC"], cs = ["#1f3a6a", "#c8342a", "#2d6a4a", "#5a2a7a"];
    sgn(k, b, "L", S(lerp(a0, a1, 0.1)), S(lerp(a0, a1, 0.9)), hz - rise + 0.5, DECK - GIRD - 0.06, names[i], { bg: cs[i], fg: "#fff", size: 54, ar: 3.4 });
    for (const f of [0.25, 0.75]) { const [lx, ly] = b.fp("L", S(lerp(a0, a1, f)), hz - 0.25); chochin(k, lx, ly + 8, { r: 4.0, glow: true, seed: i * 4 + f * 9, amp: 0.9, string: false, text: i === 1 && f === 0.75 ? "祭" : undefined }); }
  });
  // girder band: steel panels + rivets
  const gz = DECK - GIRD;
  k.path([b.fp("L", 0, gz), b.fp("L", 1, gz), b.fp("L", 1, DECK), b.fp("L", 0, DECK)], { fill: "#a9a79f", wobble: 0, lw: 1.2 });
  c.strokeStyle = "rgba(50,50,56,0.7)"; c.lineWidth = 0.9; c.beginPath(); for (let a = U0; a < U1; a += 0.55) { c.moveTo(...b.fp("L", S(a), gz)); c.lineTo(...b.fp("L", S(a), DECK)); } c.stroke();
  c.fillStyle = "rgba(70,70,76,0.7)"; for (let a = U0 + 0.1; a < U1; a += 0.275) for (const zz of [gz + 0.1, DECK - 0.1]) { const [x, y] = b.fp("L", S(a), zz); c.fillRect(x - 0.6, y - 0.6, 1.2, 1.2); }
  // ballast + two tracks along u
  k.poly([[U0, V0 + 0.12, DECK], [U1, V0 + 0.12, DECK], [U1, V1 - 0.12, DECK], [U0, V1 - 0.12, DECK]], "#8f8a80", { wobble: 0, lw: 1 });
  for (const bb of [2.4, 3.0]) {
    c.strokeStyle = "rgba(90,70,50,0.85)"; c.lineWidth = 2.1; c.beginPath(); for (let a = U0 + 0.1; a < U1; a += 0.2) { c.moveTo(...P(a, bb - 0.22, DECK + 0.01)); c.lineTo(...P(a, bb + 0.22, DECK + 0.01)); } c.stroke();
    for (const o of [-0.11, 0.11]) { c.strokeStyle = "#4b5159"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(...P(U0, bb + o, DECK + 0.03)); c.lineTo(...P(U1, bb + o, DECK + 0.03)); c.stroke(); c.strokeStyle = "#a96a3a"; c.lineWidth = 0.7; c.stroke(); }
  }
}
function piers(k, t) {
  const c = k.ctx;
  PIERS.forEach((a, i) => {
    const pb = mbox(k, stdProj, a - 0.25, V1, 0, 0.5, 0.45, DECK - GIRD, "#cdc2ac", { wobble: 0, left: "#d4c9b3", right: "#b3a88f" });
    c.strokeStyle = "rgba(90,80,64,0.45)"; c.lineWidth = 0.8; c.beginPath(); for (let z = 0.3; z < DECK - GIRD; z += 0.42) { c.moveTo(...pb.fp("L", 0, z)); c.lineTo(...pb.fp("L", 1, z)); } c.stroke();
    sgn(k, pb, "L", 0.15, 0.85, 0.55, 2.35, ["ゲーム", "アニメ", "ガチャ"][i], { bg: ["#c8342a", "#2f5fb5", "#2d6a4a"][i], fg: "#fff", vertical: true, ar: 0.3 });
    mband(k, pb, "L", 0, 0.22, "#a99d86");
  });
}

// ---- train: loops through the portals, clipped to the span between them so it never pops ------------------------
function trainDraw(k, t) {
  const c = k.ctx, CYC = 11.5, nCars = 4, L = 1.6, TH = 1.65, T0 = 2.5, TD = 0.9;
  const cyc = ((t + 4) % CYC + CYC) % CYC, run = 10.9;
  const head = U0 + (U1 + nCars * L - U0) * clamp(cyc / run);
  const corners = []; for (const u of [U0, U1]) for (const v of [T0 - 0.1, V1]) for (const z of [DECK, DECK + TH + 0.4]) corners.push(P(u, v, z));
  c.save(); c.beginPath(); hull(corners).forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.clip();
  for (let i = nCars - 1; i >= 0; i--) {
    const a0 = head - (i + 1) * L + 0.05;
    if (a0 > U1 + 0.1 || a0 + L < U0 - 0.1) continue;
    const bw = mbox(k, stdProj, a0, T0, DECK + 0.05, L - 0.1, TD, TH, "#d6d9da", { wobble: 0, left: "#dde0e1", right: "#aab1b5", top: "#e6e9ea" });
    mband(k, bw, "L", 0, 0.2, "#5d636a"); mband(k, bw, "L", 0.52, 0.66, "#97c93c"); mband(k, bw, "L", 0.7, 0.76, "#b9bdbf", { lw: 0.5 });
    mwin(k, bw, "L", { rows: 1, cols: 4, z0: 0.8, z1: 1.48, color: "#34425c", lit: 0.0, gap: 0.2, mx: 0.04, lw: 0.7, sheen: true });
    for (let q = 0; q < 4; q++) if (hash(i * 9 + q * 3.7) < 0.7) { const f = 0.04 + (q + 0.5) * 0.92 / 4, [px, py] = bw.fp("L", f, 1.0); c.fillStyle = ["#e8c4a0", "#7a5a3a", "#d9a07a"][q % 3]; c.beginPath(); c.arc(px, py - 1, 2.2, 0, 6.3); c.fill(); c.fillStyle = ["#3f6fa8", "#c8403a", "#5f9e6e", "#f2efe6"][(q + i) % 4]; c.fillRect(px - 2.4, py + 1.2, 4.8, 3); }
    for (const s of [0.1, 0.9]) { k.path([bw.fp("L", s - 0.07, 0.22), bw.fp("L", s + 0.07, 0.22), bw.fp("L", s + 0.07, 1.5), bw.fp("L", s - 0.07, 1.5)], { fill: "#9aa3a9", wobble: 0, lw: 0.9 }); c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.moveTo(...bw.fp("L", s, 0.25)); c.lineTo(...bw.fp("L", s, 1.48)); c.stroke(); k.path([bw.fp("L", s - 0.055, 0.8), bw.fp("L", s - 0.007, 0.8), bw.fp("L", s - 0.007, 1.44), bw.fp("L", s - 0.055, 1.44)], { fill: "#3c4a64", wobble: 0, lw: 0.6 }); k.path([bw.fp("L", s + 0.007, 0.8), bw.fp("L", s + 0.055, 0.8), bw.fp("L", s + 0.055, 1.44), bw.fp("L", s + 0.007, 1.44)], { fill: "#3c4a64", wobble: 0, lw: 0.6 }); }
    for (const s of [0.2, 0.8]) { const [bx, by] = bw.fp("L", s, 0.02); c.fillStyle = "#3c4046"; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.roundRect(bx - 9, by - 3, 18, 7, 2); c.fill(); c.stroke(); for (const dx of [-5, 5]) { c.fillStyle = "#1e2024"; c.beginPath(); c.arc(bx + dx, by + 3, 3.4, 0, 6.3); c.fill(); } }
    { const [x, y] = P(a0 + 0.45, T0 + 0.45, DECK + 0.05 + TH); c.fillStyle = "#c7ccce"; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.roundRect(x - 9, y - 4, 18, 5, 2); c.fill(); c.stroke(); }
    if (i % 2 === 1) { const [x, y] = P(a0 + 0.9, T0 + 0.45, DECK + TH + 0.06); c.strokeStyle = INK; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x - 9, y); c.lineTo(x - 2, y - 8); c.lineTo(x + 8, y - 1); c.lineTo(x + 2, y - 8); c.stroke(); c.lineWidth = 1.4; c.beginPath(); c.moveTo(x - 10, y - 8); c.lineTo(x + 10, y - 12); c.stroke(); }
    if (i === 0) {
      k.path([bw.fp("R", 0.0, 0.2), bw.fp("R", 1, 0.2), bw.fp("R", 1, 1.65), bw.fp("R", 0, 1.65)], { fill: "#d5d9db", wobble: 0, lw: 1.2 });
      k.path([bw.fp("R", 0.1, 0.5), bw.fp("R", 0.9, 0.5), bw.fp("R", 0.9, 1.55), bw.fp("R", 0.1, 1.55)], { fill: "#26364c", wobble: 0, lw: 1.2 });
      k.path([bw.fp("R", 0.1, 0.46), bw.fp("R", 0.9, 0.46), bw.fp("R", 0.9, 0.56), bw.fp("R", 0.1, 0.56)], { fill: "#97c93c", wobble: 0, lw: 0.7 });
      k.path([bw.fp("R", 0.3, 1.45), bw.fp("R", 0.7, 1.45), bw.fp("R", 0.7, 1.58), bw.fp("R", 0.3, 1.58)], { fill: "#ff9a2e", wobble: 0, lw: 0.6 });
      for (const s of [0.18, 0.82]) { const [hx, hy] = bw.fp("R", s, 0.34); c.fillStyle = "#fff6c8"; c.beginPath(); c.arc(hx, hy, 2.6, 0, 6.3); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.7; c.stroke(); }
    }
  }
  c.restore();
}
function poles(k, t) {
  const c = k.ctx, POLES = [1.9, 5.0, 8.1], TOP = DECK + 3.4;
  for (const a of POLES) {
    const [x, y] = P(a, V1 - 0.05, DECK), [, yt] = P(a, V1 - 0.05, TOP);
    c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt); c.stroke(); c.strokeStyle = "#c6cacd"; c.lineWidth = 2.8; c.stroke();
    c.strokeStyle = "#7e8386"; c.lineWidth = 0.9; c.beginPath(); for (let yy = y; yy > yt + 6; yy -= 8) { c.moveTo(x - 1.5, yy); c.lineTo(x + 1.5, yy - 8); c.moveTo(x + 1.5, yy); c.lineTo(x - 1.5, yy - 8); } c.stroke();
    const [ax, ay] = P(a, V0 + 0.15, TOP - 0.2); c.strokeStyle = INK; c.lineWidth = 3.6; c.beginPath(); c.moveTo(x, yt + 4); c.lineTo(ax, ay); c.stroke(); c.strokeStyle = "#c6cacd"; c.lineWidth = 2; c.stroke();
    c.fillStyle = "#b8bcbe"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.roundRect(x - 4, y - 7, 8, 10, 2); c.fill(); c.stroke();
  }
  c.strokeStyle = "rgba(42,36,32,0.85)"; c.lineWidth = 0.9; c.beginPath();
  const as = [U0 + 0.05, ...POLES, U1 - 0.05];
  for (const bb of [2.4, 3.0]) for (let i = 0; i < as.length - 1; i++) { const A = P(as[i], bb, TOP - 0.35), E = P(as[i + 1], bb, TOP - 0.35), M = P((as[i] + as[i + 1]) / 2, bb, TOP - 0.62); c.moveTo(...A); c.quadraticCurveTo(M[0], M[1], E[0], E[1]); }
  c.stroke();
}

// ---- plaza shops ---------------------------------------------------------------------------------------
function muralBlock(k, t) {
  const c = k.ctx, u = 0.4, v = 6.2, du = 1.7, dv = 3.3, h = 4.3;
  const b = mbox(k, stdProj, u, v, 0, du, dv, h, "#e3d8c2", { wobble: 0, left: "#e6dcc8", right: "#cfc4ac" });
  faceDraw(k, b, "L", 0.0, 1.0, 0.0, h, 100, 100 * 2.3, (g, w, hh) => artPanel(g, w, hh, 1));
  mwin(k, b, "R", { rows: 2, cols: 4, z0: 2.6, z1: h - 0.3, color: "#8aa0b8", lit: 0.4, gap: 0.3, mx: 0.1, seed: 5, lw: 0.9 });
  mband(k, b, "L", h - 0.12, h, "#c4b9a2");
  const pb = mbox(k, stdProj, u + 0.1, v + 0.3, h, 1.1, 1.0, 0.95, "#e0d4bc", { wobble: 0 });
  mwin(k, pb, "L", { rows: 1, cols: 1, z0: 0.12, z1: 0.8, color: "#6f8cab", gap: 0.1, mx: 0.35, lw: 0.9 });
  for (let i = 0; i < 4; i++) acUnit(k, stdProj, u + 0.2 + (i % 2) * 0.5, v + 1.55 + Math.floor(i / 2) * 0.45, h, { s: 0.42 });
  for (let i = 0; i < 2; i++) acUnit(k, stdProj, u + 1.2, v + 0.35 + i * 0.7, h, { s: 0.36 });
  c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(...P(u + 0.02, v + dv - 0.04, h + 0.4)); c.lineTo(...P(u + du - 0.04, v + dv - 0.04, h + 0.4)); c.moveTo(...P(u + du - 0.04, v + dv - 0.04, h + 0.4)); c.lineTo(...P(u + du - 0.04, v + 0.1, h + 0.4)); c.stroke();
}
function electronicsShop(k, t) {
  const c = k.ctx, u = 2.1, v = 6.3, du = 1.1, dv = 2.8, h = 3.55;
  const b = mbox(k, stdProj, u, v, 0, du, dv, h, "#e8dec9", { wobble: 0, left: "#e9dfca", right: "#d5cab2" });
  for (let r = 0; r < 3; r++) {
    const z0 = 0.32 + r * 1.07, z1 = z0 + 0.85;
    k.path([b.fp("R", 0.03, z0), b.fp("R", 0.97, z0), b.fp("R", 0.97, z1), b.fp("R", 0.03, z1)], { fill: "#f9d27a", wobble: 0, lw: 1.1 });
    const R = rng(r + 5), n = 14;
    for (let q = 0; q < n; q++) {
      const [x, y] = b.fp("R", 0.06 + q * 0.066, z0 + 0.08 + (q % 2) * 0.32), on = Math.sin(t * 3 + q * 1.7 + r * 2) > -0.1;
      c.fillStyle = on ? ["#7fd0ff", "#ff9ab8", "#ffe27a", "#a6f09a"][Math.floor(R() * 4)] : "#4a6a88"; c.fillRect(x - 3.5, y - 7, 7.5, 7); c.strokeStyle = INK; c.lineWidth = 0.6; c.strokeRect(x - 3.5, y - 7, 7.5, 7);
    }
    c.strokeStyle = "rgba(60,50,40,0.8)"; c.lineWidth = 1.2; c.beginPath(); for (let q = 0; q <= 7; q++) { c.moveTo(...b.fp("R", 0.03 + q * 0.134, z0)); c.lineTo(...b.fp("R", 0.03 + q * 0.134, z1)); } c.stroke();
    mband(k, b, "R", z1, z1 + 0.2, "#f2ecdf");
  }
  sgn(k, b, "R", 0.04, 0.5, 3.1, 3.5, "電気街 パーツ", { bg: "#c8342a", fg: "#ffe06a", size: 48, ar: 5.0 });
  sgn(k, b, "R", 0.54, 0.96, 3.1, 3.5, "ゲーム ガチャ", { bg: "#1f3a6a", fg: "#fff", size: 48, ar: 5.0 });
  sgn(k, b, "L", 0.1, 0.9, 0.5, 3.1, "アキバ", { bg: "#2f5fb5", fg: "#fff", vertical: true, ar: 0.3, border: "#f4efe4" });
  for (let i = 0; i < 4; i++) acUnit(k, stdProj, u + 0.1 + (i % 2) * 0.4, v + 0.3 + Math.floor(i / 2) * 0.6, h, { s: 0.4 });
  const n = 12; for (let i = 0; i < n; i++) { const f0 = i / n, f1 = (i + 1) / n; k.poly([[u + du, v + dv - dv * f0, 1.2], [u + du, v + dv - dv * f1, 1.2], [u + du + 0.6, v + dv - dv * f1, 0.85], [u + du + 0.6, v + dv - dv * f0, 0.85]], i % 2 ? "#f4efe4" : "#2f63b8", { wobble: 0, lw: 1 }); }
  for (let i = 0; i < 4; i++) { const f = 0.12 + i * 0.25; const [lx, ly] = P(u + du + 0.45, v + dv - dv * f, 0.8); chochin(k, lx, ly + 7, { r: 3.6, glow: true, seed: i, amp: 0.8, string: false }); }
}
function tables(k, t) {
  const c = k.ctx;
  for (const dv2 of [6.9, 7.7, 8.5]) {
    const U = 3.95, V = dv2;
    k.box(U, V, 0.0, 0.45, 0.55, 0.42, "#c89a64", { hatch: false, shadow: false, top: "#e2bd88" });
    for (let q = 0; q < 2; q++) { const [x, y] = P(U + 0.2, V + 0.15 + q * 0.28, 0.45); c.fillStyle = "#cfd6dc"; c.strokeStyle = INK; c.lineWidth = 1; c.fillRect(x - 6, y - 10, 12, 10); c.strokeRect(x - 6, y - 10, 12, 10); c.fillStyle = Math.sin(t * 4 + dv2 * 5 + q) > -0.3 ? "#7fd0ff" : "#35618a"; c.fillRect(x - 4.5, y - 8.5, 9, 6.5); }
  }
}
function gachaShop(k, t) {
  const u = 7.7, v = 5.4, du = 1.8, dv = 1.6, h = 2.3;
  const b = mbox(k, stdProj, u, v, 0, du, dv, h, "#e8ddc6", { wobble: 0 });
  mwin(k, b, "L", { rows: 1, cols: 3, z0: 0.18, z1: 1.2, color: "#ffd68a", lit: 1, gap: 0.16, mx: 0.07, lw: 0.9 });
  faceDraw(k, b, "R", 0.12, 0.88, 0.35, 2.0, 100 * 0.9, 100 * 1.7, (g, w, hh) => artPanel(g, w, hh, 0));
  sgn(k, b, "L", 0.06, 0.94, 1.45, 2.2, "ガチャガチャ", { bg: "#c8342a", fg: "#fff", size: 60, ar: 4.2, border: "#f4efe4" });
  for (let i = 0; i < 2; i++) acUnit(k, stdProj, u + 0.3 + i * 0.7, v + 0.3, h, { s: 0.42 });
  const n = 9; for (let i = 0; i < n; i++) { const f0 = i / n, f1 = (i + 1) / n; k.poly([[u + du * f0, v + dv, 1.4], [u + du * f1, v + dv, 1.4], [u + du * f1, v + dv + 0.62, 1.0], [u + du * f0, v + dv + 0.62, 1.0]], i % 2 ? "#f4efe4" : "#d64e46", { wobble: 0, lw: 1 }); }
}
function gachaMachines(k, t) {
  const c = k.ctx, v = 5.4 + 1.6;
  for (let i = 0; i < 6; i++) {
    const [px, py] = P(7.85 + i * 0.34, v + 0.5 + (i % 2) * 0.1, 0), col = ["#d8392f", "#f4c542", "#3f73b5", "#7cc47a", "#e87a9a", "#9a6ad0"][i];
    c.fillStyle = "#f2efe6"; c.strokeStyle = INK; c.lineWidth = 1.1; c.beginPath(); c.roundRect(px - 7.5, py - 13, 15, 13, 2); c.fill(); c.stroke();
    c.fillStyle = "rgba(160,200,230,0.85)"; c.beginPath(); c.roundRect(px - 7, py - 40, 14, 25, 6); c.fill(); c.stroke();
    for (let q = 0; q < 9; q++) { c.fillStyle = ["#f4c542", "#e8607a", "#4aa3d8", "#7cc47a", "#fff"][(q + i) % 5]; c.beginPath(); c.arc(px - 3.6 + (q % 3) * 3.6, py - 35 + Math.floor(q / 3) * 5.6 + Math.sin(t * 2.2 + q + i) * 0.5, 2.1, 0, 6.3); c.fill(); }
    c.fillStyle = col; c.fillRect(px - 7.5, py - 15, 15, 3.5); c.strokeStyle = INK; c.strokeRect(px - 7.5, py - 15, 15, 3.5);
    c.fillStyle = "#cfd3d8"; c.fillRect(px - 5, py - 9, 10, 3); c.beginPath(); c.arc(px + 4, py - 6, 1.6, 0, 6.3); c.fillStyle = col; c.fill();
  }
}
function kiosk(k, t) {
  const u = 8.6, v = 4.1, du = 0.9, dv = 1.0, h = 2.6;
  const b = mbox(k, stdProj, u, v, 0, du, dv, h, "#e6dcc6", { wobble: 0 });
  faceDraw(k, b, "R", 0.1, 0.9, 0.3, h - 0.3, 100 * 0.62, 100 * 1.4, (g, w, hh) => stripeBanner(g, w, hh, ["#f4efe4", "#2f5fb5", "#35b0a8", "#e8412e"]));
  sgn(k, b, "L", 0.08, 0.92, 1.9, 2.5, "買取", { bg: "#1f2a44", fg: "#ffcf3a", size: 70, ar: 2.2 });
  mwin(k, b, "L", { rows: 1, cols: 2, z0: 0.3, z1: 1.7, color: "#ffd68a", lit: 1, gap: 0.2, mx: 0.1, lw: 0.9 });
  acUnit(k, stdProj, u + 0.2, v + 0.25, h, { s: 0.4 });
}

// ---- tile -----------------------------------------------------------------------------------------------
export default function draw(k, t) {
  const c = k.ctx;
  k.groundTrace({}, { paved: "#ecd3bf", side: "#e3d3b0", stipple: 4 });
  c.save(); c.beginPath(); [P(0, 0), P(10, 0), P(10, 10), P(0, 10)].forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.clip();
  for (let i = 0; i < 40; i++) for (let j = 0; j < 40; j++) { c.fillStyle = (i + j) % 2 ? "rgba(255,255,255,0.16)" : "rgba(200,140,110,0.07)"; c.beginPath(); [P(i * 0.25, j * 0.25), P(i * 0.25 + 0.25, j * 0.25), P(i * 0.25 + 0.25, j * 0.25 + 0.25), P(i * 0.25, j * 0.25 + 0.25)].forEach((p, q) => (q ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.fill(); }
  c.strokeStyle = "rgba(150,105,90,0.3)"; c.lineWidth = 0.7; c.beginPath(); for (let i = 0; i <= 40; i++) { const f = i * 0.25; c.moveTo(...P(f, 0)); c.lineTo(...P(f, 10)); c.moveTo(...P(0, f)); c.lineTo(...P(10, f)); } c.stroke();
  c.restore();

  k.q(0, () => backTowers(k, t));
  k.q(1.8, () => portal(k, t, "left"));
  k.q(2, () => viaduct(k, t));
  k.q(2.5, () => trainDraw(k, t));
  k.q(3, () => poles(k, t));
  k.q(4, () => piers(k, t));
  k.q(4.2, () => portal(k, t, "right"));

  k.q(11.6, () => muralBlock(k, t));
  k.q(12.2, () => electronicsShop(k, t));
  k.q(12.4, () => tables(k, t));
  k.q(12.4, () => kiosk(k, t));
  k.q(13.1, () => gachaShop(k, t));
  k.q(14.6, () => gachaMachines(k, t));
  k.q(13.0, () => { k.box(5.5, 6.5, 0, 1.3, 1.3, 0.35, "#a99a84", { hatch: false, shadow: false }); k.flowers(5.7, 6.7, 0.9, 0.9, { seed: 7 }); k.tree(6.15, 7.1, { r: 0.7, h: 1.9, seed: 212, col: "#86b05a" }); });
  k.q(7.7, () => k.lamp(3.3, 4.4, { col: "#2a2e34", h: 1.9 })); k.q(12.1, () => k.lamp(6.4, 5.7, { col: "#2a2e34", h: 1.9 }));
  for (const [u, v, du, dv] of [[3.2, 9.15, 1.0, 0.5], [6.9, 9.15, 1.0, 0.5], [0.5, 4.2, 1.0, 0.5]]) k.q(u + v + 0.4, () => planter(k, u, v, du, dv));
  k.q(9.5, () => lanternString(k, P(3.2, 6.3, 3.4), P(7.7, 5.4, 2.3), 8, { glow: true, r: 3.8, seed: 3 }));
  k.q(18.5, () => { vending(k, 8.8, 9.1, { side: "L", col: "#d8392f", seed: 3 }); vending(k, 9.25, 9.1, { side: "L", col: "#3f73b5", seed: 8 }); });

  // ---- people ----
  const R = ROUTES, outs = [{ style: "shirt", top: "#f2efe6", bottom: "#4a5a7a", bag: true, bagCol: "#d9544b" }, { style: "dress", top: "#e8a0a8", bottom: "#c9567a", hairStyle: "long", bag: true, bagCol: "#e87a9a" }, { style: "tee", top: "#4a79b0", bottom: "#25334b", bag: true, bagCol: "#2a2420" }, { style: "coat", top: "#d8c28a", bottom: "#3c3c3c", bag: true }, { style: "stripes", top: "#f2efe6", bottom: "#2f3e5e", bag: true, bagCol: "#f4c542" }, { style: "skirt", top: "#7b5fa8", bottom: "#3c3c3c", bag: true, bagCol: "#f09ab0" }];
  [[0, 0.0], [0, 0.45], [0, 0.8], [1, 0.1], [1, 0.5], [1, 0.85], [2, 0.2], [2, 0.6], [2, 0.95], [3, 0.0], [3, 0.4], [3, 0.75], [4, 0.2], [4, 0.7]].forEach(([r, off], i) => k.qwalker(R[r], { speed: 0.34 + (i % 4) * 0.035, offset: off, seed: 1400 + i, dwell: 1 + (i % 3) * 0.6, ...outs[i % outs.length], hat: i % 6 === 4 ? "cap" : null }));
  k.qperson(4.6, 7.2, { pose: "stand", dir: [-1, 0.1], seed: 1450, style: "tee", top: "#5f9e6e" });
  k.qperson(4.6, 8.1, { pose: "stand", dir: [-1, 0.1], seed: 1457, style: "shirt", top: "#c9567a", hairStyle: "long" });
  k.qperson(4.6, 8.85, { pose: "stand", dir: [-1, 0], seed: 1458, style: "coat", top: "#6a7a8a" });
  k.qperson(8.1, 8.0, { pose: "stand", dir: [0.1, -1], seed: 1451, style: "tee", top: "#e87a5a" });
  k.qperson(8.55, 8.05, { pose: "stand", dir: [0, -1], seed: 1453, style: "shirt", top: "#4a79b0" });
  k.qperson(9.0, 8.0, { pose: "stand", dir: [-0.2, -1], seed: 1454, kid: true, style: "tee", top: "#e8c14a" });
  k.qperson(5.0, 9.3, { pose: "wave", dir: [0.2, -1], seed: 1460, style: "dress", top: "#2a2420", bottom: "#2a2420", hairStyle: "long", hat: null });
  k.qperson(5.7, 9.3, { pose: "wave", dir: [-0.2, -1], seed: 1461, style: "dress", top: "#ff8ab8", bottom: "#f4efe4", hairStyle: "long", hat: null });
  k.qperson(2.2, 4.6, { pose: "photo", dir: [0.5, -0.8], seed: 1452 });
  k.flush();
  petals(k, 380, 600, 620, 790, 6, { seed: 3, col: "#f7bccb" });
  k.circlingBird(480, 90, 90, 22, { speed: 0.5 }); k.cloud(200, 130, { s: 0.8, phase: 1 }); k.cloud(830, 170, { s: 0.7, phase: 2 });
}
