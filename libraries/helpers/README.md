# `@postpilot/helpers`

Shared framework-agnostic utilities used across PostPilot backend, orchestrator, and frontend workspaces.

## Key Modules (`src/`)

- `auth/` — JWT signing/verification (`HS256` with expiration) and AES-256-GCM encryption/decryption helpers (`AuthService`)
- `utils/` — `validateUrlForSSRF` SSRF defense, `custom.fetch` (`useFetch`), post list minification (`posts.list.minify`), markdown stripping (`remove.markdown`), and image validation (`valid.images`)

## Testing

```bash
pnpm test -- libraries/helpers
```
