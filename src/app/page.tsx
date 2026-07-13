import { accentOf } from '@/games/_shared/accents';
import { gameManifests } from '@/games/registry';
import type { GameManifest } from '@/games/types';
import { Button, FOCUS_RING } from '@/platform/ui/Button';
import { Chip } from '@/platform/ui/Chip';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { Screen } from '@/platform/ui/Screen';
import { Surface } from '@/platform/ui/Surface';
import { TopBar } from '@/platform/ui/TopBar';
import { ClassnameHelper } from '@/platform/util/classnames';
import Link from 'next/link';
import { BiQr, BiRightArrowAlt } from 'react-icons/bi';

/**
 * The arcade home. Two doors and a catalogue, in that order.
 *
 * It used to be three stacked sections: a marketing hero, a "Soy jugador" card holding a picker
 * of every game plus a code field, and then the catalogue. So the person who came to *host* had
 * to scroll past a form they'd never use, and the person who came to *join* had to scroll to a
 * form and then answer a question (which game?) that they could get wrong — and that the server
 * can now answer on its own. Joining is a different job for a different person in a different
 * hurry: it got its own page (`/join`).
 *
 * That page then had to be REACHED, and for a while it was reached through a `size="sm"` button
 * in the header — which is chrome, and reads as chrome: an afterthought tucked beside the
 * wordmark. But half the people who ever open this page are holding a code somebody else's
 * screen is showing them; joining isn't a utility link, it's one of exactly two things you can
 * do here. So the two doors are now stated as a pair — "Soy jugador" (below) and "Soy anfitrión"
 * (the catalogue) — and each is announced the same way, with an eyebrow and a heading.
 */
const JoinDoor = () => (
    <Surface className="relative flex flex-col gap-6 overflow-hidden p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-7">
        <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-purple-500/25 to-transparent blur-3xl"
        />

        <div className="relative flex items-center gap-4 sm:gap-5">
            <Surface
                tone="inset"
                radius="2xl"
                className="flex size-12 shrink-0 items-center justify-center text-purple-300 sm:size-14"
            >
                <BiQr size={26} />
            </Surface>
            <div className="min-w-0">
                <Eyebrow className="text-purple-300">Soy jugador</Eyebrow>
                <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                    Únete con un código
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-gray-400">
                    Escanea el QR o escribe los 6 dígitos de la pantalla compartida.
                </p>
            </div>
        </div>

        <Button
            as={Link}
            href="/join"
            variant="primary"
            className="relative w-full shrink-0 sm:w-auto"
            endContent={<BiRightArrowAlt size={20} />}
        >
            Tengo un código
        </Button>
    </Surface>
);

const GameCard = ({ game }: { game: GameManifest }) => {
    const accent = accentOf(game.accent);
    return (
        <Link
            href={`/host/${game.id}`}
            aria-label={`Crear una partida de ${game.name}`}
            // A clickable CARD, not a button — but it is still a control, so it focuses with the
            // system's ring rather than a copy of it.
            className={ClassnameHelper.join('group block h-full rounded-3xl', FOCUS_RING)}
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
        // The one page rail and the one `<TopBar>`, exactly as every game screen has them: the
        // home page used to hand-roll a header of its own inside a NARROWER page (`max-w-5xl`),
        // so stepping from the catalogue into a game visibly jumped the chrome sideways and
        // swapped one header for a different one. It is the only `height="scroll"` screen in the
        // arcade — a catalogue is genuinely long, and is the one thing allowed to page-scroll.
        <Screen height="scroll" className="gap-8 pb-16 sm:gap-10">
            {/* No home key: this IS home. */}
            <TopBar
                back={null}
                emoji="🕹️"
                title="Quantum Arcade"
                right={<Chip>{gameManifests.length} juegos</Chip>}
            />

            {/*
             * The one heading in the arcade that is NOT the screen's identity — the top bar
             * carries that. This is the product's promise, and the home page is the only screen
             * with something to promise, so it stays: centred, in the body, as a lede.
             */}
            <div className="flex flex-col items-center pt-2 text-center sm:pt-6">
                <h2 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                    Juegos de fiesta
                </h2>
                <p className="mt-4 max-w-xl text-base text-gray-300 sm:text-lg">
                    Una pantalla para todos, un móvil para cada uno. Sin instalar nada.
                </p>
            </div>

            <JoinDoor />

            <section aria-labelledby="catalogo">
                {/* The count moved to the top bar (where every other screen puts its one piece of
                    screen-level chrome), so this header stops repeating it. */}
                <div className="mb-5">
                    <Eyebrow className="text-purple-300">Soy anfitrión</Eyebrow>
                    <h2 id="catalogo" className="mt-1 text-xl font-bold text-white sm:text-2xl">
                        Elige un juego
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {gameManifests.map((game) => (
                        <GameCard key={game.id} game={game} />
                    ))}
                </div>
            </section>
        </Screen>
    );
}
