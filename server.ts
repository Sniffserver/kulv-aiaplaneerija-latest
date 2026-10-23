import express from 'express';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });

  app.use(vite.middlewares);

  // API routes
  app.get('/health', (req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString(), version: '1.0.0' });
  });

  app.get('/api/weather', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Missing lat or lon' });
    }
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }
    try {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch weather' });
    }
  });

  app.listen(3000, '0.0.0.0', () => {
    console.log('Server listening on http://localhost:3000');
  });
}

startServer();
