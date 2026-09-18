# PostgreSQL cutover

Local development stays on **SQLite** (`prisma/schema.prisma` → `provider = "sqlite"`, `DATABASE_URL="file:./dev.db"`). Use this guide when you are ready to run Postgres (Docker is recommended but not required).

`better-auth` already picks the adapter from `DATABASE_URL` in `src/lib/auth/auth.ts` (`postgresql` vs `sqlite`).

## Prerequisites

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) **or** a local PostgreSQL 16+ server.
2. Ensure port `5432` is free (or change the compose mapping / connection string).

## 1. Start Postgres

### Option A — Docker Compose (repo root)

```bash
docker compose up -d
```

This starts `postgres:16-alpine` with:

- user / password: `postgres` / `postgres`
- database: `nepgrow`
- port: `5432`

### Option B — Native Postgres

Create a database named `nepgrow` and a user with access to it.

## 2. Point the app at Postgres

In `.env` (copy from `.env.example` if needed):

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nepgrow?schema=public"
```

Optional email (Resend) for password reset / verification:

```env
RESEND_API_KEY="re_..."
EMAIL_FROM="NepGrow <noreply@yourdomain.com>"
```

Without `RESEND_API_KEY`, emails log to the console in development.

## 3. Switch Prisma provider

**Keep SQLite for day-to-day local work.** Only do this when cutting over:

1. Open `prisma/schema.prisma`.
2. Change:

   ```prisma
   provider = "sqlite"
   ```

   to:

   ```prisma
   provider = "postgresql"
   ```

   Or replace `prisma/schema.prisma` with the ready copy:

   ```bash
   # PowerShell
   Copy-Item prisma/schema.postgres.prisma prisma/schema.prisma -Force

   # bash
   cp prisma/schema.postgres.prisma prisma/schema.prisma
   ```

   (`prisma/schema.postgres.prisma` is maintained as a postgresql-ready twin of the current schema.)

## 4. Push schema and seed

```bash
npx prisma generate
npx prisma db push
npm run db:seed
npm run db:seed:demo
```

For production later, prefer migrations (`prisma migrate deploy`) instead of `db push`.

## 5. Verify

```bash
npm run dev
```

- Admin: `admin@nepgrow.com` / `password`
- Owner: `owner@gmail.com` / `password`

Auth should work without code changes — the Better Auth Prisma adapter auto-detects a `postgres` / `postgresql` URL.

## Switching back to SQLite

1. Set `DATABASE_URL="file:./dev.db"` in `.env`.
2. Set `provider = "sqlite"` in `prisma/schema.prisma` (do **not** leave the postgres copy active).
3. `npx prisma generate && npx prisma db push` (and re-seed if needed).

## Related

- `docker-compose.yml` — local Postgres service
- `docs/PRODUCTION_CHECKLIST.md` — broader production checklist
- `npm run db:docs` — prints a pointer to this file
