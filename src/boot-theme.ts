/**
 * KÜLV Pre-Paint Theme & Runtime Bootstrapper
 * Extracted from index.html to eliminate inline scripts and permit strict CSP: script-src 'self'
 */

// 1. Vite HMR error suppressor: Suppress harmless Vite HMR connection notices in preview/iframe
(function initHmrSuppressor() {
  if (typeof window === 'undefined') return;

  // Filter known benign Vite dev-server WebSocket messages in iframe environment
  const isViteWsNotice = (str: string) =>
    str.includes('failed to connect to websocket') ||
    str.includes('WebSocket closed without opened') ||
    str.includes('vite-hmr') ||
    str.includes('createWebSocketModuleRunnerTransport') ||
    str.includes('ws://') ||
    str.includes('wss://');

  const originalConsoleError = console.error;
  console.error = function (...args: any[]) {
    const text = args.map((a) => (typeof a === 'string' ? a : (a?.message || ''))).join(' ');
    if (isViteWsNotice(text)) {
      return;
    }
    originalConsoleError.apply(console, args);
  };

  const originalConsoleWarn = console.warn;
  console.warn = function (...args: any[]) {
    const text = args.map((a) => (typeof a === 'string' ? a : (a?.message || ''))).join(' ');
    if (isViteWsNotice(text)) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  };

  window.addEventListener(
    'error',
    (event) => {
      const filename = event?.filename || '';
      const message = typeof event?.message === 'string' ? event.message : '';
      if (
        filename.includes('@vite/client') ||
        isViteWsNotice(message) ||
        isViteWsNotice(filename)
      ) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
      }
    },
    true
  );

  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = event?.reason ? String(event.reason?.message || event.reason) : '';
    if (isViteWsNotice(reasonStr)) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  });

  // Ensure stale service workers from any past session do not intercept Vite dev modules
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister();
      }
    }).catch(() => {});
  }
})();


// 2. Pre-paint theme & palette bootstrapper: prevent layout shift and flash of unstyled content
(function initBootTheme() {
  if (typeof window === 'undefined') return;

  try {
    const cachedTheme = localStorage.getItem('kulv-theme');
    // Stock theme default is the warm cream botanical theme (light mode).
    // Dark mode is only activated if the user explicitly chose 'dark' previously.
    const shouldUseDark = cachedTheme === 'dark';
    document.documentElement.classList.toggle('dark', shouldUseDark);

    const paletteOptions = ['meadow', 'kulv', 'gruvbox', 'catppuccin'];
    const cachedPalette = localStorage.getItem('kulv-palette');
    const palette =
      cachedPalette && paletteOptions.includes(cachedPalette) ? cachedPalette : 'meadow';
    document.documentElement.dataset.palette = palette;

    const paletteThemeColors: Record<string, { light: string; dark: string }> = {
      meadow: { light: '#F7F1E8', dark: '#131914' },
      kulv: { light: '#F7F1E8', dark: '#131914' },
      gruvbox: { light: '#FBF1C7', dark: '#282828' },
      catppuccin: { light: '#EFF1F5', dark: '#1E1E2E' }
    };

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor && paletteThemeColors[palette]) {
      themeColor.setAttribute(
        'content',
        paletteThemeColors[palette][shouldUseDark ? 'dark' : 'light']
      );
    }
  } catch {
    // Storage can be blocked in privacy modes; fallback to stock cream botanical theme
    document.documentElement.classList.remove('dark');
    document.documentElement.dataset.palette = 'meadow';
  }
})();
