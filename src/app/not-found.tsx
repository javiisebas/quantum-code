import Link from 'next/link';
import { BiHome } from 'react-icons/bi';

/**
 * Custom 404 — themed to match the app (dark surface, purple accent), in Spanish.
 */
export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
            <p className="text-7xl font-black tracking-tight text-purple-500">404</p>
            <div className="flex flex-col gap-1.5">
                <h1 className="text-2xl font-bold text-white">Página no encontrada</h1>
                <p className="max-w-sm text-sm leading-relaxed text-gray-400">
                    La página que buscas no existe o se ha movido.
                </p>
            </div>
            <Link
                href="/"
                className="flex items-center gap-2 rounded-xl bg-purple-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-700"
            >
                <BiHome size={20} aria-hidden="true" />
                Volver al inicio
            </Link>
        </div>
    );
}
