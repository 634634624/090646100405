export interface ShopifyClientConfig { domain: string; token: string; apiVersion: string }
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
        const response = await fetcher(`https://${config.domain}/api/${config.apiVersion}/graphql.json`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": config.token },
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
