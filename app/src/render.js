// Vice Cover Studio — the cover composer.
// Renders a whole cover onto a canvas at any size: panels with their
// photos (cover-fit, offset, zoom, flip), per-panel grades, the white
// keylines between panels, and the lettering on top. The same composer
// draws the editor preview and the exported PNGs.

import { layoutPanels, panelBounds, clipPoly, paintPlaceholder } from './layouts.js';
import { gradeOf, finishGrade } from './grades.js';
import { drawLettering } from './lettering.js';

const KEYLINE = 0.008; // fraction of the cover's shorter side

export function renderCover(canvas, state, width, height) {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const gap = Math.max(2, Math.round(Math.min(width, height) * KEYLINE));
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const polys = layoutPanels(state.layout, width, height);
  polys.forEach((poly, i) => {
    const panel = state.panels[i];
    if (!panel) return;
    const bounds = panelBounds(poly);
    ctx.save();
    clipPoly(ctx, poly);
    const inset = shrink(bounds, gap / 2);
    ctx.save();
    ctx.beginPath();
    ctx.rect(inset.x, inset.y, inset.w, inset.h);
    ctx.clip();
    if (panel.photoId) {
      const photo = state.photos.find((p) => p.id === panel.photoId);
      if (photo && photo.image) {
        drawFramedPhoto(ctx, photo.image, inset, panel, state.grade);
      } else {
        paintPlaceholder(ctx, inset, i);
      }
    } else {
      paintPlaceholder(ctx, inset, i);
    }
    ctx.restore();
    ctx.restore();
  });

  drawLettering(ctx, { x: 0, y: 0, w: width, h: height }, {
    title: state.title,
    caption: state.caption,
    letterPos: state.letterPos,
    letterSize: state.letterSize,
    letterGradient: state.letterGradient,
  });
  return ctx;
}

function shrink(bounds, by) {
  return { x: bounds.x + by, y: bounds.y + by, w: bounds.w - by * 2, h: bounds.h - by * 2 };
}

function drawFramedPhoto(ctx, image, bounds, panel, globalGrade) {
  const gradeId = panel.grade || globalGrade;
  const grade = gradeOf(gradeId);
  const iw = image.naturalWidth || image.width;
  const ih = image.naturalHeight || image.height;
  let scale = panel.fit === 'fit' ? Math.min(bounds.w / iw, bounds.h / ih) : Math.max(bounds.w / iw, bounds.h / ih);
  scale *= panel.zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const cx = bounds.x + bounds.w / 2 + panel.shiftX * bounds.w;
  const cy = bounds.y + bounds.h / 2 + panel.shiftY * bounds.h;
  ctx.save();
  if (panel.flip) {
    ctx.translate(cx, cy);
    ctx.scale(-1, 1);
    ctx.translate(-cx, -cy);
  }
  ctx.filter = grade.filter;
  ctx.drawImage(image, cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.filter = 'none';
  ctx.restore();
  finishGrade(ctx, bounds, gradeId);
}
