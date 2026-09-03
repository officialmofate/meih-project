# Deploy MEIH to Dokploy

The project ships with everything needed to deploy with **one** service that serves
both the backend API and the frontend from a single container.

## What's included

| File | Purpose |
|------|---------|
| `Dockerfile` | Builds the app container (Node 20, backend + frontend) |
| `docker-compose.yml` | App + Postgres + Redis in one stack |
| `.env.example` | Template of all environment variables |
| `.dockerignore` | Keeps build context clean (excludes `node_modules`, `.env`, secrets) |

## Option A — Docker Compose stack (recommended, includes database)

Use this if you want Dokploy to run Postgres + Redis alongside the app automatically.

1. **Connect your repo** in Dokploy (the `officialmofate/meih-project` repo).
2. **Build type:** select **Docker Compose** and point it at `docker-compose.yml`.
3. **Environment variables** (set in Dokploy → Environment):
   - `JWT_SECRET` — required (generate with `openssl rand -base64 32`)
   - `POSTGRES_PASSWORD` — set your own strong DB password
   - `FRONTEND_URL` — set to your public domain, e.g. `https://app.yourdomain.com`
   - `CORS_ORIGINS` — optional extra comma-separated origins
   - `GEMINI_API_KEY`, `SMTP_*` — optional
4. Deploy. The stack starts Postgres → Redis → app.

The app listens on **port 3000** inside the container. In Dokploy, map a domain/port
to the `app` service's port `3000`.

## Option B — Single Dockerfile service (external database)

Use this if you already have a Postgres database (e.g. Supabase) and don't want the
compose Postgres.

1. Connect your repo; **Build type:** **Dockerfile** (root `Dockerfile`).
2. Copy `meih/database/supabase_full_schema.sql` or run the migrations in
   `meih/database/migrations/` against your database.
3. **Environment variables:**
   - `DATABASE_URL` — your external Postgres connection string
   - `JWT_SECRET`, `JWT_REFRESH_SECRET`
   - `FRONTEND_URL`, `CORS_ORIGINS`
   - Optional: `GEMINI_API_KEY`, `SMTP_*`, `REDIS_URL`
4. Deploy. Assign a domain to port `3000`.

## Notes

- **Frontend + API are the same container.** The frontend uses relative URLs
  (`/api/v1`, `/uploads/...`), so it works on any domain with no extra config.
- **Health check:** `GET /health` (Dockerfile has a built-in HEALTHCHECK).
- **Superadmin login:** email `sylivesteryakobo@gmail.com`, password blank
  (passwordless). Seed scripts in `meih/database/*.sql` create it on first run.
- **Uploads:** stored in the container's `meih/backend/uploads/` directory
  (ephemeral). For persistent uploads across restarts, add a volume for
  `/app/meih/backend/uploads` in Dokploy.
