import app from './app.ts';
import prisma from './client.ts';
import { serve } from '@hono/node-server';
import dotenv from 'dotenv';
import { ServerType } from '@hono/node-server';

let server: ServerType | undefined;

dotenv.config();

export async function start(port?: number) {
    if (server) {
        console.log('Server is already running');
        return;
    }

    try {
        await prisma.$connect();
        console.log('Database connected');
    } catch (error) {
        console.error('Failed to connect to database', error);
        throw error;
    }

    const portToUse = port || (process.env.PORT ? parseInt(process.env.PORT) : 3000);

    server = serve({
        fetch: app.fetch,
        port: portToUse,
        hostname: '0.0.0.0'
    }, (info) => {
        console.log(`Server is running on http://localhost:${info.port}`);
    });
    
    return server;
}

export async function stop() {
    if (server) {
        server.close();
        server = undefined;
        console.log('Server stopped');
    }
}

// Only run if executed directly
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    start();
}

const exitHandler = () => {
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
};

const unexpectedErrorHandler = () => {
    exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
    if (server) {
        server.close();
    }
});

