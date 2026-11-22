#!/usr/bin/env python3
"""Trace a tile's ground layout (lawn / water / paved) from its Codex reference.

    python3 tools/trace-ground.py paris 0,0            -> vtiles/paris/0_0.ground.js (+ out/trace/paris_0_0_ground.png check)
    python3 tools/trace-ground.py paris all

The reference is warped into canonical tile space exactly like trace.html (slab-bottom corners from
manifest.json, REF_SLAB 1.15 so the top surface sits on z=0), split by colour inside the top-surface
diamond, cleaned, smoothed, and written as (u, v) polygons. Objects standing on the ground (trees,
buildings) are filled in by their surroundings, so the polygons describe the ground under them.
"""
import json, sys, os
import numpy as np
import cv2

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S, X0, Y0, YS, ZS = 45, 512, 405, 0.577, 0.94


def P(u, v, z=0.0):
    return (X0 + (u - v) * S, Y0 + (u + v) * S * YS - z * S * ZS)


def to_uv(x, y):
    a = (x - X0) / S
    b = (y - Y0) / (S * YS)
    return ((a + b) / 2, (b - a) / 2)


def warp(city, key, ref_slab=1.15):
    man = json.load(open(f"{ROOT}/assets/{city}/manifest.json"))
    m = man[key]
    img = cv2.imread(f"{ROOT}/{m['file']}", cv2.IMREAD_UNCHANGED)
    if img.shape[2] == 4:
        a = img[:, :, 3:4] / 255.0
        img = (img[:, :, :3] * a + 229 * (1 - a)).astype(np.uint8)
    yl = m["by"] - m["slopeL"] * (m["bx"] - m["lx"])
    yr = m["by"] - m["slopeR"] * (m["rx"] - m["bx"])
    src = np.float32([[m["bx"], m["by"]], [m["lx"], yl], [m["rx"], yr]])
    rs = m.get("refSlab", ref_slab)
    dst = np.float32([P(10, 10, -rs), P(0, 10, -rs), P(10, 0, -rs)])
    A = cv2.getAffineTransform(src, dst)
    return cv2.warpAffine(img, A, (1024, 1024), flags=cv2.INTER_LINEAR, borderValue=(229, 240, 245))


def classify(img):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    h, s, v = hsv[:, :, 0].astype(int), hsv[:, :, 1].astype(int), hsv[:, :, 2].astype(int)
    diamond = np.zeros(img.shape[:2], np.uint8)
    cv2.fillPoly(diamond, [np.int32([P(0, 0), P(10, 0), P(10, 10), P(0, 10)])], 255)
    # shrink a little so the slab outline does not count
    diamond = cv2.erode(diamond, np.ones((7, 7), np.uint8))
    green = ((h >= 26) & (h <= 52) & (s >= 85) & (v >= 50)).astype(np.uint8) * 255
    water = ((h >= 82) & (h <= 112) & (s >= 45) & (v >= 70)).astype(np.uint8) * 255
    green &= diamond
    water &= diamond
    return green, water, diamond


def clean(mask, close=9, open_=5, min_area=900):
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (close, close))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, k, iterations=2)
    k2 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (open_, open_))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, k2, iterations=1)
    mask = cv2.GaussianBlur(mask, (9, 9), 0)
    mask = (mask > 127).astype(np.uint8) * 255
    n, lab, stats, _ = cv2.connectedComponentsWithStats(mask)
    out = np.zeros_like(mask)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] >= min_area:
            out[lab == i] = 255
    return out


def polys(mask, eps=1.6, min_area=900):
    """outer shapes + holes, as (u,v) lists; holes are returned separately (drawn back as paving)."""
    cnts, hier = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    outer, holes = [], []
    if hier is None:
        return outer, holes
    for c, hh in zip(cnts, hier[0]):
        if cv2.contourArea(c) < min_area:
            continue
        c = cv2.approxPolyDP(c, eps, True)
        pts = [[round(v, 3) for v in to_uv(float(p[0][0]), float(p[0][1]))] for p in c]
        (holes if hh[3] >= 0 else outer).append(pts)
    return outer, holes


def skeleton_paths(mask, min_len=45, eps=2.5):
    """centre lines of the walkable paving as polylines (u,v)."""
    from skimage.morphology import skeletonize
    sk = skeletonize(mask > 0).astype(np.uint8)
    H, W = sk.shape
    ys, xs = np.nonzero(sk)
    pix = set(zip(xs.tolist(), ys.tolist()))
    nb = lambda x, y: [(x + dx, y + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if (dx or dy) and (x + dx, y + dy) in pix]
    deg = {p: len(nb(*p)) for p in pix}
    nodes = {p for p, d in deg.items() if d != 2}
    seen = set()
    paths = []
    def walk(a, b):
        path = [a, b]
        prev, cur = a, b
        while cur not in nodes:
            nxt = [q for q in nb(*cur) if q != prev and (min(cur, q), max(cur, q)) not in seen]
            if not nxt:
                break
            seen.add((min(cur, nxt[0]), max(cur, nxt[0])))
            prev, cur = cur, nxt[0]
            path.append(cur)
        return path
    for n in nodes:
        for q in nb(*n):
            e = (min(n, q), max(n, q))
            if e in seen:
                continue
            seen.add(e)
            paths.append(walk(n, q))
    out = []
    for p in paths:
        if len(p) < min_len:
            continue
        c = cv2.approxPolyDP(np.int32(p).reshape(-1, 1, 2), eps, False)
        out.append([[round(v, 3) for v in to_uv(float(q[0][0]), float(q[0][1]))] for q in c])
    return out


def run(city, key):
    img = warp(city, key)
    green, water, diamond = classify(img)
    green = clean(green)
    water = clean(water, close=11, open_=7, min_area=600)
    # carry lawn/water out across the slab-edge strip we ignored (so lawns meet the tile edge)
    full = np.zeros(img.shape[:2], np.uint8)
    cv2.fillPoly(full, [np.int32([P(0, 0), P(10, 0), P(10, 10), P(0, 10)])], 255)
    full = cv2.dilate(full, np.ones((5, 5), np.uint8))
    band = cv2.bitwise_and(full, cv2.bitwise_not(cv2.erode(diamond, np.ones((5, 5), np.uint8))))
    for m in (green, water):
        grown = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31)))
        m |= cv2.bitwise_and(grown, band)
    green &= cv2.bitwise_not(water)
    # small holes inside a lawn (picnic blankets, flower beds, props) are still lawn, not paving
    cnts, hier = cv2.findContours(green, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    if hier is not None:
        for c_, hh in zip(cnts, hier[0]):
            if hh[3] >= 0 and cv2.contourArea(c_) < 16000:
                cv2.drawContours(green, [c_], -1, 255, -1)
    lawn, lawn_holes = polys(green)
    wat, wat_holes = polys(water, min_area=600)
    # average colours, so the code can match the reference palette
    def avg(mask):
        if mask.sum() == 0:
            return None
        b, g, r = [int(x) for x in cv2.mean(img, mask=mask)[:3]]
        return "#%02x%02x%02x" % (r, g, b)
    paved = cv2.bitwise_and(diamond, cv2.bitwise_not(cv2.bitwise_or(green, water)))
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    hh, ss, vv = hsv[:, :, 0].astype(int), hsv[:, :, 1].astype(int), hsv[:, :, 2].astype(int)
    sand = (((hh >= 8) & (hh <= 30) & (ss >= 15) & (ss <= 110) & (vv >= 165)) | ((ss < 30) & (vv >= 175))).astype(np.uint8) * 255
    sand &= cv2.bitwise_not(cv2.bitwise_or(green, water))
    sand &= cv2.erode(diamond, np.ones((15, 15), np.uint8))
    sand = clean(sand, close=13, open_=9, min_area=1500)
    walks = skeleton_paths(cv2.erode(sand, np.ones((9, 9), np.uint8)))
    data = {"lawn": lawn, "lawnHoles": lawn_holes, "water": wat, "waterHoles": wat_holes,
            "walks": walks, "colors": {"lawn": avg(green), "water": avg(water), "paved": avg(paved)}}
    fk = key.replace(",", "_")
    os.makedirs(f"{ROOT}/vtiles/{city}", exist_ok=True)
    with open(f"{ROOT}/vtiles/{city}/{fk}.ground.js", "w") as f:
        f.write("// auto-traced from the reference by tools/trace-ground.py — do not hand edit; re-run instead\n")
        f.write("export default " + json.dumps(data, separators=(",", ":")) + ";\n")
    # check image: reference with traced outlines
    chk = img.copy()
    for poly, col in [(lawn, (40, 160, 40)), (lawn_holes, (0, 140, 255)), (wat, (200, 80, 0)), (wat_holes, (0, 0, 255))]:
        for p in poly:
            cv2.polylines(chk, [np.int32([P(u, v) for u, v in p])], True, col, 2)
    for p in walks:
        cv2.polylines(chk, [np.int32([P(u, v) for u, v in p])], False, (200, 0, 200), 2)
    os.makedirs(f"{ROOT}/out/trace", exist_ok=True)
    cv2.imwrite(f"{ROOT}/out/trace/{city}_{fk}_ground.png", chk)
    print(f"{city} {key}: lawn {len(lawn)} (+{len(lawn_holes)} holes), water {len(wat)}, walks {len(walks)}; colours {data['colors']}")


if __name__ == "__main__":
    city, key = sys.argv[1], sys.argv[2]
    keys = [f"{gx},{gy}" for gx in (-1, 0, 1) for gy in (-1, 0, 1)] if key == "all" else [key]
    for k in keys:
        run(city, k)
