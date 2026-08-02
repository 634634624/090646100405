export const STOREFRONT = {
    brand: {
        name: "Válogatott",
        mark: "V",
        tagline: "Hasznos dolgok. Jó döntésekhez.",
        description: "Válogatott műszaki és háztartási termékek magyar vásárlóknak.",
        themeId: "valogatott",
    },
    legal: {
        companyName: "BestCarTrade Kft.",
        market: "Magyarország",
        address: import.meta.env.PUBLIC_LEGAL_ADDRESS?.trim() ?? "",
        registrationNumber: import.meta.env.PUBLIC_COMPANY_REGISTRATION_NUMBER?.trim() ?? "",
        taxNumber: import.meta.env.PUBLIC_TAX_NUMBER?.trim() ?? "",
    },
    contact: {
        email: import.meta.env.PUBLIC_CONTACT_EMAIL?.trim() ?? "",
        phone: import.meta.env.PUBLIC_CONTACT_PHONE?.trim() ?? "",
        hours: import.meta.env.PUBLIC_CONTACT_HOURS?.trim() ?? "",
    },
    commerce: {
        locale: "hu-HU",
        currency: "HUF",
        catalogSource: "demo" as const,
        checkoutProvider: "unconfigured" as const,
    },
    promotion: {
        featuredProductId: "otthoni-zene-csomag",
    },
} as const;

export type HelpPageKey = "delivery" | "returns" | "warranty" | "contact" | "faq" | "privacy" | "terms" | "cookies";

export const HELP_PAGES: Record<HelpPageKey, {
    eyebrow: string;
    title: string;
    intro: string;
    sections: readonly { title: string; copy: string }[];
}> = {
    delivery: {
        eyebrow: "Rendelési segítség",
        title: "Szállítás",
        intro: "A végleges díjat és várható időt a rendelés jóváhagyása előtt mutatjuk meg.",
        sections: [
            { title: "Magyarországi kézbesítés", copy: "Az induláskor magyarországi címekre készülünk. A választható módokat a jóváhagyott teljesítési szerződés adja." },
            { title: "Nyomon követés", copy: "Ha a szolgáltató ad követési azonosítót, azt a rendelési értesítőben küldjük el." },
            { title: "Átvétel", copy: "Látható sérülés esetén kérj jegyzőkönyvet a futártól, majd írj nekünk a rendelési azonosítóval." },
        ],
    },
    returns: {
        eyebrow: "Rendelési segítség",
        title: "Elállás és visszaküldés",
        intro: "A visszaküldés pontos módját a termék és a teljesítési szolgáltató alapján adjuk meg.",
        sections: [
            { title: "Elállási szándék", copy: "Írásban jelezd az elállási szándékot. Válaszunkban megadjuk a helyes visszaküldési címet." },
            { title: "Termék állapota", copy: "A terméket minden tartozékával és lehetőség szerint az eredeti csomagolásban küldd vissza." },
            { title: "Visszatérítés", copy: "A jóváhagyott visszatérítést az eredeti fizetési mód szerint indítjuk." },
        ],
    },
    warranty: {
        eyebrow: "Biztonságos vásárlás",
        title: "Jótállás és kellékszavatosság",
        intro: "Az adott termékre érvényes feltételeket a termékoldalon és a rendelési iratokban kell megadni.",
        sections: [
            { title: "Hibabejelentés", copy: "Írd meg a rendelési azonosítót, a hiba rövid leírását, és ha lehet, csatolj képet." },
            { title: "Vizsgálat", copy: "A kereskedő vagy a szerződés szerint kijelölt partner megvizsgálja a bejelentést." },
            { title: "Iratok", copy: "Őrizd meg a számlát, a jótállási jegyet és a rendelési értesítőket." },
        ],
    },
    contact: {
        eyebrow: "Segítünk",
        title: "Kapcsolat",
        intro: "Rendeléshez mindig add meg a rendelési azonosítót.",
        sections: [
            { title: "E-mail", copy: STOREFRONT.contact.email || "A hivatalos cím véglegesítés alatt." },
            { title: "Telefon", copy: STOREFRONT.contact.phone || "A hivatalos szám véglegesítés alatt." },
            { title: "Ügyfélfogadás", copy: STOREFRONT.contact.hours || "A nyitvatartás véglegesítés alatt." },
        ],
    },
    faq: {
        eyebrow: "Gyors válaszok",
        title: "Gyakori kérdések",
        intro: "A legfontosabb tudnivalók rendelés előtt és után.",
        sections: [
            { title: "Mikor kapom meg a rendelést?", copy: "A várható időt a végleges rendelés előtt és a visszaigazolásban mutatjuk meg." },
            { title: "Módosíthatom a rendelést?", copy: "Írj nekünk azonnal. A módosítás csak a feldolgozás megkezdése előtt lehetséges." },
            { title: "Hol követhetem a csomagot?", copy: "Ha van követési hivatkozás, e-mailben küldjük el." },
            { title: "Hogyan jelzek hibát?", copy: "Küldd el a rendelési azonosítót, a hiba leírását és lehetőség szerint egy képet." },
        ],
    },
    privacy: {
        eyebrow: "Jogi tájékoztató",
        title: "Adatvédelmi tájékoztató",
        intro: "A BestCarTrade Kft. csak a rendeléshez, kapcsolattartáshoz, jogi kötelezettséghez és engedélyezett méréshez szükséges adatokat kezelheti.",
        sections: [
            { title: "Kezelt adatok", copy: "Kapcsolati, számlázási, szállítási és rendelési adatok, valamint ügyfélszolgálati üzenetek." },
            { title: "Adatátadás", copy: "A teljesítéshez szükséges adatokat a fizetési, számlázási, szállítási és kiszolgáló partnerek kaphatják meg." },
            { title: "Mérés", copy: "Elemzési vagy hirdetési mérés csak külön engedély után indulhat." },
            { title: "Jogok", copy: "Kérhető tájékoztatás, javítás, törlés, korlátozás vagy tiltakozás a vonatkozó szabályok szerint." },
        ],
    },
    terms: {
        eyebrow: "Jogi tájékoztató",
        title: "Általános szerződési feltételek",
        intro: "Ez a helyi előnézet szerkezeti minta. A hatályos szöveget a végleges cég-, szállítási, fizetési és partneradatokkal kell jóváhagyni.",
        sections: [
            { title: "Szolgáltató", copy: "BestCarTrade Kft. A székhely, cégjegyzékszám, adószám és hivatalos elérhetőség tulajdonosi jóváhagyásra vár." },
            { title: "Szerződés", copy: "A kosár elküldése ajánlat. A rendelés elfogadását külön visszaigazolás jelzi." },
            { title: "Árak és fizetés", copy: "A teljes összeg és a választható fizetési mód jóváhagyás előtt látható." },
            { title: "Teljesítés", copy: "A szállítási, elállási, jótállási és panaszkezelési feltételeket a kapcsolódó tájékoztatók részletezik." },
        ],
    },
    cookies: {
        eyebrow: "Adatvédelmi beállítások",
        title: "Süti beállítások",
        intro: "A szükséges sütik a kosárhoz és a biztonságos működéshez kellenek. A mérés külön engedély nélkül kikapcsolva marad.",
        sections: [
            { title: "Szükséges", copy: "Kosár, megjelenési mód és biztonsági alapműködés." },
            { title: "Elemzés", copy: "Használati adatok a bolt javításához. Csak engedéllyel indul." },
            { title: "Hirdetési mérés", copy: "Meta, Google és TikTok mérési jelek. Csak engedéllyel és beállított azonosítókkal indul." },
        ],
    },
};
