import { accentOf } from '@/games/_shared/accents';
import { gameManifests } from '@/games/registry';
import type { GameManifest } from '@/games/types';
import { ClassnameHelper } from '@/platform/util/classnames';
import Link from 'next/link';

const GameCard = ({ game }: { game: GameManifest }) => {
    const accent = accentOf(game.accent);
    return (
        <Link
            href={`/host/${game.id}`}
            aria-label={`Crear una partida de ${game.name}`}
            className={ClassnameHelper.join(
                'group relative flex flex-col overflow-hidden rounded-3xl bg-gray-900/70 p-6 text-left ring-1 ring-inset ring-white/10 backdrop-blur transition',
                'hover:-translate-y-1 hover:bg-gray-900/90',
                accent.ringHover,
            )}
        >
            <div
                className={ClassnameHelper.join(
                    'pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br to-transparent opacity-60 blur-2xl transition-opacity group-hover:opacity-100',
                    accent.glow,
                )}
                aria-hidden="true"
            />
            <span className="text-5xl" aria-hidden="true">
                {game.emoji}
            </span>
            <h2 className="mt-4 text-xl font-bold text-white">{game.name}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-400">{game.tagline}</p>
            <div className="mt-5 flex flex-wrap gap-2">
                <span
                    className={ClassnameHelper.join(
                        'rounded-full px-3 py-1 text-xs font-semibold',
                        accent.chip,
                    )}
                >
                    {game.players} jugadores
                </span>
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-gray-300">
                    {game.duration}
                </span>
            </div>
        </Link>
    );
};

export default function ArcadeHomePage() {
    return (
        <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-16 lg:px-8">
            <header className="text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-300">
                    Quantum Arcade
                </p>
                <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-6xl">
                    Juegos de fiesta
                </h1>
                <p className="mx-auto mt-5 max-w-xl text-lg text-gray-300">
                    Una pantalla para todos, un móvil para cada uno. Elige un juego, comparte el
                    código y a jugar.
                </p>
            </header>

            <section
                aria-label="Catálogo de juegos"
                className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
                {gameManifests.map((game) => (
                    <GameCard key={game.id} game={game} />
                ))}
            </section>

            <div className="mt-12 flex flex-col items-center gap-3">
                <p className="text-sm text-gray-400">¿Ya tienes un código de partida?</p>
                <Link
                    href="/join"
                    className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
                >
                    Unirse a una partida
                </Link>
            </div>
        </main>
    );
}
