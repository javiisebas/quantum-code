import { RoleEnum } from '@/enum/role.enum';

export class HttpRoleService {
    static async fetchRoles(code: number): Promise<RoleEnum[] | null> {
        const response = await fetch(`/api/roles?code=${code}`);
        if (response.ok) {
            return response.json();
        }
        if (response.status === 404) {
            return null;
        }
        throw new Error(`Failed to fetch roles: ${response.statusText}`);
    }

    static async saveRoles(code: number, roles: RoleEnum[]): Promise<void> {
        const response = await fetch('/api/roles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, roles }),
        });

        if (!response.ok) {
            throw new Error(`Failed to save roles: ${response.statusText}`);
        }
    }

    static async deleteRoles(code: number): Promise<void> {
        const response = await fetch(`/api/roles?code=${code}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`Roles not found for code: ${code}`);
            }
            throw new Error(`Failed to delete roles: ${response.statusText}`);
        }
    }
}
