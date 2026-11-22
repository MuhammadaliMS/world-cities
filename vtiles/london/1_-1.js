// LONDON · Buckingham Palace, the Guards and the Victoria Memorial (grid pass)
// Layout (u,v), everything inside 0.3..9.7:
//   palace range, axis-aligned along u: u 0.5-9.5, v 0.5-2.8 (portico to 3.1), facade on the LEFT face (palace.js)
//   pink gravel forecourt v 3.1-4.2 behind gilded railings + gates at v = 4.2; sentry boxes by the gates; five guards march along u at v 3.55
//   pavement v 4.2-9.7; Victoria Memorial on a round stepped base at (5.0, 7.1); rose tarmac roundel r 2.55;
//   lawns with red/yellow beds in both front corners; crowd at the railings; tourists walk the roundel
import { P, CTS, INK, shade, lerp, clamp, rng } from "../../lib/vec-kit.js";
import { makePalace } from "./palace.js";
import { tripleLamp, sentryBox, bearskin, railing, gatePier, memorial } from "./_g1_-1.js";

const PALACE = makePalace();
const PAVE = "#e9dcc2", GRAVEL = "#e6b3a0", LAWN = "#9cc263";
const RV = 4.2, MU = 5.0, MV = 7.1;

function ground(k) {
  const c = k.ctx;
  k.slab(PAVE);
  c.save(); k._trace([P(0.3, 0.3), P(9.7, 0.3), P(9.7, 9.7), P(0.3, 9.7)], true, 0); c.clip();
  k.stipple([[0.3, 0.3], [9.7, 0.3], [9.7, 9.7], [0.3, 9.7]], { density: 5 });
  // pink gravel forecourt, raked stripes
  k.poly([[0.3, 0.3, 0], [9.7, 0.3, 0], [9.7, RV + 0.1, 0], [0.3, RV + 0.1, 0]], GRAVEL, { lw: 1, wobble: 0 });
  c.strokeStyle = "rgba(160,95,80,0.22)"; c.lineWidth = 0.8; c.beginPath();
  for (let v = 3.2; v < RV; v += 0.17) { c.moveTo(...P(0.3, v, 0)); c.lineTo(...P(9.7, v, 0)); }
  c.stroke();
  const R = rng(9); c.fillStyle = "rgba(255,235,220,0.45)";
  for (let i = 0; i < 160; i++) { const [x, y] = P(0.4 + R() * 9.2, 3.15 + R() * 1.0, 0); c.fillRect(x, y, 1.6, 1.1); }
  // stone kerb strip under the railings
  k.poly([[0.3, RV - 0.08, 0], [9.7, RV - 0.08, 0], [9.7, RV + 0.1, 0], [0.3, RV + 0.1, 0]], "#d6cab0", { stroke: false });
  // lawns in the two front corners
  for (const [u0, u1] of [[0.4, 1.95], [8.05, 9.6]]) {
    k.box(u0, 4.85, 0, u1 - u0, 4.75, 0.07, LAWN, { shadow: false, hatch: false, left: "#8fb85a", right: "#7da64e", top: LAWN });
    k.grass([[u0, 4.85], [u1, 4.85], [u1, 9.6], [u0, 9.6]], {});
  }
  // rose tarmac roundel round the memorial, white edge line + dashes
  k.ell(MU, MV, 0, 2.55, "#d9a695", { lw: 1.2 });
  k.ell(MU, MV, 0, 2.5, null, { stroke: "rgba(255,255,255,0.7)", lw: 1 });
  k.ell(MU, MV, 0, 2.05, null, { stroke: "rgba(255,255,255,0.35)", lw: 0.9 });
  c.restore();
}

function royalBeds(k) {
  const red = ["#e03535", "#d62a2a", "#e84a4a", "#f06a50"], yel = ["#f4c630", "#f6d44a", "#f2b820"];
  k.q(7.0 + 5.2, () => k.flowers(0.7, 5.3, 1.1, 0.45, { seed: 71, cols: red }));
  k.q(7.0 + 5.8, () => k.flowers(0.7, 5.95, 1.1, 0.45, { seed: 72, cols: yel }));
  k.q(7.0 + 8.6, () => k.flowers(8.2, 5.3, 1.1, 0.45, { seed: 73, cols: yel }));
  k.q(7.0 + 9.2, () => k.flowers(8.2, 5.95, 1.1, 0.45, { seed: 74, cols: red }));
  k.q(9.5 + 8.9, () => k.flowers(0.7, 8.5, 1.1, 0.5, { seed: 75, cols: red.concat(yel) }));
  k.q(9.5 + 9.4, () => k.flowers(8.2, 8.5, 1.1, 0.5, { seed: 76, cols: yel.concat(red) }));
}

export default function draw(k, t) {
  const c = k.ctx;
  ground(k);

  // ---------- palace (behind everything) ----------
  k.q(-100, () => PALACE.draw(k, t));

  // ---------- railings, piers, gates, sentry boxes ----------
  const GATE = [4.35, 5.65];
  const segs = [[0.45, 1.5], [1.5, 2.5], [2.5, 3.55], [3.55, GATE[0] - 0.12], [GATE[1] + 0.12, 6.45], [6.45, 7.5], [7.5, 8.5], [8.5, 9.55]];
  for (const [a, b] of segs) k.q((a + b) / 2 + RV, () => railing(k, a, b, RV, 0.64));
  // central gates: two leaves with gilded scrollwork, arched overthrow + crowned emblems
  k.q(5.0 + RV, () => {
    for (const [a, b] of [[GATE[0], 5.0 - 0.03], [5.0 + 0.03, GATE[1]]]) railing(k, a, b, RV, 0.74, { tip: "#f2cf55" });
    c.strokeStyle = "#e4b940"; c.lineWidth = 1.6; c.beginPath();
    for (const [a, b] of [[GATE[0], 5.0], [5.0, GATE[1]]]) { c.moveTo(...P(a, RV, 0.5)); c.quadraticCurveTo(...P((a + b) / 2, RV, 0.22), ...P(b, RV, 0.5)); }
    c.stroke();
    for (const u of [4.62, 5.38]) { const [x, y] = P(u, RV, 0.52); c.fillStyle = "#e4b940"; c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke(); c.fillStyle = "#2a4d9a"; c.fillRect(x - 2, y - 3, 4, 5); }
  });
  for (const [u, h, lamp] of [[0.45, 0.95], [1.5, 0.95], [2.5, 0.95], [3.55, 0.95], [GATE[0] - 0.1, 1.25, true], [GATE[1] + 0.1, 1.25, true], [6.45, 0.95], [7.5, 0.95], [8.5, 0.95], [9.55, 0.95]]) {
    k.q(u + RV + 0.02, () => { gatePier(k, u, RV, h, lamp ? 0.26 : 0.22, { lamp }); if (lamp) { const [lx, ly] = P(u, RV, h + 0.07); c.fillStyle = "#25282b"; c.fillRect(lx - 1.5, ly - 18, 3, 18); for (const [dx, dy, r] of [[-8, -20, 4.2], [8, -20, 4.2], [0, -28, 5]]) { c.beginPath(); c.arc(lx + dx, ly + dy, r, 0, 7); c.fillStyle = "#f0cf68"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke(); } } });
  }
  // sentry boxes inside the gates, a still guard in each
  for (const u of [3.3, 6.7]) k.q(u + 3.85, () => sentryBox(k, u, 3.85, true));

  // ---------- memorial, beds, trees, lamps ----------
  k.q(MU + MV + 0.5, () => memorial(k, MU, MV, t));
  royalBeds(k);
  for (const [u, v, s] of [[1.2, 7.7, 81], [8.8, 7.7, 82], [1.2, 9.2, 83], [8.8, 9.2, 84]]) k.q(u + v, () => k.tree(u, v, { r: 0.55, h: 1.6, seed: s }));
  for (const [u, v] of [[0.6, 4.75], [9.4, 4.75], [3.0, 4.75], [7.0, 4.75]]) k.q(u + v + 0.3, () => tripleLamp(k, u, v, 1.9));
  for (const [u, v] of [[2.7, 9.3], [7.3, 9.3]]) k.q(u + v + 0.3, () => tripleLamp(k, u, v, 1.9));

  // ---------- life ----------
  // five guards, red tunics and bearskins, marching in step (spacing = 2 strides), turning at both ends
  for (let i = 0; i < 5; i++) {
    const path = [[1.3 - 0.54 * i + 0.54 * 4, 3.55], [8.6 - 0.54 * i, 3.55]];
    const o = { speed: 0.55, dwell: 1.4, seed: 400, top: "#c8362f", bottom: "#27324f", shoes: "#111", style: "shirt", hat: null, hairStyle: "bald", skin: i % 2 ? "#e6b48c" : "#f1c9a5", bag: false, stride: 0.27 };
    const st = k.walkerState(path, o);
    k.q(st.u + st.v + 0.05, () => { bearskin(k, k.walker(path, o)); });
  }
  // crowd at the railings: some face the palace, some turn to the camera for photos and selfies
  const crowdSpec = [
    [0.95, "photo", -1], [1.3, "wave", 1], [1.75, "cheer", -1], [2.2, "photo", 1], [2.85, "wave", -1], [3.3, "clap", 1],
    [6.7, "photo", -1], [7.15, "cheer", 1], [7.6, "wave", -1], [8.05, "photo", 1], [8.55, "cheer", -1], [9.0, "wave", 1],
  ];
  crowdSpec.forEach(([u, pose, face], i) => {
    const v = 4.5 + (i % 3) * 0.1 + 0.015 * Math.sin(t * 1.2 + i * 2);
    k.qperson(u + 0.02 * Math.sin(t * 1.1 + i), v, { pose, dir: [0.12, face], seed: 500 + i * 3, kid: i === 5 || i === 10 });
  });
  // at the gate: a couple posing for the guards, a kid on shoulders level
  k.qperson(4.1, 4.62, { pose: "photo", dir: [0.1, -1], seed: 601 });
  k.qperson(5.9, 4.62, { pose: "wave", dir: [0.1, -1], seed: 602 });
  // tourists walking the roundel in both directions + across the pavement
  const ring = [];
  for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; ring.push([MU + Math.cos(a) * 2.3, clamp(MV + Math.sin(a) * 2.25, 4.6, 9.55)]); }
  for (const [off, seed, extra] of [[0.0, 541], [0.2, 542, { kid: true }], [0.4, 543], [0.62, 544], [0.82, 545]]) k.qwalker(ring, { loop: true, speed: 0.38, offset: off, seed, ...(extra || {}) });
  const row = [[0.9, 9.35], [4.2, 9.5], [6.0, 9.5], [9.1, 9.35]];
  k.qwalker(row, { speed: 0.4, seed: 551, dwell: 1.5 }); k.qwalker(row, { speed: 0.36, offset: 0.5, seed: 552, dwell: 1.5 });
  // on the lawns: picnickers and photographers
  k.qperson(1.3, 6.9, { pose: "sitground", dir: [0.5, 1], seed: 611 });
  k.qperson(1.65, 7.15, { pose: "sitground", dir: [0.3, 1], seed: 612 });
  k.qperson(8.5, 7.1, { pose: "sitground", dir: [-0.3, 1], seed: 613 });
  k.qperson(8.9, 6.95, { pose: "photo", dir: [-0.6, 0.4], seed: 614 });
  k.flush();

  // ---------- sky ----------
  const [bx, by] = P(5.0, 4.5, 5.5);
  k.circlingBird(bx, by, 90, 26, { speed: 0.6, phase: 0 });
  k.circlingBird(bx, by, 90, 26, { speed: 0.6, phase: 0.7, size: 0.8 });
  k.cloud(200, 190, { s: 0.9, phase: 1 });
  k.cloud(830, 140, { s: 0.7, phase: 3 });
}

// close-up framing: the palace centre with portico and the gates
export const camera = { u: 5.0, v: 3.2, z: 2.4, zoom: 1.7 };
