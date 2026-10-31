// Light comes from the top-left. Highlights are kept broad and faint so surfaces read as matte plastic.

interface Shades {
  light: string;
  base: string;
  dark: string;
}

// Keyed by slot value.
const MARBLE_COLORS: Record<number, Shades> = {
  1: { light: '#e0645b', base: '#b3231e', dark: '#5e0c0d' },
  2: { light: '#6b84ee', base: '#2c43c2', dark: '#121c6e' },
};

const TILE_BEVEL_COLORS = ['#ff8a80', '#a91c15'];
const TILE_FACE_COLORS = ['#ee4c41', '#dc3b31'];
const BOARD_BASE_COLORS = ['#82211b', '#55100c'];
const HOLE_COLORS = ['#1c0b09', '#2c1311', '#5e2a25'];
const HOLE_RIM_COLORS = ['rgba(0,0,0,0.35)', 'rgba(255,255,255,0.3)'];
const ARROW_ICON_COLOR = '#ffffff';
const ARROW_SHADOW_COLOR = 'rgba(0,0,0,0.3)';

// Marble proportions are fractions of its radius.
const MARBLE_LIGHT_OFFSET = -0.32;
const MARBLE_BASE_STOP = 0.65;
const MARBLE_SHEEN_RADIUS = 0.75;
const MARBLE_SHEEN_ALPHA = 0.16;
const MARBLE_SHADOW_OFFSET = 0.14;
const MARBLE_SHADOW_INNER = 0.5;
const MARBLE_SHADOW_OUTER = 1.2;
const MARBLE_SHADOW_ALPHA = 0.4;
export const MARBLE_IN_HOLE_SCALE = 0.88;
// How far the marble's shadow reaches from its centre
export const MARBLE_EXTENT = MARBLE_SHADOW_OFFSET + MARBLE_SHADOW_OUTER;

const HOLE_RIM_WIDTH = 0.1;

// Tile proportions are fractions of its side length.
const TILE_CORNER_RATIO = 0.08;
const TILE_BEVEL_RATIO = 0.035;

// Fractions of the board margin, so the shadow always fits inside the canvas.
const BOARD_SHADOW_OFFSET = 0.2;
const BOARD_SHADOW_BLUR = 0.6;
const BOARD_SHADOW_COLOR = 'rgba(60,10,8,0.4)';

// Arrow icon proportions are fractions of the button radius.
const ARROW_TIP = 0.42;
const ARROW_BACK = 0.24;
const ARROW_HALF_WIDTH = 0.36;
const ARROW_CORNER = 0.14;
const ARROW_SHADOW_BLUR = 0.5;
const ARROW_SHADOW_OFFSET = 0.12;

// Lets CSS draw marbles and tiles that match the canvas.
export function exposeColors(root: HTMLElement) {
  const colors: Record<string, string> = {
    '--tile-light': TILE_FACE_COLORS[0],
    '--tile-dark': TILE_FACE_COLORS[1],
    '--hole-dark': HOLE_COLORS[0],
    '--hole-light': HOLE_COLORS[HOLE_COLORS.length - 1],
  };
  for (const [player, shades] of Object.entries(MARBLE_COLORS)) {
    for (const [shade, color] of Object.entries(shades)) {
      colors[`--player-${player}-${shade}`] = color;
    }
  }
  for (const [name, color] of Object.entries(colors)) {
    root.style.setProperty(name, color);
  }
}

export function tileCornerRadius(size: number) {
  return size * TILE_CORNER_RATIO;
}

export function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function diagonalGradient(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, colors: string[]) {
  const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
  colors.forEach((color, i) => gradient.addColorStop(i / (colors.length - 1), color));
  return gradient;
}

function fillCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, style: string | CanvasGradient) {
  ctx.fillStyle = style;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.fill();
}

export function drawBoardBase(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, margin: number) {
  ctx.save();
  ctx.shadowColor = BOARD_SHADOW_COLOR;
  ctx.shadowBlur = margin * BOARD_SHADOW_BLUR;
  ctx.shadowOffsetY = margin * BOARD_SHADOW_OFFSET;
  ctx.fillStyle = diagonalGradient(ctx, x, y, w, h, BOARD_BASE_COLORS);
  roundedRectPath(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.restore();
}

// A round button in the player's colour with a triangle pointing along (dx, dy), a unit vector.
export function drawArrowButton(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, dx: number, dy: number, player: number) {
  const { light, base } = MARBLE_COLORS[player];

  ctx.save();
  ctx.shadowColor = ARROW_SHADOW_COLOR;
  ctx.shadowBlur = r * ARROW_SHADOW_BLUR;
  ctx.shadowOffsetY = r * ARROW_SHADOW_OFFSET;
  fillCircle(ctx, cx, cy, r, diagonalGradient(ctx, cx - r, cy - r, 2 * r, 2 * r, [light, base]));
  ctx.restore();

  const px = -dy;
  const py = dx;
  ctx.beginPath();
  ctx.moveTo(cx + dx * r * ARROW_TIP, cy + dy * r * ARROW_TIP);
  ctx.lineTo(cx - dx * r * ARROW_BACK + px * r * ARROW_HALF_WIDTH, cy - dy * r * ARROW_BACK + py * r * ARROW_HALF_WIDTH);
  ctx.lineTo(cx - dx * r * ARROW_BACK - px * r * ARROW_HALF_WIDTH, cy - dy * r * ARROW_BACK - py * r * ARROW_HALF_WIDTH);
  ctx.closePath();
  ctx.fillStyle = ctx.strokeStyle = ARROW_ICON_COLOR;
  ctx.lineJoin = 'round';
  ctx.lineWidth = r * ARROW_CORNER;
  ctx.fill();
  ctx.stroke();
}

// A raised tile: the outer ring is the bevel, lit on the top-left and shaded on the bottom-right.
export function drawTile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const radius = tileCornerRadius(size);
  const bevel = size * TILE_BEVEL_RATIO;
  const face = size - 2 * bevel;

  ctx.fillStyle = diagonalGradient(ctx, x, y, size, size, TILE_BEVEL_COLORS);
  roundedRectPath(ctx, x, y, size, size, radius);
  ctx.fill();

  ctx.fillStyle = diagonalGradient(ctx, x + bevel, y + bevel, face, face, TILE_FACE_COLORS);
  roundedRectPath(ctx, x + bevel, y + bevel, face, face, radius - bevel);
  ctx.fill();
}

export function drawMarble(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, player: number) {
  const { light, base, dark } = MARBLE_COLORS[player];

  const sx = cx + r * MARBLE_SHADOW_OFFSET;
  const sy = cy + r * MARBLE_SHADOW_OFFSET;
  const shadow = ctx.createRadialGradient(sx, sy, r * MARBLE_SHADOW_INNER, sx, sy, r * MARBLE_SHADOW_OUTER);
  shadow.addColorStop(0, `rgba(0,0,0,${MARBLE_SHADOW_ALPHA})`);
  shadow.addColorStop(1, 'rgba(0,0,0,0)');
  fillCircle(ctx, sx, sy, r * MARBLE_SHADOW_OUTER, shadow);

  const lx = cx + r * MARBLE_LIGHT_OFFSET;
  const ly = cy + r * MARBLE_LIGHT_OFFSET;
  const body = ctx.createRadialGradient(lx, ly, 0, cx, cy, r);
  body.addColorStop(0, light);
  body.addColorStop(MARBLE_BASE_STOP, base);
  body.addColorStop(1, dark);
  fillCircle(ctx, cx, cy, r, body);

  const sheen = ctx.createRadialGradient(lx, ly, 0, lx, ly, r * MARBLE_SHEEN_RADIUS);
  sheen.addColorStop(0, `rgba(255,255,255,${MARBLE_SHEEN_ALPHA})`);
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  fillCircle(ctx, cx, cy, r, sheen);
}

// A concave hole is shaded the opposite way to a ball: the near (top-left) wall is in shadow, the far wall is lit.
export function drawSlot(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, value: number) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.fillStyle = diagonalGradient(ctx, cx - r, cy - r, 2 * r, 2 * r, HOLE_COLORS);
  ctx.fill();
  ctx.strokeStyle = diagonalGradient(ctx, cx - r, cy - r, 2 * r, 2 * r, HOLE_RIM_COLORS);
  ctx.lineWidth = r * HOLE_RIM_WIDTH;
  ctx.stroke();

  if (value !== 0) drawMarble(ctx, cx, cy, r * MARBLE_IN_HOLE_SCALE, value);
}
