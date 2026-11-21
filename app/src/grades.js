// Vice Cover Studio — colour grades.
// Each grade is a recipe: a canvas filter string applied while the photo
// is drawn, plus one or two translucent overlays painted on top, a vignette
// and a pinch of grain. Grades are applied per panel on top of the global
// grade when a panel carries its own override.

export const GRADES = {
  vice: {
    label: 'Vice Sunset',
    blurb: 'Warm magenta lift, teal shadows',
    filter: 'saturate(1.35) contrast(1.08) brightness(1.03)',
    overlays: [
      { kind: 'linear', from: [0, 0], to: [0, 1], stops: [[0, 'rgba(255, 90, 160, 0.14)'], [1, 'rgba(255, 150, 60, 0.16)']], blend: 'overlay' },
      { kind: 'linear', from: [0, 1], to: [0, 0], stops: [[0, 'rgba(20, 120, 130, 0.10)'], [1, 'rgba(20, 120, 130, 0)']], blend: 'multiply' },
    ],
    vignette: 0.22,
    grain: 0.05,
  },
  neon: {
    label: 'Neon Nights',
    blurb: 'Cool blue-pink neon glow',
    filter: 'saturate(1.5) contrast(1.15) brightness(0.97) hue-rotate(-12deg)',
    overlays: [
      { kind: 'linear', from: [0, 0], to: [1, 1], stops: [[0, 'rgba(80, 140, 255, 0.18)'], [1, 'rgba(255, 60, 180, 0.16)']], blend: 'overlay' },
      { kind: 'radial', stops: [[0, 'rgba(255, 120, 220, 0.10)'], [1, 'rgba(255, 120, 220, 0)']], blend: 'screen' },
    ],
    vignette: 0.3,
    grain: 0.06,
  },
  golden: {
    label: 'Golden Hour',
    blurb: 'Soft warm film light',
    filter: 'saturate(1.15) contrast(1.02) brightness(1.07) sepia(0.18)',
    overlays: [
      { kind: 'linear', from: [0, 0], to: [0, 1], stops: [[0, 'rgba(255, 210, 120, 0.12)'], [1, 'rgba(255, 160, 60, 0.10)']], blend: 'soft-light' },
    ],
    vignette: 0.16,
    grain: 0.04,
  },
  noir: {
    label: 'Noir Vice',
    blurb: 'High contrast, drained colour',
    filter: 'saturate(0.25) contrast(1.35) brightness(0.98)',
    overlays: [
      { kind: 'linear', from: [0, 0], to: [0, 1], stops: [[0, 'rgba(10, 10, 30, 0.16)'], [1, 'rgba(10, 10, 30, 0.05)']], blend: 'multiply' },
    ],
    vignette: 0.34,
    grain: 0.08,
  },
  original: {
    label: 'Original',
    blurb: 'The photo, untouched',
    filter: 'none',
    overlays: [],
    vignette: 0,
    grain: 0,
  },
};

export function gradeOf(id) {
  return GRADES[id] || GRADES.vice;
}

let noiseTile = null;
function getNoiseTile() {
  if (noiseTile) return noiseTile;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  const data = g.createImageData(128, 128);
  let seed = 1234567;
  for (let i = 0; i < data.data.length; i += 4) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const v = seed % 256;
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  g.putImageData(data, 0, 0);
  noiseTile = c;
  return c;
}

// Paint a grade's overlays, vignette and grain over a panel rectangle.
// The photo itself is drawn with ctx.filter set by the caller.
export function finishGrade(ctx, bounds, gradeId) {
  const grade = gradeOf(gradeId);
  const { x, y, w, h } = bounds;
  for (const layer of grade.overlays) {
    ctx.save();
    ctx.globalCompositeOperation = layer.blend;
    let grad;
    if (layer.kind === 'linear') {
      grad = ctx.createLinearGradient(x + layer.from[0] * w, y + layer.from[1] * h, x + layer.to[0] * w, y + layer.to[1] * h);
    } else {
      grad = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, Math.max(w, h) * 0.7);
    }
    for (const [stop, color] of layer.stops) grad.addColorStop(stop, color);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
  if (grade.vignette > 0) {
    const vg = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.35, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, `rgba(0,0,0,${grade.vignette})`);
    ctx.fillStyle = vg;
    ctx.fillRect(x, y, w, h);
  }
  if (grade.grain > 0) {
    ctx.save();
    ctx.globalAlpha = grade.grain;
    const tile = getNoiseTile();
    const pattern = ctx.createPattern(tile, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
}
