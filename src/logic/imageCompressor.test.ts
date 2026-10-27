import { describe, it, expect } from 'vitest';
import { compressImageFile, sniffImageType } from './imageCompressor';

describe('ImageCompressor (Journal Photo Optimization & Magic Bytes Security)', () => {
  // Helper to create synthetic binary Blobs with specific header bytes
  function createBinaryBlob(bytes: number[], type = 'image/jpeg'): Blob {
    const array = new Uint8Array(bytes);
    return new Blob([array], { type });
  }

  it('sniffImageType correctly identifies genuine JPEG files by magic bytes', async () => {
    // JPEG: 0xFF, 0xD8, 0xFF, followed by arbitrary header bytes
    const jpegBlob = createBinaryBlob([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const detected = await sniffImageType(jpegBlob);
    expect(detected).toBe('jpeg');
  });

  it('sniffImageType correctly identifies genuine PNG files by magic bytes', async () => {
    // PNG: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D
    const pngBlob = createBinaryBlob(
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d],
      'image/png'
    );
    const detected = await sniffImageType(pngBlob);
    expect(detected).toBe('png');
  });

  it('sniffImageType correctly identifies genuine WebP files by magic bytes', async () => {
    // WebP: RIFF (bytes 0..3) + 4 bytes size + WEBP (bytes 8..11: 0x57, 0x45, 0x42, 0x50)
    const webpBlob = createBinaryBlob(
      [
        0x52,
        0x49,
        0x46,
        0x46, // R I F F
        0x24,
        0x00,
        0x00,
        0x00, // file size
        0x57,
        0x45,
        0x42,
        0x50 // W E B P
      ],
      'image/webp'
    );
    const detected = await sniffImageType(webpBlob);
    expect(detected).toBe('webp');
  });

  it('sniffImageType strictly returns null for SVG files (preventing script injection)', async () => {
    const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
    const detected = await sniffImageType(svgBlob);
    expect(detected).toBeNull();
  });

  it('sniffImageType returns null for random binary files or short buffers', async () => {
    const exeBlob = createBinaryBlob(
      [0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00],
      'application/x-msdownload'
    );
    expect(await sniffImageType(exeBlob)).toBeNull();

    const shortBlob = new Blob(['short'], { type: 'image/jpeg' });
    expect(await sniffImageType(shortBlob)).toBeNull();

    // Invalid or null objects
    expect(await sniffImageType(null as any)).toBeNull();
    expect(await sniffImageType({} as any)).toBeNull();
    expect(await sniffImageType(undefined as any)).toBeNull();
  });

  it('compressImageFile processes valid JPEG mock', async () => {
    const validJpegBlob = createBinaryBlob([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x00, 0x00
    ]);
    const result = await compressImageFile(validJpegBlob, 1280, 1280, 0.75);

    expect(result.dataUrl).toBeDefined();
    expect(result.originalSize).toBeGreaterThan(0);
    expect(result.compressedSize).toBeGreaterThan(0);
    expect(result.compressionRatio).toBeDefined();
  });

  it('compressImageFile rejects spoofed MIME types or SVG files', async () => {
    // Malicious SVG claiming to be image/jpeg
    const spoofedSvg = new Blob(['<svg><script>alert("XSS")</script></svg>'], { type: 'image/jpeg' });
    await expect(compressImageFile(spoofedSvg)).rejects.toThrow(/Lubatud on ainult JPEG, PNG ja WebP pildid/);
  });
});
