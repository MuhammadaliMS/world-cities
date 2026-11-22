// Helpers for the Tokyo 1,1 grid pass (copied from the old tile where they were already built on P()).
import { P, CTS, INK, shade, lerp, clamp, rng, hash } from "../../lib/vec-kit.js";
import { chochin } from "./_props.js";
export const pl = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
// convex prism over a (u,v) footprint, any orientation: visible sides (facing the viewer) + top
function prism(k, pts, z0, z1, col, o = {}) {
  const c = k.ctx, n = pts.length;
  let A = 0; for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; A += a[0] * b[1] - b[0] * a[1]; }
  const faces = [];
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n], eu = b[0] - a[0], ev = b[1] - a[1];
    const nu = A > 0 ? ev : -ev, nv = A > 0 ? -eu : eu; // outward normal (CCW in u,v when A>0)
    if (nu + nv > 1e-6) faces.push({ a, b, s: (nu - nv) / (Math.hypot(nu, nv) * Math.SQRT2), d: a[0] + a[1] + b[0] + b[1] });
  }
  faces.sort((x, y) => x.d - y.d);
  for (const f of faces) {
    const q = [P(f.a[0], f.a[1], z0), P(f.b[0], f.b[1], z0), P(f.b[0], f.b[1], z1), P(f.a[0], f.a[1], z1)];
    pl(c, q); c.fillStyle = shade(o.side || col, lerp(-0.05, -0.22, (f.s + 1) / 2)); c.fill();
    if (o.lw !== 0) { c.strokeStyle = INK; c.lineWidth = o.lw ?? 1.1; c.lineJoin = "round"; c.stroke(); }
    if (o.face) o.face(f, q);
  }
  if (o.top !== false) { const tp = pts.map(([u, v]) => P(u, v, z1)); pl(c, tp); c.fillStyle = o.topCol || shade(col, 0.06); c.fill(); if (o.lw !== 0) { c.strokeStyle = INK; c.lineWidth = o.lw ?? 1.1; c.stroke(); } return tp; }
}

// ---------- props ----------
function palm(k, u, v, o = {}) {
  const c = k.ctx, t = k.t, h = o.h ?? 1.8, seed = o.seed ?? 1, lean = (o.lean ?? 0.2) * CTS.S;
  k.ell(u + 0.55, v + 0.2, 0, 0.55, "rgba(60,45,30,0.13)", { stroke: false });
  const [bx, by] = P(u, v, 0), tx = bx + lean, ty = by - h * CTS.S * CTS.ZS;
  const cx = bx + lean * 0.1, cy = (by + ty) / 2;
  const q = (s) => [(1 - s) * (1 - s) * bx + 2 * (1 - s) * s * cx + s * s * tx, (1 - s) * (1 - s) * by + 2 * (1 - s) * s * cy + s * s * ty];
  const sway = Math.sin(t * 1.2 + seed * 1.7) * 0.07 + Math.sin(t * 2.3 + seed) * 0.025;
  const fronds = [];
  const N = 9;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + seed * 0.9 + sway * (1 + (i % 3) * 0.3), L = CTS.S * (0.82 + 0.22 * hash(seed * 7 + i));
    fronds.push({ a, L, back: Math.sin(a) < -0.15 });
  }
  const frond = (f) => {
    const ex = tx + Math.cos(f.a) * f.L, ey = ty + Math.sin(f.a) * f.L * 0.42 + f.L * 0.42;
    const mx = tx + Math.cos(f.a) * f.L * 0.55, my = ty + Math.sin(f.a) * f.L * 0.22 - f.L * 0.3;
    const cv = (s) => [(1 - s) * (1 - s) * tx + 2 * (1 - s) * s * mx + s * s * ex, (1 - s) * (1 - s) * ty + 2 * (1 - s) * s * my + s * s * ey];
    const L1 = [], L2 = [];
    const M = 14;
    for (let j = 0; j <= M; j++) {
      const s = j / M, p = cv(s), p2 = cv(Math.min(1, s + 0.02)), dx = p2[0] - p[0], dy = p2[1] - p[1], dl = Math.hypot(dx, dy) || 1;
      const nx = -dy / dl, ny = dx / dl, w = f.L * 0.2 * Math.pow(Math.sin(Math.PI * Math.min(1, s * 1.08)), 0.8) * (j % 2 ? 0.55 : 1);
      L1.push([p[0] + nx * w + dx * 3, p[1] + ny * w + dy * 3 + w * 0.25]); L2.push([p[0] - nx * w * 0.85 + dx * 3, p[1] - ny * w * 0.85 + dy * 3 + w * 0.3]);
    }
    const col = f.back ? "#5d8f47" : "#74a957";
    pl(c, [...L1, ...[...L2].reverse()]); c.fillStyle = col; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.1; c.lineJoin = "round"; c.stroke();
    pl(c, [...L1, ...[...L1].reverse().map((p, j) => { const s = 1 - j / M, b = cv(s); return [b[0], b[1]]; })]); c.fillStyle = shade(col, 0.14); c.fill();
    c.strokeStyle = shade(col, -0.35); c.lineWidth = 0.9; c.beginPath(); for (let j = 0; j <= 10; j++) { const p = cv(j / 10); j ? c.lineTo(...p) : c.moveTo(...p); } c.stroke();
  };
  for (const f of fronds) if (f.back) frond(f);
  // trunk: tapered, ringed
  const lft = [], rgt = [];
  for (let j = 0; j <= 12; j++) { const s = j / 12, p = q(s), w = lerp(4.6, 2.8, s); lft.push([p[0] - w, p[1]]); rgt.push([p[0] + w, p[1]]); }
  pl(c, [...lft, ...[...rgt].reverse()]); c.fillStyle = "#a47c55"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
  c.strokeStyle = "rgba(70,45,25,0.6)"; c.lineWidth = 0.8;
  for (let j = 1; j < 16; j++) { const s = j / 16, p = q(s), w = lerp(4.6, 2.8, s); c.beginPath(); c.moveTo(p[0] - w, p[1] - 1); c.quadraticCurveTo(p[0], p[1] + 1.6, p[0] + w, p[1] - 1); c.stroke(); }
  c.fillStyle = "rgba(255,240,210,0.25)"; pl(c, [...lft, ...lft.map((p, j) => [p[0] + 2, p[1]]).reverse()]); c.fill();
  // coconuts
  for (const [dx, dy] of [[-3, 4], [2.5, 5], [0, 2]]) { c.beginPath(); c.arc(tx + dx, ty + dy, 2.6, 0, 6.3); c.fillStyle = "#7a5a2a"; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke(); }
  for (const f of fronds) if (!f.back) frond(f);
}
function umbrella(k, u, v, cols, o = {}) {
  const c = k.ctx, h = o.h ?? 1.05, r = o.r ?? 0.5, t = k.t;
  k.ell(u + 0.35, v + 0.12, 0, r * 1.05, "rgba(60,45,30,0.15)", { stroke: false });
  const [x, y] = P(u, v, 0), [, yt] = P(u, v, h);
  const tilt = Math.sin(t * 0.9 + u * 3) * 0.6;
  c.strokeStyle = INK; c.lineWidth = 2.6; c.lineCap = "round"; c.beginPath(); c.moveTo(x, y); c.lineTo(x + tilt, yt); c.stroke(); c.strokeStyle = "#e8e2d4"; c.lineWidth = 1.2; c.stroke();
  const rx = r * CTS.S * 1.3, ry = rx * 0.42, hh = ry * 1.25, apx = x + tilt, apy = yt - hh, cy = yt + ry * 0.15;
  const n = 8, segs = [];
  for (let i = 0; i < n; i++) segs.push({ i, a0: (i / n) * Math.PI * 2, a1: ((i + 1) / n) * Math.PI * 2 });
  segs.sort((A, B) => Math.sin((A.a0 + A.a1) / 2) - Math.sin((B.a0 + B.a1) / 2));
  for (const s of segs) {
    const pts = [[apx, apy]];
    for (let j = 0; j <= 4; j++) { const a = lerp(s.a0, s.a1, j / 4); pts.push([x + tilt + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
    pl(c, pts); const back = Math.sin((s.a0 + s.a1) / 2) < 0;
    c.fillStyle = shade(cols[s.i % cols.length], back ? -0.12 : Math.cos((s.a0 + s.a1) / 2) > 0.3 ? -0.08 : 0.04); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1; c.lineJoin = "round"; c.stroke();
  }
  // scalloped rim on the front half
  c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.ellipse(x + tilt, cy, rx, ry, 0, 0, Math.PI); c.stroke();
  c.fillStyle = "#e8e2d4"; c.beginPath(); c.arc(apx, apy - 1, 1.8, 0, 6.3); c.fill(); c.lineWidth = 0.8; c.stroke();
}
function cabana(k, u, v, col, t) {
  const c = k.ctx, du = 0.62, dv = 0.55, h = 0.55;
  const f = k.box(u, v, 0, du, dv, h, "#f6f2ea", { hatch: false });
  // vertical stripes on both faces
  for (let i = 0; i < 6; i += 2) { k.poly([[u + (du * i) / 6, v + dv, 0], [u + (du * (i + 1)) / 6, v + dv, 0], [u + (du * (i + 1)) / 6, v + dv, h], [u + (du * i) / 6, v + dv, h]], col, { lw: 0.6, wobble: 0 }); }
  for (let i = 0; i < 6; i += 2) { k.poly([[u + du, v + (dv * i) / 6, 0], [u + du, v + (dv * (i + 1)) / 6, 0], [u + du, v + (dv * (i + 1)) / 6, h], [u + du, v + (dv * i) / 6, h]], shade(col, -0.2), { lw: 0.6, wobble: 0 }); }
  // door flap open on the L face
  k.poly([[u + 0.2, v + dv, 0], [u + 0.42, v + dv, 0], [u + 0.42, v + dv, 0.42], [u + 0.2, v + dv, 0.42]], "#5a4a3c", { lw: 0.8, wobble: 0 });
  // pyramid roof with stripes + pennant
  const ap = [u + du / 2, v + dv / 2, h + 0.4];
  k.poly([[u - 0.05, v + dv + 0.05, h], [u + du + 0.05, v + dv + 0.05, h], ap], col, { lw: 1, wobble: 0 });
  k.poly([[u + du + 0.05, v - 0.05, h], [u + du + 0.05, v + dv + 0.05, h], ap], shade(col, -0.22), { lw: 1, wobble: 0 });
  const [px, py] = P(...ap), w = Math.sin(t * 5 + u) * 1.5;
  c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(px, py); c.lineTo(px, py - 10); c.stroke();
  k.path([[px, py - 10], [px + 7, py - 8 + w], [px, py - 6]], { fill: col, lw: 0.8, wobble: 0 });
}
function towel(k, u, v, col, dir = "u") {
  const [du, dv] = dir === "u" ? [0.75, 0.35] : [0.35, 0.75];
  k.poly([[u, v, 0.01], [u + du, v, 0.01], [u + du, v + dv, 0.01], [u, v + dv, 0.01]], col, { lw: 0.9, wobble: 0 });
  const c = k.ctx; c.strokeStyle = "rgba(255,255,255,0.75)"; c.lineWidth = 1.2; c.beginPath();
  for (const f of [0.3, 0.7]) { const a = dir === "u" ? P(u + du * f, v, 0.01) : P(u, v + dv * f, 0.01), b = dir === "u" ? P(u + du * f, v + dv, 0.01) : P(u + du, v + dv * f, 0.01); c.moveTo(...a); c.lineTo(...b); }
  c.stroke();
}
function planterBox(k, u, v, du, dv, seed, o = {}) {
  k.box(u, v, 0, du, dv, 0.22, o.col || "#cbbba0", { hatch: false, shadow: false });
  k.flowers(u + 0.04, v + 0.04, du - 0.08, dv - 0.08, { seed, cols: o.cols || ["#f39ac0", "#e8607a", "#ffffff", "#f6b6cf", "#d94a5c"] });
}
function sandcastle(k, u, v) {
  const c = k.ctx;
  k.box(u, v, 0, 0.36, 0.3, 0.12, "#e3c88e", { hatch: false, shadow: false, lw: 1 });
  for (const [du, dv] of [[0.04, 0.04], [0.24, 0.04], [0.04, 0.2], [0.24, 0.2]]) k.cyl(u + du + 0.04, v + dv + 0.03, 0.12, 0.05, 0.12, "#e0c387");
  const [x, y] = P(u + 0.18, v + 0.15, 0.36); c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x, y + 4); c.lineTo(x, y - 6); c.stroke();
  k.path([[x, y - 6], [x + 5, y - 4.5], [x, y - 3]], { fill: "#d64e46", lw: 0.7, wobble: 0 });
  // bucket
  const [bx, by] = P(u + 0.55, v + 0.3, 0); c.fillStyle = "#3f8fd0"; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.moveTo(bx - 3.5, by - 7); c.lineTo(bx + 3.5, by - 7); c.lineTo(bx + 2.6, by); c.lineTo(bx - 2.6, by); c.closePath(); c.fill(); c.stroke();
}

function bil(q, s, r) { const [a, b, c2, d] = q; const top = [lerp(a[0], b[0], s), lerp(a[1], b[1], s)], bot = [lerp(d[0], c2[0], s), lerp(d[1], c2[1], s)]; return [lerp(top[0], bot[0], r), lerp(top[1], bot[1], r)]; }
function boatState(t, cx, cy, ru, rv, ang, period, ph, dir = 1) {
  const a = dir * (t / period) * Math.PI * 2 + ph, ca = Math.cos(ang), sa = Math.sin(ang);
  const lx = Math.cos(a) * ru, ly = Math.sin(a) * rv, tx = -Math.sin(a) * ru * dir, ty = Math.cos(a) * rv * dir;
  return { u: cx + lx * ca - ly * sa, v: cy + lx * sa + ly * ca, fu: tx * ca - ty * sa, fv: tx * sa + ty * ca };
}
function wake(k, path, t, n, spread, o = {}) {
  const c = k.ctx;
  for (let i = 1; i <= n; i++) {
    const s = path(t - i * (o.dt ?? 0.18));
    const L = Math.hypot(s.fu, s.fv) || 1, fu = s.fu / L, fv = s.fv / L, su = -fv, sv = fu, w = 0.12 + i * spread;
    const a = P(s.u + su * w, s.v + sv * w), b = P(s.u - su * w, s.v - sv * w), m = P(s.u, s.v);
    const al = (o.a ?? 0.75) * (1 - i / (n + 1));
    c.strokeStyle = `rgba(255,255,255,${al})`; c.lineWidth = 1.6 - i * 0.04; c.lineCap = "round";
    c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(a[0] + (m[0] - a[0]) * 0.18, a[1] + (m[1] - a[1]) * 0.18 + 1); c.moveTo(b[0], b[1]); c.lineTo(b[0] + (m[0] - b[0]) * 0.18, b[1] + (m[1] - b[1]) * 0.18 + 1); c.stroke();
    if (i < n * 0.5) { c.fillStyle = `rgba(255,255,255,${al * 0.5})`; c.beginPath(); c.ellipse(m[0], m[1], 3 + i * 0.6, 1.2 + i * 0.2, 0, 0, 6.3); c.fill(); }
  }
}
function local(s) { const L = Math.hypot(s.fu, s.fv) || 1, fu = s.fu / L, fv = s.fv / L; return (x, y) => [s.u + fu * x - fv * y, s.v + fv * x + fu * y]; }
function yakatabune(k, s, t) {
  const c = k.ctx, Lc = local(s), bob = Math.sin(t * 1.9) * 0.015;
  const hull = [[1.0, 0], [0.78, 0.27], [-0.82, 0.27], [-0.96, 0.18], [-0.96, -0.18], [-0.82, -0.27], [0.78, -0.27]].map(([x, y]) => Lc(x, y));
  c.fillStyle = "rgba(20,60,70,0.25)"; pl(c, hull.map(([u, v]) => P(u + 0.1, v + 0.05, 0))); c.fill();
  prism(k, hull, bob, 0.17 + bob, "#7a5233", { topCol: "#b08456", face: (f, q) => { c.strokeStyle = "rgba(40,20,10,0.45)"; c.lineWidth = 0.7; c.beginPath(); const a2 = bil([q[3], q[2], q[1], q[0]], 0, 0.45), b2 = bil([q[3], q[2], q[1], q[0]], 1, 0.45); c.moveTo(...a2); c.lineTo(...b2); c.stroke(); } });
  // bow rail
  for (const y of [-0.2, 0.2]) { const a = P(...Lc(0.62, y), 0.17 + bob), b = P(...Lc(0.9, y * 0.3), 0.17 + bob); c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(a[0], a[1] - 5); c.lineTo(b[0], b[1] - 5); c.moveTo(a[0], a[1]); c.lineTo(a[0], a[1] - 5); c.moveTo(b[0], b[1]); c.lineTo(b[0], b[1] - 5); c.stroke(); }
  // cabin: dark wood posts framing warm shoji panels
  const cab = [[0.56, 0.21], [-0.8, 0.21], [-0.8, -0.21], [0.56, -0.21]].map(([x, y]) => Lc(x, y));
  prism(k, cab, 0.17 + bob, 0.47 + bob, "#6a4429", {
    topCol: "#6a4429",
    face: (f, q) => {
      const Q = [q[3], q[2], q[1], q[0]], n = Math.max(2, Math.round(Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]) / 11));
      for (let i = 0; i < n; i++) {
        const w = [bil(Q, (i + 0.12) / n, 0.1), bil(Q, (i + 0.88) / n, 0.1), bil(Q, (i + 0.88) / n, 0.8), bil(Q, (i + 0.12) / n, 0.8)];
        pl(c, w); c.fillStyle = `rgb(255,${208 + Math.round(18 * Math.sin(t * 2.5 + i * 1.7))},${128 + Math.round(20 * Math.sin(t * 1.7 + i))})`; c.fill(); c.strokeStyle = "rgba(60,30,15,0.8)"; c.lineWidth = 0.6; c.stroke();
        const m0 = bil(Q, (i + 0.5) / n, 0.1), m1 = bil(Q, (i + 0.5) / n, 0.8); c.beginPath(); c.moveTo(...m0); c.lineTo(...m1); c.stroke();
      }
    },
  });
  // low-pitched tiled roof with eaves: far slope first, then near slope
  const z0 = 0.49 + bob, zr = 0.58 + bob;
  const e = (x, y) => P(...Lc(x, y), z0), r = (x) => P(...Lc(x, 0), zr);
  const sideA = [e(0.68, 0.3), e(-0.92, 0.3), r(-0.92), r(0.68)], sideB = [e(0.68, -0.3), e(-0.92, -0.3), r(-0.92), r(0.68)];
  const dA = Lc(0, 0.3), dB = Lc(0, -0.3), nearA = dA[0] + dA[1] > dB[0] + dB[1];
  for (const [side, near] of nearA ? [[sideB, false], [sideA, true]] : [[sideA, false], [sideB, true]]) {
    pl(c, side); c.fillStyle = near ? "#7b6450" : "#5e4b3b"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.1; c.lineJoin = "round"; c.stroke();
    c.strokeStyle = "rgba(40,28,20,0.5)"; c.lineWidth = 0.7; c.beginPath();
    for (let i = 1; i < 14; i++) { const f = i / 14, a = [lerp(side[0][0], side[1][0], f), lerp(side[0][1], side[1][1], f)], b = [lerp(side[3][0], side[2][0], f), lerp(side[3][1], side[2][1], f)]; c.moveTo(...a); c.lineTo(...b); }
    c.stroke();
  }
  const rg = [r(0.72), r(-0.96)]; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(...rg[0]); c.lineTo(...rg[1]); c.stroke(); c.strokeStyle = "#4a3a2c"; c.lineWidth = 1.6; c.stroke();
  // red chochin along the near eave
  const ne = nearA ? [e(0.6, 0.3), e(-0.84, 0.3)] : [e(0.6, -0.3), e(-0.84, -0.3)];
  for (let i = 0; i < 8; i++) { const f = (i + 0.5) / 8; chochin(k, lerp(ne[0][0], ne[1][0], f), lerp(ne[0][1], ne[1][1], f) + 6, { r: 2.6, col: "#e0453a", seed: i, drop: 1.5, amp: 0.6, glow: i % 2 === 0 }); }
  const m = P(s.u, s.v); const g = c.createRadialGradient(m[0], m[1] + 8, 2, m[0], m[1] + 8, 60); g.addColorStop(0, "rgba(255,200,120,0.22)"); g.addColorStop(1, "rgba(255,200,120,0)"); c.fillStyle = g; c.beginPath(); c.arc(m[0], m[1] + 8, 60, 0, 6.3); c.fill();
  // lantern reflections in the water
  for (let i = 0; i < 6; i++) { const f = (i + 0.5) / 6, x = lerp(ne[0][0], ne[1][0], f), y = Math.max(ne[0][1], ne[1][1]) + 26 + (i % 2) * 4; c.fillStyle = `rgba(255,190,110,${0.5 + 0.3 * Math.sin(t * 3 + i)})`; c.fillRect(x - 2 + Math.sin(t * 2 + i) * 1.5, y, 4, 1.6); c.fillRect(x - 1.5, y + 4, 3, 1.4); }
}
function waterBus(k, s, t) {
  // small white Tokyo water bus with a blue stripe and a glass cabin
  const c = k.ctx, Lc = local(s), bob = Math.sin(t * 2.6 + 1) * 0.012;
  const hull = [[0.62, 0], [0.4, 0.2], [-0.5, 0.2], [-0.55, 0], [-0.5, -0.2], [0.4, -0.2]].map(([x, y]) => Lc(x, y));
  c.fillStyle = "rgba(20,60,70,0.22)"; pl(c, hull.map(([u, v]) => P(u + 0.08, v + 0.04, 0))); c.fill();
  prism(k, hull, bob, 0.18 + bob, "#f4f4f2", { topCol: "#dfe3e8", face: (f, q) => { pl(c, [bil([q[3], q[2], q[1], q[0]], 0, 0.45), bil([q[3], q[2], q[1], q[0]], 1, 0.45), bil([q[3], q[2], q[1], q[0]], 1, 0.62), bil([q[3], q[2], q[1], q[0]], 0, 0.62)]); c.fillStyle = "#2f6fc0"; c.fill(); } });
  const cab = [[0.2, 0.13], [-0.4, 0.13], [-0.4, -0.13], [0.2, -0.13]].map(([x, y]) => Lc(x, y));
  prism(k, cab, 0.18 + bob, 0.38 + bob, "#9fd0e6", { topCol: "#eef0f2", lw: 1 });
}
function paddler(k, s, t) {
  const c = k.ctx, Lc = local(s);
  const board = [[0.45, 0], [0.3, 0.08], [-0.38, 0.08], [-0.42, 0], [-0.38, -0.08], [0.3, -0.08]].map(([x, y]) => Lc(x, y));
  pl(c, board.map(([u, v]) => P(u, v, 0.02))); c.fillStyle = "#f2c84a"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  const p = k.person(s.u, s.v, { pose: "stand", dir: [s.fu, s.fv], z: 0.04, seed: 507, top: "#e85d4a", bottom: "#25334b", shorts: true });
  // paddle: alternating strokes
  const ph = Math.sin(t * 2.2), hx = p.hand[0], hy = p.hand[1];
  c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath(); c.moveTo(hx - 2, hy - 8); c.lineTo(hx + ph * 8, hy + 14); c.stroke();
  c.fillStyle = "#3a5f8a"; c.beginPath(); c.ellipse(hx + ph * 8, hy + 14, 2.2, 3.6, 0.3, 0, 6.3); c.fill();
  if (Math.abs(ph) > 0.8) { c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 1; c.beginPath(); c.ellipse(hx + ph * 9, hy + 17, 5, 1.6, 0, 0, 6.3); c.stroke(); }
}
function wader(k, u, v, seed, t, o = {}) {
  const c = k.ctx;
  const p = k.person(u, v, { pose: o.pose || "stand", dir: o.dir || [0.6, 0.5], z: -0.24 + Math.sin(t * 1.5 + seed) * 0.015, seed, shorts: true, kid: o.kid, top: o.top, bag: false, hat: null });
  const [x, y] = P(u, v, 0);
  c.fillStyle = "#56bcc0"; c.beginPath(); c.ellipse(x, y + 5, 11, 7, 0, 0, Math.PI); c.lineTo(x - 11, y + 1); c.ellipse(x, y + 1, 11, 4, 0, Math.PI, 0); c.fill();
  c.fillStyle = "#5fc3c4"; c.fillRect(x - 11, y + 1, 22, 9);
  const r = (t * 0.8 + seed * 0.37) % 1;
  c.strokeStyle = `rgba(255,255,255,${0.9 * (1 - r)})`; c.lineWidth = 1.3; c.beginPath(); c.ellipse(x, y + 1, 7 + r * 10, 2.4 + r * 3.4, 0, 0, 6.3); c.stroke();
  if (o.splash) { const sp = Math.max(0, Math.sin(t * 3 + seed)); c.fillStyle = `rgba(255,255,255,${0.8 * sp})`; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(p.hand[0] + Math.cos(i * 1.3) * 5 * sp, p.hand[1] + 8 - sp * (6 + i * 1.5), 1.3, 0, 6.3); c.fill(); } }
}

// ---------- the Gundam enclosure ----------
export { prism, palm, umbrella, cabana, towel, planterBox, sandcastle, bil, boatState, wake, local, yakatabune, waterBus, paddler, wader };
