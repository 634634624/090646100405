import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { handleShopifyCancelledWebhook } from "@/integrations/commerce/shopify-paid-webhook";

export const prerender = false;

const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
};

function json(body: Record<string, unknown>, status = 200) {
    return Response.json(body, { status, headers });
}

export const POST: APIRoute = ({ request }) => handleShopifyCancelledWebhook(request, env);

export const ALL: APIRoute = () => json({ error: "Method not allowed." }, 405);
