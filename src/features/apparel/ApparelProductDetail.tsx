"use client";

import { useEffect, useState } from "react";
import {
    CheckCircle,
    Moon01,
    ShoppingBag03,
    Sun,
} from "@untitledui-pro/icons/line";
import { Badge } from "@/components/base/badges/badges";
import { Button as UuiButton } from "@/components/base/buttons/button";
import type { ApparelProduct } from "./catalog";

const sizes = ["XS", "S", "M", "L", "XL"] as const;

export function ApparelProductDetail({ product }: { product: ApparelProduct }) {
    const [dark, setDark] = useState(false);
    const [selectedSize, setSelectedSize] = useState<(typeof sizes)[number]>("M");
    const [added, setAdded] = useState(false);

    useEffect(() => {
        setDark(document.documentElement.classList.contains("dark-mode"));
    }, []);

    const toggleTheme = () => {
        const nextDark = !dark;
        document.documentElement.classList.toggle("dark-mode", nextDark);
        window.localStorage.setItem("uui-site-theme", nextDark ? "dark" : "light");
        setDark(nextDark);
    };

    const addToPreviewBag = () => {
        setAdded(true);
        window.setTimeout(() => setAdded(false), 2200);
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
                <section className="bg-secondary">
                    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 md:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)] md:items-start md:gap-12 md:py-14 lg:px-8">
                        <div className="overflow-hidden rounded-2xl bg-primary ring-1 ring-secondary">
                            <img
                                src={product.image}
                                alt={`${product.name} in ${product.color}`}
                                width="491"
                                height="493"
                                loading="eager"
                                className="aspect-square w-full object-cover"
                            />
                        </div>

                        <div className="md:sticky md:top-8">
                            <UuiButton href="/shop/apparel#collection" color="link-gray" size="sm">
                                Back to collection
                            </UuiButton>
                            <div className="mt-6 flex flex-wrap items-center gap-3">
                                <p className="text-sm font-semibold text-brand-secondary">{product.category}</p>
                                {product.badge && <Badge color="brand">{product.badge}</Badge>}
                            </div>
                            <h1 className="mt-3 text-display-sm font-semibold tracking-tight text-primary md:text-display-md">
                                {product.name}
                            </h1>
                            <p className="mt-2 text-lg text-tertiary">{product.color}</p>
                            <p className="mt-5 text-display-xs font-semibold text-primary">{product.price}</p>
                            <p className="mt-5 max-w-lg text-md leading-relaxed text-secondary">
                                {product.description}
                            </p>

                            <div className="mt-8">
                                <h2 className="text-sm font-semibold text-primary">Select size</h2>
                                <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Select size">
                                    {sizes.map((size) => (
                                        <UuiButton
                                            key={size}
                                            size="sm"
                                            color={selectedSize === size ? "primary" : "secondary"}
                                            aria-pressed={selectedSize === size}
                                            onPress={() => setSelectedSize(size)}
                                        >
                                            {size}
                                        </UuiButton>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6">
                                <UuiButton
                                    size="xl"
                                    className="w-full"
                                    iconLeading={added ? CheckCircle : ShoppingBag03}
                                    onPress={addToPreviewBag}
                                >
                                    {added ? `Added in size ${selectedSize}` : "Add to preview bag"}
                                </UuiButton>
                                <p className="mt-2 text-center text-xs text-tertiary" aria-live="polite">
                                    {added ? `${product.name} added for this catalog preview.` : "Preview catalog — no payment will be taken."}
                                </p>
                            </div>

                            <dl className="mt-8 divide-y divide-secondary border-y border-secondary">
                                <div className="grid grid-cols-[7rem_1fr] gap-4 py-4 text-sm">
                                    <dt className="font-medium text-tertiary">Material</dt>
                                    <dd className="font-medium text-primary">{product.material}</dd>
                                </div>
                                <div className="grid grid-cols-[7rem_1fr] gap-4 py-4 text-sm">
                                    <dt className="font-medium text-tertiary">Fit</dt>
                                    <dd className="font-medium text-primary">{product.fit}</dd>
                                </div>
                                <div className="grid grid-cols-[7rem_1fr] gap-4 py-4 text-sm">
                                    <dt className="font-medium text-tertiary">Care</dt>
                                    <dd className="font-medium text-primary">{product.care}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </section>

                <section className="border-y border-secondary bg-primary">
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
                            <p className="font-semibold text-primary">Clear materials</p>
                            <p className="mt-1 text-tertiary">Composition listed on every piece.</p>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-primary">
                <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-tertiary sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                    <p>© 2026 Fieldwork Goods</p>
                    <a className="font-medium text-secondary hover:text-primary" href="/shop/apparel">
                        Shop all apparel
                    </a>
                </div>
            </footer>
        </div>
    );
}

