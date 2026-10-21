import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  build: { outDir: 'build' },
  server: { proxy: { '/api': { target: 'http://localhost:8000', ws: true } } },
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/setupTests.js'], include: ['src/**/*.test.{js,jsx}'] }
});
