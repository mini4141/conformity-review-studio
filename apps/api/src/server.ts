import { serve } from '@hono/node-server';
import { app } from './app.js';
import { log } from './log.js';

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port }, () => log('info', 'api listening', { port, provider: process.env.LLM_PROVIDER ?? 'rules' }));
