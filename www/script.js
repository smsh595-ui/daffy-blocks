// Screen Navigation Elements
const lobbyScreen = document.getElementById('lobby-screen');
const gameScreen = document.getElementById('game-screen');
const btnLaunchBlocks = document.getElementById('btn-launch-blocks');
const btnBackLobby = document.getElementById('btn-back-lobby');

let gameRunning = false;

btnLaunchBlocks.addEventListener('click', () => {
  lobbyScreen.classList.remove('active');
  gameScreen.classList.add('active');
  gameRunning = true;
  playerReset();
});

btnBackLobby.addEventListener('click', () => {
  gameScreen.classList.remove('active');
  lobbyScreen.classList.add('active');
  gameRunning = false;
});

const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const linesElement = document.getElementById('lines');
const levelElement = document.getElementById('level');
const levelBanner = document.getElementById('level-banner');

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 28;

const COLORS = [
  null,
  { base: '#00e5ff', top: '#e6fcff', side: '#008ba3', glow: 'rgba(0, 229, 255, 0.45)' },
  { base: '#ff9100', top: '#fff0e0', side: '#a35000', glow: 'rgba(255, 145, 0, 0.45)' },
  { base: '#2979ff', top: '#e0ecff', side: '#0d47a1', glow: 'rgba(41, 121, 255, 0.45)' },
  { base: '#ffd600', top: '#fffde6', side: '#998000', glow: 'rgba(255, 214, 0, 0.45)' },
  { base: '#00e676', top: '#e6fffa', side: '#00803c', glow: 'rgba(0, 230, 118, 0.45)' },
  { base: '#d500f9', top: '#fae6ff', side: '#75008a', glow: 'rgba(213, 0, 249, 0.45)' },
  { base: '#ff1744', top: '#ffe6eb', side: '#990022', glow: 'rgba(255, 23, 68, 0.45)' }
];

function createPiece(type) {
  if (type === 'I') return [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]];
  if (type === 'L') return [[0,2,0],[0,2,0],[0,2,2]];
  if (type === 'J') return [[0,3,0],[0,3,0],[3,3,0]];
  if (type === 'O') return [[4,4],[4,4]];
  if (type === 'S') return [[0,5,5],[5,5,0],[0,0,0]];
  if (type === 'T') return [[0,6,0],[6,6,6],[0,0,0]];
  if (type === 'Z') return [[7,7,0],[0,7,7],[0,0,0]];
}

function createMatrix(w, h) {
  const matrix = [];
  while (h--) matrix.push(new Array(w).fill(0));
  return matrix;
}

let arena = createMatrix(COLS, ROWS);

let player = {
  pos: { x: 0, y: 0 },
  matrix: null,
  score: 0,
  lines: 0,
  level: 1
};

function drawBlock(x, y, colorIndex) {
  const c = COLORS[colorIndex];
  if (!c) return;

  const pad = 1;
  const bx = x + pad;
  const by = y + pad;
  const bw = BLOCK_SIZE - pad * 2;
  const bh = BLOCK_SIZE - pad * 2;

  context.shadowColor = c.glow;
  context.shadowBlur = 8;

  const grad = context.createLinearGradient(bx, by, bx + bw, by + bh);
  grad.addColorStop(0, c.base);
  grad.addColorStop(1, c.side);
  context.fillStyle = grad;
  context.fillRect(bx, by, bw, bh);

  context.shadowBlur = 0;

  context.fillStyle = c.top;
  context.beginPath();
  context.moveTo(bx, by);
  context.lineTo(bx + bw, by);
  context.lineTo(bx + bw - 4, by + 4);
  context.lineTo(bx + 4, by + 4);
  context.lineTo(bx + 4, by + bh - 4);
  context.lineTo(bx, by + bh);
  context.closePath();
  context.fill();

  context.fillStyle = 'rgba(0, 0, 0, 0.45)';
  context.beginPath();
  context.moveTo(bx + bw, by);
  context.lineTo(bx + bw, by + bh);
  context.lineTo(bx, by + bh);
  context.lineTo(bx + 4, by + bh - 4);
  context.lineTo(bx + bw - 4, by + bh - 4);
  context.lineTo(bx + bw - 4, by + 4);
  context.closePath();
  context.fill();
}

function collide(arena, player) {
  const [m, o] = [player.matrix, player.pos];
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0) {
        if (!arena[y + o.y] || arena[y + o.y][x + o.x] === undefined || arena[y + o.y][x + o.x] !== 0) {
          return true;
        }
      }
    }
  }
  return false;
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function rotate(matrix) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  matrix.forEach(row => row.reverse());
}

function playerRotate() {
  if (!gameRunning) return;
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix);
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix);
      rotate(player.matrix);
      rotate(player.matrix);
      player.pos.x = pos;
      return;
    }
  }
}

function checkLevelUp() {
  const targetLevel = Math.floor(player.lines / 5) + 1;
  if (targetLevel > player.level) {
    player.level = targetLevel;
    levelElement.textContent = player.level;
    dropInterval = Math.max(100, 520 - (player.level - 1) * 45);
    levelBanner.textContent = `LEVEL ${player.level}!`;
    levelBanner.classList.add('show');
    setTimeout(() => levelBanner.classList.remove('show'), 1200);
  }
}

function arenaSweep() {
  let clearedRows = 0;
  for (let y = arena.length - 1; y >= 0; --y) {
    let full = true;
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) {
        full = false;
        break;
      }
    }
    if (full) {
      arena.splice(y, 1);
      arena.unshift(new Array(COLS).fill(0));
      clearedRows++;
      y++;
    }
  }

  if (clearedRows > 0) {
    player.lines += clearedRows;
    player.score += clearedRows * 100 * clearedRows * player.level;
    scoreElement.textContent = player.score;
    linesElement.textContent = player.lines;
    checkLevelUp();
  }
}

function playerReset() {
  const pieces = 'ILJOTSZ';
  const chosen = pieces[(pieces.length * Math.random()) | 0];
  player.matrix = createPiece(chosen);
  player.pos.y = 0;
  player.pos.x = Math.floor((COLS - player.matrix[0].length) / 2);

  if (collide(arena, player)) {
    arena = createMatrix(COLS, ROWS);
    player.score = 0;
    player.lines = 0;
    player.level = 1;
    dropInterval = 520;
    scoreElement.textContent = '0';
    linesElement.textContent = '0';
    levelElement.textContent = '1';
  }
}

function playerDrop() {
  if (!gameRunning) return;
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    arenaSweep();
    playerReset();
  }
  dropCounter = 0;
}

function playerMove(dir) {
  if (!gameRunning) return;
  player.pos.x += dir;
  if (collide(arena, player)) {
    player.pos.x -= dir;
  }
}

function draw() {
  context.fillStyle = '#080a10';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = 'rgba(0, 229, 255, 0.05)';
  context.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += BLOCK_SIZE) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);
    context.stroke();
  }
  for (let y = 0; y <= canvas.height; y += BLOCK_SIZE) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(canvas.width, y);
    context.stroke();
  }

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (arena[y][x] !== 0) {
        drawBlock(x * BLOCK_SIZE, y * BLOCK_SIZE, arena[y][x]);
      }
    }
  }

  if (player.matrix) {
    player.matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          drawBlock(
            (x + player.pos.x) * BLOCK_SIZE,
            (y + player.pos.y) * BLOCK_SIZE,
            value
          );
        }
      });
    });
  }
}

let dropCounter = 0;
let dropInterval = 520;
let lastTime = 0;

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;

  if (gameRunning) {
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
      playerDrop();
    }
    draw();
  }
  requestAnimationFrame(update);
}

document.addEventListener('keydown', event => {
  if (event.keyCode === 37) playerMove(-1);
  else if (event.keyCode === 39) playerMove(1);
  else if (event.keyCode === 40) playerDrop();
  else if (event.keyCode === 38) playerRotate();
});

document.getElementById('btn-left').addEventListener('click', () => playerMove(-1));
document.getElementById('btn-right').addEventListener('click', () => playerMove(1));
document.getElementById('btn-rotate').addEventListener('click', () => playerRotate());
document.getElementById('btn-drop').addEventListener('click', () => playerDrop());

update();