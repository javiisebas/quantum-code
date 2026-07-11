import { BLUE_WORDS, NEUTRAL_WORDS, RED_WORDS } from '@/consts';
import { NoTeamEnum } from '@/enum/no-team.enum';
import { RoleEnum } from '@/enum/role.enum';
import { TeamEnum } from '@/enum/team.enum';

export const shuffleRoles = (): RoleEnum[] => {
    // Build a fresh array on every call so concurrent server requests never
    // share/mutate the same reference (previously a module-level array caused a race).
    const roles: RoleEnum[] = [
        ...Array<RoleEnum>(NEUTRAL_WORDS).fill(NoTeamEnum.NEUTRAL),
        ...Array<RoleEnum>(BLUE_WORDS).fill(TeamEnum.BLUE),
        ...Array<RoleEnum>(RED_WORDS).fill(TeamEnum.RED),
        NoTeamEnum.BLACK,
    ];

    for (let i = roles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    return roles;
};
