"use client";

// @uui-source: ADAPT src/catalog/custom/shadcn-store-storefront-hero/05-storefront-hero5.tsx (hero: card section, 1fr/1.3fr split, stat strip)
// @uui-source: ADAPT src/catalog/custom/uui-prompt-ecommerce/01-editorial-storefront.tsx
// @uui-source: ADAPT src/catalog/custom/shadcn-store-category-filters/02-category-filter2.tsx
// @uui-source: ADAPT src/catalog/components/slideout-menus/filters-menu.tsx
// @uui-source: REUSE toolkit/interaction-recipes/lib/celebrations.ts

import { useEffect, useMemo, useRef, useState } from "react";
import {
    ArrowRight,
    CheckCircle,
    FilterLines,
    Lock01,
    Menu01,
    Minus,
    Moon01,
    Plus,
    SearchLg,
    ShieldTick,
    ShoppingBag03,
    Star01,
    Sun,
    Trash01,
    Truck01,
} from "@untitledui-pro/icons/line";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { bumpBadge, flyToCart } from "@/toolkit/interaction-recipes";
import {
    RadioButton,
    RadioGroup,
} from "@/components/base/radio-buttons/radio-buttons";
import type {
    Cart,
    CartLine,
    Product,
    ProductVariant,
} from "@/toolkit/commerce-shopify/lib/contracts";
import {
    calculateMockCart,
    EMPTY_CART,
    MOCK_PRODUCTS,
} from "@/data/demo-catalog";
import { INFO_PAGES, STORE, type InfoPageKey } from "@/config/store";
import { readConsent, saveConsent } from "@/integrations/measurement";
import { SHOPIFY_STORE_DOMAIN, unavailableCatalog } from "@/integrations/commerce/shopify-ucp";
import {
    quantityForVariant,
    reconcileCartLinesWithCatalog,
    sellableQuantity,
} from "@/integrations/commerce/cart-inventory";

export type StorefrontView = "shop" | "product" | "cart" | "checkout" | "order" | "info";
type StorefrontMode = "demo" | "shopify" | "provider";

interface Props {
    view: StorefrontView;
    mode?: StorefrontMode;
    brand?: string;
    initialCategory?: "Műszaki" | "Háztartás";
    infoKey?: InfoPageKey;
}
const MOCK_CART_KEY = "devshopify-shopify-cart-v2";

function formatMoney(amount: string | number, currencyCode = "HUF") {
    return new Intl.NumberFormat("hu-HU", {
        style: "currency",
        currency: currencyCode,
        maximumFractionDigits: 0,
    }).format(Number(amount));
}

function price(product: Product) {
    return formatMoney(
        product.priceRange.minVariantPrice.amount,
        product.priceRange.minVariantPrice.currencyCode,
    );
}

function readMockCart(): Cart {
    if (typeof window === "undefined") return EMPTY_CART;
    try {
        const value = window.localStorage.getItem(MOCK_CART_KEY);
        return value ? calculateMockCart((JSON.parse(value) as Cart).lines) : EMPTY_CART;
    } catch {
        window.localStorage.removeItem(MOCK_CART_KEY);
        return EMPTY_CART;
    }
}

function writeMockCart(cart: Cart) {
    if (typeof window !== "undefined") {
        window.localStorage.setItem(MOCK_CART_KEY, JSON.stringify(cart));
    }
    return cart;
}

function ProductStatus({ product }: { product: Product }) {
    if (product.inventoryState === "sold-out") {
        return <Badge color="error">Elfogyott</Badge>;
    }
    if (product.inventoryState === "low-stock") {
        return <Badge color="warning">Már csak kevés van</Badge>;
    }
    return <BadgeWithDot color="success">Rendelhető</BadgeWithDot>;
}

const productTone = [
    {
        panel: "bg-utility-orange-50",
        detail: "text-utility-orange-700",
        accent: "bg-utility-orange-500",
    },
    {
        panel: "bg-utility-pink-50",
        detail: "text-utility-pink-700",
        accent: "bg-utility-pink-500",
    },
    {
        panel: "bg-utility-blue-light-50",
        detail: "text-utility-blue-light-700",
        accent: "bg-utility-blue-light-500",
    },
    {
        panel: "bg-utility-purple-50",
        detail: "text-utility-purple-700",
        accent: "bg-utility-purple-500",
    },
] as const;

function ProductCard({
    product,
    index,
    featured,
    pending,
    loading,
    added,
    onAdd,
}: {
    product: Product;
    index: number;
    featured: boolean;
    pending: boolean;
    loading: boolean;
    added: boolean;
    onAdd: (product: Product, source: HTMLElement) => void;
}) {
    const tone = productTone[index % productTone.length];
    return (
        <article
            className={[
                // Owner hover-law: a card at rest keeps its border and shadow — on hover
                // only the button and (at most) the image may react. No lift, no ring swap.
                "group relative flex h-full min-w-0 overflow-hidden rounded-3xl bg-primary shadow-md ring-1 ring-secondary",
                featured ? "flex-col md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(17rem,0.8fr)]" : "flex-col",
            ].join(" ")}
        >
            <a
                href={`/products/${product.handle}`}
                className={featured ? "relative block min-h-72 overflow-hidden bg-secondary md:min-h-full" : "relative block overflow-hidden bg-secondary"}
            >
                <img
                    src={product.featuredImage.url}
                    alt={product.featuredImage.altText}
                    width={product.featuredImage.width}
                    height={product.featuredImage.height}
                    loading="lazy"
                    className={[
                        "size-full object-cover transition duration-500 group-hover:scale-[1.035] motion-reduce:transition-none",
                        featured ? "absolute inset-0 min-h-72" : "aspect-4/3",
                    ].join(" ")}
                />
                <span className="absolute left-4 top-4"><ProductStatus product={product} /></span>
            </a>
            <div className={`flex flex-1 flex-col ${featured ? "p-6 md:p-8" : "p-5"}`}>
                <div className="flex items-center justify-between gap-3">
                    <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${tone.detail}`}>
                        {product.productType}
                    </p>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone.panel} ${tone.detail}`}>
                        Válogatás {String(index + 1).padStart(2, "0")}
                    </span>
                </div>
                <h3 className={`${featured ? "mt-5 text-display-xs" : "mt-3 text-lg"} font-semibold text-primary`}>
                    <a href={`/products/${product.handle}`} className="hover:text-brand-secondary">
                        {product.title}
                    </a>
                </h3>
                <p className={`${featured ? "mt-4 text-md" : "mt-2 line-clamp-2 text-sm"} text-tertiary`}>
                    {product.description}
                </p>
                <div className="mt-auto flex items-end justify-between gap-4 pt-6">
                    <div>
                        <p className={`${featured ? "text-display-xs" : "text-xl"} font-semibold tracking-tight text-primary`}>
                            {price(product)}
                        </p>
                        <p className="mt-1 text-xs text-tertiary">Bruttó fogyasztói ár</p>
                    </div>
                    <Button
                        size="lg"
                        aria-label={`${product.title} kosárba tétele`}
                        className="ir-cart-btn ir-reward"
                        color="primary"
                        data-ir-state={added ? "success" : "idle"}
                        iconLeading={
                            added ? (
                                <CheckCircle data-icon="leading" className="ir-cart-icon size-5" />
                            ) : (
                                <Plus data-icon="leading" className="ir-cart-icon size-5" />
                            )
                        }
                        isLoading={loading}
                        isDisabled={pending || product.inventoryState === "sold-out"}
                        onPress={(event) => onAdd(product, event.target as HTMLElement)}
                    >
                        {added ? "Kosárban" : "Kosárba"}
                    </Button>
                </div>
            </div>
        </article>
    );
}

function TrustStrip() {
    const items = [
        {
            icon: ShieldTick,
            title: "Biztonságos átadás",
            detail: "Fizetés csak jóváhagyott szolgáltatónál",
            tone: "bg-utility-indigo-50 text-utility-indigo-700 ring-utility-indigo-200",
        },
        {
            icon: Truck01,
            title: "Tiszta szállítás",
            detail: "A végleges díj rendelés előtt látható",
            tone: "bg-utility-orange-50 text-primary ring-utility-orange-200",
        },
        {
            icon: CheckCircle,
            title: "Válogatott kínálat",
            detail: "Kevés, érthetően bemutatott termék",
            tone: "bg-utility-blue-light-50 text-utility-blue-light-700 ring-utility-blue-light-200",
        },
    ];
    return (
        <section
            aria-label="Vásárlási biztosítékok"
            className="bg-secondary px-4 pb-12 lg:px-8 lg:pb-16"
        >
            <div className="mx-auto grid max-w-7xl gap-3 sm:grid-cols-3">
                {items.map(({ icon: Icon, title, detail, tone }) => (
                    <div
                        key={title}
                        className="flex min-w-0 items-center gap-3 rounded-2xl bg-primary px-4 py-5 shadow-sm ring-1 ring-secondary"
                    >
                        <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ${tone}`}>
                            <Icon className="size-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                            <span className="block text-sm font-semibold text-primary">{title}</span>
                            <span className="mt-0.5 block text-sm text-secondary">{detail}</span>
                        </span>
                    </div>
                ))}
            </div>
        </section>
    );
}

// The one true brand mark — the official UUI logomark "Luckycharm" (Library →
// Resources → Logos), cropped to its 48x48 mark and adopted as the Válogatott
// brand: public/brand/devshopify-mark.svg. The favicon is the SAME file, so the
// tab icon and the on-page logo are a single identity. Fixed colors on purpose:
// a logomark is a fixed-color surface and must not flip with the theme.
function BrandMark({ className = "size-8" }: { className?: string }) {
    return <img src="/brand/devshopify-mark.svg" alt="" aria-hidden="true" className={`shrink-0 ${className}`} />;
}

function ShopFooter({ brand }: { brand: string }) {
    return (
        <footer className="border-t border-secondary_alt bg-primary-solid">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-[minmax(0,1fr)_auto] lg:px-8">
                <div className="min-w-0">
                    <p className="flex items-center gap-2.5 text-lg font-semibold text-primary_on-brand">
                        <BrandMark className="size-8 rounded-lg" />
                        {brand}
                    </p>
                    <p className="mt-2 max-w-md text-sm text-tertiary_on-brand">
                        {STORE.brand.tagline} A webáruház üzemeltetője: {STORE.legal.companyName}.
                    </p>
                </div>
                <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                    <a className="text-secondary_on-brand hover:text-primary_on-brand" href="/shop">Termékek</a>
                    <a className="text-secondary_on-brand hover:text-primary_on-brand" href="/szallitas">Szállítás</a>
                    <a className="text-secondary_on-brand hover:text-primary_on-brand" href="/visszakuldes">Visszaküldés</a>
                    <a className="text-secondary_on-brand hover:text-primary_on-brand" href="/garancia">Garancia</a>
                    <a className="text-secondary_on-brand hover:text-primary_on-brand" href="/gyik">GYIK</a>
                    <a className="text-secondary_on-brand hover:text-primary_on-brand" href="/kapcsolat">Kapcsolat</a>
                    <a className="text-secondary_on-brand hover:text-primary_on-brand" href="/adatvedelem">Adatvédelem</a>
                    <a className="text-secondary_on-brand hover:text-primary_on-brand" href="/aszf">ÁSZF</a>
                    <a className="text-secondary_on-brand hover:text-primary_on-brand" href="/suti-beallitasok">Süti beállítások</a>
                </nav>
            </div>
        </footer>
    );
}

function CartLines({
    cart,
    products,
    pending,
    onQuantity,
    onRemove,
}: {
    cart: Cart;
    products: Product[];
    pending: boolean;
    onQuantity: (line: CartLine, quantity: number) => void;
    onRemove: (line: CartLine) => void;
}) {
    return (
        <ul className="divide-y divide-secondary rounded-2xl bg-primary px-5 shadow-sm ring-1 ring-secondary" aria-live="polite">
            {cart.lines.map((line) => (
                <li key={line.id} className="flex gap-4 py-5">
                    {line.image && (
                        <img
                            src={line.image.url}
                            alt={line.image.altText}
                            width={line.image.width}
                            height={line.image.height}
                            className="size-20 shrink-0 rounded-xl object-cover"
                        />
                    )}
                    <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <a
                                    href={`/products/${line.productHandle}`}
                                    className="font-semibold text-primary hover:text-brand-secondary"
                                >
                                    {line.productTitle}
                                </a>
                                <p className="mt-1 text-sm text-tertiary">{line.variantTitle}</p>
                            </div>
                            <Button
                                color="tertiary-destructive"
                                size="xs"
                                aria-label={`${line.productTitle} eltávolítása`}
                                iconLeading={Trash01}
                                isDisabled={pending}
                                onPress={() => onRemove(line)}
                            />
                        </div>
                        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                            <div className="flex items-center gap-1">
                                <Button
                                    color="secondary"
                                    size="xs"
                                    aria-label={`${line.productTitle} mennyiségének csökkentése`}
                                    iconLeading={Minus}
                                    isDisabled={pending || line.quantity <= 1}
                                    onPress={() => onQuantity(line, line.quantity - 1)}
                                />
                                <span className="min-w-8 text-center text-sm font-semibold text-primary">
                                    {line.quantity}
                                </span>
                                <Button
                                    color="secondary"
                                    size="xs"
                                    aria-label={`${line.productTitle} mennyiségének növelése`}
                                    iconLeading={Plus}
                                    isDisabled={pending || line.quantity >= quantityForVariant(products, line.merchandiseId)}
                                    onPress={() => onQuantity(line, line.quantity + 1)}
                                />
                            </div>
                            <p className="font-semibold text-primary">
                                {formatMoney(line.lineTotal.amount, line.lineTotal.currencyCode)}
                            </p>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}

function CartSummary({
    cart,
    checkoutHref = "/checkout",
    checkoutLabel = "Tovább a pénztárhoz",
    showCheckoutAction = true,
}: {
    cart: Cart;
    checkoutHref?: string;
    checkoutLabel?: string;
    showCheckoutAction?: boolean;
}) {
    return (
        <aside className="rounded-2xl bg-primary p-5 shadow-sm ring-1 ring-secondary sm:p-6">
            <h2 className="text-lg font-semibold text-primary">Rendelés összesítése</h2>
            <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                    <dt className="text-secondary">Részösszeg</dt>
                    <dd className="font-medium text-primary">
                        {formatMoney(cart.subtotal.amount, cart.subtotal.currencyCode)}
                    </dd>
                </div>
                <div className="flex justify-between gap-4">
                    <dt className="text-secondary">Szállítás</dt>
                    <dd className="text-secondary">A véglegesítéskor számoljuk</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-secondary pt-4">
                    <dt className="font-semibold text-primary">Várható végösszeg</dt>
                    <dd className="text-lg font-semibold text-primary">
                        {formatMoney(cart.total.amount, cart.total.currencyCode)}
                    </dd>
                </div>
            </dl>
            {showCheckoutAction && (
                <Button
                    href={checkoutHref}
                    size="lg"
                    className="mt-6 w-full"
                    iconTrailing={ArrowRight}
                >
                    {checkoutLabel}
                </Button>
            )}
            <p className="mt-3 flex items-start gap-2 text-xs text-secondary">
                <Lock01 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                A végleges díjakat és fizetést a jóváhagyott pénztárszolgáltató kezeli.
            </p>
        </aside>
    );
}

export function SmallShopExperience({
    view,
    mode = "demo",
    brand = STORE.brand.name,
    initialCategory,
    infoKey = "faq",
}: Props) {
    const [products, setProducts] = useState<Product[]>(
        mode === "shopify" ? unavailableCatalog(MOCK_PRODUCTS) : MOCK_PRODUCTS,
    );
    const [cart, setCart] = useState<Cart>(EMPTY_CART);
    const [loading, setLoading] = useState(false);
    const [pending, setPending] = useState(false);
    const [pendingProductId, setPendingProductId] = useState("");
    const [addedProduct, setAddedProduct] = useState<{ id: string; title: string } | null>(null);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [availableOnly, setAvailableOnly] = useState(false);
    const [sort, setSort] = useState<"featured" | "price-asc" | "price-desc">("featured");
    const [selectedVariantId, setSelectedVariantId] = useState("");
    const [dark, setDark] = useState(false);
    const [analyticsConsent, setAnalyticsConsent] = useState(false);
    const [marketingConsent, setMarketingConsent] = useState(false);
    const [consentSaved, setConsentSaved] = useState(false);
    const [activeHandle, setActiveHandle] = useState(MOCK_PRODUCTS[0].handle);
    const addedFeedbackTimer = useRef<number | null>(null);

    useEffect(() => {
        const root = document.documentElement;
        const saved = window.localStorage.getItem("uui-site-theme");
        const initialDark = saved === "dark" || (!saved && root.classList.contains("dark-mode"));
        root.classList.toggle("dark-mode", initialDark);
        setDark(initialDark);
        const segments = window.location.pathname.split("/").filter(Boolean);
        setActiveHandle(segments.at(-1) || MOCK_PRODUCTS[0].handle);
        const params = new URLSearchParams(window.location.search);
        setQuery(params.get("q") ?? "");
        if (initialCategory) setSelectedCategories([initialCategory]);
        const consent = readConsent();
        setAnalyticsConsent(consent.analytics);
        setMarketingConsent(consent.marketing);
    }, [initialCategory]);

    useEffect(() => {
        let active = true;
        async function hydrateStore() {
            if (!active) return;
            setCart(readMockCart());
            if (mode !== "shopify") {
                setLoading(false);
                if (mode === "provider") setError("A beszállítói kapcsolat még nincs beállítva.");
                return;
            }
            setLoading(true);
            try {
                const response = await fetch("/api/commerce/shopify", { headers: { Accept: "application/json" } });
                const payload = await response.json() as { products?: Product[]; error?: string; stale?: boolean };
                if (!response.ok || !Array.isArray(payload.products) || payload.products.length !== 3) {
                    throw new Error(payload.error || "A Shopify katalógus most nem frissíthető.");
                }
                if (active) {
                    setProducts(payload.products);
                    const currentCart = readMockCart();
                    setCart(writeMockCart(calculateMockCart(
                        reconcileCartLinesWithCatalog(currentCart.lines, payload.products),
                    )));
                }
            } catch {
                if (active) {
                    setProducts(unavailableCatalog(MOCK_PRODUCTS));
                    setError("A pillanatnyi Shopify készlet nem frissült, ezért a vásárlást biztonságból leállítottuk.");
                }
            } finally {
                if (active) setLoading(false);
            }
        }
        void hydrateStore();
        return () => {
            active = false;
        };
    }, [mode]);

    useEffect(
        () => () => {
            if (addedFeedbackTimer.current !== null) {
                window.clearTimeout(addedFeedbackTimer.current);
            }
        },
        [],
    );

    const categories = useMemo(
        () => [...new Set(products.map((product) => product.productType))].sort(),
        [products],
    );
    const filteredProducts = useMemo(() => {
        const term = query.trim().toLowerCase();
        const filtered = products.filter((product) => {
            const matchesQuery =
                !term ||
                [product.title, product.description, product.productType, ...product.tags]
                    .join(" ")
                    .toLowerCase()
                    .includes(term);
            const matchesCategory =
                selectedCategories.length === 0 ||
                selectedCategories.includes(product.productType);
            const matchesStock = !availableOnly || product.inventoryState !== "sold-out";
            return matchesQuery && matchesCategory && matchesStock;
        });
        if (sort === "price-asc") {
            return [...filtered].sort(
                (a, b) =>
                    Number(a.priceRange.minVariantPrice.amount) -
                    Number(b.priceRange.minVariantPrice.amount),
            );
        }
        if (sort === "price-desc") {
            return [...filtered].sort(
                (a, b) =>
                    Number(b.priceRange.minVariantPrice.amount) -
                    Number(a.priceRange.minVariantPrice.amount),
            );
        }
        return filtered;
    }, [availableOnly, products, query, selectedCategories, sort]);

    const currentProduct =
        products.find((product) => product.handle === activeHandle) ?? products[0];
    const selectedVariant: ProductVariant | undefined =
        currentProduct?.variants.find((variant) => variant.id === selectedVariantId) ??
        currentProduct?.variants.find((variant) => variant.availableForSale) ??
        currentProduct?.variants[0];

    useEffect(() => {
        if (currentProduct && !selectedVariantId) {
            const first =
                currentProduct.variants.find((variant) => variant.availableForSale) ??
                currentProduct.variants[0];
            setSelectedVariantId(first?.id ?? "");
        }
    }, [currentProduct, selectedVariantId]);

    function setTheme(nextDark: boolean) {
        document.documentElement.classList.toggle("dark-mode", nextDark);
        window.localStorage.setItem("uui-site-theme", nextDark ? "dark" : "light");
        setDark(nextDark);
    }

    function confirmAdded(product: Product, source?: HTMLElement) {
        setAddedProduct({ id: product.id, title: product.title });
        if (addedFeedbackTimer.current !== null) {
            window.clearTimeout(addedFeedbackTimer.current);
        }
        addedFeedbackTimer.current = window.setTimeout(() => {
            setAddedProduct(null);
            addedFeedbackTimer.current = null;
        }, 1800);

        const cartTarget = document.querySelector<HTMLElement>("[data-shop-cart-target]");
        if (source && cartTarget) {
            void flyToCart(source, cartTarget);
        }
        window.requestAnimationFrame(() => {
            const count = document.querySelector<HTMLElement>(".shop-cart-count");
            if (count) bumpBadge(count, 0);
        });
    }

    async function addToCart(product: Product, variant?: ProductVariant, source?: HTMLElement) {
        const selected =
            variant ??
            product.variants.find((entry) => entry.availableForSale) ??
            product.variants[0];
        if (!selected?.availableForSale) return;
        setPending(true);
        setPendingProductId(product.id);
        setError("");
        try {
            if (mode === "demo" || mode === "shopify") {
                const existing = cart.lines.find(
                    (line) => line.merchandiseId === selected.id,
                );
                const maximum = sellableQuantity(selected);
                if (existing && existing.quantity >= maximum) {
                    setError("Ebből a termékből most nem tehető több a kosárba.");
                    return;
                }
                const nextLines = existing
                    ? cart.lines.map((line) =>
                          line.id === existing.id
                              ? { ...line, quantity: Math.min(line.quantity + 1, maximum) }
                              : line,
                      )
                    : [
                          ...cart.lines,
                          {
                              id: `mock-line-${selected.id}`,
                              merchandiseId: selected.id,
                              productHandle: product.handle,
                              productTitle: product.title,
                              variantTitle: selected.title,
                              image: product.featuredImage,
                              quantity: 1,
                              unitPrice: selected.price,
                              lineTotal: selected.price,
                          },
                      ];
                setCart(writeMockCart(calculateMockCart(nextLines)));
                confirmAdded(product, source);
                return;
            }
            throw new Error("A kosárszolgáltató még nincs beállítva.");
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "A kosár most nem frissíthető.");
        } finally {
            setPending(false);
            setPendingProductId("");
        }
    }

    async function changeQuantity(line: CartLine, quantity: number) {
        setPending(true);
        setError("");
        try {
            if (mode === "demo" || mode === "shopify") {
                const maximum = quantityForVariant(products, line.merchandiseId);
                const nextQuantity = Math.min(quantity, maximum);
                const lines =
                    nextQuantity <= 0
                        ? cart.lines.filter((entry) => entry.id !== line.id)
                        : cart.lines.map((entry) =>
                              entry.id === line.id ? { ...entry, quantity: nextQuantity } : entry,
                          );
                setCart(writeMockCart(calculateMockCart(lines)));
                return;
            }
            throw new Error("A kosárszolgáltató még nincs beállítva.");
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "A kosár most nem frissíthető.");
        } finally {
            setPending(false);
        }
    }

    async function removeLine(line: CartLine) {
        if (mode === "demo" || mode === "shopify") return changeQuantity(line, 0);
        setError("A kosárszolgáltató még nincs beállítva.");
    }

    async function beginCheckout() {
        if (!cart.lines.length) return;
        setPending(true);
        setError("");
        try {
            if (mode !== "shopify") throw new Error("Az online fizetés még nem indítható. A kosár megmaradt; kérjük, próbáld később.");
            const response = await fetch("/api/commerce/shopify", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({
                    lines: cart.lines.map((line) => ({ variantId: line.merchandiseId, quantity: line.quantity })),
                }),
            });
            const payload = await response.json() as { checkoutUrl?: string; error?: string };
            if (!response.ok || !payload.checkoutUrl) throw new Error(payload.error || "A Shopify pénztár most nem indítható.");
            const checkout = new URL(payload.checkoutUrl);
            if (checkout.protocol !== "https:" || checkout.hostname !== SHOPIFY_STORE_DOMAIN || !checkout.pathname.startsWith("/cart/")) {
                throw new Error("A Shopify érvénytelen pénztárhivatkozást adott vissza.");
            }
            window.location.assign(checkout.href);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "A pénztár most nem indítható.");
        } finally {
            setPending(false);
        }
    }

    const activeFilterCount =
        selectedCategories.length + (availableOnly ? 1 : 0) + (query.trim() ? 1 : 0);
    const sortItems = [
        { id: "featured", label: "Kiemeltek elöl" },
        { id: "price-asc", label: "Ár: növekvő" },
        { id: "price-desc", label: "Ár: csökkenő" },
    ];
    const clearFilters = () => {
        setSelectedCategories([]);
        setAvailableOnly(false);
        setQuery("");
    };
    const filterControls = (
        <div className="space-y-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-md font-semibold text-primary">Szűrők</h3>
                    <p className="mt-1 text-sm text-tertiary">Szűkítsd a terméklistát.</p>
                </div>
                {activeFilterCount > 0 && (
                    <Badge color="brand">{activeFilterCount} aktív</Badge>
                )}
            </div>
            <fieldset className="border-t border-secondary pt-5">
                <legend className="text-sm font-semibold text-primary">Kategória</legend>
                <div className="mt-4 space-y-3">
                    {categories.map((category) => (
                        <Checkbox
                            key={category}
                            label={category}
                            hint={`${products.filter((product) => product.productType === category).length} termék`}
                            isSelected={selectedCategories.includes(category)}
                            onChange={(active) =>
                                setSelectedCategories((current) =>
                                    active
                                        ? [...new Set([...current, category])]
                                        : current.filter((entry) => entry !== category),
                                )
                            }
                        />
                    ))}
                </div>
            </fieldset>
            <div className="border-t border-secondary pt-5">
                <Checkbox
                    label="Most rendelhető"
                    hint="Az elfogyott termékek elrejtése"
                    isSelected={availableOnly}
                    onChange={setAvailableOnly}
                />
            </div>
        </div>
    );

    const cartPanel = (
        <SlideoutMenu isDismissable>
            {({ close }) => (
                <>
                    <SlideoutMenu.Header onClose={close}>
                        <p className="text-sm font-semibold text-brand-secondary">Rendelésed</p>
                        <h2 className="mt-1 text-display-xs font-semibold text-primary">
                            Kosár
                        </h2>
                    </SlideoutMenu.Header>
                    <SlideoutMenu.Content>
                        {cart.lines.length ? (
                            <CartLines
                                cart={cart}
                                products={products}
                                pending={pending}
                                onQuantity={changeQuantity}
                                onRemove={removeLine}
                            />
                        ) : (
                            <EmptyState size="sm" className="py-10">
                                <EmptyState.Header pattern="circle" patternSize="sm">
                                    <EmptyState.FeaturedIcon color="gray" icon={ShoppingBag03} />
                                </EmptyState.Header>
                                <EmptyState.Content>
                                    <h2 className="text-md font-semibold text-primary">A kosár üres</h2>
                                    <EmptyState.Description>
                                        Tegyél egy terméket a kosárba, hogy itt átnézhesd.
                                    </EmptyState.Description>
                                </EmptyState.Content>
                            </EmptyState>
                        )}
                    </SlideoutMenu.Content>
                    {cart.lines.length > 0 && (
                        <SlideoutMenu.Footer>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-sm text-tertiary">Részösszeg</span>
                                <span className="font-semibold text-primary">
                                    {formatMoney(cart.subtotal.amount, cart.subtotal.currencyCode)}
                                </span>
                            </div>
                            <Button href="/cart" size="lg" className="mt-4 w-full">
                                Kosár áttekintése
                            </Button>
                        </SlideoutMenu.Footer>
                    )}
                </>
            )}
        </SlideoutMenu>
    );

    return (
        <div
            data-uui-brand-palette="forest-cream-terracotta"
            // Rule 4d ground: the page root is the RECESSED surface — every card
            // (bg-primary + shadow) rises above it, on every view.
            className="min-h-dvh bg-secondary text-primary"
        >
            <aside
                aria-label="Webshop állapota"
                className="border-b border-utility-orange-200 bg-utility-orange-50 px-4 py-2 text-center text-sm font-semibold text-primary"
            >
                Induló válogatás · műszaki és háztartási termékek magyar vásárlóknak
            </aside>
            <header className="sticky top-0 z-40 border-b border-secondary bg-primary/90 shadow-xs backdrop-blur-lg">
                <div className="mx-auto flex h-18 max-w-7xl items-center gap-3 px-4 lg:px-8">
                    <SlideoutMenu.Trigger>
                        <Button
                            color="tertiary"
                            size="lg"
                            className="sm:hidden"
                            aria-label="Navigáció megnyitása"
                            iconLeading={Menu01}
                        />
                        <SlideoutMenu isDismissable>
                            {({ close }) => (
                                <>
                                    <SlideoutMenu.Header onClose={close}>
                                        <p className="flex items-center gap-2.5 text-lg font-semibold text-primary">
                                            <BrandMark className="size-8 rounded-lg" />
                                            {brand}
                                        </p>
                                    </SlideoutMenu.Header>
                                    <SlideoutMenu.Content>
                                        <nav className="grid gap-2 text-md font-semibold">
                                            <a className="rounded-lg p-3 text-primary hover:bg-secondary" href="/shop">Termékek</a>
                                            <a className="rounded-lg p-3 text-primary hover:bg-secondary" href="/gyik">Segítség</a>
                                            <a className="rounded-lg p-3 text-primary hover:bg-secondary" href="/cart">Kosár</a>
                                        </nav>
                                    </SlideoutMenu.Content>
                                </>
                            )}
                        </SlideoutMenu>
                    </SlideoutMenu.Trigger>
                    <a
                        href="/"
                        aria-label={brand}
                        className="flex items-center gap-2.5 whitespace-nowrap text-md font-semibold tracking-tight text-primary sm:text-lg"
                    >
                        <BrandMark className="size-9 rounded-xl shadow-sm" />
                        <span className="hidden sm:inline">{brand}</span>
                    </a>
                    {/* Owner: Termékek/Műszaki/Háztartás all landed on the same list —
                        redundant nav. Categories live in the shop filters instead. */}
                    <nav className="ml-6 hidden items-center gap-6 text-sm font-semibold text-secondary sm:flex">
                        <a href="/shop" className="hover:text-primary">Termékek</a>
                        <a href="/gyik" className="hover:text-primary">Segítség</a>
                    </nav>
                    <div className="ml-auto flex items-center gap-1">
                        <Button
                            color="tertiary"
                            size="lg"
                            aria-label={dark ? "Világos megjelenés" : "Sötét megjelenés"}
                            iconLeading={dark ? Sun : Moon01}
                            onPress={() => setTheme(!dark)}
                        />
                        <SlideoutMenu.Trigger>
                            <Button
                                color={cart.totalQuantity > 0 ? "primary" : "secondary"}
                                size="lg"
                                aria-label={`Kosár megnyitása, ${cart.totalQuantity} tétel`}
                                iconLeading={ShoppingBag03}
                                data-shop-cart-target
                            >
                                <span className="sr-only sm:not-sr-only">Kosár</span>
                                <Badge
                                    color={cart.totalQuantity > 0 ? "success" : "gray"}
                                    size="md"
                                    className="shop-cart-count ir-badge ml-1 min-w-7 justify-center font-semibold tabular-nums"
                                >
                                    {cart.totalQuantity}
                                </Badge>
                            </Button>
                            {cartPanel}
                        </SlideoutMenu.Trigger>
                    </div>
                </div>
            </header>

            {error && (
                <div role="alert" className="border-b border-error_subtle bg-error-primary px-4 py-3 text-center text-sm text-error-primary">
                    {error}
                </div>
            )}
            <p className="sr-only" role="status" aria-live="polite">
                {addedProduct
                    ? `${addedProduct.title} a kosárba került. A kosárban ${cart.totalQuantity} tétel van.`
                    : ""}
            </p>

            {view === "shop" && (
                <main>
                    {/* Hero = ADAPT of catalog storefront-hero5 (see @uui-source header):
                        card section on the recessed ground, 1fr/1.3fr split, stat strip.
                        Mobile stat-hide carried over from the release-branch fix (Codex). */}
                    <section
                        data-uui-critical-hero
                        className="bg-secondary px-4 py-8 sm:py-12 lg:px-8 lg:py-16"
                    >
                        <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-primary shadow-sm ring-1 ring-secondary">
                            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr]">
                                <div className="p-7 lg:p-12">
                                    <div className="relative z-10 max-w-xl">
                                        <Badge color="success" size="sm">Induló magyar webshop</Badge>
                                        <h1 className="mt-5 text-balance text-display-sm font-semibold text-primary md:text-display-lg">
                                            {initialCategory ? `${initialCategory} termékek, érthetően.` : "Ami kell. Semmi, ami nem."}
                                        </h1>
                                        <p className="mt-5 max-w-2xl text-lg text-tertiary">
                                            {initialCategory
                                                ? `Válogatott ${initialCategory.toLowerCase()} kínálat világos árakkal és egyszerű vásárlással.`
                                                : "Hasznos műszaki és háztartási termékek, világos árakkal és egyszerű vásárlással."}
                                        </p>
                                        <div data-uui-hero-actions className="mt-7 flex flex-wrap gap-3">
                                            <Button href="#collections" size="lg" iconTrailing={ArrowRight}>
                                                Termékek megtekintése
                                            </Button>
                                            <Button href="#about" size="lg" color="secondary">
                                                Miért DevShopify?
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="mt-10 hidden grid-cols-3 gap-3 text-sm sm:grid">
                                        <span>
                                            <strong className="block text-xl text-primary">0 Ft</strong>
                                            <span className="text-tertiary">rejtett költség</span>
                                        </span>
                                        <span>
                                            <strong className="block text-xl text-primary">14 nap</strong>
                                            <span className="text-tertiary">elállási jog</span>
                                        </span>
                                        <span>
                                            <strong className="block text-xl text-primary">H–P</strong>
                                            <span className="text-tertiary">magyar ügyfélszolgálat</span>
                                        </span>
                                    </div>
                                </div>
                                <img
                                    data-uui-hero-media
                                    src="/img/uui/application/listing-01.webp"
                                    alt="Rendezett nappali műszaki és háztartási termékekkel"
                                    width={1200}
                                    height={900}
                                    loading="eager"
                                    fetchPriority="high"
                                    className="h-full min-h-96 w-full object-cover"
                                />
                            </div>
                        </div>
                    </section>
                    <TrustStrip />
                    <section id="collections" className="bg-secondary px-4 py-14 lg:px-8 lg:py-20">
                        <div className="mx-auto max-w-7xl">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-3">
                                <span className="h-px w-10 bg-utility-orange-500" aria-hidden="true" />
                                <p className="text-sm font-semibold text-primary">Induló termékválogatás</p>
                            </div>
                            <h2 className="mt-3 text-balance text-display-sm font-semibold text-primary sm:text-display-md">
                                {initialCategory ? `${initialCategory}: minden lényeg egy helyen.` : "Kevesebb keresgélés. Jobb döntés."}
                            </h2>
                            <p className="mt-4 max-w-2xl text-md text-secondary">
                                Keress, szűrj és rendezz. A kosár minden lépésnél veled marad.
                            </p>
                        </div>
                        <div className="mt-10 grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                            <aside
                                data-uui-filter-template="category-filter2"
                                aria-label="Termékszűrők"
                                className="sticky top-24 hidden rounded-xl bg-primary p-5 shadow-xs ring-1 ring-secondary lg:block"
                            >
                                {filterControls}
                                <Button
                                    color="secondary"
                                    size="sm"
                                    className="mt-5 w-full"
                                    isDisabled={activeFilterCount === 0}
                                    onPress={clearFilters}
                                >
                                    Szűrők törlése
                                </Button>
                            </aside>
                            {/* min-h: a shorter filtered list must not collapse the column —
                                that height snap was the owner-reported "page jumps" bug. */}
                            <div className="min-h-[60vh] min-w-0">
                                <div className="rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary">
                                    <div className="flex flex-wrap items-end gap-3">
                                        <Input
                                            size="sm"
                                            label="Keresés"
                                            aria-label="Termékkeresés"
                                            placeholder="Név, kategória vagy jellemző"
                                            icon={SearchLg}
                                            value={query}
                                            onChange={setQuery}
                                            className="min-w-0 flex-1"
                                        />
                                        <Select
                                            className="w-full sm:w-52"
                                            size="sm"
                                            label="Rendezés"
                                            aria-label="Rendezés"
                                            items={sortItems}
                                            value={sort}
                                            onChange={(key) =>
                                                key && setSort(String(key) as typeof sort)
                                            }
                                        >
                                            {(item) => (
                                                <Select.Item id={item.id}>{item.label}</Select.Item>
                                            )}
                                        </Select>
                                        <div className="lg:hidden">
                                            <SlideoutMenu.Trigger>
                                                <Button
                                                    color="secondary"
                                                    size="sm"
                                                    iconLeading={FilterLines}
                                                >
                                                    Szűrők
                                                </Button>
                                                <SlideoutMenu isDismissable>
                                                    {({ close }) => (
                                                        <>
                                                            <SlideoutMenu.Header onClose={close}>
                                                                <h2 className="text-lg font-semibold text-primary">
                                                                    Szűrők
                                                                </h2>
                                                                <p className="mt-1 text-sm text-tertiary">
                                                                    Szűkítsd a terméklistát.
                                                                </p>
                                                            </SlideoutMenu.Header>
                                                            <SlideoutMenu.Content>
                                                                {filterControls}
                                                            </SlideoutMenu.Content>
                                                            <SlideoutMenu.Footer>
                                                                <Button
                                                                    color="secondary"
                                                                    size="sm"
                                                                    onPress={clearFilters}
                                                                    isDisabled={activeFilterCount === 0}
                                                                >
                                                                    Szűrők törlése
                                                                </Button>
                                                                <Button size="sm" onPress={close}>
                                                                    {filteredProducts.length} termék mutatása
                                                                </Button>
                                                            </SlideoutMenu.Footer>
                                                        </>
                                                    )}
                                                </SlideoutMenu>
                                            </SlideoutMenu.Trigger>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-secondary pt-4">
                                        <p className="text-sm text-secondary" aria-live="polite">
                                            <span className="font-semibold text-primary">
                                                {filteredProducts.length}
                                            </span>
                                            {" "}/ {products.length} termék
                                        </p>
                                        <Badge color={activeFilterCount > 0 ? "brand" : "gray"}>
                                            {activeFilterCount > 0
                                                ? `${activeFilterCount} aktív szűrő`
                                                : "Teljes kínálat"}
                                        </Badge>
                                    </div>
                                </div>
                                {loading ? (
                                    <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-label="Termékek betöltése">
                                        {[0, 1, 2, 3, 4, 5].map((item) => (
                                            <div key={item} className="h-96 animate-pulse rounded-2xl bg-secondary motion-reduce:animate-none" />
                                        ))}
                                    </div>
                                ) : filteredProducts.length ? (
                                    /* key remounts the grid on any filter change → the shared-axis
                                       enter animation plays (reduced-motion users get an instant swap) */
                                    <ul
                                        key={`${query}|${sort}|${selectedCategories.join(",")}|${availableOnly}`}
                                        className="uui-axis-x is-in-fwd mt-6 grid gap-5 sm:grid-cols-2"
                                    >
                                        {filteredProducts.map((product, index) => {
                                            const wide =
                                                index === 0 ||
                                                (
                                                    filteredProducts.length > 2 &&
                                                    filteredProducts.length % 2 === 0 &&
                                                    index === filteredProducts.length - 1
                                                );
                                            return (
                                                <li
                                                    key={product.id}
                                                    className={wide ? "sm:col-span-2" : ""}
                                                >
                                                    <ProductCard
                                                        product={product}
                                                        index={index}
                                                        featured={wide}
                                                        pending={pending}
                                                        loading={pendingProductId === product.id}
                                                        added={addedProduct?.id === product.id}
                                                        onAdd={(product, source) =>
                                                            addToCart(product, undefined, source)
                                                        }
                                                    />
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <EmptyState className="py-16">
                                        <EmptyState.Header pattern="circle">
                                            <EmptyState.FeaturedIcon color="gray" icon={SearchLg} />
                                        </EmptyState.Header>
                                        <EmptyState.Content>
                                            <h2 className="text-md font-semibold text-primary">Nincs találat</h2>
                                            <EmptyState.Description>
                                                Töröld a szűrőket, vagy próbálj más keresést.
                                            </EmptyState.Description>
                                        </EmptyState.Content>
                                        <EmptyState.Footer>
                                            <Button
                                                color="secondary"
                                                onPress={() => {
                                                    setQuery("");
                                                    setSelectedCategories([]);
                                                    setAvailableOnly(false);
                                                }}
                                            >
                                                Szűrők törlése
                                            </Button>
                                        </EmptyState.Footer>
                                    </EmptyState>
                                )}
                            </div>
                        </div>
                        </div>
                    </section>
                    <section id="about" className="bg-primary px-4 py-16 lg:px-8 lg:py-24">
                        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                            <div className="relative min-h-96 overflow-hidden rounded-3xl bg-secondary shadow-lg ring-1 ring-secondary">
                                <img
                                    src={products[1]?.featuredImage.url ?? "/img/uui/application/listing-01.webp"}
                                    alt={products[1]?.featuredImage.altText ?? "Layered room edition"}
                                    width={products[1]?.featuredImage.width ?? 1200}
                                    height={products[1]?.featuredImage.height ?? 900}
                                    loading="lazy"
                                    className="absolute inset-0 size-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden="true" />
                                <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                                    <Badge
                                        color="gray"
                                        className="bg-utility-orange-50 text-utility-orange-700 ring-utility-orange-200"
                                    >
                                        Átgondolt választás
                                    </Badge>
                                    <p className="mt-4 max-w-sm text-xl font-semibold text-white">
                                        Hasznos termékek, érthető bemutatással.
                                    </p>
                                </div>
                            </div>
                            <div className="relative grid gap-5 overflow-hidden rounded-3xl bg-primary-solid p-6 shadow-lg ring-1 ring-secondary_alt sm:p-8 lg:p-10">
                                <div className="relative z-10">
                                    <p className="text-sm font-semibold text-primary_on-brand">Miért DevShopify?</p>
                                    <h2 className="mt-3 max-w-2xl text-balance text-display-sm font-semibold text-primary_on-brand sm:text-display-md">
                                        Az érthető kínálat gyorsabbá és nyugodtabbá teszi a vásárlást.
                                    </h2>
                                    <p className="mt-4 max-w-2xl text-md text-secondary_on-brand">
                                        Minden terméknél ugyanazt látod: mire való, mennyibe kerül, rendelhető-e és mi következik.
                                    </p>
                                </div>
                                <div className="relative z-10 grid gap-3 sm:grid-cols-2">
                                    {[
                                        ["01", "Világos árak", "A lényeg mindig jól látható.", "bg-utility-purple-50 text-utility-purple-700"],
                                        ["02", "Hasznos szűrők", "Csak olyan szűrő van, amely segít dönteni.", "bg-utility-orange-50 text-utility-orange-700"],
                                        ["03", "Biztonságos pénztár", "Érzékeny adatot csak jóváhagyott szolgáltató kezelhet.", "bg-utility-blue-light-50 text-utility-blue-light-700"],
                                        ["04", "Frissíthető kiemelés", "A kiválasztott termék külön fejlesztés nélkül kiemelhető.", "bg-utility-pink-50 text-utility-pink-700"],
                                    ].map(([number, title, copy, tone]) => (
                                        <article key={title} className="rounded-2xl bg-primary p-5 shadow-sm ring-1 ring-secondary">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
                                                {number}
                                            </span>
                                            <h3 className="mt-4 font-semibold text-primary">{title}</h3>
                                            <p className="mt-2 text-sm text-tertiary">{copy}</p>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            )}

            {view === "product" && currentProduct && selectedVariant && (
                <>
                    <main className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-16">
                        <nav aria-label="Breadcrumb" className="text-sm text-tertiary">
                            <a href="/shop" className="hover:text-primary">Termékek</a>
                            <span aria-hidden="true"> / </span>
                            <span>{currentProduct.productType}</span>
                        </nav>
                        <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)] lg:gap-14">
                            <div className="overflow-hidden rounded-2xl bg-secondary">
                                <img
                                    src={currentProduct.featuredImage.url}
                                    alt={currentProduct.featuredImage.altText}
                                    width={currentProduct.featuredImage.width}
                                    height={currentProduct.featuredImage.height}
                                    className="aspect-4/3 size-full object-cover"
                                />
                            </div>
                            <div className="min-w-0">
                                <ProductStatus product={currentProduct} />
                                <h1 className="mt-5 text-display-md font-semibold tracking-tight text-primary">{currentProduct.title}</h1>
                                <div className="mt-4 flex items-center gap-3">
                                    <p className="text-display-xs font-semibold text-primary">
                                        {formatMoney(selectedVariant.price.amount, selectedVariant.price.currencyCode)}
                                    </p>
                                    <span className="flex items-center gap-1 text-sm text-tertiary">
                                        <Star01 className="size-4 text-fg-brand-primary" aria-hidden="true" />
                                        Kiemelt termék
                                    </span>
                                </div>
                                <p className="mt-5 text-md leading-7 text-tertiary">{currentProduct.description}</p>
                                <div className="mt-8 border-t border-secondary pt-6">
                                    <RadioGroup
                                        aria-label="Változat kiválasztása"
                                        value={selectedVariant.id}
                                        onChange={setSelectedVariantId}
                                        className="grid gap-3"
                                    >
                                        {currentProduct.variants.map((variant) => (
                                            <RadioButton
                                                key={variant.id}
                                                value={variant.id}
                                                label={variant.title}
                                                hint={`${formatMoney(variant.price.amount, variant.price.currencyCode)}${variant.availableForSale ? "" : " · nem rendelhető"}`}
                                                isDisabled={!variant.availableForSale}
                                            />
                                        ))}
                                    </RadioGroup>
                                </div>
                                <Button
                                    size="xl"
                                    className="ir-cart-btn ir-reward mt-8 w-full"
                                    color="primary"
                                    data-ir-state={addedProduct?.id === currentProduct.id ? "success" : "idle"}
                                    iconLeading={
                                        addedProduct?.id === currentProduct.id ? (
                                            <CheckCircle data-icon="leading" className="ir-cart-icon size-5" />
                                        ) : (
                                            <Plus data-icon="leading" className="ir-cart-icon size-5" />
                                        )
                                    }
                                    isLoading={pendingProductId === currentProduct.id}
                                    isDisabled={!selectedVariant.availableForSale}
                                    onPress={(event) =>
                                        addToCart(currentProduct, selectedVariant, event.target as HTMLElement)
                                    }
                                >
                                    {addedProduct?.id === currentProduct.id
                                        ? "A kosárba került"
                                        : "Kosárba teszem"}
                                </Button>
                                <dl className="mt-8 grid gap-4 border-t border-secondary pt-6 sm:grid-cols-2">
                                    <div>
                                        <dt className="text-sm font-semibold text-primary">Szállítás</dt>
                                        <dd className="mt-1 text-sm text-tertiary">A végleges díj és idő rendelés előtt látható.</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-semibold text-primary">Visszaküldés</dt>
                                        <dd className="mt-1 text-sm text-tertiary">Részletek a visszaküldési tájékoztatóban.</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </main>
                    <TrustStrip />
                </>
            )}

            {view === "cart" && (
                <main className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
                    <p className="text-sm font-semibold text-brand-secondary">Ellenőrzés a pénztár előtt</p>
                    <h1 className="mt-2 text-display-md font-semibold text-primary">Kosár</h1>
                    {cart.lines.length ? (
                        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
                            <CartLines cart={cart} products={products} pending={pending} onQuantity={changeQuantity} onRemove={removeLine} />
                            <CartSummary cart={cart} />
                        </div>
                    ) : (
                        <EmptyState className="py-20">
                            <EmptyState.Header pattern="circle">
                                <EmptyState.FeaturedIcon color="gray" icon={ShoppingBag03} />
                            </EmptyState.Header>
                            <EmptyState.Content>
                                <h2 className="text-md font-semibold text-primary">A kosár üres</h2>
                                <EmptyState.Description>
                                    Nézd meg a kínálatot, és tedd kosárba, ami valóban hasznos.
                                </EmptyState.Description>
                            </EmptyState.Content>
                            <EmptyState.Footer>
                                <Button href="/shop" iconTrailing={ArrowRight}>Termékek megtekintése</Button>
                            </EmptyState.Footer>
                        </EmptyState>
                    )}
                </main>
            )}

            {view === "checkout" && (
                <main className="mx-auto max-w-5xl px-4 py-12 lg:px-8 lg:py-16">
                    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
                        <section>
                            <BadgeWithDot color={mode === "shopify" ? "success" : "warning"}>
                                {mode === "shopify" ? "Shopify pénztárkapcsolat aktív" : "Előnézeti pénztár"}
                            </BadgeWithDot>
                            <h1 className="mt-5 text-display-md font-semibold text-primary">Biztonságos pénztári átadás</h1>
                            <p className="mt-4 max-w-2xl text-lg text-tertiary">
                                Ez az oldal nem kér bankkártyaadatot. A fizetést csak jóváhagyott,
                                külön pénztárszolgáltató indíthatja egyértelmű jóváhagyás után.
                            </p>
                            <div className="mt-8 space-y-4">
                                {[
                                    ["A kosár megmarad", "Sikertelen átadás után sem vesznek el a kiválasztott tételek."],
                                    ["Az ár újra ellenőrizhető", "A végleges ár, készlet és szállítás a jóváhagyás előtt látható."],
                                    ["A fizetés külön felületen történik", "A webáruház nem kezel közvetlenül bankkártyaadatot."],
                                ].map(([title, copy]) => (
                                    <div key={title} className="flex gap-3 rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary">
                                        <CheckCircle className="mt-0.5 size-5 shrink-0 text-fg-success-primary" aria-hidden="true" />
                                        <div>
                                            <h2 className="text-sm font-semibold text-primary">{title}</h2>
                                            <p className="mt-1 text-sm text-tertiary">{copy}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                        <div>
                            <CartSummary cart={cart} showCheckoutAction={false} />
                            <Button
                                size="lg"
                                className="mt-4 w-full"
                                iconTrailing={ArrowRight}
                                isLoading={pending}
                                isDisabled={cart.lines.length === 0}
                                onPress={beginCheckout}
                            >
                                Tovább a biztonságos fizetéshez
                            </Button>
                            {cart.lines.length === 0 && (
                                <p className="mt-3 text-center text-sm text-tertiary">
                                    Előbb tegyél terméket a kosárba.
                                </p>
                            )}
                        </div>
                    </div>
                </main>
            )}

            {view === "order" && (
                <main className="mx-auto max-w-3xl px-4 py-16 text-center lg:px-8 lg:py-24">
                    <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-success-secondary text-fg-success-primary">
                        <CheckCircle className="size-7" aria-hidden="true" />
                    </span>
                    <p className="mt-6 text-sm font-semibold text-brand-secondary">Minta rendelési állapot</p>
                    <h1 className="mt-2 text-display-md font-semibold text-primary">A rendelés útja itt követhető.</h1>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-tertiary">
                        Ez előnézeti állapot. Valódi rendelésnél a szolgáltató ellenőrzött azonosítója
                        és a kereskedő értesítői jelennek meg.
                    </p>
                    <ol className="mx-auto mt-10 max-w-xl space-y-3 text-left">
                        {[
                            ["Rendelés beérkezett", "A pénztár elfogadta a rendelést."],
                            ["Előkészítés", "A teljesítési partner visszaigazolja a feldolgozást."],
                            ["Szállítási frissítés", "A követési adatot a beállított szolgáltató küldi."],
                        ].map(([title, copy], index) => (
                            <li key={title} className="flex gap-4 rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary">
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-section text-sm font-semibold text-primary_on-brand">
                                    {index + 1}
                                </span>
                                <div>
                                    <h2 className="text-sm font-semibold text-primary">{title}</h2>
                                    <p className="mt-1 text-sm text-secondary">{copy}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                    <Button href="/shop" size="lg" className="mt-10" iconTrailing={ArrowRight}>
                        Vásárlás folytatása
                    </Button>
                </main>
            )}

            {view === "info" && (
                <main className="mx-auto max-w-5xl px-4 py-12 lg:px-8 lg:py-20">
                    <Badge color="brand">{INFO_PAGES[infoKey].eyebrow}</Badge>
                    <h1 className="mt-5 max-w-3xl text-balance text-display-md font-semibold tracking-tight text-primary">
                        {INFO_PAGES[infoKey].title}
                    </h1>
                    <p className="mt-5 max-w-3xl text-pretty text-lg leading-8 text-secondary">
                        {INFO_PAGES[infoKey].intro}
                    </p>
                    <div className="mt-10 grid gap-4 sm:grid-cols-2">
                        {INFO_PAGES[infoKey].sections.map((section, index) => (
                            <section
                                key={section.title}
                                className={[
                                    "min-w-0 rounded-2xl bg-secondary p-5 ring-1 ring-secondary sm:p-6",
                                    index === 0 ? "sm:col-span-2" : "",
                                ].join(" ")}
                            >
                                <h2 className="text-lg font-semibold text-primary">{section.title}</h2>
                                <p className="mt-2 text-md leading-7 text-secondary">{section.copy}</p>
                            </section>
                        ))}
                    </div>
                    {infoKey === "cookies" && (
                        <section className="mt-8 rounded-2xl bg-primary p-5 shadow-sm ring-1 ring-secondary sm:p-6">
                            <h2 className="text-lg font-semibold text-primary">Választásod</h2>
                            <div className="mt-5 grid gap-4">
                                <Checkbox label="Szükséges sütik" hint="Mindig bekapcsolva" isSelected isDisabled />
                                <Checkbox label="Elemzési sütik" hint="A bolt javításához" isSelected={analyticsConsent} onChange={setAnalyticsConsent} />
                                <Checkbox label="Hirdetési mérés" hint="Meta, Google és TikTok" isSelected={marketingConsent} onChange={setMarketingConsent} />
                            </div>
                            <Button
                                className="mt-6"
                                onPress={() => {
                                    saveConsent({ analytics: analyticsConsent, marketing: marketingConsent });
                                    setConsentSaved(true);
                                }}
                            >
                                Beállítások mentése
                            </Button>
                            <p className="mt-3 text-sm text-secondary" role="status" aria-live="polite">
                                {consentSaved ? "A beállításokat elmentettük." : "A mérés engedély nélkül kikapcsolva marad."}
                            </p>
                        </section>
                    )}
                    {infoKey === "contact" && (
                        <Button href={`mailto:${STORE.contact.email}`} className="mt-8" iconTrailing={ArrowRight}>
                            E-mail írása
                        </Button>
                    )}
                </main>
            )}

            <ShopFooter brand={brand} />
        </div>
    );
}
