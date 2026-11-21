// main.js — boots Vice Cover Studio.
//
// The two built-in sample photos are loaded and dealt into the Classic
// layout, so the first thing anyone sees is a finished cover, not an
// empty tool. Then the editor is wired up. When the URL carries a
// ?shot= parameter, a deterministic screenshot scene from shots.js is
// staged instead, and window.__shotReady is flagged once the scene has
// had two full frames to paint.

import { state, addPhoto, assignPlannedPhotos, emit } from './state.js';
import { initEditor } from './editor.js';
import { configureFromParams } from './shots.js';

const SAMPLES = [
  { name: 'Boulevard sample', src: 'samples/boulevard.jpg' },
  { name: 'Pier sample', src: 'samples/pier.jpg' },
];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

async function boot() {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');

  for (const sample of SAMPLES) {
    const img = await loadImage(sample.src);
    if (img.decode) {
      try { await img.decode(); } catch { /* decoded enough to draw already */ }
    }
    addPhoto(sample.name, img);
  }

  if (shot) {
    document.body.classList.add('shot', `shot-${shot}`);
    configureFromParams(params);
  } else {
    assignPlannedPhotos();
  }

  const editor = initEditor({ fullBleed: shot === 'cover' });
  emit();
  editor.renderNow();

  if (shot) {
    // Two animation frames: the second one guarantees the scene is
    // fully painted before the harness takes its picture.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__shotReady = true;
    }));
  }
}

boot().catch((err) => {
  console.error(err);
  const el = document.getElementById('status');
  if (el) el.textContent = 'The studio hit a snag starting up — reload to try again.';
});
