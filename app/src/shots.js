// shots.js — deterministic screenshot scenes.
//
// The screenshot harness loads the app with ?shot=cover or ?shot=editor
// plus layout / grade / title parameters (see shots.json at the repo
// root). This module turns those parameters into a fixed scene: the
// built-in samples in the planned arrangement, the second panel selected
// in editor scenes — no randomness anywhere, so the same URL always
// paints the same pixels.

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

  // Samples are already loaded by main.js; plan them into the layout.
  assignPlannedPhotos();

  // Editor scenes show a panel mid-edit, the way a user's screen looks.
  const count = state.layoutId === 'solo' ? 1 : 2;
  state.selectedPanel = Math.min(1, count - 1);
}
