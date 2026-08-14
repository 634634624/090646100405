#!/usr/bin/env node
import { commerceConfig, publicCommerceStatus } from "../src/integrations/commerce/config.ts";
import { shopifyGraphql } from "../src/integrations/commerce/shopify.ts";
import { getWebshippyOrder, getWebshippyProducts, getWebshippyStock, getWebshippyTracking, upsertWebshippyProduct } from "../src/integrations/commerce/webshippy.ts";

const config = commerceConfig(process.env);
const writeProducts = process.argv.includes("--write-products");
const testProducts = [
    { externalId: "bestcartrade-demo-1", sku: "DEMO-TECH-001", title: "Otthoni zene alapcsomag", description: "Integration test product 1", category: "Muszaki", priceHuf: 89990, stock: 8, imageUrls: [], updatedAt: new Date(0).toISOString() },
    { externalId: "bestcartrade-demo-2", sku: "DEMO-TECH-002", title: "Kompakt sztereo csomag", description: "Integration test product 2", category: "Muszaki", priceHuf: 119990, stock: 3, imageUrls: [], updatedAt: new Date(0).toISOString() },
    { externalId: "bestcartrade-demo-3", sku: "DEMO-TECH-003", title: "Olvasosarok fenycsomag", description: "Integration test product 3", category: "Muszaki", priceHuf: 18990, stock: 7, imageUrls: [], updatedAt: new Date(0).toISOString() },
];

console.log(JSON.stringify(publicCommerceStatus(config), null, 2));
if (config.mode !== "live") {
    console.log("Mock mode OK: no provider request was sent.");
    process.exit(0);
}
if (config.shopify) {
    const data = await shopifyGraphql(config.shopify, `query SmokeShop { shop { name primaryDomain { url } } }`, {});
    console.log(`Shopify read OK: ${data.shop?.name ?? "unnamed shop"}`);
}
if (config.webshippy) {
    const provider = { baseUrl: config.webshippy.baseUrl, apiKey: config.webshippy.apiKey };
    await getWebshippyProducts(provider);
    console.log("Webshippy product read OK.");
    await getWebshippyStock(provider);
    console.log("Webshippy stock read OK.");
    if (process.env.TEST_ORDER_REFERENCE_ID) {
        await getWebshippyOrder(provider, process.env.TEST_ORDER_REFERENCE_ID);
        console.log("Webshippy order read OK.");
    }
    if (process.env.TEST_ORDER_WEBSHIPPY_ID) {
        await getWebshippyTracking(provider, process.env.TEST_ORDER_WEBSHIPPY_ID);
        console.log("Webshippy tracking read OK.");
    }
    if (writeProducts) {
        if (!config.liveWriteEnabled) throw new Error("Set COMMERCE_LIVE_WRITE_ENABLED=true before --write-products.");
        for (const product of testProducts) {
            const barcode = config.webshippy.barcodeBySku[product.sku];
            if (!barcode) throw new Error(`Missing barcode for ${product.sku}.`);
            await upsertWebshippyProduct(provider, product, barcode);
            console.log(`Webshippy product upsert OK: ${product.sku}`);
        }
    }
}
if (!config.shopify && !config.webshippy) throw new Error("Live mode has no configured provider.");
