# WebDeck API Specification

## Authentication

### Register
- **Endpoint**: `POST /auth/register`
- **Body**: `{ email: string, password: string, name?: string }`
- **Response**: `{ accessToken: string, refreshToken: string, user: User }`

### Login
- **Endpoint**: `POST /auth/login`
- **Body**: `{ email: string, password: string }`
- **Response**: `{ accessToken: string, refreshToken: string, user: User }`

### Refresh Token
- **Endpoint**: `POST /auth/refresh`
- **Body**: `{ refreshToken: string }`
- **Response**: `{ accessToken: string }`

## Deck Configuration (Authenticated)

### Get Deck Configuration
- **Endpoint**: `GET /deck`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `DeckButton[]`

### Save Deck Configuration
- **Endpoint**: `POST /deck`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `DeckButton[]`
- **Response**: `{ success: true }`

## Command Execution (Authenticated)

### Execute Command
- **Endpoint**: `POST /deck/execute`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ command: string, type?: 'COMMAND' | 'SHORTCUT' }`
- **Response**: `{ success: true, stdout: string, stderr: string }`

## AI Assistance (Authenticated)

### Suggest Command
- **Endpoint**: `POST /ai/suggest`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ prompt: string }`
- **Response**: `{ label: string, command: string, type: 'COMMAND' | 'SHORTCUT', icon: string, color: string }`

## Models

### DeckButton
```typescript
interface DeckButton {
  id: string;
  label: string;
  icon?: string;
  command: string;
  type: 'COMMAND' | 'SHORTCUT';
  color?: string;
  row: number;
  col: number;
}
```
