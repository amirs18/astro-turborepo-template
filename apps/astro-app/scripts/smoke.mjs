import assert from "node:assert/strict";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";

// Reserve an available port so the test does not require a fixed local port.
const reservation = createServer();
await new Promise((resolve) => reservation.listen(0, "127.0.0.1", resolve));
const { port } = reservation.address();
await new Promise((resolve) => reservation.close(resolve));

const signals = new Set();
const collector = Bun.serve({
	hostname: "127.0.0.1",
	port: 0,
	async fetch(request) {
		assert.equal(request.headers.get("authorization"), "Basic smoke-token");
		await request.arrayBuffer();
		signals.add(new URL(request.url).pathname);
		return Response.json({});
	},
});

const server = Bun.spawn([process.execPath, "./dist/server/entry.mjs"], {
	cwd: fileURLToPath(new URL("../", import.meta.url)),
	env: {
		...process.env,
		NODE_ENV: "production",
		HOST: "127.0.0.1",
		PORT: String(port),
		OTEL_SERVICE_NAME: "bun-smoke",
		GRAFANA_OTEL_COLLECTOR_URL: String(collector.url).replace(/\/$/, ""),
		GRAFANA_OTEL_EXPORTER_OTLP_TOKEN: "smoke-token",
	},
	stdout: "inherit",
	stderr: "inherit",
});
const base = `http://127.0.0.1:${port}`;
const request = (path, options) =>
	fetch(`${base}${path}`, {
		...options,
		signal: AbortSignal.timeout(5000),
	});
const post = (path, body) =>
	request(path, {
		method: "POST",
		headers: { "content-type": "application/json", origin: base },
		body: JSON.stringify(body),
	});

try {
	let ready = false;
	for (let attempt = 0; attempt < 100; attempt++) {
		assert.equal(
			server.exitCode,
			null,
			"Bun server exited before becoming ready",
		);
		try {
			const response = await request("/api/");
			assert.equal(response.status, 200);
			assert.equal(await response.text(), "hello, World!");
			ready = true;
			break;
		} catch {
			await Bun.sleep(100);
		}
	}
	assert.ok(ready, "Bun server startup timed out");

	const page = await request("/");
	assert.equal(page.status, 200);
	assert.match(await page.text(), /<html/);
	const asset = await request("/favicon.png");
	assert.equal(asset.status, 200);
	assert.match(asset.headers.get("content-type"), /image\/png/);

	const api = await post("/api/", { name: "Bun" });
	assert.equal(api.status, 200);
	assert.deepEqual(await api.json(), { name: "Bun" });
	assert.equal((await post("/api/", { name: 123 })).status, 422);

	const action = await post("/_actions/analytics", {
		event: "page_view",
		timestamp: Date.now(),
		attributes: { pathname: "/" },
	});
	assert.equal(action.status, 200);
	assert.match(await action.text(), /"success"/);
	for (const signal of ["/v1/logs", "/v1/metrics", "/v1/traces"]) {
		assert.ok(signals.has(signal), `Missing OTLP export: ${signal}`);
	}
	console.log(
		"Bun runtime smoke test passed: SSR, static assets, API, validation, actions, and telemetry.",
	);
} finally {
	server.kill();
	await server.exited;
	await collector.stop(true);
}
