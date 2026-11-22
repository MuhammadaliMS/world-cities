// helpers for Zhujiajiao (-1,1) and Century Park (-1,0)
import { P, CTS, INK, shade, mix, lerp, clamp, rng, hash, prism, rot, eaveRoof, lantern } from "./_props.js";
export { P, CTS, INK, shade, mix, lerp, clamp, rng, hash, prism, rot, eaveRoof, lantern };

// walker whose feet follow a height profile (bridges, ramps). zFn(u,v)
export function walkOn(k, path, o, zFn) {
  const s = k.walkerState(path, o);
  k.q(s.u + s.v + (o.bias ?? 0.05), () => {
    k.person(s.u, s.v, { ...o, dir: [s.du, s.dv], pose: s.moving ? "walk" : (o.idle || "stand"), p: s.p, z: zFn(s.u, s.v) });
  });
}

// whitewashed Jiangnan house: wood-lattice ground floor, white upper floor, grey tile roof, horse-head gable
export function house(k, u, v, du, dv, h, o = {}) {
  const c = k.ctx, WH = "#f3eee2";
  k.shadow([[u + du, v, 0], [u + du + h * 0.3, v + h * 0.1, 0], [u + du + h * 0.3, v + dv + h * 0.1, 0], [u + du, v + dv, 0]], 0.1);
  k.box(u, v, 0, du, dv, h * 0.48, "#9a6a42", { hatch: false, shadow: false, left: "#a97a50", right: "#7d5434" });
  k.box(u - 0.02, v - 0.02, h * 0.48, du + 0.04, dv + 0.04, h * 0.52, WH, { hatch: false, shadow: false, left: "#f6f2e8", right: "#d6cfbd" });
  // lattice windows (ground floor, glowing warm) + shuttered upper windows
  const lw = (side, run, n) => k.windows(u, v, 0, du, dv, h * 0.48, { rows: 1, cols: n, side, color: side === "L" ? "#d9a862" : "#b98a4e", mx: 0.12, my: 0.1, base: 0.08, w: 0.78, h: 0.8, lw: 0.9 });
  lw("L", du, Math.max(2, Math.round(du / 0.55))); lw("R", dv, Math.max(2, Math.round(dv / 0.55)));
  const uw = (side, n) => k.windows(u - 0.02, v - 0.02, h * 0.48, du + 0.04, dv + 0.04, h * 0.52, { rows: 1, cols: n, side, color: "#6a4a2e", mx: 0.25, my: 0.1, base: 0.12, w: 0.5, h: 0.62, lw: 0.9 });
  uw("L", Math.max(1, Math.round(du / 0.8))); uw("R", Math.max(1, Math.round(dv / 0.8)));
  // stepped horse-head gable on the right end
  const z0 = h, ug = u + du + 0.02;
  k.poly([[ug, v - 0.02, h * 0.48], [ug, v + dv + 0.02, h * 0.48], [ug, v + dv + 0.02, z0 + 0.15], [ug, v + dv * 0.7, z0 + 0.15], [ug, v + dv * 0.7, z0 + 0.38], [ug, v + dv * 0.42, z0 + 0.38], [ug, v + dv * 0.42, z0 + 0.6], [ug, v + dv * 0.18, z0 + 0.6], [ug, v + dv * 0.18, z0 + 0.8], [ug, v - 0.02, z0 + 0.8]], "#e2dccb", { lw: 1.2, wobble: 0 });
  k.line3([[ug, v + dv + 0.02, z0 + 0.15], [ug, v + dv * 0.7, z0 + 0.15], [ug, v + dv * 0.7, z0 + 0.38], [ug, v + dv * 0.42, z0 + 0.38], [ug, v + dv * 0.42, z0 + 0.6], [ug, v + dv * 0.18, z0 + 0.6], [ug, v + dv * 0.18, z0 + 0.8], [ug, v - 0.02, z0 + 0.8]], { stroke: "#3b3d42", lw: 2.2, wobble: 0 });
  eaveRoof(k, u - 0.05, v - 0.05, h, du + 0.1, dv + 0.1, o.roofH ?? 0.6, "#52555c", { over: 0.22, lift: 0.14, edge: "#2b2d33", ridgeIn: Math.min(du, dv) * 0.4, rows: 7 });
  // lanterns under the eaves
  const n = Math.round(du / 0.7);
  for (let i = 0; i < n; i++) { const [x, y] = P(u + 0.2 + (du - 0.3) * (i + 0.5) / n, v + dv + 0.2, h * 0.5); lantern(k, x, y, { s: 0.7, ph: i * 1.7 + u * 3 }); }
}

// bamboo-canopy sampan with a standing boatman who poles. ang = heading in uv
export function sampan(k, u, v, ang, o = {}) {
  const c = k.ctx, t = k.t, sc = o.s ?? 1, bob = Math.sin(t * 2 + (o.ph ?? 0)) * 0.02;
  const R = (pts) => rot(u, v, ang, pts.map(([x, y]) => [x * sc, y * sc]));
  k.ell(u, v, 0, 1.0 * sc, "rgba(15,60,60,0.2)", { stroke: false });
  prism(k, R([[-0.85, -0.2], [0.55, -0.27], [0.95, 0], [0.55, 0.27], [-0.85, 0.2]]), -0.05 + bob, 0.2 + bob, "#6a4a30", { topCol: "#9a7550", right: "#4c3322", left: "#7a5638", band: [0.55, 0.72], bandCol: o.stripe || "#b8342e" });
  // arched wupeng canopy: ribs + woven roof
  const ribs = [-0.35, -0.1, 0.15, 0.4];
  const arch = (x, y, f) => rot(u, v, ang, [[x * sc, y * sc * f]])[0];
  prism(k, R([[-0.45, -0.2], [0.5, -0.2], [0.5, 0.2], [-0.45, 0.2]]), 0.2 + bob, 0.34 + bob, "#8a6a46", { topCol: "#b08a58", top: false });
  prism(k, R([[-0.45, -0.17], [0.5, -0.17], [0.5, 0.17], [-0.45, 0.17]]), 0.34 + bob, 0.47 + bob, "#7a5c3c", { topCol: "#b99560" });
  prism(k, R([[-0.45, -0.1], [0.5, -0.1], [0.5, 0.1], [-0.45, 0.1]]), 0.47 + bob, 0.55 + bob, "#6e5236", { topCol: "#c9a56c" });
  c.strokeStyle = "rgba(60,38,20,0.7)"; c.lineWidth = 0.9; c.beginPath();
  for (const x of ribs) for (const [y, z] of [[-0.19, 0.22], [-0.17, 0.4], [0.17, 0.4], [0.19, 0.22]]) { const [pu, pv] = arch(x, y, 1); c.moveTo(...P(pu, pv, z + bob)); }
  c.stroke();
  // red stripe lantern at the bow
  const [lu, lv] = arch(0.75, 0, 1); const [lx, ly] = P(lu, lv, 0.3 + bob); lantern(k, lx, ly - 4, { s: 0.55, ph: o.ph ?? 0 });
  // boatman at the stern poling
  const [su, sv] = arch(-0.65, 0, 1);
  const sw = Math.sin(t * 1.4 + (o.ph ?? 0));
  const p = k.person(su, sv, { z: 0.2 + bob, seed: o.seed ?? 5, pose: "stand", dir: [Math.cos(ang), Math.sin(ang)], hat: "sunhat", hatCol: "#e9d9a0", style: "coat", shadow: false });
  // pole: from the hand down into the water behind the boat, push/recover cycle
  const hx = p.hand ? p.hand[0] : p.aR[0], hy = p.hand ? p.hand[1] : p.aR[1];
  const dx = -Math.cos(ang) * 0.5, dy = -Math.sin(ang) * 0.5, [bx, by] = P(su + Math.cos(ang) * (-0.35 + sw * 0.18), sv + Math.sin(ang) * (-0.35 + sw * 0.18) + (ang ? 0.25 : 0.25), 0);
  const [ex, ey] = P(su - Math.cos(ang) * (0.25 - sw * 0.2) + Math.sin(ang) * 0.3, sv - Math.sin(ang) * (0.25 - sw * 0.2) - Math.cos(ang) * 0.3, -0.25);
  c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 3.2; c.beginPath(); c.moveTo(hx, hy - 10); c.lineTo(ex, ey); c.stroke(); c.strokeStyle = "#caa86a"; c.lineWidth = 1.7; c.stroke();
  c.save(); c.globalAlpha = 0.6; c.strokeStyle = "#fff"; c.lineWidth = 1.2; c.beginPath(); c.ellipse(ex, ey, 5 + Math.abs(sw) * 3, 2.2, 0, 0, 7); c.stroke(); c.restore();
  return { z: 0.2 + bob, R };
}

// round-the-ends lane: returns pos+heading for a racetrack loop (cu,cv centre, half-length hl along axis 'v' or 'u', lane offset ro)
export function racetrack(cu, cv, hl, ro, d, axis = "v") {
  const r = ro, L = 2 * hl, tot = 2 * L + 2 * Math.PI * r, s = ((d % tot) + tot) % tot;
  let a, b, ang;
  if (s < L) { a = -hl + s; b = r; ang = 0; }
  else if (s < L + Math.PI * r) { const q = (s - L) / r; a = hl + Math.sin(q) * r; b = Math.cos(q) * r; ang = -q; }
  else if (s < 2 * L + Math.PI * r) { a = hl - (s - L - Math.PI * r); b = -r; ang = Math.PI; }
  else { const q = (s - 2 * L - Math.PI * r) / r; a = -hl - Math.sin(q) * r; b = -Math.cos(q) * r; ang = Math.PI - q; }
  // heading (a: forward axis, b: lateral) -> uv; axis v means forward is +v and lateral is +u
  if (axis === "v") return { u: cu + b, v: cv + a, ang: Math.PI / 2 - ang };
  return { u: cu + a, v: cv + b, ang: ang };
}

// small park rowboat with seated people + oar dip
export function rowboat(k, u, v, ang, o = {}) {
  const c = k.ctx, t = k.t, sc = o.s ?? 1, bob = Math.sin(t * 2.2 + (o.ph ?? 0)) * 0.02;
  const R = (pts) => rot(u, v, ang, pts.map(([x, y]) => [x * sc, y * sc]));
  k.ell(u, v, 0, 0.9 * sc, "rgba(15,60,60,0.2)", { stroke: false });
  prism(k, R([[-0.7, -0.3], [0.45, -0.34], [0.85, 0], [0.45, 0.34], [-0.7, 0.3]]), -0.05 + bob, 0.2 + bob, o.hull || "#c0894f", { topCol: "#e6c28a", right: "#8d6034", left: "#d09a5d", band: [0.55, 0.75], bandCol: "#f2ead2" });
  // oars
  const sw = Math.sin(t * 2.4 + (o.ph ?? 0));
  c.lineCap = "round";
  for (const s of [-1, 1]) { const [a1, b1] = rot(u, v, ang, [[0.05 * sc, s * 0.28 * sc]])[0], [a2, b2] = rot(u, v, ang, [[(0.05 + sw * 0.25) * sc, s * 0.95 * sc]])[0]; c.strokeStyle = INK; c.lineWidth = 2.8; c.beginPath(); c.moveTo(...P(a1, b1, 0.2)); c.lineTo(...P(a2, b2, -0.02)); c.stroke(); c.strokeStyle = "#e1c48f"; c.lineWidth = 1.3; c.stroke(); const [x, y] = P(a2, b2, 0); c.save(); c.globalAlpha = 0.6; c.strokeStyle = "#fff"; c.lineWidth = 1; c.beginPath(); c.ellipse(x, y, 5, 2, 0, 0, 7); c.stroke(); c.restore(); }
  return { z: 0.2 + bob, R };
}
