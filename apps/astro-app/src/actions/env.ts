import { z } from "astro:schema";
import process from "node:process";

// Read and validate server secrets at request time, including under Bun.
const telemetryEnvSchema = z.object({
	OTEL_SERVICE_NAME: z.string().default("astro-app"),
	GRAFANA_OTEL_COLLECTOR_URL: z.url().default("http://localhost:4318"),
	GRAFANA_OTEL_EXPORTER_OTLP_TOKEN: z.string(),
});

export const getTelemetryEnv = () => telemetryEnvSchema.parse(process.env);
