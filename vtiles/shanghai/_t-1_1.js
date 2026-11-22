// Zhujiajiao tile helpers: Jiangnan houses with gabled upturned roofs + a diagonal triple-arch stone bridge.
import { P, INK, shade, mix, lerp, clamp, hash, lantern, textSign } from "./_props.js";

// ---------------------------------------------------------------- houses
// o: ridge 'u'|'v' (front = long side, faces the viewer: L face for 'u', R face for 'v'), up 'timber'|'white', sign, seed, rh
export function zhouse(k, u, v, du, dv, h, o = {}) {
  const c = k.ctx, ru = (o.ridge || "u") === "u", run = ru ? du : dv, dep = ru ? dv : du, WH = "#f4efe3";
  const M = (a, b, z) => (ru ? [u + a, v + b, z] : [u + b, v + a, z]);
  const f1 = o.f1 ?? h * 0.5, rh = o.rh ?? 0.36 + dep * 0.11, seed = o.seed ?? 1, TIM = o.timber || "#8d5d38";
  // plinth + ground floor + upper floor
  k.box(u - 0.03, v - 0.03, 0, du + 0.06, dv + 0.06, 0.16, "#b9ae98", { hatch: false, left: "#c6bca6", right: "#9d937f" });
  k.box(u, v, 0.16, du, dv, f1 - 0.16, TIM, { hatch: false, shadow: false, left: shade(TIM, 0.08), right: shade(TIM, -0.14) });
  k.box(u - 0.015, v - 0.015, f1, du + 0.03, dv + 0.03, h - f1, WH, { hatch: false, shadow: false, left: "#f8f4ea", right: "#dcd4c0" });
  // plaster stains
  c.save(); c.globalAlpha = 0.14; c.fillStyle = "#9a8566";
  for (let i = 0; i < 5; i++) { const a = 0.1 + hash(seed * 7 + i) * (run - 0.2), b = f1 + 0.1 + hash(seed * 3 + i) * (h - f1 - 0.25); const [x, y] = P(...M(a, dep + 0.02, b)); c.beginPath(); c.ellipse(x, y, 4 + hash(i + seed) * 5, 2.5, 0, 0, 7); c.fill(); }
  c.restore();
  // timber pillars + lattice bays on the front face
  const bays = Math.max(2, Math.round(run / 0.62)), bw = run / bays, door = o.door ?? Math.floor(bays / 2);
  const fq = (a0, a1, z0, z1) => [M(a0, dep + 0.005, z0), M(a1, dep + 0.005, z0), M(a1, dep + 0.005, z1), M(a0, dep + 0.005, z1)];
  const lattice = (a0, a1, z0, z1, col) => {
    k.poly(fq(a0, a1, z0, z1), col, { lw: 1, wobble: 0 });
    c.strokeStyle = "rgba(70,40,20,0.75)"; c.lineWidth = 0.8; c.beginPath();
    for (let j = 1; j < 3; j++) { const a = lerp(a0, a1, j / 3); c.moveTo(...P(...M(a, dep + 0.01, z0))); c.lineTo(...P(...M(a, dep + 0.01, z1))); }
    for (let j = 1; j < 4; j++) { const z = lerp(z0, z1, j / 4); c.moveTo(...P(...M(a0, dep + 0.01, z))); c.lineTo(...P(...M(a1, dep + 0.01, z))); }
    c.stroke();
  };
  for (let i = 0; i < bays; i++) {
    const a0 = i * bw + 0.07, a1 = (i + 1) * bw - 0.07;
    if (i === door) { k.poly(fq(a0 + 0.04, a1 - 0.04, 0.16, f1 - 0.05), "#4d3020", { lw: 1.1, wobble: 0 }); k.poly(fq(a0 + 0.12, a1 - 0.12, 0.2, f1 - 0.2), "#e9b45f", { lw: 0.8, wobble: 0 }); }
    else lattice(a0, a1, 0.3, f1 - 0.07, hash(i * 5 + seed) < 0.6 ? "#e8b563" : "#d9a04f");
    if (o.up !== "white") lattice(a0, a1, f1 + 0.12, h - 0.14, hash(i * 3 + seed) < 0.5 ? "#e8b563" : "#b98450");
    else { const am = (a0 + a1) / 2; k.poly(fq(am - 0.15, am + 0.15, f1 + 0.2, h - 0.22), "#6a4a2e", { lw: 1, wobble: 0 }); k.line3([M(am, dep + 0.01, f1 + 0.2), M(am, dep + 0.01, h - 0.22)], { lw: 0.8, wobble: 0, stroke: "#2a1a10" }); }
  }
  c.strokeStyle = "#4a2f1a"; c.lineWidth = 2; c.beginPath();
  for (let i = 0; i <= bays; i++) { const a = i * bw; c.moveTo(...P(...M(a, dep + 0.01, 0.16))); c.lineTo(...P(...M(a, dep + 0.01, o.up === "white" ? f1 : h - 0.05))); }
  c.stroke();
  // balcony slab + railing for timber upper floors
  if (o.up !== "white") {
    k.poly([M(0, dep, f1), M(run, dep, f1), M(run, dep + 0.15, f1), M(0, dep + 0.15, f1)], "#6e4528", { lw: 1.1, wobble: 0 });
    k.line3([M(0.02, dep + 0.15, f1 + 0.27), M(run - 0.02, dep + 0.15, f1 + 0.27)], { lw: 1.6, wobble: 0 });
    c.strokeStyle = "rgba(60,35,20,0.9)"; c.lineWidth = 0.9; c.beginPath();
    for (let a = 0.06; a < run; a += 0.13) { c.moveTo(...P(...M(a, dep + 0.15, f1))); c.lineTo(...P(...M(a, dep + 0.15, f1 + 0.27))); }
    c.stroke();
  }
  // ground-floor lattice on the gable-end face + one small upper window
  const gside = ru ? "R" : "L", gcols = Math.max(1, Math.round(dep / 0.6));
  k.windows(u, v, 0.16, du, dv, f1 - 0.16, { rows: 1, cols: gcols, side: gside, color: "#d9a862", mx: 0.12, my: 0.1, base: 0.12, w: 0.78, h: 0.8, lw: 0.9 });
  k.windows(u - 0.015, v - 0.015, f1, du + 0.03, dv + 0.03, h - f1, { rows: 1, cols: 1, side: gside, color: "#6a4a2e", mx: Math.max(0.2, dep / 2 - 0.2), my: 0.1, base: 0.18, w: 0.8, h: 0.62, lw: 0.9 });
  // stepped horse-head (wudang) walls: far end (behind the roof) and near gable end
  const stepWall = (a, col) => {
    const pts = [[-0.03, h - 0.02]]; const n = 4;
    const rz = (b) => h + rh * (1 - Math.abs(2 * b / dep - 1)) ;
    for (let i = 0; i < n; i++) { const b0 = (i / (2 * n)) * dep, b1 = ((i + 1) / (2 * n)) * dep; pts.push([b0, rz(b1) + 0.16 + 0.04 * i], [b1, rz(b1) + 0.16 + 0.04 * i]); }
    pts.push([dep / 2, rz(dep / 2) + 0.4]);
    for (let i = n - 1; i >= 0; i--) { const b0 = dep - (i / (2 * n)) * dep, b1 = dep - ((i + 1) / (2 * n)) * dep; pts.push([b0, rz(b1) + 0.16 + 0.04 * i], [b1, rz(b1) + 0.16 + 0.04 * i]); }
    pts.push([dep + 0.03, h - 0.02]);
    const poly = pts.map(([b, z]) => M(a, b, z));
    k.poly(poly, col, { lw: 1.3, wobble: 0 });
    // dark cap tiles along the stepped top
    k.line3(pts.slice(1, -1).map(([b, z]) => M(a, b, z + 0.02)), { stroke: "#3c3e44", lw: 2.6, wobble: 0 });
  };
  { const gA = P(...M(0, dep, h)), gB = P(...M(0, dep, f1)); const g2 = c.createLinearGradient(gA[0], gA[1], gB[0], gB[1]); g2.addColorStop(0, "rgba(50,28,10,0.38)"); g2.addColorStop(0.5, "rgba(50,28,10,0.08)"); g2.addColorStop(1, "rgba(50,28,10,0)"); c.fillStyle = g2; c.beginPath(); fq(0, run, f1, h).forEach((p, i) => { const [x, y] = P(...p); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.fill();
    const hA = P(...M(0, dep, f1)), hB = P(...M(0, dep, f1 - 0.4)); const g3 = c.createLinearGradient(hA[0], hA[1], hB[0], hB[1]); g3.addColorStop(0, "rgba(30,14,4,0.4)"); g3.addColorStop(1, "rgba(30,14,4,0)"); c.fillStyle = g3; c.beginPath(); fq(0, run, f1 - 0.4, f1).forEach((p, i) => { const [x, y] = P(...p); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.fill();
    const kA = P(...M(run, 0, h)), kB = P(...M(run, 0, 0.16)); const g4 = c.createLinearGradient(kA[0], kA[1], kB[0], kB[1]); g4.addColorStop(0, "rgba(40,25,10,0.3)"); g4.addColorStop(0.35, "rgba(40,25,10,0)"); g4.addColorStop(1, "rgba(40,25,10,0.12)"); c.fillStyle = g4; c.beginPath(); [M(run + 0.01, 0, 0.16), M(run + 0.01, dep, 0.16), M(run + 0.01, dep, h), M(run + 0.01, 0, h)].forEach((p, i) => { const [x, y] = P(...p); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.fill(); }
  stepWall(-0.04, "#ece5d4");
  // roof: concave curved slope, eaves with upturned corners, real tile rows (scalloped courses), swallow-tail ridge
  const oh = o.over ?? 0.3, ohA = 0.2, lift = 0.24, rcol = o.roofCol || "#58524c";
  const eaveZ = h - 0.04, ridgeZ = h + rh, nS = 20, nF = 8;
  const eZ = (s) => eaveZ - 0.06 * Math.sin(Math.PI * s) + lift * Math.pow(Math.abs(2 * s - 1), 3);
  const rZ = (s) => ridgeZ + 0.16 * Math.pow(Math.abs(2 * s - 1), 4);
  const SF = (s, f) => M(lerp(lerp(-ohA, run + ohA, s), lerp(-0.1, run + 0.1, s), f), lerp(dep + oh, dep / 2, f), lerp(eZ(s), rZ(s), Math.pow(f, 1.55)));
  const edge = [], ridge = [], rside = [], lside = [];
  for (let i = 0; i <= nS; i++) { edge.push(SF(i / nS, 0)); ridge.push(SF(i / nS, 1)); }
  for (let j = 0; j <= nF; j++) { rside.push(SF(1, j / nF)); lside.push(SF(0, j / nF)); }
  const outline = [...edge, ...rside.slice(1), ...ridge.slice().reverse(), ...lside.slice().reverse().slice(1)];
  stepWall(run + 0.0, WH);
  // rafter underside + eave thickness
  c.beginPath(); edge.forEach((p, i) => { const [x, y] = P(...p); i ? c.lineTo(x, y) : c.moveTo(x, y); }); for (let i = nS; i >= 0; i--) { const [x, y] = P(...edge[i]); c.lineTo(x, y + 4); } c.closePath(); c.fillStyle = "#6a4a32"; c.fill();
  k.poly(outline, rcol, { lw: 1.4, wobble: 0 });
  c.save(); k._trace(outline.map((p) => P(...p)), true, 0); c.clip();
  const gr = c.createLinearGradient(...P(...SF(0.5, 0)), ...P(...SF(0.5, 1))); gr.addColorStop(0, "rgba(20,12,6,0.34)"); gr.addColorStop(0.45, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(255,235,200,0.16)");
  c.fillStyle = gr; c.fillRect(0, 0, 1024, 1024);
  const cols = Math.max(8, Math.round(run * 9)), nC = 8;
  c.lineWidth = 0.8; c.strokeStyle = "rgba(15,10,8,0.38)"; c.beginPath();
  for (let i = 1; i < cols; i++) { const s = i / cols; for (let j = 0; j <= nF; j++) { const p = P(...SF(s, j / nF)); j ? c.lineTo(...p) : c.moveTo(...p); } }
  c.stroke();
  c.lineWidth = 1; c.strokeStyle = "rgba(12,8,6,0.62)"; c.beginPath();
  for (let j = 1; j <= nC; j++) { const f = j / (nC + 1); for (let i = 0; i < cols; i++) { const a = P(...SF(i / cols, f)), b = P(...SF((i + 1) / cols, f)); c.moveTo(...a); c.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 3.2, ...b); } }
  c.stroke();
  c.lineWidth = 0.8; c.strokeStyle = "rgba(225,205,175,0.3)"; c.beginPath();
  for (let j = 1; j <= nC; j++) { const f = j / (nC + 1); for (let i = 0; i < cols; i += 2) { const a = P(...SF(i / cols, f)), b = P(...SF((i + 1) / cols, f)); c.moveTo(a[0], a[1] + 1.6); c.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 4.6, b[0], b[1] + 1.6); } }
  c.stroke(); c.restore();
  k.line3(edge, { stroke: "#2a2622", lw: 2.8, wobble: 0 });
  k.line3(rside, { stroke: "#2a2622", lw: 2.2, wobble: 0 });
  k.line3(ridge, { stroke: "#2e2a26", lw: 3.6, wobble: 0 }); k.line3(ridge, { stroke: "#8a847a", lw: 1.1, wobble: 0 });
  for (const e of [ridge[0], ridge[nS]]) { const [x, y] = P(...e); c.fillStyle = "#2e2a26"; c.beginPath(); c.moveTo(x - 4.5, y + 1.5); c.quadraticCurveTo(x - 2, y - 7, x - 4, y - 10); c.quadraticCurveTo(x, y - 6, x + 4, y - 10); c.quadraticCurveTo(x + 2, y - 7, x + 4.5, y + 1.5); c.fill(); }
  for (const e of [edge[0], edge[nS]]) { const [x, y] = P(...e); c.fillStyle = "#2a2622"; c.beginPath(); c.arc(x, y - 1, 2.4, 0, 7); c.fill(); }
  // lanterns under the eave + optional shop sign
  const nl = Math.max(2, Math.round(run / 0.75));
  for (let i = 0; i < nl; i++) { const a = (run * (i + 0.5)) / nl; const [x, y] = P(...M(a, dep + 0.2, f1 + 0.02)); lantern(k, x, y, { s: 0.62, ph: i * 1.7 + u * 3 + v }); }
  if (o.sign) { const [x, y] = P(...M(bw * (door + 0.5), dep + 0.02, f1 - 0.14)); textSign(k, x, y, 24, 8, o.sign, { bg: "#2a1f1a", fg: "#e8c35a", size: 6.5 }); }
}

// ---------------------------------------------------------------- diagonal arch bridge
export const BA = [2.9, 7.2], BB = [8.3, 2.5];
const LEN = Math.hypot(BB[0] - BA[0], BB[1] - BA[1]);
const D = [(BB[0] - BA[0]) / LEN, (BB[1] - BA[1]) / LEN], N = [-D[1], D[0]], HW = 0.62;
export const bridgeS = (s, off = 0) => [BA[0] + (BB[0] - BA[0]) * s + N[0] * off, BA[1] + (BB[1] - BA[1]) * s + N[1] * off];
export const bridgeCoord = (u, v) => ({ s: ((u - BA[0]) * D[0] + (v - BA[1]) * D[1]) / LEN, off: (u - BA[0]) * N[0] + (v - BA[1]) * N[1] });
export const zt = (s) => { s = clamp(s, 0, 1); if (s <= 0.47) { const f = s / 0.47; return 0.55 + 1.95 * (1 - Math.pow(1 - f, 2.0)); } const g = (s - 0.47) / 0.53; return 0.5 + 1.95 * (1 - Math.pow(g, 1.8)); };
const ARCHES = [[0.035, 0.215, 0.95, 12], [0.27, 0.665, 1.95, 26], [0.73, 0.865, 1.1, 12]];
const STONE = "#ddd4bf", STONE_D = "#b7ac95";

export function drawBridge(k, t, q) {
  const c = k.ctx, n = 46, ss = []; for (let i = 0; i <= n; i++) ss.push(i / n);
  const pt = (s, off, z) => { const p = bridgeS(s, off); return [p[0], p[1], z]; };
  const rail = (off, near) => {
    for (let i = 0; i < n; i++) {
      const a = ss[i], b = ss[i + 1], za = zt(a), zb = zt(b), hh = near ? 0.4 : 0.34;
      k.poly([pt(a, off, za - 0.12), pt(b, off, zb - 0.12), pt(b, off, zb + hh), pt(a, off, za + hh)], near ? "#ecdfc4" : "#d9ccae", { lw: 0.7, wobble: 0, stroke: "rgba(60,45,30,0.7)" });
      if (near && i % 2 === 0) { const m = (a + b) / 2, zm = (za + zb) / 2; const [x, y] = P(...pt(m, off, zm + 0.2)); c.strokeStyle = "rgba(110,95,70,0.65)"; c.lineWidth = 0.9; c.beginPath(); c.ellipse(x, y, 3.2, 3.8, 0, 0, 7); c.stroke(); }
    }
    k.line3(ss.map((s) => pt(s, off, zt(s) + (near ? 0.44 : 0.38))), { stroke: "#f2ecda", lw: 3, wobble: 0 }); k.line3(ss.map((s) => pt(s, off, zt(s) + (near ? 0.44 : 0.38))), { stroke: INK, lw: 0.8, wobble: 0 });
    for (let i = 0; i <= n; i += 3) { const s = ss[i], [x, y] = P(...pt(s, off, zt(s) + (near ? 0.5 : 0.42))); k.box(pt(s, off, 0)[0] - 0.05, pt(s, off, 0)[1] - 0.05, zt(s), 0.1, 0.1, near ? 0.5 : 0.42, near ? "#efe7d3" : "#d9d0ba", { hatch: false, shadow: false }); if (near) { c.fillStyle = "#f6f0de"; c.beginPath(); c.arc(x, y - 3, 3, 0, 7); c.fill(); c.lineWidth = 0.9; c.strokeStyle = INK; c.stroke(); } }
  };
  const STEP = 0.11, zq = (s) => Math.floor(zt(Math.abs(s - 0.47) < 0.06 ? 0.47 : s) / STEP) * STEP;
  const deck = () => {
    const m = 200, runs = []; let sa = 0, za = zq(0.0025);
    for (let i = 1; i <= m; i++) { const sm = (i - 0.5) / m, z = zq(sm); if (Math.abs(z - za) > 1e-6 || i === m) { runs.push([sa, (i - 1) / m, za]); sa = (i - 1) / m; za = z; } }
    runs[runs.length - 1][1] = 1;
    runs.forEach(([s0, s1, z], idx) => {
      if (s1 - s0 < 1e-4) return;
      k.poly([pt(s0, -HW, z), pt(s1, -HW, z), pt(s1, HW, z), pt(s0, HW, z)], idx % 2 ? "#f1e6cc" : "#e6d9bc", { lw: 0.6, wobble: 0, stroke: "rgba(120,100,70,0.65)" });
      const nx = runs[idx + 1];
      if (nx && nx[2] < z - 1e-6) k.poly([pt(s1, -HW, z), pt(s1, HW, z), pt(s1, HW, nx[2]), pt(s1, -HW, nx[2])], "#c8b894", { lw: 0.6, wobble: 0, stroke: "rgba(90,70,45,0.7)" });
    });
  };
  const archPts = (s0, s1, zc, steps, off, grow = 0) => { const m = (s0 + s1) / 2, hf = (s1 - s0) / 2, out = []; for (let i = 0; i <= steps; i++) { const a = Math.PI - (Math.PI * i) / steps; out.push(pt(m + Math.cos(a) * (hf + grow * 0.04), off, Math.sin(a) * (zc + grow))); } return out; };
  const shadowHoles = () => { for (const [s0, s1, zc, st] of ARCHES) k.poly([...archPts(s0, s1, zc, st, -HW), pt(s1, -HW, 0), pt(s0, -HW, 0)].slice(0, st + 3), "rgba(10,60,60,0.5)", { stroke: false }); };
  const face = () => {
    c.beginPath();
    const top = ss.map((s) => P(...pt(s, HW, zt(s) - 0.03)));
    c.moveTo(...P(...pt(0, HW, -0.15))); c.lineTo(...P(...pt(1, HW, -0.15))); for (let i = n; i >= 0; i--) c.lineTo(...top[i]); c.closePath();
    for (const [s0, s1, zc, st] of ARCHES) { const pts = archPts(s0, s1, zc, st, HW); c.moveTo(...P(...pts[0])); for (const p of pts) c.lineTo(...P(...p)); c.closePath(); }
    const g = c.createLinearGradient(...P(...pt(0, HW, 0)), ...P(...pt(1, HW, 0))); g.addColorStop(0, "#ecdfc2"); g.addColorStop(0.5, "#e4d6b8"); g.addColorStop(1, "#d3c4a2");
    c.fillStyle = g; c.fill("evenodd"); c.strokeStyle = INK; c.lineWidth = 1.6; c.lineJoin = "round"; c.stroke();
    c.save(); c.clip("evenodd"); c.strokeStyle = "rgba(110,95,70,0.42)"; c.lineWidth = 0.8; c.beginPath();
    for (let z = 0.2; z < 3.1; z += 0.22) { c.moveTo(...P(...pt(0, HW, z))); c.lineTo(...P(...pt(1, HW, z))); }
    for (let s = 0; s < 1; s += 0.012) for (let z = 0; z < 3.1; z += 0.44) { const zz = z + (Math.round(s / 0.012) % 2) * 0.22; c.moveTo(...P(...pt(s, HW, zz))); c.lineTo(...P(...pt(s, HW, zz + 0.22))); }
    c.stroke(); c.restore();
    for (const [s0, s1, zc, st] of ARCHES) {
      const inner = archPts(s0, s1, zc, 24, HW), outer = archPts(s0, s1, zc, 24, HW, 0.16);
      c.beginPath(); inner.forEach((p, i) => (i ? c.lineTo(...P(...p)) : c.moveTo(...P(...p)))); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
      c.beginPath(); outer.forEach((p, i) => (i ? c.lineTo(...P(...p)) : c.moveTo(...P(...p)))); c.strokeStyle = "#b5aa92"; c.lineWidth = 2.6; c.stroke();
      c.strokeStyle = "rgba(90,75,55,0.65)"; c.lineWidth = 0.8; c.beginPath(); for (let i = 1; i < 24; i++) { c.moveTo(...P(...inner[i])); c.lineTo(...P(...outer[i])); } c.stroke();
    }
    // moss / waterline stains at the foot
    c.save(); c.globalAlpha = 0.25; c.fillStyle = "#4b7a5a"; k.poly(ss.map((s) => pt(s, HW + 0.01, 0.12 + 0.05 * Math.sin(s * 90))).concat([pt(1, HW + 0.01, -0.15), pt(0, HW + 0.01, -0.15)]), "rgba(60,110,80,0.28)", { stroke: false }); c.restore();
  };
  const rails = () => {
    // upper cornice band along the face
    k.line3(ss.map((s) => pt(s, HW + 0.02, zt(s) - 0.02)), { stroke: "#b7ac95", lw: 3.4, wobble: 0 });
  };
  q(9.4, () => { shadowHoles(); rail(-HW, false); });
  q(9.7, () => deck());
  q(9.8, () => { face(); rails(); });
  q(10.9, () => { rail(HW, true); const [x, y] = P(...pt(0.47, HW + 0.03, zt(0.47) + 0.2)); textSign(k, x, y, 30, 9, "放生桥", { bg: "#2a2420", fg: "#e8c35a", size: 7 }); });
}
