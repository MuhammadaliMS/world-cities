// v5 Living Illustrated Dioramas — Pixel-Space Tile Motion Engine
// Animates INSIDE every single illustrated 1024x1024 diorama tile:
//  1. Masked flowing watercolor water waves & sunlit caustics
//  2. Extracted real hand-drawn sprites (spinning windmill/Ferris wheels, gliding boats/trains/funiculars)
//  3. Style-matched fine-ink animated pedestrians, cyclists, cars, fountains, smoke, petals, kites, flags & sparks

import { PALETTE, clamp, lerp } from "./iso-engine.js";

// Reusable offscreen buffer for masked animated water (zero per-frame allocations!)
let _waterBuf = null;
let _waterCtx = null;
function getWaterBuffer(w, h) {
  const bw = Math.max(64, Math.min(1024, Math.ceil(w)));
  const bh = Math.max(64, Math.min(1024, Math.ceil(h)));
  if (!_waterBuf) {
    _waterBuf = document.createElement("canvas");
    _waterCtx = _waterBuf.getContext("2d");
  }
  if (_waterBuf.width !== bw || _waterBuf.height !== bh) {
    _waterBuf.width = bw;
    _waterBuf.height = bh;
  }
  return [_waterBuf, _waterCtx];
}

// 1. FLOWING WATERCOLOR WATER SHADER (Strictly clipped to exact detected water pixels!)
export function drawAnimatedWater(ctx, waterMaskImg, drawX, drawY, drawW, drawH, flow, t) {
  if (!waterMaskImg) return;
  const [buf, g] = getWaterBuffer(drawW, drawH);
  const bw = buf.width;
  const bh = buf.height;
  const sx = bw / 1024;
  const sy = bh / 1024;
  const [fx, fy] = flow || [-18, 10];

  g.save();
  g.clearRect(0, 0, bw, bh);

  // Flowing sinusoidal watercolor wave streaks + bright sunlit foam crests
  const dx = (t * fx) % 64;
  const dy = (t * fy) % 36;
  const stepX = 36;
  const stepY = 20;

  g.lineCap = "round";
  for (let row = -2; row < Math.ceil(1024 / stepY) + 3; row++) {
    for (let col = -2; col < Math.ceil(1024 / stepX) + 3; col++) {
      const hash = Math.sin(row * 12.9898 + col * 78.233) * 43758.5453;
      const frac = hash - Math.floor(hash);
      const wx = (col * stepX + (row % 2) * 18 + dx + Math.sin(t * 2.2 + row * 0.9) * 6) * sx;
      const wy = (row * stepY + dy + Math.cos(t * 1.9 + col * 0.7) * 2.5) * sy;
      const len = (14 + frac * 18) * sx;
      const amp = (1.6 + frac * 1.6) * sy;
      const shimmer = 0.45 + 0.55 * Math.sin(t * 3.4 + frac * 18.0);

      // Sunlit white/cream watercolor crest
      g.strokeStyle = `rgba(255, 253, 245, ${0.42 * shimmer})`;
      g.lineWidth = Math.max(0.85, 1.55 * sx);
      g.beginPath();
      g.moveTo(wx - len * 0.5, wy);
      g.quadraticCurveTo(wx, wy - amp, wx + len * 0.5, wy + amp * 0.25);
      g.stroke();

      // Subtle deep teal ripple trough underneath
      if (frac > 0.35) {
        g.strokeStyle = `rgba(28, 72, 92, ${0.24 * shimmer})`;
        g.lineWidth = Math.max(0.7, 1.15 * sx);
        g.beginPath();
        g.moveTo(wx - len * 0.35, wy + 3.2 * sy);
        g.quadraticCurveTo(wx + 2 * sx, wy + 3.2 * sy + amp * 0.7, wx + len * 0.45, wy + 3.2 * sy);
        g.stroke();
      }
    }
  }

  // Mask strictly to detected tile water pixels!
  g.globalCompositeOperation = "destination-in";
  g.drawImage(waterMaskImg, 0, 0, bw, bh);
  g.restore();

  ctx.save();
  ctx.drawImage(buf, drawX, drawY, drawW, drawH);
  ctx.restore();
}

// Hand-inked watercolor Moulin Rouge 4-blade crimson lattice windmill sails!
function drawMoulinSails(ctx, cx, cy, R, ang, sc) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(ang);

  for (let b = 0; b < 4; b++) {
    ctx.save();
    ctx.rotate((b * Math.PI) / 2 + Math.PI / 4);
    const len = R * 0.98;
    const w0 = 15 * sc;
    const w1 = 22 * sc;
    const x0 = 16 * sc;

    // Warm cream-parchment translucent sail backing
    ctx.fillStyle = "rgba(250, 243, 224, 0.72)";
    ctx.beginPath();
    ctx.moveTo(x0, -w0);
    ctx.lineTo(len, -w1);
    ctx.lineTo(len, w1);
    ctx.lineTo(x0, w0);
    ctx.closePath();
    ctx.fill();

    // Fine X-lattice wooden struts inside each crimson frame
    const segs = 6;
    ctx.strokeStyle = "#8a3228";
    ctx.lineWidth = Math.max(1.0, 2.2 * sc);
    for (let i = 0; i < segs; i++) {
      const f0 = i / segs, f1 = (i + 1) / segs;
      const xa = lerp(x0, len, f0), xb = lerp(x0, len, f1);
      const wa = lerp(w0, w1, f0), wb = lerp(w0, w1, f1);
      // Cross-bar & X-brace
      ctx.beginPath();
      ctx.moveTo(xa, -wa); ctx.lineTo(xa, wa);
      ctx.moveTo(xa, -wa); ctx.lineTo(xb, wb);
      ctx.moveTo(xa, wa); ctx.lineTo(xb, -wb);
      ctx.stroke();
    }
    // Center spine + outer crimson timber frame + charcoal ink outline
    ctx.strokeStyle = "#b53f32";
    ctx.lineWidth = Math.max(1.8, 4.2 * sc);
    ctx.beginPath();
    ctx.moveTo(x0, 0); ctx.lineTo(len, 0);
    ctx.moveTo(x0, -w0); ctx.lineTo(len, -w1); ctx.lineTo(len, w1); ctx.lineTo(x0, w0); ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = Math.max(0.8, 1.35 * sc);
    ctx.beginPath();
    ctx.moveTo(x0, -w0); ctx.lineTo(len, -w1); ctx.lineTo(len, w1); ctx.lineTo(x0, w0); ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  // Ornate terracotta-and-gold swirling center hub!
  const hr = 18 * sc;
  ctx.fillStyle = "#c85b42";
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = Math.max(0.9, 1.5 * sc);
  ctx.beginPath(); ctx.arc(0, 0, hr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = "#f4dca0";
  ctx.lineWidth = Math.max(0.7, 1.2 * sc);
  ctx.beginPath(); ctx.arc(0, 0, hr * 0.62, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, hr * 0.28, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

// Hand-inked watercolor Giant Observation Wheel (London Eye / Ain Dubai) with 16 UPRIGHT glass pods!
function drawFerrisWheel(ctx, cx, cy, R, ang, sc, opts = {}) {
  const pods = opts.pods || 16;
  const rRim = R * 0.85;
  const rInner = R * 0.74;
  ctx.save();

  // Radial bicycle-wheel tension spokes (rotating!)
  ctx.strokeStyle = "rgba(58, 52, 46, 0.42)";
  ctx.lineWidth = Math.max(0.6, 1.05 * sc);
  for (let i = 0; i < pods * 2; i++) {
    const a = ang + (i / (pods * 2)) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * rRim, cy + Math.sin(a) * rRim);
    ctx.stroke();
  }

  // Zigzag tubular steel truss between inner & outer rims!
  ctx.strokeStyle = "rgba(44, 38, 34, 0.55)";
  ctx.lineWidth = Math.max(0.75, 1.2 * sc);
  const segs = pods * 2;
  ctx.beginPath();
  for (let i = 0; i < segs; i++) {
    const a0 = ang + (i / segs) * Math.PI * 2;
    const a1 = ang + ((i + 0.5) / segs) * Math.PI * 2;
    const a2 = ang + ((i + 1) / segs) * Math.PI * 2;
    ctx.moveTo(cx + Math.cos(a0) * rInner, cy + Math.sin(a0) * rInner);
    ctx.lineTo(cx + Math.cos(a1) * rRim, cy + Math.sin(a1) * rRim);
    ctx.lineTo(cx + Math.cos(a2) * rInner, cy + Math.sin(a2) * rInner);
  }
  ctx.stroke();

  // Outer & inner cream-white structural rims with charcoal ink border
  for (const rr of [rRim, rInner]) {
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = Math.max(2.2, 6.2 * sc);
    ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "#f4efe4";
    ctx.lineWidth = Math.max(1.2, 3.6 * sc);
    ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
  }

  // 16 Glass Passenger Capsules that STAY 100% UPRIGHT as the wheel revolves!
  for (let i = 0; i < pods; i++) {
    const a = ang + (i / pods) * Math.PI * 2;
    const px = cx + Math.cos(a) * (rRim + 12 * sc);
    const py = cy + Math.sin(a) * (rRim + 12 * sc);
    const pw = 17 * sc;
    const ph = 11.5 * sc;
    // Capsule glass shell
    ctx.fillStyle = "#cde3ec";
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = Math.max(0.75, 1.25 * sc);
    ctx.beginPath();
    ctx.ellipse(px, py, pw, ph, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Lower white passenger deck floor + tiny sky reflection highlight
    ctx.fillStyle = "#f4efe4";
    ctx.beginPath();
    ctx.ellipse(px, py + ph * 0.42, pw * 0.82, ph * 0.34, 0, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = Math.max(0.6, 1.2 * sc);
    ctx.beginPath();
    ctx.arc(px - pw * 0.25, py - ph * 0.25, ph * 0.42, Math.PI * 1.1, Math.PI * 1.8);
    ctx.stroke();
    // Vertical glass cabin ribs
    ctx.strokeStyle = "rgba(40,32,26,0.45)";
    ctx.lineWidth = Math.max(0.5, 0.8 * sc);
    ctx.beginPath();
    ctx.moveTo(px - pw * 0.35, py - ph * 0.85); ctx.lineTo(px - pw * 0.35, py + ph * 0.85);
    ctx.moveTo(px + pw * 0.35, py - ph * 0.85); ctx.lineTo(px + pw * 0.35, py + ph * 0.85);
    ctx.stroke();
  }

  // Center axle hub
  ctx.fillStyle = "#ece5d6";
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = Math.max(0.9, 1.5 * sc);
  ctx.beginPath(); ctx.arc(cx, cy, 14 * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}

// 2. ROTATING HERO MECHANISMS (Moulin Rouge sails, London Eye, Ain Dubai!)
export function drawRotators(ctx, rotators, drawX, drawY, imgScale, t) {
  if (!rotators || !rotators.length) return;
  for (const r of rotators) {
    const cx = drawX + r.cx * imgScale;
    const cy = drawY + r.cy * imgScale;
    const rad = r.r * imgScale;
    const ang = t * (r.speed || 0.5);

    if (r.kind === "moulin") {
      drawMoulinSails(ctx, cx, cy, rad, ang, imgScale);
    } else if (r.kind === "ferris") {
      drawFerrisWheel(ctx, cx, cy, rad, ang, imgScale, { pods: r.pods || 16 });
    } else if (r.img) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ang);
      ctx.drawImage(r.img, -rad, -rad, rad * 2, rad * 2);
      ctx.restore();
    }

    // Foreground occluder (e.g. white Ferris wheel A-frame support legs stay cleanly in front!)
    if (r.legsImg) {
      ctx.drawImage(r.legsImg, drawX, drawY, 1024 * imgScale, 1024 * imgScale);
    }
  }
}

// 3. EXTRACTED HAND-DRAWN GLIDING SPRITES (Boats, Barges, Sailboats, Trains, Funicular, Trams!)
export function drawGliders(ctx, sprites, drawX, drawY, imgScale, t) {
  if (!sprites || !sprites.length) return;
  for (const s of sprites) {
    if (!s.img) continue;
    let p;
    if (s.pingpong) {
      p = 0.5 + 0.5 * Math.sin(t * (s.speed || 0.08) * Math.PI * 2 + (s.phase || 0) * Math.PI * 2);
    } else {
      p = (((t * (s.speed || 0.08) + (s.phase || 0)) % 1) + 1) % 1;
    }

    const tx = lerp(s.p0[0], s.p1[0], p);
    const ty = lerp(s.p0[1], s.p1[1], p);
    const bob = s.kind === "boat" ? Math.sin(t * 3.1 + (s.phase || 0) * 11) * 2.0 : 0;
    const sx = drawX + tx * imgScale;
    const sy = drawY + (ty + bob) * imgScale;
    const sw = s.w * imgScale;
    const sh = s.h * imgScale;

    ctx.save();
    if (s.clip && s.clip.length >= 3) {
      ctx.beginPath();
      ctx.moveTo(drawX + s.clip[0][0] * imgScale, drawY + s.clip[0][1] * imgScale);
      for (let i = 1; i < s.clip.length; i++) {
        ctx.lineTo(drawX + s.clip[i][0] * imgScale, drawY + s.clip[i][1] * imgScale);
      }
      ctx.closePath();
      ctx.clip();
    }

    // Animated white V-wake foam ripples trailing behind moving boats!
    if (s.kind === "boat") {
      const vx = s.p1[0] - s.p0[0];
      const vy = s.p1[1] - s.p0[1];
      const vlen = Math.hypot(vx, vy) || 1;
      const ux = (vx / vlen) * (s.pingpong ? Math.cos(t * (s.speed || 0.08) * Math.PI * 2 + (s.phase || 0) * Math.PI * 2) >= 0 ? 1 : -1 : 1);
      const uy = (vy / vlen) * (s.pingpong ? Math.cos(t * (s.speed || 0.08) * Math.PI * 2 + (s.phase || 0) * Math.PI * 2) >= 0 ? 1 : -1 : 1);
      const tailX = sx - ux * sw * 0.42;
      const tailY = sy - uy * sh * 0.25 + sh * 0.24;
      for (let w = 0; w < 3; w++) {
        const wp = (t * 1.4 + w * 0.33) % 1;
        const wx = tailX - ux * wp * 34 * imgScale;
        const wy = tailY - uy * wp * 20 * imgScale;
        ctx.strokeStyle = `rgba(255, 253, 246, ${(1 - wp) * 0.65})`;
        ctx.lineWidth = Math.max(0.8, 1.8 * imgScale);
        ctx.beginPath();
        ctx.ellipse(wx, wy, (6 + wp * 16) * imgScale, (3 + wp * 7) * imgScale, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.drawImage(s.img, sx - sw * 0.5, sy - sh * 0.5, sw, sh);
    ctx.restore();
  }
}

// =========================================================================
// FINE-INK WATERCOLOR MICRO-LIFE HELPERS (Matched 1:1 to 1024px Illustrated Tiles!)
// =========================================================================

const COATS = ["#b84e43", "#4c6f87", "#cfa049", "#698a5f", "#7a5e7d", "#3d4652", "#cf7b66", "#587d76", "#b87a4e"];
const SKINS = ["#f2ccb0", "#e4b690", "#c9956d", "#f5d8be"];
const HAIRS = ["#2c221d", "#5a3c28", "#885d38", "#caa054"];

function drawMiniPerson(ctx, x, y, sc, t, opts = {}) {
  const seed = opts.seed || 1;
  const walk = opts.walk !== false;
  const stride = walk ? Math.sin(t * 7.8 + seed * 1.9) : 0;
  const bob = walk ? Math.abs(stride) * 1.1 * sc : 0;
  const coat = opts.coat || COATS[Math.abs(seed) % COATS.length];
  const skin = SKINS[Math.abs(seed * 3) % SKINS.length];
  const hair = HAIRS[Math.abs(seed * 7) % HAIRS.length];
  const h = 20.0 * sc * (opts.size || 1.0);
  const w = h * 0.28;

  ctx.save();
  // Soft shadow dot under feet
  ctx.fillStyle = "rgba(40, 31, 22, 0.22)";
  ctx.beginPath();
  ctx.ellipse(x, y + h * 0.04, w * 1.15, h * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();

  // Animated striding legs
  ctx.strokeStyle = opts.pants || "#383d46";
  ctx.lineWidth = Math.max(0.9, h * 0.11);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - w * 0.35, y - h * 0.34 - bob);
  ctx.lineTo(x - w * 0.45 - stride * w * 0.7, y);
  ctx.moveTo(x + w * 0.35, y - h * 0.34 - bob);
  ctx.lineTo(x + w * 0.45 + stride * w * 0.7, y);
  ctx.stroke();

  // Watercolor coat / dress
  ctx.fillStyle = coat;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = Math.max(0.55, 0.72 * sc);
  const skirt = opts.dress ? 1.38 : 0.95;
  ctx.beginPath();
  ctx.moveTo(x - w, y - h * 0.74 - bob);
  ctx.lineTo(x + w, y - h * 0.74 - bob);
  ctx.lineTo(x + w * skirt, y - h * 0.3 - bob);
  ctx.lineTo(x - w * skirt, y - h * 0.3 - bob);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Head + hair/hat
  const hr = h * 0.16;
  const hy = y - h * 0.88 - bob;
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(x, hy, hr, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (opts.bearskin) {
    ctx.fillStyle = "#221f1e";
    ctx.beginPath();
    ctx.roundRect(x - hr * 1.1, hy - hr * 2.5, hr * 2.2, hr * 2.3, hr * 0.5);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.arc(x, hy - hr * 0.1, hr * 1.05, Math.PI, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }

  // Optional waving arm / umbrella / bobbing balloon / camera flash!
  if (opts.wave) {
    const wa = Math.sin(t * 7 + seed) * h * 0.14;
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = Math.max(0.65, 0.85 * sc);
    ctx.beginPath();
    ctx.moveTo(x + w, y - h * 0.68 - bob);
    ctx.lineTo(x + w * 2.0, y - h * 0.96 + wa - bob);
    ctx.stroke();
  }
  if (opts.umbrella) {
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = Math.max(0.6, 0.8 * sc);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.7, y - h * 0.65 - bob);
    ctx.lineTo(x + w * 0.7, hy - h * 0.42);
    ctx.stroke();
    ctx.fillStyle = opts.umbrella;
    ctx.beginPath();
    ctx.arc(x + w * 0.4, hy - h * 0.2, h * 0.42, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  if (opts.balloon) {
    const sw = Math.sin(t * 3.1 + seed) * 3.5 * sc;
    const bx = x + w * 1.4 + sw, by = hy - h * 0.75;
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = Math.max(0.45, 0.6 * sc);
    ctx.beginPath();
    ctx.moveTo(x + w, y - h * 0.55 - bob);
    ctx.lineTo(bx, by + h * 0.15);
    ctx.stroke();
    ctx.fillStyle = opts.balloon;
    ctx.beginPath();
    ctx.ellipse(bx, by, h * 0.16, h * 0.21, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  if (opts.flash) {
    const fp = (t * 1.15 + seed) % 3.4;
    if (fp < 0.2) {
      const fr = h * 0.45 * (1 - fp / 0.2);
      ctx.fillStyle = "#fffce6";
      ctx.beginPath();
      ctx.moveTo(x + w - fr, hy); ctx.lineTo(x + w, hy - fr);
      ctx.lineTo(x + w + fr, hy); ctx.lineTo(x + w, hy + fr);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

// Walk N people smoothly along an array of [x0, y0, x1, y1, speed] paths in 1024-tile space!
function drawWalkPaths(ctx, paths, drawX, drawY, sc, t, opts = {}) {
  for (let i = 0; i < paths.length; i++) {
    const [x0, y0, x1, y1, spd = 0.09, extra = {}] = paths[i];
    const raw = (t * spd + i * 0.273) % 2;
    const p = raw <= 1 ? raw : 2 - raw;
    const px = drawX + lerp(x0, x1, p) * sc;
    const py = drawY + lerp(y0, y1, p) * sc;
    drawMiniPerson(ctx, px, py, sc, t, {
      seed: i * 13 + (opts.seedOffset || 1),
      dress: i % 3 === 0,
      size: opts.size || 1.0,
      ...opts,
      ...extra,
    });
  }
}

// Small vintage illustrated car driving along a 1024-tile pixel vector (e.g. Arc de Triomphe, bridges)
function drawMiniCar(ctx, x, y, angle, sc, color, isBus = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const len = (isBus ? 44 : 30) * sc;
  const wid = (isBus ? 18 : 14) * sc;
  // Soft shadow
  ctx.fillStyle = "rgba(38,30,22,0.22)";
  ctx.beginPath();
  ctx.ellipse(1 * sc, 2.5 * sc, len * 0.56, wid * 0.56, 0, 0, Math.PI * 2);
  ctx.fill();
  // Chassis body
  ctx.fillStyle = color;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = Math.max(0.7, 1.0 * sc);
  ctx.beginPath();
  ctx.roundRect(-len * 0.5, -wid * 0.5, len, wid, 3.5 * sc);
  ctx.fill();
  ctx.stroke();
  if (isBus) {
    // Routemaster double-decker roof & pale windows
    ctx.fillStyle = "#f5ecd8";
    ctx.fillRect(-len * 0.44, -wid * 0.12, len * 0.88, wid * 0.22);
    ctx.fillStyle = "#9ac0cf";
    ctx.fillRect(-len * 0.38, -wid * 0.38, len * 0.76, wid * 0.25);
  } else {
    // Windshield & cabin roof
    ctx.fillStyle = "#91b6c8";
    ctx.beginPath();
    ctx.roundRect(-len * 0.24, -wid * 0.4, len * 0.5, wid * 0.8, 2 * sc);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-len * 0.14, -wid * 0.34, len * 0.26, wid * 0.68, 1.5 * sc);
    ctx.fill();
  }
  ctx.restore();
}

// Pulsing arcing white fountain jets + concentric water splash rings!
function drawFountainFX(ctx, drawX, drawY, sc, t, x, y, jets = 6, maxH = 38, spread = 24) {
  const fx = drawX + x * sc;
  const fy = drawY + y * sc;
  ctx.save();
  for (let i = 0; i < jets; i++) {
    const f = jets === 1 ? 0 : (i / (jets - 1)) * 2 - 1;
    const pulse = 0.58 + 0.42 * Math.sin(t * 4.4 + i * 1.15);
    const h = maxH * pulse * sc;
    const tx = fx + f * spread * sc;
    const ty = fy + Math.abs(f) * 4 * sc;
    ctx.strokeStyle = "rgba(255, 254, 248, 0.88)";
    ctx.lineWidth = Math.max(1.0, 2.2 * sc);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.quadraticCurveTo(fx + f * spread * 0.48 * sc, fy - h, tx, ty);
    ctx.stroke();
    ctx.strokeStyle = "rgba(95, 152, 178, 0.48)";
    ctx.lineWidth = Math.max(0.5, 0.85 * sc);
    ctx.stroke();
    // Splash ring
    const rp = (t * 2.2 + i * 0.31) % 1;
    ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - rp) * 0.72})`;
    ctx.lineWidth = Math.max(0.6, 1.1 * sc);
    ctx.beginPath();
    ctx.ellipse(tx, ty, (3 + rp * 11) * sc, (1.5 + rp * 5) * sc, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// Rising soft watercolor smoke / incense / steam puffs!
function drawSmokePuffs(ctx, drawX, drawY, sc, t, x, y, count = 5, rise = 62, col = "#fbf7ee") {
  ctx.save();
  for (let i = 0; i < count; i++) {
    const p = (t * 0.42 + i / count) % 1;
    const px = drawX + (x + Math.sin(p * 6 + i * 2) * 10 + p * 12) * sc;
    const py = drawY + (y - p * rise) * sc;
    const r = (5 + p * 13) * sc;
    ctx.globalAlpha = (1 - p) * 0.58;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Falling drifting pink sakura petals!
function drawSakuraPetals(ctx, drawX, drawY, sc, t, count = 18, seed = 1) {
  ctx.save();
  ctx.fillStyle = "#f9c6d6";
  for (let i = 0; i < count; i++) {
    const h1 = Math.sin(i * 19.3 + seed * 7.1) * 43758.5;
    const r1 = h1 - Math.floor(h1);
    const h2 = Math.sin(i * 41.7 + seed * 3.3) * 19283.7;
    const r2 = h2 - Math.floor(h2);
    const p = (t * (0.16 + r1 * 0.1) + r2) % 1;
    const px = drawX + (140 + r1 * 740 + Math.sin(t * 2.5 + i * 1.7) * 28 + p * 55) * sc;
    const py = drawY + (220 + p * 560) * sc;
    ctx.globalAlpha = Math.sin(p * Math.PI) * 0.85;
    ctx.beginPath();
    ctx.ellipse(px, py, 3.2 * sc, 1.8 * sc, t * 2 + i, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Twinkling golden/warm light sparkles
function drawSparkles(ctx, drawX, drawY, sc, t, pts, col = "#fff2ae") {
  ctx.save();
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    const pulse = Math.max(0, Math.sin(t * 4.5 + i * 1.65));
    if (pulse < 0.25) continue;
    const px = drawX + x * sc;
    const py = drawY + y * sc;
    const r = (4.5 + pulse * 5.5) * sc;
    ctx.globalAlpha = 0.82 * pulse;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(px - r, py); ctx.lineTo(px, py - r);
    ctx.lineTo(px + r, py); ctx.lineTo(px, py + r);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// Flapping bird & soft painterly cloud in 1024-tile pixel space
function drawTileBird(ctx, drawX, drawY, sc, t, cx, cy, rx, ry, speed = 0.85, phase = 0) {
  const bx = drawX + (cx + Math.cos(t * speed + phase) * rx) * sc;
  const by = drawY + (cy + Math.sin(t * speed + phase) * ry) * sc;
  const s = 5.5 * sc;
  const flap = Math.sin(t * 9.5 + phase) * s * 0.85;
  ctx.save();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = Math.max(0.75, 1.15 * sc);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(bx - s, by - flap);
  ctx.lineTo(bx, by);
  ctx.lineTo(bx + s, by - flap);
  ctx.stroke();
  ctx.restore();
}

function drawTileCloud(ctx, drawX, drawY, sc, t, x, y, scale = 1.0, phase = 0) {
  const drift = Math.sin(t * 0.35 + phase) * 52;
  const cx = drawX + (x + drift) * sc;
  const cy = drawY + y * sc;
  const s = 48 * scale * sc;
  ctx.save();
  ctx.globalAlpha = 0.78;
  const puffs = [[-0.85, 0.08, 0.55], [-0.38, -0.15, 0.62], [0.1, -0.22, 0.7], [0.58, -0.06, 0.52], [0.95, 0.1, 0.4]];
  for (const [ox, oy, r] of puffs) {
    const px = cx + ox * s, py = cy + oy * s, pr = r * s;
    const gr = ctx.createRadialGradient(px, py, pr * 0.1, px, py, pr);
    gr.addColorStop(0, "rgba(255, 254, 249, 0.92)");
    gr.addColorStop(0.65, "rgba(252, 249, 240, 0.65)");
    gr.addColorStop(1, "rgba(252, 249, 240, 0)");
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.ellipse(px, py, pr * 1.15, pr * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawWavingFlag(ctx, drawX, drawY, sc, t, x, y, colors, w = 26, h = 16) {
  const fx = drawX + x * sc;
  const fy = drawY + y * sc;
  const wave = Math.sin(t * 5.2 + x) * 3.5 * sc;
  ctx.save();
  for (let i = 0; i < colors.length; i++) {
    const x0 = fx + (w * sc * i) / colors.length;
    const x1 = fx + (w * sc * (i + 1)) / colors.length;
    const w0 = (i / colors.length) * wave;
    const w1 = ((i + 1) / colors.length) * wave;
    ctx.fillStyle = colors[i];
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = Math.max(0.45, 0.6 * sc);
    ctx.beginPath();
    ctx.moveTo(x0, fy + w0);
    ctx.lineTo(x1, fy + w1);
    ctx.lineTo(x1, fy + h * sc + w1);
    ctx.lineTo(x0, fy + h * sc + w0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

// =========================================================================
// EXPRESSIVE STORYTELLING VIGNETTES (Painters, Musicians, Picnics, Cyclists, Dogs, Diners!)
// =========================================================================

// Animated Portrait Painter at wooden easel smoothly waving paintbrush across canvas!
function drawLivePainter(ctx, drawX, drawY, sc, t, x, y, seed = 1) {
  const px = drawX + x * sc, py = drawY + y * sc;
  ctx.save();
  // Tripod easel
  ctx.strokeStyle = "#6c4b30"; ctx.lineWidth = Math.max(0.8, 1.3 * sc);
  ctx.beginPath();
  ctx.moveTo(px + 8 * sc, py); ctx.lineTo(px + 13 * sc, py - 24 * sc);
  ctx.moveTo(px + 18 * sc, py); ctx.lineTo(px + 13 * sc, py - 24 * sc);
  ctx.moveTo(px + 13 * sc, py - 6 * sc); ctx.lineTo(px + 13 * sc, py - 24 * sc);
  ctx.stroke();
  // Mini painted canvas
  ctx.fillStyle = "#faf5e6"; ctx.strokeStyle = PALETTE.ink; ctx.lineWidth = Math.max(0.6, 0.9 * sc);
  ctx.fillRect(px + 7 * sc, py - 22 * sc, 12 * sc, 11 * sc);
  ctx.strokeRect(px + 7 * sc, py - 22 * sc, 12 * sc, 11 * sc);
  ctx.fillStyle = "#7aa8bc"; ctx.fillRect(px + 8.5 * sc, py - 20.5 * sc, 9 * sc, 5 * sc);
  ctx.fillStyle = "#88ab66"; ctx.fillRect(px + 8.5 * sc, py - 15.5 * sc, 9 * sc, 3 * sc);
  ctx.restore();
  // Artist in crimson beret gesturing painting arm!
  drawMiniPerson(ctx, px - 2 * sc, py + 2 * sc, sc, t, { walk: false, wave: true, coat: "#455d78", seed, size: 1.05 });
  ctx.save();
  ctx.fillStyle = "#bc3d36"; ctx.strokeStyle = PALETTE.ink; ctx.lineWidth = Math.max(0.5, 0.7 * sc);
  ctx.beginPath(); ctx.ellipse(px - 2 * sc, py - 16.5 * sc, 4.2 * sc, 1.8 * sc, -0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}

// Animated Street Musician (accordionist/guitarist) with floating musical notes!
function drawLiveMusician(ctx, drawX, drawY, sc, t, x, y, seed = 2) {
  const px = drawX + x * sc, py = drawY + y * sc;
  const sway = Math.sin(t * 4.2 + seed) * 1.6 * sc;
  drawMiniPerson(ctx, px + sway * 0.4, py, sc, t, { walk: false, wave: true, coat: "#9c4b3c", seed, size: 1.08 });
  // Floating tiny musical notes rising upward!
  ctx.save();
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.55 + i * 0.33) % 1;
    const nx = px + (6 + Math.sin(p * 6 + i) * 7 + p * 8) * sc;
    const ny = py - (18 + p * 26) * sc;
    ctx.globalAlpha = Math.sin(p * Math.PI) * 0.85;
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath(); ctx.ellipse(nx, ny, 2.2 * sc, 1.6 * sc, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = PALETTE.ink; ctx.lineWidth = Math.max(0.6, 0.9 * sc);
    ctx.beginPath(); ctx.moveTo(nx + 2 * sc, ny); ctx.lineTo(nx + 2 * sc, ny - 6.5 * sc); ctx.lineTo(nx + 5 * sc, ny - 5 * sc); ctx.stroke();
  }
  ctx.restore();
}

// Animated Checkered Picnic Blanket with seated waving picnickers & basket!
function drawLivePicnic(ctx, drawX, drawY, sc, t, x, y, col = "#d64e46", seed = 3) {
  const px = drawX + x * sc, py = drawY + y * sc;
  ctx.save();
  // Isometric diamond red-and-white checkered blanket!
  ctx.fillStyle = "#faf4e6"; ctx.strokeStyle = PALETTE.ink; ctx.lineWidth = Math.max(0.6, 0.9 * sc);
  ctx.beginPath();
  ctx.moveTo(px, py - 15 * sc); ctx.lineTo(px + 26 * sc, py);
  ctx.lineTo(px, py + 15 * sc); ctx.lineTo(px - 26 * sc, py);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(px - 10 * sc, py - 5 * sc); ctx.lineTo(px + 10 * sc, py + 5 * sc);
  ctx.lineTo(px + 4 * sc, py + 8 * sc); ctx.lineTo(px - 16 * sc, py - 2 * sc);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(px + 10 * sc, py - 5 * sc); ctx.lineTo(px - 10 * sc, py + 5 * sc);
  ctx.lineTo(px - 4 * sc, py + 8 * sc); ctx.lineTo(px + 16 * sc, py - 2 * sc);
  ctx.closePath(); ctx.fill();
  // Picnic basket
  ctx.fillStyle = "#b8844f"; ctx.fillRect(px - 4 * sc, py - 4 * sc, 8 * sc, 5.5 * sc); ctx.strokeRect(px - 4 * sc, py - 4 * sc, 8 * sc, 5.5 * sc);
  ctx.restore();
  // Two lively seated picnickers waving & conversing!
  drawMiniPerson(ctx, px - 12 * sc, py + 4 * sc, sc, t, { walk: false, wave: true, coat: "#4c728c", seed: seed * 5, size: 0.92 });
  drawMiniPerson(ctx, px + 11 * sc, py + 5 * sc, sc, t, { walk: false, wave: Math.sin(t + seed) > 0, dress: true, coat: "#e0a84c", seed: seed * 9, size: 0.92 });
}

// Animated Cyclist pedaling smoothly between p0 and p1!
function drawTileCyclist(ctx, drawX, drawY, sc, t, x0, y0, x1, y1, spd = 0.11, seed = 4) {
  const raw = (t * spd + seed * 0.21) % 2;
  const p = raw <= 1 ? raw : 2 - raw;
  const dir = raw <= 1 ? 1 : -1;
  const px = drawX + lerp(x0, x1, p) * sc;
  const py = drawY + lerp(y0, y1, p) * sc;
  ctx.save();
  ctx.strokeStyle = PALETTE.ink; ctx.lineWidth = Math.max(0.75, 1.15 * sc);
  ctx.beginPath(); ctx.arc(px - 6 * sc, py - 3.5 * sc, 4 * sc, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(px + 6 * sc, py - 3.5 * sc, 4 * sc, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "#c84c40"; ctx.lineWidth = Math.max(0.8, 1.2 * sc);
  ctx.beginPath();
  ctx.moveTo(px - 6 * sc, py - 3.5 * sc); ctx.lineTo(px, py - 9 * sc); ctx.lineTo(px + 6 * sc, py - 3.5 * sc);
  ctx.stroke();
  ctx.restore();
  drawMiniPerson(ctx, px, py - 4 * sc, sc, t, { walk: false, coat: COATS[seed % COATS.length], seed, size: 0.94 });
}

// Animated Dog Walker with wagging leaping pup!
function drawTileDogWalker(ctx, drawX, drawY, sc, t, x0, y0, x1, y1, spd = 0.08, seed = 7) {
  const raw = (t * spd + seed * 0.17) % 2;
  const p = raw <= 1 ? raw : 2 - raw;
  const px = drawX + lerp(x0, x1, p) * sc;
  const py = drawY + lerp(y0, y1, p) * sc;
  drawMiniPerson(ctx, px, py, sc, t, { walk: true, coat: "#c9624e", dress: true, seed, size: 1.0 });
  const hop = Math.abs(Math.sin(t * 10 + seed)) * 2.5 * sc;
  const dx = px + 11 * sc, dy = py + 2 * sc - hop;
  ctx.save();
  ctx.strokeStyle = "rgba(40,32,26,0.55)"; ctx.lineWidth = Math.max(0.5, 0.7 * sc);
  ctx.beginPath(); ctx.moveTo(px + 3 * sc, py - 8 * sc); ctx.lineTo(dx - 2 * sc, dy - 3 * sc); ctx.stroke();
  ctx.fillStyle = "#b87e4c"; ctx.strokeStyle = PALETTE.ink; ctx.lineWidth = Math.max(0.55, 0.75 * sc);
  ctx.beginPath(); ctx.ellipse(dx, dy - 3 * sc, 4.5 * sc, 2.5 * sc, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(dx + 3.8 * sc, dy - 5 * sc, 2.2 * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}

// Animated Seated Café Diners conversing & gesturing at outdoor bistro tables!
function drawCafeDiners(ctx, drawX, drawY, sc, t, spots) {
  for (let i = 0; i < spots.length; i++) {
    const [x, y] = spots[i];
    const px = drawX + x * sc, py = drawY + y * sc;
    const talk = Math.sin(t * 2.8 + i * 2.1) > 0.25;
    drawMiniPerson(ctx, px - 7 * sc, py, sc, t, { walk: false, wave: talk, seed: 800 + i * 3, size: 0.92 });
    drawMiniPerson(ctx, px + 7 * sc, py + 1 * sc, sc, t, { walk: false, wave: !talk, dress: i % 2 === 0, seed: 810 + i * 5, size: 0.92 });
  }
}

// =========================================================================
// PER-CITY, PER-TILE LIVING MOTION CHOREOGRAPHY (ALL 45 TILES — 100% LIVE CAST!)
// =========================================================================
export function drawTileLivingFX(ctx, cityId, key, drawX, drawY, sc, t) {
  // ============================== PARIS ==============================
  if (cityId === "paris") {
    if (key === "0,0") {
      // Climbing glass elevators on BOTH curved Eiffel Tower legs!
      const elP = 0.5 + 0.5 * Math.sin(t * 0.85);
      const ex1 = drawX + lerp(392, 466, elP) * sc, ey1 = drawY + lerp(595, 452, elP) * sc;
      const ex2 = drawX + lerp(615, 545, 1 - elP) * sc, ey2 = drawY + lerp(592, 452, 1 - elP) * sc;
      ctx.save();
      ctx.fillStyle = "#b5dce8"; ctx.strokeStyle = PALETTE.ink; ctx.lineWidth = Math.max(0.6, 0.9 * sc);
      ctx.fillRect(ex1 - 4.5 * sc, ey1 - 5.5 * sc, 9 * sc, 11 * sc); ctx.strokeRect(ex1 - 4.5 * sc, ey1 - 5.5 * sc, 9 * sc, 11 * sc);
      ctx.fillRect(ex2 - 4.5 * sc, ey2 - 5.5 * sc, 9 * sc, 11 * sc); ctx.strokeRect(ex2 - 4.5 * sc, ey2 - 5.5 * sc, 9 * sc, 11 * sc);
      ctx.restore();
      drawSparkles(ctx, drawX, drawY, sc, t, [[504, 72], [502, 165], [492, 265], [516, 335], [475, 430], [538, 435], [420, 565], [588, 565]]);
      // Rich 100% LIVE Champ de Mars storytelling cast (picnics, painters, cyclists, dog walker, balloon kids, strollers!)
      drawLivePicnic(ctx, drawX, drawY, sc, t, 245, 675, "#d64e46", 1);
      drawLivePicnic(ctx, drawX, drawY, sc, t, 425, 785, "#4e7c96", 2);
      drawLivePainter(ctx, drawX, drawY, sc, t, 262, 588, 3);
      drawLivePainter(ctx, drawX, drawY, sc, t, 298, 728, 4);
      drawTileCyclist(ctx, drawX, drawY, sc, t, 335, 685, 645, 575, 0.11, 5);
      drawTileCyclist(ctx, drawX, drawY, sc, t, 680, 525, 525, 665, 0.095, 6);
      drawTileDogWalker(ctx, drawX, drawY, sc, t, 555, 715, 735, 625, 0.085, 7);
      drawWalkPaths(ctx, [
        [295, 575, 445, 655, 0.085, { balloon: "#d84840" }],
        [455, 680, 625, 605, 0.09, { flash: true }],
        [565, 695, 760, 620, 0.08, { wave: true }],
        [635, 535, 775, 625, 0.095, { balloon: "#e8b448" }],
        [335, 745, 515, 835, 0.075],
        [495, 745, 660, 665, 0.085],
        [330, 520, 460, 585, 0.07],
        [545, 570, 675, 645, 0.08],
        [405, 695, 465, 665, 0.1, { balloon: "#d84840", size: 0.85 }],
        [715, 635, 785, 665, 0.09, { balloon: "#d84840", size: 0.85 }],
      ], drawX, drawY, sc, t, { size: 1.05, seedOffset: 11 });
      drawTileBird(ctx, drawX, drawY, sc, t, 340, 250, 65, 32, 0.9, 0.2);
      drawTileBird(ctx, drawX, drawY, sc, t, 375, 225, 55, 28, 0.9, 1.1);
      drawTileCloud(ctx, drawX, drawY, sc, t, 385, 195, 1.05, 0.4);
    } else if (key === "-1,-1") {
      // Louvre: 4 pulsing fountains + live sketching artists + dense live Cour Napoléon crowd!
      drawFountainFX(ctx, drawX, drawY, sc, t, 286, 558, 5, 34, 18);
      drawFountainFX(ctx, drawX, drawY, sc, t, 502, 445, 5, 38, 22);
      drawFountainFX(ctx, drawX, drawY, sc, t, 738, 588, 5, 38, 22);
      drawFountainFX(ctx, drawX, drawY, sc, t, 560, 712, 5, 34, 18);
      drawLivePainter(ctx, drawX, drawY, sc, t, 462, 792, 12);
      drawWalkPaths(ctx, [
        [205, 615, 445, 760, 0.078],
        [285, 605, 475, 715, 0.082, { flash: true }],
        [345, 635, 485, 725, 0.068, { wave: true }],
        [410, 655, 475, 755, 0.062],
        [555, 775, 795, 645, 0.075],
        [615, 735, 835, 615, 0.08, { flash: true }],
        [670, 505, 815, 585, 0.08],
        [245, 575, 395, 665, 0.072],
        [325, 685, 515, 805, 0.07],
        [525, 815, 695, 725, 0.078],
      ], drawX, drawY, sc, t, { size: 0.96, seedOffset: 23 });
      drawTileBird(ctx, drawX, drawY, sc, t, 460, 310, 70, 28, 1.0, 0.7);
      drawTileBird(ctx, drawX, drawY, sc, t, 535, 355, 55, 22, 1.1, 2.1);
    } else if (key === "0,-1") {
      // Notre-Dame & Seine: dense live bouquiniste browsers, bridge walkers & cathedral visitors!
      drawWalkPaths(ctx, [
        [215, 555, 435, 665, 0.075],
        [265, 535, 455, 625, 0.068, { flash: true }],
        [465, 630, 695, 505, 0.08],
        [520, 665, 765, 535, 0.075, { wave: true }],
        [315, 515, 465, 595, 0.07],
        [505, 625, 635, 695, 0.085], // crossing Pont au Double!
        [485, 615, 615, 685, 0.072],
        [595, 575, 785, 475, 0.068],
      ], drawX, drawY, sc, t, { size: 0.95, seedOffset: 31 });
      drawTileBird(ctx, drawX, drawY, sc, t, 465, 220, 75, 32, 0.95, 1.3);
      drawTileBird(ctx, drawX, drawY, sc, t, 520, 195, 65, 28, 0.95, 2.4);
    } else if (key === "1,-1") {
      // Montmartre & Place du Tertre: live painters, accordionist with notes, café diners & staircase walkers!
      drawLivePainter(ctx, drawX, drawY, sc, t, 265, 705, 41);
      drawLiveMusician(ctx, drawX, drawY, sc, t, 328, 692, 42);
      drawCafeDiners(ctx, drawX, drawY, sc, t, [[192, 668], [225, 685], [468, 835]]);
      drawWalkPaths(ctx, [
        [225, 655, 420, 760, 0.08],
        [280, 695, 455, 790, 0.075, { wave: true }],
        [315, 595, 435, 665, 0.07],
        [335, 475, 425, 575, 0.065], // walking down Montmartre stairs!
        [455, 435, 615, 415, 0.065, { flash: true }],
        [635, 675, 765, 570, 0.07],
      ], drawX, drawY, sc, t, { size: 0.95, seedOffset: 41 });
      drawSmokePuffs(ctx, drawX, drawY, sc, t, 200, 410, 3, 45);
      drawTileCloud(ctx, drawX, drawY, sc, t, 645, 200, 0.95, 1.5);
    } else if (key === "1,0") {
      // Arc de Triomphe: 8 animated vintage Parisian cars smoothly circling strictly on the cobblestone ring!
      const rx = 258, ry = 132, rcx = 515, rcy = 562;
      const carCols = ["#466882", "#c85648", "#e5d5a8", "#3e4650", "#769470", "#d47a58", "#587892", "#e8dfc8"];
      for (let i = 0; i < 8; i++) {
        const a = t * 0.42 + (i / 8) * Math.PI * 2;
        const cy_car = rcy + Math.sin(a) * ry;
        const cx_car = rcx + Math.cos(a) * rx;
        if (cy_car < 490 && cx_car > 350 && cx_car < 670) continue;
        const dx = -Math.sin(a) * rx, dy = Math.cos(a) * ry;
        const ang = Math.atan2(dy, dx);
        drawMiniCar(ctx, drawX + cx_car * sc, drawY + cy_car * sc, ang, sc * 0.92, carCols[i], false);
      }
      const fl = 0.65 + 0.35 * Math.sin(t * 9.5);
      ctx.save();
      const gr = ctx.createRadialGradient(drawX + 510 * sc, drawY + 532 * sc, 0, drawX + 510 * sc, drawY + 532 * sc, 18 * sc * fl);
      gr.addColorStop(0, "rgba(255, 230, 120, 0.85)");
      gr.addColorStop(1, "rgba(255, 145, 45, 0)");
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(drawX + 510 * sc, drawY + 532 * sc, 18 * sc * fl, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      drawWavingFlag(ctx, drawX, drawY, sc, t, 512, 468, ["#2d4f8c", "#f7f3ea", "#c83c36"], 22, 16);
      drawWalkPaths(ctx, [
        [345, 595, 485, 650, 0.08],
        [535, 635, 665, 565, 0.085, { flash: true }],
        [425, 635, 595, 615, 0.07],
        [455, 595, 565, 585, 0.075, { wave: true }],
      ], drawX, drawY, sc, t, { size: 0.92, seedOffset: 51 });
    } else if (key === "1,1") {
      // Moulin Rouge: twinkling bulbs + live street guitarist with floating notes + lively café diners + crowd!
      drawSparkles(ctx, drawX, drawY, sc, t, [
        [402, 518], [435, 540], [472, 554], [510, 558], [548, 550], [585, 535], [612, 512],
      ], "#ffe88a");
      drawSmokePuffs(ctx, drawX, drawY, sc, t, 285, 128, 3, 42);
      drawSmokePuffs(ctx, drawX, drawY, sc, t, 735, 138, 3, 42);
      drawLiveMusician(ctx, drawX, drawY, sc, t, 615, 705, 61);
      drawCafeDiners(ctx, drawX, drawY, sc, t, [[665, 682], [705, 668], [785, 675]]);
      drawWalkPaths(ctx, [
        [315, 695, 515, 795, 0.08],
        [525, 790, 715, 680, 0.085, { wave: true }],
        [435, 645, 585, 695, 0.075, { flash: true }],
        [375, 745, 635, 745, 0.07],
        [455, 675, 545, 655, 0.072],
        [245, 665, 385, 735, 0.075],
      ], drawX, drawY, sc, t, { size: 1.0, seedOffset: 61 });
    } else if (key === "0,1") {
      // Palais Garnier: dense well-dressed theatergoers + Metro commuters + café diners + warm lamps!
      drawSparkles(ctx, drawX, drawY, sc, t, [[208, 610], [385, 705], [510, 215], [312, 295], [600, 412]], "#ffea98");
      drawCafeDiners(ctx, drawX, drawY, sc, t, [[665, 672], [715, 652]]);
      drawWalkPaths(ctx, [
        [215, 635, 445, 775, 0.08],
        [275, 585, 485, 705, 0.075],
        [355, 695, 565, 815, 0.085, { wave: true }],
        [485, 765, 695, 675, 0.07],
        [315, 645, 495, 745, 0.075, { flash: true }],
        [355, 565, 485, 645, 0.068], // walking up grand marble stairs!
        [185, 625, 335, 715, 0.072],
        [525, 785, 665, 715, 0.08],
      ], drawX, drawY, sc, t, { size: 0.96, seedOffset: 71 });
      drawTileBird(ctx, drawX, drawY, sc, t, 640, 260, 60, 25, 0.85, 0.5);
    } else if (key === "-1,1") {
      // Luxembourg Gardens: lively kids standing cleanly on the stone pond rim guiding the gliding sailboats!
      for (const [kx, ky, dx, s] of [[278, 565, 24, 81], [318, 672, 22, 82], [478, 722, 12, 83], [712, 650, -24, 84]]) {
        const px = drawX + kx * sc, py = drawY + ky * sc;
        const push = Math.sin(t * 2.5 + s) * 6 * sc;
        drawMiniPerson(ctx, px, py, sc, t, { walk: false, wave: true, seed: s, size: 0.9 });
        ctx.save();
        ctx.strokeStyle = "#8a623c"; ctx.lineWidth = Math.max(0.7, 1.1 * sc);
        ctx.beginPath(); ctx.moveTo(px, py - 10 * sc); ctx.lineTo(px + dx * sc + push, py - 2 * sc); ctx.stroke();
        ctx.restore();
      }
      drawWalkPaths(ctx, [
        [215, 565, 355, 488, 0.075],
        [310, 725, 515, 795, 0.08, { wave: true }],
        [535, 785, 725, 685, 0.075],
        [675, 495, 795, 575, 0.08],
        [385, 480, 625, 480, 0.07, { flash: true }],
        [245, 635, 425, 745, 0.072],
        [585, 735, 755, 645, 0.078],
      ], drawX, drawY, sc, t, { size: 0.96, seedOffset: 81 });
      drawTileBird(ctx, drawX, drawY, sc, t, 505, 290, 85, 32, 0.8, 1.1);
    } else if (key === "-1,0") {
      // Canal Saint-Martin: splashing lock waterfall + sunlit quay picnic + arched footbridge walkers + cyclists!
      drawFountainFX(ctx, drawX, drawY, sc, t, 295, 755, 5, 18, 22);
      drawLivePicnic(ctx, drawX, drawY, sc, t, 562, 818, "#d85048", 91);
      drawCafeDiners(ctx, drawX, drawY, sc, t, [[168, 555], [345, 455], [815, 588]]);
      drawTileCyclist(ctx, drawX, drawY, sc, t, 155, 625, 385, 495, 0.1, 92);
      // Walkers following the TRUE curved arch deck of BOTH Venetian iron footbridges (never dipping onto water!)
      for (let i = 0; i < 3; i++) {
        const raw = (t * (0.085 + i * 0.012) + i * 0.65) % 2;
        const p = raw <= 1 ? raw : 2 - raw;
        const bx = drawX + lerp(300, 562, p) * sc;
        const by = drawY + (lerp(572, 608, p) - Math.sin(p * Math.PI) * 56) * sc;
        drawMiniPerson(ctx, bx, by, sc, t, { seed: 910 + i, size: 0.94, dress: i % 2 === 0 });
      }
      for (let i = 0; i < 2; i++) {
        const raw = (t * (0.09 + i * 0.015) + i * 0.8) % 2;
        const p = raw <= 1 ? raw : 2 - raw;
        const bx = drawX + lerp(682, 822, p) * sc;
        const by = drawY + (lerp(312, 342, p) - Math.sin(p * Math.PI) * 26) * sc;
        drawMiniPerson(ctx, bx, by, sc, t, { seed: 920 + i, size: 0.88 });
      }
      drawWalkPaths(ctx, [
        [185, 635, 445, 465, 0.075],
        [565, 755, 785, 595, 0.08, { flash: true }],
        [625, 705, 825, 565, 0.072],
      ], drawX, drawY, sc, t, { size: 0.96, seedOffset: 91 });
      drawSmokePuffs(ctx, drawX, drawY, sc, t, 235, 210, 3, 40);
    }
    return;
  }

  // ============================== TOKYO ==============================
  if (cityId === "tokyo") {
    if (key === "0,0") {
      // Senso-ji: billowing incense smoke + swaying Kaminarimon lantern glow + falling sakura + kimono crowd!
      drawSmokePuffs(ctx, drawX, drawY, sc, t, 508, 540, 7, 78, "#f8f4e8");
      drawSakuraPetals(ctx, drawX, drawY, sc, t, 18, 1);
      drawWalkPaths(ctx, [
        [435, 655, 575, 655, 0.08, { wave: true }],
        [465, 595, 555, 725, 0.085],
        [395, 525, 595, 525, 0.075, { flash: true }],
        [485, 775, 545, 855, 0.08],
        [315, 615, 435, 675, 0.07],
        [585, 645, 695, 585, 0.07],
      ], drawX, drawY, sc, t, { size: 0.95, seedOffset: 101 });
      drawTileCloud(ctx, drawX, drawY, sc, t, 315, 175, 0.95, 0.2);
    } else if (key === "-1,-1") {
      // Shibuya Scramble: 22 lively Tokyo pedestrians & umbrella carriers surging diagonally across crosswalk!
      const scramble = [];
      for (let i = 0; i < 20; i++) {
        const diag = i % 2 === 0;
        const off = ((i % 5) - 2) * 36;
        const p0 = diag ? [330 + off, 520 + off * 0.5] : [690 + off * 0.6, 515 - off * 0.4];
        const p1 = diag ? [680 + off, 675 + off * 0.5] : [335 + off * 0.6, 680 - off * 0.4];
        scramble.push([p0[0], p0[1], p1[0], p1[1], 0.11 + (i % 4) * 0.02, {
          umbrella: i % 5 === 0 ? ["#d64b42", "#e8b648", "#5084a3"][i % 3] : null,
        }]);
      }
      drawWalkPaths(ctx, scramble, drawX, drawY, sc, t, { size: 0.92, seedOffset: 111 });
    } else if (key === "0,-1") {
      // Tokyo Tower: blinking red aviation beacon + climbing glass elevator + falling sakura + strollers!
      const blink = Math.sin(t * 5.2) > 0;
      ctx.save();
      ctx.fillStyle = blink ? "#ff5242" : "#a8382c";
      ctx.beginPath(); ctx.arc(drawX + 514 * sc, drawY + 75 * sc, (blink ? 6.5 : 3.5) * sc, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      const elP = 0.5 + 0.5 * Math.sin(t * 0.95);
      ctx.save();
      ctx.fillStyle = "#b5dce8"; ctx.strokeStyle = PALETTE.ink; ctx.lineWidth = Math.max(0.6, 0.85 * sc);
      ctx.fillRect(drawX + 508 * sc, drawY + lerp(555, 365, elP) * sc, 10 * sc, 12 * sc);
      ctx.strokeRect(drawX + 508 * sc, drawY + lerp(555, 365, elP) * sc, 10 * sc, 12 * sc);
      ctx.restore();
      drawSakuraPetals(ctx, drawX, drawY, sc, t, 18, 2);
      drawWalkPaths(ctx, [
        [365, 725, 595, 795, 0.08],
        [525, 695, 715, 635, 0.075, { flash: true }],
        [435, 785, 625, 705, 0.085],
      ], drawX, drawY, sc, t, { size: 0.95, seedOffset: 121 });
    } else if (key === "1,-1") {
      // Shinkansen & Mt. Fuji: drifting Fuji cloud + falling sakura + swimming koi fish in garden pond!
      drawTileCloud(ctx, drawX, drawY, sc, t, 465, 195, 1.0, 0.7);
      drawSakuraPetals(ctx, drawX, drawY, sc, t, 16, 3);
      // Swimming orange & white koi fish in pond
      for (let i = 0; i < 4; i++) {
        const a = t * 1.1 + i * 1.6;
        const kx = drawX + (605 + Math.cos(a) * 42) * sc;
        const ky = drawY + (785 + Math.sin(a) * 20) * sc;
        ctx.save();
        ctx.fillStyle = i % 2 === 0 ? "#e66f35" : "#faf5e8";
        ctx.beginPath(); ctx.ellipse(kx, ky, 4.5 * sc, 2.2 * sc, a + 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    } else if (key === "1,0") {
      // Shinjuku & Godzilla: roaring Godzilla steam puffs + pulsing warm izakaya lanterns + busy alley!
      drawSmokePuffs(ctx, drawX, drawY, sc, t, 415, 385, 5, 55, "#e8f4fa");
      drawSparkles(ctx, drawX, drawY, sc, t, [[340, 680], [445, 635], [535, 650], [645, 680], [720, 665]], "#ffbb58");
      drawWalkPaths(ctx, [
        [335, 735, 535, 835, 0.085],
        [485, 765, 695, 665, 0.09],
        [425, 695, 585, 775, 0.08, { wave: true }],
        [525, 645, 655, 715, 0.075],
      ], drawX, drawY, sc, t, { size: 0.95, seedOffset: 141 });
    } else if (key === "1,1") {
      // Odaiba: cars driving across Rainbow Bridge + gulls + tourists around Gundam!
      for (let i = 0; i < 3; i++) {
        const p = (t * 0.16 + i * 0.34) % 1;
        const cx = drawX + lerp(245, 815, p) * sc;
        const cy = drawY + lerp(395, 495, p) * sc;
        drawMiniCar(ctx, cx, cy, 0.17, sc * 0.72, ["#c84e42", "#e8e0cc", "#4c7894"][i], false);
      }
      drawTileBird(ctx, drawX, drawY, sc, t, 480, 310, 85, 35, 1.0, 0.4);
      drawWalkPaths(ctx, [
        [245, 655, 495, 785, 0.08],
        [465, 775, 685, 685, 0.085, { flash: true }],
        [345, 715, 575, 825, 0.075],
      ], drawX, drawY, sc, t, { size: 0.95, seedOffset: 151 });
    } else if (key === "0,1") {
      // Ueno Park: falling cherry blossom petals + strollers across red bridge & paths!
      drawSakuraPetals(ctx, drawX, drawY, sc, t, 22, 5);
      drawWalkPaths(ctx, [
        [555, 565, 695, 635, 0.085], // crossing wooden bridge to Bentendo!
        [355, 755, 565, 845, 0.075],
        [635, 715, 775, 615, 0.08],
      ], drawX, drawY, sc, t, { size: 0.92, seedOffset: 161 });
    } else if (key === "-1,1") {
      // Meiji Jingu: serene shrine visitors walking through giant wooden Torii gate!
      drawWalkPaths(ctx, [
        [475, 815, 525, 565, 0.065],
        [535, 795, 485, 545, 0.06],
        [445, 745, 555, 685, 0.055],
      ], drawX, drawY, sc, t, { size: 0.95, seedOffset: 171 });
      drawSmokePuffs(ctx, drawX, drawY, sc, t, 520, 445, 3, 45, "#f7f3e8");
    } else if (key === "-1,0") {
      // Akihabara: animated Yamanote train shimmer + pulsing neon panels + bustling shoppers!
      drawSparkles(ctx, drawX, drawY, sc, t, [[465, 295], [685, 365], [195, 535], [535, 585]], "#84e2f5");
      drawWalkPaths(ctx, [
        [315, 675, 565, 815, 0.09],
        [445, 745, 685, 645, 0.085],
        [515, 665, 725, 775, 0.095],
        [275, 625, 465, 725, 0.08],
      ], drawX, drawY, sc, t, { size: 0.95, seedOffset: 181 });
    }
    return;
  }

  // ============================== DUBAI ==============================
  if (cityId === "dubai") {
    if (key === "0,0") {
      // Burj Khalifa & Dubai Fountain: Choreographed 10-jet dancing Dubai Fountain + cascading spire sparkles!
      drawFountainFX(ctx, drawX, drawY, sc, t, 420, 670, 5, 56, 36);
      drawFountainFX(ctx, drawX, drawY, sc, t, 512, 652, 7, 74, 52);
      drawFountainFX(ctx, drawX, drawY, sc, t, 608, 672, 5, 56, 36);
      drawSparkles(ctx, drawX, drawY, sc, t, [[504, 88], [504, 168], [502, 245], [492, 335], [516, 405], [495, 475]], "#eef9ff");
      drawTileCloud(ctx, drawX, drawY, sc, t, 370, 210, 1.0, 0.3);
      drawWalkPaths(ctx, [
        [325, 745, 515, 845, 0.08],
        [515, 845, 715, 735, 0.085, { flash: true }],
        [435, 755, 615, 755, 0.075],
      ], drawX, drawY, sc, t, { size: 0.92, seedOffset: 201 });
    } else if (key === "-1,-1") {
      // Burj Al Arab: cars driving across causeway bridge + beach strollers + gulls!
      for (let i = 0; i < 2; i++) {
        const p = (t * 0.14 + i * 0.5) % 1;
        const cx = drawX + lerp(320, 555, p) * sc;
        const cy = drawY + lerp(668, 558, p) * sc;
        drawMiniCar(ctx, cx, cy, -0.44, sc * 0.78, ["#c94c42", "#faf4e6"][i], false);
      }
      drawWalkPaths(ctx, [
        [425, 735, 665, 645, 0.075],
        [485, 795, 715, 685, 0.08],
      ], drawX, drawY, sc, t, { size: 0.9, seedOffset: 211 });
      drawTileBird(ctx, drawX, drawY, sc, t, 355, 290, 75, 30, 0.9, 0.6);
    } else if (key === "0,-1") {
      // Palm Jumeirah: monorail gliding up/down central spine + sailboats in frond lagoons!
      const mp = 0.5 + 0.5 * Math.sin(t * 0.55);
      const my = drawY + lerp(415, 765, mp) * sc;
      ctx.save();
      ctx.fillStyle = "#faf6ee"; ctx.strokeStyle = PALETTE.ink; ctx.lineWidth = Math.max(0.6, 0.85 * sc);
      ctx.beginPath(); ctx.roundRect(drawX + 498 * sc, my - 18 * sc, 12 * sc, 36 * sc, 4 * sc); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#4890b0"; ctx.fillRect(drawX + 501 * sc, my - 12 * sc, 6 * sc, 24 * sc);
      ctx.restore();
      drawTileBird(ctx, drawX, drawY, sc, t, 515, 290, 95, 32, 0.85, 0.9);
    } else if (key === "1,-1") {
      // Museum of the Future: glistening silver torus highlights + strolling plaza visitors!
      drawSparkles(ctx, drawX, drawY, sc, t, [[345, 295], [485, 240], [635, 290], [545, 420], [395, 435]], "#f2fbff");
      drawWalkPaths(ctx, [
        [245, 645, 485, 775, 0.08],
        [525, 755, 745, 645, 0.085, { flash: true }],
      ], drawX, drawY, sc, t, { size: 0.92, seedOffset: 231 });
    } else if (key === "1,0") {
      // Dubai Frame: pulsing Zabeel Park fountain + visitors walking across glass skybridge + park strollers!
      drawFountainFX(ctx, drawX, drawY, sc, t, 510, 728, 6, 36, 24);
      drawWalkPaths(ctx, [
        [375, 252, 655, 198, 0.075, { size: 0.65 }], // skybridge walkers!
        [265, 685, 485, 815, 0.08],
        [535, 805, 745, 695, 0.085],
        [365, 625, 625, 625, 0.07],
      ], drawX, drawY, sc, t, { size: 0.92, seedOffset: 241 });
    } else if (key === "1,1") {
      // Al Fahidi & Dubai Creek: bustling souk shoppers along waterfront!
      drawWalkPaths(ctx, [
        [315, 565, 535, 525, 0.08],
        [555, 535, 745, 605, 0.085],
        [265, 585, 455, 545, 0.075],
      ], drawX, drawY, sc, t, { size: 0.92, seedOffset: 251 });
    } else if (key === "0,1") {
      // Dubai Marina: waterfront joggers & diners!
      drawWalkPaths(ctx, [
        [235, 695, 495, 845, 0.09],
        [535, 825, 755, 695, 0.085],
        [345, 565, 635, 565, 0.08],
      ], drawX, drawY, sc, t, { size: 0.9, seedOffset: 261 });
    } else if (key === "-1,1") {
      // Ain Dubai: Bluewaters promenade strollers + gulls!
      drawWalkPaths(ctx, [
        [285, 685, 535, 795, 0.08],
        [535, 795, 755, 675, 0.085, { flash: true }],
      ], drawX, drawY, sc, t, { size: 0.92, seedOffset: 271 });
      drawTileBird(ctx, drawX, drawY, sc, t, 355, 255, 75, 32, 0.9, 1.2);
    } else if (key === "-1,0") {
      // Desert Safari: live walking camel caravan + flickering Bedouin campfire + rising smoke!
      drawSmokePuffs(ctx, drawX, drawY, sc, t, 448, 658, 5, 58, "#f7efe0");
      const fl = 0.65 + 0.35 * Math.sin(t * 10);
      ctx.save();
      ctx.fillStyle = `rgba(255, 168, 52, ${0.78 * fl})`;
      ctx.beginPath(); ctx.arc(drawX + 448 * sc, drawY + 662 * sc, 7 * sc * fl, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // Animated camel caravan walking slowly across golden desert foreground!
      const cp = (t * 0.055) % 1;
      for (let i = 0; i < 4; i++) {
        const cx = drawX + lerp(360, 740, (cp + i * 0.12) % 1) * sc;
        const cy = drawY + lerp(765, 695, (cp + i * 0.12) % 1) * sc;
        const step = Math.sin(t * 5.5 + i * 1.6) * 3 * sc;
        ctx.save();
        ctx.strokeStyle = "#8a623c"; ctx.lineWidth = Math.max(1.0, 1.8 * sc);
        ctx.beginPath();
        ctx.moveTo(cx - 7 * sc, cy - 6 * sc); ctx.lineTo(cx - 8 * sc - step, cy + 4 * sc);
        ctx.moveTo(cx + 7 * sc, cy - 6 * sc); ctx.lineTo(cx + 8 * sc + step, cy + 4 * sc);
        ctx.stroke();
        ctx.fillStyle = "#c9965c"; ctx.strokeStyle = PALETTE.ink; ctx.lineWidth = Math.max(0.65, 0.9 * sc);
        ctx.beginPath(); ctx.ellipse(cx, cy - 10 * sc, 11 * sc, 6.5 * sc, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy - 16 * sc, 5 * sc, Math.PI, 0); ctx.fill(); ctx.stroke();
        ctx.fillStyle = i % 2 === 0 ? "#c8483c" : "#4a7894";
        ctx.fillRect(cx - 4 * sc, cy - 16 * sc, 8 * sc, 5 * sc);
        ctx.beginPath(); ctx.arc(cx + 12 * sc, cy - 15 * sc, 3.6 * sc, 0, Math.PI * 2); ctx.fillStyle = "#c9965c"; ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      drawWalkPaths(ctx, [[320, 755, 645, 705, 0.055]], drawX, drawY, sc, t, { size: 0.95, seedOffset: 281 });
    }
    return;
  }

  // ============================== SHANGHAI ==============================
  if (cityId === "shanghai") {
    if (key === "0,0") {
      // Lujiazui: pulsing roundabout fountain + twinkling Oriental Pearl spheres + circular skywalk walkers!
      drawFountainFX(ctx, drawX, drawY, sc, t, 512, 686, 6, 36, 22);
      drawSparkles(ctx, drawX, drawY, sc, t, [[508, 125], [508, 228], [508, 405], [335, 215], [685, 260]], "#ffd6e6");
      drawTileCloud(ctx, drawX, drawY, sc, t, 375, 225, 1.0, 0.5);
      // People strolling around the circular elevated Lujiazui skywalk!
      for (let i = 0; i < 8; i++) {
        const a = t * 0.35 + (i / 8) * Math.PI * 2;
        const px = drawX + (512 + Math.cos(a) * 238) * sc;
        const py = drawY + (675 + Math.sin(a) * 118) * sc;
        drawMiniPerson(ctx, px, py, sc, t, { seed: 300 + i, size: 0.85 });
      }
    } else if (key === "-1,-1") {
      // The Bund: bustling waterfront promenade tourists + gulls!
      drawWalkPaths(ctx, [
        [245, 655, 765, 455, 0.08],
        [315, 685, 825, 485, 0.085, { flash: true }],
        [295, 625, 665, 485, 0.075],
      ], drawX, drawY, sc, t, { size: 0.92, seedOffset: 311 });
      drawTileBird(ctx, drawX, drawY, sc, t, 420, 310, 80, 30, 0.9, 0.4);
    } else if (key === "0,-1") {
      // Yu Garden: swimming koi fish + visitors strolling the Nine-Turn Zigzag Bridge!
      for (let i = 0; i < 5; i++) {
        const a = t * 1.05 + i * 1.3;
        const kx = drawX + (440 + Math.cos(a) * 65 + (i % 2) * 180) * sc;
        const ky = drawY + (620 + Math.sin(a) * 28) * sc;
        ctx.save();
        ctx.fillStyle = i % 2 === 0 ? "#e66f35" : "#faf5e8";
        ctx.beginPath(); ctx.ellipse(kx, ky, 4.5 * sc, 2.1 * sc, a + 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      drawWalkPaths(ctx, [
        [445, 745, 585, 645, 0.08],
        [545, 665, 685, 575, 0.075, { flash: true }],
        [485, 795, 595, 715, 0.08],
      ], drawX, drawY, sc, t, { size: 0.92, seedOffset: 321 });
    } else if (key === "1,-1") {
      // Nanjing Road: lively shoppers + pulsing heritage neon glints!
      drawSparkles(ctx, drawX, drawY, sc, t, [[385, 365], [635, 395], [515, 465], [695, 485]], "#ffe28a");
      drawWalkPaths(ctx, [
        [285, 695, 495, 815, 0.085],
        [535, 815, 765, 685, 0.09],
        [365, 635, 615, 735, 0.08],
        [445, 545, 675, 645, 0.085],
      ], drawX, drawY, sc, t, { size: 0.95, seedOffset: 331 });
    } else if (key === "1,0") {
      // Maglev station: arriving travelers on plaza!
      drawWalkPaths(ctx, [
        [375, 755, 625, 795, 0.085],
        [465, 825, 715, 705, 0.08],
      ], drawX, drawY, sc, t, { size: 0.92, seedOffset: 341 });
    } else if (key === "1,1") {
      // Tianzifang: intimate brick lane strollers + tea steam wisps!
      drawSmokePuffs(ctx, drawX, drawY, sc, t, 545, 665, 3, 45);
      drawWalkPaths(ctx, [
        [395, 695, 615, 745, 0.075],
        [465, 635, 585, 795, 0.08, { wave: true }],
      ], drawX, drawY, sc, t, { size: 0.95, seedOffset: 351 });
    } else if (key === "0,1") {
      // Jing'an Golden Temple: billowing golden-white incense plumes + peaceful strollers!
      drawSmokePuffs(ctx, drawX, drawY, sc, t, 512, 628, 7, 82, "#fcf6e2");
      drawWalkPaths(ctx, [
        [395, 745, 625, 745, 0.07],
        [455, 695, 565, 825, 0.075],
      ], drawX, drawY, sc, t, { size: 0.95, seedOffset: 361 });
    } else if (key === "-1,1") {
      // Zhujiajiao Water Town: pedestrians crossing arched stone bridge + glowing lanterns!
      drawWalkPaths(ctx, [
        [385, 605, 625, 555, 0.08],
        [425, 585, 595, 575, 0.07],
      ], drawX, drawY, sc, t, { size: 0.9, seedOffset: 371 });
    } else if (key === "-1,0") {
      // Century Park: synchronized live Tai Chi group + animated bobbing colorful kites + park strollers!
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 4; c++) {
          const tx = drawX + (365 + c * 68 + r * 24) * sc;
          const ty = drawY + (575 + r * 56) * sc;
          const sway = Math.sin(t * 2.2 + c * 0.35) * 3.5 * sc;
          drawMiniPerson(ctx, tx + sway * 0.4, ty, sc, t, {
            walk: false, wave: true, coat: ["#faf4e6", "#d8645a", "#608ca6", "#e4bc58"][(r * 4 + c) % 4],
            seed: 380 + r * 4 + c, size: 1.0,
          });
        }
      }
      const kites = [[615, 615, "#e05a68"], [725, 575, "#e8b648"], [555, 665, "#4c9ab8"]];
      for (let i = 0; i < kites.length; i++) {
        const [kx0, ky0, kcol] = kites[i];
        const kx = drawX + (kx0 + Math.sin(t * 2.1 + i * 2) * 18) * sc;
        const ky = drawY + (ky0 + Math.cos(t * 2.7 + i) * 12) * sc;
        ctx.save();
        ctx.strokeStyle = "rgba(40,32,26,0.42)"; ctx.lineWidth = Math.max(0.5, 0.7 * sc);
        ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(kx - 28 * sc, ky + 75 * sc); ctx.stroke();
        ctx.fillStyle = kcol; ctx.strokeStyle = PALETTE.ink;
        ctx.beginPath();
        ctx.moveTo(kx, ky - 11 * sc); ctx.lineTo(kx + 8 * sc, ky);
        ctx.lineTo(kx, ky + 11 * sc); ctx.lineTo(kx - 8 * sc, ky);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      drawWalkPaths(ctx, [
        [285, 695, 545, 795, 0.075],
        [525, 785, 755, 675, 0.08],
      ], drawX, drawY, sc, t, { size: 0.92, seedOffset: 391 });
    }
    return;
  }

  // ============================== LONDON ==============================
  if (cityId === "london") {
    if (key === "0,0") {
      // Big Ben: live ticking clock hands + waving Union Jack + photo-flashing tourists by Red Phone Box!
      for (const [cx, cy] of [[682, 265], [751, 266]]) {
        const px = drawX + cx * sc, py = drawY + cy * sc, r = 13 * sc;
        const mA = -Math.PI * 0.5 + t * 0.9, hA = -Math.PI * 0.5 + t * 0.14;
        ctx.save();
        ctx.strokeStyle = PALETTE.ink; ctx.lineCap = "round";
        ctx.lineWidth = Math.max(0.8, 1.3 * sc);
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(mA) * r, py + Math.sin(mA) * r); ctx.stroke();
        ctx.lineWidth = Math.max(1.0, 1.8 * sc);
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(hA) * r * 0.65, py + Math.sin(hA) * r * 0.65); ctx.stroke();
        ctx.restore();
      }
      drawWavingFlag(ctx, drawX, drawY, sc, t, 212, 212, ["#2e4e8c", "#f7f3ea", "#c83c36"], 22, 14);
      drawWalkPaths(ctx, [
        [335, 745, 565, 845, 0.08],
        [515, 775, 705, 675, 0.085, { flash: true }],
        [615, 745, 745, 695, 0.075, { wave: true }],
        [295, 685, 485, 775, 0.075],
      ], drawX, drawY, sc, t, { size: 0.95, seedOffset: 401 });
      drawTileCloud(ctx, drawX, drawY, sc, t, 465, 225, 0.95, 0.8);
    } else if (key === "-1,-1") {
      // Tower Bridge: animated red London Routemaster buses crossing the bridge deck + gulls!
      for (let i = 0; i < 2; i++) {
        const p = (t * 0.13 + i * 0.5) % 1;
        const cx = drawX + lerp(215, 795, p) * sc;
        const cy = drawY + lerp(448, 568, p) * sc;
        drawMiniCar(ctx, cx, cy, 0.2, sc * 0.78, "#c83832", true);
      }
      drawTileBird(ctx, drawX, drawY, sc, t, 495, 240, 85, 34, 0.95, 0.3);
      drawWalkPaths(ctx, [
        [465, 795, 765, 645, 0.08],
      ], drawX, drawY, sc, t, { size: 0.92, seedOffset: 411 });
    } else if (key === "0,-1") {
      // London Eye: lively South Bank strollers + gulls!
      drawWalkPaths(ctx, [
        [245, 625, 665, 765, 0.08],
        [315, 655, 735, 785, 0.085, { flash: true }],
        [415, 685, 645, 745, 0.075, { wave: true }],
      ], drawX, drawY, sc, t, { size: 0.92, seedOffset: 421 });
      drawTileBird(ctx, drawX, drawY, sc, t, 320, 245, 70, 30, 0.9, 1.4);
    } else if (key === "1,-1") {
      // Buckingham Palace: 5 scarlet bearskin Royal Guards marching in crisp synchronized formation!
      const marchP = 0.5 + 0.5 * Math.sin(t * 0.55);
      for (let i = 0; i < 5; i++) {
        const gx = drawX + lerp(365, 515, marchP) * sc + i * 24 * sc;
        const gy = drawY + lerp(665, 595, marchP) * sc - i * 11 * sc;
        drawMiniPerson(ctx, gx, gy, sc, t, { coat: "#cc3532", pants: "#262a30", bearskin: true, seed: 430 + i, size: 1.05 });
      }
      drawWalkPaths(ctx, [
        [345, 745, 585, 815, 0.075],
        [565, 765, 745, 665, 0.08, { flash: true }],
      ], drawX, drawY, sc, t, { size: 0.9, seedOffset: 435 });
    } else if (key === "1,0") {
      // St. Paul's & Millennium Bridge: stream of Londoners walking across the bridge!
      drawWalkPaths(ctx, [
        [345, 685, 575, 845, 0.095],
        [375, 705, 555, 835, 0.08],
        [415, 735, 545, 825, 0.105],
        [245, 615, 445, 695, 0.075],
      ], drawX, drawY, sc, t, { size: 0.92, seedOffset: 441 });
      drawTileBird(ctx, drawX, drawY, sc, t, 520, 215, 75, 30, 0.9, 0.6);
    } else if (key === "1,1") {
      // Covent Garden: live street juggler + clapping crowd + café diners + market strollers!
      const jx = drawX + 518 * sc, jy = drawY + 648 * sc;
      drawMiniPerson(ctx, jx, jy + 16 * sc, sc, t, { walk: false, wave: true, coat: "#c94c42", seed: 455, size: 1.05 });
      drawMiniPerson(ctx, jx - 36 * sc, jy + 26 * sc, sc, t, { walk: false, wave: true, dress: true, seed: 456, size: 0.95 });
      drawMiniPerson(ctx, jx + 38 * sc, jy + 22 * sc, sc, t, { walk: false, wave: true, seed: 457, size: 0.95 });
      const bCols = ["#d8463c", "#e8b648", "#4c8cb0"];
      for (let i = 0; i < 3; i++) {
        const p = (t * 1.45 + i / 3) % 1;
        const bx = jx + Math.cos(p * Math.PI) * 14 * sc * (i % 2 === 0 ? 1 : -1);
        const by = jy - 12 * sc - Math.sin(p * Math.PI) * 34 * sc;
        ctx.save();
        ctx.fillStyle = bCols[i]; ctx.strokeStyle = PALETTE.ink; ctx.lineWidth = Math.max(0.5, 0.7 * sc);
        ctx.beginPath(); ctx.arc(bx, by, 3.6 * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      drawCafeDiners(ctx, drawX, drawY, sc, t, [[375, 595], [645, 605]]);
      drawWalkPaths(ctx, [
        [315, 745, 525, 845, 0.08],
        [525, 845, 725, 735, 0.085, { wave: true }],
        [375, 685, 625, 685, 0.075],
      ], drawX, drawY, sc, t, { size: 0.96, seedOffset: 451 });
    } else if (key === "0,1") {
      // Hyde Park: gliding swans + live tartan picnics + dog walker + park strollers!
      for (let i = 0; i < 3; i++) {
        const a = t * 0.55 + i * 2.1;
        const sx = drawX + (385 + Math.cos(a) * 65) * sc;
        const sy = drawY + (575 + Math.sin(a) * 32) * sc;
        ctx.save();
        ctx.fillStyle = "#fcfaf2"; ctx.strokeStyle = PALETTE.ink; ctx.lineWidth = Math.max(0.6, 0.85 * sc);
        ctx.beginPath(); ctx.ellipse(sx, sy, 6.5 * sc, 3.5 * sc, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      drawLivePicnic(ctx, drawX, drawY, sc, t, 395, 775, "#c84840", 465);
      drawTileDogWalker(ctx, drawX, drawY, sc, t, 565, 675, 765, 595, 0.075, 466);
      drawWalkPaths(ctx, [
        [495, 765, 755, 615, 0.075],
        [245, 655, 485, 795, 0.08],
      ], drawX, drawY, sc, t, { size: 0.94, seedOffset: 461 });
    } else if (key === "-1,1") {
      // The Shard Plaza: pulsing circular fountain + umbrella commuters + drifting cloud!
      drawFountainFX(ctx, drawX, drawY, sc, t, 502, 748, 6, 36, 22);
      drawTileCloud(ctx, drawX, drawY, sc, t, 465, 225, 1.0, 0.4);
      drawWalkPaths(ctx, [
        [275, 675, 485, 795, 0.09, { umbrella: "#c8463c" }],
        [535, 785, 745, 675, 0.085, { umbrella: "#487494" }],
        [365, 635, 635, 655, 0.08],
        [425, 765, 615, 725, 0.085, { umbrella: "#d8a846" }],
      ], drawX, drawY, sc, t, { size: 0.95, seedOffset: 471 });
    } else if (key === "-1,0") {
      // Notting Hill & Regent's Canal: Portobello shoppers & chimney wisps!
      drawSmokePuffs(ctx, drawX, drawY, sc, t, 315, 295, 3, 42);
      drawSmokePuffs(ctx, drawX, drawY, sc, t, 675, 285, 3, 42);
      drawWalkPaths(ctx, [
        [255, 595, 515, 475, 0.08],
        [525, 485, 765, 585, 0.085],
        [345, 645, 625, 535, 0.075],
      ], drawX, drawY, sc, t, { size: 0.92, seedOffset: 481 });
    }
  }
}
