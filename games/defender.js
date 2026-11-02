// Retro Space Defender / Invaders Game Engine (8-Bit Pixelatte Style)
window.DefenderGame = (function () {
  return function createDefenderGame(canvas, audio) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    const CANNON_W = 32;
    const CANNON_H = 18;

    let cannonX = (W - CANNON_W) / 2;
    let lasers = [];
    let aliens = [];
    let alienDir = 1;
    let alienStepDown = false;
    let lastAlienMove = 0;
    let alienSpeed = 480; // ms per step

    let score = 0;
    let hiScore = parseInt(localStorage.getItem('minus_defender_hi') || '600', 10);
    let isRunning = false;
    let isGameOver = false;

    function reset() {
      cannonX = (W - CANNON_W) / 2;
      lasers = [];
      score = 0;
      alienDir = 1;
      alienSpeed = 480;
      isGameOver = false;
      initAliens();
    }

    function initAliens() {
      aliens = [];
      const rows = 3;
      const cols = 8;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          aliens.push({
            x: 40 + c * 52,
            y: 35 + r * 30,
            w: 24,
            h: 18,
            alive: true,
            type: r % 2 === 0 ? 'invader' : 'squid',
            anim: 0
          });
        }
      }
    }

    function fireLaser() {
      if (lasers.length < 3) {
        lasers.push({
          x: cannonX + CANNON_W / 2 - 2,
          y: H - 32,
          w: 4,
          h: 10
        });
        if (audio && audio.playBeep) audio.playBeep(920, 0.05, 'square', 0.03);
      }
    }

    function update(timestamp) {
      // 1. Move Lasers
      for (let i = lasers.length - 1; i >= 0; i--) {
        const l = lasers[i];
        l.y -= 7;
        if (l.y < -10) {
          lasers.splice(i, 1);
          continue;
        }

        // Check alien hit
        for (let a of aliens) {
          if (a.alive && l.x > a.x && l.x < a.x + a.w && l.y > a.y && l.y < a.y + a.h) {
            a.alive = false;
            lasers.splice(i, 1);
            score += 25;
            if (audio && audio.playBeep) audio.playBeep(1200, 0.06, 'triangle', 0.04);
            if (score > hiScore) {
              hiScore = score;
              localStorage.setItem('minus_defender_hi', String(hiScore));
            }
            break;
          }
        }
      }

      // 2. Move Aliens on Tick
      if (timestamp - lastAlienMove > alienSpeed) {
        lastAlienMove = timestamp;
        let hitEdge = false;

        aliens.forEach((a) => {
          if (!a.alive) return;
          a.anim = 1 - a.anim;
          if ((alienDir > 0 && a.x + a.w >= W - 20) || (alienDir < 0 && a.x <= 20)) {
            hitEdge = true;
          }
        });

        if (hitEdge) {
          alienDir = -alienDir;
          aliens.forEach((a) => {
            a.y += 14;
            if (a.alive && a.y + a.h >= H - 40) {
              // Alien touched ground
              isRunning = false;
              isGameOver = true;
              if (audio && audio.playBeep) audio.playBeep(180, 0.25, 'sawtooth', 0.05);
            }
          });
          alienSpeed = Math.max(120, alienSpeed - 30);
        } else {
          aliens.forEach((a) => (a.x += alienDir * 12));
        }
      }

      // 3. Check Level Clear
      const remaining = aliens.filter((a) => a.alive).length;
      if (remaining === 0) {
        initAliens();
        alienSpeed = Math.max(100, alienSpeed - 50);
      }
    }

    function render() {
      ctx.fillStyle = '#faf8f2';
      ctx.fillRect(0, 0, W, H);

      // Draw Aliens
      aliens.forEach((a) => {
        if (!a.alive) return;
        ctx.fillStyle = a.type === 'invader' ? '#c90057' : '#007769';
        const ax = Math.round(a.x);
        const ay = Math.round(a.y);

        // Pixel Alien shape
        ctx.fillRect(ax + 4, ay, 16, 12);
        ctx.fillRect(ax, ay + 4, 24, 6);
        // Eyes
        ctx.fillStyle = '#faf8f2';
        ctx.fillRect(ax + 6, ay + 4, 3, 3);
        ctx.fillRect(ax + 15, ay + 4, 3, 3);

        // Antennae / tentacles
        ctx.fillStyle = a.type === 'invader' ? '#c90057' : '#007769';
        if (a.anim === 0) {
          ctx.fillRect(ax + 2, ay + 12, 4, 4);
          ctx.fillRect(ax + 18, ay + 12, 4, 4);
        } else {
          ctx.fillRect(ax + 6, ay + 12, 4, 4);
          ctx.fillRect(ax + 14, ay + 12, 4, 4);
        }
      });

      // Draw Lasers
      ctx.fillStyle = '#f59e0b';
      lasers.forEach((l) => {
        ctx.fillRect(Math.round(l.x), Math.round(l.y), l.w, l.h);
      });

      // Draw Cannon
      const px = Math.round(cannonX);
      const py = H - 24;
      ctx.fillStyle = '#1f1d16';
      ctx.fillRect(px + 4, py, CANNON_W - 8, CANNON_H);
      ctx.fillRect(px + 12, py - 6, 8, 8);
      ctx.fillRect(px, py + 10, CANNON_W, 8);
    }

    return {
      name: '👾 SPACE DEFENDER // 8-BIT',
      start() {
        reset();
        isRunning = true;
      },
      stop() {
        isRunning = false;
      },
      tick(timestamp) {
        if (isRunning) update(timestamp);
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
          cannonX = Math.max(10, cannonX - 22);
        } else if (key === 'ArrowRight' || key === 'KeyD' || key === 'd') {
          cannonX = Math.min(W - CANNON_W - 10, cannonX + 22);
        } else if (key === 'Space' || key === ' ' || key === 'ArrowUp') {
          fireLaser();
        }
      }
    };
  };
})();
