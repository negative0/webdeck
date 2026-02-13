import deckRoutes from './routes/deck.routes.ts';
import authRoutes from './routes/auth.routes.ts';
import aiRoutes from './routes/ai.routes.ts';
import { authMiddleware } from './middlewares/authMiddleware.ts';
import { errorHandler } from './middlewares/error.ts';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { serveStatic } from '@hono/node-server/serve-static';

const app = new Hono();

// set security HTTP headers only in production
if (process.env.NODE_ENV === 'production') app.use(secureHeaders());

// enable cors
app.use(cors());

app.get('/version.json', c => {
    return c.json({ version: parseInt(process.env.VERSION || '0') });
});

app.get('/health', c => {
    return c.text('OK');
});

// Mount routes
app.route('/auth', authRoutes);

// Apply auth middleware to all deck and ai routes
app.use('/deck/*', authMiddleware);
app.use('/ai/*', authMiddleware);
app.route('/deck', deckRoutes);
app.route('/ai', aiRoutes);

// Serve static files from the 'public' directory
app.use('/*', serveStatic({ root: './public' }));
app.get('*', serveStatic({ path: './public/index.html' }));

// handle error
app.onError((err, c) => {
    return errorHandler(err, c);
});

export default app;
