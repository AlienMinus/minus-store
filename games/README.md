# Minus Arcade Games Engine

This directory contains standalone, modular 8-bit retro game engines formatted for the Pixelatte aesthetic.

## Available Games

1. **`snake.js` (Retro Snake)**
   - Classic grid-based snake game with collision detection, food spawning, dynamic acceleration, and high-score tracking.
   - Module: `window.SnakeGame(canvas, audio)`

2. **`breaker.js` (Brick Breaker)**
   - Retro breakout paddle and bounce ball mechanics with multi-tier colored bricks and angle deflection.
   - Module: `window.BreakerGame(canvas, audio)`

3. **`defender.js` (Space Defender)**
   - Classic space invader shooter with moving alien fleets, laser cannons, explosion particles, and wave pacing.
   - Module: `window.DefenderGame(canvas, audio)`

4. **`dino.js` (Dino Runner)**
   - Endless obstacle runner with jumping physics, randomized cactus obstacles, passing clouds, and speed ramp.
   - Module: `window.DinoGame(canvas, audio)`

5. **`pong.js` (Pixel Pong)**
   - Fast-paced 1-on-1 table tennis: Player vs AI CPU paddle with angle deflection, rally streaks, and match scoring.
   - Module: `window.PongGame(canvas, audio)`

6. **`racer.js` (Pixel Racer)**
   - High-speed 3-lane highway dodge game with oncoming traffic, fuel canister pickups, nitro boost, and distance counter.
   - Module: `window.RacerGame(canvas, audio)`

7. **`tetris.js` (Block Stacker)**
   - Classic tetromino block dropper with rotation, soft drop, line clears, next-piece preview box, and speed levels.
   - Module: `window.TetrisGame(canvas, audio)`

## Common API Interface

Each game engine exports a factory function accepting `(canvas, audio)` and returns:
- `name`: Human-readable game title.
- `start()`: Initializes and starts game loop.
- `stop()`: Halts game loop.
- `tick(timestamp)`: Updates physics and redraws to canvas; returns `{ score, hiScore, isGameOver, isRunning }`.
- `handleInput(key)`: Handles key input strings (e.g. `'ArrowUp'`, `'Space'`, `'KeyA'`).
