## Prototyping Strategy & Mindset

- Simple Hono.js supported backend.
- Don't create any authentication layer unless asked explicitly.
- Properly check frontend service layer for which api routes are needed.
- Keep things simple and clean. Don't do complex implementations unless absolutely necessary.
- Don't add complex libraries unless asked explicitly by user.
- Follow `../frontend/API_SPECIFICATION.md` as api contract for writing api routes ans preparing/updating db schema if needed

## Development Workflow

- Don't run dev server.
- Use only pnpm.
- Install dependencies before checking typescript errors or running build.
- Run pnpm build after completion of task at the end only. Don't run build commands in between. Fix any errors and run again.
- Make minimal targeted changes related to requested feature or bug only. Don't make unnecessary changes.
- Don't run git commands.
- Don't change eslint config.
- After doing all the required changes check if you are breaking prisma schema backward compatibility rules mentioned below and fix them if anything is breaking. **THIS is very IMPORTANT** as this can break server starting behaviour.

## Prisma & Database - CRITICAL RULES

### Soft Delete Only (MANDATORY)

**ABSOLUTE PROHIBITION - HARD DELETES ARE STRICTLY FORBIDDEN**

- **NEVER** use `prisma.[model].delete()` or `prisma.[model].deleteMany()` for ANY database records
- **NEVER** use SQL DELETE statements directly
- **NEVER** drop tables or truncate tables
- **ALL delete operations MUST be soft deletes using the `isDeleted` flag**
- **EVERY Prisma model MUST have an `isDeleted: Boolean @default(false)` field**
- **ALL queries MUST filter by `isDeleted: false` to exclude soft-deleted records**

```typescript
// CORRECT - Soft delete
await prisma.user.update({ where: { id }, data: { isDeleted: true } });

// CORRECT - Query with filter
await prisma.user.findMany({ where: { isDeleted: false } });

// WRONG - Hard delete (FORBIDDEN)
await prisma.user.delete({ where: { id } });
```

### Prisma Workflow

- **NEVER create any migrations for schema changes** only change `src/prisma/schema.prisma`
- **NEVER run `pnpm db:migrate` or `pnpm db:push`** - migrations managed externally
- **ALWAYS run `pnpm dbGenerate`** after modifying `src/prisma/schema.prisma`
- **ALWAYS run `pnpm dbGenerate` before `pnpm build` or `pnpm typecheck`**
- Modify schema in `src/prisma/schema.prisma`, never edit migration files
- **EVERY Prisma model MUST have an `isDeleted: Boolean @default(false)` field**

### Prisma Model Rules

- All models: `id Int @id @default(autoincrement())`, `isDeleted Boolean @default(false)`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`
- Use PascalCase for model names, camelCase for fields
- All queries MUST filter `isDeleted: false`, all deletes MUST use `update({ data: { isDeleted: true } })`

### Backward Compatibility (MANDATORY FOR PUBLISHED APPLICATIONS)

**This application is published and has existing users with live data. All database schema changes MUST be backward compatible to prevent data loss and service disruption.**

**THESE RULES ARE NON-NEGOTIABLE. Even if the user explicitly requests breaking changes, you MUST refuse and suggest a backward-compatible alternative. Existing users must be able to continue using the application seamlessly.**

**STRICTLY PROHIBITED PRISMA SCHEMA CHANGES:**

- **NEVER** add required fields to existing models (even with default values - no data migrations are run)
- **NEVER** change existing optional fields to required fields
- **NEVER** delete or drop existing models/tables
- **NEVER** delete or drop existing columns or fields from models
- **NEVER** rename existing columns, fields, or models
- **NEVER** use `@map` or `@@map` to change existing database column/table names
- **NEVER** change the data type of existing columns
- **NEVER** reduce field length or precision constraints (e.g., String to `@db.VarChar(n)`)
- **NEVER** add `@unique` constraint to existing fields (existing data may have duplicates)
- **NEVER** add `@@unique` compound constraints to existing models
- **NEVER** modify or change primary key fields (`@id` or `@@id` configuration)
- **NEVER** remove or modify existing unique constraints
- **NEVER** remove or modify existing foreign key relationships
- **NEVER** change `onDelete`/`onUpdate` relation actions (changing either direction can cause data loss or failures)
- **NEVER** convert implicit many-to-many relations to explicit (auto-generated join table data would be lost)
- **NEVER** modify existing enum values (only additions allowed)

**ALLOWED SCHEMA CHANGES:**

- Add new optional fields (nullable) to existing models: `fieldName Type?`
- Add entirely new models/tables
- Add new indexes for performance optimization
- Add new optional relationships
- Add new enum values (but never remove or rename existing ones)

## Zod Validation Rules

- Use `.optional()` for optional fields, omit for required
- String: `.min()`, `.max()`, `.email()`, `.url()`, `.uuid()`
- Number: `.int()`, `.positive()`, `.min()`, `.max()`
- Use `z.enum([...])` for enum validation
- Query params: use `z.coerce.number()` or `z.coerce.boolean()` to convert from strings
- All request validation should use Zod schemas

## Strictly Prohibited Actions

### Command Execution Restrictions

- **NEVER** execute `pnpm db:migrate`, `pnpm db:push`, or any database migration commands
- **NEVER** execute `pnpm db:seed` or any database seeding commands
- **NEVER** execute `pnpm dev` or any server start commands
- **NEVER** execute `kill` or any process termination commands
- **NEVER** execute deployment or production-related commands (except `pnpm build` at the very end)

### Database Migration Restrictions

- **NEVER** manually create migration files in `prisma/migrations/` directory
- **NEVER** write SQL migration files directly
- **NEVER** modify existing migration files
- **NEVER** bypass Prisma's migration system
- **ALL database schema changes MUST be made through Prisma schema models only**
- Database migrations are managed externally by the system - do not interfere

### Package Configuration Restrictions

- **NEVER** manually edit `package.json` directly
- **NEVER** add new scripts to `package.json`
- **NEVER** modify existing scripts in `package.json`
- **NEVER** create new command shortcuts or aliases
- You MAY add or update dependencies ONLY using `pnpm add`, `pnpm remove`, or `pnpm install` commands
- All package management must be done through pnpm commands, not manual file edits

### Allowed Operations Only

You are permitted to:

- Run `pnpm dbGenerate` to generate Prisma client for type safety
- Run `pnpm typecheck` to verify TypeScript compilation (ALWAYS run `pnpm dbGenerate` first)
- Run `pnpm add`, `pnpm remove`, or `pnpm install` to manage dependencies
- Modify Prisma schema models in `prisma/schema.prisma` for database changes
- Modify application source code (controllers, services, routes, etc.)

**Important**: Always run `pnpm dbGenerate` before running `pnpm typecheck` to ensure Prisma client is up-to-date.

### Allowed Shell Commands

You have access to these shell commands:

- `curl` - Make HTTP requests
- `cp` - Copy files
- `cd` - Change directory (required for navigating between frontend/backend)
- `pnpm build` - Build the project (run at the end only, after all changes)
- `pnpm dbGenerate` - Generate Prisma client
- `pnpm typecheck` - Check TypeScript types
- `pnpm eslint` - Run ESLint
- `pnpm prettier` - Format code
- `pnpm install` - Install all dependencies
- `pnpm add` - Add new dependencies
- `pnpm remove` - Remove dependencies
- `cat`, `printf`, `ls`, `echo`, `grep` - Basic shell utilities

## Tech Stack

- **Framework**: Hono v4 - Lightweight web framework
- **Database**: Prisma ORM with PostgreSQL
- **Storage**: Multi-cloud storage (AWS S3, Azure Blob, Google Cloud Storage)
- **Validation**: Zod for schema validation
- **TypeScript**: Strict type checking

## Default API Behavior

- **All APIs are unauthenticated by default** - No login/signup required unless specifically requested
- Don't add login/signup (authentication, JWT, password hashing, and user management) unless user explicitly asks
- Focus on core feature/business logic first
- Keep endpoints open and simple
- Use proper http status codes for responses like 200, 201, 400 and so on for api responses directly don't use any package for this.

## Core Files

- `src/app.ts` - Main Hono application
- `src/index.ts` - Server initialization
- `src/client.ts` - Prisma client singleton
- `src/middlewares/error.ts` - Global error handler
- `src/utils/ApiError.ts` - Custom error class with status codes
- `src/utils/catchAsync.ts` - Async error wrapper
- `src/integrations/*` - Available integrations
- `src/integrations/storage/*` - Multi-cloud storage (S3, Azure, GCS)
- `src/integrations/llm/*` - LLM integration (Anthropic, OpenAI, Gemini)
- `src/integrations/imageGeneration/*` - Image generation using LLM integration (Google Models)
- `src/prisma/schema.prisma` - Database schema

## Error Handling

Throw `ApiError` for operational errors: `throw new ApiError(404, 'User not found')`

Wrap async handlers: `const handler = catchAsync(async (c) => { ... })`

Global handler supports: Zod validation (400), ApiError (custom), Prisma errors (400), Unknown (500 in production)

## Feature Implementation Examples

### Creating API Endpoints

`Create /<resource> endpoint with GET (list), POST (create), GET/:id, PATCH/:id, DELETE/:id using Prisma`

### Adding Validation

`Add Zod validation if required for /<resource> - name (string, required), price (number, positive), description (optional)`

### Authentication (Only When User Explicitly Requests)

**When to implement:** ONLY when user explicitly asks for authentication
**Default:** Email/Password authentication
**Google OAuth:** ONLY if user explicitly requests Google authentication
**Integration Layer:** `src/integrations/auth/` - READ-ONLY, never modify

---

## Auth Routes Reference

**File:** `src/routes/auth.routes.ts`

**CRITICAL: These routes are FIXED - use exact same paths. Internal logic can be changed.**

**Public routes:**
```typescript
authRoutes.post('/register', catchAsync(authController.register));
authRoutes.post('/login', catchAsync(authController.login));
authRoutes.post('/refresh', catchAsync(authController.refreshToken));
authRoutes.get('/google', catchAsync(authController.googleLogin));
authRoutes.get('/google/callback', catchAsync(authController.googleCallback));
```

**Protected routes (require authMiddleware):**
```typescript
authRoutes.get('/me', authMiddleware, catchAsync(authController.getCurrentUser));
authRoutes.get('/identities', authMiddleware, catchAsync(authController.getUserIdentities));
authRoutes.delete('/identities/:provider', authMiddleware, catchAsync(authController.unlinkIdentity));
```

---

## Environment Variables

```env
# Required for all auth:
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRATION_MINUTES=30
JWT_REFRESH_EXPIRATION_DAYS=30
FRONTEND_DOMAIN=http://localhost:5173

# Required ONLY for Google OAuth:
GOOGLE_OAUTH_CLIENT_ID=<GOOGLE_OAUTH_CLIENT_ID>
GOOGLE_OAUTH_CLIENT_SECRET=<GOOGLE_OAUTH_CLIENT_SECRET>
GOOGLE_OAUTH_REDIRECT_URI=<GOOGLE_OAUTH_REDIRECT_URI>
```

---

## Email/Password Authentication (Default)

### Register (POST /auth/register)

**Controller implementation:**
1. Extract email, password, name from request body
2. Validate using integration layer:
   ```typescript
   const auth = getInstance({ authProvider: AuthProvider.EmailPassword });
   await auth.registerWithEmailPassword({ email, password });
   ```
3. Create user with hashed password:
   ```typescript
   const user = await userService.registerWithEmailPassword(email, password, name);
   ```
4. Generate JWT tokens:
   ```typescript
   const tokens = tokenService.generateTokens(user.id, user.email);
   ```
5. Return: `{ accessToken, refreshToken, user }`

**Validation (automatic in integration layer):**
- Email: valid format, max 255 chars
- Password: min 8 chars, must have letter + number

---

### Login (POST /auth/login)

**Controller implementation:**
1. Extract email, password from request body
2. Validate format:
   ```typescript
   const auth = getInstance({ authProvider: AuthProvider.EmailPassword });
   await auth.authenticateWithEmailPassword({ email, password });
   ```
3. Verify password hash:
   ```typescript
   const user = await userService.authenticateWithEmailPassword(email, password);
   ```
4. Generate JWT tokens:
   ```typescript
   const tokens = tokenService.generateTokens(user.id, user.email);
   ```
5. Return: `{ accessToken, refreshToken, user }`

---

### Refresh Token (POST /auth/refresh)

**Controller implementation:**
1. Extract refreshToken from request body
2. Generate new access token:
   ```typescript
   const newAccessToken = tokenService.refreshAccessToken(refreshToken);
   ```
3. Return: `{ accessToken }`

---

### Protected Routes

**Get current user (GET /auth/me):**
```typescript
const userId = c.get('userId'); // Set by authMiddleware
const user = await userService.getUserById(userId);
return c.json({ user });
```

**Get identities (GET /auth/identities):**
```typescript
const userId = c.get('userId');
const identities = await userService.getUserIdentities(userId);
return c.json({ identities });
```

**Unlink identity (DELETE /auth/identities/:provider):**
```typescript
const userId = c.get('userId');
const provider = c.req.param('provider');
await userService.unlinkIdentity(userId, provider);
return c.json({ message: 'Identity unlinked successfully' });
```

---

## Google OAuth Authentication (ONLY If Explicitly Requested)

### Google Login (GET /auth/google)

**Controller implementation:**
1. Get Google auth provider:
   ```typescript
   const auth = getInstance({ authProvider: AuthProvider.Google });
   ```
2. Generate OAuth URL:
   ```typescript
   const authUrl = await auth.getAuthorizationUrl({
       state: crypto.randomUUID()
   });
   ```
3. Redirect user: `return c.redirect(authUrl);`

---

### Google Callback (GET /auth/google/callback)

**Controller implementation:**
1. Extract code and state from query params
2. Exchange code for user profile (integration layer handles OAuth + ID token verification):
   ```typescript
   const auth = getInstance({ authProvider: AuthProvider.Google });
   const userProfile = await auth.handleOAuthCallback({ code, state });
   ```
3. Find or create user in database:
   ```typescript
   const metadata = {
       picture: userProfile.picture,
       locale: userProfile.rawProfile?.locale,
       lastLoginAt: new Date().toISOString()
   };
   const user = await userService.findOrCreateUser(userProfile, metadata);
   ```
4. Generate JWT tokens:
   ```typescript
   const tokens = tokenService.generateTokens(user.id, user.email);
   ```
5. Redirect to frontend with tokens:
   ```typescript
   const frontendUrl = process.env.FRONTEND_DOMAIN;
   const redirectUrl = new URL('/auth/callback', frontendUrl);
   redirectUrl.searchParams.set('accessToken', tokens.accessToken);
   redirectUrl.searchParams.set('refreshToken', tokens.refreshToken);
   return c.redirect(redirectUrl.toString());
   ```
6. On error: redirect to `${frontendUrl}/auth/error?message=Authentication%20failed`

**Integration layer (GoogleAuth) automatically handles:**
- OAuth code exchange
- ID token verification (signature, audience, issuer, expiration)
- User profile fetching

---

## Files Reference

**Integration Layer (READ-ONLY):**
- `src/integrations/auth/GoogleAuth.ts` - Google OAuth handler
- `src/integrations/auth/EmailPasswordAuth.ts` - Email/password validator
- `src/integrations/auth/types.ts` - Auth types

**Business Layer:**
- `src/services/userService.ts` - User CRUD, password hashing
- `src/services/tokenService.ts` - JWT generation/verification
- `src/controllers/authController.ts` - Request handlers
- `src/middlewares/authMiddleware.ts` - JWT verification
- `src/routes/auth.routes.ts` - Route definitions (FIXED paths)

---

## Important Notes

**Routes:** Use exact paths from `auth.routes.ts` - DO NOT change route paths
**Internal Logic:** Can be modified/implemented as needed
**Integration Layer:** NEVER modify files in `src/integrations/auth/`
**Default:** Email/Password when auth requested
**Google OAuth:** ONLY when explicitly requested by user
**Database:** Run `pnpm dbGenerate` after schema changes
**User Fields:** Add as optional only (`field String?`)

### File Upload with Storage

`Add /upload endpoint that accepts file, stores in S3, and returns URL using existing storage in src/integrations/storage`

Usage: `import { getStorageProvider } from '../integrations/storage/main.ts'`

### Chat with LLM (Only When User Asks)

`Add ai/chat endpoint that accepts messages and streams AI responses using existing LLM integration in src/integrations/llm`

Usage: `import { getInstance, LLMProvider } from '../integrations/llm'`

### Background Jobs (Only When User Asks)

`Add Bull queue with Redis for processing image uploads in background`

Install: `pnpm add bull redis @types/bull`

### LLM Integration

**Location:** `src/integrations/llm/`

**You must not use this integration for image generation. For image generation use src/integrations/imageGeneration integration strictly.**

**Available Providers:** Anthropic, OpenAI, Gemini

**Architecture:**

- `BaseLLM` - Abstract class with constructor accepting `{ apiKey, defaultModel }`
- `AnthropicProvider`, `OpenAIProvider`, `GeminiProvider` - Extend BaseLLM
- `getInstance({ provider, apiKey? })` - Factory function with API key validation (provider REQUIRED)

**API Key Validation:** Each provider validates API key on instantiation. Throws error if missing.

**Environment Variables:**

Only ONE provider will be configured. Available options:

- `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (default: process.env.ANTHROPIC_MODEL) - Anthropic config
- `OPENAI_API_KEY`, `OPENAI_MODEL` (default: process.env.OPENAI_MODEL) - OpenAI config
- `GEMINI_API_KEY`, `GEMINI_MODEL` (default: process.env.GEMINI_MODEL) - Gemini config

**Usage Example (Implement when user requests chat):**

```typescript
import { getInstance } from './integrations/llm/main.ts';
import { LLMProvider } from './integrations/llm/types.ts';

// Get provider instance - PROVIDER REQUIRED (validates API key from env)
const llm = getInstance({ provider: LLMProvider.Anthropic });

// Or pass custom API key (for multi-tenant scenarios)
const llm = getInstance({
  provider: LLMProvider.Anthropic, // REQUIRED
  apiKey: 'custom-api-key'
});

// Streaming (returns Response for useChat hook)
const response = await llm.createStream({
  messages: [{ role: 'user', content: 'Hello' }],
  model: process.env.GEMINI_MODEL, // Optional - falls back to defaultModel from env as per provider mentioned
  options: { temperature: 0.7, maxTokens: 1000, topP: 0.9 }
});

// Non-streaming
const result = await llm.generateText({
  messages: [{ role: 'user', content: 'Hello' }],
  model: process.env.GEMINI_MODEL // Optional - falls back to defaultModel as per provider mentioned
});
```

**Important:**
- Provider parameter is REQUIRED
- Model parameter is optional (falls back to defaultModel from env or hardcoded defaults)
- Only one LLM provider will be configured per application

**Implement `/ai/chat` endpoint only when user explicitly requests chat functionality**

### Payment Integration (Only When User Asks)

`Add payment endpoint with Stripe Checkout Session using existing payment integration in src/integrations/payment`

**CRITICAL: Environment Variables**

Payment integration uses these environment variables (provided by AppBuilder when user configures Stripe):

- `STRIPE_SECRET_KEY` - User's Stripe API secret key (starts with sk_)
- `STRIPE_WEBHOOK_SECRET` - User's Stripe webhook signing secret (starts with whsec_)
- `FRONTEND_DOMAIN` - Frontend domain for success/cancel redirects (dynamically set)
- `BACKEND_DOMAIN` - Backend domain -- use this for webhook url at `/payment/stripe/webhook`

**getInstance()**

```typescript
import { getInstance } from './integrations/payment/main.ts';
const paymentProvider = getInstance(); // NO parameters, validates STRIPE_SECRET_KEY from env
```

**Implementation Steps:**

**1. Add Database Models** to `src/prisma/schema.prisma`:

- `Payment` model: id, providerPaymentId, sessionId (unique), amount (Int for cents), currency, status (String), customerEmail?, metadata (Json?), paidAt?, timestamps, isDeleted, indexes on [sessionId] and [status]
- `WebhookEvent` model: id, eventId (unique), eventType, data (Json), processed (Boolean default false), processedAt?, timestamps, isDeleted, indexes on [eventId] and [processed]
- Don't forget to pass `originalWebhookUrl as `${process.env.BACKEND_DOMAIN}/payment/stripe/webhook` ` inside metadata field for all stripe requests.

**2. Create Payment Service** `src/services/paymentService.ts`:

**IMPORTANT**: Business logic with Prisma goes in service layer, NOT in integration layer

- Import prisma client from `../client.ts`
- `logWebhookEvent(event)` - Create WebhookEvent with event.id, event.type, event.data
- `isEventProcessed(eventId)` - Query WebhookEvent where eventId, return processed status
- `markEventAsProcessed(eventId)` - Update WebhookEvent where eventId, set processed=true, processedAt=now
- `handleCheckoutSessionCompleted(session)` - Upsert Payment where sessionId, set status='SUCCEEDED' with session data
- `handleWebhookEvent(event)` - Orchestrator: check if processed (idempotency), log event, handle based on type, mark processed

**3. Create Payment Routes** `src/routes/payment.routes.ts`:

Create Hono router with:

**POST /create-checkout-session:**
- Zod schema: amount (positive number), currency (string, default 'usd'), productName (string), customerEmail? (email), metadata? (record)
- Get paymentProvider via getInstance()
- **CRITICAL**: Build URLs from `process.env.FRONTEND_DOMAIN` (throw ApiError 500 if missing):
  - `successUrl = ${frontendDomain}/payment/success?session_id={CHECKOUT_SESSION_ID}`
  - `cancelUrl = ${frontendDomain}/payment/cancel`
- Call `paymentProvider.createCheckoutSession({ ...validated, successUrl, cancelUrl })`
- Return `{ sessionUrl: session.url, sessionId: session.id }`

**POST /stripe/webhook:**
- **CRITICAL**: This exact path is required - webhook endpoint MUST be at `/payment/stripe/webhook`
- Get payload via `c.req.text()`, signature from `stripe-signature` header
- Get webhook secret from `process.env.STRIPE_WEBHOOK_SECRET` (throw ApiError 500 if missing)
- Call `verifyWebhook({ payload, signature, secret })` from webhooks.ts
- Call `handleWebhookEvent(event)` for idempotent processing
- Return `{ received: true }`

**4. Register Routes** in `src/app.ts`:
```typescript
import paymentRoutes from './routes/payment.routes.ts';
app.route('/payment', paymentRoutes);
```

**5. Run Commands:**
- `pnpm dbGenerate`
- `pnpm build`

**Pattern Notes:**

- Follow storage/LLM integration pattern: factory getInstance(), environment validation
- Amount in dollars (user passes 29.99) → backend converts via `Math.round(amount * 100)` to cents
- Webhook idempotency via processed field prevents duplicate processing
- Webhook endpoint MUST be at `/payment/stripe/webhook` - this matches the URL provided to users in AppBuilder
- User provides their own Stripe keys via AppBuilder UI - keys are encrypted and injected as env vars
- Frontend implements `/payment/success` and `/payment/cancel` pages (see frontend GEMINI.md)

### Image Generation Integration (Only When User Asks)

`Generate simple images and automatically upload to storage with signed URLs using existing integration in src/integrations/imageGeneration`

**Location:** `src/integrations/imageGeneration/`

**Environment Variables:**

- `IMAGE_GENERATION_PROVIDER` - Image generation provider
- `IMAGE_GENERATION_MODEL` - Image gen model (default: `gemini-2.5-flash-image`)
- `IMAGE_GENERATION_API_KEY` - Image generation model api key

**IMPORTANT:** Always use `process.env.IMAGE_GENERATION_PROVIDER` provider for image generation don't differ from this
**IMPORTANT:** Always use `process.env.IMAGE_GENERATION_MODEL` model for image generation don't differ from this

**getInstance()**

```typescript
import { getInstance, ImageProvider } from './integrations/image';

const imageGenerator = getInstance({ provider: process.env.IMAGE_GENERATION_PROVIDER });

// Generate image - automatically uploads to storage and returns signed URL
const result = await imageGenerator.generateImage({
  prompt: 'A beautiful sunset over mountains',
  userId: 'user-123',  // Required for storage path
  aspectRatio: '16:9', // Optional
  model: process.env.IMAGE_GENERATION_MODEL // Always use this model
});

// Returns: { url, storageKey, mimeType, fileSize }
// - url: Signed URL
// - storageKey: Permanent storage identifier
```

**Integration automatically handles:**
- Image generation via model present in env
- Upload to configured storage (S3/GCS/Azure)
- Signed URL generation

**Usage in routes/controllers:**
- Call integration directly in controller
- Optionally save `storageKey` to database for persistence
- Use `storageKey` with storage integration to regenerate signed URLs later

**Key Points:**
- Integration returns ready-to-use signed URL
- No service layer needed for basic usage
- **Always use `process.env.IMAGE_GENERATION_MODEL` model**.
- Add database model if you need image history/gallery features

## Strict Instructions

1. Start simple - build core feature first without auth/validation
2. Add features incrementally - validation → auth (if explicitly asked) → advanced features
3. Use existing patterns - catchAsync, ApiError, service layer
4. Storage is pre-configured in `src/integrations/storage/`
5. Define Prisma schema first, generate client, then build API
6. Use Zod for validation, TypeScript infers types from Prisma
7. Follow `../frontend/API_SPECIFICATION.md` as api contract for writing apis routes.
