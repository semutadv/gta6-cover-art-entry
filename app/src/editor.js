// Vice Cover Studio — editor wiring.
// Connects the state to the page: uploads and drag-and-drop, panel and photo
// selection, drag-to-move, sliders, layout/grade/size controls, the Preset
// Gallery, exports and keyboard shortcuts. Every control calls `update()` or
// `updatePanel()` so the preview re-renders through the same path.

import { update, updatePanel, selectPanel, addPhoto, panelCount, resetPanelsForLayout, sizeOf } from './state.js';
import { LAYOUTS, layoutRects } from './layouts.js';
import { GRADES } from './grades.js';
import { PRESETS, applyPreset } from './presets.js';
import { renderCover, exportPng, downloadBlob } from './render.js';

const $ = (id) => document.getElementById(id);

export function wireEditor(state, canvas, rerender) {
  const els = {
    status: $('status'),
    thumbs: $('thumbs'),
    presetGallery: $('presetGallery'),
    layoutRow: $('layoutRow'),
    gradeRow: $('gradeRow'),
    sizeSel: $('sizeSel'),
    titleInput: $('titleInput'),
    captionInput: $('captionInput'),
    titlePosSel: $('titlePosSel'),
    titleSizeRange: $('titleSizeRange'),
    gradientChk: $('gradientChk'),
    zoomRange: $('zoomRange'),
    fitBtn: $('fitBtn'),
    panelGradeSel: $('panelGradeSel'),
    fileInput: $('fileInput'),
    exportBtn: $('exportBtn'),
    exportAllBtn: $('exportAllBtn'),
    surpriseBtn: $('surpriseBtn'),
    stage: $('stage'),
  };

  const say = (msg) => { els.status.textContent = msg; };

  // --- control rows -------------------------------------------------------
  for (const [id, layout] of Object.entries(LAYOUTS)) {
    const b = document.createElement('button');
    b.className = 'chip';
    b.dataset.layout = id;
    b.textContent = layout.name;
    b.title = layout.blurb;
    b.addEventListener('click', () => {
      update(state, { layout: id });
      resetPanelsForLayout(state);
      refreshChips();
      say(`Layout: ${layout.name}.`);
    });
    els.layoutRow.appendChild(b);
  }

  for (const [id, grade] of Object.entries(GRADES)) {
    const b = document.createElement('button');
    b.className = 'chip';
    b.dataset.grade = id;
    b.textContent = grade.name;
    b.title = grade.blurb;
    b.addEventListener('click', () => {
      update(state, { grade: id });
      refreshChips();
      say(`Grade: ${grade.name}.`);
    });
    els.gradeRow.appendChild(b);
  }

  function refreshChips() {
    for (const b of els.layoutRow.children) b.classList.toggle('on', b.dataset.layout === state.layout);
    for (const b of els.gradeRow.children) b.classList.toggle('on', b.dataset.grade === state.grade);
    for (const c of els.presetGallery.children) c.classList.toggle('on', c.dataset.preset === state._preset);
  }

  // --- preset gallery -----------------------------------------------------
  for (const preset of PRESETS) {
    const card = document.createElement('button');
    card.className = 'preset';
    card.dataset.preset = preset.id;
    card.innerHTML = `<strong>${preset.name}</strong><span>${preset.blurb}</span>`;
    card.addEventListener('click', () => {
      applyPreset(state, preset);
      state._preset = preset.id;
      resetPanelsForLayout(state);
      syncPanelControls();
      refreshChips();
      say(`Preset applied: ${preset.name}.`);
      rerender();
    });
    els.presetGallery.appendChild(card);
  }

  // --- lettering controls -------------------------------------------------
  els.titleInput.value = state.title;
  els.captionInput.value = state.caption;
  els.titleInput.addEventListener('input', () => update(state, { title: els.titleInput.value }));
  els.captionInput.addEventListener('input', () => update(state, { caption: els.captionInput.value }));
  els.titlePosSel.value = state.titlePos;
  els.titlePosSel.addEventListener('change', () => update(state, { titlePos: els.titlePosSel.value }));
  els.titleSizeRange.value = state.titleSize;
  els.titleSizeRange.addEventListener('input', () => update(state, { titleSize: Number(els.titleSizeRange.value) }));
  els.gradientChk.checked = state.titleGradient;
  els.gradientChk.addEventListener('change', () => update(state, { titleGradient: els.gradientChk.checked }));

  // --- size ---------------------------------------------------------------
  els.sizeSel.addEventListener('change', () => {
    update(state, { size: els.sizeSel.value });
    say(`Export size: ${els.sizeSel.options[els.sizeSel.selectedIndex].text}.`);
  });

  // --- panel controls -----------------------------------------------------
  function syncPanelControls() {
    const p = state.panels[state.selected];
    els.zoomRange.value = p.zoom;
    els.fitBtn.textContent = p.fit === 'fill' ? 'Fit: Fill' : 'Fit: Fit';
    els.panelGradeSel.value = p.grade ?? '';
  }
  els.zoomRange.addEventListener('input', () => {
    updatePanel(state, state.selected, { zoom: Number(els.zoomRange.value) });
  });
  els.fitBtn.addEventListener('click', () => {
    const p = state.panels[state.selected];
    updatePanel(state, state.selected, { fit: p.fit === 'fill' ? 'fit' : 'fill' });
    syncPanelControls();
  });
  els.panelGradeSel.addEventListener('change', () => {
    updatePanel(state, state.selected, { grade: els.panelGradeSel.value || null });
    say('Panel grade override set.');
  });

  // --- photos -------------------------------------------------------------
  function addPhotoFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const idx = addPhoto(state, { id: `u${Date.now()}`, name: file.name, src: url, image: img });
      const p = state.panels[state.selected];
      if (p.photo === null) updatePanel(state, state.selected, { photo: idx });
      renderThumbs();
      say(`Photo added: ${file.name}.`);
      rerender();
    };
    img.src = url;
  }

  function renderThumbs() {
    els.thumbs.innerHTML = '';
    state.photos.forEach((photo, i) => {
      const t = document.createElement('button');
      t.className = 'thumb';
      t.title = photo.name;
      const img = document.createElement('img');
      img.src = photo.src;
      img.alt = photo.name;
      t.appendChild(img);
      t.addEventListener('click', () => {
        updatePanel(state, state.selected, { photo: i });
        say(`Photo placed in panel ${state.selected + 1}.`);
        rerender();
      });
      els.thumbs.appendChild(t);
    });
  }

  els.fileInput.addEventListener('change', () => {
    for (const f of els.fileInput.files) addPhotoFile(f);
    els.fileInput.value = '';
  });
  els.stage.addEventListener('dragover', (e) => { e.preventDefault(); els.stage.classList.add('drop'); });
  els.stage.addEventListener('dragleave', () => els.stage.classList.remove('drop'));
  els.stage.addEventListener('drop', (e) => {
    e.preventDefault();
    els.stage.classList.remove('drop');
    for (const f of e.dataTransfer.files) addPhotoFile(f);
  });

  // --- canvas: click to select a panel, drag to move its photo ------------
  let drag = null;
  function panelAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const px = (clientX - rect.left) / rect.width;
    const py = (clientY - rect.top) / rect.height;
    const rects = layoutRects(state.layout, 1, 1);
    for (let i = rects.length - 1; i >= 0; i--) {
      const r = rects[i];
      if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
    }
    return -1;
  }
  canvas.addEventListener('pointerdown', (e) => {
    const i = panelAt(e.clientX, e.clientY);
    if (i < 0) return;
    selectPanel(state, i);
    syncPanelControls();
    canvas.setPointerCapture(e.pointerId);
    drag = { i, x: e.clientX, y: e.clientY, px: state.panels[i].x, py: state.panels[i].y };
    rerender();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const rect = canvas.getBoundingClientRect();
    const dx = (e.clientX - drag.x) / rect.width;
    const dy = (e.clientY - drag.y) / rect.height;
    const p = state.panels[drag.i];
    updatePanel(state, drag.i, {
      x: clamp(drag.px + dx * 2, -1, 1),
      y: clamp(drag.py + dy * 2, -1, 1),
    });
  });
  canvas.addEventListener('pointerup', () => { drag = null; });

  // --- surprise me --------------------------------------------------------
  els.surpriseBtn.addEventListener('click', () => {
    const layouts = Object.keys(LAYOUTS);
    const grades = Object.keys(GRADES);
    const layout = layouts[Math.floor(Math.random() * layouts.length)];
    const grade = grades[Math.floor(Math.random() * grades.length)];
    update(state, { layout, grade });
    resetPanelsForLayout(state);
    // Shuffle which sample sits in which panel.
    const n = panelCount(state);
    const order = state.photos.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    for (let i = 0; i < n; i++) {
      updatePanel(state, i, { photo: order[i % order.length] ?? null, x: 0, y: 0, zoom: 1 });
    }
    syncPanelControls();
    refreshChips();
    say('Surprise! New layout, grade and photo shuffle.');
    rerender();
  });

  // --- export -------------------------------------------------------------
  async function doExport(w, h, label) {
    say(`Exporting ${label}…`);
    const blob = await exportPng(state, w, h);
    downloadBlob(blob, `vice-cover-${w}x${h}.png`);
    say(`Exported vice-cover-${w}x${h}.png.`);
  }
  els.exportBtn.addEventListener('click', async () => {
    const { w, h } = sizeOf(state);
    await doExport(w, h, state.size);
  });
  els.exportAllBtn.addEventListener('click', async () => {
    for (const id of ['1080x1080', '1080x1350', '1920x1080', '1080x1920']) {
      const [w, h] = id.split('x').map(Number);
      await doExport(w, h, id);
      await new Promise((r) => setTimeout(r, 250));
    }
  });

  // --- keyboard shortcuts -------------------------------------------------
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, select, textarea')) return;
    const p = state.panels[state.selected];
    const step = 0.05;
    if (e.key === 'ArrowLeft') { updatePanel(state, state.selected, { x: clamp(p.x - step, -1, 1) }); e.preventDefault(); }
    if (e.key === 'ArrowRight') { updatePanel(state, state.selected, { x: clamp(p.x + step, -1, 1) }); e.preventDefault(); }
    if (e.key === 'ArrowUp') { updatePanel(state, state.selected, { y: clamp(p.y - step, -1, 1) }); e.preventDefault(); }
    if (e.key === 'ArrowDown') { updatePanel(state, state.selected, { y: clamp(p.y + step, -1, 1) }); e.preventDefault(); }
    if (e.key === '+' || e.key === '=') { updatePanel(state, state.selected, { zoom: clamp(p.zoom + 0.1, 1, 3) }); syncPanelControls(); e.preventDefault(); }
    if (e.key === '-') { updatePanel(state, state.selected, { zoom: clamp(p.zoom - 0.1, 1, 3) }); syncPanelControls(); e.preventDefault(); }
  });

  refreshChips();
  syncPanelControls();
  renderThumbs();
  return { renderThumbs, syncPanelControls, refreshChips, say };
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}
