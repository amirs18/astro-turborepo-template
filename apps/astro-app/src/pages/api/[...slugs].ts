// pages/api/[...slugs].ts
import { openapi } from "@elysiajs/openapi";
import { Elysia, t } from "elysia";

export const prerender = false;

export const app = new Elysia({ prefix: "/api" })
	.use(openapi())
	.get("/", () => "hello, World!")
	.post("/", ({ body }) => body, {
		body: t.Object({
			name: t.String(),
		}),
	});

const handle = ({ request }: { request: Request }) => app.handle(request);

export const GET = handle;
export const POST = handle;
