// Shanghai 1,0 helpers: screen-fitted maglev viaduct, trains, faceted-glass terminal, willows.
// Everything is laid out in reference pixels (CTS canvas px) and is a pure function of t.
import { P, CTS, INK, shade, mix, lerp, clamp, rng, hash as hash01 } from "./_props.js";
const hash = (n) => Math.floor(hash01(n) * 100000);

// inverse of P at height z -> (u, v)
// the reference image is warped into the CTS frame by this affine (from manifest slab corners);
// all coordinates below were measured on the raw image, so we draw them through MT.
export const MT = [1.04594759, -0.0946096342, -0.249235409, 0.967141831, 216.44373, 66.4166614];
export const W = (x, y) => [MT[0] * x + MT[2] * y + MT[4], MT[1] * x + MT[3] * y + MT[5]];
export const withW = (c, fn) => { c.save(); c.transform(...MT); fn(); c.restore(); };
export const G = (x0, y0, z = 0) => {
  const [x, y] = W(x0, y0);
  const d = (x - CTS.X0) / (CTS.S * CTS.XS), s = (y - CTS.Y0 + z * CTS.S * CTS.ZS) / (CTS.S * CTS.YS);
  return [(s + d) / 2, (s - d) / 2];
};
export const GP = (pts) => pts.map(([x, y]) => G(x, y));

const path = (c, pts, close = true) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); if (close) c.closePath(); };
const smooth = (c, pts, close = true) => {
  const n = pts.length; c.beginPath();
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]); c.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) { const m = mid(pts[i], pts[(i + 1) % n]); c.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
  if (close) c.closePath();
};
const lg = (c, x0, y0, x1, y1, stops) => { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, col]) => g.addColorStop(o, col)); return g; };
const bez = (p0, p1, p2, f) => [lerp(lerp(p0[0], p1[0], f), lerp(p1[0], p2[0], f), f), lerp(lerp(p0[1], p1[1], f), lerp(p1[1], p2[1], f), f)];

// ------------------------------------------------------------------ foliage
export function blob(c, x, y, r, col, seed, ink = 0.75) {
  const R = rng(seed * 3 + 1), pts = [];
  const n = 7;
  for (let i = 0; i < n; i++) { const a = (i / n) * 6.283 + R() * 0.5; pts.push([x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.42, r * (0.42 + R() * 0.12)]); }
  pts.push([x, y, r * 0.62]);
  const all = (fn) => { c.beginPath(); for (const [px, py, pr] of pts) { c.moveTo(px + pr, py); c.arc(px, py, pr, 0, 6.283); } fn(); };
  all(() => { c.strokeStyle = `rgba(32,58,24,${ink})`; c.lineWidth = 1.8; c.stroke(); });
  all(() => { c.fillStyle = col; c.fill(); });
  c.save(); all(() => c.clip());
  c.fillStyle = shade(col, 0.14); c.beginPath(); c.arc(x - r * 0.25, y - r * 0.28, r * 0.42, 0, 6.283); c.fill();
  c.fillStyle = shade(col, -0.15); c.beginPath(); c.arc(x + r * 0.35, y + r * 0.3, r * 0.5, 0, 6.283); c.fill();
  c.strokeStyle = shade(col, -0.32); c.lineWidth = 0.8;
  for (let i = 0; i < Math.round(r * 0.9); i++) { const px = x + (R() - 0.5) * r * 1.5, py = y + (R() - 0.5) * r * 1.1; c.beginPath(); c.arc(px, py, 1.5 + R(), 0.3, 2.4); c.stroke(); }
  c.restore();
}
export function bedPx(k, pts, seed, cols, leaf = ["#6c9c4c", "#77a653", "#5e9040"], step = 8, spread = 20) {
  const c = k.ctx, R = rng(seed);
  const items = [];
  for (let i = 0; i < pts.length - 1; i++) { const [a, b] = [pts[i], pts[i + 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L / step); for (let j = 0; j < n; j++) { const f = j / n; items.push([lerp(a[0], b[0], f) + (R() - 0.5) * spread, lerp(a[1], b[1], f) + (R() - 0.5) * spread * 0.6]); } }
  items.sort((p, q) => p[1] - q[1]);
  for (const [x, y] of items) {
    const r = 10 + R() * 6;
    blob(c, x, y - 4, r, leaf[Math.floor(R() * leaf.length)], Math.floor(R() * 1e4), 0.55);
    for (let q = 0; q < 9; q++) { const fx = x + (R() - 0.5) * r * 1.7, fy = y - 4 + (R() - 0.5) * r * 1.0, col = cols[Math.floor(R() * cols.length)]; c.fillStyle = col; c.beginPath(); c.arc(fx, fy, 2 + R() * 1.2, 0, 7); c.fill(); c.fillStyle = "#fbf0b0"; c.beginPath(); c.arc(fx, fy, 0.8, 0, 7); c.fill(); }
  }
}
export function willowPx(k, x, y, H, W, seed, col = "#a9c93e") {
  const c = k.ctx, t = k.t, R = rng(seed * 7 + 3);
  const cx = x + (R() - 0.5) * 8, cy = y - H * 0.62;
  c.save();
  c.fillStyle = "rgba(60,45,30,0.14)"; c.beginPath(); c.ellipse(x + 14, y + 3, W * 0.42, W * 0.12, 0, 0, 7); c.fill();
  // trunk + forks
  c.lineCap = "round"; c.lineJoin = "round";
  const trunk = (w, s) => { c.strokeStyle = s; c.lineWidth = w; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - 6, y - H * 0.28, cx - 4, cy + 10); c.stroke(); for (const [dx, dy, ex] of [[-W * 0.22, -H * 0.12, -6], [W * 0.2, -H * 0.1, 6], [W * 0.05, -H * 0.2, 0]]) { c.beginPath(); c.moveTo(cx - 4, cy + 14); c.quadraticCurveTo(cx + ex, cy + dy * 0.2, cx + dx, cy + dy - 6); c.stroke(); } };
  trunk(Math.max(8, W * 0.075), INK); trunk(Math.max(5, W * 0.05), "#8b6a4b");
  c.strokeStyle = "#5a4130"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - 1, y - 4); c.quadraticCurveTo(x - 7, y - H * 0.28, cx - 5, cy + 12); c.stroke();
  // crown lobes
  for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.283 + R(), rr = W * 0.25; blob(c, cx + Math.cos(a) * W * 0.34, cy + Math.sin(a) * H * 0.07 - 2, rr, shade(col, (i % 3) * 0.04 - 0.02), seed * 11 + i, 0.5); }
  blob(c, cx, cy - H * 0.06, W * 0.3, shade(col, 0.05), seed * 11 + 90, 0.5);
  // drooping strands (the curtain)
  const N = Math.round(W * 0.8);
  for (let i = 0; i < N; i++) {
    const f = (i + R() * 0.7) / N, a = f * 7.3 + i * 0.4, rr = (0.15 + 0.85 * Math.sqrt(R())) * W * 0.5;
    const x0 = cx + Math.cos(a) * rr * 0.98, y0 = cy + Math.sin(a) * rr * 0.28 + 2;
    const len = H * (0.28 + R() * 0.3) * (0.7 + 0.5 * Math.abs(Math.cos(a))), sw = (Math.sin(t * 1.3 + i * 0.5 + seed) * 2.6 + Math.sin(t * 2.4 + i * 1.3) * 0.9) * (len / 60);
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x0 + sw * 0.35 + (x0 - cx) * 0.04, y0 + len * 0.5, x0 + sw, y0 + len);
    c.strokeStyle = "rgba(48,72,22,0.55)"; c.lineWidth = 2.6; c.stroke();
    c.strokeStyle = i % 3 === 0 ? shade(col, -0.08) : i % 3 === 1 ? shade(col, 0.07) : shade(col, 0); c.lineWidth = 1.7; c.stroke();
  }
  c.restore();
}

export function bushPx(k, x, y, r, seed, cols = ["#5f9a3e", "#78ad48", "#4c8a38"], fl = null) {
  const R = rng(seed * 13 + 5), c = k.ctx;
  for (let i = 0; i < 4; i++) blob(c, x + (R() - 0.5) * r * 1.2, y - R() * r * 0.6, r * (0.55 + R() * 0.25), cols[i % cols.length], seed * 7 + i, 0.6);
  if (fl) for (let i = 0; i < Math.round(r * 0.9); i++) { const fx = x + (R() - 0.5) * r * 2, fy = y - R() * r * 1.0, col = fl[Math.floor(R() * fl.length)]; c.fillStyle = col; c.beginPath(); c.arc(fx, fy, 2 + R() * 1.4, 0, 7); c.fill(); c.fillStyle = "#fbf0b0"; c.beginPath(); c.arc(fx, fy, 0.9, 0, 7); c.fill(); }
}

// ------------------------------------------------------------------ viaduct
export const SL = 0.329;
export const FT = (x) => 600 - SL * (x - 12);   // front-top edge of the beam
export const BT = (x) => FT(x) - 40;            // back-top edge
export const FB = (x) => FT(x) + 26;            // bottom of the front face
const XL = 12, XR = 985;

function pier(c, bx, by, hs, armL, armR) {
  const fyAt = (x) => FB(x);
  const xl = bx - armL, xr = bx + armR, fork = by - (by - fyAt(bx)) * 0.5;
  c.save();
  c.beginPath();
  c.moveTo(bx - hs, by);
  c.lineTo(bx - hs + 1, fork + 6);
  c.bezierCurveTo(bx - hs - 2, fork - 14, xl + 6, fyAt(xl) + 18, xl, fyAt(xl) - 2);
  c.lineTo(xr, fyAt(xr) - 2);
  c.bezierCurveTo(xr - 8, fyAt(xr) + 22, bx + hs + 2, fork - 16, bx + hs, fork + 6);
  c.lineTo(bx + hs, by);
  c.ellipse(bx, by, hs, hs * 0.38, 0, 0, Math.PI);
  c.closePath();
  c.fillStyle = lg(c, xl, 0, xr, 0, [[0, "#e6dcc8"], [0.55, "#d3c8b0"], [1, "#b3a68e"]]); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.4; c.lineJoin = "round"; c.stroke();
  // soft highlight on the stem + arch lines
  c.strokeStyle = "rgba(255,255,255,0.45)"; c.lineWidth = 2.2; c.beginPath(); c.moveTo(bx - hs + 5, by - 4); c.lineTo(bx - hs + 6, fork + 10); c.stroke();
  c.strokeStyle = "rgba(120,105,82,0.5)"; c.lineWidth = 1; c.beginPath(); c.moveTo(bx + hs - 5, by - 4); c.lineTo(bx + hs - 5, fork + 8); c.stroke();
  c.beginPath(); c.moveTo(bx - hs * 0.2, fork + 10); c.bezierCurveTo(bx - hs, fork - 6, xl + 14, fyAt(xl) + 22, xl + 4, fyAt(xl) + 4); c.stroke();
  c.beginPath(); c.moveTo(bx + hs * 0.2, fork + 10); c.bezierCurveTo(bx + hs, fork - 6, xr - 14, fyAt(xr) + 24, xr - 4, fyAt(xr) + 4); c.stroke();
  c.restore();
}

export function viaductPiers(c) {
  c.save(); c.beginPath(); c.rect(XL, 0, XR - XL, 1024); c.clip();
  pier(c, 92, 668, 17, 66, 60);
  pier(c, 309, 588, 17, 70, 78);
  pier(c, 632, 466, 16, 56, 62);
  pier(c, 868, 412, 16, 56, 62);
  c.restore();
}

export function viaductBeam(c) {
  c.save(); c.beginPath(); c.rect(XL, 0, XR - XL + 1, 1024); c.clip();
  const x0 = 38;
  // front face
  path(c, [[x0, FT(x0)], [XR, FT(XR)], [XR, FB(XR)], [x0, FB(x0)]]);
  c.fillStyle = lg(c, 0, 380, 0, 640, [[0, "#d9cfba"], [1, "#c1b69f"]]); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
  // underside shadow band + stone seams
  path(c, [[x0, FB(x0) - 6], [XR, FB(XR) - 6], [XR, FB(XR)], [x0, FB(x0)]]); c.fillStyle = "rgba(90,75,55,0.28)"; c.fill();
  const R = rng(77);
  c.strokeStyle = "rgba(110,95,72,0.32)"; c.lineWidth = 0.9;
  for (let i = 0; i < 70; i++) { const x = x0 + R() * (XR - x0), y = FT(x) + 4 + R() * 16; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 8 + R() * 16, y - 2.6 + R() * 2); c.stroke(); }
  c.strokeStyle = "rgba(255,255,255,0.4)"; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x0, FT(x0) + 3); c.lineTo(XR, FT(XR) + 3); c.stroke();
  // left cut end
  path(c, [[XL, BT(XL)], [x0, FT(x0)], [x0, FB(x0)], [XL, BT(XL) + 28]]);
  c.fillStyle = "#b5a990"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
  c.strokeStyle = "rgba(255,255,255,0.35)"; c.lineWidth = 1; c.beginPath(); c.moveTo(XL + 3, BT(XL) + 6); c.lineTo(x0 - 3, FT(x0) + 6); c.stroke();
  // top surface
  path(c, [[XL, BT(XL)], [XR, BT(XR)], [XR, FT(XR)], [x0, FT(x0)]]);
  c.fillStyle = lg(c, 0, 250, 0, 600, [[0, "#e9e4d8"], [1, "#d9d3c4"]]); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
  // back parapet lip, rails, side plates
  const strip = (a, b, col) => { path(c, [[XL, BT(XL) + a], [XR, BT(XR) + a], [XR, BT(XR) + b], [XL, BT(XL) + b]]); c.fillStyle = col; c.fill(); };
  strip(0, 6, "#b9b2a2"); strip(8, 10, "#8d8778"); strip(21, 23, "#8d8778"); strip(32, 35, "#c8c1b0");
  c.strokeStyle = "rgba(70,66,56,0.7)"; c.lineWidth = 1; for (const o of [6, 10, 21, 23]) { c.beginPath(); c.moveTo(XL, BT(XL) + o); c.lineTo(XR, BT(XR) + o); c.stroke(); }
  // sleeper ticks
  c.strokeStyle = "rgba(100,95,82,0.35)"; c.lineWidth = 0.8; c.beginPath();
  for (let x = XL + 16; x < XR; x += 28) { c.moveTo(x, BT(x) + 10); c.lineTo(x + 6, BT(x + 6) + 33); }
  c.stroke();
  c.restore();
}

// ------------------------------------------------------------------ train (local frame: a along the train, y down, 0 = rail)
function trainLocal(c, t, sgn, tint) {
  const INKC = "#3b4352";
  const bodyG = lg(c, 0, -56, 0, -2, [[0, "#ffffff"], [0.45, "#f1f4f8"], [0.8, "#dde4ee"], [1, "#bcc6d4"]]);
  const roofG = lg(c, 0, -56, 0, -42, [[0, "#fdfeff"], [1, "#dfe7f1"]]);
  const cars = [[0, 246, "head"], [258, 350, "mid"], [362, 455, "mid"], [468, 562, "mid"], [574, 727, "tail"]];
  // shadow on the guideway
  c.fillStyle = "rgba(40,36,28,0.28)"; path(c, [[-2, -1], [730, -1], [736, 6], [4, 6]]); c.fill();
  const sh = 6 * sgn;
  for (const [a0, a1, kind] of cars) {
    // outline of the side face and silhouette incl. roof
    const side = new Path2D(), sil = new Path2D();
    if (kind === "head") {
      side.moveTo(0, -5); side.bezierCurveTo(0, -14, 8, -26, 30, -37); side.bezierCurveTo(50, -43, 80, -44, 120, -44); side.lineTo(a1, -44); side.lineTo(a1, -4); side.lineTo(12, -4); side.quadraticCurveTo(0, -3, 0, -5);
      sil.moveTo(0, -5); sil.bezierCurveTo(0, -16, 12, -36, 48, -49); sil.bezierCurveTo(72, -55, 100, -55, 130, -55); sil.lineTo(a1 + sh, -55); sil.lineTo(a1, -44); sil.lineTo(a1, -4); sil.lineTo(12, -4); sil.quadraticCurveTo(0, -3, 0, -5);
    } else if (kind === "tail") {
      side.moveTo(a0, -44); side.lineTo(a1 - 52, -44); side.bezierCurveTo(a1 - 20, -43, a1 - 4, -30, a1, -14); side.quadraticCurveTo(a1, -4, a1 - 12, -4); side.lineTo(a0, -4); side.closePath();
      sil.moveTo(a0, -44); sil.lineTo(a0 + sh, -55); sil.lineTo(a1 - 56, -55); sil.bezierCurveTo(a1 - 24, -53, a1 - 4, -36, a1, -14); sil.quadraticCurveTo(a1, -4, a1 - 12, -4); sil.lineTo(a0, -4); sil.closePath();
    } else {
      side.rect(a0, -44, a1 - a0, 40); sil.moveTo(a0, -44); sil.lineTo(a0 + sh, -55); sil.lineTo(a1 + sh, -55); sil.lineTo(a1, -44); sil.lineTo(a1, -4); sil.lineTo(a0, -4); sil.closePath();
    }
    // roof surface (silhouette) then side face on top
    c.fillStyle = roofG; c.fill(sil); c.strokeStyle = INKC; c.lineWidth = 1.2; c.lineJoin = "round"; c.stroke(sil);
    c.fillStyle = bodyG; c.fill(side); c.stroke(side);
    c.save(); c.clip(side);
    // grey-lilac stripe under the roof edge + blue livery band
    c.fillStyle = "#c6d0de"; c.fillRect(a0, -44, a1 - a0, 3);
    c.fillStyle = "#2150c4"; c.beginPath();
    if (kind === "head") { c.moveTo(6, -9); c.lineTo(34, -17); c.lineTo(a1, -17); c.lineTo(a1, -11); c.lineTo(22, -11); c.closePath(); } else c.rect(a0, -18, a1 - a0, 6);
    c.fill();
    c.fillStyle = "#7f9fe6"; c.fillRect(a0, -9.5, a1 - a0, 1.2);
    c.fillStyle = "rgba(255,255,255,0.55)"; c.fillRect(a0, -19, a1 - a0, 1);
    // windows
    const wa = kind === "head" ? 92 : a0 + 8, wb = kind === "tail" ? a1 - 46 : a1 - 8;
    for (let x = wa; x + 11 <= wb; x += 15.5) {
      c.fillStyle = tint; c.fillRect(x, -37, 11, 14);
      c.fillStyle = "rgba(180,215,240,0.7)"; c.fillRect(x, -37, 11, 4.5);
      c.fillStyle = "rgba(20,28,40,0.75)"; const h = hash(Math.round(x * 3 + a0)); if (h % 5 !== 0) { c.beginPath(); c.arc(x + 3.5, -29.5, 2.1, 0, 7); c.fill(); c.fillRect(x + 1.5, -27.6, 4, 4.4); } if (h % 3 === 0) { c.beginPath(); c.arc(x + 8, -30.5, 1.9, 0, 7); c.fill(); c.fillRect(x + 6.2, -28.6, 3.8, 3.8); }
      c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 1; c.strokeRect(x - 0.5, -37.5, 12, 15);
    }
    // doors (slim panels with window)
    for (const dx of kind === "head" ? [84] : kind === "tail" ? [a0 + 2, a1 - 58] : [a0 + 2, a1 - 12]) { c.strokeStyle = "rgba(60,70,90,0.6)"; c.lineWidth = 1; c.strokeRect(dx, -40, 8, 34); c.fillStyle = "rgba(110,150,190,0.55)"; c.fillRect(dx + 1.5, -37, 5, 10); }
    // skirt shading + lower seam
    c.fillStyle = "rgba(90,105,130,0.18)"; c.fillRect(a0, -7, a1 - a0, 3);
    if (kind === "head") {
      // windscreen
      c.beginPath(); c.moveTo(12, -26); c.bezierCurveTo(16, -33, 28, -38, 44, -42); c.lineTo(68, -43); c.lineTo(70, -29); c.lineTo(40, -23); c.closePath();
      c.fillStyle = lg(c, 12, -44, 68, -22, [[0, "#6f9cc9"], [0.5, "#1f3a5e"], [1, "#12263f"]]); c.fill();
      c.strokeStyle = "#e8eef6"; c.lineWidth = 1.4; c.stroke();
      c.strokeStyle = "rgba(255,255,255,0.55)"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(20, -29); c.lineTo(44, -39); c.stroke();
    }
    c.restore();
    c.strokeStyle = INKC; c.lineWidth = 1.2; c.stroke(side);
    // roof gear
    if (kind !== "tail" || a1 - a0 > 100) for (const f of kind === "head" ? [0.62] : [0.3, 0.72]) { const rx = a0 + (a1 - a0) * f + sh * 0.6; c.fillStyle = "#d3dae4"; c.strokeStyle = "#6b7482"; c.lineWidth = 0.9; path(c, [[rx, -49], [rx + 17, -49], [rx + 19, -53], [rx + 2, -53]]); c.fill(); c.stroke(); }
  }
  // articulated joints (rubber bellows)
  for (let i = 0; i < cars.length - 1; i++) {
    const a = cars[i][1] - 1, w = cars[i + 1][0] - cars[i][1] + 2;
    c.fillStyle = "#3d414f"; path(c, [[a, -46], [a + w, -46], [a + w + sh * 0.9, -54], [a + sh * 0.9, -54]]); c.fill(); c.fillRect(a, -46, w, 42);
    c.strokeStyle = "rgba(255,255,255,0.22)"; c.lineWidth = 0.9; c.beginPath(); for (let q = 1; q < 4; q++) { c.moveTo(a + (w * q) / 4, -46); c.lineTo(a + (w * q) / 4, -5); } c.stroke();
    c.strokeStyle = INKC; c.lineWidth = 1; c.strokeRect(a, -46, w, 42);
  }
}

// a train whose nose tip is at screen x = X0. dirSign -1: heads left (body trails right), +1: heads right.
export function drawTrain(c, X0, dirSign, lane, t) {
  if (X0 < -800 || X0 > 1800) return;
  c.save();
  c.beginPath(); c.rect(XL + 6, 0, XR - XL - 8, 1024); c.clip();
  const Y0 = BT(X0) + lane;
  if (dirSign < 0) c.transform(1, -SL, 0, 1, X0, Y0); else c.transform(-1, SL, 0, 1, X0, Y0);
  trainLocal(c, t, dirSign < 0 ? 1 : -1, "#1d3350");
  c.restore();
}

// ------------------------------------------------------------------ terminal
const cell = (c, q, fill, line, lw = 0.7) => { path(c, q); c.fillStyle = fill; c.fill(); if (line) { c.strokeStyle = line; c.lineWidth = lw; c.stroke(); } };

export function terminalBack(c, t) {
  // glass wall + end cap (behind the shells)
  const wall = [[297, 625], [330, 600], [450, 560], [520, 545], [600, 520], [650, 505], [717, 488], [767, 484], [833, 483], [900, 486], [950, 497], [983, 520], [998, 545], [992, 585], [965, 625], [920, 662], [860, 692], [800, 699], [650, 704], [545, 697], [430, 684], [297, 673]];
  c.save();
  path(c, wall);
  c.fillStyle = lg(c, 0, 490, 0, 700, [[0, "#3f8fa8"], [0.5, "#5fa9b8"], [0.8, "#c6d3b0"], [1, "#e6d9b4"]]); c.fill();
  c.clip();
  // interior: floor glow + mullions of the flat facade
  c.strokeStyle = "rgba(235,248,250,0.95)"; c.lineWidth = 2;
  for (let x = 300; x < 790; x += 31) { c.beginPath(); c.moveTo(x, 480); c.lineTo(x, 705); c.stroke(); }
  c.lineWidth = 1.2; for (const yy of [0.18, 0.4, 0.62]) { c.beginPath(); c.moveTo(297, lerp(600, 674, yy) - 20); c.lineTo(790, lerp(540, 700, yy) - 30); c.stroke(); }
  // people inside (dark glass reflections drifting)
  const R = rng(5);
  for (let i = 0; i < 12; i++) {
    const base = 320 + R() * 450, sp = (R() - 0.5) * 14, x = 320 + ((base - 320 + sp * t + 600) % 450), y = 640 + (R() - 0.5) * 20 + (x - 320) * 0.04, bob = Math.abs(Math.sin(t * 5 + i)) * 0.9;
    c.fillStyle = i % 2 ? "rgba(36,84,112,0.55)" : "rgba(52,70,96,0.5)"; c.beginPath(); c.ellipse(x, y - 18 - bob, 2.6, 3.2, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(x - 3.4, y - 14 - bob); c.lineTo(x + 3.4, y - 14 - bob); c.lineTo(x + 2.6, y); c.lineTo(x - 2.6, y); c.closePath(); c.fill();
  }
  // upper level people behind the rim
  for (let i = 0; i < 0; i++) { const x = 610 + i * 24 + Math.sin(t * 0.4 + i) * 4, y = 560 - i * 3; c.fillStyle = "rgba(40,80,110,0.55)"; c.beginPath(); c.ellipse(x, y - 15, 2.2, 2.8, 0, 0, 7); c.fill(); c.fillRect(x - 2.5, y - 12, 5, 12); }
  // end cap: curved ribs and transoms (glazed barrel end)
  const xt = [727, 764, 805, 846, 887, 925, 956, 980, 998], yt = [493, 488, 485, 485, 487, 495, 507, 524, 545];
  const xb = [790, 805, 832, 864, 897, 926, 951, 973, 992], yb = [690, 688, 680, 668, 650, 632, 610, 582, 556];
  const rib = (i, f) => bez([xt[i], yt[i]], [xb[i] + (xt[i] - xb[i]) * 0.05 + 4, yt[i] + (yb[i] - yt[i]) * 0.08], [xb[i], yb[i]], f);
  const J = 8;
  for (let i = 0; i < xt.length - 1; i++) for (let j = 0; j < J; j++) {
    const q = [rib(i, j / J), rib(i + 1, j / J), rib(i + 1, (j + 1) / J), rib(i, (j + 1) / J)], h = hash(i * 31 + j * 7), sh = 0.5 + 0.5 * Math.sin(i * 0.9 + j * 0.8 + t * 0.5);
    const base = [[70, 168, 190], [96, 186, 205], [54, 140, 170], [120, 200, 214]][h % 4], gl = sh > 0.93 ? 70 : 0;
    cell(c, q, `rgba(${base[0] + gl},${base[1] + gl * 0.6},${base[2] + gl * 0.4},0.95)`, "rgba(214,232,238,0.9)", 0.8);
    if (h % 3 === 0) { c.fillStyle = "rgba(255,255,255,0.18)"; path(c, [q[0], [lerp(q[0][0], q[1][0], 0.5), lerp(q[0][1], q[1][1], 0.5)], [lerp(q[3][0], q[2][0], 0.5), lerp(q[3][1], q[2][1], 0.5)], q[3]]); c.fill(); }
  }
  for (let i = 0; i < xt.length; i++) { c.strokeStyle = i === 0 ? "#e9eff2" : "#cddbe0"; c.lineWidth = i === 0 ? 3.2 : 1.8; c.beginPath(); for (let s = 0; s <= 16; s++) { const p = rib(i, s / 16); s ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke(); if (i === 0) { c.strokeStyle = "rgba(60,90,100,0.7)"; c.lineWidth = 0.9; c.stroke(); } }
  c.restore();
}

export function terminalShell(c, t) {
  // big silver shell
  const top = [[245, 623], [262, 592], [307, 568], [373, 540], [447, 512], [507, 492], [573, 474], [640, 466], [700, 440], [750, 429], [800, 427], [850, 433], [900, 447], [950, 470], [983, 497], [1000, 530], [998, 548]];
  const rim = [[997, 542], [983, 522], [950, 500], [900, 490], [833, 485], [767, 487], [717, 495], [650, 513], [600, 531], [540, 566], [505, 584]];
  const low = [[505, 584], [480, 586], [400, 593], [345, 610], [300, 633], [262, 633]];
  const shape = [...top, ...rim, ...low];
  c.save();
  path(c, shape);
  c.fillStyle = lg(c, 250, 600, 700, 430, [[0, "#c8d3e2"], [0.5, "#e6eef8"], [1, "#f3f7fc"]]); c.fill();
  c.save(); c.clip();
  // longitudinal ribs + cross ribs following the shell surface (left part)
  const topC = (f) => { const i = f * 7, k = Math.min(6, Math.floor(i)); return [lerp(top[k][0], top[k + 1][0], i - k), lerp(top[k][1], top[k + 1][1], i - k)]; };
  const lowC = (f) => { const pts = [[262, 633], [300, 628], [345, 608], [400, 592], [480, 585], [520, 575], [600, 530], [640, 510]]; const i = f * 7, k = Math.min(6, Math.floor(i)); return [lerp(pts[k][0], pts[k + 1][0], i - k), lerp(pts[k][1], pts[k + 1][1], i - k)]; };
  const NR = 6, NC = 18;
  for (let r = 0; r < NR; r++) for (let q = 0; q < NC; q++) {
    const f0 = q / NC, f1 = (q + 1) / NC, g0 = r / NR, g1 = (r + 1) / NR;
    const P4 = (f, g) => { const a = topC(f * 0.78), b = lowC(f * 0.9); return [lerp(a[0], b[0], g), lerp(a[1], b[1], g + (g > 0 ? 0 : 0))]; };
    const h = hash(r * 29 + q * 11);
    const al = 0.12 + 0.18 * ((h % 7) / 7);
    cell(c, [P4(f0, g0), P4(f1, g0), P4(f1, g1), P4(f0, g1)], `rgba(${150 + (h % 40)},${175 + (h % 30)},${210},${al})`, "rgba(120,140,170,0.55)", 0.8);
  }
  // sun streak and glints crawling along the shell
  const sweep = ((t * 0.12) % 1.4) - 0.2;
  const sg = c.createLinearGradient(280 + sweep * 520, 620 - sweep * 160, 340 + sweep * 520, 580 - sweep * 160); sg.addColorStop(0, "rgba(255,255,255,0)"); sg.addColorStop(0.5, "rgba(255,255,255,0.45)"); sg.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = sg; c.fillRect(240, 420, 460, 230);
  c.restore();
  c.strokeStyle = "#3d4a5c"; c.lineWidth = 1.5; c.lineJoin = "round"; path(c, shape); c.stroke();
  c.restore();

  // glazed upper dome
  const dt = [[625, 482], [660, 463], [700, 452], [750, 443], [800, 441], [850, 447], [900, 460], [945, 482], [975, 508], [990, 536]];
  const db = [[990, 538], [970, 516], [940, 501], [900, 491], [833, 487], [767, 489], [717, 497], [660, 513], [625, 522]];
  c.save(); path(c, [...dt, ...db]); c.fillStyle = lg(c, 0, 440, 0, 520, [[0, "#6ab6cf"], [1, "#2f86a8"]]); c.fill(); c.clip();
  const dtC = (f) => { const i = f * 9, k = Math.min(8, Math.floor(i)); return [lerp(dt[k][0], dt[k + 1][0], i - k), lerp(dt[k][1], dt[k + 1][1], i - k)]; };
  const dbC = (f) => { const i = f * 8, k = Math.min(7, Math.floor(i)); const rb = [...db].reverse(); return [lerp(rb[k][0], rb[k + 1][0], i - k), lerp(rb[k][1], rb[k + 1][1], i - k)]; };
  const NX = 16, NY = 5;
  for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) {
    const a = (f, g) => { const p = dtC(f), q = dbC(f); return [lerp(p[0], q[0], g), lerp(p[1], q[1], g)]; };
    const h = hash(i * 17 + j * 5 + 3), gl = (Math.sin(t * 0.7 + i * 0.5 + j) > 0.92) ? 0.3 : 0;
    cell(c, [a(i / NX, j / NY), a((i + 1) / NX, j / NY), a((i + 1) / NX, (j + 1) / NY), a(i / NX, (j + 1) / NY)], `rgba(${[80, 120, 100, 150][h % 4]},${[190, 205, 185, 215][h % 4]},${[215, 225, 220, 232][h % 4]},${0.62 + gl})`, "rgba(225,240,246,0.9)", 0.9);
  }
  c.restore();
  // silver rim band between dome and wall
  c.save(); c.lineCap = "round"; c.lineJoin = "round";
  const rimPts = [[1000, 548], [990, 522], [968, 503], [940, 491], [900, 485], [833, 481], [767, 483], [717, 491], [650, 508], [610, 524]];
  for (const [w, col] of [[11, "#3d4a5c"], [8, "#dfe6ee"]]) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); rimPts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke(); }
  c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 2; c.beginPath(); rimPts.forEach((p, i) => (i ? c.lineTo(p[0], p[1] - 2) : c.moveTo(p[0], p[1] - 2))); c.stroke();
  // outer top band
  for (const [w, col] of [[7, "#3d4a5c"], [4.5, "#dfe6ee"]]) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); [[640, 466], ...dt.slice(1).map(([x, y]) => [x + 2, y - 5])].forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke(); }
  c.restore();
}

export function terminalWing(c, t) {
  const top = [[495, 586], [540, 579], [600, 576], [650, 580], [700, 587], [750, 598], [782, 612], [790, 620]];
  const bot = [[788, 626], [733, 629], [667, 624], [600, 618], [540, 612], [500, 598]];
  c.save();
  path(c, [...top, ...bot]);
  c.fillStyle = lg(c, 500, 580, 780, 625, [[0, "#d9e2f0"], [0.5, "#eef3fa"], [1, "#c1cddd"]]); c.fill();
  c.save(); c.clip();
  // fritted panel grid following the wing
  for (let q = 0; q < 14; q++) { const f = q / 14, x0 = lerp(495, 790, f); c.strokeStyle = "rgba(110,130,165,0.5)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x0, 570 + f * 42); c.lineTo(x0 + 8, 632); c.stroke(); }
  for (let r = 1; r < 3; r++) { c.strokeStyle = "rgba(110,130,165,0.5)"; c.lineWidth = 0.8; c.beginPath(); for (let s = 0; s <= 12; s++) { const f = s / 12, x = lerp(495, 788, f), yA = lerp(top[Math.min(7, Math.floor(f * 7))][1], 612, 0), p = top[Math.min(7, Math.round(f * 7))][1], b = bot[Math.min(5, Math.round((1 - f) * 5))][1]; const y = lerp(p, b, r / 3); s ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
  const sg = c.createLinearGradient(520 + ((t * 70) % 420), 0, 560 + ((t * 70) % 420), 0); sg.addColorStop(0, "rgba(255,255,255,0)"); sg.addColorStop(0.5, "rgba(255,255,255,0.4)"); sg.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = sg; c.fillRect(480, 570, 330, 70);
  c.restore();
  c.strokeStyle = "#3d4a5c"; c.lineWidth = 1.4; c.lineJoin = "round"; path(c, [...top, ...bot]); c.stroke();
  // bright leading lip along the bottom edge
  c.strokeStyle = "#f4f7fb"; c.lineWidth = 2.6; c.beginPath(); bot.forEach((p, i) => (i ? c.lineTo(p[0], p[1] - 2) : c.moveTo(p[0], p[1] - 2))); c.stroke();
  c.restore();
}

// entrance doors + canopy band, drawn right on the glass wall
export function terminalDoors(c, t) {
  c.save();
  c.fillStyle = "rgba(235,245,246,0.9)"; path(c, [[545, 643], [645, 646], [645, 651], [545, 648]]); c.fill(); c.strokeStyle = "#3d4a5c"; c.lineWidth = 1; c.stroke();
  for (const x of [547, 580, 612, 644]) { c.fillStyle = "#dfe7ea"; c.fillRect(x - 1.5, 648, 3, 52); c.strokeStyle = "#5a6a72"; c.lineWidth = 0.8; c.strokeRect(x - 1.5, 648, 3, 52); }
  for (const [a, b] of [[549, 578], [582, 610], [614, 642]]) { c.fillStyle = "rgba(40,84,104,0.35)"; c.fillRect(a, 652, b - a, 46); const o = Math.max(0, Math.sin(t * 0.6 + a)) * 5; c.strokeStyle = "rgba(255,255,255,0.7)"; c.lineWidth = 1; c.strokeRect(a + 1 + o * 0.2, 653, (b - a) / 2 - 1, 44); c.strokeRect((a + b) / 2 + 1 - o * 0.2, 653, (b - a) / 2 - 2, 44); }
  c.restore();
}

// Y-shaped canopy columns, drawn directly in the warped (CTS) frame
export function columnLeft(c) {
  c.save(); c.lineCap = "round"; c.lineJoin = "round";
  const edge = "#5a4f40";
  const limb = (pts, w0, w1, col) => { const N = 16, left = [], right = []; const sp = (f) => { const i = f * (pts.length - 1), k = Math.min(pts.length - 2, Math.floor(i)), g = i - k; return [lerp(pts[k][0], pts[k + 1][0], g), lerp(pts[k][1], pts[k + 1][1], g)]; }; for (let i = 0; i <= N; i++) { const f = i / N, p = sp(f), p2 = sp(Math.min(1, f + 0.03)), p1 = sp(Math.max(0, f - 0.03)); const dx = p2[0] - p1[0], dy = p2[1] - p1[1], L = Math.hypot(dx, dy) || 1, w = lerp(w0, w1, f) / 2; left.push([p[0] - (dy / L) * w, p[1] + (dx / L) * w]); right.push([p[0] + (dy / L) * w, p[1] - (dx / L) * w]); } path(c, [...left, ...right.reverse()]); c.fillStyle = col; c.fill(); c.strokeStyle = edge; c.lineWidth = 1.3; c.stroke(); };
  const g = lg(c, 410, 0, 520, 0, [[0, "#ece3d0"], [0.6, "#d6cab2"], [1, "#b9ab90"]]);
  limb([[450, 718], [450, 690], [456, 662], [490, 626], [534, 606], [566, 601]], 44, 8, g);
  limb([[452, 672], [436, 646], [410, 630]], 22, 8, "#d6cab2");
  limb([[456, 668], [462, 640], [478, 616]], 16, 8, "#ccc0a6");
  c.strokeStyle = "rgba(255,255,255,0.5)"; c.lineWidth = 2.4; c.beginPath(); c.moveTo(438, 712); c.quadraticCurveTo(436, 672, 470, 636); c.stroke();
  c.restore();
}
export function columnRight(c) {
  c.save();
  c.fillStyle = lg(c, 792, 0, 815, 0, [[0, "#e8ebee"], [1, "#a9b1b8"]]); c.fillRect(792, 612, 14, 72); c.strokeStyle = "#3d4a5c"; c.lineWidth = 1.2; c.strokeRect(792, 612, 14, 72);
  c.beginPath(); c.moveTo(806, 640); c.quadraticCurveTo(826, 618, 846, 604); c.lineTo(852, 608); c.quadraticCurveTo(832, 632, 806, 664); c.closePath(); c.fillStyle = "#cfd6dc"; c.fill(); c.stroke();
  c.restore();
}
