import type { StorefrontOperation } from "../lib/contracts";

const MAX_BODY_BYTES = 64 * 1024;
const DOMAIN = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;
const API_VERSION = /^\d{4}-(01|04|07|10)$/;

interface ApiRequest {
    method?: string;
    headers?: Record<string, string | string[] | undefined>;
    body?: unknown;
}

interface ApiResponse {
    setHeader(name: string, value: string): void;
    status(code: number): ApiResponse;
    json(body: unknown): unknown;
}

const MONEY = "amount currencyCode";
const IMAGE = "url altText width height";
const PRODUCT = `
  fragment StorefrontProduct on Product {
    id handle title description productType tags
    featuredImage { ${IMAGE} }
    images(first: 8) { nodes { ${IMAGE} } }
    variants(first: 100) {
      nodes {
        id title availableForSale quantityAvailable
        selectedOptions { name value }
        price { ${MONEY} }
        compareAtPrice { ${MONEY} }
      }
    }
    priceRange {
      minVariantPrice { ${MONEY} }
      maxVariantPrice { ${MONEY} }
    }
  }
`;
const CART = `
  fragment StorefrontCart on Cart {
    id checkoutUrl totalQuantity
    cost {
      subtotalAmount { ${MONEY} }
      totalAmount { ${MONEY} }
    }
    lines(first: 100) {
      nodes {
        id quantity
        cost {
          amountPerQuantity { ${MONEY} }
          totalAmount { ${MONEY} }
        }
        merchandise {
          ... on ProductVariant {
            id title
            image { ${IMAGE} }
            product { handle title }
          }
        }
      }
    }
  }
`;

const OPERATIONS: Record<StorefrontOperation, string> = {
    products: `
      ${PRODUCT}
      query Products($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys, $reverse: Boolean) {
        products(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
          nodes { ...StorefrontProduct }
          pageInfo { hasNextPage endCursor }
        }
      }
    `,
    product: `
      ${PRODUCT}
      query Product($handle: String!) {
        product(handle: $handle) { ...StorefrontProduct }
      }
    `,
    cart: `
      ${CART}
      query Cart($id: ID!) { cart(id: $id) { ...StorefrontCart } }
    `,
    cartCreate: `
      ${CART}
      mutation CartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart { ...StorefrontCart }
          userErrors { field message code }
          warnings { code message }
        }
      }
    `,
    cartLinesAdd: `
      ${CART}
      mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart { ...StorefrontCart }
          userErrors { field message code }
          warnings { code message target }
        }
      }
    `,
    cartLinesUpdate: `
      ${CART}
      mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) {
          cart { ...StorefrontCart }
          userErrors { field message code }
          warnings { code message target }
        }
      }
    `,
    cartLinesRemove: `
      ${CART}
      mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
          cart { ...StorefrontCart }
          userErrors { field message code }
          warnings { code message target }
        }
      }
    `,
};

function normalizedEnvironment() {
    const environment =
        (
            globalThis as typeof globalThis & {
                process?: { env?: Record<string, string | undefined> };
            }
        ).process?.env ?? {};
    const storeDomain = (environment.SHOPIFY_STORE_DOMAIN ?? "")
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/\/+$/, "");
    const token = (environment.SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? "").trim();
    const apiVersion = (environment.SHOPIFY_API_VERSION ?? "").trim();
    if (!DOMAIN.test(storeDomain) || token.length < 8 || !API_VERSION.test(apiVersion)) {
        return null;
    }
    return { storeDomain, token, apiVersion };
}

function isOperation(value: unknown): value is StorefrontOperation {
    return typeof value === "string" && Object.hasOwn(OPERATIONS, value);
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Content-Type", "application/json; charset=utf-8");

    if (request.method !== "POST") {
        response.setHeader("Allow", "POST");
        return response.status(405).json({ error: "Method not allowed." });
    }
    if (Number(request.headers?.["content-length"] || 0) > MAX_BODY_BYTES) {
        return response.status(413).json({ error: "Request body is too large." });
    }

    const config = normalizedEnvironment();
    if (!config) {
        return response.status(503).json({ error: "Shopify is not configured." });
    }

    let body: { operation?: unknown; variables?: unknown };
    try {
        body =
            typeof request.body === "string"
                ? JSON.parse(request.body)
                : ((request.body ?? {}) as { operation?: unknown; variables?: unknown });
    } catch {
        return response.status(400).json({ error: "Invalid JSON body." });
    }
    if (!isOperation(body.operation)) {
        return response.status(400).json({ error: "Unsupported storefront operation." });
    }
    if (
        body.variables !== undefined &&
        (body.variables === null ||
            typeof body.variables !== "object" ||
            Array.isArray(body.variables))
    ) {
        return response.status(400).json({ error: "Invalid storefront variables." });
    }

    try {
        const shopifyResponse = await fetch(
            `https://${config.storeDomain}/api/${config.apiVersion}/graphql.json`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Storefront-Access-Token": config.token,
                },
                body: JSON.stringify({
                    query: OPERATIONS[body.operation],
                    variables: body.variables ?? {},
                }),
            },
        );
        const payload = (await shopifyResponse.json().catch(() => null)) as
            | { data?: unknown; errors?: Array<{ message?: string }> }
            | null;
        if (!shopifyResponse.ok || !payload?.data || payload.errors?.length) {
            return response.status(502).json({ error: "Storefront request failed." });
        }
        return response.status(200).json({ data: payload.data });
    } catch {
        return response.status(502).json({ error: "Storefront request failed." });
    }
}
