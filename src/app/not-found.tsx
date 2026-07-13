import { Button } from '@/platform/ui/Button';
import { Screen, ScreenBody } from '@/platform/ui/Screen';
import { Surface } from '@/platform/ui/Surface';
import Link from 'next/link';
import { BiHome } from 'react-icons/bi';

/**
 * Custom 404 — themed to match the app (dark surface, purple accent), in Spanish.
 *
 * A dead end, so it wears the same shell as the arcade's other dead ends (`RoomError`,
 * `ErrorBoundary`): the one `<Screen>`, the one `card` column, and no `<TopBar>` — the way out
 * is the card's own button, and it is the only thing on the screen.
 */
export default function NotFound() {
    return (
        <Screen>
            <ScreenBody>
                <Surface className="flex w-full flex-col items-center gap-6 p-8 text-center">
                    <p className="text-7xl font-black tracking-tight text-purple-500">404</p>
                    <div className="flex flex-col gap-1.5">
                        <h1 className="text-2xl font-bold text-white">Página no encontrada</h1>
                        <p className="text-sm leading-relaxed text-gray-400">
                            La página que buscas no existe o se ha movido.
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        as={Link}
                        href="/"
                        startContent={<BiHome size={20} />}
                    >
                        Volver al inicio
                    </Button>
                </Surface>
            </ScreenBody>
        </Screen>
    );
}
