import type { Cart, Money, Product } from "./contracts";

const money = (amount: number): Money => ({
    amount: amount.toFixed(2),
    currencyCode: "EUR",
});

const product = (
    handle: string,
    title: string,
    description: string,
    productType: string,
    image: string,
    price: number,
    compareAt: number | undefined,
    stock: number,
    tags: string[],
): Product => {
    const variantPrice = money(price);
    const compareAtPrice = compareAt ? money(compareAt) : undefined;
    const featuredImage = {
        url: image,
        altText: `${title} styled room`,
        width: 1200,
        height: 900,
    };
    return {
        id: `mock-product-${handle}`,
        handle,
        title,
        description,
        productType,
        tags,
        featuredImage,
        images: [featuredImage],
        variants: [
            {
                id: `mock-variant-${handle}-standard`,
                title: "Standard edition",
                selectedOptions: [{ name: "Edition", value: "Standard" }],
                price: variantPrice,
                compareAtPrice,
                availableForSale: stock > 0,
                quantityAvailable: stock,
            },
            {
                id: `mock-variant-${handle}-extended`,
                title: "Extended edition",
                selectedOptions: [{ name: "Edition", value: "Extended" }],
                price: money(price + 420),
                availableForSale: stock > 1,
                quantityAvailable: Math.max(0, stock - 1),
            },
        ],
        priceRange: {
            minVariantPrice: variantPrice,
            maxVariantPrice: money(price + 420),
        },
        inventoryState: stock === 0 ? "sold-out" : stock <= 3 ? "low-stock" : "available",
    };
};

export const MOCK_PRODUCTS: Product[] = [
    product(
        "listening-room",
        "Listening room edition",
        "A balanced living space built around music, reading, and slow evenings.",
        "Living room",
        "/img/uui/application/listing-01.webp",
        2460,
        2780,
        7,
        ["featured", "natural-materials", "living-room"],
    ),
    product(
        "quiet-studio",
        "Quiet studio edition",
        "A compact work-and-listen setup for focused homes and smaller apartments.",
        "Studio",
        "/img/uui/application/listing-02.webp",
        2120,
        undefined,
        3,
        ["featured", "compact", "studio"],
    ),
    product(
        "soft-bedroom",
        "Soft bedroom edition",
        "Textural essentials and calm storage for a lighter, quieter bedroom.",
        "Bedroom",
        "/img/uui/application/listing-03.webp",
        1980,
        2240,
        5,
        ["bedroom", "textiles", "calm"],
    ),
    product(
        "green-living",
        "Green living edition",
        "Natural finishes, flexible seating, and considered plant-friendly storage.",
        "Living room",
        "/img/uui/application/listing-04.webp",
        2280,
        undefined,
        2,
        ["plants", "living-room", "natural-materials"],
    ),
    product(
        "reading-corner",
        "Reading corner edition",
        "A focused chair, light, side table, and storage composition for daily reading.",
        "Living room",
        "/img/placeholders/interior/interior-4.jpg",
        1240,
        undefined,
        8,
        ["reading", "compact", "living-room"],
    ),
    product(
        "weekend-table",
        "Weekend table edition",
        "A practical dining composition for shared breakfasts, work, and long dinners.",
        "Dining",
        "/img/placeholders/interior/interior-2.jpg",
        1640,
        1820,
        0,
        ["dining", "natural-materials", "sold-out"],
    ),
];

export const EMPTY_CART: Cart = {
    id: "mock-cart",
    lines: [],
    totalQuantity: 0,
    subtotal: money(0),
    total: money(0),
    checkoutUrl: "/orders/demo-1001",
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
