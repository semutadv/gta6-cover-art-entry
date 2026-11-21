// Vice Cover Studio — panel layouts and the placeholder painter.
// Each layout is a function of the canvas size that returns panel rectangles
// in normalised coordinates (0..1). The renderer multiplies them out, so one
// layout description serves every export size. The Classic layout's hero panel
// carries a diagonal slant on its lower edge, like the real poster covers.

export const LAYOUTS = {
  classic: {
    name: 'Classic Cover',
    blurb: 'Hero on top, two mid panels, two at the bottom.',
    rects(w, h) {
      return [
        { x: 0, y: 0, w: 1, h: 0.52, slant: 0.05 },
        { x: 0, y: 0.52, w: 0.5, h: 0.24 },
        { x: 0.5, y: 0.52, w: 0.5, h: 0.24 },
        { x: 0, y: 0.76, w: 0.5, h: 0.24 },
        { x: 0.5, y: 0.76, w: 0.5, h: 0.24 },
      ];
    },
  },
  trio: {
    name: 'Trio',
    blurb: 'Three tall panels side by side.',
    rects(w, h) {
      return [
        { x: 0, y: 0, w: 1 / 3, h: 1 },
        { x: 1 / 3, y: 0, w: 1 / 3, h: 1 },
        { x: 2 / 3, y: 0, w: 1 / 3, h: 1 },
      ];
    },
  },
  duo: {
    name: 'Duo Split',
    blurb: 'Two panels split on a diagonal.',
    rects(w, h) {
      return [
        { x: 0, y: 0, w: 1, h: 1, diag: 'down' },
        { x: 0, y: 0, w: 1, h: 1, diag: 'up' },
      ];
    },
  },
  solo: {
    name: 'Solo Poster',
    blurb: 'One photo, full bleed, edge to edge.',
    rects(w, h) {
      return [{ x: 0, y: 0, w: 1, h: 1 }];
    },
  },
};

export function layoutRects(layoutId, w, h) {
  const layout = LAYOUTS[layoutId] ?? LAYOUTS.classic;
  return layout.rects(w, h);
}

// A generated Vice sunset for panels with no photo yet: gradient sky, a low
// sun disc, a dark skyline and two palm silhouettes, all drawn in code so
// the cover always looks finished even before a photo is dropped in.
export function drawPlaceholder(ctx, x, y, w, h, seed = 0) {
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, '#2b1055');
  sky.addColorStop(0.45, '#c94b7c');
  sky.addColorStop(0.75, '#ff7e47');
  sky.addColorStop(1, '#ffc46b');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);

  const sunR = Math.min(w, h) * 0.22;
  const sunX = x + w * (0.3 + (seed % 3) * 0.2);
  const sunY = y + h * 0.58;
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.2);
  glow.addColorStop(0, 'rgba(255, 236, 170, 0.9)');
  glow.addColorStop(1, 'rgba(255, 236, 170, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  // Skyline.
  ctx.fillStyle = '#1d0b33';
  const base = y + h * 0.82;
  ctx.fillRect(x, base, w, h - (base - y));
  const blocks = [0.08, 0.2, 0.34, 0.52, 0.66, 0.8, 0.92];
  for (let i = 0; i < blocks.length; i++) {
    const bw = w * 0.09;
    const bh = h * (0.08 + ((seed + i * 7) % 5) * 0.03);
    ctx.fillRect(x + w * blocks[i], base - bh, bw, bh);
  }

  // Two palm silhouettes.
  drawPalm(ctx, x + w * 0.12, y + h * 0.98, h * 0.3, -0.25);
  drawPalm(ctx, x + w * 0.88, y + h * 0.98, h * 0.36, 0.25);
}

function drawPalm(ctx, px, py, size, lean) {
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(lean);
  ctx.strokeStyle = '#12061f';
  ctx.lineWidth = Math.max(2, size * 0.03);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(size * 0.1, -size * 0.55, size * 0.28, -size * 0.85);
  ctx.stroke();
  ctx.fillStyle = '#12061f';
  const tipX = size * 0.28;
  const tipY = -size * 0.85;
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * (0.15 + i * 0.22);
    const len = size * (0.32 - Math.abs(i - 2.5) * 0.04);
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.quadraticCurveTo(
      tipX + Math.cos(a) * len * 0.6,
      tipY + Math.sin(a) * len * 0.4 - size * 0.08,
      tipX + Math.cos(a) * len,
      tipY + Math.sin(a) * len + size * 0.12,
    );
    ctx.quadraticCurveTo(
      tipX + Math.cos(a) * len * 0.5,
      tipY + Math.sin(a) * len * 0.55 + size * 0.1,
      tipX,
      tipY,
    );
    ctx.fill();
  }
  ctx.restore();
}
