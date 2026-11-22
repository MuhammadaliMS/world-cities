// helpers for the Dubai -1,-1 tile (Burj Al Arab & Jumeirah Beach). Private to this tile; _props.js is untouched.
import { P, CTS, INK, shade, lerp, clamp, rng, smooth, spline, drawHuman } from "../../lib/vec-kit.js";
import { look } from "./_props.js";

// The reference's slab top sits ~26 px below the stage slab top, so reference pixels are lifted by DY before
// being turned into tile units. Gz: reference pixel at height z -> tile (u, v).
export const DY = 26;
export const Gz = (x, y, z = 0) => { const yy = y - DY + z * CTS.S * CTS.ZS; const a = (x - CTS.X0) / CTS.S, b = (yy - CTS.Y0) / (CTS.S * CTS.YS); return [(a + b) / 2, (b - a) / 2]; };
export const pz = (pts, z = 0) => pts.map(([x, y]) => Gz(x, y, z));
export function inPoly([x, y], pts) { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; }
export const tr = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
export const trUV = (c, pts, z = 0) => tr(c, pts.map(([u, v]) => P(u, v, z)));
// smooth closed/open resample of a (u,v) polyline (Catmull-Rom via the kit spline)
export function smoothPts(pts, closed, n) { const sp = spline(pts, closed); const out = []; const m = n ?? Math.max(8, Math.round(sp.L / 0.12)); for (let i = 0; i <= (closed ? m - 1 : m); i++) { const s = sp.sample((i / m) * sp.L); out.push([s.u, s.v]); } return out; }
export function clipTile(k) { const c = k.ctx; c.save(); tr(c, [P(0, 0), P(10, 0), P(10, 10), P(0, 10)]); c.clip(); }

export const SAND = "#efd6a3", SAND_W = "#d9b980", SAND_D = "#e2c48e";
export const SEA_DEEP = "#1f93ad", SEA_MID = "#36b2c0", SEA_SHALLOW = "#6fd2c9";

// ---------- sea: depth gradient, drifting wavelets, darker swell marks, glitter ----------
export function sea(k, poly) {
  const c = k.ctx, t = k.t;
  const P2 = poly.map(([u, v]) => P(u, v, 0));
  tr(c, P2);
  const g = c.createLinearGradient(0, 430, 0, 790);
  g.addColorStop(0, "#2596b0"); g.addColorStop(0.45, "#33aebb"); g.addColorStop(0.8, "#52c6c4"); g.addColorStop(1, SEA_SHALLOW);
  c.fillStyle = g; c.fill();
  c.save(); tr(c, P2); c.clip();
  const bb = [Math.min(...poly.map((p) => p[0])), Math.max(...poly.map((p) => p[0])), Math.min(...poly.map((p) => p[1])), Math.max(...poly.map((p) => p[1]))];
  // broad soft swell bands (lighter crests drifting toward the beach)
  for (let i = 0; i < 9; i++) {
    const f = ((t * 0.035 + i / 9) % 1), s = -2 + f * 14; // along u+v
    const a = 0.1 * Math.sin(Math.PI * f);
    c.strokeStyle = `rgba(190,245,240,${a})`; c.lineWidth = 9; c.beginPath();
    { let first = true; for (let j = 0; j <= 24; j++) { const d = -6 + j * 0.5, u = clamp(s / 2 + d / 2, bb[0], bb[1]), v = clamp(s / 2 - d / 2, bb[2], bb[3]); const [x, y] = P(u, v, 0); const yy = y + Math.sin(j * 0.9 + i) * 2.5; first ? c.moveTo(x, yy) : c.lineTo(x, yy); first = false; } }
    c.stroke();
  }
  let minU = 1e9, maxU = -1e9, minV = 1e9, maxV = -1e9;
  for (const [u, v] of poly) { minU = Math.min(minU, u); maxU = Math.max(maxU, u); minV = Math.min(minV, v); maxV = Math.max(maxV, v); }
  const R = rng(17);
  const n = Math.round((maxU - minU) * (maxV - minV) * 3.2);
  c.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const u0 = lerp(minU, maxU, R()), v0 = lerp(minV, maxV, R()), ph = R() * 6.28, sp = 0.6 + R() * 0.7, len = 3 + R() * 5, dark = R() < 0.4;
    const drift = ((t * 0.07 * sp + R()) % 1) * 0.5;
    const a = 0.5 + 0.5 * Math.sin(t * 1.3 * sp + ph);
    const [x, y] = P(u0 + drift, v0 + drift, 0);
    if (dark) { c.strokeStyle = `rgba(14,90,110,${0.35 * a})`; c.lineWidth = 1.2; }
    else { c.strokeStyle = `rgba(255,255,255,${0.75 * a})`; c.lineWidth = 1.3; }
    c.beginPath(); c.moveTo(x - len, y); c.quadraticCurveTo(x - len / 2, y - 2, x, y); c.quadraticCurveTo(x + len / 2, y + 2, x + len, y); c.stroke();
  }
  // glitter
  for (let i = 0; i < 70; i++) { const [x, y] = P(lerp(minU, maxU, R()), lerp(minV, maxV, R()), 0), a = Math.max(0, Math.sin(t * 2.1 + R() * 6.28)); if (a > 0.75) { c.fillStyle = `rgba(255,255,255,${(a - 0.75) * 3.6})`; c.fillRect(x - 2, y - 0.5, 4, 1); c.fillRect(x - 0.5, y - 2, 1, 4); } }
  c.restore();
}

// ---------- shoreline: wet sand, swash sheet, breaking foam lines ----------
// shore: (u,v) points from right to left, sea is on the far side (smaller u+v)
export function shoreNormals(shore) {
  return shore.map((p, i) => { const a = shore[Math.max(0, i - 1)], b = shore[Math.min(shore.length - 1, i + 1)]; let du = b[0] - a[0], dv = b[1] - a[1]; const l = Math.hypot(du, dv) || 1; du /= l; dv /= l; let nu = -dv, nv = du; if (nu + nv > 0) { nu = -nu; nv = -nv; } return [nu, nv]; });
}
export function wetSand(k, shore) {
  const N = shoreNormals(shore), c = k.ctx;
  const band = (w0, w1, col) => { const A = shore.map((p, i) => [p[0] - N[i][0] * w0, p[1] - N[i][1] * w0]), B = shore.map((p, i) => [p[0] - N[i][0] * w1, p[1] - N[i][1] * w1]); trUV(c, [...A, ...B.reverse()]); c.fillStyle = col; c.fill(); };
  band(0, 0.55, "rgba(196,160,104,0.32)");
  band(0, 0.25, "rgba(176,140,90,0.3)");
}
export function surf(k, shore, t) {
  const c = k.ctx, N = shoreNormals(shore), n = shore.length;
  const off = (d, wig = 0, ph = 0) => shore.map((p, i) => { const w = d + Math.sin(i * 0.8 + ph + t * 0.7) * wig; return P(p[0] + N[i][0] * w, p[1] + N[i][1] * w, 0); });
  const line = (pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); };
  // shallow turquoise lip just off the beach
  { const A = off(0), B = off(0.7); tr(c, [...A, ...B.reverse()]); const g = c.createLinearGradient(0, 640, 0, 790); g.addColorStop(0, "rgba(140,230,215,0.0)"); g.addColorStop(1, "rgba(150,235,220,0.45)"); c.fillStyle = g; c.fill(); }
  // swash: a thin sheet running up the sand and back (period 5 s), lace edge
  const P_SW = 5.2, ph = (t % P_SW) / P_SW, run = ph < 0.45 ? smooth(ph / 0.45) : 1 - smooth((ph - 0.45) / 0.55);
  const reach = -0.08 - 0.32 * run; // negative = landward
  { const A = off(0.05), B = shore.map((p, i) => { const w = reach + Math.sin(i * 1.3 + 2) * 0.05 * run; return P(p[0] + N[i][0] * w, p[1] + N[i][1] * w, 0); }); tr(c, [...A, ...[...B].reverse()]); c.fillStyle = `rgba(170,232,225,${0.55 - 0.25 * (ph > 0.45 ? (ph - 0.45) / 0.55 : 0)})`; c.fill();
    c.strokeStyle = `rgba(255,255,255,${0.95 - 0.4 * run})`; c.lineWidth = 1.8; c.lineCap = "round"; line(B); c.stroke();
    c.strokeStyle = "rgba(255,255,255,0.5)"; c.lineWidth = 1; c.setLineDash([2, 3]); line(B.map(([x, y]) => [x, y - 2])); c.stroke(); c.setLineDash([]); }
  // three breakers rolling in: a crest line that sharpens, curls white and dissolves at the shore
  for (let w = 0; w < 3; w++) {
    const f = ((t / P_SW + w / 3) % 1); // 0 far out -> 1 at the shore
    const d = lerp(1.25, 0.08, smooth(f)), a = Math.sin(Math.PI * Math.min(1, f * 1.1));
    const pts = off(d, 0.06, w * 2.1);
    c.lineCap = "round"; c.lineJoin = "round";
    c.strokeStyle = `rgba(30,130,150,${0.25 * a})`; c.lineWidth = 3; line(pts.map(([x, y]) => [x, y - 2.5])); c.stroke();
    c.strokeStyle = `rgba(255,255,255,${0.9 * a})`; c.lineWidth = 2.6 * (0.6 + f); line(pts); c.stroke();
    // foam clumps along the crest
    const R = rng(31 + w);
    for (let i = 0; i < n - 1; i += 1) { if (R() < 0.45) continue; const q = pts[i], r = pts[i + 1], s = R(); const x = lerp(q[0], r[0], s), y = lerp(q[1], r[1], s); c.fillStyle = `rgba(255,255,255,${0.8 * a})`; c.beginPath(); c.ellipse(x, y + 1.5, 2.5 + R() * 3 * f, 1.2 + R(), 0, 0, 6.3); c.fill(); }
  }
}

// ---------- island: rock revetment, coping, paving ----------
// poly (u,v) at the top surface, clockwise on screen; zTop: paving height
export function islandBody(k, poly, zTop, o = {}) {
  const c = k.ctx, n = poly.length, R = rng(o.seed ?? 5);
  // outward toe (rocks slope out into the water)
  let cu = 0, cv = 0; for (const [u, v] of poly) { cu += u; cv += v; } cu /= n; cv /= n;
  const norm = poly.map((p, i) => { const a = poly[(i - 1 + n) % n], b = poly[(i + 1) % n]; let du = b[0] - a[0], dv = b[1] - a[1]; const l = Math.hypot(du, dv) || 1; let nu = dv / l, nv = -du / l; if ((p[0] - cu) * nu + (p[1] - cv) * nv < 0) { nu = -nu; nv = -nv; } return [nu, nv]; });
  const toe = poly.map((p, i) => [p[0] + norm[i][0] * 0.28, p[1] + norm[i][1] * 0.28]);
  // water shadow + foam at the toe
  trUV(c, toe.map(([u, v], i) => [u + norm[i][0] * 0.12 + 0.08, v + norm[i][1] * 0.12 + 0.04])); c.fillStyle = "rgba(10,70,90,0.25)"; c.fill();
  // visible slope faces
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, a = poly[i], b = poly[j], ta = toe[i], tb = toe[j];
    const nu = (norm[i][0] + norm[j][0]) / 2, nv = (norm[i][1] + norm[j][1]) / 2;
    if (nu + nv <= 0.02) continue;
    const q = [P(ta[0], ta[1], 0), P(tb[0], tb[1], 0), P(b[0], b[1], zTop), P(a[0], a[1], zTop)];
    tr(c, q); c.fillStyle = nu > nv ? "#7f7a72" : "#938d83"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
    // boulders: rows of rounded stones, packed along the face
    c.save(); tr(c, q); c.clip();
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), cols = Math.max(2, Math.round(L / 0.17));
    for (let r = 0; r < 3; r++) for (let m = 0; m < cols; m++) {
      const s = (m + (r % 2) * 0.5 + (R() - 0.5) * 0.3) / cols, h = (r + 0.5) / 3;
      const pu = lerp(lerp(ta[0], tb[0], s), lerp(a[0], b[0], s), h), pv = lerp(lerp(ta[1], tb[1], s), lerp(a[1], b[1], s), h);
      const [x, y] = P(pu, pv, zTop * h);
      const rx = 4.2 + R() * 2.6, ry = 2.8 + R() * 1.6, g = 112 + Math.floor(R() * 50);
      const col = `rgb(${g + 8},${g + 4},${g - 4})`;
      c.beginPath(); c.ellipse(x, y, rx, ry, (R() - 0.5) * 0.6, 0, 6.3); c.fillStyle = col; c.fill(); c.strokeStyle = "rgba(42,36,32,0.85)"; c.lineWidth = 0.9; c.stroke();
      c.fillStyle = "rgba(255,255,255,0.28)"; c.beginPath(); c.ellipse(x - rx * 0.3, y - ry * 0.35, rx * 0.45, ry * 0.3, 0, 0, 6.3); c.fill();
    }
    c.restore();
  }
  // foam lapping the toe
  const t = k.t;
  c.strokeStyle = "rgba(255,255,255,0.85)"; c.lineWidth = 1.6; c.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, nu = (norm[i][0] + norm[j][0]) / 2, nv = (norm[i][1] + norm[j][1]) / 2;
    if (nu + nv <= 0.02) continue;
    const a = toe[i], b = toe[j], L = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(2, Math.round(L / 0.25));
    for (let s = 0; s < m; s++) { const f0 = s / m, f1 = (s + 0.7) / m, lap = 0.04 + 0.04 * Math.sin(t * 1.8 + s * 1.7 + i); c.beginPath(); c.moveTo(...P(lerp(a[0], b[0], f0) + nu * lap, lerp(a[1], b[1], f0) + nv * lap, 0)); c.lineTo(...P(lerp(a[0], b[0], f1) + nu * lap, lerp(a[1], b[1], f1) + nv * lap, 0)); c.stroke(); }
  }
  // paving top
  trUV(c, poly, zTop); c.fillStyle = "#efe2c4"; c.fill();
  c.save(); trUV(c, poly, zTop); c.clip();
  c.strokeStyle = "rgba(150,120,80,0.22)"; c.lineWidth = 0.7; c.beginPath();
  { const us = poly.map((p) => p[0]), vs = poly.map((p) => p[1]), u0 = Math.min(...us), u1 = Math.max(...us), v0 = Math.min(...vs), v1 = Math.max(...vs);
    for (let i = Math.ceil(u0 / 0.3) * 0.3; i <= u1; i += 0.3) { c.moveTo(...P(i, v0, zTop)); c.lineTo(...P(i, v1, zTop)); }
    for (let i = Math.ceil(v0 / 0.3) * 0.3; i <= v1; i += 0.3) { c.moveTo(...P(u0, i, zTop)); c.lineTo(...P(u1, i, zTop)); } }
  c.stroke();
  c.restore();
  // coping strip along the visible edges
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, nu = (norm[i][0] + norm[j][0]) / 2, nv = (norm[i][1] + norm[j][1]) / 2;
    if (nu + nv <= 0.02) continue;
    const a = poly[i], b = poly[j];
    k.poly([[a[0], a[1], zTop], [b[0], b[1], zTop], [b[0] - nu * 0.1, b[1] - nv * 0.1, zTop], [a[0] - nu * 0.1, a[1] - nv * 0.1, zTop]], "#f7eedb", { lw: 0.9, wobble: 0 });
  }
  trUV(c, poly, zTop); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke();
  return { toe, norm };
}

// planting bed on a raised surface: kerb, soil, clipped shrubs, bougainvillea/flowers
const FLOW = ["#e0457a", "#f06ba8", "#ffffff", "#f4a640", "#d9334f", "#c2428a", "#f39ac0"];
export function bed(k, pts, z, seed = 1, o = {}) {
  const c = k.ctx, R = rng(seed * 7 + 1), kz = z + (o.kerb ?? 0.08);
  const n = pts.length;
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n], nu = b[1] - a[1], nv = -(b[0] - a[0]); if (nu + nv > 0) k.poly([[a[0], a[1], z], [b[0], b[1], z], [b[0], b[1], kz], [a[0], a[1], kz]], nu > nv ? "#cdbb98" : "#dccaa8", { lw: 0.9, wobble: 0 }); }
  k.poly(pts.map(([u, v]) => [u, v, kz]), "#7a5c3c", { lw: 1.1 });
  let minU = 1e9, maxU = -1e9, minV = 1e9, maxV = -1e9;
  for (const [u, v] of pts) { minU = Math.min(minU, u); maxU = Math.max(maxU, u); minV = Math.min(minV, v); maxV = Math.max(maxV, v); }
  const area = (maxU - minU) * (maxV - minV), N = Math.round(area * (o.density ?? 10)) + 3, spots = [];
  for (let i = 0; i < N * 5 && spots.length < N; i++) { const u = lerp(minU, maxU, R()), v = lerp(minV, maxV, R()); if (inPoly([u, v], pts)) spots.push([u, v, R()]); }
  spots.sort((p, q) => p[0] + p[1] - q[0] - q[1]);
  const pal = o.cols || FLOW;
  for (const [u, v, r] of spots) {
    const [x, y] = P(u, v, kz + 0.05), rr = CTS.S * (0.15 + r * 0.09) * (o.size ?? 1);
    k._lobe(x, y, rr, r < 0.33 ? "#4f8a3e" : r < 0.66 ? "#62a04c" : "#3f7a35", Math.round(u * 131 + v * 71), { squash: 0.8, bumps: 8, lw: 0.75 });
    if (r > (o.bare ?? 0.2)) {
      const fc = pal[Math.floor(R() * pal.length)];
      for (let j = 0; j < 7; j++) {
        const a = R() * 6.28, d = Math.sqrt(R()) * rr * 0.8, fx = x + Math.cos(a) * d, fy = y - rr * 0.2 + Math.sin(a) * d * 0.7, pr = 1.3 + R() * 0.9;
        c.fillStyle = fc; for (let q = 0; q < 5; q++) { const b = (q / 5) * 6.28; c.beginPath(); c.arc(fx + Math.cos(b) * pr, fy + Math.sin(b) * pr, pr * 0.75, 0, 6.3); c.fill(); }
        c.fillStyle = "#f6e08a"; c.beginPath(); c.arc(fx, fy, pr * 0.4, 0, 6.3); c.fill();
      }
    }
  }
}
// loose shrub + flower clumps along a strip (front edge planting), no kerb
export function shrubStrip(k, pts, width, seed = 1, o = {}) {
  const c = k.ctx, R = rng(seed), sp = spline(pts, false), n = Math.max(3, Math.round(sp.L / (o.step ?? 0.2)));
  const items = [];
  for (let i = 0; i < n; i++) {
    const s = sp.sample((i + 0.5) / n * sp.L), L = Math.hypot(s.du, s.dv) || 1, side = (R() - 0.5) * width;
    items.push([s.u - (s.dv / L) * side, s.v + (s.du / L) * side, R()]);
  }
  items.sort((p, q) => p[0] + p[1] - q[0] - q[1]);
  for (const [u, v, r] of items) {
    const [x, y] = P(u, v, 0.12), rr = CTS.S * (0.17 + r * 0.12);
    k._lobe(x, y, rr, r < 0.4 ? "#4c8a3e" : r < 0.75 ? "#5f9d48" : "#3e7434", Math.round(u * 97 + v * 53), { squash: 0.8, bumps: 9, lw: 0.8 });
    if (r > 0.3) {
      const fc = FLOW[Math.floor(R() * 4) % 2 ? 0 : (R() < 0.5 ? 1 : 6)];
      for (let j = 0; j < 9; j++) {
        const a = R() * 6.28, d = Math.sqrt(R()) * rr * 0.8, fx = x + Math.cos(a) * d, fy = y - rr * 0.25 + Math.sin(a) * d * 0.7, pr = 1.4 + R() * 1;
        c.fillStyle = R() < 0.15 ? "#ffffff" : fc; for (let q = 0; q < 5; q++) { const b = (q / 5) * 6.28; c.beginPath(); c.arc(fx + Math.cos(b) * pr, fy + Math.sin(b) * pr, pr * 0.75, 0, 6.3); c.fill(); }
        c.fillStyle = "#f6e08a"; c.beginPath(); c.arc(fx, fy, pr * 0.4, 0, 6.3); c.fill();
      }
    }
  }
}

// ---------- beach furniture ----------
// striped beach parasol: 8 gores alternating two colours, scalloped valance that flutters
export function parasol(k, u, v, c1, c2, o = {}) {
  const c = k.ctx, t = k.t, h = o.h ?? 1.15, r = o.r ?? 0.55;
  const [bx, by] = P(u, v, 0), [tx, ty] = P(u, v, h);
  k.ell(u + 0.45, v + 0.15, 0, r * 0.9, "rgba(90,60,30,0.16)", { stroke: false });
  c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(bx, by); c.lineTo(tx, ty); c.stroke(); c.strokeStyle = "#f4efe6"; c.lineWidth = 1.4; c.stroke();
  const rx = r * CTS.S * 1.42, ry = rx * CTS.YS, apex = [tx, ty - ry * 1.5], N = 8, sw = Math.sin(t * 2.3 + u * 3) * 0.06;
  const rim = (i) => { const a = (i / N) * Math.PI * 2 + sw; return [tx + Math.cos(a) * rx, ty + Math.sin(a) * ry + 2]; };
  // gores back to front
  const order = [...Array(N).keys()].sort((i, j) => Math.sin(((i + 0.5) / N) * 6.283 + sw) - Math.sin(((j + 0.5) / N) * 6.283 + sw));
  for (const i of order) {
    const a = rim(i), b = rim(i + 1), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 2.5];
    const front = Math.sin(((i + 0.5) / N) * 6.283 + sw) > 0;
    c.beginPath(); c.moveTo(...apex); c.lineTo(...a); c.quadraticCurveTo(m[0], m[1] + 1.5, b[0], b[1]); c.closePath();
    const base = i % 2 ? c2 : c1, lit = Math.cos(((i + 0.5) / N) * 6.283 + sw) < 0;
    c.fillStyle = front ? (lit ? base : shade(base, -0.14)) : shade(base, -0.3); c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.lineJoin = "round"; c.stroke();
  }
  // valance flaps on the near half
  for (let i = 0; i < N; i++) {
    const s = Math.sin(((i + 0.5) / N) * 6.283 + sw); if (s < 0) continue;
    const a = rim(i), b = rim(i + 1), fl = Math.sin(t * 6 + i * 1.7 + u) * 1.2;
    c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 6 + fl, a[0], a[1]); c.closePath();
    c.fillStyle = shade(i % 2 ? c2 : c1, -0.1); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
  }
  k.circle(apex[0], apex[1] - 1.5, 2, "#f4efe6", { lw: 0.9 });
}
// wooden sun lounger with cushion; dir = head -> foot along the ground. returns frame for the sunbather
export function lounger(k, u, v, dir, o = {}) {
  const c = k.ctx; let [a, b] = dir; const l = Math.hypot(a, b) || 1; a /= l; b /= l; const n = [-b, a];
  const L = 0.82, W = 0.3, z = 0.17, back = o.back ?? 0.55;
  const pt = (f, s, zz) => P(u + a * f + n[0] * s, v + b * f + n[1] * s, zz);
  k.shadow([[u + n[0] * W / 2 + 0.12, v + n[1] * W / 2 + 0.05, 0], [u + a * L + n[0] * W / 2 + 0.12, v + b * L + n[1] * W / 2 + 0.05, 0], [u + a * L - n[0] * W / 2 + 0.12, v + b * L - n[1] * W / 2 + 0.05, 0], [u - n[0] * W / 2 + 0.12, v - n[1] * W / 2 + 0.05, 0]], 0.14);
  const wood = "#a86a3a", woodD = "#7d4a26";
  // legs
  c.strokeStyle = INK; c.lineWidth = 2.2; c.lineCap = "round"; c.beginPath();
  for (const f of [0.08, L - 0.06]) for (const s of [-W / 2 + 0.03, W / 2 - 0.03]) { c.moveTo(...pt(f, s, 0)); c.lineTo(...pt(f, s, z)); }
  c.stroke();
  // frame side boards (visible near side)
  const sN = (n[0] + n[1]) > 0 ? W / 2 : -W / 2;
  k.path([pt(0.3, sN, z - 0.06), pt(L, sN, z - 0.06), pt(L, sN, z), pt(0.3, sN, z)], { fill: woodD, lw: 0.9, wobble: 0 });
  // flat bed with slats
  const bedQ = [pt(0.32, -W / 2, z), pt(L, -W / 2, z), pt(L, W / 2, z), pt(0.32, W / 2, z)];
  k.path(bedQ, { fill: wood, lw: 1.1, wobble: 0 });
  // raised backrest
  const bz = 0.26 * back + z;
  const backQ = [pt(0.32, -W / 2, z), pt(0.32, W / 2, z), pt(0.02, W / 2, bz + 0.2), pt(0.02, -W / 2, bz + 0.2)];
  k.path(backQ, { fill: shade(wood, 0.06), lw: 1.1, wobble: 0 });
  // cushion
  const cc = o.cushion || "#f3efe4";
  k.path([pt(0.36, -W / 2 + 0.03, z + 0.03), pt(L - 0.03, -W / 2 + 0.03, z + 0.03), pt(L - 0.03, W / 2 - 0.03, z + 0.03), pt(0.36, W / 2 - 0.03, z + 0.03)], { fill: cc, lw: 0.9, wobble: 0 });
  k.path([pt(0.31, -W / 2 + 0.03, z + 0.03), pt(0.31, W / 2 - 0.03, z + 0.03), pt(0.05, W / 2 - 0.03, bz + 0.21), pt(0.05, -W / 2 + 0.03, bz + 0.21)], { fill: shade(cc, -0.05), lw: 0.9, wobble: 0 });
  c.strokeStyle = "rgba(110,70,35,0.5)"; c.lineWidth = 0.7; c.beginPath(); for (let i = 1; i < 5; i++) { const f = 0.36 + (L - 0.39) * i / 5; c.moveTo(...pt(f, -W / 2 + 0.04, z + 0.03)); c.lineTo(...pt(f, W / 2 - 0.04, z + 0.03)); } c.stroke();
  return { pt, a, b, n, z: z + 0.04, bz: bz + 0.2, L };
}
// a sunbather lying on a lounger: back up the backrest, legs out, one knee rising, an arm lifting a drink/book
export function sunbather(k, Lg, o = {}) {
  const c = k.ctx, t = k.t, seed = o.seed ?? 1, R = rng(seed * 11 + 3);
  const skin = o.skin || ["#f1c9a5", "#e0ac84", "#c68a62", "#9a6544", "#6e4630"][Math.floor(R() * 5)];
  const suit = o.suit || ["#d9544b", "#3e6fa8", "#e9c24d", "#2f4b6c", "#e581a2", "#4aa5a1", "#1f1f24"][Math.floor(R() * 7)];
  const hair = ["#2b211b", "#4d3524", "#c99b5c", "#1d1b1b", "#7b5030"][Math.floor(R() * 5)];
  const fem = R() < 0.5, ph = R() * 6.28;
  const { pt, z, bz } = Lg;
  const lw = 0.85, limb = (p, q, col, w) => { c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = w + 1.7; c.beginPath(); c.moveTo(...p); c.lineTo(...q); c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
  const limb3 = (p, m, q, col, w) => { c.lineCap = "round"; c.lineJoin = "round"; c.strokeStyle = INK; c.lineWidth = w + 1.7; c.beginPath(); c.moveTo(...p); c.lineTo(...m); c.lineTo(...q); c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
  const knee = Math.max(0, Math.sin(t * 0.45 + ph)) * (o.kneeUp ?? 1);
  const hip = pt(0.36, 0, z + 0.05), sh = pt(0.12, 0, z + 0.05 + (bz - z) * 0.62), head = pt(0.05, 0, bz + 0.08);
  // legs: one straight, one bending up
  const footA = pt(0.78, 0.06, z + 0.03), footB = pt(0.78 - 0.12 * knee, -0.06, z + 0.03);
  const kneeA = pt(0.57, 0.06, z + 0.05), kneeB = pt(0.56 - 0.04 * knee, -0.06, z + 0.06 + 0.16 * knee);
  limb3(pt(0.36, 0.06, z + 0.05), kneeA, footA, skin, 4.2);
  limb3(pt(0.36, -0.06, z + 0.05), kneeB, footB, shade(skin, -0.06), 4.2);
  // torso (swimsuit)
  c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 9.5; c.beginPath(); c.moveTo(...hip); c.lineTo(...sh); c.stroke();
  c.strokeStyle = fem ? suit : skin; c.lineWidth = 7.8; c.stroke();
  if (!fem) { c.strokeStyle = suit; c.lineWidth = 7.8; c.beginPath(); c.moveTo(...hip); c.lineTo(...pt(0.3, 0, z + 0.06 + (bz - z) * 0.1)); c.stroke(); }
  else { c.strokeStyle = skin; c.lineWidth = 3.2; const m = [lerp(hip[0], sh[0], 0.45), lerp(hip[1], sh[1], 0.45)], m2 = [lerp(hip[0], sh[0], 0.62), lerp(hip[1], sh[1], 0.62)]; c.beginPath(); c.moveTo(...m); c.lineTo(...m2); c.stroke(); }
  // arms: one behind the head, one lifting a drink / turning a page
  const lift = Math.max(0, Math.sin(t * 0.8 + ph * 2));
  const hand = pt(0.24 - 0.08 * lift, 0.13, z + 0.12 + 0.18 * lift);
  limb3(pt(0.13, 0.07, z + 0.05 + (bz - z) * 0.6), pt(0.25, 0.12, z + 0.1), hand, skin, 3.2);
  if (o.drink !== false) { c.fillStyle = seed % 2 ? "#f2a33a" : "#e8607a"; c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.roundRect(hand[0] - 1.6, hand[1] - 5, 3.2, 4.5, 0.8); c.fill(); c.stroke(); }
  limb3(pt(0.13, -0.07, z + 0.05 + (bz - z) * 0.6), pt(0.04, -0.12, bz + 0.16), pt(0.03, -0.02, bz + 0.12), shade(skin, -0.05), 3.2);
  // head + hair + sunglasses
  const hr = 4.2;
  if (fem && seed % 3) { c.fillStyle = hair; c.beginPath(); c.ellipse(head[0] - 1, head[1] + 2, hr * 1.1, hr * 1.4, 0, 0, 6.3); c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); }
  c.beginPath(); c.arc(head[0], head[1], hr, 0, 6.3); c.fillStyle = skin; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
  c.fillStyle = hair; c.beginPath(); c.arc(head[0], head[1], hr * 1.03, Math.PI * 0.95, Math.PI * 2.05); c.closePath(); c.fill(); c.stroke();
  if (o.hat) { c.fillStyle = o.hat; c.beginPath(); c.ellipse(head[0], head[1] - hr * 0.5, hr * 1.8, hr * 0.55, 0, 0, 6.3); c.fill(); c.stroke(); c.beginPath(); c.arc(head[0], head[1] - hr * 0.55, hr * 0.85, Math.PI, 0); c.fill(); c.stroke(); }
  c.fillStyle = "#1d1b1b"; c.fillRect(head[0] - 3.2, head[1] + 0.2, 2.6, 1.6); c.fillRect(head[0] + 0.4, head[1] + 0.2, 2.6, 1.6);
}
// white four-post cabana daybed with a fabric roof and billowing curtains
export function cabana(k, u, v, t, o = {}) {
  const c = k.ctx, du = o.du ?? 0.95, dv = o.dv ?? 0.95, h = o.h ?? 0.95, wood = "#e9dcc4";
  k.shadow([[u + du, v, 0], [u + du + 0.5, v + 0.15, 0], [u + du + 0.5, v + dv + 0.15, 0], [u + du, v + dv, 0]], 0.14);
  // platform + mattress
  k.box(u, v, 0, du, dv, 0.12, "#d8c3a0", { hatch: false, shadow: false });
  k.box(u + 0.06, v + 0.06, 0.12, du - 0.12, dv - 0.12, 0.1, "#f6f3ec", { hatch: false, shadow: false });
  // pillows + a lounging couple
  for (const [pu, pv, col] of [[u + 0.15, v + 0.3, "#5fb3b7"], [u + 0.15, v + 0.62, "#f0c96a"]]) { const [x, y] = P(pu, pv, 0.26); c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.ellipse(x, y - 3, 5, 3.5, 0, 0, 6.3); c.fill(); c.stroke(); }
  drawHuman(k, u + 0.45, v + 0.35, { pose: "sitground", dir: [0.9, 0.3], z: 0.22, seed: 611, style: "tee", h: 0.62, shadow: false });
  drawHuman(k, u + 0.5, v + 0.68, { pose: "sitground", dir: [0.8, -0.2], z: 0.22, seed: 612, style: "dress", hat: "sunhat", hatCol: "#f1e6c8", h: 0.6, gesture: true, shadow: false });
  // posts
  const posts = [[u, v], [u + du, v], [u + du, v + dv], [u, v + dv]];
  c.lineCap = "round";
  for (const [pu, pv] of posts) { const [x, y] = P(pu, pv, 0.1), [, yt] = P(pu, pv, h); c.strokeStyle = INK; c.lineWidth = 4.2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt); c.stroke(); c.strokeStyle = wood; c.lineWidth = 2.4; c.stroke(); }
  // roof canopy: a shallow fabric box with a scalloped valance
  const ov = 0.06;
  k.poly([[u - ov, v - ov, h], [u + du + ov, v - ov, h], [u + du + ov, v + dv + ov, h], [u - ov, v + dv + ov, h]], "#fbf8f1", { lw: 1.2, wobble: 0 });
  k.poly([[u - ov, v + dv + ov, h], [u + du + ov, v + dv + ov, h], [u + du + ov, v + dv + ov, h - 0.1], [u - ov, v + dv + ov, h - 0.1]], "#efe7d8", { lw: 1, wobble: 0 });
  k.poly([[u + du + ov, v - ov, h], [u + du + ov, v + dv + ov, h], [u + du + ov, v + dv + ov, h - 0.1], [u + du + ov, v - ov, h - 0.1]], "#ddd3c2", { lw: 1, wobble: 0 });
  // curtains tied at the near posts, billowing a little
  for (const [pu, pv, side] of [[u, v + dv, 1], [u + du, v + dv, -1], [u + du, v, 1]]) {
    const b = Math.sin(t * 1.6 + pu * 3 + pv) * 0.04;
    const top0 = P(pu, pv, h - 0.08), top1 = side > 0 && pv === v + dv ? P(pu + 0.22, pv, h - 0.08) : P(pu - 0.0, pv - 0.22 * side, h - 0.08);
    const waist = P(pu + b, pv + b, h * 0.45), foot = P(pu + 0.05 + b * 1.5, pv + 0.02, 0.14);
    c.beginPath(); c.moveTo(...top0); c.lineTo(...top1); c.quadraticCurveTo(waist[0] + 4 * side, waist[1], waist[0], waist[1]); c.quadraticCurveTo(foot[0] + 4, foot[1] - 6, foot[0], foot[1]); c.lineTo(foot[0] - 3, foot[1]); c.quadraticCurveTo(waist[0] - 3, waist[1] + 6, top0[0], top0[1]); c.closePath();
    c.fillStyle = "rgba(252,250,245,0.92)"; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
    c.strokeStyle = "rgba(160,150,130,0.6)"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(top0[0] + 2, top0[1] + 2); c.lineTo(waist[0] + 1, waist[1]); c.stroke();
    c.strokeStyle = "#c9a35a"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(waist[0] - 3, waist[1]); c.lineTo(waist[0] + 3, waist[1]); c.stroke();
  }
}

// ---------- water life ----------
// a swimmer: head + shoulders, front crawl or breaststroke, ripple rings; moves along a short loop
export function swimmer(k, u, v, dir, o = {}) {
  const c = k.ctx, t = k.t, seed = o.seed ?? 1, R = rng(seed * 5 + 9);
  const skin = ["#f1c9a5", "#e0ac84", "#c68a62", "#9a6544"][Math.floor(R() * 4)], cap = o.cap || ["#d9544b", "#2b211b", "#e9c24d", "#4d3524", "#3e6fa8"][Math.floor(R() * 5)];
  let [a, b] = dir; const l = Math.hypot(a, b) || 1; a /= l; b /= l;
  const [x, y] = P(u, v, 0), bob = Math.sin(t * 3 + seed) * 0.8;
  // ripples
  for (let i = 0; i < 2; i++) { const f = ((t * 0.6 + i * 0.5 + seed * 0.13) % 1); c.strokeStyle = `rgba(255,255,255,${0.75 * (1 - f)})`; c.lineWidth = 1.2; c.beginPath(); c.ellipse(x, y, 5 + f * 11, (5 + f * 11) * 0.42, 0, 0, 6.3); c.stroke(); }
  c.fillStyle = "rgba(10,70,90,0.25)"; c.beginPath(); c.ellipse(x, y + 1, 7, 2.8, 0, 0, 6.3); c.fill();
  const sx = (a - b) >= 0 ? 1 : -1, toward = a + b > 0;
  // shoulders
  c.fillStyle = skin; c.strokeStyle = INK; c.lineWidth = 0.9;
  c.beginPath(); c.ellipse(x, y - 1 + bob, 5.5, 2.6, 0, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
  // arms
  if (o.wave) { const w = Math.sin(t * 7 + seed); c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 4.2; c.beginPath(); c.moveTo(x + 4, y - 2 + bob); c.lineTo(x + 7 + w * 2, y - 13 + bob); c.stroke(); c.strokeStyle = skin; c.lineWidth = 2.6; c.stroke(); }
  else {
    const st = t * 2.4 + seed;
    for (const s of [0, Math.PI]) { const ang = st + s, up = Math.sin(ang); if (up < 0) continue; const hx = x + sx * Math.cos(ang) * 7, hy = y - 2 - up * 8 + bob; c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(x + sx * (s ? -3 : 3), y - 2 + bob); c.lineTo(hx, hy); c.stroke(); c.strokeStyle = skin; c.lineWidth = 2.4; c.stroke(); if (up < 0.25) { c.fillStyle = "rgba(255,255,255,0.85)"; c.beginPath(); c.arc(hx, y, 2.2, 0, 6.3); c.fill(); } }
  }
  // head with cap/hair
  const hx = x + sx * 1.2, hy = y - 5.5 + bob;
  c.beginPath(); c.arc(hx, hy, 3.6, 0, 6.3); c.fillStyle = skin; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
  c.fillStyle = cap; c.beginPath(); c.arc(hx, hy, 3.7, toward ? Math.PI * 1.05 : Math.PI * 0.7, toward ? Math.PI * 1.95 : Math.PI * 2.3); c.closePath(); c.fill(); c.stroke();
  if (toward) { c.fillStyle = INK; c.fillRect(hx + sx * 1.2 - 0.5, hy + 0.3, 1, 1); c.fillRect(hx - sx * 0.6 - 0.5, hy + 0.3, 1, 1); }
}
// a jet ski with a rider, spray plume and a V wake
export function jetski(k, u, v, dir, o = {}) {
  const c = k.ctx, t = k.t; let [a, b] = dir; const l = Math.hypot(a, b) || 1; a /= l; b /= l; const n = [-b, a];
  const L = 0.62, W = 0.26, bank = o.bank ?? 0;
  const pt = (f, s, z) => P(u + a * f * L / 2 + n[0] * s * W / 2, v + b * f * L / 2 + n[1] * s * W / 2, z + 0.02 + s * bank * 0.08);
  // wake
  c.lineCap = "round";
  for (const sd of [-1, 1]) {
    const pts = []; for (let i = 0; i <= 10; i++) { const f = i / 10; pts.push(P(u - a * (0.3 + f * 1.6) + n[0] * sd * (0.1 + f * 0.45), v - b * (0.3 + f * 1.6) + n[1] * sd * (0.1 + f * 0.45), 0)); }
    for (let i = 0; i < 10; i++) { c.strokeStyle = `rgba(255,255,255,${0.9 * (1 - i / 10)})`; c.lineWidth = 2.6 * (1 - i / 12); c.beginPath(); c.moveTo(...pts[i]); c.lineTo(...pts[i + 1]); c.stroke(); }
  }
  for (let i = 0; i < 9; i++) { const f = (t * 1.6 + i / 9) % 1, [x, y] = P(u - a * (0.32 + f * 1.3), v - b * (0.32 + f * 1.3), 0); c.fillStyle = `rgba(255,255,255,${0.85 * (1 - f)})`; c.beginPath(); c.ellipse(x + Math.sin(i * 2.3) * 3, y, 2 + f * 4, 1 + f * 1.8, 0, 0, 6.3); c.fill(); }
  // rooster tail spray
  for (let i = 0; i < 8; i++) { const f = (t * 2.2 + i / 8) % 1, [x, y] = P(u - a * (0.35 + f * 0.6), v - b * (0.35 + f * 0.6), 0.25 * Math.sin(Math.PI * f) + 0.05); c.fillStyle = `rgba(255,255,255,${0.7 * (1 - f)})`; c.beginPath(); c.arc(x + Math.sin(i * 3.1) * 2, y, 1.5 + f * 2.5, 0, 6.3); c.fill(); }
  k.ell(u, v, 0, 0.2, "rgba(10,70,90,0.25)", { stroke: false });
  const prof = [[1, 0], [0.6, 0.85], [-0.6, 1], [-1, 0.8], [-1, -0.8], [-0.6, -1], [0.6, -0.85]];
  const top = prof.map(([f, s]) => pt(f, s, 0.13)), bot = prof.map(([f, s]) => pt(f * 0.9, s * 0.8, 0));
  const sides = prof.map((_, i) => { const j = (i + 1) % prof.length; return { q: [bot[i], bot[j], top[j], top[i]], d: top[i][1] + top[j][1] }; }).sort((p, q) => p.d - q.d);
  for (const s of sides) k.path(s.q, { fill: "#e9edf0", lw: 0.9, wobble: 0 });
  k.path(top, { fill: o.col || "#e8453c", lw: 1.1, wobble: 0 });
  k.path([pt(0.2, -0.5, 0.14), pt(0.65, 0, 0.16), pt(0.2, 0.5, 0.14)], { fill: "#2a2e36", lw: 0.8, wobble: 0 });
  const r = drawHuman(k, u - a * 0.05, v - b * 0.05, { pose: "ride", dir: [a, b], z: 0.08, seed: o.seed ?? 77, cadence: 0, style: "tee", shorts: true, shadow: false, top: o.vest || "#f2a33a", h: 0.62 });
  return r;
}
// three-deck white motor yacht, raked superstructure, dark glazing, flybridge, people on the sun deck
export function superyacht(k, u, v, dir, o = {}) {
  const c = k.ctx, t = k.t; let [a, b] = dir; const l = Math.hypot(a, b) || 1; a /= l; b /= l; const n = [-b, a];
  const L = o.len ?? 2.3, W = o.wid ?? 0.66, bob = Math.sin(t * 1.4) * 0.02, roll = Math.sin(t * 1.1 + 1) * 0.015;
  const pt = (f, s, z) => P(u + a * f * L / 2 + n[0] * s * W / 2, v + b * f * L / 2 + n[1] * s * W / 2, z + bob + s * roll);
  k.ell(u + 0.08, v + 0.05, 0, W * 1.2, "rgba(10,60,80,0.22)", { stroke: false });
  const hull = [[1.06, 0], [0.75, 0.62], [0.35, 0.95], [-0.5, 1], [-1, 0.94], [-1, -0.94], [-0.5, -1], [0.35, -0.95], [0.75, -0.62]];
  const H = 0.3, top = hull.map(([f, s]) => pt(f, s, H)), bot = hull.map(([f, s]) => pt(f * 0.95, s * 0.8, 0));
  const sides = hull.map((_, i) => { const j = (i + 1) % hull.length; return { q: [bot[i], bot[j], top[j], top[i]], d: top[i][1] + top[j][1], i }; }).sort((p, q) => p.d - q.d);
  for (const s of sides) {
    k.path(s.q, { fill: "#f4f2ec", lw: 1, wobble: 0 });
    // dark boot stripe + portholes on the near faces
    const [b0, b1, t1, t0] = s.q, m = (p, q, f) => [lerp(p[0], q[0], f), lerp(p[1], q[1], f)];
    c.strokeStyle = "#2b3a4a"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(...m(b0, t0, 0.25)); c.lineTo(...m(b1, t1, 0.25)); c.stroke();
    c.fillStyle = "#33485a"; for (let q = 1; q < 3; q++) { const p = m(m(b0, b1, q / 3), m(t0, t1, q / 3), 0.6); c.beginPath(); c.arc(p[0], p[1], 0.9, 0, 6.3); c.fill(); }
  }
  k.path(top, { fill: "#d9c3a0", lw: 1.3, wobble: 0 });
  c.save(); tr(c, top); c.clip(); c.strokeStyle = "rgba(120,85,45,0.35)"; c.lineWidth = 0.6; c.beginPath(); for (let i = -3; i <= 3; i++) { c.moveTo(...pt(-1, i * 0.28, H)); c.lineTo(...pt(1.1, i * 0.28, H)); } c.stroke(); c.restore();
  // superstructure decks (each smaller + raked forward)
  const deck = (f0, f1, s, z0, dz, rake, roofCol) => {
    const lo = [[f0, -s], [f1 - rake, -s * 0.9], [f1, 0], [f1 - rake, s * 0.9], [f0, s]].map(([f, ss]) => pt(f, ss, z0));
    const hi = [[f0 + 0.03, -s * 0.95], [f1 - rake - 0.1, -s * 0.85], [f1 - 0.12, 0], [f1 - rake - 0.1, s * 0.85], [f0 + 0.03, s * 0.95]].map(([f, ss]) => pt(f, ss, z0 + dz));
    const fc = lo.map((_, i) => { const j = (i + 1) % lo.length; return { q: [lo[i], lo[j], hi[j], hi[i]], d: lo[i][1] + lo[j][1] }; }).sort((p, q) => p.d - q.d);
    for (const f of fc) { k.path(f.q, { fill: "#f7f6f2", lw: 0.9, wobble: 0 }); const [p0, p1, p2, p3] = f.q, m = (p, q, ff) => [lerp(p[0], q[0], ff), lerp(p[1], q[1], ff)]; k.path([m(p0, p3, 0.28), m(p1, p2, 0.28), m(p1, p2, 0.78), m(p0, p3, 0.78)], { fill: "#2f4a5e", lw: 0.5, wobble: 0, stroke: "rgba(42,36,32,0.6)" }); }
    k.path(hi, { fill: roofCol || "#ffffff", lw: 1.1, wobble: 0 });
    return hi;
  };
  deck(-0.8, 0.45, 0.78, H, 0.2, 0.18);
  deck(-0.62, 0.28, 0.64, H + 0.2, 0.17, 0.16);
  const fly = deck(-0.4, 0.05, 0.5, H + 0.37, 0.12, 0.12, "#eef1f2");
  // radar arch + mast
  const [mx, my] = pt(-0.18, 0, H + 0.49); c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.moveTo(mx, my); c.lineTo(mx, my - 12); c.stroke();
  c.save(); c.translate(mx, my - 12); c.scale(Math.cos(t * 2.5), 1); c.fillStyle = "#f1efe9"; c.fillRect(-6, -1.5, 12, 3); c.strokeRect(-6, -1.5, 12, 3); c.restore();
  // stern flag
  const [fx, fy] = pt(-1, 0, H); c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx, fy - 13); c.stroke();
  const w = Math.sin(t * 7) * 1.5; c.fillStyle = "#1f8a4c"; c.beginPath(); c.moveTo(fx, fy - 13); c.lineTo(fx + 8, fy - 12 + w); c.lineTo(fx + 8, fy - 9 + w); c.lineTo(fx, fy - 10); c.fill(); c.fillStyle = "#d33a32"; c.fillRect(fx - 0.5, fy - 13, 2.4, 3.6); c.fillStyle = "#fff"; c.fillRect(fx + 2, fy - 11.8 + w * 0.5, 6, 1);
  // sunbathers on the foredeck + guests at the stern
  for (const [f, s, sd] of [[0.62, 0.32, 801], [0.62, -0.3, 802]]) { const p = pt(f, s, H + 0.02), q = pt(f + 0.22, s, H + 0.02); c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 4.6; c.beginPath(); c.moveTo(...p); c.lineTo(...q); c.stroke(); c.strokeStyle = sd % 2 ? "#e0ac84" : "#c68a62"; c.lineWidth = 3; c.stroke(); c.fillStyle = sd % 2 ? "#d9544b" : "#3e6fa8"; c.beginPath(); c.arc(...[lerp(p[0], q[0], 0.35), lerp(p[1], q[1], 0.35)], 1.8, 0, 6.3); c.fill(); }
  for (const [f, s, sd] of [[-0.85, 0.3, 803], [-0.85, -0.25, 804]]) { const [px, py] = pt(f, s, H); const wv = sd === 803 ? Math.sin(t * 6) * 2 : 0; c.fillStyle = sd % 2 ? "#f4f0e6" : "#2f4b6c"; c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.roundRect(px - 2.2, py - 9, 4.4, 7, 1.4); c.fill(); c.stroke(); c.fillStyle = "#d8a784"; c.beginPath(); c.arc(px, py - 10.8, 2, 0, 6.3); c.fill(); c.stroke(); if (wv) { c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(px + 2, py - 8); c.lineTo(px + 5 + wv, py - 14); c.stroke(); } }
  return { pt };
}
export function bigWake(k, u, v, dir, o = {}) {
  const c = k.ctx, t = k.t; let [a, b] = dir; const l = Math.hypot(a, b) || 1; a /= l; b /= l; const n = [-b, a], len = o.len ?? 3.2, w = o.w ?? 1.0, back = o.back ?? 1.15;
  c.lineCap = "round";
  for (const sd of [-1, 1]) {
    const pts = []; for (let i = 0; i <= 14; i++) { const f = i / 14, wig = Math.sin(t * 4 + i * 1.1 + sd) * 0.025; pts.push(P(u - a * (back + f * len) + n[0] * sd * (0.36 + f * w + wig), v - b * (back + f * len) + n[1] * sd * (0.36 + f * w + wig), 0)); }
    for (let i = 0; i < 14; i++) { c.strokeStyle = `rgba(255,255,255,${0.85 * (1 - i / 14)})`; c.lineWidth = 3 * (1 - i / 16); c.beginPath(); c.moveTo(...pts[i]); c.lineTo(...pts[i + 1]); c.stroke(); }
  }
  // churned centre trail
  for (let i = 0; i < 14; i++) { const f = (t * 0.5 + i / 14) % 1, [x, y] = P(u - a * (back + f * len * 0.9) + n[0] * Math.sin(i * 2.7) * 0.12, v - b * (back + f * len * 0.9) + n[1] * Math.sin(i * 2.7) * 0.12, 0); c.fillStyle = `rgba(255,255,255,${0.7 * (1 - f)})`; c.beginPath(); c.ellipse(x, y, 3 + f * 6, 1.4 + f * 2.2, 0, 0, 6.3); c.fill(); }
  for (const sd of [-1, 1]) { const p = P(u + a * L2(o), v + b * L2(o), 0), q = P(u + a * 0.4 + n[0] * sd * 0.42, v + b * 0.4 + n[1] * sd * 0.42, 0); c.strokeStyle = "rgba(255,255,255,0.9)"; c.lineWidth = 2; c.beginPath(); c.moveTo(...p); c.lineTo(...q); c.stroke(); }
}
const L2 = (o) => (o.bow ?? 1.2);

// ---------- helicopter (screen px + height) ----------
export function helicopter(k, x, y, heading, rotor, o = {}) {
  const c = k.ctx, s = o.s ?? 1, f = Math.cos(heading) >= 0 ? 1 : -1;
  c.save(); c.translate(x, y); c.scale(s * f, s);
  // tail boom + fin
  c.strokeStyle = INK; c.lineWidth = 3.4; c.lineCap = "round"; c.beginPath(); c.moveTo(-6, -3); c.lineTo(-22, -6); c.stroke(); c.strokeStyle = "#f2f2ee"; c.lineWidth = 1.8; c.stroke();
  c.fillStyle = "#c8343a"; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-21, -6); c.lineTo(-25, -12); c.lineTo(-22, -12); c.lineTo(-18, -6); c.closePath(); c.fill(); c.stroke();
  // tail rotor blur
  c.strokeStyle = "rgba(42,36,32,0.5)"; c.lineWidth = 1; c.beginPath(); c.arc(-23, -6, 3.2, 0, 6.3); c.stroke();
  // skids
  c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-8, 4); c.lineTo(8, 4); c.quadraticCurveTo(11, 4, 11, 2); c.moveTo(-4, 4); c.lineTo(-4, 1); c.moveTo(4, 4); c.lineTo(4, 1); c.stroke();
  // body
  c.beginPath(); c.moveTo(-8, -1); c.quadraticCurveTo(-9, -8, -2, -9); c.lineTo(5, -9); c.quadraticCurveTo(11, -8, 11, -2); c.quadraticCurveTo(10, 1.5, 4, 1.5); c.lineTo(-5, 1.5); c.closePath();
  c.fillStyle = o.col || "#f4f3ef"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke();
  c.fillStyle = "#3d6680"; c.beginPath(); c.moveTo(4, -8); c.quadraticCurveTo(10, -7.5, 10, -2.5); c.lineTo(5, -2.5); c.closePath(); c.fill();
  c.fillStyle = "#c8343a"; c.fillRect(-7, -3, 11, 1.4);
  c.fillStyle = "#3d6680"; c.fillRect(-3, -7, 4, 3);
  // mast + main rotor (a spinning blade pair seen nearly edge-on + blur disc)
  c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.moveTo(1, -9); c.lineTo(1, -12); c.stroke();
  const spin = rotor, L = 22;
  c.fillStyle = `rgba(60,60,60,${0.08 + 0.1 * Math.min(1, o.rpm ?? 1)})`; c.beginPath(); c.ellipse(1, -12, L, 3, 0, 0, 6.3); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.6;
  for (const ph of [0, Math.PI]) { const a = spin + ph; c.beginPath(); c.moveTo(1, -12); c.lineTo(1 + Math.cos(a) * L, -12 + Math.sin(a) * 3); c.stroke(); }
  c.restore();
}

// ---------- beach games ----------
export function sandcastle(k, u, v) {
  const c = k.ctx, col = "#e2c084";
  k.ell(u + 0.08, v + 0.04, 0, 0.26, "rgba(120,90,50,0.18)", { stroke: false });
  k.cyl(u, v, 0, 0.2, 0.1, col, {});
  k.cyl(u, v, 0.1, 0.13, 0.12, shade(col, 0.04), {});
  for (const [du, dv] of [[-0.14, 0.05], [0.12, 0.08], [0.02, -0.15]]) k.cyl(u + du, v + dv, 0.08, 0.05, 0.11, shade(col, 0.02), {});
  const [x, y] = P(u, v, 0.24); c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 9); c.stroke(); c.fillStyle = "#d9544b"; c.beginPath(); c.moveTo(x, y - 9); c.lineTo(x + 5, y - 7.5); c.lineTo(x, y - 6); c.fill();
}
export function bucket(k, u, v, col = "#3e6fa8") {
  const c = k.ctx, [x, y] = P(u, v, 0);
  c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x - 3.5, y - 6); c.lineTo(x + 3.5, y - 6); c.lineTo(x + 2.6, y); c.lineTo(x - 2.6, y); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.ellipse(x, y - 6, 3.5, 1.2, 0, 0, 6.3); c.fillStyle = shade(col, -0.25); c.fill(); c.stroke();
  c.beginPath(); c.arc(x, y - 6, 3.6, Math.PI, 0); c.stroke();
}
export function towel(k, u, v, dir, c1, c2) {
  let [a, b] = dir; const l = Math.hypot(a, b) || 1; a /= l; b /= l; const n = [-b, a], L = 0.75, W = 0.36;
  for (let i = 0; i < 5; i++) { const f0 = i / 5 * L, f1 = (i + 1) / 5 * L; k.poly([[u + a * f0 - n[0] * W / 2, v + b * f0 - n[1] * W / 2, 0.01], [u + a * f1 - n[0] * W / 2, v + b * f1 - n[1] * W / 2, 0.01], [u + a * f1 + n[0] * W / 2, v + b * f1 + n[1] * W / 2, 0.01], [u + a * f0 + n[0] * W / 2, v + b * f0 + n[1] * W / 2, 0.01]], i % 2 ? c2 : c1, { lw: 0.8, wobble: 0, stroke: i === 0 || i === 4 ? INK : "rgba(42,36,32,0.25)" }); }
}
export { look };

// ---------- car with any heading (oriented boxes, visible faces sorted) ----------
function obox(k, u, v, a, b, f0, f1, s, z0, z1, col, o = {}) {
  const n = [-b, a];
  const C = (f, ss, z) => P(u + a * f + n[0] * ss, v + b * f + n[1] * ss, z);
  const faces = [
    { q: [C(f1, -s, z0), C(f1, s, z0), C(f1, s, z1), C(f1, -s, z1)], nu: a, nv: b, k: "front" },
    { q: [C(f0, s, z0), C(f0, -s, z0), C(f0, -s, z1), C(f0, s, z1)], nu: -a, nv: -b, k: "back" },
    { q: [C(f0, s, z0), C(f1, s, z0), C(f1, s, z1), C(f0, s, z1)], nu: n[0], nv: n[1], k: "side+" },
    { q: [C(f1, -s, z0), C(f0, -s, z0), C(f0, -s, z1), C(f1, -s, z1)], nu: -n[0], nv: -n[1], k: "side-" },
  ].filter((F) => F.nu + F.nv > 0.001);
  for (const F of faces) { const lit = F.nu - F.nv < 0; k.path(F.q, { fill: o.side ? o.side(F) : shade(col, lit ? -0.06 : -0.22), lw: o.lw ?? 1, wobble: 0 }); }
  const top = [C(f0, -s, z1), C(f1, -s, z1), C(f1, s, z1), C(f0, s, z1)];
  if (o.top !== false) k.path(top, { fill: o.topCol || shade(col, 0.06), lw: o.lw ?? 1, wobble: 0 });
  return { faces, top, C };
}
export function carAny(k, u, v, dir, col, o = {}) {
  const c = k.ctx; let [a, b] = dir; const l = Math.hypot(a, b) || 1; a /= l; b /= l; const n = [-b, a];
  const z = o.z ?? 0, L = 0.46, W = 0.2;
  const C = (f, s, zz) => P(u + a * f + n[0] * s, v + b * f + n[1] * s, z + zz);
  // shadow
  k.path([C(-L, -W, 0), C(L, -W, 0), C(L + 0.08, W + 0.06, 0), C(-L + 0.08, W + 0.06, 0)].map((p) => [p[0] + 3, p[1] + 1]), { fill: "rgba(40,30,20,0.2)", stroke: false, wobble: 0 });
  // wheels on the far side first (peek under the body)
  const wheel = (f, s) => { const [x, y] = C(f, s, 0.08); c.fillStyle = "#1d1b1b"; c.beginPath(); c.ellipse(x, y, 4.4, 3.6, 0, 0, 6.3); c.fill(); c.fillStyle = "#9aa3ab"; c.beginPath(); c.ellipse(x, y, 1.7, 1.4, 0, 0, 6.3); c.fill(); };
  const nearS = n[0] + n[1] > 0 ? W : -W, nearF = a + b > 0 ? L * 0.62 : -L * 0.62;
  wheel(L * 0.62, -nearS); wheel(-L * 0.62, -nearS);
  // body
  obox(k, u, v, a, b, -L, L, W, z + 0.07, z + 0.22, col, { lw: 1.1 });
  wheel(L * 0.62, nearS); wheel(-L * 0.62, nearS);
  // bonnet line + bumpers
  // cabin: a frustum set back from the nose, glass on all sides
  const cf0 = -L * 0.55, cf1 = L * 0.3, s0 = W * 0.92, s1 = W * 0.78, za = z + 0.22, zb = z + 0.38;
  const lo = [C(cf0, -s0, 0.22), C(cf1, -s0, 0.22), C(cf1, s0, 0.22), C(cf0, s0, 0.22)];
  const hi = [C(cf0 + 0.07, -s1, 0.38), C(cf1 - 0.12, -s1, 0.38), C(cf1 - 0.12, s1, 0.38), C(cf0 + 0.07, s1, 0.38)];
  const fc = [[0, 1], [1, 2], [2, 3], [3, 0]].map(([i, j], idx) => ({ q: [lo[i], lo[j], hi[j], hi[i]], idx }));
  const nrm = [[-n[0], -n[1]], [a, b], [n[0], n[1]], [-a, -b]];
  for (const F of fc) { const [nu, nv] = nrm[F.idx]; if (nu + nv <= 0) continue; k.path(F.q, { fill: F.idx === 1 ? "#a9cfe0" : "#7fa9bf", lw: 0.9, wobble: 0 }); const [p0, p1, p2, p3] = F.q; c.strokeStyle = "rgba(255,255,255,0.55)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(lerp(p0[0], p2[0], 0.25), lerp(p0[1], p2[1], 0.3)); c.lineTo(lerp(p0[0], p2[0], 0.45), lerp(p0[1], p2[1], 0.75)); c.stroke(); if (F.idx === 0 || F.idx === 2) { c.strokeStyle = shade(col, -0.3); c.lineWidth = 1.4; c.beginPath(); c.moveTo(lerp(p0[0], p1[0], 0.45), lerp(p0[1], p1[1], 0.45)); c.lineTo(lerp(p3[0], p2[0], 0.45), lerp(p3[1], p2[1], 0.45)); c.stroke(); } }
  k.path(hi, { fill: shade(col, 0.1), lw: 1, wobble: 0 });
  // lights: headlights at the nose, tail lights
  for (const s of [-W * 0.7, W * 0.7]) { const [hx, hy] = C(L, s, 0.16); c.fillStyle = "#fff6c8"; c.beginPath(); c.arc(hx, hy, 1.4, 0, 6.3); c.fill(); const [tx, ty] = C(-L, s, 0.16); c.fillStyle = "#e0302a"; c.beginPath(); c.arc(tx, ty, 1.3, 0, 6.3); c.fill(); }
  c.strokeStyle = "rgba(255,255,255,0.5)"; c.lineWidth = 1; c.beginPath(); c.moveTo(...C(-L * 0.9, -W, 0.21)); c.lineTo(...C(L * 0.9, -W, 0.21)); c.stroke();
}

// ---------- date palm on any ground height (private copy of _props.dpalm + z) ----------
export function palmZ(k, u, v, z, o = {}) {
  const c = k.ctx, t = k.t, h = o.h ?? 2.3, seed = o.seed ?? Math.round(u * 17 + v * 29), R = rng(seed * 13 + 5);
  const [bx, by] = P(u, v, z), [tx0, ty] = P(u, v, z + h);
  const lean = (o.lean ?? (R() - 0.5) * 0.9) * CTS.S, tx = tx0 + lean;
  c.fillStyle = "rgba(60,45,30,0.16)"; c.beginPath(); c.ellipse(bx + 10, by + 3, 20, 6, 0, 0, 6.3); c.fill();
  const sway = Math.sin(t * 0.9 + seed) * 1.4;
  c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 7.5; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + lean * 0.1, (by + ty) / 2, tx + sway, ty); c.stroke();
  c.strokeStyle = "#a98258"; c.lineWidth = 4.8; c.stroke();
  // trunk rings
  c.strokeStyle = "rgba(70,44,22,0.6)"; c.lineWidth = 1;
  for (let i = 1; i < 14; i++) { const f = i / 14, x = lerp(bx, tx + sway, f * f * 0.3 + f * 0.7) , y = lerp(by, ty, f); c.beginPath(); c.moveTo(x - 2.4, y + 0.6); c.lineTo(x + 2.4, y - 0.6); c.stroke(); }
  const N = o.fronds ?? 12, L0 = (o.len ?? 1) * CTS.S * 1.05, frs = [];
  for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2 + R() * 0.25, s = Math.sin(a); frs.push({ a, s, L: L0 * (0.8 + R() * 0.3), ph: R() * 6.28 }); }
  frs.sort((p, q) => p.s - q.s);
  const cx = tx + sway, cy = ty;
  const draw = (f) => {
    const sw = Math.sin(t * 1.5 + f.ph) * 0.05;
    const dx = Math.cos(f.a + sw), dy = Math.sin(f.a + sw) * 0.48;
    const p0 = [cx, cy], p1 = [cx + dx * f.L * 0.5, cy + dy * f.L * 0.5 - f.L * 0.38], p2 = [cx + dx * f.L, cy + dy * f.L + f.L * 0.3 + Math.sin(t * 2 + f.ph) * 1.4];
    const pt = (s) => { const q = 1 - s; return [q * q * p0[0] + 2 * q * s * p1[0] + s * s * p2[0], q * q * p0[1] + 2 * q * s * p1[1] + s * s * p2[1]]; };
    const left = [], right = [], n = 16;
    for (let j = 0; j <= n; j++) {
      const s = j / n, A = pt(s), B = pt(Math.min(1, s + 0.03)), A2 = pt(Math.max(0, s - 0.03));
      const tx2 = B[0] - A2[0], ty2 = B[1] - A2[1], l = Math.hypot(tx2, ty2) || 1, nx = -ty2 / l, ny = tx2 / l;
      const w = Math.pow(Math.sin(Math.PI * Math.min(0.97, s * 0.92 + 0.06)), 0.8) * 7.6 * (o.wide ?? 1) * (j % 2 ? 1 : 0.55);
      left.push([A[0] + nx * w, A[1] + ny * w]); right.push([A[0] - nx * w, A[1] - ny * w]);
    }
    const poly = [...left, ...[...right].reverse()];
    c.beginPath(); poly.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
    c.fillStyle = f.s > 0.2 ? "#6aa653" : f.s > -0.3 ? "#5c9a4a" : "#4a8540"; c.fill(); c.lineWidth = 1.4; c.strokeStyle = INK; c.lineJoin = "round"; c.stroke();
    c.strokeStyle = "rgba(200,235,150,0.7)"; c.lineWidth = 1; c.beginPath(); for (let j = 0; j <= n; j++) { const p = pt(j / n); j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke();
  };
  for (const f of frs) if (f.s < 0) draw(f);
  c.fillStyle = "#8a6a3e"; c.beginPath(); c.arc(cx, cy + 1, 3.8, 0, 6.3); c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  if (o.dates !== false) { c.fillStyle = "#d9892f"; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(cx - 4 + i * 2, cy + 4 + (i % 2), 1.5, 0, 6.3); c.fill(); } }
  for (const f of frs) if (f.s >= 0) draw(f);
}

// ---------- a wake that follows the boat's real track (pos(t') for earlier times) ----------
export function trailWake(k, posAt, t, o = {}) {
  const c = k.ctx, N = o.n ?? 16, dt = o.dt ?? 0.35, w0 = o.w0 ?? 0.3, spread = o.spread ?? 0.09, skip = o.skip ?? 2;
  const pts = []; for (let i = skip; i <= N + skip; i++) pts.push(posAt(t - i * dt));
  c.lineCap = "round";
  for (const sd of [-1, 1]) {
    const arm = pts.map((p, i) => { const L = Math.hypot(p.du, p.dv) || 1, nu = -p.dv / L, nv = p.du / L, w = w0 + i * spread; return P(p.u + nu * sd * w, p.v + nv * sd * w, 0); });
    for (let i = 0; i < arm.length - 1; i++) { c.strokeStyle = `rgba(255,255,255,${(o.a ?? 0.85) * (1 - i / arm.length)})`; c.lineWidth = (o.lw ?? 2.6) * (1 - i / (arm.length + 4)); c.beginPath(); c.moveTo(...arm[i]); c.lineTo(...arm[i + 1]); c.stroke(); }
  }
  // churned centre
  for (let i = 0; i < pts.length; i += 1) { const p = pts[i], f = i / pts.length, [x, y] = P(p.u, p.v, 0); c.fillStyle = `rgba(255,255,255,${0.6 * (1 - f)})`; c.beginPath(); c.ellipse(x + Math.sin(i * 2.3 + t * 3) * 1.5, y, 2.5 + f * 7 * (o.churn ?? 1), 1.2 + f * 2.4 * (o.churn ?? 1), 0, 0, 6.3); c.fill(); }
}
