import { Button } from '@/platform/ui/Button';
import { Surface } from '@/platform/ui/Surface';
import Link from 'next/link';
import { BiHome } from 'react-icons/bi';

/**
 * Custom 404 — themed to match the app (dark surface, purple accent), in Spanish.
 */
export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center px-6">
            <Surface className="flex w-full max-w-sm flex-col items-center gap-6 p-8 text-center">
                <p className="text-7xl font-black tracking-tight text-purple-500">404</p>
                <div className="flex flex-col gap-1.5">
                    <h1 className="text-2xl font-bold text-white">Página no encontrada</h1>
                    <p className="text-sm leading-relaxed text-gray-400">
                        La página que buscas no existe o se ha movido.
                    </p>
                </div>
                <Button variant="primary" as={Link} href="/" startContent={<BiHome size={20} />}>
                    Volver al inicio
                </Button>
            </Surface>
        </div>
    );
}
