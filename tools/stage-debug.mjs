import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const city = process.argv[2];
const types = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png" };
const server = createServer(async (req, res) => { try { const p = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname)); const b = await readFile(p); res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" }); res.end(b); } catch { res.writeHead(404).end(); } });
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs = []; pg.on("pageerror", (e) => errs.push("PAGEERR " + e.message)); pg.on("console", (m) => m.type() === "error" && !/404/.test(m.text()) && errs.push("CONSOLE " + m.text()));
await pg.goto(`http://127.0.0.1:${server.address().port}/city.html?city=${city}&clean=1`);
await pg.waitForFunction(() => typeof window.render === "function"); await pg.evaluate(() => window.ready);
const info = await pg.evaluate(() => ({ vec: window.__stage ? [...window.__stage.vecTiles.keys()] : null }));
for (const t of [2, 10, 25, 40]) { const r = await pg.evaluate((t) => { try { window.render(t); return "ok"; } catch (e) { return "THROW " + e.message + " | " + (e.stack || "").split("\n").slice(0, 3).join(" / "); } }, t); console.log(t, r); }
console.log(errs.slice(0, 5).join("\n"));
await b.close(); server.close();
