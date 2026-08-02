// Internal seed catalog only. Replace it through the Webshippy adapter before launch.
import { STOREFRONT } from "@/config/storefront";
export type StoreCategory = "Mind" | "Műszaki" | "Háztartás";

export interface StoreProduct {
    id: string;
    sku: string;
    name: string;
    category: Exclude<StoreCategory, "Mind">;
    priceHuf: number;
    image: string;
    description: string;
    stock: number;
    specifications: readonly { label: string; value: string }[];
    badge?: string;
    featured?: boolean;
    trending?: boolean;
    source: "demo-webshippy";
}

export const storeCategories: StoreCategory[] = ["Mind", "Műszaki", "Háztartás"];

export const storeProducts: StoreProduct[] = [
    {
        id: "otthoni-zene-csomag",
        sku: "DEMO-TECH-001",
        name: "Otthoni zene alapcsomag",
        category: "Műszaki",
        priceHuf: 89990,
        image: "/img/uui/application/listing-01.webp",
        description: "Átgondolt kiindulópont tiszta hanghoz és rendezett nappali használathoz.",
        stock: 8,
        specifications: [
            { label: "Csomag", value: "Otthoni audio alap" },
            { label: "Ajánlott tér", value: "Nappali vagy dolgozó" },
            { label: "Garancia", value: "A végleges termékadat szerint" },
        ],
        badge: "Kiemelt",
        featured: true,
        trending: true,
        source: "demo-webshippy",
    },
    {
        id: "kompakt-sztereo-csomag",
        sku: "DEMO-TECH-002",
        name: "Kompakt sztereó csomag",
        category: "Műszaki",
        priceHuf: 119990,
        image: "/img/uui/application/listing-02.webp",
        description: "Helytakarékos zenehallgató összeállítás kisebb otthonokhoz.",
        stock: 3,
        specifications: [
            { label: "Csomag", value: "Kompakt sztereó alap" },
            { label: "Elhelyezés", value: "Polc vagy alacsony szekrény" },
            { label: "Készlet", value: "Beszállítói frissítés szerint" },
        ],
        badge: "Limitált",
        source: "demo-webshippy",
    },
    {
        id: "olvasosarok-fenycsomag",
        sku: "DEMO-TECH-003",
        name: "Olvasósarok fénycsomag",
        category: "Műszaki",
        priceHuf: 18990,
        image: "/img/placeholders/interior/interior-4.jpg",
        description: "Meleg fényű, egyszerűen elhelyezhető összeállítás esti olvasáshoz.",
        stock: 7,
        specifications: [
            { label: "Használat", value: "Beltéri olvasófény" },
            { label: "Fény", value: "Meleg fehér" },
            { label: "Elhelyezés", value: "Olvasósarok" },
        ],
        source: "demo-webshippy",
    },
    {
        id: "haloszoba-rendezo-csomag",
        sku: "DEMO-HOME-001",
        name: "Hálószoba rendezőcsomag",
        category: "Háztartás",
        priceHuf: 24990,
        image: "/img/uui/application/listing-03.webp",
        description: "Egyszerű tárolási és rendszerezési alapok nyugodtabb reggelekhez.",
        stock: 5,
        specifications: [
            { label: "Csomag", value: "Hálószobai rendszerezés" },
            { label: "Használat", value: "Mindennapi tárolás" },
            { label: "Tisztítás", value: "Nedves ruhával" },
        ],
        source: "demo-webshippy",
    },
    {
        id: "nappali-rendezo-csomag",
        sku: "DEMO-HOME-002",
        name: "Nappali rendezőcsomag",
        category: "Háztartás",
        priceHuf: 32990,
        image: "/img/uui/application/listing-04.webp",
        description: "Praktikus elemek a mindennapi tárgyak és a közös tér átlátható rendjéhez.",
        stock: 6,
        specifications: [
            { label: "Csomag", value: "Nappali rendszerezés" },
            { label: "Használat", value: "Könyvek és kis tárgyak" },
            { label: "Karbantartás", value: "Egyszerű törlés" },
        ],
        featured: true,
        source: "demo-webshippy",
    },
    {
        id: "etkezo-rendszerezo-csomag",
        sku: "DEMO-HOME-003",
        name: "Étkező rendszerezőcsomag",
        category: "Háztartás",
        priceHuf: 21990,
        image: "/img/placeholders/interior/interior-2.jpg",
        description: "Helytakarékos tárolási alapok közös étkezésekhez és hétköznapi használathoz.",
        stock: 0,
        specifications: [
            { label: "Csomag", value: "Étkező rendszerezés" },
            { label: "Használat", value: "Asztali és tárolási kellékek" },
            { label: "Állapot", value: "Átmenetileg elfogyott" },
        ],
        badge: "Elfogyott",
        source: "demo-webshippy",
    },
];

export const featuredProduct = storeProducts.find((product) => product.id === STOREFRONT.promotion.featuredProductId)
    ?? storeProducts.find((product) => product.trending)
    ?? storeProducts.find((product) => product.featured)
    ?? storeProducts[0];

export function formatHuf(value: number) {
    return new Intl.NumberFormat("hu-HU", {
        style: "currency",
        currency: "HUF",
        maximumFractionDigits: 0,
    }).format(value);
}
