// The Dubai Frame rebuilt as true grid solids (grid pass): two vertical square gold towers standing on the
// u axis, a sky-bridge box across the top (glass strip, visitors inside, gold caps) and a low gallery block
// at the base. Corner-on view: the broad facade (opening) is the LEFT face, towers' inner/outer sides the RIGHT
// faces. Gold strapwork is drawn on those faces through P(). Everything is a pure function of t.
import { P, INK, shade, lerp, clamp, smooth, rng, drawHuman } from "../../lib/vec-kit.js";

const GOLD = "#e9b949", GOLD_L = "#f6d36e", GOLD_D = "#b9852c", STRAP_D = "#4a3010";

export function makeFrame(cfg = {}) {
  const U1 = cfg.U1 ?? 2.6, U2 = cfg.U2 ?? 7.4, TW = cfg.TW ?? 1.1, V0 = cfg.V0 ?? 3.4, V1 = V0 + (cfg.TD ?? 1.1);
  const H = cfg.H ?? 10, ZB = cfg.ZB ?? 8.25, ZG = cfg.ZG ?? 9.6, PL = 0.32, GH = 1.25, GV1 = V1 + 0.15;
  const LU0 = U1 + TW, LU1 = U2, UE = U2 + TW; // bridge/gallery run LU0..LU1, whole frame U1..UE
  const FL = (u0, v) => (a, z) => P(u0 + a, v, z);     // face on the LEFT (v = const), a runs along u
  const FR = (u, v0) => (a, z) => P(u, v0 + a, z);     // face on the RIGHT (u = const), a runs along v

  const tr = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };

  function panel(k, F, wa, hb, o = {}) {
    const c = k.ctx, e = o.edge ?? 0.075;
    const outer = [F(0, 0), F(wa, 0), F(wa, hb), F(0, hb)];
    const inner = [F(e, e), F(wa - e, e), F(wa - e, hb - e), F(e, hb - e)];
    tr(c, outer); c.fillStyle = o.rim || GOLD; c.fill();
    // recess
    tr(c, inner);
    const gr = c.createLinearGradient(...F(0, hb), ...F(wa, 0));
    gr.addColorStop(0, shade(o.bg || "#98722e", 0.12)); gr.addColorStop(1, shade(o.bg || "#98722e", -0.1));
    c.fillStyle = gr; c.fill();
    c.save(); tr(c, inner); c.clip();
    lattice(k, F, e, e, wa - 2 * e, hb - 2 * e, o);
    c.restore();
    if (k.night) k.lit(() => { tr(c, inner); c.fillStyle = "rgba(255,190,72,0.5)"; c.fill(); tr(c, outer); c.fillStyle = "rgba(255,214,110,0.55)"; c.fill("evenodd"); });
    c.lineJoin = "round";
    tr(c, inner); c.strokeStyle = "rgba(60,38,12,0.55)"; c.lineWidth = 0.9; c.stroke();
    // rim highlight on the upper/left edges
    c.strokeStyle = "rgba(255,240,180,0.7)"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(...F(0.02, 0.02)); c.lineTo(...F(0.02, hb - 0.02)); c.lineTo(...F(wa - 0.02, hb - 0.02)); c.stroke();
    tr(c, outer); c.strokeStyle = INK; c.lineWidth = o.lw ?? 1.5; c.stroke();
  }

  // interlaced 8-point stars: one rosette per cell, tips run on to the neighbours, little diamonds at the corners
  function lattice(k, F, a0, b0, wa, hb, o) {
    const c = k.ctx;
    const na = Math.max(1, Math.round(wa / (o.cell ?? 1))), cw = wa / na;
    const ch = cw * (o.aspect ?? 1.25), nb = Math.ceil(hb / ch) + 1;
    const boff = o.boff ?? (hb - Math.floor(hb / ch) * ch) / 2; // centre the rows
    const meds = [];
    const at = (ca, cb, x, y) => F(a0 + (ca + 0.5 + x) * cw, b0 + boff + (cb + 0.5 + y) * ch - ch * 0.5);
    c.lineJoin = "round"; c.lineCap = "round";
    const sw = o.strap ?? 1.6, mr = o.med ?? 3.2;
    // draw one cell's strapwork right after projecting it (keeps every stroke next to its P() anchors)
    const flush = (lines) => {
      const stroke = (w, col) => { c.beginPath(); for (const ln of lines) { c.moveTo(...ln[0]); for (let i = 1; i < ln.length; i++) c.lineTo(...ln[i]); } c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
      stroke(sw + 1.5, o.strapD || STRAP_D); stroke(sw, o.strapCol || "#e3ae45"); stroke(sw * 0.35, "rgba(255,244,190,0.75)");
    };
    for (let i = 0; i < na; i++) for (let j = -1; j < nb; j++) {
      const p = (x, y) => at(i, j, x, y), lines = [];
      const star = [];
      for (let q = 0; q < 16; q++) { const r = q % 2 ? 0.205 : 0.41, th = (q / 16) * Math.PI * 2 + Math.PI / 8; star.push(p(Math.cos(th) * r, Math.sin(th) * r)); }
      lines.push([...star, star[0]]);
      const oct = []; for (let q = 0; q <= 8; q++) { const th = (q / 8) * Math.PI * 2; oct.push(p(Math.cos(th) * 0.12, Math.sin(th) * 0.12)); }
      lines.push(oct);
      for (let q = 0; q < 8; q++) {
        const th = (q / 8) * Math.PI * 2 + Math.PI / 8, x0 = Math.cos(th) * 0.41, y0 = Math.sin(th) * 0.41;
        const ex = Math.max(-0.5, Math.min(0.5, Math.cos(th) * 0.75)), ey = Math.max(-0.5, Math.min(0.5, Math.sin(th) * 0.75));
        lines.push([p(x0, y0), p(ex, ey)]);
      }
      for (let q = 0; q < 4; q++) {
        const th = (q / 4) * Math.PI * 2, a = q * Math.PI / 2 + Math.PI / 8, b = a - Math.PI / 4;
        lines.push([p(Math.cos(a) * 0.41, Math.sin(a) * 0.41), p(Math.cos(th) * 0.5, Math.sin(th) * 0.5), p(Math.cos(b) * 0.41, Math.sin(b) * 0.41)]);
      }
      flush(lines);
      meds.push(p(0, 0));
    }
    for (let i = 0; i <= na; i++) for (let j = -1; j <= nb; j++) { const x = i - 0.5, y = j - 0.5; const q = (dx, dy) => at(0, 0, x + dx, y + dy * 0.8); flush([[q(-0.13, 0), q(0, -0.13), q(0.13, 0), q(0, 0.13), q(-0.13, 0)]]); }
    for (const [x, y] of meds) {
      const gg = c.createRadialGradient(x, y, 0, x, y, mr * 2.2); gg.addColorStop(0, "rgba(255,226,140,0.85)"); gg.addColorStop(1, "rgba(255,200,90,0)");
      c.fillStyle = gg; c.beginPath(); c.arc(x, y, mr * 2.2, 0, 6.3); c.fill();
      c.fillStyle = GOLD_L; c.beginPath(); c.arc(x, y, mr * 0.6, 0, 6.3); c.fill(); c.strokeStyle = STRAP_D; c.lineWidth = 0.7; c.stroke();
    }
  }

  // ---------- lifts: a glazed slot with a lit cabin riding it ----------
  function lift(k, F, a0, a1, z0, z1, t, ph) {
    const c = k.ctx;
    tr(c, [F(a0, z0), F(a1, z0), F(a1, z1), F(a0, z1)]);
    const gr = c.createLinearGradient(...F(a0, z1), ...F(a1, z0)); gr.addColorStop(0, "#8fb3b5"); gr.addColorStop(0.5, "#587f86"); gr.addColorStop(1, "#3b5d66");
    c.fillStyle = gr; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
    // floor lines + cables
    c.strokeStyle = "rgba(220,240,250,0.35)"; c.lineWidth = 0.7; c.beginPath();
    for (let z = z0 + 0.6; z < z1; z += 0.6) { c.moveTo(...F(a0, z)); c.lineTo(...F(a1, z)); }
    c.stroke();
    c.strokeStyle = "rgba(30,40,45,0.6)"; c.lineWidth = 0.8; c.beginPath(); const am = (a0 + a1) / 2; c.moveTo(...F(am - 0.05, z0)); c.lineTo(...F(am - 0.05, z1)); c.moveTo(...F(am + 0.05, z0)); c.lineTo(...F(am + 0.05, z1)); c.stroke();
    // cabin: rises, pauses at the deck, comes down, pauses at the bottom (period 16 s)
    const per = 16, x = ((t + ph) % per + per) % per;
    let f;
    if (x < 6) f = smooth(x / 6); else if (x < 8) f = 1; else if (x < 14) f = 1 - smooth((x - 8) / 6); else f = 0;
    const ch = 0.62, cz = lerp(z0 + 0.05, z1 - ch - 0.05, f);
    const cab = [F(a0 + 0.02, cz), F(a1 - 0.02, cz), F(a1 - 0.02, cz + ch), F(a0 + 0.02, cz + ch)];
    tr(c, cab); c.fillStyle = "#ffe7a6"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke();
    // riders silhouettes
    for (let i = 0; i < 2; i++) { const [px, py] = F(a0 + (a1 - a0) * (0.33 + i * 0.34), cz + 0.08); c.fillStyle = ["#3e6fa8", "#d9544b"][i]; c.fillRect(px - 1.6, py - 9, 3.2, 7); c.fillStyle = "#c68a62"; c.beginPath(); c.arc(px, py - 10.5, 1.7, 0, 6.3); c.fill(); }
    c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(...F(a0 + 0.04, cz + ch * 0.9)); c.lineTo(...F(a1 - 0.04, cz + ch * 0.9)); c.stroke();
  }


  const gradQuad = (c, q, a, b) => { tr(c, q); const gg = c.createLinearGradient(...q[0], ...q[3]); gg.addColorStop(0, a); gg.addColorStop(1, b); c.fillStyle = gg; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke(); };
  const solid = (k, u, v, z, du, dv, dz, col) => k.box(u, v, z, du, dv, dz, col, { shadow: false, hatch: false });

  // ---------- one tower: plinth, gold shaft with strapwork on its left + right face, lifts, gold roof ----------
  function tower(k, t, u0, which) {
    const c = k.ctx, TD = V1 - V0, uR = u0 + TW;
    solid(k, u0 - 0.12, V0 - 0.12, 0, TW + 0.24, TD + 0.24, PL, "#d6aa52");
    solid(k, u0, V0, PL, TW, TD, H - PL, GOLD);
    // left face (the broad facade)
    const fl = FL(u0, V1);
    panel(k, (a, b) => fl(a, PL + b), TW, H - PL, { cell: 0.55, aspect: 1.15, strap: 1.2, med: 2.4, bg: "#94702c", strapCol: "#e3ae45", boff: 0.18 });
    // right face (inner side of the left tower, outer side of the right tower): darker, with a lift slot
    const fr = FR(uR, V0), z1 = which === "L" ? ZB : H;
    panel(k, (a, b) => fr(a, PL + b), TD, z1 - PL, { cell: 0.52, aspect: 1.15, strap: 1.2, med: 2.4, bg: "#7d5b22", strapCol: "#c98f33", rim: "#c79a3f", boff: which === "L" ? 0.18 : 0.62 });
    lift(k, (a, b) => fr(a, 0.55 + b), TD * 0.38, TD * 0.62, 0, z1 - 0.55 - 0.45, t, which === "L" ? 0 : 7.5);
    // roof: gold deck with strapwork (the left tower's roof is shared with the bridge cap, still drawn here)
    const tp = (a, b) => P(u0 + a, V0 + b, H);
    panel(k, tp, TW, TD, { cell: 0.3, aspect: 1, bg: "#b08a40", strapCol: "#f1c95f", strap: 1.1, med: 1.6, edge: 0.06, rim: GOLD_L });
  }

  // ---------- sky bridge: interior, visitors, glass strip, gold lips, gold roof cap ----------
  const DECK = [];
  { const R = rng(41); for (let i = 0; i < 18; i++) DECK.push({ w: 0.2 + R() * 0.55, sp: 0.2 + R() * 0.16, off: i * 7.7 + R() * 3, seed: 300 + i, stop: R() < 0.35, look: R() }); }
  const DU = [LU0 + 0.2, LU1 - 0.2], GZ0 = ZB + 0.16;

  function bridge(k, t) {
    const c = k.ctx, len = LU1 - LU0, gH = ZG - GZ0, TD = V1 - V0;
    // cap above the glass: gold box, strapwork on its left face and top
    // back wall (inside of the back face) + glass floor
    const bk = FL(LU0, V0 + 0.05);
    tr(c, [bk(0, GZ0), bk(len, GZ0), bk(len, ZG), bk(0, ZG)]);
    const gw = c.createLinearGradient(...bk(0, ZG), ...bk(0, GZ0)); gw.addColorStop(0, "#d6e8ee"); gw.addColorStop(1, "#a9c3cc"); c.fillStyle = gw; c.fill();
    c.strokeStyle = "rgba(60,90,100,0.35)"; c.lineWidth = 0.8; c.beginPath(); for (let s = 0.45; s < len; s += 0.45) { c.moveTo(...bk(s, GZ0)); c.lineTo(...bk(s, ZG)); } c.stroke();
    // far wall sky glimpse: bright band to read as glass
    c.fillStyle = "rgba(255,255,255,0.25)"; for (let s = 0.2; s < len; s += 1.3) { tr(c, [bk(s, GZ0), bk(s + 0.3, GZ0), bk(s + 0.6, ZG), bk(s + 0.3, ZG)]); c.fill(); }
    k.poly([[LU0, V0, ZB + 0.16], [LU1, V0, ZB + 0.16], [LU1, V1, ZB + 0.16], [LU0, V1, ZB + 0.16]], "#c3d3d6", { lw: 1 });
    c.strokeStyle = "rgba(80,110,120,0.4)"; c.lineWidth = 0.7; c.beginPath(); for (let s = 0.5; s < len; s += 0.5) { const [x0, y0] = P(LU0 + s, V0, GZ0), [x1, y1] = P(LU0 + s, V1, GZ0); c.moveTo(x0, y0); c.lineTo(x1, y1); } c.stroke();
    // visitors, back to front
    const ppl = DECK.map((p) => {
      const L = DU[1] - DU[0], per = 2 * L / p.sp + (p.stop ? 6 : 1.5), wt = L / p.sp, dw = (per - 2 * wt) / 2;
      const x = ((t + p.off) % per + per) % per; let s, dir, moving = true, dist;
      if (x < wt) { s = DU[0] + x * p.sp; dir = 1; dist = x * p.sp; } else if (x < wt + dw) { s = DU[1]; dir = -1; moving = false; dist = L; }
      else if (x < 2 * wt + dw) { s = DU[1] - (x - wt - dw) * p.sp; dir = -1; dist = L + (x - wt - dw) * p.sp; } else { s = DU[0]; dir = 1; moving = false; dist = 2 * L; }
      return { ...p, s, dir, moving, dist };
    }).sort((a, b) => a.w - b.w);
    for (const p of ppl) {
      const dd = p.moving ? [p.dir, 0] : (p.look < 0.5 ? [0, 1] : [-p.dir, 0]);
      drawHuman(k, p.s, V1 - 0.62 + p.w * 0.45, { z: GZ0, dir: dd, pose: p.moving ? "walk" : (p.look < 0.25 ? "photo" : "stand"), p: p.dist / 0.25, seed: p.seed, h: 0.6, shadow: false });
    }
    // rail
    k.line3([[LU0, V1 - 0.1, GZ0 + 0.3], [LU1, V1 - 0.1, GZ0 + 0.3]], { stroke: "#8c9aa0", lw: 1.2, wobble: 0 });
    // glass front
    const gl = FL(LU0, V1), poly = [gl(0, GZ0), gl(len, GZ0), gl(len, ZG), gl(0, ZG)];
    tr(c, poly); c.fillStyle = "rgba(150,210,228,0.28)"; c.fill();
    c.save(); tr(c, poly); c.clip();
    c.fillStyle = "rgba(255,255,255,0.16)"; for (let s = 0.3; s < len; s += 1.35) { tr(c, [gl(s, GZ0), gl(s + 0.35, GZ0), gl(s + 0.75, ZG), gl(s + 0.4, ZG)]); c.fill(); }
    const gx = ((t * 0.5) % (len + 3)) - 1.5; tr(c, [gl(gx, GZ0), gl(gx + 0.25, GZ0), gl(gx + 0.6, ZG), gl(gx + 0.35, ZG)]); c.fillStyle = "rgba(255,255,255,0.45)"; c.fill();
    c.restore();
    c.strokeStyle = "rgba(40,60,70,0.85)"; c.lineWidth = 1.1; c.beginPath(); const nm = Math.round(len / 0.42); for (let i = 1; i < nm; i++) { const s = len * i / nm; c.moveTo(...gl(s, GZ0)); c.lineTo(...gl(s, ZG)); } c.stroke();
    tr(c, poly); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
    // gold lip under the glass
    gradQuad(c, [gl(0, ZB), gl(len, ZB), gl(len, GZ0), gl(0, GZ0)], GOLD_D, GOLD_L);
    // roof cap box (left face + top strapwork)
    solid(k, LU0, V0, ZG, len, TD, H - ZG, GOLD);
    const cp = (a, b) => gl(a, ZG + b); panel(k, cp, len, H - ZG, { cell: 0.3, aspect: 1, bg: "#a07a34", strap: 1, med: 1.5, edge: 0.05, boff: 0.04 });
    panel(k, (a, b) => P(LU0 + a, V0 + b, H), len, TD, { cell: 0.3, aspect: 1, bg: "#b08a40", strapCol: "#f1c95f", strap: 1.1, med: 1.6, edge: 0.06, rim: GOLD_L });
  }

  // ---------- gallery block at the foot: glass shopfront, gold fascia with sign, strapwork roof ----------
  function gallery(k, t) {
    const c = k.ctx, len = LU1 - LU0, GT = 1.75, gv = GV1;
    solid(k, LU0, V0, 0, len, gv - V0, GT, GOLD);
    const fr = FL(LU0, gv), glass = [fr(0, 0), fr(len, 0), fr(len, GH), fr(0, GH)];
    tr(c, glass); const gg = c.createLinearGradient(...fr(0, GH), ...fr(0, 0)); gg.addColorStop(0, "#7fb1c2"); gg.addColorStop(1, "#4d7d8f"); c.fillStyle = gg; c.fill();
    c.save(); tr(c, glass); c.clip();
    for (let i = 0; i < 9; i++) { const s = 0.3 + i * (len - 0.6) / 8; tr(c, [fr(s - 0.15, 0.25), fr(s + 0.15, 0.25), fr(s + 0.15, 0.85), fr(s - 0.15, 0.85)]); c.fillStyle = i % 3 === 1 ? "rgba(255,214,140,0.55)" : "rgba(255,240,200,0.28)"; c.fill(); }
    for (let i = 0; i < 6; i++) { const s = ((i * 0.83 + t * (i % 2 ? 0.12 : -0.09)) % len + len) % len; const [x, y] = fr(s, 0.1); c.fillStyle = "rgba(30,50,60,0.45)"; c.fillRect(x - 2, y - 13, 4, 10); c.beginPath(); c.arc(x, y - 15, 2.2, 0, 6.3); c.fill(); }
    c.fillStyle = "rgba(255,255,255,0.18)"; for (let s = 0.2; s < len; s += 1.1) { tr(c, [fr(s, 0), fr(s + 0.25, 0), fr(s + 0.55, GH), fr(s + 0.3, GH)]); c.fill(); }
    c.restore();
    c.strokeStyle = "rgba(35,50,55,0.9)"; c.lineWidth = 1.1; c.beginPath(); const nm = Math.round(len / 0.34); for (let i = 1; i < nm; i++) { const s = len * i / nm; c.moveTo(...fr(s, 0)); c.lineTo(...fr(s, GH)); } c.moveTo(...fr(0, 0.95)); c.lineTo(...fr(len, 0.95)); c.stroke();
    const dm = len * 0.5;
    tr(c, [fr(dm - 0.42, 0), fr(dm + 0.42, 0), fr(dm + 0.42, 1.0), fr(dm - 0.42, 1.0)]); c.fillStyle = "#3d5f6c"; c.fill(); c.strokeStyle = GOLD; c.lineWidth = 2.4; c.stroke(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
    c.beginPath(); c.moveTo(...fr(dm, 0)); c.lineTo(...fr(dm, 1.0)); c.strokeStyle = GOLD_D; c.lineWidth = 1.2; c.stroke();
    tr(c, glass); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
    panel(k, (a, b) => fr(a, GH + b), len, GT - GH, { cell: 0.55, aspect: 1, bg: "#a07a34", strap: 1.2, med: 2, edge: 0.05 });
    const [sx, sy] = fr(len * 0.5, (GT + GH) / 2);
    c.save(); c.translate(sx, sy); c.transform(1, 0.577, 0, 1, 0, 0);
    c.fillStyle = "#2a2018"; c.strokeStyle = GOLD; c.lineWidth = 1.3; c.beginPath(); c.roundRect(-30, -6.5, 60, 13, 2); c.fill(); c.stroke();
    c.fillStyle = GOLD_L; c.font = "bold 7.5px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("DUBAI FRAME", 0, 0.5);
    c.restore();
    // right face of the protrusion sliver gets the same gold
    panel(k, (a, b) => P(LU0 + a, V0 + b, GT), len, gv - V0, { cell: 0.55, aspect: 1, bg: "#bd9848", strapCol: "#efc65e", strap: 1.1, med: 2, edge: 0.06, rim: GOLD_L });
  }

  // ---------- soft shadow of the frame, clipped to the tile (sun upper left) ----------
  function shadow(k) {
    const c = k.ctx, sh = [0.2, 0.06], pr = (u, v, z) => P(u + sh[0] * z, v + sh[1] * z, 0), tp = [[0.3, 0.3], [9.7, 0.3], [9.7, 9.7], [0.3, 9.7]].map(([u, v]) => P(u, v));
    c.save(); k._trace(tp, true, 0); c.clip(); c.fillStyle = "rgba(70,55,35,0.12)";
    const q = (pts) => { tr(c, pts); c.fill(); };
    for (const u0 of [U1, U2]) q([pr(u0 + TW, V0, 0), pr(u0 + TW, V1, 0), pr(u0 + TW, V1, H), pr(u0 + TW, V0, H)]);
    q([pr(LU0, V1, 0), pr(UE, V1, 0), pr(UE, V1, 0.01), pr(LU0, V1, 0.01), pr(LU0, V1, ZB), pr(LU1, V1, ZB), pr(LU1, V1, H), pr(LU0, V1, H)].slice(4));
    q([pr(LU0, V1, GH), pr(LU1, V1, GH), pr(LU1, GV1, 0), pr(LU0, GV1, 0)]);
    c.restore();
  }

  const depth = { tower1: 7.6, mid: 8.4, tower2: 11.8 };
  function parts(k, t) {
    k.q(depth.tower1, () => tower(k, t, U1, "L"));
    k.q(depth.mid, () => { gallery(k, t); bridge(k, t); });
    k.q(depth.tower2, () => tower(k, t, U2, "R"));
  }
  return { parts, shadow, U1, U2, TW, V0, V1, H, ZB, LU0, LU1, GV1 };
}
