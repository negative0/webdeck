# WebDeck

WebDeck is a powerful, self-hosted, multi-platform control surface that allows you to trigger remote commands, scripts, and automations from a customizable button grid. Similar to a physical Stream Deck, WebDeck gives you a digital interface to control your server or workstation from any device.

## Key Features

- **Customizable Button Grid**: Design your own control layout with custom labels, icons, and colors.
- **Remote Command Execution**: Execute shell commands, scripts, or system actions directly on your backend server.
- **AI-Powered Suggestions**: Integrated AI assistant to help you generate and optimize commands based on natural language prompts.
- **Multi-Platform Support**:
    - **Web**: Access your control deck from any browser.
    - **Desktop**: A native Electron app for focused control.
    - **Mobile**: A mobile application (Expo) for controlling your system on the go.
- **Secure Integration**: Built-in authentication and modular integration support for LLMs (OpenAI, Anthropic, Gemini), storage (S3, Azure, GCS), and more.

## Project Structure

- `backend/`: Node.js server using Hono and Prisma.
- `frontend/`: React application built with Vite and Tailwind CSS.
- `desktop/`: Electron application that integrates the frontend and backend.
- `mobile/`: Mobile application built with React Native and Expo.

## Prerequisites

- **macOS** (Currently, the backend only supports macOS for command execution)
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

## License & Security

- **License**: This project is licensed under the [MIT License](./LICENSE).
- **Security**: Please read our [Security Advisory](./SECURITY.md) before deploying.
