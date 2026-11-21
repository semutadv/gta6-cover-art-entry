// Vice Cover Studio — the Preset Gallery.
// Twelve one-click recipes. A preset sets the layout, the grade, the
// lettering and its position — the photos already in the panels stay put, so
// a preset restyles a cover without losing the work. The gallery lives in
// the editor sidebar; picking a card applies it instantly.

export const PRESETS = [
  {
    id: 'sunset-boulevard',
    name: 'Sunset Boulevard',
    blurb: 'Classic grid, Vice Sunset, big top title.',
    layout: 'classic', grade: 'vice',
    title: 'VICE COVER', caption: 'A LEONIDA STORY',
    titlePos: 'top', titleGradient: true, titleSize: 1,
  },
  {
    id: 'neon-avenue',
    name: 'Neon Avenue',
    blurb: 'Trio panels under Neon Nights.',
    layout: 'trio', grade: 'neon',
    title: 'NEON VICE', caption: 'AFTER DARK IN LEONIDA',
    titlePos: 'bottom', titleGradient: true, titleSize: 1,
  },
  {
    id: 'golden-coast',
    name: 'Golden Coast',
    blurb: 'Duo split, warm Golden Hour glow.',
    layout: 'duo', grade: 'golden',
    title: 'GOLDEN COAST', caption: 'WHERE THE SUN NEVER SETS',
    titlePos: 'top', titleGradient: false, titleSize: 0.9,
  },
  {
    id: 'midnight-drive',
    name: 'Midnight Drive',
    blurb: 'Solo poster, Noir Vice, stark and quiet.',
    layout: 'solo', grade: 'noir',
    title: 'MIDNIGHT DRIVE', caption: 'NO LIGHTS. NO BRAKES.',
    titlePos: 'bottom', titleGradient: false, titleSize: 1.1,
  },
  {
    id: 'palm-court',
    name: 'Palm Court',
    blurb: 'Classic grid, Golden Hour, caption up top.',
    layout: 'classic', grade: 'golden',
    title: 'PALM COURT', caption: 'SUMMER THAT NEVER ENDS',
    titlePos: 'top', titleGradient: true, titleSize: 0.95,
  },
  {
    id: 'electric-pier',
    name: 'Electric Pier',
    blurb: 'Trio panels, Neon Nights, title at the bottom.',
    layout: 'trio', grade: 'neon',
    title: 'ELECTRIC PIER', caption: 'THE BOARDWALK HUMS',
    titlePos: 'bottom', titleGradient: true, titleSize: 1,
  },
  {
    id: 'vice-royale',
    name: 'Vice Royale',
    blurb: 'Solo poster, Vice Sunset, oversized title.',
    layout: 'solo', grade: 'vice',
    title: 'VICE ROYALE', caption: 'KING OF THE BOULEVARD',
    titlePos: 'top', titleGradient: true, titleSize: 1.25,
  },
  {
    id: 'chrome-dawn',
    name: 'Chrome Dawn',
    blurb: 'Duo split, Original grade, clean and plain.',
    layout: 'duo', grade: 'original',
    title: 'CHROME DAWN', caption: 'FIRST LIGHT ON THE BAY',
    titlePos: 'bottom', titleGradient: false, titleSize: 0.9,
  },
  {
    id: 'velvet-night',
    name: 'Velvet Night',
    blurb: 'Classic grid, Noir Vice, moody contrast.',
    layout: 'classic', grade: 'noir',
    title: 'VELVET NIGHT', caption: 'EVERY SHADOW HAS A PRICE',
    titlePos: 'top', titleGradient: false, titleSize: 1,
  },
  {
    id: 'sugar-rush',
    name: 'Sugar Rush',
    blurb: 'Trio panels, Vice Sunset, playful caption.',
    layout: 'trio', grade: 'vice',
    title: 'SUGAR RUSH', caption: 'SWEET, LOUD AND FAST',
    titlePos: 'top', titleGradient: true, titleSize: 1.05,
  },
  {
    id: 'harbour-lights',
    name: 'Harbour Lights',
    blurb: 'Duo split, Neon Nights, title low.',
    layout: 'duo', grade: 'neon',
    title: 'HARBOUR LIGHTS', caption: 'THE WATER REMEMBERS',
    titlePos: 'bottom', titleGradient: true, titleSize: 1,
  },
  {
    id: 'last-call',
    name: 'Last Call',
    blurb: 'Solo poster, Golden Hour, small quiet title.',
    layout: 'solo', grade: 'golden',
    title: 'LAST CALL', caption: 'ONE MORE FOR THE ROAD',
    titlePos: 'bottom', titleGradient: true, titleSize: 0.85,
  },
];

export function presetById(id) {
  return PRESETS.find((p) => p.id === id) ?? null;
}

// Apply a preset to the state object in place and return it.
export function applyPreset(state, preset) {
  state.layout = preset.layout;
  state.grade = preset.grade;
  state.title = preset.title;
  state.caption = preset.caption;
  state.titlePos = preset.titlePos;
  state.titleGradient = preset.gradient;
  state.titleSize = preset.titleSize;
  return state;
}
