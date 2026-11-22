// Hyde Park tile helpers (copied/rewritten for tile 0,1 only): oak, bandstand with brass band, rowing boat, swan loop, readers.
import { P, CTS, INK, shade, lerp, clamp, rng } from "../../lib/vec-kit.js";

// reference canonical pixel -> ground (u,v), exact inverse of P at z=0
export const IP = (x, y) => { const H = [0.0083270541109782, 0.010761865254539081, -7.97181516513267, -0.008364904356937193, 0.010761865254539078, 0.45762386116460546, -3.785024595899337e-06, -0.0003785794496656037, 1.0], w = H[6] * x + H[7] * y + H[8]; return [(H[0] * x + H[1] * y + H[2]) / w, (H[3] * x + H[4] * y + H[5]) / w]; };
export const IPS = (pts) => pts.map(([x, y]) => IP(x, y));

export function inPoly(poly, u, v) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > v) !== (yj > v) && u < ((xj - xi) * (v - yi)) / (yj - yi) + xi) c = !c; } return c; }
export function distEdge(poly, u, v) { let m = 1e9; for (let i = 0; i < poly.length; i++) { const [a, b] = poly[i], [c, d] = poly[(i + 1) % poly.length]; const dx = c - a, dy = d - b, L = dx * dx + dy * dy || 1, t = clamp(((u - a) * dx + (v - b) * dy) / L, 0, 1); m = Math.min(m, Math.hypot(u - (a + dx * t), v - (b + dy * t))); } return m; }

// closed loop route: ellipse centred (cu,cv), semi axes a,b, rotation rot, returns pos + heading at time t
export function loopRoute(cu, cv, a, b, rot, speed, phase, t) {
  const w = speed, ph = t * w + phase, ca = Math.cos(rot), sa = Math.sin(rot);
  const ex = a * Math.cos(ph), ey = b * Math.sin(ph), dx = -a * Math.sin(ph) * w, dy = b * Math.cos(ph) * w;
  return { u: cu + ex * ca - ey * sa, v: cv + ex * sa + ey * ca, du: dx * ca - dy * sa, dv: dx * sa + dy * ca, ang: Math.atan2(dx * sa + dy * ca, dx * ca - dy * sa), spd: Math.hypot(dx, dy) };
}

// ---------------------------------------------------------------- oak
function limb(c, pts, w0, w1, ink, fill) {
  for (const pass of [0, 1]) {
    for (let i = 0; i < pts.length - 1; i++) {
      const f = i / (pts.length - 1), w = lerp(w0, w1, f);
      c.strokeStyle = pass ? fill : ink; c.lineWidth = pass ? w : w + 2.6; c.lineCap = "round";
      c.beginPath(); c.moveTo(...pts[i]); c.lineTo(...pts[i + 1]); c.stroke();
    }
  }
}
function leafBlob(c, x, y, r, rnd) {
  c.beginPath();
  const n = 10, j = rnd() * 6;
  for (let i = 0; i < n; i++) { const a = j + (i / n) * Math.PI * 2, rr = r * (0.3 + (i % 3) * 0.04), px = x + Math.cos(a) * r * 0.7, py = y + Math.sin(a) * r * 0.58; c.moveTo(px + rr, py); c.arc(px, py, rr, 0, 6.3); }
  c.moveTo(x + r * 0.7, y); c.arc(x, y, r * 0.7, 0, 6.3);
}
// o: H trunk height px, cx,cy canopy centre rel. base, rx,ry, n clusters, col, sparse (0..1), tw trunk width
export function oak(k, u, v, o) {
  const c = k.ctx, t = k.t, [bx, by] = P(u, v, 0);
  const { H = 60, cx = 0, cy = -100, rx = 100, ry = 70, n = 70, col = "#a4b95a", seed = 1, sparse = 0, tw = 13, leaf = 0.17 } = o;
  const R = rng(seed * 97 + 3);
  P(u, v, -cy / (CTS.S * CTS.ZS)); // canopy centre projected at its real height (anchor for the leaf clusters)
  k.ell(u + 0.15, v + 0.1, 0, rx / 135, "rgba(60,50,30,0.16)", { stroke: false });
  // clusters
  const cl = [];
  const step = rx * leaf * 1.45;
  let gi = 0;
  for (let gy = -ry; gy <= ry; gy += step * 0.85) for (let gx = -rx; gx <= rx; gx += step) {
    const row = Math.round(gy / (step * 0.85)), x0 = gx + (row % 2 ? step * 0.5 : 0) + (R() - 0.5) * step * 0.7, y0 = gy + (R() - 0.5) * step * 0.6;
    const nx = x0 / rx, ny = y0 / ry, d = nx * nx + ny * ny * (ny > 0 ? 1.25 : 1);
    if (d > 1.02) continue;
    if (sparse && d > 0.35 && R() < sparse * 0.45) continue;
    cl.push({ x: cx + x0, y: cy + y0, r: rx * leaf * (0.85 + R() * 0.5), i: gi++, ph: R() * 6 });
  }
  cl.sort((p, q) => p.y - q.y);
  const sw = (p) => Math.sin(t * 1.1 + seed + p.ph) * 1.1 * (1 - (p.y - cy) / ry * 0.4) + Math.sin(t * 2.3 + p.ph * 2) * 0.35;
  // trunk
  const fy = by - H, ink = INK, bark = "#8a6646";
  c.fillStyle = bark; c.strokeStyle = ink; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(bx - tw * 1.35, by + 2); c.quadraticCurveTo(bx - tw * 0.55, by - 6, bx - tw * 0.5, by - H * 0.5); c.lineTo(bx - tw * 0.38, fy); c.lineTo(bx + tw * 0.4, fy); c.lineTo(bx + tw * 0.55, by - H * 0.5); c.quadraticCurveTo(bx + tw * 0.6, by - 6, bx + tw * 1.4, by + 2); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = "rgba(60,38,22,0.4)"; c.beginPath(); c.moveTo(bx + tw * 0.1, by); c.lineTo(bx + tw * 0.2, fy); c.lineTo(bx + tw * 0.4, fy); c.lineTo(bx + tw * 0.55, by - H * 0.5); c.quadraticCurveTo(bx + tw * 0.6, by - 6, bx + tw * 1.4, by + 2); c.closePath(); c.fill();
  c.strokeStyle = "rgba(50,30,18,0.7)"; c.lineWidth = 0.9; for (let i = 0; i < 6; i++) { const yy = by - 4 - i * (H / 6.5); c.beginPath(); c.moveTo(bx - tw * 0.4 + (i % 2) * 3, yy); c.lineTo(bx - tw * 0.2 + (i % 2) * 3, yy - 5); c.stroke(); }
  const ell = () => { c.beginPath(); c.ellipse(bx + cx, by + cy, rx * 0.82, ry * 0.8, 0, 0, 6.3); };
  c.fillStyle = shade(col, -0.38); c.strokeStyle = ink; c.lineWidth = 2.6; ell(); c.stroke(); ell(); c.fill();
  // silhouette pass (ink) of every cluster
  c.save(); c.strokeStyle = ink; c.lineWidth = 2.6; const rS = rng(seed + 11);
  for (const p of cl) { const x = bx + p.x + sw(p), y = by + p.y; leafBlob(c, x, y, p.r * 1.04, rS); c.stroke(); }
  c.restore();
  const limbs = () => {
    const nb = sparse > 0.3 ? 7 : 5;
    for (let i = 0; i < nb; i++) {
      const fx = (i / (nb - 1) - 0.5) * 2, tx = bx + cx + fx * rx * 0.8, ty = by + cy + (R() * 0.5 - 0.1) * ry - ry * 0.2 * (1 - Math.abs(fx));
      const pts = []; for (let s = 0; s <= 6; s++) { const f = s / 6; pts.push([lerp(bx + fx * 3, tx, f) + Math.sin(f * 3 + i) * 6 * f, lerp(fy, ty, Math.pow(f, 0.85))]); }
      limb(c, pts, tw * 0.55 * (1 - Math.abs(fx) * 0.3), 1.6, ink, bark);
      const m = pts[4]; limb(c, [m, [m[0] + fx * 14, m[1] - 10], [m[0] + fx * 24, m[1] - 14]], 2.4, 1, ink, bark);
    }
  };
  const light = (p) => clamp(0.5 - (p.x - rx * 0.1) / rx * 0.35 - (p.y - cy) / ry * 0.45, 0, 1);
  const rF = rng(seed + 29);
  // dark inner mass first so gaps read as shade, then limbs, then leaf puffs
  for (const p of cl) { const x = bx + p.x + sw(p), y = by + p.y; c.fillStyle = shade(col, -0.38); leafBlob(c, x, y, p.r * 1.02, rF); c.fill(); }
  limbs();
  const drewLimbs = true;
  for (const p of cl) {
    const x = bx + p.x + sw(p), y = by + p.y, L = light(p);
    c.fillStyle = shade(col, -0.22 - (1 - L) * 0.1); leafBlob(c, x + p.r * 0.05, y + p.r * 0.1, p.r * 0.95, rF); c.fill();
    c.fillStyle = shade(col, 0.0 + L * 0.1); leafBlob(c, x - p.r * 0.14, y - p.r * 0.16, p.r * 0.74, rF); c.fill();
    c.fillStyle = shade(col, 0.2 + L * 0.14); leafBlob(c, x - p.r * 0.25, y - p.r * 0.3, p.r * 0.4, rF); c.fill();
    c.strokeStyle = shade(col, -0.5); c.lineWidth = 0.8;
    for (let q = 0; q < 3; q++) { const a = 0.4 + rF() * 5, d = p.r * (0.2 + rF() * 0.4), rr = 1.4 + rF() * 1.4; c.beginPath(); c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, rr, a, a + 2.3); c.stroke(); }
  }
  if (!drewLimbs) limbs();
}

// ---------------------------------------------------------------- bandstand
const OCT = (u, v, r, z, off = 22.5) => { const a = []; for (let i = 0; i < 8; i++) { const th = ((off + i * 45) * Math.PI) / 180; a.push([u + Math.cos(th) * r, v + Math.sin(th) * r, z]); } return a; };
function bandsman(c, x, y, o, t) {
  // seated brass player, front view, ~30px tall. x,y = seat point on deck
  const { red = "#b3392f", kind = "cornet", ph = 0, face = "#e0ac84" } = o;
  const bob = Math.sin(t * 5 + ph) * 0.5;
  c.save(); c.translate(x, y); c.scale(1.12, 1.12); c.translate(-x, -y);
  c.lineJoin = "round"; c.lineCap = "round";
  // chair + legs
  c.fillStyle = "#3a3236"; c.strokeStyle = INK; c.lineWidth = 0.9;
  c.beginPath(); c.roundRect(x - 4.5, y - 7, 9, 7, 1.5); c.fill(); c.stroke();
  c.fillStyle = "#26242f"; c.beginPath(); c.roundRect(x - 4.8, y - 11.5, 9.6, 4.2, 1.5); c.fill(); c.stroke();
  // torso
  c.fillStyle = red; c.beginPath(); c.roundRect(x - 4.6, y - 21 + bob, 9.2, 11, 2.2); c.fill(); c.stroke();
  c.fillStyle = "#e9c04a"; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(x, y - 19.5 + bob + i * 3, 0.7, 0, 7); c.fill(); }
  c.fillStyle = "#f3eee0"; c.fillRect(x - 4.4, y - 21 + bob, 8.8, 1.2);
  // head + pith helmet
  c.fillStyle = face; c.beginPath(); c.arc(x, y - 25 + bob, 3.5, 0, 7); c.fill(); c.stroke();
  c.fillStyle = "#f4efe3"; c.beginPath(); c.ellipse(x, y - 27.2 + bob, 4.6, 2.5, 0, Math.PI, 0); c.fill(); c.stroke();
  c.fillRect(x - 5, y - 27.4 + bob, 10, 1.2); c.strokeRect(x - 5, y - 27.4 + bob, 10, 1.2);
  const mx = x + 1, my = y - 24 + bob; // mouth
  const brass = "#e6bb44", dk = "#a97a1c";
  const stroke = (w) => { c.strokeStyle = INK; c.lineWidth = w + 1.5; return c; };
  if (kind === "tuba") {
    c.fillStyle = brass; c.strokeStyle = INK; c.lineWidth = 1;
    c.beginPath(); c.ellipse(x + 1, y - 20, 4, 6.5, 0, 0, 7); c.fill(); c.stroke();           // coil body
    c.beginPath(); c.moveTo(x - 4, y - 30); c.quadraticCurveTo(x - 12, y - 38, x - 9, y - 46); c.quadraticCurveTo(x + 4, y - 50, x + 13, y - 44); c.quadraticCurveTo(x + 14, y - 33, x + 7, y - 28); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = dk; c.beginPath(); c.ellipse(x + 3, y - 46, 8, 3, -0.15, 0, 7); c.fill(); c.stroke();
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 4, y - 23); c.lineTo(x + 1, y - 26); c.stroke(); c.strokeStyle = brass; c.lineWidth = 1.6; c.stroke();
    c.fillStyle = "rgba(255,255,255,0.55)"; c.beginPath(); c.ellipse(x - 5, y - 38, 1.2, 4, 0.5, 0, 7); c.fill();
  } else if (kind === "trombone") {
    const sl = 4 + (Math.sin(t * 3.2 + ph) * 0.5 + 0.5) * 7;
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(mx, my); c.lineTo(mx + sl + 6, my + 4); c.stroke();
    c.strokeStyle = brass; c.lineWidth = 1.5; c.stroke();
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(mx + sl + 6, my + 4); c.lineTo(mx + sl + 6, my - 4); c.lineTo(mx - 3, my - 5.5); c.stroke(); c.strokeStyle = brass; c.lineWidth = 1.5; c.stroke();
    c.fillStyle = brass; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.ellipse(mx - 5, my - 5.5, 2, 3.4, 0.3, 0, 7); c.fill(); c.stroke();
  } else if (kind === "drum") {
    c.fillStyle = "#f3eee0"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.ellipse(x, y - 8, 7.5, 3, 0, 0, 7); c.fill(); c.stroke();
    c.fillStyle = "#d9d0b8"; c.fillRect(x - 7.5, y - 8, 15, 5); c.strokeRect(x - 7.5, y - 8, 15, 5); c.fillStyle = "#c33"; c.fillRect(x - 7.5, y - 6, 15, 1.2);
    for (const s of [-1, 1]) { const a = Math.sin(t * 9 + ph + (s > 0 ? 1.6 : 0)); c.strokeStyle = "#f4efe3"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x + s * 4.5, y - 14 - a * 2.5); c.lineTo(x + s * 3, y - 8.5); c.stroke(); }
  } else { // cornet / euphonium
    const fw = kind === "euph" ? 11 : 8, wob = Math.sin(t * 4 + ph) * 0.6;
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(mx, my); c.lineTo(mx + fw, my + 3 + wob); c.stroke(); c.strokeStyle = brass; c.lineWidth = 1.5; c.stroke();
    c.fillStyle = brass; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.moveTo(mx + fw, my + 3 + wob); c.lineTo(mx + fw + 4, my + 0.5 + wob); c.lineTo(mx + fw + 4, my + 7 + wob); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = INK; for (let i = 0; i < 3; i++) c.fillRect(mx + 2 + i * 2.2, my + 1.3 + wob - ((Math.sin(t * 8 + ph + i * 2) > 0.4) ? 1.2 : 0), 1, 1.4);
  }
  // arms (red sleeves) to instrument
  c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.moveTo(x - 4, y - 19 + bob); c.lineTo(mx + 3, my + 5); c.moveTo(x + 4, y - 19 + bob); c.lineTo(mx + 6, my + 4); c.stroke();
  c.strokeStyle = red; c.lineWidth = 2; c.stroke();
  c.fillStyle = face; c.beginPath(); c.arc(mx + 3, my + 5, 1.1, 0, 7); c.arc(mx + 6, my + 4, 1.1, 0, 7); c.fill();
  c.restore();
}

export function bandstand(k, u, v, t, R = 1.05) {
  const c = k.ctx, G = "#2b5b47", GL = "#4f8b6f", CREAM = "#efe3bd", STONE = "#e2d8bf", GOLD = "#d9b24a";
  const ZD = 0.55, ZP = 2.05, ZE = ZD + ZP, ROOFH = 0.8; // deck, post height, eave
  const RP = R * 0.97, RPL = R * 1.12;
  const lerp3 = (a, b, s) => [lerp(a[0], b[0], s), lerp(a[1], b[1], s), lerp(a[2], b[2], s)];
  const facePt = (A, B, s, z) => { const p = lerp3(A, B, s); return P(p[0], p[1], z); };
  // ground: paved patio rings, steps
  k.ell(u + 0.1, v + 0.08, 0, R * 1.6, "rgba(60,45,30,0.14)", { stroke: false });
  k.ell(u, v, 0, R * 1.5, "#e3d5ae", { lw: 1.1, wobble: 0 });
  k.ell(u, v, 0, R * 1.28, "#d2c398", { lw: 0.8, wobble: 0 });
  c.strokeStyle = "rgba(120,95,60,0.35)"; c.lineWidth = 0.8;
  for (let i = 0; i < 26; i++) { const a = (i / 26) * 6.283, p1 = P(u + Math.cos(a) * R * 1.28, v + Math.sin(a) * R * 1.28), p2 = P(u + Math.cos(a) * R * 1.5, v + Math.sin(a) * R * 1.5); c.beginPath(); c.moveTo(...p1); c.lineTo(...p2); c.stroke(); }
  // plinth
  const lo = OCT(u, v, RPL, 0), hi = OCT(u, v, RPL, ZD);
  for (let i = 0; i < 8; i++) {
    const j = (i + 1) % 8, nA = 22.5 + 45 * i + 22.5; const nx = Math.cos((nA * Math.PI) / 180), ny = Math.sin((nA * Math.PI) / 180);
    if (nx + ny < -0.05) continue;
    const sh = nx > ny ? 0 : 0.1;
    k.poly([lo[i], lo[j], hi[j], hi[i]], shade(STONE, -0.04 - sh), { lw: 1.1, wobble: 0 });
    // panel recess + stone courses
    k.poly([facePt(lo[i], lo[j], 0.12, 0.08), facePt(lo[i], lo[j], 0.88, 0.08), facePt(hi[i], hi[j], 0.88, -0.1 + ZD - 0.08 + 0.1 - 0.1), facePt(hi[i], hi[j], 0.12, ZD - 0.08)].map((q) => q), null, { lw: 0 });
    c.strokeStyle = "rgba(110,95,70,0.45)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(...facePt(lo[i], lo[j], 0, ZD * 0.5)); c.lineTo(...facePt(lo[i], lo[j], 1, ZD * 0.5)); c.stroke();
  }
  k.poly(hi, "#d9c9a0", { lw: 1.1, wobble: 0 });
  // steps on the front face (between vertices 0 and 1 => normal 45deg)
  { const A = lo[0], B = lo[1]; for (let s = 0; s < 3; s++) { const z0 = s * 0.18, w = 0.16 + s * 0.0; const a0 = lerp3(A, B, 0.22 - 0), a1 = lerp3(A, B, 0.78); const out = 0.34 - s * 0.1, dn = [Math.SQRT1_2 * out, Math.SQRT1_2 * out]; k.poly([[a0[0] + dn[0], a0[1] + dn[1], z0], [a1[0] + dn[0], a1[1] + dn[1], z0], [a1[0] + dn[0], a1[1] + dn[1], z0 + 0.18], [a0[0] + dn[0], a0[1] + dn[1], z0 + 0.18]], shade("#e6dcc4", -s * 0.04), { lw: 0.9, wobble: 0 }); k.poly([[a0[0] + dn[0], a0[1] + dn[1], z0 + 0.18], [a1[0] + dn[0], a1[1] + dn[1], z0 + 0.18], [a1[0] + dn[0] - dn[0] * 0.55, a1[1] + dn[1] - dn[1] * 0.55, z0 + 0.18], [a0[0] + dn[0] - dn[0] * 0.55, a0[1] + dn[1] - dn[1] * 0.55, z0 + 0.18]], "#f1e8d0", { lw: 0.7, wobble: 0 }); } }
  const posts = OCT(u, v, RP, ZD);
  const post = (p) => {
    const [x, y] = P(p[0], p[1], ZD), [, yt] = P(p[0], p[1], ZE);
    c.lineCap = "butt";
    c.fillStyle = G; c.strokeStyle = INK; c.lineWidth = 1;
    c.beginPath(); c.rect(x - 2.6, yt, 5.2, y - yt); c.fill(); c.stroke();
    c.fillStyle = GL; c.fillRect(x - 1.8, yt, 1.6, y - yt);
    // base, collars, capital
    for (const [z, w] of [[0.05, 4.4], [0.35, 3.6], [ZP * 0.58, 3.5], [ZP - 0.28, 4.2], [ZP - 0.1, 4.6]]) { const yy = P(p[0], p[1], ZD + z)[1]; c.fillStyle = G; c.beginPath(); c.roundRect(x - w, yy - 2, w * 2, 4, 1.6); c.fill(); c.stroke(); c.fillStyle = GOLD; c.fillRect(x - w + 1, yy - 0.6, w * 2 - 2, 1); }
  };
  const bracketArch = (A, B) => { // ornate spandrel arch under the frieze between two posts
    const zt = ZE - 0.34, n = 12;
    c.fillStyle = CREAM; c.strokeStyle = INK; c.lineWidth = 0.9;
    c.beginPath(); c.moveTo(...facePt(A, B, 0, zt)); c.lineTo(...facePt(A, B, 1, zt)); c.lineTo(...facePt(A, B, 1, zt - 0.4));
    for (let s = n; s >= 0; s--) { const f = s / n, sag = Math.sin(f * Math.PI) * 0.42; c.lineTo(...facePt(A, B, f, zt - 0.4 + sag)); }
    c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = G; c.lineWidth = 1.2; c.beginPath(); for (let s = 0; s <= n; s++) { const f = s / n, sag = Math.sin(f * Math.PI) * 0.42; const q = facePt(A, B, f, zt - 0.4 + sag - 0.05); s ? c.lineTo(...q) : c.moveTo(...q); } c.stroke();
    c.strokeStyle = "rgba(60,90,70,0.75)"; c.lineWidth = 0.8; for (let s = 1; s < 9; s++) { const f = s / 9, q = facePt(A, B, f, zt - 0.02), q2 = facePt(A, B, f, zt - 0.4 + Math.sin(f * Math.PI) * 0.42 + 0.02); c.beginPath(); c.arc(q[0], (q[1] + q2[1]) / 2, 1.5, 0, 6.3); c.stroke(); }
  };
  const frieze = (A, B) => {
    k.poly([[...lerp3(A, B, 0).slice(0, 2), ZE - 0.34], [...lerp3(A, B, 1).slice(0, 2), ZE - 0.34], [...lerp3(A, B, 1).slice(0, 2), ZE], [...lerp3(A, B, 0).slice(0, 2), ZE]], CREAM, { lw: 1, wobble: 0 });
    c.strokeStyle = G; c.lineWidth = 1.4; for (const z of [ZE - 0.02, ZE - 0.34]) { c.beginPath(); c.moveTo(...facePt(A, B, 0, z)); c.lineTo(...facePt(A, B, 1, z)); c.stroke(); }
    c.strokeStyle = "rgba(60,80,60,0.85)"; c.lineWidth = 0.9; const n = 9;
    for (let s = 0; s < n; s++) { const f = (s + 0.5) / n, [x, y] = facePt(A, B, f, ZE - 0.17); c.beginPath(); c.arc(x, y, 2.4, 0.4, 5.9); c.stroke(); c.beginPath(); c.moveTo(x - 4, y); c.quadraticCurveTo(x - 2, y - 3, x, y - 1); c.stroke(); c.fillStyle = GOLD; c.beginPath(); c.arc(x, y, 0.8, 0, 7); c.fill(); }
  };
  const balust = (A, B, front) => {
    const z0 = ZD + 0.05, z1 = ZD + 0.55;
    k.poly([[A[0], A[1], z0], [B[0], B[1], z0], [B[0], B[1], z1], [A[0], A[1], z1]], CREAM, { lw: 1, wobble: 0 });
    c.strokeStyle = G; c.lineWidth = 1.8; for (const z of [z1, z0 + 0.03]) { c.beginPath(); c.moveTo(...facePt(A, B, 0, z)); c.lineTo(...facePt(A, B, 1, z)); c.stroke(); }
    c.lineWidth = 0.9; c.strokeStyle = "rgba(55,85,65,0.9)"; const n = 8;
    for (let s = 0; s < n; s++) { const f = (s + 0.5) / n, [x, y] = facePt(A, B, f, (z0 + z1) / 2); c.beginPath(); c.arc(x, y, 2.4, 0, 6.3); c.stroke(); c.beginPath(); c.moveTo(x, y - 5); c.lineTo(x, y + 5); c.stroke(); }
  };
  // -- back (vertices 4..7 = 202.5..337.5? we use angle >= 112.5 on far side)
  const idx = [...Array(8).keys()].sort((a, b) => (posts[a][0] + posts[a][1]) - (posts[b][0] + posts[b][1]));
  const backIdx = idx.slice(0, 4), frontIdx = idx.slice(4);
  for (const i of backIdx) post(posts[i]);
  for (let i = 0; i < 8; i++) { const j = (i + 1) % 8, a = backIdx.includes(i), b = backIdx.includes(j); if (a && b) { frieze(posts[i], posts[j]); bracketArch(posts[i], posts[j]); } }
  // musicians
  const dirF = [Math.SQRT1_2, Math.SQRT1_2], perp = [Math.SQRT1_2, -Math.SQRT1_2];
  const crew = [[-0.85, -0.15, "trombone"], [-0.35, -0.05, "cornet"], [0, -0.35, "tuba"], [0.37, -0.05, "euph"], [0.85, -0.15, "cornet"], [-0.12, 0.28, "drum"], [0.5, 0.3, "cornet"]];
  crew.sort((a, b) => a[1] - b[1]);
  crew.forEach(([s, d, kind], i) => { const [x, y] = P(u + perp[0] * s * 0.78 + dirF[0] * d * 0.7, v + perp[1] * s * 0.78 + dirF[1] * d * 0.7, ZD); bandsman(c, x, y, { kind, ph: i * 1.7 }, t); });
  // floating notes
  for (let i = 0; i < 4; i++) { const ph = (t * 0.45 + i / 4) % 1, [nx, ny] = P(u, v, ZE - 0.4); c.fillStyle = `rgba(42,36,32,${1 - ph})`; c.strokeStyle = `rgba(42,36,32,${1 - ph})`; c.lineWidth = 1; const x = nx - 18 + i * 12 + Math.sin(ph * 6 + i) * 4, y = ny - ph * 34; c.beginPath(); c.ellipse(x, y, 2.3, 1.7, -0.4, 0, 7); c.fill(); c.beginPath(); c.moveTo(x + 2, y); c.lineTo(x + 2, y - 7); if (i % 2) c.lineTo(x + 5, y - 5); c.stroke(); }
  // front: balustrades (not on the stair face), posts, frieze
  for (let i = 0; i < 8; i++) { const j = (i + 1) % 8; if (frontIdx.includes(i) && frontIdx.includes(j) && !((i === 0 && j === 1))) balust(posts[i], posts[j]); }
  for (const i of frontIdx.sort((a, b) => (posts[a][0] + posts[a][1]) - (posts[b][0] + posts[b][1]))) post(posts[i]);
  // newel posts beside the steps
  for (const i of [0, 1]) { const p = posts[i], [x, y] = P(p[0], p[1], ZD); c.fillStyle = G; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.roundRect(x - 2, y - 24, 4, 24, 1); c.fill(); c.stroke(); c.fillStyle = GOLD; c.beginPath(); c.arc(x, y - 26, 2.6, 0, 7); c.fill(); c.stroke(); }
  for (let i = 0; i < 8; i++) { const j = (i + 1) % 8; if (frontIdx.includes(i) && frontIdx.includes(j)) { bracketArch(posts[i], posts[j]); frieze(posts[i], posts[j]); } }
  // roof: octagonal pyramid, slate panels with green ribs, flared eave
  const RE = R * 1.04, eave = OCT(u, v, RE, ZE + 0.02), ridge = [u, v, ZE + ROOFH];
  const order = [...Array(8).keys()].sort((a, b) => { const na = 22.5 + 45 * a + 22.5, nb = 22.5 + 45 * b + 22.5; return Math.cos((na * Math.PI) / 180) + Math.sin((na * Math.PI) / 180) - (Math.cos((nb * Math.PI) / 180) + Math.sin((nb * Math.PI) / 180)); });
  for (const i of order) {
    const j = (i + 1) % 8, nA = ((22.5 + 45 * i + 22.5) * Math.PI) / 180, lit = 0.5 + 0.5 * (-Math.cos(nA) * 0.6 + Math.sin(nA) * 0.2);
    const col = shade("#a3a6bb", (0.5 - lit) * 0.35);
    const tip = P(...ridge), a = P(eave[i][0], eave[i][1], ZE + 0.02), b = P(eave[j][0], eave[j][1], ZE + 0.02);
    const g = c.createLinearGradient(tip[0], tip[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); g.addColorStop(0, shade(col, -0.12)); g.addColorStop(0.55, col); g.addColorStop(1, shade(col, 0.1));
    c.beginPath(); c.moveTo(...tip); c.lineTo(...a); c.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 3, ...b); c.closePath(); c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke();
    c.strokeStyle = "rgba(60,64,90,0.45)"; c.lineWidth = 0.7; for (let s = 1; s < 4; s++) { const f = s / 4; c.beginPath(); c.moveTo(lerp(tip[0], a[0], f * 0.2) + (b[0] - a[0]) * 0.04, lerp(tip[1], a[1], f * 0.2)); c.moveTo(lerp(a[0], b[0], f), lerp(a[1], b[1], f)); c.lineTo(lerp(tip[0], lerp(a[0], b[0], f), 0.15 + 0.0), lerp(tip[1], lerp(a[1], b[1], f), 0.15)); c.stroke(); }
    c.strokeStyle = G; c.lineWidth = 1.8; c.beginPath(); c.moveTo(...tip); c.lineTo(...a); c.stroke();
    c.fillStyle = "rgba(255,255,255,0.18)"; c.beginPath(); c.moveTo(tip[0] + 1, tip[1] + 10); c.lineTo(lerp(tip[0], a[0], 0.6) + 2, lerp(tip[1], a[1], 0.6)); c.lineTo(lerp(tip[0], b[0], 0.6) - 2, lerp(tip[1], b[1], 0.6)); c.closePath(); c.fill();
  }
  // eave filigree edge + finials
  c.strokeStyle = CREAM; c.lineWidth = 2.6; c.beginPath(); for (let i = 0; i <= 8; i++) { const q = P(eave[i % 8][0], eave[i % 8][1], ZE + 0.02); i ? c.lineTo(...q) : c.moveTo(...q); } c.stroke();
  c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
  for (let i = 0; i < 8; i++) { const j = (i + 1) % 8; for (let s = 0; s < 7; s++) { const f = (s + 0.5) / 7, x = lerp(P(eave[i][0], eave[i][1], ZE)[0], P(eave[j][0], eave[j][1], ZE)[0], f), y = lerp(P(eave[i][0], eave[i][1], ZE)[1], P(eave[j][0], eave[j][1], ZE)[1], f); if ((i + 22) % 8 < 5 || true) { c.fillStyle = CREAM; c.beginPath(); c.arc(x, y + 2.8, 1.5, 0, 7); c.fill(); } } const p = P(eave[i][0], eave[i][1], ZE + 0.02); c.fillStyle = GOLD; c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.arc(p[0], p[1] - 2, 1.9, 0, 7); c.fill(); c.stroke(); }
  // lantern and spire
  const [lx, ly] = P(u, v, ZE + ROOFH);
  c.fillStyle = G; c.strokeStyle = INK; c.lineWidth = 1.1;
  c.beginPath(); c.ellipse(lx, ly + 1, 9, 3.3, 0, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(lx - 6.5, ly); c.quadraticCurveTo(lx - 8, ly - 10, lx - 2.5, ly - 17); c.lineTo(lx + 2.5, ly - 17); c.quadraticCurveTo(lx + 8, ly - 10, lx + 6.5, ly); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = GL; c.beginPath(); c.ellipse(lx - 2, ly - 8, 1.6, 5, 0.15, 0, 7); c.fill();
  c.fillStyle = GOLD; c.beginPath(); c.arc(lx, ly - 18.5, 2.6, 0, 7); c.fill(); c.stroke();
  c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.moveTo(lx, ly - 20); c.lineTo(lx, ly - 34); c.moveTo(lx - 4, ly - 29); c.lineTo(lx + 4, ly - 29); c.stroke(); c.strokeStyle = GOLD; c.lineWidth = 1.8; c.stroke();
}

// ---------------------------------------------------------------- rowing boat
// returns nothing; draws hull, rowers, oars at (u,v) heading ang. rowing = stroke amplitude
export function rowingBoat(k, u, v, ang, t, o = {}) {
  const c = k.ctx, L = o.L ?? 1.0, W = o.W ?? 0.44, ph = o.ph ?? 0, rowing = o.rowing ?? 1;
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const loc = (a, b, z) => P(u + ca * a - sa * b, v + sa * a + ca * b, z);
  const hw = (s) => (W / 2) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(s), 2.3)), 0.62);
  const gz = (s) => 0.3 + 0.16 * s * s;
  const N = 18, pts = (side, z) => { const a = []; for (let i = 0; i <= N; i++) { const s = -1 + (2 * i) / N; a.push(loc(s * L / 2, side * hw(s), z === null ? gz(s) : z)); } return a; };
  // near side = +b if its screen normal points toward viewer
  const nb = [-sa, ca], side = nb[0] + nb[1] >= 0 ? 1 : -1;
  const [sx, sy] = P(u, v, 0);
  c.fillStyle = "rgba(30,60,80,0.22)"; c.beginPath(); c.ellipse(sx, sy + 3, L * 26, L * 10.5, 0, 0, 7); c.fill();
  // far gunwale + interior
  const top = [...pts(1, null), ...pts(-1, null).reverse()];
  c.beginPath(); top.forEach((q, i) => (i ? c.lineTo(...q) : c.moveTo(...q))); c.closePath(); c.fillStyle = "#8a5a2c"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
  // inner planks + thwarts
  c.strokeStyle = "rgba(60,36,16,0.5)"; c.lineWidth = 0.8; for (let i = 1; i < 6; i++) { const f = i / 6 * 2 - 1; c.beginPath(); c.moveTo(...loc(f * L / 2, -hw(f) * 0.9, 0.12)); c.lineTo(...loc(f * L / 2, hw(f) * 0.9, 0.12)); c.stroke(); }
  for (const a of [-0.3, 0.12, 0.45]) { c.strokeStyle = INK; c.lineWidth = 3.6; c.beginPath(); c.moveTo(...loc(a * L, -hw(a * 2 / L * L / 2 * 1) * 1, 0.3)); c.lineTo(...loc(a * L, hw(a * 2) * 1, 0.3)); c.stroke(); c.strokeStyle = "#d6a868"; c.lineWidth = 2; c.stroke(); }
  // people: rower (stern side seat), passenger
  const stroke = Math.sin(t * 2.1 + ph);  // -1 pull .. +1 recover
  const rx = loc(-0.1 * L, 0, 0.32), px = loc(0.27 * L, 0, 0.3);
  const down = (x, y, f) => [x, y + f];
  const fwdScreen = [ca - sa, (ca + sa) * 0.577];
  const rower = () => {
    const [x, y] = rx, lean = stroke * rowing * 3.4, fx = fwdScreen[0], fy = fwdScreen[1], nrm = Math.hypot(fx, fy) || 1;
    const bx = x - (fx / nrm) * lean, by = y;
    c.lineCap = "round"; c.lineJoin = "round";
    c.fillStyle = o.top || "#f0e6d0"; c.strokeStyle = INK; c.lineWidth = 1;
    c.beginPath(); c.roundRect(bx - 4.6, by - 17, 9.2, 12, 2.5); c.fill(); c.stroke();
    c.fillStyle = "#e0ac84"; c.beginPath(); c.arc(bx - (fx / nrm) * lean * 0.3, by - 21, 3.4, 0, 7); c.fill(); c.stroke();
    c.fillStyle = o.hat || "#6d4b2a"; c.beginPath(); c.ellipse(bx - (fx / nrm) * lean * 0.3, by - 23.5, 4.8, 1.6, 0, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.arc(bx - (fx / nrm) * lean * 0.3, by - 24, 3, Math.PI, 0); c.fill(); c.stroke();
    return [bx, by];
  };
  // oars (drawn before person arms so arms cross)
  const oarData = [];
  for (const s of [-1, 1]) {
    const lockA = -0.1 * L, lockB = s * (W / 2 + 0.01), sw = stroke * rowing * 0.42;
    const inW = Math.cos(t * 2.1 + ph) * 0 + (stroke < 0.35 ? 1 : 0);
    const out = loc(lockA - 0.55 * Math.cos(sw) * 0 - Math.sin(sw) * 0.35, lockB + s * (0.5 + 0.06 * Math.cos(sw)), inW ? 0.02 : 0.2 + 0.1 * (stroke));
    const lock = loc(lockA, lockB, 0.32), inb = loc(lockA + Math.sin(sw) * 0.4, lockB * 0.2, 0.55);
    oarData.push({ s, lock, out, inb, inW });
  }
  // far oar behind hull, near oar in front
  const drawOar = (od) => {
    c.lineCap = "round";
    c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.moveTo(...od.inb); c.lineTo(...od.out); c.stroke(); c.strokeStyle = "#e6d3a0"; c.lineWidth = 1.7; c.stroke();
    c.fillStyle = "#c9a45a"; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.ellipse(od.out[0], od.out[1], 5, 2.3, Math.atan2(od.out[1] - od.lock[1], od.out[0] - od.lock[0]), 0, 7); c.fill(); c.stroke();
    if (od.inW) { c.strokeStyle = "rgba(255,255,255,0.85)"; c.lineWidth = 1.2; const r = 3 + ((t * 2.1 + ph) % 1) * 5; c.beginPath(); c.ellipse(od.out[0], od.out[1] + 1, r, r * 0.4, 0, 0, 7); c.stroke(); }
  };
  const farOar = oarData.find((d) => d.s !== side), nearOar = oarData.find((d) => d.s === side);
  drawOar(farOar);
  const [bx, by] = rower();
  const grip = nearOar.inb;
  c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.moveTo(bx, by - 13); c.lineTo(...grip); c.moveTo(bx, by - 13); c.lineTo(...farOar.inb); c.stroke(); c.strokeStyle = o.top || "#f0e6d0"; c.lineWidth = 2; c.stroke();
  // passenger
  { const [x, y] = px; c.lineCap = "round"; c.fillStyle = o.pcol || "#d9a0b4"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.roundRect(x - 4.6, y - 16, 9.2, 11, 3); c.fill(); c.stroke(); c.fillStyle = "#f1c9a5"; c.beginPath(); c.arc(x, y - 20, 3.3, 0, 7); c.fill(); c.stroke(); c.fillStyle = "#f3e2b0"; c.beginPath(); c.ellipse(x, y - 22, 7.5, 2.4, 0, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.arc(x, y - 22.4, 3.6, Math.PI, 0); c.fill(); c.stroke(); c.fillStyle = "#c0394a"; c.fillRect(x - 3.6, y - 23.4, 7.2, 1.2); }
  // near hull side (covers legs) + rim
  const gN = pts(side, null), wN = pts(side, 0.0).reverse();
  c.beginPath(); gN.forEach((q, i) => (i ? c.lineTo(...q) : c.moveTo(...q))); wN.forEach((q) => c.lineTo(q[0], q[1] + 0)); c.closePath();
  const g = c.createLinearGradient(0, gN[N >> 1][1] - 4, 0, gN[N >> 1][1] + 14); g.addColorStop(0, "#c58a4a"); g.addColorStop(1, "#8e5a2a"); c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
  c.strokeStyle = "rgba(70,42,18,0.6)"; c.lineWidth = 0.8; for (const z of [0.18, 0.1]) { c.beginPath(); pts(side, z).forEach((q, i) => (i ? c.lineTo(...q) : c.moveTo(...q))); c.stroke(); }
  c.strokeStyle = "#e0b878"; c.lineWidth = 1.4; c.beginPath(); gN.forEach((q, i) => (i ? c.lineTo(...q) : c.moveTo(...q))); c.stroke();
  drawOar(nearOar);
  // ripples at the hull
  const rr = (t * 0.5 + ph) % 1; c.strokeStyle = `rgba(255,255,255,${0.55 * (1 - rr)})`; c.lineWidth = 1.1; c.beginPath(); c.ellipse(sx, sy + 2, L * 30 + rr * 18, L * 12 + rr * 7, 0, 0, 7); c.stroke();
}

// ---------------------------------------------------------------- swan with wake (gliding, heading-aware)
export function swanGlide(k, u, v, face, t, ph, wake = true, cyg = 0) {
  const c = k.ctx, [x, y] = P(u, v, 0), f = face;
  if (wake) { c.strokeStyle = "rgba(255,255,255,0.7)"; c.lineWidth = 1.1; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x - f * 7, y + 1); c.lineTo(x - f * 24, y + 1 + s * 4.5); c.stroke(); } c.fillStyle = "rgba(255,255,255,0.4)"; c.beginPath(); c.ellipse(x, y + 2, 14, 4.4, 0, 0, 7); c.fill(); }
  c.fillStyle = "#fbfaf5"; c.strokeStyle = INK; c.lineWidth = 1.1;
  c.beginPath(); c.ellipse(x, y - 2.5, 9.5, 4.9, 0, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(x - f * 7, y - 3); c.quadraticCurveTo(x - f * 13, y - 9, x - f * 9, y - 10); c.quadraticCurveTo(x - f * 5, y - 6, x - f * 6, y - 4); c.fill(); c.stroke();
  const wing = Math.sin(t * 1.1 + ph) * 0.5; c.strokeStyle = "rgba(120,120,110,0.5)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - f * 5, y - 3 + wing); c.quadraticCurveTo(x, y - 7, x + f * 4, y - 3); c.stroke();
  const bob = Math.sin(t * 1.6 + ph) * 0.8; c.strokeStyle = INK; c.lineWidth = 3.6; c.beginPath(); c.moveTo(x + f * 6, y - 3.5); c.quadraticCurveTo(x + f * 12, y - 9, x + f * 7, y - 16 + bob); c.stroke(); c.lineWidth = 2; c.strokeStyle = "#fbfaf5"; c.stroke();
  c.fillStyle = "#fbfaf5"; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.arc(x + f * 7.5, y - 17 + bob, 2.6, 0, 7); c.fill(); c.stroke();
  c.fillStyle = "#e9873b"; c.beginPath(); c.moveTo(x + f * 9.6, y - 17.4 + bob); c.lineTo(x + f * 13.4, y - 16.4 + bob); c.lineTo(x + f * 9.6, y - 15.4 + bob); c.fill();
  c.fillStyle = INK; c.beginPath(); c.arc(x + f * 8, y - 17.8 + bob, 0.55, 0, 7); c.fill();
}

// ---------------------------------------------------------------- newspaper held in front (page turns)
export function newspaper(c, x, y, t, ph, big = 1) {
  const turn = ((t * 0.28 + ph) % 1), flip = turn > 0.88 ? (turn - 0.88) / 0.12 : -1;
  const w = 9 * big, h = 11 * big;
  c.fillStyle = "#f6f1e3"; c.strokeStyle = INK; c.lineWidth = 0.9;
  c.beginPath(); c.moveTo(x - w, y - h * 0.5); c.lineTo(x + w, y - h * 0.5 + 1.5); c.lineTo(x + w, y + h * 0.5); c.lineTo(x - w, y + h * 0.5 - 1.5); c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = "rgba(60,55,50,0.55)"; c.lineWidth = 0.7; for (let i = 0; i < 4; i++) { const yy = y - h * 0.3 + i * 2.4; c.beginPath(); c.moveTo(x - w + 1.5, yy); c.lineTo(x - 0.8, yy + 0.2); c.moveTo(x + 0.8, yy + 0.4); c.lineTo(x + w - 1.5, yy + 0.7); c.stroke(); }
  c.beginPath(); c.moveTo(x, y - h * 0.5); c.lineTo(x, y + h * 0.5); c.stroke();
  if (flip >= 0) { const a = Math.cos(flip * Math.PI), px = x + a * w; c.fillStyle = "#fffaf0"; c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x, y - h * 0.5); c.lineTo(px, y - h * 0.5 - 1 * Math.sin(flip * Math.PI) * 2); c.lineTo(px, y + h * 0.5 - 1.5); c.lineTo(x, y + h * 0.5); c.closePath(); c.fill(); c.stroke(); }
}

export function reeds2(k, u, v, n, seed) {
  const c = k.ctx, t = k.t, R = rng(seed * 13 + 1); c.lineCap = "round";
  const flower = seed % 3;
  for (let i = 0; i < n + 8; i++) {
    const [x, y] = P(u + (R() - 0.5) * 0.8, v + (R() - 0.5) * 0.7, 0), h = 9 + R() * 12, sw = Math.sin(t * 1.3 + i + seed) * 1.6, bend = (R() - 0.5) * 10;
    for (const [w, col] of [[3.4, INK], [2.2, i % 2 ? "#6f9a45" : "#86ad52"]]) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + bend * 0.5 + sw * 0.3, y - h * 0.55, x + bend + sw, y - h); c.stroke(); }
    if (i % 3 === 0 && flower < 2) { const fx = x + bend + sw, fy = y - h; c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.moveTo(fx, fy + 6); c.lineTo(fx, fy - 5); c.stroke(); c.strokeStyle = flower ? "#f0cb3c" : "#9b6ed0"; c.lineWidth = 2.2; c.stroke(); }
    if (i % 4 === 1 && flower === 2) { const fx = x + bend + sw, fy = y - h; c.fillStyle = "#7a5030"; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.ellipse(fx, fy, 1.8, 4.5, 0, 0, 7); c.fill(); c.stroke(); }
  }
}
export function lily2(k, u, v, seed) {
  const c = k.ctx, R = rng(seed * 7 + 5), t = k.t;
  for (let i = 0; i < 9; i++) { const [x, y] = P(u + (R() - 0.5) * 1.1, v + (R() - 0.5) * 1.1, 0), r = 5 + R() * 4, a = R() * 6; c.fillStyle = "#6f9f4e"; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x, y); c.ellipse(x, y, r, r * 0.45, 0, a, a + 5.6); c.closePath(); c.fill(); c.stroke(); if (i % 3 === 0) { const b = Math.sin(t * 1.2 + i) * 0.4; c.fillStyle = i % 2 ? "#fbf2f4" : "#f4b6c8"; c.beginPath(); c.arc(x + 1, y - 1.5 + b, 2.2, 0, 7); c.fill(); c.stroke(); } }
}
