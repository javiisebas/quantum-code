import { NoTeamEnum } from '@/enum/no-team.enum';
import { RoleEnum } from '@/enum/role.enum';
import { TeamEnum } from '@/enum/team.enum';

export const getCardColor = (role: RoleEnum): string => {
    switch (role) {
        case TeamEnum.BLUE:
            return 'bg-cyan-400/80 text-gray-800 shadow-lg shadow-cyan-600/30 border-cyan-500/40';
        case TeamEnum.RED:
            return 'bg-rose-400/80 text-gray-800 shadow-lg shadow-rose-600/30 border-rose-500/40';
        case NoTeamEnum.BLACK:
            return 'bg-black text-white shadow-lg shadow-black-600/30 border-black-500/40';
        case NoTeamEnum.NEUTRAL:
            return 'bg-orange-300/80 text-gray-800 shadow-lg shadow-orange-600/30 border-orange-500/40';
        default:
            return 'bg-gray-300 text-gray-800';
    }
};
