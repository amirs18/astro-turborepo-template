import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { CustomEffects } from "@repo/custom-effects";
import { AnalyticsEventDTOSchema } from "@repo/types/analitics-event-dtos";
import { Effect } from "effect";
import { afterEach, describe, expect, it, vi } from "vitest";
import { analyticsEventEffect } from "../src/actions/effects/analitics-event";
import { getTelemetryEnv } from "../src/actions/env";

afterEach(() => {
	vi.unstubAllEnvs();
	vi.unstubAllGlobals();
});

describe("analytics migrations", () => {
	it("validates the shared Zod 4 action schema", () => {
		expect(
			AnalyticsEventDTOSchema.parse({
				event: "page_view",
				timestamp: 123,
				attributes: { pathname: "/" },
			}),
		).toEqual({
			event: "page_view",
			timestamp: 123,
			attributes: { pathname: "/" },
		});
		expect(
			AnalyticsEventDTOSchema.safeParse({
				event: "page_view",
				timestamp: "bad",
			}).success,
		).toBe(false);
	});

	it("reads telemetry secrets at runtime, not build time", () => {
		vi.stubEnv("OTEL_SERVICE_NAME", undefined);
		vi.stubEnv("GRAFANA_OTEL_COLLECTOR_URL", undefined);
		vi.stubEnv("GRAFANA_OTEL_EXPORTER_OTLP_TOKEN", "test-token");
		expect(getTelemetryEnv()).toEqual({
			OTEL_SERVICE_NAME: "astro-app",
			GRAFANA_OTEL_COLLECTOR_URL: "http://localhost:4318",
			GRAFANA_OTEL_EXPORTER_OTLP_TOKEN: "test-token",
		});
		vi.stubEnv("GRAFANA_OTEL_EXPORTER_OTLP_TOKEN", undefined);
		expect(() => getTelemetryEnv()).toThrow();
	});

	it("runs Effect 4 analytics and flushes OTLP logs and traces", async () => {
		const requests: {
			url: string | undefined;
			authorization: string | undefined;
		}[] = [];
		const collector = createServer((request, response) => {
			requests.push({
				url: request.url,
				authorization: request.headers.authorization,
			});
			request.resume();
			response.writeHead(200, { "content-type": "application/json" });
			response.end("{}");
		});
		await new Promise<void>((resolve) =>
			collector.listen(0, "127.0.0.1", resolve),
		);
		const { port } = collector.address() as AddressInfo;
		try {
			await Effect.runPromise(
				analyticsEventEffect({ event: "page_view", timestamp: 123 }).pipe(
					...CustomEffects.buildLayers({
						OTEL_SERVICE_NAME: "test",
						GRAFANA_OTEL_COLLECTOR_URL: `http://127.0.0.1:${port}`,
						GRAFANA_OTEL_EXPORTER_OTLP_TOKEN: "test-token",
					}),
				),
			);
			const urls = requests.map(({ url }) => url);
			expect(urls).toContain("/v1/logs");
			expect(urls).toContain("/v1/traces");
			expect(urls).toContain("/v1/metrics");
			expect(
				requests.every(
					({ authorization }) => authorization === "Basic test-token",
				),
			).toBe(true);
		} finally {
			await new Promise<void>((resolve, reject) =>
				collector.close((error) => (error ? reject(error) : resolve())),
			);
		}
	});
});
