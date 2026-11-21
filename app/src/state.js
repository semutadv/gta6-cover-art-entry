// state.js — the single source of truth for the cover under edit.
//
// One plain object carries the layout and grade, the loaded pictures,
// the per-panel arrangement (which picture, pan, zoom, fit mode, mirror
// flag, an optional grade of its own), the lettering and the export
// size. Nothing touches it directly: every change goes through mutate(),
// which pings the subscribers exactly once, so the tool rail and the
// canvas preview can never disagree about the cover.

export const LAYOUT_KEYS = ['classic', 'trio', 'duo', 'solo'];
export const GRADE_KEYS = ['vice', 'neon', 'golden', 'noir', 'original'];

// The four export shapes, as a list in menu order.
export const OUTPUT_SIZES = [
  { id: 'post', label: 'Post · 1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  { id: 'landscape', label: 'Landscape · 1920 × 1080', w: 1920, h: 1080 },
  { id: 'story', label: 'Story · 1080 × 1920', w: 1080, h: 1920 },
];

export function outputSizeById(id) {
  return OUTPUT_SIZES.find((s) => s.id === id) || OUTPUT_SIZES[0];
}

export const PHOTO_LIMIT = 6;
export const SLOT_COUNT = 5; // Classic, the widest layout, tops out at five panels

// Every slot opens with its own crop, so when one picture fills several
// panels at once, each crop reads as a different frame of the same
// scene instead of the same frame stamped again and again.
const SLOT_CROPS = [
  { x: 0.05, y: -0.05, zoom: 1.05 },
  { x: -0.3, y: 0.12, zoom: 1.25 },
  { x: 0.35, y: -0.1, zoom: 1.28 },
  { x: 0.12, y: 0.22, zoom: 1.15 },
  { x: -0.28, y: -0.18, zoom: 1.4 },
];

export function freshPanel(slot) {
  const crop = SLOT_CROPS[slot % SLOT_CROPS.length];
  // Pan runs -1..1: 0 centres the picture in the panel, and ±1 spends
  // all the slack the crop leaves on one side.
  return {
    photoId: null,
    x: crop.x,
    y: crop.y,
    zoom: crop.zoom,
    fit: 'fill',
    flip: false,
    gradeId: null,
  };
}

export const state = {
  layoutId: 'classic',
  gradeId: 'vice',
  title: 'VICE COVER',
  caption: 'LEONIDA AFTER DARK',
  letterPos: 'top',
  letterSize: 1,
  letterGradient: true,
  exportSizeId: 'post',
  selectedPanel: 0,
  photos: [], // entries are { id, name, img } with img a loaded HTMLImageElement
  panels: Array.from({ length: SLOT_COUNT }, (_, i) => freshPanel(i)),
};

let nextPhotoId = 1;
const subscribers = new Set();

export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function notify() {
  for (const fn of [...subscribers]) fn(state);
}

// Run a mutation, then tell every subscriber once.
export function mutate(fn) {
  fn(state);
  notify();
}

export function registerPhoto(name, img) {
  if (state.photos.length >= PHOTO_LIMIT) return null;
  const photo = { id: nextPhotoId++, name, img };
  state.photos.push(photo);
  return photo;
}

export function findPhoto(id) {
  return state.photos.find((p) => p.id === id) || null;
}

// Which loaded picture (counted by position) goes in each panel of a
// layout. This is what makes the app — and every screenshot scene —
// open on a composed cover instead of a grid of empty frames.
export function photoDealFor(layoutId) {
  switch (layoutId) {
    case 'trio': return [0, 1, 0];
    case 'duo': return [1, 0];
    case 'solo': return [0];
    case 'classic':
    default: return [0, 1, 0, 1, 0];
  }
}

// Deal the loaded pictures into the current layout's panels, handing
// each panel its slot crop again as we go.
export function dealPhotos() {
  const deal = photoDealFor(state.layoutId);
  state.panels.forEach((panel, i) => {
    Object.assign(panel, freshPanel(i));
    if (i < deal.length && state.photos.length > 0) {
      panel.photoId = state.photos[deal[i] % state.photos.length].id;
    }
  });
  if (state.selectedPanel >= deal.length) state.selectedPanel = 0;
}
