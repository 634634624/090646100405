export type StorefrontMode = "mock" | "shopify";
export type InventoryState = "available" | "low-stock" | "sold-out";

export interface Money {
    amount: string;
    currencyCode: string;
}

export interface ProductImage {
    url: string;
    altText: string;
    width: number;
    height: number;
}

export interface ProductVariant {
    id: string;
    title: string;
    selectedOptions: Array<{ name: string; value: string }>;
    price: Money;
    compareAtPrice?: Money;
    availableForSale: boolean;
    quantityAvailable?: number;
}

export interface Product {
    id: string;
    handle: string;
    title: string;
    description: string;
    productType: string;
    tags: string[];
    featuredImage: ProductImage;
    images: ProductImage[];
    variants: ProductVariant[];
    priceRange: {
        minVariantPrice: Money;
        maxVariantPrice: Money;
    };
    inventoryState: InventoryState;
}

export interface CartLine {
    id: string;
    merchandiseId: string;
    productHandle: string;
    productTitle: string;
    variantTitle: string;
    image?: ProductImage;
    quantity: number;
    unitPrice: Money;
    lineTotal: Money;
}

export interface Cart {
    id: string;
    lines: CartLine[];
    totalQuantity: number;
    subtotal: Money;
    total: Money;
    checkoutUrl?: string;
    warnings: Array<{ code: string; message: string; lineId?: string }>;
}

export type StorefrontOperation =
    | "products"
    | "product"
    | "cart"
    | "cartCreate"
    | "cartLinesAdd"
    | "cartLinesUpdate"
    | "cartLinesRemove";

export interface StorefrontEnvelope<T> {
    data?: T;
    error?: string;
}
