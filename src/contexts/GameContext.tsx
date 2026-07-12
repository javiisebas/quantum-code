'use client';

import { deleteBoard, getOrCreateBoard } from '@/app/api/roles/services/manage-board.service';
import { ModalCodeGameContent } from '@/app/play/components/ModalCodeGameContent';
import {
    generateBoard,
    generateCode,
    getTeamProgress,
    RoleEnum,
    TeamEnum,
    TeamProgress,
} from '@/domain';
import { GameStatusEnum } from '@/enum/game-status.enum';
import { LocalStorageHelper } from '@/helpers/local-storage.helper';
import { createContext, FC, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import {
    GAME_STORAGE_KEY,
    GameState,
    gameReducer,
    initialGameState,
    isTerminal,
    PersistedGame,
} from './game-state';
import { useModal } from './ModalContext';

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

const LOAD_ERROR_MESSAGE = 'No se pudieron cargar las cartas. Revisa tu conexión e inténtalo de nuevo.';

export const GameProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(gameReducer, initialGameState);
    const { openModal } = useModal();

    // Always-current snapshot of state for stable callbacks that must read the
    // latest code/status without being re-created (and re-triggering effects).
    const stateRef = useRef<GameState>(state);
    stateRef.current = state;

    // Fetch (or atomically create) the board for a code and publish it to Redis. We
    // send a freshly generated candidate; the server returns the authoritative board
    // (roles + words), so the play device and the spies always match.
    const loadBoard = useCallback(
        async (code: number, options?: { share?: boolean }) => {
            try {
                const board = await getOrCreateBoard(code, generateBoard());
                dispatch({ type: 'BOARD_LOADED', roles: board.roles, words: board.words });
                if (options?.share) openModal(<ModalCodeGameContent code={code} />);
            } catch {
                dispatch({ type: 'LOAD_ERROR', message: LOAD_ERROR_MESSAGE });
            }
        },
        [openModal],
    );

    // Start a brand-new game: fresh code, then create/publish its board.
    const createNewGame = useCallback(
        async (options?: { share?: boolean }) => {
            const code = generateCode();
            dispatch({ type: 'NEW_GAME', code });
            await loadBoard(code, options);
        },
        [loadBoard],
    );

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
            if (needsBoard) loadBoard(persisted.code);
        } else {
            createNewGame({ share: true });
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
            deleteBoard(state.code).catch(() => {
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
        loadBoard(stateRef.current.code);
    }, [loadBoard]);

    const resetGame = useCallback(() => {
        const { code, status } = stateRef.current;
        // Release the previous board from Redis before starting a new game.
        if (code && status === GameStatusEnum.PLAYING) {
            deleteBoard(code).catch(() => {});
        }
        createNewGame({ share: true });
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
