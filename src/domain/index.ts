/**
 * Public entry point for the game domain. This barrel is the frozen contract other
 * layers (contexts, components, API routes, services) depend on — import from
 * '@/domain', not from the individual files.
 */

// Rules constants + role types/enums (enum source files remain in src/enum).
export { BOARD_SIZE, ROLE_COUNTS, STARTING_TEAM, otherTeam, NoTeamEnum, TeamEnum } from './rules';
export type { RoleEnum } from './rules';

// Board generation.
export { generateRoles, generateWords, createRevealedState } from './board';

// Game codes.
export { generateCode, parseCode } from './code';

// Win / progress logic.
export { getTeamProgress, getWinner } from './win';
export type { TeamProgress } from './win';

// Raw word pool (exposed for any consumer that needs the full list).
export { words_ddbb } from './words';
