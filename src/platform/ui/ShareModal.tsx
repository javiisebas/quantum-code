'use client';

import { RoomShare } from '@/platform/ui/RoomShare';
import { ModalBody, ModalHeader } from '@heroui/react';
import { FC } from 'react';

interface ShareModalProps {
    /** The join code players type or scan. */
    code: number;
    /** Game id — used to build the `/join/<game>?code=…` link. */
    game: string;
    /** Display name of the game (used in the native-share text). */
    gameName: string;
}

/**
 * "Share the room" modal for the codenames host menu. It is now just modal chrome
 * (header + body) around <RoomShare> — the single share surface reused across the
 * arcade — so all the QR / copy-link / native-share logic lives in one place. Public
 * props are unchanged; GameContext and GameBoardMenu depend on this exact signature.
 */
export const ShareModal: FC<ShareModalProps> = ({ code, game, gameName }) => (
    <div>
        <ModalHeader className="text-lg font-bold text-white">Comparte la partida</ModalHeader>
        <ModalBody className="pb-8">
            <RoomShare code={code} game={game} gameName={gameName} />
        </ModalBody>
    </div>
);
