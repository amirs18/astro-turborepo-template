import { defineAction } from "astro:actions";
import * as env from "astro:env/server";
import { AnalyticsEventDTOSchema } from "@repo/types/analitics-event-dtos";
import { Effect } from "effect";
import { analyticsEventEffect } from "./effects";
import { CustomEffects } from "@repo/custom-effects";

export const analyticsActions = {
	analytics: defineAction({
		input: AnalyticsEventDTOSchema,
		handler: async (data, { request }) => {
			const userAgent = request?.headers?.get("user-agent") ?? undefined;
			const attributes = { ...(data.attributes ?? {}), userAgent };
			const payload = { ...data, attributes };
			const _res = await Effect.runPromise(
				analyticsEventEffect(payload).pipe(
					...CustomEffects.buildLayers(env),
				),
			);
			// Return success - PostHog tracking happens client-side
			return { success: true };
		},
	}),
};
