// Retro Arcade Interactive Audio & Controls
(function () {
  // --- Search Input Shortcut ---
  const input = document.querySelector('#searchInput');
  if (input) {
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== input) {
        e.preventDefault();
        input.focus();
        playBeep(440, 0.05, 'square');
      }
      if (e.key === 'Escape') {
        input.blur();
      }
    });
  }

  // --- Web Audio 8-bit Arcade Sound Synthesizer ---
  let audioCtx = null;
  let sfxEnabled = localStorage.getItem('minus_arcade_sfx') !== 'false';

  const sfxToggleBtn = document.getElementById('sfxToggle');
  const sfxStatus = document.getElementById('sfxStatus');

  function updateSfxDisplay() {
    if (sfxStatus) {
      sfxStatus.textContent = sfxEnabled ? 'ON' : 'OFF';
      if (sfxToggleBtn) {
        sfxToggleBtn.classList.toggle('sfx-muted', !sfxEnabled);
      }
    }
  }
  updateSfxDisplay();

  if (sfxToggleBtn) {
    sfxToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      initAudio();
      sfxEnabled = !sfxEnabled;
      localStorage.setItem('minus_arcade_sfx', sfxEnabled ? 'true' : 'false');
      updateSfxDisplay();
      if (sfxEnabled) {
        playCoinSound();
      }
    });
  }

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playBeep(frequency = 520, duration = 0.06, type = 'square', vol = 0.04) {
    if (!sfxEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  function playCoinSound() {
    if (!sfxEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      // Classic 2-tone arcade coin: B5 -> E6
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  function playStartChime() {
    if (!sfxEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      [330, 392, 494, 659].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.05, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + (i + 1) * 0.06 + 0.05);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + (i + 1) * 0.06 + 0.05);
      });
    } catch (e) {}
  }

  // --- Attach Sound Effects to Arcade UI Elements ---
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Live Retro Clock in Arcade Topbar
    initLiveClock();

    // 2. Buttons & Filters
    document.querySelectorAll('.filter, .button, .nav-item, .arcade-kbd').forEach((el) => {
      el.addEventListener('mouseenter', () => playBeep(650, 0.03, 'square', 0.02));
      el.addEventListener('click', () => playBeep(880, 0.05, 'square', 0.04));
    });

    // 3. Project Cards
    document.querySelectorAll('.project-card').forEach((card) => {
      card.addEventListener('mouseenter', () => playBeep(520, 0.04, 'triangle', 0.025));
    });

    // 4. Launch & Action Buttons
    document.querySelectorAll('.arcade-launch-btn, .arcade-diagram-btn').forEach((btn) => {
      btn.addEventListener('click', () => playCoinSound());
    });

    // 5. Retro 8-Bit Dino Runner Game (Hero)
    initDinoRunner();

    // 6. Retro Arcade Game Hub (Arcade Page)
    initArcadeHub();
  });

  // ==========================================================================
  // LIVE RETRO ARCADE DATE & TIME CLOCK
  // ==========================================================================
  function initLiveClock() {
    const hudDate = document.getElementById('hudDate');
    const hudDay = document.getElementById('hudDay');
    const hudTime = document.getElementById('hudTime');
    if (!hudDate || !hudTime) return;

    const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    function update() {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mmm = MONTHS[now.getMonth()];
      const yyyy = now.getFullYear();
      const day = DAYS[now.getDay()];
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');

      hudDate.textContent = `${dd} ${mmm} ${yyyy}`;
      if (hudDay) hudDay.textContent = day;
      hudTime.textContent = `${hh}:${mm}:${ss}`;
    }

    update();
    setInterval(update, 1000);
  }

  // ==========================================================================
  // DINO RUNNER ARCADE MINI-GAME
  // ==========================================================================
  function initDinoRunner() {
    const canvas = document.getElementById('dinoCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const overlay = document.getElementById('dinoOverlay');
    const msgTitle = document.getElementById('dinoMsgTitle');
    const msgSub = document.getElementById('dinoMsgSub');
    const scoreEl = document.getElementById('dinoScore');
    const hiScoreEl = document.getElementById('dinoHiScore');
    const jumpBtn = document.getElementById('dinoJumpBtn');
    const container = document.getElementById('dinoContainer');

    const W = canvas.width;
    const H = canvas.height;
    const GROUND_Y = 195;

    let hiScore = parseInt(localStorage.getItem('minus_dino_hi') || '500', 10);
    hiScoreEl.textContent = String(hiScore).padStart(5, '0');

    let state = 'IDLE'; // 'IDLE', 'RUNNING', 'GAMEOVER'
    let score = 0;
    let speed = 4.6;
    let animId = null;
    let frameCount = 0;
    let lastMilestone = 0;

    // Dino Player Object (Scaled for larger canvas)
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
          playBeep(780, 0.06, 'square', 0.035);
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

        // Pixel T-Rex shape (scaled ~1.35x)
        // Head & snout
        c.fillRect(px + 16, py, 18, 13);
        c.fillRect(px + 18, py + 13, 13, 5);
        // Eye (cream dot)
        c.fillStyle = '#f7f4ea';
        c.fillRect(px + 20, py + 3, 3, 3);
        c.fillStyle = '#1f1d16';

        // Body & back
        c.fillRect(px + 8, py + 10, 14, 18);
        c.fillRect(px + 3, py + 15, 16, 13);
        // Tail
        c.fillRect(px, py + 18, 5, 8);
        c.fillRect(px - 3, py + 15, 4, 5);
        // Tiny Arm
        c.fillRect(px + 22, py + 18, 5, 3);
        c.fillRect(px + 25, py + 21, 3, 3);

        // Legs (animated running)
        if (!this.isGrounded) {
          // Both legs tucked
          c.fillRect(px + 8, py + 28, 4, 8);
          c.fillRect(px + 16, py + 28, 4, 8);
        } else if (this.leg === 0) {
          // Left leg down, right leg back
          c.fillRect(px + 8, py + 28, 4, 13);
          c.fillRect(px + 8, py + 39, 7, 3);
          c.fillRect(px + 16, py + 28, 4, 7);
        } else {
          // Right leg down, left leg back
          c.fillRect(px + 16, py + 28, 4, 13);
          c.fillRect(px + 16, py + 39, 7, 3);
          c.fillRect(px + 8, py + 28, 4, 7);
        }
      }
    };

    // Obstacles (Cacti)
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
        // Main stem
        c.fillRect(ox + 5, oy, 8, ob.h);
        // Left arm
        c.fillRect(ox, oy + 10, 5, 4);
        c.fillRect(ox, oy + 5, 4, 9);
        // Right arm
        c.fillRect(ox + 13, oy + 15, 5, 4);
        c.fillRect(ox + 14, oy + 10, 4, 9);
      } else {
        // Double cluster cactus
        c.fillRect(ox + 4, oy + 5, 7, ob.h - 5);
        c.fillRect(ox, oy + 12, 4, 8);
        c.fillRect(ox + 17, oy, 7, ob.h);
        c.fillRect(ox + 24, oy + 8, 4, 8);
      }
    }

    // Clouds
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

    // Ground Dashes
    let groundOffset = 0;
    function drawGround(c) {
      c.fillStyle = '#1f1d16';
      c.fillRect(0, GROUND_Y, W, 2);

      // Moving ground pixel dashes
      c.fillStyle = '#777265';
      for (let i = 0; i < W + 30; i += 24) {
        const gx = ((i - groundOffset) % (W + 24) + (W + 24)) % (W + 24) - 10;
        c.fillRect(gx, GROUND_Y + 5, 6, 2);
        if (i % 48 === 0) {
          c.fillRect(gx + 12, GROUND_Y + 8, 3, 2);
        }
      }
    }

    // Reset Game
    function resetGame() {
      score = 0;
      speed = 4.2;
      lastMilestone = 0;
      obstacles = [];
      dino.y = GROUND_Y - dino.h;
      dino.vy = 0;
      dino.isGrounded = true;
      spawnObstacle();
    }

    // Start Game Action
    function handleAction() {
      initAudio();
      if (state === 'IDLE') {
        state = 'RUNNING';
        overlay.classList.add('hidden');
        resetGame();
        dino.jump();
      } else if (state === 'RUNNING') {
        dino.jump();
      } else if (state === 'GAMEOVER') {
        state = 'RUNNING';
        overlay.classList.add('hidden');
        resetGame();
        dino.jump();
      }
    }

    // Event Listeners
    if (jumpBtn) {
      jumpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleAction();
      });
    }

    if (container) {
      container.addEventListener('click', () => {
        handleAction();
      });
    }

    document.addEventListener('keydown', (e) => {
      // Don't hijack space or arrows if user is typing in search
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        handleAction();
      }
    });

    // Main Game Loop
    function loop() {
      frameCount++;
      ctx.clearRect(0, 0, W, H);

      // 1. Draw Clouds
      clouds.forEach((cl) => {
        if (state === 'RUNNING') {
          cl.x -= cl.speed;
          if (cl.x < -30) cl.x = W + Math.random() * 50;
        }
        drawCloud(ctx, cl);
      });

      // 2. Draw Ground
      if (state === 'RUNNING') {
        groundOffset = (groundOffset + speed) % 10000;
      }
      drawGround(ctx);

      // 3. Update & Draw Dino
      if (state === 'RUNNING') {
        dino.update();
      }
      dino.draw(ctx);

      // 4. Update & Draw Obstacles
      if (state === 'RUNNING') {
        // Spawn logic
        const lastOb = obstacles[obstacles.length - 1];
        if (!lastOb || lastOb.x < W - (180 + Math.random() * 140)) {
          spawnObstacle();
        }

        for (let i = obstacles.length - 1; i >= 0; i--) {
          const ob = obstacles[i];
          ob.x -= speed;
          drawCactus(ctx, ob);

          // Collision Check with 4px forgiveness box
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
            // Collision - Game Over!
            state = 'GAMEOVER';
            playBeep(180, 0.25, 'sawtooth', 0.05);

            // Update High Score
            if (score > hiScore) {
              hiScore = Math.floor(score);
              localStorage.setItem('minus_dino_hi', String(hiScore));
              hiScoreEl.textContent = String(hiScore).padStart(5, '0');
              playCoinSound();
            }

            msgTitle.textContent = 'GAME OVER';
            msgSub.textContent = `SCORE: ${Math.floor(score)} · PRESS SPACE TO RESTART`;
            overlay.classList.remove('hidden');
          }

          // Remove offscreen
          if (ob.x < -40) {
            obstacles.splice(i, 1);
          }
        }

        // 5. Update Score
        score += 0.14;
        const currentScore = Math.floor(score);
        scoreEl.textContent = String(currentScore).padStart(5, '0');

        // Milestone chime every 100 points
        if (currentScore > 0 && currentScore % 100 === 0 && currentScore !== lastMilestone) {
          lastMilestone = currentScore;
          playBeep(980, 0.1, 'square', 0.04);
        }

        // Slight speed ramp
        if (speed < 7.5) {
          speed += 0.0007;
        }
      } else {
        // Draw static obstacles if IDLE or GAMEOVER
        obstacles.forEach((ob) => drawCactus(ctx, ob));
      }

      animId = requestAnimationFrame(loop);
    }

    // Initial render
    resetGame();
    loop();
  }

  // ==========================================================================
  // RETRO ARCADE MODAL CABINET SYSTEM
  // ==========================================================================
  function initArcadeHub() {
    const backdrop = document.getElementById('arcadeModalBackdrop');
    const canvas = document.getElementById('modalCanvas');
    if (!backdrop || !canvas) return;

    const modalTitle = document.getElementById('modalGameTitle');
    const modalScore = document.getElementById('modalScore');
    const modalHi = document.getElementById('modalHiScore');
    const closeBtn = document.getElementById('modalCloseBtn');
    const overlay = document.getElementById('modalOverlay');
    const overlayTitle = document.getElementById('modalOverlayTitle');
    const overlaySub = document.getElementById('modalOverlaySub');
    const startBtn = document.getElementById('modalStartBtn');
    const resetBtn = document.getElementById('modalResetBtn');
    const playBtns = document.querySelectorAll('.arcade-play-trigger-btn');
    const dpadButtons = document.querySelectorAll('.modal-key-btn, .deck-btn.action-fire');

    const audioApi = { playBeep, playCoinSound, playStartChime };

    let currentGameKey = null;
    let currentGame = null;
    let animId = null;

    // Sync high scores to card elements on page load
    const gameKeys = ['snake', 'breaker', 'defender', 'dino', 'pong', 'racer', 'tetris'];
    gameKeys.forEach((key) => {
      const stored = localStorage.getItem(`minus_${key}_hi`);
      if (stored) {
        const cardHi = document.getElementById(`cardHi_${key}`);
        if (cardHi) cardHi.textContent = stored;
      }
    });

    function getGameInstance(key) {
      if (key === 'snake' && window.SnakeGame) return window.SnakeGame(canvas, audioApi);
      if (key === 'breaker' && window.BreakerGame) return window.BreakerGame(canvas, audioApi);
      if (key === 'defender' && window.DefenderGame) return window.DefenderGame(canvas, audioApi);
      if (key === 'dino' && window.DinoGame) return window.DinoGame(canvas, audioApi);
      if (key === 'pong' && window.PongGame) return window.PongGame(canvas, audioApi);
      if (key === 'racer' && window.RacerGame) return window.RacerGame(canvas, audioApi);
      if (key === 'tetris' && window.TetrisGame) return window.TetrisGame(canvas, audioApi);
      return null;
    }

    function openCabinet(gameKey) {
      if (!backdrop) return;

      // 1. Immediately open modal
      backdrop.classList.add('active');
      backdrop.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      if (animId) cancelAnimationFrame(animId);
      if (currentGame && currentGame.stop) {
        try { currentGame.stop(); } catch(e) {}
      }

      currentGameKey = gameKey;
      currentGame = getGameInstance(gameKey);

      initAudio();
      playCoinSound();

      if (modalTitle) modalTitle.textContent = currentGame ? currentGame.name : (gameKey.toUpperCase() + ' // 8-BIT');
      if (overlayTitle) overlayTitle.textContent = 'PRESS START TO PLAY';
      if (overlaySub) overlaySub.textContent = `CARTRIDGE: ${gameKey.toUpperCase()} READY`;
      if (overlay) overlay.classList.remove('hidden');

      if (currentGame) {
        try {
          const info = currentGame.tick(performance.now());
          if (info) {
            if (modalScore) modalScore.textContent = String(Math.floor(info.score)).padStart(5, '0');
            if (modalHi) modalHi.textContent = String(Math.floor(info.hiScore)).padStart(5, '0');
          }
        } catch (err) {
          console.error('Error rendering initial game frame:', err);
        }
      }
    }

    function closeCabinet() {
      if (animId) cancelAnimationFrame(animId);
      if (currentGame && currentGame.stop) currentGame.stop();

      // Update card high score display
      if (currentGameKey) {
        const stored = localStorage.getItem(`minus_${currentGameKey}_hi`);
        if (stored) {
          const cardHi = document.getElementById(`cardHi_${currentGameKey}`);
          if (cardHi) cardHi.textContent = stored;
        }
      }

      backdrop.classList.remove('active');
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      currentGame = null;
      currentGameKey = null;
    }

    function startGame() {
      if (!currentGame) return;
      initAudio();
      playStartChime();
      if (overlay) overlay.classList.add('hidden');
      currentGame.start();

      function cabinetLoop(timestamp) {
        if (!currentGame) return;
        const info = currentGame.tick(timestamp);
        if (info) {
          if (modalScore) modalScore.textContent = String(Math.floor(info.score)).padStart(5, '0');
          if (modalHi) modalHi.textContent = String(Math.floor(info.hiScore)).padStart(5, '0');

          if (info.isGameOver) {
            if (overlayTitle) overlayTitle.textContent = 'GAME OVER';
            if (overlaySub) overlaySub.textContent = `${info.customMsg || `SCORE: ${Math.floor(info.score)}`} · PRESS START`;
            if (overlay) overlay.classList.remove('hidden');

            if (currentGameKey) {
              const cardHi = document.getElementById(`cardHi_${currentGameKey}`);
              if (cardHi) cardHi.textContent = String(Math.floor(info.hiScore));
            }
            return;
          }
        }
        animId = requestAnimationFrame(cabinetLoop);
      }
      animId = requestAnimationFrame(cabinetLoop);
    }

    // Attach click to play buttons on cards (both direct & delegated for reliability)
    playBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openCabinet(btn.dataset.game);
      });
    });

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.arcade-play-trigger-btn');
      if (btn && btn.dataset.game) {
        e.preventDefault();
        openCabinet(btn.dataset.game);
      }
    });

    // Close button & backdrop click
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        playBeep(420, 0.05, 'square', 0.03);
        closeCabinet();
      });
    }

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeCabinet();
      }
    });

    // Start & Reset buttons
    if (startBtn) {
      startBtn.addEventListener('click', (e) => {
        e.preventDefault();
        startGame();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', (e) => {
        e.preventDefault();
        playCoinSound();
        if (currentGameKey) openCabinet(currentGameKey);
      });
    }

    // D-Pad and Action button triggers
    dpadButtons.forEach((btn) => {
      const key = btn.dataset.key;
      if (!key) return;
      const trigger = (e) => {
        if (e && e.cancelable) e.preventDefault();
        if (key === 'Space' && overlay && !overlay.classList.contains('hidden')) {
          startGame();
          return;
        }
        if (currentGame) currentGame.handleInput(key);
      };
      btn.addEventListener('mousedown', trigger);
      btn.addEventListener('touchstart', trigger, { passive: false });
    });

    // Keyboard handlers (active only when modal is open)
    document.addEventListener('keydown', (e) => {
      if (!backdrop.classList.contains('active')) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        closeCabinet();
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if ((e.code === 'Space' || e.key === ' ') && overlay && !overlay.classList.contains('hidden')) {
        startGame();
        return;
      }

      if (currentGame) {
        currentGame.handleInput(e.code || e.key);
      }
    });
  }

  // Global user gesture trigger for AudioContext
  document.addEventListener('click', () => initAudio(), { once: true });
})();
