# Timișoara App -- Tech Stack Decisions

## Frontend (Web)
- **Framework:** Next.js 14 (App Router) with TypeScript
- **Styling:** Tailwind CSS 3 + shadcn/ui components
- **Maps:** Leaflet + react-leaflet with OpenStreetMap tiles
- **State Management:** React Context + TanStack Query for server state
- **PWA:** next-pwa for service worker and offline support
- **Rationale:** Next.js provides SSR for SEO (important for tourist discovery), excellent DX, and PWA support. Tailwind + shadcn/ui gives a modern, accessible UI out of the box.

## Frontend (Mobile)
- **Framework:** React Native with Expo SDK 50+
- **Navigation:** Expo Router (file-based, mirrors Next.js patterns)
- **Maps:** react-native-maps with OpenStreetMap tiles
- **Styling:** NativeWind (Tailwind for React Native)
- **Rationale:** React Native + Expo shares React knowledge with the web team. Expo simplifies builds and deployments. NativeWind keeps styling consistent with the web app.

## Backend
- **Framework:** NestJS with TypeScript
- **ORM:** Prisma (type-safe, excellent DX, migrations)
- **Database:** PostgreSQL 16
- **Cache:** Redis for frequently accessed data (POIs, schedules)
- **Search:** PostgreSQL full-text search (MVP), migrate to Meilisearch if needed
- **Auth:** Passport.js with JWT tokens (access + refresh)
- **API Style:** REST with OpenAPI/Swagger documentation
- **Rationale:** NestJS is modular, well-structured, and TypeScript-native. Prisma provides type-safe database access. PostgreSQL handles geospatial queries natively with PostGIS.

## Infrastructure
- **Containerization:** Docker + Docker Compose for local development
- **Maps Provider:** OpenStreetMap (free, excellent Timișoara coverage)
- **Weather API:** OpenWeatherMap (free tier: 1000 calls/day)
- **Hosting:** To be decided (options: Vercel for web, Railway/Render for backend, or full AWS/EU provider)
- **CI/CD:** GitHub Actions

## Monorepo Structure
```
timisoara-app/
├── apps/
│   ├── web/          # Next.js web app
│   ├── mobile/       # Expo React Native app
│   └── api/          # NestJS backend
├── packages/
│   └── shared/       # Shared types, utilities, constants
├── docs/             # Documentation
├── docker-compose.yml
└── package.json      # Workspace root (npm workspaces)
```
