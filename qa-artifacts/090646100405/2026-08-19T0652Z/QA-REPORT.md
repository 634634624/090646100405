# DevShopify rendelési lánc – QA jelentés

- Tesztelt oldal: https://090646100405.uui-client-site.workers.dev
- Rendszerek: DevShopify → Shopify tesztbolt → Webshippy
- Időpont: 2026-08-19
- Biztonság: kizárólag Shopify Bogus Gateway és egyértelműen jelölt demótermékek/rendelések; valódi feladás nem történt.

## Eredmény

### Sikeres ellenőrzések

- Sikertelen fizetés: a Shopify hibaüzenetet adott, új Shopify- vagy Webshippy-rendelés nem jött létre.
- Hibás magyar irányítószám és telefonszám: a pénztár mindkettőt blokkolta fizetés előtt.
- Utolsó darab párhuzamos vásárlása: két kosárból csak az első rendelés teljesült; a második kosár kiürült, túladás nem történt.
- Készlet visszaállítása: a #1011 tesztrendelés lemondása után a Shopify-készlet 0-ról 1-re visszaállt.
- Többtermékes rendelés: Shopify #1012 pontosan egyszer érkezett meg a Webshippybe (WSP#43530525), mindkét SKU, mennyiség, ár és szállítás helyesen szerepelt.
- Csomagkövetés előtti állapot: a még nem teljesített tesztrendelésnél nincs hamis tracking-kód.
- Automatizált ellenőrzések: 17/17 teszt, build, minőségellenőrzés és böngészős QA sikeres; 0 árva böngészőfolyamat.

### Kritikus hibák

1. **Elfogyott termék kijelzése:** amikor a Shopify készlete 0 volt, a nyilvános oldal tartalék demóadatot mutatott, ezért a termék továbbra is rendelhetőnek látszott. A Shopify pénztár végül helyesen elutasította, de túl későn.
2. **Lemondás nem jut át a Webshippybe:** a Shopify #1011 rendelés lemondva és visszatérítve lett, de a Webshippy WSP#43530461 rendelés továbbra is új, feldolgozható állapotban maradt.
3. **Ismételt küldés duplikálhat:** szolgáltatáskiesés után az újrapróbálás ugyanazt a rendelést kétszer küldheti el a Webshippynek. A szimulált próba ugyanazzal a hivatkozással két létrehozást eredményezett.
4. **Országkezelési rés:** a Shopify pénztár az Egyesült Államokat is felkínálja, miközben a Webshippy-átadás csak magyar címet fogad. Egy ilyen fizetett rendelés a Shopifyban maradhat Webshippy-átadás nélkül.

### Külső feltétel

- Pozitív tracking-kód visszaérkezését csak valódi Webshippy-teljesítés után lehet bizonyítani. Tesztrendelést szándékosan nem adtunk fel.

## Javasolt javítási sorrend

1. Shopify-lemondás azonnali továbbítása és a Webshippy-rendelés automatikus megállítása.
2. Duplikáció elleni védelem minden újrapróbálás előtt.
3. Valós készlet kijelzése; hiba esetén ne jelenjen meg rendelhető tartalék készlet.
4. Csak támogatott ország megjelenítése, vagy a nem támogatott cím egyértelmű blokkolása fizetés előtt.

## Javítás utáni ellenőrzés

- A négy kritikus hibát javítottuk.
- Készletlekérési hiba vagy elfogyott készlet esetén a termék már nem rendelhető.
- Az ismételt Shopify-értesítés ugyanahhoz a meglévő Webshippy-rendeléshez kapcsolódik, nem hoz létre másolatot.
- A Shopify-ban lemondott, még feldolgozatlan rendelés Webshippy oldali törlése elkészült. A korábbi WSP#43530461 tesztrendelést biztonságosan eltávolítottuk.
- Kanada és az Egyesült Államok tesztpiaca tervezet állapotba került; a pénztárban csak Magyarország választható.
- A teljes záró ellenőrzés sikeres: 20/20 célzott teszt, 76 böngészős ellenőrzés, build és minőségkapuk hiba nélkül; 0 árva böngészőfolyamat.
- Az új lemondási értesítés éles aktiválása a következő jóváhagyott kiadás része.
