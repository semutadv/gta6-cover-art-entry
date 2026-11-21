// Vice Cover Studio — the cover state.
// One plain object holds everything the cover is: which layout, which photos
// sit in which panels, the grade, the lettering and the export size. The
// editor mutates it through `update()` so every change re-renders once and
// every listener hears about it in the same order.

export const LAYOUT_IDS = ['classic', 'trio', 'duo', 'solo'];
export const GRADE_IDS = ['vice', 'neon', 'golden', 'noir', 'original'];
export const SIZE_IDS = ['1080x1080', '1080x1350', '1920x1080', '1080x1920'];

export const SIZE_LABELS = {
  '1080x1080': 'Square post · 1080 × 1080',
  '1080x1350': 'Portrait post · 1080 × 1350',
  '1920x1080': 'Landscape · 1920 × 1080',
  '1080x1920': 'Story · 1080 × 1920',
};

export const PANEL_COUNT = { classic: 5, trio: 3, duo: 2, solo: 1 };

function blankPanel() {
  return {
    photo: null, // index into state.photos, or null for an empty panel
    x: 0, // photo pan, -1..1 (0 = centred)
    y: 0,
    zoom: 1, // 1 = fit the panel exactly, more = closer
    fit: 'fill', // 'fill' crops, 'fit' letterboxes
    grade: null, // null = follow the global grade
  };
}

export function createState() {
  const panels = [];
  for (let i = 0; i < 5; i++) panels.push(blankPanel());
  return {
    layout: 'classic',
    size: '1080x1080',
    grade: 'vice',
    title: 'VICE COVER',
    caption: 'A LEONIDA STORY',
    titlePos: 'top',
    titleSize: 1,
    titleGradient: true,
    panels,
    selected: 0,
    photos: [], // { id, name, src, image }
    listeners: [],
  };
}

export function onChange(state, fn) {
  state.listeners.push(fn);
  return () => {
    const i = state.listeners.indexOf(fn);
    if (i >= 0) state.listeners.splice(i, 1);
  };
}

export function update(state, patch) {
  Object.assign(state, patch);
  for (const fn of state.listeners) fn(state);
}

export function updatePanel(state, index, patch) {
  Object.assign(state.panels[index], patch);
  for (const fn of state.listeners) fn(state);
}

export function selectPanel(state, index) {
  state.selected = index;
  for (const fn of state.listeners) fn(state);
}

export function panelCount(state) {
  return PANEL_COUNT[state.layout] ?? 5;
}

export function activePanels(state) {
  return state.panels.slice(0, panelCount(state));
}

export function sizeOf(state) {
  const [w, h] = state.size.split('x').map(Number);
  return { w, h };
}

export function addPhoto(state, photo) {
  state.photos.push(photo);
  for (const fn of state.listeners) fn(state);
  return state.photos.length - 1;
}

export function resetPanelsForLayout(state) {
  // Keep photos where they fit; clear panels that no longer exist.
  const n = panelCount(state);
  for (let i = n; i < state.panels.length; i++) state.panels[i] = blankPanel();
  if (state.selected >= n) state.selected = 0;
}
