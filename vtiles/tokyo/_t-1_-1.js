// Shibuya tile helpers: extruded footprint buildings (curved glass fronts), pastel mural screens, sign boards.
import { P, INK, shade, lerp, clamp, rng, hash } from "../../lib/vec-kit.js";
import { FONT, quadDraw, acUnit, antenna } from "./_props.js";

const CS = 45 * 0.94;
export const Z = (z) => z * CS; // px per z unit (matches P)

// ---- mural: abstract pastel blobs drifting (like the reference's big screens) ----
const MURALS = [
  [["#f4f0dd", "#f06b86", "#f7a28e", "#e84a68", "#fbd0c4"]],
  [["#f6efd8", "#27a9b5", "#e9505f", "#f1a28a", "#9ad0c4"]],
  [["#fbe9b8", "#f2b632", "#33a8b0", "#f08a7a", "#f6f1e0"]],
  [["#f6e8d0", "#f28a30", "#e6485a", "#3fb0b0", "#f9d27a"]],
];
export function mural(c, w, h, t, seed = 0, text = null) {
  const pal = MURALS[seed % MURALS.length][0], ph = t * 0.18 + seed * 1.7;
  c.fillStyle = pal[0]; c.fillRect(0, 0, w, h);
  const blobs = [[0.15, 0.2, 0.55, 1], [0.85, 0.8, 0.6, 2], [0.5, 1.0, 0.5, 3], [0.9, 0.1, 0.4, 4], [0.1, 0.9, 0.35, 1]];
  blobs.forEach(([x, y, r, ci], i) => {
    const cx = (x + Math.sin(ph + i * 1.9) * 0.12) * w, cy = (y + Math.cos(ph * 0.8 + i * 2.3) * 0.12) * h;
    c.globalAlpha = 0.92; c.fillStyle = pal[ci]; c.beginPath(); c.arc(cx, cy, r * Math.max(w, h) * 0.8, 0, 6.3); c.fill();
  });
  c.globalAlpha = 0.5; c.fillStyle = pal[4]; c.beginPath(); c.arc(w * (0.45 + Math.sin(ph) * 0.15), h * 0.45, h * 0.35, 0, 6.3); c.fill();
  c.globalAlpha = 1;
  if (text) { const i = Math.floor(t / 4 + seed) % text.length; c.fillStyle = "rgba(255,255,255,0.92)"; c.font = `bold ${h * 0.22}px ${FONT}`; c.textAlign = "center"; c.textBaseline = "middle"; c.shadowColor = "rgba(0,0,0,0.35)"; c.shadowBlur = 4; c.fillText(text[i], w / 2, h * 0.5, w * 0.9); c.shadowBlur = 0; }
  c.fillStyle = "rgba(255,255,255,0.08)"; for (let y = 0; y < h; y += 4) c.fillRect(0, y, w, 1);
}

const lerp2 = (a, b, s) => [lerp(a[0], b[0], s), lerp(a[1], b[1], s)];
const pt = (p, z) => P(p[0], p[1], z);

// footprint polygon helpers
export function roundedRect(u0, v0, u1, v1, rad, corner = "", seg = 7) {
  // corner letters: "uv" = (umax,vmax) rounded, "Uv" = (umin,vmax), "uV" = (umax,vmin), "UV" = (umin,vmin)
  const pts = [];
  const arc = (cu, cv, a0) => { for (let i = 0; i <= seg; i++) { const a = a0 + (i / seg) * Math.PI / 2; pts.push([cu + Math.cos(a) * rad, cv + Math.sin(a) * rad]); } };
  // order: (umin,vmin) -> (umax,vmin) -> (umax,vmax) -> (umin,vmax)
  if (corner.includes("UV")) arc(u0 + rad, v0 + rad, Math.PI); else pts.push([u0, v0]);
  if (corner.includes("uV")) arc(u1 - rad, v0 + rad, -Math.PI / 2); else pts.push([u1, v0]);
  if (corner.includes("uv")) arc(u1 - rad, v1 - rad, 0); else pts.push([u1, v1]);
  if (corner.includes("Uv")) arc(u0 + rad, v1 - rad, Math.PI / 2); else pts.push([u0, v1]);
  return pts;
}

// extruded footprint building. o: col, glassFrom (z where glass starts), glass, lit, floors, h
export function extrude(k, pts, h, o = {}) {
  const c = k.ctx, n = pts.length, z0 = o.z ?? 0, col = o.col || "#e8dcc8";
  const edges = [];
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n], du = b[0] - a[0], dv = b[1] - a[1], L = Math.hypot(du, dv);
    if (L < 1e-6) continue;
    const nu = dv / L, nv = -du / L; // outward normal for clockwise-in-uv polygon given our order
    edges.push({ a: b, b: a, L, nu, nv, i, d: (a[0] + a[1] + b[0] + b[1]) / 2 });
  }
  const vis = edges.filter((e) => e.nu > 0.02 || e.nv > 0.02).sort((p, q) => p.d - q.d);
  const wallShade = (e) => { const f = clamp(e.nu / (Math.abs(e.nu) + Math.abs(e.nv) + 1e-6)); return -0.05 - 0.17 * f; };
  const floors = o.floors ?? Math.round(h / 0.6);
  const gz = o.glassFrom ?? 0.3, gh = o.glassTo ?? h - 0.2, fh = (gh - gz) / floors;
  vis.forEach((e) => {
    const A = [e.a, e.b];
    const quad = (s0, s1, za, zb) => { const p0 = lerp2(e.a, e.b, s0), p1 = lerp2(e.a, e.b, s1); return [pt(p0, z0 + za), pt(p1, z0 + za), pt(p1, z0 + zb), pt(p0, z0 + zb)]; };
    k.path(quad(0, 1, 0, h), { fill: shade(col, wallShade(e)), wobble: 0, lw: 0.9 });
    if (o.glass && !(o.noGlass && o.noGlass(e))) {
      for (let f = 0; f < floors; f++) {
        const za = gz + f * fh, zb = za + fh;
        k.path(quad(0.02, 0.98, za + fh * 0.1, zb - fh * 0.08), { fill: shade(o.glass, wallShade(e) * 0.6), wobble: 0, lw: 0.6 });
        const nc = Math.max(2, Math.round(e.L / (o.cell ?? 0.26)));
        for (let q = 0; q < nc; q++) {
          const s0 = 0.03 + (q / nc) * 0.94 + 0.01, s1 = 0.03 + ((q + 1) / nc) * 0.94 - 0.01;
          const hh = hash(f * 7.3 + q * 3.1 + e.i * 11 + (o.seed || 0));
          const lit = hh < (f < (o.warmFloors ?? 3) ? 0.92 : o.lit ?? 0.2);
          const warm = f < (o.warmFloors ?? 3);
          const qd = quad(s0, s1, za + fh * 0.16, zb - fh * 0.14);
          k.path(qd, { fill: lit ? (warm ? ["#f4c35a", "#ecaf48", "#f7d27a"][Math.floor(hh * 9) % 3] : "#f6dc86") : shade("#9fb9c8", wallShade(e) * 0.5 - (hh * 0.1)), wobble: 0, lw: 0.4 });
          if (lit && warm && hh > 0.35) { // shopper silhouettes
            const sx = (qd[0][0] + qd[1][0]) / 2, sy = qd[2][1] + (qd[1][1] - qd[2][1]) * 0.5 + (qd[0][1] - qd[3][1]) * 0 ;
            c.fillStyle = ["#5a3a3a", "#3b4a66", "#c9567a", "#e8c14a"][Math.floor(hh * 40) % 4]; c.beginPath(); c.arc(sx, (qd[2][1] + qd[1][1]) / 2 + 4, 1.5, 0, 6.3); c.fill(); c.fillRect(sx - 1.4, (qd[2][1] + qd[1][1]) / 2 + 5.5, 2.8, 4);
          }
        }
        if (f % 1 === 0) k.path(quad(0, 1, za - 0.015, za + 0.04), { fill: shade(col, wallShade(e) - 0.1), wobble: 0, lw: 0.4 });
      }
    } else if (!o.plainWalls) {
      // punched windows (concrete tower)
      const fl = Math.max(2, Math.round(h / 0.5)), nc = Math.max(1, Math.round(e.L / 0.34));
      for (let f = 0; f < fl; f++) for (let q = 0; q < nc; q++) {
        const s0 = (q + 0.18) / nc, s1 = (q + 0.82) / nc, za = 0.35 + f * ((h - 0.5) / fl), zb = za + (h - 0.5) / fl * 0.6;
        const hh = hash(f * 3.7 + q * 1.9 + e.i + (o.seed || 0));
        k.path(quad(s0, s1, za, zb), { fill: hh < (o.lit ?? 0.25) ? "#f3d684" : shade("#8fa7b8", wallShade(e) * 0.5), wobble: 0, lw: 0.4 });
      }
      // tile grid lines
      c.strokeStyle = "rgba(120,105,90,0.18)"; c.lineWidth = 0.5; c.beginPath();
      for (let f = 0; f <= fl * 2; f++) { const za = f * h / (fl * 2); const a = pt(e.a, z0 + za), b = pt(e.b, z0 + za); c.moveTo(...a); c.lineTo(...b); }
      c.stroke();
    }
    // cornice
    k.path(quad(0, 1, h - 0.1, h), { fill: shade(col, wallShade(e) - 0.1), wobble: 0, lw: 0.8 });
    e.quad = quad;
  });
  // roof
  k.path(pts.map((p) => pt(p, z0 + h)), { fill: o.roof || shade(col, 0.07), wobble: 0, lw: 1.2 });
  return { edges: vis, h, z0, pts };
}

// mural screen across a run of consecutive visible edges (by index list), s range along the total run
import { glow as nightGlow } from "../../lib/night.js";
// screens and signs keep their colours at night and light the street around them
function litQ(k, TL, TR, BL, w, h, fn) {
  if (!k.night) return quadDraw(k, TL, TR, BL, w, h, fn);
  k.lit(() => quadDraw(k, TL, TR, BL, w, h, fn));
  const cx = (TL[0] + TR[0]) / 2 + (BL[0] - TL[0]) / 2, cy = (TL[1] + TR[1]) / 2 + (BL[1] - TL[1]) / 2, sz = Math.hypot(TR[0] - TL[0], TR[1] - TL[1]);
  const fl = 0.85 + 0.15 * Math.sin(k.t * 2.3 + cx * 0.05);
  nightGlow(k.ctx, cx, cy, Math.max(30, sz * 0.75), "#9ab4ff", 0.34 * fl);
}
export function screenRun(k, bld, idxs, sA, sB, zA, zB, o = {}) {
  const t = k.t, es = bld.edges.filter((e) => idxs.includes(e.i)).sort((p, q) => idxs.indexOf(p.i) - idxs.indexOf(q.i));
  if (!es.length) return;
  const total = es.reduce((s, e) => s + e.L, 0), W = 200 * (o.ar ?? 1.2), Hh = 200;
  let acc = 0;
  es.forEach((e) => {
    const f0 = acc / total, f1 = (acc + e.L) / total; acc += e.L;
    const a = Math.max(f0, sA), b = Math.min(f1, sB); if (b <= a) return;
    const s0 = (a - f0) / (f1 - f0), s1 = (b - f0) / (f1 - f0);
    const p0 = lerp2(e.a, e.b, s0), p1 = lerp2(e.a, e.b, s1), z0 = bld.z0;
    const TL = P(p0[0], p0[1], z0 + zB), TR = P(p1[0], p1[1], z0 + zB), BL = P(p0[0], p0[1], z0 + zA);
    const ww = (b - a) / (sB - sA) * W, off = (a - sA) / (sB - sA) * W;
    litQ(k, TL, TR, BL, ww, Hh, (c) => { c.beginPath(); c.rect(0, 0, ww, Hh); c.clip(); c.translate(-off, 0); mural(c, W, Hh, t, o.seed || 0, o.text); });
  });
  // frame
  const c = k.ctx; c.strokeStyle = "rgba(42,36,32,0.8)"; c.lineWidth = 1.4;
  const edge = (zz) => { c.beginPath(); let first = true; acc = 0; es.forEach((e) => { const f0 = acc / total, f1 = (acc + e.L) / total; acc += e.L; const a = Math.max(f0, sA), b = Math.min(f1, sB); if (b <= a) return; const s0 = (a - f0) / (f1 - f0), s1 = (b - f0) / (f1 - f0); const p0 = lerp2(e.a, e.b, s0), p1 = lerp2(e.a, e.b, s1); const q0 = P(p0[0], p0[1], bld.z0 + zz), q1 = P(p1[0], p1[1], bld.z0 + zz); if (first) { c.moveTo(...q0); first = false; } else c.lineTo(...q0); c.lineTo(...q1); }); c.stroke(); };
  edge(zA); edge(zB);
}

// sign board on an edge
export function edgeSign(k, e, z0, s0, s1, zA, zB, text, o = {}) {
  const p0 = lerp2(e.a, e.b, s0), p1 = lerp2(e.a, e.b, s1);
  const TL = P(p0[0], p0[1], z0 + zB), TR = P(p1[0], p1[1], z0 + zB), BL = P(p0[0], p0[1], z0 + zA);
  const w = 100 * (o.ar ?? 1.6), h = 100, t = k.t;
  litQ(k, TL, TR, BL, w, h, (c) => {
    const blink = o.blink ? (Math.sin(t * (o.rate ?? 4) + (o.seed || 0)) > -0.3 ? 1 : 0.4) : 1;
    c.fillStyle = o.bg || "#1f2a44"; c.fillRect(0, 0, w, h);
    c.strokeStyle = o.border || "rgba(255,255,255,0.7)"; c.lineWidth = 5; c.strokeRect(4, 4, w - 8, h - 8);
    c.globalAlpha = blink; c.fillStyle = o.fg || "#fff"; c.font = `bold ${o.size ?? 62}px ${FONT}`; c.textAlign = "center"; c.textBaseline = "middle";
    if (o.vertical) { const ch = [...text]; const fs = Math.min(h / ch.length * 0.92, 70); c.font = `bold ${fs}px ${FONT}`; ch.forEach((g, i) => c.fillText(g, w / 2, h * (i + 0.5) / ch.length)); } else c.fillText(text, w / 2, h / 2 + 3, w * 0.9);
    c.globalAlpha = 1;
  });
}

// awning along an edge at height z (striped)
export function edgeAwning(k, e, z0, s0, s1, z, col, depth = 0.28, stripe = "#fbe9e4") {
  const c = k.ctx, n = 8;
  const nu = e.nu, nv = e.nv;
  for (let i = 0; i < n; i++) {
    const a = s0 + (s1 - s0) * i / n, b = s0 + (s1 - s0) * (i + 1) / n;
    const p0 = lerp2(e.a, e.b, a), p1 = lerp2(e.a, e.b, b);
    k.path([pt(p0, z0 + z + 0.22), pt(p1, z0 + z + 0.22), [P(p1[0] + nu * depth, p1[1] + nv * depth, z0 + z)[0], P(p1[0] + nu * depth, p1[1] + nv * depth, z0 + z)[1]], P(p0[0] + nu * depth, p0[1] + nv * depth, z0 + z)], { fill: i % 2 ? stripe : col, wobble: 0, lw: 0.7 });
  }
}

export function roofKit(k, u0, v0, u1, v1, z, seed, o = {}) {
  const R = rng(seed), n = o.ac ?? 4;
  for (let i = 0; i < n; i++) acUnit(k, (a, b, zz) => P(a, b, zz), u0 + 0.15 + R() * (u1 - u0 - 0.6), v0 + 0.15 + R() * (v1 - v0 - 0.5), z, { s: 0.3 + R() * 0.12 });
  if (o.antenna) for (let i = 0; i < o.antenna; i++) { const [x, y] = P(lerp(u0, u1, 0.2 + R() * 0.6), lerp(v0, v1, 0.2 + R() * 0.6), z); antenna(k, x, y, 26 + R() * 22, { light: true, seed: seed + i }); }
}

export function glassHouse(k, u0, v0, du, dv, z, h = 0.5) {
  const c = k.ctx;
  const T = [[u0, v0], [u0 + du, v0], [u0 + du, v0 + dv], [u0, v0 + dv]];
  k.path([P(u0, v0 + dv, z), P(u0 + du, v0 + dv, z), P(u0 + du, v0 + dv, z + h), P(u0, v0 + dv, z + h)], { fill: "#a7d0de", wobble: 0, lw: 0.8 });
  k.path([P(u0 + du, v0, z), P(u0 + du, v0 + dv, z), P(u0 + du, v0 + dv, z + h), P(u0 + du, v0, z + h)], { fill: "#86b2c6", wobble: 0, lw: 0.8 });
  k.path(T.map(([a, b]) => P(a, b, z + h)), { fill: "#cdeaf2", wobble: 0, lw: 0.9 });
  c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 0.7; c.beginPath();
  for (let i = 1; i < 6; i++) { const f = i / 6; c.moveTo(...P(u0 + du * f, v0, z + h)); c.lineTo(...P(u0 + du * f, v0 + dv, z + h)); c.moveTo(...P(u0 + du * f, v0 + dv, z)); c.lineTo(...P(u0 + du * f, v0 + dv, z + h)); }
  for (let i = 1; i < 4; i++) { const f = i / 4; c.moveTo(...P(u0, v0 + dv * f, z + h)); c.lineTo(...P(u0 + du, v0 + dv * f, z + h)); }
  c.stroke();
}

export function roofGarden(k, pts, z, seed) {
  const R = rng(seed);
  for (const p of pts) for (let i = 0; i < 2; i++) { const [x, y] = P(p[0] + R() * 0.15, p[1] + R() * 0.15, z); k._lobe(x, y - 4, 5 + R() * 2.5, ["#78a655", "#8cb85c", "#6a9a4c"][i % 3], seed + i, { squash: 0.8, bumps: 6 }); }
}
