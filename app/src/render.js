// render.js — paints a finished cover onto any canvas, at any size.
//
// Panel by panel: clip to the panel's polygon, draw its photo (cover-fit
// or whole-photo, panned, zoomed and optionally mirrored as the user
// framed it) or the painted stand-in when the panel has no photo, then
// run that panel's grade finish across it. Pale keylines are stroked
// along every panel edge, a gentle vignette settles over the whole
// cover, and the lettering is drawn last, on top of everything.

import { findLayout, polygonBox, paintPlaceholder } from './layouts.js';
import { findGrade, paintGradeFinish } from './grades.js';
import { paintLettering } from './lettering.js';
import { findPhoto } from './state.js';

const SEAM = '#f8f4ef';

// Trace a panel polygon — given in cover fractions — as a pixel-space
// path on ctx.
export function tracePanel(ctx, points, W, H) {
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
// whatever slack the crop leaves, zoom multiplies the base scale, and
// flip mirrors the photo left to right.
function paintPhoto(ctx, img, panel, bx, by, bw, bh, grade) {
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
      // washes, vignette and grain, just not the filter pass.
    }
  }
  if (panel.flip) {
    ctx.translate(dx + dw / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-(dx + dw / 2), 0);
  }
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

// Stroke every panel edge in the seam colour, plus an inset frame so
// the outer border carries the same weight as the inner seams. Shared
// edges are stroked twice in the same spot, which is exactly why the
// grid reads as one clean set of lines.
function strokeSeams(ctx, panels, w, h) {
  const lw = Math.max(3, Math.round(w * 0.007));
  ctx.strokeStyle = SEAM;
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';
  for (const points of panels) {
    tracePanel(ctx, points, w, h);
    ctx.stroke();
  }
  ctx.strokeRect(lw / 2, lw / 2, w - lw, h - lw);
}

// Render the cover described by st into the rectangle (x, y, w, h) of
// ctx. The live preview, the PNG exports and the screenshot scenes all
// call this one function, so what you see is exactly what exports.
export function composeCover(ctx, x, y, w, h, st) {
  const layout = findLayout(st.layoutId);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.translate(x, y);

  // The ground is the seam colour itself: wherever the stroked edges
  // land, this is the grid that shows through.
  ctx.fillStyle = SEAM;
  ctx.fillRect(0, 0, w, h);

  layout.panels.forEach((points, i) => {
    const panel = st.panels[i];
    const grade = findGrade(panel && panel.gradeId ? panel.gradeId : st.gradeId);
    const b = polygonBox(points);
    const bx = b.x * w;
    const by = b.y * h;
    const bw = b.w * w;
    const bh = b.h * h;
    ctx.save();
    tracePanel(ctx, points, w, h);
    ctx.clip();
    // A deep matte sits behind everything, so a letterboxed 'fit' photo
    // — or a crop zoomed out past its edges — rests on colour, not on
    // transparency.
    ctx.fillStyle = '#1b0c2f';
    ctx.fillRect(bx, by, bw, bh);
    const photo = panel ? findPhoto(panel.photoId) : null;
    if (photo && photo.img) paintPhoto(ctx, photo.img, panel, bx, by, bw, bh, grade);
    else paintPlaceholder(ctx, bx, by, bw, bh, i);
    paintGradeFinish(ctx, grade, bx, by, bw, bh);
    ctx.restore();
  });

  strokeSeams(ctx, layout.panels, w, h);

  // One soft vignette over the whole cover, to seat the composition.
  const vg = ctx.createRadialGradient(
    w / 2, h * 0.42, Math.min(w, h) * 0.34,
    w / 2, h * 0.5, Math.max(w, h) * 0.76,
  );
  vg.addColorStop(0, 'rgba(8,2,18,0)');
  vg.addColorStop(1, 'rgba(8,2,18,0.28)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  paintLettering(ctx, w, h, st);
  ctx.restore();
}
