import { redirect } from 'next/navigation';

/** Back-compat: the old single-game host URL now lives at `/host/codenames`. */
export default function LegacyPlayRedirect() {
    redirect('/host/codenames');
}
