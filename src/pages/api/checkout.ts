import type { APIRoute } from "astro";
import { beginCheckout } from "@/integrations/commerce/checkout";
import { commerceConfig } from "@/integrations/commerce/config";

export const prerender = false;
export const POST: APIRoute = async ({ request }) => {
    try {
        if (!request.headers.get("content-type")?.includes("application/json")) return Response.json({ error: "JSON request required." }, { status: 415 });
        const result = await beginCheckout(commerceConfig(import.meta.env), await request.json());
        return Response.json(result, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
        const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 500;
        return Response.json({ error: error instanceof Error ? error.message : "Checkout failed." }, { status: Math.min(599, Math.max(400, status || 500)), headers: { "Cache-Control": "no-store" } });
    }
};
