import { SHOPIFY_STORE_DOMAIN } from "./shopify-ucp.ts";

export const SHOPIFY_PAID_TOPIC = "orders/paid";
export const SHOPIFY_CANCELLED_TOPIC = "orders/cancelled";
export const SHOPIFY_WEBHOOK_BODY_LIMIT = 256 * 1024;
const WEBSHIPPY_API_URL = "https://app.webshippy.com/wspyapi";

const TEST_PRODUCT_BY_SKU = {
    "DEMO-TECH-001": { productName: "Otthoni zene alapcsomag", priceGross: 89_990 },
    "DEMO-TECH-002": { productName: "Kompakt sztereó csomag", priceGross: 119_990 },
    "DEMO-TECH-003": { productName: "Olvasósarok fénycsomag", priceGross: 18_990 },
} as const;

type ShopifyAddress = {
    name?: unknown;
    first_name?: unknown;
    last_name?: unknown;
    phone?: unknown;
    country_code?: unknown;
    zip?: unknown;
    city?: unknown;
    address1?: unknown;
    address2?: unknown;
};

function text(value: unknown, maximum = 200) {
    return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function money(value: unknown) {
    const amount = Number(value);
    return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

function webshippyDate(value: unknown) {
    const date = new Date(typeof value === "string" ? value : Date.now());
    if (Number.isNaN(date.getTime())) throw new Error("Invalid Shopify order date.");
    return date.toISOString().slice(0, 19).replace("T", " ");
}

function shippingName(address: ShopifyAddress) {
    return text(address.name) || [text(address.first_name), text(address.last_name)].filter(Boolean).join(" ");
}

function base64(bytes: Uint8Array) {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
}

function equalText(left: string, right: string) {
    if (left.length !== right.length) return false;
    let difference = 0;
    for (let index = 0; index < left.length; index += 1) {
        difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
    }
    return difference === 0;
}

export async function verifyShopifyWebhook(rawBody: string | Uint8Array, receivedHmac: string, secret: string) {
    if (!receivedHmac || !secret) return false;
    const source = typeof rawBody === "string" ? new TextEncoder().encode(rawBody) : rawBody;
    const body = new Uint8Array(source.byteLength);
    body.set(source);
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
    );
    const signature = await crypto.subtle.sign("HMAC", key, body);
    return equalText(base64(new Uint8Array(signature)), receivedHmac);
}

export function validateShopifyWebhookHeaders(headers: Headers, expectedTopic = SHOPIFY_PAID_TOPIC) {
    if (headers.get("x-shopify-topic") !== expectedTopic) throw new Error("Unexpected Shopify topic.");
    if (headers.get("x-shopify-shop-domain") !== SHOPIFY_STORE_DOMAIN) throw new Error("Unexpected Shopify store.");
    const webhookId = headers.get("x-shopify-webhook-id")?.trim();
    if (!webhookId || webhookId.length > 100) throw new Error("Missing Shopify delivery ID.");
    return { webhookId };
}

export function buildWebshippyTestOrderFromShopify(payload: unknown) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Invalid Shopify order.");
    const order = payload as Record<string, unknown>;
    if (order.test !== true) return null;

    const orderId = text(String(order.id ?? ""), 30);
    if (!/^\d{1,30}$/.test(orderId)) throw new Error("Invalid Shopify order ID.");
    const referenceId = orderId;
    const referenceName = `[TESZT] Shopify ${text(order.name, 30) || orderId}`;

    const address = (order.shipping_address ?? order.billing_address) as ShopifyAddress | undefined;
    if (!address || typeof address !== "object") throw new Error("Shopify order has no address.");
    const name = shippingName(address);
    const countryCode = text(address.country_code, 2).toUpperCase();
    const zip = text(address.zip, 20);
    const city = text(address.city, 100);
    const address1 = text(address.address1, 200);
    if (!name || countryCode !== "HU" || !zip || !city || !address1) {
        throw new Error("Shopify order has an unsupported delivery address.");
    }

    if (!Array.isArray(order.line_items) || order.line_items.length < 1 || order.line_items.length > 3) {
        throw new Error("Shopify order must contain 1–3 demo products.");
    }
    const seen = new Set<string>();
    let totalQuantity = 0;
    const products = order.line_items.map((rawLine) => {
        if (!rawLine || typeof rawLine !== "object" || Array.isArray(rawLine)) throw new Error("Invalid Shopify line item.");
        const line = rawLine as Record<string, unknown>;
        const sku = text(line.sku, 50) as keyof typeof TEST_PRODUCT_BY_SKU;
        const known = TEST_PRODUCT_BY_SKU[sku];
        const quantity = Number(line.quantity);
        if (!known || seen.has(sku) || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
            throw new Error("Shopify order contains an unsupported product.");
        }
        seen.add(sku);
        totalQuantity += quantity;
        return {
            sku,
            productName: known.productName,
            variantName: text(line.variant_title, 100) || "Alapváltozat",
            priceGross: known.priceGross,
            vat: 0.27,
            quantity,
        };
    });
    if (totalQuantity > 20) throw new Error("Shopify order contains too many products.");

    const shippingSet = (order.current_total_shipping_price_set ?? order.total_shipping_price_set) as Record<string, unknown> | undefined;
    const shopMoney = shippingSet?.shop_money as Record<string, unknown> | undefined;
    return {
        referenceId,
        referenceName,
        createdAt: webshippyDate(order.created_at),
        shipping: {
            name: `QA TESZT - ${name}`.slice(0, 200),
            email: text(order.email, 200) || undefined,
            phone: text(address.phone ?? order.phone, 50) || undefined,
            countryCode,
            zip,
            city,
            address1,
            address2: text(address.address2, 200) || undefined,
            mode: "GLS-HU",
            note: "AUTOMATIKUS SHOPIFY TESZT - TILOS TELJESÍTENI VAGY FELADNI",
        },
        payment: {
            paymentMode: "card",
            paymentStatus: "pending",
            shippingPrice: money(shopMoney?.amount),
            shippingVat: 0.27,
            currency: "HUF",
            discount: money(order.current_total_discounts),
        },
        products,
    };
}

export function safeWebshippyResult(payload: unknown) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Invalid Webshippy response.");
    const result = payload as Record<string, unknown>;
    if (result.status !== "success") throw new Error("Webshippy rejected the Shopify order.");
    const wspyId = String(result.wspyId ?? "");
    if (!/^\d+$/.test(wspyId)) throw new Error("Webshippy did not return an order ID.");
    return { wspyId };
}

type WebshippyOrderRecord = {
    wspyId: string;
    referenceId: string;
    referenceName: string;
    status: string;
};

function safeWebshippyOrders(payload: unknown): WebshippyOrderRecord[] {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Invalid Webshippy response.");
    const envelope = payload as Record<string, unknown>;
    if (envelope.status !== "success" || !Array.isArray(envelope.result)) throw new Error("Webshippy order lookup failed.");
    return envelope.result.map((raw) => {
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Invalid Webshippy order.");
        const record = raw as Record<string, unknown>;
        const wspyId = String(record.wspyId ?? "");
        if (!/^\d+$/.test(wspyId)) throw new Error("Invalid Webshippy order ID.");
        return {
            wspyId,
            referenceId: String(record.referenceId ?? ""),
            referenceName: String(record.referenceName ?? ""),
            status: String(record.status ?? ""),
        };
    });
}

function safeWebshippyDelete(payload: unknown) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Invalid Webshippy response.");
    if ((payload as Record<string, unknown>).status !== "success") throw new Error("Webshippy did not delete the order.");
}

async function webshippyRequest(
    fetchProvider: typeof fetch,
    apiKey: string,
    action: string,
    input: Record<string, unknown>,
) {
    const body = new URLSearchParams({ request: JSON.stringify({ apiKey, ...input }) });
    const response = await fetchProvider(`${WEBSHIPPY_API_URL}/${action}/json`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body,
        signal: AbortSignal.timeout(4_000),
    });
    if (!response.ok) throw new Error("Webshippy unavailable.");
    return response.json() as Promise<unknown>;
}

async function findWebshippyOrder(
    fetchProvider: typeof fetch,
    apiKey: string,
    referenceId: string,
    referenceName: string,
) {
    const payload = await webshippyRequest(fetchProvider, apiKey, "GetOrder", {
        page: 0,
        limit: 10,
        filters: { referenceName },
    });
    const legacyReferenceId = `shopify-${referenceId}`;
    const matches = safeWebshippyOrders(payload).filter((order) =>
        order.referenceName === referenceName &&
        (order.referenceId === referenceId || order.referenceId === legacyReferenceId),
    );
    if (matches.length > 1) throw new Error("Duplicate Webshippy orders require manual review.");
    return matches[0] ?? null;
}

function shopifyOrderIdentity(payload: unknown) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Invalid Shopify order.");
    const order = payload as Record<string, unknown>;
    if (order.test !== true) return null;
    const orderId = text(String(order.id ?? order.order_id ?? ""), 30);
    if (!/^\d{1,30}$/.test(orderId)) throw new Error("Invalid Shopify order ID.");
    return {
        referenceId: orderId,
        referenceName: `[TESZT] Shopify ${text(order.name, 30) || orderId}`,
    };
}

type ShopifyBridgeEnv = {
    SHOPIFY_WEBHOOK_SECRET?: string;
    WEBSHIPPY_API_KEY?: string;
    WEBSHIPPY_WRITE_MODE?: string;
};

const responseHeaders = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
};

function json(body: Record<string, unknown>, status = 200) {
    return Response.json(body, { status, headers: responseHeaders });
}

async function readBoundedBody(request: Request) {
    const lengthHeader = request.headers.get("content-length");
    if (lengthHeader !== null) {
        const declaredLength = Number(lengthHeader);
        if (!Number.isInteger(declaredLength) || declaredLength < 0 || declaredLength > SHOPIFY_WEBHOOK_BODY_LIMIT) {
            throw new RangeError("Invalid payload length.");
        }
    }

    if (!request.body) return new Uint8Array();
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > SHOPIFY_WEBHOOK_BODY_LIMIT) {
            await reader.cancel();
            throw new RangeError("Payload too large.");
        }
        chunks.push(value);
    }
    const body = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        body.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return body;
}

export async function handleShopifyPaidWebhook(
    request: Request,
    runtimeEnv: ShopifyBridgeEnv,
    fetchProvider: typeof fetch = fetch,
) {
    const secret = runtimeEnv.SHOPIFY_WEBHOOK_SECRET?.trim();
    const apiKey = runtimeEnv.WEBSHIPPY_API_KEY?.trim();
    if (!secret || !apiKey || runtimeEnv.WEBSHIPPY_WRITE_MODE !== "test") {
        return json({ error: "Bridge unavailable." }, 503);
    }

    let rawBytes: Uint8Array;
    try {
        rawBytes = await readBoundedBody(request);
    } catch (cause) {
        if (cause instanceof RangeError) return json({ error: "Payload too large." }, 413);
        return json({ error: "Invalid payload." }, 400);
    }
    if (!await verifyShopifyWebhook(rawBytes, request.headers.get("x-shopify-hmac-sha256") ?? "", secret)) {
        return json({ error: "Invalid signature." }, 401);
    }

    let webhookId = "";
    let order: ReturnType<typeof buildWebshippyTestOrderFromShopify>;
    try {
        ({ webhookId } = validateShopifyWebhookHeaders(request.headers));
        const rawBody = new TextDecoder("utf-8", { fatal: true }).decode(rawBytes);
        order = buildWebshippyTestOrderFromShopify(JSON.parse(rawBody));
    } catch (cause) {
        const message = cause instanceof Error ? cause.message : "Invalid webhook.";
        if (message === "Shopify order has an unsupported delivery address.") {
            return json({ error: "Unsupported delivery country." }, 422);
        }
        return json({ accepted: true, skipped: message });
    }
    if (!order) return json({ accepted: true, skipped: "non-test-order", webhookId });

    try {
        const existing = await findWebshippyOrder(fetchProvider, apiKey, order.referenceId, order.referenceName);
        if (existing) {
            return json({
                accepted: true,
                webhookId,
                referenceId: order.referenceId,
                wspyId: existing.wspyId,
                existing: true,
            });
        }
        const result = safeWebshippyResult(await webshippyRequest(fetchProvider, apiKey, "CreateOrder", { order }));
        return json({ accepted: true, webhookId, referenceId: order.referenceId, ...result });
    } catch {
        return json({ error: "Webshippy unavailable." }, 503);
    }
}

export async function handleShopifyCancelledWebhook(
    request: Request,
    runtimeEnv: ShopifyBridgeEnv,
    fetchProvider: typeof fetch = fetch,
) {
    const secret = runtimeEnv.SHOPIFY_WEBHOOK_SECRET?.trim();
    const apiKey = runtimeEnv.WEBSHIPPY_API_KEY?.trim();
    if (!secret || !apiKey || runtimeEnv.WEBSHIPPY_WRITE_MODE !== "test") {
        return json({ error: "Bridge unavailable." }, 503);
    }

    let rawBytes: Uint8Array;
    try {
        rawBytes = await readBoundedBody(request);
    } catch (cause) {
        if (cause instanceof RangeError) return json({ error: "Payload too large." }, 413);
        return json({ error: "Invalid payload." }, 400);
    }
    if (!await verifyShopifyWebhook(rawBytes, request.headers.get("x-shopify-hmac-sha256") ?? "", secret)) {
        return json({ error: "Invalid signature." }, 401);
    }

    let webhookId = "";
    let identity: ReturnType<typeof shopifyOrderIdentity>;
    try {
        ({ webhookId } = validateShopifyWebhookHeaders(request.headers, SHOPIFY_CANCELLED_TOPIC));
        const rawBody = new TextDecoder("utf-8", { fatal: true }).decode(rawBytes);
        identity = shopifyOrderIdentity(JSON.parse(rawBody));
    } catch (cause) {
        const message = cause instanceof Error ? cause.message : "Invalid webhook.";
        return json({ accepted: true, skipped: message });
    }
    if (!identity) return json({ accepted: true, skipped: "non-test-order", webhookId });

    try {
        const existing = await findWebshippyOrder(
            fetchProvider,
            apiKey,
            identity.referenceId,
            identity.referenceName,
        );
        if (!existing) {
            return json({ accepted: true, webhookId, referenceId: identity.referenceId, alreadyAbsent: true });
        }
        if (existing.status !== "new" && existing.status !== "draft") {
            return json({ error: "Webshippy order can no longer be cancelled automatically." }, 409);
        }
        safeWebshippyDelete(await webshippyRequest(fetchProvider, apiKey, "deleteOrder", {
            filters: { wspyId: Number(existing.wspyId) },
        }));
        return json({
            accepted: true,
            webhookId,
            referenceId: identity.referenceId,
            wspyId: existing.wspyId,
            deleted: true,
        });
    } catch {
        return json({ error: "Webshippy unavailable." }, 503);
    }
}
