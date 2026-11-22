// Grid-pass helpers for Dubai -1,-1 (Burj Al Arab & Jumeirah Beach). Everything through P(), everything axis-aligned.
// Private to this tile; _props.js is untouched. The causeway runs along v at u = CU, from the island to the beach.
import { P, INK, shade, lerp, clamp, rng } from "../../lib/vec-kit.js";

export const PAVE = "#efd6a3";
export const CU = 6.6, HW = 0.7;                // causeway centre line (u) and half width
export const V_ISL = 3.7, V_SHORE = 6.6;        // island edge, shoreline
export const V_FLAT = 6.45, V_END = 7.0;        // deck level until V_FLAT, then ramps down to the sand at V_END
export const Z_DECK = 0.5;
export const zDeck = (v) => (v <= V_FLAT ? Z_DECK : v >= V_END ? 0.03 : lerp(Z_DECK, 0.03, (v - V_FLAT) / (V_END - V_FLAT)));
const THK = 0.2;

const tr = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };

// low stone kerb round the three sea edges so the water reads as sunk below the promenade
export function seaKerbs(k) {
  const o = { hatch: false, shadow: false, left: "#e6d0a2", right: "#cdb585", top: "#f3e3bd" };
  k.box(0, 0, 0, 10, 0.3, 0.13, PAVE, o);
  k.box(0, 0.3, 0, 0.3, V_SHORE - 0.3, 0.13, PAVE, o);
  k.box(9.7, 0.3, 0, 0.3, V_SHORE - 0.3, 0.13, PAVE, o);
}

// one segment of the causeway deck (v0 -> v1), drawn back to front
export function deckSeg(k, v0, v1, t, o = {}) {
  const c = k.ctx, za = zDeck(v0), zb = zDeck(v1), u0 = CU - HW, u1 = CU + HW;
  const inWater = v1 < V_SHORE + 0.1;
  if (inWater) { // deck shadow on the sea
    k.poly([[u0 + 0.22, v0 + 0.1, 0], [u1 + 0.22, v0 + 0.1, 0], [u1 + 0.22, v1 + 0.1, 0], [u0 + 0.22, v1 + 0.1, 0]], "rgba(10,70,90,0.22)", { stroke: false });
  } else k.poly([[u0 + 0.12, v0 + 0.06, 0], [u1 + 0.12, v0 + 0.06, 0], [u1 + 0.12, v1 + 0.06, 0], [u0 + 0.12, v1 + 0.06, 0]], "rgba(80,60,30,0.14)", { stroke: false });
  // visible side faces: the +u edge, and the near end when the deck steps down
  k.poly([[u1, v0, za], [u1, v1, zb], [u1, v1, zb - THK], [u1, v0, za - THK]], "#cdbf9f", { lw: 1, wobble: 0 });
  // deck top
  k.poly([[u0, v0, za], [u1, v0, za], [u1, v1, zb], [u0, v1, zb]], "#e9dcc0", { lw: 0.9, wobble: 0 });
  // pavement tint on the two footways, lane marks
  for (const sd of [-1, 1]) k.poly([[CU + sd * 0.42, v0, za], [CU + sd * HW, v0, za], [CU + sd * HW, v1, zb], [CU + sd * 0.42, v1, zb]], "#e0cfa9", { stroke: false });
  c.strokeStyle = "rgba(255,255,255,0.75)"; c.lineWidth = 1; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(...P(CU, v0, za)); c.lineTo(...P(CU, v1, zb)); c.stroke(); c.setLineDash([]);
  c.strokeStyle = "rgba(150,125,85,0.7)"; c.lineWidth = 1.1; c.beginPath();
  for (const sd of [-0.42, 0.42]) { c.moveTo(...P(CU + sd, v0, za)); c.lineTo(...P(CU + sd, v1, zb)); }
  c.stroke();
}

// balustrade on one side: top rail, posts, balusters. side = -1 (far, -u) or +1 (near, +u)
export function rail(k, side, v0, v1) {
  const c = k.ctx, u = CU + side * (HW - 0.04), za = zDeck(v0), zb = zDeck(v1), rz = 0.3;
  c.lineCap = "round";
  c.strokeStyle = INK; c.lineWidth = 0.6; c.beginPath();
  const n = 3; for (let i = 0; i < n; i++) { const f = (i + 0.5) / n, v = lerp(v0, v1, f), z = lerp(za, zb, f); c.moveTo(...P(u, v, z)); c.lineTo(...P(u, v, z + rz)); }
  c.stroke();
  c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.moveTo(...P(u, v0, za + rz)); c.lineTo(...P(u, v1, zb + rz)); c.stroke();
  c.strokeStyle = side > 0 ? "#f3ead6" : "#d8cdb4"; c.lineWidth = 1.8; c.stroke();
  c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(...P(u, v0, za)); c.lineTo(...P(u, v0, za + rz + 0.04)); c.stroke();
  c.strokeStyle = "#e6dcc3"; c.lineWidth = 1.4; c.stroke();
}

export function pier(k, u, v, zTop, t) {
  const c = k.ctx;
  k.box(u - 0.14, v - 0.14, 0, 0.28, 0.28, zTop, "#d9ceb8", { hatch: false, shadow: false });
  const [px, py] = P(u, v, 0); c.strokeStyle = `rgba(255,255,255,${0.6 + 0.2 * Math.sin(t * 2 + u * 3 + v)})`; c.lineWidth = 1.2; c.beginPath(); c.ellipse(px + 3, py + 1, 12, 4, 0, 0, 6.3); c.stroke();
}

// paved forecourt where the causeway lands on the beach
export function apron(k) {
  const c = k.ctx;
  k.poly([[CU - HW - 0.3, V_END - 0.05, 0], [CU + HW + 0.3, V_END - 0.05, 0], [CU + HW + 0.3, 7.8, 0], [CU - HW - 0.3, 7.8, 0]], "#e5d2a6", { lw: 1.1, wobble: 0 });
  c.strokeStyle = "rgba(150,120,80,0.28)"; c.lineWidth = 0.7; c.beginPath();
  for (let u = CU - HW - 0.3; u <= CU + HW + 0.31; u += 0.25) { c.moveTo(...P(u, V_END, 0)); c.lineTo(...P(u, 7.8, 0)); }
  for (let v = V_END; v <= 7.81; v += 0.25) { c.moveTo(...P(CU - HW - 0.3, v, 0)); c.lineTo(...P(CU + HW + 0.3, v, 0)); }
  c.stroke();
}

// promenade strip along the front rim of the beach with joints
export function promenade(k) {
  const c = k.ctx;
  k.poly([[0.3, 9.2, 0], [9.7, 9.2, 0], [9.7, 9.7, 0], [0.3, 9.7, 0]], "#e8d8b4", { lw: 1.1, wobble: 0 });
  c.strokeStyle = "rgba(150,120,80,0.3)"; c.lineWidth = 0.7; c.beginPath();
  for (let u = 0.3; u <= 9.71; u += 0.4) { c.moveTo(...P(u, 9.2, 0)); c.lineTo(...P(u, 9.7, 0)); }
  c.moveTo(...P(0.3, 9.45, 0)); c.lineTo(...P(9.7, 9.45, 0)); c.stroke();
}

// beach sand: gradient + grain + dry ripples along u, all confined to the footprint
export function sand(k) {
  const c = k.ctx;
  const q = [P(0.3, V_SHORE, 0), P(9.7, V_SHORE, 0), P(9.7, 9.7, 0), P(0.3, 9.7, 0)];
  tr(c, q); const g = c.createLinearGradient(...P(5, V_SHORE, 0), ...P(5, 9.7, 0)); g.addColorStop(0, "#f1dcad"); g.addColorStop(0.5, "#efd6a3"); g.addColorStop(1, "#e7c88d"); c.fillStyle = g; c.fill();
  c.save(); tr(c, q); c.clip();
  const R = rng(5); c.fillStyle = "rgba(190,150,90,0.24)";
  for (let i = 0; i < 520; i++) { const [x, y] = P(lerp(0.3, 9.7, R()), lerp(V_SHORE, 9.7, R()), 0); c.fillRect(x, y, 1.6, 1); }
  c.strokeStyle = "rgba(190,150,90,0.2)"; c.lineWidth = 1;
  for (let i = 0; i < 46; i++) { const u = lerp(0.6, 9.3, R()), v = lerp(7.2, 9.1, R()), [x, y] = P(u, v, 0), [x2, y2] = P(u + 0.6, v, 0); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo((x + x2) / 2, (y + y2) / 2 - 2, x2, y2); c.stroke(); }
  c.restore();
}
