import { defineConfig } from 'vitest/config';

// Relative base so the build works under any path (Vercel, GitHub Pages, a sub-path of the hub).
export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 1500 },
  // the kit's dist uses extensionless relative imports: let Vite resolve them so a test may import `./lab` (the lab standard does);
  // the simulation tests integrate a minute of life per scenario, so 5 s is too short on a shared CI runner; the sheets are all rendered in one
  // beforeAll, 6 s alone, more than the default 10 s under load
  test: {
    include: ['src/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 60000,
    server: { deps: { inline: ['@onigam/lab-kit'] } },
  },
});
