// layouts.js — the four cover layouts, expressed as polygon data, and
// the painted placeholder scene that stands in for a missing photo.
//
// A panel is a list of [x, y] points in cover fractions (0..1 on both
// axes). Neighbouring panels share their edges point for point, so when
// the renderer strokes every edge with a white keyline, the strokes
// land exactly on top of each other and the poster grid stays clean.

export const LAYOUTS = {
  classic: {
    id: 'classic',
    name: 'Classic Cover',
    panels: [
      // The hero spans the top; its lower edge climbs to the right —
      // the slanted seam that gives the genre's poster grid its energy.
      [[0, 0], [1, 0], [1, 0.475], [0.5, 0.525], [0, 0.56]],
      // Middle row, split on the same diagonal.
      [[0, 0.56], [0.5, 0.525], [0.5, 0.79], [0, 0.8]],
      [[0.5, 0.525], [1, 0.475], [1, 0.78], [0.5, 0.79]],
      // Bottom row.
      [[0, 0.8], [0.5, 0.79], [0.5, 1], [0, 1]],
      [[0.5, 0.79], [1, 0.78], [1, 1], [0.5, 1]],
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
      // Two panels, one long diagonal cut between them.
      [[0, 0], [0.58, 0], [0.42, 1], [0, 1]],
      [[0.58, 0], [1, 0], [1, 1], [0.42, 1]],
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

export function layoutById(id) {
  return LAYOUTS[id] || LAYOUTS.classic;
}

// The axis-aligned box a polygon fits inside, still in cover fractions.
export function panelBounds(points) {
  const b = { x: 1, y: 1, w: 0, h: 0 };
  let maxX = 0;
  let maxY = 0;
  for (const [x, y] of points) {
    b.x = Math.min(b.x, x);
    b.y = Math.min(b.y, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  b.w = maxX - b.x;
  b.h = maxY - b.y;
  return b;
}

// Even-odd ray casting: is this cover-fraction point inside the panel?
// The editor uses it to turn canvas clicks into panel selections.
export function pointInPolygon(px, py, points) {
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

// --- The placeholder -----------------------------------------------------
//
// An empty panel is never a hole in the cover. It gets a little painted
// Vice scene instead — sunset sky, a low sun, a dark shoreline, palm
// silhouettes — all drawn in code and shifted slightly per panel, so
// even a cover made of nothing but placeholders looks finished.

// A tiny deterministic RNG (an LCG), so the placeholder's stars land in
// the same places on every render and every screenshot run.
function seededRandom(seed) {
  let s = (seed * 2654435761) % 4294967296;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function drawPalm(ctx, baseX, baseY, height, lean, colour) {
  const crownX = baseX + lean * height;
  const crownY = baseY - height;
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineCap = 'round';
  // Trunk: one curved stroke rising to the crown, leaning as it goes.
  ctx.lineWidth = Math.max(2, height * 0.045);
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(baseX + lean * height * 0.3, baseY - height * 0.6, crownX, crownY);
  ctx.stroke();
  // Fronds: six arcs fanning out of the crown and drooping at the tips.
  ctx.lineWidth = Math.max(1.5, height * 0.022);
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI * (0.08 + (i / 5) * 0.84);
    const reach = height * (0.34 + (i % 2) * 0.08);
    const endX = crownX + Math.cos(angle) * reach * (angle < Math.PI / 2 ? 1 : -1) * -1;
    const endY = crownY + Math.sin(angle) * reach * 0.55 + height * 0.1;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(crownX + (endX - crownX) * 0.5, crownY - height * 0.16, endX, endY);
    ctx.stroke();
  }
  // A pair of coconuts tucked under the crown.
  ctx.beginPath();
  ctx.arc(crownX - height * 0.03, crownY + height * 0.03, height * 0.028, 0, Math.PI * 2);
  ctx.arc(crownX + height * 0.035, crownY + height * 0.045, height * 0.024, 0, Math.PI * 2);
  ctx.fill();
}

export function drawPlaceholder(ctx, x, y, w, h, variant = 0) {
  const rand = seededRandom(variant + 7);
  // Sky first: indigo up top, melting through magenta and orange into
  // gold right where the horizon sits, a little past halfway down.
  const horizon = y + h * 0.64;
  const sky = ctx.createLinearGradient(0, y, 0, horizon);
  sky.addColorStop(0, '#22104d');
  sky.addColorStop(0.38, '#7c2d8e');
  sky.addColorStop(0.68, '#e0508c');
  sky.addColorStop(0.9, '#ff8c42');
  sky.addColorStop(1, '#ffc65e');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);

  // The first stars, pricked into the indigo band.
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 14; i++) {
    ctx.globalAlpha = 0.25 + rand() * 0.55;
    ctx.beginPath();
    ctx.arc(x + rand() * w, y + rand() * h * 0.3, 0.6 + rand() * 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // The sun, resting on the horizon: gold heart, pink rim, soft glow.
  const sunR = Math.min(w, h) * 0.21;
  const sunX = x + w * (0.5 + (variant % 3 - 1) * 0.14);
  ctx.save();
  ctx.shadowColor = 'rgba(255,150,80,0.85)';
  ctx.shadowBlur = sunR * 0.7;
  const sun = ctx.createRadialGradient(sunX, horizon, sunR * 0.1, sunX, horizon, sunR);
  sun.addColorStop(0, '#fff3b0');
  sun.addColorStop(0.55, '#ffb347');
  sun.addColorStop(1, '#ff5e8a');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(sunX, horizon, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // The shoreline: a dark, gently uneven silhouette across the bottom.
  ctx.fillStyle = '#180a30';
  ctx.beginPath();
  ctx.moveTo(x, horizon + h * 0.02);
  ctx.quadraticCurveTo(x + w * 0.3, horizon - h * 0.015, x + w * 0.55, horizon + h * 0.03);
  ctx.quadraticCurveTo(x + w * 0.8, horizon + h * 0.06, x + w, horizon + h * 0.025);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();

  // Two palms anchor the scene: a tall one, then a shorter companion.
  const tall = h * 0.52;
  drawPalm(ctx, x + w * 0.24, y + h * 0.99, tall, 0.16, '#12061f');
  drawPalm(ctx, x + w * 0.82, y + h * 0.99, tall * 0.62, -0.2, '#12061f');
}
