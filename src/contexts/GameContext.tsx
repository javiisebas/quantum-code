'use client';

import { ManageRolesService } from '@/app/api/roles/services/manage-roles.service';
import { ModalCodeGameContent } from '@/app/play/components/ModalCodeGameContent';
import { GameLocalStorageKeyEnum } from '@/enum/game-local-storage-key.enum';
import { GameStatusEnum } from '@/enum/game-status.enum';
import { NoTeamEnum } from '@/enum/no-team.enum';
import { RoleEnum } from '@/enum/role.enum';
import { TeamEnum } from '@/enum/team.enum';
import { LocalStorageHelper } from '@/helpers/local-storage.helper';
import { checkHasTeamWon } from '@/services/check-has-team-won';
import { getFilledWordsArray } from '@/services/get-filled-words-array';
import { getRandomCode } from '@/services/get-random-code';
import { getRandomWords } from '@/services/get-random-words';
import {
    createContext,
    FC,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useModal } from './ModalContext';

interface GameContextType {
    code: number;
    gameStatus: GameStatusEnum;
    hasTeamWon: TeamEnum | null;
    loading: boolean;
    revealedRoles: boolean[];
    roles: RoleEnum[];
    showConfetti: boolean;
    words: string[];

    // Methods
    handleCardClick: (index: number) => void;
    resetGame: () => void;
    revealAll: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [roles, setRoles] = useState<RoleEnum[]>([]);
    const [showConfetti, setShowConfetti] = useState(false);
    const { openModal } = useModal();
    const [isRolesDeleted, setIsRolesDeleted] = useState<boolean>(false);

    const [code, setCode] = useState<number>(
        LocalStorageHelper.getOrSetLocalStorageItem(
            GameLocalStorageKeyEnum.GAME_CODE,
            getRandomCode(),
        ),
    );
    const [gameStatus, setGameStatus] = useState<GameStatusEnum>(
        LocalStorageHelper.getOrSetLocalStorageItem(
            GameLocalStorageKeyEnum.GAME_STATUS,
            GameStatusEnum.PLAYING,
        ),
    );
    const [hasTeamWon, setHasTeamWon] = useState<TeamEnum | null>(
        LocalStorageHelper.getOrSetLocalStorageItem(GameLocalStorageKeyEnum.GAME_TEAM_WON, null),
    );
    const [revealedRoles, setRevealedRoles] = useState<boolean[]>(
        LocalStorageHelper.getOrSetLocalStorageItem(
            GameLocalStorageKeyEnum.GAME_REVEALED_ROLES,
            getFilledWordsArray(false),
        ),
    );
    const [words, setWords] = useState<string[]>(
        LocalStorageHelper.getOrSetLocalStorageItem(
            GameLocalStorageKeyEnum.GAME_WORDS,
            getRandomWords(),
        ),
    );

    // Keep the latest gameStatus in a ref so the code-scoped init effect can read it
    // without depending on gameStatus (which must NOT re-trigger a fetch or re-open the modal).
    const gameStatusRef = useRef(gameStatus);
    useEffect(() => {
        gameStatusRef.current = gameStatus;
    }, [gameStatus]);

    // Fetch/create roles whenever the code changes (initial load and every new game).
    // The game-code modal is shown once per code while the game is in PLAYING state.
    // openModal is stable (useCallback), so this effect only re-runs when `code` changes.
    useEffect(() => {
        if (!code) return;

        let cancelled = false;

        const initializeGame = async () => {
            try {
                const fetchedRoles = await ManageRolesService.getOrCreateRoles(code);
                if (cancelled) return;

                setRoles(fetchedRoles);

                if (gameStatusRef.current === GameStatusEnum.PLAYING) {
                    openModal(<ModalCodeGameContent code={code} />);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error initializing game:', error);
            }
        };

        initializeGame();

        return () => {
            cancelled = true;
        };
    }, [code, openModal]);

    const handleSetCode = useCallback((code: number) => {
        setCode(code);
        LocalStorageHelper.setLocalStorageItem(GameLocalStorageKeyEnum.GAME_CODE, code);
    }, []);

    const handleSetRevealedRoles = useCallback((revealedRoles: boolean[]) => {
        setRevealedRoles(revealedRoles);
        LocalStorageHelper.setLocalStorageItem(
            GameLocalStorageKeyEnum.GAME_REVEALED_ROLES,
            revealedRoles,
        );
    }, []);

    const handleSetWords = useCallback((words: string[]) => {
        setWords(words);
        LocalStorageHelper.setLocalStorageItem(GameLocalStorageKeyEnum.GAME_WORDS, words);
    }, []);

    const handleSetGameStatus = useCallback((gameStatus: GameStatusEnum) => {
        setGameStatus(gameStatus);
        LocalStorageHelper.setLocalStorageItem(GameLocalStorageKeyEnum.GAME_STATUS, gameStatus);
    }, []);

    const handleSetHasTeamWon = useCallback((hasTeamWon: TeamEnum | null) => {
        setHasTeamWon(hasTeamWon);
        LocalStorageHelper.setLocalStorageItem(GameLocalStorageKeyEnum.GAME_TEAM_WON, hasTeamWon);
    }, []);

    const handleDeleteRoles = useCallback(async () => {
        if (!isRolesDeleted) {
            try {
                await ManageRolesService.deleteRoles(code);
                setIsRolesDeleted(true);
            } catch {
                setIsRolesDeleted(true);
            }
        }
    }, [code, isRolesDeleted]);

    const handleCardClick = useCallback(
        (index: number) => {
            if (gameStatus !== GameStatusEnum.PLAYING || revealedRoles[index]) return;

            const newRevealedRoles = [...revealedRoles];
            newRevealedRoles[index] = true;
            handleSetRevealedRoles(newRevealedRoles);

            const role = roles[index];

            if (role === NoTeamEnum.BLACK) {
                handleSetGameStatus(GameStatusEnum.LOST);
            } else {
                const revealedRolesArray = newRevealedRoles.map((revealed, i) =>
                    revealed ? roles[i] : null,
                );

                let teamWon = null;
                if (checkHasTeamWon(revealedRolesArray, TeamEnum.BLUE)) {
                    teamWon = TeamEnum.BLUE;
                } else if (checkHasTeamWon(revealedRolesArray, TeamEnum.RED)) {
                    teamWon = TeamEnum.RED;
                }

                if (teamWon) {
                    handleSetGameStatus(GameStatusEnum.WON);
                    handleSetHasTeamWon(teamWon);
                    setShowConfetti(true);
                }
            }
        },
        [
            gameStatus,
            revealedRoles,
            roles,
            handleSetRevealedRoles,
            handleSetGameStatus,
            handleSetHasTeamWon,
        ],
    );

    const resetGame = useCallback(() => {
        setLoading(true);

        if (gameStatus === GameStatusEnum.PLAYING) handleDeleteRoles();

        handleSetCode(getRandomCode());

        handleSetGameStatus(GameStatusEnum.PLAYING);
        handleSetHasTeamWon(null);
        handleSetRevealedRoles(getFilledWordsArray(false));
        handleSetWords(getRandomWords());
        setIsRolesDeleted(false);
        setShowConfetti(false);
    }, [
        gameStatus,
        handleDeleteRoles,
        handleSetCode,
        handleSetGameStatus,
        handleSetHasTeamWon,
        handleSetRevealedRoles,
        handleSetWords,
    ]);

    const revealAll = useCallback(() => {
        // Persistence cleanup on leaving PLAYING (roles + GAME_CODE) is owned by
        // GameBoardFrame's status effect; here we only transition the game state.
        handleSetGameStatus(GameStatusEnum.RESOLVED);
        handleSetRevealedRoles(getFilledWordsArray(true));
        setShowConfetti(false);
    }, [handleSetGameStatus, handleSetRevealedRoles]);

    const value = useMemo<GameContextType>(
        () => ({
            code,
            gameStatus,
            hasTeamWon,
            loading,
            revealedRoles,
            roles,
            showConfetti,
            words,

            handleCardClick,
            resetGame,
            revealAll,
        }),
        [
            code,
            gameStatus,
            hasTeamWon,
            loading,
            revealedRoles,
            roles,
            showConfetti,
            words,
            handleCardClick,
            resetGame,
            revealAll,
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
