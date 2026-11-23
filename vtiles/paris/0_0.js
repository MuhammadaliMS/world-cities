// PARIS · centre tile · Eiffel Tower on the Champ de Mars (traced over assets/paris/0_0.png)
import { P, CTS, INK, shade, lerp, clamp, rng } from "../../lib/vec-kit.js";
import GROUND from "./0_0.ground.js";
import { makeEiffel } from "./eiffel.js";
import { sparkle } from "./_props.js";
const W = GROUND.walks;
// pick traced routes by their end points (robust to re-tracing), and chain them end to end
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function R(a, b) {
  let best = null, bd = 1e9;
  for (const w of W) { const s0 = w[0], s1 = w[w.length - 1]; const d1 = dist(s0, a) + dist(s1, b), d2 = dist(s1, a) + dist(s0, b); if (d1 < bd) { bd = d1; best = w; } if (d2 < bd) { bd = d2; best = [...w].reverse(); } }
  return best;
}
// keep-out zones around props: routes are trimmed to their longest stretch outside them
const KEEP_OUT = [[2.6, 8.4, 0.85], [6.9, 8.75, 0.85], [1.5, 6.4, 0.5], [4.4, 9.1, 0.5], [0.75, 4.35, 0.45], [8.55, 5.15, 0.45],
  [3.3, 3.3, 0.65], [6.6, 3.3, 0.65], [3.3, 6.6, 0.65], [6.6, 6.6, 0.65], [6.1, 0.45, 0.75]];
function avoid(w) {
  const ok = (p) => KEEP_OUT.every(([u, v, r]) => Math.hypot(p[0] - u, p[1] - v) > r);
  let best = [], cur = [];
  for (const p of w) { if (ok(p)) cur.push(p); else { if (cur.length > best.length) best = cur; cur = []; } }
  if (cur.length > best.length) best = cur;
  return best.length >= 2 ? best : w.slice(0, 2);
}
function chain(...ws) { let out = [...ws[0]]; for (const w of ws.slice(1)) { const end = out[out.length - 1]; const ww = dist(w[0], end) <= dist(w[w.length - 1], end) ? w : [...w].reverse(); out = out.concat(ww.slice(1)); } return out; }

const C = 4.85; // tower centre (u = v)
const EIFFEL = makeEiffel(C);

// Wallace fountain: plinth, four caryatids holding a scalloped dome, water trickling into the basin
function wallaceFountain(k, u, v) {
  const c = k.ctx, t = k.t, G = "#26443a", GL = "#3f6656";
  k.ell(u + 0.15, v + 0.08, 0, 0.32, "rgba(60,45,30,0.15)", { stroke: false });
  k.cyl(u, v, 0, 0.3, 0.1, "#cfc4ae");
  k.cyl(u, v, 0.1, 0.16, 0.32, G);
  // four caryatids (little robed figures as columns)
  const pts = [[-0.075, -0.075], [0.075, -0.075], [-0.075, 0.075], [0.075, 0.075]];
  for (const [du, dv] of pts) {
    const [x, y] = P(u + du, v + dv, 0.42), [, yt] = P(u + du, v + dv, 0.92);
    c.strokeStyle = INK; c.lineWidth = 3.6; c.lineCap = "round"; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt); c.stroke();
    c.strokeStyle = du + dv > 0 ? G : GL; c.lineWidth = 2; c.stroke();
    k.circle(x, yt - 1, 1.6, GL, { lw: 0.8 });
  }
  // water: a thin animated trickle from the dome centre
  const [wx, wy] = P(u, v, 0.86), [, wy2] = P(u, v, 0.44);
  c.strokeStyle = "rgba(140,195,220,0.95)"; c.lineWidth = 1.5; c.setLineDash([2.5, 2.5]); c.lineDashOffset = -t * 24; c.beginPath(); c.moveTo(wx, wy); c.lineTo(wx, wy2); c.stroke(); c.setLineDash([]);
  k.dome(u, v, 0.94, 0.14, 0.2, G, { ribs: 5 });
  const [tx, ty] = P(u, v, 1.16); k.circle(tx, ty - 1, 2, GL, { lw: 0.9 });
}

function kiosk(k, u, v, t) {
  const c = k.ctx;
  k.box(u, v, 0, 1.1, 0.8, 0.72, "#f4efe4", { hatch: false });
  // counter opening with goods (crêpes, drinks)
  k.poly([[u + 0.12, v + 0.8, 0.32], [u + 0.98, v + 0.8, 0.32], [u + 0.98, v + 0.8, 0.66], [u + 0.12, v + 0.8, 0.66]], "#5a4636", { lw: 1, wobble: 0 });
  for (let i = 0; i < 6; i++) { const [x, y] = P(u + 0.2 + i * 0.13, v + 0.8, 0.36); c.fillStyle = ["#e9c24d", "#d9544b", "#f4f0e6", "#5f9d6d"][i % 4]; c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.roundRect(x - 2, y - 6, 4, 6, 1); c.fill(); c.stroke(); }
  k.box(u + 0.05, v + 0.8, 0.3, 1.0, 0.12, 0.04, "#d8cbb0", { hatch: false, shadow: false });
  // striped scalloped awning
  const z = 0.72, n = 7;
  for (let i = 0; i < n; i++) {
    const a = u - 0.08 + (1.26 * i) / n, b = u - 0.08 + (1.26 * (i + 1)) / n;
    k.poly([[a, v - 0.08, z + 0.32], [b, v - 0.08, z + 0.32], [b, v + 0.98, z + 0.06], [a, v + 0.98, z + 0.06]], i % 2 ? "#f6f0e2" : "#d64e46", { lw: 1.1, wobble: 0 });
    const [x0, y0] = P(a, v + 0.98, z + 0.06), [x1, y1] = P(b, v + 0.98, z + 0.06);
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 5, x1, y1); c.closePath(); c.fillStyle = i % 2 ? "#f6f0e2" : "#d64e46"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  }
  // side panel of the awning
  k.poly([[u + 1.18, v - 0.08, z + 0.32], [u + 1.18, v + 0.98, z + 0.06], [u + 1.18, v + 0.98, z - 0.02], [u + 1.18, v - 0.08, z + 0.24]], "#c4433c", { lw: 1, wobble: 0 });
  // sign + pennant
  const [sx, sy] = P(u + 0.55, v - 0.08, z + 0.5);
  c.fillStyle = "#2f4b6c"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.roundRect(sx - 12, sy - 6, 24, 9, 2); c.fill(); c.stroke();
  c.fillStyle = "#f4f0e6"; c.font = "bold 6px sans-serif"; c.textAlign = "center"; c.fillText("CRÊPES", sx, sy + 1);
  const [px, py] = P(u + 1.1, v - 0.08, z + 0.32), w = Math.sin(t * 6) * 2;
  c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(px, py); c.lineTo(px, py - 14); c.stroke();
  k.path([[px, py - 14], [px + 11, py - 11 + w], [px, py - 8]], { fill: "#3f73b5", lw: 1, wobble: 0 });
}

function picnic(k, u, v, t, cloth = "#e8a0a8", seed = 1) {
  k.poly([[u - 0.55, v - 0.45, 0.02], [u + 0.55, v - 0.45, 0.02], [u + 0.55, v + 0.45, 0.02], [u - 0.55, v + 0.45, 0.02]], cloth, { lw: 1.3, wobble: 0 });
  // gingham dots
  const c = k.ctx; c.fillStyle = "rgba(255,255,255,0.7)";
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const [x, y] = P(u - 0.42 + i * 0.28, v - 0.32 + j * 0.3, 0.03); c.fillRect(x - 2, y - 1, 4, 2); }
  const [bx, by] = P(u + 0.05, v - 0.05, 0.05); c.fillStyle = "#b07a45"; c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.roundRect(bx - 7, by - 6, 14, 8, 2); c.fill(); c.stroke();
  k.person(u - 0.35, v - 0.25, { pose: "sitground", dir: [0.6, 0.5], seed: seed * 3 });
  const p = k.person(u + 0.38, v + 0.2, { pose: "sitground", dir: [-0.6, -0.35], seed: seed * 3 + 1, gesture: true });
  // the second one lifts a glass now and then
  const lift = Math.max(0, Math.sin(t * 1.3 + seed)) * 7;
  c.fillStyle = "#c9415a"; c.beginPath(); c.arc(p.aR[0], p.aR[1] - lift, 2.6, 0, Math.PI * 2); c.fill();
}

function painter(k, u, v, t, seed) {
  // easel + canvas facing left
  const [x, y] = P(u - 0.35, v + 0.1, 0);
  const c = k.ctx;
  c.strokeStyle = "#7a5233"; c.lineWidth = 2.2; c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x, y - 26); c.lineTo(x + 6, y); c.stroke();
  k.path([[x - 9, y - 30], [x + 9, y - 33], [x + 9, y - 16], [x - 9, y - 13]], { fill: "#fbf8ef", lw: 1.3, wobble: 0 });
  // the painting grows a little tower stroke by stroke
  const prog = (t * 0.25 + seed * 0.3) % 1;
  c.strokeStyle = "#8b5a38"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - 4, y - 15); c.lineTo(x, y - 15 - prog * 15); c.lineTo(x + 4, y - 16); c.stroke();
  c.fillStyle = "#7fae5e"; c.fillRect(x - 8, y - 17, 16, 2);
  k.person(u, v, { pose: "paint", dir: [-0.9, 0.35], seed, hat: "beret", hatCol: seed % 2 ? "#c8403a" : "#2a2420", style: seed % 2 ? "coat" : "stripes" });
}

function balloonKid(k, u, v, t, col, seed) {
  const p = k.person(u, v, { pose: seed % 2 ? "wave" : "stand", kid: true, seed, dir: seed % 2 ? [1, 0.3] : [0.3, 1], shorts: true });
  const c = k.ctx;
  const bx = p.aR[0] + Math.sin(t * 1.7 + seed) * 4, by = p.headY - 26 + Math.sin(t * 2.3 + seed) * 2.5;
  c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.moveTo(p.aR[0], p.aR[1]); c.quadraticCurveTo(bx - 3, by + 14, bx, by + 7); c.stroke();
  c.beginPath(); c.ellipse(bx, by, 6, 7.2, 0, 0, Math.PI * 2); c.fillStyle = col; c.fill(); c.lineWidth = 1.4; c.stroke();
  c.fillStyle = "rgba(255,255,255,0.6)"; c.beginPath(); c.arc(bx - 2, by - 3, 1.6, 0, Math.PI * 2); c.fill();
}

function dogWalker(k, path, o, t) {
  const st = k.walkerState(path, { speed: 0.38, offset: o.offset || 0, dwell: 2.2 });
  const L = Math.hypot(st.du, st.dv) || 1, du = st.du / L, dv = st.dv / L;
  // dog trots ahead on the lead (faster little steps), sniffs when the owner stops
  const [dx, dy] = P(st.u + du * 0.6, st.v + dv * 0.6, 0);
  const face = du - dv >= 0 ? 1 : -1;
  const c = k.ctx, gait = st.moving ? st.p * Math.PI * 4 : 0;
  const bob = st.moving ? Math.abs(Math.sin(gait)) * 1.2 : 0;
  const sniff = st.moving ? 0 : Math.max(0, Math.sin(t * 3)) * 2;
  c.fillStyle = "rgba(60,45,30,0.15)"; c.beginPath(); c.ellipse(dx, dy, 8, 3, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.2; c.lineCap = "round";
  for (const [lx, ph] of [[-4, 0], [-2, Math.PI], [3, Math.PI], [5, 0]]) { const sw = st.moving ? Math.sin(gait + ph) * 2.2 : 0; c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(dx + lx * face, dy - 4 - bob); c.lineTo(dx + lx * face + sw, dy); c.stroke(); c.strokeStyle = "#e9dcc4"; c.lineWidth = 1.2; c.stroke(); }
  c.fillStyle = "#e9dcc4"; c.strokeStyle = INK; c.lineWidth = 1.2;
  c.beginPath(); c.ellipse(dx, dy - 6 - bob, 7.5, 3.6, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  c.beginPath(); c.arc(dx + face * 7.5, dy - 9 - bob + sniff, 3.4, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = "#b9895c"; c.beginPath(); c.ellipse(dx + face * 6.4, dy - 10.5 - bob + sniff, 1.4, 2.4, face * 0.4, 0, Math.PI * 2); c.fill();
  c.fillStyle = INK; c.beginPath(); c.arc(dx + face * 10.6, dy - 9 - bob + sniff, 0.9, 0, Math.PI * 2); c.fill();
  const wag = Math.sin(t * 14) * 3; c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.moveTo(dx - face * 7, dy - 7 - bob); c.quadraticCurveTo(dx - face * 10, dy - 11 - bob, dx - face * 10 + wag, dy - 13 - bob); c.stroke();
  const pp = k.walker(path, { speed: 0.38, offset: o.offset || 0, dwell: 2.2, seed: o.seed, bag: false });
  c.strokeStyle = "#c8403a"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(pp.hand[0], pp.hand[1]); c.quadraticCurveTo((pp.hand[0] + dx) / 2, Math.max(pp.hand[1], dy - 6) + 3, dx + face * 5, dy - 8 - bob); c.stroke();
}

export default function draw(k, t) {
  const c = k.ctx;
  // ---------- ground (traced from the reference) ----------
  k.groundTrace(GROUND, { lawn: "#a4c266", paved: "#f3e6c8" });
  // tower shadow on the ground
  EIFFEL.shadow(k);

  // ---------- back row props (behind the tower) ----------
  k.q(0.2, () => { k.tree(0.55, 2.2, { r: 0.75, h: 1.6, seed: 1 }); k.tree(0.35, 3.3, { r: 0.7, h: 1.5, seed: 2, col: "#86b566" }); });
  k.q(1.6, () => k.tree(1.6, 0.4, { r: 0.6, h: 1.5, seed: 3 }));
  k.q(3.9, () => { k.lamp(3.4, 0.5); });
  k.q(5.9, () => k.lamp(5.4, 0.45));
  k.q(3.4, () => { k.bench(0.9, 2.95, { along: "v" }); });
  k.q(4.2, () => wallaceFountain(k, 0.75, 4.35));
  k.q(4.8, () => { k.flowers(2.0, 0.25, 1.4, 0.32, { seed: 4 }); });
  k.q(4.5, () => { k.bike(4.1, 0.75, { face: 1, col: "#3f73b5" }); });
  k.q(6.0, () => kiosk(k, 5.55, 0.04, t));
  k.q(7.1, () => k.conifer(7.0, 0.45, { h: 1.9, r: 0.35 }));
  k.q(9.3, () => k.tree(9.0, 0.6, { r: 0.75, h: 1.6, seed: 6 }));
  k.q(6.0, () => k.tree(0.45, 5.6, { r: 0.7, h: 1.5, seed: 7 }));
  k.q(7.4, () => k.tree(0.4, 7.0, { r: 0.75, h: 1.55, seed: 8, col: "#86b566" }));
  k.q(9.0, () => k.tree(0.35, 8.6, { r: 0.7, h: 1.5, seed: 9 }));
  k.q(5.7, () => k.bench(1.05, 5.0, { along: "v" }));
  k.q(8.3, () => k.flowerCurve([[0.45, 6.7], [0.75, 7.4], [0.7, 8.3], [0.45, 9.1]], 0.38, { seed: 10 }));
  k.q(11.0, () => k.flowerCurve([[9.35, 1.0], [9.15, 1.9], [9.3, 2.8], [9.55, 3.4]], 0.38, { seed: 12 }));

  // ---------- the tower (one depth slot at its centre) ----------
  k.q(2 * C - 2.6, () => EIFFEL.drawBack(k, t));
  k.q(2 * C + 2.7, () => EIFFEL.draw(k, t));
  if (k.night) {
    // hourly sparkle: white twinkles over the tower for ~4 s of every 20 s loop
    const w = (t % 20) / 4;
    if (w < 1) {
      const env = Math.sin(w * Math.PI);
      k.q(2 * C + 2.8, () => k.lit(() => {
        for (let i = 0; i < 46; i++) {
          const z = 0.4 + 12.2 * ((i * 0.618034) % 1), spread = 2.1 * Math.max(0.04, 1 - z / 13.2) ** 1.1;
          const ang = i * 2.399, [x, y] = P(4.85 + Math.cos(ang) * spread, 4.85 + Math.sin(ang) * spread, z);
          sparkle(k, x, y, w * 26 + i * 1.9, 0.9 + 0.8 * env);
        }
      }));
    }
  }

  // ---------- front props ----------
  k.q(10.6, () => picnic(k, 2.6, 8.4, t, "#eaa6ae", 1));
  k.q(15.6, () => picnic(k, 6.9, 8.75, t, "#e9a1a8", 2));
  k.q(7.9, () => painter(k, 1.5, 6.4, t, 3));
  k.q(13.5, () => painter(k, 4.4, 9.1, t, 4));
  k.q(10.1, () => k.bench(8.5, 2.3, { along: "u" }));
  k.q(14.9, () => k.bench(8.3, 6.4, { along: "u" }));
  k.q(12.6, () => { k.lamp(9.0, 3.6); });
  k.q(14.5, () => k.lamp(8.6, 5.9));
  k.q(13.9, () => wallaceFountain(k, 8.55, 5.15));
  k.q(12.4, () => { k.flowers(2.6, 9.4, 1.8, 0.32, { seed: 13 }); });
  k.q(13.0, () => { k.flowers(7.5, 6.9, 1.0, 0.32, { seed: 14 }); k.flowers(7.6, 4.0, 0.9, 0.5, { seed: 15 }); });
  k.q(17.6, () => k.tree(8.85, 8.85, { r: 0.85, h: 1.8, seed: 16 }));
  k.q(18.2, () => k.flowerCurve([[6.9, 9.55], [7.7, 9.35], [8.5, 9.5], [9.3, 9.3]], 0.36, { seed: 17 }));
  k.q(15.0, () => k.flowerCurve([[9.82, 5.6], [9.72, 6.3], [9.82, 7.0]], 0.26, { seed: 18 }));

  // ---------- life ----------
  // walkers on the traced paths (walk, pause, turn, walk back)
  const routes = [
    chain(R([1.92, 0.81], [4.3, 1.05]), R([4.31, 1.04], [8.86, 5.12])), // back path round to the right
    chain(R([4.32, 1.07], [7.04, 2.55]), R([7.08, 2.59], [7.3, 4.6])),   // right path toward the tower
    R([8.87, 5.15], [9.34, 8.49]),                                       // front-right path
    R([7.3, 4.6], [8.85, 5.14]),
    R([2.59, 9.19], [3.87, 6.11]),                                       // left S-path
    R([0.81, 6.24], [2.0, 4.8]),
    R([1.16, 1.96], [2.0, 4.8]),
    R([5.06, 8.92], [4.25, 6.5]),                                        // front-left path
    R([6.85, 5.4], [5.36, 6.74]),                                        // under the tower
    R([5.45, 3.65], [6.82, 4.93]),
    R([5.32, 4.61], [6.81, 5.01]),
  ];
  for (let i = 0; i < routes.length; i++) routes[i] = avoid(routes[i]);
  if (!k._routesLogged) { k._routesLogged = 1; }
  const walkerSpec = [[0, 0.0, 21], [0, 0.55, 22], [1, 0.3, 23], [2, 0.1, 24], [2, 0.6, 25], [3, 0.4, 26], [4, 0.15, 27], [4, 0.7, 28], [5, 0.5, 29], [6, 0.2, 30], [7, 0.45, 33], [8, 0.8, 34], [10, 0.35, 35], [9, 0.6, 36]];
  for (const [r, off, seed] of walkerSpec) k.qwalker(routes[r], { speed: 0.42 + (seed % 5) * 0.03, offset: off, seed, dwell: 1.2 + (seed % 3) * 0.6 });
  k.qcyclist(routes[2], { speed: 0.9, offset: 0.2, seed: 31, col: "#c8403a", basket: true });
  k.qcyclist(routes[0], { speed: 0.85, offset: 0.6, seed: 32, col: "#3f73b5" });
  // dog walker on the right spoke
  { const dw = routes[1]; const st = k.walkerState(dw, { speed: 0.38, offset: 0.3, dwell: 2.2 }); k.q(st.u + st.v, () => dogWalker(k, dw, { seed: 51, offset: 0.3 }, t)); }
  // balloon kids + a tourist taking a photo of the tower
  k.q(11.4, () => { balloonKid(k, 4.6, 6.75, t, "#d84840", 61); balloonKid(k, 4.95, 6.95, t, "#d84840", 62); });
  k.q(10.0, () => balloonKid(k, 8.15, 1.95, t, "#d84840", 63));
  k.qperson(7.5, 4.3, { pose: "photo", face: -1, scale: 0.62, seed: 71 });
  k.qperson(7.85, 4.55, { pose: "wave", face: -1, scale: 0.62, seed: 72 });
  k.qperson(6.05, 1.12, { pose: "stand", dir: [0, -1], seed: 73 }); // at the kiosk counter
  k.flush();

  // ---------- sky ----------
  k.circlingBird(470, 300, 70, 26, { speed: 0.7, phase: 0 });
  k.circlingBird(470, 300, 70, 26, { speed: 0.7, phase: 0.6, size: 0.8 });
  k.circlingBird(560, 180, 55, 20, { speed: -0.55, phase: 2 });
  k.cloud(360, 330, { s: 0.85, phase: 1 });
  k.cloud(650, 230, { s: 0.7, phase: 3 });
}

// close-up framing for the video: tilt from the crowd at the tower's feet up to the second floor
export const camera = { u: 5, v: 5, z: 4.5, zoom: 1.75, baseU: 4.4, baseV: 4.0, baseZ: 0.8, topZ: 9 };
