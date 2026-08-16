// The three shared demo products. Shopify owns sellable catalog state; Webshippy
// receives the same SKUs through its Shopify connector.
import type { Cart, Money, Product } from "@/toolkit/commerce-shopify/lib/contracts";

const money = (amount: number): Money => ({ amount: amount.toFixed(0), currencyCode: "HUF" });

const product = (
    id: string,
    variantId: string,
    handle: string,
    title: string,
    description: string,
    productType: "Műszaki" | "Háztartás",
    image: string,
    price: number,
    compareAt: number | undefined,
    stock: number,
    tags: string[],
): Product => {
    const basePrice = money(price);
    const featuredImage = { url: image, altText: title, width: 1200, height: 900 };
    return {
        id,
        handle,
        title,
        description,
        productType,
        tags,
        featuredImage,
        images: [featuredImage],
        variants: [{
            id: variantId,
            title: "Alapváltozat",
            selectedOptions: [{ name: "Változat", value: "Alap" }],
            price: basePrice,
            compareAtPrice: compareAt ? money(compareAt) : undefined,
            availableForSale: stock > 0,
            quantityAvailable: stock,
        }],
        priceRange: { minVariantPrice: basePrice, maxVariantPrice: basePrice },
        inventoryState: stock === 0 ? "sold-out" : stock <= 3 ? "low-stock" : "available",
    };
};

export const MOCK_PRODUCTS: Product[] = [
    product(
        "gid://shopify/Product/9251757129866",
        "gid://shopify/ProductVariant/50016701087882",
        "otthoni-zene-alapcsomag",
        "Otthoni zene alapcsomag",
        "Átgondolt kiindulópont tiszta hanghoz és rendezett nappali használathoz.",
        "Műszaki",
        "/img/uui/application/listing-01.webp",
        89990,
        99990,
        4,
        ["featured", "trending", "audio", "nappali"],
    ),
    product(
        "gid://shopify/Product/9251758178442",
        "gid://shopify/ProductVariant/50016706265226",
        "kompakt-sztereo-csomag",
        "Kompakt sztereó csomag",
        "Kisebb otthonokhoz válogatott, helytakarékos zenehallgató összeállítás.",
        "Műszaki",
        "/img/uui/application/listing-02.webp",
        119990,
        undefined,
        3,
        ["audio", "kompakt", "otthoni iroda"],
    ),
    product(
        "gid://shopify/Product/9251758866570",
        "gid://shopify/ProductVariant/50016709574794",
        "olvasosarok-fenycsomag",
        "Olvasósarok fénycsomag",
        "Meleg fényű, egyszerűen elhelyezhető összeállítás esti olvasáshoz.",
        "Műszaki",
        "/img/placeholders/interior/interior-4.jpg",
        18990,
        undefined,
        7,
        ["világítás", "olvasás", "kompakt"],
    ),
];

export const EMPTY_CART: Cart = {
    id: "demo-cart",
    lines: [],
    totalQuantity: 0,
    subtotal: money(0),
    total: money(0),
    checkoutUrl: "",
    warnings: [],
};

export function calculateMockCart(lines: Cart["lines"]): Cart {
    const normalizedLines = lines.map((line) => ({
        ...line,
        lineTotal: money(Number(line.unitPrice.amount) * line.quantity),
    }));
    const subtotal = normalizedLines.reduce(
        (sum, line) => sum + Number(line.unitPrice.amount) * line.quantity,
        0,
    );
    return {
        ...EMPTY_CART,
        lines: normalizedLines,
        totalQuantity: normalizedLines.reduce((sum, line) => sum + line.quantity, 0),
        subtotal: money(subtotal),
        total: money(subtotal),
    };
}
