// grades.js — the five colour grades the studio can lay over a photo.
//
// Each grade is a two-part recipe. The `filter` string rides along on
// ctx.filter while the photo itself is drawn, shifting brightness,
// contrast, saturation and hue in one pass. The finish — a stack of
// gradient washes, a vignette and a dusting of film grain — is painted
// over the panel afterwards by paintGradeFinish(). Grades are chosen
// per cover, and any single panel may override the cover's grade.

export const GRADE_RECIPES = {
  vice: {
    id: 'vice',
    name: 'Vice Sunset',
    filter: 'saturate(1.42) contrast(1.12) brightness(1.06) hue-rotate(-7deg)',
    overlays: [
      // Magenta wash pouring down from the top edge.
      { dir: 'down', stops: [[0, 'rgba(255,82,162,0.22)'], [0.55, 'rgba(255,82,162,0)']] },
      // Teal gathering in the shadows along the bottom.
      { dir: 'up', stops: [[0, 'rgba(0,72,92,0.36)'], [0.5, 'rgba(0,72,92,0)']] },
      // A warm halo high in the frame, where the sun would be.
      { dir: 'down', stops: [[0, 'rgba(255,172,62,0.11)'], [0.7, 'rgba(255,172,62,0)']] },
    ],
    vignette: 0.34,
    grain: 0.52,
  },
  neon: {
    id: 'neon',
    name: 'Neon Nights',
    filter: 'saturate(1.58) contrast(1.18) brightness(0.96) hue-rotate(12deg)',
    overlays: [
      // Electric blue raking in from the top-left corner.
      { dir: 'diag', stops: [[0, 'rgba(42,82,255,0.27)'], [0.6, 'rgba(42,82,255,0)']] },
      // Hot pink answering back from the bottom.
      { dir: 'up', stops: [[0, 'rgba(255,42,182,0.3)'], [0.55, 'rgba(255,42,182,0)']] },
      // A thin breath of cyan along the top edge.
      { dir: 'down', stops: [[0, 'rgba(0,222,255,0.14)'], [0.3, 'rgba(0,222,255,0)']] },
    ],
    vignette: 0.44,
    grain: 0.58,
  },
  golden: {
    id: 'golden',
    name: 'Golden Hour',
    filter: 'sepia(0.3) saturate(1.24) contrast(1.04) brightness(1.1)',
    overlays: [
      { dir: 'down', stops: [[0, 'rgba(255,192,82,0.22)'], [0.6, 'rgba(255,192,82,0)']] },
      { dir: 'up', stops: [[0, 'rgba(162,72,22,0.22)'], [0.5, 'rgba(162,72,22,0)']] },
    ],
    vignette: 0.28,
    grain: 0.42,
  },
  noir: {
    id: 'noir',
    name: 'Noir Vice',
    filter: 'contrast(1.34) brightness(1.05) grayscale(0.84)',
    overlays: [
      // A cold steel tint laid evenly over the whole panel.
      { dir: 'down', stops: [[0, 'rgba(32,62,72,0.17)'], [1, 'rgba(32,62,72,0.17)']] },
      { dir: 'up', stops: [[0, 'rgba(0,0,0,0.24)'], [0.45, 'rgba(0,0,0,0)']] },
    ],
    vignette: 0.52,
    grain: 0.68,
  },
  original: {
    id: 'original',
    name: 'Original',
    filter: '',
    overlays: [],
    vignette: 0.14,
    grain: 0.18,
  },
};

export function findGrade(id) {
  return GRADE_RECIPES[id] || GRADE_RECIPES.vice;
}

// The grain comes from one shared tile, generated a single time from a
// fixed seed, so every render — exports and screenshot scenes alike —
// wears exactly the same grain instead of fresh noise each frame.
let grainTile = null;
let grainPattern = null;

function makeGrainTile() {
  const size = 128;
  const tile = document.createElement('canvas');
  tile.width = size;
  tile.height = size;
  const tctx = tile.getContext('2d');
  const img = tctx.createImageData(size, size);
  let s = 135791357;
  for (let i = 0; i < img.data.length; i += 4) {
    s = (s * 1664525 + 1013904223) % 4294967296;
    const v = Math.floor((s / 4294967296) * 255);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  tctx.putImageData(img, 0, 0);
  return tile;
}

export function grainPatternFor(ctx) {
  if (!grainTile) grainTile = makeGrainTile();
  if (!grainPattern) grainPattern = ctx.createPattern(grainTile, 'repeat');
  return grainPattern;
}

// Paint a grade's finish over the rectangle (x, y, w, h): its washes,
// then the vignette, then the grain. The caller has already clipped to
// the panel's shape, so nothing here can spill outside it.
export function paintGradeFinish(ctx, grade, x, y, w, h) {
  for (const wash of grade.overlays) {
    let grad;
    if (wash.dir === 'diag') grad = ctx.createLinearGradient(x, y, x + w, y + h);
    else if (wash.dir === 'up') grad = ctx.createLinearGradient(0, y + h, 0, y);
    else grad = ctx.createLinearGradient(0, y, 0, y + h);
    for (const [pos, colour] of wash.stops) grad.addColorStop(pos, colour);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
  }

  if (grade.vignette > 0) {
    const r = Math.max(w, h) * 0.74;
    const vig = ctx.createRadialGradient(x + w / 2, y + h / 2, r * 0.32, x + w / 2, y + h / 2, r);
    vig.addColorStop(0, 'rgba(10,2,20,0)');
    vig.addColorStop(1, `rgba(10,2,20,${grade.vignette})`);
    ctx.fillStyle = vig;
    ctx.fillRect(x, y, w, h);
  }

  if (grade.grain > 0) {
    ctx.save();
    ctx.globalAlpha = 0.04 + grade.grain * 0.07;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = grainPatternFor(ctx);
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
}
