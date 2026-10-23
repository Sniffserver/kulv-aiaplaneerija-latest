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

  app.listen(3000, '0.0.0.0', () => {
    console.log('Server listening on http://localhost:3000');
  });
}

startServer();
