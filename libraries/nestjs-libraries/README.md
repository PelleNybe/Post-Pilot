# `@postpilot/nestjs-libraries`

Shared NestJS services, Prisma repositories, social channel integrations, AI helpers, media storage adapters, billing services, and Temporal helpers used by `apps/backend`, `apps/orchestrator`, and `apps/commands`.

## Key Modules (`src/`)

- `database/prisma/` — Prisma schema, migrations, services, and repositories (`Controller >> Service >> Repository`)
- `integrations/` — `IntegrationManager`, `SocialAbstract`, `RefreshIntegrationService`, and 28+ social platform providers
- `openai/` — AI content helpers (viral hook generation, tone transformation, alt-text, video prompts)
- `services/` — Stripe billing, authentication, webhooks, and shared business services
- `upload/` — Storage adapters (LocalStorage with path safety, Cloudflare R2, AWS S3)
- `throttler/` & `emails/` — Rate limiting and email provider integrations

## Testing

```bash
pnpm test -- libraries/nestjs-libraries
```
