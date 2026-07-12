import { NoTeamEnum } from '@/games/codenames/enums/no-team.enum';
import { RoleEnum } from '@/games/codenames/enums/role.enum';
import { TeamEnum } from '@/games/codenames/enums/team.enum';

/**
 * Game rules constants. Single source of truth for board dimensions and the role
 * distribution. Everything that used to live as loose numbers in src/consts.ts is
 * derived from here.
 */

/** Total number of cards on a board (5x5 grid). */
export const BOARD_SIZE = 25;

/**
 * How many cards of each role a board contains. The values MUST sum to BOARD_SIZE.
 * Keys match the enum string values ('neutral' | 'blue' | 'red' | 'black').
 */
export const ROLE_COUNTS = {
    neutral: 11,
    blue: 6,
    red: 7,
    black: 1,
} as const;

/**
 * The team that plays first. As in Codenames, the team holding the extra card
 * starts — here that is red (7 cards vs. blue's 6).
 */
export const STARTING_TEAM: TeamEnum = TeamEnum.RED;

/** The opposing team. */
export const otherTeam = (team: TeamEnum): TeamEnum =>
    team === TeamEnum.RED ? TeamEnum.BLUE : TeamEnum.RED;

// Re-export the role types/enums so consumers can depend on the domain as a single
// entry point. The enum source files remain the canonical declarations.
export { NoTeamEnum, TeamEnum };
export type { RoleEnum };
