import type { APIRoute } from "astro";
import storefrontHandler from "../../../toolkit/commerce-shopify/server/storefront.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    const responseHeaders = new Headers();
    let responseStatus = 200;
    let responseBody: unknown = { error: "Storefront returned no response." };

    const responseAdapter = {
        setHeader(name: string, value: string) {
            responseHeaders.set(name, value);
        },
        status(code: number) {
            responseStatus = code;
            return responseAdapter;
        },
        json(body: unknown) {
            responseBody = body;
            return body;
        },
    };

    await storefrontHandler(
        {
            method: request.method,
            headers: {
                "content-length": request.headers.get("content-length") ?? undefined,
            },
            body: await request.text(),
        },
        responseAdapter,
    );

    return Response.json(responseBody, {
        status: responseStatus,
        headers: responseHeaders,
    });
};

export const ALL: APIRoute = () =>
    Response.json(
        { error: "Method not allowed." },
        {
            status: 405,
            headers: {
                Allow: "POST",
                "Cache-Control": "no-store",
            },
        },
    );
