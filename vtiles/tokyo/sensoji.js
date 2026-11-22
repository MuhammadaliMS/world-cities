// Senso-ji landmarks (tokyo 0,0 only): main hall (Hondo) with an irimoya roof, five-storey pagoda,
// Kaminarimon gate with the giant lantern, joko-ro incense burner, stone toro lanterns.
// Everything is built in 3D in free affine frames (proj) so it matches the painted skew of the reference,
// and every roof is a real curved Japanese roof: concave planes, upturned corners, tile rows, ridges, ornaments.
import { AUDIT } from "../../lib/vec-kit.js";
import { P, INK, shade, lerp, clamp, rng, hash, PX, proj, FONT, smoke, chochin } from "./_props.js";

// the reference ground sits one z-unit (42 px) lower than the tile grid: everything is traced at y - DY
export const DY = 42;
// the points handed to these helpers were all produced by P(); re-register a few as recent anchors so the audit sees where they came from
const touch = (pts) => { if (!AUDIT.on) return; const r = AUDIT.recent, st = Math.max(1, Math.floor(pts.length / 6)); for (let i = 0; i < pts.length; i += st) r.push(pts[i][0], pts[i][1]); if (r.length > 160) r.splice(0, r.length - 160); };
const pl = (c, pts) => { touch(pts); c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
const fillPoly = (c, pts, fill, lw = 1.1, stroke = INK) => { pl(c, pts); if (fill) { c.fillStyle = fill; c.fill(); } if (lw) { c.strokeStyle = stroke; c.lineWidth = lw; c.lineJoin = "round"; c.stroke(); } };
const area = (pts) => { let s = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; };
const polyline = (c, pts) => { touch(pts); c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); };
const GOLD = "#e2b23a", GOLDL = "#f6d873", GOLDD = "#9c7418", RED = "#cc3b29", REDD = "#9e2a1c", REDL = "#e65a40";

// ---------- free-frame solids ----------
function fbox(c, pr, u, v, z, du, dv, dz, col, o = {}) {
  const T = [[u, v, z + dz], [u + du, v, z + dz], [u + du, v + dv, z + dz], [u, v + dv, z + dz]].map((p) => pr(...p));
  const L = [[u, v + dv, z], [u + du, v + dv, z], [u + du, v + dv, z + dz], [u, v + dv, z + dz]].map((p) => pr(...p));
  const R = [[u + du, v + dv, z], [u + du, v, z], [u + du, v, z + dz], [u + du, v + dv, z + dz]].map((p) => pr(...p));
  const lw = o.lw ?? 1;
  if (o.left !== null) fillPoly(c, L, o.left || shade(col, -0.04), lw);
  if (o.right !== null) fillPoly(c, R, o.right || shade(col, -0.2), lw);
  if (o.top !== null) fillPoly(c, T, o.top || shade(col, 0.08), lw);
  return { T, L, R };
}
// vertical round column in a free frame
function column(c, pr, u, v, z0, z1, r, col = RED, o = {}) {
  const [x, y0] = pr(u, v, z0), [, y1] = pr(u, v, z1), rx = r, ry = r * 0.32;
  const g = c.createLinearGradient(x - rx, 0, x + rx, 0);
  g.addColorStop(0, shade(col, 0.16)); g.addColorStop(0.35, col); g.addColorStop(1, shade(col, -0.34));
  c.beginPath(); c.moveTo(x - rx, y1); c.lineTo(x - rx, y0); c.ellipse(x, y0, rx, ry, 0, Math.PI, 0, true); c.lineTo(x + rx, y1); c.closePath();
  c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = o.lw ?? 1; c.stroke();
  if (o.base !== false) { // black lacquer/stone base
    const bh = o.bh ?? 5, bw = rx + 1.6;
    const g2 = c.createLinearGradient(x - bw, 0, x + bw, 0); g2.addColorStop(0, "#5d5852"); g2.addColorStop(1, "#24211e");
    c.beginPath(); c.moveTo(x - bw, y0 - bh); c.lineTo(x - bw, y0); c.ellipse(x, y0, bw, bw * 0.32, 0, Math.PI, 0, true); c.lineTo(x + bw, y0 - bh); c.ellipse(x, y0 - bh, bw, bw * 0.32, 0, 0, Math.PI, true); c.closePath();
    c.fillStyle = g2; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
  }
  if (o.ring) { c.fillStyle = GOLD; c.fillRect(x - rx, y1 + 2, rx * 2, 1.6); }
}

// ======================================================================================
// Japanese roof engine. Ridge runs along u. Types: irimoya (hip-and-gable), hip, pyramid (pagoda, cut at `top`).
// s = { u0,u1,v0,v1 wall rect, ov overhang, Ze eave z, Zr ridge z (pyramid: z at the top cut), gin gable inset from the
//       eave end, gz gable-foot height fraction, rh half ridge (hip), top half-size of the top cut (pyramid),
//       p profile exponent, lift corner upturn, rc upturn radius, col tile colour, step rib spacing, lip, fascia }
// ======================================================================================
export function jroof(k, pr, s) {
  const c = k.ctx, type = s.type || "irimoya", p = s.p ?? 1.6, col = s.col || "#6c7482";
  const eu0 = s.u0 - s.ov, eu1 = s.u1 + s.ov, ev0 = s.v0 - s.ov, ev1 = s.v1 + s.ov, vm = (s.v0 + s.v1) / 2, um = (s.u0 + s.u1) / 2;
  const f = (d) => Math.pow(clamp(d), p);
  const Ze = s.Ze;
  let Zr = s.Zr, ur0, ur1, Zg, vqF, vqB, top = s.top ?? 0;
  if (type === "irimoya") { ur0 = eu0 + s.gin; ur1 = eu1 - s.gin; Zg = Ze + (Zr - Ze) * (s.gz ?? 0.5); const kap = Math.pow((Zg - Ze) / (Zr - Ze), 1 / p); vqF = ev1 - kap * (ev1 - vm); vqB = ev0 + kap * (vm - ev0); }
  else if (type === "hip") { ur0 = um - s.rh; ur1 = um + s.rh; Zg = Zr; vqF = vqB = vm; }
  else { ur0 = ur1 = um; vqF = vqB = vm; const dc = (ev1 - vm - top) / (ev1 - vm); Zr = Ze + (s.Zr - Ze) / f(dc); Zg = Zr; }
  const zF = (v) => Ze + (Zr - Ze) * f((ev1 - v) / (ev1 - vm));
  const zB = (v) => Ze + (Zr - Ze) * f((v - ev0) / (vm - ev0));
  const zR = (u) => Ze + (Zg - Ze) * f((eu1 - u) / (eu1 - ur1));
  const zL = (u) => Ze + (Zg - Ze) * f((u - eu0) / (ur0 - eu0));
  const L = s.lift ?? 0.4, RC = s.rc ?? 1.6;
  const corners = [[eu0, ev0], [eu1, ev0], [eu1, ev1], [eu0, ev1]];
  const lift = (u, v) => { let m = 0; for (const [cu, cv] of corners) { const d = Math.hypot(u - cu, v - cv) / RC; if (d < 1) m = Math.max(m, Math.pow(1 - d, 2.2)); } return L * m; };
  const X = (u, v, z) => pr(u, v, z + lift(u, v));
  const seg = (a, b, n, zf) => { const out = []; for (let i = 0; i <= n; i++) { const t = i / n, u = lerp(a[0], b[0], t), v = lerp(a[1], b[1], t); out.push([u, v, zf(u, v)]); } return out; };
  const ZF = (u, v) => zF(v), ZB = (u, v) => zB(v), ZRf = (u, v) => zR(u), ZLf = (u, v) => zL(u);
  const isP = type === "pyramid";
  // ---- plane outlines (plan + z) ----
  const planes = {};
  {
    const q1 = isP ? [um + top, vm + top] : [ur1, vqF], q0 = isP ? [um - top, vm + top] : [ur0, vqF];
    let pts = [...seg([eu0, ev1], [eu1, ev1], 30, ZF), ...seg([eu1, ev1], q1, 10, ZF).slice(1)];
    if (type === "irimoya") pts.push(...seg([ur1, vqF], [ur1, vm], 6, ZF).slice(1), ...seg([ur1, vm], [ur0, vm], 6, ZF).slice(1), ...seg([ur0, vm], [ur0, vqF], 6, ZF).slice(1));
    else if (type === "hip") pts.push(...seg([ur1, vm], [ur0, vm], 6, ZF).slice(1));
    else pts.push(...seg(q1, q0, 4, ZF).slice(1));
    pts.push(...seg(q0, [eu0, ev1], 10, ZF).slice(1, -1));
    planes.F = { pts, eave: seg([eu0, ev1], [eu1, ev1], 30, ZF) };
  }
  {
    const q1 = isP ? [um + top, vm - top] : [ur1, vqB], q0 = isP ? [um - top, vm - top] : [ur0, vqB];
    let pts = [...seg([eu1, ev0], [eu0, ev0], 30, ZB), ...seg([eu0, ev0], q0, 10, ZB).slice(1)];
    if (type === "irimoya") pts.push(...seg([ur0, vqB], [ur0, vm], 6, ZB).slice(1), ...seg([ur0, vm], [ur1, vm], 6, ZB).slice(1), ...seg([ur1, vm], [ur1, vqB], 6, ZB).slice(1));
    else if (type === "hip") pts.push(...seg([ur0, vm], [ur1, vm], 6, ZB).slice(1));
    else pts.push(...seg(q0, q1, 4, ZB).slice(1));
    pts.push(...seg(q1, [eu1, ev0], 10, ZB).slice(1, -1));
    planes.B = { pts, eave: seg([eu1, ev0], [eu0, ev0], 30, ZB) };
  }
  {
    const qa = isP ? [um + top, vm - top] : [ur1, vqB], qb = isP ? [um + top, vm + top] : [ur1, vqF];
    let pts = [...seg([eu1, ev1], [eu1, ev0], 20, ZRf), ...seg([eu1, ev0], qa, 10, ZRf).slice(1)];
    if (type === "irimoya" || isP) pts.push(...seg(qa, qb, 6, ZRf).slice(1));
    pts.push(...seg(qb, [eu1, ev1], 10, ZRf).slice(1, -1));
    planes.R = { pts, eave: seg([eu1, ev1], [eu1, ev0], 20, ZRf) };
  }
  {
    const qa = isP ? [um - top, vm + top] : [ur0, vqF], qb = isP ? [um - top, vm - top] : [ur0, vqB];
    let pts = [...seg([eu0, ev0], [eu0, ev1], 20, ZLf), ...seg([eu0, ev1], qa, 10, ZLf).slice(1)];
    if (type === "irimoya" || isP) pts.push(...seg(qa, qb, 6, ZLf).slice(1));
    pts.push(...seg(qb, [eu0, ev0], 10, ZLf).slice(1, -1));
    planes.L = { pts, eave: seg([eu0, ev0], [eu0, ev1], 20, ZLf) };
  }
  const scr = (pts) => pts.map((q) => X(q[0], q[1], q[2]));
  for (const key in planes) { planes[key].px = scr(planes[key].pts); planes[key].a = area(planes[key].px); }
  const sF = Math.sign(planes.F.a);
  const front = (key) => Math.sign(planes[key].a) === sF;
  // ---- rib generators: rows of round tiles running down the slope ----
  const hipV = (u, sideV) => { // top limit (v) of a rib at u on plane F (sideV=+1) or B (-1)
    const ev = sideV > 0 ? ev1 : ev0, vq = sideV > 0 ? vqF : vqB;
    if (isP) { const lim = vm + sideV * top; const h = u < um ? ev + (u - eu0) / (um - eu0) * (vm - ev) : ev + (eu1 - u) / (eu1 - um) * (vm - ev); return sideV > 0 ? Math.max(lim, h) : Math.min(lim, h); }
    if (u >= ur0 && u <= ur1) return type === "irimoya" ? vm : vm;
    if (u < ur0) return ev + (u - eu0) / (ur0 - eu0) * (vq - ev);
    return ev + (eu1 - u) / (eu1 - ur1) * (vq - ev);
  };
  const hipU = (v, sideU) => { // top limit (u) of a rib at v on plane R (+1) or L (-1)
    const eu = sideU > 0 ? eu1 : eu0, uq = sideU > 0 ? ur1 : ur0;
    if (isP) { const lim = um + sideU * top; const h = v < vm ? eu + (v - ev0) / (vm - ev0) * (um - eu) : eu + (ev1 - v) / (ev1 - vm) * (um - eu); return sideU > 0 ? Math.max(lim, h) : Math.min(lim, h); }
    if (v >= vqB && v <= vqF) return uq;
    if (v > vqF) return eu + (ev1 - v) / (ev1 - vqF) * (uq - eu);
    return eu + (v - ev0) / (vqB - ev0) * (uq - eu);
  };
  const step = s.step ?? 0.13;
  const drawPlane = (key, shd) => {
    const P0 = planes[key], px = P0.px;
    const ys = px.map((q) => q[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, shade(col, shd + 0.14)); g.addColorStop(0.55, shade(col, shd)); g.addColorStop(1, shade(col, shd - 0.1));
    fillPoly(c, px, g, 0);
    c.save(); pl(c, px); c.clip();
    // ribs
    const ribs = [];
    if (key === "F" || key === "B") { const sv = key === "F" ? 1 : -1, ev = sv > 0 ? ev1 : ev0, zf = sv > 0 ? zF : zB; for (let u = eu0 + step * 0.5; u < eu1; u += step) { const vt = hipV(u, sv); if (Math.abs(vt - ev) < 0.03) continue; const r = []; for (let i = 0; i <= 9; i++) { const v = lerp(ev, vt, i / 9); r.push(X(u, v, zf(v))); } ribs.push(r); } }
    else { const su = key === "R" ? 1 : -1, eu = su > 0 ? eu1 : eu0, zf = su > 0 ? zR : zL; for (let v = ev0 + step * 0.5; v < ev1; v += step) { const ut = hipU(v, su); if (Math.abs(ut - eu) < 0.03) continue; const r = []; for (let i = 0; i <= 9; i++) { const u = lerp(eu, ut, i / 9); r.push(X(u, v, zf(u))); } ribs.push(r); } }
    // channel shadows between rows, then the convex round-tile rows with a highlight
    c.lineCap = "butt";
    c.strokeStyle = `rgba(18,22,32,${s.ribDark ?? 0.55})`; c.lineWidth = s.ribW ?? 1.5; for (const r of ribs) { polyline(c, r); c.stroke(); }
    c.strokeStyle = `rgba(255,255,255,${s.ribLight ?? 0.26})`; c.lineWidth = (s.ribW ?? 1.5) * 0.55; for (const r of ribs) { polyline(c, r.map(([x, y]) => [x - 1.2, y])); c.stroke(); }
    // tile courses (overlaps) across the slope
    c.strokeStyle = `rgba(20,24,34,${s.courseA ?? 0.22})`; c.lineWidth = 0.7;
    for (let d = 0.07; d < 1; d += s.course ?? 0.075) {
      const pts = [];
      if (key === "F" || key === "B") { const sv = key === "F" ? 1 : -1, ev = sv > 0 ? ev1 : ev0, v = lerp(ev, vm, d), zf = sv > 0 ? zF : zB; for (let i = 0; i <= 24; i++) { const u = lerp(eu0, eu1, i / 24); if ((sv > 0 && hipV(u, 1) <= v + 1e-6) || (sv < 0 && hipV(u, -1) >= v - 1e-6)) pts.push(X(u, v, zf(v))); } }
      else { const su = key === "R" ? 1 : -1, eu = su > 0 ? eu1 : eu0, uu = lerp(eu, su > 0 ? ur1 : ur0, d), zf = su > 0 ? zR : zL; for (let i = 0; i <= 18; i++) { const v = lerp(ev0, ev1, i / 18); if ((su > 0 && hipU(v, 1) <= uu + 1e-6) || (su < 0 && hipU(v, -1) >= uu - 1e-6)) pts.push(X(uu, v, zf(uu))); } }
      if (pts.length > 1) { polyline(c, pts); c.stroke(); }
    }
    // soft light across the slope
    const gl = c.createLinearGradient(0, y0, 0, y1); gl.addColorStop(0, "rgba(255,255,255,0.10)"); gl.addColorStop(0.5, "rgba(255,255,255,0)"); gl.addColorStop(1, "rgba(0,0,20,0.12)");
    c.fillStyle = gl; c.fillRect(Math.min(...px.map((q) => q[0])) - 2, y0 - 2, 2000, y1 - y0 + 4);
    c.restore();
    fillPoly(c, px, null, s.lw ?? 1.2);
    P0.ribs = ribs;
  };
  const gable = (uq, faceFront) => {
    if (type !== "irimoya") return;
    const pts = [X(uq, vqF, Zg), X(uq, vm, Zr), X(uq, vqB, Zg)];
    const g = c.createLinearGradient(0, pts[1][1], 0, pts[0][1]); g.addColorStop(0, "#7d2318"); g.addColorStop(1, "#5a1810");
    fillPoly(c, pts, g, 1.1);
    if (faceFront) { // white lattice boards + gold gegyo ornament under the apex
      c.save(); pl(c, pts); c.clip(); c.strokeStyle = "rgba(240,225,200,0.55)"; c.lineWidth = 0.9;
      for (let i = 1; i < 6; i++) { const z = lerp(Zg, Zr, i / 6); c.beginPath(); c.moveTo(...X(uq, vqF + 0.1, z)); c.lineTo(...X(uq, vqB - 0.1, z)); c.stroke(); }
      c.restore();
      const [ax, ay] = X(uq, vm, Zr - 0.18); c.fillStyle = GOLD; c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.moveTo(ax, ay - 2); c.quadraticCurveTo(ax + 5, ay + 2, ax + 1, ay + 7); c.quadraticCurveTo(ax - 4, ay + 3, ax, ay - 2); c.fill(); c.stroke();
      c.beginPath(); c.arc(ax + 1, ay + 3, 1.3, 0, 6.3); c.fillStyle = GOLDL; c.fill();
      // barge boards with gold studs
      for (const vq of [vqF, vqB]) { const a = X(uq, vq, Zg), b = X(uq, vm, Zr); c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); c.strokeStyle = "#eae0cc"; c.lineWidth = 1.8; c.stroke(); }
    }
  };
  // ---- eave lip (tile ends) and fascia (rafters with gold tips) ----
  const eaveBand = (key) => {
    const E = planes[key].eave, top = E.map((q) => X(q[0], q[1], q[2])), lipH = s.lip ?? 0.09, fas = s.fascia ?? 0.18;
    const lip = E.map((q) => X(q[0], q[1], q[2] - lipH)), bot = E.map((q) => X(q[0], q[1], q[2] - lipH - fas));
    fillPoly(c, [...lip, ...[...bot].reverse()], s.fasCol || REDD, 0.9);
    // rafter ends: two rows of gold-capped squares
    const n = Math.round((s.rafters ?? 60) * (E.length / 31));
    for (let row = 0; row < (s.rafterRows ?? 2); row++) {
      const fz = row === 0 ? 0.35 : 0.75;
      for (let i = 0; i <= n; i++) { const t = i / n, j = t * (E.length - 1), a = Math.floor(j), b = Math.min(E.length - 1, a + 1), w = j - a; const q = [lerp(E[a][0], E[b][0], w), lerp(E[a][1], E[b][1], w), lerp(E[a][2], E[b][2], w)]; const [x, y] = X(q[0], q[1], q[2] - lipH - fas * fz); c.fillStyle = row === 0 ? (s.rafterCol || GOLD) : GOLDD; const rs = s.rafterSize ?? 1.8; c.fillRect(x - rs / 2, y - rs / 2, rs, rs); }
    }
    fillPoly(c, [...top, ...[...lip].reverse()], shade(col, -0.25), 1.0);
    // round eave-tile ends at each rib
    const ribs = planes[key].ribs || [];
    for (const r of ribs) { const [x, y] = r[0]; c.beginPath(); c.arc(x, y + 1, s.endR ?? 1.5, 0, 6.3); c.fillStyle = shade(col, 0.22); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.6; c.stroke(); }
  };
  // ---- ridges and hips ----
  const capCol = s.capCol || shade(col, 0.18); const cap = (pts, w, hi, o = {}) => { c.lineCap = "round"; c.lineJoin = "round"; polyline(c, pts); c.strokeStyle = INK; c.lineWidth = w + 2; c.stroke(); c.strokeStyle = capCol; c.lineWidth = w; c.stroke(); polyline(c, pts.map(([x, y]) => [x - w * 0.15, y - w * 0.22])); c.strokeStyle = shade(capCol, 0.35); c.lineWidth = Math.max(1, w * 0.32); c.stroke();
    if (o.ticks) { c.strokeStyle = "rgba(15,18,28,0.5)"; c.lineWidth = 0.7; for (let i = 1; i < pts.length - 1; i++) { const [x, y] = pts[i]; c.beginPath(); c.moveTo(x - w * 0.45, y - w * 0.2); c.lineTo(x + w * 0.45, y + w * 0.2); c.stroke(); } } };
  const curve = (a, b, zf, n = 10) => seg(a, b, n, zf).map((q) => X(q[0], q[1], q[2] + (s.capZ ?? 0.03)));
  const hipW = s.hipW ?? 4, ridgeW = s.ridgeW ?? 6;
  const oni = (pt, sc, flip) => { const [x, y] = pt; c.fillStyle = s.oniCol || GOLD; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x - 3 * sc, y + 1); c.quadraticCurveTo(x - 4 * sc, y - 6 * sc, x + flip * 1 * sc, y - 8 * sc); c.quadraticCurveTo(x + flip * 5 * sc, y - 7 * sc, x + flip * 4 * sc, y - 3 * sc); c.quadraticCurveTo(x + flip * 2 * sc, y - 4 * sc, x + flip * 1.5 * sc, y - 1); c.lineTo(x + 3 * sc, y + 1); c.closePath(); c.fill(); c.stroke(); c.fillStyle = GOLDL; c.beginPath(); c.arc(x + flip * 0.8 * sc, y - 4.5 * sc, 0.9 * sc, 0, 6.3); c.fill(); };
  const hips = [];
  const Lh = (a, b, zf, adj) => hips.push({ pts: curve(a, b, zf), adj });
  if (isP) {
    Lh([eu0, ev1], [um - top, vm + top], ZF, ["F", "L"]); Lh([eu1, ev1], [um + top, vm + top], ZF, ["F", "R"]);
    Lh([eu1, ev0], [um + top, vm - top], ZB, ["B", "R"]); Lh([eu0, ev0], [um - top, vm - top], ZB, ["B", "L"]);
  } else {
    Lh([eu0, ev1], [ur0, vqF], ZF, ["F", "L"]); Lh([eu1, ev1], [ur1, vqF], ZF, ["F", "R"]);
    Lh([eu1, ev0], [ur1, vqB], ZB, ["B", "R"]); Lh([eu0, ev0], [ur0, vqB], ZB, ["B", "L"]);
  }
  // ---- paint: back-facing planes, gables, front planes, eaves, caps ----
  const order = ["B", "L", "R", "F"];
  const shades = { F: 0.0, R: -0.16, B: -0.06, L: -0.2 };
  for (const key of order) if (!front(key)) drawPlane(key, shades[key]);
  // gable triangles face +u (right) / -u (left)
  const gR = (() => { const pts = [X(ur1, vqF, Zg), X(ur1, vm, Zr), X(ur1, vqB, Zg)]; return Math.sign(area(pts)); })();
  if (type === "irimoya") { gable(ur0, false); }
  for (const key of order) if (front(key)) drawPlane(key, shades[key]);
  if (type === "irimoya") gable(ur1, true);
  for (const key of ["L", "B", "R", "F"]) if (front(key) && (key === "F" || key === "R" || s.allEaves)) eaveBand(key);
  // caps
  for (const h of hips) if (h.adj.some(front)) { if (s.stack) cap(h.pts.map(([x, y]) => [x + 0.6, y + hipW * 0.35]), hipW * 1.15, 0); cap(h.pts, hipW, 0, { ticks: true }); }
  if (type === "irimoya") {
    for (const [uq, vq, adj] of [[ur0, vqF, ["F"]], [ur1, vqF, ["F"]], [ur1, vqB, ["B", "Gr"]]]) { if (adj.some((a) => a === "Gr" || front(a))) cap(curve([uq, vq], [uq, vm], adj[0] === "B" ? ZB : ZF, 6), hipW * 0.9, 0, { ticks: true }); }
  }
  if (type !== "pyramid") {
    // tall ridge: a stacked band with a cap on top
    const rp = curve([ur0, vm], [ur1, vm], ZF, 8), hR = s.ridgeH ?? 6;
    const topP = rp.map(([x, y]) => [x, y - hR]);
    fillPoly(c, [...rp, ...[...topP].reverse()], shade(col, -0.28), 1.1);
    c.strokeStyle = "rgba(255,255,255,0.22)"; c.lineWidth = 0.8; for (const f2 of [0.35, 0.7]) { polyline(c, rp.map(([x, y]) => [x, y - hR * f2])); c.stroke(); }
    cap(topP, ridgeW * 0.7, 0);
    if (s.orn !== false) { const a = topP[0], b = topP[topP.length - 1]; shachi(c, a[0], a[1] + 1, s.ornS ?? 1.4, -1); shachi(c, b[0], b[1] + 1, s.ornS ?? 1.4, 1); }
  }
  // gold oni tiles at the lower ends of the hips + upturned tips
  for (const h of hips) if (h.adj.some(front)) { oni(h.pts[0], s.oniS ?? 1, h.pts[0][0] < h.pts[h.pts.length - 1][0] ? -1 : 1); }
  return { X, Ze, Zr, eu0, eu1, ev0, ev1, lift, zF, zR, planes, front };
}
// gold ridge-end ornament (shibi / shachi curl)
function shachi(c, x, y, s, flip) {
  c.fillStyle = GOLD; c.strokeStyle = INK; c.lineWidth = 1;
  c.beginPath(); c.moveTo(x - flip * 4 * s, y + 1); c.lineTo(x - flip * 4 * s, y - 6 * s); c.quadraticCurveTo(x - flip * 4 * s, y - 13 * s, x + flip * 2 * s, y - 13 * s); c.quadraticCurveTo(x + flip * 7 * s, y - 12 * s, x + flip * 6 * s, y - 7 * s);
  c.quadraticCurveTo(x + flip * 3 * s, y - 9 * s, x + flip * 1 * s, y - 7 * s); c.quadraticCurveTo(x + flip * 3 * s, y - 3 * s, x + flip * 4 * s, y + 1); c.closePath();
  const g = c.createLinearGradient(x - 5 * s, y - 13 * s, x + 6 * s, y); g.addColorStop(0, GOLDL); g.addColorStop(0.5, GOLD); g.addColorStop(1, GOLDD); c.fillStyle = g; c.fill(); c.stroke();
  c.strokeStyle = GOLDD; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - flip * 2 * s, y - 2 * s); c.quadraticCurveTo(x - flip * 2 * s, y - 10 * s, x + flip * 2 * s, y - 10.5 * s); c.stroke();
  c.fillStyle = "#fff4c0"; c.beginPath(); c.arc(x - flip * 1.6 * s, y - 9 * s, 1 * s, 0, 6.3); c.fill();
}
// bracket cluster (masugumi) seen from the front: stacked gold-edged blocks stepping outwards
function brackets(c, x, y, w, h, o = {}) {
  const tiers = o.tiers ?? 3, col = o.col || RED;
  for (let i = 0; i < tiers; i++) {
    const ww = w * (0.45 + 0.55 * (i + 1) / tiers), yy = y - (i + 1) * (h / tiers), hh = h / tiers;
    c.fillStyle = i % 2 ? col : shade(col, -0.18); c.fillRect(x - ww / 2, yy, ww, hh); c.strokeStyle = INK; c.lineWidth = 0.6; c.strokeRect(x - ww / 2, yy, ww, hh);
    c.fillStyle = GOLD; for (const fx of [-0.42, 0, 0.42]) c.fillRect(x + fx * ww - 0.9, yy + hh * 0.25, 1.8, hh * 0.5);
  }
}

// ======================================================================================
// MAIN HALL (Hondo). Frame: u along the facade (left -> right), v from back (0) to front (B), z up from the veranda.
// ======================================================================================
export function makeHall(o = {}) {
  const A = 5.7, B = 3.0, ZP = -1.25; // ZP = plaza level below the veranda
  // grid frame: hall u -> tile u, hall v -> tile v (entrance facade on the LEFT face), scaled by S
  const S = o.s ?? 0.78, U0 = o.U0 ?? 0.95, V0 = o.V0 ?? 0.85;
  const pr = (u, v, z = 0) => P(U0 + u * S, V0 + v * S, (z - ZP) * S);
  const RV = 0.7; // veranda width
  const COLS = [0, 1.0, 2.0, 3.67, 4.69, 5.7], RCOLS = [3, 2, 1, 0];
  const ZC = 1.4, ZW = 1.72, ZE = 2.3; // column top, white band top, eave
  const S0 = 1.42, S1 = 4.1; // stair span (wider than the central bay, as painted)
  // place a person standing on the veranda / stairs (returns tile u,v,z)
  const uvz = (hu, hv, hz) => ({ u: U0 + hu * S, v: V0 + hv * S, z: (hz - ZP) * S });
  function under(k) { // stone plinth + under-floor lattice skirt + deck
    const c = k.ctx;
    const u0 = -RV, u1 = A + RV, v1 = B + RV, v0 = -RV;
    // stone footing
    fbox(c, pr, u0 - 0.05, v0, ZP, u1 - u0 + 0.1, v1 - v0 + 0.05, 0.28, "#cfc8b7", { top: null, left: "#d3ccbb", right: "#b9b2a1" });
    // lattice skirt (dark wood panels in red frames)
    const sk = fbox(c, pr, u0, v0, ZP + 0.28, u1 - u0, v1 - v0, -ZP - 0.4, "#3d2a1e", { top: null, left: "#46301f", right: "#36251a" });
    c.strokeStyle = "rgba(200,150,100,0.35)"; c.lineWidth = 0.7;
    for (let u = u0 + 0.12; u < u1; u += 0.14) { if (u > S0 - 0.15 && u < S1 + 0.15) continue; c.beginPath(); c.moveTo(...pr(u, v1, ZP + 0.3)); c.lineTo(...pr(u, v1, -0.14)); c.stroke(); }
    for (let v = v1 - 0.1; v > v0; v -= 0.14) { c.beginPath(); c.moveTo(...pr(u1, v, ZP + 0.3)); c.lineTo(...pr(u1, v, -0.14)); c.stroke(); }
    for (let i = 0; i <= 8; i++) { const u = lerp(u0, u1, i / 8); if (u > S0 && u < S1) continue; fillPoly(c, [pr(u - 0.05, v1, ZP + 0.28), pr(u + 0.05, v1, ZP + 0.28), pr(u + 0.05, v1, -0.12), pr(u - 0.05, v1, -0.12)], RED, 0.7); }
    for (let i = 0; i <= 5; i++) { const v = lerp(v1, v0, i / 5); fillPoly(c, [pr(u1, v + 0.05, ZP + 0.28), pr(u1, v - 0.05, ZP + 0.28), pr(u1, v - 0.05, -0.12), pr(u1, v + 0.05, -0.12)], REDD, 0.7); }
    // deck: polished boards
    const deck = fbox(c, pr, u0, v0, -0.12, u1 - u0, v1 - v0, 0.12, "#b48a5c", { top: "#c9a678", left: "#8c5f3a", right: "#7a5232" });
    c.save(); pl(c, deck.T); c.clip(); c.strokeStyle = "rgba(110,70,40,0.25)"; c.lineWidth = 0.6;
    for (let u = u0; u < u1; u += 0.22) { c.beginPath(); c.moveTo(...pr(u, v0, 0)); c.lineTo(...pr(u, v1, 0)); c.stroke(); }
    c.restore();
  }
  function lattice(c, side, s0, s1, z0, z1, o = {}) { // dark latticed window (shitomido) on face L (v=B) or R (u=A)
    const fp = (s, z) => (side === "L" ? pr(s, B, z) : pr(A, s, z));
    const q = [fp(s0, z0), fp(s1, z0), fp(s1, z1), fp(s0, z1)];
    fillPoly(c, q, o.col || "#4a3022", 0.9);
    c.save(); pl(c, q); c.clip(); c.strokeStyle = o.line || "rgba(225,185,130,0.55)"; c.lineWidth = 0.7;
    const n = o.n ?? 9, m = o.m ?? 7;
    for (let i = 1; i < n; i++) { const s = lerp(s0, s1, i / n); c.beginPath(); c.moveTo(...fp(s, z0)); c.lineTo(...fp(s, z1)); c.stroke(); }
    for (let i = 1; i < m; i++) { const z = lerp(z0, z1, i / m); c.beginPath(); c.moveTo(...fp(s0, z)); c.lineTo(...fp(s1, z)); c.stroke(); }
    c.restore();
    // frame
    c.strokeStyle = RED; c.lineWidth = 1.6; pl(c, q); c.stroke(); c.strokeStyle = INK; c.lineWidth = 0.6; c.stroke();
  }
  function body(k) {
    const c = k.ctx, t = k.t;
    // back wall + interior darkness
    fillPoly(c, [pr(0, B, 0), pr(A, B, 0), pr(A, B, ZW), pr(0, B, ZW)], "#efe7d4", 1);
    fillPoly(c, [pr(A, B, 0), pr(A, 0, 0), pr(A, 0, ZW), pr(A, B, ZW)], "#d9cfb9", 1);
    // facade bays
    const bays = [[0, 1.0, "lat"], [1.0, 2.0, "door"], [2.0, 3.67, "open"], [3.67, 4.69, "door"], [4.69, 5.7, "lat"]];
    for (const [a, b, kind] of bays) {
      const m = 0.08;
      if (kind === "lat") { lattice(c, "L", a + m, b - m, 0.08, ZC - 0.08); }
      else {
        // open bay: dark interior with a warm glow, lanterns, worshippers' silhouettes
        const q = [pr(a + 0.06, B, 0), pr(b - 0.06, B, 0), pr(b - 0.06, B, ZC), pr(a + 0.06, B, ZC)];
        const g = c.createLinearGradient(0, q[3][1], 0, q[0][1]); g.addColorStop(0, "#1c120c"); g.addColorStop(0.6, "#3a2414"); g.addColorStop(1, "#5a3a20");
        fillPoly(c, q, g, 0.9);
        // inner altar glow
        if (kind === "open") {
          const [gx, gy] = pr((a + b) / 2, B, 0.55), fl = 0.85 + 0.15 * Math.sin(t * 3.1);
          const rg = c.createRadialGradient(gx, gy, 2, gx, gy, 34); rg.addColorStop(0, `rgba(255,196,96,${0.55 * fl})`); rg.addColorStop(1, "rgba(255,170,60,0)"); c.fillStyle = rg; c.fillRect(gx - 40, gy - 34, 80, 60);
          // altar table + gold canopy
          fillPoly(c, [pr(a + 0.5, B, 0.0), pr(b - 0.5, B, 0.0), pr(b - 0.5, B, 0.42), pr(a + 0.5, B, 0.42)], "#6a3a1c", 0.8);
          fillPoly(c, [pr(a + 0.45, B, 0.42), pr(b - 0.45, B, 0.42), pr(b - 0.45, B, 0.5), pr(a + 0.45, B, 0.5)], GOLD, 0.7);
          // big hanging gold lantern (tsuri-doro) in the centre + two red lanterns
          const [lx, ly] = pr((a + b) / 2, B, 1.12), sw = Math.sin(t * 1.1) * 0.8;
          c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.moveTo(lx, ly - 12); c.lineTo(lx + sw, ly - 4); c.stroke();
          c.fillStyle = GOLD; c.beginPath(); c.moveTo(lx + sw - 9, ly - 3); c.lineTo(lx + sw + 9, ly - 3); c.lineTo(lx + sw + 6, ly + 6); c.lineTo(lx + sw - 6, ly + 6); c.closePath(); c.fill(); c.stroke();
          c.fillStyle = "#fff0a0"; c.fillRect(lx + sw - 4, ly - 1, 8, 5);
          c.beginPath(); c.ellipse(lx + sw, ly + 8, 7, 3, 0, 0, 6.3); c.fillStyle = GOLDD; c.fill(); c.stroke();
          for (const f of [0.22, 0.78]) { const [x, y] = pr(lerp(a, b, f), B, 1.15); chochin(k, x, y + 6, { r: 4.2, col: "#e8a53a", glow: true, seed: f * 9, amp: 0.6, drop: 4 }); }
        } else {
          // folding doors swung open, studded
          for (const [s0, s1] of [[a + 0.06, a + 0.3], [b - 0.3, b - 0.06]]) {
            const q2 = [pr(s0, B + 0.12, 0.02), pr(s1, B, 0.02), pr(s1, B, ZC - 0.05), pr(s0, B + 0.12, ZC - 0.05)];
            fillPoly(c, q2, "#7c5232", 0.8);
            c.fillStyle = GOLDD; for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const [x, y] = pr(lerp(s0, s1, 0.3 + j * 0.4), B + 0.06, 0.2 + i * 0.36); c.fillRect(x - 0.7, y - 0.7, 1.4, 1.4); }
          }
          const [gx, gy] = pr((a + b) / 2, B, 1.05); chochin(k, gx, gy + 6, { r: 3.6, col: "#e8a53a", glow: true, seed: a, amp: 0.6, drop: 4 });
        }
      }
      // red sill panel under the windows
      if (kind === "lat") fillPoly(c, [pr(a, B, 0), pr(b, B, 0), pr(b, B, 0.08), pr(a, B, 0.08)], REDD, 0.7);
    }
    // right side: three latticed bays
    for (let i = 0; i < 3; i++) lattice(c, "R", RCOLS[i] - 0.08, RCOLS[i + 1] + 0.08, 0.08, ZC - 0.08, { col: "#3f281c", line: "rgba(215,175,120,0.45)" });
    // white plaster band with red framing (between head beam and eave beam)
    for (const side of ["L", "R"]) {
      const fp = (s, z) => (side === "L" ? pr(s, B, z) : pr(A, s, z)), s0 = side === "L" ? 0 : B, s1 = side === "L" ? A : 0;
      fillPoly(c, [fp(s0, ZC), fp(s1, ZC), fp(s1, ZC + 0.14), fp(s0, ZC + 0.14)], side === "L" ? RED : REDD, 0.9); // head beam (nuki)
      fillPoly(c, [fp(s0, ZC + 0.14), fp(s1, ZC + 0.14), fp(s1, ZW), fp(s0, ZW)], side === "L" ? "#f5efe2" : "#ddd4c0", 0.9);
      fillPoly(c, [fp(s0, ZW - 0.06), fp(s1, ZW - 0.06), fp(s1, ZW + 0.06), fp(s0, ZW + 0.06)], side === "L" ? RED : REDD, 0.8);
      // gold line + small frog-leg struts (kaerumata) between columns
      c.strokeStyle = GOLD; c.lineWidth = 1; c.beginPath(); c.moveTo(...fp(s0, ZC + 0.03)); c.lineTo(...fp(s1, ZC + 0.03)); c.stroke();
      const cols = side === "L" ? COLS : RCOLS;
      for (let i = 0; i < cols.length - 1; i++) { const m = (cols[i] + cols[i + 1]) / 2, [x, y] = fp(m, ZC + 0.14); c.fillStyle = RED; c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x - 6, y); c.quadraticCurveTo(x - 4, y - 8, x, y - 9); c.quadraticCurveTo(x + 4, y - 8, x + 6, y); c.closePath(); c.fill(); c.stroke(); c.fillStyle = GOLD; c.fillRect(x - 1.4, y - 13, 2.8, 4); }
    }
    // columns
    for (const u of COLS) column(c, pr, u, B, 0, ZC + 0.05, u === 0 || u === A ? 4.6 : 4.2, RED, { ring: true });
    for (const v of RCOLS.slice(1)) column(c, pr, A, v, 0, ZC + 0.05, 3.8, shade(RED, -0.12), { ring: true });
    // bracket clusters on top of every column and between them
    for (const u of COLS) { const [x, y] = pr(u, B, ZW + 0.04); brackets(c, x, y, 16, 12); }
    for (const v of RCOLS.slice(1)) { const [x, y] = pr(A, v, ZW + 0.06); brackets(c, x, y, 10, 12, { col: REDD }); }
    for (let i = 0; i < COLS.length - 1; i++) { const [x, y] = pr((COLS[i] + COLS[i + 1]) / 2, B, ZW + 0.06); brackets(c, x, y, 8, 9, { tiers: 2 }); }
    // plaque "金龍山" over the central bay
    { const cu = (S0 + S1) / 2, q = [pr(cu - 0.5, B + 0.02, ZC - 0.22), pr(cu + 0.5, B + 0.02, ZC - 0.22), pr(cu + 0.5, B + 0.02, ZC + 0.24), pr(cu - 0.5, B + 0.02, ZC + 0.24)];
      fillPoly(c, q, GOLD, 1); const inn = [pr(cu - 0.42, B + 0.02, ZC - 0.16), pr(cu + 0.42, B + 0.02, ZC - 0.16), pr(cu + 0.42, B + 0.02, ZC + 0.18), pr(cu - 0.42, B + 0.02, ZC + 0.18)]; fillPoly(c, inn, "#a8251a", 0.8);
      const [x, y] = pr(cu, B + 0.02, ZC + 0.01); c.save(); c.translate(x, y); c.transform(1, 9.2 / 45, 0, 1, 0, 0); c.fillStyle = GOLDL; c.font = `900 11px ${FONT}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("金龍山", 0, 0); c.restore(); }
  }
  function railing(k, which) {
    const c = k.ctx, h = 0.42, v1 = B + RV, u0 = -RV, u1 = A + RV;
    const rail = (pts) => {
      const P0 = pts.map((p) => pr(p[0], p[1], 0)), P1 = pts.map((p) => pr(p[0], p[1], h));
      // balusters
      c.strokeStyle = INK; c.lineWidth = 2.4; c.lineCap = "butt";
      const posts = [];
      for (let i = 1; i < pts.length; i++) { const [a, b] = [pts[i - 1], pts[i]], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.75)); for (let j = 0; j <= n; j++) posts.push([lerp(a[0], b[0], j / n), lerp(a[1], b[1], j / n)]); }
      // lower rail + mid rail + balusters
      for (const zz of [0.08, 0.26]) { polyline(c, pts.map((p) => pr(p[0], p[1], zz))); c.strokeStyle = INK; c.lineWidth = 2.6; c.stroke(); c.strokeStyle = RED; c.lineWidth = 1.4; c.stroke(); }
      for (let i = 1; i < pts.length; i++) { const [a, b] = [pts[i - 1], pts[i]], n = Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.16); for (let j = 1; j < n; j++) { const q = [lerp(a[0], b[0], j / n), lerp(a[1], b[1], j / n)]; c.strokeStyle = "rgba(90,20,12,0.9)"; c.lineWidth = 1; c.beginPath(); c.moveTo(...pr(q[0], q[1], 0.08)); c.lineTo(...pr(q[0], q[1], 0.26)); c.stroke(); } }
      for (const q of posts) { const [x, y0] = pr(q[0], q[1], 0), [, y1] = pr(q[0], q[1], h + 0.04); c.fillStyle = RED; c.strokeStyle = INK; c.lineWidth = 0.8; c.fillRect(x - 1.8, y1, 3.6, y0 - y1); c.strokeRect(x - 1.8, y1, 3.6, y0 - y1); }
      // top rail (orange lacquer)
      polyline(c, P1); c.strokeStyle = INK; c.lineWidth = 3.8; c.stroke(); c.strokeStyle = "#f08a3c"; c.lineWidth = 2.2; c.stroke();
      // gold giboshi caps on the end and corner posts
      for (const q of [pts[0], ...pts.slice(1)]) { const [x, y] = pr(q[0], q[1], h + 0.04); c.fillStyle = GOLD; c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - 2.4, y); c.quadraticCurveTo(x - 2.6, y - 4, x, y - 6.5); c.quadraticCurveTo(x + 2.6, y - 4, x + 2.4, y); c.closePath(); c.fill(); c.stroke(); }
    };
    if (which === "back") { rail([[u0, 0.1], [u0, v1]]); }
    if (which === "front") { rail([[u0, v1], [S0 - 0.12, v1]]); rail([[S1 + 0.12, v1], [u1, v1], [u1, 0.1]]); }
  }
  function stairs(k) {
    const c = k.ctx, a0 = S0 - 0.12, a1 = S1 + 0.12, v1 = B + RV, n = 10, D = 1.05;
    for (let i = 0; i < n; i++) {
      const vA = v1 + (i / n) * D, vB = v1 + ((i + 1) / n) * D, zT = -((i + 1) / n) * (-ZP) * 1.0, zU = -(i / n) * (-ZP);
      // riser (front face) then tread
      fillPoly(c, [pr(a0, vB, zT), pr(a1, vB, zT), pr(a1, vB, zU), pr(a0, vB, zU)], shade("#cfc9bc", -0.12 + (i % 2) * 0.02), 0.7);
      fillPoly(c, [pr(a0, vA, zU), pr(a1, vA, zU), pr(a1, vB, zU), pr(a0, vB, zU)], shade("#e7e2d6", (i % 2) * -0.03), 0.7);
    }
    // cheek walls with sloped coping
    for (const [ua, ub] of [[a0 - 0.2, a0], [a1, a1 + 0.2]]) {
      const side = [pr(ub, v1, 0.12), pr(ub, v1 + D + 0.08, ZP + 0.18), pr(ub, v1 + D + 0.08, ZP), pr(ub, v1, ZP)];
      fillPoly(c, [pr(ua, v1, 0.12), pr(ua, v1 + D + 0.08, ZP + 0.18), pr(ua, v1 + D + 0.08, ZP), pr(ua, v1, ZP)], "#bdb6a6", 0.9);
      fillPoly(c, [pr(ua, v1 + D + 0.08, ZP + 0.18), pr(ub, v1 + D + 0.08, ZP + 0.18), pr(ub, v1 + D + 0.08, ZP), pr(ua, v1 + D + 0.08, ZP)], "#c9c2b2", 0.9);
      if (ua > S1) fillPoly(c, side, "#aaa392", 0.9);
      fillPoly(c, [pr(ua, v1, 0.12), pr(ub, v1, 0.12), pr(ub, v1 + D + 0.08, ZP + 0.18), pr(ua, v1 + D + 0.08, ZP + 0.18)], "#dcd6c8", 0.9);
    }
  }
  const ROOF = { u0: 0, u1: A, v0: 0, v1: B, ov: 0.82, Ze: 2.46, Zr: 4.66, type: "irimoya", gin: 1.15, gz: 0.5, p: 1.7, lift: 0.34, rc: 1.5, col: "#767c86", capCol: "#9aa0a8", stack: true, step: 0.125, ridgeH: 8, ridgeW: 7, hipW: 6.5, ornS: 1.7, oniS: 1.15, lip: 0.08, fascia: 0.2, rafters: 70 };
  return {
    pr, A, B, ZP, RV, S0, S1, uvz,
    drawBase(k) { under(k); railing(k, "back"); },
    drawBody(k) { body(k); },
    drawFront(k) { railing(k, "front"); stairs(k); },
    drawRoof(k) { jroof(k, pr, ROOF); },
  };
}

// ======================================================================================
// FIVE-STOREY PAGODA (Gojunoto), corner-on, in its own low-angle frame. Origin = centre of the base at platform level.
// ======================================================================================
export function makePagoda(o = {}) {
  const CU = o.u ?? 8.4, CV = o.v ?? 1.65, sh = o.s ?? 0.55, sz = o.sz ?? 1.0;
  const pr = (u, v, z = 0) => P(CU + u * sh, CV + v * sh, (z + 0.62) * sz);
  // roof half-size (with overhang), wall half-size, eave z, wall base z
  const T = [
    { H: 1.16, w: 0.64, Ze: 1.14, z0: 0.0 },
    { H: 1.06, w: 0.52, Ze: 2.16, z0: 1.36 },
    { H: 0.99, w: 0.49, Ze: 2.86, z0: 2.3 },
    { H: 0.93, w: 0.46, Ze: 3.55, z0: 3.0 },
    { H: 0.87, w: 0.43, Ze: 4.22, z0: 3.69 },
  ];
  function wall(k, i) {
    const c = k.ctx, d = T[i], w = d.w, z0 = d.z0, z1 = d.Ze - 0.1;
    if (i > 0) { // balcony deck + orange railing round the storey
      const o = w + 0.16;
      fbox(c, pr, -o, -o, z0, o * 2, o * 2, 0.05, "#7a4a2a", { top: "#9a6a42" });
    }
    fbox(c, pr, -w, -w, z0 + (i ? 0.05 : 0), w * 2, w * 2, z1 - z0, RED, { top: null, left: "#c9402d", right: "#a2301f" });
    // white plaster panels between posts, centre door with gold studs on the bottom storey
    for (const side of ["L", "R"]) {
      const fp = (s, z) => (side === "L" ? pr(lerp(-w, w, s), w, z) : pr(w, lerp(w, -w, s), z));
      const zA = z0 + (i ? 0.16 : 0.12), zB = z1 - 0.12;
      for (let j = 0; j < 3; j++) {
        const s0 = (j + 0.16) / 3, s1 = (j + 0.84) / 3;
        const door = j === 1;
        const col = door ? (i === 0 ? "#3e6a4c" : "#5a3a24") : (side === "L" ? "#f3ece0" : "#dcd3c2");
        fillPoly(c, [fp(s0, zA), fp(s1, zA), fp(s1, zB), fp(s0, zB)], col, 0.7);
        if (door) { c.fillStyle = GOLD; for (let a = 0; a < 3; a++) for (let b2 = 0; b2 < 2; b2++) { const [x, y] = fp(lerp(s0, s1, 0.3 + b2 * 0.4), lerp(zA, zB, 0.22 + a * 0.28)); c.fillRect(x - 0.7, y - 0.7, 1.4, 1.4); } }
        else if (i === 0) { // latticed windows on the ground storey
          c.strokeStyle = "rgba(120,60,30,0.5)"; c.lineWidth = 0.6; for (let a = 1; a < 4; a++) { c.beginPath(); c.moveTo(...fp(lerp(s0, s1, a / 4), zA)); c.lineTo(...fp(lerp(s0, s1, a / 4), zB)); c.stroke(); }
        }
      }
      // head beam + gold line + bracket band
      fillPoly(c, [fp(0, zB), fp(1, zB), fp(1, z1), fp(0, z1)], side === "L" ? RED : REDD, 0.7);
      c.strokeStyle = GOLD; c.lineWidth = 0.9; c.beginPath(); c.moveTo(...fp(0, zB + 0.03)); c.lineTo(...fp(1, zB + 0.03)); c.stroke();
      for (let j = 0; j <= 3; j++) { const [x, y] = fp(j / 3, z1 + 0.1); brackets(c, x, y, i ? 7 : 9, i ? 6 : 8, { tiers: 2, col: side === "L" ? RED : REDD }); }
    }
    // corner posts
    for (const [u, v] of [[-w, w], [w, w], [w, -w]]) { const [x, y0] = pr(u, v, z0), [, y1] = pr(u, v, z1); c.fillStyle = shade(RED, -0.05); c.strokeStyle = INK; c.lineWidth = 0.8; c.fillRect(x - 1.8, y1, 3.6, y0 - y1); c.strokeRect(x - 1.8, y1, 3.6, y0 - y1); }
    if (i > 0) { // balcony railing (front two sides)
      const o = w + 0.15, h = 0.2, pts = [[-o, o], [o, o], [o, -o]];
      c.strokeStyle = "#7a2a18"; c.lineWidth = 0.9;
      for (let j = 0; j < 2; j++) { const [a, b] = [pts[j], pts[j + 1]]; for (let m = 0; m <= 8; m++) { const q = [lerp(a[0], b[0], m / 8), lerp(a[1], b[1], m / 8)]; c.beginPath(); c.moveTo(...pr(q[0], q[1], z0 + 0.05)); c.lineTo(...pr(q[0], q[1], z0 + 0.05 + h)); c.stroke(); } }
      polyline(c, pts.map((q) => pr(q[0], q[1], z0 + 0.05 + h))); c.strokeStyle = INK; c.lineWidth = 3; c.stroke(); c.strokeStyle = "#f09040"; c.lineWidth = 1.7; c.stroke();
    }
  }
  function roof(k, i) {
    const d = T[i], top = i < 4 ? T[i + 1].w + 0.1 : 0.16, zt = i < 4 ? T[i + 1].z0 + 0.02 : d.Ze + 0.42;
    const H = d.H, w = d.w;
    const R = jroof(k, pr, { type: "pyramid", u0: -w, u1: w, v0: -w, v1: w, ov: H - w, Ze: d.Ze, Zr: zt, top, p: 1.55, lift: 0.17, rc: 0.62, col: "#777d87", capCol: "#a2a7ae", step: 0.085, hipW: 3.6, rafterRows: 1, rafterSize: 1.4, fasCol: "#8e2a1c", oniS: 0.75, lip: 0.06, fascia: 0.12, rafters: 34, endR: 1.1, ribW: 1.2, course: 0.11, allEaves: false });
    // gold wind bells hanging from the four corners
    const c = k.ctx, t = k.t;
    for (const [u, v] of [[-H, H], [H, H], [H, -H], [-H, -H]]) {
      const [x, y] = R.X(u, v, d.Ze - 0.06), sw = Math.sin(t * 2.3 + u * 3 + v * 5 + i) * 1.2;
      c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x, y); c.lineTo(x + sw, y + 4); c.stroke();
      c.fillStyle = GOLD; c.beginPath(); c.moveTo(x + sw - 1.8, y + 7.5); c.quadraticCurveTo(x + sw - 1.8, y + 3.6, x + sw, y + 3.6); c.quadraticCurveTo(x + sw + 1.8, y + 3.6, x + sw + 1.8, y + 7.5); c.closePath(); c.fill(); c.stroke();
    }
  }
  function finial(k) {
    const c = k.ctx, t = k.t, z0 = T[4].Ze + 0.42;
    fbox(c, pr, -0.17, -0.17, z0 - 0.04, 0.34, 0.34, 0.16, "#5d6572"); // roban
    const [bx, by] = pr(0, 0, z0 + 0.12);
    c.save(); c.translate(bx, by); c.scale(0.84, 0.84); c.translate(-bx, -by);
    const g = (x0, x1) => { const gg = c.createLinearGradient(x0, 0, x1, 0); gg.addColorStop(0, GOLDL); gg.addColorStop(0.45, GOLD); gg.addColorStop(1, GOLDD); return gg; };
    // bowl (fukubachi)
    c.beginPath(); c.moveTo(bx - 8, by - 6); c.quadraticCurveTo(bx - 8, by + 1, bx, by + 1); c.quadraticCurveTo(bx + 8, by + 1, bx + 8, by - 6); c.closePath(); c.fillStyle = g(bx - 8, bx + 8); c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
    // lotus flower + mast with nine rings (kurin)
    c.beginPath(); c.moveTo(bx - 7, by - 6); c.quadraticCurveTo(bx - 7, by - 13, bx, by - 13); c.quadraticCurveTo(bx + 7, by - 13, bx + 7, by - 6); c.closePath(); c.fillStyle = g(bx - 7, bx + 7); c.fill(); c.stroke();
    c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.moveTo(bx, by - 12); c.lineTo(bx, by - 82); c.stroke(); c.strokeStyle = GOLD; c.lineWidth = 1.8; c.stroke();
    for (let i = 0; i < 9; i++) { const y = by - 18 - i * 6.3, r = 6.4 - i * 0.22; c.beginPath(); c.ellipse(bx, y, r, r * 0.4, 0, 0, 6.3); c.fillStyle = g(bx - r, bx + r); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke(); }
    // water-flame (suien) and jewel
    c.beginPath(); c.moveTo(bx, by - 104); c.bezierCurveTo(bx + 9, by - 96, bx + 7, by - 86, bx + 2, by - 80); c.lineTo(bx - 2, by - 80); c.bezierCurveTo(bx - 7, by - 86, bx - 9, by - 96, bx, by - 104); c.fillStyle = g(bx - 8, bx + 8); c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
    c.strokeStyle = GOLDD; c.lineWidth = 0.7; c.beginPath(); for (const s of [-1, 1]) { c.moveTo(bx, by - 100); c.quadraticCurveTo(bx + s * 5, by - 92, bx + s * 2, by - 84); } c.stroke();
    c.beginPath(); c.arc(bx, by - 106, 3, 0, 6.3); c.fillStyle = GOLDL; c.fill(); c.strokeStyle = INK; c.stroke();
    const gl = 0.5 + 0.5 * Math.sin(t * 2.2); c.fillStyle = `rgba(255,252,210,${0.25 + gl * 0.55})`; c.beginPath(); c.arc(bx - 1, by - 107, 1.3, 0, 6.3); c.fill();
    c.restore();
  }
  function base(k) {
    const c = k.ctx, o = 1.5, zb = -0.62;
    // stone platform
    fbox(c, pr, -o, -o, zb, o * 2, o * 2, -zb, "#cdc6b6", { top: "#ddd7c9", left: "#c7c0b0", right: "#aca595" });
    c.save(); pl(c, [pr(-o, -o, 0), pr(o, -o, 0), pr(o, o, 0), pr(-o, o, 0)]); c.clip(); c.strokeStyle = "rgba(120,110,95,0.3)"; c.lineWidth = 0.6;
    for (let i = -6; i <= 6; i++) { const f = i * 0.25; c.beginPath(); c.moveTo(...pr(f, -o, 0)); c.lineTo(...pr(f, o, 0)); c.moveTo(...pr(-o, f, 0)); c.lineTo(...pr(o, f, 0)); c.stroke(); }
    c.restore();
    // block courses on the platform faces
    c.strokeStyle = "rgba(100,90,75,0.35)"; c.lineWidth = 0.6;
    for (const zz of [zb * 0.5]) { c.beginPath(); c.moveTo(...pr(-o, o, zz)); c.lineTo(...pr(o, o, zz)); c.lineTo(...pr(o, -o, zz)); c.stroke(); }
  }
  function balustrade(k, which) {
    const c = k.ctx, o = 1.42, h = 0.3;
    const segs = which === "back" ? [[[-o, -o], [o, -o]], [[-o, -o], [-o, o]]] : [[[-o, o], [-0.55, o]], [[0.55, o], [o, o]], [[o, o], [o, -o]]];
    for (const [a, b] of segs) {
      const n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.32));
      for (let j = 0; j <= n; j++) { const q = [lerp(a[0], b[0], j / n), lerp(a[1], b[1], j / n)], [x, y0] = pr(q[0], q[1], 0), [, y1] = pr(q[0], q[1], h); c.fillStyle = "#ebe6da"; c.strokeStyle = INK; c.lineWidth = 0.8; c.fillRect(x - 1.5, y1, 3, y0 - y1); c.strokeRect(x - 1.5, y1, 3, y0 - y1); }
      for (const zz of [h * 0.55, h]) { polyline(c, [pr(a[0], a[1], zz), pr(b[0], b[1], zz)]); c.strokeStyle = INK; c.lineWidth = zz === h ? 3.4 : 2.2; c.stroke(); c.strokeStyle = "#f1ece2"; c.lineWidth = zz === h ? 2 : 1; c.stroke(); }
    }
  }
  return {
    pr, T,
    draw(k) {
      base(k); balustrade(k, "back");
      for (let i = 0; i < 5; i++) { wall(k, i); roof(k, i); }
      finial(k);
      balustrade(k, "front");
    },
    stairs(k) { // the flight down from the platform toward the hall side (+v)
      const c = k.ctx;
      for (let s = 0; s < 6; s++) { const zT = -0.62 * (s / 6), zU = -0.62 * ((s + 1) / 6), vA = 1.5 + s * 0.17, vB = vA + 0.17; fillPoly(c, [pr(-0.5, vA, zT), pr(0.5, vA, zT), pr(0.5, vB, zT), pr(-0.5, vB, zT)], "#e3ddd0", 0.6); fillPoly(c, [pr(-0.5, vB, zT), pr(0.5, vB, zT), pr(0.5, vB, zU), pr(-0.5, vB, zU)], "#bdb6a6", 0.6); }
    },
  };
}

// ======================================================================================
// KAMINARIMON gate, near-frontal frame: u along the gate (left->right), v front-to-back depth (0 back, D front).
// ======================================================================================
export function makeGate(o = {}) {
  const W = 5.2, D = 1.6, ZC = 1.98;
  const gs = o.s ?? 0.62, gz = o.sz ?? 0.85, GU = o.u ?? 1.45, GV = o.v ?? 8.55;
  const pr = (u, v, z = 0) => P(GU + u * gs, GV + v * gs, z * gz);
  const PU = [0, 1.22, 3.98, 5.2];
  const ROOF = { u0: 0, u1: W, v0: 0, v1: D, ov: 0.85, Ze: 2.38, Zr: 3.32, type: "irimoya", gin: 1.25, gz: 0.48, p: 1.7, lift: 0.42, rc: 1.7, col: "#6d7583", step: 0.12, ridgeH: 5, ridgeW: 5, hipW: 4, ornS: 1.45, oniS: 1.05, lip: 0.07, fascia: 0.17, rafters: 64 };
  const pillar = (c, u, v, col = RED) => column(c, pr, u, v, 0, ZC, 6.2, col, { bh: 7, ring: true });
  function guardian(c, cu, k, which) { // Fujin (wind, left) and Raijin (thunder, right) in the side bays
    const t = k.t, [x, y] = pr(cu, D - 0.35, 0.95), sk = which ? "#b98a4a" : "#a8803e";
    // halo / drum ring for Raijin, wind bag for Fujin
    c.save();
    if (which) { c.strokeStyle = GOLD; c.lineWidth = 2; c.beginPath(); c.arc(x, y - 14, 15, Math.PI * 1.05, Math.PI * 1.95); c.stroke(); for (let i = 0; i < 6; i++) { const a = Math.PI * (1.08 + i * 0.16); c.fillStyle = "#c8a24a"; c.beginPath(); c.arc(x + Math.cos(a) * 15, y - 14 + Math.sin(a) * 15, 2.4, 0, 6.3); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.6; c.stroke(); } }
    else { c.fillStyle = "#e9e1cc"; c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - 14, y - 20); c.quadraticCurveTo(x, y - 34, x + 14, y - 20); c.quadraticCurveTo(x, y - 26, x - 14, y - 20); c.fill(); c.stroke(); }
    // body: muscular figure in a dynamic pose (bronze-gold), arms raised
    c.fillStyle = sk; c.strokeStyle = INK; c.lineWidth = 0.9;
    c.beginPath(); c.ellipse(x, y - 4, 6.5, 8.5, 0, 0, 6.3); c.fill(); c.stroke(); // torso
    c.beginPath(); c.arc(x, y - 16, 4.3, 0, 6.3); c.fill(); c.stroke(); // head
    c.fillStyle = "#f2d07a"; c.fillRect(x - 3, y - 18, 1.6, 1.2); c.fillRect(x + 1.4, y - 18, 1.6, 1.2);
    c.strokeStyle = INK; c.lineWidth = 3.4; c.lineCap = "round"; c.beginPath(); c.moveTo(x - 5, y - 9); c.lineTo(x - 11, y - 16); c.lineTo(x - 9, y - 22); c.moveTo(x + 5, y - 9); c.lineTo(x + 11, y - 14); c.lineTo(x + 13, y - 20); c.moveTo(x - 3, y + 3); c.lineTo(x - 7, y + 10); c.lineTo(x - 10, y + 13); c.moveTo(x + 3, y + 3); c.lineTo(x + 6, y + 11); c.lineTo(x + 9, y + 13); c.stroke();
    c.strokeStyle = sk; c.lineWidth = 2; c.stroke();
    // flowing scarf
    c.strokeStyle = "#e0b04a"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x - 10, y - 2); c.quadraticCurveTo(x - 16, y + 4 + Math.sin(t * 2) * 1.5, x - 12, y + 9); c.moveTo(x + 10, y - 2); c.quadraticCurveTo(x + 16, y + 4 - Math.sin(t * 2) * 1.5, x + 12, y + 9); c.stroke();
    c.restore();
  }
  return {
    pr, D, W,
    back(k) {
      const c = k.ctx;
      // shadow + stone threshold
      fbox(c, pr, -0.3, -0.25, -0.02, W + 0.6, D + 0.5, 0.03, "#d8cdb8", { top: "#e2d8c4", lw: 0 });
      // back row of pillars + dark passage interior
      // open passage: only a dim ceiling band at the top (the plaza shows through)
      fillPoly(c, [pr(PU[1], 0.15, ZC - 0.3), pr(PU[2], 0.15, ZC - 0.3), pr(PU[2], 0.15, ZC), pr(PU[1], 0.15, ZC)], "#5a2a1c", 1);
      for (const u of PU) pillar(c, u, 0.15, shade(RED, -0.2));
      // side bays: grilles in front of the guardians
      for (const [a, b, which] of [[PU[0], PU[1], 0], [PU[2], PU[3], 1]]) {
        fillPoly(c, [pr(a, D - 0.1, 0), pr(b, D - 0.1, 0), pr(b, D - 0.1, ZC), pr(a, D - 0.1, ZC)], "#2c1d16", 1);
        // niche backing (deep red) and the statue
        fillPoly(c, [pr(a + 0.1, D - 0.12, 0.62), pr(b - 0.1, D - 0.12, 0.62), pr(b - 0.1, D - 0.12, ZC - 0.22), pr(a + 0.1, D - 0.12, ZC - 0.22)], "#6e2216", 0.8);
        guardian(c, (a + b) / 2, k, which);
        // lower green lattice panel + red rails
        fillPoly(c, [pr(a, D - 0.05, 0.05), pr(b, D - 0.05, 0.05), pr(b, D - 0.05, 0.6), pr(a, D - 0.05, 0.6)], "#3f8a62", 0.9);
        c.strokeStyle = "rgba(15,50,30,0.85)"; c.lineWidth = 1; for (let i = 1; i < 14; i++) { const u = lerp(a, b, i / 14); c.beginPath(); c.moveTo(...pr(u, D - 0.05, 0.05)); c.lineTo(...pr(u, D - 0.05, 0.6)); c.stroke(); }
        for (const z of [0.05, 0.6, 0.66]) fillPoly(c, [pr(a, D - 0.04, z), pr(b, D - 0.04, z), pr(b, D - 0.04, z + 0.06), pr(a, D - 0.04, z + 0.06)], RED, 0.7);
        // upper white panels
        fillPoly(c, [pr(a, D - 0.05, ZC - 0.2), pr(b, D - 0.05, ZC - 0.2), pr(b, D - 0.05, ZC), pr(a, D - 0.05, ZC)], "#efe7d4", 0.8);
      }
    },
    lantern(k) {
      const c = k.ctx, t = k.t, sway = Math.sin(t * 0.9) * 1.6, [ax, ay] = pr(W / 2, D / 2, ZC - 0.05), lx = ax + sway, ly = ay + 44, rx = 28, ry = 26;
      c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); c.moveTo(ax, ay); c.lineTo(lx, ly - ry - 7); c.stroke();
      // black lacquer top and bottom rings (with gold trim)
      const ring = (y, w, h) => { c.fillStyle = "#2a2422"; c.beginPath(); c.roundRect(lx - w / 2, y, w, h, 2); c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke(); c.fillStyle = GOLD; c.fillRect(lx - w / 2 + 1, y + h - 2, w - 2, 1.4); };
      ring(ly - ry - 8, 30, 8);
      c.beginPath(); c.ellipse(lx, ly, rx, ry, 0, 0, 6.3);
      const g = c.createRadialGradient(lx - 10, ly - 9, 3, lx, ly, rx * 1.15); g.addColorStop(0, "#f26a48"); g.addColorStop(0.55, "#d6382a"); g.addColorStop(1, "#8a1d14");
      c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.7; c.stroke();
      c.save(); c.beginPath(); c.ellipse(lx, ly, rx, ry, 0, 0, 6.3); c.clip();
      c.strokeStyle = "rgba(70,12,6,0.45)"; c.lineWidth = 0.8; for (let i = -8; i <= 8; i++) { const yy = ly + i * 3.2; c.beginPath(); c.ellipse(lx, yy, rx, 4.5, 0, 0, Math.PI); c.stroke(); }
      // brush calligraphy 雷門 (bold black, slightly skewed like the real one)
      c.fillStyle = "#170c08"; c.font = `900 19px ${FONT}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("雷", lx, ly - 9); c.fillText("門", lx, ly + 11);
      c.fillStyle = "rgba(255,220,180,0.25)"; c.beginPath(); c.ellipse(lx - 11, ly - 12, 6, 10, -0.4, 0, 6.3); c.fill();
      c.restore();
      ring(ly + ry - 2, 26, 9);
      // tassel
      c.strokeStyle = "#2a2422"; c.lineWidth = 1; c.beginPath(); c.moveTo(lx, ly + ry + 7); c.lineTo(lx + sway * 0.4, ly + ry + 12); c.stroke();
    },
    front(k) {
      const c = k.ctx;
      for (const u of PU) pillar(c, u, D, RED);
      // tie beams across the front with gold ends, gold dot band, bracket clusters
      fillPoly(c, [pr(-0.1, D, ZC - 0.02), pr(W + 0.1, D, ZC - 0.02), pr(W + 0.1, D, ZC + 0.14), pr(-0.1, D, ZC + 0.14)], RED, 1);
      fillPoly(c, [pr(-0.1, D, ZC + 0.14), pr(W + 0.1, D, ZC + 0.14), pr(W + 0.1, D, ZC + 0.24), pr(-0.1, D, ZC + 0.24)], "#f1e9d6", 0.8);
      c.fillStyle = GOLD; for (let i = 0; i <= 40; i++) { const [x, y] = pr(lerp(-0.05, W + 0.05, i / 40), D, ZC + 0.07); c.fillRect(x - 0.9, y - 0.9, 1.8, 1.8); }
      for (const u of PU) { const [x, y] = pr(u, D, ZC + 0.36); brackets(c, x, y, 14, 9, { tiers: 3 }); }
      for (let i = 0; i < 3; i++) { const [x, y] = pr((PU[i] + PU[i + 1]) / 2, D, ZC + 0.36); brackets(c, x, y, 9, 7, { tiers: 2 }); }
    },
    roof(k) { jroof(k, pr, ROOF); },
  };
}

// ======================================================================================
// JOKO-RO: bronze incense burner with its little roof, embers and rising smoke (tile frame)
// ======================================================================================
export function incenseBurner(k, u, v, t, sc = 0.76) {
  const c = k.ctx, [x, y] = P(u, v, 0), G = "#4c6e60", GD = "#2c483e", GL = "#78a08e";
  k.ell(u + 0.2, v + 0.1, 0, 0.85, "rgba(60,45,30,0.16)", { stroke: false });
  c.save(); c.translate(x, y); c.scale(sc, sc); c.translate(-x, -y);
  // three lion-paw legs
  for (const [dx, dy] of [[-27, -2], [27, -2], [0, 6]]) {
    c.fillStyle = GD; c.beginPath(); c.moveTo(x + dx - 6, y + dy - 30); c.quadraticCurveTo(x + dx - 9, y + dy - 14, x + dx - 6, y + dy - 4); c.lineTo(x + dx + 6, y + dy - 4); c.quadraticCurveTo(x + dx + 9, y + dy - 14, x + dx + 6, y + dy - 30); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
    c.fillStyle = G; c.beginPath(); c.ellipse(x + dx, y + dy - 3, 7, 3.4, 0, 0, 6.3); c.fill(); c.stroke();
  }
  // body bowl
  const by = y - 28;
  c.beginPath(); c.moveTo(x - 46, by - 26); c.bezierCurveTo(x - 50, by - 2, x - 30, by + 6, x, by + 6); c.bezierCurveTo(x + 30, by + 6, x + 50, by - 2, x + 46, by - 26); c.ellipse(x, by - 26, 46, 15, 0, 0, Math.PI, true); c.closePath();
  const g = c.createLinearGradient(x - 50, 0, x + 50, 0); g.addColorStop(0, GL); g.addColorStop(0.45, G); g.addColorStop(1, GD); c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
  // gold relief: wheel medallion + scroll band
  c.strokeStyle = "rgba(226,190,90,0.85)"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - 44, by - 18); c.quadraticCurveTo(x, by - 4, x + 44, by - 18); c.stroke();
  c.beginPath(); c.arc(x + 2, by - 9, 9, 0, 6.3); c.fillStyle = "#d8ad48"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  c.strokeStyle = "#7a5a14"; c.lineWidth = 0.8; c.beginPath(); c.arc(x + 2, by - 9, 5, 0, 6.3); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.moveTo(x + 2, by - 9); c.lineTo(x + 2 + Math.cos(a) * 8, by - 9 + Math.sin(a) * 8); } c.stroke();
  for (const s of [-1, 1]) { c.strokeStyle = "rgba(226,190,90,0.8)"; c.lineWidth = 1; c.beginPath(); c.arc(x + s * 26, by - 12, 4.5, 0, 6.3); c.stroke(); }
  // lion-head handles
  for (const s of [-1, 1]) { c.beginPath(); c.arc(x + s * 49, by - 28, 6.5, 0, 6.3); c.fillStyle = GD; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke(); c.fillStyle = "#d8ad48"; c.beginPath(); c.arc(x + s * 49, by - 28, 2.4, 0, 6.3); c.fill(); }
  // rim + ash with glowing embers
  c.beginPath(); c.ellipse(x, by - 26, 46, 15, 0, 0, 6.3); c.fillStyle = GL; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
  c.beginPath(); c.ellipse(x, by - 27, 39, 12, 0, 0, 6.3); c.fillStyle = "#6c665d"; c.fill(); c.stroke();
  for (let i = 0; i < 22; i++) { const a = i * 2.4, r = 0.15 + 0.75 * ((i * 0.37) % 1), on = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7); c.fillStyle = `rgba(255,${120 + on * 100},60,${0.35 + on * 0.55})`; c.beginPath(); c.arc(x + Math.cos(a) * 33 * r, by - 27 + Math.sin(a) * 10 * r, 1.5, 0, 6.3); c.fill(); }
  c.strokeStyle = "#8a4a2a"; c.lineWidth = 1; for (const dx of [-16, -7, 4, 13, 21]) { c.beginPath(); c.moveTo(x + dx, by - 27); c.lineTo(x + dx * 1.05, by - 41 - (Math.abs(dx) % 4)); c.stroke(); c.fillStyle = "#ff8a3a"; c.fillRect(x + dx * 1.05 - 0.8, by - 42 - (Math.abs(dx) % 4), 1.6, 1.6); }
  // four posts carrying the canopy
  const roofY = by - 54;
  for (const [dx, dy] of [[-36, -4], [36, -4], [-24, 6], [24, 6]]) { c.strokeStyle = INK; c.lineWidth = 3.6; c.beginPath(); c.moveTo(x + dx, by - 24 + dy * 0.3); c.lineTo(x + dx * 0.95, roofY + 6); c.stroke(); c.strokeStyle = G; c.lineWidth = 2; c.stroke(); }
  // smoke rises through the open sides (drawn before the canopy so it passes behind its lip)
  smoke(k, x + 2, by - 40, { n: 9, h: 40, speed: 0.22, r: 4, grow: 6, a: 0.55, wind: 4 });
  // canopy: curved hip roof with upturned corners, green bronze, tile ribs, finial
  const rw = 58, rh = 22;
  c.beginPath(); c.moveTo(x - rw, roofY + 2); c.quadraticCurveTo(x - rw * 0.55, roofY + 12, x, roofY + 13); c.quadraticCurveTo(x + rw * 0.55, roofY + 12, x + rw, roofY + 2);
  c.quadraticCurveTo(x + rw * 0.6, roofY - 2, x + 9, roofY - rh); c.lineTo(x - 9, roofY - rh); c.quadraticCurveTo(x - rw * 0.6, roofY - 2, x - rw, roofY + 2); c.closePath();
  const g2 = c.createLinearGradient(0, roofY - rh, 0, roofY + 13); g2.addColorStop(0, "#86ad9a"); g2.addColorStop(1, "#3e5f52"); c.fillStyle = g2; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
  c.save(); c.clip(); c.strokeStyle = "rgba(20,40,32,0.55)"; c.lineWidth = 1; for (let i = -9; i <= 9; i++) { c.beginPath(); c.moveTo(x + i * 1.1, roofY - rh); c.quadraticCurveTo(x + i * 3.6, roofY - 4, x + i * 6.2, roofY + 13 - Math.abs(i) * 0.9); c.stroke(); } c.restore();
  // hip lines + eave lip
  c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(x - 9, roofY - rh); c.quadraticCurveTo(x - 16, roofY + 4, x - 30, roofY + 11); c.moveTo(x + 9, roofY - rh); c.quadraticCurveTo(x + 16, roofY + 4, x + 30, roofY + 11); c.stroke(); c.strokeStyle = "#a8c8b6"; c.lineWidth = 1.1; c.stroke();
  c.beginPath(); c.moveTo(x - rw, roofY + 2); c.quadraticCurveTo(x - rw * 0.55, roofY + 12, x, roofY + 13); c.quadraticCurveTo(x + rw * 0.55, roofY + 12, x + rw, roofY + 2); c.strokeStyle = INK; c.lineWidth = 3.4; c.stroke(); c.strokeStyle = "#2f4a40"; c.lineWidth = 1.8; c.stroke();
  for (const s of [-1, 1]) { c.fillStyle = "#d8ad48"; c.beginPath(); c.arc(x + s * rw, roofY + 1, 2.2, 0, 6.3); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.7; c.stroke(); }
  // finial: bud on a stem
  c.fillStyle = G; c.strokeStyle = INK; c.lineWidth = 1.1; c.beginPath(); c.roundRect(x - 9, roofY - rh - 4, 18, 5, 2); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(x - 6, roofY - rh - 4); c.quadraticCurveTo(x - 8, roofY - rh - 14, x, roofY - rh - 20); c.quadraticCurveTo(x + 8, roofY - rh - 14, x + 6, roofY - rh - 4); c.closePath(); c.fillStyle = GL; c.fill(); c.stroke();
  // the big plume above the roof
  c.restore();
  // the big plume above the roof (unscaled so it billows wide)
  smoke(k, x + 3, y + (roofY - rh - 16 - y) * sc, { n: 14, h: 130, speed: 0.13, r: 4, grow: 14, a: 0.62, wind: 20 });
}

// stone toro lantern (tall, as painted): two-step plinth, round shaft, platform, lit firebox, curved roof, jewel
export function toroTall(k, u, v, o = {}) {
  const c = k.ctx, t = k.t, s = o.s ?? 1, [x, y] = P(u, v, 0), S = "#cbc5b7", SD = "#a49d8f", SL = "#e2ddd2";
  k.ell(u + 0.22, v + 0.1, 0, 0.42 * s, "rgba(60,45,30,0.16)", { stroke: false });
  const slab = (yb, w, h, d) => { // a square slab seen corner-on: front-left / front-right faces + top
    const L = [[x - w, yb - h], [x, yb - h + d], [x, yb + d], [x - w, yb]], R = [[x, yb - h + d], [x + w, yb - h], [x + w, yb], [x, yb + d]], T = [[x - w, yb - h], [x, yb - h - d], [x + w, yb - h], [x, yb - h + d]];
    fillPoly(c, L, S, 1); fillPoly(c, R, SD, 1); fillPoly(c, T, SL, 1);
  };
  slab(y - 2 * s, 14 * s, 6 * s, 7 * s); slab(y - 8 * s, 11 * s, 6 * s, 5.5 * s);
  // shaft
  const g = c.createLinearGradient(x - 5 * s, 0, x + 5 * s, 0); g.addColorStop(0, SL); g.addColorStop(1, SD);
  c.fillStyle = g; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.rect(x - 4.5 * s, y - 38 * s, 9 * s, 24 * s); c.fill(); c.stroke();
  c.strokeStyle = "rgba(90,80,70,0.5)"; c.lineWidth = 0.7; for (const f of [0.3, 0.7]) { c.beginPath(); c.moveTo(x - 4.5 * s, y - 38 * s + 24 * s * f); c.lineTo(x + 4.5 * s, y - 38 * s + 24 * s * f); c.stroke(); }
  slab(y - 38 * s, 12 * s, 4 * s, 5 * s);
  // firebox with lit windows
  const lit = 0.75 + 0.25 * Math.sin(t * 4.3 + u * 7 + v);
  fillPoly(c, [[x - 8 * s, y - 56 * s], [x, y - 53 * s], [x, y - 42 * s], [x - 8 * s, y - 45 * s]], S, 1);
  fillPoly(c, [[x, y - 53 * s], [x + 8 * s, y - 56 * s], [x + 8 * s, y - 45 * s], [x, y - 42 * s]], SD, 1);
  c.fillStyle = `rgba(255,${Math.round(180 + 40 * lit)},100,${0.6 + 0.35 * lit})`;
  fillPoly(c, [[x - 6 * s, y - 53.5 * s], [x - 2 * s, y - 52.3 * s], [x - 2 * s, y - 46 * s], [x - 6 * s, y - 47.2 * s]], c.fillStyle, 0.6);
  fillPoly(c, [[x + 2 * s, y - 52.3 * s], [x + 6 * s, y - 53.5 * s], [x + 6 * s, y - 47.2 * s], [x + 2 * s, y - 46 * s]], `rgba(240,${Math.round(160 + 40 * lit)},90,${0.5 + 0.3 * lit})`, 0.6);
  // curved roof with upturned corners
  const ry = y - 56 * s, rw = 17 * s;
  c.beginPath(); c.moveTo(x - rw, ry - 1 * s); c.quadraticCurveTo(x - rw * 0.5, ry + 2 * s, x, ry + 5 * s); c.quadraticCurveTo(x + rw * 0.5, ry + 2 * s, x + rw, ry - 1 * s);
  c.quadraticCurveTo(x + rw * 0.45, ry - 4 * s, x + 2 * s, ry - 13 * s); c.lineTo(x - 2 * s, ry - 13 * s); c.quadraticCurveTo(x - rw * 0.45, ry - 4 * s, x - rw, ry - 1 * s); c.closePath();
  const g2 = c.createLinearGradient(x - rw, 0, x + rw, 0); g2.addColorStop(0, SL); g2.addColorStop(0.5, S); g2.addColorStop(1, SD); c.fillStyle = g2; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke();
  c.strokeStyle = "rgba(80,70,60,0.6)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x, ry + 5 * s); c.quadraticCurveTo(x + 0.5 * s, ry - 4 * s, x, ry - 13 * s); c.stroke();
  // jewel (hoju)
  c.fillStyle = S; c.beginPath(); c.ellipse(x, ry - 15 * s, 3.4 * s, 2 * s, 0, 0, 6.3); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(x - 3 * s, ry - 16 * s); c.quadraticCurveTo(x - 3.5 * s, ry - 21 * s, x, ry - 23 * s); c.quadraticCurveTo(x + 3.5 * s, ry - 21 * s, x + 3 * s, ry - 16 * s); c.closePath(); c.fillStyle = SL; c.fill(); c.stroke();
}
