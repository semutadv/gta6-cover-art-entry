# Vice Cover Studio

[![Competition](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/semutadv/gta6-cover-art-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/semutadv/gta6-cover-art-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

A browser app that works fully offline and turns photos plus a caption into poster-style cover art in the spirit of GTA 6: the famous multi-panel grid, Vice City sunset and neon colour grades, heavy condensed lettering, and PNG exports in the post sizes people actually share. Every pixel is painted on local canvas — photos stay on the machine, and the app never makes a network request.

Entry for the make.fun bounty **gta6-cover-art-01** ("Make GTA 6 Cover Art").

## What it does

- **Four layouts a click apart** — Classic Cover (hero panel with the slanted lower edge, two middle panels, two bottom panels), Trio, Duo Split (a single long diagonal), and Solo Poster, all divided by clean pale keylines.
- **Photos framed your way** — bring in up to 6 photos with the file picker or by dragging them onto the window, or start from the two built-in samples. Click a panel, then a thumbnail, to place a photo; drag inside a panel to move it, with zoom, fit/fill, and a mirror flip per panel. Panels left empty get a painted sunset-and-palms scene, so the cover always looks finished.
- **Five colour grades** — Vice Sunset, Neon Nights, Golden Hour, Noir Vice, and Original, set for the whole cover with an optional override per panel: canvas filters, gradient washes, vignette, and fine film grain.
- **Lettering in the genre's voice** — an editable title and caption in heavy condensed capitals with a thick outline, drop shadow, a slight italic lean, and an optional sunset gradient fill, placed at the top or bottom of the cover.
- **Exports that match the preview** — one-click PNG at 1080×1080, 1080×1350, 1920×1080, and 1080×1920 (the layout reflows to the aspect), plus an Export-all button. The preview runs through the same renderer as the export, so what you see is what you share.
- **A finished cover from the first second** — the app opens with the samples already composed into a Classic cover, and a Surprise-me button shuffles photos, layout, and grade when you want a fresh direction. Keyboard: arrows nudge, +/− zoom, F flips, number keys pick a panel.

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
- `app/src/layouts.js` — the four panel layouts as polygon data, plus the painted stand-in art.
- `app/src/grades.js` — the five colour grades (filter + wash + vignette + grain recipes).
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
