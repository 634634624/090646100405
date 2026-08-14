import { timingSafeEqual } from "node:crypto";
import type { APIRoute } from "astro";
import { commerceConfig } from "@/integrations/commerce/config";

export const prerender = false;
const sameSecret = (given: string, expected: string) => {
    const left = Buffer.from(given); const right = Buffer.from(expected);
    return left.length === right.length && timingSafeEqual(left, right);
};
export const POST: APIRoute = async ({ request }) => {
    const config = commerceConfig(import.meta.env);
    const expected = config.webshippy?.pushSecret;
    if (!expected || !sameSecret(request.headers.get("x-webshippy-secret") ?? "", expected)) return Response.json({ error: "Unauthorized." }, { status: 401 });
    const payload = await request.json().catch(() => null);
    if (!payload || typeof payload !== "object") return Response.json({ error: "Invalid payload." }, { status: 400 });
    return Response.json({ accepted: true });
};
