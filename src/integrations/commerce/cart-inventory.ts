import type { CartLine, Product, ProductVariant } from "@/toolkit/commerce-shopify/lib/contracts";

export function sellableQuantity(variant: ProductVariant | undefined): number {
    if (!variant?.availableForSale) return 0;
    const quantity = variant.quantityAvailable;
    return Number.isSafeInteger(quantity) && Number(quantity) > 0 ? Number(quantity) : 1;
}

export function quantityForVariant(products: Product[], variantId: string): number {
    for (const product of products) {
        const variant = product.variants.find((entry) => entry.id === variantId);
        if (variant) return sellableQuantity(variant);
    }
    return 0;
}

export function reconcileCartLinesWithCatalog(lines: CartLine[], products: Product[]): CartLine[] {
    const catalog = new Map<string, { product: Product; variant: ProductVariant }>();
    for (const product of products) {
        for (const variant of product.variants) catalog.set(variant.id, { product, variant });
    }

    return lines.flatMap((line) => {
        const current = catalog.get(line.merchandiseId);
        const maximum = sellableQuantity(current?.variant);
        if (!current || maximum < 1) return [];
        return [{
            ...line,
            productHandle: current.product.handle,
            productTitle: current.product.title,
            variantTitle: current.variant.title,
            image: current.product.featuredImage,
            quantity: Math.min(Math.max(1, Math.trunc(line.quantity)), maximum),
            unitPrice: current.variant.price,
        }];
    });
}
