declare module "cloudflare:workers" {
    export const env: {
        SHOPIFY_WEBHOOK_SECRET?: string;
        WEBSHIPPY_API_KEY?: string;
        WEBSHIPPY_WRITE_MODE?: string;
    };
}
