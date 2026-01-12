import { defineAction } from "astro:actions";
import { AnalyticsEventDTOSchema } from "@repo/types/analitics-event-dtos";
import { Effect } from "effect";
import { analyticsEventEffect } from "./effects";
import { buildLayers } from "./effects/build-layers";

// Set up tracing with the OpenTelemetry SDK

export const server = {
	analytics: defineAction({
		input: AnalyticsEventDTOSchema,
		handler: async (data, { request }) => {
			const userAgent = request?.headers?.get("user-agent") ?? undefined;
			const attributes = { ...(data.attributes ?? {}), userAgent };
			const payload = { ...data, attributes };
			const _res = await Effect.runPromise(
				analyticsEventEffect(payload).pipe(buildLayers),
			);
			// Return success - PostHog tracking happens client-side
			return { success: true };
		},
	}),
};
