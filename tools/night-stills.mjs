// Night stills of whole cities: node tools/night-stills.mjs [city...] [--t 48] [--n 1] [--w 1920]
//   -> out/night/<city>_<t>_<n>.jpg   (draws on the main thread, same code as the film)
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf("--" + k); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const T = opt("t", "48"), N = opt("n", "1"), Wd = +opt("w", 1920);
const cities = args.length ? args : ["tokyo", "paris", "london", "shanghai", "dubai"];
const server = createServer(async (req, res) => { try { const p = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname)); const b = await readFile(p); res.writeHead(200, { "content-type": p.endsWith(".js") ? "text/javascript" : "text/html" }); res.end(b); } catch { res.writeHead(404).end(); } });
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const b = await chromium.launch({ channel: "chrome", headless: true, args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
pg.on("pageerror", (e) => console.log("pageerror:", e.message));
await mkdir(path.join(root, "out/night"), { recursive: true });
for (const c of cities) for (const t of T.split(",")) {
  const a = Date.now();
  await pg.goto(`http://127.0.0.1:${server.address().port}/city.html?city=${c}&t=${t}&night=${N}`);
  await pg.evaluate(() => window.ready);
  await pg.addStyleTag({ content: "#hud{display:none}" });
  const f = path.join(root, `out/night/${c}_${t}_${N}.jpg`);
  await pg.screenshot({ path: f, type: "jpeg", quality: 88, scale: "css" });
  console.log(f, Date.now() - a, "ms");
}
await b.close(); server.close();
