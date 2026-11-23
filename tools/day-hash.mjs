// Fingerprint every tile by day, to prove a night-mode change left the day picture alone.
//   node tools/day-hash.mjs save  [city...]   -> out/night/day-hashes.json
//   node tools/day-hash.mjs check [city...]   -> lists tiles whose day picture changed
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const [mode = "check", ...cs] = process.argv.slice(2);
const cities = cs.length ? cs : ["tokyo", "paris", "london", "shanghai", "dubai"];
const keys = ["-1,-1", "0,-1", "1,-1", "-1,0", "0,0", "1,0", "-1,1", "0,1", "1,1"];
const server = createServer(async (req, res) => { try { const p = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname)); const b = await readFile(p); res.writeHead(200, { "content-type": p.endsWith(".js") ? "text/javascript" : p.endsWith(".png") ? "image/png" : p.endsWith(".json") ? "application/json" : "text/html" }); res.end(b); } catch { res.writeHead(404).end(); } });
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1024, height: 1024 } });
const file = path.join(root, "out/night/day-hashes.json");
const old = mode === "check" ? JSON.parse(await readFile(file, "utf8")) : {};
const now = mode === "save" ? { ...(await readFile(file, "utf8").then(JSON.parse).catch(() => ({}))) } : {};
const changed = [];
for (const c of cities) for (const k of keys) {
  const hs = [];
  for (const t of [3, 17]) {
    await pg.goto(`http://127.0.0.1:${server.address().port}/trace.html?city=${c}&tile=${k}&mode=code&t=${t}&v=${Date.now()}`);
    await pg.waitForFunction(() => typeof window.render === "function", null, { timeout: 20000 });
    await pg.evaluate(() => window.ready);
    const px = await pg.evaluate(() => document.getElementById("c").toDataURL("image/png"));
    hs.push(createHash("md5").update(px).digest("hex").slice(0, 12));
  }
  const h = hs.join("-"), id = `${c} ${k}`;
  if (mode === "save") now[id] = h; else if (old[id] && old[id] !== h) changed.push(id);
}
if (mode === "save") { await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, JSON.stringify(now, null, 1)); console.log("saved", Object.keys(now).length); }
else console.log(changed.length ? "DAY CHANGED: " + changed.join(", ") : "day unchanged for all checked tiles");
await b.close(); server.close();
