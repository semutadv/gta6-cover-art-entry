// editor.js — wires the page's controls to the cover state and paints the
// live preview.
//
// The preview canvas shows the cover at the chosen export aspect; the
// exact same renderCover() call paints the exports, so the preview never
// lies. Panels are picked by clicking them, photos are dragged inside
// their panel to reposition, and every control writes through state.js's
// update() so one change notification repaints everything.

import {
  state, onChange, update, addPhoto, photoById, assignPlannedPhotos,
  EXPORT_SIZES, MAX_PHOTOS,
} from './state.js';
import { layoutById, panelBounds, pointInPolygon } from './layouts.js';
import { renderCover, panelPath } from './render.js';

const $ = (id) => document.getElementById(id);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image failed to load'));
    img.src = url;
  });
}

export function initEditor(opts = {}) {
  const canvas = $('stage');
  const ctx = canvas.getContext('2d');
  const els = {
    strip: $('photoStrip'),
    fileInput: $('fileInput'),
    panelLabel: $('panelLabel'),
    panelGrade: $('panelGrade'),
    zoom: $('zoom'),
    zoomVal: $('zoomVal'),
    titleSize: $('titleSize'),
    status: $('status'),
    dropOverlay: $('dropOverlay'),
  };
  let coverRect = { x: 0, y: 0, w: 0, h: 0 };
  let drag = null;
  let raf = 0;
  let lastThumbKey = '';

  function setStatus(msg) {
    if (els.status) els.status.textContent = msg;
  }

  // --- Rendering -----------------------------------------------------------

  function render() {
    const wrap = canvas.parentElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.max(60, Math.round(wrap.clientWidth * dpr));
    const H = Math.max(60, Math.round(wrap.clientHeight * dpr));
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }
    ctx.fillStyle = '#0a0616';
    ctx.fillRect(0, 0, W, H);
    let rect;
    if (opts.fullBleed) {
      rect = { x: 0, y: 0, w: W, h: H };
    } else {
      const size = EXPORT_SIZES[state.exportSizeId];
      const aspect = size.w / size.h;
      let w = W * 0.95;
      let h = w / aspect;
      if (h > H * 0.92) {
        h = H * 0.92;
        w = h * aspect;
      }
      rect = { x: (W - w) / 2, y: (H - h) / 2, w, h };
    }
    coverRect = rect;
    // A soft drop shadow lifts the cover off the editor backdrop.
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = Math.round(rect.w * 0.03);
    ctx.fillStyle = '#000';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
    renderCover(ctx, rect.x, rect.y, rect.w, rect.h, state);
    if (!opts.fullBleed) drawSelection(rect);
  }

  function drawSelection(rect) {
    const layout = layoutById(state.layoutId);
    const points = layout.panels[state.selectedPanel];
    if (!points) return;
    ctx.save();
    ctx.translate(rect.x, rect.y);
    panelPath(ctx, points, rect.w, rect.h);
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = Math.max(2, rect.w * 0.004);
    ctx.setLineDash([rect.w * 0.02, rect.w * 0.012]);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,94,168,0.85)';
    ctx.lineWidth = Math.max(1, rect.w * 0.0016);
    ctx.setLineDash([]);
    ctx.stroke();
    ctx.restore();
  }

  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      render();
      syncControls();
    });
  }

  // --- Control sync --------------------------------------------------------

  function syncControls() {
    document.querySelectorAll('[data-layout]').forEach((b) => {
      b.classList.toggle('active', b.dataset.layout === state.layoutId);
    });
    document.querySelectorAll('[data-grade]').forEach((b) => {
      b.classList.toggle('active', b.dataset.grade === state.gradeId);
    });
    document.querySelectorAll('[data-fit]').forEach((b) => {
      const panel = state.panels[state.selectedPanel];
      b.classList.toggle('active', !!panel && b.dataset.fit === panel.fit);
    });
    const layout = layoutById(state.layoutId);
    if (els.panelLabel) {
      els.panelLabel.textContent =
        `Panel ${state.selectedPanel + 1} of ${layout.panels.length} — ${layout.name}`;
    }
    const panel = state.panels[state.selectedPanel];
    if (panel) {
      if (document.activeElement !== els.zoom) els.zoom.value = String(panel.zoom);
      if (els.zoomVal) els.zoomVal.textContent = `${panel.zoom.toFixed(2)}×`;
      if (document.activeElement !== els.panelGrade) {
        els.panelGrade.value = panel.gradeId || '';
      }
    }
    renderThumbs();
  }

  function renderThumbs() {
    const key = state.photos.map((p) => p.id).join(',') + '|' + state.selectedPanel
      + '|' + state.panels.map((p) => p.photoId || 0).join(',');
    if (key === lastThumbKey) return;
    lastThumbKey = key;
    els.strip.innerHTML = '';
    const panel = state.panels[state.selectedPanel];
    state.photos.forEach((photo, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'thumb' + (panel && panel.photoId === photo.id ? ' in-panel' : '');
      btn.title = `${photo.name} — click to put it in the selected panel`;
      const img = document.createElement('img');
      img.src = photo.img.src;
      img.alt = photo.name;
      const tag = document.createElement('span');
      tag.textContent = String(i + 1);
      btn.append(img, tag);
      btn.addEventListener('click', () => {
        update(() => {
          state.panels[state.selectedPanel].photoId = photo.id;
        });
        setStatus(`${photo.name} placed in panel ${state.selectedPanel + 1}.`);
      });
      els.strip.appendChild(btn);
    });
    if (state.photos.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'thumbs-empty';
      empty.textContent = 'No photos yet — add some and they will appear here.';
      els.strip.appendChild(empty);
    }
  }

  // --- Photo intake --------------------------------------------------------

  async function handleFiles(fileList) {
    const files = [...fileList].filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) {
      setStatus('Those files are not images — nothing was added.');
      return;
    }
    for (const file of files) {
      if (state.photos.length >= MAX_PHOTOS) {
        setStatus(`The studio holds up to ${MAX_PHOTOS} photos — extra files were skipped.`);
        break;
      }
      const url = URL.createObjectURL(file);
      try {
        const img = await loadImageFromUrl(url);
        const photo = addPhoto(file.name || 'Photo', img);
        if (!photo) break;
        // A fresh photo goes straight into the first empty panel.
        update(() => {
          const layout = layoutById(state.layoutId);
          for (let i = 0; i < layout.panels.length; i++) {
            if (!state.panels[i].photoId) {
              state.panels[i].photoId = photo.id;
              break;
            }
          }
        });
        setStatus(`${photo.name} added — click any panel, then a thumbnail, to place it.`);
      } catch {
        setStatus(`Could not read ${file.name || 'that file'} as an image.`);
      }
    }
    schedule();
  }

  // --- Pointer work on the canvas ------------------------------------------

  function toCoverFractions(ev) {
    const r = canvas.getBoundingClientRect();
    const px = (ev.clientX - r.left) * (canvas.width / r.width);
    const py = (ev.clientY - r.top) * (canvas.height / r.height);
    return {
      fx: (px - coverRect.x) / coverRect.w,
      fy: (py - coverRect.y) / coverRect.h,
    };
  }

  canvas.addEventListener('pointerdown', (ev) => {
    const { fx, fy } = toCoverFractions(ev);
    const layout = layoutById(state.layoutId);
    for (let i = layout.panels.length - 1; i >= 0; i--) {
      if (pointInPolygon(fx, fy, layout.panels[i])) {
        if (state.selectedPanel !== i) update(() => { state.selectedPanel = i; });
        const panel = state.panels[i];
        drag = {
          panel: i,
          startFx: fx,
          startFy: fy,
          origX: panel.x,
          origY: panel.y,
          bounds: panelBounds(layout.panels[i]),
        };
        try { canvas.setPointerCapture(ev.pointerId); } catch { /* noop */ }
        canvas.style.cursor = 'grabbing';
        break;
      }
    }
  });

  canvas.addEventListener('pointermove', (ev) => {
    if (!drag) return;
    const { fx, fy } = toCoverFractions(ev);
    const panel = state.panels[drag.panel];
    // Pan runs -1..1 across the overflow, so dragging the width of the
    // panel sweeps most of the range.
    const nx = clamp(drag.origX + ((fx - drag.startFx) / Math.max(0.05, drag.bounds.w)) * 1.6, -1, 1);
    const ny = clamp(drag.origY + ((fy - drag.startFy) / Math.max(0.05, drag.bounds.h)) * 1.6, -1, 1);
    update(() => {
      panel.x = nx;
      panel.y = ny;
    });
  });

  const endDrag = () => {
    drag = null;
    canvas.style.cursor = 'grab';
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  // --- Controls --------------------------------------------------------------

  document.querySelectorAll('[data-layout]').forEach((btn) => {
    btn.addEventListener('click', () => {
      update(() => {
        state.layoutId = btn.dataset.layout;
        const count = layoutById(state.layoutId).panels.length;
        if (state.selectedPanel >= count) state.selectedPanel = 0;
      });
      setStatus(`${layoutById(state.layoutId).name} layout — panels keep their photos.`);
    });
  });

  document.querySelectorAll('[data-grade]').forEach((btn) => {
    btn.addEventListener('click', () => {
      update(() => { state.gradeId = btn.dataset.grade; });
    });
  });

  document.querySelectorAll('[data-fit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      update(() => { state.panels[state.selectedPanel].fit = btn.dataset.fit; });
    });
  });

  els.zoom.addEventListener('input', () => {
    const v = parseFloat(els.zoom.value);
    update(() => { state.panels[state.selectedPanel].zoom = v; });
  });

  els.panelGrade.addEventListener('change', () => {
    const v = els.panelGrade.value;
    update(() => { state.panels[state.selectedPanel].gradeId = v === '' ? null : v; });
  });

  $('centerBtn').addEventListener('click', () => {
    update(() => {
      const panel = state.panels[state.selectedPanel];
      panel.x = 0;
      panel.y = 0;
    });
    setStatus(`Panel ${state.selectedPanel + 1} photo centred.`);
  });

  $('titleInput').addEventListener('input', (ev) => {
    update(() => { state.title = ev.target.value; });
  });
  $('captionInput').addEventListener('input', (ev) => {
    update(() => { state.caption = ev.target.value; });
  });
  $('letterPos').addEventListener('change', (ev) => {
    update(() => { state.letterPos = ev.target.value; });
  });
  els.titleSize.addEventListener('input', () => {
    update(() => { state.letterSize = parseFloat(els.titleSize.value); });
  });
  $('letterGradient').addEventListener('change', (ev) => {
    update(() => { state.letterGradient = ev.target.checked; });
  });
  $('exportSize').addEventListener('change', (ev) => {
    update(() => { state.exportSizeId = ev.target.value; });
  });

  $('addPhotos').addEventListener('click', () => els.fileInput.click());
  els.fileInput.addEventListener('change', () => {
    handleFiles(els.fileInput.files);
    els.fileInput.value = '';
  });

  // Drag-and-drop anywhere on the window.
  let dragDepth = 0;
  window.addEventListener('dragenter', (ev) => {
    ev.preventDefault();
    dragDepth++;
    document.body.classList.add('dragging');
  });
  window.addEventListener('dragleave', (ev) => {
    ev.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) document.body.classList.remove('dragging');
  });
  window.addEventListener('dragover', (ev) => ev.preventDefault());
  window.addEventListener('drop', (ev) => {
    ev.preventDefault();
    dragDepth = 0;
    document.body.classList.remove('dragging');
    if (ev.dataTransfer) handleFiles(ev.dataTransfer.files);
  });

  // --- Export ----------------------------------------------------------------

  function exportPNG(sizeId) {
    const size = EXPORT_SIZES[sizeId];
    const off = document.createElement('canvas');
    off.width = size.w;
    off.height = size.h;
    renderCover(off.getContext('2d'), 0, 0, size.w, size.h, state);
    off.toBlob((blob) => {
      if (!blob) {
        setStatus('Export failed in this browser — try a different size.');
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-cover-${size.w}x${size.h}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      setStatus(`Exported vice-cover-${size.w}x${size.h}.png — ready to share.`);
    }, 'image/png');
  }

  $('exportBtn').addEventListener('click', () => exportPNG(state.exportSizeId));
  $('exportAllBtn').addEventListener('click', () => {
    Object.keys(EXPORT_SIZES).forEach((id, i) => {
      setTimeout(() => exportPNG(id), i * 400);
    });
    setStatus('Exporting all four sizes, one after another…');
  });

  // --- Surprise --------------------------------------------------------------

  $('surpriseBtn').addEventListener('click', () => {
    const layouts = ['classic', 'trio', 'duo', 'solo'];
    const grades = ['vice', 'neon', 'golden', 'noir'];
    update(() => {
      state.layoutId = layouts[Math.floor(Math.random() * layouts.length)];
      state.gradeId = grades[Math.floor(Math.random() * grades.length)];
      assignPlannedPhotos();
      // Then shuffle the arrangement and loosen the framing.
      const ids = state.photos.map((p) => p.id);
      state.panels.forEach((panel) => {
        if (ids.length) panel.photoId = ids[Math.floor(Math.random() * ids.length)];
        panel.x = (Math.random() * 2 - 1) * 0.6;
        panel.y = (Math.random() * 2 - 1) * 0.6;
        panel.zoom = 1 + Math.random() * 0.6;
      });
      state.selectedPanel = 0;
    });
    setStatus('Surprise cover shuffled — tweak it or export it as it stands.');
  });

  // --- Keyboard ----------------------------------------------------------------

  window.addEventListener('keydown', (ev) => {
    const target = ev.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
      || target.tagName === 'SELECT' || target.isContentEditable)) return;
    const panel = state.panels[state.selectedPanel];
    if (!panel) return;
    const step = ev.shiftKey ? 0.02 : 0.07;
    let used = true;
    update(() => {
      switch (ev.key) {
        case 'ArrowLeft': panel.x = clamp(panel.x - step, -1, 1); break;
        case 'ArrowRight': panel.x = clamp(panel.x + step, -1, 1); break;
        case 'ArrowUp': panel.y = clamp(panel.y - step, -1, 1); break;
        case 'ArrowDown': panel.y = clamp(panel.y + step, -1, 1); break;
        case '+':
        case '=': panel.zoom = clamp(panel.zoom * 1.1, 0.4, 4); break;
        case '-':
        case '_': panel.zoom = clamp(panel.zoom / 1.1, 0.4, 4); break;
        default: {
          const n = parseInt(ev.key, 10);
          if (Number.isInteger(n) && n >= 1 && n <= layoutById(state.layoutId).panels.length) {
            state.selectedPanel = n - 1;
          } else used = false;
        }
      }
    });
    if (used) ev.preventDefault();
  });

  window.addEventListener('resize', schedule);
  onChange(schedule);
  render();
  syncControls();

  return { renderNow: render };
}
