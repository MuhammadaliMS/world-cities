// EXAMPLE · 0,0 · Town Hall Square. The smallest complete tile: ground, one building, trees, people, one event.
// Everything goes through the kit (k) and P(u, v, z); nothing touches the ground outside 0.3..9.7.
import { P, INK, clamp } from "../../lib/vec-kit.js";

export default function draw(k, t) {
  k.slab("#e9dec6");                                                     // the ground plate, always first
  k.ground([[0.4, 5.4], [9.6, 5.4], [9.6, 9.6], [0.4, 9.6]], "#a9c76f"); // a lawn in (u, v)
  k.ground([[4.3, 3.6], [5.7, 3.6], [5.7, 9.6], [4.3, 9.6]], "#e9dec6", { stroke: false }); // the path to the door

  // the town hall: a box with windows on both visible faces and a hipped roof (walls along u and v)
  k.box(2.2, 1.0, 0, 5.6, 2.6, 2.6, "#e7d3a4");
  k.windows(2.2, 1.0, 0.2, 5.6, 2.6, 2.2, { side: "L", cols: 7, rows: 3, lit: 0.25 });
  k.windows(2.2, 1.0, 0.2, 5.6, 2.6, 2.2, { side: "R", cols: 3, rows: 3 });
  k.hip(2.0, 0.8, 2.6, 6.0, 3.0, 1.0, "#6f86a8");

  // the event: every 12 s the flag on the roof is raised, flies, and comes down again
  const c = t % 12, up = clamp((c - 2) / 2) - clamp((c - 9) / 2);
  const [fx, fy] = P(5, 2.3, 3.6), ctx = k.ctx;
  ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy - 78); ctx.stroke();
  const top = fy - 18 - up * 56, wave = Math.sin(t * 5) * 3;
  ctx.fillStyle = "#d64e46"; ctx.beginPath(); ctx.moveTo(fx, top); ctx.lineTo(fx + 30, top + 5 + wave); ctx.lineTo(fx, top + 16); ctx.closePath(); ctx.fill(); ctx.stroke();

  // things people can walk in front of or behind go through the depth queue (depth = u + v of the front)
  for (const [u, v] of [[1.2, 6.2], [8.8, 6.2], [1.4, 8.8], [8.6, 8.8]]) k.q(u + v, () => k.tree(u, v, { r: 0.62, h: 1.5 }));
  k.q(3.4 + 7.4, () => k.bench(3.4, 7.4));
  k.q(6.6 + 7.4, () => k.lamp(6.6, 7.4));

  // people: routes are [u, v] points; walkers pause at the ends and turn back, or loop
  k.qwalker([[5, 4.0], [5, 9.2]], { seed: 1, speed: 0.45 });
  k.qwalker([[5, 9.0], [5, 4.2]], { seed: 2, speed: 0.4, offset: 0.4 });
  k.qwalker([[0.9, 7.6], [2.6, 7.9], [4.2, 7.6]], { seed: 3 });
  k.qwalker([[9.1, 7.6], [7.4, 7.9], [5.8, 7.6]], { seed: 4, offset: 0.3 });
  k.qwalker([[0.8, 9.3], [9.2, 9.3], [9.2, 5.8], [0.8, 5.8]], { seed: 5, loop: true, speed: 0.5 });
  k.qperson(4.4, 4.3, { pose: "photo", seed: 6 });
  k.qperson(5.7, 4.5, { pose: "wave", seed: 7 });
}
