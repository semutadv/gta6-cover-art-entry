// shots.js — the deterministic screenshot scenes.
//
// The capture harness opens the app with ?shot=cover or ?shot=editor
// plus layout / grade / title parameters (the scene list lives in
// shots.json at the repo root). This module folds those parameters
// into the state: the built-in samples dealt into the requested
// layout, and — for editor scenes — a panel left selected, the way a
// user's screen looks mid-edit. Nothing here is random, so the same
// URL always paints the same pixels.

import { state, assignPlannedPhotos } from './state.js';

const VALID_LAYOUTS = ['classic', 'trio', 'duo', 'solo'];
const VALID_GRADES = ['vice', 'neon', 'golden', 'noir', 'original'];

export function configureFromParams(params) {
  const layout = params.get('layout');
  if (layout && VALID_LAYOUTS.includes(layout)) state.layoutId = layout;

  const grade = params.get('grade');
  if (grade && VALID_GRADES.includes(grade)) state.gradeId = grade;

  const title = params.get('title');
  if (title !== null) state.title = title;

  const caption = params.get('caption');
  if (caption !== null) state.caption = caption;

  const pos = params.get('letterPos');
  if (pos === 'top' || pos === 'bottom') state.letterPos = pos;

  // main.js has already loaded the samples; deal them into the layout.
  assignPlannedPhotos();

  // Leave the second panel selected (the only panel, for Solo), so an
  // editor screenshot shows the selection outline at work.
  const count = state.layoutId === 'solo' ? 1 : 2;
  state.selectedPanel = Math.min(1, count - 1);
}
