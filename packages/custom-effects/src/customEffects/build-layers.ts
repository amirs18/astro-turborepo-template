import { NodeSdk, OtlpLogger, OtlpMetrics } from "@effect/opentelemetry";
import { NodeHttpClient } from "@effect/platform-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { CustomEffects } from "@repo/custom-effects";
import { Effect, Layer, Logger, LogLevel } from "effect";

const catchPrintAndRethrow = Effect.catchAll((e) =>
	Effect.gen(function* () {
		yield* CustomEffects.logError({
			message: `Error in buildLayers: ${e}`,
		});
		return yield* Effect.fail(e);
	}),
);

interface BuildLayersEnv {
	GRAFANA_OTEL_EXPORTER_OTLP_TOKEN: string;
	GRAFANA_OTEL_COLLECTOR_URL: string;
	OTEL_SERVICE_NAME: string;
}
const OTEL_TIMEOUT_MS = 500;
export const buildLayers = ({
	GRAFANA_OTEL_EXPORTER_OTLP_TOKEN,
	GRAFANA_OTEL_COLLECTOR_URL,
	OTEL_SERVICE_NAME,
}: BuildLayersEnv) => {
	const serviceName = OTEL_SERVICE_NAME;
	const headers = {
		Authorization: `Basic ${GRAFANA_OTEL_EXPORTER_OTLP_TOKEN}`,
	};
	const metricsLive = createOtlpMetricsLayer(
		GRAFANA_OTEL_COLLECTOR_URL,
		headers,
		serviceName,
	);
	const NodeSdkLive = createNodeSdkLayer(
		serviceName,
		GRAFANA_OTEL_COLLECTOR_URL,
		headers,
	);
	const LoggerLive = createOtlpLogger(
		GRAFANA_OTEL_COLLECTOR_URL,
		headers,
		serviceName,
	);
	return [
		Logger.withMinimumLogLevel(LogLevel.Debug),
		catchPrintAndRethrow,
		Effect.provide(
			Layer.mergeAll(Logger.addScoped(LoggerLive), metricsLive, NodeSdkLive),
		),
		Effect.provide(NodeHttpClient.layer),
	] as const;
};

function createOtlpMetricsLayer(
	GRAFANA_OTEL_COLLECTOR_URL: string,
	headers: { Authorization: string },
	serviceName: string,
) {
	return OtlpMetrics.layer({
		url: `${GRAFANA_OTEL_COLLECTOR_URL}/v1/metrics`,
		headers,
		resource: { serviceName },
		exportInterval: 1000,
		shutdownTimeout: OTEL_TIMEOUT_MS,
	});
}

function createNodeSdkLayer(
	serviceName: string,
	GRAFANA_OTEL_COLLECTOR_URL: string,
	headers: { Authorization: string },
) {
	return NodeSdk.layer(() => ({
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
}

function createOtlpLogger(
	GRAFANA_OTEL_COLLECTOR_URL: string,
	headers: { Authorization: string },
	serviceName: string,
) {
	return OtlpLogger.make({
		url: `${GRAFANA_OTEL_COLLECTOR_URL}/v1/logs`,
		headers,
		resource: { serviceName },
		shutdownTimeout: OTEL_TIMEOUT_MS,
	});
}
