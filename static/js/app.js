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
    // Buttons & Filters
    document.querySelectorAll('.filter, .button, .nav-item, .arcade-kbd').forEach((el) => {
      el.addEventListener('mouseenter', () => playBeep(650, 0.03, 'square', 0.02));
      el.addEventListener('click', () => playBeep(880, 0.05, 'square', 0.04));
    });

    // Project Cards
    document.querySelectorAll('.project-card').forEach((card) => {
      card.addEventListener('mouseenter', () => playBeep(520, 0.04, 'triangle', 0.025));
    });

    // Launch & Action Buttons
    document.querySelectorAll('.arcade-launch-btn').forEach((btn) => {
      btn.addEventListener('click', () => playCoinSound());
    });

    // Orbit Core interaction
    const core = document.querySelector('.orbit-core');
    if (core) {
      core.addEventListener('click', () => {
        playCoinSound();
        core.classList.add('core-flash');
        setTimeout(() => core.classList.remove('core-flash'), 400);
      });
    }
  });

  // Global user gesture trigger for AudioContext
  document.addEventListener('click', () => initAudio(), { once: true });
})();
