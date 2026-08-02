export type ConsentState = { analytics: boolean; marketing: boolean };
export type StoreEvent =
    | { name: "view_item"; itemId: string; value: number; currency: "HUF" }
    | { name: "add_to_cart"; itemId: string; value: number; currency: "HUF" }
    | { name: "begin_checkout"; value: number; currency: "HUF" }
    | { name: "search"; term: string };

const CONSENT_KEY = "valogatott-consent-v1";
export function readConsent(): ConsentState {
    if (typeof window === "undefined") return { analytics: false, marketing: false };
    try {
        const value = JSON.parse(window.localStorage.getItem(CONSENT_KEY) ?? "null") as ConsentState | null;
        return value && typeof value.analytics === "boolean" && typeof value.marketing === "boolean" ? value : { analytics: false, marketing: false };
    } catch { return { analytics: false, marketing: false }; }
}
export function saveConsent(state: ConsentState) { window.localStorage.setItem(CONSENT_KEY, JSON.stringify(state)); }
export function emitStoreEvent(event: StoreEvent) {
    if (typeof window === "undefined") return;
    const consent = readConsent();
    const analyticsConfigured = Boolean(import.meta.env.PUBLIC_GOOGLE_MEASUREMENT_ID);
    const marketingConfigured = Boolean(import.meta.env.PUBLIC_META_PIXEL_ID || import.meta.env.PUBLIC_TIKTOK_PIXEL_ID);
    if ((consent.analytics && analyticsConfigured) || (consent.marketing && marketingConfigured)) {
        const queue = ((window as typeof window & { dataLayer?: unknown[] }).dataLayer ??= []);
        queue.push({ event: event.name, ecommerce: event });
    }
}
