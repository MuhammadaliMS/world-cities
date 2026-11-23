// SHANGHAI — High-Fidelity v2 Ligne Claire Isometric World
// Dense architectural details: Lujiazui trio with elevated skywalk railings, Bund neoclassical pilasters
// & antique lamps, Yu Garden Dragon Wall & lotus koi pond, Tianzifang Shikumen lanes & craft stalls.

import { PALETTE, shade, lerp } from "../lib/iso-engine.js";

const C = {
  granite: "#e1d8c6",
  pearlPink: "#d46a74",
  pearlDark: "#b5505a",
  glass: "#94bcc9",
  glassHi: "#b8d4de",
  water: "#7da6b5",
  roofDark: "#454a52",
  cinnabar: "#c24438",
  gold: "#e0b64e",
  jade: "#7ca26c",
  brick: "#9e7d6c",
  whitewash: "#f4efe4",
};

// Detailed Oriental Pearl Tower (angled buttress piers, paneled rosy-coral spheres, transparent observation ring!)
function drawOrientalPearl(pen, cx, cy, t) {
  const legs = [[-1.18, 0.78], [1.18, 0.78], [0.0, -1.18]];
  for (const [lu, lv] of legs) {
    pen.box(cx + lu - 0.18, cy + lv - 0.18, 0, 0.36, 0.36, 0.25, "#d8d1c2", { shadow: false, noPlinth: true, lw: 0.6 });
    pen.line([cx + lu, cy + lv, 0.2], [cx, cy, 2.08], "#c9c4ba", 2.8);
    pen.line([cx + lu, cy + lv, 0.2], [cx, cy, 2.08], PALETTE.ink, 0.9);
  }
  pen.cylinder(cx, cy, 0, 0.26, 2.15, "#e2dcd0", { flutes: 4 });
  pen.sphere(cx, cy, 2.38, 0.88, C.pearlPink, { lw: 0.92 });
  // Equatorial transparent sightseeing band around lower pearl!
  pen.cylinder(cx, cy, 2.28, 0.64, 0.2, "#a8cedb", { lw: 0.58 });
  for (const [du, dv] of [[-0.25, 0.15], [0.25, 0.15], [0, -0.25]]) {
    pen.line([cx + du, cy + dv, 2.95], [cx + du * 0.8, cy + dv * 0.8, 5.15], "#ded8cc", 2.0);
    pen.line([cx + du, cy + dv, 2.95], [cx + du * 0.8, cy + dv * 0.8, 5.15], PALETTE.ink, 0.72);
  }
  pen.sphere(cx, cy, 5.2, 0.6, C.pearlPink, { lw: 0.88 });
  pen.cylinder(cx, cy, 5.62, 0.14, 0.86, "#e8e2d6");
  pen.sphere(cx, cy, 6.52, 0.28, C.pearlDark, { lw: 0.78 });
  pen.line([cx, cy, 6.78], [cx, cy, 8.28], PALETTE.ink, 1.12);
  const pulse = 0.5 + 0.5 * Math.sin(t * 4.5);
  pen.sphere(cx, cy, 8.32, 0.1 + pulse * 0.04, "#ff9ba3", { lw: 0.35 });
}

export default {
  id: "shanghai",
  name: "Shanghai",
  seed: 1994,
  heroFocus: { u: 5.2, v: 7.3, z: 1.0 },
  vehicles: [
    { style: "taxi", color: "#68b3b8" },
    { style: "taxi", color: "#e5c150" },
    { style: "sedan", color: "#3b424d" },
    { style: "sedan", color: "#ece6da" },
    { style: "tram", color: "#c94c42" },
    { style: "sedan", color: "#6e8da3" },
  ],
  tiles: {
    // CENTER (0,0): Lujiazui Trio + Circular Pedestrian Skywalk Micro-Story
    "0,0": {
      name: "Lujiazui & Oriental Pearl",
      night: { windows: 0.65 },
      camZ: 2.5,
      estElements: 235,
      draw(pen, t) {
        pen.tileBase(10, 10, "#e8e1d2", { paving: 1.25 });
        pen.ground(0.55, 0.55, 8.9, 8.9, C.jade, 0.02);
        pen.grassDetail(0.6, 0.6, 8.8, 8.8, 11, true);
        pen.item(6.0, () => {
          pen.flowerbed(1.2, 5.2, 1.8, 0.7, ["#e67c8c", "#f2cf66", "#faf6ec"]);
          pen.flowerbed(7.1, 4.6, 1.8, 0.7, ["#f2cf66", "#d46a74", "#faf6ec"]);
        });

        // Shanghai Tower cleanly on back-left
        pen.item(3.2, () => {
          for (let i = 0; i < 6; i++) {
            const w = 1.75 - i * 0.13;
            pen.box(0.8 + i * 0.07, 1.3 + i * 0.06, i * 0.94, w, w, 0.94, i % 2 === 0 ? C.glass : C.glassHi, {
              shadow: i === 0, noPlinth: true,
              windows: { floors: 2, band: true, color: "#628b9e" },
              lw: 0.7,
            });
          }
        });

        // SWFC "Bottle Opener" Tower cleanly on back-right
        pen.item(6.4, () => {
          pen.box(7.1, 1.2, 0, 1.78, 1.78, 3.9, "#8daab8", {
            windows: { floors: 6, band: true, color: "#5e7f91" },
          });
          pen.box(7.1, 1.2, 3.9, 0.4, 1.78, 1.08, "#8daab8", { shadow: false, noPlinth: true });
          pen.box(8.48, 1.2, 3.9, 0.4, 1.78, 1.08, "#8daab8", { shadow: false, noPlinth: true });
          pen.box(7.1, 1.2, 4.98, 1.78, 1.78, 0.42, "#a4c0ce", { shadow: false, noPlinth: true });
        });

        // Iconic Oriental Pearl Tower framed cleanly in center!
        pen.item(8.5, () => drawOrientalPearl(pen, 4.9, 3.5, t));

        // HERO MICRO-STORY: Elevated Circular Lujiazui Pedestrian Skywalk with Railings, Fountain & Tourists!
        pen.item(13.5, () => {
          pen.fountain(5.2, 7.4, 0.02, 0.72, { jets: 5, jetH: 0.55 });
          for (const [pu, pv] of [[3.2, 7.2], [5.2, 6.2], [7.2, 7.2], [5.2, 8.6]]) {
            pen.cylinder(pu, pv, 0.02, 0.18, 0.88, "#d4ccbc");
          }
          const rOuter = 2.08, rInner = 1.25, cx = 5.2, cy = 7.4;
          for (let i = 0; i < 14; i++) {
            const a0 = (i / 14) * Math.PI * 2, a1 = ((i + 1) / 14) * Math.PI * 2;
            const p0 = [cx + Math.cos(a0) * rOuter, cy + Math.sin(a0) * rOuter];
            const p1 = [cx + Math.cos(a1) * rOuter, cy + Math.sin(a1) * rOuter];
            pen.poly(
              [[p0[0], p0[1], 0.9], [p1[0], p1[1], 0.9], [cx + Math.cos(a1) * rInner, cy + Math.sin(a1) * rInner, 0.9], [cx + Math.cos(a0) * rInner, cy + Math.sin(a0) * rInner, 0.9]],
              "#f1e9da", PALETTE.ink, 0.68
            );
            pen.line([p0[0], p0[1], 1.15], [p1[0], p1[1], 1.15], "#6b737d", 0.75);
          }
          pen.person(4.45, 7.95, 0.92, { shirt: "#c8483e", dress: true, wave: true, seed: 1 });
          pen.person(5.1, 8.2, 0.92, { shirt: "#e6b44e", wave: true, seed: 2 });
          pen.person(5.75, 7.95, 0.92, { shirt: "#4f748c", flash: true, seed: 3 });
          const ang = t * 0.5;
          pen.person(cx + Math.cos(ang) * 1.65, cy + Math.sin(ang) * 1.65, 0.92, { shirt: "#d46a74", walk: true, seed: 4 });
        });

        pen.item(16.0, () => {
          pen.flag(8.6, 8.6, 0.02, 1.45, ["#c83e36", "#c83e36", "#e6c14c"]);
          pen.bench(2.1, 8.6, 0.02, "u");
          pen.lamp(3.0, 8.8, 0.02);
        });
        for (const [tu, tv] of [[1.3, 7.6], [8.5, 6.2], [2.4, 7.0], [8.4, 7.8]]) {
          pen.item(tu + tv, () => pen.tree(tu, tv, 0.02, "willow", 0.88));
        }
      },
    },

    // (-1,-1): The Bund & Huangpu River
    "-1,-1": {
      name: "The Bund & Huangpu River",
      night: {
        flood: [{ cols: ["#ead09c", "#f5e2b8", "#d2b27c", "#cdb48a", "#f0d8a8", "#efd6a4", "#e9d3a2", "#d9b98a", "#d8c294", "#ecd9ac", "#f3e3bf", "#efd9a8", "#efd4a2", "#eed3a0"], tint: "#ffd078", k: 0.5, gain: 1.35 }],
        lights: [{ u: 5.2, v: 1.9, z: 7.4, r: 1.1, col: "#fff0b8", a: 0.7 }, { u: 5, v: 3.6, z: 0.1, r: 5.5, col: "#ffbf55", a: 0.35, flat: true }, { u: 5, v: 2, z: 5, r: 5.2, col: "#ffb040", a: 0.2 }],
        windows: 0.7,
      },
      camZ: 1.7,
      estElements: 230,
      draw(pen, t) {
        pen.tileBase(10, 10, "#e9e1d2", { paving: 1.15 });
        pen.water(0.2, 5.6, 9.6, 4.2, C.water, { z: -0.09, ripples: 11 });
        pen.box(0.2, 5.25, 0, 9.6, 0.35, 0.24, "#cfc6b4", { shadow: false, noPlinth: true });
        pen.item(10.2, () => {
          pen.railing([0.3, 5.4], [9.7, 5.4], 0.24, 0.26);
          pen.lamp(2.2, 5.1, 0.02);
          pen.lamp(5.0, 5.1, 0.02);
          pen.lamp(7.8, 5.1, 0.02);
          pen.flowerbed(0.8, 3.8, 1.8, 0.65, ["#e67c8c", "#f2cf66", "#faf6ec"]);
          pen.flowerbed(7.4, 3.8, 1.8, 0.65, ["#e67c8c", "#f2cf66", "#faf6ec"]);
        });

        // Neoclassical Bund Row (Pilasters, Arched Windows, Customs House Clock & Peace Hotel Pyramid!)
        pen.item(4.8, () => {
          pen.box(0.55, 0.65, 0, 2.55, 2.85, 1.8, C.granite, {
            plinth: true, pilasters: true,
            windows: { floors: 3, colsU: 3, colsV: 3, color: "#546875", arched: true },
            cornice: true,
          });
          pen.dome(1.82, 2.08, 1.92, 0.74, 0.82, "#6f8d82", { ribs: 6 });

          pen.box(3.38, 0.65, 0, 2.65, 2.85, 2.0, "#e8dfcd", {
            plinth: true, pilasters: true,
            windows: { floors: 3, colsU: 3, colsV: 3, color: "#50616e", arched: true },
            cornice: true,
          });
          pen.box(4.02, 1.42, 2.11, 1.36, 1.36, 1.7, "#eee5d3", { shadow: false, noPlinth: true, cornice: true });
          pen.sphere(4.7, 2.8, 3.1, 0.38, "#f7e5a8", { lw: 0.72 });
          pen.pyramid(4.02, 1.42, 3.92, 1.36, 1.36, 0.7, "#687882");

          pen.box(6.28, 0.65, 0, 2.98, 2.85, 2.18, "#e0d6c4", {
            plinth: true, pilasters: true,
            windows: { floors: 4, colsU: 3, colsV: 3, color: "#50616e", arched: true },
            cornice: true,
          });
          pen.pyramid(6.55, 0.92, 2.3, 2.42, 2.32, 1.8, "#5c8f7b", { left: "#6ea892", right: "#45705f" });
        });

        for (let i = 0; i < 6; i++) {
          const pu = 1.2 + i * 1.55 + Math.sin(t * 0.6 + i) * 0.35;
          pen.item(pu + 4.75, () => pen.person(pu, 4.75, 0.02, { shirt: ["#c85244", "#4f748c", "#d89a4a", "#3d4652", "#e07a94", "#6e8f66"][i], walk: true, dress: i % 3 === 0, seed: i + 3 }));
        }
        const f1 = 1.2 + ((t * 0.95) % 7.4), f2 = 8.6 - ((t * 0.7) % 7.2);
        pen.item(f1 + 7.0, () => pen.boat(f1, 7.0, -0.07, { style: "ferry", axis: "u", color: "#f6f2e8", accent: "#c8463a" }));
        pen.item(f2 + 8.6, () => pen.boat(f2, 8.6, -0.07, { style: "narrowboat", axis: "u", accent: "#4b7b94" }));
        pen.item(13.0, () => pen.bird(3.2 + Math.sin(t) * 1.1, 7.5, 1.5, 0.4));
      },
    },

    // (0,-1): Yu Garden & Nine-Turn Zigzag Bridge with Lotus Koi Pond!
    "0,-1": {
      name: "Yu Garden & Zigzag Bridge",
      night: {
        flood: [{ cols: ["#a3302a", "#6b1d17", "#c4483a", "#7a241b"], tint: "#ff9a60", k: 0.35, gain: 1.3 }, { cols: ["#70747c", "#7d818a"], tint: "#ffd9a0", k: 0.22, gain: 1.25 }],
        neon: ["#f7cf7a", "#f4d564", "#f8e7a0"],
        lights: [{ u: 5, v: 4.5, z: 3, r: 3.2, col: "#ff9a50", a: 0.35 }, { u: 5, v: 4.5, z: 0.1, r: 4.2, col: "#ff8a40", a: 0.3, flat: true }, { u: 5, v: 4.5, z: 5.2, r: 1.4, col: "#ffd890", a: 0.3 }],
        windows: 0.35,
      },
      camZ: 1.5,
      estElements: 230,
      draw(pen, t) {
        pen.tileBase(10, 10, "#e7e0d2");
        pen.water(0.55, 2.2, 8.9, 7.25, "#6fa0ab", { z: -0.05, ripples: 9 });

        // Classical Yu Garden Hall + Wavy Whitewashed Dragon Wall!
        pen.item(3.5, () => {
          pen.box(0.75, 0.45, 0, 8.5, 1.65, 1.2, C.whitewash, {
            plinth: true, pilasters: true,
            windows: { floors: 1, colsU: 8, colsV: 1, color: "#7a4d38" },
          });
          pen.pagodaRoof(0.75, 0.45, 1.2, 8.5, 1.65, 0.65, C.roofDark, C.cinnabar);
        });

        // Nine-Turn Zigzag Bridge (Jiuquqiao) with Carved Stone Railings!
        pen.item(9.0, () => {
          const segs = [[0.9, 5.2, 1.9, 0.68], [2.15, 5.2, 0.68, 1.85], [2.15, 6.4, 2.45, 0.68], [5.6, 5.6, 2.05, 0.68], [6.95, 5.6, 0.68, 2.05], [6.95, 7.0, 2.1, 0.68]];
          for (const [su, sv, du, dv] of segs) {
            pen.box(su, sv, 0.04, du, dv, 0.15, "#e2d8c5", { shadow: false, noPlinth: true, lw: 0.68 });
          }
          pen.railing([2.15, 7.06], [4.55, 7.06], 0.19, 0.22, "#bfb5a2");
          pen.railing([6.95, 7.66], [9.0, 7.66], 0.19, 0.22, "#bfb5a2");
        });

        // Ornate Double-Eave Huxinting Teahouse Pavilion with Lanterns & Lattice Windows!
        pen.item(10.6, () => {
          pen.box(3.75, 4.15, 0.02, 2.5, 2.5, 0.26, "#dcd3c2", { shadow: false, noPlinth: true });
          pen.box(4.05, 4.45, 0.28, 1.9, 1.9, 0.98, C.cinnabar, { windows: { floors: 1, colsU: 3, colsV: 3, color: "#f6e5b8", litChance: 0.65 } });
          pen.pagodaRoof(4.05, 4.45, 1.26, 1.9, 1.9, 0.48, C.roofDark, C.cinnabar);
          pen.box(4.32, 4.72, 1.62, 1.36, 1.36, 0.68, C.cinnabar, { shadow: false, noPlinth: true, windows: { floors: 1, colsU: 2, colsV: 2, color: "#f6e5b8", litChance: 0.7 } });
          pen.pagodaRoof(4.32, 4.72, 2.3, 1.36, 1.36, 0.54, C.roofDark, C.gold);
          pen.lanternString(3.75, 6.45, 6.25, 6.45, 1.24, 4, "#d84438");
        });

        // Swimming Orange & White Koi Fish + Pink Lotus Lily Pads!
        for (let i = 0; i < 6; i++) {
          const a = t * 0.9 + i * 1.05;
          const ku = 2.4 + Math.cos(a) * 1.1 + (i % 2) * 4.5, kv = 7.9 + Math.sin(a) * 0.85;
          pen.item(ku + kv, () => pen.sphere(ku, kv, -0.02, 0.11, i % 2 === 0 ? "#e6743c" : "#f5f0e2", { lw: 0.42 }));
        }
        pen.item(1.2 + 8.6, () => pen.tree(1.2, 8.6, 0.02, "willow", 0.96));
        pen.item(8.8 + 3.2, () => pen.tree(8.8, 3.2, 0.02, "willow", 0.92));
        pen.item(1.5 + 3.2, () => pen.tree(1.5, 3.2, 0.02, "willow", 0.84));
        pen.item(3.3 + 6.7, () => pen.person(3.3, 6.7, 0.19, { shirt: "#c8463a", dress: true, wave: true, seed: 2 }));
        pen.item(7.6 + 7.3, () => pen.person(7.6, 7.3, 0.19, { shirt: "#4f748c", flash: true, seed: 5 }));
      },
    },

    // (1,-1): Nanjing Road Pedestrian Boulevard & Sightseeing Mini-Tram
    "1,-1": {
      name: "Nanjing Road Pedestrian Mall",
      night: {
        neon: ["#ff4a5a", "#ffd24a", "#e8353a", "#f6d878", "#e9c24d", "#fff0a0", "#fff3b8", "#c7332b"],
        lights: [{ u: 5, v: 5, z: 0.1, r: 5, col: "#ffb860", a: 0.28, flat: true }],
        windows: 0.65,
      },
      camZ: 1.7,
      estElements: 230,
      draw(pen, t) {
        pen.tileBase(10, 10, "#eae1d2", { paving: 1.05 });
        pen.ground(0.2, 3.4, 9.6, 3.2, "#e0d6c4", 0.02, PALETTE.ink, 0.65);

        pen.item(4.2, () => {
          pen.box(0.5, 0.5, 0, 2.75, 2.55, 2.45, "#e6d8be", {
            plinth: true, pilasters: true,
            windows: { floors: 4, colsU: 3, colsV: 2, color: "#586d7a", litChance: 0.45, arched: true },
            cornice: true, rooftop: true,
          });
          pen.box(3.55, 0.5, 0, 2.85, 2.55, 2.8, "#dfc8b8", {
            plinth: true, pilasters: true,
            windows: { floors: 4, colsU: 3, colsV: 2, color: "#586d7a", litChance: 0.55, arched: true },
            cornice: true,
          });
          pen.dome(4.98, 1.78, 2.9, 0.68, 0.72, "#6f8d82", { ribs: 5 });
          pen.box(6.7, 0.5, 0, 2.75, 2.55, 2.3, "#d8e0de", {
            plinth: true, pilasters: true,
            windows: { floors: 3, colsU: 3, colsV: 2, color: "#586d7a", litChance: 0.5 },
            cornice: true, rooftop: true,
          });
          pen.awning(0.5, 3.05, 0.5, 2.75, 0.4, "u", C.cinnabar, "#faf4e6");
          pen.awning(6.7, 3.05, 0.5, 2.75, 0.4, "u", "#4a7792", "#faf4e6");
          // Retro colorful vertical neon billboards!
          pen.box(1.4, 3.07, 0.75, 0.56, 0.16, 1.55, C.cinnabar, { shadow: false, noPlinth: true, lw: 0.58 });
          pen.box(4.7, 3.07, 0.9, 0.62, 0.16, 1.65, C.gold, { shadow: false, noPlinth: true, lw: 0.58 });
          pen.box(7.8, 3.07, 0.65, 0.56, 0.16, 1.45, "#5fa89e", { shadow: false, noPlinth: true, lw: 0.58 });
        });

        const trU = ((t * 1.45) % 11.4) - 0.7;
        if (trU > 0.3 && trU < 9.7) {
          pen.item(trU + 5.0, () => pen.vehicle(trU, 5.0, 0.02, { axis: "u", style: "tram", color: C.cinnabar }));
        }

        pen.item(14.5, () => {
          pen.box(0.55, 6.95, 0, 3.7, 2.45, 1.6, C.granite, { plinth: true, pilasters: true, windows: { floors: 2, colsU: 4, colsV: 2, color: "#688596" }, cornice: true, rooftop: true });
          pen.box(5.55, 6.95, 0, 3.9, 2.45, 1.7, "#e6d9c5", { plinth: true, pilasters: true, windows: { floors: 2, colsU: 4, colsV: 2, color: "#688596" }, cornice: true, rooftop: true });
          pen.lamp(3.0, 3.6, 0.02);
          pen.lamp(7.0, 3.6, 0.02);
          pen.bench(4.8, 7.6, 0.02, "v");
        });
        for (let i = 0; i < 8; i++) {
          const su = 0.8 + ((t * 0.6 + i * 1.25) % 8.4), sv = i % 2 === 0 ? 3.9 : 6.15;
          pen.item(su + sv, () => pen.person(su, sv, 0.02, { shirt: ["#c8463a", "#4f748c", "#d89a4a", "#6e8f66", "#7d6287", "#3d4652", "#e07a94", "#4a7b94"][i], walk: true, dress: i % 3 === 0, seed: i * 9 }));
        }
      },
    },

    // (1,0): Shanghai Maglev Guideway & Futuristic Glass Terminal
    "1,0": {
      name: "Shanghai Maglev Viaduct",
      night: { windows: 0.3, lights: [{ u: 5, v: 5, z: 0.1, r: 4.5, col: "#cfe4ff", a: 0.15, flat: true }] },
      camZ: 1.6,
      estElements: 205,
      draw(pen, t) {
        pen.tileBase(10, 10, C.jade);
        pen.grassDetail(0.4, 3.4, 9.2, 6.2, 41, true);
        pen.water(0.5, 0.5, 9.0, 2.8, C.water, { z: -0.06, ripples: 8 });

        pen.item(9.2, () => {
          for (const pu of [1.2, 3.8, 6.4, 8.8]) {
            pen.box(pu - 0.25, 4.7, 0, 0.5, 0.65, 1.35, "#d8d1c2", { shadow: false, noPlinth: true });
          }
          pen.box(0.2, 4.45, 1.35, 9.6, 1.1, 0.3, "#ede7da", { shadow: false, noPlinth: true });
          const mu = 2.2 + ((t * 3.4) % 5.6);
          pen.vehicle(mu, 5.0, 1.65, { axis: "u", style: "train", cars: 3, carLen: 1.25, color: "#fbf9f4", stripe: "#3b76b0" });
        });

        pen.item(12.2, () => {
          pen.flowerbed(0.65, 6.95, 1.45, 0.7, ["#e67c8c", "#f2cf66", "#faf6ec"]);
          pen.box(2.7, 6.75, 0.02, 4.6, 2.25, 1.2, C.glassHi, { windows: { floors: 2, band: true, color: "#5e8599" } });
          pen.dome(5.0, 7.88, 1.22, 1.4, 0.58, "#dde6ea", { finial: false, ribs: 7 });
          pen.bench(8.2, 6.8, 0.02, "u");
        });
        for (const [tu, tv] of [[1.3, 8.2], [8.6, 8.2], [1.4, 3.8], [8.6, 3.8]]) {
          pen.item(tu + tv, () => pen.tree(tu, tv, 0.02, "willow", 0.92));
        }
      },
    },

    // (1,1): Tianzifang & Shikumen Stone-Gate Lane Houses
    "1,1": {
      name: "Tianzifang Shikumen Lanes",
      night: { windows: 0.6, lights: [{ u: 5, v: 7, z: 0.1, r: 4, col: "#ffb860", a: 0.3, flat: true },
        { u: 2, v: 5, z: 1.2, r: 1.1, col: "#ffc070", a: 0.5 }, { u: 4, v: 2, z: 1.2, r: 1.1, col: "#ffc070", a: 0.5 }, { u: 7, v: 2.5, z: 1.2, r: 1.1, col: "#ffc070", a: 0.5 },
        { u: 8.2, v: 5, z: 1.2, r: 1.1, col: "#ffc070", a: 0.5 }, { u: 5.5, v: 3, z: 2.4, r: 1.2, col: "#ffb060", a: 0.4 }, { u: 3, v: 3, z: 2.4, r: 1.2, col: "#ffb060", a: 0.4 }] },
      camZ: 1.6,
      estElements: 230,
      draw(pen, t) {
        pen.tileBase(10, 10, "#dfd6c5", { paving: 0.95 });
        pen.item(5.2, () => {
          for (let i = 0; i < 3; i++) {
            const hu = 0.55 + i * 3.05;
            pen.box(hu, 0.65, 0, 2.75, 2.85, 1.6, i % 2 === 0 ? C.brick : "#b38d78", {
              plinth: true,
              windows: { floors: 2, colsU: 2, colsV: 2, color: "#4d5963", litChance: 0.5, arched: true },
            });
            pen.gableRoof(hu, 0.65, 1.6, 2.75, 2.85, 0.65, "#a85644", "u", { chimney: true });
            pen.box(hu + 0.95, 3.48, 0, 0.85, 0.15, 0.88, "#ede6d8", { shadow: false, noPlinth: true, lw: 0.62 });
          }
        });

        pen.item(10.0, () => {
          pen.lanternString(1.8, 3.6, 1.8, 6.4, 1.48, 4, "#d8463a");
          pen.lanternString(5.0, 3.6, 5.0, 6.4, 1.48, 4, "#e6b44e");
          pen.lanternString(8.2, 3.6, 8.2, 6.4, 1.48, 4, "#d8463a");
          pen.cafeSet(2.2, 5.2, 0.02, "#4a7792");
          pen.stall(6.8, 4.6, 0.02, 1.7, 0.8, C.cinnabar, "#faf4e6", ["#e6b44e", "#6fa0ab", "#e07a94"]);
        });

        pen.item(14.0, () => {
          pen.box(0.55, 6.5, 0, 3.45, 2.75, 1.4, "#b38d78", {
            plinth: true,
            windows: { floors: 2, colsU: 3, colsV: 2, color: "#f6dd94", litChance: 0.78 },
          });
          pen.gableRoof(0.55, 6.5, 1.4, 3.45, 2.75, 0.58, "#4d5259", "u", { chimney: true });
          pen.box(5.55, 6.5, 0, 3.65, 2.75, 1.45, C.brick, {
            plinth: true,
            windows: { floors: 2, colsU: 3, colsV: 2, color: "#f6dd94", litChance: 0.75 },
          });
          pen.gableRoof(5.55, 6.5, 1.45, 3.65, 2.75, 0.58, "#a85644", "u", { chimney: true });
        });

        for (let i = 0; i < 6; i++) {
          const su = 1.0 + ((t * 0.55 + i * 1.6) % 8.0);
          pen.item(su + 5.0, () => pen.person(su, 4.8 + (i % 2) * 0.55, 0.02, { shirt: ["#c8463a", "#5c8096", "#d89a4a", "#6e8f66", "#7e6387", "#3d4652"][i], walk: true, seed: i + 5 }));
        }
      },
    },

    // (0,1): Jing'an Golden Temple
    "0,1": {
      name: "Jing'an Golden Temple",
      night: {
        flood: [{ cols: ["#e8b63a", "#f8d96e", "#b47a1c", "#6e4210", "#d9a84f", "#c9923d", "#e8b63a"], tint: "#ffcc66", k: 0.55, gain: 1.3 }, { cols: ["#a8342b", "#7a2420", "#8a2c26"], tint: "#ff7a40", k: 0.6, gain: 1.4 }],
        neon: ["#fff8d0"],
        lights: [{ u: 5, v: 4, z: 8, r: 3.6, col: "#ffbf50", a: 0.3 }, { u: 5, v: 5, z: 0.1, r: 5, col: "#ffb040", a: 0.28, flat: true }],
        windows: 0.3,
      },
      camZ: 1.8,
      estElements: 220,
      draw(pen) {
        pen.tileBase(10, 10, "#e8e1d2", { paving: 1.1 });
        pen.ground(0.75, 0.75, 8.5, 8.5, "#e0d6c4", 0.02, PALETTE.ink, 0.7);

        pen.item(5.2, () => {
          pen.box(1.35, 0.75, 0.02, 7.3, 2.85, 1.6, "#9c6d45", {
            plinth: true, pilasters: true,
            windows: { floors: 2, colsU: 6, colsV: 2, color: "#4d382a" },
          });
          pen.stairs(4.1, 3.6, 0.02, 0.35, 1.8, 0.45, 3, "v", "#dfd5c3");
          pen.pagodaRoof(1.35, 0.75, 1.62, 7.3, 2.85, 0.88, C.gold, C.cinnabar);
          pen.box(2.55, 1.15, 2.25, 4.9, 1.85, 0.68, "#9c6d45", { shadow: false, noPlinth: true });
          pen.pagodaRoof(2.55, 1.15, 2.93, 4.9, 1.85, 0.68, shade(C.gold, 0.08), C.cinnabar);
        });

        pen.item(7.6, () => {
          for (let i = 0; i < 4; i++) {
            const w = 1.35 - i * 0.14;
            pen.box(1.6 - w * 0.5, 5.8 - w * 0.5, 0.02 + i * 0.68, w, w, 0.45, "#a67549", { shadow: i === 0, noPlinth: true });
            pen.pagodaRoof(1.6 - w * 0.5, 5.8 - w * 0.5, 0.47 + i * 0.68, w, w, 0.32, C.gold, C.cinnabar);
          }
        });

        pen.item(11.4, () => {
          pen.cylinder(5.2, 6.1, 0.02, 0.56, 0.7, "#6a6458", { top: C.gold, flutes: 6 });
          pen.smoke(5.2, 6.1, 0.78, 6);
          pen.lamp(3.6, 5.6, 0.02, "toro");
          pen.lamp(6.8, 5.6, 0.02, "toro");
          pen.person(4.35, 6.75, 0.02, { shirt: "#c8463a", dress: true, wave: true, seed: 2 });
          pen.person(6.05, 6.75, 0.02, { shirt: "#4f748c", seed: 3 });
        });

        pen.item(15.2, () => {
          pen.box(2.75, 8.05, 0.02, 4.5, 1.15, 1.1, "#8f613c", { plinth: true });
          pen.pagodaRoof(2.75, 8.05, 1.12, 4.5, 1.15, 0.58, C.gold, C.cinnabar);
        });
        pen.item(8.5 + 6.5, () => pen.tree(8.5, 6.5, 0.02, "pine", 0.94));
        pen.item(8.5 + 4.4, () => pen.tree(8.5, 4.4, 0.02, "pine", 0.84));
      },
    },

    // (-1,1): Zhujiajiao Water Town Canal & Arched Fangsheng Bridge
    "-1,1": {
      name: "Zhujiajiao Water Town",
      night: {
        neon: ["#e8c35a", "#e8b94a", "#c9382f", "#d8602f"],
        lights: [{ u: 5, v: 5, z: 0.1, r: 4.5, col: "#ff9a4a", a: 0.3, flat: true }, { u: 5, v: 6, z: 0.05, r: 2.2, col: "#ff8a40", a: 0.45, flat: true },
          { u: 3, v: 3, z: 1.6, r: 1.2, col: "#ffc070", a: 0.5 }, { u: 5.5, v: 2.5, z: 1.6, r: 1.2, col: "#ffc070", a: 0.5 }, { u: 8, v: 4, z: 1.6, r: 1.2, col: "#ffc070", a: 0.5 }, { u: 7, v: 7, z: 1.6, r: 1.2, col: "#ff9a50", a: 0.45 }],
        windows: 0.55,
      },
      camZ: 1.5,
      estElements: 225,
      draw(pen, t) {
        pen.tileBase(10, 10, "#e9e1d2", { paving: 1.05 });
        pen.water(0.2, 3.3, 9.6, 3.5, C.water, { z: -0.08, ripples: 10 });

        pen.item(4.2, () => {
          for (let i = 0; i < 3; i++) {
            const hu = 0.5 + i * 3.1;
            pen.box(hu, 0.45, 0, 2.85, 2.45, 1.4, C.whitewash, {
              plinth: true,
              windows: { floors: 2, colsU: 2, colsV: 2, color: "#6e4e38" },
            });
            pen.pagodaRoof(hu, 0.45, 1.4, 2.85, 2.45, 0.58, C.roofDark, C.cinnabar);
            pen.sphere(hu + 1.4, 3.05, 1.15, 0.11, "#d84438", { lw: 0.45 });
          }
        });

        const bu = 1.2 + ((t * 0.75) % 7.5);
        pen.item(bu + 5.1, () => pen.boat(bu, 5.1, -0.06, { style: "sampan", axis: "u", accent: "#3f5b6b" }));

        pen.item(10.6, () => {
          const steps = 10;
          for (let i = 0; i < steps; i++) {
            const f0 = i / steps, f1 = (i + 1) / steps;
            const v0 = lerp(2.85, 7.25, f0), v1 = lerp(2.85, 7.25, f1);
            const z0 = Math.sin(f0 * Math.PI) * 1.15, z1 = Math.sin(f1 * Math.PI) * 1.15;
            pen.poly([[4.35, v0, z0], [5.65, v0, z0], [5.65, v1, z1], [4.35, v1, z1]], "#f0e8d7", PALETTE.ink, 0.75);
            pen.line([5.65, v0, z0 + 0.32], [5.65, v1, z1 + 0.32], "#b8afa0", 1.1);
            pen.line([5.65, v0, z0], [5.65, v0, z0 + 0.32], "#b8afa0", 0.55);
          }
        });

        pen.item(14.2, () => {
          pen.box(0.55, 7.15, 0, 2.9, 2.25, 1.25, C.whitewash, { plinth: true, windows: { floors: 1, colsU: 2, colsV: 2, color: "#6e4e38" } });
          pen.pagodaRoof(0.55, 7.15, 1.25, 2.9, 2.25, 0.52, C.roofDark, C.cinnabar);
          pen.cafeSet(6.4, 8.5, 0.02, "#4a7792");
          pen.tree(8.6, 8.1, 0.02, "willow", 0.96);
          pen.tree(7.5, 7.6, 0.02, "willow", 0.86);
          pen.person(5.0, 5.1, 1.16, { shirt: "#c8463a", dress: true, wave: true, seed: 8 });
        });
      },
    },

    // (-1,0): Century Park, Organic Lotus Lake, Kites & Tai Chi Circle
    "-1,0": {
      name: "Century Park & Tai Chi Lawn",
      night: { windows: 0.2 },
      camZ: 1.4,
      estElements: 215,
      draw(pen, t) {
        pen.tileBase(10, 10, C.jade);
        pen.grassDetail(0.4, 0.4, 9.2, 9.2, 66, true);
        pen.organicPond(3.1, 2.7, 2.55, 2.1, C.water, { lilies: 6 });
        pen.curvedPath([[1.0, 6.0], [3.5, 5.4], [6.2, 6.6], [8.8, 5.2]], 0.72, "#e8dfd0");
        pen.cylinder(6.2, 6.6, 0.02, 2.18, 0.06, "#efe7d8", { lw: 0.75 });

        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const pu = 6.2 + Math.cos(a) * 1.28, pv = 6.6 + Math.sin(a) * 1.28;
          pen.item(pu + pv, () => pen.person(pu, pv, 0.08, { shirt: "#f7f4ec", pants: "#465461", wave: true, seed: i * 0.1 }));
        }

        pen.item(11.0, () => {
          pen.kite(1.9, 7.6, 0.02, "#d84c42");
          pen.kite(3.3, 8.4, 0.02, "#e6b44e");
          pen.person(1.9, 7.6, 0.02, { shirt: "#4f748c", seed: 10 });
          pen.person(3.3, 8.4, 0.02, { shirt: "#c85244", dress: true, seed: 11 });
          pen.flowerbed(6.6, 2.2, 2.1, 0.75, ["#e67c8c", "#f2cf66", "#faf6ec"]);
          pen.bench(6.6, 3.5, 0.02, "u");
        });

        const bu = 1.6 + Math.sin(t * 0.7) * 0.9;
        pen.item(bu + 2.8, () => pen.boat(bu + 1.4, 2.8, -0.02, { style: "swan" }));
        for (const [tu, tv] of [[7.6, 1.3], [8.8, 3.6], [1.3, 6.2], [8.8, 8.4]]) {
          pen.item(tu + tv, () => pen.tree(tu, tv, 0.02, "willow", 0.94));
        }
      },
    },
  },

  satellites: {
    nw: {
      name: "Waibaidu Bridge",
      draw(pen, t) {
        pen.tileBase(4.8, 4.8, C.water, { thick: 0.36 });
        pen.water(0.2, 0.2, 4.4, 4.4, C.water, { z: 0.01, ripples: 4 });
        pen.item(4.8, () => {
          pen.box(0.2, 1.7, 0.35, 4.4, 1.4, 0.14, "#cfd4d6", { shadow: false, noPlinth: true });
          for (const vOff of [1.75, 3.05]) {
            pen.polyline([[0.3, vOff, 0.5], [1.4, vOff, 1.55], [3.4, vOff, 1.55], [4.5, vOff, 0.5]], "#58626b", 1.5);
            pen.line([1.4, vOff, 0.5], [1.4, vOff, 1.55], "#58626b", 1.0);
            pen.line([2.4, vOff, 0.5], [2.4, vOff, 1.55], "#58626b", 1.0);
            pen.line([3.4, vOff, 0.5], [3.4, vOff, 1.55], "#58626b", 1.0);
          }
          const tu = 0.8 + ((t * 1.1) % 3.2);
          pen.vehicle(tu, 2.4, 0.49, { axis: "u", style: "tram", color: "#c8463a" });
        });
      },
    },
    ne: {
      name: "1933 Old Millfun",
      draw(pen) {
        pen.tileBase(4.8, 4.8, "#e6dfd0", { thick: 0.36, paving: 0.95 });
        pen.item(4.8, () => {
          pen.box(0.8, 0.8, 0, 3.2, 3.2, 1.65, "#cfc9be", { plinth: true, windows: { floors: 3, colsU: 3, colsV: 3, color: "#5d6770" }, cornice: true });
          pen.cylinder(2.4, 2.4, 1.75, 0.95, 0.35, "#b8b2a6", { flutes: 6 });
        });
      },
    },
    sw: {
      name: "Longhua Pagoda",
      draw(pen) {
        pen.tileBase(4.8, 4.8, C.jade, { thick: 0.36 });
        pen.grassDetail(0.3, 0.3, 4.2, 4.2, 91, true);
        pen.item(4.8, () => {
          for (let i = 0; i < 6; i++) {
            const w = 1.6 - i * 0.15;
            pen.box(2.4 - w * 0.5, 2.4 - w * 0.5, i * 0.52, w, w, 0.36, "#c78e63", { shadow: i === 0, noPlinth: true, lw: 0.68 });
            pen.pagodaRoof(2.4 - w * 0.5, 2.4 - w * 0.5, i * 0.52 + 0.36, w, w, 0.24, C.roofDark, C.cinnabar);
          }
          pen.line([2.4, 2.4, 3.3], [2.4, 2.4, 4.15], C.gold, 1.45);
        });
      },
    },
    se: {
      name: "Storybook Castle",
      draw(pen) {
        pen.tileBase(4.8, 4.8, "#e8e0cf", { thick: 0.36, paving: 0.95 });
        pen.item(4.8, () => {
          pen.box(1.1, 1.1, 0, 2.6, 2.6, 1.25, "#f2e7dc", { plinth: true, windows: { floors: 2, colsU: 3, colsV: 3, color: "#68899c", arched: true } });
          pen.cylinder(1.4, 1.4, 1.25, 0.32, 0.85, "#f2e7dc");
          pen.pyramid(1.08, 1.08, 2.1, 0.64, 0.64, 0.85, "#6b98b8");
          pen.cylinder(3.4, 1.4, 1.25, 0.32, 0.85, "#f2e7dc");
          pen.pyramid(3.08, 1.08, 2.1, 0.64, 0.64, 0.85, "#6b98b8");
          pen.cylinder(2.4, 2.4, 1.25, 0.45, 1.35, "#f7efe4");
          pen.pyramid(1.95, 1.95, 2.6, 0.9, 0.9, 1.15, "#5c88ab");
          pen.sphere(2.4, 2.4, 3.8, 0.14, C.gold, { lw: 0.4 });
        });
      },
    },
  },
};
