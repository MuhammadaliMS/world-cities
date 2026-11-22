// TOKYO · centre tile · Senso-ji, Asakusa (traced over assets/tokyo/0_0.png).
// The painted ground sits one z-unit (42 px) below the tile grid, so every reference pixel is traced at y - 42 (DY).
import { P, CTS, INK, shade, lerp, clamp, rng, hash, spline } from "../../lib/vec-kit.js";
import { uvOf, chochin, petals, smoke, KIMONO, FONT } from "./_props.js";
import { makeHall, makePagoda, makeGate, incenseBurner, toroTall } from "./sensoji.js";

const HALL = makeHall(), PAGODA = makePagoda(), GATE = makeGate();
const RU = (x, y) => uvOf(x, y);
const fillPoly = (c, pts, fill, lw = 1, stroke = INK) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (lw) { c.strokeStyle = stroke; c.lineWidth = lw; c.lineJoin = "round"; c.stroke(); } };

// ---------------- Nakamise stalls: wooden booths with striped gable awnings ----------------
// face "R": front opens toward +u (left row), "L": front opens toward +v (right row). a runs along the front (screen left->right), b from back (0) to front (D).
function stall(k, u0, v0, o = {}) {
  const c = k.ctx, t = k.t, face = o.face || "R", W = o.w ?? 1.25, D = o.d ?? 0.78;
  const M = face === "R" ? (a, b, z = 0) => P(u0 + b, v0 + W - a, z) : (a, b, z = 0) => P(u0 + a, v0 + b, z);
  const endA = face === "R" ? 0 : W; // the visible side end
  const wood = o.wood || "#b4844f", woodD = shade(wood, -0.22), woodL = shade(wood, 0.12);
  const s1 = o.c1 || "#3d5f9e", s2 = o.c2 || "#f5f0e4";
  const q = (pts) => pts.map((p) => M(...p));
  // shadow
  fillPoly(c, q([[-0.1, -0.1, 0], [W + 0.25, -0.1, 0], [W + 0.25, D + 0.35, 0], [-0.1, D + 0.35, 0]]).map(([x, y]) => [x + 6, y + 2]), "rgba(70,50,30,0.13)", 0);
  // back wall interior (dark) + shelves of goods
  fillPoly(c, q([[0, 0, 0], [W, 0, 0], [W, 0, 1.12], [0, 0, 1.12]]), "#3b2717", 0.9);
  const R = rng(Math.round(u0 * 31 + v0 * 17));
  const goods = o.goods || "sweets";
  for (const zz of [0.62, 0.86]) {
    c.strokeStyle = "#7a5230"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(...M(0.06, 0.02, zz)); c.lineTo(...M(W - 0.06, 0.02, zz)); c.stroke();
    for (let i = 0; i < 8; i++) { const [x, y] = M(0.12 + i * (W - 0.24) / 7, 0.03, zz); c.fillStyle = ["#e8607a", "#f4c542", "#7cc47a", "#f6f0e2", "#e9813c", "#4aa3d8", "#c9567a"][Math.floor(R() * 7)]; c.strokeStyle = INK; c.lineWidth = 0.6; c.beginPath(); c.roundRect(x - 2.2, y - 6, 4.4, 6, 1); c.fill(); c.stroke(); }
  }
  // inner side wall (far end) + floor
  const farA = W - endA;
  fillPoly(c, q([[farA, 0, 0], [farA, D, 0], [farA, D, 1.12], [farA, 0, 1.12]]), "#5a3c22", 0.9);
  // vendor behind the counter
  if (o.vendor) { const [x, y] = M(W * 0.5, D * 0.45, 0); const [uu, vv] = uvOf(x, y); k.person(uu, vv, { pose: o.vpose || "stand", dir: face === "R" ? [1, 0.1] : [0.1, 1], seed: o.vendor, style: "shirt", top: o.vtop || "#f2efe6", bottom: "#33302c", hat: o.vhat ?? null, hairStyle: "short", bag: false, gesture: true }); }
  // counter (wood) with goods displayed on top
  const cb = [[0.02, D - 0.24, 0], [W - 0.02, D - 0.24, 0], [W - 0.02, D, 0], [0.02, D, 0]];
  fillPoly(c, q([[0.02, D, 0], [W - 0.02, D, 0], [W - 0.02, D, 0.5], [0.02, D, 0.5]]), wood, 0.9);
  c.strokeStyle = "rgba(80,50,25,0.45)"; c.lineWidth = 0.6; for (let i = 1; i < 9; i++) { const a = lerp(0.02, W - 0.02, i / 9); c.beginPath(); c.moveTo(...M(a, D, 0.03)); c.lineTo(...M(a, D, 0.47)); c.stroke(); }
  fillPoly(c, q([[endA, D - 0.24, 0], [endA, D, 0], [endA, D, 0.5], [endA, D - 0.24, 0.5]]), woodD, 0.8);
  fillPoly(c, q([[0.02, D - 0.26, 0.5], [W - 0.02, D - 0.26, 0.5], [W - 0.02, D + 0.02, 0.5], [0.02, D + 0.02, 0.5]]), "#d8b07a", 0.9);
  drawGoods(k, M, W, D, goods, R);
  // visible end wall: vertical planks + a small paper window / poster
  fillPoly(c, q([[endA, 0, 0], [endA, D - 0.24, 0], [endA, D - 0.24, 1.12], [endA, 0, 1.12]]), woodD, 0.9);
  c.strokeStyle = "rgba(50,30,15,0.45)"; c.lineWidth = 0.7; for (let i = 1; i < 5; i++) { const b = (D - 0.24) * i / 5; c.beginPath(); c.moveTo(...M(endA, b, 0.02)); c.lineTo(...M(endA, b, 1.1)); c.stroke(); }
  if (o.poster) { fillPoly(c, q([[endA, 0.12, 0.48], [endA, D - 0.36, 0.48], [endA, D - 0.36, 0.95], [endA, 0.12, 0.95]]), "#f3ead6", 0.8); c.strokeStyle = "rgba(90,60,30,0.6)"; c.lineWidth = 0.6; const [x0, y0] = M(endA, 0.12, 0.72), [x1, y1] = M(endA, D - 0.36, 0.72); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.moveTo(...M(endA, (D - 0.24) / 2, 0.48)); c.lineTo(...M(endA, (D - 0.24) / 2, 0.95)); c.stroke(); }
  // posts
  for (const a of [0, W]) for (const b of [D]) { const [x, y0] = M(a, b, 0), [, y1] = M(a, b, 1.18); c.fillStyle = woodL; c.strokeStyle = INK; c.lineWidth = 0.9; c.fillRect(x - 1.6, y1, 3.2, y0 - y1); c.strokeRect(x - 1.6, y1, 3.2, y0 - y1); }
  // gable awning: ridge along a at b = D/2, striped canvas, scalloped valance on the front
  const zr = 1.62, ze = 1.16, bf = D + 0.3, bb = -0.18, a0 = -0.14, a1 = W + 0.14, n = Math.max(6, Math.round(W / 0.15));
  // back slope edge (just the visible rim) and front slope stripes
  for (let i = 0; i < n; i++) {
    const f0 = lerp(a0, a1, i / n), f1 = lerp(a0, a1, (i + 1) / n), col = i % 2 ? s2 : s1;
    fillPoly(c, q([[f0, D / 2, zr], [f1, D / 2, zr], [f1, bf, ze], [f0, bf, ze]]), col, 0.6);
  }
  // canvas shading: darker toward the eave
  { const g = c.createLinearGradient(...M(W / 2, D / 2, zr), ...M(W / 2, bf, ze)); g.addColorStop(0, "rgba(255,255,255,0.12)"); g.addColorStop(1, "rgba(30,20,10,0.12)"); fillPoly(c, q([[a0, D / 2, zr], [a1, D / 2, zr], [a1, bf, ze], [a0, bf, ze]]), g, 1.1); }
  // valance scallops
  for (let i = 0; i < n; i++) {
    const f0 = lerp(a0, a1, i / n), f1 = lerp(a0, a1, (i + 1) / n), col = i % 2 ? s2 : s1, [x0, y0] = M(f0, bf, ze), [x1, y1] = M(f1, bf, ze);
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineTo(x1, y1 + 4); c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 9, x0, y0 + 4); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.7; c.stroke();
  }
  // gable end: wooden triangle + barge board + ridge beam end
  const ge = [[endA + (endA ? 0.14 : -0.14), bb, ze], [endA + (endA ? 0.14 : -0.14), D / 2, zr], [endA + (endA ? 0.14 : -0.14), bf, ze]];
  fillPoly(c, q([[endA, bb + 0.1, ze], [endA, D / 2, zr - 0.06], [endA, bf - 0.1, ze]]), woodD, 0.8);
  c.strokeStyle = INK; c.lineWidth = 3.2; c.beginPath(); c.moveTo(...M(...ge[0])); c.lineTo(...M(...ge[1])); c.lineTo(...M(...ge[2])); c.stroke(); c.strokeStyle = woodL; c.lineWidth = 1.8; c.stroke();
  // ridge beam
  c.strokeStyle = INK; c.lineWidth = 3.6; c.beginPath(); c.moveTo(...M(a0 - 0.05, D / 2, zr + 0.02)); c.lineTo(...M(a1 + 0.05, D / 2, zr + 0.02)); c.stroke(); c.strokeStyle = "#8a5a32"; c.lineWidth = 2; c.stroke();
  // things hanging under the front eave: masks / fans / pinwheels + red lanterns at the ends
  const hang = o.hang || "masks";
  for (let i = 0; i < 5; i++) { const a = lerp(0.25, W - 0.25, i / 4), [x, y] = M(a, bf - 0.02, ze - 0.05), sw = Math.sin(t * 1.7 + i + u0) * 0.8; c.strokeStyle = INK; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x, y + 2); c.lineTo(x + sw, y + 6); c.stroke(); hangItem(c, x + sw, y + 9, hang, i, t); }
  for (const a of [0.04, W - 0.04]) { const [x, y] = M(a, bf - 0.04, ze - 0.02); chochin(k, x, y + 11, { r: 5.4, seed: u0 + a * 3, text: o.lt || "祭", glow: true, drop: 3 }); }
  // sign board on the ridge front with real text
  if (o.sign) {
    const [x, y] = M(W / 2, D / 2 + 0.05, zr + 0.05), txt = o.sign, fs = 8.5, w = txt.length * fs + 8;
    c.save(); c.translate(x, y - 6); c.transform(1, face === "R" ? -0.577 : 0.577, 0, 1, 0, 0);
    c.fillStyle = o.signBg || "#f6efdc"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.roundRect(-w / 2, -7, w, 13, 2); c.fill(); c.stroke();
    c.fillStyle = o.signFg || "#8a1c14"; c.font = `800 ${fs}px ${FONT}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(txt, 0, 0);
    c.restore();
  }
}
function hangItem(c, x, y, kind, i, t) {
  c.strokeStyle = INK; c.lineWidth = 0.6;
  if (kind === "masks") { const cols = ["#f6f0e2", "#e8604a", "#f2c84a", "#7cc0e8", "#f6f0e2"]; c.fillStyle = cols[i % 5]; c.beginPath(); c.arc(x, y, 3.4, 0, 6.3); c.fill(); c.stroke(); c.fillStyle = INK; c.fillRect(x - 1.8, y - 1, 1, 1); c.fillRect(x + 0.8, y - 1, 1, 1); c.fillStyle = "#d8443a"; c.fillRect(x - 0.8, y + 1.2, 1.6, 0.8); }
  else if (kind === "fans") { const cols = ["#e8607a", "#4a7ac8", "#f2c84a", "#7cc47a", "#f6f0e2"]; c.fillStyle = cols[i % 5]; c.beginPath(); c.moveTo(x, y + 3); c.arc(x, y + 3, 6, Math.PI * 1.15, Math.PI * 1.85); c.closePath(); c.fill(); c.stroke(); }
  else if (kind === "pinwheels") { const a = t * 4 + i; for (let j = 0; j < 4; j++) { c.fillStyle = ["#e8607a", "#f2c84a", "#4aa3d8", "#7cc47a"][j]; c.beginPath(); c.moveTo(x, y); c.arc(x, y, 4, a + j * 1.57, a + j * 1.57 + 1.1); c.closePath(); c.fill(); } c.beginPath(); c.arc(x, y, 4, 0, 6.3); c.stroke(); }
  else { c.fillStyle = ["#d9372b", "#f6f0e2", "#d9372b", "#f2c84a", "#d9372b"][i % 5]; c.beginPath(); c.ellipse(x, y, 2.6, 3.4, 0, 0, 6.3); c.fill(); c.stroke(); }
}
function drawGoods(k, M, W, D, kind, R) {
  const c = k.ctx, z = 0.5;
  for (let i = 0; i < 7; i++) {
    const a = 0.14 + i * (W - 0.28) / 6;
    for (const b of [D - 0.18, D - 0.07]) {
      const [x, y] = M(a + (b > D - 0.1 ? 0.06 : 0), b, z);
      c.strokeStyle = INK; c.lineWidth = 0.6;
      if (kind === "dango") { c.strokeStyle = "#8a6440"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - 3, y); c.lineTo(x + 3, y - 2); c.stroke(); for (let j = 0; j < 3; j++) { c.fillStyle = ["#f4a6b8", "#f6f2e6", "#8cc06a"][j]; c.strokeStyle = INK; c.lineWidth = 0.5; c.beginPath(); c.arc(x - 2 + j * 2, y - 0.7 - j * 0.7, 1.4, 0, 6.3); c.fill(); c.stroke(); } }
      else if (kind === "fans") { c.fillStyle = ["#e8607a", "#4a7ac8", "#f2c84a", "#f6f0e2", "#7cc47a"][Math.floor(R() * 5)]; c.beginPath(); c.moveTo(x, y + 1); c.arc(x, y + 1, 5, Math.PI * 1.1, Math.PI * 1.9); c.closePath(); c.fill(); c.stroke(); c.strokeStyle = "rgba(0,0,0,0.3)"; c.beginPath(); for (let j = 1; j < 4; j++) { const an = Math.PI * (1.1 + j * 0.2); c.moveTo(x, y + 1); c.lineTo(x + Math.cos(an) * 5, y + 1 + Math.sin(an) * 5); } c.stroke(); }
      else if (kind === "senbei") { c.fillStyle = ["#c98a3e", "#a8662c", "#d9a45a"][Math.floor(R() * 3)]; c.beginPath(); c.ellipse(x, y, 3, 1.6, 0, 0, 6.3); c.fill(); c.stroke(); }
      else if (kind === "omamori") { c.fillStyle = ["#d9372b", "#4a7ac8", "#e8607a", "#f2c84a", "#7a5aa8"][Math.floor(R() * 5)]; c.fillRect(x - 1.6, y - 4, 3.2, 4.4); c.strokeRect(x - 1.6, y - 4, 3.2, 4.4); c.fillStyle = GOLDT; c.fillRect(x - 1, y - 3, 2, 0.8); }
      else if (kind === "bottles") { c.fillStyle = ["#e9813c", "#7cc47a", "#f6f0e2", "#4aa3d8"][Math.floor(R() * 4)]; c.beginPath(); c.roundRect(x - 1.5, y - 6, 3, 6, 1); c.fill(); c.stroke(); }
      else { c.fillStyle = ["#e8607a", "#f4c542", "#f6f0e2", "#9ccf7a", "#c98a3e"][Math.floor(R() * 5)]; c.beginPath(); c.roundRect(x - 2.4, y - 2.6, 4.8, 3, 0.8); c.fill(); c.stroke(); }
    }
  }
}
const GOLDT = "#e2b23a";

// ---------------- cherry tree with blossom clusters ----------------
function sakura(k, u, v, o = {}) {
  const c = k.ctx, t = k.t, s = o.s ?? 1, [bx, by] = P(u, v, 0), R = rng(o.seed ?? 3);
  k.ell(u + 0.3, v + 0.12, 0, 1.0 * s, "rgba(90,50,60,0.12)", { stroke: false });
  // fallen petals ring
  for (let i = 0; i < 26; i++) { const a = R() * 6.3, d = Math.sqrt(R()) * 52 * s; c.fillStyle = "rgba(246,180,200,0.7)"; c.beginPath(); c.ellipse(bx + Math.cos(a) * d, by + Math.sin(a) * d * 0.5, 1.6, 1, a, 0, 6.3); c.fill(); }
  // gnarled trunk + spreading limbs
  const limbs = [[0, -34, -26, -58, -46, -64], [0, -34, 22, -60, 44, -68], [0, -30, -4, -66, -10, -86], [-14, -48, -40, -50, -58, -52], [12, -46, 34, -48, 56, -44]];
  for (const [w, col] of [[7, INK], [4.4, "#6e4a38"]]) {
    c.lineCap = "round"; c.strokeStyle = col; c.lineWidth = w * s; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx - 4 * s, by - 18 * s, bx, by - 34 * s); c.stroke();
    c.lineWidth = (w - 2.2) * s; for (const [x0, y0, x1, y1, x2, y2] of limbs) { c.beginPath(); c.moveTo(bx + x0 * s, by + y0 * s); c.quadraticCurveTo(bx + x1 * s, by + y1 * s, bx + x2 * s, by + y2 * s); c.stroke(); }
  }
  // blossom clusters (back to front), each a puff of tiny 5-petal flowers
  const clusters = [];
  for (let i = 0; i < 26; i++) { const a = R() * Math.PI * 2, rr = Math.sqrt(R()); clusters.push([Math.cos(a) * 62 * rr * s, -66 * s + Math.sin(a) * 30 * rr * s - (1 - rr) * 8 * s, (11 + R() * 7) * s]); }
  clusters.sort((a, b) => a[1] - b[1]);
  clusters.forEach(([dx, dy, r], i) => {
    const sw = Math.sin(t * 1.2 + i * 0.7 + u) * 1.2 * (1 + dy / -80);
    const x = bx + dx + sw, y = by + dy, light = clamp(0.5 + (-dy - 50 * s) / (60 * s) * 0.3 - dx / 300);
    c.fillStyle = shade("#f0a7bf", -0.12 + light * 0.18); c.strokeStyle = "rgba(150,70,95,0.75)"; c.lineWidth = 0.8;
    c.beginPath(); for (let j = 0; j < 9; j++) { const an = j / 9 * Math.PI * 2, rj = r * (0.82 + 0.18 * Math.sin(j * 2.3 + i)); const px = x + Math.cos(an) * rj, py = y + Math.sin(an) * rj * 0.78; j ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath(); c.fill(); c.stroke();
    // flowers
    for (let j = 0; j < 6; j++) { const an = R() * 6.3, d = R() * r * 0.75, fx = x + Math.cos(an) * d, fy = y + Math.sin(an) * d * 0.7; c.fillStyle = R() < 0.5 ? "#fde6ee" : "#f8c6d6"; for (let p = 0; p < 5; p++) { const b = p * 1.2566; c.beginPath(); c.arc(fx + Math.cos(b) * 1.3, fy + Math.sin(b) * 1.3, 1.05, 0, 6.3); c.fill(); } c.fillStyle = "#d8567a"; c.fillRect(fx - 0.4, fy - 0.4, 0.8, 0.8); }
  });
}
function azaleas(k, pts, o = {}) { k.flowerCurve(pts, o.w ?? 0.42, { cols: ["#f39ac0", "#e8607a", "#fbd3e0", "#ffffff", "#f39ac0"], seed: o.seed }); }


// ---------------- back view of a right-row stall (front opens toward -u, hidden): planks, striped awning slope, nobori ----------------
function stallBack(k, u0, v0, o = {}) {
  const c = k.ctx, t = k.t, W = o.w ?? 1.18, D = o.d ?? 0.78, wood = o.wood || "#a9794a";
  const um = u0 + D / 2, ue = u0 + D + 0.22, zr = 1.62, ze = 1.14, s1 = o.c1 || "#3d5f9e", s2 = o.c2 || "#f5f0e4";
  k.box(u0, v0, 0, D, W, 1.1, wood, { hatch: false });
  // vertical planks on the back wall (u+du face) + a paper poster
  c.strokeStyle = "rgba(60,36,18,0.4)"; c.lineWidth = 0.7; c.beginPath();
  for (let i = 1; i < 8; i++) { const v = v0 + (W * i) / 8; c.moveTo(...P(u0 + D, v, 0.03)); c.lineTo(...P(u0 + D, v, 1.07)); }
  c.stroke();
  k.poly([[u0 + D, v0 + 0.3, 0.45], [u0 + D, v0 + W - 0.3, 0.45], [u0 + D, v0 + W - 0.3, 0.9], [u0 + D, v0 + 0.3, 0.9]], "#f3ead6", { lw: 0.8, wobble: 0 });
  // post at the +v end
  // awning: back slope (faces +u) in stripes, scalloped valance, gable end on the +v face
  const n = 8, a0 = v0 - 0.12, a1 = v0 + W + 0.12;
  k.poly([[u0 - 0.2, a1, ze], [um, a1, zr], [ue, a1, ze]], shade(wood, -0.2), { lw: 0.9, wobble: 0 });
  for (let i = 0; i < n; i++) {
    const va = lerp(a0, a1, i / n), vb = lerp(a0, a1, (i + 1) / n), col = i % 2 ? s2 : s1;
    k.poly([[um, va, zr], [um, vb, zr], [ue, vb, ze], [ue, va, ze]], col, { lw: 0.6, wobble: 0 });
    const [x0, y0] = P(ue, va, ze), [x1, y1] = P(ue, vb, ze);
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineTo(x1, y1 + 4); c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 8, x0, y0 + 4); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.7; c.stroke();
  }
  { const g = c.createLinearGradient(...P(um, v0, zr), ...P(ue, v0, ze)); g.addColorStop(0, "rgba(255,255,255,0.12)"); g.addColorStop(1, "rgba(30,20,10,0.14)"); k.poly([[um, a0, zr], [um, a1, zr], [ue, a1, ze], [ue, a0, ze]], g, { lw: 1, wobble: 0 }); }
  c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.moveTo(...P(um, a0 - 0.04, zr + 0.02)); c.lineTo(...P(um, a1 + 0.04, zr + 0.02)); c.stroke(); c.strokeStyle = "#8a5a32"; c.lineWidth = 1.9; c.stroke();
  // lanterns under the back eave
  for (const v of [v0 + 0.12, v0 + W - 0.12]) { const [x, y] = P(ue, v, ze - 0.02); chochin(k, x, y + 11, { r: 5, seed: v0 + v * 3, text: o.lt || "祭", glow: true, drop: 3 }); }
  // nobori banner on a pole
  { const uf = ue + 0.06, vf = v0 + W - 0.08, sw = Math.sin(t * 2 + v0) * 0.04, pole = 2.35;
    c.strokeStyle = INK; c.lineWidth = 2.4; c.beginPath(); c.moveTo(...P(uf, vf, 0)); c.lineTo(...P(uf, vf, pole + 0.1)); c.stroke(); c.strokeStyle = "#7a5230"; c.lineWidth = 1.2; c.stroke();
    c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.moveTo(...P(uf, vf, pole)); c.lineTo(...P(uf, vf - 0.46 + sw, pole)); c.stroke();
    k.poly([[uf, vf, pole], [uf, vf - 0.4 + sw, pole], [uf, vf - 0.4 + sw, pole - 1.0], [uf, vf, pole - 1.0]], o.flag || "#d9372b", { lw: 0.9, wobble: 0 });
    const txt = o.sign || "祭"; c.fillStyle = "#f6efdc"; c.font = `800 9px ${FONT}`; c.textAlign = "center"; c.textBaseline = "middle";
    [...txt].slice(0, 3).forEach((ch, i) => { const [x, y] = P(uf, vf - 0.2 + sw / 2, pole - 0.2 - i * 0.27); c.save(); c.translate(x, y); c.transform(1, -0.577, 0, 1, 0, 0); c.fillText(ch, 0, 0); c.restore(); });
  }
}

// ---------------- rickshaw (jinrikisha) looping on an axis-aligned loop in the open ground ----------------
const BURN = [5.75, 5.0];
const RICK = (() => { const cu = 7.95, cv = 7.05, ru = 1.25, rv = 1.0, pts = []; for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; pts.push([cu + Math.cos(a) * ru, cv + Math.sin(a) * rv]); } return pts; })();
function rickshaw(k, t) {
  const c = k.ctx, st = k.walkerState(RICK, { loop: true, speed: 0.42, offset: 0 });
  const L = Math.hypot(st.du, st.dv) || 1, fu = st.du / L, fv = st.dv / L, su = -fv, sv = fu;
  const at = (a, b, z) => P(st.u + fu * a + su * b, st.v + fv * a + sv * b, z);
  const r = 0.4, roll = -(t * 0.42) / r;
  const wheel = (b) => {
    const C = at(0, b, r), pts = []; for (let i = 0; i <= 24; i++) { const th = (i / 24) * Math.PI * 2; pts.push(at(Math.cos(th) * r, b, r + Math.sin(th) * r)); }
    c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.strokeStyle = INK; c.lineWidth = 3; c.stroke(); c.strokeStyle = "#3a2a1e"; c.lineWidth = 1.6; c.stroke();
    c.strokeStyle = "#5a4030"; c.lineWidth = 0.8; c.beginPath(); for (let i = 0; i < 10; i++) { const th = roll + i * Math.PI / 5; c.moveTo(...C); c.lineTo(...at(Math.cos(th) * r * 0.95, b, r + Math.sin(th) * r * 0.95)); } c.stroke();
    c.fillStyle = "#b8862e"; c.beginPath(); c.arc(C[0], C[1], 1.8, 0, 6.3); c.fill();
  };
  // which wheel is nearer the viewer
  const near = (su + sv) > 0 ? 1 : -1;
  k.ell(st.u, st.v, 0, 0.55, "rgba(60,45,30,0.15)", { stroke: false });
  wheel(-near * 0.34);
  // shafts to the puller
  for (const b of [-0.26, 0.26]) { c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(...at(0.1, b, 0.55)); c.lineTo(...at(1.05, b, 0.48)); c.stroke(); c.strokeStyle = "#8a5a32"; c.lineWidth = 1.3; c.stroke(); }
  // seat box (black lacquer with red cushion) and the folding hood
  const box = (a0, a1, b0, b1, z0, z1, col) => { const T = [at(a0, b0, z1), at(a1, b0, z1), at(a1, b1, z1), at(a0, b1, z1)]; const sides = [[at(a0, b0, z0), at(a1, b0, z0), at(a1, b0, z1), at(a0, b0, z1)], [at(a0, b1, z0), at(a1, b1, z0), at(a1, b1, z1), at(a0, b1, z1)], [at(a1, b0, z0), at(a1, b1, z0), at(a1, b1, z1), at(a1, b0, z1)], [at(a0, b0, z0), at(a0, b1, z0), at(a0, b1, z1), at(a0, b0, z1)]]; sides.sort((p, q) => q[0][1] + q[2][1] - p[0][1] - p[2][1]); for (const s of sides.reverse()) fillPoly(c, s, shade(col, -0.15), 0.9); fillPoly(c, T, col, 0.9); };
  box(-0.22, 0.24, -0.28, 0.28, 0.42, 0.62, "#2a2522");
  box(-0.18, 0.2, -0.25, 0.25, 0.62, 0.68, "#c8392a");
  // footboard
  box(0.24, 0.5, -0.22, 0.22, 0.28, 0.33, "#2a2522");
  // passenger
  const [x, y] = at(0.0, 0, 0); const [pu, pv] = uvOf(x, y);
  k.person(pu, pv, { pose: "sit", seatZ: 0.68, dir: [fu, fv], seed: 83, style: "dress", top: "#e8a0b8", bottom: "#c9567a", hairStyle: "bun", hat: null, bag: false });
  // hood (black canopy) behind the passenger
  const hood = []; for (let i = 0; i <= 8; i++) { const b = lerp(-0.3, 0.3, i / 8); hood.push(at(-0.26, b, 0.66)); } for (let i = 8; i >= 0; i--) { const b = lerp(-0.3, 0.3, i / 8), bulge = 1 - Math.pow((i / 8) * 2 - 1, 2); hood.push(at(-0.34 - bulge * 0.05, b, 1.08 + bulge * 0.06)); }
  fillPoly(c, hood, "#3a2622", 1.1);
  c.strokeStyle = "rgba(255,255,255,0.18)"; c.lineWidth = 0.8; for (const zz of [0.8, 0.95]) { c.beginPath(); for (let i = 0; i <= 8; i++) { const p = at(-0.3, lerp(-0.3, 0.3, i / 8), zz); i ? c.lineTo(...p) : c.moveTo(...p); } c.stroke(); }
  wheel(near * 0.34);
  // puller between the shafts (drawn last: he is in front of the shafts' far ends)
  const [qx, qy] = at(1.0, 0, 0), [qu, qv] = uvOf(qx, qy);
  k.person(qu, qv, { pose: "walk", p: (t * 0.42) / 0.27, dir: [fu, fv], seed: 78, style: "shirt", top: "#1f2f55", bottom: "#1f2f55", hat: "sunhat", hatCol: "#e6d6a8", bag: false });
}


// ---------------- people routes (tile u,v) ----------------
const ROUTES = {
  pathA: [[2.6, 9.25], [2.6, 7.5], [2.7, 5.25]],
  pathB: [[3.55, 5.25], [3.5, 7.0], [3.45, 9.25]],
  pathC: [[3.0, 9.25], [3.0, 6.5], [3.1, 5.25]],
  pathD: [[2.85, 5.25], [3.4, 6.3], [3.0, 7.8], [3.3, 9.25]],
  court: [[3.3, 4.95], [5.0, 4.9], [5.2, 4.3], [6.5, 4.4]],
  east: [[6.3, 5.9], [6.3, 8.9], [5.6, 9.3]],
  pagoda: [[6.5, 3.5], [7.4, 3.5], [9.2, 3.6]],
  east2: [[5.6, 9.3], [5.9, 7.2], [6.4, 6.0]],
};
// Nakamise stalls: left row fronts face +u (visible), right row fronts face -u (seen from behind)
const V0S = [4.95, 6.15, 7.35];
const SL = [
  { u: 1.2, v: V0S[0], c1: "#d64e46", sign: "人形焼", goods: "sweets", hang: "lanterns", lt: "浅草", vendor: 41 },
  { u: 1.2, v: V0S[1], c1: "#3d5f9e", sign: "お守り", goods: "omamori", hang: "masks", lt: "祭", vendor: 42 },
  { u: 1.2, v: V0S[2], c1: "#d64e46", sign: "団子", goods: "dango", hang: "pinwheels", lt: "団子", vendor: 44 },
];
const SB = [
  { u: 4.15, v: V0S[0], c1: "#d64e46", sign: "雷おこし", lt: "雷", flag: "#d9372b" },
  { u: 4.15, v: V0S[1], c1: "#3d5f9e", sign: "煎餅", lt: "祭", flag: "#2f5aa0" },
  { u: 4.15, v: V0S[2], c1: "#3d5f9e", sign: "甘酒", lt: "甘酒", flag: "#d9372b" },
];
export { ROUTES, RICK, SL, SB, BURN };

export default function draw(k, t) {
  const c = k.ctx;
  // ---------- ground: warm brick paving ----------
  k.groundTrace({}, { paved: "#e6cfb2", side: "#e3d3b0", stipple: 4 });
  {
    c.save(); c.beginPath(); [P(0, 0), P(10, 0), P(10, 10), P(0, 10)].forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.clip();
    c.strokeStyle = "rgba(160,115,85,0.28)"; c.lineWidth = 0.7; c.beginPath();
    for (let i = 0; i <= 50; i++) { const f = i * 0.2; c.moveTo(...P(0, f)); c.lineTo(...P(10, f)); }
    for (let i = 0; i < 50; i++) for (let j = 0; j < 25; j++) { const v = i * 0.2, u = j * 0.4 + (i % 2) * 0.2; c.moveTo(...P(u, v)); c.lineTo(...P(u, v + 0.2)); }
    c.stroke();
    const R = rng(5); for (let i = 0; i < 160; i++) { const u = R() * 10, v = Math.floor(R() * 50) * 0.2, uu = Math.floor(u / 0.4) * 0.4 + ((v / 0.2) % 2) * 0.2; k.ground([[uu, v], [uu + 0.4, v], [uu + 0.4, v + 0.2], [uu, v + 0.2]], R() < 0.5 ? "rgba(214,160,120,0.35)" : "rgba(250,236,214,0.45)", { stroke: false, wobble: 0 }); }
    // pale processional stone path from the gate to the hall stairs
    k.ground([[2.25, 4.5], [3.9, 4.5], [3.9, 9.7], [2.25, 9.7]], "rgba(245,232,210,0.6)", { stroke: false, wobble: 0 });
    k.ground([[2.0, 4.3], [4.15, 4.3], [4.15, 5.0], [2.0, 5.0]], "rgba(245,232,210,0.5)", { stroke: false, wobble: 0 });
    c.restore();
  }
  // planted moss beds: left edge strip and round the pagoda
  k.ground([[0.35, 4.9], [0.95, 4.9], [0.95, 9.6], [0.35, 9.6]], "#a7c06c", { lw: 1.1, wobble: 0 });
  k.ground([[7.2, 0.35], [9.65, 0.35], [9.65, 3.0], [7.2, 3.0]], "#a7c06c", { lw: 1.1, wobble: 0 });
  k.q(6.9, () => azaleas(k, [[0.65, 5.2], [0.65, 6.3]], { seed: 3, w: 0.3 })); k.q(8.0, () => azaleas(k, [[0.65, 6.9], [0.65, 7.9]], { seed: 13, w: 0.3 })); k.q(9.6, () => azaleas(k, [[0.65, 8.5], [0.65, 9.4]], { seed: 23, w: 0.3 }));
  k.q(10.6, () => azaleas(k, [[7.5, 2.85], [8.6, 2.9], [9.4, 2.85]], { seed: 4, w: 0.3 }));

  // ---------- back: trees, hall, pagoda ----------
  const T = (u, v, o) => k.q(u + v, () => k.tree(u, v, o));
  const G1 = "#a3b85a", G2 = "#b0c262", G3 = "#97ae52";
  T(0.7, 5.5, { r: 0.5, h: 1.4, seed: 11, col: G1 }); T(0.7, 8.0, { r: 0.55, h: 1.5, seed: 12, col: G2 });
  T(7.0, 0.7, { r: 0.55, h: 1.6, seed: 14, col: G1 }); T(9.45, 5.8, { r: 0.55, h: 1.5, seed: 16, col: G3 }); T(7.1, 3.5, { r: 0.45, h: 1.3, seed: 17, col: G2 });
  const hd = 6.2;
  k.q(hd, () => { HALL.drawBase(k); HALL.drawBody(k); });
  k.q(hd + 0.1, () => porchPeople(k, t));
  k.q(hd + 0.2, () => { HALL.drawFront(k); stairPeople(k, t); });
  k.q(hd + 0.3, () => HALL.drawRoof(k));
  k.q(9.6, () => PAGODA.draw(k));
  k.q(10.4, () => PAGODA.stairs(k));

  // ---------- stone lanterns ----------
  for (const [u, v] of [[2.1, 4.65], [4.05, 4.65], [6.85, 4.3]]) k.q(u + v, () => toroTall(k, u, v, { s: 1.0 }));

  // ---------- Nakamise: left row (fronts toward the path), right row (backs toward us) ----------
  for (const s of SL) { const W = 1.12, D = 0.78; k.q(s.u + D + s.v + W - 0.4, () => stall(k, s.u, s.v, { ...s, w: W, d: D, face: "R" })); }
  for (const s of SB) { const W = 1.12, D = 0.78; k.q(s.u + D + s.v + W + 0.1, () => stallBack(k, s.u, s.v, { ...s, w: W, d: D })); }

  // ---------- incense burner + wafting worshippers ----------
  k.q(BURN[0] + BURN[1], () => incenseBurner(k, BURN[0], BURN[1], t));
  const waft = (dx, dy, seed, o) => { const u = BURN[0] + dx, v = BURN[1] + dy, ph = Math.sin(t * 2.2 + seed); k.qperson(u, v, { pose: ph > 0 ? "wave" : "stand", dir: [-dx, -dy], seed, bag: false, hat: null, ...o }); };
  waft(-0.75, 0.15, 61, { style: "dress", top: "#e8a0b8", bottom: "#c9567a", hairStyle: "bun" });
  waft(-0.5, -0.65, 62, { style: "shirt", top: "#9cc0e0", bottom: "#2b3040" });
  waft(0.55, -0.65, 63, { style: "shirt", top: "#7aa0d0", bottom: "#2b3a5a" });
  waft(0.8, 0.12, 64, { style: "dress", top: "#e8a0b8", bottom: "#d0607a", hairStyle: "bun" });
  waft(0.1, 0.8, 65, { kid: true, style: "tee", top: "#f2c04a", bottom: "#4a4a4a" });

  // ---------- Kaminarimon gate across the approach ----------
  k.q(11.55, () => GATE.back(k));
  k.q(12.0, () => GATE.lantern(k));
  k.q(12.6, () => GATE.front(k));
  k.q(12.75, () => GATE.roof(k));

  // ---------- sakura ----------
  k.q(13.3, () => sakura(k, 9.0, 4.35, { seed: 31, s: 0.85 }));
  k.q(14.8, () => sakura(k, 5.6, 9.15, { seed: 32, s: 0.8 }));

  // ---------- crowds ----------
  const W = (name, off, seed, o = {}) => k.qwalker(ROUTES[name], { speed: 0.33 + (seed % 5) * 0.03, offset: off, seed, dwell: 1.2 + (seed % 3) * 0.6, bag: false, hat: null, ...o });
  const kimono = (col, hair = "bun") => ({ style: "dress", top: col, bottom: shade(col, -0.18), hairStyle: hair });
  W("pathA", 0.0, 21, kimono(KIMONO[0])); W("pathB", 0.55, 22, { style: "shirt", top: "#3b4f6e", bottom: "#2b3040" });
  W("pathC", 0.3, 23, kimono("#e8a0b8")); W("pathD", 0.8, 24, { style: "coat", top: "#d8c28a", bottom: "#3c3c3c", bag: true });
  W("court", 0.1, 25, { style: "tee", top: "#f0c040", bottom: "#4a5a7a" }); W("east", 0.6, 26, kimono(KIMONO[1]));
  W("pagoda", 0.35, 27, kimono("#c9567a")); W("east2", 0.85, 28, kimono("#f0a058", "long"));
  // shoppers at the left stalls
  k.qperson(2.42, 5.65, { pose: "stand", dir: [-1, 0.1], seed: 51, style: "shirt", top: "#3b4f6e", bottom: "#2b3040" }); k.qperson(2.5, 5.9, { pose: "stand", dir: [-1, 0.2], seed: 52, ...kimono("#f2a6c0") });
  k.qperson(2.45, 6.95, { pose: "stand", dir: [-1, 0], seed: 58, style: "stripes", top: "#f2efe6", bottom: "#4a5a7a", bag: true });
  k.qperson(2.5, 8.25, { pose: "stand", dir: [-1, -0.1], seed: 59, ...kimono("#7a9fd0", "long") }); k.qperson(2.62, 8.4, { pose: "stand", dir: [-1, -0.2], seed: 60, kid: true, style: "tee", top: "#e85a4a", bottom: "#33405a" });
  // a tourist photographing the gate lantern from the passage
  k.qperson(3.25, 8.0, { pose: "photo", dir: [0.1, 1], seed: 53, style: "tee", top: "#e0604a", bottom: "#2b3040", hat: "cap" });
  // friends near the stone lantern by the hall
  { const g = Math.sin(t * 0.8) > 0.3; k.qperson(6.3, 4.8, { pose: "photo", dir: [-0.6, -1], seed: 54, ...kimono("#f2a6c0") }); k.qperson(6.55, 4.95, { pose: g ? "wave" : "stand", dir: [-0.8, -0.6], seed: 55, style: "shirt", top: "#4a6a9a", bottom: "#2b3040", hat: null, bag: false }); }
  { const g = Math.sin(t * 0.7 + 2) > 0.2; k.qperson(8.1, 3.9, { pose: g ? "cheer" : "stand", dir: [-1, -0.3], seed: 56, kid: true, style: "tee", top: "#e85a4a", bottom: "#33405a", hat: null, bag: false }); k.qperson(8.35, 4.1, { pose: "stand", dir: [-1, -0.5], seed: 57, ...kimono("#7a9fd0", "long") }); }
  // the rickshaw looping on the east lawn of paving
  { const st = k.walkerState(RICK, { loop: true, speed: 0.42 }); k.q(st.u + st.v + 0.3, () => rickshaw(k, t)); }
  k.flush();

  // ---------- air: birds over the pagoda, drifting petals ----------
  { const [x, y] = P(8.4, 1.65, 8.0); k.circlingBird(x, y, 55, 16, { speed: 0.6, phase: 0 }); k.circlingBird(x, y, 55, 16, { speed: 0.6, phase: 0.5, size: 0.8 }); }
  { const [x, y] = P(5, 5, 0); void x; void y; }
}

// people strolling on the hall veranda (hall frame -> tile)
function porchPeople(k, t) {
  const H = HALL, segs = [[[-0.45, 3.35], [1.7, 3.35]], [[4.0, 3.35], [6.1, 3.3], [6.15, 1.2]]];
  segs.forEach((seg, i) => {
    const st = k.walkerState(seg, { speed: 0.16 + i * 0.03, offset: i * 0.4, dwell: 2.5 });
    const a = H.uvz(st.u, st.v, 0), b = H.uvz(st.u + st.du * 0.01, st.v + st.dv * 0.01, 0);
    k.person(a.u, a.v, { z: a.z, pose: st.moving ? "walk" : "stand", p: st.p, dir: [b.u - a.u || 0.01, b.v - a.v], seed: 90 + i, ...(i ? { style: "dress", top: "#e8a0b8", bottom: "#c9567a", hairStyle: "bun" } : { style: "shirt", top: "#7a9fd0", bottom: "#2b3040" }), hat: null, bag: false });
  });
  for (const [hu, hv, seed, o] of [[2.5, 3.15, 93, { style: "shirt", top: "#c8d4a0", bottom: "#3a3a3a" }], [2.85, 3.2, 94, { style: "shirt", top: "#7a9fd0", bottom: "#2b3040" }], [3.2, 3.1, 95, { style: "dress", top: "#d9a0b0", bottom: "#a8506a", hairStyle: "bun" }]]) {
    const a = H.uvz(hu, hv, 0), bow = Math.sin(k.t * 0.9 + seed) > 0.6;
    k.person(a.u, a.v, { z: a.z, pose: bow ? "clap" : "stand", dir: [-0.3, -1], seed, hat: null, bag: false, ...o });
  }
}
// people climbing / descending the main stairs (z follows the steps)
function stairPeople(k, t) {
  const H = HALL, v1 = H.B + H.RV, D = 1.05;
  const lanes = [[2.45, 0, 96, { style: "shirt", top: "#3b4f6e", bottom: "#2b3040" }], [2.75, 0.5, 97, { style: "dress", top: "#e8a0b8", bottom: "#c9567a", hairStyle: "bun" }], [3.25, 0.25, 98, { style: "tee", top: "#e8c14a", bottom: "#4a5a7a" }]];
  for (const [hu, off, seed, o] of lanes) {
    const path = [[hu, v1 + D + 0.25], [hu, v1 - 0.25]];
    const st = k.walkerState(path, { speed: 0.18, offset: off, dwell: 2.0 });
    const f = clamp((st.v - v1) / D), z = f >= 1 ? H.ZP : f <= 0 ? 0 : H.ZP * (Math.ceil(f * 10) / 10);
    const zz = st.v > v1 + D ? H.ZP : st.v < v1 ? 0 : z;
    const a = H.uvz(st.u, st.v, zz), b = H.uvz(st.u + st.du * 0.01, st.v + st.dv * 0.01, zz);
    k.person(a.u, a.v, { z: a.z, pose: st.moving ? "walk" : "stand", p: st.p, dir: [b.u - a.u || 0.01, b.v - a.v], seed, hat: null, bag: false, ...o });
  }
}

export const camera = { u: 4.8, v: 3.9, z: 2.5, zoom: 1.45, baseU: 4.8, baseV: 3.9, baseZ: 0.5, topZ: 8 };
