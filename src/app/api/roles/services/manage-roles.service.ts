import { RoleEnum } from '@/enum/role.enum';
import { shuffleRoles } from '@/services/shuffle-roles';
import { HttpRoleService } from './http-role.service';

export class ManageRolesService {
    static async getRoles(code: number): Promise<string[] | null> {
        return HttpRoleService.fetchRoles(code);
    }

    static async getOrCreateRoles(code: number): Promise<RoleEnum[]> {
        const existingRoles = await HttpRoleService.fetchRoles(code);
        if (existingRoles) {
            return existingRoles;
        }

        const newRoles = shuffleRoles();
        await HttpRoleService.saveRoles(code, newRoles);
        return newRoles;
    }

    static async deleteRoles(code: number): Promise<void> {
        await HttpRoleService.deleteRoles(code);
    }
}
