import { RoleEnum } from '@/enum/role.enum';
import { TeamEnum } from '@/enum/team.enum';

/** Per-team progress: how many of a team's cards are revealed vs. its total. */
export type TeamProgress = {
    blue: { found: number; total: number };
    red: { found: number; total: number };
};

/**
 * Count, for a single team, its total cards on the board and how many of those are
 * already revealed. Tolerates a `revealed` array that is shorter than `roles`
 * (missing entries count as not revealed).
 */
const countTeam = (
    roles: RoleEnum[],
    revealed: boolean[],
    team: TeamEnum,
): { found: number; total: number } => {
    let found = 0;
    let total = 0;
    for (let i = 0; i < roles.length; i++) {
        if (roles[i] === team) {
            total++;
            if (revealed[i]) {
                found++;
            }
        }
    }
    return { found, total };
};

/**
 * Compute both teams' progress in a single pass over the board.
 * `found` = revealed cards of that team; `total` = that team's card count.
 */
export const getTeamProgress = (roles: RoleEnum[], revealed: boolean[]): TeamProgress => {
    return {
        blue: countTeam(roles, revealed, TeamEnum.BLUE),
        red: countTeam(roles, revealed, TeamEnum.RED),
    };
};

/**
 * Determine the winning team, if any. A team wins iff ALL of its cards are
 * revealed. Black is ignored here: revealing black is an instant loss handled by
 * the caller. Returns null while no team has revealed all its cards.
 */
export const getWinner = (roles: RoleEnum[], revealed: boolean[]): TeamEnum | null => {
    const { blue, red } = getTeamProgress(roles, revealed);

    if (blue.total > 0 && blue.found === blue.total) {
        return TeamEnum.BLUE;
    }
    if (red.total > 0 && red.found === red.total) {
        return TeamEnum.RED;
    }
    return null;
};
