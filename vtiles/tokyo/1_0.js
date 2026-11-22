// TOKYO · Shinjuku & Godzilla Terrace (grid pass: everything on the u/v grid, inside 0.3..9.7)
// Layout (u,v): Toho podium u .6-6.6 v .6-3.2 (3 stacked boxes) + vertical glass tower u 3.6-6.2 v .7-2.1; Godzilla on the roof
// terrace behind the parapet (v 3.0-3.2); plaza v 3.3-3.9; lane along v (u 3.7-6.4) between shop rows: west R faces, east L faces.
import { P, INK, shade, lerp, rng, spline } from "../../lib/vec-kit.js";
import { stdProj, mbox, mband, neon, chochin, lanternString, petals, smoke, vending, bollard, checkRoutes, acUnit, antenna } from "./_props.js";
import { godzilla, gzClaws, glassFace, panelFace, block, yatai, plantBox } from "./_t1_0.js";
import { cobbles, lobby, bladeBox, awnR, pipe, wire } from "./_g1_0.js";

export const camera = { u: 4.6, v: 4.8, z: 3.4, zoom: 1.5 };

const ROUTES = [
  [[5.3, 8.7], [5.4, 6.5], [5.2, 4.4], [5.5, 3.75]],
  [[4.9, 3.75], [5.8, 5.0], [5.7, 6.8], [5.9, 8.7]],
  [[0.9, 9.2], [3.0, 9.3], [5.2, 9.1], [7.4, 9.3], [9.1, 9.1]],
  [[9.2, 8.95], [6.4, 9.3], [4.0, 9.05], [1.2, 9.3]],
  [[1.8, 3.7], [3.2, 3.65], [5.0, 3.7], [7.2, 3.65], [8.4, 3.7]],
  [[2.2, 3.65], [4.4, 3.9], [5.2, 5.5], [5.1, 7.8], [4.6, 8.9]],
  [[7.9, 8.8], [8.8, 8.3], [9.3, 8.8]],
  [[8.4, 3.7], [7.2, 3.8], [5.8, 3.65], [3.6, 3.75]],
];
const OBST = [[0.6, 0.6, 6.6, 3.2], [0.4, 4.0, 2.4, 8.8], [2.4, 4.0, 3.7, 8.7], [3.85, 5.85, 4.4, 7.5], [4.5, 5.8, 5.0, 7.3], [6.4, 4.0, 7.9, 8.6], [7.9, 4.0, 9.5, 6.0], [7.9, 6.1, 9.5, 8.0], [6.9, 0.6, 9.3, 2.9]];
export { ROUTES, OBST };
const bad = checkRoutes("tokyo1_0", ROUTES, OBST, spline); if (bad.length) console.warn(bad.join("\n"));

function podium(k, t) {
  const c = k.ctx, Z1 = 2.5;
  const [u0, v0, du, dv] = [0.6, 0.6, 6.0, 2.6];
  // T1: lobby + ribbon floor (main facade on the left face)
  k.q(4.0, () => {
    const b = mbox(k, stdProj, u0, v0, 0, du, dv, Z1, "#cfc6b0", { wobble: 0, left: "#d6cdb6", right: "#b4ab96" });
    lobby(k, b, "L", 0.12, 1.2, 12);
    mband(k, b, "L", 1.2, 1.35, "#3d5a86", { s0: 0, s1: 1 });
    glassFace(k, b, "L", { z0: 1.38, z1: 2.35, cols: 20, rows: 3, seed: 6, lit: 0.45, sky: "#6f93bd", mid2: "#98b3cf", warm: "#f3c47c", mw: 1 });
    mband(k, b, "L", 2.35, 2.5, "#c9bfa8", { s0: 0, s1: 1 });
    glassFace(k, b, "R", { z0: 0.25, z1: 2.35, cols: 7, rows: 5, seed: 9, lit: 0.4, sky: "#6f93bd" });
    mband(k, b, "R", 2.35, 2.5, "#a69d88", { s0: 0, s1: 1 });
    // entrance canopy: a slab on the plaza side
    const cb = mbox(k, stdProj, 1.6, dv + v0, 1.35, 2.6, 0.5, 0.12, "#3f5f8c", { wobble: 0, top: "#5b7aa6" });
    neon(k, b, "L", 0.84, 0.97, 1.45, 2.3, "新宿", { col: "#ff4fa0", blink: true, seed: 3, ar: 0.8, size: 54 });
  });
  // T2: stepped planted terrace on the roof, back-left
  k.q(4.02, () => {
    const b = mbox(k, stdProj, 0.9, 0.9, Z1, 2.7, 1.4, 0.9, "#d8cdb6", { wobble: 0, left: "#d4c9b2", right: "#b5aa94" });
    panelFace(k, b, "L", { cols: 14, rows: 3 }); panelFace(k, b, "R", { cols: 5, rows: 3 });
    mband(k, b, "L", 0.72, 0.9, "#c3b9a3", { s0: 0, s1: 1 }); mband(k, b, "R", 0.72, 0.9, "#a69c86", { s0: 0, s1: 1 });
    for (let i = 0; i < 9; i++) { const [x, y] = P(1.1 + i * 0.3, 1.5, Z1 + 0.9); k._lobe(x, y - 4 - (i % 3) * 2, 7 + (i % 2) * 3, i % 3 ? "#78a655" : "#8bb25c", i * 9 + 1, { squash: 0.8, bumps: 7 }); }
  });
  // vertical glass tower rising from the roof, behind Godzilla
  const H = 9.4, tu = 3.6, tv = 0.7, tdu = 2.6, tdv = 1.4;
  k.q(4.04, () => {
    const b = mbox(k, stdProj, tu, tv, Z1, tdu, tdv, H, "#8aa4c0", { wobble: 0, left: "#9db4cc", right: "#6a86a6" });
    glassFace(k, b, "L", { z0: 0.1, z1: H - 0.9, cols: 13, rows: 30, seed: 11, lit: 0.16, sky: "#6e96c4", mid2: "#b6c9d8", warm: "#f4c98a", mw: 0.9 });
    glassFace(k, b, "R", { z0: 0.1, z1: H - 0.9, cols: 7, rows: 30, seed: 12, lit: 0.1, sky: "#5f86b3", mid2: "#8fa9c2", warm: "#d9b57c", mw: 0.9 });
    mband(k, b, "L", H - 0.9, H, "#c5c0b0", { s0: 0, s1: 1 }); mband(k, b, "R", H - 0.9, H, "#a09c8e", { s0: 0, s1: 1 });
    for (let i = 0; i < 30; i++) for (const side of ["L", "R"]) { const zz = H - 0.82 + (i % 5) * 0.14, s = side === "L" ? 0.04 + (i % 6) * 0.16 : 0.1 + (i % 6) * 0.15; c.strokeStyle = "rgba(60,64,72,0.55)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(...b.fp(side, s, zz)); c.lineTo(...b.fp(side, s + 0.13, zz)); c.stroke(); }
    mbox(k, stdProj, tu + 0.3, tv + 0.15, Z1 + H, tdu - 0.6, tdv - 0.3, 0.5, "#aeb4bd", { wobble: 0 });
    for (let i = 0; i < 3; i++) acUnit(k, stdProj, tu + 0.5 + i * 0.7, tv + 0.25, Z1 + H + 0.5, { s: 0.4 });
    for (const [a, bb, hh] of [[0.5, 0.3, 40], [2.0, 0.35, 28]]) { const [x, y] = P(tu + a, tv + bb, Z1 + H + 0.5); antenna(k, x, y, hh, { light: true, seed: a }); }
  });
  // concrete slab with a blue strip beside the tower
  k.q(4.05, () => {
    const b = mbox(k, stdProj, 5.3, 2.3, Z1, 1.0, 0.7, 2.4, "#dcd2bc", { wobble: 0, left: "#d6ccb6", right: "#b8ad98" });
    glassFace(k, b, "R", { s0: 0.2, s1: 0.5, z0: 0.2, z1: 2.2, cols: 1, rows: 8, seed: 4, lit: 0.1, sheen: 0 });
    panelFace(k, b, "L", { cols: 4, rows: 8 });
  });
  // Godzilla stands on the roof terrace; head and claws rise over the parapet, facing front-left
  const [gx, gy] = P(3.3, 3.1, 3.2);
  k.q(4.06, () => godzilla(k, gx, gy, t, { s: 1.2 }));
  k.q(4.07, () => {
    const b = mbox(k, stdProj, u0, 3.0, Z1, du, 0.2, 0.5, "#d9cfb9", { wobble: 0, left: "#dcd2bc", right: "#bbb19b" });
    panelFace(k, b, "L", { cols: 24, rows: 1 });
    for (let i = 0; i < 12; i++) { const [x, y] = P(3.0 + i * 0.28, 3.05, Z1 + 0.5); k._lobe(x, y - 4, 6 + (i % 2) * 2, i % 2 ? "#789f4f" : "#86ac58", i * 7 + 3, { squash: 0.8, bumps: 7 }); }
  });
  k.q(4.075, () => gzClaws(k, gx, gy, { s: 1.2 }));
}

export default function draw(k, t) {
  const c = k.ctx;
  k.groundTrace({}, { paved: "#cbb996", side: "#e3d3b0", stipple: 0 });
  cobbles(k);
  // darker lane laid along v
  k.ground([[3.7, 3.4], [6.4, 3.4], [6.4, 8.7], [3.7, 8.7]], "rgba(150,128,96,0.28)", { stroke: false });
  podium(k, t);

  // ---- side blocks (axis-aligned boxes, neon on LEFT and RIGHT faces) ----
  const bk = (d, u, v, du, dv, h, o, signs = []) => k.q(d, () => { const b = block(k, u, v, du, dv, h, o); for (const [side, s0, s1, z0, z1, txt, op] of signs) neon(k, b, side, s0, s1, z0, z1, txt, op); return b; });
  // west row (R faces onto the lane)
  bk(7.6, 0.4, 4.0, 2.0, 1.6, 3.4, { col: "#e0d4bb", L: "grid", R: "glass", ac: 3, seed: 22, lit: 0.4, ant: 2, balc: true }, [["R", 0.15, 0.55, 1.9, 3.2, "居酒屋", { col: "#ffcf3a", fg: "#fff3b0", blink: true, seed: 2, ar: 0.42, vertical: true }]]);
  bk(9.6, 0.4, 5.8, 2.0, 1.8, 3.0, { col: "#d9d2c0", L: "red", R: "grid", ac: 3, seed: 23, lit: 0.35, ant: 3 }, [["L", 0.15, 0.85, 1.7, 2.7, "ホテル", { col: "#ff4fa0", fg: "#ffe0ef", blink: true, seed: 8, ar: 1.7 }]]);
  bk(11.2, 0.4, 7.8, 2.0, 1.0, 2.4, { col: "#e1d8c3", L: "grid", R: "grid", ac: 2, seed: 25, lit: 0.45, stack: true });
  // east back block + east row outer blocks
  bk(9.5, 6.9, 0.6, 2.4, 2.3, 5.6, { col: "#d9d5c8", L: "glass", R: "grid", ac: 3, seed: 24, lit: 0.4, ant: 2, sky: "#5f86b3" }, [["R", 0.1, 0.5, 3.0, 5.0, "新宿ビル", { col: "#4fd1ff", fg: "#e6faff", blink: true, seed: 5, ar: 0.5, vertical: true }]]);
  bk(13.4, 7.9, 4.0, 1.5, 1.9, 3.8, { col: "#e0d4bb", L: "glass", R: "grid", ac: 3, seed: 26, lit: 0.4, ant: 2, sky: "#6f92bb" }, [["R", 0.1, 0.5, 1.6, 3.5, "カラオケ", { col: "#4fd1ff", fg: "#e6faff", blink: true, seed: 5, ar: 0.42, vertical: true }]]);
  bk(15.5, 7.9, 6.1, 1.5, 1.9, 3.0, { col: "#e0c7bf", L: "red", R: "glass", ac: 2, seed: 27, lit: 0.4 }, [["L", 0.12, 0.88, 1.6, 2.7, "焼肉", { col: "#ff7a3a", fg: "#fff", blink: true, seed: 3, ar: 1.5, bg: "#2a1210" }]]);

  // ---- lane shops ----
  k.q(8.0, () => { // west 2-storey shop, awning on its R face
    const b = block(k, 2.4, 4.0, 1.3, 1.5, 2.3, { col: "#d9ccb2", L: "grid", R: "grid", ac: 2, seed: 31, lit: 0.5, balc: false });
    awnR(k, 3.7, 4.2, 1.1, 1.1, { stripes: 6, depth: 0.5, drop: 0.35, c1: "#3f7ac0" });
    pipe(k, 2.5, 5.5, 0, 140, 3.2);
  });
  k.q(13.2, () => { // ramen yatai, open R face
    yatai(k, 2.4, 5.7, 1.3, 1.8, { face: "R", sign: "ラーメン", h: 1.65, rh: 0.95 });
    acUnit(k, stdProj, 2.6, 5.9, 2.7, { s: 0.5 });
    smoke(k, ...P(3.0, 6.5, 2.9), { n: 4, h: 30, speed: 0.3, r: 2.5, grow: 4, a: 0.35, wind: 5 });
    pipe(k, 2.45, 7.4, 0, 110, 3);
  });
  k.q(14.0, () => { // counter + chef + steam
    k.box(4.0, 5.95, 0, 0.35, 1.45, 0.55, "#c89a64", { hatch: false, shadow: false, top: "#e2bd88" });
    smoke(k, ...P(4.1, 6.7, 0.6), { n: 6, h: 38, speed: 0.4, r: 3, grow: 5, a: 0.55, wind: 3 });
  });
  k.qperson(3.78, 6.7, { pose: "stand", dir: [1, 0.05], seed: 301, style: "shirt", top: "#f2efe6", hat: "cap", hatCol: "#f2efe6" });
  for (let i = 0; i < 3; i++) k.q(14.5 + i * 0.6, () => {
    const su = 4.8, sv = 6.0 + i * 0.55, [sx, sy] = P(su, sv, 0);
    c.fillStyle = "#c8392a"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.ellipse(sx, sy - 9, 5, 2.4, 0, 0, 6.3); c.fill(); c.stroke(); c.beginPath(); c.moveTo(sx, sy - 9); c.lineTo(sx, sy); c.stroke();
    k.person(su, sv, { pose: "sit", seatZ: 0.45, dir: [-1, 0.05], seed: 310 + i, style: ["tee", "coat", "dress"][i], top: ["#5aa07a", "#7a6a8a", "#e8a0a8"][i] });
  });
  k.q(9.0, () => { yatai(k, 2.6, 7.7, 1.1, 1.0, { face: "R", sign: "焼鳥", h: 1.3, wood: "#9a6e46", rh: 0.35 }); awnR(k, 3.7, 7.8, 1.2, 0.9, { stripes: 4, depth: 0.4, drop: 0.28, c1: "#d03a3a" }); });
  // east row: L faces towards the front
  k.q(10.0, () => { yatai(k, 6.4, 4.0, 1.5, 1.3, { face: "L", sign: "お好み焼き", h: 1.6, rh: 0.9, noren: "#a8323a", signBg: "#3a1a1a" }); k.awning(6.45, 5.3, 1.35, 1.4, { stripes: 6, depth: 0.5, drop: 0.38, c1: "#d03a3a" }); });
  k.q(11.4, () => { yatai(k, 6.4, 5.8, 1.5, 1.4, { face: "L", sign: "串", h: 1.5, wood: "#94683f", rh: 0.9, noren: "#a8323a" }); k.awning(6.45, 7.2, 1.3, 1.4, { stripes: 6, depth: 0.45, drop: 0.3, c1: "#3f7ac0" }); acUnit(k, stdProj, 7.1, 5.9, 2.4, { s: 0.45 }); });
  k.q(12.8, () => { const b = block(k, 6.4, 7.6, 1.4, 1.0, 2.0, { col: "#d9ccb2", L: "grid", R: "grid", ac: 2, seed: 33, lit: 0.5 }); neon(k, b, "L", 0.2, 0.8, 1.0, 1.7, "酒", { col: "#ffcf3a", fg: "#fff3b0", blink: true, seed: 6, ar: 1.0, size: 60 }); });
  k.q(15.0, () => { // diners at the okonomiyaki front
    k.box(7.7, 5.5, 0, 0.5, 0.3, 0.4, "#c89a64", { hatch: false, shadow: false, top: "#e2bd88" });
  });
  k.qperson(7.8, 5.95, { pose: "sit", seatZ: 0.45, dir: [0.05, -1], seed: 320, style: "tee" });
  k.qperson(8.0, 5.95, { pose: "sit", seatZ: 0.45, dir: [0.05, -1], seed: 321, style: "dress" });
  // blade signs sticking out of the walls
  k.q(8.3, () => { bladeBox(k, 3.7, 4.6, 1.3, 1.1, "寿司", { axis: "u", col: "#3af0c0", fg: "#e0fff6", glow: "60,230,190", blink: true, seed: 6 }); });
  k.q(9.4, () => { bladeBox(k, 3.7, 5.2, 1.0, 1.3, "居酒屋", { axis: "u", col: "#ffcf3a", fg: "#fff6c8", glow: "255,200,80", blink: true, seed: 2 }); });
  k.q(14.6, () => { bladeBox(k, 7.5, 8.6, 1.0, 1.1, "カラオケ", { axis: "v", col: "#4fd1ff", fg: "#e6faff", glow: "100,200,255", blink: true, seed: 5 }); });
  k.q(12.2, () => { bladeBox(k, 2.4, 7.55, 1.4, 1.1, "焼肉", { axis: "u", col: "#ff7a3a", fg: "#fff", glow: "255,140,70", blink: true, seed: 3, bg: "#2a1210" }); });
  // wires, chochin, lantern strings (anchored on wall points)
  k.q(15.8, () => { wire(k, P(3.7, 4.5, 2.3), P(6.4, 4.5, 2.0), 12); wire(k, P(3.7, 6.0, 2.4), P(6.4, 6.0, 2.2), 14); wire(k, P(3.7, 8.2, 1.6), P(6.4, 8.2, 1.6), 10); });
  k.q(15.9, () => {
    const L1 = P(3.7, 7.6, 1.45), L2 = P(6.4, 7.3, 1.45);
    for (let i = 0; i < 4; i++) chochin(k, L1[0] + 6 + i * 22, L1[1] + 8 - i * 11, { r: 6.5 + (i === 1 ? 2 : 0), glow: true, text: "祭酒食宴"[i], seed: i, col: "#d9372b" });
    for (let i = 0; i < 4; i++) chochin(k, L2[0] + 12 + i * 24, L2[1] + 6 + i * 11, { r: 7, glow: true, text: "酒肴屋宴"[i], seed: i + 7, col: "#d9372b" });
  });
  k.q(12.0, () => lanternString(k, P(3.7, 4.2, 2.1), P(6.4, 4.2, 2.1), 8, { glow: true, r: 4.2, seed: 1, sag: 10 }));
  k.q(13.0, () => lanternString(k, P(3.7, 6.2, 2.0), P(6.4, 6.2, 2.0), 8, { glow: true, r: 4.2, seed: 4, sag: 10 }));
  k.q(15.5, () => lanternString(k, P(3.7, 8.3, 1.9), P(6.4, 8.3, 1.9), 8, { glow: true, r: 4.6, seed: 7, sag: 10 }));
  // vending + plants + bollards + trees (all inside the footprint)
  k.q(15.0, () => { vending(k, 8.5, 3.45, { side: "L", col: "#d8392f", seed: 1 }); vending(k, 9.0, 3.45, { side: "L", col: "#3f73b5", seed: 2 }); });
  k.q(12.5, () => { k.tree(0.8, 3.6, { r: 0.7, h: 1.6, seed: 4 }); k.tree(9.1, 3.6, { r: 0.65, h: 1.7, seed: 5 }); });
  for (const [pu, pv, fl] of [[0.6, 9.3, "#f6b7c8"], [9.2, 9.3, null], [3.2, 3.8, null], [6.0, 3.8, "#f6b7c8"], [8.9, 8.3, "#e9a0c0"], [0.7, 9.0, null]]) k.q(pu + pv + 0.3, () => plantBox(k, pu, pv, { flower: fl, big: !fl }));
  for (const [bu, bv] of [[3.7, 8.9], [4.3, 8.9], [5.8, 8.9], [6.4, 8.9]]) k.q(bu + bv, () => bollard(k, bu, bv));

  // ---- people ----
  const R = ROUTES, outs = [
    { style: "coat", top: "#d8c28a", bottom: "#3c3c3c", bag: true }, { style: "shirt", top: "#3b4f6e", bottom: "#2b3040", bag: true, bagCol: "#2a2420" }, { style: "dress", top: "#e8a0a8", bottom: "#4a3b30", hairStyle: "long" },
    { style: "tee", top: "#e8c14a", bottom: "#25334b", hat: "cap" }, { style: "shirt", top: "#f2efe6", bottom: "#2b3040" }, { style: "stripes", top: "#f2efe6", bottom: "#4a5a7a", bag: true },
    { style: "coat", top: "#7a6a8a", bottom: "#2b3040" }, { style: "tee", top: "#5aa07a", bottom: "#3a3a4a", bag: true }, { style: "dress", top: "#c85a6a", bottom: "#2b3040", hairStyle: "long" },
  ];
  const spec = [[0, 0.0], [0, 0.5], [1, 0.1], [1, 0.6], [2, 0.3], [2, 0.8], [3, 0.2], [3, 0.65], [4, 0.4], [4, 0.9], [5, 0.0], [5, 0.55], [6, 0.3], [7, 0.1], [7, 0.6], [0, 0.78]];
  spec.forEach(([r, off], i) => k.qwalker(R[r], { speed: 0.4 + (i % 4) * 0.035, offset: off, seed: 400 + i, dwell: 1 + (i % 3) * 0.7, ...outs[i % outs.length] }));
  // podium entrance: people loitering under the canopy
  [[2.4, 3.4, 330, "coat", "#7a6a8a"], [2.9, 3.4, 331, "shirt", "#3b4f6e"], [3.4, 3.4, 332, "dress", "#e8a0a8"], [4.2, 3.4, 333, "tee", "#5aa07a"]].forEach(([pu, pv, sd, st, tp], i) => k.qperson(pu, pv, { pose: "stand", dir: i % 2 ? [1, 0.1] : [0.1, 1], seed: sd, style: st, top: tp, bottom: "#2b3040" }));
  k.flush();
  petals(k, 520, 560, 560, 780, 6, { seed: 3, col: "#f7bccb" });
  k.circlingBird(480, 120, 80, 25, { speed: 0.5 }); k.cloud(200, 170, { s: 0.8, phase: 1 }); k.cloud(800, 150, { s: 0.7, phase: 2 });
}
