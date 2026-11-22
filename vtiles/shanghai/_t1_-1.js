// Nanjing Road tile helpers: art-deco / beaux-arts department store facades, mansard roofs, clock domes, neon signs, tram.
// Everything is a pure function of t. Walls are described by a segment A->B in (u,v) with an outward normal n.
import { P, INK, shade, mix, lerp, clamp, hash } from "./_props.js";

export const fp = (c, pts, fill, stroke, lw = 0.9) => {
  c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.lineJoin = "round"; c.stroke(); }
};
const ln = (c, a, b, col = INK, lw = 0.8) => { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); };

export function makeWall(A, B, n) {
  const len = Math.hypot(B[0] - A[0], B[1] - A[1]), du = (B[0] - A[0]) / len, dv = (B[1] - A[1]) / len;
  const pt = (a, z, o = 0) => P(A[0] + du * a + n[0] * o, A[1] + dv * a + n[1] * o, z);
  const lit = n[1] / (n[0] + n[1] + 1e-9);
  const tone = (col, d = 0) => mix(shade(col, -0.2 + d), shade(col, -0.03 + d), lit);
  return { len, pt, n, lit, tone, A, B };
}
const quad = (W, a0, a1, z0, z1, o0 = 0, o1 = o0) => [W.pt(a0, z0, o0), W.pt(a1, z0, o0), W.pt(a1, z1, o1), W.pt(a0, z1, o1)];

export const STONE = "#e8d6a8", STONE_D = "#d9c28c", TRIM = "#f3e6c0", SLATE = "#586f98", GOLD = "#e3b54c";

export function wallBlock(c, W, z0, z1, col) { fp(c, quad(W, 0, W.len, z0, z1), W.tone(col), INK, 1.5); }

// projecting horizontal course (string course / cornice member)
export function course(c, W, a0, a1, z, h, out, col = TRIM) {
  fp(c, [W.pt(a0, z + h, 0), W.pt(a1, z + h, 0), W.pt(a1, z + h, out), W.pt(a0, z + h, out)], shade(col, 0.08), INK, 0.7);
  fp(c, quad(W, a0, a1, z, z + h, out), W.tone(col, 0.04), INK, 0.8);
  fp(c, [W.pt(a0, z, 0), W.pt(a1, z, 0), W.pt(a1, z - 0.1, 0), W.pt(a0, z - 0.1, 0)], "rgba(70,45,20,0.2)");
}
export function cornice(c, W, z, o = {}) {
  const a0 = o.a0 ?? 0, a1 = o.a1 ?? W.len, h = o.h ?? 0.5;
  fp(c, quad(W, a0, a1, z, z + h * 0.45), W.tone("#e2cc98"), INK, 0.7);
  for (let a = a0 + 0.07; a < a1 - 0.05; a += 0.14) fp(c, quad(W, a, a + 0.07, z + h * 0.3, z + h * 0.45, 0.07), W.tone(TRIM, 0.04), "rgba(42,36,32,0.5)", 0.4);
  for (let a = a0 + 0.2; a < a1 - 0.1; a += 0.42) fp(c, quad(W, a, a + 0.09, z + h * 0.45, z + h * 0.72, 0.12, 0.2), W.tone(STONE_D), "rgba(42,36,32,0.55)", 0.45);
  course(c, W, a0 - 0.05, a1 + 0.05, z + h * 0.62, h * 0.24, 0.26, TRIM);
  course(c, W, a0 - 0.05, a1 + 0.05, z + h * 0.86, h * 0.14, 0.3, STONE);
}
export function balustrade(c, W, z, h, o = {}) {
  const a0 = o.a0 ?? 0, a1 = o.a1 ?? W.len, off = 0.22;
  fp(c, quad(W, a0, a1, z, z + h * 0.18, off), W.tone(TRIM), INK, 0.6);
  for (let a = a0 + 0.05; a < a1 - 0.08; a += 0.12) {
    const p = [W.pt(a, z + h * 0.18, off), W.pt(a + 0.06, z + h * 0.18, off), W.pt(a + 0.07, z + h * 0.52, off), W.pt(a + 0.05, z + h * 0.82, off), W.pt(a, z + h * 0.82, off), W.pt(a - 0.01, z + h * 0.52, off)];
    fp(c, p, W.tone(TRIM, 0.05), "rgba(42,36,32,0.55)", 0.4);
  }
  fp(c, quad(W, a0, a1, z + h * 0.82, z + h, off + 0.05), W.tone(TRIM, 0.06), INK, 0.7);
  const piers = o.piers ?? Math.max(2, Math.round((a1 - a0) / 0.9));
  for (let i = 0; i <= piers; i++) {
    const a = lerp(a0 + 0.08, a1 - 0.08, i / piers), w = 0.1;
    fp(c, quad(W, a - w, a + w, z, z + h * 1.05, off + 0.03), W.tone(STONE, 0.04), INK, 0.6);
    const [x, y] = W.pt(a, z + h * 1.1, off + 0.03); c.fillStyle = W.tone(TRIM); c.strokeStyle = INK; c.lineWidth = 0.6; c.beginPath(); c.ellipse(x, y, 2.2, 3, 0, 0, 7); c.fill(); c.stroke();
  }
}
export function pilaster(c, W, ac, pw, z0, z1, col = TRIM, o = {}) {
  const out = o.out ?? 0.07;
  fp(c, quad(W, ac - pw / 2, ac + pw / 2, z0, z1, out), W.tone(col, 0.04), INK, 0.7);
  fp(c, quad(W, ac + pw / 2, ac + pw / 2, z0, z1, out, 0).length ? [W.pt(ac + pw / 2, z0, out), W.pt(ac + pw / 2, z1, out), W.pt(ac + pw / 2, z1, 0), W.pt(ac + pw / 2, z0, 0)] : [], "rgba(70,45,20,0.1)");
  c.strokeStyle = "rgba(90,65,30,0.35)"; c.lineWidth = 0.5;
  for (const f of [-0.22, 0.22]) { c.beginPath(); c.moveTo(...W.pt(ac + f * pw, z0 + 0.12, out)); c.lineTo(...W.pt(ac + f * pw, z1 - 0.16, out)); c.stroke(); }
  if (o.cap !== false) {
    fp(c, quad(W, ac - pw * 0.72, ac + pw * 0.72, z1 - 0.2, z1, out + 0.04), W.tone(TRIM, 0.08), INK, 0.7);
    fp(c, quad(W, ac - pw * 0.6, ac + pw * 0.6, z1 - 0.34, z1 - 0.2, out + 0.02), W.tone(GOLD, 0.15), "rgba(42,36,32,0.5)", 0.5);
    fp(c, quad(W, ac - pw * 0.66, ac + pw * 0.66, z0, z0 + 0.14, out + 0.03), W.tone(TRIM, 0.04), INK, 0.6);
  }
}
function archTop(W, ac, hw, zs, o = 0, steps = 9, ratio = 1) {
  const pts = [];
  for (let i = 0; i <= steps; i++) { const th = Math.PI * (1 - i / steps); pts.push(W.pt(ac + hw * Math.cos(th), zs + hw * ratio * Math.sin(th), o)); }
  return pts;
}
function archShape(W, ac, hw, z0, zs, o = 0, ratio = 1) { return [W.pt(ac - hw, z0, o), ...archTop(W, ac, hw, zs, o, 9, ratio), W.pt(ac + hw, z0, o)]; }

// upper-floor window with surround, mullions, curtains, optional balcony + flower box
export function windowBay(c, W, ac, w, z0, h, o = {}) {
  const hw = w / 2, arch = o.arch ?? true, zs = z0 + h - (arch ? hw * 0.9 : 0), r = hash((o.seed ?? 0) * 3.7 + ac * 11.3);
  const lit = r < (o.lit ?? 0.18);
  const sh = arch ? (o.shape || archShape) : null;
  const frame = arch ? archShape(W, ac, hw + 0.07, z0 - 0.05, zs, 0.03, 0.9) : quad(W, ac - hw - 0.07, ac + hw + 0.07, z0 - 0.05, z0 + h + 0.07, 0.03);
  fp(c, frame, W.tone(TRIM, 0.05), "rgba(42,36,32,0.8)", 0.8);
  const glass = arch ? archShape(W, ac, hw, z0, zs, 0.0, 0.9) : quad(W, ac - hw, ac + hw, z0, z0 + h);
  fp(c, glass, lit ? "#f6d57e" : W.tone("#6c86a6", -0.02), "rgba(42,36,32,0.85)", 0.8);
  c.save(); c.beginPath(); glass.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.clip();
  // sky reflection streak + curtain
  const g = c.createLinearGradient(...W.pt(ac, z0 + h), ...W.pt(ac, z0)); g.addColorStop(0, lit ? "rgba(255,240,170,0.5)" : "rgba(200,225,245,0.35)"); g.addColorStop(1, "rgba(30,40,60,0.18)"); c.fillStyle = g; c.fillRect(W.pt(ac - hw, z0)[0] - 40, W.pt(ac, z0 + h)[1] - 20, 120, 200);
  if (lit) { fp(c, [W.pt(ac - hw, z0 + h * 0.2), W.pt(ac - hw * 0.4, z0 + h * 0.2), W.pt(ac - hw, z0 + h * 0.85)], "rgba(190,70,60,0.5)"); fp(c, [W.pt(ac + hw, z0 + h * 0.2), W.pt(ac + hw * 0.4, z0 + h * 0.2), W.pt(ac + hw, z0 + h * 0.85)], "rgba(190,70,60,0.5)"); }
  ln(c, W.pt(ac, z0), W.pt(ac, zs + hw * 0.9), "rgba(42,36,32,0.75)", 0.8); ln(c, W.pt(ac - hw, z0 + h * 0.52), W.pt(ac + hw, z0 + h * 0.52), "rgba(42,36,32,0.75)", 0.8);
  c.restore();
  // keystone / pediment
  if (arch) { const [kx, ky] = W.pt(ac, zs + hw * 0.9 + 0.1, 0.05); fp(c, [[kx - 2, ky + 3], [kx + 2, ky + 3], [kx + 1.4, ky - 3], [kx - 1.4, ky - 3]], W.tone(STONE_D), "rgba(42,36,32,0.7)", 0.5); }
  else if (o.pediment) fp(c, [W.pt(ac - hw - 0.1, z0 + h + 0.07, 0.04), W.pt(ac + hw + 0.1, z0 + h + 0.07, 0.04), W.pt(ac, z0 + h + 0.3, 0.04)], W.tone(TRIM), INK, 0.7);
  // sill + balcony
  fp(c, quad(W, ac - hw - 0.1, ac + hw + 0.1, z0 - 0.09, z0 - 0.03, 0.1), W.tone(TRIM, 0.05), INK, 0.6);
  if (o.balcony) {
    const bo = 0.17, bz = z0 - 0.05;
    fp(c, [W.pt(ac - hw - 0.12, bz, 0), W.pt(ac + hw + 0.12, bz, 0), W.pt(ac + hw + 0.12, bz, bo), W.pt(ac - hw - 0.12, bz, bo)], W.tone(TRIM, 0.05), INK, 0.6);
    for (let a = ac - hw - 0.1; a <= ac + hw + 0.1; a += 0.075) ln(c, W.pt(a, bz, bo), W.pt(a, bz + 0.3, bo), "rgba(42,36,32,0.8)", 0.5);
    ln(c, W.pt(ac - hw - 0.12, bz + 0.3, bo), W.pt(ac + hw + 0.12, bz + 0.3, bo), INK, 0.9);
    ln(c, W.pt(ac - hw - 0.12, bz + 0.3, bo), W.pt(ac - hw - 0.12, bz, bo), INK, 0.7); ln(c, W.pt(ac + hw + 0.12, bz + 0.3, bo), W.pt(ac + hw + 0.12, bz, bo), INK, 0.7);
  }
  if (o.flowers) {
    const bz = z0 - 0.02;
    fp(c, quad(W, ac - hw - 0.04, ac + hw + 0.04, bz, bz + 0.15, 0.13), "#9a5f3b", INK, 0.6);
    for (let i = 0; i < 9; i++) { const [x, y] = W.pt(ac - hw + (i / 8) * w, bz + 0.2 + hash(i + ac * 9) * 0.05, 0.13); c.fillStyle = ["#e8607a", "#ffd24a", "#f39ac0", "#ffffff", "#7ab55a"][(i * 3 + Math.round(ac * 7)) % 5]; c.beginPath(); c.arc(x, y, 1.9, 0, 7); c.fill(); }
  }
}

// ground-floor arcade of arched shop windows (lit, with mannequins) + optional striped awnings
export function arcade(c, W, o) {
  const { a0, a1, gh, bw, t } = o, n = Math.max(1, Math.round((a1 - a0) / bw)), w = (a1 - a0) / n, seed = o.seed ?? 1;
  // rustication
  c.strokeStyle = "rgba(120,90,50,0.3)"; c.lineWidth = 0.6;
  for (let z = 0.3; z < gh; z += 0.3) { c.beginPath(); c.moveTo(...W.pt(a0, z)); c.lineTo(...W.pt(a1, z)); c.stroke(); }
  for (let i = 0; i < n; i++) {
    const ac = a0 + (i + 0.5) * w, hw = w * 0.36, zs = gh - hw * 1.0 - 0.1, z0 = 0.12, r = hash(seed * 7 + i * 3.1);
    const frame = archShape(W, ac, hw + 0.1, z0 - 0.02, zs, 0.04, 1);
    fp(c, frame, W.tone(TRIM, 0.06), "rgba(42,36,32,0.85)", 1.0);
    const glass = archShape(W, ac, hw, z0, zs, 0.05, 1);
    const g = c.createLinearGradient(0, W.pt(ac, zs + hw)[1], 0, W.pt(ac, z0)[1]); g.addColorStop(0, "#ffe7a2"); g.addColorStop(1, "#f0aa52");
    fp(c, glass, g, INK, 1.0);
    c.save(); c.beginPath(); glass.forEach((p, j) => (j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.clip();
    c.globalAlpha = 0.55 + 0.25 * Math.sin(t * 2 + i * 1.9 + seed);
    c.fillStyle = "#fff2c4"; c.beginPath(); c.arc(...W.pt(ac, zs - 0.2, 0.05), 11, 0, 7); c.fill(); c.globalAlpha = 1;
    // shelves + mannequins
    const cols = ["#d9544b", "#3e6fa8", "#e9c24d", "#5f9d6d", "#e581a2", "#7b5fa8", "#f2efe6"];
    const nm = w > 0.8 ? 3 : 2;
    for (let j = 0; j < nm; j++) {
      const aa = ac + (j - (nm - 1) / 2) * (hw * 1.2 / (nm - 1 || 1)) * (nm > 1 ? 1 : 0), [x, y] = W.pt(aa, z0 + 0.02, 0.05), cc = cols[Math.floor(hash(seed * 13 + i * 5 + j) * 7)];
      fp(c, [[x - 1.2, y - 12], [x + 1.2, y - 12], [x + 3.6, y - 1], [x - 3.6, y - 1]], cc, "rgba(42,36,32,0.6)", 0.5);
      c.fillStyle = "#f3d9bd"; c.beginPath(); c.arc(x, y - 14.5, 2, 0, 7); c.fill();
      ln(c, [x, y - 1], [x, y + 1.5], "rgba(42,36,32,0.6)", 0.6);
    }
    ln(c, W.pt(ac - hw, z0 + 0.5, 0.05), W.pt(ac + hw, z0 + 0.5, 0.05), "rgba(120,70,20,0.6)", 0.8);
    ln(c, W.pt(ac, z0, 0.05), W.pt(ac, zs + hw), "rgba(110,60,20,0.7)", 0.8);
    c.restore();
    // keystone
    const [kx, ky] = W.pt(ac, zs + hw + 0.08, 0.06); fp(c, [[kx - 2.4, ky + 4], [kx + 2.4, ky + 4], [kx + 1.6, ky - 4], [kx - 1.6, ky - 4]], W.tone(STONE_D), "rgba(42,36,32,0.7)", 0.5);
    if (o.awn && o.awn(i)) awning(c, W, ac - hw - 0.1, ac + hw + 0.1, zs + hw * 0.55 + 0.1, 0.42, 0.55, o.awnCol ? o.awnCol(i) : "#c9322b");
  }
}
export function awning(c, W, a0, a1, zt, drop, out, col1) {
  const ns = Math.max(4, Math.round((a1 - a0) / 0.09)), c2 = "#f6efe0";
  for (let s = 0; s < ns; s++) {
    const aa = lerp(a0, a1, s / ns), bb = lerp(a0, a1, (s + 1) / ns);
    fp(c, [W.pt(aa, zt, 0.02), W.pt(bb, zt, 0.02), W.pt(bb, zt - drop, out), W.pt(aa, zt - drop, out)], s % 2 ? shade(c2, -0.06) : shade(col1, -0.02), "rgba(42,36,32,0.75)", 0.7);
    fp(c, [W.pt(aa, zt - drop, out), W.pt(bb, zt - drop, out), W.pt((aa + bb) / 2, zt - drop - 0.1, out)], s % 2 ? c2 : col1, "rgba(42,36,32,0.7)", 0.5);
  }
  fp(c, [W.pt(a0, zt - drop, out), W.pt(a1, zt - drop, out), W.pt(a1, zt - drop - 0.14, out + 0.02), W.pt(a0, zt - drop - 0.14, out + 0.02)].slice(0, 0), null);
}

// complete department-store wall: arcade, string course, pilastered upper floors, cornice, balustrade
export function storeWall(c, W, o) {
  const { H, g = 2.0, bw = 0.95, t } = o, a0 = o.a0 ?? 0, a1 = o.a1 ?? W.len, seed = o.seed ?? 1;
  const corn = 0.5, bal = 0.5, rows = o.rows ?? 3;
  const body = H - corn - bal;
  wallBlock(c, W, 0, H, o.col || STONE);
  fp(c, quad(W, a0, a1, 0, g, 0.02), W.tone(o.baseCol || "#dcc58f"), null);
  // upper wall tint panels
  arcade(c, W, { a0, a1, gh: g, bw, t, seed, awn: o.awn, awnCol: o.awnCol });
  course(c, W, a0 - 0.04, a1 + 0.04, g, 0.2, 0.2, TRIM);
  course(c, W, a0 - 0.04, a1 + 0.04, g + 0.2, 0.06, 0.24, STONE);
  const n = Math.max(2, Math.round((a1 - a0) / bw)), w = (a1 - a0) / n, rowH = (body - g - 0.3) / rows;
  // spandrel panels between floors
  for (let r = 0; r < rows; r++) for (let i = 0; i < n; i++) {
    const ac = a0 + (i + 0.5) * w, z0 = g + 0.4 + r * rowH;
    windowBay(c, W, ac, w * 0.44, z0 + 0.1, rowH * 0.64, { arch: r === 0 || r === rows - 1 ? true : (o.archAll ?? false), balcony: r === 0 && o.balcony !== false, flowers: r === 0 && hash(seed + i) < 0.55, lit: o.lit ?? 0.16, seed: seed * 11 + r * 5 + i, pediment: r === 1 });
    if (r < rows - 1) fp(c, quad(W, ac - w * 0.3, ac + w * 0.3, z0 + rowH * 0.8, z0 + rowH * 0.96, 0.03), W.tone("#d6bd86"), "rgba(42,36,32,0.35)", 0.5);
  }
  for (let i = 0; i <= n; i++) { const ac = a0 + i * w; if (i === 0 || i === n) pilaster(c, W, clamp(ac, a0 + 0.1, a1 - 0.1), 0.2, g + 0.26, body - 0.05, TRIM); else pilaster(c, W, ac, 0.14, g + 0.26, body - 0.05, TRIM); }
  course(c, W, a0 - 0.04, a1 + 0.04, body - 0.05, 0.1, 0.16, TRIM);
  cornice(c, W, body + 0.02, { a0, a1, h: corn });
  balustrade(c, W, H - bal + 0.05, bal * 0.92, { a0, a1 });
}

// ---------- roofs ----------
export function slateRoof(k, u, v, du, dv, z, h, inset, col = SLATE, o = {}) {
  const c = k.ctx, i = inset;
  const faces = [
    { pts: [[u, v + dv, z], [u + du, v + dv, z], [u + du - i, v + dv - i, z + h], [u + i, v + dv - i, z + h]], col: shade(col, 0.02) },
    { pts: [[u + du, v, z], [u + du, v + dv, z], [u + du - i, v + dv - i, z + h], [u + du - i, v + i, z + h]], col: shade(col, -0.2) },
  ];
  for (const f of faces) {
    const [A, B, C, D] = f.pts; fp(c, f.pts.map((p) => P(...p)), f.col, INK, 1.4);
    const bil = (s, q) => { const l = [lerp(A[0], D[0], s), lerp(A[1], D[1], s), lerp(A[2], D[2], s)], r = [lerp(B[0], C[0], s), lerp(B[1], C[1], s), lerp(B[2], C[2], s)]; return P(lerp(l[0], r[0], q), lerp(l[1], r[1], q), lerp(l[2], r[2], q)); };
    const nc = o.courses ?? 7;
    c.strokeStyle = "rgba(25,35,60,0.45)"; c.lineWidth = 0.6; c.beginPath();
    for (let s = 1; s < nc; s++) { const a = bil(s / nc, 0), b = bil(s / nc, 1); c.moveTo(...a); c.lineTo(...b); }
    c.stroke();
    c.strokeStyle = "rgba(25,35,60,0.28)"; c.lineWidth = 0.5; c.beginPath();
    const len = Math.hypot(f.pts[1][0] - f.pts[0][0], f.pts[1][1] - f.pts[0][1]), nt = Math.max(4, Math.round(len / 0.16));
    for (let s = 0; s < nc; s++) for (let q = 0; q <= nt; q++) { const qq = (q + (s % 2) * 0.5) / nt; if (qq > 1) continue; c.moveTo(...bil(s / nc, qq)); c.lineTo(...bil((s + 1) / nc, qq)); }
    c.stroke();
    c.strokeStyle = "rgba(255,255,255,0.22)"; c.lineWidth = 1; c.beginPath(); c.moveTo(...bil(0.02, 0)); c.lineTo(...bil(0.02, 1)); c.stroke();
    // eave shadow rim
    c.strokeStyle = "rgba(30,25,40,0.5)"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(...bil(0, 0)); c.lineTo(...bil(0, 1)); c.stroke();
  }
  const T = [[u + i, v + i, z + h], [u + du - i, v + i, z + h], [u + du - i, v + dv - i, z + h], [u + i, v + dv - i, z + h]];
  if (i < Math.min(du, dv) / 2 - 0.02) fp(c, T.map((p) => P(...p)), o.top || "#7a89a3", INK, 1.1);
}
// dormer on a slate face. face 'L' sits on the v+dv slope (runs along u), 'R' on the u+du slope (runs along v)
export function dormer(k, face, u, v, du, dv, z, h, inset, along, lit) {
  const c = k.ctx, f = 0.34, ww = 0.34, dd = 0.3, hh = 0.5;
  if (face === "L") {
    const vv = v + dv - inset * f - dd + 0.04, zz = z + h * f - 0.04, uu = u + along - ww / 2;
    k.box(uu, vv, zz, ww, dd, hh, "#ead7a8", { hatch: false, shadow: false, left: "#f2e3b8", right: "#cdb07a", top: "#e0cc98" });
    fp(c, [[uu + 0.07, vv + dd, zz + 0.07, 0], [uu + ww - 0.07, vv + dd, zz + 0.07], [uu + ww - 0.07, vv + dd, zz + hh - 0.14], [uu + 0.07, vv + dd, zz + hh - 0.14]].map((p) => P(p[0], p[1], p[2])), lit ? "#f6d57e" : "#6a84a5", INK, 0.8);
    ln(c, P(uu + ww / 2, vv + dd, zz + 0.07), P(uu + ww / 2, vv + dd, zz + hh - 0.14), "rgba(42,36,32,0.75)", 0.7);
    k.gable(uu - 0.04, vv - 0.02, zz + hh, ww + 0.08, dd + 0.08, 0.3, "#51658c", { ridge: "v" });
  } else {
    const uu = u + du - inset * f - dd + 0.04, zz = z + h * f - 0.04, vv = v + along - ww / 2;
    k.box(uu, vv, zz, dd, ww, hh, "#d9c28c", { hatch: false, shadow: false, left: "#ead7a8", right: "#c0a470", top: "#e0cc98" });
    fp(c, [[uu + dd, vv + 0.07, zz + 0.07], [uu + dd, vv + ww - 0.07, zz + 0.07], [uu + dd, vv + ww - 0.07, zz + hh - 0.14], [uu + dd, vv + 0.07, zz + hh - 0.14]].map((p) => P(p[0], p[1], p[2])), lit ? "#f6d57e" : "#5f7897", INK, 0.8);
    ln(c, P(uu + dd, vv + ww / 2, zz + 0.07), P(uu + dd, vv + ww / 2, zz + hh - 0.14), "rgba(42,36,32,0.75)", 0.7);
    k.gable(uu - 0.02, vv - 0.04, zz + hh, dd + 0.08, ww + 0.08, 0.3, "#46587c", { ridge: "u" });
  }
}
export function chimney(k, u, v, z, w = 0.34, h = 0.9) {
  k.box(u, v, z, w, w, h, "#d8c08c", { hatch: false, shadow: false, left: "#e6d2a2", right: "#b99c66", top: "#cdb27c" });
  k.box(u - 0.04, v - 0.04, z + h, w + 0.08, w + 0.08, 0.1, "#ead9ae", { hatch: false, shadow: false });
  k.box(u + 0.06, v + 0.06, z + h + 0.1, w - 0.12, w - 0.12, 0.07, "#4a4040", { hatch: false, shadow: false });
}

// ---------- clock + dome ----------
export function clockDisk(c, x, y, r, t, ph) {
  c.save();
  c.fillStyle = "#e9d8a6"; c.strokeStyle = INK; c.lineWidth = 1.1; c.beginPath(); c.arc(x, y, r + 3.4, 0, 7); c.fill(); c.stroke();
  c.strokeStyle = GOLD; c.lineWidth = 1.6; c.beginPath(); c.arc(x, y, r + 1.6, 0, 7); c.stroke();
  c.fillStyle = "#f8f3e2"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.stroke();
  c.lineWidth = 0.9;
  for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.2832; c.beginPath(); c.moveTo(x + Math.sin(a) * r * 0.76, y - Math.cos(a) * r * 0.76); c.lineTo(x + Math.sin(a) * r * 0.92, y - Math.cos(a) * r * 0.92); c.stroke(); }
  const m = t * 0.6 + ph, h = t * 0.05 + ph; c.lineCap = "round";
  c.lineWidth = 1.3; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(m) * r * 0.8, y - Math.cos(m) * r * 0.8); c.stroke();
  c.lineWidth = 1.9; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(h) * r * 0.5, y - Math.cos(h) * r * 0.5); c.stroke();
  c.fillStyle = INK; c.beginPath(); c.arc(x, y, 1.3, 0, 7); c.fill();
  c.restore();
}
// clock drum + ribbed slate dome + lantern + finial, centred on (cu,cv) standing on z0
export function clockDome(k, cu, cv, z0, o = {}) {
  const c = k.ctx, t = k.t, r = o.r ?? 0.85, dh = o.drumH ?? 1.5, domeH = o.domeH ?? 1.6;
  const [x0, y0] = P(cu, cv, z0), rx = r * 45 * Math.SQRT2, ry = rx * 0.577, zpx = 42.3;
  // plinth
  k.cyl(cu, cv, z0, r * 1.1, 0.22, "#ecdcb0");
  k.cyl(cu, cv, z0 + 0.22, r, dh - 0.22, "#e6d3a2");
  // drum windows + pilasters
  for (const a of [-1.05, -0.55, 0.55, 1.05]) {
    const wx = x0 + rx * Math.sin(a), wy = y0 + ry * Math.cos(a), cw = Math.cos(a);
    const wh = 22, ww = 5.2 * cw + 1.6, yb = wy - 0.6 * zpx;
    fp(c, [[wx - ww, yb], [wx + ww, yb], [wx + ww, yb - wh + 5], [wx, yb - wh], [wx - ww, yb - wh + 5]], "#5f7897", INK, 0.8);
    c.strokeStyle = TRIM; c.lineWidth = 1; c.beginPath(); c.moveTo(wx - ww - 1.4, yb); c.lineTo(wx - ww - 1.4, yb - wh + 5); c.lineTo(wx, yb - wh - 1.4); c.lineTo(wx + ww + 1.4, yb - wh + 5); c.lineTo(wx + ww + 1.4, yb); c.stroke();
  }
  for (const a of [-1.3, -0.8, 0, 0.8, 1.3]) { const px = x0 + rx * Math.sin(a), py = y0 + ry * Math.cos(a); c.strokeStyle = "rgba(255,248,220,0.55)"; c.lineWidth = 2.2; c.beginPath(); c.moveTo(px, py - 0.25 * zpx); c.lineTo(px, py - (dh - 0.08) * zpx); c.stroke(); }
  if (o.clock !== false) { const [cx, cy] = [x0, y0 + ry - 0.62 * zpx]; clockDisk(c, cx, cy + 4, 20, t, o.ph ?? 0); }
  // cornice ring
  c.strokeStyle = INK; c.fillStyle = "#f2e5bd"; c.lineWidth = 1; c.beginPath(); c.ellipse(x0, y0 - dh * zpx, rx * 1.08, ry * 1.08, 0, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.ellipse(x0, y0 - dh * zpx - 3, rx * 1.02, ry * 1.02, 0, 0, 7); c.fillStyle = "#e0c98e"; c.fill(); c.stroke();
  // dome
  const zd = z0 + dh + 0.06;
  k.dome(cu, cv, zd, r * 0.98, domeH, "#566f9a", { ribs: 8 });
  const [dx, dy] = P(cu, cv, zd);
  for (const [a, f] of [[-0.9, 0.34], [0, 0.34], [0.9, 0.34]]) {
    const lx = dx + rx * 0.95 * Math.sin(a) * 0.93, ly = dy - domeH * zpx * f + ry * Math.cos(a) * 0.7 - 2, cw = Math.cos(a);
    c.fillStyle = "#e6d3a2"; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.ellipse(lx, ly, 6 * cw + 1, 7.5, 0, 0, 7); c.fill(); c.stroke();
    c.fillStyle = "#4c6385"; c.beginPath(); c.ellipse(lx, ly + 0.5, 3.6 * cw + 0.6, 5, 0, 0, 7); c.fill();
    c.fillStyle = "#e6d3a2"; c.beginPath(); c.moveTo(lx - 7 * cw - 1, ly - 5); c.lineTo(lx, ly - 12); c.lineTo(lx + 7 * cw + 1, ly - 5); c.closePath(); c.fill(); c.stroke();
  }
  // lantern
  const zl = zd + domeH - 0.04;
  k.cyl(cu, cv, zl, r * 0.26, 0.5, "#e9d6a6");
  const [lx, ly] = P(cu, cv, zl + 0.28); c.fillStyle = "#4d6290"; c.strokeStyle = INK; c.lineWidth = 0.7; c.fillRect(lx - 2, ly - 6, 4, 9); c.strokeRect(lx - 2, ly - 6, 4, 9);
  k.cone(cu, cv, zl + 0.5, r * 0.3, 0.55, "#566f9a");
  const [fx, fy] = P(cu, cv, zl + 1.05), [, fy2] = P(cu, cv, zl + 1.65);
  c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx, fy2); c.stroke(); c.strokeStyle = GOLD; c.lineWidth = 0.9; c.stroke();
  c.fillStyle = GOLD; c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.arc(fx, fy - 6, 2.4, 0, 7); c.fill(); c.stroke();
}

// ---------- neon banner (blade sign) ----------
export function bladeSign(k, x, y, w, h, kind, chars, cols, ph, topZ = 0) {
  const c = k.ctx, t = k.t, n = chars.length;
  c.save();
  // hanging rods
  c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - w * 0.25, y - h / 2); c.lineTo(x - w * 0.25, y - h / 2 - 6); c.moveTo(x + w * 0.25, y - h / 2); c.lineTo(x + w * 0.25, y - h / 2 - 6); c.stroke();
  // board
  c.fillStyle = "#245a5e"; c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.roundRect(x - w / 2, y - h / 2, w, h, w * 0.46); c.fill(); c.stroke();
  c.strokeStyle = GOLD; c.lineWidth = 2.4; c.beginPath(); c.roundRect(x - w / 2 + 2, y - h / 2 + 2, w - 4, h - 4, w * 0.4); c.stroke();
  c.strokeStyle = INK; c.lineWidth = 0.6; c.stroke();
  const cellH = (h - 14) / n;
  chars.split("").forEach((ch, i) => {
    const cy = y - h / 2 + 8 + (i + 0.5) * cellH, col = cols[i % cols.length];
    const on = Math.sin(t * 3.2 - i * 1.15 + ph) > -0.25 ? 1 : 0.28;
    const rr = Math.min(w * 0.36, cellH * 0.46);
    c.save(); c.shadowColor = col; c.shadowBlur = 9 * on; c.fillStyle = col; c.globalAlpha = 0.35 + 0.65 * on;
    c.beginPath();
    if (kind === "tri") { c.arc(x, cy, rr, 0, 7); }
    else if (i % 2 === 0) { c.arc(x, cy, rr, 0, 7); } else { c.moveTo(x, cy - rr * 1.12); c.lineTo(x + rr * 0.95, cy); c.lineTo(x, cy + rr * 1.12); c.lineTo(x - rr * 0.95, cy); c.closePath(); }
    c.fill(); c.restore();
    c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); if (kind === "tri" || i % 2 === 0) c.arc(x, cy, rr, 0, 7); else { c.moveTo(x, cy - rr * 1.12); c.lineTo(x + rr * 0.95, cy); c.lineTo(x, cy + rr * 1.12); c.lineTo(x - rr * 0.95, cy); c.closePath(); } c.stroke();
    c.fillStyle = on > 0.5 ? "#fff6d8" : "#5a3a30"; c.font = `bold ${Math.round(rr * 1.25)}px "PingFang SC","STHeiti",sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(ch, x, cy + 0.6);
  });
  c.restore();
}
export function zigSign(k, x, y, w, h, chars, ph) {
  const c = k.ctx, t = k.t, n = chars.length;
  c.save();
  c.fillStyle = "#e9c24d"; c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.roundRect(x - w / 2, y - h / 2, w, h, w * 0.44); c.fill(); c.stroke();
  c.save(); c.beginPath(); c.roundRect(x - w / 2 + 2.5, y - h / 2 + 2.5, w - 5, h - 5, w * 0.38); c.clip();
  const sh = 15; for (let yy = y - h / 2; yy < y + h / 2 + sh; yy += sh) { c.fillStyle = "#c7332b"; c.beginPath(); c.moveTo(x - w / 2, yy); c.lineTo(x, yy + sh * 0.5); c.lineTo(x + w / 2, yy); c.lineTo(x + w / 2, yy + sh * 0.5); c.lineTo(x, yy + sh); c.lineTo(x - w / 2, yy + sh * 0.5); c.closePath(); c.fill(); }
  c.restore();
  c.strokeStyle = "#7a5a1a"; c.lineWidth = 1.4; c.beginPath(); c.roundRect(x - w / 2, y - h / 2, w, h, w * 0.44); c.stroke();
  const cellH = (h - 16) / n;
  chars.split("").forEach((ch, i) => {
    const cy = y - h / 2 + 8 + (i + 0.5) * cellH, on = Math.sin(t * 2.6 - i * 1.3 + ph) > -0.2 ? 1 : 0.3;
    c.save(); c.shadowColor = "#fff0a0"; c.shadowBlur = 8 * on; c.fillStyle = on > 0.5 ? "#fff3b8" : "#6a2d22"; c.strokeStyle = INK; c.lineWidth = 2.4;
    c.font = `bold ${Math.round(w * 0.5)}px "PingFang SC","STHeiti",sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.strokeText(ch, x, cy + 0.6); c.fillText(ch, x, cy + 0.6); c.restore();
  });
  c.restore();
}

// ---------- Art-deco tower: stepped setbacks with vertical glazing bands, fan-shell niche, spire ----------
export function decoTower(k, u, v, du, dv, t) {
  const c = k.ctx;
  const lv = [[0, 4.0, 0, 0], [4.0, 5.8, 0.25, 0.25], [5.8, 7.0, 0.5, 0.5], [7.0, 7.8, 0.72, 0.72]];
  lv.forEach(([z0, z1, ins], li) => {
    const uu = u + ins, vv = v + ins, w = du - ins * 2, d = dv - ins * 2;
    k.box(uu, vv, z0, w, d, z1 - z0, "#e6d2a0", { hatch: false, shadow: li === 0, left: "#efdcae", right: "#bf9f6a", top: "#e9d9ae" });
    // left face (v+d) runs along u, right face (u+w) along v
    for (const side of ["L", "R"]) {
      const W = side === "L" ? makeWall([uu, vv + d], [uu + w, vv + d], [0, 1]) : makeWall([uu + w, vv], [uu + w, vv + d], [1, 0]);
      const nb = Math.max(2, Math.round(W.len / 0.36)), bw = (W.len - 0.3) / nb;
      for (let i = 0; i < nb; i++) {
        const a = 0.15 + i * bw, grp = Math.floor(i / 2);
        for (let z = z0 + 0.25; z < z1 - 0.35; z += 0.62) {
          const lit = hash(li * 31 + i * 7 + z * 3 + (side === "L" ? 1 : 5)) < 0.14;
          fp(c, quad(W, a + 0.06, a + bw - 0.06, z, z + 0.42, 0.01), lit ? "#f4d27a" : W.tone("#5f7a96", -0.04), "rgba(42,36,32,0.8)", 0.6);
          ln(c, W.pt(a + bw / 2, z, 0.01), W.pt(a + bw / 2, z + 0.42, 0.01), "rgba(42,36,32,0.6)", 0.5);
          fp(c, quad(W, a + 0.03, a + bw - 0.03, z + 0.42, z + 0.5, 0.03), W.tone("#d3b980"), null);
        }
        // piers every second bay
        if (i % 2 === 0) fp(c, quad(W, a - 0.02, a + 0.05, z0 + 0.05, z1 - 0.05, 0.05), W.tone(TRIM, 0.05), "rgba(42,36,32,0.5)", 0.4);
      }
      course(c, W, 0, W.len, z1 - 0.12, 0.12, 0.14, TRIM);
    }
  });
  // fan shell niche on the second setback's front (left face)
  const ins = 0.28, W = makeWall([u + ins, v + dv - ins], [u + du - ins, v + dv - ins], [0, 1]), ac = W.len * 0.5, zc = 4.9;
  fp(c, archShape(W, ac, 0.55, zc - 0.7, zc, 0.04, 1.1), "#f0dca4", INK, 1);
  for (let i = 0; i <= 14; i++) { const th = Math.PI * (i / 14), p = W.pt(ac + 0.5 * Math.cos(th), zc + 0.5 * 1.1 * Math.sin(th) * 0.9, 0.05); c.strokeStyle = i % 2 ? "rgba(150,100,30,0.7)" : "rgba(255,248,210,0.9)"; c.lineWidth = 1.1; c.beginPath(); c.moveTo(...W.pt(ac, zc - 0.05, 0.05)); c.lineTo(...p); c.stroke(); }
  const [sx, sy] = P(u + du / 2, v + dv / 2, 7.8);
  k.box(u + du / 2 - 0.2, v + dv / 2 - 0.2, 7.8, 0.4, 0.4, 0.4, "#e9d8aa", { hatch: false, shadow: false });
  k.box(u + du / 2 - 0.12, v + dv / 2 - 0.12, 8.2, 0.24, 0.24, 0.3, "#f0e0b6", { hatch: false, shadow: false });
  const [, ey] = P(u + du / 2, v + dv / 2, 9.4); c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(sx, P(u + du / 2, v + dv / 2, 8.5)[1]); c.lineTo(sx, ey); c.stroke(); c.strokeStyle = GOLD; c.lineWidth = 0.9; c.stroke();
  // rooftop plant/tank on the right shoulder
  k.box(u + du - 0.5, v + 0.3, 5.8, 0.5, 0.5, 0.4, "#6a7280", { hatch: false, shadow: false });
}
