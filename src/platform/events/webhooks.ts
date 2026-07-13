/**
 * Outbound webhook seam for room lifecycle events.
 *
 * When `QUANTUM_WEBHOOK_URL` is configured, room events (a room being created, a game
 * ending, …) are POSTed to it as JSON — enough to wire an arcade into Discord/Slack,
 * an analytics sink, or any automation, without any game knowing about it. When the
 * env var is unset it is a no-op, so this is safe to call unconditionally. Dispatch is
 * fire-and-forget: a slow or failing webhook never blocks or breaks gameplay.
 */

export type RoomEventType = 'room.created' | 'game.ended';

export interface RoomEvent {
    type: RoomEventType;
    /** Game id, e.g. 'codenames'. */
    game: string;
    /** Room join code. */
    code: number;
    /** Epoch ms when the event was emitted. */
    at: number;
    /** Optional extra data (winner, player count, …). */
    meta?: Record<string, unknown>;
}

/** Emit a room event to the configured webhook. No-op when none is configured. */
export const emitRoomEvent = (event: Omit<RoomEvent, 'at'>): void => {
    const url = process.env.QUANTUM_WEBHOOK_URL;
    if (!url) return;

    const payload: RoomEvent = { ...event, at: Date.now() };

    void fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
    }).catch(() => {
        /* best-effort; never let a webhook failure affect the game */
    });
};
