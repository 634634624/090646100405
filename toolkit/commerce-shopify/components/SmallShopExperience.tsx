"use client";

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
import {
    cartFromMutation,
    loadShopifyCart,
    loadShopifyProducts,
    rememberCart,
    storedCartId,
    storefrontRequest,
} from "../lib/client";
import type {
    Cart,
    CartLine,
    Product,
    ProductVariant,
    StorefrontMode,
} from "../lib/contracts";
import {
    calculateMockCart,
    EMPTY_CART,
    MOCK_PRODUCTS,
} from "../lib/mock-data";

export type SmallShopView = "shop" | "product" | "cart" | "checkout" | "order";

interface Props {
    view: SmallShopView;
    mode?: StorefrontMode;
    brand?: string;
}
const MOCK_CART_KEY = "uui-small-shop-mock-cart-v1";

function formatMoney(amount: string | number, currencyCode = "EUR") {
    return new Intl.NumberFormat("en-IE", {
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
        return <Badge color="error">Sold out</Badge>;
    }
    if (product.inventoryState === "low-stock") {
        return <Badge color="warning">Low stock</Badge>;
    }
    return <BadgeWithDot color="success">In stock</BadgeWithDot>;
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
                "group relative flex h-full min-w-0 overflow-hidden rounded-3xl bg-primary shadow-md ring-1 ring-secondary transition duration-200",
                "hover:-translate-y-1 hover:shadow-xl hover:ring-brand motion-reduce:transition-none motion-reduce:hover:translate-y-0",
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
                <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 bottom-0 h-1.5 ${tone.accent}`}
                />
            </a>
            <div className={`flex flex-1 flex-col ${featured ? "p-6 md:p-8" : "p-5"}`}>
                <div className="flex items-center justify-between gap-3">
                    <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${tone.detail}`}>
                        {product.productType}
                    </p>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone.panel} ${tone.detail}`}>
                        Edition {String(index + 1).padStart(2, "0")}
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
                        <p className="mt-1 text-xs text-tertiary">Complete room edition</p>
                    </div>
                    <Button
                        size="lg"
                        aria-label={`Add ${product.title} to bag`}
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
                        {added ? "Added to bag" : "Add to bag"}
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
            title: "Hosted checkout",
            detail: "Payment stays with Shopify",
            tone: "bg-utility-indigo-50 text-utility-indigo-700 ring-utility-indigo-200",
        },
        {
            icon: Truck01,
            title: "Clear delivery",
            detail: "Final rates shown at checkout",
            tone: "bg-utility-orange-50 text-primary ring-utility-orange-200",
        },
        {
            icon: CheckCircle,
            title: "Considered range",
            detail: "Six coherent room editions",
            tone: "bg-utility-blue-light-50 text-utility-blue-light-700 ring-utility-blue-light-200",
        },
    ];
    return (
        <section
            aria-label="Shopping assurances"
            className="bg-primary px-4 pb-12 lg:px-8 lg:pb-16"
        >
            <div className="mx-auto grid max-w-7xl gap-3 rounded-3xl bg-secondary p-3 shadow-inner ring-1 ring-secondary sm:grid-cols-3">
                {items.map(({ icon: Icon, title, detail, tone }) => (
                    <div
                        key={title}
                        className="flex min-w-0 items-center gap-3 rounded-2xl bg-primary px-4 py-5 shadow-xs ring-1 ring-secondary"
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

function ShopFooter({ brand }: { brand: string }) {
    return (
        <footer className="border-t border-secondary_alt bg-primary-solid">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-[minmax(0,1fr)_auto] lg:px-8">
                <div className="min-w-0">
                    <p className="text-lg font-semibold text-primary_on-brand">{brand}</p>
                    <p className="mt-2 max-w-md text-sm text-tertiary_on-brand">
                        A focused small-shop starter. Replace all sample brand, product, delivery,
                        return, and legal content before launch.
                    </p>
                </div>
                <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                    <a className="text-secondary_on-brand hover:text-primary_on-brand" href="/shop">Shop</a>
                    <a className="text-secondary_on-brand hover:text-primary_on-brand" href="/cart">Cart</a>
                    <a className="text-secondary_on-brand hover:text-primary_on-brand" href="/shop#about">Our approach</a>
                    <a className="text-secondary_on-brand hover:text-primary_on-brand" href="/checkout">Checkout</a>
                </nav>
            </div>
        </footer>
    );
}

function CartLines({
    cart,
    pending,
    onQuantity,
    onRemove,
}: {
    cart: Cart;
    pending: boolean;
    onQuantity: (line: CartLine, quantity: number) => void;
    onRemove: (line: CartLine) => void;
}) {
    return (
        <ul className="divide-y divide-secondary" aria-live="polite">
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
                                aria-label={`Remove ${line.productTitle}`}
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
                                    aria-label={`Decrease ${line.productTitle} quantity`}
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
                                    aria-label={`Increase ${line.productTitle} quantity`}
                                    iconLeading={Plus}
                                    isDisabled={pending}
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
    checkoutLabel = "Continue to checkout",
    showCheckoutAction = true,
}: {
    cart: Cart;
    checkoutHref?: string;
    checkoutLabel?: string;
    showCheckoutAction?: boolean;
}) {
    return (
        <aside className="rounded-2xl border border-secondary bg-secondary p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-primary">Order summary</h2>
            <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                    <dt className="text-secondary">Subtotal</dt>
                    <dd className="font-medium text-primary">
                        {formatMoney(cart.subtotal.amount, cart.subtotal.currencyCode)}
                    </dd>
                </div>
                <div className="flex justify-between gap-4">
                    <dt className="text-secondary">Delivery</dt>
                    <dd className="text-secondary">Calculated by Shopify</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-secondary pt-4">
                    <dt className="font-semibold text-primary">Estimated total</dt>
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
                Final delivery, taxes, discounts, customer details, and payment are handled by
                Shopify checkout.
            </p>
        </aside>
    );
}

export function SmallShopExperience({
    view,
    mode = "mock",
    brand = "Fieldwork Living",
}: Props) {
    const [products, setProducts] = useState(MOCK_PRODUCTS);
    const [cart, setCart] = useState<Cart>(EMPTY_CART);
    const [loading, setLoading] = useState(mode === "shopify");
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
    }, []);

    useEffect(() => {
        let active = true;
        async function hydrateStore() {
            if (mode === "mock") {
                setCart(readMockCart());
                setLoading(false);
                return;
            }
            try {
                const [liveProducts, liveCart] = await Promise.all([
                    loadShopifyProducts(),
                    loadShopifyCart(),
                ]);
                if (!active) return;
                setProducts(liveProducts);
                setCart(liveCart ?? EMPTY_CART);
            } catch (cause) {
                if (!active) return;
                setError(cause instanceof Error ? cause.message : "The store could not load.");
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
            if (mode === "mock") {
                const existing = cart.lines.find(
                    (line) => line.merchandiseId === selected.id,
                );
                const nextLines = existing
                    ? cart.lines.map((line) =>
                          line.id === existing.id
                              ? { ...line, quantity: line.quantity + 1 }
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
            const cartId = storedCartId();
            const operation = cartId ? "cartLinesAdd" : "cartCreate";
            const variables = cartId
                ? {
                      cartId,
                      lines: [{ merchandiseId: selected.id, quantity: 1 }],
                  }
                : { input: { lines: [{ merchandiseId: selected.id, quantity: 1 }] } };
            const data = await storefrontRequest<Record<string, unknown>>(operation, variables);
            setCart(rememberCart(cartFromMutation(data, operation)));
            confirmAdded(product, source);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "The cart could not update.");
        } finally {
            setPending(false);
            setPendingProductId("");
        }
    }

    async function changeQuantity(line: CartLine, quantity: number) {
        setPending(true);
        setError("");
        try {
            if (mode === "mock") {
                const lines =
                    quantity <= 0
                        ? cart.lines.filter((entry) => entry.id !== line.id)
                        : cart.lines.map((entry) =>
                              entry.id === line.id ? { ...entry, quantity } : entry,
                          );
                setCart(writeMockCart(calculateMockCart(lines)));
                return;
            }
            const cartId = storedCartId();
            if (!cartId) return;
            const data = await storefrontRequest<Record<string, unknown>>("cartLinesUpdate", {
                cartId,
                lines: [{ id: line.id, quantity }],
            });
            setCart(rememberCart(cartFromMutation(data, "cartLinesUpdate")));
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "The cart could not update.");
        } finally {
            setPending(false);
        }
    }

    async function removeLine(line: CartLine) {
        if (mode === "mock") return changeQuantity(line, 0);
        setPending(true);
        setError("");
        try {
            const cartId = storedCartId();
            if (!cartId) return;
            const data = await storefrontRequest<Record<string, unknown>>("cartLinesRemove", {
                cartId,
                lineIds: [line.id],
            });
            setCart(rememberCart(cartFromMutation(data, "cartLinesRemove")));
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "The cart could not update.");
        } finally {
            setPending(false);
        }
    }

    async function beginCheckout() {
        if (!cart.lines.length) return;
        setPending(true);
        setError("");
        try {
            if (mode === "mock") {
                window.location.assign("/orders/demo-1001");
                return;
            }
            const cartId = storedCartId();
            if (!cartId) throw new Error("The cart is unavailable.");
            const data = await storefrontRequest<{ cart?: { checkoutUrl?: string } }>("cart", {
                id: cartId,
            });
            const checkoutUrl = data.cart?.checkoutUrl;
            if (!checkoutUrl) throw new Error("Shopify checkout is unavailable.");
            const target = new URL(checkoutUrl);
            const safe =
                target.protocol === "https:" &&
                (target.hostname.endsWith(".myshopify.com") ||
                    target.hostname === "checkout.shopify.com");
            if (!safe) throw new Error("Shopify returned an unsafe checkout URL.");
            window.location.assign(target.href);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Checkout could not start.");
        } finally {
            setPending(false);
        }
    }

    const activeFilterCount =
        selectedCategories.length + (availableOnly ? 1 : 0) + (query.trim() ? 1 : 0);
    const sortItems = [
        { id: "featured", label: "Featured" },
        { id: "price-asc", label: "Price: low to high" },
        { id: "price-desc", label: "Price: high to low" },
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
                    <h3 className="text-md font-semibold text-primary">Filters</h3>
                    <p className="mt-1 text-sm text-tertiary">Refine the room edit.</p>
                </div>
                {activeFilterCount > 0 && (
                    <Badge color="brand">{activeFilterCount} active</Badge>
                )}
            </div>
            <fieldset className="border-t border-secondary pt-5">
                <legend className="text-sm font-semibold text-primary">Room</legend>
                <div className="mt-4 space-y-3">
                    {categories.map((category) => (
                        <Checkbox
                            key={category}
                            label={category}
                            hint={`${products.filter((product) => product.productType === category).length} editions`}
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
                    label="Available now"
                    hint="Hide sold-out editions"
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
                        <p className="text-sm font-semibold text-brand-secondary">Your order</p>
                        <h2 className="mt-1 text-display-xs font-semibold text-primary">
                            Shopping bag
                        </h2>
                    </SlideoutMenu.Header>
                    <SlideoutMenu.Content>
                        {cart.lines.length ? (
                            <CartLines
                                cart={cart}
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
                                    <h2 className="text-md font-semibold text-primary">Your bag is empty</h2>
                                    <EmptyState.Description>
                                        Add a room edition to review it here.
                                    </EmptyState.Description>
                                </EmptyState.Content>
                            </EmptyState>
                        )}
                    </SlideoutMenu.Content>
                    {cart.lines.length > 0 && (
                        <SlideoutMenu.Footer>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-sm text-tertiary">Subtotal</span>
                                <span className="font-semibold text-primary">
                                    {formatMoney(cart.subtotal.amount, cart.subtotal.currencyCode)}
                                </span>
                            </div>
                            <Button href="/cart" size="lg" className="mt-4 w-full">
                                Review cart
                            </Button>
                        </SlideoutMenu.Footer>
                    )}
                </>
            )}
        </SlideoutMenu>
    );

    return (
        <div
            data-uui-brand-palette="violet-terracotta-sky-rose"
            className="min-h-dvh bg-primary text-primary"
        >
            <div className="border-b border-utility-orange-200 bg-utility-orange-50 px-4 py-2 text-center text-sm font-semibold text-primary">
                New season · complimentary delivery on complete room editions
            </div>
            <header className="sticky top-0 z-40 border-b border-secondary bg-primary/90 shadow-xs backdrop-blur-lg">
                <div className="mx-auto flex h-18 max-w-7xl items-center gap-3 px-4 lg:px-8">
                    <SlideoutMenu.Trigger>
                        <Button
                            color="tertiary"
                            size="lg"
                            className="sm:hidden"
                            aria-label="Open navigation"
                            iconLeading={Menu01}
                        />
                        <SlideoutMenu isDismissable>
                            {({ close }) => (
                                <>
                                    <SlideoutMenu.Header onClose={close}>
                                        <p className="text-lg font-semibold text-primary">{brand}</p>
                                    </SlideoutMenu.Header>
                                    <SlideoutMenu.Content>
                                        <nav className="grid gap-2 text-md font-semibold">
                                            <a className="rounded-lg p-3 text-primary hover:bg-secondary" href="/shop">Shop</a>
                                            <a className="rounded-lg p-3 text-primary hover:bg-secondary" href="/shop#collections">Collections</a>
                                            <a className="rounded-lg p-3 text-primary hover:bg-secondary" href="/cart">Cart</a>
                                        </nav>
                                    </SlideoutMenu.Content>
                                </>
                            )}
                        </SlideoutMenu>
                    </SlideoutMenu.Trigger>
                    <a
                        href="/shop"
                        aria-label={brand}
                        className="flex items-center gap-2.5 whitespace-nowrap text-md font-semibold tracking-tight text-primary sm:text-lg"
                    >
                        <span className="grid size-8 place-items-center rounded-xl bg-brand-solid text-xs font-bold text-primary_on-brand shadow-sm">
                            FL
                        </span>
                        <span className="hidden sm:inline">{brand}</span>
                    </a>
                    <nav className="ml-6 hidden items-center gap-6 text-sm font-semibold text-secondary sm:flex">
                        <a href="/shop" className="hover:text-primary">Shop</a>
                        <a href="/shop#collections" className="hover:text-primary">Collections</a>
                        <a href="/shop#about" className="hover:text-primary">Our approach</a>
                    </nav>
                    <div className="ml-auto flex items-center gap-1">
                        <Button
                            color="tertiary"
                            size="lg"
                            aria-label={dark ? "Use light theme" : "Use dark theme"}
                            iconLeading={dark ? Sun : Moon01}
                            onPress={() => setTheme(!dark)}
                        />
                        <SlideoutMenu.Trigger>
                            <Button
                                color={cart.totalQuantity > 0 ? "primary" : "secondary"}
                                size="lg"
                                aria-label={`Open shopping bag, ${cart.totalQuantity} items`}
                                iconLeading={ShoppingBag03}
                                data-shop-cart-target
                            >
                                <span className="sr-only sm:not-sr-only">Bag</span>
                                <Badge
                                    color={cart.totalQuantity > 0 ? "success" : "gray"}
                                    size="md"
                                    className="shop-cart-count ir-badge min-w-7 justify-center font-semibold tabular-nums"
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
                    ? `${addedProduct.title} added to bag. ${cart.totalQuantity} ${cart.totalQuantity === 1 ? "item" : "items"} in bag.`
                    : ""}
            </p>

            {view === "shop" && (
                <>
                    <section
                        data-uui-critical-hero
                        className="bg-primary px-4 py-6 sm:py-10 lg:px-8 lg:py-16"
                    >
                        <div className="mx-auto grid max-w-7xl items-center lg:grid-cols-[minmax(0,1.15fr)_minmax(26rem,0.85fr)]">
                            <div className="relative min-h-64 overflow-hidden rounded-3xl bg-secondary shadow-xl ring-1 ring-secondary sm:min-h-96 lg:min-h-150">
                                <img
                                    data-uui-hero-media
                                    src="/img/uui/application/listing-01.webp"
                                    alt="Warm listening room with considered furniture"
                                    width={1200}
                                    height={900}
                                    loading="eager"
                                    fetchPriority="high"
                                    className="absolute inset-0 size-full object-cover transition duration-700 hover:scale-[1.02] motion-reduce:transition-none"
                                />
                                <div
                                    aria-hidden="true"
                                    className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10"
                                />
                                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white sm:p-7">
                                    <div>
                                        <p className="text-sm font-semibold text-white">The Listening Edition</p>
                                        <p className="mt-1 text-sm text-white/75">Oak · linen · brushed metal</p>
                                    </div>
                                    <span className="rounded-full border border-white/30 bg-black/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                                        01 / 06
                                    </span>
                                </div>
                            </div>
                            <div className="relative z-10 mx-3 -mt-6 overflow-hidden rounded-3xl bg-primary p-5 shadow-2xl ring-1 ring-secondary sm:mx-8 sm:-mt-10 sm:p-8 lg:-ml-20 lg:mr-0 lg:mt-0 lg:p-10">
                                <span
                                    aria-hidden="true"
                                    className="absolute inset-x-0 top-0 h-1 bg-utility-pink-500"
                                />
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge
                                        color="gray"
                                        className="bg-utility-orange-50 text-utility-orange-700 ring-utility-orange-200"
                                    >
                                        Curated interiors
                                    </Badge>
                                    <Badge
                                        color="gray"
                                        className="bg-utility-blue-light-50 text-utility-blue-light-700 ring-utility-blue-light-200"
                                    >
                                        Sample store
                                    </Badge>
                                </div>
                                <h1 className="mt-5 max-w-xl text-balance text-display-sm font-semibold tracking-tight text-primary sm:text-display-md lg:text-display-lg">
                                    One room. Every piece considered.
                                </h1>
                                <p className="mt-5 max-w-xl text-pretty text-md leading-7 text-secondary sm:text-lg">
                                    Complete room editions with clear prices, real availability,
                                    and a calm path to Shopify checkout.
                                </p>
                                <div
                                    data-uui-hero-actions
                                    className="mt-7 flex flex-col gap-3 sm:flex-row"
                                >
                                    <Button
                                        href="#collections"
                                        size="lg"
                                        className="w-full sm:w-auto"
                                        iconTrailing={ArrowRight}
                                    >
                                        Explore six editions
                                    </Button>
                                    <Button
                                        href="#about"
                                        color="secondary"
                                        size="lg"
                                        className="w-full sm:w-auto"
                                    >
                                        How we curate
                                    </Button>
                                </div>
                                <div className="mt-7 grid grid-cols-3 gap-2.5 border-t border-secondary pt-5">
                                    {[
                                        ["06", "room editions", "text-utility-orange-700"],
                                        ["24h", "stock refresh", "text-utility-blue-light-700"],
                                        ["1", "secure checkout", "text-utility-pink-700"],
                                    ].map(([value, label, tone]) => (
                                        <div key={label} className="min-w-0 rounded-xl bg-secondary px-3 py-3">
                                            <p className={`text-lg font-semibold ${tone}`}>{value}</p>
                                            <p className="mt-0.5 text-xs text-secondary">{label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                    <TrustStrip />
                    <section id="collections" className="bg-secondary px-4 py-14 lg:px-8 lg:py-20">
                        <div className="mx-auto max-w-7xl">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-3">
                                <span className="h-px w-10 bg-utility-orange-500" aria-hidden="true" />
                                <p className="text-sm font-semibold text-primary">The room edit</p>
                            </div>
                            <h2 className="mt-3 text-balance text-display-sm font-semibold text-primary sm:text-display-md">
                                A small collection with a strong point of view.
                            </h2>
                            <p className="mt-4 max-w-2xl text-md text-secondary">
                                Search, filter, compare, then move to Shopify only when you are ready to pay.
                            </p>
                        </div>
                        <div className="mt-10 grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                            <aside
                                data-uui-filter-template="category-filter2"
                                aria-label="Product filters"
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
                                    Clear filters
                                </Button>
                            </aside>
                            <div className="min-w-0">
                                <div className="rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary">
                                    <div className="flex flex-wrap items-end gap-3">
                                        <Input
                                            size="sm"
                                            label="Search"
                                            aria-label="Search room editions"
                                            placeholder="Search room editions"
                                            icon={SearchLg}
                                            value={query}
                                            onChange={setQuery}
                                            className="min-w-0 flex-1"
                                        />
                                        <Select
                                            className="w-full sm:w-52"
                                            size="sm"
                                            label="Sort"
                                            aria-label="Sort"
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
                                                    Filters
                                                </Button>
                                                <SlideoutMenu isDismissable>
                                                    {({ close }) => (
                                                        <>
                                                            <SlideoutMenu.Header onClose={close}>
                                                                <h2 className="text-lg font-semibold text-primary">
                                                                    Filters
                                                                </h2>
                                                                <p className="mt-1 text-sm text-tertiary">
                                                                    Refine the room edit.
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
                                                                    Clear filters
                                                                </Button>
                                                                <Button size="sm" onPress={close}>
                                                                    Show {filteredProducts.length} editions
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
                                            {" "}of {products.length} editions
                                        </p>
                                        <Badge color={activeFilterCount > 0 ? "brand" : "gray"}>
                                            {activeFilterCount > 0
                                                ? `${activeFilterCount} filters active`
                                                : "Full collection"}
                                        </Badge>
                                    </div>
                                </div>
                                {loading ? (
                                    <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading products">
                                        {[0, 1, 2, 3, 4, 5].map((item) => (
                                            <div key={item} className="h-96 animate-pulse rounded-2xl bg-secondary motion-reduce:animate-none" />
                                        ))}
                                    </div>
                                ) : filteredProducts.length ? (
                                    <ul className="mt-6 grid gap-5 sm:grid-cols-2">
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
                                            <h2 className="text-md font-semibold text-primary">No matching editions</h2>
                                            <EmptyState.Description>
                                                Clear the filters or try a broader room name.
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
                                                Clear filters
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
                                        Material study
                                    </Badge>
                                    <p className="mt-4 max-w-sm text-xl font-semibold text-white">
                                        Fewer objects. Better relationships between them.
                                    </p>
                                </div>
                            </div>
                            <div className="relative grid gap-5 overflow-hidden rounded-3xl bg-primary-solid p-6 shadow-lg ring-1 ring-secondary_alt sm:p-8 lg:p-10">
                                <span
                                    aria-hidden="true"
                                    className="absolute inset-x-0 top-0 h-1 bg-utility-orange-500"
                                />
                                <div className="relative z-10">
                                    <p className="text-sm font-semibold text-primary_on-brand">Why this shop stays small</p>
                                    <h2 className="mt-3 max-w-2xl text-balance text-display-sm font-semibold text-primary_on-brand sm:text-display-md">
                                        A deliberate range is easier to understand—and easier to trust.
                                    </h2>
                                    <p className="mt-4 max-w-2xl text-md text-secondary_on-brand">
                                        Every surface answers one buying question: what it is, what it costs,
                                        whether it is available, and what happens next.
                                    </p>
                                </div>
                                <div className="relative z-10 grid gap-3 sm:grid-cols-2">
                                    {[
                                        ["01", "Visible hierarchy", "Price, availability, and next action stay prominent.", "bg-utility-purple-50 text-utility-purple-700"],
                                        ["02", "Useful filters", "Only facets that help this six-product range.", "bg-utility-orange-50 text-utility-orange-700"],
                                        ["03", "Hosted payment", "Shopify owns sensitive checkout details.", "bg-utility-blue-light-50 text-utility-blue-light-700"],
                                        ["04", "Truthful data", mode === "mock" ? "Mock mode stays explicit until Shopify is configured." : "Live catalogue served by Shopify.", "bg-utility-pink-50 text-utility-pink-700"],
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
                </>
            )}

            {view === "product" && currentProduct && selectedVariant && (
                <>
                    <main className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-16">
                        <nav aria-label="Breadcrumb" className="text-sm text-tertiary">
                            <a href="/shop" className="hover:text-primary">Shop</a>
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
                                        4.9 · sample rating
                                    </span>
                                </div>
                                <p className="mt-5 text-md leading-7 text-tertiary">{currentProduct.description}</p>
                                <div className="mt-8 border-t border-secondary pt-6">
                                    <RadioGroup
                                        aria-label="Choose edition"
                                        value={selectedVariant.id}
                                        onChange={setSelectedVariantId}
                                        className="grid gap-3"
                                    >
                                        {currentProduct.variants.map((variant) => (
                                            <RadioButton
                                                key={variant.id}
                                                value={variant.id}
                                                label={variant.title}
                                                hint={`${formatMoney(variant.price.amount, variant.price.currencyCode)}${variant.availableForSale ? "" : " · unavailable"}`}
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
                                        ? "Edition added to bag"
                                        : "Add edition to bag"}
                                </Button>
                                <dl className="mt-8 grid gap-4 border-t border-secondary pt-6 sm:grid-cols-2">
                                    <div>
                                        <dt className="text-sm font-semibold text-primary">Delivery</dt>
                                        <dd className="mt-1 text-sm text-tertiary">Final rate and timing in Shopify checkout.</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-semibold text-primary">Returns</dt>
                                        <dd className="mt-1 text-sm text-tertiary">Replace with the merchant’s verified policy.</dd>
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
                    <p className="text-sm font-semibold text-brand-secondary">Review before checkout</p>
                    <h1 className="mt-2 text-display-md font-semibold text-primary">Your shopping bag</h1>
                    {cart.lines.length ? (
                        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
                            <CartLines cart={cart} pending={pending} onQuantity={changeQuantity} onRemove={removeLine} />
                            <CartSummary cart={cart} />
                        </div>
                    ) : (
                        <EmptyState className="py-20">
                            <EmptyState.Header pattern="circle">
                                <EmptyState.FeaturedIcon color="gray" icon={ShoppingBag03} />
                            </EmptyState.Header>
                            <EmptyState.Content>
                                <h2 className="text-md font-semibold text-primary">Your bag is empty</h2>
                                <EmptyState.Description>
                                    Browse the focused collection and add an edition when it feels right.
                                </EmptyState.Description>
                            </EmptyState.Content>
                            <EmptyState.Footer>
                                <Button href="/shop" iconTrailing={ArrowRight}>Browse editions</Button>
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
                                {mode === "shopify" ? "Shopify connected" : "Mock checkout"}
                            </BadgeWithDot>
                            <h1 className="mt-5 text-display-md font-semibold text-primary">Secure checkout handoff</h1>
                            <p className="mt-4 max-w-2xl text-lg text-tertiary">
                                This storefront never asks for card, billing, or delivery details.
                                Shopify collects them on its hosted checkout after one explicit action.
                            </p>
                            <div className="mt-8 space-y-4">
                                {[
                                    ["Your cart stays intact", "Cancel returns without losing the selected editions."],
                                    ["Prices are revalidated", "Shopify owns final price, stock, delivery, discounts, and tax."],
                                    ["Payment stays off-site", "No custom card form or direct Stripe handling exists here."],
                                ].map(([title, copy]) => (
                                    <div key={title} className="flex gap-3 rounded-xl border border-secondary p-4">
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
                                {mode === "shopify" ? "Continue to Shopify" : "Simulate checkout"}
                            </Button>
                            {cart.lines.length === 0 && (
                                <p className="mt-3 text-center text-sm text-tertiary">
                                    Add an edition before checkout.
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
                    <p className="mt-6 text-sm font-semibold text-brand-secondary">Order DEMO-1001</p>
                    <h1 className="mt-2 text-display-md font-semibold text-primary">Your order journey starts here.</h1>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-tertiary">
                        This is a sample confirmation state. A live customer receives Shopify’s
                        verified order reference and the merchant’s transactional emails.
                    </p>
                    <ol className="mx-auto mt-10 max-w-xl space-y-3 text-left">
                        {[
                            ["Order received", "Shopify accepted the checkout."],
                            ["Preparing the edition", "The merchant confirms fulfilment."],
                            ["Delivery update", "Tracking is sent through the configured provider."],
                        ].map(([title, copy], index) => (
                            <li key={title} className="flex gap-4 rounded-xl border border-secondary bg-secondary p-4">
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-section text-sm font-semibold text-brand-secondary">
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
                        Continue shopping
                    </Button>
                </main>
            )}

            <ShopFooter brand={brand} />
        </div>
    );
}
