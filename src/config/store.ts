export const STORE = {
    brand: {
        name: "DevShopify",
        shortMark: "D",
        tagline: "Hasznos dolgok. Jó döntésekhez.",
        description:
            "Átlátható magyar webáruház gondosan válogatott műszaki és háztartási termékekkel.",
    },
    legal: {
        companyName: "BestCarTrade Kft.",
        launchMarket: "Magyarország",
    },
    contact: {
        email: "kapcsolat@devshopify.example",
        phone: "+36 1 000 0000",
        serviceHours: "Hétfő–péntek, 9:00–17:00",
    },
    commerce: {
        currency: "HUF",
        locale: "hu-HU",
        catalogSource: "demo" as const,
        checkoutProvider: "unconfigured" as const,
    },
    promotion: {
        featuredHandle: "otthoni-zene-csomag",
    },
} as const;

export type InfoPageKey =
    | "delivery"
    | "returns"
    | "warranty"
    | "contact"
    | "faq"
    | "privacy"
    | "terms"
    | "cookies";

export const INFO_PAGES: Record<InfoPageKey, {
    eyebrow: string;
    title: string;
    intro: string;
    sections: readonly { title: string; copy: string }[];
}> = {
    delivery: {
        eyebrow: "Rendelési segítség",
        title: "Szállítás",
        intro: "A végleges díjat és várható időt a megrendelés jóváhagyása előtt mutatjuk meg.",
        sections: [
            { title: "Magyarországi kézbesítés", copy: "Az induláskor magyarországi címekre készülünk. A választható módokat a szolgáltatói szerződés alapján véglegesítjük." },
            { title: "Nyomon követés", copy: "Ha a szolgáltató ad követési azonosítót, azt a rendelési értesítőben küldjük el." },
            { title: "Átvétel", copy: "Átvételkor ellenőrizd a csomagot. Látható sérülés esetén kérj jegyzőkönyvet a futártól." },
        ],
    },
    returns: {
        eyebrow: "Rendelési segítség",
        title: "Elállás és visszaküldés",
        intro: "A visszaküldés pontos módját a termék és a teljesítési szolgáltató alapján adjuk meg.",
        sections: [
            { title: "Elállási szándék", copy: "Írásban jelezd az elállási szándékot. Válaszunkban megadjuk a helyes visszaküldési címet és a további lépéseket." },
            { title: "Termék állapota", copy: "A terméket minden tartozékával és lehetőség szerint az eredeti csomagolásban küldd vissza." },
            { title: "Visszatérítés", copy: "A jóváhagyott visszatérítést az eredeti fizetési mód szerint indítjuk. A banki átfutás külön időt vehet igénybe." },
        ],
    },
    warranty: {
        eyebrow: "Biztonságos vásárlás",
        title: "Jótállás és kellékszavatosság",
        intro: "A termékoldalon és a rendelési iratokban mindig az adott termékre érvényes feltételeket kell feltüntetni.",
        sections: [
            { title: "Hibabejelentés", copy: "Írd meg a rendelési azonosítót, a hiba rövid leírását, és ha lehet, csatolj képet." },
            { title: "Vizsgálat", copy: "A kereskedő vagy a szerződés szerint kijelölt partner megvizsgálja a bejelentést és jelzi a megoldást." },
            { title: "Bizonyító iratok", copy: "Őrizd meg a számlát, a jótállási jegyet és a rendelési értesítőket." },
        ],
    },
    contact: {
        eyebrow: "Segítünk",
        title: "Kapcsolat",
        intro: "Rendeléshez mindig add meg a rendelési azonosítót. Így gyorsabban megtaláljuk az ügyet.",
        sections: [
            { title: "E-mail", copy: "kapcsolat@devshopify.example" },
            { title: "Telefon", copy: "+36 1 000 0000" },
            { title: "Ügyfélfogadás", copy: "Hétfő–péntek, 9:00–17:00" },
        ],
    },
    faq: {
        eyebrow: "Gyors válaszok",
        title: "Gyakori kérdések",
        intro: "A legfontosabb tudnivalók rendelés előtt és után.",
        sections: [
            { title: "Mikor kapom meg a rendelést?", copy: "A várható időt a végleges rendelés előtt mutatjuk meg, majd a visszaigazolásban is elküldjük." },
            { title: "Módosíthatom a rendelést?", copy: "Írj nekünk azonnal. A módosítás csak a feldolgozás megkezdése előtt lehetséges." },
            { title: "Hol követhetem a csomagot?", copy: "Ha van követési hivatkozás, e-mailben küldjük el." },
            { title: "Hogyan jelzek hibát?", copy: "Küldd el a rendelési azonosítót, a hiba leírását és lehetőség szerint egy képet." },
        ],
    },
    privacy: {
        eyebrow: "Jogi tájékoztató",
        title: "Adatvédelmi tájékoztató",
        intro: "A BestCarTrade Kft. csak a rendelés, kapcsolattartás, jogi kötelezettség és engedélyezett mérés céljához szükséges adatokat kezelheti.",
        sections: [
            { title: "Kezelt adatok", copy: "A rendeléshez megadott azonosító, kapcsolati, számlázási és szállítási adatok, valamint az ügyfélszolgálati üzenetek." },
            { title: "Adatátadás", copy: "A teljesítéshez szükséges adatokat a fizetési, számlázási, szállítási és kiszolgáló partnerek kaphatják meg a saját feladatuk határáig." },
            { title: "Mérés és hirdetés", copy: "Elemzési vagy hirdetési mérés csak külön engedély után indulhat. A beállítás bármikor módosítható." },
            { title: "Jogok", copy: "Kérhető tájékoztatás, javítás, törlés, korlátozás vagy tiltakozás a vonatkozó szabályok szerint." },
        ],
    },
    terms: {
        eyebrow: "Jogi tájékoztató",
        title: "Általános szerződési feltételek",
        intro: "Ez a helyi előnézet szerkezeti minta. A hatályos ÁSZF-et a végleges cég-, szállítási, fizetési és partneradatokkal kell jóváhagyni.",
        sections: [
            { title: "Szolgáltató", copy: "BestCarTrade Kft. A székhely, cégjegyzékszám, adószám és hivatalos elérhetőség a tulajdonosi jóváhagyás után kerül ide." },
            { title: "Szerződés létrejötte", copy: "A kosár elküldése ajánlat. A rendelés elfogadását külön visszaigazolás jelzi." },
            { title: "Árak és fizetés", copy: "A vásárló által fizetendő teljes összeg és a választható fizetési mód a jóváhagyás előtt látható." },
            { title: "Teljesítés és panasz", copy: "A szállítási, elállási, jótállási és panaszkezelési feltételeket a kapcsolódó tájékoztatók részletezik." },
        ],
    },
    cookies: {
        eyebrow: "Adatvédelmi beállítások",
        title: "Süti beállítások",
        intro: "A szükséges sütik a kosárhoz és a biztonságos működéshez kellenek. A mérés külön engedély nélkül kikapcsolva marad.",
        sections: [
            { title: "Szükséges", copy: "Kosár, megjelenési mód és biztonsági alapműködés. Ez a csoport nem kapcsolható ki." },
            { title: "Elemzés", copy: "Névtelen használati adatok a bolt javításához. Csak engedéllyel indul." },
            { title: "Hirdetési mérés", copy: "Meta, Google és TikTok mérési jelek. Csak engedéllyel és beállított azonosítókkal indul." },
        ],
    },
};
