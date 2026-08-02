"use client";

// @uui-source: ADAPT src/catalog/custom/twp-ecommerce/01-product-grid.tsx
// @uui-source: REUSE src/components/base/buttons/button.tsx
// @uui-source: REUSE src/components/base/badges/badges.tsx
// @uui-source: REUSE src/components/base/input/input.tsx
// @uui-source: REUSE src/components/base/select/select.tsx

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Menu01, Moon01, SearchLg, ShoppingBag03, Sun, X } from "@untitledui-pro/icons/line";
import { Badge } from "@/components/base/badges/badges";
import { Button as UuiButton } from "@/components/base/buttons/button";
import { Input as UuiInput } from "@/components/base/input/input";
import { Select as UuiSelect } from "@/components/base/select/select";
import { CART_EVENT, readCart } from "./cart";
import { featuredProduct, formatHuf, storeCategories, storeProducts, type StoreCategory } from "./catalog";
import { STOREFRONT } from "@/config/storefront";
import { emitStoreEvent } from "@/integrations/measurement";

type SortId = "featured" | "price-asc" | "price-desc";

export function Storefront({ initialCategory = "Mind" }: { initialCategory?: StoreCategory }) {
    const [activeCategory, setActiveCategory] = useState<StoreCategory>(initialCategory);
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState<SortId>("featured");
    const [dark, setDark] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        setDark(document.documentElement.classList.contains("dark-mode"));
        setCartCount(readCart().reduce((count, line) => count + line.quantity, 0));
        const params = new URLSearchParams(window.location.search);
        setQuery(params.get("q") ?? "");
        const syncCart = () => setCartCount(readCart().reduce((count, line) => count + line.quantity, 0));
        window.addEventListener(CART_EVENT, syncCart);
        return () => window.removeEventListener(CART_EVENT, syncCart);
    }, []);

    useEffect(() => {
        if (!mobileNavOpen) return;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            setMobileNavOpen(false);
            window.requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-controls="store-mobile-navigation"]')?.focus());
        };
        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, [mobileNavOpen]);

    const visibleProducts = useMemo(() => {
        const term = query.trim().toLocaleLowerCase("hu-HU");
        const filtered = storeProducts.filter((product) => {
            const categoryMatches = activeCategory === "Mind" || product.category === activeCategory;
            const searchMatches = !term || [product.name, product.category, product.description, product.sku].join(" ").toLocaleLowerCase("hu-HU").includes(term);
            return categoryMatches && searchMatches;
        });
        if (sort === "price-asc") return [...filtered].sort((a, b) => a.priceHuf - b.priceHuf);
        if (sort === "price-desc") return [...filtered].sort((a, b) => b.priceHuf - a.priceHuf);
        return [...filtered].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
    }, [activeCategory, query, sort]);

    const toggleTheme = () => {
        const nextDark = !dark;
        document.documentElement.classList.toggle("dark-mode", nextDark);
        window.localStorage.setItem("uui-site-theme", nextDark ? "dark" : "light");
        setDark(nextDark);
    };

    const updateSearch = (value: string) => {
        setQuery(value);
        if (value.trim().length >= 2) emitStoreEvent({ name: "search", term: value.trim() });
    };

    const sortItems = [
        { id: "featured", label: "Kiemeltek elöl" },
        { id: "price-asc", label: "Ár: növekvő" },
        { id: "price-desc", label: "Ár: csökkenő" },
    ];

    return (
        <div className="min-h-screen bg-primary text-primary">
            <header className="border-b border-secondary bg-primary">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <a href="/" className="shrink-0 text-lg font-semibold tracking-tight text-primary outline-brand focus-visible:outline-2 focus-visible:outline-offset-2">
                        {STOREFRONT.brand.name}
                    </a>
                    <nav aria-label="Elsődleges navigáció" className="hidden items-center gap-6 md:flex">
                        <a className="text-sm font-semibold text-primary" href="/shop">Termékek</a>
                        <a className="text-sm font-medium text-tertiary hover:text-primary" href="/kategoriak/muszaki">Műszaki</a>
                        <a className="text-sm font-medium text-tertiary hover:text-primary" href="/kategoriak/haztartas">Háztartás</a>
                        <a className="text-sm font-medium text-tertiary hover:text-primary" href="/gyik">Segítség</a>
                    </nav>
                    <div className="flex items-center gap-1">
                        <UuiButton aria-label={dark ? "Világos megjelenés" : "Sötét megjelenés"} color="tertiary" size="sm" iconLeading={dark ? Sun : Moon01} onPress={toggleTheme} />
                        <UuiButton href="/cart" color="tertiary" size="sm" iconLeading={ShoppingBag03} className="hidden sm:inline-flex">
                            Kosár ({cartCount})
                        </UuiButton>
                        <UuiButton
                            aria-label={mobileNavOpen ? "Navigáció bezárása" : "Navigáció megnyitása"}
                            aria-expanded={mobileNavOpen}
                            aria-controls="store-mobile-navigation"
                            color="tertiary"
                            size="sm"
                            iconLeading={mobileNavOpen ? X : Menu01}
                            onPress={() => setMobileNavOpen((open) => !open)}
                            className="md:hidden"
                        />
                    </div>
                </div>
                {mobileNavOpen && (
                    <nav id="store-mobile-navigation" aria-label="Mobil navigáció" className="border-t border-secondary px-4 py-3 md:hidden">
                        <div className="mx-auto flex max-w-7xl flex-col gap-1">
                            <UuiButton href="/shop" color="tertiary" size="md" className="justify-start">Termékek</UuiButton>
                            <UuiButton href="/kategoriak/muszaki" color="tertiary" size="md" className="justify-start">Műszaki</UuiButton>
                            <UuiButton href="/kategoriak/haztartas" color="tertiary" size="md" className="justify-start">Háztartás</UuiButton>
                            <UuiButton href="/gyik" color="tertiary" size="md" className="justify-start">Segítség</UuiButton>
                            <UuiButton href="/cart" color="tertiary" size="md" iconLeading={ShoppingBag03} className="justify-start">Kosár ({cartCount})</UuiButton>
                        </div>
                    </nav>
                )}
            </header>

            <main>
                <section data-uui-critical-hero className="border-b border-secondary bg-secondary">
                    <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-10 sm:px-6 md:grid-cols-[minmax(0,0.8fr)_minmax(20rem,1.2fr)] md:py-14 lg:gap-16 lg:px-8">
                        <div data-uui-hero-actions className="max-w-lg">
                            <Badge color="brand">Induló magyar válogatás</Badge>
                            <h1 className="mt-5 text-balance text-display-md font-semibold tracking-tight text-primary md:text-display-lg">
                                {activeCategory === "Mind" ? "Ami kell. Semmi, ami nem." : `${activeCategory} termékek, érthetően.`}
                            </h1>
                            <p className="mt-5 max-w-md text-pretty text-md text-tertiary md:text-lg">
                                Hasznos műszaki és háztartási termékek, világos forintárakkal és egyszerű vásárlással.
                            </p>
                            <div className="mt-6 flex flex-wrap gap-3">
                                <UuiButton href="#termekek" size="lg" iconTrailing={ArrowRight}>Termékek megtekintése</UuiButton>
                                <UuiButton href={`/products/${featuredProduct.id}`} color="link-gray" size="lg">Kiemelt termék</UuiButton>
                            </div>
                            <dl className="mt-8 grid grid-cols-2 gap-5 border-t border-primary pt-5">
                                <div><dt className="text-xs font-semibold uppercase tracking-wider text-tertiary">Kínálat</dt><dd className="mt-1 text-sm font-semibold text-primary">{visibleProducts.length} induló termék</dd></div>
                                <div><dt className="text-xs font-semibold uppercase tracking-wider text-tertiary">Fizetés</dt><dd className="mt-1 text-sm font-semibold text-primary">Biztonságos átadás</dd></div>
                            </dl>
                        </div>
                        <div data-uui-hero-media className="relative min-h-[25rem] min-w-0 overflow-hidden rounded-2xl bg-primary sm:min-h-[31rem]" aria-label="Kiemelt otthoni válogatás">
                            <img src={featuredProduct.image} alt={featuredProduct.name} width="1200" height="900" loading="eager" className="absolute inset-0 size-full object-cover" />
                            <a href="/products/olvasosarok-fenycsomag" className="absolute top-3 right-3 block w-28 rounded-xl bg-primary p-2 shadow-lg outline-brand transition duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:top-5 sm:right-5 sm:w-40">
                                <img src="/img/placeholders/interior/interior-4.jpg" alt="Olvasósarok fénycsomag" width="1200" height="900" loading="eager" className="aspect-square w-full rounded-lg object-cover" />
                                <span className="mt-2 block truncate text-xs font-semibold text-primary sm:text-sm">Olvasófény · {formatHuf(18990)}</span>
                            </a>
                            <a href={`/products/${featuredProduct.id}`} className="absolute right-3 bottom-3 left-3 flex items-center justify-between gap-4 rounded-xl bg-primary/95 px-4 py-3 shadow-lg outline-brand backdrop-blur-sm focus-visible:outline-2 focus-visible:outline-offset-2 sm:right-auto sm:bottom-5 sm:left-5 sm:min-w-64">
                                <span><span className="block text-xs text-tertiary">Kiemelt termék</span><span className="mt-0.5 block text-sm font-semibold text-primary">{featuredProduct.name}</span></span>
                                <ArrowRight aria-hidden="true" className="size-5 shrink-0 text-brand-secondary" />
                            </a>
                        </div>
                    </div>
                </section>

                <section id="termekek" className="bg-primary">
                    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
                        <div className="flex flex-col gap-5 border-b border-secondary pb-6">
                            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                                <div><p className="text-sm font-semibold text-brand-secondary">{STOREFRONT.brand.name} / 01</p><h2 className="mt-1 text-display-xs font-semibold text-primary md:text-display-sm">Kevesebb keresgélés. Jobb döntés.</h2><p className="mt-2 text-sm text-tertiary">Kereshető, szűrhető induló kínálat.</p></div>
                                <div className="flex flex-wrap gap-2" role="group" aria-label="Termékek szűrése kategória szerint">
                                    {storeCategories.map((category) => <UuiButton key={category} size="sm" color={activeCategory === category ? "primary" : "secondary"} aria-pressed={activeCategory === category} onPress={() => setActiveCategory(category)}>{category}</UuiButton>)}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_13rem]">
                                <UuiInput size="sm" label="Keresés" placeholder="Név, kategória vagy cikkszám" icon={SearchLg} value={query} onChange={updateSearch} />
                                <UuiSelect size="sm" label="Rendezés" aria-label="Rendezés" items={sortItems} value={sort} onChange={(key) => key && setSort(String(key) as SortId)}>{(item) => <UuiSelect.Item id={item.id}>{item.label}</UuiSelect.Item>}</UuiSelect>
                            </div>
                        </div>

                        {visibleProducts.length ? (
                            <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-3 xl:grid-cols-4" aria-live="polite">
                                {visibleProducts.map((product) => (
                                    <article key={product.id} className="group min-w-0">
                                        <a href={`/products/${product.id}`} className="block rounded-xl outline-brand transition duration-200 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 motion-reduce:transition-none motion-reduce:hover:translate-y-0" aria-label={`${product.name} megtekintése`}>
                                            <div className="relative overflow-hidden rounded-xl bg-secondary ring-1 ring-secondary transition duration-200 group-hover:shadow-lg group-hover:ring-primary">
                                                <img src={product.image} alt={product.name} width="1200" height="900" loading="lazy" className="aspect-[4/5] w-full object-cover transition duration-300 group-hover:scale-[1.025] motion-reduce:transition-none" />
                                                {product.badge && <Badge color="gray" type="modern" className="absolute top-2 left-2 sm:top-3 sm:left-3">{product.badge}</Badge>}
                                            </div>
                                            <div className="mt-3 flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:justify-between sm:gap-2">
                                                <div className="min-w-0"><h3 className="text-pretty text-sm font-semibold text-primary transition-colors group-hover:text-brand-secondary sm:text-md">{product.name}</h3><p className="mt-0.5 text-xs text-tertiary sm:text-sm">{product.category}</p></div>
                                                <p className="shrink-0 text-sm font-semibold text-primary sm:text-md">{formatHuf(product.priceHuf)}</p>
                                            </div>
                                        </a>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="py-16 text-center"><h3 className="text-lg font-semibold text-primary">Nincs találat</h3><p className="mt-2 text-sm text-tertiary">Próbálj másik keresést vagy kategóriát.</p><UuiButton className="mt-5" color="secondary" onPress={() => { setQuery(""); setActiveCategory("Mind"); }}>Szűrők törlése</UuiButton></div>
                        )}
                        <div className="mt-12 flex justify-center border-t border-secondary pt-8"><p className="text-sm text-tertiary">{visibleProducts.length} / {storeProducts.length} termék</p></div>
                    </div>
                </section>

                <section className="border-y border-secondary bg-secondary"><div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 text-sm sm:grid-cols-3 sm:px-6 lg:px-8"><div><p className="font-semibold text-primary">Világos szállítás</p><p className="mt-1 text-tertiary">A végleges díj rendelés előtt látható.</p></div><div><p className="font-semibold text-primary">Egyszerű segítség</p><p className="mt-1 text-tertiary">Rendelési azonosítóval gyorsabb ügyintézés.</p></div><div><p className="font-semibold text-primary">Biztonságos fizetés</p><p className="mt-1 text-tertiary">Bankkártyaadatot csak jóváhagyott szolgáltató kezelhet.</p></div></div></section>
            </main>
            <footer className="bg-primary"><div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:px-6 lg:px-8"><div><p className="font-semibold text-primary">{STOREFRONT.brand.name}</p><p className="mt-1 text-tertiary">Üzemeltető: {STOREFRONT.legal.companyName}</p></div><nav aria-label="Lábléc" className="flex flex-wrap gap-x-5 gap-y-2 text-secondary"><a href="/szallitas">Szállítás</a><a href="/visszakuldes">Visszaküldés</a><a href="/garancia">Garancia</a><a href="/kapcsolat">Kapcsolat</a><a href="/adatvedelem">Adatvédelem</a><a href="/aszf">ÁSZF</a><a href="/suti-beallitasok">Sütik</a></nav></div></footer>
        </div>
    );
}
