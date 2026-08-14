import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
// Node adapter keeps prerendered pages and browser assets under dist/client.
const dist = path.join(root, "dist", "client");
const artifactRoot = path.join(root, "artifacts", "web-build-qa");
const viewports = [
    { name: "mobile", width: 375, height: 812 },
    { name: "compact", width: 560, height: 900 },
    { name: "desktop", width: 1440, height: 900 },
];
const themes = ["light", "dark"];
const contentTypes = new Map([
    [".css", "text/css; charset=utf-8"],
    [".gif", "image/gif"],
    [".html", "text/html; charset=utf-8"],
    [".ico", "image/x-icon"],
    [".jpeg", "image/jpeg"],
    [".jpg", "image/jpeg"],
    [".js", "text/javascript; charset=utf-8"],
    [".json", "application/json; charset=utf-8"],
    [".mjs", "text/javascript; charset=utf-8"],
    [".png", "image/png"],
    [".svg", "image/svg+xml"],
    [".webp", "image/webp"],
    [".woff", "font/woff"],
    [".woff2", "font/woff2"],
]);

async function walk(directory, prefix = "") {
    const files = [];
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        if (
            entry.isDirectory() &&
            ["node_modules", ".git", ".astro", "artifacts", "vendor"].includes(entry.name)
        ) continue;
        const relative = path.posix.join(prefix, entry.name);
        if (entry.isDirectory()) files.push(...await walk(path.join(directory, entry.name), relative));
        else files.push(relative);
    }
    return files;
}

function routeForHtml(relative) {
    if (relative === "index.html") return "/";
    if (relative === "404.html") return null;
    if (relative.endsWith("/index.html")) return `/${relative.slice(0, -"/index.html".length)}/`;
    return `/${relative.slice(0, -".html".length)}`;
}

function fileForRequest(urlPath) {
    const decoded = decodeURIComponent(urlPath);
    const relative = decoded.replace(/^\/+/, "");
    const candidates = relative.endsWith("/")
        ? [`${relative}index.html`]
        : [relative, `${relative}.html`, `${relative}/index.html`];
    if (!relative) candidates.unshift("index.html");
    for (const candidate of candidates) {
        const absolute = path.resolve(dist, candidate);
        if (absolute !== dist && !absolute.startsWith(`${dist}${path.sep}`)) continue;
        try {
            if (statSyncSafe(absolute)) return absolute;
        } catch {
            // Continue through canonical static-route candidates.
        }
    }
    return null;
}

function statSyncSafe(file) {
    try {
        return requireStat(file);
    } catch {
        return false;
    }
}

function requireStat(file) {
    // Deliberately synchronous through a cached binding is unnecessary here;
    // this helper is replaced by the route manifest before the server starts.
    return servedFiles.has(file);
}

let servedFiles = new Set();

async function startStaticServer(files) {
    servedFiles = new Set(files.map((file) => path.resolve(dist, file)));
    const server = createServer(async (request, response) => {
        try {
            const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
            if (pathname === "/api/checkout" && request.method === "POST") {
                // Static browser QA uses the same side-effect-free contract as COMMERCE_MODE=mock.
                response.writeHead(200, { "cache-control": "no-store", "content-type": "application/json; charset=utf-8" });
                response.end(JSON.stringify({ mode: "mock", checkoutUrl: "/orders/demo-1001", cartId: "qa-mock-cart" }));
                return;
            }
            const file = fileForRequest(pathname);
            if (!file) {
                response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
                response.end("Not found");
                return;
            }
            const body = await readFile(file);
            response.writeHead(200, {
                "cache-control": "no-store",
                "content-type": contentTypes.get(path.extname(file)) ?? "application/octet-stream",
            });
            response.end(body);
        } catch (error) {
            response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
            response.end(error instanceof Error ? error.message : "Server error");
        }
    });
    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("static QA server did not expose a port");
    return {
        baseUrl: `http://127.0.0.1:${address.port}`,
        close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
    };
}

function routeSlug(route) {
    return route === "/" ? "home" : route.replace(/^\/|\/$/g, "").replaceAll("/", "--");
}

async function sourceFingerprint() {
    const files = (await walk(root))
        .filter((file) =>
            /^(?:src|toolkit|scripts)\/.+\.(?:astro|css|js|json|mjs|ts|tsx)$/.test(file) &&
            !file.startsWith("scripts/web-build-qa.mjs"),
        )
        .sort();
    const hash = createHash("sha256");
    for (const file of files) {
        hash.update(file);
        hash.update("\0");
        hash.update(await readFile(path.join(root, file)));
        hash.update("\0");
    }
    return `sha256:${hash.digest("hex")}`;
}

async function exerciseStorefrontInteractions(page, { route, viewport, baseUrl }) {
    const failures = [];

    if (route === "/shop/") {
        const productLinks = page.locator('a[aria-label$=" megtekintése"]');
        const productHrefs = await productLinks.evaluateAll((anchors) =>
            anchors.map((anchor) => anchor.getAttribute("href")).filter(Boolean),
        );
        if (productHrefs.length !== 6) {
            failures.push(`expected 6 linked products, found ${productHrefs.length}`);
        }
        for (const href of productHrefs) {
            await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
            await page.locator(`a[href="${href}"]`).first().click();
            await page.waitForURL((url) => url.pathname === href);
            if (new URL(page.url()).pathname !== href) {
                failures.push(`product card click did not navigate to ${href}`);
            }
        }
        await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });

        const search = page.getByPlaceholder("Név, kategória vagy cikkszám");
        await search.fill("DEMO-TECH-003");
        if (await productLinks.count() !== 1) failures.push("search did not narrow the product list to one result");
        await search.fill("");

        const categoryGroup = page.getByRole("group", { name: "Termékek szűrése kategória szerint" });
        await categoryGroup.getByRole("button", { name: "Műszaki", exact: true }).click();
        if (await productLinks.count() !== 3) failures.push("category filter did not show the three technical products");
        await categoryGroup.getByRole("button", { name: "Mind", exact: true }).click();

        const sortTrigger = page.getByLabel("Rendezés").first();
        await sortTrigger.click();
        await page.getByRole("option", { name: "Ár: növekvő" }).click();
        const firstProduct = await productLinks.first().getAttribute("href");
        if (firstProduct !== "/products/olvasosarok-fenycsomag") {
            failures.push(`price sort put ${firstProduct ?? "nothing"} first`);
        }

        const themeButton = page.getByRole("button", { name: /(?:Sötét|Világos) megjelenés/ });
        const startedDark = await page.evaluate(() => document.documentElement.classList.contains("dark-mode"));
        await themeButton.click();
        const toggledDark = await page.evaluate(() => document.documentElement.classList.contains("dark-mode"));
        if (toggledDark === startedDark) failures.push("theme switch did not change rendered theme");
        await themeButton.click();

        if (viewport.width < 768) {
            const menuButton = page.getByRole("button", { name: "Navigáció megnyitása" });
            await menuButton.click();
            const mobileNav = page.getByRole("navigation", { name: "Mobil navigáció" });
            if (!await mobileNav.isVisible()) failures.push("mobile menu did not open");
            if (!await mobileNav.getByRole("link", { name: /Kosár/ }).isVisible()) {
                failures.push("mobile menu does not expose cart navigation");
            }
            await page.keyboard.press("Tab");
            const focusInsideMenu = await page.evaluate(() =>
                document.querySelector('[aria-label="Mobil navigáció"]')?.contains(document.activeElement),
            );
            if (!focusInsideMenu) failures.push("mobile menu keyboard focus did not reach navigation");
            await page.keyboard.press("Escape");
            if (await mobileNav.isVisible()) failures.push("mobile menu did not close on Escape");
            await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
            const focusReturned = await menuButton.evaluate((element) => element === document.activeElement);
            if (!focusReturned) failures.push("mobile menu did not return focus after Escape");
        }

        await page.emulateMedia({ reducedMotion: "reduce" });
        const reducedMotion = await productLinks.first().evaluate((anchor) => {
            const style = getComputedStyle(anchor);
            return {
                matches: matchMedia("(prefers-reduced-motion: reduce)").matches,
                transitionProperty: style.transitionProperty,
            };
        });
        if (!reducedMotion.matches || reducedMotion.transitionProperty !== "none") {
            failures.push(`reduced motion not applied to product cards (${reducedMotion.transitionProperty})`);
        }
        await page.emulateMedia({ reducedMotion: "no-preference" });
    }

    if (route === "/products/otthoni-zene-csomag/") {
        const increase = page.getByRole("button", { name: "Mennyiség növelése" });
        await increase.click();
        const addButton = page.getByRole("button", { name: "Kosárba teszem" });
        await addButton.click();
        if (!await page.getByRole("button", { name: "2 darab a kosárban" }).isVisible()) {
            failures.push("product add did not expose quantity feedback");
        }
        const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem("valogatott-cart-v1") ?? "[]"));
        if (persisted[0]?.productId !== "otthoni-zene-csomag" || persisted[0]?.quantity !== 2) {
            failures.push("product add did not persist the expected cart line");
        }
        await page.evaluate(() => localStorage.removeItem("valogatott-cart-v1"));
    }

    if (route === "/cart/") {
        const increase = page.getByRole("button", { name: /Otthoni zene alapcsomag mennyiségének növelése/ });
        await increase.click();
        if (!await page.getByText("179 980 Ft", { exact: true }).last().isVisible()) failures.push("cart total did not update after quantity change");
        await page.getByRole("button", { name: "Otthoni zene alapcsomag eltávolítása" }).click();
        if (!await page.getByRole("heading", { name: "A kosár üres" }).isVisible()) failures.push("cart removal did not reveal the empty state");
        await page.evaluate(() => localStorage.setItem("valogatott-cart-v1", JSON.stringify([{ productId: "otthoni-zene-csomag", quantity: 1 }])));
        await page.reload({ waitUntil: "domcontentloaded" });
    }

    if (route === "/checkout/") {
        await Promise.all([
            page.waitForURL(/\/orders\/demo-1001\/?$/),
            page.getByRole("button", { name: "Tovább a biztonságos fizetéshez" }).click(),
        ]);
        const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem("valogatott-cart-v1") ?? "[]"));
        if (persisted.length !== 1) failures.push("checkout handoff did not preserve the cart before confirmed order completion");
    }

    if (route === "/suti-beallitasok/") {
        await page.getByRole("checkbox", { name: /Elemzési sütik/ }).locator("xpath=ancestor::label").click();
        await page.getByRole("checkbox", { name: /Hirdetési mérés/ }).locator("xpath=ancestor::label").click();
        await page.getByRole("button", { name: "Beállítások mentése" }).click();
        if (!await page.getByRole("status").getByText("A beállításokat elmentettük.").isVisible()) failures.push("consent save did not expose confirmation");
        const consentAudit = await page.evaluate(() => ({
            consent: JSON.parse(localStorage.getItem("valogatott-consent-v1") ?? "null"),
            queuedEvents: Array.isArray(window.dataLayer) ? window.dataLayer.length : 0,
        }));
        if (!consentAudit.consent?.analytics || !consentAudit.consent?.marketing) failures.push("consent choices were not persisted");
        if (consentAudit.queuedEvents !== 0) failures.push("measurement queued data without configured identifiers");
    }

    return failures;
}

async function auditPage(page, { route, viewport, theme, baseUrl, routePaths }) {
    const failures = [];
    const runtimeErrors = [];
    page.on("console", (message) => {
        if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
    });
    page.on("pageerror", (error) => runtimeErrors.push(`pageerror: ${error.message}`));
    page.on("requestfailed", (request) => {
        if (request.url().startsWith(baseUrl)) {
            const errorText = request.failure()?.errorText ?? "unknown";
            if (errorText !== "net::ERR_ABORTED") {
                runtimeErrors.push(`requestfailed: ${request.url()} (${errorText})`);
            }
        }
    });
    page.on("response", (response) => {
        if (response.url().startsWith(baseUrl) && response.status() >= 400) {
            runtimeErrors.push(`response ${response.status()}: ${response.url()}`);
        }
    });

    await page.addInitScript(({ selectedTheme, currentRoute }) => {
        window.localStorage.setItem("uui-site-theme", selectedTheme);
        if (currentRoute === "/cart/" || currentRoute === "/checkout/") {
            window.localStorage.setItem("valogatott-cart-v1", JSON.stringify([{ productId: "otthoni-zene-csomag", quantity: 1 }]));
        } else {
            window.localStorage.removeItem("valogatott-cart-v1");
        }
    }, { selectedTheme: theme, currentRoute: route });
    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
    if (!response || response.status() !== 200) failures.push(`route returned ${response?.status() ?? "no response"}`);
    await page.evaluate(async () => {
        await document.fonts?.ready;
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    await page.waitForFunction(() => !document.querySelector("astro-island[ssr]"));
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

    const documentAudit = await page.evaluate(async ({ knownRoutes, currentRoute, mobile, touchLayout }) => {
        const visible = (element) => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
        };
        const brokenImages = [];
        for (const image of document.images) {
            image.scrollIntoView({ block: "center" });
            await new Promise((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(resolve)),
            );
            await Promise.race([
                image.decode().catch(() => undefined),
                new Promise((resolve) => setTimeout(resolve, 2000)),
            ]);
            const source = image.currentSrc || image.src;
            if (image.complete && image.naturalWidth === 0) {
                brokenImages.push(source || image.alt);
            } else if (!image.complete && source) {
                try {
                    const response = await fetch(source);
                    if (!response.ok) brokenImages.push(source);
                } catch {
                    brokenImages.push(source);
                }
            }
        }
        scrollTo(0, 0);

        const deadLinks = [];
        for (const anchor of document.querySelectorAll("a[href]")) {
            const href = anchor.getAttribute("href");
            if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
            const target = new URL(href, location.href);
            if (target.origin !== location.origin) continue;
            const normalized = target.pathname.endsWith("/") ? target.pathname : `${target.pathname}/`;
            const pathExists =
                knownRoutes.includes(target.pathname) ||
                knownRoutes.includes(normalized) ||
                target.pathname.startsWith("/api/");
            if (!pathExists) deadLinks.push(`${anchor.textContent?.trim() || href} → ${target.pathname}`);
            if (
                target.pathname.replace(/\/$/, "") === location.pathname.replace(/\/$/, "") &&
                target.hash &&
                !document.getElementById(decodeURIComponent(target.hash.slice(1)))
            ) {
                deadLinks.push(`${anchor.textContent?.trim() || href} → missing ${target.hash}`);
            }
        }

        const dialogs = [...document.querySelectorAll('[role="dialog"], dialog[open]')]
            .filter(visible)
            .map((element) => element.getAttribute("aria-label") || element.textContent?.trim().slice(0, 80) || "dialog");
        const smallTouchTargets = touchLayout
            ? [...document.querySelectorAll('button, input:not([type="checkbox"]):not([type="radio"]), header a[href], footer a[href], label:has(input[type="checkbox"]), label:has(input[type="radio"])')]
                .filter(visible)
                .map((element) => {
                    const rect = element.getBoundingClientRect();
                    return { element, width: Math.round(rect.width), height: Math.round(rect.height) };
                })
                .filter(({ width, height }) => width < 44 || height < 44)
                .map(({ element, width, height }) => `${element.getAttribute("aria-label") || element.textContent?.trim().slice(0, 48) || element.tagName} (${width}×${height})`)
            : [];
        const hero = document.querySelector("[data-uui-critical-hero]");
        let heroAudit = null;
        if (hero) {
            const media = hero.querySelector("[data-uui-hero-media]");
            const actions = hero.querySelector("[data-uui-hero-actions]");
            const heroRect = hero.getBoundingClientRect();
            const mediaRect = media?.getBoundingClientRect();
            const actionsRect = actions?.getBoundingClientRect();
            heroAudit = {
                height: Math.round(heroRect.height),
                mediaVisible:
                    Boolean(media && visible(media)) &&
                    Boolean(mediaRect && mediaRect.bottom > heroRect.top && mediaRect.top < heroRect.bottom),
                mediaInFirstViewport:
                    Boolean(mediaRect) && mediaRect.bottom > 0 && mediaRect.top < innerHeight,
                ctaToMediaGap:
                    mediaRect && actionsRect && mediaRect.top > actionsRect.bottom
                        ? Math.round(mediaRect.top - actionsRect.bottom)
                        : 0,
            };
        }
        return {
            brokenImages,
            deadLinks: [...new Set(deadLinks)],
            dialogs,
            smallTouchTargets,
            h1Count: document.querySelectorAll("h1").length,
            horizontalOverflow: Math.ceil(document.documentElement.scrollWidth - innerWidth),
            heroAudit,
            metadata: {
                title: document.title.trim(),
                description: document.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() ?? "",
                robots: document.querySelector('meta[name="robots"]')?.getAttribute("content")?.toLowerCase() ?? "",
                canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "",
                clientState: document.documentElement.dataset.uuiClientState ?? "",
            },
            route: currentRoute,
            mobile,
        };
    }, { knownRoutes: [...routePaths], currentRoute: route, mobile: viewport.width === 375, touchLayout: viewport.width < 768 });

    if (documentAudit.horizontalOverflow > 1) failures.push(`horizontal overflow ${documentAudit.horizontalOverflow}px`);
    if (documentAudit.h1Count !== 1) failures.push(`expected one H1, found ${documentAudit.h1Count}`);
    if (documentAudit.brokenImages.length) failures.push(`broken images: ${documentAudit.brokenImages.join(", ")}`);
    if (documentAudit.deadLinks.length) failures.push(`dead links: ${documentAudit.deadLinks.join(", ")}`);
    if (documentAudit.dialogs.length) failures.push(`automatic visible dialogs: ${documentAudit.dialogs.join(", ")}`);
    if (documentAudit.smallTouchTargets.length) failures.push(`touch targets below 44px: ${documentAudit.smallTouchTargets.join(", ")}`);
    if (!documentAudit.metadata.title) failures.push("missing document title");
    if (!documentAudit.metadata.description) failures.push("missing meta description");
    if (
        documentAudit.metadata.clientState === "prelaunch" &&
        !documentAudit.metadata.robots.includes("noindex")
    ) {
        failures.push("prelaunch client is not protected by noindex");
    }
    if (
        documentAudit.metadata.clientState !== "prelaunch" &&
        !documentAudit.metadata.canonical
    ) {
        failures.push("launch-state route has no canonical URL");
    }
    if (documentAudit.heroAudit) {
        if (!documentAudit.heroAudit.mediaVisible) failures.push("critical hero media is not visible");
        if (viewport.width === 375 && !documentAudit.heroAudit.mediaInFirstViewport) {
            failures.push("critical hero media is absent from the first mobile viewport");
        }
        if (viewport.width === 375 && documentAudit.heroAudit.ctaToMediaGap > 96) {
            failures.push(`critical hero CTA-to-media void is ${documentAudit.heroAudit.ctaToMediaGap}px`);
        }
    }

    const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
    for (const violation of axe.violations) {
        failures.push(`axe ${violation.id}: ${violation.nodes.length} node(s)`);
    }

    const interactiveCount = await page.evaluate(() =>
        document.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ).length,
    );
    if (interactiveCount > 0) {
        await page.keyboard.press("Tab");
        const focusedVisible = await page.evaluate(
            () =>
                document.activeElement instanceof HTMLElement &&
                document.activeElement !== document.body &&
                document.activeElement.getBoundingClientRect().width > 0,
        );
        if (!focusedVisible) failures.push("keyboard Tab did not reach a visible control");
    }
    failures.push(...await exerciseStorefrontInteractions(page, { route, viewport, baseUrl }));
    failures.push(...runtimeErrors);
    await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = "auto";
        window.scrollTo(0, 0);
    });
    await page.waitForFunction(() => window.scrollY === 0);

    const shouldCapture =
        [
            "/",
            "/shop/",
            "/kategoriak/muszaki/",
            "/products/otthoni-zene-csomag/",
            "/cart/",
            "/checkout/",
            "/gyik/",
            "/aszf/",
            "/suti-beallitasok/",
        ].includes(route);
    let screenshot = null;
    if (shouldCapture) {
        screenshot = `${routeSlug(route)}-${viewport.name}-${theme}.png`;
        const fullPage = route === "/shop/" || route.startsWith("/kategoriak/") || route === "/gyik/" || route === "/aszf/" || route === "/suti-beallitasok/";
        await page.screenshot({ path: path.join(artifactRoot, screenshot), fullPage });
    }
    return {
        route,
        viewport,
        theme,
        failures: [...new Set(failures)],
        axeViolations: axe.violations.length,
        axe: axe.violations.map((violation) => ({
            id: violation.id,
            impact: violation.impact,
            help: violation.help,
            nodes: violation.nodes.slice(0, 12).map((node) => ({
                target: node.target,
                html: node.html,
                failureSummary: node.failureSummary,
            })),
        })),
        hero: documentAudit.heroAudit,
        screenshot,
    };
}

let server;
let browser;
try {
    const distFiles = await walk(dist);
    const routes = distFiles.filter((file) => file.endsWith(".html")).map(routeForHtml).filter(Boolean).sort();
    if (!routes.length) throw new Error("dist contains no built HTML routes; run npm run build first");
    await mkdir(artifactRoot, { recursive: true });
    server = await startStaticServer(distFiles);
    browser = await chromium.launch({
        headless: true,
        ...(process.env.CHROME_PATH
            ? { executablePath: process.env.CHROME_PATH }
            : process.platform === "darwin"
                ? { channel: "chrome" }
                : {}),
    });
    const results = [];
    const routePaths = new Set(routes);
    for (const viewport of viewports) {
        for (const theme of themes) {
            const context = await browser.newContext({ viewport, colorScheme: theme });
            for (const route of routes) {
                const page = await context.newPage();
                results.push(await auditPage(page, {
                    route,
                    viewport,
                    theme,
                    baseUrl: server.baseUrl,
                    routePaths,
                }));
                await page.close();
            }
            await context.close();
        }
    }
    const failures = results.flatMap((result) =>
        result.failures.map((failure) => `${result.route} · ${result.viewport.name} · ${result.theme}: ${failure}`),
    );
    const report = {
        schemaVersion: 1,
        kind: "UuiWebBuildQaReceiptV1",
        sourceFingerprint: await sourceFingerprint(),
        generatedAt: new Date().toISOString(),
        routes,
        matrix: {
            routes: routes.length,
            viewports: viewports.map(({ name, width, height }) => ({ name, width, height })),
            themes,
            checks: results.length,
        },
        results,
        status: failures.length ? "failed" : "passed",
        failures,
        residualRisk:
            "Automated verification does not validate proposition, composition, content, or commercial outcome; owner review remains required.",
    };
    await writeFile(path.join(artifactRoot, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
    if (failures.length) {
        console.error(`WEB BUILD QA FAIL · ${failures.length} finding(s) · ${path.relative(root, artifactRoot)}/report.json`);
        for (const failure of failures.slice(0, 30)) console.error(`- ${failure}`);
        process.exitCode = 1;
    } else {
        console.log(`WEB BUILD QA PASS · ${results.length} route/viewport/theme checks · 0 findings · ${path.relative(root, artifactRoot)}/report.json`);
    }
} finally {
    if (browser) await browser.close();
    if (server) await server.close();
}
