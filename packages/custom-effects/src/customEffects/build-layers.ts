import { NodeSdk } from "@effect/opentelemetry";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { CustomEffects } from "@repo/custom-effects";
import { Effect, Layer, References } from "effect";
import { FetchHttpClient } from "effect/http";
import {
	OtlpLogger,
	OtlpMetrics,
	OtlpSerialization,
} from "effect/observability";

const catchPrintAndRethrow = Effect.catch((e) =>
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
		Effect.provideService(References.MinimumLogLevel, "Debug"),
		catchPrintAndRethrow,
		Effect.provide(
			Layer.mergeAll(LoggerLive, metricsLive, NodeSdkLive).pipe(
				Layer.provide(OtlpSerialization.layerJson),
			),
		),
		Effect.provide(FetchHttpClient.layer),
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
	return OtlpLogger.layer({
		url: `${GRAFANA_OTEL_COLLECTOR_URL}/v1/logs`,
		headers,
		resource: { serviceName },
		shutdownTimeout: OTEL_TIMEOUT_MS,
	});
}
