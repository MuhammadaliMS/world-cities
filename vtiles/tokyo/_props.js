// Tokyo shared helpers: free-projection solids (so hero buildings can match the painted skew),
// Japanese roofs, lanterns, torii, vending machines, signs with real text, petals, smoke, crowds.
import { P, CTS, INK, shade, lerp, clamp, rng, hash, smooth, mix } from "../../lib/vec-kit.js";
export { P, CTS, INK, shade, lerp, clamp, rng, hash, smooth, mix };

export const FONT = "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP','Yu Gothic','Meiryo',sans-serif";
export const PX = { gold: "#e3b43c", goldD: "#a97a1e", red: "#cf3b2c", redD: "#a82a20", redL: "#e9604a", cream: "#f1e8d2", roof: "#566174", roofD: "#3e4756", roofL: "#7b869a", stone: "#c9c3b4" };

// u,v,z -> px with a free affine frame. a = px per +u, b = px per +v, zv = px per +z.
export const proj = (ox, oy, a, b, zv = [0, -42.3]) => (u, v, z = 0) => [ox + u * a[0] + v * b[0] + z * zv[0], oy + u * a[1] + v * b[1] + z * zv[1]];
export const stdProj = (u, v, z = 0) => P(u, v, z);
// pixel -> tile unit (ground plane) with the standard projection
export const uvOf = (x, y) => { const a = (x - CTS.X0) / CTS.S, b = (y - CTS.Y0) / (CTS.S * CTS.YS); return [(a + b) / 2, (b - a) / 2]; };
export const depthOf = (x, y) => { const [u, v] = uvOf(x, y); return u + v; };

const pl = (c, pts, close = true) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); if (close) c.closePath(); };

// ---------- solids in a free projection ----------
export function mbox(k, pr, u, v, z, du, dv, dz, col, o = {}) {
  const T = [[u, v, z + dz], [u + du, v, z + dz], [u + du, v + dv, z + dz], [u, v + dv, z + dz]].map((p) => pr(...p));
  const Lf = [[u, v + dv, z], [u + du, v + dv, z], [u + du, v + dv, z + dz], [u, v + dv, z + dz]].map((p) => pr(...p));
  const Rf = [[u + du, v, z], [u + du, v + dv, z], [u + du, v + dv, z + dz], [u + du, v, z + dz]].map((p) => pr(...p));
  const op = { wobble: o.wobble ?? 0, lw: o.lw ?? 1.3 };
  if (o.left !== null) k.path(Lf, { fill: o.left || shade(col, -0.05), ...op });
  if (o.right !== null) k.path(Rf, { fill: o.right || shade(col, -0.2), ...op });
  if (o.top !== false) k.path(T, { fill: o.top || shade(col, 0.07), ...op });
  const fp = (side, s, zz) => (side === "L" ? pr(u + s * du, v + dv, z + zz) : pr(u + du, v + dv - s * dv, z + zz));
  return { T, L: Lf, R: Rf, fp, pr, u, v, z, du, dv, dz };
}
// point on a box face: side L (runs +u, left->right) / R (runs -v from near corner, left->right); s 0..1, zz height above box base
export const facePt = (b, side, s, zz) => b.fp(side, s, zz);
// grid of windows on a face of a box returned by mbox
export function mwin(k, b, side, o = {}) {
  const c = k.ctx, rows = o.rows ?? 3, cols = o.cols ?? 4, mx = o.mx ?? 0.1, z0 = o.z0 ?? 0.25, z1 = o.z1 ?? b.dz - 0.2;
  const col = o.color || "#6f8cab", gap = o.gap ?? 0.28;
  const cw = (1 - mx * 2) / cols, rh = (z1 - z0) / rows;
  for (let r = 0; r < rows; r++) for (let ci = 0; ci < cols; ci++) {
    const s0 = mx + ci * cw + cw * gap / 2, s1 = mx + (ci + 1) * cw - cw * gap / 2, za = z0 + r * rh + rh * 0.14, zb = z0 + (r + 1) * rh - rh * 0.14;
    const q = [b.fp(side, s0, za), b.fp(side, s1, za), b.fp(side, s1, zb), b.fp(side, s0, zb)];
    const lit = o.lit && hash(r * 13.7 + ci * 5.3 + (o.seed || 0)) < o.lit;
    k.path(q, { fill: lit ? (o.litCol || "#f6dc86") : (side === "R" ? shade(col, -0.16) : col), wobble: 0, lw: o.lw ?? 1 });
    if (o.sheen && !lit) { c.beginPath(); c.moveTo(q[0][0] + (q[1][0] - q[0][0]) * 0.18, q[0][1] + (q[1][1] - q[0][1]) * 0.18); c.lineTo(q[3][0] + (q[2][0] - q[3][0]) * 0.55, q[3][1] + (q[2][1] - q[3][1]) * 0.55); c.strokeStyle = "rgba(255,255,255,0.35)"; c.lineWidth = 1; c.stroke(); }
  }
}
// horizontal band along a face (cornice, stripe)
export function mband(k, b, side, zA, zB, col, o = {}) {
  const s0 = o.s0 ?? 0, s1 = o.s1 ?? 1;
  k.path([b.fp(side, s0, zA), b.fp(side, s1, zA), b.fp(side, s1, zB), b.fp(side, s0, zB)], { fill: col, wobble: 0, lw: o.lw ?? 0.9 });
}
// affine "billboard": draws fn in local space (w x h local px, y down) onto the quad TL,TR,BL (px points)
export function quadDraw(k, TL, TR, BL, w, h, fn) {
  const c = k.ctx;
  c.save(); c.transform((TR[0] - TL[0]) / w, (TR[1] - TL[1]) / w, (BL[0] - TL[0]) / h, (BL[1] - TL[1]) / h, TL[0], TL[1]);
  fn(c, w, h); c.restore();
}
// a board on a box face: s0..s1 along the face, zA..zB height
export function faceDraw(k, b, side, s0, s1, zA, zB, w, h, fn) {
  const TL = b.fp(side, s0, zB), TR = b.fp(side, s1, zB), BL = b.fp(side, s0, zA);
  quadDraw(k, TL, TR, BL, w, h, fn);
}
// sign with text on a box face. text drawn centred, auto-fit.
const litFace = (k, ...a) => (k.night ? k.lit(() => faceDraw(k, ...a)) : faceDraw(k, ...a));
export function faceSign(k, b, side, s0, s1, zA, zB, text, o = {}) {
  const w = 100 * (o.ar ?? 1.6), h = 100;
  litFace(k, b, side, s0, s1, zA, zB, w, h, (c) => {
    c.fillStyle = o.bg || "#1f2a44"; c.fillRect(0, 0, w, h);
    if (o.border) { c.strokeStyle = o.border; c.lineWidth = 7; c.strokeRect(5, 5, w - 10, h - 10); }
    c.fillStyle = o.fg || "#fff"; c.font = `bold ${o.size ?? 62}px ${FONT}`; c.textAlign = "center"; c.textBaseline = "middle";
    if (o.vertical) { const ch = [...text]; const fs = Math.min(h / ch.length * 0.95, 70); c.font = `bold ${fs}px ${FONT}`; ch.forEach((g, i) => c.fillText(g, w / 2, h * (i + 0.5) / ch.length)); }
    else c.fillText(text, w / 2, h / 2 + 3, w * 0.94);
  });
}

// ---------- the Japanese roof ----------
export function goldOrn(k, x, y, s = 1, flip = 1) {
  const c = k.ctx;
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + flip * 5 * s, y - 2 * s, x + flip * 4 * s, y - 9 * s); c.quadraticCurveTo(x + flip * 1 * s, y - 13 * s, x - flip * 3 * s, y - 11 * s); c.quadraticCurveTo(x - flip * 1 * s, y - 7 * s, x - flip * 4 * s, y - 2 * s); c.closePath();
  c.fillStyle = PX.gold; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  c.fillStyle = "#fff0b0"; c.beginPath(); c.arc(x + flip * 1 * s, y - 7 * s, 1.1 * s, 0, 6.3); c.fill();
}
// hip roof with upswept eaves. returns {eave:{L:[],R:[]}, apex...}
export function mroof(k, pr, u, v, z, du, dv, h, o = {}) {
  const c = k.ctx, over = o.over ?? 0.45, lift = o.lift ?? 0.22, col = o.col || PX.roof;
  const e0u = u - over, e1u = u + du + over, e0v = v - over, e1v = v + dv + over;
  const alongU = du >= dv, a = o.hipIn ?? (Math.min(du, dv) / 2) * (o.hip ?? 1), vm = v + dv / 2, um = u + du / 2;
  const R0 = alongU ? [u + a, vm, z + h] : [um, v + a, z + h], R1 = alongU ? [u + du - a, vm, z + h] : [um, v + dv - a, z + h];
  const ez = z + (o.eaveDrop ?? 0);
  const eave = (A, B, n = 18) => { const out = []; for (let i = 0; i <= n; i++) { const s = i / n; const lf = lift * Math.pow(Math.abs(2 * s - 1), o.curve ?? 2.4); out.push([lerp(A[0], B[0], s), lerp(A[1], B[1], s), ez + lf, s]); } return out; };
  const EL = eave([e0u, e1v], [e1u, e1v]), ER = eave([e1u, e1v], [e1u, e0v]);
  const topL = alongU ? [R0, R1] : [R1, R1], topR = alongU ? [R1, R1] : [R1, R0];
  const plane = (E, top, shd) => {
    const eavePx = E.map((p) => pr(p[0], p[1], p[2]));
    const topPx = [pr(...top[0]), pr(...top[1])];
    const poly = [...eavePx, topPx[1], topPx[0]];
    const g = c.createLinearGradient(...topPx[0], ...eavePx[Math.floor(eavePx.length / 2)]);
    g.addColorStop(0, shade(col, shd + 0.12)); g.addColorStop(1, shade(col, shd - 0.04));
    k.path(poly, { fill: g, wobble: 0, lw: o.lw ?? 1.4 });
    c.save(); pl(c, poly); c.clip();
    c.strokeStyle = "rgba(20,26,38,0.38)"; c.lineWidth = 0.8; c.beginPath();
    const nrib = o.ribs ?? 22;
    for (let i = 1; i < nrib; i++) { const s = i / nrib, ei = Math.round(s * (E.length - 1)); const tp = [lerp(topPx[0][0], topPx[1][0], s), lerp(topPx[0][1], topPx[1][1], s)]; c.moveTo(...eavePx[ei]); c.lineTo(...tp); }
    c.stroke();
    c.strokeStyle = "rgba(235,240,250,0.2)"; c.beginPath();
    for (const f of [0.22, 0.44, 0.66, 0.84]) { E.forEach((p, i) => { const tp = [lerp(topPx[0][0], topPx[1][0], p[3]), lerp(topPx[0][1], topPx[1][1], p[3])]; const x = lerp(eavePx[i][0], tp[0], f), y = lerp(eavePx[i][1], tp[1], f); i ? c.lineTo(x, y) : c.moveTo(x, y); }); }
    c.stroke(); c.restore();
    return { eavePx, topPx };
  };
  const L = plane(EL, topL, -0.04), R = plane(ER, topR, -0.2);
  // hip + ridge caps
  const cap = (A, B, w) => { c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = w + 1.8; c.beginPath(); c.moveTo(...A); c.lineTo(...B); c.stroke(); c.strokeStyle = shade(col, 0.42); c.lineWidth = w; c.stroke(); };
  const cornerPx = pr(e1u, e1v, ez + lift);
  cap(cornerPx, pr(...R1), 3);
  if (alongU || true) { cap(pr(e0u, e1v, ez + lift), pr(...(alongU ? R0 : R1)), 2.4); cap(pr(e1u, e0v, ez + lift), pr(...(alongU ? R1 : R0)), 2.4); }
  if (!(a >= Math.min(du, dv) / 2 - 0.01 && Math.abs(du - dv) < 0.01)) cap(pr(...R0), pr(...R1), 3.4);
  // eave trim (red fascia + gold bosses)
  if (o.trim !== false) {
    const drop = o.trimH ?? 0.2;
    for (const E of [EL, ER]) {
      const top = E.map((p) => pr(p[0], p[1], p[2])), bot = E.map((p) => pr(p[0], p[1], p[2] - drop));
      k.path([...top, ...bot.reverse()], { fill: o.trimCol || PX.red, wobble: 0, lw: 1 });
      c.fillStyle = PX.gold; const nb = Math.round(E.length * (o.bosses ?? 1.0));
      for (let i = 0; i < nb; i++) { const p = E[Math.min(E.length - 1, Math.round((i / nb) * (E.length - 1)))]; const [x, y] = pr(p[0], p[1], p[2] - drop * 0.45); c.beginPath(); c.arc(x, y, 1.5, 0, 6.3); c.fill(); }
    }
  }
  if (o.orn !== false) { const [x0, y0] = pr(...R0), [x1, y1] = pr(...R1); goldOrn(k, x0, y0 + 1, o.ornS ?? 1.1, 1); goldOrn(k, x1, y1 + 1, o.ornS ?? 1.1, -1); }
  return { L, R, R0: pr(...R0), R1: pr(...R1), pr };
}

// ---------- lanterns, gates, small props ----------
import { glow as nightGlow } from "../../lib/night.js";
export function chochin(k, x, y, o = {}) {
  const c = k.ctx, t = k.t, r = o.r ?? 6, col = o.col || "#d9372b", sway = o.sway === false ? 0 : Math.sin(t * 1.6 + (o.seed || 0)) * (o.amp ?? 1.2);
  const cx = x + sway, ry = r * 1.18;
  if (o.glow) { const g = c.createRadialGradient(cx, y, 0, cx, y, r * 3); g.addColorStop(0, "rgba(255,190,90,0.38)"); g.addColorStop(1, "rgba(255,190,90,0)"); c.fillStyle = g; c.beginPath(); c.arc(cx, y, r * 3, 0, 6.3); c.fill(); }
  if (o.string !== false) { c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y - ry - (o.drop ?? 3)); c.lineTo(cx, y - ry); c.stroke(); }
  c.fillStyle = INK; c.fillRect(cx - r * 0.45, y - ry - 1.4, r * 0.9, 2.4); c.fillRect(cx - r * 0.45, y + ry - 1, r * 0.9, 2.4);
  c.beginPath(); c.ellipse(cx, y, r, ry, 0, 0, 6.3);
  const g = c.createRadialGradient(cx - r * 0.35, y - ry * 0.3, r * 0.1, cx, y, r * 1.1); g.addColorStop(0, shade(col, 0.28)); g.addColorStop(0.6, col); g.addColorStop(1, shade(col, -0.25));
  c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke();
  c.save(); c.beginPath(); c.ellipse(cx, y, r, ry, 0, 0, 6.3); c.clip();
  c.strokeStyle = "rgba(40,10,6,0.55)"; c.lineWidth = 0.7;
  for (let i = -3; i <= 3; i++) { c.beginPath(); c.ellipse(cx, y + i * ry * 0.28, r, r * 0.22, 0, 0, Math.PI); c.stroke(); }
  if (o.text) { c.fillStyle = o.textCol || "#2a1410"; c.font = `bold ${Math.max(6, r * 1.0)}px ${FONT}`; c.textAlign = "center"; c.textBaseline = "middle"; [...o.text].forEach((g2, i, a) => c.fillText(g2, cx, y + (i - (a.length - 1) / 2) * r * 0.95)); }
  c.restore();
  if (k.night) {
    // lit paper lantern: warm body, glyph stays dark, halo
    const w = 0.85 + 0.15 * Math.sin(t * 6 + (o.seed || 0) * 2.3);
    k.lit(() => {
      c.save(); c.beginPath(); c.ellipse(cx, y, r * 0.96, ry * 0.96, 0, 0, 6.3); c.clip();
      const g2 = c.createRadialGradient(cx, y, r * 0.1, cx, y, r * 1.1); g2.addColorStop(0, "#fff0b8"); g2.addColorStop(0.55, col === "#e8a53a" ? "#ffc25a" : "#ff6a3a"); g2.addColorStop(1, "#c8321e");
      c.globalAlpha = 0.9 * w; c.fillStyle = g2; c.fillRect(cx - r, y - ry, r * 2, ry * 2); c.globalAlpha = 1;
      c.strokeStyle = "rgba(90,20,8,0.5)"; c.lineWidth = 0.7;
      for (let i = -3; i <= 3; i++) { c.beginPath(); c.ellipse(cx, y + i * ry * 0.28, r, r * 0.22, 0, 0, Math.PI); c.stroke(); }
      if (o.text) { c.fillStyle = "#3a0e08"; c.font = `bold ${Math.max(6, r * 1.0)}px ${FONT}`; c.textAlign = "center"; c.textBaseline = "middle"; [...o.text].forEach((g3, i, a) => c.fillText(g3, cx, y + (i - (a.length - 1) / 2) * r * 0.95)); }
      c.restore();
    });
    nightGlow(c, cx, y, r * (o.glow ? 3.6 : 2.6), "#ff9a4a", 0.55 * w);
  }
}
// string of lanterns hanging between two px points
export function lanternString(k, A, B, n, o = {}) {
  const c = k.ctx, sag = o.sag ?? 9;
  c.strokeStyle = INK; c.lineWidth = 1; c.beginPath();
  for (let i = 0; i <= 16; i++) { const s = i / 16, x = lerp(A[0], B[0], s), y = lerp(A[1], B[1], s) + Math.sin(s * Math.PI) * sag; i ? c.lineTo(x, y) : c.moveTo(x, y); }
  c.stroke();
  for (let i = 0; i < n; i++) { const s = (i + 0.5) / n, x = lerp(A[0], B[0], s), y = lerp(A[1], B[1], s) + Math.sin(s * Math.PI) * sag; chochin(k, x, y + (o.r ?? 4) * 1.3, { r: o.r ?? 4, seed: i + (o.seed || 0), glow: o.glow, amp: 0.8, string: false, col: o.col }); }
}

// stone toro lantern
export function toro(k, u, v, o = {}) {
  const h = o.h ?? 1.0, st = "#c4beb0", c = k.ctx, t = k.t;
  k.ell(u + 0.12, v + 0.06, 0, 0.3, "rgba(60,45,30,0.15)", { stroke: false });
  k.box(u - 0.2, v - 0.2, 0, 0.4, 0.4, 0.1 * h, st, { hatch: false, shadow: false });
  k.cyl(u, v, 0.1 * h, 0.075, 0.38 * h, "#bdb6a6");
  k.box(u - 0.19, v - 0.19, 0.48 * h, 0.38, 0.38, 0.06 * h, st, { hatch: false, shadow: false });
  const fb = k.box(u - 0.12, v - 0.12, 0.54 * h, 0.24, 0.24, 0.22 * h, st, { hatch: false, shadow: false, top: false });
  const lit = 0.75 + 0.25 * Math.sin(t * 5 + u * 7 + v);
  const [x, y] = P(u, v + 0.12, 0.6 * h); c.fillStyle = `rgba(255,${Math.round(190 + 30 * lit)},110,${0.5 + 0.4 * lit})`; c.fillRect(x - 3, y - 4, 6, 7);
  c.strokeStyle = INK; c.lineWidth = 0.9; c.strokeRect(x - 3, y - 4, 6, 7);
  if (k.night) {
    k.lit(() => { c.fillStyle = "rgba(255,214,130,0.97)"; c.fillRect(x - 3, y - 4, 6, 7); });
    k.glow(u, v + 0.1, 0.62 * h, 0.95, "#ffb860", 0.7 * (0.85 + 0.15 * Math.sin(t * 5 + u * 7 + v)));
    k.glow(u, v, 0.02, 1.5, "#ffb860", 0.3, { flat: true });
  }
  k.hip(u - 0.3, v - 0.3, 0.76 * h, 0.6, 0.6, 0.26 * h, "#9a958a", { inset: 0.16 });
  const [jx, jy] = P(u, v, 1.04 * h); k.circle(jx, jy, 2, "#b9b2a2", { lw: 0.9 });
}
// torii gate. along 'u': beams run along u (seen on the L face), pillars at v. size w x h units
export function torii(k, u, v, o = {}) {
  const along = o.along || "v", w = o.w ?? 2.2, h = o.h ?? 2.4, col = o.col || "#d6452e", c = k.ctx, pw = o.pw ?? 0.13;
  const A = (s, d, z) => (along === "u" ? P(u + s, v + d, z) : P(u + d, v + s, z));
  const pillar = (s) => {
    const base = A(s, 0, 0), top = A(s, 0, h * 0.86), bt = A(s, 0, h * 0.86);
    const rx = pw * CTS.S * 1.4;
    const g = c.createLinearGradient(base[0] - rx, 0, base[0] + rx, 0); g.addColorStop(0, shade(col, 0.06)); g.addColorStop(1, shade(col, -0.25));
    c.beginPath(); c.moveTo(base[0] - rx * 1.1, base[1]); c.lineTo(top[0] - rx * 0.92, top[1]); c.lineTo(top[0] + rx * 0.92, top[1]); c.lineTo(base[0] + rx * 1.1, base[1]); c.closePath(); c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke();
    c.beginPath(); c.ellipse(base[0], base[1], rx * 1.3, rx * 0.6, 0, 0, 6.3); c.fillStyle = "#2c2824"; c.fill();
  };
  k.ell(u + (along === "u" ? w / 2 : 0.15), v + (along === "u" ? 0.15 : w / 2), 0, w * 0.45, "rgba(60,45,30,0.12)", { stroke: false });
  pillar(0.02); pillar(w - 0.02);
  // nuki (lower tie beam)
  const nz = h * 0.66, nb = (z0, z1) => k.path([A(-0.12, 0, z0), A(w + 0.12, 0, z0), A(w + 0.12, 0, z1), A(-0.12, 0, z1)], { fill: col, wobble: 0, lw: 1.2 });
  nb(nz, nz + 0.17);
  // shimaki + kasagi (curved top beam)
  const zt = h * 0.86, lf = 0.17;
  const topEdge = [], botEdge = [];
  for (let i = 0; i <= 14; i++) { const s = -0.42 + (w + 0.84) * (i / 14), e = Math.pow(Math.abs(2 * i / 14 - 1), 2.4) * lf; topEdge.push(A(s, 0, zt + 0.3 + e)); botEdge.push(A(s, 0, zt + 0.05 + e * 0.6)); }
  k.path([...topEdge, ...botEdge.reverse()], { fill: "#2b2623", wobble: 0, lw: 1.2 });
  const kb = []; for (let i = 0; i <= 14; i++) { const s = -0.3 + (w + 0.6) * (i / 14), e = Math.pow(Math.abs(2 * i / 14 - 1), 2.4) * lf * 0.8; kb.push(A(s, 0, zt + 0.05 + e * 0.5)); }
  const kb2 = kb.map((p) => [p[0], p[1] + 5]);
  k.path([...kb, ...kb2.reverse()], { fill: col, wobble: 0, lw: 1.2 });
  if (o.plaque) { const [x, y] = A(w / 2, 0, h * 0.78); c.fillStyle = "#1f3a30"; c.fillRect(x - 6, y - 7, 12, 14); c.strokeStyle = PX.gold; c.lineWidth = 1; c.strokeRect(x - 6, y - 7, 12, 14); }
}

// vending machine: dir "L" shows its front on the L face (faces +v), "R" on the R face (faces +u)
export function vending(k, u, v, o = {}) {
  const side = o.side || "L", col = o.col || "#d8392f", W = 0.42, D = 0.34, H = 0.98;
  const b = mbox(k, stdProj, u, v, 0, side === "L" ? W : D, side === "L" ? D : W, H, col, { wobble: 0, top: shade(col, 0.12) });
  const rows = 3, cols = 3, c = k.ctx;
  const pal = o.pal || ["#f4c542", "#4aa3d8", "#e8607a", "#7cc47a", "#f08a3c", "#ffffff"];
  faceDraw(k, b, side, 0.1, 0.9, 0.12, 0.82, 80, 100, (g, w, h) => {
    g.fillStyle = "#fbf6e8"; g.fillRect(0, 0, w, h * 0.62);
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) { g.fillStyle = pal[Math.floor(hash(r * 7 + q * 3 + (o.seed || 0) + u * 5) * pal.length)]; g.fillRect(4 + q * 25, 5 + r * 19, 19, 15); }
    g.fillStyle = "#2a2420"; g.fillRect(8, h * 0.68, w * 0.7, h * 0.12);
    const gl = (Math.sin(k.t * 3 + u * 9) * 0.5 + 0.5); g.fillStyle = `rgba(255,255,255,${0.1 + gl * 0.18})`; g.fillRect(0, 0, w, h * 0.62);
    g.fillStyle = "#e9e3d0"; g.fillRect(w * 0.78, h * 0.68, w * 0.16, h * 0.14);
  });
  return b;
}
// small rooftop clutter: A/C units, water tank, antennas
export function acUnit(k, pr, u, v, z, o = {}) {
  const s = o.s ?? 0.34, b = mbox(k, pr, u, v, z, s, s * 0.75, s * 0.7, "#dcd8d0", { wobble: 0, lw: 1 });
  const c = k.ctx, [x, y] = pr(u + s / 2, v + s * 0.4, z + s * 0.7), rot = k.t * 9 + u * 3;
  c.beginPath(); c.ellipse(x, y, s * 14, s * 7, 0, 0, 6.3); c.fillStyle = "#6c7480"; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
  c.beginPath(); c.moveTo(x - Math.cos(rot) * s * 12, y - Math.sin(rot) * s * 6); c.lineTo(x + Math.cos(rot) * s * 12, y + Math.sin(rot) * s * 6); c.moveTo(x - Math.sin(rot) * s * 12, y + Math.cos(rot) * s * 6); c.lineTo(x + Math.sin(rot) * s * 12, y - Math.cos(rot) * s * 6); c.stroke();
}
export function antenna(k, x, y, hgt, o = {}) {
  const c = k.ctx; c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - hgt); c.stroke();
  c.beginPath(); c.moveTo(x - 4, y - hgt * 0.7); c.lineTo(x + 4, y - hgt * 0.7); c.moveTo(x - 3, y - hgt * 0.85); c.lineTo(x + 3, y - hgt * 0.85); c.stroke();
  if (o.light) { const on = Math.sin(k.t * 3 + (o.seed || 0)) > 0; c.fillStyle = on ? "#ff4a3a" : "#7a2a24"; c.beginPath(); c.arc(x, y - hgt, 1.8, 0, 6.3); c.fill(); }
}
export function bollard(k, u, v, col = "#4a4f57") {
  const [x, y] = P(u, v, 0), c = k.ctx;
  c.fillStyle = "rgba(60,45,30,0.15)"; c.beginPath(); c.ellipse(x + 3, y + 1, 5, 2, 0, 0, 6.3); c.fill();
  c.beginPath(); c.roundRect(x - 3, y - 15, 6, 15, 2.5); c.fillStyle = col; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  c.fillStyle = "#e8e2d0"; c.fillRect(x - 3, y - 11, 6, 2);
}
export function planter(k, u, v, du, dv, o = {}) {
  k.box(u, v, 0, du, dv, 0.3, o.col || "#a5927a", { hatch: false, shadow: false });
  k.hedge(u + 0.05, v + 0.05, du - 0.1, dv - 0.1, { h: 0.35, col: o.leaf || "#6f9e52" });
}

// falling petals / leaves over a px box, deterministic in t
export function petals(k, x0, y0, x1, y1, n, o = {}) {
  const c = k.ctx, t = k.t, col = o.col || "#f7bccb";
  for (let i = 0; i < n; i++) {
    const h1 = hash(i * 1.37 + (o.seed || 0)), h2 = hash(i * 7.11 + 3 + (o.seed || 0)), T = (o.T ?? 7) * (0.7 + h2 * 0.6);
    const f = ((t / T + h1) % 1 + 1) % 1;
    const x = x0 + (x1 - x0) * h2 + Math.sin(t * 1.3 + h1 * 12) * 9 + f * (o.drift ?? 26), y = y0 + (y1 - y0) * f;
    const rot = t * 2 + i, a = Math.min(1, f * 6, (1 - f) * 4);
    c.save(); c.translate(x, y); c.rotate(rot); c.globalAlpha = a * 0.95; c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, 2.6, 1.5 + Math.sin(t * 5 + i) * 0.6, 0, 0, 6.3); c.fill(); c.restore();
  }
  c.globalAlpha = 1;
}
export function smoke(k, x, y, o = {}) {
  const c = k.ctx, t = k.t, n = o.n ?? 8, H = o.h ?? 60, col = o.col || "255,255,255";
  for (let i = 0; i < n; i++) {
    const f = (((t * (o.speed ?? 0.3) + i / n) % 1) + 1) % 1;
    const px = x + Math.sin(f * 6 + i * 1.7 + t * 0.6) * (6 + f * 14) + (o.wind ?? 8) * f, py = y - f * H, r = (o.r ?? 4) + f * (o.grow ?? 8);
    c.fillStyle = `rgba(${col},${(1 - f) * (o.a ?? 0.55) * Math.min(1, f * 8)})`; c.beginPath(); c.arc(px, py, r, 0, 6.3); c.fill();
  }
}
export function sakura(k, u, v, o = {}) { k.tree(u, v, { r: o.r ?? 0.95, h: o.h ?? 1.7, seed: o.seed ?? 3, col: o.col || "#f2b3c7", ...o }); }

// ---------- crowds ----------
export const KIMONO = ["#c9567a", "#6a5aa8", "#e29a4a", "#4a8f8a", "#d96a5a", "#7a9fd0"];
export function walkersOn(k, routes, specs, base = {}) {
  for (const [ri, off, seed, extra] of specs) {
    const r = routes[ri];
    k.qwalker(r, { speed: 0.42 + (seed % 5) * 0.03, offset: off, seed, dwell: 1.0 + (seed % 3) * 0.6, ...base, ...(extra || {}) });
  }
}
// dev check: how many sampled route points fall inside obstacle rects [u0,v0,u1,v1]
export function checkRoutes(name, routes, obst, spline) {
  const bad = [];
  routes.forEach((r, i) => { const sp = spline(r, false); for (let d = 0; d <= sp.L; d += 0.05) { const s = sp.sample(d); for (const o of obst) if (s.u > o[0] && s.u < o[2] && s.v > o[1] && s.v < o[3]) { bad.push(`${name} route ${i} @ ${s.u.toFixed(2)},${s.v.toFixed(2)} in ${o.join(",")}`); d = sp.L; break; } } });
  return bad;
}

// ---------- city blocks ----------
// a windowed building with cornice, rooftop kit and optional signs. returns the box.
export function building(k, u, v, du, dv, h, o = {}) {
  const col = o.col || "#e4d9c4", c = k.ctx;
  const b = mbox(k, stdProj, u, v, o.z ?? 0, du, dv, h, col, { wobble: 0, left: o.left, right: o.right });
  const z0 = o.z ?? 0;
  const floors = Math.max(2, Math.round(h / (o.fh ?? 0.62)));
  if (o.glass) { for (const side of ["L", "R"]) mband(k, b, side, 0.02, h - 0.02, o.glass, { s0: 0.04, s1: 0.96 }); }
  const mk = (side, run) => mwin(k, b, side, { rows: floors - (o.groundShop ? 1 : 0), cols: Math.max(2, Math.round(run / (o.cw ?? 0.55))), z0: o.groundShop ? 0.95 : 0.25, z1: h - 0.18, color: o.win || "#9ab2cc", lit: o.lit ?? 0.35, seed: o.seed ?? Math.round(u * 7 + v * 3), litCol: o.litCol, sheen: true, gap: o.gap ?? 0.3, mx: 0.07 });
  mk("L", du); mk("R", dv);
  for (const side of ["L", "R"]) { mband(k, b, side, h - 0.12, h, shade(col, -0.12)); if (o.floorLines) for (let i = 1; i < floors; i++) mband(k, b, side, i * h / floors - 0.02, i * h / floors + 0.02, shade(col, -0.16), { lw: 0.5 }); }
  if (o.roof !== false) {
    const R = rng(Math.round(u * 31 + v * 17 + 5)), n = o.ac ?? 2;
    for (let i = 0; i < n; i++) acUnit(k, stdProj, u + 0.15 + R() * Math.max(0.1, du - 0.65), v + 0.15 + R() * Math.max(0.1, dv - 0.55), z0 + h, { s: 0.3 + R() * 0.12 });
    if (o.antenna) { const [x, y] = P(u + du * 0.3, v + dv * 0.3, z0 + h); antenna(k, x, y, o.antenna, { light: true, seed: u }); }
    if (o.tank) { const [x, y] = P(u + du * 0.6, v + dv * 0.5, z0 + h); k.ctx.fillStyle = "#8a4a2a"; k.ctx.strokeStyle = INK; k.ctx.lineWidth = 1; k.ctx.fillRect(x - 6, y - 24, 12, 16); k.ctx.strokeRect(x - 6, y - 24, 12, 16); k.path([[x - 8, y - 24], [x + 8, y - 24], [x, y - 32]], { fill: "#5b3a22", wobble: 0, lw: 1 }); for (const dx of [-5, 5]) { k.ctx.beginPath(); k.ctx.moveTo(x + dx, y - 8); k.ctx.lineTo(x + dx, y); k.ctx.stroke(); } }
  }
  return b;
}
// animated colourful "big screen" content, drawn on a face
export function screenFace(k, b, side, s0, s1, zA, zB, o = {}) {
  const t = k.t, w = 160, h = 100, pal = o.pal || [["#f26b8a", "#f7b267"], ["#4cc9c0", "#7a5cf0"], ["#ffd23f", "#ee6c4d"]];
  faceDraw(k, b, side, s0, s1, zA, zB, w, h, (c) => {
    const ph = Math.floor(t / (o.dur ?? 3.2)), f = (t / (o.dur ?? 3.2)) % 1, [A, B] = pal[ph % pal.length];
    const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, A); g.addColorStop(1, B); c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) { const px = ((i * 53 + t * (18 + i * 6)) % (w + 60)) - 30, py = h * (0.2 + 0.2 * i) + Math.sin(t * 1.4 + i) * 10; c.fillStyle = `rgba(255,255,255,${0.18 + 0.1 * i})`; c.beginPath(); c.arc(px, py, 18 + 6 * i, 0, 6.3); c.fill(); }
    c.fillStyle = "rgba(255,255,255,0.92)"; c.font = `bold 34px ${FONT}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(o.text ? o.text[ph % o.text.length] : "", w / 2 + Math.sin(f * 6.28) * 6, h / 2);
    c.fillStyle = "rgba(255,255,255,0.07)"; for (let y = 0; y < h; y += 4) c.fillRect(0, y, w, 1);
  });
}
// blinking neon board
export function neon(k, b, side, s0, s1, zA, zB, text, o = {}) {
  const t = k.t, on = o.blink ? (Math.sin(t * (o.rate ?? 5) + (o.seed || 0)) > -0.35 ? 1 : 0.35) : 1;
  litFace(k, b, side, s0, s1, zA, zB, 100 * (o.ar ?? 1.3), 100, (c, w, h) => {
    c.fillStyle = o.bg || "#18132b"; c.fillRect(0, 0, w, h);
    c.strokeStyle = o.col || "#ff4fa0"; c.globalAlpha = on; c.lineWidth = 5; c.strokeRect(6, 6, w - 12, h - 12);
    c.shadowColor = o.col || "#ff4fa0"; c.shadowBlur = 12; c.fillStyle = o.fg || "#fff"; c.font = `bold ${o.size ?? 58}px ${FONT}`; c.textAlign = "center"; c.textBaseline = "middle";
    if (o.vertical) { const ch = [...text]; const fs = Math.min(h / ch.length * 0.95, 64); c.font = `bold ${fs}px ${FONT}`; ch.forEach((g, i) => c.fillText(g, w / 2, h * (i + 0.5) / ch.length)); } else c.fillText(text, w / 2, h / 2 + 2, w * 0.9);
    c.globalAlpha = 1;
  });
}
// a car in std iso that follows an (u,v) route loop; dir inferred
export function carAt(k, u, v, dir, col, o = {}) { k.car(u, v, dir, col, o); }
// train of boxy cars along u or v, head at (u,v). axis 'u'|'v', sign +1/-1 heading. returns nothing
export function train(k, u0, v0, axis, sign, n, o = {}) {
  const L = o.len ?? 1.7, W = o.wid ?? 0.78, H = o.h ?? 0.8, z = o.z ?? 0, c = k.ctx;
  for (let i = n - 1; i >= 0; i--) {
    const off = -sign * i * (L + 0.04), cu = axis === "u" ? u0 + off - L / 2 : u0 - W / 2, cv = axis === "v" ? v0 + off - L / 2 : v0 - W / 2;
    const du = axis === "u" ? L : W, dv = axis === "v" ? L : W;
    const b = mbox(k, stdProj, cu, cv, z, du, dv, H, o.col || "#f4f6f8", { wobble: 0 });
    const side = axis === "u" ? "L" : "R";
    mband(k, b, side, H * 0.24, H * 0.36, o.stripe || "#2457a6", { s0: 0, s1: 1 });
    mwin(k, b, side, { rows: 1, cols: 6, z0: H * 0.5, z1: H * 0.9, color: "#3b4a66", gap: 0.2, mx: 0.05, lit: o.lit ?? 0.3, seed: i });
  }
}
