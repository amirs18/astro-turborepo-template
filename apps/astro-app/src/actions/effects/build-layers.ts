import {
	GRAFANA_OTEL_COLLECTOR_URL,
	GRAFANA_OTEL_EXPORTER_OTLP_TOKEN,
	OTEL_SERVICE_NAME,
} from "astro:env/server";
import { NodeSdk, OtlpLogger, OtlpMetrics } from "@effect/opentelemetry";
import { NodeHttpClient } from "@effect/platform-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { CustomEffects } from "@repo/custom-effects";
import { Effect, Layer, Logger, LogLevel } from "effect";

const serviceName = OTEL_SERVICE_NAME;
const headers = { Authorization: `Basic ${GRAFANA_OTEL_EXPORTER_OTLP_TOKEN}` };
const OTEL_TIMEOUT_MS = 500;

const metricsLive = OtlpMetrics.layer({
	url: `${GRAFANA_OTEL_COLLECTOR_URL}/v1/metrics`,
	headers,
	resource: { serviceName },
	exportInterval: 1000,
	shutdownTimeout: OTEL_TIMEOUT_MS,
});

const NodeSdkLive = NodeSdk.layer(() => ({
	resource: { serviceName },
	// Export span data to the console

	spanProcessor: new BatchSpanProcessor(
		new OTLPTraceExporter({
			url: `${GRAFANA_OTEL_COLLECTOR_URL}/v1/traces`,
			headers,
		}),
	),
	shutdownTimeout: OTEL_TIMEOUT_MS,
}));

const LoggerLive = OtlpLogger.make({
	url: `${GRAFANA_OTEL_COLLECTOR_URL}/v1/logs`,
	headers,
	resource: { serviceName },
	shutdownTimeout: OTEL_TIMEOUT_MS,
});

const catchPrintAndRethrow = <A, E, R>(effect: Effect.Effect<R, E, A>) => {
	return effect.pipe(
		Effect.catchAll((e) =>
			Effect.gen(function* () {
				yield* CustomEffects.logError({
					message: `Error in buildLayers: ${e}`,
				});
				return yield* Effect.fail(e);
			}),
		),
	);
};

export const buildLayers = <A, E, R>(effect: Effect.Effect<A, E, R>) => {
	return effect.pipe(
		Logger.withMinimumLogLevel(LogLevel.Debug),
		catchPrintAndRethrow,
		Effect.provide(
			Layer.mergeAll(Logger.addScoped(LoggerLive), metricsLive, NodeSdkLive),
		),
		Effect.provide(NodeHttpClient.layer),
	);
};
