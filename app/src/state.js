// Vice Cover Studio — cover state.
// One plain object holds everything the cover is: which layout, which grade,
// which photo sits in each panel and how it is framed, plus the lettering.
// Every change flows through `update`, which notifies listeners so the
// preview re-renders and the panel controls stay in sync.

export const LAYOUT_IDS = ['classic', 'trio', 'duo', 'solo'];
export const GRADE_IDS = ['vice', 'neon', 'golden', 'noir', 'original'];
export const EXPORT_SIZES = [
  { id: '1080x1080', label: 'Post · 1080 × 1080', w: 1080, h: 1080 },
  { id: '1080x1350', label: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  { id: '1920x1080', label: 'Landscape · 1920 × 1080', w: 1920, h: 1080 },
  { id: '1080x1920', label: 'Story · 1080 × 1920', w: 1080, h: 1920 },
];

export const SAMPLE_PHOTOS = [
  { id: 'boulevard', name: 'Boulevard', src: 'samples/boulevard.jpg' },
  { id: 'pier', name: 'Pier', src: 'samples/pier.jpg' },
];

let photoCounter = 0;

export function makePanel(photoId = null) {
  return {
    photoId,
    shiftX: 0, // fraction of panel width, -1..1
    shiftY: 0, // fraction of panel height, -1..1
    zoom: 1, // 1..3
    fit: 'fill', // 'fill' | 'fit'
    flip: false,
    grade: null, // null = use the cover's global grade
  };
}

export function panelCountFor(layout) {
  if (layout === 'classic') return 5;
  if (layout === 'trio') return 3;
  if (layout === 'duo') return 2;
  return 1; // solo
}

export function freshCover() {
  return {
    layout: 'classic',
    grade: 'vice',
    title: 'VICE COVER',
    caption: 'Welcome to Leonida',
    letterPos: 'bottom', // 'top' | 'bottom'
    letterSize: 1, // 0.6..1.6
    letterGradient: true,
    exportSize: '1080x1080',
    photos: SAMPLE_PHOTOS.map((p) => ({ ...p, image: null, loaded: false })),
    panels: [
      makePanel('boulevard'),
      makePanel('pier'),
      makePanel('boulevard'),
      makePanel('pier'),
      makePanel(null),
    ],
    selectedPanel: 0,
    selectedPhoto: 'boulevard',
  };
}

export function createStore(initial = freshCover()) {
  let state = initial;
  const listeners = new Set();
  return {
    get() {
      return state;
    },
    update(patch) {
      state = { ...state, ...patch };
      listeners.forEach((fn) => fn(state));
    },
    updatePanel(index, patch) {
      const panels = state.panels.map((p, i) => (i === index ? { ...p, ...patch } : p));
      this.update({ panels });
    },
    setLayout(layout) {
      const count = panelCountFor(layout);
      const panels = Array.from({ length: count }, (_, i) => {
        const old = state.panels[i];
        return old ? { ...old } : makePanel(i < 2 ? SAMPLE_PHOTOS[i % 2].id : null);
      });
      this.update({ layout, panels, selectedPanel: 0 });
    },
    addPhoto(file) {
      const id = `upload-${++photoCounter}`;
      const src = URL.createObjectURL(file);
      const photo = { id, name: file.name.replace(/\.[^.]+$/, ''), src, image: null, loaded: false };
      this.update({ photos: [...state.photos, photo], selectedPhoto: id });
      return photo;
    },
    photoById(id) {
      return state.photos.find((p) => p.id === id) || null;
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

export function loadPhotoImage(photo) {
  if (photo.image) return Promise.resolve(photo.image);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      photo.image = img;
      photo.loaded = true;
      resolve(img);
    };
    img.onerror = () => reject(new Error(`could not load ${photo.name}`));
    img.src = photo.src;
  });
}

export function loadAllPhotos(store) {
  return Promise.all(store.get().photos.map((p) => loadPhotoImage(p).catch(() => null)));
}
