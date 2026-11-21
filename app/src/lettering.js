// Vice Cover Studio — lettering.
// The title and caption are drawn on the canvas in the poster's voice:
// very heavy condensed uppercase, white fill with a thick dark outline,
// a soft drop shadow and a slight italic skew. The title can take a
// sunset pink-to-gold gradient fill instead of plain white.

const FONT_STACK = '"Arial Narrow", Impact, "Helvetica Neue Condensed", "Franklin Gothic Medium", sans-serif';

export function drawLettering(ctx, box, opts) {
  const { title, caption, letterPos, letterSize, letterGradient } = opts;
  const pad = box.w * 0.05;
  const innerW = box.w - pad * 2;
  const titlePx = Math.round((box.w * 0.115 * letterSize));
  const capPx = Math.round(titlePx * 0.32);
  const gap = Math.round(titlePx * 0.22);

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  const blockH = titlePx + gap + capPx;
  const topY = letterPos === 'top' ? box.y + box.h * 0.045 + titlePx : box.y + box.h - box.h * 0.045 - blockH + titlePx;
  const capY = topY + gap + capPx;

  // A faint dark wash behind the lettering so it reads over any photo.
  const washH = blockH + pad * 1.1;
  const washY = letterPos === 'top' ? box.y : box.y + box.h - washH;
  const wash = ctx.createLinearGradient(0, washY, 0, washY + washH);
  if (letterPos === 'top') {
    wash.addColorStop(0, 'rgba(10, 4, 24, 0.55)');
    wash.addColorStop(1, 'rgba(10, 4, 24, 0)');
  } else {
    wash.addColorStop(0, 'rgba(10, 4, 24, 0)');
    wash.addColorStop(1, 'rgba(10, 4, 24, 0.55)');
  }
  ctx.fillStyle = wash;
  ctx.fillRect(box.x, washY, box.w, washH);

  const cx = box.x + box.w / 2;
  drawSlantedLine(ctx, title, cx, topY, titlePx, true, letterGradient, innerW);
  drawSlantedLine(ctx, caption, cx, capY, capPx, false, false, innerW);
  ctx.restore();
}

function drawSlantedLine(ctx, text, cx, baselineY, px, heavy, gradient, maxW) {
  if (!text) return;
  const upper = text.toUpperCase();
  ctx.save();
  ctx.translate(cx, baselineY);
  ctx.transform(1, 0, -0.09, 1, 0, 0); // slight italic skew
  let size = px;
  ctx.font = `${heavy ? 900 : 700} ${size}px ${FONT_STACK}`;
  const measured = ctx.measureText(upper).width;
  if (measured > maxW) {
    size = Math.floor((size * maxW) / measured);
    ctx.font = `${heavy ? 900 : 700} ${size}px ${FONT_STACK}`;
  }
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  const outline = Math.max(2, Math.round(size * (heavy ? 0.14 : 0.1)));
  ctx.lineWidth = outline;
  ctx.strokeStyle = '#14051f';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = Math.round(size * 0.12);
  ctx.shadowOffsetY = Math.round(size * 0.06);
  ctx.strokeText(upper, 0, 0);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  if (gradient) {
    const grad = ctx.createLinearGradient(0, -size, 0, size * 0.2);
    grad.addColorStop(0, '#ffd166');
    grad.addColorStop(0.55, '#ff8fb3');
    grad.addColorStop(1, '#ffffff');
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = '#ffffff';
  }
  ctx.fillText(upper, 0, 0);
  ctx.restore();
}
