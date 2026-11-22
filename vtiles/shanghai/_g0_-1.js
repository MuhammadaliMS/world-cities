// Yu Garden grid pass: axis-aligned dragon wall (along u, face on the v+ side) and the zigzag bridge (alternating legs
// along v and u). Everything is projected through P(u, v, z); the relief on the wall face is drawn in the wall plane.
import { P, INK, shade, lerp, rng, PLASTER, tileFace } from "./_t0_-1.js";

// ---------------- dragon wall ----------------
export function makeDragonWall({ UA = 5.45, UB = 9.45, V0 = 0.45, V1 = 0.8 } = {}) {
  const wpt = (s) => [lerp(UA, UB, s), V1];
  const zcap = (s) => 2.55 + 0.26 * Math.sin(s * Math.PI * 2 * 2.3 + 0.2);
  const N = 60;

  function dragonHead(c, x, y, s, t) {
    c.save(); c.translate(x, y); c.transform(1, 0.577, 0, 1, 0, 0); c.scale(s, s);
    const ST = "#57534a", F = "#cfccc3", F2 = "#a9a59b";
    c.lineJoin = "round"; c.lineCap = "round";
    c.fillStyle = F2; c.strokeStyle = ST; c.lineWidth = 1;
    for (let i = 0; i < 5; i++) { const a = -2.2 - i * 0.28, r = 13 + (i % 2) * 4, w = Math.sin(t * 2 + i) * 1.2; c.beginPath(); c.moveTo(-2, -2); c.quadraticCurveTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6 - 2, Math.cos(a) * r + w, Math.sin(a) * r); c.quadraticCurveTo(Math.cos(a + 0.25) * r * 0.5, Math.sin(a + 0.25) * r * 0.5, 2, 1); c.closePath(); c.fill(); c.stroke(); }
    c.strokeStyle = ST; c.lineWidth = 3.2; c.beginPath(); c.moveTo(2, -6); c.quadraticCurveTo(-4, -14, -12, -17); c.moveTo(-6, -13); c.lineTo(-5, -19); c.moveTo(6, -6); c.quadraticCurveTo(2, -15, -4, -21); c.stroke();
    c.strokeStyle = "#dedbd2"; c.lineWidth = 1.5; c.stroke();
    c.fillStyle = F; c.strokeStyle = ST; c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(-3, -6); c.quadraticCurveTo(6, -10, 13, -6); c.quadraticCurveTo(20, -6, 23, -9); c.quadraticCurveTo(25, -5, 22, -2); c.lineTo(11, 0); c.quadraticCurveTo(4, 1, -2, 3); c.closePath(); c.fill(); c.stroke();
    const jaw = 1 + Math.sin(t * 1.4) * 0.6;
    c.beginPath(); c.moveTo(0, 3); c.quadraticCurveTo(8, 4 + jaw, 17, 4 + jaw * 2); c.quadraticCurveTo(13, 8 + jaw, 4, 8); c.quadraticCurveTo(-2, 7, -3, 4); c.closePath(); c.fillStyle = F2; c.fill(); c.stroke();
    c.fillStyle = "#6e5f55"; c.beginPath(); c.moveTo(3, 2); c.lineTo(20, -1.5); c.lineTo(16, 4 + jaw * 1.6); c.lineTo(4, 4.5); c.closePath(); c.fill();
    c.fillStyle = "#f4f1ea"; for (let i = 0; i < 4; i++) { const xx = 6 + i * 3.4; c.beginPath(); c.moveTo(xx, 0.6 - i * 0.5); c.lineTo(xx + 1.2, 3 - i * 0.5); c.lineTo(xx + 2.2, 0.3 - i * 0.5); c.fill(); }
    c.fillStyle = "#f8f6ef"; c.beginPath(); c.ellipse(5, -5.5, 2.8, 2, -0.2, 0, 7); c.fill(); c.stroke();
    c.fillStyle = "#2a2622"; c.beginPath(); c.arc(5.8, -5.5, 1.1, 0, 7); c.fill();
    c.strokeStyle = ST; c.lineWidth = 1.6; c.beginPath(); c.moveTo(1, -8); c.quadraticCurveTo(5, -10.5, 9.5, -7.5); c.stroke();
    c.fillStyle = ST; c.beginPath(); c.arc(21.5, -6.5, 0.9, 0, 7); c.fill();
    c.lineWidth = 0.8; c.beginPath(); c.arc(-1, 0, 2.5, 0.5, 4.5); c.stroke(); c.beginPath(); c.arc(10, -6.5, 1.6, 3, 6); c.stroke();
    const ww = Math.sin(t * 1.7) * 2;
    c.strokeStyle = ST; c.lineWidth = 1.2; c.beginPath(); c.moveTo(20, -4); c.bezierCurveTo(28, -6, 32, 2 + ww, 38, -2 + ww); c.moveTo(19, -2); c.bezierCurveTo(26, 4, 26, 10 + ww, 33, 12 + ww); c.stroke();
    c.strokeStyle = "#e4e1d9"; c.lineWidth = 0.5; c.stroke();
    c.fillStyle = F2; c.strokeStyle = ST; c.lineWidth = 0.8; c.beginPath(); c.moveTo(2, 7); c.quadraticCurveTo(0, 13, -3, 15); c.quadraticCurveTo(3, 12, 7, 8); c.closePath(); c.fill(); c.stroke();
    const py = Math.sin(t * 1.2) * 1.5; c.fillStyle = "#ece9e0"; c.strokeStyle = ST; c.lineWidth = 1; c.beginPath(); c.arc(31, -10 + py, 3.4, 0, 7); c.fill(); c.stroke();
    c.strokeStyle = "#a9a59b"; c.beginPath(); c.arc(31, -10 + py, 6, -1.2, 0.4); c.moveTo(35, -16 + py); c.quadraticCurveTo(39, -14 + py, 38, -10 + py); c.stroke();
    c.restore();
  }

  function relief(k, t) {
    const c = k.ctx, sw = Math.sin(t * 0.9) * 0.02, S0 = 0.05, S1 = 0.74;
    const body = [];
    for (let i = 0; i <= 44; i++) { const s = lerp(S0, S1, i / 44), [u, v] = wpt(s), z = zcap(s) - 1.15 + 0.42 * Math.sin(((s - S0) / (S1 - S0)) * Math.PI * 2 * 2.3 + 2.2 + sw * 10); body.push(P(u, v + 0.02, z)); }
    const cloud = (x, y, s) => { c.strokeStyle = "#a8a59c"; c.lineWidth = 1.6; c.fillStyle = "#e6e1d6"; c.beginPath(); c.arc(x, y, 5 * s, Math.PI, 0); c.arc(x + 8 * s, y, 4 * s, Math.PI, 0); c.arc(x + 15 * s, y + 1, 3 * s, Math.PI, 0.3); c.fill(); c.stroke(); c.beginPath(); c.arc(x + 1, y - 1, 2 * s, 0, 5); c.stroke(); };
    for (const [s, dz, sc] of [[0.1, -1.4, 1], [0.2, -0.45, 0.8], [0.31, -1.5, 1.1], [0.43, -0.4, 0.9], [0.55, -1.45, 1], [0.66, -0.5, 0.8], [0.84, -1.4, 0.9], [0.9, -0.55, 0.8]]) { const [u, v] = wpt(s), [x, y] = P(u, v, zcap(s) + dz); cloud(x, y, sc); }
    const n = body.length, wAt = (i) => lerp(4.5, 13, Math.pow(i / (n - 1), 0.6));
    const left = [], right = [];
    for (let i = 0; i < n; i++) { const a = body[Math.max(0, i - 1)], b = body[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, w = wAt(i); left.push([body[i][0] + nx * w, body[i][1] + ny * w]); right.push([body[i][0] - nx * w, body[i][1] - ny * w]); }
    c.fillStyle = "#9c998f"; c.strokeStyle = "#5e5a51"; c.lineWidth = 0.8;
    for (let i = 3; i < n - 2; i += 2) { const p = right[i], q = right[i + 1], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2 - 4.5]; c.beginPath(); c.moveTo(...p); c.lineTo(...m); c.lineTo(...q); c.closePath(); c.fill(); c.stroke(); }
    c.beginPath(); left.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); [...right].reverse().forEach((p) => c.lineTo(...p)); c.closePath();
    c.fillStyle = "#c5c2b9"; c.fill(); c.strokeStyle = "#5e5a51"; c.lineWidth = 1.2; c.stroke();
    c.strokeStyle = "#e8e4da"; c.lineWidth = 1.6; c.beginPath(); body.forEach((p, i) => { const q = [lerp(p[0], left[i][0], 0.5), lerp(p[1], left[i][1], 0.5)]; i ? c.lineTo(...q) : c.moveTo(...q); }); c.stroke();
    c.strokeStyle = "rgba(80,75,65,0.7)"; c.lineWidth = 0.7;
    for (let i = 2; i < n; i++) { const w = wAt(i) * 0.55; c.beginPath(); c.arc(lerp(body[i][0], right[i][0], 0.35), lerp(body[i][1], right[i][1], 0.35), w * 0.6, 0.1, Math.PI - 0.1); c.stroke(); }
    for (const i of [10, 22, 34]) { const [x, y] = left[i]; c.strokeStyle = "#5e5a51"; c.lineWidth = 2.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 3, y + 6); c.stroke(); c.strokeStyle = "#c5c2b9"; c.lineWidth = 1.4; c.stroke(); c.strokeStyle = "#5e5a51"; c.lineWidth = 0.9; c.beginPath(); for (const d of [-2.5, 0, 2.5]) { c.moveTo(x + 3, y + 6); c.lineTo(x + 3 + d, y + 9); } c.stroke(); }
    // head at the front (+u) end of the body, facing right
    const hp = body[n - 1]; dragonHead(c, hp[0] + 6, hp[1] - 4, 1.35, t);
  }

  function draw(k, t) {
    const c = k.ctx;
    // right end face (the wall's thickness) and the front face
    const zE = zcap(1) - 0.04;
    k.poly([[UB, V0, 0], [UB, V1, 0], [UB, V1, zE], [UB, V0, zE]], "#d2cab8", { lw: 1.3, wobble: 0 });
    const face = [];
    for (let i = 0; i <= N; i++) { const s = i / N, [u, v] = wpt(s); face.push(P(u, v, zcap(s) - 0.04)); }
    for (let i = N; i >= 0; i--) { const [u, v] = wpt(i / N); face.push(P(u, v, 0)); }
    c.save(); c.beginPath(); face.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath();
    const yT = P(UA, V1, 3.0)[1], yB = P(UB, V1, 0)[1];
    const g = c.createLinearGradient(0, yT, 0, yB); g.addColorStop(0, "#f4efe4"); g.addColorStop(1, "#ddd5c4"); c.fillStyle = g; c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke(); c.clip();
    c.beginPath(); for (let i = 0; i <= N; i++) { const s = i / N, [u, v] = wpt(s), p = P(u, v, zcap(s) - 0.04); i ? c.lineTo(...p) : c.moveTo(...p); } for (let i = N; i >= 0; i--) { const s = i / N, [u, v] = wpt(s), p = P(u, v, zcap(s) - 0.3); c.lineTo(...p); } c.closePath(); c.fillStyle = "rgba(90,80,60,0.18)"; c.fill();
    relief(k, t);
    c.restore();
    // coping: front tiled slope up to the rounded spine
    const E = [], T = [];
    for (let i = 0; i <= N; i++) { const s = i / N, [u] = wpt(s), z = zcap(s); E.push([u, V1 + 0.15, z - 0.08]); T.push([u, (V0 + V1) / 2, z + 0.26]); }
    tileFace(k, E, T, { sag: 0.03, ribs: 75, rows: 2, light: 0.2 });
    const sp = T.map((p) => P(p[0], p[1], p[2] + 0.02));
    const st = (w, col) => { c.beginPath(); sp.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.strokeStyle = col; c.lineWidth = w; c.lineCap = "round"; c.lineJoin = "round"; c.stroke(); };
    st(8.5, INK); st(6.2, "#8d9198"); st(2.6, "#bfc1c4"); st(0.9, "#e8e8e6");
    c.strokeStyle = "rgba(30,30,36,0.55)"; c.lineWidth = 0.8;
    for (let i = 1; i < sp.length; i++) { const [x, y] = sp[i]; c.beginPath(); c.arc(x, y + 1, 2.6, 0.2, Math.PI - 0.2); c.stroke(); }
  }
  return { draw, UA, UB, V0, V1 };
}

// ---------------- zigzag bridge ----------------
// BR: centre line, legs alternate along v and along u. Returns drawing of the deck + rails (depth-sorted pieces).
export function makeBridge(BR, { BW = 0.62, DZ = 0.6, DTH = 0.14 } = {}) {
  const hw = BW / 2;
  function draw(k) {
    const c = k.ctx, n = BR.length - 1;
    const dirs = []; for (let i = 0; i < n; i++) { const du = BR[i + 1][0] - BR[i][0], dv = BR[i + 1][1] - BR[i][1], L = Math.hypot(du, dv); dirs.push([du / L, dv / L, L]); }
    const postAt = (u, v, big) => {
      const [x, y0] = P(u, v, DZ), [, y1] = P(u, v, DZ + (big ? 0.5 : 0.42));
      c.fillStyle = "#efe7d4"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.rect(x - 2.6, y1, 5.2, y0 - y1); c.fill(); c.stroke();
      c.fillStyle = "rgba(0,0,0,0.12)"; c.fillRect(x, y1, 2.6, y0 - y1);
      c.fillStyle = "#f4eedf"; c.beginPath(); c.arc(x, y1 - 2.2, big ? 3.6 : 3, 0, 7); c.fill(); c.stroke();
      c.fillStyle = "rgba(255,255,255,0.7)"; c.beginPath(); c.arc(x - 1, y1 - 3.2, 1, 0, 7); c.fill();
    };
    const panel = (a, b) => {
      const q = [P(a[0], a[1], DZ + 0.04), P(b[0], b[1], DZ + 0.04), P(b[0], b[1], DZ + 0.34), P(a[0], a[1], DZ + 0.34)];
      k.path(q, { fill: "#e6dcc5", lw: 1, wobble: 0 });
      const inset = q.map((p) => [lerp(p[0], (q[0][0] + q[2][0]) / 2, 0.22), lerp(p[1], (q[0][1] + q[2][1]) / 2, 0.4)]);
      k.path(inset, { fill: "#d6c9ad", stroke: "#a99a7c", lw: 0.8, wobble: 0 });
      const m = [(q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2]; c.strokeStyle = "rgba(120,105,80,0.8)"; c.lineWidth = 0.7; c.beginPath(); c.arc(m[0] - 2, m[1], 1.6, 0, 5); c.arc(m[0] + 2, m[1], 1.6, 3, 8); c.stroke();
      c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.moveTo(...q[3]); c.lineTo(...q[2]); c.stroke(); c.strokeStyle = "#f2ebda"; c.lineWidth = 2; c.stroke();
    };
    for (let s = 0; s < n; s++) {
      const [du, dv, L] = dirs[s], nu = -dv, nv = du;
      const prev = s > 0 ? dirs[s - 1] : null, next = s < n - 1 ? dirs[s + 1] : null;
      const ext0 = s > 0 ? hw : 0, ext1 = s < n - 1 ? hw : 0;
      const sideRange = (side) => {
        let a = 0, b = L;
        if (prev) { const inner = (-prev[0] * nu - prev[1] * nv) * side > 0; a = inner ? hw : -hw; }
        if (next) { const inner = (next[0] * nu + next[1] * nv) * side > 0; b = inner ? L - hw : L + hw; }
        return [a, b];
      };
      const at = (d, side) => [BR[s][0] + du * d + nu * hw * side, BR[s][1] + dv * d + nv * hw * side];
      const alongU = Math.abs(du) > 0.5;
      const np = Math.max(1, Math.round((L + ext0 + ext1) / 0.45));
      for (let i = 0; i < np; i++) {
        const d0 = lerp(-ext0, L + ext1, i / np), d1 = lerp(-ext0, L + ext1, (i + 1) / np), m0 = (d0 + d1) / 2;
        const cu = BR[s][0] + du * m0, cv = BR[s][1] + dv * m0;
        k.q(cu + cv - 0.02, () => {
          const pa = [BR[s][0] + du * d0, BR[s][1] + dv * d0], pb = [BR[s][0] + du * d1, BR[s][1] + dv * d1];
          const x0 = Math.min(pa[0], pb[0]) - (alongU ? 0 : hw), y0 = Math.min(pa[1], pb[1]) - (alongU ? hw : 0);
          const dx = Math.abs(pb[0] - pa[0]) + (alongU ? 0 : BW), dy = Math.abs(pb[1] - pa[1]) + (alongU ? BW : 0);
          if (i === 0 || i === np - 1) for (const side of [-1, 1]) { const d = i === 0 ? d0 + 0.1 : d1 - 0.1, [pu, pv] = at(d, side * 0.75); const [x, y] = P(pu, pv, 0), [, y1] = P(pu, pv, DZ - DTH); c.fillStyle = "#cfc3a6"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.rect(x - 3.5, y1, 7, y - y1); c.fill(); c.stroke(); c.fillStyle = "rgba(0,0,0,0.15)"; c.fillRect(x, y1, 3.5, y - y1); }
          k.box(x0, y0, DZ - DTH, dx, dy, DTH, "#d9cdb1", { hatch: false, shadow: false, top: "#ece3cf" });
          c.strokeStyle = "rgba(140,120,90,0.45)"; c.lineWidth = 0.7; c.beginPath();
          const e = alongU ? [P(pa[0], cv - hw, DZ), P(pa[0], cv + hw, DZ)] : [P(cu - hw, pa[1], DZ), P(cu + hw, pa[1], DZ)]; c.moveTo(...e[0]); c.lineTo(...e[1]); c.stroke();
        });
      }
      for (const side of [-1, 1]) {
        const facing = (nu + nv) * side;
        const [a, b] = sideRange(side), npc = Math.max(1, Math.round((b - a) / 0.42));
        for (let i = 0; i < npc; i++) {
          const d0 = lerp(a, b, i / npc), d1 = lerp(a, b, (i + 1) / npc), pm = at((d0 + d1) / 2, side);
          k.q(pm[0] + pm[1] + (facing > 0 ? 0.02 : -0.02), () => {
            const pa = at(d0, side), pb = at(d1, side);
            panel(pa, pb);
            postAt(pa[0], pa[1], (s === 0 && i === 0) || (s === n - 1 && i === 0));
            if (i === npc - 1) postAt(pb[0], pb[1], (s === 0 && i === npc - 1) || (s === n - 1 && i === npc - 1));
          });
        }
      }
    }
  }
  function ripples(k, t) {
    const c = k.ctx; c.save(); c.strokeStyle = "rgba(255,255,255,0.55)"; c.lineWidth = 1.1;
    BR.forEach(([u, v], i) => { for (const d of [-0.3, 0.3]) { const ph = (t * 0.5 + i * 0.37 + d) % 1; c.globalAlpha = 0.5 * (1 - ph); const [x, y] = P(u + d, v - d, 0); c.beginPath(); c.ellipse(x, y + 1, 6 + ph * 12, (6 + ph * 12) * 0.45, 0, 0, 7); c.stroke(); } });
    c.restore();
    for (let s = 0; s < BR.length - 1; s++) { const [a, b] = [BR[s], BR[s + 1]], pad = 0.36; const u0 = Math.min(a[0], b[0]) - pad + 0.2, u1 = Math.max(a[0], b[0]) + pad + 0.2, v0 = Math.min(a[1], b[1]) - pad + 0.25, v1 = Math.max(a[1], b[1]) + pad + 0.25; k.path([P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)], { fill: "rgba(18,60,53,0.18)", stroke: false, wobble: 0 }); }
  }
  return { draw, ripples };
}
