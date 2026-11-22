(async () => {
  await window.ready;
  const live = window.live;
  const out = { workers: live.pool.length, size: [live.stage.width, live.stage.height] };
  for (const t of [3, 10, 24, 39, 48]) {
    live.seek(t);
    await new Promise((r) => setTimeout(r, 1500));
    const s0 = { ...live.stats }; let raf = 0, worst = 0, last = performance.now(); const a = last;
    await new Promise((res) => (function f(now) { raf++; worst = Math.max(worst, now - last); last = now; if (now - a < 2000) requestAnimationFrame(f); else res(); })(performance.now()));
    const fr = live.stats.frames - s0.frames;
    out["t" + t] = { rafFps: +(raf / 2).toFixed(0), frames: +(fr / 2).toFixed(0), exactPct: Math.round(100 * (live.stats.exact - s0.exact) / fr), tileUpdatesPerSec: Math.round((live.stats.updates - s0.updates) / 2), worstMs: +worst.toFixed(0), lead: live.lead, cap: live.cap };
  }
  return out;
})()
