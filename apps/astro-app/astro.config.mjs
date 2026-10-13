// @ts-check

import node from "@astrojs/node";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
	output: "server",
	vite: {
		plugins: [tailwindcss()],
	},
	adapter: node({ mode: "standalone" }),
	integrations: [react(), sitemap()],
});
