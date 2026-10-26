import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
    hmr: false,
  },
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      '@react-three/fiber',
      '@react-three/drei',
      'three',
      'lucide-react',
      'zustand',
      'zustand/middleware',
      'zustand/middleware/immer',
      'immer',
      'recharts',
      'rbush',
      'zod',
      'zundo'
    ]
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-recharts': ['recharts'],
          'vendor-lucide': ['lucide-react'],
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei']
        }
      }
    }
  },
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/logic/**/*.ts', 'src/services/**/*.ts', 'src/stores/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.d.ts',
        'src/main.tsx'
      ],
      thresholds: {
        statements: 70,
        branches: 55,
        functions: 65,
        lines: 70
      }
    }
  }
});

