// LONDON shared props: oriented boxes, double-decker bus, black cab, boats, swans, guards, gothic bits.
import { P, CTS, INK, shade, lerp, clamp, rng, smooth, walkState, spline } from "../../lib/vec-kit.js";

export const STONE = "#dcb878", GOLD = "#e2bd55", SLATE = "#59627a", BUS_RED = "#c8362f";

// ---------- oriented box in (u,v) with heading ang (radians, 0 = +u) ----------
// returns { fpt(face,s,z), faces } so callers can paint windows on the visible long faces
export function obox(k, u, v, ang, L, W, z0, h, col, o = {}) {
  const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
  const C = (a, b) => [u + dx * a * L / 2 + nx * b * W / 2, v + dy * a * L / 2 + ny * b * W / 2];
  const cs = [C(-1, -1), C(1, -1), C(1, 1), C(-1, 1)];
  const outs = [[-nx, -ny], [dx, dy], [nx, ny], [-dx, -dy]];
  const faces = [];
  for (let i = 0; i < 4; i++) {
    const [nu, nv] = outs[i];
    if (nu + nv <= 0.02) continue;
    const A = cs[i], B = cs[(i + 1) % 4];
    const frac = clamp(nu / (nu + nv + 1e-6));
    const fc = o.faceCols ? o.faceCols[i] : shade(col, -0.07 - 0.13 * frac);
    const f = { i, A, B, long: i % 2 === 0, nu, nv, col: fc };
    f.pt = (s, z) => P(lerp(A[0], B[0], s), lerp(A[1], B[1], s), z0 + z);
    faces.push(f);
  }
  for (const f of faces) k.path([f.pt(0, 0), f.pt(1, 0), f.pt(1, h), f.pt(0, h)], { fill: f.col, lw: o.lw ?? 1.3, wobble: 0 });
  if (o.top !== false) k.path(cs.map(([a, b]) => P(a, b, z0 + h)), { fill: o.topCol || shade(col, 0.07), lw: o.lw ?? 1.3, wobble: 0 });
  return { faces, cs, top: (a, b, z) => { const [pa, pb] = C(a, b); return P(pa, pb, z0 + z); } };
}
// a quad on a face in (s0..s1, z0..z1)
export function fquad(k, f, s0, s1, za, zb, col, o = {}) {
  k.path([f.pt(s0, za), f.pt(s1, za), f.pt(s1, zb), f.pt(s0, zb)], { fill: col, lw: o.lw ?? 0.9, wobble: 0, stroke: o.stroke });
}
export function wheel(k, x, y, r = 4.6) {
  const c = k.ctx;
  c.beginPath(); c.arc(x, y, r, 0, 7); c.fillStyle = "#1e1b19"; c.fill();
  c.beginPath(); c.arc(x, y, r * 0.45, 0, 7); c.fillStyle = "#9a948c"; c.fill();
}
export function ruv(k, u, v) { return u + v; }
// pose along a looped / ping-pong route: { u, v, ang, moving }
export function drive(path, t, o = {}) {
  const s = walkState(path, t, { loop: o.loop ?? false, speed: o.speed ?? 1.2, offset: o.offset ?? 0, dwell: o.dwell ?? 1.5 });
  return { u: s.u, v: s.v, ang: Math.atan2(s.dv, s.du), moving: s.moving, p: s.p };
}

// ---------- red double-decker (Routemaster) ----------
export function bus(k, u, v, ang, o = {}) {
  const L = o.len ?? 2.1, W = 0.82, H = 2.0, c = k.ctx;
  k.shadow([[u - 1, v - 0.5, 0], [u + 1.1, v - 0.5, 0], [u + 1.2, v + 0.6, 0], [u - 0.9, v + 0.6, 0]], 0.0);
  const [sx, sy] = P(u, v, 0);
  c.fillStyle = "rgba(60,45,30,0.16)"; c.beginPath(); c.ellipse(sx + 6, sy + 3, L * 26, L * 12, 0, 0, 7); c.fill();
  const b = obox(k, u, v, ang, L, W, 0.18, H - 0.18, BUS_RED, { top: false });
  for (const f of b.faces) {
    if (f.long) {
      fquad(k, f, 0, 1, 0, 0.3, "#8f2520", { stroke: false });        // skirt
      fquad(k, f, 0.0, 1, 0.98, 1.1, "#f1ead8", { lw: 0.6 });           // cream band
      fquad(k, f, 0.0, 1, 1.68, 1.78, "#f1ead8", { lw: 0.6 });
      const n = 7;
      for (let r = 0; r < 2; r++) for (let i = 0; i < n; i++) {
        const s0 = 0.12 + i * (0.8 / n), s1 = s0 + 0.8 / n * 0.78, za = r ? 1.14 : 0.42, zb = r ? 1.6 : 0.92;
        fquad(k, f, s0, s1, r ? za + 0.02 : za + 0.06, r ? zb : zb - 0.04, "#cfe3ee", { lw: 0.8 });
        const [mx, my] = f.pt((s0 + s1) / 2, r ? 1.4 : 0.7); c.fillStyle = "rgba(255,255,255,0.4)"; c.fillRect(mx - 1, my - 3, 1.6, 4);
      }
      // ad board between decks + destination
      fquad(k, f, 0.2, 0.7, 0.3, 0.4, "#f4ecd2", { lw: 0.6 });
      const [tx, ty] = f.pt(0.07, 1.95 - 0.08); c.fillStyle = "#1c1a18"; c.font = "bold 5px sans-serif"; c.textAlign = "left";
    } else {
      fquad(k, f, 0, 1, 0, 0.3, "#8f2520", { stroke: false });
      fquad(k, f, 0.1, 0.9, 1.14, 1.6, "#cfe3ee", { lw: 0.8 });
      fquad(k, f, 0.1, 0.9, 0.42, 0.92, "#bcd6e4", { lw: 0.8 });
      fquad(k, f, 0.2, 0.8, 1.62, 1.74, "#fff3c4", { lw: 0.6 });
      fquad(k, f, 0.35, 0.65, 0.12, 0.34, "#3a3430", { lw: 0.6 });
    }
    const wz = 0.2;
    if (f.long) { for (const s of [0.18, 0.8]) { const [x, y] = f.pt(s, 0.0); wheel(k, x, y - 3, 5); } }
  }
  // curved roof cap
  const t0 = b.top(-1, -1, H - 0.18), t1 = b.top(1, -1, H - 0.18), t2 = b.top(1, 1, H - 0.18), t3 = b.top(-1, 1, H - 0.18);
  k.path([t0, t1, t2, t3], { fill: "#d4463d", lw: 1.3, wobble: 0 });
  const mid = (a, bb) => [(a[0] + bb[0]) / 2, (a[1] + bb[1]) / 2];
  k.line([mid(t0, t3), mid(t1, t2)], { lw: 0.8, wobble: 0, stroke: "#8f2520" });
  return b;
}

// ---------- London black cab ----------
export function cab(k, u, v, ang, o = {}) {
  const L = 1.05, W = 0.5, c = k.ctx;
  const [sx, sy] = P(u, v, 0);
  c.fillStyle = "rgba(60,45,30,0.16)"; c.beginPath(); c.ellipse(sx + 3, sy + 2, 20, 8, 0, 0, 7); c.fill();
  const b = obox(k, u, v, ang, L, W, 0.12, 0.34, "#26262a", { top: false, lw: 1.1 });
  for (const f of b.faces) if (f.long) { for (const s of [0.2, 0.8]) { const [x, y] = f.pt(s, 0); wheel(k, x, y - 2, 3.6); } }
  const cb = obox(k, u - Math.cos(ang) * 0.06, v - Math.sin(ang) * 0.06, ang, L * 0.55, W * 0.88, 0.46, 0.3, "#26262a", { top: true, lw: 1.1 });
  for (const f of cb.faces) { if (f.long) fquad(k, f, 0.08, 0.92, 0.06, 0.26, "#bcd3dd", { lw: 0.7 }); else fquad(k, f, 0.12, 0.88, 0.06, 0.26, "#bcd3dd", { lw: 0.7 }); }
  const [lx, ly] = P(u - Math.cos(ang) * 0.05, v - Math.sin(ang) * 0.05, 0.84);
  c.fillStyle = "#ffe9a0"; c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.roundRect(lx - 4, ly - 2.5, 8, 4, 1); c.fill(); c.stroke();
  return b;
}

// ---------- boats ----------
// generic hull with cabin; spec { L, W, hull, cabin, roof, cabinH }
export function boat(k, u, v, ang, o = {}) {
  const L = o.L ?? 1.6, W = o.W ?? 0.5, c = k.ctx;
  const [sx, sy] = P(u, v, 0);
  c.fillStyle = "rgba(255,255,255,0.55)";
  c.beginPath(); c.ellipse(sx, sy + 2, L * 28 + 4, L * 11 + 3, 0, 0, 7); c.fill();
  const b = obox(k, u, v, ang, L, W, -0.02, o.hh ?? 0.26, o.hull || "#3f5f7a", { lw: 1.1 });
  if (o.cabin !== false) {
    const cb = obox(k, u - Math.cos(ang) * L * 0.08, v - Math.sin(ang) * L * 0.08, ang, L * (o.cabinL ?? 0.55), W * 0.8, 0.24, o.cabinH ?? 0.34, o.cabin || "#f1ead8", { lw: 1.0, topCol: o.roof || "#c8362f" });
    for (const f of cb.faces) if (f.long) { const n = o.windows ?? 4; for (let i = 0; i < n; i++) fquad(k, f, 0.08 + i * 0.9 / n, 0.08 + i * 0.9 / n + 0.9 / n * 0.7, 0.1, 0.26, "#a9c6d4", { lw: 0.6 }); }
  }
  return b;
}
export function wake(k, u, v, ang, len = 1.4, a = 0.5) {
  const c = k.ctx, dx = Math.cos(ang), dy = Math.sin(ang);
  c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = 1.6; c.lineCap = "round";
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(...P(u - dx * 0.5, v - dy * 0.5, 0)); c.lineTo(...P(u - dx * (0.5 + len) - dy * s * 0.45, v - dy * (0.5 + len) + dx * s * 0.45, 0)); c.stroke(); }
}

// ---------- animals ----------
export function swan(k, u, v, o = {}) {
  const c = k.ctx, t = k.t, [x, y] = P(u, v, 0), f = o.face ?? 1, ph = o.phase ?? 0;
  c.fillStyle = "rgba(255,255,255,0.5)"; c.beginPath(); c.ellipse(x, y + 2, 13, 4.2, 0, 0, 7); c.fill();
  c.fillStyle = "#fbfaf5"; c.strokeStyle = INK; c.lineWidth = 1.1;
  c.beginPath(); c.ellipse(x, y - 2, 8.5, 4.4, 0, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(x - f * 5, y - 3); c.quadraticCurveTo(x - f * 9, y - 8, x - f * 7, y - 9); c.quadraticCurveTo(x - f * 4, y - 6, x - f * 5, y - 4); c.fill(); // tail
  const bob = Math.sin(t * 1.6 + ph) * 0.8;
  c.lineWidth = 3.4; c.strokeStyle = INK; c.beginPath(); c.moveTo(x + f * 5, y - 3); c.quadraticCurveTo(x + f * 10, y - 8, x + f * 6, y - 14 + bob); c.stroke();
  c.lineWidth = 1.8; c.strokeStyle = "#fbfaf5"; c.stroke();
  c.beginPath(); c.arc(x + f * 6.4, y - 15 + bob, 2.4, 0, 7); c.fillStyle = "#fbfaf5"; c.fill(); c.lineWidth = 0.9; c.strokeStyle = INK; c.stroke();
  c.fillStyle = "#e9873b"; c.beginPath(); c.moveTo(x + f * 8.4, y - 15.5 + bob); c.lineTo(x + f * 11.6, y - 14.6 + bob); c.lineTo(x + f * 8.4, y - 13.8 + bob); c.fill();
}
export function pigeon(k, u, v, o = {}) {
  const c = k.ctx, [x, y] = P(u, v, 0), t = k.t, ph = o.phase ?? 0, peck = Math.max(0, Math.sin(t * 5 + ph)) * 2;
  c.fillStyle = "#8f9aa6"; c.strokeStyle = INK; c.lineWidth = 0.9;
  c.beginPath(); c.ellipse(x, y - 3, 4, 2.4, 0, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.arc(x + 3.6, y - 5 + peck, 1.7, 0, 7); c.fill(); c.stroke();
  c.strokeStyle = "#c46b6b"; c.beginPath(); c.moveTo(x - 1, y - 1); c.lineTo(x - 1, y + 0.5); c.moveTo(x + 1, y - 1); c.lineTo(x + 1, y + 0.5); c.stroke();
}

// ---------- street furniture ----------
export function phoneBox(k, u, v) {
  const c = k.ctx, R = "#c8362f";
  k.shadow([[u + 0.5, v, 0], [u + 0.9, v + 0.1, 0], [u + 0.9, v + 0.6, 0], [u + 0.5, v + 0.5, 0]], 0.12);
  const b = obox(k, u + 0.25, v + 0.25, 0, 0.5, 0.5, 0, 1.15, R, { top: false, lw: 1.2 });
  for (const f of b.faces) {
    // glazing panes 3x8 (3 cols x 6 rows) + door frame
    for (let r = 0; r < 6; r++) for (let i = 0; i < 3; i++) fquad(k, f, 0.13 + i * 0.25, 0.13 + i * 0.25 + 0.2, 0.26 + r * 0.14, 0.26 + r * 0.14 + 0.115, "#f3e4a8", { lw: 0.5 });
    fquad(k, f, 0.0, 1, 1.1, 1.15, "#f1ead8", { lw: 0.5 });
  }
  const t0 = b.top(-1, -1, 1.15), t1 = b.top(1, -1, 1.15), t2 = b.top(1, 1, 1.15), t3 = b.top(-1, 1, 1.15), t = [(t0[0] + t2[0]) / 2, (t0[1] + t2[1]) / 2 - 3];
  k.path([t0, t1, t2, t3], { fill: R, lw: 1.2, wobble: 0 });
  k.path([t0, t1, t2, t3].map(([a, b2]) => [t[0] + (a - t[0]) * 0.8, t[1] + (b2 - t[1]) * 0.8 - 2]), { fill: shade(R, 0.1), lw: 1, wobble: 0 });
}
export function pillarBox(k, u, v) {
  const [x, y] = P(u, v, 0), c = k.ctx;
  k.ell(u + 0.1, v + 0.05, 0, 0.2, "rgba(60,45,30,0.15)", { stroke: false });
  k.cyl(u, v, 0, 0.16, 0.58, "#c8362f");
  k.cyl(u, v, 0.58, 0.19, 0.06, "#2a2420");
  c.fillStyle = "#1c1a18"; const [sx, sy] = P(u, v + 0.14, 0.34); c.fillRect(sx - 4, sy - 1, 8, 1.6);
}
// Union flag (waving), pole at (u,v,z)
export function unionFlag(k, u, v, z, o = {}) {
  const t = k.t, c = k.ctx, [x, y] = P(u, v, z), [, yt] = P(u, v, z + (o.h ?? 1.6));
  const w = (o.w ?? 0.95) * CTS.S, fh = (o.fh ?? 0.55) * CTS.S;
  c.strokeStyle = INK; c.lineWidth = 2.2; c.lineCap = "round"; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt - 3); c.stroke();
  const wave = (s) => Math.sin(t * 5 - s * 4) * 3.2 * s;
  c.save();
  c.beginPath();
  const top = [], bot = [];
  for (let i = 0; i <= 10; i++) { const s = i / 10; top.push([x + s * w, yt + wave(s)]); bot.push([x + s * w, yt + fh + wave(s)]); }
  [...top, ...bot.reverse()].forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath();
  c.clip();
  c.fillStyle = "#23407c"; c.fillRect(x, yt - 6, w + 2, fh + 14);
  const X = (s, d) => [x + s * w, yt + d * fh + wave(s)];
  c.strokeStyle = "#f5f2ea"; c.lineWidth = fh * 0.3; c.beginPath(); c.moveTo(...X(0, 0)); c.lineTo(...X(1, 1)); c.moveTo(...X(0, 1)); c.lineTo(...X(1, 0)); c.stroke();
  c.strokeStyle = "#cf2a33"; c.lineWidth = fh * 0.1; c.beginPath(); c.moveTo(...X(0, 0)); c.lineTo(...X(1, 1)); c.moveTo(...X(0, 1)); c.lineTo(...X(1, 0)); c.stroke();
  c.strokeStyle = "#f5f2ea"; c.lineWidth = fh * 0.38; c.beginPath(); c.moveTo(...X(0, 0.5)); c.lineTo(...X(1, 0.5)); c.moveTo(...X(0.5, 0)); c.lineTo(...X(0.5, 1)); c.stroke();
  c.strokeStyle = "#cf2a33"; c.lineWidth = fh * 0.22; c.beginPath(); c.moveTo(...X(0, 0.5)); c.lineTo(...X(1, 0.5)); c.moveTo(...X(0.5, 0)); c.lineTo(...X(0.5, 1)); c.stroke();
  c.restore();
  c.beginPath(); [...top, ...bot.reverse()].forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
}

// ---------- gothic bits in screen space ----------
export function lancet(c, x, y, w, h, glass = "#52667f", lw = 0.9) {
  // y = bottom; pointed arch window
  c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x - w / 2, y - h * 0.72); c.quadraticCurveTo(x - w / 2, y - h * 0.9, x, y - h); c.quadraticCurveTo(x + w / 2, y - h * 0.9, x + w / 2, y - h * 0.72); c.lineTo(x + w / 2, y); c.closePath();
  c.fillStyle = glass; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
  c.strokeStyle = "rgba(240,225,180,0.65)"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h * 0.82); c.stroke();
}
// slim pinnacle: square shaft + spire + gold ball. col = stone
export function pinnacle(c, x, y, h, w, col = STONE, o = {}) {
  const sh = h * 0.58;
  c.lineJoin = "round";
  c.fillStyle = shade(col, 0.04); c.beginPath(); c.rect(x - w / 2, y - sh, w / 2, sh); c.fill();
  c.fillStyle = shade(col, -0.18); c.beginPath(); c.rect(x, y - sh, w / 2, sh); c.fill();
  c.strokeStyle = INK; c.lineWidth = 0.9; c.strokeRect(x - w / 2, y - sh, w, sh);
  // spire
  c.fillStyle = shade(col, 0.02); c.beginPath(); c.moveTo(x - w * 0.6, y - sh); c.lineTo(x, y - h); c.lineTo(x, y - sh); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = shade(col, -0.2); c.beginPath(); c.moveTo(x + w * 0.6, y - sh); c.lineTo(x, y - h); c.lineTo(x, y - sh); c.closePath(); c.fill(); c.stroke();
  // crockets
  c.fillStyle = shade(col, -0.05);
  for (let i = 1; i < 4; i++) { const yy = y - sh - (h - sh) * i * 0.22; c.fillRect(x - w * 0.62 + i * 0.4, yy, 1.5, 1.5); c.fillRect(x + w * 0.62 - 1.5 - i * 0.4, yy, 1.5, 1.5); }
  if (o.window !== false && w > 7) { c.fillStyle = "#4b5970"; c.beginPath(); c.rect(x - w * 0.18, y - sh * 0.75, w * 0.36, sh * 0.4); c.fill(); }
  c.fillStyle = GOLD; c.beginPath(); c.arc(x, y - h - 1, 1.6, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.6; c.stroke();
}

// route helpers: pick the longest stretch of a polyline outside keep-out circles [[u,v,r],...]
export function keepOut(path, zones) {
  const ok = (p) => zones.every(([u, v, r]) => Math.hypot(p[0] - u, p[1] - v) > r);
  let best = [], cur = [];
  for (const p of path) { if (ok(p)) cur.push(p); else { if (cur.length > best.length) best = cur; cur = []; } }
  if (cur.length > best.length) best = cur;
  return best.length >= 2 ? best : path;
}
// densify a polyline so keepOut can trim it
export function dense(path, step = 0.15) {
  const out = [path[0]];
  for (let i = 1; i < path.length; i++) {
    const [a, b] = [path[i - 1], path[i]], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let j = 1; j <= n; j++) out.push([lerp(a[0], b[0], j / n), lerp(a[1], b[1], j / n)]);
  }
  return out;
}
// crowd: place n walkers around routes with varied seeds
export function crowd(k, routes, spec, base = {}) {
  for (const [r, off, seed, extra] of spec) k.qwalker(routes[r], { speed: 0.42 + (seed % 5) * 0.03, offset: off, seed, dwell: 1.2 + (seed % 3) * 0.6, ...base, ...(extra || {}) });
}
