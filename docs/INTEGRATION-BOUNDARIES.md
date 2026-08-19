# Integration boundaries

## Current local state

- Catalog: three pinned demo SKUs, refreshed read-only from Shopify UCP with a checked local fallback.
- Cart: local browser storage; quantities are revalidated by Shopify before checkout.
- Checkout: server-side, tokenless Shopify UCP cart handoff. The browser receives only an allow-listed Shopify URL.
- Measurement: consent-safe hooks, inactive without both consent and a public identifier.
- Webshippy: Shopify connector owns product/order synchronization; Astro never duplicates the order write.
- Dressa and DropshippingXL: inactive future adapters.

## Webshippy handoff

Map supplier records to `SupplierProductRecord` in
`src/integrations/providers/contracts.ts`. Validate the complete response before replacing the
visible catalog. Import must be idempotent by `externalId` and `sku`. Never publish a product
without title, non-negative HUF price, stock state, and a local approved image.

Astro must not submit the same order directly to Webshippy while the Shopify connector owns the
handoff. This prevents duplicate fulfillment.

## Checkout handoff

The storefront sends only the three allow-listed Shopify variant IDs and bounded quantities to the
server endpoint. The browser never receives provider secrets. The endpoint returns one HTTPS
checkout URL from the exact Shopify store host.
Failure leaves the local cart intact and shows a Hungarian recovery message.

## Measurement

`src/integrations/measurement.ts` sends no event before consent. Meta, Google, and TikTok identifiers
remain empty by default. Campaign activation, audience creation, and advertising spend are outside
this repository.

## Promotion workflow

`STORE.promotion.featuredHandle` selects the homepage promotion target. Product data also carries
`featured` and `trending` tags. A later video workflow can read the selected product and build a
promotion brief without changing page composition.

## Launch blockers

- Final company address, company registration number, tax number, official e-mail, and phone.
- Approved ÁSZF and privacy text.
- Supplier contract, exact catalog schema, warehouse, delivery, return, support, and order rules.
- Remove the Shopify development-store password before public checkout can be used without a login.
- Recheck the Hungarian market and International Shipping settings before launch.
- Final product feed, stock, images, consumer prices, delivery fees, and warranty data.
- Domain, canonical URLs, production metadata, monitoring, rollback, and deployment approval.
