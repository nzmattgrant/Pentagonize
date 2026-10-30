// Light comes from the top-left. Highlights are kept broad and faint so surfaces read as matte plastic.

interface Shades {
  light: string;
  base: string;
  dark: string;
}

// Keyed by slot value. Keep in sync with .winner-marble in Main.vue.
const MARBLE_COLORS: Record<number, Shades> = {
  1: { light: '#d0544c', base: '#a31b1b', dark: '#5e0c0d' },
  2: { light: '#5a6dd8', base: '#2333a0', dark: '#121b68' },
};

const TILE_BEVEL_COLORS = ['#ff7b74', '#b3140f'];
const TILE_FACE_COLORS = ['#ff4540', '#ec2c28'];
const BOARD_BASE_COLORS = ['#7a1210', '#560808'];
const HOLE_COLORS = ['#080808', '#1a1a1a', '#484848'];
const HOLE_RIM_COLORS = ['rgba(0,0,0,0.35)', 'rgba(255,255,255,0.3)'];

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

const HOLE_RIM_WIDTH = 0.1;

// Tile proportions are fractions of its side length.
const TILE_CORNER_RATIO = 0.08;
const TILE_BEVEL_RATIO = 0.035;

// CSS pixels
const BOARD_SHADOW_OFFSET = 9;
const BOARD_SHADOW_BLUR = 14;
const BOARD_SHADOW_COLOR = 'rgba(0,0,0,0.55)';
const BOARD_SHADOW_FILL = 'rgba(0,0,0,0.65)';

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

export function drawBoardBase(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const offset = Math.round(BOARD_SHADOW_OFFSET * devicePixelRatio);
  ctx.save();
  ctx.shadowColor = BOARD_SHADOW_COLOR;
  ctx.shadowBlur = BOARD_SHADOW_BLUR * devicePixelRatio;
  ctx.fillStyle = BOARD_SHADOW_FILL;
  roundedRectPath(ctx, x + offset, y + offset, w, h, r);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = diagonalGradient(ctx, x, y, w, h, BOARD_BASE_COLORS);
  roundedRectPath(ctx, x, y, w, h, r);
  ctx.fill();
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
