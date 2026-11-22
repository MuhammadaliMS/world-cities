// helpers for the Dubai -1,1 tile (Ain Dubai & Bluewaters). Private to this tile; _props.js is untouched.
import { P, CTS, INK, shade, lerp, clamp, rng, spline, drawHuman } from "../../lib/vec-kit.js";
import { look } from "./_props.js";

// ground pixel -> tile (u,v) on z = 0
export const G = ([x, y]) => { const a = (x - CTS.X0) / CTS.S, b = (y - CTS.Y0) / (CTS.S * CTS.YS); return [(a + b) / 2, (b - a) / 2]; };
export const pxPath = (pts) => pts.map(G);
export function inPoly([x, y], pts) { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; }
const tr = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };

// ---------- planting bed: stone kerb, soil, clipped shrubs, flowers ----------
const FLOW = ["#e0457a", "#f06ba8", "#ffffff", "#f4a640", "#f7d44c", "#c2428a", "#f39ac0"];
export function bedPoly(k, pts, seed = 1, o = {}) {
  const c = k.ctx, R = rng(seed * 7 + 1), kz = o.kerb ?? 0.12;
  // kerb: the two near faces of the outline + top rim
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const facing = (b[1] - a[1]) * -1 + (b[0] - a[0]) * 1; // outward normal (dv,-du) dot (1,1) > 0 -> visible
    const nu = b[1] - a[1], nv = -(b[0] - a[0]);
    if (nu + nv > 0) k.poly([[a[0], a[1], 0], [b[0], b[1], 0], [b[0], b[1], kz], [a[0], a[1], kz]], nu > nv ? "#cdbb98" : "#dccaa8", { lw: 1, wobble: 0 });
  }
  k.poly(pts.map(([u, v]) => [u, v, kz]), "#e8dbbf", { lw: 1.3 });
  const inner = shrink(pts, 0.09);
  k.poly(inner.map(([u, v]) => [u, v, kz]), "#6f8f45", { lw: 0.9, stroke: "rgba(42,36,32,0.6)" });
  // shrubs + flowers, back to front
  let minU = 1e9, maxU = -1e9, minV = 1e9, maxV = -1e9;
  for (const [u, v] of inner) { minU = Math.min(minU, u); maxU = Math.max(maxU, u); minV = Math.min(minV, v); maxV = Math.max(maxV, v); }
  const area = (maxU - minU) * (maxV - minV), N = Math.round(area * (o.density ?? 9)) + 3, spots = [];
  for (let i = 0; i < N * 4 && spots.length < N; i++) { const u = lerp(minU, maxU, R()), v = lerp(minV, maxV, R()); if (inPoly([u, v], inner)) spots.push([u, v, R()]); }
  spots.sort((p, q) => p[0] + p[1] - q[0] - q[1]);
  const pal = o.cols || FLOW;
  for (const [u, v, r] of spots) {
    const [x, y] = P(u, v, kz + 0.06), rr = CTS.S * (0.17 + r * 0.1) * (o.size ?? 1);
    const green = r < 0.33 ? "#5d8f43" : r < 0.66 ? "#6ea24e" : "#4f7f3c";
    k._lobe(x, y, rr, green, Math.round(u * 131 + v * 71), { squash: 0.8, bumps: 8, lw: 0.75 });
    if (r > (o.bare ?? 0.18)) {
      const fc = pal[Math.floor(R() * pal.length)];
      for (let j = 0; j < 6; j++) {
        const a = R() * 6.28, d = Math.sqrt(R()) * rr * 0.8, fx = x + Math.cos(a) * d, fy = y - rr * 0.2 + Math.sin(a) * d * 0.7, pr = 1.4 + R() * 0.9;
        c.fillStyle = fc; for (let q = 0; q < 5; q++) { const b = (q / 5) * 6.28; c.beginPath(); c.arc(fx + Math.cos(b) * pr, fy + Math.sin(b) * pr, pr * 0.75, 0, 6.3); c.fill(); }
        c.fillStyle = "#f6e08a"; c.beginPath(); c.arc(fx, fy, pr * 0.4, 0, 6.3); c.fill();
      }
    }
  }
}
function shrink(pts, d) {
  let cu = 0, cv = 0; for (const [u, v] of pts) { cu += u; cv += v; } cu /= pts.length; cv /= pts.length;
  return pts.map(([u, v]) => { const L = Math.hypot(u - cu, v - cv) || 1; return [u - (u - cu) / L * d, v - (v - cv) / L * d]; });
}

// ---------- generic prism (rotated buildings): footprint CCW in (u,v) ----------
export function faceShade(nu) { return -0.07 - 0.13 * nu; }
export function prism(k, foot, z0, z1, col, o = {}) {
  const n = foot.length, faces = [];
  for (let i = 0; i < n; i++) {
    const a = foot[i], b = foot[(i + 1) % n], du = b[0] - a[0], dv = b[1] - a[1], L = Math.hypot(du, dv);
    const nu = dv / L, nv = -du / L; // outward for a clockwise-on-screen footprint
    if (nu + nv > 0.001) faces.push({ a, b, nu, nv, d: (a[0] + a[1] + b[0] + b[1]) / 2, L });
  }
  faces.sort((p, q) => p.d - q.d);
  const out = [];
  for (const f of faces) {
    const pts = [[f.a[0], f.a[1], z0], [f.b[0], f.b[1], z0], [f.b[0], f.b[1], z1], [f.a[0], f.a[1], z1]];
    k.poly(pts, shade(col, faceShade(f.nu) + (o.dark ?? 0)), { lw: o.lw ?? 1.5 });
    out.push({ ...f, F: (s, z) => P(f.a[0] + (f.b[0] - f.a[0]) * s / f.L, f.a[1] + (f.b[1] - f.a[1]) * s / f.L, z) });
  }
  if (o.top !== false) k.poly(foot.map(([u, v]) => [u, v, z1]), o.topCol || shade(col, 0.07), { lw: o.lw ?? 1.5 });
  return out;
}
// sandstone block joints on a face (F(s,z), run length L)
export function stoneJoints(k, F, L, z0, z1, o = {}) {
  const c = k.ctx; c.strokeStyle = o.col || "rgba(120,90,55,0.28)"; c.lineWidth = 0.7; c.beginPath();
  let row = 0;
  for (let z = z0 + 0.22; z < z1 - 0.05; z += 0.22, row++) {
    c.moveTo(...F(0, z)); c.lineTo(...F(L, z));
    for (let s = (row % 2) * 0.25 + 0.25; s < L; s += 0.5) { c.moveTo(...F(s, z)); c.lineTo(...F(s, Math.min(z1, z + 0.22))); }
  }
  c.stroke();
}
// a glazed storefront bay row on a face: frames, warm interior, mullions
export function glazing(k, F, s0, s1, z0, z1, bays, o = {}) {
  const c = k.ctx, w = (s1 - s0) / bays, gap = o.gap ?? 0.07;
  for (let i = 0; i < bays; i++) {
    const a = s0 + i * w + gap, b = s0 + (i + 1) * w - gap;
    const q = [F(a, z0), F(b, z0), F(b, z1), F(a, z1)];
    tr(c, q);
    const g = c.createLinearGradient(0, q[3][1], 0, q[0][1]);
    if (o.warm !== false) { g.addColorStop(0, o.dark ? "#55707e" : "#7fa6b8"); g.addColorStop(0.45, "#b9a77a"); g.addColorStop(1, "#d79a4c"); }
    else { g.addColorStop(0, "#a8cad8"); g.addColorStop(1, "#5f8aa2"); }
    c.fillStyle = g; c.fill(); c.strokeStyle = o.frame || "#3a3228"; c.lineWidth = 1.4; c.stroke();
    c.save(); tr(c, q); c.clip();
    // interior: hanging lamps + silhouettes of shelves/tables
    if (o.warm !== false) {
      const R = rng(Math.round(a * 100 + z0 * 10));
      for (let j = 0; j < 2; j++) { const [x, y] = F(lerp(a, b, 0.3 + j * 0.4), z1 - 0.12); c.fillStyle = "rgba(255,238,170,0.95)"; c.beginPath(); c.arc(x, y, 1.6, 0, 6.3); c.fill(); }
      const [bx, by] = F(lerp(a, b, 0.5), z0 + 0.25); c.fillStyle = "rgba(90,60,35,0.55)"; c.fillRect(bx - 6, by - 2, 12, 4);
      if (R() < 0.6) { const [px, py] = F(lerp(a, b, 0.35 + R() * 0.3), z0 + 0.05); c.fillStyle = "rgba(60,45,35,0.55)"; c.beginPath(); c.arc(px, py - 15, 2.4, 0, 6.3); c.fill(); c.fillRect(px - 2.5, py - 12, 5, 9); }
    }
    // mullion + transom
    c.strokeStyle = o.frame || "#3a3228"; c.lineWidth = 1; c.beginPath();
    const m = o.mull ?? 2; for (let j = 1; j < m; j++) { const s = lerp(a, b, j / m); c.moveTo(...F(s, z0)); c.lineTo(...F(s, z1)); }
    if (o.transom) { const zt = lerp(z0, z1, 0.72); c.moveTo(...F(a, zt)); c.lineTo(...F(b, zt)); }
    c.stroke();
    c.fillStyle = "rgba(255,255,255,0.22)"; tr(c, [F(a, z1), F(lerp(a, b, 0.35), z1), F(a, lerp(z0, z1, 0.4))]); c.fill();
    c.restore();
  }
}
// striped canvas awning sloping out from a face (F, outward normal n)
export function awningF(k, F, s0, s1, z, n, o = {}) {
  const c = k.ctx, stripes = o.stripes ?? 10, d = o.depth ?? 0.55, drop = o.drop ?? 0.32;
  const [x0, y0] = F(0, 0), [x1, y1] = P(0, 0, 0); // not used
  const out = (s, zz, dd) => { const p = F(s, zz); const [ax, ay] = P(0, 0, 0), [bx, by] = P(n[0] * dd, n[1] * dd, 0); return [p[0] + bx - ax, p[1] + by - ay]; };
  for (let i = 0; i < stripes; i++) {
    const a = lerp(s0, s1, i / stripes), b = lerp(s0, s1, (i + 1) / stripes), col = i % 2 ? (o.c2 || "#f7f1e6") : (o.c1 || "#d64b44");
    k.path([out(a, z, 0), out(b, z, 0), out(b, z - drop, d), out(a, z - drop, d)], { fill: col, lw: 1, wobble: 0 });
    // scalloped valance
    const p0 = out(a, z - drop, d), p1 = out(b, z - drop, d);
    c.beginPath(); c.moveTo(...p0); c.lineTo(p0[0], p0[1] + 5); c.quadraticCurveTo((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 + 9, p1[0], p1[1] + 5); c.lineTo(...p1); c.closePath();
    c.fillStyle = col; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
  }
  k.line([out(s0, z, 0), out(s1, z, 0)], { lw: 1.6, wobble: 0 });
}
// wooden pergola slats on a roof (F face fn spans the roof edge; depth vector n)
export function slats(k, F, s0, s1, z, n, depth, count, col = "#7a5232") {
  const c = k.ctx, [ax, ay] = P(0, 0, 0), [bx, by] = P(n[0] * depth, n[1] * depth, 0), dx = bx - ax, dy = by - ay;
  const beam = (p, q, w) => { c.strokeStyle = INK; c.lineWidth = w + 1.6; c.beginPath(); c.moveTo(...p); c.lineTo(...q); c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
  for (const s of [s0, s1]) { const p = F(s, z - 0.4), q = F(s, z); beam(p, q, 2); }
  for (let i = 0; i <= count; i++) { const s = lerp(s0, s1, i / count), p = F(s, z); beam([p[0] - dx * 0.0, p[1]], [p[0] + dx, p[1] + dy], 1.8); }
  beam(F(s0, z), F(s1, z), 2.4);
}

// ---------- café set: parasol, round table, chairs, seated people ----------
export function cafeSet(k, u, v, seed, o = {}) {
  const c = k.ctx, t = k.t, R = rng(seed * 5 + 2);
  const seats = o.seats || [[0.32, 0.0], [-0.3, 0.05], [0.02, 0.32]];
  const sitters = o.sitters ?? 2;
  // chairs + people sorted by depth, table in the middle
  const items = seats.map(([du, dv], i) => ({ du, dv, d: u + du + v + dv, i }));
  items.push({ table: true, d: u + v + 0.01 });
  items.sort((a, b) => a.d - b.d);
  for (const it of items) {
    if (it.table) {
      const [x, y] = P(u, v, 0), [, yt] = P(u, v, 0.36);
      c.strokeStyle = INK; c.lineWidth = 2.2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt); c.stroke();
      c.fillStyle = "#3a2c22"; c.beginPath(); c.ellipse(x, y, 4, 1.6, 0, 0, 6.3); c.fill();
      c.fillStyle = o.top || "#f1ebe0"; c.beginPath(); c.ellipse(x, yt, 8, 3.4, 0, 0, 6.3); c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
      // cups / plates
      c.fillStyle = "#fff"; c.beginPath(); c.arc(x - 2.5, yt - 1, 1.4, 0, 6.3); c.fill(); c.fillStyle = "#c9415a"; c.beginPath(); c.arc(x + 2.6, yt - 0.6, 1.2, 0, 6.3); c.fill();
      continue;
    }
    const cu = u + it.du, cv = v + it.dv, dir = [-it.du, -it.dv];
    // chair (rattan) : seat + back away from the table
    const L = Math.hypot(it.du, it.dv) || 1, bu = it.du / L * 0.1, bv = it.dv / L * 0.1;
    const [sx, sy] = P(cu, cv, 0.22), [bx, by] = P(cu + bu, cv + bv, 0.22), [, bt] = P(cu + bu, cv + bv, 0.48), [fx, fy] = P(cu, cv, 0);
    c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); c.moveTo(fx - 3, fy); c.lineTo(sx - 3, sy); c.moveTo(fx + 3, fy); c.lineTo(sx + 3, sy); c.stroke();
    const seatBack = () => { c.fillStyle = "#8a5a33"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.roundRect(bx - 4, bt, 8, by - bt, 2); c.fill(); c.stroke(); };
    const back = it.du + it.dv < 0; // chair back is behind the sitter when the sitter faces the viewer
    if (back) seatBack();
    c.fillStyle = "#a06a3c"; c.beginPath(); c.ellipse(sx, sy, 4.6, 2, 0, 0, 6.3); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
    if (it.i < sitters) {
      const sd = seed * 10 + it.i;
      const p = k.person(cu, cv, { pose: "sit", seatZ: 0.2, dir, seed: sd, h: 0.62, gesture: it.i === 0, ...look(sd + (o.lookOff ?? 0)) });
      if (it.i === 1) { const lift = Math.max(0, Math.sin(t * 1.1 + seed)) * 5; c.fillStyle = "#fff"; c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.roundRect(p.hand[0] - 1.6, p.hand[1] - 3 - lift, 3.2, 3.6, 0.8); c.fill(); c.stroke(); }
    }
    if (!back) seatBack();
  }
  if (o.parasol !== false) parasolBig(k, u, v, o.col || "#f3ead6", o.ph ?? seed);
}
export function parasolBig(k, u, v, col, ph = 0) {
  const c = k.ctx, t = k.t, [x, y] = P(u, v, 0), [, yt] = P(u, v, 1.25), r = 20, flap = Math.sin(t * 2.1 + ph) * 0.8;
  c.strokeStyle = INK; c.lineWidth = 2.2; c.beginPath(); c.moveTo(x, y - 12); c.lineTo(x, yt); c.stroke(); c.strokeStyle = "#e9e1d0"; c.lineWidth = 1; c.stroke();
  const pts = [];
  for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * Math.PI; pts.push([x + Math.cos(a) * r, yt + 7 + Math.sin(a) * 4 + (i % 2 ? flap : 0)]); }
  c.beginPath(); c.moveTo(x, yt - 8); for (const p of pts) c.lineTo(...p); c.closePath();
  c.beginPath(); c.moveTo(x - r, yt + 7);
  for (let i = 0; i < 6; i++) { const a0 = -1 + i / 3, a1 = -1 + (i + 1) / 3; c.quadraticCurveTo(x + (a0 + a1) / 2 * r, yt + 11.5 + (i % 2 ? flap : -flap), x + a1 * r, yt + 7); }
  c.lineTo(x, yt - 9); c.closePath();
  const g = c.createLinearGradient(x - r, 0, x + r, 0); g.addColorStop(0, shade(col, 0.06)); g.addColorStop(1, shade(col, -0.14));
  c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
  c.strokeStyle = "rgba(90,70,45,0.45)"; c.lineWidth = 0.8; c.beginPath(); for (const f of [-0.66, 0, 0.66]) { c.moveTo(x, yt - 8); c.lineTo(x + f * r, yt + 9.5); } c.stroke();
  c.fillStyle = INK; c.beginPath(); c.arc(x, yt - 9.5, 1.4, 0, 6.3); c.fill();
}

// ---------- waterfront ----------
// rough round boulders along a line from a to b (u,v), sloping from z0 to z1 across width w toward n
export function boulders(k, a, b, n, w, z0, z1, seed = 3) {
  const c = k.ctx, R = rng(seed), L = Math.hypot(b[0] - a[0], b[1] - a[1]), N = Math.round(L / 0.2);
  const list = [];
  for (let row = 0; row < 3; row++) for (let i = 0; i < N; i++) {
    const s = (i + (row % 2) * 0.5 + R() * 0.3) / N, d = (row + 0.5) / 3 * w;
    const u = lerp(a[0], b[0], s) + n[0] * d, v = lerp(a[1], b[1], s) + n[1] * d;
    list.push([u, v, lerp(z0, z1, (row + 0.5) / 3), 4.5 + R() * 3.2, R()]);
  }
  list.sort((p, q) => p[0] + p[1] - q[0] - q[1]);
  for (const [u, v, z, r, q] of list) {
    const [x, y] = P(u, v, z), col = q < 0.4 ? "#c9b79a" : q < 0.75 ? "#d8c8ab" : "#b9a585";
    c.beginPath(); c.ellipse(x, y, r * 1.3, r * 0.85, (q - 0.5) * 0.5, 0, 6.3);
    c.fillStyle = col; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
    c.fillStyle = "rgba(255,255,255,0.4)"; c.beginPath(); c.ellipse(x - r * 0.35, y - r * 0.3, r * 0.5, r * 0.25, -0.3, 0, 6.3); c.fill();
    c.fillStyle = "rgba(80,60,40,0.18)"; c.beginPath(); c.ellipse(x + r * 0.35, y + r * 0.3, r * 0.6, r * 0.3, -0.3, 0, 6.3); c.fill();
  }
}
// rope railing: timber posts with a sagging rope between them
export function ropeRail(k, pts, o = {}) {
  const c = k.ctx, h = o.h ?? 0.42, gap = o.gap ?? 0.7, z = o.z ?? 0.04, posts = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [u0, v0] = pts[i], [u1, v1] = pts[i + 1], L = Math.hypot(u1 - u0, v1 - v0), m = Math.max(1, Math.round(L / gap));
    for (let j = 0; j <= m; j++) { if (i > 0 && j === 0) continue; posts.push([lerp(u0, u1, j / m), lerp(v0, v1, j / m)]); }
  }
  for (let i = 0; i < posts.length - 1; i++) {
    for (const zz of [h * 0.92, h * 0.5]) {
      const p = P(posts[i][0], posts[i][1], z + zz), q = P(posts[i + 1][0], posts[i + 1][1], z + zz);
      c.strokeStyle = INK; c.lineWidth = 2.2; c.beginPath(); c.moveTo(...p); c.quadraticCurveTo((p[0] + q[0]) / 2, (p[1] + q[1]) / 2 + 5, ...q); c.stroke();
      c.strokeStyle = "#c9a46a"; c.lineWidth = 1; c.stroke();
    }
  }
  for (const [u, v] of posts) {
    const [x, y] = P(u, v, z), [, yt] = P(u, v, z + h + 0.08);
    c.fillStyle = "#4a3a2c"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.roundRect(x - 2.2, yt, 4.4, y - yt, 1.2); c.fill(); c.stroke();
    c.fillStyle = "#6b5440"; c.beginPath(); c.ellipse(x, yt, 2.2, 1, 0, 0, 6.3); c.fill(); c.stroke();
  }
}
// timber deck strip along a polyline (width toward -n), planks across
export function boardwalk(k, a, b, n, w, z = 0.05) {
  const c = k.ctx, q = [[a[0], a[1], z], [b[0], b[1], z], [b[0] - n[0] * w, b[1] - n[1] * w, z], [a[0] - n[0] * w, a[1] - n[1] * w, z]];
  // fascia on the water side
  k.poly([[a[0], a[1], z - 0.12], [b[0], b[1], z - 0.12], [b[0], b[1], z], [a[0], a[1], z]], "#8a6440", { lw: 1.1, wobble: 0 });
  k.poly(q, "#b98a5a", { lw: 1.3, wobble: 0 });
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), N = Math.round(L / 0.13);
  c.strokeStyle = "rgba(90,58,30,0.55)"; c.lineWidth = 0.8; c.beginPath();
  for (let i = 1; i < N; i++) { const s = i / N, u = lerp(a[0], b[0], s), v = lerp(a[1], b[1], s); c.moveTo(...P(u, v, z)); c.lineTo(...P(u - n[0] * w, v - n[1] * w, z)); }
  c.stroke();
  c.strokeStyle = "rgba(255,230,190,0.35)"; c.beginPath();
  for (let i = 1; i < N; i += 3) { const s = (i + 0.4) / N, u = lerp(a[0], b[0], s), v = lerp(a[1], b[1], s); c.moveTo(...P(u, v, z)); c.lineTo(...P(u - n[0] * w * 0.6, v - n[1] * w * 0.6, z)); }
  c.stroke();
}

// ---------- boats ----------
export function hullBoat(k, u, v, dir, o = {}) {
  const c = k.ctx, L = o.len ?? 1.2, W = o.wid ?? 0.42, H = o.h ?? 0.2, z0 = o.z ?? 0, col = o.col || "#f6f3ec", t = k.t;
  let [a, b] = dir; const l = Math.hypot(a, b) || 1; a /= l; b /= l; const n = [-b, a];
  const bob = Math.sin(t * 2.2 + (o.ph ?? 0)) * 0.025, roll = Math.sin(t * 1.7 + (o.ph ?? 0)) * 0.03;
  const pt = (f, s, z) => P(u + a * f * L / 2 + n[0] * s * W / 2, v + b * f * L / 2 + n[1] * s * W / 2, z0 + z + bob + s * roll);
  const prof = [[1, 0], [0.8, 0.62], [0.45, 0.95], [-0.2, 1], [-1, 0.9], [-1, -0.9], [-0.2, -1], [0.45, -0.95], [0.8, -0.62]];
  k.ell(u, v, z0, W * 0.8, "rgba(20,70,90,0.22)", { stroke: false });
  const top = prof.map(([f, s]) => pt(f, s, H)), bot = prof.map(([f, s]) => pt(f * 0.94, s * 0.82, 0));
  const sides = prof.map((_, i) => { const j = (i + 1) % prof.length; return { q: [bot[i], bot[j], top[j], top[i]], d: (top[i][1] + top[j][1]) / 2 }; }).sort((p, q) => p.d - q.d);
  for (const s of sides) k.path(s.q, { fill: shade(o.hull || col, -0.12), lw: 1, wobble: 0 });
  if (o.stripe) { const s1 = prof.map(([f, s]) => pt(f * 0.99, s * 0.97, H * 0.6)); c.strokeStyle = o.stripe; c.lineWidth = 2; c.beginPath(); s1.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.stroke(); }
  k.path(top, { fill: o.deck || "#d9b88a", lw: 1.4, wobble: 0 });
  // deck planks
  c.save(); tr(c, top); c.clip(); c.strokeStyle = "rgba(110,75,40,0.35)"; c.lineWidth = 0.7; c.beginPath(); for (let i = -2; i <= 2; i++) { c.moveTo(...pt(-1, i * 0.35, H)); c.lineTo(...pt(1, i * 0.35, H)); } c.stroke(); c.restore();
  return { pt, a, b, n, H };
}
// white motor yacht with a raked cabin, windscreen, flag
export function yacht(k, u, v, dir, o = {}) {
  const c = k.ctx, t = k.t;
  const B = hullBoat(k, u, v, dir, { len: 1.35, wid: 0.46, h: 0.22, col: "#f7f5ef", stripe: "#2f6f9e", deck: "#e8d2a8", ...o });
  const { pt, H } = B;
  const cab = [[-0.55, -0.62], [0.2, -0.6], [0.4, 0], [0.2, 0.6], [-0.55, 0.62]];
  const lo = cab.map(([f, s]) => pt(f, s, H)), hi = cab.map(([f, s]) => pt(f * 0.92 - 0.04, s * 0.85, H + 0.26));
  const faces = cab.map((_, i) => { const j = (i + 1) % cab.length; return { q: [lo[i], lo[j], hi[j], hi[i]], d: lo[i][1] + lo[j][1] }; }).sort((p, q) => p.d - q.d);
  for (const f of faces) k.path(f.q, { fill: "#f2efe8", lw: 1, wobble: 0 });
  // windows band
  const wl = cab.map(([f, s]) => pt(f * 0.96 - 0.02, s * 0.93, H + 0.12)), wh = cab.map(([f, s]) => pt(f * 0.93 - 0.03, s * 0.88, H + 0.21));
  for (let i = 0; i < cab.length; i++) { const j = (i + 1) % cab.length; if (faces.find((f) => f.q[0] === lo[i] || f.q[1] === lo[i])) k.path([wl[i], wl[j], wh[j], wh[i]], { fill: "#3f5f78", lw: 0.6, wobble: 0, stroke: "rgba(42,36,32,0.6)" }); }
  k.path(hi, { fill: "#ffffff", lw: 1.2, wobble: 0 });
  // flybridge rail + radar
  const [rx, ry] = pt(-0.3, 0, H + 0.3); c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx, ry - 9); c.stroke();
  c.save(); c.translate(rx, ry - 9); c.scale(Math.cos(t * 3), 1); c.fillStyle = "#e6e2da"; c.fillRect(-5, -1.5, 10, 3); c.strokeRect(-5, -1.5, 10, 3); c.restore();
  // stern flag
  const [fx, fy] = pt(-0.98, 0, H); c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx, fy - 12); c.stroke();
  const w = Math.sin(t * 7) * 1.5; c.fillStyle = "#1f8a4c"; c.beginPath(); c.moveTo(fx, fy - 12); c.lineTo(fx + 7, fy - 11 + w); c.lineTo(fx, fy - 8); c.fill();
  c.fillStyle = "#d33a32"; c.fillRect(fx - 0.5, fy - 12, 2, 4);
  // passengers on the foredeck
  if (o.people !== false) for (const [f, s, sd] of [[0.55, 0.3, 801], [0.6, -0.3, 802]]) { const [px, py] = pt(f, s, H); c.fillStyle = sd % 2 ? "#e9c24d" : "#d9544b"; c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.roundRect(px - 2, py - 8, 4, 6, 1.3); c.fill(); c.stroke(); c.fillStyle = "#c99a74"; c.beginPath(); c.arc(px, py - 9.5, 1.8, 0, 6.3); c.fill(); c.stroke(); }
}
// abra-style water taxi: wooden hull, flat canopy on posts, seated passengers
export function abra(k, u, v, dir, o = {}) {
  const c = k.ctx;
  const B = hullBoat(k, u, v, dir, { len: 1.25, wid: 0.44, h: 0.16, col: "#a8693a", hull: "#9a5e33", stripe: "#e9c24d", deck: "#c79a63", ...o });
  const { pt, H } = B;
  const pz = H + 0.42;
  const posts = [[-0.65, -0.8], [0.45, -0.8], [-0.65, 0.8], [0.45, 0.8]];
  // passengers on the centre bench
  for (const [f, sd] of [[-0.35, 901], [-0.05, 902], [0.25, 903]]) { const [px, py] = pt(f, 0, H); c.fillStyle = ["#f4f0e6", "#26222a", "#3e6fa8"][sd % 3]; c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.roundRect(px - 2.4, py - 9, 4.8, 7, 1.5); c.fill(); c.stroke(); c.fillStyle = "#c99a74"; c.beginPath(); c.arc(px, py - 10.8, 2, 0, 6.3); c.fill(); c.stroke(); }
  for (const [f, s] of posts) { const p0 = pt(f, s, H), p1 = pt(f, s, pz); c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(...p0); c.lineTo(...p1); c.stroke(); }
  k.path([pt(-0.8, -0.95, pz), pt(0.6, -0.95, pz), pt(0.6, 0.95, pz), pt(-0.8, 0.95, pz)], { fill: o.canopy || "#e7d3a6", lw: 1.2, wobble: 0 });
  k.path([pt(-0.8, 0.95, pz), pt(0.6, 0.95, pz), pt(0.6, 0.95, pz - 0.06), pt(-0.8, 0.95, pz - 0.06)], { fill: "#c8402f", lw: 0.8, wobble: 0 });
  // boatman at the stern
  const [bx, by] = pt(-0.85, 0, H); c.fillStyle = "#f6f3ec"; c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.roundRect(bx - 2.3, by - 12, 4.6, 10, 1.5); c.fill(); c.stroke(); c.fillStyle = "#b07a55"; c.beginPath(); c.arc(bx, by - 14, 2, 0, 6.3); c.fill(); c.stroke();
}
// V wake + foam on water at height z
export function wakeZ(k, u, v, dir, z, o = {}) {
  const c = k.ctx, t = k.t;
  let [a, b] = dir; const l = Math.hypot(a, b) || 1; a /= l; b /= l; const n = [-b, a], len = o.len ?? 1.8, w = o.w ?? 0.55;
  c.lineCap = "round";
  for (const sd of [-1, 1]) {
    const pts = []; for (let i = 0; i <= 10; i++) { const f = i / 10, wig = Math.sin(t * 6 + i * 1.3) * 0.02; pts.push(P(u - a * (0.55 + f * len) + n[0] * sd * (0.17 + f * w + wig), v - b * (0.55 + f * len) + n[1] * sd * (0.17 + f * w + wig), z)); }
    for (let i = 0; i < 10; i++) { c.strokeStyle = `rgba(255,255,255,${0.85 * (1 - i / 10)})`; c.lineWidth = 2.4 * (1 - i / 12); c.beginPath(); c.moveTo(...pts[i]); c.lineTo(...pts[i + 1]); c.stroke(); }
  }
  // churned water behind the stern
  for (let i = 0; i < 7; i++) { const f = (t * 1.1 + i / 7) % 1, [x, y] = P(u - a * (0.6 + f * len * 0.7), v - b * (0.6 + f * len * 0.7), z); c.fillStyle = `rgba(255,255,255,${0.75 * (1 - f)})`; c.beginPath(); c.ellipse(x + Math.sin(i * 2.1) * 2, y, 2.5 + f * 4, 1.2 + f * 1.6, 0, 0, 6.3); c.fill(); }
  // bow wave
  for (const sd of [-1, 1]) { const p = P(u + a * 0.62, v + b * 0.62, z), q = P(u + a * 0.3 + n[0] * sd * 0.26, v + b * 0.3 + n[1] * sd * 0.26, z); c.strokeStyle = "rgba(255,255,255,0.85)"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(...p); c.lineTo(...q); c.stroke(); }
}
export function openSample(path, d) { const sp = spline(path, false); return { ...sp.sample(clamp(d, 0, sp.L)), L: sp.L }; }

// ---------- people extras ----------
export function balloon(k, hand, col, t, ph, top) {
  const c = k.ctx, bx = hand[0] + Math.sin(t * 1.7 + ph) * 4, by = top - 24 + Math.sin(t * 2.3 + ph) * 2.5;
  c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.moveTo(hand[0], hand[1]); c.quadraticCurveTo(bx - 3, by + 14, bx, by + 7.5); c.stroke();
  c.beginPath(); c.ellipse(bx, by, 6.2, 7.4, 0, 0, 6.3); c.fillStyle = col; c.fill(); c.lineWidth = 1.4; c.stroke();
  c.fillStyle = "rgba(255,255,255,0.6)"; c.beginPath(); c.arc(bx - 2, by - 3, 1.7, 0, 6.3); c.fill();
  c.fillStyle = col; c.beginPath(); c.moveTo(bx - 1.6, by + 7.6); c.lineTo(bx + 1.6, by + 7.6); c.lineTo(bx, by + 5.6); c.fill();
}
// bougainvillea mass climbing a wall: magenta blossom clusters on dark leaves, gently swaying
export function bougain(k, x, y, w, h, seed = 1) {
  const c = k.ctx, R = rng(seed), t = k.t;
  const N = Math.round(w * h / 12);
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i < N; i++) {
    const fx = x + (R() - 0.5) * w, fy = y - R() * h * (1 - Math.abs(R() - 0.5) * 0.6), r = 2 + R() * 2.4, sw = Math.sin(t * 1.3 + i) * 0.6;
    if (pass === 0) { c.fillStyle = R() < 0.5 ? "#3f6e33" : "#4f8a3e"; c.beginPath(); c.arc(fx + sw, fy, r * 1.15, 0, 6.3); c.fill(); }
    else { c.fillStyle = ["#d4357a", "#e6559a", "#c22a6a", "#f07bb4"][Math.floor(R() * 4)]; c.beginPath(); c.arc(fx + sw, fy, r * 0.7, 0, 6.3); c.fill(); }
  }
}

// olive date palm (private copy of _props.dpalm with the reference's muted greens and fuller crown)
export function opalm(k, u, v, o = {}) {
  const c = k.ctx, t = k.t, h = o.h ?? 2.3, seed = o.seed ?? Math.round(u * 17 + v * 29), R = rng(seed * 13 + 5);
  const [bx, by] = P(u, v, 0), [tx0, ty] = P(u, v, h);
  const lean = (o.lean ?? (R() - 0.5) * 0.9) * CTS.S, tx = tx0 + lean;
  c.fillStyle = "rgba(60,45,30,0.16)"; c.beginPath(); c.ellipse(bx + 8, by + 2, 17, 5, 0, 0, 6.3); c.fill();
  // trunk
  const sway = Math.sin(t * 0.9 + seed) * 1.2;
  c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 7; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + lean * 0.1, (by + ty) / 2, tx + sway, ty); c.stroke();
  c.strokeStyle = "#9c7a52"; c.lineWidth = 4.6; c.stroke();
  c.strokeStyle = "rgba(70,44,22,0.55)"; c.lineWidth = 1; c.setLineDash([1.2, 4.2]); c.beginPath(); c.moveTo(bx - 1.5, by); c.quadraticCurveTo(bx + lean * 0.1 - 1.5, (by + ty) / 2, tx + sway - 1.5, ty); c.stroke(); c.setLineDash([]);
  const N = o.fronds ?? 20, L0 = (o.len ?? 1) * CTS.S * 1.05, frs = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + R() * 0.25, s = Math.sin(a);
    frs.push({ a, s, L: L0 * (0.8 + R() * 0.3), ph: R() * 6.28 });
  }
  frs.sort((p, q) => p.s - q.s);
  const cx = tx + sway, cy = ty;
  const draw = (f) => {
    const sw = Math.sin(t * 1.5 + f.ph) * 0.05;
    const dx = Math.cos(f.a + sw), dy = Math.sin(f.a + sw) * 0.48;
    const p0 = [cx, cy], p1 = [cx + dx * f.L * 0.5, cy + dy * f.L * 0.5 - f.L * 0.42], p2 = [cx + dx * f.L, cy + dy * f.L + f.L * 0.28 + Math.sin(t * 2 + f.ph) * 1.4];
    const pt = (s) => { const q = 1 - s; return [q * q * p0[0] + 2 * q * s * p1[0] + s * s * p2[0], q * q * p0[1] + 2 * q * s * p1[1] + s * s * p2[1]]; };
    const left = [], right = [], n = 14;
    for (let j = 0; j <= n; j++) {
      const s = j / n, a = pt(s), b = pt(Math.min(1, s + 0.03)), a2 = pt(Math.max(0, s - 0.03));
      const tx2 = b[0] - a2[0], ty2 = b[1] - a2[1], l = Math.hypot(tx2, ty2) || 1, nx = -ty2 / l, ny = tx2 / l;
      const w = Math.pow(Math.sin(Math.PI * Math.min(0.97, s * 0.92 + 0.06)), 0.8) * 6.2 * (o.wide ?? 1) * (j % 2 ? 1 : 0.62);
      left.push([a[0] + nx * w, a[1] + ny * w]); right.push([a[0] - nx * w, a[1] - ny * w]);
    }
    const poly = [...left, ...[...right].reverse()];
    c.beginPath(); poly.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
    c.fillStyle = f.s > 0.2 ? "#86a24c" : "#5f7f3a"; c.fill(); c.lineWidth = 1.5; c.strokeStyle = INK; c.lineJoin = "round"; c.stroke();
    c.strokeStyle = "rgba(210,225,150,0.6)"; c.lineWidth = 1; c.beginPath(); for (let j = 0; j <= n; j++) { const p = pt(j / n); j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke();
  };
  for (const f of frs) if (f.s < 0) draw(f);
  c.fillStyle = "#8a6a3e"; c.beginPath(); c.arc(cx, cy + 1, 3.6, 0, 6.3); c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  if (o.dates !== false) { c.fillStyle = "#d9892f"; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(cx - 3 + i * 2, cy + 4 + (i % 2), 1.5, 0, 6.3); c.fill(); } }
  for (const f of frs) if (f.s >= 0) draw(f);
}


// =====================================================================================
// Museum of the Future ring, drawn as an annulus between two measured screen ellipses.
// surface(θ, a) with a ∈ [0, π] across the visible half of the tube; the calligraphy is laid out
// in (ring length, tube arc) space so it foreshortens naturally toward both silhouettes.
// =====================================================================================
const hx = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mx = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgbs = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
const bez = (p0, p1, p2, p3, t) => { const q = 1 - t; return [q * q * q * p0[0] + 3 * q * q * t * p1[0] + 3 * q * t * t * p2[0] + t * t * t * p3[0], q * q * q * p0[1] + 3 * q * q * t * p1[1] + 3 * q * t * t * p2[1] + t * t * t * p3[1]]; };
function strokeShape(ctrl, wfn, n = 18) {
  const L = [], R = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, p = bez(...ctrl, t), q = bez(...ctrl, Math.min(1, t + 0.02)), r = bez(...ctrl, Math.max(0, t - 0.02));
    const tx = q[0] - r[0], ty = q[1] - r[1], l = Math.hypot(tx, ty) || 1, w = wfn(t);
    L.push([p[0] - (ty / l) * w, p[1] + (tx / l) * w]); R.push([p[0] + (ty / l) * w, p[1] - (tx / l) * w]);
  }
  return [...L, ...R.reverse()];
}
const rot = (pts, cx, cy, ang) => pts.map(([x, y]) => [cx + x * Math.cos(ang) - y * Math.sin(ang), cy + x * Math.sin(ang) + y * Math.cos(ang)]);
function makePattern(Lx, Ly, cw0, ch0, seed) {
  const R = rng(seed), out = [], nx = Math.round(Lx / cw0), ny = Math.max(3, Math.round(Ly / ch0)), cw = Lx / nx, ch = Ly / ny;
  const dia = (cx, cy, s, a) => out.push({ poly: rot([[s * 1.5, 0], [0, s], [-s * 1.5, 0], [0, -s]], cx, cy, a), dia: true });
  for (let iy = 0; iy < ny; iy++) {
    const cy = (iy + 0.5) * ch, sgn0 = iy % 2 ? -1 : 1;
    for (let ix = 0; ix < nx; ix++) {
      const cx = (ix + 0.5 + (iy % 2) * 0.5) * cw + (R() - 0.5) * cw * 0.1, flip = R() < 0.5 ? -1 : 1 * sgn0, ang = (R() - 0.5) * 0.5 + sgn0 * 0.12, r = R();
      const Ls = cw * (1.25 + R() * 0.3), W = ch * (0.15 + R() * 0.07), A = ch * (0.28 + R() * 0.16) * flip;
      let poly;
      if (r < 0.62) poly = strokeShape([[-Ls / 2, 0], [-Ls / 6, A], [Ls / 6, -A], [Ls / 2, 0]], (t) => W * Math.pow(Math.sin(Math.PI * Math.min(0.985, t * 0.97 + 0.015)), 0.7) * (1.3 - 0.6 * t));
      else if (r < 0.82) poly = strokeShape([[-Ls / 2, 0], [-Ls / 4, A * 2.1], [Ls / 4, A * 2.1], [Ls / 2, 0]], (t) => W * 1.1 * Math.pow(Math.sin(Math.PI * t), 0.8));
      else poly = strokeShape([[-Ls * 0.42, 0], [-Ls * 0.05, 0.05 * A], [Ls * 0.2, A * 1.9], [Ls * 0.44, A * 0.8]], (t) => W * 1.7 * Math.pow(1 - t, 1.1) * Math.sqrt(Math.min(1, t * 9 + 0.05)));
      out.push({ poly: rot(poly, cx, cy, ang) });
      if (R() < 0.65) dia(cx + cw * 0.5, cy + (R() < 0.5 ? -1 : 1) * ch * 0.05, ch * (0.08 + R() * 0.05), 0.2 + R() * 0.4);
      if (R() < 0.3) { const s2 = strokeShape([[-Ls * 0.15, 0], [-Ls * 0.05, -0.2 * ch], [Ls * 0.05, 0.2 * ch], [Ls * 0.15, 0]], (t) => W * 0.6 * Math.sin(Math.PI * Math.min(0.98, t + 0.01))); out.push({ poly: rot(s2, cx + cw * 0.5, cy + ch * 0.4 * (R() < 0.5 ? 1 : -1), ang) }); }
    }
  }
  for (const w of out) { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of w.poly) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } w.bb = [x0, x1, y0, y1]; }
  return out;
}
function clipHalfP(poly, f) { const out = []; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], fa = f(a), fb = f(b); if (fa >= 0) out.push(a); if ((fa >= 0) !== (fb >= 0)) { const s = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s]); } } return out; }
const clipY = (poly, y0, y1) => { let p = clipHalfP(poly, (q) => q[1] - y0); if (p.length < 3) return p; return clipHalfP(p, (q) => y1 - q[1]); };

export function makeRing(o = {}) {
  const OUT = { c: [568, 389], a: 283, b: 154, ang: -16 * Math.PI / 180, ...o.outer };
  const INN = { c: [627, 378], a: 138, b: 68, ang: -24 * Math.PI / 180, ...o.inner };
  const ell = (E, th) => { const x = E.a * Math.cos(th), y = E.b * Math.sin(th); return [E.c[0] + x * Math.cos(E.ang) - y * Math.sin(E.ang), E.c[1] + x * Math.sin(E.ang) + y * Math.cos(E.ang)]; };
  const NT = 150, NA = 22, Lx = 1500, Ly = 270;
  const eOf = (a) => (1 - Math.cos(a)) / 2;
  const surf = (th, a) => { const p = ell(OUT, th), q = ell(INN, th), e = eOf(a); return [p[0] + (q[0] - p[0]) * e, p[1] + (q[1] - p[1]) * e]; };
  const LIGHT = (() => { const v = [-0.42, -0.5, 0.75], l = Math.hypot(...v); return v.map((x) => x / l); })();
  const toS = (x, y) => surf((x / Lx) * 6.2832, (y / Ly) * Math.PI);
  let cache = null;
  function normal(th, a) { // screen-space normal of the tube at (th, a)
    const E = OUT, x = Math.cos(th) / E.a, y = Math.sin(th) / E.b, l = Math.hypot(x, y) || 1, nx0 = x / l, ny0 = y / l;
    const nx = nx0 * Math.cos(E.ang) - ny0 * Math.sin(E.ang), ny = nx0 * Math.sin(E.ang) + ny0 * Math.cos(E.ang);
    const ca = Math.cos(a), sa = Math.sin(a);
    return [nx * ca * 0.92, ny * ca * 0.92, sa * 0.85 + 0.1];
  }
  function silver(n, th, a) {
    const d = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
    let col = mx(hx("#8087aa"), hx("#dcdfee"), 0.12 + 0.88 * Math.pow(d, 0.9));
    if (n[1] > 0.1) col = mx(col, hx("#e6d2ae"), Math.min(0.7, n[1] * 0.9)); // warm ground bounce toward the bottom
    if (n[0] < -0.2) col = mx(col, hx("#ead7b6"), Math.min(0.35, -n[0] * 0.4));
    const ao = Math.pow(Math.max(0, (a / Math.PI - 0.8) / 0.2), 1.5); // dark where the tube turns into the hole
    col = mx(col, hx("#6c7088"), ao * 0.45);
    return { col, d };
  }
  function build() {
    const quads = [];
    for (let i = 0; i < NT; i++) for (let j = 0; j < NA; j++) {
      const t0 = (i / NT) * 6.2832, t1 = ((i + 1) / NT) * 6.2832, a0 = (j / NA) * Math.PI, a1 = ((j + 1) / NA) * Math.PI, tm = (t0 + t1) / 2, am = (a0 + a1) / 2;
      const pts = [surf(t0, a0), surf(t1, a0), surf(t1, a1), surf(t0, a1)], n = normal(tm, am), s = silver(n, tm, am);
      quads.push({ pts, col: s.col, d: s.d, cx: (pts[0][0] + pts[2][0]) / 2, cy: (pts[0][1] + pts[2][1]) / 2 });
    }
    const pat = makePattern(Lx, Ly, 62, 36, o.seed ?? 11), wins = [];
    for (const w of pat) for (const sx of [-Lx, 0, Lx]) for (const sy of [0]) {
      const b = w.bb; if (b[1] + sx < 0 || b[0] + sx > Lx) continue;
      let poly = w.poly.map(([x, y]) => [x + sx, y + sy]); poly = clipY(poly, 1, Ly - 1); if (poly.length < 3) continue;
      // subdivide long edges so the warp stays smooth
      const sub = []; for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length], m = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 7)); for (let k = 0; k < m; k++) sub.push([p[0] + (q[0] - p[0]) * k / m, p[1] + (q[1] - p[1]) * k / m]); }
      const pts = sub.map(([x, y]) => toS(x, y));
      let mxx = 0, myy = 0; for (const [x, y] of sub) { mxx += x; myy += y; } mxx /= sub.length; myy /= sub.length;
      const th = (mxx / Lx) * 6.2832, a = (myy / Ly) * Math.PI, n = normal(th, a), d = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
      const g = mx(hx("#2f607c"), hx("#8fbdd2"), Math.min(1, 0.12 + n[2] * 0.45 + d * 0.4));
      wins.push({ pts, col: g, cx: pts.reduce((s, p) => s + p[0], 0) / pts.length, cy: pts.reduce((s, p) => s + p[1], 0) / pts.length });
    }
    const outline = [], hole = [];
    for (let i = 0; i <= 200; i++) { outline.push(ell(OUT, (i / 200) * 6.2832)); hole.push(ell(INN, (i / 200) * 6.2832)); }
    // panel joints
    const joints = [];
    for (let i = 0; i < NT; i += 3) { const th = (i / NT) * 6.2832; joints.push([surf(th, 0.05), surf(th, Math.PI - 0.05)]); }
    const rings = []; for (let j = 3; j < NA; j += 3) { const pl = []; for (let i = 0; i <= NT; i += 2) pl.push(surf((i / NT) * 6.2832, (j / NA) * Math.PI)); rings.push(pl); }
    cache = { quads, wins, outline, hole, joints, rings };
  }
  const glint = (x, y, t) => {
    const per = 8.5, ph = ((t % per) + per) % per, sc = lerp(250, 1150, ph / 6), dd = x * 0.82 + y * 0.57 - sc;
    return 0.9 * Math.exp(-((dd / 16) ** 2)) + 0.3 * Math.exp(-((dd / 70) ** 2));
  };
  function draw(k, t) {
    if (!cache) build();
    const c = k.ctx, { quads, wins, outline, hole, joints, rings } = cache;
    // soft contact shadow under the lower rim
    c.save(); c.fillStyle = "rgba(55,45,35,0.2)"; c.beginPath(); outline.forEach(([x, y], i) => (i ? c.lineTo(x + 6, y + 14) : c.moveTo(x + 6, y + 14))); c.fill(); c.restore();
    for (const q of quads) {
      const g = glint(q.cx, q.cy, t) * (0.4 + 0.6 * q.d), col = rgbs(mx(q.col, [255, 255, 250], Math.min(0.85, g)));
      c.beginPath(); q.pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = col; c.lineWidth = 0.8; c.stroke();
    }
    c.strokeStyle = "rgba(80,86,110,0.16)"; c.lineWidth = 0.6; c.beginPath();
    for (const [a, b] of joints) { c.moveTo(...a); c.lineTo(...b); }
    for (const pl of rings) pl.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
    c.lineJoin = "round";
    for (const w of wins) {
      const g = glint(w.cx, w.cy, t);
      c.beginPath(); w.pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
      c.fillStyle = rgbs(mx(w.col, [238, 248, 255], Math.min(0.9, g * 1.1))); c.fill();
      c.strokeStyle = "rgba(150,125,95,0.55)"; c.lineWidth = 2; c.stroke(); c.strokeStyle = "rgba(30,42,58,0.85)"; c.lineWidth = 0.8; c.stroke();
    }
    // glass sheen: pale line along the top edge of each pane
    c.strokeStyle = INK; c.lineWidth = 2.2;
    c.beginPath(); outline.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.stroke();
    c.beginPath(); hole.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.stroke();
  }
  return { draw, OUT, INN, ell };
}
