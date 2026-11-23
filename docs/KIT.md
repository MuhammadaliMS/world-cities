# The drawing kit

Everything is drawn with `lib/vec-kit.js` (the `Kit` class) and the people rig in `lib/vec-people.js`.
Read both files: they are short and commented. This page is the map.

## Space

- One tile is 10 x 10 ground units, drawn as a diamond. `(0, 0)` is the back corner (top of the diamond), `u` runs from there to the right corner, `v` to the left corner, and `(10, 10)` is the front corner nearest the viewer. `z` is up.
- `P(u, v, z)` projects tile units to pixels on a 1024 x 1024 canvas:
  `x = 512 + (u - v) * 45`, `y = 405 + (u + v) * 45 * 0.577 - z * 45 * 0.94`.
- From the camera you see three faces of a box: TOP, LEFT (the `v + dv` face) and RIGHT (the `u + du` face).
- Depth: a larger `u + v` is nearer the viewer.
- The city is a 3 x 3 grid of tiles, `gx, gy` from -1 to 1, with a 2.4 unit street between tiles.
  `0,0` is the centre and gets the longest close-up.

## A tile

A tile is one file, `vtiles/<city>/<gx>_<gy>.js`, with a default export:

```js
import { P, INK, rng, lerp, clamp } from "../../lib/vec-kit.js";

export default function draw(k, t) {
  k.slab("#e9dec6");                                   // the ground plate (always first)
  k.ground([[0.4, 5], [9.6, 5], [9.6, 9.6], [0.4, 9.6]], "#a2c265");   // a lawn, in (u, v)

  // static things that never overlap moving ones can be drawn straight away, back to front
  k.box(2, 1, 0, 4, 2.5, 3, "#e0cd9c");                // u, v, z, du, dv, dz, colour
  k.windows(2, 1, 0.3, 4, 2.5, 2.4, { side: "L", cols: 6, rows: 3 });
  k.hip(2, 1, 3, 4, 2.5, 0.9, "#6f86a8");              // a hipped roof on top

  // anything that people can pass in front of or behind goes through the depth queue
  k.q(4.2 + 6.5, () => k.tree(4.2, 6.5, { r: 0.6, h: 1.5 }));
  k.qwalker([[1, 7], [5, 8], [9, 7]], { seed: 11, speed: 0.45 });   // walks the route, pauses, turns back
  k.qperson(6, 8.6, { pose: "photo", seed: 12 });
}
```

The stage calls `k.flush()` for you: queued items are drawn sorted by depth. Use the depth of the object's
front edge (`u + v`).

## What the kit has

| Group | Methods |
|---|---|
| Solids | `box`, `windows`, `gable`, `hip`, `cyl`, `dome`, `cone`, `poly([[u,v,z],...], fill)` |
| Ground | `slab`, `ground`, `water`, `grass`, `stipple`, `plot`, `groundTrace`, `shadow` |
| Plants and props | `tree`, `conifer`, `palm`, `hedge`, `flowers`, `flowerCurve`, `lamp`, `bench`, `flag`, `awning`, `umbrella` |
| People | `person` / `qperson`, `walker` / `qwalker`, `walkerState`, `cyclist` / `qcyclist` |
| Vehicles and air | `car`, `bike`, `bird`, `circlingBird` |
| Low level | `path`, `line`, `circle`, `ell`, `hatch`, `q(depth, fn)`, `k.ctx` (the canvas context), `k.t` |

Signatures and the options you will reach for first (every method takes a last options object; read the
method for the rest):

| Method | Notes |
|---|---|
| `box(u, v, z, du, dv, dz, colour, o)` | `left`, `right`, `top` override face colours; `hatch: false`, `shadow: false`, `noTop: true` |
| `windows(u, v, z, du, dv, dz, o)` | on the box with the same numbers: `side: "L"` or `"R"`, `cols`, `rows`, `lit` (share of lit windows), `arch`, `balcony`, `color` |
| `gable` / `hip (u, v, z, du, dv, h, colour)` | a roof on a box top |
| `cyl(u, v, z, r, h, colour)`, `dome(u, v, z, r, h, colour)`, `cone(u, v, z, r, h, colour)` | round solids on a ground ellipse |
| `ell(u, v, z, r, fill)` | a flat ellipse lying on the ground plane (a pond, a plaza ring) |
| `tree(u, v, { r, h, col, seed })`, `conifer(u, v, { h, r, col })`, `palm(u, v, { h })` | |
| `hedge(u, v, du, dv, { h, col })`, `flowers(u, v, du, dv)`, `flowerCurve(points, width, { cols })` | |
| `lamp(u, v, { h, col })`, `bench(u, v, { along: "u" or "v", len })`, `umbrella(u, v, { h, r, col })` | |
| `flag(u, v, z, { h, w, fh, cols, horizontal })` | **the default is a blue, white and red tricolour**: pass `cols: [..]` for your own flag |
| `awning(u, v, z, len, { stripes, depth, drop })` | a striped awning on a left face, running along `u` |
| `car(u, v, dir, colour, { len, wid, h })` | `dir` is `"u+"`, `"u-"`, `"v+"` or `"v-"`; a bus is a longer, taller car |

`box` returns its three face polygons, so you can draw more on a face. `k.ctx` is the real canvas context:
for anything the kit lacks, project anchors with `P()` and draw paths yourself (see `vtiles/paris/eiffel.js`).

**Curved landmarks** (an arena, a rotunda, a wheel) have no ready-made primitive. Build the curve from points
on a ground ellipse: for an angle `a`, the wall point is `P(cu + ru * cos(a), cv + rv * sin(a), z)`. Draw the
wall as a ring of short quads between consecutive angles, back half first, then the inside, then the front
half. The centre and radii are in tile units, so the curve still obeys the grid.

**Some existing tiles import a `<gx>_<gy>.ground.js` file** (lawn, water and path outlines used by
`k.groundTrace`). Those were traced from reference paintings. You do not need them: lay out your own ground
with `k.slab`, `k.ground` and `k.water` as `vtiles/example/0_0.js` does.

## People

- `k.person(u, v, { pose, seed, dir, ... })`. Poses: `stand`, `walk`, `sitground`, `sit`, `ride`, `wave`,
  `paint`, `photo`, `cheer`, `clap`. `seed` picks skin, hair, outfit and hat; override with `style`,
  `hairStyle`, `hat`, `top`, `bottom`, `kid: true`.
- `k.walker(path, { seed, speed, offset, dwell, loop })` walks a route of `[u, v]` points on a smooth
  spline. Feet stay planted because the step phase comes from the distance walked. At the ends the walker
  pauses for `dwell` seconds and turns back, or follows a closed loop with `loop: true`.
- Do not pass `h` or `scale`: one standard height keeps the nine tiles consistent.
- Routes must not cross walls, props or water. Check with consecutive frames (below).

## Motion

Everything is a function of `t` (seconds). A looping event is just arithmetic on `t`:

```js
const c = t % 22;                                        // a 22 s cycle
const open = clamp((c - 5.5) / 3) - clamp((c - 12.5) / 3);   // rises 5.5-8.5 s, lowers 12.5-15.5 s
```

Give every tile one signature event with a clear before and after, plus a few small motions (flags,
fountain jets, birds, smoke, a boat).

## Night

Every tile gets a night version for free: `lib/night.js` turns colours moonlit, lights about half of the small
glass-coloured shapes as windows, and leaves people, cars and water alone. `k.lamp` and `k.car` carry their own
light. What only you can add is how your landmark looks at night. Two tools:

**Hints** in the city file, under the tile's entry (data only):

```js
"0,0": {
  name: "Eiffel Tower",
  night: {
    flood: [{ cols: ["#6e4429", "#4a2c18"], tint: "#ffd27a", k: 0.9, gain: 1.8 }], // these colours are floodlit
    // flood: [{ box: [u0, v0, u1, v1, zTop], tint, k }]   or everything inside a box on screen
    neon: ["#e07a94"],                         // colours that keep full brightness (signs, screens)
    lights: [{ u: 4.85, v: 4.85, z: 13.4, r: 0.9, col: "#fff2c0", a: 0.9 }],   // glows; flat: true = on the ground
    windows: 0.5,                              // share of lit windows (0 = none)
    nowin: [{ box: [5, 0.5, 9.5, 4.5, 6] }],   // nothing lights up as a window here (snow, glass roofs)
  },
},
```

**Code** that only runs at night: `if (k.night) { ... }`. `k.night` is 0 by day and 1 at night.
`k.glow(u, v, z, r, colour, strength, { flat })` adds a light and does nothing by day. `k.lit(() => { ... })`
draws something that gives off light (a neon tube, a clock face): its colours are not darkened.

Check a tile at night with `node tools/trace-shot.mjs <city> <gx,gy> --mode code --night 1`, and that the day
picture did not change with `node tools/day-hash.mjs save` before and `node tools/day-hash.mjs check` after.

## A city

`cities/<id>.js` describes the city. The minimum:

```js
export default {
  id: "rome",
  name: "Rome",
  seed: 7,
  // optional: colours for the streets between the tiles
  theme: { pave: "#ece4d2", asphalt: "#cfc8ba", tree: "#86b05a", palm: false, bus: "#c8312c",
           cars: ["#d64e46", "#3f73b5", "#f2efe6", "#2b3f5c", "#9aa7b3", "#f0c94a"] },
  tiles: {
    "0,0":  { name: "The Colosseum" },
    "-1,-1": { name: "The Pantheon" },
    // ... nine in all: gx,gy from -1 to 1
  },
};
```

A tile with no code file yet is drawn as an empty plot, so you can build a city one tile at a time.
Open `city.html?city=rome` to watch it, `city.html?city=rome&t=48` for one frozen frame.

## Looking at your work

The tools need Node, `npm install` and `npx playwright install chromium`.

| Command | What you get |
|---|---|
| `node tools/trace-shot.mjs <city> <gx,gy> --mode code --t 3` | one tile at time 3 s, saved as `out/trace/<city>_<gx>_<gy>_code.png`. Each run overwrites that file: add `--out out/trace/name.png` to keep several |
| `... --crop x,y,w,h --scale 3` | a zoomed crop (pixels of the 1024 canvas) |
| `... --frames 3,3.033,3.067,3.1,3.133` | a strip of consecutive frames, to check walking and collisions |
| `... --video 6 --fps 60` | a 6 second clip of the tile |
| `node tools/audit-tiles.mjs <city> <gx,gy>` | the grid audit numbers and a picture with the true footprint in magenta |
| `node render.mjs <city>` | the 52 second city film as `out/<city>.mp4` (needs ffmpeg) |
