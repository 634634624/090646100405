export interface ShopifyClientConfig { domain: string; token?: string; apiVersion: string }
export interface ShopifyCartLine { merchandiseId: string; quantity: number }
export interface ShopifyCheckout { cartId: string; checkoutUrl: string }

type Fetch = typeof fetch;

export class ShopifyError extends Error {
    readonly status: number;
    constructor(message: string, status = 502) { super(message); this.status = status; }
}

export async function shopifyGraphql<T>(config: ShopifyClientConfig, query: string, variables: Record<string, unknown>, fetcher: Fetch = fetch): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (config.token) headers["X-Shopify-Storefront-Access-Token"] = config.token;
        const response = await fetcher(`https://${config.domain}/api/${config.apiVersion}/graphql.json`, {
            method: "POST",
            headers,
            body: JSON.stringify({ query, variables }),
            signal: controller.signal,
        });
        if (!response.ok) throw new ShopifyError("Shopify is currently unavailable.", response.status);
        const payload = await response.json() as { data?: T; errors?: { message?: string }[] };
        if (payload.errors?.length || !payload.data) throw new ShopifyError(payload.errors?.[0]?.message || "Shopify returned an invalid response.");
        return payload.data;
    } catch (error) {
        if (error instanceof ShopifyError) throw error;
        throw new ShopifyError(error instanceof Error && error.name === "AbortError" ? "Shopify request timed out." : "Shopify request failed.");
    } finally { clearTimeout(timeout); }
}

const CART_CREATE = `mutation CartCreate($input: CartInput!) { cartCreate(input: $input) { cart { id checkoutUrl } userErrors { field message } } }`;
const VARIANTS_BY_SKU = `query VariantsBySku { products(first: 100) { nodes { variants(first: 100) { nodes { id sku } } } } }`;

export async function resolveShopifyVariantIds(config: ShopifyClientConfig, skus: string[], fetcher: Fetch = fetch): Promise<Record<string, string>> {
    const wanted = new Set(skus);
    if (!wanted.size) return {};
    const data = await shopifyGraphql<{ products: { nodes: { variants: { nodes: { id: string; sku?: string | null }[] } }[] } }>(config, VARIANTS_BY_SKU, {}, fetcher);
    const result: Record<string, string> = {};
    for (const product of data.products.nodes) {
        for (const variant of product.variants.nodes) {
            if (variant.sku && wanted.has(variant.sku)) result[variant.sku] = variant.id;
        }
    }
    return result;
}

export async function createShopifyCheckout(config: ShopifyClientConfig, lines: ShopifyCartLine[], fetcher: Fetch = fetch): Promise<ShopifyCheckout> {
    if (!lines.length || lines.some((line) => !line.merchandiseId.startsWith("gid://shopify/ProductVariant/") || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99)) {
        throw new ShopifyError("Invalid Shopify cart lines.", 400);
    }
    const data = await shopifyGraphql<{ cartCreate: { cart: ShopifyCheckout | null; userErrors: { message: string }[] } }>(config, CART_CREATE, { input: { lines } }, fetcher);
    if (data.cartCreate.userErrors.length || !data.cartCreate.cart?.checkoutUrl) throw new ShopifyError(data.cartCreate.userErrors[0]?.message || "Shopify did not create a checkout.", 400);
    const url = new URL(data.cartCreate.cart.checkoutUrl);
    if (url.protocol !== "https:") throw new ShopifyError("Shopify returned an unsafe checkout URL.");
    return data.cartCreate.cart;
}
