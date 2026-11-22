// Covent Garden grid pass helpers (copied/rebuilt for tile 1,1; everything projected through P()).
import { P, INK, shade, lerp, rng } from "../../lib/vec-kit.js";

// ---- cobbles: rounded setts on the true grid, clipped to the inner paving (0.4..9.6) ----
let COB = null;
export function cobbles(k) {
  const c = k.ctx;
  c.save(); k._trace([P(0.4, 0.4), P(9.6, 0.4), P(9.6, 9.6), P(0.4, 9.6)], true, 0); c.clip();
  if (!COB) {
    const R = rng(5), cols = ["#e6c8b2", "#efd6bc", "#d9bcac", "#f4e0c4", "#e0c0b0", "#ecd0b4", "#dcc4ae", "#f7e8cf"];
    const groups = cols.map(() => new Path2D()), hi = new Path2D(), jt = new Path2D();
    const sw = 0.2, sh = 0.17;
    for (let b = 0.3, row = 0; b < 9.8; b += sh, row++) for (let a = 0.3 + (row % 2) * sw * 0.5; a < 9.8; a += sw) {
      const u = a + (R() - 0.5) * 0.02, v = b + (R() - 0.5) * 0.015, g = groups[Math.floor(R() * 8)];
      const w = sw * (0.84 + R() * 0.1), h = sh * (0.8 + R() * 0.1);
      const pts = [[u + 0.02, v + 0.02], [u + w, v + 0.02], [u + w, v + h], [u + 0.02, v + h]].map(([x, y]) => P(x, y));
      const cx = (pts[0][0] + pts[2][0]) / 2, cy = (pts[0][1] + pts[2][1]) / 2;
      const rc = pts.map(([x, y]) => [lerp(x, cx, 0.16), lerp(y, cy, 0.16)]);
      g.moveTo((rc[0][0] + rc[1][0]) / 2, (rc[0][1] + rc[1][1]) / 2);
      for (let i = 1; i <= 4; i++) { const p = pts[i % 4], q = rc[i % 4], nx = rc[(i + 1) % 4]; g.quadraticCurveTo(p[0], p[1], (q[0] + nx[0]) / 2, (q[1] + nx[1]) / 2); }
      g.closePath();
      jt.moveTo(rc[0][0], rc[0][1]); jt.lineTo(rc[1][0], rc[1][1]); jt.lineTo(rc[2][0], rc[2][1]);
      hi.moveTo(rc[3][0] + 1, rc[3][1] - 1); hi.lineTo(rc[0][0] + 1, rc[0][1] + 1); hi.lineTo(rc[1][0] - 1, rc[1][1] + 1);
    }
    COB = { groups, cols, hi, jt };
  }
  c.fillStyle = "#cdb09c"; c.fillRect(0, 0, 1024, 1024);
  COB.groups.forEach((g, i) => { c.fillStyle = COB.cols[i]; c.fill(g); });
  c.strokeStyle = "rgba(110,78,62,0.3)"; c.lineWidth = 0.6; c.stroke(COB.jt);
  c.strokeStyle = "rgba(255,246,228,0.5)"; c.lineWidth = 0.6; c.stroke(COB.hi);
  // lantern-warm wash + pools of light under the lamps (centres projected from the lamp positions)
  const wash = c.createLinearGradient(...P(0, 4), ...P(10, 10)); wash.addColorStop(0, "rgba(255,214,150,0.16)"); wash.addColorStop(1, "rgba(255,196,130,0.05)");
  c.fillStyle = wash; c.fillRect(0, 300, 1024, 700);
  for (const [u, v, r] of [[1.6, 4.3, 110], [8.5, 4.3, 110], [3.55, 8.5, 80], [5.0, 5.4, 100]]) { const [x, y] = P(u, v); const g = c.createRadialGradient(x, y, 4, x, y, r); g.addColorStop(0, "rgba(255,214,140,0.26)"); g.addColorStop(1, "rgba(255,214,140,0)"); c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); }
  c.restore();
  // kerb line round the cobbled area
  k.poly([[0.4, 0.4, 0], [9.6, 0.4, 0], [9.6, 9.6, 0], [0.4, 9.6, 0]], null, { lw: 1.3, stroke: "rgba(120,92,70,0.7)", wobble: 0 });
}

const soft = (k, u, v, r = 0.3, a = 0.16) => k.ell(u + 0.12, v + 0.06, 0, r, `rgba(60,45,30,${a})`, { stroke: false });

// ---- Victorian gas lamp: plinth, fluted column, scroll arms, glowing lantern; h = height in units ----
export function victorianLamp(k, u, v, h) {
  const c = k.ctx, t = k.t, [x, y] = P(u, v, 0), [, yb] = P(u, v, 0.32), [, yt] = P(u, v, h), G = "#1f2427";
  soft(k, u, v, 0.3);
  k.path([[x - 6, y], [x + 6, y], [x + 4.5, yb], [x - 4.5, yb]], { fill: G, lw: 1, wobble: 0 });
  c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 4.8; c.beginPath(); c.moveTo(x, yb); c.lineTo(x, yt + 12); c.stroke(); c.strokeStyle = G; c.lineWidth = 2.8; c.stroke();
  c.strokeStyle = "#5c666b"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - 0.9, yb - 2); c.lineTo(x - 0.9, yt + 13); c.stroke();
  for (const yy of [yt + 14, yt + 20, yb - 3]) { c.fillStyle = G; c.beginPath(); c.ellipse(x, yy, 3.4, 1.4, 0, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke(); }
  c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x - 8, yt + 12); c.quadraticCurveTo(x - 5, yt + 6, x, yt + 9); c.quadraticCurveTo(x + 5, yt + 6, x + 8, yt + 12); c.stroke();
  const fl = 0.8 + Math.sin(t * 9 + u * 3) * 0.08;
  const gl = c.createRadialGradient(x, yt, 1, x, yt, 26); gl.addColorStop(0, `rgba(255,220,130,${0.34 * fl})`); gl.addColorStop(1, "rgba(255,220,130,0)"); c.fillStyle = gl; c.beginPath(); c.arc(x, yt, 26, 0, 7); c.fill();
  k.path([[x - 4.6, yt + 9], [x + 4.6, yt + 9], [x + 5.8, yt - 5], [x - 5.8, yt - 5]], { fill: `rgba(255,230,150,${fl})`, lw: 1.1, wobble: 0 });
  c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x - 2, yt + 9); c.lineTo(x - 2.4, yt - 5); c.moveTo(x + 2, yt + 9); c.lineTo(x + 2.4, yt - 5); c.stroke();
  k.path([[x - 7, yt - 5], [x + 7, yt - 5], [x + 2.6, yt - 13], [x - 2.6, yt - 13]], { fill: G, lw: 1.1, wobble: 0 });
  c.fillStyle = G; c.beginPath(); c.arc(x, yt - 15, 2, 0, 7); c.fill(); c.stroke();
}

// ---- flower tub (barrel) ----
export function tub(k, u, v, seed, big = 1, tall = false) {
  const c = k.ctx, R = rng(seed), r = 0.26 * big, hh = 0.34 * big;
  soft(k, u, v, 0.35 * big);
  k.cyl(u, v, 0, r, hh, "#a87a45");
  const rp = r * 63.6;
  c.strokeStyle = "#5a3f22"; c.lineWidth = 1; for (const z of [0.08, 0.24]) { const [xx, yy] = P(u, v, z * big); c.beginPath(); c.ellipse(xx, yy, rp, rp * 0.577, 0, 0, Math.PI); c.stroke(); }
  const [x, y] = P(u, v, hh);
  c.fillStyle = "#6d9a4c"; c.beginPath(); c.ellipse(x, y - 2, rp * 0.95, rp * 0.55, 0, 0, 7); c.fill();
  const up = tall ? 14 : 4;
  for (let i = 0; i < (tall ? 30 : 16); i++) { const a = R() * 6.28, d = Math.sqrt(R()) * rp * 0.85; c.fillStyle = ["#f08bb5", "#e8607a", "#fff", "#f4c542", "#d94a5c"][i % 5]; c.beginPath(); c.arc(x + Math.cos(a) * d, y - 4 - R() * up + Math.sin(a) * d * 0.5 + Math.sin(k.t * 1.4 + i) * 0.4, 2.3, 0, 7); c.fill(); }
}
// bucket of cut flowers
export function bucket(k, u, v, seed, kind) {
  const c = k.ctx, R = rng(seed), [x, y] = P(u, v, 0);
  c.save(); c.translate(x, y); c.scale(0.8, 0.8); c.translate(-x, -y);
  k.path([[x - 9, y - 16], [x + 9, y - 16], [x + 7, y], [x - 7, y]], { fill: "#aeb6bb", lw: 1.1, wobble: 0 });
  c.strokeStyle = "rgba(255,255,255,0.5)"; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 4, y - 15); c.lineTo(x - 3, y - 1); c.stroke();
  for (let i = 0; i < 7; i++) {
    const dx = (R() - 0.5) * 16, h = 12 + R() * 12, sw = Math.sin(k.t * 1.5 + i + seed) * 1.5;
    c.strokeStyle = "#4f7a3a"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x + dx * 0.4, y - 16); c.lineTo(x + dx + sw, y - 16 - h); c.stroke();
    if (kind === "sun") { c.fillStyle = "#f2b82a"; c.beginPath(); c.arc(x + dx + sw, y - 16 - h, 4.6, 0, 7); c.fill(); c.fillStyle = "#6b4423"; c.beginPath(); c.arc(x + dx + sw, y - 16 - h, 2, 0, 7); c.fill(); }
    else if (kind === "lav") { c.fillStyle = "#8a74c8"; c.beginPath(); c.ellipse(x + dx + sw, y - 16 - h, 2.2, 6, 0, 0, 7); c.fill(); }
    else { c.fillStyle = ["#f08bb5", "#fff", "#e8607a"][i % 3]; c.beginPath(); c.arc(x + dx + sw, y - 16 - h, 3.4, 0, 7); c.fill(); }
  }
  c.restore();
}
export function plantedTree(k, u, v, seed, col, r, h) {
  k.ell(u + 0.4, v + 0.1, 0, r * 1.1, "rgba(70,45,45,0.2)", { stroke: false });
  k.tree(u, v, { r, h, seed, col });
}

// ---- stalls ----
const post = (k, a, b, h, col = "#e8d9bb") => { const c = k.ctx, [x, y] = P(a, b, 0), [, yt] = P(a, b, h); c.strokeStyle = INK; c.lineWidth = 3.4; c.lineCap = "round"; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt); c.stroke(); c.strokeStyle = col; c.lineWidth = 1.8; c.stroke(); };

// Flower stall, long axis along v (v0..v1), open front toward +u. Back posts at u0, counter, striped awning sloping to the front.
export function flowerStall(k, u0, v0, v1, t) {
  const c = k.ctx, dv = v1 - v0, R = rng(81);
  const parts = {};
  parts.back = () => {
    soft(k, u0 + 0.7, v0 + dv / 2, 1.5, 0.15);
    post(k, u0, v0 + 0.05, 2.05); post(k, u0, v1 - 0.05, 2.05);
    // back cloth + shelf of pots
    k.poly([[u0, v0 + 0.05, 0.1], [u0, v1 - 0.05, 0.1], [u0, v1 - 0.05, 1.25], [u0, v0 + 0.05, 1.25]], "#c9b48a", { lw: 1, wobble: 0 });
    for (let i = 0; i < 9; i++) { const [x, y] = P(u0 + 0.02, v0 + 0.2 + i * (dv - 0.4) / 8, 0.6); c.fillStyle = ["#e8607a", "#f4c542", "#f08bb5", "#fff", "#8a74c8"][i % 5]; c.strokeStyle = INK; c.lineWidth = 0.6; c.beginPath(); c.arc(x, y - 4, 3.2, 0, 7); c.fill(); c.stroke(); }
  };
  parts.front = () => {
    k.box(u0 + 0.5, v0 + 0.1, 0, 0.55, dv - 0.2, 0.42, "#a67a47", { hatch: false, shadow: false });
    for (let i = 0; i < 40; i++) { const [x, y] = P(u0 + 0.55 + R() * 0.45, v0 + 0.2 + R() * (dv - 0.4), 0.42); c.fillStyle = ["#f08bb5", "#fff", "#e8607a", "#f4c542", "#8a74c8"][i % 5]; c.strokeStyle = "rgba(42,36,32,0.6)"; c.lineWidth = 0.5; c.beginPath(); c.arc(x, y - 2 - R() * 3, 2.4, 0, 7); c.fill(); c.stroke(); }
    post(k, u0 + 1.2, v0 + 0.05, 1.6); post(k, u0 + 1.2, v1 - 0.05, 1.6);
  };
  parts.awning = () => {
    const n = 9;
    for (let i = 0; i < n; i++) {
      const a = v0 - 0.12 + ((dv + 0.24) * i) / n, b = v0 - 0.12 + ((dv + 0.24) * (i + 1)) / n, col = i % 2 ? "#f7efe2" : "#d63e3c";
      k.poly([[u0 - 0.08, a, 2.05], [u0 - 0.08, b, 2.05], [u0 + 1.3, b, 1.6], [u0 + 1.3, a, 1.6]], col, { lw: 0.9, wobble: 0 });
      // scalloped valance on the front lip
      const [x0, y0] = P(u0 + 1.3, a, 1.6), [x1, y1] = P(u0 + 1.3, b, 1.6);
      c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 6, x1, y1); c.lineTo(x1, y1 - 3); c.lineTo(x0, y0 - 3); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
    }
  };
  return parts;
}

// Pottery stall, long axis along u (u0..u1), open front toward +v.
export function potteryStall(k, u0, u1, v0, v1) {
  const c = k.ctx, du = u1 - u0, parts = {};
  parts.back = () => { soft(k, u0 + du / 2, v1 - 0.2, 1.5, 0.15); post(k, u0, v0, 2.0, "#a07a46"); post(k, u1, v0, 2.0, "#a07a46"); k.poly([[u0, v0, 0.1], [u1, v0, 0.1], [u1, v0, 1.3], [u0, v0, 1.3]], "#d8c9a4", { lw: 1, wobble: 0 });
    for (const a of [0.35, du - 0.45]) { const [x, y] = P(u0 + a, v0 + 0.05, 0.42); c.fillStyle = "#c79a4a"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.rect(x - 7, y - 25, 14, 18); c.fill(); c.stroke(); c.fillStyle = "#9ec0cf"; c.fillRect(x - 5, y - 23, 10, 8); c.fillStyle = "#6a9a58"; c.fillRect(x - 5, y - 15, 10, 6); }
  };
  parts.front = () => {
    const cv = v1 - 0.55;
    k.box(u0 + 0.05, cv, 0, du - 0.1, 0.4, 0.42, "#8d6a3f", { hatch: false, shadow: false });
    k.poly([[u0 + 0.03, cv + 0.42, 0.42], [u1 - 0.03, cv + 0.42, 0.42], [u1 - 0.03, cv + 0.42, 0.1], [u0 + 0.03, cv + 0.42, 0.1]], "#a8345a", { lw: 1, wobble: 0 });
    k.poly([[u0 + 0.03, cv + 0.42, 0.26], [u1 - 0.03, cv + 0.42, 0.26], [u1 - 0.03, cv + 0.42, 0.1], [u0 + 0.03, cv + 0.42, 0.1]], "#8a2548", { stroke: false });
    const vases = [[0.2, 0.2, 0.4, "#b8723d"], [0.45, 0.25, 0.3, "#c98648"], [0.7, 0.2, 0.45, "#a65f34"], [0.95, 0.28, 0.33, "#c98648"], [1.2, 0.2, 0.4, "#b8723d"], [1.45, 0.26, 0.28, "#a65f34"]];
    for (const [a, b, h, col] of vases) { if (a > du - 0.15) continue; const [x, y] = P(u0 + a + 0.1, cv + b, 0.42); c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - 2.4, y); c.quadraticCurveTo(x - 6, y - h * 16, x - 2, y - h * 30); c.lineTo(x + 2, y - h * 30); c.quadraticCurveTo(x + 6, y - h * 16, x + 2.4, y); c.closePath(); c.fill(); c.stroke(); }
    post(k, u0, v1, 1.55, "#a07a46"); post(k, u1, v1, 1.55, "#a07a46");
  };
  parts.awning = () => {
    const n = 8;
    for (let i = 0; i < n; i++) {
      const a = u0 - 0.1 + ((du + 0.2) * i) / n, b = u0 - 0.1 + ((du + 0.2) * (i + 1)) / n, col = i % 2 ? "#efdcae" : "#f6ecd0";
      k.poly([[a, v0 - 0.1, 2.0], [b, v0 - 0.1, 2.0], [b, v1 + 0.12, 1.55], [a, v1 + 0.12, 1.55]], col, { lw: 0.9, wobble: 0 });
      const [x0, y0] = P(a, v1 + 0.12, 1.55), [x1, y1] = P(b, v1 + 0.12, 1.55);
      c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 5, x1, y1); c.lineTo(x1, y1 - 3); c.lineTo(x0, y0 - 3); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
    }
  };
  return parts;
}

// ---- cafe table with wicker chairs and diners (seats: [du, dv, [facing du, dv]]) ----
export function cafeTable(k, u, v, seats, t, seed) {
  const c = k.ctx;
  soft(k, u, v, 0.55, 0.2);
  k.cyl(u, v, 0, 0.04, 0.4, "#b9b0a0", { top: false });
  k.cyl(u, v, 0.4, 0.24, 0.03, "#f6f0e2");
  const [x, y] = P(u, v, 0.43);
  c.fillStyle = "#e9e0d0"; c.fillRect(x - 4, y - 3, 3, 2.4); c.fillStyle = "#d9544b"; c.beginPath(); c.arc(x + 3, y - 1.4, 1.7, 0, 7); c.fill();
  const out = [];
  seats.forEach(([du, dv, dir], i) => out.push({ u: u + du, v: v + dv, dir, i }));
  return out;
}
export function drawDiner(k, s, seed, t, table) {
  const c = k.ctx;
  k.box(s.u - 0.14, s.v - 0.14, 0, 0.28, 0.28, 0.22, "#b98a50", { hatch: false, shadow: false });
  const p = k.person(s.u, s.v, { pose: "sit", bench: true, seatZ: 0.24, dir: s.dir, seed: seed + s.i, hat: s.i === 1 ? "sunhat" : undefined });
  if (s.i === 0) { const lift = Math.max(0, Math.sin(t * 1.1 + seed)) * 5; c.fillStyle = "#eaf1f4"; c.strokeStyle = INK; c.lineWidth = 0.6; c.beginPath(); c.rect(p.aR[0] - 1.4, p.aR[1] - 4 - lift, 2.8, 4); c.fill(); c.stroke(); }
}

// ---- juggler's clubs, scaled to the standard figure; (px, py) = feet ----
export function clubs(k, px, py, t) {
  const c = k.ctx, cols = ["#d9453a", "#3f8fd0", "#f2c230"];
  for (let i = 0; i < 3; i++) {
    const w = t * 1.0 + i / 3, cyc = Math.floor(w), ph = w - cyc, dir = (cyc + i) % 2;
    const xa = px + (dir ? 11 : -11), xb = px + (dir ? -11 : 11);
    const x = lerp(xa, xb, ph), y = py - 28 - 30 * 4 * ph * (1 - ph), ang = ph * Math.PI * 3 * (dir ? 1 : -1);
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(0.8, 0.8);
    c.fillStyle = cols[i]; c.strokeStyle = INK; c.lineWidth = 1.1;
    c.beginPath(); c.moveTo(-1.6, 9); c.lineTo(-4.2, -3); c.quadraticCurveTo(-4.4, -9, 0, -10); c.quadraticCurveTo(4.4, -9, 4.2, -3); c.lineTo(1.6, 9); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = "rgba(255,255,255,0.7)"; c.fillRect(-3.4, -3, 6.8, 1.6);
    c.restore();
  }
}

export function postBox(k, u, v) {
  const c = k.ctx;
  soft(k, u, v, 0.3, 0.17);
  k.cyl(u, v, 0, 0.19, 0.08, "#2a2420");
  k.cyl(u, v, 0.08, 0.16, 0.5, "#c8362f");
  k.cyl(u, v, 0.58, 0.19, 0.07, "#8f241e");
  k.cyl(u, v, 0.65, 0.15, 0.05, "#2a2420");
  k.cyl(u, v, 0.7, 0.12, 0.04, "#c8362f");
  c.fillStyle = "#1a1715"; const [sx, sy] = P(u + 0.02, v + 0.16, 0.45); c.fillRect(sx - 5, sy - 1, 10, 2.4);
  c.fillStyle = "#e9c24d"; c.font = "bold 5px sans-serif"; c.textAlign = "center"; const [tx, ty] = P(u, v + 0.16, 0.25); c.fillText("ER", tx, ty);
}

export function pigeon(k, u, v, o = {}) {
  const c = k.ctx, [x, y] = P(u, v, 0), t = k.t, ph = o.phase ?? 0, peck = Math.max(0, Math.sin(t * 5 + ph)) * 1.6;
  c.fillStyle = "#8f9aa6"; c.strokeStyle = INK; c.lineWidth = 0.8;
  c.beginPath(); c.ellipse(x, y - 2.4, 3.2, 1.9, 0, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.arc(x + 2.9, y - 4 + peck, 1.4, 0, 7); c.fill(); c.stroke();
  c.strokeStyle = "#c46b6b"; c.beginPath(); c.moveTo(x - 1, y - 0.8); c.lineTo(x - 1, y + 0.4); c.moveTo(x + 1, y - 0.8); c.lineTo(x + 1, y + 0.4); c.stroke();
}

export function keepOut(path, zones) {
  const ok = (p) => zones.every(([u, v, r]) => Math.hypot(p[0] - u, p[1] - v) > r);
  let best = [], cur = [];
  for (const p of path) { if (ok(p)) cur.push(p); else { if (cur.length > best.length) best = cur; cur = []; } }
  if (cur.length > best.length) best = cur;
  return best.length >= 2 ? best : path;
}
export function dense(path, step = 0.15) {
  const out = [path[0]];
  for (let i = 1; i < path.length; i++) {
    const [a, b] = [path[i - 1], path[i]], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let j = 1; j <= n; j++) out.push([lerp(a[0], b[0], j / n), lerp(a[1], b[1], j / n)]);
  }
  return out;
}

// gored parasol: pole, domed canopy with alternating panels
export function parasol(k, u, v, h, r, col) {
  const c = k.ctx, [x, y] = P(u, v, 0), [, yt] = P(u, v, h), rx = r * 45 * 1.414, ry = rx * 0.577, N = 8;
  c.strokeStyle = INK; c.lineWidth = 2.4; c.lineCap = "round"; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt - 8); c.stroke(); c.strokeStyle = "#e9e0d0"; c.lineWidth = 1.2; c.stroke();
  const rim = (i) => { const a = (i / N) * Math.PI * 2; return [x + Math.cos(a) * rx, yt + Math.sin(a) * ry]; };
  const apex = [x, yt - 13 - Math.sin(k.t * 1.2 + u) * 0.4];
  // visible (front) gores: rim angles with sin>=0 are the near half; draw all back-to-front
  const order = [...Array(N).keys()].sort((a, b) => Math.sin(((a + 0.5) / N) * 6.283) - Math.sin(((b + 0.5) / N) * 6.283));
  for (const i of order) {
    const pts = [apex];
    for (let j = 0; j <= 4; j++) { const a = ((i + j / 4) / N) * Math.PI * 2; pts.push([x + Math.cos(a) * rx, yt + Math.sin(a) * ry + Math.sin((j / 4) * Math.PI) * 2]); }
    c.beginPath(); pts.forEach((p, n) => (n ? c.lineTo(...p) : c.moveTo(...p))); c.closePath();
    c.fillStyle = i % 2 ? "#f6f0e2" : col; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.lineJoin = "round"; c.stroke();
  }
  void rim;
}
