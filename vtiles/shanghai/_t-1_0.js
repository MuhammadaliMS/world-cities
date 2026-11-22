// Shanghai -1,0 (Century Park) helpers: pixel-space projection, leafy oaks, weeping willows, lotus, reeds,
// a dedicated tai-chi pose engine (custom skeleton person), rowing boats with oar strokes, kites.
// Everything is a pure function of k.t. Pixel coordinates are the 1024x1024 canonical tile frame
// (the same frame --mode grid shows), so positions read off the reference can be used directly.
import { P, CTS, INK, shade, mix, lerp, clamp, rng, hash, smooth } from "../../lib/vec-kit.js";
import { outfit } from "../../lib/vec-people.js";
export { P, CTS, INK, shade, mix, lerp, clamp, rng, hash, smooth };

const A = CTS.S * CTS.YS;
// pixel (x, y of a ground point) -> [u, v];  z lifts: pass the screen y of the point at height z
export const UV = (x, y, z = 0) => { const a = (y + z * CTS.S * CTS.ZS - CTS.Y0) / A, b = (x - CTS.X0) / CTS.S; return [(a + b) / 2, (a - b) / 2]; };
export const dep = (x, y) => (y - CTS.Y0) / A;
function limb(c, a, b, col, w, lw) {
  c.lineCap = "round"; c.lineJoin = "round";
  c.strokeStyle = INK; c.lineWidth = w + lw * 2;
  c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
  c.strokeStyle = col; c.lineWidth = w;
  c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
}
function limb3(c, a, m, b, col, w, lw) {
  c.lineCap = "round"; c.lineJoin = "round";
  c.strokeStyle = INK; c.lineWidth = w + lw * 2;
  c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(m[0], m[1]); c.lineTo(b[0], b[1]); c.stroke();
  c.strokeStyle = col; c.lineWidth = w;
  c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(m[0], m[1]); c.lineTo(b[0], b[1]); c.stroke();
}
function dot(c, p, r, col, lw) {
  c.beginPath(); c.arc(p[0], p[1], r, 0, Math.PI * 2); c.fillStyle = col; c.fill();
  if (lw) { c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); }
}
function shoe(c, p, fwd, r, col, lw) {
  // a small ellipse pointed along the walking direction on screen
  const ang = Math.atan2(fwd[1], fwd[0]);
  c.save(); c.translate(p[0], p[1]); c.rotate(ang);
  c.beginPath(); c.ellipse(r * 0.35, 0, r * 1.15, r * 0.7, 0, 0, Math.PI * 2);
  c.fillStyle = col; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
  c.restore();
}

function gaitLeg(p) {
  p = ((p % 1) + 1) % 1;
  if (p < 0.5) return { off: 1 - 4 * p, lift: 0 }; // stance: +1 -> -1 linearly (planted)
  const q = (p - 0.5) / 0.5; // swing: -1 -> +1 eased, foot lifted
  return { off: -1 + 2 * smooth(q), lift: Math.sin(Math.PI * q) };
}
function mk(u, v, z0) {
  return (du, dv, z) => P(u + du, v + dv, z0 + z);
}
function pick(R, a) { return a[Math.floor(R() * a.length)]; }
export function drawPerson(k, u, v, o = {}) {
  const c = k.ctx, t = k.t;
  const seed = o.seed ?? Math.round(u * 977 + v * 131);
  const fit = o.fit || outfit(seed, o);
  const H = o.h ?? (fit.kid ? 0.5 : 0.74); // height in units (~31 px adult)
  const z0 = o.z ?? 0;
  const pose = o.pose || "stand";
  let [du, dv] = o.dir || [1, 0.2];
  const dl = Math.hypot(du, dv) || 1; du /= dl; dv /= dl;
  const su = -dv, sv = du; // side vector (to the person's left)
  const toward = du + dv > -0.05; // heading toward the viewer -> face visible
  const scrX = du - dv; // + means moving right on screen
  const G = mk(u, v, z0);
  const lw = o.lw ?? 0.85;
  const R = rng(seed * 13 + 1);
  const ph = o.phaseOff ?? R();

  // ---- skeleton (ground units) ----
  const S = H * 0.17; // half stride
  const hipW = H * 0.075, shW = H * 0.12;
  let hipZ = H * 0.45, shZ = H * 0.76, headZ = H * 0.885;
  const headR = H * 0.135 * CTS.S;
  let bob = 0;
  const legs = [], arms = []; // each: {side:+1|-1, hip, knee, foot, lift}
  const sideNear = (s) => (su + sv) * s > 0; // which side faces the viewer

  const gp = o.p ?? 0;
  const K = pose === "custom" ? o.skel : null;
  if (K) {
    hipZ = K.hipZ; shZ = K.shZ; headZ = K.headZ;
    for (const L of K.legs) legs.push({ ...L, off: 0 });
    for (const A2 of K.arms) arms.push({ ...A2 });
  } else if (pose === "walk") {
    bob = H * 0.035 * (0.5 - 0.5 * Math.cos(4 * Math.PI * gp));
    for (const s of [1, -1]) {
      const g = gaitLeg(gp + (s > 0 ? 0 : 0.5));
      const fu = du * g.off * S + su * s * hipW, fv = dv * g.off * S + sv * s * hipW;
      const fz = g.lift * H * 0.09;
      const hip = [su * s * hipW, sv * s * hipW, hipZ + bob];
      const foot = [fu, fv, fz];
      // knee: halfway, pushed forward (more when swinging)
      const kf = H * (0.03 + 0.1 * g.lift);
      const knee = [(hip[0] + foot[0]) / 2 + du * kf, (hip[1] + foot[1]) / 2 + dv * kf, (hip[2] + foot[2]) / 2 + g.lift * H * 0.04];
      legs.push({ s, hip, knee, foot, off: g.off });
      // opposite arm swings with this leg
      const as = -s;
      const sh = [su * as * shW, sv * as * shW, shZ + bob];
      const swing = g.off * H * 0.13;
      const hand = [su * as * (shW + H * 0.02) + du * swing, sv * as * (shW + H * 0.02) + dv * swing, shZ + bob - H * 0.34];
      const elbow = [(sh[0] + hand[0]) / 2 - du * H * 0.02, (sh[1] + hand[1]) / 2 - dv * H * 0.02, (sh[2] + hand[2]) / 2 + H * 0.01];
      arms.push({ s: as, sh, elbow, hand });
    }
  } else if (pose === "sit" || pose === "sitground" || pose === "ride") {
    const seatZ = pose === "sitground" ? H * 0.06 : pose === "ride" ? (o.seatZ ?? H * 0.62) : (o.seatZ ?? H * 0.3);
    hipZ = seatZ + H * 0.04; shZ = hipZ + H * 0.33; headZ = shZ + H * 0.11;
    for (const s of [1, -1]) {
      const hip = [su * s * hipW, sv * s * hipW, hipZ];
      let knee, foot;
      if (pose === "sitground") {
        // cross-legged: knees out to the sides, feet tucked
        knee = [du * H * 0.16 + su * s * H * 0.17, dv * H * 0.16 + sv * s * H * 0.17, H * 0.07];
        foot = [du * H * 0.2 - su * s * H * 0.02, dv * H * 0.2 - sv * s * H * 0.02, H * 0.03];
      } else if (pose === "ride") {
        const a = t * (o.cadence ?? 7) + (s > 0 ? 0 : Math.PI);
        const cr = H * 0.1;
        const bb = [du * H * 0.08, dv * H * 0.08, H * 0.2];
        foot = [bb[0] + du * Math.cos(a) * cr + su * s * hipW, bb[1] + dv * Math.cos(a) * cr + sv * s * hipW, bb[2] + Math.sin(a) * cr];
        knee = [(hip[0] + foot[0]) / 2 + du * H * 0.13, (hip[1] + foot[1]) / 2 + dv * H * 0.13, (hip[2] + foot[2]) / 2 + H * 0.06];
      } else {
        knee = [du * H * 0.24 + su * s * hipW, dv * H * 0.24 + sv * s * hipW, hipZ];
        foot = [du * H * 0.27 + su * s * hipW, dv * H * 0.27 + sv * s * hipW, z0 > 0 ? hipZ - H * 0.28 : 0];
      }
      legs.push({ s, hip, knee, foot, off: 0 });
    }
  } else {
    // standing poses
    const sway = Math.sin(t * 1.3 + ph * 6) * H * 0.006;
    for (const s of [1, -1]) {
      const hip = [su * s * hipW, sv * s * hipW, hipZ];
      const foot = [su * s * hipW * 1.15 + du * H * 0.01, sv * s * hipW * 1.15 + dv * H * 0.01, 0];
      const knee = [(hip[0] + foot[0]) / 2 + du * H * 0.01, (hip[1] + foot[1]) / 2 + dv * H * 0.01, (hip[2] + foot[2]) / 2];
      legs.push({ s, hip, knee, foot, off: 0 });
    }
    bob = sway;
  }

  // arms for non-walk poses
  if (pose !== "walk" && !K) {
    for (const s of [1, -1]) {
      const sh = [su * s * shW, sv * s * shW, shZ + bob];
      let hand = [su * s * (shW + H * 0.03), sv * s * (shW + H * 0.03), shZ + bob - H * 0.33];
      let elbow = null;
      const right = s < 0; // the person's right
      const breathe = Math.sin(t * 1.6 + ph * 5) * H * 0.008;
      hand[2] += breathe;
      if (pose === "wave" && right) {
        const w = Math.sin(t * 8 + ph * 6);
        elbow = [su * s * (shW + H * 0.1), sv * s * (shW + H * 0.1), shZ + H * 0.05];
        hand = [su * s * (shW + H * 0.12) + du * w * H * 0.06, sv * s * (shW + H * 0.12) + dv * w * H * 0.06, shZ + H * 0.28];
      }
      if (pose === "cheer") {
        const w = Math.sin(t * 7 + ph * 6 + (s > 0 ? 0 : 1.2));
        elbow = [su * s * (shW + H * 0.1), sv * s * (shW + H * 0.1), shZ + H * 0.08];
        hand = [su * s * (shW + H * 0.08), sv * s * (shW + H * 0.08), shZ + H * 0.3 + w * H * 0.03];
      }
      if (pose === "clap") {
        const w = Math.abs(Math.sin(t * 6 + ph * 6));
        hand = [du * H * 0.14 + su * s * H * 0.02 * (1 + w * 2), dv * H * 0.14 + sv * s * H * 0.02 * (1 + w * 2), shZ - H * 0.12];
      }
      if (pose === "photo") {
        elbow = [su * s * (shW + H * 0.07) + du * H * 0.05, sv * s * (shW + H * 0.07) + dv * H * 0.05, shZ - H * 0.06];
        hand = [du * H * 0.14 + su * s * H * 0.035, dv * H * 0.14 + sv * s * H * 0.035, shZ + H * 0.06];
      }
      if (pose === "paint" && right) {
        const a = t * 2.2 + ph * 6;
        elbow = [su * s * (shW + H * 0.05) + du * H * 0.08, sv * s * (shW + H * 0.05) + dv * H * 0.08, shZ - H * 0.1];
        hand = [du * H * (0.26 + Math.cos(a) * 0.03) + su * s * shW, dv * H * (0.26 + Math.cos(a) * 0.03) + sv * s * shW, shZ - H * 0.02 + Math.sin(a * 1.3) * H * 0.05];
      }
      if (pose === "paint" && !right) { hand = [du * H * 0.1 + su * s * shW, dv * H * 0.1 + sv * s * shW, shZ - H * 0.2]; }
      if ((pose === "sit" || pose === "sitground") && o.gesture) {
        const w = Math.max(0, Math.sin(t * 1.3 + ph * 6));
        if (right) { elbow = [du * H * 0.08 + su * s * (shW + H * 0.04), dv * H * 0.08 + sv * s * (shW + H * 0.04), shZ - H * 0.15]; hand = [du * H * 0.16 + su * s * shW, dv * H * 0.16 + sv * s * shW, shZ - H * 0.18 + w * H * 0.2]; }
      }
      if (pose === "sit" || pose === "sitground") { if (!(o.gesture && right)) hand = [du * H * 0.14 + su * s * shW * 0.9, dv * H * 0.14 + sv * s * shW * 0.9, hipZ + H * 0.05]; }
      if (pose === "ride") { hand = [du * 0.36 + su * s * shW * 1.2, dv * 0.36 + sv * s * shW * 1.2, 0.52]; elbow = [du * 0.22 + su * s * shW * 1.4, dv * 0.22 + sv * s * shW * 1.4, (shZ + 0.52) / 2 + H * 0.02]; }
      if (!elbow) elbow = [(sh[0] + hand[0]) / 2 + su * s * H * 0.02, (sh[1] + hand[1]) / 2 + sv * s * H * 0.02, (sh[2] + hand[2]) / 2];
      arms.push({ s, sh, elbow, hand });
    }
  }

  if (pose === "ride") for (const A of arms) { A.sh[0] += du * H * 0.12; A.sh[1] += dv * H * 0.12; }
  const g = (p) => G(p[0], p[1], p[2]);
  const fwd = (() => { const a = G(0, 0, 0), b = G(du, dv, 0); return [b[0] - a[0], b[1] - a[1]]; })();
  const px = CTS.S; // px per unit (horizontal-ish)
  const legWpx = H * 0.085 * px, armWpx = H * 0.06 * px;

  // ---- shadow ----
  if (z0 === 0 || o.shadow) {
    const [sx, sy] = G(0.03, 0.03, 0);
    c.fillStyle = "rgba(60,45,30,0.17)"; c.beginPath(); c.ellipse(sx + 2, sy, H * 0.2 * px, H * 0.08 * px, 0, 0, Math.PI * 2); c.fill();
  }

  // draw order: far arm, far leg, near leg, body, near arm, head
  const far = (arr) => arr.filter((L) => !sideNear(L.s));
  const near = (arr) => arr.filter((L) => sideNear(L.s));
  const legCol = fit.bottom;
  const drawLeg = (L) => {
    const hip = g(L.hip), knee = g(L.knee), foot = g(L.foot);
    const isShort = fit.shorts || fit.style === "dress" || fit.style === "skirt";
    if (isShort) {
      limb(c, hip, knee, fit.style === "dress" || fit.style === "skirt" ? fit.skin : legCol, legWpx, lw);
      limb(c, knee, foot, fit.skin, legWpx * 0.85, lw);
      if (fit.shorts) limb(c, hip, [lerp(hip[0], knee[0], 0.75), lerp(hip[1], knee[1], 0.75)], legCol, legWpx * 1.1, lw);
    } else {
      limb3(c, hip, knee, foot, L.s > 0 ? legCol : shade(legCol, -0.12), legWpx, lw);
    }
    shoe(c, foot, fwd, legWpx * 0.62, fit.shoes, lw * 0.9);
  };
  const drawArm = (A, isNear) => {
    const sh = g(A.sh), el = g(A.elbow), ha = g(A.hand);
    const col = fit.style === "tee" || fit.style === "dress" ? fit.skin : (isNear ? fit.top : shade(fit.top, -0.12));
    if (fit.style === "tee" || fit.style === "dress") {
      // short sleeve then bare forearm
      limb(c, sh, [lerp(sh[0], el[0], 0.55), lerp(sh[1], el[1], 0.55)], isNear ? fit.top : shade(fit.top, -0.12), armWpx * 1.25, lw);
      limb3(c, [lerp(sh[0], el[0], 0.5), lerp(sh[1], el[1], 0.5)], el, ha, fit.skin, armWpx * 0.85, lw);
    } else limb3(c, sh, el, ha, col, armWpx, lw);
    dot(c, ha, armWpx * 0.55, fit.skin, lw * 0.8);
  };

  for (const A of far(arms)) drawArm(A, false);
  if (pose === "ride" || pose === "sit" || pose === "sitground" || (K && K.sitting)) { for (const L of legs) drawLeg(L); }
  else { for (const L of far(legs)) drawLeg(L); for (const L of near(legs)) drawLeg(L); }

  // ---- torso ----
  const lean = pose === "ride" ? H * 0.12 : 0;
  const shL = K ? g(K.sh[0]) : g([su * shW + du * lean, sv * shW + dv * lean, shZ + bob]), shR = K ? g(K.sh[1]) : g([-su * shW + du * lean, -sv * shW + dv * lean, shZ + bob]);
  const hpL = K ? g(K.hp[0]) : g([su * hipW * 1.25, sv * hipW * 1.25, hipZ + bob - H * 0.02]), hpR = K ? g(K.hp[1]) : g([-su * hipW * 1.25, -sv * hipW * 1.25, hipZ + bob - H * 0.02]);
  const ctr = K ? g(K.mid) : g([du * lean / 2, dv * lean / 2, (shZ + hipZ) / 2 + bob]);
  // keep a minimum visible width when seen side-on
  const minW = H * 0.17 * px;
  const widen = (a, b, w) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    if (L >= w) return [a, b];
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, nx = L ? dx / L : 1, ny = L ? dy / L : 0;
    return [[mx - nx * w / 2, my - ny * w / 2], [mx + nx * w / 2, my + ny * w / 2]];
  };
  const [s1, s2] = widen(shL, shR, minW), [h1, h2] = widen(hpL, hpR, minW * 0.85);
  let hemZ = hipZ - H * 0.02;
  if (fit.style === "coat") hemZ = hipZ - H * 0.17;
  if (fit.style === "dress") hemZ = hipZ - H * 0.22;
  if (fit.style === "skirt") hemZ = hipZ - H * 0.2;
  const hemDrop = (hipZ - hemZ) * CTS.S * CTS.ZS;
  const flare = fit.style === "dress" || fit.style === "skirt" ? 1.55 : fit.style === "coat" ? 1.15 : 1;
  const hc = [(h1[0] + h2[0]) / 2, (h1[1] + h2[1]) / 2];
  const H1 = [hc[0] + (h1[0] - hc[0]) * flare, hc[1] + (h1[1] - hc[1]) * flare + hemDrop], H2 = [hc[0] + (h2[0] - hc[0]) * flare, hc[1] + (h2[1] - hc[1]) * flare + hemDrop];
  const torso = () => {
    c.beginPath();
    c.moveTo(s1[0], s1[1] + 1);
    c.quadraticCurveTo((s1[0] + s2[0]) / 2, Math.min(s1[1], s2[1]) - H * 0.05 * px, s2[0], s2[1] + 1);
    c.lineTo(H2[0], H2[1]);
    c.quadraticCurveTo((H1[0] + H2[0]) / 2, (H1[1] + H2[1]) / 2 + 2, H1[0], H1[1]);
    c.closePath();
  };
  const topCol = fit.style === "skirt" ? fit.top : fit.top;
  torso(); c.fillStyle = topCol; c.fill();
  c.save(); torso(); c.clip();
  // skirt part in bottom colour
  if (fit.style === "skirt") { c.fillStyle = fit.bottom; c.fillRect(Math.min(H1[0], H2[0]) - 10, (hc[1] + ctr[1]) / 2 + 2, 60, 60); }
  if (fit.style === "overalls") { c.fillStyle = fit.bottom; c.fillRect(Math.min(h1[0], h2[0]) - 10, ctr[1] - 1, 60, 60); c.strokeStyle = fit.bottom; c.lineWidth = 1.6; c.beginPath(); c.moveTo(s1[0] + 2, s1[1]); c.lineTo(ctr[0] - 2, ctr[1]); c.moveTo(s2[0] - 2, s2[1]); c.lineTo(ctr[0] + 2, ctr[1]); c.stroke(); }
  if (fit.style === "stripes") { c.strokeStyle = fit.stripeCol; c.lineWidth = 1.3; c.beginPath(); for (let yy = Math.min(s1[1], s2[1]); yy < Math.max(H1[1], H2[1]); yy += 3) { c.moveTo(ctr[0] - 30, yy); c.lineTo(ctr[0] + 30, yy); } c.stroke(); }
  if (fit.style === "coat" || fit.style === "shirt") { c.strokeStyle = shade(topCol, -0.35); c.lineWidth = 0.9; c.beginPath(); c.moveTo(ctr[0], Math.min(s1[1], s2[1]) + 1); c.lineTo(hc[0], hc[1] + hemDrop); c.stroke(); }
  // form shading: right side darker (light from the upper left)
  const rightPt = s1[0] > s2[0] ? s1 : s2;
  c.fillStyle = "rgba(40,25,15,0.16)"; c.beginPath(); c.moveTo(ctr[0] + minW * 0.12, ctr[1] - 40); c.lineTo(ctr[0] + 60, ctr[1] - 40); c.lineTo(ctr[0] + 60, ctr[1] + 40); c.lineTo(ctr[0] + minW * 0.12, ctr[1] + 40); c.fill();
  c.restore();
  torso(); c.strokeStyle = INK; c.lineWidth = lw; c.lineJoin = "round"; c.stroke();
  if (fit.bag && pose === "walk") {
    const bp = g([su * (shW + H * 0.03) * (sideNear(1) ? 1 : -1), sv * (shW + H * 0.03) * (sideNear(1) ? 1 : -1), hipZ + bob]);
    c.fillStyle = fit.bagCol; c.strokeStyle = INK; c.lineWidth = lw * 0.9; c.beginPath(); c.roundRect(bp[0] - 2.6, bp[1] - 3, 5.2, 5, 1.2); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(bp[0], bp[1] - 3); c.lineTo(s2[0], s2[1] + 1); c.lineWidth = 0.8; c.stroke();
  }

  for (const A of near(arms)) drawArm(A, true);

  // ---- head ----
  const hc2 = K ? g(K.head) : g([du * (H * 0.01 + lean * 1.2), dv * (H * 0.01 + lean * 1.2), headZ + bob + H * 0.02 - (lean ? H * 0.03 : 0)]);
  const neck = K ? g(K.neck) : g([du * lean, dv * lean, shZ + bob + H * 0.01]);
  limb(c, neck, [hc2[0], hc2[1] + headR * 0.6], fit.skin, headR * 0.7, lw);
  const faceX = scrX >= 0 ? 1 : -1;
  // long hair hangs behind the head when we see the face
  if (fit.hairStyle === "long" && toward) { c.beginPath(); c.roundRect(hc2[0] - headR * 1.05, hc2[1] - headR * 0.3, headR * 2.1, headR * 1.9, headR * 0.6); c.fillStyle = fit.hair; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); }
  c.beginPath(); c.arc(hc2[0], hc2[1], headR, 0, Math.PI * 2); c.fillStyle = fit.skin; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
  c.save(); c.beginPath(); c.arc(hc2[0], hc2[1], headR, 0, Math.PI * 2); c.clip();
  c.fillStyle = "rgba(40,25,15,0.12)"; c.beginPath(); c.arc(hc2[0] + headR * 0.55, hc2[1] + headR * 0.3, headR * 0.9, 0, Math.PI * 2); c.fill();
  c.restore();
  // hair
  c.fillStyle = fit.hair; c.strokeStyle = INK; c.lineWidth = lw;
  const hs = fit.hairStyle;
  if (!toward) {
    // back of the head: mostly hair
    if (hs !== "bald") { c.beginPath(); c.arc(hc2[0], hc2[1], headR * 1.02, Math.PI * 0.9, Math.PI * 2.1); c.lineTo(hc2[0] + headR * 0.95, hc2[1] + headR * 0.55); c.quadraticCurveTo(hc2[0], hc2[1] + headR * (hs === "short" || hs === "curly" ? 0.75 : 1.1), hc2[0] - headR * 0.95, hc2[1] + headR * 0.55); c.closePath(); c.fill(); c.stroke(); }
    if (hs === "long") { c.beginPath(); c.roundRect(hc2[0] - headR * 0.9, hc2[1], headR * 1.8, headR * 1.7, headR * 0.5); c.fill(); c.stroke(); }
  } else if (hs !== "bald") {
    c.beginPath();
    c.arc(hc2[0], hc2[1], headR * 1.03, Math.PI * 1.02, Math.PI * 1.98);
    // fringe sweeps toward the face side
    c.quadraticCurveTo(hc2[0] + faceX * headR * 0.2, hc2[1] - headR * 0.25, hc2[0] - faceX * headR * 0.5, hc2[1] - headR * 0.2);
    c.quadraticCurveTo(hc2[0] - faceX * headR * 0.9, hc2[1] + headR * 0.1, hc2[0] - headR * 1.0 * (faceX > 0 ? 1 : -1) * 0.98, hc2[1] + headR * (hs === "bob" ? 0.75 : 0.25));
    c.closePath(); c.fill(); c.stroke();
    if (hs === "bob") { c.beginPath(); c.roundRect(hc2[0] - faceX * headR * 1.08 - headR * 0.18, hc2[1] - headR * 0.2, headR * 0.5, headR * 1.05, headR * 0.25); c.fill(); c.stroke(); }
    if (hs === "curly") for (let i = 0; i < 5; i++) { const a = Math.PI * (1.05 + i * 0.22); dot(c, [hc2[0] + Math.cos(a) * headR, hc2[1] + Math.sin(a) * headR], headR * 0.32, fit.hair, lw * 0.8); }
  }
  if (hs === "bun") { dot(c, [hc2[0] - faceX * headR * 0.3, hc2[1] - headR * 1.05], headR * 0.42, fit.hair, lw); }
  // face
  if (toward) {
    c.fillStyle = INK;
    const ex = hc2[0] + faceX * headR * 0.35, ey = hc2[1] + headR * 0.12;
    c.beginPath(); c.arc(ex, ey, Math.max(0.55, headR * 0.1), 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(ex - faceX * headR * 0.42, ey, Math.max(0.55, headR * 0.1), 0, Math.PI * 2); c.fill();
    c.fillStyle = "rgba(225,110,110,0.35)"; c.beginPath(); c.arc(ex + faceX * headR * 0.08, ey + headR * 0.32, headR * 0.16, 0, Math.PI * 2); c.fill();
  }
  // hats
  if (fit.hat === "beret") { c.fillStyle = fit.hatCol; c.beginPath(); c.ellipse(hc2[0] - faceX * headR * 0.1, hc2[1] - headR * 0.72, headR * 1.08, headR * 0.5, -faceX * 0.25, 0, Math.PI * 2); c.fill(); c.stroke(); }
  if (fit.hat === "cap") { c.fillStyle = fit.hatCol; c.beginPath(); c.arc(hc2[0], hc2[1] - headR * 0.15, headR * 1.02, Math.PI, 0); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.ellipse(hc2[0] + faceX * headR * 0.9, hc2[1] - headR * 0.15, headR * 0.6, headR * 0.18, 0, 0, Math.PI * 2); c.fill(); c.stroke(); }
  if (fit.hat === "sunhat") { c.fillStyle = fit.hatCol; c.beginPath(); c.ellipse(hc2[0], hc2[1] - headR * 0.45, headR * 1.7, headR * 0.5, 0, 0, Math.PI * 2); c.fill(); c.stroke(); c.beginPath(); c.arc(hc2[0], hc2[1] - headR * 0.5, headR * 0.85, Math.PI, 0); c.fill(); c.stroke(); }
  // camera for photo pose
  if (pose === "photo") { const cp = g([du * H * 0.17, dv * H * 0.17, shZ + H * 0.07]); c.fillStyle = "#2a2420"; c.beginPath(); c.roundRect(cp[0] - 3.5, cp[1] - 2.5, 7, 5, 1); c.fill(); if ((t * 0.7 + ph) % 1 < 0.06) { c.fillStyle = "rgba(255,250,220,0.9)"; c.beginPath(); c.arc(cp[0], cp[1], 6, 0, Math.PI * 2); c.fill(); } }

  const hand = arms.length ? g(arms.find((a) => a.s < 0)?.hand || arms[0].hand) : hc2;
  return { x: hc2[0], headY: hc2[1], hr: headR, hand, fit };
}

// =====================================================================================================
// skeleton builder: two-bone IK limbs from hip / foot / hand targets (all coordinates in H units, local
// frame: f = forward, s = left, z = up). Returns the `skel` consumed by drawPerson (pose: "custom").
// =====================================================================================================
const fr = (a) => ({ f: [Math.cos(a), Math.sin(a)], s: [-Math.sin(a), Math.cos(a)] });
function ik3(a, b, L1, L2, pole) {
  let d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], dl = Math.hypot(d[0], d[1], d[2]) || 1e-6;
  const mx = (L1 + L2) * 0.998; let e = b;
  if (dl > mx) { const f = mx / dl; e = [a[0] + d[0] * f, a[1] + d[1] * f, a[2] + d[2] * f]; dl = mx; }
  const n = [d[0] / (Math.hypot(...d) || 1e-6), d[1] / (Math.hypot(...d) || 1e-6), d[2] / (Math.hypot(...d) || 1e-6)];
  const a1 = (L1 * L1 - L2 * L2 + dl * dl) / (2 * dl), h = Math.sqrt(Math.max(0, L1 * L1 - a1 * a1));
  const pd = pole[0] * n[0] + pole[1] * n[1] + pole[2] * n[2];
  let po = [pole[0] - n[0] * pd, pole[1] - n[1] * pd, pole[2] - n[2] * pd]; const pl = Math.hypot(...po) || 1; po = po.map((x) => x / pl);
  return { knee: [a[0] + n[0] * a1 + po[0] * h, a[1] + n[1] * a1 + po[1] * h, a[2] + n[2] * a1 + po[2] * h], foot: e };
}
export function buildSkel(H, phi, S) {
  const F0 = fr(phi + (S.yaw || 0)), F1 = fr(phi + (S.shYaw || 0)), Fb = fr(phi), Fh = fr(phi + (S.handYaw ?? S.shYaw ?? 0));
  const W = (F, a, b, z) => [(F.f[0] * a + F.s[0] * b) * H, (F.f[1] * a + F.s[1] * b) * H, z * H];
  const add = (p, q) => [p[0] + q[0], p[1] + q[1], p[2] + q[2]];
  const hw = 0.075 * 1.25, sw = S.shW ?? 0.12, TL = S.torso ?? 0.31;
  const hipC = W(F0, S.hip[0], S.hip[1], S.hip[2]);
  const hipL = add(hipC, W(F0, 0, hw, 0)), hipR = add(hipC, W(F0, 0, -hw, 0));
  const lean = S.lean || 0;
  const shC = add(add(hipC, W(F1, lean, 0, 0)), [0, 0, TL * H * Math.sqrt(Math.max(0.2, 1 - lean * lean * 2.5))]);
  const shL = add(shC, W(F1, 0, sw, 0)), shR = add(shC, W(F1, 0, -sw, 0));
  const legs = [], arms = [];
  const L1 = 0.235 * H, L2 = 0.225 * H;
  [[1, hipL, S.feet[0]], [-1, hipR, S.feet[1]]].forEach(([s, hip, ft]) => {
    const foot = W(Fb, ft[0], ft[1], ft[2] || 0);
    const pole = S.sitting ? [0, 0, 1] : [F0.f[0] + s * F0.s[0] * 0.25, F0.f[1] + s * F0.s[1] * 0.25, 0.15];
    const r = ik3(hip, foot, L1, L2, pole);
    legs.push({ s, hip, knee: r.knee, foot: r.foot });
  });
  const U1 = 0.19 * H, U2 = 0.17 * H;
  [[1, shL, S.hands[0]], [-1, shR, S.hands[1]]].forEach(([s, sh, hd]) => {
    const hand = add([shC[0], shC[1], 0], add(W(Fh, hd[0], hd[1], 0), [0, 0, hd[2] * H]));
    const pole = [Fh.s[0] * s * 0.7 - Fh.f[0] * 0.15, Fh.s[1] * s * 0.7 - Fh.f[1] * 0.15, -1];
    const r = ik3(sh, hand, U1, U2, pole);
    arms.push({ s, sh, elbow: r.knee, hand: r.foot });
  });
  const head = add(add(shC, W(F1, lean * 0.5 + 0.012, 0, 0)), [0, 0, 0.125 * H]);
  const neck = add(shC, [0, 0, 0.012 * H]);
  const mid = [(shC[0] + hipC[0]) / 2, (shC[1] + hipC[1]) / 2, (shC[2] + hipC[2]) / 2];
  return { hipZ: hipC[2], shZ: shC[2], headZ: head[2], legs, arms, sh: [shL, shR], hp: [hipL, hipR], head, neck, mid, sitting: !!S.sitting };
}

// =====================================================================================================
// tai chi: a slow 28 s form, smooth Catmull-Rom hands/hips, planted feet that only slide on step segments
// =====================================================================================================
export const TC_T = 28;
const V = (...a) => a;
// each key: t, hip [f,s,z], lean, yaw (hips), shYaw (shoulders), phi (facing offset), feet [[f,s],[f,s]] (L,R), hands [[f,s,z],[f,s,z]] (L,R; f,s relative to shoulders)
const TC = [
  { t: 0, hip: V(0, 0, 0.45), lean: 0, yaw: 0, sh: 0, phi: 0, feet: [V(0, 0.1), V(0, -0.1)], hands: [V(0.02, 0.17, 0.4), V(0.02, -0.17, 0.4)] },
  { t: 3.5, hip: V(0, 0, 0.43), lean: 0, yaw: 0, sh: 0, phi: 0, feet: [V(0, 0.1), V(0, -0.1)], hands: [V(0.3, 0.1, 0.74), V(0.3, -0.1, 0.74)] },
  { t: 7, hip: V(0, 0, 0.38), lean: 0.03, yaw: 0, sh: 0, phi: 0, feet: [V(0, 0.1), V(0, -0.1)], hands: [V(0.26, 0.12, 0.5), V(0.26, -0.12, 0.5)] },
  { t: 10.5, hip: V(0.12, 0, 0.37), lean: 0.06, yaw: 0.1, sh: 0.15, phi: 0.1, feet: [V(0.36, 0.1), V(-0.2, -0.12)], hands: [V(0.42, 0.06, 0.68), V(0.34, -0.04, 0.66)] },
  { t: 14, hip: V(-0.04, 0, 0.4), lean: -0.03, yaw: 0.1, sh: -0.1, phi: 0.1, feet: [V(0.36, 0.1), V(-0.2, -0.12)], hands: [V(0.16, 0.14, 0.56), V(0.18, -0.1, 0.52)] },
  { t: 17.5, hip: V(0.02, 0.03, 0.36), lean: 0.02, yaw: 0.2, sh: 0.4, phi: 0.4, feet: [V(0.36, 0.1), V(-0.12, -0.3)], hands: [V(0.1, 0.4, 0.73), V(0.08, -0.41, 0.73)] },
  { t: 21, hip: V(0, -0.06, 0.39), lean: 0, yaw: -0.1, sh: 0.1, phi: 0.2, feet: [V(0.03, 0.14), V(-0.02, -0.15)], hands: [V(0.2, 0.02, 0.6), V(0.18, -0.32, 0.78)] },
  { t: 24.5, hip: V(0, 0.06, 0.39), lean: 0, yaw: 0.1, sh: -0.1, phi: -0.1, feet: [V(0.03, 0.14), V(-0.02, -0.15)], hands: [V(0.18, 0.32, 0.78), V(0.2, -0.02, 0.6)] },
  { t: 28, hip: V(0, 0, 0.45), lean: 0, yaw: 0, sh: 0, phi: 0, feet: [V(0, 0.1), V(0, -0.1)], hands: [V(0.02, 0.17, 0.4), V(0.02, -0.17, 0.4)] },
];
const cr = (p0, p1, p2, p3, u) => 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
function tcParams(t) {
  const n = TC.length - 1; // last key duplicates the first
  t = ((t % TC_T) + TC_T) % TC_T;
  let i = 0; while (i < n - 1 && t >= TC[i + 1].t) i++;
  const a = TC[i], b = TC[i + 1], u = (t - a.t) / (b.t - a.t), us = smooth(u);
  const K = (j) => TC[((j % n) + n) % n];
  const p0 = K(i - 1), p1 = K(i), p2 = K(i + 1), p3 = K(i + 2);
  const sc = (g) => cr(g(p0), g(p1), g(p2), g(p3), u);
  const hip = [0, 1, 2].map((q) => sc((x) => x.hip[q]));
  const hands = [0, 1].map((h) => [0, 1, 2].map((q) => sc((x) => x.hands[h][q])));
  const feet = [0, 1].map((f) => {
    const fa = a.feet[f], fb = b.feet[f], d = Math.hypot(fb[0] - fa[0], fb[1] - fa[1]);
    return [lerp(fa[0], fb[0], us), lerp(fa[1], fb[1], us), d > 0.01 ? Math.min(0.1, d * 0.3) * Math.sin(Math.PI * us) : 0];
  });
  return { hip, lean: sc((x) => x.lean), yaw: sc((x) => x.yaw), sh: sc((x) => x.sh), phi: sc((x) => x.phi), hands, feet };
}
// draws one tai chi practitioner at ground (u,v); phi0 = base facing in the uv plane
export function taiChi(k, u, v, o) {
  const H = o.h ?? 1.2, t = k.t + (o.phase || 0), p = tcParams(t);
  const br = Math.sin(k.t * 1.4 + (o.seed || 0)) * 0.006;
  const phi = (o.phi0 ?? -0.55) + p.phi;
  const hands = p.hands.map((h) => [h[0], h[1], h[2] + br]);
  const skel = buildSkel(H, phi, { hip: [p.hip[0], p.hip[1], p.hip[2]], lean: p.lean, yaw: p.yaw, shYaw: p.sh, handYaw: p.sh * 0.6, feet: p.feet, hands });
  return drawPerson(k, u, v, { pose: "custom", skel, dir: [Math.cos(phi), Math.sin(phi)], seed: o.seed, h: H, style: "shirt", top: o.top, bottom: o.bottom ?? shade(o.top || "#888888", -0.12), hair: o.hair, hairStyle: o.hairStyle, skin: o.skin, shoes: o.shoes ?? "#2a2420", hat: null, bag: false });
}

// =====================================================================================================
// trees: leafy oak canopy (many shaded leaf clusters), weeping willow (bundled drooping strands), cherry
// =====================================================================================================
function ground(c, x, y, rx, ry, a = 0.2) { c.fillStyle = `rgba(40,58,24,${a})`; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); }
function canopy(k, cx, cy, rx, ry, seed, col, o = {}) {
  const c = k.ctx, t = k.t, R = rng(seed * 7 + 3);
  const n = o.n ?? Math.round(26 + (rx * ry) / 55), bumps = [];
  const br = o.br ?? 0.145;
  for (let i = 0; i < n; i++) {
    const rim = i < n * 0.42;
    const a = rim ? (i / (n * 0.42)) * 6.283 + R() * 0.35 : R() * 6.283;
    const rho = rim ? 0.8 + R() * 0.18 : Math.sqrt(R()) * 0.78;
    const r = br * ((rx + ry) / 2) * (0.78 + R() * 0.55);
    bumps.push({ x: cx + Math.cos(a) * rho * rx, y: cy + Math.sin(a) * rho * ry, r, i });
  }
  bumps.push({ x: cx, y: cy, r: Math.min(rx, ry) * 0.8, i: 99 }); bumps.push({ x: cx - rx * 0.35, y: cy + ry * 0.1, r: ry * 0.6, i: 98 }); bumps.push({ x: cx + rx * 0.35, y: cy + ry * 0.1, r: ry * 0.6, i: 97 });
  bumps.sort((p, q) => p.y - q.y);
  const sway = (b) => Math.sin(t * 1.1 + seed + b.i * 0.55) * 1.3 * clamp(1 - (b.y - (cy - ry)) / (2 * ry)) + Math.sin(t * 2.3 + seed * 2 + b.i) * 0.4;
  c.beginPath(); for (const b of bumps) { const x = b.x + sway(b); c.moveTo(x + b.r + 0.8, b.y); c.arc(x, b.y, b.r + 0.8, 0, 6.283); }
  c.strokeStyle = INK; c.lineWidth = 3.4; c.lineJoin = "round"; c.stroke();
  for (const b of bumps) {
    const x = b.x + sway(b), ndx = (b.x - cx) / rx, ndy = (b.y - cy) / ry, l = clamp(-(ndx * 0.55 + ndy * 0.85), -1, 1);
    const base = shade(col, l * 0.2 - 0.14);
    c.beginPath(); c.arc(x, b.y, b.r, 0, 6.283); c.fillStyle = base; c.fill();
    c.save(); c.beginPath(); c.arc(x, b.y, b.r, 0, 6.283); c.clip();
    c.fillStyle = shade(base, 0.13); c.beginPath(); c.arc(x - b.r * 0.28, b.y - b.r * 0.34, b.r * 0.72, 0, 6.283); c.fill();
    c.fillStyle = shade(base, 0.07); c.beginPath(); c.arc(x - b.r * 0.38, b.y - b.r * 0.45, b.r * 0.38, 0, 6.283); c.fill();
    c.strokeStyle = shade(base, -0.3); c.lineWidth = 0.9;
    for (let m = 0; m < 4; m++) { const a0 = 0.3 + R() * 0.8, rr = 1.8 + R() * 1.6, mx = x + (R() - 0.35) * b.r * 1.1, my = b.y + (R() - 0.2) * b.r * 1.0; c.beginPath(); c.arc(mx, my, rr, a0, a0 + 2.3); c.stroke(); }
    c.strokeStyle = shade(base, -0.34); c.lineWidth = 1.3; c.beginPath(); c.arc(x, b.y, b.r - 0.6, 0.15, 1.6); c.stroke();
    c.restore();
  }
}
function trunk(c, bx, by, tx, ty, w, seed, forks = 2) {
  const R = rng(seed * 11 + 5);
  c.lineCap = "round"; c.lineJoin = "round";
  const path = () => { c.beginPath(); c.moveTo(bx - w * 0.9, by + 1); c.quadraticCurveTo(bx - 1, by - (by - ty) * 0.15, bx, by - (by - ty) * 0.35); c.lineTo(bx + 0, ty); };
  for (const [ww, col] of [[w + 3.2, INK], [w, "#8a6446"]]) { c.strokeStyle = col; c.lineWidth = ww; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + (tx - bx) * 0.2, by - (by - ty) * 0.5, tx, ty); c.stroke(); }
  // root flare
  c.fillStyle = "#8a6446"; c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.moveTo(bx - w * 1.1, by + 2); c.quadraticCurveTo(bx - w * 0.3, by - 3, bx - w * 0.3, by - w * 1.6); c.lineTo(bx + w * 0.3, by - w * 1.6); c.quadraticCurveTo(bx + w * 0.3, by - 3, bx + w * 1.1, by + 2); c.closePath(); c.fill(); c.stroke();
  for (let i = 0; i < forks; i++) { const s = i % 2 ? 1 : -1, len = 22 + R() * 16; for (const [ww, col] of [[w * 0.55 + 3, INK], [w * 0.55, "#7d5a3c"]]) { c.strokeStyle = col; c.lineWidth = ww; c.beginPath(); c.moveTo(tx, ty + 6); c.quadraticCurveTo(tx + s * len * 0.3, ty - len * 0.5, tx + s * len * 0.9, ty - len * (0.9 + R() * 0.4)); c.stroke(); } }
  c.strokeStyle = "rgba(60,40,24,0.55)"; c.lineWidth = 0.9; c.beginPath(); for (let i = 0; i < 4; i++) { const f = 0.15 + i * 0.2, x = lerp(bx, tx, f) + 1.5, y = lerp(by, ty, f); c.moveTo(x, y); c.lineTo(x + 0.5, y - 7); } c.stroke();
}
export function oak(k, bx, by, cx, cy, rx, ry, seed, col = "#7fae4c", o = {}) {
  const c = k.ctx;
  ground(c, bx + rx * 0.35, by + 2, rx * 0.8, rx * 0.26, 0.2);
  trunk(c, bx, by, cx + (o.lean || 0), cy + ry * 0.45, o.tw ?? Math.max(6, rx * 0.11), seed);
  canopy(k, cx, cy, rx, ry, seed, col, o);
}
// cherry: pink canopy + blossoms + falling petals
export function cherry(k, bx, by, cx, cy, rx, ry, seed) {
  const c = k.ctx, t = k.t, R = rng(seed * 3 + 1);
  oak(k, bx, by, cx, cy, rx, ry, seed, "#f0a7c6", { br: 0.18, n: 46 });
  for (let i = 0; i < 80; i++) {
    const a = R() * 6.283, rho = Math.sqrt(R()) * 0.92, x = cx + Math.cos(a) * rho * rx, y = cy + Math.sin(a) * rho * ry * 0.95, tw = Math.sin(t * 1.6 + i * 1.7) * 0.5 + 0.5;
    c.fillStyle = i % 3 === 0 ? "#fff3f7" : i % 3 === 1 ? "#f7bdd4" : "#e98ab0";
    for (let p = 0; p < 5; p++) { const b = (p / 5) * 6.283 + i; c.beginPath(); c.arc(x + Math.cos(b) * 2, y + Math.sin(b) * 2, 1.7 + tw * 0.2, 0, 7); c.fill(); }
    c.fillStyle = "#e5b24a"; c.beginPath(); c.arc(x, y, 0.9, 0, 7); c.fill();
  }
  // petals drifting down to the grass
  for (let i = 0; i < 9; i++) {
    const ph = (t * 0.12 + i * 0.111 + hash(seed + i)) % 1, x = cx - rx * 0.8 + hash(seed * 2 + i) * rx * 1.6 + Math.sin(t * 1.3 + i * 2) * 9 + ph * 14, y = cy + ry * 0.3 + ph * (by - cy + 4);
    c.save(); c.translate(x, y); c.rotate(t * 2 + i); c.globalAlpha = 1 - ph * ph; c.fillStyle = "#f7bdd4"; c.strokeStyle = "rgba(160,70,110,0.6)"; c.lineWidth = 0.5; c.beginPath(); c.ellipse(0, 0, 2.6, 1.4, 0, 0, 7); c.fill(); c.stroke(); c.restore();
  }
}
// weeping willow. dome of leaf clusters, then many bundled strands with leaf ticks. trunkX = x of the visible trunk
export function willowW(k, bx, by, cx, cy, rx, ry, hang, seed, o = {}) {
  const c = k.ctx, t = k.t, R = rng(seed * 9 + 1), col = o.col || "#a9c64d";
  ground(c, bx + rx * 0.3, by + 2, rx * 0.7, rx * 0.2, 0.2);
  // dome
  const domeN = Math.round(18 + rx / 5);
  const dome = (yy) => { canopy(k, cx, cy - ry * 0.28 + yy, rx * 0.88, ry * 0.6, seed * 5 + 1, shade(col, 0.04), { br: 0.17, n: Math.round(26 + rx * 0.5) }); };
  const strands = [];
  const NS = Math.round(60 + rx * 2.2);
  for (let i = 0; i < NS; i++) {
    const f = (i + R() * 0.8) / NS, a = Math.PI * (1 - f * 1.0), x0 = cx + Math.cos(a) * rx * (0.92 - R() * 0.3), y0 = cy + ry * (-0.15 + Math.abs(Math.sin(a)) * 0.35 + R() * 0.3);
    const edge = Math.abs(Math.cos(a));
    const len = hang * (0.55 + 0.45 * R()) * (1 - 0.5 * edge * edge);
    strands.push({ x0, y0, len, ph: R() * 6.28, lite: R(), w: 1.3 + R() * 1.1 });
  }
  strands.sort((p, q) => p.y0 + p.len * 0.05 - (q.y0 + q.len * 0.05));
  const drawStrand = (s) => {
    const sw = (f) => (Math.sin(t * 1.3 + s.ph + f * 1.2) * 3 + Math.sin(t * 2.6 + s.ph * 2) * 0.8) * f * f;
    const pts = []; for (let j = 0; j <= 8; j++) { const f = j / 8; pts.push([s.x0 + sw(f) + (s.x0 - cx) * 0.13 * f + Math.sin(f * 5 + s.ph) * 1.8 * f, s.y0 + s.len * f]); }
    const path = () => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let j = 1; j < pts.length; j++) c.lineTo(pts[j][0], pts[j][1]); };
    c.lineCap = "round"; c.lineJoin = "round";
    path(); c.strokeStyle = INK; c.lineWidth = s.w + 1.3; c.stroke();
    path(); c.strokeStyle = shade(col, (s.lite - 0.5) * 0.2 + ((cx - s.x0) / rx) * 0.08); c.lineWidth = s.w; c.stroke();
    // leaf ticks along the strand
    c.strokeStyle = shade(col, -0.18); c.lineWidth = 1;
    c.beginPath(); for (let j = 1; j < 8; j++) { const [x, y] = pts[j], d = j % 2 ? 1 : -1; c.moveTo(x, y); c.lineTo(x + d * 2.3, y + 1.8); } c.stroke();
    c.strokeStyle = shade(col, 0.2); c.lineWidth = 0.9; c.beginPath(); c.moveTo(pts[0][0] - 0.5, pts[0][1] + 3); c.lineTo(pts[3][0] - 0.5, pts[3][1]); c.stroke();
  };
  const half = Math.floor(strands.length * 0.55);
  for (let i = 0; i < half; i++) drawStrand(strands[i]);
  trunk(c, bx, by, o.trunkX ?? cx, cy + ry * 0.55, o.tw ?? Math.max(7, rx * 0.075), seed, 0);
  dome(0);
  for (let i = half; i < strands.length; i++) { const s = strands[i]; if (o.trunkX != null && Math.abs(s.x0 - o.trunkX) < 7 && s.y0 + s.len > by - 30) continue; drawStrand(s); }
}

// =====================================================================================================
// water life: lotus pads + flowers, reeds, shore stones, ripples
// =====================================================================================================
export function pad(c, x, y, r, rot, col) {
  r *= 0.78; c.save(); c.translate(x, y);
  const n0 = rot % 6.28; c.beginPath(); c.ellipse(0, 0, r, r * 0.46, 0, n0 + 0.3, n0 + Math.PI * 2 - 0.0); c.lineTo(0, 0); c.closePath();
  c.fillStyle = col; c.fill(); c.strokeStyle = "#1f3a22"; c.lineWidth = 1; c.stroke();
  c.fillStyle = "rgba(255,255,200,0.16)"; c.beginPath(); c.ellipse(-r * 0.2, -r * 0.1, r * 0.55, r * 0.22, 0, 0, 7); c.fill();
  c.strokeStyle = "rgba(20,60,30,0.45)"; c.lineWidth = 0.6; c.beginPath(); for (let i = 0; i < 5; i++) { const a = 0.9 + i * 1.0; c.moveTo(0, 0); c.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.45); } c.stroke();
  c.restore();
}
export function lotusFlower(c, x, y, size, ph, t, bud) {
  const sw = Math.sin(t * 1.2 + ph) * 0.8;
  c.save(); c.translate(x + sw, y);
  c.strokeStyle = "#3d6a36"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-sw * 0.5, size * 1.4); c.lineTo(0, 0); c.stroke();
  if (bud) {
    c.fillStyle = "#f4a7c4"; c.strokeStyle = "#a54a72"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(0, size * 0.9); c.quadraticCurveTo(-size * 0.7, 0, 0, -size * 1.3); c.quadraticCurveTo(size * 0.7, 0, 0, size * 0.9); c.fill(); c.stroke();
  } else {
    const petals = [[-1.0, 0.25, 0], [1.0, 0.25, 0], [-0.55, -0.1, 0.35], [0.55, -0.1, 0.35], [0, -0.35, 0.5]];
    for (const [dx, dy, lt] of petals) { c.beginPath(); c.moveTo(0, size * 0.5); c.quadraticCurveTo(dx * size * 0.95, dy * size * 0.6 - size * 0.6, dx * size * 0.5, -size * (0.45 + lt)); c.quadraticCurveTo(dx * size * 0.15, -size * 0.1, 0, size * 0.5); c.fillStyle = lt > 0.3 ? "#fbc3d8" : "#f08ab4"; c.fill(); c.strokeStyle = "#a54a72"; c.lineWidth = 0.8; c.stroke(); }
    c.fillStyle = "#f7e08a"; c.beginPath(); c.ellipse(0, size * 0.1, size * 0.25, size * 0.14, 0, 0, 7); c.fill();
  }
  c.restore();
}
export function stone(c, x, y, r, seed) {
  const R = rng(seed * 5 + 2);
  c.beginPath(); for (let i = 0; i <= 10; i++) { const a = (i / 10) * 6.283, rr = r * (0.85 + R() * 0.25); const px = x + Math.cos(a) * rr * 1.25, py = y + Math.sin(a) * rr * 0.72; i ? c.lineTo(px, py) : c.moveTo(px, py); }
  c.closePath(); const g = c.createLinearGradient(x - r, y - r, x + r, y + r); g.addColorStop(0, "#d8d2c0"); g.addColorStop(1, "#8d8774"); c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
  c.fillStyle = "rgba(255,255,255,0.4)"; c.beginPath(); c.ellipse(x - r * 0.3, y - r * 0.22, r * 0.5, r * 0.2, 0, 0, 7); c.fill();
}
export function reeds(k, x, y, n, seed, h = 30) {
  const c = k.ctx, t = k.t, R = rng(seed * 3 + 9);
  for (let i = 0; i < n; i++) {
    const bx = x + (R() - 0.5) * 18, by = y + (R() - 0.5) * 5, hh = h * (0.7 + R() * 0.6), sw = Math.sin(t * 1.5 + i * 1.3 + seed) * 2.6 + (R() - 0.5) * 3;
    const tx = bx + sw, ty = by - hh;
    c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + sw * 0.2, by - hh * 0.5, tx, ty); c.stroke();
    c.strokeStyle = i % 2 ? "#7ea64c" : "#92b95a"; c.lineWidth = 1.6; c.stroke();
    if (i % 3 === 0) { c.strokeStyle = INK; c.lineWidth = 4.6; c.beginPath(); c.moveTo(tx, ty + 8); c.lineTo(tx + sw * 0.1, ty - 2); c.stroke(); c.strokeStyle = "#6b4a2a"; c.lineWidth = 3; c.stroke(); }
    else { c.fillStyle = "#6f9f45"; c.strokeStyle = INK; c.lineWidth = 0.7; const d = i % 2 ? 1 : -1; c.beginPath(); c.moveTo(bx + sw * 0.4, by - hh * 0.5); c.quadraticCurveTo(bx + d * 9, by - hh * 0.75, bx + d * 14 + sw, by - hh * 0.55); c.quadraticCurveTo(bx + d * 6, by - hh * 0.55, bx + sw * 0.4, by - hh * 0.5); c.fill(); c.stroke(); }
  }
}
export function bush(k, cx, cy, rx, ry, seed, col = "#6a9a45") { canopy(k, cx, cy, rx, ry, seed, col, { br: 0.26 }); }

// =====================================================================================================
// rowing boat with a rower pulling two oars (blade in water on the drive, feathered on the recovery),
// a passenger facing the bow and an optional parasol. Draw inside k.q at the boat's depth.
// =====================================================================================================
import { prism, rot } from "./_props.js";
export function rowBoat(k, u, v, ang, o = {}) {
  const c = k.ctx, t = k.t, sc = o.s ?? 1, bob = Math.sin(t * 1.9 + (o.ph ?? 0)) * 0.012;
  const R = (pts) => rot(u, v, ang, pts.map(([x, y]) => [x * sc, y * sc]));
  const W = (x, y, z) => { const [a, b] = R([[x, y]])[0]; return P(a, b, z + bob); };
  const hull = [[-0.95, 0], [-0.62, -0.31], [0.1, -0.37], [0.62, -0.28], [1.0, 0], [0.62, 0.28], [0.1, 0.37], [-0.62, 0.31]];
  const inner = [[-0.8, 0], [-0.55, -0.24], [0.1, -0.29], [0.55, -0.21], [0.84, 0], [0.55, 0.21], [0.1, 0.29], [-0.55, 0.24]];
  const hc = o.hull || "#b97c45";
  // reflection + shadow on the water
  { const [x, y] = P(u, v, 0); c.save(); c.fillStyle = "rgba(20,70,70,0.28)"; c.beginPath(); c.ellipse(x + 3, y + 7, 46 * sc, 8 * sc, 0, 0, 7); c.fill(); c.restore(); }
  prism(k, R(hull), -0.04 + bob, 0.2 + bob, hc, { topCol: "#e8c58c", right: shade(hc, -0.3), left: shade(hc, -0.06), band: [0.58, 0.8], bandCol: "#f2ead2", lw: 1.4 });
  // interior floor + thwarts
  k.poly(inner.map(([x, y]) => { const [a, b] = R([[x, y]])[0]; return [a, b, 0.17 + bob]; }), "#d9b27a", { lw: 1.1, wobble: 0 });
  for (const x of [-0.45, 0.05, 0.5]) { const y = x === 0.05 ? 0.29 : x < 0 ? 0.25 : 0.2; k.line3([R([[x, -y]])[0], R([[x, y]])[0]].map(([a, b]) => [a, b, 0.2 + bob]), { stroke: "#8d6034", lw: 3, wobble: 0 }); k.line3([R([[x, -y]])[0], R([[x, y]])[0]].map(([a, b]) => [a, b, 0.2 + bob]), { stroke: "#e1c48f", lw: 1.4, wobble: 0 }); }
  // stroke cycle
  const T = o.stroke ?? 2.8, cyc = ((t / T + (o.ph ?? 0) * 0.17) % 1 + 1) % 1; // 0..1
  const drive = cyc < 0.45, q = drive ? cyc / 0.45 : (cyc - 0.45) / 0.55;
  const sweep = drive ? lerp(0.42, -0.42, smooth(q)) : lerp(-0.42, 0.42, smooth(q)); // oar angle fwd(+)/back(-)
  const lift = drive ? 0 : Math.sin(Math.PI * q);
  // rower (faces the stern) and passenger (faces the bow)
  const rowDir = ang + Math.PI, seatZ = 0.2 + bob, rowerPos = R([[0.05, 0]])[0], passPos = R([[-0.5, 0]])[0];
  const oarPts = []; // [side, pivot, handle, blade]
  for (const s of [-1, 1]) {
    const piv = [0.1, s * 0.31], len = 0.8, inb = 0.3;
    const dx = Math.cos(sweep), dy = Math.sin(sweep);
    const outp = [piv[0] + dx * len * 0 + Math.sin(sweep) * len * 0.0 + dy * len * 0.0, 0];
    const blade = [piv[0] + Math.sin(sweep) * len * -1 * 0 - dy * 0 + Math.sin(sweep) * len, s * (0.31 + Math.cos(sweep) * len)];
    const handle = [piv[0] - Math.sin(sweep) * inb, s * (0.31 - Math.cos(sweep) * inb)];
    oarPts.push({ s, piv, blade, handle });
  }
  // blades trail behind: oars sweep about the pivot so "forward" angle moves the blade toward the bow
  // rower body
  const lean = drive ? lerp(0.1, -0.14, smooth(q)) : lerp(-0.14, 0.1, smooth(q));
  const H = o.h ?? 1.0;
  const handsLocal = oarPts.map((op) => { const [a, b] = R([op.handle])[0]; return [a, b]; });
  // far oar first
  const nearSign = (() => { const a = R([[0.1, 0.3]])[0], b = R([[0.1, -0.3]])[0]; return (a[0] + a[1]) > (b[0] + b[1]) ? 1 : -1; })();
  const drawOar = (op) => {
    const [pa, pb] = R([op.piv])[0], [ba, bb] = R([op.blade])[0], [ha, hb] = R([op.handle])[0];
    const z = 0.24 + bob;
    const bz = 0.24 + bob - 0.26 + lift * 0.3;
    c.lineCap = "round";
    const A0 = P(ha, hb, z + 0.14), A1 = P(pa, pb, z), A2 = P(ba, bb, bz);
    c.strokeStyle = INK; c.lineWidth = 3.2; c.beginPath(); c.moveTo(...A0); c.lineTo(...A1); c.lineTo(...A2); c.stroke();
    c.strokeStyle = "#e6cc98"; c.lineWidth = 1.5; c.stroke();
    // blade
    c.save(); c.translate(A2[0], A2[1]); c.rotate(Math.atan2(A2[1] - A1[1], A2[0] - A1[0])); c.fillStyle = "#d8b676"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.ellipse(5, 0, 6.5, 2.4, 0, 0, 7); c.fill(); c.stroke(); c.restore();
    // splash / drip ring where the blade is in the water
    if (!lift) { const [wx, wy] = P(ba, bb, 0); c.save(); c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 1; for (let r = 0; r < 2; r++) { c.globalAlpha = 0.7 - r * 0.3; c.beginPath(); c.ellipse(wx, wy, 5 + r * 4 + q * 3, 2 + r * 1.5, 0, 0, 7); c.stroke(); } c.restore(); }
  };
  for (const op of oarPts) if (op.s !== nearSign) drawOar(op);
  const rowerHands = oarPts.map((op) => [op.handle[0], op.handle[1]]);
  const mkRower = () => {
    const fOf = (x, y) => [x * sc, y * sc];
    // hand targets in the rower's local frame (f along rowDir = -x of boat)
    const hands = oarPts.map((op) => { const hx = -(op.handle[0] - 0.05), hy = -(op.handle[1]); return [hx / H * 0.8, hy / H * 0.8 * 1.0, 0.5 + 0.05 * (drive ? 0 : 1)]; });
    // the person's left (+s) is the boat's right when facing the stern, so swap
    const hl = hands[0], hr = hands[1];
    const skel = buildSkel(H, rowDir, { hip: [0, 0, 0.3], lean: lean * 1.1, sitting: true, shYaw: 0, handYaw: 0, feet: [[0.28, 0.08, 0.02], [0.28, -0.08, 0.02]], hands: [hl, hr] });
    return drawPerson(k, rowerPos[0], rowerPos[1], { pose: "custom", skel, dir: [Math.cos(rowDir), Math.sin(rowDir)], seed: o.seedA, z: seatZ, h: H, shadow: false, style: o.styleA || "shirt", hat: o.hatA ?? null, hatCol: "#e8d9a4", bag: false });
  };
  const mkPass = () => {
    const skel = buildSkel(H * 0.95, ang, { hip: [0, 0, 0.3], lean: 0.02, sitting: true, feet: [[0.28, 0.08, 0.02], [0.28, -0.08, 0.02]], hands: o.parasol ? [[0.1, 0.12, 0.45], [0.06, -0.12, 0.62]] : [[0.12, 0.1, 0.36], [0.12, -0.1, 0.36]] });
    const r = drawPerson(k, passPos[0], passPos[1], { pose: "custom", skel, dir: [Math.cos(ang), Math.sin(ang)], seed: o.seedB, z: seatZ, h: H * 0.95, shadow: false, style: o.styleB || "dress", hat: o.hatB ?? null, bag: false });
    if (o.parasol) {
      const [hx, hy] = r.hand; const bx = hx, by = hy;
      c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(bx, by + 8); c.lineTo(bx, by - 30); c.stroke(); c.strokeStyle = "#8a5a3a"; c.lineWidth = 0.9; c.stroke();
      c.beginPath(); c.moveTo(bx - 24, by - 29); c.quadraticCurveTo(bx, by - 52, bx + 24, by - 29); c.quadraticCurveTo(bx + 12, by - 33, bx, by - 29); c.quadraticCurveTo(bx - 12, by - 33, bx - 24, by - 29); c.closePath();
      c.fillStyle = "#f2ead0"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
      c.strokeStyle = "rgba(160,120,70,0.7)"; c.lineWidth = 0.8; c.beginPath(); for (const dx of [-14, -5, 5, 14]) { c.moveTo(bx, by - 46); c.lineTo(bx + dx, by - 30); } c.stroke();
    }
    return r;
  };
  mkPass(); mkRower();
  for (const op of oarPts) if (op.s === nearSign) drawOar(op);
  // near gunwale redrawn over the sitters' legs
  const near = hull.map(([x, y]) => { const [a, b] = R([[x, y]])[0]; return [a, b, a + b]; });
  const cen = near.reduce((s, p) => s + p[2], 0) / near.length;
  c.save(); c.lineCap = "round"; c.lineJoin = "round";
  for (let i = 0; i < near.length; i++) { const a = near[i], b = near[(i + 1) % near.length]; if ((a[2] + b[2]) / 2 > cen + 0.02) { const pa = P(a[0], a[1], 0.2 + bob), pb = P(b[0], b[1], 0.2 + bob); c.strokeStyle = INK; c.lineWidth = 4.2; c.beginPath(); c.moveTo(...pa); c.lineTo(...pb); c.stroke(); c.strokeStyle = "#ecc994"; c.lineWidth = 2.2; c.stroke(); } }
  c.restore();
}
// boat wake: V lines behind the boat + expanding ripple rings (screen space, z=0)
export function boatWake(k, u, v, ang, sc = 1, ph = 0) {
  const c = k.ctx, t = k.t;
  c.save(); c.lineCap = "round";
  for (let i = 0; i < 5; i++) {
    const back = (0.5 + i * 0.42) * sc, sp = (0.12 + i * 0.12) * sc, a = 0.65 - i * 0.12;
    c.globalAlpha = Math.max(0, a) * (0.8 + 0.2 * Math.sin(t * 2 + i + ph)); c.strokeStyle = "rgba(255,255,255,0.95)"; c.lineWidth = 1.5;
    for (const s of [-1, 1]) {
      const [a0, b0] = rot(u, v, ang, [[-0.55 * sc - back, s * sp]])[0], [a1, b1] = rot(u, v, ang, [[-0.55 * sc - back - 0.36, s * (sp + 0.1)]])[0];
      c.beginPath(); c.moveTo(...P(a0, b0, 0)); c.lineTo(...P(a1, b1, 0)); c.stroke();
    }
  }
  for (let i = 0; i < 3; i++) {
    const f = ((t * 0.28 + i / 3 + ph * 0.13) % 1), [x, y] = P(u, v, 0), r = 24 + f * 52;
    c.globalAlpha = (1 - f) * 0.7; c.strokeStyle = "rgba(255,255,255,0.9)"; c.lineWidth = 1.2; c.beginPath(); c.ellipse(x, y, r * 1.35, r * 0.5, 0, 0, 7); c.stroke();
  }
  c.restore();
}

// =====================================================================================================
// kite: diamond sail with cross spars, bow string to the flyer's hand, long waving ribbon tail
// =====================================================================================================
export function kite(k, hx, hy, kx, ky, ph, col1, col2, size = 1) {
  const c = k.ctx, t = k.t, s = size;
  // string sags then pulls taut
  c.strokeStyle = "rgba(55,45,35,0.9)"; c.lineWidth = 1; c.beginPath(); c.moveTo(hx, hy);
  const mx = (hx + kx) / 2, my = (hy + ky) / 2, sag = 9 + Math.sin(t * 1.3 + ph) * 3;
  c.quadraticCurveTo(mx - 4, my + sag, kx, ky + 14 * s); c.stroke();
  c.save(); c.translate(kx, ky); c.rotate(Math.sin(t * 1.5 + ph) * 0.14 - 0.18);
  const sail = [[0, -17 * s], [12 * s, 0], [0, 21 * s], [-12 * s, 0]];
  c.beginPath(); sail.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fillStyle = col1; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.lineJoin = "round"; c.stroke();
  c.beginPath(); c.moveTo(0, -17 * s); c.lineTo(12 * s, 0); c.lineTo(0, 4 * s); c.lineTo(-12 * s, 0); c.closePath(); c.fillStyle = col2; c.fill(); c.stroke();
  c.fillStyle = "rgba(255,255,255,0.25)"; c.beginPath(); c.moveTo(0, -17 * s); c.lineTo(-12 * s, 0); c.lineTo(0, 4 * s); c.closePath(); c.fill();
  c.strokeStyle = "rgba(40,30,20,0.75)"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(0, -17 * s); c.lineTo(0, 21 * s); c.moveTo(-12 * s, 0); c.lineTo(12 * s, 0); c.stroke();
  // ribbon tail
  const tail = (w, col, off) => { c.strokeStyle = col; c.lineWidth = w; c.lineCap = "round"; c.beginPath(); c.moveTo(0, 21 * s); for (let i = 1; i <= 15; i++) c.lineTo(Math.sin(t * 5.2 - i * 0.62 + ph + off) * (2.5 + i * 0.5) * s, 21 * s + i * 2.5 * s); c.stroke(); };
  tail(3.4, INK, 0); tail(2, col2, 0);
  for (let i = 3; i <= 15; i += 4) { const x = Math.sin(t * 5.2 - i * 0.62 + ph) * (2.5 + i * 0.5) * s, y = 21 * s + i * 2.5 * s; c.fillStyle = i % 8 ? "#f4c542" : "#ffffff"; c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 4, y + 3); c.lineTo(x - 1, y + 6); c.lineTo(x - 5, y + 3); c.closePath(); c.fill(); c.stroke(); }
  c.restore();
}
