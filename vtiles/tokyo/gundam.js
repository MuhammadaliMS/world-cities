// The life-size RX-78-2 Gundam statue (Odaiba) — v8 grid version: built from axis-aligned armour blocks through P(u,v,z),
// standing square to the grid with its chest on the left (v+dv) face. A-stance, left foot set back, fists down, beam-saber
// hilts over the shoulder. Moves: slow head turn, eye glow pulse, a glint running up the V-fin, faint vent steam.
import { P, INK, shade, lerp, clamp } from "../../lib/vec-kit.js";

const WH = "#f4f2ed", GR = "#767a85", GRD = "#4c505a", BL = "#2f5fae", RD = "#d63a2d", YL = "#f2c230";

export const S = 0.82; // overall scale of the local model (local units are x1/S)
export const HEIGHT = 5.65 * S;

export function makeGundam(U0, V0) {
  // part helpers (local a = along u, b = along v, z up)
  const T = (a, b, z) => [U0 + a * S, V0 + b * S, z * S]; // local model -> world
  const bx = (k, a0, a1, b0, b1, z0, z1, col, o = {}) => k.box(U0 + a0 * S, V0 + b0 * S, z0 * S, (a1 - a0) * S, (b1 - b0) * S, (z1 - z0) * S, col, { hatch: false, shadow: false, lw: o.lw ?? 1.15, left: o.left, right: o.right, top: o.top });
  const fl = (k, a0, a1, z0, z1, col, b, lw = 0.8) => k.poly([T(a0, b, z0), T(a1, b, z0), T(a1, b, z1), T(a0, b, z1)], col, { lw, wobble: 0 });
  const fr = (k, b0, b1, z0, z1, col, a, lw = 0.8) => k.poly([T(a, b0, z0), T(a, b1, z0), T(a, b1, z1), T(a, b0, z1)], col, { lw, wobble: 0 });
  const ln = (k, p, q, w = 0.8, col = "rgba(42,36,32,0.5)") => k.line3([T(...p), T(...q)], { lw: w, stroke: col, wobble: 0 });
  const poly3 = (k, pts, col, lw = 0.8) => k.poly(pts.map((p) => T(...p)), col, { lw, wobble: 0 });

  const parts = [];
  const add = (key, z0, fn) => parts.push({ key: key + z0 * 0.05, fn });

  // ----- legs -----
  const foot = (side) => {
    const s = side, a0 = s < 0 ? -0.84 : 0.16, a1 = a0 + 0.68, b0 = s < 0 ? -0.62 : -0.32, b1 = s < 0 ? 0.12 : 0.5;
    add((a0 + a1 + b0 + b1) / 2, 0, (k) => {
      bx(k, a0, a1, b0, b1, 0, 0.3, RD);
      bx(k, a0 + 0.1, a1 - 0.1, b0 + 0.06, b1 - 0.3, 0.3, 0.46, WH);
      fl(k, a0 + 0.08, a1 - 0.08, 0.04, 0.2, "#f4f2ed", b1, 0.7);          // white toe plate
      ln(k, [(a0 + a1) / 2, b1, 0.04], [(a0 + a1) / 2, b1, 0.3], 0.8);
      fl(k, a0 + 0.1, a1 - 0.1, 0.3, 0.44, "#767a85", b1 - 0.3, 0.7);
    });
  };
  foot(-1); foot(1);
  const leg = (side) => {
    const s = side, a0 = s < 0 ? -0.72 : 0.22, a1 = a0 + 0.5, fb = s < 0 ? -0.2 : 0.05; // forward offset
    add(a0 + 0.25 + fb, 0.46, (k) => { // shin
      bx(k, a0, a1, fb - 0.28, fb + 0.2, 0.46, 1.55, WH);
      fl(k, a0 + 0.08, a0 + 0.2, 0.6, 1.3, GRD, fb + 0.2, 0.6);
      fl(k, a0 + 0.28, a0 + 0.4, 0.6, 1.3, GRD, fb + 0.2, 0.6);
      fl(k, a0 + 0.2, a0 + 0.28, 1.2, 1.32, RD, fb + 0.2, 0.5);
      ln(k, [a0, fb + 0.2, 0.95], [a1, fb + 0.2, 0.95], 0.8);
      fr(k, fb - 0.2, fb + 0.1, 0.62, 1.2, GRD, a1, 0.6);
    });
    add(a0 + 0.25 + fb, 1.55, (k) => { // knee + thigh
      bx(k, a0 - 0.02, a1 + 0.02, fb - 0.3, fb + 0.24, 1.55, 1.98, WH);
      fl(k, a0 + 0.14, a1 - 0.14, 1.68, 1.9, RD, fb + 0.24, 0.7);
      ln(k, [a0 + 0.14, fb + 0.24, 1.9], [a0 + 0.25, fb + 0.24, 1.72], 0.8, INK); ln(k, [a0 + 0.25, fb + 0.24, 1.72], [a1 - 0.14, fb + 0.24, 1.9], 0.8, INK);
      bx(k, a0 + 0.02, a1 - 0.02, fb - 0.28, fb + 0.2, 1.98, 2.72, WH);
      ln(k, [a0 + 0.02, fb + 0.2, 2.3], [a1 - 0.02, fb + 0.2, 2.3], 0.8);
    });
  };
  leg(-1); leg(1);
  // hip frame + skirts + belt
  add(0, 2.55, (k) => {
    bx(k, -0.58, 0.58, -0.26, 0.3, 2.6, 2.95, GRD);
    bx(k, -0.1, 0.12, 0.3, 0.42, 2.58, 3.0, WH);
    fl(k, -0.05, 0.07, 2.65, 2.9, RD, 0.42, 0.6);
  });
  add(0.1, 2.75, (k) => {
    bx(k, -0.74, -0.58, -0.28, 0.24, 2.85, 3.38, WH); bx(k, 0.58, 0.74, -0.28, 0.24, 2.85, 3.38, WH);       // side skirts
    bx(k, -0.62, -0.02, 0.0, 0.44, 2.82, 3.4, WH); bx(k, 0.02, 0.62, 0.0, 0.44, 2.82, 3.4, WH);             // front skirts
    fl(k, -0.5, -0.12, 2.98, 3.32, YL, 0.44, 0.7); fl(k, 0.12, 0.5, 2.98, 3.32, YL, 0.44, 0.7);
    ln(k, [-0.62, 0.44, 2.9], [-0.02, 0.44, 2.9], 0.7); ln(k, [0.02, 0.44, 2.9], [0.62, 0.44, 2.9], 0.7);
  });
  add(0.1, 3.38, (k) => {
    bx(k, -0.66, 0.66, -0.3, 0.42, 3.38, 3.58, WH);                                                          // belt
    poly3(k, [[-0.2, 0.42, 3.58], [0.2, 0.42, 3.58], [0, 0.42, 3.38]], YL, 0.9);
    poly3(k, [[-0.08, 0.42, 3.54], [0.08, 0.42, 3.54], [0, 0.42, 3.44]], RD, 0.6);
  });
  // ----- backpack + saber hilts (behind the torso) -----
  add(-0.5, 3.8, (k, t) => {
    bx(k, -0.48, 0.48, -0.74, -0.34, 3.82, 4.92, "#e4e2dc");
    bx(k, -0.5, -0.26, -0.7, -0.4, 4.9, 5.05, "#f0eee8", { lw: 1 });
    k.cyl(...T(0.58, -0.56, 4.78).slice(0, 2), 4.78 * S, 0.055 * S, 0.9 * S, "#efa3c2");
    k.cyl(...T(-0.5, -0.56, 4.78).slice(0, 2), 4.78 * S, 0.05 * S, 0.85 * S, "#efa3c2");
    // thruster nozzles
    for (const a of [-0.28, 0.28]) { const [x, y] = P(...T(a, -0.4, 3.9)); k.ctx.fillStyle = GRD; k.ctx.beginPath(); k.ctx.ellipse(x, y, 6, 3.4, 0, 0, 6.3); k.ctx.fill(); }
  });
  // ----- torso -----
  add(0.05, 3.58, (k, t) => {
    bx(k, -0.5, 0.5, -0.3, 0.34, 3.58, 3.78, RD);                                                             // red waist
    ln(k, [-0.5, 0.34, 3.68], [0.5, 0.34, 3.68], 0.7); ln(k, [0, 0.34, 3.58], [0, 0.34, 3.78], 0.7);
    bx(k, -0.66, 0.66, -0.36, 0.4, 3.78, 4.66, BL);                                                           // blue chest
    // yellow intake vents with slats (front, plus the side vent on the right face)
    for (const [a0, a1] of [[-0.56, -0.14], [0.14, 0.56]]) {
      fl(k, a0, a1, 4.0, 4.36, YL, 0.4, 0.9);
      for (let i = 1; i < 4; i++) ln(k, [a0 + 0.02, 0.4, lerp(4.0, 4.36, i / 4)], [a1 - 0.02, 0.4, lerp(4.0, 4.36, i / 4)], 0.8, "rgba(120,70,10,0.8)");
    }
    fr(k, -0.22, 0.2, 4.0, 4.36, YL, 0.66, 0.9);
    ln(k, [0, 0.4, 3.82], [0, 0.4, 4.6], 0.6, "rgba(20,30,60,0.6)");
    fl(k, -0.2, 0.2, 4.4, 4.62, "#ecc02e", 0.4, 0.8);                                                         // collar plate
    bx(k, -0.45, 0.45, -0.28, 0.3, 4.66, 4.74, YL, { lw: 1 });
    // vent steam
    for (let i = 0; i < 2; i++) {
      const s = ((t * 0.22 + i * 0.5) % 1), [x, y] = P(...T(i ? 0.35 : -0.35, 0.2, 4.7 + s * 0.8));
      k.ctx.fillStyle = `rgba(255,255,255,${(1 - s) * 0.4})`; k.ctx.beginPath(); k.ctx.arc(x, y, 3 + s * 8, 0, 6.3); k.ctx.fill();
    }
  });
  // ----- arms (far arm first by the sort key) -----
  const arm = (side) => {
    const s = side, a0 = s < 0 ? -1.06 : 0.74, a1 = a0 + 0.32;
    add((a0 + a1) / 2 + 0.03, 2.3, (k) => {
      bx(k, a0 + 0.02, a1 - 0.02, -0.2, 0.2, 2.34, 2.66, GR);                                                   // fist
      ln(k, [a0 + 0.04, 0.2, 2.5], [a1 - 0.04, 0.2, 2.5], 0.8, "rgba(20,20,25,0.6)");
      bx(k, a0 - 0.02, a1 + 0.02, -0.22, 0.26, 2.66, 3.28, WH);                                                 // forearm
      fl(k, a0 + 0.06, a1 - 0.06, 2.9, 3.1, RD, 0.26, 0.6);
      ln(k, [a0 - 0.02, 0.26, 2.78], [a1 + 0.02, 0.26, 2.78], 0.8);
      bx(k, a0, a1, -0.18, 0.18, 3.28, 3.5, GR, { lw: 1 });                                                     // elbow
      bx(k, a0 + 0.02, a1 - 0.02, -0.2, 0.2, 3.5, 4.08, WH);                                                    // upper arm
      ln(k, [a0 + 0.02, 0.2, 3.8], [a1 - 0.02, 0.2, 3.8], 0.7);
    });
    add((a0 + a1) / 2 + 0.05, 4.08, (k) => {
      bx(k, a0 - 0.1, a1 + 0.1, -0.38, 0.38, 4.08, 4.8, WH);                                                    // shoulder armour
      fl(k, a0 + 0.04, a1 + 0.0, 4.22, 4.42, RD, 0.38, 0.6);
      ln(k, [a0 - 0.1, 0.38, 4.5], [a1 + 0.1, 0.38, 4.5], 0.8); ln(k, [(a0 + a1) / 2, 0.38, 4.1], [(a0 + a1) / 2, 0.38, 4.8], 0.6);
    });
  };
  arm(-1); arm(1);
  // ----- head (turns slowly toward the bay, eyes pulse, V-fin glints) -----
  add(0.1, 4.74, (k, t) => {
    const cyc = (t % 16) / 16;
    const kk = cyc < 0.3 ? 0 : cyc < 0.42 ? (cyc - 0.3) / 0.12 : cyc < 0.7 ? 1 : cyc < 0.82 ? 1 - (cyc - 0.7) / 0.12 : 0;
    const yaw = lerp(-0.12, 0.42, kk * kk * (3 - 2 * kk)), sh = Math.sin(yaw) * 0.26;
    bx(k, -0.14, 0.14, -0.12, 0.16, 4.74, 4.86, GR, { lw: 1 });                                               // neck
    const hx = -Math.sin(yaw) * 0.04;
    bx(k, hx - 0.27, hx + 0.27, -0.26, 0.28, 4.86, 5.42, WH);                                                    // helmet
    // vulcan ports on the side facing away from the turn
    fr(k, 0.0, 0.14, 5.26, 5.36, YL, hx + 0.27, 0.6);
    // face mask + eyes + chin + mouth
    const fw = 0.17;
    fl(k, hx - fw + sh * 0.3, hx + fw + sh * 0.3, 4.94, 5.3, "#e9e7e2", 0.28, 0.9);
    const glow = 0.55 + 0.45 * Math.sin(t * 2.4);
    for (const s of [-1, 1]) {
      const ea = hx + sh * 0.5 + s * 0.1;
      const [ex, ey] = P(...T(ea, 0.28, 5.2));
      k.ctx.fillStyle = `rgba(150,255,210,${0.3 * glow})`; k.ctx.beginPath(); k.ctx.arc(ex, ey, 5, 0, 6.3); k.ctx.fill();
      fl(k, ea - 0.045, ea + 0.045, 5.15, 5.25, `rgb(${Math.round(120 + 100 * glow)},255,${Math.round(190 + 40 * glow)})`, 0.28, 0.5);
    }
    ln(k, [hx + sh * 0.3 - 0.12, 0.28, 5.06], [hx + sh * 0.3 + 0.12, 0.28, 5.06], 0.7);
    fl(k, hx + sh * 0.3 - 0.06, hx + sh * 0.3 + 0.06, 4.9, 5.0, RD, 0.28, 0.6);
    // crest + V-fin blades in the front plane
    const cx = hx + sh * 0.2;
    fl(k, cx - 0.05, cx + 0.05, 5.28, 5.44, RD, 0.28, 0.6);
    const tips = [[cx - 0.5, 5.9], [cx + 0.5, 5.88]];
    for (const [ta, tz] of tips) { const s = Math.sign(ta - cx); poly3(k, [[cx, 0.29, 5.4], [cx + s * 0.18, 0.29, 5.52], [ta, 0.29, tz], [cx + s * 0.12, 0.29, 5.33]], YL, 1); }
    poly3(k, [[cx - 0.05, 0.29, 5.5], [cx + 0.05, 0.29, 5.5], [cx, 0.29, 5.7]], "#f6d55a", 0.7);
    // glint running up the right blade
    const g = (t * 0.35) % 1;
    if (g < 0.35) { const f = g / 0.35, [gx, gy] = P(...T(lerp(cx, tips[1][0], f), 0.29, lerp(5.5, tips[1][1], f))); k.ctx.fillStyle = `rgba(255,255,240,${Math.sin(f * Math.PI)})`; k.ctx.beginPath(); k.ctx.arc(gx, gy, 2.4, 0, 6.3); k.ctx.fill(); }
  });
  return {
    shadow(k) {
      k.poly([[U0 - 0.7, V0 - 0.5, 0], [U0 + 0.7, V0 - 0.28, 0], [U0 + 2.4, V0 + 0.3, 0], [U0 + 2.4, V0 + 0.8, 0], [U0 + 0.7, V0 + 0.4, 0], [U0 - 0.7, V0 + 0.1, 0]], "rgba(60,45,30,0.15)", { stroke: false, wobble: 0 });
    },
    draw(k, t) {
      parts.sort((p, q) => p.key - q.key);
      for (const p of parts) p.fn(k, t);
    },
  };
}
