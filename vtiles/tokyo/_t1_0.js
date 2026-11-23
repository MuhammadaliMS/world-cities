// Tokyo 1,0 helpers (Shinjuku): detailed Godzilla, curtain-wall glass, towers, two-storey yatai
import { P, INK, shade, lerp, rng, hash } from "../../lib/vec-kit.js";
import { stdProj, mbox, mwin, mband, mroof, faceSign, faceDraw, chochin, acUnit, antenna, FONT } from "./_props.js";

const TAU = Math.PI * 2;
const pl = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };

// ---------------------------------------------------------------- Godzilla ----------------------------------------------
// local coords: origin at the neck base on the parapet, head faces left. roar cycle 6.5 s.
export function roarAt(t) { const cyc = (t % 6.5); return cyc < 0.5 ? cyc / 0.5 : cyc < 2.1 ? 1 : cyc < 2.7 ? 1 - (cyc - 2.1) / 0.6 : 0; }
export function godzilla(k, x, y, t, o = {}) {
  const part = o.part || "all";
  const c = k.ctx, roar = roarAt(t), e = roar * roar * (3 - 2 * roar);
  const breath = Math.sin(t * 1.6) * 0.6, shake = e * Math.sin(t * 55) * 0.9;
  const S = o.s ?? 1;
  c.save(); c.translate(x + shake, y + breath); c.scale(S, S); c.lineJoin = "round"; c.lineCap = "round";
  const G = "#6c6f76", GD = "#3c3f46", GL = "#9a9ea6", GLL = "#b6bac2", CR = "#ddd8c6";
  const glow = 0.35 + 0.65 * e;
  // --- dorsal fins (behind), maple-leaf plates; glow blue-white while roaring
  const fins = [[-4, -66, 0.9], [10, -62, 1.0], [24, -52, 1.05], [36, -38, 1.0], [45, -22, 0.9], [50, -8, 0.7]];
  fins.forEach(([fx, fy, s], i) => {
    const h = 24 * s, w = 8 * s, a = -0.2 + i * 0.12;
    c.save(); c.translate(fx, fy); c.rotate(a);
    c.beginPath(); c.moveTo(-w, 4); c.lineTo(-w * 0.55, -h * 0.35); c.lineTo(-w * 0.2, -h * 0.28); c.lineTo(0, -h); c.lineTo(w * 0.3, -h * 0.4); c.lineTo(w * 0.8, -h * 0.5); c.lineTo(w, 4); c.closePath();
    const g = c.createLinearGradient(0, -h, 0, 4); g.addColorStop(0, shade("#d8d4c4", 0.1)); g.addColorStop(1, "#8d8a80");
    c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke();
    if (e > 0.02) { c.fillStyle = `rgba(150,225,255,${e * 0.75})`; c.fill(); c.strokeStyle = `rgba(200,245,255,${e})`; c.lineWidth = 1.4; c.stroke(); }
    c.strokeStyle = "rgba(40,36,30,0.5)"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(0, -h * 0.85); c.lineTo(0, 0); c.stroke();
    c.restore();
  });
  // --- body / neck
  const body = () => { c.beginPath(); c.moveTo(-30, -58); c.bezierCurveTo(-8, -66, 14, -56, 30, -26); c.lineTo(36, 16); c.lineTo(-44, 16); c.lineTo(-56, -6); c.bezierCurveTo(-50, -26, -42, -44, -34, -62); c.closePath(); };
  body(); const gb = c.createLinearGradient(-50, -70, 50, 16); gb.addColorStop(0, GL); gb.addColorStop(0.5, G); gb.addColorStop(1, GD); c.fillStyle = gb; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
  // scales: staggered rows of little rounded plates, lit from the upper left
  c.save(); body(); c.clip();
  for (let r = 0; r < 12; r++) for (let q = 0; q < 14; q++) {
    const sx = -50 + q * 8 + (r % 2) * 4, sy = -70 + r * 7.2, d = hash(r * 9.1 + q * 3.7);
    c.fillStyle = `rgba(${d > 0.5 ? "14,16,20" : "28,30,36"},0.34)`; c.beginPath(); c.arc(sx, sy + 3, 3.9, 0.1, Math.PI - 0.1); c.fill();
    c.strokeStyle = `rgba(210,215,222,${0.14 + d * 0.16})`; c.lineWidth = 0.7; c.beginPath(); c.arc(sx, sy, 3.6, Math.PI + 0.5, TAU - 0.4); c.stroke();
  }
  // belly ridges on the throat
  c.strokeStyle = "rgba(25,26,30,0.45)"; c.lineWidth = 0.8; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-54, -2 + i * 3.2); c.quadraticCurveTo(-30, 4 + i * 3.4, -8, -2 + i * 3.4); c.stroke(); }
  c.restore();
  // --- lower jaw (hinged), mouth interior, teeth
  const H = [-22, -24], ang = 0.32 + e * 0.78;
  c.save(); c.translate(H[0], H[1]); c.rotate(-ang);
  // tongue + interior behind the jaw
  c.beginPath(); c.moveTo(0, -2); c.lineTo(-52, 0); c.lineTo(-56, 7); c.lineTo(-40, 13); c.lineTo(-6, 14); c.lineTo(8, 7); c.closePath();
  c.fillStyle = shade("#c8453f", -0.05 + e * 0.1); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke();
  c.beginPath(); c.moveTo(-6, 11); c.quadraticCurveTo(-26, 3, -48, 8); c.quadraticCurveTo(-30, 13, -6, 14); c.fillStyle = "#e88a86"; c.fill();
  // jaw mass
  c.beginPath(); c.moveTo(6, 2); c.lineTo(-54, 6); c.quadraticCurveTo(-60, 10, -52, 16); c.lineTo(-24, 21); c.quadraticCurveTo(0, 22, 12, 12); c.closePath();
  const gj = c.createLinearGradient(0, 2, 0, 22); gj.addColorStop(0, G); gj.addColorStop(1, GD); c.fillStyle = gj; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
  for (let i = 0; i < 5; i++) { c.strokeStyle = "rgba(20,20,24,0.45)"; c.lineWidth = 0.8; c.beginPath(); c.arc(-40 + i * 9, 14, 3.5, 0.2, 2.9); c.stroke(); }
  // lower teeth
  c.fillStyle = CR; c.strokeStyle = INK; c.lineWidth = 0.8;
  for (let i = 0; i < 8; i++) { const tx = -50 + i * 7; const th = 5 + (i % 3 === 1 ? 3 : 0); c.beginPath(); c.moveTo(tx, 6.5); c.lineTo(tx + 2.5, 6.5 - th); c.lineTo(tx + 5, 6.2); c.closePath(); c.fill(); c.stroke(); }
  c.restore();
  // --- upper head: skull, snout, brow ridge
  c.beginPath(); c.moveTo(-76, -33); c.quadraticCurveTo(-82, -40, -72, -48); c.bezierCurveTo(-62, -60, -42, -68, -22, -66); c.bezierCurveTo(-4, -62, 8, -48, 8, -30); c.lineTo(-6, -22); c.lineTo(-30, -24); c.lineTo(-62, -27); c.closePath();
  const gh = c.createLinearGradient(-70, -66, 0, -22); gh.addColorStop(0, GLL); gh.addColorStop(0.45, G); gh.addColorStop(1, GD); c.fillStyle = gh; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
  c.save(); pl(c, [[-80, -30], [-84, -50], [-60, -70], [-4, -72], [12, -48], [10, -28], [-8, -20], [-62, -24]]); c.clip();
  for (let r = 0; r < 7; r++) for (let q = 0; q < 12; q++) { const sx = -70 + q * 7 + (r % 2) * 3.5, sy = -66 + r * 6.2; c.strokeStyle = "rgba(15,16,20,0.32)"; c.lineWidth = 0.8; c.beginPath(); c.arc(sx, sy + 2, 3.2, 0.2, 2.9); c.stroke(); c.strokeStyle = "rgba(220,225,230,0.2)"; c.beginPath(); c.arc(sx, sy, 3, 3.6, 5.6); c.stroke(); }
  c.restore();
  // snout bump + nostril
  c.beginPath(); c.ellipse(-70, -40, 8, 5, 0.2, 0, TAU); c.fillStyle = shade(GL, 0.05); c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  c.fillStyle = INK; c.beginPath(); c.ellipse(-72, -42, 2.3, 1.4, -0.4, 0, TAU); c.fill();
  // brow ridge over the eye
  c.beginPath(); c.moveTo(-58, -50); c.quadraticCurveTo(-44, -60, -26, -52); c.lineTo(-26, -46); c.quadraticCurveTo(-42, -52, -58, -43); c.closePath(); c.fillStyle = GD; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
  // spiky ear ridge behind the eye
  for (let i = 0; i < 4; i++) { const sx = -20 + i * 7, sy = -62 + i * 5; c.beginPath(); c.moveTo(sx - 4, sy + 4); c.lineTo(sx + 2, sy - 8 - (i === 1 ? 2 : 0)); c.lineTo(sx + 6, sy + 3); c.closePath(); c.fillStyle = GLL; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke(); }
  // upper teeth + gum line
  c.fillStyle = "#9c3a36"; c.beginPath(); c.moveTo(-78, -30); c.lineTo(-8, -22); c.lineTo(-8, -26); c.lineTo(-76, -33); c.closePath(); c.fill();
  c.fillStyle = CR; c.strokeStyle = INK; c.lineWidth = 0.8;
  for (let i = 0; i < 9; i++) { const tx = -76 + i * 7.6, th = 5 + (i === 1 || i === 5 ? 4 : i % 3); c.beginPath(); c.moveTo(tx, -29 + i * 0.7); c.lineTo(tx + 3.5, -29 + i * 0.7 + th); c.lineTo(tx + 7, -28.4 + i * 0.7); c.closePath(); c.fill(); c.stroke(); }
  // eye: amber, glowing hard on the roar
  const ex = -42, ey = -42;
  if (e > 0.02) { const gg = c.createRadialGradient(ex, ey, 1, ex, ey, 16); gg.addColorStop(0, `rgba(255,220,90,${e * 0.8})`); gg.addColorStop(1, "rgba(255,200,60,0)"); c.fillStyle = gg; c.beginPath(); c.arc(ex, ey, 16, 0, TAU); c.fill(); }
  c.beginPath(); c.ellipse(ex, ey, 6, 3.6, 0.28, 0, TAU); c.fillStyle = `rgb(255,${178 + Math.round(60 * glow)},${30 + Math.round(60 * e)})`; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
  c.fillStyle = INK; c.beginPath(); c.ellipse(ex, ey + 0.2, 1.2, 3, 0.28, 0, TAU); c.fill();
  if (c.__ns?.n) { c.__emit = (c.__emit || 0) + 1; const gg = c.createRadialGradient(ex, ey, 1, ex, ey, 26); gg.addColorStop(0, "rgba(255,200,70,0.9)"); gg.addColorStop(1, "rgba(255,160,40,0)"); c.fillStyle = gg; c.beginPath(); c.arc(ex, ey, 26, 0, TAU); c.fill(); c.beginPath(); c.ellipse(ex, ey, 6, 3.6, 0.28, 0, TAU); c.fillStyle = "#ffe27a"; c.fill(); c.fillStyle = INK; c.beginPath(); c.ellipse(ex, ey + 0.2, 1.2, 3, 0.28, 0, TAU); c.fill(); c.__emit--; }
  c.fillStyle = "rgba(255,255,240,0.9)"; c.beginPath(); c.arc(ex - 2, ey - 1.2, 0.9, 0, TAU); c.fill();
  // breath of blue light from the throat on the roar
  if (e > 0.02) { const gg = c.createRadialGradient(-60, -14, 2, -60, -14, 52); gg.addColorStop(0, `rgba(170,235,255,${e * 0.75})`); gg.addColorStop(0.4, `rgba(110,190,255,${e * 0.3})`); gg.addColorStop(1, "rgba(110,190,255,0)"); c.fillStyle = gg; c.beginPath(); c.arc(-60, -14, 52, 0, TAU); c.fill(); }
  c.restore();
}

export function gzClaws(k, x, y, o = {}) {
  const c = k.ctx, G = "#6c6f76", CR = "#ddd8c6", S = o.s ?? 1;
  c.save(); c.translate(x, y); c.scale(S, S); c.lineJoin = "round"; c.lineCap = "round";
  // forearm + three claws on the parapet
  c.beginPath(); c.moveTo(4, 6); c.quadraticCurveTo(10, -6, 28, -4); c.lineTo(40, 14); c.lineTo(2, 18); c.closePath(); c.fillStyle = G; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
  for (let i = 0; i < 3; i++) { const cx0 = 4 + i * 11; c.beginPath(); c.moveTo(cx0 - 4, 8); c.quadraticCurveTo(cx0 - 6, 18, cx0 - 2, 26); c.quadraticCurveTo(cx0 + 4, 20, cx0 + 4, 8); c.closePath(); c.fillStyle = CR; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke(); c.strokeStyle = "rgba(255,255,255,0.6)"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(cx0 - 3, 10); c.lineTo(cx0 - 2, 22); c.stroke(); }
  c.restore();
}

// ---------------------------------------------------------------- glass curtain wall ------------------------------------
// sunset-lit glazing on a box face with mullions, transoms, sheen and flickering lit offices
export function glassFace(k, b, side, o = {}) {
  const c = k.ctx, z0 = o.z0 ?? 0.1, z1 = o.z1 ?? b.dz - 0.1, s0 = o.s0 ?? 0.03, s1 = o.s1 ?? 0.97;
  const cols = o.cols ?? 6, rows = o.rows ?? 12, dark = side === "R" ? -0.2 : 0;
  const A = b.fp(side, s0, z0), B = b.fp(side, s1, z0), C = b.fp(side, s1, z1), D = b.fp(side, s0, z1), q = [A, B, C, D];
  const ys = q.map((p) => p[1]), yT = Math.min(...ys), yB = Math.max(...ys);
  const g = c.createLinearGradient(0, yT, 0, yB);
  g.addColorStop(0, shade(o.sky || "#7ea3c8", dark)); g.addColorStop(o.mid ?? 0.55, shade(o.mid2 || "#a9bfd0", dark)); g.addColorStop(1, shade(o.warm || "#f0c780", dark));
  k.path(q, { fill: g, wobble: 0, lw: 1.2 });
  c.save(); pl(c, q); c.clip();
  const f = (s, z) => b.fp(side, lerp(s0, s1, s), lerp(z0, z1, z));
  // lit panels
  for (let r = 0; r < rows; r++) for (let i = 0; i < cols; i++) {
    const h = hash(r * 11.3 + i * 4.1 + (o.seed || 0));
    if (h < (o.lit ?? 0.28)) { const flick = 0.75 + 0.25 * Math.sin(k.t * 0.8 + h * 40); const p = [f(i / cols, r / rows), f((i + 1) / cols, r / rows), f((i + 1) / cols, (r + 1) / rows), f(i / cols, (r + 1) / rows)]; pl(c, p); c.fillStyle = `rgba(255,${205 + h * 40},${110 + h * 40},${0.8 * flick})`; c.fill(); }
  }
  // mullions + transoms
  c.strokeStyle = o.mull || "rgba(40,52,70,0.62)"; c.lineWidth = o.mw ?? 0.8; c.beginPath();
  for (let i = 0; i <= cols; i++) { c.moveTo(...f(i / cols, 0)); c.lineTo(...f(i / cols, 1)); }
  for (let r = 0; r <= rows; r++) { c.moveTo(...f(0, r / rows)); c.lineTo(...f(1, r / rows)); } c.stroke();
  // light frame highlight on every 3rd mullion
  c.strokeStyle = "rgba(245,240,220,0.5)"; c.lineWidth = 0.7; c.beginPath(); for (let i = 0; i <= cols; i += 3) { c.moveTo(...f(i / cols, 0)); c.lineTo(...f(i / cols, 1)); } c.stroke();
  // diagonal sheen
  const sh = o.sheen ?? 1;
  if (sh) { c.fillStyle = "rgba(255,255,255,0.13)"; const a = f(0.18, 1), bb = f(0.34, 1), cc = f(0.06, 0.1), d2 = f(0.0, 0.1); pl(c, [a, bb, [bb[0] - 30, bb[1] + 200], [a[0] - 30, a[1] + 200]]); c.fill(); }
  c.restore();
}

// concrete / stone face with panel grid and window strips
export function panelFace(k, b, side, o = {}) {
  const c = k.ctx, z0 = o.z0 ?? 0.05, z1 = o.z1 ?? b.dz - 0.05, cols = o.cols ?? 10, rows = o.rows ?? 4;
  c.save(); c.strokeStyle = o.line || "rgba(90,78,60,0.4)"; c.lineWidth = 0.7; c.beginPath();
  for (let i = 1; i < cols; i++) { c.moveTo(...b.fp(side, i / cols, z0)); c.lineTo(...b.fp(side, i / cols, z1)); }
  for (let r = 1; r < rows; r++) { c.moveTo(...b.fp(side, 0, lerp(z0, z1, r / rows))); c.lineTo(...b.fp(side, 1, lerp(z0, z1, r / rows))); }
  c.stroke(); c.restore();
}

// rooftop clutter: AC fans, cooling tank, antennas, pipe stack
export function roofKit(k, u, v, z, du, dv, seed = 1, o = {}) {
  const R = rng(seed * 13 + 5), n = o.ac ?? 3;
  for (let i = 0; i < n; i++) acUnit(k, stdProj, u + 0.2 + R() * Math.max(0.1, du - 0.8), v + 0.2 + R() * Math.max(0.1, dv - 0.7), z, { s: 0.38 + R() * 0.14 });
  if (o.stack) { const [x, y] = P(u + du * 0.7, v + dv * 0.3, z); const c = k.ctx; c.fillStyle = "#b9b4a8"; c.fillRect(x - 3, y - 22, 6, 22); c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(x - 3, y - 22, 6, 22); c.fillStyle = "#8a867c"; c.fillRect(x + 5, y - 16, 4, 16); c.strokeRect(x + 5, y - 16, 4, 16); }
  if (o.ant) for (let i = 0; i < o.ant; i++) { const [x, y] = P(u + du * (0.25 + 0.2 * i), v + dv * (0.3 + 0.1 * i), z); antenna(k, x, y, 26 + i * 8, { light: i === 0, seed: seed + i }); }
}

// ---------------------------------------------------------------- generic mid-rise block --------------------------------
// face styles: "glass" (curtain wall), "grid" (cream with window rows), "red" (red louvre panel)
export function block(k, u, v, du, dv, h, o = {}) {
  const c = k.ctx, col = o.col || "#e4d9c4", L = o.L || "grid", Rs = o.R || "glass";
  const b = mbox(k, stdProj, u, v, 0, du, dv, h, col, { wobble: 0, left: o.left, right: o.right });
  const draw = (side, st, run) => {
    const cols = Math.max(2, Math.round(run / 0.5));
    if (st === "glass") glassFace(k, b, side, { z0: 0.2, z1: h - 0.25, cols, rows: Math.round(h / 0.5), seed: o.seed ?? 3, lit: o.lit ?? 0.3, sky: o.sky, warm: o.warm });
    else if (st === "red") { mband(k, b, side, 0.1, h - 0.1, "#c4553f", { s0: 0.1, s1: 0.9 }); panelFace(k, b, side, { cols: 8, rows: Math.round(h / 0.45), z0: 0.1, z1: h - 0.1, line: "rgba(60,15,10,0.45)" }); for (let i = 0; i < Math.round(h / 0.45) * 8; i++); }
    else { // cream facade with deep window strips + spandrels
      const rows = Math.max(2, Math.round(h / 0.7)), cc = Math.max(2, Math.round(run / 0.55));
      mband(k, b, side, 0.08, h - 0.1, shade(col, -0.02 + (side === "R" ? -0.12 : 0)), { s0: 0.02, s1: 0.98, lw: 0.6 });
      mwin(k, b, side, { rows, cols: cc, z0: 0.3, z1: h - 0.2, color: o.win || "#8aa2bd", lit: o.lit ?? 0.35, gap: 0.12, mx: 0.05, seed: o.seed ?? 4, sheen: true, lw: 0.8 });
      panelFace(k, b, side, { cols: cc * 2, rows: rows * 2, z0: 0.1, z1: h - 0.1, line: "rgba(120,100,80,0.28)" });
      if (o.balc) { for (let r = 1; r < rows; r++) { const zz = 0.3 + r * (h - 0.5) / rows; k.path([b.fp(side, 0.05, zz), b.fp(side, 0.95, zz), b.fp(side, 0.95, zz - 0.07), b.fp(side, 0.05, zz - 0.07)], { fill: "#bdb4a0", wobble: 0, lw: 0.6 }); } }
    }
    mband(k, b, side, h - 0.14, h, shade(col, -0.18), { lw: 0.8 });
  };
  draw("L", L, du); draw("R", Rs, dv);
  if (o.roof !== false) roofKit(k, u, v, h, du, dv, o.seed ?? 3, { ac: o.ac ?? 3, stack: o.stack, ant: o.ant });
  return b;
}

// ---------------------------------------------------------------- Japanese two-storey yatai --------------------------------
export function yatai(k, u, v, du, dv, o = {}) {
  const c = k.ctx, t = k.t, wood = o.wood || "#a67a50", face = o.face || "R", other = face === "R" ? "L" : "R", h = o.h ?? 1.5;
  k.ell(u + du / 2 + 0.3, v + dv / 2 + 0.1, 0, Math.max(du, dv) * 0.6, "rgba(60,45,30,0.16)", { stroke: false });
  const b = mbox(k, stdProj, u, v, 0, du, dv, h, wood, { wobble: 0, top: false, left: shade(wood, -0.03), right: shade(wood, -0.22) });
  // vertical board texture on the closed face
  c.strokeStyle = "rgba(55,32,18,0.5)"; c.lineWidth = 0.8; c.beginPath();
  const nb = Math.round((other === "L" ? du : dv) * 5);
  for (let i = 1; i < nb; i++) { c.moveTo(...b.fp(other, i / nb, 0.04)); c.lineTo(...b.fp(other, i / nb, h - 0.04)); } c.stroke();
  mwin(k, b, other, { rows: 1, cols: 2, z0: 0.6, z1: h - 0.3, color: "#ffd87a", gap: 0.3, lit: 1, lw: 1.2 });
  // timber posts on the open face
  const side = face;
  for (const s of [0.03, 0.97, 0.5]) { c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.moveTo(...b.fp(side, s, 0)); c.lineTo(...b.fp(side, s, h)); c.stroke(); c.strokeStyle = "#7a5230"; c.lineWidth = 1.8; c.stroke(); }
  // warm interior
  const inner = [b.fp(side, 0.06, 0.2), b.fp(side, 0.94, 0.2), b.fp(side, 0.94, h - 0.3), b.fp(side, 0.06, h - 0.3)];
  const gi = c.createLinearGradient(0, inner[3][1], 0, inner[0][1]); gi.addColorStop(0, "#ffe7a8"); gi.addColorStop(1, "#e9a95a");
  k.path(inner, { fill: gi, wobble: 0, lw: 1.1 });
  // shelves with bottles/bowls
  c.strokeStyle = "#6a4528"; c.lineWidth = 1.3; for (const zz of [0.75, 1.0]) { c.beginPath(); c.moveTo(...b.fp(side, 0.1, zz)); c.lineTo(...b.fp(side, 0.9, zz)); c.stroke(); }
  for (let i = 0; i < 8; i++) { const [x, y] = b.fp(side, 0.12 + i * 0.1, i % 2 ? 0.75 : 1.0); c.fillStyle = ["#3a6b4a", "#c8392a", "#2c4a7a", "#f2efe6"][i % 4]; c.fillRect(x - 1.8, y - 6 - (i % 3), 3.6, 6 + (i % 3)); }
  // hanging lamp glow
  for (const s of [0.25, 0.75]) { const [x, y] = b.fp(side, s, h - 0.45); const g = c.createRadialGradient(x, y, 0, x, y, 20); g.addColorStop(0, "rgba(255,230,150,0.75)"); g.addColorStop(1, "rgba(255,220,120,0)"); c.fillStyle = g; c.beginPath(); c.arc(x, y, 20, 0, TAU); c.fill(); }
  // sign board above the opening
  faceSign(k, b, side, 0.12, 0.88, h - 0.3, h - 0.02, o.sign || "ラーメン", { bg: o.signBg || "#1e2a4a", fg: "#fff", size: 66, ar: 3.4, border: "#e8d8a0" });
  // noren curtain strips, swaying
  for (let i = 0; i < 6; i++) { const s = 0.12 + i * 0.152, [x, y] = b.fp(side, s, h - 0.3), sw = Math.sin(t * 1.7 + i + u) * 0.9; c.fillStyle = o.noren || "#24408a"; c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.rect(x - 5 + sw, y, 10, 17); c.fill(); c.stroke(); c.fillStyle = "#f2efe6"; c.fillRect(x - 2 + sw, y + 5, 4, 5); }
  if (o.noRoof) return b;
  // lower tile pent-roof over the open face
  mroof(k, stdProj, u, v, h, du, dv, o.rh ?? 0.7, { over: 0.35, lift: 0.14, hip: 0.55, col: o.roof || "#5a6475", trimCol: "#5a3d28", orn: false, ribs: 22, trimH: 0.12, bosses: 0 });
  return b;
}

// small upper storey behind/atop a yatai (pale plaster + timber), gable tile roof
export function upper(k, u, v, du, dv, z, h, o = {}) {
  const c = k.ctx, plaster = o.plaster || "#d9ccb2";
  const b = mbox(k, stdProj, u, v, z, du, dv, h, plaster, { wobble: 0, left: shade(plaster, -0.02), right: shade(plaster, -0.2) });
  for (const side of ["L", "R"]) {
    const run = side === "L" ? du : dv;
    c.strokeStyle = "rgba(70,45,28,0.8)"; c.lineWidth = 1.8; c.beginPath(); for (let i = 0; i <= 3; i++) { c.moveTo(...b.fp(side, i / 3, 0)); c.lineTo(...b.fp(side, i / 3, h)); } c.moveTo(...b.fp(side, 0, h * 0.5)); c.lineTo(...b.fp(side, 1, h * 0.5)); c.stroke();
    mwin(k, b, side, { rows: 1, cols: Math.max(1, Math.round(run / 0.7)), z0: h * 0.25, z1: h * 0.8, color: "#ffd97e", lit: 1, gap: 0.35, mx: 0.12, lw: 1.1 });
  }
  mroof(k, stdProj, u, v, z + h, du, dv, o.rh ?? 0.75, { over: 0.3, lift: 0.1, hip: 0.1, col: o.roof || "#55606f", trimCol: "#4a3524", orn: false, ribs: 20, trimH: 0.1, bosses: 0 });
  return b;
}

// flowering / leafy planter box
export function plantBox(k, u, v, o = {}) {
  const wood = "#b08a58", w = o.w ?? 0.45, c = k.ctx;
  k.box(u, v, 0, w, w, 0.38, wood, { hatch: false, shadow: false });
  const [x, y] = P(u + w / 2, v + w / 2, 0.38);
  const flower = o.flower;
  k._lobe(x, y - 8, 9 + (o.big ? 4 : 0), flower || "#7aa650", Math.round(u * 17 + v * 5), { squash: 0.85, bumps: 7 });
  if (flower) { c.fillStyle = "#f6b7c8"; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(x - 8 + hash(i + u) * 16, y - 14 + hash(i * 3 + v) * 9, 1.8, 0, TAU); c.fill(); } }
}

// Japanese-looking vertical blade sign hung on a face edge (kanji, glowing)
export function bladeSign(k, x, y, w, h, text, o = {}) {
  const c = k.ctx, on = o.blink ? (Math.sin(k.t * 4 + (o.seed || 0)) > -0.3 ? 1 : 0.4) : 1;
  c.save(); c.translate(x, y);
  const g = c.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, h * 0.9); g.addColorStop(0, `rgba(${o.glow || "255,160,90"},${0.35 * on})`); g.addColorStop(1, "rgba(255,160,90,0)"); c.fillStyle = g; c.fillRect(-h * 0.6, -h * 0.3, h * 1.5, h * 1.6);
  c.fillStyle = o.bg || "#201830"; c.fillRect(0, 0, w, h); c.strokeStyle = o.col || "#ff7ab0"; c.lineWidth = 1.6; c.globalAlpha = on; c.strokeRect(1, 1, w - 2, h - 2);
  const ch = [...text]; c.fillStyle = o.fg || "#fff"; c.shadowColor = o.col || "#ff7ab0"; c.shadowBlur = 6; c.font = `bold ${Math.min(w * 0.78, h / ch.length * 0.95)}px ${FONT}`; c.textAlign = "center"; c.textBaseline = "middle";
  ch.forEach((g2, i) => c.fillText(g2, w / 2, h * (i + 0.5) / ch.length));
  c.restore(); c.shadowBlur = 0; c.globalAlpha = 1;
}
