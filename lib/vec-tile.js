// One code-drawn tile (vtiles/<city>/<gx>_<gy>.js) drawn in canonical tile space.
// No DOM use: this module runs on the page and inside tile workers (lib/tile-worker.js).
import { project, clamp, easeOutBack } from "./iso-engine.js";
import { Kit, CTS } from "./vec-kit.js";
import { drawSlabSides } from "./city-base.js";
import { setNight, glow } from "./night.js";
import { P } from "./vec-kit.js";

// measure a code tile's silhouette once: highest content row and the slab bottom, in canonical tile px
export function measureTile(drawFn) {
  const PAD = 760, W = CTS.W, H = CTS.H + PAD;
  const c = typeof document !== "undefined" ? Object.assign(document.createElement("canvas"), { width: W, height: H }) : new OffscreenCanvas(W, H);
  const g = c.getContext("2d", { willReadFrequently: true });
  g.translate(0, PAD);
  try { const kit = new Kit(g, 3, { stage: true }); drawFn(kit, 3); kit.flush(); } catch { return null; }
  g.setTransform(1, 0, 0, 1, 0, 0);
  const d = g.getImageData(0, 0, W, H).data;
  let top = H;
  for (let y = 0; y < H && top === H; y += 2) { let n = 0; for (let x = 0; x < W; x += 2) if (d[(y * W + x) * 4 + 3] > 200) n++; if (n >= 4) top = y; }
  const bottom = CTS.Y0 + 20 * CTS.S * CTS.YS + CTS.SLAB * CTS.S * CTS.ZS + 6;
  return { top: top - PAD, bottom };
}

// v7: a fully code-drawn tile (vtiles/<city>/<gx>_<gy>.js) drawn in canonical tile space
// night: { n (0 day .. 1 night), hints (cities/<id>.js tiles[key].night), seed }
export function drawVectorTile(ctx, drawFn, ox, oy, cx, cy, scale, rev, t, city, night) {
  const n = night?.n || 0;
  const [x0, y0] = project(ox, oy, 0, scale, cx, cy);
  const k = scale / CTS.S;
  ctx.save();
  if (rev < 0.999) {
    const e = easeOutBack(clamp(rev * 1.05, 0, 1));
    ctx.globalAlpha = clamp(rev * 2.2, 0, 1);
    ctx.translate(0, (1 - e) * -90 * (scale / 19.2));
  }
  ctx.translate(x0, y0);
  ctx.scale(k, k);
  ctx.translate(-CTS.X0, -CTS.Y0);
  if (n || ctx.__ns) setNight(ctx, n, { tile: true, hints: night?.hints, seed: night?.seed, P });
  // guard: tiles must not leak save/clip/transform state into later tiles or frames
  let depth = 0;
  const _save = ctx.save, _restore = ctx.restore;
  ctx.save = function () { depth++; _save.call(ctx); };
  ctx.restore = function () { if (depth > 0) { depth--; _restore.call(ctx); } };
  try {
    const kit = new Kit(ctx, t, { stage: true });
    drawFn(kit, t);
    kit.flush();
  } finally {
    while (depth > 0) { depth--; _restore.call(ctx); }
    delete ctx.save; delete ctx.restore;
  }
  if (city) drawSlabSides(ctx, city);
  if (n && night?.hints?.lights) for (const L of night.hints.lights) {
    const [x, y] = P(L.u, L.v, L.z || 0);
    glow(ctx, x, y, (L.r ?? 1) * CTS.S, L.col || "#ffd59a", (L.a ?? 0.6) * n, L.flat ? CTS.YS : 1);
  }
  if (ctx.__ns) setNight(ctx, n);
  ctx.restore();
}

