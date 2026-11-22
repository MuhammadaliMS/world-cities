// Helpers private to the Lujiazui tile (0,0): curtain-wall faces, skyline towers, trees, lamps.
import { P, CTS, INK, shade, mix, lerp, clamp, rng, hash, glint } from "./_props.js";

export const SQ2 = Math.SQRT2;
// bilinear point on a screen quad [b0, b1, t1, t0] (a along the base, b up)
export const bil = (q, a, b) => [lerp(lerp(q[0][0], q[1][0], a), lerp(q[3][0], q[2][0], a), b), lerp(lerp(q[0][1], q[1][1], a), lerp(q[3][1], q[2][1], a), b)];
export function tracePts(c, pts, close = true) { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); if (close) c.closePath(); }
export function bbox(pts) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return [x0, y0, x1, y1]; }

// glass curtain wall on a quad: gradient, sky sheen, floor lines, mullions, spandrels, a few dark panes
export function glassFace(c, q, o = {}) {
  const base = o.col || "#86aac4", floors = o.floors ?? 20, cols = o.cols ?? 6, R = rng(o.seed ?? 7);
  const [x0, y0, x1, y1] = bbox(q);
  c.save(); tracePts(c, q);
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, shade(base, o.lit ? 0.2 : 0.1)); g.addColorStop(0.45, base); g.addColorStop(1, shade(base, -0.14));
  c.fillStyle = g; c.fill(); c.clip();
  // diagonal sky sheen (warm on the lit face)
  if (o.sheen !== false) {
    const s = c.createLinearGradient(x0, y0, x1 + (y1 - y0) * 0.35, y1);
    const w = o.lit ? "rgba(255,240,215," : "rgba(225,240,255,";
    const k0 = 0.18 + R() * 0.2;
    s.addColorStop(0, w + "0)"); s.addColorStop(k0, w + (o.lit ? 0.42 : 0.22) + ")"); s.addColorStop(k0 + 0.12, w + "0)");
    s.addColorStop(k0 + 0.3, w + "0)"); s.addColorStop(k0 + 0.38, w + (o.lit ? 0.26 : 0.14) + ")"); s.addColorStop(Math.min(1, k0 + 0.5), w + "0)");
    c.fillStyle = s; c.fillRect(x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4);
  }
  // darker / brighter panes
  for (let i = 0; i < floors * cols * 0.12; i++) {
    const a = Math.floor(R() * cols) / cols, b = Math.floor(R() * floors) / floors, da = 1 / cols, db = 1 / floors;
    tracePts(c, [bil(q, a, b), bil(q, a + da, b), bil(q, a + da, b + db), bil(q, a, b + db)]);
    c.fillStyle = R() < 0.6 ? "rgba(20,45,75,0.16)" : "rgba(255,255,255,0.16)"; c.fill();
  }
  // floors + mullions
  c.lineWidth = 0.6; c.strokeStyle = o.line || "rgba(20,42,68,0.36)"; c.beginPath();
  for (let i = 1; i < floors; i++) { const p = bil(q, 0, i / floors), r = bil(q, 1, i / floors); c.moveTo(p[0], p[1]); c.lineTo(r[0], r[1]); }
  for (let j = 1; j < cols; j++) { const p = bil(q, j / cols, 0), r = bil(q, j / cols, 1); c.moveTo(p[0], p[1]); c.lineTo(r[0], r[1]); }
  c.stroke();
  if (o.band) { c.strokeStyle = "rgba(255,255,255,0.5)"; c.lineWidth = 1.1; c.beginPath(); for (let i = o.band; i < floors; i += o.band) { const p = bil(q, 0, i / floors), r = bil(q, 1, i / floors); c.moveTo(p[0], p[1] + 1); c.lineTo(r[0], r[1] + 1); } c.stroke(); }
  if (o.pier) { c.strokeStyle = o.pierCol || "rgba(235,240,245,0.55)"; c.lineWidth = o.pier; c.beginPath(); for (let j = o.pierEvery ?? 2; j < cols; j += o.pierEvery ?? 2) { const p = bil(q, j / cols, 0), r = bil(q, j / cols, 1); c.moveTo(p[0], p[1]); c.lineTo(r[0], r[1]); } c.stroke(); }
  // corner highlight
  c.strokeStyle = "rgba(255,255,255,0.55)"; c.lineWidth = 1.2; c.beginPath(); const e0 = bil(q, o.edgeA ?? 0.985, 0), e1 = bil(q, o.edgeA ?? 0.985, 1); c.moveTo(e0[0], e0[1]); c.lineTo(e1[0], e1[1]); c.stroke();
  c.restore();
  tracePts(c, q); c.strokeStyle = INK; c.lineWidth = o.lw ?? 1.4; c.lineJoin = "round"; c.stroke();
}

// masonry facade: cream stone, punched windows in pier bays, cornice bands, a few lit windows
export function stoneFace(c, q, o = {}) {
  const base = o.col || "#dccaa5", floors = o.floors ?? 12, cols = o.cols ?? 5, R = rng(o.seed ?? 3);
  const [x0, y0, x1, y1] = bbox(q);
  c.save(); tracePts(c, q);
  const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, shade(base, 0.08)); g.addColorStop(1, shade(base, -0.08));
  c.fillStyle = g; c.fill(); c.clip();
  const win = o.win || "#7d9cb3", mx = o.mx ?? 0.24, my = o.my ?? 0.24;
  for (let r = 0; r < floors; r++) for (let j = 0; j < cols; j++) {
    const a0 = (j + mx) / cols, a1 = (j + 1 - mx) / cols, b0 = (r + my) / floors, b1 = (r + 1 - my * 0.7) / floors;
    const lit = R() < (o.lit ?? 0.06);
    tracePts(c, [bil(q, a0, b0), bil(q, a1, b0), bil(q, a1, b1), bil(q, a0, b1)]);
    c.fillStyle = lit ? "#f2d68c" : (o.dark ? shade(win, -0.12) : win); c.fill();
    if (!lit) { const t0 = bil(q, a0, b1), t1 = bil(q, a1, b1); c.strokeStyle = "rgba(255,255,255,0.45)"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(t0[0], t0[1] + 0.8); c.lineTo(t1[0], t1[1] + 0.8); c.stroke(); }
  }
  // pier shadows + cornice bands
  c.strokeStyle = "rgba(90,70,40,0.22)"; c.lineWidth = 0.7; c.beginPath();
  for (let j = 0; j <= cols; j++) { const p = bil(q, j / cols, 0), r = bil(q, j / cols, 1); c.moveTo(p[0] + 0.6, p[1]); c.lineTo(r[0] + 0.6, r[1]); }
  c.stroke();
  const band = o.band ?? 4;
  for (let i = band; i < floors; i += band) { const p = bil(q, 0, i / floors), r = bil(q, 1, i / floors); c.strokeStyle = "rgba(255,250,235,0.85)"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(r[0], r[1]); c.stroke(); c.strokeStyle = "rgba(90,70,40,0.4)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(p[0], p[1] + 1.4); c.lineTo(r[0], r[1] + 1.4); c.stroke(); }
  c.restore();
  tracePts(c, q); c.strokeStyle = INK; c.lineWidth = o.lw ?? 1.4; c.lineJoin = "round"; c.stroke();
}

export function faceQuads(u, v, du, dv, z0, z1) {
  return {
    L: [P(u, v + dv, z0), P(u + du, v + dv, z0), P(u + du, v + dv, z1), P(u, v + dv, z1)],
    R: [P(u + du, v, z0), P(u + du, v + dv, z0), P(u + du, v + dv, z1), P(u + du, v, z1)],
    T: [P(u, v, z1), P(u + du, v, z1), P(u + du, v + dv, z1), P(u, v + dv, z1)],
  };
}

// one block of a building: glass or stone faces + roof slab
export function block(k, u, v, du, dv, z0, z1, o = {}) {
  const c = k.ctx, f = faceQuads(u, v, du, dv, z0, z1), h = z1 - z0;
  if (o.shadow !== false && z0 <= 0.01) k.shadow([[u + du, v, 0], [u + du + h * 0.3, v + h * 0.1, 0], [u + du + h * 0.3, v + dv + h * 0.1, 0], [u + du, v + dv, 0]], 0.1);
  const fl = o.floors ?? Math.max(2, Math.round(h / (o.kind === "stone" ? 0.32 : 0.2)));
  const cl = o.cols ?? Math.max(2, Math.round(du / (o.kind === "stone" ? 0.22 : 0.13))), cr = o.colsR ?? Math.max(2, Math.round(dv / (o.kind === "stone" ? 0.22 : 0.13)));
  if (o.kind === "stone") {
    stoneFace(c, f.L, { col: o.left || o.col, floors: fl, cols: cl, seed: o.seed, band: o.band, win: o.win, lit: o.litWin });
    stoneFace(c, f.R, { col: o.right || shade(o.col || "#dccaa5", -0.2), floors: fl, cols: cr, seed: (o.seed || 1) + 5, band: o.band, win: shade(o.win || "#7d9cb3", -0.15), dark: true, lit: o.litWin });
  } else {
    glassFace(c, f.L, { col: o.left || shade(o.col || "#86aac4", 0.06), floors: fl, cols: cl, lit: true, seed: o.seed, band: o.band, pier: o.pier, pierEvery: o.pierEvery });
    glassFace(c, f.R, { col: o.right || shade(o.col || "#86aac4", -0.2), floors: fl, cols: cr, seed: (o.seed || 1) + 3, band: o.band, pier: o.pier, pierEvery: o.pierEvery, edgeA: 0.015 });
  }
  if (o.noTop !== true) k.path(f.T, { fill: o.top || (o.kind === "stone" ? "#e9dcbf" : "#c7d8e2"), lw: 1.3, wobble: 0 });
  return f;
}
// thin cornice / parapet slab
export function slabRim(k, u, v, du, dv, z, th, col, over = 0.05) {
  const f = faceQuads(u - over, v - over, du + over * 2, dv + over * 2, z, z + th);
  k.path(f.L, { fill: shade(col, -0.04), lw: 1.1, wobble: 0 }); k.path(f.R, { fill: shade(col, -0.22), lw: 1.1, wobble: 0 }); k.path(f.T, { fill: shade(col, 0.06), lw: 1.1, wobble: 0 });
}
// rooftop plant: little boxes + vents
export function roofKit(k, u, v, du, dv, z, seed) {
  const R = rng(seed);
  for (let i = 0; i < 2; i++) { const w = du * (0.25 + R() * 0.2), d = dv * (0.25 + R() * 0.2), uu = u + R() * (du - w), vv = v + R() * (dv - d); k.box(uu, vv, z, w, d, 0.12 + R() * 0.12, "#c9c4ba", { hatch: false, shadow: false }); }
}
export function spireLine(k, u, v, z0, z1, col = "#d8d2c4", w = 2.6) {
  const c = k.ctx, a = P(u, v, z0), b = P(u, v, z1);
  c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = w + 1.6; c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke();
  c.strokeStyle = col; c.lineWidth = w; c.stroke();
  const bl = (k.t % 2) < 1; k.circle(b[0], b[1], 1.8, bl ? "#ff4040" : "#8a2a2a", { lw: 0.8 });
}

// ---------- trees ----------
export function willow(k, u, v, h, seed, t) {
  const c = k.ctx, [bx, by] = P(u, v, 0), [cx, cy] = P(u, v, h);
  k.ell(u + 0.4, v + 0.15, 0, 0.95, "rgba(60,45,30,0.15)", { stroke: false });
  c.lineCap = "round";
  // gnarled trunk with two limbs
  for (const [w, s] of [[10, INK], [6.6, "#7d5b3c"]]) { c.strokeStyle = s; c.lineWidth = w; c.beginPath(); c.moveTo(bx, by); c.bezierCurveTo(bx - 4, by - 20, bx + 5, cy + 40, cx - 2, cy + 16); c.moveTo(bx + 1, cy + 44); c.quadraticCurveTo(bx + 14, cy + 30, cx + 18, cy + 8); c.moveTo(bx - 1, cy + 38); c.quadraticCurveTo(bx - 14, cy + 26, cx - 20, cy + 10); c.stroke(); }
  c.strokeStyle = "rgba(255,255,255,0.25)"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(bx - 2, by - 2); c.bezierCurveTo(bx - 6, by - 20, bx + 3, cy + 40, cx - 4, cy + 18); c.stroke();
  const R = rng(seed * 9 + 1), col = "#a3c450";
  // crown mass
  for (let i = 0; i < 7; i++) { const a = (i / 7) * 6.283; k._lobe(cx + Math.cos(a) * 30, cy + Math.sin(a) * 13 - 2, 22, shade(col, (i % 2) * 0.05 - 0.04), seed + i, { bumps: 8 }); }
  k._lobe(cx, cy - 10, 28, shade(col, 0.05), seed + 9, { bumps: 9 });
  // hanging curtains of fronds in layers (back darker), swaying
  const layer = (n, rmin, rmax, dark, ph) => {
    for (let i = 0; i < n; i++) {
      const a = R() * Math.PI * 2, rr = rmin + R() * (rmax - rmin), x0 = cx + Math.cos(a) * rr, y0 = cy + Math.sin(a) * rr * 0.36 + 4;
      const len = (34 + R() * 34) * (h / 2.5), sw = Math.sin(t * 1.3 + i * 0.5 + seed + ph) * 3 + Math.sin(t * 2.6 + i) * 0.9;
      c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x0 + sw * 0.3, y0 + len * 0.55, x0 + sw, y0 + len);
      c.strokeStyle = "rgba(40,58,22,0.9)"; c.lineWidth = 4.2; c.stroke();
      c.strokeStyle = shade(i % 3 ? "#a9cb5c" : "#93b94a", dark); c.lineWidth = 2.8; c.stroke();
      // leaf ticks
      c.strokeStyle = shade("#c4dc7a", dark); c.lineWidth = 0.9; c.beginPath();
      for (let s = 0.25; s < 1; s += 0.22) { const xx = x0 + sw * s * s, yy = y0 + len * s; c.moveTo(xx - 1.6, yy - 1); c.lineTo(xx, yy + 1.4); c.lineTo(xx + 1.6, yy - 1); }
      c.stroke();
    }
  };
  layer(26, 10, 44, -0.12, 0); layer(30, 8, 46, 0, 1.7);
}
export function blossom(k, u, v, o = {}) {
  // cherry tree: dark branching trunk, clustered pink puffs with petal dots, falling petals
  const c = k.ctx, t = k.t, r = o.r ?? 0.75, h = o.h ?? 1.2, seed = o.seed ?? 1, col = o.col || "#f2a6c4", R = rng(seed * 7 + 3);
  k.ell(u + 0.3, v + 0.12, 0, r * 0.85, "rgba(60,45,30,0.14)", { stroke: false });
  const [bx, by] = P(u, v, 0), [cx, cy] = P(u, v, h), Rr = r * CTS.S;
  c.lineCap = "round";
  for (const [w, s] of [[7, INK], [4.2, "#5e3f33"]]) { c.strokeStyle = s; c.lineWidth = w; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + 1, cy + Rr * 0.4); c.lineTo(bx - Rr * 0.4, cy - Rr * 0.05); c.moveTo(bx + 1, cy + Rr * 0.4); c.lineTo(bx + Rr * 0.45, cy - Rr * 0.1); c.stroke(); }
  const lobes = [[-0.45, -0.1, 0.5], [0.45, -0.15, 0.5], [0, -0.45, 0.55], [-0.2, 0.15, 0.5], [0.25, 0.12, 0.5], [0.0, -0.05, 0.55]];
  lobes.forEach(([dx, dy, s], i) => {
    const sw = Math.sin(t * 1.1 + seed + i) * 1.2;
    k._lobe(cx + dx * Rr + sw, cy + dy * Rr, Rr * s, shade(col, -(dx + dy) * 0.1), seed * 13 + i, { bumps: 10 });
  });
  c.fillStyle = "rgba(255,255,255,0.75)";
  for (let i = 0; i < 26; i++) { const x = cx + (R() - 0.5) * Rr * 1.7, y = cy + (R() - 0.6) * Rr * 1.3; c.beginPath(); c.arc(x, y, 1.1, 0, 7); c.fill(); }
  c.fillStyle = shade(col, -0.25);
  for (let i = 0; i < 18; i++) { const x = cx + (R() - 0.5) * Rr * 1.6, y = cy + (R() - 0.4) * Rr * 1.2; c.beginPath(); c.arc(x, y, 1.0, 0, 7); c.fill(); }
  // falling petals (loop every few seconds)
  for (let i = 0; i < 5; i++) {
    const ph = (t * 0.22 + i / 5 + seed * 0.13) % 1, x = cx + (hash(seed * 9 + i) - 0.5) * Rr * 1.6 + Math.sin(t * 2 + i) * 5, y = lerp(cy, by + 4, ph);
    c.globalAlpha = Math.min(1, (1 - ph) * 3); c.fillStyle = "#f7b9d0"; c.beginPath(); c.ellipse(x, y, 1.8, 1.1, ph * 6, 0, 7); c.fill(); c.globalAlpha = 1;
  }
}
// round clipped shrub / flowering bush
export function bush(k, u, v, r, col, seed, flowers) {
  const c = k.ctx, [x, y] = P(u, v, r * 0.55);
  k.ell(u + 0.12, v + 0.05, 0, r * 0.9, "rgba(60,45,30,0.13)", { stroke: false });
  k._lobe(x, y, r * CTS.S, col, seed, { squash: 0.8, bumps: 9 });
  if (flowers) { const R = rng(seed + 5); for (let i = 0; i < Math.round(r * 26); i++) { const a = R() * 6.283, d = Math.sqrt(R()) * r * CTS.S * 0.8; c.fillStyle = flowers[Math.floor(R() * flowers.length)]; c.beginPath(); c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7 - 2, 1.5, 0, 7); c.fill(); } }
}
// black Shanghai park lamp: fluted post, lantern with a cap, warm glass
export function parkLamp(k, u, v, z = 0, o = {}) {
  const c = k.ctx, h = o.h ?? 1.5, [x, y] = P(u, v, z), [, yt] = P(u, v, z + h);
  k.ell(u + 0.12, v + 0.05, z, 0.12, "rgba(60,45,30,0.16)", { stroke: false });
  k.path([[x - 4, y], [x + 4, y], [x + 2.4, y - 6], [x - 2.4, y - 6]], { fill: "#2b2e30", lw: 1, wobble: 0 });
  c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y - 5); c.lineTo(x, yt + 2); c.stroke(); c.strokeStyle = "#3a3e40"; c.lineWidth = 2.2; c.stroke();
  c.strokeStyle = "rgba(255,255,255,0.35)"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x - 0.6, y - 7); c.lineTo(x - 0.6, yt + 4); c.stroke();
  k.path([[x - 3.6, yt + 1], [x + 3.6, yt + 1], [x + 5, yt - 10], [x - 5, yt - 10]], { fill: "#fbe7a6", lw: 1.1, wobble: 0 });
  c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x, yt + 1); c.lineTo(x, yt - 10); c.stroke();
  k.path([[x - 6, yt - 10], [x + 6, yt - 10], [x + 2, yt - 14], [x - 2, yt - 14]], { fill: "#2b2e30", lw: 1, wobble: 0 });
  k.circle(x, yt - 15.5, 1.4, "#2b2e30", { lw: 0.8 });
  c.save(); c.globalAlpha = 0.18 + 0.05 * Math.sin(k.t * 2 + u); c.fillStyle = "#ffe9a0"; c.beginPath(); c.arc(x, yt - 4, 9, 0, 7); c.fill(); c.restore();
}
