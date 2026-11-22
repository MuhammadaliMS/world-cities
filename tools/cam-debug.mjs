import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const city = process.argv[2];
const types = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png" };
const server = createServer(async (req, res) => { try { const p = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname)); const b = await readFile(p); res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" }); res.end(b); } catch { res.writeHead(404).end(); } });
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const b = await chromium.launch(); const pg = await b.newPage();
await pg.goto(`http://127.0.0.1:${server.address().port}/city.html?city=${city}&clean=1`);
await pg.waitForFunction(() => typeof window.render === "function"); await pg.evaluate(() => window.ready);
const out = await pg.evaluate(() => {
  const rows = [];
  for (const t of [8.7, 12.5, 16.3, 20.1, 23.9, 27.7, 31.5, 35.3, 37.8, 40.6, 44, 50]) { window.render(t); const c = window.__cam; rows.push(`${t}: fx ${c.fx.toFixed(1)} fy ${c.fy.toFixed(1)} zoom ${c.zoom.toFixed(2)} ${c.label}`); }
  return { rows, ov: [...window.__boxes.entries()].map(([k, v]) => k + " " + JSON.stringify(v)) };
});
console.log(out.rows.join("\n")); console.log(out.ov.join("\n"));
await b.close(); server.close();
