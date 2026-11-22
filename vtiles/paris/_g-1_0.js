// Grid helpers for paris -1,0 (Canal Saint-Martin). Copied/adapted from the earlier pass: everything goes through P(u, v, z)
// and every wall runs along u or v. Pure functions of t.
import { P, INK, shade, lerp, clamp, rng, hash } from "../../lib/vec-kit.js";
import { plane } from "./_props.js";

export const WZ = -0.55;
export const GREEN = "#2f5a45", GREENL = "#5f8f72";
export const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const dist2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// ---------- generic prism: a polygon (u,v) extruded between z0 and z1, only the faces that face the camera ----------
export function prism(k, poly, z0, z1, col, o = {}) {
  let area = 0; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; area += a[0] * b[1] - b[0] * a[1]; }
  const sg = area >= 0 ? 1 : -1, edges = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], du = b[0] - a[0], dv = b[1] - a[1], L = Math.hypot(du, dv) || 1;
    const nu = (sg * dv) / L, nv = (-sg * du) / L;
    if (nu + nv > 0.02) edges.push({ a, b, nu, nv, L, q: (a[0] + b[0] + a[1] + b[1]) / 2 });
  }
  edges.sort((x, y) => x.q - y.q);
  for (const e of edges) {
    const tt = clamp(((e.nu - e.nv) / Math.SQRT2 + 0.707) / 1.414);
    e.col = o.sideCol ? o.sideCol(tt, e) : shade(col, -0.05 - 0.17 * tt);
    k.path([P(e.a[0], e.a[1], z0), P(e.b[0], e.b[1], z0), P(e.b[0], e.b[1], z1), P(e.a[0], e.a[1], z1)], { fill: e.col, lw: o.lw ?? 1.1, wobble: 0 });
    if (o.edge) o.edge(e);
  }
  if (o.top !== false) k.path(poly.map(([u, v]) => P(u, v, z1)), { fill: o.topCol || shade(col, 0.06), lw: o.lw ?? 1.1, wobble: 0 });
  return edges;
}

// ---------- plane tree (mottled trunk, lush lobed canopy), trunk at (u,v) ----------
const LEAF = ["#c4c45a", "#a9b94c", "#b8c056", "#94ab48", "#cfcb62"];
export function planeTree(k, t, u, v, o) {
  const c = k.ctx, R = o.R * 0.8, seed = o.seed, [bx, by] = P(u, v, 0), [cx0, cy0] = P(u + (o.du || 0), v + (o.dv || 0), o.h);
  const rnd = rng(seed * 13 + 5);
  k.ell(u + 0.3, v + 0.15, 0, R / 110, "rgba(60,45,30,0.12)", { stroke: false });
  c.fillStyle = "#8b7a63"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.ellipse(bx, by + 1, 26, 10, 0, 0, 7); c.fill(); c.stroke();
  c.fillStyle = "#6e6050"; c.beginPath(); c.ellipse(bx, by, 19, 7, 0, 0, 7); c.fill();
  const tw0 = o.tw || 9, tw1 = tw0 * 0.62, ty = cy0 + R * 0.45, bend = o.bend || 0;
  const trunk = (w0, w1, col, dx = 0) => { c.fillStyle = col; c.beginPath(); c.moveTo(bx - w0, by); c.quadraticCurveTo(bx - w0 * 0.8 + bend * 0.5, (by + ty) / 2, bx - w1 + bend + dx, ty); c.lineTo(bx + w1 + bend + dx, ty); c.quadraticCurveTo(bx + w0 * 0.8 + bend * 0.5, (by + ty) / 2, bx + w0, by); c.closePath(); };
  trunk(tw0 + 1.6, tw1 + 1.6, INK); c.fill();
  trunk(tw0, tw1, "#d6cfae"); c.fill();
  c.save(); trunk(tw0, tw1, "#d6cfae"); c.clip();
  for (let i = 0; i < 26; i++) { const f = rnd(), yy = lerp(by, ty, f), xx = bx + (rnd() - 0.5) * tw0 * 1.5 + bend * f; c.fillStyle = i % 3 ? "#9c7a3e" : "#b8944f"; c.beginPath(); c.ellipse(xx, yy, 2 + rnd() * 3.4, 2 + rnd() * 4.6, rnd() * 3, 0, 7); c.fill(); }
  c.fillStyle = "rgba(60,40,20,0.28)"; c.fillRect(bx + tw1 * 0.15, by - 260, tw0, 260);
  c.restore();
  c.lineCap = "round";
  for (const [w, col] of [[6.2, INK], [3.8, "#c2b68f"]]) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(bx + bend, ty + 6); c.lineTo(cx0 - R * 0.42, cy0 - R * 0.05); c.moveTo(bx + bend, ty + 6); c.lineTo(cx0 + R * 0.4, cy0 - R * 0.1); c.moveTo(bx + bend, ty + 2); c.lineTo(cx0, cy0 - R * 0.35); c.stroke(); }
  const N = o.lobes || 24, L = [];
  for (let i = 0; i < N; i++) {
    const a = rnd() * 6.283, d = Math.sqrt(rnd()) * 0.88, s = 0.27 + rnd() * 0.2;
    L.push({ dx: Math.cos(a) * d * (o.wide || 1.0), dy: Math.sin(a) * d * 0.82 - 0.04, s, i });
  }
  L.sort((a, b) => a.dy - b.dy);
  L.forEach((l) => {
    const sway = (Math.sin(t * 1.1 + seed + l.i * 0.7) * 1.7 + Math.sin(t * 2.3 + seed * 2 + l.i) * 0.5) * (0.6 - l.dy) * 0.8;
    const col = LEAF[(l.i + seed) % LEAF.length];
    k._lobe(cx0 + l.dx * R + sway, cy0 + l.dy * R, R * l.s, shade(col, -(l.dx + l.dy) * 0.07), seed * 17 + l.i, { bumps: 9, lw: 0.55 });
  });
  c.fillStyle = "rgba(255,248,170,0.25)";
  for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(cx0 - R * 0.3 + rnd() * R * 0.5, cy0 - R * (0.2 + rnd() * 0.4), R * 0.12, 0, 7); c.fill(); }
}

// ---------- building bits ----------
export function chimneyStack(k, u, v, z0, h = 0.95, w = 0.42) {
  k.box(u, v, z0, w, w, h, "#e0cfa6", { hatch: false, shadow: false });
  k.box(u - 0.03, v - 0.03, z0 + h, w + 0.06, w + 0.06, 0.07, "#cdb98c", { hatch: false, shadow: false });
  const c = k.ctx;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
    const [x, y] = P(u + 0.05 + i * 0.1, v + 0.08 + j * 0.2, z0 + h + 0.07);
    c.fillStyle = "#c8643a"; c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.rect(x - 2.4, y - 7, 4.8, 7); c.fill(); c.stroke();
    c.fillStyle = "#e08a58"; c.beginPath(); c.ellipse(x, y - 7, 2.6, 1.2, 0, 0, 7); c.fill(); c.stroke();
  }
}
// striped awning on a face. side 'L' (face at v=c, runs along u, projects +v) or 'R' (face at u=c, runs along v, projects +u)
export function awningG(k, t, side, c0, s0, len, c1, c2, z, depth, seed = 0) {
  const n = Math.round(len / 0.2), c = k.ctx, sway = Math.sin(t * 1.4 + seed) * 0.012;
  const A = (s, d, zz) => (side === "L" ? [s, c0 + d, zz] : [c0 + d, s, zz]);
  for (let i = 0; i < n; i++) {
    const a = s0 + (len * i) / n, b = s0 + (len * (i + 1)) / n, col = i % 2 ? c2 : c1;
    k.poly([A(a, 0, z), A(b, 0, z), A(b, depth + sway, z - 0.45), A(a, depth + sway, z - 0.45)], col, { lw: 0.9, wobble: 0 });
    const [x0, y0] = P(...A(a, depth + sway, z - 0.45)), [x1, y1] = P(...A(b, depth + sway, z - 0.45));
    c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 9, x1, y1); c.closePath(); c.fill(); c.stroke();
  }
}
export function shopFrontG(k, t, side, c0, s0, s1, o) {
  const c = k.ctx, Q = (s, z) => (side === "L" ? P(s, c0 + 0.001, z) : P(c0 + 0.001, s, z));
  k.path([Q(s0, 0), Q(s1, 0), Q(s1, 2.15), Q(s0, 2.15)], { fill: o.frame, lw: 1.3, wobble: 0 });
  const n = Math.max(2, Math.round((s1 - s0) / 0.9)), w = (s1 - s0) / n;
  for (let i = 0; i < n; i++) {
    const a = s0 + i * w + 0.07, b = s0 + (i + 1) * w - 0.07;
    k.path([Q(a, 0.22), Q(b, 0.22), Q(b, 1.85), Q(a, 1.85)], { fill: o.glass, lw: 1, wobble: 0 });
    const g = c.createLinearGradient(...Q(a, 0.2), ...Q(a, 1.85)); g.addColorStop(0, "rgba(255,225,140,0.55)"); g.addColorStop(1, "rgba(255,225,140,0.05)");
    c.fillStyle = g; c.beginPath(); [Q(a, 0.22), Q(b, 0.22), Q(b, 1.85), Q(a, 1.85)].forEach((p, j) => (j ? c.lineTo(...p) : c.moveTo(...p))); c.fill();
    c.strokeStyle = "rgba(60,35,15,0.7)"; c.lineWidth = 1; c.beginPath(); for (const zz of [0.7, 1.2]) { c.moveTo(...Q(a, zz)); c.lineTo(...Q(b, zz)); } c.moveTo(...Q((a + b) / 2, 0.22)); c.lineTo(...Q((a + b) / 2, 1.85)); c.stroke();
    for (const zz of [0.7, 1.2, 0.22]) for (let m = 0; m < 4; m++) { const [x, y] = Q(lerp(a + 0.08, b - 0.08, (m + 0.5) / 4), zz + 0.08); c.fillStyle = o.goods[(i + m) % o.goods.length]; c.strokeStyle = INK; c.lineWidth = 0.6; c.beginPath(); c.ellipse(x, y - 1, 4.2, 2.6, 0, 0, 7); c.fill(); c.stroke(); }
  }
  k.path([Q(s0, 1.9), Q(s1, 1.9), Q(s1, 2.15), Q(s0, 2.15)], { fill: o.sign, lw: 1, wobble: 0 });
  const [sx, sy] = Q((s0 + s1) / 2, 2.0);
  c.save(); c.translate(sx, sy); c.transform(1, side === "L" ? 0.577 : -0.577, 0, 1, 0, 0); c.fillStyle = o.signText; c.font = "bold 9px Georgia, serif"; c.textAlign = "center"; c.fillText(o.text, 0, 3); c.restore();
}
export function ivyG(k, side, c0, s, z0, z1, seed) {
  const c = k.ctx, R = rng(seed);
  for (let i = 0; i < 26; i++) { const ss = s + (R() - 0.5) * 0.5, [x, y] = side === "L" ? P(ss, c0, lerp(z0, z1, R())) : P(c0, ss, lerp(z0, z1, R())); c.fillStyle = ["#4f8a46", "#6fa04e", "#3d7340"][i % 3]; c.strokeStyle = INK; c.lineWidth = 0.5; c.beginPath(); c.arc(x, y, 3 + R() * 2.2, 0, 7); c.fill(); c.stroke(); }
}
export function flowerBoxes(k, side, c0, s0, s1, z, bay = 0.66) {
  const c = k.ctx, n = Math.round((s1 - s0) / bay);
  for (let i = 0; i < n; i++) {
    const s = s0 + ((i + 0.5) * (s1 - s0)) / n, [x, y] = side === "L" ? P(s, c0 + 0.1, z) : P(c0 + 0.1, s, z);
    c.fillStyle = "#7a5a3a"; c.strokeStyle = INK; c.lineWidth = 0.7; c.fillRect(x - 6, y - 2, 12, 4); c.strokeRect(x - 6, y - 2, 12, 4);
    for (let j = 0; j < 5; j++) { c.fillStyle = ["#e8607a", "#f4c542", "#f39ac0", "#fff", "#e8607a"][(j + i) % 5]; c.beginPath(); c.arc(x - 4.4 + j * 2.2, y - 3.6, 1.8, 0, 7); c.fill(); }
  }
}

// ---------- canal masonry ----------
export function bankWall(k, line, col, z0 = 0, z1 = WZ) {
  const c = k.ctx;
  k.path([...line.map(([u, v]) => P(u, v, z0)), ...[...line].reverse().map(([u, v]) => P(u, v, z1))], { fill: col, lw: 1.2, wobble: 0 });
  c.strokeStyle = "rgba(90,65,35,0.32)"; c.lineWidth = 0.7; c.beginPath();
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i], b = line[i + 1], L = dist2(a, b), n = Math.max(1, Math.round(L / 0.42));
    for (let j = 0; j <= n; j++) { const f = j / n, u = lerp(a[0], b[0], f), v = lerp(a[1], b[1], f); c.moveTo(...P(u, v, z0)); c.lineTo(...P(u, v, z1)); }
  }
  for (const zm of [(z0 + z1) / 2, (z0 * 2 + z1) / 3]) { c.moveTo(...P(...line[0], zm)); line.forEach(([u, v]) => c.lineTo(...P(u, v, zm))); }
  c.stroke();
}
export function coping(k, line, col = "#eadcb8") {
  const c = k.ctx; c.strokeStyle = INK; c.lineWidth = 7; c.lineCap = "round"; c.lineJoin = "round"; c.beginPath(); line.forEach(([u, v], i) => (i ? c.lineTo(...P(u, v, 0)) : c.moveTo(...P(u, v, 0)))); c.stroke();
  c.strokeStyle = col; c.lineWidth = 4.6; c.stroke();
}
export function waterTexture(k, t, poly, z, seed, flowDir = [0.0, 1]) {
  const c = k.ctx, P2 = poly.map(([u, v]) => P(u, v, z));
  let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; for (const [u, v] of poly) { u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
  c.save(); k._trace(P2, true, 0); c.clip();
  const g = c.createLinearGradient(...P(u0, v0, z), ...P(u1, v1, z)); g.addColorStop(0, "#4a9490"); g.addColorStop(0.5, "#56a09b"); g.addColorStop(1, "#3c8784");
  c.fillStyle = g; c.fill();
  const R = rng(seed), area = (u1 - u0) * (v1 - v0);
  for (let i = 0; i < Math.round(area * 11); i++) {
    const u = lerp(u0, u1, R()), v = lerp(v0, v1, R()), dr = (t * 0.06 * (0.5 + R()) + R() * 10) % 1.0, [x, y] = P(u + flowDir[0] * dr * 0.2, clamp(v + flowDir[1] * dr * 0.3, v0, v1), z);
    const k2 = i % 4;
    c.fillStyle = k2 === 0 ? "rgba(240,208,110,0.5)" : k2 === 1 ? "rgba(170,200,90,0.46)" : k2 === 2 ? "rgba(24,86,80,0.42)" : "rgba(214,226,150,0.38)";
    c.beginPath(); c.ellipse(x, y, 7 + R() * 11, 2.2 + R() * 1.8, 0, 0, 7); c.fill();
  }
  c.strokeStyle = "rgba(255,255,255,0.7)"; c.lineWidth = 1.2; c.lineCap = "round";
  for (let i = 0; i < Math.round(area * 8); i++) {
    const u = lerp(u0, u1, R()), v = lerp(v0, v1, R()), ph = R() * 6.28, a = 0.5 + 0.5 * Math.sin(t * 1.5 + ph), [x, y] = P(u, v, z);
    c.globalAlpha = a * 0.7; c.beginPath(); c.moveTo(x - 5, y); c.quadraticCurveTo(x - 2.5, y - 1.8, x, y); c.quadraticCurveTo(x + 2.5, y + 1.8, x + 5, y); c.stroke();
  }
  c.globalAlpha = 1; c.restore();
}
export function cobbleField(k, poly, n, seed) {
  const c = k.ctx, R = rng(seed), P2 = poly.map(([u, v]) => P(u, v, 0));
  let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; for (const [u, v] of poly) { u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
  c.save(); k._trace(P2, true, 0); c.clip();
  const cols = ["#cdb396", "#e6d5bd", "#d8c1a4", "#bfa68b", "#ecdcc6"];
  for (let i = 0; i < n; i++) { const [x, y] = P(lerp(u0, u1, R()), lerp(v0, v1, R()), 0); c.fillStyle = cols[i % 5]; c.strokeStyle = "rgba(100,72,48,0.38)"; c.lineWidth = 0.6; c.beginPath(); c.ellipse(x, y, 3.2 + R() * 2, 1.7 + R() * 0.9, 0, 0, 7); c.fill(); c.stroke(); }
  c.restore();
}

// ---------- lock ----------
export function windlass(k, t, x, y, gate) {
  const c = k.ctx;
  c.strokeStyle = INK; c.lineWidth = 4.2; c.lineCap = "round"; c.beginPath(); c.moveTo(x - 8, y); c.lineTo(x - 5, y - 18); c.moveTo(x + 8, y); c.lineTo(x + 5, y - 18); c.stroke(); c.strokeStyle = "#4a4237"; c.lineWidth = 2.4; c.stroke();
  const rot = gate * 11 + (gate > 0.02 && gate < 0.98 ? t * 0.8 : 0), cy = y - 30;
  c.save(); c.translate(x, cy);
  c.strokeStyle = INK; c.lineWidth = 3.6; c.beginPath(); c.ellipse(0, 0, 18, 18, 0, 0, 7); c.stroke(); c.strokeStyle = "#4a4237"; c.lineWidth = 2; c.stroke();
  for (let i = 0; i < 8; i++) { const a = rot + (i * Math.PI) / 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 18, Math.sin(a) * 18); c.strokeStyle = INK; c.lineWidth = 2.6; c.stroke(); c.strokeStyle = "#4a4237"; c.lineWidth = 1.2; c.stroke(); }
  c.fillStyle = "#7a6a52"; c.beginPath(); c.arc(0, 0, 3, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  c.restore();
}
// one mitre gate leaf: hinge (hu,hv), swings by angle a (radians from +u towards +v), mirrored for the right leaf
export function gateLeaf(k, hu, hv, a, mirror, len, z0, z1) {
  const dU = (mirror ? -1 : 1) * Math.cos(a), dV = Math.sin(a), th = 0.09;
  const tu = hu + dU * len, tv = hv + dV * len, nu = -dV * th, nv = dU * th;
  const poly = [[hu + nu, hv + nv], [tu + nu, tv + nv], [tu - nu, tv - nv], [hu - nu, hv - nv]];
  prism(k, poly, z0, z1, "#6a4a2e", {
    topCol: "#7a5a38", edge: (e) => {
      const c = k.ctx; c.strokeStyle = "rgba(25,14,6,0.7)"; c.lineWidth = 0.9; c.beginPath();
      for (let i = 1; i < 6; i++) { const f = i / 6, uu = lerp(e.a[0], e.b[0], f), vv = lerp(e.a[1], e.b[1], f); c.moveTo(...P(uu, vv, z0 + 0.05)); c.lineTo(...P(uu, vv, z1 - 0.03)); }
      c.stroke();
      c.strokeStyle = "#2a2a2a"; c.lineWidth = 2; c.beginPath(); for (const zz of [z0 + 0.35, z1 - 0.25]) { c.moveTo(...P(e.a[0], e.a[1], zz)); c.lineTo(...P(e.b[0], e.b[1], zz)); } c.stroke();
    },
  });
  // balance beam: from the tip over the hinge to a counterweight on the bank side
  const bu = hu - dU * 0.7, bv = hv - dV * 0.7, c = k.ctx;
  c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 4.2; c.beginPath(); c.moveTo(...P(tu, tv, z1 + 0.04)); c.lineTo(...P(bu, bv, z1 + 0.04)); c.stroke(); c.strokeStyle = "#31363a"; c.lineWidth = 2.3; c.stroke();
}
export function ironRail(k, pts, h = 0.6) {
  const c = k.ctx; c.lineCap = "round"; c.lineJoin = "round";
  c.strokeStyle = INK; c.lineWidth = 3.2; c.beginPath(); pts.forEach(([u, v], i) => (i ? c.lineTo(...P(u, v, h)) : c.moveTo(...P(u, v, h)))); c.stroke(); c.strokeStyle = GREEN; c.lineWidth = 1.6; c.stroke();
  c.lineWidth = 0.9; c.strokeStyle = "#233d30"; c.beginPath();
  for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], n = Math.max(1, Math.round(dist2(a, b) / 0.2)); for (let j = 0; j <= n; j++) { const f = j / n, u = lerp(a[0], b[0], f), v = lerp(a[1], b[1], f); c.moveTo(...P(u, v, 0)); c.lineTo(...P(u, v, h)); } }
  c.stroke();
}
// white foam bubbles over a strip on the water (u0..u1 at v, spilling in +/-v)
export function foam(k, t, u0, u1, v, z, amp, seed = 1) {
  const c = k.ctx;
  for (let i = 0; i < 26; i++) {
    const ph = (t * 0.9 + i / 26) % 1, u = lerp(u0, u1, hash(i * 2.7 + seed)), vv = v - 0.05 - ph * 0.55 - hash(i * 5.1 + seed) * 0.12, [x, y] = P(u + Math.sin(t * 3 + i) * 0.03, vv, z);
    c.fillStyle = `rgba(255,255,255,${(0.8 - 0.55 * ph) * amp})`; c.beginPath(); c.arc(x, y, 1.8 + (1 - ph) * 3.2, 0, 7); c.fill();
  }
}

// ---------- iron footbridge along u, deck centred on v = vb, ends A.u -> B.u ----------
export function makeBridge(A, B, o) {
  const zE = o.zE, zH = o.zH, w = o.w ?? 0.34, dx = B[0] - A[0];
  const U = (f, s) => [A[0] + dx * f, A[1] + s * w];
  const zd = (f) => zE + zH * (1 - (2 * f - 1) ** 2);
  const th = (f) => 0.42 + 0.42 * (2 * f - 1) ** 2;
  const N = 28, fs = Array.from({ length: N + 1 }, (_, i) => i / N);
  const pt = (f, s, z) => P(...U(f, s), z);
  const SL = 0.82; // stair run
  const rail = (s, front) => (k) => {
    const c = k.ctx; c.lineCap = "round"; c.lineJoin = "round";
    const T = (i) => pt(fs[i], s, zd(fs[i]) + 0.72), M = (i) => pt(fs[i], s, zd(fs[i]) + 0.34), B = (i) => pt(fs[i], s, zd(fs[i]));
    for (const [fn, wd, col] of [[T, 3.6, GREEN], [M, 1.8, GREEN]]) {
      c.strokeStyle = INK; c.lineWidth = wd + 1.8; c.beginPath(); for (let i = 0; i <= N; i++) { const p = fn(i); i ? c.lineTo(...p) : c.moveTo(...p); } c.stroke();
      c.strokeStyle = col; c.lineWidth = wd; c.beginPath(); for (let i = 0; i <= N; i++) { const p = fn(i); i ? c.lineTo(...p) : c.moveTo(...p); } c.stroke();
    }
    c.strokeStyle = front ? "#2c5842" : "#244737"; c.lineWidth = 1.15; c.beginPath();
    for (let i = 0; i < N; i++) { c.moveTo(...B(i)); c.lineTo(...T(i + 1)); c.moveTo(...T(i)); c.lineTo(...B(i + 1)); }
    c.stroke();
    c.strokeStyle = front ? GREENL : "#3c6b55"; c.lineWidth = 0.8; c.beginPath();
    for (let i = 0; i < N; i += 2) { c.moveTo(...B(i)); c.lineTo(...T(i)); const b0 = B(i), b1 = B(i + 1), x = (b0[0] + b1[0]) / 2, y = (b0[1] + b1[1]) / 2 - 8; c.moveTo(x + 2.4, y); c.arc(x, y, 2.4, 0, 7); }
    c.stroke();
    if (front) for (const f of [0, 1]) { const [gx, gy] = pt(f, s, zd(f) + 0.72); c.fillStyle = INK; c.fillRect(gx - 1.2, gy - 13, 2.4, 13); c.fillStyle = "#f6e4a0"; c.beginPath(); c.arc(gx, gy - 16, 3.3, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke(); }
  };
  const deck = (k) => {
    const c = k.ctx;
    const dpts = [...fs.map((f) => pt(f, -1, zd(f))), ...[...fs].reverse().map((f) => pt(f, 1, zd(f)))];
    c.beginPath(); dpts.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.fillStyle = "#cdbb92"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
    c.strokeStyle = "rgba(90,65,35,0.42)"; c.lineWidth = 0.8; c.beginPath(); for (let i = 1; i < 36; i++) { const f = i / 36; c.moveTo(...pt(f, -1, zd(f))); c.lineTo(...pt(f, 1, zd(f))); } c.stroke();
  };
  const girder = (k) => {
    const c = k.ctx, s = 1;
    c.beginPath(); fs.forEach((f, i) => (i ? c.lineTo(...pt(f, s, zd(f))) : c.moveTo(...pt(f, s, zd(f))))); [...fs].reverse().forEach((f) => c.lineTo(...pt(f, s, zd(f) - th(f)))); c.closePath();
    c.fillStyle = "#33604a"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
    c.strokeStyle = GREENL; c.lineWidth = 1; c.beginPath(); fs.forEach((f, i) => (i ? c.lineTo(...pt(f, s, zd(f) - 0.07)) : c.moveTo(...pt(f, s, zd(f) - 0.07)))); c.stroke();
    for (let i = 1; i < 14; i++) {
      const f = i / 14, zc = zd(f) - th(f) * 0.5, [x, y] = pt(f, s, zc), r = Math.max(2.4, th(f) * 11);
      c.fillStyle = "#26463a"; c.beginPath(); c.ellipse(x, y, r * 0.8, r, 0, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
      c.fillStyle = "rgba(40,90,90,0.9)"; c.beginPath(); c.ellipse(x, y + 0.5, r * 0.55, r * 0.7, 0, 0, 7); c.fill();
    }
    c.strokeStyle = "#1d3a2d"; c.lineWidth = 1.2; c.beginPath(); fs.forEach((f, i) => (i ? c.lineTo(...pt(f, -1, zd(f) - th(f))) : c.moveTo(...pt(f, -1, zd(f) - th(f))))); c.stroke();
  };
  const stairs = (k) => {
    for (const [f0, sgn] of [[0, -1], [1, 1]]) for (let i = 0; i < 4; i++) {
      const zt = zE * (1 - (i + 1) / 4) + 0.06, d0 = 0.02 + i * (SL / 4), d1 = d0 + SL / 4;
      const pa = (d, s) => [A[0] + dx * f0 + sgn * d, A[1] + s * w * 0.95];
      const top = [pa(d0, -1), pa(d1, -1), pa(d1, 1), pa(d0, 1)].map(([uu, vv]) => P(uu, vv, zt));
      const frontLo = [pa(d0, 1), pa(d1, 1)].map(([uu, vv]) => P(uu, vv, 0)), frontHi = [pa(d1, 1), pa(d0, 1)].map(([uu, vv]) => P(uu, vv, zt));
      const endLo = [pa(d1, 1), pa(d1, -1)].map(([uu, vv]) => P(uu, vv, 0)), endHi = [pa(d1, -1), pa(d1, 1)].map(([uu, vv]) => P(uu, vv, zt));
      k.path([...frontHi, ...frontLo], { fill: "#bfae88", lw: 0.8, wobble: 0 });
      if (sgn > 0) k.path([...endHi, ...endLo], { fill: "#b4a47f", lw: 0.8, wobble: 0 });
      k.path(top, { fill: "#e8dcba", lw: 0.8, wobble: 0 });
    }
    const c = k.ctx; c.lineCap = "round";
    for (const [f0, sgn] of [[0, -1], [1, 1]]) for (const sd of [-1, 1]) {
      const p0 = [A[0] + dx * f0, A[1] + sd * w * 0.95], p1 = [p0[0] + sgn * SL, p0[1]];
      c.strokeStyle = INK; c.lineWidth = 3.2; c.beginPath(); c.moveTo(...P(...p0, zE + 0.65)); c.lineTo(...P(...p1, 0.62)); c.stroke(); c.strokeStyle = GREEN; c.lineWidth = 1.6; c.stroke();
      c.lineWidth = 0.8; c.beginPath(); for (let i = 0; i <= 4; i++) { const f = i / 4, uu = lerp(p0[0], p1[0], f), z = lerp(zE, 0, f); c.moveTo(...P(uu, p0[1], z)); c.lineTo(...P(uu, p0[1], z + 0.65 - 0.03 * f)); } c.stroke();
    }
  };
  // height of the walking surface under a person at u
  const zAt = (u) => (u < A[0] ? zE * clamp(1 - (A[0] - u) / SL) : u > B[0] ? zE * clamp(1 - (u - B[0]) / SL) : zd((u - A[0]) / dx));
  return { zd, zAt, SL, far: (k) => rail(-1, false)(k), mid: (k) => { stairs(k); deck(k); }, near: (k) => { girder(k); rail(1, true)(k); }, A, B, w };
}

// ---------- the barge: any heading (theta 0 = bow toward +v), drawn from prisms ----------
export function barge(k, t, st) {
  const c = k.ctx, { u: cu, v: cv, th, z } = st, L = 1.7, W = 0.75;
  const d = [Math.sin(th), Math.cos(th)], s = [Math.cos(th), -Math.sin(th)];
  const M = (a, b) => [cu + a * d[0] + b * s[0], cv + a * d[1] + b * s[1]];
  const bob = Math.sin(t * 1.3) * 0.012, zb = z + bob - 0.12, ht = z + bob + 0.34;
  // wake behind the stern (only when moving)
  if (st.moving) {
    c.save(); c.strokeStyle = "rgba(255,255,255,0.85)"; c.lineWidth = 1.5; c.lineCap = "round";
    for (let i = 0; i < 6; i++) {
      const ph = (t * 0.5 + i / 6) % 1, dd = 0.1 + ph * 0.9; c.globalAlpha = (1 - ph) * 0.9;
      for (const sd of [-1, 1]) { const p0 = M(-L / 2 - dd, sd * (W / 2 + dd * 0.35)), p1 = M(-L / 2 - dd + 0.3, sd * (W / 2 + dd * 0.35 - 0.1)); c.beginPath(); c.moveTo(...P(...p0, z)); c.lineTo(...P(...p1, z)); c.stroke(); }
    }
    c.restore();
  }
  const hull = [[-L / 2, -W / 2], [-L / 2, W / 2], [L / 2 - 0.38, W / 2], [L / 2, 0], [L / 2 - 0.38, -W / 2]].map(([a, b]) => M(a, b));
  prism(k, hull, zb, ht, "#2c4468", {
    top: false, edge: (e) => {
      c.strokeStyle = "#b8452a"; c.lineWidth = 3; c.beginPath(); c.moveTo(...P(e.a[0], e.a[1], zb + 0.16)); c.lineTo(...P(e.b[0], e.b[1], zb + 0.16)); c.stroke();
      c.strokeStyle = "#e9dcc0"; c.lineWidth = 2; c.beginPath(); c.moveTo(...P(e.a[0], e.a[1], ht - 0.03)); c.lineTo(...P(e.b[0], e.b[1], ht - 0.03)); c.stroke();
    },
  });
  k.path(hull.map(([u, v]) => P(u, v, ht)), { fill: "#a98353", lw: 1, wobble: 0 });
  // cabin
  const c0 = -L / 2 + 0.34, c1 = L / 2 - 0.62, cw = W / 2 - 0.1, zc1 = ht + 0.6;
  const cab = [[c0, -cw], [c0, cw], [c1, cw], [c1, -cw]].map(([a, b]) => M(a, b));
  const stern = M(-L / 2 + 0.2, 0.12), bowP = M(L / 2 - 0.5, -0.12);
  const cabQ = (cab[0][0] + cab[2][0] + cab[0][1] + cab[2][1]) / 2;
  const items = [];
  const pd = (p) => p[0] + p[1];
  items.push({ q: cabQ, fn: () => {
    prism(k, cab, ht, zc1, "#c9985a", {
      topCol: "#d9c9a2", edge: (e) => {
        const nW = 5; if (e.L < 0.5) return;
        for (let i = 0; i < nW; i++) {
          const f0 = (i + 0.12) / nW, f1 = (i + 0.78) / nW, pa = [lerp(e.a[0], e.b[0], f0), lerp(e.a[1], e.b[1], f0)], pb = [lerp(e.a[0], e.b[0], f1), lerp(e.a[1], e.b[1], f1)];
          k.path([P(...pa, ht + 0.2), P(...pb, ht + 0.2), P(...pb, zc1 - 0.1), P(...pa, zc1 - 0.1)], { fill: i === 2 ? "#f6d97c" : "#5b7585", lw: 0.8, wobble: 0 });
        }
      },
    });
    // roof garden
    const R = rng(5);
    for (let i = 0; i < 12; i++) { const [x, y] = P(...M(lerp(c0 + 0.1, c1 - 0.1, R()), lerp(-cw + 0.05, cw - 0.05, R())), zc1); c.fillStyle = ["#5f9d4a", "#7fb55a", "#e8607a", "#f4c542", "#d85a3a", "#8fc060"][i % 6]; c.beginPath(); c.arc(x, y - 4 - R() * 3, 3.2 + R() * 1.2, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.6; c.stroke(); }
    const [kx, ky] = P(...M(c0 + 0.25, 0), zc1); c.fillStyle = "#3a3f44"; c.strokeStyle = INK; c.lineWidth = 0.9; c.fillRect(kx - 2, ky - 10, 4, 10); c.strokeRect(kx - 2, ky - 10, 4, 10);
    for (let i = 0; i < 4; i++) { const ph = (t * 0.35 + i / 4) % 1; c.fillStyle = `rgba(240,236,228,${0.55 * (1 - ph)})`; c.beginPath(); c.arc(kx + ph * 8, ky - 12 - ph * 20, 2.5 + ph * 4, 0, 7); c.fill(); }
  } });
  items.push({ q: pd(stern) + 0.05, fn: () => k.person(stern[0], stern[1], { z: ht, pose: "stand", dir: d, seed: 91, hat: "cap", hatCol: "#f0ede4", shadow: false }) });
  items.push({ q: pd(bowP) + 0.05, fn: () => { const [x, y] = P(...M(L / 2 - 0.3, W / 2 - 0.06), ht - 0.12); c.fillStyle = "#e8e2d0"; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.arc(x, y, 3.8, 0, 7); c.fill(); c.stroke(); c.fillStyle = "#c8402f"; c.beginPath(); c.arc(x, y, 1.8, 0, 7); c.fill(); k.person(bowP[0], bowP[1], { z: ht, pose: "wave", dir: d, seed: 92, shadow: false }); } });
  items.sort((a, b) => a.q - b.q); for (const it of items) it.fn();
}

// ---------- small props ----------
export function bistro(k, u, v, t, seed, col) {
  const c = k.ctx, [x, y] = P(u, v, 0); k.ell(u, v, 0, 0.22, "rgba(60,45,30,0.15)", { stroke: false });
  c.strokeStyle = INK; c.lineWidth = 2.2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 9); c.stroke();
  k.circle(x, y - 10, 6, "#f4efe3", { lw: 1 }); c.fillStyle = col; c.beginPath(); c.arc(x, y - 10, 3, 0, 7); c.fill();
  const ph = (t * 0.6 + seed) % 1; c.strokeStyle = `rgba(255,255,255,${0.6 * (1 - ph)})`; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 1, y - 13); c.quadraticCurveTo(x + 3, y - 16 - ph * 5, x, y - 20 - ph * 6); c.stroke();
}
export function wicker(k, u, v, face) { const c = k.ctx, [x, y] = P(u, v, 0.28); c.fillStyle = "#b5824a"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.ellipse(x, y, 5, 2.6, 0, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.arc(x - face * 3, y - 6, 5, Math.PI * 0.9, Math.PI * 2.1); c.stroke(); c.beginPath(); c.moveTo(x - 3, y + 2); c.lineTo(x - 3, y + 8); c.moveTo(x + 3, y + 2); c.lineTo(x + 3, y + 8); c.stroke(); }
export function bollard(k, u, v) { const c = k.ctx, [x, y] = P(u, v, 0); c.fillStyle = "#3a403c"; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.rect(x - 2.6, y - 11, 5.2, 11); c.fill(); c.stroke(); c.fillStyle = "#7a827c"; c.beginPath(); c.ellipse(x, y - 11, 2.8, 1.5, 0, 0, 7); c.fill(); c.stroke(); }
export function pot(k, u, v, col = "#3f8a4a") { const c = k.ctx, [x, y] = P(u, v, 0); c.fillStyle = "#b8643a"; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x - 5, y - 8); c.lineTo(x + 5, y - 8); c.lineTo(x + 3.6, y); c.lineTo(x - 3.6, y); c.closePath(); c.fill(); c.stroke(); k._lobe(x, y - 15, 8, col, Math.round(u * 31 + v), { bumps: 7 }); }
export function picnic(k, u, v, t) {
  const c = k.ctx;
  k.poly([[u - 0.7, v - 0.5, 0.02], [u + 0.7, v - 0.5, 0.02], [u + 0.7, v + 0.5, 0.02], [u - 0.7, v + 0.5, 0.02]], "#e8a0a8", { lw: 1.1, wobble: 0 });
  c.fillStyle = "rgba(255,255,255,0.7)"; for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { const [x, y] = P(u - 0.55 + i * 0.28, v - 0.36 + j * 0.34, 0.03); c.fillRect(x - 2, y - 1, 4, 2); }
  const [bx, by] = P(u + 0.1, v + 0.05, 0.05); c.fillStyle = "#b07a45"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.roundRect(bx - 7, by - 6, 14, 8, 2); c.fill(); c.stroke();
  const [wx, wy] = P(u - 0.05, v - 0.1, 0.05); c.fillStyle = "#2e5a3a"; c.fillRect(wx - 1.6, wy - 9, 3.2, 9);
  k.person(u - 0.5, v - 0.15, { pose: "sitground", dir: [0.6, 0.5], seed: 83 });
  const p = k.person(u + 0.5, v + 0.2, { pose: "sitground", dir: [-0.6, -0.35], seed: 84, gesture: true });
  k.person(u + 0.2, v - 0.42, { pose: "sitground", dir: [-0.3, 0.8], seed: 85, hat: "straw" });
  const lift = Math.max(0, Math.sin(t * 1.3)) * 7; c.fillStyle = "#c9415a"; c.beginPath(); c.arc(p.aR[0], p.aR[1] - lift, 2.6, 0, 7); c.fill();
}
export { plane };
