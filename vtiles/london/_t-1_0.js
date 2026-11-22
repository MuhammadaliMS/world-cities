// tile-local props for london -1,0 (Notting Hill & Regent's Canal): market stalls with goods, narrowboats
// with pointed hulls, painted panels and roof clutter, Victorian lamps, quay railings, ducks.
import { P, INK, shade, lerp, clamp, rng } from "../../lib/vec-kit.js";

// ---------- an extruded polygon: visible side faces (outward normal toward the viewer) then the top ----------
export function prism(k, pts, z0, h, col, o = {}) {
  let area = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; area += a[0] * b[1] - b[0] * a[1]; }
  const sgn = area > 0 ? 1 : -1, faces = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const nu = (b[1] - a[1]) * sgn, nv = -(b[0] - a[0]) * sgn;
    if (nu + nv <= 0.001) continue;
    faces.push({ a, b, d: (a[0] + b[0] + a[1] + b[1]) / 2, frac: clamp(nu / (nu + nv + 1e-6)) });
  }
  faces.sort((p, q) => p.d - q.d);
  for (const f of faces) {
    const bands = o.bands || [[0, h, col]];
    for (const [za, zb, bc] of bands) k.path([P(f.a[0], f.a[1], z0 + za), P(f.b[0], f.b[1], z0 + za), P(f.b[0], f.b[1], z0 + zb), P(f.a[0], f.a[1], z0 + zb)], { fill: shade(bc, -0.04 - 0.14 * f.frac), lw: o.lw ?? 1, wobble: 0 });
  }
  if (o.top !== false) k.path(pts.map(([u, v]) => P(u, v, z0 + h)), { fill: o.topCol || shade(col, 0.08), lw: o.lw ?? 1, wobble: 0 });
  return faces;
}

// ---------- market stall in a frame: origin o=[u,v], w = along unit, n = outward unit ----------
// kinds: antiques, flowers, brass, china
export function stall(k, F, o = {}) {
  const c = k.ctx, t = k.t, L = o.len ?? 1.35, Dp = o.depth ?? 0.9, c1 = o.c1 || "#d64e46", c2 = "#f7f1e3";
  const g3 = (a, d, z) => [F.o[0] + F.w[0] * a + F.n[0] * d, F.o[1] + F.w[1] * a + F.n[1] * d, z];
  const A = (a, d, z) => P(...g3(a, d, z));
  const R = rng(o.seed ?? 3);
  k.shadow([g3(-0.1, 0, 0), g3(L + 0.1, 0, 0), g3(L + 0.25, Dp + 0.35, 0), g3(-0.05, Dp + 0.35, 0)], 0.12);
  const post = (a, d, z1) => { const [x, y] = A(a, d, 0), [, yt] = A(a, d, z1); c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt); c.stroke(); c.strokeStyle = "#9a7448"; c.lineWidth = 1.8; c.stroke(); };
  post(0.03, 0, 1.76); post(L - 0.03, 0, 1.76);
  // back board / cloth
  k.path([A(0, 0, 0.62), A(L, 0, 0.62), A(L, 0, 1.7), A(0, 0, 1.7)], { fill: o.back || "#7a5a3e", lw: 0.9, wobble: 0 });
  const kind = o.kind || "antiques";
  // hung goods on the back board
  if (kind === "antiques" || kind === "brass") {
    for (let i = 0; i < 4; i++) {
      const [x, y] = A(0.18 + i * (L - 0.36) / 3, 0.01, 1.08 + (i % 2) * 0.16);
      const big = kind === "brass" && i % 2 === 0;
      c.beginPath(); c.ellipse(x, y, big ? 6.5 : 4.6, big ? 8 : 5.8, 0, 0, 7); c.fillStyle = "#d9a83a"; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
      c.beginPath(); c.ellipse(x, y, big ? 4.6 : 3.2, big ? 6 : 4.3, 0, 0, 7); c.fillStyle = i % 2 ? "#cfe4ec" : "#e8f1f4"; c.fill();
      c.strokeStyle = "rgba(255,255,255,0.9)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - 1.5, y - 2.5); c.lineTo(x + 1, y - 4.5); c.stroke();
    }
  } else if (kind === "china") {
    for (let i = 0; i < 6; i++) { const [x, y] = A(0.14 + i * (L - 0.28) / 5, 0.01, 1.0 + (i % 2) * 0.22); c.beginPath(); c.arc(x, y, 3.6, 0, 7); c.fillStyle = "#f4f6f8"; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.7; c.stroke(); c.strokeStyle = "#3f66b0"; c.lineWidth = 1; c.beginPath(); c.arc(x, y, 2.2, 0, 7); c.stroke(); }
  } else {
    // flower stall: bunches hung upside down drying
    for (let i = 0; i < 7; i++) { const [x, y] = A(0.1 + i * (L - 0.2) / 6, 0.01, 1.38); c.strokeStyle = "#5e8f45"; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 6); c.stroke(); c.fillStyle = ["#c86fb5", "#f4c542", "#e8607a", "#ffffff"][i % 4]; c.beginPath(); c.arc(x, y + 8, 2.6, 0, 7); c.fill(); }
  }
  // the stallholder stands between the board and the table
  if (o.keeper) o.keeper(g3(L * (o.keeperAt ?? 0.55), 0.28, 0));
  // table: top + cloth skirt
  const tz = 0.62, ta = 0.06, tb = L - 0.06, td0 = Math.min(0.4, Dp * 0.45), td1 = Dp + 0.02;
  for (const [a, d] of [[ta + 0.03, td1 - 0.03], [tb - 0.03, td1 - 0.03]]) { const [x, y] = A(a, d, 0), [, yt] = A(a, d, tz); c.strokeStyle = "#6a4a2c"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt); c.stroke(); }
  // under the table: crates / a trunk / buckets
  if (kind === "flowers") {
    for (let i = 0; i < 4; i++) { const [cu, cv] = g3(0.25 + i * (L - 0.5) / 3, Dp + 0.22, 0); k.cyl(cu, cv, 0, 0.1, 0.24, "#a9b2b8", { topCol: "#56803f" }); const [x, y] = P(cu, cv, 0.28); for (let j = 0; j < 9; j++) { c.fillStyle = j < 3 ? "#5e8f45" : ["#c86fb5", "#f08bb5", "#f4c542", "#ffffff", "#e8607a", "#9c7ad0"][(i * 2 + j) % 6]; c.beginPath(); c.arc(x + (j % 3 - 1) * 3.4 + (j > 5 ? 1.5 : 0), y - 2 - Math.floor(j / 3) * 2.4, 2.4, 0, 7); c.fill(); } }
  } else {
    const [bu, bv] = g3(L * 0.6, Dp * 0.65, 0);
    k.path([A(L * 0.42, Dp * 0.5, 0), A(L * 0.78, Dp * 0.5, 0), A(L * 0.78, Dp * 0.5, 0.26), A(L * 0.42, Dp * 0.5, 0.26)], { fill: "#8a5a34", lw: 0.8, wobble: 0 });
    void bu; void bv;
  }
  k.path([A(ta, td0, tz), A(tb, td0, tz), A(tb, td1, tz), A(ta, td1, tz)], { fill: o.cloth || "#e9a7b0", lw: 0.9, wobble: 0 });
  k.path([A(ta, td1, tz), A(tb, td1, tz), A(tb, td1, tz - 0.36), A(ta, td1, tz - 0.36)], { fill: shade(o.cloth || "#e9a7b0", -0.1), lw: 0.9, wobble: 0 });
  k.path([A(tb, td0, tz), A(tb, td1, tz), A(tb, td1, tz - 0.36), A(tb, td0, tz - 0.36)], { fill: shade(o.cloth || "#e9a7b0", -0.2), lw: 0.8, wobble: 0 });
  // goods on the table, back row then front row
  const items = [];
  for (let row = 0; row < 2; row++) for (let i = 0; i < 5; i++) items.push([0.16 + i * (L - 0.32) / 4 + row * 0.08, td0 + 0.1 + row * (td1 - td0 - 0.2), (i + row * 2 + (o.seed || 0)) % 5]);
  for (const [a, d, j] of items) {
    const [x0, y0] = A(a, d, tz); c.save(); c.translate(x0, y0); c.scale(1.35, 1.35); const x = 0, y = 0;
    if (kind === "flowers") {
      c.fillStyle = "#b9c2c6"; c.strokeStyle = INK; c.lineWidth = 0.6; c.beginPath(); c.roundRect(x - 3, y - 6, 6, 6, 1); c.fill(); c.stroke();
      for (let q = 0; q < 6; q++) { c.fillStyle = q < 2 ? "#5e8f45" : ["#c86fb5", "#f08bb5", "#f4c542", "#ffffff", "#e8607a", "#9c7ad0"][(j + q) % 6]; c.beginPath(); c.arc(x + (q % 3 - 1) * 2.6, y - 8 - Math.floor(q / 3) * 2.6, 2.2, 0, 7); c.fill(); }
    } else if (kind === "china" || (kind === "antiques" && j % 3 === 2)) {
      // blue-and-white jug / teapot
      c.fillStyle = "#eef2f6"; c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.ellipse(x, y - 3.6, 3.2, 3.8, 0, 0, 7); c.fill(); c.stroke();
      c.strokeStyle = "#3f66b0"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x - 2.5, y - 3.6); c.lineTo(x + 2.5, y - 3.6); c.stroke();
      c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.arc(x + 3.6, y - 3.8, 1.6, -1.4, 1.4); c.stroke();
    } else if (kind === "antiques" && j % 3 === 0 || kind === "brass" && j % 2 === 0) {
      // table lamp with a pleated shade (lit)
      c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 7); c.stroke();
      c.fillStyle = "#c8a24a"; c.beginPath(); c.ellipse(x, y - 1, 3, 1.3, 0, 0, 7); c.fill();
      c.fillStyle = "#f6dc8a"; c.beginPath(); c.moveTo(x - 3, y - 7); c.lineTo(x + 3, y - 7); c.lineTo(x + 4.6, y - 13); c.lineTo(x - 4.6, y - 13); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.7; c.stroke();
      c.fillStyle = "rgba(255,226,140,0.35)"; c.beginPath(); c.arc(x, y - 9, 7, 0, 7); c.fill();
    } else if (kind === "brass") {
      c.fillStyle = "#d4a23a"; c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.ellipse(x, y - 3, 3.6, 3, 0, 0, 7); c.fill(); c.stroke();
      c.fillStyle = "#f2d27a"; c.beginPath(); c.arc(x - 1, y - 4, 1, 0, 7); c.fill();
    } else {
      // mantel clock or framed picture
      c.fillStyle = "#7a4a2a"; c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.roundRect(x - 3, y - 8, 6, 8, 1.5); c.fill(); c.stroke();
      c.fillStyle = "#f4ecd6"; c.beginPath(); c.arc(x, y - 5, 1.9, 0, 7); c.fill();
      c.strokeStyle = INK; c.lineWidth = 0.5; c.beginPath(); c.moveTo(x, y - 5); c.lineTo(x + Math.cos(t * 0.5) * 1.5, y - 5 + Math.sin(t * 0.5) * 1.5); c.stroke();
    }
    c.restore();
  }
  post(0.03, Dp, 1.5); post(L - 0.03, Dp, 1.5);
  // awning: stripes running front-to-back, sloping down to the front, scalloped valance
  const n = o.stripes ?? 8, zb = 1.78, zf = 1.5, d0 = -0.06, d1 = Dp + 0.12, ea = -0.08, eb = L + 0.08;
  const sway = Math.sin(t * 1.6 + (o.seed || 0)) * 0.6;
  for (let i = 0; i < n; i++) {
    const a = lerp(ea, eb, i / n), b = lerp(ea, eb, (i + 1) / n), col = i % 2 ? c2 : c1;
    k.path([A(a, d0, zb), A(b, d0, zb), A(b, d1, zf), A(a, d1, zf)], { fill: col, lw: 0.8, wobble: 0 });
    const [x0, y0] = A(a, d1, zf), [x1, y1] = A(b, d1, zf), drop = 6.5;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineTo(x1 + sway, y1 + drop - 2); c.quadraticCurveTo((x0 + x1) / 2 + sway, (y0 + y1) / 2 + drop + 4, x0 + sway, y0 + drop - 2); c.closePath();
    c.fillStyle = col; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
  }
  // shading toward the back of the awning
  k.path([A(ea, d0, zb), A(eb, d0, zb), A(eb, lerp(d0, d1, 0.3), lerp(zb, zf, 0.3)), A(ea, lerp(d0, d1, 0.3), lerp(zb, zf, 0.3))], { fill: "rgba(80,60,40,0.10)", stroke: false, wobble: 0 });
  // side valance on the visible end
  { const p0 = A(eb, d0, zb), p1 = A(eb, d1, zf); c.beginPath(); c.moveTo(...p0); c.lineTo(...p1); c.lineTo(p1[0], p1[1] + 6); c.lineTo(p0[0], p0[1] + 6); c.closePath(); c.fillStyle = shade(c1, -0.18); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke(); }
  // little sign under the front edge
  if (o.sign) {
    const [sx, sy] = A(L * 0.5, d1, zf);
    c.font = "bold 6px sans-serif"; const w = c.measureText(o.sign).width + 6;
    c.fillStyle = "#2f3b2f"; c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.roundRect(sx - w / 2, sy + 9, w, 8, 1.5); c.fill(); c.stroke();
    c.fillStyle = "#f6efd9"; c.textAlign = "center"; c.fillText(o.sign, sx, sy + 15.2);
  }
}

// ---------- Victorian lamp post ----------
export function victorianLamp(k, u, v, o = {}) {
  const c = k.ctx, h = o.h ?? 2.1, [x, y] = P(u, v, 0), [, yt] = P(u, v, h);
  k.ell(u + 0.2, v + 0.08, 0, 0.18, "rgba(60,45,30,0.16)", { stroke: false });
  c.fillStyle = "#24282b"; c.strokeStyle = INK; c.lineWidth = 0.8;
  c.beginPath(); c.moveTo(x - 4.5, y); c.lineTo(x + 4.5, y); c.lineTo(x + 3.2, y - 7); c.lineTo(x + 2, y - 9); c.lineTo(x - 2, y - 9); c.lineTo(x - 3.2, y - 7); c.closePath(); c.fill(); c.stroke();
  c.lineCap = "butt"; c.strokeStyle = "#24282b"; c.lineWidth = 2.8; c.beginPath(); c.moveTo(x, y - 9); c.lineTo(x, yt + 8); c.stroke();
  c.fillStyle = "#24282b"; c.fillRect(x - 3, y - 22, 6, 2); c.fillRect(x - 5, yt + 8, 10, 1.6);
  c.strokeStyle = "#24282b"; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 5, yt + 9); c.quadraticCurveTo(x - 7, yt + 13, x - 4, yt + 15); c.moveTo(x + 5, yt + 9); c.quadraticCurveTo(x + 7, yt + 13, x + 4, yt + 15); c.stroke();
  // lantern: tapered glass box with a crown
  c.fillStyle = "rgba(255,226,140,0.30)"; c.beginPath(); c.arc(x, yt - 1, 10, 0, 7); c.fill();
  c.fillStyle = "#f8dc8c"; c.strokeStyle = "#24282b"; c.lineWidth = 1.1; c.beginPath(); c.moveTo(x - 3.5, yt + 7); c.lineTo(x + 3.5, yt + 7); c.lineTo(x + 5.5, yt - 6); c.lineTo(x - 5.5, yt - 6); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(x, yt + 7); c.lineTo(x, yt - 6); c.stroke();
  c.fillStyle = "#24282b"; c.beginPath(); c.moveTo(x - 6.5, yt - 6); c.lineTo(x + 6.5, yt - 6); c.lineTo(x + 2, yt - 11); c.lineTo(x - 2, yt - 11); c.closePath(); c.fill();
  c.beginPath(); c.arc(x, yt - 12.5, 1.6, 0, 7); c.fill();
}

// ---------- quay railing: chunky posts with ball tops and two rails (one segment) ----------
export function quayRail(k, a, b, o = {}) {
  const c = k.ctx, h = o.h ?? 0.62, n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / (o.step ?? 0.55)));
  c.lineCap = "round"; c.strokeStyle = "#1e1c1c";
  c.lineWidth = 1.4; c.beginPath();
  for (const f of [0.42, 0.86]) { c.moveTo(...P(a[0], a[1], h * f)); c.lineTo(...P(b[0], b[1], h * f)); }
  c.stroke();
  for (let i = o.skipFirst ? 1 : 0; i <= n; i++) {
    const u = lerp(a[0], b[0], i / n), v = lerp(a[1], b[1], i / n), [x, y] = P(u, v, 0), [, yt] = P(u, v, h);
    c.strokeStyle = "#1e1c1c"; c.lineWidth = 3.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt); c.stroke();
    c.fillStyle = "#1e1c1c"; c.beginPath(); c.arc(x, yt - 1.5, 2.6, 0, 7); c.fill();
    c.fillStyle = "rgba(255,255,255,0.35)"; c.beginPath(); c.arc(x - 0.8, yt - 2.3, 0.9, 0, 7); c.fill();
  }
}

// ---------- narrowboat: pointed bow, counter stern, painted cabin with lined panels, roof clutter ----------
export function narrowboat(k, u, v, ang, o = {}) {
  const c = k.ctx, t = k.t, Lb = o.L ?? 3.3, Wb = 0.6, Z = o.z0 ?? -0.42;
  const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
  const bob = Math.sin(t * 1.4 + (o.phase ?? 0)) * 0.015, roll = Math.sin(t * 1.1 + (o.phase ?? 0)) * 0.01;
  const B = (s, q) => [u + dx * s + nx * q, v + dy * s + ny * q];
  const Bz = (s, q, z) => P(...B(s, q), Z + z + bob + q * roll);
  const hull = o.hull || "#2d5a3c", cab = o.cabin || "#a8322f", gold = "#e8c25a";
  const half = Lb / 2;
  // shadow on the water
  k.path([Bz(-half - 0.1, -0.45, -0.02), Bz(half + 0.2, -0.45, -0.02), Bz(half + 0.2, 0.45, -0.02), Bz(-half - 0.1, 0.45, -0.02)].map((p) => [p[0] + 3, p[1] + 3]), { fill: "rgba(20,60,70,0.22)", stroke: false, wobble: 0 });
  // wake when moving
  if (o.moving) {
    c.strokeStyle = "rgba(255,255,255,0.75)"; c.lineCap = "round";
    for (let i = 0; i < 4; i++) {
      const f = (t * 0.7 + i / 4) % 1;
      c.globalAlpha = 0.85 * (1 - f); c.lineWidth = 1.6 - f;
      for (const s of [-1, 1]) { c.beginPath(); c.moveTo(...Bz(half - 0.1 - f * 2.2, s * (0.32 + f * 0.75), -0.02)); c.quadraticCurveTo(...Bz(half - 0.4 - f * 2.6, s * (0.42 + f * 1.0), -0.02), ...Bz(half - 0.8 - f * 3.0, s * (0.5 + f * 1.25), -0.02)); c.stroke(); }
    }
    for (let i = 0; i < 9; i++) { const f = (t * 0.9 + i / 9) % 1, q = Math.sin(i * 2.3 + t) * 0.18; c.globalAlpha = 0.8 * (1 - f); c.fillStyle = "#ffffff"; const [x, y] = Bz(-half - 0.15 - f * 1.4, q * (1 + f), -0.02); c.beginPath(); c.ellipse(x, y, 2 + f * 3, 1 + f, 0, 0, 7); c.fill(); }
    c.globalAlpha = 1;
    // bow wave
    c.strokeStyle = "rgba(255,255,255,0.9)"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(...Bz(half - 0.55, -0.34, -0.01)); c.quadraticCurveTo(...Bz(half + 0.08, 0, -0.01), ...Bz(half - 0.55, 0.34, -0.01)); c.stroke();
  }
  // hull outline (pointed bow at +s)
  const outline = [[-half, -Wb / 2 + 0.06], [-half + 0.12, -Wb / 2], [half - 0.7, -Wb / 2], [half - 0.25, -Wb / 2 + 0.14], [half, 0], [half - 0.25, Wb / 2 - 0.14], [half - 0.7, Wb / 2], [-half + 0.12, Wb / 2], [-half, Wb / 2 - 0.06]];
  const pts = outline.map(([s, q]) => B(s, q));
  const zb = Z + bob - 0.08;
  prism(k, pts, zb, 0.5, hull, { bands: [[0, 0.16, "#2a2a2c"], [0.16, 0.4, hull], [0.4, 0.46, "#e8d9a8"], [0.46, 0.5, hull]], topCol: "#8a6440", lw: 1 });
  // deck planks at bow well and stern
  c.strokeStyle = "rgba(60,40,20,0.4)"; c.lineWidth = 0.5; c.beginPath();
  for (let i = -2; i <= 2; i++) { c.moveTo(...Bz(half - 0.75, i * 0.1, 0.42)); c.lineTo(...Bz(half - 0.2 - Math.abs(i) * 0.08, i * 0.1, 0.42)); }
  c.stroke();
  // cabin
  const s0 = -half + 0.42, s1 = half - 0.82, cw = 0.26;
  const cab4 = [B(s0, -cw), B(s1, -cw), B(s1, cw), B(s0, cw)];
  const CH = 0.62; const faces = prism(k, cab4, zb + 0.5, CH, cab, { top: false, lw: 1 });
  // painted panels + windows + name on the visible faces
  for (const f of faces) {
    const isLong = Math.abs((f.b[0] - f.a[0]) * dx + (f.b[1] - f.a[1]) * dy) > 0.5;
    const FP = (g, z) => P(lerp(f.a[0], f.b[0], g), lerp(f.a[1], f.b[1], g), zb + 0.5 + z);
    const fq = (g0, g1, z0, z1, fill, lw = 0.7, stroke) => k.path([FP(g0, z0), FP(g1, z0), FP(g1, z1), FP(g0, z1)], { fill, lw, wobble: 0, stroke });
    if (isLong) {
      fq(0.03, 0.97, 0.07, 0.55, null, 1.1, gold); fq(0.0, 1, 0.0, 0.05, "#e8d9a8", 0.5);
      const nW = o.windows ?? 4;
      for (let i = 0; i < nW; i++) {
        const g = 0.12 + (i * 0.76) / (nW - 1);
        if (i === 1 && o.name) continue;
        fq(g - 0.05, g + 0.05, 0.2, 0.46, "#f1e6c6", 0.8);
        fq(g - 0.034, g + 0.034, 0.24, 0.42, "#5a6a78", 0.6);
        fq(g - 0.034, g - 0.018, 0.24, 0.42, "#f3ead6", 0, false); fq(g + 0.018, g + 0.034, 0.24, 0.42, "#f3ead6", 0, false);
        fq(g - 0.018, g + 0.018, 0.24, 0.3, "rgba(255,205,120,0.55)", 0, false);
      }
      // porthole
      { const [x, y] = FP(0.88, 0.33); c.beginPath(); c.arc(x, y, 2.6, 0, 7); c.fillStyle = "#5a6a78"; c.fill(); c.strokeStyle = gold; c.lineWidth = 1.2; c.stroke(); }
      if (o.name) {
        const [x0, y0] = FP(0.3, 0.33), [x1, y1] = FP(0.62, 0.33);
        let rot = Math.atan2(y1 - y0, x1 - x0); if (rot > Math.PI / 2) rot -= Math.PI; if (rot < -Math.PI / 2) rot += Math.PI; c.save(); c.translate((x0 + x1) / 2, (y0 + y1) / 2); c.rotate(rot); c.font = "bold 6.5px serif"; c.textAlign = "center"; c.fillStyle = gold; c.fillText(o.name, 0, 2.2); c.restore();
      }
    } else {
      // end of the cabin: a pair of doors with lined panels
      fq(0.12, 0.49, 0.02, 0.58, shade(hull, 0.1), 0.8);
      fq(0.51, 0.88, 0.02, 0.58, shade(hull, 0.1), 0.8);
      fq(0.18, 0.43, 0.08, 0.5, null, 0.8, gold); fq(0.57, 0.82, 0.08, 0.5, null, 0.8, gold);
    }
  }
  // roof: slightly wider, rounded (light top with a darker edge strip)
  const rw = 0.27, rz = zb + 0.5 + 0.62;
  k.path([Bz(s0 - 0.03, -rw, rz - Z - bob), Bz(s1 + 0.03, -rw, rz - Z - bob), Bz(s1 + 0.03, rw, rz - Z - bob), Bz(s0 - 0.03, rw, rz - Z - bob)], { fill: o.roof || "#d8d3c4", lw: 1.1, wobble: 0 });
  c.strokeStyle = "rgba(255,255,255,0.6)"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(...Bz(s0 + 0.05, 0, rz - Z - bob + 0.01)); c.lineTo(...Bz(s1 - 0.05, 0, rz - Z - bob + 0.01)); c.stroke();
  const RZ = rz - Z - bob; // roof height in boat z
  // roof clutter, back to front along the heading
  const things = [];
  things.push({ s: s1 - 0.3, f: () => { // chimney with smoke
    const [x, y] = Bz(s1 - 0.3, 0.05, RZ); c.fillStyle = "#222"; c.strokeStyle = INK; c.lineWidth = 0.7; c.fillRect(x - 2, y - 13, 4, 13); c.fillStyle = gold; c.fillRect(x - 3, y - 14, 6, 2.2); c.fillRect(x - 2.4, y - 5, 4.8, 1.4);
    for (let i = 0; i < 6; i++) { const f = (t * 0.45 + i / 6) % 1; c.fillStyle = `rgba(232,232,232,${0.6 * (1 - f)})`; c.beginPath(); c.arc(x - f * 14 * dx + Math.sin(t + i) * 2 + f * 6, y - 16 - f * 30, 2.4 + f * 5, 0, 7); c.fill(); }
  } });
  things.push({ s: s0 + 0.35, f: () => { // brass mushroom vent
    const [x, y] = Bz(s0 + 0.35, -0.08, RZ); c.fillStyle = gold; c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.ellipse(x, y - 2, 3.4, 1.8, 0, 0, 7); c.fill(); c.stroke();
  } });
  for (const [sp, colSet] of (o.planters || [[-0.1, 0], [0.5, 1]])) things.push({ s: sp, f: () => {
    const [x, y] = Bz(sp, 0.02, RZ), R2 = rng(Math.round(sp * 100) + 7);
    c.fillStyle = "#9a6a42"; c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.roundRect(x - 11, y - 6, 22, 7, 1.5); c.fill(); c.stroke();
    for (let j = 0; j < 16; j++) { c.fillStyle = j % 3 === 0 ? "#4f7f3a" : "#6b9a48"; c.beginPath(); c.arc(x - 10 + (j % 8) * 2.9 + R2() * 1.5, y - 7 - Math.floor(j / 8) * 3.5 - R2() * 2, 3.1, 0, 7); c.fill(); }
    for (let j = 0; j < 18; j++) { c.fillStyle = [["#f08bb5", "#e8607a", "#ffffff", "#f6b7cf"], ["#f4c542", "#f08bb5", "#ffffff", "#e8607a"]][colSet][j % 4]; c.beginPath(); c.arc(x - 10 + R2() * 20, y - 8 - R2() * 8, 1.9, 0, 7); c.fill(); }
  } });
  if (o.rope) things.push({ s: s0 + 0.85, f: () => { const [x, y] = Bz(s0 + 0.85, -0.1, RZ); c.strokeStyle = "#c9a86a"; c.lineWidth = 1.4; for (const r of [4.5, 3.2, 1.9]) { c.beginPath(); c.ellipse(x, y - 1.2, r, r * 0.5, 0, 0, 7); c.stroke(); } } });
  if (o.bike) things.push({ s: 0.2, f: () => { const [x, y] = Bz(0.25, 0.12, RZ); c.strokeStyle = INK; c.lineWidth = 0.9; for (const ox of [-5, 5]) { c.beginPath(); c.arc(x + ox * dx * 1.2, y - 3 + ox * dy * 0.6, 3.4, 0, 7); c.stroke(); } c.strokeStyle = "#3a6fb0"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - 6, y - 3); c.lineTo(x, y - 6); c.lineTo(x + 6, y - 3); c.stroke(); } });
  things.sort((p, q) => (q.s * (dx + dy) < p.s * (dx + dy) ? 1 : -1));
  for (const th of things) th.f();
  // tiller (brass, curving over the stern) + headlamp on the bow
  { const [x, y] = Bz(-half + 0.08, 0, 0.5), [x2, y2] = Bz(-half + 0.45, 0.05, 0.9); c.strokeStyle = gold; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x, y2 - 6, x2, y2); c.stroke(); }
  { const [x, y] = Bz(half - 0.82, 0, 1.03); c.fillStyle = "#f8e7a8"; c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.arc(x, y - 2, 2.2, 0, 7); c.fill(); c.stroke(); }
  return { stern: B(-half + 0.2, 0), bow: B(half - 0.5, 0), z: Z + bob + 0.42, roofZ: rz };
}

// ---------- mallard: body, green head, wake ripple ----------
export function duck(k, u, v, dir, z, o = {}) {
  const c = k.ctx, t = k.t, [x, y] = P(u, v, z), face = dir >= 0 ? 1 : -1, bob = Math.sin(t * 3 + (o.phase || 0)) * 0.6;
  c.strokeStyle = "rgba(255,255,255,0.6)"; c.lineWidth = 0.8; c.beginPath(); c.ellipse(x, y + 1, 7, 2.2, 0, 0, 7); c.stroke();
  c.fillStyle = o.female ? "#9a7a55" : "#8f8676"; c.strokeStyle = INK; c.lineWidth = 0.8;
  c.beginPath(); c.ellipse(x, y - 2 + bob, 5.2, 2.6, 0, 0, 7); c.fill(); c.stroke();
  c.fillStyle = o.female ? "#8a6a48" : "#2f6b46"; c.beginPath(); c.arc(x + face * 4.2, y - 5 + bob, 2.1, 0, 7); c.fill(); c.stroke();
  c.fillStyle = "#e8b440"; c.beginPath(); c.moveTo(x + face * 5.8, y - 5.3 + bob); c.lineTo(x + face * 8.3, y - 4.6 + bob); c.lineTo(x + face * 5.8, y - 4.1 + bob); c.fill();
  c.fillStyle = "#2a2420"; c.beginPath(); c.moveTo(x - face * 5, y - 2.6 + bob); c.lineTo(x - face * 7, y - 3.8 + bob); c.lineTo(x - face * 4.6, y - 1.4 + bob); c.fill();
}

// ---------- weeping willow: trunk, a domed crown whose curtain of strands falls to a ragged, swaying hem ----------
export function weepingWillow(k, u, v, o = {}) {
  const c = k.ctx, t = k.t, h = o.h ?? 2.9, r = o.r ?? 1.3, seed = o.seed ?? 5, R = rng(seed * 31 + 7);
  const [bx, by] = P(u, v, 0), [cx, cy] = P(u, v, h);
  const col = o.col || "#b4c94e", dark = shade(col, -0.38), mid = shade(col, -0.2), light = shade(col, 0.28);
  k.ell(u + 0.35, v + 0.15, 0, r * 0.85, "rgba(60,45,30,0.16)", { stroke: false });
  c.lineCap = "round";
  const limb = (x0, y0, x1, y1, w) => { c.strokeStyle = INK; c.lineWidth = w + 2.4; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + 4, (y0 + y1) / 2, x1, y1); c.stroke(); c.strokeStyle = "#8a6a4c"; c.lineWidth = w; c.stroke(); };
  limb(bx, by, cx + 2, cy + 10, 7.5);
  const Rr = r * 45, top = cy - Rr * 0.75, mid0 = cy - Rr * 0.15, hemY = cy + Rr * 0.95;
  const sway = (y, ph) => { const q = clamp((y - mid0) / (hemY - mid0)); return (Math.sin(t * 1.15 + ph) * 3 + Math.sin(t * 0.45 + seed) * 2) * q * q; };
  // silhouette
  const sil = () => {
    c.beginPath();
    const nT = 9;
    c.moveTo(cx - Rr, mid0);
    for (let i = 0; i <= nT; i++) { const a = Math.PI + (Math.PI * i) / nT, x = cx + Math.cos(a) * Rr, y = mid0 + Math.sin(a) * (mid0 - top); if (i) { const am = Math.PI + (Math.PI * (i - 0.5)) / nT; c.quadraticCurveTo(cx + Math.cos(am) * Rr * 1.12, mid0 + Math.sin(am) * (mid0 - top) * 1.12, x, y); } }
    c.quadraticCurveTo(cx + Rr * 1.1, (mid0 + hemY) / 2, cx + Rr * 1.12 + sway(hemY, 0), hemY - 14);
    const nH = 18;
    for (let i = nH; i >= 0; i--) { const f = i / nH, x = lerp(cx - Rr * 1.12, cx + Rr * 1.12, f), yy = hemY + Math.sin(i * 2.1 + seed) * 6 + (i % 2 ? 9 : -9) - Math.pow(Math.abs(f - 0.5) * 2, 2) * 20; c.lineTo(x + sway(yy, i * 0.7), yy); }
    c.quadraticCurveTo(cx - Rr * 1.1, (mid0 + hemY) / 2, cx - Rr, mid0);
    c.closePath();
  };
  sil(); c.fillStyle = mid; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
  c.save(); sil(); c.clip();
  // darker inner shadow on the right and under the dome
  const g = c.createLinearGradient(cx - Rr, 0, cx + Rr, 0); g.addColorStop(0, "rgba(255,255,220,0.18)"); g.addColorStop(0.55, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(40,60,10,0.25)");
  c.fillStyle = g; c.fillRect(cx - Rr * 1.2, top - 10, Rr * 2.4, hemY - top + 30);
  // strands: three layers, dark at the back to light at the front
  for (const [n, colr, lw] of [[40, dark, 2.6], [60, col, 2.4], [44, light, 1.8]]) {
    c.strokeStyle = colr; c.lineWidth = lw;
    for (let i = 0; i < n; i++) {
      const x0 = cx + (R() * 2 - 1) * Rr * 0.95, edge = Math.abs(x0 - cx) / Rr;
      const y0 = mid0 - Math.sqrt(Math.max(0, 1 - edge * edge)) * (mid0 - top) * (0.4 + R() * 0.6);
      const y1 = hemY + 6 - R() * 26, ph = R() * 6.28;
      c.beginPath(); c.moveTo(x0, y0);
      for (let s = 1; s <= 6; s++) { const yy = lerp(y0, y1, s / 6); c.lineTo(x0 + (x0 - cx) * 0.2 * (s / 6) + sway(yy, ph), yy); }
      c.stroke();
      // leaf ticks
      if (colr === light) { c.lineWidth = 1; c.beginPath(); for (let s = 1; s < 6; s++) { const yy = lerp(y0, y1, s / 6), xx = x0 + sway(yy, ph); c.moveTo(xx, yy); c.lineTo(xx + (s % 2 ? 2.2 : -2.2), yy + 2.5); } c.stroke(); c.lineWidth = lw; }
    }
  }
  c.restore();
  // a few loose strands past the hem
  for (let i = 0; i < 12; i++) {
    const x0 = cx + (R() * 2 - 1) * Rr * 0.85, y0 = hemY - 6, len = 8 + R() * 14, ph = R() * 6.28;
    c.strokeStyle = R() < 0.5 ? col : mid; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x0 + sway(y0, ph), y0);
    for (let s = 1; s <= 4; s++) { const yy = y0 + (s / 4) * len; c.lineTo(x0 + sway(yy, ph) * 1.2, yy); }
    c.stroke();
  }
}
