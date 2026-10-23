/**
 * Utility to verify WebGL2 hardware acceleration support.
 * Used as a feature-gate before attempting to mount React Three Fiber.
 */
export function isWebGL2Available(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGL2RenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('experimental-webgl2'))
    );
  } catch {
    return false;
  }
}
