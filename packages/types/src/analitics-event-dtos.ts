import { z } from "astro:schema";

// Predefined event names — add more literal values here when needed
export const AnalyticsEventNameOptionsSchema = z.enum(["hi"]); // Add more predefined event names as needed

// Allow either a predefined literal or any other string
export const AnalyticsEventNameSchema = z.union([AnalyticsEventNameOptionsSchema, z.string()]);

export const AnalyticsEventDTOSchema = z.object({
  event: AnalyticsEventNameSchema,
  timestamp: z.number(),
  sessionId: z.string().optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
});

export type AnalyticsEventDTO = z.infer<typeof AnalyticsEventDTOSchema>;