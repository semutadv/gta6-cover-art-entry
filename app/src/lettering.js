// lettering.js — the cover's title and caption, set the way the genre
// sets them: very heavy condensed capitals, a white or sunset-gradient
// fill, a thick dark outline, a soft drop shadow and a slight italic
// lean. Behind the type, a dark scrim fades in so the words stay
// readable no matter what the photo underneath is doing.

const TYPE_FACE = '"Arial Narrow", "Liberation Sans Narrow", Impact, "Helvetica Neue", Arial, sans-serif';

// Shrink from startPx until the text fits inside maxWidth, and hand
// back the size that fit (never below 10px).
function fitToWidth(ctx, text, weight, maxWidth, startPx) {
  let size = Math.max(10, startPx);
  while (size > 10) {
    ctx.font = `${weight} ${size}px ${TYPE_FACE}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size *= 0.92;
  }
  return size;
}

function applyTracking(ctx, px) {
  // Chromium honours canvas letterSpacing; everywhere else this is a
  // harmless assignment to a property nothing reads.
  try {
    ctx.letterSpacing = `${px}px`;
  } catch {
    /* tracking is decoration; the cover works without it */
  }
}

// One line of display type: outlined first under a soft shadow, then
// filled, all sheared by the genre's slight italic lean.
function paintLine(ctx, text, cx, baseline, px, weight, fill, strokeWidth) {
  ctx.save();
  ctx.translate(cx, baseline);
  ctx.transform(1, 0, -0.07, 1, 0, 0);
  ctx.font = `${weight} ${px}px ${TYPE_FACE}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.shadowColor = 'rgba(5,0,16,0.55)';
  ctx.shadowBlur = px * 0.15;
  ctx.shadowOffsetY = px * 0.07;
  ctx.strokeStyle = '#150927';
  ctx.lineWidth = strokeWidth;
  ctx.strokeText(text, 0, 0);
  ctx.shadowColor = 'rgba(0,0,0,0)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = fill;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

// opts: { title, caption, letterPos ('top'|'bottom'), letterSize, letterGradient }
export function paintLettering(ctx, W, H, opts) {
  const title = (opts.title || '').trim().toUpperCase();
  const caption = (opts.caption || '').trim().toUpperCase();
  if (!title && !caption) return;

  // Scrim: a soft dark fade behind whichever edge carries the type.
  const bandH = H * 0.34;
  const top = opts.letterPos !== 'bottom';
  const scrim = top
    ? ctx.createLinearGradient(0, 0, 0, bandH)
    : ctx.createLinearGradient(0, H, 0, H - bandH);
  scrim.addColorStop(0, 'rgba(10,3,24,0.55)');
  scrim.addColorStop(1, 'rgba(10,3,24,0)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, top ? 0 : H - bandH, W, bandH);

  const cx = W / 2;
  let titlePx = 0;
  let captionPx = 0;
  if (title) titlePx = fitToWidth(ctx, title, 900, W * 0.92, H * 0.16 * (opts.letterSize || 1));
  if (caption) {
    // Measure the caption with its tracking applied, then clear it so
    // the measuring does not leak into whatever draws next.
    applyTracking(ctx, titlePx * 0.1);
    captionPx = fitToWidth(ctx, caption, 700, W * 0.9, Math.max(13, titlePx * 0.3 || H * 0.045));
    applyTracking(ctx, 0);
  }

  // Baselines. At the top, the title leads and the caption tucks in
  // under it; at the bottom, the caption sits on the edge with the
  // title stacked above it.
  let titleBase = 0;
  let captionBase = 0;
  if (top) {
    titleBase = H * 0.05 + titlePx;
    captionBase = titleBase + captionPx * 1.5;
    if (!title) captionBase = H * 0.05 + captionPx;
  } else {
    captionBase = H * 0.95;
    titleBase = captionBase - captionPx * 1.5;
    if (!caption) titleBase = H * 0.95;
  }

  if (title) {
    let fill = '#ffffff';
    if (opts.letterGradient) {
      const g = ctx.createLinearGradient(0, titleBase - titlePx, 0, titleBase + titlePx * 0.2);
      g.addColorStop(0, '#ffd86f');
      g.addColorStop(0.5, '#ff8c5e');
      g.addColorStop(1, '#ff519c');
      fill = g;
    }
    paintLine(ctx, title, cx, titleBase, titlePx, 900, fill, titlePx * 0.16);
  }

  if (caption) {
    applyTracking(ctx, captionPx * 0.28);
    paintLine(ctx, caption, cx, captionBase, captionPx, 700, 'rgba(255,255,255,0.96)', captionPx * 0.15);
    applyTracking(ctx, 0);
  }
}
