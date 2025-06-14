'use client';

import { ManageRolesService } from '@/app/api/roles/services/manage-roles.service';
import { useGame } from '@/contexts/GameContext';
import { GameStatusEnum } from '@/enum/game-status.enum';
import { ClassnameHelper } from '@/helpers/clean-classname.helper';
import { ChildrenProps } from '@/types/children.type';
import { Spinner } from '@nextui-org/react';
import { FC, useEffect } from 'react';
import { GameBoardLost } from './GameBoardLost';
import { GameBoardWon } from './GameBoardWon';
import { GameLocalStorageKeyEnum } from '@/enum/game-local-storage-key.enum';
import { LocalStorageHelper } from '@/helpers/local-storage.helper';

export const GameBoardFrame: FC<ChildrenProps> = ({ children }) => {
    const { loading, code, gameStatus } = useGame();

    useEffect(() => {
        if (gameStatus !== GameStatusEnum.PLAYING) {
            ManageRolesService.deleteRoles(code);
            LocalStorageHelper.removeLocalStorageItem(GameLocalStorageKeyEnum.GAME_CODE);
        }
    }, [gameStatus, code]);

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center">
                <Spinner size="lg" color="default" />
            </div>
        );
    }

    return (
        <div
            className={ClassnameHelper.join(
                'h-screen w-screen relative flex items-center justify-center isolate',
            )}
        >
            <GameBoardLost />
            <GameBoardWon />

            <div className="w-5/6 h-5/6 flex items-center justify-center flex-col">{children}</div>
        </div>
    );
};
