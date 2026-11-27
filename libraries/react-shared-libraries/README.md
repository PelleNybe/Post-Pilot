# `@postpilot/react` (`react-shared-libraries`)

Shared React UI components, form primitives, client utilities, Sentry initialization helpers, and i18n translation bundles used by `apps/frontend`.

## Key Modules (`src/`)

- `form/` — Reusable form controls (`input`, `textarea`, `select`, `custom.select`, `checkbox`, `slider`, `color.picker`, `button`)
- `helpers/` — Client/SSR utilities (`is.general`, `variable.context`, `uppy.upload`, `delete.dialog`, `video.or.image`, `utc.date.render`)
- `translation/` — `i18next` configuration (`i18n.config.ts`) and 15 synchronized translation locale files under `locales/*/translation.json`
- `toaster/` & `sentry/` — Toast notifications and Sentry client/server instrumentation

## Testing

```bash
pnpm test -- libraries/react-shared-libraries
```
