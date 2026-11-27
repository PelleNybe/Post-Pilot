import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  noExternal: ['node-fetch'],
  dts: true,
  minify: true,
  clean: true,
  outDir: 'dist',
});