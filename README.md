# Vice Cover Studio

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/semutadv/gta6-cover-art-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/semutadv/gta6-cover-art-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Vice Cover Studio turns your own photos into cover art in the spirit of the
GTA 6 posters: a multi-panel grid, a Vice City sunset grade, and heavy
condensed lettering — composed on a canvas and exported as a PNG. Everything
runs locally in the browser; your photos never leave your machine.

## What it does

- **Four poster layouts** — Classic Cover (hero panel over two rows), Trio
  (three vertical frames), Duo Split (two panels cut on a diagonal) and Solo
  Poster (one full-bleed photo), each with clean white keylines.
- **Preset gallery** — twelve ready-made cover recipes (Sunset Boulevard,
  Neon Strip, Golden Getaway…) that load a whole cover in one click, ready
  to tweak.
- **Photos** — upload up to six of your own (file picker or drag-and-drop),
  or use the two built-in samples. Click a panel, click a photo to place it;
  drag the photo to reposition, zoom with the slider, flip it, or switch
  between fill and fit. Empty panels paint a coded Vice sunset with palms.
- **Colour grades** — Vice Sunset, Neon Nights, Golden Hour, Noir Vice and
  Original, applied globally or overridden per panel, with vignette and film
  grain on top.
- **Lettering** — an editable title and caption in heavy condensed uppercase
  with a thick dark outline, drop shadow and optional sunset gradient fill;
  top or bottom placement and a size slider.
- **Export** — one click to PNG at 1080×1080, 1080×1350, 1920×1080 or
  1080×1920, or export all four sizes at once.
- **Surprise me** — shuffles layout, grade, photos and words into a fresh
  cover instantly. Keyboard: arrows nudge the photo, +/− zooms.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. No build step, no network requests, no
libraries — plain static files under `app/` with vanilla ES modules.

## File structure

- `app/index.html` — the editor page
- `app/style.css` — dark neon editor styling
- `app/src/state.js` — cover state and change events
- `app/src/layouts.js` — panel layouts and the placeholder painter
- `app/src/grades.js` — colour grade recipes
- `app/src/presets.js` — the preset gallery recipes
- `app/src/lettering.js` — title and caption drawing
- `app/src/render.js` — the cover composer
- `app/src/editor.js` — UI wiring
- `app/src/shots.js` — deterministic screenshot scenes
- `app/src/main.js` — boot and screenshot mode
- `main.ts` — builds the entry dossier from `app/` and `screenshots/`
- `serve.ts` — tiny static server for local use

No Rockstar Games logo, artwork or fonts are used. MIT licensed.
