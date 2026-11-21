// Vice Cover Studio — boot.
// Loads the two built-in sample photos, builds the default Classic cover so
// the app opens finished-looking with zero clicks, wires the editor, and
// handles ?shot= scenes for screenshots. Everything is local: no network
// request is ever made.

import { createState, onChange, updatePanel, panelCount, sizeOf } from './state.js';
import { renderCover } from './render.js';
import { wireEditor } from './editor.js';
import { parseShotQuery, stageCoverShot, stageEditorShot } from './shots.js';

const SAMPLES = [
  { id: 'boulevard', name: 'Boulevard', src: 'samples/boulevard.jpg' },
  { id: 'pier', name: 'Pier', src: 'samples/pier.jpg' },
];

const canvas = document.getElementById('cover');
const state = createState();
window.__viceState = state;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadSamples() {
  for (const sample of SAMPLES) {
    try {
      const image = await loadImage(sample.src);
      state.photos.push({ ...sample, image });
    } catch {
      // A missing sample just leaves its panel on the placeholder art.
    }
  }
}

function seedDefaultCover() {
  // Boulevard in the hero, pier in the mids, alternating below.
  const order = [0, 1, 0, 1, 0];
  const n = panelCount(state);
  for (let i = 0; i < n; i++) {
    updatePanel(state, i, { photo: state.photos[order[i]] ? order[i] : null, x: 0, y: 0, zoom: 1 });
  }
}

function rerender() {
  const { w, h } = sizeOf(state);
  // Preview at a fixed 720px wide so the page stays light; the cover itself
  // is resolution-independent and exports at the chosen size.
  const previewW = 720;
  const previewH = Math.round((previewW * h) / w);
  renderCover(canvas, state, previewW, previewH);
}

async function boot() {
  await loadSamples();
  const scene = parseShotQuery(window.location.search);
  const editor = wireEditor(state, canvas, rerender);
  onChange(state, rerender);
  seedDefaultCover();
  rerender();

  if (scene.shot === 'cover') {
    stageCoverShot(state, canvas, scene);
  } else if (scene.shot === 'editor') {
    stageEditorShot(state, canvas, scene, editor);
  } else {
    window.__shotReady = true;
  }
}

boot();
