// TOKYO — High-Fidelity v2 Ligne Claire Isometric World
// Dense architectural details: curved pagoda rafters, stone Torō lanterns, Nakamise stalls,
// truss Tokyo Tower with animated elevator, catenary Shinkansen, organic lotus ponds, and lively crowds.

import { PALETTE, shade, lerp } from "../lib/iso-engine.js";

const C = {
  vermilion: "#cc4837",
  roofDark: "#464c56",
  plaster: "#ede5d5",
  wood: "#9c754f",
  sakura: "#f1b9c7",
  water: "#82b0c2",
  grass: "#87a86b",
  stone: "#dbd2c1",
  gold: "#dfb654",
  neonPink: "#e07a94",
  neonCyan: "#74bac6",
  neonAmber: "#e6b44e",
};

// Detailed Japanese Torii Gate with stone pillar bases & inscribed central tablet
function drawTorii(pen, u, v, z, span, h, col = C.vermilion, axis = "u") {
  const half = span * 0.5;
  if (axis === "u") {
    pen.cylinder(u - half, v, z, 0.19, 0.28, "#525250", { lw: 0.65 });
    pen.cylinder(u + half, v, z, 0.19, 0.28, "#525250", { lw: 0.65 });
    pen.cylinder(u - half, v, z + 0.25, 0.14, h - 0.25, col, { lw: 0.75 });
    pen.cylinder(u + half, v, z + 0.25, 0.14, h - 0.25, col, { lw: 0.75 });
    pen.box(u - half - 0.28, v - 0.1, z + h * 0.72, span + 0.56, 0.2, 0.16, col, { shadow: false, noPlinth: true, lw: 0.68 });
    pen.box(u - 0.18, v - 0.11, z + h * 0.76, 0.36, 0.22, 0.34, "#2d2a28", { shadow: false, noPlinth: true, lw: 0.55 });
    pen.box(u - half - 0.44, v - 0.14, z + h - 0.04, span + 0.88, 0.28, 0.2, col, { shadow: false, noPlinth: true, lw: 0.78 });
    pen.box(u - half - 0.5, v - 0.16, z + h + 0.14, span + 1.0, 0.32, 0.11, "#373c44", { shadow: false, noPlinth: true, lw: 0.7 });
  } else {
    pen.cylinder(u, v - half, z, 0.19, 0.28, "#525250", { lw: 0.65 });
    pen.cylinder(u, v + half, z, 0.19, 0.28, "#525250", { lw: 0.65 });
    pen.cylinder(u, v - half, z + 0.25, 0.14, h - 0.25, col, { lw: 0.75 });
    pen.cylinder(u, v + half, z + 0.25, 0.14, h - 0.25, col, { lw: 0.75 });
    pen.box(u - 0.1, v - half - 0.28, z + h * 0.72, 0.2, span + 0.56, 0.16, col, { shadow: false, noPlinth: true, lw: 0.68 });
    pen.box(u - 0.14, v - half - 0.44, z + h - 0.04, 0.28, span + 0.88, 0.2, col, { shadow: false, noPlinth: true, lw: 0.78 });
    pen.box(u - 0.16, v - half - 0.5, z + h + 0.14, 0.32, span + 1.0, 0.11, "#373c44", { shadow: false, noPlinth: true, lw: 0.7 });
  }
}

// Ornate 5-story Vermilion Pagoda with golden Sorin spire rings!
function drawPagoda(pen, cx, cy, z) {
  let cz = z;
  pen.box(cx - 0.9, cy - 0.9, z, 1.8, 1.8, 0.2, "#d8d0be", { shadow: false, noPlinth: true });
  cz += 0.2;
  for (let i = 0; i < 5; i++) {
    const w = 1.4 - i * 0.14, h = 0.52;
    pen.box(cx - w * 0.5, cy - w * 0.5, cz, w, w, h, C.vermilion, {
      shadow: i === 0, noPlinth: true, lw: 0.72,
      windows: { floors: 1, colsU: 2, colsV: 2, color: "#f6e5b8", litChance: 0.45 },
    });
    pen.pagodaRoof(cx - w * 0.5, cy - w * 0.5, cz + h, w, w, 0.34, C.roofDark, C.vermilion);
    cz += h + 0.28;
  }
  pen.line([cx, cy, cz], [cx, cy, cz + 1.05], C.gold, 1.9);
  pen.sphere(cx, cy, cz + 0.55, 0.1, C.gold, { lw: 0.4 });
  pen.sphere(cx, cy, cz + 0.88, 0.08, C.gold, { lw: 0.4 });
}

// High-Fidelity Open-Lattice Tokyo Tower with FootTown Base & Climbing Glass Elevator!
function drawTokyoTower(pen, cx, cy, t) {
  // FootTown visitor pavilion tucked under the 4 splayed legs!
  pen.box(cx - 0.85, cy - 0.85, 0.02, 1.7, 1.7, 0.52, "#ebe3d3", {
    shadow: false, noPlinth: true,
    windows: { floors: 1, band: true, color: "#7aa0b2" },
  });
  const bands = [
    { z0: 0.0, z1: 1.48, w0: 1.28, w1: 0.78, col: C.vermilion },
    { z0: 1.48, z1: 2.68, w0: 0.78, w1: 0.52, col: "#f6f2e8" },
    { z0: 2.68, z1: 3.92, w0: 0.52, w1: 0.34, col: C.vermilion },
    { z0: 3.92, z1: 5.18, w0: 0.34, w1: 0.2, col: "#f6f2e8" },
    { z0: 5.18, z1: 6.4, w0: 0.2, w1: 0.1, col: C.vermilion },
  ];
  for (let idx = 0; idx < bands.length; idx++) {
    const b = bands[idx];
    pen.poly([[cx - b.w0, cy + b.w0, b.z0], [cx + b.w0, cy + b.w0, b.z0], [cx + b.w1, cy + b.w1, b.z1], [cx - b.w1, cy + b.w1, b.z1]], b.col, PALETTE.ink, 0.8);
    pen.poly([[cx + b.w0, cy - b.w0, b.z0], [cx + b.w0, cy + b.w0, b.z0], [cx + b.w1, cy + b.w1, b.z1], [cx + b.w1, cy - b.w1, b.z1]], shade(b.col, -0.11), PALETTE.ink, 0.8);
    // Double-X open truss cross-bracing!
    for (let k = 0; k < 2; k++) {
      const f0 = k / 2, f1 = (k + 1) / 2;
      const wa = lerp(b.w0, b.w1, f0), wb = lerp(b.w0, b.w1, f1);
      const za = lerp(b.z0, b.z1, f0), zb = lerp(b.z0, b.z1, f1);
      pen.line([cx - wa, cy + wa, za], [cx + wb, cy + wb, zb], PALETTE.ink, 0.45);
      pen.line([cx + wa, cy + wa, za], [cx - wb, cy + wb, zb], PALETTE.ink, 0.45);
      pen.line([cx + wa, cy - wa, za], [cx + wb, cy + wb, zb], PALETTE.ink, 0.45);
    }
    if (idx === 0) {
      pen.poly([[cx - 0.65, cy + 1.29, 0.02], [cx + 0.65, cy + 1.29, 0.02], [cx + 0.42, cy + 1.06, 0.84], [cx, cy + 0.98, 1.02], [cx - 0.42, cy + 1.06, 0.84]], "#e8dfd0", PALETTE.ink, 0.68);
      pen.poly([[cx + 1.29, cy - 0.65, 0.02], [cx + 1.29, cy + 0.65, 0.02], [cx + 1.06, cy + 0.42, 0.84], [cx + 0.98, cy, 1.02], [cx + 1.06, cy - 0.42, 0.84]], "#ded5c5", PALETTE.ink, 0.68);
    }
  }
  // Animated glass elevator climbing between FootTown & Main Deck!
  const elZ = lerp(0.7, 2.35, 0.5 + 0.5 * Math.sin(t * 1.1));
  pen.box(cx - 0.14, cy + 0.55, elZ, 0.28, 0.2, 0.28, "#a6d2e0", { shadow: false, noPlinth: true, lw: 0.5 });

  // Main Deck & Top Deck
  pen.box(cx - 0.76, cy - 0.76, 2.45, 1.52, 1.52, 0.36, C.vermilion, {
    shadow: false, noPlinth: true,
    windows: { floors: 1, band: true, color: "#9bc2cf" },
  });
  pen.box(cx - 0.42, cy - 0.42, 4.95, 0.84, 0.84, 0.3, "#f6f2e8", {
    shadow: false, noPlinth: true,
    windows: { floors: 1, band: true, color: "#8fb8c7" },
  });
  pen.line([cx, cy, 6.4], [cx, cy, 7.75], PALETTE.ink, 1.1);
  const blink = Math.sin(t * 5.0) > 0;
  pen.sphere(cx, cy, 7.78, blink ? 0.14 : 0.08, blink ? "#ff5b4a" : "#b84438", { lw: 0.45 });
}

export default {
  id: "tokyo",
  name: "Tokyo",
  seed: 2020,
  heroFocus: { u: 5.2, v: 6.4, z: 0.7 },
  vehicles: [
    { style: "taxi", color: "#5f966e" },
    { style: "taxi", color: "#e3bc4b" },
    { style: "sedan", color: "#ece6da" },
    { style: "sedan", color: "#3d4550" },
    { style: "tram", color: "#c95346" },
    { style: "sedan", color: "#769cb0" },
  ],
  tiles: {
    // CENTER (0,0): Senso-ji Temple (Asakusa) + Nakamise Stalls + Incense Censer Micro-Story
    "0,0": {
      name: "Senso-ji Temple, Asakusa",
      camZ: 1.9,
      estElements: 240,
      draw(pen, t) {
        pen.tileBase(10, 10, "#e9e1d2", { paving: 1.15 });
        pen.ground(3.8, 0.8, 2.4, 8.6, "#dfd5c3", 0.02, PALETTE.ink, 0.65);

        // Main Senso-ji Hondo Temple Hall with vermilion pillars & grand curved roof!
        pen.item(4.2, () => {
          pen.box(2.5, 0.55, 0, 5.0, 2.55, 1.4, C.vermilion, {
            plinth: true, pilasters: true,
            windows: { floors: 1, colsU: 5, colsV: 2, color: "#4d382c" },
          });
          pen.stairs(4.1, 3.1, 0.02, 0.35, 1.8, 0.45, 3, "v", "#d8cfc0");
          pen.pagodaRoof(2.5, 0.55, 1.4, 5.0, 2.55, 0.98, C.roofDark, C.vermilion);
        });

        // 5-story Vermilion Pagoda on left!
        pen.item(5.2, () => drawPagoda(pen, 1.45, 3.6, 0));

        // Nakamise-dori Traditional Souvenir Stalls with striped awnings & hanging lanterns!
        for (let i = 0; i < 2; i++) {
          const sv = 4.6 + i * 1.55;
          pen.item(1.85 + sv, () => {
            pen.stall(1.85, sv, 0.02, 1.65, 1.05, C.vermilion, "#faf4e6", ["#f5e28c", "#e07a94", "#6b99a8"]);
          });
          pen.item(6.5 + sv, () => {
            pen.stall(6.5, sv, 0.02, 1.65, 1.05, "#426a82", "#faf4e6", ["#e6b44e", "#d44b48", "#87a86b"]);
          });
        }
        // Stone Torō lanterns lining the temple courtyard!
        for (const [lu, lv] of [[3.85, 3.85], [6.15, 3.85], [3.85, 7.15], [6.15, 7.15]]) {
          pen.item(lu + lv, () => pen.lamp(lu, lv, 0.02, "toro"));
        }

        // HERO MICRO-STORY: Giant Bronze Jokoro Incense Censer + Kimono Visitors waving smoke!
        pen.item(11.3, () => {
          pen.cylinder(5.0, 5.4, 0.02, 0.56, 0.58, "#5d6963", { top: "#8d8a80", lw: 0.8, flutes: 6 });
          pen.smoke(5.0, 5.4, 0.64, 6);
          pen.person(4.3, 5.85, 0.02, { shirt: "#e28aa0", dress: true, wave: true, seed: 1 });
          pen.person(5.7, 5.8, 0.02, { shirt: "#567d96", wave: true, seed: 2 });
          pen.person(4.75, 6.48, 0.02, { shirt: "#d8a64c", flash: true, seed: 3 });
          pen.person(5.45, 6.65, 0.02, { shirt: "#c94c42", dress: true, wave: true, seed: 4 });
        });

        // Iconic Kaminarimon Gate with GIANT Swaying Red Paper Lantern!
        pen.item(13.8, () => {
          pen.box(2.95, 7.55, 0, 1.2, 1.2, 1.4, C.vermilion, { shadow: false, plinth: true });
          pen.box(5.85, 7.55, 0, 1.2, 1.2, 1.4, C.vermilion, { shadow: false, plinth: true });
          pen.box(2.95, 7.55, 1.18, 4.1, 1.2, 0.38, C.vermilion, { shadow: false, noPlinth: true });
          pen.pagodaRoof(2.85, 7.5, 1.52, 4.3, 1.3, 0.68, C.roofDark, C.vermilion);
          const sway = Math.sin(t * 2.2) * 0.06;
          pen.sphere(5.0 + sway, 8.2, 0.78, 0.44, "#d83c32", { lw: 0.85 });
          pen.box(4.8 + sway, 8.05, 0.34, 0.4, 0.3, 0.11, "#2f2c29", { shadow: false, noPlinth: true, lw: 0.5 });
        });

        for (const [tu, tv] of [[8.6, 1.7], [8.8, 3.6], [1.2, 7.9], [8.8, 8.3], [1.1, 6.2]]) {
          pen.item(tu + tv, () => pen.tree(tu, tv, 0.02, "sakura", 0.95));
        }
        const v1 = 3.5 + ((t * 0.55) % 4.1);
        pen.item(5.0 + v1, () => pen.person(4.85, v1, 0.02, { shirt: "#455a73", walk: true, seed: 14 }));
      },
    },

    // (-1,-1): Shibuya Scramble Crossing
    "-1,-1": {
      name: "Shibuya Scramble Crossing",
      camZ: 1.7,
      estElements: 230,
      draw(pen, t) {
        pen.tileBase(10, 10, "#d4cec2");
        for (const [gu, gv] of [[0.2, 0.2], [6.6, 0.2], [0.2, 6.6], [6.6, 6.6]]) {
          pen.ground(gu, gv, 3.2, 3.2, "#ede6d9", 0.03);
          pen.paving(gu + 0.1, gv + 0.1, 3.0, 3.0, 0.8, 0.035);
        }
        // Iconic Diagonal & 4-Way White Scramble Zebra Stripes!
        for (let i = -3; i <= 3; i++) {
          const d = i * 0.46;
          pen.line([3.5 + d * 0.35, 3.5 - d * 0.35, 0.03], [6.5 + d * 0.35, 6.5 - d * 0.35, 0.03], "#faf7f0", 1.8);
          pen.line([3.5 + d * 0.35, 6.5 + d * 0.35, 0.03], [6.5 + d * 0.35, 3.5 + d * 0.35, 0.03], "#faf7f0", 1.8);
          pen.line([3.4, 5.0 + d * 0.5, 0.03], [4.1, 5.0 + d * 0.5, 0.03], "#faf7f0", 1.3);
          pen.line([5.9, 5.0 + d * 0.5, 0.03], [6.6, 5.0 + d * 0.5, 0.03], "#faf7f0", 1.3);
        }

        // QFRONT Billboard Tower + Shibuya 109 Cylinder + Rooftop Scaffolding!
        pen.item(3.2, () => {
          pen.box(0.4, 0.4, 0.03, 2.8, 2.75, 2.85, "#e6dfd0", {
            windows: { floors: 4, band: true, color: "#688da0" },
            rooftop: true,
          });
          const scCol = ["#74bac6", "#e07a94", "#e6b44e"][Math.floor(t * 0.8) % 3];
          pen.poly([[0.65, 3.17, 1.05], [2.95, 3.17, 1.05], [2.95, 3.17, 2.5], [0.65, 3.17, 2.5]], scCol, PALETTE.ink, 0.78);
          pen.awning(0.5, 3.17, 0.55, 2.6, 0.4, "u", "#4a7792", "#faf4e6");
          // Shibuya 109 cylindrical iconic fashion tower!
          pen.cylinder(8.0, 1.8, 0.03, 1.08, 3.15, "#eee7da", { lw: 0.9, flutes: 8 });
          pen.cylinder(8.0, 1.8, 2.82, 1.11, 0.4, C.vermilion, { lw: 0.75 });
          pen.box(7.35, 1.35, 3.22, 1.3, 0.9, 0.48, C.neonAmber, { shadow: false, noPlinth: true, lw: 0.6 });
        });

        // Glowing Vertical Neon Signage & Corner Traffic Poles!
        pen.item(5.2, () => {
          pen.box(3.16, 1.05, 0.8, 0.18, 0.48, 1.55, C.neonPink, { shadow: false, noPlinth: true, lw: 0.6 });
          pen.box(6.72, 2.75, 0.8, 0.48, 0.18, 1.55, C.neonCyan, { shadow: false, noPlinth: true, lw: 0.6 });
          pen.lamp(3.3, 3.3, 0.03);
          pen.lamp(6.7, 6.7, 0.03);
        });

        // Bustling Shibuya Scramble Crowd (20 animated walkers surging diagonally!)
        const coats = ["#3c4450", "#c95848", "#4e748c", "#d8a84e", "#e08498", "#6f8f66", "#7a6387", "#2e3540"];
        for (let i = 0; i < 20; i++) {
          const p = (t * 0.28 + i * 0.053) % 1;
          const diag = i % 2 === 0;
          const spread = ((i % 5) - 2) * 0.38;
          const pu = diag ? lerp(2.7, 7.3, p) + spread * 0.4 : lerp(7.3, 2.7, p) + spread * 0.4;
          const pv = diag ? lerp(2.7, 7.3, p) - spread * 0.4 : lerp(2.7, 7.3, p) + spread * 0.4;
          pen.item(pu + pv, () => pen.person(pu, pv, 0.03, {
            shirt: coats[i % coats.length], walk: true, dress: i % 4 === 0,
            umbrella: i % 7 === 0 ? "#d84c42" : null, seed: i * 11, scale: 0.84,
          }));
        }

        // Hachiko bronze dog statue plaza + flowerbed + waiting café corner!
        pen.item(11.0, () => {
          pen.box(1.35, 7.35, 0.03, 0.85, 0.85, 0.36, "#cbc2b2", { shadow: false, noPlinth: true });
          pen.dog(1.78, 7.78, 0.42, "#7d6850", 1);
          pen.flowerbed(0.5, 8.6, 2.1, 0.8, ["#f0b8c6", "#faf6ec", "#e6b44e"], 0.03);
          pen.person(2.4, 7.8, 0.03, { shirt: "#e07a94", flash: true, seed: 5 });
          pen.tree(8.4, 8.2, 0.03, "sakura", 0.88);
          pen.bench(7.4, 8.6, 0.03, "u");
        });
      },
    },

    // (0,-1): Tokyo Tower & Shiba Park
    "0,-1": {
      name: "Tokyo Tower & Shiba Park",
      camZ: 2.3,
      estElements: 220,
      draw(pen, t) {
        pen.tileBase(10, 10, C.grass);
        pen.grassDetail(0.4, 0.4, 9.2, 9.2, 31, true);
        pen.ground(3.3, 3.3, 3.4, 3.4, "#eae1d1", 0.02);
        pen.paving(3.4, 3.4, 3.2, 3.2, 0.8, 0.025);
        pen.ground(4.25, 6.7, 1.5, 3.1, "#eae1d1", 0.02);

        // Tokyo Tower + circling birds!
        pen.item(10.0, () => drawTokyoTower(pen, 5.0, 4.9, t));
        pen.item(11.0, () => pen.bird(2.5 + Math.sin(t * 1.1) * 0.8, 2.2, 3.8, 0.2));

        // Traditional Zojo-ji Temple hall with stone lanterns & flowerbed!
        pen.item(10.8, () => {
          pen.box(0.7, 6.65, 0.02, 2.65, 2.15, 0.95, C.plaster, { plinth: true, windows: { floors: 1, colsU: 3, colsV: 2, color: "#5e4635" } });
          pen.pagodaRoof(0.7, 6.65, 0.97, 2.65, 2.15, 0.68, C.roofDark, C.vermilion);
          pen.lamp(3.8, 7.2, 0.02, "toro");
          pen.lamp(6.2, 7.2, 0.02, "toro");
          pen.flowerbed(6.6, 6.6, 2.2, 0.75, ["#f0b8c6", "#f5e28c", "#faf6ec"]);
          pen.bench(6.9, 8.6, 0.02, "u");
        });

        for (const [tu, tv] of [[1.3, 1.3], [1.5, 3.8], [3.2, 1.3], [8.5, 1.4], [8.6, 4.0], [8.4, 7.6], [6.6, 8.8]]) {
          pen.item(tu + tv, () => pen.tree(tu, tv, 0.02, "sakura", 0.94));
        }
        const p = (t * 0.45) % 2.8;
        pen.item(4.9 + (6.8 + p), () => pen.person(4.9, 6.8 + p, 0.02, { shirt: "#4f748c", walk: true, seed: 3 }));
        pen.item(5.4 + 8.1, () => pen.person(5.4, 8.1, 0.02, { shirt: "#e07a94", dress: true, wave: true, seed: 5 }));
      },
    },

    // (1,-1): Shinkansen Bullet Train & Mt. Fuji View
    "1,-1": {
      name: "Shinkansen & Mt. Fuji View",
      camZ: 1.8,
      estElements: 210,
      draw(pen, t) {
        pen.tileBase(10, 10, C.grass);
        pen.grassDetail(0.4, 5.8, 9.2, 3.8, 42, true);
        // Sculpted Snow-Capped Mount Fuji with terraced tea hedges at its foothills!
        pen.item(3.6, () => {
          pen.pyramid(0.55, 0.45, 0, 5.3, 3.7, 3.35, "#748aa0", { left: "#859cb2", right: "#5f7488" });
          pen.pyramid(2.05, 1.42, 2.08, 2.3, 1.72, 1.3, "#fbf8f2", { left: "#ffffff", right: "#e6e2d8" });
          pen.hedge(6.2, 1.5, 2.8, 0.45, 0.35, 0.02, "#6a9154");
          pen.hedge(6.2, 2.3, 2.8, 0.45, 0.35, 0.02, "#789e60");
          pen.hedge(6.2, 3.1, 2.8, 0.45, 0.35, 0.02, "#6a9154");
        });

        // Concrete Elevated Shinkansen Viaduct with Overhead Catenary Masts & Power Wire!
        pen.item(9.2, () => {
          for (const pu of [1.4, 4.2, 7.0, 9.0]) {
            pen.box(pu - 0.26, 4.75, 0, 0.52, 0.65, 1.15, "#cfc7b8", { shadow: false, noPlinth: true });
            // Overhead steel catenary gantry post!
            pen.line([pu, 4.6, 1.43], [pu, 4.6, 2.22], "#58616b", 0.85);
            pen.line([pu, 4.6, 2.18], [pu, 5.5, 2.18], "#58616b", 0.7);
          }
          pen.line([0.3, 5.05, 2.14], [9.7, 5.05, 2.14], "rgba(41,35,31,0.45)", 0.5);
          pen.box(0.2, 4.55, 1.15, 9.6, 1.05, 0.28, "#e6dfd0", { shadow: false, noPlinth: true });
          const trainU = 2.2 + ((t * 2.8) % 5.6);
          pen.vehicle(trainU, 5.08, 1.43, { axis: "u", style: "train", cars: 3, carLen: 1.25, color: "#fbf9f4", stripe: "#3265a1" });
        });

        // Organic Japanese Garden Koi Pond with Lotus Pads + Wooden Teahouse & Torō Lantern!
        pen.organicPond(7.3, 7.8, 1.85, 1.3, C.water, { lilies: 4 });
        pen.item(11.4, () => {
          pen.box(0.85, 6.75, 0.02, 2.95, 2.15, 0.98, C.wood, {
            plinth: true,
            windows: { floors: 1, colsU: 3, colsV: 2, color: "#f6e5b8", litChance: 0.72 },
          });
          pen.pagodaRoof(0.85, 6.75, 1.0, 2.95, 2.15, 0.65, C.roofDark, "#7c5c3e");
          pen.lamp(4.6, 7.5, 0.02, "toro");
          pen.tree(4.3, 8.4, 0.02, "sakura", 0.95);
          pen.tree(8.6, 0.95, 0.02, "sakura", 0.85);
          pen.person(4.2, 6.95, 0.02, { shirt: "#cc4837", dress: true, wave: true, seed: 8 });
        });
      },
    },

    // (1,0): Shinjuku / Kabukicho & Godzilla Terrace
    "1,0": {
      name: "Shinjuku & Godzilla Terrace",
      camZ: 1.8,
      estElements: 225,
      draw(pen, t) {
        pen.tileBase(10, 10, "#dcd5c8", { paving: 1.0 });
        pen.ground(3.8, 0.5, 2.4, 9.0, "#ccc4b6", 0.02);

        // Toho Cinema Tower with Detailed Godzilla Head & Jagged Spikes!
        pen.item(6.0, () => {
          pen.box(0.5, 0.6, 0, 3.1, 4.2, 2.9, "#6a737e", {
            windows: { floors: 4, band: true, color: "#9eb8c7" },
            rooftop: true,
          });
          // Godzilla head, snout, teeth row, dorsal crest & glowing yellow eye!
          pen.box(1.9, 3.8, 2.9, 1.15, 1.05, 0.8, "#4a6150", { shadow: false, noPlinth: true, lw: 0.85 });
          pen.box(2.05, 4.55, 2.96, 0.85, 0.48, 0.44, "#58705e", { shadow: false, noPlinth: true, lw: 0.72 });
          pen.sphere(2.85, 4.65, 3.5, 0.095, "#f5d75e", { lw: 0.4 });
          pen.smoke(2.48, 5.08, 3.2, 4);
        });

        // Stacked Shinjuku Izakaya & Neon Karaoke Towers with Rooftop Props & Vertical Kanban!
        pen.item(8.5, () => {
          pen.box(6.4, 0.65, 0, 3.05, 3.65, 2.55, "#e6dfd0", {
            windows: { floors: 4, colsU: 3, colsV: 3, color: "#5e7482", litChance: 0.58 },
            rooftop: true,
          });
          pen.box(6.4, 4.75, 0, 3.05, 4.3, 1.95, "#dacfc0", {
            windows: { floors: 3, colsU: 3, colsV: 4, color: "#5c707d", litChance: 0.62 },
            rooftop: true,
          });
          pen.awning(6.4, 9.05, 0.5, 3.0, 0.45, "u", C.vermilion, "#faf4e6");
          pen.box(6.18, 1.4, 0.7, 0.2, 0.62, 1.55, C.neonPink, { shadow: false, noPlinth: true, lw: 0.58 });
          pen.box(6.18, 2.8, 0.9, 0.2, 0.62, 1.35, C.neonCyan, { shadow: false, noPlinth: true, lw: 0.58 });
          pen.box(6.18, 5.5, 0.5, 0.2, 0.62, 1.25, C.neonAmber, { shadow: false, noPlinth: true, lw: 0.58 });
          pen.box(6.18, 7.1, 0.6, 0.2, 0.62, 1.15, C.vermilion, { shadow: false, noPlinth: true, lw: 0.58 });
        });

        // Cozy Wooden Ramen & Yakitori Izakaya Alley with Red Noren Curtains & 3 Chochin Lantern Strings!
        pen.item(11.5, () => {
          pen.box(0.5, 5.4, 0, 3.05, 3.85, 1.4, C.wood, {
            plinth: true,
            windows: { floors: 2, colsU: 3, colsV: 3, color: "#f6dd94", litChance: 0.88 },
          });
          pen.pagodaRoof(0.5, 5.4, 1.4, 3.05, 3.85, 0.48, C.roofDark, C.vermilion);
          pen.awning(3.55, 5.8, 0.55, 2.8, 0.42, "v", "#325275", "#faf4e6");
          pen.lanternString(3.55, 5.8, 6.4, 5.8, 1.48, 5, "#d84438");
          pen.lanternString(3.55, 7.2, 6.4, 7.2, 1.48, 5, "#e6a43e");
          pen.lanternString(3.55, 8.6, 6.4, 8.6, 1.48, 5, "#d84438");
        });

        for (let i = 0; i < 6; i++) {
          const pv = 1.2 + ((t * 0.72 + i * 1.45) % 7.8);
          const pu = 4.35 + (i % 2) * 1.15;
          pen.item(pu + pv, () => pen.person(pu, pv, 0.02, { shirt: ["#3b4552", "#c85244", "#5c8096", "#d89a4a", "#e07a94", "#6f8f66"][i], walk: true, seed: i + 7 }));
        }
      },
    },

    // (1,1): Odaiba, Rainbow Bridge & Giant Mecha Statue
    "1,1": {
      name: "Odaiba & Rainbow Bridge",
      camZ: 1.7,
      estElements: 220,
      draw(pen, t) {
        pen.tileBase(10, 10, "#eae2d2", { paving: 1.2 });
        pen.water(0.2, 0.2, 9.6, 4.9, C.water, { z: -0.08, ripples: 10 });
        pen.ground(0.4, 5.1, 4.1, 1.7, "#ecd9b2", 0.02);

        // Rainbow Suspension Bridge with Vertical Suspender Cables & Two-Way Cars!
        pen.item(4.8, () => {
          // Back tower pillars & back suspension cable
          for (const tu of [2.6, 7.4]) {
            pen.box(tu - 0.16, 1.58, 0, 0.32, 0.24, 2.8, "#f7f4ec", { shadow: false, noPlinth: true });
          }
          const cablePts = (vOff) => {
            const pts = [];
            for (let i = 0; i <= 16; i++) {
              const u = 0.2 + (i / 16) * 9.6;
              let z;
              if (u < 2.6) z = 1.2 + Math.pow((u - 0.2) / 2.4, 1.7) * 1.48;
              else if (u < 7.4) { const f = (u - 5.0) / 2.4; z = 1.32 + f * f * 1.36; }
              else z = 1.2 + Math.pow((9.8 - u) / 2.4, 1.7) * 1.48;
              pts.push([u, vOff, z]);
            }
            return pts;
          };
          pen.polyline(cablePts(1.7), PALETTE.ink, 0.85);
          // Roadway deck + animated car passing cleanly through the towers
          pen.box(0.2, 1.72, 1.12, 9.6, 0.78, 0.16, "#eae5da", { shadow: false, noPlinth: true });
          const cu = 0.8 + ((t * 1.6) % 8.4);
          pen.vehicle(cu, 2.1, 1.28, { axis: "u", style: "sedan", color: "#c95346" });
          // Front tower pillars, crossbeams & front suspension cable with vertical suspenders
          for (const tu of [2.6, 7.4]) {
            pen.box(tu - 0.16, 2.38, 0, 0.32, 0.24, 2.8, "#f7f4ec", { shadow: false, noPlinth: true });
            pen.box(tu - 0.16, 1.58, 2.42, 0.32, 1.04, 0.2, "#f7f4ec", { shadow: false, noPlinth: true });
            pen.box(tu - 0.16, 1.58, 1.8, 0.32, 1.04, 0.14, "#f7f4ec", { shadow: false, noPlinth: true });
          }
          const frontPts = cablePts(2.5);
          for (let i = 1; i < frontPts.length; i += 2) {
            const [u, vOff, z] = frontPts[i];
            pen.line([u, vOff, 1.25], [u, vOff, z], "rgba(41,35,31,0.35)", 0.42);
          }
          pen.polyline(frontPts, PALETTE.ink, 0.9);
        });

        // Yakatabune Lantern Boat + Seagulls!
        const bu = 1.2 + ((t * 0.9) % 7.5);
        pen.item(bu + 3.8, () => pen.boat(bu, 3.8, -0.06, { style: "ferry", axis: "u", color: "#9c7048", accent: "#d44a3c" }));
        pen.item(12.0, () => pen.bird(2.4 + Math.sin(t * 1.2) * 1.2, 3.5, 1.6, 0.3));

        // Beach Umbrellas & Iconic Giant White Gundam/Mecha Statue on Odaiba Plaza!
        pen.item(12.5, () => {
          pen.cafeSet(1.5, 6.0, 0.02, "#4a89a3");
          pen.cafeSet(3.2, 5.9, 0.02, C.vermilion);
          pen.bench(3.2, 7.6, 0.02, "u");
          pen.lamp(5.2, 6.4, 0.02);
        });
        pen.item(14.5, () => {
          const mu = 7.0, mv = 7.4;
          pen.box(mu - 1.0, mv - 1.0, 0, 2.0, 2.0, 0.26, "#dcd4c4", { shadow: false, noPlinth: true });
          pen.box(mu - 0.45, mv - 0.2, 0.26, 0.36, 0.42, 1.08, "#f7f4ec", { shadow: false, noPlinth: true });
          pen.box(mu + 0.1, mv - 0.2, 0.26, 0.36, 0.42, 1.08, "#f7f4ec", { shadow: false, noPlinth: true });
          pen.box(mu - 0.52, mv - 0.26, 1.34, 1.04, 0.52, 0.74, "#4670a6", { shadow: false, noPlinth: true });
          pen.box(mu - 0.3, mv + 0.12, 1.42, 0.6, 0.18, 0.28, C.vermilion, { shadow: false, noPlinth: true });
          pen.box(mu - 0.82, mv - 0.2, 1.68, 0.32, 0.38, 0.42, "#f7f4ec", { shadow: false, noPlinth: true });
          pen.box(mu + 0.5, mv - 0.2, 1.68, 0.32, 0.38, 0.42, "#f7f4ec", { shadow: false, noPlinth: true });
          pen.box(mu - 0.25, mv - 0.22, 2.06, 0.5, 0.44, 0.42, "#f7f4ec", { shadow: false, noPlinth: true });
          pen.line([mu, mv + 0.2, 2.42], [mu - 0.34, mv + 0.2, 2.68], C.gold, 1.7);
          pen.line([mu, mv + 0.2, 2.42], [mu + 0.34, mv + 0.2, 2.68], C.gold, 1.7);
          pen.person(mu - 1.15, mv + 1.25, 0.02, { shirt: "#4f748c", flash: true, seed: 2 });
          pen.person(mu + 0.45, mv + 1.38, 0.02, { shirt: "#d89a4a", wave: true, seed: 3 });
        });
        pen.item(1.5 + 8.0, () => pen.tree(1.5, 8.0, 0.02, "palm", 0.9));
        pen.item(4.2 + 8.6, () => pen.tree(4.2, 8.6, 0.02, "palm", 0.85));
      },
    },

    // (0,1): Ueno Park & Organic Shinobazu Swan Boat Lotus Pond
    "0,1": {
      name: "Ueno Park & Swan Pond",
      camZ: 1.4,
      estElements: 215,
      draw(pen, t) {
        pen.tileBase(10, 10, C.grass);
        pen.grassDetail(0.4, 0.4, 9.2, 9.2, 55, true);
        pen.organicPond(5.0, 4.8, 3.65, 3.4, C.water, { lilies: 8 });

        // Red Bentendo Octagonal Temple Pavilion on Islet + Wooden Pier with Railings!
        pen.item(9.2, () => {
          pen.box(3.55, 3.2, -0.01, 2.8, 2.6, 0.22, "#dbd2c0", { shadow: false, noPlinth: true });
          pen.box(4.05, 3.6, 0.21, 1.8, 1.8, 1.08, C.vermilion, { windows: { floors: 1, colsU: 2, colsV: 2, color: "#f6e5b8", litChance: 0.6 } });
          pen.pagodaRoof(4.05, 3.6, 1.29, 1.8, 1.8, 0.68, C.roofDark, C.vermilion);
          pen.box(4.5, 5.8, 0.04, 0.92, 2.85, 0.12, C.wood, { shadow: false, noPlinth: true });
          pen.railing([4.52, 5.85], [4.52, 8.55], 0.16, 0.24, "#8c352b");
          pen.railing([5.4, 5.85], [5.4, 8.55], 0.16, 0.24, "#8c352b");
        });

        for (let i = 0; i < 3; i++) {
          const a = t * 0.45 + (i * Math.PI * 2) / 3;
          const su = 5.0 + Math.cos(a) * 2.5, sv = 4.8 + Math.sin(a) * 2.3;
          pen.item(su + sv, () => pen.boat(su, sv, -0.02, { style: "swan" }));
        }
        for (const [tu, tv] of [[0.9, 1.2], [0.8, 4.9], [1.0, 8.7], [9.0, 1.5], [9.1, 5.3], [8.8, 8.7], [2.6, 8.9]]) {
          pen.item(tu + tv, () => pen.tree(tu, tv, 0.02, "sakura", 0.94));
        }
        pen.item(15.2, () => {
          pen.ground(5.8, 8.4, 2.1, 1.15, "#6f9ec4", 0.02, PALETTE.ink, 0.58);
          pen.person(6.4, 8.95, 0.02, { shirt: "#e07a94", dress: true, seed: 4 });
          pen.person(7.25, 8.95, 0.02, { shirt: "#455a73", seed: 5 });
          pen.lamp(3.8, 8.6, 0.02, "toro");
        });
      },
    },

    // (-1,1): Meiji Jingu Forest, Cypress Torii & Sake Barrels
    "-1,1": {
      name: "Meiji Jingu Shrine & Forest",
      camZ: 1.5,
      estElements: 225,
      draw(pen, t) {
        pen.tileBase(10, 10, "#6c8c5e");
        pen.grassDetail(0.4, 0.4, 3.1, 9.2, 61, false);
        pen.grassDetail(6.5, 0.4, 3.1, 9.2, 62, false);
        pen.ground(3.6, 0.4, 2.8, 9.2, "#e5ddcc", 0.02, PALETTE.ink, 0.65);

        pen.item(12.2, () => drawTorii(pen, 5.0, 7.2, 0.02, 2.95, 2.4, "#b38b5d", "u"));

        // 6 Stone Torō lanterns lining the sacred gravel path!
        for (const lv of [3.2, 5.2, 8.6]) {
          pen.item(3.3 + lv, () => pen.lamp(3.3, lv, 0.02, "toro"));
          pen.item(6.7 + lv, () => pen.lamp(6.7, lv, 0.02, "toro"));
        }

        // Iconic Wall of Colorful Stacked Sake Barrels (Kazaridaru)!
        pen.item(11.0, () => {
          const barCols = ["#f5efe2", "#cf4b3e", "#4a7394", "#dfb44e", "#6f9668"];
          for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 5; col++) {
              pen.cylinder(7.2, 3.1 + col * 0.68, 0.04 + row * 0.56, 0.25, 0.52, barCols[(col + row * 2) % barCols.length], { lw: 0.58 });
            }
          }
          pen.pagodaRoof(6.82, 2.85, 1.16, 0.76, 3.45, 0.36, C.roofDark, "#9c754d");
        });

        pen.item(5.2, () => {
          pen.box(2.7, 0.65, 0.02, 4.6, 1.65, 1.1, "#a67d52", { plinth: true, pilasters: true });
          pen.pagodaRoof(2.7, 0.65, 1.12, 4.6, 1.65, 0.62, "#5c7a69", "#8c6742");
        });

        for (const [tu, tv] of [[1.1, 1.1], [2.4, 2.1], [1.1, 3.7], [2.4, 5.1], [1.2, 6.8], [1.7, 8.6], [8.6, 1.3], [8.8, 4.9], [8.5, 7.6], [8.8, 8.9]]) {
          pen.item(tu + tv, () => pen.tree(tu, tv, 0.02, "pine", 0.95));
        }
        for (let i = 0; i < 4; i++) {
          const pv = 9.0 - ((t * 0.48 + i * 2.1) % 7.2);
          pen.item(5.0 + pv, () => pen.person(4.65 + (i % 2) * 0.7, pv, 0.02, { shirt: ["#3d4652", "#c85244", "#5c8096", "#e07a94"][i], walk: true, dress: i % 2 === 1, seed: i + 12 }));
        }
      },
    },

    // (-1,0): Akihabara Electric Town & Yellow Commuter Train
    "-1,0": {
      name: "Akihabara Electric Town",
      camZ: 1.7,
      estElements: 225,
      draw(pen, t) {
        pen.tileBase(10, 10, "#dcd5c8", { paving: 1.05 });
        pen.ground(0.4, 6.1, 9.2, 3.5, "#e8e1d3", 0.02);

        pen.item(5.5, () => {
          pen.box(0.55, 0.55, 0, 2.65, 3.25, 2.85, "#e6dfd0", {
            windows: { floors: 4, colsU: 3, colsV: 3, color: "#688fa3", litChance: 0.5 },
            rooftop: true,
          });
          pen.box(3.45, 0.55, 0, 2.85, 3.25, 2.35, "#e8c4c8", {
            windows: { floors: 3, colsU: 3, colsV: 3, color: "#586d7a", litChance: 0.6 },
            rooftop: true,
          });
          pen.box(6.55, 0.55, 0, 2.85, 3.25, 2.7, "#c9dde3", {
            windows: { floors: 4, colsU: 3, colsV: 3, color: "#4e6a7a", litChance: 0.5 },
            rooftop: true,
          });
          pen.awning(0.55, 3.8, 0.5, 2.65, 0.42, "u", C.vermilion, "#faf4e6");
          pen.awning(3.45, 3.8, 0.5, 2.85, 0.42, "u", "#4a7792", "#faf4e6");
          pen.box(1.1, 3.82, 0.8, 0.62, 0.16, 1.8, C.vermilion, { shadow: false, noPlinth: true, lw: 0.58 });
          pen.box(4.2, 3.82, 0.7, 0.72, 0.16, 1.5, C.neonAmber, { shadow: false, noPlinth: true, lw: 0.58 });
          pen.box(7.3, 3.82, 0.8, 0.65, 0.16, 1.7, C.neonCyan, { shadow: false, noPlinth: true, lw: 0.58 });
        });

        // Steel Railway Viaduct with Overhead Catenary & Yellow Chuo-Sobu Train!
        pen.item(10.0, () => {
          for (const pu of [1.2, 5.0, 8.8]) {
            pen.box(pu - 0.25, 4.7, 0, 0.5, 0.6, 1.05, "#6b737d", { shadow: false, noPlinth: true });
            pen.line([pu, 4.55, 1.29], [pu, 4.55, 2.08], "#525a63", 0.8);
          }
          pen.line([0.3, 4.95, 2.02], [9.7, 4.95, 2.02], "rgba(41,35,31,0.4)", 0.48);
          pen.box(0.2, 4.5, 1.05, 9.6, 1.0, 0.24, "#58616b", { shadow: false, noPlinth: true });
          const tu = 2.2 + ((t * 2.0) % 5.6);
          pen.vehicle(tu, 5.0, 1.29, { axis: "u", style: "train", cars: 3, carLen: 1.2, color: "#dedad0", stripe: "#e6b83c" });
        });

        // Gachapon capsule rows, anime souvenir stall, lamps & shoppers!
        pen.item(14.5, () => {
          pen.stall(0.8, 6.7, 0.02, 1.9, 0.9, "#e07a94", "#faf4e6", ["#74bac6", "#e6b44e", "#e07a94"]);
          for (let i = 0; i < 3; i++) {
            pen.box(3.5 + i * 1.6, 6.8, 0.02, 0.95, 0.48, 0.76, ["#74bac6", "#e6b44e", "#87a96c"][i], { shadow: false, noPlinth: true, lw: 0.62 });
          }
          pen.lamp(8.8, 7.2, 0.02);
        });
        for (let i = 0; i < 5; i++) {
          const su = 0.8 + ((t * 0.75 + i * 1.8) % 8.4);
          pen.item(su + 8.5, () => pen.person(su, 8.5, 0.02, { shirt: ["#3d4652", "#e07a94", "#4f748c", "#d89a4a", "#c8483c"][i], walk: true, seed: i + 3 }));
        }
      },
    },
  },

  satellites: {
    nw: {
      name: "Tokyo Skytree",
      draw(pen, t) {
        pen.tileBase(4.8, 4.8, "#e6dfd0", { thick: 0.36, paving: 0.95 });
        pen.item(4.8, () => {
          pen.cylinder(2.4, 2.4, 0, 0.74, 1.85, "#c8d6de", { flutes: 8 });
          pen.cylinder(2.4, 2.4, 1.85, 0.58, 0.44, "#9ab6c7", { top: "#dce6ec" });
          pen.cylinder(2.4, 2.4, 2.29, 0.36, 1.95, "#d8e3e8", { flutes: 6 });
          pen.cylinder(2.4, 2.4, 4.24, 0.42, 0.28, "#8aa8bc");
          pen.line([2.4, 2.4, 4.52], [2.4, 2.4, 5.55], PALETTE.ink, 1.2);
          const blink = Math.sin(t * 4.2) > 0;
          pen.sphere(2.4, 2.4, 5.58, 0.1, blink ? "#6fc7e8" : "#4e8da6", { lw: 0.4 });
        });
      },
    },
    ne: {
      name: "Tsukiji Market",
      draw(pen, t) {
        pen.tileBase(4.8, 4.8, C.water, { thick: 0.36 });
        pen.water(0.2, 2.2, 4.4, 2.4, C.water, { z: 0.01, ripples: 4 });
        pen.ground(0.2, 0.2, 4.4, 2.1, "#e7dfd0", 0.02);
        pen.item(3.2, () => {
          pen.box(0.7, 0.5, 0.02, 3.4, 1.3, 0.92, "#ece4d4", { windows: { floors: 1, colsU: 4, colsV: 1, color: "#586d7a" } });
          pen.pagodaRoof(0.7, 0.5, 0.94, 3.4, 1.3, 0.44, "#4b6c82", "#355163");
        });
        const bu = 1.6 + Math.sin(t * 0.9) * 0.7;
        pen.item(5.8, () => pen.boat(bu + 0.8, 3.4, 0.02, { style: "abra", accent: "#4a7792" }));
      },
    },
    sw: {
      name: "Imperial Palace Moat",
      draw(pen) {
        pen.tileBase(4.8, 4.8, C.water, { thick: 0.36 });
        pen.water(0.2, 0.2, 4.4, 4.4, C.water, { z: 0.01, ripples: 5 });
        pen.item(4.8, () => {
          pen.box(1.1, 1.1, 0.01, 2.6, 2.6, 0.65, "#aba59a", { shadow: false, noPlinth: true, hatch: true });
          pen.box(1.5, 1.5, 0.66, 1.8, 1.8, 0.95, "#f7f4ec", { windows: { floors: 2, colsU: 2, colsV: 2, color: "#545b61" } });
          pen.pagodaRoof(1.5, 1.5, 1.61, 1.8, 1.8, 0.54, "#597366", "#f7f4ec");
        });
        pen.item(6.5, () => pen.tree(3.5, 3.6, 0.66, "pine", 0.68));
      },
    },
    se: {
      name: "Sumo Dohyo",
      draw(pen, t) {
        pen.tileBase(4.8, 4.8, "#e6dfd0", { thick: 0.36 });
        pen.item(4.8, () => {
          pen.box(0.8, 0.8, 0, 3.2, 3.2, 0.34, "#d8c39e", { noPlinth: true });
          pen.cylinder(2.4, 2.4, 0.34, 1.05, 0.08, "#e8d8b8", { lw: 0.85 });
          const push = Math.sin(t * 4.5) * 0.14;
          pen.person(2.05 + push, 2.4, 0.42, { shirt: "#efc7a5", pants: "#3b5a8a", scale: 1.05, seed: 1 });
          pen.person(2.75 + push, 2.4, 0.42, { shirt: "#efc7a5", pants: "#b8443c", scale: 1.05, seed: 2 });
        });
      },
    },
  },
};
