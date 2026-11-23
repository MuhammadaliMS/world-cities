// LONDON — High-Fidelity v2 Ligne Claire Isometric World
// Dense architectural details: Gothic Big Ben tracery, Tower Bridge suspender rods & drawbridge,
// Buckingham Palace colonnade & marching bearskin guards, Covent Garden market stalls, organic Serpentine!

import { PALETTE, shade, lerp } from "../lib/iso-engine.js";

const C = {
  stone: "#e9dfd0",
  honey: "#e0ca9e",
  brick: "#bc674e",
  busRed: "#c83c36",
  thames: "#7ea1b0",
  bridgeBlue: "#78a7be",
  grass: "#8aad6e",
  slate: "#6b7480",
  gold: "#e2be58",
  glass: "#9cc1cf",
};

// night: every shade variant the engine can derive from a base colour (for exact-colour floodlighting)
const NPCT = Array.from({ length: 61 }, (_, i) => Math.round((i - 30)) / 100);
const nv = (...bases) => bases.flatMap((b) => NPCT.map((p) => shade(b, p)));

// High-Fidelity Gothic Big Ben (Elizabeth Tower) with vertical tracery, golden pinnacles & ticking dial!
function drawBigBen(pen, cx, cy, t) {
  pen.box(cx - 0.72, cy - 0.72, 0, 1.44, 1.44, 4.48, C.honey, {
    plinth: true, pilasters: true,
    windows: { floors: 6, colsU: 3, colsV: 3, color: "#685c48", litChance: 0.12, arched: true },
    hatch: true,
  });
  pen.box(cx - 0.88, cy - 0.88, 4.48, 1.76, 1.76, 1.32, "#e8d5ad", { shadow: false, noPlinth: true, cornice: true });
  // 4 Golden Gothic corner spirelet pinnacles!
  for (const [pu, pv] of [[-0.84, -0.84], [0.84, -0.84], [-0.84, 0.84], [0.84, 0.84]]) {
    pen.line([cx + pu, cy + pv, 5.8], [cx + pu, cy + pv, 6.28], C.gold, 1.25);
  }

  const drawClock = (u, v, z) => {
    const [px, py] = pen.pt(u, v, z);
    const r = pen.scale * 0.43;
    const pts = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      pts.push([px + Math.cos(a) * r, py + Math.sin(a) * r]);
    }
    pen.screenPoly(pts, "#fbf1ca", PALETTE.ink, 0.85);
    // Delicate inner clock dial ring
    const inner = pts.map(([x, y]) => [px + (x - px) * 0.72, py + (y - py) * 0.72]);
    pen.screenPoly(inner, null, "rgba(41,35,31,0.35)", 0.45, true);
    const minA = -Math.PI * 0.5 + t * 0.9, hrA = -Math.PI * 0.5 + t * 0.12;
    pen.screenPoly([[px, py], [px + Math.cos(minA) * r * 0.72, py + Math.sin(minA) * r * 0.72]], null, PALETTE.ink, 0.95, false);
    pen.screenPoly([[px, py], [px + Math.cos(hrA) * r * 0.48, py + Math.sin(hrA) * r * 0.48]], null, PALETTE.ink, 1.25, false);
  };
  drawClock(cx, cy + 0.89, 5.14);
  drawClock(cx + 0.89, cy, 5.14);

  pen.pyramid(cx - 0.85, cy - 0.85, 5.85, 1.7, 1.7, 2.0, C.slate, { left: "#77818f", right: "#58606b", lattice: 3 });
  pen.line([cx, cy, 7.85], [cx, cy, 8.6], C.gold, 1.5);
}

export default {
  id: "london",
  name: "London",
  seed: 1859,
  heroFocus: { u: 6.2, v: 7.4, z: 0.6 },
  vehicles: [
    { style: "bus_red", color: C.busRed },
    { style: "bus_red", color: C.busRed },
    { style: "taxi", color: "#2d3036" },
    { style: "taxi", color: "#2d3036" },
    { style: "sedan", color: "#5e8296" },
    { style: "sedan", color: "#6f9167" },
  ],
  tiles: {
    // CENTER (0,0): Big Ben, Palace of Westminster & Red Phone Box Micro-Story
    "0,0": {
      name: "Big Ben & Westminster",
      night: {
        flood: [
          { cols: nv("#dcb672", "#f0d59c", "#c9a060", "#a9813f", "#7b5b2b", "#e3bd52", "#f7df8c"), tint: "#ffcf78", k: 0.8, gain: 1.45 },
        ],
        neon: ["#fbf6e6", "#f3d57a"],
        lights: [
          { u: 8.8, v: 2.5, z: 6.5, r: 0.9, col: "#ffe2a0", a: 0.85 },
          { u: 9.4, v: 1.9, z: 6.5, r: 0.9, col: "#ffe2a0", a: 0.85 },
          { u: 5.0, v: 2.2, z: 2.0, r: 3.0, col: "#ffbf60", a: 0.2 },
          { u: 1.15, v: 1.85, z: 5.0, r: 1.6, col: "#ffbf60", a: 0.2 },
          { u: 5.0, v: 3.2, z: 0.1, r: 2.6, col: "#ffc670", a: 0.22, flat: true },
        ],
        windows: 0.45,
      },
      camZ: 2.3,
      estElements: 235,
      draw(pen, t) {
        pen.tileBase(10, 10, "#e8e1d2", { paving: 1.2 });
        pen.ground(0.5, 5.7, 3.6, 3.7, C.grass, 0.02);
        pen.grassDetail(0.5, 5.7, 3.6, 3.7, 1, true);
        pen.ground(4.2, 5.7, 5.3, 3.7, "#efe7d7", 0.02);

        // Palace of Westminster Gothic Wing with arched tracery & pinnacles!
        pen.item(4.8, () => {
          pen.box(0.55, 0.75, 0, 5.5, 3.85, 2.0, C.honey, {
            plinth: true, pilasters: true,
            windows: { floors: 3, colsU: 6, colsV: 4, color: "#5c5446", arched: true },
            cornice: true, hatch: true,
          });
          pen.gableRoof(0.55, 0.75, 2.11, 5.5, 3.85, 0.68, C.slate, "u");
          pen.box(0.55, 0.75, 0, 1.55, 1.55, 3.3, C.honey, {
            plinth: true, pilasters: true,
            windows: { floors: 4, colsU: 2, colsV: 2, color: "#5c5446", arched: true },
            cornice: true,
          });
          pen.box(0.72, 0.92, 3.38, 1.21, 1.21, 0.16, C.slate, { shadow: false, noPlinth: true, lw: 0.65 });
          for (const [pu, pv] of [[0.62, 0.82], [2.03, 0.82], [0.62, 2.23], [2.03, 2.23]]) {
            pen.line([pu, pv, 3.38], [pu, pv, 3.88], C.gold, 1.15);
          }
          pen.flag(1.32, 1.52, 3.54, 1.05, ["#32528c", "#f6f2e8", "#c83c36"]);
        });

        pen.item(9.2, () => drawBigBen(pen, 7.2, 3.2, t));
        pen.item(10.0, () => pen.bird(2.5 + Math.sin(t * 0.9) * 0.8, 2.2, 3.8, 0.3));

        // HERO MICRO-STORY: Crimson Red Phone Box + Tourists, Victorian Lamps & Parliament Square!
        pen.item(13.8, () => {
          pen.flowerbed(0.7, 5.9, 3.1, 0.65, ["#c83c36", "#f2cf66", "#faf6ec"]);
          pen.bench(4.8, 8.6, 0.02, "u");
          pen.lamp(4.6, 6.2, 0.02);
          pen.lamp(8.5, 6.2, 0.02);
          // Classic K6 Red Telephone Box!
          pen.box(6.1, 7.0, 0.02, 0.7, 0.7, 1.32, C.busRed, {
            shadow: false, noPlinth: true,
            windows: { floors: 2, colsU: 2, colsV: 2, color: "#d8eaf0", litChance: 0 },
          });
          pen.dome(6.45, 7.35, 1.34, 0.37, 0.22, C.busRed, { finial: false, ribs: 4 });
          pen.person(5.4, 7.5, 0.02, { shirt: "#4f748c", flash: true, seed: 1 });
          pen.person(7.15, 7.45, 0.02, { shirt: "#e0b34c", dress: true, wave: true, seed: 2 });
          pen.person(6.4, 8.15, 0.02, { shirt: "#6f9167", wave: true, seed: 3 });
          // Winston Churchill statue pedestal in Parliament Square
          pen.cylinder(2.3, 7.6, 0.02, 0.48, 0.5, "#cbc2b2", { flutes: 6 });
          pen.person(2.3, 7.6, 0.52, { shirt: "#4e565e", pants: "#4e565e", scale: 0.92, seed: 9 });
        });
        for (const [tu, tv] of [[1.1, 6.9], [3.5, 8.7], [8.8, 6.5], [8.6, 8.7]]) {
          pen.item(tu + tv, () => pen.tree(tu, tv, 0.02, "round", 0.92));
        }
      },
    },

    // (-1,-1): Tower Bridge with Suspender Rods, Animated Drawbridge & Tall Sailboat!
    "-1,-1": {
      name: "Tower Bridge & The Thames",
      night: {
        flood: [
          { cols: nv("#e8d8b2", "#efe0bc", "#d9c7a0", "#bfa97c", "#d8c79c", "#d8c8a0", "#cdb88f", "#a8946c", "#bba682", "#fbf3dc"), tint: "#ffd48a", k: 0.8, gain: 1.45 },
          { cols: nv("#5d90c4", "#3d6c9c"), tint: "#8fd0ff", k: 0.85, gain: 1.7 },
          { cols: nv("#e2bd55"), tint: "#ffd270", k: 0.8, gain: 1.5 },
        ],
        lights: [
          { u: 3.05, v: 4.5, z: 6.5, r: 1.8, col: "#ffc878", a: 0.22 },
          { u: 6.95, v: 4.5, z: 6.5, r: 1.8, col: "#ffc878", a: 0.22 },
          { u: 5.0, v: 4.5, z: 2.6, r: 1.6, col: "#8fd0ff", a: 0.3 },
          { u: 5.0, v: 4.5, z: 0.0, r: 3.5, col: "#6fa8ff", a: 0.18, flat: true },
        ],
        windows: 0.4,
      },
      camZ: 1.9,
      estElements: 225,
      draw(pen, t) {
        pen.tileBase(10, 10, C.thames);
        pen.water(0.2, 0.2, 9.6, 9.6, C.thames, { z: -0.08, ripples: 11 });

        const cycle = (t * 0.22) % 1;
        const bv = lerp(1.0, 9.0, cycle);
        const openAmt = Math.max(0, Math.sin(Math.min(1, Math.max(0, (cycle - 0.18) / 0.64)) * Math.PI));

        pen.item(5.0 + bv * 0.4, () => {
          if (bv < 5.0) pen.boat(5.0, bv, -0.05, { style: "sailboat", axis: "v", accent: "#c83c36" });
        });

        pen.item(10.0, () => {
          pen.box(0.2, 4.4, 0.72, 2.6, 1.2, 0.18, "#d8d1c2", { shadow: false, noPlinth: true });
          pen.box(7.2, 4.4, 0.72, 2.6, 1.2, 0.18, "#d8d1c2", { shadow: false, noPlinth: true });
          pen.vehicle(1.25, 5.0, 0.9, { axis: "u", style: "bus_red" });
          pen.vehicle(8.55, 5.0, 0.9, { axis: "u", style: "taxi", color: "#2d3036" });

          const liftZ = openAmt * 1.18, tipIn = openAmt * 0.46;
          pen.poly([[3.3, 4.45, 0.85], [4.95 - tipIn, 4.45, 0.85 + liftZ], [4.95 - tipIn, 5.55, 0.85 + liftZ], [3.3, 5.55, 0.85]], C.bridgeBlue, PALETTE.ink, 0.85);
          pen.poly([[6.7, 4.45, 0.85], [5.05 + tipIn, 4.45, 0.85 + liftZ], [5.05 + tipIn, 5.55, 0.85 + liftZ], [6.7, 5.55, 0.85]], C.bridgeBlue, PALETTE.ink, 0.85);

          // Twin Victorian Neo-Gothic Stone Towers with Cutwater River Piers & Arched Windows!
          for (const tu of [2.9, 7.1]) {
            pen.box(tu - 0.72, 4.0, -0.08, 1.44, 2.0, 0.8, "#c2b8a6", { shadow: false, noPlinth: true });
            pen.box(tu - 0.56, 4.2, 0.72, 1.12, 1.6, 2.78, C.stone, {
              pilasters: true,
              windows: { floors: 3, colsU: 2, colsV: 2, color: "#546572", arched: true },
              cornice: true,
            });
            pen.pyramid(tu - 0.58, 4.18, 3.6, 1.16, 1.64, 1.08, C.slate);
            pen.pyramid(tu - 0.62, 5.42, 3.45, 0.36, 0.36, 0.72, C.slate);
            pen.pyramid(tu + 0.26, 5.42, 3.45, 0.36, 0.36, 0.72, C.slate);
          }

          pen.box(3.45, 4.45, 2.95, 3.1, 0.38, 0.32, C.bridgeBlue, { shadow: false, noPlinth: true });
          pen.box(3.45, 5.18, 2.95, 3.1, 0.38, 0.32, C.bridgeBlue, { shadow: false, noPlinth: true });

          // Sweeping Sky-Blue Suspension Chains + Vertical Suspender Rods down to deck!
          for (const vOff of [4.45, 5.55]) {
            pen.polyline([[0.2, vOff, 0.95], [1.3, vOff, 1.48], [2.4, vOff, 2.95]], C.bridgeBlue, 2.3);
            pen.polyline([[7.6, vOff, 2.95], [8.7, vOff, 1.48], [9.8, vOff, 0.95]], C.bridgeBlue, 2.3);
            for (const su of [0.8, 1.4, 2.0]) {
              const hz = lerp(1.18, 2.45, (su - 0.5) / 1.8);
              pen.line([su, vOff, 0.9], [su, vOff, hz], C.bridgeBlue, 0.75);
              pen.line([10 - su, vOff, 0.9], [10 - su, vOff, hz], C.bridgeBlue, 0.75);
            }
          }
        });
        pen.item(12.0 + bv, () => {
          if (bv >= 5.0) pen.boat(5.0, bv, -0.05, { style: "sailboat", axis: "v", accent: "#c83c36" });
        });
        pen.item(13.0, () => pen.bird(2.2 + Math.sin(t * 1.1) * 1.1, 7.6, 1.8, 0.2));
      },
    },

    // (0,-1): The London Eye & South Bank
    "0,-1": {
      name: "The London Eye & South Bank",
      night: {
        flood: [
          { cols: nv("#f4f1e8", "#cfcabb", "#d8d3c4", "#fbf9f2", "#c9c4b4", "#e8e3d6"), tint: "#a8d8ff", k: 0.75, gain: 1.6 },
          { cols: nv("#d6e6ee", "#a7bdca", "#7d9bad", "#a9c7d4", "#bcd7e0", "#8eaebe", "#dcecf1"), tint: "#ffe2a8", k: 0.8, gain: 1.5 },
        ],
        lights: [
          { u: 5.0, v: 3.4, z: 5.4, r: 4.6, col: "#7fb8ff", a: 0.1 },
          { u: 5.0, v: 4.2, z: 0.0, r: 3.2, col: "#8fc4ff", a: 0.2, flat: true },
        ],
        windows: 0.5,
      },
      camZ: 2.0,
      estElements: 220,
      draw(pen, t) {
        pen.tileBase(10, 10, "#e9e1d2");
        pen.water(0.2, 5.8, 9.6, 4.0, C.thames, { z: -0.08, ripples: 10 });
        pen.ground(0.4, 0.4, 9.2, 5.1, C.grass, 0.02);
        pen.grassDetail(0.4, 0.4, 9.2, 4.0, 22, true);
        pen.ground(0.4, 4.35, 9.2, 1.35, "#efe7d7", 0.02);
        pen.paving(0.5, 4.4, 9.0, 1.25, 0.9, 0.025);

        pen.item(9.4, () => {
          pen.ferrisWheel(5.0, 4.55, 0.02, 2.68, "u", 16, "#f7f4ec", "#b4d4e0", { speed: 0.22, podSize: 0.22 });
          pen.railing([0.4, 5.7], [9.6, 5.7], 0.02, 0.24);
          pen.lamp(2.5, 5.5, 0.02);
          pen.lamp(7.5, 5.5, 0.02);
          pen.stall(0.9, 3.3, 0.02, 1.8, 0.85, "#32528c", "#faf4e6", ["#c83c36", "#f2cf66", "#8aad6e"]);
          pen.cafeSet(7.8, 3.8, 0.02, C.busRed);
          pen.bench(3.2, 5.0, 0.02, "u");
        });

        const fu = 1.4 + ((t * 1.0) % 7.2);
        pen.item(fu + 7.8, () => pen.boat(fu, 7.8, -0.06, { style: "ferry", axis: "u", color: "#f6f2e8", accent: "#32528c" }));
        pen.item(14.0, () => pen.bird(3.5 + Math.sin(t) * 1.4, 8.2, 1.5, 0.7));
        for (const [tu, tv] of [[1.3, 1.3], [2.4, 2.4], [8.5, 1.4], [8.6, 3.0]]) {
          pen.item(tu + tv, () => pen.tree(tu, tv, 0.02, "round", 0.92));
        }
        const su = 1.0 + ((t * 0.7) % 8.0);
        pen.item(su + 5.1, () => pen.person(su, 5.1, 0.02, { shirt: "#c83c36", walk: true, seed: 12 }));
        pen.item(9.2 - su * 0.8 + 5.3, () => pen.person(9.2 - su * 0.8, 5.3, 0.02, { shirt: "#4a6c82", walk: true, dress: true, seed: 13 }));
      },
    },

    // (1,-1): Buckingham Palace & Changing of the Guard!
    "1,-1": {
      name: "Buckingham Palace & Guards",
      night: {
        flood: [
          { cols: nv("#e8dec6", "#f3ebd8", "#cdc1a3", "#e0d4b8", "#f1e8d2", "#efe6cf", "#dfd4b8", "#f6efdc", "#d9ceb4"), tint: "#ffd890", k: 0.8, gain: 1.4 },
          { cols: nv("#d9b24a", "#e6bd45", "#e8b23a"), tint: "#ffd060", k: 0.85, gain: 1.5 },
        ],
        lights: [
          { u: 5.0, v: 1.6, z: 2.0, r: 4.2, col: "#ffc873", a: 0.2 },
          { u: 5.0, v: 6.0, z: 0.1, r: 2.6, col: "#ffcf80", a: 0.22, flat: true },
        ],
        windows: 0.5,
      },
      camZ: 1.7,
      estElements: 230,
      draw(pen, t) {
        pen.tileBase(10, 10, "#eae1d2", { paving: 1.15 });
        pen.ground(3.3, 6.1, 3.4, 3.7, "#cf8f80", 0.02, PALETTE.ink, 0.65);

        pen.item(4.8, () => {
          pen.box(0.75, 0.65, 0, 8.5, 3.15, 2.1, C.stone, {
            plinth: true, pilasters: true,
            windows: { floors: 3, colsU: 9, colsV: 3, color: "#54636e", arched: true },
            cornice: true, parapet: true,
          });
          // Central Classical Royal Balcony & Pediment!
          pen.box(3.65, 3.75, 0.02, 2.7, 0.38, 2.2, "#f3ebdc", { shadow: false, noPlinth: true, pilasters: true });
          pen.flag(5.0, 2.2, 2.2, 1.2, ["#32528c", "#f6f2e8", "#c83c36"]);
          // Two red sentry guard boxes flanking the palace!
          pen.box(1.3, 3.9, 0.02, 0.48, 0.48, 0.95, C.busRed, { shadow: false, noPlinth: true, lw: 0.62 });
          pen.box(8.2, 3.9, 0.02, 0.48, 0.48, 0.95, C.busRed, { shadow: false, noPlinth: true, lw: 0.62 });
        });

        // Ornate Black & Gold Palace Gates!
        pen.item(10.2, () => pen.railing([0.8, 5.8], [9.2, 5.8], 0.02, 0.56, "#262524"));

        // 5 Scarlet King's Guards in tall black Bearskin Hats marching in crisp formation!
        const marchU = 2.6 + (0.5 + 0.5 * Math.sin(t * 1.1)) * 3.2;
        for (let i = 0; i < 5; i++) {
          const gu = marchU + i * 0.52;
          pen.item(gu + 5.0, () => pen.person(gu, 5.0, 0.02, {
            shirt: C.busRed, pants: "#232529", hat: "bearskin", walk: true, seed: i * 0.2, scale: 0.98,
          }));
        }

        // Ornate Golden Victoria Memorial Fountain & Flowerbeds!
        pen.item(13.2, () => {
          pen.cylinder(5.0, 7.9, 0.02, 1.2, 0.28, "#f3ede1", { lw: 0.8, flutes: 8 });
          pen.box(4.6, 7.5, 0.3, 0.8, 0.8, 0.98, "#f8f4eb", { shadow: false, noPlinth: true });
          pen.sphere(5.0, 7.9, 1.5, 0.24, C.gold, { lw: 0.58 });
          pen.flowerbed(1.0, 6.4, 1.8, 0.7, ["#c83c36", "#f2cf66", "#faf6ec"]);
          pen.flowerbed(7.2, 6.4, 1.8, 0.7, ["#c83c36", "#f2cf66", "#faf6ec"]);
          pen.lamp(3.3, 6.3, 0.02);
          pen.lamp(6.7, 6.3, 0.02);
        });
        for (const [tu, tv] of [[1.4, 7.7], [1.4, 8.9], [8.6, 7.7], [8.6, 8.9]]) {
          pen.item(tu + tv, () => pen.tree(tu, tv, 0.02, "round", 0.88));
        }
      },
    },

    // (1,0): St. Paul's Cathedral & Millennium Footbridge
    "1,0": {
      name: "St. Paul's & Millennium Bridge",
      night: {
        flood: [
          { cols: nv("#ecd6b0", "#f8ead0", "#d4b88e", "#b79c70", "#f6e8c8", "#e0c89a", "#a88e64"), tint: "#ffe0a0", k: 0.85, gain: 1.5 },
          { cols: nv("#8f95a6", "#a9aebd", "#5f6475"), tint: "#fff0cc", k: 0.7, gain: 1.9 },
          { cols: nv("#e3b53f", "#b98a22"), tint: "#ffd060", k: 0.85, gain: 1.5 },
        ],
        lights: [
          { u: 4.0, v: 2.55, z: 4.2, r: 2.4, col: "#ffd890", a: 0.3 },
          { u: 4.0, v: 2.55, z: 6.0, r: 0.7, col: "#fff0c0", a: 0.6 },
          { u: 4.0, v: 5.0, z: 0.1, r: 3.0, col: "#ffd080", a: 0.2, flat: true },
        ],
        windows: 0.4,
      },
      camZ: 1.9,
      estElements: 225,
      draw(pen, t) {
        pen.tileBase(10, 10, "#ebe3d3", { paving: 1.15 });
        pen.water(0.2, 6.8, 9.6, 3.0, C.thames, { z: -0.08, ripples: 9 });

        pen.item(6.5, () => {
          pen.box(1.55, 0.95, 0, 6.9, 3.65, 1.7, C.stone, {
            plinth: true, pilasters: true,
            windows: { floors: 2, colsU: 7, colsV: 3, color: "#586673", arched: true },
            cornice: true,
          });
          pen.stairs(3.8, 4.6, 0.02, 0.35, 2.4, 0.5, 3, "v", "#dfd5c3");
          pen.box(1.45, 3.6, 0, 1.15, 1.15, 2.6, C.stone, { pilasters: true, cornice: true });
          pen.dome(2.02, 4.18, 2.7, 0.46, 0.58, C.slate, { ribs: 5 });
          pen.box(7.4, 3.6, 0, 1.15, 1.15, 2.6, C.stone, { pilasters: true, cornice: true });
          pen.dome(7.98, 4.18, 2.7, 0.46, 0.58, C.slate, { ribs: 5 });
          pen.cylinder(5.0, 2.6, 1.75, 1.48, 0.98, "#f3ebdc", { lw: 0.85, flutes: 10 });
          pen.dome(5.0, 2.6, 2.73, 1.52, 1.8, "#7c8894", { ribs: 8, finialCol: C.gold });
        });

        pen.item(13.2, () => {
          pen.railing([0.4, 6.7], [4.3, 6.7], 0.02, 0.24);
          pen.railing([5.7, 6.7], [9.6, 6.7], 0.02, 0.24);
          pen.box(4.45, 5.4, 0.52, 1.1, 4.4, 0.14, "#f5f2eb", { shadow: false, noPlinth: true });
          pen.line([4.25, 5.4, 0.85], [4.25, 9.8, 0.85], "#aeb8bf", 1.25);
          pen.line([5.75, 5.4, 0.85], [5.75, 9.8, 0.85], "#aeb8bf", 1.25);
          for (let i = 0; i < 4; i++) {
            const pv = 5.7 + ((t * 0.7 + i * 1.0) % 3.8);
            pen.person(4.78 + (i % 2) * 0.44, pv, 0.66, { shirt: ["#c83c36", "#4f748c", "#d89a4a", "#6e8f66"][i], walk: true, seed: i + 4 });
          }
          pen.lamp(3.6, 6.3, 0.02);
          pen.lamp(6.4, 6.3, 0.02);
          pen.bench(2.2, 6.2, 0.02, "u");
        });
        pen.item(1.3 + 5.6, () => pen.tree(1.3, 5.6, 0.02, "round", 0.85));
        pen.item(8.7 + 5.6, () => pen.tree(8.7, 5.6, 0.02, "round", 0.85));
      },
    },

    // (1,1): Covent Garden Victorian Market Piazza & Street Juggler
    "1,1": {
      name: "Covent Garden Piazza",
      night: {
        flood: [
          { cols: nv("#e8d5a9", "#f3e6c3", "#cbb386"), tint: "#ffd48a", k: 0.6, gain: 1.35 },
          { cols: nv("#5d7486", "#6f9fb5", "#6b7f8e", "#d6eeec"), tint: "#ffd890", k: 0.75, gain: 1.5 },
        ],
        neon: ["#ffe596", "#ffc65e", "#ffe9a8", "#ffe3a0", "#f7b658"],
        lights: [
          { u: 5.0, v: 2.0, z: 3.2, r: 2.2, col: "#ffd080", a: 0.3 },
          { u: 5.0, v: 4.2, z: 1.0, r: 1.2, col: "#ffc870", a: 0.35 },
          { u: 1.6, v: 5.8, z: 1.6, r: 1.6, col: "#ffb868", a: 0.4 },
          { u: 6.2, v: 8.2, z: 1.4, r: 1.4, col: "#ffc070", a: 0.4 },
          { u: 5.0, v: 6.0, z: 0.0, r: 3.8, col: "#ffc070", a: 0.22, flat: true },
        ],
        nowin: [{ box: [2.5, 0, 7.5, 2.6, 10] }],
        windows: 0.55,
      },
      camZ: 1.6,
      estElements: 230,
      draw(pen, t) {
        pen.tileBase(10, 10, "#e7dfd0", { paving: 1.0 });
        pen.item(4.8, () => {
          pen.box(0.75, 0.65, 0, 8.5, 3.65, 1.8, C.stone, {
            plinth: true, pilasters: true,
            windows: { floors: 2, colsU: 7, colsV: 3, color: "#68899c", arched: true },
            cornice: true,
          });
          pen.gableRoof(1.15, 0.85, 1.91, 7.7, 3.25, 0.88, "#a9ceda", "u");
          pen.awning(1.1, 4.3, 0.62, 3.4, 0.68, "u", C.busRed, "#faf4e6");
          pen.awning(5.5, 4.3, 0.62, 3.4, 0.68, "u", "#4b7b66", "#faf4e6");
        });

        // Lively Piazza Market Stalls, Café Sets, Juggler & Red Postbox!
        pen.item(12.2, () => {
          pen.stall(0.8, 5.6, 0.02, 1.9, 0.88, C.busRed, "#faf4e6", ["#e67c8c", "#f2cf66", "#8aad6e"]);
          pen.cafeSet(8.0, 6.2, 0.02, "#4b7b66");
          pen.bench(1.6, 8.6, 0.02, "u");
          pen.lamp(3.3, 5.8, 0.02);
          pen.lamp(6.8, 5.8, 0.02);
          // Performer juggling 3 colorful bouncing balls!
          pen.person(5.0, 7.0, 0.02, { shirt: "#d89a4a", wave: true, seed: 1 });
          for (let b = 0; b < 3; b++) {
            const a = t * 5.2 + (b * Math.PI * 2) / 3;
            pen.sphere(5.0 + Math.cos(a) * 0.36, 7.0, 0.96 + Math.abs(Math.sin(a)) * 0.46, 0.08, ["#c83c36", "#e6b84c", "#4b8ea3"][b], { lw: 0.4 });
          }
          for (let i = 0; i < 7; i++) {
            const a = 0.2 + (i / 6) * (Math.PI - 0.4);
            pen.person(5.0 + Math.cos(a) * 1.48, 7.0 + Math.sin(a) * 1.28, 0.02, {
              shirt: ["#4f748c", "#c85244", "#6e8f66", "#7e6387", "#3d4652", "#d87f68", "#e6b44e"][i],
              dress: i % 3 === 0, wave: i % 2 === 0, seed: i + 10,
            });
          }
          pen.cylinder(8.4, 8.0, 0.02, 0.22, 0.68, C.busRed, { top: "#9e2d28", lw: 0.7 });
        });
        pen.item(1.3 + 7.6, () => pen.tree(1.3, 7.6, 0.02, "round", 0.88));
      },
    },

    // (0,1): Hyde Park & Organic Serpentine Lake
    "0,1": {
      name: "Hyde Park & Serpentine Lake",
      night: {
        flood: [
          { cols: nv("#2b5b47", "#4f8b6f", "#d9b24a"), tint: "#ffd890", k: 0.75, gain: 1.5 },
        ],
        lights: [
          { u: 3.3, v: 2.6, z: 1.6, r: 1.5, col: "#ffd48a", a: 0.55 },
          { u: 3.3, v: 2.6, z: 0.0, r: 2.1, col: "#ffc878", a: 0.3, flat: true },
          { u: 6.8, v: 4.7, z: 0.3, r: 0.9, col: "#ffb860", a: 0.3, flat: true },
          { u: 1.3, v: 7.6, z: 0.3, r: 0.8, col: "#ffb860", a: 0.25, flat: true },
        ],
        windows: 0.15,
      },
      camZ: 1.4,
      estElements: 215,
      draw(pen, t) {
        pen.tileBase(10, 10, C.grass);
        pen.grassDetail(0.4, 0.4, 9.2, 9.2, 37, true);
        pen.organicPond(5.0, 3.2, 3.85, 2.2, C.thames, { lilies: 6 });
        pen.curvedPath([[0.8, 6.2], [3.8, 5.9], [6.8, 6.3], [9.2, 5.8]], 0.68, "#ebe2d1");

        const b1 = 2.0 + ((t * 0.7) % 5.8), b2 = 7.8 - ((t * 0.55) % 5.8);
        pen.item(b1 + 2.7, () => pen.boat(b1, 2.7, -0.02, { style: "abra", axis: "u", accent: "#4b7b94" }));
        pen.item(b2 + 3.9, () => pen.boat(b2, 3.9, -0.02, { style: "swan" }));

        // Victorian Octagonal Bandstand Gazebo!
        pen.item(12.2, () => {
          pen.cylinder(7.1, 7.6, 0.02, 1.12, 0.36, "#e6dfd0", { flutes: 8 });
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            pen.line([7.1 + Math.cos(a) * 0.96, 7.6 + Math.sin(a) * 0.96, 0.38], [7.1 + Math.cos(a) * 0.96, 7.6 + Math.sin(a) * 0.96, 1.38], "#3d574a", 0.92);
          }
          pen.dome(7.1, 7.6, 1.38, 1.18, 0.68, "#4c6e5c", { ribs: 6 });
          pen.flowerbed(4.3, 7.2, 1.3, 0.7, ["#e67c8c", "#f2cf66", "#faf6ec"]);
          pen.bench(4.8, 8.6, 0.02, "u");
        });

        pen.item(10.8, () => {
          pen.ground(1.7, 6.9, 2.0, 1.6, "#f5eee0", 0.02, PALETTE.ink, 0.58);
          pen.ground(1.9, 7.1, 1.6, 1.2, "#c85244", 0.03, null);
          pen.person(2.3, 7.6, 0.03, { shirt: "#4f748c", seed: 2 });
          pen.person(3.1, 7.7, 0.03, { shirt: "#e0b34c", dress: true, seed: 3 });
        });
        for (const [tu, tv] of [[1.0, 8.8], [4.5, 6.6], [8.9, 6.2], [8.8, 8.9], [1.1, 1.2], [8.9, 1.3]]) {
          pen.item(tu + tv, () => pen.tree(tu, tv, 0.02, "round", 0.94));
        }
        const ju = 1.0 + ((t * 1.1) % 8.0);
        pen.item(ju + 6.1, () => {
          pen.person(ju, 6.1, 0.02, { shirt: "#c83c36", walk: true, seed: 22 });
          pen.dog(ju + 0.35, 6.18, 0.02, "#b58152", 22);
        });
      },
    },

    // (-1,1): The Shard, The Gherkin & City of London
    "-1,1": {
      name: "The Shard & City Skyline",
      night: {
        flood: [
          { box: [4.4, 0.95, 6.2, 2.75, 12.0], tint: "#cfe6ff", k: 0.55, gain: 1.5 },
          { box: [7.2, 0.5, 9.4, 2.7, 7.8], tint: "#bcd8ff", k: 0.5, gain: 1.4 },
        ],
        lights: [
          { u: 5.4, v: 2.0, z: 11.4, r: 0.9, col: "#ffffff", a: 0.85 },
          { u: 5.4, v: 2.0, z: 6.0, r: 2.6, col: "#9fc8ff", a: 0.16 },
          { u: 8.3, v: 1.6, z: 7.3, r: 0.8, col: "#bcd8ff", a: 0.4 },
          { u: 5.0, v: 6.2, z: 0.1, r: 2.4, col: "#9fc8ff", a: 0.2, flat: true },
        ],
        windows: 0.6,
      },
      camZ: 2.3,
      estElements: 215,
      draw(pen, t) {
        pen.tileBase(10, 10, "#e7e0d2", { paving: 1.15 });
        pen.ground(0.6, 6.1, 8.8, 3.3, "#efe7d7", 0.02);

        pen.item(5.2, () => {
          pen.cylinder(2.1, 3.0, 0, 1.05, 1.45, "#8fb2c2", { flutes: 10 });
          pen.cylinder(2.1, 3.0, 1.45, 1.14, 1.35, "#9ec0cf", { flutes: 10 });
          pen.dome(2.1, 3.0, 2.8, 1.14, 1.38, "#82a6b8", { pointed: true, ribs: 8, finial: false });
        });

        pen.item(7.6, () => {
          pen.pyramid(3.75, 1.75, 0, 2.65, 2.65, 6.55, C.glass, { left: "#b6d8e4", right: "#82aebf", lattice: 8 });
        });

        pen.item(8.4, () => {
          pen.box(7.25, 2.55, 0, 1.65, 1.65, 2.15, "#c8d6dc", { windows: { floors: 4, band: true, color: "#68899c" } });
          pen.box(7.1, 2.4, 2.15, 1.95, 1.95, 1.48, "#d8e5eb", { shadow: false, noPlinth: true, windows: { floors: 3, band: true, color: "#68899c" }, rooftop: true });
        });

        // Plaza fountain, café umbrellas, phone box, benches & umbrella commuters!
        pen.item(14.5, () => {
          pen.fountain(5.0, 7.6, 0.02, 0.65, { jets: 5, jetH: 0.48 });
          pen.cafeSet(2.6, 7.2, 0.02, "#4a7792");
          pen.cafeSet(7.4, 7.2, 0.02, C.busRed);
          pen.bench(2.6, 8.7, 0.02, "u");
          pen.lamp(4.0, 6.4, 0.02);
          pen.lamp(6.0, 6.4, 0.02);
        });
        for (let i = 0; i < 6; i++) {
          const cu = 1.0 + ((t * 0.75 + i * 1.55) % 8.0);
          pen.item(cu + 8.3, () => pen.person(cu, 8.1 + (i % 2) * 0.55, 0.02, {
            shirt: "#313842", walk: true, umbrella: i % 2 === 0 ? "#2e3540" : null, seed: i + 5,
          }));
        }
        pen.item(1.3 + 8.6, () => pen.tree(1.3, 8.6, 0.02, "round", 0.88));
        pen.item(8.7 + 8.6, () => pen.tree(8.7, 8.6, 0.02, "round", 0.88));
      },
    },

    // (-1,0): Notting Hill Pastel Townhouses, Portobello Stalls & Regent's Canal!
    "-1,0": {
      name: "Notting Hill & Regent's Canal",
      night: {
        lights: [
          { u: 5.0, v: 4.8, z: 0.0, r: 3.2, col: "#ffc070", a: 0.22, flat: true },
          { u: 5.0, v: 2.2, z: 0.0, r: 1.6, col: "#ffb860", a: 0.3, flat: true },
        ],
        windows: 0,
      },
      camZ: 1.5,
      estElements: 230,
      draw(pen, t) {
        pen.tileBase(10, 10, "#eae1d2", { paving: 1.05 });
        pen.water(0.2, 6.2, 9.6, 3.6, C.thames, { z: -0.08, ripples: 10 });

        const pastels = ["#f2c9d0", "#f5e3a4", "#b8dbc4", "#bdd6e8", "#d6c4e3"];
        pen.item(4.8, () => {
          for (let i = 0; i < 5; i++) {
            const hu = 0.5 + i * 1.8;
            pen.box(hu, 0.75, 0, 1.76, 2.85, 2.0 + (i % 2) * 0.18, pastels[i], {
              plinth: true,
              windows: { floors: 3, colsU: 2, colsV: 2, color: "#54636e", arched: true, balconies: true },
              cornice: true,
              rooftop: i % 2 === 0,
            });
            pen.box(hu + 0.55, 3.6, 0, 0.66, 0.28, 0.78, "#faf7f0", { shadow: false, noPlinth: true, lw: 0.58 });
          }
        });

        for (let i = 0; i < 3; i++) {
          const su = 1.1 + i * 3.0;
          pen.item(su + 5.1, () => pen.stall(su, 4.75, 0.02, 1.75, 0.82, ["#c83c36", "#4b7b94", "#d9a944"][i], "#faf4e6", ["#e67c8c", "#f2cf66", "#74bac6"]));
        }
        pen.item(11.5, () => {
          pen.railing([0.4, 6.1], [9.6, 6.1], 0.02, 0.24);
          pen.lamp(3.0, 5.9, 0.02);
          pen.lamp(7.0, 5.9, 0.02);
        });

        const nu = 1.4 + ((t * 0.85) % 7.2);
        pen.item(nu + 8.0, () => pen.boat(nu, 8.0, -0.06, { style: "narrowboat", axis: "u", accent: C.busRed }));
        const wu = 0.8 + ((t * 0.65) % 8.4);
        pen.item(wu + 5.7, () => pen.person(wu, 5.7, 0.02, { shirt: "#4f748c", walk: true, dress: true, seed: 4 }));
      },
    },
  },

  satellites: {
    nw: {
      name: "Tower of London",
      draw(pen) {
        pen.tileBase(4.8, 4.8, C.grass, { thick: 0.36 });
        pen.grassDetail(0.3, 0.3, 4.2, 4.2, 82, true);
        pen.item(4.8, () => {
          pen.box(1.1, 1.1, 0, 2.6, 2.6, 1.68, "#efe7d6", { plinth: true, windows: { floors: 2, colsU: 3, colsV: 3, color: "#586673", arched: true }, cornice: true });
          for (const [tu, tv] of [[1.1, 1.1], [3.7, 1.1], [1.1, 3.7], [3.7, 3.7]]) {
            pen.cylinder(tu, tv, 1.75, 0.25, 0.55, "#efe7d6");
            pen.dome(tu, tv, 2.3, 0.26, 0.32, C.slate, { finial: false, ribs: 4 });
          }
          pen.sphere(0.8, 4.1, 0.1, 0.1, "#262524", { lw: 0.4 });
          pen.sphere(1.4, 4.2, 0.1, 0.1, "#262524", { lw: 0.4 });
        });
      },
    },
    ne: {
      name: "Abbey Road Crossing",
      draw(pen, t) {
        pen.tileBase(4.8, 4.8, "#d5cec0", { thick: 0.36 });
        pen.ground(0.2, 0.2, 4.4, 0.9, C.grass, 0.02);
        pen.ground(0.2, 3.7, 4.4, 0.9, C.grass, 0.02);
        for (let i = 0; i < 4; i++) {
          pen.ground(1.5, 1.3 + i * 0.58, 1.8, 0.32, "#fbf8f2", 0.02, PALETTE.ink, 0.5);
        }
        const shift = Math.sin(t * 0.8) * 0.35;
        const suits = ["#f6f2e8", "#2d3036", "#586878", "#4d6b8a"];
        for (let i = 0; i < 4; i++) {
          const pu = 1.55 + i * 0.58 + shift;
          pen.item(pu + 2.4, () => pen.person(pu, 2.4, 0.03, { shirt: suits[i], walk: true, seed: i * 1.4, scale: 0.92 }));
        }
      },
    },
    sw: {
      name: "Natural History Museum",
      draw(pen) {
        pen.tileBase(4.8, 4.8, "#e8dfd0", { thick: 0.36, paving: 0.95 });
        pen.item(4.8, () => {
          pen.box(0.6, 1.0, 0, 3.6, 2.4, 1.38, "#d8a67b", { plinth: true, pilasters: true, windows: { floors: 2, colsU: 4, colsV: 2, color: "#685c4e", arched: true } });
          pen.gableRoof(0.6, 1.0, 1.38, 3.6, 2.4, 0.65, C.slate, "u");
          pen.box(1.9, 1.0, 1.38, 1.0, 1.0, 0.95, "#cf9b6e", { shadow: false, noPlinth: true });
          pen.pyramid(1.9, 1.0, 2.33, 1.0, 1.0, 0.85, C.slate);
        });
      },
    },
    se: {
      name: "Greenwich Observatory",
      draw(pen, t) {
        pen.tileBase(4.8, 4.8, C.grass, { thick: 0.36 });
        pen.grassDetail(0.3, 0.3, 4.2, 4.2, 92, true);
        pen.line([2.4, 0.3, 0.03], [2.4, 4.5, 0.03], C.gold, 2.0);
        pen.item(4.8, () => {
          pen.box(1.1, 0.9, 0.02, 2.6, 2.2, 1.2, C.brick, { plinth: true, windows: { floors: 2, colsU: 3, colsV: 2, color: "#586673", arched: true } });
          pen.dome(2.4, 2.0, 1.22, 0.86, 0.96, "#e6dfd0", { ribs: 6 });
          const drop = 0.5 + 0.5 * Math.sin(t * 1.5);
          pen.line([3.4, 2.4, 1.22], [3.4, 2.4, 2.68], PALETTE.ink, 0.9);
          pen.sphere(3.4, 2.4, 1.7 + drop * 0.75, 0.16, C.busRed, { lw: 0.6 });
        });
      },
    },
  },
};
