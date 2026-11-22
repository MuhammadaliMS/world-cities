// Grid-pass helpers for DUBAI 1,1 (Al Fahidi & Dubai Creek). Axis-aligned houses with wind towers; private to this tile.
import { P, INK, shade, lerp, rng } from "../../lib/vec-kit.js";
import { WALL, WALL_L, door, win, gypsum, archOpen, mashrabiya, beams, barjeel, cornice, crown, solid, lantern, tr } from "./_t1_1.js";

export { look } from "./_props.js";

// face mappers (s runs to the right on screen, z up, o = out of the wall)
export const LF = (v1, u0 = 0) => (s, z, o = 0) => P(u0 + s, v1 + o, z); // left face at v = v1 (normal +v), s along +u
export const RF = (u1, v1) => (s, z, o = 0) => P(u1 + o, v1 - s, z); // right face at u = u1 (normal +u), s along -v from v1

function detail(k, F, op) {
  const [kind, ...a] = op;
  if (kind === "door") door(k, F, a[0], a[1], a[2], { pointed: true, ...(a[3] || {}) });
  else if (kind === "gyp") gypsum(k, F, ...a);
  else if (kind === "win") win(k, F, ...a);
  else if (kind === "mash") mashrabiya(k, F, ...a);
  else if (kind === "beams") beams(k, F, a[0], a[1], a[2] ?? 0.22);
  else if (kind === "arch") archOpen(k, F, ...a);
  else if (kind === "lamp") { const [x, y] = F(a[0], a[1], 0.06); lantern(k, x, y, { s: 0.8, chain: 3, ph: a[0] * 3 }); }
  else if (kind === "fn") a[0](k, F);
}

// a sand house: box + facade details + cornice + crenellated parapet + square barjeel + roof props
// H: { u0,u1,v0,v1,h,col,seed, L:[ops on the left face], R:[ops on the right face], tower:[u,v,size,height], roof(k,z) }
export function house(k, H) {
  const { u0, u1, v0, v1, h } = H, col = H.col || WALL, foot = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
  const FL = LF(v1, u0), FRr = RF(u1, v1);
  solid(k, foot, 0, h, col, { seed: H.seed ?? 1 });
  for (const op of H.L || []) detail(k, FL, op);
  for (const op of H.R || []) detail(k, FRr, op);
  cornice(k, FL, 0, u1 - u0, h); cornice(k, FRr, 0, v1 - v0, h);
  crown(k, foot, h, col, { t: 0.1, mh: 0.2, bh: 0.08, w: 0.16, gap: 0.1 });
  if (H.roof) H.roof(k, h);
  if (H.tower) { const [tu, tv, sz, th] = H.tower; barjeel(k, [[tu, tv], [tu + sz, tv], [tu + sz, tv + sz], [tu, tv + sz]], h, h + th, { col: shade(col, 0.06), bays: 3 }); }
}

// stone slab paving: courses along u and v, tinted slabs
export function paving(k, u0, v0, u1, v1, step = 0.5, seed = 5) {
  const c = k.ctx, R = rng(seed);
  c.save(); k._trace([P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)], true, 0); c.clip();
  for (let u = u0; u < u1; u += step) for (let v = v0; v < v1; v += step * 0.9) if (R() < 0.18) k.poly([[u, v, 0], [u + step, v, 0], [u + step, v + step * 0.9, 0], [u, v + step * 0.9, 0]], "rgba(190,150,95,0.22)", { stroke: false });
  c.strokeStyle = "rgba(150,112,66,0.3)"; c.lineWidth = 0.8; c.beginPath();
  for (let u = u0; u <= u1 + 0.01; u += step) { c.moveTo(...P(u, v0, 0)); c.lineTo(...P(u, v1, 0)); }
  for (let v = v0; v <= v1 + 0.01; v += step * 0.9) { c.moveTo(...P(u0, v, 0)); c.lineTo(...P(u1, v, 0)); }
  c.stroke(); c.restore();
}

// hung rug on a wall
export function rug(k, F, s, z, w, h, cols = ["#a8342f", "#e8c36a", "#2f4a78"]) {
  const c = k.ctx, q = [F(s, z + h), F(s + w, z + h), F(s + w, z), F(s, z)];
  k.path(q, { fill: cols[0], lw: 1, wobble: 0 });
  c.save(); tr(c, q); c.clip();
  const m = (a, b, f) => [lerp(a[0], b[0], f), lerp(a[1], b[1], f)];
  c.strokeStyle = cols[1]; c.lineWidth = 1.2;
  for (const f of [0.12, 0.2]) { c.beginPath(); c.moveTo(...m(q[0], q[3], f)); c.lineTo(...m(q[1], q[2], f)); c.stroke(); c.beginPath(); c.moveTo(...m(q[0], q[1], f)); c.lineTo(...m(q[3], q[2], f)); c.stroke(); }
  const cx = (q[0][0] + q[2][0]) / 2, cy = (q[0][1] + q[2][1]) / 2;
  c.fillStyle = cols[2]; c.beginPath(); c.moveTo(cx, cy - 8); c.lineTo(cx + 10, cy); c.lineTo(cx, cy + 8); c.lineTo(cx - 10, cy); c.closePath(); c.fill(); c.strokeStyle = cols[1]; c.stroke();
  c.fillStyle = cols[1]; c.beginPath(); c.arc(cx, cy, 2.2, 0, 6.3); c.fill();
  c.restore(); tr(c, q); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  c.strokeStyle = "#e8d8a8"; c.lineWidth = 1; c.beginPath(); for (let i = 0; i <= 12; i++) { const a = m(q[3], q[2], i / 12); c.moveTo(...a); c.lineTo(a[0], a[1] + 3); } c.stroke();
}

// timber planter / bench-like low box with cloth stacks or goods on top
export function stackTable(k, u0, u1, v0, v1, h, cols, seed = 1) {
  solid(k, [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], 0, h, "#a8733f", { tex: false, wobble: 0, lw: 1.1, topCol: "#7a5230" });
  const R = rng(seed), n = Math.max(2, Math.round((u1 - u0) / 0.22));
  for (let i = 0; i < n; i++) {
    const a = lerp(u0, u1, i / n) + 0.02, b = lerp(u0, u1, (i + 1) / n) - 0.02, col = cols[(i + seed) % cols.length], hh = 0.1 + R() * 0.2;
    solid(k, [[a, v0 + 0.05], [b, v0 + 0.05], [b, v1 - 0.05], [a, v1 - 0.05]], h, h + hh, col, { tex: false, wobble: 0, lw: 0.9, topCol: shade(col, 0.15) });
  }
}

export { WALL, WALL_L };
