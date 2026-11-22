// Zhujiajiao grid pass helpers: sunk canals, the triple-arch Fangsheng bridge running along u (arches along v faces),
// plane-mirror reflections, poled sampans at water level. Everything is projected through P(u, v, z).
import { P, CTS, INK, shade, lerp, clamp, rng, hash, textSign, lantern, prism, rot } from "./_props.js";

export const ZW = -0.32; // water level (canals are sunk behind stone walls)
export const WATER = [[4.2, 2.5], [6.2, 2.5], [6.2, 6.4], [8.7, 6.4], [8.7, 7.7], [6.2, 7.7], [6.2, 9.0], [4.2, 9.0]];
export const MAIN = { u0: 4.2, u1: 6.2, v0: 2.5, v1: 9.0 };
export const SIDE = { u0: 6.2, u1: 8.7, v0: 6.4, v1: 7.7 };

// ---------------------------------------------------------------- bridge (deck along u, near face on the +v side)
export const BA = [2.6, 4.05], BB = [7.9, 4.05], HW = 0.55, LEN = BB[0] - BA[0];
export const bridgeS = (s, off = 0) => [BA[0] + LEN * s, BA[1] + off];
export const sOfU = (u) => (u - BA[0]) / LEN;
const SPK = sOfU(5.2);
export const zt = (s) => { s = clamp(s, 0, 1); if (s <= SPK) { const f = s / SPK; return 0.12 + 2.35 * (1 - Math.pow(1 - f, 1.7)); } const g = (s - SPK) / (1 - SPK); return 0.12 + 2.35 * (1 - Math.pow(g, 1.7)); };
export const deckZ = (u) => (u <= BA[0] || u >= BB[0] ? 0 : Math.max(0, zt(sOfU(u)) - 0.05));
const STONE_D = "#b7ac95";
// arches [s0, s1, height above base, base z]
export const ARCHES = [[sOfU(3.3), sOfU(4.1), 1.1, 0], [sOfU(4.45), sOfU(5.95), 2.0, ZW], [sOfU(6.3), sOfU(7.1), 1.1, 0]];
export const archTop = (s) => { let z = 0; for (const [s0, s1, h, zb] of ARCHES) if (s > s0 && s < s1) { const m = (s0 + s1) / 2, hf = (s1 - s0) / 2; z = Math.max(z, zb + h * Math.sqrt(Math.max(0, 1 - ((s - m) / hf) ** 2))); } return z; };

export function drawBridge(k, t, q) {
  const c = k.ctx, n = 70, ss = []; for (let i = 0; i <= n; i++) ss.push(i / n);
  const pt = (s, off, z) => { const p = bridgeS(s, off); return [p[0], p[1], z]; };
  const wS0 = sOfU(4.2), wS1 = sOfU(6.2);
  const archPts = (a, steps, off, grow = 0) => { const [s0, s1, h, zb] = a, m = (s0 + s1) / 2, hf = (s1 - s0) / 2, out = []; for (let i = 0; i <= steps; i++) { const g = Math.PI - (Math.PI * i) / steps; out.push(pt(m + Math.cos(g) * (hf + grow / LEN), off, zb + Math.sin(g) * (h + grow))); } return out; };
  const rail = (off, near) => {
    for (let i = 0; i < n; i++) {
      const a = ss[i], b = ss[i + 1], za = zt(a), zb = zt(b), hh = near ? 0.4 : 0.34;
      k.poly([pt(a, off, za - 0.12), pt(b, off, zb - 0.12), pt(b, off, zb + hh), pt(a, off, za + hh)], near ? "#ecdfc4" : "#d9ccae", { lw: 0.7, wobble: 0, stroke: "rgba(60,45,30,0.7)" });
      if (near && i % 2 === 0) { const m = (a + b) / 2, zm = (za + zb) / 2; const [x, y] = P(...pt(m, off, zm + 0.2)); c.strokeStyle = "rgba(110,95,70,0.65)"; c.lineWidth = 0.9; c.beginPath(); c.ellipse(x, y, 3.2, 3.8, 0, 0, 7); c.stroke(); }
    }
    const top = ss.map((s) => pt(s, off, zt(s) + (near ? 0.44 : 0.38)));
    k.line3(top, { stroke: "#f2ecda", lw: 3, wobble: 0 }); k.line3(top, { stroke: INK, lw: 0.8, wobble: 0 });
    for (let i = 0; i <= n; i += 4) { const s = ss[i], p = pt(s, off, 0), z = zt(s); k.box(p[0] - 0.05, p[1] - 0.05, z, 0.1, 0.1, near ? 0.5 : 0.42, near ? "#efe7d3" : "#d9d0ba", { hatch: false, shadow: false }); if (near) { const [x, y] = P(p[0], p[1], z + 0.56); c.fillStyle = "#f6f0de"; c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); c.lineWidth = 0.9; c.strokeStyle = INK; c.stroke(); } }
  };
  const STEP = 0.11, zq = (s) => Math.floor(zt(Math.abs(s - SPK) < 0.05 ? SPK : s) / STEP) * STEP;
  const deck = () => {
    const m = 240, runs = []; let sa = 0, za = zq(0.0025);
    for (let i = 1; i <= m; i++) { const sm = (i - 0.5) / m, z = zq(sm); if (Math.abs(z - za) > 1e-6 || i === m) { runs.push([sa, (i - 1) / m, za]); sa = (i - 1) / m; za = z; } }
    runs[runs.length - 1][1] = 1;
    runs.forEach(([s0, s1, z], idx) => {
      if (s1 - s0 < 1e-4) return;
      k.poly([pt(s0, -HW, z), pt(s1, -HW, z), pt(s1, HW, z), pt(s0, HW, z)], idx % 2 ? "#f1e6cc" : "#e6d9bc", { lw: 0.6, wobble: 0, stroke: "rgba(120,100,70,0.65)" });
      const nx = runs[idx + 1];
      if (nx && nx[2] < z - 1e-6) k.poly([pt(s1, -HW, z), pt(s1, HW, z), pt(s1, HW, nx[2]), pt(s1, -HW, nx[2])], "#c8b894", { lw: 0.6, wobble: 0, stroke: "rgba(90,70,45,0.7)" });
    });
    // centre line carved with a dragon-spine strip on the hump
    k.line3(ss.filter((s) => s > 0.38 && s < 0.6).map((s) => pt(s, 0, zq(s) + 0.005)), { stroke: "rgba(150,120,80,0.5)", lw: 1.2, wobble: 0 });
  };
  const shadowHoles = () => { for (const a of ARCHES) { const pts = archPts(a, 16, -HW); k.poly([...pts, pt(a[1], -HW, a[3]), pt(a[0], -HW, a[3])], "rgba(10,50,50,0.55)", { stroke: false }); } };
  const face = () => {
    const top = ss.map((s) => P(...pt(s, HW, zt(s) - 0.03)));
    c.beginPath();
    const zb = -0.02, zw = ZW - 0.03;
    c.moveTo(...P(...pt(0, HW, zb))); c.lineTo(...P(...pt(wS0, HW, zb))); c.lineTo(...P(...pt(wS0, HW, zw))); c.lineTo(...P(...pt(wS1, HW, zw))); c.lineTo(...P(...pt(wS1, HW, zb))); c.lineTo(...P(...pt(1, HW, zb)));
    for (let i = n; i >= 0; i--) c.lineTo(...top[i]);
    c.closePath();
    for (const a of ARCHES) { const pts = archPts(a, 24, HW); c.moveTo(...P(...pts[0])); for (const p of pts) c.lineTo(...P(...p)); c.closePath(); }
    const g = c.createLinearGradient(...P(...pt(0, HW, 0)), ...P(...pt(1, HW, 0))); g.addColorStop(0, "#ecdfc2"); g.addColorStop(0.5, "#e4d6b8"); g.addColorStop(1, "#d3c4a2");
    c.fillStyle = g; c.fill("evenodd"); c.strokeStyle = INK; c.lineWidth = 1.6; c.lineJoin = "round"; c.stroke();
    c.save(); c.clip("evenodd"); c.strokeStyle = "rgba(110,95,70,0.42)"; c.lineWidth = 0.8; c.beginPath();
    for (let z = -0.3; z < 2.9; z += 0.22) { c.moveTo(...P(...pt(0, HW, z))); c.lineTo(...P(...pt(1, HW, z))); }
    for (let s = 0; s < 1; s += 0.01) for (let z = -0.3; z < 2.9; z += 0.44) { const zz = z + (Math.round(s / 0.01) % 2) * 0.22; c.moveTo(...P(...pt(s, HW, zz))); c.lineTo(...P(...pt(s, HW, zz + 0.22))); }
    c.stroke(); c.restore();
    for (const a of ARCHES) {
      const inner = archPts(a, 28, HW), outer = archPts(a, 28, HW, 0.15);
      c.beginPath(); inner.forEach((p, i) => (i ? c.lineTo(...P(...p)) : c.moveTo(...P(...p)))); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
      c.beginPath(); outer.forEach((p, i) => (i ? c.lineTo(...P(...p)) : c.moveTo(...P(...p)))); c.strokeStyle = "#b5aa92"; c.lineWidth = 2.6; c.stroke();
      c.strokeStyle = "rgba(90,75,55,0.65)"; c.lineWidth = 0.8; c.beginPath(); for (let i = 1; i < 28; i++) { c.moveTo(...P(...inner[i])); c.lineTo(...P(...outer[i])); } c.stroke();
    }
    // waterline moss over the canal span
    k.poly([...ss.filter((s) => s >= wS0 && s <= wS1).map((s) => pt(s, HW + 0.01, ZW + 0.1 + 0.05 * Math.sin(s * 90))), pt(wS1, HW + 0.01, ZW - 0.03), pt(wS0, HW + 0.01, ZW - 0.03)], "rgba(60,110,80,0.35)", { stroke: false });
    k.line3(ss.map((s) => pt(s, HW + 0.02, zt(s) - 0.02)), { stroke: STONE_D, lw: 3.4, wobble: 0 });
  };
  q(9.4, () => { shadowHoles(); rail(-HW, false); });
  q(9.7, () => deck());
  q(9.8, () => face());
  q(10.9, () => { rail(HW, true); const [x, y] = P(...pt(SPK, HW + 0.03, zt(SPK) + 0.18)); textSign(k, x, y, 30, 9, "放生桥", { bg: "#2a2420", fg: "#e8c35a", size: 7 }); });
}

// ---------------------------------------------------------------- plane-mirror reflections (clip to the water first)
// item: { axis: 'u'|'v' (which coordinate is fixed), fixed, a0, a1, bands: [[col, height], ...], a }
export function mirror(k, t, items) {
  const c = k.ctx;
  for (const it of items) {
    const tot = it.bands.reduce((a, b) => a + b[1], 0); let z = 0; const seg = 4;
    for (const [col, hgt] of it.bands) {
      const z0 = z, z1 = z + hgt; z = z1;
      for (let j = 0; j < seg; j++) {
        const za = lerp(z0, z1, j / seg), zb = lerp(z0, z1, (j + 1) / seg), sw = Math.sin(t * 1.5 + za * 6 + (it.fixed || 0) * 3) * 0.045, sw2 = Math.sin(t * 1.5 + zb * 6 + (it.fixed || 0) * 3) * 0.045;
        const A = (a, zz, w) => (it.axis === "v" ? P(a + w, it.fixed, 2 * ZW - zz) : P(it.fixed, a + w, 2 * ZW - zz));
        c.globalAlpha = Math.max(0, (1 - (za + zb) / 2 / (tot + 0.5)) * (it.a ?? 0.38)); c.fillStyle = col; c.beginPath();
        c.moveTo(...A(it.a0, za, sw)); c.lineTo(...A(it.a1, za, sw)); c.lineTo(...A(it.a1, zb, sw2)); c.lineTo(...A(it.a0, zb, sw2)); c.fill();
      }
    }
    c.globalAlpha = 0.3; c.strokeStyle = "rgba(255,255,255,0.7)"; c.lineWidth = 1;
    for (let j = 0; j < 4; j++) { const f = ((j + 0.5) / 4) * tot, wob = Math.sin(t * 1.8 + j * 2.1 + it.fixed) * 3; const A = (a) => (it.axis === "v" ? P(a, it.fixed, 2 * ZW - f) : P(it.fixed, a, 2 * ZW - f)); const p = A(it.a0), r = A(it.a1); c.beginPath(); c.moveTo(p[0] + wob, p[1]); c.lineTo(r[0] + wob, r[1]); c.stroke(); }
    c.globalAlpha = 1;
  }
}

// bridge face reflected (stone columns from the arch crown to the deck line)
export function mirrorBridge(k, t) {
  const c = k.ctx, n = 90;
  for (let i = 0; i < n; i++) {
    const s0 = i / n, s1 = (i + 1) / n, sm = (s0 + s1) / 2, zb = archTop(sm), zh = zt(sm);
    if (zh <= zb) continue;
    const sw = Math.sin(t * 1.5 + sm * 40) * 0.04, A = (s, z) => P(bridgeS(s)[0] + sw, BA[1] + HW, 2 * ZW - z);
    c.globalAlpha = 0.2; c.fillStyle = i % 2 ? "#e4d8be" : "#dccfb2"; c.beginPath();
    c.moveTo(...A(s0, zb)); c.lineTo(...A(s1, zb)); c.lineTo(...A(s1, zh)); c.lineTo(...A(s0, zh)); c.fill();
  }
  c.globalAlpha = 1;
}

// ---------------------------------------------------------------- small props
export function steps(k, u, v, dir, n = 3, o = {}) { // descending stone steps into the canal, toward +u ('u'), -u ('-u'), +v ('v') or -v ('-v')
  const w = o.w ?? 0.8, d = o.d ?? 0.14;
  for (let i = 0; i < n; i++) {
    const top = -0.07 * (i + 1), col = i % 2 ? "#d3c9b0" : "#ddd3ba";
    if (dir === "u") k.box(u + i * d, v, ZW, d, w, top - ZW, col, { hatch: false, shadow: false });
    else if (dir === "-u") k.box(u - (i + 1) * d, v, ZW, d, w, top - ZW, col, { hatch: false, shadow: false });
    else if (dir === "v") k.box(u, v + i * d, ZW, w, d, top - ZW, col, { hatch: false, shadow: false });
    else k.box(u, v - (i + 1) * d, ZW, w, d, top - ZW, col, { hatch: false, shadow: false });
  }
}

export function terrace(k, u, v, col) {
  const c = k.ctx;
  k.cyl(u, v, 0, 0.17, 0.4, "#c99a62", { top: true });
  for (const [a, b] of [[-0.3, 0.05], [0.28, 0.18], [0.0, -0.3]]) k.cyl(u + a, v + b, 0, 0.09, 0.26, "#8a5a36", { top: true });
  const [x, y] = P(u, v, 0), [, yt] = P(u, v, 1.55);
  c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y - 8); c.lineTo(x, yt); c.stroke();
  const rx = 0.68 * CTS.S * 1.3, ry = rx * 0.42;
  c.beginPath(); c.ellipse(x, yt + ry * 0.3, rx, ry, 0, Math.PI, 0); c.quadraticCurveTo(x, yt - ry * 1.5, x - rx, yt + ry * 0.3); c.fillStyle = col; c.fill(); c.lineWidth = 1.4; c.stroke();
  c.strokeStyle = "rgba(255,255,255,0.7)"; c.lineWidth = 1; c.beginPath(); for (let i = 1; i < 4; i++) { c.moveTo(x, yt - ry * 0.7); c.lineTo(x - rx + (rx * 2 * i) / 4, yt + ry * 0.3); } c.stroke();
}

export function shrub(k, u, v, o = {}) {
  const c = k.ctx, t = k.t, r = o.r ?? 0.4, col = o.col || "#7fae52", seed = o.seed ?? Math.round(u * 13 + v * 7), pink = o.pink ?? "#f08bb5";
  const [x, y] = P(u, v, 0), R = r * CTS.S * 1.1, rnd = rng(seed);
  k.ell(u + 0.12, v + 0.06, 0, r, "rgba(50,70,40,0.16)", { stroke: false });
  for (let i = 0; i < 4; i++) { const a = rnd() * 6.28, d = rnd() * R * 0.55; k._lobe(x + Math.cos(a) * d + Math.sin(t * 1.3 + seed + i) * 0.8, y - R * 0.45 + Math.sin(a) * d * 0.5, R * (0.5 + rnd() * 0.25), shade(col, (rnd() - 0.5) * 0.14), seed * 5 + i, { bumps: 6 }); }
  if (pink) for (let i = 0; i < Math.round(8 + r * 22); i++) { const a = rnd() * 6.28, d = Math.sqrt(rnd()) * R * 0.95; const px = x + Math.cos(a) * d, py = y - R * 0.55 + Math.sin(a) * d * 0.6; c.fillStyle = rnd() < 0.7 ? pink : "#ffe3ee"; c.beginPath(); c.arc(px, py, 1.7 + rnd() * 1.3, 0, 7); c.fill(); c.strokeStyle = "rgba(120,30,60,0.35)"; c.lineWidth = 0.6; c.stroke(); }
}

export function pot(k, u, v, seed, z = 0) {
  const c = k.ctx, t = k.t;
  k.cyl(u, v, z, 0.1, 0.16, "#b5663a", { top: true });
  const [x, y] = P(u, v, z + 0.2), sw = Math.sin(t * 1.6 + seed) * 0.8;
  k._lobe(x + sw, y - 6, 8.5, seed % 3 ? "#6fa04a" : "#86b05a", seed, { bumps: 5 });
  c.fillStyle = seed % 2 ? "#f08bb5" : "#e8483a"; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(x + sw + (i - 1) * 4, y - 9 - (i % 2) * 3, 1.8, 0, 7); c.fill(); }
}

// ---------------------------------------------------------------- sampan at water level (zb) with a poling boatman
export function sampanG(k, u, v, ang, o = {}) {
  const c = k.ctx, t = k.t, sc = o.s ?? 1, zb = o.zb ?? ZW, bob = Math.sin(t * 2 + (o.ph ?? 0)) * 0.015, B = zb + bob;
  const R = (pts) => rot(u, v, ang, pts.map(([x, y]) => [x * sc, y * sc]));
  k.ell(u, v, zb, 1.0 * sc, "rgba(15,60,60,0.22)", { stroke: false });
  prism(k, R([[-0.85, -0.2], [0.55, -0.27], [0.95, 0], [0.55, 0.27], [-0.85, 0.2]]), -0.05 + B, 0.2 + B, "#6a4a30", { topCol: "#9a7550", right: "#4c3322", left: "#7a5638", band: [0.55, 0.72], bandCol: o.stripe || "#b8342e" });
  const ribs = [-0.35, -0.1, 0.15, 0.4];
  const arch = (x, y) => rot(u, v, ang, [[x * sc, y * sc]])[0];
  prism(k, R([[-0.45, -0.2], [0.5, -0.2], [0.5, 0.2], [-0.45, 0.2]]), 0.2 + B, 0.34 + B, "#8a6a46", { topCol: "#b08a58", top: false });
  prism(k, R([[-0.45, -0.17], [0.5, -0.17], [0.5, 0.17], [-0.45, 0.17]]), 0.34 + B, 0.47 + B, "#7a5c3c", { topCol: "#b99560" });
  prism(k, R([[-0.45, -0.1], [0.5, -0.1], [0.5, 0.1], [-0.45, 0.1]]), 0.47 + B, 0.55 + B, "#6e5236", { topCol: "#c9a56c" });
  c.strokeStyle = "rgba(60,38,20,0.7)"; c.lineWidth = 0.9; c.beginPath();
  for (const x of ribs) for (const [y, z] of [[-0.19, 0.22], [-0.17, 0.4], [0.17, 0.4], [0.19, 0.22]]) { const [pu, pv] = arch(x, y); c.moveTo(...P(pu, pv, z + B)); }
  c.stroke();
  const [lu, lv] = arch(0.75, 0); const [lx, ly] = P(lu, lv, 0.3 + B); lantern(k, lx, ly - 4, { s: 0.5, ph: o.ph ?? 0 });
  const [su, sv] = arch(-0.65, 0);
  const sw = Math.sin(t * 1.4 + (o.ph ?? 0)), ca = Math.cos(ang), sa = Math.sin(ang);
  const p = k.person(su, sv, { z: 0.2 + B, seed: o.seed ?? 5, pose: "stand", dir: [ca, sa], hat: "sunhat", hatCol: "#e9d9a0", style: "coat", shadow: false });
  const hx = p.hand ? p.hand[0] : p.aR[0], hy = p.hand ? p.hand[1] : p.aR[1];
  const [ex, ey] = P(su - ca * (0.25 - sw * 0.2) + sa * 0.3 * 0 - sa * 0.28, sv - sa * (0.25 - sw * 0.2) + ca * 0.28, zb - 0.22);
  c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 3.2; c.beginPath(); c.moveTo(hx, hy - 10); c.lineTo(ex, ey); c.stroke(); c.strokeStyle = "#caa86a"; c.lineWidth = 1.7; c.stroke();
  c.save(); c.globalAlpha = 0.6; c.strokeStyle = "#fff"; c.lineWidth = 1.2; c.beginPath(); c.ellipse(ex, ey, 5 + Math.abs(sw) * 3, 2.2, 0, 0, 7); c.stroke(); c.restore();
  return { z: 0.2 + B, R };
}

// V wake + foam behind a boat following pos(d) = {u, v, ang}
export function trail(k, pos, d, o = {}) {
  const c = k.ctx, t = k.t, w = o.w ?? 1; c.save(); c.lineCap = "round";
  for (const sd of [-1, 1]) {
    let prev = null;
    for (let j = 0; j <= 12; j++) {
      const p = pos(d - 0.6 * w - j * 0.13), nu = -Math.sin(p.ang), nv = Math.cos(p.ang), off = sd * (0.15 * w + j * 0.02 + Math.sin(t * 6 + j * 1.3) * 0.012);
      const q = P(p.u + nu * off, p.v + nv * off, ZW);
      if (prev) { c.strokeStyle = `rgba(255,255,255,${0.85 * (1 - j / 13)})`; c.lineWidth = 2.2 * (1 - j / 15); c.beginPath(); c.moveTo(...prev); c.lineTo(...q); c.stroke(); }
      prev = q;
    }
  }
  for (let j = 0; j < 8; j++) { const f = (t * 1.1 + j / 8) % 1, p = pos(d - 0.65 * w - f * 1.2), [x, y] = P(p.u, p.v, ZW); c.fillStyle = `rgba(255,255,255,${0.7 * (1 - f)})`; c.beginPath(); c.ellipse(x + Math.sin(j * 2.1) * 2, y, 2.4 + f * 4, 1.1 + f * 1.5, 0, 0, 6.3); c.fill(); }
  const p = pos(d + 0.8 * w), [x, y] = P(p.u, p.v, ZW); c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 1.4; c.beginPath(); c.ellipse(x, y, 6, 2.6, 0, 0, 6.3); c.stroke();
  c.restore();
}
