# Grid rules

Nine tiles only read as one city if every tile obeys the same grid. These are the rules every tile in this
repo follows. They are checked by `node tools/audit-tiles.mjs <city> <gx,gy>`.

**The grid is the law. A reference picture tells you WHAT is in a tile (which landmark, which props, materials,
colours, mood), never WHERE things sit or at what angle.** Reference pictures are rarely on a true isometric
grid. If you copy their perspective, your landmark comes out flat-on or sheared and your ground spills onto the
streets. Re-compose on the grid instead: moving, shrinking, rotating or dropping things is expected.

## The rules

1. **Footprint.** A tile is a 10 x 10 unit square of ground. Everything that touches the ground (ground
   polygons, water, paths, building footprints, tree trunks, people, vehicles, boats, shadows) lies inside
   `0.3 <= u <= 9.7`, `0.3 <= v <= 9.7`. Nothing hangs past the edges: no dunes, mountains, viaducts, lawns
   or water beyond the square. Only height (z) may rise above the footprint.
2. **Everything through `P(u, v, z)`.** No screen-space drawing and no raw pixel coordinates, except small
   local detail offsets (a few px) around a projected anchor.
3. **Axis-aligned buildings.** Every wall runs along `u` or along `v`. A building is a box (or a stack of
   boxes) seen corner-on: you see its **left face** (the `v + dv` side), its **right face** (the `u + du`
   side) and its top. No flat frontal elevations and no buildings turned to face the camera. Put the main
   facade on whichever visible face shows it best. Round things are true cylinders, cones and domes on a
   ground ellipse. A wheel stands in a plane along one axis, so it is drawn as an ellipse.
4. **Composition.** The landmark sits in the back half so it rises against the sky. The front half is open
   ground (plaza, lawn, water, street) full of people and motion. Lower things in front, taller behind.
   Leave a pavement rim about 0.4 wide inside the tile edge where it makes sense.
5. **Standard slab.** Start with `k.slab(topColour)`. Do not draw your own slab sides, thicker bases or
   cliffs: the city stage draws one uniform slab side for every tile.
6. **Standard scale.** People at the kit's default height. Trees `r` 0.45-0.8, `h` 1.2-1.9. A storey is
   about 0.55-0.6 units. The landmark may be as tall as it needs.
7. **Motion stays inside.** Walk routes, vehicles and boats stay within the footprint: loop them or turn
   them round. Nothing enters or leaves through the tile edge.
8. **A pure function of time.** A tile is `draw(k, t)`. Use `rng(seed)` for anything random. Never call
   `Math.random()` or read the clock, or the tile cannot be scrubbed, looped or rendered to video.

## Acceptance

- `tools/audit-tiles.mjs` reports **offgrid <= 1 %, farraw <= 6 %, sidespill <= 0.5 %**.
- In the audit picture nothing on the ground lies outside the magenta diamond, and every wall is parallel
  to a grid line.
- The landmark is instantly recognisable at thumbnail size and still holds up at 3x zoom.
- 12 or more people are moving, nobody walks through a wall, a prop or water, and feet stay planted.
- The tile has one signature event on a loop (a bridge opens, a train passes, a fountain builds), with a
  clear before and after.

## What the audit numbers mean

| Number | Meaning | Target |
|---|---|---|
| offgrid % | projected points whose (u, v) is outside the tile | <= 1 |
| farraw % | canvas path points drawn in raw screen space, far from any `P()` point | <= 6 |
| sidespill % | opaque pixels left or right of the footprint, or below the slab | <= 0.5 |
