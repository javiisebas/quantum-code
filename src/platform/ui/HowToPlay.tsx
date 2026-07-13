'use client';

import type { GameManifest } from '@/games/types';
import { Button } from '@/platform/ui/Button';
import { useModal } from '@/platform/ui/modal-context';
import { ModalBody, ModalHeader } from '@heroui/react';
import { BiHelpCircle } from 'react-icons/bi';

/**
 * The rules of a game, on demand — one component for all eight.
 *
 * Rules used to be a `hint` paragraph parked at the BOTTOM of the host lobby, under the primary
 * CTA: it competed with the action, it pushed the screen past the fold, and it was the first
 * thing to get cut off. Meanwhile the only real explanation in the arcade (Codenames') was
 * buried in a bespoke dock nobody else had. Rules are reference material: they belong one tap
 * away, in the same place, on every screen — not in the middle of the flow.
 */
export function HowToPlayModal({ manifest }: { manifest: GameManifest }) {
    // The global <ModalComponent> supplies the <ModalContent> shell, so this renders only the
    // inside — the same contract every other modal in the app follows.
    return (
        <>
            <ModalHeader className="flex items-center gap-3 text-white">
                <span className="text-3xl" aria-hidden="true">
                    {manifest.emoji}
                </span>
                <div className="flex flex-col">
                    <span className="text-lg font-bold">{manifest.name}</span>
                    <span className="text-xs font-medium text-gray-400">
                        {manifest.players} jugadores · {manifest.duration}
                    </span>
                </div>
            </ModalHeader>
            <ModalBody className="pb-6">
                <ol className="flex flex-col gap-4">
                    {manifest.howTo.map((step, index) => (
                        <li key={step} className="flex gap-3">
                            <span
                                aria-hidden="true"
                                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/5 font-mono text-sm font-bold text-gray-300 ring-1 ring-inset ring-white/10"
                            >
                                {index + 1}
                            </span>
                            <p className="pt-0.5 text-sm leading-relaxed text-gray-300">{step}</p>
                        </li>
                    ))}
                </ol>
            </ModalBody>
        </>
    );
}

/**
 * The `¿Cómo se juega?` affordance every game screen puts in its top bar.
 *
 * It is a BUTTON — `secondary`, like every other alternative action in the arcade — and its label
 * is never hidden. It used to be a `ghost`/`sm` control whose text disappeared below `sm:`, which
 * left a phone showing a bare `?` glyph: a control that reads as a text link on a laptop and as
 * decoration on a phone. Rules are the one thing a new player actually needs, so the affordance
 * says what it is at every width, and the `TopBar` title truncates around it (that is what a title
 * is for — an action does not shrink to make room for a name people can already see).
 */
export function HowToPlayButton({ manifest }: { manifest: GameManifest }) {
    const { openModal } = useModal();
    return (
        <Button
            variant="secondary"
            size="md"
            startContent={<BiHelpCircle size={18} />}
            onPress={() => openModal(<HowToPlayModal manifest={manifest} />)}
            aria-label="¿Cómo se juega?"
        >
            {/*
             * The label SHORTENS on a phone; it never disappears. At 375px the full question ate
             * ~170px of a 375px bar and truncated the game's own name down to "La Bo…" — so the
             * bar was spending its width telling you what the button does instead of what you are
             * looking at. "Reglas" is the same button, said shorter.
             */}
            <span className="sm:hidden">Reglas</span>
            <span className="hidden sm:inline">¿Cómo se juega?</span>
        </Button>
    );
}
