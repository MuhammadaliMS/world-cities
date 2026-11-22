// The City skyline on the grid: the Shard, the Gherkin and the Walkie-Talkie as solids (everything through P(u,v,z)),
// plus a swinging tower crane. Used only by vtiles/london/-1_1.js.
import { P, CTS, INK, shade, mix, lerp, clamp, hash } from "../../lib/vec-kit.js";

const interp = (tab, f) => { for (let i = 0; i < tab.length - 1; i++) if (f <= tab[i + 1][0]) { const g = (f - tab[i][0]) / (tab[i + 1][0] - tab[i][0]); return lerp(tab[i][1], tab[i + 1][1], g * g * (3 - 2 * g)); } return tab[tab.length - 1][1]; };
const fillQ = (c, pts, fill, stroke, lw) => {
  c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw ?? 1; c.lineJoin = "round"; c.stroke(); }
};
export function glint(c, x, y, s, a) {
  if (a <= 0.02) return;
  c.save(); c.globalAlpha = a; c.strokeStyle = "#ffffff"; c.fillStyle = "#ffffff"; c.lineWidth = 1.4; c.lineCap = "round";
  c.beginPath(); c.moveTo(x - s, y); c.lineTo(x + s, y); c.moveTo(x, y - s * 1.3); c.lineTo(x, y + s * 1.3); c.stroke();
  c.beginPath(); c.arc(x, y, s * 0.35, 0, 7); c.fill(); c.restore();
}

// ---------------- The Shard: square-based glass pyramid with a splintered top ----------------
export function makeShard(cu, cv, z0, half, H) {
  const N = 34, FP = 0.86, ZP = H * FP;
  const s = (zr) => half * (1 - 0.93 * zr / H);
  const Lp = (a, zr) => P(cu - s(zr) + 2 * s(zr) * a, cv + s(zr), z0 + zr);   // left face (v + dv), a along u
  const Rp = (a, zr) => P(cu + s(zr), cv - s(zr) + 2 * s(zr) * a, z0 + zr);   // right face (u + du), a along v
  const SKY_LO = "#dcedf5", SKY_HI = "#6f9cc0";
  return {
    top: () => [cu, cv, z0 + H],
    draw(k, t) {
      const c = k.ctx, zT = z0 + ZP, sT = s(ZP);
      // back splinters (behind the body, darker)
      const back = [[-1, -1, 0.0, 0.5, 1.0], [-1, -1, 0.5, 1.0, 0.95], [1, -1, 0.0, 0.5, 0.92], [-1, 1, 0.5, 1.0, 0.99]];
      for (const [su, sv, a0, a1, hh] of back) {
        const zb = ZP - 0.5, sb = s(zb);
        const p0 = su < 0 && sv < 0 ? [cu - sb, cv - sb + 2 * sb * a0] : sv < 0 ? [cu - sb + 2 * sb * a0, cv - sb] : [cu - sb, cv - sb + 2 * sb * a0];
        const p1 = su < 0 && sv < 0 ? [cu - sb, cv - sb + 2 * sb * a1] : sv < 0 ? [cu - sb + 2 * sb * a1, cv - sb] : [cu - sb, cv - sb + 2 * sb * a1];
        fillQ(c, [P(p0[0], p0[1], z0 + zb), P(p1[0], p1[1], z0 + zb), P(cu - 0.02, cv - 0.02, z0 + H * hh)], "#7b9fbd", INK, 1.2);
      }
      // body: per-facet sky shading in three columns, warm window strips, floor lines
      const nb = Math.round(N);
      for (const face of ["L", "R"]) {
        const F = face === "L" ? Lp : Rp;
        for (let b = 0; b < nb; b++) {
          const za = ZP * b / nb, zb = ZP * (b + 1) / nb, fa = za / H;
          for (let j = 0; j < 3; j++) {
            const a0 = j / 3, a1 = (j + 1) / 3;
            let col = mix(SKY_LO, SKY_HI, Math.pow(fa / FP, 0.85));
            col = j === 0 ? shade(col, 0.07) : j === 2 ? shade(col, -0.08) : col;
            if (face === "R") col = shade(col, -0.2);
            if (hash(b * 7 + j * 3 + (face === "R" ? 50 : 0)) < 0.14) col = shade(col, 0.16); // cloud reflection
            const q = [F(a0, za), F(a1, za), F(a1, zb), F(a0, zb)];
            fillQ(c, q, col, col, 0.6);
            if (hash(b * 13 + j * 5 + (face === "R" ? 90 : 0) + Math.floor(t * 0.2) * 17) < 0.42 && b > 0) {
              const zm = lerp(za, zb, 0.3), zn = lerp(za, zb, 0.55);
              fillQ(c, [F(a0 + 0.06, zm), F(a1 - 0.06, zm), F(a1 - 0.06, zn), F(a0 + 0.06, zn)], face === "L" ? "rgba(255,226,140,0.88)" : "rgba(255,206,110,0.8)");
            }
          }
          if (b % 2 === 0 && b > 0) { c.strokeStyle = "rgba(255,255,255,0.35)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(...F(0, za)); c.lineTo(...F(1, za)); c.stroke(); }
        }
        // facet seams
        c.strokeStyle = "rgba(34,62,94,0.6)"; c.lineWidth = 1.3;
        for (const a of [1 / 3, 2 / 3]) { c.beginPath(); c.moveTo(...F(a, 0)); c.lineTo(...F(a, ZP)); c.stroke(); }
        fillQ(c, [F(0, 0), F(1, 0), F(1, ZP), F(0, ZP)], null, INK, 1.8);
      }
      // dark open top between the blades
      fillQ(c, [P(cu - sT, cv + sT, zT), P(cu + sT, cv + sT, zT), P(cu + sT, cv - sT, zT), P(cu - sT, cv - sT, zT)], "#2c4766", INK, 1.2);
      // front splinters (overlap the open top, leaning in)
      const blades = [["L", 0.0, 0.5, 0.97, -0.05, 0], ["L", 0.5, 1.0, 0.91, 0.1, 0], ["R", 0.0, 0.5, 1.0, 0, -0.08], ["R", 0.5, 1.0, 0.94, 0, 0.1], ["L", 0.2, 0.8, 0.88, 0, 0]];
      blades.forEach(([face, a0, a1, hh, ox, oy], i) => {
        const zb = ZP - 0.9 - (i % 2) * 0.2, F = face === "L" ? Lp : Rp, am = (a0 + a1) / 2;
        const sb = s(zb), apex = face === "L" ? [cu + (am - 0.5) * 2 * sb * 0.4 + ox, cv + sb * 0.3 + oy] : [cu + sb * 0.3 + ox, cv + (am - 0.5) * 2 * sb * 0.4 + oy];
        const col = face === "L" ? (i % 2 ? "#a9cde2" : "#c4e0ee") : (i % 2 ? "#6f98b8" : "#7fa8c6");
        fillQ(c, [F(a0, zb), F(a1, zb), P(apex[0], apex[1], z0 + H * hh)], col, INK, 1.3);
        c.strokeStyle = "rgba(255,255,255,0.5)"; c.lineWidth = 1; c.beginPath(); c.moveTo(...F(am, zb)); c.lineTo(...P(apex[0], apex[1], z0 + H * hh)); c.stroke();
      });
      // mast + red beacon
      const [mx, my] = P(cu, cv, z0 + H), [, my2] = P(cu, cv, z0 + H + 0.9);
      c.strokeStyle = INK; c.lineWidth = 2.2; c.beginPath(); c.moveTo(mx, my + 3); c.lineTo(mx, my2); c.stroke();
      const pul = 0.55 + 0.45 * Math.sin(t * 3.2);
      c.fillStyle = `rgba(255,70,60,${0.18 + 0.22 * pul})`; c.beginPath(); c.arc(mx, my2, 14, 0, 7); c.fill();
      c.fillStyle = pul > 0.5 ? "#ff4a3a" : "#c8382e"; c.beginPath(); c.arc(mx, my2, 3.4, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
      const [gx, gy] = Lp(0.22, ZP * 0.8);
      glint(c, gx, gy, 6, Math.max(0, Math.sin(t * 1.1)) ** 6);
      const [hx, hy] = Rp(0.7, ZP * 0.45);
      glint(c, hx, hy, 5, Math.max(0, Math.sin(t * 0.9 + 2)) ** 6);
    },
  };
}

// ---------------- 30 St Mary Axe (the Gherkin): stack of circular floor plates ----------------
export function makeGherkin(cu, cv, z0, H, rmax) {
  const prof = [[0, 0.58], [0.08, 0.7], [0.28, 0.91], [0.55, 1], [0.72, 0.96], [0.86, 0.76], [0.94, 0.5], [0.98, 0.28], [1, 0]];
  const r = (f) => rmax * interp(prof, clamp(f));
  const X = CTS.S * Math.SQRT2, TW = 4.6;
  const S = (f, th, rr) => P(cu + (rr ?? r(f)) * Math.cos(th), cv + (rr ?? r(f)) * Math.sin(th), z0 + f * H);
  const vis = (th) => Math.cos(th) + Math.sin(th) > 0.06;
  return {
    draw(k, t) {
      const c = k.ctx, N = 64;
      // lobby drum
      k.cyl(cu, cv, z0, r(0) * 1.25, 0.2, "#d4dde0");
      const [bx] = P(cu, cv, z0), rxM = rmax * X;
      const g = c.createLinearGradient(bx - rxM, 0, bx + rxM, 0);
      g.addColorStop(0, "#ddd7ad"); g.addColorStop(0.3, "#b9c9c4"); g.addColorStop(0.65, "#86a6b9"); g.addColorStop(1, "#46698a");
      for (let i = 0; i < N; i++) {
        const f0 = i / N, f1 = (i + 1) / N;
        const [x0, y0] = P(cu, cv, z0 + f0 * H), [x1, y1] = P(cu, cv, z0 + f1 * H);
        const rx0 = r(f0) * X, rx1 = r(f1) * X;
        c.beginPath(); c.moveTo(x0 - rx0, y0); c.ellipse(x0, y0, rx0, rx0 * CTS.YS, 0, Math.PI, 0, true);
        c.lineTo(x1 + rx1, y1); c.ellipse(x1, y1, rx1, rx1 * CTS.YS, 0, 0, Math.PI, false); c.closePath();
        c.fillStyle = g; c.fill();
        if (f0 > 0.84) { c.fillStyle = "rgba(34,52,82,0.3)"; c.fill(); }
        if (i % 2 === 0) { c.strokeStyle = "rgba(30,55,85,0.4)"; c.lineWidth = 1; c.beginPath(); c.ellipse(x0, y0, rx0, rx0 * CTS.YS, 0, 0, Math.PI, false); c.stroke(); }
      }
      // warm lit floors behind the glass
      for (let rr = 0; rr < 32; rr++) for (let q = 0; q < 20; q++) {
        const f = 0.07 + rr * 0.028, th = q * (Math.PI * 2 / 20) + (rr % 2) * 0.16;
        if (!vis(th) || f > 0.93) continue;
        if (hash(rr * 31 + q * 7 + Math.floor(t * 0.15) * 3) < 0.5) {
          const [x, y] = S(f, th), cs = (Math.cos(th) + Math.sin(th)) / 1.414;
          c.fillStyle = `rgba(255,222,120,${0.3 + 0.4 * cs})`; c.beginPath(); c.ellipse(x, y, 4 * cs + 1, 3, 0, 0, 7); c.fill();
        }
      }
      // diagrid: two spiral families
      c.strokeStyle = "rgba(252,249,232,0.8)"; c.lineWidth = 1.2; c.lineCap = "round";
      for (const dir of [1, -1]) for (let j = 0; j < 16; j++) {
        let open = false; c.beginPath();
        for (let f = 0.03; f <= 0.985; f += 0.012) {
          const th = j * (Math.PI * 2 / 16) + dir * f * 7;
          if (vis(th)) { const [x, y] = S(f, th); open ? c.lineTo(x, y) : (c.moveTo(x, y), open = true); } else open = false;
        }
        c.stroke();
      }
      // dark spiral shading bands
      c.fillStyle = "rgba(36,64,98,0.86)";
      for (let i = 0; i < 6; i++) {
        const ph = i * (Math.PI * 2 / 6);
        let Lp2 = [], Rp2 = [];
        const flush = () => { if (Lp2.length > 1) { c.beginPath(); [...Lp2, ...Rp2.slice().reverse()].forEach((p, kk) => (kk ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.fill(); } Lp2 = []; Rp2 = []; };
        for (let f = 0.02; f <= 0.975; f += 0.012) {
          const th = ph + f * TW;
          if (vis(th)) { Lp2.push(S(f, th - 0.17)); Rp2.push(S(f, th + 0.17)); } else flush();
        }
        flush();
      }
      // silhouette
      c.strokeStyle = INK; c.lineWidth = 1.8; c.lineJoin = "round";
      c.beginPath();
      for (let i = 0; i <= N; i++) { const f = i / N, [x, y] = P(cu, cv, z0 + f * H); i ? c.lineTo(x - r(f) * X, y) : c.moveTo(x - r(f) * X, y); }
      c.stroke(); c.beginPath();
      for (let i = 0; i <= N; i++) { const f = i / N, [x, y] = P(cu, cv, z0 + f * H); i ? c.lineTo(x + r(f) * X, y) : c.moveTo(x + r(f) * X, y); }
      c.stroke(); c.beginPath(); c.ellipse(bx, P(cu, cv, z0)[1], r(0) * X, r(0) * X * CTS.YS, 0, 0, Math.PI, false); c.stroke();
      const [tx, ty] = P(cu, cv, z0 + H);
      c.fillStyle = "rgba(255,255,255,0.7)"; c.beginPath(); c.ellipse(tx - 2, ty + 8, 5, 2.4, -0.4, 0, 7); c.fill();
      glint(c, bx - rxM * 0.4, P(cu, cv, z0 + H * 0.55)[1], 6, Math.max(0, Math.sin(t * 1.0 + 1)) ** 6);
    },
  };
}

// ---------------- 20 Fenchurch Street (the Walkie-Talkie): box that widens with height ----------------
export function makeWalkie(u0, v0, du, dv, z0, H, bulge) {
  const e = (zr) => bulge * Math.pow(zr / H, 1.6);
  const Lp = (a, zr) => P(u0 - e(zr) + a * (du + 2 * e(zr)), v0 + dv + e(zr), z0 + zr);
  const Rp = (a, zr) => P(u0 + du + e(zr), v0 - e(zr) + a * (dv + 2 * e(zr)), z0 + zr);
  const nL = 12, nR = 12, N = 22, ZG = H * 0.9;
  return {
    draw(k, t) {
      const c = k.ctx;
      for (const face of ["L", "R"]) {
        const F = face === "L" ? Lp : Rp, nc = face === "L" ? nL : nR;
        for (let b = 0; b < N; b++) {
          const za = ZG * b / N, zb = ZG * (b + 1) / N, f = za / H;
          for (let j = 0; j < nc; j++) {
            let col = mix("#b2d0de", "#527f9c", Math.pow(f, 0.9));
            if (face === "R") col = shade(col, -0.2);
            if ((j + b) % 5 === 0) col = shade(col, 0.07);
            fillQ(c, [F(j / nc, za), F((j + 1) / nc, za), F((j + 1) / nc, zb), F(j / nc, zb)], col, col, 0.5);
            if (hash(b * 17 + j * 3 + (face === "R" ? 70 : 0) + Math.floor(t * 0.2) * 5) < 0.3) {
              const zm = lerp(za, zb, 0.25), zn = lerp(za, zb, 0.6);
              fillQ(c, [F((j + 0.15) / nc, zm), F((j + 0.85) / nc, zm), F((j + 0.85) / nc, zn), F((j + 0.15) / nc, zn)], face === "L" ? "rgba(255,226,140,0.85)" : "rgba(255,204,106,0.78)");
            }
          }
          c.strokeStyle = "rgba(24,44,64,0.45)"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(...F(0, za)); c.lineTo(...F(1, za)); c.stroke();
        }
        // vertical ribs
        c.strokeStyle = face === "L" ? "rgba(236,246,250,0.9)" : "rgba(205,224,234,0.8)"; c.lineWidth = 1.7;
        for (let j = 0; j <= nc; j++) { c.beginPath(); c.moveTo(...F(j / nc, 0)); c.lineTo(...F(j / nc, ZG)); c.stroke(); }
        fillQ(c, [F(0, 0), F(1, 0), F(1, ZG), F(0, ZG)], null, INK, 1.8);
      }
      // top three floors: wider dark band + flat roof
      const zt = ZG, eT = e(zt);
      for (const face of ["L", "R"]) {
        const F = face === "L" ? Lp : Rp, nc = face === "L" ? nL : nR;
        fillQ(c, [F(0, ZG), F(1, ZG), F(1, H), F(0, H)], face === "L" ? "#7fa3bb" : "#5d8099", INK, 1.5);
        c.strokeStyle = "rgba(235,245,250,0.8)"; c.lineWidth = 1.5;
        for (let j = 0; j <= nc; j++) { c.beginPath(); c.moveTo(...F(j / nc, ZG)); c.lineTo(...F(j / nc, H)); c.stroke(); }
        c.fillStyle = face === "L" ? "rgba(255,226,140,0.85)" : "rgba(255,206,110,0.8)";
        for (let j = 0; j < nc; j++) if (hash(j * 9 + (face === "R" ? 11 : 0)) < 0.5) fillQ(c, [F((j + 0.15) / nc, ZG + 0.12), F((j + 0.85) / nc, ZG + 0.12), F((j + 0.85) / nc, ZG + 0.3), F((j + 0.15) / nc, ZG + 0.3)], c.fillStyle);
      }
      const eH = e(H), ru0 = u0 - eH, rv0 = v0 - eH, ru1 = u0 + du + eH, rv1 = v0 + dv + eH, zr = z0 + H;
      fillQ(c, [P(ru0, rv0, zr), P(ru1, rv0, zr), P(ru1, rv1, zr), P(ru0, rv1, zr)], "#c9d6dd", INK, 1.5);
      // sky garden: glazed box on the roof with green inside
      const gu0 = ru0 + 0.28, gu1 = ru1 - 0.28, gv0 = rv0 + 0.28, gv1 = rv1 - 0.28, gh = 0.85;
      for (let i = 0; i < 11; i++) { const [x, y] = P(lerp(gu0 + 0.2, gu1 - 0.2, hash(i * 3 + 1)), lerp(gv0 + 0.2, gv1 - 0.2, hash(i * 3 + 2)), zr + 0.1); c.fillStyle = i % 2 ? "#6a9a4c" : "#86b25a"; c.beginPath(); c.arc(x, y - 6 - (i % 3) * 3, 5 + (i % 3), 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke(); }
      fillQ(c, [P(gu0, gv1, zr), P(gu1, gv1, zr), P(gu1, gv1, zr + gh), P(gu0, gv1, zr + gh)], "rgba(190,226,240,0.45)", INK, 1.3);
      fillQ(c, [P(gu1, gv0, zr), P(gu1, gv1, zr), P(gu1, gv1, zr + gh), P(gu1, gv0, zr + gh)], "rgba(150,196,218,0.55)", INK, 1.3);
      c.strokeStyle = "#4e5a60"; c.lineWidth = 1.4;
      for (let i = 0; i <= 7; i++) { const a = lerp(gu0, gu1, i / 7); c.beginPath(); c.moveTo(...P(a, gv1, zr)); c.lineTo(...P(a, gv1, zr + gh)); c.stroke(); }
      for (let i = 0; i <= 5; i++) { const a = lerp(gv0, gv1, i / 5); c.beginPath(); c.moveTo(...P(gu1, a, zr)); c.lineTo(...P(gu1, a, zr + gh)); c.stroke(); }
      fillQ(c, [P(gu0, gv0, zr + gh), P(gu1, gv0, zr + gh), P(gu1, gv1, zr + gh), P(gu0, gv1, zr + gh)], "rgba(206,234,246,0.85)", INK, 1.4);
      c.strokeStyle = "rgba(70,90,100,0.7)"; c.lineWidth = 1; c.beginPath();
      for (let i = 1; i < 5; i++) { const a = lerp(gu0, gu1, i / 5); c.moveTo(...P(a, gv0, zr + gh)); c.lineTo(...P(a, gv1, zr + gh)); }
      c.stroke();
      glint(c, ...P(lerp(gu0, gu1, 0.3 + 0.4 * ((t * 0.2) % 1)), (gv0 + gv1) / 2, zr + gh), 5, Math.max(0, Math.sin(t * 1.3)) ** 4);
    },
  };
}

// ---------------- tower crane on a roof: jib swings slowly in plan ----------------
export function drawCrane(k, t, u, v, z0, h, ph = 0, o = {}) {
  const c = k.ctx, L = o.jib ?? 1.2, CW = o.cw ?? 0.45, col = o.col || "#f2b52c", dk = "#9a6a12";
  const hw = 0.07, zT = z0 + h;
  const line = (a, b, w, cc) => { c.strokeStyle = cc; c.lineWidth = w; c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); };
  // mast: four posts + zigzag bracing on the two visible faces
  for (const [du, dv] of [[-hw, hw], [hw, hw], [hw, -hw]]) line(P(u + du, v + dv, z0), P(u + du, v + dv, zT), 2.4, INK);
  c.lineCap = "round";
  for (const [du, dv] of [[-hw, hw], [hw, hw], [hw, -hw]]) line(P(u + du, v + dv, z0), P(u + du, v + dv, zT), 1.2, col);
  const nz = Math.round(h / 0.32);
  for (let i = 0; i < nz; i++) {
    const za = z0 + (h * i) / nz, zb = z0 + (h * (i + 1)) / nz, fl = i % 2 === 0;
    line(P(u - hw, v + hw, fl ? za : zb), P(u + hw, v + hw, fl ? zb : za), 1, dk);
    line(P(u + hw, v + hw, fl ? za : zb), P(u + hw, v - hw, fl ? zb : za), 1, dk);
  }
  const phi = 0.55 + 0.7 * Math.sin(t * 0.21 + ph), d = [Math.cos(phi), Math.sin(phi)], n = [-d[1], d[0]];
  const at = (s, off, z) => P(u + d[0] * s + n[0] * off, v + d[1] * s + n[1] * off, z);
  // counter-jib + counterweight
  line(at(-CW, 0.05, zT + 0.08), at(0, 0.05, zT + 0.08), 3.2, INK); line(at(-CW, -0.05, zT + 0.08), at(0, -0.05, zT + 0.08), 3.2, INK);
  line(at(-CW, 0.05, zT + 0.08), at(0, 0.05, zT + 0.08), 1.6, col); line(at(-CW, -0.05, zT + 0.08), at(0, -0.05, zT + 0.08), 1.6, col);
  const cwb = [at(-CW, 0.1, zT - 0.12), at(-CW + 0.2, 0.1, zT - 0.12), at(-CW + 0.2, -0.1, zT - 0.12), at(-CW, -0.1, zT - 0.12)];
  fillQ(c, cwb.map((p, i) => [p[0], p[1] + (i < 4 ? -4 : 0)]), "#7a7f82", INK, 1.1);
  // jib: two chords + zigzag
  const zj = zT + 0.08;
  line(at(0, 0.05, zj), at(L, 0.01, zj), 3.2, INK); line(at(0, -0.05, zj), at(L, -0.01, zj), 3.2, INK);
  line(at(0, 0.05, zj), at(L, 0.01, zj), 1.6, col); line(at(0, -0.05, zj), at(L, -0.01, zj), 1.6, col);
  const nj = 8;
  for (let i = 0; i < nj; i++) { const a = (L * i) / nj, b = (L * (i + 1)) / nj; line(at(a, i % 2 ? 0.05 : -0.05, zj), at(b, i % 2 ? -0.03 : 0.03, zj), 0.9, dk); }
  // cab, apex and stays
  const apex = P(u, v, zT + 0.62);
  line(apex, at(L * 0.85, 0, zj), 0.9, "#555"); line(apex, at(-CW, 0, zj), 0.9, "#555");
  line(P(u, v, zT), apex, 2.2, INK); line(P(u, v, zT), apex, 1.1, col);
  k.box(u - 0.09, v - 0.09, zT - 0.22, 0.18, 0.18, 0.2, "#e8e2d2", { hatch: false, shadow: false });
  // trolley, hook line and a swinging load
  const s = L * (0.6 + 0.22 * Math.sin(t * 0.33 + ph * 1.7)), sw = Math.sin(t * 1.3 + ph) * 0.05, hl = 0.55 + 0.25 * Math.sin(t * 0.4 + ph);
  const tp = at(s, 0, zj), hk = at(s + sw, 0, zj - hl);
  line(tp, hk, 1, INK);
  const lb = [at(s + sw - 0.09, 0.0, zj - hl), at(s + sw + 0.09, 0, zj - hl), at(s + sw + 0.09, 0, zj - hl - 0.16), at(s + sw - 0.09, 0, zj - hl - 0.16)];
  fillQ(c, lb, o.load || "#c8452e", INK, 1);
  fillQ(c, [[tp[0] - 3, tp[1] - 2], [tp[0] + 3, tp[1] - 2], [tp[0] + 3, tp[1] + 2], [tp[0] - 3, tp[1] + 2]], "#333", INK, 0.8);
  const bl = Math.sin(t * 2.4 + ph) > 0.2;
  c.fillStyle = bl ? "#ff4a3a" : "#7a2a24"; c.beginPath(); c.arc(apex[0], apex[1] - 2, 2.2, 0, 7); c.fill();
}
