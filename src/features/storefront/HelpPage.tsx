"use client";

// @uui-source: ADAPT src/catalog/custom/legal-hu/legal-pages.tsx
// @uui-source: REUSE src/components/base/checkbox/checkbox.tsx

import { useEffect, useState } from "react";
import { ArrowRight } from "@untitledui-pro/icons/line";
import { Badge } from "@/components/base/badges/badges";
import { Button as UuiButton } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { HELP_PAGES, STOREFRONT, type HelpPageKey } from "@/config/storefront";
import { readConsent, saveConsent } from "@/integrations/measurement";

export function HelpPage({ pageKey }: { pageKey: HelpPageKey }) {
    const page = HELP_PAGES[pageKey];
    const [analytics, setAnalytics] = useState(false);
    const [marketing, setMarketing] = useState(false);
    const [saved, setSaved] = useState(false);
    useEffect(() => { const consent = readConsent(); setAnalytics(consent.analytics); setMarketing(consent.marketing); }, []);
    return (
        <div className="min-h-screen bg-primary text-primary">
            <header className="border-b border-secondary bg-primary"><div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"><a href="/" className="text-lg font-semibold text-primary">{STOREFRONT.brand.name}</a><UuiButton href="/shop" color="tertiary" size="sm">Termékek</UuiButton></div></header>
            <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20"><Badge color="brand">{page.eyebrow}</Badge><h1 className="mt-5 max-w-3xl text-balance text-display-md font-semibold tracking-tight text-primary">{page.title}</h1><p className="mt-5 max-w-3xl text-pretty text-lg leading-8 text-secondary">{page.intro}</p><div className="mt-10 grid gap-4 sm:grid-cols-2">{page.sections.map((section, index) => <section key={section.title} className={`min-w-0 rounded-2xl bg-secondary p-5 ring-1 ring-secondary sm:p-6 ${index === 0 ? "sm:col-span-2" : ""}`}><h2 className="text-lg font-semibold text-primary">{section.title}</h2><p className="mt-2 text-md leading-7 text-secondary">{section.copy}</p></section>)}</div>
                {pageKey === "cookies" && <section className="mt-8 rounded-2xl bg-primary p-5 shadow-sm ring-1 ring-secondary sm:p-6"><h2 className="text-lg font-semibold text-primary">Választásod</h2><div className="mt-5 grid gap-4"><Checkbox label="Szükséges sütik" hint="Mindig bekapcsolva" isSelected isDisabled /><Checkbox label="Elemzési sütik" hint="A bolt javításához" isSelected={analytics} onChange={setAnalytics} /><Checkbox label="Hirdetési mérés" hint="Meta, Google és TikTok" isSelected={marketing} onChange={setMarketing} /></div><UuiButton className="mt-6" onPress={() => { saveConsent({ analytics, marketing }); setSaved(true); }}>Beállítások mentése</UuiButton><p className="mt-3 text-sm text-secondary" role="status" aria-live="polite">{saved ? "A beállításokat elmentettük." : "A mérés engedély nélkül kikapcsolva marad."}</p></section>}
                {pageKey === "contact" && STOREFRONT.contact.email && <UuiButton href={`mailto:${STOREFRONT.contact.email}`} className="mt-8" iconTrailing={ArrowRight}>E-mail írása</UuiButton>}
            </main>
        </div>
    );
}
