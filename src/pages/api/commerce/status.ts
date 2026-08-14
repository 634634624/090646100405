import type { APIRoute } from "astro";
import { commerceConfig, publicCommerceStatus } from "@/integrations/commerce/config";

export const prerender = false;
export const GET: APIRoute = () => Response.json(publicCommerceStatus(commerceConfig(import.meta.env)), { headers: { "Cache-Control": "no-store" } });
