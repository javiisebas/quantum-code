import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
    resolve: {
        alias: {
            // Mirror the tsconfig path mapping `@/*` -> `./src/*` so tests can
            // import the domain module exactly the way app code does.
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    test: {
        environment: 'node',
        globals: false,
        // Domain tests live colocated with each game (`src/games/*/**.test.ts`) and
        // the platform (`src/platform/**.test.ts`); `tests/` is kept for any
        // cross-cutting suites.
        include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    },
});
