'use client';

import { FileService } from '@/database/services/file.service';
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
import { shuffleRoles } from '@/services/shuffle-roles';
import { createContext, FC, useContext, useEffect, useState } from 'react';

interface GameContextType {
    code: number | null;
    gameStatus: GameStatusEnum;
    hasTeamWon: TeamEnum | null;
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
    const [code, setCode] = useState<number | null>(null);
    const [gameStatus, setGameStatus] = useState<GameStatusEnum>(GameStatusEnum.PLAYING);
    const [hasTeamWon, setHasTeamWon] = useState<TeamEnum | null>(null);
    const [revealedRoles, setRevealedRoles] = useState<boolean[]>([]);
    const [roles, setRoles] = useState<RoleEnum[]>([]);
    const [showConfetti, setShowConfetti] = useState(false);
    const [words, setWords] = useState<string[]>([]);

    useEffect(() => {
        const initializeGame = async () => {
            const newCode = LocalStorageHelper.getOrSetLocalStorageItem(
                GameLocalStorageKeyEnum.GAME_CODE,
                getRandomCode(),
            );
            setCode(newCode);

            const roles = await FileService.readOrWriteRoles(newCode, shuffleRoles());
            setRoles(roles);

            setRevealedRoles(
                LocalStorageHelper.getOrSetLocalStorageItem(
                    GameLocalStorageKeyEnum.GAME_REVEALED_ROLES,
                    getFilledWordsArray(false),
                ),
            );

            setWords(
                LocalStorageHelper.getOrSetLocalStorageItem(
                    GameLocalStorageKeyEnum.GAME_WORDS,
                    getRandomWords(),
                ),
            );

            setGameStatus(
                LocalStorageHelper.getOrSetLocalStorageItem(
                    GameLocalStorageKeyEnum.GAME_STATUS,
                    GameStatusEnum.PLAYING,
                ),
            );

            setHasTeamWon(
                LocalStorageHelper.getOrSetLocalStorageItem(
                    GameLocalStorageKeyEnum.GAME_TEAM_WON,
                    null,
                ),
            );
        };

        initializeGame().catch((err) => {
            console.error('Error initializing game:', err);
        });
    }, []);

    useEffect(() => {
        if (gameStatus === GameStatusEnum.WON) setShowConfetti(true);
        else setShowConfetti(false);
    }, [gameStatus]);

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

            if (checkHasTeamWon(revealedRolesArray, TeamEnum.BLUE)) {
                handleSetGameStatus(GameStatusEnum.WON);
                handleSetHasTeamWon(TeamEnum.BLUE);
            } else if (checkHasTeamWon(revealedRolesArray, TeamEnum.RED)) {
                handleSetGameStatus(GameStatusEnum.WON);
                setHasTeamWon(TeamEnum.RED);
            }
        }
    };

    const resetGame = () => {
        const newCode = getRandomCode();

        handleSetCode(newCode);
        handleSetRevealedRoles(getFilledWordsArray(false));
        handleSetRoles(newCode, shuffleRoles());
        handleSetWords(getRandomWords());
        handleSetGameStatus(GameStatusEnum.PLAYING);
        handleSetHasTeamWon(null);
    };

    const revealAll = () => {
        handleSetRevealedRoles(getFilledWordsArray(true));
        handleSetGameStatus(GameStatusEnum.RESOLVED);
    };

    const handleSetCode = (code: number | null) => {
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

    const handleSetRoles = async (newCode: number, roles: RoleEnum[]) => {
        setRoles(roles);
        await FileService.writeRoles(newCode, shuffleRoles());
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
