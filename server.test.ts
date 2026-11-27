// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import http from 'node:http';
import {
  createApp,
  createWeatherLimiter,
  setWeatherCache,
  setupGracefulShutdown,
  type CacheEntry
} from './server';

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

  it('verifies /readyz status when configuration is valid', async () => {
    process.env.OPENWEATHER_API_KEY = 'valid-token';

    const response = await request(createApp()).get('/readyz');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ready');
    expect(response.body.checks.server).toBe('ok');
    expect(response.body.checks.weatherConfigured).toBe(true);
    // Crucial: assert no secrets are leaked in response
    expect(JSON.stringify(response.body)).not.toContain('valid-token');
  });

  it('returns 503 on /readyz when required weather configuration is missing', async () => {
    delete process.env.OPENWEATHER_API_KEY;

    const response = await request(createApp()).get('/readyz');

    expect(response.status).toBe(503);
    expect(response.body.status).toBe('not_ready');
    expect(response.body.checks.weatherConfigured).toBe(false);
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

  it('caches successful weather responses within an isolated app instance', async () => {
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

  it('guarantees two createApp() instances do not share weather cache state', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify(weatherResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const cacheA = new Map<string, CacheEntry>();
    const cacheB = new Map<string, CacheEntry>();

    const appA = createApp({ weatherCache: cacheA });
    const appB = createApp({ weatherCache: cacheB });

    const query = { lat: '59.437', lon: '24.754' };

    // Request on App A
    const resA1 = await request(appA).get('/api/weather').query(query);
    expect(resA1.status).toBe(200);
    expect(resA1.headers['x-cache']).toBe('MISS');
    expect(cacheA.size).toBe(1);
    expect(cacheB.size).toBe(0);

    // Request on App B must be a MISS and populate its own cache
    const resB1 = await request(appB).get('/api/weather').query(query);
    expect(resB1.status).toBe(200);
    expect(resB1.headers['x-cache']).toBe('MISS');
    expect(cacheB.size).toBe(1);

    // Second request on App A is a HIT
    const resA2 = await request(appA).get('/api/weather').query(query);
    expect(resA2.headers['x-cache']).toBe('HIT');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('guarantees rate limit counters are isolated per injected limiter on uncached misses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(weatherResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        )
      )
    );

    const limiterA = createWeatherLimiter();
    const limiterB = createWeatherLimiter();

    const appA = createApp({ weatherLimiter: limiterA });
    const appB = createApp({ weatherLimiter: limiterB });

    // Exhaust quota on limiter A (30 distinct uncached coordinate requests)
    for (let index = 0; index < 30; index += 1) {
      const res = await request(appA)
        .get('/api/weather')
        .query({ lat: '58.378', lon: (26.0 + index * 0.01).toFixed(3) });
      expect(res.status).toBe(200);
    }

    // Next uncached request on appA must be blocked
    const blockedA = await request(appA)
      .get('/api/weather')
      .query({ lat: '58.378', lon: '26.999' });
    expect(blockedA.status).toBe(429);
    expect(blockedA.headers['retry-after']).toBeDefined();

    // AppB with isolated limiterB must still accept requests
    const allowedB = await request(appB)
      .get('/api/weather')
      .query({ lat: '58.378', lon: '26.999' });
    expect(allowedB.status).toBe(200);
  });

  it('does not consume rate-limit quota on fresh cache hits', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify(weatherResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const app = createApp();
    const query = { lat: '58.378', lon: '26.729' };

    for (let index = 0; index < 45; index += 1) {
      const res = await request(app).get('/api/weather').query(query);
      expect(res.status).toBe(200);
      expect(res.headers['x-cache']).toBe(index === 0 ? 'MISS' : 'HIT');
    }

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('coalesces concurrent cache-miss requests for identical coordinates into one upstream fetch', async () => {
    let resolveFetch!: (value: Response) => void;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    const fetchMock = vi.fn().mockReturnValue(fetchPromise);
    vi.stubGlobal('fetch', fetchMock);

    const app = createApp();
    const query = { lat: '59.100', lon: '24.500' };

    const pending = Promise.all([
      request(app).get('/api/weather').query(query),
      request(app).get('/api/weather').query(query),
      request(app).get('/api/weather').query(query)
    ]);

    await new Promise((r) => setTimeout(r, 20));
    resolveFetch(
      new Response(JSON.stringify(weatherResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    const responses = await pending;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    for (const res of responses) {
      expect(res.status).toBe(200);
    }
  });

  it('honors upstream 429 Retry-After cooldown and serves stale cache when available', async () => {
    let currentNow = 1_000_000;
    const cache = new Map<string, CacheEntry>();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(weatherResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      )
      .mockResolvedValueOnce(
        new Response('Rate limited', {
          status: 429,
          headers: { 'Retry-After': '30' }
        })
      );

    vi.stubGlobal('fetch', fetchMock);
    const app = createApp({ weatherCache: cache, now: () => currentNow });
    const query = { lat: '59.222', lon: '24.333' };

    const initial = await request(app).get('/api/weather').query(query);
    expect(initial.status).toBe(200);
    expect(initial.headers['x-cache']).toBe('MISS');

    // Expire fresh TTL (5m) while remaining inside stale fallback TTL (60m)
    currentNow += 6 * 60 * 1000;

    const duringUpstream429 = await request(app).get('/api/weather').query(query);
    expect(duringUpstream429.status).toBe(200);
    expect(duringUpstream429.headers['x-cache']).toBe('STALE');
    expect(duringUpstream429.headers['retry-after']).toBe('30');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Subsequent uncached lookup during active upstream cooldown returns 429 without calling upstream
    const uncachedDuringCooldown = await request(app)
      .get('/api/weather')
      .query({ lat: '59.555', lon: '24.666' });
    expect(uncachedDuringCooldown.status).toBe(429);
    expect(uncachedDuringCooldown.headers['retry-after']).toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('evicts expired entries and oldest entries when MAX_WEATHER_CACHE_SIZE is reached', () => {
    const testCache = new Map<string, CacheEntry>();
    const baseTime = 1000000;

    // Insert 2 entries, one expiring early
    setWeatherCache(testCache, 'key1', { val: 1 }, 3, 500, baseTime); // expires 1000500
    setWeatherCache(testCache, 'key2', { val: 2 }, 3, 2000, baseTime); // expires 1002000
    setWeatherCache(testCache, 'key3', { val: 3 }, 3, 2000, baseTime); // expires 1002000

    expect(testCache.size).toBe(3);

    // Insert 4th entry at baseTime + 600 (key1 is now expired)
    setWeatherCache(testCache, 'key4', { val: 4 }, 3, 2000, baseTime + 600);

    // key1 should be evicted because it expired
    expect(testCache.has('key1')).toBe(false);
    expect(testCache.has('key4')).toBe(true);
    expect(testCache.size).toBe(3);

    // Now insert a 5th entry at baseTime + 700 with all remaining active (key2 oldest)
    setWeatherCache(testCache, 'key5', { val: 5 }, 3, 2000, baseTime + 700);

    // None expired, so FIFO eviction removes oldest remaining (key2)
    expect(testCache.has('key2')).toBe(false);
    expect(testCache.has('key3')).toBe(true);
    expect(testCache.has('key4')).toBe(true);
    expect(testCache.has('key5')).toBe(true);
    expect(testCache.size).toBe(3);
  });

  it('rate limits excessive uncached weather requests on default limiter', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(weatherResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        )
      )
    );

    const app = createApp();

    for (let index = 0; index < 30; index += 1) {
      const response = await request(app)
        .get('/api/weather')
        .query({ lat: '58.378', lon: (26.0 + index * 0.01).toFixed(3) });
      expect(response.status).toBe(200);
    }

    const limited = await request(app)
      .get('/api/weather')
      .query({ lat: '58.378', lon: '26.999' });

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

  it('sets strict baseline security headers in production', async () => {
    process.env.NODE_ENV = 'production';

    const response = await request(createApp()).get('/health');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(response.headers['strict-transport-security']).toBe('max-age=63072000; includeSubDomains');

    const csp = response.headers['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    // Strict requirement: script-src must NOT contain unsafe-inline
    const scriptSrcDirective = csp.split(';').find((d: string) => d.trim().startsWith('script-src'));
    expect(scriptSrcDirective).not.toContain("'unsafe-inline'");
  });

  it('disables Helmet CSP in development mode', async () => {
    process.env.NODE_ENV = 'development';

    const response = await request(createApp()).get('/health');

    expect(response.headers['content-security-policy']).toBeUndefined();
  });

  it('handles graceful shutdown cleanly without hanging', async () => {
    const app = createApp();
    const server = http.createServer(app);

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });

    expect(server.listening).toBe(true);

    const shutdown = setupGracefulShutdown(server, 2000);
    await shutdown('TEST_SIGNAL');

    expect(server.listening).toBe(false);
  });

  it('handles X-Forwarded-For and Forwarded headers without express-rate-limit validation errors', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

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
    const response = await request(app)
      .get('/api/weather')
      .query({ lat: '59.437', lon: '24.754' })
      .set('X-Forwarded-For', '203.0.113.10')
      .set('Forwarded', 'for="203.0.113.10";proto=https');

    expect(response.status).toBe(200);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('isolates rate-limit buckets per trusted Forwarded client IP and ignores spoofed leftmost hops', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(weatherResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        )
      )
    );

    const app = createApp();

    for (let index = 0; index < 30; index += 1) {
      const spoofedLeftHop = `198.51.100.${(index % 20) + 1}`;
      const response = await request(app)
        .get('/api/weather')
        .query({ lat: '59.437', lon: (24.0 + index * 0.01).toFixed(3) })
        .set('Forwarded', `for=${spoofedLeftHop}, for="[2001:db8:1::1]:443";proto=https`);

      expect(response.status).toBe(200);
    }

    const limited = await request(app)
      .get('/api/weather')
      .query({ lat: '59.437', lon: '24.999' })
      .set('Forwarded', 'for=198.51.100.99, for="[2001:db8:1::2]:8443";proto=https');

    expect(limited.status).toBe(429);

    const otherClient = await request(app)
      .get('/api/weather')
      .query({ lat: '59.437', lon: '24.999' })
      .set('Forwarded', 'for=203.0.113.55;proto=https');

    expect(otherClient.status).toBe(200);
  });
});
