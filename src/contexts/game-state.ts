import { BOARD_SIZE, createRevealedState, getWinner, NoTeamEnum, RoleEnum, TeamEnum } from '@/domain';
import { GameStatusEnum } from '@/enum/game-status.enum';

/**
 * The slice of game state that is persisted to localStorage so a board survives a
 * reload. Roles are persisted too (the board device is authoritative for its own
 * game and is not a secrecy boundary — the secrecy boundary is the Redis read by
 * spies), which keeps a reloaded board consistent with what was actually played.
 */
export interface PersistedGame {
    code: number;
    status: GameStatusEnum;
    hasTeamWon: TeamEnum | null;
    words: string[];
    roles: RoleEnum[];
    revealedRoles: boolean[];
}

/** Full in-memory game state: the persisted slice plus transient UI flags. */
export interface GameState extends PersistedGame {
    /** True while roles are being fetched/created for the current code. */
    loading: boolean;
    /** Set when role loading failed, so the UI can offer a retry. */
    error: string | null;
    /** Drives the winning-team confetti burst. */
    showConfetti: boolean;
    /** False until localStorage has been read; gates persistence + fetching. */
    hydrated: boolean;
}

export const GAME_STORAGE_KEY = 'quantum-code:game';

export const initialGameState: GameState = {
    code: 0,
    status: GameStatusEnum.PLAYING,
    hasTeamWon: null,
    words: [],
    roles: [],
    revealedRoles: [],
    loading: true,
    error: null,
    showConfetti: false,
    hydrated: false,
};

export type GameAction =
    | { type: 'HYDRATE'; game: PersistedGame; needsRoles: boolean }
    | { type: 'NEW_GAME'; code: number; words: string[] }
    | { type: 'ROLES_LOADED'; roles: RoleEnum[] }
    | { type: 'LOAD_ERROR'; message: string }
    | { type: 'RETRY' }
    | { type: 'REVEAL_CARD'; index: number }
    | { type: 'REVEAL_ALL' }
    | { type: 'CLEAR_CONFETTI' };

/**
 * Pure game state machine. All side effects (Redis reads/writes, localStorage,
 * opening modals) live in the provider; this reducer only computes the next state.
 */
export const gameReducer = (state: GameState, action: GameAction): GameState => {
    switch (action.type) {
        case 'HYDRATE':
            return {
                ...state,
                ...action.game,
                hydrated: true,
                // A persisted, in-progress game with no stored roles must fetch them;
                // otherwise everything needed to render is already in hand.
                loading: action.needsRoles,
                error: null,
                showConfetti: false,
            };

        case 'NEW_GAME':
            return {
                ...state,
                code: action.code,
                words: action.words,
                roles: [],
                revealedRoles: createRevealedState(),
                status: GameStatusEnum.PLAYING,
                hasTeamWon: null,
                loading: true,
                error: null,
                showConfetti: false,
                hydrated: true,
            };

        case 'ROLES_LOADED':
            return { ...state, roles: action.roles, loading: false, error: null };

        case 'LOAD_ERROR':
            return { ...state, loading: false, error: action.message };

        case 'RETRY':
            return { ...state, loading: true, error: null };

        case 'REVEAL_CARD': {
            const { index } = action;
            if (state.status !== GameStatusEnum.PLAYING || state.revealedRoles[index]) {
                return state;
            }

            const revealedRoles = state.revealedRoles.slice();
            revealedRoles[index] = true;

            // Revealing the assassin (black) is an instant loss.
            if (state.roles[index] === NoTeamEnum.BLACK) {
                return { ...state, revealedRoles, status: GameStatusEnum.LOST };
            }

            const winner = getWinner(state.roles, revealedRoles);
            if (winner) {
                return {
                    ...state,
                    revealedRoles,
                    status: GameStatusEnum.WON,
                    hasTeamWon: winner,
                    showConfetti: true,
                };
            }

            return { ...state, revealedRoles };
        }

        case 'REVEAL_ALL':
            return {
                ...state,
                status: GameStatusEnum.RESOLVED,
                revealedRoles: new Array(BOARD_SIZE).fill(true),
                showConfetti: false,
            };

        case 'CLEAR_CONFETTI':
            return { ...state, showConfetti: false };

        default:
            return state;
    }
};

/** Whether a game status is terminal (roles can be released from Redis). */
export const isTerminal = (status: GameStatusEnum): boolean =>
    status !== GameStatusEnum.PLAYING;
