// render.js — paints a finished cover onto any canvas, at any size.
//
// Panel by panel: clip to the panel's polygon, draw its photo (cover-fit
// or whole-photo, panned and zoomed as the user framed it) or the
// painted placeholder when the panel has no photo, then run that
// panel's grade finish across it. White keylines are stroked along
// every panel edge, a gentle vignette settles over the whole cover,
// and the lettering is drawn last, on top of everything.

import { layoutById, panelBounds, drawPlaceholder } from './layouts.js';
import { gradeById, applyGradeFinish } from './grades.js';
import { drawLettering } from './lettering.js';
import { photoById } from './state.js';

const KEYLINE = '#f7f3ee';

// Trace a panel polygon — given in cover fractions — as a pixel-space
// path on ctx.
export function panelPath(ctx, points, W, H) {
  ctx.beginPath();
  points.forEach(([fx, fy], i) => {
    if (i === 0) ctx.moveTo(fx * W, fy * H);
    else ctx.lineTo(fx * W, fy * H);
  });
  ctx.closePath();
}

// Draw one photo into a panel's bounding box. 'fill' scales the photo
// until it covers the box and crops the spill; 'fit' scales it until
// the whole photo shows, letterboxed. The panel's pan (-1..1) spends
// whatever slack the crop leaves, and zoom multiplies the base scale.
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
      // No ctx.filter in this engine: the photo still gets the grade's
      // overlays, vignette and grain, just not the filter pass.
    }
  }
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

// Render the cover described by st into the rectangle (x, y, w, h) of
// ctx. The live preview, the PNG exports and the screenshot scenes all
// call this one function, so what you see is exactly what exports.
export function renderCover(ctx, x, y, w, h, st) {
  const layout = layoutById(st.layoutId);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.translate(x, y);

  // The ground is the keyline colour itself: wherever the stroked edges
  // land, this is the grid that shows through.
  ctx.fillStyle = KEYLINE;
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
    // A deep matte sits behind everything, so a letterboxed 'fit' photo
    // — or a crop zoomed out past its edges — rests on colour, not on
    // transparency.
    ctx.fillStyle = '#1a0b2e';
    ctx.fillRect(bx, by, bw, bh);
    const photo = panel ? photoById(panel.photoId) : null;
    if (photo && photo.img) drawPhoto(ctx, photo.img, panel, bx, by, bw, bh, grade);
    else drawPlaceholder(ctx, bx, by, bw, bh, i);
    applyGradeFinish(ctx, grade, bx, by, bw, bh);
    ctx.restore();
  });

  // Keylines: every panel edge gets a stroke in the ground colour.
  // Shared edges are stroked twice in the same spot, which is exactly
  // why the grid reads as one clean set of lines; the inset frame keeps
  // the outer border at the same weight as the inner seams.
  const lw = Math.max(3, Math.round(w * 0.007));
  ctx.strokeStyle = KEYLINE;
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';
  for (const points of layout.panels) {
    panelPath(ctx, points, w, h);
    ctx.stroke();
  }
  ctx.strokeRect(lw / 2, lw / 2, w - lw, h - lw);

  // One soft vignette over the whole cover, to seat the composition.
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
