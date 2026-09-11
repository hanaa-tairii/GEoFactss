# GeoFacts

GeoFacts is an editorial country explorer: browse verified facts from REST Countries, compare places, and hear from the community through ratings and comments. It contains a Vite/React TypeScript frontend, an Express TypeScript API, and a Prisma PostgreSQL data layer.

## Requirements

* Node.js 24+
* PostgreSQL 14+ (local or hosted)

## Quick start

```powershell
cd GeoFacts
Copy-Item .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run import:countries
npm run dev
```

The local client runs at `http://localhost:5137`; the local API runs at `http://localhost:4000`. The published frontend URL is `https://geofactss.onrender.com`.

## Environment

For production, set `DATABASE_URL`, `NODE_ENV=production`, a unique random `JWT_SECRET` of at least 32 characters, and `CLIENT_URL` to the exact HTTPS frontend origin. Configure `TRUST_PROXY` only with the addresses or CIDRs of your real reverse proxy. The server refuses to start when `NODE_ENV` is missing or invalid, when the production secret is missing or weak, or when the production client URL is not HTTPS. See `.env.example`.

## API

* `GET /api/health`
* `GET /api/countries?search=&region=&continent=&page=`
* `GET /api/countries/:slug`
* `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
* `GET /api/countries/:slug/comments`, `POST /api/countries/:slug/comments`
* `POST /api/countries/:slug/ratings` (authenticated)

Comments intentionally support anonymous posting. Anonymous submissions are rate limited, validated, escaped by React, and tagged with a server-side fingerprint for abuse controls. Authenticated ratings are one per user and country.

## Deployment

Build with `npm run build`, run migrations with `npm run db:migrate`, and start the API with `npm run start --workspace server`. For Render, set `NODE_ENV=production`, `CLIENT_URL=https://geofactss.onrender.com`, a unique random `JWT_SECRET` of at least 32 characters, and the production `DATABASE_URL`. Configure `TRUST_PROXY` only if your deployment has a known reverse proxy address. Serve `client/dist` from a static host or CDN, keep `.env` files private, and verify that the database is not publicly exposed. Payments are deliberately not included.
