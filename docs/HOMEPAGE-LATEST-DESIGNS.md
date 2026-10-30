# Forsidetekster og nyeste designs

Forsiden har fået de ønskede tekster: overteksten ved Find din favorit er fjernet, Personlige smykker og den længere kurveforklaring er indsat, og Om mig viser Jeg hedder Vigga samt de tre leverede afsnit. De fire kategorikort, eksisterende illustrationer, hero og bestillingsflow er bevaret.

De nyeste designs står mellem kategorierne og den personlige sektion. Den bruger samme offentlige `/api/products`-kald, produktkort, galleri, kurveknapper og billedoptimering som kollektionen. Titler linker til butikkens eksisterende `?produkt=`-visning. Ingen manuel produktliste er tilføjet. Sektionen viser højst otte aktive, ikke slettede produkter og skjules ved tom liste eller fejl i API-kaldet. Nye oplysninger hentes ved næste sideindlæsning; der bruges ingen ekstra polling.

Produkt-API'et eksponerer oprettelsesdato fra den eksisterende `product_created`-historik. Pris- og billedrettelser ændrer derfor ikke nyhedsplacering. For ældre databasevarer uden oprettelseshistorik kendes den oprindelige dato ikke; de placeres stabilt efter daterede varer med produkt-ID som tie-breaker. Starterkataloget før databaseinitialisering bruger sine eksisterende datoer. Ingen databasemigration er nødvendig.

Alle billeder i sektionen er lazy loaded. De genbruger card-varianten og eksisterende srcset/sizes samt et fast 4:5-billedfelt. Intet ekstra fuldopløsningsbillede hentes, før kunden åbner galleriet. Der er ét fælles produkt-API-kald og ingen nye tredjepartsafhængigheder.

## Ændrede kilder

- `index.html`: tekster, placering og sektionsramme.
- `atelier.js`: indlæsning og genbrug af kort, eksisterende produktlinks.
- `atelier.css`: cremefarvet sektion og responsive 4/3/2/1-kolonner.
- `lib/products.mjs`: eksponering af oprettelseshistorik.
- `lib/latest-designs.mjs`: aktiv/slettet-filter, stabil sortering og maksimum otte.
- `prepare-web.cjs` og genererede `public/`-kopier: inkluderer det nye browsermodul.
- `tests/latest-designs.test.mjs` og lokal Vite-fixture: verifikation.

## Kontrol

55 automatiske tests består; framework/Worker-build lykkes. De nye tests bruger også SQLite med de faktiske migrationer og verificerer, at en gammel vare med nyere redigeringsdato ikke kommer foran en nyere oprettet vare. Skjulte, slettede, tomme og korte lister er dækket.

Lokal browserkontrol med isoleret starterkatalog: otte kort, fire kolonner ved 1440 px, to ved 390 px og intet vandret overløb. Synlige produktbilleder anvender optimerede WebP-card-filer, mens kort længere nede fortsat er lazy. Klik på produktnavn åbner korrekt eksisterende produktvisning med Detaljer & mål foldet ud. Teksterne er kontrolleret i den renderede side. Ingen fysisk telefon eller ny Lighthouse-måling er udført.

Ingen deployment, main-merge eller ændring af produktionsdata. Branchen bygger oven på upload/favicon-PR #2, så de forbedringer følger med uden at blive overskrevet. Skærmbilleder er gemt i workspace-mappen `outputs/`.
