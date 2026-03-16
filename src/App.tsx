/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';

export default function App() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <GameCanvas />
      <HUD />
    </div>
  );
}
