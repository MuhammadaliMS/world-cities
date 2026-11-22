// Shared World Cities Stage — v4 Hybrid Illustrated-Diorama + Live Animation Engine
// - Seamlessly composites 1024px+ hand-inked watercolor illustrated tiles onto exact 30° 3x3 grid
// - True ink-sketch-to-watercolor cascade build-in (0.0 -> 6.4s) matching the SF reference
// - Live watercolor road network, sculpted 3-volume traffic, cyclists, pedestrians & per-tile FX
// - Smooth 52-second editorial cinematic camera tour

import {
  PALETTE,
  ISO,
  IsoPen,
  createPaperTexture,
  getWatercolorWash,
  project,
  clamp,
  lerp,
  smoothstep,
  easeInOutCubic,
  easeOutBack,
  rng,
} from "./iso-engine.js";
import { CTS } from "./vec-kit.js";
import { drawGround, buildEntities } from "./city-base.js";
import { measureTile, drawVectorTile } from "./vec-tile.js";
import {
  drawAnimatedWater,
  drawRotators,
  drawGliders,
  drawTileLivingFX,
} from "./tile-motion.js";

export const TILE_SIZE = 10;
export const ROAD_W = 2.4;
export const PITCH = TILE_SIZE + ROAD_W; // 12.4
export const BASE_SCALE = 19.2;
export const SAT_SIZE = 4.8;
export const DURATION = 52;
export const FPS = 30;

export function tileOrigin(gx, gy) {
  return [gx * PITCH - TILE_SIZE * 0.5, gy * PITCH - TILE_SIZE * 0.5];
}

export const SATELLITE_SLOTS = {
  nw: { ox: -25.8, oy: -0.6, depth: -22.0, revealAt: 4.35 },
  ne: { ox: -0.6, oy: -25.8, depth: -22.0, revealAt: 4.65 },
  sw: { ox: -3.2, oy: 21.4, depth: 23.0, revealAt: 4.95 },
  se: { ox: 21.4, oy: -3.2, depth: 23.0, revealAt: 5.20 },
};

const TILE_REVEAL_AT = {
  "0,0": -2.0,
  "-1,-1": 0.35,
  "1,-1": 0.85,
  "-1,1": 1.35,
  "1,1": 1.85,
  "0,-1": 2.35,
  "1,0": 2.85,
  "0,1": 3.35,
  "-1,0": 3.85,
};
const REVEAL_DUR = 1.15;

const TOUR_ORDER = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
];

// Camera framing is automatic: each code tile is measured once (measureTile) and the close-up is
// fitted to its real silhouette, so tall landmarks keep their tops and low tiles fill the frame.
// boxes: Map key -> { top, bottom } in canonical tile px (y of the highest content row / slab bottom).
const K = BASE_SCALE / CTS.S;            // canonical tile px -> stage px at zoom 1 (1920 wide)
const VIEW_H = 1080;                     // stage px at zoom 1
function tileAnchor(gx, gy) { const [ox, oy] = tileOrigin(gx, gy); return project(ox, oy, 0, BASE_SCALE, 0, 0); }
function fitShot(city, gx, gy, localT, boxes) {
  const tileCfg = city.tiles[`${gx},${gy}`];
  const bx = boxes?.get(`${gx},${gy}`) || { top: CTS.Y0 - 3 * CTS.S, bottom: CTS.Y0 + 10 * CTS.S * 1.154 + 20 };
  const [ax, ay] = tileAnchor(gx, gy);
  const hPx = (bx.bottom - bx.top) * K, wPx = 20 * CTS.S * K;
  const zoom = clamp(Math.min((VIEW_H * 0.9) / hPx, (1920 * 0.8) / wPx), 1.6, 4.0);
  const cy = ay + ((bx.top + bx.bottom) / 2 - CTS.Y0) * K;
  return { fx: ax + lerp(-12, 12, localT), fy: cy + lerp(4, -4, localT), zoom: lerp(zoom, zoom * 1.05, localT), label: tileCfg?.name || city.name };
}
function glide(a, b, p) {
  const e = easeInOutCubic(clamp(p));
  const dip = 1 - 0.22 * Math.sin(Math.PI * e); // pull out a little mid-move
  return { fx: lerp(a.fx, b.fx, e), fy: lerp(a.fy, b.fy, e), zoom: lerp(a.zoom, b.zoom, e) * dip, label: b.label };
}

export const TIMELINE = { build: 6.4, seg: 3.8, glideDur: 0.85 };
export function getCamera(t, city, baseCx, baseCy, camOverrides) {
  const { build, seg, glideDur } = TIMELINE;
  const OV = 0.92; // whole plate in frame
  const overview = { fx: 0, fy: 0, zoom: OV, label: city.name };
  // 0 -> 6.4 s: the city assembles
  if (t < build) {
    const settle = easeInOutCubic(clamp(t / 1.2));
    return { fx: 0, fy: lerp(18, 0, settle), zoom: lerp(OV + 0.06, OV, settle), label: city.name };
  }
  // 6.4 -> 36.8 s: 8 tile close-ups, gliding between them
  const tourEnd = build + seg * TOUR_ORDER.length;
  if (t < tourEnd) {
    const idx = Math.min(TOUR_ORDER.length - 1, Math.floor((t - build) / seg));
    const lt = t - build - idx * seg;
    const [gx, gy] = TOUR_ORDER[idx];
    const cur = fitShot(city, gx, gy, lt / seg, camOverrides);
    if (lt < glideDur) {
      const prev = idx === 0 ? overview : fitShot(city, ...TOUR_ORDER[idx - 1], 1, camOverrides);
      return glide(prev, cur, lt / glideDur);
    }
    return cur;
  }
  // centre landmark: glide in, tilt up from the people at its base to its top, then pull back
  const hb = camOverrides?.get("0,0") || { top: CTS.Y0 - 6 * CTS.S, bottom: CTS.Y0 + 10 * CTS.S * 1.154 + 20 };
  const [hax, hay] = tileAnchor(0, 0);
  const heroName = city.tiles["0,0"]?.name || city.name;
  const TZ = 3.5, half = (VIEW_H / 2) / TZ / K * 0.86; // visible half-height in tile px at the tilt zoom
  let y0 = hb.bottom - half, y1 = hb.top + half;        // start framing the ground, end framing the top
  if (y1 > y0) y0 = y1 = (hb.top + hb.bottom) / 2;      // the whole landmark already fits
  const tiltStart = tourEnd, tiltEnd = tiltStart + 4.2;
  const tiltShot = (p) => ({ fx: hax, fy: hay + (lerp(y0, y1, easeInOutCubic(p)) - CTS.Y0) * K, zoom: TZ, label: heroName });
  if (t < tiltEnd) {
    const lt = t - tiltStart;
    if (lt < glideDur) return glide(fitShot(city, ...TOUR_ORDER[TOUR_ORDER.length - 1], 1, camOverrides), tiltShot(0), lt / glideDur);
    return tiltShot(clamp((lt - glideDur) / (4.2 - glideDur)));
  }
  const medEnd = tiltEnd + 3.6, fullEnd = medEnd + 4.4;
  const med = fitShot(city, 0, 0, 0.5, camOverrides);
  if (t < medEnd) return glide(tiltShot(1), med, (t - tiltEnd) / 3.6);
  if (t < fullEnd) { const p = easeInOutCubic((t - medEnd) / 4.4); return { fx: lerp(med.fx, 0, p), fy: lerp(med.fy, 0, p), zoom: lerp(med.zoom, OV, p), label: city.name }; }
  // finale: a slow push-in on the living city (no dead hold)
  const p = smoothstep(clamp((t - fullEnd) / 3.0));
  return { fx: 0, fy: lerp(0, 10, p), zoom: lerp(OV, OV + 0.08, p), label: city.name };
}

function drawRoadNetwork(ctx, cx, cy, scale, city, t) {
  const halfSpan = 20.6;
  const roadCenters = [-6.2, 6.2];
  const halfW = ROAD_W * 0.5;
  const swW = 0.34;
  const wash = getWatercolorWash(ctx);

  const quad = (coords, fill, withWash = false) => {
    const pts = coords.map((c) => project(c[0], c[1], 0, scale, cx, cy));
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (withWash) {
      ctx.save();
      ctx.globalAlpha = 0.65;
      ctx.fillStyle = wash;
      ctx.fill();
      ctx.restore();
    }
  };

  const drawStrip = (axis, center) => {
    const pStart = project(axis === "u" ? -halfSpan : center, axis === "u" ? center : -halfSpan, 0, scale, cx, cy);
    const pEnd = project(axis === "u" ? halfSpan : center, axis === "u" ? center : halfSpan, 0, scale, cx, cy);

    const makeGrad = (colHex) => {
      const g = ctx.createLinearGradient(pStart[0], pStart[1], pEnd[0], pEnd[1]);
      g.addColorStop(0, "rgba(245,240,229,0)");
      g.addColorStop(0.11, colHex);
      g.addColorStop(0.89, colHex);
      g.addColorStop(1, "rgba(245,240,229,0)");
      return g;
    };

    const swGrad = makeGrad(PALETTE.sidewalk);
    const rdGrad = makeGrad(city.roadColor || PALETTE.road);

    if (axis === "u") {
      quad([[-halfSpan, center - halfW], [halfSpan, center - halfW], [halfSpan, center + halfW], [-halfSpan, center + halfW]], swGrad, false);
      quad([[-halfSpan, center - halfW + swW], [halfSpan, center - halfW + swW], [halfSpan, center + halfW - swW], [-halfSpan, center + halfW - swW]], rdGrad, true);
    } else {
      quad([[center - halfW, -halfSpan], [center + halfW, -halfSpan], [center + halfW, halfSpan], [center - halfW, halfSpan]], swGrad, false);
      quad([[center - halfW + swW, -halfSpan], [center + halfW - swW, -halfSpan], [center + halfW - swW, halfSpan], [center - halfW + swW, halfSpan]], rdGrad, true);
    }
  };

  for (const c of roadCenters) drawStrip("u", c);
  for (const c of roadCenters) drawStrip("v", c);

  // Subtle painted ink curbs
  const edgeSpan = 17.6;
  ctx.strokeStyle = "rgba(42,35,29,0.46)";
  ctx.lineWidth = 0.85;
  const lineW = (u1, v1, u2, v2) => {
    const a = project(u1, v1, 0, scale, cx, cy);
    const b = project(u2, v2, 0, scale, cx, cy);
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  };
  for (const c of roadCenters) {
    for (const s of [-1, 1]) {
      const off = c + s * (halfW - swW);
      lineW(-edgeSpan, off, -7.4, off);
      lineW(-5.0, off, 5.0, off);
      lineW(7.4, off, edgeSpan, off);
      lineW(off, -edgeSpan, off, -7.4);
      lineW(off, -5.0, off, 5.0);
      lineW(off, 7.4, off, edgeSpan);
    }
  }

  // Warm golden-yellow center lane dashes (like the SF reference!)
  ctx.strokeStyle = "rgba(222, 186, 86, 0.78)";
  ctx.lineWidth = 1.2;
  ctx.setLineDash([7, 9]);
  for (const c of roadCenters) {
    lineW(-edgeSpan, c, -7.5, c);
    lineW(-4.8, c, 4.8, c);
    lineW(7.5, c, edgeSpan, c);
    lineW(c, -edgeSpan, c, -7.5);
    lineW(c, -4.8, c, 4.8);
    lineW(c, 7.5, c, edgeSpan);
  }
  ctx.setLineDash([]);

  // Crisp ivory crosswalk bars at the 4 intersections
  ctx.strokeStyle = "rgba(252,248,240,0.88)";
  ctx.lineWidth = 1.75;
  for (const cu of roadCenters) {
    for (const cv of roadCenters) {
      for (const s of [-1, 1]) {
        for (let k = -3; k <= 3; k++) {
          const d = k * 0.22;
          lineW(cu + s * 1.15, cv + d, cu + s * 1.5, cv + d);
          lineW(cu + d, cv + s * 1.15, cu + d, cv + s * 1.5);
        }
      }
    }
  }
}

function buildTrafficEntities(city, t) {
  const entities = [];
  const fleet = city.vehicles || [
    { style: "sedan", color: "#c95b4b" },
    { style: "sedan", color: "#5f859c" },
    { style: "taxi", color: "#e0b84c" },
    { style: "sedan", color: "#7f9e73" },
    { style: "sedan", color: "#d7ccb8" },
  ];
  const r = rng(city.seed || 42);
  const roadCenters = [-6.2, 6.2];
  const span = 38.4;

  // 32 lively sculpted vehicles across all 4 avenues
  for (const axis of ["u", "v"]) {
    for (const rc of roadCenters) {
      for (const dir of [-1, 1]) {
        const laneOff = dir * 0.42;
        const count = 4;
        for (let i = 0; i < count; i++) {
          const spec = fleet[Math.floor(r() * fleet.length)];
          const speed = 1.65 + r() * 0.9;
          const phase = (i / count + r() * 0.18) * span;
          const pos = (((phase + dir * t * speed) % span) + span) % span - span * 0.5;
          const u = axis === "u" ? pos : rc + laneOff;
          const v = axis === "u" ? rc - laneOff : pos;
          const fade = clamp((18.8 - Math.abs(pos)) / 2.2);
          if (fade > 0.05) {
            entities.push({
              kind: "vehicle",
              depth: u + v,
              u,
              v,
              axis,
              style: spec.style,
              color: spec.color,
              fade,
            });
          }
        }
      }
    }
  }

  // 8 animated cyclists cruising along bike lanes!
  for (const axis of ["u", "v"]) {
    for (const rc of roadCenters) {
      for (let i = 0; i < 2; i++) {
        const dir = i % 2 === 0 ? 1 : -1;
        const laneOff = dir * 0.82;
        const speed = 1.05 + r() * 0.35;
        const phase = r() * 34;
        const pos = (((phase + dir * t * speed) % 34) + 34) % 34 - 17;
        const u = axis === "u" ? pos : rc + laneOff;
        const v = axis === "u" ? rc - laneOff : pos;
        entities.push({
          kind: "cyclist",
          depth: u + v,
          u,
          v,
          axis,
          dir,
          shirt: ["#c85a49", "#4f748c", "#d9a94e", "#6d8c63"][Math.floor(r() * 4)],
          seed: i * 19 + rc,
        });
      }
    }
  }

  // 48 strolling pedestrians + dogs along sidewalks
  const coats = city.coats || ["#c95a49", "#4f748c", "#d9a94e", "#6d8c63", "#7e6387", "#3d4652", "#d87f68"];
  for (const axis of ["u", "v"]) {
    for (const rc of roadCenters) {
      for (const side of [-1, 1]) {
        const swOff = side * 1.05;
        for (let i = 0; i < 6; i++) {
          const dir = r() > 0.5 ? 1 : -1;
          const speed = 0.45 + r() * 0.3;
          const phase = r() * 34;
          const pos = (((phase + dir * t * speed) % 34) + 34) % 34 - 17;
          const u = axis === "u" ? pos : rc + swOff;
          const v = axis === "u" ? rc + swOff : pos;
          entities.push({
            kind: "person",
            depth: u + v,
            u,
            v,
            shirt: coats[Math.floor(r() * coats.length)],
            seed: i * 17 + rc * 3 + side,
          });
        }
      }
    }
  }

  // Street lamps & traffic signal poles
  for (const rc of roadCenters) {
    for (const p of [-11.8, -3.2, 3.2, 11.8]) {
      entities.push({ kind: "lamp", depth: p + (rc - 1.08), u: p, v: rc - 1.08 });
      entities.push({ kind: "lamp", depth: (rc - 1.08) + p, u: rc - 1.08, v: p });
    }
    for (const rc2 of roadCenters) {
      entities.push({ kind: "signal", depth: (rc + 1.06) + (rc2 + 1.06), u: rc + 1.06, v: rc2 + 1.06 });
    }
  }

  return entities;
}

function drawRoadEntity(ctx, cx, cy, scale, e, t) {
  const pen = new IsoPen(ctx, { scale, ox: 0, oy: 0, cx, cy, t, reveal: 1, inkWidth: 0.78 });
  if (e.kind === "vehicle") {
    ctx.save();
    ctx.globalAlpha = e.fade;
    pen.vehicle(e.u, e.v, 0, { axis: e.axis, style: e.style, color: e.color });
    ctx.restore();
  } else if (e.kind === "cyclist") {
    pen.cyclist(e.u, e.v, 0, { axis: e.axis, dir: e.dir, shirt: e.shirt, seed: e.seed });
  } else if (e.kind === "person") {
    pen.person(e.u, e.v, 0, { shirt: e.shirt, walk: true, seed: e.seed, scale: 0.52, dress: e.seed % 3 === 0 });
    if (e.seed % 7 === 0) {
      pen.dog(e.u + 0.3, e.v + 0.12, 0, "#b88456", e.seed);
    }
  } else if (e.kind === "lamp") {
    pen.lamp(e.u, e.v, 0, "classic");
  } else if (e.kind === "signal") {
    pen.line([e.u, e.v, 0], [e.u, e.v, 0.92], "#35393e", 0.78);
    pen.box(e.u - 0.07, e.v - 0.07, 0.68, 0.14, 0.14, 0.28, "#35393e", { shadow: false, noPlinth: true, lw: 0.45 });
    const green = Math.floor(t * 0.45) % 2 === 0;
    pen.sphere(e.u + 0.05, e.v + 0.05, green ? 0.75 : 0.9, 0.045, green ? "#6ec472" : "#e05246", { lw: 0.25 });
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Render an illustrated diorama tile with exact diamond alignment + true ink-to-watercolor reveal
// + FULL v5 LIVING MOTION (flowing water, spinning windmill/Ferris wheels, gliding boats/trains, walking people & FX)!
function drawIllustratedTile(ctx, cityId, gridKey, asset, ox, oy, cx, cy, scale, rev, t) {
  const { meta, img, baseImg, inkImg, motion } = asset;
  const paintImg = baseImg || img;
  // Exact bottom tip of this tile's isometric diamond slab
  const [destBx, destBy] = project(ox + TILE_SIZE, oy + TILE_SIZE, -0.46, scale, cx, cy);
  const destSpan = 2 * TILE_SIZE * scale * ISO.xScale;
  const imgScale = destSpan / meta.span;
  const drawW = meta.w * imgScale;
  const drawH = meta.h * imgScale;
  const drawX = destBx - meta.bx * imgScale;
  const drawY = destBy - meta.by * imgScale;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (rev >= 0.999) {
    ctx.drawImage(paintImg, drawX, drawY, drawW, drawH);
    if (motion) {
      if (motion.waterImg) {
        drawAnimatedWater(ctx, motion.waterImg, drawX, drawY, drawW, drawH, motion.waterFlow, t);
      }
      if (motion.gliders?.length) {
        drawGliders(ctx, motion.gliders, drawX, drawY, imgScale, t);
      }
      if (motion.rotators?.length) {
        drawRotators(ctx, motion.rotators, drawX, drawY, imgScale, t);
      }
    }
    drawTileLivingFX(ctx, cityId, gridKey, drawX, drawY, imgScale, t);
    ctx.restore();
    return;
  }

  // Phase 1 (0.0 -> 0.52): Crisp charcoal hand-inked drawing wipes diagonally onto paper!
  const inkP = easeInOutCubic(clamp(rev / 0.52, 0, 1));
  // Phase 2 (0.42 -> 1.00): Lush watercolor/gouache washes bloom smoothly over the ink lines!
  const colP = smoothstep(clamp((rev - 0.42) / 0.58, 0, 1));

  if (inkP > 0.001 && inkImg) {
    ctx.save();
    const clipH = drawH * lerp(0.05, 1.05, inkP);
    ctx.beginPath();
    ctx.rect(drawX - 4, drawY + drawH - clipH, drawW + 8, clipH + 8);
    ctx.clip();
    ctx.globalAlpha = clamp(inkP * 1.4, 0, 1);
    ctx.drawImage(inkImg, drawX, drawY, drawW, drawH);
    ctx.restore();
  }

  if (colP > 0.001) {
    ctx.save();
    const rad = Math.max(drawW, drawH) * lerp(0.15, 1.3, colP);
    ctx.beginPath();
    ctx.arc(destBx, destBy - drawH * 0.22, rad, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalAlpha = smoothstep(clamp(colP * 1.25, 0, 1));
    ctx.drawImage(paintImg, drawX, drawY, drawW, drawH);
    if (colP > 0.65 && motion) {
      if (motion.waterImg) drawAnimatedWater(ctx, motion.waterImg, drawX, drawY, drawW, drawH, motion.waterFlow, t);
      if (motion.gliders?.length) drawGliders(ctx, motion.gliders, drawX, drawY, imgScale, t);
      if (motion.rotators?.length) drawRotators(ctx, motion.rotators, drawX, drawY, imgScale, t);
    }
    ctx.restore();
  }

  ctx.restore();
}

export class WorldStage {
  constructor(canvas, city) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.city = city;
    this.paper = createPaperTexture(canvas.width, canvas.height);
    this.width = canvas.width;
    this.height = canvas.height;
    this.cameraOverride = null;
    this.tileAssets = new Map();
    this.vecTiles = new Map();
    this.camOverrides = new Map();
  }

  async loadAssets() {
    // v7 code-drawn tiles take priority over painted ones
    await Promise.all(Object.keys(this.city.tiles || {}).map(async (key) => {
      const file = key.replace(",", "_");
      try {
        const mod = await import(`../vtiles/${this.city.id}/${file}.js`);
        if (mod?.default) { this.vecTiles.set(key, mod.default); this.camOverrides.set(key, measureTile(mod.default)); }
      } catch {}
    }));
    if (this.vecTiles.size >= 9) return; // every tile is code-drawn: no painted assets needed
    try {
      const resp = await fetch(`./assets/${this.city.id}/manifest.json`, { cache: "no-store" });
      if (!resp.ok) return;
      const manifest = await resp.json();
      let motionMap = {};
      try {
        const mr = await fetch(`./assets/${this.city.id}/motion.json`, { cache: "no-store" });
        if (mr.ok) motionMap = await mr.json();
      } catch {}

      const jobs = Object.entries(manifest).map(async ([gridKey, meta]) => {
        const mSpec = motionMap[gridKey] || null;
        const [img, inkImg, baseImg, waterImg] = await Promise.all([
          loadImage(`./${meta.file}`),
          meta.inkFile ? loadImage(`./${meta.inkFile}`).catch(() => null) : Promise.resolve(null),
          mSpec?.baseFile ? loadImage(`./${mSpec.baseFile}`).catch(() => null) : Promise.resolve(null),
          mSpec?.waterFile ? loadImage(`./${mSpec.waterFile}`).catch(() => null) : Promise.resolve(null),
        ]);
        const motion = mSpec ? { waterImg, waterFlow: mSpec.waterFlow, gliders: [], rotators: [] } : null;
        if (mSpec?.sprites?.length) {
          motion.gliders = await Promise.all(
            mSpec.sprites.map(async (s) => ({
              ...s,
              img: s.file ? await loadImage(`./${s.file}`).catch(() => null) : null,
            }))
          );
        }
        if (mSpec?.rotators?.length) {
          motion.rotators = await Promise.all(
            mSpec.rotators.map(async (r) => ({
              ...r,
              img: r.file ? await loadImage(`./${r.file}`).catch(() => null) : null,
              legsImg: r.legsFile ? await loadImage(`./${r.legsFile}`).catch(() => null) : null,
            }))
          );
        }
        this.tileAssets.set(gridKey, { meta, img, baseImg, inkImg, motion });
      });
      await Promise.all(jobs);
    } catch {
      // No illustrated manifest for this city yet — gracefully uses v3 procedural Canvas2D
    }
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;
    this.paper = createPaperTexture(w, h);
  }

  // Where each visible code tile lands on screen at time t: the draw parameters and a pixel rect.
  // The live player (lib/live-city.js) hands these to tile workers and passes the bitmaps back to render().
  frame(t) {
    const W = this.width, H = this.height, city = this.city;
    const cam = this.cameraOverride || getCamera(t, city, W * 0.5, H * 0.53, this.camOverrides);
    const scale = BASE_SCALE * (W / 1920) * cam.zoom;
    const cx = W * 0.5 - cam.fx * (W / 1920) * cam.zoom;
    const cy = H * 0.535 - cam.fy * (W / 1920) * cam.zoom;
    const k = scale / CTS.S, tiles = [], M = Math.round(W * 0.04);
    for (let gx = -1; gx <= 1; gx++) for (let gy = -1; gy <= 1; gy++) {
      const key = `${gx},${gy}`;
      if (!city.tiles[key]) continue;
      const revAt = TILE_REVEAL_AT[key];
      const rev = revAt < 0 ? 1 : clamp((t - revAt) / REVEAL_DUR, 0, 1);
      if (rev <= 0.001) continue;
      const [ox, oy] = tileOrigin(gx, gy);
      const [x0, y0] = project(ox, oy, 0, scale, cx, cy);
      const half = (10 * CTS.S + 110) * k;
      const drop = rev < 0.999 ? 100 * (scale / 19.2) : 0; // tiles drop in from above while the city assembles
      // clipped to the view plus a margin, so a bitmap drawn for a slightly different camera still covers the edges
      const x = Math.max(-M, Math.floor(x0 - half)), r = Math.min(W + M, Math.ceil(x0 + half));
      const b = Math.min(H + M, Math.ceil(y0 + (20 * CTS.S * CTS.YS + CTS.SLAB * CTS.S * CTS.ZS + 14) * k + drop * 0.2));
      if (r - x < 2 || b + M < 2) continue; // off screen
      tiles.push({ key, ox, oy, cx, cy, scale, rev, t, x, y: -M, w: r - x, h: b + M });
    }
    return { t, tiles };
  }

  // render(t): draw everything here. render(t, layers): tiles come as bitmaps (Map key -> { bitmap, x, y }).
  render(t, layers) {
    const ctx = this.ctx;
    const W = this.width;
    const H = this.height;
    const city = this.city;

    if (ctx.reset) ctx.reset(); else ctx.setTransform(1, 0, 0, 1, 0, 0);
    // stage.background = a CSS colour replaces the paper texture and its vignette (carousel slides)
    if (this.background) { ctx.fillStyle = this.background; ctx.fillRect(0, 0, W, H); } else ctx.drawImage(this.paper, 0, 0);

    const cam = this.cameraOverride || getCamera(t, city, W * 0.5, H * 0.53, this.camOverrides);
    if (typeof window !== "undefined") { window.__cam = cam; window.__boxes = this.camOverrides; }
    const scale = BASE_SCALE * (W / 1920) * cam.zoom;
    const cx = W * 0.5 - cam.fx * (W / 1920) * cam.zoom;
    const cy = H * 0.535 - cam.fy * (W / 1920) * cam.zoom;
    const inkW = clamp(1.05 * Math.pow(cam.zoom, 0.35), 0.95, 1.55) * (W / 1920);

    const v8 = this.vecTiles.size > 0;
    if (v8) drawGround(ctx, cx, cy, scale, city, t); else drawRoadNetwork(ctx, cx, cy, scale, city, t);

    const drawList = [];

    for (let gx = -1; gx <= 1; gx++) {
      for (let gy = -1; gy <= 1; gy++) {
        const key = `${gx},${gy}`;
        const tile = city.tiles[key];
        if (!tile) continue;
        const revAt = TILE_REVEAL_AT[key];
        const rev = revAt < 0 ? 1 : clamp((t - revAt) / REVEAL_DUR, 0, 1);
        if (rev <= 0.001) continue;
        const [ox, oy] = tileOrigin(gx, gy);
        const asset = this.tileAssets.get(key);
        drawList.push({
          depth: (gx + gy) * PITCH,
          prio: 1,
          draw: () => {
            const vec = this.vecTiles.get(key);
            if (layers) {
              const L = layers.get(key);
              if (L) { if (L.dw) ctx.drawImage(L.bitmap, L.x, L.y, L.dw, L.dh); else ctx.drawImage(L.bitmap, L.x, L.y); }
            } else if (vec) {
              drawVectorTile(ctx, vec, ox, oy, cx, cy, scale, rev, t, city);
            } else if (asset) {
              drawIllustratedTile(ctx, city.id, key, asset, ox, oy, cx, cy, scale, rev, t);
            } else if (typeof tile.draw === "function") { // legacy procedural tile; a tile with no code yet stays an empty plot
              const pen = new IsoPen(ctx, {
                scale,
                ox,
                oy,
                cx,
                cy,
                t,
                reveal: rev,
                zoom: cam.zoom,
                inkWidth: inkW,
                estTotal: tile.estElements || 110,
              });
              tile.draw(pen, t);
              pen.flush();
            }
          },
        });
      }
    }

    // Only draw procedural satellites when city is in procedural mode (avoid mixing blocky satellites with illustrated tiles)
    if (this.tileAssets.size === 0 && !this.noSatellites) {
      for (const [slotName, slot] of Object.entries(SATELLITE_SLOTS)) {
        const sat = city.satellites?.[slotName];
        if (!sat) continue;
        const rev = clamp((t - slot.revealAt) / 1.05, 0, 1);
        if (rev <= 0.001) continue;
        drawList.push({
          depth: slot.depth,
          prio: 0,
          draw: () => {
            const pen = new IsoPen(ctx, {
              scale,
              ox: slot.ox,
              oy: slot.oy,
              cx,
              cy,
              t,
              reveal: rev,
              zoom: cam.zoom,
              inkWidth: inkW,
              estTotal: 45,
            });
            sat.draw(pen, t);
            pen.flush();
          },
        });
      }
    }

    if (v8) for (const e of buildEntities(ctx, cx, cy, scale, city, t)) drawList.push(e);
    const traffic = v8 ? [] : buildTrafficEntities(city, t);
    for (const e of traffic) {
      drawList.push({
        depth: e.depth,
        prio: 2,
        draw: () => drawRoadEntity(ctx, cx, cy, scale, e, t),
      });
    }

    drawList.sort((a, b) => a.depth - b.depth || a.prio - b.prio);
    for (const item of drawList) item.draw();

    if (this.background) return;
    const grad = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.42, W * 0.5, H * 0.5, Math.max(W, H) * 0.65);
    grad.addColorStop(0, "rgba(245,240,229,0)");
    grad.addColorStop(1, "rgba(182,165,140,0.12)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }
}
