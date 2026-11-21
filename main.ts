// Vice Cover Studio — the make.fun entry program (Node 22, standard
// library only, no dependencies).
//
// The entry itself is the static site in app/: open app/index.html in a
// desktop browser and the studio runs entirely offline, turning photos
// into multi-panel cover art. This program is the hand-in. It copies
// app/ and screenshots/ into the output directory and writes a
// dossier.json there, built by the vendored buildDossier and capped
// exactly as the gta6-cover-art-01 gate demands.
//
// Local check:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const destDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate caps the gta6-cover-art-01 scorer enforces on the hand-in.
const GATE_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function copyTree(from, to) {
  cpSync(join(repoRoot, from), join(destDir, to), { recursive: true });
}

function copyShots() {
  mkdirSync(join(destDir, 'screenshots'), { recursive: true });
  if (existsSync(join(repoRoot, 'screenshots'))) {
    copyTree('screenshots', 'screenshots');
  }
}

function handIn() {
  mkdirSync(destDir, { recursive: true });
  copyTree('app', 'app');
  copyShots();
  const record = buildDossier(destDir, GATE_CAPS);
  writeFileSync(join(destDir, 'dossier.json'), record);
  console.log(`Vice Cover Studio handed in: ${join(destDir, 'dossier.json')}`);
}

handIn();
