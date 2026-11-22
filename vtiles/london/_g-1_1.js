// LONDON -1,1 helpers (grid pass): private copies of the fountain, café pavilion, planter and furniture from the old tile.
import { P, CTS, INK, shade, lerp, rng } from "../../lib/vec-kit.js";
import { pigeon } from "./_props.js";
export { pigeon };
export const CAFE = { u0: 0.5, v0: 6.75, du: 3.3, dv: 2.45, h: 1.7 };
export const FOUNT = [6.4, 7.0, 1.4];
export function fountain(k, t) {
  const [u, v, r] = FOUNT, c = k.ctx;
  k.cyl(u, v, 0, r, 0.4, "#cbbd9f", { top: false });
  const [x, y] = P(u, v, 0.4), rx = (r - 0.12) * CTS.S * Math.SQRT2, ry = rx * CTS.YS;
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fillStyle = "#e5dcc6"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke();
  const wy = y + 3;
  c.beginPath(); c.ellipse(x, wy, rx - 9, ry - 4, 0, 0, 7); c.fillStyle = "#5fb1ae"; c.fill(); c.strokeStyle = "#2e6f72"; c.lineWidth = 1.3; c.stroke();
  // ripples
  c.strokeStyle = "rgba(255,255,255,0.7)"; c.lineWidth = 1.2;
  for (let i = 0; i < 4; i++) { const f = (t * 0.5 + i / 4) % 1; c.globalAlpha = 1 - f; c.beginPath(); c.ellipse(x, wy, 12 + f * (rx - 24), 4 + f * (ry - 10), 0, 0, 7); c.stroke(); } c.globalAlpha = 1;
  // jets: a tall centre plume and 8 arcing sprays with falling drops
  const pulse = 0.88 + 0.12 * Math.sin(t * 2.2);
  const jets = [[0, 0, 62 * pulse], ...Array.from({ length: 8 }, (_, i) => [Math.cos(i * 0.785) * 26, Math.sin(i * 0.785) * 10, 38 * pulse])];
  for (const [jx, jy, h] of jets) {
    const far = jy < 0;
    for (let d = 0; d < 11; d++) {
      const ph = (t * 1.1 + d * 0.093 + (jx * 0.01)) % 1;
      const px = x + jx * (0.25 + ph * 1.0) * (jx === 0 ? 0 : 1), py = wy + jy * ph - (h * Math.sin(Math.PI * Math.min(1, ph * 1.05)) * (jx === 0 ? 1 : 0.9)) + (ph > 0.9 ? (ph - 0.9) * 40 : 0);
      c.fillStyle = `rgba(245,252,255,${0.9 - ph * 0.5})`; c.beginPath(); c.arc(px + Math.sin(d * 7 + t) * 0.6, py, jx === 0 ? 2.1 - ph : 1.7 - ph * 0.6, 0, 7); c.fill();
    }
  }
  // mist at the foot
  c.fillStyle = "rgba(255,255,255,0.35)"; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(x + Math.sin(t * 2 + i) * 14, wy - 3 - (i % 3) * 2, 6 + (i % 3) * 2, 0, 7); c.fill(); }
}
export function chair(k, u, v, face) { const c = k.ctx, [x, y] = P(u, v, 0); c.fillStyle = "#b37a45"; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.ellipse(x, y - 8, 5, 2.6, 0, 0, 7); c.fill(); c.stroke(); c.strokeStyle = "#7a5230"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - 3, y - 8); c.lineTo(x - 3, y); c.moveTo(x + 3, y - 8); c.lineTo(x + 3, y); c.stroke(); const b = face > 0 ? 1 : -1; c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(x - b * 4, y - 9); c.lineTo(x - b * 4, y - 20); c.stroke(); c.strokeStyle = "#b37a45"; c.lineWidth = 1.4; c.stroke(); }
export function table(k, u, v) { const c = k.ctx, [x, y] = P(u, v, 0); c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 13); c.stroke(); c.beginPath(); c.ellipse(x, y - 14, 10, 4.6, 0, 0, 7); c.fillStyle = "#f4efe2"; c.fill(); c.lineWidth = 1.1; c.stroke(); c.fillStyle = "#c9415a"; c.fillRect(x - 2, y - 20, 3, 6); c.fillStyle = "#f2d27a"; c.fillRect(x + 3, y - 19, 3, 5); }
export function cafe(k, t) {
  const c = k.ctx, { u0, v0, du, dv, h } = CAFE, u1 = u0 + du, v1 = v0 + dv;
  // floor
  k.poly([[u0, v0, 0.02], [u1, v0, 0.02], [u1, v1, 0.02], [u0, v1, 0.02]], "#b78f5e", { lw: 1.2, wobble: 0 });
  // back walls (seen through the glass)
  k.poly([[u0, v0, 0], [u0, v1, 0], [u0, v1, h], [u0, v0, h]], "#f0d9a4", { lw: 1, wobble: 0 });
  k.poly([[u0, v0, 0], [u1, v0, 0], [u1, v0, h], [u0, v0, h]], "#e8cf96", { lw: 1, wobble: 0 });
  // pendant lamps glow
  for (const [u, v] of [[1.4, 7.5], [2.5, 7.4], [3.1, 8.4], [1.7, 8.5]]) { const [x, y] = P(u, v, 1.35); c.fillStyle = "rgba(255,226,130,0.95)"; c.beginPath(); c.arc(x, y, 3.6, 0, 7); c.fill(); c.fillStyle = "rgba(255,226,130,0.25)"; c.beginPath(); c.arc(x, y, 12, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x, y - 3); c.lineTo(x, y - 13); c.stroke(); }
  // tables + chairs + diners (sorted by depth)
  const tabs = [[1.5, 7.6], [2.6, 7.7], [1.9, 8.6], [3.1, 8.5]];
  const items = [];
  tabs.forEach(([u, v], i) => {
    items.push([u + v, () => table(k, u, v)]);
    items.push([u + v - 0.3, () => { chair(k, u - 0.5, v, 1); k.person(u - 0.5, v, { pose: "sit", bench: true, seatZ: 0.3, dir: [1, 0.05], seed: 110 + i * 2 }); }]);
    items.push([u + v + 0.4, () => { chair(k, u + 0.1, v + 0.5, -1); k.person(u + 0.1, v + 0.45, { pose: "sit", bench: true, seatZ: 0.3, dir: [0.05, -1], seed: 111 + i * 2 }); }]);
  });
  // a waiter circulating between the tables
  const wp = [[1.0, 7.2], [2.1, 8.1], [3.2, 7.2], [3.5, 8.7], [2.2, 9.0]];
  const wst = k.walkerState(wp, { loop: true, speed: 0.4, offset: 0 });
  items.push([wst.u + wst.v, () => k.walker(wp, { loop: true, speed: 0.4, seed: 118, style: "shirt", top: "#f4f0e6", bottom: "#222" })]);
  items.sort((a, b) => a[0] - b[0]).forEach(([, fn]) => fn());
  // glass faces: faint tint + frames + mullions
  for (const [side, pts] of [["L", [[u0, v1], [u1, v1]]], ["R", [[u1, v0], [u1, v1]]]]) {
    const [a, b] = pts, n = side === "L" ? 8 : 6;
    k.poly([[a[0], a[1], 0], [b[0], b[1], 0], [b[0], b[1], h], [a[0], a[1], h]], side === "L" ? "rgba(190,225,240,0.22)" : "rgba(160,205,225,0.3)", { lw: 1.2, wobble: 0 });
    c.strokeStyle = "#5a5f56"; c.lineWidth = 2.2;
    for (let i = 0; i <= n; i++) { const f = i / n; c.beginPath(); c.moveTo(...P(lerp(a[0], b[0], f), lerp(a[1], b[1], f), 0)); c.lineTo(...P(lerp(a[0], b[0], f), lerp(a[1], b[1], f), h)); c.stroke(); }
    c.lineWidth = 1.2; c.beginPath(); c.moveTo(...P(a[0], a[1], 0.55)); c.lineTo(...P(b[0], b[1], 0.55)); c.moveTo(...P(a[0], a[1], 1.15)); c.lineTo(...P(b[0], b[1], 1.15)); c.stroke();
  }
  // glass roof with reflection streaks
  k.poly([[u0, v0, h], [u1, v0, h], [u1, v1, h], [u0, v1, h]], "rgba(200,230,242,0.82)", { lw: 1.5, wobble: 0 });
  c.strokeStyle = "rgba(90,100,95,0.7)"; c.lineWidth = 1.2;
  for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(...P(u0 + du * i / 6, v0, h)); c.lineTo(...P(u0 + du * i / 6, v1, h)); c.stroke(); }
  for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(...P(u0, v0 + dv * i / 4, h)); c.lineTo(...P(u1, v0 + dv * i / 4, h)); c.stroke(); }
  c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 2; c.beginPath(); const s = (t * 0.25) % 1; c.moveTo(...P(u0 + du * (0.1 + s * 0.8), v0, h)); c.lineTo(...P(u0 + du * (0.0 + s * 0.8), v1, h)); c.stroke();
}
export function planter(k, u, v) {
  const c = k.ctx; k.box(u, v, 0, 0.5, 0.5, 0.5, "#8c8f90", { hatch: false });
  for (let i = 0; i < 7; i++) { const [x, y] = P(u + 0.12 + (i % 3) * 0.12, v + 0.1 + Math.floor(i / 3) * 0.14, 0.56); c.fillStyle = i % 2 ? "#ffffff" : "#6c9c4c"; c.beginPath(); c.arc(x, y - 3 - (i % 2) * 3, 4, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.7; c.stroke(); }
}
