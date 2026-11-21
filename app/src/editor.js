// Vice Cover Studio — editor wiring.
// Connects the DOM controls to the cover store: uploads and drag-and-drop,
// the photo tray, the preset gallery, layout and grade pickers, per-panel
// framing (drag to move, zoom slider, fit/fill, flip, grade override),
// lettering controls, export buttons and keyboard shortcuts. Every change
// goes through the store, and the store re-renders the preview.

import { LAYOUT_IDS, GRADE_IDS, EXPORT_SIZES, loadPhotoImage } from './state.js';
import { GRADES } from './grades.js';
import { PRESETS, presetPatch } from './presets.js';
import { layoutPanels, panelBounds } from './layouts.js';
import { renderCover } from './render.js';

const LAYOUT_NAMES = { classic: 'Classic Cover', trio: 'Trio', duo: 'Duo Split', solo: 'Solo Poster' };
const SURPRISE_TITLES = ['VICE COVER', 'LEONIDA NIGHTS', 'SUNSET STRIP', 'NEON PALMS', 'GOLDEN COAST', 'VICE CITY'];
const SURPRISE_CAPTIONS = [
  'Welcome to Leonida',
  'Where the night never ends',
  'Salt air and neon signs',
  'Full tank, no plan',
  'The city in one frame',
];

export function mountEditor(store, els) {
  const { canvas, status } = els;
  let drag = null;

  function setStatus(text) {
    status.textContent = text;
  }

  function currentSize() {
    return EXPORT_SIZES.find((s) => s.id === store.get().exportSize) || EXPORT_SIZES[0];
  }

  function renderPreview() {
    const state = store.get();
    const size = currentSize();
    renderCover(canvas, state, size.w, size.h);
  }

  function refreshPanelControls() {
    const state = store.get();
    const panel = state.panels[state.selectedPanel];
    if (!panel) return;
    els.zoomRange.value = String(panel.zoom);
    els.zoomLabel.textContent = `${Math.round(panel.zoom * 100)}%`;
    els.fitBtn.textContent = panel.fit === 'fill' ? 'Fill frame' : 'Fit frame';
    els.flipBtn.setAttribute('aria-pressed', String(panel.flip));
    els.flipBtn.classList.toggle('on', panel.flip);
    els.panelGrade.value = panel.grade || '';
    els.panelNote.textContent = `Panel ${state.selectedPanel + 1} of ${state.panels.length} — ${panel.photoId ? 'photo set' : 'empty, placeholder art'}`;
  }

  function refreshPickers() {
    const state = store.get();
    els.layoutRow.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.layout === state.layout));
    els.gradeRow.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.grade === state.grade));
    els.sizeRow.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.size === state.exportSize));
    els.tray.querySelectorAll('.thumb').forEach((t) => t.classList.toggle('on', t.dataset.photo === state.selectedPhoto));
    els.presetRow.querySelectorAll('.preset-card').forEach((c) => c.classList.remove('on'));
    els.titleInput.value = state.title;
    els.captionInput.value = state.caption;
    els.sizeRange.value = String(state.letterSize);
    els.posTop.classList.toggle('on', state.letterPos === 'top');
    els.posBottom.classList.toggle('on', state.letterPos === 'bottom');
    els.gradToggle.classList.toggle('on', state.letterGradient);
    els.gradToggle.setAttribute('aria-pressed', String(state.letterGradient));
  }

  function refreshAll() {
    renderPreview();
    refreshPanelControls();
    refreshPickers();
  }

  function buildTray() {
    els.tray.innerHTML = '';
    for (const photo of store.get().photos) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'thumb';
      btn.dataset.photo = photo.id;
      btn.title = photo.name;
      const img = document.createElement('img');
      img.src = photo.src;
      img.alt = photo.name;
      btn.appendChild(img);
      const tag = document.createElement('span');
      tag.textContent = photo.name;
      btn.appendChild(tag);
      btn.addEventListener('click', () => {
        const state = store.get();
        store.update({ selectedPhoto: photo.id });
        store.updatePanel(state.selectedPanel, { photoId: photo.id });
        setStatus(`${photo.name} placed in panel ${state.selectedPanel + 1}.`);
        refreshAll();
      });
      els.tray.appendChild(btn);
    }
  }

  function buildPresets() {
    els.presetRow.innerHTML = '';
    for (const preset of PRESETS) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'preset-card';
      card.dataset.preset = preset.id;
      const name = document.createElement('strong');
      name.textContent = preset.name;
      const blurb = document.createElement('span');
      blurb.textContent = preset.blurb;
      card.append(name, blurb);
      card.addEventListener('click', () => {
        store.update(presetPatch(preset));
        setStatus(`Preset “${preset.name}” applied — tweak anything from here.`);
        refreshAll();
      });
      els.presetRow.appendChild(card);
    }
  }

  function buildPicker(row, items, attr, onPick) {
    row.innerHTML = '';
    for (const item of items) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset[attr] = item.id;
      btn.textContent = item.label;
      btn.addEventListener('click', () => onPick(item.id));
      row.appendChild(btn);
    }
  }

  buildPicker(els.layoutRow, LAYOUT_IDS.map((id) => ({ id, label: LAYOUT_NAMES[id] })), 'layout', (id) => {
    store.setLayout(id);
    setStatus(`Layout: ${LAYOUT_NAMES[id]}.`);
    refreshAll();
  });
  buildPicker(els.gradeRow, GRADE_IDS.map((id) => ({ id, label: GRADES[id].label })), 'grade', (id) => {
    store.update({ grade: id });
    setStatus(`Grade: ${GRADES[id].label}.`);
    refreshAll();
  });
  buildPicker(els.sizeRow, EXPORT_SIZES, 'size', (id) => {
    store.update({ exportSize: id });
    setStatus(`Export size: ${id.replace('x', ' × ')}.`);
    refreshAll();
  });

  // Uploads: file input and drag-and-drop onto the whole stage.
  els.uploadInput.addEventListener('change', async () => {
    const files = [...els.uploadInput.files].slice(0, 6 - store.get().photos.length);
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const photo = store.addPhoto(file);
      await loadPhotoImage(photo).catch(() => null);
      buildTray();
    }
    setStatus(`${files.length} photo${files.length === 1 ? '' : 's'} added. Click a panel, then a photo to place it.`);
    refreshAll();
    els.uploadInput.value = '';
  });
  els.dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    els.dropZone.classList.add('drop');
  });
  els.dropZone.addEventListener('dragleave', () => els.dropZone.classList.remove('drop'));
  els.dropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    els.dropZone.classList.remove('drop');
    const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith('image/')).slice(0, 6 - store.get().photos.length);
    for (const file of files) {
      const photo = store.addPhoto(file);
      await loadPhotoImage(photo).catch(() => null);
      buildTray();
    }
    setStatus(`${files.length} photo${files.length === 1 ? '' : 's'} dropped in.`);
    refreshAll();
  });

  // Canvas: click selects a panel, drag moves its photo.
  function panelAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const state = store.get();
    const size = currentSize();
    const x = ((clientX - rect.left) / rect.width) * size.w;
    const y = ((clientY - rect.top) / rect.height) * size.h;
    const polys = layoutPanels(state.layout, size.w, size.h);
    for (let i = polys.length - 1; i >= 0; i--) {
      const b = panelBounds(polys[i]);
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return i;
    }
    return -1;
  }
  canvas.addEventListener('pointerdown', (e) => {
    const i = panelAt(e.clientX, e.clientY);
    if (i < 0) return;
    store.update({ selectedPanel: i });
    const state = store.get();
    const panel = state.panels[i];
    const rect = canvas.getBoundingClientRect();
    const size = currentSize();
    drag = {
      panel: i,
      startX: e.clientX,
      startY: e.clientY,
      shiftX: panel.shiftX,
      shiftY: panel.shiftY,
      scaleX: size.w / rect.width,
      scaleY: size.h / rect.height,
    };
    canvas.setPointerCapture(e.pointerId);
    refreshPanelControls();
    refreshPickers();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const state = store.get();
    const panel = state.panels[drag.panel];
    const bounds = panelBounds(layoutPanels(state.layout, currentSize().w, currentSize().h)[drag.panel]);
    const dx = ((e.clientX - drag.startX) * drag.scaleX) / bounds.w;
    const dy = ((e.clientY - drag.startY) * drag.scaleY) / bounds.h;
    store.updatePanel(drag.panel, {
      shiftX: clamp(drag.shiftX + dx, -1, 1),
      shiftY: clamp(drag.shiftY + dy, -1, 1),
    });
    renderPreview();
  });
  canvas.addEventListener('pointerup', () => {
    drag = null;
  });

  // Panel framing controls.
  els.zoomRange.addEventListener('input', () => {
    const state = store.get();
    store.updatePanel(state.selectedPanel, { zoom: Number(els.zoomRange.value) });
    els.zoomLabel.textContent = `${Math.round(Number(els.zoomRange.value) * 100)}%`;
    renderPreview();
  });
  els.fitBtn.addEventListener('click', () => {
    const state = store.get();
    const panel = state.panels[state.selectedPanel];
    const next = panel.fit === 'fill' ? 'fit' : 'fill';
    store.updatePanel(state.selectedPanel, { fit: next });
    setStatus(`Panel ${state.selectedPanel + 1}: ${next === 'fill' ? 'fill the frame' : 'fit inside the frame'}.`);
    refreshAll();
  });
  els.flipBtn.addEventListener('click', () => {
    const state = store.get();
    const panel = state.panels[state.selectedPanel];
    store.updatePanel(state.selectedPanel, { flip: !panel.flip });
    setStatus(`Panel ${state.selectedPanel + 1} ${panel.flip ? 'unflipped' : 'mirrored'}.`);
    refreshAll();
  });
  els.panelGrade.addEventListener('change', () => {
    const state = store.get();
    store.updatePanel(state.selectedPanel, { grade: els.panelGrade.value || null });
    setStatus(`Panel ${state.selectedPanel + 1} grade: ${els.panelGrade.value ? GRADES[els.panelGrade.value].label : 'follows the cover'}.`);
    refreshAll();
  });

  // Lettering controls.
  els.titleInput.addEventListener('input', () => {
    store.update({ title: els.titleInput.value });
    renderPreview();
  });
  els.captionInput.addEventListener('input', () => {
    store.update({ caption: els.captionInput.value });
    renderPreview();
  });
  els.posTop.addEventListener('click', () => {
    store.update({ letterPos: 'top' });
    refreshAll();
  });
  els.posBottom.addEventListener('click', () => {
    store.update({ letterPos: 'bottom' });
    refreshAll();
  });
  els.sizeRange.addEventListener('input', () => {
    store.update({ letterSize: Number(els.sizeRange.value) });
    renderPreview();
  });
  els.gradToggle.addEventListener('click', () => {
    const state = store.get();
    store.update({ letterGradient: !state.letterGradient });
    refreshAll();
  });

  // Surprise me: shuffle layout, grade, photos and words.
  els.surpriseBtn.addEventListener('click', () => {
    const state = store.get();
    const layout = LAYOUT_IDS[Math.floor(Math.random() * LAYOUT_IDS.length)];
    const grade = GRADE_IDS[Math.floor(Math.random() * GRADE_IDS.length)];
    const samples = ['boulevard', 'pier'];
    const count = layout === 'classic' ? 5 : layout === 'trio' ? 3 : layout === 'duo' ? 2 : 1;
    const shuffled = [...samples, ...samples, ...samples].sort(() => Math.random() - 0.5);
    store.setLayout(layout);
    store.update({
      grade,
      title: SURPRISE_TITLES[Math.floor(Math.random() * SURPRISE_TITLES.length)],
      caption: SURPRISE_CAPTIONS[Math.floor(Math.random() * SURPRISE_CAPTIONS.length)],
      panels: Array.from({ length: count }, (_, i) => ({
        photoId: shuffled[i],
        shiftX: 0,
        shiftY: 0,
        zoom: 1,
        fit: 'fill',
        flip: Math.random() < 0.25,
        grade: null,
      })),
    });
    setStatus('Surprise! A fresh cover, shuffled from your photos.');
    refreshAll();
  });

  // Export: one size, or all four in turn.
  function exportOne(size, done) {
    const off = document.createElement('canvas');
    renderCover(off, store.get(), size.w, size.h);
    off.toBlob((blob) => {
      if (!blob) {
        setStatus('Export failed — the canvas was empty.');
        if (done) done();
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-cover-${size.id}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      setStatus(`Exported vice-cover-${size.id}.png (${size.w} × ${size.h}).`);
      if (done) done();
    }, 'image/png');
  }
  els.exportBtn.addEventListener('click', () => exportOne(currentSize()));
  els.exportAllBtn.addEventListener('click', () => {
    const queue = [...EXPORT_SIZES];
    const next = () => {
      const size = queue.shift();
      if (!size) return;
      exportOne(size, () => setTimeout(next, 350));
    };
    next();
  });

  // Keyboard shortcuts: arrows nudge the selected photo, +/- zooms it.
  window.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select')) return;
    const state = store.get();
    const panel = state.panels[state.selectedPanel];
    if (!panel || !panel.photoId) return;
    const step = e.shiftKey ? 0.06 : 0.02;
    if (e.key === 'ArrowLeft') store.updatePanel(state.selectedPanel, { shiftX: clamp(panel.shiftX - step, -1, 1) });
    else if (e.key === 'ArrowRight') store.updatePanel(state.selectedPanel, { shiftX: clamp(panel.shiftX + step, -1, 1) });
    else if (e.key === 'ArrowUp') store.updatePanel(state.selectedPanel, { shiftY: clamp(panel.shiftY - step, -1, 1) });
    else if (e.key === 'ArrowDown') store.updatePanel(state.selectedPanel, { shiftY: clamp(panel.shiftY + step, -1, 1) });
    else if (e.key === '+' || e.key === '=') store.updatePanel(state.selectedPanel, { zoom: clamp(panel.zoom * 1.1, 1, 3) });
    else if (e.key === '-') store.updatePanel(state.selectedPanel, { zoom: clamp(panel.zoom / 1.1, 1, 3) });
    else return;
    e.preventDefault();
    renderPreview();
    refreshPanelControls();
  });

  buildTray();
  buildPresets();
  store.subscribe(renderPreview);
  refreshAll();
  return { renderPreview, setStatus };
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}
