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

type Category = "All" | "Tops" | "Bottoms" | "Footwear";

interface ApparelProduct {
    id: string;
    name: string;
    category: Exclude<Category, "All">;
    color: string;
    price: string;
    image: string;
    badge?: string;
}

const categories: Category[] = ["All", "Tops", "Bottoms", "Footwear"];

const products: ApparelProduct[] = [
    {
        id: "heavyweight-tee",
        name: "Heavyweight tee",
        category: "Tops",
        color: "Natural",
        price: "$48",
        image: "/img/apparel/tee.jpg",
        badge: "New",
    },
    {
        id: "work-overshirt",
        name: "Work overshirt",
        category: "Tops",
        color: "Washed charcoal",
        price: "$118",
        image: "/img/apparel/overshirt.jpg",
    },
    {
        id: "textured-knit",
        name: "Textured knit",
        category: "Tops",
        color: "Rust",
        price: "$96",
        image: "/img/apparel/knit.jpg",
        badge: "Limited",
    },
    {
        id: "relaxed-trouser",
        name: "Relaxed trouser",
        category: "Bottoms",
        color: "Midnight",
        price: "$88",
        image: "/img/apparel/trousers.jpg",
    },
    {
        id: "canvas-low",
        name: "Canvas low",
        category: "Footwear",
        color: "Warm white",
        price: "$72",
        image: "/img/apparel/sneakers.jpg",
    },
    {
        id: "utility-jacket",
        name: "Utility jacket",
        category: "Tops",
        color: "Olive",
        price: "$148",
        image: "/img/apparel/jacket.jpg",
        badge: "Bestseller",
    },
];

export function ApparelStorefront() {
    const [activeCategory, setActiveCategory] = useState<Category>("All");
    const [dark, setDark] = useState(false);

    useEffect(() => {
        setDark(document.documentElement.classList.contains("dark-mode"));
    }, []);

    const visibleProducts = useMemo(
        () =>
            activeCategory === "All"
                ? products
                : products.filter((product) => product.category === activeCategory),
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
                    <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 py-10 sm:px-6 md:grid-cols-[minmax(0,0.9fr)_minmax(18rem,1.1fr)] md:py-14 lg:px-8">
                        <div className="max-w-xl">
                            <Badge color="brand">
                                New season
                            </Badge>
                            <h1 className="mt-4 text-display-sm font-semibold tracking-tight text-primary md:text-display-md">
                                Everyday layers, quietly considered.
                            </h1>
                            <p className="mt-4 max-w-lg text-md text-tertiary md:text-lg">
                                A compact edit of durable staples in natural textures and easy colors.
                            </p>
                            <div data-uui-hero-actions className="mt-6 flex flex-wrap gap-3">
                                <UuiButton href="#new-arrivals" size="lg" iconTrailing={ArrowRight}>
                                    Shop new arrivals
                                </UuiButton>
                                <UuiButton href="#collection" color="secondary" size="lg">
                                    View collection
                                </UuiButton>
                            </div>
                        </div>

                        <div
                            data-uui-hero-media
                            className="grid min-w-0 grid-cols-2 gap-3"
                            aria-label="Featured apparel"
                        >
                            <img
                                src="/img/apparel/tee.jpg"
                                alt="Natural heavyweight T-shirt"
                                width="491"
                                height="493"
                                loading="eager"
                                className="aspect-[4/5] w-full rounded-xl object-cover"
                            />
                            <img
                                src="/img/apparel/jacket.jpg"
                                alt="Olive utility jacket"
                                width="491"
                                height="493"
                                loading="eager"
                                className="aspect-[4/5] w-full rounded-xl object-cover"
                            />
                        </div>
                    </div>
                </section>

                <section id="collection" className="bg-primary">
                    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
                        <div className="flex flex-col gap-5 border-b border-secondary pb-6 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-brand-secondary">Spring / Summer</p>
                                <h2 id="new-arrivals" className="mt-1 text-display-xs font-semibold text-primary md:text-display-sm">
                                    New arrivals
                                </h2>
                                <p className="mt-2 text-sm text-tertiary">
                                    Six versatile pieces. Placeholder catalog for layout review.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter products by category">
                                {categories.map((category) => {
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
                                    <div className="relative overflow-hidden rounded-xl bg-secondary">
                                        <img
                                            src={product.image}
                                            alt={`${product.name} in ${product.color}`}
                                            width="491"
                                            height="493"
                                            loading="lazy"
                                            className="aspect-[4/5] w-full object-cover transition duration-200 group-hover:scale-[1.015]"
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
                                            <h3 className="truncate text-sm font-semibold text-primary sm:text-md">
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
                                </article>
                            ))}
                        </div>

                        <div className="mt-12 flex justify-center">
                            <UuiButton href="/shop/apparel#collection" color="secondary" size="lg">
                                View all clothing
                            </UuiButton>
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
