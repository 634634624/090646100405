"use client";

// @uui-source: ADAPT src/features/apparel/ApparelProductDetail.tsx
// @uui-source: REUSE src/components/base/buttons/button.tsx

import { useEffect, useState } from "react";
import { CheckCircle, Menu01, Minus, Moon01, Plus, ShoppingBag03, Sun, X } from "@untitledui-pro/icons/line";
import { Badge } from "@/components/base/badges/badges";
import { Button as UuiButton } from "@/components/base/buttons/button";
import type { StoreProduct } from "./catalog";
import { formatHuf } from "./catalog";
import { addCartItem, readCart } from "./cart";
import { STOREFRONT } from "@/config/storefront";
import { emitStoreEvent } from "@/integrations/measurement";

export function ProductDetail({ product }: { product: StoreProduct }) {
    const [dark, setDark] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        setDark(document.documentElement.classList.contains("dark-mode"));
        setCartCount(readCart().reduce((count, line) => count + line.quantity, 0));
        emitStoreEvent({ name: "view_item", itemId: product.id, value: product.priceHuf, currency: "HUF" });
    }, [product.id, product.priceHuf]);

    useEffect(() => {
        if (!mobileNavOpen) return;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            setMobileNavOpen(false);
            window.requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-controls="product-mobile-navigation"]')?.focus());
        };
        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, [mobileNavOpen]);

    const toggleTheme = () => {
        const nextDark = !dark;
        document.documentElement.classList.toggle("dark-mode", nextDark);
        window.localStorage.setItem("uui-site-theme", nextDark ? "dark" : "light");
        setDark(nextDark);
    };

    const addToCart = () => {
        const lines = addCartItem(product.id, quantity);
        setCartCount(lines.reduce((count, line) => count + line.quantity, 0));
        setAdded(true);
        emitStoreEvent({ name: "add_to_cart", itemId: product.id, value: product.priceHuf * quantity, currency: "HUF" });
        window.setTimeout(() => setAdded(false), 2200);
    };

    return (
        <div className="min-h-screen bg-primary text-primary">
            <header className="border-b border-secondary bg-primary">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <a href="/" className="shrink-0 text-lg font-semibold tracking-tight text-primary outline-brand focus-visible:outline-2 focus-visible:outline-offset-2">{STOREFRONT.brand.name}</a>
                    <div className="flex items-center gap-1">
                        <UuiButton aria-label={dark ? "Világos megjelenés" : "Sötét megjelenés"} color="tertiary" size="sm" iconLeading={dark ? Sun : Moon01} onPress={toggleTheme} />
                        <UuiButton href="/cart" color="tertiary" size="sm" iconLeading={ShoppingBag03} className="hidden sm:inline-flex">Kosár ({cartCount})</UuiButton>
                        <UuiButton aria-label={mobileNavOpen ? "Navigáció bezárása" : "Navigáció megnyitása"} aria-expanded={mobileNavOpen} aria-controls="product-mobile-navigation" color="tertiary" size="sm" iconLeading={mobileNavOpen ? X : Menu01} onPress={() => setMobileNavOpen((open) => !open)} className="md:hidden" />
                    </div>
                </div>
                {mobileNavOpen && <nav id="product-mobile-navigation" aria-label="Mobil navigáció" className="border-t border-secondary px-4 py-3 md:hidden"><div className="mx-auto flex max-w-7xl flex-col gap-1"><UuiButton href="/shop" color="tertiary" size="md" className="justify-start">Termékek</UuiButton><UuiButton href="/kategoriak/muszaki" color="tertiary" size="md" className="justify-start">Műszaki</UuiButton><UuiButton href="/kategoriak/haztartas" color="tertiary" size="md" className="justify-start">Háztartás</UuiButton><UuiButton href="/cart" color="tertiary" size="md" iconLeading={ShoppingBag03} className="justify-start">Kosár ({cartCount})</UuiButton></div></nav>}
            </header>

            <main>
                <section className="bg-secondary">
                    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 md:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)] md:items-start md:gap-12 md:py-14 lg:px-8">
                        <div className="overflow-hidden rounded-2xl bg-primary ring-1 ring-secondary"><img src={product.image} alt={product.name} width="1200" height="900" loading="eager" className="aspect-square w-full object-cover" /></div>
                        <div className="md:sticky md:top-8">
                            <UuiButton href="/shop#termekek" color="link-gray" size="sm">Vissza a termékekhez</UuiButton>
                            <div className="mt-6 flex flex-wrap items-center gap-3"><p className="text-sm font-semibold text-brand-secondary">{product.category}</p>{product.badge && <Badge color="brand">{product.badge}</Badge>}</div>
                            <h1 className="mt-3 text-balance text-display-sm font-semibold tracking-tight text-primary md:text-display-md">{product.name}</h1>
                            <p className="mt-5 text-display-xs font-semibold text-primary">{formatHuf(product.priceHuf)}</p>
                            <p className="mt-5 max-w-lg text-md leading-relaxed text-secondary">{product.description}</p>

                            <div className="mt-8">
                                <h2 className="text-sm font-semibold text-primary">Mennyiség</h2>
                                <div className="mt-3 flex items-center gap-2" role="group" aria-label="Mennyiség">
                                    <UuiButton aria-label="Mennyiség csökkentése" size="sm" color="secondary" iconLeading={Minus} isDisabled={quantity <= 1} onPress={() => setQuantity((value) => Math.max(1, value - 1))} />
                                    <span className="min-w-10 text-center text-md font-semibold text-primary" aria-live="polite">{quantity}</span>
                                    <UuiButton aria-label="Mennyiség növelése" size="sm" color="secondary" iconLeading={Plus} isDisabled={quantity >= Math.max(1, product.stock)} onPress={() => setQuantity((value) => Math.min(Math.max(1, product.stock), value + 1))} />
                                </div>
                            </div>

                            <div className="mt-6">
                                <UuiButton size="xl" className="w-full" iconLeading={added ? CheckCircle : ShoppingBag03} onPress={addToCart} isDisabled={product.stock === 0}>
                                    {product.stock === 0 ? "Átmenetileg elfogyott" : added ? `${quantity} darab a kosárban` : "Kosárba teszem"}
                                </UuiButton>
                                <p className="mt-2 text-center text-xs text-tertiary" aria-live="polite">{added ? `${product.name} a kosárba került.` : "Az online fizetés csak jóváhagyott szolgáltatóval indulhat."}</p>
                            </div>

                            <dl className="mt-8 divide-y divide-secondary border-y border-secondary">
                                {product.specifications.map((specification) => <div key={specification.label} className="grid grid-cols-[7rem_1fr] gap-4 py-4 text-sm"><dt className="font-medium text-tertiary">{specification.label}</dt><dd className="font-medium text-primary">{specification.value}</dd></div>)}
                                <div className="grid grid-cols-[7rem_1fr] gap-4 py-4 text-sm"><dt className="font-medium text-tertiary">Cikkszám</dt><dd className="font-medium text-primary">{product.sku}</dd></div>
                            </dl>
                        </div>
                    </div>
                </section>
                <section className="border-y border-secondary bg-primary"><div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 text-sm sm:grid-cols-3 sm:px-6 lg:px-8"><div><p className="font-semibold text-primary">Szállítás</p><p className="mt-1 text-tertiary">Végleges díj rendelés előtt.</p></div><div><p className="font-semibold text-primary">Visszaküldés</p><p className="mt-1 text-tertiary">A helyes címet ügyfélszolgálatunk adja meg.</p></div><div><p className="font-semibold text-primary">Garancia</p><p className="mt-1 text-tertiary">A végleges beszállítói adat szerint.</p></div></div></section>
            </main>
            <footer className="bg-primary"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-tertiary sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><p>© 2026 {STOREFRONT.legal.companyName}</p><a className="font-medium text-secondary hover:text-primary" href="/shop">Minden termék</a></div></footer>
        </div>
    );
}
