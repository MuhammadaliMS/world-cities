// Night mode for any canvas context.
//
// installNight(ctx) wraps the context's drawing calls once. After that, everything drawn on it (tiles, streets,
// people) comes out as night, by an amount state.n from 0 (day) to 1 (night), so day can fade into night.
//
//   - Every colour is shifted to moonlit blue at the moment it is filled or stroked.
//   - Small glass-coloured shapes (windows) light up, about half of them, chosen by their position so the same
//     windows stay lit from frame to frame.
//   - Things drawn while ctx.__nl > 0 (people, cars, water) never light up as windows.
//   - Things drawn while ctx.__emit > 0 (lamp lanterns, headlights, glows) keep their colour.
//   - A tile can add hints (cities/<id>.js, tiles["gx,gy"].night):
//       flood:  [{ cols: ["#6e4429", ...], tint, k, gain }]  floodlit landmark: everything in these colours is lit
//               [{ box: [u0, v0, u1, v1, zTop], tint, k }]   or everything whose centre falls inside the box on screen
//       neon:   ["#e07a94", ...]   colours that glow in this tile (signs, lanterns)
//       lights: [{ u, v, z, r, col, a }]   extra additive glows drawn on top of the tile
//       windows: 0.5               share of lit windows (0 = none)
//       nowin:  [{ box: [u0, v0, u1, v1, zTop] }]   areas where nothing lights up as a window (snow, glass roofs)
// Pure function of the state: no randomness, no clock, so frames can be rendered in any order.

const proto = (ctx) => Object.getPrototypeOf(ctx);
const cache = new Map();
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
function hash2(x, y, s) { const h = Math.sin(x * 12.9898 + y * 78.233 + s * 37.719) * 43758.5453; return h - Math.floor(h); }

// colour string -> [r, g, b, a, h, s, l] (h in degrees, s and l 0..1), or null for anything we cannot read
function parse(str) {
  let c = cache.get(str);
  if (c !== undefined) return c;
  let r, g, b, a = 1, m;
  if (str[0] === "#") {
    const x = str.length === 4 ? str.slice(1).split("").map((d) => d + d).join("") : str.slice(1, 7);
    r = parseInt(x.slice(0, 2), 16); g = parseInt(x.slice(2, 4), 16); b = parseInt(x.slice(4, 6), 16);
    if (str.length === 9) a = parseInt(str.slice(7, 9), 16) / 255;
  } else if ((m = /^rgba?\(([^)]+)\)/.exec(str))) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    [r, g, b] = p; if (p.length > 3) a = p[3];
  }
  if (r === undefined || Number.isNaN(r)) { cache.set(str, null); return null; }
  const R = r / 255, G = g / 255, B = b / 255, mx = Math.max(R, G, B), mn = Math.min(R, G, B), l = (mx + mn) / 2;
  let h = 0, s = 0;
  if (mx !== mn) {
    const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === R ? ((G - B) / d + (G < B ? 6 : 0)) : mx === G ? (B - R) / d + 2 : (R - G) / d + 4; h *= 60;
  }
  c = [r, g, b, a, h, s, l];
  if (cache.size > 6000) cache.clear();
  cache.set(str, c);
  return c;
}
const css = (r, g, b, a) => `rgba(${r | 0},${g | 0},${b | 0},${Math.round(a * 1000) / 1000})`;

// the moonlit version of a colour
const NK = [0.2, 0.27, 0.43], NB = [8, 13, 30];
function nightRGB(c) {
  const lum = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
  return [0, 1, 2].map((i) => (c[i] + (lum - c[i]) * 0.35) * NK[i] + NB[i]);
}
const LIT = [[255, 214, 128], [255, 228, 160], [255, 200, 104], [255, 240, 200], [255, 222, 150], [205, 226, 255]];

export function installNight(ctx) {
  if (ctx.__ns) return ctx.__ns;
  const P = proto(ctx);
  const get = (k) => Object.getOwnPropertyDescriptor(P, k) || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(P), k);
  const fs = get("fillStyle"), ss = get("strokeStyle");
  const S = { n: 0, hints: null, seed: 0, inv: null, scale0: 1, x0: 0, y0: 0, x1: 0, y1: 0, neon: null, amb: new Map() };
  ctx.__ns = S; ctx.__nl = 0; ctx.__emit = 0;
  const box = () => { S.x0 = S.y0 = Infinity; S.x1 = S.y1 = -Infinity; };
  const ext = (x, y) => { if (x < S.x0) S.x0 = x; if (x > S.x1) S.x1 = x; if (y < S.y0) S.y0 = y; if (y > S.y1) S.y1 = y; };
  box();

  const { beginPath, moveTo, lineTo, quadraticCurveTo, bezierCurveTo, arc, ellipse, rect, fill, stroke, fillRect, strokeRect, fillText, strokeText,
    createLinearGradient, createRadialGradient } = P;
  ctx.beginPath = function () { box(); return beginPath.call(this); };
  ctx.moveTo = function (x, y) { if (S.n) ext(x, y); return moveTo.call(this, x, y); };
  ctx.lineTo = function (x, y) { if (S.n) ext(x, y); return lineTo.call(this, x, y); };
  ctx.quadraticCurveTo = function (a, b, x, y) { if (S.n) ext(x, y); return quadraticCurveTo.call(this, a, b, x, y); };
  ctx.bezierCurveTo = function (a, b, c, d, x, y) { if (S.n) ext(x, y); return bezierCurveTo.call(this, a, b, c, d, x, y); };
  ctx.arc = function (x, y, r, a0, a1, ccw) { if (S.n) { ext(x - r, y - r); ext(x + r, y + r); } return arc.call(this, x, y, r, a0, a1, ccw); };
  ctx.ellipse = function (x, y, rx, ry, ...rest) { if (S.n) { ext(x - rx, y - ry); ext(x + rx, y + ry); } return ellipse.call(this, x, y, rx, ry, ...rest); };
  ctx.rect = function (x, y, w, h) { if (S.n) { ext(x, y); ext(x + w, y + h); } return rect.call(this, x, y, w, h); };

  // where the current path sits, in tile pixels (or local pixels when no tile is set)
  function where(x0, y0, x1, y1) {
    let cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, k = 1;
    if (S.inv) {
      const m = ctx.getTransform();
      const dx = m.a * cx + m.c * cy + m.e, dy = m.b * cx + m.d * cy + m.f, i = S.inv;
      cx = i.a * dx + i.c * dy + i.e; cy = i.b * dx + i.d * dy + i.f;
      k = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) / S.scale0;
    }
    return [cx, cy, (x1 - x0) * k, (y1 - y0) * k];
  }

  // the colour to use for a style at night, given what is being drawn
  const glassy = (c) => (c[4] >= 175 && c[4] <= 250 && c[5] < 0.75 && c[6] >= 0.18 && c[6] <= 0.66) || (c[5] < 0.14 && c[6] >= 0.2 && c[6] <= 0.5);
  function ambient(style, c) {
    let v = S.amb.get(style);
    if (v === undefined) {
      const n = S.n, nr = nightRGB(c);
      const alpha = c[3] < 0.4 && c[6] < 0.45 ? c[3] * (1 - 0.85 * n) : c[3]; // daylight shadows fade out
      v = css(c[0] + (nr[0] - c[0]) * n, c[1] + (nr[1] - c[1]) * n, c[2] + (nr[2] - c[2]) * n, alpha);
      if (S.amb.size > 4000) S.amb.clear();
      S.amb.set(style, v);
    }
    return v;
  }
  function shade(style, kind, x0, y0, x1, y1) {
    if (typeof style !== "string" || ctx.__emit > 0) return null;
    const c = parse(style);
    if (!c) return null;
    const n = S.n, a = c[3];
    const key = (c[0] << 16) | (c[1] << 8) | c[2];
    if (S.neon && S.neon.has(key)) return css(...[0, 1, 2].map((i) => c[i] + (nightRGB(c)[i] - c[i]) * n * 0.12), a);
    // floodlit by colour: every fill or line in these colours is lit, wherever it is
    const fc = S.floodCols && S.floodCols.get(key);
    const hasBox = x1 > x0;
    const win = kind === "fill" && hasBox && ctx.__nl === 0 && S.winShare > 0 && a > 0.8 && !fc && glassy(c);
    const box = !fc && hasBox && S.boxFlood;
    if (!fc && !win && !box) return ambient(style, c);
    const nr = nightRGB(c);
    let out = [0, 1, 2].map((i) => c[i] + (nr[i] - c[i]) * n);
    const alpha = a < 0.4 && c[6] < 0.45 ? a * (1 - 0.85 * n) : a;
    if (fc) { const t = fc.rgb, kk = (fc.k ?? 0.7) * n; out = out.map((o, i) => o + (Math.min(255, c[i] * (t[i] / 255) * (fc.gain ?? 1.25)) - o) * kk); }
    else {
      const [cx, cy, w, h] = where(x0, y0, x1, y1);
      let lit = false;
      if (box) for (const f of box) if (cx >= f.rx0 && cx <= f.rx1 && cy >= f.ry0 && cy <= f.ry1) {
        const t = f.rgb, kk = (f.k ?? 0.55) * n;
        out = out.map((o, i) => o + (c[i] * (t[i] / 255) - o) * kk); lit = true; break;
      }
      if (win && !lit) {
        let nowin = false;
        if (S.hints?.nowin) for (const f of S.hints.nowin) if (cx >= f.rx0 && cx <= f.rx1 && cy >= f.ry0 && cy <= f.ry1) { nowin = true; break; }
        const area = w * h, lo = Math.min(w, h), hi = Math.max(w, h);
        if (!nowin && lo >= 2 && hi <= 34 && area >= 8 && area <= 560 && hi / lo < 7) {
          const hx = Math.round(cx / 3), hy = Math.round(cy / 3);
          if (hash2(hx, hy, S.seed) < S.winShare) {
            const L = LIT[Math.floor(hash2(hy, hx, S.seed + 5) * LIT.length)], e = smooth(0.15, 0.85, n);
            out = out.map((o, i) => o + (L[i] - o) * e);
          }
        }
      }
    }
    return css(out[0], out[1], out[2], alpha);
  }

  function withStyle(desc, kind, draw) {
    if (!S.n) return draw();
    const raw = desc.get.call(ctx);
    const v = shade(raw, kind, S.x0, S.y0, S.x1, S.y1);
    if (v === null) return draw();
    desc.set.call(ctx, v);
    try { return draw(); } finally { desc.set.call(ctx, raw); }
  }
  ctx.fill = function (...a) { return withStyle(fs, "fill", () => fill.apply(this, a)); };
  ctx.stroke = function (...a) { return withStyle(ss, "stroke", () => stroke.apply(this, a)); };
  ctx.fillRect = function (x, y, w, h) { const b = [S.x0, S.y0, S.x1, S.y1]; S.x0 = x; S.y0 = y; S.x1 = x + w; S.y1 = y + h;
    try { return withStyle(fs, "fill", () => fillRect.call(this, x, y, w, h)); } finally { [S.x0, S.y0, S.x1, S.y1] = b; } };
  ctx.strokeRect = function (...a) { return withStyle(ss, "stroke", () => strokeRect.apply(this, a)); };
  ctx.fillText = function (...a) { return withStyle(fs, "text", () => fillText.apply(this, a)); };
  ctx.strokeText = function (...a) { return withStyle(ss, "text", () => strokeText.apply(this, a)); };
  const wrapGrad = (g) => {
    const add = g.addColorStop;
    g.addColorStop = (o, col) => { const v = S.n ? shade(col, "grad", 0, 0, 0, 0) : null; return add.call(g, o, v ?? col); };
    return g;
  };
  ctx.createLinearGradient = function (...a) { return wrapGrad(createLinearGradient.apply(this, a)); };
  ctx.createRadialGradient = function (...a) { return wrapGrad(createRadialGradient.apply(this, a)); };
  return S;
}

// set the night state for what is drawn next. tile: the tile's base transform has just been applied to ctx.
export function setNight(ctx, n, o = {}) {
  const S = installNight(ctx);
  if (S.n !== (n || 0)) S.amb.clear();
  S.n = n || 0;
  S.hints = o.hints || null;
  S.seed = o.seed || 0;
  S.winShare = o.hints?.windows ?? o.windows ?? 0.5;
  const rgbKey = (col) => { const c = parse(col.toLowerCase()); return c ? (c[0] << 16) | (c[1] << 8) | c[2] : -1; };
  S.neon = o.hints?.neon ? new Set(o.hints.neon.map(rgbKey)) : null;
  // flood entries with cols light those colours anywhere; entries with only a box light whatever is inside the box
  S.floodCols = null; S.boxFlood = null;
  for (const f of o.hints?.flood || []) {
    f.rgb = parse(f.tint || "#ffd8a0");
    if (f.cols) { S.floodCols ??= new Map(); for (const col of f.cols) S.floodCols.set(rgbKey(col), f); }
    else (S.boxFlood ??= []).push(f);
  }
  if (o.tile && S.n) {
    const m = ctx.getTransform();
    S.inv = m.inverse(); S.scale0 = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
  } else { S.inv = null; S.scale0 = 1; }
  // boxes [u0, v0, u1, v1, zTop] -> the screen rectangle they cover in tile pixels
  if (o.P) for (const f of [...(S.boxFlood || []), ...(S.hints?.nowin || [])]) {
    const [u0, v0, u1, v1, z1 = 0] = f.box || f, P = o.P;
    f.rx0 = P(u0, v1, 0)[0]; f.rx1 = P(u1, v0, 0)[0]; f.ry0 = P(u0, v0, z1)[1]; f.ry1 = P(u1, v1, 0)[1];
    f.rgb = parse(f.tint || "#ffd8a0");
  }
  return S;
}

// an additive glow (light pool, halo); drawn as is, never darkened
export function glow(ctx, x, y, r, col, a = 1, sy = 1) {
  if (a <= 0.003 || r <= 0) return;
  const c = parse(col) || [255, 220, 150, 1];
  ctx.__emit = (ctx.__emit || 0) + 1;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.translate(x, y); ctx.scale(1, sy);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, css(c[0], c[1], c[2], a));
  g.addColorStop(0.35, css(c[0], c[1], c[2], a * 0.45));
  g.addColorStop(1, css(c[0], c[1], c[2], 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.__emit--;
}

// the sky behind a night city
export function nightSky(ctx, W, H, n, base = "#ffffff") {
  const b = parse(base) || [255, 255, 255];
  const top = [16, 22, 46], bot = [34, 44, 78];
  // half way through, a sunset: violet above, warm low down
  const duskTop = [92, 86, 152], duskBot = [244, 172, 138], w = Math.sin(Math.PI * clamp(n)) * 0.6;
  const mix = (c, d, i) => { const v = b[i] + (c[i] - b[i]) * n; return v + (d[i] - v) * w; };
  const g = ctx.createLinearGradient(0, 0, 0, H);
  ctx.__emit = (ctx.__emit || 0) + 1;
  g.addColorStop(0, css(mix(top, duskTop, 0), mix(top, duskTop, 1), mix(top, duskTop, 2), 1));
  g.addColorStop(1, css(mix(bot, duskBot, 0), mix(bot, duskBot, 1), mix(bot, duskBot, 2), 1));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // a few fixed stars
  if (n > 0.3) {
    ctx.fillStyle = `rgba(255,255,255,${0.7 * smooth(0.3, 1, n)})`;
    for (let i = 0; i < 90; i++) {
      const x = hash2(i, 1, 3) * W, y = hash2(i, 2, 3) * H * 0.55, r = (0.5 + hash2(i, 3, 3) * 1.1) * Math.max(1, W / 1920);
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.__emit--;
}
