// state.js — the single source of truth for the cover being edited.
//
// Everything the renderer needs lives in one plain object: the active
// layout, the loaded photos, what sits in each panel (photo, pan, zoom,
// fit mode, optional grade override), the lettering, and the export size.
// Mutations go through update(), which notifies subscribers once so the
// editor controls and the preview never drift apart.

export const LAYOUT_IDS = ['classic', 'trio', 'duo', 'solo'];
export const GRADE_IDS = ['vice', 'neon', 'golden', 'noir', 'original'];

export const EXPORT_SIZES = {
  post: { id: 'post', label: 'Post · 1080 × 1080', w: 1080, h: 1080 },
  portrait: { id: 'portrait', label: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  landscape: { id: 'landscape', label: 'Landscape · 1920 × 1080', w: 1920, h: 1080 },
  story: { id: 'story', label: 'Story · 1080 × 1920', w: 1080, h: 1920 },
};

export const MAX_PHOTOS = 6;
export const PANEL_SLOTS = 5; // the Classic layout has the most panels

// Per-slot framing, so when one photo fills several panels each crop still
// looks like its own shot instead of a copy-paste.
const SLOT_FRAMING = [
  { x: 0, y: 0, zoom: 1 },
  { x: -0.35, y: 0.1, zoom: 1.2 },
  { x: 0.4, y: -0.05, zoom: 1.3 },
  { x: 0.15, y: 0.25, zoom: 1.12 },
  { x: -0.25, y: -0.2, zoom: 1.45 },
];

export function blankPanel(slot) {
  const f = SLOT_FRAMING[slot % SLOT_FRAMING.length];
  // Pan x/y run from -1 to 1: 0 centres the photo, the extremes push it
  // fully to one side of the overflow the crop creates.
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
  photos: [], // { id, name, img } — img is a loaded HTMLImageElement
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

// Run a mutation, then notify subscribers exactly once.
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

// Which loaded photo (by index) goes into each panel of a layout, so the
// app — and the screenshot scenes — open on a composed cover, never on
// empty panels.
const PHOTO_PLAN = {
  classic: [0, 1, 0, 1, 0],
  trio: [0, 1, 0],
  duo: [1, 0],
  solo: [0],
};

export function planFor(layoutId) {
  return PHOTO_PLAN[layoutId] || PHOTO_PLAN.classic;
}

// Fill the current layout's panels from the loaded photos, resetting each
// panel's framing to its slot default.
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
