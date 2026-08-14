import type { SupplierOrderDraft, SupplierProductRecord } from "../providers/contracts";

export interface WebshippyConfig { baseUrl: string; apiKey: string }
export interface WebshippyResponse<T = unknown> { status: "success" | "error"; message?: string | string[]; result?: T }
type Fetch = typeof fetch;

export class WebshippyError extends Error {
    readonly status: number;
    constructor(message: string, status = 502) { super(message); this.status = status; }
}

export async function webshippyRequest<T>(config: WebshippyConfig, action: string, input: Record<string, unknown>, fetcher: Fetch = fetch): Promise<WebshippyResponse<T>> {
    if (!/^[A-Za-z]+$/.test(action)) throw new WebshippyError("Invalid Webshippy action.", 400);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const body = new URLSearchParams({ request: JSON.stringify({ apiKey: config.apiKey, ...input }) });
    try {
        const response = await fetcher(`${config.baseUrl}/${action}/json`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }, body, signal: controller.signal });
        if (!response.ok) throw new WebshippyError("Webshippy is currently unavailable.", response.status);
        const payload = await response.json() as WebshippyResponse<T>;
        if (!payload || !["success", "error"].includes(payload.status)) throw new WebshippyError("Webshippy returned an invalid response.");
        if (payload.status === "error") throw new WebshippyError(Array.isArray(payload.message) ? payload.message.join("; ") : payload.message || "Webshippy rejected the request.", 400);
        return payload;
    } catch (error) {
        if (error instanceof WebshippyError) throw error;
        throw new WebshippyError(error instanceof Error && error.name === "AbortError" ? "Webshippy request timed out." : "Webshippy request failed.");
    } finally { clearTimeout(timeout); }
}

export function getWebshippyProducts(config: WebshippyConfig, filters: Record<string, string> = {}, fetcher?: Fetch) {
    return webshippyRequest<unknown[]>(config, "GetProduct", { page: 0, limit: 100, filters }, fetcher);
}

export function upsertWebshippyProduct(config: WebshippyConfig, product: SupplierProductRecord, barcode: string, fetcher?: Fetch) {
    if (!barcode || !/^[a-zA-Z0-9_-]+$/.test(barcode)) throw new WebshippyError("A valid barcode is required.", 400);
    return webshippyRequest(config, "CreateProduct", { product: { referenceId: product.externalId, sku: product.sku, barcode, productName: product.title, productDescription: product.description, price: product.priceHuf / 1.27, vat: 0.27, currency: "HUF", imageUrls: product.imageUrls.slice(0, 6).join(";") } }, fetcher);
}

export function getWebshippyStock(config: WebshippyConfig, inventoryUpdatedSince?: string, fetcher?: Fetch) {
    return webshippyRequest<string>(config, "getStockInfoCsv", inventoryUpdatedSince ? { inventoryUpdatedSince } : {}, fetcher);
}

export function getWebshippyOrder(config: WebshippyConfig, referenceId: string, fetcher?: Fetch) {
    if (!referenceId) throw new WebshippyError("Order reference is required.", 400);
    return webshippyRequest<unknown[]>(config, "GetOrder", { page: 0, limit: 1, filters: { referenceId } }, fetcher);
}

export function createWebshippyOrder(config: WebshippyConfig, order: SupplierOrderDraft, fetcher?: Fetch) {
    const now = new Date().toISOString();
    return webshippyRequest(config, "CreateOrder", { order: {
        referenceId: order.externalOrderId,
        referenceName: order.externalOrderId,
        createdAt: now,
        shipping: {
            name: order.customer.name,
            email: order.customer.email,
            ...(order.customer.phone ? { phone: order.customer.phone } : {}),
            countryCode: order.delivery.country,
            zip: order.delivery.postalCode,
            city: order.delivery.city,
            address1: order.delivery.addressLine,
        },
        payment: { paymentMode: "card", paymentStatus: "paid", paidDate: now, currency: "HUF" },
        products: order.lines.map((line) => ({ sku: line.sku, productName: line.sku, priceGross: line.unitPriceHuf, vat: 27, quantity: line.quantity })),
    } }, fetcher);
}

export async function getWebshippyTracking(config: WebshippyConfig, orderId: string, fetcher: Fetch = fetch) {
    if (!orderId || !/^\d+$/.test(orderId)) throw new WebshippyError("Numeric Webshippy order ID is required.", 400);
    const url = new URL(`${config.baseUrl}/getTrackInfo/json`);
    url.search = new URLSearchParams({ apiKey: config.apiKey, page: "0", orderIds: orderId }).toString();
    const response = await fetcher(url, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new WebshippyError("Webshippy tracking is currently unavailable.", response.status);
    const payload = await response.json() as WebshippyResponse;
    if (payload.status !== "success") throw new WebshippyError(Array.isArray(payload.message) ? payload.message.join("; ") : payload.message || "Webshippy tracking failed.", 400);
    return payload;
}
