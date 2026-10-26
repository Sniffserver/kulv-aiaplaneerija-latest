import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

const WEATHER_CACHE_TTL_MS = 5 * 60 * 1000;
const WEATHER_REQUEST_TIMEOUT_MS = 8_000;

const weatherQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180)
});

type CacheEntry = {
  expiresAt: number;
  data: unknown;
};

const weatherCache = new Map<string, CacheEntry>();

const developmentOrigins = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
]);

function getAllowedOrigins(): Set<string> {
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

function isProduction(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.K_SERVICE) ||
    Boolean(process.env.K_REVISION)
  );
}

function getHost(): string {
  const envHost = process.env.HOST;
  // If HOST is set to a specific IP or custom domain (ignore Linux automatic container hostname 'das')
  if (envHost && envHost !== 'das' && envHost !== 'localhost' && envHost !== '127.0.0.1') {
    return envHost;
  }
  return '0.0.0.0';
}

function createWeatherLimiter() {
  return rateLimit({
    windowMs: 60_000,
    limit: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    validate: false,
    message: {
      error: 'Too many weather requests, please try again later.'
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

export function createApp(): Express {
  const app = express();
  const allowedOrigins = getAllowedOrigins();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

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

  app.get('/api/weather', createWeatherLimiter(), async (req: Request, res: Response) => {
    const parsedQuery = weatherQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
      return res.status(400).json({
        error: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.'
      });
    }

    const { lat, lon } = parsedQuery.data;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: 'Weather API key not configured'
      });
    }

    const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
    const cached = weatherCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached.data);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        WEATHER_REQUEST_TIMEOUT_MS
      );

      const upstreamUrl = new URL('https://api.openweathermap.org/data/2.5/weather');
      upstreamUrl.searchParams.set('lat', lat.toString());
      upstreamUrl.searchParams.set('lon', lon.toString());
      upstreamUrl.searchParams.set('appid', apiKey);
      upstreamUrl.searchParams.set('units', 'metric');

      const response = await fetch(upstreamUrl, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return res.status(502).json({
          error: 'Weather provider unavailable or returned an error'
        });
      }

      const data: unknown = await response.json();

      weatherCache.set(cacheKey, {
        expiresAt: Date.now() + WEATHER_CACHE_TTL_MS,
        data
      });

      res.setHeader('X-Cache', 'MISS');
      return res.json(data);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        return res.status(504).json({
          error: 'Weather request timed out'
        });
      }

      return res.status(500).json({
        error: 'Failed to fetch weather data'
      });
    }
  });

  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not found'
    });
  });

  return app;
}

async function registerStaticServing(app: Express): Promise<void> {
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

    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }

    res.sendFile(path.join(distPath, 'index.html'));
  });

  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not found'
    });
  });
}

async function startServer(): Promise<void> {
  const app = createApp();

  await registerStaticServing(app);

  const port = Number(process.env.PORT) || 3000;
  const host = getHost();

  app.listen(port, host, () => {
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
  });
}

// Start only when executed directly; tests import createApp() instead.
if (process.env.NODE_ENV !== 'test') {
  startServer();
}
