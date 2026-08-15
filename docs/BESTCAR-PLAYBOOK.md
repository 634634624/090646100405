# BestCarTrade webshop — PLAYBOOK (minden AI-nak, sima Codexnek is)

Ez a doksi önmagában elég ahhoz, hogy bővítsd/szerkeszd az oldalt. Először ezt olvasd, aztán a repo `AGENTS.md`-jét.

## Mi ez és hol van

- **Ez a repo a kanonikus munkapéldány:** `~/Documents/UUI-Workspace/bestcartrade-storefront` · remote: `github.com/634634624/bestcartrade-storefront` (privát), branch `main`.
- UUI Site Factory által emittált **small-shop** kliens-site (Astro + UUI React szigetek), teljes magyar webshop: főoldal, shop, kategóriák (műszaki/otthon), keresés, termék-oldal, kosár, checkout, rendelés-követés, GYIK/szállítás/visszaküldés/garancia/ÁSZF/adatvédelem/süti, 404.
- Build-terv: `.uui/build-plan.json` (agencyRecipe `small-shop`, 10 resolved library ref, 5 pinned canonical prompt). Kapuk: `npm run build` + `check` + `quality:lint` + `quality:e2e` → `npm run quality:closeout` egyben.
- **Integrációk MOCK módban**: `shopify-storefront` + `shopify-notifications` (`src/data/integrations.json`). Élesítés CSAK explicit jóváhagyással (Agency OS provider-döntés után); "Production deployment is never implicit."
- PhantomWP = opcionális távoli futtató/vizuális-QA környezet, NEM a repo helyettesítője.
- ⚠️ Létezik egy RÉGI példány: `~/.codex/worktrees/bf0f/UUI-Workspace/bestcartrade-storefront` — NE használd, minden tartalma ide lett mentve (commit `bfe7d12`).

## Hogyan dolgozz rajta

1. `cd ~/Documents/UUI-Workspace/bestcartrade-storefront && nvm use && npm ci`
2. Saját branch: `codex/<feladat>` (vagy `claude/<feladat>`). SOHA ne dolgozz main-en közvetlenül.
3. Dev: `npm run dev`. Változás után: `npm run quality:closeout` zöld KÖTELEZŐ.
4. Bizonyíték = élő render (böngészőben megnyitva, mobil 375 + desktop 1280, light+dark), nem build-zöld. Kész-jelentéshez commit-hash + időbélyeg.
5. Session végén: commit + push (a workspace push-gate ezt kikényszeríti). A workspace-szabálykönyv: `~/Documents/UUI-Workspace/AGENTS.md` (🧿 governance szakasz) — closest wins: ennek a repónak az AGENTS.md-je erősebb.

## Honnan építs — ecommerce/shop forrástérkép (2026-08-15 teljes leltár)

**ELSŐ VÁLASZTÁS (UUI-natív, kész):**
| Forrás | Mi van benne | Hol |
|---|---|---|
| **uui-starter-kit/toolkit/ecommerce** | 79 fájl, 12 csoport: product 12, storefront 10, account 9, cart 7, checkout 7, admin 5, emails 5, trust 5, b2b 4, growth 4, subscriptions 4 + lib (mock/money/types) — a legerősebb kész könyvtár | `~/Documents/UUI-Workspace/uui-starter-kit/toolkit/ecommerce/` — ⚠️ READ-ONLY legacy repo: PORTOLJ belőle, ott ne dolgozz! Demo-oldalak: `src/pages/demos/ecommerce/` (9 db) + `src/pages/webshop/` (5 HU oldal) |
| **uui-components-browser katalógus** | 144 shop-nevű bejegyzés (product-lists, shopping-carts, checkout-forms ×5, category-filters ×3, grid/gallery/swatch) — böngészhető az 5173-as szerveren | `~/Documents/UUI-Workspace/uui-components-browser/src/catalog.generated.json` |
| **UUI pro-templates** (hero + pricing kánon) | hero-header-sections **44 db**, pricing-sections 22, pricing-pages 10 + cta/testimonial/social-proof/banners; "másik hero" = INNEN, UUI-1TO1 módszerrel | `~/Documents/UUI-Workspace/_design-resources/untitled-ui/pro-templates/marketing/` |

**MEG NEM LANDOLT KINCS (nézd meg, mielőtt nulláról építesz):**
- `rescue/stash-2-shadcn-w6-wip-20260815` branch (uui-components-browser): W6 product 01-07 + storefront 01-07 + checkout 01-05 munka (363 fájl diff) — pusholva originre.
- `codex/shadcn-web-figma-pilot` branch: multi-step checkout + quick-view (+1012 sor, unmerged).

**KONVERZIÓS NYERSANYAG (shadcn/Tailwind → UUI portoláshoz):**
| Korpusz | Shop-tartalom | Hol |
|---|---|---|
| JD shadcn-pro-blocks | **376 shop-blokk** (checkout-cart-drawer, bundle-builder, address-book, b2b-purchase-order, product-*, pricing-*) a 6220-ból — SOURCE OF TRUTH | `/Users/macbook/Documents/JD/60-69 Libraries & Assets/63 Web templates/shadcn-pro-blocks/blocks/` |
| Tailwind Plus ecommerce | 84 komponens + 30 page-example HTML-ben ÉS ugyanez JSX-ben (114+114): product-lists 11, incentives 8, carts 6, checkout-forms 5, store-navigation 5… | `UI-Kits/tailwind-plus/blocks/junket-tailwindcss-plus/html/ui-blocks/ecommerce/` + `react/ubresponsive-fw-ai-demo/components/ecommerce/` — ⚠️ Tailwind ≠ UUI tokenek: csak layout-ötletnek, UUI-ra portolva |
| shadcn-store | 45 e-commerce tsx (storefront-hero 8, product-categories 7…) + marketing pricing/hero | `~/Documents/UUI-Workspace/shadcn-store/resources/js/components/blocks/` |
| shadcn-space-pro | 26 commerce blokk (product-category/quick-view/overview/listing, checkout) + 15 pricing | `~/Documents/UUI-Workspace/shadcn-space-pro/` |
| _source/shadcnspace | 290 blokk-dir nyers forrás (checkout, pricing 13, product ×19) | `~/Documents/UUI-Workspace/uui-components-browser/_source/shadcnspace/` |

**FIGYELEM:** az UUI pro-templates-ben NINCS natív product/cart/checkout — az a starter-kit toolkitben és a fenti korpuszokban él.

## Gyors receptek

- **„Másik hero kell":** válassz a pro-templates 44 hero-jából → UUI-1TO1 módszer (`~/Documents/UUI-Workspace/UUI-1TO1-METHODOLOGY.md`): valódi forrás + tokenek + framing, SOHA ne emlékezetből.
- **Új shop-szekció:** először starter-kit toolkit/ecommerce → ha nincs, katalógus 144 bejegyzése → ha ott sincs, konverziós korpuszból portolás UUI-tokenekre.
- **Integráció-élesítés (Shopify stb.):** mock marad, amíg nincs rögzített provider-döntés + explicit "mehet élesbe" a tulajtól. Secrets SOHA a repóba.
- **Design-szabályok:** `uui-web-builder` skill (kanonikus authority) + a workspace CONVENTIONS/CRAFT lánca (`uui-components-browser/apps/site-starter/toolkit/DOCS.md`).

## Verzió-zavar feloszlatása — MELYIK "library" a jó? (a tulaj kérdésére)

Több hasonló felület él; ez a rangsor, ne keverd:

| Felület | Mi ez | Mire használd |
|---|---|---|
| **uui-components-browser @ main** (`~/Documents/UUI-Workspace/uui-components-browser`, friss origin/main-en) | A KANONIKUS Library + Site Factory + katalógus (144 shop-bejegyzés) | Innen indul MINDEN új szekció/komponens-keresés; 5173-as szerver |
| **uui-impl** | Ugyanennek a repónak a FUTTATÓ worktree-je (a start-servers.sh ezt indítja) — régebbi ponton áll | Csak futtatás/nézegetés; NE szerkeszd |
| **Offline tükör — MÓDOSÍTOTT** (`offline-mirrors/untitledui-react-single-app/site/`, 4187-es szerver) | A tulaj által átalakított UUI-tükör: MÁS MAPPASTRUKTÚRÁJÚ SIDEBAR (UUI-ból szedve) + hozzáadott blog/img/api/application-ui tartalom; 983 fájlban tér el a pristine-től; SEHOL nem verziózott → 2026-08-15-én rescue-tarba + iCloudra mentve (`offline-mirror-single-app-MODIFIED-20260815.tar.gz`) | REFERENCIA a tulaj preferált navigáció/struktúra-ízlésére — ha "olyan sidebart, mint a tükrömön", INNEN nézd |
| `site-pristine/` + 4177-es statikus tükör | Érintetlen pixel-referencia az eredeti untitledui.com-ról | Vizuális ground-truth összevetéshez |
| uui-starter-kit | LEGACY, read-only migrációs forrás (de a toolkit/ecommerce a legjobb kész shop-könyvtár!) | Portolás forrása, munka TILOS benne |

Ha kétség van: **katalógus (browser main) + starter-kit toolkit/ecommerce a tartalom-kánon; a módosított tükör a tulaj ízlés-referenciája.**
