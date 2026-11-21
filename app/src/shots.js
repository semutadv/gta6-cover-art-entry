// Vice Cover Studio — deterministic screenshot scenes.
// main.js calls applyShot with the page's query string: a scene sets the
// layout, grade and lettering, loads the built-in samples into the panels,
// renders once, and raises window.__shotReady. The same four scenes are
// listed in shots.json at the repo root.

import { presetPatch, presetById } from './presets.js';

export const SCENES = [
  { file: '1-cover.jpg', shot: 'cover', layout: 'classic', grade: 'vice', title: 'VICE COVER', w: 1080, h: 1080 },
  { file: '2-editor.jpg', shot: 'editor', layout: 'classic', grade: 'vice', title: 'VICE COVER', w: 1280, h: 720 },
  { file: '3-cover.jpg', shot: 'cover', layout: 'trio', grade: 'neon', title: 'NEON STRIP', w: 1080, h: 1080 },
  { file: '4-editor.jpg', shot: 'editor', layout: 'duo', grade: 'golden', title: 'GOLDEN HOUR', w: 1280, h: 720 },
];

export function sceneFor(file) {
  return SCENES.find((s) => s.file === file) || null;
}

// Build the state patch for a shot URL's parameters. Photos alternate
// between the two built-in samples so every panel shows a real photo
// except the ones a scene leaves deliberately empty.
export function shotPatch(params) {
  const layout = params.get('layout') || 'classic';
  const grade = params.get('grade') || 'vice';
  const title = params.get('title') || 'VICE COVER';
  const caption = params.get('caption') || 'Welcome to Leonida';
  const preset = params.get('preset') ? presetById(params.get('preset')) : null;
  if (preset) return presetPatch(preset);
  const counts = { classic: 5, trio: 3, duo: 2, solo: 1 };
  const n = counts[layout] || 5;
  const samples = ['boulevard', 'pier'];
  return {
    layout,
    grade,
    title,
    caption,
    letterPos: params.get('letterPos') || 'bottom',
    letterGradient: params.get('letterGradient') !== 'off',
    panels: Array.from({ length: n }, (_, i) => ({
      photoId: samples[i % 2],
      shiftX: 0,
      shiftY: 0,
      zoom: 1,
      fit: 'fill',
      flip: false,
      grade: null,
    })),
    selectedPanel: 0,
  };
}

export function markShotReady() {
  window.__shotReady = true;
}
