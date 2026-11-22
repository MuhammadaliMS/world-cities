# The drawing kit

Everything is drawn with `lib/vec-kit.js` (the `Kit` class) and the people rig in `lib/vec-people.js`.
Read both files: they are short and commented. This page is the map.

## Space

- One tile is 10 x 10 ground units. `u` runs to the back-right corner, `v` to the back-left corner, `z` is up.
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

`box` returns its three face polygons, so you can draw more on a face. `k.ctx` is the real canvas context:
for anything the kit lacks, project anchors with `P()` and draw paths yourself (see `vtiles/paris/eiffel.js`).

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
| `node tools/trace-shot.mjs <city> <gx,gy> --mode code --t 3` | one tile at time 3 s, saved to `out/trace/` |
| `... --crop x,y,w,h --scale 3` | a zoomed crop (pixels of the 1024 canvas) |
| `... --frames 3,3.033,3.067,3.1,3.133` | a strip of consecutive frames, to check walking and collisions |
| `... --video 6 --fps 60` | a 6 second clip of the tile |
| `node tools/audit-tiles.mjs <city> <gx,gy>` | the grid audit numbers and a picture with the true footprint in magenta |
| `node render.mjs <city>` | the 52 second city film as `out/<city>.mp4` (needs ffmpeg) |
