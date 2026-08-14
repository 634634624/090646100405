export type CommerceMode = "mock" | "live";
export type WebshippyOrderOwner = "shopify-connector" | "webshippy-api";

export interface CommerceConfig {
    mode: CommerceMode;
    liveWriteEnabled: boolean;
    shopify?: { domain: string; token: string; apiVersion: string; variantBySku: Record<string, string> };
    webshippy?: { baseUrl: string; apiKey: string; warehouseId?: string; orderOwner: WebshippyOrderOwner; barcodeBySku: Record<string, string>; pushSecret?: string };
}

function parseMap(value: string | undefined, name: string): Record<string, string> {
    if (!value) return {};
    let parsed: unknown;
    try { parsed = JSON.parse(value); }
    catch { throw new Error(`${name} must be valid JSON.`); }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error(`${name} must be a JSON object.`);
    return Object.fromEntries(Object.entries(parsed).map(([key, item]) => [key, String(item)]));
}

export function commerceConfig(env: Record<string, string | undefined>): CommerceConfig {
    const mode = env.COMMERCE_MODE === "live" ? "live" : "mock";
    const orderOwner: WebshippyOrderOwner = env.WEBSHIPPY_ORDER_OWNER === "webshippy-api" ? "webshippy-api" : "shopify-connector";
    const shopify = env.SHOPIFY_STORE_DOMAIN && env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ? {
        domain: env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, "").replace(/\/$/, ""),
        token: env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
        apiVersion: env.SHOPIFY_API_VERSION || "2026-07",
        variantBySku: parseMap(env.SHOPIFY_VARIANT_MAP_JSON, "SHOPIFY_VARIANT_MAP_JSON"),
    } : undefined;
    const webshippy = env.WEBSHIPPY_API_KEY ? {
        baseUrl: (env.WEBSHIPPY_API_URL || "https://app.webshippy.com/wspyapi").replace(/\/$/, ""),
        apiKey: env.WEBSHIPPY_API_KEY,
        ...(env.WEBSHIPPY_WAREHOUSE_ID ? { warehouseId: env.WEBSHIPPY_WAREHOUSE_ID } : {}),
        orderOwner,
        barcodeBySku: parseMap(env.WEBSHIPPY_TEST_BARCODES_JSON, "WEBSHIPPY_TEST_BARCODES_JSON"),
        ...(env.WEBSHIPPY_PUSH_SECRET ? { pushSecret: env.WEBSHIPPY_PUSH_SECRET } : {}),
    } : undefined;
    return { mode, liveWriteEnabled: env.COMMERCE_LIVE_WRITE_ENABLED === "true", shopify, webshippy };
}

export function publicCommerceStatus(config: CommerceConfig) {
    return {
        mode: config.mode,
        shopifyConfigured: Boolean(config.shopify),
        webshippyConfigured: Boolean(config.webshippy),
        webshippyOrderOwner: config.webshippy?.orderOwner ?? "shopify-connector",
        liveWritesEnabled: config.liveWriteEnabled,
    };
}
