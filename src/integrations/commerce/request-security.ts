const textEncoder = new TextEncoder();

type CommerceCoordinatorStub = {
    allow(scope: string, limit: number, periodMs: number): Promise<boolean>;
};

export type CommerceCoordinatorNamespace = {
    getByName(name: string): CommerceCoordinatorStub;
};

export async function readBoundedText(request: Request, maxBytes: number) {
    const lengthHeader = request.headers.get("content-length");
    if (lengthHeader !== null) {
        const declaredLength = Number(lengthHeader);
        if (!Number.isInteger(declaredLength) || declaredLength < 0 || declaredLength > maxBytes) {
            throw new RangeError("Invalid payload length.");
        }
    }

    if (!request.body) return "";
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > maxBytes) {
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
    return new TextDecoder("utf-8", { fatal: true }).decode(body);
}

async function requestActorKey(request: Request) {
    const forwarded = request.headers.get("cf-connecting-ip")
        ?? request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim()
        ?? "unknown";
    const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(forwarded));
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function commerceRequestAllowed(
    namespace: CommerceCoordinatorNamespace | undefined,
    request: Request,
    scope: "catalog" | "checkout",
    limit: number,
) {
    if (!namespace) return false;
    const actorKey = await requestActorKey(request);
    return namespace.getByName(`rate:${actorKey}`).allow(scope, limit, 60_000);
}

export function canonicalCatalogRequest(request: Request) {
    const url = new URL(request.url);
    url.search = "";
    url.hash = "";
    return new Request(url, { method: "GET" });
}
