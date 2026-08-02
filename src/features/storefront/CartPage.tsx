"use client";

// @uui-source: ADAPT src/catalog/custom/uui-prompt-ecommerce/03-considered-cart.tsx
// @uui-source: REUSE src/components/base/buttons/button.tsx
// @uui-source: REUSE src/components/application/empty-state/empty-state.tsx

import { useEffect, useState } from "react";
import { ArrowRight, Minus, Plus, ShoppingBag03, Trash01 } from "@untitledui-pro/icons/line";
import { Button as UuiButton } from "@/components/base/buttons/button";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { cartTotal, readCart, updateCartItem, type CartLine } from "./cart";
import { formatHuf, storeProducts } from "./catalog";
import { STOREFRONT } from "@/config/storefront";

export function CartPage() {
    const [lines, setLines] = useState<CartLine[]>([]);
    useEffect(() => setLines(readCart()), []);
    const update = (productId: string, quantity: number) => setLines(updateCartItem(productId, quantity));

    return (
        <div className="min-h-screen bg-primary text-primary">
            <header className="border-b border-secondary bg-primary"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"><a href="/" className="inline-flex min-h-11 items-center text-lg font-semibold text-primary">{STOREFRONT.brand.name}</a><UuiButton href="/shop" color="tertiary" size="lg">Termékek</UuiButton></div></header>
            <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
                <p className="text-sm font-semibold text-brand-secondary">Ellenőrzés a pénztár előtt</p>
                <h1 className="mt-2 text-display-md font-semibold text-primary">Kosár</h1>
                {lines.length ? (
                    <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
                        <ul className="divide-y divide-secondary border-y border-secondary" aria-live="polite">
                            {lines.map((line) => {
                                const product = storeProducts.find((entry) => entry.id === line.productId);
                                if (!product) return null;
                                return (
                                    <li key={line.productId} className="flex gap-4 py-5">
                                        <img src={product.image} alt={product.name} width="1200" height="900" className="size-24 shrink-0 rounded-xl object-cover" />
                                        <div className="flex min-w-0 flex-1 flex-col">
                                            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><a href={`/products/${product.id}`} className="inline-flex min-h-11 items-center font-semibold text-primary hover:text-brand-secondary">{product.name}</a><p className="mt-1 text-sm text-tertiary">{formatHuf(product.priceHuf)} / darab</p></div><UuiButton color="tertiary-destructive" size="lg" aria-label={`${product.name} eltávolítása`} iconLeading={Trash01} onPress={() => update(product.id, 0)} /></div>
                                            <div className="mt-auto flex items-end justify-between gap-3 pt-3"><div className="flex items-center gap-2"><UuiButton color="secondary" size="lg" aria-label={`${product.name} mennyiségének csökkentése`} iconLeading={Minus} isDisabled={line.quantity <= 1} onPress={() => update(product.id, line.quantity - 1)} /><span className="min-w-8 text-center text-sm font-semibold text-primary">{line.quantity}</span><UuiButton color="secondary" size="lg" aria-label={`${product.name} mennyiségének növelése`} iconLeading={Plus} isDisabled={line.quantity >= Math.max(1, product.stock)} onPress={() => update(product.id, line.quantity + 1)} /></div><p className="font-semibold text-primary">{formatHuf(product.priceHuf * line.quantity)}</p></div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                        <aside className="h-fit rounded-2xl border border-secondary bg-secondary p-5 sm:p-6"><h2 className="text-lg font-semibold text-primary">Rendelés összesítése</h2><dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-secondary">Részösszeg</dt><dd className="font-medium text-primary">{formatHuf(cartTotal(lines))}</dd></div><div className="flex justify-between gap-4"><dt className="text-secondary">Szállítás</dt><dd className="text-secondary">Véglegesítéskor</dd></div><div className="flex justify-between gap-4 border-t border-secondary pt-4"><dt className="font-semibold text-primary">Várható végösszeg</dt><dd className="text-lg font-semibold text-primary">{formatHuf(cartTotal(lines))}</dd></div></dl><UuiButton href="/checkout" size="lg" className="mt-6 w-full" iconTrailing={ArrowRight}>Tovább a pénztárhoz</UuiButton><p className="mt-3 text-xs text-secondary">A végleges szállítási díj a jóváhagyás előtt látható.</p></aside>
                    </div>
                ) : (
                    <EmptyState className="py-20"><EmptyState.Header pattern="circle"><EmptyState.FeaturedIcon color="gray" icon={ShoppingBag03} /></EmptyState.Header><EmptyState.Content><h2 className="text-md font-semibold text-primary">A kosár üres</h2><EmptyState.Description>Nézd meg a válogatást, és tedd kosárba, ami valóban hasznos.</EmptyState.Description></EmptyState.Content><EmptyState.Footer><UuiButton href="/shop" size="lg" iconTrailing={ArrowRight}>Termékek megtekintése</UuiButton></EmptyState.Footer></EmptyState>
                )}
            </main>
        </div>
    );
}
