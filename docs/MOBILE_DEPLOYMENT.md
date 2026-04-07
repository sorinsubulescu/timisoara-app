# Mobile Deployment

This is the recommended first production setup for the mobile app only:

- Expo EAS for Android and iOS builds
- Railway for the NestJS API
- Railway PostgreSQL for the production database
- Cloudflare for DNS and TLS in front of the API domain

This setup keeps operations light and gives you the simplest managed deployment path.

Important security note:

- You cannot make a public mobile API truly callable only by your mobile app.
- Any endpoint the shipped app can call is still a public internet endpoint.
- The correct mitigation is to expose only the endpoints the app needs and require auth for anything sensitive.
- For this transit-only deployment, the API should run with only transit and health routes mounted.
- In transit-only mode, non-`GET` requests are also rejected globally as a second safety layer.

## Recommended Architecture

- Mobile clients call `https://api.your-domain.ro`
- `api.your-domain.ro` points to Railway
- Railway runs the API from `apps/api`
- Railway runs PostgreSQL in the same project
- The API uses Railway private networking to reach the database

## Why This Setup

- Expo EAS is the normal managed path for shipping Expo apps
- Railway is the simplest managed home for both the API and the database
- Redis is not required for production today in this repo

## Services You Need

1. Expo account
2. Railway account
3. Cloudflare account
4. Apple Developer account for iOS distribution
5. Google Play Console account for Android store release

## 1. Create the Railway Project

Create one Railway project with two services:

- `api`: deploy from `apps/api`
- `Postgres`: Railway PostgreSQL service

Recommended Railway region:

- `EU West Metal` (Amsterdam)

This repo is prepared to keep Prisma happy with both `DATABASE_URL` and `DIRECT_URL` in [apps/api/prisma/schema.prisma](../apps/api/prisma/schema.prisma).

Example production env file: [apps/api/.env.production.example](../apps/api/.env.production.example)

## 2. Add Railway PostgreSQL

On the Railway project canvas, add a PostgreSQL database service.

Railway will expose these service variables from the database service:

- `PGHOST`
- `PGPORT`
- `PGUSER`
- `PGPASSWORD`
- `PGDATABASE`
- `DATABASE_URL`

For this repo, the simplest production setup is to set both API variables from the database service `DATABASE_URL` reference.

If your Railway Postgres service is named `Postgres`, set on the API service:

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
DIRECT_URL=${{Postgres.DATABASE_URL}}
PORT=4000
NODE_ENV=production
CORS_ORIGIN=https://your-domain.ro
TRANSIT_ONLY_API=true
ENABLE_SWAGGER=false
```

## 3. Deploy the API to Railway

Deploy the API service from `apps/api`.

Recommended Railway settings:

- Region: `EU West Metal` (Amsterdam)
- Root directory: `apps/api`
- Builder: Dockerfile autodetect
- Health check path: `/api/health`
- Port: `4000`

Set these Railway variables:

- `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- `DIRECT_URL=${{Postgres.DATABASE_URL}}`
- `PORT=4000`
- `NODE_ENV=production`
- `CORS_ORIGIN=https://your-domain.ro`
- `TRANSIT_ONLY_API=true`
- `ENABLE_SWAGGER=false`

Notes:

- For a native mobile app, CORS is mostly irrelevant because browsers enforce it, not iOS/Android native fetch.
- The API container already runs Prisma migrations on startup through [apps/api/Dockerfile](../apps/api/Dockerfile).
- The health endpoint is available at [apps/api/src/health/health.controller.ts](../apps/api/src/health/health.controller.ts).
- If you rename the database service, update the `${{Postgres.DATABASE_URL}}` reference to match the actual Railway service name.
- `TRANSIT_ONLY_API=true` removes the write-focused modules from the mounted API in production.
- In production, transit-only mode is the default unless `TRANSIT_ONLY_API=false` is set explicitly.
- `ENABLE_SWAGGER=false` avoids publishing the API docs in production.

After deployment, verify:

```bash
curl https://api.your-domain.ro/api/health
```

Expected shape:

```json
{
  "status": "ok",
  "service": "timisoara-app-api"
}
```

Before adding Cloudflare, you can test the generated Railway public domain first and only add the custom domain once the API is healthy.

## 4. Put the API Behind Your Domain

In Cloudflare:

1. Add your domain
2. Create a proxied `CNAME` for `api`
3. Point it at the Railway hostname for the API service
4. Keep SSL enabled

Use a final URL such as:

```text
https://api.your-domain.ro
```

## 5. Configure Expo EAS

This repo now includes [apps/mobile/eas.json](../apps/mobile/eas.json) with two profiles:

- `preview`: internal testing builds, Android produces an installable APK
- `production`: store-ready builds

Production mobile env example: [apps/mobile/.env.production.example](../apps/mobile/.env.production.example)

From `apps/mobile`:

```bash
npx eas login
npx eas init
```

Then set the production API URL for EAS builds:

```bash
npx eas env:create --name EXPO_PUBLIC_API_URL --value https://api.your-domain.ro --environment production
```

Enable transit-only mode for the mobile release:

```bash
npx eas env:create --name EXPO_PUBLIC_STANDALONE_TRANSIT --value true --environment production
```

If you want a separate preview API, point it to the same Railway API first and split later only if needed:

```bash
npx eas env:create --name EXPO_PUBLIC_API_URL --value https://api.your-domain.ro --environment preview
```

And keep preview in transit-only mode too if you are shipping only the transit experience:

```bash
npx eas env:create --name EXPO_PUBLIC_STANDALONE_TRANSIT --value true --environment preview
```

## 6. Build Test Versions

Android preview APK:

```bash
cd apps/mobile
npx eas build --platform android --profile preview
```

iOS internal build:

```bash
cd apps/mobile
npx eas build --platform ios --profile preview
```

Notes:

- Android preview builds are easiest to distribute first
- iOS internal builds require Apple signing and device/tester provisioning

## 7. Build Store Versions

Android production bundle:

```bash
cd apps/mobile
npx eas build --platform android --profile production
```

iOS production build:

```bash
cd apps/mobile
npx eas build --platform ios --profile production
```

Then submit manually in the stores, or add EAS Submit later.

## Launch Checklist

1. Railway Postgres created
2. Railway API deployed and healthy
3. Domain and TLS working on `api.your-domain.ro`
4. `EXPO_PUBLIC_API_URL` set in EAS
5. Android preview build installed on a real device
6. Basic API flows tested against production API
7. Production Android and iOS builds generated

## Recommended First Rollout

Start with this order:

1. Add Railway Postgres
2. Deploy Railway API
3. Test the API with curl on the Railway domain
4. Add the custom domain in Cloudflare
5. Build an Android preview APK with EAS
6. Test on 2-3 real devices
7. Generate production Android and iOS builds

## Railway Service Layout

Use this layout in Railway:

1. Service `Postgres`: managed PostgreSQL database
2. Service `api`: deploys from `apps/api`

That is enough for the current mobile-only release.