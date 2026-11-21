// Vice Cover Studio — colour grades.
// Each grade is a recipe: a CSS filter string the canvas applies while the
// photo is drawn, plus one or two translucent gradient overlays that tint the
// shadows and the highlights. 'original' is the photo untouched.

export const GRADES = {
  vice: {
    name: 'Vice Sunset',
    blurb: 'Warm magenta-orange lift, teal shadows.',
    filter: 'saturate(1.35) contrast(1.08) brightness(1.04)',
    overlays: [
      { from: 'rgba(255, 94, 120, 0.16)', to: 'rgba(255, 140, 66, 0.05)', angle: 'top' },
      { from: 'rgba(20, 160, 180, 0.12)', to: 'rgba(20, 160, 180, 0)', angle: 'bottom' },
    ],
  },
  neon: {
    name: 'Neon Nights',
    blurb: 'Cool blue-pink neon after dark.',
    filter: 'saturate(1.5) contrast(1.14) brightness(0.97) hue-rotate(-12deg)',
    overlays: [
      { from: 'rgba(80, 60, 255, 0.20)', to: 'rgba(255, 60, 180, 0.08)', angle: 'top' },
      { from: 'rgba(0, 220, 255, 0.10)', to: 'rgba(0, 220, 255, 0)', angle: 'bottom' },
    ],
  },
  golden: {
    name: 'Golden Hour',
    blurb: 'Soft warm film, gentle and low-contrast.',
    filter: 'saturate(1.12) contrast(0.96) brightness(1.07) sepia(0.22)',
    overlays: [
      { from: 'rgba(255, 196, 110, 0.18)', to: 'rgba(255, 196, 110, 0)', angle: 'top' },
    ],
  },
  noir: {
    name: 'Noir Vice',
    blurb: 'High-contrast, almost monochrome.',
    filter: 'saturate(0.12) contrast(1.32) brightness(0.98)',
    overlays: [
      { from: 'rgba(10, 10, 30, 0.18)', to: 'rgba(10, 10, 30, 0)', angle: 'bottom' },
    ],
  },
  original: {
    name: 'Original',
    blurb: 'The photo as it is, no grade at all.',
    filter: 'none',
    overlays: [],
  },
};

export function gradeOf(id) {
  return GRADES[id] ?? GRADES.vice;
}

// Paint a grade's overlays over a panel rectangle. `angle` 'top' runs the
// gradient from the top edge down, 'bottom' from the bottom edge up.
export function paintGradeOverlays(ctx, grade, x, y, w, h) {
  for (const layer of grade.overlays) {
    let grad;
    if (layer.angle === 'bottom') {
      grad = ctx.createLinearGradient(0, y + h, 0, y);
    } else {
      grad = ctx.createLinearGradient(0, y, 0, y + h);
    }
    grad.addColorStop(0, layer.from);
    grad.addColorStop(1, layer.to);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
  }
}
