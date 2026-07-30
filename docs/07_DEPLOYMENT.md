# Lumora AI — Deployment & Infrastructure

This document outlines the hosting environment, continuous integration pipelines, database migration flows, and monitoring tools.

---

## 1. Hosting Providers

### Frontend: Vercel
* Hosts the Next.js 15 app.
* Global Edge Network caching for rapid visual updates.
* Automatic preview deployments for PR branches.

### Backend: Supabase
* Hosts the managed PostgreSQL database, Supabase Auth, Storage, and Realtime engine.
* Supabase Edge Functions for handling background queues and external integrations.

---

## 2. CI/CD Deployment Flow

```
[ Developer Commit ] ──► GitHub Repository
                                │
          ┌─────────────────────┴─────────────────────┐
          ▼                                           ▼
[ Vercel Build Pipeline ]                  [ Supabase Migration ]
- Runs Next.js Build                       - Apply SQL Migrations via CLI
- Lints & Typechecks TypeScript            - Updates RLS & Indexes
- Deploys static/SSR pages                 - Seed data sync
          │
          ▼
[ Production Live Environment ]
```

---

## 3. Environment Variable Checklist

These environment variables are configured in the Vercel dashboard and local `.env.local` environments.

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI Provider API Keys
CLAUDE_API_KEY=sk-ant-api03-...

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://sentry-dns-link...
SENTRY_AUTH_TOKEN=sentry-auth-token...
```

---

## 4. Database Migrations Workflow
Database updates are strictly version-controlled.
* **Creating a Migration:** Local schema changes are documented via the Supabase CLI:
  ```bash
  supabase migration new your_migration_name
  ```
* **Applying to Staging/Production:** Automated GitHub action runs migrations upon merge to `main`:
  ```bash
  supabase db push --db-url "$DATABASE_URL"
  ```

---

## 5. Performance & Telemetry Monitoring
* **Error Tracking:** **Sentry** collects all unhandled runtime errors on the client and server.
* **Performance Analysis:** **Vercel Analytics** monitors Core Web Vitals (LCP, FID, CLS) to optimize client load times.
