# Make your own city

Three prompts, from smallest to largest. Paste one into Claude Code (or any coding agent that can run
commands and look at screenshots). Replace the parts in CAPITALS.

- **Prompt 1** needs nothing: it builds one living tile as a single HTML file.
- **Prompt 2** adds one tile to this engine.
- **Prompt 3** builds a whole new city with this engine, nine tiles.

For prompts 2 and 3, clone this repo first and run the agent inside it:

```
git clone https://github.com/MuhammadaliMS/world-cities.git
cd world-cities
npm install && npx playwright install chromium
```

---

## Prompt 1: one living tile, from scratch

```text
Build one living isometric city tile as a single HTML file. Canvas 2D only: no libraries, no images, no 3D engine.

Subject: LANDMARK, CITY (for example: the Colosseum, Rome).

SPACE
- The tile is a 10 x 10 unit square of ground seen from one fixed isometric camera. u runs to the back-right corner, v to the back-left corner, z is up.
- One function places every point on a 1024 x 1024 drawing area:
  P(u, v, z) = [512 + (u - v) * 45, 405 + (u + v) * 45 * 0.577 - z * 45 * 0.94]
- Every shape goes through P. No drawing in raw screen pixels, except a few pixels of detail around a projected anchor.
- Of any box you see three faces: the top, the left face (the v + dv side) and the right face (the u + du side).
- Depth: a larger u + v is nearer the viewer. Each frame, collect { depth, draw } items, sort by depth, then draw them, so people pass correctly in front of and behind things.

GRID RULES (these are what make it look right)
1. Everything that touches the ground stays inside 0.3 to 9.7 in both u and v. Only height may rise above the tile.
2. Every wall runs along u or along v. Buildings are boxes seen corner-on. No flat front views, nothing turned to face the camera. Round things are real cylinders, cones and domes on a ground ellipse; a wheel stands in a plane along one axis, so it is drawn as an ellipse.
3. The landmark stands in the back half so it rises against the sky. The front half is open ground (plaza, lawn, water) full of people.
4. The tile sits on a thin slab, 0.46 units deep, with a left and a right side.
5. One scale: an adult is about 0.74 units tall (a child 0.5), a storey about 0.58, a tree 1.3 to 1.9.

STYLE
- Flat fills, one warm-black outline (#2a2420, about 1.2 px), left faces a little darker than tops, right faces darker again, light hatching on large right faces.
- A white page. A warm, limited palette taken from the real place.
- Model the landmark's real, recognisable features: silhouette, proportions, rooflines, arches, windows, ornament, materials. It must read at thumbnail size and still hold up at 3x zoom. No blank signs: short real text.

LIFE
- At least 12 people moving at any moment. Each person is jointed (head, torso, two arms, two legs) and their feet stay planted: the step phase comes from distance walked divided by stride length, never from time alone. They follow smooth routes of (u, v) points, pause at the ends, turn and come back. Nobody walks through a wall, a prop or water.
- A few people doing something: taking a photo, waving, sitting, selling.
- One signature event on a loop of 10 to 25 seconds with a clear before and after (a gate opens, a train passes, a fountain builds, a flag is raised, a boat docks).
- Two or three small motions: a flag, fountain jets, birds, smoke, sparkle on glass.
- Everything is a pure function of time t in seconds. Use a seeded random function; never call Math.random() or read the clock while drawing. The tile must loop and must draw any time on request.

PAGE
- A full-window canvas, sharp on high-density screens, the tile centred and scaled to fit.
- Runs with requestAnimationFrame. A Pause button and a time slider.
- Opening the file with ?t=12 draws that one frozen frame.

HOW TO WORK
1. First write the layout as a list: every object with its (u, v) footprint and height. Check it against the grid rules before any drawing code.
2. Build back to front: slab and ground, the landmark, other buildings, props, then people and the event.
3. After every major step, take a screenshot and look at it. Zoom into the busy areas and check 4 or 5 consecutive frames for people walking through things, floating, or sorting wrongly.
4. Fix what you see before adding more.

DONE WHEN
- Nothing on the ground lies outside the tile, and every wall is parallel to a tile edge.
- The landmark is recognisable in a 200 px thumbnail.
- 12 or more people are moving with planted feet and nobody passes through anything.
- The signature event plays and loops cleanly.
- ?t=12 and ?t=12 again give the same picture.
```

---

## Prompt 2: add one tile to this engine

```text
You are in a clone of the world-cities repo. Add one tile.

Tile: LANDMARK for the city CITY_ID (lowercase, for example rome), at grid position GX,GY (each -1, 0 or 1; 0,0 is the centre and should be the city's most famous landmark).

READ FIRST
- docs/GRID-RULES.md (the rules every tile obeys) and docs/KIT.md (the drawing kit and the tools).
- lib/vec-kit.js and lib/vec-people.js in full.
- vtiles/example/0_0.js for the smallest complete tile.
- vtiles/paris/0_0.js and vtiles/paris/eiffel.js for the quality bar: how a landmark is built from solids and paths, how routes avoid props, how many people there are.

WHAT TO WRITE
- vtiles/CITY_ID/GX_GY.js with a default export draw(k, t). Put a big landmark in its own module next to it (for example vtiles/CITY_ID/colosseum.js) and import it.
- If the city does not exist yet, create cities/CITY_ID.js in the shape shown in docs/KIT.md (copy cities/example.js), with all nine tile names filled in and a theme for the streets.
- Do not edit lib/, tools/, city.html or other cities.

THE TILE
- Plan on the grid before drawing: list every object with its (u, v) footprint and height. The landmark in the back half, open ground with people in the front half, everything on the ground inside 0.3 to 9.7, every wall along u or v.
- Model the landmark's real features so it is recognised at once: silhouette, proportions, rooflines, arches, windows, ornament, materials. Use real reference knowledge of the place for WHAT is there; the grid decides WHERE it sits.
- Other buildings get windows, roofs, awnings and signs with short real text.
- 12 to 20 people moving at any moment on routes that avoid walls, props and water, plus a few people doing something.
- One signature event on a 10 to 25 second loop with a clear before and after, and two or three small motions.
- A pure function of t: rng(seed) for randomness, never Math.random() or the clock.

LOOK AT IT, EVERY STEP
- node tools/trace-shot.mjs CITY_ID GX,GY --mode code --t 3          -> out/trace/..._code.png. Open it and look.
- node tools/trace-shot.mjs CITY_ID GX,GY --mode code --t 3 --crop x,y,w,h --scale 3     -> zoomed crop of the 1024 canvas.
- node tools/trace-shot.mjs CITY_ID GX,GY --frames 3,3.033,3.067,3.1,3.133                -> consecutive frames: check walking, collisions and depth order in the busy areas.
- node tools/audit-tiles.mjs CITY_ID GX,GY                            -> the grid audit line and out/audit/CITY_ID_GX_GY.jpg with the true footprint in magenta.
- The whole city with your tile in place: open city.html?city=CITY_ID&t=48 through a local server (python3 -m http.server 8080).

DONE WHEN
- The audit says offgrid <= 1 %, farraw <= 6 %, sidespill <= 0.5 %, and in the audit picture nothing on the ground is outside the magenta diamond.
- The landmark is recognisable in a 200 px thumbnail and holds up at 3x zoom.
- 12 or more people move with planted feet and nobody walks through anything in the frame strips.
- The event plays and loops. The tile draws without errors at t = 0, 3, 17 and 48.

Finish with: the audit line, what the event is and its cycle length, and what you would improve next.
```

---

## Prompt 3: a whole new city

```text
You are in a clone of the world-cities repo. Build a new city: CITY NAME.

1. Choose the nine tiles. List the city's nine most recognisable places that also give you different kinds of motion (a river or harbour with boats, a railway or tram, a square with a crowd, a park, a market, a tower, a wheel or fountain). The most famous landmark goes in the centre, 0,0. Spread tall landmarks so they do not hide each other: tall things sit better in the back rows (gx + gy small) than in the front corner (1,1). Show me the list as a 3 x 3 grid and wait for my OK.

2. Create cities/CITY_ID.js (copy cities/example.js): the nine tile names and a theme for the streets between the tiles (pavement, asphalt, street trees or palms, car and bus colours that belong to this city).

3. Build the tiles one at a time, centre first. For each tile follow "Prompt 2: add one tile to this engine" in PROMPTS.md exactly, including the audit and the frame strips. If you can run sub-agents, give each tile to its own agent with that prompt and the tile's name and position, then review every tile yourself: one agent with nine tiles runs out of care by the fourth.

4. Review the city as a whole: open city.html?city=CITY_ID&t=48 and screenshots at t = 10, 20, 30 and 40 (the camera visits each tile). Check that the nine tiles read as one city: one scale for people and trees, no tile brighter or busier than the rest, nothing hanging over a street, tall landmarks not hiding their neighbours. Fix the stragglers.

5. Render the film: node render.mjs CITY_ID --fps 60 (needs ffmpeg) -> out/CITY_ID.mp4, 52 seconds. Sample frames from the finished file and look at them before you call it done.

Rules for the whole job: docs/GRID-RULES.md. The grid is the law; reference pictures tell you what is in a tile, never where it sits or at what angle.
```
