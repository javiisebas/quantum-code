import { JoinScreen } from '@/platform/ui/JoinScreen';
import type { Metadata } from 'next';

/**
 * `/join` — the player's dedicated entry point. It exists as its own page (rather than a card
 * on the home screen) because joining is a distinct, single-purpose job done in a hurry, on a
 * phone, by someone who is not browsing: they want the code field, nothing else, above the fold.
 */
export const metadata: Metadata = {
    title: 'Únete a la partida',
};

export default function JoinPage() {
    return <JoinScreen />;
}
