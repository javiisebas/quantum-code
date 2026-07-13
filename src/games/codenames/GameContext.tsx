'use client';

import { deleteRoom, openRoom, resumeRoom } from '@/platform/room/room-client';
import {
    Board,
    generateBoard,
    getTeamProgress,
    RoleEnum,
    TeamEnum,
    TeamProgress,
} from '@/games/codenames/domain';
import { CODENAMES_ID } from '@/games/codenames/manifest';
import { GameStatusEnum } from '@/games/codenames/enums/game-status.enum';
import { LocalStorageHelper } from '@/platform/persistence/local-storage';
import {
    createContext,
    FC,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useReducer,
    useRef,
} from 'react';
import {
    GAME_STORAGE_KEY,
    GameState,
    gameReducer,
    initialGameState,
    isTerminal,
    PersistedGame,
} from './game-state';

interface GameContextType {
    code: number;
    gameStatus: GameStatusEnum;
    hasTeamWon: TeamEnum | null;
    currentTurn: TeamEnum;
    loading: boolean;
    error: string | null;
    progress: TeamProgress;
    revealedRoles: boolean[];
    roles: RoleEnum[];
    showConfetti: boolean;
    words: string[];

    // Methods
    handleCardClick: (index: number) => void;
    resetGame: () => void;
    revealAll: () => void;
    retry: () => void;
    passTurn: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const LOAD_ERROR_MESSAGE =
    'No se pudieron cargar las cartas. Revisa tu conexión e inténtalo de nuevo.';

export const GameProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(gameReducer, initialGameState);

    // Always-current snapshot of state for stable callbacks that must read the
    // latest code/status without being re-created (and re-triggering effects).
    const stateRef = useRef<GameState>(state);
    stateRef.current = state;

    // Re-publish the board for a code we ALREADY hold (a resumed game). Sends a fresh candidate
    // board; the server returns the authoritative one (create-if-absent), so the play device and
    // the spies always match even if the room lapsed past its TTL.
    const loadBoard = useCallback(async (code: number) => {
        try {
            const { value: board } = await resumeRoom<Board>(CODENAMES_ID, code, generateBoard());
            dispatch({ type: 'BOARD_LOADED', roles: board.roles, words: board.words });
        } catch {
            dispatch({ type: 'LOAD_ERROR', message: LOAD_ERROR_MESSAGE });
        }
    }, []);

    // Start a brand-new game. The SERVER mints the code — it is the only side that can see every
    // game's reservations, and a code now has to name exactly one room across the whole arcade.
    // No share modal is popped here any more: a fresh game now lands in the same `<HostLobby>` as
    // every other game, and the lobby IS the way in (QR + code, side by side with who has arrived).
    // The modal only ever fired for a BRAND-NEW game anyway, so a host who reloaded got no way in
    // at all unless they went hunting in the dock.
    const createNewGame = useCallback(async () => {
        try {
            const { code, value: board } = await openRoom<Board>(CODENAMES_ID, generateBoard());
            dispatch({ type: 'NEW_GAME', code });
            dispatch({ type: 'BOARD_LOADED', roles: board.roles, words: board.words });
        } catch {
            dispatch({ type: 'LOAD_ERROR', message: LOAD_ERROR_MESSAGE });
        }
    }, []);

    // Bootstrap once: resume a persisted game, or start a new one. Guarded so React
    // StrictMode's double-invoke in dev can't create two games / double-fetch.
    const bootstrappedRef = useRef(false);
    useEffect(() => {
        if (bootstrappedRef.current) return;
        bootstrappedRef.current = true;

        const persisted = LocalStorageHelper.getLocalStorageItem<PersistedGame>(GAME_STORAGE_KEY);

        if (persisted?.code) {
            const needsBoard =
                persisted.status === GameStatusEnum.PLAYING && !persisted.roles?.length;
            dispatch({ type: 'HYDRATE', game: persisted, needsBoard });
            if (needsBoard) {
                loadBoard(persisted.code);
            } else if (persisted.status === GameStatusEnum.PLAYING && persisted.roles?.length) {
                // Re-ensure the published board AND its code reservation still exist (both have a
                // 7-day TTL) so spies can rejoin a resumed game. Create-if-absent → a no-op when
                // it's all still there.
                resumeRoom<Board>(CODENAMES_ID, persisted.code, {
                    roles: persisted.roles,
                    words: persisted.words,
                }).catch(() => {});
            }
        } else {
            createNewGame();
        }
    }, [loadBoard, createNewGame]);

    // Centralised persistence: mirror the persisted slice whenever it changes.
    useEffect(() => {
        if (!state.hydrated) return;
        const slice: PersistedGame = {
            code: state.code,
            status: state.status,
            hasTeamWon: state.hasTeamWon,
            currentTurn: state.currentTurn,
            words: state.words,
            roles: state.roles,
            revealedRoles: state.revealedRoles,
        };
        LocalStorageHelper.setLocalStorageItem(GAME_STORAGE_KEY, slice);
    }, [
        state.hydrated,
        state.code,
        state.status,
        state.hasTeamWon,
        state.currentTurn,
        state.words,
        state.roles,
        state.revealedRoles,
    ]);

    // Release the board from Redis once a game reaches a terminal state, so spies can
    // no longer peek at a finished board. Runs at most once per code.
    const releasedCodeRef = useRef<number | null>(null);
    useEffect(() => {
        if (!state.hydrated || !state.code) return;
        if (isTerminal(state.status) && releasedCodeRef.current !== state.code) {
            releasedCodeRef.current = state.code;
            deleteRoom(CODENAMES_ID, state.code).catch(() => {
                /* best-effort cleanup; the 7-day TTL is the backstop */
            });
        }
    }, [state.hydrated, state.status, state.code]);

    // Auto-dismiss the winning confetti so it never runs forever.
    useEffect(() => {
        if (!state.showConfetti) return;
        const timer = window.setTimeout(() => dispatch({ type: 'CLEAR_CONFETTI' }), 8000);
        return () => window.clearTimeout(timer);
    }, [state.showConfetti]);

    const handleCardClick = useCallback((index: number) => {
        dispatch({ type: 'REVEAL_CARD', index });
    }, []);

    const revealAll = useCallback(() => {
        dispatch({ type: 'REVEAL_ALL' });
    }, []);

    const passTurn = useCallback(() => {
        dispatch({ type: 'PASS_TURN' });
    }, []);

    const retry = useCallback(() => {
        dispatch({ type: 'RETRY' });
        const { code } = stateRef.current;
        // The code is minted by the SERVER now, so a game whose creation failed has no code at
        // all. Re-publishing "code 0" would 400 and land straight back on this error — an
        // unescapable retry loop. With no code, the only sane retry is to open a new room.
        if (code) {
            void loadBoard(code);
        } else {
            void createNewGame();
        }
    }, [loadBoard, createNewGame]);

    const resetGame = useCallback(() => {
        const { code, status } = stateRef.current;
        // Release the previous board from Redis before starting a new game.
        if (code && status === GameStatusEnum.PLAYING) {
            deleteRoom(CODENAMES_ID, code).catch(() => {});
        }
        createNewGame();
    }, [createNewGame]);

    const progress = useMemo(
        () => getTeamProgress(state.roles, state.revealedRoles),
        [state.roles, state.revealedRoles],
    );

    const value = useMemo<GameContextType>(
        () => ({
            code: state.code,
            gameStatus: state.status,
            hasTeamWon: state.hasTeamWon,
            currentTurn: state.currentTurn,
            loading: state.loading,
            error: state.error,
            progress,
            revealedRoles: state.revealedRoles,
            roles: state.roles,
            showConfetti: state.showConfetti,
            words: state.words,
            handleCardClick,
            resetGame,
            revealAll,
            retry,
            passTurn,
        }),
        [
            state.code,
            state.status,
            state.hasTeamWon,
            state.currentTurn,
            state.loading,
            state.error,
            state.revealedRoles,
            state.roles,
            state.showConfetti,
            state.words,
            progress,
            handleCardClick,
            resetGame,
            revealAll,
            retry,
            passTurn,
        ],
    );

    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = (): GameContextType => {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error('useGame must be used inside of GameProvider');
    }
    return context;
};
