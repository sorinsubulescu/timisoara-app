# Timișoara App

All-in-one city super-app for Timișoara, Romania -- serving both locals and tourists.

## Features (MVP)

- **Interactive Map** -- Explore points of interest across the city
- **Events Calendar** -- Discover concerts, theater, exhibitions, and festivals
- **Public Transport** -- STPT routes, schedules, and route planning
- **Dining Guide** -- Restaurants, cafes, and bars with filters and ratings
- **User Accounts** -- Save favorites, personalize your experience

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| Mobile | React Native, Expo, NativeWind |
| Backend | NestJS, Prisma, PostgreSQL |
| Maps | OpenStreetMap + Leaflet |
| Cache | In-memory TTL cache today, Redis optional later |

## Project Structure

```
timisoara-app/
├── apps/
│   ├── web/          # Next.js web app (PWA)
│   ├── api/          # NestJS backend API
│   └── mobile/       # Expo React Native app
├── packages/
│   └── shared/       # Shared types and utilities
├── docs/             # Documentation
└── docker-compose.yml
```

## Getting Started

### Prerequisites

- Node.js >= 20
- PostgreSQL 16
- Redis (optional, for caching)

### Development

```bash
# Install dependencies
npm install

# Start the API server
npm run dev:api

# Start the web app
npm run dev:web
```

### App API Configuration

Both clients are now wired for the compose-managed STPT API on `http://localhost:4000`.

- `apps/web/.env.example` configures `NEXT_PUBLIC_API_URL`
- `apps/mobile/.env.example` configures `EXPO_PUBLIC_API_URL`

For the recommended Railway-only production deployment for the mobile app, API, and database, see [docs/MOBILE_DEPLOYMENT.md](docs/MOBILE_DEPLOYMENT.md).

Example setup:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env
docker compose up -d --build api
```

For a physical phone running Expo, set `EXPO_PUBLIC_API_URL` to your Mac's LAN IP, for example `http://192.168.1.50:4000`.

### Feature Flags

You can ship a transit-only version of the app while the other sections are still in progress.

- **Web:** set `NEXT_PUBLIC_STANDALONE_TRANSIT=true`
- **Mobile:** set `EXPO_PUBLIC_STANDALONE_TRANSIT=true`
- **API:** set `TRANSIT_ONLY_API=true` to expose only transit and health endpoints

For production, the API now defaults to transit-only mode unless you explicitly set `TRANSIT_ONLY_API=false`.

When enabled:

- the web navigation only shows `Transit`
- `/`, `/events`, `/dining`, and `/profile` redirect to `/transit` on web
- the mobile app only shows the `Transit` tab
- direct mobile navigation to disabled screens redirects back to `transit`

For Docker builds, the web app reads `NEXT_PUBLIC_STANDALONE_TRANSIT` during `docker compose up --build`.

For a hardened transit-only backend deployment, disable Swagger in production with `ENABLE_SWAGGER=false`. In transit-only mode, non-`GET` requests are rejected globally as an extra safety layer.

Example:

```bash
NEXT_PUBLIC_STANDALONE_TRANSIT=true docker compose up --build web
EXPO_PUBLIC_STANDALONE_TRANSIT=true npm run start --workspace=apps/mobile
```

## License

MIT
