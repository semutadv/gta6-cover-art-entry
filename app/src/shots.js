// Vice Cover Studio — deterministic screenshot scenes.
// main.js calls stageShot() when the page loads with ?shot=... in the URL.
// A cover shot renders only the finished cover (no editor chrome); an editor
// shot shows the full editor with photos loaded and a panel selected. Every
// scene stages from the built-in samples only, so the same URL always makes
// the same picture, and sets window.__shotReady when the paint is done.

import { update, updatePanel, selectPanel, sizeOf } from './state.js';
import { applyPreset, presetById } from './presets.js';
import { renderCover } from './render.js';

export function parseShotQuery(search) {
  const q = new URLSearchParams(search);
  return {
    shot: q.get('shot') || null,
    layout: q.get('layout') || 'classic',
    grade: q.get('grade') || 'vice',
    title: q.get('title') || 'VICE COVER',
    caption: q.get('caption') || 'A LEONIDA STORY',
    preset: q.get('preset') || null,
  };
}

// Stage a cover scene on the given canvas: apply the preset/layout/grade,
// fill the panels with the sample photos in order, render at 1080x1080.
export function stageCoverShot(state, canvas, scene) {
  if (scene.preset) {
    const preset = presetById(scene.preset);
    if (preset) applyPreset(state, preset);
  } else {
    update(state, { layout: scene.layout, grade: scene.grade, title: scene.title, caption: scene.caption });
  }
  const n = state.panels.length;
  state.photos.forEach((photo, i) => {
    if (i < n) updatePanel(state, i, { photo: i % state.photos.length, x: 0, y: 0, zoom: 1 });
  });
  // Classic hero gets the boulevard, the rest alternate.
  renderCover(canvas, state, 1080, 1080);
  window.__shotReady = true;
}

// Stage an editor scene: same cover as a cover shot, but leave the editor
// chrome visible and select the hero panel so the UI reads as "at work".
export function stageEditorShot(state, canvas, scene, editor) {
  stageCoverShot(state, canvas, scene);
  selectPanel(state, 0);
  if (editor) {
    editor.syncPanelControls();
    editor.say(`Editing ${scene.layout} layout — ${scene.grade} grade.`);
  }
  window.__shotReady = true;
}
