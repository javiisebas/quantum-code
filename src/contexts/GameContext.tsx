'use client';

import { GameStatusEnum } from '@/enum/game-status.enum';
import { NoTeamEnum } from '@/enum/no-team.enum';
import { RoleEnum } from '@/enum/role.enum';
import { TeamEnum } from '@/enum/team.enum';
import { checkHasTeamWon } from '@/services/checkhas-team-won';
import { getFilledWordsArray } from '@/services/get-filled-words-array';
import { getRandomWords } from '@/services/get-random-words';
import { shuffleRoles } from '@/services/shuffle-roles';
import { createContext, FC, useContext, useEffect, useState } from 'react';

interface GameContextType {
    roles: RoleEnum[];
    words: string[];
    gameStatus: GameStatusEnum;
    hasTeamWon: TeamEnum | null;
    showConfetti: boolean;
    revealedRoles: boolean[];
    resetGame: () => void;
    revealAll: () => void;
    handleCardClick: (index: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
    const [gameStatus, setGameStatus] = useState<GameStatusEnum>(GameStatusEnum.PLAYING);
    const [hasTeamWon, setHasTeamWon] = useState<TeamEnum | null>(null);
    const [revealedRoles, setRevealedRoles] = useState<boolean[]>([]);
    const [roles, setRoles] = useState<RoleEnum[]>([]);
    const [showConfetti, setShowConfetti] = useState(false);
    const [words, setWords] = useState<string[]>([]);

    useEffect(() => {
        setRevealedRoles(getFilledWordsArray(false));
        setRoles(shuffleRoles());
        setWords(getRandomWords());
    }, []);

    useEffect(() => {
        if (gameStatus === GameStatusEnum.WON) setShowConfetti(true);
        else setShowConfetti(false);
    }, [gameStatus]);

    const handleCardClick = (index: number) => {
        if (gameStatus !== GameStatusEnum.PLAYING || revealedRoles[index]) return;

        const newRevealedRoles = [...revealedRoles];
        newRevealedRoles[index] = true;
        setRevealedRoles(newRevealedRoles);

        const role = roles[index];

        if (role === NoTeamEnum.BLACK) {
            setGameStatus(GameStatusEnum.LOST);
        } else {
            const revealedRolesArray = newRevealedRoles.map((revealed, i) =>
                revealed ? roles[i] : null,
            );

            if (checkHasTeamWon(revealedRolesArray, TeamEnum.BLUE)) {
                setGameStatus(GameStatusEnum.WON);
                setHasTeamWon(TeamEnum.BLUE);
            } else if (checkHasTeamWon(revealedRolesArray, TeamEnum.RED)) {
                setGameStatus(GameStatusEnum.WON);
                setHasTeamWon(TeamEnum.RED);
            }
        }
    };

    const resetGame = () => {
        setRevealedRoles(getFilledWordsArray(false));
        setGameStatus(GameStatusEnum.PLAYING);
        setHasTeamWon(null);
        setRoles(shuffleRoles());
        setWords(getRandomWords());
    };

    const revealAll = () => {
        setRevealedRoles(getFilledWordsArray(true));
        setGameStatus(GameStatusEnum.RESOLVED);
    };

    return (
        <GameContext.Provider
            value={{
                roles,
                words,
                gameStatus,
                hasTeamWon,
                showConfetti,
                revealedRoles,
                resetGame,
                revealAll,
                handleCardClick,
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
