'use client';

import { ManageRolesService } from '@/app/api/roles/services/manage-roles.service';
import { ModalCodeGameContent } from '@/app/play/components/ModalCodeGameContent';
import { GameLocalStorageKeyEnum } from '@/enum/game-local-storage-key.enum';
import { GameStatusEnum } from '@/enum/game-status.enum';
import { NoTeamEnum } from '@/enum/no-team.enum';
import { RoleEnum } from '@/enum/role.enum';
import { TeamEnum } from '@/enum/team.enum';
import { LocalStorageHelper } from '@/helpers/local-storage.helper';
import { checkHasTeamWon } from '@/services/checkhas-team-won';
import { getFilledWordsArray } from '@/services/get-filled-words-array';
import { getRandomCode } from '@/services/get-random-code';
import { getRandomWords } from '@/services/get-random-words';
import { createContext, FC, useContext, useEffect, useState } from 'react';
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

    useEffect(() => {
        const initializeGame = async () => {
            if (!code) return;

            try {
                const fetchedRoles = await ManageRolesService.getOrCreateRoles(code);
                setRoles(fetchedRoles);

                if (gameStatus === GameStatusEnum.PLAYING) {
                    openModal(<ModalCodeGameContent code={code} />);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error initializing game:', error);
            }
        };

        initializeGame();
    }, [code]);

    const handleCardClick = (index: number) => {
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
    };

    const resetGame = () => {
        setLoading(true);

        if (gameStatus === GameStatusEnum.PLAYING) handleDeleteRoles();

        handleSetCode(getRandomCode());

        handleSetGameStatus(GameStatusEnum.PLAYING);
        handleSetHasTeamWon(null);
        handleSetRevealedRoles(getFilledWordsArray(false));
        handleSetWords(getRandomWords());
        setIsRolesDeleted(false);
        setShowConfetti(false);
    };

    const revealAll = () => {
        LocalStorageHelper.removeLocalStorageItem(GameLocalStorageKeyEnum.GAME_CODE);

        handleSetGameStatus(GameStatusEnum.RESOLVED);
        handleSetRevealedRoles(getFilledWordsArray(true));
        setShowConfetti(false);
    };

    const handleDeleteRoles = async () => {
        if (!isRolesDeleted) {
            try {
                await ManageRolesService.deleteRoles(code);
                setIsRolesDeleted(true);
            } catch {
                setIsRolesDeleted(true);
            }
        }
    };

    const handleSetCode = (code: number) => {
        setCode(code);
        LocalStorageHelper.setLocalStorageItem(GameLocalStorageKeyEnum.GAME_CODE, code);
    };

    const handleSetRevealedRoles = (revealedRoles: boolean[]) => {
        setRevealedRoles(revealedRoles);
        LocalStorageHelper.setLocalStorageItem(
            GameLocalStorageKeyEnum.GAME_REVEALED_ROLES,
            revealedRoles,
        );
    };

    const handleSetWords = (words: string[]) => {
        setWords(words);
        LocalStorageHelper.setLocalStorageItem(GameLocalStorageKeyEnum.GAME_WORDS, words);
    };

    const handleSetGameStatus = (gameStatus: GameStatusEnum) => {
        setGameStatus(gameStatus);
        LocalStorageHelper.setLocalStorageItem(GameLocalStorageKeyEnum.GAME_STATUS, gameStatus);
    };

    const handleSetHasTeamWon = (hasTeamWon: TeamEnum | null) => {
        setHasTeamWon(hasTeamWon);
        LocalStorageHelper.setLocalStorageItem(GameLocalStorageKeyEnum.GAME_TEAM_WON, hasTeamWon);
    };

    return (
        <GameContext.Provider
            value={{
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
            }}
        >
            {children}
        </GameContext.Provider>
    );
};

export const useGame = (): GameContextType => {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error('useGame must be used inside of GameProvider');
    }
    return context;
};
