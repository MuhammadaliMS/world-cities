// DUBAI · 0,1 · Dubai Marina skyline: balconied glass towers (frames, curtain walls, balcony slabs, crowns)
// and the twisting Cayan Tower. Used only by vtiles/dubai/0_1.js.
import { P, CTS, INK, shade, lerp, clamp, rng, hash } from "../../lib/vec-kit.js";

export const BEIGE = "#efd7a8";
const SX = CTS.S * CTS.XS, SY = CTS.S * CTS.YS;
const tr = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
// screen offset of a ground vector (du, dv)
const off = (du, dv) => [(du - dv) * SX, (du + dv) * SY];

// sun glint that sweeps across every glass surface of the skyline (tilted band, screen space)
function glint(c, t, y0, y1) {
  const per = 9, ph = (t % per) / per;
  const gx = -200 + ph * 1500;
  const g = c.createLinearGradient(gx - 26, 0, gx + 26, -9);
  g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.5, "rgba(255,255,255,0.42)"); g.addColorStop(1, "rgba(255,255,255,0)");
  c.save(); c.transform(1, 0, -0.32, 1, 0.32 * 600, 0); c.fillStyle = g; c.fillRect(gx - 30, y0, 60, y1 - y0); c.restore();
}
// 4-point star sparkle
export function star(c, x, y, r, a) {
  if (a <= 0.02) return;
  c.save(); c.globalAlpha = a; c.fillStyle = "#ffffff";
  c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r * 0.32, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r * 0.32, y); c.quadraticCurveTo(x, y, x, y - r); c.fill();
  c.beginPath(); c.moveTo(x - r * 0.7, y); c.quadraticCurveTo(x, y, x, y - r * 0.22); c.quadraticCurveTo(x, y, x + r * 0.7, y); c.quadraticCurveTo(x, y, x, y + r * 0.22); c.quadraticCurveTo(x, y, x - r * 0.7, y); c.fill();
  c.restore();
}

// ---------- face panels ----------
// glass curtain wall between s0..s1, z0..z1 on face F (light: 0..1, 1 = lit face)
function glassPanel(k, t, F, s0, s1, z0, z1, o) {
  const c = k.ctx, fl = o.floor, lit = o.lit;
  const q = [F(s0, z0), F(s1, z0), F(s1, z1), F(s0, z1)];
  tr(c, q);
  const g = c.createLinearGradient(q[0][0], q[2][1], q[1][0], q[0][1]);
  if (lit) { g.addColorStop(0, "#6ec3d6"); g.addColorStop(0.35, "#2f9bbd"); g.addColorStop(1, "#1d6f97"); }
  else { g.addColorStop(0, "#44a3c0"); g.addColorStop(0.45, "#237ea6"); g.addColorStop(1, "#155a80"); }
  c.fillStyle = g; c.fill();
  c.save(); tr(c, q); c.clip();
  // reflected sky / neighbour streaks
  c.fillStyle = lit ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.09)";
  const R = rng(o.seed * 31 + Math.round(s0 * 10));
  for (let i = 0; i < 2; i++) { const a = lerp(s0, s1, R()), w = (s1 - s0) * (0.12 + R() * 0.15); tr(c, [F(a, z0), F(a + w, z0), F(a + w + 0.15, z1), F(a + 0.15, z1)]); c.fill(); }
  // mullions + floor lines
  c.strokeStyle = lit ? "rgba(18,58,92,0.42)" : "rgba(10,40,70,0.45)"; c.lineWidth = 0.75; c.beginPath();
  const m = Math.max(1, Math.round((s1 - s0) / 0.17));
  for (let i = 1; i < m; i++) { const s = lerp(s0, s1, i / m); c.moveTo(...F(s, z0)); c.lineTo(...F(s, z1)); }
  for (let z = z0 + fl; z < z1 - 0.02; z += fl) { c.moveTo(...F(s0, z)); c.lineTo(...F(s1, z)); }
  c.stroke();
  c.strokeStyle = "rgba(255,255,255,0.28)"; c.lineWidth = 0.6; c.beginPath();
  for (let z = z0 + fl + 0.03; z < z1 - 0.02; z += fl) { c.moveTo(...F(s0, z)); c.lineTo(...F(s1, z)); }
  c.stroke();
  // sky reflection band (top of each panel) + warm lit windows + shade on the unlit face
  { const sg = c.createLinearGradient(0, q[2][1], 0, q[0][1]); sg.addColorStop(0, lit ? "rgba(235,248,255,0.34)" : "rgba(200,225,240,0.2)"); sg.addColorStop(0.5, "rgba(255,255,255,0)"); sg.addColorStop(1, "rgba(10,40,70,0.18)"); c.fillStyle = sg; tr(c, q); c.fill(); }
  if (!lit) { c.fillStyle = "rgba(8,30,60,0.2)"; tr(c, q); c.fill(); }
  { const RL = rng(o.seed * 53 + Math.round(s0 * 17)), nb = Math.max(1, Math.round((s1 - s0) / 0.17)), wb = (s1 - s0) / nb;
    for (let z = z0 + 0.02; z < z1 - fl * 0.6; z += fl) for (let i = 0; i < nb; i++) if (RL() < 0.09) { const a = s0 + i * wb + wb * 0.18, b = s0 + (i + 1) * wb - wb * 0.18; tr(c, [F(a, z + fl * 0.12), F(b, z + fl * 0.12), F(b, z + fl * 0.72), F(a, z + fl * 0.72)]); c.fillStyle = "rgba(255,226,140,0.82)"; c.fill(); } }
  // twinkling panes
  const np = Math.round((s1 - s0) * (z1 - z0) * 2.2);
  for (let i = 0; i < np; i++) {
    const s = lerp(s0, s1, R()), z = lerp(z0, z1, R()), ph = R() * 6.28, sp = 0.8 + R() * 1.4;
    const a = Math.pow(Math.max(0, Math.sin(t * sp + ph)), 6);
    if (a > 0.05) { const [x, y] = F(s, z); c.fillStyle = `rgba(255,255,255,${a * 0.75})`; c.fillRect(x - 2, y - 3, 4, 3); }
  }
  glint(c, t + o.seed * 0.0, q[2][1] - 40, q[0][1] + 40);
  c.restore();
  // star sparkles at a few pane corners
  const R2 = rng(o.seed * 7 + Math.round(z1 * 13 + s0 * 5));
  for (let i = 0; i < 2; i++) { const s = lerp(s0, s1, R2()), z = lerp(z0, z1, R2()), ph = R2() * 6.28; const a = Math.pow(Math.max(0, Math.sin(t * 0.9 + ph)), 14); const [x, y] = F(s, z); star(c, x, y, 7, a); }
}
// recessed balcony bays: beige wall, glass doors, protruding slabs with glass rails (+ plants)
function balcPanel(k, t, F, s0, s1, z0, z1, o) {
  const c = k.ctx, fl = o.floor, d = o.bd ?? 0.07, [ox, oy] = o.out;
  const q = [F(s0, z0), F(s1, z0), F(s1, z1), F(s0, z1)];
  k.path(q, { fill: shade(o.wall, -0.12), stroke: false, wobble: 0 });
  const R = rng(o.seed * 17 + Math.round(s0 * 31));
  const ex = (p) => [p[0] + ox * d, p[1] + oy * d];
  for (let z = z0; z < z1 - fl * 0.5; z += fl) {
    // doors: dark tinted glass, split in two leaves
    const dz0 = z + 0.025, dz1 = z + fl * 0.9;
    const g = c.createLinearGradient(0, F(s0, dz1)[1], 0, F(s0, dz0)[1]); g.addColorStop(0, o.lit ? "#3f93b4" : "#2a7596"); g.addColorStop(1, o.lit ? "#236f93" : "#17506f");
    tr(c, [F(s0 + 0.03, dz0), F(s1 - 0.03, dz0), F(s1 - 0.03, dz1), F(s0 + 0.03, dz1)]); c.fillStyle = g; c.fill();
    c.strokeStyle = "rgba(20,30,40,0.5)"; c.lineWidth = 0.6; c.beginPath(); const nm = Math.max(1, Math.round((s1 - s0) / 0.14)); for (let i = 1; i < nm; i++) { const s = lerp(s0, s1, i / nm); c.moveTo(...F(s, dz0)); c.lineTo(...F(s, dz1)); } c.stroke();
    // slab (top surface + lip) at floor level z
    const a0 = F(s0 - 0.02, z), a1 = F(s1 + 0.02, z);
    tr(c, [a0, a1, ex(a1), ex(a0)]); c.fillStyle = o.slabTop || (o.lit ? "#f0d7a2" : "#d9b97c"); c.fill();
    const l0 = ex(a0), l1 = ex(a1), dl = 0.032 * CTS.S * CTS.ZS;
    tr(c, [l0, l1, [l1[0], l1[1] + dl], [l0[0], l0[1] + dl]]); c.fillStyle = o.lit ? "#c9a366" : "#a8844c"; c.fill();
    c.strokeStyle = "rgba(42,36,32,0.75)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(l0[0], l0[1] + dl); c.lineTo(l1[0], l1[1] + dl); c.stroke();
    // plant pots on some balconies
    if (R() < (o.plants ?? 0.28)) { const s = lerp(s0 + 0.06, s1 - 0.06, R()), p = ex(F(s, z + 0.02)); k._lobe(p[0] - ox * d * 0.4, p[1] - 3, 3.4, R() < 0.5 ? "#5f9a45" : "#6faa4e", Math.round(z * 100 + s * 10), { bumps: 6, lw: 0.6 }); if (R() < 0.5) { c.fillStyle = ["#e6559a", "#f07bb4", "#f4a640"][Math.floor(R() * 3)]; c.beginPath(); c.arc(p[0] - ox * d * 0.4 + 1, p[1] - 5, 1.4, 0, 6.3); c.fill(); } }
    // glass rail with top bar
    const r0 = ex(F(s0 - 0.02, z + 0.11)), r1 = ex(F(s1 + 0.02, z + 0.11));
    tr(c, [l0, l1, r1, r0]); c.fillStyle = "rgba(200,235,245,0.38)"; c.fill();
    c.strokeStyle = "#f8f4ea"; c.lineWidth = 1.1; c.beginPath(); c.moveTo(...r0); c.lineTo(...r1); c.stroke();
    c.strokeStyle = "rgba(42,36,32,0.55)"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(r0[0], r0[1] - 0.8); c.lineTo(r1[0], r1[1] - 0.8); c.stroke();
  }
}
// solid frame pier: beige with floor joints
function pierPanel(k, F, s0, s1, z0, z1, o) {
  const c = k.ctx;
  k.path([F(s0, z0), F(s1, z0), F(s1, z1), F(s0, z1)], { fill: o.wall, stroke: false, wobble: 0 });
  c.strokeStyle = "rgba(120,88,50,0.28)"; c.lineWidth = 0.6; c.beginPath();
  for (let z = z0 + o.floor; z < z1; z += o.floor) { c.moveTo(...F(s0, z)); c.lineTo(...F(s1, z)); }
  c.stroke();
  c.strokeStyle = "rgba(255,250,235,0.55)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(...F(s0 + 0.02, z0)); c.lineTo(...F(s0 + 0.02, z1)); c.stroke();
}

// one face of a tier: segs = [[f0, f1, type], ...] as fractions of the run
function face(k, t, side, u, v, du, dv, z0, z1, segs, o) {
  const run = side === "L" ? du : dv;
  const F = side === "L" ? (s, z) => P(u + s, v + dv, z) : (s, z) => P(u + du, v + s, z);
  const lit = side === "L";
  const wall = lit ? o.beige : shade(o.beige, -0.1);
  const po = { ...o, lit, wall, out: side === "L" ? off(0, 1) : off(1, 0), seed: o.seed + (lit ? 0 : 50) };
  k.path([F(0, z0), F(run, z0), F(run, z1), F(0, z1)], { fill: wall, stroke: false, wobble: 0 });
  // ground floor shopfront band handled by caller (o.base)
  const zb = z0 + (o.base ?? 0);
  for (const [f0, f1, type] of segs) {
    const s0 = f0 * run, s1 = f1 * run;
    if (type === "g") glassPanel(k, t, F, s0, s1, zb, z1 - (o.capH ?? 0.1), po);
    else if (type === "b") balcPanel(k, t, F, s0, s1, zb, z1 - (o.capH ?? 0.1), po);
    else pierPanel(k, F, s0, s1, zb, z1, po);
  }
  // shade the right face a touch, then crisp outline
  if (!lit) { k.path([F(0, z0), F(run, z0), F(run, z1), F(0, z1)], { fill: "rgba(30,40,60,0.08)", stroke: false, wobble: 0 }); k.hatch([F(0, z0), F(run, z0), F(run, z1), F(0, z1)], { gap: 9, color: "rgba(42,36,32,0.08)" }); }
  // cap band
  const ch = o.capH ?? 0.1;
  k.path([F(0, z1 - ch), F(run, z1 - ch), F(run, z1), F(0, z1)], { fill: lit ? "#f6e4bd" : "#d9bd8c", lw: 0.9, wobble: 0 });
  k.path([F(0, z0), F(run, z0), F(run, z1), F(0, z1)], { lw: 1.5, wobble: 0 });
  return F;
}

// ---------- a balconied tower made of stacked tiers ----------
// spec: { u, v, du, dv, seed, beige, floor, tiers: [{ h, ins:[iu0,iv0,iu1,iv1], L:segs, R:segs, roof }], crown(k,t,top) }
export function makeTower(spec) {
  const o0 = { floor: 0.26, beige: BEIGE, ...spec };
  // resolve tier boxes
  let z = o0.z0 ?? 0;
  const boxes = o0.tiers.map((ti) => { const [a, b, c2, d] = ti.ins || [0, 0, 0, 0]; const bx = { u: o0.u + a, v: o0.v + b, du: o0.du - a - c2, dv: o0.dv - b - d, z0: z, z1: z + ti.h, ti }; z += ti.h; return bx; });
  const top = boxes[boxes.length - 1];
  function shadow(k, len = 3.2) {
    const { u, v, du, dv } = o0, H = top.z1 * 0.5;
    k.shadow([[u + du, v, 0], [u + du + H * 0.45, v + H * 0.12, 0], [u + du + H * 0.45, v + dv + H * 0.12, 0], [u + du, v + dv, 0]], 0.1);
  }
  function draw(k, t) {
    const c = k.ctx;
    boxes.forEach((b, i) => {
      const ti = b.ti, o = { ...o0, ...ti, seed: o0.seed * 10 + i, base: i === 0 ? (o0.base ?? 0) : 0 };
      face(k, t, "L", b.u, b.v, b.du, b.dv, b.z0, b.z1, ti.L, o);
      face(k, t, "R", b.u, b.v, b.du, b.dv, b.z0, b.z1, ti.R, o);
      // roof slab + parapet
      const r = [[b.u, b.v, b.z1], [b.u + b.du, b.v, b.z1], [b.u + b.du, b.v + b.dv, b.z1], [b.u, b.v + b.dv, b.z1]];
      k.poly(r, ti.roofCol || "#e9dcc2", { lw: 1.3, wobble: 0 });
      const ins = 0.06, ri = [[b.u + ins, b.v + ins, b.z1], [b.u + b.du - ins, b.v + ins, b.z1], [b.u + b.du - ins, b.v + b.dv - ins, b.z1], [b.u + ins, b.v + b.dv - ins, b.z1]];
      k.poly(ri, ti.roofCol ? shade(ti.roofCol, -0.06) : "#d9cbb0", { lw: 0.7, wobble: 0 });
      if (ti.roof) ti.roof(k, t, b);
    });
    if (o0.crown) o0.crown(k, t, top, boxes);
  }
  return { draw, shadow, boxes, top, spec: o0 };
}

// ---------- crown pieces ----------
// open arc fin rising from a roof edge: post at s0 up to zb+h, then a quarter curve down to s1 at zb (in face plane F)
export function arcFin(k, F, s0, s1, zb, h, w, o = {}) {
  const c = k.ctx, N = 22, outer = [], inner = [];
  outer.push(F(s0, zb)); inner.push(F(s0 + w, zb));
  for (let i = 0; i <= N; i++) { const th = (i / N) * Math.PI / 2; outer.push(F(s0 + (s1 - s0) * Math.sin(th), zb + h * Math.cos(th))); }
  for (let i = 0; i <= N; i++) { const th = (i / N) * Math.PI / 2; inner.push(F(s0 + w + (s1 - s0 - w * 1.2) * Math.sin(th), zb + (h - w * 1.3) * Math.cos(th))); }
  const poly = [...outer, ...[...inner].reverse()];
  // depth: extrude toward the back by o.depth (screen offset)
  if (o.depth) { const [dx, dy] = o.depth; tr(c, [...outer.map((p) => [p[0] + dx, p[1] + dy]), ...[...outer].reverse()]); c.fillStyle = o.side || "#d8bd8f"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke(); }
  tr(c, poly); c.fillStyle = o.col || "#f2dfb6"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.lineJoin = "round"; c.stroke();
  c.strokeStyle = "rgba(255,255,255,0.6)"; c.lineWidth = 1; c.beginPath(); outer.slice(2).forEach((p, i) => (i ? c.lineTo(p[0] + 1.5, p[1] + 1.5) : c.moveTo(p[0] + 1.5, p[1] + 1.5))); c.stroke();
}
// glass "sail": the top storeys of a face curve down from s0 (high) to s1, extruded back by depth vector [du,dv]
export function sail(k, t, F, s0, s1, zb, h, dvec, o = {}) {
  const c = k.ctx, N = 22, front = [];
  for (let i = 0; i <= N; i++) { const th = (i / N) * Math.PI / 2; front.push(F(s0 + (s1 - s0) * Math.sin(th), zb + h * Math.cos(th))); }
  const [dx, dy] = off(...dvec);
  // curved roof ribbon (visible from above)
  tr(c, [...front, ...[...front].reverse().map((p) => [p[0] + dx, p[1] + dy])]);
  const g = c.createLinearGradient(front[0][0], front[0][1], front[N][0], front[N][1]); g.addColorStop(0, "#bfe6f2"); g.addColorStop(1, "#5aa9cf");
  c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
  c.strokeStyle = "rgba(20,60,90,0.35)"; c.lineWidth = 0.7; c.beginPath(); for (let i = 2; i < N; i += 2) { c.moveTo(...front[i]); c.lineTo(front[i][0] + dx, front[i][1] + dy); } c.stroke();
  // the front face: glass under the curve
  const facePoly = [F(s0, zb), ...front, F(s1, zb)];
  tr(c, facePoly);
  const g2 = c.createLinearGradient(0, front[0][1], 0, F(s0, zb)[1]); g2.addColorStop(0, "#8fd2ec"); g2.addColorStop(1, "#2f8fc2");
  c.fillStyle = g2; c.fill();
  c.save(); tr(c, facePoly); c.clip();
  c.strokeStyle = "rgba(18,58,92,0.4)"; c.lineWidth = 0.7; c.beginPath();
  for (let s = s0 + 0.17; s < s1; s += 0.17) { c.moveTo(...F(s, zb)); c.lineTo(...F(s, zb + h)); }
  for (let z = zb + 0.26; z < zb + h; z += 0.26) { c.moveTo(...F(s0, z)); c.lineTo(...F(s1, z)); }
  c.stroke();
  glint(c, t, front[0][1] - 20, F(s0, zb)[1] + 20);
  c.restore();
  tr(c, facePoly); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke();
}
// thin spire / mast with collar rings
export function spire(k, u, v, z0, h, o = {}) {
  const c = k.ctx, [x, y0] = P(u, v, z0), [, y1] = P(u, v, z0 + h), w = o.w ?? 3.2;
  tr(c, [[x - w, y0], [x + w, y0], [x + 0.9, y1], [x - 0.9, y1]]); c.fillStyle = o.col || "#e7dccb"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
  c.strokeStyle = "rgba(90,80,70,0.5)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x + w * 0.4, y0); c.lineTo(x + 0.4, y1); c.stroke();
  for (const f of [0.18, 0.4]) { const yy = lerp(y0, y1, f), ww = lerp(w, 0.9, f) + 1.4; c.fillStyle = "#cfc4b2"; c.beginPath(); c.ellipse(x, yy, ww, ww * 0.45, 0, 0, 6.3); c.fill(); c.lineWidth = 0.8; c.strokeStyle = INK; c.stroke(); }
  // aircraft warning light blinking
  const a = (Math.sin(k.t * 3.2 + (o.ph ?? 0)) > 0.55) ? 1 : 0.25;
  c.fillStyle = `rgba(230,60,50,${a})`; c.beginPath(); c.arc(x, y1 - 1, 2, 0, 6.3); c.fill();
  if (a > 0.5) { c.fillStyle = "rgba(255,90,70,0.25)"; c.beginPath(); c.arc(x, y1 - 1, 5.5, 0, 6.3); c.fill(); }
}
// a rooftop frame (open beige box frame) around a smaller glass box
export function frameBox(k, t, u, v, du, dv, z0, h, o = {}) {
  const c = k.ctx, w = 0.08;
  const T = makeTower({ u: u + w, v: v + w, du: du - 2 * w, dv: dv - 2 * w, z0, seed: o.seed ?? 3, tiers: [{ h: h - 0.04, L: [[0, 1, "g"]], R: [[0, 1, "g"]], capH: 0.05 }] });
  T.draw(k, t);
  // posts at the visible corners + top beams
  const post = (pu, pv) => { k.box(pu - w / 2, pv - w / 2, z0, w, w, h, o.beige || BEIGE, { hatch: false, shadow: false }); };
  post(u + du, v); post(u, v + dv); post(u + du, v + dv);
  k.box(u, v + dv - w, z0 + h - w, du, w, w, o.beige || BEIGE, { hatch: false, shadow: false });
  k.box(u + du - w, v, z0 + h - w, w, dv, w, o.beige || BEIGE, { hatch: false, shadow: false });
}

// ---------- round glass drum with wrap-around balcony rings (T8) ----------
export function drum(k, t, cu, cv, r, z0, z1, o = {}) {
  const c = k.ctx, [x, yb] = P(cu, cv, z0), [, yt] = P(cu, cv, z1), fl = o.floor ?? 0.26;
  const rx = r * CTS.S * Math.SQRT2, ry = rx * CTS.YS;
  const body = () => { c.beginPath(); c.moveTo(x - rx, yt); c.lineTo(x - rx, yb); c.ellipse(x, yb, rx, ry, 0, Math.PI, 0, true); c.lineTo(x + rx, yt); c.closePath(); };
  body();
  const g = c.createLinearGradient(x - rx, 0, x + rx, 0);
  g.addColorStop(0, "#a5def0"); g.addColorStop(0.28, "#55b4dc"); g.addColorStop(0.65, "#2b86ba"); g.addColorStop(1, "#1a557f");
  c.fillStyle = g; c.fill();
  c.save(); body(); c.clip();
  // mullions follow the curve (vertical lines spaced by angle)
  c.strokeStyle = "rgba(15,50,80,0.42)"; c.lineWidth = 0.75; c.beginPath();
  for (let i = 1; i < 16; i++) { const a = Math.PI * (i / 16), xx = x - Math.cos(a) * rx; c.moveTo(xx, yt); c.lineTo(xx, yb + Math.sin(a) * ry); }
  c.stroke();
  glint(c, t, yt - 30, yb + 30);
  c.restore();
  // balcony rings on the left (lit) portion: arcs from angle a0..a1 (0 = left edge, PI = right edge)
  const a0 = o.ring0 ?? 0, a1 = o.ring1 ?? Math.PI * 0.55, R2 = r + 0.12;
  const rx2 = R2 * CTS.S * Math.SQRT2, ry2 = rx2 * CTS.YS;
  const R = rng(o.seed ?? 5);
  for (let z = z0 + fl; z < z1 - 0.15; z += fl) {
    const [, y] = P(cu, cv, z);
    const arcPts = (RX, RY, yy, n = 16) => { const out = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); out.push([x - Math.cos(a) * RX, yy + Math.sin(a) * RY]); } return out; };
    const outer = arcPts(rx2, ry2, y), inner = arcPts(rx, ry, y), dl = 0.05 * CTS.S * CTS.ZS;
    tr(c, [...outer, ...[...inner].reverse()]); c.fillStyle = "#f6e6c4"; c.fill();
    tr(c, [...outer, ...[...outer].reverse().map((p) => [p[0], p[1] + dl])]); c.fillStyle = "#dcc08e"; c.fill();
    c.strokeStyle = "rgba(42,36,32,0.7)"; c.lineWidth = 0.8; c.beginPath(); outer.forEach((p, i) => (i ? c.lineTo(p[0], p[1] + dl) : c.moveTo(p[0], p[1] + dl))); c.stroke();
    const rail = arcPts(rx2, ry2, y - 0.11 * CTS.S * CTS.ZS);
    tr(c, [...outer, ...[...rail].reverse()]); c.fillStyle = "rgba(205,238,248,0.35)"; c.fill();
    c.strokeStyle = "#faf6ec"; c.lineWidth = 1.1; c.beginPath(); rail.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.stroke();
    if (R() < 0.3) { const p = outer[Math.floor(R() * 12) + 2]; k._lobe(p[0] + 2, p[1] - 3, 3.2, "#5f9a45", Math.round(z * 77), { bumps: 6, lw: 0.6 }); }
  }
  // twinkles
  for (let i = 0; i < 10; i++) { const a = R() * Math.PI, zz = lerp(z0, z1, R()), ph = R() * 6.28, b = Math.pow(Math.max(0, Math.sin(t * 1.3 + ph)), 6); if (b > 0.05) { const [, y] = P(cu, cv, zz); c.fillStyle = `rgba(255,255,255,${b * 0.8})`; c.fillRect(x - Math.cos(a) * rx * 0.9 - 2, y + Math.sin(a) * ry - 3, 4, 3); } }
  star(c, x - rx * 0.45, lerp(yt, yb, 0.3), 7, Math.pow(Math.max(0, Math.sin(t * 0.8 + 1.3)), 14));
  body(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
  // roof disc + parapet
  c.beginPath(); c.ellipse(x, yt, rx, ry, 0, 0, 6.3); c.fillStyle = "#e9dcc2"; c.fill(); c.stroke();
  c.beginPath(); c.ellipse(x, yt, rx * 0.86, ry * 0.86, 0, 0, 6.3); c.fillStyle = "#d9cbb0"; c.fill(); c.lineWidth = 0.7; c.stroke();
}

// ---------- the Cayan Tower: square plan twisting 90 degrees over its height ----------
export function makeCayan(cu, cv, half, h, o = {}) {
  const N = o.levels ?? 46, th0 = o.th0 ?? 0.12, tw = o.twist ?? Math.PI / 2;
  const corner = (j, z) => { const th = th0 + tw * (z / h) + Math.PI / 4 + (j * Math.PI) / 2, rr = half * Math.SQRT2; return [cu + Math.cos(th) * rr, cv + Math.sin(th) * rr]; };
  function shadow(k) { k.shadow([[cu + half, cv - half, 0], [cu + half + h * 0.22, cv - half + h * 0.06, 0], [cu + half + h * 0.22, cv + half + h * 0.06, 0], [cu + half, cv + half, 0]], 0.1); }
  function draw(k, t) {
    const c = k.ctx, z0 = o.z0 ?? 0, dz = (h - z0) / N;
    const M = 8; // mullions per side
    // per side: collect visible band quads
    for (let j = 0; j < 4; j++) {
      for (let i = 0; i < N; i++) {
        const za = z0 + i * dz, zb = za + dz;
        const a0 = corner(j, za), a1 = corner(j + 1, za), b0 = corner(j, zb), b1 = corner(j + 1, zb);
        const mid = th0 + tw * ((za + zb) / 2 / h) + Math.PI / 2 + (j * Math.PI) / 2, nu = Math.cos(mid), nv = Math.sin(mid);
        if (nu + nv <= 0.02) continue;
        const q = [P(a0[0], a0[1], za), P(a1[0], a1[1], za), P(b1[0], b1[1], zb), P(b0[0], b0[1], zb)];
        // facing light from the left-front: more +v -> lighter
        const lightF = clamp(0.5 + 0.5 * (nv - nu) / 1.414);
        const glass = mixHex("#3d6a88", "#86abbe", lightF), frame = mixHex("#cdb892", "#f3e6c6", lightF);
        tr(c, q); c.fillStyle = frame; c.fill();
        // window panes inside the lattice
        for (let m = 0; m < M; m++) {
          const f0 = (m + 0.2) / M, f1 = (m + 0.8) / M, lerp2 = (p, q2, f) => [lerp(p[0], q2[0], f), lerp(p[1], q2[1], f)];
          const pa = lerp2(a0, a1, f0), pb = lerp2(a0, a1, f1), pc = lerp2(b0, b1, f1), pd = lerp2(b0, b1, f0);
          const zl = za + dz * 0.26, zh = zb - dz * 0.2;
          tr(c, [P(pa[0], pa[1], zl), P(pb[0], pb[1], zl), P(pc[0], pc[1], zh), P(pd[0], pd[1], zh)]);
          c.fillStyle = glass; c.fill();
        }
        // occasional twinkle
        const hsh = hash(i * 13 + j * 7);
        if (hsh < 0.12) { const a = Math.pow(Math.max(0, Math.sin(t * 1.4 + hsh * 60)), 8); if (a > 0.05) { const m = Math.floor(hash(i + j * 3) * M), p = P(lerp(a0[0], a1[0], (m + 0.5) / M), lerp(a0[1], a1[1], (m + 0.5) / M), za + dz * 0.5); c.fillStyle = `rgba(255,255,255,${a * 0.85})`; c.fillRect(p[0] - 2, p[1] - 1.5, 4, 3); } }
      }
    }
    // sweeping glint clipped to the visible silhouette (approx: union of side quads re-traced)
    c.save(); c.beginPath();
    for (let j = 0; j < 4; j++) for (let i = 0; i < N; i++) { const za = z0 + i * dz, zb = za + dz, mid = th0 + tw * ((za + zb) / 2 / h) + Math.PI / 2 + (j * Math.PI) / 2; if (Math.cos(mid) + Math.sin(mid) <= 0.02) continue; const a0 = corner(j, za), a1 = corner(j + 1, za), b0 = corner(j, zb), b1 = corner(j + 1, zb); const q = [P(a0[0], a0[1], za), P(a1[0], a1[1], za), P(b1[0], b1[1], zb), P(b0[0], b0[1], zb)]; q.forEach((p, n) => (n ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); }
    c.clip(); glint(c, t, P(cu, cv, h)[1] - 40, P(cu, cv, z0)[1] + 40); c.restore();
    // corner edges (the spiralling white fins) where at least one adjacent side is visible
    for (let j = 0; j < 4; j++) {
      const pts = [];
      for (let i = 0; i <= N; i++) {
        const z = z0 + i * dz, mA = th0 + tw * (z / h) + Math.PI / 2 + (j * Math.PI) / 2, mB = mA - Math.PI / 2;
        const vis = Math.cos(mA) + Math.sin(mA) > 0.02 || Math.cos(mB) + Math.sin(mB) > 0.02;
        const p = corner(j, z);
        if (vis) pts.push(P(p[0], p[1], z)); else if (pts.length) { strokeEdge(c, pts); pts.length = 0; }
      }
      if (pts.length) strokeEdge(c, pts);
    }
    // floor bands every 4 levels (the lattice's horizontal emphasis)
    // roof: square at the top, parapet + mechanical penthouse
    const top = [0, 1, 2, 3].map((j) => corner(j, h));
    k.poly(top.map(([u, v]) => [u, v, h]), "#e8ebea", { lw: 1.4, wobble: 0 });
    k.poly(top.map(([u, v]) => [lerp(u, cu, 0.15), lerp(v, cv, 0.15), h]), "#cfd5d6", { lw: 0.7, wobble: 0 });
    // lattice crown: thin posts sticking above the roof at each corner
    for (const [u, v] of top) { const [x, y] = P(u, v, h), [, y2] = P(u, v, h + 0.2); c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y2); c.stroke(); c.strokeStyle = "#f4f4ef"; c.lineWidth = 1.2; c.stroke(); }
    k.box(cu - 0.18, cv - 0.15, h, 0.36, 0.3, 0.16, "#d5dadb", { hatch: false, shadow: false });
  }
  return { draw, shadow, corner };
}
function strokeEdge(c, pts) {
  c.lineJoin = "round"; c.lineCap = "round";
  c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.strokeStyle = INK; c.lineWidth = 3.4; c.stroke();
  c.strokeStyle = "#f7f6f1"; c.lineWidth = 1.5; c.stroke();
}
function mixHex(a, b, f) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return "#" + pa.map((x, i) => Math.round(lerp(x, pb[i], f)).toString(16).padStart(2, "0")).join("");
}

// ---------- window-cleaning cradle (BMU) sliding down a face and back up ----------
export function cradle(k, t, F, s, zTop, zBot, o = {}) {
  const c = k.ctx, per = o.per ?? 26, ph = ((t + (o.ph ?? 0)) % per) / per;
  const f = ph < 0.5 ? ph * 2 : 2 - ph * 2, ease = f * f * (3 - 2 * f);
  const z = lerp(zTop - 0.25, zBot, ease), [ox, oy] = o.out;
  const p0 = F(s - 0.25, z), p1 = F(s + 0.25, z), e = (p, d) => [p[0] + ox * d, p[1] + oy * d];
  // cables from the roof davit
  const a0 = e(F(s - 0.22, zTop + 0.12), 0.14), a1 = e(F(s + 0.22, zTop + 0.12), 0.14);
  c.strokeStyle = "rgba(42,36,32,0.8)"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(...a0); c.lineTo(...e(F(s - 0.22, z + 0.1), 0.14)); c.moveTo(...a1); c.lineTo(...e(F(s + 0.22, z + 0.1), 0.14)); c.stroke();
  // davit arm on the roof
  c.strokeStyle = INK; c.lineWidth = 2.2; c.beginPath(); c.moveTo(...F(s - 0.22, zTop)); c.lineTo(...a0); c.lineTo(...a1); c.lineTo(...F(s + 0.22, zTop)); c.stroke();
  // two workers (heads + torsos) behind the cradle rail
  for (const [fs, col] of [[-0.1, "#e88c3d"], [0.12, "#e9c24d"]]) {
    const [x, y] = e(F(s + fs, z + 0.02), 0.12), wipe = Math.sin(t * 5 + fs * 10) * 2.5;
    c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.roundRect(x - 2, y - 9, 4, 6, 1.2); c.fill(); c.stroke();
    c.fillStyle = "#c99a74"; c.beginPath(); c.arc(x, y - 10.5, 1.8, 0, 6.3); c.fill(); c.stroke();
    c.fillStyle = "#f4f0e6"; c.beginPath(); c.arc(x, y - 11.6, 1.6, Math.PI, 0); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 1.5, y - 7); c.lineTo(x + 1.5 + ox * 0.0 - 3 + wipe, y - 12); c.stroke();
  }
  // the cradle box
  const b = [e(p0, 0.08), e(p1, 0.08), e(p1, 0.22), e(p0, 0.22)], hgt = 0.12 * CTS.S * CTS.ZS;
  tr(c, [b[3], b[2], [b[2][0], b[2][1] - hgt], [b[3][0], b[3][1] - hgt]]); c.fillStyle = "#d9d4c8"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  c.strokeStyle = "rgba(42,36,32,0.6)"; c.lineWidth = 0.6; c.beginPath(); for (let i = 1; i < 5; i++) { const q = [lerp(b[3][0], b[2][0], i / 5), lerp(b[3][1], b[2][1], i / 5)]; c.moveTo(...q); c.lineTo(q[0], q[1] - hgt); } c.stroke();
}
