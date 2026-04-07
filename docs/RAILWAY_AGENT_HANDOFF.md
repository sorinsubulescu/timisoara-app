# Railway Agent Handoff

Copy the prompt below into Railway's AI setup agent.

## Copy-Paste Prompt

```text
Set up production infrastructure for this repository on Railway with the smallest managed setup needed for the mobile app only.

Important constraints:
- Deploy only the backend API and PostgreSQL.
- Do not deploy the web app.
- Do not add Redis.
- Keep the deployment focused on transit-only mobile usage.
- Use Railway only.

Repository facts:
- Monorepo root: timisoara-app
- Backend app path: apps/api
- Mobile app path: apps/mobile
- Backend framework: NestJS + Prisma
- Database: PostgreSQL
- Health endpoint: /api/health
- Backend listens on port 4000
- apps/api/Dockerfile already exists and already runs Prisma migrations on startup

Very important clarification:
- "Transit-only" is currently a mobile app configuration, not a backend feature flag.
- The backend does not have a runtime switch that disables non-transit Nest modules.
- Do not rewrite the backend into a transit-only API unless absolutely necessary.
- The correct interpretation is: deploy the API and Postgres needed by the mobile app, do not deploy the web app, and assume the mobile client will run with EXPO_PUBLIC_STANDALONE_TRANSIT=true.

Create these Railway services in one project:
1. A PostgreSQL service named Postgres
2. An API service named api

Railway region:
- Use EU West Metal (Amsterdam)

API service configuration:
- Service name: api
- Root directory: apps/api
- Build method: use the existing Dockerfile in apps/api
- Public networking: enabled
- Health check path: /api/health
- Internal port: 4000

Set these environment variables on the api service:
- DATABASE_URL=${{Postgres.DATABASE_URL}}
- DIRECT_URL=${{Postgres.DATABASE_URL}}
- PORT=4000
- NODE_ENV=production
- CORS_ORIGIN=https://your-domain.ro

Notes about env vars:
- Keep the Postgres service name exactly Postgres so the variable reference works as written.
- If you rename the database service, update the variable reference accordingly.
- DIRECT_URL should match DATABASE_URL for this Railway-only deployment.

Expected deployment outcome:
- Railway project contains exactly two services for now: Postgres and api
- api service deploys successfully from apps/api
- /api/health returns status ok
- api service has a Railway-generated public domain

Validation steps:
1. Confirm the Postgres service is healthy
2. Confirm the api deployment succeeds
3. Confirm the api service can reach Postgres
4. Open the public api domain and verify /api/health
5. Report back the Railway public API URL
6. Report back the exact env vars that were set on the api service

Do not do these things:
- Do not deploy apps/web
- Do not add Redis
- Do not add extra services unless required for Railway deployment itself
- Do not remove existing API modules just to force backend transit-only mode

If you need a domain suggestion, use api.<my-domain> later, but for the initial setup Railway's generated domain is enough.
```

## Extra Context

These repo details are here in case the Railway agent needs more context:

- Backend module wiring is in [apps/api/src/app.module.ts](../apps/api/src/app.module.ts)
- Health endpoint is in [apps/api/src/health/health.controller.ts](../apps/api/src/health/health.controller.ts)
- Prisma datasource config is in [apps/api/prisma/schema.prisma](../apps/api/prisma/schema.prisma)
- API Docker build and startup are in [apps/api/Dockerfile](../apps/api/Dockerfile)
- Mobile transit-only flag is in [apps/mobile/constants/features.ts](../apps/mobile/constants/features.ts)

## After Railway Setup

Once the Railway agent finishes, the mobile app should use:

- `EXPO_PUBLIC_API_URL=https://your-railway-api-domain`
- `EXPO_PUBLIC_STANDALONE_TRANSIT=true`

Those mobile values are not Railway settings. They belong in Expo EAS / mobile environment configuration.