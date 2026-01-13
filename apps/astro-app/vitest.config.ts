/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";
import { defaultExclude } from "vitest/config";

export default getViteConfig({
	test: {
		exclude: [...defaultExclude, "tests/e2e/**"],
	},
});
