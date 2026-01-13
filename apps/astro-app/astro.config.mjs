// @ts-check

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import deno from "@deno/astro-adapter";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField } from "astro/config";

// https://astro.build/config
export default defineConfig({
	vite: {
		plugins: [tailwindcss()],
	},
	env: {
		schema: {
			OTEL_SERVICE_NAME: envField.string({
				default: "astro-app",
				access: "secret",
				context: "server",
			}),
			GRAFANA_OTEL_COLLECTOR_URL: envField.string({
				default: "http://localhost:4318",
				access: "secret",
				context: "server",
			}),
			GRAFANA_OTEL_EXPORTER_OTLP_TOKEN: envField.string({
				access: "secret",
				context: "server",
			}),
		},
	},
	adapter: deno(),
	integrations: [react(), sitemap()],
});
