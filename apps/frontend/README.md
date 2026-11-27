# PostPilot Frontend

This is the [Next.js](https://nextjs.org) App Router web application for PostPilot.

## Getting Started

Run commands from the repository root using `pnpm`:

```bash
# Install all workspace dependencies
pnpm install

# Start the frontend in development mode (http://localhost:4200)
pnpm run dev:frontend

# Or start frontend + backend + orchestrator together
pnpm run dev
```

Open [http://localhost:4200](http://localhost:4200) in your browser once running.

## Architecture & Conventions

- **Routing:** App Router pages and route handlers live under `src/app/` (e.g., `(app)/(site)/launches`, `(app)/(site)/analytics`, `(app)/(site)/billing`, `(app)/(preview)/p/[id]`).
- **Components:** Reusable UI building blocks live in `src/components/`.
- **Styling:** Tailwind CSS configuration is in `tailwind.config.js` alongside theme variables in `src/app/colors.scss` and `src/app/global.scss`. Avoid deprecated `--color-custom*` variables in new code.
- **Data Fetching:** Use `useSWR` with dedicated custom hooks and `useFetch` from `@postpilot/helpers/utils/custom.fetch`.
- **Internationalization:** Translation strings live in `libraries/react-shared-libraries/src/translation/locales/`.

## Building & Testing

```bash
# Production build
pnpm run build:frontend

# Run frontend unit tests from repository root
pnpm test -- apps/frontend
```
