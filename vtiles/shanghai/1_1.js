// SHANGHAI · Tianzifang shikumen lanes: two-storey grey-and-red brick lane houses, carved stone gate frames with black doors,
// shutters, flower boxes, laundry, lantern strings, cafe tables with seated people, painter, cats, a crowd on the lane.
import { P, CTS, INK, shade, mix, lerp, clamp, rng, hash, lantern, textSign, bamboo } from "./_props.js";
import { lanternString, pot } from "./_h_b.js";

export const camera = { u: 5.0, v: 5.2, z: 1.4, zoom: 2.4 };

const ROOF = "#d0694a", ROOF_D = "#923a28";
const STONE = "#ddd3bf", STONE_D = "#b9ad96";

// ------------------------------------------------------------ face helpers (side L = plane v, runs along u; R = plane u, runs along v)
const F = (side, fixed) => (a, z) => (side === "L" ? P(a, fixed, z) : P(fixed, a, z));
function fpoly(k, f, pts, fill, lw = 1.2, stroke = INK) {
  const c = k.ctx;
  c.beginPath();
  pts.forEach(([a, z], i) => { const [x, y] = f(a, z); i ? c.lineTo(x, y) : c.moveTo(x, y); });
  c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (lw) { c.strokeStyle = stroke; c.lineWidth = lw; c.lineJoin = "round"; c.stroke(); }
}
function fline(k, f, a0, z0, a1, z1, col, lw) { const c = k.ctx; c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(...f(a0, z0)); c.lineTo(...f(a1, z1)); c.stroke(); }
const rect = (a0, a1, z0, z1) => [[a0, z0], [a1, z0], [a1, z1], [a0, z1]];

// grey brick with red courses, cornice, plinth, quoins
function brickFace(k, side, fixed, a0, a1, z0, z1, o = {}) {
  const c = k.ctx, f = F(side, fixed), base = o.col || (side === "L" ? "#928d8c" : "#706a6c");
  fpoly(k, f, rect(a0, a1, z0, z1), base, 1.6);
  const R = rng((o.seed || 1) * 13 + 7);
  const n = Math.round((a1 - a0) * (z1 - z0) * 11);
  for (let i = 0; i < n; i++) {
    const a = a0 + R() * (a1 - a0 - 0.24), z = z0 + R() * (z1 - z0 - 0.1), r = R();
    c.fillStyle = r < 0.3 ? "rgba(255,255,255,0.11)" : r < 0.62 ? "rgba(20,15,34,0.15)" : "rgba(192,98,64,0.30)";
    c.beginPath(); [[a, z], [a + 0.24, z], [a + 0.24, z + 0.1], [a, z + 0.1]].forEach(([p, q], j) => { const [x, y] = f(p, q); j ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); c.fill();
  }
  c.strokeStyle = "rgba(25,20,34,0.2)"; c.lineWidth = 0.6; c.beginPath();
  for (let z = z0 + 0.17; z < z1 - 0.05; z += 0.17) { c.moveTo(...f(a0, z)); c.lineTo(...f(a1, z)); }
  c.stroke();
  for (const zb of o.bands || []) {
    fpoly(k, f, rect(a0, a1, zb, zb + 0.2), "rgba(196,98,62,0.88)", 0);
    fline(k, f, a0, zb + 0.2, a1, zb + 0.2, "rgba(60,25,18,0.45)", 0.8); fline(k, f, a0, zb, a1, zb, "rgba(60,25,18,0.45)", 0.8);
  }
  // plinth
  fpoly(k, f, rect(a0, a1, z0, z0 + 0.22), side === "L" ? "#7e7a82" : "#605d6a", 0.8);
  // quoins on the outer edge
  const qa = o.quoin === "a0" ? a0 : a1, qd = o.quoin === "a0" ? 0.15 : -0.15;
  if (o.quoin !== "none") for (let z = z0 + 0.25, j = 0; z < z1 - 0.3; z += 0.34, j++) fpoly(k, f, rect(qa, qa + qd * (j % 2 ? 0.7 : 1.2), z, z + 0.26), j % 2 ? "#b4573c" : "#c4694a", 0.6);
  if (o.cornice !== false) {
    fpoly(k, f, rect(a0 - 0.06, a1 + 0.06, z1 - 0.2, z1), STONE, 1);
    fline(k, f, a0, z1 - 0.2, a1, z1 - 0.2, "rgba(0,0,0,0.25)", 1.2);
  }
}
// arched shuttered window; o: shut, box, lit, flowers
function win(k, side, fixed, a, zb, o = {}) {
  const c = k.ctx, f = F(side, fixed), w = o.w ?? 0.56, h = (o.h ?? 1.3) * 0.88, seed = o.seed || 1;
  const arch = () => { c.beginPath(); c.moveTo(...f(a, zb)); c.lineTo(...f(a + w, zb)); c.lineTo(...f(a + w, zb + h)); c.quadraticCurveTo(...f(a + w / 2, zb + h + 0.46), ...f(a, zb + h)); c.closePath(); };
  // red brick arch ring
  c.lineJoin = "round"; arch(); c.strokeStyle = "#c0603e"; c.lineWidth = 5; c.stroke();
  const litW = o.lit ?? (hash(seed * 3.7 + a) < 0.65); arch(); c.fillStyle = litW ? "#e6aa4c" : "#4d4448"; c.fill();
  c.save(); arch(); c.clip();
  const g = c.createLinearGradient(...f(a, zb + h), ...f(a, zb)); g.addColorStop(0, "rgba(90,50,20,0.55)"); g.addColorStop(0.5, "rgba(255,225,140,0.1)"); g.addColorStop(1, "rgba(255,215,120,0.0)");
  c.fillStyle = g; c.fillRect(0, 0, 1024, 1024);
  c.restore();
  arch(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
  c.strokeStyle = "#5b3a20"; c.lineWidth = 1.1; c.beginPath();
  c.moveTo(...f(a + w / 2, zb)); c.lineTo(...f(a + w / 2, zb + h + 0.22));
  c.moveTo(...f(a, zb + h * 0.5)); c.lineTo(...f(a + w, zb + h * 0.5));
  c.moveTo(...f(a, zb + h * 0.82)); c.lineTo(...f(a + w, zb + h * 0.82)); c.stroke();
  // sill
  fpoly(k, f, rect(a - 0.08, a + w + 0.08, zb - 0.07, zb), STONE, 0.9);
  // shutters (open, louvred)
  if (o.shut !== false) for (const s of [-1, 1]) {
    const x0 = s < 0 ? a - 0.31 : a + w + 0.02, x1 = x0 + 0.29;
    fpoly(k, f, rect(x0, x1, zb - 0.02, zb + h + 0.06), "#7b4a2b", 1.1);
    c.strokeStyle = "rgba(30,15,6,0.5)"; c.lineWidth = 0.7; c.beginPath();
    for (let z = zb + 0.1; z < zb + h; z += 0.13) { c.moveTo(...f(x0, z)); c.lineTo(...f(x1, z)); }
    c.stroke();
  }
  if (o.box) {
    fpoly(k, f, rect(a - 0.12, a + w + 0.12, zb - 0.3, zb - 0.07), "#8a5a36", 1);
    const R = rng(seed * 5 + 1), cols = o.fl || ["#f39ac0", "#fff", "#e8607a", "#f7c6dc"];
    for (let i = 0; i < 12; i++) { const [x, y] = f(a - 0.08 + (i / 11) * (w + 0.16), zb - 0.05 + R() * 0.12); c.fillStyle = i % 3 === 2 ? "#6f9f4e" : cols[i % cols.length]; c.beginPath(); c.arc(x, y - 1, 2.6 + R(), 0, 7); c.fill(); }
  }
}
// carved stone shikumen gate with black wooden doors
function gate(k, side, fixed, a0, w, h, o = {}) {
  const c = k.ctx, f = F(side, fixed), t = k.t, pw = 0.28, am = a0 + w / 2;
  // pilasters + plinth
  for (const [x0, x1] of [[a0 - pw, a0], [a0 + w, a0 + w + pw]]) {
    fpoly(k, f, rect(x0, x1, 0, h + 0.3), STONE, 1.3);
    for (let z = 0.3; z < h + 0.3; z += 0.38) fline(k, f, x0, z, x1, z, "rgba(100,85,60,0.35)", 0.8);
    fpoly(k, f, rect(x0 - 0.04, x1 + 0.04, 0, 0.2), STONE_D, 1);
    fpoly(k, f, rect(x0 - 0.04, x1 + 0.04, h + 0.2, h + 0.34), "#efe7d4", 1);
  }
  // passage
  const arch = () => { c.beginPath(); c.moveTo(...f(a0, 0)); c.lineTo(...f(a0 + w, 0)); c.lineTo(...f(a0 + w, h - 0.35)); c.quadraticCurveTo(...f(am, h + 0.35), ...f(a0, h - 0.35)); c.closePath(); };
  arch(); c.fillStyle = "#3a2d28"; c.fill();
  c.save(); arch(); c.clip();
  const [lx, ly] = f(am, 0.3); // inner glow + hanging lantern
  const gr = c.createRadialGradient(lx, ly - 30, 3, lx, ly - 30, 60); gr.addColorStop(0, "rgba(255,200,120,0.55)"); gr.addColorStop(1, "rgba(255,200,120,0)"); c.fillStyle = gr; c.fillRect(lx - 70, ly - 100, 140, 140);
  c.restore();
  // black door leaves (one swung open on the left, one closed on the right)
  const leaf = (x0, x1) => { fpoly(k, f, rect(x0, x1, 0.04, h - 0.3), "#231b18", 1.2); c.strokeStyle = "rgba(255,255,255,0.12)"; c.lineWidth = 0.8; for (let z = 0.4; z < h - 0.3; z += 0.55) { c.beginPath(); c.moveTo(...f(x0 + 0.05, z)); c.lineTo(...f(x1 - 0.05, z)); c.stroke(); } };
  if (o.open) { leaf(a0 + w * 0.04, a0 + w * 0.2); fpoly(k, f, rect(am + 0.04, a0 + w - 0.02, 0.04, h - 0.3), "#3f3430", 1); }
  else { leaf(a0, am - 0.01); leaf(am + 0.01, a0 + w); }
  c.fillStyle = "#e8bd4a"; for (const q of [am - 0.1, am + 0.1]) { const [x, y] = f(q, h * 0.42); c.beginPath(); c.arc(x, y, 2, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.6; c.stroke(); }
  arch(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
  // voussoir ring
  c.beginPath(); c.moveTo(...f(a0 - 0.03, h - 0.35)); c.quadraticCurveTo(...f(am, h + 0.46), ...f(a0 + w + 0.03, h - 0.35)); c.strokeStyle = STONE_D; c.lineWidth = 5; c.stroke(); c.strokeStyle = "#f2ead8"; c.lineWidth = 3; c.stroke();
  { const [kx, ky] = f(am, h + 0.42); c.fillStyle = "#efe7d4"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(kx - 4, ky + 6); c.lineTo(kx + 4, ky + 6); c.lineTo(kx + 5, ky - 6); c.lineTo(kx - 5, ky - 6); c.closePath(); c.fill(); c.stroke(); }
  for (const x0 of [a0 - pw, a0 + w]) { fpoly(k, f, rect(x0 - 0.05, x0 + pw + 0.05, h + 0.06, h + 0.22), "#f2ead8", 1); for (let q = 0; q < 3; q++) fline(k, f, x0 + 0.04 + q * 0.09, h + 0.08, x0 + 0.04 + q * 0.09, h + 0.2, "rgba(110,95,70,0.55)", 0.8); }
  // carved lintel: entablature + pediment with volutes and medallion
  fpoly(k, f, rect(a0 - pw - 0.1, a0 + w + pw + 0.1, h + 0.3, h + 0.5), "#efe7d4", 1.3);
  fline(k, f, a0 - pw - 0.1, h + 0.4, a0 + w + pw + 0.1, h + 0.4, "rgba(110,95,70,0.5)", 0.9);
  const pw2 = pw + 0.04;
  c.beginPath(); c.moveTo(...f(a0 - pw2, h + 0.5)); c.quadraticCurveTo(...f(a0 - 0.05, h + 0.7), ...f(a0 + 0.1, h + 0.92)); c.quadraticCurveTo(...f(am, h + 1.12), ...f(a0 + w - 0.1, h + 0.92)); c.quadraticCurveTo(...f(a0 + w + 0.05, h + 0.7), ...f(a0 + w + pw2, h + 0.5)); c.closePath();
  c.fillStyle = "#f0e8d6"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
  const [mx, my] = f(am, h + 0.78);
  c.strokeStyle = "#a89a80"; c.lineWidth = 1.1; c.fillStyle = "#e4d9c2"; c.beginPath(); c.arc(mx, my, 6, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.arc(mx, my, 3, 0, 7); c.stroke();
  for (const s of [-1, 1]) { const [vx, vy] = f(am + s * 0.46, h + 0.68); c.beginPath(); c.arc(vx, vy, 3.6, 0, 7); c.stroke(); c.beginPath(); c.arc(vx, vy, 1.6, 0, 7); c.stroke(); }
  c.beginPath(); c.moveTo(...f(a0 + 0.05, h + 0.56)); c.quadraticCurveTo(...f(am, h + 0.7), ...f(a0 + w - 0.05, h + 0.56)); c.strokeStyle = "rgba(120,105,80,0.5)"; c.stroke();
  if (o.lantern !== false) { const [x, y] = f(am, h - 0.2); lantern(k, x, y - 4, { s: 0.85, ph: o.ph ?? 1 }); }
  if (o.sign) { const [x, y] = f(am, h + 0.2); textSign(k, x, y, 22, 7, o.sign, { bg: "#2a1f1a", fg: "#e8c35a", size: 6.5 }); }
}
// shop front: dark timber frame + warm lit display
function shopFront(k, side, fixed, a0, a1, z0, z1, seed) {
  const c = k.ctx, f = F(side, fixed), R = rng(seed);
  fpoly(k, f, rect(a0, a1, z0, z1), "#4a3020", 1.4);
  const n = Math.max(2, Math.round((a1 - a0) / 0.55)), cw = (a1 - a0 - 0.1) / n;
  for (let i = 0; i < n; i++) {
    const x0 = a0 + 0.05 + i * cw + 0.03, x1 = x0 + cw - 0.06;
    fpoly(k, f, rect(x0, x1, z0 + 0.1, z1 - 0.1), "#f0bd62", 1);
    // framed pictures / goods
    for (let j = 0; j < 2; j++) { const pa = x0 + 0.05 + R() * (cw - 0.3), pz = z0 + 0.2 + j * ((z1 - z0) * 0.42); fpoly(k, f, rect(pa, pa + 0.2, pz, pz + 0.22), ["#c9564a", "#4a7fa8", "#7fae5a", "#f3e6c2"][Math.floor(R() * 4)], 0.7); }
    c.strokeStyle = "#4a3020"; c.lineWidth = 1.1; c.beginPath(); c.moveTo(...f((x0 + x1) / 2, z0 + 0.1)); c.lineTo(...f((x0 + x1) / 2, z1 - 0.1)); c.stroke();
  }
}

// ------------------------------------------------------------ roofs
function tileRows(k, f, A, B, rows, cols, seed) {
  // A: eave edge [a,z] pair [aL,aR,z], B: ridge. We draw rows between the quad; f maps (u,v,z)->px so pass 3D lerp fn
}
function roofU(k, u0, u1, v0, v1, z, rise, o = {}) {
  const c = k.ctx, vm = (v0 + v1) / 2, oh = 0.3, ev = v1 + oh, ez = z - 0.2, R = rng((o.seed || 1) * 9 + 3);
  const at = (a, s) => P(a, lerp(ev, vm, s), lerp(ez, z + rise, s)); // s 0 eave -> 1 ridge
  const ua = u0 - 0.08, ub = u1 + 0.08;
  // eave shadow on wall
  k.poly([[u0, v1, z], [u1, v1, z], [u1, v1, z - 0.45], [u0, v1, z - 0.45]], "rgba(25,12,12,0.28)", { lw: 0, wobble: 0 });
  c.beginPath(); c.moveTo(...at(ua, 0)); c.lineTo(...at(ub, 0)); c.lineTo(...at(ub, 1)); c.lineTo(...at(ua, 1)); c.closePath(); c.fillStyle = ROOF; c.fill();
  const rows = 11;
  for (let r = 0; r < rows; r++) {
    const s0 = r / rows, s1 = (r + 1) / rows, sh = (R() - 0.5) * 0.22;
    c.beginPath(); c.moveTo(...at(ua, s0)); c.lineTo(...at(ub, s0)); c.lineTo(...at(ub, s1)); c.lineTo(...at(ua, s1)); c.closePath();
    c.fillStyle = shade(ROOF, sh - (r % 2 ? 0.04 : 0)); c.fill();
    c.strokeStyle = "rgba(70,20,12,0.5)"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(...at(ua, s1)); c.lineTo(...at(ub, s1)); c.stroke();
    c.strokeStyle = "rgba(70,20,12,0.32)"; c.lineWidth = 0.7; c.beginPath();
    const step = 0.2, off = (r % 2) * step / 2;
    for (let a = ua + off + 0.1; a < ub; a += step) { c.moveTo(...at(a, s0)); c.lineTo(...at(a, s1)); }
    c.stroke();
  }
  c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(...at(ua, 0)); c.lineTo(...at(ub, 0)); c.lineTo(...at(ub, 1)); c.lineTo(...at(ua, 1)); c.closePath(); c.stroke();
  c.strokeStyle = ROOF_D; c.lineWidth = 3.2; c.beginPath(); c.moveTo(...at(ua, 1)); c.lineTo(...at(ub, 1)); c.stroke();
  c.strokeStyle = "#d4695a"; c.lineWidth = 1; c.beginPath(); c.moveTo(...at(ua, 0.985)); c.lineTo(...at(ub, 0.985)); c.stroke();
  c.strokeStyle = ROOF_D; c.lineWidth = 2.6; c.beginPath(); c.moveTo(...at(ua, 0.01)); c.lineTo(...at(ub, 0.01)); c.stroke();
  if (o.end) { // gable triangle at u1 on the right face
    const f = F("R", u1);
    c.save(); c.beginPath(); [[v0, z], [v1, z], [vm, z + rise]].forEach(([a, zz], i) => { const [x, y] = f(a, zz); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); c.clip();
    brickFace(k, "R", u1, v0, v1, z - 0.02, z + rise, { seed: (o.seed || 1) + 40, cornice: false, quoin: "none" }); c.restore();
    fpoly(k, f, [[v0, z], [v1, z], [vm, z + rise]], null, 1.5);
    for (const [a, b] of [[[v0, z], [vm, z + rise]], [[v1, z], [vm, z + rise]]]) { fline(k, f, a[0], a[1], b[0], b[1], INK, 6); fline(k, f, a[0], a[1], b[0], b[1], STONE, 3.6); }
    if (o.gwin) win(k, "R", u1, o.gwin.a, o.gwin.z, { w: 0.56, h: 0.8, seed: 3, shut: true });
  }
}
function roofV(k, u0, u1, v0, v1, z, rise, o = {}) {
  const c = k.ctx, um = (u0 + u1) / 2, oh = 0.3, eu = u1 + oh, ez = z - 0.2, R = rng((o.seed || 1) * 9 + 5);
  const at = (a, s) => P(lerp(eu, um, s), a, lerp(ez, z + rise, s));
  const va = v0 - 0.08, vb = v1 + 0.08, sh0 = shade(ROOF, -0.2);
  k.poly([[u1, v0, z], [u1, v1, z], [u1, v1, z - 0.45], [u1, v0, z - 0.45]], "rgba(25,12,12,0.3)", { lw: 0, wobble: 0 });
  // gable triangle at v1 first (face L), then slope on top of it
  if (o.end) {
    const f = F("L", v1);
    c.save(); c.beginPath(); [[u0, z], [u1, z], [um, z + rise]].forEach(([a, zz], i) => { const [x, y] = f(a, zz); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); c.clip();
    brickFace(k, "L", v1, u0, u1, z - 0.02, z + rise, { seed: (o.seed || 1) + 50, cornice: false, quoin: "none" }); c.restore();
    fpoly(k, f, [[u0, z], [u1, z], [um, z + rise]], null, 1.5);
    for (const [a, b] of [[[u0, z], [um, z + rise]], [[u1, z], [um, z + rise]]]) { fline(k, f, a[0], a[1], b[0], b[1], INK, 6); fline(k, f, a[0], a[1], b[0], b[1], STONE, 3.6); }
    if (o.gwin) win(k, "L", v1, o.gwin.a, o.gwin.z, { w: 0.56, h: 0.8, seed: 4, shut: true });
  }
  c.beginPath(); c.moveTo(...at(va, 0)); c.lineTo(...at(vb, 0)); c.lineTo(...at(vb, 1)); c.lineTo(...at(va, 1)); c.closePath(); c.fillStyle = sh0; c.fill();
  const rows = 11;
  for (let r = 0; r < rows; r++) {
    const s0 = r / rows, s1 = (r + 1) / rows, sh = (R() - 0.5) * 0.22;
    c.beginPath(); c.moveTo(...at(va, s0)); c.lineTo(...at(vb, s0)); c.lineTo(...at(vb, s1)); c.lineTo(...at(va, s1)); c.closePath();
    c.fillStyle = shade(sh0, sh - (r % 2 ? 0.04 : 0)); c.fill();
    c.strokeStyle = "rgba(60,15,10,0.55)"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(...at(va, s1)); c.lineTo(...at(vb, s1)); c.stroke();
    c.strokeStyle = "rgba(60,15,10,0.34)"; c.lineWidth = 0.7; c.beginPath();
    const step = 0.2, off = (r % 2) * step / 2;
    for (let a = va + off + 0.1; a < vb; a += step) { c.moveTo(...at(a, s0)); c.lineTo(...at(a, s1)); }
    c.stroke();
  }
  c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(...at(va, 0)); c.lineTo(...at(vb, 0)); c.lineTo(...at(vb, 1)); c.lineTo(...at(va, 1)); c.closePath(); c.stroke();
  c.strokeStyle = ROOF_D; c.lineWidth = 3.2; c.beginPath(); c.moveTo(...at(va, 1)); c.lineTo(...at(vb, 1)); c.stroke();
  c.strokeStyle = ROOF_D; c.lineWidth = 2.6; c.beginPath(); c.moveTo(...at(va, 0.01)); c.lineTo(...at(vb, 0.01)); c.stroke();
  if (o.end) { // stone coping continues up the slope edge at v1
    const [x0, y0] = at(vb, 0), [x1, y1] = at(vb, 1);
    c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = STONE; c.lineWidth = 3.6; c.stroke();
  }
}
function chimney(k, u, v, z, h = 0.9) {
  k.box(u, v, z, 0.34, 0.34, h, "#b4593c", { hatch: false, shadow: false, left: "#bf6244", right: "#8f4430", top: "#a8553a" });
  const c = k.ctx; c.strokeStyle = "rgba(60,25,15,0.4)"; c.lineWidth = 0.7; c.beginPath();
  for (let q = 0.18; q < h; q += 0.18) { c.moveTo(...P(u, v + 0.34, z + q)); c.lineTo(...P(u + 0.34, v + 0.34, z + q)); c.lineTo(...P(u + 0.34, v, z + q)); }
  c.stroke();
  k.box(u - 0.05, v - 0.05, z + h, 0.44, 0.44, 0.1, "#cfc8b4", { hatch: false, shadow: false });
  k.box(u + 0.04, v + 0.04, z + h + 0.1, 0.26, 0.26, 0.08, "#8a8478", { hatch: false, shadow: false });
}
function drainpipe(k, side, fixed, a, z0, z1) { const f = F(side, fixed); fline(k, f, a, z0, a, z1, INK, 3.6); fline(k, f, a, z0, a, z1, "#4a4a52", 2.2); }

// walls of a block: L face at v1 (a:u0..u1) and R face at u1 (a:v0..v1)
function walls(k, u0, u1, v0, v1, h, o = {}) {
  k.shadow([[u1, v0, 0], [u1 + h * 0.3, v0 + h * 0.1, 0], [u1 + h * 0.3, v1 + h * 0.1, 0], [u1, v1, 0]], 0.1);
  brickFace(k, "L", v1, u0, u1, 0, h, { seed: o.seed, bands: o.bandsL || [], quoin: o.noQuoin ? "none" : "a1" });
  brickFace(k, "R", u1, v0, v1, 0, h, { seed: (o.seed || 1) + 7, bands: o.bandsR || [], quoin: o.noQuoin ? "none" : "a1" });
}

// ------------------------------------------------------------ props
function table(k, u, v) {
  const c = k.ctx;
  k.ell(u + 0.1, v + 0.06, 0, 0.5, "rgba(60,45,30,0.16)", { stroke: false });
  const [x, y] = P(u, v, 0.46);
  c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(...P(u, v, 0)); c.lineTo(x, y); c.stroke(); c.strokeStyle = "#7a5233"; c.lineWidth = 2; c.stroke();
  k.cyl(u, v, 0.44, 0.4, 0.06, "#efe2c4");
  c.fillStyle = "#fff"; c.strokeStyle = INK; c.lineWidth = 0.8;
  for (const [dx, dy] of [[-0.16, 0.06], [0.14, -0.1], [0.04, 0.16]]) { const [cx, cy] = P(u + dx, v + dy, 0.52); c.beginPath(); c.ellipse(cx, cy, 2.8, 1.7, 0, 0, 7); c.fill(); c.stroke(); }
  const [px, py] = P(u + 0.02, v - 0.02, 0.56); c.fillStyle = "#3f7fa8"; c.beginPath(); c.ellipse(px, py - 2, 3.2, 2.6, 0, 0, 7); c.fill(); c.stroke();
}
function chair(k, u, v, d) { // wicker chair: seat + back on the far side
  k.box(u - 0.17, v - 0.17, 0.0, 0.34, 0.34, 0.3, "#a9784c", { hatch: false, shadow: false, top: "#c99a62" });
  const bu = d[0] > 0.5 ? -1 : d[0] < -0.5 ? 1 : 0, bv = d[1] > 0.5 ? -1 : d[1] < -0.5 ? 1 : 0;
  if (bu || bv) k.box(u + (bu < 0 ? -0.2 : bu > 0 ? 0.16 : -0.17), v + (bv < 0 ? -0.2 : bv > 0 ? 0.16 : -0.17), 0.3, bu ? 0.05 : 0.34, bv ? 0.05 : 0.34, 0.3, "#8a5a3a", { hatch: false, shadow: false });
}
function easel(k, u, v, art) {
  const c = k.ctx, [x, y] = P(u, v, 0);
  c.strokeStyle = "#7a5233"; c.lineWidth = 2.2; c.beginPath(); c.moveTo(x - 9, y); c.lineTo(x, y - 40); c.lineTo(x + 9, y); c.moveTo(x, y - 40); c.lineTo(x + 2, y); c.stroke();
  k.path([[x - 14, y - 44], [x + 14, y - 47], [x + 14, y - 21], [x - 14, y - 18]], { fill: "#fbf6e6", lw: 1.3, wobble: 0 });
  c.save(); c.beginPath(); c.moveTo(x - 12, y - 42); c.lineTo(x + 12, y - 45); c.lineTo(x + 12, y - 23); c.lineTo(x - 12, y - 20); c.closePath(); c.clip();
  const g = c.createLinearGradient(x, y - 45, x, y - 20); g.addColorStop(0, "#9ec6e0"); g.addColorStop(0.55, "#e6d6a0"); g.addColorStop(1, art ? "#6f9f55" : "#c9564a"); c.fillStyle = g; c.fillRect(x - 14, y - 48, 28, 30);
  c.fillStyle = "#d98a3c"; c.beginPath(); c.arc(x + 5, y - 36, 3.2, 0, 7); c.fill();
  c.fillStyle = "#a8553a"; c.fillRect(x - 12, y - 32, 10, 8);
  c.restore();
}
function cat(k, x, y, seed, o = {}) {
  const c = k.ctx, t = k.t, sc = o.s ?? 1, col = o.col || "#d9954c", tl = Math.sin(t * 2.1 + seed) * 5;
  const blink = (t * 0.6 + seed) % 3 < 0.12;
  c.save(); c.translate(x, y); c.scale(sc, sc); c.lineJoin = "round"; c.lineCap = "round";
  c.strokeStyle = INK; c.lineWidth = 4.6; c.beginPath(); c.moveTo(-6, -3); c.quadraticCurveTo(-14, -2 + tl * 0.2, -13 + tl * 0.4, -12 - tl * 0.2); c.stroke();
  c.strokeStyle = col; c.lineWidth = 2.8; c.stroke();
  c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 1.2;
  c.beginPath(); c.ellipse(-1, -5.5, 7, 5, 0, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(1.2, -12.6); c.lineTo(2.2, -17); c.lineTo(4.8, -13.8); c.moveTo(5.4, -13.8); c.lineTo(8.2, -17); c.lineTo(8.6, -12); c.fill(); c.stroke();
  c.beginPath(); c.ellipse(5, -10, 4.4, 3.8, 0, 0, 7); c.fill(); c.stroke();
  c.fillStyle = INK; if (!blink) { c.beginPath(); c.arc(3.6, -10.4, 0.8, 0, 7); c.arc(6.6, -10.4, 0.8, 0, 7); c.fill(); } else { c.fillRect(2.8, -10.5, 1.7, 0.6); c.fillRect(5.8, -10.5, 1.7, 0.6); }
  c.strokeStyle = "rgba(90,45,15,0.55)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-4, -9); c.lineTo(-2, -5.5); c.moveTo(0, -10); c.lineTo(1, -6); c.stroke();
  c.restore();
}
function umbrella(k, u, v, h, r, col) {
  const c = k.ctx, [x, y] = P(u, v, 0), [, yt] = P(u, v, h), rx = r * CTS.S * 1.4, ry = rx * 0.46, n = 8, tip = yt - 20;
  c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, yt); c.stroke();
  const pts = []; for (let i = 0; i <= n; i++) { const a = Math.PI * i / n; pts.push([x - Math.cos(a) * rx, yt + Math.sin(a) * ry]); }
  for (let i = 0; i < n; i++) {
    c.beginPath(); c.moveTo(x, tip); c.lineTo(...pts[i]); c.quadraticCurveTo((pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2 + 5, ...pts[i + 1]); c.closePath();
    c.fillStyle = i % 2 ? "#d9534f" : "#f6efe0"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  }
  // back half of the rim
  c.beginPath(); c.ellipse(x, yt, rx, ry, 0, Math.PI, 2 * Math.PI); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
}
function laundry(k, a, b, n, seed) {
  const c = k.ctx, t = k.t, sag = 9, R = rng(seed * 7 + 2);
  const pt = (f) => [lerp(a[0], b[0], f), lerp(a[1], b[1], f) + Math.sin(Math.PI * f) * sag];
  c.strokeStyle = INK; c.lineWidth = 1.1; c.beginPath(); for (let i = 0; i <= 16; i++) { const p = pt(i / 16); i ? c.lineTo(...p) : c.moveTo(...p); } c.stroke();
  const cols = ["#f2efe6", "#6aa6d8", "#e58a8a", "#ffe08a", "#8cc4a0", "#f7f7f7", "#b79adf"];
  for (let i = 0; i < n; i++) {
    const f = (i + 0.5) / n, [x, y] = pt(f), ph = i * 1.9 + seed, sw = Math.sin(t * 1.8 + ph) * 3 + Math.sin(t * 3.1 + ph * 2) * 1, kind = i % 3, col = cols[(i + seed) % cols.length];
    c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 1;
    if (kind === 0) { const h = 17, w = 12; c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x + w / 2, y); c.lineTo(x + w / 2 + sw, y + h); c.lineTo(x - w / 2 + sw, y + h); c.closePath(); c.fill(); c.stroke(); }
    else if (kind === 1) { c.beginPath(); c.moveTo(x - 9, y); c.lineTo(x + 9, y); c.lineTo(x + 9 + sw * 0.3, y + 5); c.lineTo(x + 4 + sw, y + 8); c.lineTo(x + 4 + sw, y + 20); c.lineTo(x - 4 + sw, y + 20); c.lineTo(x - 4 + sw, y + 8); c.lineTo(x - 9 + sw * 0.3, y + 5); c.closePath(); c.fill(); c.stroke(); }
    else { c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x + 6, y); c.lineTo(x + 7 + sw, y + 18); c.lineTo(x + 1 + sw, y + 18); c.lineTo(x + sw * 0.8, y + 8); c.lineTo(x - 1 + sw * 0.8, y + 18); c.lineTo(x - 7 + sw, y + 18); c.closePath(); c.fillStyle = "#4a6a9a"; c.fill(); c.stroke(); }
    c.fillStyle = "#8a5a36"; c.fillRect(x - 5, y - 1.5, 2, 3); c.fillRect(x + 3, y - 1.5, 2, 3);
  }
}
function birdcage(k, x, y, t) {
  const c = k.ctx, sw = Math.sin(t * 1.5) * 1.6;
  c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y - 20); c.lineTo(x + sw * 0.4, y - 12); c.stroke();
  c.strokeStyle = "#a07a28"; c.lineWidth = 1.4; c.fillStyle = "rgba(255,225,140,0.35)";
  c.beginPath(); c.ellipse(x + sw * 0.4, y, 7, 12, 0, 0, 7); c.fill(); c.stroke();
  c.beginPath(); for (let i = -2; i <= 2; i++) { c.moveTo(x + sw * 0.4 + i * 2.6, y - 11.5 + Math.abs(i) * 1.2); c.lineTo(x + sw * 0.4 + i * 2.6, y + 11.5 - Math.abs(i) * 1.2); } c.stroke();
  c.fillStyle = "#e8c24a"; c.beginPath(); c.arc(x + sw * 0.4, y + 3, 2.4, 0, 7); c.fill();
}
function ivy(k, u, v, z, n, seed, side) {
  const R = rng(seed * 11 + 1);
  for (let i = 0; i < n; i++) {
    const a = R() * 0.7, zz = z + R() * 1.6;
    const [x, y] = side === "R" ? P(u, v + a, zz) : P(u + a, v, zz);
    k._lobe(x, y, 5 + R() * 4, i % 3 ? "#6f9a4a" : "#88b05a", seed * 17 + i, { bumps: 6 });
  }
}
function vase(k, u, v, z, h, col) { k.cyl(u, v, z, 0.1, h, col); k.cyl(u, v, z + h, 0.06, 0.1, shade(col, 0.1)); const c = k.ctx; const [x, y] = P(u, v, z + h * 0.5); c.strokeStyle = "rgba(255,255,255,0.7)"; c.lineWidth = 1; c.beginPath(); c.ellipse(x, y, 4, 3, 0, 0, 7); c.stroke(); }

// ------------------------------------------------------------ the tile
export default function draw(k, t) {
  const c = k.ctx;
  // ---------- ground: cobbles ----------
  k.slab("#cdc2ad", { side: "#dccdb0" });
  c.save(); k._trace([P(0, 0), P(10, 0), P(10, 10), P(0, 10)], true, 0); c.clip();
  const R = rng(5);
  for (let i = 0; i < 620; i++) { const u = R() * 10, v = R() * 10, [x, y] = P(u, v); const r = R(); c.fillStyle = r < 0.4 ? "rgba(255,248,230,0.35)" : r < 0.75 ? "rgba(120,100,80,0.22)" : "rgba(214,160,140,0.25)"; c.beginPath(); c.ellipse(x, y, 5 + R() * 4, 2.3 + R() * 1.4, 0, 0, 7); c.fill(); }
  c.strokeStyle = "rgba(110,90,70,0.28)"; c.lineWidth = 0.8; c.beginPath();
  for (let i = 0; i < 40; i++) { const s = i * 0.25; c.moveTo(...P(s, 0)); c.lineTo(...P(s, 10)); c.moveTo(...P(0, s)); c.lineTo(...P(10, s)); }
  c.stroke();
  k.path2ground([[2.5, 2.4], [3.4, 3.8], [4.6, 5.6], [4.4, 9.9]], 0.14, "rgba(90,75,60,0.35)");
  c.restore();
  k.poly([[0, 0, 0], [10, 0, 0], [10, 10, 0], [0, 10, 0]], null, { lw: 1.6 });

  // ===================================================== buildings (depth sorted by front-right corner)
  // A3: long back-left wing along the left edge, ridge along v (gable faces +v)
  k.q(1.2 + 4.9 - 0.4, () => {
    walls(k, 0, 1.2, 0, 4.9, 4.4, { seed: 1, bandsL: [2.6], bandsR: [2.6] });
    win(k, "L", 4.9, 0.3, 0.75, { seed: 1, h: 1.25, box: true }); win(k, "L", 4.9, 0.3, 3.0, { seed: 2, h: 1.1 });
    win(k, "R", 1.2, 2.05, 0.75, { seed: 3, h: 1.25 }); win(k, "R", 1.2, 2.05, 3.0, { seed: 4, h: 1.1, box: true }); win(k, "R", 1.2, 2.85, 3.0, { seed: 5, h: 1.1 });
    roofV(k, 0, 1.2, 0, 4.9, 4.4, 1.5, { end: true, seed: 2, gwin: { a: 0.32, z: 4.45 } });
    chimney(k, 0.25, 0.7, 5.4, 1.0); chimney(k, 0.25, 2.6, 5.35, 0.9);
  });
  // A4: tiny stub, far left
  k.q(0.6 + 1.3, () => { chimney(k, 0.05, 0.4, 4.7, 0.8); });
  // M: tall main block with gate, ridge along u
  k.q(5.6 + 1.9, () => {
    walls(k, 1.2, 5.6, 0, 1.9, 5.2, { seed: 3, bandsL: [2.7, 4.85], bandsR: [] });
    // second floor windows, balcony rail on two of them
    [1.5, 4.25, 5.0].forEach((a, i) => win(k, "L", 1.9, a, 3.45, { seed: 10 + i, h: 1.35, box: i === 1, lit: i !== 2 }));
    win(k, "L", 1.9, 2.7, 3.5, { seed: 14, h: 1.3, box: true });
    // first floor windows (left of gate, right of stall)
    win(k, "L", 1.9, 1.5, 0.7, { seed: 15, h: 1.55 });
    win(k, "L", 1.9, 5.15, 0.7, { seed: 16, h: 1.55 });
    drainpipe(k, "L", 1.9, 4.0, 0.1, 5.5); drainpipe(k, "L", 1.9, 1.3, 0.1, 5.5);
    roofU(k, 1.2, 5.6, 0, 1.9, 5.2, 1.5, { end: true, seed: 3, gwin: { a: 0.6, z: 5.6 } });
    chimney(k, 2.2, 0.55, 5.8, 1.0); chimney(k, 4.9, 0.6, 5.9, 1.0);
  });
  // gate + stall shop front on M's facade
  k.q(5.6 + 1.9 + 0.02, () => {
    gate(k, "L", 1.9, 2.1, 2.35, 0.9, { open: true, ph: 0.7 });
  });
  k.q(5.4 + 2.2, () => {
    shopFront(k, "L", 1.9, 3.75, 5.05, 0.25, 2.3, 31);
    k.awning(3.6, 1.9, 2.55, 1.6, { stripes: 8, c1: "#e8c486", c2: "#fbf1d8", depth: 0.62, drop: 0.42 });
    const [x, y] = P(4.4, 2.5, 2.25); textSign(k, x, y + 3, 22, 7, "瓷器", { bg: "#2f4a3a", fg: "#f2e6b0", size: 6 });
  });
  // R: right block, ridge along u, lower
  k.q(8.3 + 1.9, () => {
    walls(k, 5.6, 8.3, 0, 1.9, 4.9, { seed: 5, bandsL: [2.7, 4.55], bandsR: [2.7, 4.55] });
    [6.2, 7.5].forEach((a, i) => win(k, "L", 1.9, a, 3.3, { seed: 20 + i, h: 1.35, box: i === 0 }));
    win(k, "L", 1.9, 6.2, 0.7, { seed: 22, h: 1.55 }); win(k, "L", 1.9, 7.5, 0.7, { seed: 23, h: 1.55, box: true });
    win(k, "R", 8.3, 1.0, 0.7, { seed: 24, h: 1.55 }); win(k, "R", 8.3, 1.0, 3.3, { seed: 25, h: 1.35, box: true });
    drainpipe(k, "L", 1.9, 5.85, 0.1, 5.1);
    roofU(k, 5.6, 8.3, 0, 1.9, 4.9, 1.2, { end: true, seed: 5, gwin: { a: 0.8, z: 5.15 } });
    chimney(k, 7.5, 0.6, 5.5, 1.0);
  });
  // A2: shop with awning, gable window above, ridge along v
  k.q(2.9 + 4.9, () => {
    walls(k, 1.2, 2.9, 3.3, 4.9, 3.9, { seed: 7, bandsL: [2.55], bandsR: [2.55] });
    shopFront(k, "L", 4.9, 1.35, 2.75, 0.25, 2.1, 41);
    win(k, "L", 4.9, 1.7, 2.55, { seed: 8, w: 0.7, h: 1.2, box: false });
    win(k, "R", 2.9, 3.9, 0.7, { seed: 9, h: 1.3, box: true });
    roofV(k, 1.2, 2.9, 3.3, 4.9, 3.9, 1.2, { end: true, seed: 6 });
    chimney(k, 1.6, 3.7, 4.5, 0.8);
    k.awning(1.25, 4.9, 2.4, 1.6, { stripes: 8, c1: "#d9534f", c2: "#f6efe0", depth: 0.62, drop: 0.42 });
    const [x, y] = P(2.05, 5.5, 2.1); textSign(k, x, y + 2, 22, 7, "画廊", { bg: "#3a2a22", fg: "#f2d98a", size: 6 });
  });
  // C: front-left house, ridge along u
  k.q(5.0 + 9.8, () => {
    walls(k, 0.2, 5.0, 6.8, 9.8, 3.1, { seed: 9, bandsL: [1.6, 2.7], bandsR: [1.6, 2.7] });
    win(k, "L", 9.8, 0.7, 0.8, { seed: 30, h: 1.4, box: true }); win(k, "L", 9.8, 1.9, 0.8, { seed: 31, h: 1.4 });
    win(k, "R", 5.0, 7.25, 0.8, { seed: 32, h: 1.4, box: true }); win(k, "R", 5.0, 8.65, 0.8, { seed: 33, h: 1.4 });
    roofU(k, 0.2, 5.0, 6.8, 9.8, 3.1, 1.3, { end: true, seed: 8, gwin: { a: 8.0, z: 3.2 } });
    chimney(k, 1.3, 8.0, 3.7, 0.9);
  });
  k.q(5.0 + 9.85, () => { gate(k, "L", 9.8, 3.45, 2.0, 0.9, { ph: 2.1 }); });
  // D: front-right house, ridge along v
  k.q(9.6 + 5.6, () => {
    walls(k, 7.6, 9.6, 2.9, 5.6, 3.1, { seed: 11, bandsL: [1.6, 2.7], bandsR: [1.6, 2.7] });
    win(k, "L", 5.6, 8.2, 0.8, { seed: 34, h: 1.4, box: true });
    win(k, "R", 9.6, 3.5, 0.8, { seed: 35, h: 1.4, box: true });
    roofV(k, 7.6, 9.6, 2.9, 5.6, 3.1, 1.3, { end: true, seed: 9, gwin: { a: 8.45, z: 3.2 } });
    chimney(k, 8.3, 3.7, 3.9, 0.9);
  });
  k.q(9.6 + 5.65, () => { gate(k, "R", 9.6, 4.45, 0.95, 2.0, { ph: 3.3 }); });

  // ---------- vines on the walls
  k.q(0.2 + 9.3, () => { ivy(k, 0.2, 7.0, 0.5, 14, 1, "R"); });
  k.q(9.6 + 6.1, () => { ivy(k, 9.55, 5.7, 0.6, 7, 3, "R"); });
  k.q(5.0 + 9.7, () => { ivy(k, 4.95, 6.9, 0.6, 7, 4, "R"); });

  // ---------- trees
  const tree = (u, v, o) => k.q(u + v + 0.6, () => k.tree(u, v, o));
  tree(0.8, 4.8, { r: 1.55, h: 2.7, seed: 3, col: "#a5b852" });
  tree(8.7, 2.5, { r: 1.3, h: 2.5, seed: 4, col: "#98ae4e" });
  tree(9.7, 7.6, { r: 0.6, h: 1.3, seed: 6, col: "#7fae52" });

  // ---------- courtyard props
  const pots = [[3.1, 9.95], [2.75, 9.95], [4.75, 9.95], [5.35, 9.92], [1.0, 5.3], [0.9, 9.9], [9.85, 4.2], [9.9, 6.3], [1.15, 4.95], [4.4, 2.05], [9.0, 9.4], [9.5, 9.0], [6.0, 2.0], [3.45, 2.0]];
  pots.forEach(([u, v], i) => k.q(u + v + 0.2, () => pot(k, u, v, i % 2 ? "#b86a46" : "#c58a5a", i % 2 ? ["#f39ac0", "#fff"] : ["#e8607a", "#f4c542", "#fff"], i)));
  // big bamboo pot
  k.q(8.0 + 6.4 + 0.3, () => { k.ell(8.1, 6.45, 0, 0.5, "rgba(60,45,30,0.18)", { stroke: false }); k.cyl(8.0, 6.4, 0, 0.42, 0.78, "#a8663c"); k.cyl(8.0, 6.4, 0.78, 0.36, 0.06, "#c58a5a"); bamboo(k, 8.0, 6.4, 7, 7, 3.0); });
  k.q(9.0 + 9.3, () => { k.box(8.5, 9.15, 0, 1.4, 0.55, 0.3, "#cdbd9f", { hatch: false, shadow: false }); k.flowers(8.55, 9.2, 1.3, 0.45, { seed: 8, bed: "#6f9f55", density: 130, cols: ["#f39ac0", "#ffffff", "#e8607a"] }); });
  k.q(7.5 + 9.4, () => { k.box(6.5, 9.45, 0, 1.3, 0.5, 0.28, "#cdbd9f", { hatch: false, shadow: false }); k.flowers(6.55, 9.5, 1.2, 0.4, { seed: 9, bed: "#6f9f55", density: 110, cols: ["#f39ac0", "#fff"] }); });
  k.q(0.6 + 8.6, () => { k.flowers(0.4, 9.2, 0.7, 0.5, { seed: 11, bed: "#6f9f55", density: 80, cols: ["#f39ac0", "#fff"] }); });

  // stall counter + goods
  k.q(4.4 + 2.5 + 0.1, () => {
    k.box(3.8, 2.15, 0, 1.3, 0.5, 0.78, "#7a5233", { hatch: false, shadow: false, top: "#a8774a" });
    [[3.95, 2.35, 0.78, 0.38, "#3f73b5"], [4.25, 2.3, 0.78, 0.3, "#f2efe6"], [4.55, 2.4, 0.78, 0.42, "#3f73b5"], [4.85, 2.32, 0.78, 0.3, "#5f9ec4"], [4.1, 2.45, 0.78, 0.22, "#f2efe6"]].forEach(([u, v, z, h, col]) => vase(k, u, v, z, h, col));
  });
  k.q(5.3 + 2.1, () => { const [x, y] = P(5.35, 2.15, 2.35); birdcage(k, x, y + 18, t); });
  k.qperson(4.3, 2.0, { pose: "stand", dir: [0.1, 1], seed: 208, style: "apron", h: 1.02 });

  // cafe tables with seated people (pose sit + seatZ)
  const cafe = (u, v, um, seats) => {
    k.q(u + v + 0.15, () => table(k, u, v));
    seats.forEach(([dx, dy, d, seed, extra]) => {
      k.q(u + dx + v + dy - 0.12, () => chair(k, u + dx, v + dy, d));
      k.qperson(u + dx, v + dy, { pose: "sit", bench: true, seatZ: 0.32, dir: d, seed, shadow: false, h: 1.02, ...(extra || {}) });
    });
    if (um) k.q(u + v + 2.4, () => umbrella(k, u, v, 2.2, 1.15, um));
  };
  cafe(5.1, 6.3, "#f6efe0", [[-0.7, 0.0, [1, 0.1], 201], [0.7, 0.05, [-1, 0], 202, { gesture: true }], [0.0, -0.7, [0.1, 1], 203]]);
  cafe(7.3, 8.1, null, [[-0.72, 0.0, [1, 0.1], 204], [0.72, 0.08, [-1, -0.1], 205, { gesture: true }], [0.0, 0.7, [0.1, -1], 206], [0.05, -0.7, [0, 1], 209]]);
  // painter at the shop front, easels
  k.q(2.8 + 5.6, () => easel(k, 3.1, 5.5, true)); k.q(1.6 + 5.7, () => easel(k, 1.7, 5.55, false));
  k.qperson(2.45, 5.85, { pose: "paint", dir: [0.8, -0.35], seed: 207, hat: "beret", h: 1.02 });
  // bikes
  k.q(2.0 + 9.85, () => k.bike(2.0, 9.8, { dir: [1, 0.05], col: "#2f6fa8", basket: true })); k.q(9.8 + 7.0, () => k.bike(9.75, 7.0, { dir: [0.05, 1], col: "#3a6a3a" }));
  k.q(5, () => k.lamp(4.1, 3.0, { col: "#3a2a22" }));

  // ---------- life: lane crowd
  const routes = [
    [[2.6, 2.5], [3.3, 3.4], [5.0, 3.8], [6.3, 4.8], [6.5, 6.3], [6.0, 7.4], [5.8, 9.2]],
    [[3.2, 3.7], [5.0, 4.2], [6.6, 4.5], [7.0, 5.9]],
    [[6.3, 2.8], [6.8, 4.0], [6.6, 5.4], [7.2, 6.6], [8.6, 7.6]],
    [[5.5, 8.4], [5.7, 9.4]],
    [[4.2, 3.2], [5.2, 3.5], [5.8, 3.0]],
    [[8.8, 7.2], [9.1, 8.4], [8.5, 8.9]],
    [[2.0, 2.6], [3.0, 2.5], [3.4, 3.2]],
    [[3.6, 6.2], [3.9, 5.4], [3.4, 4.6]],
    [[6.6, 2.4], [7.4, 2.4]],
    [[4.4, 4.8], [5.4, 4.7], [6.0, 5.3]],
  ];
  const specs = [[0, 0.0, 211], [0, 0.5, 212], [1, 0.2, 213], [1, 0.7, 214], [2, 0.3, 215], [2, 0.8, 222], [3, 0.1, 216], [4, 0.6, 217], [5, 0.4, 218], [6, 0.2, 219], [7, 0.5, 220], [8, 0.3, 223], [9, 0.2, 224], [5, 0.9, 225]];
  specs.forEach(([r, off, seed]) => k.qwalker(routes[r], { h: seed % 4 === 0 ? 0.68 : 1.02, speed: 0.36 + (seed % 5) * 0.03, offset: off, seed, dwell: 1.0 + (seed % 3) * 0.6 }));
  k.qperson(5.3, 3.0, { pose: "stand", dir: [0, 1], seed: 226, h: 1.02 });
  k.flush();

  // ---------- overhead layer: cats, laundry, lantern strings, smoke
  const cc = (u, v, z) => P(u, v, z);
  { const [x, y] = cc(3.45 + 1.0, 9.8, 2.0 + 0.3 + 1.12 - 0.02); cat(k, x, y, 1.3, { s: 1.15 }); }
  { const [x, y] = cc(3.15, 1.9, 2.35 + 0.3 + 1.1); cat(k, x, y, 4.1, { s: 1.0, col: "#5a5a60" }); }
  { const [x, y] = cc(9.6, 4.45 + 0.47, 2.0 + 0.3 + 1.12); cat(k, x, y, 7.7, { s: 1.0, col: "#f1ece0" }); }
  laundry(k, P(5.0, 6.9, 2.45), P(7.8, 5.6, 2.45), 7, 2);
  laundry(k, P(1.2, 2.2, 3.1), P(1.2, 3.2, 3.1), 3, 5);
  lanternString(k, P(2.9, 4.9, 2.5), P(5.9, 1.9, 3.0), 7, 0);
  lanternString(k, P(1.35, 4.9, 2.4), P(2.6, 1.9, 2.7), 4, 1);
  lanternString(k, P(2.9, 4.9, 1.9), P(5.0, 6.8, 2.3), 5, 2);
  lanternString(k, P(5.0, 9.0, 2.8), P(9.0, 5.6, 2.8), 9, 3);
  lanternString(k, P(5.9, 1.9, 2.9), P(8.6, 2.9, 2.8), 5, 4);
  for (const [u, v, z] of [[2.4, 0.7, 7.6], [5.1, 0.8, 7.7], [7.7, 0.8, 7.3]]) for (let i = 0; i < 5; i++) { const s = (t * 0.25 + i / 5 + u * 0.1) % 1, [x, y] = P(u, v, z); c.fillStyle = `rgba(240,235,228,${0.5 * (1 - s)})`; c.beginPath(); c.arc(x + Math.sin(t + i) * 4 + s * 14, y - s * 46, 3 + s * 6, 0, 7); c.fill(); }
  k.circlingBird(520, 190, 90, 22, { speed: 0.6, phase: 0 }); k.circlingBird(300, 140, 70, 16, { speed: 0.5, phase: 2 }); k.cloud(160, 200, { s: 0.8, phase: 1 }); k.cloud(850, 170, { s: 0.7, phase: 3 });
}
