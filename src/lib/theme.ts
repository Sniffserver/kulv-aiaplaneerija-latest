import type { ColorPalette } from '../types';

export function applyPaletteToDOM(palette: ColorPalette) {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.palette = palette;
    try {
      localStorage.setItem('kulv-palette', palette);
      const isDark = document.documentElement.classList.contains('dark');
      const paletteThemeColors: Record<ColorPalette, { light: string; dark: string }> = {
        meadow: { light: '#F7F1E8', dark: '#131914' },
        kulv: { light: '#F7F1E8', dark: '#131914' },
        gruvbox: { light: '#FBF1C7', dark: '#282828' },
        catppuccin: { light: '#EFF1F5', dark: '#1E1E2E' }
      };
      const themeColor = document.querySelector('meta[name="theme-color"]');
      if (themeColor && paletteThemeColors[palette]) {
        themeColor.setAttribute('content', paletteThemeColors[palette][isDark ? 'dark' : 'light']);
      }
    } catch {
      // Storage unavailable in restricted sandbox
    }
  }
}
