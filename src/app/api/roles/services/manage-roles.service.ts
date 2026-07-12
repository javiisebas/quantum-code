import { generateRoles, RoleEnum } from '@/domain';
import * as httpRoleService from './http-role.service';

/**
 * Get the canonical roles for a game code, creating them if they don't exist yet.
 *
 * Atomic end-to-end: we generate a candidate board and POST it. The server performs
 * an atomic SET NX and returns the authoritative roles — ours if we created the key,
 * or the pre-existing board if another client won the race. Either way, everyone who
 * joins the same code converges on the same board, with no client-side get-then-create
 * race.
 */
export const getOrCreateRoles = async (code: number): Promise<RoleEnum[]> => {
    const candidateRoles = generateRoles();
    return httpRoleService.createRoles(code, candidateRoles);
};

/** Delete the roles for a game code. */
export const deleteRoles = async (code: number): Promise<void> => {
    await httpRoleService.deleteRoles(code);
};
