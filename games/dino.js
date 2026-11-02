// Retro Dino Runner Game Engine (8-Bit Pixelatte Style)
window.DinoGame = (function () {
  return function createDinoGame(canvas, audio) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const GROUND_Y = H > 200 ? 195 : 124;

    let hiScore = parseInt(localStorage.getItem('minus_dino_hi') || '500', 10);
    let isRunning = false;
    let isGameOver = false;
    let score = 0;
    let speed = 4.6;
    let frameCount = 0;
    let lastMilestone = 0;

    const dino = {
      x: 44,
      y: GROUND_Y - 42,
      w: 34,
      h: 42,
      vy: 0,
      gravity: 0.72,
      jumpForce: -12.8,
      isGrounded: true,
      leg: 0,
      jump() {
        if (this.isGrounded) {
          this.vy = this.jumpForce;
          this.isGrounded = false;
          if (audio && audio.playBeep) audio.playBeep(780, 0.06, 'square', 0.035);
        }
      },
      update() {
        this.vy += this.gravity;
        this.y += this.vy;
        if (this.y >= GROUND_Y - this.h) {
          this.y = GROUND_Y - this.h;
          this.vy = 0;
          this.isGrounded = true;
        }
        if (frameCount % 6 === 0) {
          this.leg = 1 - this.leg;
        }
      },
      draw(c) {
        c.fillStyle = '#1f1d16';
        const px = Math.round(this.x);
        const py = Math.round(this.y);

        // Pixel T-Rex shape
        c.fillRect(px + 16, py, 18, 13);
        c.fillRect(px + 18, py + 13, 13, 5);
        c.fillStyle = '#f7f4ea';
        c.fillRect(px + 20, py + 3, 3, 3);
        c.fillStyle = '#1f1d16';

        c.fillRect(px + 8, py + 10, 14, 18);
        c.fillRect(px + 3, py + 15, 16, 13);
        c.fillRect(px, py + 18, 5, 8);
        c.fillRect(px - 3, py + 15, 4, 5);
        c.fillRect(px + 22, py + 18, 5, 3);
        c.fillRect(px + 25, py + 21, 3, 3);

        if (!this.isGrounded) {
          c.fillRect(px + 8, py + 28, 4, 8);
          c.fillRect(px + 16, py + 28, 4, 8);
        } else if (this.leg === 0) {
          c.fillRect(px + 8, py + 28, 4, 13);
          c.fillRect(px + 8, py + 39, 7, 3);
          c.fillRect(px + 16, py + 28, 4, 7);
        } else {
          c.fillRect(px + 16, py + 28, 4, 13);
          c.fillRect(px + 16, py + 39, 7, 3);
          c.fillRect(px + 8, py + 28, 4, 7);
        }
      }
    };

    let obstacles = [];
    function spawnObstacle() {
      const type = Math.random() > 0.5 ? 'tall' : 'cluster';
      const w = type === 'tall' ? 18 : 32;
      const h = type === 'tall' ? 38 : 28;
      obstacles.push({
        x: W + 10,
        y: GROUND_Y - h,
        w: w,
        h: h,
        type: type
      });
    }

    function drawCactus(c, ob) {
      c.fillStyle = '#007769';
      const ox = Math.round(ob.x);
      const oy = Math.round(ob.y);

      if (ob.type === 'tall') {
        c.fillRect(ox + 5, oy, 8, ob.h);
        c.fillRect(ox, oy + 10, 5, 4);
        c.fillRect(ox, oy + 5, 4, 9);
        c.fillRect(ox + 13, oy + 15, 5, 4);
        c.fillRect(ox + 14, oy + 10, 4, 9);
      } else {
        c.fillRect(ox + 4, oy + 5, 7, ob.h - 5);
        c.fillRect(ox, oy + 12, 4, 8);
        c.fillRect(ox + 17, oy, 7, ob.h);
        c.fillRect(ox + 24, oy + 8, 4, 8);
      }
    }

    let clouds = [
      { x: 140, y: 35, speed: 0.5 },
      { x: 360, y: 55, speed: 0.4 },
      { x: 510, y: 30, speed: 0.6 }
    ];

    function drawCloud(c, cl) {
      c.fillStyle = '#d0c9b4';
      const cx = Math.round(cl.x);
      const cy = Math.round(cl.y);
      c.fillRect(cx + 6, cy, 14, 4);
      c.fillRect(cx + 2, cy + 4, 22, 5);
      c.fillRect(cx, cy + 6, 26, 4);
    }

    let groundOffset = 0;
    function drawGround(c) {
      c.fillStyle = '#1f1d16';
      c.fillRect(0, GROUND_Y, W, 2);

      c.fillStyle = '#777265';
      for (let i = 0; i < W + 30; i += 24) {
        const gx = ((i - groundOffset) % (W + 24) + (W + 24)) % (W + 24) - 10;
        c.fillRect(gx, GROUND_Y + 5, 6, 2);
        if (i % 48 === 0) {
          c.fillRect(gx + 12, GROUND_Y + 8, 3, 2);
        }
      }
    }

    function reset() {
      score = 0;
      speed = 4.6;
      lastMilestone = 0;
      obstacles = [];
      dino.y = GROUND_Y - dino.h;
      dino.vy = 0;
      dino.isGrounded = true;
      isGameOver = false;
      spawnObstacle();
    }

    return {
      name: '🦖 DINO RUNNER // 8-BIT',
      start() {
        reset();
        isRunning = true;
        dino.jump();
      },
      stop() {
        isRunning = false;
      },
      tick() {
        frameCount++;
        ctx.clearRect(0, 0, W, H);

        clouds.forEach((cl) => {
          if (isRunning) {
            cl.x -= cl.speed;
            if (cl.x < -30) cl.x = W + Math.random() * 50;
          }
          drawCloud(ctx, cl);
        });

        if (isRunning) {
          groundOffset = (groundOffset + speed) % 10000;
        }
        drawGround(ctx);

        if (isRunning) {
          dino.update();
        }
        dino.draw(ctx);

        if (isRunning) {
          const lastOb = obstacles[obstacles.length - 1];
          if (!lastOb || lastOb.x < W - (180 + Math.random() * 140)) {
            spawnObstacle();
          }

          for (let i = obstacles.length - 1; i >= 0; i--) {
            const ob = obstacles[i];
            ob.x -= speed;
            drawCactus(ctx, ob);

            const dinoBox = {
              l: dino.x + 4,
              r: dino.x + dino.w - 3,
              t: dino.y + 3,
              b: dino.y + dino.h - 1
            };
            const obBox = {
              l: ob.x + 3,
              r: ob.x + ob.w - 3,
              t: ob.y + 3,
              b: ob.y + ob.h
            };

            if (
              dinoBox.r > obBox.l &&
              dinoBox.l < obBox.r &&
              dinoBox.b > obBox.t &&
              dinoBox.t < obBox.b
            ) {
              isRunning = false;
              isGameOver = true;
              if (audio && audio.playBeep) audio.playBeep(180, 0.25, 'sawtooth', 0.05);

              if (score > hiScore) {
                hiScore = Math.floor(score);
                localStorage.setItem('minus_dino_hi', String(hiScore));
                if (audio && audio.playCoinSound) audio.playCoinSound();
              }
            }

            if (ob.x < -40) {
              obstacles.splice(i, 1);
            }
          }

          score += 0.14;
          const currentScore = Math.floor(score);

          if (currentScore > 0 && currentScore % 100 === 0 && currentScore !== lastMilestone) {
            lastMilestone = currentScore;
            if (audio && audio.playBeep) audio.playBeep(980, 0.1, 'square', 0.04);
          }

          if (speed < 7.5) {
            speed += 0.0007;
          }
        } else {
          obstacles.forEach((ob) => drawCactus(ctx, ob));
        }

        return {
          score: Math.floor(score),
          hiScore: hiScore,
          isGameOver: isGameOver,
          isRunning: isRunning
        };
      },
      handleInput(key) {
        if (key === 'Space' || key === ' ' || key === 'ArrowUp') {
          if (!isRunning) {
            this.start();
          } else {
            dino.jump();
          }
        }
      }
    };
  };
})();
