import type { APIRoute } from "astro";
import { DEPLOYED_COMMERCE_STATUS } from "@/integrations/commerce/deployed-status";

export const prerender = false;
export const GET: APIRoute = () => Response.json({
    ...DEPLOYED_COMMERCE_STATUS,
}, { headers: { "Cache-Control": "no-store" } });
