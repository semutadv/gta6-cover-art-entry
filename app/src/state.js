// state.js — everything about the cover being edited, in one place.
//
// A single plain object holds the chosen layout and grade, the loaded
// photos, the per-panel arrangement (which photo, how it is panned and
// zoomed, fit mode, an optional grade of its own), the lettering and the
// export size. Nothing mutates it bare: changes go through update(),
// which fires the subscribers once, so the sidebar controls and the
// canvas preview can never show two different covers.

export const LAYOUT_IDS = ['classic', 'trio', 'duo', 'solo'];
export const GRADE_IDS = ['vice', 'neon', 'golden', 'noir', 'original'];

export const EXPORT_SIZES = {
  post: { id: 'post', label: 'Post · 1080 × 1080', w: 1080, h: 1080 },
  portrait: { id: 'portrait', label: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  landscape: { id: 'landscape', label: 'Landscape · 1920 × 1080', w: 1920, h: 1080 },
  story: { id: 'story', label: 'Story · 1080 × 1920', w: 1080, h: 1920 },
};

export const MAX_PHOTOS = 6;
export const PANEL_SLOTS = 5; // no layout has more panels than Classic

// Each slot starts with its own framing, so when a single photo fills
// several panels at once, every crop reads as a different shot of the
// same scene rather than the same shot repeated.
const SLOT_FRAMING = [
  { x: 0, y: 0, zoom: 1 },
  { x: -0.35, y: 0.1, zoom: 1.2 },
  { x: 0.4, y: -0.05, zoom: 1.3 },
  { x: 0.15, y: 0.25, zoom: 1.12 },
  { x: -0.25, y: -0.2, zoom: 1.45 },
];

export function blankPanel(slot) {
  const f = SLOT_FRAMING[slot % SLOT_FRAMING.length];
  // Pan is normalised to -1..1: 0 centres the photo in the panel, and
  // ±1 spends all of the slack the crop leaves on one side.
  return { photoId: null, x: f.x, y: f.y, zoom: f.zoom, fit: 'fill', gradeId: null };
}

export const state = {
  layoutId: 'classic',
  gradeId: 'vice',
  title: 'VICE COVER',
  caption: 'SUNSET CITY LIMITS',
  letterPos: 'top',
  letterSize: 1,
  letterGradient: true,
  exportSizeId: 'post',
  selectedPanel: 0,
  photos: [], // entries are { id, name, img } with img a loaded HTMLImageElement
  panels: Array.from({ length: PANEL_SLOTS }, (_, i) => blankPanel(i)),
};

let nextPhotoId = 1;
const listeners = new Set();

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emit() {
  for (const fn of [...listeners]) fn(state);
}

// Apply a mutation, then tell everyone about it exactly once.
export function update(fn) {
  fn(state);
  emit();
}

export function addPhoto(name, img) {
  if (state.photos.length >= MAX_PHOTOS) return null;
  const photo = { id: nextPhotoId++, name, img };
  state.photos.push(photo);
  return photo;
}

export function photoById(id) {
  return state.photos.find((p) => p.id === id) || null;
}

// Which loaded photo (counted by index) belongs in each panel of a
// layout. This is what makes the app — and every screenshot scene —
// open on a composed cover instead of a grid of empty frames.
const PHOTO_PLAN = {
  classic: [0, 1, 0, 1, 0],
  trio: [0, 1, 0],
  duo: [1, 0],
  solo: [0],
};

export function planFor(layoutId) {
  return PHOTO_PLAN[layoutId] || PHOTO_PLAN.classic;
}

// Deal the loaded photos into the current layout's panels, resetting
// each panel's framing back to its slot default as we go.
export function assignPlannedPhotos() {
  const plan = planFor(state.layoutId);
  state.panels.forEach((panel, i) => {
    Object.assign(panel, blankPanel(i));
    if (i < plan.length && state.photos.length > 0) {
      panel.photoId = state.photos[plan[i] % state.photos.length].id;
    }
  });
  if (state.selectedPanel >= plan.length) state.selectedPanel = 0;
}
