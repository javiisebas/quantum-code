import { gameManifests } from '@/games/registry';
import { JoinScreen } from '@/platform/ui/JoinScreen';
import type { Metadata } from 'next';

/**
 * `/join` — the player's dedicated entry point. It exists as its own page (rather than a card
 * on the home screen) because joining is a distinct, single-purpose job done in a hurry, on a
 * phone, by someone who is not browsing: they want the code field, nothing else, above the fold.
 *
 * It is also the link hosts actually SHARE, which makes this page's preview card the first thing
 * many players ever see of the arcade — hence its own description rather than the site-wide one.
 */
export const metadata: Metadata = {
    title: 'Únete a la partida',
    description: `Escribe los seis dígitos que ves en la pantalla compartida y entra a jugar. ${gameManifests.length} juegos de fiesta, sin instalar nada.`,
};

export default function JoinPage() {
    return <JoinScreen />;
}
