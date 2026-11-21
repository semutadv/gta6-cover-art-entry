// main.js — boots Vice Cover Studio.
//
// The two built-in sample photos are loaded and dealt into the Classic
// layout, so the first thing anyone sees is a finished cover, not an
// empty tool. Then the editor is wired up. When the URL carries a
// ?shot= parameter, a deterministic screenshot scene from shots.js is
// staged instead, and window.__shotReady is flagged once the scene has
// had two full frames to paint.

import { state, registerPhoto, dealPhotos, notify } from './state.js';
import { startEditor } from './editor.js';
import { applySceneParams } from './shots.js';

const BUILTIN_SHOTS = [
  { name: 'Boulevard sample', src: 'samples/boulevard.jpg' },
  { name: 'Pier sample', src: 'samples/pier.jpg' },
];

function loadPicture(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

async function start() {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');

  for (const sample of BUILTIN_SHOTS) {
    const img = await loadPicture(sample.src);
    if (img.decode) {
      try { await img.decode(); } catch { /* decoded enough to draw already */ }
    }
    registerPhoto(sample.name, img);
  }

  if (shot) {
    document.body.classList.add('shot', `shot-${shot}`);
    applySceneParams(params);
  } else {
    dealPhotos();
  }

  const editor = startEditor({ fullBleed: shot === 'cover' });
  notify();
  editor.paintNow();

  if (shot) {
    // Two animation frames: the second one guarantees the scene is
    // fully painted before the harness takes its picture.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__shotReady = true;
    }));
  }
}

start().catch((err) => {
  console.error(err);
  const el = document.getElementById('noticeLine');
  if (el) el.textContent = 'The studio hit a snag starting up — reload to try again.';
});
