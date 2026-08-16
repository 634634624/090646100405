// Internal seed data only. Replace through the Webshippy adapter before launch.
import type { Cart, Money, Product } from "@/toolkit/commerce-shopify/lib/contracts";

const money = (amount: number): Money => ({ amount: amount.toFixed(0), currencyCode: "HUF" });

const product = (
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
        id: `demo-product-${handle}`,
        handle,
        title,
        description,
        productType,
        tags,
        featuredImage,
        images: [featuredImage],
        variants: [{
            id: `demo-variant-${handle}`,
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
        "otthoni-zene-csomag",
        "Otthoni zene alapcsomag",
        "Átgondolt kiindulópont tiszta hanghoz és rendezett nappali használathoz.",
        "Műszaki",
        "/img/uui/application/listing-01.webp",
        89990,
        99990,
        8,
        ["featured", "trending", "audio", "nappali"],
    ),
    product(
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
        "haloszoba-rendezo-csomag",
        "Hálószoba rendezőcsomag",
        "Egyszerű tárolási és rendszerezési alapok a nyugodtabb reggelekhez.",
        "Háztartás",
        "/img/uui/application/listing-03.webp",
        24990,
        28990,
        5,
        ["rendszerezés", "hálószoba", "otthon"],
    ),
    product(
        "nappali-rendezo-csomag",
        "Nappali rendezőcsomag",
        "Praktikus elemek a mindennapi tárgyak és a családi tér átlátható rendjéhez.",
        "Háztartás",
        "/img/uui/application/listing-04.webp",
        32990,
        undefined,
        6,
        ["rendszerezés", "nappali", "featured"],
    ),
    product(
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
    product(
        "etkezo-rendszerezo-csomag",
        "Étkező rendszerezőcsomag",
        "Helytakarékos tárolási alapok közös étkezésekhez és hétköznapi használathoz.",
        "Háztartás",
        "/img/placeholders/interior/interior-2.jpg",
        21990,
        undefined,
        0,
        ["étkező", "rendszerezés", "elfogyott"],
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
