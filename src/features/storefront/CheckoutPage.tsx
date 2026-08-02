"use client";

// @uui-source: ADAPT src/catalog/custom/uui-prompt-ecommerce/04-delivery-checkout.tsx
// @uui-source: REUSE src/components/base/buttons/button.tsx

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle } from "@untitledui-pro/icons/line";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { Button as UuiButton } from "@/components/base/buttons/button";
import { cartTotal, readCart, type CartLine } from "./cart";
import { formatHuf } from "./catalog";
import { STOREFRONT } from "@/config/storefront";
import { emitStoreEvent } from "@/integrations/measurement";

export function CheckoutPage() {
    const [lines, setLines] = useState<CartLine[]>([]);
    const [error, setError] = useState("");
    useEffect(() => setLines(readCart()), []);
    const beginCheckout = () => {
        emitStoreEvent({ name: "begin_checkout", value: cartTotal(lines), currency: "HUF" });
        setError("Az online fizetés még nem indítható. A kosár megmaradt; kérjük, próbáld később.");
    };
    return (
        <div className="min-h-screen bg-primary text-primary">
            <header className="border-b border-secondary bg-primary"><div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"><a href="/" className="text-lg font-semibold text-primary">{STOREFRONT.brand.name}</a><UuiButton href="/cart" color="tertiary" size="sm">Vissza a kosárhoz</UuiButton></div></header>
            {error && <div role="alert" className="border-b border-error_subtle bg-error-primary px-4 py-3 text-center text-sm text-error-primary">{error}</div>}
            <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16"><div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]"><section><BadgeWithDot color="warning">Előnézeti pénztár</BadgeWithDot><h1 className="mt-5 text-display-md font-semibold text-primary">Biztonságos pénztári átadás</h1><p className="mt-4 max-w-2xl text-lg text-tertiary">Ez az oldal nem kér bankkártyaadatot. A fizetést csak jóváhagyott szolgáltató indíthatja.</p><div className="mt-8 space-y-4">{[["A kosár megmarad", "Sikertelen átadás után sem vesznek el a tételek."], ["Az ár újra ellenőrizhető", "A végleges ár, készlet és szállítás jóváhagyás előtt látható."], ["A fizetés külön felületen történik", "A bolt nem kezel közvetlenül bankkártyaadatot."]].map(([title, copy]) => <div key={title} className="flex gap-3 rounded-xl border border-secondary p-4"><CheckCircle className="mt-0.5 size-5 shrink-0 text-fg-success-primary" aria-hidden="true" /><div><h2 className="text-sm font-semibold text-primary">{title}</h2><p className="mt-1 text-sm text-tertiary">{copy}</p></div></div>)}</div></section><aside className="h-fit rounded-2xl border border-secondary bg-secondary p-5 sm:p-6"><h2 className="text-lg font-semibold text-primary">Összesen</h2><p className="mt-4 text-display-xs font-semibold text-primary">{formatHuf(cartTotal(lines))}</p><UuiButton size="lg" className="mt-6 w-full" iconTrailing={ArrowRight} isDisabled={lines.length === 0} onPress={beginCheckout}>Tovább a biztonságos fizetéshez</UuiButton>{lines.length === 0 && <p className="mt-3 text-center text-sm text-tertiary">Előbb tegyél terméket a kosárba.</p>}</aside></div></main>
        </div>
    );
}
