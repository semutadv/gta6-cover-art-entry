// editor.js — connects the page's controls to the cover state and
// keeps the live preview painted.
//
// The preview shows the cover at the chosen export aspect, and it is
// painted by the very same composeCover() call that produces the PNG
// exports, so the preview can never promise something the export does
// not deliver. Clicking a panel picks it; dragging inside a panel
// slides its photo around; and every control writes through state.js's
// mutate(), so a single change ping repaints everything.

import {
  state, subscribe, mutate, registerPhoto, findPhoto, dealPhotos,
  outputSizeById, OUTPUT_SIZES, PHOTO_LIMIT,
} from './state.js';
import { findLayout, polygonBox, pointInside } from './layouts.js';
import { composeCover, tracePanel } from './render.js';

const byId = (id) => document.getElementById(id);
const limit = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function fetchImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image failed to load'));
    img.src = url;
  });
}

export function startEditor(opts = {}) {
  const canvas = byId('board');
  const ctx = canvas.getContext('2d');
  const els = {
    rail: byId('photoRail'),
    picker: byId('filePicker'),
    heading: byId('panelHeading'),
    tone: byId('panelTone'),
    zoom: byId('zoomSlider'),
    zoomRead: byId('zoomRead'),
    letterScale: byId('letterScale'),
    notice: byId('noticeLine'),
    veil: byId('dropVeil'),
  };
  let coverBox = { x: 0, y: 0, w: 0, h: 0 };
  let drag = null;
  let raf = 0;
  let lastRailKey = '';

  function setNotice(msg) {
    if (els.notice) els.notice.textContent = msg;
  }

  // --- Painting the preview ------------------------------------------------

  function paintPreview() {
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
      // Screenshot cover scenes: the cover is the whole window.
      rect = { x: 0, y: 0, w: W, h: H };
    } else {
      // Fit the export aspect inside the stage, with a margin to spare.
      const size = outputSizeById(state.exportSizeId);
      const aspect = size.w / size.h;
      let w = W * 0.95;
      let h = w / aspect;
      if (h > H * 0.92) {
        h = H * 0.92;
        w = h * aspect;
      }
      rect = { x: (W - w) / 2, y: (H - h) / 2, w, h };
    }
    coverBox = rect;
    // A soft shadow grounds the cover on the editor's dark backdrop.
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = Math.round(rect.w * 0.03);
    ctx.fillStyle = '#000';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
    composeCover(ctx, rect.x, rect.y, rect.w, rect.h, state);
    if (!opts.fullBleed) markSelection(rect);
  }

  function markSelection(rect) {
    const layout = findLayout(state.layoutId);
    const points = layout.panels[state.selectedPanel];
    if (!points) return;
    ctx.save();
    ctx.translate(rect.x, rect.y);
    tracePanel(ctx, points, rect.w, rect.h);
    // A cyan dashed outline, kissed with a thin magenta inner stroke.
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

  // Coalesce bursts of changes into one repaint per animation frame.
  function requestPaint() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      paintPreview();
      refreshControls();
    });
  }

  // --- Keeping the controls honest -------------------------------------------

  function refreshControls() {
    document.querySelectorAll('[data-layout]').forEach((b) => {
      b.classList.toggle('on', b.dataset.layout === state.layoutId);
    });
    document.querySelectorAll('[data-grade]').forEach((b) => {
      b.classList.toggle('on', b.dataset.grade === state.gradeId);
    });
    document.querySelectorAll('[data-fit]').forEach((b) => {
      const panel = state.panels[state.selectedPanel];
      b.classList.toggle('on', !!panel && b.dataset.fit === panel.fit);
    });
    const layout = findLayout(state.layoutId);
    if (els.heading) {
      els.heading.textContent =
        `Panel ${state.selectedPanel + 1} of ${layout.panels.length} — ${layout.name}`;
    }
    const panel = state.panels[state.selectedPanel];
    if (panel) {
      // Never fight the user for a control they are holding right now.
      if (document.activeElement !== els.zoom) els.zoom.value = String(panel.zoom);
      if (els.zoomRead) els.zoomRead.textContent = `${panel.zoom.toFixed(2)}×`;
      if (document.activeElement !== els.tone) {
        els.tone.value = panel.gradeId || '';
      }
      const flipBtn = byId('flipPhotoBtn');
      if (flipBtn) flipBtn.classList.toggle('on', !!panel.flip);
    }
    paintRail();
  }

  function paintRail() {
    // Rebuild the strip only when something it shows has changed.
    const key = state.photos.map((p) => p.id).join(',') + '|' + state.selectedPanel
      + '|' + state.panels.map((p) => p.photoId || 0).join(',');
    if (key === lastRailKey) return;
    lastRailKey = key;
    els.rail.innerHTML = '';
    const panel = state.panels[state.selectedPanel];
    state.photos.forEach((photo, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'strip' + (panel && panel.photoId === photo.id ? ' in-panel' : '');
      btn.title = `${photo.name} — click to put it in the selected panel`;
      const img = document.createElement('img');
      img.src = photo.img.src;
      img.alt = photo.name;
      const tag = document.createElement('span');
      tag.textContent = String(i + 1);
      btn.append(img, tag);
      btn.addEventListener('click', () => {
        mutate(() => {
          state.panels[state.selectedPanel].photoId = photo.id;
        });
        setNotice(`${photo.name} placed in panel ${state.selectedPanel + 1}.`);
      });
      els.rail.appendChild(btn);
    });
    if (state.photos.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'strips-empty';
      empty.textContent = 'No photos yet — add some and they will appear here.';
      els.rail.appendChild(empty);
    }
  }

  // --- Bringing photos in ------------------------------------------------------

  async function ingestFiles(fileList) {
    const files = [...fileList].filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) {
      setNotice('Those files are not images — nothing was added.');
      return;
    }
    for (const file of files) {
      if (state.photos.length >= PHOTO_LIMIT) {
        setNotice(`The studio holds up to ${PHOTO_LIMIT} photos — extra files were skipped.`);
        break;
      }
      const url = URL.createObjectURL(file);
      try {
        const img = await fetchImage(url);
        const photo = registerPhoto(file.name || 'Photo', img);
        if (!photo) break;
        // A newcomer goes straight into the first panel still empty.
        mutate(() => {
          const layout = findLayout(state.layoutId);
          for (let i = 0; i < layout.panels.length; i++) {
            if (!state.panels[i].photoId) {
              state.panels[i].photoId = photo.id;
              break;
            }
          }
        });
        setNotice(`${photo.name} added — click any panel, then a thumbnail, to place it.`);
      } catch {
        setNotice(`Could not read ${file.name || 'that file'} as an image.`);
      }
    }
    requestPaint();
  }

  // --- Pointer work on the canvas -------------------------------------------------

  function pointerToFractions(ev) {
    const r = canvas.getBoundingClientRect();
    const px = (ev.clientX - r.left) * (canvas.width / r.width);
    const py = (ev.clientY - r.top) * (canvas.height / r.height);
    return {
      fx: (px - coverBox.x) / coverBox.w,
      fy: (py - coverBox.y) / coverBox.h,
    };
  }

  canvas.addEventListener('pointerdown', (ev) => {
    const { fx, fy } = pointerToFractions(ev);
    const layout = findLayout(state.layoutId);
    // Topmost panel wins, so test from the last panel backwards.
    for (let i = layout.panels.length - 1; i >= 0; i--) {
      if (pointInside(fx, fy, layout.panels[i])) {
        if (state.selectedPanel !== i) mutate(() => { state.selectedPanel = i; });
        const panel = state.panels[i];
        drag = {
          panel: i,
          startFx: fx,
          startFy: fy,
          origX: panel.x,
          origY: panel.y,
          bounds: polygonBox(layout.panels[i]),
        };
        try { canvas.setPointerCapture(ev.pointerId); } catch { /* capture is a nicety */ }
        canvas.style.cursor = 'grabbing';
        break;
      }
    }
  });

  canvas.addEventListener('pointermove', (ev) => {
    if (!drag) return;
    const { fx, fy } = pointerToFractions(ev);
    const panel = state.panels[drag.panel];
    // Pan spans -1..1 across the crop's slack, so dragging the width of
    // the panel sweeps most of the available range.
    const nx = limit(drag.origX + ((fx - drag.startFx) / Math.max(0.05, drag.bounds.w)) * 1.6, -1, 1);
    const ny = limit(drag.origY + ((fy - drag.startFy) / Math.max(0.05, drag.bounds.h)) * 1.6, -1, 1);
    mutate(() => {
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

  // --- The sidebar controls ----------------------------------------------------------

  document.querySelectorAll('[data-layout]').forEach((btn) => {
    btn.addEventListener('click', () => {
      mutate(() => {
        state.layoutId = btn.dataset.layout;
        const count = findLayout(state.layoutId).panels.length;
        if (state.selectedPanel >= count) state.selectedPanel = 0;
      });
      setNotice(`${findLayout(state.layoutId).name} layout — panels keep their photos.`);
    });
  });

  document.querySelectorAll('[data-grade]').forEach((btn) => {
    btn.addEventListener('click', () => {
      mutate(() => { state.gradeId = btn.dataset.grade; });
    });
  });

  document.querySelectorAll('[data-fit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      mutate(() => { state.panels[state.selectedPanel].fit = btn.dataset.fit; });
    });
  });

  byId('flipPhotoBtn').addEventListener('click', () => {
    mutate(() => {
      const panel = state.panels[state.selectedPanel];
      panel.flip = !panel.flip;
    });
    const flipped = state.panels[state.selectedPanel].flip;
    setNotice(flipped
      ? `Panel ${state.selectedPanel + 1} photo flipped — press F again to flip it back.`
      : `Panel ${state.selectedPanel + 1} photo back to normal.`);
  });

  els.zoom.addEventListener('input', () => {
    const v = parseFloat(els.zoom.value);
    mutate(() => { state.panels[state.selectedPanel].zoom = v; });
  });

  els.tone.addEventListener('change', () => {
    const v = els.tone.value;
    mutate(() => { state.panels[state.selectedPanel].gradeId = v === '' ? null : v; });
  });

  byId('centreBtn').addEventListener('click', () => {
    mutate(() => {
      const panel = state.panels[state.selectedPanel];
      panel.x = 0;
      panel.y = 0;
    });
    setNotice(`Panel ${state.selectedPanel + 1} photo centred.`);
  });

  byId('titleField').addEventListener('input', (ev) => {
    mutate(() => { state.title = ev.target.value; });
  });
  byId('captionField').addEventListener('input', (ev) => {
    mutate(() => { state.caption = ev.target.value; });
  });
  byId('letterSpot').addEventListener('change', (ev) => {
    mutate(() => { state.letterPos = ev.target.value; });
  });
  els.letterScale.addEventListener('input', () => {
    mutate(() => { state.letterSize = parseFloat(els.letterScale.value); });
  });
  byId('letterShine').addEventListener('change', (ev) => {
    mutate(() => { state.letterGradient = ev.target.checked; });
  });
  byId('exportPick').addEventListener('change', (ev) => {
    mutate(() => { state.exportSizeId = ev.target.value; });
  });

  byId('bringPhotos').addEventListener('click', () => els.picker.click());
  els.picker.addEventListener('change', () => {
    ingestFiles(els.picker.files);
    els.picker.value = '';
  });

  // Drag-and-drop works anywhere on the window; a depth counter keeps
  // the overlay up while the pointer crosses child elements.
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
    if (ev.dataTransfer) ingestFiles(ev.dataTransfer.files);
  });

  // --- Export ---------------------------------------------------------------------------

  function savePNG(sizeId) {
    const size = outputSizeById(sizeId);
    const off = document.createElement('canvas');
    off.width = size.w;
    off.height = size.h;
    composeCover(off.getContext('2d'), 0, 0, size.w, size.h, state);
    off.toBlob((blob) => {
      if (!blob) {
        setNotice('Export failed in this browser — try a different size.');
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-cover-${size.w}x${size.h}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      setNotice(`Exported vice-cover-${size.w}x${size.h}.png — ready to share.`);
    }, 'image/png');
  }

  byId('exportOneBtn').addEventListener('click', () => savePNG(state.exportSizeId));
  byId('exportEveryBtn').addEventListener('click', () => {
    OUTPUT_SIZES.forEach((size, i) => {
      setTimeout(() => savePNG(size.id), i * 400);
    });
    setNotice('Exporting all four sizes, one after another…');
  });

  // --- Surprise me -------------------------------------------------------------------------

  byId('shuffleBtn').addEventListener('click', () => {
    const layouts = ['classic', 'trio', 'duo', 'solo'];
    const grades = ['vice', 'neon', 'golden', 'noir'];
    mutate(() => {
      state.layoutId = layouts[Math.floor(Math.random() * layouts.length)];
      state.gradeId = grades[Math.floor(Math.random() * grades.length)];
      dealPhotos();
      // Then deal the photos back out at random and loosen every crop.
      const ids = state.photos.map((p) => p.id);
      state.panels.forEach((panel) => {
        if (ids.length) panel.photoId = ids[Math.floor(Math.random() * ids.length)];
        panel.x = (Math.random() * 2 - 1) * 0.6;
        panel.y = (Math.random() * 2 - 1) * 0.6;
        panel.zoom = 1 + Math.random() * 0.6;
        panel.flip = Math.random() < 0.25;
      });
      state.selectedPanel = 0;
    });
    setNotice('Surprise cover shuffled — tweak it or export it as it stands.');
  });

  // --- Keyboard --------------------------------------------------------------------------------

  window.addEventListener('keydown', (ev) => {
    const target = ev.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
      || target.tagName === 'SELECT' || target.isContentEditable)) return;
    const panel = state.panels[state.selectedPanel];
    if (!panel) return;
    const step = ev.shiftKey ? 0.02 : 0.07;
    let used = true;
    mutate(() => {
      switch (ev.key) {
        case 'ArrowLeft': panel.x = limit(panel.x - step, -1, 1); break;
        case 'ArrowRight': panel.x = limit(panel.x + step, -1, 1); break;
        case 'ArrowUp': panel.y = limit(panel.y - step, -1, 1); break;
        case 'ArrowDown': panel.y = limit(panel.y + step, -1, 1); break;
        case '+':
        case '=': panel.zoom = limit(panel.zoom * 1.1, 0.4, 4); break;
        case '-':
        case '_': panel.zoom = limit(panel.zoom / 1.1, 0.4, 4); break;
        case 'f':
        case 'F': panel.flip = !panel.flip; break;
        default: {
          const n = parseInt(ev.key, 10);
          if (Number.isInteger(n) && n >= 1 && n <= findLayout(state.layoutId).panels.length) {
            state.selectedPanel = n - 1;
          } else used = false;
        }
      }
    });
    if (used) ev.preventDefault();
  });

  window.addEventListener('resize', requestPaint);
  subscribe(requestPaint);
  paintPreview();
  refreshControls();

  return { paintNow: paintPreview };
}
