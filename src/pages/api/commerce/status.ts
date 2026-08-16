import type { APIRoute } from "astro";
import { commerceConfig, publicCommerceStatus } from "@/integrations/commerce/config";

export const prerender = false;
export const GET: APIRoute = () => Response.json({
    ...publicCommerceStatus(commerceConfig(import.meta.env)),
    storefrontCatalog: "shopify-ucp",
    storefrontCheckout: "shopify-ucp",
    storefrontProducts: 3,
    webshippyConnection: "shopify-connector",
}, { headers: { "Cache-Control": "no-store" } });
