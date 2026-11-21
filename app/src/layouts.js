// layouts.js — the four cover layouts as polygon data, plus the painted
// placeholder that fills any panel left without a photo.
//
// A panel is a polygon in cover fractions (0..1 on both axes). Panels in a
// layout share their edges exactly, so the white keylines the renderer
// strokes along every edge line up into the clean grid of the poster
// covers this app imitates.

export const LAYOUTS = {
  classic: {
    id: 'classic',
    name: 'Classic Cover',
    panels: [
      // Hero across the top; its bottom edge slants up to the right, the
      // signature diagonal of the genre's poster grid.
      [[0, 0], [1, 0], [1, 0.475], [0.5, 0.525], [0, 0.56]],
      // Middle row.
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
      // Two panels split by one long diagonal.
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

// Axis-aligned bounds of a polygon, in cover fractions.
export function panelBounds(points) {
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

// Even-odd ray cast, for turning canvas clicks into panel picks.
export function pointInPolygon(px, py, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// --- The placeholder -------------------------------------------------------
//
// A panel with no photo is never left blank: it gets a small painted Vice
// scene — a sunset gradient, a low sun disc, a dark shoreline and palm
// silhouettes — drawn entirely in code, tinted per panel so a cover built
// from placeholders alone still reads as finished art.

// Deterministic little RNG (LCG) so the placeholder stars never flicker
// between renders or between screenshot runs.
function seededRandom(seed) {
  let s = (seed * 2654435761) % 4294967296;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function drawPalm(ctx, baseX, baseY, height, lean, colour) {
  const topX = baseX + lean * height;
  const topY = baseY - height;
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineCap = 'round';
  // Trunk: a gentle curve leaning toward the top point.
  ctx.lineWidth = Math.max(2, height * 0.045);
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(baseX + lean * height * 0.3, baseY - height * 0.6, topX, topY);
  ctx.stroke();
  // Fronds: six arcs drooping out of the crown.
  ctx.lineWidth = Math.max(1.5, height * 0.022);
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI * (0.08 + (i / 5) * 0.84); // fan across the top
    const reach = height * (0.34 + (i % 2) * 0.08);
    const endX = topX + Math.cos(angle) * reach * (angle < Math.PI / 2 ? 1 : -1) * -1;
    const endY = topY + Math.sin(angle) * reach * 0.55 + height * 0.1;
    const midX = topX + (endX - topX) * 0.5;
    const midY = topY - height * 0.16;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(midX, midY, endX, endY);
    ctx.stroke();
  }
  // Coconuts.
  ctx.beginPath();
  ctx.arc(topX - height * 0.03, topY + height * 0.03, height * 0.028, 0, Math.PI * 2);
  ctx.arc(topX + height * 0.035, topY + height * 0.045, height * 0.024, 0, Math.PI * 2);
  ctx.fill();
}

export function drawPlaceholder(ctx, x, y, w, h, variant = 0) {
  const rand = seededRandom(variant + 7);
  // Sky: indigo at the top melting through magenta and orange to gold at
  // the horizon, a little past halfway down.
  const horizon = y + h * 0.64;
  const sky = ctx.createLinearGradient(0, y, 0, horizon);
  sky.addColorStop(0, '#22104d');
  sky.addColorStop(0.38, '#7c2d8e');
  sky.addColorStop(0.68, '#e0508c');
  sky.addColorStop(0.9, '#ff8c42');
  sky.addColorStop(1, '#ffc65e');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);

  // Early stars in the indigo band.
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 14; i++) {
    const sx = x + rand() * w;
    const sy = y + rand() * h * 0.3;
    const r = 0.6 + rand() * 1.1;
    ctx.globalAlpha = 0.25 + rand() * 0.55;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Sun disc sitting on the horizon, gold core to pink rim, with a glow.
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

  // Shoreline silhouette across the bottom.
  ctx.fillStyle = '#180a30';
  ctx.beginPath();
  ctx.moveTo(x, horizon + h * 0.02);
  ctx.quadraticCurveTo(x + w * 0.3, horizon - h * 0.015, x + w * 0.55, horizon + h * 0.03);
  ctx.quadraticCurveTo(x + w * 0.8, horizon + h * 0.06, x + w, horizon + h * 0.025);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();

  // Palms: one tall at a golden-ratio point, one shorter companion.
  const tall = h * 0.52;
  drawPalm(ctx, x + w * 0.24, y + h * 0.99, tall, 0.16, '#12061f');
  drawPalm(ctx, x + w * 0.82, y + h * 0.99, tall * 0.62, -0.2, '#12061f');
}
