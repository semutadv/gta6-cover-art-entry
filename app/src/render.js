// Vice Cover Studio — the cover composer.
// renderCover draws a whole cover onto a canvas at any size: panels from the
// layout, photos cover-fit with pan/zoom, grades, white keylines between
// panels, vignette and fine grain on top, then the lettering. The same
// function renders the live preview and every export size.

import { layoutRects, drawPlaceholder } from './layouts.js';
import { gradeOf, paintGradeOverlays } from './grades.js';
import { drawLettering, drawLetteringScrim } from './lettering.js';

const KEYLINE = 6; // px of white between panels at 1080 wide, scaled

export function renderCover(canvas, state, W, H) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const scale = W / 1080;
  const gap = Math.max(2, Math.round(KEYLINE * scale));

  // Base: deep violet so nothing ever shows through unpainted.
  ctx.fillStyle = '#160826';
  ctx.fillRect(0, 0, W, H);

  const rects = layoutRects(state.layout, W, H);
  const panels = state.panels.slice(0, rects.length);

  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    const panel = panels[i];
    const px = r.x * W;
    const py = r.y * H;
    const pw = r.w * W;
    const ph = r.h * H;
    ctx.save();
    clipPanel(ctx, px, py, pw, ph, r, scale);
    drawPanel(ctx, state, panel, i, px, py, pw, ph);
    ctx.restore();
    // Keyline around the panel.
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = gap;
    ctx.strokeRect(px, py, pw, ph);
  }

  // Vignette + grain over the whole cover.
  paintVignette(ctx, W, H);
  paintGrain(ctx, W, H, 0.05);

  // Lettering band: top or bottom, sized to the cover.
  const bandH = Math.round(H * 0.16);
  const band = state.titlePos === 'top'
    ? { x: 0, y: 0, w: W, h: bandH }
    : { x: 0, y: H - bandH, w: W, h: bandH };
  drawLetteringScrim(ctx, band, state.titlePos);
  drawLettering(ctx, {
    band,
    title: state.title,
    caption: state.caption,
    size: state.titleSize,
    gradient: state.titleGradient,
    pos: state.titlePos,
  });
  return ctx;
}

function clipPanel(ctx, x, y, w, h, r, scale) {
  ctx.beginPath();
  if (r.diag === 'down') {
    // Duo split, upper-left triangle.
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x, y + h);
    ctx.closePath();
  } else if (r.diag === 'up') {
    // Duo split, lower-right triangle.
    ctx.moveTo(x + w, y + h);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x, y + h);
    ctx.closePath();
  } else if (r.slant) {
    // Classic hero: lower edge slants down to the right.
    const drop = h * r.slant;
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h - drop);
    ctx.closePath();
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.clip();
}

function drawPanel(ctx, state, panel, index, x, y, w, h) {
  const photo = panel.photo === null ? null : state.photos[panel.photo];
  if (!photo || !photo.image) {
    drawPlaceholder(ctx, x, y, w, h, index);
    return;
  }
  const grade = gradeOf(panel.grade ?? state.grade);
  const img = photo.image;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;

  // Cover-fit with pan + zoom. Zoom 1 fills the panel exactly; more zooms in.
  const base = Math.max(w / iw, h / ih);
  const fitScale = panel.fit === 'fit' ? Math.min(w / iw, h / ih) : base;
  const s = fitScale * panel.zoom;
  const dw = iw * s;
  const dh = ih * s;
  const dx = x + (w - dw) / 2 + panel.x * (dw - w) * 0.5;
  const dy = y + (h - dh) / 2 + panel.y * (dh - h) * 0.5;

  ctx.save();
  if (grade.filter !== 'none' && 'filter' in ctx) ctx.filter = grade.filter;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
  paintGradeOverlays(ctx, grade, x, y, w, h);
}

function paintVignette(ctx, W, H) {
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(10,2,24,0.28)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// Deterministic grain: a seeded pseudo-random speckle so two renders of the
// same cover are byte-identical.
function paintGrain(ctx, W, H, alpha) {
  const step = 3;
  let seed = 1234567;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      const v = next();
      ctx.fillStyle = v > 0.5 ? '#ffffff' : '#000000';
      ctx.fillRect(x, y, 1, 1);
    }
  }
  ctx.restore();
}

// Render to an offscreen canvas and hand back a PNG blob for download.
export function exportPng(state, W, H) {
  const canvas = document.createElement('canvas');
  renderCover(canvas, state, W, H);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
