import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import {
    applyShopifyCatalog,
    catalogRequest,
    checkoutRequest,
    checkoutUrlFromResponse,
    SHOPIFY_UCP_ENDPOINT,
    unavailableCatalog,
    validateCheckoutLines,
} from "@/integrations/commerce/shopify-ucp";
import {
    applyWebshippyStock,
    assertWebshippyStock,
    fetchWebshippyStock,
} from "@/integrations/commerce/webshippy-stock";
import { UpstreamHttpError, withTransientRetry } from "@/integrations/commerce/transient-retry";
import {
    canonicalCatalogRequest,
    commerceRequestAllowed,
    readBoundedText,
} from "@/integrations/commerce/request-security";
import { MOCK_PRODUCTS } from "@/data/demo-catalog";

export const prerender = false;

const jsonHeaders = { "Content-Type": "application/json; charset=utf-8" };
const catalogCacheControl = "public, max-age=10, must-revalidate";
const checkoutBodyLimit = 4_096;

type WorkerCacheStorage = CacheStorage & { default: Cache };

function workerCache() {
    return (globalThis as typeof globalThis & { caches?: WorkerCacheStorage }).caches?.default;
}

function unavailable(status = 503) {
    return Response.json({ error: "A szolgáltatás átmenetileg nem érhető el." }, {
        status,
        headers: { ...jsonHeaders, "Cache-Control": "no-store" },
    });
}

async function requestAllowed(request: Request, scope: "catalog" | "checkout", limit: number) {
    try {
        return await commerceRequestAllowed(env.COMMERCE_COORDINATOR, request, scope, limit);
    } catch {
        return null;
    }
}

async function shopify(body: unknown) {
    return withTransientRetry(async () => {
        const response = await fetch(SHOPIFY_UCP_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(5_000),
        });
        if (!response.ok) {
            await response.body?.cancel();
            throw new UpstreamHttpError("Shopify", response.status, response.headers.get("retry-after"));
        }
        return response.json() as Promise<unknown>;
    });
}

export const GET: APIRoute = async ({ request }) => {
    const cache = workerCache();
    const cacheKey = canonicalCatalogRequest(request);
    const cached = await cache?.match(cacheKey);
    if (cached) return cached;

    const allowed = await requestAllowed(request, "catalog", 30);
    if (allowed === null) return unavailable();
    if (!allowed) return unavailable(429);

    try {
        const [payload, stock] = await Promise.all([
            shopify(catalogRequest()),
            fetchWebshippyStock(env.WEBSHIPPY_API_KEY ?? ""),
        ]);
        const products = applyWebshippyStock(applyShopifyCatalog(MOCK_PRODUCTS, payload), stock);
        const response = Response.json({ products }, {
            headers: {
                ...jsonHeaders,
                "Cache-Control": catalogCacheControl,
                "X-DevShop-Catalog-State": "fresh",
            },
        });
        if (cache) {
            try {
                await cache.put(cacheKey, response.clone());
            } catch {
                console.error(JSON.stringify({ event: "catalog_cache_write_failure" }));
            }
        }
        return response;
    } catch (cause) {
        console.error(JSON.stringify({
            event: "catalog_upstream_failure",
            error: cause instanceof Error ? cause.name : "UnknownError",
            provider: cause instanceof UpstreamHttpError ? cause.provider : "catalog",
            status: cause instanceof UpstreamHttpError ? cause.status : undefined,
        }));
        return Response.json({ products: unavailableCatalog(MOCK_PRODUCTS), stale: true }, {
            headers: {
                ...jsonHeaders,
                "Cache-Control": "no-store",
                "X-DevShop-Catalog-State": "fail-closed",
            },
        });
    }
};

export const POST: APIRoute = async ({ request }) => {
    const allowed = await requestAllowed(request, "checkout", 12);
    if (allowed === null) return unavailable();
    if (!allowed) return unavailable(429);

    try {
        const rawBody = await readBoundedText(request, checkoutBodyLimit);
        const body = JSON.parse(rawBody) as { lines?: unknown };
        const lines = validateCheckoutLines(body.lines);
        const stock = await fetchWebshippyStock(env.WEBSHIPPY_API_KEY ?? "");
        assertWebshippyStock(lines, stock);
        const payload = await shopify(checkoutRequest(lines));
        const checkoutUrl = checkoutUrlFromResponse(payload, lines);
        return Response.json({ checkoutUrl }, { headers: { ...jsonHeaders, "Cache-Control": "no-store" } });
    } catch (cause) {
        if (cause instanceof RangeError) return unavailable(413);
        const message = cause instanceof Error ? cause.message : "A Shopify pénztár most nem indítható.";
        return Response.json({ error: message }, { status: 400, headers: { ...jsonHeaders, "Cache-Control": "no-store" } });
    }
};
