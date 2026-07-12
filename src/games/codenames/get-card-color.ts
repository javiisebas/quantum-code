import { NoTeamEnum } from '@/games/codenames/enums/no-team.enum';
import { RoleEnum } from '@/games/codenames/enums/role.enum';
import { TeamEnum } from '@/games/codenames/enums/team.enum';

/**
 * Revealed-card colours. Refined palette: teams are vivid, saturated fills with white
 * text (reads confidently against the dark board), the neutral is a warm muted "stone"
 * (a clear bystander, not a competing colour), and the assassin is near-black with a
 * danger-red edge + tint so it's unmistakable. A subtle inset ring + coloured shadow
 * give each card a little depth. Full class strings are kept literal so Tailwind keeps
 * them (also safelisted in tailwind.config.ts as a guard).
 */
export const getCardColor = (role: RoleEnum): string => {
    switch (role) {
        case TeamEnum.BLUE:
            return 'bg-sky-500 text-white ring-1 ring-inset ring-sky-300/40 shadow-lg shadow-sky-950/40';
        case TeamEnum.RED:
            return 'bg-rose-500 text-white ring-1 ring-inset ring-rose-300/40 shadow-lg shadow-rose-950/40';
        case NoTeamEnum.NEUTRAL:
            return 'bg-stone-300 text-stone-700 ring-1 ring-inset ring-stone-400/50 shadow-lg shadow-stone-950/20';
        case NoTeamEnum.BLACK:
            return 'bg-gray-950 text-rose-50 ring-1 ring-inset ring-rose-500/60 shadow-lg shadow-black/60';
        default:
            return 'bg-gray-800 text-gray-200';
    }
};
