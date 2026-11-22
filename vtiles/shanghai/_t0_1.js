// Jing'an Temple tile helpers: frontal (diagonal-facing) golden hip roofs drawn in px, rich axis roofs,
// pagoda, censer, bowing worshippers. Pure functions of t.
import { P, CTS, INK, shade, mix, lerp, clamp, rng, hash, glint } from "./_props.js";

export const GOLD = "#e8b63a", GOLD_L = "#f8d96e", GOLD_D = "#b47a1c", GOLD_E = "#6e4210", RED = "#a8342b", RED_D = "#7a2420", WOOD = "#5a2a1c";
const ZS = CTS.S * CTS.ZS;

// ---------- frontal hip roof (screen-space, building faces the viewer diagonally) ----------
// o: cx, y (eave at centre), hw, ry (ridge y), rhw, lift (tip upturn px), thick (fascia px), orn (ridge ornaments), ribs
export function frontRoof(k, o) {
  const c = k.ctx, { cx, y, hw, ry, rhw } = o, lift = o.lift ?? 14, col = o.col || GOLD;
  const cl = col, cd = shade(col, -0.22), cr = shade(col, 0.12);
  const eaveY = (x) => { const s = (x - (cx - hw)) / (2 * hw), e = Math.abs(2 * s - 1); return y - lift * Math.pow(e, 3.2) + 3.2 * Math.sin(Math.PI * s); };
  const N = o.n ?? 26;
  const eave = []; for (let i = 0; i <= N; i++) { const x = lerp(cx - hw, cx + hw, i / N); eave.push([x, eaveY(x)]); }
  const ridge = (s) => [lerp(cx - rhw, cx + rhw, s), ry];
  // side hip faces (darker slivers behind the front slope, curving up to the ridge ends)
  const dep = (o.dep ?? 10) * 0.4;
  for (const sd of (o.slivers ? [-1, 1] : [])) {
    const ex = cx + sd * hw, ey = eaveY(ex), rx = cx + sd * rhw;
    c.beginPath(); c.moveTo(ex, ey); c.quadraticCurveTo(ex + sd * 2, ey - dep * 0.55, rx + sd * 6, ry + 3); c.lineTo(rx, ry - 3); c.quadraticCurveTo(cx + sd * (rhw + (hw - rhw) * 0.5), ry - dep * 0.35, ex - sd * 3, ey - dep * 0.78); c.closePath();
    c.fillStyle = cd; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke();
  }
  // front slope with concave side edges
  const edgeCtl = (sd) => [cx + sd * (rhw + (hw - rhw) * 0.62), y - (y - ry) * 0.22];
  c.beginPath(); c.moveTo(eave[0][0], eave[0][1]);
  for (let i = 1; i <= N; i++) c.lineTo(eave[i][0], eave[i][1]);
  { const e1 = edgeCtl(1); c.quadraticCurveTo(e1[0], e1[1], cx + rhw, ry); }
  c.lineTo(cx - rhw, ry);
  { const e0 = edgeCtl(-1); c.quadraticCurveTo(e0[0], e0[1], eave[0][0], eave[0][1]); }
  c.closePath();
  const g = c.createLinearGradient(0, ry, 0, y); g.addColorStop(0, shade(col, 0.08)); g.addColorStop(0.55, cl); g.addColorStop(1, shade(col, -0.06));
  c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
  // tile ribs + courses
  c.save(); c.clip();
  const ribN = o.ribs ?? Math.max(10, Math.round(hw / 6.5));
  c.lineWidth = 0.8; c.strokeStyle = "rgba(90,50,10,0.42)"; c.beginPath();
  for (let i = 1; i < ribN; i++) { const s = i / ribN, x0 = lerp(cx - hw, cx + hw, s), p = ridge(s); c.moveTo(x0, eaveY(x0)); c.lineTo(p[0], p[1]); }
  c.stroke();
  const rows = o.rows ?? Math.max(5, Math.round((y - ry) / 6));
  c.lineWidth = 0.7; c.strokeStyle = "rgba(90,50,10,0.3)"; c.beginPath();
  for (let j = 1; j < rows; j++) {
    const f = Math.pow(j / rows, 0.9);
    for (let i = 0; i <= ribN; i++) { const s = i / ribN, x0 = lerp(cx - hw, cx + hw, s), p = ridge(s), px = lerp(x0, p[0], f), py = lerp(eaveY(x0), p[1], f); i ? c.lineTo(px, py) : c.moveTo(px, py); }
  }
  c.stroke();
  // highlights on every other rib
  c.strokeStyle = "rgba(255,240,170,0.35)"; c.lineWidth = 1; c.beginPath();
  for (let i = 1; i < ribN; i += 2) { const s = (i + 0.5) / ribN, x0 = lerp(cx - hw, cx + hw, s), p = ridge(s); c.moveTo(x0, eaveY(x0) - 1); c.lineTo(p[0], p[1] + 2); }
  c.stroke(); c.restore();
  // fascia + dripping-tile discs
  c.beginPath(); eave.forEach(([x, yy], i) => (i ? c.lineTo(x, yy + (o.thick ?? 5)) : c.moveTo(x, yy + (o.thick ?? 5)))); c.lineWidth = 2.2; c.strokeStyle = GOLD_E; c.stroke();
  const nd = Math.round(hw / 4.2);
  for (let i = 0; i <= nd; i++) { const x = lerp(cx - hw + 2, cx + hw - 2, i / nd), yy = eaveY(x) + 1.5; c.fillStyle = GOLD_L; c.beginPath(); c.arc(x, yy, 1.7, 0, 7); c.fill(); c.lineWidth = 0.6; c.strokeStyle = INK; c.stroke(); }
  // hip ridges (beaded) along the concave side edges
  for (const sd of [-1, 1]) {
    const e = edgeCtl(sd), ex = cx + sd * hw, ey = eaveY(ex), rx = cx + sd * rhw;
    c.beginPath(); c.moveTo(ex, ey); c.quadraticCurveTo(e[0], e[1], rx, ry);
    c.lineWidth = 4.4; c.strokeStyle = INK; c.stroke(); c.lineWidth = 2.6; c.strokeStyle = GOLD_L; c.stroke();
    for (let i = 1; i < 7; i++) { const s = i / 7, a = (1 - s) * (1 - s), b = 2 * s * (1 - s), d = s * s; c.fillStyle = GOLD_D; c.beginPath(); c.arc(a * ex + b * e[0] + d * rx, a * ey + b * e[1] + d * ry, 1.3, 0, 7); c.fill(); }
    // upturned tip curl
    c.beginPath(); c.moveTo(ex, ey + 1); c.bezierCurveTo(ex + sd * 7, ey - 2, ex + sd * 11, ey - 11, ex + sd * 6, ey - 17);
    c.lineWidth = 4.6; c.strokeStyle = INK; c.stroke(); c.lineWidth = 2.6; c.strokeStyle = GOLD_L; c.stroke();
    c.fillStyle = GOLD; c.beginPath(); c.arc(ex + sd * 6, ey - 18, 2.4, 0, 7); c.fill(); c.lineWidth = 0.8; c.strokeStyle = INK; c.stroke();
  }
  // main ridge bar
  c.beginPath(); c.moveTo(cx - rhw - 3, ry - 1); c.lineTo(cx + rhw + 3, ry - 1); c.lineWidth = 7; c.strokeStyle = INK; c.stroke(); c.lineWidth = 4.6; c.strokeStyle = GOLD_L; c.stroke();
  c.lineWidth = 1; c.strokeStyle = GOLD_D; c.beginPath(); for (let x = cx - rhw; x < cx + rhw; x += 5) { c.moveTo(x, ry - 3.4); c.lineTo(x, ry + 0.8); } c.stroke();
  if (o.orn) {
    const s = o.orn;
    for (const sd of [-1, 1]) chiwen(c, cx + sd * (rhw + 2), ry - 2, sd, s);
    // central jewel (flame)
    const x = cx, yy = ry - 4;
    c.fillStyle = GOLD; c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.arc(x, yy - 5 * s, 6 * s, 0, 7); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(x - 4 * s, yy - 8 * s); c.quadraticCurveTo(x - 3 * s, yy - 16 * s, x, yy - 23 * s); c.quadraticCurveTo(x + 3 * s, yy - 16 * s, x + 4 * s, yy - 8 * s); c.closePath(); c.fillStyle = GOLD_L; c.fill(); c.stroke();
    c.fillStyle = RED; c.beginPath(); c.arc(x, yy - 5 * s, 2.2 * s, 0, 7); c.fill();
  }
  if (o.finial) { // simple pointed finial
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, ry - 2); c.lineTo(cx, ry - o.finial); c.stroke(); c.strokeStyle = GOLD_L; c.lineWidth = 1.4; c.stroke();
  }
}
// dragon-head ridge-end ornament (chiwen), facing inward
export function chiwen(c, x, y, sd, s = 1) {
  c.save(); c.translate(x, y); c.scale(sd * s, s);
  c.beginPath(); c.moveTo(-2, 2); c.lineTo(-2, -4); c.bezierCurveTo(-1, -14, 5, -22, 11, -20); c.bezierCurveTo(14, -19, 14, -14, 10, -14); c.bezierCurveTo(8, -13, 9, -9, 7, -6); c.lineTo(8, 2); c.closePath();
  c.fillStyle = GOLD; c.fill(); c.lineWidth = 1.2; c.strokeStyle = INK; c.stroke();
  c.beginPath(); c.moveTo(0, -4); c.bezierCurveTo(2, -12, 6, -17, 10, -17); c.lineWidth = 1.2; c.strokeStyle = GOLD_L; c.stroke();
  c.fillStyle = INK; c.beginPath(); c.arc(8, -17, 1, 0, 7); c.fill();
  c.beginPath(); c.moveTo(-2, -6); c.quadraticCurveTo(-8, -9, -6, -16); c.lineWidth = 1.6; c.strokeStyle = INK; c.stroke(); c.lineWidth = 0.8; c.strokeStyle = GOLD_L; c.stroke();
  c.restore();
}
// dougong bracket band under an eave
export function brackets(k, x0, x1, y, h) {
  const c = k.ctx;
  c.fillStyle = RED_D; c.fillRect(x0, y, x1 - x0, h); c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(x0, y, x1 - x0, h);
  c.fillStyle = "#2f6f64"; c.fillRect(x0, y + h * 0.62, x1 - x0, h * 0.2);
  const n = Math.round((x1 - x0) / 9);
  for (let i = 0; i < n; i++) { const x = lerp(x0 + 4, x1 - 4, (i + 0.5) / n); c.fillStyle = GOLD; c.beginPath(); c.moveTo(x - 4, y + h * 0.1); c.lineTo(x + 4, y + h * 0.1); c.lineTo(x + 2, y + h * 0.58); c.lineTo(x - 2, y + h * 0.58); c.closePath(); c.fill(); c.lineWidth = 0.6; c.stroke(); c.fillStyle = GOLD_D; c.fillRect(x - 1.2, y + h * 0.82, 2.4, h * 0.16); }
}
export function column(c, x, y0, y1, w = 7) {
  c.fillStyle = RED; c.fillRect(x - w / 2, y1, w, y0 - y1); c.fillStyle = "rgba(255,170,130,0.35)"; c.fillRect(x - w / 2 + 1, y1, 1.8, y0 - y1);
  c.fillStyle = "rgba(0,0,0,0.22)"; c.fillRect(x + w / 2 - 2, y1, 2, y0 - y1); c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(x - w / 2, y1, w, y0 - y1);
  c.fillStyle = "#d9d0b8"; c.fillRect(x - w / 2 - 1.5, y0 - 4, w + 3, 4); c.strokeRect(x - w / 2 - 1.5, y0 - 4, w + 3, 4);
}

// ---------- hall (faces the viewer diagonally; screen px, origin = platform floor) ----------
export function hallFront(k, t) {
  const c = k.ctx, CX = 512, FY = 497;
  // ---- main (upper) roof + upper storey ----
  frontRoof(k, { cx: CX, y: 326, hw: 192, ry: 252, rhw: 84, lift: 20, orn: 1.15, dep: 40, ribs: 38, rows: 11 });
  // upper storey wall under the main eave
  brackets(k, 356, 668, 330, 14);
  c.fillStyle = "#8a2c26"; c.fillRect(366, 344, 292, 14); c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(366, 344, 292, 14);
  for (let i = 0; i < 9; i++) { const x = lerp(374, 650, i / 8); c.fillStyle = "#d9a84f"; c.fillRect(x - 7, 346, 14, 10); c.strokeRect(x - 7, 346, 14, 10); column(c, x + 17, 358, 344, 4); }
  // ---- lower skirt roof ----
  frontRoof(k, { cx: CX, y: 402, hw: 247, ry: 352, rhw: 170, lift: 24, dep: 28, ribs: 46, rows: 8, orn: 0 });
  // little ornament pair on the skirt roof ridge ends
  for (const sd of [-1, 1]) chiwen(c, CX + sd * 172, 351, sd, 0.8);
  // ---- ground floor: dark interior, doors, columns ----
  const gx0 = 318, gx1 = 706;
  brackets(k, gx0 - 6, gx1 + 6, 402, 18);
  c.fillStyle = "#3a1a14"; c.fillRect(gx0, 421, gx1 - gx0, FY - 421); c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(gx0, 421, gx1 - gx0, FY - 421);
  // gold lattice doors between columns
  const cols = [328, 368, 415, 462, 540, 584, 628, 676];
  for (let i = 0; i < cols.length - 1; i++) {
    const a = cols[i] + 5, b = cols[i + 1] - 5; if (a >= 462 && b <= 540) continue;
    c.fillStyle = "#c9923d"; c.fillRect(a, 440, b - a, FY - 445); c.strokeStyle = "rgba(60,25,10,0.8)"; c.lineWidth = 0.7;
    c.beginPath(); for (let x = a; x <= b; x += 5) { c.moveTo(x, 440); c.lineTo(x, FY - 5); } for (let y = 440; y < FY - 5; y += 6) { c.moveTo(a, y); c.lineTo(b, y); } c.stroke();
  }
  // central bay: Buddha shrine glowing
  { const g = 0.55 + 0.25 * Math.sin(t * 2.1); const rg = c.createRadialGradient(CX, 462, 4, CX, 462, 52); rg.addColorStop(0, `rgba(255,224,130,${0.9 * g})`); rg.addColorStop(1, "rgba(255,200,90,0)"); c.fillStyle = "#5a2a1c"; c.fillRect(463, 430, 76, FY - 430); c.fillStyle = rg; c.fillRect(463, 420, 76, FY - 420);
    c.fillStyle = "#f3d98a"; c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.ellipse(CX, 484, 20, 9, 0, 0, 7); c.fill(); c.stroke();
    c.fillStyle = GOLD; c.beginPath(); c.moveTo(CX - 15, 482); c.quadraticCurveTo(CX - 17, 458, CX, 456); c.quadraticCurveTo(CX + 17, 458, CX + 15, 482); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.arc(CX, 448, 7.5, 0, 7); c.fill(); c.stroke(); c.fillStyle = "#4a2a1a"; c.beginPath(); c.arc(CX, 444, 5.5, Math.PI, 0); c.fill();
    c.strokeStyle = "rgba(255,230,150,0.6)"; c.lineWidth = 1; c.beginPath(); c.arc(CX, 450, 18, 0, Math.PI * 2); c.stroke();
    // flower offerings
    for (let i = 0; i < 6; i++) { c.fillStyle = ["#e8607a", "#f39ac0", "#f4c542"][i % 3]; c.beginPath(); c.arc(CX - 28 + i * 11, 492, 2.6, 0, 7); c.fill(); } }
  cols.forEach((x) => column(c, x, FY, 421, 8));
  // hanging lanterns between columns
  [348, 392, 440, 562, 606, 652].forEach((x, i) => { const sw = Math.sin(t * 1.8 + i * 1.3) * 1.4; c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x, 421); c.lineTo(x + sw * 0.4, 430); c.stroke(); c.fillStyle = "#e0432e"; c.beginPath(); c.ellipse(x + sw, 437, 4.4, 6, 0, 0, 7); c.fill(); c.stroke(); c.fillStyle = `rgba(255,190,90,${0.28 + 0.1 * Math.sin(t * 4 + i)})`; c.beginPath(); c.arc(x + sw, 437, 10, 0, 7); c.fill(); });
  // ---- central porch roof (projecting gable-hip) ----
  frontRoof(k, { cx: CX, y: 416, hw: 128, ry: 364, rhw: 62, lift: 16, dep: 22, ribs: 28, rows: 7, finial: 0, orn: 0.7 });
  // plaque under the porch eave
  c.fillStyle = "#2a120c"; c.strokeStyle = GOLD; c.lineWidth = 1.6; c.beginPath(); c.roundRect(CX - 40, 420, 80, 15, 2); c.fill(); c.stroke();
  c.fillStyle = GOLD_L; c.font = "bold 12px \"PingFang SC\",\"Heiti SC\",sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("静安寺", CX, 428);
  // ---- marble platform front, balustrade, stairs ----
  platform(k, t);
}

function platform(k, t) {
  const c = k.ctx, CX = 512, FY = 497;
  // front face of the terrace
  c.fillStyle = "#e3dac3"; c.fillRect(296, FY, 428, 22); c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(296, FY, 428, 22);
  c.fillStyle = "#cfc4a8"; c.fillRect(296, FY + 18, 428, 4);
  c.strokeStyle = "rgba(120,100,70,0.35)"; c.lineWidth = 0.8; c.beginPath(); for (let x = 296; x < 724; x += 22) { c.moveTo(x, FY); c.lineTo(x, FY + 18); } c.stroke();
  // balustrade rail across (broken by the stairs)
  const rail = (x0, x1) => {
    c.fillStyle = "#f2ecd9"; c.fillRect(x0, FY - 2, x1 - x0, 4); c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(x0, FY - 2, x1 - x0, 4);
    c.fillRect(x0, FY + 13, x1 - x0, 4); c.strokeRect(x0, FY + 13, x1 - x0, 4);
    for (let x = x0 + 3; x < x1; x += 8) { c.fillStyle = "#f6f0de"; c.fillRect(x - 1.8, FY + 2, 3.6, 11); c.strokeRect(x - 1.8, FY + 2, 3.6, 11); }
    for (let x = x0; x <= x1 + 0.1; x += 40) { c.fillStyle = "#f2ecd9"; c.fillRect(x - 3, FY - 9, 6, 26); c.strokeRect(x - 3, FY - 9, 6, 26); c.beginPath(); c.arc(x, FY - 10, 3.2, 0, 7); c.fill(); c.stroke(); }
  };
  rail(298, 396); rail(628, 722);
  // stairs: two flights + carved ramp
  const sx0 = 398, sx1 = 626, y0 = FY + 20, n = 15, sh = 9.2;
  for (let i = 0; i < n; i++) {
    const y = y0 + i * sh, f = i / n;
    c.fillStyle = i % 2 ? "#ebe3cd" : "#f3ecda"; c.fillRect(sx0, y, sx1 - sx0, sh); c.fillStyle = "rgba(120,100,70,0.28)"; c.fillRect(sx0, y + sh - 2.6, sx1 - sx0, 2.6);
    c.strokeStyle = "rgba(60,45,30,0.55)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(sx0, y + sh); c.lineTo(sx1, y + sh); c.stroke();
  }
  c.strokeStyle = INK; c.lineWidth = 1.3; c.strokeRect(sx0, y0, sx1 - sx0, n * sh);
  // central carved ramp (dragon panel)
  const rx0 = 478, rx1 = 546;
  c.fillStyle = "#d8cba9"; c.fillRect(rx0, y0, rx1 - rx0, n * sh); c.strokeRect(rx0, y0, rx1 - rx0, n * sh);
  c.strokeStyle = "rgba(110,85,50,0.6)"; c.lineWidth = 1.1;
  for (let i = 0; i < 6; i++) { const y = y0 + 8 + i * 22; c.beginPath(); c.moveTo(rx0 + 8, y + 12); c.bezierCurveTo(rx0 + 14, y - 2, rx1 - 14, y + 20, rx1 - 8, y + 6); c.stroke(); c.beginPath(); c.arc(rx0 + 34, y + 12, 5, 0, 7); c.stroke(); }
  // side balustrades along the flights (stepped)
  for (const [xa, sd] of [[sx0, -1], [sx1, 1]]) {
    c.beginPath(); c.moveTo(xa, y0 - 8); c.lineTo(xa, y0 + n * sh + 2); c.lineWidth = 7; c.strokeStyle = INK; c.stroke(); c.lineWidth = 4.6; c.strokeStyle = "#f2ecd9"; c.stroke();
    for (let y = y0; y < y0 + n * sh; y += 22) { c.fillStyle = "#f6f0de"; c.fillRect(xa - 4, y, 8, 5); c.lineWidth = 0.8; c.strokeStyle = INK; c.strokeRect(xa - 4, y, 8, 5); }
    c.fillStyle = "#e7dfca"; c.fillRect(xa - 7, y0 + n * sh - 6, 14, 10); c.strokeRect(xa - 7, y0 + n * sh - 6, 14, 10);
  }
}

// ---------- axis-aligned wing roof with ornament (copy of eaveRoof, richer) ----------
export function richRoof(k, u, v, z, du, dv, h, o = {}) {
  const c = k.ctx, oh = o.over ?? 0.34, lift = o.lift ?? 0.4, col = o.col || GOLD;
  const rin = o.ridgeIn ?? Math.min(du, dv) * 0.3;
  const ru0 = u + rin, rv0 = v + rin, ru1 = u + du - rin, rv1 = v + dv - rin, rH = z + h;
  const eave = (a, b, n = 18) => { const out = []; for (let i = 0; i <= n; i++) { const s = i / n; out.push([lerp(a[0], b[0], s), lerp(a[1], b[1], s), z - 0.07 * Math.sin(Math.PI * s) + lift * Math.pow(Math.abs(2 * s - 1), 3)]); } return out; };
  const A = [u - oh, v - oh], B = [u + du + oh, v - oh], C = [u + du + oh, v + dv + oh], D = [u - oh, v + dv + oh];
  const eL = eave(D, C), eR = eave(B, C);
  const left = [...eL, [ru1, rv1, rH], [ru0, rv1, rH]], right = [...eR, [ru1, rv1, rH], [ru1, rv0, rH]];
  k.poly([[ru0, rv0, rH], [ru1, rv0, rH], [ru1, rv1, rH], [ru0, rv1, rH]], shade(col, 0.1), { lw: k.lw, wobble: 0 });
  k.poly(left, col, { lw: k.lw, wobble: 0 }); k.poly(right, shade(col, -0.22), { lw: k.lw, wobble: 0 });
  const rows = o.rows ?? 10, ribL = Math.max(6, Math.round(Math.hypot(du, dv) * 3.4));
  // ribs + cross courses on both planes
  const plane = (ptsE, rp0, rp1, dark) => {
    const N = ptsE.length - 1;
    c.strokeStyle = dark ? "rgba(70,35,5,0.45)" : "rgba(90,50,10,0.4)"; c.lineWidth = 0.8; c.beginPath();
    for (let i = 1; i < ribL; i++) { const s = i / ribL, e = ptsE[Math.round(s * N)], r = [lerp(rp0[0], rp1[0], s), lerp(rp0[1], rp1[1], s), rH]; c.moveTo(...P(e[0], e[1], e[2])); c.lineTo(...P(r[0], r[1], r[2])); }
    for (let j = 1; j < rows; j++) { const f = j / rows; for (let i = 0; i <= ribL; i++) { const s = i / ribL, e = ptsE[Math.round(s * N)], r = [lerp(rp0[0], rp1[0], s), lerp(rp0[1], rp1[1], s), rH], p = P(lerp(e[0], r[0], f), lerp(e[1], r[1], f), lerp(e[2], r[2], f)); i ? c.lineTo(...p) : c.moveTo(...p); } }
    c.stroke();
  };
  plane(eL, [ru0, rv1], [ru1, rv1], false); plane(eR, [ru1, rv0], [ru1, rv1], true);
  k.line3(eL, { stroke: GOLD_E, lw: 2.4, wobble: 0 }); k.line3(eR, { stroke: GOLD_E, lw: 2.4, wobble: 0 });
  for (const e of [eL, eR]) for (let i = 0; i < e.length; i++) { const p = P(e[i][0], e[i][1], e[i][2]); c.fillStyle = GOLD_L; c.beginPath(); c.arc(p[0], p[1] + 1.5, 1.5, 0, 7); c.fill(); c.lineWidth = 0.5; c.strokeStyle = INK; c.stroke(); }
  // hip ridges + ridge
  for (const [a, b] of [[D, [ru0, rv1]], [C, [ru1, rv1]], [B, [ru1, rv0]]]) { const pa = [a[0], a[1], z + lift * 0.9], pb = [b[0], b[1], rH]; k.line3([pa, pb], { stroke: INK, lw: 4, wobble: 0 }); k.line3([pa, pb], { stroke: GOLD_L, lw: 2.2, wobble: 0 }); }
  k.line3([[ru0, rv1, rH], [ru1, rv1, rH], [ru1, rv0, rH]], { stroke: INK, lw: 6, wobble: 0 }); k.line3([[ru0, rv1, rH], [ru1, rv1, rH], [ru1, rv0, rH]], { stroke: GOLD_L, lw: 3.8, wobble: 0 });
  // upturned eave tips
  for (const [pu, pv, d] of [[C[0], C[1], 0], [D[0], D[1], -1], [B[0], B[1], 1]]) { const [x, y] = P(pu, pv, z + lift); const sd = d || 1; c.beginPath(); c.moveTo(x, y + 2); c.bezierCurveTo(x + sd * 6, y, x + sd * 10, y - 10, x + sd * 5, y - 15); c.lineWidth = 4.4; c.strokeStyle = INK; c.stroke(); c.lineWidth = 2.4; c.strokeStyle = GOLD_L; c.stroke(); c.fillStyle = GOLD; c.beginPath(); c.arc(x + sd * 5, y - 16, 2.2, 0, 7); c.fill(); }
  // ridge-end dragons
  { const [x1, y1] = P(ru0, rv1, rH), [x2, y2] = P(ru1, rv0, rH); chiwen(c, x1, y1, -1, 0.9); chiwen(c, x2, y2, 1, 0.9); }
  if (o.finial) { const [x, y] = P((ru0 + ru1) / 2, (rv0 + rv1) / 2, rH); c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 11); c.stroke(); c.fillStyle = GOLD_L; c.beginPath(); c.arc(x, y - 12, 3, 0, 7); c.fill(); c.lineWidth = 0.9; c.stroke(); }
}

// ---------- pagoda (7 tiers) in screen px ----------
export function pagoda(k, t) {
  const c = k.ctx, CX = 245;
  // base platform + ground floor
  c.fillStyle = "#e4dac4"; c.fillRect(CX - 58, 372, 116, 14); c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(CX - 58, 372, 116, 14);
  c.fillStyle = WOOD; c.fillRect(CX - 48, 338, 96, 34); c.strokeRect(CX - 48, 338, 96, 34);
  for (let i = 0; i < 5; i++) { const x = CX - 40 + i * 20; c.fillStyle = i === 2 ? "#3a1a14" : "#c9923d"; c.fillRect(x - 7, 346, 14, 25); c.strokeRect(x - 7, 346, 14, 25); column(c, x + 10, 372, 338, 5); }
  const tiers = [[335, 78], [307, 72], [278, 66], [249, 62], [220, 58], [191, 54], [152, 50]];
  const ws = [48, 44, 40, 38, 36, 34, 30];
  for (let i = 0; i < tiers.length; i++) {
    const [ey, hw] = tiers[i], w = ws[i], top = i === tiers.length - 1;
    // wall + balcony below this tier's eave (drawn before the roof so the roof covers its top)
    const wy = ey, wh = (i === 0 ? 4 : 0) + (tiers[i - 1] ? 0 : 0);
    const nextE = i === 0 ? 372 : null;
    // storey beneath eave i is the previous tier's wall: draw wall between roof i bottom and roof i-1 top
    if (i > 0) {
      const py = tiers[i - 1][0], wallTop = ey + 6, wallBot = py - 14;
      c.fillStyle = "#8a2c26"; c.fillRect(CX - w, wallTop, w * 2, Math.max(8, wallBot - wallTop)); c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(CX - w, wallTop, w * 2, Math.max(8, wallBot - wallTop));
      for (let j = 0; j < 4; j++) { const x = CX - w + 6 + j * ((w * 2 - 12) / 3.0); c.fillStyle = "#d9a84f"; c.fillRect(x - 5, wallTop + 2, 10, Math.max(4, wallBot - wallTop - 4)); c.strokeRect(x - 5, wallTop + 2, 10, Math.max(4, wallBot - wallTop - 4)); }
      // railing
      c.fillStyle = "#2a120c"; c.fillRect(CX - w - 4, wallBot - 2, w * 2 + 8, 3);
    }
    frontRoof(k, { cx: CX, y: ey, hw, ry: ey - (top ? 36 : 17), rhw: top ? 4 : hw * 0.38, lift: 8, dep: 10, ribs: Math.max(8, Math.round(hw / 6)), rows: top ? 6 : 3, orn: 0, n: 16, thick: 3 });
    // eave corner bells
    for (const sd of [-1, 1]) { const x = CX + sd * (hw - 2), sw = Math.sin(t * 3 + i * 1.3 + sd) * 1.6, y = ey - 7; c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x, y); c.lineTo(x + sw * 0.3, y + 5); c.stroke(); c.fillStyle = GOLD; c.beginPath(); c.moveTo(x + sw - 2.2, y + 11); c.lineTo(x + sw * 0.3 - 1, y + 5); c.lineTo(x + sw * 0.3 + 1, y + 5); c.lineTo(x + sw + 2.2, y + 11); c.closePath(); c.fill(); c.lineWidth = 0.6; c.stroke(); }
  }
  // spire: sections + gourd + rings
  const top = 152 - 36;
  c.strokeStyle = INK; c.lineWidth = 4.2; c.beginPath(); c.moveTo(CX, top); c.lineTo(CX, 52); c.stroke(); c.strokeStyle = GOLD; c.lineWidth = 2.4; c.stroke();
  for (let i = 0; i < 7; i++) { const y = lerp(top - 6, 70, i / 6), w = 9 - i * 1.1; c.fillStyle = GOLD; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.ellipse(CX, y, w, w * 0.4, 0, 0, 7); c.fill(); c.stroke(); }
  c.fillStyle = GOLD_L; c.beginPath(); c.arc(CX, 62, 4.6, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.moveTo(CX - 3, 58); c.lineTo(CX, 46); c.lineTo(CX + 3, 58); c.fill(); c.stroke();
  const s = Math.max(0, Math.sin(t * 1.7)); if (s > 0.8) glint(c, CX - 3, 64, (s - 0.8) / 0.2 * 6 + 2, "#fff8d0");
}

// ---------- big bronze censer on the courtyard ----------
export function censer(k, u, v, t) {
  const c = k.ctx, BR = "#8b8a4a", BR_L = "#a9a867", PA = "#5f8a73";
  k.ell(u + 0.5, v + 0.3, 0, 1.5, "rgba(60,45,30,0.2)", { stroke: false });
  // stone base
  k.box(u - 1.0, v - 1.0, 0, 2.0, 2.0, 0.2, "#d8cfba", { hatch: false, shadow: false });
  k.cyl(u, v, 0.22, 0.95, 0.12, "#c4b998");
  // lion-paw legs
  for (const [a, b] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) { const [x, y] = P(u + a, v + b, 0.3), [, y2] = P(u + a, v + b, 0.95); c.strokeStyle = INK; c.lineWidth = 9; c.lineCap = "round"; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y2); c.stroke(); c.strokeStyle = BR; c.lineWidth = 6; c.stroke(); c.fillStyle = BR_L; c.beginPath(); c.arc(x, y - 1, 5.5, 0, 7); c.fill(); c.lineWidth = 1; c.strokeStyle = INK; c.stroke(); }
  // bowl with relief band
  k.cyl(u, v, 0.9, 0.9, 0.95, BR, { topCol: "#2d2c1a" });
  { const [x, y] = P(u, v, 1.35); c.strokeStyle = "rgba(235,215,110,0.7)"; c.lineWidth = 1.6; c.beginPath(); for (let i = 0; i < 14; i++) { const xx = x - 54 + i * 8.2; c.moveTo(xx, y + 6 + (Math.abs(i - 6.5) < 6 ? 2.2 * Math.sin(i * 2) : 0)); c.lineTo(xx + 4, y + 11); } c.stroke(); }
  k.cyl(u, v, 1.85, 0.97, 0.1, BR_L, { topCol: "#2c2a1c" });
  // dragon handles
  for (const s of [-1, 1]) { const [x, y] = P(u + s * 0.64, v - s * 0.64, 1.75); c.strokeStyle = INK; c.lineWidth = 7; c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + s * 22, y - 2, x + s * 26, y - 28, x + s * 12, y - 36); c.stroke(); c.strokeStyle = BR_L; c.lineWidth = 4.2; c.stroke(); c.fillStyle = BR_L; c.beginPath(); c.ellipse(x + s * 11, y - 38, 6, 4.4, 0, 0, 7); c.fill(); c.lineWidth = 1; c.strokeStyle = INK; c.stroke(); c.fillStyle = INK; c.fillRect(x + s * 12 - 1, y - 40, 2, 2); }
  // open lantern tier with glowing embers
  const g = 0.55 + 0.3 * Math.sin(t * 5);
  for (const [a, b] of [[-0.42, -0.42], [0.42, -0.42], [-0.42, 0.42], [0.42, 0.42]]) { const [x, y] = P(u + a, v + b, 1.95), [, y2] = P(u + a, v + b, 3.0); c.strokeStyle = INK; c.lineWidth = 4.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y2); c.stroke(); c.strokeStyle = BR_L; c.lineWidth = 2.6; c.stroke(); }
  { const [x, y] = P(u, v, 2.4); const rg = c.createRadialGradient(x, y, 3, x, y, 38); rg.addColorStop(0, `rgba(255,150,60,${0.55 + 0.3 * g})`); rg.addColorStop(1, "rgba(255,120,40,0)"); c.fillStyle = rg; c.beginPath(); c.arc(x, y, 38, 0, 7); c.fill();
    for (let i = 0; i < 9; i++) { c.strokeStyle = i % 2 ? "#e8402a" : "#f08a2a"; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 18 + i * 4.5, y + 18); c.lineTo(x - 18 + i * 4.5 + Math.sin(t * 7 + i) * 1.6, y + 18 - 16 - 5 * Math.sin(t * 3 + i)); c.stroke(); } }
  // lid: patina pagoda roofs
  k.cyl(u, v, 3.0, 0.62, 0.1, PA);
  k.cone(u, v, 3.1, 0.78, 0.5, PA);
  k.cyl(u, v, 3.55, 0.36, 0.08, PA); k.cone(u, v, 3.62, 0.46, 0.38, PA);
  { const [x, y] = P(u, v, 4.05); c.fillStyle = GOLD; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.arc(x, y, 3.6, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.moveTo(x - 2, y - 2); c.lineTo(x, y - 11); c.lineTo(x + 2, y - 2); c.fill(); c.stroke(); }
}
// incense plumes rising from the censer, drifting, thinning
export function smoke(k, t, u, v, z) {
  const c = k.ctx, [x0, y0] = P(u, v, z);
  for (const [ph, amp, sp, off] of [[0, 1, 0.2, 0], [3.1, 0.8, 0.17, 5], [6.3, 1.2, 0.23, -6]]) {
    for (let i = 0; i < 18; i++) {
      const s = (t * sp + i / 18) % 1, wob = Math.sin(t * 1.2 + i * 0.7 + s * 6 + ph) * (3 + s * 16) * amp, x = x0 + off * (1 - s) + wob + s * 26, y = y0 - s * 175, r = 3 + s * 13;
      c.fillStyle = `rgba(240,238,232,${0.55 * (1 - s) * Math.min(1, s * 6)})`; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    }
  }
}

// ---------- worshipper that bows (wraps a standing person in a forward bend) ----------
export function bower(k, u, v, o, ph, rate = 0.3) {
  const c = k.ctx, t = k.t, [x, y] = P(u, v, o.z || 0);
  const ph0 = ((t * rate + ph) % 1 + 1) % 1, b = ph0 < 0.4 ? Math.pow(Math.sin((ph0 / 0.4) * Math.PI), 1.5) : 0;
  const [du, dv] = o.dir, sx = (du - dv) * 0.5, sy = (du + dv) * 0.5;
  c.save(); c.translate(x, y);
  c.transform(1, 0, 0.55 * b * (sx / (Math.hypot(sx, sy) + 0.01)), 1 - 0.14 * b * (sy > 0 ? 1 : 0.4), 0, 0);
  c.translate(-x, -y);
  k.person(u, v, { pose: b > 0.15 ? "clap" : "stand", ...o });
  c.restore();
}
