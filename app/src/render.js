// render.js — composes a finished cover onto a canvas at any size.
//
// Per panel: clip to the panel polygon, paint the photo (cover-fit or
// fit, with the panel's pan and zoom) or the painted placeholder when the
// panel is empty, then run the panel's grade finish over it. White
// keylines are stroked along every panel edge, a soft vignette settles
// the whole cover, and the lettering goes on last.

import { layoutById, panelBounds, drawPlaceholder } from './layouts.js';
import { gradeById, applyGradeFinish } from './grades.js';
import { drawLettering } from './lettering.js';
import { photoById } from './state.js';

// Trace a panel polygon (cover fractions) as a path in pixel space.
export function panelPath(ctx, points, W, H) {
  ctx.beginPath();
  points.forEach(([fx, fy], i) => {
    if (i === 0) ctx.moveTo(fx * W, fy * H);
    else ctx.lineTo(fx * W, fy * H);
  });
  ctx.closePath();
}

// Draw one photo into a panel's bounding box. 'fill' covers the box and
// crops the overflow; 'fit' shows the whole photo, letterboxed. Pan x/y
// (-1..1) slide the photo across whatever overflow the crop leaves, and
// zoom multiplies the base scale.
function drawPhoto(ctx, img, panel, bx, by, bw, bh, grade) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const base = panel.fit === 'fit'
    ? Math.min(bw / iw, bh / ih)
    : Math.max(bw / iw, bh / ih);
  const scale = base * panel.zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = bx + (bw - dw) / 2 + panel.x * ((dw - bw) / 2);
  const dy = by + (bh - dh) / 2 + panel.y * ((dh - bh) / 2);
  ctx.save();
  if (grade.filter) {
    try {
      ctx.filter = grade.filter;
    } catch {
      /* engines without ctx.filter still get the overlays */
    }
  }
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

// Render the cover described by st into the rectangle (x, y, w, h) of ctx.
// Used identically for the live preview, the PNG exports and the
// screenshot scenes — what you see is exactly what exports.
export function renderCover(ctx, x, y, w, h, st) {
  const layout = layoutById(st.layoutId);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.translate(x, y);

  // The keyline colour is the cover's ground: it shows through as the
  // grid wherever the stroked edges land.
  ctx.fillStyle = '#f7f3ee';
  ctx.fillRect(0, 0, w, h);

  layout.panels.forEach((points, i) => {
    const panel = st.panels[i];
    const grade = gradeById(panel && panel.gradeId ? panel.gradeId : st.gradeId);
    const b = panelBounds(points);
    const bx = b.x * w;
    const by = b.y * h;
    const bw = b.w * w;
    const bh = b.h * h;
    ctx.save();
    panelPath(ctx, points, w, h);
    ctx.clip();
    // Deep matte behind everything: letterboxed 'fit' photos and any
    // under-zoomed crop rest on it instead of on transparency.
    ctx.fillStyle = '#1a0b2e';
    ctx.fillRect(bx, by, bw, bh);
    const photo = panel ? photoById(panel.photoId) : null;
    if (photo && photo.img) drawPhoto(ctx, photo.img, panel, bx, by, bw, bh, grade);
    else drawPlaceholder(ctx, bx, by, bw, bh, i);
    applyGradeFinish(ctx, grade, bx, by, bw, bh);
    ctx.restore();
  });

  // Keylines: stroke every panel edge in the ground colour. Shared edges
  // are stroked twice in the same place, so the grid reads as one clean
  // set of lines; the frame inset keeps the outer border the same weight.
  const lw = Math.max(3, Math.round(w * 0.007));
  ctx.strokeStyle = '#f7f3ee';
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';
  for (const points of layout.panels) {
    panelPath(ctx, points, w, h);
    ctx.stroke();
  }
  ctx.strokeRect(lw / 2, lw / 2, w - lw, h - lw);

  // Whole-cover vignette to seat the composition.
  const vg = ctx.createRadialGradient(
    w / 2, h * 0.42, Math.min(w, h) * 0.35,
    w / 2, h * 0.5, Math.max(w, h) * 0.78,
  );
  vg.addColorStop(0, 'rgba(8,2,18,0)');
  vg.addColorStop(1, 'rgba(8,2,18,0.30)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  drawLettering(ctx, w, h, st);
  ctx.restore();
}
