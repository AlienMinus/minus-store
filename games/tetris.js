// Retro Block Stacker / Tetris Game Engine (8-Bit Pixelatte Style)
window.TetrisGame = (function () {
  return function createTetrisGame(canvas, audio) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    const COLS = 10;
    const ROWS = 20;
    const BLOCK = Math.floor((H - 24) / ROWS); // ~15px per cell
    const GRID_W = COLS * BLOCK;
    const GRID_H = ROWS * BLOCK;
    const GRID_X = Math.floor((W - GRID_W) / 2);
    const GRID_Y = Math.floor((H - GRID_H) / 2);

    const SHAPES = [
      { id: 'I', color: '#007769', matrix: [[1, 1, 1, 1]] },
      { id: 'O', color: '#f59e0b', matrix: [[1, 1], [1, 1]] },
      { id: 'T', color: '#7c3aed', matrix: [[0, 1, 0], [1, 1, 1]] },
      { id: 'S', color: '#008744', matrix: [[0, 1, 1], [1, 1, 0]] },
      { id: 'Z', color: '#c90057', matrix: [[1, 1, 0], [0, 1, 1]] },
      { id: 'J', color: '#2563eb', matrix: [[1, 0, 0], [1, 1, 1]] },
      { id: 'L', color: '#ea580c', matrix: [[0, 0, 1], [1, 1, 1]] }
    ];

    let grid = [];
    let currentPiece = null;
    let nextPiece = null;
    let score = 0;
    let lines = 0;
    let hiScore = parseInt(localStorage.getItem('minus_tetris_hi') || '1200', 10);
    let dropInterval = 650;
    let lastDrop = 0;
    let isRunning = false;
    let isGameOver = false;

    function reset() {
      grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
      score = 0;
      lines = 0;
      dropInterval = 650;
      isGameOver = false;
      nextPiece = getRandomPiece();
      spawnPiece();
    }

    function getRandomPiece() {
      const p = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      return {
        matrix: p.matrix.map(row => [...row]),
        color: p.color,
        id: p.id
      };
    }

    function spawnPiece() {
      currentPiece = nextPiece || getRandomPiece();
      nextPiece = getRandomPiece();
      currentPiece.x = Math.floor((COLS - currentPiece.matrix[0].length) / 2);
      currentPiece.y = 0;

      if (collides(currentPiece.matrix, currentPiece.x, currentPiece.y)) {
        isGameOver = true;
        isRunning = false;
        if (audio && audio.playBeep) audio.playBeep(180, 0.3, 'sawtooth', 0.05);
        if (score > hiScore) {
          hiScore = score;
          localStorage.setItem('minus_tetris_hi', String(hiScore));
        }
      }
    }

    function collides(matrix, posX, posY) {
      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c]) {
            const newX = posX + c;
            const newY = posY + r;
            if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
            if (newY >= 0 && grid[newY][newX]) return true;
          }
        }
      }
      return false;
    }

    function rotate(matrix) {
      return matrix[0].map((_, i) => matrix.map(row => row[i]).reverse());
    }

    function merge() {
      currentPiece.matrix.forEach((row, r) => {
        row.forEach((val, c) => {
          if (val) {
            const gy = currentPiece.y + r;
            const gx = currentPiece.x + c;
            if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS) {
              grid[gy][gx] = currentPiece.color;
            }
          }
        });
      });

      // Clear lines
      let cleared = 0;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (grid[r].every(cell => cell !== 0)) {
          grid.splice(r, 1);
          grid.unshift(Array(COLS).fill(0));
          cleared++;
          r++; // check same row index again
        }
      }

      if (cleared > 0) {
        const points = [0, 100, 300, 500, 800];
        score += (points[cleared] || 100);
        lines += cleared;
        if (audio && audio.playCoinSound) audio.playCoinSound();
        if (score > hiScore) {
          hiScore = score;
          localStorage.setItem('minus_tetris_hi', String(hiScore));
        }
        if (dropInterval > 220) {
          dropInterval -= cleared * 20;
        }
      } else {
        if (audio && audio.playBeep) audio.playBeep(440, 0.04, 'square', 0.02);
      }

      spawnPiece();
    }

    function drop() {
      if (!currentPiece) return;
      if (!collides(currentPiece.matrix, currentPiece.x, currentPiece.y + 1)) {
        currentPiece.y++;
      } else {
        merge();
      }
    }

    function render() {
      ctx.fillStyle = '#faf8f2';
      ctx.fillRect(0, 0, W, H);

      // Playfield Border
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(GRID_X, GRID_Y, GRID_W, GRID_H);
      ctx.strokeStyle = '#1f1d16';
      ctx.lineWidth = 3;
      ctx.strokeRect(GRID_X, GRID_Y, GRID_W, GRID_H);

      // Draw Grid Background lines
      ctx.strokeStyle = '#eae6d9';
      ctx.lineWidth = 1;
      for (let c = 1; c < COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(GRID_X + c * BLOCK, GRID_Y);
        ctx.lineTo(GRID_X + c * BLOCK, GRID_Y + GRID_H);
        ctx.stroke();
      }
      for (let r = 1; r < ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(GRID_X, GRID_Y + r * BLOCK);
        ctx.lineTo(GRID_X + GRID_W, GRID_Y + r * BLOCK);
        ctx.stroke();
      }

      // Draw Placed Blocks
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (grid[r][c]) {
            drawBlock(GRID_X + c * BLOCK, GRID_Y + r * BLOCK, grid[r][c]);
          }
        }
      }

      // Draw Current Falling Piece
      if (currentPiece) {
        currentPiece.matrix.forEach((row, r) => {
          row.forEach((val, c) => {
            if (val) {
              const bx = GRID_X + (currentPiece.x + c) * BLOCK;
              const by = GRID_Y + (currentPiece.y + r) * BLOCK;
              if (by >= GRID_Y) {
                drawBlock(bx, by, currentPiece.color);
              }
            }
          });
        });
      }

      // Sidebar info
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.fillStyle = '#1f1d16';
      ctx.fillText('SCORE', 24, GRID_Y + 24);
      ctx.fillStyle = '#007769';
      ctx.fillText(String(score).padStart(5, '0'), 24, GRID_Y + 44);

      ctx.fillStyle = '#1f1d16';
      ctx.fillText('LINES', 24, GRID_Y + 76);
      ctx.fillStyle = '#f59e0b';
      ctx.fillText(String(lines).padStart(3, '0'), 24, GRID_Y + 96);

      // Next Piece Preview Box
      const nextBoxX = W - GRID_X + 18;
      ctx.fillStyle = '#1f1d16';
      ctx.fillText('NEXT', nextBoxX, GRID_Y + 24);
      ctx.strokeStyle = '#1f1d16';
      ctx.lineWidth = 2;
      ctx.strokeRect(nextBoxX, GRID_Y + 36, 70, 70);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(nextBoxX, GRID_Y + 36, 70, 70);

      if (nextPiece) {
        const nr = nextPiece.matrix.length;
        const nc = nextPiece.matrix[0].length;
        const offX = nextBoxX + Math.floor((70 - nc * 12) / 2);
        const offY = GRID_Y + 36 + Math.floor((70 - nr * 12) / 2);
        nextPiece.matrix.forEach((row, r) => {
          row.forEach((val, c) => {
            if (val) {
              ctx.fillStyle = nextPiece.color;
              ctx.fillRect(offX + c * 12, offY + r * 12, 11, 11);
              ctx.strokeStyle = '#1f1d16';
              ctx.lineWidth = 1;
              ctx.strokeRect(offX + c * 12, offY + r * 12, 11, 11);
            }
          });
        });
      }
    }

    function drawBlock(x, y, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x + 1, y + 1, BLOCK - 2, BLOCK - 2);
      ctx.strokeStyle = '#1f1d16';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 1, y + 1, BLOCK - 2, BLOCK - 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(x + 2, y + 2, BLOCK - 4, 3);
    }

    return {
      name: '🧩 BLOCK STACKER // TETRIS',
      start() {
        reset();
        isRunning = true;
      },
      stop() {
        isRunning = false;
      },
      tick(timestamp) {
        if (isRunning) {
          if (timestamp - lastDrop > dropInterval) {
            lastDrop = timestamp;
            drop();
          }
        }
        render();
        return {
          score: score,
          hiScore: hiScore,
          isGameOver: isGameOver,
          isRunning: isRunning
        };
      },
      handleInput(key) {
        if (!isRunning || !currentPiece) return;
        if (key === 'ArrowLeft' || key === 'KeyA' || key === 'a') {
          if (!collides(currentPiece.matrix, currentPiece.x - 1, currentPiece.y)) {
            currentPiece.x--;
            if (audio && audio.playBeep) audio.playBeep(520, 0.03, 'square', 0.02);
          }
        } else if (key === 'ArrowRight' || key === 'KeyD' || key === 'd') {
          if (!collides(currentPiece.matrix, currentPiece.x + 1, currentPiece.y)) {
            currentPiece.x++;
            if (audio && audio.playBeep) audio.playBeep(520, 0.03, 'square', 0.02);
          }
        } else if (key === 'ArrowUp' || key === 'Space' || key === 'w' || key === 'KeyW') {
          const rotated = rotate(currentPiece.matrix);
          if (!collides(rotated, currentPiece.x, currentPiece.y)) {
            currentPiece.matrix = rotated;
            if (audio && audio.playBeep) audio.playBeep(640, 0.04, 'square', 0.03);
          }
        } else if (key === 'ArrowDown' || key === 'KeyS' || key === 's') {
          drop();
        }
      }
    };
  };
})();
