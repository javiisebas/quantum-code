import { FC } from 'react';
import { GameBoardFrame } from './GameBoardFrame';
import { GameBoardMenu } from './GameBoardMenu';
import { GameBoardTable } from './GameBoardTable';

export const GameBoard: FC = () => {
    return (
        <GameBoardFrame>
            <GameBoardTable />
            <GameBoardMenu />
        </GameBoardFrame>
    );
};
