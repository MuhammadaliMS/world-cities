// Ain Dubai: the giant observation wheel on Bluewaters Island, rebuilt on the isometric grid.
// The wheel stands in a vertical plane along u (centre cu, cv, hub height hz): every rim point is
// P(cu + r cos a, cv, hz + r sin a), so it reads as an ellipse. Double rim (truss between rings, cross
// members joining the two rims), cable spokes from both ends of the hub drum, 40 capsules that hang level
// from the rim as the wheel turns, two A-frame leg pairs splayed along v either side of the wheel plane,
// and the round boarding pavilion (glass drum, roof terrace, upper ring, entrance) beneath the rim.
import { P, CTS, INK, shade, lerp, clamp, rng } from "../../lib/vec-kit.js";

const WH = "#f2ece1", WH_M = "#e2d9c9", WH_D = "#c9bda9", WH_S = "#a99b85";
const CABLE = "rgba(92,82,70,0.62)";
const GLASS = "#8fbdd0", GLASS_D = "#5f8ea6";

export function makeAinDubai(o = {}) {
  const CU = o.cu ?? 5, CV = o.cv ?? 3.2, HZ = o.hz ?? 5.6, R = o.r ?? 4.2;
  const HUB = [CU, CV, HZ];
  const RO = R, R2 = R - 0.13, RI = R - 0.34, RC = R + 0.52; // outer ring, second ring, inner ring, capsule centres (world units)
  const DV = 0.22, HL = 0.5, HR = 0.4; // half spacing of the two rims, half length + radius of the hub drum (along v)
  const NCAB = 40, NSP = 48, OMEGA = 0.07; // capsules, spoke pairs, rad/s
  const Pw = (a, r, dv = 0) => P(CU + Math.cos(a) * r, CV + dv, HZ + Math.sin(a) * r);
  const PH = (a, r, dv) => P(CU + Math.cos(a) * r, CV + dv, HZ + Math.sin(a) * r); // same, for hub discs

  const FEET = { BL: [CU - 0.65, CV - 2.25], BR: [CU + 0.65, CV - 2.25], FL: [CU - 0.65, CV + 2.25], FR: [CU + 0.65, CV + 2.25] };
  const PED = 0.42; // plinth height
  const LEGS = {
    BL: { f: FEET.BL, top: P(CU - 0.12, CV - HL - 0.02, HZ - 0.12), wb: 24, wt: 15 },
    BR: { f: FEET.BR, top: P(CU + 0.12, CV - HL - 0.02, HZ - 0.12), wb: 24, wt: 15 },
    FL: { f: FEET.FL, top: P(CU - 0.12, CV + HL + 0.02, HZ - 0.12), wb: 27, wt: 17 },
    FR: { f: FEET.FR, top: P(CU + 0.12, CV + HL + 0.02, HZ - 0.12), wb: 27, wt: 17 },
  };
  const PC = o.pav || [CU, CV]; // pavilion centre
  const EA = o.ea ?? 0.25; // entrance direction (radians from +u toward +v)

  const poly = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
  function stroke2(c, pts, w, col, ink = INK, close = false) {
    c.lineCap = "round"; c.lineJoin = "round";
    c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); if (close) c.closePath();
    c.strokeStyle = ink; c.lineWidth = w + 1.6; c.stroke();
    c.strokeStyle = col; c.lineWidth = w; c.stroke();
  }

  // ---------- plinth + tapered leg ----------
  function plinth(k, f) {
    const [u, v] = f, c = k.ctx;
    k.box(u - 0.48, v - 0.48, 0, 0.96, 0.96, 0.12, "#e4dccd", { hatch: false });
    k.box(u - 0.38, v - 0.38, 0.12, 0.76, 0.76, 0.2, "#ece5d8", { hatch: false, shadow: false });
    // chevron relief on the two visible faces (the stepped "teeth" in the reference)
    c.strokeStyle = "rgba(90,74,55,0.55)"; c.lineWidth = 0.9; c.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -0.38 + 0.76 * (i + 0.5) / 5;
      const l0 = P(u + a - 0.06, v + 0.38, 0.14), l1 = P(u + a, v + 0.38, 0.28), l2 = P(u + a + 0.06, v + 0.38, 0.14);
      const r0 = P(u + 0.38, v + a - 0.06, 0.14), r1 = P(u + 0.38, v + a, 0.28), r2 = P(u + 0.38, v + a + 0.06, 0.14);
      c.moveTo(...l0); c.lineTo(...l1); c.lineTo(...l2); c.moveTo(...r0); c.lineTo(...r1); c.lineTo(...r2);
    }
    c.stroke();
    k.box(u - 0.27, v - 0.27, 0.32, 0.54, 0.54, PED - 0.32, "#f4efe6", { hatch: false, shadow: false });
  }
  function leg(k, L, o2 = {}) {
    const c = k.ctx, [fx, fy] = P(L.f[0], L.f[1], PED - 0.02), [tx, ty] = L.top;
    const dx = tx - fx, dy = ty - fy, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
    const wB = L.wb / 2, wT = L.wt / 2;
    // sleeve flare at the foot
    const fl = [[fx + nx * (wB + 5), fy + ny * (wB + 5)], [fx - nx * (wB + 5), fy - ny * (wB + 5)], [fx - nx * wB + ux * 18, fy - ny * wB + uy * 18], [fx + nx * wB + ux * 18, fy + ny * wB + uy * 18]];
    const body = [[fx + nx * wB, fy + ny * wB], [tx + nx * wT, ty + ny * wT], [tx - nx * wT, ty - ny * wT], [fx - nx * wB, fy - ny * wB]];
    // light comes from the upper left: the side whose normal points left is lit
    const litSide = nx < 0 ? 1 : -1;
    const g = c.createLinearGradient(fx + nx * wB * litSide, fy + ny * wB * litSide, fx - nx * wB * litSide, fy - ny * wB * litSide);
    const dim = o2.back ? -0.06 : 0;
    g.addColorStop(0, shade(WH, 0.3 + dim)); g.addColorStop(0.35, shade(WH, dim)); g.addColorStop(0.75, shade(WH_D, dim)); g.addColorStop(1, shade(WH_S, dim));
    poly(c, body); c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.6; c.lineJoin = "round"; c.stroke();
    // seam + highlight lines along the tube
    c.lineCap = "round";
    c.strokeStyle = "rgba(255,255,255,0.75)"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(fx + nx * wB * 0.55 * litSide + ux * 20, fy + ny * wB * 0.55 * litSide + uy * 20); c.lineTo(tx + nx * wT * 0.55 * litSide, ty + ny * wT * 0.55 * litSide); c.stroke();
    c.strokeStyle = "rgba(110,95,75,0.35)"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(fx - nx * wB * 0.35 * litSide + ux * 20, fy - ny * wB * 0.35 * litSide + uy * 20); c.lineTo(tx - nx * wT * 0.35 * litSide, ty - ny * wT * 0.35 * litSide); c.stroke();
    // segment joints (ring collars) along the leg
    for (const f of [0.34, 0.68]) {
      const w = lerp(wB, wT, f), px = fx + dx * f, py = fy + dy * f;
      c.strokeStyle = "rgba(90,76,58,0.55)"; c.lineWidth = 1; c.beginPath(); c.moveTo(px + nx * w, py + ny * w); c.quadraticCurveTo(px + uy * 0 + ux * -3, py + uy * -3 + 2, px - nx * w, py - ny * w); c.stroke();
    }
    // flared sleeve drawn over the body
    const gs = c.createLinearGradient(fl[0][0], fl[0][1], fl[1][0], fl[1][1]);
    gs.addColorStop(0, litSide > 0 ? "#fbf7ef" : WH_D); gs.addColorStop(1, litSide > 0 ? WH_D : "#fbf7ef");
    poly(c, fl); c.fillStyle = gs; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke();
    c.strokeStyle = "rgba(90,76,58,0.5)"; c.lineWidth = 0.8; c.beginPath();
    for (let i = 1; i < 4; i++) { const s = -1 + i / 2; c.moveTo(fx + nx * (wB + 5) * s, fy + ny * (wB + 5) * s); c.lineTo(fx + nx * wB * s + ux * 18, fy + ny * wB * s + uy * 18); }
    c.stroke();
  }

  // ---------- rim / spokes / capsules / hub ----------
  const ring = (r, dv, n = 120) => Array.from({ length: n }, (_, i) => Pw((i / n) * Math.PI * 2, r, dv));
  function rimLayer(c, rot, dv, alpha, front) {
    c.save(); c.globalAlpha = alpha;
    const NT = 120;
    c.strokeStyle = front ? "rgba(88,76,60,0.9)" : "rgba(110,98,82,0.7)"; c.lineWidth = front ? 1.0 : 0.8; c.beginPath();
    for (let i = 0; i < NT; i++) {
      const a0 = rot + (i / NT) * Math.PI * 2, a1 = rot + ((i + 1) / NT) * Math.PI * 2;
      const p0 = Pw(a0, RI + 0.02, dv), p1 = Pw((a0 + a1) / 2, R2 - 0.02, dv), p2 = Pw(a1, RI + 0.02, dv);
      c.moveTo(...p0); c.lineTo(...p1); c.lineTo(...p2);
      if (i % 3 === 0) { c.moveTo(...Pw(a0, RI, dv)); c.lineTo(...Pw(a0, RO, dv)); }
    }
    c.stroke();
    if (front) { const o1 = ring(RO, dv), i1 = ring(RI, dv); c.beginPath(); o1.forEach((p, j) => (j ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); i1.forEach((p, j) => (j ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.fillStyle = "rgba(240,233,220,0.5)"; c.fill("evenodd"); }
    stroke2(c, ring(RI, dv), front ? 2.2 : 1.6, front ? WH : WH_M, INK, true);
    stroke2(c, ring(R2, dv), front ? 1.4 : 1.1, front ? WH_M : WH_D, INK, true);
    stroke2(c, ring(RO, dv), front ? 2.8 : 2, front ? WH : WH_M, INK, true);
    if (front) { c.strokeStyle = "rgba(255,255,255,0.85)"; c.lineWidth = 1; c.beginPath(); for (let i = 0; i <= 40; i++) { const p = Pw(Math.PI * 0.45 + (i / 40) * Math.PI * 0.75, RO, dv); i ? c.lineTo(...p) : c.moveTo(...p); } c.stroke(); }
    if (front) { c.fillStyle = WH_D; for (let i = 0; i < NSP; i++) { const p = Pw(rot + (i / NSP) * Math.PI * 2, RI, dv); c.beginPath(); c.arc(p[0], p[1], 1.6, 0, 6.3); c.fill(); } }
    c.restore();
  }
  function spokes(c, rot, side) { // side +1 front (hub front end to the front rim), -1 back
    c.lineWidth = 0.75; c.strokeStyle = CABLE; c.beginPath();
    for (let i = 0; i < NSP; i++) {
      const a = rot + (i / NSP) * Math.PI * 2;
      c.moveTo(...PH(a, HR * 0.75, side * HL)); c.lineTo(...Pw(a + side * 0.045, RI - 0.02, side * DV));
    }
    c.stroke();
  }
  function crossMembers(c, rot) {
    c.strokeStyle = "rgba(90,78,62,0.75)"; c.lineWidth = 0.9; c.beginPath();
    for (let i = 0; i < 60; i++) { const a = rot + (i / 60) * Math.PI * 2; c.moveTo(...Pw(a, RO, -DV)); c.lineTo(...Pw(a, RO, DV)); c.moveTo(...Pw(a, RI, -DV)); c.lineTo(...Pw(a, RI, DV)); }
    c.stroke();
  }
  function capsule(c, th, i, t) {
    const [rx, ry] = Pw(th, RO + 0.03), [x, y] = Pw(th, RC);
    c.lineCap = "round";
    c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.moveTo(rx, ry); c.lineTo(x, y); c.stroke();
    c.strokeStyle = WH_D; c.lineWidth = 1.8; c.stroke();
    const w = 16, h = 10.5, sway = Math.sin(t * 1.3 + i * 0.9) * 0.25; // tiny level-keeping wobble
    c.save(); c.translate(x, y); c.rotate(sway * 0.06);
    c.beginPath(); c.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
    const g = c.createLinearGradient(0, -h, 0, h); g.addColorStop(0, "#fbf8f2"); g.addColorStop(0.5, "#e6e0d6"); g.addColorStop(1, "#bfb6a8");
    c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
    c.beginPath(); c.ellipse(0, 0.6, w - 1.8, h - 3.4, 0, 0, Math.PI * 2);
    const gg = c.createLinearGradient(-w, 0, w, 0); gg.addColorStop(0, "#b8dae6"); gg.addColorStop(0.45, GLASS); gg.addColorStop(1, GLASS_D);
    c.fillStyle = gg; c.fill(); c.strokeStyle = "rgba(42,36,32,0.8)"; c.lineWidth = 0.8; c.stroke();
    c.save(); c.clip();
    if (i % 3 !== 1) { const Rr = rng(i * 17 + 3); for (let j = 0; j < 2 + (i % 2); j++) { const px = -7 + j * 6 + Rr() * 2, col = ["#d9544b", "#f4f0e6", "#2f4b6c", "#e9c24d", "#26222a"][Math.floor(Rr() * 5)]; c.fillStyle = col; c.fillRect(px - 1.6, 1, 3.2, 4); c.fillStyle = "#c99a74"; c.beginPath(); c.arc(px, -0.6, 1.4, 0, 6.3); c.fill(); } }
    c.strokeStyle = "rgba(240,236,228,0.95)"; c.lineWidth = 1.1; c.beginPath();
    for (const mx of [-7.5, -2.5, 2.5, 7.5]) { c.moveTo(mx, -h); c.lineTo(mx * 1.05, h); }
    c.stroke();
    c.fillStyle = "rgba(255,255,255,0.35)"; c.beginPath(); c.ellipse(-4, -2.5, 6, 1.6, -0.15, 0, 6.3); c.fill();
    c.restore();
    c.fillStyle = "#f6f2ea"; c.beginPath(); c.ellipse(0, -h + 1.4, 5, 1.6, 0, 0, 6.3); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
    c.restore();
  }
  const disc2 = (dv, r, n = 40) => Array.from({ length: n }, (_, i) => PH((i / n) * Math.PI * 2, r, dv));
  function hull(pts) { // convex hull (monotone chain) of screen points
    const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o2, a, b) => (a[0] - o2[0]) * (b[1] - o2[1]) - (a[1] - o2[1]) * (b[0] - o2[0]);
    const lo = []; for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    const up = []; for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  function hubBarrel(c) { // the drum along v: back disc, barrel hull, ribs
    const back = disc2(-HL, HR), front = disc2(HL, HR);
    poly(c, back); c.fillStyle = WH_D; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke();
    const h = hull([...back, ...front]);
    const [x0, y0] = P(CU - HR, CV, HZ + HR), [x1, y1] = P(CU + HR, CV, HZ - HR);
    const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, "#fbf8f2"); g.addColorStop(0.45, WH_M); g.addColorStop(1, WH_S);
    poly(c, h); c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke();
    c.strokeStyle = "rgba(90,76,58,0.55)"; c.lineWidth = 0.9;
    for (let i = 1; i < 7; i++) { const dv = lerp(-HL, HL, i / 7); c.beginPath(); disc2(dv, HR + 0.005).forEach((p, j) => (j ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.stroke(); }
  }
  function hubFront(c, rot) {
    const f = disc2(HL, HR);
    poly(c, f);
    const [x0, y0] = P(CU - HR, CV, HZ + HR), [x1, y1] = P(CU + HR, CV, HZ - HR);
    const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, "#fffdf8"); g.addColorStop(1, WH_D);
    c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
    poly(c, disc2(HL + 0.01, HR * 0.68)); c.strokeStyle = "rgba(90,76,58,0.6)"; c.lineWidth = 1; c.stroke();
    c.fillStyle = "#8d806d";
    for (let i = 0; i < 10; i++) { const a = rot + (i / 10) * Math.PI * 2, p = PH(a, HR * 0.5, HL + 0.01); c.beginPath(); c.arc(p[0], p[1], 0.9, 0, 6.3); c.fill(); }
    poly(c, disc2(HL + 0.02, HR * 0.22)); c.fillStyle = WH_M; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  }

  // ---------- boarding pavilion ----------
  function ringPts(r, z, a0 = 0, a1 = Math.PI * 2, n = 64) { const out = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); out.push(P(PC[0] + Math.cos(a) * r, PC[1] + Math.sin(a) * r, z)); } return out; }
  // front half of a ring = angles where the point is nearer the viewer: from (1,-1)/√2 round through (1,1) to (-1,1)
  const F0 = -Math.PI / 4, F1 = Math.PI * 3 / 4;
  function drum(c, r, z0, z1, fill, o2 = {}) {
    const top = ringPts(r, z1, F0, F1), bot = ringPts(r, z0, F0, F1);
    poly(c, [...bot, ...[...top].reverse()]);
    const [xl] = P(PC[0] - r * 0.707, PC[1] + r * 0.707, 0), [xr] = P(PC[0] + r * 0.707, PC[1] - r * 0.707, 0);
    const g = c.createLinearGradient(xl, 0, xr, 0);
    for (const [s, col] of fill) g.addColorStop(s, col);
    c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = o2.lw ?? 1.4; c.stroke();
    return { top, bot };
  }
  function disc(c, r, z, col, lw = 1.4) { const p = ringPts(r, z, 0, Math.PI * 2, 72); poly(c, p); c.fillStyle = col; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); }


  function pavilion(k, t) {
    const c = k.ctx;
    // soft shadow
    k.ell(PC[0] + 0.35, PC[1] + 0.2, 0, 1.6, "rgba(60,45,30,0.14)", { stroke: false });
    // ground floor glass drum with warm-lit interior
    const g0 = drum(c, 1.42, 0, 0.95, [[0, "#cfe3e8"], [0.35, "#9ec4d2"], [0.7, "#6f9db4"], [1, "#4f7e98"]]);
    c.save(); poly(c, [...g0.bot, ...[...g0.top].reverse()]); c.clip();
    // interior glow: golden shop light behind the glass
    for (let i = 0; i < 26; i++) {
      const a = lerp(F0, F1, (i + 0.5) / 26), cu = PC[0] + Math.cos(a) * 1.42, cv = PC[1] + Math.sin(a) * 1.42;
      const [x, y] = P(cu, cv, 0.15), [, y2] = P(cu, cv, 0.72);
      const gl = c.createLinearGradient(0, y2, 0, y); gl.addColorStop(0, "rgba(255,214,130,0.0)"); gl.addColorStop(0.5, "rgba(250,196,105,0.55)"); gl.addColorStop(1, "rgba(214,150,70,0.55)");
      c.fillStyle = gl; c.fillRect(x - 4, y2, 8, y - y2);
      if (i % 3 === 1) { c.fillStyle = "rgba(255,236,170,0.9)"; c.beginPath(); c.arc(x, y2 + 3, 1.6, 0, 6.3); c.fill(); }
    }
    // mullions + transom
    c.strokeStyle = "rgba(235,230,220,0.95)"; c.lineWidth = 1.5; c.beginPath();
    for (let i = 0; i <= 22; i++) { const a = lerp(F0, F1, i / 22), cu = PC[0] + Math.cos(a) * 1.42, cv = PC[1] + Math.sin(a) * 1.42; c.moveTo(...P(cu, cv, 0)); c.lineTo(...P(cu, cv, 0.95)); }
    c.stroke();
    c.strokeStyle = "rgba(42,36,32,0.5)"; c.lineWidth = 0.8; c.beginPath();
    for (let i = 0; i <= 22; i++) { const a = lerp(F0, F1, i / 22), cu = PC[0] + Math.cos(a) * 1.42, cv = PC[1] + Math.sin(a) * 1.42; const [x0, y0] = P(cu, cv, 0), [, y1] = P(cu, cv, 0.95); c.moveTo(x0 + 1, y0); c.lineTo(x0 + 1, y1); }
    c.stroke();
    k.line(ringPts(1.42, 0.68, F0, F1), { lw: 1, stroke: "rgba(235,230,220,0.9)", wobble: 0 });
    // sky reflection sweep
    const sweep = ((t * 0.08) % 1.6) - 0.3; const [sx] = P(PC[0] - 1.0 + sweep * 1.4, PC[1] + 1.0 - sweep * 1.4, 0);
    const gs = c.createLinearGradient(sx - 14, 0, sx + 14, 0); gs.addColorStop(0, "rgba(255,255,255,0)"); gs.addColorStop(0.5, "rgba(255,255,255,0.32)"); gs.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = gs; c.fillRect(sx - 14, 0, 28, 1024);
    c.restore();
    // plinth band at the foot of the glass
    drum(c, 1.44, 0, 0.08, [[0, "#efe6d4"], [1, "#c9bba1"]], { lw: 1.1 });
    // roof slab (big canopy) with fascia
    disc(c, 1.56, 0.95, "#efe7d8");
    drum(c, 1.56, 0.95, 1.15, [[0, "#fbf7ef"], [0.6, "#e6dccb"], [1, "#c8bba5"]]);
    disc(c, 1.56, 1.15, "#f3ece0");
    // terrace deck + glass railing round the edge (back half first)
    disc(c, 1.46, 1.16, "#e8dcc4", 0.8);
    // upper ring (glass) set back
    drum(c, 1.0, 1.15, 1.68, [[0, "#d8ebef"], [0.4, "#a9cddb"], [0.8, "#7aa6bd"], [1, "#5d8aa3"]]);
    c.save(); { const a = ringPts(1.0, 1.68, F0, F1), b = ringPts(1.0, 1.15, F0, F1); poly(c, [...b, ...[...a].reverse()]); c.clip(); }
    c.strokeStyle = "rgba(235,230,220,0.9)"; c.lineWidth = 1.2; c.beginPath();
    for (let i = 0; i <= 18; i++) { const a = lerp(F0, F1, i / 18), cu = PC[0] + Math.cos(a) * 1.0, cv = PC[1] + Math.sin(a) * 1.0; c.moveTo(...P(cu, cv, 1.15)); c.lineTo(...P(cu, cv, 1.68)); }
    c.stroke();
    for (let i = 0; i < 9; i++) { const a = lerp(F0, F1, (i + 0.5) / 9), [x, y] = P(PC[0] + Math.cos(a) * 1.0, PC[1] + Math.sin(a) * 1.0, 1.42); c.fillStyle = "rgba(255,226,150,0.55)"; c.fillRect(x - 3, y - 6, 6, 8); }
    c.restore();
    k.line(ringPts(1.0, 1.45, F0, F1), { lw: 1.2, stroke: "#f3ece0", wobble: 0 });
    // top roof + rooftop railing posts
    disc(c, 1.08, 1.68, "#f3ece0");
    drum(c, 1.08, 1.68, 1.78, [[0, "#fbf7ef"], [1, "#cbbfa9"]], { lw: 1.2 });
    disc(c, 1.08, 1.78, "#efe6d6", 1.2);
    disc(c, 0.55, 1.79, "#e4d9c4", 0.9); // service hatch
    // glass railing on the lower terrace (front half, over the upper drum's foot)
    const rt = ringPts(1.48, 1.38, F0, F1), rb = ringPts(1.48, 1.16, F0, F1);
    poly(c, [...rb, ...[...rt].reverse()]); c.fillStyle = "rgba(190,225,235,0.45)"; c.fill();
    k.line(rt, { lw: 1.6, stroke: INK, wobble: 0 }); k.line(rt, { lw: 0.8, stroke: "#f6f1e8", wobble: 0 });
    c.strokeStyle = "rgba(42,36,32,0.6)"; c.lineWidth = 0.8; c.beginPath();
    for (let i = 0; i <= 28; i++) { const a = lerp(F0, F1, i / 28), cu = PC[0] + Math.cos(a) * 1.48, cv = PC[1] + Math.sin(a) * 1.48; c.moveTo(...P(cu, cv, 1.16)); c.lineTo(...P(cu, cv, 1.38)); }
    c.stroke();
    // a few visitors on the terrace
    for (let i = 0; i < 4; i++) {
      const a = lerp(0.1, 1.9, i / 3) + Math.sin(t * 0.3 + i) * 0.06, [x, y] = P(PC[0] + Math.cos(a) * 1.32, PC[1] + Math.sin(a) * 1.32, 1.16), bob = Math.sin(t * 2 + i) * 0.4;
      c.fillStyle = ["#d9544b", "#f4f0e6", "#3e6fa8", "#26222a"][i]; c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.roundRect(x - 2.2, y - 10 + bob, 4.4, 7, 1.5); c.fill(); c.stroke();
      c.fillStyle = "#d9a882"; c.beginPath(); c.arc(x, y - 12 + bob, 2, 0, 6.3); c.fill(); c.stroke();
    }
    // entrance: projecting canopy, revolving door, gold sign on the fascia
    const ea = EA, eu = PC[0] + Math.cos(ea) * 1.42, ev = PC[1] + Math.sin(ea) * 1.42;
    const tu = -Math.sin(ea), tv = Math.cos(ea), nu = Math.cos(ea), nv = Math.sin(ea);
    const Q = (s, d, z) => P(eu + tu * s + nu * d, ev + tv * s + nv * d, z);
    k.path([Q(-0.32, 0.02, 0), Q(0.32, 0.02, 0), Q(0.32, 0.02, 0.62), Q(-0.32, 0.02, 0.62)], { fill: "#5a4632", lw: 1.2, wobble: 0 });
    const spin = t * 1.2;
    for (let i = 0; i < 4; i++) { const a = spin + i * Math.PI / 2, s = Math.cos(a) * 0.22; const [x0, y0] = Q(s, 0.06, 0.02), [, y1] = Q(s, 0.06, 0.58); c.strokeStyle = `rgba(200,230,240,${0.5 + 0.4 * Math.abs(Math.sin(a))})`; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0, y1); c.stroke(); }
    c.fillStyle = "rgba(255,210,120,0.35)"; poly(c, [Q(-0.3, 0.03, 0.02), Q(0.3, 0.03, 0.02), Q(0.3, 0.03, 0.6), Q(-0.3, 0.03, 0.6)]); c.fill();
    // canopy slab on two posts
    for (const s of [-0.4, 0.4]) { const [x0, y0] = Q(s, 0.42, 0), [, y1] = Q(s, 0.42, 0.7); c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0, y1); c.stroke(); c.strokeStyle = WH_M; c.lineWidth = 1.2; c.stroke(); }
    k.path([Q(-0.48, 0, 0.7), Q(0.48, 0, 0.7), Q(0.48, 0.5, 0.7), Q(-0.48, 0.5, 0.7)], { fill: "#f6f0e4", lw: 1.3, wobble: 0 });
    k.path([Q(-0.48, 0.5, 0.7), Q(0.48, 0.5, 0.7), Q(0.48, 0.5, 0.8), Q(-0.48, 0.5, 0.8)], { fill: "#d8ccb6", lw: 1.1, wobble: 0 });
    k.path([Q(-0.48, 0, 0.8), Q(0.48, 0, 0.8), Q(0.48, 0.5, 0.8), Q(-0.48, 0.5, 0.8)], { fill: "#fbf8f1", lw: 1.2, wobble: 0 });
    // sign
    const [sx2, sy2] = P(PC[0] + Math.cos(ea) * 1.57, PC[1] + Math.sin(ea) * 1.57, 1.19);
    c.save(); c.fillStyle = "#b8862e"; c.font = "bold 7px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("AIN DUBAI", sx2, sy2); c.restore();
  }

  // ---------- public layers ----------
  const wring = (r, n = 90, sx = 0.25, sv = 0.45) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2, z = HZ + Math.sin(a) * r; return P(clamp(CU + Math.cos(a) * r + z * sx, 0.3, 9.7), clamp(CV + z * sv, 0.3, 9.7), 0); });
  function shadow(k) {
    const c = k.ctx;
    // the wheel's shadow falls toward the front-right: rim ring and the filled disc
    c.save(); k._trace([P(0.3, 0.3), P(9.7, 0.3), P(9.7, 9.7), P(0.3, 9.7)], true, 0); c.clip();
    c.fillStyle = "rgba(70,55,40,0.05)"; poly(c, wring(RO)); c.fill();
    c.strokeStyle = "rgba(70,55,40,0.12)"; c.lineWidth = 3; poly(c, wring(RO)); c.stroke();
    c.restore();
    for (const L of Object.values(LEGS)) k.ell(L.f[0] + 0.3, L.f[1] + 0.1, 0, 0.55, "rgba(60,45,30,0.14)", { stroke: false });
  }
  function drawBackLegs(k) { for (const id of ["BL", "BR"]) { plinth(k, LEGS[id].f); leg(k, LEGS[id], { back: true }); } }
  const lowCab = (th) => Math.sin(th) <= -0.88;
  function drawWheel(k, t) {
    const c = k.ctx, rot = -t * OMEGA; // clockwise
    rimLayer(c, rot, -DV, 0.9, false);
    spokes(c, rot, -1);
    hubBarrel(c);
    crossMembers(c, rot);
    spokes(c, rot, 1);
    rimLayer(c, rot, DV, 1, true);
    for (let i = 0; i < NCAB; i++) { const th = rot + (i / NCAB) * Math.PI * 2; if (!lowCab(th)) capsule(c, th, i, t); }
  }
  // capsules at the very bottom (boarding) are drawn just before the pavilion so its roof overlaps them
  function drawBoarding(k, t) { const c = k.ctx, rot = -t * OMEGA; for (let i = 0; i < NCAB; i++) { const th = rot + (i / NCAB) * Math.PI * 2; if (lowCab(th)) capsule(c, th, i, t); } }
  function drawFrontLeg(k, id) { plinth(k, LEGS[id].f); leg(k, LEGS[id]); }
  function drawHubCap(k, t) { hubFront(k.ctx, -t * OMEGA); }

  return { shadow, drawBackLegs, drawWheel, drawBoarding, pavilion, drawFrontLeg, drawHubCap, LEGS, PC, HUB, EA, CU, CV, HZ, R };
}
