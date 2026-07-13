/**
 * Per-game accent → complete Tailwind class strings. Kept as literals (never
 * interpolated) so Tailwind's scanner always sees them. Shared by the arcade landing
 * cards and each game's host so a game keeps its colour identity end-to-end (a rose
 * game's lobby CTA is rose, not a generic purple).
 *
 * The hex `confetti` palette lives here for the same reason: a game's colour is decided in ONE
 * place, so its celebration can't drift from the CTA it fires next to.
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
    /** Winner tint (podium leader, winning answer): background + ring colour. */
    highlight: string;
    /** Native control tint (`accent-color`) for a range input. */
    range: string;
    /** Confetti palette — hex, because it paints a canvas rather than a class. */
    confetti: string[];
}

export const ACCENTS: Record<string, AccentClasses> = {
    purple: {
        solidButton: 'bg-purple-600 hover:bg-purple-500',
        text: 'text-purple-300',
        ringHover: 'hover:ring-purple-400/60',
        glow: 'from-purple-500/20',
        chip: 'bg-purple-400/15 text-purple-200',
        highlight: 'bg-purple-500/15 ring-purple-400/40',
        range: 'accent-purple-400',
        confetti: ['#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff', '#ffffff'],
    },
    rose: {
        solidButton: 'bg-rose-600 hover:bg-rose-500',
        text: 'text-rose-300',
        ringHover: 'hover:ring-rose-400/60',
        glow: 'from-rose-500/20',
        chip: 'bg-rose-400/15 text-rose-200',
        highlight: 'bg-rose-500/15 ring-rose-400/40',
        range: 'accent-rose-400',
        confetti: ['#e11d48', '#fb7185', '#fda4af', '#fecdd3', '#ffffff'],
    },
    emerald: {
        solidButton: 'bg-emerald-600 hover:bg-emerald-500',
        text: 'text-emerald-300',
        ringHover: 'hover:ring-emerald-400/60',
        glow: 'from-emerald-500/20',
        chip: 'bg-emerald-400/15 text-emerald-200',
        highlight: 'bg-emerald-500/15 ring-emerald-400/40',
        range: 'accent-emerald-400',
        confetti: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#ffffff'],
    },
    amber: {
        solidButton: 'bg-amber-500 hover:bg-amber-400',
        text: 'text-amber-300',
        ringHover: 'hover:ring-amber-400/60',
        glow: 'from-amber-500/20',
        chip: 'bg-amber-400/15 text-amber-200',
        highlight: 'bg-amber-500/15 ring-amber-400/40',
        range: 'accent-amber-400',
        confetti: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#ffffff'],
    },
    lime: {
        solidButton: 'bg-lime-600 hover:bg-lime-500',
        text: 'text-lime-300',
        ringHover: 'hover:ring-lime-400/60',
        glow: 'from-lime-500/20',
        chip: 'bg-lime-400/15 text-lime-200',
        highlight: 'bg-lime-500/15 ring-lime-400/40',
        range: 'accent-lime-400',
        confetti: ['#84cc16', '#a3e635', '#bef264', '#d9f99d', '#ffffff'],
    },
    yellow: {
        solidButton: 'bg-yellow-500 hover:bg-yellow-400',
        text: 'text-yellow-300',
        ringHover: 'hover:ring-yellow-400/60',
        glow: 'from-yellow-500/20',
        chip: 'bg-yellow-400/15 text-yellow-200',
        highlight: 'bg-yellow-500/15 ring-yellow-400/40',
        range: 'accent-yellow-400',
        confetti: ['#eab308', '#facc15', '#fde047', '#fef08a', '#ffffff'],
    },
    cyan: {
        solidButton: 'bg-cyan-600 hover:bg-cyan-500',
        text: 'text-cyan-300',
        ringHover: 'hover:ring-cyan-400/60',
        glow: 'from-cyan-500/20',
        chip: 'bg-cyan-400/15 text-cyan-200',
        highlight: 'bg-cyan-500/15 ring-cyan-400/40',
        range: 'accent-cyan-400',
        confetti: ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#ffffff'],
    },
    orange: {
        solidButton: 'bg-orange-600 hover:bg-orange-500',
        text: 'text-orange-300',
        ringHover: 'hover:ring-orange-400/60',
        glow: 'from-orange-500/20',
        chip: 'bg-orange-400/15 text-orange-200',
        highlight: 'bg-orange-500/15 ring-orange-400/40',
        range: 'accent-orange-400',
        confetti: ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffffff'],
    },
};

/** Resolve an accent's classes by token, falling back to purple. */
export const accentOf = (accent: string): AccentClasses => ACCENTS[accent] ?? ACCENTS.purple;
