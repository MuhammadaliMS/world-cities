// PARIS — High-Fidelity v2 Ligne Claire Isometric World
// Dense architectural moldings, arched windows, iron balconies, dormers,
// manicured flowerbeds, café sets, wrought-iron railings, and rich living details.

import { PALETTE, shade, lerp } from "../lib/iso-engine.js";

const C = {
  stone: "#eae1cf",
  stoneWarm: "#e3d6be",
  zinc: "#758592",
  grass: "#93b075",
  gravel: "#e7decb",
  water: "#83afc2",
  eiffel: "#8f6c50",
  eiffelDark: "#6d503a",
  rouge: "#c5463d",
  copper: "#709e90",
  gold: "#dfb856",
  glass: "#9cc3cf",
  awning: "#b8453d",
};

// Detailed Parisian Haussmann building (arched windows, iron balconies, pilasters, mansard dormers & chimneys)
function drawHaussmann(pen, u, v, z, du, dv, dz, col = C.stone) {
  pen.box(u, v, z, du, dv, dz, col, {
    plinth: true,
    pilasters: true,
    windows: { floors: Math.max(2, Math.floor(dz / 0.56)), color: "#546978", litChance: 0.24, arched: true, balconies: true },
    cornice: true,
    hatch: true,
  });
  pen.mansardRoof(u, v, z + dz + 0.1, du, dv, 0.56, C.zinc, { dormers: true, chimneys: true });
}

// High-Fidelity Filigree Eiffel Tower with Animated Diagonal Leg Elevator & Beacon
function drawEiffelTower(pen, cx, cy, t) {
  const legs = [[-1.48, -1.48], [1.48, -1.48], [1.48, 1.48], [-1.48, 1.48]];

  // Cast shadow
  pen.poly([[cx - 1.75, cy - 1.75, 0.01], [cx + 1.75, cy - 1.75, 0.01], [cx + 1.75, cy + 1.75, 0.01], [cx - 1.75, cy + 1.75, 0.01]], "rgba(41,35,31,0.09)", null);

  // Masonry corner piers with stepped caps
  for (const [lu, lv] of legs) {
    pen.box(cx + lu - 0.34, cy + lv - 0.34, 0, 0.68, 0.68, 0.26, "#d4cab8", { shadow: false, noPlinth: true, lw: 0.7 });
  }

  // Curved lower legs (z: 0.24 -> 1.88) with filigree X-truss lattice!
  const d1 = 0.88;
  for (const [lu, lv] of legs) {
    const sU = Math.sign(lu), sV = Math.sign(lv);
    const b0 = [cx + lu, cy + lv, 0.24];
    const m0 = [cx + sU * 1.14, cy + sV * 1.14, 1.04];
    const t0 = [cx + sU * d1, cy + sV * d1, 1.88];
    pen.poly(
      [[b0[0] - 0.2, b0[1], b0[2]], [b0[0] + 0.2, b0[1], b0[2]], [m0[0] + 0.14, m0[1], m0[2]], [t0[0] + 0.11, t0[1], t0[2]], [t0[0] - 0.11, t0[1], t0[2]], [m0[0] - 0.14, m0[1], m0[2]]],
      sU > 0 && sV > 0 ? C.eiffelDark : C.eiffel, PALETTE.ink, 0.82
    );
    // Dense filigree cross-bracing inside each leg
    for (let k = 0; k < 4; k++) {
      const f0 = k / 4, f1 = (k + 1) / 4;
      const u0 = lerp(b0[0], t0[0], f0), v0 = lerp(b0[1], t0[1], f0), z0 = lerp(0.24, 1.88, f0);
      const u1 = lerp(b0[0], t0[0], f1), v1 = lerp(b0[1], t0[1], f1), z1 = lerp(0.24, 1.88, f1);
      pen.line([u0 - 0.12, v0, z0], [u1 + 0.12, v1, z1], PALETTE.ink, 0.45);
      pen.line([u0 + 0.12, v0, z0], [u1 - 0.12, v1, z1], PALETTE.ink, 0.45);
    }
  }

  // Animated golden elevator gliding up & down the front-right angled leg!
  const elP = 0.5 + 0.5 * Math.sin(t * 0.9);
  const elU = cx + lerp(1.38, 0.92, elP);
  const elV = cy + lerp(1.38, 0.92, elP);
  const elZ = lerp(0.35, 1.65, elP);
  pen.box(elU - 0.11, elV - 0.11, elZ, 0.22, 0.22, 0.22, C.gold, { shadow: false, noPlinth: true, lw: 0.55 });

  // Double-ribbed ornamental semicircular base arches with radial spandrel struts!
  const archEdges = [[[-1.32, 1.32], [1.32, 1.32]], [[1.32, -1.32], [1.32, 1.32]], [[-1.32, -1.32], [1.32, -1.32]], [[-1.32, -1.32], [-1.32, 1.32]]];
  for (const [a, b] of archEdges) {
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const f = i / 10;
      const au = cx + lerp(a[0], b[0], f), av = cy + lerp(a[1], b[1], f), az = 0.55 + Math.sin(f * Math.PI) * 0.95;
      pts.push([au, av, az]);
      if (i > 0 && i < 10 && i % 2 === 0) {
        pen.line([au, av, az], [au, av, 1.85], "rgba(41,35,31,0.38)", 0.42);
      }
    }
    pen.polyline(pts, C.eiffelDark, 1.6);
    pen.polyline(pts, PALETTE.ink, 0.72);
  }

  // 1st Observation Deck with arched arcade gallery & guardrail
  pen.box(cx - 1.04, cy - 1.04, 1.85, 2.08, 2.08, 0.28, C.eiffel, {
    shadow: false, noPlinth: true, lw: 0.88,
    windows: { floors: 1, colsU: 5, colsV: 5, color: "#688596", litChance: 0.3 },
  });
  pen.box(cx - 0.9, cy - 0.9, 2.13, 1.8, 1.8, 0.12, shade(C.eiffel, 0.12), { shadow: false, noPlinth: true, lw: 0.62 });

  // Mid legs (z: 2.22 -> 3.68) with dense X-bracing
  const d2 = 0.52;
  for (const [lu, lv] of legs) {
    const sU = Math.sign(lu), sV = Math.sign(lv);
    pen.poly(
      [[cx + sU * 0.84 - 0.1, cy + sV * 0.84, 2.22], [cx + sU * 0.84 + 0.1, cy + sV * 0.84, 2.22], [cx + sU * d2 + 0.08, cy + sV * d2, 3.68], [cx + sU * d2 - 0.08, cy + sV * d2, 3.68]],
      sU > 0 ? C.eiffelDark : C.eiffel, PALETTE.ink, 0.78
    );
  }
  for (let k = 0; k < 3; k++) {
    const f0 = k / 3, f1 = (k + 1) / 3;
    const w0 = lerp(0.82, 0.52, f0), w1 = lerp(0.82, 0.52, f1);
    const z0 = lerp(2.25, 3.62, f0), z1 = lerp(2.25, 3.62, f1);
    pen.line([cx - w0, cy + w0, z0], [cx + w1, cy + w1, z1], PALETTE.ink, 0.45);
    pen.line([cx + w0, cy + w0, z0], [cx - w1, cy + w1, z1], PALETTE.ink, 0.45);
    pen.line([cx + w0, cy - w0, z0], [cx + w1, cy + w1, z1], PALETTE.ink, 0.45);
    pen.line([cx + w0, cy + w0, z0], [cx + w1, cy - w1, z1], PALETTE.ink, 0.45);
  }

  // 2nd Observation Deck
  pen.box(cx - 0.66, cy - 0.66, 3.68, 1.32, 1.32, 0.24, C.eiffel, { shadow: false, noPlinth: true, lw: 0.85 });

  // Upper tapered filigree iron spire (z: 3.92 -> 6.45)
  pen.poly([[cx - 0.44, cy + 0.44, 3.92], [cx + 0.44, cy + 0.44, 3.92], [cx + 0.14, cy + 0.14, 6.45], [cx - 0.14, cy + 0.14, 6.45]], C.eiffel, PALETTE.ink, 0.82);
  pen.poly([[cx + 0.44, cy - 0.44, 3.92], [cx + 0.44, cy + 0.44, 3.92], [cx + 0.14, cy + 0.14, 6.45], [cx + 0.14, cy - 0.14, 6.45]], C.eiffelDark, PALETTE.ink, 0.82);
  for (let i = 0; i < 6; i++) {
    const f0 = i / 6, f1 = (i + 1) / 6;
    const w0 = lerp(0.44, 0.14, f0), w1 = lerp(0.44, 0.14, f1);
    const z0 = lerp(3.92, 6.45, f0), z1 = lerp(3.92, 6.45, f1);
    pen.line([cx - w0, cy + w0, z0], [cx + w1, cy + w1, z1], PALETTE.ink, 0.42);
    pen.line([cx + w0, cy + w0, z0], [cx - w1, cy + w1, z1], PALETTE.ink, 0.42);
    pen.line([cx + w0, cy - w0, z0], [cx + w1, cy + w1, z1], PALETTE.ink, 0.42);
  }

  // Top cupola & tall radio mast + beacon sparkle
  pen.box(cx - 0.25, cy - 0.25, 6.45, 0.5, 0.5, 0.24, shade(C.eiffel, 0.08), { shadow: false, noPlinth: true, lw: 0.78 });
  pen.pyramid(cx - 0.18, cy - 0.18, 6.69, 0.36, 0.36, 0.48, C.eiffelDark);
  pen.line([cx, cy, 7.17], [cx, cy, 7.95], PALETTE.ink, 1.0);

  const pulse = 0.5 + 0.5 * Math.sin(t * 3.8);
  if (pen.lifeAlpha > 0.2) {
    const [bx, by] = pen.pt(cx, cy, 6.6);
    const ctx = pen.ctx;
    ctx.save();
    ctx.globalAlpha = pen.lifeAlpha * (0.35 + pulse * 0.5);
    ctx.fillStyle = "#fce79c";
    ctx.beginPath(); ctx.arc(bx, by, pen.scale * (0.14 + pulse * 0.12), 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

export default {
  id: "paris",
  name: "Paris",
  seed: 1889,
  heroFocus: { u: 5.9, v: 6.9, z: 0.7 },
  vehicles: [
    { style: "sedan", color: "#68899e" },
    { style: "sedan", color: "#c85648" },
    { style: "taxi", color: "#414852" },
    { style: "sedan", color: "#e5decb" },
    { style: "sedan", color: "#7f9d78" },
    { style: "tram", color: "#587d6b" },
  ],
  tiles: {
    // CENTER (0,0): Eiffel Tower & Champ de Mars + Romantic Proposal Micro-Story
    "0,0": {
      name: "Eiffel Tower & Champ de Mars",
      camZ: 2.3,
      estElements: 240,
      liveOverlay(pen, t) {
        // Subtle Parisian Eiffel Tower golden sparkle glints + circling birds + gentle watercolor cloud!
        const ctx = pen.ctx;
        ctx.save();
        const sparks = [
          [5.0, 5.0, 8.15], [4.75, 4.9, 6.2], [5.25, 5.1, 5.4], [4.85, 5.15, 4.2],
          [5.2, 4.8, 3.1], [4.6, 5.3, 2.2], [5.4, 5.2, 2.0], [5.0, 5.0, 7.1],
        ];
        for (let i = 0; i < sparks.length; i++) {
          const pulse = Math.max(0, Math.sin(t * 4.2 + i * 1.7));
          if (pulse < 0.35) continue;
          const [sx, sy] = pen.pt(sparks[i][0], sparks[i][1], sparks[i][2]);
          const r = pen.scale * 0.14 * pulse;
          ctx.globalAlpha = 0.72 * pulse;
          ctx.fillStyle = "#fff4bd";
          ctx.beginPath();
          ctx.moveTo(sx - r, sy); ctx.lineTo(sx, sy - r);
          ctx.lineTo(sx + r, sy); ctx.lineTo(sx, sy + r);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
        pen.bird(2.4 + Math.sin(t * 0.85) * 0.9, 2.6 + Math.cos(t * 0.85) * 0.6, 5.2, 0.2);
        pen.bird(2.9 + Math.sin(t * 0.85 + 0.5) * 0.9, 2.2 + Math.cos(t * 0.85 + 0.5) * 0.6, 5.6, 1.4);
        pen.watercolorCloud(2.6, 2.8, 5.8, 1.15);
      },
      draw(pen, t) {
        pen.tileBase(10, 10, C.gravel, { paving: 1.4 });
        // Symmetric Champ de Mars lawns with organic grass tufts & wildflower speckles!
        for (const [lu, lv, du, dv, s] of [[0.5, 0.5, 2.2, 4.1, 1], [7.3, 0.5, 2.2, 4.1, 2], [0.5, 5.9, 2.8, 3.5, 3], [6.7, 5.9, 2.8, 3.5, 4]]) {
          pen.ground(lu, lv, du, dv, C.grass, 0.02);
          pen.grassDetail(lu, lv, du, dv, s, true);
        }
        // Central stone promenade + manicured flowerbeds & hedges!
        pen.ground(3.3, 5.2, 3.4, 4.3, "#f1e9d8", 0.02, PALETTE.ink, 0.6);
        pen.item(6.4, () => pen.hedge(0.55, 4.35, 2.1, 0.28, 0.35));
        pen.item(12.2, () => pen.hedge(7.35, 4.35, 2.1, 0.28, 0.35));
        pen.item(12.6, () => pen.flowerbed(0.7, 6.05, 2.3, 0.65, ["#e67c8c", "#f2cf66", "#faf6ec"]));
        pen.item(15.2, () => pen.flowerbed(6.9, 6.05, 2.3, 0.65, ["#b696d8", "#f2cf66", "#faf6ec"]));

        // Eiffel Tower + flapping birds!
        pen.item(8.0, () => drawEiffelTower(pen, 5.0, 3.9, t));
        pen.item(10.0, () => {
          pen.bird(2.6 + Math.sin(t * 0.9) * 0.6, 2.2 + Math.cos(t * 0.9) * 0.4, 3.4, 0);
          pen.bird(3.1 + Math.sin(t * 0.9 + 1) * 0.6, 2.6 + Math.cos(t * 0.9 + 1) * 0.4, 3.6, 2.2);
        });

        // Ornate foreground fountain + benches + lamps!
        pen.item(12.1, () => pen.fountain(4.45, 7.65, 0.02, 0.85, { jets: 6, jetH: 0.68, spin: true }));
        pen.item(11.4, () => pen.bench(3.15, 7.6, 0.02, "v"));
        pen.item(14.5, () => pen.bench(6.85, 8.3, 0.02, "u"));
        pen.item(10.2, () => pen.lamp(3.35, 6.3, 0.02));
        pen.item(13.2, () => pen.lamp(6.65, 6.3, 0.02));

        // HERO MICRO-STORY: Romantic Proposal, Photographer & Beret Artist!
        pen.item(12.9, () => {
          pen.person(5.9, 6.85, 0.02, { shirt: "#3d526b", pants: "#2f3842", scale: 0.88, seed: 1 });
          pen.person(6.42, 6.85, 0.02, { shirt: "#faf5eb", pants: "#faf5eb", dress: true, hair: "#6b442a", wave: true, scale: 0.98, seed: 2 });
          const hb = Math.sin(t * 3.5) * 0.08;
          pen.sphere(6.16, 6.85, 0.94 + hb, 0.1, "#d44b48", { lw: 0.45 });
          pen.person(5.55, 7.65, 0.02, { shirt: "#7d9870", flash: true, seed: 4, scale: 0.92 });
          pen.person(6.9, 7.45, 0.02, { shirt: "#d89a4a", wave: true, seed: 5, scale: 0.92 });
          pen.person(7.2, 7.05, 0.02, { shirt: "#b84f5a", dress: true, wave: true, seed: 6, scale: 0.9 });

          // Parisian painter with beret & wooden easel
          pen.line([3.4, 6.45, 0.02], [3.55, 6.45, 0.74], "#7b583d", 1.1);
          pen.line([3.7, 6.45, 0.02], [3.55, 6.45, 0.74], "#7b583d", 1.1);
          pen.box(3.38, 6.37, 0.36, 0.34, 0.08, 0.34, "#faf6ec", { shadow: false, noPlinth: true, lw: 0.58 });
          pen.person(3.55, 6.85, 0.02, { shirt: "#455a73", hat: "beret", scale: 0.92, seed: 8 });
        });

        pen.item(15.0, () => pen.flag(8.5, 8.6, 0.02, 1.48, ["#355c9c", "#f6f2e8", "#c8443a"]));

        for (const [tu, tv] of [[1.2, 1.2], [1.2, 3.1], [8.8, 1.2], [8.8, 3.1], [1.4, 7.4], [1.6, 8.9], [8.6, 7.4], [2.8, 8.9]]) {
          pen.item(tu + tv, () => pen.tree(tu, tv, 0.02, "round", 0.92));
        }

        const p1 = (t * 0.5) % 4;
        pen.item(2.6 + (1.5 + p1), () => {
          pen.person(2.6, 1.5 + p1, 0.02, { shirt: "#c95b4b", walk: true, seed: 11 });
          pen.dog(2.85, 1.85 + p1, 0.02, "#b58152", 11);
        });
        pen.item(7.1 + (5.5 - p1), () => pen.person(7.1, 5.5 - p1, 0.02, { shirt: "#4f748c", walk: true, dress: true, seed: 12 }));
      },
    },

    // (-1,-1): The Louvre & Glass Pyramid
    "-1,-1": {
      name: "The Louvre & Glass Pyramid",
      camZ: 1.5,
      estElements: 220,
      liveOverlay(pen, t) {
        pen.bird(2.8 + Math.sin(t * 0.9) * 0.8, 6.2 + Math.cos(t * 0.9) * 0.5, 3.4, 0.5);
        // Subtle animated fountain spray glints in the triangular reflecting pools
        const ctx = pen.ctx;
        ctx.save();
        for (const [fu, fv, ph] of [[2.6, 5.2, 0], [7.4, 4.9, 1.5], [5.8, 7.6, 2.8]]) {
          const p = 0.55 + 0.45 * Math.sin(t * 4.5 + ph);
          const [sx, sy] = pen.pt(fu, fv, 0.45 + p * 0.35);
          ctx.globalAlpha = 0.65 * p;
          ctx.fillStyle = "#f4fbfe";
          ctx.beginPath(); ctx.arc(sx, sy, pen.scale * 0.1 * p, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      },
      draw(pen, t) {
        pen.tileBase(10, 10, "#ede5d4", { paving: 1.15 });
        // Triangular & rectangular turquoise reflecting pools
        pen.water(3.2, 3.1, 1.85, 1.85, "#8cbcca", { z: -0.02, ripples: 4 });
        pen.water(5.95, 3.1, 1.85, 1.85, "#8cbcca", { z: -0.02, ripples: 4 });
        pen.water(3.2, 5.85, 1.85, 1.85, "#8cbcca", { z: -0.02, ripples: 4 });

        // Grand U-shaped Renaissance Louvre Palace Wings with pilasters, arched windows, dormers & pediment!
        pen.item(3.5, () => {
          pen.box(0.5, 0.5, 0, 8.8, 1.8, 1.75, C.stone, {
            plinth: true, pilasters: true,
            windows: { floors: 3, colsU: 10, colsV: 2, color: "#546978", arched: true, litChance: 0.16 },
            cornice: true, hatch: true,
          });
          pen.mansardRoof(0.5, 0.5, 1.86, 8.8, 1.8, 0.58, C.zinc, { dormers: true, chimneys: true });
          // Ornate Richelieu Central Pavilion with triangular pediment & golden crest!
          pen.box(3.8, 0.38, 0, 2.2, 2.02, 2.15, C.stoneWarm, {
            shadow: false, pilasters: true,
            windows: { floors: 3, colsU: 3, colsV: 2, color: "#4e6270", arched: true },
            cornice: true,
          });
          pen.mansardRoof(3.8, 0.38, 2.26, 2.2, 2.02, 0.78, C.zinc, { dormers: true, chimneys: false });
          pen.line([4.2, 1.4, 3.05], [5.6, 1.4, 3.05], C.gold, 1.5);
        });
        pen.item(6.0, () => {
          pen.box(0.5, 2.3, 0, 1.8, 6.7, 1.75, C.stone, {
            plinth: true, pilasters: true,
            windows: { floors: 3, colsU: 2, colsV: 8, color: "#546978", arched: true, litChance: 0.16 },
            cornice: true, hatch: true,
          });
          pen.mansardRoof(0.5, 2.3, 1.86, 1.8, 6.7, 0.58, C.zinc, { dormers: true, chimneys: true });
        });

        // Iconic Glass Pyramid (7-row diamond lattice!) + 3 flanking mini pyramids!
        pen.item(10.8, () => {
          pen.pyramid(4.1, 4.1, 0.02, 2.85, 2.85, 2.22, C.glass, { left: "#add2de", right: "#82aebc", lattice: 7 });
          pen.pyramid(3.05, 6.95, 0.02, 0.92, 0.92, 0.74, C.glass, { lattice: 3 });
          pen.pyramid(7.05, 3.05, 0.02, 0.92, 0.92, 0.74, C.glass, { lattice: 3 });
          pen.pyramid(7.05, 6.95, 0.02, 0.85, 0.85, 0.68, C.glass, { lattice: 3 });
        });

        // Courtyard benches, lamps, flowerbeds & bustling museum queue!
        pen.item(16.0, () => {
          pen.bench(8.3, 5.2, 0.02, "v");
          pen.lamp(3.0, 8.6, 0.02);
          pen.lamp(8.5, 3.0, 0.02);
          pen.flowerbed(7.9, 8.1, 1.5, 1.2, ["#e67c8c", "#faf6ec", "#f2cf66"]);
        });
        for (let i = 0; i < 8; i++) {
          const qu = 4.5 + i * 0.44, qv = 7.45 + Math.sin(i * 1.1) * 0.16;
          pen.item(qu + qv, () => pen.person(qu, qv, 0.02, {
            shirt: ["#c85a4a", "#4e768e", "#d8a84e", "#6d8f66", "#8c6684", "#404a56", "#d67762", "#4b7b94"][i],
            dress: i % 3 === 0, flash: i === 2, seed: i * 5,
          }));
        }
        const walkU = 2.8 + ((t * 0.65) % 5.6);
        pen.item(walkU + 8.9, () => pen.person(walkU, 8.9, 0.02, { shirt: "#d67762", walk: true, seed: 30 }));
        pen.item(8.9 + 6.7, () => pen.tree(8.9, 6.7, 0.02, "round", 0.86));
        pen.item(8.9 + 4.0, () => pen.tree(8.9, 4.0, 0.02, "round", 0.86));
      },
    },

    // (0,-1): Notre-Dame & Seine Riverbank
    "0,-1": {
      name: "Notre-Dame & The Seine",
      camZ: 1.7,
      estElements: 230,
      liveOverlay(pen, t) {
        pen.bird(3.8 + Math.sin(t * 1.05) * 0.9, 3.2 + Math.cos(t * 1.05) * 0.6, 4.8, 1.1);
        pen.bird(4.5 + Math.sin(t * 1.05 + 0.6) * 0.9, 2.7 + Math.cos(t * 1.05 + 0.6) * 0.6, 5.1, 2.2);
        // Subtle shimmering Seine water ripples around the Bateau-Mouche
        const ctx = pen.ctx;
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.62)";
        ctx.lineWidth = pen.inkWidth * 0.8;
        for (let i = 0; i < 4; i++) {
          const drift = Math.sin(t * 1.8 + i * 1.7) * 0.25;
          const [x1, y1] = pen.pt(6.2 + i * 0.7 + drift, 8.2 + (i % 2) * 0.5, -0.05);
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(x1 + 6, y1 - 2, x1 + 12, y1); ctx.stroke();
        }
        ctx.restore();
      },
      draw(pen, t) {
        pen.tileBase(10, 10, "#e8e0d0", { paving: 1.25 });
        pen.water(0.2, 6.7, 9.6, 3.1, C.water, { z: -0.1, ripples: 10 });
        // Stone quai parapet + wrought-iron railing & Parisian lamps!
        pen.box(0.2, 6.35, 0, 9.6, 0.35, 0.24, "#cfc6b4", { shadow: false, noPlinth: true, lw: 0.72 });
        pen.item(11.5, () => {
          pen.railing([0.3, 6.5], [9.7, 6.5], 0.24, 0.26);
          pen.lamp(2.5, 6.2, 0.02);
          pen.lamp(7.5, 6.2, 0.02);
        });

        // Notre-Dame Cathedral with Flying Buttresses, Triple Gothic Portals & Spoked Rose Window!
        pen.item(6.8, () => {
          pen.box(1.5, 1.2, 0, 5.4, 3.2, 2.05, C.stoneWarm, {
            plinth: true,
            windows: { floors: 2, colsU: 6, colsV: 3, color: "#4b5966", arched: true },
            hatch: true,
          });
          // 5 Flying Buttress ribs stepping out along the front nave wall!
          for (let i = 0; i < 5; i++) {
            const bu = 1.9 + i * 0.92;
            pen.box(bu, 4.4, 0, 0.24, 0.42, 1.75, C.stone, { shadow: false, noPlinth: true, lw: 0.6 });
            pen.line([bu + 0.12, 4.75, 1.55], [bu + 0.12, 4.4, 1.95], C.stone, 1.4);
            pen.line([bu + 0.12, 4.75, 1.55], [bu + 0.12, 4.4, 1.95], PALETTE.ink, 0.65);
          }
          pen.gableRoof(1.5, 1.2, 2.05, 5.4, 3.2, 0.78, C.zinc, "u");
          // Central Gothic copper flèche spire!
          pen.pyramid(4.1, 2.58, 2.75, 0.46, 0.46, 1.75, C.copper);
          pen.line([4.33, 2.81, 4.5], [4.33, 2.81, 4.95], C.gold, 1.2);
          // Twin Gothic bell towers with tall lancet louvers & corner balustrades
          pen.box(6.2, 1.15, 0, 1.18, 1.05, 3.35, C.stone, {
            windows: { floors: 3, colsU: 2, colsV: 2, color: "#4b5763", arched: true },
            cornice: true,
          });
          pen.box(6.2, 3.35, 0, 1.18, 1.05, 3.35, C.stone, {
            windows: { floors: 3, colsU: 2, colsV: 2, color: "#4b5763", arched: true },
            cornice: true,
          });
          pen.box(6.35, 2.2, 0, 0.98, 1.15, 2.45, C.stoneWarm, { shadow: false });
          // Triple pointed Gothic portals!
          for (const pv of [1.5, 2.55, 3.6]) {
            pen.poly([[7.38, pv, 0], [7.38, pv + 0.52, 0], [7.38, pv + 0.52, 0.75], [7.38, pv + 0.26, 1.0], [7.38, pv, 0.75]], "#4b4642", PALETTE.ink, 0.65);
          }
          // Spoked stained-glass Rose Window!
          pen.sphere(7.36, 2.78, 1.66, 0.38, "#83628a", { lw: 0.72 });
          pen.sphere(7.36, 2.78, 1.66, 0.18, "#e3c56d", { lw: 0.45 });
        });

        // 4 Classic Green Bouquiniste Riverside Bookstalls with colorful book spines & shoppers!
        for (let i = 0; i < 4; i++) {
          const bu = 0.9 + i * 2.15;
          pen.item(bu + 6.0, () => {
            pen.box(bu, 5.65, 0, 1.15, 0.52, 0.48, "#4b7258", { shadow: false, noPlinth: true, lw: 0.68 });
            // Open hinged lid with tiny colorful book row!
            pen.poly([[bu, 5.65, 0.48], [bu + 1.15, 5.65, 0.48], [bu + 1.15, 5.42, 0.85], [bu, 5.42, 0.85]], "#3e614a", PALETTE.ink, 0.6);
            pen.sphere(bu + 0.3, 5.9, 0.52, 0.08, "#e6b44e", { lw: 0.35 });
            pen.sphere(bu + 0.6, 5.9, 0.52, 0.08, "#c84a42", { lw: 0.35 });
            pen.sphere(bu + 0.9, 5.9, 0.52, 0.08, "#6a95b0", { lw: 0.35 });
            pen.person(bu + 0.55, 5.3, 0, { shirt: ["#c85a4a", "#4f748c", "#d8a84e", "#7e6387"][i], dress: i % 2 === 0, seed: i + 3 });
          });
        }

        // Animated Bateau-Mouche tour boat & seagulls!
        const boatU = 1.2 + ((t * 1.05) % 7.6);
        pen.item(boatU + 8.2, () => pen.boat(boatU, 8.2, -0.08, { style: "ferry", axis: "u", color: "#f5efe2", accent: "#c74b40" }));
        pen.item(14.0, () => pen.bird(3.5 + Math.sin(t * 1.1) * 1.2, 8.1, 1.4, 0.5));
        pen.item(8.7 + 1.4, () => pen.tree(8.7, 1.4, 0, "round", 0.9));
        pen.item(8.7 + 4.4, () => pen.tree(8.7, 4.4, 0, "round", 0.85));
        pen.item(0.9 + 4.6, () => pen.tree(0.9, 4.6, 0, "round", 0.9));
      },
    },

    // (1,-1): Montmartre & Sacré-Cœur
    "1,-1": {
      name: "Montmartre & Sacré-Cœur",
      camZ: 2.0,
      estElements: 230,
      liveOverlay(pen, t) {
        pen.watercolorCloud(7.2, 2.2, 5.5, 0.95);
        pen.smoke(1.6, 4.8, 2.7, 2);
        pen.bird(4.2 + Math.cos(t * 0.9) * 0.8, 4.4, 5.2, 0.7);
      },
      draw(pen, t) {
        pen.tileBase(10, 10, C.grass);
        pen.grassDetail(0.4, 5.8, 4.8, 3.8, 12, true);
        // Terraced Montmartre hill retaining walls with balustrades & flowerbeds!
        pen.box(0.4, 0.4, 0, 9.2, 5.5, 0.88, "#dcd3c1", { shadow: false, noPlinth: true });
        pen.ground(0.6, 0.6, 8.8, 5.1, "#96b377", 0.89, PALETTE.ink, 0.55);
        pen.grassDetail(0.7, 3.8, 8.4, 1.8, 15, true, 0.91);
        pen.box(1.0, 0.6, 0.89, 7.6, 3.7, 0.72, "#e5dcc9", { shadow: false, noPlinth: true });
        pen.ground(1.2, 0.8, 7.2, 3.3, "#f1e9da", 1.62, PALETTE.ink, 0.55);
        pen.item(7.8, () => {
          pen.railing([1.2, 4.25], [4.1, 4.25], 1.62, 0.25);
          pen.railing([5.9, 4.25], [8.3, 4.25], 1.62, 0.25);
          pen.flowerbed(6.2, 4.6, 2.2, 0.7, ["#e67c8c", "#f2cf66", "#faf6ec"], 0.89);
        });

        // Grand central monumental staircase
        pen.stairs(4.2, 4.35, 0.02, 1.62, 1.65, 2.75, 7, "v", "#f0e8d7");

        // Animated Red Montmartre Funicular climbing twin steel rails!
        const funP = 0.5 + 0.5 * Math.sin(t * 0.85);
        const fv = lerp(4.5, 8.2, funP), fz = lerp(1.56, 0.05, funP);
        pen.line([2.35, 4.35, 1.6], [2.35, 8.6, 0.04], PALETTE.ink, 0.95);
        pen.line([2.85, 4.35, 1.6], [2.85, 8.6, 0.04], PALETTE.ink, 0.95);
        pen.item(2.6 + fv, () => {
          pen.box(2.25, fv - 0.35, fz, 0.72, 0.74, 0.48, C.rouge, {
            shadow: false, noPlinth: true,
            windows: { floors: 1, colsU: 1, colsV: 2, color: "#b6d5e0" },
          });
        });

        // Sacré-Cœur Basilica with arched triple portico, colonnade & elongated white domes!
        pen.item(6.5, () => {
          pen.box(2.2, 1.15, 1.62, 5.4, 2.35, 1.32, "#f8f4ec", {
            pilasters: true,
            windows: { floors: 2, colsU: 6, colsV: 2, color: "#9eb2be", arched: true },
            cornice: true,
          });
          // Triple entrance arches
          for (const au of [3.7, 4.65, 5.6]) {
            pen.poly([[au, 3.52, 1.62], [au + 0.52, 3.52, 1.62], [au + 0.52, 3.52, 2.25], [au + 0.26, 3.52, 2.48], [au, 3.52, 2.25]], "#7a858e", PALETTE.ink, 0.6);
          }
          pen.dome(4.9, 2.32, 2.95, 0.96, 1.85, "#fbf8f2", { pointed: true, ribs: 7 });
          pen.dome(3.15, 2.32, 2.95, 0.58, 1.12, "#fbf8f2", { pointed: true, ribs: 5 });
          pen.dome(6.65, 2.32, 2.95, 0.58, 1.12, "#fbf8f2", { pointed: true, ribs: 5 });
        });

        // Place du Tertre cobblestone artists' square with café umbrellas, easels & lamps!
        pen.item(14.5, () => {
          pen.ground(5.5, 6.4, 4.0, 3.1, "#efe6d5", 0.02);
          pen.paving(5.6, 6.5, 3.8, 2.9, 0.8, 0.025);
          pen.cafeSet(6.6, 7.6, 0.02, C.rouge);
          pen.cafeSet(8.3, 7.6, 0.02, "#4a7792");
          pen.cafeSet(7.4, 8.8, 0.02, "#e0b34c");
          pen.person(6.0, 8.4, 0.02, { shirt: "#455a73", hat: "beret", seed: 10 });
          pen.person(8.9, 8.5, 0.02, { shirt: "#c85244", dress: true, wave: true, seed: 11 });
          pen.lamp(5.8, 6.8, 0.02);
        });
        pen.item(1.1 + 7.2, () => pen.tree(1.1, 7.2, 0.02, "round", 0.95));
        pen.item(1.2 + 8.6, () => pen.bench(1.2, 8.6, 0.02, "u"));
        pen.item(8.9 + 5.1, () => pen.tree(8.9, 5.1, 0.89, "cypress", 0.92));
        pen.item(1.1 + 4.9, () => pen.tree(1.1, 4.9, 0.89, "cypress", 0.88));
      },
    },

    // (1,0): Champs-Élysées & Arc de Triomphe Roundabout
    "1,0": {
      name: "Arc de Triomphe & Champs-Élysées",
      camZ: 1.6,
      estElements: 200,
      liveOverlay(pen, t) {
        // Warm flickering Eternal Flame glow beneath the central vault
        const ctx = pen.ctx;
        const fl = 0.65 + 0.35 * Math.sin(t * 9.0);
        const [fx, fy] = pen.pt(5.55, 5.35, 0.45);
        ctx.save();
        const gr = ctx.createRadialGradient(fx, fy, 0, fx, fy, pen.scale * 0.45 * fl);
        gr.addColorStop(0, "rgba(255, 224, 128, 0.72)");
        gr.addColorStop(1, "rgba(255, 165, 64, 0)");
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.arc(fx, fy, pen.scale * 0.45 * fl, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        pen.bird(2.5 + Math.sin(t * 0.95) * 0.7, 3.0, 4.2, 1.9);
      },
      draw(pen, t) {
        pen.tileBase(10, 10, "#e9e1d0", { paving: 1.25 });
        const ring = [], inner = [];
        for (let i = 0; i < 20; i++) {
          const a = (i / 20) * Math.PI * 2;
          ring.push([5 + Math.cos(a) * 4.35, 5 + Math.sin(a) * 4.35, 0.02]);
          inner.push([5 + Math.cos(a) * 2.55, 5 + Math.sin(a) * 2.55, 0.03]);
        }
        pen.poly(ring, "#d5cec0", PALETTE.ink, 0.9);
        pen.poly(inner, "#f2ebdc", PALETTE.ink, 0.85);
        // Star-ray paving ticks around Place de l'Étoile!
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          pen.line([5 + Math.cos(a) * 2.6, 5 + Math.sin(a) * 2.6, 0.025], [5 + Math.cos(a) * 4.25, 5 + Math.sin(a) * 4.25, 0.025], "rgba(255,255,255,0.45)", 0.6);
        }

        // Monumental Arc de Triomphe with sculpted relief panels, vaulted arches, bollards & eternal flame!
        pen.item(10.0, () => {
          pen.box(3.4, 3.8, 0.03, 1.1, 2.4, 1.8, C.stone, { shadow: false, plinth: true, pilasters: true });
          pen.box(5.5, 3.8, 0.03, 1.1, 2.4, 1.8, C.stone, { shadow: false, plinth: true, pilasters: true, hatch: true });
          pen.box(3.3, 3.7, 1.82, 3.4, 2.6, 1.2, C.stoneWarm, { shadow: false, cornice: true, parapet: true });
          // Sculpted frieze relief band & carved shield medallions!
          pen.line([3.3, 6.3, 2.2], [6.7, 6.3, 2.2], PALETTE.ink, 0.72);
          pen.line([6.7, 3.7, 2.2], [6.7, 6.3, 2.2], PALETTE.ink, 0.72);
          for (let m = 0; m < 4; m++) {
            pen.sphere(3.75 + m * 0.82, 6.32, 2.58, 0.14, "#dfd3ba", { lw: 0.5 });
          }
          // Deep shadowed front & side archways!
          pen.poly([[4.5, 6.22, 0.03], [5.5, 6.22, 0.03], [5.5, 6.22, 1.58], [5.0, 6.22, 1.82], [4.5, 6.22, 1.58]], "#665c52", PALETTE.ink, 0.75);
          pen.poly([[6.62, 4.55, 0.03], [6.62, 5.45, 0.03], [6.62, 5.45, 1.28], [6.62, 5.0, 1.52], [6.62, 4.55, 1.28]], "#574e46", PALETTE.ink, 0.75);
          // Eternal flame + waving French flag
          const fl = 0.075 + 0.03 * Math.sin(t * 9);
          pen.sphere(5.0, 5.45, 0.24, fl, "#e88a3c", { lw: 0.4 });
          pen.flag(5.0, 5.0, 3.12, 1.0, ["#355c9c", "#f6f2e8", "#c8443a"]);
        });

        // 6 vintage cars orbiting smoothly around the Arc de Triomphe!
        const carCols = ["#c85548", "#5f859c", "#e4c25e", "#74966e", "#434b56", "#d88a78"];
        for (let i = 0; i < 6; i++) {
          const a = t * 0.62 + (i / 6) * Math.PI * 2;
          const cu = 5 + Math.cos(a) * 3.45, cv = 5 + Math.sin(a) * 3.45;
          const axis = Math.abs(Math.sin(a)) > Math.abs(Math.cos(a)) ? "u" : "v";
          pen.item(cu + cv, () => pen.vehicle(cu, cv, 0.03, { axis, style: "sedan", color: carCols[i] }));
        }

        // Corner Champs-Élysées trees, flowerbeds & Parisian lamps!
        for (const [tu, tv] of [[1.0, 1.0], [9.0, 1.0], [1.0, 9.0], [9.0, 9.0]]) {
          pen.item(tu + tv, () => pen.tree(tu, tv, 0.02, "round", 0.88));
        }
        pen.item(3.5, () => pen.lamp(1.8, 1.8, 0.02));
        pen.item(16.5, () => pen.lamp(8.2, 8.2, 0.02));
      },
    },

    // (1,1): Moulin Rouge, Parisian Bistro & Art-Nouveau Métro!
    "1,1": {
      name: "Moulin Rouge & Café Corner",
      camZ: 1.7,
      estElements: 230,
      liveOverlay(pen, t) {
        // Warm twinkling cabaret bulb glints + Haussmann chimney smoke wisps
        const ctx = pen.ctx;
        ctx.save();
        for (let i = 0; i < 6; i++) {
          const p = Math.max(0, Math.sin(t * 5.2 + i * 1.1));
          if (p < 0.3) continue;
          const [bx, by] = pen.pt(3.6 + i * 0.52, 5.5, 2.25);
          ctx.globalAlpha = 0.7 * p;
          ctx.fillStyle = "#fff1ad";
          ctx.beginPath(); ctx.arc(bx, by, pen.scale * 0.08 * p, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
        pen.smoke(2.4, 2.2, 4.9, 2);
        pen.smoke(7.6, 2.2, 4.9, 2);
      },
      draw(pen, t) {
        pen.tileBase(10, 10, "#ebe2d1", { paving: 1.05 });
        pen.ground(0.4, 5.4, 9.2, 4.2, "#e5dbc8", 0.02);

        // Haussmann Corner Bistro with iron balconies, dormers & scalloped awning!
        pen.item(5.2, () => {
          drawHaussmann(pen, 0.6, 0.65, 0, 3.6, 4.15, 2.4, C.stone);
          pen.awning(0.55, 4.8, 0.56, 3.7, 0.72, "u", C.awning, "#faf4e6");
        });

        // Iconic Moulin Rouge Cabaret with twinkling golden marquee & open-lattice spinning windmill sails!
        pen.item(7.6, () => {
          pen.box(4.6, 0.85, 0, 4.6, 3.95, 2.2, "#c9473e", {
            plinth: true,
            windows: { floors: 2, colsU: 4, colsV: 3, color: "#f6d88c", litChance: 0.88, arched: true },
            cornice: true,
          });
          // Marquee canopy with twinkling animated bulbs!
          pen.box(5.3, 4.8, 0.55, 3.2, 0.72, 0.36, "#f4d26a", { shadow: false, noPlinth: true, lw: 0.75 });
          for (let b = 0; b < 6; b++) {
            const on = (Math.floor(t * 6) + b) % 2 === 0;
            pen.sphere(5.55 + b * 0.54, 5.54, 0.75, 0.06, on ? "#fffce0" : "#d99d36", { lw: 0.3 });
          }
          // Red windmill drum tower on roof
          pen.cylinder(6.9, 2.82, 2.2, 0.96, 1.65, C.rouge, { top: "#9e332c", flutes: 6 });
          pen.dome(6.9, 2.82, 3.85, 0.96, 0.76, "#9e332c", { finial: true, ribs: 6 });

          // Spinning 4-blade crimson lattice windmill sails with white crossbars!
          const hubU = 6.9, hubV = 3.86, hubZ = 3.4, ang = t * 1.15, bLen = 1.72;
          for (let i = 0; i < 4; i++) {
            const a = ang + (i * Math.PI) / 2;
            const du = Math.cos(a) * bLen, dz = Math.sin(a) * bLen;
            const pu = -Math.sin(a) * 0.28, pz = Math.cos(a) * 0.28;
            pen.poly(
              [[hubU, hubV, hubZ], [hubU + du, hubV, hubZ + dz], [hubU + du + pu, hubV, hubZ + dz + pz], [hubU + pu * 0.5, hubV, hubZ + pz * 0.5]],
              "#d64b42", PALETTE.ink, 0.75
            );
            // Lattice rungs across blade!
            for (let r = 1; r <= 3; r++) {
              const f = r / 4;
              pen.line([hubU + du * f, hubV, hubZ + dz * f], [hubU + du * f + pu, hubV, hubZ + dz * f + pz], "#faf4e6", 0.65);
            }
          }
          pen.sphere(hubU, hubV, hubZ, 0.17, C.gold, { lw: 0.7 });
        });

        // Sidewalk bistro café tables with umbrellas, patrons, Colonne Morris & Flower Stall!
        for (let i = 0; i < 3; i++) {
          const tu = 1.25 + i * 1.3;
          pen.item(tu + 6.45, () => {
            pen.cafeSet(tu, 6.45, 0.02, i === 1 ? C.awning : null);
            pen.person(tu - 0.36, 6.55, 0.02, { shirt: ["#4f748c", "#d89a4a", "#7f6387"][i], seed: i + 1 });
            pen.person(tu + 0.36, 6.45, 0.02, { shirt: ["#c85a4a", "#6d8c63", "#404a56"][i], dress: i === 0, seed: i + 9 });
          });
        }
        // Classic green Parisian Colonne Morris poster kiosk + Guimard Métro Arch!
        pen.item(7.8 + 7.2, () => {
          pen.cylinder(7.8, 7.2, 0.02, 0.34, 1.18, "#426352", { lw: 0.75 });
          pen.dome(7.8, 7.2, 1.2, 0.38, 0.4, "#395747", { ribs: 5 });
          pen.lamp(6.5, 6.2, 0.02);
        });
        // Corner flower & crepe market stall!
        pen.item(1.8 + 8.3, () => pen.stall(0.85, 7.75, 0.02, 1.9, 0.95, "#4c7861", "#faf4e6", ["#e67c8a", "#f0c954", "#b28cd6", "#e07a5f"]));
        pen.item(4.8 + 8.1, () => pen.tree(4.8, 8.1, 0.02, "round", 0.82));
        pen.item(5.9 + 8.6, () => pen.bench(5.9, 8.6, 0.02, "u"));

        const su = 1.0 + ((t * 0.8) % 8.0);
        pen.item(su + 8.9, () => pen.person(su, 8.9, 0.02, { shirt: "#c5463d", walk: true, seed: 21 }));
        pen.item(9.2 - su * 0.7 + 9.1, () => {
          pen.person(9.2 - su * 0.7, 9.1, 0.02, { shirt: "#4a6c82", walk: true, dress: true, seed: 22 });
          pen.dog(8.9 - su * 0.7, 9.2, 0.02, "#d8c29d", 22);
        });
      },
    },

    // (0,1): Jardin du Luxembourg & Toy Sailboat Pond
    "0,1": {
      name: "Palais Garnier Opera",
      camZ: 1.8,
      estElements: 220,
      liveOverlay(pen, t) {
        // Warm golden candelabra glow on Place de l'Opéra
        const ctx = pen.ctx;
        ctx.save();
        for (const [lu, lv] of [[2.2, 6.4], [4.0, 8.2]]) {
          const p = 0.75 + 0.25 * Math.sin(t * 3.5 + lu);
          const [lx, ly] = pen.pt(lu, lv, 1.05);
          const gr = ctx.createRadialGradient(lx, ly, 0, lx, ly, pen.scale * 0.32);
          gr.addColorStop(0, `rgba(255, 232, 150, ${0.42 * p})`);
          gr.addColorStop(1, "rgba(255, 232, 150, 0)");
          ctx.fillStyle = gr;
          ctx.beginPath(); ctx.arc(lx, ly, pen.scale * 0.32, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
        pen.bird(6.8 + Math.sin(t * 0.85) * 0.7, 3.0, 4.8, 0.3);
      },
      draw(pen, t) {
        pen.tileBase(10, 10, C.gravel, { paving: 1.4 });
        for (const [lu, lv, s] of [[0.4, 3.6, 5], [7.6, 3.6, 6]]) {
          pen.ground(lu, lv, 2.0, 5.8, C.grass, 0.02);
          pen.grassDetail(lu, lv, 2.0, 5.8, s, true);
        }
        pen.item(9.0, () => {
          pen.flowerbed(0.55, 3.75, 1.65, 0.7, ["#e67c8c", "#f2cf66", "#faf6ec"]);
          pen.flowerbed(7.75, 3.75, 1.65, 0.7, ["#b28cd6", "#f2cf66", "#faf6ec"]);
        });

        // Luxembourg Palace across the back with pilasters, dormers & dome!
        pen.item(3.8, () => {
          pen.box(0.8, 0.55, 0, 8.4, 2.15, 1.6, C.stone, {
            plinth: true, pilasters: true,
            windows: { floors: 2, colsU: 9, colsV: 2, color: "#546978", arched: true },
            cornice: true,
          });
          pen.mansardRoof(0.8, 0.55, 1.71, 8.4, 2.15, 0.5, C.zinc, { dormers: true, chimneys: true });
          pen.dome(5.0, 1.62, 2.22, 0.74, 0.88, C.zinc, { ribs: 6 });
        });

        // Grand Bassin Pond with lily pads & 4 colorful vintage wooden toy sailboats!
        pen.water(2.85, 4.05, 4.3, 4.25, C.water, { z: -0.04, ripples: 8 });
        const sails = ["#c84a42", "#477099", "#e0b34c", "#6c9c64"];
        for (let i = 0; i < 4; i++) {
          const a = t * 0.52 + (i * Math.PI * 2) / 4;
          const bu = 5.0 + Math.cos(a) * 1.4, bv = 6.18 + Math.sin(a) * 1.38;
          pen.item(bu + bv, () => pen.boat(bu, bv, -0.02, { style: "sailboat", color: "#b67e52", accent: sails[i] }));
        }

        // Kids, parents, park benches & clipped trees!
        pen.item(12.2, () => {
          pen.person(3.5, 8.65, 0.02, { shirt: "#d89a4a", wave: true, scale: 0.78, seed: 3 });
          pen.person(4.2, 8.75, 0.02, { shirt: "#4f748c", scale: 0.95, seed: 4 });
          pen.person(6.5, 8.65, 0.02, { shirt: "#c85a4a", wave: true, scale: 0.78, seed: 5 });
          pen.bench(5.2, 8.95, 0.02, "u");
          pen.lamp(2.6, 8.5, 0.02);
          pen.lamp(7.4, 8.5, 0.02);
        });
        for (const [tu, tv] of [[1.4, 5.2], [1.4, 7.1], [1.4, 8.8], [8.6, 5.2], [8.6, 7.1], [8.6, 8.8]]) {
          pen.item(tu + tv, () => pen.tree(tu, tv, 0.02, "round", 0.85));
        }
      },
    },

    // (-1,1): Palais Garnier Opera House
    "-1,1": {
      name: "Jardin du Luxembourg",
      camZ: 1.5,
      estElements: 210,
      liveOverlay(pen, t) {
        // Subtle shimmering sailboat pond water glints + gentle birds
        const ctx = pen.ctx;
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.62)";
        ctx.lineWidth = pen.inkWidth * 0.75;
        for (let i = 0; i < 4; i++) {
          const drift = Math.sin(t * 1.6 + i * 1.4) * 0.18;
          const [x1, y1] = pen.pt(3.8 + i * 0.6 + drift, 5.5 + (i % 2) * 0.7, 0.02);
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(x1 + 5, y1 - 1.5, x1 + 10, y1); ctx.stroke();
        }
        ctx.restore();
        pen.bird(2.6 + Math.cos(t * 0.9) * 0.8, 3.2, 3.8, 1.2);
      },
      draw(pen, t) {
        pen.tileBase(10, 10, "#ece4d4", { paving: 1.15 });
        pen.ground(4.0, 6.8, 2.0, 2.8, C.rouge, 0.02, PALETTE.ink, 0.65);

        pen.item(7.6, () => {
          pen.box(1.05, 1.05, 0, 7.9, 5.45, 1.95, C.stone, {
            plinth: true, pilasters: true,
            windows: { floors: 2, colsU: 7, colsV: 5, color: "#4d5e6a", arched: true, litChance: 0.32 },
            cornice: true, hatch: true,
          });
          // Fluted Corinthian Colonnade along grand facade
          for (let i = 0; i < 7; i++) {
            pen.cylinder(1.55 + i * 1.15, 6.5, 0, 0.14, 1.9, "#f5eddd", { lw: 0.58, flutes: 3 });
          }
          // Stage flytower & rear triangular pediment
          pen.box(2.4, 1.25, 1.95, 5.2, 2.15, 1.15, C.stoneWarm, { shadow: false, pilasters: true });
          pen.gableRoof(2.4, 1.25, 3.1, 5.2, 2.15, 0.78, C.copper, "u");
          // Grand ribbed verdigris copper dome!
          pen.dome(5.0, 4.2, 2.1, 1.48, 1.72, C.copper, { ribs: 8, finialCol: C.gold });
          // Golden rooftop Apollo & Pegasus statues
          pen.sphere(2.1, 6.25, 2.28, 0.17, C.gold, { lw: 0.52 });
          pen.sphere(5.0, 6.25, 2.38, 0.2, C.gold, { lw: 0.52 });
          pen.sphere(7.9, 6.25, 2.28, 0.17, C.gold, { lw: 0.52 });
        });

        // Ornate bronze opera lamps, flowerbeds & evening concertgoers!
        pen.item(14.5, () => {
          pen.lamp(3.7, 7.2, 0.02);
          pen.lamp(6.3, 7.2, 0.02);
          pen.lamp(3.7, 9.0, 0.02);
          pen.lamp(6.3, 9.0, 0.02);
          pen.flowerbed(1.2, 7.2, 1.9, 0.8, ["#e67c8c", "#faf6ec", "#f2cf66"]);
          pen.flowerbed(6.9, 7.2, 1.9, 0.8, ["#e67c8c", "#faf6ec", "#f2cf66"]);
        });
        for (let i = 0; i < 5; i++) {
          const vPos = 9.3 - ((t * 0.45 + i * 0.55) % 2.4);
          const uPos = 4.5 + (i % 2) * 0.95;
          pen.item(uPos + vPos, () => pen.person(uPos, vPos, 0.02, {
            shirt: i % 2 === 0 ? "#2e343d" : "#b84550", dress: i % 2 === 1, walk: true, seed: i + 10,
          }));
        }
        pen.item(1.2 + 8.6, () => pen.tree(1.2, 8.6, 0.02, "round", 0.86));
        pen.item(8.8 + 8.6, () => pen.tree(8.8, 8.6, 0.02, "round", 0.86));
      },
    },

    // (-1,0): Canal Saint-Martin & Arched Cast-Iron Footbridges
    "-1,0": {
      name: "Canal Saint-Martin",
      camZ: 1.4,
      estElements: 220,
      liveOverlay(pen, t) {
        pen.smoke(2.1, 2.8, 3.6, 2);
        const ctx = pen.ctx;
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.6)";
        ctx.lineWidth = pen.inkWidth * 0.75;
        for (let i = 0; i < 4; i++) {
          const drift = Math.sin(t * 1.7 + i * 1.5) * 0.16;
          const [x1, y1] = pen.pt(4.6 + (i % 2) * 0.6, 2.8 + i * 1.4 + drift, -0.04);
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(x1 + 5, y1 - 1.5, x1 + 10, y1); ctx.stroke();
        }
        ctx.restore();
      },
      draw(pen, t) {
        pen.tileBase(10, 10, "#e7dfd0", { paving: 1.25 });
        pen.water(3.2, 0.2, 3.6, 9.6, C.water, { z: -0.1, ripples: 10 });
        for (const [lu, s] of [[0.4, 8], [7.1, 9]]) {
          pen.ground(lu, 0.4, 2.5, 9.2, C.grass, 0.02);
          pen.grassDetail(lu, 0.4, 2.5, 9.2, s, true);
        }
        // Canal side iron railings & lamps!
        pen.item(8.5, () => {
          pen.railing([3.05, 0.5], [3.05, 9.5], 0.02, 0.26);
          pen.railing([6.95, 0.5], [6.95, 9.5], 0.02, 0.26);
          pen.lamp(2.8, 4.9, 0.02);
          pen.lamp(7.2, 4.9, 0.02);
        });

        // Animated canal barge gliding cleanly down the canal!
        const bv = 1.4 + ((t * 0.85) % 7.2);
        pen.item(5.0 + bv, () => pen.boat(5.0, bv, -0.08, { style: "narrowboat", axis: "v", accent: "#c85648" }));

        // Two ornate arched cast-iron Venetian footbridges with vertical balusters!
        for (const brV of [2.85, 6.95]) {
          pen.item(5.2 + brV, () => {
            const ptsTop = [], ptsBot = [];
            for (let i = 0; i <= 10; i++) {
              const f = i / 10, u = lerp(2.65, 7.35, f), z = Math.sin(f * Math.PI) * 0.98;
              ptsTop.push([u, brV - 0.38, z]);
              ptsBot.push([u, brV + 0.38, z]);
            }
            for (let i = 0; i < 10; i++) {
              pen.poly([ptsTop[i], ptsTop[i + 1], ptsBot[i + 1], ptsBot[i]], "#547363", PALETTE.ink, 0.72);
              pen.line([ptsBot[i][0], ptsBot[i][1], ptsBot[i][2] + 0.34], [ptsBot[i + 1][0], ptsBot[i + 1][1], ptsBot[i + 1][2] + 0.34], "#375044", 0.95);
              pen.line([ptsBot[i][0], ptsBot[i][1], ptsBot[i][2]], [ptsBot[i][0], ptsBot[i][1], ptsBot[i][2] + 0.34], "#375044", 0.55);
            }
          });
        }

        // Haussmann canal-side bistro + picnic blanket + benches + trees!
        pen.item(3.2, () => {
          drawHaussmann(pen, 0.4, 0.5, 0.02, 2.2, 2.4, 1.55, C.stoneWarm);
          pen.awning(0.4, 2.9, 0.45, 2.2, 0.5, "u", C.awning, "#faf4e6");
        });
        pen.item(14.0, () => {
          pen.ground(7.4, 6.2, 1.7, 1.2, "#f5eee0", 0.025, PALETTE.ink, 0.55);
          pen.ground(7.55, 6.35, 1.4, 0.9, "#c85648", 0.03, null);
          pen.person(7.9, 6.75, 0.03, { shirt: "#4f748c", seed: 3 });
          pen.person(8.5, 6.85, 0.03, { shirt: "#e0b34c", dress: true, seed: 4 });
          pen.bench(1.6, 6.2, 0.02, "v");
        });
        for (const [tu, tv] of [[1.3, 4.6], [1.3, 8.1], [8.5, 1.6], [8.5, 4.6], [8.5, 8.5]]) {
          pen.item(tu + tv, () => pen.tree(tu, tv, 0.02, "round", 0.92));
        }
        const wv = 1.0 + ((t * 0.9) % 8.0);
        pen.item(7.45 + wv, () => pen.person(7.45, wv, 0.02, { shirt: "#d89a4a", walk: true, seed: 42 }));
      },
    },
  },

  satellites: {
    nw: {
      name: "Versailles",
      draw(pen) {
        pen.tileBase(4.8, 4.8, "#ebe3d2", { thick: 0.36 });
        pen.ground(0.4, 2.5, 4.0, 1.9, C.grass, 0.02);
        pen.grassDetail(0.4, 2.5, 4.0, 1.9, 21, true);
        pen.item(3.5, () => {
          pen.box(0.5, 0.5, 0, 3.8, 1.5, 1.2, "#efe4c8", {
            plinth: true, pilasters: true,
            windows: { floors: 2, colsU: 5, colsV: 2, color: "#5e7584", arched: true },
            cornice: true,
          });
          pen.mansardRoof(0.5, 0.5, 1.3, 3.8, 1.5, 0.34, C.gold, { dormers: false, chimneys: false });
        });
        pen.item(5.8, () => pen.fountain(2.4, 3.5, 0.02, 0.65, { jets: 5, jetH: 0.48 }));
      },
    },
    ne: {
      name: "Centre Pompidou",
      draw(pen) {
        pen.tileBase(4.8, 4.8, "#e6dfd0", { thick: 0.36, paving: 0.95 });
        pen.item(4.5, () => {
          pen.box(0.7, 0.9, 0, 3.4, 2.6, 2.05, "#dfe6ea", {
            windows: { floors: 4, band: true, color: "#9eb8c4" },
            rooftop: true,
          });
          pen.line([0.7, 3.55, 0.2], [4.1, 3.55, 1.9], "#3b6ea5", 2.5);
          pen.line([0.7, 3.55, 0.72], [4.1, 3.55, 2.0], "#cf483c", 2.2);
          pen.line([4.15, 1.1, 0.3], [4.15, 3.3, 0.3], "#e0b341", 2.2);
          pen.line([4.15, 1.1, 1.2], [4.15, 3.3, 1.2], "#599463", 2.0);
        });
      },
    },
    sw: {
      name: "Île aux Cygnes",
      draw(pen, t) {
        pen.tileBase(4.8, 4.8, C.water, { thick: 0.36 });
        pen.water(0.2, 0.2, 4.4, 4.4, C.water, { z: 0.01, ripples: 5 });
        pen.item(4.5, () => {
          pen.box(1.5, 1.5, 0.01, 1.8, 1.8, 0.32, "#dcd3c1", { shadow: false, noPlinth: true });
          pen.box(1.9, 1.9, 0.33, 1.0, 1.0, 0.65, C.stone, { shadow: false, noPlinth: true, cornice: true });
          pen.cylinder(2.4, 2.4, 0.98, 0.24, 1.05, C.copper, { flutes: 4 });
          pen.sphere(2.4, 2.4, 2.15, 0.18, C.copper);
          pen.line([2.55, 2.4, 1.85], [2.75, 2.4, 2.62], C.copper, 1.8);
          pen.sphere(2.75, 2.4, 2.7, 0.1, "#f2b84b", { lw: 0.4 });
        });
        const bu = 1.0 + Math.sin(t * 0.9) * 0.7;
        pen.item(6.5, () => pen.boat(bu + 1.4, 3.9, 0.02, { style: "sailboat", accent: "#c84a42" }));
      },
    },
    se: {
      name: "La Défense",
      draw(pen) {
        pen.tileBase(4.8, 4.8, "#e6dfd0", { thick: 0.36, paving: 0.95 });
        pen.item(4.8, () => {
          pen.box(1.0, 1.1, 0, 0.65, 2.2, 2.25, "#f7f4ec", { shadow: false, windows: { floors: 4, band: true, color: "#bcc9d1" } });
          pen.box(1.65, 1.1, 0, 1.5, 2.2, 0.25, "#d8d1c2", { shadow: false, noPlinth: true });
          pen.poly([[1.65, 1.1, 0.25], [3.15, 1.1, 0.25], [3.15, 1.1, 1.85], [1.65, 1.1, 1.85]], "#b8c7d1", PALETTE.ink, 0.6);
          pen.box(3.15, 1.1, 0, 0.65, 2.2, 2.25, "#f7f4ec", { shadow: false, windows: { floors: 4, band: true, color: "#bcc9d1" } });
          pen.box(1.0, 1.1, 1.85, 2.8, 2.2, 0.45, "#f7f4ec", { shadow: false, noPlinth: true });
        });
        pen.item(2.8, () => pen.box(0.4, 0.4, 0, 0.85, 0.85, 2.6, C.glass, { windows: { floors: 5, band: true, color: "#5d8294" } }));
      },
    },
  },
};
