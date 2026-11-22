// The Eiffel Tower as true openwork: corner leg trusses, arch girders, lattice you can see through,
// arcade friezes + balustrades on the platforms, tiered lantern, lift, beacon, dappled shadow.
import { P, INK, shade, lerp, clamp } from "../../lib/vec-kit.js";

const IRON = "#6e4429", IRON_D = "#4a2c18", IRON_L = "#a06d43", RAIL = "#36210f", DECK = "#94673f";
const SKY = "#f3e6cc"; // what you see through the arcades

export function makeEiffel(C) {
  // half-width of the square section at height z (slim, concave)
  const KEYS = [[0, 2.05], [0.8, 1.7], [1.8, 1.4], [2.65, 1.21], [3.3, 1.03], [4.4, 0.82], [5.5, 0.63], [7, 0.44], [9, 0.3], [11, 0.21], [13.2, 0.15]];
  const H = (z) => { for (let i = 0; i < KEYS.length - 1; i++) if (z <= KEYS[i + 1][0]) { const f = (z - KEYS[i][0]) / (KEYS[i + 1][0] - KEYS[i][0]); return lerp(KEYS[i][1], KEYS[i + 1][1], f); } return 0.15; };
  const F = (face, s, z) => { const h = H(z); if (face === "L") return P(C + s * h, C + h, z); if (face === "R") return P(C + h, C + s * h, z); if (face === "A") return P(C + s * h, C - h, z); return P(C - h, C + s * h, z); };
  const back = (f) => f === "A" || f === "B";
  // leg width (units) up to the second platform
  const WL = (z) => (z < 2.65 ? lerp(0.8, 0.43, z / 2.65) : lerp(0.43, 0.25, clamp((z - 2.65) / 2.85)));
  const sIn = (side, z) => side * (1 - WL(z) / H(z));

  function member(c, pts, w, col) {
    c.lineCap = "round"; c.lineJoin = "round";
    c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
    c.strokeStyle = INK; c.lineWidth = w + 1.6; c.stroke();
    c.strokeStyle = col; c.lineWidth = w; c.stroke();
  }
  const curve = (fn, z0, z1, n = 12) => { const o = []; for (let i = 0; i <= n; i++) o.push(fn(lerp(z0, z1, i / n))); return o; };
  const polyPath = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };

  function legTruss(k, face, side, z0, z1) {
    const c = k.ctx, bk = back(face);
    const outer = curve((z) => F(face, side, z), z0, z1), inner = curve((z) => F(face, sIn(side, z), z), z0, z1);
    const poly = [...outer, ...[...inner].reverse()];
    c.save(); c.globalAlpha = bk ? 0.4 : 0.72; polyPath(c, poly); c.fillStyle = face === "R" || bk ? IRON_D : IRON; c.fill(); c.restore();
    c.save(); polyPath(c, poly); c.clip();
    c.strokeStyle = bk ? "rgba(60,36,20,0.55)" : RAIL; c.lineWidth = bk ? 0.8 : 1.05; c.beginPath();
    const band = 0.26;
    for (let z = z0; z < z1; z += band) {
      const a = F(face, side, z), b = F(face, sIn(side, z + band / 2), z + band / 2), d = F(face, side, z + band);
      const a2 = F(face, sIn(side, z), z), d2 = F(face, sIn(side, z + band), z + band), b2 = F(face, side, z + band / 2);
      c.moveTo(...a); c.lineTo(...b); c.lineTo(...d); c.moveTo(...a2); c.lineTo(...b2); c.lineTo(...d2);
    }
    c.stroke(); c.restore();
    const w = bk ? 1.0 : 1.9;
    member(c, outer, w, bk ? IRON_D : (face === "L" && side < 0 ? IRON_L : IRON));
    member(c, inner, w * 0.8, bk ? IRON_D : IRON);
  }

  function archGirder(k, face) {
    const c = k.ctx, bk = back(face);
    const sE = Math.abs(sIn(1, 1.1)) + 0.02;
    const zin = (s) => 0.7 + 1.25 * Math.sqrt(Math.max(0, 1 - (s / sE) ** 2));
    const zout = (s) => zin(s) + 0.5 + 0.2 * Math.abs(s / sE);
    const n = 24, inn = [], out = [];
    for (let i = 0; i <= n; i++) { const s = -sE + (2 * sE * i) / n; inn.push(F(face, s, zin(s))); out.push(F(face, s, zout(s))); }
    // spandrel lattice above the girder up to the platform
    const sp = [...out, F(face, sE, 2.62), F(face, -sE, 2.62)];
    c.save(); polyPath(c, sp); c.globalAlpha = bk ? 0.25 : 0.4; c.fillStyle = IRON_D; c.fill(); c.globalAlpha = 1; c.clip();
    c.strokeStyle = bk ? "rgba(60,36,20,0.5)" : "rgba(55,33,18,0.9)"; c.lineWidth = bk ? 0.7 : 0.95; c.beginPath();
    for (let s = -1; s < 1; s += 0.16) { c.moveTo(...F(face, s, 1.2)); c.lineTo(...F(face, s + 0.16, 2.62)); c.moveTo(...F(face, s + 0.16, 1.2)); c.lineTo(...F(face, s, 2.62)); }
    c.stroke();
    // little roundels in the spandrels (the decorative rings)
    if (!bk) for (const s of [-0.62, 0.62]) { const [x, y] = F(face, s * sE, 2.25); c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.strokeStyle = RAIL; c.lineWidth = 1.3; c.stroke(); }
    c.restore();
    // the girder band itself
    const band = [...inn, ...[...out].reverse()];
    polyPath(c, band); c.fillStyle = bk ? IRON_D : (face === "R" ? IRON_D : IRON); c.globalAlpha = bk ? 0.55 : 1; c.fill(); c.globalAlpha = 1;
    c.save(); polyPath(c, band); c.clip(); c.strokeStyle = RAIL; c.lineWidth = 0.9; c.beginPath();
    for (let i = 0; i < n; i++) { const a = inn[i], b = out[i + 1], d = inn[i + 1]; c.moveTo(...a); c.lineTo(...b); c.lineTo(...d); }
    c.stroke(); c.restore();
    member(c, inn, bk ? 0.9 : 1.6, bk ? IRON_D : IRON);
    member(c, out, bk ? 0.9 : 1.5, bk ? IRON_D : IRON_L);
  }

  function bracing(k, face, z0, z1, bands, alpha) {
    const c = k.ctx, bk = back(face);
    c.strokeStyle = bk ? `rgba(60,36,20,${alpha * 0.6})` : `rgba(55,33,18,${alpha})`; c.lineWidth = bk ? 0.8 : 1.15; c.beginPath();
    for (let i = 0; i < bands; i++) {
      const za = lerp(z0, z1, i / bands), zb = lerp(z0, z1, (i + 1) / bands);
      const l0 = sIn(-1, za), r0 = sIn(1, za), l1 = sIn(-1, zb), r1 = sIn(1, zb);
      c.moveTo(...F(face, l0, za)); c.lineTo(...F(face, r1, zb)); c.moveTo(...F(face, r0, za)); c.lineTo(...F(face, l1, zb));
      c.moveTo(...F(face, l1, zb)); c.lineTo(...F(face, r1, zb));
    }
    c.stroke();
  }

  function spireFace(k, face) {
    const c = k.ctx, bk = back(face);
    const z0 = 5.7, z1 = 13.12;
    const poly = [...curve((z) => F(face, -1, z), z0, z1, 16), ...curve((z) => F(face, 1, z), z1, z0, 16)];
    c.save(); polyPath(c, poly); c.globalAlpha = bk ? 0.1 : 0.34; c.fillStyle = face === "R" ? IRON_D : IRON; c.fill(); c.globalAlpha = 1; c.clip();
    // double lattice: X per band with a central vertical, bands shrink as it narrows
    c.strokeStyle = bk ? "rgba(60,36,20,0.32)" : "rgba(52,31,17,0.95)"; c.lineWidth = bk ? 0.6 : 1.0; c.beginPath();
    let z = z0;
    while (z < z1) {
      const b = Math.max(0.22, H(z) * 0.62);
      const zb = Math.min(z1, z + b);
      c.moveTo(...F(face, -1, z)); c.lineTo(...F(face, 0, zb)); c.lineTo(...F(face, 1, z));
      c.moveTo(...F(face, -1, zb)); c.lineTo(...F(face, 0, z)); c.lineTo(...F(face, 1, zb));
      c.moveTo(...F(face, -1, zb)); c.lineTo(...F(face, 1, zb));
      z = zb;
    }
    c.moveTo(...F(face, 0, z0)); c.lineTo(...F(face, 0, z1));
    c.stroke(); c.restore();
    // corner rails
    const w = bk ? 0.9 : 1.8;
    member(c, curve((z) => F(face, -1, z), z0, z1, 16), w, bk ? IRON_D : face === "L" ? IRON_L : IRON);
    member(c, curve((z) => F(face, 1, z), z0, z1, 16), w, bk ? IRON_D : IRON);
  }

  function platform(k, z, h, half, o = {}) {
    const c = k.ctx;
    const u = C - half, v = C - half, d = half * 2;
    const f = k.box(u, v, z, d, d, h, DECK, { shadow: false, hatch: false, noTop: !!o.ring });
    if (o.ring) {
      // deck is a ring round an open (glazed) centre
      const zt = z + h, r = o.ring;
      const ring = [P(u, v, zt), P(u + d, v, zt), P(u + d, v + d, zt), P(u, v + d, zt)];
      const inner = [P(C - r, C - r, zt), P(C - r, C + r, zt), P(C + r, C + r, zt), P(C + r, C - r, zt)];
      c.beginPath(); ring.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath();
      inner.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath();
      c.fillStyle = shade(DECK, 0.1); c.fill("evenodd"); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
      // planks
      c.save(); c.clip("evenodd"); c.strokeStyle = "rgba(60,36,20,0.35)"; c.lineWidth = 0.7; c.beginPath();
      for (let i = 1; i < 8; i++) { const f2 = i / 8; c.moveTo(...P(u + d * f2, v, zt)); c.lineTo(...P(u + d * f2, v + d, zt)); }
      c.stroke(); c.restore();
    }
    if (o.arcade) {
      const n = Math.max(3, Math.round(d * 3.2));
      for (const side of ["L", "R"]) for (let i = 0; i < n; i++) {
        const a = u + (d * (i + 0.18)) / n, b = u + (d * (i + 0.82)) / n, z0 = z + h * 0.16, z1 = z + h * 0.62, zt = z + h * 0.8;
        const q = side === "L" ? (s, zz) => P(s, v + d, zz) : (s, zz) => P(u + d, s - u + v, zz);
        const p0 = q(a, z0), p1 = q(b, z0), p2 = q(b, z1), p3 = q(a, z1), top = q((a + b) / 2, zt);
        c.beginPath(); c.moveTo(...p0); c.lineTo(...p1); c.lineTo(...p2); c.quadraticCurveTo(top[0] + (p2[0] - p3[0]) * 0, top[1] - 1, p3[0], p3[1]); c.closePath();
        c.fillStyle = side === "L" ? SKY : shade(SKY, -0.12); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
      }
    }
    return f;
  }
  function balustrade(k, z, half, sides) {
    const c = k.ctx, u = C - half, v = C - half, d = half * 2, hz = 0.16;
    const edges = { A: [[u, v], [u + d, v]], B: [[u, v], [u, v + d]], L: [[u, v + d], [u + d, v + d]], R: [[u + d, v], [u + d, v + d]] };
    for (const s of sides) {
      const [[a0, b0], [a1, b1]] = edges[s];
      const n = Math.max(4, Math.round(d * 6));
      c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath();
      for (let i = 0; i <= n; i++) { const f = i / n; const p = P(lerp(a0, a1, f), lerp(b0, b1, f), z), q = P(lerp(a0, a1, f), lerp(b0, b1, f), z + hz); c.moveTo(...p); c.lineTo(...q); }
      c.stroke();
      member(c, [P(a0, b0, z + hz), P(a1, b1, z + hz)], 1.1, IRON_L);
    }
  }

  // back layer: foot pads + the two far faces of the lower storey (people under the tower draw over this)
  function drawBack(k, t) {
    for (const [u, v] of [[C - 2.05, C - 2.05], [C + 1.25, C - 2.05], [C - 2.05, C + 1.25]]) k.box(u - 0.12, v - 0.12, 0, 1.04, 1.04, 0.26, "#e2d3b2", { hatch: false, shadow: false });
    for (const f of ["A", "B"]) { archGirder(k, f); legTruss(k, f, -1, 0.05, 2.62); legTruss(k, f, 1, 0.05, 2.62); }
  }
  // front layer: near faces, platforms, spire, top
  function draw(k, t) {
    const c = k.ctx;
    k.box(C + 1.25 - 0.12, C + 1.25 - 0.12, 0, 1.04, 1.04, 0.26, "#e2d3b2", { hatch: false, shadow: false });
    for (const f of ["L", "R"]) { archGirder(k, f); legTruss(k, f, -1, 0.05, 2.62); legTruss(k, f, 1, 0.05, 2.62); }
    // lift cabin riding the front-left leg
    const e = 0.5 - 0.5 * Math.cos(t * 0.7), ez = lerp(0.4, 2.2, e);
    const [lx, ly] = F("L", sIn(-1, ez) * 0.5 + -0.5, ez);
    c.fillStyle = "#e9cf72"; c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); c.roundRect(lx - 6, ly - 12, 12, 13, 2); c.fill(); c.stroke();
    c.fillStyle = "#86bcd3"; c.fillRect(lx - 4, ly - 10, 8, 5);
    // ---- first platform ----
    balustrade(k, 3.04, 1.42, ["A", "B"]);
    platform(k, 2.62, 0.42, 1.42, { arcade: true, ring: 0.82 });
    const gl = 0.82, gz = 3.04;
    k.poly([[C - gl, C - gl, gz], [C + gl, C - gl, gz], [C + gl, C + gl, gz], [C - gl, C + gl, gz]], "#9fc8d8", { lw: 1.2, wobble: 0 });
    c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 0.8; c.beginPath();
    for (let i = 1; i < 4; i++) { const f = -gl + (2 * gl * i) / 4; c.moveTo(...P(C + f, C - gl, gz)); c.lineTo(...P(C + f, C + gl, gz)); c.moveTo(...P(C - gl, C + f, gz)); c.lineTo(...P(C + gl, C + f, gz)); }
    c.stroke();
    // ---- middle storey ----
    for (const f of ["A", "B"]) { bracing(k, f, 3.12, 5.42, 3, 0.8); legTruss(k, f, -1, 3.12, 5.42); legTruss(k, f, 1, 3.12, 5.42); }
    // tiny visitors on the first-floor deck
    for (let i = 0; i < 3; i++) { const [x, y] = P(C - 1.15 + i * 0.35, C + 1.25, 3.04); const bob = Math.sin(t * 2 + i) * 0.5; c.fillStyle = ["#d9544b", "#3e6fa8", "#e9c24d"][i]; c.fillRect(x - 1.5, y - 6 + bob, 3, 4); c.fillStyle = "#e6b48c"; c.beginPath(); c.arc(x, y - 7.5 + bob, 1.4, 0, Math.PI * 2); c.fill(); }
    balustrade(k, 3.04, 1.42, ["L", "R"]);
    for (const f of ["L", "R"]) { bracing(k, f, 3.12, 5.42, 3, 0.95); legTruss(k, f, -1, 3.12, 5.42); legTruss(k, f, 1, 3.12, 5.42); }
    // ---- second platform ----
    balustrade(k, 5.68, 0.8, ["A", "B"]);
    platform(k, 5.42, 0.26, 0.8, { arcade: true, ring: 0.6 });
    // ---- spire ----
    spireFace(k, "A"); spireFace(k, "B");
    balustrade(k, 5.68, 0.8, ["L", "R"]);
    spireFace(k, "L"); spireFace(k, "R");
    // ---- top: deck, tiered lantern, dome, antenna, beacon ----
    platform(k, 13.1, 0.14, 0.3);
    balustrade(k, 13.24, 0.3, ["A", "B", "L", "R"]);
    k.cyl(C, C, 13.24, 0.17, 0.3, "#b98a57");
    const [wx, wy] = P(C, C, 13.36); c.fillStyle = "#e9d48a"; for (const dx of [-4, 0, 4]) c.fillRect(wx + dx - 1, wy - 3, 2, 4);
    k.cyl(C, C, 13.54, 0.11, 0.22, "#a87a4b");
    k.dome(C, C, 13.76, 0.1, 0.14, "#8a5e3a");
    const [ax, ay] = P(C, C, 13.88), [, ayt] = P(C, C, 15.3);
    member(c, [[ax, ay], [ax, ayt]], 1.4, "#6b5a4a");
    c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); for (const zz of [14.3, 14.75]) { const [x, y] = P(C, C, zz); c.moveTo(x - 4, y); c.lineTo(x + 4, y); } c.stroke();
    const ang = t * 1.4;
    c.save(); c.globalAlpha = 0.16 + 0.08 * Math.sin(t * 3);
    const [bx, by] = P(C, C, 14.05), bl = 160, ex = bx + Math.cos(ang) * bl, ey = by + Math.sin(ang) * bl * 0.3;
    const g = c.createLinearGradient(bx, by, ex, ey); g.addColorStop(0, "#fff3b0"); g.addColorStop(1, "rgba(255,243,176,0)");
    c.fillStyle = g; c.beginPath(); c.moveTo(bx, by); c.lineTo(ex - 10, ey - 12); c.lineTo(ex + 10, ey + 12); c.closePath(); c.fill(); c.restore();
    k.circle(bx, by, 2.8, (t % 1.2) < 0.6 ? "#ffd84a" : "#f6e7a8", { lw: 1 });
  }

  // the tower's shadow on the ground, dappled by the lattice (light from the upper left)
  function shadow(k) {
    const c = k.ctx;
    const pts = [[C - 2.0, C - 2.0], [C + 2.0, C - 2.0], [C + 6.5, C - 0.6], [C + 6.8, C - 0.1], [C + 2.0, C + 2.0], [C - 2.0, C + 2.0]].map(([u, v]) => P(u, v, 0));
    c.save();
    k._trace([P(0, 0), P(10, 0), P(10, 10), P(0, 10)], true, 0); c.clip();
    polyPath(c, pts); c.fillStyle = "rgba(70,55,40,0.16)"; c.fill(); c.clip();
    // dapples: light diamonds where the lattice lets the sun through
    c.fillStyle = "rgba(255,248,225,0.35)";
    for (let i = 0; i < 26; i++) for (let j = 0; j < 14; j++) {
      const u = C - 2 + i * 0.34 + (j % 2) * 0.17, v = C - 2.2 + j * 0.34;
      const [x, y] = P(u, v, 0);
      c.beginPath(); c.moveTo(x, y - 3); c.lineTo(x + 5, y); c.lineTo(x, y + 3); c.lineTo(x - 5, y); c.closePath(); c.fill();
    }
    c.restore();
  }

  return { draw, drawBack, shadow, H, F };
}
