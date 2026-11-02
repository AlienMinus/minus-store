// Retro Snake Game Engine (8-Bit Pixelatte Style)
window.SnakeGame = (function () {
  return function createSnakeGame(canvas, audio) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const CELL = 20;
    const COLS = Math.floor(W / CELL);
    const ROWS = Math.floor(H / CELL);

    let snake = [];
    let dir = { x: 1, y: 0 };
    let nextDir = { x: 1, y: 0 };
    let food = { x: 5, y: 5 };
    let score = 0;
    let hiScore = parseInt(localStorage.getItem('minus_snake_hi') || '250', 10);
    let speed = 120; // ms per tick
    let lastTick = 0;
    let isRunning = false;
    let isGameOver = false;

    function reset() {
      const startX = Math.floor(COLS / 3);
      const startY = Math.floor(ROWS / 2);
      snake = [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY }
      ];
      dir = { x: 1, y: 0 };
      nextDir = { x: 1, y: 0 };
      score = 0;
      speed = 120;
      isGameOver = false;
      spawnFood();
    }

    function spawnFood() {
      let valid = false;
      while (!valid) {
        food = {
          x: Math.floor(Math.random() * (COLS - 2)) + 1,
          y: Math.floor(Math.random() * (ROWS - 2)) + 1
        };
        valid = !snake.some((seg) => seg.x === food.x && seg.y === food.y);
      }
    }

    function update() {
      dir = nextDir;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

      // Wall collision check
      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
        gameOver();
        return;
      }

      // Self collision check
      if (snake.some((seg) => seg.x === head.x && seg.y === head.y)) {
        gameOver();
        return;
      }

      snake.unshift(head);

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        score += 10;
        if (audio && audio.playBeep) audio.playBeep(880, 0.08, 'square', 0.04);
        if (score > hiScore) {
          hiScore = score;
          localStorage.setItem('minus_snake_hi', String(hiScore));
        }
        spawnFood();
        // Speed up slightly as snake grows
        if (speed > 60) speed -= 2;
      } else {
        snake.pop();
      }
    }

    function gameOver() {
      isRunning = false;
      isGameOver = true;
      if (audio && audio.playBeep) audio.playBeep(180, 0.25, 'sawtooth', 0.05);
    }

    function render() {
      ctx.fillStyle = '#faf8f2';
      ctx.fillRect(0, 0, W, H);

      // Draw subtle grid dots
      ctx.fillStyle = '#eae6d9';
      for (let x = 0; x < COLS; x++) {
        for (let y = 0; y < ROWS; y++) {
          ctx.fillRect(x * CELL + 9, y * CELL + 9, 2, 2);
        }
      }

      // Draw Food (Pixel Cherry/Apple)
      const fx = food.x * CELL;
      const fy = food.y * CELL;
      ctx.fillStyle = '#c90057';
      ctx.fillRect(fx + 3, fy + 4, 14, 13);
      // Apple stem
      ctx.fillStyle = '#008744';
      ctx.fillRect(fx + 9, fy + 1, 3, 4);

      // Draw Snake
      snake.forEach((seg, i) => {
        const sx = seg.x * CELL;
        const sy = seg.y * CELL;
        if (i === 0) {
          // Snake Head
          ctx.fillStyle = '#1f1d16';
          ctx.fillRect(sx + 2, sy + 2, CELL - 4, CELL - 4);
          // Eyes
          ctx.fillStyle = '#f59e0b';
          if (dir.x === 1) {
            ctx.fillRect(sx + 12, sy + 4, 3, 3);
            ctx.fillRect(sx + 12, sy + 13, 3, 3);
          } else if (dir.x === -1) {
            ctx.fillRect(sx + 4, sy + 4, 3, 3);
            ctx.fillRect(sx + 4, sy + 13, 3, 3);
          } else if (dir.y === 1) {
            ctx.fillRect(sx + 4, sy + 12, 3, 3);
            ctx.fillRect(sx + 13, sy + 12, 3, 3);
          } else {
            ctx.fillRect(sx + 4, sy + 4, 3, 3);
            ctx.fillRect(sx + 13, sy + 4, 3, 3);
          }
        } else {
          // Snake Body
          ctx.fillStyle = i % 2 === 0 ? '#007769' : '#008744';
          ctx.fillRect(sx + 3, sy + 3, CELL - 6, CELL - 6);
        }
      });
    }

    return {
      name: '🐍 RETRO SNAKE // 8-BIT',
      start() {
        reset();
        isRunning = true;
      },
      stop() {
        isRunning = false;
      },
      tick(timestamp) {
        if (isRunning && timestamp - lastTick > speed) {
          lastTick = timestamp;
          update();
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
        if (key === 'ArrowUp' || key === 'KeyW' || key === 'w') {
          if (dir.y === 0) nextDir = { x: 0, y: -1 };
        } else if (key === 'ArrowDown' || key === 'KeyS' || key === 's') {
          if (dir.y === 0) nextDir = { x: 0, y: 1 };
        } else if (key === 'ArrowLeft' || key === 'KeyA' || key === 'a') {
          if (dir.x === 0) nextDir = { x: -1, y: 0 };
        } else if (key === 'ArrowRight' || key === 'KeyD' || key === 'd') {
          if (dir.x === 0) nextDir = { x: 1, y: 0 };
        }
      }
    };
  };
})();
