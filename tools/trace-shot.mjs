#!/usr/bin/env node
// Screenshot the tracing page.
//   node tools/trace-shot.mjs paris 0,0 [--mode split|onion|ref|code|grid|codegrid] [--t 2] [--scale 1] [--crop x,y,w,h] [--out file.png]
//   node tools/trace-shot.mjs paris 0,0 --frames 0,0.5,1   -> one strip of code frames (motion check)
// Writes out/trace/<city>_<tile>_<mode>.png by default and prints the path.
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const [city, tile] = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--")));
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
if (!city || !tile) { console.error("usage: node tools/trace-shot.mjs <city> <gx,gy> [--mode split] [--t 2] [--scale 1] [--crop x,y,w,h] [--out f.png]"); process.exit(1); }
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg" };
const server = createServer(async (req, res) => {
  try { const u = new URL(req.url, "http://x"); const p = path.join(root, decodeURIComponent(u.pathname)); if (!p.startsWith(root)) throw 0; const body = await readFile(p); res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" }); res.end(body); }
  catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const mode = opt("mode", "split"), scale = opt("scale", "1"), crop = opt("crop"), frames = opt("frames");
const qs = new URLSearchParams({ city, tile, mode: frames ? "code" : mode, scale, t: opt("t", "2") });
if (crop) qs.set("crop", crop);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(m.text())); // a missing reference painting is fine
await page.goto(`http://127.0.0.1:${server.address().port}/trace.html?${qs}`);
await page.waitForFunction(() => typeof window.render === "function", null, { timeout: 15000 });
await page.evaluate(() => window.ready);
await mkdir(path.join(root, "out/trace"), { recursive: true });
const base = `${city}_${tile.replace(",", "_")}`;
const video = opt("video");
if (video) {
  // --video <seconds> : render the page at --fps into an mp4 (split/code/onion mode)
  const { spawn } = await import("node:child_process");
  const fps = Number(opt("fps", "30")), dur = Number(video);
  const out = opt("out", path.join(root, `out/trace/${base}_${mode}.mp4`));
  const el = await page.$("#c");
  const box = await el.boundingBox();
  await page.setViewportSize({ width: Math.ceil(box.width), height: Math.ceil(box.height) });
  const ff = spawn("ffmpeg", ["-y", "-v", "error", "-f", "image2pipe", "-framerate", String(fps), "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2", out], { stdio: ["pipe", "inherit", "inherit"] });
  for (let i = 0; i < Math.round(fps * dur); i++) {
    await page.evaluate((t) => window.render(t), i / fps);
    ff.stdin.write(await el.screenshot({ type: "jpeg", quality: 92 }));
  }
  ff.stdin.end(); await new Promise((r) => ff.on("close", r));
  console.log(out);
} else if (frames) {
  // render several times into one horizontal strip
  const ts = frames.split(",").map(Number);
  const out = opt("out", path.join(root, `out/trace/${base}_frames.png`));
  const dataUrls = [];
  for (const t of ts) { dataUrls.push(await page.evaluate((t) => { window.render(t); return document.getElementById("c").toDataURL(); }, t)); }
  const strip = await page.evaluate(async (urls) => {
    const imgs = await Promise.all(urls.map((u) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = u; })));
    const c = document.createElement("canvas"); c.width = imgs[0].width * imgs.length; c.height = imgs[0].height;
    const g = c.getContext("2d"); imgs.forEach((im, i) => g.drawImage(im, i * im.width, 0));
    return c.toDataURL();
  }, dataUrls);
  const { writeFile } = await import("node:fs/promises");
  await writeFile(out, Buffer.from(strip.split(",")[1], "base64"));
  console.log(out);
} else {
  const out = opt("out", path.join(root, `out/trace/${base}_${mode}.png`));
  await (await page.$("#c")).screenshot({ path: out });
  console.log(out);
}
if (errors.length) console.error("PAGE ERRORS:\n  " + errors.join("\n  "));
await browser.close(); server.close();
