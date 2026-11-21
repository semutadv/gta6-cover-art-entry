// Vice Cover Studio — boot.
// Loads the built-in samples, opens the editor on the finished-looking
// default cover, and handles screenshot mode: ?shot=cover renders only the
// finished cover, ?shot=editor shows the full editor with a staged cover.
// Both set window.__shotReady once the cover is painted.

import { createStore, freshCover, loadAllPhotos } from './state.js';
import { mountEditor } from './editor.js';
import { renderCover } from './render.js';
import { shotPatch, markShotReady } from './shots.js';

const store = createStore(freshCover());

async function boot() {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  const isCoverShot = shot === 'cover';

  if (isCoverShot) document.body.classList.add('cover-only');

  const canvas = document.getElementById('stage');
  if (shot) {
    store.update(shotPatch(params));
  }
  await loadAllPhotos(store);

  if (isCoverShot) {
    const w = Number(params.get('w')) || 1080;
    const h = Number(params.get('h')) || 1080;
    renderCover(canvas, store.get(), w, h);
    markShotReady();
    return;
  }

  const els = {
    canvas,
    status: document.getElementById('statusLine'),
    tray: document.getElementById('tray'),
    presetRow: document.getElementById('presetRow'),
    layoutRow: document.getElementById('layoutRow'),
    gradeRow: document.getElementById('gradeRow'),
    sizeRow: document.getElementById('sizeRow'),
    uploadInput: document.getElementById('uploadInput'),
    dropZone: document.getElementById('dropZone'),
    zoomRange: document.getElementById('zoomRange'),
    zoomLabel: document.getElementById('zoomLabel'),
    fitBtn: document.getElementById('fitBtn'),
    flipBtn: document.getElementById('flipBtn'),
    panelGrade: document.getElementById('panelGrade'),
    panelNote: document.getElementById('panelNote'),
    titleInput: document.getElementById('titleInput'),
    captionInput: document.getElementById('captionInput'),
    posTop: document.getElementById('posTop'),
    posBottom: document.getElementById('posBottom'),
    sizeRange: document.getElementById('sizeRange'),
    gradToggle: document.getElementById('gradToggle'),
    surpriseBtn: document.getElementById('surpriseBtn'),
    exportBtn: document.getElementById('exportBtn'),
    exportAllBtn: document.getElementById('exportAllBtn'),
  };
  mountEditor(store, els);
  if (shot === 'editor') {
    // Give the editor one frame to paint before declaring the shot ready.
    requestAnimationFrame(() => markShotReady());
  }
}

boot().catch((err) => {
  console.error(err);
  const line = document.getElementById('statusLine');
  if (line) line.textContent = `Could not start the studio: ${err.message}`;
});
