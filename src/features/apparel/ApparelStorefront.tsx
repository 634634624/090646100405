"use client";

// @uui-source: ADAPT src/catalog/custom/twp-ecommerce/01-product-grid.tsx
// @uui-source: REUSE src/components/base/buttons/button.tsx
// @uui-source: REUSE src/components/base/badges/badges.tsx

import { useEffect, useMemo, useState } from "react";
import {
    ArrowRight,
    Moon01,
    ShoppingBag03,
    Sun,
} from "@untitledui-pro/icons/line";
import { Badge } from "@/components/base/badges/badges";
import { Button as UuiButton } from "@/components/base/buttons/button";
import {
    apparelCategories,
    apparelProducts,
    type ApparelCategory,
} from "./catalog";

export function ApparelStorefront() {
    const [activeCategory, setActiveCategory] = useState<ApparelCategory>("All");
    const [dark, setDark] = useState(false);

    useEffect(() => {
        setDark(document.documentElement.classList.contains("dark-mode"));
    }, []);

    const visibleProducts = useMemo(
        () =>
            activeCategory === "All"
                ? apparelProducts
                : apparelProducts.filter((product) => product.category === activeCategory),
        [activeCategory],
    );

    const toggleTheme = () => {
        const nextDark = !dark;
        document.documentElement.classList.toggle("dark-mode", nextDark);
        window.localStorage.setItem("uui-site-theme", nextDark ? "dark" : "light");
        setDark(nextDark);
    };

    return (
        <div className="min-h-screen bg-primary text-primary">
            <header className="border-b border-secondary bg-primary">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <a
                        href="/shop/apparel"
                        className="shrink-0 text-lg font-semibold tracking-tight text-primary outline-brand focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                        Fieldwork Goods
                    </a>

                    <nav aria-label="Primary navigation" className="hidden items-center gap-6 md:flex">
                        <a className="text-sm font-semibold text-primary" href="/shop/apparel">
                            Clothing
                        </a>
                        <a className="text-sm font-medium text-tertiary hover:text-primary" href="/shop">
                            Living
                        </a>
                    </nav>

                    <div className="flex items-center gap-1">
                        <UuiButton
                            aria-label={dark ? "Use light theme" : "Use dark theme"}
                            color="tertiary"
                            size="sm"
                            iconLeading={dark ? Sun : Moon01}
                            onPress={toggleTheme}
                        />
                        <UuiButton
                            href="/cart"
                            color="tertiary"
                            size="sm"
                            iconLeading={ShoppingBag03}
                            className="hidden sm:inline-flex"
                        >
                            Bag
                        </UuiButton>
                    </div>
                </div>
            </header>

            <main>
                <section data-uui-critical-hero className="border-b border-secondary bg-secondary">
                    <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-10 sm:px-6 md:grid-cols-[minmax(0,0.8fr)_minmax(20rem,1.2fr)] md:py-14 lg:gap-16 lg:px-8">
                        <div data-uui-hero-actions className="max-w-lg">
                            <Badge color="brand">
                                Spring / Summer 2026
                            </Badge>
                            <h1 className="mt-5 text-display-md font-semibold tracking-tight text-primary md:text-display-lg">
                                Six staples, built to last.
                            </h1>
                            <p className="mt-5 max-w-md text-md text-tertiary md:text-lg">
                                Heavyweight cotton, useful layers, and an easy neutral palette for the everyday rotation.
                            </p>
                            <div className="mt-6 flex flex-wrap gap-3">
                                <UuiButton href="#new-arrivals" size="lg" iconTrailing={ArrowRight}>
                                    Shop the collection
                                </UuiButton>
                                <UuiButton href="/shop/apparel/utility-jacket" color="link-gray" size="lg">
                                    See the utility jacket
                                </UuiButton>
                            </div>
                            <dl className="mt-8 grid grid-cols-2 gap-5 border-t border-primary pt-5">
                                <div>
                                    <dt className="text-xs font-semibold uppercase tracking-wider text-tertiary">Edit</dt>
                                    <dd className="mt-1 text-sm font-semibold text-primary">6 considered pieces</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-semibold uppercase tracking-wider text-tertiary">Returns</dt>
                                    <dd className="mt-1 text-sm font-semibold text-primary">30 days, no fuss</dd>
                                </div>
                            </dl>
                        </div>

                        <div
                            data-uui-hero-media
                            className="relative min-h-[25rem] min-w-0 overflow-hidden rounded-2xl bg-primary sm:min-h-[31rem]"
                            aria-label="Featured apparel"
                        >
                            <img
                                src="/img/apparel/jacket.jpg"
                                alt="Olive utility jacket"
                                width="491"
                                height="493"
                                loading="eager"
                                className="absolute inset-0 size-full object-cover"
                            />
                            <a
                                href="/shop/apparel/heavyweight-tee"
                                className="absolute top-3 right-3 block w-28 rounded-xl bg-primary p-2 shadow-lg outline-brand transition duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:top-5 sm:right-5 sm:w-40"
                            >
                                <img
                                    src="/img/apparel/tee.jpg"
                                    alt="Natural heavyweight T-shirt"
                                    width="491"
                                    height="493"
                                    loading="eager"
                                    className="aspect-square w-full rounded-lg object-cover"
                                />
                                <span className="mt-2 block truncate text-xs font-semibold text-primary sm:text-sm">
                                    Heavyweight tee · $48
                                </span>
                            </a>
                            <a
                                href="/shop/apparel/utility-jacket"
                                className="absolute right-3 bottom-3 left-3 flex items-center justify-between gap-4 rounded-xl bg-primary/95 px-4 py-3 shadow-lg outline-brand backdrop-blur-sm focus-visible:outline-2 focus-visible:outline-offset-2 sm:right-auto sm:bottom-5 sm:left-5 sm:min-w-64"
                            >
                                <span>
                                    <span className="block text-xs text-tertiary">Featured layer</span>
                                    <span className="mt-0.5 block text-sm font-semibold text-primary">Utility jacket · Olive</span>
                                </span>
                                <ArrowRight aria-hidden="true" className="size-5 shrink-0 text-brand-secondary" />
                            </a>
                        </div>
                    </div>
                </section>

                <section id="collection" className="bg-primary">
                    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
                        <div className="flex flex-col gap-5 border-b border-secondary pb-6 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-brand-secondary">Fieldwork Goods / 01</p>
                                <h2 id="new-arrivals" className="mt-1 text-display-xs font-semibold text-primary md:text-display-sm">
                                    The everyday edit
                                </h2>
                                <p className="mt-2 text-sm text-tertiary">
                                    Six versatile pieces in one easy rotation.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter products by category">
                                {apparelCategories.map((category) => {
                                    const selected = activeCategory === category;
                                    return (
                                        <UuiButton
                                            key={category}
                                            size="sm"
                                            color={selected ? "primary" : "secondary"}
                                            aria-pressed={selected}
                                            onPress={() => setActiveCategory(category)}
                                        >
                                            {category}
                                        </UuiButton>
                                    );
                                })}
                            </div>
                        </div>

                        <div
                            className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-3 xl:grid-cols-4"
                            aria-live="polite"
                        >
                            {visibleProducts.map((product) => (
                                <article key={product.id} className="group min-w-0">
                                    <a
                                        href={`/shop/apparel/${product.id}`}
                                        className="block rounded-xl outline-brand transition duration-200 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                                        aria-label={`View ${product.name} in ${product.color}`}
                                    >
                                        <div className="relative overflow-hidden rounded-xl bg-secondary ring-1 ring-secondary transition duration-200 group-hover:shadow-lg group-hover:ring-primary">
                                            <img
                                                src={product.image}
                                                alt={`${product.name} in ${product.color}`}
                                                width="491"
                                                height="493"
                                                loading="lazy"
                                                className="aspect-[4/5] w-full object-cover transition duration-300 group-hover:scale-[1.025] motion-reduce:transition-none"
                                            />
                                            {product.badge && (
                                                <Badge
                                                    color="gray"
                                                    type="modern"
                                                    className="absolute top-2 left-2 sm:top-3 sm:left-3"
                                                >
                                                    {product.badge}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="mt-3 flex min-w-0 items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <h3 className="truncate text-sm font-semibold text-primary transition-colors group-hover:text-brand-secondary sm:text-md">
                                                    {product.name}
                                                </h3>
                                                <p className="mt-0.5 truncate text-xs text-tertiary sm:text-sm">
                                                    {product.color}
                                                </p>
                                            </div>
                                            <p className="shrink-0 text-sm font-semibold text-primary sm:text-md">
                                                {product.price}
                                            </p>
                                        </div>
                                    </a>
                                </article>
                            ))}
                        </div>

                        <div className="mt-12 flex justify-center border-t border-secondary pt-8">
                            <p className="text-sm text-tertiary">
                                Showing {visibleProducts.length} of {apparelProducts.length} pieces
                            </p>
                        </div>
                    </div>
                </section>

                <section className="border-y border-secondary bg-secondary">
                    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 text-sm sm:grid-cols-3 sm:px-6 lg:px-8">
                        <div>
                            <p className="font-semibold text-primary">Free delivery</p>
                            <p className="mt-1 text-tertiary">On orders over $120.</p>
                        </div>
                        <div>
                            <p className="font-semibold text-primary">Easy returns</p>
                            <p className="mt-1 text-tertiary">30 days, no complicated process.</p>
                        </div>
                        <div>
                            <p className="font-semibold text-primary">Natural materials</p>
                            <p className="mt-1 text-tertiary">Clear composition on every item.</p>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-primary">
                <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-tertiary sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                    <p>© 2026 Fieldwork Goods</p>
                    <a className="font-medium text-secondary hover:text-primary" href="/shop">
                        Visit Fieldwork Living
                    </a>
                </div>
            </footer>
        </div>
    );
}
