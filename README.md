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
| Cache | Redis |

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

### Feature Flags

You can ship a transit-only version of the app while the other sections are still in progress.

- **Web:** set `NEXT_PUBLIC_STANDALONE_TRANSIT=true`
- **Mobile:** set `EXPO_PUBLIC_STANDALONE_TRANSIT=true`

When enabled:

- the web navigation only shows `Transit`
- `/`, `/events`, `/dining`, and `/profile` redirect to `/transit` on web
- the mobile app only shows the `Transit` tab
- direct mobile navigation to disabled screens redirects back to `transit`

For Docker builds, the web app reads `NEXT_PUBLIC_STANDALONE_TRANSIT` during `docker compose up --build`.

Example:

```bash
NEXT_PUBLIC_STANDALONE_TRANSIT=true docker compose up --build web
EXPO_PUBLIC_STANDALONE_TRANSIT=true npm run start --workspace=apps/mobile
```

## License

MIT
