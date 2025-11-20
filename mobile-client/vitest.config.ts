import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: [],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'expo-constants': path.resolve(__dirname, 'test/mocks/expo-constants.ts'),
    },
  },
  define: {
    __DEV__: true,
  },
});
