// Tile worker: draws code tiles off the main thread and sends them back as bitmaps.
// The page (lib/live-city.js) runs a pool of these so the nine tiles of a city draw in parallel.
import { measureTile, drawVectorTile } from "./vec-tile.js";

const tiles = new Map(), failed = new Set();
let city = null, canvas = null, ctx = null;

self.onmessage = async ({ data: m }) => {
  if (m.type === "init") {
    city = m.city; // { id, theme }
    await Promise.all(m.keys.map(async (key) => {
      try { const mod = await import(`../vtiles/${city.id}/${key.replace(",", "_")}.js`); if (mod?.default) tiles.set(key, mod.default); } catch (e) { console.warn(`tile ${city.id} ${key} did not load in worker:`, e); }
    }));
    const boxes = {};
    if (m.measure) for (const [key, fn] of tiles) boxes[key] = measureTile(fn);
    canvas = new OffscreenCanvas(16, 16);
    ctx = canvas.getContext("2d");
    self.postMessage({ type: "ready", keys: [...tiles.keys()], boxes });
    return;
  }
  if (m.type === "tile") {
    const a = performance.now();
    const fn = tiles.get(m.key);
    if (canvas.width !== m.w || canvas.height !== m.h) { canvas.width = m.w; canvas.height = m.h; }
    if (ctx.reset) ctx.reset(); else { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, m.w, m.h); }
    if (fn) {
      ctx.translate(-m.x, -m.y);
      try { drawVectorTile(ctx, fn, m.ox, m.oy, m.cx, m.cy, m.scale, m.rev, m.t, city); }
      catch (e) { if (!failed.has(m.key)) { failed.add(m.key); console.warn(`tile ${city.id} ${m.key} failed in worker:`, e); } }
    }
    const bitmap = canvas.transferToImageBitmap();
    self.postMessage({ type: "tile", id: m.id, bitmap, ms: performance.now() - a }, [bitmap]);
  }
};
