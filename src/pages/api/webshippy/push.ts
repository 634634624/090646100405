import type { APIRoute } from "astro";
import { commerceConfig } from "@/integrations/commerce/config";

export const prerender = false;
const sameSecret = async (given: string, expected: string) => {
    const encode = (value: string) => new TextEncoder().encode(value);
    const [leftHash, rightHash] = await Promise.all([
        crypto.subtle.digest("SHA-256", encode(given)),
        crypto.subtle.digest("SHA-256", encode(expected)),
    ]);
    const left = new Uint8Array(leftHash); const right = new Uint8Array(rightHash);
    let difference = 0;
    for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
    return difference === 0;
};
export const POST: APIRoute = async ({ request }) => {
    const config = commerceConfig(import.meta.env);
    const expected = config.webshippy?.pushSecret;
    if (!expected || !(await sameSecret(request.headers.get("x-webshippy-secret") ?? "", expected))) return Response.json({ error: "Unauthorized." }, { status: 401 });
    const payload = await request.json().catch(() => null);
    if (!payload || typeof payload !== "object") return Response.json({ error: "Invalid payload." }, { status: 400 });
    return Response.json({ accepted: true });
};
