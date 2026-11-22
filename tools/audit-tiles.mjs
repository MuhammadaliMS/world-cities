#!/usr/bin/env node
// Audit code tiles against the shared isometric grid.
//   node tools/audit-tiles.mjs <city|all>            every tile + out/audit/<city>_sheet.jpg
//   node tools/audit-tiles.mjs <city> <gx,gy>        one tile -> out/audit/<city>_<gx>_<gy>.jpg
// Numbers per tile:
//   offgrid%   projected points whose (u,v) is outside the 0..10 tile          (target <= 1)
//   farraw%    canvas path points drawn in raw screen space, far from any P()  (target <= 6)
//   sidespill% opaque pixels left/right of the footprint or below the slab     (target <= 0.5)
// The picture shows the tile with its TRUE footprint (diamond + slab) in magenta: nothing that
// stands on the ground may sit outside that diamond; only height may rise above it.
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const args = process.argv.slice(2);
const pos = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1] === "--t"));
const cityArg = pos[0] || "all";
const oneKey = pos[1];
const ti = args.indexOf("--t");
const T = ti >= 0 ? Number(args[ti + 1]) : 4;
const cities = cityArg === "all" ? ["paris", "london", "tokyo", "shanghai", "dubai"] : [cityArg];
const allKeys = ["-1,-1", "0,-1", "1,-1", "-1,0", "0,0", "1,0", "-1,1", "0,1", "1,1"];
const keys = oneKey ? [oneKey] : allKeys;
const types = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png" };
const server = createServer(async (req, res) => {
  try { const p = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname)); const b = await readFile(p); res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" }); res.end(b); }
  catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:${server.address().port}/trace.html?city=paris&tile=0,0&mode=code`);
await page.waitForFunction(() => typeof window.render === "function");
await mkdir(path.join(root, "out/audit"), { recursive: true });
const rows = [];
for (const city of cities) {
  for (const key of keys) {
    const file = key.replace(",", "_");
    const r = await page.evaluate(async ({ city, file, T }) => {
      const { Kit, CTS, P, AUDIT } = await import("/lib/vec-kit.js");
      let mod;
      try { mod = await import(`/vtiles/${city}/${file}.js?a=${Date.now()}`); } catch (e) { return { err: "import: " + e.message }; }
      const OX = 300, OY = 300, W = CTS.W + 600, H = CTS.H + 500;
      const c = document.createElement("canvas"); c.width = W; c.height = H;
      const g = c.getContext("2d");
      g.translate(OX, OY);
      // raw path points vs iso-projected anchors
      let raw = 0, far = 0;
      const FAR = 75;
      const check = (x, y) => {
        raw++;
        const m = g.getTransform();
        const dx = m.a * x + m.c * y + m.e - OX, dy = m.b * x + m.d * y + m.f - OY;
        const A = AUDIT.recent;
        for (let i = 0; i < A.length; i += 2) if (Math.abs(A[i] - dx) < FAR && Math.abs(A[i + 1] - dy) < FAR) return;
        far++;
      };
      const wrap = (fn, pick) => { const o = g[fn]; g[fn] = function (...a) { pick(a); return o.apply(this, a); }; };
      wrap("moveTo", (a) => check(a[0], a[1])); wrap("lineTo", (a) => check(a[0], a[1]));
      wrap("quadraticCurveTo", (a) => check(a[2], a[3])); wrap("bezierCurveTo", (a) => check(a[4], a[5]));
      wrap("arc", (a) => check(a[0], a[1])); wrap("ellipse", (a) => check(a[0], a[1]));
      wrap("rect", (a) => check(a[0], a[1])); wrap("fillRect", (a) => check(a[0], a[1])); wrap("strokeRect", (a) => check(a[0], a[1])); wrap("roundRect", (a) => check(a[0], a[1]));
      AUDIT.on = true; AUDIT.n = 0; AUDIT.out = 0; AUDIT.recent = [];
      try { const k = new Kit(g, T, { stage: true }); mod.default(k, T); k.flush(); } catch (e) { AUDIT.on = false; return { err: "draw: " + e.message }; }
      AUDIT.on = false;
      const pn = AUDIT.n, pout = AUDIT.out;
      g.setTransform(1, 0, 0, 1, 0, 0);
      const d = g.getImageData(0, 0, W, H).data;
      const m = 7, sd = CTS.SLAB;
      const L = P(0, 10, 0), R = P(10, 0, 0), B = P(10, 10, 0), Tp = P(0, 0, 0);
      const Lb = P(0, 10, -sd), Bb = P(10, 10, -sd), Rb = P(10, 0, -sd);
      const lowY = (x) => x <= Bb[0] ? Lb[1] + (Bb[1] - Lb[1]) * (x - Lb[0]) / (Bb[0] - Lb[0]) : Bb[1] + (Rb[1] - Bb[1]) * (x - Bb[0]) / (Rb[0] - Bb[0]);
      let opaque = 0, spill = 0;
      for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
        if (d[(y * W + x) * 4 + 3] > 128) { opaque++; const cx = x - OX, cy = y - OY; if (cx < L[0] - m || cx > R[0] + m || cy > lowY(cx) + m) spill++; }
      }
      g.translate(OX, OY);
      g.strokeStyle = "#ff00aa"; g.lineWidth = 3;
      g.beginPath(); g.moveTo(...Tp); g.lineTo(...R); g.lineTo(...B); g.lineTo(...L); g.closePath(); g.moveTo(...L); g.lineTo(...Lb); g.lineTo(...Bb); g.lineTo(...Rb); g.lineTo(...R); g.moveTo(...B); g.lineTo(...Bb); g.stroke();
      // faint u/v axes so orientation is easy to judge
      g.lineWidth = 1; g.strokeStyle = "rgba(255,0,170,0.45)"; g.beginPath();
      for (let i = 1; i < 10; i++) { g.moveTo(...P(i, 0)); g.lineTo(...P(i, 10)); g.moveTo(...P(0, i)); g.lineTo(...P(10, i)); }
      g.stroke();
      g.setTransform(1, 0, 0, 1, 0, 0);
      const o = document.createElement("canvas"); o.width = 700; o.height = Math.round(700 * H / W);
      const og = o.getContext("2d"); og.fillStyle = "#f5f0e5"; og.fillRect(0, 0, o.width, o.height); og.drawImage(c, 0, 0, o.width, o.height);
      return { off: +(100 * pout / Math.max(1, pn)).toFixed(1), far: +(100 * far / Math.max(1, raw)).toFixed(1), spill: +(100 * spill / Math.max(1, opaque)).toFixed(1), png: o.toDataURL("image/jpeg", 0.85) };
    }, { city, file, T });
    if (r.err) { rows.push(`${city} ${key}: ERROR ${r.err}`); continue; }
    await writeFile(path.join(root, `out/audit/${city}_${file}.jpg`), Buffer.from(r.png.split(",")[1], "base64"));
    const bad = [r.off > 1 ? "OFF-TILE" : "", r.far > 6 ? "SCREEN-SPACE" : "", r.spill > 0.5 ? "SIDE-SPILL" : ""].filter(Boolean).join(" ");
    rows.push(`${city} ${key.padEnd(6)} offgrid ${String(r.off).padStart(5)}%  farraw ${String(r.far).padStart(5)}%  sidespill ${String(r.spill).padStart(5)}%  ${bad ? "<< " + bad : "ok"}`);
  }
  if (!oneKey) {
    const ins = allKeys.flatMap((k) => ["-i", path.join(root, `out/audit/${city}_${k.replace(",", "_")}.jpg`)]);
    spawnSync("ffmpeg", ["-v", "error", "-y", ...ins, "-filter_complex", "[0][1][2]hstack=3[a];[3][4][5]hstack=3[b];[6][7][8]hstack=3[c];[a][b][c]vstack=3", path.join(root, `out/audit/${city}_sheet.jpg`)]);
  }
}
console.log(rows.join("\n"));
await browser.close(); server.close();
