// Retro Pixel Pong Game Engine (8-Bit Pixelatte Style)
window.PongGame = (function () {
  return function createPongGame(canvas, audio) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    const PADDLE_W = 12;
    const PADDLE_H = 64;
    const BALL_SIZE = 10;
    const WIN_SCORE = 7;

    let playerY = (H - PADDLE_H) / 2;
    let cpuY = (H - PADDLE_H) / 2;
    let ballX = W / 2;
    let ballY = H / 2;
    let ballVx = 4.2;
    let ballVy = 2.4;

    let playerScore = 0;
    let cpuScore = 0;
    let rallyCount = 0;
    let hiRally = parseInt(localStorage.getItem('minus_pong_hi') || '12', 10);

    let isRunning = false;
    let isGameOver = false;
    let playerMove = 0; // -1 up, 1 down, 0 still
    let resultMsg = '';

    function reset() {
      playerY = (H - PADDLE_H) / 2;
      cpuY = (H - PADDLE_H) / 2;
      playerScore = 0;
      cpuScore = 0;
      rallyCount = 0;
      isGameOver = false;
      resultMsg = '';
      resetBall(1);
    }

    function resetBall(direction = 1) {
      ballX = W / 2;
      ballY = H / 2;
      const angle = (Math.random() * 0.8 - 0.4); // slightly randomized vertical velocity
      const speed = 4.5;
      ballVx = direction * speed;
      ballVy = speed * Math.sin(angle);
    }

    function update() {
      // 1. Move Player Paddle
      const playerSpeed = 6;
      playerY += playerMove * playerSpeed;
      if (playerY < 10) playerY = 10;
      if (playerY > H - PADDLE_H - 10) playerY = H - PADDLE_H - 10;

      // 2. AI CPU Paddle Tracking (with smooth human-like latency)
      const cpuCenter = cpuY + PADDLE_H / 2;
      const targetY = ballY;
      const cpuSpeed = 3.8;
      if (ballVx > 0) { // Only track actively when ball is approaching CPU
        if (cpuCenter < targetY - 12) {
          cpuY += Math.min(cpuSpeed, targetY - cpuCenter);
        } else if (cpuCenter > targetY + 12) {
          cpuY -= Math.min(cpuSpeed, cpuCenter - targetY);
        }
      } else {
        // Return gently to center
        const screenCenter = H / 2;
        if (cpuCenter < screenCenter - 15) cpuY += 1.5;
        else if (cpuCenter > screenCenter + 15) cpuY -= 1.5;
      }
      if (cpuY < 10) cpuY = 10;
      if (cpuY > H - PADDLE_H - 10) cpuY = H - PADDLE_H - 10;

      // 3. Move Ball
      ballX += ballVx;
      ballY += ballVy;

      // Top & Bottom Wall Bounce
      if (ballY <= 10) {
        ballY = 10;
        ballVy = -ballVy;
        if (audio && audio.playBeep) audio.playBeep(440, 0.04, 'square', 0.03);
      } else if (ballY >= H - 10 - BALL_SIZE) {
        ballY = H - 10 - BALL_SIZE;
        ballVy = -ballVy;
        if (audio && audio.playBeep) audio.playBeep(440, 0.04, 'square', 0.03);
      }

      // 4. Player Paddle Collision (Left: x = 24)
      const pX = 24;
      if (ballX <= pX + PADDLE_W && ballX + BALL_SIZE >= pX) {
        if (ballY + BALL_SIZE >= playerY && ballY <= playerY + PADDLE_H) {
          ballX = pX + PADDLE_W;
          // Calculate deflection based on hit position
          const hitOffset = (ballY + BALL_SIZE / 2 - (playerY + PADDLE_H / 2)) / (PADDLE_H / 2);
          const speed = Math.min(8.5, Math.hypot(ballVx, ballVy) + 0.25);
          ballVx = Math.abs(speed * Math.cos(hitOffset * 0.8));
          ballVy = speed * Math.sin(hitOffset * 0.8);
          rallyCount++;
          if (rallyCount > hiRally) {
            hiRally = rallyCount;
            localStorage.setItem('minus_pong_hi', String(hiRally));
          }
          if (audio && audio.playBeep) audio.playBeep(660, 0.06, 'square', 0.04);
        }
      }

      // 5. CPU Paddle Collision (Right: x = W - 36)
      const cX = W - 36;
      if (ballX + BALL_SIZE >= cX && ballX <= cX + PADDLE_W) {
        if (ballY + BALL_SIZE >= cpuY && ballY <= cpuY + PADDLE_H) {
          ballX = cX - BALL_SIZE;
          const hitOffset = (ballY + BALL_SIZE / 2 - (cpuY + PADDLE_H / 2)) / (PADDLE_H / 2);
          const speed = Math.min(8.5, Math.hypot(ballVx, ballVy) + 0.25);
          ballVx = -Math.abs(speed * Math.cos(hitOffset * 0.8));
          ballVy = speed * Math.sin(hitOffset * 0.8);
          rallyCount++;
          if (audio && audio.playBeep) audio.playBeep(520, 0.06, 'square', 0.04);
        }
      }

      // 6. Point Scored
      if (ballX < 0) {
        // CPU scores
        cpuScore++;
        rallyCount = 0;
        if (audio && audio.playBeep) audio.playBeep(220, 0.15, 'sawtooth', 0.04);
        if (cpuScore >= WIN_SCORE) {
          isGameOver = true;
          isRunning = false;
          resultMsg = 'CPU WINS MATCH!';
        } else {
          resetBall(1);
        }
      } else if (ballX > W) {
        // Player scores!
        playerScore++;
        if (audio && audio.playCoinSound) audio.playCoinSound();
        if (playerScore >= WIN_SCORE) {
          isGameOver = true;
          isRunning = false;
          resultMsg = 'YOU WIN MATCH!';
        } else {
          resetBall(-1);
        }
      }
    }

    function render() {
      // Retro court background
      ctx.fillStyle = '#faf8f2';
      ctx.fillRect(0, 0, W, H);

      // Court outer boundary lines
      ctx.strokeStyle = '#1f1d16';
      ctx.lineWidth = 3;
      ctx.strokeRect(8, 8, W - 16, H - 16);

      // Center dashed net
      ctx.strokeStyle = '#ded9c8';
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(W / 2, 8);
      ctx.lineTo(W / 2, H - 8);
      ctx.stroke();
      ctx.setLineDash([]);

      // Scores (Pixel display)
      ctx.font = '28px "Press Start 2P", monospace';
      ctx.fillStyle = '#f59e0b';
      ctx.textAlign = 'center';
      ctx.fillText(String(playerScore), W / 2 - 60, 48);
      ctx.fillStyle = '#c90057';
      ctx.fillText(String(cpuScore), W / 2 + 60, 48);

      // Labels
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = '#777265';
      ctx.fillText('1P [YOU]', W / 2 - 60, 64);
      ctx.fillText('2P [CPU]', W / 2 + 60, 64);

      // Rally indicator
      ctx.fillText(`RALLY: ${rallyCount}`, W / 2, H - 18);

      // Left Paddle (Player - Golden Amber)
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(24, Math.round(playerY), PADDLE_W, PADDLE_H);
      ctx.strokeStyle = '#1f1d16';
      ctx.lineWidth = 2;
      ctx.strokeRect(24, Math.round(playerY), PADDLE_W, PADDLE_H);

      // Right Paddle (CPU - Crimson)
      ctx.fillStyle = '#c90057';
      ctx.fillRect(W - 36, Math.round(cpuY), PADDLE_W, PADDLE_H);
      ctx.strokeRect(W - 36, Math.round(cpuY), PADDLE_W, PADDLE_H);

      // Square 8-bit Ball
      ctx.fillStyle = '#1f1d16';
      ctx.fillRect(Math.round(ballX), Math.round(ballY), BALL_SIZE, BALL_SIZE);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(ballX) + 2, Math.round(ballY) + 2, 3, 3);
    }

    return {
      name: '🏓 PIXEL PONG // 1P VS CPU',
      start() {
        reset();
        isRunning = true;
      },
      stop() {
        isRunning = false;
      },
      tick(timestamp) {
        if (isRunning) {
          update();
        }
        render();
        return {
          score: playerScore * 100 + rallyCount * 10,
          hiScore: hiRally * 10 + WIN_SCORE * 100,
          isGameOver: isGameOver,
          isRunning: isRunning,
          customMsg: resultMsg
        };
      },
      handleInput(key) {
        if (key === 'ArrowUp' || key === 'KeyW' || key === 'w') {
          playerMove = -1;
          setTimeout(() => { if (playerMove === -1) playerMove = 0; }, 180);
        } else if (key === 'ArrowDown' || key === 'KeyS' || key === 's') {
          playerMove = 1;
          setTimeout(() => { if (playerMove === 1) playerMove = 0; }, 180);
        }
      }
    };
  };
})();
