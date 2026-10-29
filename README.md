# By Vigga · Handmade Jewelry

## Server og automatisk bestilling

Sitet er nu bygget med Sites' Vinext/Cloudflare Worker-integration. HTML/CSS-kataloget og de eksisterende produktdata er bevaret; `prepare-web.cjs` kopierer dem til `public/`. Checkout kalder `POST /api/orders` i stedet for at åbne kundens mailapp. Sitet er publiceret privat til ejerens gennemgang; byvigga.com er ikke flyttet.

`lib/order-service.mjs` validerer produkter og beregner priser fra kataloget, gemmer bestillinger i D1 og sender bestillingsmail via Gmail og Google Apps Script til byviggashop@gmail.com med kundens mail som Reply-To. `GMAIL_SCRIPT_URL` og `GMAIL_SHARED_SECRET` skal konfigureres som serverhemmeligheder; se `.env.example`. Uden opsætningen returneres en forståelig fejl, og kurven bevares. Gmail-afsendelse er afprøvet med en tydeligt markeret teknisk test, som ejeren har bekræftet modtaget.

Kør `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm run build` og `pnpm start`. Node 22.13+ og pnpm 11.25.0 kræves. Lokale D1-migrationer anvendes før test af serveren med Wrangler, mens Sites anvender produktionsmigrationerne ved publicering. Bevar Sites-buildintegration og projekt-ID.

Afhentning er gratis i Støvring, Himmerland. Præcis adresse fås efter betaling. Fragt ved forsendelse bekræftes manuelt og kommer oveni. Betaling er fortsat manuel MobilePay efter aftale. Databasens ordrestatus, mailstatus og betalingsstatus er adskilt for senere betalingsintegration.

Build og ti funktionstests består. En fuld `tsc --noEmit` rapporterer typefejl i det medfølgende `build/sites-vite-plugin.ts`; den kompilerede Worker og den lokale API er kontrolleret separat. Ændr ikke pluginets runtime for at undertrykke typefejl.

---

Nedenstående er historisk dokumentation for den oprindelige statiske version. Dens instruktioner om GitHub Pages og manuel mail gælder ikke serverens nye checkout.

By Vigga er en statisk hjemmeside for et lille smykkebrand med håndlavede smykker inspireret af skoven. Udtrykket skal være elegant, roligt, feminint, naturinspireret og håndlavet, ikke en klassisk tech/webshop.

Kerneformulering:

> Håndlavede smykker inspireret af skoven

## Hvad er bygget

- `index.html`: Forside med hero, produktkategorier, bestillingspopup, bestillingsflow, betaling, om By Vigga og kontakt.
- `se-flere-smykker.html`: Katalogside med filter, sortering, produktkort og valgt smykke-panel.
- `data/smykker.json`: Enkel datafil til smykkedesigns på katalogsiden.
- `styles.css`, `product-images.css`, `smykker.css`: Visuel styling, layout, responsivitet og produkthåndtering.
- `script.js`, `smykker.js`: Popup, katalogvisning, filter/sortering og mail-links.
- `assets/*.svg`: Rene tegnede fallback-billeder for armbånd, halskæder, ringe og øreringe.

## Sådan køres projektet

Projektet er almindelig HTML/CSS/JS og kræver ingen build-proces.

Åbn lokalt:

```bash
index.html
```

Eller kør en simpel lokal server fra repoets rod:

```bash
python -m http.server 8000
```

Besøg derefter:

```text
http://localhost:8000
```

På GitHub Pages kan filerne hostes direkte. `CNAME` bruges til domænet `byvigga.com`.

## Vigtige beslutninger

- Brandnavn: By Vigga.
- Undertekst: Forest Jewelry.
- Kontaktmail: `byviggashop@gmail.com`.
- Bestilling sker manuelt via mail, ikke via fuld webshop/checkout.
- Betaling aftales først efter bekræftet smykke, pris og levering, fx MobilePay privat i starten.
- Der skal ikke vises QR-kode eller telefonnummer som hovedløsning.
- Priser er vejledende startpriser + fragt.
- Forsidens produktkort skal være generelle kategorier: Armbånd, Halskæder, Ringe, Øreringe.
- Hvert produktkort skal have en `Bestil`-knap.
- Katalogsiden kan udvides via `data/smykker.json` og billeder i `assets/`.

## Billeder

Siden prøver først at vise `.jpg`-billeder, fx `assets/armbaand.jpg`. Hvis de ikke findes, bruges de tegnede SVG-fallbacks, fx `assets/armbaand.svg`.

Når rigtige produktbilleder er klar, kan de lægges ind med samme filnavne som datafilen bruger.
