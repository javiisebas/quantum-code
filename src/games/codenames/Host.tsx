'use client';

import { useLiveCount } from '@/platform/room/use-presence';
import { Button } from '@/platform/ui/Button';
import { HostLobby } from '@/platform/ui/HostLobby';
import { LobbyPanel } from '@/platform/ui/LobbyPanel';
import { Loading } from '@/platform/ui/Loading';
import { accentOf } from '@/games/_shared/accents';
import { useState } from 'react';
import { BiPlay } from 'react-icons/bi';
import { GameProvider, useGame } from './GameContext';
import { GameBoard } from './components/GameBoard';
import { CODENAMES_ID, codenamesManifest } from './manifest';

/**
 * Codenames host screen — the shared "board" device.
 *
 * It used to be the ODD ONE OUT of the arcade: every other game opens a lobby where the QR and the
 * code wait for phones to arrive, but this one dropped you straight onto the board and popped a
 * share MODAL over it. Two different answers to the same question ("how do people get in?"), and
 * the modal one only fired on a brand-new game — so a host who reloaded got no way in at all
 * unless they went hunting in the dock.
 *
 * It now waits in the same `<HostLobby>` as the other seven. What is different is only what is
 * genuinely different: Codenames' phones are SPYMASTERS reading one shared map, not players
 * claiming a seat, so the roster counts connected devices rather than naming them.
 */
export function CodenamesHost() {
    return (
        <GameProvider>
            <CodenamesStage />
        </GameProvider>
    );
}

const acc = accentOf(codenamesManifest.accent);

function CodenamesStage() {
    const { code, loading, revealedRoles } = useGame();

    // A board with a revealed card is a game already in progress — a host who reloads mid-game
    // must land back on the board, not behind a lobby they already left. A fresh board (nothing
    // revealed, including right after "Nueva partida", which mints a NEW code the spymasters have
    // to re-scan) is exactly when the lobby is what you want.
    const inProgress = revealedRoles.some(Boolean);
    const [started, setStarted] = useState(false);

    // How many phones are holding the secret map right now.
    const connected = useLiveCount({ game: CODENAMES_ID, code: code || null });

    if (loading || !code) {
        return <Loading label="Preparando la partida…" />;
    }

    if (!started && !inProgress) {
        const spies = Array.from({ length: connected }, (_, i) => `Espía ${i + 1}`);
        return (
            <HostLobby manifest={codenamesManifest} code={code}>
                <LobbyPanel
                    names={spies}
                    // One phone with the map is enough to play; the rest of the room reads the
                    // board. That is why the gate is 1 and not the game's 4 PLAYERS.
                    min={1}
                    max={codenamesManifest.maxPlayers}
                    accentChip={acc.chip}
                    label="Espías"
                    caption="Verán el mapa secreto en su móvil"
                    action={
                        <Button
                            variant="accent"
                            accentClass={acc.solidButton}
                            fullWidth
                            startContent={connected > 0 ? <BiPlay size={22} /> : undefined}
                            onPress={() => setStarted(true)}
                            isDisabled={connected === 0}
                        >
                            {connected > 0 ? 'Empezar partida' : 'Falta un espía'}
                        </Button>
                    }
                />
            </HostLobby>
        );
    }

    // No wrapper: `GameBoardFrame` already owns the viewport (see its docstring). This used to
    // wrap it in a SECOND, identical full-height flex-centred box — which also meant the board's
    // own loading and error states rendered as a page nested inside a page.
    return <GameBoard />;
}
