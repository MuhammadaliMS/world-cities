// helpers for Dubai -1,0 (copied from _props.js, which is shared and not edited here)
export function look(seed) {
  const m = seed % 9;
  if (m === 0 || m === 4) return { style: "coat", top: "#f6f3ec", bottom: "#f6f3ec", hat: "cap", hatCol: "#f8f6f0", hairStyle: "short", shoes: "#6a4a30" }; // thobe + ghutra
  if (m === 1 || m === 6) return { style: "coat", top: "#26222a", bottom: "#26222a", hat: "beret", hatCol: "#26222a", hairStyle: "bun", shoes: "#26222a" }; // abaya
  if (m === 2) return { style: "dress", hat: "sunhat", hatCol: "#f1e6c8" };
  if (m === 3) return { style: "shirt", hat: "cap" };
  if (m === 5) return { style: "tee", shorts: true, hat: null };
  return {};
}
export const circlePoly = (u, v, r, n = 28, sq = 1) => Array.from({ length: n }, (_, i) => [u + Math.cos((i / n) * 6.2832) * r, v + Math.sin((i / n) * 6.2832) * r * sq]);
export const TAU = Math.PI * 2;
// distance from (u,v) to a polyline given as sampled points
export const distTo = (pts, u, v) => { let d = 1e9; for (const p of pts) d = Math.min(d, Math.hypot(p[0] - u, p[1] - v)); return d; };
