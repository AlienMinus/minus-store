// Retro Brick Breaker Game Engine (8-Bit Pixelatte Style)
window.BreakerGame = (function () {
  return function createBreakerGame(canvas, audio) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    const PADDLE_W = 86;
    const PADDLE_H = 12;
    const BALL_R = 5;

    let paddleX = (W - PADDLE_W) / 2;
    let ballX = W / 2;
    let ballY = H - 40;
    let ballVx = 3.5;
    let ballVy = -3.5;
    let isStuck = true;

    let bricks = [];
    let score = 0;
    let hiScore = parseInt(localStorage.getItem('minus_breaker_hi') || '400', 10);
    let isRunning = false;
    let isGameOver = false;

    const BRICK_ROWS = 4;
    const BRICK_COLS = 10;
    const BRICK_PAD = 6;
    const BRICK_TOP = 35;
    const BRICK_W = (W - 40 - (BRICK_COLS - 1) * BRICK_PAD) / BRICK_COLS;
    const BRICK_H = 14;

    const ROW_COLORS = ['#c90057', '#f59e0b', '#007769', '#008744'];
    const ROW_POINTS = [40, 30, 20, 10];

    function reset() {
      paddleX = (W - PADDLE_W) / 2;
      ballX = W / 2;
      ballY = H - 35;
      ballVx = (Math.random() > 0.5 ? 1 : -1) * 3.5;
      ballVy = -3.8;
      isStuck = true;
      score = 0;
      isGameOver = false;
      initBricks();
    }

    function initBricks() {
      bricks = [];
      for (let r = 0; r < BRICK_ROWS; r++) {
        for (let c = 0; c < BRICK_COLS; c++) {
          bricks.push({
            x: 20 + c * (BRICK_W + BRICK_PAD),
            y: BRICK_TOP + r * (BRICK_H + BRICK_PAD),
            w: BRICK_W,
            h: BRICK_H,
            alive: true,
            color: ROW_COLORS[r],
            points: ROW_POINTS[r]
          });
        }
      }
    }

    function update() {
      if (isStuck) {
        ballX = paddleX + PADDLE_W / 2;
        ballY = H - 24;
        return;
      }

      ballX += ballVx;
      ballY += ballVy;

      // Wall reflections
      if (ballX - BALL_R <= 0) {
        ballX = BALL_R;
        ballVx = Math.abs(ballVx);
        if (audio && audio.playBeep) audio.playBeep(520, 0.03, 'square', 0.02);
      } else if (ballX + BALL_R >= W) {
        ballX = W - BALL_R;
        ballVx = -Math.abs(ballVx);
        if (audio && audio.playBeep) audio.playBeep(520, 0.03, 'square', 0.02);
      }

      if (ballY - BALL_R <= 0) {
        ballY = BALL_R;
        ballVy = Math.abs(ballVy);
        if (audio && audio.playBeep) audio.playBeep(520, 0.03, 'square', 0.02);
      }

      // Paddle collision
      const paddleY = H - 18;
      if (
        ballY + BALL_R >= paddleY &&
        ballY - BALL_R <= paddleY + PADDLE_H &&
        ballX >= paddleX - 4 &&
        ballX <= paddleX + PADDLE_W + 4 &&
        ballVy > 0
      ) {
        ballVy = -Math.abs(ballVy);
        // Angle ball based on where it hit the paddle
        const hitOffset = (ballX - (paddleX + PADDLE_W / 2)) / (PADDLE_W / 2);
        ballVx = hitOffset * 4.8;
        if (audio && audio.playBeep) audio.playBeep(680, 0.05, 'square', 0.03);
      }

      // Brick collision
      let activeCount = 0;
      bricks.forEach((b) => {
        if (!b.alive) return;
        activeCount++;

        if (
          ballX + BALL_R > b.x &&
          ballX - BALL_R < b.x + b.w &&
          ballY + BALL_R > b.y &&
          ballY - BALL_R < b.y + b.h
        ) {
          b.alive = false;
          ballVy = -ballVy;
          score += b.points;
          if (audio && audio.playBeep) audio.playBeep(880, 0.06, 'triangle', 0.035);

          if (score > hiScore) {
            hiScore = score;
            localStorage.setItem('minus_breaker_hi', String(hiScore));
          }
        }
      });

      // Clear level reset
      if (activeCount === 0) {
        initBricks();
        isStuck = true;
      }

      // Bottom death
      if (ballY - BALL_R > H) {
        isRunning = false;
        isGameOver = true;
        if (audio && audio.playBeep) audio.playBeep(180, 0.25, 'sawtooth', 0.05);
      }
    }

    function render() {
      ctx.fillStyle = '#faf8f2';
      ctx.fillRect(0, 0, W, H);

      // Draw Bricks
      bricks.forEach((b) => {
        if (!b.alive) return;
        ctx.fillStyle = b.color;
        ctx.fillRect(Math.round(b.x), Math.round(b.y), Math.round(b.w), Math.round(b.h));
        // Pixel border
        ctx.strokeStyle = '#1f1d16';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(Math.round(b.x), Math.round(b.y), Math.round(b.w), Math.round(b.h));
      });

      // Draw Paddle
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(Math.round(paddleX), H - 18, PADDLE_W, PADDLE_H);
      ctx.strokeStyle = '#1f1d16';
      ctx.lineWidth = 2;
      ctx.strokeRect(Math.round(paddleX), H - 18, PADDLE_W, PADDLE_H);

      // Draw Ball
      ctx.fillStyle = '#1f1d16';
      ctx.fillRect(Math.round(ballX - BALL_R), Math.round(ballY - BALL_R), BALL_R * 2, BALL_R * 2);
    }

    return {
      name: '🧱 BRICK BREAKER // 8-BIT',
      start() {
        reset();
        isRunning = true;
      },
      stop() {
        isRunning = false;
      },
      tick() {
        if (isRunning) update();
        render();
        return {
          score: score,
          hiScore: hiScore,
          isGameOver: isGameOver,
          isRunning: isRunning
        };
      },
      handleInput(key) {
        if (key === 'ArrowLeft' || key === 'KeyA' || key === 'a') {
          paddleX = Math.max(0, paddleX - 24);
        } else if (key === 'ArrowRight' || key === 'KeyD' || key === 'd') {
          paddleX = Math.min(W - PADDLE_W, paddleX + 24);
        } else if (key === 'Space' || key === ' ' || key === 'ArrowUp') {
          if (isStuck) isStuck = false;
        }
      }
    };
  };
})();
