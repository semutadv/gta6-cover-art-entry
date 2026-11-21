// lettering.js — the cover's title and caption, set the way the genre
// sets them: very heavy condensed capitals, a white or sunset-gradient
// fill, a thick dark outline, a soft drop shadow and a slight italic
// lean. Behind the type, a dark scrim fades in so the words stay
// readable no matter what the photo underneath is doing.

const FONT_STACK = '"Arial Narrow", "Liberation Sans Narrow", Impact, "Helvetica Neue", Arial, sans-serif';

// Shrink from startPx until the text fits inside maxWidth, and return
// the size that fit (never below 10px).
function fitSize(ctx, text, weight, maxWidth, startPx) {
  let size = Math.max(10, startPx);
  while (size > 10) {
    ctx.font = `${weight} ${size}px ${FONT_STACK}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size *= 0.93;
  }
  return size;
}

function setLetterSpacing(ctx, px) {
  // Chromium honours canvas letterSpacing; everywhere else this is a
  // harmless assignment to a property nothing reads.
  try {
    ctx.letterSpacing = `${px}px`;
  } catch {
    /* spacing is decoration; the cover works without it */
  }
}

// One line of display type: outlined first under a soft shadow, then
// filled, all sheared by the genre's slight italic skew.
function drawLine(ctx, text, cx, baseline, px, weight, fill, strokeWidth) {
  ctx.save();
  ctx.translate(cx, baseline);
  ctx.transform(1, 0, -0.08, 1, 0, 0);
  ctx.font = `${weight} ${px}px ${FONT_STACK}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.shadowColor = 'rgba(5,0,16,0.55)';
  ctx.shadowBlur = px * 0.14;
  ctx.shadowOffsetY = px * 0.06;
  ctx.strokeStyle = '#160a26';
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
export function drawLettering(ctx, W, H, opts) {
  const title = (opts.title || '').trim().toUpperCase();
  const caption = (opts.caption || '').trim().toUpperCase();
  if (!title && !caption) return;

  // Scrim: a soft dark fade behind whichever edge carries the type.
  const bandH = H * 0.36;
  const top = opts.letterPos !== 'bottom';
  const scrim = top
    ? ctx.createLinearGradient(0, 0, 0, bandH)
    : ctx.createLinearGradient(0, H, 0, H - bandH);
  scrim.addColorStop(0, 'rgba(10,3,24,0.52)');
  scrim.addColorStop(1, 'rgba(10,3,24,0)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, top ? 0 : H - bandH, W, bandH);

  const cx = W / 2;
  let titlePx = 0;
  let captionPx = 0;
  if (title) titlePx = fitSize(ctx, title, 900, W * 0.92, H * 0.17 * (opts.letterSize || 1));
  if (caption) {
    // Measure the caption with its tracking applied, then clear it so
    // the measuring does not leak into whatever draws next.
    setLetterSpacing(ctx, titlePx * 0.1);
    captionPx = fitSize(ctx, caption, 700, W * 0.9, Math.max(13, titlePx * 0.3 || H * 0.045));
    setLetterSpacing(ctx, 0);
  }

  // Baselines. At the top, the title leads and the caption tucks in
  // under it; at the bottom, the caption sits on the edge with the
  // title stacked above it.
  let titleBase = 0;
  let captionBase = 0;
  if (top) {
    titleBase = H * 0.05 + titlePx;
    captionBase = titleBase + captionPx * 1.55;
    if (!title) captionBase = H * 0.05 + captionPx;
  } else {
    captionBase = H * 0.955;
    titleBase = captionBase - captionPx * 1.55;
    if (!caption) titleBase = H * 0.955;
  }

  if (title) {
    let fill = '#ffffff';
    if (opts.letterGradient) {
      const g = ctx.createLinearGradient(0, titleBase - titlePx, 0, titleBase + titlePx * 0.2);
      g.addColorStop(0, '#ffd76e');
      g.addColorStop(0.52, '#ff8a5c');
      g.addColorStop(1, '#ff4f9a');
      fill = g;
    }
    drawLine(ctx, title, cx, titleBase, titlePx, 900, fill, titlePx * 0.17);
  }

  if (caption) {
    setLetterSpacing(ctx, captionPx * 0.3);
    drawLine(ctx, caption, cx, captionBase, captionPx, 700, 'rgba(255,255,255,0.96)', captionPx * 0.16);
    setLetterSpacing(ctx, 0);
  }
}
