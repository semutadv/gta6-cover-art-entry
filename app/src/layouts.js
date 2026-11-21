// layouts.js — the four cover grids, written as polygon data, plus
// the painted stand-in scene that fills a panel with no photo yet.
//
// A panel is a list of [x, y] points in cover fractions (0..1 on both
// axes). Panels that touch share their edge points exactly, so when
// the renderer strokes every edge with a pale keyline, the strokes sit
// right on top of each other and the poster grid stays crisp.

export const COVER_LAYOUTS = {
  classic: {
    id: 'classic',
    name: 'Classic Cover',
    panels: [
      // The hero runs across the top; its lower edge rises to the
      // right — the slanted seam that gives the genre's grid its push.
      [[0, 0], [1, 0], [1, 0.47], [0.5, 0.53], [0, 0.55]],
      // Middle row, cut on the same diagonal.
      [[0, 0.55], [0.5, 0.53], [0.5, 0.78], [0, 0.79]],
      [[0.5, 0.53], [1, 0.47], [1, 0.77], [0.5, 0.78]],
      // Bottom row.
      [[0, 0.79], [0.5, 0.78], [0.5, 1], [0, 1]],
      [[0.5, 0.78], [1, 0.77], [1, 1], [0.5, 1]],
    ],
  },
  trio: {
    id: 'trio',
    name: 'Trio',
    panels: [
      [[0, 0], [1 / 3, 0], [1 / 3, 1], [0, 1]],
      [[1 / 3, 0], [2 / 3, 0], [2 / 3, 1], [1 / 3, 1]],
      [[2 / 3, 0], [1, 0], [1, 1], [2 / 3, 1]],
    ],
  },
  duo: {
    id: 'duo',
    name: 'Duo Split',
    panels: [
      // Two panels with one long diagonal cut between them.
      [[0, 0], [0.6, 0], [0.4, 1], [0, 1]],
      [[0.6, 0], [1, 0], [1, 1], [0.4, 1]],
    ],
  },
  solo: {
    id: 'solo',
    name: 'Solo Poster',
    panels: [
      [[0, 0], [1, 0], [1, 1], [0, 1]],
    ],
  },
};

export function findLayout(id) {
  return COVER_LAYOUTS[id] || COVER_LAYOUTS.classic;
}

// The axis-aligned box a polygon sits inside, still in cover fractions.
export function polygonBox(points) {
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

// Even-odd ray casting: does this cover-fraction point fall inside
// the polygon? The editor leans on it to turn canvas clicks into
// panel picks.
export function pointInside(px, py, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    const crosses = (yi > py) !== (yj > py)
      && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

// --- The stand-in scene ----------------------------------------------------
//
// A panel with no photo is never a hole in the cover. It gets a small
// painted Vice scene instead — sunset sky, a low sun, a dark shore,
// palm silhouettes — all drawn in code and shifted a little per panel,
// so even a cover built from nothing but stand-ins looks finished.

// A tiny deterministic generator (an LCG), so the stand-in's stars sit
// in the same spots on every render and every screenshot run.
function makeSeeded(seed) {
  let s = (seed * 2654435761) % 4294967296;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function paintPalm(ctx, baseX, baseY, height, lean, colour) {
  const crownX = baseX + lean * height;
  const crownY = baseY - height;
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineCap = 'round';
  // Trunk: a single curved stroke rising to the crown, leaning as it climbs.
  ctx.lineWidth = Math.max(2, height * 0.05);
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(baseX + lean * height * 0.35, baseY - height * 0.55, crownX, crownY);
  ctx.stroke();
  // Fronds: seven arcs fanning out of the crown, drooping at the tips.
  ctx.lineWidth = Math.max(1.5, height * 0.024);
  for (let i = 0; i < 7; i++) {
    const angle = Math.PI * (0.06 + (i / 6) * 0.88);
    const reach = height * (0.32 + (i % 2) * 0.09);
    const tipX = crownX + Math.cos(angle) * reach * (angle < Math.PI / 2 ? -1 : 1);
    const tipY = crownY + Math.sin(angle) * reach * 0.5 + height * 0.12;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(crownX + (tipX - crownX) * 0.5, crownY - height * 0.14, tipX, tipY);
    ctx.stroke();
  }
  // Two coconuts tucked under the crown.
  ctx.beginPath();
  ctx.arc(crownX - height * 0.032, crownY + height * 0.028, height * 0.03, 0, Math.PI * 2);
  ctx.arc(crownX + height * 0.034, crownY + height * 0.042, height * 0.025, 0, Math.PI * 2);
  ctx.fill();
}

export function paintPlaceholder(ctx, x, y, w, h, variant = 0) {
  const rand = makeSeeded(variant + 11);
  // Sky first: indigo up top, melting through violet and magenta into
  // amber right where the horizon sits, a little past halfway down.
  const horizon = y + h * 0.62;
  const sky = ctx.createLinearGradient(0, y, 0, horizon);
  sky.addColorStop(0, '#241150');
  sky.addColorStop(0.36, '#7e2d90');
  sky.addColorStop(0.66, '#e2528e');
  sky.addColorStop(0.88, '#ff8e44');
  sky.addColorStop(1, '#ffc860');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);

  // The first stars, pricked into the indigo band.
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 16; i++) {
    ctx.globalAlpha = 0.22 + rand() * 0.58;
    ctx.beginPath();
    ctx.arc(x + rand() * w, y + rand() * h * 0.28, 0.6 + rand() * 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // The sun, resting on the horizon: bright heart, pink rim, warm glow.
  const sunR = Math.min(w, h) * 0.22;
  const sunX = x + w * (0.5 + (variant % 3 - 1) * 0.13);
  ctx.save();
  ctx.shadowColor = 'rgba(255,150,80,0.85)';
  ctx.shadowBlur = sunR * 0.65;
  const sun = ctx.createRadialGradient(sunX, horizon, sunR * 0.08, sunX, horizon, sunR);
  sun.addColorStop(0, '#fff4b2');
  sun.addColorStop(0.55, '#ffb548');
  sun.addColorStop(1, '#ff608c');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(sunX, horizon, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // The shoreline: a dark, gently uneven silhouette across the bottom.
  ctx.fillStyle = '#190b32';
  ctx.beginPath();
  ctx.moveTo(x, horizon + h * 0.02);
  ctx.quadraticCurveTo(x + w * 0.32, horizon - h * 0.012, x + w * 0.56, horizon + h * 0.028);
  ctx.quadraticCurveTo(x + w * 0.8, horizon + h * 0.055, x + w, horizon + h * 0.022);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();

  // Two palms anchor the scene: a tall one, then a shorter companion.
  const tall = h * 0.5;
  paintPalm(ctx, x + w * 0.22, y + h * 0.99, tall, 0.15, '#130720');
  paintPalm(ctx, x + w * 0.84, y + h * 0.99, tall * 0.64, -0.18, '#130720');
}
