# Running WebDeck Locally

This guide explains how to package and run both the frontend and backend of WebDeck.

## Method 1: Docker Compose (Recommended)

The easiest way to run WebDeck along with a PostgreSQL database is using Docker Compose.

### Prerequisites
- [Docker](https://www.docker.com/get-started) installed.

### Steps
1. In the project root, run:
   ```bash
   docker-compose up --build
   ```
2. The application will be available at [http://localhost:3000](http://localhost:3000).

*Note: The database is automatically created and configured with the default credentials in `docker-compose.yml`.*

## Method 2: Single Docker Image

If you already have a PostgreSQL database running, you can use the single Docker image.

### Prerequisites
- [Docker](https://www.docker.com/get-started) installed.
- A running PostgreSQL database.

### Steps
1. Build the image:
   ```bash
   docker build -t webdeck .
   ```
2. Run the container:
   ```bash
   docker run -p 3000:3000 \
     -e DATABASE_URL="postgresql://user:pass@host.docker.internal:5432/db" \
     -e JWT_SECRET="your-secret" \
     webdeck
   ```

## Environment Variables
- `DATABASE_URL`: Connection string for PostgreSQL.
- `JWT_SECRET`: Secret key for authentication tokens.
- `FRONTEND_DOMAIN`: (Optional) Defaults to http://localhost:3000.
