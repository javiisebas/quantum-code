'use client';

import { Eyebrow } from '@/platform/ui/Eyebrow';
import { Surface } from '@/platform/ui/Surface';
import { ModalBody, ModalHeader } from '@heroui/react';
import { FC } from 'react';

interface LegendItem {
    dot: string;
    label: string;
    description: string;
}

// Dots mirror the revealed-card palette in `get-card-color.ts` so the legend and the
// board always agree.
const LEGEND: LegendItem[] = [
    { dot: 'bg-sky-500', label: 'Equipo azul', description: '6 cartas por descubrir.' },
    { dot: 'bg-rose-500', label: 'Equipo rojo', description: '7 cartas por descubrir.' },
    { dot: 'bg-stone-300', label: 'Neutral', description: 'Sin efecto, pierdes el turno.' },
    { dot: 'bg-gray-950', label: 'Asesino', description: 'Si lo revelas, pierdes al instante.' },
];

const STEPS: string[] = [
    'Un dispositivo hace de tablero compartido y muestra 25 palabras.',
    'Cada espía escanea el QR (o entra en /join e introduce el código) para ver en su móvil el mapa secreto de colores.',
    'Por turnos, el equipo da pistas y toca palabras en el tablero para revelar su color.',
    'Aciertas una carta de tu color y sigues; fallas y pasa el turno al rival.',
    'Gana el primer equipo que revela todas sus cartas. Revelar al asesino es la derrota inmediata.',
];

/** First-run onboarding: how the shared-board + phone-spies game works. */
export const ModalHowToPlayContent: FC = () => {
    return (
        <div>
            <ModalHeader className="flex flex-col gap-1">Cómo se juega</ModalHeader>
            <ModalBody className="gap-5 pb-8">
                <ol className="flex flex-col gap-3">
                    {STEPS.map((step, index) => (
                        <li key={index} className="flex gap-3 text-sm text-gray-200">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-semibold text-white">
                                {index + 1}
                            </span>
                            <span className="leading-relaxed">{step}</span>
                        </li>
                    ))}
                </ol>

                <Surface tone="inset" radius="xl" className="flex flex-col gap-2 p-4">
                    <Eyebrow>Los colores</Eyebrow>
                    {LEGEND.map((item) => (
                        <div key={item.label} className="flex items-center gap-3 text-sm">
                            <span
                                className={`h-4 w-4 shrink-0 rounded-full ring-1 ring-white/20 ${item.dot}`}
                                aria-hidden="true"
                            />
                            <span className="font-medium text-white">{item.label}</span>
                            <span className="text-gray-400">{item.description}</span>
                        </div>
                    ))}
                </Surface>
            </ModalBody>
        </div>
    );
};
