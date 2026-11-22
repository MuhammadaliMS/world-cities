// Ligne Claire Illustrated Realism Engine — v3 Masterwork
// Warm cold-press archival paper + cached watercolor/gouache wash overlays,
// multi-pane recessed architectural windows, compound neoclassical & gothic forms,
// smooth organic Bezier canopies, sculpted 3-volume vehicles & curved-hull boats,
// storybook illustrated characters, cyclists, picnics, hills, and painterly clouds.

export const PALETTE = {
  paper: "#f5f0e5",
  paperDark: "#eae2d2",
  ink: "#26201c",
  inkMid: "#473e37",
  inkSoft: "rgba(38, 32, 28, 0.34)",
  shadow: "rgba(42, 33, 24, 0.16)",
  shadowDeep: "rgba(42, 33, 24, 0.24)",
  ao: "rgba(42, 33, 24, 0.10)",
  road: "#dcd5c6",
  roadLine: "#e2bf58",
  sidewalk: "#efe8da",
  slabL: "#d7cebc",
  slabR: "#bfb49f",
};

export const ISO = {
  xScale: 1.0,
  yScale: 0.577,
  zScale: 0.94,
};

export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (t) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
export const easeInOutCubic = (t) => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeOutBack = (t) => {
  const x = clamp(t);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

const _rgbCache = new Map();
export function hexToRgb(hex) {
  let c = _rgbCache.get(hex);
  if (c) return c;
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((s) => s + s).join("") : h, 16);
  c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  _rgbCache.set(hex, c);
  return c;
}

export function rgbToHex(r, g, b) {
  const cl = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return "#" + ((1 << 24) + (cl(r) << 16) + (cl(g) << 8) + cl(b)).toString(16).slice(1);
}

export function shade(hex, pct) {
  if (!hex || !hex.startsWith("#")) return hex;
  const [r, g, b] = hexToRgb(hex);
  const dr = pct > 0 ? pct * 1.06 : pct * 1.02;
  const dg = pct;
  const db = pct > 0 ? pct * 0.90 : pct * 0.85;
  return rgbToHex(r + dr * 255, g + dg * 255, b + db * 255);
}

export function mixHex(c1, c2, t) {
  if (!c1 || !c2 || !c1.startsWith("#") || !c2.startsWith("#")) return c2;
  const a = hexToRgb(c1);
  const b = hexToRgb(c2);
  const k = clamp(t);
  return rgbToHex(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k);
}

export function project(u, v, z = 0, scale = 20, ox = 0, oy = 0) {
  return [
    ox + (u - v) * scale * ISO.xScale,
    oy + (u + v) * scale * ISO.yScale - z * scale * ISO.zScale,
  ];
}

// =========================================================================
// PRE-BAKED ARCHIVAL PAPER & WATERCOLOR WASH TEXTURES (Cached once!)
// =========================================================================

let _washPatternCache = null;
export function getWatercolorWash(ctx) {
  if (_washPatternCache) return _washPatternCache;
  const size = 256;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  const r = rng(424242);
  // Soft organic gouache pigment pooling blotches (seamless wrap!)
  for (let i = 0; i < 65; i++) {
    const x = r() * size;
    const y = r() * size;
    const rad = 16 + r() * 44;
    const dark = r() > 0.45;
    for (const ox of [-size, 0, size]) {
      for (const oy of [-size, 0, size]) {
        const px = x + ox, py = y + oy;
        if (px + rad < 0 || px - rad > size || py + rad < 0 || py - rad > size) continue;
        const grd = g.createRadialGradient(px, py, 0, px, py, rad);
        if (dark) {
          grd.addColorStop(0, "rgba(72, 56, 38, 0.065)");
          grd.addColorStop(0.65, "rgba(72, 56, 38, 0.032)");
          grd.addColorStop(1, "rgba(72, 56, 38, 0)");
        } else {
          grd.addColorStop(0, "rgba(255, 252, 240, 0.09)");
          grd.addColorStop(0.65, "rgba(255, 252, 240, 0.035)");
          grd.addColorStop(1, "rgba(255, 252, 240, 0)");
        }
        g.fillStyle = grd;
        g.beginPath();
        g.arc(px, py, rad, 0, Math.PI * 2);
        g.fill();
      }
    }
  }
  // Fine cold-press pigment tooth speckle
  for (let i = 0; i < 1400; i++) {
    const x = r() * size;
    const y = r() * size;
    g.fillStyle = r() > 0.5 ? "rgba(50, 38, 28, 0.045)" : "rgba(255, 254, 248, 0.06)";
    g.fillRect(x, y, 1.3, 1.3);
  }
  _washPatternCache = ctx.createPattern(c, "repeat");
  return _washPatternCache;
}

export function createPaperTexture(width, height) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const g = c.getContext("2d");

  g.fillStyle = PALETTE.paper;
  g.fillRect(0, 0, width, height);

  const rad = g.createRadialGradient(
    width * 0.5,
    height * 0.48,
    Math.min(width, height) * 0.22,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.74
  );
  rad.addColorStop(0, "rgba(255, 253, 246, 0.3)");
  rad.addColorStop(0.65, "rgba(245, 240, 229, 0)");
  rad.addColorStop(1, "rgba(182, 165, 138, 0.28)");
  g.fillStyle = rad;
  g.fillRect(0, 0, width, height);

  const rand = rng(90210);
  // Subtle warm watercolor blooms on paper
  for (let i = 0; i < 36; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const r0 = 80 + rand() * 200;
    const gr = g.createRadialGradient(x, y, 0, x, y, r0);
    gr.addColorStop(0, rand() > 0.5 ? "rgba(218, 204, 178, 0.08)" : "rgba(255, 252, 244, 0.1)");
    gr.addColorStop(1, "rgba(245, 240, 229, 0)");
    g.fillStyle = gr;
    g.beginPath();
    g.arc(x, y, r0, 0, Math.PI * 2);
    g.fill();
  }
  for (let i = 0; i < 11000; i++) {
    const x = rand() * width;
    const y = rand() * height;
    g.fillStyle = rand() > 0.5 ? "rgba(155, 135, 108, 0.06)" : "rgba(255, 252, 245, 0.085)";
    g.fillRect(x, y, 1 + rand() * 1.5, 1 + rand() * 1.5);
  }
  g.strokeStyle = "rgba(145, 128, 104, 0.042)";
  g.lineWidth = 0.65;
  for (let i = 0; i < 700; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const a = rand() * Math.PI * 2;
    const len = 5 + rand() * 12;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    g.stroke();
  }
  return c;
}

// =========================================================================
// MAIN ISOMETRIC ILLUSTRATION PEN (v3)
// =========================================================================

export class IsoPen {
  constructor(ctx, opts) {
    this.ctx = ctx;
    this.scale = opts.scale;
    this.ox = opts.ox;
    this.oy = opts.oy;
    this.cx = opts.cx || 0;
    this.cy = opts.cy || 0;
    this.t = opts.t || 0;
    this.reveal = opts.reveal ?? 1;
    this.zoom = opts.zoom || 1;
    this.inkWidth = opts.inkWidth || 1.05;
    this._idx = 0;
    this._estTotal = opts.estTotal || 200;
    this._queue = [];
    this._wash = getWatercolorWash(ctx);
  }

  pt(u, v, z = 0) {
    const wu = this.ox + u;
    const wv = this.oy + v;
    return [
      this.cx + (wu - wv) * this.scale * ISO.xScale,
      this.cy + (wu + wv) * this.scale * ISO.yScale - z * this.scale * ISO.zScale,
    ];
  }

  item(depth, fn) {
    this._queue.push({ depth, order: this._queue.length, fn });
  }

  flush() {
    this._queue.sort((a, b) => a.depth - b.depth || a.order - b.order);
    for (const q of this._queue) q.fn();
    this._queue.length = 0;
  }

  _phase(weight = 1) {
    if (this.reveal >= 0.999) {
      return { visible: true, strokeP: 1, fillP: 1, lifeP: 1 };
    }
    const i = this._idx;
    this._idx += weight;
    const frac = clamp(i / this._estTotal, 0, 1);
    const r = this.reveal;
    const strokeP = clamp((r - frac * 0.36) / 0.26, 0, 1);
    const fillP = smoothstep(clamp((r - 0.42 - frac * 0.28) / 0.28, 0, 1));
    const lifeP = easeOutBack(clamp((r - 0.68) / 0.3, 0, 1));
    return { visible: strokeP > 0.001, strokeP, fillP, lifeP };
  }

  get lifeAlpha() {
    if (this.reveal >= 0.999) return 1;
    return clamp((this.reveal - 0.68) / 0.26, 0, 1);
  }

  _polyPerimeter(pts) {
    let p = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      p += Math.hypot(b[0] - a[0], b[1] - a[1]);
    }
    return p;
  }

  _lineLen(pts) {
    let p = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      p += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    }
    return p;
  }

  // Fill + Watercolor wash + crisp fountain-pen ink stroke
  poly(coords, fill, stroke = PALETTE.ink, lwMul = 1, closed = true, opts = null) {
    const ph = this._phase(0.8);
    if (!ph.visible) return;
    const ctx = this.ctx;
    const pts = coords.map((c) => this.pt(c[0], c[1], c[2] || 0));

    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (closed) ctx.closePath();

    if (fill) {
      if (ph.fillP >= 0.999) {
        if (opts && opts.gradTo && fill.startsWith("#")) {
          let minY = Infinity, maxY = -Infinity;
          for (const p of pts) {
            if (p[1] < minY) minY = p[1];
            if (p[1] > maxY) maxY = p[1];
          }
          const gr = ctx.createLinearGradient(0, minY, 0, Math.max(minY + 1, maxY));
          gr.addColorStop(0, fill);
          gr.addColorStop(1, opts.gradTo);
          ctx.fillStyle = gr;
        } else {
          ctx.fillStyle = fill;
        }
        ctx.fill();
        // Subtle hand-painted gouache wash overlay on substantial surfaces!
        if ((!opts || opts.wash !== false) && closed && pts.length >= 3 && typeof fill === "string" && fill.startsWith("#")) {
          ctx.save();
          ctx.globalAlpha *= opts?.washAlpha ?? 0.55;
          ctx.fillStyle = this._wash;
          ctx.fill();
          ctx.restore();
        }
      } else if (typeof fill === "string" && fill.startsWith("#")) {
        ctx.fillStyle = mixHex(PALETTE.paper, fill, ph.fillP);
        ctx.fill();
      } else {
        ctx.save();
        ctx.globalAlpha *= ph.fillP;
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.restore();
      }
    }

    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = this.inkWidth * lwMul;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      if (ph.strokeP < 0.999) {
        const len = closed ? this._polyPerimeter(pts) : this._lineLen(pts);
        ctx.save();
        ctx.setLineDash([Math.max(0.5, len * ph.strokeP), len + 8]);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.stroke();
      }
    }
  }

  screenPoly(pts, fill, stroke = PALETTE.ink, lwMul = 1, closed = true, opts = null) {
    const ph = this._phase(0.45);
    if (!ph.visible) return;
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (closed) ctx.closePath();

    if (fill) {
      if (ph.fillP >= 0.999) {
        ctx.fillStyle = fill;
        ctx.fill();
        if (opts && opts.wash && closed) {
          ctx.save();
          ctx.globalAlpha *= opts.washAlpha ?? 0.5;
          ctx.fillStyle = this._wash;
          ctx.fill();
          ctx.restore();
        }
      } else if (typeof fill === "string" && fill.startsWith("#")) {
        ctx.fillStyle = mixHex(PALETTE.paper, fill, ph.fillP);
        ctx.fill();
      } else {
        ctx.save();
        ctx.globalAlpha *= ph.fillP;
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.restore();
      }
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = this.inkWidth * lwMul;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      if (ph.strokeP < 0.999) {
        const len = closed ? this._polyPerimeter(pts) : this._lineLen(pts);
        ctx.save();
        ctx.setLineDash([Math.max(0.5, len * ph.strokeP), len + 8]);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.stroke();
      }
    }
  }

  // Soft elliptical ground ambient-occlusion shadow
  softShadow(u, v, rx, ry, z = 0.015, alpha = 0.16) {
    if (this.reveal < 0.4) return;
    const [cx, cy] = this.pt(u, v, z);
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha *= clamp((this.reveal - 0.4) / 0.35) * alpha;
    ctx.fillStyle = "#2b2118";
    ctx.beginPath();
    ctx.ellipse(cx + rx * this.scale * 0.16, cy + ry * this.scale * 0.12, rx * this.scale, ry * this.scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  line(p1, p2, stroke = PALETTE.ink, lwMul = 0.75) {
    this.poly([p1, p2], null, stroke, lwMul, false);
  }

  polyline(coords, stroke = PALETTE.ink, lwMul = 0.85) {
    this.poly(coords, null, stroke, lwMul, false);
  }

  ground(u, v, du, dv, fill, z = 0, stroke = PALETTE.ink, lwMul = 0.75) {
    const gradTo = typeof fill === "string" && fill.startsWith("#") ? shade(fill, -0.04) : null;
    this.poly(
      [[u, v, z], [u + du, v, z], [u + du, v + dv, z], [u, v + dv, z]],
      fill,
      stroke,
      lwMul,
      true,
      { gradTo, washAlpha: 0.75 }
    );
  }

  // Cutaway isometric tile slab with delicate curb border, watercolor wash & earth strata
  tileBase(du, dv, topCol, opts = {}) {
    const thick = opts.thick ?? 0.46;
    const leftCol = opts.leftCol || PALETTE.slabL;
    const rightCol = opts.rightCol || PALETTE.slabR;
    // Soft architectural drop shadow on paper
    this.poly(
      [
        [0.18, dv + 0.2, -thick],
        [du + 0.22, dv + 0.2, -thick],
        [du + 0.22, 0.18, -thick],
        [du, 0, -thick],
        [du, dv, -thick],
        [0, dv, -thick],
      ],
      "rgba(42,33,24,0.13)",
      null,
      0,
      true,
      { wash: false }
    );
    // Cutaway sides with top bevel lip & warm stone stratification
    this.poly([[0, dv, 0], [du, dv, 0], [du, dv, -thick], [0, dv, -thick]], leftCol, PALETTE.ink, 0.95, true, { gradTo: shade(leftCol, -0.07) });
    this.poly([[du, 0, 0], [du, dv, 0], [du, dv, -thick], [du, 0, -thick]], rightCol, PALETTE.ink, 0.95, true, { gradTo: shade(rightCol, -0.08) });
    this.line([0, dv, -thick * 0.38], [du, dv, -thick * 0.38], "rgba(38,32,28,0.18)", 0.48);
    this.line([du, 0, -thick * 0.38], [du, dv, -thick * 0.38], "rgba(38,32,28,0.22)", 0.48);
    // Top face with painterly wash
    this.ground(0, 0, du, dv, topCol, 0, PALETTE.ink, 1.0);
    // Subtle inner sidewalk curb inset line
    if (opts.curb !== false && du >= 8) {
      this.ground(0.24, 0.24, du - 0.48, dv - 0.48, null, 0.005, "rgba(38,32,28,0.20)", 0.45);
    }
    if (opts.paving) {
      this.paving(0.3, 0.3, du - 0.6, dv - 0.6, opts.paving === true ? 1.15 : opts.paving);
    }
  }

  // Delicate hand-inked flagstone / cobblestone paving grid with tonal stone variety
  paving(u, v, du, dv, step = 1.15, z = 0.01) {
    if (this.reveal < 0.35) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha *= clamp((this.reveal - 0.35) / 0.35) * 0.22;
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = this.inkWidth * 0.42;
    for (let x = u + step; x < u + du - 0.1; x += step) {
      const a = this.pt(x, v, z), b = this.pt(x, v + dv, z);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    for (let y = v + step; y < v + dv - 0.1; y += step) {
      const a = this.pt(u, y, z), b = this.pt(u + du, y, z);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    ctx.restore();
  }

  // Lush watercolor lawn stippling, grass blade tufts & blooming wildflowers!
  grassDetail(u, v, du, dv, seed = 1, flowers = true, z = 0.025) {
    if (this.reveal < 0.45) return;
    const r = rng(seed * 97 + Math.floor(u * 31 + v * 17));
    const count = Math.max(10, Math.floor(du * dv * 2.2));
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha *= clamp((this.reveal - 0.45) / 0.35);

    // Soft dappled meadow watercolor patches
    const patches = Math.max(3, Math.floor(du * dv * 0.32));
    for (let i = 0; i < patches; i++) {
      const pu = u + 0.4 + r() * Math.max(0.1, du - 0.8);
      const pv = v + 0.4 + r() * Math.max(0.1, dv - 0.8);
      const [px, py] = this.pt(pu, pv, z);
      const rx = this.scale * (0.45 + r() * 0.65);
      ctx.fillStyle = r() > 0.5 ? "rgba(182, 206, 126, 0.22)" : "rgba(62, 92, 46, 0.12)";
      ctx.beginPath();
      ctx.ellipse(px, py, rx, rx * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const flCols = ["#f6e48d", "#f3a8bc", "#faf7ee", "#df7f6e", "#baa4de", "#f4c078"];
    for (let i = 0; i < count; i++) {
      const gu = u + 0.18 + r() * Math.max(0.1, du - 0.36);
      const gv = v + 0.18 + r() * Math.max(0.1, dv - 0.36);
      const [px, py] = this.pt(gu, gv, z);
      if (flowers && r() < 0.28) {
        const col = flCols[Math.floor(r() * flCols.length)];
        const fr = this.scale * (0.055 + r() * 0.035);
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(px, py, fr, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(40,32,26,0.28)";
        ctx.beginPath();
        ctx.arc(px, py, fr * 0.28, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Organic 3-blade hand-drawn grass tuft!
        ctx.strokeStyle = "rgba(44, 68, 36, 0.42)";
        ctx.lineWidth = this.inkWidth * 0.48;
        ctx.beginPath();
        ctx.moveTo(px - 2.6, py - 2.4);
        ctx.lineTo(px - 0.3, py);
        ctx.lineTo(px + 0.2, py - 3.3);
        ctx.moveTo(px, py);
        ctx.lineTo(px + 2.6, py - 2.2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Organic 3D sculpted grassy hill / headland mound with watercolor slope shading!
  hill(u, v, du, dv, h, opts = {}) {
    const col = opts.color || "#8aab67";
    const cliffCol = opts.cliff || "#c4b69a";
    const [pL] = [this.pt(u, v + dv, 0)];
    const [pR] = [this.pt(u + du, v, 0)];
    const [pF] = [this.pt(u + du, v + dv, 0)];
    const [pB] = [this.pt(u, v, 0)];
    const [pPeak] = [this.pt(u + du * (opts.peakU ?? 0.46), v + dv * (opts.peakV ?? 0.42), h)];
    const ph = this._phase(1.4);
    if (!ph.visible) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pL[0], pL[1]);
    ctx.quadraticCurveTo(pB[0] * 0.35 + pPeak[0] * 0.65, pPeak[1] - 4, pPeak[0], pPeak[1]);
    ctx.quadraticCurveTo(pR[0] * 0.4 + pPeak[0] * 0.6, pPeak[1] + 6, pR[0], pR[1]);
    ctx.lineTo(pF[0], pF[1]);
    ctx.closePath();

    if (ph.fillP > 0.01) {
      const gr = ctx.createLinearGradient(pL[0], pPeak[1], pF[0], pF[1]);
      gr.addColorStop(0, shade(col, 0.14));
      gr.addColorStop(0.55, col);
      gr.addColorStop(1, shade(col, -0.14));
      ctx.fillStyle = ph.fillP >= 0.999 ? gr : mixHex(PALETTE.paper, col, ph.fillP);
      ctx.fill();
      if (ph.fillP >= 0.999) {
        ctx.globalAlpha *= 0.65;
        ctx.fillStyle = this._wash;
        ctx.fill();
        ctx.globalAlpha /= 0.65;
      }
      // Subtle hillside shadow wash on the right slope
      ctx.save();
      ctx.clip();
      ctx.fillStyle = "rgba(46, 68, 34, 0.16)";
      ctx.beginPath();
      ctx.moveTo(pPeak[0], pPeak[1]);
      ctx.quadraticCurveTo(pR[0], (pPeak[1] + pF[1]) * 0.5, pF[0], pF[1]);
      ctx.lineTo(pR[0], pR[1]);
      ctx.closePath();
      ctx.fill();
      // Delicate contour grass ticks on hillside!
      const r = rng(Math.floor(u * 41 + v * 73 + 9));
      ctx.strokeStyle = "rgba(40, 62, 30, 0.38)";
      ctx.lineWidth = this.inkWidth * 0.52;
      for (let i = 0; i < 16; i++) {
        const fu = 0.18 + r() * 0.64, fv = 0.18 + r() * 0.64;
        const elev = h * Math.max(0, 1 - Math.hypot(fu - 0.48, fv - 0.45) * 1.45);
        const [gx, gy] = this.pt(u + du * fu, v + dv * fv, elev);
        ctx.beginPath();
        ctx.moveTo(gx - 2.5, gy - 2);
        ctx.lineTo(gx, gy);
        ctx.lineTo(gx + 2.5, gy - 2.2);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = this.inkWidth * 0.95;
    ctx.lineJoin = "round";
    ctx.stroke();

    // Optional cutaway earthen slope cliff along right edge
    if (opts.cutaway) {
      this.poly(
        [[u + du, v, 0], [u + du, v + dv, 0], [u + du, v + dv, opts.cutH || h * 0.35], [u + du, v, opts.cutH || h * 0.35]],
        cliffCol, PALETTE.ink, 0.85, true, { gradTo: shade(cliffCol, -0.1) }
      );
    }
    ctx.restore();
  }

  // Fluffy hand-drawn bush / hydrangea cluster with optional flowers!
  bush(u, v, z = 0.02, sc = 1.0, col = "#6f9656", flowers = null) {
    const [bx, by] = this.pt(u, v, z);
    const s = this.scale * 0.34 * sc;
    const ph = this._phase(0.4);
    if (!ph.visible) return;
    const ctx = this.ctx;
    ctx.save();
    // Soft ground shadow
    ctx.fillStyle = PALETTE.shadow;
    ctx.beginPath();
    ctx.ellipse(bx + s * 0.15, by + s * 0.12, s * 1.12, s * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Organic smooth cloud silhouette
    ctx.beginPath();
    ctx.arc(bx - s * 0.48, by - s * 0.2, s * 0.56, Math.PI * 0.5, Math.PI * 1.6);
    ctx.arc(bx, by - s * 0.48, s * 0.66, Math.PI * 1.05, Math.PI * 1.95);
    ctx.arc(bx + s * 0.5, by - s * 0.2, s * 0.54, Math.PI * 1.4, Math.PI * 0.5);
    ctx.closePath();

    const gr = ctx.createRadialGradient(bx - s * 0.25, by - s * 0.65, s * 0.1, bx + s * 0.15, by - s * 0.15, s * 1.25);
    gr.addColorStop(0, shade(col, 0.16));
    gr.addColorStop(0.65, col);
    gr.addColorStop(1, shade(col, -0.16));
    ctx.fillStyle = ph.fillP >= 0.999 ? gr : mixHex(PALETTE.paper, col, ph.fillP);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = this.inkWidth * 0.72;
    ctx.stroke();

    if (flowers && ph.fillP > 0.6) {
      const r = rng(Math.floor(u * 61 + v * 37));
      const fArr = Array.isArray(flowers) ? flowers : [flowers];
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = fArr[i % fArr.length];
        ctx.beginPath();
        ctx.arc(bx + (r() - 0.5) * s * 1.35, by - s * (0.18 + r() * 0.65), s * 0.16, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // Raised manicured flowerbed with bevelled stone curbing & lush dense blossoms!
  flowerbed(u, v, du, dv, colors = ["#e67c8c", "#f2cf66", "#faf6ec"], z = 0.02) {
    this.box(u, v, z, du, dv, 0.14, "#ded5c3", { shadow: false, noPlinth: true, lw: 0.68 });
    this.ground(u + 0.08, v + 0.08, du - 0.16, dv - 0.16, "#6f9254", z + 0.145, null);
    if (this.reveal < 0.5) return;
    const r = rng(Math.floor(u * 47 + v * 89 + 11));
    const n = Math.max(9, Math.floor(du * dv * 11));
    const ctx = this.ctx;
    ctx.save();
    for (let i = 0; i < n; i++) {
      const fu = u + 0.14 + r() * Math.max(0.1, du - 0.28);
      const fv = v + 0.14 + r() * Math.max(0.1, dv - 0.28);
      const [px, py] = this.pt(fu, fv, z + 0.2);
      const fr = this.scale * (0.08 + r() * 0.045);
      // Leaf tuft under bloom
      ctx.fillStyle = "#5b7d44";
      ctx.beginPath();
      ctx.ellipse(px, py + fr * 0.4, fr * 1.35, fr * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();
      // Petal cluster
      ctx.fillStyle = colors[i % colors.length];
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = this.inkWidth * 0.36;
      ctx.beginPath();
      ctx.arc(px, py, fr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  // Sculpted garden hedge with lush organic leafy top puffs
  hedge(u, v, du, dv, h = 0.42, z = 0.02, col = "#698f53") {
    this.box(u, v, z, du, dv, h, col, { shadow: true, noPlinth: true, lw: 0.72, top: shade(col, 0.12) });
    if (this.reveal > 0.4) {
      const n = Math.max(3, Math.floor((du + dv) * 1.8));
      const r = rng(Math.floor(u * 19 + v * 37));
      for (let i = 0; i < n; i++) {
        const hu = u + 0.16 + r() * Math.max(0.05, du - 0.32);
        const hv = v + 0.16 + r() * Math.max(0.05, dv - 0.32);
        this.bush(hu, hv, z + h - 0.02, 0.48, shade(col, 0.05));
      }
    }
  }

  // Organic curved park footpath (smooth ribbon with warm gravel texture)
  curvedPath(pts, width = 0.85, fill = "#ebe2ce", z = 0.022) {
    const left = [], right = [];
    for (let i = 0; i < pts.length; i++) {
      const prev = pts[Math.max(0, i - 1)];
      const next = pts[Math.min(pts.length - 1, i + 1)];
      const du = next[0] - prev[0], dv = next[1] - prev[1];
      const len = Math.hypot(du, dv) || 1;
      const nu = (-dv / len) * width * 0.5;
      const nv = (du / len) * width * 0.5;
      left.push([pts[i][0] + nu, pts[i][1] + nv, z]);
      right.unshift([pts[i][0] - nu, pts[i][1] - nv, z]);
    }
    this.poly([...left, ...right], fill, "rgba(38,32,28,0.45)", 0.58, true, { gradTo: shade(fill, -0.05), washAlpha: 0.7 });
  }

  // Organic painterly pond/lake with smooth Bezier shoreline, depth wash, ripples & lotus pads!
  organicPond(cx, cy, rx, ry, color = "#88b8cc", opts = {}) {
    const z = opts.z ?? -0.03;
    const segs = 28;
    const shore = [];
    const rim = [];
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const wob = 1 + 0.11 * Math.sin(a * 3 + cx) + 0.06 * Math.cos(a * 5 + cy);
      shore.push([cx + Math.cos(a) * rx * wob, cy + Math.sin(a) * ry * wob, z]);
      rim.push([cx + Math.cos(a) * (rx * wob + 0.19), cy + Math.sin(a) * (ry * wob + 0.19), z + 0.03]);
    }
    this.poly(rim, opts.rimCol || "#dfd6c3", PALETTE.ink, 0.72, true, { washAlpha: 0.65 });
    this.poly(shore, color, PALETTE.ink, 0.82, true, { gradTo: shade(color, -0.1), washAlpha: 0.85 });

    // Layered watercolor shoreline foam + hand-inked wave squiggles + lotus pads!
    if (this.reveal > 0.45) {
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha *= clamp((this.reveal - 0.45) / 0.35);
      // Inner lighter shoreline rim
      const innerPts = shore.map((p) => this.pt(lerp(p[0], cx, 0.1), lerp(p[1], cy, 0.1), z + 0.005));
      ctx.strokeStyle = "rgba(255, 255, 255, 0.42)";
      ctx.lineWidth = this.inkWidth * 1.1;
      ctx.beginPath();
      ctx.moveTo(innerPts[0][0], innerPts[0][1]);
      for (let i = 1; i < innerPts.length; i++) ctx.lineTo(innerPts[i][0], innerPts[i][1]);
      ctx.closePath();
      ctx.stroke();

      const r = rng(Math.floor(cx * 53 + cy * 71));
      for (let i = 0; i < 10; i++) {
        const a = r() * Math.PI * 2, d = r() * 0.68;
        const ru = cx + Math.cos(a) * rx * d + Math.sin(this.t * 1.4 + i) * 0.14;
        const rv = cy + Math.sin(a) * ry * d;
        const p1 = this.pt(ru, rv, z), p2 = this.pt(ru + 0.42, rv, z);
        const mx = (p1[0] + p2[0]) * 0.5, my = (p1[1] + p2[1]) * 0.5;
        ctx.strokeStyle = i % 3 === 0 ? "rgba(42, 74, 92, 0.28)" : "rgba(255, 255, 255, 0.68)";
        ctx.lineWidth = this.inkWidth * 0.68;
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.quadraticCurveTo(mx, my - 2.0, p2[0], p2[1]);
        ctx.stroke();
      }
      if (opts.lilies) {
        for (let i = 0; i < opts.lilies; i++) {
          const a = r() * Math.PI * 2, d = 0.28 + r() * 0.46;
          const lu = cx + Math.cos(a) * rx * d, lv = cy + Math.sin(a) * ry * d;
          const [px, py] = this.pt(lu, lv, z + 0.01);
          ctx.fillStyle = "#6c9e5e";
          ctx.strokeStyle = PALETTE.ink;
          ctx.lineWidth = this.inkWidth * 0.45;
          ctx.beginPath();
          ctx.ellipse(px, py, this.scale * 0.19, this.scale * 0.1, 0, 0.25, Math.PI * 1.9);
          ctx.fill(); ctx.stroke();
          if (i % 2 === 0) {
            ctx.fillStyle = "#f6b6c8";
            ctx.beginPath(); ctx.arc(px, py - 1.4, this.scale * 0.07, 0, Math.PI * 2); ctx.fill();
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    }
  }

  // Painterly canal / river water with masonry quay walls, watercolor depth & animated wave squiggles!
  water(u, v, du, dv, color = "#88b7cb", opts = {}) {
    const z = opts.z ?? -0.06;
    if (z < 0) {
      this.poly([[u, v, 0], [u + du, v, 0], [u + du, v, z], [u, v, z]], "#bfb5a2", PALETTE.ink, 0.72);
      this.poly([[u, v, 0], [u, v + dv, 0], [u, v + dv, z], [u, v, z]], "#d5ccb9", PALETTE.ink, 0.72);
    }
    this.poly(
      [[u, v, z], [u + du, v, z], [u + du, v + dv, z], [u, v + dv, z]],
      color,
      PALETTE.ink,
      0.85,
      true,
      { gradTo: shade(color, -0.11), washAlpha: 0.9 }
    );
    // Soft pale-turquoise shoreline highlight along canal rim
    this.ground(u + 0.15, v + 0.15, du - 0.3, dv - 0.3, null, z + 0.005, "rgba(255,255,255,0.4)", 0.72);

    if (this.reveal > 0.45) {
      const a = clamp((this.reveal - 0.45) / 0.35);
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha *= a * 0.72;
      const n = opts.ripples ?? Math.max(9, Math.floor((du * dv) / 1.8));
      const r = rng(Math.floor((u + 13) * 97 + (v + 7) * 53));
      for (let i = 0; i < n; i++) {
        const ru = u + 0.3 + r() * Math.max(0.2, du - 0.8);
        const rv = v + 0.3 + r() * Math.max(0.2, dv - 0.7);
        const drift = Math.sin(this.t * 1.45 + r() * 6.28) * 0.2;
        const len = 0.32 + r() * 0.5;
        const p1 = this.pt(ru + drift, rv, z);
        const pm = this.pt(ru + drift + len * 0.5, rv, z);
        const p2 = this.pt(ru + drift + len, rv, z);
        ctx.strokeStyle = i % 3 === 0 ? "rgba(38, 68, 86, 0.28)" : "#f7fbfd";
        ctx.lineWidth = this.inkWidth * 0.72;
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.quadraticCurveTo(pm[0], pm[1] - 2.1, p2[0], p2[1]);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // =========================================================================
  // 10/10 ARCHITECTURAL PRIMITIVES (Multi-pane windows, arches, colonnades, pediments!)
  // =========================================================================

  box(u, v, z, du, dv, dz, baseColor, opts = {}) {
    const topCol = opts.top || shade(baseColor, 0.09);
    const leftCol = opts.left || baseColor;
    const rightCol = opts.right || shade(baseColor, -0.12);
    const stroke = opts.stroke === false ? null : opts.stroke || PALETTE.ink;
    const lw = opts.lw ?? 0.94;

    // Ground directional cast shadow
    if (opts.shadow !== false && z <= 0.08) {
      const sh = Math.min(dz * 0.34, 1.45);
      this.poly(
        [
          [u + du, v, z],
          [u + du + sh, v + sh * 0.45, z],
          [u + du + sh, v + dv + sh * 0.45, z],
          [u + sh, v + dv + sh * 0.45, z],
          [u, v + dv, z],
          [u + du, v + dv, z],
        ],
        PALETTE.shadow,
        null,
        0,
        true,
        { wash: false }
      );
    }

    // Left-front face (sunlit gouache vertical gradient!)
    this.poly(
      [[u, v + dv, z], [u + du, v + dv, z], [u + du, v + dv, z + dz], [u, v + dv, z + dz]],
      leftCol, stroke, lw, true, { gradTo: shade(leftCol, -0.055), washAlpha: 0.48 }
    );
    // Right-front face (shaded side gouache gradient!)
    this.poly(
      [[u + du, v, z], [u + du, v + dv, z], [u + du, v + dv, z + dz], [u + du, v, z + dz]],
      rightCol, stroke, lw, true, { gradTo: shade(rightCol, -0.065), washAlpha: 0.48 }
    );

    // Subtle under-cornice shadow strip along top of both walls (instant 3D realism!)
    if (dz >= 0.7 && !opts.noPlinth) {
      const shH = Math.min(0.14, dz * 0.12);
      this.poly([[u, v + dv, z + dz - shH], [u + du, v + dv, z + dz - shH], [u + du, v + dv, z + dz], [u, v + dv, z + dz]], "rgba(38,32,28,0.085)", null, 0, true, { wash: false });
      this.poly([[u + du, v, z + dz - shH], [u + du, v + dv, z + dz - shH], [u + du, v + dv, z + dz], [u + du, v, z + dz]], "rgba(38,32,28,0.11)", null, 0, true, { wash: false });
    }

    // Rusticated stone plinth band along ground floor
    if (opts.plinth || (opts.windows && dz >= 1.1 && !opts.noPlinth)) {
      const ph = Math.min(0.24, dz * 0.14);
      this.poly([[u, v + dv, z], [u + du, v + dv, z], [u + du, v + dv, z + ph], [u, v + dv, z + ph]], shade(leftCol, -0.07), PALETTE.ink, 0.46, true, { wash: false });
      this.poly([[u + du, v, z], [u + du, v + dv, z], [u + du, v + dv, z + ph], [u + du, v, z + ph]], shade(rightCol, -0.07), PALETTE.ink, 0.46, true, { wash: false });
    }

    // Multi-pane architectural windows, floor moldings, sills, mullions & balconies!
    if (opts.windows) {
      this._drawBoxWindows(u, v, z, du, dv, dz, opts.windows, leftCol, rightCol);
    }

    // Classical vertical pilasters dividing bays
    if (opts.pilasters) {
      const nU = Math.max(2, Math.floor(du / 1.05));
      const nV = Math.max(2, Math.floor(dv / 1.05));
      for (let i = 1; i < nU; i++) {
        const pu = u + (du * i) / nU;
        this.line([pu, v + dv, z + 0.12], [pu, v + dv, z + dz - 0.08], "rgba(38,32,28,0.3)", 0.58);
        this.line([pu + 0.04, v + dv, z + 0.12], [pu + 0.04, v + dv, z + dz - 0.08], "rgba(255,252,244,0.35)", 0.42);
      }
      for (let i = 1; i < nV; i++) {
        const pv = v + (dv * i) / nV;
        this.line([u + du, pv, z + 0.12], [u + du, pv, z + dz - 0.08], "rgba(38,32,28,0.34)", 0.58);
      }
    }

    // Delicate architectural ink hatching on shaded right face
    if (opts.hatch && this.reveal > 0.32) {
      const lines = Math.max(2, Math.floor(dv * 2.2));
      for (let i = 1; i < lines; i++) {
        const fv = v + (dv * i) / lines;
        this.line([u + du, fv, z + 0.08], [u + du, fv, z + dz - 0.08], "rgba(38,32,28,0.12)", 0.42);
      }
    }

    // Top face (with optional recessed roof parapet!)
    if (opts.noTop !== true) {
      this.poly([[u, v, z + dz], [u + du, v, z + dz], [u + du, v + dv, z + dz], [u, v + dv, z + dz]], topCol, stroke, lw, true, { gradTo: shade(topCol, -0.04), washAlpha: 0.45 });
      if (opts.parapet && du > 0.8 && dv > 0.8) {
        const p = 0.14;
        this.poly(
          [[u + p, v + p, z + dz], [u + du - p, v + p, z + dz], [u + du - p, v + dv - p, z + dz], [u + p, v + dv - p, z + dz]],
          shade(topCol, -0.08),
          "rgba(38,32,28,0.48)",
          0.58
        );
      }
    }

    // Stepped classical cornice ledge
    if (opts.cornice) {
      const c = 0.085;
      this.box(u - c, v - c, z + dz, du + c * 2, dv + c * 2, 0.12, shade(topCol, 0.05), {
        shadow: false,
        noPlinth: true,
        lw: 0.74,
      });
    }

    if (opts.rooftop && du >= 1.4 && dv >= 1.4) {
      this.rooftopProps(u, v, z + dz + (opts.cornice ? 0.12 : 0), du, dv);
    }
  }

  // Multi-pane recessed editorial windows (4-pane cross-mullions, reflective sky glass, stone sills & lintels!)
  _drawBoxWindows(u, v, z, du, dv, dz, winOpts, leftCol, rightCol) {
    const cfg = typeof winOpts === "object" ? winOpts : {};
    const floors = cfg.floors || Math.max(1, Math.floor(dz / 0.6));
    const colsU = cfg.colsU || Math.max(1, Math.floor(du / 0.52));
    const colsV = cfg.colsV || Math.max(1, Math.floor(dv / 0.52));
    const winCol = cfg.color || "#9bbac9";
    const winLit = cfg.lit || "#f6e2a2";
    const padZ = (dz - 0.16) / (floors + 0.25);

    if (cfg.band) {
      for (let f = 0; f < floors; f++) {
        const wz = z + 0.18 + f * padZ;
        const wh = padZ * 0.58;
        if (wz + wh > z + dz - 0.06) break;
        this.poly([[u + 0.07, v + dv, wz], [u + du - 0.07, v + dv, wz], [u + du - 0.07, v + dv, wz + wh], [u + 0.07, v + dv, wz + wh]], winCol, PALETTE.ink, 0.48, true, { gradTo: shade(winCol, -0.14), wash: false });
        // Diagonal sky sheen reflection streak on glass
        if (du > 0.7) {
          const sx = u + 0.18 + ((f * 0.27) % Math.max(0.3, du - 0.55));
          this.line([sx, v + dv, wz + 0.03], [sx + 0.2, v + dv, wz + wh - 0.03], "rgba(255,255,255,0.55)", 0.9);
        }
        const mU = Math.max(2, Math.floor(du / 0.42));
        for (let m = 1; m < mU; m++) {
          const mu = u + 0.07 + ((du - 0.14) * m) / mU;
          this.line([mu, v + dv, wz], [mu, v + dv, wz + wh], "rgba(38,32,28,0.36)", 0.38);
        }
        this.poly([[u + du, v + 0.07, wz], [u + du, v + dv - 0.07, wz], [u + du, v + dv - 0.07, wz + wh], [u + du, v + 0.07, wz + wh]], shade(winCol, -0.1), PALETTE.ink, 0.48, true, { gradTo: shade(winCol, -0.2), wash: false });
        const mV = Math.max(2, Math.floor(dv / 0.42));
        for (let m = 1; m < mV; m++) {
          const mv = v + 0.07 + ((dv - 0.14) * m) / mV;
          this.line([u + du, mv, wz], [u + du, mv, wz + wh], "rgba(38,32,28,0.38)", 0.38);
        }
      }
      return;
    }

    const r = rng(Math.floor((u + 5) * 131 + (v + 9) * 73));
    const marginU = 0.16;
    const stepU = (du - marginU * 2) / colsU;
    const marginV = 0.16;
    const stepV = (dv - marginV * 2) / colsV;
    const wW = Math.min(0.28, stepU * 0.58);
    const wV = Math.min(0.28, stepV * 0.58);
    const wH = Math.min(0.38, padZ * 0.62);

    for (let f = 0; f < floors; f++) {
      const wz = z + 0.22 + f * padZ;
      if (wz + wH > z + dz - 0.07) break;
      if (f > 0) {
        this.line([u, v + dv, wz - 0.08], [u + du, v + dv, wz - 0.08], "rgba(38,32,28,0.22)", 0.45);
        this.line([u + du, v, wz - 0.08], [u + du, v + dv, wz - 0.08], "rgba(38,32,28,0.25)", 0.45);
      }
      for (let c = 0; c < colsU; c++) {
        const wu = u + marginU + c * stepU + (stepU - wW) * 0.5;
        const lit = r() < (cfg.litChance ?? 0.22);
        const col = lit ? winLit : winCol;
        if (cfg.arched) {
          this.poly(
            [[wu, v + dv, wz], [wu + wW, v + dv, wz], [wu + wW, v + dv, wz + wH * 0.72], [wu + wW * 0.5, v + dv, wz + wH], [wu, v + dv, wz + wH * 0.72]],
            col, PALETTE.ink, 0.48, true, { gradTo: shade(col, -0.1), wash: false }
          );
        } else {
          this.poly([[wu, v + dv, wz], [wu + wW, v + dv, wz], [wu + wW, v + dv, wz + wH], [wu, v + dv, wz + wH]], col, PALETTE.ink, 0.48, true, { gradTo: shade(col, -0.1), wash: false });
        }
        // Crisp 4-pane white sash muntin cross + stone sill & lintel!
        if (wW > 0.14) {
          this.line([wu + wW * 0.5, v + dv, wz + 0.02], [wu + wW * 0.5, v + dv, wz + wH * 0.86], "rgba(255,255,255,0.62)", 0.4);
          this.line([wu + 0.02, v + dv, wz + wH * 0.48], [wu + wW - 0.02, v + dv, wz + wH * 0.48], "rgba(255,255,255,0.62)", 0.4);
        }
        this.line([wu - 0.035, v + dv, wz], [wu + wW + 0.035, v + dv, wz], PALETTE.ink, 0.62);
        if (!cfg.arched) {
          this.line([wu - 0.02, v + dv, wz + wH + 0.02], [wu + wW + 0.02, v + dv, wz + wH + 0.02], "rgba(38,32,28,0.4)", 0.45);
        }
        if (cfg.balconies && f >= 1) {
          this.line([wu - 0.045, v + dv + 0.03, wz + 0.11], [wu + wW + 0.045, v + dv + 0.03, wz + 0.11], PALETTE.ink, 0.7);
          this.line([wu, v + dv + 0.03, wz], [wu, v + dv + 0.03, wz + 0.11], PALETTE.ink, 0.45);
          this.line([wu + wW, v + dv + 0.03, wz], [wu + wW, v + dv + 0.03, wz + 0.11], PALETTE.ink, 0.45);
        }
      }
      for (let c = 0; c < colsV; c++) {
        const wv = v + marginV + c * stepV + (stepV - wV) * 0.5;
        const lit = r() < (cfg.litChance ?? 0.22);
        const col = lit ? winLit : shade(winCol, -0.09);
        if (cfg.arched) {
          this.poly(
            [[u + du, wv, wz], [u + du, wv + wV, wz], [u + du, wv + wV, wz + wH * 0.72], [u + du, wv + wV * 0.5, wz + wH], [u + du, wv, wz + wH * 0.72]],
            col, PALETTE.ink, 0.48, true, { gradTo: shade(col, -0.1), wash: false }
          );
        } else {
          this.poly([[u + du, wv, wz], [u + du, wv + wV, wz], [u + du, wv + wV, wz + wH], [u + du, wv, wz + wH]], col, PALETTE.ink, 0.48, true, { gradTo: shade(col, -0.1), wash: false });
        }
        if (wV > 0.14) {
          this.line([u + du, wv + wV * 0.5, wz + 0.02], [u + du, wv + wV * 0.5, wz + wH * 0.86], "rgba(255,255,255,0.52)", 0.38);
          this.line([u + du, wv + 0.02, wz + wH * 0.48], [u + du, wv + wV - 0.02, wz + wH * 0.48], "rgba(255,255,255,0.52)", 0.38);
        }
        this.line([u + du, wv - 0.035, wz], [u + du, wv + wV + 0.035, wz], PALETTE.ink, 0.62);
        if (cfg.balconies && f >= 1) {
          this.line([u + du + 0.03, wv - 0.045, wz + 0.11], [u + du + 0.03, wv + wV + 0.045, wz + 0.11], PALETTE.ink, 0.7);
        }
      }
    }
  }

  // TRUE HOLLOW VAULTED TRIUMPHAL ARCH (You see straight through the archway!)
  archGate(u, v, z, du, dv, dz, color = "#efe6d4", opts = {}) {
    const pierW = opts.pierW ?? du * 0.28;
    const archH = opts.archH ?? dz * 0.62;
    const atticH = dz - archH;
    // Left pier (back-left)
    this.box(u, v, z, pierW, dv, archH, color, { plinth: true, lw: 0.9 });
    // Recessed vaulted interior ceiling & back pier glimpse inside the hollow arch!
    const holeU0 = u + pierW, holeU1 = u + du - pierW;
    this.poly(
      [[holeU0, v, z], [holeU0, v + dv, z], [holeU0, v + dv, z + archH * 0.85], [holeU0, v, z + archH * 0.85]],
      shade(color, -0.22), PALETTE.ink, 0.65
    );
    this.poly(
      [[holeU0, v, z + archH * 0.82], [holeU1, v, z + archH * 0.82], [holeU1, v + dv, z + archH * 0.82], [holeU0, v + dv, z + archH * 0.82]],
      shade(color, -0.28), PALETTE.ink, 0.55
    );
    // Optional eternal flame or sculpture under arch
    if (opts.flame) {
      this.cylinder(u + du * 0.5, v + dv * 0.5, z + 0.02, 0.28, 0.08, "#b0a695", { lw: 0.5 });
      this.sphere(u + du * 0.5, v + dv * 0.5, z + 0.18, 0.1, "#f29438", { lw: 0.4 });
    }
    // Right pier
    this.box(u + du - pierW, v, z, pierW, dv, archH, color, { plinth: true, lw: 0.9 });
    // Sculpted arch spandrels framing the curved vault opening!
    const archPts = [];
    const steps = 10;
    const midU = u + du * 0.5, rx = (holeU1 - holeU0) * 0.5;
    archPts.push([holeU0, v + dv, z + archH]);
    archPts.push([holeU1, v + dv, z + archH]);
    archPts.push([holeU1, v + dv, z + archH * 0.52]);
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI;
      archPts.push([midU + Math.cos(a) * rx, v + dv, z + archH * 0.52 + Math.sin(a) * (archH * 0.42)]);
    }
    this.poly(archPts, color, PALETTE.ink, 0.85);
    // Projecting entablature cornice + sculpted attic story!
    this.box(u - 0.12, v - 0.12, z + archH, du + 0.24, dv + 0.24, 0.16, shade(color, 0.05), { shadow: false, noPlinth: true, lw: 0.78 });
    this.box(u - 0.04, v - 0.04, z + archH + 0.16, du + 0.08, dv + 0.08, atticH, color, {
      shadow: false, noPlinth: true, cornice: true, parapet: true, lw: 0.88,
    });
    // High-relief stone medallions & frieze shields along attic!
    const meds = Math.max(3, Math.floor(du * 1.4));
    for (let i = 0; i < meds; i++) {
      const mu = u + 0.32 + ((du - 0.64) * i) / Math.max(1, meds - 1);
      this.sphere(mu, v + dv + 0.05, z + archH + atticH * 0.58, 0.13, shade(color, -0.08), { lw: 0.5 });
    }
    // High-relief sculpture panels (e.g., La Marseillaise) on front piers!
    this.box(u + pierW * 0.18, v + dv - 0.02, z + 0.35, pierW * 0.64, 0.08, archH * 0.55, shade(color, -0.05), { shadow: false, noPlinth: true, lw: 0.55 });
    this.box(u + du - pierW * 0.82, v + dv - 0.02, z + 0.35, pierW * 0.64, 0.08, archH * 0.55, shade(color, -0.05), { shadow: false, noPlinth: true, lw: 0.55 });
  }

  // Row of freestanding classical fluted columns (neoclassical portico!)
  colonnade(u1, v1, u2, v2, z, h, count = 6, r = 0.11, col = "#f2ebdc") {
    for (let i = 0; i < count; i++) {
      const f = count === 1 ? 0.5 : i / (count - 1);
      const cu = lerp(u1, u2, f), cv = lerp(v1, v2, f);
      this.cylinder(cu, cv, z, r, h, col, { lw: 0.65, flutes: 4 });
      this.box(cu - r * 1.3, cv - r * 1.3, z + h - 0.06, r * 2.6, r * 2.6, 0.08, shade(col, 0.05), { shadow: false, noPlinth: true, lw: 0.45 });
    }
  }

  // Sculpted classical triangular pediment gable (like SF City Hall / Palais Garnier / Pantheon!)
  pediment(u, v, z, du, dv, h, color = "#efe6d5", axis = "u") {
    if (axis === "u") {
      const mu = u + du * 0.5;
      // Triangular stone face + recessed tympanum relief
      this.poly([[u, v + dv, z], [u + du, v + dv, z], [mu, v + dv, z + h]], color, PALETTE.ink, 0.9);
      this.poly([[u + 0.22, v + dv, z + 0.07], [u + du - 0.22, v + dv, z + 0.07], [mu, v + dv, z + h - 0.14]], shade(color, -0.09), PALETTE.ink, 0.55);
      // Sloped stone roof behind pediment
      this.poly([[u, v, z], [mu, v, z + h], [mu, v + dv, z + h], [u, v + dv, z]], shade(color, -0.06), PALETTE.ink, 0.78);
      this.poly([[u + du, v, z], [mu, v, z + h], [mu, v + dv, z + h], [u + du, v + dv, z]], shade(color, -0.15), PALETTE.ink, 0.78);
    } else {
      const mv = v + dv * 0.5;
      this.poly([[u + du, v, z], [u + du, v + dv, z], [u + du, mv, z + h]], shade(color, -0.08), PALETTE.ink, 0.9);
      this.poly([[u + du, v + 0.22, z + 0.07], [u + du, v + dv - 0.22, z + 0.07], [u + du, mv, z + h - 0.14]], shade(color, -0.17), PALETTE.ink, 0.55);
      this.poly([[u, v, z], [u, mv, z + h], [u + du, mv, z + h], [u + du, v, z]], shade(color, -0.04), PALETTE.ink, 0.78);
      this.poly([[u, v + dv, z], [u, mv, z + h], [u + du, mv, z + h], [u + du, v + dv, z]], shade(color, -0.12), PALETTE.ink, 0.78);
    }
  }

  // Rooftop editorial details (skylight, AC units, brick chimney, optional water tank!)
  rooftopProps(u, v, z, du, dv, opts = {}) {
    const r = rng(Math.floor(u * 41 + v * 67 + 7));
    this.box(u + du * 0.2, v + dv * 0.22, z, Math.min(0.75, du * 0.26), Math.min(0.55, dv * 0.26), 0.24, "#9cbcc9", { shadow: false, noPlinth: true, lw: 0.58 });
    this.box(u + du * 0.62, v + dv * 0.56, z, 0.36, 0.36, 0.24, "#d2cab9", { shadow: false, noPlinth: true, lw: 0.52 });
    if (opts.waterTank) {
      const wu = u + du * 0.45, wv = v + dv * 0.35;
      this.line([wu - 0.16, wv - 0.16, z], [wu - 0.16, wv - 0.16, z + 0.35], PALETTE.ink, 0.65);
      this.line([wu + 0.16, wv + 0.16, z], [wu + 0.16, wv + 0.16, z + 0.35], PALETTE.ink, 0.65);
      this.cylinder(wu, wv, z + 0.32, 0.24, 0.42, "#a87e58", { lw: 0.65 });
      this.dome(wu, wv, z + 0.74, 0.25, 0.14, "#8a6644", { finial: false, ribs: 4 });
    } else if (r() > 0.3) {
      this.box(u + du * 0.72, v + dv * 0.18, z, 0.26, 0.26, 0.5, "#b8745a", { shadow: false, noPlinth: true, lw: 0.55 });
    }
  }

  // Detailed Pitched Gable Roof with tile courses, ridge cap & optional chimney!
  gableRoof(u, v, z, du, dv, h, color, axis = "u", opts = {}) {
    const colA = color;
    const colB = shade(color, -0.14);
    const gableCol = shade(color, 0.15);
    if (axis === "u") {
      const mv = v + dv * 0.5;
      this.poly([[u, v, z], [u + du, v, z], [u + du, mv, z + h], [u, mv, z + h]], colA, PALETTE.ink, 0.85, true, { gradTo: shade(colA, -0.08) });
      this.poly([[u, v + dv, z], [u + du, v + dv, z], [u + du, mv, z + h], [u, mv, z + h]], shade(color, 0.04), PALETTE.ink, 0.92, true, { gradTo: shade(color, -0.07) });
      for (let i = 1; i <= 3; i++) {
        const f = i / 4;
        this.line([u, lerp(v + dv, mv, f), z + h * f], [u + du, lerp(v + dv, mv, f), z + h * f], "rgba(38,32,28,0.22)", 0.42);
      }
      const seams = Math.max(2, Math.floor(du / 0.72));
      for (let i = 1; i < seams; i++) {
        const su = u + (du * i) / seams;
        this.line([su, v + dv, z], [su, mv, z + h], "rgba(38,32,28,0.16)", 0.38);
      }
      this.poly([[u + du, v, z], [u + du, v + dv, z], [u + du, mv, z + h]], gableCol, PALETTE.ink, 0.92);
      this.line([u, mv, z + h + 0.03], [u + du, mv, z + h + 0.03], PALETTE.ink, 1.1);
      if (opts.chimney) {
        this.box(u + du * 0.25, mv - 0.14, z + h * 0.65, 0.32, 0.28, 0.62, "#b57258", { shadow: false, noPlinth: true, lw: 0.65 });
      }
    } else {
      const mu = u + du * 0.5;
      this.poly([[u, v, z], [u, v + dv, z], [mu, v + dv, z + h], [mu, v, z + h]], colA, PALETTE.ink, 0.85);
      this.poly([[u + du, v, z], [u + du, v + dv, z], [mu, v + dv, z + h], [mu, v, z + h]], colB, PALETTE.ink, 0.92, true, { gradTo: shade(colB, -0.07) });
      for (let i = 1; i <= 3; i++) {
        const f = i / 4;
        this.line([lerp(u + du, mu, f), v, z + h * f], [lerp(u + du, mu, f), v + dv, z + h * f], "rgba(38,32,28,0.22)", 0.42);
      }
      this.poly([[u, v + dv, z], [u + du, v + dv, z], [mu, v + dv, z + h]], gableCol, PALETTE.ink, 0.92);
    }
  }

  // Parisian Mansard Roof with standing zinc seams, pedimented dormers & terracotta chimney pots!
  mansardRoof(u, v, z, du, dv, h, color = "#758594", opts = {}) {
    const ins = Math.min(du, dv) * 0.2;
    const t0 = [u + ins, v + ins, z + h];
    const t1 = [u + du - ins, v + ins, z + h];
    const t2 = [u + du - ins, v + dv - ins, z + h];
    const t3 = [u + ins, v + dv - ins, z + h];
    this.poly([[u, v + dv, z], [u + du, v + dv, z], t2, t3], color, PALETTE.ink, 0.88, true, { gradTo: shade(color, -0.08) });
    this.poly([[u + du, v, z], [u + du, v + dv, z], t2, t1], shade(color, -0.14), PALETTE.ink, 0.88, true, { gradTo: shade(color, -0.2) });
    this.poly([t0, t1, t2, t3], shade(color, 0.12), PALETTE.ink, 0.82);

    const nU = Math.max(2, Math.floor(du / 0.8));
    for (let i = 1; i < nU; i++) {
      const f = i / nU;
      this.line([u + du * f, v + dv, z], [lerp(t3[0], t2[0], f), lerp(t3[1], t2[1], f), z + h], "rgba(38,32,28,0.26)", 0.44);
      if (opts.dormers !== false && du > 1.7 && i % 2 === 1) {
        const duW = 0.28;
        const xu = u + du * f - duW * 0.5;
        this.box(xu, v + dv - 0.14, z + 0.04, duW, 0.24, h * 0.62, "#f0e7d4", {
          shadow: false, noPlinth: true, lw: 0.5,
          windows: { floors: 1, colsU: 1, colsV: 1, color: "#8fb0c2", litChance: 0.3 },
        });
      }
    }
    const nV = Math.max(2, Math.floor(dv / 0.8));
    for (let i = 1; i < nV; i++) {
      const f = i / nV;
      this.line([u + du, v + dv * f, z], [lerp(t1[0], t2[0], f), lerp(t1[1], t2[1], f), z + h], "rgba(38,32,28,0.26)", 0.44);
    }
    if (opts.chimneys !== false && du >= 2.0) {
      for (const frac of [0.28, 0.72]) {
        const cx = u + du * frac, cy = v + dv * 0.35;
        this.box(cx, cy, z + h, 0.28, 0.24, 0.38, "#c7896c", { shadow: false, noPlinth: true, lw: 0.52 });
        this.cylinder(cx + 0.08, cy + 0.12, z + h + 0.38, 0.045, 0.12, "#d89a78", { lw: 0.4 });
        this.cylinder(cx + 0.2, cy + 0.12, z + h + 0.38, 0.045, 0.12, "#d89a78", { lw: 0.4 });
      }
    }
  }

  // Sweeping Concave East Asian Pagoda Roof with ribbed ceramic tiles & golden dragon ridge!
  pagodaRoof(u, v, z, du, dv, h, color = "#474e58", trimCol = "#c74838") {
    const ov = 0.36;
    const ru = u - ov, rv = v - ov, rdu = du + ov * 2, rdv = dv + ov * 2;
    const mu = u + du * 0.5, mv = v + dv * 0.5;
    const rLen = Math.max(0.16, (du - dv) * 0.36);
    const pA = [mu - Math.max(0, rLen), mv - Math.max(0, -rLen), z + h];
    const pB = [mu + Math.max(0, rLen), mv + Math.max(0, -rLen), z + h];
    const up = 0.16;

    this.poly([[ru, rv + rdv, z + up * 0.3], [ru + rdu, rv + rdv, z + up * 0.3], [u + du, v + dv, z + 0.08], [u, v + dv, z + 0.08]], trimCol, PALETTE.ink, 0.65);
    this.poly([[ru + rdu, rv, z + up * 0.3], [ru + rdu, rv + rdv, z + up * 0.3], [u + du, v + dv, z + 0.08], [u + du, v, z + 0.08]], shade(trimCol, -0.15), PALETTE.ink, 0.65);

    this.poly([[ru, rv, z + up], [ru + rdu, rv, z + up], pB, pA], shade(color, 0.07), PALETTE.ink, 0.85);
    this.poly([[ru, rv + rdv, z + up], [ru + rdu * 0.5, rv + rdv, z + 0.01], [ru + rdu, rv + rdv, z + up], pB, pA], color, PALETTE.ink, 0.92, true, { gradTo: shade(color, -0.09) });
    this.poly([[ru + rdu, rv, z + up], [ru + rdu, rv + rdv * 0.5, z + 0.01], [ru + rdu, rv + rdv, z + up], pB], shade(color, -0.14), PALETTE.ink, 0.92);

    const ribsU = Math.max(3, Math.floor(rdu / 0.5));
    for (let i = 1; i < ribsU; i++) {
      const f = i / ribsU;
      this.line([ru + rdu * f, rv + rdv, z + 0.05], [lerp(pA[0], pB[0], f), lerp(pA[1], pB[1], f), z + h], "rgba(255,255,255,0.18)", 0.45);
    }
    const ribsV = Math.max(2, Math.floor(rdv / 0.55));
    for (let i = 1; i < ribsV; i++) {
      const f = i / ribsV;
      this.line([ru + rdu, rv + rdv * f, z + 0.05], pB, "rgba(255,255,255,0.15)", 0.42);
    }
    this.line([pA[0], pA[1], pA[2] + 0.07], [pB[0], pB[1], pB[2] + 0.07], "#e2bb55", 1.9);
    this.sphere(pA[0], pA[1], pA[2] + 0.13, 0.095, "#e2bb55", { lw: 0.45 });
    this.sphere(pB[0], pB[1], pB[2] + 0.13, 0.095, "#e2bb55", { lw: 0.45 });
  }

  pyramid(u, v, z, du, dv, h, color, opts = {}) {
    const apex = [u + du * 0.5, v + dv * 0.5, z + h];
    const colL = opts.left || color;
    const colR = opts.right || shade(color, -0.14);
    this.poly([[u, v + dv, z], [u + du, v + dv, z], apex], colL, PALETTE.ink, 0.92, true, { gradTo: shade(colL, -0.07) });
    this.poly([[u + du, v, z], [u + du, v + dv, z], apex], colR, PALETTE.ink, 0.92, true, { gradTo: shade(colR, -0.08) });
    if (opts.lattice) {
      const n = opts.lattice;
      for (let i = 1; i < n; i++) {
        const f = i / n;
        this.line([lerp(u, apex[0], f), lerp(v + dv, apex[1], f), z + h * f], [lerp(u + du, apex[0], f), lerp(v + dv, apex[1], f), z + h * f], PALETTE.ink, 0.44);
        this.line([lerp(u + du, apex[0], f), lerp(v, apex[1], f), z + h * f], [lerp(u + du, apex[0], f), lerp(v + dv, apex[1], f), z + h * f], PALETTE.ink, 0.44);
        this.line([u + du * f, v + dv, z], apex, PALETTE.ink, 0.42);
        this.line([u + du, v + dv * f, z], apex, PALETTE.ink, 0.42);
      }
    }
  }

  cylinder(u, v, z, r, h, color, opts = {}) {
    const segs = opts.segs || 18;
    const [bx, by] = this.pt(u, v, z);
    const [tx, ty] = this.pt(u, v, z + h);
    const rx = r * this.scale * 1.414;
    const ry = r * this.scale * 0.707;
    const bodyPts = [];
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI;
      bodyPts.push([bx + Math.cos(a) * rx, by + Math.sin(a) * ry]);
    }
    for (let i = segs; i >= 0; i--) {
      const a = (i / segs) * Math.PI;
      bodyPts.push([tx + Math.cos(a) * rx, ty + Math.sin(a) * ry]);
    }
    const ctx = this.ctx;
    const cylGrad = ctx.createLinearGradient(bx - rx, by, bx + rx, by);
    cylGrad.addColorStop(0, shade(color, 0.1));
    cylGrad.addColorStop(0.42, color);
    cylGrad.addColorStop(1, shade(color, -0.17));
    this.screenPoly(bodyPts, this.reveal >= 0.999 ? cylGrad : color, PALETTE.ink, opts.lw ?? 0.9, true, { wash: true, washAlpha: 0.4 });

    if (opts.flutes) {
      for (let i = 1; i < opts.flutes; i++) {
        const a = (i / opts.flutes) * Math.PI;
        this.screenPoly([[bx + Math.cos(a) * rx, by + Math.sin(a) * ry], [tx + Math.cos(a) * rx, ty + Math.sin(a) * ry]], null, "rgba(38,32,28,0.34)", 0.46, false);
      }
    }
    this.screenPoly(bodyPts, null, PALETTE.ink, opts.lw ?? 0.88);

    if (opts.noTop !== true) {
      const topPts = [];
      for (let i = 0; i < segs * 2; i++) {
        const a = (i / (segs * 2)) * Math.PI * 2;
        topPts.push([tx + Math.cos(a) * rx, ty + Math.sin(a) * ry]);
      }
      this.screenPoly(topPts, opts.top || shade(color, 0.11), PALETTE.ink, opts.lw ?? 0.88);
    }
  }

  dome(u, v, z, r, h, color, opts = {}) {
    const [bx, by] = this.pt(u, v, z);
    const rx = r * this.scale * 1.4;
    const ry = r * this.scale * 0.68;
    const hp = h * this.scale * ISO.zScale;
    const pts = [];
    const steps = 16;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI;
      pts.push([bx + Math.cos(a) * rx, by + Math.sin(a) * ry]);
    }
    for (let i = 0; i <= steps; i++) {
      const a = Math.PI - (i / steps) * Math.PI;
      pts.push([bx + Math.cos(a) * rx, by - Math.sin(a) * hp * (opts.pointed ? Math.pow(Math.sin(a), 0.22) : 1)]);
    }
    const ctx = this.ctx;
    const gr = ctx.createRadialGradient(bx - rx * 0.32, by - hp * 0.55, rx * 0.08, bx + rx * 0.1, by - hp * 0.2, rx * 1.35);
    gr.addColorStop(0, shade(color, 0.16));
    gr.addColorStop(0.55, color);
    gr.addColorStop(1, shade(color, -0.18));
    this.screenPoly(pts, this.reveal >= 0.999 ? gr : color, PALETTE.ink, 0.92, true, { wash: true, washAlpha: 0.4 });

    const ribs = opts.ribs ?? 6;
    const ribCol = opts.goldRibs ? "#d6b050" : "rgba(38,32,28,0.44)";
    for (let i = 1; i < ribs; i++) {
      const k = (i / ribs) * 2 - 1;
      const rPts = [];
      for (let s = 0; s <= 9; s++) {
        const a = (s / 9) * (Math.PI * 0.5);
        rPts.push([bx + k * Math.cos(a) * rx, by + Math.sin(Math.acos(k)) * ry * (1 - s / 9) - Math.sin(a) * hp]);
      }
      this.screenPoly(rPts, null, ribCol, opts.goldRibs ? 1.0 : 0.52, false);
    }
    this.screenPoly(pts, null, PALETTE.ink, 0.92);

    if (opts.finial !== false) {
      this.cylinder(u, v, z + h * 0.92, r * 0.22, h * 0.26, opts.finialCol || "#e8dbb8", { lw: 0.72, flutes: 5 });
      this.dome(u, v, z + h * 1.16, r * 0.22, h * 0.17, opts.finialCol || "#e6c158", { finial: false, ribs: 3 });
      this.line([u, v, z + h * 1.32], [u, v, z + h * 1.6], PALETTE.ink, 0.95);
    }
  }

  sphere(u, v, z, r, color, opts = {}) {
    const [cx, cy] = this.pt(u, v, z);
    const px = r * this.scale;
    const ph = this._phase(0.35);
    if (!ph.visible) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, px, 0, Math.PI * 2);
    if (ph.fillP >= 0.999) {
      const gr = ctx.createRadialGradient(cx - px * 0.3, cy - px * 0.3, px * 0.1, cx, cy, px);
      gr.addColorStop(0, shade(color, 0.22));
      gr.addColorStop(0.65, color);
      gr.addColorStop(1, shade(color, -0.15));
      ctx.fillStyle = gr;
    } else {
      ctx.fillStyle = mixHex(PALETTE.paper, color, ph.fillP);
    }
    ctx.fill();
    if (opts.lw !== 0) {
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = this.inkWidth * (opts.lw ?? 0.82);
      ctx.stroke();
    }
    ctx.restore();
  }

  // =========================================================================
  // 10/10 MICRO-PROPS & STORYTELLING VIGNETTES
  // =========================================================================

  bench(u, v, z = 0.02, axis = "u") {
    this.softShadow(u, v, 0.42, 0.18, z, 0.14);
    const du = axis === "u" ? 0.72 : 0.26;
    const dv = axis === "u" ? 0.26 : 0.72;
    this.box(u - du * 0.5, v - dv * 0.5, z + 0.14, du, dv, 0.08, "#a67549", { shadow: false, noPlinth: true, lw: 0.55 });
    if (axis === "u") {
      this.box(u - du * 0.5, v - dv * 0.5, z + 0.22, du, 0.06, 0.2, "#8f633c", { shadow: false, noPlinth: true, lw: 0.5 });
      this.line([u - du * 0.4, v + dv * 0.4, z], [u - du * 0.4, v + dv * 0.4, z + 0.16], PALETTE.ink, 0.78);
      this.line([u + du * 0.4, v + dv * 0.4, z], [u + du * 0.4, v + dv * 0.4, z + 0.16], PALETTE.ink, 0.78);
    } else {
      this.box(u - du * 0.5, v - dv * 0.5, z + 0.22, 0.06, dv, 0.2, "#8f633c", { shadow: false, noPlinth: true, lw: 0.5 });
      this.line([u + du * 0.4, v - dv * 0.4, z], [u + du * 0.4, v - dv * 0.4, z + 0.16], PALETTE.ink, 0.78);
      this.line([u + du * 0.4, v + dv * 0.4, z], [u + du * 0.4, v + dv * 0.4, z + 0.16], PALETTE.ink, 0.78);
    }
  }

  lamp(u, v, z = 0.02, style = "classic") {
    this.softShadow(u, v, 0.2, 0.1, z, 0.15);
    if (style === "toro") {
      this.box(u - 0.13, v - 0.13, z, 0.26, 0.26, 0.5, "#c2bba9", { shadow: false, noPlinth: true, lw: 0.58 });
      this.box(u - 0.17, v - 0.17, z + 0.5, 0.34, 0.34, 0.24, "#f9e5a2", { shadow: false, noPlinth: true, lw: 0.52 });
      this.pyramid(u - 0.26, v - 0.26, z + 0.74, 0.52, 0.52, 0.26, "#a8a091");
      return;
    }
    this.cylinder(u, v, z, 0.075, 0.24, "#373c40", { lw: 0.5 });
    this.line([u, v, z + 0.22], [u, v, z + 1.02], "#32373b", 1.05);
    // Warm soft lantern halo
    const [gx, gy] = this.pt(u, v, z + 1.08);
    if (this.reveal > 0.7) {
      const ctx = this.ctx;
      ctx.save();
      const gr = ctx.createRadialGradient(gx, gy, 0, gx, gy, this.scale * 0.34);
      gr.addColorStop(0, "rgba(255, 236, 165, 0.42)");
      gr.addColorStop(1, "rgba(255, 236, 165, 0)");
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(gx, gy, this.scale * 0.34, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    this.sphere(u, v, z + 1.08, 0.12, "#fdf2c6", { lw: 0.52 });
    this.sphere(u, v, z + 1.19, 0.055, "#32373b", { lw: 0.4 });
  }

  awning(u, v, z, len, depth = 0.65, axis = "u", col1 = "#be443b", col2 = "#faf4e6") {
    const stripes = Math.max(4, Math.floor(len * 2.6));
    for (let i = 0; i < stripes; i++) {
      const f0 = i / stripes, f1 = (i + 1) / stripes;
      const col = i % 2 === 0 ? col1 : col2;
      if (axis === "u") {
        this.poly(
          [[u + len * f0, v, z + 0.26], [u + len * f1, v, z + 0.26], [u + len * f1, v + depth, z], [u + len * f0, v + depth, z]],
          col, PALETTE.ink, 0.54
        );
        // Scalloped front fringe flap!
        this.poly(
          [[u + len * f0, v + depth, z], [u + len * f1, v + depth, z], [u + len * f1, v + depth, z - 0.1], [u + len * f0, v + depth, z - 0.1]],
          shade(col, -0.1), PALETTE.ink, 0.45
        );
      } else {
        this.poly(
          [[u, v + len * f0, z + 0.26], [u, v + len * f1, z + 0.26], [u + depth, v + len * f1, z], [u + depth, v + len * f0, z]],
          col, PALETTE.ink, 0.54
        );
        this.poly(
          [[u + depth, v + len * f0, z], [u + depth, v + len * f1, z], [u + depth, v + len * f1, z - 0.1], [u + depth, v + len * f0, z - 0.1]],
          shade(col, -0.1), PALETTE.ink, 0.45
        );
      }
    }
  }

  // Parisian/Street Bistro Café Set with tablecloth, chairs, coffee cups & optional seated diners!
  cafeSet(u, v, z = 0.02, umbrellaCol = null, diners = false) {
    this.softShadow(u, v, 0.55, 0.28, z, 0.15);
    this.cylinder(u, v, z, 0.26, 0.36, "#fbf7ee", { lw: 0.6 });
    // Tiny cups/plates on table
    this.sphere(u - 0.09, v, z + 0.39, 0.045, "#d86452", { lw: 0.35 });
    this.sphere(u + 0.09, v + 0.04, z + 0.39, 0.045, "#f5e39e", { lw: 0.35 });
    // Bistro chairs
    this.box(u - 0.44, v - 0.09, z, 0.18, 0.18, 0.24, "#6f533e", { shadow: false, noPlinth: true, lw: 0.48 });
    this.box(u + 0.26, v - 0.09, z, 0.18, 0.18, 0.24, "#6f533e", { shadow: false, noPlinth: true, lw: 0.48 });
    if (diners) {
      this.person(u - 0.36, v + 0.06, z + 0.08, { shirt: "#4a738f", sit: true, seed: Math.floor(u * 13) });
      this.person(u + 0.36, v + 0.06, z + 0.08, { shirt: "#d66858", sit: true, dress: true, seed: Math.floor(v * 17) });
    }
    if (umbrellaCol) {
      this.line([u, v, z + 0.36], [u, v, z + 1.12], PALETTE.ink, 0.85);
      this.dome(u, v, z + 1.02, 0.62, 0.34, umbrellaCol, { finial: false, ribs: 8 });
    }
  }

  // Packed Lively Market Stall with wooden crates, striped fringed canopy & overflowing goods!
  stall(u, v, z = 0.02, du = 1.45, dv = 0.82, col1 = "#c8483c", col2 = "#faf4e6", wares = ["#e67c8c", "#f0c854", "#84b06b", "#e0844a"]) {
    this.softShadow(u + du * 0.5, v + dv * 0.5, du * 0.62, dv * 0.48, z, 0.16);
    this.box(u, v, z, du, dv, 0.46, "#a6794f", { shadow: false, noPlinth: true, lw: 0.68 });
    // Wooden display crates with stacked fruit/goods
    for (let i = 0; i < wares.length; i++) {
      const wu = u + 0.22 + (i / Math.max(1, wares.length - 1)) * (du - 0.44);
      this.box(wu - 0.15, v + dv * 0.22, z + 0.46, 0.3, dv * 0.56, 0.12, "#c69e70", { shadow: false, noPlinth: true, lw: 0.45 });
      this.sphere(wu - 0.05, v + dv * 0.48, z + 0.62, 0.095, wares[i], { lw: 0.38 });
      this.sphere(wu + 0.06, v + dv * 0.54, z + 0.61, 0.09, shade(wares[i], 0.1), { lw: 0.38 });
    }
    // Corner timber poles + striped fringed awning
    this.line([u + 0.05, v + 0.05, z + 0.46], [u + 0.05, v + 0.05, z + 1.18], PALETTE.ink, 0.72);
    this.line([u + du - 0.05, v + 0.05, z + 0.46], [u + du - 0.05, v + 0.05, z + 1.18], PALETTE.ink, 0.72);
    this.line([u + 0.05, v + dv - 0.05, z + 0.46], [u + 0.05, v + dv - 0.05, z + 0.98], PALETTE.ink, 0.72);
    this.line([u + du - 0.05, v + dv - 0.05, z + 0.46], [u + du - 0.05, v + dv - 0.05, z + 0.98], PALETTE.ink, 0.72);
    this.awning(u - 0.08, v - 0.06, z + 0.95, du + 0.16, dv + 0.16, "u", col1, col2);
  }

  // Park Picnic Blanket Vignette (checkered blanket + lounging people + basket + optional parasol!)
  picnic(u, v, z = 0.025, col = "#d95b54", seed = 1) {
    this.ground(u - 0.65, v - 0.48, 1.3, 0.96, col, z, PALETTE.ink, 0.55);
    this.ground(u - 0.52, v - 0.36, 1.04, 0.72, "#faf5e8", z + 0.005, null);
    this.ground(u - 0.52, v - 0.1, 1.04, 0.22, col, z + 0.008, null);
    this.ground(u - 0.12, v - 0.36, 0.24, 0.72, col, z + 0.008, null);
    // Woven picnic basket + snacks
    this.box(u + 0.18, v - 0.22, z + 0.01, 0.26, 0.2, 0.18, "#be915e", { shadow: false, noPlinth: true, lw: 0.48 });
    // Seated picnickers!
    this.person(u - 0.28, v + 0.06, z + 0.02, { shirt: "#4d7894", sit: true, seed: seed * 3 });
    this.person(u + 0.22, v + 0.24, z + 0.02, { shirt: "#e2a648", sit: true, dress: true, hat: "sunhat", seed: seed * 7 });
  }

  // Street Portrait Artist / Painter at Wooden Easel!
  painter(u, v, z = 0.02, seed = 1) {
    this.softShadow(u, v, 0.35, 0.18, z, 0.14);
    // Tripod easel
    this.line([u - 0.18, v - 0.12, z], [u, v - 0.12, z + 0.85], "#6b4c32", 0.75);
    this.line([u + 0.18, v - 0.12, z], [u, v - 0.12, z + 0.85], "#6b4c32", 0.75);
    this.line([u, v - 0.32, z], [u, v - 0.12, z + 0.85], "#6b4c32", 0.65);
    // Painted canvas on easel
    this.box(u - 0.22, v - 0.15, z + 0.34, 0.44, 0.07, 0.42, "#faf5e6", { shadow: false, noPlinth: true, lw: 0.55 });
    this.poly([[u - 0.16, v - 0.07, z + 0.4], [u + 0.16, v - 0.07, z + 0.4], [u + 0.16, v - 0.07, z + 0.66], [u - 0.16, v - 0.07, z + 0.66]], "#82aec0", null, 0, true, { wash: false });
    this.person(u - 0.35, v + 0.26, z, { shirt: "#3d546e", hat: "beret", wave: true, seed });
  }

  // Animated Cyclist pedaling a two-wheel bicycle!
  cyclist(u, v, z = 0.02, opts = {}) {
    if (this.lifeAlpha < 0.1) return;
    const [bx, by] = this.pt(u, v, z);
    const s = this.scale * 0.46;
    const axis = opts.axis || "u";
    const dir = opts.dir || 1;
    const dx = (axis === "u" ? 1 : -1) * dir * s * 0.55;
    const dy = s * 0.26 * dir;
    const ctx = this.ctx;
    ctx.save();
    // Shadow
    ctx.fillStyle = PALETTE.shadow;
    ctx.beginPath();
    ctx.ellipse(bx, by + s * 0.12, s * 0.72, s * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();
    // Two wheels
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = this.inkWidth * 0.9;
    ctx.beginPath(); ctx.arc(bx - dx * 0.6, by - s * 0.28 - dy * 0.4, s * 0.28, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(bx + dx * 0.6, by - s * 0.28 + dy * 0.4, s * 0.28, 0, Math.PI * 2); ctx.stroke();
    // Bicycle frame
    ctx.strokeStyle = opts.bikeCol || "#c84c40";
    ctx.lineWidth = this.inkWidth * 1.05;
    ctx.beginPath();
    ctx.moveTo(bx - dx * 0.6, by - s * 0.28 - dy * 0.4);
    ctx.lineTo(bx, by - s * 0.56);
    ctx.lineTo(bx + dx * 0.6, by - s * 0.28 + dy * 0.4);
    ctx.moveTo(bx, by - s * 0.56);
    ctx.lineTo(bx, by - s * 0.26);
    ctx.stroke();
    ctx.restore();
    // Rider seated slightly above bicycle frame
    this.person(u, v, z + 0.16, { shirt: opts.shirt || "#4e7c94", sit: true, seed: opts.seed || 7, scale: 0.92 });
  }

  // Festive Bunting Pennant String strung between two points!
  bunting(u1, v1, u2, v2, z, count = 7, colors = ["#d84c42", "#e8b84c", "#4e84a3", "#74a364"]) {
    this.line([u1, v1, z], [u2, v2, z], PALETTE.ink, 0.52);
    for (let i = 1; i <= count; i++) {
      const f = i / (count + 1);
      const sag = Math.sin(f * Math.PI) * 0.26;
      const flutter = Math.sin(this.t * 4.5 + i * 1.1) * 0.03;
      const pu = lerp(u1, u2, f), pv = lerp(v1, v2, f), pz = z - sag;
      const [px, py] = this.pt(pu, pv, pz);
      const sz = this.scale * 0.16;
      this.screenPoly([[px - sz * 0.6, py], [px + sz * 0.6, py], [px + flutter * this.scale, py + sz * 1.25]], colors[i % colors.length], PALETTE.ink, 0.42);
    }
  }

  // Painterly Translucent Watercolor Drifting Cloud (just like ref_02.png — ZERO black outline!)
  watercolorCloud(u, v, z, sc = 1.0) {
    if (this.reveal < 0.55) return;
    const drift = Math.sin(this.t * 0.42 + u * 0.6) * 0.75;
    const [cx, cy] = this.pt(u + drift, v, z);
    const s = this.scale * sc;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha *= clamp((this.reveal - 0.55) / 0.35) * 0.86;
    const puffs = [
      [-0.85, 0.08, 0.55], [-0.42, -0.14, 0.62], [0.08, -0.22, 0.72],
      [0.58, -0.06, 0.54], [0.95, 0.1, 0.42], [0.0, 0.12, 0.68],
    ];
    for (const [ox, oy, r] of puffs) {
      const px = cx + ox * s, py = cy + oy * s, pr = r * s;
      const gr = ctx.createRadialGradient(px - pr * 0.15, py - pr * 0.2, pr * 0.1, px, py, pr);
      gr.addColorStop(0, "rgba(255, 254, 250, 0.92)");
      gr.addColorStop(0.65, "rgba(252, 249, 240, 0.68)");
      gr.addColorStop(1, "rgba(252, 249, 240, 0)");
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.ellipse(px, py, pr * 1.15, pr * 0.68, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  railing(p1, p2, z = 0.02, h = 0.34, col = "#353b40") {
    this.line([p1[0], p1[1], z + h], [p2[0], p2[1], z + h], col, 0.88);
    this.line([p1[0], p1[1], z + h * 0.46], [p2[0], p2[1], z + h * 0.46], col, 0.52);
    const dist = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const posts = Math.max(2, Math.floor(dist * 2.4));
    for (let i = 0; i <= posts; i++) {
      const f = i / posts;
      const pu = lerp(p1[0], p2[0], f), pv = lerp(p1[1], p2[1], f);
      this.line([pu, pv, z], [pu, pv, z + h], col, 0.55);
    }
  }

  stairs(u, v, z0, z1, du, dv, steps = 6, axis = "v", col = "#eee6d6") {
    for (let i = 0; i < steps; i++) {
      const f = i / steps;
      if (axis === "v") {
        this.box(u, v + dv * f, z0, du, dv / steps + 0.04, (z1 - z0) * (1 - f), col, { shadow: false, noPlinth: true, lw: 0.52 });
      } else {
        this.box(u + du * f, v, z0, du / steps + 0.04, dv, (z1 - z0) * (1 - f), col, { shadow: false, noPlinth: true, lw: 0.52 });
      }
    }
  }

  bird(u, v, z, phase = 0) {
    if (this.lifeAlpha < 0.15) return;
    const [bx, by] = this.pt(u, v, z);
    const s = this.scale * 0.18;
    const flap = Math.sin(this.t * 8.5 + phase) * s * 0.85;
    this.screenPoly([[bx - s, by - flap], [bx, by], [bx + s, by - flap]], null, PALETTE.ink, 0.82, false);
  }

  dog(u, v, z = 0.02, col = "#b58152", seed = 0) {
    if (this.lifeAlpha < 0.15) return;
    const [bx, by] = this.pt(u, v, z);
    const s = this.scale * 0.17;
    const wag = Math.sin(this.t * 14 + seed) * s * 0.45;
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = PALETTE.shadow;
    ctx.beginPath(); ctx.ellipse(bx, by + s * 0.08, s * 1.1, s * 0.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    this.screenPoly([[bx - s, by - s * 0.92], [bx + s, by - s * 0.92], [bx + s, by - s * 0.24], [bx - s, by - s * 0.24]], col, PALETTE.ink, 0.58);
    this.screenPoly([[bx + s * 0.6, by - s * 1.45], [bx + s * 1.28, by - s * 1.45], [bx + s * 1.28, by - s * 0.8], [bx + s * 0.6, by - s * 0.8]], col, PALETTE.ink, 0.55);
    this.screenPoly([[bx - s * 0.7, by - s * 0.24], [bx - s * 0.7, by]], null, PALETTE.ink, 0.65, false);
    this.screenPoly([[bx + s * 0.7, by - s * 0.24], [bx + s * 0.7, by]], null, PALETTE.ink, 0.65, false);
    this.screenPoly([[bx - s, by - s * 0.82], [bx - s * 1.55, by - s * 1.35 + wag]], null, PALETTE.ink, 0.65, false);
  }

  ferrisWheel(u, v, z, radius, axis, spokes, color, podColor, opts = {}) {
    const speed = opts.speed ?? 0.24;
    const angle0 = this.t * speed;
    const zCenter = z + radius + 0.5;
    const dirU = axis === "u" ? 1 : 0;
    const dirV = axis === "v" ? 1 : 0;
    const perpU = axis === "u" ? 0 : 1;
    const perpV = axis === "v" ? 1 : 0;

    this.box(u - 0.9, v - 0.9, z, 1.8, 1.8, 0.22, "#ded6c4", { shadow: false, noPlinth: true });
    this.line([u - perpU * 1.05, v - perpV * 1.05, z + 0.2], [u, v, zCenter], PALETTE.ink, 1.85);
    this.line([u - dirU * 0.85 - perpU * 0.5, v - dirV * 0.85 - perpV * 0.5, z + 0.2], [u, v, zCenter], PALETTE.ink, 1.45);

    const rimPts = [], innerPts = [];
    const segs = 36;
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const du = Math.cos(a) * radius * dirU;
      const dv = Math.cos(a) * radius * dirV;
      const dz = Math.sin(a) * radius;
      rimPts.push(this.pt(u + du, v + dv, zCenter + dz));
      innerPts.push(this.pt(u + du * 0.86, v + dv * 0.86, zCenter + dz * 0.86));
    }
    for (let i = 0; i < segs; i += 2) {
      this.screenPoly([rimPts[i], innerPts[(i + 1) % segs]], null, "rgba(38,32,28,0.38)", 0.45, false);
    }
    this.screenPoly(rimPts, null, color, 2.5, true);
    this.screenPoly(rimPts, null, PALETTE.ink, 0.9, true);
    this.screenPoly(innerPts, null, PALETTE.ink, 0.65, true);

    for (let i = 0; i < spokes; i++) {
      const a = angle0 + (i / spokes) * Math.PI * 2;
      const du = Math.cos(a) * radius * dirU;
      const dv = Math.cos(a) * radius * dirV;
      const dz = Math.sin(a) * radius;
      this.line([u, v, zCenter], [u + du, v + dv, zCenter + dz], "rgba(38,32,28,0.42)", 0.5);
      const [px, py] = this.pt(u + du, v + dv, zCenter + dz);
      const pr = (opts.podSize ?? 0.24) * this.scale;
      this.screenPoly(
        [[px - pr, py - pr * 0.45], [px - pr * 0.5, py - pr * 0.72], [px + pr * 0.5, py - pr * 0.72], [px + pr, py - pr * 0.45], [px + pr * 0.85, py + pr * 0.6], [px - pr * 0.85, py + pr * 0.6]],
        podColor, PALETTE.ink, 0.72
      );
    }
    this.line([u + perpU * 1.05, v + perpV * 1.05, z + 0.2], [u, v, zCenter], PALETTE.ink, 1.85);
    this.sphere(u, v, zCenter, 0.22, color, { lw: 0.9 });
  }

  // =========================================================================
  // 10/10 SMOOTH ORGANIC BEZIER TREES (Zero angular polygons! Watercolor shading!)
  // =========================================================================
  tree(u, v, z = 0, style = "round", sc = 1.0) {
    const ph = this._phase(0.75);
    if (!ph.visible) return;
    const [bx, by] = this.pt(u, v, z);
    const s = this.scale * sc;
    const sway = Math.sin(this.t * 1.65 + u * 1.7 + v * 2.3) * 1.5 * sc;
    const ctx = this.ctx;

    ctx.save();
    // Soft organic elliptical cast foliage shadow on ground!
    if (ph.fillP > 0.3) {
      ctx.fillStyle = "rgba(42, 33, 24, 0.16)";
      ctx.beginPath();
      ctx.ellipse(bx + s * 0.2, by + s * 0.06, s * 0.56, s * 0.25, 0.12, 0, Math.PI * 2);
      ctx.fill();
    }

    if (style === "palm") {
      const topX = bx + sway * 0.65 + s * 0.14;
      const topY = by - s * 1.65;
      const mx = (bx + topX) * 0.5 + s * 0.12, my = (by + topY) * 0.5;
      // Smooth curved tapered palm trunk with ring lines
      ctx.beginPath();
      ctx.moveTo(bx - s * 0.1, by);
      ctx.quadraticCurveTo(mx - s * 0.07, my, topX - s * 0.045, topY);
      ctx.lineTo(topX + s * 0.045, topY);
      ctx.quadraticCurveTo(mx + s * 0.07, my, bx + s * 0.1, by);
      ctx.closePath();
      ctx.fillStyle = ph.fillP >= 0.999 ? "#a88057" : mixHex(PALETTE.paper, "#a88057", ph.fillP);
      ctx.fill();
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = this.inkWidth * 0.78;
      ctx.stroke();

      // Trunk bark rings
      ctx.strokeStyle = "rgba(38,32,28,0.3)";
      ctx.lineWidth = this.inkWidth * 0.45;
      for (let k = 1; k <= 5; k++) {
        const f = k / 6;
        const rx = lerp(bx, topX, f) + Math.sin(f * Math.PI) * s * 0.08;
        const ry = lerp(by, topY, f);
        ctx.beginPath(); ctx.moveTo(rx - s * 0.06, ry); ctx.lineTo(rx + s * 0.06, ry); ctx.stroke();
      }
      // Cluster of coconuts
      ctx.fillStyle = "#6c4b30";
      ctx.beginPath();
      ctx.arc(topX - s * 0.06, topY + s * 0.08, s * 0.065, 0, Math.PI * 2);
      ctx.arc(topX + s * 0.06, topY + s * 0.08, s * 0.065, 0, Math.PI * 2);
      ctx.fill();

      // 9 sweeping feathered drooping palm fronds (just like ref_07.png!)
      const fronds = [-2.95, -2.35, -1.7, -1.05, -0.35, 0.25, 0.9, 1.55, 2.25];
      for (let i = 0; i < fronds.length; i++) {
        const a = fronds[i];
        const fx = topX + Math.cos(a) * s * 0.92 + sway * 0.55;
        const fy = topY + Math.sin(a) * s * 0.42 + s * 0.34;
        const cpx = topX + Math.cos(a) * s * 0.54;
        const cpy = topY + Math.sin(a) * s * 0.15 - s * 0.28;
        ctx.beginPath();
        ctx.moveTo(topX, topY);
        ctx.quadraticCurveTo(cpx, cpy - s * 0.14, fx, fy);
        ctx.quadraticCurveTo(cpx, cpy + s * 0.16, topX, topY);
        ctx.closePath();
        ctx.fillStyle = i % 2 === 0 ? "#80a85e" : "#6a914b";
        ctx.fill();
        ctx.strokeStyle = PALETTE.ink;
        ctx.lineWidth = this.inkWidth * 0.62;
        ctx.stroke();
        // Central frond rib spine
        ctx.strokeStyle = "rgba(38,32,28,0.34)";
        ctx.lineWidth = this.inkWidth * 0.4;
        ctx.beginPath(); ctx.moveTo(topX, topY); ctx.quadraticCurveTo(cpx, cpy, fx, fy); ctx.stroke();
      }
      ctx.restore();
      return;
    }

    if (style === "cypress") {
      // Tapered trunk
      ctx.fillStyle = "#7b5a3f";
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = this.inkWidth * 0.72;
      ctx.beginPath();
      ctx.moveTo(bx - s * 0.07, by); ctx.lineTo(bx + s * 0.07, by);
      ctx.lineTo(bx + s * 0.04, by - s * 0.38); ctx.lineTo(bx - s * 0.04, by - s * 0.38);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      // Smooth teardrop Mediterranean cypress silhouette
      ctx.beginPath();
      ctx.moveTo(bx + sway * 0.25, by - s * 1.72);
      ctx.bezierCurveTo(bx + s * 0.38, by - s * 1.1, bx + s * 0.34, by - s * 0.34, bx, by - s * 0.28);
      ctx.bezierCurveTo(bx - s * 0.34, by - s * 0.34, bx - s * 0.38, by - s * 1.1, bx + sway * 0.25, by - s * 1.72);
      ctx.closePath();
      const gr = ctx.createLinearGradient(bx - s * 0.3, by - s * 1.4, bx + s * 0.3, by - s * 0.3);
      gr.addColorStop(0, "#759b64");
      gr.addColorStop(0.55, "#5c804f");
      gr.addColorStop(1, "#45643c");
      ctx.fillStyle = ph.fillP >= 0.999 ? gr : mixHex(PALETTE.paper, "#5c804f", ph.fillP);
      ctx.fill();
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = this.inkWidth * 0.8;
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (style === "willow") {
      ctx.fillStyle = "#7d5e45";
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = this.inkWidth * 0.72;
      ctx.beginPath();
      ctx.moveTo(bx - s * 0.09, by); ctx.lineTo(bx + s * 0.09, by);
      ctx.lineTo(bx + s * 0.055, by - s * 0.68); ctx.lineTo(bx - s * 0.055, by - s * 0.68);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      ctx.beginPath();
      ctx.arc(bx + sway * 0.2, by - s * 0.92, s * 0.68, Math.PI, 0);
      ctx.bezierCurveTo(bx + s * 0.72 + sway * 0.4, by - s * 0.3, bx + s * 0.45 + sway * 0.3, by - s * 0.1, bx + s * 0.24 + sway * 0.25, by - s * 0.22);
      ctx.quadraticCurveTo(bx + sway * 0.25, by - s * 0.06, bx - s * 0.22 + sway * 0.25, by - s * 0.22);
      ctx.bezierCurveTo(bx - s * 0.45 + sway * 0.3, by - s * 0.1, bx - s * 0.72 + sway * 0.4, by - s * 0.3, bx - s * 0.68 + sway * 0.2, by - s * 0.92);
      ctx.closePath();
      const gr = ctx.createRadialGradient(bx - s * 0.2, by - s * 1.25, s * 0.1, bx + s * 0.1, by - s * 0.6, s * 0.95);
      gr.addColorStop(0, "#a8cb84");
      gr.addColorStop(0.6, "#88ae69");
      gr.addColorStop(1, "#668a4d");
      ctx.fillStyle = ph.fillP >= 0.999 ? gr : mixHex(PALETTE.paper, "#88ae69", ph.fillP);
      ctx.fill();
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = this.inkWidth * 0.78;
      ctx.stroke();

      ctx.strokeStyle = "rgba(42, 62, 34, 0.35)";
      ctx.lineWidth = this.inkWidth * 0.48;
      for (const ox of [-0.42, -0.2, 0.04, 0.26, 0.45]) {
        ctx.beginPath();
        ctx.moveTo(bx + ox * s, by - s * 1.05);
        ctx.quadraticCurveTo(bx + ox * s + sway * 0.25, by - s * 0.6, bx + ox * s + sway * 0.45, by - s * 0.18);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    // 10/10 SMOOTH ORGANIC ROUND / SAKURA / PINE / AUTUMN TREE (Like ref_02 & ref_07!)
    const trunkH = s * (style === "pine" ? 0.62 : 0.56);
    // Tapered shaded trunk with flared root base
    ctx.beginPath();
    ctx.moveTo(bx - s * 0.11, by + s * 0.02);
    ctx.quadraticCurveTo(bx - s * 0.065, by - trunkH * 0.45, bx - s * 0.055, by - trunkH - s * 0.08);
    ctx.lineTo(bx + s * 0.055, by - trunkH - s * 0.08);
    ctx.quadraticCurveTo(bx + s * 0.065, by - trunkH * 0.45, bx + s * 0.11, by + s * 0.02);
    ctx.closePath();
    ctx.fillStyle = "#856245";
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = this.inkWidth * 0.74;
    ctx.stroke();

    const hash = Math.abs(Math.floor(u * 13 + v * 29)) % 3;
    const col =
      style === "sakura"
        ? (hash === 0 ? "#f4bccb" : "#f7cad6")
        : style === "autumn"
        ? "#dc8a4c"
        : style === "pine"
        ? "#5d8455"
        : ["#83a862", "#92b56e", "#799e5b"][hash];

    // Smooth billowing multi-lobe cloud silhouette using true circular arcs!
    const cx0 = bx + sway * 0.28;
    const cy0 = by - trunkH - s * 0.44;
    const rMain = s * 0.56;
    ctx.beginPath();
    ctx.arc(cx0 - rMain * 0.45, cy0 + rMain * 0.22, rMain * 0.66, Math.PI * 0.45, Math.PI * 1.48);
    ctx.arc(cx0 - rMain * 0.12, cy0 - rMain * 0.34, rMain * 0.68, Math.PI * 1.05, Math.PI * 1.88);
    ctx.arc(cx0 + rMain * 0.42, cy0 - rMain * 0.14, rMain * 0.62, Math.PI * 1.38, Math.PI * 0.25);
    ctx.arc(cx0 + rMain * 0.34, cy0 + rMain * 0.28, rMain * 0.56, Math.PI * 1.85, Math.PI * 0.72);
    ctx.closePath();

    if (ph.fillP >= 0.999) {
      const gr = ctx.createRadialGradient(cx0 - rMain * 0.38, cy0 - rMain * 0.42, rMain * 0.08, cx0 + rMain * 0.18, cy0 + rMain * 0.18, rMain * 1.35);
      gr.addColorStop(0, shade(col, 0.18));
      gr.addColorStop(0.58, col);
      gr.addColorStop(1, shade(col, -0.18));
      ctx.fillStyle = gr;
    } else {
      ctx.fillStyle = mixHex(PALETTE.paper, col, ph.fillP);
    }
    ctx.fill();

    // Soft crescent watercolor shade along lower-right belly of canopy + fine leaf stipple arcs!
    if (ph.fillP > 0.65) {
      ctx.save();
      ctx.clip();
      ctx.fillStyle = style === "sakura" ? "rgba(186, 98, 124, 0.18)" : "rgba(42, 68, 34, 0.18)";
      ctx.beginPath();
      ctx.arc(cx0 + rMain * 0.42, cy0 + rMain * 0.45, rMain * 0.92, 0, Math.PI * 2);
      ctx.fill();
      // Subtle watercolor wash grain inside canopy
      ctx.globalAlpha *= 0.45;
      ctx.fillStyle = this._wash;
      ctx.fillRect(cx0 - rMain * 1.4, cy0 - rMain * 1.4, rMain * 2.8, rMain * 2.8);
      // Delicate hand-drawn foliage curl ticks
      ctx.globalAlpha = 0.32;
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = this.inkWidth * 0.55;
      ctx.beginPath(); ctx.arc(cx0 - rMain * 0.18, cy0 - rMain * 0.05, rMain * 0.22, 0.2, Math.PI * 0.85); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx0 + rMain * 0.28, cy0 + rMain * 0.14, rMain * 0.18, 0.4, Math.PI * 1.0); ctx.stroke();
      ctx.restore();
    }

    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = this.inkWidth * 0.82;
    ctx.lineJoin = "round";
    ctx.stroke();

    if (style === "sakura" && this.lifeAlpha > 0.2) {
      ctx.globalAlpha *= this.lifeAlpha;
      ctx.fillStyle = "#fce0e8";
      for (let i = 0; i < 5; i++) {
        const p = (this.t * 0.4 + i * 0.21 + u * 0.2) % 1;
        ctx.beginPath();
        ctx.ellipse(bx + Math.sin(p * 6 + i * 2) * s * 0.65 + p * s * 0.32, by - trunkH - s * 0.45 + p * s * 1.05, 2.2, 1.3, p * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // =========================================================================
  // 10/10 STORYBOOK ILLUSTRATED PEOPLE (Larger, rounded, expressive hair/clothes/poses!)
  // =========================================================================
  person(u, v, z = 0, opts = {}) {
    const la = this.lifeAlpha;
    if (la < 0.05) return;
    const [bx, by] = this.pt(u, v, z);
    // 1.38x richer scale so characters feel alive & readable like the SF reference!
    const s = this.scale * 1.38 * (opts.scale ?? 1.0) * (0.45 + 0.55 * la);
    const seed = opts.seed || Math.floor(u * 31 + v * 17);
    const skins = ["#f4cfb0", "#e6b892", "#c9946b", "#f7dbc0", "#9c6c4a"];
    const hairs = ["#2e241f", "#5e3e29", "#8c6138", "#d4a656", "#1e1b1a", "#7a3b2c"];
    const shirt = opts.shirt || "#c95b4b";
    const pants = opts.pants || (seed % 3 === 0 ? "#486582" : "#3a404a");
    const skin = opts.skin || skins[Math.abs(seed) % skins.length];
    const hair = opts.hair || hairs[Math.abs(seed * 5) % hairs.length];
    const sit = opts.sit === true;
    const phase = opts.walk && !sit ? Math.sin(this.t * 8.2 + seed) : 0;
    const bob = opts.walk && !sit ? Math.abs(Math.sin(this.t * 8.2 + seed)) * s * 0.038 : 0;

    const ctx = this.ctx;
    ctx.save();
    // Soft elliptical ground contact shadow
    ctx.fillStyle = "rgba(42, 33, 24, 0.2)";
    ctx.beginPath();
    ctx.ellipse(bx + s * 0.04, by + s * 0.03, s * 0.15, s * 0.065, 0, 0, Math.PI * 2);
    ctx.fill();

    // Solid illustrated legs & tiny shoes!
    ctx.lineCap = "round";
    if (sit) {
      ctx.strokeStyle = pants;
      ctx.lineWidth = Math.max(2.0, s * 0.085);
      ctx.beginPath();
      ctx.moveTo(bx - s * 0.04, by - s * 0.14); ctx.lineTo(bx - s * 0.12, by - s * 0.03);
      ctx.moveTo(bx + s * 0.05, by - s * 0.14); ctx.lineTo(bx + s * 0.14, by - s * 0.03);
      ctx.stroke();
    } else {
      const lx = bx - s * 0.045 - phase * s * 0.065;
      const rx = bx + s * 0.045 + phase * s * 0.065;
      // Dark ink outline around trousers
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = Math.max(2.6, s * 0.095);
      ctx.beginPath();
      ctx.moveTo(bx - s * 0.042, by - s * 0.21 - bob); ctx.lineTo(lx, by - s * 0.02);
      ctx.moveTo(bx + s * 0.042, by - s * 0.21 - bob); ctx.lineTo(rx, by - s * 0.02);
      ctx.stroke();
      ctx.strokeStyle = pants;
      ctx.lineWidth = Math.max(1.6, s * 0.062);
      ctx.stroke();
      // Tiny dark shoes
      ctx.fillStyle = "#2b2420";
      ctx.beginPath(); ctx.ellipse(lx, by - s * 0.01, s * 0.045, s * 0.024, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(rx, by - s * 0.01, s * 0.045, s * 0.024, 0, 0, Math.PI * 2); ctx.fill();
    }

    // Rounded Torso / Jacket / Dress with subtle side shading
    const yBase = by - (sit ? s * 0.12 : s * 0.18) - bob;
    const yTop = yBase - s * 0.26;
    const tw = s * 0.115;
    const skirtMul = opts.dress ? 1.42 : 0.96;
    ctx.beginPath();
    ctx.moveTo(bx - tw, yTop + s * 0.03);
    ctx.quadraticCurveTo(bx, yTop - s * 0.02, bx + tw, yTop + s * 0.03);
    ctx.lineTo(bx + tw * skirtMul, yBase);
    ctx.quadraticCurveTo(bx, yBase + s * 0.03, bx - tw * skirtMul, yBase);
    ctx.closePath();
    const tGr = ctx.createLinearGradient(bx - tw, yTop, bx + tw, yBase);
    tGr.addColorStop(0, shade(shirt, 0.1));
    tGr.addColorStop(1, shade(shirt, -0.14));
    ctx.fillStyle = tGr;
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = this.inkWidth * 0.68;
    ctx.stroke();

    // Swinging Arms in jacket sleeves + tiny hands!
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = Math.max(1.4, s * 0.055);
    ctx.beginPath();
    ctx.moveTo(bx - tw, yTop + s * 0.05);
    ctx.lineTo(bx - tw - s * 0.065, yBase - s * 0.04 + phase * s * 0.045);
    ctx.stroke();
    if (opts.wave) {
      const wa = Math.sin(this.t * 6.5 + seed) * s * 0.08;
      ctx.beginPath();
      ctx.moveTo(bx + tw, yTop + s * 0.05);
      ctx.lineTo(bx + tw + s * 0.12, yTop - s * 0.12 + wa);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(bx + tw, yTop + s * 0.05);
      ctx.lineTo(bx + tw + s * 0.065, yBase - s * 0.04 - phase * s * 0.045);
      ctx.stroke();
    }

    // Smooth Circular Head + Styled Hair / Hat!
    const hr = s * 0.105;
    const hy = yTop - hr * 0.88;
    ctx.beginPath();
    ctx.arc(bx, hy, hr, 0, Math.PI * 2);
    ctx.fillStyle = skin;
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = this.inkWidth * 0.62;
    ctx.stroke();

    if (opts.hat === "bearskin") {
      ctx.fillStyle = "#242120";
      ctx.beginPath();
      ctx.roundRect(bx - hr * 1.05, hy - hr * 2.55, hr * 2.1, hr * 2.35, hr * 0.5);
      ctx.fill(); ctx.stroke();
    } else if (opts.hat === "beret") {
      ctx.fillStyle = "#bc3d36";
      ctx.beginPath();
      ctx.ellipse(bx - hr * 0.1, hy - hr * 0.82, hr * 1.25, hr * 0.46, -0.18, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    } else if (opts.hat === "sunhat") {
      ctx.fillStyle = "#e8cf86";
      ctx.beginPath(); ctx.ellipse(bx, hy - hr * 0.62, hr * 1.75, hr * 0.42, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(bx, hy - hr * 0.65, hr * 0.85, Math.PI, 0); ctx.fill(); ctx.stroke();
    } else {
      // Natural curved hair cap (+ occasional bun or bob!)
      ctx.fillStyle = hair;
      ctx.beginPath();
      ctx.arc(bx, hy - hr * 0.12, hr * 1.06, Math.PI * 1.02, Math.PI * 1.98);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      if (opts.dress && seed % 2 === 0) {
        ctx.beginPath();
        ctx.arc(bx + hr * 0.72, hy - hr * 0.72, hr * 0.42, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
      }
    }

    // Optional Balloon!
    if (opts.balloon) {
      const bSw = Math.sin(this.t * 3.2 + seed) * s * 0.08;
      const blx = bx + tw + s * 0.1 + bSw, bly = hy - s * 0.38;
      ctx.strokeStyle = PALETTE.ink; ctx.lineWidth = this.inkWidth * 0.45;
      ctx.beginPath(); ctx.moveTo(bx + tw + s * 0.06, yBase - s * 0.05); ctx.lineTo(blx, bly + s * 0.1); ctx.stroke();
      ctx.fillStyle = opts.balloon;
      ctx.beginPath(); ctx.ellipse(blx, bly, s * 0.095, s * 0.12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }

    if (opts.umbrella) {
      ctx.strokeStyle = PALETTE.ink; ctx.lineWidth = this.inkWidth * 0.68;
      ctx.beginPath(); ctx.moveTo(bx + tw, yTop + s * 0.05); ctx.lineTo(bx + tw, hy - s * 0.34); ctx.stroke();
      ctx.fillStyle = opts.umbrella;
      ctx.beginPath();
      ctx.arc(bx + tw * 0.5, hy - s * 0.14, s * 0.28, Math.PI, 0);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
    if (opts.flash) {
      const fp = (this.t * 1.2 + seed) % 3.2;
      if (fp < 0.2) {
        const fr = s * 0.26 * (1 - fp / 0.2);
        ctx.fillStyle = "#fffce6";
        ctx.beginPath();
        ctx.moveTo(bx + s * 0.12 - fr, hy); ctx.lineTo(bx + s * 0.12, hy - fr);
        ctx.lineTo(bx + s * 0.12 + fr, hy); ctx.lineTo(bx + s * 0.12, hy + fr);
        ctx.closePath(); ctx.fill();
      }
    }
    ctx.restore();
  }

  // =========================================================================
  // 10/10 SCULPTED 3-VOLUME VEHICLES (Sloped windshields, tires, hubcaps, headlights!)
  // =========================================================================
  vehicle(u, v, z = 0, opts = {}) {
    const la = this.lifeAlpha;
    if (la < 0.05) return;
    const axis = opts.axis || "u";
    const style = opts.style || "sedan";
    const color = opts.color || "#c75848";

    if (style === "bus_red") {
      const len = 1.38, wid = 0.58;
      const du = axis === "u" ? len : wid, dv = axis === "u" ? wid : len;
      this.softShadow(u, v, len * 0.62, wid * 0.55, z + 0.01, 0.22);
      this.box(u - du * 0.5, v - dv * 0.5, z + 0.11, du, dv, 0.74, "#c83832", {
        shadow: false, noPlinth: true, lw: 0.85,
        windows: { floors: 2, colsU: axis === "u" ? 4 : 1, colsV: axis === "u" ? 1 : 4, color: "#a4ccda", litChance: 0 },
      });
      // Cream Routemaster belt stripe + destination header band
      this.line([u - du * 0.5, v + dv * 0.5, z + 0.48], [u + du * 0.5, v + dv * 0.5, z + 0.48], "#f6efdd", 1.5);
      this.line([u + du * 0.5, v - dv * 0.5, z + 0.48], [u + du * 0.5, v + dv * 0.5, z + 0.48], "#f6efdd", 1.5);
      // Tires with bright hubcaps!
      const wOff = len * 0.31;
      const wheels = axis === "u"
        ? [[u - wOff, v + dv * 0.48], [u + wOff, v + dv * 0.48]]
        : [[u + du * 0.48, v - wOff], [u + du * 0.48, v + wOff]];
      for (const [wu, wv] of wheels) {
        this.sphere(wu, wv, z + 0.11, 0.11, "#2a2725", { lw: 0.45 });
        this.sphere(wu, wv, z + 0.11, 0.045, "#dcd5c6", { lw: 0 });
      }
      // Headlights
      if (axis === "u") {
        this.sphere(u + du * 0.5, v - dv * 0.25, z + 0.22, 0.045, "#fff4b8", { lw: 0.35 });
        this.sphere(u + du * 0.5, v + dv * 0.25, z + 0.22, 0.045, "#fff4b8", { lw: 0.35 });
      } else {
        this.sphere(u - du * 0.25, v + dv * 0.5, z + 0.22, 0.045, "#fff4b8", { lw: 0.35 });
        this.sphere(u + du * 0.25, v + dv * 0.5, z + 0.22, 0.045, "#fff4b8", { lw: 0.35 });
      }
      return;
    }

    if (style === "tram") {
      const len = 1.52, wid = 0.56;
      const du = axis === "u" ? len : wid, dv = axis === "u" ? wid : len;
      this.softShadow(u, v, len * 0.6, wid * 0.52, z + 0.01, 0.2);
      this.box(u - du * 0.5, v - dv * 0.5, z + 0.08, du, dv, 0.56, color, {
        shadow: false, noPlinth: true, lw: 0.82,
        windows: { floors: 1, colsU: axis === "u" ? 4 : 1, colsV: axis === "u" ? 1 : 4, color: "#b6d8e4", litChance: 0.3 },
      });
      // Cream clerestory roof deck + vintage gold trim!
      this.box(u - du * 0.44, v - dv * 0.42, z + 0.64, du * 0.88, dv * 0.84, 0.11, "#f2ead7", { shadow: false, noPlinth: true, lw: 0.62 });
      this.line([u, v, z + 0.75], [u, v, z + 0.98], PALETTE.ink, 0.72);
      this.line([u - 0.2, v, z + 0.98], [u + 0.2, v, z + 0.98], PALETTE.ink, 0.85);
      return;
    }

    if (style === "train") {
      const cars = opts.cars || 3, carLen = opts.carLen || 1.25, wid = 0.54;
      const stripe = opts.stripe || "#3b6fa1";
      for (let i = 0; i < cars; i++) {
        const off = (i - (cars - 1) * 0.5) * (carLen + 0.08);
        const cu = axis === "u" ? u + off : u;
        const cv = axis === "u" ? v : v + off;
        const du = axis === "u" ? carLen : wid, dv = axis === "u" ? wid : carLen;
        this.box(cu - du * 0.5, cv - dv * 0.5, z + 0.07, du, dv, 0.48, color, {
          shadow: false, noPlinth: true, lw: 0.8,
          windows: { floors: 1, band: true, color: "#4e6d82" },
        });
        if (axis === "u") {
          this.line([cu - du * 0.5, cv + dv * 0.5, z + 0.18], [cu + du * 0.5, cv + dv * 0.5, z + 0.18], stripe, 2.2);
        } else {
          this.line([cu + du * 0.5, cv - dv * 0.5, z + 0.18], [cu + du * 0.5, cv + dv * 0.5, z + 0.18], stripe, 2.2);
        }
      }
      return;
    }

    // 10/10 SCULPTED SEDAN / TAXI / SUPERCAR (True sloped windshields, hood, trunk, tires, headlights!)
    const len = style === "supercar" ? 1.02 : 0.96;
    const wid = 0.48;
    const du = axis === "u" ? len : wid, dv = axis === "u" ? wid : len;
    const bodyH = style === "supercar" ? 0.17 : 0.22;
    const cabH = style === "supercar" ? 0.14 : 0.2;
    const z0 = z + 0.09, z1 = z0 + bodyH, z2 = z1 + cabH;

    this.softShadow(u, v, du * 0.65, dv * 0.62, z + 0.01, 0.22);

    // Lower chassis body
    this.box(u - du * 0.5, v - dv * 0.5, z0, du, dv, bodyH, color, { shadow: false, noPlinth: true, lw: 0.78 });

    // Sculpted sloped cabin greenhouse (trapezoid roof narrower than waist = realistic angled windshields!)
    const u0 = u - du * 0.5, u1 = u + du * 0.5;
    const v0 = v - dv * 0.5, v1 = v + dv * 0.5;
    const glassCol = "#8eb4c6";
    if (axis === "u") {
      const b0 = u - len * 0.34, b1 = u + len * 0.26;
      const r0 = u - len * 0.22, r1 = u + len * 0.13;
      const gv0 = v - wid * 0.44, gv1 = v + wid * 0.44;
      // Left side cabin glass & pillars
      this.poly([[b0, gv1, z1], [b1, gv1, z1], [r1, gv1, z2], [r0, gv1, z2]], glassCol, PALETTE.ink, 0.62);
      this.line([u - len * 0.04, gv1, z1], [u - len * 0.04, gv1, z2], PALETTE.ink, 0.62); // B-pillar!
      // Angled front windshield!
      this.poly([[b1, gv0, z1], [b1, gv1, z1], [r1, gv1, z2], [r1, gv0, z2]], "#a6cbd9", PALETTE.ink, 0.62);
      this.line([b1 - 0.02, gv0 + 0.1, z1 + 0.03], [r1 + 0.02, gv0 + 0.24, z2 - 0.03], "rgba(255,255,255,0.68)", 0.9);
      // Roof cap
      this.poly([[r0, gv0, z2], [r1, gv0, z2], [r1, gv1, z2], [r0, gv1, z2]], shade(color, 0.14), PALETTE.ink, 0.68);
      // Tires with silver hubcaps
      for (const wu of [u - len * 0.3, u + len * 0.3]) {
        this.sphere(wu, v1 - 0.02, z + 0.1, 0.098, "#292624", { lw: 0.45 });
        this.sphere(wu, v1 - 0.02, z + 0.1, 0.042, "#dcd6c8", { lw: 0 });
      }
      // Bright headlights & bumper
      this.sphere(u1, v - wid * 0.28, z0 + bodyH * 0.48, 0.042, "#fff3b5", { lw: 0.35 });
      this.sphere(u1, v + wid * 0.28, z0 + bodyH * 0.48, 0.042, "#fff3b5", { lw: 0.35 });
    } else {
      const b0 = v - len * 0.34, b1 = v + len * 0.26;
      const r0 = v - len * 0.22, r1 = v + len * 0.13;
      const gu0 = u - wid * 0.44, gu1 = u + wid * 0.44;
      // Right side cabin glass & B-pillar
      this.poly([[gu1, b0, z1], [gu1, b1, z1], [gu1, r1, z2], [gu1, r0, z2]], shade(glassCol, -0.09), PALETTE.ink, 0.62);
      this.line([gu1, v - len * 0.04, z1], [gu1, v - len * 0.04, z2], PALETTE.ink, 0.62);
      // Angled front windshield!
      this.poly([[gu0, b1, z1], [gu1, b1, z1], [gu1, r1, z2], [gu0, r1, z2]], "#a6cbd9", PALETTE.ink, 0.62);
      this.line([gu0 + 0.1, b1 - 0.02, z1 + 0.03], [gu0 + 0.24, r1 + 0.02, z2 - 0.03], "rgba(255,255,255,0.68)", 0.9);
      // Roof cap
      this.poly([[gu0, r0, z2], [gu1, r0, z2], [gu1, r1, z2], [gu0, r1, z2]], shade(color, 0.14), PALETTE.ink, 0.68);
      // Tires with silver hubcaps
      for (const wv of [v - len * 0.3, v + len * 0.3]) {
        this.sphere(u1 - 0.02, wv, z + 0.1, 0.098, "#292624", { lw: 0.45 });
        this.sphere(u1 - 0.02, wv, z + 0.1, 0.042, "#dcd6c8", { lw: 0 });
      }
      this.sphere(u - wid * 0.28, v1, z0 + bodyH * 0.48, 0.042, "#fff3b5", { lw: 0.35 });
      this.sphere(u + wid * 0.28, v1, z0 + bodyH * 0.48, 0.042, "#fff3b5", { lw: 0.35 });
    }
    if (style === "taxi") {
      this.box(u - 0.1, v - 0.1, z2, 0.2, 0.2, 0.08, "#f7d558", { shadow: false, noPlinth: true, lw: 0.5 });
    }
  }

  // =========================================================================
  // 10/10 CURVED POINTED-BOW BOATS (Sailboats, Sightseeing Ferries, Sampans, Swans!)
  // =========================================================================
  boat(u, v, z = -0.04, opts = {}) {
    const la = this.lifeAlpha;
    if (la < 0.05) return;
    const bob = Math.sin(this.t * 2.6 + u * 2 + v) * 0.04;
    const style = opts.style || "sailboat";
    const axis = opts.axis || "u";
    const color = opts.color || "#f5f0e4";
    const accent = opts.accent || "#c65042";

    // Trailing V-wake white water foam ripples!
    const [wx, wy] = this.pt(u, v, z);
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.72)";
    ctx.lineWidth = this.inkWidth * 0.9;
    ctx.beginPath();
    ctx.moveTo(wx - this.scale * 0.85, wy + this.scale * 0.14);
    ctx.quadraticCurveTo(wx, wy + this.scale * 0.28, wx + this.scale * 0.85, wy + this.scale * 0.14);
    ctx.stroke();
    ctx.restore();

    // Helper for tapered pointed-bow hull!
    const drawHull = (len, wid, h, hullCol, deckCol = "#c79b6b") => {
      const hl = len * 0.5, hw = wid * 0.5;
      const zb = z + bob, zt = zb + h;
      if (axis === "u") {
        // Pointed bow at +u, transom at -u
        this.poly([[u - hl, v + hw, zb], [u + hl * 0.65, v + hw, zb], [u + hl, v, zb], [u + hl, v, zt + 0.05], [u + hl * 0.65, v + hw, zt], [u - hl, v + hw, zt]], hullCol, PALETTE.ink, 0.78);
        this.poly([[u - hl, v - hw, zt], [u + hl * 0.65, v - hw, zt], [u + hl, v, zt + 0.05], [u + hl * 0.65, v + hw, zt], [u - hl, v + hw, zt]], deckCol, PALETTE.ink, 0.72);
        this.line([u - hl, v + hw, zb + h * 0.45], [u + hl * 0.8, v + hw * 0.5, zb + h * 0.45], accent, 1.3);
      } else {
        this.poly([[u + hw, v - hl, zb], [u + hw, v + hl * 0.65, zb], [u, v + hl, zb], [u, v + hl, zt + 0.05], [u + hw, v + hl * 0.65, zt], [u + hw, v - hl, zt]], shade(hullCol, -0.08), PALETTE.ink, 0.78);
        this.poly([[u - hw, v - hl, zt], [u + hw, v - hl, zt], [u + hw, v + hl * 0.65, zt], [u, v + hl, zt + 0.05], [u - hw, v + hl * 0.65, zt]], deckCol, PALETTE.ink, 0.72);
        this.line([u + hw, v - hl, zb + h * 0.45], [u + hw * 0.5, v + hl * 0.8, zb + h * 0.45], accent, 1.3);
      }
    };

    if (style === "sailboat") {
      drawHull(1.06, 0.42, 0.2, color, "#c99c6e");
      this.line([u, v, z + 0.2 + bob], [u, v, z + 1.35 + bob], PALETTE.ink, 0.92);
      const puff = Math.sin(this.t * 2.1 + u) * 0.08;
      this.poly([[u, v, z + 1.3 + bob], [u + (axis === "u" ? 0.54 : 0.14) + puff, v + (axis === "u" ? 0.14 : 0.54), z + 0.36 + bob], [u, v, z + 0.3 + bob]], opts.sail || "#fdfaf2", PALETTE.ink, 0.74);
      this.poly([[u, v, z + 1.12 + bob], [u - (axis === "u" ? 0.36 : 0.07), v - (axis === "u" ? 0.07 : 0.36), z + 0.34 + bob], [u, v, z + 0.32 + bob]], accent, PALETTE.ink, 0.7);
      return;
    }

    if (style === "ferry" || style === "yacht") {
      const len = style === "ferry" ? 1.82 : 1.56, wid = 0.64;
      const du = axis === "u" ? len : wid, dv = axis === "u" ? wid : len;
      drawHull(len, wid, 0.24, color, "#d8c4a2");
      this.box(u - du * 0.34, v - dv * 0.36, z + 0.24 + bob, du * 0.64, dv * 0.72, 0.3, "#fbf7ee", {
        shadow: false, noPlinth: true, lw: 0.72,
        windows: { floors: 1, colsU: axis === "u" ? 4 : 1, colsV: axis === "u" ? 1 : 4, color: "#769eb0", litChance: 0.3 },
      });
      if (style === "ferry") {
        this.cylinder(u - (axis === "u" ? 0.12 : 0), v - (axis === "v" ? 0.12 : 0), z + 0.54 + bob, 0.12, 0.34, accent, { lw: 0.7 });
        this.smoke(u - (axis === "u" ? 0.12 : 0), v - (axis === "v" ? 0.12 : 0), z + 0.9 + bob, 2);
      }
      return;
    }

    if (style === "sampan" || style === "abra") {
      drawHull(1.12, 0.44, 0.16, "#9e6f46", "#b88a5e");
      const du = axis === "u" ? 0.56 : 0.38, dv = axis === "u" ? 0.38 : 0.56;
      this.box(u - du * 0.5, v - dv * 0.5, z + 0.16 + bob, du, dv, 0.26, accent, { shadow: false, noPlinth: true, lw: 0.68 });
      if (style === "sampan") {
        this.sphere(u + (axis === "u" ? 0.48 : 0), v + (axis === "v" ? 0.48 : 0), z + 0.3 + bob, 0.085, "#d84438", { lw: 0.4 });
      }
      return;
    }

    if (style === "narrowboat") {
      drawHull(1.48, 0.38, 0.16, "#2e4e44", "#4b695e");
      const du = axis === "u" ? 0.92 : 0.3, dv = axis === "u" ? 0.3 : 0.92;
      this.box(u - du * 0.5, v - dv * 0.5, z + 0.16 + bob, du, dv, 0.22, accent, {
        shadow: false, noPlinth: true, lw: 0.68,
        windows: { floors: 1, colsU: axis === "u" ? 3 : 1, colsV: axis === "u" ? 1 : 3, color: "#f6e5a6", litChance: 0.55 },
      });
      return;
    }

    // Swan paddle boat
    const [bx, by] = this.pt(u, v, z + bob);
    const s = this.scale * 0.36;
    ctx.save();
    ctx.fillStyle = "#fcfaf3"; ctx.strokeStyle = PALETTE.ink; ctx.lineWidth = this.inkWidth * 0.75;
    ctx.beginPath();
    ctx.ellipse(bx, by - s * 0.22, s * 0.92, s * 0.42, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx + s * 0.55, by - s * 0.36);
    ctx.bezierCurveTo(bx + s * 0.65, by - s * 1.45, bx + s * 1.05, by - s * 1.55, bx + s * 1.15, by - s * 1.18);
    ctx.lineWidth = this.inkWidth * 1.4; ctx.stroke();
    ctx.restore();
  }

  flag(u, v, z, h, colors = ["#355c9c", "#f6f2e8", "#c8443a"]) {
    this.line([u, v, z], [u, v, z + h], PALETTE.ink, 0.95);
    const [fx, fy] = this.pt(u, v, z + h);
    const fw = this.scale * 0.52, fh = this.scale * 0.3;
    const wave = Math.sin(this.t * 4.5 + u + v) * 2.6;
    const n = colors.length;
    for (let i = 0; i < n; i++) {
      const x0 = fx + (fw * i) / n, x1 = fx + (fw * (i + 1)) / n;
      const w0 = (i / n) * wave, w1 = ((i + 1) / n) * wave;
      this.screenPoly([[x0, fy + w0], [x1, fy + w1], [x1, fy + fh + w1], [x0, fy + fh + w0]], colors[i], PALETTE.ink, 0.48);
    }
  }

  fountain(u, v, z, r = 0.78, opts = {}) {
    const jets = opts.jets || 6, jetH = opts.jetH || 0.78;
    if (opts.basin !== false) {
      this.softShadow(u, v, r * 1.45, r * 0.75, z, 0.16);
      this.cylinder(u, v, z, r, 0.24, "#e2dac9", { top: "#86b8ca", lw: 0.82 });
      this.cylinder(u, v, z + 0.18, r * 0.24, 0.36, "#d2c9b6", { lw: 0.62 });
    }
    if (this.lifeAlpha < 0.1) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha *= this.lifeAlpha;
    for (let i = 0; i < jets; i++) {
      const a = (i / jets) * Math.PI * 2 + (opts.spin ? this.t * 0.5 : 0);
      const pulse = 0.68 + 0.32 * Math.sin(this.t * 3.8 + i * 1.1);
      const h = jetH * pulse;
      const [x0, y0] = this.pt(u, v, z + 0.44);
      const [xm, ym] = this.pt(u + Math.cos(a) * r * 0.35, v + Math.sin(a) * r * 0.35, z + 0.44 + h);
      const [x1, y1] = this.pt(u + Math.cos(a) * r * 0.72, v + Math.sin(a) * r * 0.72, z + 0.24);
      ctx.strokeStyle = "#f2fafd";
      ctx.lineWidth = this.inkWidth * 1.5;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(xm, ym, x1, y1); ctx.stroke();
      ctx.strokeStyle = "#5a90a8";
      ctx.lineWidth = this.inkWidth * 0.55;
      ctx.stroke();
      // Tiny splash ring where water lands
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = this.inkWidth * 0.55;
      ctx.beginPath(); ctx.ellipse(x1, y1, 3.2, 1.5, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  cloud(u, v, z, sc = 1.0) {
    this.watercolorCloud(u, v, z, sc);
  }

  lanternString(u1, v1, u2, v2, z, count = 5, color = "#d24436") {
    this.line([u1, v1, z], [u2, v2, z], PALETTE.ink, 0.58);
    for (let i = 1; i <= count; i++) {
      const f = i / (count + 1);
      const sag = Math.sin(f * Math.PI) * 0.26;
      const sway = Math.sin(this.t * 3.2 + i) * 0.04;
      const lu = lerp(u1, u2, f) + sway, lv = lerp(v1, v2, f), lz = z - sag - 0.12;
      this.sphere(lu, lv, lz, 0.135, color, { lw: 0.55 });
      // Gold top/bottom cap & tassel
      this.line([lu, lv, lz - 0.12], [lu, lv, lz - 0.24], "#d9ad42", 0.9);
    }
  }

  smoke(u, v, z, count = 4) {
    if (this.lifeAlpha < 0.1) return;
    const ctx = this.ctx;
    ctx.save();
    for (let i = 0; i < count; i++) {
      const p = (this.t * 0.45 + i / count) % 1;
      const [sx, sy] = this.pt(u + Math.sin(p * 5 + i) * 0.15, v, z + p * 1.15);
      const r = this.scale * (0.09 + p * 0.17);
      ctx.globalAlpha = this.lifeAlpha * (1 - p) * 0.52;
      ctx.fillStyle = "#f7f3ea";
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  kite(u, v, z, color = "#d95b6a") {
    if (this.lifeAlpha < 0.1) return;
    const bobU = Math.sin(this.t * 2.1 + u) * 0.22;
    const bobZ = Math.cos(this.t * 2.9 + v) * 0.18;
    const ku = u + 0.6 + bobU, kv = v - 0.4, kz = z + 2.2 + bobZ;
    this.line([u, v, z + 0.4], [ku, kv, kz], "rgba(38,32,28,0.45)", 0.48);
    const [kx, ky] = this.pt(ku, kv, kz);
    const s = this.scale * 0.36;
    this.screenPoly([[kx, ky - s], [kx + s * 0.65, ky], [kx, ky + s], [kx - s * 0.65, ky]], color, PALETTE.ink, 0.68);
    const w = Math.sin(this.t * 6) * s * 0.35;
    this.screenPoly([[kx, ky + s], [kx - s * 0.2 + w, ky + s * 1.7], [kx - s * 0.5 - w, ky + s * 2.4]], null, PALETTE.ink, 0.58, false);
  }
}
