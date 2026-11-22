// BURJ KHALIFA — rebuilt. Y-plan: three wings (left / right / back) + a hexagonal core. Each wing is a set of
// round-cornered drums that step back toward the axis in a spiral, every setback a silver terrace; vertical
// silver fins, curved glazing bands, gold-lit west faces, silver mechanical bands, a stepped crown, a long
// tapering spire with a beacon, three curved glass podium drums with terraces and a lit entrance.
import { P, CTS, INK, shade, lerp, clamp, rng } from "../../lib/vec-kit.js";

const SILVER = "#d5dce2", SILVER_D = "#9aa6b0";
const PAL = {
  left: ["#ecdca6", "#bcd6e0", "#80abcd", "#33608a"],
  mid: ["#e3d6ac", "#b3d0de", "#76a3c8", "#2f5b86"],
  right: ["#d9d3b4", "#a9c8dc", "#6c9ac2", "#2b5680"],
};

// one drum of the tower: glass body, curved bands, fins, silver mechanical band, terrace top
function drum(k, u, v, z0, z1, r, o = {}) {
  const c = k.ctx, t = k.t, seed = o.seed ?? 1, cols = o.cols || PAL.mid;
  const [x, yb] = P(u, v, z0), [, yt] = P(u, v, z1);
  const rx = r * CTS.S * Math.SQRT2, ry = rx * CTS.YS;
  const g = c.createLinearGradient(x - rx, 0, x + rx, 0);
  g.addColorStop(0, cols[0]); g.addColorStop(0.24, cols[1]); g.addColorStop(0.62, cols[2]); g.addColorStop(1, cols[3]);
  const body = () => { c.beginPath(); c.moveTo(x - rx, yt); c.lineTo(x - rx, yb); c.ellipse(x, yb, rx, ry, 0, Math.PI, 0, true); c.lineTo(x + rx, yt); c.closePath(); };
  body(); c.fillStyle = g; c.fill();
  c.save(); body(); c.clip();
  // glazing bands (curved, light + dark pair) every 0.13
  const step = o.band ?? 0.13;
  for (let z = z0 + step; z < z1 - 0.05; z += step) {
    const [, yy] = P(u, v, z);
    c.beginPath(); c.moveTo(x - rx, yy); c.quadraticCurveTo(x, yy + ry * 2, x + rx, yy);
    c.strokeStyle = "rgba(20,50,90,0.2)"; c.lineWidth = 0.7; c.stroke();
    c.beginPath(); c.moveTo(x - rx, yy + 1.4); c.quadraticCurveTo(x, yy + 1.4 + ry * 2, x + rx, yy + 1.4);
    c.strokeStyle = "rgba(255,255,255,0.2)"; c.lineWidth = 0.6; c.stroke();
  }
  // vertical silver fins, spaced evenly in angle so they bunch toward the edges like a real cylinder
  const nf = Math.max(6, Math.round(rx * 0.95));
  for (let i = 0; i <= nf; i++) {
    const th = Math.PI * (i / nf), xx = x - Math.cos(th) * rx, ss = Math.sin(th);
    c.strokeStyle = i % 2 ? "rgba(235,242,248,0.5)" : "rgba(20,45,80,0.3)"; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(xx, yt); c.lineTo(xx, yb + ry * ss); c.stroke();
  }
  // soft cylinder shading + warm west glow
  const sh = c.createLinearGradient(x - rx, 0, x + rx, 0);
  sh.addColorStop(0, "rgba(255,230,150,0.28)"); sh.addColorStop(0.3, "rgba(255,255,255,0.1)"); sh.addColorStop(0.7, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(10,25,60,0.28)");
  c.fillStyle = sh; c.fillRect(x - rx, yt - ry, rx * 2, yb - yt + ry * 3);
  // glint sweeping up
  const gy = yb - ((t * 0.07 + seed * 0.31) % 1.3) * (yb - yt) * 1.2;
  const gg = c.createLinearGradient(0, gy - 10, 0, gy + 10); gg.addColorStop(0, "rgba(255,255,255,0)"); gg.addColorStop(0.5, "rgba(255,255,255,0.28)"); gg.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = gg; c.fillRect(x - rx, gy - 10, rx * 2, 20);
  // twinkling panes
  const R = rng(seed * 91 + Math.round(z0 * 10));
  const np = Math.round((yb - yt) / 9);
  for (let i = 0; i < np; i++) { const px = x + (R() * 2 - 1) * rx * 0.85, py = yt + R() * (yb - yt), ph = R() * 6.28, a = Math.sin(t * 2.4 + ph); if (a > 0.82) { c.fillStyle = `rgba(255,255,255,${(a - 0.82) * 4})`; c.fillRect(px - 1, py - 1, 2, 2); } }
  // silver mechanical band (top 0.2) with louvres, and a thin one at the foot
  const bz = o.bandH ?? 0.2, [, yb2] = P(u, v, z1 - bz);
  c.beginPath(); c.moveTo(x - rx, yt); c.lineTo(x - rx, yb2); c.ellipse(x, yb2, rx, ry, 0, Math.PI, 0, true); c.lineTo(x + rx, yt); c.closePath();
  const sg = c.createLinearGradient(x - rx, 0, x + rx, 0); sg.addColorStop(0, "#f2f0e6"); sg.addColorStop(0.4, SILVER); sg.addColorStop(1, SILVER_D);
  c.fillStyle = sg; c.fill();
  c.strokeStyle = "rgba(60,75,90,0.5)"; c.lineWidth = 0.6;
  for (let i = 0; i <= nf; i += 1) { const th = Math.PI * (i / nf), xx = x - Math.cos(th) * rx; c.beginPath(); c.moveTo(xx, yt); c.lineTo(xx, yb2 + ry * Math.sin(th)); c.stroke(); }
  c.restore();
  c.strokeStyle = INK; c.lineWidth = o.lw ?? 1.3; c.lineJoin = "round";
  body(); c.stroke();
  // band edge
  c.beginPath(); c.ellipse(x, yb2, rx, ry, 0, 0, Math.PI); c.strokeStyle = "rgba(42,36,32,0.7)"; c.lineWidth = 0.9; c.stroke();
  // terrace top: silver ring, parapet, inner glass roof
  if (o.cap !== false) {
    c.beginPath(); c.ellipse(x, yt, rx, ry, 0, 0, 6.3); c.fillStyle = "#e4e9ed"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
    c.beginPath(); c.ellipse(x, yt, rx * 0.8, ry * 0.8, 0, 0, 6.3); c.fillStyle = "#c3ccd3"; c.fill(); c.strokeStyle = "rgba(42,36,32,0.55)"; c.lineWidth = 0.7; c.stroke();
    c.beginPath(); c.ellipse(x, yt, rx * 0.5, ry * 0.5, 0, 0, 6.3); c.fillStyle = "#9db9cb"; c.fill();
  }
}

export function makeBurj(C) {
  // tier tables read off the reference: [centre x px, half width px, top y px of the drum]
  const Y0 = P(C, C, 0)[1];
  const AX = 521, CU = C + 0.1, CV = C - 0.1;
  const WINGS = [
    { name: "back", pal: PAL.mid, tiers: [[521, 17, 300], [521, 15, 205], [521, 12, 140]] },
    { name: "left", dir: [0, 1], pal: PAL.left, tiers: [[518, 11, 100], [508, 12, 122], [496, 14, 218], [483, 14, 312], [469, 13, 395]] },
    { name: "right", dir: [1, 0], pal: PAL.right, tiers: [[530, 10, 90], [541, 11, 160], [550, 12, 250], [561, 12.5, 345], [573, 13, 425]] },
  ];
  const place = (W, [cx, hw, top], i) => {
    let u, v;
    if (W.name === "back") { u = CU - 0.35; v = CV - 0.35; }
    else { const o = Math.abs(cx - AX) / 45; u = CU + W.dir[0] * o; v = CV + W.dir[1] * o; }
    const y0 = P(u, v, 0)[1], r = hw / (CTS.S * Math.SQRT2), ry = hw * CTS.YS;
    const z1 = (y0 - (top + ry)) / (CTS.S * CTS.ZS);
    return { u, v, z1, r };
  };
  function wing(k, W, wi) {
    W.tiers.forEach((tr, i) => { const p = place(W, tr, i); drum(k, p.u, p.v, 0.2, p.z1, p.r, { cols: W.pal, seed: wi * 9 + i + 1, bandH: 0.3 }); });
  }
  function shadow(k) {
    const c = k.ctx; c.save();
    const g = c.createLinearGradient(...P(C, C, 0), ...P(C + 6.4, C + 1.0, 0));
    g.addColorStop(0, "rgba(40,60,80,0.2)"); g.addColorStop(1, "rgba(40,60,80,0)");
    k.poly([[C - 0.3, C - 0.3, 0], [C + 6.6, C + 0.5, 0], [C + 6.6, C + 1.3, 0], [C - 0.3, C + 0.7, 0]], g, { stroke: false });
    c.restore();
  }
  function podium(k, t) {
    const c = k.ctx;
    const DR = [[C - 1.18, C + 0.82, 0.68, 1], [C + 0.94, C - 1.3, 0.64, 2], [C, C - 0.1, 0.56, 3]];
    DR.sort((a, b) => a[0] + a[1] - b[0] - b[1]);
    const GL = [["#efe1b0", "#bcd8e4", "#7eaccb", "#3a6a95"], ["#f2e6bc", "#c4dce6", "#86b1cf", "#3f6f99"], ["#f4ead0", "#cfe2ea", "#92b9d4", "#4a78a0"]];
    for (const [u, v, r, s] of DR) {
      k.q(u + v + r * 0.7, () => {
        k.cyl(u, v, 0, r + 0.16, 0.08, "#e7d8b4");
        let z = 0.08;
        [[1, 0.34], [0.84, 0.3], [0.66, 0.26]].forEach(([f, h], i) => {
          drum(k, u, v, z, z + h, r * f, { cols: GL[i], band: 0.075, bandH: 0.07, seed: s * 11 + i, cap: true, lw: 1.1 });
          // white balustrade ring on the terrace
          const [x, y] = P(u, v, z + h), rx = r * f * CTS.S * Math.SQRT2 * 0.96, ry = rx * CTS.YS;
          c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 6.3); c.strokeStyle = "rgba(255,255,255,0.9)"; c.lineWidth = 1.4; c.stroke();
          if (i < 2) { // lit windows on the glass tier
            const [bx, by] = P(u, v, z + 0.08), rrx = r * f * CTS.S * Math.SQRT2, rry = rrx * CTS.YS;
            for (let q = 0; q < 12; q++) { const th = 0.2 + (q / 11) * (Math.PI - 0.4); c.fillStyle = "rgba(255,206,110,0.92)"; c.fillRect(bx - Math.cos(th) * rrx * 0.97 - 1.6, by + Math.sin(th) * rry * 0.97 - 5, 3.2, 6); }
          }
          z += h;
        });
        // rooftop planting
        const [tx, ty] = P(u, v, z + 0.03), rx = r * 0.66 * CTS.S * Math.SQRT2 * 0.6, ry = rx * CTS.YS;
        for (let i = 0; i < 6; i++) { const a = i * 1.05 + s; c.fillStyle = i % 2 ? "#5f9e55" : "#7fb25a"; c.beginPath(); c.arc(tx + Math.cos(a) * rx, ty + Math.sin(a) * ry, 2.8, 0, 6.3); c.fill(); }
      });
    }
    // central lit entrance: glowing arched canopy on the centre drum
    k.q(2 * C + 0.9, () => {
      const [x, y] = P(C + 0.35, C + 0.35, 0.0);
      const g = c.createRadialGradient(x, y - 8, 2, x, y - 8, 30); g.addColorStop(0, "rgba(255,214,130,0.85)"); g.addColorStop(1, "rgba(255,214,130,0)");
      c.fillStyle = g; c.fillRect(x - 32, y - 40, 64, 56);
      c.beginPath(); c.ellipse(x, y - 6, 15, 9, 0, 0, 6.3); c.fillStyle = "rgba(255,206,110,0.95)"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
      c.beginPath(); c.ellipse(x, y - 16, 19, 7, 0, 0, 6.3); c.fillStyle = "#efe6d0"; c.fill(); c.stroke();
    });
  }
  function draw(k, t) {
    const c = k.ctx;
    wing(k, WINGS[0], 0);
    // hexagonal core: tall central shaft, then the stepped crown
    const core = [[521, 15, 240], [521, 12, 170], [521, 9.5, 128], [521, 7.2, 100]];
    core.forEach(([cx, hw, top], i) => { const y0 = P(CU, CV, 0)[1], r = hw / (CTS.S * Math.SQRT2), z1 = (y0 - (top + hw * CTS.YS)) / (CTS.S * CTS.ZS); drum(k, CU, CV, 0.2, z1, r, { cols: PAL.mid, seed: 40 + i, lw: 1.2, bandH: 0.3 }); });
    wing(k, WINGS[1], 1);
    wing(k, WINGS[2], 2);
    // spire: stepped needle with rings, lattice and a blinking beacon
    const [x, y0] = P(C, C, 0), top = 100, base = y0 - 0 , sx = 512 + (515 - 512) * 0, ytip = 62;
    const cx = 515; // tower axis in px
    c.lineCap = "round";
    const seg = (ya, yb, w) => { c.strokeStyle = INK; c.lineWidth = w + 1.8; c.beginPath(); c.moveTo(cx, ya); c.lineTo(cx, yb); c.stroke(); c.strokeStyle = "#eef1f3"; c.lineWidth = w; c.stroke(); c.strokeStyle = "rgba(120,135,150,0.7)"; c.lineWidth = Math.max(0.6, w * 0.3); c.beginPath(); c.moveTo(cx + w * 0.22, ya); c.lineTo(cx + w * 0.22, yb); c.stroke(); };
    seg(100 + 4, 84, 5.4); seg(84, 74, 3.8); seg(74, 66, 2.4); seg(66, ytip + 4, 1.4);
    for (const yy of [96, 88, 80, 72]) { c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(cx - 4.5, yy); c.lineTo(cx + 4.5, yy); c.stroke(); }
    const blink = Math.sin(k.t * 3.2) > 0.2 ? 1 : 0.18;
    c.fillStyle = `rgba(255,70,60,${blink})`; c.beginPath(); c.arc(cx, ytip, 2, 0, 6.3); c.fill();
    if (blink > 0.5) { c.fillStyle = "rgba(255,90,70,0.28)"; c.beginPath(); c.arc(cx, ytip, 6.5, 0, 6.3); c.fill(); }
  }
  return { draw, shadow, podium, C };
}
