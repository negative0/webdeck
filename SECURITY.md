# Security Advisory

## Disclaimer
**WebDeck is a powerful tool designed for multi-platform deck management and integration. The backend server, when deployed, has the capability to interact with various integrations (LLMs, storage, image generation, etc.) and execute operations on the host environment as configured.**

> [!IMPORTANT]
> **Platform Support**: The backend currently only supports **macOS** for command execution. Attempting to run the backend on other operating systems may result in failed command executions or unexpected behavior.

### Core Security Principles
1. **Host Security**: Since the backend runs on your own infrastructure (local machine, VPS, or cloud), you are responsible for securing the environment. Ensure that the server has minimal necessary permissions.
2. **Environment Variables**: Never commit your `.env` files. They contain sensitive keys for AI providers, databases, and storage.
3. **Network Access**: By default, the backend may listen on all interfaces if not configured otherwise. Use a reverse proxy (like Nginx) or a firewall to restrict access to trusted IPs.
4. **Integration Risks**: Features involving LLMs or automated scripts can perform actions based on external input. Always review integration settings and limit the scope of what the AI agents can do.

## Reporting a Vulnerability
If you discover a security vulnerability within this project, please do not disclose it publicly. Instead, please report it via the following methods:
- Email: security@webdeck.example.com (Placeholder)
- GitHub Issues: Use the "Security" label (for non-sensitive architectural discussions)

We take all security reports seriously and will work to address them as quickly as possible.
