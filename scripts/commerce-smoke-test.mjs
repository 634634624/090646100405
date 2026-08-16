#!/usr/bin/env node
import { commerceConfig, publicCommerceStatus } from "../src/integrations/commerce/config.ts";

const config = commerceConfig(process.env);
console.log(JSON.stringify(publicCommerceStatus(config), null, 2));
if (config.mode !== "mock") throw new Error("This smoke test is intentionally read-only and mock-only.");
if (config.liveWriteEnabled) throw new Error("Mock smoke test refuses enabled live writes.");
console.log("Mock mode OK: no provider request was sent.");
