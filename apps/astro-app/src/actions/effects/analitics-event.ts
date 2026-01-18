import { CustomEffects } from "@repo/custom-effects";
import type { AnalyticsEventDTO } from "@repo/types/analitics-event-dtos";
import { Effect } from "effect";

export const analyticsEventEffect = Effect.functionWithSpan({
	body: (data: AnalyticsEventDTO) =>
		Effect.gen(function* () {
			yield* CustomEffects.logDebug({
				message: "Processing analytics event",
				...data,
			});
		}),
	options: (data) => ({
		name: "analytics-event",
		attributes: { data },
	}),
})
