// TOKYO · Meiji Jingu shrine & forest, grid pass. Scenery (hall, torii, barrel rack, temizuya, cedars) lives in
// ./_g-1_1.js and is built on the u/v grid through P(); this file lays out the tile and runs the people.
// Layout (u,v): avenue u 4..6 along v from the front edge to the hall stairs; torii on v 6.6; barrel rack left
// of the path (u<2.8, v 4.2-7.8); purification pavilion right (u 6.8-9.2, v 4.85-7.15); cedars fill the rest.
import { P, INK, lerp } from "../../lib/vec-kit.js";
import { petals } from "./_props.js";
import { drawHuman, walkState, spline } from "./_t-1_1.js";
import { lantern, fence, shrub, rock } from "./meiji.js";
import * as G from "./_g-1_1.js";

const TAU = Math.PI * 2;
export const camera = { u: 5, v: 4.6, z: 2.4, zoom: 1.55 };

// walking lanes (u,v)
const LANE_C = [[5, 4.3], [5, 5.5], [5, 6.7], [5, 7.9], [5, 8.9]];            // procession, hall -> front
const LANE_L = [[4.45, 8.7], [4.45, 7.5], [4.45, 6.3], [4.45, 5.2], [4.45, 4.3]]; // visitors, front -> hall
const LANE_R = [[5.55, 8.7], [5.55, 7.5], [5.55, 6.3], [5.55, 5.2], [5.55, 4.3]];
const ROUTES = [LANE_C, LANE_L, LANE_R];
const OBST = [];
export { ROUTES, OBST };

// shift a lane sideways (perpendicular, in uv) so groups walk abreast and never cross
function offsetLane(path, d) {
  return path.map((p, i) => { const a = path[Math.max(0, i - 1)], b = path[Math.min(path.length - 1, i + 1)], du = b[0] - a[0], dv = b[1] - a[1], L = Math.hypot(du, dv) || 1; return [p[0] - (dv / L) * d, p[1] + (du / L) * d]; });
}
// a walker on an open lane: walks, pauses at the ends; at the shrine end it bows (two slow bows)
function laneWalker(k, t, path, o) {
  const sp = spline(path, false), speed = o.speed, dwell = o.dwell, walkT = sp.L / speed, period = 2 * (walkT + dwell);
  const tt = (((t + o.offset * period) % period) + period) % period;
  const s = walkState(path, t, { speed, dwell, offset: o.offset, stride: o.stride });
  let pose = s.moving ? "walk" : "stand", dir = [s.du, s.dv], bow = 0;
  if (tt >= walkT && tt < walkT + dwell && o.bowAtEnd) {
    const f = (tt - walkT) / dwell, end = sp.sample(sp.L); dir = [end.du, end.dv];
    const b = Math.max(0, Math.sin(Math.min(1, Math.max(0, (f - 0.15) / 0.7)) * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5) * (f > 0.12 && f < 0.88 ? 1 : 0);
    if (b > 0.02) { pose = "bow"; bow = 0.26 * b; }
  }
  k.q(s.u + s.v, () => drawHuman(k, s.u, s.v, { ...o.fit, seed: o.seed, dir, pose, bow, p: s.p }));
}

// the wedding procession (sanshin no gi): priest, bride under the red umbrella, attendant, groom, family
const PROC = [
  { gap: 0, seed: 1401, fit: { style: "hakama", top: "#f6f2e6", bottom: "#f0ece0", hat: "eboshi", hairStyle: "short", skin: "#e6b48c" } },
  { gap: 0.62, seed: 1402, fit: { style: "kimono", top: "#fbfaf4", bottom: "#fbfaf4", obi: "#f1eee2", hat: "wataboshi", hairStyle: "bun", pattern: "#e6dfcc", skin: "#f6dcc3" }, bride: true },
  { gap: 1.08, seed: 1403, fit: { style: "hakama", top: "#fbfaf4", bottom: "#c8302a", hairStyle: "long", hair: "#1d1b1b", hat: null } },
  { gap: 1.7, seed: 1404, fit: { style: "hakama", top: "#26252b", bottom: "#7d7a80", hairStyle: "short", hair: "#1d1b1b", hat: null } },
  { gap: 2.32, seed: 1405, fit: { style: "kimono", top: "#2a2830", bottom: "#2a2830", obi: "#d9b25a", hairStyle: "bun", pattern: "#b99a52", hat: null } },
];
function procession(k, t) {
  const speed = 0.3, dwell = 2.5, sp = spline(LANE_C, false), period = 2 * (sp.L / speed + dwell);
  const st = PROC.map((m) => ({ ...walkState(LANE_C, t, { speed, dwell, offset: -m.gap / speed / period, stride: 0.2 }), m }));
  for (const s of st) k.q(s.u + s.v, () => drawHuman(k, s.u, s.v, { ...s.m.fit, seed: s.m.seed, dir: [s.du, s.dv], pose: s.moving ? "walk" : "stand", p: s.p, h: s.m.bride ? 0.7 : 0.74 }));
  // red wagasa held by the attendant over the bride (drawn after both)
  const b = st[1], a = st[2];
  k.q(Math.max(a.u + a.v, b.u + b.v) + 0.05, () => {
    const c = k.ctx, [bx, by] = P(b.u, b.v, 0), [ax, ay] = P(a.u, a.v, 0), sway = Math.sin(t * 1.3) * 1.2;
    const ux = lerp(bx, ax, 0.3) + sway, uy = lerp(by, ay, 0.3) - 46;
    c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(ax - 2, ay - 16); c.lineTo(ux, uy + 2); c.stroke();
    wagasa(c, ux, uy, t);
  });
}
function wagasa(c, x, y, t) {
  const R = 22, rot = t * 0.25;
  c.fillStyle = "rgba(60,30,20,0.12)"; c.beginPath(); c.ellipse(x + 10, y + 50, R * 0.9, R * 0.3, 0, 0, TAU); c.fill();
  // canopy: shallow cone seen from above-front, with ribs
  c.beginPath(); c.ellipse(x, y, R, R * 0.42, 0, 0, TAU); c.fillStyle = "#c92f26"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
  c.save(); c.beginPath(); c.ellipse(x, y, R, R * 0.42, 0, 0, TAU); c.clip();
  c.fillStyle = "#a8231c"; c.beginPath(); c.ellipse(x + 6, y + 4, R, R * 0.4, 0, 0, TAU); c.fill();
  c.strokeStyle = "rgba(255,220,200,0.55)"; c.lineWidth = 0.7; c.beginPath();
  for (let i = 0; i < 16; i++) { const a = rot + (i / 16) * TAU; c.moveTo(x, y - 3); c.lineTo(x + Math.cos(a) * R, y + Math.sin(a) * R * 0.42); } c.stroke();
  c.strokeStyle = "#f4e6c8"; c.lineWidth = 1.4; c.beginPath(); c.ellipse(x, y - 1, R * 0.45, R * 0.18, 0, 0, TAU); c.stroke();
  c.restore();
  c.beginPath(); c.arc(x, y - 3, 2.6, 0, TAU); c.fillStyle = "#2a2420"; c.fill();
}


const LANTERNS = [[3.2, 4.15, 0.8, 1, false], [6.8, 4.15, 0.8, 2, false], [3.15, 8.1, 1.15, 3, true], [6.85, 8.1, 1.0, 4, true]];
const FENCES = [[[3.55, 9.2], [3.55, 8.6], [3.55, 8.0], [3.55, 7.4]], [[6.45, 9.2], [6.45, 8.6], [6.45, 8.0], [6.45, 7.4]],
  [[3.55, 5.9], [3.55, 5.3], [3.55, 4.7]], [[6.45, 5.9], [6.45, 5.3], [6.45, 4.7]]];

export default function draw(k, t) {
  const c = k.ctx;
  G.ground(k, t);
  G.gravel(k, t);

  // forest, hall, props: depth = u + v (hall behind its flanking trees' front line)
  for (const T of G.TREES) k.q(T.u + T.v, () => G.cedar(k, t, T));
  k.q(5.2, () => G.hall(k, t));
  k.q(8.6, () => G.porch(k, t));
  k.q(8.5, () => G.barrels(k, t));
  k.q(11.6, () => G.torii(k, t));
  k.q(12.5, () => G.temizuyaBack(k, t));
  k.q(15.0, () => G.temizuyaFront(k, t));
  for (const [u, v, s, seed, base] of LANTERNS) k.q(u + v, () => { const [x, y] = P(u, v, 0); lantern(k, t, x, y, s, seed, base); });
  for (const run of FENCES) { const last = run[run.length - 1]; k.q(last[0] + last[1] + 0.2, () => fence(k, t, run.map(([u, v]) => P(u, v, 0)))); }
  for (const [u, v, r, f, sd] of G.UNDER) k.q(u + v + 0.2, () => { const [x, y] = P(u, v, 0); shrub(k, t, x, y, r, sd, f); });
  for (const [u, v, r] of G.ROCKS) k.q(u + v + 0.3, () => { const [x, y] = P(u, v, 0); rock(k, x, y, r, Math.round(u * 13 + v * 7)); });

  // ---- people ----
  procession(k, t);
  const LG = [{ d: -0.3, seed: 1501, fit: { style: "coat", top: "#3e5f8f", bottom: "#2b3040", hairStyle: "short" } }, { d: -0.08, seed: 1502, fit: { style: "skirt", top: "#f2efe6", bottom: "#d06a3a", hairStyle: "long" } }, { d: 0.12, seed: 1503, h: 0.5, fit: { style: "tee", top: "#e9c24d", bottom: "#2f3e5e", kid: true } }];
  for (const g of LG) laneWalker(k, t, offsetLane(LANE_L, g.d), { speed: 0.36, dwell: 4.2, offset: 0.12, stride: 0.27, seed: g.seed, fit: { ...g.fit, ...(g.h ? { h: g.h, kid: true } : {}) }, bowAtEnd: !g.h });
  const RG = [{ d: 0.06, seed: 1511, fit: { style: "shirt", top: "#f4f0e6", bottom: "#3c3c3c", bag: true, bagCol: "#2a2420", hairStyle: "short" } }, { d: 0.28, seed: 1512, fit: { style: "dress", top: "#5f9d6d", bottom: "#5f9d6d", hairStyle: "bob" } }];
  for (const g of RG) laneWalker(k, t, offsetLane(LANE_R, g.d), { speed: 0.33, dwell: 4.6, offset: 0.62, stride: 0.27, seed: g.seed, fit: g.fit, bowAtEnd: true });
  // worshippers bowing at the offering box on the veranda
  for (const [u, seed, ph, fit] of [[4.55, 1521, 0, { style: "coat", top: "#4a5a7a", bottom: "#2b2b30", hat: null, hairStyle: "short" }], [5.45, 1522, 0.6, { style: "kimono", top: "#c9567a", bottom: "#c9567a", obi: "#f2d27a", pattern: "#f6dce6", hairStyle: "bun" }]]) {
    const v = 2.62, b = Math.max(0, Math.sin(t * 0.8 + ph * 3));
    k.q(u + v, () => drawHuman(k, u, v, { ...fit, seed, z: 0.4, dir: [0, -1], pose: b > 0.1 ? "bow" : "stand", bow: 0.34 * b, shadow: true }));
  }
  // woman at the temizuya rinsing her hands, ladle dipping
  {
    const u = 8.5, v = 6.62, dip = Math.max(0, Math.sin(t * 1.4));
    k.q(u + v, () => {
      const r = drawHuman(k, u, v, { seed: 1531, style: "skirt", top: "#f4f0e6", bottom: "#2f4b6c", hairStyle: "bob", dir: [0.1, -1], pose: "bow", bow: 0.1 + 0.08 * dip, z: 0.1 });
      const [hx, hy] = r.hand, [bx, by] = P(8.55, 6.0, 0.62 + 0.25 * (1 - dip));
      c.strokeStyle = INK; c.lineWidth = 2.4; c.lineCap = "round"; c.beginPath(); c.moveTo(hx, hy); c.lineTo(bx, by); c.stroke(); c.strokeStyle = "#e3c776"; c.lineWidth = 1.2; c.stroke();
      c.beginPath(); c.ellipse(bx, by + 1, 2.8, 2, 0, 0, TAU); c.fillStyle = "#d6b866"; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
      if (dip < 0.3) { c.fillStyle = "rgba(170,220,235,0.9)"; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(bx + 1, by + 4 + ((t * 40 + i * 5) % 14), 0.9, 0, TAU); c.fill(); } }
    });
  }
  // shrine maiden sweeping the forecourt gravel
  {
    const u = 5.7, v = 3.9, sw = Math.sin(t * 2.2);
    k.q(u + v, () => {
      const r = drawHuman(k, u, v, { seed: 1541, style: "hakama", top: "#fbfaf4", bottom: "#c8302a", hairStyle: "long", hair: "#1d1b1b", hat: null, dir: [0.9, 0.5], pose: "stand" });
      const [hx, hy] = r.hand, [gx, gy] = P(u + 0.3 + sw * 0.16, v + 0.28 - sw * 0.1, 0);
      c.strokeStyle = INK; c.lineWidth = 2.2; c.lineCap = "round"; c.beginPath(); c.moveTo(hx, hy - 6); c.lineTo(gx, gy - 3); c.stroke(); c.strokeStyle = "#c9a35a"; c.lineWidth = 1; c.stroke();
      c.fillStyle = "#b08a48"; c.beginPath(); c.moveTo(gx - 1, gy - 4); c.lineTo(gx - 7 + sw * 2, gy + 1); c.lineTo(gx + 7 + sw * 2, gy + 1); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
      c.fillStyle = "#b9a447"; for (let i = 0; i < 3; i++) { const f = (t * 0.9 + i / 3) % 1; c.beginPath(); c.ellipse(gx + 8 + f * 18 + i * 3, gy - Math.sin(f * Math.PI) * 6 + i, 2, 1.1, f * 6, 0, TAU); c.fill(); }
    });
  }
  // photographer at the front framing the torii, two tourists looking up at it
  for (const [u, v, seed, pose, dir, fit] of [
    [4.4, 8.95, 1551, "photo", [-0.2, -1], { style: "tee", top: "#d9544b", bottom: "#25334b", hat: "cap", hatCol: "#2a2420" }],
    [5.75, 7.9, 1552, "stand", [-0.1, -1], { style: "coat", top: "#7a8fae", bottom: "#2b3040", hairStyle: "short" }],
    [5.9, 8.05, 1553, "stand", [-0.1, -1], { style: "dress", top: "#e58a8a", bottom: "#e58a8a", hairStyle: "long" }],
  ]) k.q(u + v, () => drawHuman(k, u, v, { ...fit, seed, dir, pose }));

  k.flush();

  // sun shafts through the canopy, falling cedar needles/leaves, crows
  c.save(); c.globalCompositeOperation = "screen";
  for (let i = 0; i < 4; i++) { const x = 470 + i * 75 + Math.sin(t * 0.25 + i) * 10, a = 0.06 + 0.03 * Math.sin(t * 0.5 + i * 1.7); const g = c.createLinearGradient(x, 120, x - 90, 820); g.addColorStop(0, `rgba(255,246,200,${a})`); g.addColorStop(1, "rgba(255,246,200,0)"); c.fillStyle = g; c.beginPath(); c.moveTo(x - 12, 120); c.lineTo(x + 12, 120); c.lineTo(x - 60, 820); c.lineTo(x - 125, 820); c.closePath(); c.fill(); }
  c.restore();
  petals(k, 260, 300, 860, 880, 16, { seed: 3, col: "#b7b24a", T: 11, drift: 22 });
  petals(k, 380, 350, 700, 900, 6, { seed: 8, col: "#d98a3a", T: 9, drift: 14 });
  k.circlingBird(560, 150, 130, 34, { speed: 0.35 }); k.circlingBird(560, 150, 130, 34, { speed: 0.35, phase: 0.62, size: 0.85 });
}
