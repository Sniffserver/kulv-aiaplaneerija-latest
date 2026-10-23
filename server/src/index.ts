import Fastify from 'fastify';

export function buildServer() {
  const server = Fastify({
    logger: false,
  });

  server.get('/health', async () => {
    return {
      ok: true,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  });

  return server;
}

const server = buildServer();

const start = async () => {
  try {
    await server.listen({ port: 8000, host: '127.0.0.1' });
    console.log('Server listening at http://127.0.0.1:8000');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  start();
}

