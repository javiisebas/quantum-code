'use client';

import { Component, ReactNode } from 'react';
import { Button } from './Button';
import { Screen, ScreenBody } from './Screen';
import { Surface } from './Surface';

interface Props {
    children: ReactNode;
    /** Optional custom fallback; defaults to a friendly reload card. */
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
}

/**
 * Catches render errors in a phone game screen so an unexpected state shape never white-screens
 * the whole app — the player gets a friendly "algo ha fallado" card with a reload instead of a
 * blank page. Defense in depth: the room API already rejects malformed/oversized state and gates
 * writes behind the host token, but a phone should still degrade gracefully whatever it receives.
 */
export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: unknown): void {
        console.error('[ErrorBoundary] phone screen crashed:', error);
    }

    private readonly reset = (): void => {
        // Live game state comes from polling, so a full reload is the most reliable recovery.
        if (typeof window !== 'undefined') window.location.reload();
    };

    render(): ReactNode {
        if (!this.state.hasError) return this.props.children;
        if (this.props.fallback) return this.props.fallback;
        // The same shell, the same `card` column and the same dead-end contract as `RoomError`:
        // one viewport, one card, and no top bar — the exit IS the content.
        return (
            <Screen>
                <ScreenBody className="text-center">
                    <Surface className="w-full p-8">
                        <span className="text-4xl" aria-hidden="true">
                            😵‍💫
                        </span>
                        <h1 className="mt-3 text-xl font-bold text-white">Algo ha fallado</h1>
                        <p className="mt-2 text-sm text-gray-400">
                            La partida ha tenido un problema. Vuelve a cargar para reconectar.
                        </p>
                        {/* The only action on the screen, so it is the screen's primary. */}
                        <div className="mt-5 flex justify-center">
                            <Button variant="primary" onPress={this.reset}>
                                Recargar
                            </Button>
                        </div>
                    </Surface>
                </ScreenBody>
            </Screen>
        );
    }
}
