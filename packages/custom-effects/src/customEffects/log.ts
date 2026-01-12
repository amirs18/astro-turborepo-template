import { Effect, LogLevel } from "effect";

export const CustomLog = (
	level: LogLevel.Literal,
	message: { message: string; [key: string]: unknown },
) => {
	return Effect.logWithLevel(LogLevel.fromLiteral(level), message);
};

export const logDebug = (message: {
	message: string;
	[key: string]: unknown;
}) => {
	return CustomLog("Debug", message);
};

export const logInfo = (message: {
	message: string;
	[key: string]: unknown;
}) => {
	return CustomLog("Info", message);
};

export const logWarning = (message: {
	message: string;
	[key: string]: unknown;
}) => {
	return CustomLog("Warning", message);
};

export const logError = (message: {
	message: string;
	[key: string]: unknown;
}) => {
	return CustomLog("Error", message);
};
