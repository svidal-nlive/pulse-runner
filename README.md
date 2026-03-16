# Pulse Runner

Pulse Runner is a lightweight, endless sci-fi lane runner prototype built with React and Babylon.js. It features a unique "Pulse" mechanic that allows players to alter upcoming track tiles, adding a layer of strategy to the fast-paced gameplay.

## Core Mechanics
- **Endless Runner:** The hovercraft constantly moves forward, increasing in speed over time.
- **Lane Switching:** The track has 3 lanes. Players must dodge obstacles and collect pickups.
- **Pulse Action:** A rechargeable ability that sends a wave forward. When the wave hits specific items, it alters them (e.g., converting an obstacle into a pickup, or destroying it).
- **Power-ups:**
  - **Shield:** Protects against one crash.
  - **Speed Boost:** Temporarily increases speed and makes the player invincible to obstacles.
  - **Score Multiplier:** Doubles all score gains for a short duration.

## Controls
- **A / Left Arrow:** Move Left
- **D / Right Arrow:** Move Right
- **Spacebar:** Activate Pulse

## Technologies Used
- **React:** Handles the application shell, HUD, overlays, and UI state.
- **Babylon.js:** Powers all 3D rendering, camera, lighting, procedural geometry, and gameplay logic.
- **Tailwind CSS:** Used for styling the React UI components.

## Architecture
The project maintains a clean separation between the React UI and the Babylon.js game engine. The `SceneManager` orchestrates the game loop, updating the `PlayerController`, `TrackManager`, and `WorldItemManager`. The `GameState` acts as a bridge, emitting updates that the React `HUD` component subscribes to, ensuring the UI remains decoupled from the per-frame 3D rendering loop.

## Future Expansion Ideas
- **New Biomes:** Transition to different visual themes (e.g., cyber-city, crystalline caves) as distance increases.
- **More Pulse Interactions:** Introduce new obstacle types that react differently to the Pulse (e.g., a wall that turns into a ramp).
- **Global Leaderboards:** Integrate a backend service to track high scores globally.
- **Unlockable Hovercrafts:** Add a meta-progression system where players can unlock new vehicles with different stats (e.g., faster base speed, shorter pulse cooldown).
