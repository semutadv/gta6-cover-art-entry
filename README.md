# Vice Cover Studio

[![Competition](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/semutadv/gta6-cover-art-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/semutadv/gta6-cover-art-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

An offline browser app that turns your photos and a caption into cover art in the style of GTA 6's posters: the iconic multi-panel grid, Vice City sunset and neon colour grades, heavy condensed lettering, exported as a PNG in the common post sizes. Everything is local canvas work — your photos never leave the machine, and the app makes no network requests at all.

Entry for the make.fun bounty **gta6-cover-art-01** ("Make GTA 6 Cover Art").

## Features

- **Four layouts, one click apart** — Classic Cover (hero panel with the slanted bottom edge, two mid panels, two bottom panels), Trio, Duo Split (one long diagonal), and Solo Poster, all separated by clean white keylines.
- **Your photos, framed your way** — upload up to 6 photos by file picker or drag-and-drop, or start from the two built-in samples. Click a panel, click a thumbnail to place it; drag inside a panel to reposition, with zoom and fit/fill per panel. Empty panels are filled with a painted sunset-and-palms placeholder, so the cover always looks complete.
- **Five colour grades** — Vice Sunset, Neon Nights, Golden Hour, Noir Vice, and Original, applied per panel with an optional per-panel override: canvas filters, gradient overlays, vignette, and fine film grain.
- **Genre lettering** — an editable title and caption in heavy condensed capitals with a thick outline, drop shadow, slight italic skew, and an optional sunset gradient fill, at the top or bottom of the cover.
- **Exports that match the preview** — one-click PNG at 1080×1080, 1080×1350, 1920×1080, and 1080×1920 (the layout reflows to the aspect), plus an Export-all button. The preview uses the same renderer as the export, so what you see is what you share.
- **Fast from the first second** — the app opens with the samples already composed into a finished Classic cover, and a Surprise-me button shuffles photos, layout, and grade when you want a new direction. Keyboard: arrows nudge, +/− zoom, number keys select a panel.

## Run

```sh
node serve.ts
# then open http://localhost:8080
```

No build step, no dependencies — plain static files and vanilla JavaScript ES modules.

## File structure

- `app/index.html` — the editor page (canvas + controls), no external references.
- `app/style.css` — the dark neon editor styling.
- `app/src/state.js` — the cover state and change notification.
- `app/src/layouts.js` — the four panel layouts as polygon data, plus the painted placeholder art.
- `app/src/grades.js` — the five colour grades (filter + overlay + vignette + grain recipes).
- `app/src/render.js` — composes the cover at any size: panels, photos, grades, keylines, lettering.
- `app/src/lettering.js` — the title/caption drawing.
- `app/src/editor.js` — UI wiring: uploads, drag-and-drop, selection, drag-to-move, export, shortcuts.
- `app/src/shots.js` — the deterministic screenshot scenes used for `screenshots/`.
- `app/src/main.js` — boot: samples in, default cover up, editor wired, `?shot=` handling.
- `app/samples/` — the two built-in sample photos, made for make.fun.
- `main.ts` — the entry program: copies `app/` and `screenshots/` to the output directory and writes `dossier.json` via `vendor/makefun-app.ts`.
- `serve.ts` — a tiny local static server for trying the app.
- `shots.json` — the screenshot scene list; `screenshots/` holds the captures.

## License

MIT — see `LICENSE`.
