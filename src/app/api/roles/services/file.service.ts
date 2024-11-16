import { RoleEnum } from '@/enum/role.enum';
import { promises as fs } from 'fs';
import { join } from 'path';

export class FileService {
    static async writeRoles(code: number, roles: RoleEnum[]): Promise<void> {
        const path = FileService.getPath(code);
        const jsonData = JSON.stringify(roles, null, 2);
        try {
            await fs.writeFile(path, jsonData);
        } catch (err: unknown) {
            if (err instanceof Error) {
                throw new Error(`Error writing to file: ${path}. Details: ${err.message}`);
            }
            throw new Error(`Unknown error writing to file: ${path}`);
        }
    }

    static async readRoles(code: number): Promise<RoleEnum[] | null> {
        const path = FileService.getPath(code);
        try {
            const fileContent = await fs.readFile(path, 'utf-8');
            return JSON.parse(fileContent);
        } catch (err: unknown) {
            if (
                err instanceof Error &&
                err.name === 'Error' &&
                (err as NodeJS.ErrnoException).code === 'ENOENT'
            ) {
                return null;
            } else if (err instanceof SyntaxError) {
                throw new Error(`Invalid JSON format in file: ${path}. Details: ${err.message}`);
            }
            if (err instanceof Error) {
                throw new Error(`Error reading from file: ${path}. Details: ${err.message}`);
            }
            throw new Error(`Unknown error reading from file: ${path}`);
        }
    }

    static async readOrWriteRoles(code: number, roles: RoleEnum[]): Promise<RoleEnum[]> {
        const existingRoles = await FileService.readRoles(code);
        if (existingRoles === null) {
            await FileService.writeRoles(code, roles);
            return roles;
        }
        return existingRoles;
    }

    static async deleteRoles(code: number): Promise<boolean> {
        const path = FileService.getPath(code);
        try {
            await fs.unlink(path);
            return true;
        } catch (err) {
            if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
                return false;
            }
            throw err;
        }
    }

    static getPath(code: number): string {
        console.log(__dirname);

        return join(`src/app/api/roles/database/${code}.json`);
    }
}
