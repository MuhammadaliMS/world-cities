// city-base — the shared ground that makes nine tiles one city.
//
// World units: tile centres at g * PITCH (g = -1, 0, 1), each tile 10 x 10, a 2.4-wide street
// between tiles (0.5 pavement + 1.4 carriageway + 0.5 pavement). Everything here is drawn with the
// same vec-kit as the tiles, so line weight, people, cars and trees match the tiles exactly.
//
//   drawGround(...)      plate, pavements, carriageways, lane marks, zebra crossings (under all tiles)
//   buildEntities(...)   cars (U-turn at the road ends, never pop), pavement walkers looping each block,
//                        corner lamps, street trees round the rim — returned with a depth so the stage
//                        can interleave them with the tiles
//   drawSlabSides(...)   one uniform slab edge for every tile (called in tile space after the tile)

import { Kit, CTS, P, shade, rng, INK } from "./vec-kit.js";
import { project } from "./iso-engine.js";

export const PITCH = 12.4, HALF = 5, C = 6.2, EDGE = 17.4, RIM = 1.5, E = EDGE + RIM;
const RW = 0.7; // half carriageway
const LANE = 0.35, TURN = E - 0.75, PLATE_D = 0.85;

const THEMES = {
  default: { pave: "#ece5d5", asphalt: "#cdc7bb", dash: "#e6c35c", plateSide: "#d9cdb4", slabSide: "#e0d5bd", tree: "#86b05a", palm: false,
    cars: ["#d64e46", "#3f73b5", "#f2efe6", "#5f9e6e", "#2b3f5c", "#e58a3c"], bus: "#5f9e6e" },
  paris: { pave: "#ece4d2", asphalt: "#cfc8ba", cars: ["#d64e46", "#3f73b5", "#f2efe6", "#2b3f5c", "#9aa7b3", "#f0c94a"], bus: "#5fa58a" },
  london: { pave: "#e6e1d5", asphalt: "#c3c2bd", cars: ["#26262a", "#26262a", "#3f73b5", "#f2efe6", "#9aa7b3", "#5f9e6e"], bus: "#c8312c", busH: 0.62 },
  tokyo: { pave: "#e8e2d8", asphalt: "#bfc1c4", dash: "#f4f1e8", tree: "#f2a9c0", cars: ["#f0c94a", "#5f9e6e", "#f2efe6", "#26262a", "#d64e46", "#9aa7b3"], bus: "#6fa3d0" },
  shanghai: { pave: "#e9e3d4", asphalt: "#c6c5c0", tree: "#9cc76a", cars: ["#3f9e9a", "#f2efe6", "#d64e46", "#f0c94a", "#2b3f5c", "#9aa7b3"], bus: "#d64e46" },
  dubai: { pave: "#f1e4c6", asphalt: "#d2c5a6", dash: "#fbf6e6", plateSide: "#dcc79b", slabSide: "#e6d3a8", palm: true, cars: ["#f2efe6", "#f2efe6", "#f0c94a", "#26262a", "#b23a34", "#9aa7b3"], bus: "#e9dfc8" },
};
export function themeFor(city) { return { ...THEMES.default, ...(THEMES[city.id] || {}), ...(city.theme || {}) }; }

// draw in world units with the tile kit. street = true puts z=0 on the street (one slab below the tile tops)
function inWorld(ctx, cx, cy, scale, street, fn) {
  const [x0, y0] = project(0, 0, 0, scale, cx, cy);
  const k = scale / CTS.S;
  ctx.save();
  ctx.translate(x0, y0); ctx.scale(k, k);
  ctx.translate(-CTS.X0, -CTS.Y0 + (street ? CTS.SLAB * CTS.S * CTS.ZS : 0));
  try { fn(); } finally { ctx.restore(); }
}

const sq = (a, b, c, d) => [[a, b], [c, b], [c, d], [a, d]]; // u0,v0,u1,v1 rectangle

export function drawGround(ctx, cx, cy, scale, city, t) {
  const th = themeFor(city);
  inWorld(ctx, cx, cy, scale, true, () => {
    const k = new Kit(ctx, t, { stage: true });
    // soft contact shadow of the whole plate on the paper
    k.poly([[-E + 0.6, E, -PLATE_D], [E, E, -PLATE_D], [E, -E + 0.6, -PLATE_D], [E + 1.1, -E + 1.4, -PLATE_D], [E + 1.1, E + 1.1, -PLATE_D], [-E + 1.4, E + 1.1, -PLATE_D]], "rgba(60,45,30,0.10)", { stroke: false, wobble: 0 });
    // plate
    k.poly([[-E, E, 0], [E, E, 0], [E, E, -PLATE_D], [-E, E, -PLATE_D]], th.plateSide, { wobble: 0 });
    k.poly([[E, -E, 0], [E, E, 0], [E, E, -PLATE_D], [E, -E, -PLATE_D]], shade(th.plateSide, -0.14), { wobble: 0 });
    k.ground(sq(-E, -E, E, E), th.pave, { wobble: 0 });
    // carriageways (fills first, then kerb lines broken at the junctions)
    const R = E - 0.35;
    for (const c of [-C, C]) { k.ground(sq(-R, c - RW, R, c + RW), th.asphalt, { stroke: false }); k.ground(sq(c - RW, -R, c + RW, R), th.asphalt, { stroke: false }); }
    const segs = [[-R, -C - RW], [-C + RW, C - RW], [C + RW, R]];
    for (const c of [-C, C]) for (const s of [-1, 1]) for (const [a, b] of segs) {
      k.line3([[a, c + s * RW, 0], [b, c + s * RW, 0]], { lw: 1.3, wobble: 0 });
      k.line3([[c + s * RW, a, 0], [c + s * RW, b, 0]], { lw: 1.3, wobble: 0 });
    }
    for (const c of [-C, C]) for (const e of [-R, R]) { k.line3([[e, c - RW, 0], [e, c + RW, 0]], { lw: 1.3, wobble: 0 }); k.line3([[c - RW, e, 0], [c + RW, e, 0]], { lw: 1.3, wobble: 0 }); }
    // centre dashes
    const g = k.ctx;
    g.strokeStyle = th.dash; g.lineWidth = 2.2; g.lineCap = "butt"; g.beginPath();
    for (const c of [-C, C]) for (let a = -R + 0.5; a < R - 0.6; a += 1.05) {
      if (Math.abs(Math.abs(a + 0.3) - C) < 1.75) continue;
      g.moveTo(...P(a, c, 0)); g.lineTo(...P(a + 0.6, c, 0));
      g.moveTo(...P(c, a, 0)); g.lineTo(...P(c, a + 0.6, 0));
    }
    g.stroke();
    // zebra crossings on every approach to the four junctions
    g.fillStyle = "#faf7ee";
    const stripe = (pts) => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(...P(p[0], p[1], 0)) : g.moveTo(...P(p[0], p[1], 0)))); g.closePath(); g.fill(); };
    for (const iu of [-C, C]) for (const iv of [-C, C]) for (const s of [-1, 1]) for (let j = 0; j < 5; j++) {
      const off = -RW + 0.1 + j * 0.27;
      const a = iu + s * (RW + 0.22), b = iv + s * (RW + 0.22);
      stripe([[a, iv + off], [a + s * 0.5, iv + off], [a + s * 0.5, iv + off + 0.15], [a, iv + off + 0.15]]); // across the u-road
      stripe([[iu + off, b], [iu + off, b + s * 0.5], [iu + off + 0.15, b + s * 0.5], [iu + off + 0.15, b]]); // across the v-road
    }
    // contact shadow where each tile block meets the street (front edges)
    for (let gx = -1; gx <= 1; gx++) for (let gy = -1; gy <= 1; gy++) {
      const u = gx * PITCH, v = gy * PITCH;
      k.ground([[u - HALF, v + HALF], [u + HALF, v + HALF], [u + HALF, v - HALF], [u + HALF + 0.3, v - HALF + 0.25], [u + HALF + 0.3, v + HALF + 0.3], [u - HALF + 0.25, v + HALF + 0.3]], "rgba(60,45,30,0.13)", { stroke: false, wobble: 0 });
    }
  });
}

// ---------- traffic: one racetrack loop per road (down one lane, U-turn, back up the other) ----------
const LOOP = 2 * (2 * TURN) + 2 * (2 * LANE);
function carState(road, d) {
  // road: { axis: 'u'|'v', c }  d: distance along the loop
  d = ((d % LOOP) + LOOP) % LOOP;
  const long = 2 * TURN, short = 2 * LANE;
  let a, b, dir;
  if (d < long) { a = -TURN + d; b = LANE; dir = "+"; }
  else if (d < long + short) { a = TURN; b = LANE - (d - long); dir = "x-"; }
  else if (d < 2 * long + short) { a = TURN - (d - long - short); b = -LANE; dir = "-"; }
  else { a = -TURN; b = -LANE + (d - 2 * long - short); dir = "x+"; }
  // right-hand traffic: heading u+ keeps to the v+ side; heading v+ keeps to the u- side
  if (road.axis === "u") return { u: a, v: road.c + b, dir: dir === "+" ? "u+" : dir === "-" ? "u-" : dir === "x-" ? "v-" : "v+" };
  return { u: road.c - b, v: a, dir: dir === "+" ? "v+" : dir === "-" ? "v-" : dir === "x-" ? "u+" : "u-" };
}
const ROADS = [{ axis: "u", c: -C }, { axis: "u", c: C }, { axis: "v", c: -C }, { axis: "v", c: C }];
const SPEED = 1.7, PER_ROAD = 4;
const _fleet = new Map();
function fleetFor(city) {
  if (_fleet.has(city.id)) return _fleet.get(city.id);
  const th = themeFor(city);
  // pick start offsets so cars on crossing roads never meet at a junction (all loops share one period)
  let best = null, bestGap = -1;
  for (let attempt = 0; attempt < 60; attempt++) {
    const R = rng(attempt * 7 + city.id.length * 13 + 1);
    const cars = [];
    ROADS.forEach((road, ri) => { const base = R() * LOOP; for (let i = 0; i < PER_ROAD; i++) cars.push({ road, ri, off: base + (i + (R() - 0.5) * 0.35) * (LOOP / PER_ROAD) }); });
    let gap = 1e9;
    for (let tt = 0; tt < LOOP / SPEED; tt += 0.08) {
      const ps = cars.map((c) => carState(c.road, c.off + tt * SPEED));
      for (let i = 0; i < cars.length; i++) for (let j = i + 1; j < cars.length; j++) {
        if (cars[i].ri === cars[j].ri) continue;
        const dd = Math.hypot(ps[i].u - ps[j].u, ps[i].v - ps[j].v);
        if (dd < gap) gap = dd;
      }
      if (gap < bestGap) break;
    }
    if (gap > bestGap) { bestGap = gap; best = cars; }
    if (bestGap > 1.25) break;
  }
  const R = rng(99 + city.id.length);
  best.forEach((c, i) => { c.bus = i % PER_ROAD === 0 && i % 8 === 0; c.col = c.bus ? th.bus : th.cars[Math.floor(R() * th.cars.length)]; });
  _fleet.set(city.id, best);
  return best;
}

export function buildEntities(ctx, cx, cy, scale, city, t) {
  const th = themeFor(city);
  const list = [];
  const kit = new Kit(ctx, t, { stage: true });
  const add = (depth, fn) => list.push({ depth, prio: 0, draw: () => inWorld(ctx, cx, cy, scale, true, fn) });
  // cars
  for (const c of fleetFor(city)) {
    const s = carState(c.road, c.off + t * SPEED);
    add(s.u + s.v, () => kit.car(s.u, s.v, s.dir, c.col, c.bus ? { len: 1.7, wid: 0.56, h: th.busH || 0.44 } : {}));
  }
  // pavement walkers looping each block (alternating directions), drawn with the tile people rig
  for (let gx = -1; gx <= 1; gx++) for (let gy = -1; gy <= 1; gy++) {
    const u = gx * PITCH, v = gy * PITCH, r = HALF + 0.24;
    const ring = [[u - r, v - r], [u + r, v - r], [u + r, v + r], [u - r, v + r]];
    const n = 3;
    for (let i = 0; i < n; i++) {
      const seed = 500 + (gx + 1) * 31 + (gy + 1) * 97 + i * 7;
      const path = i % 2 ? ring : [...ring].reverse();
      const o = { loop: true, speed: 0.4 + (seed % 5) * 0.03, offset: (i + ((seed * 0.37) % 1)) / n, seed };
      const st = kit.walkerState(path, o);
      add(st.u + st.v, () => kit.walker(path, o));
    }
  }
  // lamps at the block corners (kerb side of the pavement)
  for (let gx = -1; gx <= 1; gx++) for (let gy = -1; gy <= 1; gy++) for (const [su, sv] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const u = gx * PITCH + su * (HALF + 0.42), v = gy * PITCH + sv * (HALF + 0.42);
    add(u + v, () => kit.lamp(u, v, { h: 1.35 }));
  }
  // street trees round the rim
  const rimR = EDGE + 0.85;
  for (let i = 0; i < 9; i++) {
    const a = -16.4 + i * 4.1;
    for (const [u, v] of [[a, -rimR], [a, rimR], [-rimR, a], [rimR, a]]) {
      const seed = Math.round(u * 13 + v * 7);
      add(u + v, () => (th.palm ? kit.palm(u, v, { h: 2.0 }) : kit.tree(u, v, { r: 0.55, h: 1.35, col: th.tree, seed, peek: false })));
    }
  }
  return list;
}

// uniform slab edge for every tile; call inside the tile's own transform (canonical tile space)
export function drawSlabSides(ctx, city) {
  const th = themeFor(city);
  const d = CTS.SLAB;
  const poly = (pts, fill) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.7; ctx.lineJoin = "round"; ctx.stroke(); };
  poly([P(0, 10, 0), P(10, 10, 0), P(10, 10, -d), P(0, 10, -d)], th.slabSide);
  poly([P(10, 0, 0), P(10, 10, 0), P(10, 10, -d), P(10, 0, -d)], shade(th.slabSide, -0.14));
}
