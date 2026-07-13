/**
 * Per-game accent → complete Tailwind class strings. Kept as literals (never
 * interpolated) so Tailwind's scanner always sees them. Shared by the arcade landing
 * cards and each game's host so a game keeps its colour identity end-to-end (a rose
 * game's lobby CTA is rose, not a generic purple).
 */
export interface AccentClasses {
    /** Solid CTA button (host "start"/"new round"). */
    solidButton: string;
    /** Accent-tinted text. */
    text: string;
    /** Arcade card hover ring. */
    ringHover: string;
    /** Arcade card corner glow (gradient `from-`). */
    glow: string;
    /** Arcade card players chip. */
    chip: string;
}

export const ACCENTS: Record<string, AccentClasses> = {
    purple: {
        solidButton: 'bg-purple-600 hover:bg-purple-500',
        text: 'text-purple-300',
        ringHover: 'hover:ring-purple-400/60',
        glow: 'from-purple-500/20',
        chip: 'bg-purple-400/15 text-purple-200',
    },
    rose: {
        solidButton: 'bg-rose-600 hover:bg-rose-500',
        text: 'text-rose-300',
        ringHover: 'hover:ring-rose-400/60',
        glow: 'from-rose-500/20',
        chip: 'bg-rose-400/15 text-rose-200',
    },
    emerald: {
        solidButton: 'bg-emerald-600 hover:bg-emerald-500',
        text: 'text-emerald-300',
        ringHover: 'hover:ring-emerald-400/60',
        glow: 'from-emerald-500/20',
        chip: 'bg-emerald-400/15 text-emerald-200',
    },
    amber: {
        solidButton: 'bg-amber-500 hover:bg-amber-400',
        text: 'text-amber-300',
        ringHover: 'hover:ring-amber-400/60',
        glow: 'from-amber-500/20',
        chip: 'bg-amber-400/15 text-amber-200',
    },
    lime: {
        solidButton: 'bg-lime-600 hover:bg-lime-500',
        text: 'text-lime-300',
        ringHover: 'hover:ring-lime-400/60',
        glow: 'from-lime-500/20',
        chip: 'bg-lime-400/15 text-lime-200',
    },
    yellow: {
        solidButton: 'bg-yellow-500 hover:bg-yellow-400',
        text: 'text-yellow-300',
        ringHover: 'hover:ring-yellow-400/60',
        glow: 'from-yellow-500/20',
        chip: 'bg-yellow-400/15 text-yellow-200',
    },
    cyan: {
        solidButton: 'bg-cyan-600 hover:bg-cyan-500',
        text: 'text-cyan-300',
        ringHover: 'hover:ring-cyan-400/60',
        glow: 'from-cyan-500/20',
        chip: 'bg-cyan-400/15 text-cyan-200',
    },
    orange: {
        solidButton: 'bg-orange-600 hover:bg-orange-500',
        text: 'text-orange-300',
        ringHover: 'hover:ring-orange-400/60',
        glow: 'from-orange-500/20',
        chip: 'bg-orange-400/15 text-orange-200',
    },
};

/** Resolve an accent's classes by token, falling back to purple. */
export const accentOf = (accent: string): AccentClasses => ACCENTS[accent] ?? ACCENTS.purple;
