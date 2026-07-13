'use client';

import { RoomError } from '@/platform/ui/RoomError';

/**
 * A phone that claimed a seat past the deal: the host dealt N secrets and this is phone N+1.
 *
 * Spyfall, Impostor and Hombres Lobo each printed this same paragraph, verbatim, inside its own
 * hand-rolled `<main>` — and all three left the player on a dead end with no action at all, which
 * is the one thing a party game can't afford. It is a `<RoomError>` (not a bespoke card) because
 * it is exactly that state: the room didn't work out for this phone, and there IS a way forward —
 * a new round means a NEW code, so rejoining really is what this player has to do.
 *
 * El Camaleón has no such state: its board is shared, so every seat can be projected a view.
 */
export function RoundFullCard() {
    return (
        <RoomError
            title="La partida ya está completa"
            message={
                <>
                    Pide al anfitrión una <span className="font-semibold">nueva ronda</span> con más
                    jugadores.
                </>
            }
        />
    );
}
