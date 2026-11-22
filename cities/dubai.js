// DUBAI — High-Fidelity v2 Ligne Claire Isometric World
// Dense architectural details: slender 9-tier Burj Khalifa, curved billowing Burj Al Arab sail,
// keyhole Atlantis arch, filigree golden Dubai Frame, souk spice stalls, luxury marina piers & desert oasis.

import { PALETTE, shade, lerp } from "../lib/iso-engine.js";

const C = {
  sand: "#ebd9b9",
  sandDark: "#d8be92",
  glass: "#9fc4d3",
  glassHi: "#c8dfe8",
  water: "#73bcc0",
  gold: "#d9a944",
  ochre: "#d4b483",
  terracotta: "#c6855c",
  grass: "#87a966",
  atlantis: "#e09c8a",
  white: "#f6f2e8",
};

// Slender 9-Tier Telescoping Y-Shaped Burj Khalifa!
function drawBurjKhalifa(pen, cx, cy, t) {
  const tiers = [
    { z: 0.0, h: 1.05, r: 1.38 },
    { z: 1.05, h: 1.05, r: 1.15 },
    { z: 2.1, h: 1.0, r: 0.94 },
    { z: 3.1, h: 0.98, r: 0.76 },
    { z: 4.08, h: 0.95, r: 0.6 },
    { z: 5.03, h: 0.92, r: 0.46 },
    { z: 5.95, h: 0.88, r: 0.34 },
    { z: 6.83, h: 0.82, r: 0.22 },
  ];
  for (let i = 0; i < tiers.length; i++) {
    const tr = tiers[i];
    pen.box(cx - tr.r, cy - tr.r * 0.52, tr.z, tr.r * 2, tr.r * 1.04, tr.h, C.glass, {
      shadow: i === 0, noPlinth: true,
      windows: { floors: 2, band: true, color: "#6a95a8" },
      lw: 0.72,
    });
    pen.box(cx - tr.r * 0.52, cy - tr.r, tr.z, tr.r * 1.04, tr.r * 2, tr.h * 0.88, C.glassHi, {
      shadow: false, noPlinth: true,
      windows: { floors: 2, band: true, color: "#78a2b5" },
      lw: 0.72,
    });
  }
  pen.cylinder(cx, cy, 7.65, 0.11, 0.72, "#dce8ed", { lw: 0.68 });
  pen.line([cx, cy, 8.37], [cx, cy, 9.35], PALETTE.ink, 1.08);
  const pulse = 0.5 + 0.5 * Math.sin(t * 4.0);
  pen.sphere(cx, cy, 9.38, 0.09 + pulse * 0.04, "#fff4c2", { lw: 0.35 });
}

// Smooth 14-Slice Billowing Sail Burj Al Arab with Helipad & Exoskeleton!
function drawBurjAlArab(pen, cx, cy) {
  const slices = 14;
  for (let i = 0; i < slices; i++) {
    const f = i / slices;
    const z = 0.22 + f * 3.9;
    const belly = Math.sin(f * Math.PI * 0.88) * 0.92;
    const w = 1.42 - f * 0.88 + belly * 0.36;
    const d = 1.08 - f * 0.65;
    pen.box(cx - w * 0.5, cy - d * 0.5, z, w, d, 0.32, i % 2 === 0 ? C.white : "#e4eff2", {
      shadow: i === 0, noPlinth: true, lw: 0.65,
    });
  }
  // Turquoise central vertical glass atrium spine
  pen.line([cx, cy + 0.55, 0.35], [cx, cy + 0.25, 3.85], "#6fb8c4", 2.6);
  // External diagonal white exoskeleton frame
  pen.line([cx - 1.12, cy + 0.72, 0.22], [cx + 0.28, cy + 0.1, 4.22], PALETTE.ink, 1.25);
  pen.line([cx + 1.12, cy - 0.52, 0.22], [cx + 0.28, cy + 0.1, 4.22], PALETTE.ink, 1.25);
  // Cantilevered green circular Helipad!
  pen.cylinder(cx - 0.72, cy + 0.25, 3.35, 0.44, 0.1, "#98c084", { lw: 0.72 });
  pen.line([cx, cy, 4.22], [cx, cy, 5.15], PALETTE.ink, 1.0);
}

export default {
  id: "dubai",
  name: "Dubai",
  seed: 2010,
  heroFocus: { u: 5.2, v: 7.4, z: 0.6 },
  vehicles: [
    { style: "supercar", color: "#d64a3e" },
    { style: "supercar", color: "#e8c448" },
    { style: "sedan", color: "#f5f2ea" },
    { style: "taxi", color: "#e8dec8" },
    { style: "supercar", color: "#68b0c4" },
    { style: "sedan", color: "#3a404a" },
  ],
  tiles: {
    // CENTER (0,0): Burj Khalifa & Dancing Dubai Fountain Show
    "0,0": {
      name: "Burj Khalifa & Dubai Fountain",
      camZ: 2.5,
      estElements: 235,
      draw(pen, t) {
        pen.tileBase(10, 10, "#eee4d1", { paving: 1.2 });
        // Landscaped Burj Park lawns with flowers & hedges flanking the tower base
        pen.ground(0.5, 0.5, 2.3, 4.1, C.grass, 0.02);
        pen.grassDetail(0.5, 0.5, 2.3, 4.1, 1, true);
        pen.ground(7.2, 0.5, 2.3, 4.1, C.grass, 0.02);
        pen.grassDetail(7.2, 0.5, 2.3, 4.1, 2, true);
        pen.item(6.5, () => {
          pen.flowerbed(0.7, 3.7, 1.9, 0.7, ["#e67c8c", "#f2cf66", "#faf6ec"]);
          pen.flowerbed(7.4, 3.7, 1.9, 0.7, ["#e67c8c", "#f2cf66", "#faf6ec"]);
        });

        pen.water(0.6, 5.1, 8.8, 3.6, C.water, { z: -0.06, ripples: 10 });
        pen.ground(0.4, 8.7, 9.2, 1.0, "#f3ebdc", 0.02);

        pen.item(6.5, () => drawBurjKhalifa(pen, 5.0, 2.8, t));
        pen.item(9.5, () => pen.bird(2.5 + Math.sin(t * 0.9) * 0.8, 2.0, 4.2, 0.4));

        // 5 Synchronized Dancing Dubai Fountain Plumes!
        for (let i = 0; i < 5; i++) {
          const fu = 1.9 + i * 1.55;
          const waveH = 0.7 + 0.68 * Math.abs(Math.sin(t * 2.4 - i * 0.55));
          pen.item(fu + 6.9, () => pen.fountain(fu, 6.9, -0.04, 0.55, { basin: false, jets: 5, jetH: waveH }));
        }

        // HERO MICRO-STORY: Waterfront Promenade Bridge with Railings, Lamps & Cheering Crowd!
        pen.item(14.0, () => {
          pen.box(3.5, 8.3, 0.02, 3.2, 0.65, 0.16, "#dfd4bf", { shadow: false, noPlinth: true });
          pen.railing([0.5, 8.7], [3.5, 8.7], 0.02, 0.25);
          pen.railing([6.7, 8.7], [9.5, 8.7], 0.02, 0.25);
          pen.lamp(3.5, 8.7, 0.02);
          pen.lamp(6.7, 8.7, 0.02);
          pen.person(4.2, 8.8, 0.18, { shirt: "#c95848", flash: true, seed: 1 });
          pen.person(4.8, 8.85, 0.18, { shirt: "#f7f3ea", dress: true, wave: true, seed: 2 });
          pen.person(5.4, 8.8, 0.18, { shirt: "#4f748c", flash: true, seed: 3 });
          pen.person(6.0, 8.85, 0.18, { shirt: "#d8a446", wave: true, seed: 4 });
        });

        pen.item(12.2, () => pen.flag(8.8, 3.1, 0.02, 1.55, ["#c8443a", "#528c5c", "#f6f2e8", "#2d2a28"]));
        for (const [tu, tv] of [[1.3, 1.3], [1.3, 3.0], [8.7, 1.3], [1.4, 9.15], [8.6, 9.15]]) {
          pen.item(tu + tv, () => pen.tree(tu, tv, 0.02, "palm", 0.92));
        }
      },
    },

    // (-1,-1): Burj Al Arab & Jumeirah Beach
    "-1,-1": {
      name: "Burj Al Arab & Jumeirah Beach",
      camZ: 1.9,
      estElements: 205,
      draw(pen, t) {
        pen.tileBase(10, 10, C.water);
        pen.water(0.2, 0.2, 9.6, 6.7, C.water, { z: -0.06, ripples: 11 });
        pen.ground(0.2, 6.85, 9.6, 2.95, C.sand, 0.02);

        pen.item(9.2, () => {
          // Causeway bridge with lamps & railings
          pen.box(4.5, 4.4, 0.06, 1.0, 2.6, 0.12, "#eae1d2", { shadow: false, noPlinth: true });
          pen.railing([4.52, 4.6], [4.52, 6.8], 0.18, 0.2);
          pen.railing([5.48, 4.6], [5.48, 6.8], 0.18, 0.2);
          pen.cylinder(5.0, 3.2, -0.04, 1.92, 0.24, "#e6d8be", { lw: 0.85 });
          drawBurjAlArab(pen, 5.0, 3.2);
        });

        const bu = 1.2 + ((t * 0.8) % 2.5);
        pen.item(bu + 5.2, () => pen.boat(bu, 5.2, -0.04, { style: "sailboat", accent: "#d9a944" }));
        pen.item(7.8 + 4.8, () => pen.boat(7.8, 4.8, -0.04, { style: "yacht", color: "#fbf9f4" }));
        pen.item(10.0, () => pen.bird(2.2 + Math.sin(t * 1.1) * 1.1, 2.5, 2.4, 0.3));

        // Beach cabanas, umbrellas, sunbathers & palm trees!
        for (let i = 0; i < 3; i++) {
          const uu = 1.4 + i * 2.9;
          pen.item(uu + 8.2, () => {
            pen.cafeSet(uu, 8.2, 0.02, ["#c95346", "#4b8ea3", "#e2b24a"][i]);
            pen.person(uu + 0.65, 8.65, 0.02, { shirt: "#e07a68", dress: i === 1, seed: i + 5 });
          });
        }
        pen.item(8.8 + 7.8, () => pen.tree(8.8, 7.8, 0.02, "palm", 0.92));
        pen.item(0.8 + 8.8, () => pen.tree(0.8, 8.8, 0.02, "palm", 0.85));
      },
    },

    // (0,-1): Palm Jumeirah & Atlantis Arch Resort
    "0,-1": {
      name: "Palm Jumeirah & Atlantis",
      camZ: 1.6,
      estElements: 220,
      draw(pen, t) {
        pen.tileBase(10, 10, C.water);
        pen.water(0.2, 0.2, 9.6, 9.6, C.water, { z: -0.05, ripples: 11 });

        pen.ground(4.35, 3.1, 1.3, 6.5, C.sand, 0.02);
        for (let i = 0; i < 3; i++) {
          const fv = 4.2 + i * 1.68;
          pen.ground(1.1, fv, 3.3, 0.72, C.sand, 0.02);
          pen.ground(5.6, fv, 3.3, 0.72, C.sand, 0.02);
        }
        pen.ground(1.0, 0.75, 8.0, 2.2, C.sand, 0.02);

        // Iconic Salmon-Pink Atlantis Arch Resort with Keyhole Portal & Arabian Turrets!
        pen.item(4.2, () => {
          pen.box(1.9, 0.95, 0.02, 2.0, 1.45, 1.8, C.atlantis, {
            plinth: true, pilasters: true,
            windows: { floors: 3, colsU: 3, colsV: 2, color: "#68899c", arched: true },
            cornice: true,
          });
          pen.box(6.1, 0.95, 0.02, 2.0, 1.45, 1.8, C.atlantis, {
            plinth: true, pilasters: true,
            windows: { floors: 3, colsU: 3, colsV: 2, color: "#68899c", arched: true },
            cornice: true,
          });
          pen.box(3.9, 1.05, 1.18, 2.2, 1.25, 0.74, C.atlantis, { shadow: false, noPlinth: true, cornice: true });
          pen.dome(2.9, 1.68, 1.92, 0.56, 0.68, "#c98574", { pointed: true, ribs: 5 });
          pen.dome(7.1, 1.68, 1.92, 0.56, 0.68, "#c98574", { pointed: true, ribs: 5 });
          pen.dome(5.0, 1.68, 2.02, 0.48, 0.6, C.gold, { pointed: true, ribs: 5 });
        });

        // Animated Sleek White Palm Monorail gliding along the central trunk!
        const mv = 4.2 + (0.5 + 0.5 * Math.sin(t * 0.9)) * 4.4;
        pen.line([5.0, 3.1, 0.25], [5.0, 9.5, 0.25], "#c9c1b0", 2.2);
        pen.item(5.0 + mv, () => pen.vehicle(5.0, mv, 0.26, { axis: "v", style: "train", cars: 2, carLen: 1.05, color: "#f7f4ec", stripe: "#4799a8" }));

        // Tiny waterfront villas & palms dotting all 6 palm fronds!
        for (let i = 0; i < 3; i++) {
          const fv = 4.5 + i * 1.68;
          pen.item(2.2 + fv, () => {
            pen.box(2.5, fv - 0.15, 0.02, 0.72, 0.45, 0.35, "#f5efe2", { shadow: false, noPlinth: true, lw: 0.52 });
            pen.tree(1.7, fv, 0.02, "palm", 0.62);
          });
          pen.item(8.0 + fv, () => {
            pen.box(6.7, fv - 0.15, 0.02, 0.72, 0.45, 0.35, "#f5efe2", { shadow: false, noPlinth: true, lw: 0.52 });
            pen.tree(8.3, fv, 0.02, "palm", 0.62);
          });
        }
      },
    },

    // (1,-1): Museum of the Future & Dubai Metro
    "1,-1": {
      name: "Museum of the Future & Metro",
      camZ: 1.8,
      estElements: 205,
      draw(pen, t) {
        pen.tileBase(10, 10, "#eae1d2", { paving: 1.25 });
        pen.cylinder(4.8, 3.7, 0, 2.8, 0.6, C.grass, { top: "#95b672", lw: 0.85 });
        pen.item(8.0, () => {
          pen.flowerbed(1.2, 4.8, 1.8, 0.7, ["#e67c8c", "#f2cf66", "#faf6ec"]);
          pen.flowerbed(7.0, 4.8, 1.8, 0.7, ["#b28cd6", "#f2cf66", "#faf6ec"]);
        });

        // Sculptural Silver Hollow Torus (Museum of the Future) with Arabic Calligraphic Window Reliefs!
        pen.item(8.5, () => {
          const [cx, cy] = pen.pt(4.8, 3.7, 2.3);
          const rx = pen.scale * 2.2, ry = pen.scale * 1.58;
          const outer = [];
          for (let i = 0; i < 26; i++) {
            const a = (i / 26) * Math.PI * 2;
            outer.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
          }
          pen.screenPoly(outer, "#cedce2", PALETTE.ink, 1.15);
          const hi = [];
          for (let i = 0; i < 14; i++) {
            const a = Math.PI * 0.9 + (i / 14) * Math.PI;
            hi.push([cx + Math.cos(a) * rx * 0.84, cy + Math.sin(a) * ry * 0.84]);
          }
          pen.screenPoly(hi, "#e8f2f5", null, 0);
          const hole = [];
          for (let i = 0; i < 20; i++) {
            const a = (i / 20) * Math.PI * 2;
            hole.push([cx + Math.cos(a) * rx * 0.44, cy + Math.sin(a) * ry * 0.46]);
          }
          pen.screenPoly(hole, PALETTE.paper, PALETTE.ink, 1.05);
          // Delicate layered Arabic-style calligraphic curved cutout flourishes!
          for (let k = -2; k <= 2; k++) {
            pen.screenPoly(
              [[cx - rx * 0.74, cy + k * ry * 0.34], [cx - rx * 0.48, cy + k * ry * 0.34 - 5], [cx + rx * 0.48, cy + k * ry * 0.34 + 5], [cx + rx * 0.74, cy + k * ry * 0.34 - 2]],
              null, "#496370", 0.82, false
            );
          }
        });

        // Elevated Dubai Metro Viaduct + Futuristic Station Canopy + Sliding Metro Train!
        pen.item(12.2, () => {
          for (const pu of [1.4, 5.0, 8.6]) {
            pen.cylinder(pu, 7.6, 0, 0.25, 1.25, "#d8d1c2", { flutes: 4 });
          }
          pen.box(0.2, 7.1, 1.25, 9.6, 1.0, 0.25, "#ece6da", { shadow: false, noPlinth: true });
          const tu = 2.2 + ((t * 2.2) % 5.6);
          pen.vehicle(tu, 7.6, 1.5, { axis: "u", style: "train", cars: 3, carLen: 1.2, color: "#f6f3ec", stripe: "#499eb0" });
          pen.lamp(2.4, 8.9, 0.02);
          pen.lamp(7.6, 8.9, 0.02);
        });
        for (const [tu, tv] of [[1.2, 1.5], [8.6, 1.8], [1.4, 8.9], [8.5, 8.9]]) {
          pen.item(tu + tv, () => pen.tree(tu, tv, 0.02, "palm", 0.88));
        }
      },
    },

    // (1,0): Dubai Frame & Zabeel Park
    "1,0": {
      name: "Dubai Frame & Zabeel Park",
      camZ: 2.1,
      estElements: 210,
      draw(pen, t) {
        pen.tileBase(10, 10, C.grass);
        pen.grassDetail(0.4, 0.4, 9.2, 9.2, 72, true);
        pen.ground(1.1, 4.1, 7.8, 1.9, "#efe6d5", 0.02);
        pen.ground(4.0, 1.1, 2.0, 7.8, "#efe6d5", 0.02);
        pen.item(9.0, () => {
          pen.flowerbed(1.2, 2.6, 2.2, 0.75, ["#e67c8c", "#f2cf66", "#faf6ec"]);
          pen.flowerbed(6.6, 2.6, 2.2, 0.75, ["#b28cd6", "#f2cf66", "#faf6ec"]);
          pen.bench(2.4, 6.3, 0.02, "u");
          pen.bench(7.6, 6.3, 0.02, "u");
        });

        // Monumental Golden Dubai Frame with Geometric Filigree Lattice & Glass Skybridge!
        pen.item(10.0, () => {
          pen.box(2.2, 4.15, 0.02, 5.6, 1.7, 0.46, "#e5dcc9", { plinth: true });
          pen.box(2.45, 4.38, 0.48, 0.88, 1.18, 3.95, C.gold, {
            noPlinth: true,
            windows: { floors: 6, colsU: 2, colsV: 2, color: "#b5852e", litChance: 0.3 },
          });
          pen.box(6.67, 4.38, 0.48, 0.88, 1.18, 3.95, C.gold, {
            noPlinth: true,
            windows: { floors: 6, colsU: 2, colsV: 2, color: "#b5852e", litChance: 0.3 },
          });
          pen.box(2.45, 4.38, 4.43, 5.1, 1.18, 0.68, shade(C.gold, 0.08), {
            shadow: false, noPlinth: true,
            windows: { floors: 1, band: true, color: "#9ac2cf" },
          });
          const vu = 3.5 + (0.5 + 0.5 * Math.sin(t * 0.9)) * 2.8;
          pen.person(vu, 5.12, 4.54, { shirt: "#c85244", scale: 0.65, seed: 2 });
        });

        pen.item(12.6, () => {
          pen.fountain(5.0, 7.6, 0.02, 0.78, { jets: 6, jetH: 0.58 });
          pen.lamp(3.6, 7.4, 0.02);
          pen.lamp(6.4, 7.4, 0.02);
        });
        for (const [tu, tv] of [[1.5, 1.5], [8.5, 1.5], [1.5, 8.2], [8.5, 8.2]]) {
          pen.item(tu + tv, () => pen.tree(tu, tv, 0.02, "palm", 0.94));
        }
        const ju = 1.6 + ((t * 0.85) % 6.8);
        pen.item(ju + 5.4, () => pen.person(ju, 5.4, 0.02, { shirt: "#4f748c", walk: true, seed: 9 }));
      },
    },

    // (1,1): Al Fahidi Wind-Towers, Spice Souk & Dubai Creek Abras!
    "1,1": {
      name: "Al Fahidi & Dubai Creek",
      camZ: 1.5,
      estElements: 225,
      draw(pen, t) {
        pen.tileBase(10, 10, C.sand, { paving: 1.15 });
        pen.water(0.2, 5.6, 9.6, 4.2, C.water, { z: -0.08, ripples: 10 });
        pen.box(0.2, 5.25, 0, 9.6, 0.35, 0.2, "#cbb694", { shadow: false, noPlinth: true });

        // Historic Al Fahidi Sandstone Courtyard Houses with Detailed Barjeel Wind-Towers!
        pen.item(5.2, () => {
          pen.box(0.55, 0.65, 0, 3.65, 3.6, 1.5, C.ochre, {
            plinth: true, parapet: true,
            windows: { floors: 2, colsU: 3, colsV: 3, color: "#6b5038", arched: true },
          });
          pen.box(1.48, 1.55, 1.5, 1.18, 1.18, 1.4, shade(C.ochre, 0.06), { shadow: false, noPlinth: true, hatch: true });
          pen.line([1.3, 2.6, 2.45], [2.85, 2.6, 2.45], "#6e4d32", 1.3);
          pen.line([1.3, 2.6, 2.15], [2.85, 2.6, 2.15], "#6e4d32", 1.1);

          pen.box(4.75, 0.85, 0, 4.5, 3.2, 1.35, "#debe8c", {
            plinth: true, parapet: true,
            windows: { floors: 2, colsU: 4, colsV: 3, color: "#6b5038", arched: true },
          });
          pen.box(6.6, 1.75, 1.35, 1.08, 1.08, 1.25, C.terracotta, { shadow: false, noPlinth: true, hatch: true });
        });

        // Lively Spice & Gold Souk Stalls with colorful spice mounds!
        pen.item(9.5, () => {
          pen.stall(1.2, 4.25, 0.02, 1.8, 0.82, "#c94c3e", "#f5e8cc", ["#e6b44e", "#c8463a", "#7da05c"]);
          pen.stall(4.8, 4.2, 0.02, 1.9, 0.85, "#4b7b94", "#f5e8cc", ["#e8a23c", "#d66248", "#f0cf54"]);
          pen.stall(7.1, 4.2, 0.02, 1.7, 0.85, "#b86b3e", "#f5e8cc", ["#d9a944", "#c8463a", "#e8c456"]);
        });

        const a1 = 1.2 + ((t * 1.0) % 7.4), a2 = 8.6 - ((t * 0.85) % 7.4);
        pen.item(a1 + 6.9, () => pen.boat(a1, 6.9, -0.06, { style: "abra", axis: "u", accent: "#c94c3e" }));
        pen.item(a2 + 8.5, () => pen.boat(a2, 8.5, -0.06, { style: "abra", axis: "u", accent: "#4b7b94" }));
        pen.item(12.0, () => pen.bird(3.8 + Math.sin(t) * 1.2, 7.6, 1.5, 0.6));
        pen.item(4.2 + 4.9, () => pen.person(4.2, 4.9, 0.02, { shirt: "#f7f4ec", wave: true, seed: 3 }));
        pen.item(9.0 + 4.8, () => pen.tree(9.0, 4.8, 0.02, "palm", 0.85));
      },
    },

    // (0,1): Dubai Marina, Wooden Yacht Piers & Luxury Skyline!
    "0,1": {
      name: "Dubai Marina & Yacht Harbor",
      camZ: 1.9,
      estElements: 220,
      draw(pen, t) {
        pen.tileBase(10, 10, "#ebe2d1", { paving: 1.15 });
        pen.water(0.2, 4.6, 9.6, 3.6, C.water, { z: -0.08, ripples: 10 });
        // Wooden yacht marina finger-piers!
        pen.box(2.2, 4.6, 0.02, 0.42, 1.4, 0.08, "#a87e54", { shadow: false, noPlinth: true, lw: 0.55 });
        pen.box(6.4, 4.6, 0.02, 0.42, 1.4, 0.08, "#a87e54", { shadow: false, noPlinth: true, lw: 0.55 });

        pen.item(4.6, () => {
          pen.box(0.55, 0.55, 0, 2.05, 2.65, 3.7, C.glass, { windows: { floors: 6, band: true, color: "#6892a6" }, rooftop: true });
          pen.box(2.95, 0.45, 0, 2.25, 2.85, 4.45, C.ochre, { windows: { floors: 7, band: true, color: "#7aa0b2" }, cornice: true });
          pen.dome(4.08, 1.88, 4.55, 0.74, 0.68, C.gold, { ribs: 6 });
          pen.box(5.55, 0.65, 0, 2.05, 2.55, 3.3, C.glassHi, { windows: { floors: 5, band: true, color: "#5e8599" }, rooftop: true });
          pen.box(7.85, 0.75, 0, 1.65, 2.35, 2.6, "#e6dcc8", { windows: { floors: 4, band: true, color: "#6b8da0" }, rooftop: true });
        });

        const y1 = 1.4 + ((t * 0.95) % 7.2), y2 = 8.4 - ((t * 0.75) % 7.0);
        pen.item(y1 + 5.7, () => pen.boat(y1, 5.7, -0.06, { style: "yacht", axis: "u", color: "#fbf9f4" }));
        pen.item(y2 + 7.2, () => pen.boat(y2, 7.2, -0.06, { style: "yacht", axis: "u", color: "#f3efe6" }));

        pen.item(15.0, () => {
          pen.railing([0.4, 8.25], [9.6, 8.25], 0.02, 0.24);
          pen.cafeSet(2.8, 9.0, 0.02, "#4b8ea3");
          pen.cafeSet(5.8, 9.0, 0.02, "#d9a944");
          pen.lamp(4.4, 8.5, 0.02);
        });
        for (const tu of [1.2, 4.2, 7.2, 9.0]) {
          pen.item(tu + 9.0, () => pen.tree(tu, 9.0, 0.02, "palm", 0.8));
        }
        const su = 1.0 + ((t * 0.7) % 8.0);
        pen.item(su + 8.8, () => pen.person(su, 8.8, 0.02, { shirt: "#c85648", walk: true, seed: 11 }));
      },
    },

    // (-1,1): Ain Dubai & Bluewaters Island
    "-1,1": {
      name: "Ain Dubai & Bluewaters Island",
      camZ: 2.0,
      estElements: 205,
      draw(pen, t) {
        pen.tileBase(10, 10, "#ede4d2", { paving: 1.2 });
        pen.water(0.2, 6.1, 9.6, 3.7, C.water, { z: -0.08, ripples: 10 });

        pen.item(4.2, () => {
          pen.box(0.7, 0.65, 0, 2.9, 2.05, 1.2, "#f3ebdc", { windows: { floors: 2, band: true, color: "#7aa0b2" }, rooftop: true });
          pen.awning(0.7, 2.7, 0.45, 2.9, 0.45, "u", "#4b8ea3", "#faf4e6");
          pen.box(6.4, 0.65, 0, 2.9, 2.05, 1.2, "#f3ebdc", { windows: { floors: 2, band: true, color: "#7aa0b2" }, rooftop: true });
          pen.awning(6.4, 2.7, 0.45, 2.9, 0.45, "u", "#d9a944", "#faf4e6");
        });

        pen.item(9.2, () => {
          pen.ferrisWheel(5.0, 4.2, 0.02, 2.6, "u", 16, "#f7f4ec", "#a4cedb", { speed: 0.25, podSize: 0.22 });
          pen.railing([0.4, 6.0], [9.6, 6.0], 0.02, 0.22);
          pen.cafeSet(2.6, 5.2, 0.02, "#4b8ea3");
          pen.cafeSet(7.4, 5.2, 0.02, "#c85244");
        });

        const bu = 1.5 + ((t * 0.85) % 7.0);
        pen.item(bu + 8.0, () => pen.boat(bu, 8.0, -0.06, { style: "sailboat", accent: "#4b8ea3" }));
        pen.item(1.3 + 5.2, () => pen.tree(1.3, 5.2, 0.02, "palm", 0.88));
        pen.item(8.7 + 5.2, () => pen.tree(8.7, 5.2, 0.02, "palm", 0.88));
        pen.item(4.8 + 5.6, () => pen.person(4.8, 5.6, 0.02, { shirt: "#d89a4a", wave: true, seed: 5 }));
      },
    },

    // (-1,0): Desert Safari Dunes & Oasis Camp
    "-1,0": {
      name: "Desert Safari Dunes & Oasis",
      camZ: 1.5,
      estElements: 205,
      draw(pen, t) {
        pen.tileBase(10, 10, C.sand);
        pen.item(4.5, () => {
          pen.pyramid(0.25, 0.35, 0, 5.5, 4.2, 1.6, "#e5c894", { left: "#edd4a4", right: "#cfa872" });
          pen.pyramid(4.15, 0.75, 0, 5.3, 4.0, 1.35, "#e3c48e", { left: "#ebd09e", right: "#caa26c" });
        });

        // Organic Desert Oasis Pool + Bedouin Camp Tent & Woven Carpet!
        pen.organicPond(7.0, 7.2, 1.65, 1.25, "#6eb5b5", { rimCol: "#9ab26d" });
        pen.item(10.8, () => {
          pen.box(1.0, 5.7, 0.02, 2.7, 2.25, 0.92, "#f5eee0", { noPlinth: true });
          pen.pyramid(0.85, 5.55, 0.94, 3.0, 2.55, 0.88, "#b8473c", { left: "#c95346", right: "#9c382f" });
          pen.flag(2.35, 6.8, 1.82, 0.7, ["#c8443a", "#e6b84c"]);
          // Woven Bedouin carpet & campfire outside tent!
          pen.ground(3.8, 6.6, 1.3, 1.0, "#c8463a", 0.025, PALETTE.ink, 0.5);
          pen.smoke(4.45, 7.1, 0.15, 3);
        });

        // 4-Camel Caravan plodding along the dune ridge!
        for (let i = 0; i < 4; i++) {
          const cu = 1.0 + ((t * 0.55 + i * 1.45) % 7.8);
          const cv = 4.65 + Math.sin(cu * 0.7) * 0.42;
          pen.item(cu + cv, () => {
            const bob = Math.abs(Math.sin(t * 4.5 + i)) * 0.04;
            pen.box(cu - 0.35, cv - 0.14, 0.24 + bob, 0.7, 0.28, 0.3, "#b98e5d", { shadow: false, noPlinth: true, lw: 0.62 });
            pen.sphere(cu, cv, 0.62 + bob, 0.17, "#b98e5d", { lw: 0.52 });
            pen.box(cu + 0.28, cv - 0.1, 0.45 + bob, 0.22, 0.2, 0.34, "#b98e5d", { shadow: false, noPlinth: true, lw: 0.58 });
            pen.person(cu, cv, 0.68 + bob, { shirt: "#f7f3ea", scale: 0.68, seed: i + 1 });
          });
        }

        const jU = 1.2 + ((t * 1.35) % 7.6);
        pen.item(jU + 9.0, () => pen.vehicle(jU, 9.0, 0.02, { axis: "u", style: "sedan", color: "#f6f3eb" }));
        pen.item(8.6 + 6.3, () => pen.tree(8.6, 6.3, 0.02, "palm", 0.92));
        pen.item(5.4 + 8.4, () => pen.tree(5.4, 8.4, 0.02, "palm", 0.88));
        pen.item(8.3 + 8.3, () => pen.tree(8.3, 8.3, 0.02, "palm", 0.8));
      },
    },
  },

  satellites: {
    nw: {
      name: "The World Islands",
      draw(pen, t) {
        pen.tileBase(4.8, 4.8, C.water, { thick: 0.36 });
        pen.water(0.2, 0.2, 4.4, 4.4, C.water, { z: 0.01, ripples: 5 });
        for (const [iu, iv, r] of [[1.4, 1.5, 0.55], [2.9, 1.4, 0.62], [2.2, 2.9, 0.52], [3.5, 3.1, 0.45]]) {
          pen.item(iu + iv, () => pen.cylinder(iu, iv, 0.02, r, 0.12, C.sand, { lw: 0.68 }));
        }
        const bu = 1.1 + Math.sin(t * 1.1) * 0.7;
        pen.item(7.0, () => pen.boat(bu + 1.1, 3.9, 0.02, { style: "yacht" }));
      },
    },
    ne: {
      name: "Miracle Garden",
      draw(pen) {
        pen.tileBase(4.8, 4.8, C.grass, { thick: 0.36 });
        pen.grassDetail(0.3, 0.3, 4.2, 4.2, 81, true);
        const cols = ["#e07a94", "#e6b44e", "#c75878", "#9a74b8"];
        for (let i = 0; i < 4; i++) {
          pen.item(2.5 + i, () => pen.dome(2.4, 1.2 + i * 0.75, 0.02, 1.15, 1.35, cols[i], { finial: false, ribs: 5 }));
        }
      },
    },
    sw: {
      name: "Global Village",
      draw(pen) {
        pen.tileBase(4.8, 4.8, "#ebd8b7", { thick: 0.36 });
        pen.item(4.8, () => {
          pen.box(0.8, 1.2, 0, 3.2, 1.8, 1.38, C.terracotta, { plinth: true, windows: { floors: 1, colsU: 3, colsV: 2, color: "#684a32", arched: true } });
          pen.dome(1.5, 2.1, 1.38, 0.45, 0.65, C.gold, { pointed: true, ribs: 4 });
          pen.dome(3.3, 2.1, 1.38, 0.45, 0.65, C.gold, { pointed: true, ribs: 4 });
          pen.flag(2.4, 2.1, 1.38, 1.1, ["#c8443a", "#528c5c", "#f6f2e8"]);
        });
      },
    },
    se: {
      name: "Cayan Twisted Tower",
      draw(pen) {
        pen.tileBase(4.8, 4.8, "#e8dfd0", { thick: 0.36, paving: 0.95 });
        pen.item(4.8, () => {
          for (let i = 0; i < 8; i++) {
            const off = Math.sin(i * 0.45) * 0.25;
            pen.box(1.5 + off, 1.5 - off * 0.7, i * 0.48, 1.65, 1.65, 0.48, i % 2 === 0 ? C.glass : C.glassHi, {
              shadow: i === 0, noPlinth: true,
              windows: { floors: 1, band: true, color: "#6892a6" },
              lw: 0.68,
            });
          }
        });
      },
    },
  },
};
