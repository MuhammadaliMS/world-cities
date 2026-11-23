// Notting Hill pastel terrace: an L of eight stucco houses fitted to the reference (two wings meeting in an
// inside corner). Each house is a solid: plinth, columned portico with steps, sash windows with white
// architraves and hoods, a first-floor iron balcony with flower boxes, area railings, rusticated party
// pilasters, a dentilled cornice, its own slate roof (tile courses), a dormer on some, and a brick
// chimney stack with terracotta pots on the ridge.
import { P, INK, shade, lerp, rng } from "../../lib/vec-kit.js";

const COL = { y: "#f5dd80", b: "#abc7eb", p: "#f4bac7", v: "#c9b5e3" };
const WHITE = "#f9f4e8", TRIM = "#e6dcc8", IRON = "#1f1d1d";
const DOORS = ["#2f6b4f", "#3a5a8c", "#8c2f3f", "#2a2e3a", "#2f6b4f", "#7a4a8a", "#3a5a8c", "#8c2f3f"];
const D = 0.6, R = 0.86, DEPTH = 1.2; // ridge set-back, ridge rise, house depth (for the end walls)

// an axis-aligned wing: origin O on the facade line, w = along (unit axis), n = outward (unit axis)
function makeWing(O, w, n, houses, shadeAdj) {
  const g3 = (a, d, z) => [O[0] + w[0] * a + n[0] * d, O[1] + w[1] * a + n[1] * d, z];
  const G = (a, d, z) => P(...g3(a, d, z));
  let a = 0;
  const hs = houses.map(([col, W, H, extra], i) => { const h = { col: shade(COL[col], shadeAdj), key: col, a0: a, W, H, i, ...(extra || {}) }; a += W; return h; });
  return { G, g3, w, n, L: a, houses: hs };
}

// a box in wing frame (a along the wing, d outward, z up): visible faces are front (d1), +a side (a1) and top
function fbox(k, G, a0, a1, d0, d1, z0, z1, col, o = {}) {
  const lw = o.lw ?? 0.7;
  if (o.side !== false) k.path([G(a1, d0, z0), G(a1, d1, z0), G(a1, d1, z1), G(a1, d0, z1)], { fill: shade(col, -0.16), lw, wobble: 0 });
  k.path([G(a0, d1, z0), G(a1, d1, z0), G(a1, d1, z1), G(a0, d1, z1)], { fill: o.front || col, lw, wobble: 0 });
  if (o.top !== false) k.path([G(a0, d0, z1), G(a1, d0, z1), G(a1, d1, z1), G(a0, d1, z1)], { fill: shade(col, 0.1), lw, wobble: 0 });
}
const quad = (k, G, a0, a1, z0, z1, d, fill, lw = 0.7, stroke) => k.path([G(a0, d, z0), G(a1, d, z0), G(a1, d, z1), G(a0, d, z1)], { fill, lw, wobble: 0, stroke });

// one sash window with architrave, glazing bars, curtains, warm lamp glow, sill and hood
function sash(k, G, a, zb, zt, ww, hood, lit, seed) {
  const c = k.ctx, R = rng(seed);
  quad(k, G, a - ww / 2 - 0.065, a + ww / 2 + 0.065, zb - 0.04, zt + 0.05, 0.012, WHITE, 0.75);
  quad(k, G, a - ww / 2, a + ww / 2, zb, zt, 0.014, "#6b7486", 0.8);
  // interior: darker top, warm lamp glow lower down, curtains tied back at the sides
  k.path([G(a - ww / 2, 0.015, lerp(zb, zt, 0.62)), G(a + ww / 2, 0.015, lerp(zb, zt, 0.62)), G(a + ww / 2, 0.015, zt), G(a - ww / 2, 0.015, zt)], { fill: "rgba(40,44,58,0.35)", stroke: false, wobble: 0 });
  const glow = lit ? "rgba(255,200,115,0.9)" : "rgba(226,168,104,0.55)";
  k.path([G(a - ww * 0.32, 0.015, zb + 0.02), G(a + ww * 0.32, 0.015, zb + 0.02), G(a + ww * 0.32, 0.015, lerp(zb, zt, 0.4)), G(a - ww * 0.32, 0.015, lerp(zb, zt, 0.4))], { fill: glow, stroke: false, wobble: 0 });
  if (k.night) { // night: about two thirds of the sash windows glow with lamplight (pure function of position)
    const hv = (Math.abs(Math.sin(seed * 12.9898 + a * 78.233 + zb * 37.719)) * 43758.5453) % 1;
    if (hv < 0.62) k.lit(() => k.path([G(a - ww / 2, 0.016, zb), G(a + ww / 2, 0.016, zb), G(a + ww / 2, 0.016, zt), G(a - ww / 2, 0.016, zt)], { fill: hv < 0.3 ? "#ffd27a" : "#ffc060", stroke: false, wobble: 0 }));
  }
  for (const sg of [-1, 1]) {
    const e = a + sg * ww / 2, m = a + sg * ww * 0.3;
    k.path([G(e, 0.016, zt), G(m, 0.016, zt), G(lerp(m, e, 0.35), 0.016, lerp(zb, zt, 0.45)), G(m, 0.016, zb), G(e, 0.016, zb)], { fill: "#efe3c8", stroke: false, wobble: 0 });
    c.strokeStyle = "rgba(160,130,90,0.6)"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(...G(lerp(m, e, 0.5), 0.017, zt)); c.lineTo(...G(lerp(m, e, 0.62), 0.017, lerp(zb, zt, 0.45))); c.stroke();
  }
  // glazing bars (6 over 6)
  c.strokeStyle = "#f3eee2"; c.lineWidth = 1.1; c.beginPath();
  const zm = (zb + zt) / 2;
  c.moveTo(...G(a - ww / 2, 0.018, zm)); c.lineTo(...G(a + ww / 2, 0.018, zm));
  c.stroke();
  c.strokeStyle = "rgba(40,36,34,0.9)"; c.lineWidth = 0.6; c.beginPath();
  for (const f of [1 / 3, 2 / 3]) { const aa = a - ww / 2 + ww * f; c.moveTo(...G(aa, 0.018, zb)); c.lineTo(...G(aa, 0.018, zt)); }
  for (const f of [0.25, 0.75]) { const zz = lerp(zb, zt, f); c.moveTo(...G(a - ww / 2, 0.018, zz)); c.lineTo(...G(a + ww / 2, 0.018, zz)); }
  c.stroke();
  // sill with two little brackets
  fbox(k, G, a - ww / 2 - 0.11, a + ww / 2 + 0.11, 0, 0.09, zb - 0.11, zb - 0.04, WHITE, { lw: 0.6 });
  // hood: segmental pediment, triangular pediment or flat cornice on consoles
  if (hood === "arch" || hood === "ped") {
    const z0 = zt + 0.07, z1 = zt + (hood === "arch" ? 0.24 : 0.26);
    const p0 = G(a - ww / 2 - 0.1, 0.06, z0), p1 = G(a + ww / 2 + 0.1, 0.06, z0), pk = G(a, 0.06, z1);
    c.beginPath(); c.moveTo(...p0);
    if (hood === "arch") c.quadraticCurveTo(pk[0], pk[1] - (z1 - z0) * 30, ...p1); else { c.lineTo(...pk); c.lineTo(...p1); }
    c.closePath(); c.fillStyle = WHITE; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.75; c.stroke();
    // inner shadow line of the pediment
    const q0 = G(a - ww / 2 - 0.06, 0.06, z0 + 0.03), q1 = G(a + ww / 2 + 0.06, 0.06, z0 + 0.03), qk = G(a, 0.06, z1 - 0.06);
    c.beginPath(); c.moveTo(...q0); if (hood === "arch") c.quadraticCurveTo(qk[0], qk[1] - (z1 - z0) * 22, ...q1); else { c.lineTo(...qk); c.lineTo(...q1); }
    c.strokeStyle = "rgba(150,130,100,0.55)"; c.lineWidth = 0.6; c.stroke();
    fbox(k, G, a - ww / 2 - 0.11, a + ww / 2 + 0.11, 0, 0.07, zt + 0.03, zt + 0.08, WHITE, { lw: 0.6 });
  } else {
    fbox(k, G, a - ww / 2 - 0.1, a + ww / 2 + 0.1, 0, 0.07, zt + 0.05, zt + 0.12, WHITE, { lw: 0.6 });
    for (const s of [-1, 1]) quad(k, G, a + s * (ww / 2 + 0.05) - 0.03, a + s * (ww / 2 + 0.05) + 0.03, zt - 0.1, zt + 0.06, 0.04, WHITE, 0.5);
  }
  return R;
}

// cast-iron railing between two wing-frame points at a height, with spear heads and a scroll band
function ironRail(k, G, a0, d0, a1, d1, z0, h, o = {}) {
  const c = k.ctx, L = Math.hypot(a1 - a0, d1 - d0), n = Math.max(2, Math.round(L / (o.step ?? 0.075)));
  const at = (f, z) => G(lerp(a0, a1, f), lerp(d0, d1, f), z);
  c.strokeStyle = IRON; c.lineCap = "round";
  c.lineWidth = 0.75; c.beginPath();
  for (let i = 0; i <= n; i++) { const f = i / n; c.moveTo(...at(f, z0)); c.lineTo(...at(f, z0 + h + (o.spear ? 0.05 : 0))); }
  c.stroke();
  c.lineWidth = 1.3; c.beginPath();
  for (const zz of [z0 + 0.03, z0 + h]) { c.moveTo(...at(0, zz)); c.lineTo(...at(1, zz)); }
  c.stroke();
  if (o.scroll !== false) { c.lineWidth = 0.6; c.beginPath(); for (let i = 0; i < n; i++) { const p = at((i + 0.5) / n, z0 + h * 0.78); c.moveTo(p[0] + 1.6, p[1]); c.arc(p[0], p[1], 1.6, 0, 6.28); } c.stroke(); }
  if (o.spear) { c.fillStyle = IRON; for (let i = 0; i <= n; i += 1) { const [x, y] = at(i / n, z0 + h + 0.05); c.beginPath(); c.moveTo(x, y - 2.4); c.lineTo(x + 1.1, y); c.lineTo(x - 1.1, y); c.fill(); } }
  for (const f of [0, 1]) { c.lineWidth = 2; c.beginPath(); c.moveTo(...at(f, z0)); c.lineTo(...at(f, z0 + h + 0.04)); c.stroke(); }
}

// flower box: blobs of leaves + blooms spilling over a front edge
function flowerBox(k, G, a0, a1, d, z, seed, cols) {
  const c = k.ctx, R = rng(seed), n = Math.round((a1 - a0) / 0.05);
  fbox(k, G, a0, a1, d - 0.1, d, z, z + 0.12, "#8a5a3c", { lw: 0.6 });
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i < n; i++) {
    const aa = lerp(a0, a1, (i + R()) / n), [x, y] = G(aa, d + 0.02, z + 0.14 + R() * 0.34);
    if (pass === 0) { c.fillStyle = R() < 0.5 ? "#5e8f45" : "#76a552"; c.beginPath(); c.arc(x, y - 1, 3.2 + R() * 2, 0, 7); c.fill(); }
    else { for (let q = 0; q < 2; q++) { c.fillStyle = cols[Math.floor(R() * cols.length)]; c.beginPath(); c.arc(x + (R() - 0.5) * 5, y - 3 + R() * 5, 1.8 + R() * 1.2, 0, 7); c.fill(); } }
  }
  // trailing strands over the edge
  c.strokeStyle = "#5e8f45"; c.lineWidth = 1.2; c.beginPath();
  for (let i = 0; i < n / 2; i++) { const aa = lerp(a0, a1, (i + 0.5) / (n / 2)), [x, y] = G(aa, d + 0.02, z + 0.1); c.moveTo(x, y); c.quadraticCurveTo(x + 2, y + 4, x + (R() - 0.5) * 3, y + 5 + R() * 6); }
  c.stroke();
}

function house(k, W, h, t, pass) {
  const { G } = W, c = k.ctx, { a0, W: Wd, H, col, i } = h, a1 = a0 + Wd, s = H / 5.4;
  const Z = (z) => z * s, seed = i * 17 + (W.key === "L" ? 3 : 101);
  const doorA = a0 + Wd * (h.doorRight ? 0.7 : 0.3), winA = a0 + Wd * (h.doorRight ? 0.3 : 0.7);
  const bayA = [a0 + Wd * 0.3, a0 + Wd * 0.7];
  if (h.hidden) { if (pass === "face") { quad(k, G, a0, a1, 0, H, 0, col, 0.9); quad(k, G, a0, a1, 0, 0.32, 0.01, "#ebe3d2", 0.6); } return; }
  if (pass === "face") {
    quad(k, G, a0, a1, 0, H, 0, col, 0.9);
    // stucco texture: faint horizontal rustication on the ground floor
    c.strokeStyle = "rgba(120,100,80,0.18)"; c.lineWidth = 0.6; c.beginPath();
    for (let z = 0.55; z < Z(1.8); z += 0.25) { c.moveTo(...G(a0, 0.005, z)); c.lineTo(...G(a1, 0.005, z)); }
    c.stroke();
    { const RM = rng(seed + 900); for (let m = 0; m < 46; m++) { const [x, y] = G(lerp(a0 + 0.1, a1 - 0.1, RM()), 0.004, 0.4 + RM() * (H - 0.9)); c.fillStyle = RM() < 0.5 ? "rgba(255,255,255,0.16)" : "rgba(120,90,70,0.07)"; c.beginPath(); c.ellipse(x, y, 3 + RM() * 6, 1.5 + RM() * 3, 0, 0, 7); c.fill(); } }
    quad(k, G, a0, a1, 0, 0.32, 0.01, "#ebe3d2", 0.6);
    // string courses
    fbox(k, G, a0, a1, 0, 0.05, Z(1.84), Z(1.92), WHITE, { lw: 0.55, side: false });
    fbox(k, G, a0, a1, 0, 0.05, Z(3.62), Z(3.7), WHITE, { lw: 0.55, side: false });
    // ground floor window with area railing below it
    sash(k, G, winA, 0.62, Z(1.55), 0.4, "flat", ((seed * 7) % 5) < 2, seed);
    // first floor: tall windows behind the balcony, arched or pedimented hoods
    for (const [j, a] of bayA.entries()) sash(k, G, a, Z(2.08), Z(3.12), 0.38, (i + j) % 2 ? "ped" : "arch", ((seed + j * 3) % 4) === 0, seed + j);
    // second floor: shorter sashes with flat hoods
    for (const [j, a] of bayA.entries()) sash(k, G, a, Z(3.95), Z(4.62), 0.36, "flat", ((seed + j * 5) % 3) === 0, seed + 9 + j);
    // recessed door with fanlight inside the portico
    quad(k, G, doorA - 0.26, doorA + 0.26, 0.3, Z(1.62), 0.01, "#ded4c0", 0.6);
    quad(k, G, doorA - 0.19, doorA + 0.19, 0.32, Z(1.3), 0.012, DOORS[(i + (W.key === "L" ? 0 : 4)) % 8], 0.8);
    { const zz = Z(1.3), zt = Z(1.55), p0 = G(doorA - 0.19, 0.014, zz), p1 = G(doorA + 0.19, 0.014, zz), pk = G(doorA, 0.014, zt);
      c.beginPath(); c.moveTo(...p0); c.quadraticCurveTo(pk[0], pk[1] - 4, ...p1); c.closePath(); c.fillStyle = "#e6b45e"; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.7; c.stroke();
      c.lineWidth = 0.5; c.beginPath(); for (const f of [0.25, 0.5, 0.75]) { const m = G(doorA, 0.014, zz); const e = G(lerp(doorA - 0.19, doorA + 0.19, f), 0.014, lerp(zz, zt, 0.9 - Math.abs(f - 0.5))); c.moveTo(...m); c.lineTo(...e); } c.stroke(); }
    // door panels + knocker
    c.strokeStyle = "rgba(255,255,255,0.35)"; c.lineWidth = 0.6;
    for (const [za, zb] of [[0.42, 0.8], [0.88, Z(1.22)]]) for (const sgn of [-1, 1]) { c.beginPath(); const q = [G(doorA + sgn * 0.03, 0.013, za), G(doorA + sgn * 0.15, 0.013, za), G(doorA + sgn * 0.15, 0.013, zb), G(doorA + sgn * 0.03, 0.013, zb)]; c.moveTo(...q[0]); q.slice(1).forEach((p) => c.lineTo(...p)); c.closePath(); c.stroke(); }
    { const [x, y] = G(doorA + 0.12, 0.014, 0.82); c.fillStyle = "#f1c95a"; c.beginPath(); c.arc(x, y, 1.3, 0, 7); c.fill(); }
    // rusticated party pilasters (quoins) at both ends
    for (const a of [a0, a1]) {
      const q0 = a === a0 ? a0 : a1 - 0.15, q1 = q0 + 0.15;
      fbox(k, G, q0, q1, 0, 0.035, 0.32, H - 0.42, WHITE, { lw: 0.6, top: false });
      c.strokeStyle = "rgba(140,120,95,0.55)"; c.lineWidth = 0.55; c.beginPath();
      let n = 0; for (let z = 0.6; z < H - 0.45; z += 0.27, n++) { const off = n % 2 ? 0.035 : 0; c.moveTo(...G(q0 + off, 0.036, z)); c.lineTo(...G(q1 - (n % 2 ? 0 : 0.035), 0.036, z)); }
      c.stroke();
    }
    // the cornice frieze band (the projecting part comes later, over the roof edge)
    quad(k, G, a0, a1, H - 0.42, H - 0.16, 0.01, shade(col, 0.25), 0.55);
  }
  if (pass === "front") {
    // area: a planted strip behind spear-topped railings in front of the window bay
    const ra0 = Math.min(winA, doorA) === winA ? a0 + 0.12 : doorA + 0.36, ra1 = Math.min(winA, doorA) === winA ? doorA - 0.36 : a1 - 0.12;
    k.path([G(ra0, 0, 0.005), G(ra1, 0, 0.005), G(ra1, 0.62, 0.005), G(ra0, 0.62, 0.005)], { fill: "#d9cdb2", lw: 0.5, wobble: 0 });
    { const R2 = rng(seed + 5); for (let j = 0; j < 7; j++) { const [x, y] = G(lerp(ra0 + 0.08, ra1 - 0.08, j / 6), 0.25, 0.12); c.fillStyle = j % 2 ? "#5e8f45" : "#73a34f"; c.beginPath(); c.arc(x, y - 2, 4 + R2() * 2, 0, 7); c.fill(); if (R2() < 0.6) { c.fillStyle = ["#f08bb5", "#ffffff", "#e8607a", "#f4c542"][j % 4]; c.beginPath(); c.arc(x + 1, y - 5, 1.8, 0, 7); c.fill(); } } }
    // steps up to the portico
    for (let st = 0; st < 3; st++) fbox(k, G, doorA - 0.34, doorA + 0.34, 0, 0.86 - st * 0.13, st * 0.1, st * 0.1 + 0.1, st ? "#efe8da" : "#e2d9c6", { lw: 0.6 });
    // portico: two columns carrying an entablature
    for (const sgn of [-1, 1]) {
      const [cu, cv] = W.g3(doorA + sgn * 0.29, 0.5, 0);
      fbox(k, G, doorA + sgn * 0.29 - 0.08, doorA + sgn * 0.29 + 0.08, 0.42, 0.58, 0.3, 0.4, WHITE, { lw: 0.6 });
      k.cyl(cu, cv, 0.4, 0.055, Z(1.6) - 0.4, WHITE, { top: false });
      fbox(k, G, doorA + sgn * 0.29 - 0.085, doorA + sgn * 0.29 + 0.085, 0.415, 0.585, Z(1.6), Z(1.66), WHITE, { lw: 0.6 });
    }
    fbox(k, G, doorA - 0.42, doorA + 0.42, 0, 0.64, Z(1.66), Z(1.86), WHITE, { lw: 0.7 });
    // railing round the area, with a gate post by the steps
    ironRail(k, G, ra0, 0.62, ra1, 0.62, 0, 0.5, { spear: true, scroll: false, step: 0.08 });
    // first-floor balcony across the front: slab on brackets, cast-iron front, flower box
    fbox(k, G, a0 + 0.1, a1 - 0.1, 0, 0.36, Z(1.88), Z(1.98), WHITE, { lw: 0.7 });
    for (const a of [a0 + 0.2, a1 - 0.2]) fbox(k, G, a - 0.03, a + 0.03, 0, 0.12, Z(1.68), Z(1.88), WHITE, { lw: 0.5, top: false });
    if (i > 0) ironRail(k, G, a0 + 0.12, 0.02, a0 + 0.12, 0.34, Z(1.98), 0.4, { step: 0.1 });
    if (h.box !== false) { const left = (i + (W.key === "L" ? 0 : 1)) % 2 === 0; const fa0 = left ? a0 + 0.18 : a0 + Wd * 0.48, fa1 = left ? a0 + Wd * 0.52 : a1 - 0.18; flowerBox(k, G, fa0, fa1, 0.3, Z(1.98), seed + 31, ["#f08bb5", "#e8607a", "#f7c6d8", "#ffffff", "#d94f86"]); }
    ironRail(k, G, a0 + 0.12, 0.34, a1 - 0.12, 0.34, Z(1.98), 0.4, { step: 0.07 });
    ironRail(k, G, a1 - 0.12, 0.02, a1 - 0.12, 0.34, Z(1.98), 0.4, { step: 0.1 });
    // a climbing plant on some facades
    if (h.ivy) { const R3 = rng(seed + 77); for (let j = 0; j < 40; j++) { const [x, y] = G(a1 - 0.08 + (R3() - 0.5) * 0.2, 0.05, R3() * Z(2.6)); c.fillStyle = R3() < 0.5 ? "#4f7f3a" : "#6a9a48"; c.beginPath(); c.arc(x, y, 2 + R3() * 2, 0, 7); c.fill(); } }
  }
}

// slate roof slope with tile courses, ridge cap, optional hip at the outer end
function slate(k, pts, seed, base = "#6c7386") {
  const c = k.ctx, R = rng(seed);
  k.path(pts, { fill: base, lw: 1.1, wobble: 0 });
  c.save(); c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.clip();
  // pts: [eave a0, eave a1, ridge a1, ridge a0]
  const [e0, e1, r1, r0] = pts, rows = 8;
  for (let r = 0; r < rows; r++) {
    const f0 = r / rows, f1 = (r + 1) / rows;
    const A0 = [lerp(e0[0], r0[0], f0), lerp(e0[1], r0[1], f0)], A1 = [lerp(e1[0], r1[0], f0), lerp(e1[1], r1[1], f0)];
    const B0 = [lerp(e0[0], r0[0], f1), lerp(e0[1], r0[1], f1)], B1 = [lerp(e1[0], r1[0], f1), lerp(e1[1], r1[1], f1)];
    const len = Math.hypot(A1[0] - A0[0], A1[1] - A0[1]), n = Math.max(3, Math.round(len / 7.5)), off = r % 2 ? 0.5 : 0;
    for (let j = -1; j < n; j++) {
      const g0 = Math.max(0, (j + off) / n), g1 = Math.min(1, (j + 1 + off) / n); if (g1 <= g0) continue;
      const q = [[lerp(A0[0], A1[0], g0), lerp(A0[1], A1[1], g0)], [lerp(A0[0], A1[0], g1), lerp(A0[1], A1[1], g1)], [lerp(B0[0], B1[0], g1), lerp(B0[1], B1[1], g1)], [lerp(B0[0], B1[0], g0), lerp(B0[1], B1[1], g0)]];
      c.beginPath(); q.forEach((p, ii) => (ii ? c.lineTo(...p) : c.moveTo(...p))); c.closePath();
      c.fillStyle = shade(base, (R() - 0.5) * 0.16 + (1 - f0) * 0.04); c.fill();
      c.strokeStyle = "rgba(30,32,45,0.45)"; c.lineWidth = 0.55; c.stroke();
    }
  }
  c.restore();
  k.path(pts, { lw: 1.1, wobble: 0 });
}

function chimney(k, W, a, H, seed, t, smoke) {
  const { G } = W, c = k.ctx, zr = H + R - 0.2, top = zr + 1.0, Dc = D + 0.12;
  const BR = "#bf9461";
  fbox(k, G, a - 0.26, a + 0.26, -Dc - 0.2, -Dc + 0.18, zr, top, BR, { lw: 0.9 });
  // brick courses on the front and side
  c.save(); const fr = [G(a - 0.26, -Dc + 0.18, zr), G(a + 0.26, -Dc + 0.18, zr), G(a + 0.26, -Dc + 0.18, top), G(a - 0.26, -Dc + 0.18, top)];
  c.beginPath(); fr.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.clip();
  c.strokeStyle = "rgba(90,60,35,0.45)"; c.lineWidth = 0.5; c.beginPath();
  let n = 0; for (let z = zr + 0.08; z < top; z += 0.09, n++) { c.moveTo(...G(a - 0.26, -Dc + 0.18, z)); c.lineTo(...G(a + 0.26, -Dc + 0.18, z)); for (let b = a - 0.26 + (n % 2 ? 0.06 : 0.12); b < a + 0.26; b += 0.13) { c.moveTo(...G(b, -Dc + 0.18, z)); c.lineTo(...G(b, -Dc + 0.18, z + 0.09)); } }
  c.stroke(); c.restore();
  fbox(k, G, a - 0.31, a + 0.31, -Dc - 0.25, -Dc + 0.23, top, top + 0.1, "#efe4cc", { lw: 0.8 });
  const pots = 3 + (seed % 2);
  for (let p = 0; p < pots; p++) {
    const aa = a - 0.2 + (0.4 * p) / (pots - 1), [cu, cv] = W.g3(aa, -Dc, 0);
    k.cyl(cu, cv, top + 0.1, 0.055, 0.34 + (p % 2) * 0.05, "#c8643c", { topCol: "#5a2a1a" });
    const [x, y] = P(cu, cv, top + 0.44 + (p % 2) * 0.05); c.strokeStyle = INK; c.lineWidth = 0.7; c.fillStyle = "#d9774c"; c.beginPath(); c.ellipse(x, y + 1, 4.4, 2, 0, 0, 7); c.fill(); c.stroke();
    c.fillStyle = "#3a1c12"; c.beginPath(); c.ellipse(x, y + 1, 2.4, 1, 0, 0, 7); c.fill();
    if (smoke && p === 1) {
      for (let s = 0; s < 6; s++) { const f = (t * 0.22 + s / 6) % 1; c.fillStyle = `rgba(236,234,230,${0.5 * (1 - f)})`; c.beginPath(); c.arc(x + f * 24 + Math.sin(t * 0.9 + s) * 3, y - 4 - f * 46, 2.5 + f * 7, 0, 7); c.fill(); }
    }
  }
}

function dormer(k, W, a, H, col) {
  const { G } = W, c = k.ctx, zb = H + 0.12, zt = zb + 0.62, d0 = -0.42, d1 = -0.12;
  // cheeks + front
  k.path([G(a + 0.24, d0, zb + 0.25), G(a + 0.24, d1, zb), G(a + 0.24, d1, zt), G(a + 0.24, d0, zt)], { fill: TRIM, lw: 0.7, wobble: 0 });
  k.path([G(a - 0.24, d1, zb), G(a + 0.24, d1, zb), G(a + 0.24, d1, zt), G(a - 0.24, d1, zt)], { fill: WHITE, lw: 0.8, wobble: 0 });
  quad(k, G, a - 0.15, a + 0.15, zb + 0.1, zt - 0.1, d1 + 0.005, "#4a4f5c", 0.7);
  c.strokeStyle = "#f3eee2"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(...G(a - 0.15, d1 + 0.01, (zb + zt) / 2)); c.lineTo(...G(a + 0.15, d1 + 0.01, (zb + zt) / 2)); c.moveTo(...G(a, d1 + 0.01, zb + 0.1)); c.lineTo(...G(a, d1 + 0.01, zt - 0.1)); c.stroke();
  k.path([G(a - 0.15, d1 + 0.008, zb + 0.12), G(a + 0.15, d1 + 0.008, zb + 0.12), G(a + 0.15, d1 + 0.008, zb + 0.28), G(a - 0.15, d1 + 0.008, zb + 0.28)], { fill: "rgba(255,196,110,0.6)", stroke: false, wobble: 0 });
  // little pitched slate roof
  k.path([G(a - 0.3, d1 + 0.04, zt), G(a + 0.3, d1 + 0.04, zt), G(a + 0.3, d0 - 0.05, zt + 0.18), G(a - 0.3, d0 - 0.05, zt + 0.18)], { fill: "#5f6678", lw: 0.8, wobble: 0 });
  k.path([G(a - 0.3, d1 + 0.04, zt), G(a + 0.3, d1 + 0.04, zt), G(a, d1 + 0.04, zt + 0.22)], { fill: WHITE, lw: 0.8, wobble: 0 });
}

export function makeTerrace() {
  // back wing along u (facades on the LEFT face, v = 1.5); the first house is the hidden corner block
  const L = makeWing([0.3, 1.5], [1, 0], [0, 1], [["y", 1.2, 5.4, { hidden: true }], ["v", 2.05, 5.4, { ivy: true }], ["p", 2.05, 5.55], ["b", 2.05, 5.72, { dormer: true }], ["y", 2.05, 5.9]], 0.0);
  // left wing along v (facades on the RIGHT face, u = 1.5)
  const Rw = makeWing([1.5, 1.5], [0, 1], [1, 0], [["y", 2.05, 5.4, { doorRight: true }], ["b", 2.05, 5.25, { dormer: true }], ["p", 2.05, 5.08], ["v", 2.05, 4.92, { dormer: true }]], -0.04);
  L.key = "L"; Rw.key = "R";
  const V = { aL: 0.6, aR: -D };
  const wings = [L, Rw];
  return {
    wings,
    draw(k, t) {
      const c = k.ctx;
      // ---- far end walls (the visible +a side of each wing's last house) ----
      for (const W of wings) {
        const h = W.houses[W.houses.length - 1], a1 = h.a0 + h.W, G = W.G;
        k.path([G(a1, 0, 0), G(a1, -DEPTH, 0), G(a1, -DEPTH, h.H), G(a1, 0, h.H)], { fill: shade(h.col, W.key === "L" ? -0.1 : -0.01), lw: 1, wobble: 0 });
        c.strokeStyle = "rgba(120,100,80,0.16)"; c.lineWidth = 0.6; c.beginPath(); for (let z = 0.5; z < h.H - 0.3; z += 0.3) { c.moveTo(...G(a1, -0.15, z)); c.lineTo(...G(a1, -DEPTH, z)); } c.stroke();
        k.path([G(a1, 0, 0.3), G(a1, -0.16, 0.3), G(a1, -0.16, h.H - 0.3), G(a1, 0, h.H - 0.3)], { fill: shade(WHITE, -0.1), lw: 0.6, wobble: 0 });
        k.path([G(a1, 0, 0), G(a1, -DEPTH, 0), G(a1, -DEPTH, 0.3), G(a1, 0, 0.3)], { fill: "#ddd3c0", lw: 0.6, wobble: 0 });
        // hip end of the roof
        k.path([G(a1, 0, h.H), G(a1, -DEPTH, h.H), G(a1 - 0.62, -D, h.H + R)], { fill: "#5b6274", lw: 1, wobble: 0 });
        c.strokeStyle = "rgba(30,32,45,0.35)"; c.lineWidth = 0.5; c.beginPath();
        for (let f = 0.15; f < 1; f += 0.14) { c.moveTo(...G(a1 - 0.62 * f, lerp(0, -D, f), h.H + R * f)); c.lineTo(...G(a1 - 0.62 * f, lerp(-DEPTH, -D, f), h.H + R * f)); }
        c.stroke();
        // cornice return on the end wall
        k.path([G(a1, 0.16, h.H - 0.14), G(a1, -DEPTH, h.H - 0.14), G(a1, -DEPTH, h.H), G(a1, 0.16, h.H)], { fill: TRIM, lw: 0.7, wobble: 0 });
      }
      // ---- facades (flat), then everything that projects ----
      for (const W of wings) for (const h of W.houses) house(k, W, h, t, "face");
      for (const W of wings) for (const h of W.houses) house(k, W, h, t, "front");
      // ---- roofs: corner houses first (furthest), outward ----
      for (const W of wings) {
        const aV = W === L ? 0 : V.aR;
        W.houses.forEach((h, j) => {
          const a0 = h.a0, a1 = h.a0 + h.W, last = j === W.houses.length - 1;
          const r0 = j === 0 ? aV : a0, r1 = last ? a1 - 0.62 : a1;
          slate(k, [W.G(W !== L && j === 0 ? 0.08 : a0, 0.08, h.H), W.G(a1, 0.08, h.H), W.G(r1, -D, h.H + R), W.G(r0, -D, h.H + R)], 300 + j * 7 + (W === L ? 0 : 50));
          // ridge cap
          k.line([W.G(r0, -D, h.H + R + 0.03), W.G(r1, -D, h.H + R + 0.03)], { lw: 2.6, stroke: "#4c5262", wobble: 0 });
          if (h.dormer) dormer(k, W, a0 + h.W * 0.35, h.H, h.col);
        });
      }
      // ---- projecting cornices with dentils, and party-wall parapets ----
      for (const W of wings) for (const h of W.houses) {
        if (h.hidden) continue;
        const G = W.G, a0 = h.a0, a1 = a0 + h.W;
        // dentils
        c.fillStyle = WHITE; c.strokeStyle = "rgba(110,95,75,0.7)"; c.lineWidth = 0.5;
        for (let a = a0 + 0.08; a < a1 - 0.06; a += 0.11) { k.path([G(a, 0.05, h.H - 0.22), G(a + 0.055, 0.05, h.H - 0.22), G(a + 0.055, 0.05, h.H - 0.13), G(a, 0.05, h.H - 0.13)], { fill: WHITE, lw: 0.45, wobble: 0 }); }
        fbox(k, G, a0 - 0.02, a1 + 0.02, -0.02, 0.17, h.H - 0.14, h.H + 0.02, WHITE, { lw: 0.8 });
      }
      for (const W of wings) W.houses.forEach((h, j) => {
        if (j === W.houses.length - 1 || h.hidden) return;
        const G = W.G, a = h.a0 + h.W, H2 = Math.max(h.H, W.houses[j + 1].H);
        // parapet wall following the roof pitch up to the ridge, white coping on top
        k.path([G(a + 0.05, 0.12, H2 + 0.02), G(a + 0.05, 0.12, H2 + 0.12), G(a + 0.05, -D, H2 + R + 0.1), G(a + 0.05, -D, H2 + R)], { fill: shade(WHITE, -0.14), lw: 0.6, wobble: 0 });
        k.path([G(a - 0.05, 0.13, H2 + 0.12), G(a + 0.05, 0.13, H2 + 0.12), G(a + 0.05, -D, H2 + R + 0.1), G(a - 0.05, -D, H2 + R + 0.1)], { fill: WHITE, lw: 0.7, wobble: 0 });
        fbox(k, G, a - 0.09, a + 0.09, 0.0, 0.19, H2 - 0.02, H2 + 0.16, WHITE, { lw: 0.7 });
      });
      // valley line at the inside corner
      { const h = Rw.houses[0]; k.line([Rw.G(0.08, 0.08, h.H), Rw.G(V.aR, -D, h.H + R)], { lw: 1.6, stroke: "#3d4252", wobble: 0 }); }
      // ---- chimney stacks on the ridges (far to near) ----
      const stacks = [];
      for (const W of wings) W.houses.forEach((h, j) => { const a = h.a0 + h.W * (j === W.houses.length - 1 ? 0.45 : 0.62); const g = W.g3(a, -D, 0); stacks.push({ W, a, H: h.H, d: g[0] + g[1], seed: j + (W === L ? 0 : 5) }); });
      stacks.sort((p, q) => p.d - q.d);
      for (const s of stacks) chimney(k, s.W, s.a, s.H, s.seed, t, s.seed === 2 || s.seed === 6);
    },
  };
}
