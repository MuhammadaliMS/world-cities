// helpers copied/adapted for the grid pass of london 1,-1 (Buckingham Palace)
import { P, CTS, INK, shade, lerp } from "../../lib/vec-kit.js";

export function quad(c, pts, fill, lw = 0.9, stroke = INK) {
  c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (lw) { c.strokeStyle = stroke; c.lineWidth = lw; c.lineJoin = "round"; c.stroke(); }
}


export function tripleLamp(k, u, v, h = 1.9) {
  const c = k.ctx, [x, y] = P(u, v, 0), [, yt] = P(u, v, h);
  k.ell(u + 0.1, v + 0.05, 0, 0.13, "rgba(60,45,30,0.16)", { stroke: false });
  quad(c, [[x - 5, y], [x + 5, y], [x + 3, y - 9], [x - 3, y - 9]], "#25282b", 1);
  c.lineCap = "round"; c.strokeStyle = INK; c.lineWidth = 4.2; c.beginPath(); c.moveTo(x, y - 8); c.lineTo(x, yt + 4); c.stroke(); c.strokeStyle = "#2c3034"; c.lineWidth = 2.4; c.stroke();
  c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - 9, yt + 4); c.quadraticCurveTo(x, yt + 10, x + 9, yt + 4); c.stroke();
  for (const [dx, dy, r] of [[-9, 2, 4.4], [9, 2, 4.4], [0, -6, 5.2]]) {
    c.beginPath(); c.arc(x + dx, yt + dy, r, 0, 7); c.fillStyle = "#f0cf68"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
    c.fillStyle = "rgba(255,255,255,0.65)"; c.beginPath(); c.arc(x + dx - r * 0.3, yt + dy - r * 0.3, r * 0.3, 0, 7); c.fill();
  }
  c.fillStyle = "#e0b640"; c.beginPath(); c.arc(x, yt - 13, 1.8, 0, 7); c.fill();
}


export function sentryBox(k, u, v, guard = true) {
  const c = k.ctx, [x, y] = P(u, v, 0);
  k.ell(u + 0.1, v + 0.05, 0, 0.3, "rgba(60,45,30,0.16)", { stroke: false });
  quad(c, [[x - 12, y], [x + 12, y], [x + 12, y - 50], [x, y - 58], [x - 12, y - 50]], "#2f6a58", 1.2);
  quad(c, [[x - 8, y - 2], [x + 8, y - 2], [x + 8, y - 46], [x - 8, y - 46]], "#7a4a32", 0.9);
  c.fillStyle = "#c8362f"; c.fillRect(x - 6, y - 38, 12, 34);
  c.fillStyle = "#e4c150"; c.fillRect(x - 12, y - 51, 24, 2.4);
  if (guard) {
    c.fillStyle = "#c8362f"; c.fillRect(x - 4, y - 34, 8, 20); c.strokeStyle = INK; c.lineWidth = 0.8; c.strokeRect(x - 4, y - 34, 8, 20);
    c.fillStyle = "#e9c4a0"; c.beginPath(); c.arc(x, y - 38, 3, 0, 7); c.fill(); c.stroke();
    c.fillStyle = "#1e1c1c"; c.beginPath(); c.roundRect(x - 3.6, y - 51, 7.2, 11, 3); c.fill();
  }
}


export function bearskin(k, r) {
  const c = k.ctx, w = r.hr * 1.5, h = r.hr * 2.5;
  c.fillStyle = "#1e1c1c"; c.strokeStyle = INK; c.lineWidth = 0.8;
  c.beginPath(); c.moveTo(r.x - w * 0.75, r.headY - r.hr * 0.4); c.quadraticCurveTo(r.x - w * 0.85, r.headY - h * 0.95, r.x, r.headY - h); c.quadraticCurveTo(r.x + w * 0.85, r.headY - h * 0.95, r.x + w * 0.75, r.headY - r.hr * 0.4); c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = "rgba(255,255,255,0.18)"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(r.x - w * 0.3, r.headY - r.hr * 0.6); c.lineTo(r.x - w * 0.3, r.headY - h * 0.8); c.stroke();
  c.fillStyle = "#f2efe6"; c.fillRect(r.x + w * 0.45, r.headY - h * 0.8, 1.6, 4);
}


// ----- Victoria Memorial (centre of the plaza) -----
export function memorial(k, u, v, t) {
  const c = k.ctx, W = "#efe8da", WL = "#f7f2e6", WD = "#c9bfae", B = "#42443c";
  k.ell(u, v, 0, 1.95, "#eadcc4", { lw: 1.2 });
  k.ell(u, v, 0, 1.78, null, { stroke: "rgba(120,100,70,0.5)", lw: 0.8 });
  k.cyl(u, v, 0, 1.5, 0.1, "#e6dcc8"); k.cyl(u, v, 0.1, 1.2, 0.12, "#ede4d0"); k.cyl(u, v, 0.22, 0.95, 0.12, "#f1e9d8");
  // balustrade ring round the basin
  { const N = 44; for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2; if (Math.sin(a) < -0.35 && Math.cos(a) > -0.2) continue; const bu = u + Math.cos(a) * 1.78, bv = v + Math.sin(a) * 1.78; const [x, y] = P(bu, bv, 0); c.strokeStyle = "#b8ab94"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 7); c.stroke(); } }
  k.cyl(u, v, 0, 1.5, 0.1, "#e6dcc8"); k.cyl(u, v, 0.1, 1.2, 0.12, "#ede4d0"); k.cyl(u, v, 0.22, 0.95, 0.12, "#f1e9d8");
  // water in the basin ring with tiny shimmer
  k.ell(u, v, 0.1, 1.38, null, { stroke: "rgba(120,170,200,0.7)", lw: 1.4 });
  // bronze groups: figure + lion on low plinths, four sides
  for (const [du, dv, seed] of [[1.15, -1.0, 1], [-1.0, 1.15, 2], [1.45, 0.25, 3], [0.25, 1.45, 4]]) {
    const pu = u + du, pv = v + dv;
    k.box(pu - 0.22, pv - 0.22, 0, 0.44, 0.44, 0.3, "#ddd4c0", { hatch: false });
    k.box(pu - 0.26, pv - 0.26, 0.3, 0.52, 0.52, 0.05, "#efe6d2", { hatch: false });
    const [x, y] = P(pu, pv, 0.35);
    c.fillStyle = B; c.strokeStyle = INK; c.lineWidth = 1;
    // recumbent lion body + mane + head
    c.beginPath(); c.ellipse(x - 2, y - 6, 11, 6, 0, 0, 7); c.fill(); c.stroke();
    c.beginPath(); c.arc(x + 8, y - 11, 4.6, 0, 7); c.fill(); c.stroke();
    c.beginPath(); c.arc(x + 10, y - 10, 2.2, 0, 7); c.fillStyle = "#5b5d52"; c.fill();
    c.fillStyle = B; c.beginPath(); c.moveTo(x - 12, y - 6); c.quadraticCurveTo(x - 17, y - 2, x - 15, y + 2); c.lineTo(x - 12, y - 1); c.fill(); c.stroke();
    // standing bronze figure beside it, with raised arm
    c.beginPath(); c.moveTo(x - 4, y - 12); c.lineTo(x - 1, y - 12); c.lineTo(x + 0.5, y - 26); c.lineTo(x - 3.5, y - 26); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.arc(x - 2, y - 29, 2.6, 0, 7); c.fill(); c.stroke();
    c.strokeStyle = B; c.lineWidth = 1.8; c.beginPath(); c.moveTo(x - 2, y - 24); c.lineTo(x + 3, y - 33); c.stroke();
    c.strokeStyle = "rgba(200,190,150,0.5)"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x - 8, y - 9); c.lineTo(x + 3, y - 8); c.stroke();
  }
  // pedestal tiers with gold fillets and reliefs
  k.cyl(u, v, 0.34, 0.98, 0.17, "#f4efe2"); k.cyl(u, v, 0.51, 0.86, 0.17, "#f7f3e8"); k.cyl(u, v, 0.68, 0.76, 0.5, "#fbf7ee");
  for (const [z, r] of [[0.51, 0.98], [0.68, 0.86], [1.18, 0.76]]) k.ell(u, v, z, r * 1.0, null, { stroke: "#d9b24a", lw: 1.2 });
  k.box(u - 0.5, v - 0.5, 1.18, 1.0, 1.0, 0.95, W, { hatch: false, left: WL, right: WD });
  for (const z of [0.68, 1.18, 2.13]) { const [ax, ay] = P(u + 0.5, v + 0.5, z); const [bx, by] = P(u + 0.5, v - 0.5, z), [cx, cy] = P(u - 0.5, v + 0.5, z); c.strokeStyle = "#d9b24a"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(cx, cy); c.lineTo(ax, ay); c.lineTo(bx, by); c.stroke(); }
  // relief panels + seated Victoria in niche on both visible faces
  for (const [fu, fv, dx] of [[0.5, 0, 1], [0, 0.5, -1]]) {
    const [x, y] = P(u + fu, v + fv, 1.65);
    c.fillStyle = dx > 0 ? "#cdbfa8" : "#d8cdb8"; c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.roundRect(x - 8, y - 17, 16, 28, [8, 8, 0, 0]); c.fill(); c.stroke();
    c.fillStyle = "#fbf6ea"; c.beginPath(); c.moveTo(x - 4, y + 9); c.lineTo(x + 4, y + 9); c.lineTo(x + 3.5, y - 2); c.lineTo(x - 3.5, y - 2); c.closePath(); c.fill(); c.beginPath(); c.arc(x, y - 6, 2.5, 0, 7); c.fill(); c.fillStyle = "#e6bd45"; c.fillRect(x - 2.2, y - 10, 4.4, 1.6);
    c.strokeStyle = "rgba(110,90,60,0.5)"; c.lineWidth = 0.6; c.strokeRect(x - 11, y + 13, 22, 4);
  }
  // corner pillars with seated white figures
  for (const [du, dv] of [[0.5, 0.5], [0.5, -0.5], [-0.5, 0.5]]) { const [x, y] = P(u + du, v + dv, 2.13); c.fillStyle = "#faf4e6"; c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.ellipse(x, y - 3, 3.4, 4.2, 0, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.arc(x, y - 9, 2.2, 0, 7); c.fill(); c.stroke(); }
  k.box(u - 0.4, v - 0.4, 2.13, 0.8, 0.8, 0.4, W, { hatch: false, left: WL, right: WD });
  // white marble groups on the base tier: seated figure + attendants (front three sides)
  for (const [du, dv] of [[0.78, 0.0], [0.0, 0.78], [0.62, 0.62]]) {
    const [x, y] = P(u + du, v + dv, 1.2);
    c.fillStyle = "#fbf6ea"; c.strokeStyle = INK; c.lineWidth = 0.9;
    c.beginPath(); c.ellipse(x, y - 6, 6.5, 8, 0, 0, 7); c.fill(); c.stroke();
    c.beginPath(); c.arc(x, y - 17, 3.3, 0, 7); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(x - 8, y - 3, 3.4, 5, 0, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.arc(x - 8, y - 10, 2.2, 0, 7); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(x + 8, y - 3, 3.4, 5, 0, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.arc(x + 8, y - 10, 2.2, 0, 7); c.fill(); c.stroke();
    c.strokeStyle = "#d9b24a"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x + 4, y - 14); c.lineTo(x + 7, y - 26); c.stroke();
  }
  // gilded globe + winged Victory
  { const [gx, gy] = P(u, v, 2.75); c.fillStyle = "#e6bd45"; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.arc(gx, gy - 4, 7, 0, 7); c.fill(); c.stroke(); c.strokeStyle = "rgba(120,80,10,0.6)"; c.lineWidth = 0.6; c.beginPath(); c.ellipse(gx, gy - 4, 7, 2.4, 0, 0, 7); c.stroke(); }
  const [ax, ay] = P(u, v, 3.0), flap = Math.sin(t * 2.6) * 2.4;
  c.fillStyle = "#e6bd45"; c.strokeStyle = INK; c.lineWidth = 1.1;
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(ax, ay - 10); c.quadraticCurveTo(ax + s * 15, ay - 24 - flap, ax + s * 17, ay - 36 - flap * 1.5); c.quadraticCurveTo(ax + s * 7, ay - 24, ax, ay - 4); c.closePath(); c.fill(); c.stroke(); c.strokeStyle = "rgba(120,80,10,0.6)"; c.lineWidth = 0.5; for (let q = 1; q < 4; q++) { c.beginPath(); c.moveTo(ax + s * 2, ay - 12 - q * 2); c.lineTo(ax + s * (6 + q * 3), ay - 24 - flap * q / 3 - q * 3); c.stroke(); } c.strokeStyle = INK; c.lineWidth = 1.1; }
  c.beginPath(); c.moveTo(ax - 4, ay - 2); c.quadraticCurveTo(ax, ay - 22, ax + 4, ay - 2); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.arc(ax, ay - 21, 3.2, 0, 7); c.fill(); c.stroke();
  c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(ax + 3, ay - 18); c.lineTo(ax + 11, ay - 31); c.stroke();
  c.strokeStyle = "#e6bd45"; c.lineWidth = 2; c.beginPath(); c.arc(ax + 12, ay - 33, 3, 0, 7); c.stroke();
}


// axis-aligned gilded railing along u at v = v0, from u0 to u1 (iron bars, two rails, gold spear tips)
export function railing(k, u0, u1, v, h = 0.62, o = {}) {
  const c = k.ctx, n = Math.max(2, Math.round((u1 - u0) / 0.085));
  c.lineCap = "round"; c.strokeStyle = "#1c1b1b"; c.lineWidth = 1.5; c.beginPath();
  for (let j = 0; j <= n; j++) { const u = lerp(u0, u1, j / n); c.moveTo(...P(u, v, 0.02)); c.lineTo(...P(u, v, h)); }
  c.stroke(); c.lineWidth = 1.3; c.beginPath();
  for (const z of [0.1, h * 0.8]) { c.moveTo(...P(u0, v, z)); c.lineTo(...P(u1, v, z)); }
  c.stroke(); c.fillStyle = o.tip || "#e4b940";
  for (let j = 0; j <= n; j++) { const u = lerp(u0, u1, j / n), [x, y] = P(u, v, h); c.beginPath(); c.moveTo(x - 1.7, y + 1); c.lineTo(x, y - 5); c.lineTo(x + 1.7, y + 1); c.closePath(); c.fill(); }
}
// stone gate pier (axis-aligned box) topped with a gold ball or a lamp base
export function gatePier(k, u, v, h = 1.05, w = 0.2, o = {}) {
  const c = k.ctx, col = o.col || "#e1cfae";
  k.box(u - w / 2, v - w / 2, 0, w, w, h, col, { hatch: false, shadow: false });
  k.box(u - w * 0.7, v - w * 0.7, h, w * 1.4, w * 1.4, 0.07, shade(col, 0.06), { hatch: false, shadow: false });
  const [x, y] = P(u, v, h + 0.07);
  if (!o.lamp) { c.beginPath(); c.arc(x, y - 5, 4.8, 0, 7); c.fillStyle = "#e4b940"; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke(); }
}
