# Vice Cover Studio

![MakeFun](https://make.fun/badge/gta6-cover-art-01.svg)
[![Rank](https://make.fun/badge/gta6-cover-art-01/semutadv/gta6-cover-art-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/semutadv/gta6-cover-art-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

An offline web app that turns your photos into cover art in the style of GTA 6's posters: the multi-panel cover grid, a Vice City sunset grade, and bold condensed lettering — exported as a PNG in the sizes social posts actually use. Everything runs locally in the browser; your photos never leave the machine.

## What it does

- **Four layouts, one click:** Classic Cover (hero on top, two mid panels, two at the bottom), Trio (three tall panels), Duo Split (two diagonal-split panels), and Solo Poster (one photo, full bleed). Panels are separated by clean white keylines, with a diagonal slant on the Classic hero.
- **Photos your way:** upload up to 6 photos or drag-and-drop them onto the cover, plus two built-in samples one click away. Click a panel to select it, click a thumbnail to place a photo in it. Drag inside a panel to reposition, zoom with a slider, switch fit/fill, and override the grade per panel. Empty panels show a generated Vice sunset (gradient sky, sun disc, skyline, palms) so the cover always looks complete.
- **Five colour grades:** Vice Sunset, Neon Nights, Golden Hour, Noir Vice, and Original — applied on canvas per panel, with one global choice and per-panel overrides.
- **Lettering in the genre's style:** an editable title and caption in heavy condensed uppercase, white with a thick dark outline, soft shadow, slight italic skew, and an optional sunset gradient fill. Position (top/bottom), size, and gradient are all adjustable, live as you type.
- **Preset Gallery:** twelve one-click recipes — Sunset Boulevard, Neon Avenue, Golden Coast, Midnight Drive, Palm Court, Electric Pier, Vice Royale, Chrome Dawn, Velvet Night, Sugar Rush, Harbour Lights, and Last Call — each restyling layout, grade and lettering without moving your photos.
- **Export:** one-click PNG at 1080×1080, 1080×1350, 1920×1080, or 1080×1920, or all four at once. A "Surprise me" button shuffles layout, grade and photos when you want a fresh start.

## How to run

```sh
node serve.ts
```

Then open http://localhost:8080. No build step, no dependencies, no network requests — the app is plain static files under `app/`.

## File structure

```
app/
  index.html      the editor page
  style.css       dark neon editor styling
  src/
    state.js      the cover state (layout, panels, lettering, size)
    layouts.js    the four panel layouts + the placeholder sunset painter
    grades.js     the five colour grade recipes
    render.js     composes the cover on canvas at any size
    lettering.js  title and caption drawing
    editor.js     UI wiring (uploads, drag, sliders, export, shortcuts)
    shots.js      deterministic screenshot scenes
    presets.js    the twelve Preset Gallery recipes
    main.js       boot: samples, default cover, ?shot= handling
  samples/        two built-in photos (boulevard, pier)
main.ts           copies app/ + screenshots/ to the output dir and writes dossier.json
serve.ts          tiny static server for local use
shots.json        the four screenshot scenes
screenshots/     renders of the app's own code
```

## License

MIT — see LICENSE.
