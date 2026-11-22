// Jing'an Temple, grid-conformant pieces: every wall runs along u or v, everything goes through P(u, v, z).
import { P, CTS, INK, shade, lerp, rng, glint, lantern } from "./_props.js";
import { GOLD, GOLD_L, GOLD_D, GOLD_E, RED, RED_D, richRoof, chiwen } from "./_t0_1.js";

export const WALL = "#8a2c26", STONE = "#e8dfc9", STONE_D = "#d4c9ad";

// lattice window quad: q = [bottom-start, bottom-end, top-end, top-start] in (u,v,z)
function lattice(k, q, col, nx = 4, ny = 3) {
  const c = k.ctx;
  k.poly(q, col, { lw: 0.9, wobble: 0 });
  const Q = q.map((p) => P(...p));
  c.strokeStyle = "rgba(60,30,15,0.7)"; c.lineWidth = 0.7; c.beginPath();
  for (let i = 1; i < nx; i++) { const s = i / nx; c.moveTo(lerp(Q[0][0], Q[1][0], s), lerp(Q[0][1], Q[1][1], s)); c.lineTo(lerp(Q[3][0], Q[2][0], s), lerp(Q[3][1], Q[2][1], s)); }
  for (let i = 1; i < ny; i++) { const s = i / ny; c.moveTo(lerp(Q[0][0], Q[3][0], s), lerp(Q[0][1], Q[3][1], s)); c.lineTo(lerp(Q[1][0], Q[2][0], s), lerp(Q[1][1], Q[2][1], s)); }
  c.stroke();
}
function pillar(k, a, b, z0, z1, w = 2.6, col = RED) {
  const c = k.ctx; c.lineCap = "round";
  c.strokeStyle = INK; c.lineWidth = w + 1.6; c.beginPath(); c.moveTo(...P(a, b, z0)); c.lineTo(...P(a, b, z1)); c.stroke();
  c.strokeStyle = col; c.lineWidth = w; c.stroke();
}

// red-walled axis-aligned hall body with pillars + lattice on its two visible faces
export function body(k, u, v, z0, du, dv, h, o = {}) {
  const wall = o.wall || WALL, pl = o.pl ?? 0, b = z0 + pl, glass = o.glass || "#d9a84f";
  if (pl > 0) k.box(u - 0.08, v - 0.08, z0, du + 0.16, dv + 0.16, pl, o.plinth || STONE, { hatch: false, shadow: false });
  k.box(u, v, b, du, dv, h, wall, { hatch: false, shadow: o.shadow ?? false, top: shade(wall, -0.1) });
  const nL = o.nL ?? Math.max(2, Math.round(du / 0.55)), nR = o.nR ?? Math.max(2, Math.round(dv / 0.55));
  const za = o.za ?? 0.2, zb = o.zb ?? 0.8;
  if (!o.noL) {
    for (let i = 0; i < nL; i++) { const a0 = u + (du * (i + 0.12)) / nL, a1 = u + (du * (i + 0.88)) / nL, V = v + dv; lattice(k, [[a0, V, b + h * za], [a1, V, b + h * za], [a1, V, b + h * zb], [a0, V, b + h * zb]], glass); }
    for (let i = 0; i <= nL; i++) pillar(k, u + (du * i) / nL, v + dv, b, b + h);
  }
  for (let i = 0; i < nR; i++) { const a0 = v + (dv * (i + 0.12)) / nR, a1 = v + (dv * (i + 0.88)) / nR, U = u + du; lattice(k, [[U, a0, b + h * za], [U, a1, b + h * za], [U, a1, b + h * zb], [U, a0, b + h * zb]], shade(glass, -0.12)); }
  for (let i = 0; i <= nR; i++) pillar(k, u + du, v + (dv * i) / nR, b, b + h);
  return b;
}

// bracket band (dougong) under an eave on the left face (runs along u) at v, z top
function bracketsL(k, u0, u1, v, zt, h) {
  const c = k.ctx;
  k.poly([[u0, v, zt - h], [u1, v, zt - h], [u1, v, zt], [u0, v, zt]], RED_D, { lw: 1, wobble: 0 });
  k.poly([[u0, v, zt - h * 0.45], [u1, v, zt - h * 0.45], [u1, v, zt - h * 0.2], [u0, v, zt - h * 0.2]], "#2f6f64", { lw: 0.6, wobble: 0, stroke: false });
  c.fillStyle = GOLD;
  const n = Math.round((u1 - u0) / 0.25);
  for (let i = 0; i < n; i++) { const a = lerp(u0 + 0.1, u1 - 0.1, (i + 0.5) / n), [x, y] = P(a, v, zt - h * 0.5); c.beginPath(); c.moveTo(x - 3.5, y - 5); c.lineTo(x + 3.5, y - 5); c.lineTo(x + 2, y + 3); c.lineTo(x - 2, y + 3); c.closePath(); c.fill(); c.lineWidth = 0.5; c.strokeStyle = INK; c.stroke(); }
}

// ---------- main hall: back of the tile, facade on the LEFT face (v+ side) ----------
export const HALL = { u: 3.3, v: 1.3, du: 4.6, dv: 2.5, UC: 5.6 };
export function hall(k, t) {
  const c = k.ctx, { u, v, du, dv, UC } = HALL, V1 = v + dv, PZ = 0.5, H = 1.4, b = PZ;
  // marble platform
  k.box(2.9, 0.7, 0, 5.2, 3.6, PZ, STONE, { hatch: false, shadow: true });
  // lower storey: custom facade on the left face
  body(k, u, v, PZ, du, dv, H, { noL: true, nR: 5, glass: "#d9a84f" });
  const nL = 8, step = du / nL;
  for (let i = 0; i < nL; i++) {
    const a0 = u + step * (i + 0.1), a1 = u + step * (i + 0.9), mid = i === 3 || i === 4;
    if (mid) { k.poly([[a0, V1, b + 0.12], [a1, V1, b + 0.12], [a1, V1, b + H - 0.3], [a0, V1, b + H - 0.3]], "#3a1a14", { lw: 0.9, wobble: 0 }); }
    else lattice(k, [[a0, V1, b + 0.14], [a1, V1, b + 0.14], [a1, V1, b + H - 0.32], [a0, V1, b + H - 0.32]], "#c9923d", 3, 5);
  }
  // glowing Buddha shrine behind the central bays
  { const [x, y] = P(UC, V1, b + 0.7), g = 0.55 + 0.25 * Math.sin(t * 2.1), rg = c.createRadialGradient(x, y, 3, x, y, 46);
    rg.addColorStop(0, `rgba(255,224,130,${0.9 * g})`); rg.addColorStop(1, "rgba(255,200,90,0)"); c.fillStyle = rg; c.fillRect(x - 46, y - 46, 92, 92);
    c.fillStyle = "#f3d98a"; c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.ellipse(x, y + 17, 18, 8, 0, 0, 7); c.fill(); c.stroke();
    c.fillStyle = GOLD; c.beginPath(); c.moveTo(x - 13, y + 15); c.quadraticCurveTo(x - 15, y - 6, x, y - 8); c.quadraticCurveTo(x + 15, y - 6, x + 13, y + 15); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.arc(x, y - 15, 6.5, 0, 7); c.fill(); c.stroke(); c.fillStyle = "#4a2a1a"; c.beginPath(); c.arc(x, y - 18, 4.6, Math.PI, 0); c.fill();
    c.strokeStyle = "rgba(255,230,150,0.6)"; c.lineWidth = 1; c.beginPath(); c.arc(x, y - 4, 16, 0, Math.PI * 2); c.stroke();
    for (let i = 0; i < 5; i++) { c.fillStyle = ["#e8607a", "#f39ac0", "#f4c542"][i % 3]; c.beginPath(); c.arc(x - 22 + i * 11, y + 24, 2.4, 0, 7); c.fill(); } }
  for (let i = 0; i <= nL; i++) pillar(k, u + step * i, V1, b, b + H, 3.2);
  bracketsL(k, u, u + du, V1, b + H, 0.3);
  // skirt roof (big overhang)
  richRoof(k, u, v, b + H, du, dv, 0.8, { over: 0.35, lift: 0.5, ridgeIn: 0.65, rows: 9 });
  // upper storey with the temple plaque
  const uu = 4.2, uv = 2.05, udu = 2.8, udv = 1.0, ub = b + H + 0.8, UH = 0.8;
  body(k, uu, uv, ub, udu, udv, UH, { noL: true, nR: 2 });
  for (let i = 0; i < 6; i++) { if (i === 2 || i === 3) continue; const a0 = uu + (udu * (i + 0.12)) / 6, a1 = uu + (udu * (i + 0.88)) / 6, V = uv + udv; lattice(k, [[a0, V, ub + 0.16], [a1, V, ub + 0.16], [a1, V, ub + UH - 0.16], [a0, V, ub + UH - 0.16]], "#d9a84f", 2, 3); }
  for (let i = 0; i <= 6; i++) pillar(k, uu + (udu * i) / 6, uv + udv, ub, ub + UH, 2.4);
  { const V = uv + udv, a0 = UC - 0.46, a1 = UC + 0.46;
    k.poly([[a0, V, ub + 0.14], [a1, V, ub + 0.14], [a1, V, ub + UH - 0.12], [a0, V, ub + UH - 0.12]], "#2a120c", { lw: 1.2, wobble: 0 });
    k.line3([[a0, V, ub + 0.14], [a1, V, ub + 0.14], [a1, V, ub + UH - 0.12], [a0, V, ub + UH - 0.12], [a0, V, ub + 0.14]], { stroke: GOLD, lw: 1.4, wobble: 0 });
    const [x, y] = P(UC, V, ub + UH * 0.5 - 0.02); c.save(); c.transform(1, 0.577, 0, 1, x, y); c.fillStyle = GOLD_L; c.font = "bold 13px \"PingFang SC\",\"Heiti SC\",sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("静安寺", 0, 0); c.restore(); }
  bracketsL(k, uu, uu + udu, uv + udv, ub + UH, 0.2);
  richRoof(k, uu, uv, ub + UH, udu, udv, 0.95, { over: 0.45, lift: 0.5, ridgeIn: 0.36, rows: 7, finial: true });
  // hanging lanterns along the skirt eave, either side of the porch
  for (const a of [3.5, 3.95, 4.4, 6.8, 7.25, 7.7]) { const [x, y] = P(a, V1 + 0.36, b + H - 0.02); lantern(k, x, y, { s: 0.7, ph: a * 3 }); }
  // central porch: pillars + small hip roof
  const pv = 4.1;
  for (const a of [UC - 0.65, UC, UC + 0.65]) pillar(k, a, pv, b, b + 1.5, 3.4);
  k.line3([[UC - 0.7, pv, b + 1.5], [UC + 0.7, pv, b + 1.5]], { stroke: INK, lw: 5, wobble: 0 }); k.line3([[UC - 0.7, pv, b + 1.5], [UC + 0.7, pv, b + 1.5]], { stroke: RED_D, lw: 3, wobble: 0 });
  richRoof(k, UC - 0.65, 3.6, b + 1.5, 1.3, 0.5, 0.55, { over: 0.3, lift: 0.35, ridgeIn: 0.2, rows: 5, finial: true });
  // balustrade along the platform front (broken at the stairs) and the right edge
  const rail = (a0, a1, V, along = "u") => {
    const pt = (a, z) => (along === "u" ? [a, V, z] : [V, a, z]);
    k.line3([pt(a0, PZ + 0.32), pt(a1, PZ + 0.32)], { stroke: INK, lw: 4.4, wobble: 0 }); k.line3([pt(a0, PZ + 0.32), pt(a1, PZ + 0.32)], { stroke: "#f2ecd9", lw: 2.6, wobble: 0 });
    c.strokeStyle = "#f6f0de"; c.lineWidth = 2; c.beginPath();
    for (let a = a0; a <= a1 + 0.01; a += 0.16) { c.moveTo(...P(...pt(a, PZ))); c.lineTo(...P(...pt(a, PZ + 0.3))); }
    c.stroke();
    for (let a = a0; a <= a1 + 0.01; a += 0.8) { c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.moveTo(...P(...pt(a, PZ))); c.lineTo(...P(...pt(a, PZ + 0.4))); c.stroke(); c.strokeStyle = "#f2ecd9"; c.lineWidth = 3; c.stroke(); }
  };
  rail(3.0, UC - 1.0, 4.2); rail(UC + 1.0, 8.0, 4.2); rail(0.8, 4.2, 8.0, "v");
}

// stairs down from the platform (v 4.3 -> 5.3), steps as boxes
export function stairs(k) {
  const n = 5, u0 = HALL.UC - 0.8, du = 1.6;
  for (let j = n - 1; j >= 0; j--) {
    const v0 = 4.3 + 0.2 * (n - 1 - j), h = 0.1 * (j + 1);
    k.box(u0, v0, 0, du, 0.2, h, j % 2 ? "#ebe3cd" : "#f3ecda", { hatch: false, shadow: false });
    for (const ub of [u0 - 0.16, u0 + du]) k.box(ub, v0, 0, 0.16, 0.2, h + 0.28, "#ddd3b8", { hatch: false, shadow: false });
  }
  // carved ramp strip drawn as a thin slab down the middle
  k.line3([[u0 + du / 2, 4.32, 0.52], [u0 + du / 2, 5.3, 0.02]], { stroke: "rgba(120,95,55,0.6)", lw: 1.2, wobble: 0 });
}

// ---------- cloister wings ----------
export function wingLeft(k, t) {
  const u = 0.9, v = 4.9, du = 1.3, dv = 4.1;
  body(k, u, v, 0, du, dv, 1.3, { pl: 0.14, nR: 7, nL: 2 });
  richRoof(k, u, v, 1.44, du, dv, 0.85, { over: 0.34, lift: 0.4, ridgeIn: 0.4, rows: 9 });
  for (let i = 0; i < 6; i++) { const [x, y] = P(u + du + 0.34, v + 0.35 + i * 0.7, 1.4); lantern(k, x, y, { s: 0.7, ph: i * 1.3 }); }
}
export function wingRight(k, t) {
  const u = 8.55, v = 4.6, du = 0.75, dv = 4.0;
  body(k, u, v, 0, du, dv, 1.0, { pl: 0.14, nR: 7, nL: 2 });
  richRoof(k, u, v, 1.14, du, dv, 0.6, { over: 0.34, lift: 0.3, ridgeIn: 0.24, rows: 7 });
  for (let i = 0; i < 6; i++) { const [x, y] = P(u + du + 0.34, v + 0.4 + i * 0.55, 1.1); lantern(k, x, y, { s: 0.7, ph: i * 1.1 + 2 }); }
}

// ---------- seven-tier pagoda on a square plan in the back corner ----------
export const PAG = { c: 1.65 };
export function pagoda(k, t) {
  const c = k.ctx, C = PAG.c;
  k.box(C - 1.1, C - 1.1, 0, 2.2, 2.2, 0.4, STONE, { hatch: false, shadow: true });
  const N = 7;
  for (let i = 0; i < N; i++) {
    const w = 0.9 - 0.095 * i, z0 = 0.4 + i * 0.95, top = i === N - 1;
    body(k, C - w, C - w, z0, 2 * w, 2 * w, 0.7, { nL: 3, nR: 3, za: 0.18, zb: 0.82 });
    // little balcony rail round the wall foot
    k.line3([[C - w - 0.06, C + w + 0.06, z0 + 0.14], [C + w + 0.06, C + w + 0.06, z0 + 0.14], [C + w + 0.06, C - w - 0.06, z0 + 0.14]], { stroke: "#2a120c", lw: 2.2, wobble: 0 });
    richRoof(k, C - w, C - w, z0 + 0.7, 2 * w, 2 * w, top ? 0.55 : 0.25, { over: 0.32 - 0.01 * i, lift: 0.16, ridgeIn: top ? w - 0.02 : 0.1, rows: 3, finial: false });
    // eave bells
    for (const [a, b2] of [[C + w + 0.34, C + w + 0.34], [C - w - 0.34, C + w + 0.34], [C + w + 0.34, C - w - 0.34]]) { const [x, y] = P(a, b2, z0 + 0.7 + 0.14), sw = Math.sin(t * 3 + i * 1.3 + a) * 1.4; c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x, y); c.lineTo(x + sw * 0.3, y + 4); c.stroke(); c.fillStyle = GOLD; c.beginPath(); c.moveTo(x + sw - 1.8, y + 9); c.lineTo(x + sw * 0.3 - 0.8, y + 4); c.lineTo(x + sw * 0.3 + 0.8, y + 4); c.lineTo(x + sw + 1.8, y + 9); c.closePath(); c.fill(); c.lineWidth = 0.5; c.stroke(); }
  }
  // spire: pole, ringed discs, gourd, flame
  const zt = 0.4 + (N - 1) * 0.95 + 0.7 + 0.55;
  c.strokeStyle = INK; c.lineWidth = 4.2; c.lineCap = "round"; c.beginPath(); c.moveTo(...P(C, C, zt)); c.lineTo(...P(C, C, zt + 1.5)); c.stroke(); c.strokeStyle = GOLD; c.lineWidth = 2.4; c.stroke();
  for (let i = 0; i < 6; i++) k.cyl(C, C, zt + 0.15 + i * 0.16, 0.2 - i * 0.025, 0.07, GOLD, { topCol: GOLD_L });
  { const [x, y] = P(C, C, zt + 1.15); c.fillStyle = GOLD_L; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.arc(x, y, 4.4, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.moveTo(x - 3, y - 3); c.lineTo(x, y - 14); c.lineTo(x + 3, y - 3); c.fill(); c.stroke(); }
  const s = Math.max(0, Math.sin(t * 1.7)); if (s > 0.8) { const [x, y] = P(C, C, zt + 1.2); glint(c, x - 3, y, (s - 0.8) / 0.2 * 6 + 2, "#fff8d0"); }
}

// ---------- stone lion on a plinth ----------
export function lion(k, u, v, flip) {
  const c = k.ctx;
  k.box(u - 0.35, v - 0.35, 0, 0.7, 0.7, 0.55, "#d6cdb8", { hatch: false });
  const [x, y] = P(u, v, 0.55);
  c.fillStyle = "#e0d8c3"; c.strokeStyle = INK; c.lineWidth = 1.5;
  c.beginPath(); c.ellipse(x, y - 12, 11, 13, 0, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.ellipse(x - flip * 10, y - 4, 6, 9, 0, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.arc(x, y - 29, 9, 0, 7); c.fill(); c.stroke();
  c.fillStyle = "#cfc6af"; for (let i = 0; i < 7; i++) { const a = (i / 7) * 6.28; c.beginPath(); c.arc(x + Math.cos(a) * 10, y - 29 + Math.sin(a) * 9, 3.6, 0, 7); c.fill(); c.stroke(); }
  c.fillStyle = "#e0d8c3"; c.beginPath(); c.arc(x, y - 29, 7.6, 0, 7); c.fill();
  c.fillStyle = INK; c.fillRect(x - 4, y - 31, 2, 2); c.fillRect(x + 2, y - 31, 2, 2); c.fillRect(x - 2, y - 26, 4, 1.4);
  c.fillStyle = "#e0d8c3"; c.beginPath(); c.arc(x + flip * 12, y - 18, 4.2, 0, 7); c.fill(); c.stroke();
}
