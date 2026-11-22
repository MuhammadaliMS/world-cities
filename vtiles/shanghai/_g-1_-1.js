// Shanghai -1,-1 helpers (copied from the old tile, rebuilt axis-aligned for the grid pass).
import { P, CTS, INK, shade, mix, lerp, clamp, rng, hash, prism } from "./_props.js";
export { P, CTS, INK, shade, mix, lerp, clamp, rng, hash, prism };
export const ZW = -0.25; // river surface (promenade at 0)
export const WATER = [[0.3, 5.6], [9.7, 5.6], [9.7, 9.7], [0.3, 9.7]];

// ---------- quay railing, posts, lamps ----------
export function railPanel(k, a, b) {
  const c = k.ctx;
  const A = (f, z) => P(lerp(a[0], b[0], f), lerp(a[1], b[1], f), z);
  // stone plinth (front face toward the river + top)
  const wu = -(b[1] - a[1]), wv = b[0] - a[0], L = Math.hypot(wu, wv), nu = (wu / L) * 0.06, nv = (wv / L) * 0.06;
  k.poly([[a[0] + nu, a[1] + nv, 0], [b[0] + nu, b[1] + nv, 0], [b[0] + nu, b[1] + nv, 0.13], [a[0] + nu, a[1] + nv, 0.13]], "#d9c59e", { lw: 0.8, wobble: 0 });
  k.poly([[a[0] - nu, a[1] - nv, 0.13], [b[0] - nu, b[1] - nv, 0.13], [b[0] + nu, b[1] + nv, 0.13], [a[0] + nu, a[1] + nv, 0.13]], "#efe2c4", { lw: 0.8, wobble: 0 });
  // ironwork: bars, two rails, a band of scrolls
  const n = Math.max(4, Math.round(L / 0.11));
  c.strokeStyle = "#2b3431"; c.lineCap = "round"; c.lineWidth = 1; c.beginPath();
  for (let j = 1; j < n; j++) { const f = j / n; c.moveTo(...A(f, 0.13)); c.lineTo(...A(f, 0.6)); }
  c.stroke();
  c.lineWidth = 0.9; c.beginPath();
  for (let j = 0; j < n; j++) { const [x, y] = A((j + 0.5) / n, 0.42); c.moveTo(x + 2.4, y); c.arc(x, y, 2.4, 0, 7); }
  c.stroke();
  c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(...A(0, 0.6)); c.lineTo(...A(1, 0.6)); c.stroke();
  c.strokeStyle = "#3a4642"; c.lineWidth = 1.3; c.stroke();
  c.strokeStyle = "#2b3431"; c.lineWidth = 1.3; c.beginPath(); c.moveTo(...A(0, 0.2)); c.lineTo(...A(1, 0.2)); c.stroke();
}
export function post(k, q) {
  const s = 0.13, z = 0.82, [u, v] = [q.u, q.v];
  // square stone pier aligned with the quay
  const pts = [[-s, -s], [s, -s], [s, s], [-s, s]].map(([x, y]) => [u + x * q.eu + y * q.wu, v + x * q.ev + y * q.wv]);
  prism(k, pts, 0, z, "#e3d2ae", { lw: 0.9, left: "#e9d9b7", right: "#c9b48c", topCol: "#efe3c6" });
  const cap = [[-s - 0.04, -s - 0.04], [s + 0.04, -s - 0.04], [s + 0.04, s + 0.04], [-s - 0.04, s + 0.04]].map(([x, y]) => [u + x * q.eu + y * q.wu, v + x * q.ev + y * q.wv]);
  prism(k, cap, z, z + 0.08, "#efe3c6", { lw: 0.8, left: "#f3e8cf", right: "#d4c098", topCol: "#f7eedb" });
}
export function bundLamp(k, u, v, z0, ph) {
  const c = k.ctx, t = k.t, [x, y] = P(u, v, z0), [, yt] = P(u, v, z0 + 1.75);
  c.lineCap = "round";
  // fluted base, slim shaft, scrolled crossarm, three globes
  c.fillStyle = "#26302d"; c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x - 2.6, y - 13); c.lineTo(x + 2.6, y - 13); c.lineTo(x + 4, y); c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.moveTo(x, y - 12); c.lineTo(x, yt); c.stroke(); c.strokeStyle = "#34403c"; c.lineWidth = 1.8; c.stroke();
  for (const sg of [-1, 1]) { c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(x, yt + 4); c.quadraticCurveTo(x + sg * 6, yt - 3, x + sg * 10, yt + 1); c.stroke(); c.strokeStyle = "#34403c"; c.lineWidth = 1.2; c.stroke(); c.strokeStyle = "#34403c"; c.lineWidth = 0.9; c.beginPath(); c.arc(x + sg * 3.5, yt + 5, 2, 0, 7); c.stroke(); }
  const glow = 0.8 + 0.2 * Math.sin(t * 2.2 + ph);
  for (const [dx, dy, r] of [[-10, -2, 4.4], [10, -2, 4.4], [0, -9, 5]]) {
    c.save(); c.globalAlpha = 0.18 * glow; c.fillStyle = "#ffeaa8"; c.beginPath(); c.arc(x + dx, yt + dy, r * 2.3, 0, 7); c.fill(); c.restore();
    c.fillStyle = "#26302d"; c.fillRect(x + dx - 1.6, yt + dy + r - 1, 3.2, 2.4);
    c.fillStyle = mix("#fff1c8", "#ffffff", glow - 0.8); c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.arc(x + dx, yt + dy, r, 0, 7); c.fill(); c.stroke();
    c.fillStyle = "rgba(255,255,255,0.95)"; c.beginPath(); c.arc(x + dx - r * 0.35, yt + dy - r * 0.35, r * 0.32, 0, 7); c.fill();
  }
  c.fillStyle = "#26302d"; c.beginPath(); c.arc(x, yt - 15, 1.4, 0, 7); c.fill();
}

// ---------- boats ----------
// iterate the visible faces of a prism footprint (for windows on cabin sides)
export function visFaces(pts) {
  let area = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; area += a[0] * b[1] - b[0] * a[1]; }
  const P0 = area >= 0 ? pts : [...pts].reverse(), out = [];
  for (let i = 0; i < P0.length; i++) { const a = P0[i], b = P0[(i + 1) % P0.length], eu = b[0] - a[0], ev = b[1] - a[1], L = Math.hypot(eu, ev) || 1; if (ev / L - eu / L > 0.05) out.push({ a, b, L }); }
  return out;
}
export function paneRow(k, pts, z0, z1, step, glass, frame) {
  const c = k.ctx;
  for (const { a, b, L } of visFaces(pts)) {
    const n = Math.max(1, Math.floor(L / step));
    for (let i = 0; i < n; i++) {
      const f0 = (i + 0.16) / n, f1 = (i + 0.84) / n, A = (f, z) => P(lerp(a[0], b[0], f), lerp(a[1], b[1], f), z);
      k.path([A(f0, z0), A(f1, z0), A(f1, z1), A(f0, z1)], { fill: glass, lw: 0.6, wobble: 0, stroke: frame });
      c.strokeStyle = "rgba(200,225,240,0.6)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(...A(f0 + (f1 - f0) * 0.2, z0 + (z1 - z0) * 0.2)); c.lineTo(...A(f0 + (f1 - f0) * 0.5, z1 - (z1 - z0) * 0.15)); c.stroke();
    }
  }
}
// railing on a deck outline; part 'back' draws edges facing away, 'front' the rest
export function deckRail(k, pts, z, h, part, col = "#b07a3a", rings = false) {
  const c = k.ctx;
  let area = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; area += a[0] * b[1] - b[0] * a[1]; }
  const P0 = area >= 0 ? pts : [...pts].reverse();
  for (let i = 0; i < P0.length; i++) {
    const a = P0[i], b = P0[(i + 1) % P0.length], eu = b[0] - a[0], ev = b[1] - a[1], L = Math.hypot(eu, ev) || 1, front = ev / L - eu / L > -0.05;
    if ((part === "front") !== front) continue;
    const A = (f, zz) => P(lerp(a[0], b[0], f), lerp(a[1], b[1], f), zz), n = Math.max(1, Math.round(L / 0.14));
    c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); for (let j = 0; j <= n; j++) { c.moveTo(...A(j / n, z)); c.lineTo(...A(j / n, z + h)); } c.stroke();
    c.strokeStyle = col; c.lineWidth = 0.6; c.beginPath(); c.moveTo(...A(0, z + h * 0.45)); c.lineTo(...A(1, z + h * 0.45)); c.stroke();
    c.strokeStyle = INK; c.lineWidth = 2.4; c.beginPath(); c.moveTo(...A(0, z + h)); c.lineTo(...A(1, z + h)); c.stroke(); c.strokeStyle = col; c.lineWidth = 1.2; c.stroke();
    if (rings && front && L > 0.9) for (const f of [0.3, 0.75]) { const [x, y] = A(f, z + h * 0.5); c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.arc(x, y, 3.2, 0, 7); c.stroke(); c.strokeStyle = "#ee7a3c"; c.lineWidth = 2; c.stroke(); c.strokeStyle = "#fff"; c.lineWidth = 2; c.setLineDash([1.6, 3.4]); c.beginPath(); c.arc(x, y, 3.2, 0, 7); c.stroke(); c.setLineDash([]); }
  }
}
// curved wake: foam samples laid along the boat's past positions (pos(s) -> {u,v,h}), clipped to the river
export function trail(k, pos, s0, beam, t, alpha, len = 3.2) {
  const c = k.ctx, R = rng(7);
  c.save(); c.beginPath(); k._trace(WATER.map(([a, b]) => P(a, b, ZW)), true, 0); c.clip(); c.lineCap = "round";
  const N = 30;
  for (let i = 1; i <= N; i++) {
    const d = (i / N) * len, q = pos(s0 - d - 0.9), f = 1 - i / N, nu = -Math.sin(q.h), nv = Math.cos(q.h);
    for (const sg of [-1, 1]) {
      const sp = beam * 0.5 + d * 0.16, ph = (t * 1.2 + i * 0.37 + sg) % 1;
      const [x, y] = P(q.u + nu * sg * sp, q.v + nv * sg * sp, ZW);
      c.globalAlpha = alpha * f * (0.55 + 0.45 * Math.sin(t * 3 + i * 1.7 + sg)); c.fillStyle = "#ffffff";
      c.beginPath(); c.ellipse(x, y, 3.2 + (1 - f) * 3, 1.2 + (1 - f), 0, 0, 7); c.fill();
    }
    if (i % 2 === 0) { const sp2 = (R() - 0.5) * beam * 0.6, [x, y] = P(q.u + nu * sp2, q.v + nv * sp2, ZW); c.globalAlpha = alpha * f * 0.8; c.fillStyle = "#ffffff"; c.beginPath(); c.ellipse(x, y, 4 + R() * 3, 1.5, 0, 0, 7); c.fill(); }
  }
  c.globalAlpha = 1; c.restore();
}

// two-deck Bund cruiser: white hull + red boot-top, wooden window band, open upper deck with railing, stern salon
export function cruiser(k, u, v, ang, t, alpha, pax, sc = 1) {
  const c = k.ctx, ch = Math.cos(ang), sh = Math.sin(ang), bob = Math.sin(t * 1.7) * 0.02;
  const R = (pts) => pts.map(([x, y]) => [u + (x * ch - y * sh) * sc, v + (x * sh + y * ch) * sc]);
  const z0 = ZW + bob;
  c.save(); c.globalAlpha = alpha;
  const hull = R([[-2.3, -0.5], [-2.22, -0.6], [1.2, -0.6], [1.95, -0.38], [2.45, 0], [1.95, 0.38], [1.2, 0.6], [-2.22, 0.6], [-2.3, 0.5]]);
  prism(k, hull, z0 - 0.04, z0 + 0.4, "#f7f2e8", { band: [0, 0.3], bandCol: "#b7392f", left: "#f3ede2", right: "#d9d1c2", topCol: "#c79a5e", lw: 1.2 });
  // rub rail + fender tyres
  for (const { a, b, L } of visFaces(hull)) { k.line([P(a[0], a[1], z0 + 0.3), P(b[0], b[1], z0 + 0.3)], { stroke: "#7a5233", lw: 1.4, wobble: 0 }); if (L > 1.5) for (const f of [0.25, 0.55, 0.85]) { const [x, y] = P(lerp(a[0], b[0], f), lerp(a[1], b[1], f), z0 + 0.18); c.strokeStyle = "#1f2422"; c.lineWidth = 2.2; c.beginPath(); c.arc(x, y, 2.6, 0, 7); c.stroke(); } }
  const cab = R([[-2.05, -0.5], [1.25, -0.5], [1.65, -0.3], [1.8, 0], [1.65, 0.3], [1.25, 0.5], [-2.05, 0.5]]);
  prism(k, cab, z0 + 0.4, z0 + 0.95, "#f6efdf", { left: "#f3ead6", right: "#dccfb6", topCol: "#c79a5e", lw: 1.1 });
  paneRow(k, cab, z0 + 0.55, z0 + 0.84, 0.26, "#3f5d70", "#7a5233");
  const deck = R([[-2.2, -0.56], [1.35, -0.56], [1.85, -0.33], [2.0, 0], [1.85, 0.33], [1.35, 0.56], [-2.2, 0.56]]);
  prism(k, deck, z0 + 0.95, z0 + 1.0, "#efe6d2", { topCol: "#c9995c", lw: 1 });
  const zd = z0 + 1.0;
  deckRail(k, deck, zd, 0.3, "back");
  // salon at the stern + passengers on the open foredeck, sorted by depth
  const items = [];
  const salon = R([[-1.95, -0.4], [-0.35, -0.4], [-0.25, -0.3], [-0.25, 0.3], [-0.35, 0.4], [-1.95, 0.4]]);
  const [sCu, sCv] = R([[-1.1, 0]])[0];
  items.push({ d: sCu + sCv, f: () => {
    prism(k, salon, zd, zd + 0.48, "#f6efdf", { left: "#f3ead6", right: "#dccfb6", topCol: "#f1ebdf", lw: 1.1 });
    paneRow(k, salon, zd + 0.12, zd + 0.4, 0.22, "#3f5d70", "#7a5233");
    const rf = R([[-2.05, -0.47], [-0.25, -0.47], [-0.15, 0], [-0.25, 0.47], [-2.05, 0.47]]);
    prism(k, rf, zd + 0.48, zd + 0.55, "#efe8dc", { band: [0, 1], bandCol: "#c8a14e", topCol: "#f4efe5", lw: 1 });
    // mast lamp + flag
    const [mu, mv] = R([[-0.5, 0]])[0], [mx, my] = P(mu, mv, zd + 0.55), [, my2] = P(mu, mv, zd + 1.05);
    c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(mx, my); c.lineTo(mx, my2); c.stroke();
    c.fillStyle = "#fff4cf"; c.beginPath(); c.arc(mx, my2 - 2, 2.6, 0, 7); c.fill(); c.stroke();
    const [fu, fv] = R([[-1.95, 0]])[0], [fx, fy] = P(fu, fv, zd + 0.55), [, fy2] = P(fu, fv, zd + 1.0);
    c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx, fy2); c.stroke();
    const w = Math.sin(t * 5) * 1.5; c.fillStyle = "#d8352c"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(fx, fy2); c.quadraticCurveTo(fx + 6, fy2 + 1 + w, fx + 11, fy2 + 2 - w); c.lineTo(fx + 11, fy2 + 7 - w); c.quadraticCurveTo(fx + 6, fy2 + 6 + w, fx, fy2 + 7); c.closePath(); c.fill(); c.stroke();
  } });
  for (const [x, y, seed, pose] of pax) {
    const [pu, pv] = R([[x, y]])[0], face = Math.atan2(y > 0 ? ch : -ch, y > 0 ? -sh : sh);
    items.push({ d: pu + pv, f: () => k.person(pu, pv, { z: zd, seed, pose: pose || "stand", dir: [y > 0 ? -sh : sh, y > 0 ? ch : -ch], shadow: false, h: 0.62 * Math.min(1, sc + 0.2) }) });
  }
  items.sort((a, b) => a.d - b.d).forEach((it) => it.f());
  deckRail(k, deck, zd, 0.3, "front", "#b07a3a", true);
  c.restore();
}
// small canopy ferry: one cabin, striped awning over the stern deck
export function ferry(k, u, v, ang, t, alpha, pax, sc = 1) {
  const c = k.ctx, ch = Math.cos(ang), sh = Math.sin(ang), bob = Math.sin(t * 2.3 + 1) * 0.025;
  const R = (pts) => pts.map(([x, y]) => [u + (x * ch - y * sh) * sc, v + (x * sh + y * ch) * sc]), z0 = ZW + bob;
  c.save(); c.globalAlpha = alpha;
  const hull = R([[-1.45, -0.38], [-1.4, -0.44], [0.7, -0.44], [1.2, -0.25], [1.5, 0], [1.2, 0.25], [0.7, 0.44], [-1.4, 0.44], [-1.45, 0.38]]);
  prism(k, hull, z0 - 0.03, z0 + 0.32, "#f5f0e6", { band: [0, 0.32], bandCol: "#2f6f8f", left: "#f1ebdf", right: "#d6cdbd", topCol: "#c8a06a", lw: 1.1 });
  const cab = R([[0.0, -0.32], [0.75, -0.32], [1.0, 0], [0.75, 0.32], [0.0, 0.32]]);
  prism(k, cab, z0 + 0.32, z0 + 0.78, "#f6efdf", { left: "#f3ead6", right: "#d8cbb1", topCol: "#2f6f8f", lw: 1 });
  paneRow(k, cab, z0 + 0.45, z0 + 0.7, 0.22, "#3f5d70", "#2f4f62");
  const items = [];
  for (const [x, y, seed, pose] of pax) { const [pu, pv] = R([[x, y]])[0]; items.push({ d: pu + pv, f: () => k.person(pu, pv, { z: z0 + 0.32, seed, pose: pose || "stand", dir: [y > 0 ? -sh : sh, y > 0 ? ch : -ch], shadow: false, h: 0.58 * Math.min(1, sc + 0.2) }) }); }
  items.sort((a, b) => a.d - b.d).forEach((it) => it.f());
  // awning posts + striped canopy
  for (const [x, y] of [[-1.3, -0.36], [-1.3, 0.36], [-0.05, -0.36], [-0.05, 0.36]]) { const [pu, pv] = R([[x, y]])[0]; k.line3([[pu, pv, z0 + 0.32], [pu, pv, z0 + 0.95]], { stroke: "#5a4632", lw: 1.3, wobble: 0 }); }
  const n = 6;
  for (let i = 0; i < n; i++) { const x0 = -1.38 + (1.38 * i) / n, x1 = -1.38 + (1.38 * (i + 1)) / n; k.poly(R([[x0, -0.42], [x1, -0.42], [x1, 0.42], [x0, 0.42]]).map(([a, b]) => [a, b, z0 + 0.97]), i % 2 ? "#f6f0e2" : "#d7443a", { lw: 0.8, wobble: 0 }); }
  deckRail(k, R([[-1.4, -0.4], [0, -0.4], [0, 0.4], [-1.4, 0.4]]), z0 + 0.32, 0.22, "front", "#d7d0c0");
  c.restore();
}

export function balloonVendor(k, u, v, t) {
  const c = k.ctx;
  const cols = ["#e8483f", "#f4c542", "#4f8fd6", "#f08aa8", "#6cbf6a", "#ffffff", "#ee7a3c"];
  const [hx, hy] = P(u - 0.05, v + 0.05, 0.62);
  cols.forEach((col, i) => {
    const a = -1.9 + i * 0.5, sw = Math.sin(t * 1.3 + i) * 3, bx = hx + Math.cos(a) * 16 + sw, by = hy - 34 - Math.sin(i * 1.7) * 6 + Math.sin(t * 1.9 + i * 2) * 1.5;
    c.strokeStyle = "rgba(60,50,40,0.6)"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo((hx + bx) / 2 + 2, (hy + by) / 2, bx, by + 6); c.stroke();
    c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.ellipse(bx, by, 5, 6, 0, 0, 7); c.fill(); c.stroke();
    c.fillStyle = "rgba(255,255,255,0.7)"; c.beginPath(); c.arc(bx - 1.6, by - 2, 1.4, 0, 7); c.fill();
  });
  k.person(u, v, { pose: "stand", dir: [1, 0.6], seed: 404, hat: true });
}
