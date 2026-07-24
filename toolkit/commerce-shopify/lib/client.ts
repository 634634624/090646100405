import type {
    Cart,
    CartLine,
    Money,
    Product,
    ProductImage,
    ProductVariant,
    StorefrontEnvelope,
    StorefrontOperation,
} from "./contracts";

const CART_ID_KEY = "uui-small-shop-cart-id-v1";

export async function storefrontRequest<T>(
    operation: StorefrontOperation,
    variables: Record<string, unknown> = {},
): Promise<T> {
    const response = await fetch("/api/storefront", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation, variables }),
    });
    const payload = (await response.json().catch(() => null)) as StorefrontEnvelope<T> | null;
    if (!response.ok || !payload?.data) {
        throw new Error(payload?.error || `Storefront request failed (${response.status}).`);
    }
    return payload.data;
}

export function storedCartId(): string | undefined {
    if (typeof window === "undefined") return undefined;
    return window.localStorage.getItem(CART_ID_KEY) || undefined;
}

export function rememberCart(cart: Cart): Cart {
    if (typeof window !== "undefined") {
        window.localStorage.setItem(CART_ID_KEY, cart.id);
    }
    return cart;
}

export function clearStoredCart(): void {
    if (typeof window !== "undefined") window.localStorage.removeItem(CART_ID_KEY);
}

type ShopifyNode = Record<string, any>;

const money = (value: ShopifyNode | null | undefined): Money => ({
    amount: String(value?.amount ?? "0.00"),
    currencyCode: String(value?.currencyCode ?? "EUR"),
});

const image = (value: ShopifyNode | null | undefined): ProductImage | undefined =>
    value?.url
        ? {
              url: String(value.url),
              altText: String(value.altText || "Product image"),
              width: Number(value.width || 1200),
              height: Number(value.height || 900),
          }
        : undefined;

export function normalizeShopifyProduct(node: ShopifyNode): Product {
    const variants = (node.variants?.nodes ?? []).map(
        (variant: ShopifyNode): ProductVariant => ({
            id: String(variant.id),
            title: String(variant.title),
            selectedOptions: (variant.selectedOptions ?? []).map((option: ShopifyNode) => ({
                name: String(option.name),
                value: String(option.value),
            })),
            price: money(variant.price),
            compareAtPrice: variant.compareAtPrice ? money(variant.compareAtPrice) : undefined,
            availableForSale: Boolean(variant.availableForSale),
            quantityAvailable:
                typeof variant.quantityAvailable === "number"
                    ? variant.quantityAvailable
                    : undefined,
        }),
    );
    const featuredImage =
        image(node.featuredImage) ??
        image(node.images?.nodes?.[0]) ?? {
            url: "/img/placeholders/product/product-1.jpg",
            altText: String(node.title || "Product"),
            width: 1200,
            height: 900,
        };
    const available = variants.filter((variant: ProductVariant) => variant.availableForSale);
    const lowStock = available.some(
        (variant: ProductVariant) =>
            typeof variant.quantityAvailable === "number" &&
            variant.quantityAvailable <= 4,
    );
    return {
        id: String(node.id),
        handle: String(node.handle),
        title: String(node.title),
        description: String(node.description || ""),
        productType: String(node.productType || "Product"),
        tags: (node.tags ?? []).map(String),
        featuredImage,
        images: (node.images?.nodes ?? [])
            .map((entry: ShopifyNode) => image(entry))
            .filter(Boolean) as ProductImage[],
        variants,
        priceRange: {
            minVariantPrice: money(node.priceRange?.minVariantPrice),
            maxVariantPrice: money(node.priceRange?.maxVariantPrice),
        },
        inventoryState:
            available.length === 0 ? "sold-out" : lowStock ? "low-stock" : "available",
    };
}

export function normalizeShopifyCart(node: ShopifyNode): Cart {
    const lines = (node.lines?.nodes ?? []).map((line: ShopifyNode): CartLine => {
        const merchandise = line.merchandise ?? {};
        return {
            id: String(line.id),
            merchandiseId: String(merchandise.id),
            productHandle: String(merchandise.product?.handle || ""),
            productTitle: String(merchandise.product?.title || ""),
            variantTitle: String(merchandise.title || ""),
            image: image(merchandise.image),
            quantity: Number(line.quantity || 0),
            unitPrice: money(line.cost?.amountPerQuantity),
            lineTotal: money(line.cost?.totalAmount),
        };
    });
    return {
        id: String(node.id),
        lines,
        totalQuantity: Number(node.totalQuantity || 0),
        subtotal: money(node.cost?.subtotalAmount),
        total: money(node.cost?.totalAmount),
        checkoutUrl: node.checkoutUrl ? String(node.checkoutUrl) : undefined,
        warnings: [],
    };
}

export function cartFromMutation(
    payload: ShopifyNode,
    operation: "cartCreate" | "cartLinesAdd" | "cartLinesUpdate" | "cartLinesRemove",
): Cart {
    const result = payload[operation];
    if (result?.userErrors?.length) {
        throw new Error(String(result.userErrors[0].message || "Shopify rejected the cart update."));
    }
    if (!result?.cart) throw new Error("Shopify returned no cart.");
    const cart = normalizeShopifyCart(result.cart);
    cart.warnings = (result.warnings ?? []).map((warning: ShopifyNode) => ({
        code: String(warning.code || "generic"),
        message: String(warning.message || "Shopify cart warning."),
        lineId: warning.target ? String(warning.target) : undefined,
    }));
    return cart;
}

export async function loadShopifyProducts(): Promise<Product[]> {
    const data = await storefrontRequest<{ products?: { nodes?: ShopifyNode[] } }>("products", {
        first: 24,
        after: null,
        query: null,
        sortKey: "BEST_SELLING",
        reverse: false,
    });
    return (data.products?.nodes ?? []).map(normalizeShopifyProduct);
}

export async function loadShopifyCart(): Promise<Cart | null> {
    const id = storedCartId();
    if (!id) return null;
    const data = await storefrontRequest<{ cart?: ShopifyNode | null }>("cart", { id });
    return data.cart ? normalizeShopifyCart(data.cart) : null;
}
