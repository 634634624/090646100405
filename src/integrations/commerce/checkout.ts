import { normalizeCart, type CartLine } from "../../features/storefront/cart";
import { storeProducts } from "../../features/storefront/catalog";
import type { CommerceConfig } from "./config";
import { createShopifyCheckout, resolveShopifyVariantIds, ShopifyError } from "./shopify";

export async function beginCheckout(config: CommerceConfig, input: unknown, fetcher: typeof fetch = fetch) {
    const record = input && typeof input === "object" ? input as { lines?: unknown } : {};
    const lines = normalizeCart(record.lines) as CartLine[];
    if (!lines.length) throw new ShopifyError("The cart is empty.", 400);
    if (config.mode === "mock") return { mode: "mock" as const, checkoutUrl: "/orders/demo-1001", cartId: "mock-cart-1001" };
    if (!config.shopify) throw new ShopifyError("Shopify is not configured.", 503);
    const products = lines.map((line) => storeProducts.find((item) => item.id === line.productId)!);
    const missingSkus = products.map((product) => product.sku).filter((sku) => !config.shopify!.variantBySku[sku]);
    const discovered = missingSkus.length ? await resolveShopifyVariantIds(config.shopify, missingSkus, fetcher) : {};
    const shopifyLines = lines.map((line, index) => {
        const product = products[index];
        const merchandiseId = config.shopify!.variantBySku[product.sku] || discovered[product.sku];
        if (!merchandiseId) throw new ShopifyError(`Shopify product not found for ${product.sku}.`, 503);
        return { merchandiseId, quantity: line.quantity };
    });
    return { mode: "live" as const, ...await createShopifyCheckout(config.shopify, shopifyLines, fetcher) };
}
