import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/index.js';
import type { FastifyInstance } from 'fastify';

describe('GET /health', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns status 200 with ok, timestamp, and version', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.ok).toBe(true);
    expect(typeof body.timestamp).toBe('string');
    expect(body.version).toBe('1.0.0');
  });

  it('responds in under 100ms', async () => {
    const startTime = performance.now();
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });
    const duration = performance.now() - startTime;

    expect(response.statusCode).toBe(200);
    expect(duration).toBeLessThan(100);
  });
});
