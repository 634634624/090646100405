import type { APIRoute } from "astro";

export const prerender = false;

const retired: APIRoute = () => Response.json(
    { error: "This storefront endpoint has been retired." },
    {
        status: 410,
        headers: {
            "Cache-Control": "no-store",
            "Content-Type": "application/json; charset=utf-8",
        },
    },
);

export const GET = retired;
export const POST = retired;
export const ALL = retired;
