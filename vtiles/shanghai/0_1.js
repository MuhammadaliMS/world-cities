// SHANGHAI · Jing'an Temple, rebuilt on the grid: main hall along the back (facade on the left face), 7-tier pagoda in the
// back corner, two cloister wings (left edge + right edge) around a courtyard open to the front, bronze censer with incense,
// bowing and strolling worshippers. Every wall runs along u or v.
import { P, CTS, INK, shade, lerp, rng, glint, crowd } from "./_props.js";
import { stoneLantern, planter, bonsai } from "./_h_b.js";
import { censer, smoke, bower } from "./_t0_1.js";
import { hall, stairs, wingLeft, wingRight, pagoda, lion } from "./_g0_1.js";

export const camera = { u: 4.4, v: 4.2, z: 3.8, zoom: 1.5 };

export default function draw(k, t) {
  const c = k.ctx;
  // ---------- paved courtyard ----------
  k.slab("#eadbb9", { side: "#e0cfa8" });
  c.save(); k._trace([P(0, 0), P(10, 0), P(10, 10), P(0, 10)], true, 0); c.clip();
  c.strokeStyle = "rgba(150,120,80,0.35)"; c.lineWidth = 0.9; c.beginPath();
  for (let i = 1; i < 20; i++) { c.moveTo(...P(i * 0.5, 0)); c.lineTo(...P(i * 0.5, 10)); c.moveTo(...P(0, i * 0.5)); c.lineTo(...P(10, i * 0.5)); }
  c.stroke();
  const R = rng(2); for (let i = 0; i < 160; i++) { const [x, y] = P(R() * 10, R() * 10); c.fillStyle = R() < 0.5 ? "rgba(255,255,240,0.4)" : "rgba(150,120,80,0.2)"; c.fillRect(x, y, 3, 1.4); }
  // darker garden ground behind, central axis path and censer plaza
  k.ground([[0.3, 0.3], [2.9, 0.3], [2.9, 4.5], [0.3, 4.5]], "rgba(160,190,110,0.5)", { stroke: false });
  k.ground([[8.2, 0.3], [9.7, 0.3], [9.7, 4.4], [8.2, 4.4]], "rgba(160,190,110,0.5)", { stroke: false });
  k.ground([[4.8, 5.3], [6.4, 5.3], [6.4, 6.3], [4.8, 6.3]], "rgba(214,176,112,0.55)", { stroke: false });
  k.ground([[3.7, 7.9], [5.6, 6.0], [7.5, 7.9], [5.6, 9.8]], "rgba(214,176,112,0.4)", { stroke: false });
  c.restore();
  k.poly([[0, 0, 0], [10, 0, 0], [10, 10, 0], [0, 10, 0]], null, { lw: 1.6 });

  // ---------- back: pagoda, trees, hall ----------
  k.q(2, () => pagoda(k, t));
  k.q(4, () => { k.tree(1.2, 3.7, { r: 0.6, h: 1.6, seed: 11 }); k.tree(2.3, 3.4, { r: 0.45, h: 1.3, seed: 12, col: "#7fae52" }); });
  k.q(9.5, () => { k.tree(8.9, 1.0, { r: 0.6, h: 1.7, seed: 13 }); k.tree(9.3, 2.6, { r: 0.45, h: 1.3, seed: 14, col: "#78a64e" }); });
  k.q(6, () => hall(k, t));
  k.q(6.2, () => stairs(k));
  // ---------- wings ----------
  k.q(7, () => wingLeft(k, t));
  k.q(17, () => wingRight(k, t));
  k.q(11, () => { k.tree(1.5, 9.4, { r: 0.55, h: 1.5, seed: 15 }); });
  // ---------- courtyard props ----------
  k.q(4.35 + 5.75, () => lion(k, 4.35, 5.75, -1)); k.q(6.85 + 5.75, () => lion(k, 6.85, 5.75, 1));
  const bed = (u, v, du, dv, cols, seed, bu, bv, bs) => k.q(u + du + v + dv + 0.2, () => { planter(k, u, v, du, dv, cols, seed); bonsai(k, bu, bv, seed, bs); });
  bed(2.9, 5.1, 0.8, 0.8, ["#f39ac0", "#fff", "#e8607a"], 3, 3.3, 5.5, 1.15);
  bed(6.9, 5.1, 0.8, 0.8, ["#f39ac0", "#fff"], 4, 7.3, 5.5, 1.15);
  bed(2.7, 9.1, 0.8, 0.6, ["#f39ac0", "#fff", "#f4c542"], 5, 3.1, 9.4, 1.0);
  bed(7.3, 9.1, 0.8, 0.6, ["#f39ac0", "#fff"], 6, 7.7, 9.4, 1.0);
  for (const [u, v] of [[2.95, 6.9], [7.7, 6.9], [2.95, 8.6], [7.7, 8.6]]) k.q(u + v + 0.3, () => stoneLantern(k, u, v, 1.5));
  const CU = 5.6, CV = 7.9;
  k.q(CU + CV + 1.2, () => censer(k, CU, CV, t));

  // ---------- worshippers around the censer: bow, pray, stand ----------
  [[-1.4, 0.2, "bow", 301, 0.0], [-1.1, 1.2, "stand", 302, 0], [0.2, 1.45, "bow", 303, 0.35], [1.4, 0.9, "clap", 304, 0], [1.4, -0.3, "bow", 305, 0.6], [0.9, -1.4, "stand", 306, 0], [-0.9, -1.35, "clap", 307, 0]].forEach(([a, b, pose, seed, ph]) => {
    const u = CU + a, v = CV + b, dir = [-a, -b];
    if (pose === "bow") k.q(u + v, () => bower(k, u, v, { dir, seed, scale: 0.78 }, ph, 0.22));
    else k.qperson(u, v, { pose, dir, seed, kid: seed === 302, scale: seed === 302 ? 0.5 : 0.78 });
  });
  const routes = [
    [[3.4, 6.0], [3.5, 8.8]],
    [[7.3, 6.0], [7.3, 8.8]],
    [[4.2, 9.3], [7.0, 9.3]],
    [[5.0, 5.75], [6.2, 5.75]],
    [[3.9, 6.2], [4.1, 8.0], [4.9, 9.0]],
    [[7.0, 6.2], [6.9, 8.0], [6.3, 9.0]],
  ];
  crowd(k, routes, [[0, 0.0, 311], [0, 0.6, 312], [1, 0.2, 313], [1, 0.75, 314], [2, 0.3, 315], [2, 0.8, 316], [3, 0.1, 317], [4, 0.5, 318], [5, 0.3, 319]], { scale: 0.78 });
  // platform strollers in front of the hall (on the marble terrace, z = 0.5)
  k.qwalker([[3.3, 3.95], [4.4, 3.95]], { speed: 0.25, offset: 0.1, seed: 331, dwell: 1.5, z: 0.5, scale: 0.78 });
  k.qwalker([[6.5, 3.95], [7.6, 3.95]], { speed: 0.22, offset: 0.6, seed: 332, dwell: 2.0, z: 0.5, scale: 0.78 });
  k.qperson(4.0, 8.9, { pose: "photo", dir: [0.8, 0.6], seed: 322, scale: 0.78 });
  k.qperson(4.0, 4.0, { pose: "stand", dir: [0.2, 1], seed: 333, z: 0.5, scale: 0.78 });
  k.flush();
  smoke(k, t, CU, CV, 4.3);
  // glints on the golden roofs
  const R2 = rng(7); for (let i = 0; i < 9; i++) { const [x, y] = [lerp(300, 740, R2()), lerp(200, 400, R2())], s = Math.max(0, Math.sin(t * (1 + R2()) + R2() * 9)); if (s > 0.88) glint(c, x, y, (s - 0.88) / 0.12 * 7 + 2, "#fff6c4"); }
  k.circlingBird(480, 150, 90, 22, { speed: 0.6, phase: 0 }); k.circlingBird(640, 120, 60, 18, { speed: -0.5, phase: 2 });
  k.cloud(90, 90, { s: 0.8, phase: 1 }); k.cloud(850, 130, { s: 0.7, phase: 3 });
}
