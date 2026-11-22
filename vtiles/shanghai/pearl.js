// Lujiazui hero modules: Oriental Pearl Tower, Shanghai Tower, SWFC "bottle opener", Jin Mao.
// Only vtiles/shanghai/0_0.js imports this file.
import { P, CTS, INK, shade, mix, lerp, clamp, rng, glint, SKYC } from "./_props.js";
import { tracePts, bil, glassFace } from "./_t0_0.js";

const CREAM = "#e9ddc6", PINK = "#c93468", PINK_D = "#97244f", LAT = "rgba(255,228,238,0.8)";

// ---------- sphere drawing with real latitude / longitude geometry ----------
const ST = 0.3, CT = Math.sqrt(1 - ST * ST); // camera tilt for the spheres
function sp(xc, yc, r, phi, lam) { const cp = Math.cos(phi); return [xc + r * cp * Math.sin(lam), yc - r * (Math.sin(phi) * CT - cp * Math.cos(lam) * ST)]; }
function limb(phi) { const tt = -Math.tan(phi) * (ST / CT); if (tt <= -1) return Math.PI; if (tt >= 1) return 0; return Math.acos(tt); }
function latCurve(xc, yc, r, phi, dir, n = 28) { const m = limb(phi), out = []; for (let i = 0; i <= n; i++) { const f = dir > 0 ? i / n : 1 - i / n; out.push(sp(xc, yc, r, phi, -m + 2 * m * f)); } return out; }
function band(c, xc, yc, r, p0, p1) { tracePts(c, [...latCurve(xc, yc, r, p1, 1), ...latCurve(xc, yc, r, p0, -1)]); }
function visible(phi, lam) { return Math.sin(phi) * ST + Math.cos(phi) * Math.cos(lam) * CT > 0; }
function latLine(c, xc, yc, r, phi) { const pts = latCurve(xc, yc, r, phi, 1, 30); c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.stroke(); }
// triangle lattice between two latitudes: diagonals both ways + latitude rings
function lattice(c, xc, yc, r, p0, p1, nLon, nLat, ph = 0) {
  c.beginPath();
  const dl = (Math.PI * 2) / nLon, dp = (p1 - p0) / nLat;
  for (let s of [1, -1]) for (let i = 0; i < nLon; i++) {
    let pen = false;
    for (let j = 0; j <= nLat * 3; j++) {
      const f = j / (nLat * 3), phi = p0 + (p1 - p0) * f, lam = ph + i * dl + s * f * nLat * dl * 0.5;
      if (!visible(phi, lam)) { pen = false; continue; }
      const p = sp(xc, yc, r, phi, lam); pen ? c.lineTo(...p) : c.moveTo(...p); pen = true;
    }
  }
  c.stroke();
  for (let j = 1; j < nLat; j++) latLine(c, xc, yc, r, p0 + j * dp);
}
function meridians(c, xc, yc, r, p0, p1, n, ph = 0) {
  c.beginPath();
  for (let i = 0; i < n; i++) { let pen = false; const lam = ph + (i / n) * Math.PI * 2; for (let j = 0; j <= 16; j++) { const phi = p0 + (p1 - p0) * j / 16; if (!visible(phi, lam)) { pen = false; continue; } const p = sp(xc, yc, r, phi, lam); pen ? c.lineTo(...p) : c.moveTo(...p); pen = true; } }
  c.stroke();
}
function dotsRow(c, xc, yc, r, phi, n, rad = 1.25) { c.fillStyle = "#2c2226"; for (let i = 0; i < n; i++) { const lam = (i / n) * Math.PI * 2; if (!visible(phi, lam) || Math.cos(lam) < 0.15) continue; const p = sp(xc, yc, r, phi, lam); c.beginPath(); c.ellipse(p[0], p[1], rad * (0.4 + 0.6 * Math.cos(lam)), rad, 0, 0, 7); c.fill(); } }
function sphereBody(c, xc, yc, r) {
  const g = c.createRadialGradient(xc - r * 0.42, yc - r * 0.45, r * 0.08, xc, yc, r * 1.05);
  g.addColorStop(0, "#ffffff"); g.addColorStop(0.5, "#f1ebe2"); g.addColorStop(1, "#b5aa98");
  c.beginPath(); c.arc(xc, yc, r, 0, 7); c.fillStyle = g; c.fill();
}
function sphereShade(c, xc, yc, r) {
  const g = c.createRadialGradient(xc - r * 0.38, yc - r * 0.42, r * 0.15, xc + r * 0.15, yc + r * 0.2, r * 1.08);
  g.addColorStop(0, "rgba(255,255,255,0.32)"); g.addColorStop(0.5, "rgba(255,255,255,0)"); g.addColorStop(0.85, "rgba(60,30,40,0.18)"); g.addColorStop(1, "rgba(40,20,30,0.42)");
  c.beginPath(); c.arc(xc, yc, r, 0, 7); c.fillStyle = g; c.fill();
  // rim light on the lower right (bounce)
  c.strokeStyle = "rgba(255,255,255,0.35)"; c.lineWidth = 1.2; c.beginPath(); c.arc(xc, yc, r - 1.6, 0.25, 1.25); c.stroke();
}
const D = Math.PI / 180;
function pinkBand(c, xc, yc, r, p0, p1, nLon, nLat, lw) {
  band(c, xc, yc, r, p0, p1); c.fillStyle = PINK; c.fill();
  c.save(); band(c, xc, yc, r, p0, p1); c.clip();
  // lattice cells alternate pink shades -> faceted glass
  c.strokeStyle = LAT; c.lineWidth = lw; lattice(c, xc, yc, r, p0, p1, nLon, nLat);
  c.restore();
  c.strokeStyle = PINK_D; c.lineWidth = 1; latLine(c, xc, yc, r, p0); latLine(c, xc, yc, r, p1);
}
function lowerSphere(c, xc, yc, r, t) {
  c.save(); c.beginPath(); c.arc(xc, yc, r, 0, 7); c.clip();
  sphereBody(c, xc, yc, r);
  c.strokeStyle = "rgba(120,105,95,0.4)"; c.lineWidth = 0.6; meridians(c, xc, yc, r, 34 * D, 90 * D, 28); meridians(c, xc, yc, r, -90 * D, -12 * D, 28);
  c.strokeStyle = "rgba(120,105,95,0.35)"; for (const p of [52, 62, 72, -24, -36, -50]) latLine(c, xc, yc, r, p * D);
  dotsRow(c, xc, yc, r, 45 * D, 26); dotsRow(c, xc, yc, r, -22 * D, 26);
  pinkBand(c, xc, yc, r, -11 * D, 33 * D, 44, 4, 1.05);
  // white trim rings either side of the pink band
  c.strokeStyle = "#fff8f0"; c.lineWidth = 2; latLine(c, xc, yc, r, 36 * D); latLine(c, xc, yc, r, -14 * D);
  c.strokeStyle = "rgba(90,70,60,0.5)"; c.lineWidth = 0.7; latLine(c, xc, yc, r, 37.5 * D); latLine(c, xc, yc, r, -15.5 * D);
  sphereShade(c, xc, yc, r);
  c.restore();
  c.strokeStyle = INK; c.lineWidth = 1.9; c.beginPath(); c.arc(xc, yc, r, 0, 7); c.stroke();
}
function upperSphere(c, xc, yc, r, t) {
  c.save(); c.beginPath(); c.arc(xc, yc, r, 0, 7); c.clip();
  sphereBody(c, xc, yc, r);
  pinkBand(c, xc, yc, r, 5.5 * D, 90 * D, 34, 6, 0.95);
  // cream belt + revolving restaurant glazing (mullions drift: it turns once an hour, sped up here)
  band(c, xc, yc, r, -1 * D, 5.5 * D); c.fillStyle = "#efe4cf"; c.fill();
  band(c, xc, yc, r, -11 * D, -1 * D); c.fillStyle = "#4e93a6"; c.fill();
  c.save(); band(c, xc, yc, r, -11 * D, -1 * D); c.clip();
  c.strokeStyle = "rgba(225,250,250,0.9)"; c.lineWidth = 0.9; meridians(c, xc, yc, r, -11 * D, -1 * D, 40, t * 0.15);
  c.fillStyle = "rgba(255,255,255,0.28)"; band(c, xc, yc, r, -4 * D, -1 * D); c.fill();
  c.restore();
  c.strokeStyle = "#e7c96e"; c.lineWidth = 1.3; latLine(c, xc, yc, r, -1 * D);
  c.strokeStyle = "rgba(90,70,60,0.55)"; c.lineWidth = 0.7; latLine(c, xc, yc, r, -11 * D);
  c.strokeStyle = "rgba(120,105,95,0.4)"; c.lineWidth = 0.6; meridians(c, xc, yc, r, -90 * D, -12 * D, 30); for (const p of [-24, -38, -54]) latLine(c, xc, yc, r, p * D);
  dotsRow(c, xc, yc, r, -30 * D, 22, 1);
  sphereShade(c, xc, yc, r);
  c.restore();
  c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath(); c.arc(xc, yc, r, 0, 7); c.stroke();
}
function smallSphere(c, xc, yc, r) {
  c.save(); c.beginPath(); c.arc(xc, yc, r, 0, 7); c.clip(); sphereBody(c, xc, yc, r);
  pinkBand(c, xc, yc, r, 8 * D, 90 * D, 16, 2, 0.8);
  band(c, xc, yc, r, -8 * D, 8 * D); c.fillStyle = "#efe4cf"; c.fill();
  band(c, xc, yc, r, -3 * D, 4 * D); c.fillStyle = "#4e93a6"; c.fill();
  c.strokeStyle = "rgba(120,105,95,0.4)"; c.lineWidth = 0.5; meridians(c, xc, yc, r, -90 * D, -9 * D, 18);
  sphereShade(c, xc, yc, r); c.restore();
  c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.arc(xc, yc, r, 0, 7); c.stroke();
}

// vertical round shaft (screen space): shaded cylinder with optional rings
function shaft(c, x, yBot, yTop, w, col = CREAM, o = {}) {
  const g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  g.addColorStop(0, shade(col, 0.02)); g.addColorStop(0.3, shade(col, 0.1)); g.addColorStop(0.7, shade(col, -0.08)); g.addColorStop(1, shade(col, -0.3));
  const e = w * 0.16;
  c.beginPath(); c.moveTo(x - w / 2, yTop); c.lineTo(x - w / 2, yBot); c.ellipse(x, yBot, w / 2, e, 0, Math.PI, 0, true); c.lineTo(x + w / 2, yTop); c.closePath();
  c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = o.lw ?? 1.4; c.stroke();
  if (o.rings) { c.strokeStyle = o.ringCol || "rgba(90,70,50,0.3)"; c.lineWidth = 0.7; c.beginPath(); for (let y = yTop + o.rings; y < yBot - 2; y += o.rings) { c.moveTo(x - w / 2, y); c.ellipse(x, y, w / 2, e, 0, Math.PI, 0, true); } c.stroke(); }
  if (o.top) { c.beginPath(); c.ellipse(x, yTop, w / 2, e, 0, 0, 7); c.fillStyle = shade(col, 0.12); c.fill(); c.stroke(); }
}
function collar(c, x, y, w, h, col = "#d9cdb5") { shaft(c, x, y + h / 2, y - h / 2, w, col, { top: true, lw: 1.2 }); }
function legStrut(c, x0, y0, x1, y1, w, jf, col = CREAM) {
  const L = Math.hypot(x1 - x0, y1 - y0), nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
  const quad = (o0, o1) => [[x0 + nx * o0, y0 + ny * o0], [x1 + nx * o0, y1 + ny * o0], [x1 + nx * o1, y1 + ny * o1], [x0 + nx * o1, y0 + ny * o1]];
  const g = c.createLinearGradient(x0 + nx * w / 2, y0 + ny * w / 2, x0 - nx * w / 2, y0 - ny * w / 2);
  g.addColorStop(0, shade(col, -0.25)); g.addColorStop(0.45, shade(col, 0.02)); g.addColorStop(0.75, shade(col, 0.12)); g.addColorStop(1, shade(col, -0.05));
  tracePts(c, quad(-w / 2, w / 2)); c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
  // segment joints along the strut
  c.strokeStyle = "rgba(90,70,50,0.32)"; c.lineWidth = 0.7; c.beginPath();
  for (let f = 0.12; f < 0.98; f += 0.11) { const x = lerp(x0, x1, f), y = lerp(y0, y1, f); c.moveTo(x + nx * w / 2, y + ny * w / 2); c.lineTo(x - nx * w / 2, y - ny * w / 2); }
  c.stroke();
  // steel cuff ball at the joint
  const jx = lerp(x0, x1, jf), jy = lerp(y0, y1, jf), cw = w * 1.35;
  const cg = c.createLinearGradient(jx - cw, jy - cw, jx + cw, jy + cw); cg.addColorStop(0, "#ffffff"); cg.addColorStop(0.5, "#c9ccd2"); cg.addColorStop(1, "#7f848c");
  tracePts(c, [[jx + nx * cw / 2 - (x1 - x0) / L * 7, jy + ny * cw / 2 - (y1 - y0) / L * 7], [jx + nx * cw / 2 + (x1 - x0) / L * 7, jy + ny * cw / 2 + (y1 - y0) / L * 7], [jx - nx * cw / 2 + (x1 - x0) / L * 7, jy - ny * cw / 2 + (y1 - y0) / L * 7], [jx - nx * cw / 2 - (x1 - x0) / L * 7, jy - ny * cw / 2 - (y1 - y0) / L * 7]]);
  c.fillStyle = cg; c.fill(); c.lineWidth = 1.3; c.strokeStyle = INK; c.stroke();
  c.beginPath(); c.ellipse(jx, jy, cw * 0.55, cw * 0.5, 0, 0, 7); c.fillStyle = cg; c.fill(); c.stroke();
  c.fillStyle = "rgba(255,255,255,0.8)"; c.beginPath(); c.ellipse(jx - 2.5, jy - 2.5, 2.4, 1.6, -0.6, 0, 7); c.fill();
}
function pod(c, x, y, w, h, on) {
  shaft(c, x, y + h / 2, y - h / 2, w, "#efe6d6", { top: true, lw: 1.1 });
  c.fillStyle = on ? "#ff4d80" : PINK; c.fillRect(x - w / 2 + 0.6, y - h * 0.18, w - 1.2, h * 0.36);
  c.strokeStyle = INK; c.lineWidth = 0.7; c.strokeRect(x - w / 2 + 0.6, y - h * 0.18, w - 1.2, h * 0.36);
  c.fillStyle = "rgba(255,255,255,0.65)"; c.fillRect(x - w * 0.32, y - h * 0.12, w * 0.18, h * 0.08);
  c.fillStyle = "#4e93a6"; for (const dx of [-0.3, 0, 0.3]) c.fillRect(x + dx * w - 1.2, y + h * 0.24, 2.4, 2);
}

export function makePearl(C, PZ) {
  const [AX0, GY0] = P(C, C, PZ);
  // every figure below is measured from the reference (px, axis x 509, plaza y 537) and re-anchored
  const X = (x) => AX0 + (x - 509), Y = (y) => GY0 + (y - 537);
  function podium(c, t) {
    const x = X(510), yb = Y(537), yt = Y(501), rx = 46, ry = rx * 0.33;
    // glass drum
    c.beginPath(); c.moveTo(x - rx, yt); c.lineTo(x - rx, yb); c.ellipse(x, yb, rx, ry, 0, Math.PI, 0, true); c.lineTo(x + rx, yt); c.closePath();
    const g = c.createLinearGradient(x - rx, 0, x + rx, 0); g.addColorStop(0, "#9dd0dc"); g.addColorStop(0.4, "#7fbccc"); g.addColorStop(1, "#4f8ea2");
    c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke();
    c.save(); c.clip();
    c.strokeStyle = "rgba(240,250,250,0.85)"; c.lineWidth = 1; c.beginPath();
    for (let i = -11; i <= 11; i++) { const s = i / 11.5, xx = x + Math.sin(s * Math.PI / 2) * rx, yy = yb + Math.cos(s * Math.PI / 2) * ry; c.moveTo(xx, yy); c.lineTo(xx, yy - (yb - yt) - 2); }
    c.stroke();
    c.strokeStyle = "rgba(30,70,90,0.5)"; c.lineWidth = 0.8; c.beginPath(); c.ellipse(x, yb - 14, rx, ry, 0, 0, Math.PI); c.stroke();
    // reflections sliding as the camera drifts
    c.fillStyle = "rgba(255,255,255,0.25)"; for (const o of [-30, 8]) { c.beginPath(); c.moveTo(x + o, yb + 8); c.lineTo(x + o + 9, yb + 8); c.lineTo(x + o + 20, yt); c.lineTo(x + o + 11, yt); c.closePath(); c.fill(); }
    c.restore();
    // cream base band + roof rim
    c.beginPath(); c.ellipse(x, yb, rx + 1, ry + 0.5, 0, 0, Math.PI); c.strokeStyle = "#e8dcc4"; c.lineWidth = 3; c.stroke();
    c.beginPath(); c.ellipse(x, yt, rx + 3, ry + 1.2, 0, 0, 7); c.fillStyle = "#efe5d2"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
    c.beginPath(); c.moveTo(x - rx - 3, yt); c.lineTo(x - rx - 3, yt + 4); c.ellipse(x, yt + 4, rx + 3, ry + 1.2, 0, Math.PI, 0, true); c.lineTo(x + rx + 3, yt); c.fillStyle = "#e2d5bd"; c.fill(); c.stroke();
    c.beginPath(); c.ellipse(x, yt - 1, rx - 6, ry - 2, 0, 0, 7); c.strokeStyle = "rgba(120,100,80,0.35)"; c.lineWidth = 0.8; c.stroke();
    // doors + EXIT sign
    c.fillStyle = "#2f5866"; c.fillRect(x - 7, yb + ry - 16, 14, 13); c.strokeStyle = INK; c.lineWidth = 0.9; c.strokeRect(x - 7, yb + ry - 16, 14, 13); c.beginPath(); c.moveTo(x, yb + ry - 16); c.lineTo(x, yb + ry - 3); c.stroke();
  }
  function drawBack(k, t) {
    const c = k.ctx;
    // back tripod leg (mostly hidden) + the two rear vertical columns
    legStrut(c, X(509), Y(470), X(509), Y(452), 12, 0.5);
    shaft(c, X(496), Y(503), Y(470), 13); shaft(c, X(526), Y(503), Y(470), 13);
    podium(c, t);
  }
  function draw(k, t) {
    const c = k.ctx;
    // front vertical column down to the plaza, with its steel collar
    shaft(c, X(511), Y(567), Y(472), 17.5, CREAM, { rings: 14 });
    collar(c, X(511), Y(505), 22, 9, "#d4d6da");
    // foot plinths
    for (const [x, y] of [[432, 563], [590, 560], [511, 567]]) { c.fillStyle = "#d9ccb2"; c.strokeStyle = INK; c.lineWidth = 1.1; c.beginPath(); c.ellipse(X(x), Y(y), 12, 4.5, 0, 0, 7); c.fill(); c.stroke(); }
    // the two visible tripod legs
    legStrut(c, X(488), Y(462), X(432), Y(561), 15, 0.43);
    legStrut(c, X(531), Y(460), X(590), Y(558), 15, 0.43);
    // lower sphere
    lowerSphere(c, X(510), Y(427.5), 47.5, t);
    // three columns between the spheres + core with the four pods
    shaft(c, X(509), Y(386), Y(238), 11, "#d9cdb3");
    shaft(c, X(497.5), Y(392), Y(236), 14, CREAM, { rings: 15 });
    shaft(c, X(521), Y(392), Y(236), 14, CREAM, { rings: 15 });
    [270, 303.5, 337.5, 370].forEach((y, i) => pod(c, X(509), Y(y), 17, 15, Math.floor(t * 1.4 + i * 0.7) % 3 === 0));
    // collar under the upper sphere + upper sphere
    collar(c, X(509), Y(240), 34, 8, "#e3d8c3");
    upperSphere(c, X(508.5), Y(205), 36.5, t);
    // neck: cream sleeve, pink ring, ribbed grey shaft
    shaft(c, X(508.5), Y(173), Y(152), 17, CREAM, { top: true });
    shaft(c, X(508.5), Y(155), Y(150), 19, PINK, { top: true, lw: 1 });
    shaft(c, X(508.5), Y(150), Y(116), 14, "#c8c3b8", { rings: 4.2, ringCol: "rgba(60,50,40,0.45)" });
    smallSphere(c, X(508.5), Y(106.5), 12.5);
    // mast + red/white antenna
    shaft(c, X(508.5), Y(96), Y(68), 11, "#cfc9bd", { rings: 6, ringCol: "rgba(60,50,40,0.4)" });
    shaft(c, X(508.5), Y(70), Y(64), 18, "#d64566", { top: true, lw: 1.1 });
    for (let y = 64, i = 0; y > 2; y -= 6, i++) { const w = lerp(6, 3.2, (64 - y) / 64); c.fillStyle = i % 2 ? "#f6f0e6" : "#d9334f"; c.fillRect(X(508.5) - w / 2, Y(y - 6), w, 6); }
    c.strokeStyle = INK; c.lineWidth = 1.1; c.beginPath(); c.moveTo(X(505.5), Y(64)); c.lineTo(X(506.9), Y(2)); c.moveTo(X(511.5), Y(64)); c.lineTo(X(510.1), Y(2)); c.stroke();
    shaft(c, X(508.5), Y(33), Y(30), 9, "#d9334f", { top: true, lw: 0.9 });
    const b = (t % 1.6) < 0.8; c.fillStyle = b ? "#ff2e2e" : "#7a1f1f"; c.beginPath(); c.arc(X(508.5), Y(1), 2.6, 0, 7); c.fill();
    if (b) { c.save(); c.globalAlpha = 0.3; c.fillStyle = "#ff5050"; c.beginPath(); c.arc(X(508.5), Y(1), 10, 0, 7); c.fill(); c.restore(); }
    // sun glints rolling over the glass
    const gs = (t * 0.3) % 1; if (gs < 0.35) glint(c, X(494) + gs * 34, Y(186) + gs * 8, 6 * Math.sin(gs / 0.35 * Math.PI) + 1);
    const gl = (t * 0.27 + 0.45) % 1; if (gl < 0.35) glint(c, X(486) + gl * 44, Y(404) + gl * 10, 7 * Math.sin(gl / 0.35 * Math.PI) + 1);
  }
  return { draw, drawBack, feet: [[432, 563], [590, 560]].map(([x, y]) => [X(x), Y(y)]) };
}

// ---------- Shanghai Tower: twisting rounded triangle with a V notch, sky-lobby rings, curled crown ----------
export function shanghaiTower(k, u, v, H, t) {
  const c = k.ctx, N = 64, M = 48, TW = 2.1;
  const Rf = (f) => 0.79 - 0.39 * Math.pow(f, 0.85) + (f < 0.06 ? (0.06 - f) * 0.9 : 0);
  const rad = (f, th) => { const a = th - TW * f; let w = ((a % 6.283) + 6.283) % 6.283; if (w > Math.PI) w -= 6.283; return Rf(f) * (1 + 0.1 * Math.cos(3 * a)) * (1 - 0.1 * Math.exp(-(w * w) / 0.02)); };
  const pt = (f, th) => { const r = rad(f, th); return [u + Math.cos(th) * r, v + Math.sin(th) * r, f * H]; };
  k.ell(u + 0.7, v + 0.3, 0, 1.3, "rgba(60,45,30,0.14)", { stroke: false });
  const lev = []; for (let i = 0; i <= N; i++) { const f = i / N, row = []; for (let j = 0; j < M; j++) row.push(pt(f, (j / M) * 6.283)); lev.push(row); }
  // faces
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) {
    const j2 = (j + 1) % M, A = lev[i][j], B = lev[i][j2], Cc = lev[i + 1][j2], Dd = lev[i + 1][j];
    const eu = B[0] - A[0], ev = B[1] - A[1], L = Math.hypot(eu, ev) || 1, nu = ev / L, nv = -eu / L;
    if (nu + nv < -0.05) continue;
    const s = (nu - nv) / Math.SQRT2; // -1 = faces screen-left (lit), +1 = right (shade)
    const f = (i + 0.5) / N;
    const warm = Math.exp(-(((s + 0.35) / 0.3) ** 2));
    let col = mix(mix("#a9c8dc", "#5f86a8", clamp((s + 1) / 2)), "#efe1c4", warm * 0.75);
    const lobby = Math.abs(((f * 9) % 1) - 0.5) > 0.44; // nine zones
    if (lobby) col = shade(col, 0.16);
    col = shade(col, Math.sin(f * 40 + j * 0.9) * 0.02);
    const q = [P(...A), P(...B), P(...Cc), P(...Dd)];
    c.beginPath(); q.forEach((p, ii) => (ii ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = col; c.lineWidth = 0.6; c.stroke();
  }
  // floor lines (every level and half level), mullions every 2 columns
  const vis = (i, j) => { const A = lev[i][j], B = lev[i][(j + 1) % M]; const eu = B[0] - A[0], ev = B[1] - A[1]; return ev - eu > -0.02; };
  c.lineWidth = 0.55; c.strokeStyle = "rgba(25,50,80,0.34)"; c.beginPath();
  for (let i = 0; i <= N; i++) for (let j = 0; j < M; j++) { if (!vis(i, j)) continue; const p = P(...lev[i][j]), q = P(...lev[i][(j + 1) % M]); c.moveTo(...p); c.lineTo(...q); }
  for (let i = 0; i < N; i++) { const f = (i + 0.5) / N; for (let j = 0; j < M; j++) { if (!vis(i, j)) continue; const p = P(...pt(f, (j / M) * 6.283)), q = P(...pt(f, ((j + 1) / M) * 6.283)); c.moveTo(...p); c.lineTo(...q); } }
  c.stroke();
  c.strokeStyle = "rgba(30,55,85,0.22)"; c.beginPath();
  for (let j = 0; j < M; j += 1) for (let i = 0; i < N; i++) { if (!vis(i, j)) continue; const p = P(...lev[i][j]), q = P(...lev[i + 1][j]); c.moveTo(...p); c.lineTo(...q); }
  c.stroke();
  // sky lobby rings: bright double lines
  { // sunlit warm column + shade, per level strip across the silhouette
    const sl0 = lev.map((row) => row.reduce((b, p3) => { const p = P(...p3); return !b || p[0] < b[0] ? p : b; }, null)), sr0 = lev.map((row) => row.reduce((b, p3) => { const p = P(...p3); return !b || p[0] > b[0] ? p : b; }, null));
    for (let i = 0; i < N; i++) {
      const a = sl0[i], b = sr0[i], cc = sr0[i + 1], d = sl0[i + 1];
      const g = c.createLinearGradient(a[0], 0, b[0], 0);
      g.addColorStop(0, "rgba(255,240,210,0.0)"); g.addColorStop(0.16, "rgba(255,232,190,0.5)"); g.addColorStop(0.3, "rgba(255,244,220,0.62)"); g.addColorStop(0.46, "rgba(255,236,200,0.12)"); g.addColorStop(0.7, "rgba(40,70,110,0.0)"); g.addColorStop(1, "rgba(30,55,90,0.28)");
      c.beginPath(); c.moveTo(a[0] - 0.5, a[1] + 0.5); c.lineTo(b[0] + 0.5, b[1] + 0.5); c.lineTo(cc[0] + 0.5, cc[1] - 0.5); c.lineTo(d[0] - 0.5, d[1] - 0.5); c.closePath(); c.fillStyle = g; c.fill();
    }
  }
  // spiral ribbons: each zone's skin edge slopes round the tower (the twisting look)
  for (let zn = 1; zn < 9; zn++) {
    const rib = (th) => { const a = th - TW * (zn / 9); let w = ((a % 6.283) + 6.283) % 6.283; return zn / 9 + 0.085 * (w / 6.283) - 0.04; };
    const run = (dz, col, lw) => { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); let pen = false, prev = null; for (let j = 0; j <= 160; j++) { const th = (j / 160) * 6.283, f = rib(th) + dz, a = pt(f, th), b = pt(f, th + 0.06); const vis = (b[1] - a[1]) - (b[0] - a[0]) >= 0, p = P(...a); if (!vis || (prev != null && Math.abs(f - prev) > 0.02)) { pen = false; } if (vis) { pen ? c.lineTo(...p) : c.moveTo(...p); pen = true; } prev = f; } c.stroke(); };
    run(0, "rgba(250,245,232,0.9)", 2.4); run(-0.006, "rgba(40,65,95,0.45)", 0.8);
  }
  // the spiralling notch seam
  c.lineCap = "round";
  for (const [w, col] of [[2.4, "rgba(40,60,85,0.7)"], [1, "rgba(255,255,255,0.8)"]]) {
    c.strokeStyle = col; c.lineWidth = w; c.beginPath(); let pen = false;
    for (let i = 0; i <= 80; i++) { const f = i / 80, th = TW * f, a = pt(f, th), b = pt(f, th + 0.1); if ((b[1] - a[1]) - (b[0] - a[0]) < -0.01) { pen = false; continue; } const p = P(...a); pen ? c.lineTo(p[0] + (w > 2 ? 0 : -1.2), p[1]) : c.moveTo(p[0], p[1]); pen = true; }
    c.stroke();
  }
  // silhouette
  const sil = (side) => lev.map((row) => { let best = null; for (const p3 of row) { const p = P(...p3); if (!best || (side ? p[0] > best[0] : p[0] < best[0])) best = p; } return best; });
  c.strokeStyle = INK; c.lineWidth = 1.7; c.lineJoin = "round";
  for (const s of [false, true]) { const pts = sil(s); c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.stroke(); }
  // crown: open top ring with the inner wall, and the curl rising on the notch side
  const top = lev[N].map((p) => P(...p));
  c.beginPath(); top.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.fillStyle = "#cfe2ec"; c.fill(); c.stroke();
  const inner = lev[N].map(([x, y, z]) => P(u + (x - u) * 0.72, v + (y - v) * 0.72, z - 0.05));
  c.beginPath(); inner.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.fillStyle = "#4f7898"; c.fill(); c.lineWidth = 1; c.stroke();
  c.strokeStyle = "rgba(255,255,255,0.7)"; c.lineWidth = 0.8; c.beginPath(); inner.slice(0, M / 2).forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.stroke();
  // sparkles
  const R = rng(5);
  for (let i = 0; i < 7; i++) { const ph = R() * 9, f = 0.1 + R() * 0.8, s = Math.max(0, Math.sin(t * (1.1 + R()) + ph)); const p = P(...pt(f, 2.3 + R() * 0.8)); if (s > 0.86) glint(c, p[0], p[1], (s - 0.86) / 0.14 * 7 + 1.5); }
}

// ---------- SWFC: square shaft whose front corner is sheared away, aperture at the top ----------
export function swfc(k, u0, v0, du, dv, H, t) {
  const c = k.ctx, w = 0.07, tap = (f) => 1 - 0.085 * f;
  const uc = u0 + du / 2, vc = v0 + dv / 2;
  const Q = (a, b, f) => { const s = tap(f); return P(uc + (a - 0.5) * du * s, vc + (b - 0.5) * dv * s, f * H); };
  const cut = (f) => 1 - (1 - w) * f; // a/b of the front chamfer at height f
  k.shadow([[u0 + du, v0, 0], [u0 + du + H * 0.28, v0 + H * 0.08, 0], [u0 + du + H * 0.28, v0 + dv + H * 0.08, 0], [u0 + du, v0 + dv, 0]], 0.1);
  const n = 20;
  // left face (b = 1): a from 0 to cut(f)
  const Lpts = [Q(0, 1, 0), Q(1, 1, 0), ...Array.from({ length: n + 1 }, (_, i) => Q(cut(i / n), 1, i / n)).slice(1), Q(0, 1, 1)];
  const Rpts = [Q(1, 0, 0), Q(1, 1, 0), ...Array.from({ length: n + 1 }, (_, i) => Q(1, cut(i / n), i / n)).slice(1), Q(1, 0, 1)];
  const Fpts = [Q(1, 1, 0), Q(w, 1, 1), Q(1, w, 1)];
  const face = (pts, colTop, colBot, fl, kind) => {
    c.save(); tracePts(c, pts);
    const ys = pts.map((p) => p[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, colTop); g.addColorStop(1, colBot); c.fillStyle = g; c.fill(); c.clip();
    c.lineWidth = 0.55; c.strokeStyle = "rgba(20,40,70,0.32)"; c.beginPath();
    for (let i = 1; i < 90; i++) { const f = i / 90; const [a, b] = fl(f); c.moveTo(...a); c.lineTo(...b); }
    c.stroke();
    return () => c.restore();
  };
  // left (shaded sliver)
  let done = face(Lpts, "#7d9fbf", "#557ea4", (f) => [Q(0, 1, f), Q(cut(f), 1, f)]);
  c.strokeStyle = "rgba(20,40,70,0.25)"; c.beginPath(); for (let i = 1; i < 8; i++) { const a = i / 8; c.moveTo(...Q(a, 1, 0)); c.lineTo(...Q(a, 1, Math.min(1, (1 - a) / (1 - w)))); } c.stroke();
  c.fillStyle = "rgba(255,255,255,0.12)"; tracePts(c, [Q(0, 1, 0), Q(0.25, 1, 0), Q(0.05, 1, 1), Q(0, 1, 1)]); c.fill();
  done();
  // right (deep blue)
  done = face(Rpts, "#5a80a8", "#3f6690", (f) => [Q(1, 0, f), Q(1, cut(f), f)]);
  c.strokeStyle = "rgba(10,25,50,0.28)"; c.beginPath(); for (let i = 1; i < 12; i++) { const b = i / 12; c.moveTo(...Q(1, b, 0)); c.lineTo(...Q(1, b, Math.min(1, (1 - b) / (1 - w)))); } c.stroke();
  // reflected cloud patch drifting
  c.fillStyle = "rgba(255,250,235,0.18)"; const cf = 0.3 + 0.05 * Math.sin(t * 0.2); tracePts(c, [Q(1, 0.2, cf), Q(1, 0.45, cf - 0.03), Q(1, 0.45, cf + 0.06), Q(1, 0.2, cf + 0.09)]); c.fill();
  done();
  // front chamfer: pale sky glass with a warm sunlit core
  c.save(); tracePts(c, Fpts);
  const ys = Fpts.map((p) => p[1]), gy0 = Math.min(...ys), gy1 = Math.max(...ys);
  const g = c.createLinearGradient(0, gy0, 0, gy1); g.addColorStop(0, "#c5dbe8"); g.addColorStop(0.35, "#e8e2cf"); g.addColorStop(0.6, "#f1dcb6"); g.addColorStop(1, "#9db9cf");
  c.fillStyle = g; c.fill(); c.clip();
  const sg = c.createLinearGradient(Fpts[1][0], 0, Fpts[2][0], 0); sg.addColorStop(0, "rgba(90,130,170,0.35)"); sg.addColorStop(0.45, "rgba(255,255,255,0)"); sg.addColorStop(1, "rgba(70,110,150,0.3)");
  c.fillStyle = sg; c.fillRect(Fpts[1][0], gy0, Fpts[2][0] - Fpts[1][0], gy1 - gy0);
  c.lineWidth = 0.55; c.strokeStyle = "rgba(60,80,100,0.3)"; c.beginPath();
  for (let i = 1; i < 90; i++) { const f = i / 90; c.moveTo(...Q(cut(f), 1, f)); c.lineTo(...Q(1, cut(f), f)); }
  c.stroke();
  c.beginPath(); c.strokeStyle = "rgba(60,80,100,0.22)";
  for (let j = 1; j < 16; j++) { const s = j / 16; const a = Q(lerp(w, 1, s), lerp(1, w, s), 1); c.moveTo(...Fpts[0]); c.lineTo(...a); }
  c.stroke();
  c.restore();
  // edges
  c.strokeStyle = INK; c.lineWidth = 1.6; c.lineJoin = "round";
  tracePts(c, [Q(0, 1, 0), Q(1, 1, 0), Q(1, 0, 0), Q(1, 0, 1), Q(1, w, 1), Q(w, 1, 1), Q(0, 1, 1)]); c.stroke();
  c.lineWidth = 1.1; c.beginPath(); c.moveTo(...Q(1, 1, 0)); c.lineTo(...Q(w, 1, 1)); c.moveTo(...Q(1, 1, 0)); c.lineTo(...Q(1, w, 1)); c.stroke();
  // top ridge
  k.path([Q(0, 1, 1), Q(w, 1, 1), Q(1, w, 1), Q(1, 0, 1), Q(1 - w, 0, 1), Q(0, 1 - w, 1)], { fill: "#b9d0de", lw: 1.3, wobble: 0 });
  // aperture: trapezoid through the chamfer, inner walls + bottom bridge
  const fa = 0.865, fb = 0.965;
  const ap = (f, s) => Q(lerp(cut(f), 1, s), lerp(1, cut(f), s), f);
  const A = [ap(fa, 0.2), ap(fa, 0.8), ap(fb, 0.87), ap(fb, 0.13)];
  tracePts(c, A); c.fillStyle = SKYC; c.fill();
  c.save(); tracePts(c, A); c.clip();
  // inner left wall, inner top lip, bottom bridge (two-tone)
  tracePts(c, [A[3], A[0], [A[0][0] + 9, A[0][1] - 3], [A[3][0] + 9, A[3][1] + 4]]); c.fillStyle = "#4f6f8c"; c.fill();
  tracePts(c, [A[3], A[2], [A[2][0], A[2][1] + 5], [A[3][0], A[3][1] + 5]]); c.fillStyle = "#6c8aa6"; c.fill();
  tracePts(c, [A[0], A[1], [A[1][0], A[1][1] - 9], [A[0][0], A[0][1] - 9]]); c.fillStyle = "#c9d6de"; c.fill();
  tracePts(c, [[A[0][0], A[0][1] - 9], [A[1][0], A[1][1] - 9], [A[1][0], A[1][1] - 13], [A[0][0], A[0][1] - 13]]); c.fillStyle = "#7f98ad"; c.fill();
  c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.moveTo(A[0][0], A[0][1] - 9); c.lineTo(A[1][0], A[1][1] - 9); c.stroke();
  c.restore();
  tracePts(c, A); c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
  // sparkles
  const R = rng(11);
  for (let i = 0; i < 6; i++) { const ph = R() * 9, f = 0.15 + R() * 0.6, s = Math.max(0, Math.sin(t * (1 + R()) + ph)); const p = Q(0.3 + R() * 0.6, 1, f * 0.6); if (s > 0.87) glint(c, p[0] + 20, p[1], (s - 0.87) / 0.13 * 7 + 1.5); }
}

// ---------- Jin Mao: stone-and-steel shaft with pagoda-like tiered setbacks and a lantern crown ----------
export function jinMao(k, u, v, du, dv, H, t) {
  const c = k.ctx, uc = u + du / 2, vc = v + dv / 2;
  const box = (s, z0, z1, i) => {
    const hu = du * s / 2, hv = dv * s / 2, uu = uc - hu, vv = vc - hv;
    const L = [P(uu, vv + 2 * hv, z0), P(uu + 2 * hu, vv + 2 * hv, z0), P(uu + 2 * hu, vv + 2 * hv, z1), P(uu, vv + 2 * hv, z1)];
    const R = [P(uu + 2 * hu, vv, z0), P(uu + 2 * hu, vv + 2 * hv, z0), P(uu + 2 * hu, vv + 2 * hv, z1), P(uu + 2 * hu, vv, z1)];
    for (const [q, col, dark] of [[L, "#ddcfae", 0], [R, "#b5a682", 1]]) {
      c.save(); tracePts(c, q); const g = c.createLinearGradient(0, q[3][1], 0, q[0][1]); g.addColorStop(0, shade(col, 0.08)); g.addColorStop(1, shade(col, -0.06)); c.fillStyle = g; c.fill(); c.clip();
      // paired silver mullion strips and dark glass between (Jin Mao's aluminium lattice)
      const nc = Math.max(4, Math.round((dark ? dv : du) * s * 16)), fl = Math.max(2, Math.round((z1 - z0) / 0.12));
      for (let j = 0; j < nc; j++) { tracePts(c, [bil(q, (j + 0.28) / nc, 0), bil(q, (j + 0.72) / nc, 0), bil(q, (j + 0.72) / nc, 1), bil(q, (j + 0.28) / nc, 1)]); c.fillStyle = dark ? "#5f7a8e" : "#7893a6"; c.fill(); }
      c.strokeStyle = "rgba(255,250,235,0.55)"; c.lineWidth = 0.6; c.beginPath(); for (let r = 1; r < fl; r++) { const a = bil(q, 0, r / fl), b = bil(q, 1, r / fl); c.moveTo(...a); c.lineTo(...b); } c.stroke();
      c.restore(); tracePts(c, q); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
    }
    // gold ledge on top of the tier
    const e = 0.05, T = [P(uu - e, vv - e, z1), P(uu + 2 * hu + e, vv - e, z1), P(uu + 2 * hu + e, vv + 2 * hv + e, z1), P(uu - e, vv + 2 * hv + e, z1)];
    k.path(T, { fill: "#ece2c4", lw: 1.1, wobble: 0 });
    const Fl = [P(uu - e, vv + 2 * hv + e, z1 - 0.07), P(uu + 2 * hu + e, vv + 2 * hv + e, z1 - 0.07), P(uu + 2 * hu + e, vv + 2 * hv + e, z1), P(uu - e, vv + 2 * hv + e, z1)];
    const Fr = [P(uu + 2 * hu + e, vv - e, z1 - 0.07), P(uu + 2 * hu + e, vv + 2 * hv + e, z1 - 0.07), P(uu + 2 * hu + e, vv + 2 * hv + e, z1), P(uu + 2 * hu + e, vv - e, z1)];
    k.path(Fl, { fill: "#d8c48c", lw: 0.9, wobble: 0 }); k.path(Fr, { fill: "#a99a72", lw: 0.9, wobble: 0 });
  };
  k.shadow([[u + du, v, 0], [u + du + H * 0.25, v + H * 0.08, 0], [u + du + H * 0.25, v + dv + H * 0.08, 0], [u + du, v + dv, 0]], 0.1);
  // shaft then 8 setbacks that get shorter and narrower (the pagoda rhythm), then the crown
  const tiers = [[1, 0, 0.56]]; let z = 0.56, s = 1, hh = 0.075;
  for (let i = 0; i < 8; i++) { s *= 0.93; const z1 = z + hh * (1 - i * 0.07); tiers.push([s, z, z1]); z = z1; }
  tiers.forEach(([sc, a, b], i) => box(sc, a * H, b * H, i));
  const zt = z * H, sc = s * 0.8;
  // columned lantern drum + ribbed dome + spire (as in the painting's crown)
  const [x, y] = P(uc, vc, zt), rx = du * sc * 45 * 0.75, hDrum = 0.55 * 42.3;
  c.beginPath(); c.moveTo(x - rx, y - hDrum); c.lineTo(x - rx, y); c.ellipse(x, y, rx, rx * 0.4, 0, Math.PI, 0, true); c.lineTo(x + rx, y - hDrum); c.closePath();
  c.fillStyle = "#4f6b80"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
  for (let i = 0; i < 9; i++) { const a = Math.PI * (0.06 + 0.88 * i / 8), xx = x - Math.cos(a) * rx * 0.96, yy = y + Math.sin(a) * rx * 0.36; const g = c.createLinearGradient(xx - 2, 0, xx + 2, 0); g.addColorStop(0, "#f2e8d2"); g.addColorStop(1, "#bfae88"); c.fillStyle = g; c.fillRect(xx - 1.8, yy - hDrum, 3.6, hDrum); c.strokeStyle = INK; c.lineWidth = 0.6; c.strokeRect(xx - 1.8, yy - hDrum, 3.6, hDrum); }
  c.beginPath(); c.ellipse(x, y - hDrum, rx + 2, rx * 0.42 + 1, 0, 0, 7); c.fillStyle = "#e6d6a6"; c.fill(); c.lineWidth = 1.1; c.stroke();
  k.dome(uc, vc, zt + 0.55, rx / (45 * Math.SQRT2) + 0.02, 0.75, "#cdbf9c", { ribs: 6 });
  const zs = zt + 0.55 + 0.7;
  k.cyl(uc, vc, zs, 0.05, 0.3, "#e3c46a");
  const a = P(uc, vc, zs + 0.3), b = P(uc, vc, zs + 1.7); c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); c.strokeStyle = "#e9cf7a"; c.lineWidth = 1.8; c.stroke();
  for (const zz of [0.6, 1.0]) { const p = P(uc, vc, zs + zz); c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(p[0] - 3.5, p[1]); c.lineTo(p[0] + 3.5, p[1]); c.stroke(); }
  const R = rng(3); for (let i = 0; i < 3; i++) { const ph = R() * 9, s2 = Math.max(0, Math.sin(t * 1.3 + ph)); const p = P(u + 0.2 + R() * 0.4, v + dv, 0.5 + R() * 3.5); if (s2 > 0.88) glint(c, p[0], p[1], (s2 - 0.88) / 0.12 * 6 + 1.5); }
}
