# Astro app on Bun

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm build
pnpm test:runtime
pnpm --filter unseal-astro preview
```

Requires Bun >=1.3.14, Node >=22.12.0, and pnpm 12.11.2. The official `@astrojs/node` standalone adapter generates a Node-compatible server that runs under Bun. Development and builds also use Bun.

Production defaults to port 8080. Override the listener with `HOST` and `PORT`:

```sh
HOST=0.0.0.0 PORT=8085 pnpm start:prod
```

Set `GRAFANA_OTEL_EXPORTER_OTLP_TOKEN` at runtime for analytics actions; an empty string is accepted for a local unauthenticated collector. `GRAFANA_OTEL_COLLECTOR_URL` defaults to `http://localhost:4318`, and `OTEL_SERVICE_NAME` defaults to `astro-app`.

See the [root README](../../README.md) for the shared packages, test commands, and migration details.
