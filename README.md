# By Vigga · Forest Jewelry

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