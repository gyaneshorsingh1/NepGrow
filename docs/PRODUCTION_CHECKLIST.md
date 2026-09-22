# Production preparation checklist

- [ ] Switch Prisma `provider` to `postgresql` and set production `DATABASE_URL` (see [POSTGRES_CUTOVER.md](./POSTGRES_CUTOVER.md))
- [ ] Run `npx prisma migrate deploy` (create a proper migration from SQLite prototype if needed)
- [ ] Set strong `BETTER_AUTH_SECRET` (32+ random chars)
- [ ] Configure `BETTER_AUTH_URL`, `NEXT_PUBLIC_ROOT_DOMAIN`, app/admin URLs for real hosts
- [ ] Enable HTTPS / secure cookies in production hosting
- [ ] Point DNS: apex, `admin.`, `app.`, category subdomains (`sports.`, …)
- [ ] Rotate seed admin password; disable default credentials
- [ ] Configure transactional email (Resend) for password reset / welcome
- [ ] Review tenant isolation with Playwright isolation suite
- [ ] Enable backups for PostgreSQL
- [ ] Set up error monitoring (e.g. Sentry) if required
- [ ] Replace in-memory rate limiter with Redis for multi-instance deploys
