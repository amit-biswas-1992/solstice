import { defineConfig } from 'vitest/config';
import { configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist'
  },
  test: {
    exclude: [...configDefaults.exclude, 'playwright/**']
  }
});
