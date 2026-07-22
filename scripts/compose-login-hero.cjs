// One-off asset generator for the login page hero image.
// Input: scripts/assets/login-hero-source.png (stock photo, solid light-blue backdrop)
//        scripts/assets/book-cover-source.jpg  (real textbook cover to swap onto the book she's holding)
// Output: public/static/images/login-hero.png  (transparent-background PNG used by src/pages/login.html)
//
// Run with: node scripts/compose-login-hero.cjs
const sharp = require('sharp');
const path = require('path');

const ASSET_DIR = path.join(__dirname, 'assets');
const OUT_DIR = path.join(__dirname, '..', 'public', 'static', 'images');
const PHOTO = path.join(ASSET_DIR, 'login-hero-source.png');
const COVER = path.join(ASSET_DIR, 'book-cover-source.jpg');
const OUT = path.join(OUT_DIR, 'login-hero.webp');

const W = 1456, H = 734;

// Destination quad for the book cover face, in photo coords: [TL, TR, BR, BL]
const quad = [
  [958, 462],
  [1082, 388],
  [1100, 562],
  [900, 585],
];

// Soft ellipse mask restoring the hand/fingers that occlude the bottom-left
// of the book quad, so the swapped cover doesn't paint over them.
const fingerMask = { cx: 950, cy: 575, rx: 80, ry: 60, innerRatio: 0.55 };

// Background chroma-key: sampled from the photo's solid-color backdrop corners.
// Raw RGB distance alone isn't enough: the tablet screen and notebook paper
// happen to land within that distance too (they're just other light-toned
// surfaces), so keying also requires "blueness" (B-R) to rule out neutral/
// warm-toned objects that merely resemble the backdrop's brightness.
const BG_COLOR = [185, 217, 226];
const BG_INNER = 18; // distance below this => fully transparent
const BG_OUTER = 55; // distance above this => fully opaque
const BG_MIN_BLUENESS = 15; // B-R below this => not actually blue, never key it

// --- Homography (planar 4-point DLT via Gaussian elimination) -------------
// Solves H such that dst ~ H * src (homogeneous). Used here to map FROM the
// photo's destination quad back TO the cover-image rectangle, so every
// output pixel has a source pixel to sample (avoids gaps from forward mapping).
function solveHomography(src, dst) {
  const A = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i];
    const [xp, yp] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -x * xp, -y * xp, xp]);
    A.push([0, 0, 0, x, y, 1, -x * yp, -y * yp, yp]);
  }
  const n = 8;
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(A[r][col]) > Math.abs(A[pivot][col])) pivot = r;
    }
    if (Math.abs(A[pivot][col]) < 1e-9) {
      throw new Error(`solveHomography: degenerate point configuration (near-zero pivot at column ${col})`);
    }
    [A[col], A[pivot]] = [A[pivot], A[col]];
    const pv = A[col][col];
    for (let c = col; c <= n; c++) A[col][c] /= pv;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = A[r][col];
      for (let c = col; c <= n; c++) A[r][c] -= factor * A[col][c];
    }
  }
  const h = A.map(row => row[n]);
  return [
    [h[0], h[1], h[2]],
    [h[3], h[4], h[5]],
    [h[6], h[7], 1],
  ];
}

function apply(H, x, y) {
  const d = H[2][0] * x + H[2][1] * y + H[2][2];
  return [
    (H[0][0] * x + H[0][1] * y + H[0][2]) / d,
    (H[1][0] * x + H[1][1] * y + H[1][2]) / d,
  ];
}

// Precomputed half-plane edge test for a CONVEX quad (cheaper than generic
// even-odd ray casting: one dot product per edge, no division, no branches).
function makeConvexQuadTest(poly) {
  const edges = poly.map((p, i) => {
    const q = poly[(i + 1) % poly.length];
    return { ax: p[0], ay: p[1], dx: q[0] - p[0], dy: q[1] - p[1] };
  });
  // Determine the sign convention from one interior-ish point (centroid).
  const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length;
  const cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
  const signs = edges.map(e => Math.sign((cx - e.ax) * e.dy - (cy - e.ay) * e.dx) || 1);
  return (x, y) => {
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      const cross = (x - e.ax) * e.dy - (y - e.ay) * e.dx;
      if (Math.sign(cross) !== signs[i] && cross !== 0) return false;
    }
    return true;
  };
}

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

async function buildWarpedCoverLayer() {
  const { data: coverData, info: coverInfo } = await sharp(COVER)
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const cw = coverInfo.width, ch = coverInfo.height;

  const srcRect = [[0, 0], [cw, 0], [cw, ch], [0, ch]];
  const Hinv = solveHomography(quad, srcRect);
  const insideQuad = makeConvexQuadTest(quad);

  const xs = quad.map(p => p[0]), ys = quad.map(p => p[1]);
  const minX = Math.max(0, Math.floor(Math.min(...xs)));
  const maxX = Math.min(W, Math.ceil(Math.max(...xs)));
  const minY = Math.max(0, Math.floor(Math.min(...ys)));
  const maxY = Math.min(H, Math.ceil(Math.max(...ys)));
  const bw = maxX - minX, bh = maxY - minY;

  const layer = Buffer.alloc(bw * bh * 4, 0);

  function sampleCover(sx, sy) {
    if (!Number.isFinite(sx) || !Number.isFinite(sy)) return null;
    if (sx < 0 || sy < 0 || sx > cw - 1 || sy > ch - 1) return null;
    const x0 = Math.floor(sx), y0 = Math.floor(sy);
    const x1 = Math.min(x0 + 1, cw - 1), y1 = Math.min(y0 + 1, ch - 1);
    const fx = sx - x0, fy = sy - y0;
    const idx = (x, y) => (y * cw + x) * 4;
    const out = [0, 0, 0, 0];
    for (let c = 0; c < 4; c++) {
      const v00 = coverData[idx(x0, y0) + c];
      const v10 = coverData[idx(x1, y0) + c];
      const v01 = coverData[idx(x0, y1) + c];
      const v11 = coverData[idx(x1, y1) + c];
      const top = v00 * (1 - fx) + v10 * fx;
      const bot = v01 * (1 - fx) + v11 * fx;
      out[c] = top * (1 - fy) + bot * fy;
    }
    return out;
  }

  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      if (!insideQuad(x + 0.5, y + 0.5)) continue;
      const [sx, sy] = apply(Hinv, x, y);
      const px = sampleCover(sx, sy);
      if (!px) continue;
      const o = ((y - minY) * bw + (x - minX)) * 4;
      layer[o] = Math.round(px[0]);
      layer[o + 1] = Math.round(px[1]);
      layer[o + 2] = Math.round(px[2]);
      layer[o + 3] = Math.round(px[3]);
    }
  }

  return { layer, left: minX, top: minY, width: bw, height: bh };
}

// Flood-fill chroma key: only pixels *connected* to the border backdrop get
// keyed out, so objects that merely share a similar color (e.g. the tablet's
// light-gray screen) but are enclosed by a different-colored boundary (its
// black bezel) are left alone instead of being falsely made transparent.
function colorDistance(out, o) {
  const dr = out[o] - BG_COLOR[0], dg = out[o + 1] - BG_COLOR[1], db = out[o + 2] - BG_COLOR[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

async function removeBackground(photoData, photoInfo) {
  const { width, height } = photoInfo;
  const out = Buffer.from(photoData);
  const visited = new Uint8Array(width * height);
  const stack = [];

  for (let x = 0; x < width; x++) { stack.push(x, 0); stack.push(x, height - 1); }
  for (let y = 0; y < height; y++) { stack.push(0, y); stack.push(width - 1, y); }

  while (stack.length) {
    const y = stack.pop(), x = stack.pop();
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const p = y * width + x;
    if (visited[p]) continue;
    visited[p] = 1;

    const o = p * 4;
    const dist = colorDistance(out, o);
    const blueness = out[o + 2] - out[o];
    if (dist > BG_OUTER || blueness < BG_MIN_BLUENESS) continue; // object boundary reached: stop expanding here

    out[o + 3] = Math.round(out[o + 3] * smoothstep(BG_INNER, BG_OUTER, dist));
    stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }

  return out;
}

function buildFingerRestoreLayer(originalNoBgData, width, height) {
  const { cx, cy, rx, ry, innerRatio } = fingerMask;
  const minX = Math.max(0, Math.floor(cx - rx));
  const maxX = Math.min(width, Math.ceil(cx + rx));
  const minY = Math.max(0, Math.floor(cy - ry));
  const maxY = Math.min(height, Math.ceil(cy + ry));
  const bw = maxX - minX, bh = maxY - minY;
  const layer = Buffer.alloc(bw * bh * 4, 0);

  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      const nx = (x - cx) / rx, ny = (y - cy) / ry;
      const r = Math.sqrt(nx * nx + ny * ny);
      if (r > 1) continue;
      const maskAlpha = 1 - smoothstep(innerRatio, 1, r);
      const srcO = (y * width + x) * 4;
      const dstO = ((y - minY) * bw + (x - minX)) * 4;
      layer[dstO] = originalNoBgData[srcO];
      layer[dstO + 1] = originalNoBgData[srcO + 1];
      layer[dstO + 2] = originalNoBgData[srcO + 2];
      layer[dstO + 3] = Math.round(originalNoBgData[srcO + 3] * maskAlpha);
    }
  }
  return { layer, left: minX, top: minY, width: bw, height: bh };
}

async function main() {
  const { data: photoData, info: photoInfo } = await sharp(PHOTO)
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const noBg = await removeBackground(photoData, photoInfo);
  const cover = await buildWarpedCoverLayer();
  const fingers = buildFingerRestoreLayer(noBg, photoInfo.width, photoInfo.height);

  await sharp(noBg, { raw: { width: photoInfo.width, height: photoInfo.height, channels: 4 } })
    .composite([
      { input: cover.layer, raw: { width: cover.width, height: cover.height, channels: 4 }, left: cover.left, top: cover.top },
      { input: fingers.layer, raw: { width: fingers.width, height: fingers.height, channels: 4 }, left: fingers.left, top: fingers.top },
    ])
    .webp({ quality: 82 })
    .toFile(OUT);

  console.log('wrote', OUT);
}

main().catch(e => { console.error(e); process.exit(1); });
