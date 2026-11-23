#!/usr/bin/env node
// Frame-accurate renderer for World Cities isometric animations.
// Usage:
//   node render.mjs paris                              -> out/paris.mp4 (1920x1080 @ 30fps, 52s)
//   node render.mjs paris --stills 0,1.5,3,6,8,15,48   -> out/stills/paris_<t>s.png
//   node render.mjs paris --contact                    -> out/stills/paris_contact.png (12-frame sheet)
//   node render.mjs paris --check                      -> determinism check
//   node render.mjs paris --fps 30 --duration 52 --size 1920x1080 --crf 16
//   node render.mjs paris --night 1                    -> out/paris-night.mp4
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";

const args = process.argv.slice(2);
const FLAGS = ["--check", "--contact", "--gif"];
const city = args.find((a) => !a.startsWith("--") && !isValueOf(a));
function isValueOf(a) {
  const i = args.indexOf(a);
  return i > 0 && args[i - 1].startsWith("--") && !FLAGS.includes(args[i - 1]);
}
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
if (!city) {
  console.error("Usage: node render.mjs <city> [--stills t1,t2] [--contact] [--check] [--fps 30] [--duration 52] [--size 1920x1080] [--out out/city.mp4] [--crf 16]");
  process.exit(1);
}

const root = process.cwd();
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
};

const server = createServer(async (req, res) => {
  try {
    if (req.url === "/favicon.ico") return res.writeHead(204).end();
    const u = new URL(req.url, "http://127.0.0.1");
    const p = path.join(root, decodeURIComponent(u.pathname));
    if (!p.startsWith(root)) throw new Error("outside root");
    const body = await readFile(p);
    res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});

await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;
const NIGHT = opt("night"); // --night 1: the city at night
const url = `http://127.0.0.1:${port}/city.html?city=${encodeURIComponent(city)}&clean=1${NIGHT ? `&night=${NIGHT}` : ""}`;

const [sw, sh] = (opt("size") || "1920x1080").split("x").map(Number);
const width = sw || 1920;
const height = sh || 1080;

const browser = await chromium.launch({
  args: ["--font-render-hinting=none", "--disable-gpu-vsync"],
}).catch(() => chromium.launch({ channel: "chrome", headless: true }));

const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
const tab = await ctx.newPage();
const errors = [];
tab.on("pageerror", (e) => errors.push(e.message));
tab.on("console", (m) => m.type() === "error" && !/404 \(Not Found\)/.test(m.text()) && errors.push(m.text()));

await tab.goto(url, { waitUntil: "networkidle" });
await tab.waitForFunction(() => typeof window.render === "function", null, { timeout: 15000 });
await tab.evaluate(() => window.ready);
if (errors.length) {
  console.error("Page errors:\n  " + errors.join("\n  "));
  await browser.close();
  server.close();
  process.exit(1);
}

const v = await tab.evaluate(() => window.VIDEO || {});
const fps = Number(opt("fps") || v.fps || 30);
const duration = Number(opt("duration") || v.duration || 52);

// Direct CDP screenshot is significantly faster and preserves exact lossless PNG quality.
const cdp = await ctx.newCDPSession(tab);
async function frameAt(t) {
  await tab.evaluate((time) => { window.render(time); }, t);
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true });
  return Buffer.from(data, "base64");
}

const hash = (b) => createHash("sha1").update(b).digest("hex").slice(0, 10);
const run = (cmd, a) => new Promise((res, rej) =>
  spawn(cmd, a, { stdio: ["ignore", "inherit", "inherit"] })
    .on("close", (c) => (c === 0 ? res() : rej(new Error(`${cmd} exited ${c}`)))));

if (args.includes("--check")) {
  const ts = [1.5, 12.0, 36.0, 48.0];
  const first = {};
  for (const t of ts) first[t] = hash(await frameAt(t));
  for (const t of [...ts].reverse()) { await frameAt(duration * 0.9); await frameAt(0); }
  let ok = true;
  for (const t of [...ts].reverse()) {
    const again = hash(await frameAt(t));
    const same = again === first[t];
    ok &&= same;
    console.log(`${city} t=${t}s  ${first[t]} vs ${again}  ${same ? "same" : "DIFFERENT"}`);
  }
  const blank = new Set(Object.values(first)).size === 1;
  if (blank) console.log("WARNING: all checkpoints identical");
  console.log(ok ? `PASS: ${city} deterministic` : `FAIL: ${city} non-deterministic`);
  await browser.close();
  server.close();
  process.exit(ok ? 0 : 1);
}

if (opt("stills")) {
  const dir = opt("out") || `out/stills`;
  await mkdir(dir, { recursive: true });
  for (const t of opt("stills").split(",").map(Number)) {
    const file = `${dir}/${city}_${t}s.png`;
    await writeFile(file, await frameAt(t));
    console.log(file);
  }
  await browser.close();
  server.close();
  process.exit(0);
}

if (args.includes("--contact")) {
  const dir = `out/stills`;
  await mkdir(dir, { recursive: true });
  const times = [0.1, 1.4, 2.8, 4.6, 8.0, 11.5, 15.0, 18.5, 22.0, 29.0, 36.2, 48.5];
  for (let i = 0; i < times.length; i++) {
    await writeFile(`${dir}/${city}_c_${String(i).padStart(2, "0")}.png`, await frameAt(times[i]));
  }
  const sheet = `${dir}/${city}_contact.png`;
  await run("ffmpeg", [
    "-y", "-loglevel", "error", "-framerate", "1",
    "-i", `${dir}/${city}_c_%02d.png`,
    "-vf", "scale=480:-1,tile=4x3", "-frames:v", "1", sheet
  ]);
  console.log(sheet);
  await browser.close();
  server.close();
  process.exit(0);
}

const out = opt("out") || `out/${city}${NIGHT ? "-night" : ""}.mp4`;
await mkdir(path.dirname(out), { recursive: true });
const ff = spawn("ffmpeg", [
  "-y", "-loglevel", "error",
  "-f", "image2pipe", "-vcodec", "png", "-framerate", String(fps), "-i", "-",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", opt("crf") || "16",
  "-preset", "medium", "-movflags", "+faststart", out
], { stdio: ["pipe", "inherit", "inherit"] });

const total = Math.round(fps * duration);
const t0 = Date.now();
for (let f = 0; f < total; f++) {
  const buf = await frameAt(f / fps);
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  if (f % (fps * 2) === 0 || f === total - 1) {
    const pct = (((f + 1) / total) * 100).toFixed(0);
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    process.stdout.write(`\r${city}: ${f + 1}/${total} (${pct}%) [${elapsed}s]`);
  }
}
ff.stdin.end();
await new Promise((r) => ff.on("close", r));
console.log(`\n${city}: DONE ${total} frames (${width}x${height}@${fps}fps) -> ${out} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
await browser.close();
server.close();
