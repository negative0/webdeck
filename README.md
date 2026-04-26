# WebDeck

WebDeck is a multi-platform application consisting of a backend API, a web frontend, a desktop application (Electron), and a mobile application (Expo).

## Project Structure

- `backend/`: Node.js server using Hono and Prisma.
- `frontend/`: React application built with Vite and Tailwind CSS.
- `desktop/`: Electron application that integrates the frontend and backend.
- `mobile/`: Mobile application built with React Native and Expo.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [pnpm](https://pnpm.io/) (used for backend/frontend) or npm
- [Docker](https://www.docker.com/) (optional, for database and containerized runs)

## Setup and Running

### 1. Quick Start (Docker)

The easiest way to run the full stack (Frontend + Backend + Database) is using Docker Compose:

```bash
docker-compose up --build
```

For more detailed Docker instructions, see [RUN_LOCALLY.md](./RUN_LOCALLY.md).

### 2. Manual Setup

#### Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Set up your `.env` file (see `backend/.env.example` if available).
4. Run migrations:
   ```bash
   npx prisma migrate dev
   ```
5. Start the development server:
   ```bash
   pnpm run dev
   ```

#### Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Start the development server:
   ```bash
   pnpm run dev
   ```

#### Desktop
1. Navigate to the desktop directory:
   ```bash
   cd desktop
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the application:
   ```bash
   npm run dev
   ```

#### Mobile
1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Expo:
   ```bash
   npx expo start
   ```

## API Documentation

For details on the backend API, refer to [API_SPECIFICATION.md](./API_SPECIFICATION.md).
