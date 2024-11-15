import { GameProvider } from '@/contexts/GameContext';

export function PlayProviders({ children }: { children: React.ReactNode }) {
    return <GameProvider>{children}</GameProvider>;
}
