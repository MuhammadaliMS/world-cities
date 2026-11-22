// helpers for Nanjing Road + Maglev tiles
import { P, CTS, INK, shade, mix, lerp, clamp, rng, hash, prism, rot, textSign, glint } from "./_props.js";

export function clockFace(k, face, x, y, z, r, t, ph) {
  const c = k.ctx;
  c.save(); c.translate(...P(x, y, z));
  if (face === "R") c.transform(-CTS.S * CTS.XS, CTS.S * CTS.YS, 0, -CTS.S * CTS.ZS, 0, 0); else c.transform(CTS.S * CTS.XS, CTS.S * CTS.YS, 0, -CTS.S * CTS.ZS, 0, 0);
  c.beginPath(); c.arc(0, 0, r, 0, 7); c.fillStyle = "#f6f1e0"; c.fill(); c.lineWidth = 0.09; c.strokeStyle = "#2a2420"; c.stroke();
  for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283; c.beginPath(); c.moveTo(Math.sin(a) * r * 0.7, -Math.cos(a) * r * 0.7); c.lineTo(Math.sin(a) * r * 0.85, -Math.cos(a) * r * 0.85); c.lineWidth = 0.04; c.stroke(); }
  const m = t * 0.6 + ph, h = t * 0.05 + ph; c.lineCap = "round";
  c.lineWidth = 0.07; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(m) * r * 0.74, -Math.cos(m) * r * 0.74); c.stroke();
  c.lineWidth = 0.1; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(h) * r * 0.48, -Math.cos(h) * r * 0.48); c.stroke();
  c.restore();
}

// shopfront bays on a face: side 'R' (runs along v at u=fixed) or 'L' (runs along u at v=fixed)
export function shopFace(k, side, fixed, a0, a1, n, o = {}) {
  const c = k.ctx, z0 = o.z0 ?? 0.12, z1 = o.z1 ?? 1.0, t = k.t, R = rng(o.seed ?? 5);
  const pt = (a, z, out = 0) => (side === "R" ? P(fixed + out, a, z) : P(a, fixed + out, z));
  const ps = (a, z, out = 0) => (side === "R" ? [fixed + out, a, z] : [a, fixed + out, z]);
  for (let i = 0; i < n; i++) {
    const A = lerp(a0, a1, (i + 0.1) / n), B = lerp(a0, a1, (i + 0.9) / n), M = (A + B) / 2;
    const glow = 0.8 + 0.2 * Math.sin(t * 2 + i * 1.7);
    // arched window with warm light
    const q = [pt(A, z0), pt(B, z0), pt(B, z1 - 0.2), pt(M, z1), pt(A, z1 - 0.2)];
    c.beginPath(); q.forEach((p, j) => (j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
    const g = c.createLinearGradient(0, q[3][1], 0, q[0][1]); g.addColorStop(0, "#ffe9a8"); g.addColorStop(1, "#f2b45a");
    c.fillStyle = g; c.globalAlpha = 0.85 + 0.15 * glow; c.fill(); c.globalAlpha = 1; c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
    // goods: mannequins / shelves in the window
    for (let j = 0; j < 3; j++) { const aa = lerp(A, B, 0.2 + j * 0.3); const [x, y] = pt(aa, z0 + 0.04); c.fillStyle = ["#d9544b", "#3e6fa8", "#e9c24d", "#5f9d6d", "#e581a2", "#7b5fa8"][Math.floor(R() * 6)]; c.fillRect(x - 2.2, y - 9, 4.4, 8); c.fillStyle = "#f1d3b4"; c.beginPath(); c.arc(x, y - 11, 2, 0, 7); c.fill(); }
    c.strokeStyle = "rgba(60,30,10,0.6)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(...pt(M, z0)); c.lineTo(...pt(M, z1)); c.stroke();
    // striped awning on every other bay
    if (!o.noAwn && i % 2 === (o.par ?? 0)) {
      const c1 = o.c1 || "#c9322b", c2 = "#f6efe0", zt = z1 + 0.02, zb = z1 - 0.28, d = 0.42, ns = 4;
      for (let s = 0; s < ns; s++) {
        const aa = lerp(A - 0.05, B + 0.05, s / ns), bb = lerp(A - 0.05, B + 0.05, (s + 1) / ns);
        k.poly([ps(aa, zt, 0.02), ps(bb, zt, 0.02), ps(bb, zb, d), ps(aa, zb, d)], s % 2 ? c2 : c1, { lw: 1, wobble: 0 });
      }
    }
  }
}

// colonial-eclectic facade block: warm stone, shopfronts, upper windows, cornice, slate mansard + dormers
export function facade(k, u, v, du, dv, h, o = {}) {
  const c = k.ctx, side = o.side || "R";
  k.shadow([[u + du, v, 0], [u + du + h * 0.3, v + h * 0.1, 0], [u + du + h * 0.3, v + dv + h * 0.1, 0], [u + du, v + dv, 0]], 0.1);
  k.box(u, v, 0, du, dv, h, o.col || "#e0c493", { hatch: false, shadow: false, left: o.colL || "#ecd3a4", right: o.colR || "#bf9f6c" });
  const ground = o.ground ?? 1.1;
  k.box(u - 0.03, v - 0.03, 0, du + 0.06, dv + 0.06, ground, "#d2b27c", { hatch: false, shadow: false, left: "#dcc08c", right: "#aa8a58" });
  const rowsU = Math.max(2, Math.round((h - ground - 0.3) / 0.6));
  k.windows(u, v, ground + 0.1, du, dv, h - ground - 0.2, { rows: rowsU, cols: Math.max(2, Math.round(dv / 0.55)), side: "R", color: "#5e748a", mx: 0.18, my: 0.1, w: 0.5, h: 0.72, arch: o.arch !== false, lit: 0.12, seed: Math.round(u * 5 + v), balcony: o.balcony, lw: 0.8 });
  k.windows(u, v, ground + 0.1, du, dv, h - ground - 0.2, { rows: rowsU, cols: Math.max(2, Math.round(du / 0.55)), side: "L", color: "#6c849a", mx: 0.18, my: 0.1, w: 0.5, h: 0.72, arch: o.arch !== false, lit: 0.12, seed: Math.round(u * 3 + v * 2), balcony: o.balcony, lw: 0.8 });
  if (o.shopR !== false) shopFace(k, "R", u + du, v + 0.15, v + dv - 0.15, Math.max(2, Math.round(dv / 0.8)), { seed: Math.round(u + v), par: 0 });
  if (o.shopL !== false) shopFace(k, "L", v + dv, u + 0.15, u + du - 0.15, Math.max(2, Math.round(du / 0.8)), { seed: Math.round(u * 2 + v), par: 1, c1: "#2f6a4a" });
  // pilasters
  c.strokeStyle = "rgba(120,90,50,0.5)"; c.lineWidth = 1.2; c.beginPath();
  const nP = Math.round(dv / 0.8);
  for (let i = 0; i <= nP; i++) { const f = i / nP; c.moveTo(...P(u + du, v + dv * f, ground)); c.lineTo(...P(u + du, v + dv * f, h * 0.97)); }
  c.stroke();
  k.box(u - 0.07, v - 0.07, h * 0.96, du + 0.14, dv + 0.14, h * 0.07, "#f0dcb0", { hatch: false, shadow: false });
  if (o.roof !== false) {
    k.hip(u + 0.02, v + 0.02, h * 1.03, du - 0.04, dv - 0.04, o.roofH ?? 0.6, o.roofCol || "#56688a", { inset: o.inset ?? Math.min(du, dv) * 0.28 });
    if (o.dormers) for (let i = 0; i < o.dormers; i++) {
      const f = (i + 0.5) / o.dormers, dz = h * 1.03;
      if (side === "R") { const vv = v + dv * f - 0.14, uu = u + du - 0.55; k.box(uu, vv, dz + 0.05, 0.3, 0.28, 0.32, "#e8d2a2", { hatch: false, shadow: false }); k.hip(uu - 0.03, vv - 0.03, dz + 0.37, 0.36, 0.34, 0.2, "#4a5b7c", { inset: 0.06 }); }
      else { const uu = u + du * f - 0.14, vv = v + dv - 0.55; k.box(uu, vv, dz + 0.05, 0.28, 0.3, 0.32, "#e8d2a2", { hatch: false, shadow: false }); k.hip(uu - 0.03, vv - 0.03, dz + 0.37, 0.34, 0.36, 0.2, "#4a5b7c", { inset: 0.06 }); }
    }
  }
}

// vertical neon banner on a face; chars stacked; chase glow
export function vSign(k, face, fixed, a, z0, z1, chars, cols, ph = 0) {
  const c = k.ctx, t = k.t, w = 0.36;
  const pts = face === "R" ? [[fixed + 0.14, a - w, z0], [fixed + 0.14, a + w, z0], [fixed + 0.14, a + w, z1], [fixed + 0.14, a - w, z1]] : [[a - w, fixed + 0.14, z0], [a + w, fixed + 0.14, z0], [a + w, fixed + 0.14, z1], [a - w, fixed + 0.14, z1]];
  k.poly(pts, "#2b1f2a", { lw: 1.6, wobble: 0 });
  const mid = face === "R" ? P(fixed + 0.14, a, (z0 + z1) / 2) : P(a, fixed + 0.14, (z0 + z1) / 2);
  const n = chars.length, Hh = (z1 - z0) * CTS.S * CTS.ZS;
  c.save(); c.textAlign = "center"; c.textBaseline = "middle";
  chars.split("").forEach((ch, i) => {
    const on = 0.45 + 0.55 * (Math.sin(t * 3 - i * 1.2 + ph) > -0.2 ? 1 : 0.3), y = mid[1] - Hh / 2 + (i + 0.5) * (Hh / n);
    c.shadowColor = cols[i % cols.length]; c.shadowBlur = 9 * on; c.fillStyle = cols[i % cols.length]; c.globalAlpha = on;
    c.font = `bold ${Math.min(14, Hh / n * 0.8)}px "PingFang SC","STHeiti",sans-serif`; c.fillText(ch, mid[0], y);
  });
  c.restore();
  // colored diamonds frame
  c.strokeStyle = cols[0]; c.lineWidth = 1.2; c.globalAlpha = 0.7; c.beginPath(); pts.forEach((p, i) => { const q = P(...p); i ? c.lineTo(...q) : c.moveTo(...q); }); c.closePath(); c.stroke(); c.globalAlpha = 1;
}

export function domeTower(k, u, v, du, dv, z, o = {}) {
  const c = k.ctx, cu = u + du / 2, cv = v + dv / 2, r = Math.min(du, dv) * 0.42;
  k.cyl(cu, cv, z, r, o.drum ?? 0.5, "#e8d4a6");
  k.dome(cu, cv, z + (o.drum ?? 0.5), r * 0.95, o.dh ?? 0.95, o.col || "#4a5b84", { ribs: 6 });
  const [x, y] = P(cu, cv, z + (o.drum ?? 0.5) + (o.dh ?? 0.95)), [, y2] = P(cu, cv, z + (o.drum ?? 0.5) + (o.dh ?? 0.95) + 0.7);
  c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y2); c.stroke(); c.strokeStyle = "#d8b858"; c.lineWidth = 0.9; c.stroke();
  c.fillStyle = "#e0b64e"; c.beginPath(); c.arc(x, y2, 2.2, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
}

// lamp post with hanging red lanterns that sway
export function lanternLamp(k, u, v, ph = 0) {
  const c = k.ctx, t = k.t, [x, y] = P(u, v, 0), [, yt] = P(u, v, 1.75);
  k.ell(u + 0.12, v + 0.05, 0, 0.14, "rgba(60,45,30,0.15)", { stroke: false });
  c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 5.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt); c.stroke(); c.strokeStyle = "#2c3430"; c.lineWidth = 3.2; c.stroke();
  c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.moveTo(x - 9, yt + 4); c.quadraticCurveTo(x, yt - 5, x + 9, yt + 4); c.stroke(); c.strokeStyle = "#2c3430"; c.lineWidth = 1.8; c.stroke();
  for (const dx of [-9, 9, 0]) { const yy = dx === 0 ? yt - 10 : yt + 1; c.fillStyle = "#fff4cf"; c.strokeStyle = INK; c.lineWidth = 1.1; c.beginPath(); c.arc(x + dx, yy, dx === 0 ? 5 : 4.2, 0, 7); c.fill(); c.stroke(); }
  for (const [dx, yy, s] of [[-9, yt + 6, 0.8], [9, yt + 6, 0.8]]) { const sw = Math.sin(t * 1.9 + ph + dx) * 1.8; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x + dx, yy); c.lineTo(x + dx + sw * 0.5, yy + 4); c.stroke(); c.fillStyle = "#d8392e"; c.beginPath(); c.ellipse(x + dx + sw * 0.5, yy + 10, 5, 6.4, 0, 0, 7); c.fill(); c.lineWidth = 1.1; c.stroke(); c.fillStyle = "#e8bd4a"; c.fillRect(x + dx + sw * 0.5 - 2.4, yy + 3.4, 4.8, 1.6); c.fillRect(x + dx + sw * 0.5 - 2.4, yy + 15, 4.8, 1.6); }
}
export function planter(k, u, v, du, dv, seed, tree) {
  k.box(u, v, 0, du, dv, 0.34, "#a5663f", { hatch: false, shadow: false, left: "#b4724a", right: "#85502f" });
  const c = k.ctx; c.save(); c.translate(0, -0.3 * CTS.S * CTS.ZS);
  k.flowers(u + 0.06, v + 0.06, du - 0.12, dv - 0.12, { seed, bed: "#6f9f55", density: 80, cols: ["#e8607a", "#f4c542", "#f39ac0", "#ffffff"] });
  c.restore();
}
