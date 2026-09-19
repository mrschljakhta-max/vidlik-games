import { defineConfig } from 'vite';

export default defineConfig({
  base: '/vidlik-games/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
