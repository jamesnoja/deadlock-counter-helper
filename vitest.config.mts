import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Resolves the `@/*` alias from tsconfig.json. Native since Vite 7 — the
  // vite-tsconfig-paths plugin the Next.js guide recommends is no longer needed.
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      // Only code we author. Config and generated output are not units under test.
      include: ['src/**', 'scripts/**'],
      // No global threshold yet. The repo is currently scaffold, a placeholder page, and
      // two `gh`/fs CLI wrappers — a global 80% here would measure nothing and be met by
      // writing tests nobody needs. Turn this on at E05, when deriveCounters lands: that
      // is pure, deterministic logic where the number is a real signal.
    },
  },
})
