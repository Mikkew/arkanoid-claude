const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Layout (sistema lógico fijo 480x640)
const WIDTH = 480;
const HEIGHT = 640;

const BLOCK_COLS = 8;
const BLOCK_W = 48;
const BLOCK_H = 20;
const BLOCK_GAP = 4;
const GRID_X = (WIDTH - (BLOCK_COLS * BLOCK_W + (BLOCK_COLS - 1) * BLOCK_GAP)) / 2;
const GRID_Y = 60;

// Código de celda -> bloque. '.' = sin bloque
const CELL_BLOCKS = {
  R: { color: 'red', hp: 1 },
  Y: { color: 'yellow', hp: 1 },
  G: { color: 'green', hp: 1 },
  C: { color: 'cyan', hp: 1 },
  M: { color: 'magenta', hp: 1 },
  X: { color: 'gray', hp: 2 },
};

const LEVELS = [
  {
    grid: ['RRRRRRRR', 'YYYYYYYY', 'GGGGGGGG', 'CCCCCCCC', 'MMMMMMMM'],
    ballSpeed: 300,
  },
  {
    grid: ['XXXXXXXX', 'RYGCCGYR', '.MM..MM.', 'RYGCCGYR', '........'],
    ballSpeed: 330,
  },
  {
    grid: ['X..XX..X', 'XRXYYXRX', 'GXCXXCXG', 'MMX..XMM', 'XRYGGYRX', '..XXXX..'],
    ballSpeed: 360,
  },
  {
    grid: ['XRXXXXRX', 'YGCMMCGY', 'X.XXXX.X', 'MCGYYGCM', '.XRXXRX.', '..XXXX..'],
    ballSpeed: 390,
  },
  {
    grid: ['XXXXXXXX', 'XRYGGYRX', 'XCMXXMCX', 'XGXRRXGX', 'XMCXXCMX', 'XYRGGRYX', '..XXXX..'],
    ballSpeed: 420,
  },
];

const PADDLE_W = 100;
const PADDLE_H = 14;
const PADDLE_Y = HEIGHT - 40;

const BALL_R = 8;

const state = {
  status: 'start', // 'start' | 'playing' | 'paused' | 'gameover' | 'victory' | 'levelcomplete'
  level: 1, // 1..LEVELS.length
  score: 0,
  lives: 3,
  paddle: { x: 0, y: 0, w: PADDLE_W, h: PADDLE_H },
  ball: { x: 0, y: 0, vx: 0, vy: 0, r: BALL_R, speed: LEVELS[0].ballSpeed },
  blocks: [],
  explosions: [],
};

const createBlocks = () => {
  const blocks = [];
  const { grid } = LEVELS[state.level - 1];
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < BLOCK_COLS; col++) {
      const cell = CELL_BLOCKS[grid[row][col]];
      if (!cell) continue;
      blocks.push({
        x: GRID_X + col * (BLOCK_W + BLOCK_GAP),
        y: GRID_Y + row * (BLOCK_H + BLOCK_GAP),
        w: BLOCK_W,
        h: BLOCK_H,
        color: cell.color,
        alive: true,
        hp: cell.hp,
      });
    }
  }
  return blocks;
};

const resetPaddleAndBall = () => {
  state.paddle.x = (WIDTH - state.paddle.w) / 2;
  state.paddle.y = PADDLE_Y;
  state.ball.x = WIDTH / 2;
  state.ball.y = PADDLE_Y - BALL_R;
  state.ball.vx = 0;
  state.ball.vy = 0;
};

// Carga el nivel n (1..LEVELS.length). No toca puntaje ni vidas
const loadLevel = (n) => {
  state.level = n;
  state.ball.speed = LEVELS[n - 1].ballSpeed;
  state.blocks = createBlocks();
  state.explosions = [];
  resetPaddleAndBall();
  state.status = 'start';
};

const resetState = () => {
  state.score = 0;
  state.lives = 3;
  loadLevel(1);
};

const drawCenteredText = (text, y, size) => {
  ctx.font = `${size}px sans-serif`;
  ctx.fillText(text, WIDTH / 2, y);
};

const drawStartScreen = () => {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  drawCenteredText('ARKANOID', HEIGHT / 2 - 30, 48);
  drawCenteredText('Presiona para empezar', HEIGHT / 2 + 20, 22);
};

const PADDLE_SPEED = 450; // px/s (teclado)

const keys = { left: false, right: false };

const clampPaddle = () => {
  state.paddle.x = Math.max(0, Math.min(WIDTH - state.paddle.w, state.paddle.x));
};

const setKey = (e, pressed) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = pressed;
  else if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = pressed;
  else return;
  e.preventDefault();
};

window.addEventListener('keydown', (e) => setKey(e, true));
window.addEventListener('keyup', (e) => setKey(e, false));

// Posición del mouse en coordenadas lógicas (480x640)
const getMousePos = (e) => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (WIDTH / rect.width),
    y: (e.clientY - rect.top) * (HEIGHT / rect.height),
  };
};

canvas.addEventListener('mousemove', (e) => {
  state.paddle.x = getMousePos(e).x - state.paddle.w / 2;
  clampPaddle();
});

const updatePaddle = (dt) => {
  const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  state.paddle.x += dir * PADDLE_SPEED * dt;
  clampPaddle();
};

const SCORE_PER_BLOCK = 10;

const sounds = {
  bounce: new Audio('assets/sounds/ball-bounce.mp3'),
  break: new Audio('assets/sounds/break-sound.mp3'),
};

const playSound = (name) => {
  // cloneNode permite solapar reproducciones rápidas del mismo sonido
  sounds[name].cloneNode().play().catch(() => {});
};

const loseLife = () => {
  state.lives -= 1;
  resetPaddleAndBall();
  // Con vidas restantes la bola espera sobre la paleta hasta que el jugador la lance
  state.status = state.lives > 0 ? 'start' : 'gameover';
};

const drawHud = () => {
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'top';
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Puntaje: ${state.score}`, 12, 12);
  ctx.textAlign = 'center';
  ctx.fillText(`Nivel ${state.level}/${LEVELS.length}`, WIDTH / 2, 12);
  ctx.textAlign = 'right';
  ctx.fillText(`Vidas: ${state.lives}`, WIDTH - 12, 12);
};

const RESTART_BUTTON = { x: WIDTH / 2 - 90, y: HEIGHT / 2 + 60, w: 180, h: 44 };
const CONTINUE_BUTTON = { x: WIDTH / 2 - 90, y: HEIGHT / 2 + 60, w: 180, h: 44 };

// Selector de nivel en pausa: un botón por nivel, en fila centrada
const LEVEL_BUTTON_SIZE = 44;
const LEVEL_BUTTON_GAP = 12;
const LEVEL_BUTTONS_X =
  (WIDTH - (LEVELS.length * LEVEL_BUTTON_SIZE + (LEVELS.length - 1) * LEVEL_BUTTON_GAP)) / 2;
const LEVEL_BUTTONS = LEVELS.map((_, i) => ({
  n: i + 1,
  x: LEVEL_BUTTONS_X + i * (LEVEL_BUTTON_SIZE + LEVEL_BUTTON_GAP),
  y: HEIGHT / 2 + 90,
  w: LEVEL_BUTTON_SIZE,
  h: LEVEL_BUTTON_SIZE,
}));

const drawPauseScreen = () => {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  drawCenteredText('PAUSA', HEIGHT / 2 - 10, 48);
  drawCenteredText('P o Esc para reanudar', HEIGHT / 2 + 40, 22);
  drawCenteredText('Ir al nivel (1-5)', HEIGHT / 2 + 75, 18);

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  LEVEL_BUTTONS.forEach((btn) => {
    const current = btn.n === state.level;
    if (current) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    }
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
    ctx.fillStyle = current ? '#000' : '#fff';
    drawCenteredText(String(btn.n), btn.y + btn.h / 2, 20);
  });
};

const drawEndScreen = (title) => {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  drawCenteredText(title, HEIGHT / 2 - 30, 48);

  const btn = RESTART_BUTTON;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
  drawCenteredText('Reiniciar (R)', btn.y + btn.h / 2, 20);
  drawCenteredText(`Puntaje final: ${state.score}`, HEIGHT / 2 + 20, 22);
};

const drawLevelCompleteScreen = () => {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  drawCenteredText('NIVEL COMPLETADO', HEIGHT / 2 - 30, 40);

  const btn = CONTINUE_BUTTON;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
  drawCenteredText('Continuar (Enter)', btn.y + btn.h / 2, 20);
  drawCenteredText(`Puntaje: ${state.score}`, HEIGHT / 2 + 20, 22);
};

const render = () => {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  state.blocks.forEach((b) => {
    if (b.alive) drawSprite(ctx, `block_${b.color}`, b.x, b.y, b.w, b.h);
  });
  state.explosions.forEach((e) => {
    const i = Math.min(3, Math.floor((e.elapsed / EXPLOSION_DURATION) * 4));
    drawFrame(ctx, EXPLOSION_FRAMES[e.color][i], e.x, e.y, e.w, e.h);
  });
  drawHud();

  const { paddle, ball } = state;
  drawSprite(ctx, 'paddle', paddle.x, paddle.y, paddle.w, paddle.h);
  drawSprite(ctx, 'ball', ball.x - ball.r, ball.y - ball.r, ball.r * 2, ball.r * 2);

  if (state.status === 'start') drawStartScreen();
  else if (state.status === 'paused') drawPauseScreen();
  else if (state.status === 'gameover') drawEndScreen('GAME OVER');
  else if (state.status === 'victory') drawEndScreen('¡VICTORIA!');
  else if (state.status === 'levelcomplete') drawLevelCompleteScreen();
};

const MAX_BOUNCE_ANGLE = Math.PI / 3; // 60° desde la vertical, en el borde de la paleta

const setBallDirection = (angle) => {
  // angle: 0 = recto hacia arriba, positivo = hacia la derecha
  state.ball.vx = state.ball.speed * Math.sin(angle);
  state.ball.vy = -state.ball.speed * Math.cos(angle);
};

const CONTROL_KEYS = ['KeyP', 'Escape', 'KeyR', 'Enter'];

const startGame = (e) => {
  if (state.status !== 'start') return;
  // Las teclas de control (pausa/reinicio) no inician la partida
  if (e.type === 'keydown' && CONTROL_KEYS.includes(e.code)) return;
  state.status = 'playing';
  setBallDirection((Math.random() - 0.5) * (Math.PI / 3)); // ±30°
};

const togglePause = () => {
  if (state.status === 'playing') state.status = 'paused';
  else if (state.status === 'paused') state.status = 'playing';
};

const restartGame = () => {
  if (state.status !== 'gameover' && state.status !== 'victory') return;
  resetState();
};

const nextLevel = () => {
  if (state.status !== 'levelcomplete') return;
  loadLevel(state.level + 1);
};

window.addEventListener('keydown', startGame);
canvas.addEventListener('mousedown', startGame);

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
  else if (e.code === 'KeyR') restartGame();
  else if (e.code === 'Enter') nextLevel();
  else if (state.status === 'paused') {
    // Teclas 1-5 (fila superior o teclado numérico) solo actúan en pausa
    const match = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);
    if (match && Number(match[1]) <= LEVELS.length) loadLevel(Number(match[1]));
  }
});

canvas.addEventListener('click', (e) => {
  const { x, y } = getMousePos(e);
  const inside = (btn) => x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h;
  if (state.status === 'paused') {
    const btn = LEVEL_BUTTONS.find(inside);
    if (btn) loadLevel(btn.n);
  } else if (state.status === 'levelcomplete' && inside(CONTINUE_BUTTON)) nextLevel();
  else if (inside(RESTART_BUTTON)) restartGame();
});

const updateBall = (dt) => {
  const { ball, paddle } = state;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  // Paredes izquierda, derecha y superior
  if (ball.x - ball.r < 0) {
    ball.x = ball.r;
    ball.vx = Math.abs(ball.vx);
    playSound('bounce');
  } else if (ball.x + ball.r > WIDTH) {
    ball.x = WIDTH - ball.r;
    ball.vx = -Math.abs(ball.vx);
    playSound('bounce');
  }
  if (ball.y - ball.r < 0) {
    ball.y = ball.r;
    ball.vy = Math.abs(ball.vy);
    playSound('bounce');
  }

  // Paleta: solo al bajar. Ángulo según el punto de impacto
  const hitsPaddle =
    ball.vy > 0 &&
    ball.y + ball.r >= paddle.y &&
    ball.y - ball.r <= paddle.y + paddle.h &&
    ball.x + ball.r >= paddle.x &&
    ball.x - ball.r <= paddle.x + paddle.w;
  if (hitsPaddle) {
    const offset = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
    const clamped = Math.max(-1, Math.min(1, offset));
    ball.y = paddle.y - ball.r;
    setBallDirection(clamped * MAX_BOUNCE_ANGLE);
    playSound('bounce');
  }

  // Bloques: círculo vs rectángulo, un bloque por frame
  for (const b of state.blocks) {
    if (!b.alive) continue;
    const nearestX = Math.max(b.x, Math.min(ball.x, b.x + b.w));
    const nearestY = Math.max(b.y, Math.min(ball.y, b.y + b.h));
    const dx = ball.x - nearestX;
    const dy = ball.y - nearestY;
    if (dx * dx + dy * dy > ball.r * ball.r) continue;

    if (Math.abs(dx) > Math.abs(dy)) {
      // Impacto lateral
      ball.x = dx > 0 ? b.x + b.w + ball.r : b.x - ball.r;
      ball.vx = dx > 0 ? Math.abs(ball.vx) : -Math.abs(ball.vx);
    } else {
      // Impacto arriba/abajo (también si el centro quedó dentro del bloque)
      const fromBelow = dy > 0 || (dy === 0 && ball.vy < 0);
      ball.y = fromBelow ? b.y + b.h + ball.r : b.y - ball.r;
      ball.vy = fromBelow ? Math.abs(ball.vy) : -Math.abs(ball.vy);
    }
    // Cualquier golpe a un bloque suena 'break', nunca 'bounce'
    playSound('break');
    b.hp -= 1;
    if (b.hp > 0) {
      // Golpe que daña: el bloque sigue vivo como 'red', sin puntos ni explosión
      b.color = 'red';
      break;
    }
    b.alive = false;
    state.explosions.push({ x: b.x, y: b.y, w: b.w, h: b.h, color: b.color, elapsed: 0 });
    state.score += SCORE_PER_BLOCK;
    break;
  }

  // Bola bajo el borde inferior: pierde una vida
  if (ball.y - ball.r > HEIGHT) loseLife();
};

const updateExplosions = (dt) => {
  // dt en segundos, elapsed en ms
  state.explosions.forEach((e) => {
    e.elapsed += dt * 1000;
  });
  state.explosions = state.explosions.filter((e) => e.elapsed < EXPLOSION_DURATION);
};

let lastTime = 0;

const frame = (time) => {
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  updatePaddle(dt);
  // Bola descansa sobre la paleta hasta que empiece la partida
  if (state.status === 'start') state.ball.x = state.paddle.x + state.paddle.w / 2;
  if (state.status === 'playing') {
    updateBall(dt);
    updateExplosions(dt);
    // Fin de nivel diferido: espera a que termine la última explosión
    if (
      state.status === 'playing' &&
      state.explosions.length === 0 &&
      state.blocks.every((block) => !block.alive)
    ) {
      state.status = state.level < LEVELS.length ? 'levelcomplete' : 'victory';
    }
  }

  render();
  requestAnimationFrame(frame);
};

resetState();

// Estado de carga: texto mientras el spritesheet no está listo
ctx.fillStyle = '#000';
ctx.fillRect(0, 0, WIDTH, HEIGHT);
ctx.fillStyle = '#fff';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
drawCenteredText('Cargando...', HEIGHT / 2, 22);

loadSpritesheet(() => {
  lastTime = performance.now();
  requestAnimationFrame(frame);
});
