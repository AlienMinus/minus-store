// Retro Pixel Highway Racer Game Engine (8-Bit Pixelatte Style)
window.RacerGame = (function () {
  return function createRacerGame(canvas, audio) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    const ROAD_W = 280;
    const ROAD_L = (W - ROAD_W) / 2;
    const ROAD_R = ROAD_L + ROAD_W;
    const LANES = [ROAD_L + 46, ROAD_L + 140, ROAD_L + 234];

    const CAR_W = 28;
    const CAR_H = 46;

    let currentLane = 1; // 0, 1, 2
    let playerX = LANES[currentLane] - CAR_W / 2;
    let targetX = playerX;
    let playerY = H - 64;

    let roadOffset = 0;
    let speed = 5.2;
    let score = 0;
    let hiScore = parseInt(localStorage.getItem('minus_racer_hi') || '850', 10);
    let isRunning = false;
    let isGameOver = false;

    let traffic = [];
    let items = [];
    let roadsideTrees = [];

    function reset() {
      currentLane = 1;
      playerX = LANES[currentLane] - CAR_W / 2;
      targetX = playerX;
      roadOffset = 0;
      speed = 5.2;
      score = 0;
      isGameOver = false;
      traffic = [];
      items = [];
      roadsideTrees = [];

      for (let y = -40; y < H + 60; y += 60) {
        roadsideTrees.push({ y, leftSide: true });
        roadsideTrees.push({ y: y + 30, leftSide: false });
      }
    }

    function spawnTraffic() {
      const laneIdx = Math.floor(Math.random() * 3);
      const laneX = LANES[laneIdx] - CAR_W / 2;
      // Ensure no overlap with existing traffic near spawn
      const hasClose = traffic.some((t) => Math.abs(t.y - -60) < 120 && t.lane === laneIdx);
      if (!hasClose) {
        const types = [
          { color: '#007769', speedMul: 0.65 },
          { color: '#c90057', speedMul: 0.8 },
          { color: '#1f1d16', speedMul: 0.5 }
        ];
        const chosen = types[Math.floor(Math.random() * types.length)];
        traffic.push({
          x: laneX,
          y: -60,
          lane: laneIdx,
          w: CAR_W,
          h: CAR_H,
          color: chosen.color,
          speed: speed * chosen.speedMul
        });
      }
    }

    function spawnItem() {
      const laneIdx = Math.floor(Math.random() * 3);
      items.push({
        x: LANES[laneIdx] - 8,
        y: -30,
        w: 16,
        h: 16
      });
    }

    function update() {
      // Smooth steering interpolation
      playerX += (targetX - playerX) * 0.28;

      roadOffset = (roadOffset + speed) % 40;

      // Update roadside trees
      roadsideTrees.forEach((tr) => {
        tr.y += speed;
        if (tr.y > H + 40) tr.y = -40;
      });

      // Spawn traffic
      if (Math.random() < 0.024) {
        spawnTraffic();
      }
      // Spawn fuel items
      if (Math.random() < 0.012) {
        spawnItem();
      }

      // Update & check traffic
      for (let i = traffic.length - 1; i >= 0; i--) {
        const t = traffic[i];
        t.y += speed - t.speed + 1.2;

        // Collision check
        const pBox = { l: playerX + 3, r: playerX + CAR_W - 3, t: playerY + 3, b: playerY + CAR_H - 3 };
        const tBox = { l: t.x + 3, r: t.x + t.w - 3, t: t.y + 3, b: t.y + t.h - 3 };

        if (pBox.r > tBox.l && pBox.l < tBox.r && pBox.b > tBox.t && pBox.t < tBox.b) {
          isGameOver = true;
          isRunning = false;
          if (audio && audio.playBeep) audio.playBeep(160, 0.35, 'sawtooth', 0.06);
          if (score > hiScore) {
            hiScore = Math.floor(score);
            localStorage.setItem('minus_racer_hi', String(hiScore));
          }
          return;
        }

        if (t.y > H + 60) {
          traffic.splice(i, 1);
        }
      }

      // Update & check items (Coins/Fuel)
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        it.y += speed;

        if (
          playerX < it.x + it.w &&
          playerX + CAR_W > it.x &&
          playerY < it.y + it.h &&
          playerY + CAR_H > it.y
        ) {
          score += 150;
          if (audio && audio.playCoinSound) audio.playCoinSound();
          items.splice(i, 1);
          continue;
        }

        if (it.y > H + 20) {
          items.splice(i, 1);
        }
      }

      // Distance score increment
      score += 0.25;
      if (speed < 9.5) {
        speed += 0.0006;
      }
    }

    function drawPixelCar(c, x, y, color, isPlayer = false) {
      c.save();
      const px = Math.round(x);
      const py = Math.round(y);

      // Car Shadow
      c.fillStyle = 'rgba(31, 29, 22, 0.25)';
      c.fillRect(px + 3, py + 4, CAR_W, CAR_H);

      // Wheels
      c.fillStyle = '#1f1d16';
      c.fillRect(px - 2, py + 6, 4, 10);
      c.fillRect(px + CAR_W - 2, py + 6, 4, 10);
      c.fillRect(px - 2, py + CAR_H - 16, 4, 10);
      c.fillRect(px + CAR_W - 2, py + CAR_H - 16, 4, 10);

      // Body
      c.fillStyle = color;
      c.fillRect(px + 2, py, CAR_W - 4, CAR_H);
      c.strokeStyle = '#1f1d16';
      c.lineWidth = 2;
      c.strokeRect(px + 2, py, CAR_W - 4, CAR_H);

      // Windshield
      c.fillStyle = '#ffffff';
      c.fillRect(px + 5, py + 11, CAR_W - 10, 8);
      // Rear windshield
      c.fillRect(px + 5, py + CAR_H - 15, CAR_W - 10, 6);

      // Roof
      c.fillStyle = isPlayer ? '#d97706' : '#1f1d16';
      c.fillRect(px + 6, py + 20, CAR_W - 12, 9);

      // Headlights / Taillights
      if (isPlayer) {
        c.fillStyle = '#fef08a';
        c.fillRect(px + 4, py + 1, 4, 3);
        c.fillRect(px + CAR_W - 8, py + 1, 4, 3);
      } else {
        c.fillStyle = '#ef4444';
        c.fillRect(px + 4, py + CAR_H - 3, 4, 2);
        c.fillRect(px + CAR_W - 8, py + CAR_H - 3, 4, 2);
      }

      c.restore();
    }

    function render() {
      // Background grass
      ctx.fillStyle = '#eae6d9';
      ctx.fillRect(0, 0, W, H);

      // Road shoulders
      ctx.fillStyle = '#ded9c8';
      ctx.fillRect(ROAD_L - 10, 0, ROAD_W + 20, H);

      // Asphalt Road
      ctx.fillStyle = '#faf8f2';
      ctx.fillRect(ROAD_L, 0, ROAD_W, H);
      ctx.strokeStyle = '#1f1d16';
      ctx.lineWidth = 3;
      ctx.strokeRect(ROAD_L, -2, ROAD_W, H + 4);

      // Dashed lane lines
      ctx.fillStyle = '#f59e0b';
      for (let y = -40 + roadOffset; y < H; y += 40) {
        ctx.fillRect(ROAD_L + 92, y, 4, 20);
        ctx.fillRect(ROAD_L + 184, y, 4, 20);
      }

      // Roadside trees / posts
      roadsideTrees.forEach((tr) => {
        const tx = tr.leftSide ? ROAD_L - 32 : ROAD_R + 18;
        ctx.fillStyle = '#008744';
        ctx.fillRect(tx, tr.y, 14, 14);
        ctx.fillStyle = '#1f1d16';
        ctx.fillRect(tx + 5, tr.y + 14, 4, 6);
      });

      // Fuel items / coins
      items.forEach((it) => {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(it.x, it.y, it.w, it.h);
        ctx.strokeStyle = '#1f1d16';
        ctx.lineWidth = 2;
        ctx.strokeRect(it.x, it.y, it.w, it.h);
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px "Press Start 2P"';
        ctx.fillText('⚡', it.x + 2, it.y + 12);
      });

      // Traffic
      traffic.forEach((t) => {
        drawPixelCar(ctx, t.x, t.y, t.color, false);
      });

      // Player Car (Golden Yellow Racer)
      drawPixelCar(ctx, playerX, playerY, '#f59e0b', true);

      // Dashboard HUD info on sides
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.fillStyle = '#1f1d16';
      ctx.fillText(`SPEED`, 20, 40);
      ctx.fillStyle = '#007769';
      ctx.fillText(`${Math.round(speed * 18)} KMH`, 20, 58);

      ctx.fillStyle = '#1f1d16';
      ctx.fillText(`NITRO`, 20, 90);
      ctx.fillStyle = '#f59e0b';
      ctx.fillText(`READY`, 20, 108);

      ctx.fillStyle = '#1f1d16';
      ctx.fillText(`DIST`, W - 80, 40);
      ctx.fillStyle = '#c90057';
      ctx.fillText(`${Math.floor(score)}M`, W - 80, 58);
    }

    return {
      name: '🏎 PIXEL RACER // HIGHWAY DODGE',
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
          score: Math.floor(score),
          hiScore: hiScore,
          isGameOver: isGameOver,
          isRunning: isRunning
        };
      },
      handleInput(key) {
        if (key === 'ArrowLeft' || key === 'KeyA' || key === 'a') {
          if (currentLane > 0) {
            currentLane--;
            targetX = LANES[currentLane] - CAR_W / 2;
            if (audio && audio.playBeep) audio.playBeep(480, 0.04, 'square', 0.03);
          }
        } else if (key === 'ArrowRight' || key === 'KeyD' || key === 'd') {
          if (currentLane < 2) {
            currentLane++;
            targetX = LANES[currentLane] - CAR_W / 2;
            if (audio && audio.playBeep) audio.playBeep(480, 0.04, 'square', 0.03);
          }
        } else if (key === 'ArrowUp' || key === 'Space' || key === 'w') {
          // Nitro burst
          if (speed < 10) speed += 0.8;
          if (audio && audio.playBeep) audio.playBeep(880, 0.06, 'sawtooth', 0.04);
        }
      }
    };
  };
})();
