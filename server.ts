import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import http from 'node:http';
import express, { type Express, type Request, type Response, type NextFunction, type RequestHandler } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

export const WEATHER_CACHE_TTL_MS = 5 * 60 * 1000;
export const WEATHER_REQUEST_TIMEOUT_MS = 8_000;
export const MAX_WEATHER_CACHE_SIZE = 500;

export const weatherQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180)
});

export type CacheEntry = {
  expiresAt: number;
  data: unknown;
};

export function setWeatherCache(
  cache: Map<string, CacheEntry>,
  key: string,
  data: unknown,
  maxSize: number = MAX_WEATHER_CACHE_SIZE,
  ttlMs: number = WEATHER_CACHE_TTL_MS,
  nowMs: number = Date.now()
): void {
  if (cache.size >= maxSize) {
    for (const [k, entry] of cache.entries()) {
      if (entry.expiresAt <= nowMs) {
        cache.delete(k);
      }
    }

    if (cache.size >= maxSize) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }
  }

  cache.set(key, {
    expiresAt: nowMs + ttlMs,
    data
  });
}

const developmentOrigins = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://0.0.0.0:3000',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
]);

export function getAllowedOrigins(): Set<string> {
  const configuredOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const origins = new Set(configuredOrigins);

  if (process.env.NODE_ENV !== 'production') {
    for (const origin of developmentOrigins) {
      origins.add(origin);
    }
  }

  return origins;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function getHost(): string {
  if (process.env.HOST) {
    return process.env.HOST;
  }

  return '0.0.0.0';
}

export function createWeatherLimiter(): RequestHandler {
  return rateLimit({
    windowMs: 60_000,
    limit: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      console.warn(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'warn',
          type: 'rate_limit_exceeded',
          requestId: req.header('x-request-id') ?? 'unknown',
          endpoint: '/api/weather'
        })
      );
      res.status(429).json({
        error: 'Too many weather requests, please try again later.'
      });
    }
  });
}

function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = req.header('x-request-id') ?? crypto.randomUUID();

  res.setHeader('x-request-id', requestId);

  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 500 ? 'error' : 'info',
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(2))
    };

    console.log(JSON.stringify(logEntry));
  });

  next();
}

export interface AppDependencies {
  weatherCache?: Map<string, CacheEntry>;
  weatherLimiter?: RequestHandler;
  now?: () => number;
}

export function createApp(deps: AppDependencies = {}): Express {
  const app = express();
  const allowedOrigins = getAllowedOrigins();
  const weatherCache = deps.weatherCache ?? new Map<string, CacheEntry>();
  const weatherLimiter = deps.weatherLimiter ?? createWeatherLimiter();
  const getNow = deps.now ?? (() => Date.now());

  if (isProduction()) {
    app.set('trust proxy', 1);
  }
  app.disable('x-powered-by');

  const production = isProduction();

  app.use(
    helmet({
      contentSecurityPolicy: production
        ? {
            useDefaults: true,
            directives: {
              defaultSrc: ["'self'"],
              // Strict script-src: all inline scripts extracted to boot-theme.ts; no 'unsafe-inline'
              scriptSrc: ["'self'"],
              // Follow-up ticket KULV-CSP-2026: Refactor dynamic canvas inline styles to CSS modules/classes to eliminate 'unsafe-inline'
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
              fontSrc: ["'self'", 'data:'],
              connectSrc: ["'self'", 'https:', 'data:', 'blob:'],
              objectSrc: ["'none'"],
              frameAncestors: ["'self'", 'https:'],
              baseUri: ["'self'"],
              formAction: ["'self'"],
              upgradeInsecureRequests: []
            }
          }
        : false,
      frameguard: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
      strictTransportSecurity: production
        ? { maxAge: 63_072_000, includeSubDomains: true }
        : false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      permittedCrossDomainPolicies: { permittedPolicies: 'none' }
    })
  );

  app.use(requestLogger);

  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;

    if (origin && allowedOrigins.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Request-Id');
    }

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    next();
  });

  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV ?? 'development'
    });
  });

  app.get('/readyz', (_req: Request, res: Response) => {
    const weatherConfigured = Boolean(process.env.OPENWEATHER_API_KEY);
    const ready = weatherConfigured;

    return res.status(ready ? 200 : 503).json({
      status: ready ? 'ready' : 'not_ready',
      checks: {
        server: 'ok',
        weatherConfigured
      },
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/weather', weatherLimiter, async (req: Request, res: Response) => {
    const parsedQuery = weatherQuerySchema.safeParse(req.query);
    const requestId = req.header('x-request-id') ?? 'unknown';

    if (!parsedQuery.success) {
      return res.status(400).json({
        error: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.'
      });
    }

    const { lat, lon } = parsedQuery.data;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      console.warn(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'warn',
          type: 'weather_config_missing',
          requestId
        })
      );
      return res.status(500).json({
        error: 'Weather API key not configured'
      });
    }

    const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
    const nowMs = getNow();
    const cached = weatherCache.get(cacheKey);

    if (cached && cached.expiresAt > nowMs) {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          type: 'weather_cache_hit',
          requestId
        })
      );
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached.data);
    }

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        type: 'weather_cache_miss',
        requestId
      })
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      WEATHER_REQUEST_TIMEOUT_MS
    );

    const upstreamStart = process.hrtime.bigint();

    try {
      const upstreamUrl = new URL('https://api.openweathermap.org/data/2.5/weather');
      upstreamUrl.searchParams.set('lat', lat.toString());
      upstreamUrl.searchParams.set('lon', lon.toString());
      upstreamUrl.searchParams.set('appid', apiKey);
      upstreamUrl.searchParams.set('units', 'metric');

      const response = await fetch(upstreamUrl, {
        signal: controller.signal
      });

      const upstreamDurationMs = Number(process.hrtime.bigint() - upstreamStart) / 1_000_000;

      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          type: 'upstream_weather_response',
          requestId,
          status: response.status,
          latencyMs: Number(upstreamDurationMs.toFixed(2))
        })
      );

      if (!response.ok) {
        console.error(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'error',
            type: 'upstream_weather_failure',
            requestId,
            status: response.status
          })
        );
        return res.status(502).json({
          error: 'Weather provider unavailable or returned an error'
        });
      }

      const data: unknown = await response.json();

      setWeatherCache(weatherCache, cacheKey, data, MAX_WEATHER_CACHE_SIZE, WEATHER_CACHE_TTL_MS, getNow());

      res.setHeader('X-Cache', 'MISS');
      return res.json(data);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'error',
            type: 'upstream_weather_timeout',
            requestId
          })
        );
        return res.status(504).json({
          error: 'Weather request timed out'
        });
      }

      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'error',
          type: 'weather_fetch_exception',
          requestId
        })
      );
      return res.status(500).json({
        error: 'Failed to fetch weather data'
      });
    } finally {
      clearTimeout(timeoutId);
    }
  });

  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not found'
    });
  });

  return app;
}

export async function registerStaticServing(app: Express): Promise<void> {
  const distPath = path.resolve(process.cwd(), 'dist');
  const isDev = !isProduction();

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa'
    });

    app.use(vite.middlewares);
    return;
  }

  app.use(express.static(distPath));

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    if (req.path.startsWith('/api') || req.path === '/health' || req.path === '/readyz') {
      return next();
    }

    // Do NOT return index.html for missing /assets/* files (prevents syntax errors on stale chunk requests)
    if (req.path.startsWith('/assets/')) {
      return res.status(404).send('Asset not found');
    }

    res.sendFile(path.join(distPath, 'index.html'));
  });

  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not found'
    });
  });
}

export function setupGracefulShutdown(
  server: http.Server,
  forceTimeoutMs: number = 10_000
): (signal?: string) => Promise<void> {
  let isShuttingDown = false;

  const shutdown = (signal: string = 'SIGTERM'): Promise<void> => {
    if (isShuttingDown) {
      return Promise.resolve();
    }
    isShuttingDown = true;

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Graceful shutdown initiated',
        signal
      })
    );

    const forceTimer = setTimeout(() => {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'error',
          message: 'Graceful shutdown timed out, forcing exit'
        })
      );
      if (process.env.NODE_ENV !== 'test') {
        process.exit(1);
      }
    }, forceTimeoutMs);
    forceTimer.unref();

    return new Promise<void>((resolve, reject) => {
      server.close((err) => {
        clearTimeout(forceTimer);
        if (err) {
          console.error(
            JSON.stringify({
              timestamp: new Date().toISOString(),
              level: 'error',
              message: 'Error closing HTTP server',
              error: err.message
            })
          );
          return reject(err);
        }

        console.log(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'info',
            message: 'Server closed gracefully'
          })
        );
        resolve();
      });
    });
  };

  const onSigterm = () => {
    shutdown('SIGTERM').then(() => {
      if (process.env.NODE_ENV !== 'test') process.exit(0);
    });
  };

  const onSigint = () => {
    shutdown('SIGINT').then(() => {
      if (process.env.NODE_ENV !== 'test') process.exit(0);
    });
  };

  process.once('SIGTERM', onSigterm);
  process.once('SIGINT', onSigint);

  return shutdown;
}

export async function startServer(): Promise<http.Server> {
  const app = createApp();

  await registerStaticServing(app);

  const port = Number(process.env.PORT) || 3000;
  const host = getHost();

  return new Promise((resolve) => {
    const server = app.listen(port, host, () => {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Server started',
          host,
          port,
          environment: isProduction() ? 'production' : (process.env.NODE_ENV ?? 'development')
        })
      );
      setupGracefulShutdown(server);
      resolve(server);
    });
  });
}

// Start only when executed directly; tests import createApp() instead.
if (process.env.NODE_ENV !== 'test') {
  startServer();
}
