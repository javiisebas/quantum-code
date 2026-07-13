/**
 * Shared capability-token contract for the room API — the single source of truth both the
 * server (store + routes) and the browser (clients + hooks) import, so the two halves can
 * never drift on header names or wire shapes.
 *
 * The room model is capability-based: knowing a room's 6-digit code lets a device JOIN. These
 * random tokens are what turn "host-authoritative" and "one seat per device" from client-side
 * conventions into ENFORCED properties, so a secret is never handed to a device that can't
 * prove it may see it:
 *
 *  - hostToken: minted once when a room is created (POST /room); only the creator (the host
 *    "TV") receives it. Required to publish public state, read every seat's input, and write
 *    per-seat private state. Rides the host's existing localStorage room record — losing it
 *    means starting a fresh room, exactly like losing the persisted code does today.
 *  - seatToken: minted when a device claims a seat (POST /seat); only that device receives it.
 *    Required to submit that seat's input and to read that seat's sealed/private data. Rides
 *    the same localStorage entry that already stores the seat number, so its lifecycle — and
 *    the "cleared storage ⇒ new seat" behaviour — is unchanged.
 *
 * Tokens travel in headers (never URLs/query strings) so they stay out of logs and referrers.
 */

/** Header the host presents to prove it created the room. */
export const HOST_TOKEN_HEADER = 'x-host-token';
/** Header a phone presents to prove it owns the seat it is acting as. */
export const SEAT_TOKEN_HEADER = 'x-seat-token';

/** A freshly claimed seat plus the secret token that proves ownership of it. */
export interface SeatClaim {
    seat: number;
    token: string;
}

/**
 * Result of creating (or resolving) a room: the authoritative payload, plus the host token
 * ONLY when THIS caller actually created the room (`null` when the room already existed, so a
 * late/duplicate POST can never learn or overwrite the real host's token).
 */
export interface RoomCreation<T> {
    value: T;
    hostToken: string | null;
}
