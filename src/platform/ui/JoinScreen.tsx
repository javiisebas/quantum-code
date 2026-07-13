'use client';

import { gameManifests } from '@/games/registry';
import { useJoinFlow, type JoinError, type JoinTarget } from '@/platform/room/use-join-flow';
import { Button } from '@/platform/ui/Button';
import { Chip } from '@/platform/ui/Chip';
import { CodeInput } from '@/platform/ui/CodeInput';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { QrScannerOverlay } from '@/platform/ui/QrScannerOverlay';
import { Screen } from '@/platform/ui/Screen';
import { Surface } from '@/platform/ui/Surface';
import { TopBar } from '@/platform/ui/TopBar';
import { ClassnameHelper } from '@/platform/util/classnames';
import { Spinner } from '@heroui/react';
import { motion } from 'framer-motion';
import { BiQr } from 'react-icons/bi';

/**
 * The player's way in — one screen, one job, no scrolling.
 *
 * What it replaces: a join CARD wedged between a marketing hero and the game catalogue on the
 * home page, holding a picker of all eight games. The picker was there because a code used to
 * be meaningless without knowing its game — but that made the player answer a question only the
 * server can answer, and answering it WRONG (the picker defaulted to Código Secreto) dumped them
 * in an empty form for a game nobody was playing. Codes are now unique across the arcade, so the
 * question is gone, and what's left is exactly two ways in: scan, or type.
 *
 * It is also the ONLY screen most players will ever see of the product before they play: the
 * host shares the join link, so for them this is the arcade. It therefore carries the same
 * language as the home page — wordmark, purple glow, the games themselves — while staying a
 * single-purpose screen whose code field is above the fold on a 667px phone with the keyboard up.
 */
const MESSAGES: Record<JoinError, string> = {
    unknown: 'No hay ninguna partida con ese código. Comprueba los dígitos con el anfitrión.',
    scan: 'Ese QR no es de una partida. Prueba a apuntar de nuevo.',
    network: 'No hemos podido conectar. Inténtalo otra vez.',
};

/**
 * The moment the code becomes a game. `resolveJoinCode` has always known which game it found;
 * we just never showed it — the player watched a spinner and then arrived somewhere. Naming the
 * game closes the loop on the one thing they couldn't know when they typed the digits.
 */
const ResolvedTarget = ({ target }: { target: JoinTarget }) => (
    <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex flex-col items-center gap-4 py-2 text-center"
    >
        <motion.span
            initial={{ scale: 0.4 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
            className="text-5xl short:text-4xl"
            aria-hidden="true"
        >
            {target.emoji}
        </motion.span>
        <div role="status" aria-live="polite">
            <Eyebrow className="text-purple-300">Te unes a</Eyebrow>
            <p className="mt-1.5 text-2xl font-bold text-white">{target.name}</p>
        </div>
        {/* A <div>, not a <p>: HeroUI's Spinner renders a <div>, and a block element inside a
            paragraph is invalid HTML — React tears the tree apart on hydration over it. */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
            <Spinner size="sm" color="current" />
            <span>Entrando en la partida…</span>
        </div>
    </motion.div>
);

export function JoinScreen({
    initialCode = '',
    initialError = null,
}: {
    /** Pre-filled digits — a scanned link whose room is gone comes back here with them. */
    initialCode?: string;
    initialError?: JoinError | null;
}) {
    const {
        code,
        scanning,
        error,
        resolving,
        resolved,
        valid,
        handleCode,
        handleDetect,
        submit,
        submitIfValid,
        openScanner,
        closeScanner,
    } = useJoinFlow(initialCode, initialError);

    return (
        // Full-width page so the chrome spans it; the card is what's capped narrow.
        <Screen width="full" height="fit">
            <TopBar variant="back" backLabel="Volver al inicio" />

            {/*
             * On a tall phone the whole block is centred. On a SHORT one (≤720px, an SE) the
             * block rides to the top and the arcade strip is pushed to the bottom edge instead:
             * that keeps the code field — the entire point of the screen — high enough to stay
             * above the software keyboard, and spends the leftover height on decoration rather
             * than on pushing the field under it.
             */}
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 py-4 short:justify-start short:gap-5 short:py-2">
                <header className="flex flex-col items-center text-center">
                    <Eyebrow className="tracking-[0.25em] text-purple-300">Quantum Arcade</Eyebrow>
                    <h1 className="mt-2 text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl short:mt-1.5 short:text-xl">
                        Estás a seis dígitos de jugar
                    </h1>
                </header>

                <Surface className="relative w-full max-w-md overflow-hidden p-6 short:p-5 sm:p-8">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gradient-to-br from-purple-500/25 to-transparent opacity-80 blur-2xl"
                    />

                    <div className="relative flex flex-col gap-6 short:gap-5">
                        {resolved ? (
                            <ResolvedTarget target={resolved} />
                        ) : (
                            <>
                                <div className="flex flex-col gap-3">
                                    <CodeInput
                                        value={code}
                                        onChange={handleCode}
                                        onComplete={submitIfValid}
                                        autoFocus
                                    />

                                    {/*
                                     * ONE line that is always occupied: the hint when all is well,
                                     * the reason when it isn't. Reserving an empty 40px slot for an
                                     * error that may never come reads as a hole in the card; letting
                                     * the error push the buttons down makes them move under the
                                     * thumb. This does neither.
                                     */}
                                    <p
                                        role="alert"
                                        aria-live="polite"
                                        className={ClassnameHelper.join(
                                            'min-h-[2.5rem] text-center text-sm leading-snug',
                                            error ? 'text-rose-300' : 'text-gray-400',
                                        )}
                                    >
                                        {error
                                            ? MESSAGES[error]
                                            : 'El anfitrión lo tiene en la pantalla compartida.'}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <Button
                                        variant="primary"
                                        fullWidth
                                        isDisabled={!valid || resolving}
                                        onPress={submit}
                                        startContent={
                                            resolving ? (
                                                <Spinner size="sm" color="current" />
                                            ) : undefined
                                        }
                                    >
                                        {resolving ? 'Buscando la partida…' : 'Unirse'}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        fullWidth
                                        startContent={<BiQr size={20} />}
                                        onPress={openScanner}
                                        isDisabled={resolving}
                                    >
                                        Escanear QR
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </Surface>

                {/*
                 * What's waiting on the other side of the code. The person who follows a shared
                 * join link has, until now, seen a form and nothing else — no reason to believe
                 * there is a product here at all. The catalogue's own emojis are the cheapest
                 * possible answer, and they cost no height that the screen was using.
                 */}
                <footer className="flex flex-col items-center gap-2.5 short:mt-auto">
                    <ul
                        className="flex items-center justify-center gap-2 short:gap-1.5"
                        aria-hidden="true"
                    >
                        {gameManifests.map((game) => (
                            <li key={game.id} className="text-xl opacity-70 short:text-lg">
                                {game.emoji}
                            </li>
                        ))}
                    </ul>
                    <Chip>{gameManifests.length} juegos de fiesta te esperan</Chip>
                </footer>
            </div>

            {scanning && <QrScannerOverlay onDetect={handleDetect} onClose={closeScanner} />}
        </Screen>
    );
}
