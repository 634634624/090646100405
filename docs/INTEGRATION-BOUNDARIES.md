# Integration boundaries

## Current local state

- Catalog: internal demo seed in `src/data/demo-catalog.ts`.
- Cart: local browser storage.
- Checkout: disabled provider handoff with a visible safe error.
- Measurement: consent-safe hooks, inactive without both consent and a public identifier.
- Webshippy: validated import contract; no live request or order mutation.
- Dressa and DropshippingXL: inactive future adapters.

## Webshippy handoff

Map supplier records to `SupplierProductRecord` in
`src/integrations/providers/contracts.ts`. Validate the complete response before replacing the
visible catalog. Import must be idempotent by `externalId` and `sku`. Never publish a product
without title, non-negative HUF price, stock state, and a local approved image.

Order submission stays disabled until the owner approves the exact Webshippy contract, warehouse,
delivery methods, return ownership, customer-service ownership, retry policy, and reconciliation.

## Checkout handoff

The storefront must send cart lines to a separately approved server endpoint. The browser never
receives provider secrets. The endpoint returns one HTTPS checkout URL from an allow-listed host.
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
- Approved checkout provider, server endpoint, allow-listed host, and test credentials.
- Final product feed, stock, images, consumer prices, delivery fees, and warranty data.
- Domain, canonical URLs, production metadata, monitoring, rollback, and deployment approval.
