// Vice Cover Studio — panel layouts and the placeholder painter.
// A layout is a function of the cover size: it returns one rect per panel,
// each rect a polygon so a panel can have a slanted edge. The classic
// poster's hero panel slants; the duo split is cut on a diagonal.

export function layoutPanels(layout, w, h) {
  if (layout === 'trio') {
    const cw = w / 3;
    return [0, 1, 2].map((i) => polyRect(i * cw, 0, cw, h));
  }
  if (layout === 'duo') {
    // Two panels split by a diagonal running top-right to bottom-left.
    return [
      {
        points: [
          [0, 0],
          [w, 0],
          [w * 0.42, h],
          [0, h],
        ],
      },
      {
        points: [
          [w, 0],
          [w, h],
          [w * 0.42, h],
        ],
      },
    ];
  }
  if (layout === 'solo') {
    return [polyRect(0, 0, w, h)];
  }
  // classic: hero on top with a slanted bottom edge, two mids, two bottoms.
  const heroH = h * 0.5;
  const midH = h * 0.26;
  const botH = h - heroH - midH;
  const slant = w * 0.06;
  return [
    {
      points: [
        [0, 0],
        [w, 0],
        [w, h * 0.46],
        [0, heroH],
      ],
      _slant: slant,
    },
    polyRect(0, heroH, w / 2, midH),
    polyRect(w / 2, heroH, w / 2, midH),
    polyRect(0, heroH + midH, w / 2, botH),
    polyRect(w / 2, heroH + midH, w / 2, botH),
  ];
}

function polyRect(x, y, w, h) {
  return {
    points: [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ],
  };
}

export function panelBounds(poly) {
  const xs = poly.points.map((p) => p[0]);
  const ys = poly.points.map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

export function clipPoly(ctx, poly) {
  ctx.beginPath();
  poly.points.forEach(([x, y], i) => {
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.clip();
}

// Placeholder art for an empty panel: a Vice sunset painted in code —
// gradient sky, a low sun disc, a dark skyline and palm silhouettes.
export function paintPlaceholder(ctx, bounds, seed = 0) {
  const { x, y, w, h } = bounds;
  const sky = ctx.createLinearGradient(x, y, x, y + h);
  sky.addColorStop(0, '#2b1055');
  sky.addColorStop(0.45, '#7597de');
  sky.addColorStop(0.62, '#ff6b9d');
  sky.addColorStop(0.8, '#ff9a3d');
  sky.addColorStop(1, '#ffd166');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);

  const sunR = Math.min(w, h) * 0.22;
  const sunX = x + w * (0.32 + (seed % 3) * 0.18);
  const sunY = y + h * 0.58;
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.4);
  glow.addColorStop(0, 'rgba(255, 214, 130, 0.85)');
  glow.addColorStop(1, 'rgba(255, 214, 130, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  // Skyline.
  ctx.fillStyle = '#1b0b2e';
  const horizon = y + h * 0.78;
  ctx.fillRect(x, horizon, w, y + h - horizon);
  let bx = x + w * 0.04;
  while (bx < x + w * 0.96) {
    const bw = w * (0.06 + ((bx * 7) % 5) * 0.012);
    const bh = h * (0.05 + ((bx * 13) % 7) * 0.014);
    ctx.fillRect(bx, horizon - bh, bw, bh + (y + h - horizon));
    bx += bw + w * 0.02;
  }

  // Two palm silhouettes.
  paintPalm(ctx, x + w * 0.82, y + h * 0.98, Math.min(w, h) * 0.3, -0.25);
  paintPalm(ctx, x + w * 0.12, y + h, Math.min(w, h) * 0.22, 0.3);
}

function paintPalm(ctx, baseX, baseY, size, lean) {
  ctx.save();
  ctx.translate(baseX, baseY);
  ctx.rotate(lean);
  ctx.strokeStyle = '#12061f';
  ctx.fillStyle = '#12061f';
  ctx.lineWidth = Math.max(2, size * 0.045);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(size * 0.08, -size * 0.55, size * 0.02, -size);
  ctx.stroke();
  const topX = size * 0.02;
  const topY = -size;
  for (let i = 0; i < 6; i++) {
    const angle = -Math.PI * (0.08 + i * 0.16);
    const len = size * (0.42 + (i % 2) * 0.1);
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(angle) * len * 0.6,
      topY + Math.sin(angle) * len * 0.35 - size * 0.08,
      topX + Math.cos(angle) * len,
      topY + Math.sin(angle) * len + size * 0.22,
    );
    ctx.lineWidth = Math.max(1.5, size * 0.03);
    ctx.stroke();
  }
  ctx.restore();
}
