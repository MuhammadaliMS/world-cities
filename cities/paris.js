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
      night: {
        flood: [{ cols: ["#6e4429", "#4a2c18", "#a06d43", "#36210f", "#94673f"], tint: "#ffd27a", k: 0.92, gain: 1.8 }],
        lights: [{ u: 4.85, v: 4.85, z: 13.4, r: 0.9, col: "#fff2c0", a: 0.9 }, { u: 4.85, v: 4.85, z: 6.5, r: 3.8, col: "#ffb84a", a: 0.3 }, { u: 4.85, v: 4.85, z: 0.2, r: 3.4, col: "#ffc670", a: 0.3, flat: true }],
      },
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
      night: {
        flood: [{ cols: ["#dcc283", "#b09b69", "#c6af76", "#cfb67b", "#bba56f", "#dec68a", "#e0c88f", "#e0c992", "#9a885c"], tint: "#ffc977", k: 0.55, gain: 1.3 }],
        windows: 0.3,
      },
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
      night: {
        flood: [{ cols: ["#d9bf8a","#988661","#ae996e","#b29d71","#b8a275","#bfa879","#c3ac7c","#cab280","#ceb583","#dbc391","#ddc596","#dec798","#dfc99c","#e1cca1","#e1cda4"], tint: "#ffd58a", k: 0.6, gain: 1.4 }],
        windows: 0.25,
        lights: [{ u: 5, v: 7, z: 0.2, r: 3.2, col: "#ffc670", a: 0.18, flat: true }],
      },
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
      night: {
        flood: [{ cols: ["#a59877", "#a9a088", "#b1a380", "#b5ab92", "#b8a985", "#bcb297", "#c2b28b", "#c6bb9f", "#c9b891", "#cdc2a5", "#d0bf96", "#d4c399", "#d4c9ab", "#d9c89c", "#d9cdaf", "#ded2b2", "#e0cea2", "#e5d2a5", "#e5d9b8", "#eaddbc", "#ecd9aa", "#ecdaac", "#eddbad", "#eddbae", "#eeddb3", "#efdfb7", "#f0e1bb", "#f1e4c2", "#f1e5c3", "#f1e5c4", "#f2e5c4", "#f2e5c5", "#f2e7c8", "#f3e8cb", "#f4e9ce"], tint: "#fff1d6", k: 0.7, gain: 1.5 }],
        windows: 0.3,
        lights: [{ u: 5, v: 3.2, z: 4, r: 3, col: "#fff0d0", a: 0.22 }],
      },
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
      night: {
        flood: [{ cols: ["#6f532b", "#6f542b", "#6f542c", "#6f5636", "#6f5736", "#6f5737", "#6f5834", "#6f5939", "#6f5d41", "#6f624c", "#70542c", "#705733", "#705737", "#705834", "#705837", "#705c3f", "#705d41", "#70624d", "#70634d", "#71552e", "#71562d", "#715835", "#715837", "#715838", "#715935", "#715936", "#715938", "#715a38", "#71634d", "#71644e", "#72562e", "#72572e", "#725938", "#725a36", "#725a38", "#725a39", "#725b39", "#72644e", "#72664f", "#73572e", "#73572f", "#735938", "#735a38", "#735a39", "#735b37", "#735b39", "#735c3a", "#73654f", "#74582f", "#745b39", "#745b3a", "#745c3a", "#745d3b", "#746041", "#746141", "#74664e", "#74664f", "#75582f", "#755a35", "#755b3a", "#755c38", "#755c3a", "#755d3a", "#755d3b", "#755e3d", "#756144", "#756244", "#75674f", "#765a30", "#765a31", "#765c3a", "#765c3b", "#765d38", "#765d3b", "#765e39", "#765e3b", "#766750", "#766951", "#775b32", "#775c32", "#775d3b", "#775e39", "#775e3b", "#775e3c", "#775f3a", "#775f3c", "#77603e", "#776851", "#776951", "#785c33", "#785e3b", "#785e3c", "#785f3a", "#785f3c", "#785f3d", "#78603c", "#78613f", "#786952", "#786a52", "#795b31", "#795f3c", "#795f3d", "#79603d", "#79613f", "#79623f", "#796240", "#796b52", "#7a5d32", "#7a5e34", "#7a6036", "#7a603b", "#7a603d", "#7a613c", "#7a613d", "#7a613e", "#7a6240", "#7a6543", "#7a6b54", "#7a6c53", "#7b5e33", "#7b5e34", "#7b5f35", "#7b603d", "#7b613a", "#7b613d", "#7b613e", "#7b623d", "#7b623e", "#7b633e", "#7b6340", "#7b6441", "#7b6c53", "#7b6c54", "#7c6036", "#7c623e", "#7c623f", "#7c633f", "#7c643e", "#7c643f", "#7c6441", "#7c6541", "#7c6542", "#7c6c54", "#7d633f", "#7d643f", "#7d6440", "#7d6542", "#7d6642", "#7d6745", "#7d6845", "#7d6e55", "#7e6136", "#7e6137", "#7e6337", "#7e6338", "#7e633f", "#7e6440", "#7e653f", "#7e6540", "#7e6542", "#7e663f", "#7e6643", "#7e6845", "#7e6948", "#7e6f56", "#7f6236", "#7f6238", "#7f6440", "#7f6540", "#7f6541", "#7f6641", "#7f6643", "#7f6742", "#7f6743", "#7f6a49", "#7f7056", "#7f7159", "#806336", "#806337", "#806539", "#806540", "#806541", "#806641", "#806742", "#806842", "#806844", "#807156", "#81653c", "#816541", "#81663a", "#816641", "#816642", "#816741", "#816742", "#816844", "#816945", "#816a47", "#817157", "#826539", "#82653a", "#82673b", "#826742", "#826842", "#826843", "#826945", "#826a45", "#826c47", "#826d4b", "#827358", "#836539", "#836639", "#83663a", "#83673b", "#836742", "#836843", "#836943", "#836944", "#836a46", "#836b45", "#836b46", "#836c44", "#836d4a", "#837359", "#837459", "#84663a", "#846843", "#846940", "#846943", "#846944", "#846a44", "#846b45", "#846b46", "#846c46", "#846c47", "#846d45", "#84745a", "#856739", "#85673a", "#85673b", "#85683d", "#856943", "#856a41", "#856a43", "#856a44", "#856b44", "#856b45", "#856c47", "#856d47", "#856d48", "#85755a", "#85775d", "#86683b", "#86683c", "#86693b", "#86693c", "#866a44", "#866b41", "#866b44", "#866b45", "#866c45", "#866c46", "#866d47", "#866d48", "#866e48", "#866f4a", "#86714d", "#86755a", "#86765a", "#86765b", "#87693c", "#87693d", "#876a3c", "#876a3d", "#876a3e", "#876b3e", "#876b41", "#876b45", "#876c3f", "#876c45", "#876c46", "#876e48", "#876e49", "#876f49", "#876f4a", "#87704a", "#87704d", "#87775b", "#886a3d", "#886b3d", "#886c41", "#886c46", "#886d43", "#886d46", "#886e47", "#886e49", "#886f48", "#886f49", "#886f4a", "#887049", "#88704a", "#88714c", "#88714e", "#88785c", "#88795d", "#896b3d", "#896b3e", "#896c3e", "#896c3f", "#896c40", "#896d41", "#896d42", "#896d43", "#896d46", "#896d47", "#896e47", "#896f49", "#897049", "#89704a", "#89714b", "#89744f", "#89785c", "#897a5f", "#8a5644", "#8a6b3e", "#8a6c3e", "#8a6c3f", "#8a6d3f", "#8a6d41", "#8a6e46", "#8a6e47", "#8a6f47", "#8a6f48", "#8a704a", "#8a714a", "#8a714b", "#8a724d", "#8a795d", "#8b6d3f", "#8b6d41", "#8b6e3f", "#8b6e41", "#8b6e43", "#8b6f43", "#8b6f47", "#8b6f48", "#8b7048", "#8b714b", "#8b724b", "#8b724c", "#8b734c", "#8b7a5e", "#8b7b5e", "#8b7c60", "#8c6c3d", "#8c6d3e", "#8c6d3f", "#8c6e3f", "#8c6e40", "#8c6e41", "#8c6f40", "#8c6f41", "#8c6f42", "#8c6f48", "#8c7042", "#8c7045", "#8c7048", "#8c7049", "#8c7148", "#8c7149", "#8c724b", "#8c724c", "#8c734c", "#8c734d", "#8c744c", "#8c744d", "#8c7b5f", "#8d6e41", "#8d6f40", "#8d6f41", "#8d7044", "#8d7048", "#8d7143", "#8d7149", "#8d7249", "#8d724a", "#8d734c", "#8d744d", "#8d754e", "#8d7551", "#8d7651", "#8d7c5f", "#8d7e62", "#8e6f41", "#8e7040", "#8e7041", "#8e7042", "#8e7143", "#8e7145", "#8e7149", "#8e7243", "#8e7249", "#8e724a", "#8e734a", "#8e744c", "#8e744d", "#8e754e", "#8e754f", "#8e764f", "#8e7d60", "#8f7040", "#8f7141", "#8f7142", "#8f7243", "#8f7246", "#8f724a", "#8f734a", "#8f734b", "#8f744b", "#8f744d", "#8f754d", "#8f754e", "#8f764e", "#8f764f", "#8f7952", "#8f7956", "#8f7e60", "#8f7f61", "#907140", "#907142", "#907143", "#907242", "#907243", "#907344", "#90734a", "#90734b", "#90744a", "#90744b", "#90764e", "#90774e", "#90774f", "#907850", "#907851", "#907854", "#908061", "#917241", "#917242", "#917243", "#917244", "#917343", "#917344", "#917445", "#91744b", "#91744c", "#917545", "#91754b", "#91754c", "#91764d", "#91764e", "#91774f", "#917951", "#917952", "#917954", "#917a51", "#917a55", "#917f62", "#927342", "#927343", "#927344", "#927443", "#927444", "#927445", "#92754c", "#927647", "#92764c", "#92764d", "#92774f", "#92784f", "#927850", "#927a52", "#927b55", "#927c55", "#928062", "#937443", "#937444", "#937445", "#937545", "#937546", "#93754c", "#937646", "#93764c", "#93764d", "#937747", "#93774d", "#93784f", "#937850", "#937950", "#937951", "#937a51", "#937b52", "#937b53", "#937b54", "#937b55", "#937c56", "#937e59", "#937e5b", "#938162", "#947545", "#947546", "#947646", "#94764d", "#94774d", "#94774e", "#947847", "#94784e", "#947950", "#947a51", "#947a52", "#947b53", "#947c53", "#947c54", "#947d57", "#948263", "#948363", "#948364", "#957644", "#957645", "#957646", "#957647", "#957745", "#957747", "#95774e", "#957848", "#95784d", "#95784e", "#95794f", "#957951", "#957a4f", "#957a51", "#957b52", "#957f5a", "#958465", "#958567", "#967644", "#967645", "#967646", "#967746", "#967747", "#967846", "#967847", "#967848", "#967849", "#96784e", "#967948", "#96794e", "#96794f", "#967a4a", "#967a4f", "#967b52", "#967c51", "#967c53", "#967e55", "#967e56", "#967e57", "#968465", "#977748", "#977846", "#977847", "#977948", "#977949", "#977a4a", "#977a4f", "#977a50", "#977b50", "#977c52", "#977c53", "#977d54", "#977e55", "#977f57", "#977f58", "#978058", "#978059", "#978566", "#987947", "#987948", "#987949", "#987a48", "#987a49", "#987a4a", "#987a4f", "#987a50", "#987b49", "#987b4b", "#987b4c", "#987b50", "#987c4b", "#987c50", "#987d51", "#987d53", "#987d54", "#987e52", "#987e54", "#987f55", "#987f56", "#988057", "#988159", "#98825d", "#988567", "#988665", "#997a48", "#997a49", "#997a50", "#997b49", "#997b4b", "#997b4c", "#997b50", "#997c51", "#997d4d", "#997d51", "#997e54", "#997e55", "#997f55", "#998058", "#998157", "#998158", "#99825a", "#998766", "#998767", "#9a7a47", "#9a7a49", "#9a7b49", "#9a7b4a", "#9a7c49", "#9a7c4a", "#9a7c4b", "#9a7c4c", "#9a7c51", "#9a7d4b", "#9a7d4c", "#9a7d4d", "#9a7d4f", "#9a7d51", "#9a7d52", "#9a7e4c", "#9a7e54", "#9a7e55", "#9a7f4e", "#9a7f54", "#9a7f55", "#9a7f56", "#9a8055", "#9a8158", "#9a8259", "#9a835f", "#9a896a", "#9b7b47", "#9b7b49", "#9b7c49", "#9b7c4a", "#9b7c4b", "#9b7d49", "#9b7d4a", "#9b7d4b", "#9b7d51", "#9b7d52", "#9b7e4c", "#9b7e52", "#9b7f54", "#9b8053", "#9b8056", "#9b8258", "#9b8259", "#9b835a", "#9b835b", "#9b8968", "#9c7c49", "#9c7c4a", "#9c7c4b", "#9c7d4a", "#9c7d4b", "#9c7d4c", "#9c7d52", "#9c7e4b", "#9c7e4c", "#9c7e52", "#9c7e53", "#9c7f4d", "#9c7f4e", "#9c7f52", "#9c7f53", "#9c8055", "#9c8056", "#9c8057", "#9c8156", "#9c8157", "#9c8158", "#9c8259", "#9c845a", "#9c845c", "#9c855e", "#9c855f", "#9c8969", "#9d7e4b", "#9d7e4c", "#9d7e52", "#9d7f4c", "#9d7f4d", "#9d7f53", "#9d804f", "#9d8052", "#9d8053", "#9d8156", "#9d8158", "#9d8257", "#9d8258", "#9d8259", "#9d8357", "#9d855c", "#9d865c", "#9d8660", "#9d875f", "#9d8a69", "#9d8b69", "#9e7e49", "#9e7e4a", "#9e7e4b", "#9e7e4c", "#9e7f4c", "#9e7f4d", "#9e7f53", "#9e804c", "#9e804d", "#9e804f", "#9e8053", "#9e8054", "#9e8151", "#9e8153", "#9e8154", "#9e8254", "#9e8257", "#9e8358", "#9e8458", "#9e855c", "#9e865c", "#9e865d", "#9e865e", "#9e8761", "#9e8863", "#9e8961", "#9e8c6a", "#9e8e6d", "#9f7e4b", "#9f7f4c", "#9f804c", "#9f804d", "#9f804e", "#9f804f", "#9f8053", "#9f8054", "#9f8154", "#9f8155", "#9f8255", "#9f8357", "#9f8358", "#9f8458", "#9f8459", "#9f8558", "#9f865c", "#9f865d", "#9f875d", "#9f875e", "#9f875f", "#9f8860", "#9f8b64", "#9f8d6b", "#a0804c", "#a0804d", "#a0804e", "#a0814d", "#a0814f", "#a08154", "#a08155", "#a08252", "#a08254", "#a08255", "#a08355", "#a08458", "#a08459", "#a08559", "#a0855a", "#a0885d", "#a0885e", "#a0885f", "#a08e6b", "#a08f6c", "#a1814d", "#a1814e", "#a1814f", "#a1824e", "#a1824f", "#a18255", "#a18355", "#a18356", "#a18457", "#a18559", "#a1855a", "#a1865a", "#a1875d", "#a1895e", "#a1895f", "#a18a63", "#a18d6c", "#a2824c", "#a2824d", "#a2824e", "#a2834e", "#a2834f", "#a28350", "#a28355", "#a28356", "#a28456", "#a28457", "#a28556", "#a28559", "#a2865a", "#a2865c", "#a2875b", "#a2875c", "#a2895e", "#a2895f", "#a28961", "#a28a60", "#a28a61", "#a28a62", "#a28b65", "#a28d65", "#a28e6c", "#a28f6d", "#a3834f", "#a3844f", "#a38451", "#a38456", "#a38457", "#a38557", "#a3865a", "#a3875a", "#a3875b", "#a3885b", "#a3885c", "#a3885d", "#a3895e", "#a38a5f", "#a38a60", "#a38b61", "#a38c62", "#a3906e", "#a39270", "#a4844f", "#a48450", "#a48451", "#a48550", "#a48551", "#a48557", "#a48558", "#a48657", "#a48658", "#a48757", "#a4875a", "#a4875b", "#a4885a", "#a4885b", "#a4885c", "#a4895c", "#a48b62", "#a48c61", "#a48c62", "#a48c63", "#a48d63", "#a48d66", "#a48e67", "#a48f67", "#a4916d", "#a58550", "#a58551", "#a58651", "#a58657", "#a58658", "#a58758", "#a58759", "#a5885b", "#a5895b", "#a5895c", "#a5895d", "#a58a5d", "#a58a5f", "#a58c62", "#a58d63", "#a58d64", "#a58e64", "#a58e65", "#a5926e", "#a5926f", "#a68552", "#a68651", "#a68751", "#a68753", "#a68758", "#a68759", "#a68859", "#a68958", "#a6895c", "#a68a5c", "#a68a5d", "#a68b5c", "#a68b5d", "#a68d62", "#a68e63", "#a68e64", "#a68f64", "#a68f65", "#a68f66", "#a69066", "#a69067", "#a6926e", "#a78650", "#a78653", "#a78751", "#a78752", "#a78753", "#a78754", "#a78759", "#a78852", "#a78853", "#a78859", "#a7885a", "#a7895a", "#a78a5c", "#a78a5d", "#a78b5d", "#a78b5e", "#a78d62", "#a78e62", "#a79068", "#a7926f", "#a79370", "#a79470", "#a88752", "#a88852", "#a88853", "#a88854", "#a88954", "#a88959", "#a8895a", "#a88a5a", "#a88b59", "#a88b5d", "#a88b5e", "#a88c5e", "#a88c5f", "#a88c61", "#a88d61", "#a89064", "#a89065", "#a89066", "#a89166", "#a89269", "#a8926a", "#a89571", "#a89774", "#a98853", "#a98953", "#a98954", "#a9895a", "#a98a5a", "#a98a5b", "#a98b5b", "#a98c5e", "#a98d5f", "#a98d62", "#a99064", "#a99065", "#a99066", "#a99166", "#a99167", "#a99267", "#a9926b", "#a99369", "#a9936a", "#a99571", "#a99572", "#aa8952", "#aa8954", "#aa8955", "#aa8a54", "#aa8a56", "#aa8a5b", "#aa8b5b", "#aa8b5c", "#aa8c5c", "#aa8d5f", "#aa8e5e", "#aa8e60", "#aa9267", "#aa946a", "#aa946b", "#aa956c", "#aa966e", "#ab8a52", "#ab8a54", "#ab8b55", "#ab8b56", "#ab8b5b", "#ab8b5c", "#ab8c55", "#ab8c57", "#ab8c5c", "#ab8d5a", "#ab8d5c", "#ab8e60", "#ab8f60", "#ab8f61", "#ab8f63", "#ab8f64", "#ab9266", "#ab9368", "#ab956d", "#ab9772", "#ab9974", "#ac8b53", "#ac8b55", "#ac8b56", "#ac8c55", "#ac8c57", "#ac8c5c", "#ac8d5c", "#ac8d5d", "#ac8e60", "#ac8f60", "#ac8f61", "#ac8f62", "#ac9061", "#ac9268", "#ac9368", "#ac9468", "#ac9469", "#ac9569", "#ac956a", "#ac956b", "#ac966d", "#ac966e", "#ac9770", "#ac9873", "#ad8c54", "#ad8c56", "#ad8d56", "#ad8d57", "#ad8d5d", "#ad8e58", "#ad8e5d", "#ad8e5e", "#ad8f60", "#ad905f", "#ad9061", "#ad9467", "#ad9568", "#ad956a", "#ad966a", "#ad966e", "#ad976f", "#ad986f", "#ad9874", "#ad9974", "#ad9b77", "#ae8c56", "#ae8d55", "#ae8d56", "#ae8d57", "#ae8e56", "#ae8e57", "#ae8e59", "#ae8e5d", "#ae8e5e", "#ae8f58", "#ae8f5e", "#ae905c", "#ae9061", "#ae9162", "#ae9266", "#ae9267", "#ae9569", "#ae966a", "#ae966b", "#ae976b", "#ae976c", "#ae976d", "#ae986f", "#ae9870", "#ae9974", "#ae9975", "#ae9a70", "#af8e56", "#af8e57", "#af8e58", "#af8e59", "#af8f57", "#af8f5e", "#af8f5f", "#af905e", "#af905f", "#af9161", "#af9162", "#af9260", "#af9263", "#af9669", "#af976a", "#af976d", "#af986d", "#af9972", "#af9a70", "#af9a75", "#b08f57", "#b08f58", "#b08f59", "#b09058", "#b0905a", "#b0905f", "#b0915f", "#b09160", "#b0925b", "#b09262", "#b09263", "#b09363", "#b09364", "#b09468", "#b09569", "#b0976a", "#b0986b", "#b0986c", "#b0996d", "#b0996e", "#b09970", "#b09a71", "#b09a72", "#b09a74", "#b09b75", "#b09c75", "#b19058", "#b19059", "#b1905a", "#b19158", "#b19159", "#b1915a", "#b1915f", "#b19160", "#b19259", "#b19260", "#b19363", "#b19364", "#b19464", "#b19465", "#b19566", "#b19669", "#b1996c", "#b1996d", "#b19a6e", "#b19a70", "#b19b73", "#b19c72", "#b19c76", "#b19e75", "#b29059", "#b29157", "#b29158", "#b29159", "#b2915a", "#b29259", "#b2925a", "#b2925b", "#b2925c", "#b29260", "#b29261", "#b29360", "#b29361", "#b29462", "#b29464", "#b29564", "#b29565", "#b2966a", "#b2986d", "#b29971", "#b29a6e", "#b29a70", "#b29b70", "#b29b73", "#b29c73", "#b29d73", "#b29d76", "#b29d77", "#b29e78", "#b29f7a", "#b3925a", "#b3925c", "#b3935a", "#b3935c", "#b39361", "#b3945b", "#b3945e", "#b39461", "#b39462", "#b39564", "#b39565", "#b39665", "#b39666", "#b3976a", "#b3976b", "#b39a6d", "#b39b6e", "#b39c6f", "#b39c70", "#b39c71", "#b39d73", "#b39d74", "#b39e77", "#b39f75", "#b49259", "#b4935a", "#b4935b", "#b4945b", "#b4945c", "#b49462", "#b49562", "#b49663", "#b49665", "#b49666", "#b49766", "#b49767", "#b49867", "#b49c6f", "#b49d70", "#b49d72", "#b49f78", "#b5945b", "#b5945c", "#b5945d", "#b5955c", "#b5955d", "#b5955f", "#b59562", "#b59563", "#b59663", "#b59766", "#b59767", "#b59867", "#b59868", "#b59c70", "#b59d70", "#b59d71", "#b59e71", "#b59e72", "#b59f76", "#b6945a", "#b6945c", "#b6955c", "#b6955d", "#b6955e", "#b6965d", "#b6965e", "#b69663", "#b6975d", "#b69763", "#b69764", "#b69864", "#b69867", "#b69968", "#b69a6e", "#b69c6f", "#b69d70", "#b69d71", "#b69e71", "#b69e72", "#b69f72", "#b6a07a", "#b7955a", "#b7955d", "#b7965e", "#b7975d", "#b7975f", "#b79763", "#b79764", "#b7985e", "#b79860", "#b79864", "#b79967", "#b79968", "#b79a69", "#b79f72", "#b7a073", "#b7a278", "#b8965d", "#b8975d", "#b8975e", "#b8985e", "#b8985f", "#b89860", "#b89861", "#b89864", "#b89865", "#b89965", "#b89a65", "#b89a68", "#b89a69", "#b89b69", "#b89d6f", "#b8a173", "#b8a175", "#b9975e", "#b99760", "#b9985d", "#b9985e", "#b99860", "#b9995f", "#b99961", "#b99965", "#b99a65", "#b99a66", "#b99b69", "#b99b6a", "#b99c6a", "#b9a072", "#b9a073", "#b9a173", "#b9a174", "#b9a275", "#b9a277", "#b9a377", "#b9a37b", "#b9a47d", "#ba975d", "#ba985d", "#ba985e", "#ba985f", "#ba9861", "#ba995f", "#ba9960", "#ba9961", "#ba9a60", "#ba9a62", "#ba9a65", "#ba9a66", "#ba9b66", "#ba9c6a", "#ba9c6b", "#ba9d6b", "#baa275", "#baa375", "#baa376", "#baa57d", "#baa67f", "#bb995f", "#bb9960", "#bb9961", "#bb9a60", "#bb9a61", "#bb9a62", "#bb9b66", "#bb9b67", "#bb9c65", "#bb9d6b", "#bb9e6c", "#bb9e71", "#bba072", "#bba374", "#bba375", "#bba376", "#bba476", "#bba57e", "#bba77e", "#bc9a60", "#bc9a62", "#bc9b60", "#bc9b61", "#bc9c62", "#bc9c67", "#bc9c68", "#bc9d68", "#bc9e6b", "#bc9e6c", "#bca070", "#bca073", "#bca476", "#bca477", "#bca577", "#bca67d", "#bca77f", "#bca881", "#bd9b60", "#bd9b61", "#bd9c63", "#bd9d68", "#bd9e68", "#bd9f6c", "#bd9f6d", "#bda475", "#bda576", "#bda577", "#bda678", "#bda77e", "#bda881", "#bda883", "#bda980", "#bda982", "#be9c5f", "#be9c62", "#be9c63", "#be9d63", "#be9d68", "#be9e67", "#be9e68", "#be9e69", "#bea06b", "#bea06d", "#bea06e", "#bea375", "#bea678", "#bea779", "#beaa80", "#beab83", "#bf9c60", "#bf9d62", "#bf9d63", "#bf9d64", "#bf9e62", "#bf9e69", "#bf9f69", "#bf9f6a", "#bfa16e", "#bfa275", "#bfa678", "#bfa779", "#bfa87a", "#bfa87f", "#bfa97b", "#bfa97f", "#bfab83", "#c09d60", "#c09d61", "#c09e63", "#c09f63", "#c09f6a", "#c0a068", "#c0a06a", "#c0a06b", "#c0a16b", "#c0a16d", "#c0a26e", "#c0a26f", "#c0a476", "#c0a778", "#c0a779", "#c0a87a", "#c0a97a", "#c0a97b", "#c0a980", "#c0aa7c", "#c19e61", "#c19f64", "#c19f65", "#c19f66", "#c1a06a", "#c1a16a", "#c1a16b", "#c1a26f", "#c1a36f", "#c1a370", "#c1a476", "#c1a87b", "#c1a87f", "#c1aa7b", "#c1ac82", "#c1ad86", "#c1b294", "#c29f62", "#c2a064", "#c2a066", "#c2a16b", "#c2a269", "#c2a26b", "#c2a26c", "#c2a470", "#c2a471", "#c2a677", "#c2a678", "#c2ab7c", "#c2ab7d", "#c2ab81", "#c2ac86", "#c2ae85", "#c39f61", "#c3a063", "#c3a064", "#c3a065", "#c3a165", "#c3a166", "#c3a26a", "#c3a26c", "#c3a36c", "#c3a36d", "#c3a571", "#c3a879", "#c3aa7a", "#c3ab7d", "#c3ac7d", "#c3ac82", "#c3ad7e", "#c4a062", "#c4a165", "#c4a266", "#c4a267", "#c4a268", "#c4a36a", "#c4a36c", "#c4a46d", "#c4a671", "#c4a672", "#c4a878", "#c4ab7c", "#c4ac7e", "#c4ad7e", "#c4ae7f", "#c5a162", "#c5a163", "#c5a164", "#c5a264", "#c5a268", "#c5a366", "#c5a369", "#c5a36b", "#c5a46d", "#c5a56d", "#c5a56e", "#c5a772", "#c5a773", "#c5ac7e", "#c5ad7f", "#c5ae7f", "#c5ae83", "#c5b187", "#c5b287", "#c6a264", "#c6a365", "#c6a366", "#c6a469", "#c6a56c", "#c6a56e", "#c6a66e", "#c6a873", "#c6a874", "#c6a97b", "#c6ab7b", "#c6ae7e", "#c6ae7f", "#c6af80", "#c6af84", "#c7a364", "#c7a365", "#c7a467", "#c7a569", "#c7a66e", "#c7a66f", "#c7a76f", "#c7a770", "#c7a974", "#c7aa7c", "#c7ab7c", "#c7af80", "#c7b081", "#c7b286", "#c7b28a", "#c8a465", "#c8a466", "#c8a566", "#c8a56a", "#c8a66c", "#c8a76f", "#c8a86f", "#c8a870", "#c8aa75", "#c8ac7d", "#c8ad7d", "#c8b080", "#c8b081", "#c8b085", "#c8b182", "#c8b185", "#c8b282", "#c8b28b", "#c8b489", "#c9a566", "#c9a666", "#c9a667", "#c9a668", "#c9a76b", "#c9a76d", "#c9a870", "#c9a970", "#c9ab75", "#c9ab76", "#c9ae7e", "#c9b181", "#c9b182", "#c9b282", "#c9b283", "#c9b286", "#c9b38c", "#caa566", "#caa667", "#caa768", "#caa769", "#caa76b", "#caa76c", "#caa86c", "#caa970", "#caa971", "#caaa71", "#caac76", "#caac77", "#caaf7f", "#cab080", "#cab383", "#cab384", "#cab588", "#cba768", "#cba868", "#cba86c", "#cba86d", "#cba96e", "#cbaa71", "#cbad77", "#cbad78", "#cbae7f", "#cbaf7f", "#cbb288", "#cbb383", "#cbb387", "#cbb389", "#cbb484", "#cbb485", "#cbb68b", "#cbb68e", "#cca768", "#cca869", "#cca96d", "#ccaa6d", "#ccaa6e", "#ccab72", "#ccad7a", "#ccae78", "#ccaf7e", "#ccb382", "#ccb384", "#ccb484", "#ccb485", "#ccb488", "#ccb585", "#ccb685", "#ccb686", "#cda869", "#cda96a", "#cdaa6d", "#cdaa6e", "#cdab6f", "#cdaf78", "#cdaf79", "#cdb181", "#cdb384", "#cdb585", "#cdb588", "#cdb589", "#cdb686", "#cdb687", "#cdb789", "#cdb88a", "#cdb98c", "#ceaa6a", "#ceab6f", "#cead75", "#ceae76", "#ceb079", "#ceb07a", "#ceb586", "#ceb686", "#ceb787", "#ceb98d", "#cfab6b", "#cfab6f", "#cfac70", "#cfb17a", "#cfb17b", "#cfb283", "#cfb483", "#cfb686", "#cfb785", "#cfb787", "#cfb789", "#cfb78a", "#cfb887", "#cfb888", "#cfb988", "#cfb989", "#d0ad70", "#d0b079", "#d0b27b", "#d0b381", "#d0b584", "#d0b787", "#d0b887", "#d0b88b", "#d0b988", "#d0b989", "#d0ba8a", "#d0ba8c", "#d0bd98", "#d1ae71", "#d1af72", "#d1b37c", "#d1b886", "#d1b988", "#d1b98b", "#d1ba88", "#d1ba89", "#d1ba8a", "#d1bb8a", "#d1bb8d", "#d1bb8f", "#d1bc95", "#d2b178", "#d2b47c", "#d2b47d", "#d2b585", "#d2ba8a", "#d2bb8a", "#d2bb8b", "#d2bc8d", "#d2bd8c", "#d2bf9b", "#d3b37c", "#d3b57d", "#d3b57e", "#d3b686", "#d3ba8a", "#d3ba8d", "#d3ba8e", "#d3bb89", "#d3bb8b", "#d3bc8b", "#d3bc8c", "#d3bd8d", "#d3bd90", "#d3be8e", "#d4b37a", "#d4b47b", "#d4b67e", "#d4b787", "#d4b987", "#d4bb8d", "#d4bc8a", "#d4bd8c", "#d4bd8d", "#d4bd8e", "#d4be8d", "#d4be8e", "#d5b57d", "#d5b77f", "#d5bc89", "#d5bc8e", "#d5bd8c", "#d5bd8d", "#d5be8d", "#d5be8e", "#d5bf8e", "#d5bf92", "#d6b67f", "#d6b780", "#d6b880", "#d6b988", "#d6ba89", "#d6be8d", "#d6bf8e", "#d6c08f", "#d6c094", "#d6c095", "#d6c098", "#d7b883", "#d7ba89", "#d7ba8a", "#d7bc8a", "#d7bd8b", "#d7bf8d", "#d7bf8e", "#d7bf8f", "#d7c08e", "#d7c08f", "#d7c090", "#d7c190", "#d7c194", "#d7c298", "#d8ba86", "#d8bb87", "#d8bf8e", "#d8bf8f", "#d8c08f", "#d8c094", "#d8c096", "#d8c18f", "#d8c190", "#d8c291", "#d8c49e", "#d9bc89", "#d9bc8a", "#d9bd8a", "#d9bd8b", "#d9c08d", "#d9c091", "#d9c18f", "#d9c190", "#d9c195", "#d9c291", "#d9c495", "#d9c49b", "#d9c49c", "#dabd8c", "#dabe8c", "#dabe8d", "#dabf8e", "#dac190", "#dac290", "#dac291", "#dac59a", "#dbbf8f", "#dbc090", "#dbc191", "#dbc28e", "#dbc391", "#dbc392", "#dbc397", "#dbc492", "#dbc493", "#dbc495", "#dcc18e", "#dcc192", "#dcc291", "#dcc293", "#dcc294", "#dcc394", "#dcc395", "#dcc491", "#dcc492", "#dcc493", "#dcc498", "#dcc593", "#dcc594", "#dcc596", "#dcc79d", "#dcc79f", "#ddc28f", "#ddc393", "#ddc395", "#ddc491", "#ddc496", "#ddc497", "#ddc593", "#ddc694", "#ddc797", "#dec390", "#dec493", "#dec693", "#dec694", "#dec69a", "#dec795", "#dec897", "#dec898", "#decca7", "#dfc692", "#dfc694", "#dfc794", "#dfc795", "#dfc9a1", "#dfcaa1", "#dfcda9", "#e0c694", "#e0c793", "#e0c895", "#e0c896", "#e0c999", "#e1c894", "#e1c896", "#e1c996", "#e1c997", "#e2c793", "#e2c795", "#e2c891", "#e2c892", "#e2c896", "#e2c897", "#e2c996", "#e2ca98", "#e2ca9a", "#e2cc9b", "#e2cda6", "#e3c894", "#e3c992", "#e3c993", "#e3c996", "#e3c998", "#e3ca93", "#e3ca96", "#e3ca98", "#e3cd9c", "#e4ca93", "#e4ca95", "#e4ca98", "#e4cb94", "#e4cb96", "#e4cc98", "#e4cc99", "#e4cc9a", "#e4ce9c", "#e4cea6", "#e5ca95", "#e5ca96", "#e5cb94", "#e5cb95", "#e5cb98", "#e5cc99", "#e5cd9a", "#e5ce9b", "#e5ce9c", "#e5d4af", "#e6cc95", "#e6cc98", "#e6cc9a", "#e6cd96", "#e6ce9a", "#e6ce9c", "#e6cf9b", "#e6cf9d", "#e6d4b0", "#e7cc98", "#e7cd96", "#e7cd97", "#e7cd9a", "#e7ce99", "#e7cf9c", "#e7d09e", "#e7d3aa", "#e8cd97", "#e8cd98", "#e8cd99", "#e8ce97", "#e8ce98", "#e8cf98", "#e8cf99", "#e8cf9c", "#e8d09c", "#e8d09d", "#e8d09e", "#e8d6b0", "#e9ce98", "#e9ce99", "#e9ce9a", "#e9ce9b", "#e9cf9a", "#e9d099", "#e9d09a", "#e9d09b", "#e9d19c", "#e9d19e", "#e9d29f", "#eacf9a", "#eacf9c", "#ead09a", "#ead19a", "#ead19b", "#ead19c", "#ead29e", "#ead2a0", "#ead3a0", "#ebd09b", "#ebd19b", "#ebd29c", "#ebd29d", "#ebd39f", "#ebd3a0", "#ebd7ad", "#ebd8b0", "#ecd19c", "#ecd19d", "#ecd29d", "#ecd39c", "#ecd39e", "#ecd3a0", "#ecd4a1", "#ecdab6", "#edd29e", "#edd39c", "#edd39d", "#edd49e", "#edd4a1", "#edd5a1", "#edd5a2", "#edd8af", "#edd9af", "#eddcb7", "#eed49e", "#eed59e", "#eed59f", "#eed5a2", "#eed5a5", "#eed6a2", "#eedab0", "#eeddb8", "#efd6a0", "#efd7a3", "#efdbb1", "#efdeb9", "#f0d8a4", "#f0dcb1", "#f0dcb2", "#f1daaa", "#f1dbab", "#f1dcad", "#f1dcae", "#f1ddb3", "#f1e2c0", "#f2ddaf", "#f2deb1", "#f2deb2", "#f2deb3", "#f2deb4", "#f2dfb4", "#f3dfb5", "#f3e0b6", "#f3e0b7", "#f3e0b8", "#f3e1b9", "#f3e1ba", "#f3e1bb", "#f4e2bb", "#f4e2bc", "#f4e3be", "#f5e6c6"], tint: "#ffd48a", k: 0.52, gain: 1.3 }],
        lights: [{ u: 5.55, v: 5.35, z: 0.5, r: 1.2, col: "#ffb040", a: 0.5 }, { u: 5, v: 5, z: 0.1, r: 4.2, col: "#ffc670", a: 0.22, flat: true }],
        windows: 0.4,
      },
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
      night: {
        flood: [{ cols: ["#512d22", "#512e23", "#512e29", "#512f23", "#522a26", "#522d22", "#522d24", "#522e26", "#522f23", "#522f24", "#532119", "#532f23", "#532f24", "#542f23", "#542f24", "#542f25", "#542f26", "#543024", "#543025", "#543126", "#552e23", "#552f23", "#552f24", "#552f27", "#553023", "#553226", "#562e23", "#562f26", "#563023", "#563024", "#572b23", "#572d21", "#572d22", "#572f23", "#573024", "#582e23", "#582e24", "#582f24", "#582f25", "#583024", "#583025", "#583027", "#583123", "#583124", "#59271e", "#592a23", "#592c27", "#593024", "#593027", "#593123", "#593124", "#5a2b24", "#5a2f23", "#5a3026", "#5a3027", "#5a3124", "#5a3125", "#5b2017", "#5b2b26", "#5b3023", "#5b3024", "#5b3124", "#5b3224", "#5c1610", "#5c2016", "#5c2017", "#5c2c27", "#5c2f23", "#5c3028", "#5c3124", "#5c3225", "#5d2016", "#5d2017", "#5d2b23", "#5d2c27", "#5d3026", "#5d3124", "#5d3125", "#5d3224", "#5d3225", "#5e1611", "#5e2017", "#5e2117", "#5e2b23", "#5e2c23", "#5e2d27", "#5e2e27", "#5e3125", "#5e3224", "#5e3225", "#5e3228", "#5f2117", "#5f2118", "#5f2c24", "#5f3127", "#5f3224", "#5f3225", "#602117", "#602118", "#602317", "#602f28", "#603224", "#603324", "#603325", "#612118", "#612218", "#613324", "#613325", "#613427", "#613628", "#622218", "#623028", "#623125", "#623225", "#623324", "#623325", "#623425", "#631813", "#631913", "#633028", "#633128", "#633325", "#633425", "#633426", "#641913", "#641914", "#642c23", "#642c26", "#643125", "#643128", "#643425", "#651914", "#651a14", "#653128", "#653129", "#653229", "#653425", "#653429", "#661914", "#661a14", "#661a15", "#662d27", "#663124", "#663425", "#671a14", "#671a15", "#671b14", "#671b15", "#673329", "#673525", "#673526", "#681b15", "#681b16", "#68281a", "#682e27", "#683329", "#68332b", "#683429", "#683526", "#683729", "#683928", "#691a16", "#691b15", "#691b16", "#691c15", "#691c16", "#69271a", "#69281a", "#692d24", "#693525", "#693526", "#6a1c15", "#6a1c16", "#6a2a22", "#6a2a23", "#6a3525", "#6a3526", "#6a3625", "#6b1c16", "#6b1c17", "#6b3626", "#6b3829", "#6c1c16", "#6c1c17", "#6c1d17", "#6c291b", "#6c2a1b", "#6c2a1c", "#6c2d24", "#6c3626", "#6d1c17", "#6d1d17", "#6d2920", "#6d2a1b", "#6d2a1c", "#6d2b1d", "#6d2e26", "#6d3625", "#6d3726", "#6e1d17", "#6e1d18", "#6e1e17", "#6e1e18", "#6e2a1c", "#6e2b1c", "#6e2e26", "#6e3525", "#6e3626", "#6e362a", "#6e3726", "#6f1d17", "#6f1d18", "#6f1e17", "#6f1e18", "#6f2b1c", "#6f2b1d", "#6f2c1d", "#6f2d24", "#6f3323", "#6f3726", "#701d18", "#701e18", "#701e19", "#701f18", "#702c1d", "#702c1e", "#702f27", "#703424", "#703725", "#703726", "#70372a", "#703826", "#711e18", "#711e19", "#711f18", "#711f19", "#712c1e", "#712d1e", "#713323", "#713726", "#713727", "#713826", "#713828", "#721f18", "#721f19", "#721f1a", "#722018", "#722019", "#722217", "#722218", "#722c1d", "#722d1e", "#722e1e", "#723826", "#723929", "#731f19", "#731f1a", "#732019", "#732318", "#732b1c", "#732e1f", "#732e25", "#733228", "#73362c", "#733727", "#73372b", "#733826", "#733926", "#741f1a", "#742019", "#74201a", "#742119", "#742e1e", "#742e1f", "#742f1f", "#743228", "#743424", "#743927", "#743b2b", "#752019", "#75201a", "#752119", "#75211a", "#75281c", "#752e20", "#752f1f", "#752f20", "#753328", "#753726", "#753827", "#753c2c", "#76201a", "#76201b", "#76211a", "#76211b", "#76221a", "#76281c", "#76281d", "#76291d", "#762c1c", "#762c1d", "#762f1f", "#762f20", "#76301f", "#763020", "#763026", "#763428", "#763624", "#76372d", "#763926", "#763927", "#77211a", "#77211b", "#77221a", "#77221b", "#77281c", "#77281d", "#77291d", "#772f20", "#77301f", "#773020", "#773021", "#773926", "#773927", "#773928", "#773a27", "#78211b", "#78221a", "#78221b", "#78221c", "#78231b", "#78251a", "#782d1d", "#783020", "#783021", "#783120", "#783121", "#783524", "#783626", "#783926", "#783927", "#783a27", "#79211b", "#79221b", "#79221c", "#79231b", "#792d1d", "#792d1e", "#793120", "#793121", "#793221", "#793222", "#793927", "#793a27", "#7a221c", "#7a231b", "#7a231c", "#7a241c", "#7a261b", "#7a2d1e", "#7a2f26", "#7a311f", "#7a3121", "#7a3221", "#7a3222", "#7a3729", "#7a392c", "#7a3a27", "#7b221c", "#7b231b", "#7b231c", "#7b231d", "#7b241b", "#7b241c", "#7b261b", "#7b2d1e", "#7b3127", "#7b3221", "#7b3222", "#7b3321", "#7b3322", "#7b3728", "#7b3729", "#7b3a2c", "#7b3b27", "#7b3c2a", "#7c231c", "#7c231d", "#7c241c", "#7c241d", "#7c251c", "#7c2d1e", "#7c3127", "#7c3220", "#7c3228", "#7c3322", "#7c3328", "#7c3523", "#7c372a", "#7c382a", "#7c3a27", "#7c3f2d", "#7c402c", "#7d231d", "#7d241c", "#7d241d", "#7d241e", "#7d251c", "#7d251d", "#7d281c", "#7d2e1f", "#7d3220", "#7d3227", "#7d3322", "#7d3323", "#7d3328", "#7d3422", "#7d3423", "#7d3425", "#7d382a", "#7d392e", "#7d3a27", "#7d3b28", "#7e241d", "#7e241e", "#7e251c", "#7e251d", "#7e251e", "#7e281c", "#7e2e1f", "#7e3423", "#7e3424", "#7e3523", "#7e382a", "#7e3b27", "#7e3b28", "#7e3e2d", "#7f241d", "#7f251d", "#7f251e", "#7f261c", "#7f261d", "#7f281c", "#7f3423", "#7f3523", "#7f3524", "#7f3525", "#7f3c27", "#7f3e2d", "#80251d", "#80251e", "#80261d", "#80261e", "#80281d", "#802f1f", "#803523", "#803524", "#803624", "#80392f", "#803b28", "#803c28", "#81251e", "#81261d", "#81261e", "#81261f", "#81271e", "#81281d", "#812f1f", "#812f20", "#813521", "#813524", "#813624", "#813625", "#813628", "#813629", "#813a2f", "#813c28", "#82261e", "#82261f", "#82271e", "#82281d", "#82281e", "#82291e", "#823026", "#823227", "#823420", "#823622", "#823624", "#823625", "#823725", "#823726", "#823824", "#823827", "#823c28", "#823d27", "#823d2a", "#83261f", "#83271e", "#83271f", "#832720", "#83281e", "#83281f", "#83291e", "#832a1e", "#832a1f", "#833327", "#833625", "#833626", "#833725", "#833726", "#833825", "#833826", "#833a2f", "#833c28", "#833c2d", "#833d28", "#83462f", "#84271e", "#84271f", "#842720", "#84281e", "#84281f", "#842820", "#842a1e", "#842a1f", "#843327", "#843723", "#843726", "#843826", "#843925", "#843928", "#843a2f", "#843b26", "#843d28", "#85271f", "#852720", "#85281f", "#852820", "#85291f", "#852a1f", "#852b1f", "#853126", "#853420", "#853621", "#853825", "#853826", "#853827", "#853b30", "#853c2e", "#853d28", "#86271f", "#86281f", "#862820", "#862821", "#86291f", "#862920", "#862b1f", "#863420", "#863427", "#863724", "#863826", "#863827", "#863926", "#863927", "#863928", "#863c2e", "#863d28", "#863e28", "#863e29", "#872820", "#872920", "#872921", "#872a20", "#872c20", "#872c21", "#873026", "#873126", "#873420", "#873824", "#873926", "#873927", "#873928", "#873a26", "#873a27", "#873d28", "#873e28", "#882820", "#882821", "#882920", "#882921", "#882a20", "#882c21", "#882d21", "#883328", "#88341f", "#883627", "#883927", "#883928", "#883a27", "#883a28", "#883b27", "#883e28", "#883e29", "#884c3b", "#892920", "#892921", "#892a20", "#892a21", "#892b21", "#892d20", "#892d21", "#893126", "#893320", "#89341f", "#893420", "#893520", "#893628", "#893a25", "#893a27", "#893a28", "#893a29", "#893b27", "#893b28", "#893d28", "#893d2f", "#893e28", "#893e29", "#893f29", "#8a2a20", "#8a2a21", "#8a2a22", "#8a2b20", "#8a2b21", "#8a2d21", "#8a3227", "#8a3420", "#8a3520", "#8a3621", "#8a3a25", "#8a3a26", "#8a3a28", "#8a3b27", "#8a3b28", "#8a3b29", "#8a3c28", "#8a3d2f", "#8a3e28", "#8a3f29", "#8b2a21", "#8b2a22", "#8b2b21", "#8b2b22", "#8b2c21", "#8b2d21", "#8b2d22", "#8b3021", "#8b3227", "#8b3327", "#8b3328", "#8b351f", "#8b3520", "#8b3620", "#8b3621", "#8b3722", "#8b3823", "#8b3a26", "#8b3b26", "#8b3b27", "#8b3b28", "#8b3b29", "#8b3c28", "#8b3c29", "#8b3e2a", "#8b3f28", "#8b3f29", "#8b432f", "#8c231b", "#8c231c", "#8c2b21", "#8c2b22", "#8c2b23", "#8c2c21", "#8c2c22", "#8c2d22", "#8c3327", "#8c3328", "#8c3427", "#8c3428", "#8c3621", "#8c3722", "#8c3829", "#8c3924", "#8c3b27", "#8c3b29", "#8c3c28", "#8c3c29", "#8c3d29", "#8c3e2f", "#8c3f29", "#8d231b", "#8d241c", "#8d241d", "#8d2b22", "#8d2b23", "#8d2c21", "#8d2c22", "#8d2d21", "#8d2d22", "#8d2e22", "#8d2f22", "#8d3427", "#8d3428", "#8d3528", "#8d3620", "#8d3621", "#8d3627", "#8d3721", "#8d3a25", "#8d3a26", "#8d3b27", "#8d3c27", "#8d3c29", "#8d3d27", "#8d3d29", "#8d3d2a", "#8d3e2f", "#8d3f29", "#8d4029", "#8e241b", "#8e241c", "#8e241d", "#8e251c", "#8e261c", "#8e2b23", "#8e2c22", "#8e2c23", "#8e2d22", "#8e2d23", "#8e2e22", "#8e3428", "#8e3528", "#8e3a29", "#8e3a2a", "#8e3c27", "#8e3d27", "#8e3d29", "#8e3d2b", "#8e3e2a", "#8e3f28", "#8e3f30", "#8e4029", "#8f241d", "#8f251c", "#8f251d", "#8f2c23", "#8f2d22", "#8f2d23", "#8f2d24", "#8f2f22", "#8f3528", "#8f3627", "#8f3628", "#8f3629", "#8f3822", "#8f3a2a", "#8f3b28", "#8f3d28", "#8f3d2a", "#8f3e2a", "#8f3e2b", "#8f4029", "#90251c", "#90251d", "#902c23", "#902c24", "#902d22", "#902d23", "#902d24", "#902e22", "#902e23", "#902f22", "#903023", "#903628", "#903629", "#903729", "#903b2a", "#903e2a", "#903e2b", "#903f2a", "#903f2b", "#903f2c", "#904029", "#91261c", "#912d23", "#912d24", "#912e22", "#912e23", "#912e24", "#912f22", "#913023", "#913627", "#913628", "#913629", "#913728", "#913729", "#913922", "#913c2a", "#913e2b", "#913f2b", "#91402a", "#91402b", "#914129", "#91412a", "#91412c", "#922d23", "#922d24", "#922e23", "#922e24", "#922e25", "#922f22", "#922f23", "#922f24", "#923022", "#923023", "#923123", "#923124", "#923728", "#923729", "#923829", "#923922", "#923e27", "#923f29", "#924029", "#92402b", "#92402c", "#92412a", "#92422e", "#92432e", "#92452f", "#932d24", "#932e24", "#932e25", "#932f23", "#932f24", "#933022", "#933023", "#933124", "#933829", "#93392a", "#933a23", "#93402b", "#93402c", "#93402d", "#934129", "#93412a", "#93412c", "#934530", "#942e24", "#942e25", "#942f25", "#943023", "#943024", "#943122", "#943123", "#943124", "#943224", "#943225", "#943829", "#943929", "#94392a", "#943a23", "#94402c", "#944129", "#94412a", "#94412c", "#94412d", "#94422a", "#952e24", "#952e25", "#952f25", "#952f26", "#953023", "#953024", "#953123", "#953225", "#953929", "#95392a", "#953a29", "#953a2a", "#954129", "#95412c", "#954229", "#95422a", "#95422c", "#95422d", "#954733", "#962f25", "#962f26", "#963025", "#963026", "#963123", "#963124", "#963125", "#963223", "#963224", "#963225", "#963a29", "#963a2a", "#963b24", "#963b2a", "#96402c", "#96412a", "#96412b", "#964229", "#96422a", "#96422b", "#96422d", "#96422e", "#96432d", "#964935", "#972f25", "#972f26", "#973025", "#973026", "#973123", "#973124", "#973125", "#973224", "#973225", "#973326", "#973a2a", "#973b2a", "#973b2b", "#973c24", "#974229", "#97422a", "#97422b", "#97422c", "#97432a", "#97432e", "#983025", "#983026", "#983027", "#983125", "#983126", "#983127", "#983224", "#983225", "#983323", "#983324", "#983b2a", "#983b2b", "#983c2a", "#983c2b", "#983d25", "#983d29", "#984229", "#98422a", "#98422c", "#98422d", "#98432a", "#98432c", "#98432e", "#98442e", "#992920", "#993026", "#993126", "#993127", "#993224", "#993225", "#993324", "#993325", "#993c2a", "#993c2b", "#993d25", "#993d2b", "#99422c", "#99432a", "#99432c", "#99442e", "#99442f", "#994e3a", "#9a2b21", "#9a3126", "#9a3127", "#9a3228", "#9a3324", "#9a3325", "#9a3326", "#9a3424", "#9a3425", "#9a3c2a", "#9a3c2b", "#9a3d25", "#9a3d2b", "#9a432a", "#9a432c", "#9a442c", "#9a442f", "#9a452f", "#9b2b20", "#9b2b22", "#9b2c21", "#9b2c22", "#9b3127", "#9b3226", "#9b3227", "#9b3228", "#9b3325", "#9b3326", "#9b3424", "#9b3425", "#9b3426", "#9b3427", "#9b3525", "#9b3527", "#9b3d2b", "#9b3e2b", "#9b3e2c", "#9b432a", "#9b432b", "#9b432c", "#9b442a", "#9b442c", "#9b442d", "#9b452f", "#9b4530", "#9b513d", "#9c2b21", "#9c2c21", "#9c2c22", "#9c3227", "#9c3228", "#9c3328", "#9c3425", "#9c3426", "#9c3525", "#9c3527", "#9c3e2b", "#9c3e2c", "#9c3f2c", "#9c432a", "#9c442a", "#9c452d", "#9c452e", "#9c462e", "#9c4630", "#9c4631", "#9d3227", "#9d3228", "#9d3327", "#9d3328", "#9d3425", "#9d3426", "#9d3525", "#9d3526", "#9d3626", "#9d3627", "#9d3e2b", "#9d3f26", "#9d3f2b", "#9d3f2c", "#9d442a", "#9d442b", "#9d462d", "#9d462e", "#9d4630", "#9d4631", "#9d4731", "#9e3328", "#9e3329", "#9e3427", "#9e3428", "#9e3526", "#9e3527", "#9e3625", "#9e3626", "#9e3627", "#9e3e29", "#9e3f2b", "#9e3f2c", "#9e4026", "#9e402c", "#9e442b", "#9e462e", "#9e472e", "#9e4731", "#9e4831", "#9e5743", "#9f3328", "#9f3329", "#9f3427", "#9f3428", "#9f3429", "#9f3526", "#9f3528", "#9f3626", "#9f3627", "#9f3726", "#9f3728", "#9f3827", "#9f4026", "#9f4027", "#9f402c", "#9f412c", "#9f4228", "#9f442a", "#9f442b", "#9f452b", "#9f472e", "#9f472f", "#9f4731", "#9f4831", "#9f4832", "#a03429", "#a0342a", "#a03528", "#a03626", "#a03627", "#a03726", "#a03727", "#a03826", "#a04027", "#a0402c", "#a04127", "#a0412c", "#a0412d", "#a0452a", "#a0452b", "#a0472f", "#a04832", "#a04932", "#a04a33", "#a1342a", "#a13528", "#a13529", "#a1352a", "#a13626", "#a13627", "#a13726", "#a13727", "#a13826", "#a13928", "#a14127", "#a1412c", "#a1412d", "#a1422c", "#a1422d", "#a1452a", "#a1452b", "#a1472f", "#a14730", "#a14832", "#a14932", "#a14933", "#a14a33", "#a15b41", "#a23529", "#a2352a", "#a23627", "#a23628", "#a23727", "#a23728", "#a23826", "#a23827", "#a2422c", "#a2422d", "#a2452b", "#a2462b", "#a24830", "#a24831", "#a24931", "#a24932", "#a24933", "#a24a33", "#a26435", "#a3352a", "#a33628", "#a33629", "#a3362a", "#a3362b", "#a33728", "#a33827", "#a33a28", "#a33a29", "#a33b29", "#a3422d", "#a34328", "#a3432d", "#a3462b", "#a34830", "#a34931", "#a34a33", "#a34a34", "#a35b2c", "#a35e4b", "#a43628", "#a4362a", "#a4362b", "#a43728", "#a43729", "#a4372b", "#a43828", "#a43927", "#a43928", "#a43a28", "#a43b29", "#a44328", "#a44329", "#a4432d", "#a4442d", "#a4442e", "#a4462b", "#a44a33", "#a44a34", "#a44b34", "#a44f38", "#a4614d", "#a5362a", "#a5362b", "#a53728", "#a53729", "#a5372a", "#a5372b", "#a53828", "#a53829", "#a53928", "#a53a28", "#a53b29", "#a53c2a", "#a5442d", "#a5442e", "#a5462b", "#a54b33", "#a54b34", "#a5523a", "#a5614e", "#a6372b", "#a63829", "#a63928", "#a63929", "#a63a28", "#a63a29", "#a63b29", "#a63c2a", "#a64429", "#a6442d", "#a6452e", "#a6462b", "#a6472b", "#a6472c", "#a64c35", "#a65038", "#a7372b", "#a73829", "#a7382a", "#a7382b", "#a73929", "#a7392b", "#a73a28", "#a73a29", "#a73a2b", "#a73b29", "#a73d2a", "#a73d2b", "#a7412a", "#a7452a", "#a7462b", "#a7472b", "#a7472c", "#a74b32", "#a74c32", "#a74c35", "#a76552", "#a76553", "#a8382a", "#a8382b", "#a8382c", "#a83929", "#a8392a", "#a8392b", "#a8392c", "#a83a29", "#a83a2a", "#a83b29", "#a83b2b", "#a83c29", "#a83c2a", "#a83d2b", "#a83e2b", "#a83f2d", "#a8452a", "#a8462e", "#a8472b", "#a8472c", "#a84c33", "#a84d35", "#a84d36", "#a8573e", "#a9392a", "#a9392b", "#a9392c", "#a93a29", "#a93a2a", "#a93b29", "#a93d2b", "#a93e2b", "#a93e2c", "#a9402d", "#a9452a", "#a9472b", "#a9472c", "#a9482c", "#a94c33", "#aa392a", "#aa392c", "#aa3a2a", "#aa3a2b", "#aa3a2c", "#aa3b29", "#aa3b2a", "#aa3c2a", "#aa3d2b", "#aa3e2b", "#aa3e2c", "#aa3f2c", "#aa462a", "#aa482c", "#aa4c33", "#aa4d34", "#ab3a2a", "#ab3a2b", "#ab3a2c", "#ab3b2a", "#ab3b2b", "#ab3c2a", "#ab3d2a", "#ab3e2c", "#ab3f2c", "#ab402d", "#ab412e", "#ab422a", "#ab482b", "#ab482c", "#ab4d34", "#ab4e34", "#ab4e35", "#ab4e37", "#ab4f37", "#ab5a41", "#ac3a2c", "#ac3b2a", "#ac3b2b", "#ac3b2c", "#ac3b2d", "#ac3c2a", "#ac3c2b", "#ac3d2a", "#ac3d2b", "#ac3f2c", "#ac402d", "#ac472b", "#ac482b", "#ac482c", "#ac492c", "#ac4e34", "#ac4e35", "#ac4f35", "#ac4f37", "#ac4f38", "#ac5c42", "#ac5f44", "#ad3b2a", "#ad3b2b", "#ad3b2c", "#ad3b2d", "#ad3c2a", "#ad3c2b", "#ad3d2b", "#ad3e2b", "#ad3f2c", "#ad402d", "#ad412e", "#ad422f", "#ad482c", "#ad492c", "#ad4f35", "#ad4f36", "#ad4f37", "#ad4f38", "#ad5038", "#ae3b2c", "#ae3c2a", "#ae3c2b", "#ae3c2c", "#ae3c2d", "#ae3d2b", "#ae3e2b", "#ae402d", "#ae422f", "#ae432f", "#ae482c", "#ae492c", "#ae4f36", "#ae5036", "#ae5038", "#ae5138", "#ae5139", "#ae5f44", "#af3c2c", "#af3c2d", "#af3d2c", "#af3e2b", "#af402d", "#af412d", "#af412e", "#af432f", "#af492c", "#af4a2c", "#af5036", "#af5037", "#af5138", "#af5139", "#af5b34", "#af5c35", "#af5c36", "#b03c2d", "#b03d2c", "#b03d2d", "#b03d2e", "#b03e2c", "#b0422e", "#b0422f", "#b0492c", "#b0492d", "#b04a2c", "#b04a2d", "#b05137", "#b05139", "#b05239", "#b0523a", "#b05c35", "#b05c36", "#b06247", "#b13d2d", "#b13e2c", "#b13e2d", "#b13e2e", "#b13f2c", "#b1422a", "#b1422e", "#b14430", "#b14531", "#b15137", "#b15237", "#b15239", "#b1523a", "#b15c36", "#b16448", "#b23e2c", "#b23e2d", "#b23e2e", "#b23f2c", "#b23f2d", "#b2422e", "#b2422f", "#b2432f", "#b24330", "#b24430", "#b2523a", "#b2533a", "#b2533b", "#b26247", "#b33e2d", "#b33e2e", "#b33f2c", "#b33f2d", "#b33f2e", "#b3402d", "#b3432b", "#b3432f", "#b34430", "#b34632", "#b3533a", "#b3533b", "#b3664a", "#b43f2d", "#b43f2e", "#b4402d", "#b4402e", "#b4412e", "#b4422f", "#b4432f", "#b44330", "#b4442b", "#b4533b", "#b4543b", "#b53f2e", "#b5402d", "#b5402e", "#b5402f", "#b5412e", "#b5422f", "#b54632", "#b54732", "#b5543b", "#b5543c", "#b5553c", "#b6402e", "#b6402f", "#b6412e", "#b6422f", "#b64330", "#b64430", "#b7402e", "#b7412e", "#b7412f", "#b7422e", "#b7422f", "#b7432f", "#b74430", "#b74531", "#b74833", "#b8412e", "#b8412f", "#b8422e", "#b8422f", "#b84430", "#b84431", "#b8452c", "#b8482a", "#b84833", "#b9422f", "#b9442f", "#b94430", "#b94833", "#b94834", "#b94933", "#ba422f", "#ba4230", "#ba432f", "#ba452f", "#ba4631", "#bb422f", "#bb432f", "#bb4330", "#bb4430", "#bb452f", "#bb4532", "#bb4632", "#bb4934", "#bc432f", "#bc4330", "#bc4430", "#bc4531", "#bc462f", "#bc4630", "#bc4632", "#bc4730", "#bc4733", "#bc4833", "#bc4a35", "#bd4430", "#bd4730", "#bd4733", "#bd4934", "#be4430", "#be4530", "#be4531", "#be4631", "#be4733", "#be4833", "#bf4531", "#bf4631", "#bf4632", "#bf4831", "#bf4833", "#bf4834", "#bf4a35", "#c04632", "#c04732", "#c04831", "#c04833", "#c04834", "#c04931", "#c04934", "#c04a35", "#c04c35", "#c04c37", "#c14732", "#c14733", "#c14833", "#c14931", "#c14932", "#c14934", "#c14a32", "#c14a35", "#c14b36", "#c14c35", "#c24833", "#c24933", "#c24935", "#c24a35", "#c24b33", "#c34934", "#c34a35", "#c34c34", "#c34d38", "#c44934", "#c44a34", "#c44a35", "#c44b35", "#c44c37", "#c54a35", "#c54b35", "#c54b36", "#c64b36", "#c64c36", "#c64d35", "#c64d36", "#c64e36", "#c64f38", "#c74c36", "#c74c37", "#c74d37", "#c74e36", "#c74e38", "#c74f37", "#c74f39", "#c75039", "#c7683a", "#c84d37", "#c84f39", "#c85037", "#c94d37", "#c94e37", "#c94e38", "#c94f39", "#c9503a", "#c9582a", "#ca4e38", "#ca4f38", "#ca4f39", "#ca5039", "#ca5138", "#ca513a", "#cb4f39", "#cb5039", "#cb513a", "#cb5238", "#cb5239", "#cc5039", "#cc503a", "#cc513a", "#cc5239", "#cc523a", "#cc523b", "#cc533a", "#cd513a", "#cd513b", "#cd523b", "#cd533a", "#ce523b", "#ce533c", "#cf533c", "#d0533c", "#d0543c", "#d0543d", "#d1543d", "#d1553d", "#d2553d", "#d2553e", "#d7673e", "#d7683e", "#d7683f", "#d96e43", "#da7045", "#df8053"], tint: "#ff2d1f", k: 0.72, gain: 1.3 }],
        lights: [{ u: 5, v: 3.2, z: 5.6, r: 2.6, col: "#ff3b2a", a: 0.38 }, { u: 5, v: 6, z: 0.15, r: 3.4, col: "#ff8a5a", a: 0.2, flat: true }],
        windows: 0.5,
      },
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
      night: {
        flood: [{ cols: ["#65563e", "#65573e", "#65573f", "#655746", "#655842", "#655844", "#655943", "#655944", "#655946", "#655a46", "#663f2a", "#665746", "#665840", "#665940", "#665941", "#665942", "#665943", "#665944", "#665945", "#665a44", "#665a46", "#665a47", "#665b47", "#675746", "#67583f", "#675940", "#675a42", "#675a44", "#675a46", "#675b45", "#675b46", "#675b47", "#675c47", "#685b42", "#685b45", "#685b46", "#685b47", "#685c46", "#685c47", "#685c48", "#685d49", "#695638", "#695639", "#695a41", "#695b40", "#695b41", "#695b42", "#695c41", "#695c46", "#695d47", "#695d48", "#695d49", "#695e47", "#695e48", "#695e49", "#696050", "#6a402a", "#6a5238", "#6a5a48", "#6a5b42", "#6a5c41", "#6a5c43", "#6a5c44", "#6a5d47", "#6a5d48", "#6a5e48", "#6a5e49", "#6a5e4a", "#6a5f4b", "#6a614e", "#6b5c44", "#6b5d42", "#6b5d43", "#6b5d46", "#6b5d47", "#6b5e49", "#6b5e4a", "#6b5f49", "#6b5f4a", "#6b604c", "#6c5c41", "#6c5e43", "#6c5e44", "#6c5e48", "#6c5f47", "#6c5f49", "#6c5f4a", "#6c6048", "#6c6049", "#6c604a", "#6c614a", "#6c634e", "#6d5e43", "#6d5f42", "#6d5f43", "#6d5f45", "#6d5f4a", "#6d6048", "#6d6049", "#6d604b", "#6d614a", "#6d614b", "#6d614c", "#6d614d", "#6e5a39", "#6e5c39", "#6e5f43", "#6e5f44", "#6e5f45", "#6e6048", "#6e6049", "#6e604a", "#6e6149", "#6e614b", "#6e624b", "#6e624c", "#6f5f44", "#6f6045", "#6f624a", "#6f634c", "#6f634d", "#705b3a", "#706045", "#706144", "#706146", "#706246", "#70624a", "#70634b", "#70634c", "#70634d", "#70644c", "#70644d", "#716144", "#716145", "#716245", "#716246", "#716345", "#716346", "#71634b", "#71634c", "#716445", "#71644b", "#71644d", "#71654d", "#71654f", "#726245", "#726246", "#726347", "#72644b", "#72654e", "#72664f", "#726853", "#736346", "#736347", "#736446", "#736546", "#73654b", "#73654c", "#736646", "#73664d", "#73664e", "#73664f", "#73674b", "#746343", "#746446", "#746447", "#746547", "#746548", "#74664c", "#74664d", "#74664e", "#74664f", "#74674e", "#746750", "#74684b", "#74684f", "#746850", "#754830", "#75582b", "#75603c", "#756446", "#756546", "#756647", "#756649", "#75664d", "#756748", "#75674d", "#756951", "#765a2c", "#765b37", "#766545", "#766647", "#76674a", "#76674e", "#76684e", "#76684f", "#76694e", "#76694f", "#766951", "#776648", "#776649", "#77684e", "#77684f", "#77694f", "#776951", "#776a50", "#776a51", "#776a52", "#78633d", "#786747", "#786749", "#786848", "#786849", "#78684a", "#78694d", "#786a50", "#786a51", "#786a52", "#786b51", "#786b53", "#786b54", "#79643e", "#796849", "#796949", "#79694d", "#796a4e", "#796a50", "#796a51", "#796b50", "#796b51", "#796b53", "#796c52", "#796c53", "#796c55", "#7a6b52", "#7a6c50", "#7a6c51", "#7a6c53", "#7a6f59", "#7b6a4a", "#7b6b4b", "#7b6b4c", "#7b6c4b", "#7b6c50", "#7b6c51", "#7b6d51", "#7b6d52", "#7b6d54", "#7b6e4d", "#7b6e53", "#7b6e54", "#7b7259", "#7c643b", "#7c653c", "#7c663c", "#7c683f", "#7c6b44", "#7c6b4a", "#7c6c4a", "#7c6c4b", "#7c6d51", "#7c6d52", "#7c6e53", "#7c6e55", "#7c6f53", "#7c6f55", "#7c6f56", "#7d6b4b", "#7d6c4b", "#7d6c4c", "#7d6e52", "#7d6f52", "#7d6f55", "#7d6f56", "#7d7055", "#7d7056", "#7e6c4b", "#7e6c4c", "#7e6d4c", "#7e6f54", "#7e6f55", "#7e705b", "#7f6b3d", "#7f6c48", "#7f6d45", "#7f6d4b", "#7f6f4c", "#7f704d", "#7f7053", "#7f7054", "#7f7154", "#7f7155", "#7f7156", "#7f7157", "#7f715b", "#7f7257", "#806e4c", "#806f4e", "#807157", "#807255", "#807257", "#816f4d", "#816f4e", "#81704e", "#817152", "#817154", "#817254", "#817256", "#817358", "#81745a", "#82683e", "#82693e", "#82704e", "#82714f", "#827355", "#827357", "#827358", "#827458", "#827459", "#82754f", "#836d3d", "#83714e", "#83714f", "#83724f", "#83734e", "#837354", "#837356", "#837455", "#837456", "#837457", "#837458", "#837559", "#83755a", "#846d3d", "#84724d", "#84724e", "#84724f", "#847351", "#847352", "#847559", "#847658", "#84765b", "#84785c", "#85724f", "#85734f", "#857350", "#857658", "#85765a", "#85775b", "#85785a", "#86734e", "#86744f", "#867450", "#867550", "#86775b", "#86785a", "#86785b", "#86785c", "#86785e", "#877551", "#877650", "#877751", "#877758", "#877858", "#87785c", "#87795c", "#887654", "#887751", "#887859", "#88785b", "#88795c", "#88795f", "#896a39", "#89764f", "#897651", "#897652", "#897655", "#897852", "#89795a", "#89795b", "#897a5a", "#897a5b", "#897b5e", "#8a7652", "#8a7752", "#8a7853", "#8a795a", "#8a7a5a", "#8a7a5b", "#8a7b5b", "#8a7b5e", "#8a7b5f", "#8b7852", "#8b7953", "#8b7a5a", "#8b7a5b", "#8b7b5a", "#8b7b5c", "#8b7c5f", "#8c6f2e", "#8c7a57", "#8c7c5b", "#8c7d5f", "#8c7d60", "#8c7e5f", "#8d7a53", "#8d7a54", "#8d7a56", "#8d7c54", "#8d7e5d", "#8d7e5e", "#8d7e60", "#8d7e61", "#8d7e62", "#8e7a55", "#8e7b54", "#8e7b55", "#8e7d5c", "#8e7e5e", "#8e7f61", "#8e8160", "#8f7b55", "#8f7c56", "#8f7d55", "#8f7d5c", "#8f7e5d", "#8f7f5e", "#8f7f60", "#8f7f61", "#8f8263", "#907d55", "#907f5d", "#908062", "#908156", "#908160", "#908162", "#91732f", "#917e56", "#917f56", "#91815f", "#918162", "#918266", "#92805f", "#92815f", "#928260", "#928263", "#928264", "#928360", "#929058", "#937642", "#93794a", "#937f56", "#937f57", "#93815f", "#938263", "#938360", "#938363", "#938364", "#938464", "#947845", "#947945", "#947f57", "#948051", "#948057", "#94815a", "#948258", "#948463", "#948465", "#958159", "#958465", "#958565", "#958567", "#958666", "#958b78", "#968158", "#968259", "#968562", "#968564", "#968565", "#968662", "#968666", "#968667", "#968763", "#968766", "#977a47", "#978259", "#97834f", "#978358", "#97835a", "#97835c", "#978661", "#978662", "#978666", "#978763", "#987944", "#987a43", "#987c49", "#987e49", "#988352", "#98844f", "#988450", "#98845a", "#98855a", "#988663", "#988759", "#988763", "#988766", "#988767", "#988b6e", "#997e4a", "#998450", "#998550", "#99855b", "#99865a", "#998763", "#998863", "#998866", "#998867", "#998968", "#998969", "#998a66", "#998f53", "#9a7f4a", "#9a7f4f", "#9a8551", "#9a855b", "#9a8651", "#9a865b", "#9a8764", "#9a8864", "#9a8968", "#9a8a65", "#9a8a69", "#9b8457", "#9b8651", "#9b8659", "#9b865c", "#9b8751", "#9b875b", "#9b875c", "#9b885b", "#9b8969", "#9b8a69", "#9b8a6a", "#9b8b66", "#9b8b69", "#9b8b6b", "#9c7b31", "#9c8557", "#9c8752", "#9c875b", "#9c875c", "#9c875d", "#9c885b", "#9c8964", "#9c8b66", "#9c8b69", "#9c8b6a", "#9c8c66", "#9c8c6a", "#9d8657", "#9d8658", "#9d8758", "#9d875b", "#9d8852", "#9d885d", "#9d895c", "#9d8b66", "#9d8b6a", "#9d8c67", "#9d8c6a", "#9d8d6b", "#9e8759", "#9e8953", "#9e895e", "#9e8b5d", "#9e8b65", "#9e8d6a", "#9e8d6b", "#9e8e68", "#9e8e6a", "#9e8e6b", "#9f8859", "#9f8953", "#9f895a", "#9f8a53", "#9f8a54", "#9f8a5e", "#9f8d66", "#9f8d67", "#9f8d6b", "#9f8e6c", "#9f8f69", "#9f8f70", "#a0885d", "#a0895a", "#a08a5b", "#a08a5c", "#a08a5d", "#a08b54", "#a08b5d", "#a08b5e", "#a08b5f", "#a08c66", "#a08d67", "#a08d68", "#a08e68", "#a08f69", "#a08f6c", "#a08f6d", "#a09069", "#a18a5b", "#a18b54", "#a18b5c", "#a18b5d", "#a18c54", "#a18c55", "#a18c5e", "#a18c5f", "#a18d5e", "#a18d63", "#a18e68", "#a18f67", "#a18f68", "#a18f6d", "#a19069", "#a1906b", "#a1906d", "#a1906f", "#a28b5c", "#a28b5d", "#a28b5e", "#a28c55", "#a28c5d", "#a28c5e", "#a28c5f", "#a28c60", "#a28c62", "#a28d55", "#a28d5f", "#a28e5f", "#a29068", "#a2906d", "#a2906e", "#a29168", "#a2916d", "#a2916e", "#a2a15f", "#a38852", "#a38953", "#a38c5d", "#a38c5e", "#a38d55", "#a38d56", "#a38d57", "#a38d58", "#a38d5e", "#a38d60", "#a38e61", "#a39060", "#a39069", "#a3a361", "#a48039", "#a48d5d", "#a48d5e", "#a48e56", "#a48e5e", "#a48e61", "#a48f56", "#a48f61", "#a49060", "#a4926f", "#a4936b", "#a4936e", "#a4946e", "#a49470", "#a49672", "#a4977e", "#a4a461", "#a4a462", "#a58d5d", "#a58e5e", "#a58f56", "#a58f57", "#a58f5f", "#a58f61", "#a59370", "#a5946a", "#a5946b", "#a59470", "#a59877", "#a5a562", "#a68f5e", "#a68f5f", "#a68f60", "#a68f61", "#a69057", "#a69060", "#a69061", "#a69161", "#a69162", "#a69261", "#a6926b", "#a6936b", "#a69470", "#a69570", "#a69571", "#a69754", "#a6a663", "#a78f64", "#a79060", "#a79157", "#a79158", "#a79162", "#a7934d", "#a7936b", "#a7946b", "#a7946c", "#a79571", "#a79673", "#a7a764", "#a8833a", "#a89158", "#a89160", "#a89161", "#a89258", "#a8925a", "#a89261", "#a89262", "#a8956d", "#a8966b", "#a8966d", "#a89672", "#a8976e", "#a89771", "#a8a865", "#a98e57", "#a99161", "#a99258", "#a99259", "#a99263", "#a99359", "#a99363", "#a99364", "#a99463", "#a9966d", "#a9976c", "#a9976e", "#a99872", "#a99873", "#a99a7e", "#aa8f58", "#aa9262", "#aa9359", "#aa9362", "#aa9364", "#aa9459", "#aa9463", "#aa966e", "#aa9871", "#aa9873", "#aa9974", "#aa9c76", "#ab9362", "#ab9459", "#ab945a", "#ab9462", "#ab9464", "#ab955a", "#ab9564", "#ab9565", "#ab9664", "#ab976e", "#ab9851", "#ab9973", "#ab9974", "#ab9a74", "#ab9a78", "#ac9463", "#ac955a", "#ac9563", "#ac9565", "#ac965b", "#ac9764", "#ac9a6e", "#ac9a6f", "#ac9a74", "#ac9a75", "#ac9b75", "#ad9563", "#ad9564", "#ad9565", "#ad965b", "#ad9664", "#ad9665", "#ad9868", "#ad9968", "#ad996f", "#ad9970", "#ad9a6e", "#ad9b70", "#ad9b71", "#ada289", "#ae9664", "#ae975b", "#ae975c", "#ae9764", "#ae9765", "#ae9766", "#ae9769", "#ae994f", "#ae9970", "#ae9a70", "#ae9b71", "#ae9b75", "#ae9c71", "#ae9c75", "#ae9c76", "#ae9f84", "#aea07d", "#af9764", "#af9765", "#af985c", "#af9865", "#af9a66", "#af9b71", "#af9c71", "#af9c76", "#af9d76", "#af9d77", "#b0985c", "#b09865", "#b09866", "#b09867", "#b0995c", "#b09966", "#b0996a", "#b09c72", "#b09e72", "#b09e76", "#b09e77", "#b0a17a", "#b1994d", "#b1995d", "#b19966", "#b19967", "#b19968", "#b19a5d", "#b19a68", "#b19b67", "#b19e77", "#b19e78", "#b19f72", "#b19f77", "#b19f78", "#b19f79", "#b1a287", "#b29966", "#b29a5d", "#b29a66", "#b29a67", "#b29b5d", "#b29b5e", "#b29c68", "#b29c71", "#b29d72", "#b29e73", "#b29f73", "#b29f78", "#b2a078", "#b2a079", "#b2a488", "#b2a489", "#b39b5e", "#b39b67", "#b39b68", "#b39b69", "#b39c69", "#b39d69", "#b39d72", "#b39e73", "#b39f74", "#b3a074", "#b3a078", "#b3a179", "#b3a47c", "#b3a681", "#b3a68a", "#b3a78a", "#b4984a", "#b49a4c", "#b49b67", "#b49b68", "#b49c5e", "#b49c5f", "#b49c68", "#b49d69", "#b4a074", "#b4a179", "#b4a27a", "#b4a27e", "#b4a88b", "#b4a88c", "#b59c68", "#b59d5f", "#b59d68", "#b59d69", "#b59d6a", "#b5a075", "#b5a27a", "#b5a27b", "#b5a37a", "#b5a37b", "#b69a4b", "#b69d69", "#b69e5f", "#b69e60", "#b69e69", "#b69e6a", "#b69e6b", "#b69e6d", "#b69f69", "#b69f6d", "#b6a06a", "#b6a175", "#b6a376", "#b6a37a", "#b6a37b", "#b6a47a", "#b6a47b", "#b6a480", "#b6a883", "#b79c65", "#b79e60", "#b79e69", "#b79e6a", "#b79f60", "#b79f6a", "#b7a06a", "#b7a06d", "#b7a379", "#b7a476", "#b7a479", "#b7a47b", "#b7a47c", "#b7a57b", "#b7aa8f", "#b89a50", "#b89b50", "#b89b52", "#b89f60", "#b89f61", "#b89f6a", "#b89f6b", "#b8a061", "#b8a06a", "#b8a06c", "#b8a06e", "#b8a376", "#b8a57c", "#b8a57d", "#b8a97f", "#b99a4e", "#b99a50", "#b99b4e", "#b99b52", "#b99c55", "#b99d55", "#b99f6b", "#b9a061", "#b9a06a", "#b9a06b", "#b9a06c", "#b9a161", "#b9a162", "#b9a16c", "#b9a26b", "#b9a36b", "#b9a477", "#b9a578", "#b9a67d", "#b9a67e", "#b9a782", "#ba9b4c", "#ba9b4d", "#ba9f59", "#baa162", "#baa16b", "#baa16c", "#baa262", "#baa26c", "#baa46c", "#baa778", "#baa77e", "#baa87d", "#baac86", "#bb9e58", "#bb9f58", "#bba16b", "#bba16c", "#bba262", "#bba26c", "#bba26d", "#bba363", "#bba36d", "#bba578", "#bba678", "#bba779", "#bba77d", "#bba77e", "#bba77f", "#bba879", "#bba87d", "#bba87f", "#bba97d", "#bbac88", "#bbad88", "#bca15b", "#bca26c", "#bca363", "#bca36c", "#bca36d", "#bca370", "#bca56d", "#bca779", "#bca87f", "#bca97f", "#bcaa84", "#bda15b", "#bda36d", "#bda36e", "#bda463", "#bda464", "#bda46d", "#bda66d", "#bda97f", "#bda980", "#bea15d", "#bea25e", "#bea35e", "#bea36b", "#bea464", "#bea46d", "#bea46e", "#bea564", "#bea56e", "#bea76d", "#bea778", "#bea879", "#bea87a", "#bea97a", "#beaa7b", "#beaa80", "#beab81", "#bfa564", "#bfa565", "#bfa56e", "#bfa665", "#bfa66e", "#bfa673", "#bfa770", "#bfa97b", "#bfab7b", "#bfab7c", "#bfab81", "#bfac80", "#bfb28e", "#bfb499", "#c0a562", "#c0a665", "#c0a66e", "#c0a66f", "#c0a765", "#c0a766", "#c0a76f", "#c0a770", "#c0a86f", "#c0aa7b", "#c0ab80", "#c0ac7c", "#c0ac80", "#c0ac82", "#c0ad80", "#c0ad81", "#c1a766", "#c1a76f", "#c1a866", "#c1a870", "#c1a96f", "#c1ab7c", "#c1ac7d", "#c1ad82", "#c1ad83", "#c2a866", "#c2a870", "#c2a966", "#c2a967", "#c2a971", "#c2a972", "#c2ab71", "#c2ac7c", "#c2ae82", "#c2ae83", "#c2af7d", "#c2af88", "#c3a765", "#c3a86e", "#c3a86f", "#c3a870", "#c3a966", "#c3a967", "#c3a970", "#c3a971", "#c3aa67", "#c3ac7d", "#c3ad7d", "#c3af7e", "#c3af83", "#c3af84", "#c4a96f", "#c4a971", "#c4aa67", "#c4aa68", "#c4aa71", "#c4aa72", "#c4aa75", "#c4ab68", "#c4ab72", "#c4af7e", "#c4af84", "#c4b07f", "#c4b084", "#c4b085", "#c4b99e", "#c4ba9d", "#c5aa68", "#c5aa70", "#c5aa71", "#c5aa72", "#c5ab69", "#c5ab72", "#c5ab76", "#c5ac71", "#c5ac73", "#c5ad72", "#c5b07f", "#c5b180", "#c5b185", "#c5b28a", "#c6ab71", "#c6ab72", "#c6ab73", "#c6ac72", "#c6ac73", "#c6ae72", "#c6af7e", "#c6b07f", "#c6b186", "#c6b280", "#c6b285", "#c6b286", "#c7ac71", "#c7ac72", "#c7ac73", "#c7ad6c", "#c7ad6d", "#c7ad73", "#c7ad74", "#c7ae71", "#c7af73", "#c7b07f", "#c7b180", "#c7b27f", "#c7b48c", "#c8ad72", "#c8ad73", "#c8ad74", "#c8ae74", "#c8af77", "#c8b073", "#c8b180", "#c8b380", "#c8b381", "#c8b386", "#c8b387", "#c8b487", "#c9ad73", "#c9ad74", "#c9ae73", "#c9ae74", "#c9af6f", "#c9af70", "#c9af75", "#c9b26e", "#c9b281", "#c9b282", "#c9b380", "#c9b482", "#c9b487", "#c9b488", "#c9b588", "#c9b68d", "#caae74", "#caaf74", "#caaf75", "#cab076", "#cab174", "#cab481", "#cab582", "#cab588", "#caba8f", "#cbaf75", "#cbb075", "#cbb076", "#cbb079", "#cbb274", "#cbb275", "#cbb582", "#cbb683", "#cbb687", "#cbb689", "#cbb789", "#cbba8f", "#ccb075", "#ccb076", "#ccb176", "#ccb375", "#ccb477", "#ccb583", "#ccb78a", "#ccb88f", "#ccbc8d", "#cdb176", "#cdb276", "#cdb277", "#cdb279", "#cdb476", "#cdb683", "#cdb783", "#cdb884", "#cdb885", "#cdb88a", "#cdb98a", "#cdbb8d", "#ceb276", "#ceb277", "#ceb684", "#ceb784", "#ceb885", "#ceb88b", "#ceb985", "#ceb989", "#ceb98b", "#cfb061", "#cfb277", "#cfb377", "#cfb378", "#cfb57b", "#cfb57c", "#cfb67a", "#cfb77b", "#cfb784", "#cfb884", "#cfba8b", "#cfba8c", "#cfbb8a", "#cfbb90", "#cfbe8f", "#d0b162", "#d0b377", "#d0b378", "#d0b478", "#d0b47b", "#d0b87c", "#d0ba8c", "#d0bb86", "#d0bb8d", "#d0bc92", "#d1b478", "#d1b578", "#d1b579", "#d1b57c", "#d1b97e", "#d1b985", "#d1ba86", "#d1bb87", "#d1bb8d", "#d1bc87", "#d2b578", "#d2b579", "#d2b679", "#d2b884", "#d2ba86", "#d2ba89", "#d2bc87", "#d2bc8e", "#d2bd87", "#d2c195", "#d3b679", "#d3b67a", "#d3b77a", "#d3b77d", "#d3bb80", "#d3bb86", "#d3bb87", "#d3bc87", "#d3bd88", "#d3bd8e", "#d3be8f", "#d3be94", "#d3c292", "#d3c398", "#d4b77a", "#d4b87e", "#d4b97f", "#d4ba80", "#d4bb86", "#d4bc87", "#d4bc88", "#d4bd82", "#d4bd87", "#d4be85", "#d4be88", "#d4be8f", "#d5b97e", "#d5bd84", "#d5bd88", "#d5be88", "#d5bf86", "#d5bf87", "#d5bf88", "#d5bf89", "#d5bf90", "#d5c088", "#d5c08e", "#d5c090", "#d5c194", "#d5c493", "#d6bd88", "#d6be88", "#d6bf87", "#d6bf88", "#d6bf89", "#d6c089", "#d6c08a", "#d6c090", "#d7bb7f", "#d7bb80", "#d7c191", "#d7c296", "#d7cbac", "#d8bb6a", "#d8bc80", "#d8c08a", "#d8c291", "#d8c292", "#d8c390", "#d8c498", "#d8c89c", "#d9c392", "#d9c491", "#d9c896", "#dab89a", "#dabd81", "#dac18b", "#dac28b", "#dac491", "#dac492", "#dac493", "#dac598", "#dbc089", "#dbc18a", "#dbc28b", "#dbc378", "#dbc38c", "#dbc493", "#dcbf82", "#dcc38c", "#dcc38d", "#dcc694", "#dcc699", "#dccfa9", "#ddc083", "#ddc285", "#ddc48d", "#ddc48e", "#ddc58d", "#ddc590", "#ddc695", "#ddc79a", "#ddc89b", "#ddd0ab", "#dec58d", "#dec58e", "#dec690", "#dec795", "#dec896", "#dec99c", "#ded4b6", "#dfc68e", "#dfc896", "#dfca9c", "#e0c472", "#e0c473", "#e0c587", "#e0c58d", "#e0c68a", "#e0c68c", "#e0c78d", "#e0c78e", "#e0c78f", "#e0c997", "#e0ca97", "#e0cd9d", "#e0cea2", "#e0d1a7", "#e1c37e", "#e1c381", "#e1c483", "#e1c585", "#e1ca97", "#e1ca98", "#e1cd9d", "#e1cfa2", "#e2c176", "#e2c277", "#e2c37c", "#e2cb98", "#e2cfa2", "#e2d4ad", "#e2d5ad", "#e3cc99", "#e3cf9e", "#e5d6ae", "#e6cd7e", "#e6d6ae", "#e7d7ab", "#e7d8b0", "#e8d6a0", "#e9d9ad", "#e9debc", "#eadab0", "#ebdab0", "#ecddb3", "#ecddb4", "#eddeb2", "#eddeb3", "#ede1be", "#ede2be", "#eedeb4", "#eedfb4", "#eee1c1", "#eee2be", "#efdfb3", "#efe2c2", "#f0e0b5", "#f0e1b5", "#f0e4bf", "#f0e4c0", "#f1d58e", "#f1e6c8", "#f2d68e", "#f2e5bf", "#f3e6c0", "#f4d88f", "#f5e8c2", "#f6e9c3", "#f6ecd0", "#f6f1db"], tint: "#ffcf70", k: 0.5, gain: 1.25 }, { cols: ["#e6b43c","#a17e2a","#b89030","#cfa236","#e9bc50","#ebc363","#eecb77"], tint: "#ffd060", k: 0.6, gain: 1.4 }],
        lights: [{ u: 5, v: 5, z: 6.6, r: 2.2, col: "#ffc860", a: 0.35 }, { u: 4, v: 7.2, z: 0.15, r: 3.4, col: "#ffc670", a: 0.22, flat: true }],
        windows: 0.4,
      },
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
      night: {
        windows: 0.55,
        lights: [{ u: 5, v: 5, z: 0.1, r: 3.6, col: "#ffc070", a: 0.2, flat: true }],
      },
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
