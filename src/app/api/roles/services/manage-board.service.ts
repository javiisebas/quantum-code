import { Board } from '@/domain';
import * as httpBoardService from './http-board.service';

/**
 * Get the canonical board for a game code, creating it if it doesn't exist yet.
 *
 * Atomic end-to-end: the caller supplies a freshly generated candidate board and we
 * POST it. The server performs an atomic SET NX and returns the authoritative board —
 * ours if we created the key, or the pre-existing board if another client won the
 * race. Either way, everyone who joins the same code converges on the same board,
 * with no client-side get-then-create race.
 */
export const getOrCreateBoard = (code: number, candidate: Board): Promise<Board> =>
    httpBoardService.createBoard(code, candidate);

/** Delete the board for a game code. */
export const deleteBoard = async (code: number): Promise<void> => {
    await httpBoardService.deleteBoard(code);
};
