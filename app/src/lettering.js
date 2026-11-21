// Vice Cover Studio — lettering.
// The title and caption are drawn straight onto the cover canvas in the
// genre's style: very heavy condensed uppercase, white fill with a thick dark
// outline and a soft drop shadow, a slight italic skew, and an optional
// sunset gradient fill. Nothing here needs a font file — the system stack
// ("Arial Narrow", Impact and friends) carries the look.

export function letteringFont(px, italic) {
  const skew = italic ? 'italic ' : '';
  return `${skew}900 ${px}px "Arial Narrow", Impact, "Helvetica Neue", "Franklin Gothic Medium", sans-serif`;
}

// Draw title + caption inside `band` ({x, y, w, h}). The title is fitted to
// the band width by shrinking the font until it fits, then the caption sits
// just below it in tracked-out capitals.
export function drawLettering(ctx, opts) {
  const { band, title, caption, size = 1, gradient = true, pos = 'top' } = opts;
  const pad = band.w * 0.04;
  const maxW = band.w - pad * 2;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // --- title ---
  let px = band.h * 0.52 * size;
  ctx.font = letteringFont(px, true);
  const text = (title || 'VICE COVER').toUpperCase();
  while (px > 12 && ctx.measureText(text).width > maxW) {
    px *= 0.92;
    ctx.font = letteringFont(px, true);
  }
  const titleY = pos === 'top' ? band.y + band.h * 0.34 : band.y + band.h * 0.4;
  const cx = band.x + band.w / 2;

  ctx.save();
  ctx.translate(cx, titleY);
  ctx.transform(1, 0, -0.06, 1, 0, 0); // slight italic skew
  ctx.shadowColor = 'rgba(20, 4, 40, 0.55)';
  ctx.shadowBlur = px * 0.12;
  ctx.shadowOffsetY = px * 0.05;
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  if (gradient) {
    const g = ctx.createLinearGradient(0, -px * 0.55, 0, px * 0.55);
    g.addColorStop(0, '#fff6d8');
    g.addColorStop(0.45, '#ffd166');
    g.addColorStop(1, '#ff5e78');
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = '#ffffff';
  }
  ctx.strokeStyle = 'rgba(24, 6, 44, 0.92)';
  ctx.lineWidth = Math.max(2, px * 0.14);
  ctx.strokeText(text, 0, 0);
  ctx.fillText(text, 0, 0);
  ctx.restore();

  // --- caption ---
  const cap = (caption || '').toUpperCase();
  if (cap) {
    const capPx = Math.max(10, px * 0.24);
    ctx.font = `700 ${capPx}px "Arial Narrow", Impact, sans-serif`;
    let shown = cap;
    while (ctx.measureText(shown).width > maxW && shown.length > 4) {
      shown = shown.slice(0, -1);
    }
    const capY = titleY + px * 0.62;
    ctx.shadowColor = 'rgba(20, 4, 40, 0.6)';
    ctx.shadowBlur = capPx * 0.2;
    ctx.shadowOffsetY = capPx * 0.08;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = 'rgba(24, 6, 44, 0.9)';
    ctx.lineWidth = Math.max(1.5, capPx * 0.16);
    // Letter-spacing by hand: canvas has no tracking, so draw spaced.
    const spaced = shown.split('').join('\u2009');
    ctx.strokeText(spaced, cx, capY);
    ctx.fillText(spaced, cx, capY);
  }
  ctx.restore();
}

// A thin dark strip behind bottom lettering so white type stays readable
// over bright photos.
export function drawLetteringScrim(ctx, band, pos) {
  const g = pos === 'top'
    ? ctx.createLinearGradient(0, band.y, 0, band.y + band.h)
    : ctx.createLinearGradient(0, band.y + band.h, 0, band.y);
  g.addColorStop(0, 'rgba(18, 4, 36, 0.55)');
  g.addColorStop(1, 'rgba(18, 4, 36, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(band.x, band.y, band.w, band.h);
}
