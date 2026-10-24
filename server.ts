import express from 'express';
import { createServer as createViteServer } from 'vite';
import { z } from 'zod';

const weatherQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

async function startServer() {
  const app = express();

  app.use(express.json());

  // CORS and basic security headers
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });

  app.use(vite.middlewares);

  // API routes
  app.get('/health', (req, res) => {
    res.json({
      ok: true,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  });

  app.get('/api/weather', async (req, res) => {
    const parseResult = weatherQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.'
      });
    }

    const { lat, lon } = parseResult.data;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Weather API key not configured' });
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        return res.status(502).json({ error: 'Weather provider unavailable or returned error' });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return res.status(504).json({ error: 'Weather request timed out' });
      }
      res.status(500).json({ error: 'Failed to fetch weather data' });
    }
  });

  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || '0.0.0.0';

  app.listen(port, host, () => {
    console.log(`Server listening on http://${host}:${port}`);
  });
}

startServer();
