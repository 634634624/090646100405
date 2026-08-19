import type { APIRoute } from "astro";
import {
    applyShopifyCatalog,
    catalogRequest,
    checkoutRequest,
    checkoutUrlFromResponse,
    SHOPIFY_UCP_ENDPOINT,
    unavailableCatalog,
    validateCheckoutLines,
} from "@/integrations/commerce/shopify-ucp";
import { MOCK_PRODUCTS } from "@/data/demo-catalog";

export const prerender = false;

const jsonHeaders = { "Content-Type": "application/json; charset=utf-8" };

async function shopify(body: unknown) {
    const response = await fetch(SHOPIFY_UCP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`Shopify HTTP ${response.status}`);
    return response.json() as Promise<unknown>;
}

export const GET: APIRoute = async () => {
    try {
        const payload = await shopify(catalogRequest());
        const products = applyShopifyCatalog(MOCK_PRODUCTS, payload);
        return Response.json({ products }, {
            headers: { ...jsonHeaders, "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
        });
    } catch {
        return Response.json({ products: unavailableCatalog(MOCK_PRODUCTS), stale: true }, {
            headers: { ...jsonHeaders, "Cache-Control": "no-store" },
        });
    }
};

export const POST: APIRoute = async ({ request }) => {
    try {
        const declaredLength = Number(request.headers.get("content-length") ?? "0");
        if (!Number.isFinite(declaredLength) || declaredLength > 4_096) throw new Error("Túl nagy kérés.");
        const rawBody = await request.text();
        if (new TextEncoder().encode(rawBody).byteLength > 4_096) throw new Error("Túl nagy kérés.");
        const body = JSON.parse(rawBody) as { lines?: unknown };
        const lines = validateCheckoutLines(body.lines);
        const payload = await shopify(checkoutRequest(lines));
        const checkoutUrl = checkoutUrlFromResponse(payload, lines);
        return Response.json({ checkoutUrl }, { headers: { ...jsonHeaders, "Cache-Control": "no-store" } });
    } catch (cause) {
        const message = cause instanceof Error ? cause.message : "A Shopify pénztár most nem indítható.";
        return Response.json({ error: message }, { status: 400, headers: { ...jsonHeaders, "Cache-Control": "no-store" } });
    }
};
