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
        include: ['tests/**/*.test.ts'],
    },
});
