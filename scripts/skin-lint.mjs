#!/usr/bin/env node
// skin-var-only-lint — the skin files may contain ONLY var() references.
// Contract rule 3: colors exist solely as ramp-stop var()s; raw color
// literals (hex/rgb/hsl/oklch/named) are a failed gate. Whitelisted:
// #ffffff/#000000 exclusively as a base-white/base-black var() FALLBACK.
// Scope: this client's skin files only (never applied retroactively to
// other repos — see the enforcement post-mortem).
import { readFileSync } from "node:fs";
import { globSync } from "node:fs";

const files = (globSync ? globSync("src/styles/uu/brand-*.css") : ["src/styles/uu/brand-warm.css"]);
const NAMED = /\b(?:white|black|red|green|blue|gray|grey|orange|purple|pink|yellow|teal|cyan|magenta|silver|maroon|navy|olive|lime|aqua|fuchsia)\b/i;
const LITERAL = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/;
let failures = [];

for (const file of files) {
    // blank out /* ... */ comments (keeping newlines → line numbers stay true)
    const source = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, (m) =>
        m.replace(/[^\n]/g, " "),
    );
    const lines = source.split("\n");
    lines.forEach((line, i) => {
        const decl = line;
        if (!decl.includes(":")) return;
        // remove whitelisted base fallbacks, then every var() ref
        let value = decl
            .replace(/var\(--color-base-white,\s*#f{3,6}\)/gi, "")
            .replace(/var\(--color-base-black,\s*#0{3,6}\)/gi, "")
            .replace(/var\(--[a-z0-9-]+\)/gi, "");
        if (LITERAL.test(value)) {
            failures.push(`${file}:${i + 1}: ${line.trim().slice(0, 90)}`);
        } else if (NAMED.test(value) && !/--color-|@utility|color-mix/.test(decl.split(":")[0])) {
            // named colors as VALUES fail; ramp names inside property names are fine
            const v = value.split(":").slice(1).join(":");
            if (NAMED.test(v) && !/transparent|currentColor/i.test(v)) {
                failures.push(`${file}:${i + 1}: named color — ${line.trim().slice(0, 90)}`);
            }
        }
    });
}

if (failures.length) {
    console.error(`SKIN LINT FAIL (${failures.length}):`);
    failures.forEach((f) => console.error("  " + f));
    process.exit(1);
}
console.log(`SKIN LINT PASS — ${files.length} skin file(s), 0 raw color literal`);
