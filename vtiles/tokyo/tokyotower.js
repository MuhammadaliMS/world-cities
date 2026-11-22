// Tokyo Tower: wide splayed openwork lattice (international orange + white), leg trusses with
// zig-zag bracing, arch openings, two-storey main deck, top deck, striped antenna, beacon.
import { P, INK, shade, lerp, clamp } from "../../lib/vec-kit.js";
import { stdProj, mbox, mwin } from "./_props.js";

const RED = "#e2481f", REDD = "#a8301a", REDL = "#f06a3a", WHITE = "#f8f4ea", GREY = "#7d8588";
const ZD = 5.5; // main deck base
const ZT = 10.3; // top deck base

export function makeTower(C) {
  const KEYS = [[0, 1.8], [1, 1.64], [1.9, 1.47], [3.3, 0.95], [4.2, 0.72], [ZD, 0.5], [7.6, 0.33], [9.6, 0.24], [ZT, 0.2], [14, 0.1]];
  const H = (z) => { for (let i = 0; i < KEYS.length - 1; i++) if (z <= KEYS[i + 1][0]) return lerp(KEYS[i][1], KEYS[i + 1][1], (z - KEYS[i][0]) / (KEYS[i + 1][0] - KEYS[i][0])); return 0.1; };
  const F = (face, s, z) => { const h = H(z); if (face === "L") return P(C + s * h, C + h, z); if (face === "R") return P(C + h, C + s * h, z); if (face === "A") return P(C + s * h, C - h, z); return P(C - h, C + s * h, z); };
  const back = (f) => f === "A" || f === "B";
  // leg width in tile units (fat at the foot, slim at the deck)
  const WL = (z) => lerp(0.42, 0.13, clamp(z / ZD));
  const sIn = (side, z) => side * (1 - WL(z) / H(z));
  const curve = (fn, z0, z1, n = 14) => { const o = []; for (let i = 0; i <= n; i++) o.push(fn(lerp(z0, z1, i / n))); return o; };
  const poly = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
  const stroke = (c, pts, w, col, ink = true) => {
    c.lineCap = "round"; c.lineJoin = "round"; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
    if (ink) { c.strokeStyle = INK; c.lineWidth = w + 1.2; c.stroke(); }
    c.strokeStyle = col; c.lineWidth = w; c.stroke();
  };
  const PANELS = [0, 1.0, 1.9, 2.7, 3.4, 4.0, 4.6, 5.2, ZD];

  function leg(k, face, side) {
    const c = k.ctx, bk = back(face), z0 = 0, z1 = ZD;
    const outer = curve((z) => F(face, side, z), z0, z1), inner = curve((z) => F(face, sIn(side, z), z), z0, z1);
    const shape = [...outer, ...[...inner].reverse()];
    c.save(); c.globalAlpha = bk ? 0.35 : 0.6; poly(c, shape); c.fillStyle = face === "R" || bk ? REDD : shade(RED, -0.05); c.fill(); c.restore();
    c.save(); poly(c, shape); c.clip();
    c.strokeStyle = bk ? "rgba(70,20,10,0.55)" : "rgba(255,170,120,0.85)"; c.lineWidth = bk ? 0.8 : 1.1; c.beginPath();
    const band = 0.3;
    for (let z = z0; z < z1; z += band) {
      const a = F(face, side, z), b = F(face, sIn(side, z + band / 2), z + band / 2), d = F(face, side, z + band);
      const a2 = F(face, sIn(side, z), z), b2 = F(face, side, z + band / 2), d2 = F(face, sIn(side, z + band), z + band);
      c.moveTo(...a); c.lineTo(...b); c.lineTo(...d); c.moveTo(...a2); c.lineTo(...b2); c.lineTo(...d2);
    }
    c.stroke();
    c.strokeStyle = bk ? "rgba(70,20,10,0.5)" : "rgba(90,25,10,0.8)"; c.lineWidth = 0.8; c.beginPath();
    for (let z = z0 + 0.15; z < z1; z += band) { c.moveTo(...F(face, side, z)); c.lineTo(...F(face, sIn(side, z), z)); }
    c.stroke(); c.restore();
    const w = bk ? 1.2 : 2.3;
    stroke(c, outer, w, bk ? REDD : REDL); stroke(c, inner, w * 0.85, bk ? REDD : RED);
  }

  // infill between the two legs: X bracing in panels, open arch at the bottom
  function infill(k, face) {
    const c = k.ctx, bk = back(face);
    const sE = Math.abs(sIn(1, 1.4));
    const arch = (s) => 0.1 + 1.55 * Math.sqrt(Math.max(0, 1 - (s / sE) ** 2));
    const lim = [];
    lim.push(F(face, -1, ZD), F(face, 1, ZD));
    const n = 22; for (let i = 0; i <= n; i++) { const s = sE - (2 * sE * i) / n; lim.push(F(face, s, arch(s) + 0.08)); }
    c.save(); poly(c, lim); c.clip();
    c.globalAlpha = bk ? 0.5 : 1;
    c.strokeStyle = bk ? "rgba(120,35,15,0.9)" : RED; c.lineWidth = bk ? 1.1 : 1.7; c.lineCap = "round";
    const dark = bk ? "rgba(40,12,6,0.45)" : "rgba(40,12,6,0.9)";
    for (const [col, w] of [[dark, (bk ? 1.1 : 1.7) + 1.1], [bk ? "rgba(214,70,28,0.8)" : RED, bk ? 1.1 : 1.7]]) {
      c.strokeStyle = col; c.lineWidth = w; c.beginPath();
      for (let i = 0; i < PANELS.length - 1; i++) {
        const za = PANELS[i], zb = PANELS[i + 1], l0 = sIn(-1, za), r0 = sIn(1, za), l1 = sIn(-1, zb), r1 = sIn(1, zb);
        c.moveTo(...F(face, l0, za)); c.lineTo(...F(face, r1, zb)); c.moveTo(...F(face, r0, za)); c.lineTo(...F(face, l1, zb));
        // second diagonal pair (denser lattice) via mid-vertical split
        const m0 = 0, zm = (za + zb) / 2;
        c.moveTo(...F(face, l0, za)); c.lineTo(...F(face, m0, zm)); c.lineTo(...F(face, r0, za));
        c.moveTo(...F(face, l1, zb)); c.lineTo(...F(face, m0, zm)); c.lineTo(...F(face, r1, zb));
        c.moveTo(...F(face, l1, zb)); c.lineTo(...F(face, r1, zb));
        for (const q of [-0.5, 0.5]) { c.moveTo(...F(face, q * l1 * 0 + q * (r0 - l0) / 2 + (l0 + r0) / 2 - 0.0, za)); c.lineTo(...F(face, q * (r1 - l1) / 2 + (l1 + r1) / 2 + 0.25 * Math.sign(q) * 0, zb)); }
      }
      c.stroke();
    }
    c.restore();
    // arch girder (curved heavy member)
    const arcPts = []; for (let i = 0; i <= n; i++) { const s = -sE + (2 * sE * i) / n; arcPts.push(F(face, s, arch(s) + 0.08)); }
    stroke(c, arcPts, bk ? 1.4 : 2.4, bk ? REDD : RED);
    const arcPts2 = []; for (let i = 0; i <= n; i++) { const s = -sE + (2 * sE * i) / n; arcPts2.push(F(face, s, arch(s) + 0.4)); }
    stroke(c, arcPts2, bk ? 1.0 : 1.5, bk ? REDD : RED);
  }

  function upperFace(k, face) {
    const c = k.ctx, bk = back(face), z0 = ZD + 1.1, z1 = ZT;
    // colour bands: orange / white / orange
    const bands = [[ZD + 0.9, 7.7, RED], [7.7, 9.5, WHITE], [9.5, ZT, RED]];
    for (const [a, b, col] of bands) {
      const shape = [...curve((z) => F(face, -1, z), a, b, 6), ...curve((z) => F(face, 1, z), b, a, 6)];
      c.save(); c.globalAlpha = bk ? (col === WHITE ? 0.45 : 0.18) : (col === WHITE ? 0.95 : 0.5); poly(c, shape); c.fillStyle = col; c.fill(); c.restore();
      c.save(); poly(c, shape); c.clip();
      c.lineCap = "round";
      for (const [lc, w] of [[bk ? "rgba(40,12,6,0.4)" : (col === WHITE ? "#7a2a14" : INK), bk ? 1.4 : (col === WHITE ? 2.2 : 2.4)], [col === WHITE ? RED : (bk ? shade(col, -0.1) : col), bk ? 0.8 : (col === WHITE ? 1.3 : 1.4)]]) {
        c.strokeStyle = lc; c.lineWidth = w; c.beginPath();
        let z = a;
        while (z < b) {
          const zb = Math.min(b, z + Math.max(0.45, H(z) * 1.5));
          c.moveTo(...F(face, -1, z)); c.lineTo(...F(face, 1, zb)); c.moveTo(...F(face, 1, z)); c.lineTo(...F(face, -1, zb)); c.moveTo(...F(face, -1, zb)); c.lineTo(...F(face, 1, zb));
          z = zb;
        }
        c.stroke();
      }
      c.restore();
    }
    for (const s of [-1, 1]) stroke(c, curve((z) => F(face, s, z), ZD + 0.9, ZT, 10), bk ? 1.1 : 2.1, bk ? REDD : (s < 0 ? REDL : RED));
  }

  function deck(k, t) {
    const c = k.ctx;
    const s1 = 0.52, s2 = 0.62, s3 = 0.68;
    // lower storey (observation floor, flared base)
    mbox(k, stdProj, C - 0.54, C - 0.54, ZD - 0.08, 1.08, 1.08, 0.14, GREY, { wobble: 0 });
    const b1 = mbox(k, stdProj, C - s1, C - s1, ZD + 0.06, 2 * s1, 2 * s1, 0.46, "#ece7d8", { wobble: 0, left: "#f1ecde", right: "#c9c4b4" });
    mwin(k, b1, "L", { rows: 1, cols: 7, z0: 0.08, z1: 0.38, color: "#7a9db5", lit: 0.3, litCol: "#ffe39a", gap: 0.18, mx: 0.03, lw: 0.6, seed: 3 });
    mwin(k, b1, "R", { rows: 1, cols: 7, z0: 0.08, z1: 0.38, color: "#7a9db5", lit: 0.3, litCol: "#f0cf80", gap: 0.18, mx: 0.03, lw: 0.6, seed: 7 });
    // upper storey (glass ring, slightly wider)
    const b2 = mbox(k, stdProj, C - s2, C - s2, ZD + 0.52, 2 * s2, 2 * s2, 0.46, "#c8d6dc", { wobble: 0, left: "#d3e0e6", right: "#98acb6" });
    mwin(k, b2, "L", { rows: 1, cols: 9, z0: 0.06, z1: 0.4, color: "#8fc0d8", lit: 0.2, litCol: "#fff0b0", gap: 0.12, mx: 0.02, lw: 0.6, seed: 1, sheen: true });
    mwin(k, b2, "R", { rows: 1, cols: 9, z0: 0.06, z1: 0.4, color: "#6fa2bc", lit: 0.2, litCol: "#f6e0a0", gap: 0.12, mx: 0.02, lw: 0.6, seed: 5, sheen: true });
    // roof lip (grey overhang) + red rim
    mbox(k, stdProj, C - s3, C - s3, ZD + 0.98, 2 * s3, 2 * s3, 0.1, "#98a0a4", { wobble: 0 });
    mbox(k, stdProj, C - 0.3, C - 0.3, ZD + 1.08, 0.6, 0.6, 0.08, "#b9c0c3", { wobble: 0 });
    // little visitors on the roof rim
    for (let i = 0; i < 4; i++) { const [x, y] = P(C - 0.5 + i * 0.3, C + 0.5, ZD + 1.08); const bob = Math.sin(t * 2.2 + i * 1.7) * 0.5; c.fillStyle = ["#d9544b", "#3e6fa8", "#e9c24d", "#fff"][i]; c.fillRect(x - 1.4, y - 5 + bob, 2.8, 3.6); c.fillStyle = "#e6b48c"; c.beginPath(); c.arc(x, y - 6.4 + bob, 1.3, 0, 6.3); c.fill(); }
  }

  function topDeck(k) {
    const s = 0.34;
    mbox(k, stdProj, C - 0.22, C - 0.22, ZT - 0.14, 0.44, 0.44, 0.16, GREY, { wobble: 0 });
    const b = mbox(k, stdProj, C - s, C - s, ZT, 2 * s, 2 * s, 0.5, "#c8d6dc", { wobble: 0, left: "#d3e0e6", right: "#98acb6" });
    mwin(k, b, "L", { rows: 1, cols: 5, z0: 0.08, z1: 0.42, color: "#8fc0d8", lit: 0.3, litCol: "#fff0b0", gap: 0.14, mx: 0.03, lw: 0.6, seed: 2 });
    mwin(k, b, "R", { rows: 1, cols: 5, z0: 0.08, z1: 0.42, color: "#6fa2bc", lit: 0.3, litCol: "#f6e0a0", gap: 0.14, mx: 0.03, lw: 0.6, seed: 4 });
    mbox(k, stdProj, C - s - 0.06, C - s - 0.06, ZT + 0.5, 2 * s + 0.12, 2 * s + 0.12, 0.07, "#98a0a4", { wobble: 0 });
  }

  function antenna(k, t) {
    const c = k.ctx, zb = ZT + 0.6;
    // lattice mast section, then striped pole, with two dish pairs
    for (let i = 0; i < 6; i++) {
      const za = zb + i * 0.22, zc = za + 0.22, w = 0.1 - i * 0.008, wa = 0.1 - (i + 1) * 0.008;
      const l0 = P(C - w, C, za), r0 = P(C + w, C, za), l1 = P(C - wa, C, zc), r1 = P(C + wa, C, zc);
      c.beginPath(); c.moveTo(...l0); c.lineTo(...r1); c.moveTo(...r0); c.lineTo(...l1); c.moveTo(...l1); c.lineTo(...r1);
      c.strokeStyle = i % 2 ? WHITE : RED; c.lineWidth = 1.3; c.stroke();
    }
    for (const x of [-1, 1]) stroke(c, [P(C + x * 0.1, C, zb), P(C + x * 0.06, C, zb + 1.3)], 1.4, i2(x));
    function i2(x) { return x < 0 ? WHITE : RED; }
    const top = ZT + 3.1, n = 10;
    const base = P(C, C, zb + 1.3), tip = P(C, C, top);
    for (let i = 0; i < n; i++) { const f0 = i / n, f1 = (i + 1) / n; const a = [lerp(base[0], tip[0], f0), lerp(base[1], tip[1], f0)], b = [lerp(base[0], tip[0], f1), lerp(base[1], tip[1], f1)]; c.lineCap = "butt"; c.strokeStyle = INK; c.lineWidth = 4.4 - f0 * 2.2; c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); c.strokeStyle = i % 2 ? WHITE : RED; c.lineWidth = 3 - f0 * 1.7; c.stroke(); }
    for (const [z, d] of [[ZT + 1.3, 1], [ZT + 1.6, -1], [ZT + 1.9, 1]]) { const [x, y] = P(C, C, z); c.fillStyle = "#ecebe6"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.ellipse(x + d * 6, y, 3, 4.4, 0, 0, 6.3); c.fill(); c.stroke(); }
    const on = Math.sin(t * 3.2) > 0, [bx, by] = tip;
    if (on) { const g = c.createRadialGradient(bx, by, 0, bx, by, 24); g.addColorStop(0, "rgba(255,70,50,0.8)"); g.addColorStop(1, "rgba(255,70,50,0)"); c.fillStyle = g; c.beginPath(); c.arc(bx, by, 24, 0, 6.3); c.fill(); }
    c.fillStyle = on ? "#ff3b2a" : "#8a2a22"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.arc(bx, by, 2.8, 0, 6.3); c.fill(); c.stroke();
  }

  // foot pads
  const pad = (k, u, v) => mbox(k, stdProj, u - 0.35, v - 0.35, 0, 0.7, 0.7, 0.16, "#cfc7b4", { wobble: 0 });
  const h0 = H(0);
  return {
    H, F,
    shadow(k) { k.poly([[C + 0.6, C + 0.6, 0], [C + 6.2, C + 3.0, 0], [C + 6.4, C + 3.5, 0], [C + 0.8, C + 0.9, 0]], "rgba(60,45,30,0.12)", { stroke: false }); },
    drawBack(k, t) {
      pad(k, C - h0, C - h0); pad(k, C + h0, C - h0); pad(k, C - h0, C + h0);
      for (const f of ["A", "B"]) { infill(k, f); leg(k, f, -1); leg(k, f, 1); }
    },
    draw(k, t) {
      pad(k, C + h0, C + h0);
      for (const f of ["L", "R"]) { infill(k, f); leg(k, f, -1); leg(k, f, 1); }
      deck(k, t);
      for (const f of ["A", "B", "L", "R"]) upperFace(k, f);
      topDeck(k);
      antenna(k, t);
    },
  };
}
