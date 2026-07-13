'use client';

import { RoomShare } from '@/platform/ui/RoomShare';
import { ModalBody, ModalHeader } from '@heroui/react';
import { FC } from 'react';

interface ShareModalProps {
    /** The join code players scan or type. */
    code: number;
    /** Display name of the game (used in the native-share text). */
    gameName: string;
}

/**
 * "Share the room" modal for the Codenames host menu — the one game whose board owns the whole
 * screen, so its way in has to live behind a button instead of beside the board.
 *
 * It is only modal chrome around <RoomShare>, the same share surface the lobby of every other
 * game renders inline, so there is exactly one QR / copy-link / share experience in the arcade.
 * The `game` prop is gone: the QR now encodes `/j/<code>` and the server resolves the game.
 */
export const ShareModal: FC<ShareModalProps> = ({ code, gameName }) => (
    <div>
        <ModalHeader className="text-lg font-bold text-white">Comparte la partida</ModalHeader>
        <ModalBody className="pb-8">
            <RoomShare code={code} gameName={gameName} />
        </ModalBody>
    </div>
);
