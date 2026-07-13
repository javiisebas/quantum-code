/**
 * Isomorphic room utilities safe to import from both server and client code.
 *
 * IMPORTANT: this barrel intentionally re-exports ONLY the join-code helpers.
 * `room-store` (server-only: Redis + env) and `room-client` (browser-only: fetch)
 * must be imported from their own modules so a client bundle never pulls in the
 * server store, and vice versa.
 */
export { MIN_CODE, MAX_CODE, generateCode, parseCode } from './code';
