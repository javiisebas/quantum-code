import { JoinPanel } from '@/games/_shared/JoinPanel';
import { accentOf } from '@/games/_shared/accents';
import { gameManifests } from '@/games/registry';
import type { GameManifest } from '@/games/types';
import { Chip } from '@/platform/ui/Chip';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { Surface } from '@/platform/ui/Surface';
import { ClassnameHelper } from '@/platform/util/classnames';
import Link from 'next/link';

/**
 * One catalogue card = one game the host can launch onto the shared screen. Built
 * from the shared `Surface` panel so it reads as part of the same system as every
 * other card, tinted only by the game's own accent (ring on hover + a restrained
 * corner glow) so each game keeps its colour identity.
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
                    'relative flex h-full flex-col overflow-hidden p-6 transition duration-300',
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
                <span className="text-5xl" aria-hidden="true">
                    {game.emoji}
                </span>
                <h3 className="mt-5 text-xl font-bold text-white">{game.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-400">{game.tagline}</p>
                <div className="mt-6 flex flex-wrap gap-2">
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
        <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-16 px-6 py-16 sm:gap-20 lg:px-8">
            <header className="flex flex-col items-center text-center">
                <Eyebrow className="text-purple-300 tracking-[0.3em]">Quantum Arcade</Eyebrow>
                <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-6xl">
                    Juegos de fiesta
                </h1>
                <p className="mt-5 max-w-xl text-lg text-gray-300">
                    Una pantalla para todos, un móvil para cada uno. Elige un juego, comparte el
                    código y a jugar.
                </p>
            </header>

            <section aria-labelledby="join-heading" className="flex justify-center">
                <Surface className="w-full max-w-md p-6 sm:p-8">
                    <Eyebrow>Soy jugador</Eyebrow>
                    <h2 id="join-heading" className="mt-2 text-2xl font-bold text-white">
                        ¿Tienes un código?
                    </h2>
                    <p className="mt-2 text-sm text-gray-400">
                        Únete a la partida que ya está en la pantalla.
                    </p>
                    <JoinPanel className="mt-6" />
                </Surface>
            </section>

            <section aria-labelledby="host-heading">
                <div className="text-center">
                    <Eyebrow>Soy anfitrión</Eyebrow>
                    <h2
                        id="host-heading"
                        className="mt-2 text-3xl font-bold tracking-tight text-white"
                    >
                        Crea una partida
                    </h2>
                    <p className="mx-auto mt-3 max-w-md text-base text-gray-400">
                        Elige un juego para la pantalla compartida.
                    </p>
                </div>
                <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {gameManifests.map((game) => (
                        <GameCard key={game.id} game={game} />
                    ))}
                </div>
            </section>
        </main>
    );
}
