// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from './server';

const weatherResponse = {
  main: {
    temp: 12.4,
    humidity: 78
  },
  weather: [
    {
      main: 'Rain',
      description: 'light rain'
    }
  ]
};

describe('KÜLV server', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.NODE_ENV = 'test';
    process.env.OPENWEATHER_API_KEY = 'test-key';
    process.env.CORS_ORIGINS = 'https://app.example.com';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  it('returns health status', async () => {
    const response = await request(createApp()).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.version).toBe('1.0.0');
  });

  it('rejects missing coordinates', async () => {
    const response = await request(createApp()).get('/api/weather');

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/Invalid coordinates/i);
  });

  it('rejects invalid latitude', async () => {
    const response = await request(createApp())
      .get('/api/weather')
      .query({ lat: '91', lon: '24.7' });

    expect(response.status).toBe(400);
  });

  it('rejects invalid longitude', async () => {
    const response = await request(createApp())
      .get('/api/weather')
      .query({ lat: '59.4', lon: '181' });

    expect(response.status).toBe(400);
  });

  it('returns 500 when API key is missing', async () => {
    delete process.env.OPENWEATHER_API_KEY;

    const response = await request(createApp())
      .get('/api/weather')
      .query({ lat: '59.437', lon: '24.754' });

    expect(response.status).toBe(500);
    expect(response.body.error).toMatch(/API key not configured/i);
  });

  it('returns 502 when upstream provider fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('upstream error', { status: 502 }))
    );

    const response = await request(createApp())
      .get('/api/weather')
      .query({ lat: '59.437', lon: '24.754' });

    expect(response.status).toBe(502);
    expect(response.body.error).toMatch(/Weather provider unavailable/i);
  });

  it('returns 504 when upstream request times out', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        return new Promise((_resolve, reject) => {
          const error = new Error('Aborted');
          error.name = 'AbortError';
          reject(error);
        });
      })
    );

    const response = await request(createApp())
      .get('/api/weather')
      .query({ lat: '59.437', lon: '24.754' });

    expect(response.status).toBe(504);
    expect(response.body.error).toMatch(/timed out/i);
  });

  it('caches successful weather responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(weatherResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    vi.stubGlobal('fetch', fetchMock);

    const app = createApp();
    const query = { lat: '59.437', lon: '24.754' };

    const first = await request(app).get('/api/weather').query(query);
    const second = await request(app).get('/api/weather').query(query);

    expect(first.status).toBe(200);
    expect(first.headers['x-cache']).toBe('MISS');
    expect(second.status).toBe(200);
    expect(second.headers['x-cache']).toBe('HIT');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rate limits excessive weather requests', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(weatherResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );

    const app = createApp();
    const query = { lat: '58.378', lon: '26.729' };

    for (let index = 0; index < 30; index += 1) {
      const response = await request(app).get('/api/weather').query(query);
      expect(response.status).toBe(200);
    }

    const limited = await request(app).get('/api/weather').query(query);

    expect(limited.status).toBe(429);
    expect(limited.body.error).toMatch(/Too many weather requests/i);
  });

  it('does not allow unknown CORS origins', async () => {
    const response = await request(createApp())
      .get('/health')
      .set('Origin', 'https://evil.example.com');

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows configured CORS origins', async () => {
    const response = await request(createApp())
      .get('/health')
      .set('Origin', 'https://app.example.com');

    expect(response.headers['access-control-allow-origin']).toBe(
      'https://app.example.com'
    );
  });

  it('forwards an incoming request ID', async () => {
    const response = await request(createApp())
      .get('/health')
      .set('X-Request-Id', 'test-request-id');

    expect(response.headers['x-request-id']).toBe('test-request-id');
  });
});
