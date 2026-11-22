// Tokyo 1,-1 helpers: painterly foliage, Fuji, tea terraces, farmhouses, viaduct, Shinkansen, catenary.
// Everything is in the reference-grid pixel space (the rectified reference that trace-shot shows).
import { INK, shade, lerp, rng, hash } from "../../lib/vec-kit.js";

export const TAU = Math.PI * 2;
export const poly = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
export const fillPoly = (c, pts, fill, lw = 0, stroke = INK) => { poly(c, pts); if (fill) { c.fillStyle = fill; c.fill(); } if (lw) { c.strokeStyle = stroke; c.lineWidth = lw; c.lineJoin = "round"; c.stroke(); } };
const polyY = (pts, x) => { for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; if (x >= a[0] && x <= b[0]) return lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0] || 1)); } return pts[pts.length - 1][1]; };

// ------------------------------------------------------------------ foliage -----------------------------------------
export function lobe(c, x, y, r, col, o = {}) {
  const sq = o.squash ?? 0.85;
  c.save(); c.translate(x, y); c.scale(1, sq);
  c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fillStyle = col; c.fill();
  c.beginPath(); c.arc(r * 0.18, r * 0.28, r * 0.82, 0.1, Math.PI - 0.1); c.fillStyle = shade(col, -0.2); c.globalAlpha = 0.55; c.fill(); c.globalAlpha = 1;
  c.beginPath(); c.arc(-r * 0.28, -r * 0.34, r * 0.5, 0, TAU); c.fillStyle = shade(col, 0.2); c.globalAlpha = 0.7; c.fill(); c.globalAlpha = 1;
  if (r >= 8 && o.leaf !== false) {
    const nn = Math.min(26, Math.round(r * 0.9)), sd = Math.round(x * 3.1 + y * 1.7);
    for (let i = 0; i < nn; i++) {
      const a = hash(i * 1.9 + sd) * TAU, d = Math.sqrt(hash(i * 3.3 + sd)) * r * 0.86, lx = Math.cos(a) * d, ly = Math.sin(a) * d, up = ly < r * 0.1;
      c.save(); c.translate(lx, ly); c.rotate(hash(i + sd) * 3);
      c.fillStyle = up ? shade(col, 0.3) : shade(col, -0.3); c.globalAlpha = up ? 0.55 : 0.5;
      c.beginPath(); c.ellipse(0, 0, r * 0.2, r * 0.09, 0, 0, TAU); c.fill(); c.restore();
    }
    c.globalAlpha = 1;
  }
  if (o.ink !== false) { c.beginPath(); c.arc(0, 0, r, 0, TAU); c.strokeStyle = o.inkCol || "rgba(36,48,26,0.55)"; c.lineWidth = o.lw ?? 0.9; c.stroke(); }
  c.restore();
}
// round-leafed tree: trunk + a cluster of lobes
export function roundTree(c, x, y, r, pal, seed, o = {}) {
  const R = rng(seed), th = o.trunk ?? r * 1.1;
  c.strokeStyle = "#4a3728"; c.lineWidth = Math.max(2, r * 0.16); c.lineCap = "round";
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + (R() - 0.5) * 6, y - th * 0.5, x + (R() - 0.5) * 4, y - th); c.stroke();
  const n = o.n ?? 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + R(), d = i === 0 ? 0 : r * (0.35 + R() * 0.35);
    lobe(c, x + Math.cos(a) * d * 1.15, y - th - r * 0.35 + Math.sin(a) * d * 0.6, r * (0.46 + R() * 0.22), pal[Math.floor(R() * pal.length)], { squash: 0.8, ink: o.ink });
  }
}
export function bush(c, x, y, r, pal, seed, n = 8) {
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const a = R() * TAU, d = R() * r * 0.75;
    lobe(c, x + Math.cos(a) * d * 1.25, y - r * 0.35 + Math.sin(a) * d * 0.45, r * (0.38 + R() * 0.26), pal[Math.floor(R() * pal.length)], { squash: 0.8 });
  }
}
export function flowerBush(c, x, y, r, leaf, bloom, seed, t = 0) {
  const R = rng(seed);
  bush(c, x, y, r, leaf, seed, 6);
  for (let i = 0; i < Math.round(r * 1.6); i++) {
    const a = R() * TAU, d = Math.sqrt(R()) * r;
    const fx = x + Math.cos(a) * d * 1.2, fy = y - r * 0.55 + Math.sin(a) * d * 0.5 - R() * r * 0.15 + Math.sin(t * 1.4 + i) * 0.4;
    c.fillStyle = bloom[i % bloom.length]; c.beginPath(); c.arc(fx, fy, 2 + R() * 2.4, 0, TAU); c.fill();
    c.fillStyle = "rgba(255,255,255,0.55)"; c.beginPath(); c.arc(fx - 0.8, fy - 0.8, 0.9, 0, TAU); c.fill();
  }
}
export function pine(c, x, y, h, seed, col = "#2f5a3a") {
  const R = rng(seed), w = h * 0.2, tiers = 6;
  c.fillStyle = "#4a3728"; c.fillRect(x - 1.5, y - 6, 3, 8);
  for (let i = 0; i < tiers; i++) {
    const f = i / tiers, yy = y - h * f * 0.88, ww = w * (1.15 - f * 0.9) + 2, th = h / tiers * 1.5;
    c.beginPath(); c.moveTo(x, yy - th); c.quadraticCurveTo(x + ww * 0.6, yy - th * 0.35, x + ww, yy); c.quadraticCurveTo(x, yy + 3, x - ww, yy); c.quadraticCurveTo(x - ww * 0.6, yy - th * 0.35, x, yy - th); c.closePath();
    c.fillStyle = shade(col, 0.1 * (1 - f) - 0.12 + R() * 0.06); c.fill(); c.strokeStyle = "rgba(20,36,24,0.6)"; c.lineWidth = 0.8; c.stroke();
    c.fillStyle = shade(col, 0.22); c.globalAlpha = 0.5; c.beginPath(); c.moveTo(x, yy - th); c.quadraticCurveTo(x - ww * 0.4, yy - th * 0.4, x - ww, yy); c.lineTo(x - ww * 0.3, yy - 1); c.closePath(); c.fill(); c.globalAlpha = 1;
  }
}
// cherry blossom crown: branch skeleton under a mass of 5-petal flowers
export function blossomCrown(c, cx, cy, rx, ry, seed, t, o = {}) {
  const R = rng(seed), n = o.n ?? 420, pal = ["#f7c3d3", "#fbd6e1", "#f2a3bd", "#fde8ef", "#ee8eb0"];
  const inside = () => { for (;;) { const a = R() * 2 - 1, b = R() * 2 - 1; if (a * a + b * b <= 1) return [a, b]; } };
  // dark underside masses first
  for (let i = 0; i < 26; i++) { const [a, b] = inside(); c.fillStyle = i % 3 ? "#e790ab" : "#d97a99"; c.beginPath(); c.ellipse(cx + a * rx * 0.9, cy + b * ry * 0.85 + ry * 0.12, rx * 0.2, ry * 0.2, 0, 0, TAU); c.fill(); }
  // branches
  c.strokeStyle = "#5a3b2c"; c.lineCap = "round";
  for (let i = 0; i < 9; i++) { const a = (i / 9) * 2 - 1; c.lineWidth = 3.2 - Math.abs(a) * 1.5; c.beginPath(); c.moveTo(cx + (o.tx ?? 0), cy + ry * 0.9); c.quadraticCurveTo(cx + a * rx * 0.3, cy + ry * 0.2, cx + a * rx * 0.75, cy - ry * 0.1 + Math.abs(a) * ry * 0.35); c.stroke(); }
  for (let i = 0; i < n; i++) {
    const [a0, b0] = inside(), ang = Math.atan2(b0, a0), lump = 1 + 0.16 * Math.sin(ang * 5 + seed) + 0.08 * Math.sin(ang * 11 + seed * 2), a = a0 * lump, b = b0 * lump, x = cx + a * rx + Math.sin(t * 1.0 + i * 0.37) * 0.8, y = cy + b * ry * (b > 0 ? 0.85 : 1) + Math.abs(a) * ry * 0.18;
    const col = pal[Math.floor(hash(i + seed * 7) * pal.length)], s = 2.1 + hash(i * 1.7 + seed) * 2.0, lit = b < -0.2 ? 1 : 0;
    c.fillStyle = lit ? shade(col, 0.05) : shade(col, -0.06);
    for (let p = 0; p < 5; p++) { const ang = (p / 5) * TAU + i; c.beginPath(); c.arc(x + Math.cos(ang) * s * 0.7, y + Math.sin(ang) * s * 0.55, s * 0.62, 0, TAU); c.fill(); }
    c.fillStyle = "#d4577f"; c.beginPath(); c.arc(x, y, s * 0.22, 0, TAU); c.fill();
  }
  // a few hanging twigs of blossom below the crown
  for (let i = 0; i < 14; i++) { const [a] = inside(); const x = cx + a * rx * 0.9, y = cy + ry * (0.35 + hash(i + seed) * 0.4) + Math.abs(a) * ry * 0.18; c.fillStyle = pal[i % 5]; c.beginPath(); c.arc(x, y, 3.2, 0, TAU); c.arc(x + 3, y + 2, 2.6, 0, TAU); c.fill(); }
}

// ------------------------------------------------------------------ Mt Fuji ------------------------------------------
const FL = [[325, 262], [350, 246], [392, 215], [440, 180], [480, 155], [520, 130], [560, 108], [600, 88], [640, 72], [672, 65], [705, 63]];
const FR = [[705, 63], [735, 72], [770, 95], [810, 120], [850, 148], [890, 172], [930, 190], [975, 205], [1024, 213]];
const FO = [...FL, ...FR.slice(1)];
export function fuji(c, t) {
  const base = 330;
  // body
  poly(c, [...FO, [1024, base], [325, base]]);
  const g = c.createLinearGradient(330, 120, 900, 300); g.addColorStop(0, "#90a6dc"); g.addColorStop(0.45, "#6f86c6"); g.addColorStop(1, "#4d63a4"); c.fillStyle = g; c.fill();
  c.save(); poly(c, [...FO, [1024, base], [325, base]]); c.clip();
  // lavender haze at the base, teal at the lowest
  const hz = c.createLinearGradient(0, 200, 0, 300); hz.addColorStop(0, "rgba(160,150,210,0)"); hz.addColorStop(0.6, "rgba(120,140,190,0.35)"); hz.addColorStop(1, "rgba(70,120,130,0.6)"); c.fillStyle = hz; c.fillRect(300, 200, 760, 140);
  // shaded right flank: a soft darker wedge from the summit down the right
  const sh = c.createLinearGradient(705, 63, 900, 260); sh.addColorStop(0, "rgba(40,55,130,0.05)"); sh.addColorStop(0.6, "rgba(35,48,125,0.34)"); sh.addColorStop(1, "rgba(30,40,110,0.45)");
  poly(c, [[705, 63], [1024, 213], [1024, base], [760, base], [735, 190]]); c.fillStyle = sh; c.fill();
  // ridges and gullies: irregular, curved, different lengths; lit ridges on the left, shadowed gullies on the right
  const R = rng(3);
  for (let i = 0; i < 34; i++) {
    const p = (i + R() * 0.6) / 34, bx = lerp(280, 1080, p), by = base, f0 = 0.1 + R() * 0.22, f1 = 0.6 + R() * 0.4;
    const sx = lerp(705, bx, f0), sy = lerp(63, by, f0) , ex = lerp(705, bx, f1) + (R() - 0.5) * 16, ey = lerp(63, by, f1);
    const bend = (R() - 0.5) * 26, w1 = 3 + R() * 9, side = bx > 720 ? 1 : -1;
    c.beginPath(); c.moveTo(sx - 1, sy); c.quadraticCurveTo(lerp(sx, ex, 0.5) + bend, lerp(sy, ey, 0.5), ex - w1, ey); c.lineTo(ex + w1, ey); c.quadraticCurveTo(lerp(sx, ex, 0.5) + bend + 4, lerp(sy, ey, 0.5), sx + 1, sy); c.closePath();
    c.fillStyle = side > 0 ? "rgba(30,42,112,0.42)" : "rgba(48,62,140,0.36)"; c.fill();
    if (side < 0) { c.beginPath(); c.moveTo(sx - 3, sy + 4); c.quadraticCurveTo(lerp(sx, ex, 0.5) + bend - 7, lerp(sy, ey, 0.5), ex - w1 * 2.6, ey); c.lineTo(ex - w1 - 1, ey); c.quadraticCurveTo(lerp(sx, ex, 0.5) + bend, lerp(sy, ey, 0.5), sx - 1, sy); c.closePath(); c.fillStyle = "rgba(200,214,250,0.2)"; c.fill(); }
  }
  // forested blue-green foothills at the foot of the cone
  for (const [yb, amp, col, ph] of [[222, 22, "rgba(86,120,158,0.8)", 0.7], [248, 18, "rgba(60,112,120,0.9)", 2.1], [272, 16, "rgba(52,104,92,0.95)", 4.0]]) {
    c.beginPath(); c.moveTo(280, base); for (let x = 280; x <= 1060; x += 10) c.lineTo(x, yb + amp * Math.sin(x * 0.011 + ph) + amp * 0.5 * Math.sin(x * 0.041 + ph * 2) + (x > 700 ? -10 : 0) + (x < 420 ? (420 - x) * 0.25 : 0)); c.lineTo(1060, base); c.closePath(); c.fillStyle = col; c.fill();
    c.strokeStyle = "rgba(30,60,60,0.5)"; c.lineWidth = 1; c.stroke();
    for (let x = 290; x < 1060; x += 11) { const y = yb + amp * Math.sin(x * 0.011 + ph) + amp * 0.5 * Math.sin(x * 0.041 + ph * 2) + (x > 700 ? -10 : 0) + (x < 420 ? (420 - x) * 0.25 : 0); c.fillStyle = "rgba(30,64,50,0.5)"; c.beginPath(); c.arc(x, y + 4, 5 + hash(x) * 4, 0, TAU); c.fill(); }
  }
  // fine dry-brush hatching
  c.lineWidth = 0.8; for (let i = 0; i < 160; i++) { const x = lerp(330, 1020, R()), y = lerp(150, 300, R()); if (y < polyY(FO, x) + 20) continue; c.strokeStyle = R() < 0.5 ? "rgba(40,52,128,0.35)" : "rgba(170,190,240,0.3)"; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (x - 705) * 0.06, y + 10 + R() * 14); c.stroke(); }
  c.restore();
  // ---- snow cap
  const xs = []; for (let x = 470; x <= 892; x += 6) xs.push(x);
  const top = xs.map((x) => [x, polyY(FO, x)]);
  const low = xs.map((x) => {
    const f = 1 - Math.abs(x - 705) / 250, d = 24 + 52 * Math.max(0, f) ** 0.8, k = Math.floor(x / 10), spike = (hash(k * 2.7) > 0.55 ? 10 + hash(k * 5.1) * 38 : hash(k) * 8) * (0.5 + f * 0.7);
    return [x, polyY(FO, x) + d + spike + (x > 705 ? 6 : 0)];
  });
  const snowPoly = [...top, ...low.reverse()];
  poly(c, snowPoly); const sg = c.createLinearGradient(520, 80, 880, 200); sg.addColorStop(0, "#ffffff"); sg.addColorStop(0.6, "#f2f5fe"); sg.addColorStop(1, "#d6def4"); c.fillStyle = sg; c.fill();
  c.save(); poly(c, snowPoly); c.clip();
  // blue-grey shadow in the gullies and on the right flank
  c.fillStyle = "rgba(120,140,205,0.3)"; poly(c, [[705, 63], [900, 190], [900, 260], [760, 150]]); c.fill();
  c.strokeStyle = "rgba(100,122,196,0.65)"; c.lineCap = "round";
  for (let i = 0; i < 22; i++) { const p = i / 21, ex = lerp(480, 890, p), ey = polyY(FO, ex) + 70 + hash(i * 3.3) * 35, sx = lerp(705, ex, 0.15), sy = lerp(63, ey, 0.2); c.lineWidth = 1 + hash(i) * 2.2; c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(lerp(sx, ex, 0.5) + (hash(i + 9) - 0.5) * 12, lerp(sy, ey, 0.5), ex, ey); c.stroke(); }
  c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 1.4; for (let i = 0; i < 12; i++) { const x = lerp(560, 760, hash(i + 40)); c.beginPath(); c.moveTo(x, polyY(FO, x) + 8); c.lineTo(x - 6 + hash(i) * 12, polyY(FO, x) + 40 + hash(i * 9) * 20); c.stroke(); }
  c.restore();
  c.strokeStyle = "rgba(70,86,160,0.7)"; c.lineWidth = 1.2; c.lineJoin = "round"; c.beginPath(); FO.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke();
  // lenticular wisps drifting past the summit
  for (let i = 0; i < 2; i++) { const x = 880 + ((t * (7 + i * 3) + i * 200) % 330) - 160, y = 120 + i * 34; c.fillStyle = "rgba(255,255,255,0.35)"; c.beginPath(); c.ellipse(x, y, 60, 6, -0.12, 0, TAU); c.fill(); }
}

// ------------------------------------------------------------------ hills / forest -----------------------------------
export const HILL = [[330, 255], [400, 247], [470, 264], [520, 268], [560, 250], [600, 226], [650, 206], [720, 208], [800, 222], [900, 204], [970, 198], [1024, 204], [1024, 640], [70, 640], [72, 566], [95, 520], [120, 480], [150, 430], [190, 385], [235, 330], [270, 300], [300, 275]];
export function forest(c, t) {
  const R = rng(11);
  c.save(); poly(c, HILL); c.clip();
  c.fillStyle = "#587f55"; c.fillRect(60, 220, 980, 440);
  const rows = [
    [205, 285, ["#456f6a", "#4f7d6c", "#3f6a60", "#587f6e"], 10],
    [275, 310, ["#5d8a5c", "#4f7d52", "#6a9460", "#46744c"], 11],
    [300, 345, ["#7aa65a", "#699a52", "#8ab25c", "#5c8c4e", "#a3bf5a"], 12],
    [330, 400, ["#6f9c55", "#86ae58", "#5a8a4a", "#a8c15c", "#4f8048"], 14],
    [380, 470, ["#799f50", "#8db35c", "#c2c85a", "#5f9150", "#4c7e46", "#b5c85c"], 16],
  ];
  for (const [y0, y1, pal, r] of rows) for (let y = y0; y < y1 + 40; y += r * 0.55) for (let x = 40; x < 1060; x += r * 1.05) {
    const jx = x + (R() - 0.5) * r, jy = y + (R() - 0.5) * r * 0.6;
    if (jy < polyY(HILL.slice(0, 12), Math.max(330, Math.min(1024, jx))) - 6) continue;
    lobe(c, jx, jy, r * (0.55 + R() * 0.4), pal[Math.floor(R() * pal.length)], { squash: 0.8, ink: false });
  }
  c.restore();
  // pines on the ridge line
  for (const [x, y, h, s] of [[312, 332, 78, 1], [346, 322, 90, 2], [330, 340, 60, 3], [640, 262, 70, 4], [664, 252, 92, 5], [690, 254, 108, 6], [716, 262, 80, 7], [742, 258, 60, 13], [826, 262, 64, 8], [852, 252, 84, 9], [878, 262, 62, 10], [930, 262, 50, 14], [118, 450, 62, 11], [140, 438, 48, 12]]) pine(c, x, y, h, s * 3, s % 2 ? "#2e5a3c" : "#386644");
}
// yellow-green and darker round trees scattered on the slopes (drawn after terraces so they overlap)
export function slopeTrees(c, t, which) {
  const pal1 = ["#b9c94e", "#a7bf48", "#cbd45a", "#8fb04a"], pal2 = ["#6f9c55", "#5f8f4c", "#86ae58"];
  if (which === "left") {
    roundTree(c, 262, 372, 38, pal1, 21, { trunk: 40, n: 10 });
    roundTree(c, 150, 540, 34, pal2, 22, { trunk: 36 }); roundTree(c, 110, 575, 30, pal1, 23, { trunk: 30 });
    roundTree(c, 248, 500, 38, pal1, 24, { trunk: 40 }); roundTree(c, 180, 470, 34, pal2, 25, { trunk: 30 });
    roundTree(c, 120, 440, 28, pal1, 26, { trunk: 26 });
  } else {
    roundTree(c, 610, 300, 24, pal2, 31, { trunk: 22 }); roundTree(c, 905, 300, 36, pal2, 32, { trunk: 30 });
    roundTree(c, 960, 340, 34, pal1, 33, { trunk: 30 }); roundTree(c, 820, 285, 24, pal1, 34, { trunk: 20 });
    roundTree(c, 935, 420, 32, pal2, 35, { trunk: 28 }); roundTree(c, 660, 290, 22, pal1, 36, { trunk: 20 });
  }
}

// ------------------------------------------------------------------ tea terraces -------------------------------------
// rows of rounded bushes following the slope: each row is an arc a->b with control point ctl
export function teaTerrace(c, rows, seed, t) {
  const R = rng(seed);
  // soil strip under every row, then bushes along it
  const pt = (r, f) => { const [a, ctl, b] = r; const m = 1 - f; return [m * m * a[0] + 2 * m * f * ctl[0] + f * f * b[0], m * m * a[1] + 2 * m * f * ctl[1] + f * f * b[1]]; };
  rows.forEach((r, i) => {
    c.beginPath(); c.moveTo(...r[0]); c.quadraticCurveTo(...r[1], ...r[2]); c.strokeStyle = "#2f5a2c"; c.lineWidth = r[3] + 6; c.lineCap = "round"; c.stroke();
  });
  rows.forEach((r, i) => {
    const len = Math.hypot(r[2][0] - r[0][0], r[2][1] - r[0][1]), n = Math.round(len / 7), w = r[3];
    for (let j = 0; j <= n; j++) {
      const f = j / n, [x, y] = pt(r, f), pal = i % 2 ? ["#4c8f3c", "#58a044", "#43883a"] : ["#68ae4a", "#78bc52", "#5ea644"];
      const col = pal[Math.floor(R() * 3)], rr = w * (0.62 + R() * 0.12);
      c.beginPath(); c.ellipse(x, y, rr * 1.15, rr * 0.8, 0, 0, TAU); c.fillStyle = col; c.fill();
      c.beginPath(); c.ellipse(x - rr * 0.1, y - rr * 0.32, rr * 0.9, rr * 0.38, 0, Math.PI, TAU); c.fillStyle = shade(col, 0.28); c.globalAlpha = 0.75; c.fill(); c.globalAlpha = 1;
      c.beginPath(); c.ellipse(x, y + rr * 0.25, rr * 1.1, rr * 0.4, 0, 0, Math.PI); c.fillStyle = "rgba(10,40,20,0.28)"; c.fill();
    }
    c.beginPath(); c.moveTo(...r[0]); c.quadraticCurveTo(...r[1], ...r[2]); c.strokeStyle = "rgba(20,50,25,0.4)"; c.lineWidth = 0.8; c.translate(0, w * 0.6); c.stroke(); c.translate(0, -w * 0.6);
  });
}
export const rowsLens = (L, Rr, nrows, bulge, drop, w) => Array.from({ length: nrows }, (_, i) => { const f = i / (nrows - 1); return [[L[0] + drop[0] * f, L[1] + drop[1] * f], [(L[0] + Rr[0]) / 2 + 4 * f, (L[1] + Rr[1]) / 2 - bulge + (drop[1] * f) * 1.1], [Rr[0] - (Rr[0] - L[0]) * 0.06 * f * 2, Rr[1] + drop[1] * f * 1.3], w]; });

// ------------------------------------------------------------------ farmhouse -----------------------------------------
// local origin: left eave tip. s scale. width ~166
export function farmhouse(c, x, y, s, t, o = {}) {
  c.save(); c.translate(x, y); c.scale(s, s);
  // wall with shoji panels + wood posts
  fillPoly(c, [[26, -2], [150, 2], [150, 34], [26, 31]], "#9a6c40", 1);
  c.save(); poly(c, [[26, -2], [150, 2], [150, 34], [26, 31]]); c.clip();
  for (let i = 0; i < 6; i++) { const x0 = 32 + i * 20; fillPoly(c, [[x0, 10], [x0 + 15, 10.4], [x0 + 15, 28], [x0, 27.6]], i % 2 ? "#efdfae" : "#e6cf90", 0.7, "#5b3c20"); c.strokeStyle = "rgba(90,60,30,0.6)"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x0 + 7.5, 10); c.lineTo(x0 + 7.5, 28); c.moveTo(x0, 19); c.lineTo(x0 + 15, 19.2); c.stroke(); }
  c.restore();
  // main tiled roof (front slope)
  const roof = [[0, 0], [40, -44], [118, -50], [168, -4]];
  fillPoly(c, roof, "#7d786e", 1.3);
  c.save(); poly(c, roof); c.clip();
  const rg = c.createLinearGradient(0, -50, 0, 0); rg.addColorStop(0, "#9a958a"); rg.addColorStop(1, "#5f5b54"); c.fillStyle = rg; c.fillRect(-4, -54, 180, 60);
  c.strokeStyle = "rgba(30,28,24,0.55)"; c.lineWidth = 0.8; for (let i = 0; i <= 34; i++) { const f = i / 34; c.beginPath(); c.moveTo(lerp(40, 0, 0) + (118 - 40) * f, lerp(-44, -50, f)); c.lineTo(lerp(0, 168, f), lerp(0, -4, f)); c.stroke(); }
  for (let j = 1; j < 7; j++) { const f = j / 7; c.beginPath(); c.moveTo(lerp(40, 0, f), lerp(-44, 0, f)); c.lineTo(lerp(118, 168, f), lerp(-50, -4, f)); c.strokeStyle = "rgba(30,28,24,0.28)"; c.stroke(); }
  c.restore();
  // ridge cap + left hip edge
  c.strokeStyle = "#3b372f"; c.lineWidth = 3; c.beginPath(); c.moveTo(38, -45); c.lineTo(120, -51); c.stroke(); c.strokeStyle = "#b3ad9f"; c.lineWidth = 1.2; c.stroke();
  // eave band + lower hisashi roof across the front
  fillPoly(c, [[-4, 1], [170, -3], [176, 7], [-8, 11]], "#6f6a5f", 1);
  fillPoly(c, [[40, 10], [150, 12], [168, 22], [32, 21]], "#8d887d", 0.9);
  // right gable end: dark timber triangle with white plaster
  fillPoly(c, [[118, -50], [168, -4], [172, -18], [140, -52]], "#bdb7a8", 1);
  if (o.smoke) for (let i = 0; i < 6; i++) { const f = ((t * 0.18 + i / 6) % 1), a = 0.4 * (1 - f); c.fillStyle = `rgba(235,235,235,${a})`; c.beginPath(); c.arc(100 + Math.sin(f * 7 + i) * 6 + f * 18, -56 - f * 50, 3 + f * 8, 0, TAU); c.fill(); }
  c.restore();
}

// ------------------------------------------------------------------ viaduct ------------------------------------------
export const NY = (x) => (x < 480 ? 603 - 0.242 * (x - 67) : 504 - 0.294 * (x - 480)); // near top edge of the girder
export const RAIL = (x) => 597 - 0.295 * (x - 165) - 46; // train wheel line
export const PIERS = [[152, 658], [478, 585], [683, 538], [842, 470], [988, 428]];
export function viaductBack(c) {
  // piers (behind the girder)
  for (const [x, bot] of PIERS) {
    const top = NY(x) + 30, w = 27;
    fillPoly(c, [[x - w - 14, top], [x + w + 14, top], [x + w + 6, top + 14], [x + w, top + 24], [x + w, bot], [x - w, bot], [x - w, top + 24], [x - w - 6, top + 14]], null, 0);
    const gr = c.createLinearGradient(x - w, 0, x + w, 0); gr.addColorStop(0, "#d7ccb6"); gr.addColorStop(0.55, "#c4b79f"); gr.addColorStop(1, "#a89b83");
    poly(c, [[x - w - 14, top], [x + w + 14, top], [x + w + 6, top + 14], [x + w, top + 24], [x + w, bot], [x - w, bot], [x - w, top + 24], [x - w - 6, top + 14]]); c.fillStyle = gr; c.fill(); c.strokeStyle = "rgba(60,50,38,0.8)"; c.lineWidth = 1.2; c.lineJoin = "round"; c.stroke();
    c.fillStyle = "rgba(70,56,40,0.2)"; c.fillRect(x + 6, top + 24, w - 6, bot - top - 24);
    c.strokeStyle = "rgba(90,78,60,0.4)"; c.lineWidth = 0.7; for (let y = top + 30; y < bot; y += 11) { c.beginPath(); c.moveTo(x - w, y); c.lineTo(x + w, y + 1); c.stroke(); }
    c.strokeStyle = "rgba(255,248,230,0.45)"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x - w + 2, top + 26); c.lineTo(x - w + 2, bot); c.stroke();
  }
}
export function viaductDeck(c) {
  const X0 = 66, X1 = 1030, N = NY;
  // concrete girder face, haunch deepening around the piers
  const bot = (x) => { let d = 31; for (const [px] of PIERS) { const q = Math.max(0, 1 - Math.abs(x - px) / 80); d += 22 * q * q * (3 - 2 * q); } return N(x) + d; };
  const xs = []; for (let x = X0; x <= X1; x += 6) xs.push(x);
  poly(c, [...xs.map((x) => [x, N(x)]), ...xs.slice().reverse().map((x) => [x, bot(x)])]);
  const gg = c.createLinearGradient(0, 400, 0, 640); gg.addColorStop(0, "#e2d8c3"); gg.addColorStop(1, "#c9bda4"); c.fillStyle = gg; c.fill(); c.strokeStyle = "rgba(60,50,38,0.8)"; c.lineWidth = 1.3; c.stroke();
  // shadow band under the lip + panel joints
  poly(c, [...xs.map((x) => [x, N(x) + 4]), ...xs.slice().reverse().map((x) => [x, N(x) + 16])]); c.fillStyle = "rgba(255,250,235,0.35)"; c.fill();
  poly(c, [...xs.map((x) => [x, N(x) + 30]), ...xs.slice().reverse().map((x) => [x, bot(x)])]); c.fillStyle = "rgba(90,74,54,0.16)"; c.fill();
  c.strokeStyle = "rgba(80,68,50,0.4)"; c.lineWidth = 0.8; for (let x = 90; x < X1; x += 52) { c.beginPath(); c.moveTo(x, N(x) + 4); c.lineTo(x, N(x) + 34); c.stroke(); }
  // deck bed: ballast + ties + two rails; far parapet
  const farOff = 58, nearOff = -2;
  poly(c, [[X0, N(X0) - farOff], [X1, N(X1) - farOff], [X1, N(X1) + nearOff], [X0, N(X0) + nearOff]]); c.fillStyle = "#b09a7e"; c.fill();
  // ties: slanted brown bars across the bed
  c.lineCap = "butt";
  for (let x = X0; x < X1; x += 5) { const a = N(x) - farOff + 6, b = N(x) - 12; c.strokeStyle = "rgba(112,84,56,0.55)"; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x, b); c.lineTo(x + 7, a); c.stroke(); }
  // ballast shoulders
  poly(c, [[X0, N(X0) - 14], [X1, N(X1) - 14], [X1, N(X1) - 2], [X0, N(X0) - 2]]); c.fillStyle = "rgba(160,150,138,0.8)"; c.fill();
  for (const o of [-52, -34, -26, -8]) { c.strokeStyle = "#5b5e66"; c.lineWidth = 2; c.beginPath(); c.moveTo(X0, N(X0) + o); c.lineTo(X1, N(X1) + o); c.stroke(); c.strokeStyle = "rgba(230,230,235,0.7)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(X0, N(X0) + o - 1); c.lineTo(X1, N(X1) + o - 1); c.stroke(); }
  // far parapet: grey fence + railing
  fence(c, X0, X1, (x) => N(x) - farOff, 20, 11);
  // left end cap (face of the girder) + the bed ends in a curve
  fillPoly(c, [[X0 - 4, N(X0) - farOff - 6], [X0 + 4, N(X0) - farOff + 1], [X0 + 4, bot(X0)], [X0 - 4, bot(X0) - 2]], "#cfc4ac", 1);
}
export function fence(c, X0, X1, y, h, pitch) {
  c.lineCap = "butt"; c.strokeStyle = "#8a9099"; c.lineWidth = 1.4;
  for (let x = X0; x < X1; x += pitch) { c.beginPath(); c.moveTo(x, y(x)); c.lineTo(x, y(x) - h); c.stroke(); }
  for (const f of [1, 0.55, 0.12]) { c.strokeStyle = "#5f656e"; c.lineWidth = 1.7; c.beginPath(); c.moveTo(X0, y(X0) - h * f); c.lineTo(X1, y(X1) - h * f); c.stroke(); c.strokeStyle = "rgba(235,238,242,0.8)"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(X0, y(X0) - h * f - 0.8); c.lineTo(X1, y(X1) - h * f - 0.8); c.stroke(); }
}
export function viaductFront(c) { fence(c, 66, 1030, (x) => NY(x) - 2, 17, 9); }

// ------------------------------------------------------------------ Shinkansen N700 -----------------------------------
// head: x of the nose tip. cars run to the right (train moves left).
export function train(c, head, t) {
  const NOSE = 175, CAR = 223, GAP = 4, nCars = 7;
  const vib = Math.sin(t * 41) * 0.45;
  const at = (xs, h) => { const x = head + xs; return [x, RAIL(x) - h + vib]; };
  const wrapPath = (pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
  const bodyGrad = (xs) => { const [x, y] = at(xs, 70), [, y0] = at(xs, 0); const g = c.createLinearGradient(0, y, 0, y0); g.addColorStop(0, "#ffffff"); g.addColorStop(0.35, "#f4f6fa"); g.addColorStop(0.72, "#e3e8f0"); g.addColorStop(1, "#bcc5d2"); return g; };
  const band = (a, b, h0, h1, col) => { wrapPath([at(a, h0), at(b, h0), at(b, h1), at(a, h1)]); c.fillStyle = col; c.fill(); };
  // car list: [start, end]
  const cars = [[0, NOSE + CAR - 4]];
  for (let i = 1; i < nCars; i++) { const s = NOSE + CAR + (i - 1) * (CAR + GAP) - 4 + GAP; cars.push([s + 4, s + CAR]); }
  c.save(); c.beginPath(); c.rect(70, 0, 1000, 1024); c.clip();
  c.lineJoin = "round";
  cars.forEach(([s0, s1], i) => {
    const cx0 = at(s0, 0)[0], cx1 = at(s1, 0)[0];
    if (cx1 < 60 || cx0 > 1040) return;
    // bogies + underfloor
    for (const bx of i === 0 ? [NOSE - 30, NOSE + 150] : [s0 + 24, s1 - 40]) { band(bx - 8, bx + 38, 0, 9, "#2c3038"); for (const wx of [bx, bx + 30]) { const [x, y] = at(wx + 4, 4.5); c.fillStyle = "#15171b"; c.beginPath(); c.arc(x, y, 4.6, 0, TAU); c.fill(); c.fillStyle = "#6a7078"; c.beginPath(); c.arc(x, y, 1.6, 0, TAU); c.fill(); } }
    // body silhouette
    if (i === 0) {
      const pts = [at(NOSE + CAR - 4, 8), at(NOSE + CAR - 4, 66)];
      c.beginPath(); c.moveTo(...at(NOSE + CAR - 4, 8)); c.lineTo(...at(NOSE + CAR - 4, 66));
      c.bezierCurveTo(...at(NOSE + 40, 71), ...at(118, 62), ...at(62, 43));
      c.bezierCurveTo(...at(26, 30), ...at(2, 22), ...at(0, 15));
      c.bezierCurveTo(...at(0, 8), ...at(10, 6), ...at(34, 7));
      c.lineTo(...at(NOSE + CAR - 30, 7)); c.closePath();
    } else { wrapPath([at(s0, 8), at(s0, 66), at(s1, 66), at(s1, 8)]); }
    c.fillStyle = bodyGrad(s0); c.fill(); c.strokeStyle = "rgba(42,36,32,0.85)"; c.lineWidth = 1.4; c.stroke();
    c.save(); c.clip();
    // roof strip (top surface seen from above) + underside shade
    const rS = i === 0 ? 40 : s0, rE = s1;
    band(rS, rE, 62, 70, "#d8dde6"); band(rS, rE, 60, 62.5, "rgba(120,130,150,0.5)");
    band(s0, s1, 8, 14, "#98a1af"); band(s0, s1, 8, 10, "rgba(40,44,52,0.5)");
    // stripes: blue line + thin light-blue line under the windows
    band(i === 0 ? 20 : s0, s1, 24, 30.5, "#1c43a6"); band(i === 0 ? 40 : s0, s1, 20, 22, "#8aa3dc"); band(i === 0 ? 20 : s0, s1, 30.5, 32, "rgba(255,255,255,0.7)");
    c.restore();
    // roof equipment boxes
    if (i > 0) { for (const f of [0.18, 0.55]) { const a = s0 + (s1 - s0) * f; wrapPath([at(a, 68), at(a + 40, 68), at(a + 40, 74), at(a, 74)]); c.fillStyle = "#cfd5de"; c.fill(); c.strokeStyle = "rgba(60,64,72,0.7)"; c.lineWidth = 0.8; c.stroke(); } }
    // windows
    if (i > 0) {
      const n = 14, p0 = s0 + 26, pitch = (s1 - s0 - 42) / n;
      for (let w = 0; w < n; w++) { const a = p0 + w * pitch; wrapPath([at(a, 36), at(a + pitch * 0.64, 36), at(a + pitch * 0.64, 47), at(a, 47)]); c.fillStyle = "#2b3752"; c.fill(); c.strokeStyle = "rgba(20,24,34,0.9)"; c.lineWidth = 0.8; c.stroke(); const [hx, hy] = at(a + 1.2, 46); c.fillStyle = "rgba(190,210,245,0.55)"; c.fillRect(hx, hy + 0.8, pitch * 0.64 - 2.4, 2); }
      // doors at the car ends
      for (const d of [s0 + 6, s1 - 22]) { wrapPath([at(d, 12), at(d + 15, 12), at(d + 15, 56), at(d, 56)]); c.strokeStyle = "rgba(60,70,90,0.8)"; c.lineWidth = 0.9; c.stroke(); const [wx, wy] = at(d + 3.5, 50); c.fillStyle = "#33405c"; c.fillRect(wx, wy, 8, 7); }
    } else {
      // driver's cab: windscreen, side window, headlight, sign
      c.beginPath(); c.moveTo(...at(64, 44)); c.bezierCurveTo(...at(80, 52), ...at(104, 55), ...at(124, 54)); c.lineTo(...at(118, 45)); c.bezierCurveTo(...at(104, 40), ...at(86, 37), ...at(68, 33)); c.closePath(); c.fillStyle = "#1f2a44"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
      c.beginPath(); c.moveTo(...at(70, 44)); c.bezierCurveTo(...at(84, 50), ...at(100, 52), ...at(116, 52)); c.strokeStyle = "rgba(170,195,235,0.7)"; c.lineWidth = 1.2; c.stroke();
      const [hx, hy] = at(30, 17); c.fillStyle = "#ffd96a"; c.beginPath(); c.ellipse(hx, hy, 5, 2.3, -0.25, 0, TAU); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.7; c.stroke();
      const [tx, ty] = at(4, 12); c.fillStyle = "#e7ecf4"; c.beginPath(); c.arc(tx + 3, ty, 4, 0, TAU); c.fill();
      // cab side windows then first car windows
      const n = 9, p0 = 150, pitch = 14.4;
      for (let w = 0; w < n; w++) { const a = p0 + w * pitch; wrapPath([at(a, 36), at(a + pitch * 0.64, 36), at(a + pitch * 0.64, 47), at(a, 47)]); c.fillStyle = "#2b3752"; c.fill(); c.strokeStyle = "rgba(20,24,34,0.9)"; c.lineWidth = 0.8; c.stroke(); }
      wrapPath([at(126, 12), at(142, 12), at(142, 56), at(126, 56)]); c.strokeStyle = "rgba(60,70,90,0.8)"; c.lineWidth = 0.9; c.stroke();
      band(60, 75, 21, 24, "rgba(0,0,0,0)");
    }
    // diagonal bellows between cars
    if (i > 0) { const a = s0 - 3; wrapPath([at(a, 6), at(a + 8, 6), at(a + 12, 62), at(a + 4, 62)]); c.fillStyle = "#3a3f4a"; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke(); wrapPath([at(a + 2, 8), at(a + 4, 8), at(a + 7, 60), at(a + 5, 60)]); c.fillStyle = "rgba(255,255,255,0.18)"; c.fill(); }
  });
  c.restore();
}

// ------------------------------------------------------------------ catenary ------------------------------------------
export const POLES = [[202, 570], [507, 490], [872, 387], [1005, 352]];
export function pole(c, bx, by, hgt = 172, lean = 0.2) {
  const tx = bx + hgt * lean, ty = by - hgt, w0 = 7, w1 = 4.4;
  const L = (f, side) => [lerp(bx, tx, f) + side * lerp(w0, w1, f), lerp(by, ty, f)];
  // lattice mast: two chords + zig-zag + highlight
  c.strokeStyle = INK; c.lineWidth = 3.4; c.lineCap = "butt"; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(...L(0, s)); c.lineTo(...L(1, s)); c.stroke(); }
  c.strokeStyle = "#d7dadf"; c.lineWidth = 1.9; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(...L(0, s)); c.lineTo(...L(1, s)); c.stroke(); }
  c.strokeStyle = "rgba(60,64,72,0.9)"; c.lineWidth = 0.9; c.beginPath(); const n = 18; for (let i = 0; i < n; i++) { const a = L(i / n, i % 2 ? 1 : -1), b = L((i + 1) / n, i % 2 ? -1 : 1); c.moveTo(...a); c.lineTo(...b); } c.stroke();
  // concrete base
  fillPoly(c, [[bx - 11, by + 4], [bx + 11, by + 4], [bx + 9, by - 12], [bx - 9, by - 12]], "#cfc6b2", 1);
  // cantilever arms at the top (towards the track), insulators
  c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(tx - 8, ty + 18); c.lineTo(tx + 62, ty + 16); c.moveTo(tx - 6, ty + 3); c.lineTo(tx + 62, ty + 16); c.moveTo(tx - 18, ty + 9); c.lineTo(tx + 40, ty + 9); c.stroke();
  c.strokeStyle = "#d4d7dc"; c.lineWidth = 1.5; c.stroke();
  c.fillStyle = "#9db1c4"; for (const [ix, iy] of [[tx + 22, ty + 10], [tx + 46, ty + 12]]) c.fillRect(ix - 1.5, iy, 3, 6);
  return [tx + 62, ty + 16];
}
export function wires(c, poles) {
  const att = poles.map(([bx, by]) => [bx + 172 * 0.2 + 62, by - 172 + 16]);
  c.lineCap = "round";
  for (const [dy, sag, w] of [[0, 9, 1.1], [20, 3, 1.0]]) {
    const nodes = [[-20, att[0][1] + dy + (att[0][0] + 20) * 0.295], ...att.map((a) => [a[0], a[1] + dy]), [1070, att[att.length - 1][1] + dy - (1070 - att[att.length - 1][0]) * 0.295]];
    const out = [];
    for (let i = 0; i < nodes.length - 1; i++) { const a = nodes[i], b = nodes[i + 1]; for (let s = 0; s <= 12; s++) { const f = s / 12; out.push([lerp(a[0], b[0], f), lerp(a[1], b[1], f) + Math.sin(f * Math.PI) * sag]); } }
    c.beginPath(); out.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.strokeStyle = "rgba(52,46,42,0.85)"; c.lineWidth = w; c.stroke();
    if (dy === 20) { c.strokeStyle = "rgba(52,46,42,0.5)"; c.lineWidth = 0.6; for (let i = 0; i < out.length; i += 3) { const p = out[i]; c.beginPath(); c.moveTo(p[0], p[1] - 20); c.lineTo(p[0], p[1]); c.stroke(); } }
  }
}
