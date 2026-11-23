(async () => {
  await window.ready;
  const live = window.live; live.pause();
  const { WorldStage } = await import("./lib/world-stage.js");
  const c2 = document.createElement("canvas"); c2.width = live.stage.width; c2.height = live.stage.height;
  const ref = new WorldStage(c2, live.city); await ref.loadAssets(); ref.night = live.stage.night || 0; ref.background = live.stage.background;
  const W = c2.width, H = c2.height, res = {}, files = {};
  const px = (c) => { const g = document.createElement("canvas"); g.width = W; g.height = H; const x = g.getContext("2d", { willReadFrequently: true }); x.drawImage(c, 0, 0); return { g, d: x.getImageData(0, 0, W, H).data }; };
  for (const t of [1.5, 3.2, 5, 8, 12, 16, 20, 24, 28, 32, 36, 39, 42, 46, 51]) {
    await live.draw(t); ref.render(t);
    const A = px(live.canvas), B = px(c2);
    let big = 0, x0 = W, x1 = 0, y0 = H, y1 = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; const d = Math.abs(A.d[i] - B.d[i]) + Math.abs(A.d[i + 1] - B.d[i + 1]) + Math.abs(A.d[i + 2] - B.d[i + 2]); if (d > 60) { big++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
    // densest 48 px block of differing pixels: a clipped or missing object shows up as a cluster
    const BS = 48, cells = new Map();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (Math.abs(A.d[i] - B.d[i]) + Math.abs(A.d[i + 1] - B.d[i + 1]) + Math.abs(A.d[i + 2] - B.d[i + 2]) > 60) { const k = (x / BS | 0) + "," + (y / BS | 0); cells.set(k, (cells.get(k) || 0) + 1); } }
    let top = ["", 0]; for (const e of cells) if (e[1] > top[1]) top = e;
    if (top[1] > 60) {
      const [bx, by] = top[0].split(",").map(Number);
      res["t" + t] = { big, cluster: top[1], at: [bx * BS, by * BS] };
      const crop = (c) => { const g = document.createElement("canvas"); g.width = 480; g.height = 480; const x = g.getContext("2d"); x.imageSmoothingEnabled = false; x.drawImage(c, bx * BS - 36, by * BS - 36, 120, 120, 0, 0, 480, 480); return g; };
      const pair = document.createElement("canvas"); pair.width = 970; pair.height = 480; const pc = pair.getContext("2d"); pc.drawImage(crop(A.g), 0, 0); pc.drawImage(crop(B.g), 490, 0);
      files[`parity_${live.cityId}_${t}.png`] = pair.toDataURL("image/png");
    }
  }
  return { city: live.cityId, mismatches: res, files };
})()
