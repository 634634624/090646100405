# Shopify + Webshippy integration

## Runtime architecture

`Astro storefront -> server-only /api/checkout -> Shopify Storefront API -> Shopify hosted checkout -> Webshippy fulfillment`

- Browser code never receives Shopify or Webshippy credentials.
- The cart contains local product IDs only. The server revalidates quantity, price source and stock cap against the trusted catalog.
- Shopify `cartCreate` returns the HTTPS hosted checkout URL. Card data never crosses this application.
- Webshippy requests follow the official form contract: POST field `request` contains the JSON payload.
- `COMMERCE_MODE=mock` is the default and makes no provider request.

## Test 1-3 products

1. Copy `.env.example` to the deployment secret store; do not commit values.
2. Set Shopify domain, Storefront token and `SHOPIFY_VARIANT_MAP_JSON` (SKU -> ProductVariant GID).
3. Set Webshippy API key and `WEBSHIPPY_TEST_BARCODES_JSON` (SKU -> barcode).
4. Start with `COMMERCE_MODE=live` and `COMMERCE_LIVE_WRITE_ENABLED=false`.
5. Run `npm run commerce:smoke` for Shopify shop + Webshippy product/stock reads.
6. Only after the read test passes, set `COMMERCE_LIVE_WRITE_ENABLED=true` and run `npm run commerce:smoke -- --write-products`. This upserts exactly the three `DEMO-TECH-*` records by SKU.
7. Put those three Shopify variant GIDs into the map and test `/checkout` with one, two and three cart lines.

## Duplicate-order guard

Default: `WEBSHIPPY_ORDER_OWNER=shopify-connector`. Shopify's Webshippy connector owns fulfillment, so custom code must not call `CreateOrder` for the same purchase.

Use `WEBSHIPPY_ORDER_OWNER=webshippy-api` only if the native connector is disabled and an approved paid-order webhook is the sole writer. Webshippy `referenceId` is the idempotency key. This repository exposes no public order-write endpoint.

## Available contracts

- Shopify: Storefront GraphQL, `cartCreate`, HTTPS checkout validation.
- Webshippy: `GetProduct`, `CreateProduct`, `getStockInfoCsv`, `GetOrder`, `CreateOrder`, `getTrackInfo` and authenticated push receiver.
- Push URL: configure `/api/webshippy/push`; the provider must send `x-webshippy-secret`. If Webshippy cannot configure that header, place a secret-preserving gateway in front of the endpoint before live use.
- Health (no secrets): `/api/commerce/status`.

## Launch blockers

Test credentials, three real SKUs/barcodes, Shopify variant GIDs, approved product data, shipping rules, legal/company data, Webshippy channel contract, selected order owner, deployment and rollback approval. Production writes and deployment remain separate approvals.
