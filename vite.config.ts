import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function viteHmrStubPlugin(): Plugin {
  return {
    name: 'vite-hmr-stub',
    apply: 'serve',
    transformIndexHtml: {
      order: 'pre',
      handler() {
        return [
          {
            tag: 'script',
            attrs: { type: 'text/javascript' },
            children: `
              if (typeof window !== 'undefined' && window.WebSocket) {
                const _OrigWS = window.WebSocket;
                window.WebSocket = function (url, protocols) {
                  const isHmr = protocols === 'vite-hmr' || (Array.isArray(protocols) && protocols.includes('vite-hmr')) || String(url).includes('token=') || String(url).includes('vite');
                  if (isHmr) {
                    const l = {};
                    const ws = {
                      readyState: 1,
                      OPEN: 1, CLOSED: 3, CLOSING: 2, CONNECTING: 0,
                      url: String(url),
                      protocol: 'vite-hmr',
                      addEventListener: (e, fn) => {
                        l[e] = l[e] || [];
                        l[e].push(fn);
                        if (e === 'open') setTimeout(() => fn({ type: 'open' }), 0);
                      },
                      removeEventListener: (e, fn) => {
                        if (l[e]) l[e] = l[e].filter((f) => f !== fn);
                      },
                      dispatchEvent: () => true,
                      send: () => {},
                      close: () => { ws.readyState = 3; }
                    };
                    return ws;
                  }
                  return new _OrigWS(url, protocols);
                };
                Object.assign(window.WebSocket, _OrigWS);
              }
            `,
            injectTo: 'head-prepend'
          }
        ];
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), viteHmrStubPlugin()],
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
        manualChunks(id) {
          if (id.includes('node_modules/recharts')) {
            return 'vendor-recharts';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-lucide';
          }
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/scheduler')
          ) {
            return 'vendor-react';
          }
        }
      }
    }
  },
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'server.test.ts'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
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

