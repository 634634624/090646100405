import type { Product } from "@/toolkit/commerce-shopify/lib/contracts";

export const SHOPIFY_STORE_DOMAIN = "devshop-vmthv4tq.myshopify.com";
export const SHOPIFY_UCP_ENDPOINT = `https://${SHOPIFY_STORE_DOMAIN}/api/ucp/mcp`;
export const SHOPIFY_CATALOG_PROFILE = "https://shopify.dev/ucp/agent-profiles/examples/2026-04-08/valid-with-capabilities.json";
export const SHOPIFY_CART_PROFILE = "https://shopify.dev/ucp/agent-profiles/examples/2026-04-08/cart-and-checkout.json";

export const DEMO_VARIANT_IDS = [
    "gid://shopify/ProductVariant/50016701087882",
    "gid://shopify/ProductVariant/50016706265226",
    "gid://shopify/ProductVariant/50016709574794",
] as const;

const allowedVariantIds = new Set<string>(DEMO_VARIANT_IDS);

export interface CheckoutLineInput {
    variantId: string;
    quantity: number;
}

export function validateCheckoutLines(value: unknown): CheckoutLineInput[] {
    if (!Array.isArray(value) || value.length < 1 || value.length > DEMO_VARIANT_IDS.length) {
        throw new Error("A kosár 1–3 különböző demóterméket tartalmazhat.");
    }
    const seen = new Set<string>();
    let total = 0;
    const lines = value.map((entry) => {
        if (!entry || typeof entry !== "object") throw new Error("Hibás kosártétel.");
        const { variantId, quantity } = entry as Record<string, unknown>;
        if (typeof variantId !== "string" || !allowedVariantIds.has(variantId)) {
            throw new Error("Nem engedélyezett Shopify termékváltozat.");
        }
        if (seen.has(variantId)) throw new Error("A kosár ismétlődő terméket tartalmaz.");
        if (!Number.isInteger(quantity) || Number(quantity) < 1 || Number(quantity) > 10) {
            throw new Error("A mennyiség termékenként 1 és 10 között lehet.");
        }
        seen.add(variantId);
        total += Number(quantity);
        return { variantId, quantity: Number(quantity) };
    });
    if (total > 20) throw new Error("A kosár legfeljebb 20 terméket tartalmazhat.");
    return lines;
}

export function catalogRequest() {
    return {
        jsonrpc: "2.0",
        id: "devshop-catalog",
        method: "tools/call",
        params: {
            name: "lookup_catalog",
            arguments: {
                meta: { "ucp-agent": { profile: SHOPIFY_CATALOG_PROFILE } },
                catalog: {
                    ids: [...DEMO_VARIANT_IDS],
                    context: { address_country: "HU", language: "hu", currency: "HUF" },
                },
            },
        },
    };
}

export function checkoutRequest(lines: CheckoutLineInput[]) {
    return {
        jsonrpc: "2.0",
        id: "devshop-checkout",
        method: "tools/call",
        params: {
            name: "create_cart",
            arguments: {
                meta: { "ucp-agent": { profile: SHOPIFY_CART_PROFILE } },
                cart: {
                    line_items: lines.map(({ variantId, quantity }) => ({
                        quantity,
                        item: { id: variantId },
                    })),
                    // Shopify's development store currently exposes these demo variants
                    // only in its default US market. The Hungarian market remains a launch blocker.
                    context: { address_country: "US" },
                    attribution: {
                        utm_source: "devshopify_astro",
                        utm_medium: "storefront",
                        utm_campaign: "integration_test",
                    },
                },
            },
        },
    };
}

function asObject(value: unknown): Record<string, unknown> | undefined {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : undefined;
}

export function applyShopifyCatalog(seed: Product[], payload: unknown): Product[] {
    const root = asObject(payload);
    const result = asObject(root?.result);
    const structured = asObject(result?.structuredContent);
    const products = Array.isArray(structured?.products) ? structured.products : [];
    const variants = new Map<string, Record<string, unknown>>();
    for (const rawProduct of products) {
        const product = asObject(rawProduct);
        if (!product || !Array.isArray(product.variants)) continue;
        for (const rawVariant of product.variants) {
            const variant = asObject(rawVariant);
            if (variant && typeof variant.id === "string") variants.set(variant.id, variant);
        }
    }
    if (variants.size !== seed.length) throw new Error("A Shopify katalógus nem adta vissza mindhárom demóterméket.");

    return seed.map((product) => {
        const current = variants.get(product.variants[0].id);
        if (!current) throw new Error("Hiányzó Shopify termékváltozat.");
        const price = asObject(current.price);
        const availability = asObject(current.availability);
        const amountMinor = Number(price?.amount);
        if (!Number.isSafeInteger(amountMinor) || amountMinor < 0 || price?.currency !== "HUF") {
            throw new Error("Hibás Shopify ár.");
        }
        const available = availability?.available === true;
        const money = { amount: String(amountMinor / 100), currencyCode: "HUF" };
        const variant = {
            ...product.variants[0],
            price: money,
            availableForSale: available,
            quantityAvailable: available ? product.variants[0].quantityAvailable : 0,
        };
        return {
            ...product,
            variants: [variant],
            priceRange: { minVariantPrice: money, maxVariantPrice: money },
            inventoryState: available
                ? product.inventoryState === "sold-out" ? "available" : product.inventoryState
                : "sold-out",
        } satisfies Product;
    });
}

export function checkoutUrlFromResponse(payload: unknown): string {
    const root = asObject(payload);
    if (root?.error) throw new Error("A Shopify pénztár nem érhető el.");
    const result = asObject(root?.result);
    const structured = asObject(result?.structuredContent);
    const cart = asObject(structured?.cart) ?? structured;
    const messages = Array.isArray(cart?.messages) ? cart.messages : [];
    const blocking = messages.map(asObject).find((message) => message?.type === "error" || message?.severity === "unrecoverable" || message?.code === "merchandise_out_of_stock");
    if (blocking) throw new Error(typeof blocking.content === "string" ? blocking.content : "A Shopify elutasította a kosarat.");
    const lines = Array.isArray(cart?.line_items) ? cart.line_items : [];
    if (!lines.length || typeof cart?.continue_url !== "string") throw new Error("A Shopify nem hozott létre használható kosarat.");
    const url = new URL(cart.continue_url);
    if (url.protocol !== "https:" || url.hostname !== SHOPIFY_STORE_DOMAIN || !url.pathname.startsWith("/cart/")) {
        throw new Error("A Shopify érvénytelen pénztárhivatkozást adott vissza.");
    }
    return url.href;
}
