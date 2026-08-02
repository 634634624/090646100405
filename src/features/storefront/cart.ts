import { storeProducts } from "./catalog";

export interface CartLine { productId: string; quantity: number }
export const CART_KEY = "valogatott-cart-v1";
export const CART_EVENT = "valogatott-cart-change";

export function normalizeCart(input: unknown): CartLine[] {
    if (!Array.isArray(input)) return [];
    const requested = input
        .filter((line): line is Record<string, unknown> => Boolean(line && typeof line === "object"))
        .map((line) => ({ productId: String(line.productId ?? ""), quantity: Math.max(1, Math.min(99, Math.floor(Number(line.quantity) || 1))) }));
    const quantities = new Map<string, number>();
    for (const line of requested) {
        const product = storeProducts.find((entry) => entry.id === line.productId);
        if (!product || product.stock < 1) continue;
        quantities.set(line.productId, Math.min(product.stock, (quantities.get(line.productId) ?? 0) + line.quantity));
    }
    return [...quantities].map(([productId, quantity]) => ({ productId, quantity }));
}

export function readCart(): CartLine[] {
    if (typeof window === "undefined") return [];
    try { return normalizeCart(JSON.parse(window.localStorage.getItem(CART_KEY) ?? "[]")); }
    catch { return []; }
}

export function writeCart(lines: CartLine[]) {
    const normalized = normalizeCart(lines);
    window.localStorage.setItem(CART_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: normalized }));
    return normalized;
}

export function addCartItem(productId: string, quantity = 1) {
    const lines = readCart();
    const existing = lines.find((line) => line.productId === productId);
    return writeCart(existing
        ? lines.map((line) => line.productId === productId ? { ...line, quantity: line.quantity + quantity } : line)
        : [...lines, { productId, quantity }]);
}

export function updateCartItem(productId: string, quantity: number) {
    return writeCart(quantity <= 0
        ? readCart().filter((line) => line.productId !== productId)
        : readCart().map((line) => line.productId === productId ? { ...line, quantity } : line));
}

export function cartTotal(lines: CartLine[]) {
    return lines.reduce((total, line) => {
        const product = storeProducts.find((entry) => entry.id === line.productId);
        return total + (product?.priceHuf ?? 0) * line.quantity;
    }, 0);
}
