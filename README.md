# Astro Turborepo template

Astro SSR on Bun, with React, Tailwind CSS, Elysia APIs, and Effect/OpenTelemetry analytics in a pnpm workspace.

## Requirements

- Node.js >=22.12.0 (Node 24 LTS recommended)
- pnpm 12.11.2 (`corepack enable` uses the version in `package.json`)
- Bun >=1.3.14 for development, builds, and production

## Getting started

```sh
pnpm install --frozen-lockfile
pnpm dev
```

The app is in `apps/astro-app`. Shared packages are `@repo/ui`, `@repo/types`, `@repo/custom-effects`, and `@repo/typescript-config`.

## Checks and production

```sh
pnpm lint
pnpm check-types
pnpm test
pnpm test:runtime
pnpm build
pnpm --filter unseal-astro preview
```

Development uses port 4321; production preview uses port 8080. Set `HOST` and `PORT` to override the production listener. `pnpm start:prod` builds and starts the app under Bun. pnpm remains the workspace package manager; Vitest and TypeScript run with Node, while the Astro CLI and production server run with Bun.

`pnpm test:runtime` builds the app and launches its real production entrypoint under Bun on an available port. It checks SSR, static assets, GET/POST APIs, validation, analytics actions, and OTLP logs, metrics, and traces against a local collector.

Configure server telemetry environment variables before running production:

| Variable | Default |
| --- | --- |
| `OTEL_SERVICE_NAME` | `astro-app` |
| `GRAFANA_OTEL_COLLECTOR_URL` | `http://localhost:4318` |
| `GRAFANA_OTEL_EXPORTER_OTLP_TOKEN` | Required; use an empty string for an unauthenticated local collector |

Secrets are validated at request time and never embedded in client bundles. For local development, export these variables in your shell. Add your production URL as the `site` option in `apps/astro-app/astro.config.mjs` to enable sitemap generation; without it Astro emits a warning and skips the sitemap.

## Dependency migration

All direct registry dependencies are updated to their latest stable releases, including Astro 7, React 19.3, Effect 4, TypeScript 7, Vitest 5, Lucide 1, Nanostores React 2, and ESLint 10. The pnpm lockfile is refreshed; the obsolete Deno lockfile is removed.

Breaking-change adjustments:

- Astro/Bun: use the official `@astrojs/node` adapter in standalone mode with server output. Bun runs the Astro CLI and `dist/server/entry.mjs` using its Node compatibility layer. Deno is no longer required. Server secrets are validated through `node:process` at request time.
- Shared schemas: use Zod 4 directly instead of Astro's virtual schema module, allowing standalone type checking.
- Effect 4: migrate log severity names, curried logging, error recovery, spans, and minimum log level. OTLP logs/metrics now come from `effect/observability`, with explicit JSON serialization and the fetch HTTP client; tracing retains the OpenTelemetry Node SDK.
- Remove the unused Effect 3-only `@effect/platform` dependency and the existing export of a nonexistent action module.
- pnpm 12: migrate build-script permissions to `allowBuilds`. Exact-version release-age exceptions permit this upgrade's fresh releases without disabling the age policy for other packages.
- Override Elysia's transitive `file-type` dependency to 22.1.1 to avoid known parser denial-of-service vulnerabilities.
- Wire every source package into Turborepo type checking and add a root test task.
