(async () => {
  await window.ready;
  const live = window.live; live.pause();
  await new Promise((r) => setTimeout(r, 200));
  const st = live.stage, out = {};
  for (const t of [48, 10]) {
    const tileMs = {}; let wait = 0, main = 0, n = 0;
    const a0 = performance.now();
    while (performance.now() - a0 < 1500) {
      const { tiles } = st.frame(t + n / 30);
      const layers = new Map();
      const a = performance.now();
      await Promise.all(tiles.map((tile) => new Promise((res) => { const id = ++live.jobId; live.jobs.set(id, (d) => { layers.set(d.key, d); tileMs[d.key] = (tileMs[d.key] || 0) + d.ms; res(); }); live.queue.push({ type: "tile", id, ...tile }); })).concat([Promise.resolve().then(() => live._pump())]));
      const b = performance.now();
      st.render(t + n / 30, layers);
      const c = performance.now();
      for (const L of layers.values()) L.bitmap.close();
      await new Promise((r) => requestAnimationFrame(r));
      wait += b - a; main += c - b; n++;
    }
    for (const k in tileMs) tileMs[k] = +(tileMs[k] / n).toFixed(1);
    out["t" + t] = { frames: n, waitTiles: +(wait / n).toFixed(1), mainRender: +(main / n).toFixed(1), tileMs };
  }
  // main-thread parts
  const parts = {}; const ctx = st.ctx;
  const time = (name, fn) => { const a = performance.now(); for (let i = 0; i < 20; i++) fn(); parts[name] = +((performance.now() - a) / 20).toFixed(1); };
  time("renderNoTiles", () => st.render(48, new Map()));
  out.parts = parts;
  return out;
})()
