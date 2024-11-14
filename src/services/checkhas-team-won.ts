import { BLUE_WORDS, RED_WORDS } from '@/consts';
import { RoleEnum } from '@/enum/role.enum';
import { TeamEnum } from '@/enum/team.enum';

export const checkHasTeamWon = (roles: Array<RoleEnum | null>, team: RoleEnum): boolean => {
    const total = team === TeamEnum.BLUE ? BLUE_WORDS : RED_WORDS;
    return roles.filter((r) => r === team).length === total;
};
