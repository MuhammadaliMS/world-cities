(async () => {
  await window.ready;
  const live = window.live, c = live.canvas, files = {}, res = {};
  const grab = () => { const g = document.createElement("canvas"); g.width = c.width; g.height = c.height; const x = g.getContext("2d", { willReadFrequently: true }); x.drawImage(c, 0, 0); return { g, d: x.getImageData(0, 0, g.width, g.height).data }; };
  for (const t of [2.5, 4, 9, 12, 24, 37.5, 39, 44, 50]) {
    live.seek(t - 1.2); if (!live.playing) live.play();
    await new Promise((r) => setTimeout(r, 1200));
    // freeze on the frame that is on screen now
    const tt = await new Promise((r) => { const prev = live.opts.onFrame; live.opts.onFrame = (x) => { live.opts.onFrame = prev; live.pause(); r(x); }; });
    const A = grab();
    await live.draw(tt);
    const B = grab();
    let sum = 0, big = 0; const n = A.d.length / 4;
    for (let i = 0; i < A.d.length; i += 4) { const d = Math.abs(A.d[i] - B.d[i]) + Math.abs(A.d[i + 1] - B.d[i + 1]) + Math.abs(A.d[i + 2] - B.d[i + 2]); sum += d; if (d > 90) big++; }
    res["t" + t] = { at: +tt.toFixed(2), meanDiff: +(sum / n / 3).toFixed(2), bigPct: +(100 * big / n).toFixed(2) };
    files[`play_${t}.jpg`] = A.g.toDataURL("image/jpeg", 0.9); files[`exact_${t}.jpg`] = B.g.toDataURL("image/jpeg", 0.9);
  }
  return { res, files };
})()
