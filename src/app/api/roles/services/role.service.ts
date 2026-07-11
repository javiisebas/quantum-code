import { RoleEnum } from '@/enum/role.enum';
import { Redis } from '@upstash/redis';

export class RoleService {
    private static readonly TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds
    private static client: Redis | null = null;

    // (url, token) env-var name pairs, in priority order. Covers the Upstash SDK
    // native names (local `.env.local`), the Vercel KV integration, and the Upstash
    // Vercel marketplace integration (`UPSTASH_REDIS_` prefix) — all the same endpoint.
    private static readonly CREDENTIAL_ENV_PAIRS: readonly [string, string][] = [
        ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
        ['KV_REST_API_URL', 'KV_REST_API_TOKEN'],
        ['UPSTASH_REDIS_REST_API_URL', 'UPSTASH_REDIS_REST_API_TOKEN'],
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
                    'Missing Redis credentials: set one of UPSTASH_REDIS_REST_URL/TOKEN, ' +
                        'KV_REST_API_URL/TOKEN, or UPSTASH_REDIS_REST_API_URL/TOKEN',
                );
            }

            this.client = new Redis({
                url: process.env[pair[0]]!,
                token: process.env[pair[1]]!,
            });
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
