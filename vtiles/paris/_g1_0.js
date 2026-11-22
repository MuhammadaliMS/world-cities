// PARIS 1,0 grid helpers: the Arc de Triomphe (axis-aligned, all through P()), flame, cars. Copied from the old 1_0.js.
import { P, INK, shade, lerp, clamp, rng, spline } from "../../lib/vec-kit.js";
import { cobbles } from "./_props.js";
export const CX = 5.1, CY = 5.3;
const U0 = 3.6, U1 = 6.6, V0 = 3.6, V1 = 7.0;
const SAND = "#e9c98c", SANDL = "#efd6a0", SANDR = "#cfab6b";
// ---------- the arch ----------
const ZB = 3.95; // top of the pier body (springing of the entablature)
const QR = (v, z, o = 0) => P(U1 + o, v, z), QL = (u, z, o = 0) => P(u, V1 + o, z);
const AR = { s: 5.85, w: 0.8, sz: 2.9, r: 0.85 }, AL = { s: 4.25, w: 0.46, sz: 2.2, r: 0.5 };
const archPts = (Q, a, extra = 0, n = 18) => { const o = []; for (let i = 0; i <= n; i++) { const t = Math.PI - (i / n) * Math.PI; o.push(Q(a.s + Math.cos(t) * (a.w + extra), a.sz + Math.sin(t) * (a.r + extra))); } return o; };
const archPath = (c, Q, a, extra = 0) => { c.moveTo(...Q(a.s - a.w - extra, 0)); c.lineTo(...Q(a.s - a.w - extra, a.sz)); archPts(Q, a, extra).forEach((p) => c.lineTo(...p)); c.lineTo(...Q(a.s + a.w + extra, 0)); c.closePath(); };
const poly = (c, pts, fill, stroke, lw = 0.8) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); } };
const BR = "rgba(70,45,15,0.75)";

// carved relief: a recessed panel with rows of tiny soldiers / horses
function frieze(k, Q, s0, s1, z0, z1, seed, base, rows = 2, step = 0.095) {
  const c = k.ctx, R = rng(seed);
  poly(c, [Q(s0, z0), Q(s1, z0), Q(s1, z1), Q(s0, z1)], shade(base, -0.2), BR, 1);
  poly(c, [Q(s0 + 0.04, z0 + 0.04), Q(s1 - 0.04, z0 + 0.04), Q(s1 - 0.04, z1 - 0.04), Q(s0 + 0.04, z1 - 0.04)], shade(base, -0.07), "rgba(70,45,15,0.5)", 0.6);
  for (let r = 0; r < rows; r++) {
    const zc = lerp(z0 + 0.06, z1 - 0.06, (r + 0.15) / rows), hh = ((z1 - z0) / rows) * 0.62;
    for (let s = s0 + 0.08; s < s1 - 0.08; s += step * (0.8 + R() * 0.5)) {
      const [x, y] = Q(s, zc + hh * 0.4), [x2, y2] = Q(s, zc);
      c.fillStyle = shade(base, 0.18 + R() * 0.12); c.strokeStyle = BR; c.lineWidth = 0.5;
      c.beginPath(); c.ellipse(x, (y + y2) / 2, 1.5, Math.abs(y2 - y) / 2 + 1.2, 0, 0, 7); c.fill(); c.stroke();
      c.beginPath(); c.arc(x, y - Math.abs(y2 - y) / 2 - 2.2, 1.2, 0, 7); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(x + 2, y2 + 1); c.lineTo(x + 2.5 + R(), y - 7 - R() * 3); c.lineWidth = 0.6; c.stroke();
    }
  }
}
// big sculpture group on a plinth inside a tall panel (La Marseillaise & co)
function sculpt(k, Q, s0, s1, z0, z1, seed, base) {
  const c = k.ctx, R = rng(seed), m = (s0 + s1) / 2;
  poly(c, [Q(s0, z0), Q(s1, z0), Q(s1, z1), Q(s0, z1)], shade(base, -0.22), BR, 1.1);
  poly(c, [Q(s0 + 0.05, z0 + 0.5), Q(s1 - 0.05, z0 + 0.5), Q(s1 - 0.05, z1 - 0.05), Q(s0 + 0.05, z1 - 0.05)], shade(base, -0.1), "rgba(70,45,15,0.45)", 0.6);
  // plinth with a moulded cap
  poly(c, [Q(s0 - 0.03, z0), Q(s1 + 0.03, z0), Q(s1 + 0.03, z0 + 0.48), Q(s0 - 0.03, z0 + 0.48)], shade(base, 0.04), BR, 1);
  poly(c, [Q(s0 - 0.06, z0 + 0.48), Q(s1 + 0.06, z0 + 0.48), Q(s1 + 0.06, z0 + 0.56), Q(s0 - 0.06, z0 + 0.56)], shade(base, 0.14), BR, 0.8);
  c.save(); poly(c, [Q(s0 + 0.05, z0 + 0.5), Q(s1 - 0.05, z0 + 0.5), Q(s1 - 0.05, z1 - 0.05), Q(s0 + 0.05, z1 - 0.05)], null, null); c.clip(); c.strokeStyle = "rgba(70,45,15,0.16)"; c.lineWidth = 0.6; c.beginPath(); for (let z = z0 + 0.55; z < z1; z += 0.07) { c.moveTo(...Q(s0, z)); c.lineTo(...Q(s1, z + 0.05)); } c.stroke(); c.restore();
  const w = s1 - s0, zb = z0 + 0.6, zh = z1 - zb;
  const fig = (s, z, sc, arms, tone) => {
    const [x, y] = Q(s, z); const S = sc * 16;
    c.fillStyle = shade(base, tone); c.strokeStyle = BR; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(x - S * 0.45, y); c.quadraticCurveTo(x - S * 0.5, y - S * 1.5, x - S * 0.12, y - S * 2.0); c.lineTo(x + S * 0.12, y - S * 2.0); c.quadraticCurveTo(x + S * 0.5, y - S * 1.5, x + S * 0.45, y); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.arc(x, y - S * 2.35, S * 0.3, 0, 7); c.fill(); c.stroke();
    c.lineWidth = Math.max(1.4, S * 0.18); c.lineCap = "round";
    for (const sg of arms) { c.beginPath(); c.moveTo(x + sg * S * 0.25, y - S * 1.8); c.lineTo(x + sg * S * (0.7 + R() * 0.4), y - S * (2.5 + R() * 0.8)); c.stroke(); }
    c.lineCap = "butt";
  };
  // wings of the winged figure
  const [wx, wy] = Q(m, zb + zh * 0.55);
  c.fillStyle = shade(base, 0.2); c.strokeStyle = BR; c.lineWidth = 0.8;
  for (const sg of [-1, 1]) { c.beginPath(); c.moveTo(wx, wy + 4); c.quadraticCurveTo(wx + sg * 30, wy - 26, wx + sg * 22, wy - 48); c.quadraticCurveTo(wx + sg * 8, wy - 28, wx, wy - 14); c.closePath(); c.fill(); c.stroke(); }
  fig(s0 + w * 0.2, zb + 0.05, 0.9, [-1], 0.02 + R() * 0.1); fig(s1 - w * 0.2, zb + 0.05, 0.9, [1], 0.05 + R() * 0.1);
  fig(m - w * 0.08, zb + 0.35, 1.15, [-1, 1], 0.16);
  fig(s0 + w * 0.32, zb + 0.9, 0.7, [1], 0.0); fig(s1 - w * 0.3, zb + 1.0, 0.7, [-1], 0.1);
  c.fillStyle = shade(base, 0.12); c.beginPath(); c.ellipse(...Q(m, zb + zh * 0.2), 3, 7, 0.3, 0, 7); c.fill(); c.stroke();
}
function dentils(c, Q, s0, s1, z, h, step = 0.1, col = "rgba(70,45,15,0.8)") {
  c.fillStyle = col; for (let s = s0; s < s1 - 0.05; s += step) poly(c, [Q(s, z), Q(s + step * 0.5, z), Q(s + step * 0.5, z - h), Q(s, z - h)], col);
}
function shields(k, Q, s0, s1, z, base, n) {
  const c = k.ctx;
  for (let i = 0; i < n; i++) {
    const s = lerp(s0, s1, (i + 0.5) / n), [x, y] = Q(s, z), rx = 4.6, ry = 5.6;
    c.fillStyle = shade(base, 0.32); c.strokeStyle = BR; c.lineWidth = 0.9; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); c.stroke();
    c.fillStyle = shade(base, -0.12); c.beginPath(); c.ellipse(x, y, rx * 0.62, ry * 0.62, 0, 0, 7); c.fill(); c.lineWidth = 0.6; c.stroke();
    c.fillStyle = shade(base, 0.4); c.beginPath(); c.arc(x, y - 0.5, 1.3, 0, 7); c.fill();
  }
}
function crest(k, Q, s0, s1, z, base) {
  const c = k.ctx; c.fillStyle = shade(base, 0.22); c.strokeStyle = BR; c.lineWidth = 0.7;
  for (let s = s0 + 0.05; s < s1 - 0.05; s += 0.15) { const [x, y] = Q(s, z); c.beginPath(); c.moveTo(x - 4, y); c.quadraticCurveTo(x - 4, y - 7, x, y - 7); c.quadraticCurveTo(x + 4, y - 7, x + 4, y); c.closePath(); c.fill(); c.stroke(); }
}
// stacked ornamental layer of the entablature; o = projection from the pier footprint
function layer(k, o, z0, z1, kind) {
  const u0 = U0 - o, v0 = V0 - o, du = U1 - U0 + 2 * o, dv = V1 - V0 + 2 * o, c = k.ctx;
  const cl = shade(SANDL, kind === "cornice" ? 0.04 : 0), cr = shade(SANDR, kind === "cornice" ? 0.04 : 0);
  k.box(u0, v0, z0, du, dv, z1 - z0, SAND, { hatch: false, shadow: false, left: cl, right: cr, top: shade(SAND, 0.14) });
  c.strokeStyle = "rgba(70,45,15,0.45)"; c.lineWidth = 0.8;
  const QRo = (v, z) => QR(v, z, o), QLo = (u, z) => QL(u, z, o);
  return { QRo, QLo, ur: [v0, v0 + dv], ul: [u0, u0 + du] };
}
export function archFaces(k, t) {
  const c = k.ctx;
  // ---------- pier body: R face (u = U1) and L face (v = V1), holes cut for the passages ----------
  c.beginPath(); c.moveTo(...QR(V1, 0)); c.lineTo(...QR(V0, 0)); c.lineTo(...QR(V0, ZB)); c.lineTo(...QR(V1, ZB)); c.closePath(); archPath(c, QR, AR);
  c.fillStyle = SANDR; c.fill("evenodd"); c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
  c.beginPath(); c.moveTo(...QL(U0, 0)); c.lineTo(...QL(U1, 0)); c.lineTo(...QL(U1, ZB)); c.lineTo(...QL(U0, ZB)); c.closePath(); archPath(c, QL, AL);
  c.fillStyle = SANDL; c.fill("evenodd"); c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
  // ashlar courses with staggered joints
  const courses = (Q, sa, sb, a, col, seed) => {
    const R = rng(seed); c.strokeStyle = col; c.lineWidth = 0.6; c.beginPath();
    for (let z = 0.3, i = 0; z < ZB - 0.05; z += 0.3, i++) { c.moveTo(...Q(sa, z)); c.lineTo(...Q(sb, z)); for (let s = sa + 0.25 + (i % 2) * 0.22; s < sb - 0.1; s += 0.44) c.moveTo(...Q(s, z)), c.lineTo(...Q(s, z - 0.3)); }
    c.stroke();
  };
  c.save(); c.beginPath(); c.moveTo(...QR(V1, 0)); c.lineTo(...QR(V0, 0)); c.lineTo(...QR(V0, ZB)); c.lineTo(...QR(V1, ZB)); c.closePath(); archPath(c, QR, AR); c.clip("evenodd"); courses(QR, V0, V1, AR, "rgba(90,60,25,0.17)", 3); c.restore();
  c.save(); c.beginPath(); c.moveTo(...QL(U0, 0)); c.lineTo(...QL(U1, 0)); c.lineTo(...QL(U1, ZB)); c.lineTo(...QL(U0, ZB)); c.closePath(); archPath(c, QL, AL); c.clip("evenodd"); courses(QL, U0, U1, AL, "rgba(140,100,40,0.2)", 4); c.restore();
  // plinth band (stepped base) along the piers
  for (const [Q, s0, s1, col] of [[QR, V0, AR.s - AR.w - 0.06, SANDR], [QR, AR.s + AR.w + 0.06, V1, SANDR], [QL, U0, AL.s - AL.w - 0.06, SANDL], [QL, AL.s + AL.w + 0.06, U1, SANDL]]) {
    poly(c, [Q(s0, 0), Q(s1, 0), Q(s1, 0.32), Q(s0, 0.32)], shade(col, -0.1), INK, 0.9);
    poly(c, [Q(s0, 0.32), Q(s1, 0.32), Q(s1, 0.4), Q(s0, 0.4)], shade(col, 0.12), "rgba(70,45,15,0.7)", 0.7);
  }
  // archivolts (3 mouldings), coffered intrados, keystone, spandrel victories
  for (const [Q, a, col] of [[QR, AR, SANDR], [QL, AL, SANDL]]) {
    for (const [ex0, lw, f] of [[0.04, 2.0, -0.05], [0.12, 3.4, 0.18], [0.2, 1.4, 0.0]]) { const ex = ex0 * (a === AL ? 0.5 : 1); c.beginPath(); archPts(Q, a, ex).forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.strokeStyle = INK; c.lineWidth = lw + 1.2; c.stroke(); c.strokeStyle = shade(col, f + 0.1); c.lineWidth = lw; c.stroke(); }
    const n = 13, pr = archPts(Q, a, -0.075, n);
    for (let i = 1; i < n; i++) { const [x, y] = pr[i]; c.fillStyle = "rgba(60,40,15,0.55)"; c.fillRect(x - 1.5, y - 1.5, 3, 3); }
    const [kx, ky] = Q(a.s, a.sz + a.r + 0.2); c.fillStyle = shade(col, 0.25); c.strokeStyle = BR; c.lineWidth = 0.8; c.beginPath(); c.moveTo(kx - 5, ky + 3); c.lineTo(kx - 3.5, ky - 8); c.lineTo(kx + 3.5, ky - 8); c.lineTo(kx + 5, ky + 3); c.closePath(); c.fill(); c.stroke();
  }
  // spandrel victories (R big arch) as winged figures
  for (const sg of [-1, 1]) {
    const [x, y] = QR(AR.s + sg * 0.88, 3.45), base = SANDR; c.fillStyle = shade(base, 0.2); c.strokeStyle = BR; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(x - 4, y + 9); c.quadraticCurveTo(x - 7, y - 4, x, y - 6); c.quadraticCurveTo(x + 7, y - 4, x + 4, y + 9); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.arc(x, y - 9, 2.6, 0, 7); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(x, y - 1); c.quadraticCurveTo(x + sg * 15, y - 14, x + sg * 12, y - 20); c.quadraticCurveTo(x + sg * 5, y - 12, x, y - 5); c.fill(); c.stroke();
  }
  // pier panels: sculpture groups + plaques
  sculpt(k, QR, 3.8, 5.0, 0.4, 2.95, 11, SANDR);
  poly(c, [QR(3.8, 3.0), QR(5.0, 3.0), QR(5.0, 3.75), QR(3.8, 3.75)], null, null);
  frieze(k, QR, 3.8, 5.0, 3.05, 3.75, 13, SANDR, 2, 0.09);
  frieze(k, QR, 6.72, 6.94, 0.55, 3.2, 12, SANDR, 1, 0.12);
  sculpt(k, QL, 5.15, 6.4, 0.4, 2.95, 21, SANDL);
  frieze(k, QL, 5.15, 6.4, 3.05, 3.75, 23, SANDL, 2, 0.09);
  frieze(k, QL, 3.68, 3.76, 0.55, 3.2, 22, SANDL, 1, 0.1);
  // pier quoins at the front corner
  for (let z = 0.45, i = 0; z < ZB - 0.2; z += 0.38, i++) { const w = i % 2 ? 0.2 : 0.3; poly(c, [QR(V1, z), QR(V1 - w, z), QR(V1 - w, z + 0.34), QR(V1, z + 0.34)], i % 2 ? shade(SANDR, 0.1) : shade(SANDR, -0.04), "rgba(70,45,15,0.35)", 0.5); }
  // ---------- entablature, attic, crown ----------
  // A: moulded cornice over the arches
  let L = layer(k, 0.12, ZB, ZB + 0.28, "cornice");
  dentils(c, L.QRo, V0 + 0.05, V1 + 0.1, ZB + 0.2, 0.06, 0.1); dentils(c, L.QLo, U0 - 0.1, U1 - 0.02, ZB + 0.2, 0.06, 0.1);
  for (const [Q, s0, s1] of [[L.QRo, V0 - 0.12, V1 + 0.12], [L.QLo, U0 - 0.12, U1 + 0.12]]) { c.strokeStyle = "rgba(70,45,15,0.7)"; c.lineWidth = 1; c.beginPath(); c.moveTo(...Q(s0, ZB + 0.09)); c.lineTo(...Q(s1, ZB + 0.09)); c.stroke(); }
  // B: frieze of marching soldiers
  const zf0 = ZB + 0.28, zf1 = ZB + 0.98; L = layer(k, 0.02, zf0, zf1, "plain");
  frieze(k, L.QRo, V0 + 0.15, V1 - 0.12, zf0 + 0.1, zf1 - 0.1, 31, SANDR, 2, 0.085); frieze(k, L.QLo, U0 + 0.12, U1 - 0.15, zf0 + 0.1, zf1 - 0.1, 32, SANDL, 2, 0.085);
  // C: string course + dentils
  const zc1 = zf1 + 0.2; L = layer(k, 0.14, zf1, zc1, "cornice");
  dentils(c, L.QRo, V0 - 0.1, V1 + 0.1, zf1 + 0.13, 0.05, 0.09); dentils(c, L.QLo, U0 - 0.1, U1 + 0.1, zf1 + 0.13, 0.05, 0.09);
  // D: attic with shield medallions between pilasters
  const za1 = zc1 + 0.65; L = layer(k, 0.02, zc1, za1, "plain");
  for (const [Q, s0, s1, base, n] of [[L.QRo, V0 + 0.02, V1 - 0.02, SANDR, 13], [L.QLo, U0 + 0.02, U1 - 0.02, SANDL, 12]]) {
    poly(c, [Q(s0 + 0.04, zc1 + 0.08), Q(s1 - 0.04, zc1 + 0.08), Q(s1 - 0.04, za1 - 0.08), Q(s0 + 0.04, za1 - 0.08)], shade(base, -0.06), "rgba(70,45,15,0.6)", 0.8);
    for (let i = 0; i <= n; i++) { const s = lerp(s0 + 0.04, s1 - 0.04, i / n); c.strokeStyle = "rgba(70,45,15,0.45)"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(...Q(s, zc1 + 0.08)); c.lineTo(...Q(s, za1 - 0.08)); c.stroke(); }
    shields(k, Q, s0 + 0.04, s1 - 0.04, (zc1 + za1) / 2, base, n);
  }
  // E: crown cornice with dentils + palmette cresting
  const zk1 = za1 + 0.3; L = layer(k, 0.22, za1, zk1, "cornice");
  dentils(c, L.QRo, V0 - 0.15, V1 + 0.18, za1 + 0.2, 0.06, 0.1); dentils(c, L.QLo, U0 - 0.15, U1 + 0.18, za1 + 0.2, 0.06, 0.1);
  crest(k, L.QRo, V0 - 0.2, V1 + 0.2, zk1, SANDR); crest(k, L.QLo, U0 - 0.2, U1 + 0.2, zk1, SANDL);
  // F: roof block with the oval
  const rb = 0.8; k.box(U0 + rb, V0 + rb, zk1, U1 - U0 - 2 * rb, V1 - V0 - 2 * rb, 0.14, SAND, { hatch: false, shadow: false, left: SANDL, right: SANDR, top: shade(SAND, 0.16) });
  c.beginPath(); for (let i = 0; i <= 36; i++) { const a = (i / 36) * 6.283; const [x, y] = P((U0 + U1) / 2 + Math.cos(a) * 0.7, (V0 + V1) / 2 + Math.sin(a) * 0.5, zk1 + 0.15); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); c.fillStyle = shade(SAND, 0.22); c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  flagInArch(k, t);
}
// the passages: warm shaded inner wall + floor (the camera only sees one wall of each)
export function archInterior(k, t) {
  const c = k.ctx;
  // R passage (axis u). Inner wall is the plane v = s - w
  const pass = (Q, a, wallPt, floorPts, cross, wallCol0, wallCol1, dir) => {
    c.save(); c.beginPath(); archPath(c, Q, a); c.clip();
    const [x0, y0] = wallPt(dir[0], 0), [x1, y1] = wallPt(dir[1], 0);
    const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, wallCol0); g.addColorStop(0.6, wallCol1); g.addColorStop(1, shade(wallCol1, -0.35));
    c.fillStyle = g; c.fillRect(250, 250, 600, 600);
    // floor: darker near the wall, daylight at the far end
    const fl = floorPts.map(([u, v]) => P(u, v, 0)); poly(c, fl, "#8f8b83", null);
    // cross passage niche on the inner wall
    const m = cross; c.beginPath(); c.moveTo(...wallPt(m - 0.42, 0)); c.lineTo(...wallPt(m - 0.42, 2.05)); for (let i = 0; i <= 14; i++) { const q = Math.PI - (i / 14) * Math.PI; c.lineTo(...wallPt(m + Math.cos(q) * 0.42, 2.05 + Math.sin(q) * 0.5)); } c.lineTo(...wallPt(m + 0.42, 0)); c.closePath(); c.fillStyle = "#2a1d12"; c.fill(); c.strokeStyle = "rgba(240,215,160,0.6)"; c.lineWidth = 1.2; c.stroke();
    c.save(); const vg = c.createLinearGradient(...Q(a.s, a.sz - 0.6), ...Q(a.s, a.sz + a.r + 0.2)); vg.addColorStop(0, "rgba(30,18,6,0)"); vg.addColorStop(1, "rgba(30,18,6,0.5)"); c.fillStyle = vg; c.fillRect(250, 250, 600, 600); c.restore();
    // vault ribs (coffer bands) seen on the wall top
    c.strokeStyle = "rgba(40,25,10,0.5)"; c.lineWidth = 0.9; c.beginPath(); for (let d = 0.35; d < 3.2; d += 0.45) { c.moveTo(...wallPt(dir[0] + (dir[1] - dir[0]) * (d / 3.2), a.sz + 0.1)); c.lineTo(...wallPt(dir[0] + (dir[1] - dir[0]) * (d / 3.2), a.sz + 1.2)); } c.stroke();
    c.restore();
  };
  pass(QR, AR, (u, z) => P(u, AR.s - AR.w, z), [[U0, AR.s - AR.w], [U1, AR.s - AR.w], [U1, AR.s + AR.w], [U0, AR.s + AR.w]], (U0 + U1) / 2 - 0.1, "#d2b176", "#8f7149", [U1, U0]);
  pass(QL, AL, (v, z) => P(AL.s - AL.w, v, z), [[AL.s - AL.w, V0], [AL.s - AL.w, V1], [AL.s + AL.w, V1], [AL.s + AL.w, V0]], (V0 + V1) / 2, "#d9bb82", "#8f7149", [V1, V0]);
}
function archBody(k, t) {}
function flagInArch(k, t) {
  const c = k.ctx, u = U1 - 0.45, v0 = 5.6, w = 0.55, zt = 3.45, zb = 1.0, cols = ["#2c4f8c", "#f4f1e8", "#d7413b"];
  c.save();
  const wave = (z, s) => Math.sin(t * 3.2 + z * 2.4) * 0.07 * (0.3 + s);
  c.strokeStyle = INK; c.lineWidth = 2.2; c.beginPath(); c.moveTo(...P(u, v0 - 0.02, zt + 0.12)); c.lineTo(...P(u, v0 + w + 0.02, zt + 0.12)); c.stroke();
  for (let i = 0; i < 3; i++) {
    const pts = [];
    for (let j = 0; j <= 10; j++) { const z = lerp(zt, zb, j / 10), s = (zt - z) / (zt - zb), wv = wave(z, s); pts.push(P(u + wv * 0.6, v0 + (i / 3) * w + wv, z)); }
    for (let j = 10; j >= 0; j--) { const z = lerp(zt, zb, j / 10), s = (zt - z) / (zt - zb), wv = wave(z, s); pts.push(P(u + wv * 0.6, v0 + ((i + 1) / 3) * w + wv, z)); }
    k.path(pts, { fill: cols[i], stroke: false, wobble: 0 });
  }
  c.strokeStyle = "rgba(42,36,32,0.5)"; c.lineWidth = 0.9; for (const f of [0, 1]) { c.beginPath(); for (let j = 0; j <= 10; j++) { const z = lerp(zt, zb, j / 10), s = (zt - z) / (zt - zb), wv = wave(z, s); const p = P(u + wv * 0.6, v0 + f * w + wv, z); j ? c.lineTo(...p) : c.moveTo(...p); } c.stroke(); }
  c.restore();
}

// ---------- tomb of the unknown soldier flame ----------
export function flame(k, u, v, t) {
  const c = k.ctx, [x, y] = P(u, v, 0.04);
  k.box(u - 0.35, v - 0.2, 0, 0.7, 0.4, 0.06, "#8d867a", { hatch: false, shadow: false });
  k.box(u - 0.28, v - 0.15, 0.06, 0.56, 0.3, 0.05, "#2b2724", { hatch: false, shadow: false });
  const f = 1 + 0.25 * Math.sin(t * 11) + 0.15 * Math.sin(t * 17 + 1);
  c.fillStyle = "rgba(255,150,40,0.95)"; c.strokeStyle = INK; c.lineWidth = 0.8;
  c.beginPath(); c.moveTo(x - 3, y - 4); c.quadraticCurveTo(x - 3.5, y - 9 * f, x + Math.sin(t * 9) * 1.4, y - 13 * f); c.quadraticCurveTo(x + 3.5, y - 9 * f, x + 3, y - 4); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = "#ffe27a"; c.beginPath(); c.moveTo(x - 1.4, y - 4); c.quadraticCurveTo(x - 1.4, y - 7 * f, x, y - 9 * f); c.quadraticCurveTo(x + 1.4, y - 7 * f, x + 1.4, y - 4); c.fill();
  // rope posts
  for (const [du, dv] of [[-0.55, -0.35], [0.55, -0.35], [0.55, 0.35], [-0.55, 0.35]]) { const [px, py] = P(u + du, v + dv, 0); c.fillStyle = "#333"; c.beginPath(); c.arc(px, py - 4, 1.6, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(px, py); c.lineTo(px, py - 4); c.stroke(); }
}

// ---------- cars: chamfered extruded bodies, slanted glasshouse, wheels, lights; taxis and a bus ----------
const VIEW = (nx, ny) => nx + ny > 0.001;
function extrude(k, plan, zA, zB, col, o = {}) {
  // plan: array of [u,v] (CCW or CW); draws visible side quads sorted by depth, returns nothing
  const cx = plan.reduce((s, p) => s + p[0], 0) / plan.length, cy = plan.reduce((s, p) => s + p[1], 0) / plan.length;
  const top = o.top || plan, sides = [];
  for (let i = 0; i < plan.length; i++) {
    const a = plan[i], b = plan[(i + 1) % plan.length], at = top[i], bt = top[(i + 1) % plan.length];
    const mx = (a[0] + b[0]) / 2 - cx, my = (a[1] + b[1]) / 2 - cy;
    const el = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = (b[1] - a[1]) / el, ny = -(b[0] - a[0]) / el, sg = nx * mx + ny * my >= 0 ? 1 : -1;
    const ox = nx * sg, oy = ny * sg;
    if (!VIEW(ox, oy)) continue;
    sides.push({ a, b, at, bt, d: a[0] + a[1] + b[0] + b[1], sh: -0.03 - 0.17 * clamp((ox - oy) / 2 + 0.5) });
  }
  sides.sort((p, q) => p.d - q.d);
  for (const s of sides) {
    const q = [P(s.a[0], s.a[1], zA), P(s.b[0], s.b[1], zA), P(s.bt[0], s.bt[1], zB), P(s.at[0], s.at[1], zB)];
    k.path(q, { fill: o.glass ? o.glass : shade(col, s.sh), lw: 0.7, wobble: 0 });
    if (o.pillars) { const c = k.ctx; c.strokeStyle = shade(col, s.sh); c.lineWidth = 1.4; c.beginPath(); for (const f of o.pillars) { const x0 = lerp(q[0][0], q[1][0], f), y0 = lerp(q[0][1], q[1][1], f), x1 = lerp(q[3][0], q[2][0], f), y1 = lerp(q[3][1], q[2][1], f); c.moveTo(x0, y0); c.lineTo(x1, y1); } c.stroke(); }
  }
  if (!o.noTop) k.path(top.map(([a, b]) => P(a, b, zB)), { fill: o.topCol || shade(col, 0.12), lw: 0.7, wobble: 0 });
}
export function drawCar(k, u, v, du, dv, col, o = {}) {
  const c = k.ctx, L2 = Math.hypot(du, dv) || 1; du /= L2; dv /= L2;
  const nu = -dv, nv = du, bus = !!o.bus, L = o.len ?? (bus ? 2.3 : 0.98), Wd = o.wid ?? (bus ? 0.66 : 0.5);
  const T = (a, b) => [u + du * a * L / 2 + nu * b * Wd / 2, v + dv * a * L / 2 + nv * b * Wd / 2];
  const plan = (pts) => pts.map(([a, b]) => T(a, b));
  const body = bus ? [[-1, -0.94], [-0.94, -1], [0.94, -1], [1, -0.94], [1, 0.94], [0.94, 1], [-0.94, 1], [-1, 0.94]] : [[-1, -0.8], [-0.88, -1], [0.62, -1], [0.96, -0.85], [1, -0.55], [1, 0.55], [0.96, 0.85], [0.62, 1], [-0.88, 1], [-1, 0.8]];
  const BP = plan(body);
  k.shadow(BP.map(([a, b]) => [a + 0.14, b + 0.07, 0]), 0.16);
  // wheels (on the visible side + hidden side)
  c.fillStyle = INK; const wa = bus ? [-0.62, 0.55] : [-0.55, 0.52];
  for (const fa of wa) for (const fb of [-1, 1]) { const [wu, wv] = T(fa, fb * 0.97); const [x, y] = P(wu, wv, 0.09); c.beginPath(); c.ellipse(x, y, bus ? 5 : 4, bus ? 5 : 4, 0, 0, 7); c.fill(); }
  const z0 = 0.09;
  if (bus) {
    const H = 0.95; extrude(k, BP, z0, z0 + H, col, { topCol: shade(col, 0.25) });
    // window band: re-draw glass on the visible sides
    const gl = plan([[-0.96, -0.97], [0.96, -0.97], [0.96, 0.97], [-0.96, 0.97]]);
    const sd = [[0, 1], [1, 2], [2, 3], [3, 0]].map(([a, b]) => ({ a: gl[a], b: gl[b], d: gl[a][0] + gl[a][1] + gl[b][0] + gl[b][1] })).filter((s) => { const mx = (s.a[0] + s.b[0]) / 2 - u, my = (s.a[1] + s.b[1]) / 2 - v; return mx + my > 0; }).sort((p, q) => p.d - q.d);
    for (const s of sd) { const q = [P(s.a[0], s.a[1], z0 + 0.5), P(s.b[0], s.b[1], z0 + 0.5), P(s.b[0], s.b[1], z0 + 0.82), P(s.a[0], s.a[1], z0 + 0.82)]; poly(c, q, "#bcd6e2", INK, 0.6); c.strokeStyle = col; c.lineWidth = 1.5; c.beginPath(); for (let f = 0.12; f < 0.99; f += 0.125) { c.moveTo(lerp(q[0][0], q[1][0], f), lerp(q[0][1], q[1][1], f)); c.lineTo(lerp(q[3][0], q[2][0], f), lerp(q[3][1], q[2][1], f)); } c.stroke();
      const q2 = [P(s.a[0], s.a[1], z0 + 0.18), P(s.b[0], s.b[1], z0 + 0.18), P(s.b[0], s.b[1], z0 + 0.3), P(s.a[0], s.a[1], z0 + 0.3)]; poly(c, q2, "#2f6b4c", null); }
    // roof vents
    for (const a of [-0.4, 0.35]) k.path([T(a - 0.15, -0.35), T(a + 0.15, -0.35), T(a + 0.15, 0.35), T(a - 0.15, 0.35)].map(([p, q]) => P(p, q, z0 + H + 0.04)), { fill: "#cfd3cf", lw: 0.6, wobble: 0 });
    const f = T(1, 0); const [x, y] = P(f[0], f[1], z0 + 0.7); c.fillStyle = "#fff4c4"; c.beginPath(); c.arc(x, y, 1.4, 0, 7); c.fill();
    return;
  }
  const h1 = 0.34;
  extrude(k, BP, z0, z0 + h1, col);
  // glasshouse: slanted frustum from a wide base to a narrower roof
  const cb = plan([[-0.5, -0.86], [0.38, -0.86], [0.5, -0.78], [0.5, 0.78], [0.38, 0.86], [-0.5, 0.86], [-0.62, 0.78], [-0.62, -0.78]]);
  const ct = plan([[-0.34, -0.66], [0.06, -0.66], [0.12, -0.6], [0.12, 0.6], [0.06, 0.66], [-0.34, 0.66], [-0.42, 0.58], [-0.42, -0.58]]);
  const zc = z0 + h1;
  extrude(k, cb, zc, zc + 0.26, col, { top: ct, glass: "#c9deea", pillars: [0.18, 0.5, 0.82], topCol: shade(col, 0.1) });
  // lights
  const hl = [T(1, -0.6), T(1, 0.6)]; c.fillStyle = "#fff4c4"; for (const [a, b] of hl) { const [x, y] = P(a, b, z0 + 0.2); c.beginPath(); c.arc(x, y, 1.3, 0, 7); c.fill(); }
  const tl = [T(-1, -0.6), T(-1, 0.6)]; c.fillStyle = "#c93a32"; for (const [a, b] of tl) { const [x, y] = P(a, b, z0 + 0.2); c.beginPath(); c.arc(x, y, 1.1, 0, 7); c.fill(); }
  if (o.taxi) { const [a, b] = T(-0.15, 0); const q = [[-0.12, -0.3], [0.12, -0.3], [0.12, 0.3], [-0.12, 0.3]].map(([p, r]) => P(a + du * p * 0.5 + nu * r * 0.4, b + dv * p * 0.5 + nv * r * 0.4, zc + 0.3)); poly(c, q, "#fff6c8", INK, 0.7); }
}
