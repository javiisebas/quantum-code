import { RoleEnum } from '@/domain';

/**
 * Thin HTTP client for the /api/roles endpoint. Used by the browser to read/create/
 * delete a board's roles. The create path goes through POST, which performs an atomic
 * SET NX server-side, so there is no client-side get-then-create race.
 */

/** GET the roles for a code, or null when none exist yet. */
export const fetchRoles = async (code: number): Promise<RoleEnum[] | null> => {
    const response = await fetch(`/api/roles?code=${code}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch roles: ${response.statusText}`);
    }
    // The endpoint returns the roles array, or `null` when the code is unknown.
    return (await response.json()) as RoleEnum[] | null;
};

/**
 * POST candidate roles for a code. The server creates them atomically if absent and
 * responds with the AUTHORITATIVE roles (the pre-existing board if another client
 * already created it). Returns whatever the server considers canonical.
 */
export const createRoles = async (code: number, roles: RoleEnum[]): Promise<RoleEnum[]> => {
    const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, roles }),
    });

    if (!response.ok) {
        throw new Error(`Failed to save roles: ${response.statusText}`);
    }

    return (await response.json()) as RoleEnum[];
};

/** DELETE the roles for a code. Treats a 404 (already gone) as success. */
export const deleteRoles = async (code: number): Promise<void> => {
    const response = await fetch(`/api/roles?code=${code}`, { method: 'DELETE' });

    if (response.status === 404) {
        return;
    }

    if (!response.ok) {
        throw new Error(`Failed to delete roles: ${response.statusText}`);
    }
};
