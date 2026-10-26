/**
 * KÜLV Pre-Paint Theme & Runtime Bootstrapper
 * Extracted from index.html to eliminate inline scripts and permit strict CSP: script-src 'self'
 */

// 1. Vite HMR error suppressor: Suppress harmless Vite HMR connection notices in preview/iframe
(function initHmrSuppressor() {
  if (typeof window === 'undefined') return;

  window.addEventListener(
    'error',
    (event) => {
      const filename = event?.filename || '';
      const message = typeof event?.message === 'string' ? event.message : '';
      if (
        filename.includes('@vite/client') ||
        message.includes('WebSocket') ||
        message.includes('vite-hmr') ||
        message.includes('ws://') ||
        message.includes('wss://')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
      }
    },
    true
  );

  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = event?.reason ? String(event.reason) : '';
    if (
      reasonStr.includes('WebSocket') ||
      reasonStr.includes('vite') ||
      reasonStr.includes('ws://') ||
      reasonStr.includes('wss://')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  });
})();


// 2. Pre-paint theme & palette bootstrapper: prevent layout shift and flash of unstyled content
(function initBootTheme() {
  if (typeof window === 'undefined') return;

  try {
    const cachedTheme = localStorage.getItem('kulv-theme');
    const prefersDark =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark =
      cachedTheme === 'dark' || (cachedTheme !== 'light' && cachedTheme !== 'dark' && prefersDark);
    document.documentElement.classList.toggle('dark', shouldUseDark);

    const paletteOptions = ['kulv', 'gruvbox', 'catppuccin', 'meadow'];
    const cachedPalette = localStorage.getItem('kulv-palette');
    const palette =
      cachedPalette && paletteOptions.includes(cachedPalette) ? cachedPalette : 'kulv';
    document.documentElement.dataset.palette = palette;

    const paletteThemeColors: Record<string, { light: string; dark: string }> = {
      kulv: { light: '#FAF6ED', dark: '#131914' },
      gruvbox: { light: '#FBF1C7', dark: '#282828' },
      catppuccin: { light: '#EFF1F5', dark: '#1E1E2E' },
      meadow: { light: '#F7F1E8', dark: '#131914' }
    };

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor && paletteThemeColors[palette]) {
      themeColor.setAttribute(
        'content',
        paletteThemeColors[palette][shouldUseDark ? 'dark' : 'light']
      );
    }
  } catch {
    // Storage can be blocked in privacy modes; fallback gracefully to system preference
    document.documentElement.classList.toggle(
      'dark',
      typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
    );
    document.documentElement.dataset.palette = 'kulv';
  }
})();
