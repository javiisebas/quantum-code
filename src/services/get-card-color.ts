import { NoTeamEnum } from '@/enum/no-team.enum';
import { RoleEnum } from '@/enum/role.enum';
import { TeamEnum } from '@/enum/team.enum';

export const getCardColor = (role: RoleEnum): string => {
    switch (role) {
        case TeamEnum.BLUE:
            return 'bg-sky-400 text-sky-900 shadow-sky-600/30 border-sky-500/40';
        case TeamEnum.RED:
            return 'bg-rose-400 text-rose-900 shadow-rose-600/30 border-rose-500/40';
        case NoTeamEnum.BLACK:
            return 'bg-black text-white shadow-black-600/30 border-gray-300/80';
        case NoTeamEnum.NEUTRAL:
            return 'bg-orange-200 text-orange-800 shadow-orange-600/30 border-orange-400/40';
        default:
            return 'bg-gray-800 text-gray-800';
    }
};
