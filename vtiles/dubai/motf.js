// Museum of the Future: an elliptical stainless-steel torus whose skin is cut by Arabic-calligraphy
// windows, standing on a green mound with a curved glass facade. The torus is a true 3D surface
// (theta round the ring, phi round the tube), drawn sector by sector so props interleave with it.
import { P, CTS, INK, shade, mix, lerp, clamp, rng, smooth } from "../../lib/vec-kit.js";

const DV = [1, 1, (2 * CTS.YS) / CTS.ZS]; // toward the viewer (screen-invariant direction)
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const nrm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const LIGHT = nrm([-0.55, 0.3, 0.78]);
const HALF = nrm([LIGHT[0] + 0.48, LIGHT[1] + 0.48, LIGHT[2] + 0.59]);
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgb = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
const pathOf = (c, pts) => { c.beginPath(); for (let i = 0; i < pts.length; i++) i ? c.lineTo(pts[i][0], pts[i][1]) : c.moveTo(pts[i][0], pts[i][1]); };

// ---------- clipping helpers (param space) ----------
function clipHalf(poly, f) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], fa = f(a), fb = f(b);
    if (fa >= 0) out.push(a);
    if ((fa >= 0) !== (fb >= 0)) { const s = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s]); }
  }
  return out;
}
const clipRect = (poly, x0, x1, y0, y1) => {
  let p = clipHalf(poly, (q) => q[0] - x0); if (p.length < 3) return p;
  p = clipHalf(p, (q) => x1 - q[0]); if (p.length < 3) return p;
  p = clipHalf(p, (q) => q[1] - y0); if (p.length < 3) return p;
  return clipHalf(p, (q) => y1 - q[1]);
};
function clipSeg(a, b, x0, x1, y0, y1) { // Liang-Barsky
  let t0 = 0, t1 = 1; const dx = b[0] - a[0], dy = b[1] - a[1];
  for (const [p, q] of [[-dx, a[0] - x0], [dx, x1 - a[0]], [-dy, a[1] - y0], [dy, y1 - a[1]]]) {
    if (p === 0) { if (q < 0) return null; continue; }
    const r = q / p; if (p < 0) { if (r > t1) return null; if (r > t0) t0 = r; } else { if (r < t0) return null; if (r < t1) t1 = r; }
  }
  return [[a[0] + dx * t0, a[1] + dy * t0], [a[0] + dx * t1, a[1] + dy * t1]];
}

// ---------- calligraphy window shapes (local units, x along the ring, y round the tube) ----------
function bez(p0, p1, p2, p3, t) { const q = 1 - t; return [q * q * q * p0[0] + 3 * q * q * t * p1[0] + 3 * q * t * t * p2[0] + t * t * t * p3[0], q * q * q * p0[1] + 3 * q * q * t * p1[1] + 3 * q * t * t * p2[1] + t * t * t * p3[1]]; }
function stroke(ctrl, wfn, n = 14) {
  const L = [], R = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, p = bez(...ctrl, t), q = bez(...ctrl, Math.min(1, t + 0.02)), r = bez(...ctrl, Math.max(0, t - 0.02));
    const tx = q[0] - r[0], ty = q[1] - r[1], l = Math.hypot(tx, ty) || 1, w = wfn(t);
    L.push([p[0] - (ty / l) * w, p[1] + (tx / l) * w]); R.push([p[0] + (ty / l) * w, p[1] - (tx / l) * w]);
  }
  return { poly: [...L, ...R.reverse()], spine: Array.from({ length: n + 1 }, (_, i) => bez(...ctrl, i / n)) };
}
const place = (pts, cx, cy, ang, sx = 1) => pts.map(([x, y]) => [cx + (x * Math.cos(ang) - y * Math.sin(ang)) * sx, cy + (x * Math.sin(ang) + y * Math.cos(ang))]);
function makePattern(Lx, Ly, seed = 7) {
  const R = rng(seed), out = [];
  const nx = Math.round(Lx / 1.32), ny = Math.max(4, Math.round(Ly / 0.92)), cw = Lx / nx, ch = Ly / ny;
  for (let iy = 0; iy < ny; iy++) for (let ix = 0; ix < nx; ix++) {
    const cx = (ix + 0.5 + (iy % 2) * 0.5) * cw + (R() - 0.5) * 0.15, cy = (iy + 0.5) * ch + (R() - 0.5) * 0.1;
    const r = R(), ang = (iy % 2 ? -0.55 : 0.5) + (R() - 0.5) * 0.7, flip = R() < 0.5 ? -1 : 1;
    const Ls = cw * (0.86 + R() * 0.2), W = ch * (0.15 + R() * 0.06);
    if (r < 0.5) { // sweeping S-stroke, heavy head tapering to a hair tail
      const k1 = (0.25 + R() * 0.2) * flip, k2 = (0.2 + R() * 0.2) * flip;
      const s = stroke([[-Ls / 2, 0], [-Ls / 6, k1 * Ls], [Ls / 6, -k2 * Ls], [Ls / 2, 0]], (t) => W * Math.pow(Math.sin(Math.PI * Math.min(0.985, t * 0.97 + 0.015)), 0.7) * (1.35 - 0.95 * t));
      out.push({ poly: place(s.poly, cx, cy, ang), spine: place(s.spine, cx, cy, ang) });
    } else if (r < 0.78) { // crescent / C-stroke
      const s = stroke([[-Ls / 2, 0], [-Ls / 4, 0.42 * Ls * flip], [Ls / 4, 0.42 * Ls * flip], [Ls / 2, 0]], (t) => W * 1.05 * Math.pow(Math.sin(Math.PI * t), 0.85));
      out.push({ poly: place(s.poly, cx, cy - flip * ch * 0.12, ang * 0.6), spine: place(s.spine, cx, cy - flip * ch * 0.12, ang * 0.6) });
    } else { // teardrop with a curling tail
      const s = stroke([[-Ls * 0.38, 0], [-Ls * 0.05, 0.05 * flip], [Ls * 0.2, 0.32 * Ls * flip], [Ls * 0.45, 0.12 * Ls * flip]], (t) => W * 1.7 * Math.pow(1 - t, 1.25) * Math.sqrt(Math.min(1, t * 9 + 0.05)));
      out.push({ poly: place(s.poly, cx, cy, ang), spine: place(s.spine, cx, cy, ang) });
    }
    // diamonds in the gaps between strokes
    if (R() < 0.75) { const dx = cw * 0.5 + (R() - 0.5) * 0.1, dy = ch * 0.5, s = 0.07 + R() * 0.05; out.push({ poly: place([[s * 1.3, 0], [0, s], [-s * 1.3, 0], [0, -s]], cx + dx, cy + dy, 0.3) }); }
    if (R() < 0.35) { const s = 0.05 + R() * 0.03; out.push({ poly: place([[s * 1.3, 0], [0, s], [-s * 1.3, 0], [0, -s]], cx - cw * 0.08, cy + ch * 0.46, 0.2) }); }
  }
  for (const w of out) { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of w.poly) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } w.bb = [x0, x1, y0, y1]; }
  return out;
}

export function makeMuseum(o = {}) {
  const T = { C: [4.2, 2.32, 4.42], a: 3.22, b: 2.72, al: -0.575, be: -0.03, ga: 0.05, ri: 1.06, ro: 0.64, rk: -0.28, rp: 0.15, zCut: 0.78, ...o.torus };
  const h = [Math.cos(T.al), Math.sin(T.al), 0], nh = [-Math.sin(T.al), Math.cos(T.al), 0];
  const w = [nh[0] * Math.sin(T.be), nh[1] * Math.sin(T.be), Math.cos(T.be)], n = cross(w, h);
  const cen = (th) => { const ps = th + T.ga; return [0, 1, 2].map((k) => T.C[k] + T.a * Math.cos(ps) * h[k] + T.b * Math.sin(ps) * w[k]); };
  function X(th, ph) {
    const ps = th + T.ga, c = cen(th);
    const N = nrm([0, 1, 2].map((k) => T.b * Math.cos(ps) * h[k] + T.a * Math.sin(ps) * w[k]));
    const rf = 1 + T.rk * Math.cos(th - T.rp);
    const p = [0, 1, 2].map((k) => c[k] + T.ri * rf * Math.cos(ph) * N[k] + T.ro * rf * Math.sin(ph) * n[k]);
    if (p[2] < T.zCut) p[2] = T.zCut;
    return p;
  }
  // ring + tube lengths for the window pattern
  let Lx = 0; { let pr = cen(0); for (let i = 1; i <= 360; i++) { const q = cen((i / 360) * 6.2832); Lx += Math.hypot(...sub(q, pr)); pr = q; } }
  const Ly = Math.PI * (3 * (T.ri + T.ro) / 2 - Math.sqrt(((3 * T.ri + T.ro) * (T.ri + 3 * T.ro)) / 4)) * 2 / 2 * 1.0;
  const NT = 80, NP = 36;
  let cache = null;

  function normalAt(th, ph) {
    const e = 0.004, a = X(th + e, ph), b = X(th - e, ph), c = X(th, ph + e), d = X(th, ph - e);
    let nn = nrm(cross(sub(a, b), sub(c, d)));
    const m = X(th, ph), cc = cen(th);
    if (dot(nn, sub(m, cc)) < 0) nn = [-nn[0], -nn[1], -nn[2]];
    return nn;
  }
  function steel(nn) {
    const diff = Math.max(0, dot(nn, LIGHT));
    let col = mixc(hex("#8790a2"), hex("#f6f7f9"), 0.22 + 0.78 * Math.pow(diff, 0.85));
    if (nn[2] < 0) col = mixc(col, hex("#d9c39c"), Math.min(0.6, -nn[2] * 0.75)); // warm ground bounce underneath
    else col = mixc(col, hex("#dfe6f3"), nn[2] * 0.25);
    const facing = dot(nn, nrm(DV));
    if (facing < 0.35) col = mixc(col, hex("#a9a6c2"), (0.35 - facing) * 0.7); // lavender toward the rim
    const sp = Math.pow(Math.max(0, dot(nn, HALF)), 26);
    return { col: mixc(col, [255, 255, 255], sp * 0.8), diff };
  }

  function build() {
    const grid = [];
    for (let i = 0; i <= NT; i++) { const row = []; for (let j = 0; j <= NP; j++) row.push(X((i / NT) * 6.2832, (j / NP) * 6.2832)); grid.push(row); }
    const pat = makePattern(Lx, Ly);
    const toS = (x, y) => { const p = X((x / Lx) * 6.2832, (y / Ly) * 6.2832); return P(p[0], p[1], p[2]); };
    const sectors = [];
    for (let i = 0; i < NT; i++) {
      const th0 = (i / NT) * 6.2832, th1 = ((i + 1) / NT) * 6.2832, thm = (th0 + th1) / 2;
      const vis = [], quads = [];
      for (let j = 0; j < NP; j++) {
        const A = grid[i][j], B = grid[i + 1][j], Cq = grid[i + 1][j + 1], Dq = grid[i][j + 1];
        let nn = cross(sub(Cq, A), sub(Dq, B));
        const mid = [(A[0] + Cq[0]) / 2, (A[1] + Cq[1]) / 2, (A[2] + Cq[2]) / 2];
        if (Math.hypot(...nn) < 1e-7) { vis.push(false); continue; }
        nn = nrm(nn); if (dot(nn, sub(mid, cen(thm))) < 0) nn = [-nn[0], -nn[1], -nn[2]];
        const v = dot(nn, DV) > 0.0 && !(A[2] <= T.zCut + 1e-6 && B[2] <= T.zCut + 1e-6 && Cq[2] <= T.zCut + 1e-6 && Dq[2] <= T.zCut + 1e-6);
        vis.push(v);
        if (!v) continue;
        const pts = [A, B, Cq, Dq].map((p) => P(p[0], p[1], p[2]));
        const s = steel(nn);
        const cx = (pts[0][0] + pts[2][0]) / 2, cy = (pts[0][1] + pts[2][1]) / 2;
        quads.push({ pts, col: s.col, diff: s.diff, cx, cy, j });
      }
      // longest visible run of phi (wrapping)
      let best = null;
      for (let j0 = 0; j0 < NP; j0++) {
        if (!vis[j0] || vis[(j0 - 1 + NP) % NP]) continue;
        let j1 = j0; while (j1 - j0 < NP - 1 && vis[(j1 + 1) % NP]) j1++;
        if (!best || j1 - j0 > best[1] - best[0]) best = [j0, j1];
      }
      if (!best && vis.every(Boolean)) best = [0, NP - 1];
      const sec = { i, quads, wins: [], edges: [], sil: [], panel: [], key: 0 };
      const cm = cen(thm); sec.key = cm[0] + cm[1] + 0.55 + cm[2] * 0.004; sec.cz = cm[2];
      if (best) {
        const x0 = (th0 / 6.2832) * Lx, x1 = (th1 / 6.2832) * Lx, y0 = (best[0] / NP) * Ly, y1 = ((best[1] + 1) / NP) * Ly;
        for (const win of pat) for (const sx of [-Lx, 0, Lx]) for (const sy of [-Ly, 0, Ly, 2 * Ly]) {
          const b = win.bb; if (b[1] + sx < x0 || b[0] + sx > x1 || b[3] + sy < y0 || b[2] + sy > y1) continue;
          const poly = win.poly.map(([x, y]) => [x + sx, y + sy]);
          const cl = clipRect(poly, x0, x1, y0, y1);
          if (cl.length >= 3) {
            let mx = 0, my = 0; for (const [x, y] of cl) { mx += x; my += y; } mx /= cl.length; my /= cl.length;
            const nn = normalAt((mx / Lx) * 6.2832, (my / Ly) * 6.2832), diff = Math.max(0, dot(nn, LIGHT));
            const zc = X((mx / Lx) * 6.2832, (my / Ly) * 6.2832)[2];
            if (zc < T.zCut + 0.05) continue;
            let g = mixc(hex("#3f6a86"), hex("#a9cbe0"), clamp(0.15 + nn[2] * 0.55 + diff * 0.35));
            if (nn[2] < -0.1) g = mixc(g, hex("#5d6f7a"), 0.3);
            const pts = cl.map(([x, y]) => toS(x, y));
            sec.wins.push({ pts, col: g, cx: pts.reduce((s, p) => s + p[0], 0) / pts.length, cy: pts.reduce((s, p) => s + p[1], 0) / pts.length });
            for (let e = 0; e < poly.length; e++) {
              const sg = clipSeg(poly[e], poly[(e + 1) % poly.length], x0, x1, y0, y1);
              if (sg) sec.edges.push([toS(...sg[0]), toS(...sg[1])]);
            }
            if (win.spine) { // a pale reflection line down the stroke's spine
              const sp = []; for (const q of win.spine) { const qq = [q[0] + sx, q[1] + sy]; if (qq[0] >= x0 && qq[0] <= x1 && qq[1] >= y0 && qq[1] <= y1) sp.push(toS(...qq)); }
              if (sp.length > 1) sec.edges.push({ spine: sp });
            }
          }
        }
        // silhouette lines (the two ends of the visible run) + faint panel joints
        const j0 = best[0], j1 = best[1] + 1;
        for (const jj of [j0, j1]) { const a = grid[i][jj % NP], b = grid[i + 1][jj % NP]; sec.sil.push([P(...a), P(...b)]); }
        if (i % 2 === 0) { const pts = []; for (let j = j0; j <= j1; j++) pts.push(P(...grid[i][j % NP])); sec.panel.push(pts); }
        for (let j = j0 + 1; j < j1; j += 2) sec.panel.push([P(...grid[i][j % NP]), P(...grid[i + 1][j % NP])]);
      }
      sectors.push(sec);
    }
    // a sector whose neighbours are both visible but itself has no run (clamped bottom) -> nothing to draw
    cache = { sectors };
  }

  // sun glint: a diagonal band sweeping left to right every 9 s, plus a slow broad sheen
  function glintAt(x, y, t) {
    const per = 9, ph = ((t % per) + per) % per, sc = lerp(150, 1150, ph / 6.2);
    const d = x * 0.82 + y * 0.57 - sc;
    const d2 = x * 0.82 + y * 0.57 - lerp(1200, 200, (((t + 4.5) % 13) + 13) % 13 / 13);
    return 0.85 * Math.exp(-((d / 18) ** 2)) + 0.28 * Math.exp(-((d / 75) ** 2)) + 0.12 * Math.exp(-((d2 / 60) ** 2));
  }

  function drawSector(k, sec, t) {
    const c = k.ctx;
    for (const q of sec.quads) {
      const g = glintAt(q.cx, q.cy, t) * (0.35 + 0.65 * q.diff);
      const col = rgb(mixc(q.col, [255, 255, 250], Math.min(0.85, g)));
      pathOf(c, q.pts); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = col; c.lineWidth = 0.8; c.stroke();
    }
    c.lineJoin = "round"; c.lineCap = "round";
    c.strokeStyle = "rgba(70,78,100,0.2)"; c.lineWidth = 0.6;
    for (const pl of sec.panel) { pathOf(c, pl); c.stroke(); }
    for (const wv of sec.wins) {
      const g = glintAt(wv.cx, wv.cy, t);
      pathOf(c, wv.pts); c.closePath(); c.fillStyle = rgb(mixc(wv.col, [236, 246, 255], Math.min(0.9, g * 1.1))); c.fill();
    }
    for (const e of sec.edges) {
      if (e.spine) { pathOf(c, e.spine); c.strokeStyle = "rgba(225,240,250,0.45)"; c.lineWidth = 1.1; c.stroke(); continue; }
    }
    c.strokeStyle = INK; c.lineWidth = 1.15; c.beginPath();
    for (const e of sec.edges) { if (e.spine) continue; c.moveTo(e[0][0], e[0][1]); c.lineTo(e[1][0], e[1][1]); }
    c.stroke();
    c.lineWidth = 2; c.beginPath();
    for (const s of sec.sil) { c.moveTo(s[0][0], s[0][1]); c.lineTo(s[1][0], s[1][1]); }
    c.stroke();
  }

  // ---------- the mound ----------
  const M = { C: [3.85, 3.1], e1: h.slice(0, 2), e2: [n[0], n[1]], A: 3.9, Bf: 1.45, Bb: 2.2, H: 0.78, zc: 0.62, q0: 0.42, cl0: 1.03, cl1: 1.94, ...o.mound };
  const NA = 96;
  const radius = (a) => { const B = Math.sin(a) > 0 ? M.Bf : M.Bb; return [M.A * Math.cos(a), B * Math.sin(a)]; };
  const cliffW = (a) => { a = ((a % 6.2832) + 6.2832) % 6.2832; return smooth((a - M.cl0 + 0.0) / 0.22) * smooth((M.cl1 - a) / 0.22); };
  const hProf = (a, q) => { const base = M.H * (1 - smooth((q - M.q0) / (1 - M.q0))); const wc = cliffW(a); if (wc <= 0) return base; const cliff = q < 1 ? M.zc + (M.H - M.zc) * (1 - smooth((q - M.q0) / (1 - M.q0))) : 0; return lerp(base, cliff, wc); };
  const mpt = (a, q) => { const [x, y] = radius(a); return [M.C[0] + (M.e1[0] * x + M.e2[0] * y) * q, M.C[1] + (M.e1[1] * x + M.e2[1] * y) * q]; };
  function mh(u, v) { // mound height at (u,v); 0 outside
    const du = u - M.C[0], dv = v - M.C[1], x = du * M.e1[0] + dv * M.e1[1], y = du * M.e2[0] + dv * M.e2[1];
    const B = y > 0 ? M.Bf : M.Bb, q = Math.hypot(x / M.A, y / B); if (q >= 1) return 0;
    return hProf(Math.atan2(y / B, x / M.A), q);
  }
  let mcache = null;
  function buildMound() {
    const NZ = 16, slices = [];
    for (let s = 0; s <= NZ; s++) {
      const z = (s / NZ) * M.H * 0.995, pts = [];
      for (let i = 0; i < NA; i++) {
        const a = (i / NA) * 6.2832;
        let lo = 0, hi = 1; if (hProf(a, 0.9999) >= z) { lo = 1; hi = 1; } else for (let it = 0; it < 22; it++) { const m = (lo + hi) / 2; if (hProf(a, m) >= z) lo = m; else hi = m; }
        const [u, v] = mpt(a, Math.max(lo, 0.02)); pts.push(P(u, v, z));
      }
      slices.push({ z, pts });
    }
    // glass facade ribbon round the cliff
    const wall = [];
    for (let i = 0; i <= 60; i++) { const a = lerp(M.cl0 - 0.22, M.cl1 + 0.22, i / 60), [u, v] = mpt(a, 1), zt = hProf(a, 0.9999); wall.push({ a, u, v, zt }); }
    mcache = { slices, wall };
  }
  function drawMound(k, t) {
    if (!mcache) buildMound();
    const c = k.ctx, { slices, wall } = mcache;
    // soft shadow ring on the paving
    c.save(); pathOf(c, slices[0].pts); c.closePath(); c.lineWidth = 10; c.strokeStyle = "rgba(70,60,40,0.12)"; c.stroke(); c.restore();
    slices.forEach((s, i) => {
      const f = i / (slices.length - 1);
      const g = c.createLinearGradient(160, 0, 860, 0);
      g.addColorStop(0, mix("#98bb5c", "#b7d277", f)); g.addColorStop(0.55, mix("#86ab4e", "#a5c768", f)); g.addColorStop(1, mix("#6f9443", "#8fb35a", f));
      pathOf(c, s.pts); c.closePath(); c.fillStyle = g; c.fill();
      if (i % 4 === 2) { c.strokeStyle = "rgba(255,255,220,0.13)"; c.lineWidth = 1.2; c.stroke(); }
    });
    pathOf(c, slices[0].pts); c.closePath(); c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
    // stone kerb along the foot (front half only)
    c.strokeStyle = "#e6d6b8"; c.lineWidth = 3; c.beginPath();
    for (let i = 0; i <= NA; i++) { const a = (i / NA) * 6.2832; if (Math.sin(a) < -0.15 || cliffW(a) > 0.5) continue; const [u, v] = mpt(a, 1); const p = P(u, v, 0.05); c.lineTo(p[0], p[1]); }
    c.stroke();
    // grass texture: tufts at the right height
    const R = rng(77); c.strokeStyle = "rgba(60,95,38,0.5)"; c.lineWidth = 0.9; c.lineCap = "round"; c.beginPath();
    for (let i = 0; i < 520; i++) {
      const a = R() * 6.2832, q = Math.sqrt(R()) * 0.97, [u, v] = mpt(a, q), z = mh(u, v); if (z <= 0.01) continue;
      const [x, y] = P(u, v, z); c.moveTo(x - 2, y); c.lineTo(x - 0.7, y - 2.8); c.moveTo(x, y); c.lineTo(x, y - 3.5); c.moveTo(x + 2, y); c.lineTo(x + 0.7, y - 2.8);
    }
    c.stroke();
    c.fillStyle = "rgba(255,255,225,0.16)";
    for (let i = 0; i < 90; i++) { const a = R() * 6.2832, q = Math.sqrt(R()) * 0.9, [u, v] = mpt(a, q), [x, y] = P(u, v, mh(u, v)); c.beginPath(); c.ellipse(x, y, 6 + R() * 7, 2 + R() * 2, 0, 0, 6.3); c.fill(); }
    // glass facade in the cliff
    drawFacade(k, t, wall);
  }
  function drawFacade(k, t, wall) {
    const c = k.ctx;
    const top = wall.map((p) => P(p.u, p.v, p.zt)), bot = wall.map((p) => P(p.u, p.v, 0));
    pathOf(c, [...top, ...[...bot].reverse()]); c.closePath();
    const g = c.createLinearGradient(0, Math.min(...top.map((p) => p[1])), 0, Math.max(...bot.map((p) => p[1])));
    g.addColorStop(0, "#3e5f76"); g.addColorStop(0.5, "#6f97ad"); g.addColorStop(1, "#c9a873");
    c.fillStyle = g; c.fill();
    c.save(); c.clip();
    // interior: warm lit lobby band, ceiling lights, silhouettes of visitors
    for (let i = 2; i < wall.length - 2; i += 3) { const p = wall[i]; if (p.zt < 0.3) continue; const [x, y] = P(p.u, p.v, p.zt * 0.86); c.fillStyle = "rgba(255,236,170,0.9)"; c.beginPath(); c.arc(x, y, 1.6, 0, 6.3); c.fill(); }
    const R = rng(5);
    for (let i = 0; i < 9; i++) {
      const f = 0.12 + i * 0.09 + R() * 0.03, idx = Math.floor(f * (wall.length - 1)), p = wall[idx]; if (p.zt < 0.35) continue;
      const sway = Math.sin(t * 0.7 + i * 1.7) * 0.06, idx2 = clamp(Math.round(idx + sway * 30), 0, wall.length - 1), q = wall[idx2];
      const [x, y] = P(q.u, q.v, 0.02); c.fillStyle = "rgba(40,50,60,0.45)"; c.beginPath(); c.arc(x, y - 17, 2.6, 0, 6.3); c.fill(); c.fillRect(x - 2.6, y - 14.5, 5.2, 12);
    }
    // mullions + transom
    c.strokeStyle = "rgba(30,40,48,0.85)"; c.lineWidth = 1; c.beginPath();
    for (let i = 0; i < wall.length; i += 2) { c.moveTo(...bot[i]); c.lineTo(...top[i]); }
    const mid = wall.map((p) => P(p.u, p.v, Math.min(p.zt, 0.4))); pathOf(c, mid);
    c.stroke();
    c.fillStyle = "rgba(255,255,255,0.18)"; for (let i = 0; i < wall.length - 3; i += 9) { pathOf(c, [bot[i], top[i], top[i + 2], bot[i + 3]]); c.fill(); }
    c.restore();
    pathOf(c, [...top, ...[...bot].reverse()]); c.closePath(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke();
    // concrete lip over the glass
    const lip = wall.map((p) => P(p.u + (p.u - M.C[0]) * 0.03, p.v + (p.v - M.C[1]) * 0.03, p.zt + 0.04)), lipb = wall.map((p) => P(p.u, p.v, p.zt - 0.06));
    pathOf(c, [...lip, ...[...lipb].reverse()]); c.closePath(); c.fillStyle = "#efe4cf"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
  }

  // ---------- glass podium under the lifted right half of the ring ----------
  const POD = { C: [5.3, 1.62], A: 1.55, B: 0.62, z1: 1.45, ...o.podium };
  function drawPodium(k, t) {
    const c = k.ctx, N = 40, top = [], bot = [];
    for (let i = 0; i <= N; i++) {
      const a = lerp(-0.25, Math.PI + 0.25, i / N); // the visible front half
      const x = POD.A * Math.cos(a), y = POD.B * Math.sin(a), u = POD.C[0] + h[0] * x + n[0] * y, v = POD.C[1] + h[1] * x + n[1] * y;
      top.push(P(u, v, POD.z1)); bot.push(P(u, v, mh(u, v)));
    }
    pathOf(c, [...top, ...[...bot].reverse()]); c.closePath();
    const g = c.createLinearGradient(0, top[N >> 1][1], 0, bot[N >> 1][1]); g.addColorStop(0, "#2f4b60"); g.addColorStop(1, "#7aa2b8");
    c.fillStyle = g; c.fill();
    c.save(); c.clip();
    c.strokeStyle = "rgba(20,30,40,0.8)"; c.lineWidth = 1; c.beginPath(); for (let i = 0; i <= N; i += 2) { c.moveTo(...bot[i]); c.lineTo(...top[i]); } c.stroke();
    for (let i = 3; i < N; i += 4) { const [x, y] = bot[i]; c.fillStyle = "rgba(255,226,150,0.85)"; c.fillRect(x - 1, y - 18, 2, 2); }
    c.restore();
    pathOf(c, [...top, ...[...bot].reverse()]); c.closePath(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
  }

  function queue(k, t) {
    if (!cache) build();
    for (const sec of cache.sectors) if (sec.quads.length) k.q(sec.key, () => drawSector(k, sec, t));
  }
  // the torus' shadow on the mound/plaza (light from the upper left -> falls toward +u)
  function shadow(k) {
    const c = k.ctx, pts = [];
    for (let i = 0; i <= 48; i++) { const th = (i / 48) * 6.2832, p = cen(th), z = p[2]; pts.push(P(p[0] + z * 0.32, p[1] - z * 0.12, 0)); }
    c.save(); k._trace([P(0, 0), P(10, 0), P(10, 10), P(0, 10)], true, 0); c.clip();
    pathOf(c, pts); c.closePath(); c.lineWidth = 2 * T.ri * CTS.S * 0.9; c.strokeStyle = "rgba(70,55,40,0.1)"; c.lineJoin = "round"; c.stroke(); c.restore();
  }
  return { queue, drawMound, drawPodium, shadow, mh, mpt, M, T, X, cen, h, n };
}
