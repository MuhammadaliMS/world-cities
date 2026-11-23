// The London Eye (hero module for london 0,-1), grid pass: the wheel stands in a vertical plane along u (v = 3.4), so it reads as an
// ellipse. Every rim point is P(cu + R cos a, cv, hz + R sin a). Double-plane tubular rim truss, cable spokes, oval glass capsules
// hanging level with riders on the front plane, ribbed hub, A-frame legs leaning back along v with backstay cables, glass pavilion.
import { P, INK, shade, lerp, clamp, rng } from "../../lib/vec-kit.js";

const WHITE = "#f4f1e8", WHITE_D = "#cfcabb", GLASS = "#a7bdca";
export const CU = 5, CV = 3.4, HZ = 5.4, RAD = 4.2, DV = 0.22;
const OMEGA = (Math.PI * 2) / 32;
const TAU = Math.PI * 2;

function strokePath(c, pts, w, col, closed = false) {
  c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); if (closed) c.closePath();
  c.strokeStyle = INK; c.lineWidth = w + 2.2; c.lineJoin = "round"; c.lineCap = "round"; c.stroke();
  c.strokeStyle = col; c.lineWidth = w; c.stroke();
}
// a lit tube between two screen points
function beam(c, a, b, w, col = WHITE) {
  c.lineCap = "round";
  c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = INK; c.lineWidth = w + 2.2; c.stroke();
  c.strokeStyle = col; c.lineWidth = w; c.stroke();
  c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = Math.max(0.8, w * 0.28); c.beginPath(); c.moveTo(a[0] - w * 0.2, a[1]); c.lineTo(b[0] - w * 0.2, b[1]); c.stroke();
}
const lerp3 = (a, b, f) => [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)];
// text lying on a face that runs along +u (screen slope +0.577)
function textU(c, text, u, v, z, size, col) {
  const [x, y] = P(u, v, z);
  c.save(); c.transform(1, 0.577, 0, 1, x, y); c.font = `bold ${size}px sans-serif`; c.fillStyle = col; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(text, 0, 0); c.restore();
}

export function makeEye() {
  const rp = (a, v, s = 1) => P(CU + s * RAD * Math.cos(a), v, HZ + s * RAD * Math.sin(a));
  const rp3 = (a, v, s = 1) => [CU + s * RAD * Math.cos(a), v, HZ + s * RAD * Math.sin(a)];
  const theta = (t) => -t * OMEGA;
  const N = 96, NCAP = 16;

  // ---------- A-frame legs, axle stub, backstay cables (behind the wheel) ----------
  function drawHubLegs(k, t) {
    const c = k.ctx;
    const A1 = [CU - 0.2, CV - 0.72, HZ - 0.3], A2 = [CU + 0.2, CV - 0.72, HZ - 0.3];
    const F1 = [CU - 1.6, 1.0, 0], F2 = [CU + 1.6, 1.0, 0];
    // shadow of the frame on the paving
    k.shadow([[F1[0], F1[1], 0], [F1[0] + 0.35, F1[1] + 0.1, 0], [F2[0] + 0.35, F2[1] + 0.1, 0], [F2[0], F2[1], 0]], 0.1);
    // backstay cables to ground anchors further back
    const top = [CU, CV - 0.78, HZ + 0.1];
    for (const [au, av] of [[CU - 1.0, 0.5], [CU, 0.45], [CU + 1.0, 0.5]]) {
      const a = P(...top), b = P(au, av, 0.12);
      c.strokeStyle = INK; c.lineWidth = 3; c.lineCap = "round"; c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke();
      c.strokeStyle = "#9a9ea0"; c.lineWidth = 1.3; c.stroke();
      k.box(au - 0.14, av - 0.1, 0, 0.28, 0.2, 0.16, "#bdb7a6", { hatch: false, shadow: false });
    }
    // leg feet on hinge plinths
    for (const F of [F1, F2]) k.box(F[0] - 0.22, F[1] - 0.2, 0, 0.44, 0.4, 0.2, "#c6bfae", { hatch: false, shadow: false });
    // legs: two tapered tubes, collars, cross brace
    for (const [F, A] of [[F1, A1], [F2, A2]]) {
      const a = P(F[0], F[1], 0.2), b = P(...A);
      beam(c, a, b, 7.5);
      beam(c, lerp3(F, A, 0.5).length ? P(...lerp3([F[0], F[1], 0.2], A, 0.5)) : a, b, 10);
      for (const f of [0.25, 0.55, 0.85]) { const p = P(...lerp3([F[0], F[1], 0.2], A, f)); c.fillStyle = "#e8e3d6"; c.strokeStyle = INK; c.lineWidth = 1.1; c.beginPath(); c.ellipse(p[0], p[1], 6.4 - f * 1.2, 2.8, 0, 0, 7); c.fill(); c.stroke(); }
    }
    const b1 = P(...lerp3([F1[0], F1[1], 0.2], A1, 0.42)), b2 = P(...lerp3([F2[0], F2[1], 0.2], A2, 0.42));
    beam(c, b1, b2, 4);
    // axle stub from the apex to the hub
    beam(c, P(CU, CV - 0.72, HZ - 0.1), P(CU, CV - 0.1, HZ), 9);
  }

  // ---------- the wheel ----------
  function capsule(c, x, y, seed, t, a) {
    // oval glass capsule, hanging level, with riders; mount arm to the rim
    const rx = 14.5, ry = 19;
    c.strokeStyle = INK; c.lineWidth = 2.6; c.lineCap = "round"; c.beginPath(); c.moveTo(x, y - ry - 6); c.lineTo(x, y - ry + 2); c.stroke();
    c.strokeStyle = WHITE; c.lineWidth = 1.2; c.stroke();
    c.save();
    const g = c.createLinearGradient(x - rx, y, x + rx, y); g.addColorStop(0, "#d6e6ee"); g.addColorStop(0.6, GLASS); g.addColorStop(1, "#7d9bad");
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fillStyle = g; c.fill(); c.clip();
    // riders: heads and shoulders in the lower half
    const R = rng(seed * 13 + 3);
    for (let i = 0; i < 5; i++) {
      const px = x - 8 + i * 4 + (R() - 0.5) * 2, bob = Math.sin(t * 1.6 + seed + i) * 0.6, py = y + 2 + bob + (i % 2) * 1.5;
      c.fillStyle = ["#d9544b", "#3f6fa8", "#e8c14a", "#5f9e6e", "#e27fa0", "#2e4a6b"][(seed + i * 3) % 6]; c.beginPath(); c.roundRect(px - 2.6, py, 5.2, 8, 1.6); c.fill();
      c.fillStyle = ["#f1c9a5", "#c68a62", "#9a6544", "#f5d6bc"][(seed + i) % 4]; c.beginPath(); c.arc(px, py - 2, 2.3, 0, 7); c.fill();
      if ((seed + i) % 4 === 1) { c.strokeStyle = "#f1c9a5"; c.lineWidth = 1.1; c.beginPath(); c.moveTo(px + 2, py + 2); c.lineTo(px + 4, py - 6 - Math.abs(Math.sin(t * 5 + i)) * 2); c.stroke(); }
    }
    // frame mullions + floor + glint
    c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 1; c.beginPath(); c.moveTo(x - rx, y + 3); c.lineTo(x + rx, y + 3); c.moveTo(x, y - ry); c.lineTo(x, y + ry); c.stroke();
    c.fillStyle = "rgba(255,255,255,0.75)"; c.beginPath(); c.ellipse(x - 6, y - 9, 2.4, 6.5, 0.4, 0, 7); c.fill();
    c.restore();
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.strokeStyle = INK; c.lineWidth = 1.7; c.stroke();
    c.fillStyle = WHITE; c.beginPath(); c.ellipse(x, y - ry + 1, 6, 2.6, 0, 0, 7); c.fill(); c.lineWidth = 1; c.stroke();
    c.fillStyle = WHITE_D; c.beginPath(); c.ellipse(x, y + ry - 1, 7, 2.4, 0, 0, 7); c.fill(); c.stroke();
  }

  function drawWheel(k, t) {
    const c = k.ctx, th = theta(t), vF = CV + DV, vR = CV - DV;
    const hubF = P(CU, vF + 0.28, HZ), hubR = P(CU, vR - 0.28, HZ);
    // rear plane: rim + spokes (a little greyer, it is further back)
    const ring = (v) => { const pts = []; for (let i = 0; i <= N; i++) pts.push(rp(i / N * TAU, v)); return pts; };
    const spokes = (v, hubP, col, w) => {
      c.lineCap = "round";
      for (let i = 0; i < 32; i++) {
        const a = (i / 32) * TAU, r0 = i % 2 ? 0.55 : 0.4, h0 = P(CU + r0 * Math.cos(a + (i % 2 ? 0.5 : -0.5)), v, HZ + r0 * Math.sin(a + (i % 2 ? 0.5 : -0.5)));
        const e = rp(a, v, i % 2 ? 0.995 : 0.995);
        c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(...h0); c.lineTo(...e); c.stroke();
      }
    };
    strokePath(c, ring(vR), 4.2, "#d8d3c4", true);
    spokes(vR, hubR, "rgba(42,36,32,0.55)", 0.8);
    // inner (second) rim ring on each plane: slimmer truss chord at 0.965 R
    const ring2 = (v) => { const pts = []; for (let i = 0; i <= N; i++) pts.push(rp(i / N * TAU, v, 0.955)); return pts; };
    c.beginPath(); ring2(vR).forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.strokeStyle = "rgba(42,36,32,0.6)"; c.lineWidth = 1.1; c.stroke();
    // lattice between planes, rotating with the wheel
    c.strokeStyle = "rgba(42,36,32,0.7)"; c.lineWidth = 1; c.beginPath();
    const NL = 60;
    for (let i = 0; i < NL; i++) {
      const a0 = th + (i / NL) * TAU, a1 = th + ((i + 1) / NL) * TAU;
      c.moveTo(...rp(a0, vR)); c.lineTo(...rp(a1, vF)); c.moveTo(...rp(a1, vR)); c.lineTo(...rp(a1, vF));
    }
    c.stroke();
    // hub drum between the planes (ribbed), seen end-on along v
    const hubRad = 0.42, seg = 28, z0 = HZ;
    const ringAt = (v) => Array.from({ length: seg }, (_, i) => P(CU + hubRad * Math.cos(i / seg * TAU), v, z0 + hubRad * Math.sin(i / seg * TAU)));
    const hr = ringAt(vR - 0.3), hf = ringAt(vF + 0.3);
    for (let i = 0; i < seg; i++) {
      const j = (i + 1) % seg, a = i / seg * TAU;
      c.beginPath(); c.moveTo(...hr[i]); c.lineTo(...hr[j]); c.lineTo(...hf[j]); c.lineTo(...hf[i]); c.closePath();
      c.fillStyle = shade(WHITE, -0.12 - 0.18 * (0.5 + 0.5 * Math.cos(a - 2.3))); c.fill();
      c.strokeStyle = "rgba(42,36,32,0.35)"; c.lineWidth = 0.6; c.stroke();
    }
    strokePath(c, hr, 1.4, "#d8d3c4", true); strokePath(c, hf, 1.4, "#fbf9f2", true);
    c.fillStyle = "#c9c4b4"; c.beginPath(); c.arc(hubF[0], hubF[1], 3.4, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
    // front plane
    spokes(vF, hubF, "rgba(42,36,32,0.8)", 1.0);
    c.beginPath(); ring2(vF).forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.strokeStyle = "rgba(42,36,32,0.7)"; c.lineWidth = 1.3; c.stroke();
    strokePath(c, ring(vF), 5.2, WHITE, true);
    c.beginPath(); ring(vF).forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.strokeStyle = "rgba(255,255,255,0.9)"; c.lineWidth = 1.3; c.stroke();
    // brackets + capsules on the front rim, level with riders
    const caps = [];
    for (let i = 0; i < NCAP; i++) {
      const a = th + (i / NCAP) * TAU, v = vF + 0.5, p = P(CU + RAD * Math.cos(a), v, HZ + RAD * Math.sin(a) - 0.58);
      caps.push([a, p, i]);
    }
    for (const [a, p, i] of caps) {
      const rim = rp(a, vF);
      c.strokeStyle = INK; c.lineWidth = 3; c.lineCap = "round"; c.beginPath(); c.moveTo(...rim); c.lineTo(p[0], p[1] - 24); c.stroke();
      c.strokeStyle = WHITE; c.lineWidth = 1.4; c.stroke();
      capsule(c, p[0], p[1], 3 + i, t, a);
    }
    if (k.night) { // night: lit rim bulbs and glowing pods
      for (let i = 0; i < 48; i++) { const a = (i / 48) * TAU, q = rp3(a, vF + 0.05); k.glow(q[0], q[1], q[2], 0.2, i % 2 ? "#9fd2ff" : "#e6f4ff", 0.75); }
      for (const [a] of caps) k.glow(CU + RAD * Math.cos(a), vF + 0.5, HZ + RAD * Math.sin(a) - 1.0, 0.55, "#ffe2a8", 0.55);
      k.glow(CU, vF + 0.28, HZ, 0.7, "#cfe8ff", 0.6);
    }
  }

  // ---------- glass boarding pavilion under the wheel ----------
  function pavilion(k, t) {
    const c = k.ctx;
    k.box(3.55, 2.85, 0, 2.9, 1.5, 0.12, "#e0d8c3", { hatch: false, shadow: false });
    const u0 = 3.75, v0 = 3.0, du = 2.5, dv = 1.15, z0 = 0.12, h = 0.62;
    k.box(u0, v0, z0, du, dv, h, "#a9c7d4", { hatch: false, left: "#bcd7e0", right: "#8eaebe", top: "#dcecf1" });
    c.strokeStyle = "rgba(244,241,232,0.95)"; c.lineWidth = 1.4; c.beginPath();
    for (let i = 0; i <= 5; i++) { c.moveTo(...P(u0 + du * i / 5, v0 + dv, z0)); c.lineTo(...P(u0 + du * i / 5, v0 + dv, z0 + h)); }
    for (let i = 0; i <= 3; i++) { c.moveTo(...P(u0 + du, v0 + dv * i / 3, z0)); c.lineTo(...P(u0 + du, v0 + dv * i / 3, z0 + h)); }
    c.moveTo(...P(u0, v0 + dv, z0 + h * 0.5)); c.lineTo(...P(u0 + du, v0 + dv, z0 + h * 0.5));
    c.moveTo(...P(u0 + du, v0, z0 + h * 0.5)); c.lineTo(...P(u0 + du, v0 + dv, z0 + h * 0.5)); c.stroke();
    // open door and a slanting reflection
    k.poly([[u0 + 1.0, v0 + dv, z0], [u0 + 1.5, v0 + dv, z0], [u0 + 1.5, v0 + dv, z0 + h * 0.92], [u0 + 1.0, v0 + dv, z0 + h * 0.92]], "#4b6577", { lw: 0.8, wobble: 0 });
    c.strokeStyle = "rgba(255,255,255,0.55)"; c.lineWidth = 2; c.beginPath(); c.moveTo(...P(u0 + 0.2, v0 + dv, z0 + 0.1)); c.lineTo(...P(u0 + 0.55, v0 + dv, z0 + h - 0.08)); c.moveTo(...P(u0 + 1.75, v0 + dv, z0 + 0.1)); c.lineTo(...P(u0 + 2.1, v0 + dv, z0 + h - 0.08)); c.stroke();
    // flat white canopy with a sign board
    k.box(3.6, 2.95, z0 + h, 2.8, 1.35, 0.1, WHITE, { hatch: false, shadow: false });
    k.box(4.2, 4.28, z0 + h + 0.1, 1.6, 0.06, 0.26, "#2f4b6c", { hatch: false, shadow: false });
    textU(c, "LONDON EYE", 5.0, 4.34, z0 + h + 0.23, 7.5, "#f4f0e6");
    // queue rail + a little ramp
    k.poly([[3.55, 4.35, 0.12], [6.45, 4.35, 0.12], [6.45, 4.6, 0], [3.55, 4.6, 0]], "#d3cab5", { lw: 0.8, wobble: 0 });
  }

  return { drawHubLegs, drawWheel, pavilion };
}
