// Tokyo 1,0 screen-space facade: the reference's curved, stepped Toho podium + leaning tower, drawn in reference px
import { P, INK, shade, lerp, hash } from "../../lib/vec-kit.js";
import { stdProj, mbox, faceDraw, acUnit, antenna, neon } from "./_props.js";
import { glassFace, gzClaws, godzilla } from "./_t1_0.js";

const TAU = Math.PI * 2;
export const QF = (BL, BR, TR, TL) => ({ dz: 1, fp: (side, s, zz) => { const bx = BL[0] + (BR[0] - BL[0]) * s, by = BL[1] + (BR[1] - BL[1]) * s, tx = TL[0] + (TR[0] - TL[0]) * s, ty = TL[1] + (TR[1] - TL[1]) * s; return [bx + (tx - bx) * zz, by + (ty - by) * zz]; } });
const path = (k, pts, fill, lw = 1.2) => k.path(pts, { fill, wobble: 0, lw });
function grid(c, q, cols, rows, col = "rgba(90,78,60,0.38)", lw = 0.7, s0 = 0, s1 = 1) {
  c.save(); c.strokeStyle = col; c.lineWidth = lw; c.beginPath();
  for (let i = 0; i <= cols; i++) { const s = lerp(s0, s1, i / cols); c.moveTo(...q.fp("L", s, 0)); c.lineTo(...q.fp("L", s, 1)); }
  for (let r = 0; r <= rows; r++) { c.moveTo(...q.fp("L", s0, r / rows)); c.lineTo(...q.fp("L", s1, r / rows)); }
  c.stroke(); c.restore();
}
function hedgeRow(k, A, B, n, seed, R = 8, col) {
  for (let i = 0; i < n; i++) { const s = (i + 0.5) / n, x = lerp(A[0], B[0], s), y = lerp(A[1], B[1], s); k._lobe(x, y - 4 - (i % 3) * 2, R + (i % 2) * 2.5, col || (i % 3 ? "#7ca653" : "#8db45c"), seed + i * 7, { squash: 0.8, bumps: 7 }); }
}

export function facade(k, t) {
  const c = k.ctx;
  // ------------------------------------------------------------------ tower (leans: wider at the base) -------------
  k.q(3.0, () => {
    // little stepped block behind the tower's left edge
    path(k, [[500, 238], [500, 204], [516, 192], [524, 196], [524, 238]], "#d2c8b2");
    grid(c, QF([500, 238], [524, 238], [524, 196], [500, 204]), 3, 6);
    const L = QF([522, 224], [620, 282], [622, 69], [544, 55]);
    glassFace(k, L, "L", { z0: 0, z1: 1, s0: 0, s1: 1, cols: 13, rows: 27, seed: 11, lit: 0.12, sky: "#6e96c4", mid2: "#b8cbd8", warm: "#f2c47e", mid: 0.6, mw: 0.8, sheen: 0 });
    // warm sunset wash lower down
    const g = c.createLinearGradient(0, 55, 0, 282); g.addColorStop(0, "rgba(255,210,140,0)"); g.addColorStop(0.55, "rgba(255,200,120,0.1)"); g.addColorStop(1, "rgba(255,190,110,0.36)");
    c.save(); c.beginPath(); [[522, 224], [620, 282], [622, 69], [544, 55]].forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.fillStyle = g; c.fill(); c.restore();
    const R = QF([620, 282], [712, 240], [712, 38], [622, 69]);
    glassFace(k, R, "R", { z0: 0, z1: 1, s0: 0, s1: 0.5, cols: 4, rows: 27, seed: 12, lit: 0.1, sky: "#5f86b3", mid2: "#8ea9c4", warm: "#d9b57c", mw: 0.8, sheen: 0 });
    path(k, [R.fp("R", 0.5, 0), R.fp("R", 1, 0), R.fp("R", 1, 1), R.fp("R", 0.5, 1)], "#d3c9b3");
    c.save(); c.strokeStyle = "rgba(62,90,130,0.75)"; c.lineWidth = 2.2; c.beginPath(); for (const s of [0.62, 0.74, 0.92]) { c.moveTo(...R.fp("R", s, 0)); c.lineTo(...R.fp("R", s, 1)); } c.stroke(); c.strokeStyle = "rgba(90,78,60,0.4)"; c.lineWidth = 0.7; c.beginPath(); for (let i = 1; i < 30; i++) { c.moveTo(...R.fp("R", 0.5, i / 30)); c.lineTo(...R.fp("R", 1, i / 30)); } c.stroke(); c.restore();
    // pale near-edge pier
    path(k, [[616, 70], [626, 68], [626, 284], [616, 284]], "#e0d6c0", 1);
    // crown: ledge slab + louvred plant floor + mast
    path(k, [[556, 58], [622, 70], [622, 52], [556, 40]], "#e0d7c3"); path(k, [[622, 70], [712, 40], [712, 24], [622, 52]], "#b8ae98"); path(k, [[556, 40], [622, 52], [712, 24], [648, 12]], "#ece4d0");
    path(k, [[568, 38], [632, 50], [632, 8], [568, -4]], "#9aa0a8"); path(k, [[632, 50], [690, 30], [690, -12], [632, 8]], "#7c828c");
    c.save(); c.strokeStyle = "rgba(30,34,40,0.6)"; c.lineWidth = 1; c.beginPath(); for (let i = 1; i < 8; i++) { c.moveTo(568, 38 - i * 5.2); c.lineTo(632, 50 - i * 5.2 - 0.4); } c.stroke(); c.restore();
    acUnit(k, stdProj, 0, 0, 0, { s: 0.001 });
    antenna(k, 600, 30, 24, { light: true, seed: 2 });
  });
  // pale concrete wing right of the tower, stepping up (R face with blue strips)
  k.q(3.2, () => {
    const Lw = QF([657, 330], [700, 352], [700, 262], [657, 242]);
    path(k, [Lw.fp("L", 0, 0), Lw.fp("L", 1, 0), Lw.fp("L", 1, 1), Lw.fp("L", 0, 1)], "#d9cfb9"); grid(c, Lw, 4, 14);
    const Rw = QF([700, 352], [718, 340], [718, 228], [700, 262]);
    path(k, [Rw.fp("R", 0, 0), Rw.fp("R", 1, 0), Rw.fp("R", 1, 1), Rw.fp("R", 0, 1)], "#b8ad98"); grid(c, Rw, 2, 14);
    c.save(); c.strokeStyle = "rgba(60,90,130,0.8)"; c.lineWidth = 2; c.beginPath(); c.moveTo(664, 250); c.lineTo(664, 330); c.moveTo(672, 254); c.lineTo(672, 334); c.stroke(); c.restore();
  });

  // ------------------------------------------------------------------ Toho podium ---------------------------------
  k.q(3.3, () => {
    path(k, [[380, 322], [420, 320], [417, 297], [602, 297], [660, 272], [660, 506], [452, 509], [362, 509], [362, 404], [380, 404]], "#cdc3ac", 1.3);
    // tower foot meets the roof: dark joint
    c.save(); c.fillStyle = "rgba(60,50,40,0.25)"; c.beginPath(); c.moveTo(522, 224); c.lineTo(620, 282); c.lineTo(620, 292); c.lineTo(522, 234); c.fill(); c.restore();
  });
  k.q(3.4, () => {
    // upper-left terrace wall + planted terrace
    path(k, [[380, 330], [420, 322], [420, 352], [380, 352]], "#d9cfb9"); grid(c, QF([380, 352], [420, 352], [420, 322], [380, 330]), 4, 3);
    hedgeRow(k, [384, 335], [466, 332], 6, 101, 8);
  });
  // Godzilla's parapet block: tower base planters behind, wall in front
  k.q(3.5, () => hedgeRow(k, [492, 284], [570, 282], 8, 41, 8.5, "#9db44c"));
  k.q(3.6, () => godzilla(k, 508, 281, t, { s: 0.97 }));
  k.q(3.7, () => {
    // front wall (flat), then the return running up-right
    const W = QF([417, 340], [602, 332], [602, 298], [417, 297]);
    const gw = c.createLinearGradient(0, 297, 0, 340); gw.addColorStop(0, "#d9d0bb"); gw.addColorStop(1, "#c3b9a2");
    path(k, [W.fp("L", 0, 0), W.fp("L", 1, 0), W.fp("L", 1, 1), W.fp("L", 0, 1)], gw); grid(c, W, 46, 5, "rgba(95,82,62,0.42)", 0.6);
    c.save(); c.strokeStyle = "rgba(255,250,230,0.5)"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(417, 298); c.lineTo(602, 299); c.stroke(); c.restore();
    const Rt = QF([602, 332], [660, 304], [660, 272], [602, 298]);
    path(k, [Rt.fp("R", 0, 0), Rt.fp("R", 1, 0), Rt.fp("R", 1, 1), Rt.fp("R", 0, 1)], "#a9a08e"); grid(c, Rt, 10, 5, "rgba(70,60,45,0.4)", 0.6);
    // small end-wall at the left
    path(k, [[417, 297], [402, 304], [402, 344], [417, 340]], "#b3a995", 1);
  });
  k.q(3.75, () => gzClaws(k, 508, 281, { s: 0.97 }));
  // stepped ledge with hedges, rising to the right
  k.q(3.8, () => {
    path(k, [[467, 341], [600, 335], [660, 306], [660, 322], [600, 351], [467, 357]], "#d6ccb5"); grid(c, QF([467, 357], [600, 351], [600, 335], [467, 341]), 22, 1, "rgba(95,82,62,0.4)", 0.6);
    hedgeRow(k, [575, 316], [655, 290], 7, 61, 8, "#a3b34a"); hedgeRow(k, [470, 334], [560, 330], 7, 71, 7, "#94b04f");
  });
  // blue transom + amber ribbon facade (the right end angles back)
  k.q(3.85, () => {
    const B1 = QF([447, 392], [610, 386], [620, 352], [447, 362]);
    glassFace(k, B1, "L", { z0: 0, z1: 1, s0: 0, s1: 1, cols: 28, rows: 2, seed: 15, lit: 0.05, sky: "#476b98", mid2: "#5a7ea8", warm: "#6f90b6", mw: 1, sheen: 0 });
    const B2 = QF([470, 428], [612, 425], [612, 386], [470, 391]);
    glassFace(k, B2, "L", { z0: 0, z1: 1, s0: 0, s1: 1, cols: 22, rows: 3, seed: 16, lit: 0.8, sky: "#f0b860", mid2: "#f6cb78", warm: "#fbe3a0", mw: 1.2, sheen: 0 });
    // right return (angled glass), a bit darker
    path(k, [[612, 386], [660, 360], [660, 410], [612, 428]], "#4d6f9a");
    const B3 = QF([612, 428], [660, 410], [660, 360], [612, 386]);
    glassFace(k, B3, "R", { z0: 0, z1: 1, s0: 0, s1: 1, cols: 5, rows: 4, seed: 17, lit: 0.55, sky: "#5f86b3", mid2: "#9bb0c2", warm: "#e8c07a", mw: 1, sheen: 0 });
    // left cream facade + planted terrace
    path(k, [[362, 418], [447, 416], [447, 440], [362, 444]], "#d6ccb6"); grid(c, QF([362, 444], [447, 440], [447, 416], [362, 418]), 12, 2);
    path(k, [[362, 404], [470, 402], [470, 417], [362, 419]], "#e3dac4");
    hedgeRow(k, [366, 398], [468, 396], 9, 81, 8.5);
    k.tree(0, 0, { r: 0.01, h: 0.01 });
    // spandrel with ribs over the canopy
    path(k, [[495, 440], [655, 438], [655, 420], [612, 426], [495, 428]], "#46618a"); c.save(); c.strokeStyle = "rgba(15,25,45,0.55)"; c.lineWidth = 0.7; c.beginPath(); for (let i = 0; i < 28; i++) { const x = 497 + i * 5.7; c.moveTo(x, 429); c.lineTo(x, 439); } c.stroke(); c.restore();
  });
  k.q(3.9, () => {
    // curved canopy sweeping across the lobby
    const top = [[442, 446], [470, 441], [520, 438], [600, 437], [657, 437]], bot = [[442, 458], [470, 455], [520, 452], [600, 451], [657, 446]];
    const gc = c.createLinearGradient(0, 436, 0, 458); gc.addColorStop(0, "#8fa4bb"); gc.addColorStop(1, "#4a638a");
    path(k, [...top, ...bot.slice().reverse()], gc);
    c.save(); c.strokeStyle = "rgba(20,30,50,0.45)"; c.lineWidth = 0.6; c.beginPath(); for (let i = 0; i < 30; i++) { const s = i / 29, x = lerp(445, 655, s); c.moveTo(x, 438 + 2); c.lineTo(x - 2, 454 - 1); } c.stroke(); c.restore();
    // lobby glass + columns
    const Lb = QF([452, 505], [652, 500], [652, 456], [452, 460]);
    faceDraw(k, Lb, "L", 0, 1, 0, 1, 400, 90, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#f2b85e"); gr.addColorStop(1, "#ffe6a2"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = "rgba(120,70,30,0.42)";
      for (let i = 0; i < 26; i++) { const x = (0.03 + 0.94 * hash(i * 3.3)) * w, hh = 36 + (i % 4) * 7; g.beginPath(); g.arc(x, h - hh - 4, 5, 0, TAU); g.fill(); g.fillRect(x - 5, h - hh + 2, 10, hh - 2); }
      g.strokeStyle = "rgba(50,60,80,0.8)"; g.lineWidth = 2.4; for (let i = 0; i <= 14; i++) { g.beginPath(); g.moveTo(i * w / 14, 0); g.lineTo(i * w / 14, h); g.stroke(); } g.beginPath(); g.moveTo(0, h * 0.3); g.lineTo(w, h * 0.3); g.stroke();
      g.fillStyle = "rgba(255,250,220,0.18)"; g.fillRect(0, 0, w, h * 0.3);
    });
    path(k, [[452, 460], [652, 456], [652, 458], [452, 462]], "#3a4f74", 0.8);
    for (const x of [452, 482, 500, 583, 607, 630]) { path(k, [[x - 3.5, 459], [x + 3.5, 459], [x + 3.5, 506], [x - 3.5, 506]], "#3b5078", 1); }
    // left-hand entrance block
    path(k, [[362, 444], [447, 441], [447, 505], [362, 508]], "#cfc5ae"); grid(c, QF([362, 508], [447, 505], [447, 441], [362, 444]), 8, 4);
    const Wn = QF([368, 487], [402, 485], [402, 456], [368, 458]); path(k, [Wn.fp("L", 0, 0), Wn.fp("L", 1, 0), Wn.fp("L", 1, 1), Wn.fp("L", 0, 1)], "#f6cd7a"); grid(c, Wn, 2, 1, "rgba(60,40,20,0.8)", 1.2);
    neon(k, QF([430, 500], [447, 500], [447, 448], [430, 448]), "L", 0, 1, 0, 1, "新宿", { col: "#ff4fa0", blink: true, seed: 3, ar: 0.35, size: 54, vertical: true });
  });
}
