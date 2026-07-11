import { RoleEnum } from '@/enum/role.enum';
import { Redis } from '@upstash/redis';

export class RoleService {
    private static readonly TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds
    private static client: Redis | null = null;

    /**
     * Lazily create and cache the Redis client. Building it at module load would
     * throw when env vars are absent (e.g. during `next build`, which imports this
     * module); creating it on first use keeps the import side-effect free.
     *
     * Reads either the Upstash-native variables (`UPSTASH_REDIS_REST_*`, used in
     * local `.env.local`) or the Vercel KV integration variables (`KV_REST_API_*`,
     * injected in the Vercel deployment) — both are the same Upstash REST endpoint.
     */
    private static getClient(): Redis {
        if (!this.client) {
            const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
            const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

            if (!url || !token) {
                throw new Error(
                    'Missing Redis credentials: set UPSTASH_REDIS_REST_URL/TOKEN or KV_REST_API_URL/TOKEN',
                );
            }

            this.client = new Redis({ url, token });
        }
        return this.client;
    }

    private static getKey(code: number): string {
        return `roles:${code}`;
    }

    static async readRoles(code: number): Promise<RoleEnum[] | null> {
        try {
            const key = this.getKey(code);
            // Upstash auto-deserializes JSON, so this is typically already an array.
            // Keep the string fallback for robustness against raw string payloads.
            const data = await this.getClient().get<RoleEnum[] | string>(key);

            if (!data) {
                return null;
            }

            if (typeof data === 'string') {
                return JSON.parse(data) as RoleEnum[];
            }

            return data;
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new Error(`Error reading roles from Redis: ${error.message}`);
            }
            throw new Error('Unknown error reading roles from Redis');
        }
    }

    static async writeRoles(code: number, roles: RoleEnum[]): Promise<void> {
        try {
            const key = this.getKey(code);

            // Always set a 7-day TTL using EX (seconds).
            await this.getClient().set(key, JSON.stringify(roles), { ex: this.TTL_SECONDS });
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new Error(`Error writing roles to Redis: ${error.message}`);
            }
            throw new Error('Unknown error writing roles to Redis');
        }
    }

    static async deleteRoles(code: number): Promise<boolean> {
        try {
            const key = this.getKey(code);
            const result = await this.getClient().del(key);

            // redis.del returns the number of keys removed.
            return result > 0;
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new Error(`Error deleting roles from Redis: ${error.message}`);
            }
            throw new Error('Unknown error deleting roles from Redis');
        }
    }
}
