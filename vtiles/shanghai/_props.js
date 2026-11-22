// Shanghai shared helpers: lofted towers, glass/masonry boxes, east-asian eave roofs, signs, lanterns,
// boats, koi, crowd spawners. Everything is a pure function of k.t.
import { P, CTS, INK, shade, mix, lerp, clamp, rng, hash, smooth } from "../../lib/vec-kit.js";
export { P, CTS, INK, shade, mix, lerp, clamp, rng, hash, smooth };

export const SKYC = "#f3ead8";

// ---------- geometry ----------
export function ellipsePts(cu, cv, a, b, n = 48, a0 = 0) {
  // ellipse with semi-axis a along (1,-1) and b along (1,1) (the screen-aligned iso ellipse)
  const out = [];
  for (let i = 0; i < n; i++) {
    const th = a0 + (i / n) * Math.PI * 2, x = Math.cos(th) * a, y = Math.sin(th) * b;
    out.push([cu + (x + y) / Math.SQRT2, cv + (y - x) / Math.SQRT2]);
  }
  return out;
}

// generic loft: o.shape(f) -> [[du,dv],...] (ccw, same count every level), o.zFn(f) -> z, o.n levels.
// o.col(f, lit) -> fill, lit 0 (right face) .. 1 (left face). o.lines draws floor lines + mullions.
export function loft(k, cu, cv, o) {
  const c = k.ctx, n = o.n ?? 24, z0 = o.z0 ?? 0, z1 = o.z1;
  const lev = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n, z = z0 + (z1 - z0) * (o.zFn ? o.zFn(f) : f);
    lev.push({ f, z, pts: o.shape(f).map(([du, dv]) => [cu + du, cv + dv]) });
  }
  const M = lev[0].pts.length, left = [], right = [];
  for (let i = 0; i < n; i++) {
    const A = lev[i], B = lev[i + 1];
    for (let j = 0; j < M; j++) {
      const j2 = (j + 1) % M;
      const eu = A.pts[j2][0] - A.pts[j][0], ev = A.pts[j2][1] - A.pts[j][1], L = Math.hypot(eu, ev) || 1;
      const nu = ev / L, nv = -eu / L; // outward normal for ccw order in (u,v)
      if (nu + nv < -0.02) continue;
      const lit = clamp((nv + 0.15) / (Math.abs(nu) + Math.abs(nv) + 0.3), 0, 1);
      const q = [P(A.pts[j][0], A.pts[j][1], A.z), P(A.pts[j2][0], A.pts[j2][1], A.z), P(B.pts[j2][0], B.pts[j2][1], B.z), P(B.pts[j][0], B.pts[j][1], B.z)];
      const col = o.col((A.f + B.f) / 2, lit, j, M);
      c.beginPath(); q.forEach((p, ii) => (ii ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
      c.fillStyle = col; c.fill(); c.strokeStyle = col; c.lineWidth = 0.7; c.stroke();
    }
  }
  // floor lines
  if (o.lines !== false) {
    c.lineWidth = 0.7; c.strokeStyle = o.lineCol || "rgba(30,55,85,0.38)";
    const step = o.lineEvery ?? 1;
    c.beginPath();
    for (let i = 0; i <= n; i += step) {
      const A = lev[i];
      for (let j = 0; j < M; j++) {
        const j2 = (j + 1) % M;
        const eu = A.pts[j2][0] - A.pts[j][0], ev = A.pts[j2][1] - A.pts[j][1], L = Math.hypot(eu, ev) || 1;
        if (ev / L - eu / L < -0.02) continue;
        const p = P(A.pts[j][0], A.pts[j][1], A.z), q = P(A.pts[j2][0], A.pts[j2][1], A.z);
        c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]);
      }
    }
    c.stroke();
    if (o.mull) {
      c.beginPath();
      for (let j = 0; j < M; j += o.mull) {
        const j2 = (j + 1) % M;
        for (let i = 0; i < n; i++) {
          const A = lev[i], B = lev[i + 1];
          const eu = A.pts[j2][0] - A.pts[j][0], ev = A.pts[j2][1] - A.pts[j][1], L = Math.hypot(eu, ev) || 1;
          if (ev / L - eu / L < -0.02) continue;
          const p = P(A.pts[j][0], A.pts[j][1], A.z), q = P(B.pts[j][0], B.pts[j][1], B.z);
          c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]);
        }
      }
      c.stroke();
    }
  }
  // silhouette
  const sil = (pickMax) => lev.map((L) => { let best = null; for (const [u, v] of L.pts) { const p = P(u, v, L.z); if (!best || (pickMax ? p[0] > best[0] : p[0] < best[0])) best = p; } return best; });
  const sl = sil(false), sr = sil(true), top = lev[n].pts.map(([u, v]) => P(u, v, lev[n].z)), bot = lev[0].pts.map(([u, v]) => P(u, v, lev[0].z));
  c.lineJoin = "round"; c.strokeStyle = INK; c.lineWidth = k.lw;
  c.beginPath(); sl.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke();
  c.beginPath(); sr.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke();
  // bottom outline (visible half)
  c.beginPath(); bot.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
  if (o.noTop) return { lev, top };
  c.beginPath(); top.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
  c.fillStyle = o.topCol || "#b7d0de"; c.fill(); c.stroke();
  return { lev, top };
}

// facade box: glass or masonry, floor lines, mullions, flat roof with parapet, sparkle glints
export function skyBox(k, u, v, du, dv, h, o = {}) {
  const c = k.ctx, z = o.z ?? 0;
  const base = o.col || "#8fb4cc";
  const sk = o.shadow !== false;
  if (sk && z <= 0.01) k.shadow([[u + du, v, 0], [u + du + h * 0.32, v + h * 0.1, 0], [u + du + h * 0.32, v + dv + h * 0.1, 0], [u + du, v + dv, 0]], 0.1);
  const L = [[u, v + dv, z], [u + du, v + dv, z], [u + du, v + dv, z + h], [u, v + dv, z + h]].map((p) => P(...p));
  const R = [[u + du, v, z], [u + du, v + dv, z], [u + du, v + dv, z + h], [u + du, v, z + h]].map((p) => P(...p));
  const T = [[u, v, z + h], [u + du, v, z + h], [u + du, v + dv, z + h], [u, v + dv, z + h]].map((p) => P(...p));
  const colL = o.left || shade(base, 0.04), colR = o.right || shade(base, -0.22);
  const face = (q, col, gl) => {
    const g = c.createLinearGradient(0, q[3][1], 0, q[0][1]);
    g.addColorStop(0, shade(col, gl ? 0.16 : 0.1)); g.addColorStop(0.55, col); g.addColorStop(1, shade(col, -0.1));
    k.path(q, { fill: g, lw: k.lw });
  };
  face(L, colL, true); face(R, colR, false);
  // facade grid
  const floors = o.floors ?? Math.max(3, Math.round(h / 0.26)), cols = o.cols ?? Math.max(3, Math.round(du / 0.3)), colsR = o.colsR ?? Math.max(3, Math.round(dv / 0.3));
  c.lineWidth = 0.7;
  const grid = (q, nc, col) => {
    c.strokeStyle = col; c.beginPath();
    const at = (a, b) => [lerp(lerp(q[0][0], q[1][0], a), lerp(q[3][0], q[2][0], a), b), lerp(lerp(q[0][1], q[1][1], a), lerp(q[3][1], q[2][1], a), b)];
    for (let i = 1; i < floors; i++) { const p = at(0, i / floors), r = at(1, i / floors); c.moveTo(p[0], p[1]); c.lineTo(r[0], r[1]); }
    for (let i = 1; i < nc; i++) { const p = at(i / nc, 0), r = at(i / nc, 1); c.moveTo(p[0], p[1]); c.lineTo(r[0], r[1]); }
    c.stroke();
  };
  grid(L, cols, o.grid || "rgba(25,50,80,0.34)"); grid(R, colsR, o.gridR || "rgba(15,30,50,0.4)");
  // lit windows on masonry facades
  if (o.warm) {
    const rr = rng(Math.round(u * 17 + v * 29 + h * 5));
    c.fillStyle = "rgba(255,226,140,0.7)";
    for (let i = 0; i < floors * cols * 0.14; i++) {
      const a = (Math.floor(rr() * cols) + 0.25) / cols, b = (Math.floor(rr() * (floors - 1)) + 0.4) / floors;
      const at = (a2, b2) => [lerp(lerp(L[0][0], L[1][0], a2), lerp(L[3][0], L[2][0], a2), b2), lerp(lerp(L[0][1], L[1][1], a2), lerp(L[3][1], L[2][1], a2), b2)];
      const p = at(a, b); c.fillRect(p[0], p[1] - 4, 3, 3.5);
    }
  }
  k.path(T, { fill: o.top || shade(base, 0.22), lw: k.lw });
  // sparkles
  if (o.sparkle !== false) {
    const rr = rng(Math.round(u * 71 + v * 31 + h * 13));
    for (let i = 0; i < (o.sparks ?? 2); i++) {
      const a = 0.15 + rr() * 0.7, b = 0.15 + rr() * 0.75, ph = rr() * 7, sp = 0.6 + rr() * 0.6;
      const s = Math.max(0, Math.sin(k.t * sp * 2.2 + ph)); if (s < 0.82) continue;
      const q = L, p = [lerp(lerp(q[0][0], q[1][0], a), lerp(q[3][0], q[2][0], a), b), lerp(lerp(q[0][1], q[1][1], a), lerp(q[3][1], q[2][1], a), b)];
      glint(c, p[0], p[1], (s - 0.82) / 0.18 * 7 + 2);
    }
  }
  return { L, R, T };
}
export function glint(c, x, y, r, col = "#ffffff") {
  c.save(); c.fillStyle = col; c.globalAlpha = 0.95;
  c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill();
  c.restore();
}

// ---------- east-asian roofs ----------
// hip/gable eave roof over a footprint: curved sagging eaves with flicked-up corners, tiles, ridge, ornaments
export function eaveRoof(k, u, v, z, du, dv, h, col, o = {}) {
  const c = k.ctx, oh = o.over ?? 0.32, lift = o.lift ?? 0.2, ridgeIn = o.ridgeIn ?? Math.min(du, dv) * 0.18;
  const ru0 = u + (du > dv ? ridgeIn + (du - dv) / 2 * 0.0 : ridgeIn), rv0 = v + ridgeIn, ru1 = u + du - ridgeIn, rv1 = v + dv - ridgeIn;
  const eave = (a, b, n = 14) => { const out = []; for (let i = 0; i <= n; i++) { const s = i / n; const sag = -0.07 * Math.sin(Math.PI * s); const fl = lift * Math.pow(Math.abs(2 * s - 1), 3); out.push([lerp(a[0], b[0], s), lerp(a[1], b[1], s), z + sag + fl]); } return out; };
  const A = [u - oh, v - oh], B = [u + du + oh, v - oh], C = [u + du + oh, v + dv + oh], D = [u - oh, v + dv + oh];
  const cl = col, cr = shade(col, -0.24), dark = o.edge || shade(col, -0.45);
  const rH = z + h;
  const rp = [[ru0, rv0, rH], [ru1, rv0, rH], [ru1, rv1, rH], [ru0, rv1, rH]];
  // left plane (v+dv side): eave D->C up to ridge rv1
  const eL = eave(D, C);
  const left = [...eL, [ru1, rv1, rH], [ru0, rv1, rH]];
  const eR = eave(B, C);
  const right = [...eR, [ru1, rv1, rH], [ru1, rv0, rH]];
  k.poly(rp, shade(col, 0.1), { lw: k.lw, wobble: 0 });
  k.poly(left, cl, { lw: k.lw, wobble: 0 });
  k.poly(right, cr, { lw: k.lw, wobble: 0 });
  // tile rows
  c.lineWidth = 0.8;
  c.strokeStyle = "rgba(30,15,10,0.35)";
  const rows = o.rows ?? Math.max(5, Math.round(Math.max(du, dv) * 4));
  c.beginPath();
  for (let i = 1; i < rows; i++) { const s = i / rows; const a = P(lerp(D[0], C[0], s), lerp(D[1], C[1], s), z + 0.0 + 0.0), b = P(lerp(ru0, ru1, s), rv1, rH); c.moveTo(...a); c.lineTo(...P(lerp(lerp(D[0], C[0], s), lerp(ru0, ru1, s), 0.88), lerp(lerp(D[1], C[1], s), rv1, 0.88), lerp(z, rH, 0.88))); }
  for (let i = 1; i < rows; i++) { const s = i / rows; const a = P(lerp(B[0], C[0], s), lerp(B[1], C[1], s), z); c.moveTo(...a); c.lineTo(...P(lerp(lerp(B[0], C[0], s), ru1, 0.88), lerp(lerp(B[1], C[1], s), lerp(rv0, rv1, s), 0.88), lerp(z, rH, 0.88))); }
  c.stroke();
  // eave edge band
  k.line3(eL, { stroke: dark, lw: 2.2, wobble: 0 }); k.line3(eR, { stroke: dark, lw: 2.2, wobble: 0 });
  // ridge
  k.line3([[ru0, rv1, rH], [ru1, rv1, rH], [ru1, rv0, rH]], { stroke: o.ridgeCol || shade(col, 0.3), lw: 2.6, wobble: 0 });
  k.line3([[ru0, rv1, rH], [ru1, rv1, rH], [ru1, rv0, rH]], { stroke: INK, lw: 0.9, wobble: 0 });
  // flicked corner tips
  for (const [pu, pv] of [C, D, B]) { const [x, y] = P(pu, pv, z + lift + 0.04); c.fillStyle = dark; c.beginPath(); c.arc(x, y - 1, 1.8, 0, 7); c.fill(); }
  if (o.finial) { const [x, y] = P((ru0 + ru1) / 2, (rv0 + rv1) / 2, rH); c.strokeStyle = INK; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 9); c.stroke(); c.fillStyle = o.finialCol || "#e0b64e"; c.beginPath(); c.arc(x, y - 10, 2.6, 0, 7); c.fill(); c.lineWidth = 0.9; c.stroke(); }
}
// timber pavilion body: pillars + painted wall panels + low plinth; returns nothing
export function pavilionBody(k, u, v, du, dv, h, o = {}) {
  const c = k.ctx, wall = o.wall || "#f3ead7", post = o.post || "#a8342b";
  k.box(u - 0.08, v - 0.08, 0, du + 0.16, dv + 0.16, 0.14, o.plinth || "#cfc7b6", { hatch: false });
  const f = k.box(u, v, 0.14, du, dv, h, wall, { hatch: false, shadow: false, top: shade(wall, -0.1) });
  // pillars + lattice panels on the two visible faces
  const nL = o.nL ?? Math.max(2, Math.round(du / 0.55)), nR = o.nR ?? Math.max(2, Math.round(dv / 0.55));
  const pil = (a, b, z0, z1) => { c.strokeStyle = INK; c.lineWidth = 4.2; c.lineCap = "round"; c.beginPath(); c.moveTo(...P(a, b, z0)); c.lineTo(...P(a, b, z1)); c.stroke(); c.strokeStyle = post; c.lineWidth = 2.6; c.stroke(); };
  for (let i = 0; i <= nL; i++) pil(u + (du * i) / nL, v + dv, 0.14, 0.14 + h);
  for (let i = 0; i <= nR; i++) pil(u + du, v + (dv * i) / nR, 0.14, 0.14 + h);
  // lattice windows
  const win = (a0, a1, b, side) => {
    const q = side === "L" ? [[a0, b, 0.14 + h * 0.2], [a1, b, 0.14 + h * 0.2], [a1, b, 0.14 + h * 0.8], [a0, b, 0.14 + h * 0.8]] : [[b, a0, 0.14 + h * 0.2], [b, a1, 0.14 + h * 0.2], [b, a1, 0.14 + h * 0.8], [b, a0, 0.14 + h * 0.8]];
    k.poly(q, o.glass || "#c9a766", { lw: 0.9, wobble: 0 });
    c.strokeStyle = "rgba(60,30,15,0.7)"; c.lineWidth = 0.7; c.beginPath();
    const P0 = q.map((p) => P(...p));
    for (let i = 1; i < 4; i++) { const s = i / 4; c.moveTo(lerp(P0[0][0], P0[1][0], s), lerp(P0[0][1], P0[1][1], s)); c.lineTo(lerp(P0[3][0], P0[2][0], s), lerp(P0[3][1], P0[2][1], s)); }
    for (let i = 1; i < 3; i++) { const s = i / 3; c.moveTo(lerp(P0[0][0], P0[3][0], s), lerp(P0[0][1], P0[3][1], s)); c.lineTo(lerp(P0[1][0], P0[2][0], s), lerp(P0[1][1], P0[2][1], s)); }
    c.stroke();
  };
  for (let i = 0; i < nL; i++) win(u + (du * (i + 0.12)) / nL, u + (du * (i + 0.88)) / nL, v + dv, "L");
  for (let i = 0; i < nR; i++) win(v + (dv * (i + 0.12)) / nR, v + (dv * (i + 0.88)) / nR, u + du, "R");
  return f;
}

// ---------- signs, lanterns, flags ----------
export function textSign(k, x, y, w, h, text, o = {}) {
  const c = k.ctx;
  c.save();
  c.fillStyle = o.bg || "#c9322b"; c.strokeStyle = INK; c.lineWidth = o.lw ?? 1.1;
  c.beginPath(); c.roundRect(x - w / 2, y - h / 2, w, h, o.r ?? 1.5); c.fill(); c.stroke();
  c.fillStyle = o.fg || "#ffe9a0"; c.font = `${o.weight || "bold"} ${o.size || h * 0.62}px ${o.font || '"PingFang SC","STHeiti","Heiti SC",sans-serif'}`;
  c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText(text, x, y + 0.5, w - 2);
  c.restore();
}
export function neon(k, x, y, text, o = {}) {
  const c = k.ctx, t = k.t, ph = o.phase ?? 0, w = o.w ?? Math.max(18, text.length * (o.size ?? 9) * 0.95), h = o.h ?? (o.size ?? 9) + 5;
  const on = o.blink ? (Math.sin(t * (o.blink) + ph * 7) > -0.35 ? 1 : 0.35) : 1;
  c.save();
  c.fillStyle = o.bg || "#1c1620"; c.strokeStyle = INK; c.lineWidth = 1.1;
  c.beginPath(); c.roundRect(x - w / 2, y - h / 2, w, h, 2); c.fill(); c.stroke();
  c.shadowColor = o.col || "#ff4a7a"; c.shadowBlur = 8 * on; c.fillStyle = o.col || "#ff7aa0"; c.globalAlpha = 0.45 + 0.55 * on;
  c.font = `bold ${o.size ?? 9}px ${o.font || '"PingFang SC","STHeiti",sans-serif'}`; c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText(text, x, y + 0.5, w - 3);
  c.restore();
}
export function lantern(k, x, y, o = {}) {
  const c = k.ctx, t = k.t, s = o.s ?? 1, sw = Math.sin(t * 1.9 + (o.ph ?? 0)) * 2.6 * s;
  c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x + sw * 0.5, y + 6 * s); c.stroke();
  const cx = x + sw * 0.5, cy = y + 6 * s + 7 * s;
  c.fillStyle = o.col || "#d8392e";
  c.beginPath(); c.ellipse(cx, cy, 6 * s, 7.5 * s, 0, 0, 7); c.fill(); c.lineWidth = 1.2; c.stroke();
  c.strokeStyle = "rgba(60,10,5,0.45)"; c.lineWidth = 0.8; c.beginPath(); c.ellipse(cx, cy, 2.6 * s, 7.4 * s, 0, 0, 7); c.stroke();
  c.fillStyle = "#e8bd4a"; c.fillRect(cx - 3 * s, cy - 8.4 * s, 6 * s, 2 * s); c.fillRect(cx - 3 * s, cy + 6.4 * s, 6 * s, 2 * s);
  c.strokeStyle = "#e8bd4a"; c.lineWidth = 1; c.beginPath(); c.moveTo(cx, cy + 8.4 * s); c.lineTo(cx + sw * 0.2, cy + 15 * s); c.stroke();
  c.save(); c.globalAlpha = 0.22 + 0.06 * Math.sin(t * 5 + (o.ph ?? 0)); c.fillStyle = "#ffb35a"; c.beginPath(); c.arc(cx, cy, 11 * s, 0, 7); c.fill(); c.restore();
}

// ---------- water life ----------
export function wake(k, u, v, du, dv, o = {}) {
  const c = k.ctx, L = Math.hypot(du, dv) || 1, nu = du / L, nv = dv / L;
  c.save(); c.lineCap = "round";
  for (let i = 1; i <= 4; i++) {
    const back = i * 0.42 * (o.len ?? 1), sp = i * 0.14 * (o.spread ?? 1);
    c.globalAlpha = (0.7 - i * 0.14) * (o.alpha ?? 1); c.strokeStyle = "rgba(255,255,255,0.95)"; c.lineWidth = 1.6;
    for (const s of [-1, 1]) { const p = P(u - nu * back - nv * sp * s, v - nv * back + nu * sp * s, 0); const q = P(u - nu * (back + 0.3) - nv * (sp + 0.1) * s, v - nv * (back + 0.3) + nu * (sp + 0.1) * s, 0); c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); }
  }
  c.restore();
}
export function koi(k, x, y, ang, o = {}) {
  const c = k.ctx, t = k.t, s = o.s ?? 1, tail = Math.sin(t * 6 + (o.ph ?? 0)) * 0.5;
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s * 0.62);
  c.fillStyle = o.col || "#f08a3c"; c.strokeStyle = "rgba(40,30,20,0.7)"; c.lineWidth = 1 / s;
  // tail
  c.beginPath(); c.moveTo(-7, 0); c.quadraticCurveTo(-12, -4 + tail * 4, -15, -5 + tail * 7); c.quadraticCurveTo(-12, 0 + tail * 2, -15, 5 + tail * 7); c.quadraticCurveTo(-12, 4 + tail * 4, -7, 0); c.fill(); c.stroke();
  c.beginPath(); c.ellipse(0, 0, 9, 3.8, 0, 0, 7); c.fill(); c.stroke();
  c.fillStyle = o.spot || "#fff6ea"; c.beginPath(); c.ellipse(-1, -0.5, 3.4, 2.2, 0, 0, 7); c.fill();
  c.fillStyle = "#c9302a"; c.beginPath(); c.ellipse(3, 0.4, 2, 1.5, 0, 0, 7); c.fill();
  c.restore();
}

// ---------- people ----------
// crowd: n people spread over routes, each with varied outfit. specs: [route, offset, seed, extra]
export function crowd(k, routes, specs, base = {}) {
  for (const [r, off, seed, extra] of specs) {
    const path = routes[r];
    k.qwalker(path, { speed: 0.4 + (seed % 5) * 0.03, offset: off, seed, dwell: 1.0 + (seed % 3) * 0.6, ...base, ...(extra || {}) });
  }
}
// closed-loop walker on a path of points (list of [u,v]); z lifts the person (decks)
export function loopWalker(k, pts, o) {
  const z = o.z ?? 0;
  const st = k.walkerState(pts, { loop: true, speed: o.speed ?? 0.4, offset: o.offset ?? 0 });
  k.q(st.u + st.v + (o.depthBias ?? 0.05), () => k.walker(pts, { loop: true, speed: o.speed ?? 0.4, offset: o.offset ?? 0, seed: o.seed, z, ...(o.extra || {}) }));
}
// a point on a polyline path moving at speed, wrapping (for vehicles): returns u,v,du,dv
export function along(path, d) {
  let acc = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const [u0, v0] = path[i], [u1, v1] = path[i + 1], L = Math.hypot(u1 - u0, v1 - v0);
    if (d <= acc + L || i === path.length - 2) { const f = clamp((d - acc) / L, 0, 1); return { u: lerp(u0, u1, f), v: lerp(v0, v1, f), du: (u1 - u0) / L, dv: (v1 - v0) / L }; }
    acc += L;
  }
}
export const pathLen = (path) => path.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - path[i][0], p[1] - path[i][1]), 0);

// glass-curtain people shadows etc.
export function drawText(k, x, y, text, size, col = "#2a2420", o = {}) {
  const c = k.ctx; c.save(); c.fillStyle = col; c.font = `${o.weight || "bold"} ${size}px ${o.font || '"PingFang SC","STHeiti",sans-serif'}`; c.textAlign = o.align || "center"; c.textBaseline = "middle"; c.fillText(text, x, y, o.maxW); c.restore();
}

// ---------- prisms + boats ----------
// rotate local (x forward, y left-ish) points into uv about (u,v)
export const rot = (u, v, ang, pts) => pts.map(([x, y]) => [u + x * Math.cos(ang) - y * Math.sin(ang), v + x * Math.sin(ang) + y * Math.cos(ang)]);
export function prism(k, pts, z0, z1, col, o = {}) {
  const c = k.ctx; let area = 0;
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; area += a[0] * b[1] - b[0] * a[1]; }
  const P0 = area >= 0 ? pts : [...pts].reverse(), n = P0.length;
  const faces = [];
  for (let i = 0; i < n; i++) {
    const a = P0[i], b = P0[(i + 1) % n], eu = b[0] - a[0], ev = b[1] - a[1], L = Math.hypot(eu, ev) || 1, nu = ev / L, nv = -eu / L;
    if (nu + nv < -0.02) continue;
    const lit = clamp((nv + 0.15) / (Math.abs(nu) + Math.abs(nv) + 0.3), 0, 1);
    faces.push({ a, b, lit, d: a[0] + a[1] + b[0] + b[1] });
  }
  faces.sort((p, q) => p.d - q.d);
  for (const f of faces) {
    const q = [P(f.a[0], f.a[1], z0), P(f.b[0], f.b[1], z0), P(f.b[0], f.b[1], z1), P(f.a[0], f.a[1], z1)];
    k.path(q, { fill: mix(o.right || shade(col, -0.22), o.left || shade(col, -0.04), f.lit), lw: o.lw ?? k.lw, wobble: 0 });
    if (o.band) { const q2 = [P(f.a[0], f.a[1], z0 + (z1 - z0) * o.band[0]), P(f.b[0], f.b[1], z0 + (z1 - z0) * o.band[0]), P(f.b[0], f.b[1], z0 + (z1 - z0) * o.band[1]), P(f.a[0], f.a[1], z0 + (z1 - z0) * o.band[1])]; k.path(q2, { fill: o.bandCol || "#7aa4bd", lw: 0.7, wobble: 0 }); }
  }
  if (o.top !== false) k.poly(pts.map(([u, v]) => [u, v, z1]), o.topCol || shade(col, 0.12), { lw: o.lw ?? k.lw, wobble: 0 });
}

// passenger boat: kind 'cruise' | 'ferry' | 'barge'. ang = heading in uv plane (0 = +u, PI/2 = +v). people drawn at deck.
export function boat(k, u, v, ang, o = {}) {
  const c = k.ctx, t = k.t, kind = o.kind || "cruise", sc = o.s ?? 1;
  const R = (pts) => rot(u, v, ang, pts.map(([x, y]) => [x * sc, y * sc]));
  const bob = Math.sin(t * 2.1 + (o.ph ?? 0)) * 0.025;
  const hullCol = o.hull || "#f2e9d4", stripe = o.stripe || "#b8342e";
  k.ell(u, v, 0, 1.6 * sc, "rgba(20,60,70,0.18)", { stroke: false });
  const hull = [[-1.7, -0.62], [0.9, -0.74], [1.75, -0.2], [1.85, 0.0], [1.75, 0.2], [0.9, 0.74], [-1.7, 0.62]];
  prism(k, R(hull), -0.08 + bob, 0.34 + bob, hullCol, { band: [0.0, 0.3], bandCol: stripe, left: shade(hullCol, -0.05), right: shade(hullCol, -0.22), topCol: "#c79a62" });
  if (kind === "barge") { prism(k, R([[-1.4, -0.5], [1.2, -0.5], [1.4, 0], [1.2, 0.5], [-1.4, 0.5]]), 0.34 + bob, 0.52 + bob, "#6a5a4a", { topCol: "#8d7a64" }); return { z: 0.5 + bob }; }
  const cab = [[-1.35, -0.5], [0.95, -0.52], [1.2, 0], [0.95, 0.52], [-1.35, 0.5]];
  prism(k, R(cab), 0.34 + bob, 0.78 + bob, "#f4ecd8", { band: [0.28, 0.82], bandCol: "#5f93ad", topCol: "#d7c4a0" });
  // upper deck + rails
  const up = [[-1.2, -0.46], [0.75, -0.48], [0.95, 0], [0.75, 0.48], [-1.2, 0.46]];
  if (kind === "cruise") {
    prism(k, R(up), 0.78 + bob, 1.08 + bob, "#f4ecd8", { band: [0.25, 0.85], bandCol: "#6c9db6", topCol: "#c79a62" });
    // canopy
    const can = [[-1.25, -0.52], [0.85, -0.54], [1.05, 0], [0.85, 0.54], [-1.25, 0.52]];
    for (const [x, y] of [[-1.15, -0.45], [-1.15, 0.45], [0.7, -0.45], [0.7, 0.45]]) { const [pu, pv] = rot(u, v, ang, [[x * sc, y * sc]])[0]; k.line3([[pu, pv, 1.08 + bob], [pu, pv, 1.5 + bob]], { stroke: "#7a5233", lw: 1.6, wobble: 0 }); }
    prism(k, R(can), 1.5 + bob, 1.58 + bob, "#e8b94a", { topCol: "#f2cc66", band: [0, 1], bandCol: "#c9382f" });
    // flag
    const [fu, fv] = R([[-1.2, 0]])[0]; const [fx, fy] = P(fu, fv, 1.58 + bob), [, fy2] = P(fu, fv, 2.1 + bob);
    c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx, fy2); c.stroke();
    c.fillStyle = "#cf3a31"; c.beginPath(); c.moveTo(fx, fy2); c.lineTo(fx + 11 + Math.sin(t * 6) * 2, fy2 + 3); c.lineTo(fx, fy2 + 7); c.fill();
  } else {
    prism(k, R(up), 0.78 + bob, 0.92 + bob, "#e6d9bf", { topCol: "#b8503f" });
  }
  // railing line
  return { z: (kind === "cruise" ? 1.08 : 0.92) + bob, R, bob };
}
// passengers standing along the upper deck of a boat (local coords)
export function deckPeople(k, b, u, v, ang, list, sc = 1) {
  for (const [x, y, seed, pose] of list) {
    const [pu, pv] = rot(u, v, ang, [[x * sc, y * sc]])[0];
    k.person(pu, pv, { z: b.z, seed, pose: pose || "stand", dir: [Math.cos(ang + 1.57 * (y > 0 ? 1 : -1)), Math.sin(ang + 1.57 * (y > 0 ? 1 : -1))], shadow: false, h: 0.62 });
  }
}

// ---------- plants + rocks ----------
export function willow(k, u, v, h, seed, col = "#9bc04c") {
  const c = k.ctx, t = k.t, [bx, by] = P(u, v, 0), [cx, cy] = P(u, v, h);
  k.ell(u + 0.35, v + 0.15, 0, 0.8, "rgba(60,45,30,0.15)", { stroke: false });
  c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 8.5; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx - 3, (by + cy) / 2, cx, cy + 12); c.stroke(); c.strokeStyle = "#8a6a4a"; c.lineWidth = 5.4; c.stroke();
  const R = rng(seed * 9 + 1);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283; k._lobe(cx + Math.cos(a) * 26, cy + Math.sin(a) * 14 - 4, 22, shade(col, (i % 2) * 0.05), seed + i, { bumps: 8 }); }
  k._lobe(cx, cy - 8, 28, shade(col, 0.04), seed + 9, { bumps: 9 });
  for (let i = 0; i < 46; i++) {
    const a = R() * Math.PI * 2, rr = 14 + R() * 38, x0 = cx + Math.cos(a) * rr * 0.95, y0 = cy + Math.sin(a) * rr * 0.4 + 4;
    const len = 30 + R() * 36 * (h / 2.4), sw = Math.sin(t * 1.4 + i * 0.6 + seed) * 2.4 + Math.sin(t * 2.7 + i) * 0.8;
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x0 + sw * 0.4, y0 + len * 0.5, x0 + sw, y0 + len);
    c.strokeStyle = "rgba(42,60,24,0.85)"; c.lineWidth = 3.4; c.stroke(); c.strokeStyle = i % 3 ? shade(col, 0.05) : shade(col, -0.07); c.lineWidth = 2.1; c.stroke();
  }
}
// taihu scholar rock with holes
export function rock(k, u, v, h, w, seed) {
  const c = k.ctx, [x, y] = P(u, v, 0), R = rng(seed * 5 + 2), H = h * CTS.S * CTS.ZS, W = w * CTS.S;
  k.ell(u + 0.3, v + 0.1, 0, w * 0.9, "rgba(60,45,30,0.16)", { stroke: false });
  const pts = []; const N = 18;
  for (let i = 0; i <= N; i++) { const f = i / N, yy = y - f * H, half = W * (0.55 + 0.45 * Math.sin(Math.PI * Math.pow(f, 0.7))) * (0.75 + 0.5 * R()) * (1 - f * 0.35); pts.push([x - half, yy]); }
  for (let i = N; i >= 0; i--) { const f = i / N, yy = y - f * H, half = W * (0.55 + 0.45 * Math.sin(Math.PI * Math.pow(f, 0.7))) * (0.75 + 0.5 * R()) * (1 - f * 0.35); pts.push([x + half, yy]); }
  c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
  const g = c.createLinearGradient(x - W, 0, x + W, 0); g.addColorStop(0, "#c9c2b0"); g.addColorStop(0.6, "#a79f8d"); g.addColorStop(1, "#7a7466");
  c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.6; c.lineJoin = "round"; c.stroke();
  c.save(); c.clip();
  for (let i = 0; i < 3; i++) { const hx = x + (R() - 0.5) * W * 0.8, hy = y - H * (0.25 + 0.5 * R()); c.fillStyle = "#4a463c"; c.beginPath(); c.ellipse(hx, hy, W * (0.1 + 0.08 * R()), H * 0.07, R() - 0.5, 0, 7); c.fill(); c.fillStyle = "rgba(255,255,255,0.35)"; c.beginPath(); c.ellipse(hx - 1, hy + 1.5, W * 0.07, H * 0.03, 0, 0, 7); c.fill(); }
  c.strokeStyle = "rgba(60,55,45,0.45)"; c.lineWidth = 0.9; for (let i = 0; i < 7; i++) { c.beginPath(); const sx = x + (R() - 0.5) * W * 1.2, sy = y - R() * H; c.moveTo(sx, sy); c.quadraticCurveTo(sx + 5, sy - 6, sx + 2, sy - 12); c.stroke(); }
  c.restore();
}
export function bamboo(k, u, v, n, seed, h = 2.0) {
  const c = k.ctx, t = k.t, R = rng(seed * 3 + 1);
  k.ell(u, v, 0, 0.4, "rgba(60,45,30,0.12)", { stroke: false });
  for (let i = 0; i < n; i++) {
    const du = (R() - 0.5) * 0.5, dv = (R() - 0.5) * 0.5, [x, y] = P(u + du, v + dv, 0), hh = h * CTS.S * CTS.ZS * (0.7 + 0.5 * R()), sw = Math.sin(t * 1.3 + i + seed) * 3.2;
    c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 4.4; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + sw * 0.3, y - hh / 2, x + sw, y - hh); c.stroke();
    c.strokeStyle = i % 2 ? "#78a84e" : "#8fbd5c"; c.lineWidth = 2.6; c.stroke();
    for (let j = 1; j < 5; j++) { const f = j / 5, px = x + sw * f * f, py = y - hh * f; c.strokeStyle = "#3d5a2a"; c.lineWidth = 1; c.beginPath(); c.moveTo(px - 2.6, py); c.lineTo(px + 2.6, py); c.stroke(); }
    for (let j = 0; j < 5; j++) { const f = 0.55 + j * 0.1, px = x + sw * f * f, py = y - hh * f, d = (j % 2 ? 1 : -1); c.fillStyle = "#6f9f45"; c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px + d * 10, py - 4 + Math.sin(t * 2 + j + i) * 1.5, px + d * 17, py + 4); c.quadraticCurveTo(px + d * 10, py + 1, px, py); c.fill(); c.stroke(); }
  }
}
