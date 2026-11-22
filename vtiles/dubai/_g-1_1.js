// grid-pass helpers for the Dubai -1,1 tile (axis-aligned rects, footbridge profile, closed boat loop)
import { clamp } from "../../lib/vec-kit.js";

// axis-aligned rectangle as a clockwise-on-screen (u,v) outline
export const rect = (u0, v0, u1, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];

// footbridge across the basin along v (u 7.0-7.6, v 7.05-9.7); deck rises to a crown mid-span, ends at deck level
export const BRU = [7.0, 7.6], BRV0 = 7.05, BRV1 = 9.7;
export const brZ = (v) => 0.06 + 0.55 * Math.sin(Math.PI * clamp((v - BRV0) / (BRV1 - BRV0)));

// closed elliptical loop (centre cx,cy, semi-axes a,b along u,v): position + unit heading
export function loopSample(cx, cy, a, b, period, t, phase = 0) {
  const th = 2 * Math.PI * (t / period + phase), du = -a * Math.sin(th), dv = b * Math.cos(th), L = Math.hypot(du, dv);
  return { u: cx + a * Math.cos(th), v: cy + b * Math.sin(th), du: du / L, dv: dv / L };
}
