// lettering.js — the cover's title and caption, drawn in the genre's
// style: very heavy condensed capitals, a white or sunset-gradient fill, a
// thick dark outline, a soft drop shadow and a slight italic skew. A dark
// scrim fades in behind the type so it stays readable over any photo.

const FONT_STACK = '"Arial Narrow", "Liberation Sans Narrow", Impact, "Helvetica Neue", Arial, sans-serif';

// Shrink from startPx until the text fits maxWidth; returns the size used.
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
  // Canvas letterSpacing is supported in Chromium; elsewhere it is a
  // harmless no-op property assignment.
  try {
    ctx.letterSpacing = `${px}px`;
  } catch {
    /* older engines: spacing is decorative only */
  }
}

function drawLine(ctx, text, cx, baseline, px, weight, fill, strokeWidth) {
  ctx.save();
  ctx.translate(cx, baseline);
  ctx.transform(1, 0, -0.08, 1, 0, 0); // the slight italic skew
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
    setLetterSpacing(ctx, titlePx * 0.1);
    captionPx = fitSize(ctx, caption, 700, W * 0.9, Math.max(13, titlePx * 0.3 || H * 0.045));
    setLetterSpacing(ctx, 0);
  }

  // Baselines: at the top the title leads and the caption follows under it;
  // at the bottom the caption sits on the edge and the title above it.
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
