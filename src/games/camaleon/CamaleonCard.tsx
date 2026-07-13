'use client';

import { SecretCardScreen } from '@/games/_shared/SecretCardScreen';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { Surface } from '@/platform/ui/Surface';
import { ClassnameHelper } from '@/platform/util/classnames';
import { FC } from 'react';
import { BiSolidMask } from 'react-icons/bi';
import type { CamaleonSeatView } from './domain';
import { camaleonManifest } from './manifest';

interface CamaleonCardProps {
    view: CamaleonSeatView;
}

/**
 * The theme and its 4×4 board — identical on every phone. `highlight` marks the secret word's
 * cell (lime tile) for ordinary players so they can locate it; the Chameleon is passed `null`, so
 * their board gives nothing away — they must deduce the word from what everyone says.
 */
const WordBoard: FC<{ theme: string; words: string[]; highlight: number | null }> = ({
    theme,
    words,
    highlight,
}) => (
    <>
        <Eyebrow as="p" className="mb-1 text-center">
            Tema
        </Eyebrow>
        <p className="text-center text-lg font-bold text-white">{theme}</p>

        <div className="mt-4 grid grid-cols-4 gap-2">
            {words.map((word, i) => (
                <Surface
                    key={`${i}-${word}`}
                    tone={i === highlight ? 'plain' : 'inset'}
                    radius="xl"
                    className={ClassnameHelper.join(
                        'flex min-h-12 items-center justify-center break-words px-1.5 py-2 text-center text-xs font-medium leading-tight',
                        i === highlight
                            ? 'bg-lime-500/20 font-bold text-lime-200 ring-lime-400/50'
                            : 'text-gray-300',
                    )}
                >
                    {word}
                </Surface>
            ))}
        </div>
    </>
);

/** This phone's secret Camaleón card: either "you are the Chameleon" or the secret word. */
export const CamaleonCard: FC<CamaleonCardProps> = ({ view }) => {
    // The view is already projected for this seat: the Chameleon or an ordinary player.
    // Camaleón shares one board (no per-seat array), so there is no "partida completa" guard.
    const isChameleon = view.kind === 'chameleon';

    return (
        <SecretCardScreen
            manifest={camaleonManifest}
            seat={view.seat}
            reference={
                <WordBoard
                    theme={view.theme}
                    words={view.grid}
                    highlight={isChameleon ? null : view.secretIndex}
                />
            }
        >
            <Surface
                tone={isChameleon ? 'plain' : 'panel'}
                className={ClassnameHelper.join(
                    'flex w-full flex-col items-center p-6 text-center sm:p-8',
                    isChameleon && 'bg-lime-950/60 ring-lime-500/40',
                )}
            >
                {isChameleon ? (
                    <>
                        <BiSolidMask className="text-lime-400" size={56} />
                        <h1 className="mt-3 text-3xl font-extrabold uppercase tracking-wide text-lime-300">
                            Eres el Camaleón
                        </h1>
                        <p className="mt-3 text-sm text-gray-300">
                            No conoces la palabra. Disimula y averíguala.
                        </p>
                    </>
                ) : (
                    <>
                        <Eyebrow>Tu palabra</Eyebrow>
                        <h1 className="mt-1 text-3xl font-extrabold text-lime-300">
                            {view.grid[view.secretIndex]}
                        </h1>
                        <p className="mt-3 text-sm text-gray-300">
                            Di una palabra relacionada para demostrar que la conoces… sin que el
                            camaleón la adivine.
                        </p>
                    </>
                )}
            </Surface>
        </SecretCardScreen>
    );
};
