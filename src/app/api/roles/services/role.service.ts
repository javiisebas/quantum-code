import { RoleEnum } from '@/enum/role.enum';
import { Redis } from '@upstash/redis';

export class RoleService {
    private static readonly TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds
    private static client: Redis | null = null;

    // (url, token) env-var name pairs, in priority order. Covers the Upstash SDK
    // native names (local `.env.local`) and the active Upstash Vercel integration
    // (`UPSTASH_REDIS_` prefix). The legacy `KV_REST_API_*` vars point at an archived
    // (dead) database, so they are intentionally NOT used as a fallback.
    private static readonly CREDENTIAL_ENV_PAIRS: readonly [string, string][] = [
        ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
        ['UPSTASH_REDIS_KV_REST_API_URL', 'UPSTASH_REDIS_KV_REST_API_TOKEN'],
    ];

    /**
     * Lazily create and cache the Redis client. Building it at module load would
     * throw when env vars are absent (e.g. during `next build`, which imports this
     * module); creating it on first use keeps the import side-effect free.
     */
    private static getClient(): Redis {
        if (!this.client) {
            const pair = this.CREDENTIAL_ENV_PAIRS.find(
                ([urlKey, tokenKey]) => process.env[urlKey] && process.env[tokenKey],
            );

            if (!pair) {
                throw new Error(
                    'Missing Redis credentials: set UPSTASH_REDIS_REST_URL/TOKEN or ' +
                        'UPSTASH_REDIS_KV_REST_API_URL/TOKEN',
                );
            }

            const url = process.env[pair[0]]!;
            // Diagnostic (no secrets): which var + host the client connects to.
            console.log(`[RoleService] Redis via ${pair[0]} → ${new URL(url).host}`);

            this.client = new Redis({ url, token: process.env[pair[1]]! });
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
