export class UpstreamHttpError extends Error {
    readonly status: number;

    constructor(provider: string, status: number) {
        super(`${provider} HTTP ${status}`);
        this.name = "UpstreamHttpError";
        this.status = status;
    }
}

const TRANSIENT_HTTP_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

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
    { attempts = 3, baseDelayMs = 100, sleep = defaultSleep }: TransientRetryOptions = {},
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
            await sleep(Math.min(baseDelayMs * (2 ** (attempt - 1)), 2_000));
        }
    }

    throw new Error("A szolgáltatói kérés nem futott le.");
}
