// props for Dubai -1,0 (desert safari): camels, date palms, bushes, rocks, tent, fire, jeep, falcon. Private to this tile.
// Most things are drawn in CTS pixel space, traced from assets/dubai/-1_0.png.
import { P, CTS, INK, shade, mix, lerp, clamp, rng, smooth } from "../../lib/vec-kit.js";

const TAU = Math.PI * 2;

// ---------- soft shadow ----------
export function blob(c, x, y, rx, ry, col = "rgba(80,50,20,0.22)") {
  c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, -0.12, 0, TAU); c.fill();
}

// ---------- rocks ----------
export function rock(c, x, y, s = 1, seed = 1, col = "#c9a678") {
  const R = rng(seed * 31 + 7), n = 7, pts = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU; pts.push([x + Math.cos(a) * 9 * s * (0.8 + R() * 0.35), y - 4 * s + Math.sin(a) * 6 * s * (0.8 + R() * 0.3)]); }
  blob(c, x + 2 * s, y + 2 * s, 11 * s, 3.5 * s);
  c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath();
  c.fillStyle = col; c.fill(); c.strokeStyle = "#5a4430"; c.lineWidth = 1.1; c.stroke();
  c.fillStyle = shade(col, 0.16); c.beginPath(); c.ellipse(x - 2.5 * s, y - 7 * s, 4.5 * s, 2.4 * s, -0.2, 0, TAU); c.fill();
  c.fillStyle = shade(col, -0.18); c.beginPath(); c.ellipse(x + 3.5 * s, y - 1.5 * s, 4.5 * s, 2.6 * s, 0.1, 0, TAU); c.fill();
}

// ---------- desert tuft (spiky grass) ----------
export function tuft(c, x, y, s = 1, seed = 1, t = 0, col = "#8f9a46") {
  const R = rng(seed * 17 + 2);
  blob(c, x, y + 1, 12 * s, 3 * s, "rgba(80,50,20,0.16)");
  for (let i = 0; i < 16; i++) {
    const a = -Math.PI / 2 + (R() - 0.5) * 2.2, L = (12 + R() * 14) * s, sw = Math.sin(t * 1.5 + seed + i) * 1.4;
    const ex = x + Math.cos(a) * L + sw, ey = y + Math.sin(a) * L;
    c.beginPath(); c.moveTo(x + (R() - 0.5) * 6 * s, y); c.quadraticCurveTo(x + Math.cos(a) * L * 0.4, y + Math.sin(a) * L * 0.7, ex, ey);
    c.strokeStyle = "#4e5a26"; c.lineWidth = 2.6; c.lineCap = "round"; c.stroke();
    c.strokeStyle = i % 3 ? col : "#b6b45c"; c.lineWidth = 1.4; c.stroke();
  }
}

// ---------- oasis bush: lobed blobs, optional flowers ----------
export function bush(c, x, y, r = 16, seed = 1, t = 0, o = {}) {
  const R = rng(seed * 13 + 5), base = o.col || "#6d9a48";
  blob(c, x + 3, y + 1, r * 1.05, r * 0.32, "rgba(50,40,15,0.22)");
  const n = 7 + Math.round(r / 5), bl = [];
  for (let i = 0; i < n; i++) bl.push([x + (R() - 0.5) * r * 1.7, y - R() * r * 0.9 - r * 0.2, r * (0.45 + R() * 0.35)]);
  bl.sort((a, b) => a[1] - b[1]);
  for (const [bx, by, br] of bl) {
    const sw = Math.sin(t * 1.2 + bx * 0.1) * 0.8;
    c.beginPath(); c.arc(bx + sw, by, br, 0, TAU); c.fillStyle = shade(base, -0.22); c.fill();
    c.beginPath(); c.arc(bx + sw - br * 0.12, by - br * 0.14, br * 0.84, 0, TAU); c.fillStyle = shade(base, (R() - 0.5) * 0.18); c.fill();
    c.beginPath(); c.arc(bx + sw - br * 0.3, by - br * 0.34, br * 0.4, 0, TAU); c.fillStyle = shade(base, 0.2); c.fill();
  }
  if (o.flowers) {
    for (let i = 0; i < 9; i++) {
      const fx = x + (R() - 0.5) * r * 1.6, fy = y - R() * r * 1.0 - 3;
      c.beginPath(); c.arc(fx, fy, 2.1, 0, TAU); c.fillStyle = o.flowers; c.fill(); c.strokeStyle = "#7a2e48"; c.lineWidth = 0.6; c.stroke();
    }
  }
}
// reeds near the water
export function reeds(c, x, y, s = 1, seed = 1, t = 0) {
  const R = rng(seed * 11 + 3);
  for (let i = 0; i < 14; i++) {
    const bx = x + (R() - 0.5) * 22 * s, L = (18 + R() * 20) * s, lean = (R() - 0.5) * 8 + Math.sin(t * 1.3 + i + seed) * 2;
    c.beginPath(); c.moveTo(bx, y + R() * 3); c.quadraticCurveTo(bx + lean * 0.3, y - L * 0.6, bx + lean, y - L);
    c.strokeStyle = "#3f5a26"; c.lineWidth = 2.6; c.lineCap = "round"; c.stroke(); c.strokeStyle = i % 2 ? "#8cae4e" : "#6a9640"; c.lineWidth = 1.3; c.stroke();
  }
}

// ---------- date palm ----------
export function datePalm(c, t, bx, by, o = {}) {
  const h = o.h ?? 130, lean = o.lean ?? 0, L = o.L ?? 62, seed = o.seed ?? 1, tw = o.tw ?? 7;
  const R = rng(seed * 19 + 4);
  const sway = Math.sin(t * 0.9 + seed * 1.7) * 2.2;
  const cx = bx + lean + sway, cy = by - h;
  blob(c, bx + 8, by + 2, 24, 6, "rgba(60,45,20,0.25)");
  // trunk with ring marks
  const tr = (f) => { const x = lerp(bx, cx, f) + Math.sin(f * Math.PI) * lean * -0.15 + 0, y = lerp(by, cy, f); return [x, y]; };
  c.lineCap = "round";
  c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + lean * 0.1, by - h * 0.55, cx, cy);
  c.strokeStyle = INK; c.lineWidth = tw + 2.4; c.stroke();
  c.strokeStyle = "#8d6a44"; c.lineWidth = tw; c.stroke();
  c.strokeStyle = "#b08a5c"; c.lineWidth = tw * 0.35; c.save(); c.translate(-tw * 0.18, 0); c.stroke(); c.restore();
  // rings (perpendicular ticks along the curve)
  for (let i = 1; i < 26; i++) {
    const f = i / 26, p = bezier(bx, by, bx + lean * 0.1, by - h * 0.55, cx, cy, f), q = bezier(bx, by, bx + lean * 0.1, by - h * 0.55, cx, cy, f + 0.01);
    const tx = q[0] - p[0], ty = q[1] - p[1], m = Math.hypot(tx, ty) || 1, nx = -ty / m, ny = tx / m, w = (tw / 2) * (1 - f * 0.25);
    c.beginPath(); c.moveTo(p[0] - nx * w, p[1] - ny * w + 1.5); c.lineTo(p[0] + nx * w, p[1] + ny * w - 1.5); c.strokeStyle = "rgba(70,45,25,0.55)"; c.lineWidth = 1; c.stroke();
  }
  // back fronds, dates, front fronds
  const fr = [];
  const N = o.n ?? 19;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU + R() * 0.25, up = Math.sin(a);
    fr.push({ a, len: L * (1.0 + R() * 0.3), droop: 0.35 + R() * 0.4, back: up < -0.05 });
  }
  const drawFrond = (f, i) => {
    const sw = Math.sin(t * 1.3 + i * 0.9 + seed) * 0.05;
    const a = f.a + sw, dx = Math.cos(a), sy = Math.sin(a);
    const Lf = f.len;
    const rise = -0.5 + sy * 1.0, grav = 0.4 + f.droop * 0.3; // up-fronds rise first, all arch over and droop
    const pt = (s) => [cx + dx * Lf * s, cy + (rise * s + grav * s * s) * Lf * 0.8 + (sy > 0.3 ? 0 : 0)];
    const m = 22;
    const pts = []; for (let j = 0; j <= m; j++) pts.push(pt(j / m));
    // leaflets first (under the rib)
    for (let j = 2; j <= m; j++) {
      const s = j / m, p = pts[j], q = pts[j - 1], tx = p[0] - q[0], ty = p[1] - q[1], tm = Math.hypot(tx, ty) || 1;
      const ll = (5 + 19 * Math.sin(Math.PI * Math.pow(s, 0.7))) * (L / 62) + 1.5;
      for (const sd of [1, -1]) {
        // leaflets sweep forward along the rib and hang down
        const ox = p[0] + (tx / tm) * ll * 0.55 + (-ty / tm) * sd * ll * 0.55, oy = p[1] + (ty / tm) * ll * 0.55 + (tx / tm) * sd * ll * 0.55 + ll * 0.75;
        c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(ox, oy);
        c.strokeStyle = (j + (sd > 0 ? 1 : 0)) % 2 ? "#476f38" : "#628a46"; c.lineWidth = 1.5; c.stroke();
      }
    }
    c.beginPath(); pts.forEach((q, j) => (j ? c.lineTo(...q) : c.moveTo(...q))); c.strokeStyle = "#35502a"; c.lineWidth = 2.2; c.stroke();
    c.strokeStyle = "#8cb25c"; c.lineWidth = 0.9; c.stroke();
  };
  fr.filter((f) => f.back).forEach(drawFrond);
  // dates
  if (o.dates !== false) {
    for (let k = 0; k < 3; k++) {
      const ox = cx + (R() - 0.5) * 22, oy = cy + 4 + R() * 6, ln = 10 + R() * 8;
      c.strokeStyle = "#6a4a28"; c.lineWidth = 1.3; c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox + 1, oy + ln); c.stroke();
      for (let d = 0; d < 11; d++) { const dx = ox + (R() - 0.5) * 9, dy = oy + 3 + R() * ln; c.beginPath(); c.ellipse(dx, dy, 2.1, 2.9, 0, 0, TAU); c.fillStyle = d % 3 ? "#b9501f" : "#d4742a"; c.fill(); c.strokeStyle = "#5a2a12"; c.lineWidth = 0.5; c.stroke(); }
    }
  }
  fr.filter((f) => !f.back).forEach(drawFrond);
  // crown knot
  c.beginPath(); c.arc(cx, cy + 1, 5, 0, TAU); c.fillStyle = "#7a5a36"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
}
function bezier(x0, y0, x1, y1, x2, y2, f) { const a = 1 - f; return [a * a * x0 + 2 * a * f * x1 + f * f * x2, a * a * y0 + 2 * a * f * y1 + f * f * y2]; }
const quad = bezier;

// ---------- camel (side view facing +x; origin = ground below the middle of the body) ----------
function ik(hx, hy, fx, fy, l1, l2, bend) {
  const dx = fx - hx, dy = fy - hy; let d = Math.hypot(dx, dy); d = clamp(d, 1e-3, l1 + l2 - 0.01);
  const a = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), base = Math.atan2(dy, dx);
  const ang = base + a * bend;
  return [hx + Math.cos(ang) * l1, hy + Math.sin(ang) * l1];
}
function gait(p) {
  p = ((p % 1) + 1) % 1;
  if (p < 0.55) return { off: 1 - (2 * p) / 0.55, lift: 0 };
  const q = (p - 0.55) / 0.45;
  return { off: -1 + 2 * smooth(q), lift: Math.sin(Math.PI * q) };
}
export const CAMEL_COLS = ["#b3382f", "#2f5b8a", "#c9772b", "#8a2f4a"];
// s: path distance (units), flip: mirror, tilt: radians, moving: 0..1
export function camel(c, x, y, o = {}) {
  const { p = 0, flip = false, tilt = 0, seed = 1, t = 0, sc = 1.05, moving = 1, blanket = "#b3382f", load = 0 } = o;
  c.save(); c.translate(x, y); c.scale(flip ? -sc : sc, sc); c.rotate(tilt);
  const BODY = "#c89a62", DARK = "#9c7241", LEG = "#b98b55", LIT = "#dcb27a", OUT = "#4a3220";
  const bob = Math.sin(p * TAU * 2) * 0.9 * moving;
  blob(c, 2, 1, 27, 5.5, "rgba(80,50,25,0.28)");
  const legs = [
    { hx: -14, hy: -23, off: 0.0, hind: true, near: false }, { hx: 11, hy: -23, off: 0.5, hind: false, near: false },
    { hx: -14, hy: -23, off: 0.5, hind: true, near: true }, { hx: 11, hy: -23, off: 0.0, hind: false, near: true },
  ];
  // pace gait: same-side legs move together (hind slightly lagging)
  const legPos = legs.map((L) => {
    const g = moving ? gait(p + L.off + (L.hind ? 0.07 : 0)) : { off: 0, lift: 0 };
    const fx = L.hx + g.off * 7 + (L.hind ? -1 : 2), fy = -g.lift * 8;
    const hip = [L.hx, L.hy + bob];
    const knee = ik(hip[0], hip[1], fx, fy, 12.9, 12.9, L.hind ? 1 : -1);
    return { hip, knee, foot: [fx, fy], near: L.near, hind: L.hind };
  });
  const leg = (L) => {
    c.lineCap = "round"; c.lineJoin = "round";
    c.beginPath(); c.moveTo(...L.hip); c.lineTo(...L.knee); c.lineTo(...L.foot);
    c.strokeStyle = OUT; c.lineWidth = 5; c.stroke();
    c.strokeStyle = L.near ? LEG : DARK; c.lineWidth = 3.2; c.stroke();
    c.beginPath(); c.ellipse(L.foot[0] + 1.3, L.foot[1] - 0.2, 3.3, 1.7, 0, 0, TAU); c.fillStyle = "#6a4c2c"; c.fill();
    c.beginPath(); c.arc(L.knee[0], L.knee[1], 2.4, 0, TAU); c.fillStyle = L.near ? "#8a6339" : "#7a552f"; c.fill();
  };
  legPos.filter((L) => !L.near).forEach(leg);
  // tail
  const tw = Math.sin(t * 2.2 + seed) * 2;
  c.beginPath(); c.moveTo(-21, -31 + bob); c.quadraticCurveTo(-27 + tw, -26, -25 + tw * 1.3, -14); c.strokeStyle = OUT; c.lineWidth = 3.2; c.stroke(); c.strokeStyle = DARK; c.lineWidth = 1.7; c.stroke();
  c.beginPath(); c.ellipse(-25 + tw * 1.3, -12.5, 2.2, 3.4, 0, 0, TAU); c.fillStyle = "#4d3520"; c.fill();
  // neck + head (nod)
  const nod = Math.sin(p * TAU * 2 + 0.6) * 1.4 * moving + Math.sin(t * 0.8 + seed) * 0.6;
  const hx = 29, hy = -52 + nod;
  c.beginPath(); c.moveTo(6, -37 + bob); c.bezierCurveTo(14, -37 + bob, 14, -49, hx - 3, hy + 1); c.lineTo(hx + 3, hy + 4); c.bezierCurveTo(19, -45, 19, -29, 12, -24 + bob); c.closePath();
  c.fillStyle = BODY; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.4; c.stroke();
  // body
  c.beginPath(); c.moveTo(-21, -32 + bob); c.bezierCurveTo(-20, -39, -13, -44, -6, -46 + bob); c.bezierCurveTo(0, -46, 3, -39, 8, -37 + bob);
  c.bezierCurveTo(14, -36, 15, -29, 13, -25 + bob); c.bezierCurveTo(8, -18, -6, -17, -15, -19 + bob); c.bezierCurveTo(-21, -21, -23, -27, -21, -32 + bob); c.closePath();
  c.fillStyle = BODY; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.5; c.stroke();
  c.beginPath(); c.ellipse(-4, -22 + bob, 14, 3.4, 0, 0, Math.PI); c.fillStyle = "rgba(120,80,40,0.35)"; c.fill();
  c.beginPath(); c.ellipse(-8, -41 + bob, 6, 2.6, -0.5, 0, TAU); c.fillStyle = LIT; c.fill();
  // blanket + load
  const bl = blanket;
  c.beginPath(); c.moveTo(-14, -38 + bob); c.quadraticCurveTo(-5, -50, 5, -38 + bob); c.lineTo(8, -25 + bob); c.lineTo(-17, -25 + bob); c.closePath();
  c.fillStyle = bl; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.2; c.stroke();
  c.save(); c.clip();
  for (let i = -17; i < 10; i += 5) { c.fillStyle = i % 10 ? "#f1e3c0" : "#e2b04a"; c.fillRect(i, -52 + bob, 2.2, 28); }
  c.restore();
  for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(-15 + i * 4.6, -23.5 + bob, 1.4, 0, TAU); c.fillStyle = i % 2 ? "#f1e3c0" : "#e2b04a"; c.fill(); c.strokeStyle = OUT; c.lineWidth = 0.5; c.stroke(); }
  if (load) {
    c.beginPath(); c.roundRect(-9, -52 + bob, 14, 9, 2); c.fillStyle = "#8a5a32"; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.2; c.stroke();
    c.beginPath(); c.moveTo(-2, -52 + bob); c.lineTo(-2, -43 + bob); c.strokeStyle = "#e2c070"; c.lineWidth = 1.4; c.stroke();
  }
  // head
  c.save(); c.translate(hx, hy); c.rotate(0.28 + nod * 0.02);
  c.beginPath(); c.moveTo(-5, -3); c.bezierCurveTo(-3, -6, 5, -6, 10, -2); c.bezierCurveTo(13, 0, 13, 4, 9, 5); c.bezierCurveTo(4, 6, -3, 5, -6, 4); c.closePath();
  c.fillStyle = BODY; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.4; c.stroke();
  c.beginPath(); c.ellipse(9.5, 2.2, 3.6, 3, 0, 0, TAU); c.fillStyle = LIT; c.fill();
  c.beginPath(); c.arc(11.5, 1.5, 0.8, 0, TAU); c.fillStyle = OUT; c.fill();
  c.beginPath(); c.arc(2, -1.5, 1.35, 0, TAU); c.fillStyle = "#1a120c"; c.fill();
  c.beginPath(); c.ellipse(-4, -5, 1.4, 3, -0.6, 0, TAU); c.fillStyle = DARK; c.fill(); c.strokeStyle = OUT; c.lineWidth = 0.8; c.stroke();
  // halter
  c.strokeStyle = "#a8322a"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-1, -3); c.lineTo(3, 5); c.moveTo(6, 0); c.lineTo(10, 5); c.stroke();
  c.restore();
  // hump shading
  c.beginPath(); c.ellipse(-6, -44 + bob, 3.5, 1.8, -0.4, 0, TAU); c.fillStyle = "rgba(255,230,170,0.5)"; c.fill();
  legPos.filter((L) => L.near).forEach(leg);
  c.restore();
}
// screen position of the camel's lead-rope anchor (head) given the same transform
export function camelHead(x, y, flip, sc = 1.05, tilt = 0) {
  const lx = 38, ly = -49; const cs = Math.cos(tilt), sn = Math.sin(tilt);
  const rx = lx * cs - ly * sn, ry = lx * sn + ly * cs; return [x + (flip ? -rx : rx) * sc, y + ry * sc];
}

// ---------- flames & smoke ----------
export function flames(c, x, y, t) {
  const g = c.createRadialGradient(x, y, 2, x, y, 34); g.addColorStop(0, "rgba(255,190,80,0.45)"); g.addColorStop(1, "rgba(255,160,60,0)");
  c.fillStyle = g; c.beginPath(); c.ellipse(x, y + 2, 38, 18, 0, 0, TAU); c.fill();
  const cols = [["#d8421a", 1.0], ["#ff8a22", 0.78], ["#ffd24a", 0.52], ["#fff4b8", 0.28]];
  for (let k = 0; k < 4; k++) {
    for (let j = 0; j < 3; j++) {
      const ph = t * (7 + j * 1.8) + j * 2.1, h = (24 - j * 3) * cols[k][1] * (0.9 + 0.12 * Math.sin(ph)), w = (8 - j) * cols[k][1];
      const ox = (j - 1) * 6 + Math.sin(ph * 0.7) * 1.8;
      c.beginPath(); c.moveTo(x + ox - w, y);
      c.bezierCurveTo(x + ox - w * 0.9, y - h * 0.5, x + ox + Math.sin(ph) * 4, y - h * 0.7, x + ox + Math.sin(ph * 1.3) * 3, y - h);
      c.bezierCurveTo(x + ox + w * 0.2 + Math.sin(ph), y - h * 0.6, x + ox + w * 0.9, y - h * 0.4, x + ox + w, y);
      c.closePath(); c.fillStyle = cols[k][0]; c.fill();
    }
  }
  for (let i = 0; i < 7; i++) { const a = (t * 0.7 + i / 7) % 1; c.beginPath(); c.arc(x + Math.sin(i * 3 + t * 2) * 8 + a * 8, y - 14 - a * 44, 1.1 * (1 - a) + 0.3, 0, TAU); c.fillStyle = `rgba(255,${150 + 60 * (1 - a) | 0},60,${1 - a})`; c.fill(); }
}
export function smoke(c, x, y, t) {
  for (let i = 0; i < 16; i++) {
    const a = (t * 0.22 + i / 16) % 1, px = x + Math.sin(a * 7 + i * 1.7) * (3 + a * 10) + a * a * 26, py = y - a * 125, r = 3 + a * 12;
    const g = c.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, `rgba(250,248,242,${0.55 * (1 - a)})`); g.addColorStop(1, "rgba(250,248,242,0)");
    c.fillStyle = g; c.beginPath(); c.arc(px, py, r, 0, TAU); c.fill();
  }
}

// ---------- lanterns ----------
export function lantern(c, x, y, s, t, seed = 0) {
  const sw = Math.sin(t * 1.4 + seed) * 1.2, fl = 0.85 + 0.15 * Math.sin(t * 9 + seed * 3) * Math.sin(t * 5.3 + seed);
  c.strokeStyle = "#3a2a1c"; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y - 14 * s); c.lineTo(x + sw, y - 6 * s); c.stroke();
  const g = c.createRadialGradient(x + sw, y + 3 * s, 1, x + sw, y + 3 * s, 20 * s); g.addColorStop(0, `rgba(255,205,110,${0.65 * fl})`); g.addColorStop(1, "rgba(255,180,70,0)");
  c.fillStyle = g; c.beginPath(); c.arc(x + sw, y + 3 * s, 20 * s, 0, TAU); c.fill();
  c.save(); c.translate(x + sw, y);
  c.beginPath(); c.moveTo(-3 * s, -6 * s); c.lineTo(3 * s, -6 * s); c.lineTo(5 * s, 0); c.lineTo(4 * s, 9 * s); c.lineTo(-4 * s, 9 * s); c.lineTo(-5 * s, 0); c.closePath();
  c.fillStyle = `rgb(${255 * fl | 0},${205 * fl | 0},${110 * fl | 0})`; c.fill(); c.strokeStyle = "#4a3418"; c.lineWidth = 1.1; c.stroke();
  c.beginPath(); c.moveTo(-6 * s, -6 * s); c.lineTo(0, -11 * s); c.lineTo(6 * s, -6 * s); c.closePath(); c.fillStyle = "#c79a3a"; c.fill(); c.stroke();
  c.beginPath(); c.moveTo(0, -6 * s); c.lineTo(0, 9 * s); c.moveTo(-5 * s, 2 * s); c.lineTo(5 * s, 2 * s); c.strokeStyle = "rgba(70,45,20,0.6)"; c.lineWidth = 0.8; c.stroke();
  c.restore();
}

// ---------- jeep (uv boxes, long axis along v) ----------
function fp(c, u, v, z, face, pts, col, stroke = true) {
  // face 'R' (plane u): pts [[dv, dz]]; face 'L' (plane v): pts [[du, dz]]
  c.beginPath();
  pts.forEach(([a, b], i) => { const p = face === "R" ? P(u, v + a, z + b) : P(u + a, v, z + b); i ? c.lineTo(...p) : c.moveTo(...p); });
  c.closePath(); c.fillStyle = col; c.fill(); if (stroke) { c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke(); }
}
export function jeep(k, u, v, z, fwd, t, o = {}) {
  // fwd = +1 front points to +v (toward viewer), -1 away
  const c = k.ctx, W = "#f1eee4";
  const bz = z + 0.2;
  const fv = (a) => (fwd > 0 ? a : -a); // helper: offsets along the driving axis (front = positive)
  // shadow
  k.poly([[u - 0.25, v - 0.7, z + 0.01], [u + 0.45, v - 0.5, z + 0.01], [u + 0.45, v + 0.75, z + 0.01], [u - 0.25, v + 0.6, z + 0.01]], W === 0 ? "" : "rgba(80,50,20,0.22)", { stroke: false });
  const v0 = v - 0.6, L = 1.2;
  // body
  k.box(u - 0.27, v0, bz, 0.54, L, 0.3, W, { shadow: false, hatch: false });
  // cabin (set back from the front)
  const cv = fwd > 0 ? v0 : v0 + 0.32;
  k.box(u - 0.25, cv + 0.06, bz + 0.3, 0.5, 0.82, 0.32, shade(W, 0.02), { shadow: false, hatch: false });
  // windows on R face and the end face
  const cz = bz + 0.34;
  for (let i = 0; i < 3; i++) fp(c, u + 0.25, cv + 0.12 + i * 0.25, cz, "R", [[0, 0], [0.21, 0], [0.21, 0.2], [0, 0.2]], "#3d5062");
  fp(c, u - 0.2, cv + 0.88, cz, "L", [[0, 0], [0.4, 0], [0.4, 0.2], [0, 0.2]], "#3d5062");
  // roof rack + luggage
  const rz = bz + 0.62;
  k.box(u - 0.26, cv + 0.08, rz, 0.52, 0.8, 0.05, "#5a4a3a", { shadow: false, hatch: false });
  k.box(u - 0.2, cv + 0.12, rz + 0.05, 0.4, 0.3, 0.14, "#9a6a3a", { shadow: false, hatch: false });
  k.box(u - 0.2, cv + 0.46, rz + 0.05, 0.4, 0.26, 0.1, "#3a5a78", { shadow: false, hatch: false });
  // bull bar / spare wheel at the back
  const bk = fwd > 0 ? v0 : v0 + L;
  // wheels on the R face
  for (const wv of [v0 + 0.2, v0 + L - 0.2]) {
    const [ox, oy] = P(u + 0.27, wv, z + 0.13);
    c.save(); c.transform(-CTS.S, CTS.S * CTS.YS, 0, -CTS.S * CTS.ZS, ox, oy);
    c.beginPath(); c.arc(0, 0, 0.19, 0, TAU); c.restore();
    c.fillStyle = "#26221e"; c.fill();
    c.save(); c.transform(-CTS.S, CTS.S * CTS.YS, 0, -CTS.S * CTS.ZS, ox, oy); c.beginPath(); c.arc(0, 0, 0.08, 0, TAU); c.restore(); c.fillStyle = "#9a9aa0"; c.fill();
  }
  // headlights at the front end
  const fe = fwd > 0 ? v0 + L : v0;
  if (fwd > 0) { for (const du of [-0.2, 0.16]) { const [x, y] = P(u + du, fe, bz + 0.12); c.beginPath(); c.arc(x, y, 2.4, 0, TAU); c.fillStyle = "#fff6c0"; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke(); } }
}

// ---------- falcon ----------
export function falcon(c, x, y, ang, flap, s = 1) {
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
  const f = Math.sin(flap) * 7;
  c.fillStyle = "#6a4a30"; c.strokeStyle = INK; c.lineWidth = 1;
  c.beginPath(); c.moveTo(-6, 0); c.quadraticCurveTo(-3, -4 - f, 2, -9 - f * 1.6); c.quadraticCurveTo(3, -4, 5, -2); c.lineTo(5, 2); c.quadraticCurveTo(3, 4, 2, 9 + f * 1.6 - f * 0.2); c.quadraticCurveTo(-3, 4 + f, -6, 0);
  c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.ellipse(1, 0, 6, 2.6, 0, 0, TAU); c.fillStyle = "#8a6a48"; c.fill(); c.stroke();
  c.beginPath(); c.arc(7.5, -0.5, 2.1, 0, TAU); c.fillStyle = "#e8dcc4"; c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-6, 0); c.lineTo(-12, 2); c.lineTo(-11, -1.5); c.closePath(); c.fillStyle = "#5a3d28"; c.fill();
  c.restore();
}
