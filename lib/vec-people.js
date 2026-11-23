// vec-people — articulated isometric people for vec-kit.
//
// Every joint lives on the iso ground plane (u, v, z) and is projected, so a leg swings ALONG the
// walking direction (correct foreshortening on the diagonal), feet are planted (gait phase is
// distance walked / stride, the stance foot moves back at exactly body speed), the body bobs at
// mid-stance and arms counter-swing. Front view (face) when heading toward the viewer, back view
// (hair) when heading away; mirrored by screen direction.
//
// o = { dir:[du,dv], pose, p (gait cycle 0..1), seed, h (height units), z, outfit fields }
// poses: stand walk sit sitground ride wave paint photo cheer clap lean

import { P, CTS, INK, shade, lerp, clamp, rng, smooth } from "./vec-kit.js";

const SKIN = ["#f3cfae", "#e6b48c", "#cf946b", "#a36c48", "#774b31", "#f6dcc3"];
const HAIR = ["#2b211b", "#4d3524", "#7b5030", "#c99b5c", "#e3c27e", "#1d1b1b", "#9a9a96", "#a6452f"];
const TOPS = ["#d9544b", "#3e6fa8", "#e9c24d", "#5f9d6d", "#f4f0e6", "#e88c3d", "#7b5fa8", "#2f4b6c", "#e581a2", "#4aa5a1", "#c8b48e", "#f2f2ee"];
const BOTTOMS = ["#2f3e5e", "#3c3c3c", "#6c5b45", "#25334b", "#7e8b9a", "#4b3c31", "#c9b48f", "#5a6e8c"];
const SHOES = ["#2a2420", "#5b3b28", "#f2efe6", "#8a2f2a"];

function pick(R, a) { return a[Math.floor(R() * a.length)]; }

// a deterministic outfit from a seed (any field can be overridden)
export function outfit(seed, o = {}) {
  const R = rng(seed * 7 + 3);
  const kid = o.kid ?? false;
  const fem = R() < 0.5;
  const style = o.style || (fem ? pick(R, ["dress", "tee", "stripes", "coat", "skirt", "tee"]) : pick(R, ["tee", "stripes", "coat", "shirt", "tee", "overalls"]));
  return {
    skin: o.skin || pick(R, SKIN),
    hair: o.hair || pick(R, HAIR),
    hairStyle: o.hairStyle || (fem ? pick(R, ["bob", "long", "bun", "long", "short"]) : pick(R, ["short", "short", "bald", "short", "curly"])),
    top: o.top || pick(R, TOPS),
    bottom: o.bottom || pick(R, BOTTOMS),
    shoes: o.shoes || pick(R, SHOES),
    style,
    shorts: o.shorts ?? (!fem && R() < 0.2),
    hat: o.hat !== undefined ? o.hat : (R() < 0.18 ? pick(R, ["beret", "cap", "sunhat"]) : null),
    hatCol: o.hatCol || pick(R, ["#c8403a", "#2f4b6c", "#f1e6c8", "#2a2420", "#e9c24d"]),
    bag: o.bag ?? (R() < 0.25),
    bagCol: o.bagCol || pick(R, ["#8a5a3a", "#2a2420", "#d9544b", "#c8b48e"]),
    kid,
    stripeCol: o.stripeCol || (R() < 0.5 ? "#f4f0e6" : "#2f3e5e"),
  };
}

// project helpers relative to the person's base
function mk(u, v, z0) {
  return (du, dv, z) => P(u + du, v + dv, z0 + z);
}

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

// leg offsets for planted-foot walking. p in [0,1); returns {off (-1..1 along dir), lift (0..1)}
function gaitLeg(p) {
  p = ((p % 1) + 1) % 1;
  if (p < 0.5) return { off: 1 - 4 * p, lift: 0 }; // stance: +1 -> -1 linearly (planted)
  const q = (p - 0.5) / 0.5; // swing: -1 -> +1 eased, foot lifted
  return { off: -1 + 2 * smooth(q), lift: Math.sin(Math.PI * q) };
}

// people are never mistaken for lit windows at night (lib/night.js)
export function drawHuman(k, u, v, o = {}) {
  const c = k.ctx; c.__nl = (c.__nl || 0) + 1;
  try { return drawHumanInner(k, u, v, o); } finally { c.__nl--; }
}
function drawHumanInner(k, u, v, o = {}) {
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
  if (pose === "walk") {
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
  if (pose !== "walk") {
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
  if (pose === "ride" || pose === "sit" || pose === "sitground") { for (const L of legs) drawLeg(L); }
  else { for (const L of far(legs)) drawLeg(L); for (const L of near(legs)) drawLeg(L); }

  // ---- torso ----
  const lean = pose === "ride" ? H * 0.12 : 0;
  const shL = g([su * shW + du * lean, sv * shW + dv * lean, shZ + bob]), shR = g([-su * shW + du * lean, -sv * shW + dv * lean, shZ + bob]);
  const hpL = g([su * hipW * 1.25, sv * hipW * 1.25, hipZ + bob - H * 0.02]), hpR = g([-su * hipW * 1.25, -sv * hipW * 1.25, hipZ + bob - H * 0.02]);
  const ctr = g([du * lean / 2, dv * lean / 2, (shZ + hipZ) / 2 + bob]);
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
  const hc2 = g([du * (H * 0.01 + lean * 1.2), dv * (H * 0.01 + lean * 1.2), headZ + bob + H * 0.02 - (lean ? H * 0.03 : 0)]);
  const neck = g([du * lean, dv * lean, shZ + bob + H * 0.01]);
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

// ---------- smooth paths ----------
// Catmull-Rom spline through points (u,v), arc-length parameterised and cached.
const _cache = new Map();
export function spline(pts, closed = false) {
  const key = JSON.stringify(pts) + closed;
  if (_cache.has(key)) return _cache.get(key);
  // round off corners first (Chaikin, 2 passes) so headings turn in curves
  for (let pass = 0; pass < 2 && pts.length > 2; pass++) {
    const out = closed ? [] : [pts[0]];
    const m = pts.length;
    for (let i = 0; i < (closed ? m : m - 1); i++) {
      const a = pts[i], b = pts[(i + 1) % m];
      out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    if (!closed) out.push(pts[m - 1]);
    pts = out;
  }
  const n = pts.length;
  const at = (i) => closed ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  const segs = closed ? n : n - 1;
  const samples = [];
  const STEPS = 24;
  for (let s = 0; s < segs; s++) {
    const p0 = at(s - 1), p1 = at(s), p2 = at(s + 1), p3 = at(s + 2);
    for (let j = 0; j < STEPS; j++) {
      const t = j / STEPS, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      samples.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  samples.push(closed ? samples[0] : pts[n - 1]);
  const cum = [0];
  for (let i = 1; i < samples.length; i++) cum.push(cum[i - 1] + Math.hypot(samples[i][0] - samples[i - 1][0], samples[i][1] - samples[i - 1][1]));
  const L = cum[cum.length - 1];
  const sample = (d) => {
    d = closed ? ((d % L) + L) % L : clamp(d, 0, L);
    let lo = 0, hi = cum.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= d) lo = m; else hi = m; }
    const f = (d - cum[lo]) / ((cum[hi] - cum[lo]) || 1);
    const a = samples[lo], b = samples[hi];
    // tangent from a ~0.3-unit window so heading turns smoothly
    let i0 = lo, i1 = hi;
    while (i0 > 0 && cum[lo] - cum[i0] < 0.15) i0--;
    while (i1 < samples.length - 1 && cum[i1] - cum[hi] < 0.15) i1++;
    return { u: lerp(a[0], b[0], f), v: lerp(a[1], b[1], f), du: samples[i1][0] - samples[i0][0], dv: samples[i1][1] - samples[i0][1] };
  };
  const out = { L, sample, closed };
  _cache.set(key, out);
  return out;
}

// where is a walker at time t? loop paths walk round; open paths walk, pause, turn, walk back.
export function walkState(path, t, o = {}) {
  const sp = spline(path, o.loop ?? false);
  const speed = o.speed ?? 0.45, dwell = o.dwell ?? 1.6;
  const stride = o.stride ?? 0.27; // one full gait cycle (two steps) in units = 4 x half stride
  if (sp.closed) {
    const d = t * speed + (o.offset ?? 0) * sp.L;
    const s = sp.sample(d);
    return { ...s, p: d / stride, moving: true };
  }
  const walkT = sp.L / speed, period = 2 * (walkT + dwell);
  const tt = (((t + (o.offset ?? 0) * period) % period) + period) % period;
  const ease = (x) => sp.L * lerp(x, smooth(x), Math.min(0.5, 0.6 / sp.L));
  if (tt < walkT) { const d = ease(tt / walkT); const s = sp.sample(d); return { ...s, p: d / stride, moving: true }; }
  if (tt < walkT + dwell) { const s = sp.sample(sp.L); const f = (tt - walkT) / dwell; return { ...s, du: f < 0.5 ? s.du : -s.du, dv: f < 0.5 ? s.dv : -s.dv, p: 0, moving: false }; }
  if (tt < 2 * walkT + dwell) { const d = ease((tt - walkT - dwell) / walkT); const s = sp.sample(sp.L - d); return { ...s, du: -s.du, dv: -s.dv, p: d / stride, moving: true }; }
  const s = sp.sample(0); const f = (tt - 2 * walkT - dwell) / dwell;
  return { ...s, du: f < 0.5 ? -s.du : s.du, dv: f < 0.5 ? -s.dv : s.dv, p: 0, moving: false };
}
