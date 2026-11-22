// Atlantis The Palm: the crescent hotel at the crown of the palm. Central Royal Bridge block with the
// keyhole arch you can see through, twin octagonal towers with lanterns + teal onion domes, stepped
// crescent wings of stacked arched window bays, twin-turret towers, end pavilions and white rotundas.
// Everything is laid out in frontal plan coords (a = u - v, d = u + v) and mirrored about a = 0.
import { INK, shade, lerp, CTS } from "../../lib/vec-kit.js";
import { PA, AD, prism, rectAD, octAD, bays, band, crenel, onion, finial, domeDrum, archPath, chaikin, tr, PINK, PINK_L, PINK_D, CREAM, TEAL, DOMEC, GOLD } from "./_t0_-1.js";

const ROOF = "#f2d6aa";

export function makeAtlantis() {
  // ---------- central Royal Bridge block with the arch ----------
  function archBlock(k, t) {
    const c = k.ctx, a0 = 0.62, dF = 4.05, H = 1.78;
    const [f] = prism(k, rectAD(-a0, a0, 2.55, dF), 0, H, PINK, { topCol: ROOF });
    const S = (a) => (a + a0) / (2 * a0); // a -> face param
    band(k, f, 0, 0.1, PINK_D);
    // recessed lighter frame around the arch
    k.path([f.F(0.06, 0.1), f.F(0.94, 0.1), f.F(0.94, 1.6), f.F(0.06, 1.6)], { fill: PINK_L, lw: 1, wobble: 0 });
    k.path([f.F(0.1, 0.1), f.F(0.9, 0.1), f.F(0.9, 1.55), f.F(0.1, 1.55)], { fill: shade(PINK_L, -0.04), lw: 0.7, wobble: 0, stroke: "rgba(120,60,40,0.5)" });
    // keyhole (moorish horseshoe-ogee) opening
    const L = [[-0.38, 0], [-0.38, 0.62], [-0.42, 0.84], [-0.43, 0.98], [-0.39, 1.12], [-0.3, 1.24], [-0.17, 1.33], [-0.06, 1.39], [0, 1.47]];
    const half = chaikin(L, 2, false), outline = [...half, ...half.slice(0, -1).reverse().map(([a, z]) => [-a, z])];
    const pts = outline.map(([a, z]) => f.F(S(a), z));
    const big = outline.map(([a, z]) => f.F(S(a * 1.2), z === 0 ? 0 : z * 1.06 + 0.02));
    k.path(big, { fill: CREAM, lw: 1.1, wobble: 0 });
    k.path(outline.map(([a, z]) => f.F(S(a * 1.1), z === 0 ? 0 : z * 1.03 + 0.01)), { fill: shade(PINK_L, 0.05), lw: 0.8, wobble: 0 });
    // the view through: the passage floor, then sky + palm tops beyond the far opening
    c.save(); tr(c, pts); c.clip();
    const [, yb] = PA(0, dF, 0), [, yfar] = PA(0, 2.55, 0), [, ytop] = PA(0, dF, 1.5);
    const g = c.createLinearGradient(0, ytop, 0, yfar); g.addColorStop(0, "#f6efe1"); g.addColorStop(1, "#eedcb9"); c.fillStyle = g; c.fillRect(470, ytop - 5, 90, yb - ytop + 10);
    // distant dune + sea line
    c.fillStyle = "#e3c58e"; c.beginPath(); c.moveTo(470, yfar - 6); c.quadraticCurveTo(505, yfar - 30, 560, yfar - 14); c.lineTo(560, yfar + 2); c.lineTo(470, yfar + 2); c.closePath(); c.fill();
    c.strokeStyle = "rgba(120,90,50,0.5)"; c.lineWidth = 0.8; c.stroke();
    // palm tops in the back garden
    for (const [x, s] of [[490, 1], [512, 1.25], [534, 0.95]]) { c.fillStyle = "#6f8f3a"; c.strokeStyle = INK; c.lineWidth = 0.9; for (let i = 0; i < 6; i++) { const th = Math.PI * (0.05 + i * 0.18) + Math.sin(t * 1.2 + x) * 0.04; c.beginPath(); c.ellipse(x + Math.cos(th) * 7 * s, yfar - 9 * s - Math.sin(th) * 3 * s, 7 * s, 2.2 * s, -Math.cos(th) * 0.6, 0, 6.3); c.fill(); c.stroke(); } }
    // passage floor (paved) with the far jamb line
    c.fillStyle = "#e9d6b0"; c.fillRect(470, yfar, 90, yb - yfar + 2);
    c.strokeStyle = "rgba(140,100,60,0.4)"; c.lineWidth = 0.7; c.beginPath(); for (let i = 1; i < 6; i++) { const y = lerp(yfar, yb, i / 6); c.moveTo(470, y); c.lineTo(560, y); } c.stroke();
    c.fillStyle = "rgba(120,70,40,0.18)"; c.fillRect(470, yfar, 90, 4);
    c.restore();
    k.path(pts, { lw: 1.4, wobble: 0 });
    // bridge storey: row of small arched windows above the arch, two groups either side of the keystone
    for (const [s0, s1, n] of [[0.1, 0.42, 3], [0.58, 0.9, 3]]) for (let i = 0; i < n; i++) { const w = (s1 - s0) / n; k.path(archPath(f.F, s0 + w * (i + 0.22), s0 + w * (i + 0.78), 1.36, 1.46, 0.07, 4), { fill: TEAL, lw: 0.7, wobble: 0 }); }
    // keystone medallion
    { const [x, y] = f.F(0.5, 1.6); c.beginPath(); c.arc(x, y - 1, 3.6, 0, 6.3); c.fillStyle = GOLD; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke(); }
    band(k, f, 1.66, 1.74, CREAM);
    crenel(k, f, 1.78, 9, CREAM, 0.07);
    // corner pinnacles
    for (const s of [-1, 1]) { const [u, v] = AD(s * 0.55, dF - 0.08); k.cyl(u, v, 1.78, 0.045, 0.22, PINK_L); onion(k, s * 0.55, dF - 0.08, 2.0, 0.06, 0.13, DOMEC, { ribs: false, fs: 0.45 }); }
    // central dome on a windowed drum
    domeDrum(k, 0, 3.25, 1.78, 0.27, 0.2, 0.38, PINK_L, DOMEC, { win: 5, ribs: 7, fs: 0.9 });
  }

  // ---------- twin octagonal towers flanking the arch ----------
  function bigTower(k, side) {
    const ac = side * 1.02, dF = 4.3, H = 2.3, c = k.ctx;
    const faces = prism(k, octAD(ac, dF, 0.4, 0.9, 0.17), 0, H, PINK, { topCol: ROOF, hatch: true });
    for (const f of faces) {
      const front = Math.abs(f.na) < 0.2;
      band(k, f, 0, 0.14, PINK_D);
      for (const z of [0.66, 1.26, 1.86]) band(k, f, z, z + 0.04, CREAM, { lw: 0.6 });
      if (front) {
        // light pilasters + tall central window strip + entrance arch
        k.path([f.F(0.04, 0.14), f.F(0.16, 0.14), f.F(0.16, H - 0.02), f.F(0.04, H - 0.02)], { fill: PINK_L, lw: 0.7, wobble: 0 });
        k.path([f.F(0.84, 0.14), f.F(0.96, 0.14), f.F(0.96, H - 0.02), f.F(0.84, H - 0.02)], { fill: shade(PINK, -0.04), lw: 0.7, wobble: 0 });
        bays(k, f, { n: 1, fill: 0.36, z0: 0.38, z1: 2.16, rows: 10, arch: 0.16, seed: 7 + side });
        k.path(archPath(f.F, 0.36, 0.64, 0, 0.18, 0.1, 5), { fill: "#5a3a2a", lw: 0.8, wobble: 0 });
        // little balcony
        k.path([f.F(0.28, 1.9), f.F(0.72, 1.9), f.F(0.72, 1.96), f.F(0.28, 1.96)], { fill: CREAM, lw: 0.7, wobble: 0 });
      } else bays(k, f, { n: 1, fill: 0.5, z0: 0.42, z1: 2.08, rows: 9, arch: 0.12, seed: 9 + side });
    }
    // corbelled cornice + lantern storey + dome
    const cf = prism(k, octAD(ac, dF + 0.04, 0.44, 0.98, 0.19), H, H + 0.09, CREAM, { topCol: shade(CREAM, 0.04) });
    for (const f of cf) crenel(k, f, H + 0.09, Math.abs(f.na) < 0.2 ? 6 : 2, CREAM, 0.06);
    const lf = prism(k, octAD(ac, dF - 0.09, 0.3, 0.72, 0.12), H + 0.09, H + 0.42, PINK_L, { topCol: ROOF });
    for (const f of lf) k.path(archPath(f.F, 0.25, 0.75, H + 0.13, H + 0.28, 0.08, 4), { fill: "#4a3326", lw: 0.7, wobble: 0 });
    prism(k, octAD(ac, dF - 0.07, 0.33, 0.76, 0.13), H + 0.42, H + 0.47, CREAM);
    // corner pinnacles on the cornice
    for (const s of [-1, 1]) onion(k, ac + s * 0.37, dF - 0.02, H + 0.09, 0.05, 0.12, DOMEC, { ribs: false, fs: 0.4 });
    onion(k, ac, dF - 0.45, H + 0.47, 0.3, 0.38, DOMEC, { fs: 1.05 });
  }

  // ---------- crescent wing: slanted slab of arched window bays ----------
  function wing(k, A, B, dep, H, nb, seed) {
    const c = k.ctx, foot = [A, B, [B[0], B[1] - dep], [A[0], A[1] - dep]];
    const faces = prism(k, foot, 0, H, PINK, { topCol: ROOF });
    const f = faces.find((x) => x.nd > 0.5); if (!f) return;
    band(k, f, 0, 0.24, PINK_D);
    // ground-floor arcade
    const na = nb * 2;
    for (let i = 0; i < na; i++) { const s0 = (i + 0.2) / na, s1 = (i + 0.8) / na; k.path(archPath(f.F, s0, s1, 0.02, 0.13, 0.07, 4), { fill: "#6b4632", lw: 0.6, wobble: 0 }); }
    // piers (light) between bays
    for (let i = 0; i <= nb; i++) { const s = 0.03 + (i * 0.94) / nb; k.path([f.F(s - 0.012, 0.24), f.F(s + 0.012, 0.24), f.F(s + 0.012, H - 0.12), f.F(s - 0.012, H - 0.12)], { fill: PINK_L, stroke: false, wobble: 0 }); }
    bays(k, f, { n: nb, fill: 0.6, z0: 0.3, z1: H - 0.16, rows: 6, arch: 0.1, mx: 0.03, seed });
    band(k, f, H - 0.12, H - 0.04, CREAM);
    crenel(k, f, H, Math.round(nb * 2.2), CREAM, 0.06);
    // rooftop plant rooms
    const mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2 - dep * 0.55];
    prism(k, rectAD(mid[0] - 0.18, mid[0] + 0.18, mid[1] - 0.2, mid[1] + 0.05), H, H + 0.12, shade(ROOF, -0.06), { lw: 0.9 });
  }

  // ---------- twin-turret tower between the wings ----------
  function tower2(k, side) {
    const ac = side * 2.24, dF = 4.62, H = 2.0;
    const faces = prism(k, octAD(ac, dF, 0.33, 0.8, 0.13), 0, H, PINK, { topCol: ROOF, hatch: true });
    for (const f of faces) {
      const front = Math.abs(f.na) < 0.2;
      band(k, f, 0, 0.18, PINK_D);
      for (const z of [0.7, 1.4]) band(k, f, z, z + 0.035, CREAM, { lw: 0.6 });
      bays(k, f, { n: 1, fill: front ? 0.42 : 0.5, z0: 0.3, z1: 1.86, rows: 8, arch: 0.13, seed: 21 + side });
    }
    const cf = prism(k, octAD(ac, dF + 0.03, 0.36, 0.86, 0.14), H, H + 0.07, CREAM);
    for (const f of cf) crenel(k, f, H + 0.07, Math.abs(f.na) < 0.2 ? 4 : 1, CREAM, 0.05);
    for (const s of [-1, 1]) {
      const [u, v] = AD(ac + s * 0.2, dF - 0.16);
      k.cyl(u, v, H + 0.07, 0.075, 0.2, PINK_L, { topCol: CREAM });
      onion(k, ac + s * 0.2, dF - 0.16, H + 0.27, 0.095, 0.2, DOMEC, { fs: 0.55 });
    }
  }

  // ---------- end pavilion with twin turrets ----------
  function endPav(k, side) {
    const ac = side * 3.97, dF = 5.05, H = 1.45;
    const faces = prism(k, octAD(ac, dF, 0.38, 0.7, 0.15), 0, H, PINK, { topCol: ROOF, hatch: true });
    for (const f of faces) {
      const front = Math.abs(f.na) < 0.2;
      band(k, f, 0, 0.2, PINK_D);
      bays(k, f, { n: front ? 2 : 1, fill: 0.5, z0: 0.28, z1: H - 0.14, rows: 5, arch: 0.1, seed: 31 + side });
      band(k, f, H - 0.1, H - 0.03, CREAM);
    }
    for (const s of [-1, 1]) {
      const [u, v] = AD(ac + s * 0.24, dF - 0.13);
      k.cyl(u, v, H, 0.07, 0.16, PINK_L, { topCol: CREAM });
      onion(k, ac + s * 0.24, dF - 0.13, H + 0.16, 0.088, 0.18, DOMEC, { fs: 0.5 });
    }
  }

  return {
    // queue the hotel's parts into the depth sort (back to front)
    queue(k, t) {
      k.q(3.6, () => archBlock(k, t));
      for (const s of [-1, 1]) {
        k.q(3.7, () => wing(k, [s * 1.42, 4.15], [s * 2.6, 4.45], 1.15, 1.6, 6, 41 + s));
        k.q(3.75, () => bigTower(k, s));
        k.q(3.9, () => tower2(k, s));
        k.q(4.0, () => wing(k, [s * 2.57, 4.52], [s * 3.6, 4.9], 0.95, 1.55, 5, 51 + s));
        k.q(4.3, () => endPav(k, s));
        // white-domed porch kiosks at the tower feet
        k.q(4.75, () => domeDrum(k, s * 1.02, 4.5, 0, 0.13, 0.24, 0.17, CREAM, "#f6f0e4", { win: 3, ribs: 4, fs: 0.5 }));
        // white rotundas at the crescent ends
        k.q(5.5, () => domeDrum(k, s * 4.47, 5.22, 0, 0.26, 0.34, 0.3, CREAM, "#f7f1e5", { win: 5, ribs: 6, fs: 0.7 }));
      }
      // lobby rotunda in the mouth of the arch
      k.q(4.68, () => domeDrum(k, 0, 4.34, 0, 0.3, 0.4, 0.27, PINK_L, DOMEC, { win: 5, ribs: 7, fs: 0.75 }));
    },
    // soft contact shadow along the hotel front
    shadow(k) {
      const pts = [[-4.35, 5.05], [-3.6, 4.9], [-2.6, 4.62], [-1.42, 4.3], [-0.62, 4.3], [0.62, 4.3], [1.42, 4.3], [2.6, 4.62], [3.6, 4.9], [4.35, 5.05]];
      k.poly([...pts.map(([a, d]) => [...AD(a, d), 0]), ...pts.slice().reverse().map(([a, d]) => [...AD(a, d - 0.6), 0])], "rgba(70,40,25,0.12)", { stroke: false });
    },
  };
}
