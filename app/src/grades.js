// grades.js — the five colour grades the studio can lay over a photo.
//
// Every grade is a two-part recipe. The `filter` string rides along on
// ctx.filter while the photo itself is drawn, shifting brightness,
// contrast, saturation and hue in one pass. The finish — a stack of
// gradient overlays, a vignette and a dusting of film grain — is painted
// over the panel afterwards by applyGradeFinish(). Grades are chosen
// per cover, and any single panel may override the cover's grade.

export const GRADES = {
  vice: {
    id: 'vice',
    name: 'Vice Sunset',
    filter: 'saturate(1.38) contrast(1.1) brightness(1.05) hue-rotate(-8deg)',
    overlays: [
      // Magenta wash pouring down from the top edge.
      { dir: 'down', stops: [[0, 'rgba(255,80,160,0.20)'], [0.55, 'rgba(255,80,160,0)']] },
      // Teal gathering in the shadows along the bottom.
      { dir: 'up', stops: [[0, 'rgba(0,70,90,0.38)'], [0.5, 'rgba(0,70,90,0)']] },
      // A warm halo high in the frame, where the sun would be.
      { dir: 'down', stops: [[0, 'rgba(255,170,60,0.10)'], [0.7, 'rgba(255,170,60,0)']] },
    ],
    vignette: 0.32,
    grain: 0.5,
  },
  neon: {
    id: 'neon',
    name: 'Neon Nights',
    filter: 'saturate(1.55) contrast(1.16) brightness(0.97) hue-rotate(10deg)',
    overlays: [
      // Electric blue raking in from the top-left corner.
      { dir: 'diag', stops: [[0, 'rgba(40,80,255,0.26)'], [0.6, 'rgba(40,80,255,0)']] },
      // Hot pink answering back from the bottom.
      { dir: 'up', stops: [[0, 'rgba(255,40,180,0.28)'], [0.55, 'rgba(255,40,180,0)']] },
      // A thin breath of cyan along the top edge.
      { dir: 'down', stops: [[0, 'rgba(0,220,255,0.13)'], [0.3, 'rgba(0,220,255,0)']] },
    ],
    vignette: 0.42,
    grain: 0.55,
  },
  golden: {
    id: 'golden',
    name: 'Golden Hour',
    filter: 'sepia(0.28) saturate(1.22) contrast(1.03) brightness(1.09)',
    overlays: [
      { dir: 'down', stops: [[0, 'rgba(255,190,80,0.20)'], [0.6, 'rgba(255,190,80,0)']] },
      { dir: 'up', stops: [[0, 'rgba(160,70,20,0.20)'], [0.5, 'rgba(160,70,20,0)']] },
    ],
    vignette: 0.26,
    grain: 0.4,
  },
  noir: {
    id: 'noir',
    name: 'Noir Vice',
    filter: 'contrast(1.32) brightness(1.04) grayscale(0.82)',
    overlays: [
      // A cold steel tint laid evenly over the whole panel.
      { dir: 'down', stops: [[0, 'rgba(30,60,70,0.16)'], [1, 'rgba(30,60,70,0.16)']] },
      { dir: 'up', stops: [[0, 'rgba(0,0,0,0.22)'], [0.45, 'rgba(0,0,0,0)']] },
    ],
    vignette: 0.5,
    grain: 0.65,
  },
  original: {
    id: 'original',
    name: 'Original',
    filter: '',
    overlays: [],
    vignette: 0.12,
    grain: 0.15,
  },
};

export function gradeById(id) {
  return GRADES[id] || GRADES.vice;
}

// The grain comes from one shared tile, generated a single time from a
// fixed seed, so every render — exports and screenshot scenes alike —
// wears exactly the same grain instead of fresh noise each frame.
let grainTile = null;
let grainPattern = null;

function buildGrainTile() {
  const size = 144;
  const tile = document.createElement('canvas');
  tile.width = size;
  tile.height = size;
  const tctx = tile.getContext('2d');
  const img = tctx.createImageData(size, size);
  let s = 987654321;
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

export function getGrainPattern(ctx) {
  if (!grainTile) grainTile = buildGrainTile();
  if (!grainPattern) grainPattern = ctx.createPattern(grainTile, 'repeat');
  return grainPattern;
}

// Paint a grade's finish over the rectangle (x, y, w, h): its overlays,
// then the vignette, then the grain. The caller has already clipped to
// the panel's shape, so nothing here can spill outside it.
export function applyGradeFinish(ctx, grade, x, y, w, h) {
  for (const ov of grade.overlays) {
    let grad;
    if (ov.dir === 'diag') grad = ctx.createLinearGradient(x, y, x + w, y + h);
    else if (ov.dir === 'up') grad = ctx.createLinearGradient(0, y + h, 0, y);
    else grad = ctx.createLinearGradient(0, y, 0, y + h);
    for (const [pos, colour] of ov.stops) grad.addColorStop(pos, colour);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
  }

  if (grade.vignette > 0) {
    const r = Math.max(w, h) * 0.72;
    const vig = ctx.createRadialGradient(x + w / 2, y + h / 2, r * 0.35, x + w / 2, y + h / 2, r);
    vig.addColorStop(0, 'rgba(10,2,20,0)');
    vig.addColorStop(1, `rgba(10,2,20,${grade.vignette})`);
    ctx.fillStyle = vig;
    ctx.fillRect(x, y, w, h);
  }

  if (grade.grain > 0) {
    ctx.save();
    ctx.globalAlpha = 0.04 + grade.grain * 0.07;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = getGrainPattern(ctx);
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
}
