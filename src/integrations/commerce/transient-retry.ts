export class UpstreamHttpError extends Error {
    readonly provider: string;
    readonly status: number;
    readonly retryAfterMs: number;

    constructor(provider: string, status: number, retryAfter: string | null = null) {
        super(`${provider} HTTP ${status}`);
        this.name = "UpstreamHttpError";
        this.provider = provider;
        this.status = status;
        this.retryAfterMs = retryAfterMilliseconds(retryAfter);
    }
}

const TRANSIENT_HTTP_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

export function retryAfterMilliseconds(value: string | null, now = Date.now()) {
    if (value === null) return 0;
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) return Math.min(Number(trimmed) * 1_000, 10_000);
    const retryAt = Date.parse(trimmed);
    return Number.isFinite(retryAt) ? Math.min(Math.max(retryAt - now, 0), 10_000) : 0;
}

export function isTransientUpstreamError(cause: unknown) {
    if (cause instanceof UpstreamHttpError) return TRANSIENT_HTTP_STATUSES.has(cause.status);
    if (cause instanceof DOMException) return cause.name === "AbortError" || cause.name === "TimeoutError";
    return cause instanceof TypeError;
}

export interface TransientRetryOptions {
    attempts?: number;
    baseDelayMs?: number;
    sleep?: (delayMs: number) => Promise<void>;
}

const defaultSleep = (delayMs: number) => new Promise<void>((resolve) => setTimeout(resolve, delayMs));

export async function withTransientRetry<T>(
    operation: () => Promise<T>,
    { attempts = 3, baseDelayMs = 250, sleep = defaultSleep }: TransientRetryOptions = {},
) {
    if (!Number.isSafeInteger(attempts) || attempts < 1 || attempts > 5) {
        throw new RangeError("A retry attempts értéke 1 és 5 között lehet.");
    }
    if (!Number.isFinite(baseDelayMs) || baseDelayMs < 0 || baseDelayMs > 2_000) {
        throw new RangeError("A retry késleltetése érvénytelen.");
    }

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            return await operation();
        } catch (cause) {
            if (attempt === attempts || !isTransientUpstreamError(cause)) throw cause;
            const providerDelay = cause instanceof UpstreamHttpError ? cause.retryAfterMs : 0;
            await sleep(Math.min(Math.max(baseDelayMs * (2 ** (attempt - 1)), providerDelay), 2_000));
        }
    }

    throw new Error("A szolgáltatói kérés nem futott le.");
}
