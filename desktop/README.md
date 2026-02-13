# WebDeck Desktop

This is the Electron-based desktop application for WebDeck.

## Prerequisites

- Node.js (v18+)
- pnpm (or npm)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

## Development

To run the application in development mode:

```bash
npm run dev
```

This will:
1. Start the frontend dev server
2. Watch the backend code
3. Launch Electron

## Building

To package the application for macOS:

```bash
npm run dist
```

This will:
1. Build the frontend
2. Prepare the backend (copy files, generate Prisma client, create SQLite DB)
3. Build the Electron main process
4. Package everything into a `.dmg` file in `dist` (or `dist-electron` depending on config).

## Architecture

- **Frontend**: React/Vite app served from `frontend-dist` (production) or localhost (dev).
- **Backend**: Hono/Node.js app running as a module within the main process or sidecar.
- **Database**: SQLite database stored in the user's data directory.

## Notes

- The database file `dev.db` is created during build and copied to `~/Library/Application Support/WebDeck/webdeck.db` on first run.
- API requests from frontend should go to `http://localhost:3000` (or whatever port backend uses).
