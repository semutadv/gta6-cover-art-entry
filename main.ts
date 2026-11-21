// Vice Cover Studio — the entry program.
// Copies app/ and screenshots/ from beside this file into the output
// directory (MAKEFUN_OUTPUT_DIR, or /output), then writes dossier.json there
// with buildDossier from ./vendor/makefun-app.ts, using the competition's
// caps. Run: MAKEFUN_OUTPUT_DIR=out node main.ts
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = dirname(fileURLToPath(import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Keep the output directory exactly the entry: wipe it first so a stale
// screenshot or app file from an earlier run can never leak into the dossier.
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

for (const name of ['app', 'screenshots']) {
  const src = join(here, name);
  if (existsSync(src)) cpSync(src, join(out, name), { recursive: true });
}

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});

writeFileSync(join(out, 'dossier.json'), dossier);
console.log(`dossier written: ${join(out, 'dossier.json')} (${dossier.length} bytes)`);
