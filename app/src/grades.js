// grades.js — the five colour grades.
//
// A grade is a recipe in two parts. The filter string is applied through
// ctx.filter while the photo itself is drawn (brightness / contrast /
// saturation / hue shifts). The finish — gradient overlays, a vignette and
// fine film grain — is painted over the panel afterwards by
// applyGradeFinish(). Grades apply per panel; a panel may override the
// cover's global grade.

export const GRADES = {
  vice: {
    id: 'vice',
    name: 'Vice Sunset',
    filter: 'saturate(1.38) contrast(1.1) brightness(1.05) hue-rotate(-8deg)',
    overlays: [
      // Magenta wash falling from the top.
      { dir: 'down', stops: [[0, 'rgba(255,80,160,0.20)'], [0.55, 'rgba(255,80,160,0)']] },
      // Teal pooling in the shadows at the bottom.
      { dir: 'up', stops: [[0, 'rgba(0,70,90,0.38)'], [0.5, 'rgba(0,70,90,0)']] },
      // Warm glow around the upper middle, where the sun would sit.
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
      // Hot pink answering from the bottom.
      { dir: 'up', stops: [[0, 'rgba(255,40,180,0.28)'], [0.55, 'rgba(255,40,180,0)']] },
      // A breath of cyan along the top edge.
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
      // Cold steel tint over everything.
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

// One shared grain tile, generated once with a fixed seed so every render —
// including the screenshot scenes — lays down identical grain.
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

// Paint a grade's overlays, vignette and grain over the rectangle
// (x, y, w, h). The caller clips to the panel shape first, so everything
// here stays inside the panel.
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
    const cx = x + w / 2;
    const cy = y + h / 2;
    const r = Math.max(w, h) * 0.72;
    const vig = ctx.createRadialGradient(cx, cy, r * 0.35, cx, cy, r);
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
