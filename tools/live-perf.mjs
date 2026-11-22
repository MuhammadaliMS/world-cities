// Real-GPU frame-rate check of a live page: node tools/live-perf.mjs <path?query> [--expr "<js returning a promise>"]
// Launches Chrome (new headless, Metal) so requestAnimationFrame runs at display rate, unlike the in-app browser pane.
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const args = process.argv.slice(2);
const page = args[0] || "city.html?city=tokyo";
const ei = args.indexOf("--expr");
const rootDir = args.includes("--root") ? path.resolve(args[args.indexOf("--root") + 1]) : root;
const types = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".mp4": "video/mp4", ".css": "text/css" };
const server = createServer(async (req, res) => {
  try {
    let p = path.join(rootDir, decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (p.endsWith("/")) p += "index.html";
    const b = await readFile(p);
    res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" }); res.end(b);
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const b = await chromium.launch({ channel: "chrome", headless: true, args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-gpu-rasterization"] });
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
const pg = await ctx.newPage();
pg.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log(`console ${m.type()}:`, m.text(), m.location()?.url || ""); });
pg.on("requestfailed", (r) => console.log("request failed:", r.url()));
pg.on("response", (r) => { if (r.status() >= 400) console.log(r.status(), r.url()); });
pg.on("pageerror", (e) => console.log("page error:", e.message));
await pg.goto(`http://127.0.0.1:${server.address().port}/${page}`);
const gpu = await pg.evaluate(() => { const g = document.createElement("canvas").getContext("webgl"); const e = g && g.getExtension("WEBGL_debug_renderer_info"); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : "no webgl"; });
console.log("gpu:", gpu);
const defaultExpr = `(async () => {
  await window.ready;
  const fps = (ms, each) => new Promise((r) => { let n = 0; const a = performance.now(); (function f() { each && each(n); n++; if (performance.now() - a < ms) requestAnimationFrame(f); else r(+(n / (ms / 1000)).toFixed(1)); })(); });
  document.getElementById("playBtn").click();
  const out = { idle: await fps(1000) };
  for (const t of [3, 10, 24, 39, 48]) out["t" + t] = await fps(2000, (n) => window.render(t + n / 30));
  return out;
})()`;
const out = await pg.evaluate(ei >= 0 ? args[ei + 1] : defaultExpr);
if (out && out.files) { const { writeFile, mkdir } = await import("node:fs/promises"); await mkdir(path.join(root, "out/live"), { recursive: true }); for (const [name, url] of Object.entries(out.files)) await writeFile(path.join(root, "out/live", name), Buffer.from(url.split(",")[1], "base64")); delete out.files; }
console.log(JSON.stringify(out));
await b.close(); server.close();
