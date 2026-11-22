// Live player: one city drawn in real time.
//
// Drawing a whole city on one thread takes 40-90 ms a frame, so the nine tiles are drawn by a pool of
// workers (lib/tile-worker.js) and come back as bitmaps. This thread draws only the streets, cars and
// walkers and stacks the tile bitmaps in depth order, so the camera always moves at the display rate.
//
// Time runs in fixed 1/60 s frames. A tile is asked for a few frames ahead ("lead"), for the camera of
// that future frame; when it arrives on time it is drawn 1:1 and the frame is exact. A tile that is late
// (a slow device, or all nine tiles in view) keeps its last bitmap, moved and scaled to the new camera.
import { WorldStage, DURATION } from "./world-stage.js";

const HZ = 60, LOOP = DURATION * HZ;
const SIZES = [[960, 540], [1280, 720], [1600, 900], [1920, 1080]];
const tOf = (n) => (((n % LOOP) + LOOP) % LOOP) / HZ;
const loopOf = (n) => Math.floor(n / LOOP);

export function liveSupported() {
  return typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined" && "transferToImageBitmap" in OffscreenCanvas.prototype;
}

export class LiveCity {
  // opts: workers (pool size), maxWidth (cap on the drawing width, px), size (index into SIZES), t (start time),
  //       onFrame(t) after every frame put on the canvas
  constructor(canvas, cityId, opts = {}) {
    this.canvas = canvas; this.cityId = cityId; this.opts = opts;
    this.n = Math.round((opts.t || 0) * HZ); this.clock = this.n / HZ;
    this.playing = false; this.ready = false; this.dead = false;
    this.pool = []; this.queue = []; this.jobs = new Map(); this.jobId = 0; this.epoch = 0; this.inFlight = 0;
    this.state = new Map(); // key -> { shown, early: [], pending }
    this.lead = 2; this.lat = 2; this.cap = 0; this.frameMs = 16.7; this.stats = { frames: 0, exact: 0, updates: 0, tileFrames: 0 };
  }
  get t() { return tOf(this.n); }

  async load() {
    const city = (await import(`../cities/${this.cityId}.js`)).default;
    if (this.dead) return;
    this.city = city;
    this.stage = new WorldStage(this.canvas, city);
    if (this.opts.background) this.stage.background = this.opts.background; // plain colour instead of the paper texture
    const keys = Object.keys(city.tiles || {});
    const cores = navigator.hardwareConcurrency || 4;
    const n = this.opts.workers || Math.max(2, Math.min(keys.length, cores - 1));
    const url = new URL("./tile-worker.js", import.meta.url);
    const boot = [];
    for (let i = 0; i < n; i++) {
      const w = new Worker(url, { type: "module" });
      const slot = { w, busy: false };
      boot.push(new Promise((res, rej) => {
        w.onerror = (e) => rej(new Error(e.message || "tile worker failed"));
        w.onmessage = ({ data }) => {
          if (data.type === "ready") { if (i === 0) for (const [k, b] of Object.entries(data.boxes)) this.stage.camOverrides.set(k, b); res(); return; }
          slot.busy = false; this.inFlight--;
          const job = this.jobs.get(data.id); this.jobs.delete(data.id);
          if (job && !this.dead) job.done(data.bitmap, job); else data.bitmap.close();
          this._pump();
        };
      }));
      w.postMessage({ type: "init", city: { id: city.id, theme: city.theme }, keys, measure: i === 0 });
      this.pool.push(slot);
    }
    await Promise.all(boot);
    if (this.dead) return;
    this.cap = n;
    for (const k of keys) { this.stage.vecTiles.set(k, true); this.state.set(k, { shown: null, early: [], pending: 0, last: -1e9 }); } // tiles are drawn by the workers
    const i = this.opts.size ?? this._fitSize();
    this.stage.resize(...SIZES[Math.max(0, Math.min(SIZES.length - 1, i))]);
    this.ready = true;
    await this.draw(this.t);
  }

  _fitSize() {
    const want = Math.min(this.opts.maxWidth || 1920, (this.canvas.clientWidth || 1280) * Math.min(2, window.devicePixelRatio || 1));
    let i = 0; while (i < SIZES.length - 1 && SIZES[i][0] < want * 0.9) i++;
    return i;
  }

  _send(tile, extra, done) {
    const id = ++this.jobId;
    this.jobs.set(id, { ...extra, tile, done });
    this.queue.push({ type: "tile", id, ...tile });
    this.inFlight++;
    this._pump();
  }
  _pump() {
    for (const slot of this.pool) {
      if (slot.busy) continue;
      const msg = this.queue.shift(); if (!msg) return;
      slot.busy = true; slot.w.postMessage(msg);
    }
  }
  _drop() { // forget every bitmap and ignore jobs still in the air (seek, resize)
    this.epoch++;
    for (const s of this.state.values()) { s.shown?.bitmap.close(); for (const e of s.early) e.bitmap.close(); s.shown = null; s.early = []; s.pending = 0; s.last = -1e9; }
  }

  // one exact frame at time t, every tile drawn for it; resolves when it is on the canvas (first frame, paused seek)
  async draw(t) {
    if (this.dead) return;
    const epoch = ++this.epoch, layers = new Map();
    const { tiles } = this.stage.frame(t);
    await Promise.all(tiles.map((tile) => new Promise((res) => this._send(tile, {}, (bitmap) => { layers.set(tile.key, { bitmap, x: tile.x, y: tile.y }); res(); }))));
    if (!this.dead && epoch === this.epoch) { this.stage.render(t, layers); this.opts.onFrame?.(t); }
    for (const L of layers.values()) L.bitmap.close();
  }

  play() {
    if (this.playing || this.dead) return;
    this.playing = true; this._drop();
    let last = performance.now(), lastShown = last;
    const tick = (now) => {
      if (!this.playing || this.dead) return;
      requestAnimationFrame(tick);
      if (!this.ready) return;
      this.clock += Math.min(0.1, (now - last) / 1000); last = now;
      const n = Math.round(this.clock * HZ);
      if (n === this.n && this.stats.frames) return; // a faster display: nothing new yet
      this.n = n;
      this.frameMs += (Math.min(100, now - lastShown) - this.frameMs) * 0.15; lastShown = now;
      this._frame(n);
    };
    requestAnimationFrame(tick);
  }
  pause() { this.playing = false; }
  seek(t) {
    this.n = Math.round((((t % DURATION) + DURATION) % DURATION) * HZ); this.clock = this.n / HZ;
    if (this.playing) this._drop(); else if (this.ready) return this.draw(this.t);
  }

  _frame(n) {
    const st = this.stage, t = tOf(n), loop = loopOf(n);
    // 1. bitmaps whose frame has come
    for (const s of this.state.values()) while (s.early.length && s.early[0].n <= n) { s.shown?.bitmap.close(); s.shown = s.early.shift(); }
    // 2. stack what we have for this camera
    const now = st.frame(t).tiles, layers = new Map();
    let exact = 0;
    for (const tile of now) {
      const s = this.state.get(tile.key).shown;
      if (!s || s.loop !== loop) continue;
      if (s.n === n) { layers.set(tile.key, s); exact++; continue; }
      const r = tile.scale / s.scale;
      layers.set(tile.key, { bitmap: s.bitmap, x: (s.x - s.cx) * r + tile.cx, y: (s.y - s.cy) * r + tile.cy, dw: s.w * r, dh: s.h * r });
    }
    st.render(t, layers);
    this.stats.frames++; this.stats.tileFrames += now.length; if (now.length && exact === now.length) this.stats.exact++;
    this.opts.onFrame?.(t);
    // 3. ask for the tiles of a frame a little ahead, most overdue and largest first
    // the graphics card rasterises every canvas in turn: too many tiles in the air and this thread's own
    // frames queue behind them, so the number in flight follows the measured frame time
    if (this.stats.frames % 8 === 0) {
      if (this.frameMs > 24) this.cap = Math.max(1, Math.floor(this.cap * 0.6));
      else if (this.frameMs > 18.4) this.cap = Math.max(1, this.cap - 1);
      else if (this.frameMs < 17.3 && this.stats.frames % 24 === 0 && this.cap < this.pool.length) this.cap++;
    }
    const target = n + this.lead, epoch = this.epoch;
    const next = st.frame(tOf(target)).tiles;
    next.sort((a, b) => (target - this.state.get(b.key).last) * b.w * b.h - (target - this.state.get(a.key).last) * a.w * a.h);
    for (const tile of next) {
      if (this.inFlight >= this.cap) break;
      const s = this.state.get(tile.key);
      if (s.pending >= 2 || s.last >= target) continue;
      s.pending++; s.last = target;
      this._send(tile, { n: target, sent: n, epoch }, (bitmap, job) => {
        if (job.epoch !== this.epoch) { bitmap.close(); return; }
        s.pending--; this.stats.updates++;
        this.lat += (this.n - job.sent + 1 - this.lat) * 0.06; // frames from asking to the first frame that can show it
        this.lead = Math.max(1, Math.min(8, Math.round(this.lat + 0.4)));
        const e = { bitmap, n: job.n, loop: loopOf(job.n), x: tile.x, y: tile.y, w: tile.w, h: tile.h, scale: tile.scale, cx: tile.cx, cy: tile.cy };
        let i = s.early.length; while (i > 0 && s.early[i - 1].n > e.n) i--;
        s.early.splice(i, 0, e);
        while (s.early.length > 4) s.early.shift().bitmap.close();
      });
    }
  }

  destroy() {
    this.dead = true; this.playing = false;
    for (const { w } of this.pool) w.terminate();
    this.pool = []; this.jobs.clear(); this.queue = [];
    for (const s of this.state.values()) { s.shown?.bitmap.close(); for (const e of s.early) e.bitmap.close(); }
    this.state.clear();
  }
}
