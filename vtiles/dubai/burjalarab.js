// Burj Al Arab rebuilt on the grid. Everything goes through P(): the tower stands square to the grid on its island,
// its broad elevation (spine, glass wing, exoskeleton, the two arches) lies in planes of constant v and faces the
// front-left (the LEFT face). The white fabric sail is a real curved surface: it bulges toward +v between the arches.
// Local frame: a along u, b along v, z up, origin at the tower's back-left foot on the island paving.
import { P, INK, shade, lerp, clamp, hash } from "../../lib/vec-kit.js";

const STONE = "#f3ece0", STONE_D = "#d8ccb8", STONE_DD = "#bfb29c";
const GL_D = "#1f6a7c", GL = "#3d93a5", GL_L = "#86cdd4";
const WARM = "#ffd98a";

const tr = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
const line = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); };
// Catmull-Rom densify of an (a,z) polyline
function dense(pts, per = 8) {
  const out = [], n = pts.length, at = (i) => pts[Math.max(0, Math.min(n - 1, i))];
  for (let s = 0; s < n - 1; s++) {
    const p0 = at(s - 1), p1 = at(s), p2 = at(s + 1), p3 = at(s + 2);
    for (let j = 0; j < per; j++) { const t = j / per, t2 = t * t, t3 = t2 * t, f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3); out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]); }
  }
  out.push(pts[n - 1]);
  return out;
}
// a at height z along a curve that descends (z falls as a rises)
function aAt(D, z) {
  if (z >= D[0][1]) return D[0][0];
  for (let i = 1; i < D.length; i++) if (D[i][1] <= z) { const f = (z - D[i - 1][1]) / ((D[i][1] - D[i - 1][1]) || -1e-6); return lerp(D[i - 1][0], D[i][0], f); }
  return D[D.length - 1][0];
}
function offset(D, d) { return D.map((p, i) => { const a = D[Math.max(0, i - 1)], b = D[Math.min(D.length - 1, i + 1)]; const dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; return [p[0] - dz / l * d, p[1] + dx / l * d]; }); }

// ---------- elevation data (a along u, z up), taken from the painted reference then squared to the grid ----------
const ZB = 0.57;              // top of the lit lobby; the arches stand on it
const SP_W = 0.4, SP_TOP = 8.6;
const CI = dense([[0.33, 8.6], [0.78, 7.87], [1.22, 7.02], [1.53, 6.1], [1.76, 5.25], [1.91, 4.33], [2.02, 3.26], [2.11, 2.08], [2.18, 0.9], [2.2, 0.0]]);
const CO = dense([[0.36, 8.7], [1.12, 8.3], [1.86, 7.7], [2.52, 7.0], [3.06, 6.25], [3.39, 5.4], [3.61, 4.4], [3.74, 3.26], [3.79, 2.08], [3.79, 1.09], [3.76, 0.0]]);
const SL = dense([[2.33, 6.15], [2.47, 5.58], [2.56, 4.68], [2.58, 3.26], [2.56, 1.84], [2.51, 0.0]]);
const IW = 0.24, OW = 0.2;    // arch widths (in a)
const aIn = (z) => aAt(CI, z), aOut = (z) => aAt(CO, z), aSl = (z) => aAt(SL, z);
const aSr = (z) => aOut(z) - OW / 2 - 0.13;           // sail's right edge (thin glass strip before the outer arch)
const SAIL_TOP = 6.1, SAIL_BOT = 0.62;
const RIBS = [5.45, 4.78, 4.1, 3.42, 2.74, 2.06, 1.38];
const ROOF = (a) => 6.1 + 0.32 * Math.sin(clamp((a - SP_W) / 1.1) * Math.PI / 2); // wing roof height
const FH = 0.336;             // floor height
// sail section in plan: b(s), s = 0 at the inner arch -> 1 at the outer arch
const bSail = (s) => 0.5 - 0.05 * s + 0.4 * Math.sin(Math.PI * s);
const B_FRONT = 0.95, B_MID = 0.55, B_OUT0 = 0.1, B_OUT1 = 0.5;

export function makeBurjAlArab(cfg = {}) {
  const TU = cfg.TU ?? 1.9, TV = cfg.TV ?? 1.2, ZI = cfg.ZI ?? 0.4;
  const E = (a, b, z) => P(TU + a, TV + b, ZI + z);

  // floors of glazing in a plane b = const between two a(z) edges
  function glassBands(c, t, b, fa, fb, z0, z1, o = {}) {
    for (let z = z0; z < z1 - 0.05; z += FH) {
      const zt = Math.min(z1, z + FH - 0.04), a0 = fa(z), a1 = fb(z), a0t = fa(zt), a1t = fb(zt);
      if (a1 - a0 < 0.04) continue;
      const q = [E(a0t, b, zt), E(a1t, b, zt), E(a1, b, z), E(a0, b, z)];
      const g = c.createLinearGradient(...E(a0, b, z), ...E(a1, b, zt));
      g.addColorStop(0, o.c0 || GL); g.addColorStop(0.55, o.c1 || GL_L); g.addColorStop(1, o.c2 || GL_D);
      tr(c, q); c.fillStyle = g; c.fill();
      const fl = Math.round(z * 10), n = Math.max(1, Math.round((a1 - a0) / (o.pitch ?? 0.15)));
      for (let i = 0; i < n; i++) {
        const fA = i / n, fB = (i + 1) / n, h = hash(fl * 13.7 + i * 7.3 + (o.seed || 0));
        if (h < (o.lit ?? 0.18) && Math.sin(t * 0.3 + h * 40) > -0.6) {
          const x0 = lerp(a0, a1, fA) + 0.012, x1 = lerp(a0, a1, fB) - 0.012;
          tr(c, [E(x0, b, zt - 0.03), E(x1, b, zt - 0.03), E(x1, b, z + 0.04), E(x0, b, z + 0.04)]); c.fillStyle = h < 0.06 ? "#ffe9b0" : WARM; c.fill();
        }
      }
      c.strokeStyle = "rgba(15,55,65,0.55)"; c.lineWidth = 0.6; c.beginPath();
      for (let i = 1; i < n; i++) { const f = i / n; c.moveTo(...E(lerp(a0t, a1t, f), b, zt)); c.lineTo(...E(lerp(a0, a1, f), b, z)); }
      c.stroke();
      c.strokeStyle = "rgba(255,255,255,0.35)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(...E(lerp(a0t, a1t, 0.08), b, zt - 0.04)); c.lineTo(...E(lerp(a0t, a1t, 0.5), b, zt - 0.04)); c.stroke();
      // cream floor slab
      c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.moveTo(...E(a0, b, z)); c.lineTo(...E(a1, b, z)); c.stroke();
      c.strokeStyle = "#f2ebdc"; c.lineWidth = 2; c.beginPath(); c.moveTo(...E(a0, b, z - 0.03)); c.lineTo(...E(a1, b, z - 0.03)); c.stroke();
    }
  }

  // white structural member in the plane b: a flat bar with a dark underside and a light truss pattern
  function strut(c, a0, z0, a1, z1, w, b) {
    const dx = a1 - a0, dz = z1 - z0, l = Math.hypot(dx, dz), nx = -dz / l * w / 2, nz = dx / l * w / 2;
    const q = [E(a0 + nx, b, z0 + nz), E(a1 + nx, b, z1 + nz), E(a1 - nx, b, z1 - nz), E(a0 - nx, b, z0 - nz)];
    const lo = [E(a0 - nx, b, z0 - nz), E(a1 - nx, b, z1 - nz), E(a1 - nx, b - 0.1, z1 - nz), E(a0 - nx, b - 0.1, z0 - nz)];
    tr(c, lo); c.fillStyle = STONE_DD; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
    tr(c, q); const g = c.createLinearGradient(...q[0], ...q[3]); g.addColorStop(0, "#fffdf8"); g.addColorStop(1, STONE_D); c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.1; c.lineJoin = "round"; c.stroke();
    c.strokeStyle = "rgba(120,105,85,0.55)"; c.lineWidth = 0.6; c.beginPath();
    const m = Math.max(3, Math.round(l / 0.16));
    for (const s of [-0.25, 0.25]) { c.moveTo(...E(a0 + nx * 2 * s, b, z0 + nz * 2 * s)); c.lineTo(...E(a1 + nx * 2 * s, b, z1 + nz * 2 * s)); }
    for (let i = 0; i < m; i++) { const f0 = i / m, f1 = (i + 1) / m, s0 = i % 2 ? 0.5 : -0.5; c.moveTo(...E(a0 + dx * f0 + nx * s0, b, z0 + dz * f0 + nz * s0)); c.lineTo(...E(a0 + dx * f1 - nx * s0, b, z0 + dz * f1 - nz * s0)); }
    c.stroke();
  }

  // an arch: a ribbon following a centre curve, extruded between planes bB (back) and bF (front)
  function archBand(c, Cn, w, bB, bF, zMin) {
    const pts = Cn.filter((p) => p[1] > zMin + 0.02), last = pts[pts.length - 1], prev = Cn[Cn.indexOf(last) + 1];
    if (prev) pts.push([lerp(last[0], prev[0], (last[1] - zMin) / ((last[1] - prev[1]) || 1)), zMin]);
    const L = offset(pts, -w / 2), R = offset(pts, w / 2);
    // right-hand depth face (faces +u / up): strip between the right edge at the back and at the front
    for (let i = 0; i < R.length - 1; i++) {
      tr(c, [E(R[i][0], bB, R[i][1]), E(R[i + 1][0], bB, R[i + 1][1]), E(R[i + 1][0], bF, R[i + 1][1]), E(R[i][0], bF, R[i][1])]);
      c.fillStyle = STONE_DD; c.fill();
    }
    line(c, R.map((p) => E(p[0], bF, p[1]))); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
    // front face, in panel pieces so the cream catches light along the curve
    const front = [...L.map((p) => E(p[0], bF, p[1])), ...[...R].reverse().map((p) => E(p[0], bF, p[1]))];
    tr(c, front); const g = c.createLinearGradient(...E(L[0][0] - 0.3, bF, L[0][1]), ...E(L[0][0] + 0.9, bF, L[0][1])); g.addColorStop(0, "#fffdf8"); g.addColorStop(1, STONE);
    c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.lineJoin = "round"; c.stroke();
    c.strokeStyle = "rgba(150,135,110,0.55)"; c.lineWidth = 0.7; c.beginPath();
    for (let i = 4; i < pts.length - 2; i += 5) { c.moveTo(...E(L[i][0], bF, L[i][1])); c.lineTo(...E(R[i][0], bF, R[i][1])); }
    c.stroke();
    c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 1; line(c, offset(pts, -w / 2 + 0.03).map((p) => E(p[0], bF, p[1]))); c.stroke();
  }

  // the curved fabric sail: a ruled surface bulging toward +v, shaded by its slope in plan
  function sail(c, t) {
    const S = 14, V = (s, z) => E(lerp(aSl(z), aSr(z), s), bSail(s), z);
    // thin glass strip between the sail and the outer arch
    { const lo = [], hi = []; for (let z = SAIL_BOT; z <= SAIL_TOP + 0.01; z += 0.2) { lo.push(E(aSr(z), B_OUT1, z)); hi.push(E(aOut(z) - OW / 2 + 0.02, B_OUT1, z)); }
      tr(c, [...lo, ...[...hi].reverse()]); c.fillStyle = GL_D; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke(); }
    const levels = [SAIL_TOP, ...RIBS, SAIL_BOT];
    const sheen = SAIL_TOP - (((t * 0.07) % 1.3)) * 6.5; // a soft highlight sliding down the fabric
    for (let r = 0; r < levels.length - 1; r++) {
      const zA = levels[r], zB = levels[r + 1];
      for (let i = 0; i < S; i++) {
        const s0 = i / S, s1 = (i + 1) / S, sm = (s0 + s1) / 2;
        // slope of the surface in plan decides the tone: left half faces the light, right half turns away
        const slope = (bSail(s1) - bSail(s0)) / (((s1 - s0) * (aSr(zA) - aSl(zA))) || 1);
        const nA = -slope, nB = 1, nl = Math.hypot(nA, nB), lit = clamp(0.5 + (-nA / nl) * 0.55 + (nB / nl) * 0.1, 0, 1);
        const col = lit > 0.62 ? "#fffdf9" : lit > 0.45 ? "#f2eee6" : lit > 0.3 ? "#dcdcda" : "#b9c3c8";
        const q = [V(s0, zA), V(s1, zA), V(s1, zB), V(s0, zB)];
        tr(c, q); c.fillStyle = col; c.fill();
        // cushion under each truss
        const g = c.createLinearGradient(...V(sm, zA), ...V(sm, zB)); g.addColorStop(0, "rgba(255,255,255,0.45)"); g.addColorStop(0.4, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(90,95,110,0.26)");
        tr(c, q); c.fillStyle = g; c.fill();
        const zm = (zA + zB) / 2, d = Math.abs(zm - sheen);
        if (d < 0.9) { tr(c, q); c.fillStyle = `rgba(255,255,255,${0.3 * (1 - d / 0.9)})`; c.fill(); }
      }
      // fabric seams down the panel
      c.strokeStyle = "rgba(150,150,145,0.2)"; c.lineWidth = 0.6; c.beginPath();
      for (let i = 1; i < S; i += 2) { c.moveTo(...V(i / S, zA)); c.lineTo(...V(i / S, zB)); }
      c.stroke();
    }
    // outline of the whole fabric
    { const edge = []; for (let i = 0; i <= S; i++) edge.push(V(i / S, SAIL_TOP)); for (let z = SAIL_TOP; z >= SAIL_BOT; z -= 0.3) edge.push(V(1, z)); for (let i = S; i >= 0; i--) edge.push(V(i / S, SAIL_BOT)); for (let z = SAIL_BOT; z <= SAIL_TOP; z += 0.3) edge.push(V(0, z));
      tr(c, edge); c.strokeStyle = INK; c.lineWidth = 1; c.stroke(); }
    // the curved trusses: cream tubes following the plan curve
    for (const z of RIBS) {
      const p = [], p2 = []; for (let i = 0; i <= S * 2; i++) { const s = i / (S * 2); p.push(V(s, z)); p2.push(V(s, z - 0.04)); }
      c.lineCap = "round"; c.strokeStyle = "rgba(90,85,80,0.55)"; c.lineWidth = 1.2; line(c, p2); c.stroke();
      c.strokeStyle = INK; c.lineWidth = 3.4; line(c, p); c.stroke();
      c.strokeStyle = "#f6f1e7"; c.lineWidth = 2; line(c, p); c.stroke();
    }
    // top truss
    { const p = []; for (let i = 0; i <= S * 2; i++) { const s = i / (S * 2); p.push(V(s, SAIL_TOP)); }
      c.strokeStyle = INK; c.lineWidth = 3.4; line(c, p); c.stroke(); c.strokeStyle = "#f6f1e7"; c.lineWidth = 2; line(c, p); c.stroke(); }
  }

  function draw(k, t) {
    const c = k.ctx;
    // ---- lit lobby at the foot (a box under the arches) ----
    { const a0 = SP_W - 0.02, a1 = 3.82, b0 = 0.0, b1 = B_FRONT;
      k.box(TU + a0, TV + b0, ZI, a1 - a0, b1 - b0, ZB, STONE_D, { hatch: false, shadow: false, left: "#f2b055", right: "#a0642a", top: STONE });
      // glazing on the front (left) face: warm mullioned atrium
      const g = c.createLinearGradient(...E(a0, b1, ZB), ...E(a0, b1, 0)); g.addColorStop(0, "#f7c870"); g.addColorStop(1, "#e59b3e");
      tr(c, [E(a0 + 0.04, b1, ZB - 0.08), E(a1 - 0.04, b1, ZB - 0.08), E(a1 - 0.04, b1, 0.05), E(a0 + 0.04, b1, 0.05)]); c.fillStyle = g; c.fill();
      c.strokeStyle = "rgba(110,70,30,0.75)"; c.lineWidth = 0.8; c.beginPath();
      for (let a = a0 + 0.14; a < a1 - 0.05; a += 0.13) { c.moveTo(...E(a, b1, ZB - 0.08)); c.lineTo(...E(a, b1, 0.05)); }
      c.moveTo(...E(a0, b1, ZB * 0.5)); c.lineTo(...E(a1, b1, ZB * 0.5)); c.stroke();
      for (let i = 0; i < 6; i++) { const px = lerp(a0 + 0.2, a1 - 0.2, ((t * 0.04 * (i % 2 ? 1 : -1) + i * 0.19) % 1 + 1) % 1); tr(c, [E(px - 0.03, b1, 0.35), E(px + 0.03, b1, 0.35), E(px + 0.03, b1, 0.08), E(px - 0.03, b1, 0.08)]); c.fillStyle = "rgba(120,60,20,0.35)"; c.fill(); }
      tr(c, [E(a0, b1, ZB), E(a1, b1, ZB), E(a1, b1, 0), E(a0, b1, 0)]); c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke();
      // cream canopy lip
      k.poly([[TU + a0 - 0.02, TV + b1 + 0.06, ZI + ZB], [TU + a1 + 0.02, TV + b1 + 0.06, ZI + ZB], [TU + a1 + 0.02, TV + b1 + 0.06, ZI + ZB - 0.07], [TU + a0 - 0.02, TV + b1 + 0.06, ZI + ZB - 0.07]], STONE, { lw: 0.9, wobble: 0 }); }

    // ---- far plane: the outer arch (behind the sail) ----
    archBand(c, offset(CO, -0.1), OW, 0.3, B_OUT1, ZB);
    // ---- the curved sail ----
    sail(c, t);
    // ---- glass above the wing roof (between spine and inner arch) ----
    glassBands(c, t, B_MID, () => SP_W, (z) => aIn(z) - IW / 2 + 0.02, 6.3, 8.4, { pitch: 0.2, lit: 0.05, seed: 5 });
    // ---- the glass wing facing front-left ----
    { const zT = 6.3;
      glassBands(c, t, B_FRONT, () => SP_W, (z) => Math.min(aIn(z) - IW / 2 + 0.02, 1.5), ZB, zT, { pitch: 0.145, lit: 0.22, seed: 1 });
      // roof deck of the wing (pale), seen from above, then the cream parapet
      const aR = 1.48, back = [], front = [];
      for (let a = SP_W; a <= aR; a += 0.12) { back.push(E(a, B_MID, ROOF(a))); front.push(E(a, B_FRONT, ROOF(a))); }
      tr(c, [...back, ...[...front].reverse()]); c.fillStyle = "#cfe3e2"; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
      const lo = []; for (let a = SP_W; a <= aR; a += 0.12) lo.push(E(a, B_FRONT, ROOF(a) - 0.1));
      tr(c, [...front, ...[...lo].reverse()]); c.fillStyle = STONE; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke(); }
    // ---- exoskeleton struts across the wing ----
    strut(c, SP_W, 4.02, aIn(4.02) - IW / 2, 4.02, 0.26, B_FRONT + 0.02);
    strut(c, SP_W + 0.02, 4.18, aIn(5.34) - IW / 2, 5.34, 0.21, B_FRONT + 0.02);
    strut(c, SP_W + 0.02, 2.13, aIn(3.55) - IW / 2, 3.55, 0.21, B_FRONT + 0.02);
    strut(c, SP_W + 0.02, 0.75, aIn(1.68) - IW / 2, 1.68, 0.21, B_FRONT + 0.02);
    strut(c, SP_W, 2.05, aIn(2.05) - IW / 2, 2.05, 0.11, B_FRONT + 0.02);
    // ---- the inner arch, in front of the sail ----
    archBand(c, CI, IW, 0.7, B_FRONT, ZB);
    // ---- spine column ----
    { const bb = TV + 0.3, zr = ROOF(SP_W) + 0.1; // the wing hides the lower right face: only the part above the roof shows
      tr(c, [E(0, B_FRONT, 0), E(SP_W, B_FRONT, 0), E(SP_W, B_FRONT, SP_TOP), E(0, B_FRONT, SP_TOP)]); c.fillStyle = "#f6f0e4"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
      tr(c, [E(SP_W, 0.3, zr), E(SP_W, B_FRONT, zr), E(SP_W, B_FRONT, SP_TOP), E(SP_W, 0.3, SP_TOP)]); c.fillStyle = STONE_D; c.fill(); c.stroke(); }
    { c.strokeStyle = "rgba(150,135,110,0.55)"; c.lineWidth = 0.7; c.beginPath();
      for (let z = 0.9; z < SP_TOP - 0.1; z += 0.4) { c.moveTo(...E(0.01, B_FRONT, z)); c.lineTo(...E(SP_W, B_FRONT, z)); }
      c.moveTo(...E(0.13, B_FRONT, 0.1)); c.lineTo(...E(0.13, B_FRONT, SP_TOP - 0.1)); c.stroke();
      c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 1; c.beginPath(); c.moveTo(...E(0.04, B_FRONT, 0.1)); c.lineTo(...E(0.04, B_FRONT, SP_TOP - 0.1)); c.stroke(); }
    // ---- crown + blade mast ----
    k.box(TU - 0.05, TV + 0.3, ZI + SP_TOP - 0.3, SP_W + 0.5, B_FRONT - 0.3 + 0.03, 0.42, STONE, { hatch: false, shadow: false });
    k.box(TU + 0.1, TV + 0.5, ZI + SP_TOP + 0.12, 0.2, 0.28, 1.6, STONE, { hatch: false, shadow: false, left: "#fffcf6" });
    { c.strokeStyle = "rgba(150,135,110,0.5)"; c.lineWidth = 0.6; c.beginPath(); for (let z = SP_TOP + 0.4; z < SP_TOP + 1.65; z += 0.28) { c.moveTo(...E(0.11, 0.78, z)); c.lineTo(...E(0.3, 0.78, z)); } c.stroke();
      const on = (t % 1.6) < 0.5, [bx, by] = E(0.2, 0.78, SP_TOP + 1.62);
      c.fillStyle = on ? "#ff4a3a" : "#8a2a22"; c.beginPath(); c.arc(bx, by, on ? 2.4 : 1.6, 0, 6.3); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.7; c.stroke();
      if (on) { c.fillStyle = "rgba(255,90,60,0.25)"; c.beginPath(); c.arc(bx, by, 7, 0, 6.3); c.fill(); } }
    // ---- Al Muntaha: the cantilevered sky restaurant, jutting left of the spine ----
    { c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 4.2; c.beginPath(); c.moveTo(...E(-0.55, B_FRONT, 5.78)); c.lineTo(...E(0.02, B_FRONT, 5.15)); c.stroke(); c.strokeStyle = STONE_D; c.lineWidth = 2.4; c.stroke();
      k.box(TU - 0.72, TV + 0.3, ZI + 5.78, 0.74, B_FRONT - 0.3, 0.5, STONE, { hatch: false, shadow: false, left: STONE });
      // glazing ribbon on the front face
      const g = c.createLinearGradient(...E(-0.7, B_FRONT, 6), ...E(0, B_FRONT, 6)); g.addColorStop(0, GL_L); g.addColorStop(1, GL_D);
      tr(c, [E(-0.7, B_FRONT, 6.2), E(-0.01, B_FRONT, 6.2), E(-0.01, B_FRONT, 5.9), E(-0.7, B_FRONT, 5.9)]); c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
      c.strokeStyle = "rgba(15,55,65,0.6)"; c.lineWidth = 0.6; c.beginPath(); for (let a = -0.6; a < 0; a += 0.1) { c.moveTo(...E(a, B_FRONT, 6.2)); c.lineTo(...E(a, B_FRONT, 5.9)); } c.stroke();
      for (let i = 0; i < 5; i++) { const [x, y] = E(-0.58 + i * 0.13, B_FRONT, 6.05); c.fillStyle = (Math.sin(t * 1.2 + i) > -0.3) ? "#ffe2a0" : "#f0c060"; c.beginPath(); c.arc(x, y, 1, 0, 6.3); c.fill(); }
      k.box(TU - 0.76, TV + 0.28, ZI + 6.28, 0.82, B_FRONT - 0.26 + 0.04, 0.07, "#fffaf0", { hatch: false, shadow: false }); }
    // ---- helipad on its cantilever, braced back to the arches ----
    { const hu = 2.9, hv = 0.52, hz = 6.5, hr = 0.5, ring = (r, z) => { const o = []; for (let i = 0; i < 28; i++) { const a = (i / 28) * 6.2832; o.push(E(hu + Math.cos(a) * r, hv + Math.sin(a) * r, z)); } return o; };
      c.lineCap = "round";
      for (const [a, b, w] of [[[2.45, 6.5], [2.0, 5.55], 4.2], [[2.8, 6.4], [2.15, 4.7], 3.4], [[3.2, 6.35], [2.45, 4.6], 3]]) { c.strokeStyle = INK; c.lineWidth = w + 1.8; c.beginPath(); c.moveTo(...E(a[0], hv, a[1])); c.lineTo(...E(b[0], B_FRONT - 0.3, b[1])); c.stroke(); c.strokeStyle = STONE_D; c.lineWidth = w; c.stroke(); }
      k.box(TU + hu - 0.12, TV + hv - 0.12, ZI + hz - 0.5, 0.24, 0.24, 0.5, STONE_DD, { hatch: false, shadow: false });
      // deck rim then the disc
      const lo = ring(hr, hz - 0.1), hi = ring(hr, hz);
      tr(c, [...lo, ...[...hi].reverse()]); c.fillStyle = STONE_D; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
      tr(c, hi); c.fillStyle = STONE; c.fill(); c.stroke();
      tr(c, ring(hr - 0.08, hz + 0.01)); c.fillStyle = "#8fd1bd"; c.fill(); c.lineWidth = 0.8; c.stroke();
      c.strokeStyle = "rgba(255,255,255,0.85)"; c.lineWidth = 1; tr(c, ring(hr * 0.68, hz + 0.02)); c.stroke();
      c.strokeStyle = "rgba(255,255,255,0.95)"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(...E(hu - 0.12, hv - 0.1, hz + 0.02)); c.lineTo(...E(hu - 0.12, hv + 0.1, hz + 0.02)); c.moveTo(...E(hu + 0.12, hv - 0.1, hz + 0.02)); c.lineTo(...E(hu + 0.12, hv + 0.1, hz + 0.02)); c.moveTo(...E(hu - 0.12, hv, hz + 0.02)); c.lineTo(...E(hu + 0.12, hv, hz + 0.02)); c.stroke();
      for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.283 + t * 0.4, on = Math.sin(t * 4 - i) > 0.2, [x, y] = E(hu + Math.cos(a) * (hr - 0.04), hv + Math.sin(a) * (hr - 0.04), hz + 0.02); c.fillStyle = on ? "#fff3b0" : "#c8c0a8"; c.beginPath(); c.arc(x, y, 0.9, 0, 6.3); c.fill(); } }
    // ---- a sun flash sweeping the wing glass ----
    { const ga = ((t * 0.09) % 1.5) * 3.6 - 0.2; c.save(); tr(c, [E(SP_W, B_FRONT, 6.3), E(1.5, B_FRONT, 6.3), E(2.1, B_FRONT, ZB), E(SP_W, B_FRONT, ZB)]); c.clip();
      const g = c.createLinearGradient(...E(ga - 0.3, B_FRONT, 3), ...E(ga + 0.3, B_FRONT, 3)); g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.5, "rgba(255,255,255,0.32)"); g.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = g; tr(c, [E(ga - 0.3, B_FRONT, 6.3), E(ga + 0.3, B_FRONT, 6.3), E(ga + 0.3, B_FRONT, ZB), E(ga - 0.3, B_FRONT, ZB)]); c.fill(); c.restore(); }
  }

  // shadow cast on the island paving (light from the upper left)
  function shadow(k) {
    k.poly([[TU, TV + B_FRONT, ZI], [TU + 3.85, TV + B_FRONT, ZI], [TU + 5.0, TV + B_FRONT + 0.9, ZI], [TU + 1.2, TV + B_FRONT + 0.9, ZI]], "rgba(40,50,60,0.14)", { stroke: false });
  }

  return { draw, shadow, TU, TV, ZI, front: TV + B_FRONT, right: TU + 3.85, helipad: [TU + 2.9, TV + 0.52, ZI + 6.5] };
}
