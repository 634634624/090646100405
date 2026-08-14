import { normalizeCart, type CartLine } from "../../features/storefront/cart";
import { storeProducts } from "../../features/storefront/catalog";
import type { CommerceConfig } from "./config";
import { createShopifyCheckout, ShopifyError } from "./shopify";

export async function beginCheckout(config: CommerceConfig, input: unknown, fetcher: typeof fetch = fetch) {
    const record = input && typeof input === "object" ? input as { lines?: unknown } : {};
    const lines = normalizeCart(record.lines) as CartLine[];
    if (!lines.length) throw new ShopifyError("The cart is empty.", 400);
    if (config.mode === "mock") return { mode: "mock" as const, checkoutUrl: "/orders/demo-1001", cartId: "mock-cart-1001" };
    if (!config.shopify) throw new ShopifyError("Shopify is not configured.", 503);
    const shopifyLines = lines.map((line) => {
        const product = storeProducts.find((item) => item.id === line.productId)!;
        const merchandiseId = config.shopify!.variantBySku[product.sku];
        if (!merchandiseId) throw new ShopifyError(`Missing Shopify variant mapping for ${product.sku}.`, 503);
        return { merchandiseId, quantity: line.quantity };
    });
    return { mode: "live" as const, ...await createShopifyCheckout(config.shopify, shopifyLines, fetcher) };
}
