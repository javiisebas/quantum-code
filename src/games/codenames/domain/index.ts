/**
 * Public entry point for the Codenames domain. This barrel is the contract other
 * layers (context, components, API validators) depend on — import from
 * '@/games/codenames/domain', not from the individual files.
 *
 * Note: game join codes are game-agnostic and live in the platform
 * (`@/platform/room` — `generateCode`, `parseCode`), not here.
 */

// Rules constants + role types/enums (enum source files live in ./enums).
export { BOARD_SIZE, ROLE_COUNTS, STARTING_TEAM, otherTeam, NoTeamEnum, TeamEnum } from './rules';
export type { RoleEnum } from './rules';

// Board generation.
export { generateRoles, generateWords, createRevealedState, generateBoard } from './board';
export type { Board } from './board';

// Win / progress logic.
export { getTeamProgress, getWinner } from './win';
export type { TeamProgress } from './win';

// Raw word pool (exposed for any consumer that needs the full list).
export { words_ddbb } from './words';
