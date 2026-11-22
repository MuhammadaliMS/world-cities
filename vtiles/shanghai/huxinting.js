// Huxinting (Mid-Lake Pavilion Teahouse), Yu Garden: two storeys on an octagonal stone deck over the pond,
// stilts, red timber columns, lattice balustrades and windows lit warm with tea drinkers, three tiers of
// grey tiled roofs (lower eave, upper skirt, top pyramid) with sharply upswept hooked corners, gold finial,
// red lanterns swinging at every eave corner. Plan is an elongated octagon (wide to the viewer, like the reference).
import { P, CTS, INK, shade, mix, lerp, clamp, rng, TILE, RED, RED_D, RED_L, LAT, STONE, STONE_D, WARM, WARM_D,
  ring, ringFaces, ringRoof, fp, fquad, latticePanel, column3, figure } from "./_t0_-1.js";
import { lantern, textSign } from "./_props.js";

const D2R = Math.PI / 180;

export function makeHuxinting(cu = 4.5, cv = 4.5) {
  const ZD0 = 0.45, ZF = 0.75; // deck underside, floor
  // regular octagon on the grid: vertices at 22.5 deg + k*45 deg in (u,v), so four sides run along u or v
  const ROT = (67.5 * Math.PI) / 180;
  const rg = (A, z) => ring(cu, cv, A, A, z, ROT);
  const L1 = { A: 1.8, B: 1.8, z0: ZF, H: 1.9 };
  const L2 = { A: 1.66, B: 1.66, z0: 3.33, H: 1.65 };
  const DOOR = { face: 1 }; // the +v side (left face), the bridge arrives along v

  function stilts(k, t) {
    const c = k.ctx, Rd = rg(2.0, 0);
    const pts = [];
    for (let i = 0; i < 8; i++) { const a = Rd[i], b = Rd[(i + 1) % 8]; pts.push(a, [lerp(a[0], b[0], 0.5), lerp(a[1], b[1], 0.5), 0]); }
    pts.sort((p, q) => p[0] + p[1] - q[0] - q[1]);
    for (const p of pts) {
      if (p[0] + p[1] < cu + cv - 0.6) continue; // hidden behind the deck
      const [x, y0] = P(p[0], p[1], 0), [, y1] = P(p[0], p[1], ZD0);
      c.fillStyle = STONE_D; c.strokeStyle = INK; c.lineWidth = 1.1;
      c.beginPath(); c.rect(x - 4.5, y1, 9, y0 - y1); c.fill(); c.stroke();
      c.fillStyle = "rgba(0,0,0,0.18)"; c.fillRect(x, y1, 4.5, y0 - y1);
      // reflection + ripple
      c.fillStyle = "rgba(230,220,190,0.25)"; c.fillRect(x - 4, y0 + 1, 8, 7);
      const ph = (t * 0.45 + p[0] * 0.7) % 1;
      c.save(); c.globalAlpha = 0.55 * (1 - ph); c.strokeStyle = "#ffffff"; c.lineWidth = 1.1; c.beginPath(); c.ellipse(x, y0 + 1, 7 + ph * 10, (7 + ph * 10) * 0.42, 0, 0, 7); c.stroke(); c.restore();
    }
  }

  function deck(k) {
    const c = k.ctx, top = rg(2.1, ZF), bot = rg(2.1, ZD0);
    for (const f of ringFaces(top, cu, cv)) {
      const q = [P(...bot[f.i]), P(...bot[f.j]), P(...top[f.j]), P(...top[f.i])];
      k.path(q, { fill: mix(shade(STONE, -0.2), shade(STONE, -0.05), f.lit), lw: 1.2, wobble: 0 });
      // block joints
      c.strokeStyle = "rgba(90,75,50,0.45)"; c.lineWidth = 0.8; c.beginPath();
      for (let s = 0.25; s < 1; s += 0.25) { const p0 = fp(bot[f.i], bot[f.j], s, ZD0), p1 = fp(bot[f.i], bot[f.j], s, ZF); c.moveTo(...p0); c.lineTo(...p1); }
      c.moveTo(...fp(bot[f.i], bot[f.j], 0, (ZD0 + ZF) / 2)); c.lineTo(...fp(bot[f.i], bot[f.j], 1, (ZD0 + ZF) / 2)); c.stroke();
    }
    k.path(top.map((p) => P(...p)), { fill: "#ddd2b8", lw: 1.2, wobble: 0 });
    // paving lines on the deck rim
    c.strokeStyle = "rgba(120,100,70,0.35)"; c.lineWidth = 0.7; c.beginPath();
    for (let i = 0; i < 8; i++) { const a = top[i], b = rg(1.8, ZF)[i]; c.moveTo(...P(...a)); c.lineTo(...P(...b)); }
    c.stroke();
  }

  // one storey of the octagon: balustrade, lit lattice windows with tea drinkers, columns, frieze, brackets
  function storey(k, t, L, lvl) {
    const c = k.ctx, Rg = rg(L.A, 0), { z0, H } = L, zt = z0 + H;
    const balT = lvl === 1 ? 0.55 : 0.5, winB = balT + 0.05, winT = H - 0.3;
    for (const f of ringFaces(Rg, cu, cv, -0.02)) {
      const a = f.a, b = f.b, light = f.lit;
      const wallCol = mix("#5e1a14", "#86271f", light);
      fquad(c, a, b, 0, 1, z0, zt); c.fillStyle = wallCol; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
      const bays = 2;
      for (let bi = 0; bi < bays; bi++) {
        const s0 = bi / bays + 0.02, s1 = (bi + 1) / bays - 0.02;
        const isDoor = lvl === 1 && f.i === DOOR.face && bi === 1;
        // lit interior
        const zb = isDoor ? z0 + 0.02 : z0 + winB, ztp = z0 + winT;
        const q = fquad(c, a, b, s0, s1, zb, ztp);
        const g = c.createLinearGradient(q[0][0], q[3][1], q[0][0], q[0][1]); g.addColorStop(0, shade(WARM, 0.25)); g.addColorStop(1, WARM_D);
        c.fillStyle = g; c.fill();
        // back wall shadow + hanging lamp glow
        c.save(); c.clip();
        const mx = fp(a, b, (s0 + s1) / 2, ztp - 0.15);
        c.fillStyle = "rgba(255,240,190,0.5)"; c.beginPath(); c.arc(mx[0], mx[1] + 4, 9, 0, 7); c.fill();
        c.fillStyle = "rgba(110,50,20,0.25)"; c.fillRect(Math.min(q[0][0], q[1][0]), Math.min(q[2][1], q[3][1]), Math.abs(q[1][0] - q[0][0]), 5);
        // tea drinkers (seated) + a table
        const R = rng(f.i * 31 + bi * 7 + lvl * 101), nfig = isDoor ? 1 : 2 + Math.floor(R() * 2);
        for (let n = 0; n < nfig; n++) {
          const s = lerp(s0 + 0.08, s1 - 0.08, (n + 0.3 + R() * 0.4) / nfig), [x, y] = fp(a, b, s, z0 + winB + (lvl === 1 ? 0.55 : 0.48));
          figure(c, x, y + 4, lvl === 1 ? 1.0 : 0.9, f.i * 13 + bi * 5 + n + lvl * 50, t, { cup: n % 2 === 0 });
        }
        if (!isDoor) { const [tx, ty] = fp(a, b, (s0 + s1) / 2, z0 + winB + 0.3); c.fillStyle = "#6a3a20"; c.fillRect(tx - 6, ty - 2, 12, 3); c.fillStyle = "#f2efe6"; c.fillRect(tx - 3, ty - 4.5, 2.2, 2.5); c.fillRect(tx + 1.5, ty - 4.5, 2.2, 2.5); }
        c.restore();
        // window frame: mullions + lattice transom band
        c.strokeStyle = LAT; c.lineWidth = 1.1; c.beginPath();
        const nm = isDoor ? 2 : 4;
        for (let m = 1; m < nm; m++) { const s = lerp(s0, s1, m / nm); c.moveTo(...fp(a, b, s, zb)); c.lineTo(...fp(a, b, s, ztp)); }
        c.stroke();
        latticePanel(c, a, b, s0, s1, ztp - 0.3, ztp, { cell: 4.2, bg: "rgba(0,0,0,0)", col: "#8f2a1f", lw: 1 });
        fquad(c, a, b, s0, s1, zb, ztp); c.strokeStyle = RED_D; c.lineWidth = 2; c.stroke();
        // balustrade with fret (not on the door bay)
        if (!isDoor) latticePanel(c, a, b, s0 - 0.015, s1 + 0.015, z0 + 0.05, z0 + balT, { cell: lvl === 1 ? 6.5 : 6, bg: RED_D, col: RED_L, fret: true, lw: 1.2 });
        else { // threshold + door leaves folded open
          fquad(c, a, b, s0, s0 + 0.06, z0, ztp); c.fillStyle = RED; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
          fquad(c, a, b, s1 - 0.06, s1, z0, ztp); c.fillStyle = RED; c.fill(); c.stroke();
          fquad(c, a, b, s0, s1, z0, z0 + 0.06); c.fillStyle = "#3a1a12"; c.fill();
        }
        // balustrade top rail
        if (!isDoor) { const p0 = fp(a, b, s0 - 0.015, z0 + balT), p1 = fp(a, b, s1 + 0.015, z0 + balT); c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.moveTo(...p0); c.lineTo(...p1); c.stroke(); c.strokeStyle = RED_L; c.lineWidth = 1.8; c.stroke(); }
      }
      // frieze under the beam: lattice + beam + bracket blocks
      latticePanel(c, a, b, 0, 1, zt - 0.3, zt - 0.08, { cell: 4.4, bg: "#5a1712", col: "#b7402f", lw: 0.9 });
      fquad(c, a, b, 0, 1, zt - 0.08, zt + 0.04); c.fillStyle = RED; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
      fquad(c, a, b, 0, 1, zt + 0.04, zt + 0.22); c.fillStyle = "#4a1410"; c.fill(); c.stroke();
      const nb = 7;
      for (let m = 0; m < nb; m++) { const s = (m + 0.5) / nb; fquad(c, a, b, s - 0.025, s + 0.025, zt + 0.06, zt + 0.2); c.fillStyle = "#d9a441"; c.fill(); c.lineWidth = 0.6; c.stroke(); }
      // columns at the corners + the middle
      for (const s of [0, 0.5, 1]) column3(c, [lerp(a[0], b[0], s), lerp(a[1], b[1], s)], z0, zt + 0.05, s === 0.5 ? 4.6 : 6);
    }
  }

  function lanterns(k, R0, lift, z, skip = []) {
    const pts = R0.map((p, i) => ({ p, i })).filter(({ p, i }) => p[0] + p[1] > cu + cv - 0.4 && !skip.includes(i));
    for (const { p, i } of pts) {
      const [x, y] = P(p[0] + (p[0] - cu) * -0.08, p[1] + (p[1] - cv) * -0.08, z + lift * 0.4);
      lantern(k, x, y + 2, { s: 1.15, ph: i * 1.7 + z });
    }
  }

  function finial(k, t) {
    const c = k.ctx, [x, y] = P(cu, cv, 6.85);
    c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y + 6); c.lineTo(x, y - 8); c.stroke(); c.strokeStyle = "#c9952e"; c.lineWidth = 2.2; c.stroke();
    const ball = (yy, r, col) => { c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.arc(x, yy, r, 0, 7); c.fill(); c.stroke(); c.fillStyle = "rgba(255,250,210,0.75)"; c.beginPath(); c.arc(x - r * 0.35, yy - r * 0.35, r * 0.3, 0, 7); c.fill(); };
    c.fillStyle = "#b07a22"; c.beginPath(); c.ellipse(x, y + 2, 7, 3, 0, 0, 7); c.fill(); c.stroke();
    ball(y - 6, 5.2, "#e1b245"); ball(y - 15, 3.6, "#e8be52"); ball(y - 21, 2, "#f0cd68");
    // glint sweeping across the gold
    const g = (t * 0.25) % 1; if (g < 0.15) { c.save(); c.globalAlpha = 1 - g / 0.15; c.fillStyle = "#fff8d8"; c.beginPath(); c.arc(x - 2, y - 8, 2.2, 0, 7); c.fill(); c.restore(); }
  }

  function draw(k, t) {
    const c = k.ctx;
    stilts(k, t);
    deck(k);
    storey(k, t, L1, 1);
    const r1 = ringRoof(k, { cu, cv, A: 2.45, B: 2.45, rot: ROT, z: 3.0, lift: 0.4, top: { A: 1.7, B: 1.7, z: 3.55 }, sag: 0.05, hookS: 1.15, rows: 4 });
    storey(k, t, L2, 2);
    lanterns(k, r1.E, r1.lift, 3.0);
    const r2 = ringRoof(k, { cu, cv, A: 2.3, B: 2.3, rot: ROT, z: 5.35, lift: 0.55, top: { A: 1.3, B: 1.3, z: 5.98 }, sag: 0.06, hookS: 1.3, rows: 5 });
    // gilt plaque on the skirt front
    { { const q = rg(1.62, 5.25), [x, y] = P((q[0][0] + q[1][0]) / 2, (q[0][1] + q[1][1]) / 2, 5.25); textSign(k, x - 17, y - 3, 34, 11, "湖心亭", { bg: "#1f1a18", fg: "#e8c35a", size: 8, r: 1 }); } }
    const r3 = ringRoof(k, { cu, cv, A: 1.7, B: 1.7, z: 5.97, lift: 0.62, apex: 6.85, sag: 0.18, hookS: 1.2, rows: 6, rot: ROT });
    finial(k, t);
    lanterns(k, r2.E, r2.lift, 5.35);
  }
  return { draw, cu, cv, DOOR_UV: [cu, cv + 1.94], FLOOR: ZF };
}
