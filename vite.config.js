import {defineConfig} from 'vite';
import {svelte} from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  resolve: {conditions: ['browser']},
  build: {lib: {entry: 'src/index.js', formats: ['es'], fileName: 'vauth-ui'}, rollupOptions: {external: id => id === 'svelte' || id.startsWith('svelte/')}},
  test: {environment: 'jsdom', include: ['test/**/*.test.js']},
});
