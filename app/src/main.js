// main.js — boots Vice Cover Studio.
//
// Loads the two built-in sample photos, plans them into the Classic
// layout so the very first screen is already a finished cover, wires the
// editor, and — when the URL carries ?shot= — stages one of the
// deterministic screenshot scenes from shots.js instead, flagging
// window.__shotReady once the scene is painted.

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
      try { await img.decode(); } catch { /* already decoded and usable */ }
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
    // Two frames guarantee the scene is fully painted before capture.
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
