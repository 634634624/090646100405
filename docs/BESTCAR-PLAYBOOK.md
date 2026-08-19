# DevShopify webshop — public playbook

Ez a dokumentum a nyilvános repó biztonságos használatához szükséges alapokat tartalmazza. Belső repók, helyi gépútvonalak, fiókazonosítók és hozzáférési adatok szándékosan nem szerepelnek benne.

## Mi ez?

- Astro + React alapú magyar demó-webshop.
- A termékek és a pénztár Shopifyhoz kapcsolódnak.
- A készlet és a tesztrendelések Webshippyvel vannak összekötve.
- A publikus oldal Cloudflare Workeren fut.
- PhantomWP opcionális vizuális ellenőrző környezet, nem a forráskód helyettesítője.

## Helyi indítás

```bash
npm ci
npm run dev
```

Változtatás után a teljes ellenőrzés kötelező:

```bash
npm run quality:closeout
```

## Munkaszabályok

1. Olvasd el először a repó `AGENTS.md` fájlját.
2. Saját `codex/<feladat>` vagy `claude/<feladat>` ágon dolgozz.
3. A `main` ágra ne írj közvetlenül.
4. A sikeres build önmagában nem elég: mobilon és asztali nézetben is ellenőrizd az oldalt.
5. Valódi fizetést, csomagfeladást vagy rendelésteljesítést ne indíts.
6. API-kulcsot, tokent, jelszót, vásárlói adatot vagy belső gépútvonalat soha ne tegyél a repóba.

## Integrációk

- A böngésző nem kapja meg a Shopify- vagy Webshippy-kulcsokat.
- A publikus kosárkérés csak az engedélyezett demótermékeket fogadja el.
- A Shopify webhookok aláírását a szerver ellenőrzi.
- A Webshippy felé csak Shopify tesztrendelés továbbítható.
- Az ismételt webhookokat tartós zárolás védi a dupla rendeléstől.
- A publikus katalógus és pénztár végpontok korlátozva és gyorsítótárazva vannak.

## Dizájn és komponensek

A projekt UUI-tokeneket és a repóban található komponenseket használja. Belső UUI könyvtár vagy sablon használatához kérj céges hozzáférést; ezek elérési útját és privát branch-neveit ez a publikus dokumentum nem közli.

## Élesítés

Az éles Cloudflare deploy mindig külön jóváhagyáshoz kötött. Deploy előtt:

```bash
npm run quality:closeout
npx wrangler deploy --dry-run
```

A titkokat kizárólag Cloudflare secreten keresztül add meg. A repóban csak üres példák maradhatnak.
