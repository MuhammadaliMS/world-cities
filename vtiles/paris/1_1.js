// PARIS · 1,1 · Moulin Rouge & café corner (code-drawn, traced over assets/paris/1_1.png)
import { P, CTS, INK, shade, lerp, clamp, rng, hash } from "../../lib/vec-kit.js";
import { uv, facade, plane, opening, band, frustums, dormer, chimney, smoke, pigeon, flock, sparkle, planter, debugRoutes, dense, inPoly, slateQuad } from "./_props.js";

const PAVE = "#e9dec6", ROADC = "#c4baa8", RED = "#b23a2b", REDD = "#8d2a20", GOLD = "#ffcf5a";
const SLATE2 = "#6f86a8";
const S = (x, y) => uv(x, y); // screen px -> (u,v) on the ground

// ---------- Haussmann blocks ----------
function bigChimney(k, u, v, z, du, dv, h, pots, smk, seed) {
  k.box(u, v, z, du, dv, h, "#e0cd9c", { hatch: false, shadow: false });
  k.box(u - 0.04, v - 0.04, z + h, du + 0.08, dv + 0.08, 0.1, "#cdb980", { hatch: false, shadow: false });
  const c = k.ctx;
  for (let i = 0; i < pots; i++) {
    const f = (i + 0.5) / pots, pu = u + du * f, pv = v + dv * f;
    const [x, y] = P(pu, pv, z + h + 0.1);
    c.fillStyle = "#cf6a35"; c.strokeStyle = INK; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(x - 3.2, y); c.lineTo(x - 2.4, y - 12); c.lineTo(x + 2.4, y - 12); c.lineTo(x + 3.2, y); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = "#a94c26"; c.fillRect(x - 3, y - 14, 6, 2.4); c.strokeRect(x - 3, y - 14, 6, 2.4);
  }
  if (smk) smoke(k, u + du / 2, v + dv / 2, z + h + 0.45, seed);
}
function tallBuilding(k, t, u0, v0, du, dv, H, o) {
  const col = o.col, colR = o.colR || col;
  k.box(u0, v0, 0, du, dv, H, col, { hatch: false, shadow: true, noTop: true });
  const floors = () => [
    { z0: 0.15, z1: 2.15, w: 0.7, glass: "#6b4a2a", mull: true, sill: false, lit: 0.3, arch: o.shopArch },
    { z0: 2.75, z1: 4.05, w: 0.36, balcony: true, ped: "alt", lit: 0.2, shutters: o.shut, glass: "#5d6e78" },
    { z0: 4.4, z1: 5.55, w: 0.34, lit: 0.2, shutters: o.shut, glass: "#5d6e78" },
    { z0: 5.9, z1: 7.15, w: 0.34, balcony: true, lit: 0.2, shutters: o.shut, glass: "#5d6e78" },
    { z0: 7.5, z1: 8.45, w: 0.3, lit: 0.2, shutters: o.shut, glass: "#5d6e78", ped: "seg" },
  ];
  const bands = [[2.3, 0.1, 0.09], [4.2, 0.07, 0.06], [5.75, 0.1, 0.09], [7.3, 0.07, 0.06], [H - 0.22, 0.22, 0.12]];
  facade(k, { side: "L", c: v0 + dv, s0: u0, s1: u0 + du, z1: H, col, bay: o.bay || 0.78, floors: floors(), bands, seed: o.seed });
  const plainFloors = [
    { z0: 0.15, z1: 2.15, w: 0.5, glass: "#8a6a3e", mull: true, sill: false, lit: 0.8 },
    { z0: 2.75, z1: 4.05, w: 0.34, lit: 0, glass: "#5d6e78", shutters: o.shut },
    { z0: 5.9, z1: 7.15, w: 0.34, lit: 0, glass: "#5d6e78", shutters: o.shut },
  ];
  facade(k, { side: "R", c: u0 + du, s0: v0, s1: v0 + dv, z1: H, col: colR, bay: o.bayR || 0.78, floors: o.plainR ? plainFloors.map((f) => ({ ...f, skip: (i, n) => i < n - 1 })) : floors(), bands: o.plainR ? [[H - 0.22, 0.22, 0.12]] : bands, seed: o.seed + 1, pilasters: !o.plainR });
  // iron balcony runs on the 2nd and 4th floors
  const c = k.ctx;
  const rails = [[plane("L", v0 + dv), u0, u0 + du, 2.75], [plane("L", v0 + dv), u0, u0 + du, 5.9]];
  if (!o.plainR) rails.push([plane("R", u0 + du), v0, v0 + dv, 2.75], [plane("R", u0 + du), v0, v0 + dv, 5.9]);
  for (const [Q, s0, s1, zz] of rails) {
    c.strokeStyle = "#262b30"; c.lineWidth = 1.7; c.beginPath(); c.moveTo(...Q(s0, zz + 0.3)); c.lineTo(...Q(s1, zz + 0.3)); c.stroke();
    c.lineWidth = 0.8; c.beginPath(); for (let s = s0; s <= s1; s += 0.09) { c.moveTo(...Q(s, zz + 0.3)); c.lineTo(...Q(s, zz + 0.04)); } c.stroke();
    c.lineWidth = 1.2; c.beginPath(); c.moveTo(...Q(s0, zz + 0.06)); c.lineTo(...Q(s1, zz + 0.06)); c.stroke();
  }
  // mansard roof (curved profile) + dormers + chimneys
  const h = 2.2;
  frustums(k, u0 - 0.05, v0 - 0.05, du + 0.1, dv + 0.1, H + 0.14, [[0, 0], [0.08, 0.6], [0.28, 1.3], [0.55, 1.75], [0.8, h]], o.slate || SLATE2, { n: 5 });
  const nU = Math.max(2, Math.round(du / 0.95)), nV = Math.max(2, Math.round(dv / 0.95));
  for (let i = 0; i < nU; i++) dormer(k, u0 + 0.4 + (i * (du - 0.8)) / Math.max(1, nU - 1), v0 + dv - 0.12, H + 0.85, { w: 7, h: 11, roof: "#4e5d78", lit: i % 2 === 0 });
  for (let i = 0; i < nV; i++) dormer(k, u0 + du - 0.12, v0 + 0.4 + (i * (dv - 0.8)) / Math.max(1, nV - 1), H + 0.85, { w: 7, h: 11, roof: "#3e4b64", frame: shade(colR, -0.15) });
  for (const ch of o.chim) bigChimney(k, ch[0], ch[1], H + 1.1, ch[2], ch[3], ch[4], ch[5], ch[6], o.seed + ch[0]);
}

// ---------- the Moulin ----------
const MU = 1.35, MV = 1.15, uF = 4.75, vF = 4.75, RAD = 1.5, MH = 3.75;
const TC = [2.55, 3.25]; // tower centre
const TZ0 = 3.95, TZ1 = 7.7; // tower base / top
// curved front wall path: straight (+u) -> quarter arc -> straight (-v)
const WALL = (() => {
  const U = [], V = [], D = 0.04;
  const a = uF - RAD - MU, arc = (Math.PI / 2) * RAD, b = vF - RAD - MV;
  for (let s = 0; s <= a; s += D) { U.push(MU + s); V.push(vF); }
  for (let s = 0; s <= arc; s += D) { const th = Math.PI / 2 - s / RAD; U.push(uF - RAD + RAD * Math.cos(th)); V.push(vF - RAD + RAD * Math.sin(th)); }
  for (let s = 0; s <= b; s += D) { U.push(uF); V.push(vF - RAD - s); }
  return { U, V, D, n: U.length, L: (U.length - 1) * D };
})();
const wAt = (i) => Math.max(0, Math.min(WALL.n - 1, i));
const wTan = (i) => { const a = wAt(i - 1), b = wAt(i + 1); const du = WALL.U[b] - WALL.U[a], dv = WALL.V[b] - WALL.V[a], l = Math.hypot(du, dv) || 1; return [du / l, dv / l]; };
const wX = (i) => P(WALL.U[i], WALL.V[i], 0)[0];
const wIdxX = (x) => { for (let i = 0; i < WALL.n; i++) if (wX(i) >= x) return i; return WALL.n - 1; };
const wP = (i, z) => P(WALL.U[wAt(i)], WALL.V[wAt(i)], z);
function wallStrip(c, i0, i1, z0, z1, fillFn, stroke) {
  for (let i = i0; i < i1; i++) {
    const [tu, tv] = wTan(i), nu = clamp(-tv, 0, 1); // outward normal = (-tv, tu): nu = -tv
    const a = wP(i, z0), b = wP(i + 1, z0), d = wP(i + 1, z1), e = wP(i, z1);
    c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.lineTo(...d); c.lineTo(...e); c.closePath();
    c.fillStyle = fillFn(i, nu, tu); c.fill();
    if (stroke) { c.strokeStyle = fillFn(i, nu, tu); c.lineWidth = 0.9; c.stroke(); }
  }
}
function wallLine(c, i0, i1, z, step = 1) { c.beginPath(); for (let i = i0; i <= i1; i += step) { const p = wP(i, z); i === i0 ? c.moveTo(...p) : c.lineTo(...p); } c.stroke(); }
// text on the curved wall, centred between screen x = xa..xb
function arcText(c, text, ia, ib, zBase, hUnits, font, fill, outline, glow) {
  const K = 100;
  c.save(); c.font = `${font} ${K * hUnits * 1.3}px Georgia, 'Times New Roman', serif`; c.textAlign = "center"; c.textBaseline = "alphabetic";
  const ws = [...text].map((ch) => c.measureText(ch).width / K), tot = ws.reduce((a, b) => a + b, 0), len = (ib - ia) * WALL.D;
  let acc = 0;
  [...text].forEach((ch, j) => {
    const s = (acc + ws[j] / 2) / tot * len; acc += ws[j];
    const i = Math.round(ia + s / WALL.D), [tu, tv] = wTan(i), [x, y] = wP(i, zBase);
    const sc = len / tot;
    c.save();
    c.transform(sc * CTS.S * (tu - tv) / K, sc * CTS.S * CTS.YS * (tu + tv) / K, 0, CTS.S * CTS.ZS / K, x, y);
    if (glow) { c.shadowColor = "rgba(255,190,70,0.95)"; c.shadowBlur = 12 * glow; }
    if (outline) { c.lineWidth = K * 0.035; c.strokeStyle = outline; c.lineJoin = "round"; c.strokeText(ch, 0, 0); }
    c.shadowBlur = glow ? 6 * glow : 0;
    c.fillStyle = typeof fill === "function" ? fill(c) : fill; c.fillText(ch, 0, 0);
    c.restore();
  });
  c.restore();
}
function bulbs(c, t, pts, ph) {
  pts.forEach(([x, y], i) => {
    const on = Math.sin(t * 6 - i * 0.75 + ph) > -0.1;
    c.fillStyle = on ? "#fff6c4" : "#a9742c"; c.beginPath(); c.arc(x, y, on ? 2.1 : 1.5, 0, 7); c.fill();
    if (on) { c.fillStyle = "rgba(255,214,110,0.32)"; c.beginPath(); c.arc(x, y, 4.6, 0, 7); c.fill(); }
  });
}

function moulinBody(k, t) {
  const c = k.ctx, n = WALL.n, zs0 = 1.75, zs1 = 3.65;
  // roof deck (what is seen behind the balustrade)
  const deck = []; for (let i = 0; i < n; i += 3) deck.push(P(WALL.U[i], WALL.V[i], MH));
  deck.push(P(uF, MV, MH), P(MU, MV, MH));
  k.path(deck, { fill: "#8a3227", lw: 1.2, wobble: 0 });
  // wall
  wallStrip(c, 0, n - 1, 0, MH, (i, nu) => shade(RED, -0.04 - 0.24 * nu), true);
  c.strokeStyle = "rgba(55,10,6,0.28)"; c.lineWidth = 0.7; for (let z = 0.35; z < MH; z += 0.35) wallLine(c, 0, n - 1, z, 3);
  const iA = wIdxX(396), iB = wIdxX(580);
  // entrance recess: warm glowing interior with drapes either side
  wallStrip(c, iA, iB, 0, zs0, (i) => "#b9652a");
  { const g = c.createLinearGradient(0, wP(iA, zs0)[1], 0, wP(iA, 0)[1]); g.addColorStop(0, "#3a1a10"); g.addColorStop(0.35, "#a14f26"); g.addColorStop(1, "#ffd27a");
    c.save(); c.beginPath(); for (let i = iA; i <= iB; i++) { const p = wP(i, zs0); i === iA ? c.moveTo(...p) : c.lineTo(...p); } for (let i = iB; i >= iA; i--) c.lineTo(...wP(i, 0)); c.closePath(); c.clip(); c.fillStyle = g; c.fillRect(0, 0, 1024, 1024);
    // inner pilasters and a glowing back door glimpse
    const R = rng(77); c.strokeStyle = "rgba(90,35,12,0.55)"; c.lineWidth = 1; for (let i = iA + 6; i < iB; i += 11) { c.beginPath(); c.moveTo(...wP(i, 0)); c.lineTo(...wP(i, zs0)); c.stroke(); }
    c.fillStyle = `rgba(255,236,170,${0.35 + 0.1 * Math.sin(t * 3)})`; const mid = Math.round((iA + iB) / 2); c.beginPath(); c.arc(...wP(mid, 1.0), 26, 0, 7); c.fill();
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 1.2; wallLine(c, iA, iB, zs0); }
  // red drapes at both sides of the opening
  for (const [a, b] of [[wIdxX(364), iA + 2], [iB - 2, wIdxX(606)]]) {
    wallStrip(c, a, b, 0, zs0 + 0.05, (i, nu) => shade("#9e1d1b", -0.1 - 0.15 * nu), true);
    c.strokeStyle = "rgba(40,5,5,0.55)"; c.lineWidth = 0.9; for (let i = a + 2; i < b; i += 5) { c.beginPath(); c.moveTo(...wP(i, zs0)); c.quadraticCurveTo(...wP(i + 2, zs0 * 0.5), ...wP(i, 0.05)); c.stroke(); }
    c.strokeStyle = INK; c.lineWidth = 1.1; wallLine(c, a, b, 0); wallLine(c, a, b, zs0 + 0.05);
  }
  // sign board: gold frame, dark-red field, brass letters, chasing bulbs
  const sA = wIdxX(358), sB = wIdxX(612);
  wallStrip(c, sA, sB, zs0, zs1, () => "#5e100e", true);
  wallStrip(c, sA, sB, zs0 + 0.1, zs1 - 0.1, (i, nu) => shade("#87201c", -0.22 * nu), true);
  c.strokeStyle = GOLD; c.lineWidth = 1.5; wallLine(c, sA, sB, zs0 + 0.1); wallLine(c, sA, sB, zs1 - 0.1);
  c.strokeStyle = INK; c.lineWidth = 1.3; wallLine(c, sA, sB, zs0); wallLine(c, sA, sB, zs1);
  // sign glow
  { c.save(); c.globalCompositeOperation = "lighter"; const [gx, gy] = wP(Math.round((sA + sB) / 2), 2.9); const g = c.createRadialGradient(gx, gy, 5, gx, gy, 150); g.addColorStop(0, `rgba(255,170,60,${0.2 + 0.06 * Math.sin(t * 3)})`); g.addColorStop(1, "rgba(255,170,60,0)"); c.fillStyle = g; c.fillRect(gx - 160, gy - 160, 320, 320); c.restore(); }
  const ta = wIdxX(372), tb = wIdxX(600);
  arcText(c, "MOULIN ROUGE", ta, tb, zs0 + 0.42, 0.78, "bold", (cc) => { const g = cc.createLinearGradient(0, -76, 0, 0); g.addColorStop(0, "#fff2a8"); g.addColorStop(0.5, "#ffc93f"); g.addColorStop(1, "#d98a1c"); return g; }, "#4a0c0a", 0.9 + 0.3 * Math.sin(t * 3));
  for (const zz of [zs0 + 0.05, zs1 - 0.05]) { const L = []; for (let i = sA, j = 0; i < sB; i += 5, j++) L.push(wP(i, zz)); bulbs(c, t, L, zz > 3 ? 1.3 : 0); }
  // vertical bulb columns at the ends of the sign
  for (const iE of [sA + 2, sB - 2]) { const L = []; for (let z = zs0; z <= zs1; z += 0.22) L.push(wP(iE, z)); bulbs(c, t, L, iE); }
  // neon script under the sign
  { const g = 0.7 + 0.3 * Math.sin(t * 4); arcText(c, "Féerie", wIdxX(420), wIdxX(570), 1.28, 0.5, "italic", `rgba(255,212,110,${g})`, null, 1); }
  // cornice above the sign, plinth for the balustrade
  wallStrip(c, 0, n - 1, zs1, MH, (i, nu) => shade("#9c2c22", -0.16 * nu), true);
  c.strokeStyle = INK; c.lineWidth = 1.3; wallLine(c, 0, n - 1, MH);
  wallStrip(c, 0, n - 1, MH, MH + 0.14, (i, nu) => shade("#e3cf9b", -0.22 * nu), true);
  c.strokeStyle = INK; c.lineWidth = 1; wallLine(c, 0, n - 1, MH + 0.14);
  // wrought-iron balustrade: posts, rails, scroll medallions
  c.strokeStyle = "#1f2327"; c.lineWidth = 0.9; c.beginPath(); for (let i = 0; i < n; i += 3) { c.moveTo(...wP(i, MH + 0.14)); c.lineTo(...wP(i, MH + 0.7)); } c.stroke();
  c.lineWidth = 1.7; wallLine(c, 0, n - 1, MH + 0.7, 2); c.lineWidth = 1.2; wallLine(c, 0, n - 1, MH + 0.32, 2);
  c.lineWidth = 0.9; for (let i = 6; i < n - 6; i += 12) { const [x, y] = wP(i, MH + 0.5); c.beginPath(); c.arc(x, y, 3.4, 0, 7); c.stroke(); }
  c.strokeStyle = "#c9a85a"; c.lineWidth = 0.6; wallLine(c, 0, n - 1, MH + 0.7, 2);
}

function windmill(k, t) {
  const c = k.ctx, [cu, cv] = TC, Zh = TZ1 - TZ0, N = 20;
  const R0 = 1.12, R1 = 1.0, ps = CTS.S * Math.SQRT2;
  // slate lean-to roofs on both sides of the tower, behind it
  slateQuad(k, [[352, 398], [410, 372], [410, 350], [352, 374]], "#6b82a6", { n: 3 });
  slateQuad(k, [[560, 378], [614, 402], [614, 378], [560, 352]], "#5a7092", { n: 3 });
  // tower body: smooth drum with vertical shading, plank courses, mid belt
  const [bx, by] = P(cu, cv, TZ0), [tx, ty] = P(cu, cv, TZ1);
  const rb = R0 * ps, rt = R1 * ps;
  c.beginPath(); c.moveTo(bx - rb, by); c.ellipse(bx, by, rb, rb * CTS.YS, 0, Math.PI, 0, true); c.lineTo(tx + rt, ty); c.ellipse(tx, ty, rt, rt * CTS.YS, 0, 0, Math.PI, false); c.closePath();
  const g = c.createLinearGradient(bx - rb, 0, bx + rb, 0); g.addColorStop(0, "#d4573f"); g.addColorStop(0.28, "#bd4430"); g.addColorStop(0.6, "#a2352a"); g.addColorStop(1, "#6e1d18");
  c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
  c.save(); c.clip();
  c.strokeStyle = "rgba(50,8,4,0.3)"; c.lineWidth = 0.8;
  for (let i = 1; i < 16; i++) { const f = i / 16, zz = TZ0 + f * Zh, r = lerp(R0, R1, f) * ps, [x, y] = P(cu, cv, zz); c.beginPath(); c.ellipse(x, y, r, r * CTS.YS, 0, 0, Math.PI); c.stroke(); }
  for (let i = -5; i <= 5; i++) { const a = i / 6 * Math.PI * 0.5, xa = bx + Math.sin(a) * rb, xb = tx + Math.sin(a) * rt; c.beginPath(); c.moveTo(xa, by + Math.cos(a) * rb * CTS.YS); c.lineTo(xb, ty + Math.cos(a) * rt * CTS.YS); c.stroke(); }
  // belt course
  { const zz = TZ0 + Zh * 0.17, r = lerp(R0, R1, 0.17) * ps + 3, [x, y] = P(cu, cv, zz); c.strokeStyle = "#e6c07a"; c.lineWidth = 3; c.beginPath(); c.ellipse(x, y, r, r * CTS.YS, 0, 0, Math.PI); c.stroke(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke(); }
  c.restore();
  // little arched door at the foot
  { const [x, y] = P(cu + 0.55, cv + 0.55, TZ0); c.fillStyle = "#3a1a10"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 7, y + 1); c.lineTo(x - 7, y - 14); c.quadraticCurveTo(x, y - 26, x + 7, y - 14); c.lineTo(x + 7, y + 1); c.closePath(); c.fill(); c.stroke(); c.fillStyle = "rgba(255,200,110,0.6)"; c.fillRect(x - 4, y - 14, 8, 12); }
  // lattice arched windows wrapped on the drum (foreshortened toward the sides)
  const win = (phi, zc, w, h, kind) => {
    const f = (zc - TZ0) / Zh, r = lerp(R0, R1, f) * ps, [x0, y0] = P(cu, cv, zc);
    const x = x0 + Math.sin(phi) * r, y = y0 + Math.cos(phi) * r * CTS.YS, sx = Math.max(0.25, Math.cos(phi));
    c.save(); c.translate(x, y); c.scale(sx, 1);
    c.beginPath();
    if (kind === "diamond") { c.moveTo(0, -h); c.lineTo(w, 0); c.lineTo(0, h); c.lineTo(-w, 0); c.closePath(); c.fillStyle = "#f0bd55"; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke(); }
    else {
      c.moveTo(-w, h * 0.55); c.lineTo(-w, -h * 0.25); c.quadraticCurveTo(-w * 0.9, -h * 0.85, 0, -h); c.quadraticCurveTo(w * 0.9, -h * 0.85, w, -h * 0.25); c.lineTo(w, h * 0.55); c.closePath();
      const gg = c.createLinearGradient(0, -h, 0, h * 0.6); gg.addColorStop(0, "#ffe9a0"); gg.addColorStop(1, `rgb(255,${176 + 20 * Math.sin(t * 2 + phi * 5)},80)`);
      c.fillStyle = gg; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke();
      c.save(); c.clip(); c.strokeStyle = "rgba(110,40,16,0.9)"; c.lineWidth = 0.9; c.beginPath();
      for (let q = -2; q <= 2; q++) { c.moveTo(-w, -h + q * h * 0.6); c.lineTo(w, h * 0.6 + q * h * 0.6); c.moveTo(w, -h + q * h * 0.6); c.lineTo(-w, h * 0.6 + q * h * 0.6); }
      c.stroke(); c.restore();
      c.strokeStyle = "#c9582a"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-w - 1, h * 0.58); c.lineTo(w + 1, h * 0.58); c.stroke();
    }
    c.restore();
  };
  for (let i = 0; i < 5; i++) win(lerp(-1.05, 1.05, i / 4), TZ0 + 1.4, 6.6, 17, "arch");
  for (let i = 0; i < 5; i++) win(lerp(-1.0, 1.0, i / 4) + 0.2 * 0, TZ0 + 2.6, 4.2, 6, "diamond");
  // cap: overhang ring + copper cone with plank seams
  const zc = TZ1 + 0.05, Rc = 1.32;
  k.cyl(cu, cv, zc, Rc, 0.16, "#7a2a1e");
  const [kx, ky] = P(cu, cv, zc + 0.16), [ax, ay] = P(cu, cv, zc + 1.55), rc = Rc * ps;
  k.cone(cu, cv, zc + 0.16, Rc - 0.02, 1.4, "#b24c32");
  c.save(); c.beginPath(); c.moveTo(kx - rc, ky); c.ellipse(kx, ky, rc, rc * CTS.YS, 0, Math.PI, 0, true); c.lineTo(ax, ay); c.closePath(); c.clip();
  c.strokeStyle = "rgba(60,15,8,0.55)"; c.lineWidth = 0.9; c.beginPath();
  for (let i = -8; i <= 8; i++) { const a = i / 8 * Math.PI * 0.5; c.moveTo(ax, ay); c.lineTo(kx + Math.sin(a) * rc, ky + Math.cos(a) * rc * CTS.YS); }
  c.stroke(); c.strokeStyle = "rgba(255,220,170,0.25)"; c.beginPath(); for (let i = -7; i <= 7; i += 2) { const a = (i + 0.5) / 8 * Math.PI * 0.5; c.moveTo(ax, ay); c.lineTo(kx + Math.sin(a) * rc, ky + Math.cos(a) * rc * CTS.YS); } c.stroke();
  c.restore();
  c.fillStyle = "#c7683a"; c.beginPath(); c.arc(ax, ay - 1, 2.2, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
}

// four lattice sails on the hub (screen-space, foreshortened vertically)
function sails(k, t) {
  const c = k.ctx, hx = 474, hy = 241, ang = (t - 3) * 0.42 + Math.PI / 4;
  const L = 156, HW = 23, R0 = 24, SY = 0.92;
  c.save(); c.translate(hx, hy); c.scale(1, SY);
  // axle boss shadow on tower
  c.fillStyle = "rgba(60,10,6,0.25)"; c.beginPath(); c.ellipse(5, 8, 30, 26, 0, 0, 7); c.fill();
  for (let i = 0; i < 4; i++) {
    c.save(); c.rotate(ang + (i * Math.PI) / 2);
    const x0 = R0, x1 = L, y0 = -HW, y1 = HW;
    // faint backing so the lattice reads against the sky/building
    c.fillStyle = "rgba(190,90,52,0.16)"; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    // diamond lattice (two bar passes: ink then rust)
    const pitch = 17, diag = [];
    for (let x = x0; x < x1 - 1; x += pitch) { const xe = Math.min(x + pitch, x1); const r = (xe - x) / pitch; diag.push([x, xe, r]); }
    for (const [col, lw] of [[INK, 4.2], ["#b04a2d", 2.6]]) {
      c.strokeStyle = col; c.lineWidth = lw; c.lineCap = "butt"; c.beginPath();
      // zig-zag diagonals both ways between the two long rails
      c.stroke(); c.beginPath();
      for (let x = x0; x < x1 - pitch * 0.5; x += pitch) { c.moveTo(x, y0); c.lineTo(x + pitch, 0); c.lineTo(x, y1); c.moveTo(x + pitch, y0); c.lineTo(x, 0); c.lineTo(x + pitch, y1); }
      c.stroke();
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y0); c.moveTo(x0, y1); c.lineTo(x1, y1); c.moveTo(x1, y0); c.lineTo(x1, y1); c.moveTo(x0, y0); c.lineTo(x0, y1);
      c.moveTo(x0, 0); c.lineTo(x1, 0);
      c.stroke();
    }
    // end cross-bars every few cells
    c.strokeStyle = "#8a3520"; c.lineWidth = 1.4; c.beginPath(); for (let x = x0 + pitch * 2; x < x1; x += pitch * 2) { c.moveTo(x, y0); c.lineTo(x, y1); } c.stroke();
    c.restore();
  }
  // hub: spiral rosette
  c.beginPath(); c.arc(0, 0, 17, 0, 7); c.fillStyle = "#b8452c"; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
  c.beginPath(); c.arc(0, 0, 11, 0, 7); c.fillStyle = "#d7673e"; c.fill(); c.lineWidth = 1; c.stroke();
  c.strokeStyle = "#f6cc92"; c.lineWidth = 1.3; c.beginPath(); for (let a = 0; a < 13; a += 0.2) { const r = 0.6 + a * 0.62; c.lineTo(Math.cos(a - ang * 2) * r, Math.sin(a - ang * 2) * r); } c.stroke();
  c.restore();
}
// ---------- street furniture ----------
function awningStripe(k, u0, v0, len, along, z, c1, c2, depth = 0.55) {
  const n = Math.round(len / 0.22);
  for (let i = 0; i < n; i++) {
    const a = along === "u" ? [u0 + (len * i) / n, v0] : [u0, v0 + (len * i) / n], b = along === "u" ? [u0 + (len * (i + 1)) / n, v0] : [u0, v0 + (len * (i + 1)) / n];
    const o = along === "u" ? [0, depth] : [depth, 0];
    k.poly([[a[0], a[1], z], [b[0], b[1], z], [b[0] + o[0], b[1] + o[1], z - 0.4], [a[0] + o[0], a[1] + o[1], z - 0.4]], i % 2 ? c2 : c1, { lw: 1.1, wobble: 0 });
  }
}

// ---------- Morris column (ref: ~4.3 tall, dark-green base, posters, openwork dome) ----------
function morris(k, u, v, t) {
  const c = k.ctx, ps = CTS.S * Math.SQRT2;
  k.ell(u + 0.45, v + 0.2, 0, 1.0, "rgba(60,45,30,0.22)", { stroke: false });
  k.cyl(u, v, 0, 0.74, 0.22, "#2c4a3b");
  k.cyl(u, v, 0.22, 0.66, 0.3, "#34553f");
  k.cyl(u, v, 0.52, 0.6, 0.1, "#2c4a3b", { top: false });
  const R = 0.55, z0 = 0.62, z1 = 3.3;
  const [x, y] = P(u, v, z0), r = R * ps, hh = (z1 - z0) * CTS.S * CTS.ZS;
  // body (plain stone behind the posters)
  const gb = c.createLinearGradient(x - r, 0, x + r, 0); gb.addColorStop(0, "#d9c7a0"); gb.addColorStop(1, "#8c7b58");
  c.beginPath(); c.moveTo(x - r, y); c.ellipse(x, y, r, r * CTS.YS, 0, Math.PI, 0, true); c.lineTo(x + r, y - hh); c.lineTo(x - r, y - hh); c.closePath(); c.fillStyle = gb; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
  // posters wrapped around the barrel, foreshortened at the sides
  const cols = [["#e9a43c", "#d9544b"], ["#3f6fb8", "#e8dfc4"], ["#5f9d6d", "#e27fa0"], ["#e8dfc4", "#3a3a8a"], ["#d9544b", "#f2c94c"], ["#7a5ea8", "#f0e0c0"]];
  for (let i = 0; i < 6; i++) {
    const a0 = lerp(-1.42, 1.42, i / 6) + 0.03, a1 = lerp(-1.42, 1.42, (i + 1) / 6) - 0.03;
    const px = (a) => x + Math.sin(a) * r * 0.99, py = (a) => y + Math.cos(a) * r * CTS.YS * 0.99;
    c.beginPath(); for (let j = 0; j <= 6; j++) { const a = lerp(a0, a1, j / 6); j ? c.lineTo(px(a), py(a)) : c.moveTo(px(a), py(a)); }
    for (let j = 6; j >= 0; j--) { const a = lerp(a0, a1, j / 6); c.lineTo(px(a), py(a) - hh * 0.93); } c.closePath();
    c.fillStyle = cols[i][0]; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
    c.save(); c.clip(); const am = (a0 + a1) / 2; c.fillStyle = cols[i][1]; c.globalAlpha = 0.85;
    c.beginPath(); c.arc(px(am), py(am) - hh * 0.42, Math.abs(Math.cos(am)) * r * 0.2 + 1, 0, 7); c.fill(); c.fillRect(px(a0), py(a0) - hh * 0.2, px(a1) - px(a0), 2.2); c.restore(); c.globalAlpha = 1;
  }
  // shading over posters
  { const gs = c.createLinearGradient(x - r, 0, x + r, 0); gs.addColorStop(0, "rgba(255,255,255,0.12)"); gs.addColorStop(0.55, "rgba(0,0,0,0)"); gs.addColorStop(1, "rgba(0,0,0,0.34)"); c.beginPath(); c.moveTo(x - r, y); c.ellipse(x, y, r, r * CTS.YS, 0, Math.PI, 0, true); c.lineTo(x + r, y - hh * 0.93); c.ellipse(x, y - hh * 0.93, r, r * CTS.YS, 0, 0, Math.PI, true); c.closePath(); c.fillStyle = gs; c.fill(); }
  // cornice, vented drum, dome, finial
  k.cyl(u, v, z1 - 0.2, 0.62, 0.14, "#2c4a3b");
  k.cyl(u, v, z1 - 0.08, 0.58, 0.12, "#264034", { top: false });
  k.cyl(u, v, z1 + 0.04, 0.64, 0.16, "#2f5642");
  k.cyl(u, v, z1 + 0.2, 0.52, 0.45, "#254635");
  { const [dx, dy] = P(u, v, z1 + 0.4); c.fillStyle = "#0f2219"; for (let i = -2; i <= 2; i++) { const a = i * 0.5; c.beginPath(); c.ellipse(dx + Math.sin(a) * 0.5 * ps, dy + Math.cos(a) * 0.5 * ps * CTS.YS - 4, 3.2 * Math.cos(a), 8, 0, 0, 7); c.fill(); } }
  k.cyl(u, v, z1 + 0.65, 0.6, 0.1, "#2f5642");
  k.dome(u, v, z1 + 0.75, 0.56, 0.85, "#2e5f48", { ribs: 6 });
  // scale texture on dome
  { const [dx, dy] = P(u, v, z1 + 0.78); c.strokeStyle = "rgba(10,30,20,0.4)"; c.lineWidth = 0.6; for (let q = 1; q < 6; q++) { const f = q / 6; c.beginPath(); c.ellipse(dx, dy - f * 24, 0.6 * ps * (1 - f * 0.9), 0.6 * ps * CTS.YS * (1 - f * 0.9), 0, 0, Math.PI); c.stroke(); } }
  k.cone(u, v, z1 + 1.6, 0.06, 0.45, "#2f5f4a");
  sparkle(k, ...P(u, v, z1 + 2.0), t * 1.4, 0.9);
}
// tiered flower display with bunches
function flowerShelf(k, u, v, du, dv, seed, tiers = 3) {
  const c = k.ctx, R = rng(seed);
  const pal = ["#e8607a", "#f4c542", "#f39ac0", "#ffffff", "#e9813c", "#d94a5c", "#a98ad8", "#c53a4e"];
  for (let i = 0; i < tiers; i++) {
    const f = i / tiers, uu = u + du * 0.0 + (du > dv ? 0 : f * 0.28), vv = v + (du > dv ? f * 0.2 : 0);
    k.box(uu, vv, 0, du - (du > dv ? 0 : f * 0.28), dv - (du > dv ? f * 0.2 : 0), 0.32 + i * 0.28, "#7a5a3a", { hatch: false, shadow: i === 0 });
  }
  const nb = Math.round((du > dv ? du : dv) / 0.2);
  for (let i = 0; i < nb; i++) for (let tr = 0; tr < tiers; tr++) {
    const f = tr / tiers, pu = du > dv ? u + 0.12 + (du - 0.24) * (i + 0.5) / nb : u + f * 0.28 + 0.15, pv = du > dv ? v + f * 0.2 + 0.18 : v + 0.12 + (dv - 0.24) * (i + 0.5) / nb;
    const [x, y] = P(pu, pv, 0.34 + tr * 0.28);
    c.fillStyle = "#4e8a45"; c.fillRect(x - 3, y - 2, 6, 3);
    for (let j = 0; j < 6; j++) { const a = R() * 6.28, d = R() * 5; c.fillStyle = pal[Math.floor(R() * pal.length)]; c.beginPath(); c.arc(x + Math.cos(a) * d, y - 5 + Math.sin(a) * d * 0.6 - R() * 5, 2.7, 0, 7); c.fill(); }
  }
}
function flowerPots(k, u, v, seed) {
  const c = k.ctx, R = rng(seed), pal = ["#e8607a", "#f4c542", "#f39ac0", "#ffffff", "#e9813c", "#d94a5c", "#a98ad8", "#6ab04c"];
  const [x, y] = P(u, v, 0);
  c.fillStyle = "#b86a3c"; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x - 5, y - 8); c.lineTo(x + 5, y - 8); c.lineTo(x + 3.5, y); c.lineTo(x - 3.5, y); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = "#4e8a45"; c.beginPath(); c.ellipse(x, y - 9, 6.5, 3.2, 0, 0, 7); c.fill();
  for (let j = 0; j < 8; j++) { c.fillStyle = pal[Math.floor(R() * pal.length)]; c.beginPath(); c.arc(x - 6 + R() * 12, y - 11 - R() * 8, 2.5, 0, 7); c.fill(); }
}
function bistro(k, u, v, t, seed, col = "#c9402f") {
  const c = k.ctx;
  k.ell(u, v, 0, 0.22, "rgba(60,45,30,0.15)", { stroke: false });
  const [x, y] = P(u, v, 0); c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 9); c.stroke();
  k.circle(x, y - 10, 6, "#f4efe3", { lw: 1.1 }); c.fillStyle = col; c.beginPath(); c.arc(x, y - 10, 3, 0, 7); c.fill();
  const ph = (t * 0.6 + seed) % 1; c.strokeStyle = `rgba(255,255,255,${0.6 * (1 - ph)})`; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 2, y - 12); c.quadraticCurveTo(x + 4, y - 16 - ph * 5, x + 1, y - 20 - ph * 6); c.stroke();
}
function wickerChair(k, u, v, face = 1) {
  const c = k.ctx, [x, y] = P(u, v, 0.3);
  c.fillStyle = "#b5824a"; c.strokeStyle = INK; c.lineWidth = 1;
  c.beginPath(); c.ellipse(x, y, 5, 2.6, 0, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.arc(x - face * 3, y - 6, 5, Math.PI * 0.9, Math.PI * 2.1); c.stroke();
  c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x - 3, y + 2); c.lineTo(x - 3, y + 8); c.moveTo(x + 3, y + 2); c.lineTo(x + 3, y + 8); c.stroke();
}
function guitarist(k, t) {
  const u = 6.45, v = 7.05, c = k.ctx;
  k.qperson(u, v, { pose: "sit", seatZ: 0.32, dir: [-0.3, 1], seed: 81, bench: true, hat: "beret", hatCol: "#c8403a", style: "stripes" });
  k.q(u + v + 0.2, () => {
    const [x, y] = P(u + 0.1, v + 0.12, 0.5); const sw = Math.sin(t * 5) * 1.6;
    c.save(); c.translate(x, y); c.rotate(-0.5); c.fillStyle = "#c98a3c"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.ellipse(0, 0, 6, 4.4, 0, 0, 7); c.fill(); c.stroke(); c.fillStyle = "#3a2a1c"; c.beginPath(); c.arc(0, 0, 1.5, 0, 7); c.fill();
    c.strokeStyle = "#5a3a1c"; c.lineWidth = 2; c.beginPath(); c.moveTo(5, -1); c.lineTo(17, -4 + sw * 0.3); c.stroke(); c.restore();
    // case with coins
    const [bx, by] = P(u + 0.55, v + 0.35, 0); c.fillStyle = "#3a2a1c"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.roundRect(bx - 6, by - 3, 12, 6, 2); c.fill(); c.stroke(); c.fillStyle = "#e9c24d"; c.fillRect(bx - 2, by - 1.5, 1.8, 1.2); c.fillRect(bx + 1, by - 1, 1.8, 1.2);
    // music notes floating
    for (let i = 0; i < 3; i++) { const ph = (t * 0.5 + i / 3) % 1; c.fillStyle = `rgba(40,30,20,${1 - ph})`; c.font = "bold 11px serif"; c.fillText(i % 2 ? "♪" : "♫", x + 12 + Math.sin(ph * 6 + i) * 4, y - 14 - ph * 28); }
  });
}


// ---------- ground plan (traced from the painting) ----------
const COB = [[285, 805], [370, 776], [460, 749], [500, 739], [522, 738], [548, 746], [640, 776], [730, 806], [620, 873], [498, 813], [405, 866]].map(([x, y]) => S(x, y));
const CURB = [[285, 805], [370, 776], [460, 749], [500, 739], [522, 738], [548, 746], [640, 776], [730, 806]].map(([x, y]) => S(x, y));
const ISL = [7.7, 8.0, 2.3, 2.0];
const cs = (pts) => pts.map(([u, v]) => P(u, v));
function groundDetail(k, t) {
  const c = k.ctx;
  // paving slab joints across the plaza
  c.strokeStyle = "rgba(150,130,100,0.28)"; c.lineWidth = 0.8; c.beginPath();
  for (let a = 0.5; a < 10; a += 1.0) { c.moveTo(...P(a, 0)); c.lineTo(...P(a, 10)); c.moveTo(...P(0, a)); c.lineTo(...P(10, a)); }
  c.stroke();
  // cobbled street
  c.save(); k._trace(cs(COB), true, 0); c.clip();
  c.fillStyle = "#b5ad9d"; c.fillRect(0, 0, 1024, 1024);
  const R = rng(5), tones = ["#a9a191", "#c1baab", "#b2aa9a", "#9d9585", "#cbc4b5"];
  for (let v = 5.0; v < 10.2; v += 0.17) for (let u = 4.8; u < 10.2; u += 0.2) {
    const uu = u + (Math.floor(v / 0.17) % 2) * 0.1 + (R() - 0.5) * 0.04, vv = v + (R() - 0.5) * 0.03;
    c.beginPath(); c.moveTo(...P(uu, vv)); c.lineTo(...P(uu + 0.17, vv)); c.lineTo(...P(uu + 0.17, vv + 0.14)); c.lineTo(...P(uu, vv + 0.14)); c.closePath();
    c.fillStyle = tones[Math.floor(R() * 5)]; c.fill(); c.strokeStyle = "rgba(70,60,48,0.45)"; c.lineWidth = 0.6; c.stroke();
  }
  // shadow cast by the Morris column across the cobbles
  { const [x, y] = P(8.9, 9.1); c.fillStyle = "rgba(60,48,40,0.22)"; c.beginPath(); c.moveTo(x - 20, y - 6); c.lineTo(x - 120, y - 52); c.lineTo(x - 70, y - 22); c.lineTo(x - 16, y + 14); c.closePath(); c.fill(); }
  c.restore();
  // raised curb along the plaza edge
  c.lineCap = "round"; c.lineJoin = "round";
  for (const [lw, col, dy] of [[9, "rgba(110,92,70,0.55)", 4], [7, "#f4edda", 0]]) {
    c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); CURB.forEach(([u, v], i) => { const [x, y] = P(u, v); i ? c.lineTo(x, y + dy) : c.moveTo(x, y + dy); }); c.stroke();
  }
  c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); CURB.forEach(([u, v], i) => { const [x, y] = P(u, v); i ? c.lineTo(x, y + 4) : c.moveTo(x, y + 4); }); c.stroke();
  // little pavement island with the Morris column
  k.box(ISL[0], ISL[1], 0, ISL[2], ISL[3], 0.09, "#e6ddc8", { hatch: false, shadow: false });
  c.strokeStyle = "rgba(150,130,100,0.4)"; c.lineWidth = 0.8; c.beginPath();
  for (let a = 0; a <= 2.3; a += 0.77) { c.moveTo(...P(ISL[0] + a, ISL[1], 0.09)); c.lineTo(...P(ISL[0] + a, ISL[1] + 2, 0.09)); }
  for (let a = 0; a <= 2; a += 0.67) { c.moveTo(...P(ISL[0], ISL[1] + a, 0.09)); c.lineTo(...P(ISL[0] + 2.3, ISL[1] + a, 0.09)); }
  c.stroke();
  // tree pits
  for (const [u, v] of [[0.84, 9.77], [2.7, 9.4], [8.9, 1.15]]) { c.fillStyle = "#6e5a44"; c.strokeStyle = INK; c.lineWidth = 0.9; const [x, y] = P(u, v); c.beginPath(); c.ellipse(x, y, 20, 11, 0, 0, 7); c.fill(); c.stroke(); c.strokeStyle = "#3b3a3a"; c.beginPath(); c.ellipse(x, y, 20, 11, 0, 0, 7); c.stroke(); }
  // warm light spilling from the Moulin forecourt
  { const g = c.createRadialGradient(...P(4.1, 5.0), 5, ...P(4.1, 5.0), 170); g.addColorStop(0, "rgba(255,206,120,0.6)"); g.addColorStop(1, "rgba(255,206,120,0)"); c.save(); k._trace([[2.2, 4.4], [6.8, 4.4], [6.8, 7.8], [2.2, 7.8]].map(([u, v]) => P(u, v)), true, 0); c.clip(); c.fillStyle = g; c.fillRect(0, 0, 1024, 1024); c.restore(); }
}

// ---------- routes (screen points -> ground uv, so they follow the painting) ----------
const sp = (...pts) => pts.map(([x, y]) => S(x, y));
const ROUTES = {
  fore1: [[4.0, 5.9], [5.0, 5.7], [5.6, 4.9], [4.9, 4.9]],
  fore2: [[3.9, 5.0], [4.3, 6.1], [5.2, 6.2]],
  fore3: [[4.9, 5.2], [5.6, 6.2], [5.4, 7.3]],
  lane: [[5.3, 8.0], [5.4, 6.7], [5.8, 5.5]],
  aisle: [[6.0, 5.2], [7.5, 5.2], [9.2, 5.4]],
  cobA: sp([330, 812], [420, 790], [500, 776], [585, 790], [672, 815]),
  cobB: sp([685, 815], [600, 786], [520, 764], [430, 780], [345, 810]),
  edgeR: [[9.65, 2.9], [9.65, 4.6], [9.6, 6.4]],
  edgeL: [[3.55, 9.5], [4.4, 9.5], [4.6, 8.3]],
  frontL: sp([300, 850], [360, 880], [420, 905], [470, 928]),
  terr: [[8.2, 4.9], [8.7, 3.9], [9.0, 3.1]],
  bright: [[9.5, 8.6], [9.5, 7.6], [9.4, 6.7]],
};
const PHOTO = [[4.2, 6.9], [4.6, 5.9]];
export const camera = { u: 3.6, v: 4.6, z: 4.8, zoom: 1.85, baseU: 4.2, baseV: 4.4, baseZ: 0.6, topZ: 9.4 };

export default function draw(k, t) {
  const c = k.ctx;
  k.groundTrace({ lawn: [], water: [], walks: [] }, { paved: PAVE, side: "#e3d3b0", stipple: 5 });
  groundDetail(k, t);
  // ---- buildings ----
  k.q(8.6, () => tallBuilding(k, t, 0.0, 6.7, 3.2, 2.1, 8.8, { col: "#e9d49b", colR: "#efe3c6", shut: "#8a9b8c", seed: 3, slate: "#6c82a4", chim: [[2.0, 6.95, 0.7, 0.4, 0.9, 5, true], [0.35, 7.1, 0.28, 0.28, 0.7, 2, false], [0.4, 8.3, 0.28, 0.28, 0.7, 2, false], [1.2, 8.35, 0.28, 0.28, 0.6, 2, false]], shopArch: true }));
  k.q(8.6, () => tallBuilding(k, t, 4.95, 0.0, 2.55, 2.8, 8.8, { plainR: true, col: "#f0e3c4", colR: "#e8d8b2", shut: "#7f9396", seed: 8, slate: "#6c82a4", chim: [[5.8, 0.35, 0.7, 0.4, 0.8, 5, true], [7.0, 0.5, 0.28, 0.28, 0.7, 2, false], [7.0, 2.1, 0.28, 0.28, 0.65, 2, false], [5.2, 2.2, 0.28, 0.28, 0.6, 2, false]] }));
  // the Moulin: body + curved marquee, tower, sails (drawn as one block between the two buildings)
  k.q(8.4, () => { moulinBody(k, t); windmill(k, t); sails(k, t); });
  // awnings on the building faces
  k.q(8.7, () => awningStripe(k, 3.2, 6.8, 1.95, "v", 2.65, "#c8402f", "#f6e2bc", 0.7));
  k.q(8.7, () => { awningStripe(k, 4.95, 2.8, 2.55, "u", 2.55, "#d85a38", "#e56a40", 0.75); awningStripe(k, 7.5, 0.9, 1.95, "v", 2.55, "#d85a38", "#e56a40", 0.75); });
  // flowers at the foot of the left building
  k.q(9.4, () => flowerShelf(k, 3.4, 5.55, 1.7, 0.5, 14));
  k.q(10.4, () => flowerShelf(k, 3.4, 6.35, 0.5, 1.3, 15));
  for (const [u, v, s] of [[3.6, 7.8, 1], [3.95, 8.2, 2], [4.3, 7.6, 3], [3.7, 8.55, 4], [4.4, 8.4, 5], [4.55, 7.1, 6], [4.9, 6.9, 7], [4.2, 6.5, 8]]) k.q(u + v, () => flowerPots(k, u, v, s * 11));
  // café terrace
  for (const [u, v, s] of [[5.75, 3.45, 1], [6.95, 4.0, 2], [7.95, 3.5, 3], [8.9, 2.55, 4], [9.05, 1.45, 5]]) {
    k.q(u + v, () => bistro(k, u, v, t, s, s % 2 ? "#c9402f" : "#3f6fb8"));
    k.q(u + v - 0.3, () => { wickerChair(k, u - 0.45, v - 0.05, 1); });
    k.q(u + v + 0.3, () => { wickerChair(k, u + 0.4, v + 0.15, -1); });
    k.qperson(u - 0.45, v - 0.05, { pose: "sit", seatZ: 0.32, dir: [1, 0.3], seed: 60 + s, bench: true });
    if (s !== 4) k.qperson(u + 0.42, v + 0.18, { pose: "sit", seatZ: 0.32, dir: [-1, 0.1], seed: 70 + s, bench: true, gesture: s % 2 === 0 });
  }
  guitarist(k, t);
  k.q(9.9 + 9.1 + 1, () => morris(k, 8.9, 9.1, t));
  // lamps, trees
  for (const [u, v] of [[3.9, 9.35], [9.25, 4.05]]) k.q(u + v, () => k.lamp(u, v, { col: "#2c4a3b" }));
  for (const [u, v, s, r, h, col] of [[0.84, 9.77, 1, 1.3, 4.4, "#8cb85f"], [2.7, 9.4, 2, 1.2, 3.3, "#86b05a"], [8.9, 1.15, 3, 1.35, 4.4, "#86b05a"]]) k.q(u + v + 0.6, () => k.tree(u, v, { r, h, seed: s * 9, col }));
  for (const [u, v, s] of [[3.9, 8.9, 1], [6.1, 5.6, 2], [9.3, 5.2, 3], [5.0, 6.4, 4]]) k.q(u + v, () => pigeon(k, u, v, t, s));
  const W = (name, off, seed, sp_ = 0.42, extra = {}) => k.qwalker(ROUTES[name], { speed: sp_, offset: off, seed, dwell: 1.2 + (seed % 3) * 0.6, ...extra });
  W("fore1", 0.0, 21); W("fore1", 0.55, 22, 0.4); W("fore2", 0.3, 23); W("fore3", 0.5, 24, 0.36); W("lane", 0.2, 25, 0.42);
  W("aisle", 0.2, 27); W("edgeR", 0.4, 28); W("edgeL", 0.5, 29, 0.3); W("terr", 0.7, 30, 0.34); W("bright", 0.1, 31, 0.3);
  W("cobA", 0.3, 34, 0.46); W("cobB", 0.7, 35, 0.44);
  k.qcyclist(ROUTES.cobA, { speed: 0.95, offset: 0.0, seed: 33, col: "#3f73b5", basket: true });
  k.qperson(4.55, 5.55, { pose: "photo", dir: [-0.3, -1], seed: 72 }); k.qperson(5.05, 5.65, { pose: "wave", dir: [-0.3, -1], seed: 73 });
  k.qperson(4.7, 5.2, { pose: "stand", dir: [0.3, -1], seed: 71 });
  debugRoutes(k, Object.values(ROUTES));
  k.flush();
  flock(k, 430, 120, 6, t, 5);
  k.circlingBird(480, 90, 80, 22, { speed: 0.6, phase: 1 });
  k.cloud(160, 100, { s: 0.85, phase: 1 }); k.cloud(870, 90, { s: 0.7, phase: 3 });
}
