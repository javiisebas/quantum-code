import { BLUE_WORDS, NEUTRAL_WORDS, RED_WORDS } from '@/consts';
import { NoTeamEnum } from '@/enum/no-team.enum';
import { RoleEnum } from '@/enum/role.enum';
import { TeamEnum } from '@/enum/team.enum';

const roles: RoleEnum[] = [
    ...Array(NEUTRAL_WORDS).fill(NoTeamEnum.NEUTRAL),
    ...Array(BLUE_WORDS).fill(TeamEnum.BLUE),
    ...Array(RED_WORDS).fill(TeamEnum.RED),
    NoTeamEnum.BLACK,
] as RoleEnum[];

export const shuffleRoles = (): RoleEnum[] => {
    for (let i = roles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [roles[i], roles[j]] = [roles[j], roles[i]];
    }
    return roles;
};
