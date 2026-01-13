import { treaty } from "@elysiajs/eden";
import { describe, expect, it } from "vitest";
import { app } from "../../src/pages/api/[...slugs]";

describe("hello-world API", () => {
	const api = treaty(app);
	it("should return 'Hello, World!'", async () => {
		const { data, error } = await api.api.get();
		expect(error).toBeNull();
		expect(data).toBe("hello, World!");
	});
});
