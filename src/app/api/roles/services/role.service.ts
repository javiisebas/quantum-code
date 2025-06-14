import { RoleEnum } from '@/enum/role.enum';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export class RoleService {
    private static readonly TTL_SECONDS = 7 * 24 * 60 * 60; // 7 días en segundos

    private static getKey(code: number): string {
        return `roles:${code}`;
    }

    static async readRoles(code: number): Promise<RoleEnum[] | null> {
        try {
            const key = this.getKey(code);
            const data = await redis.get<string>(key);

            if (!data) {
                return null;
            }

            // Si el dato viene como string, parsearlo; si ya es un array, devolverlo directamente
            if (typeof data === 'string') {
                return JSON.parse(data) as RoleEnum[];
            }

            return data as RoleEnum[];
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new Error(`Error reading roles from Redis: ${error.message}`);
            }
            throw new Error(`Unknown error reading roles from Redis`);
        }
    }

    static async writeRoles(code: number, roles: RoleEnum[]): Promise<void> {
        try {
            const key = this.getKey(code);
            const data = JSON.stringify(roles);

            // Siempre establece TTL de 7 días usando EX (seconds)
            await redis.set(key, data, { ex: this.TTL_SECONDS });
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new Error(`Error writing roles to Redis: ${error.message}`);
            }
            throw new Error(`Unknown error writing roles to Redis`);
        }
    }

    static async deleteRoles(code: number): Promise<boolean> {
        try {
            const key = this.getKey(code);
            const result = await redis.del(key);

            // redis.del devuelve el número de claves eliminadas
            return result > 0;
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new Error(`Error deleting roles from Redis: ${error.message}`);
            }
            throw new Error(`Unknown error deleting roles from Redis`);
        }
    }
}
