import { accentOf } from '@/games/_shared/accents';
import { gameManifests } from '@/games/registry';
import type { GameManifest } from '@/games/types';
import { Button } from '@/platform/ui/Button';
import { Chip } from '@/platform/ui/Chip';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { Screen } from '@/platform/ui/Screen';
import { Surface } from '@/platform/ui/Surface';
import { ClassnameHelper } from '@/platform/util/classnames';
import Link from 'next/link';
import { BiRightArrowAlt } from 'react-icons/bi';

/**
 * The arcade home. It is now ONE thing — the catalogue — and nothing else.
 *
 * It used to be three stacked sections: a marketing hero, a "Soy jugador" card holding a picker
 * of every game plus a code field, and then the catalogue. So the person who came to *host* had
 * to scroll past a form they'd never use, and the person who came to *join* had to scroll to a
 * form and then answer a question (which game?) that they could get wrong — and that the server
 * can now answer on its own. Joining is a different job for a different person in a different
 * hurry: it got its own page (`/join`), reachable from a single line in the header.
 */
const GameCard = ({ game }: { game: GameManifest }) => {
    const accent = accentOf(game.accent);
    return (
        <Link
            href={`/host/${game.id}`}
            aria-label={`Crear una partida de ${game.name}`}
            className="group block h-full rounded-3xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500"
        >
            <Surface
                className={ClassnameHelper.join(
                    'relative flex h-full flex-col overflow-hidden p-5 transition duration-300',
                    'hover:-translate-y-1 hover:bg-gray-900/90',
                    accent.ringHover,
                )}
            >
                <div
                    aria-hidden="true"
                    className={ClassnameHelper.join(
                        'pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br to-transparent opacity-60 blur-2xl transition-opacity duration-300 group-hover:opacity-100',
                        accent.glow,
                    )}
                />
                <span className="text-4xl" aria-hidden="true">
                    {game.emoji}
                </span>
                <h3 className="mt-4 text-lg font-bold text-white">{game.name}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-gray-400">
                    {game.tagline}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                    <Chip tone="bare" className={accent.chip}>
                        {game.players} jugadores
                    </Chip>
                    <Chip>{game.duration}</Chip>
                </div>
            </Surface>
        </Link>
    );
};

export default function ArcadeHomePage() {
    return (
        <Screen width="xl" height="scroll" className="gap-8 pb-16 sm:gap-10">
            <header className="flex h-12 shrink-0 items-center justify-between gap-4 sm:h-14">
                <Eyebrow className="tracking-[0.25em] text-purple-300">Quantum Arcade</Eyebrow>
                {/* The player's door. One line, always in reach, never in the way. */}
                <Button
                    as={Link}
                    href="/join"
                    variant="secondary"
                    size="sm"
                    endContent={<BiRightArrowAlt size={18} />}
                >
                    Tengo un código
                </Button>
            </header>

            <div className="flex flex-col items-center pt-4 text-center sm:pt-8">
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                    Juegos de fiesta
                </h1>
                <p className="mt-4 max-w-xl text-base text-gray-300 sm:text-lg">
                    Una pantalla para todos, un móvil para cada uno. Elige un juego y comparte el
                    código.
                </p>
            </div>

            <section
                aria-label="Juegos"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
                {gameManifests.map((game) => (
                    <GameCard key={game.id} game={game} />
                ))}
            </section>
        </Screen>
    );
}
