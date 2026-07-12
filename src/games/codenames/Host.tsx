'use client';

import { GameProvider } from './GameContext';
import { GameBoard } from './components/GameBoard';

/**
 * Codenames host screen — the shared "board" device. Owns the game state (via
 * `GameProvider`) and renders the 5×5 play board plus the menu (share code / QR,
 * reveal, new game). This is what `/host/codenames` mounts.
 */
export function CodenamesHost() {
    return (
        <GameProvider>
            <div className="relative flex h-screen w-full items-center justify-center overflow-hidden">
                <GameBoard />
            </div>
        </GameProvider>
    );
}
