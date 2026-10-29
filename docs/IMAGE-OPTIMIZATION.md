# Billedoptimering – By Vigga

Dato: 29. oktober 2026. Arbejdet er på `perf/optimize-product-images`. Intet er deployet eller ændret i produktionsdata.

## Kilde og arkitektur

GitHub main (`cbc57d5`) var den gamle statiske webshop. Det aktive byvigga.com kører Sites/Vinext på Cloudflare Workers med D1-produktdata og R2-billedlager. Derfor synkroniserer PR'ens første commit den eksisterende produktionskilde (`5430d479`, Sites version 34); den næste commit indeholder billedoptimeringerne. Det er nødvendigt for at bevare det nuværende design, kurv, ejerlogin og administration. Gennemgå commits separat. Merge er ikke en automatisk Sites-udgivelse.

Produktfotos uploades gennem ejerbeskyttet `/api/admin/upload` og gemmes i R2 under UUID-filnavne. Produktdata indeholder referencer og billedrækkefølge; hverken produkt-ID, pris, lagerantal eller ordredata er ændret. Dekorationer og oprindelige produktfotos ligger også i `assets/` og bygges til `public/`.

Før ændringen gemte upload-endpointet hele JPG/PNG/WebP-filen uændret. Oversigtsfoto, galleriminiature, kurv og admin anvendte de samme originaler. En miniature kunne derfor udløse over 3 MB billedtrafik. Lazy loading fandtes allerede, men browseren henter også billeder i nærheden af skærmbilledet. Originalerne havde ét døgns browsercache, men ingen eksplicit edge-cache eller betinget ETag-håndtering i billedruten. Der bruges ingen ekstern billedtjeneste. Fonts hentes fra Google; det er bevaret og kan stadig påvirke LCP.

## Løsning

- Eksisterende 86 offentlige produktfotos får WebP-versioner: thumbnail 160 px, oversigt op til 640 px og galleri op til 1600 px i bredden. Små originaler opskaleres ikke. Kort bruger `srcset` med de faktiske dimensioner og `sizes`; galleri bruger den store version. Billedrækkefølge og beskæring er bevaret.
- Content hashes i filnavnene giver sikre, immutable cacheadresser. Et manifest oversætter eksisterende billedreferencer til optimerede filer uden produktændringer. Originalerne i R2 er urørte; eksisterende originale filer i Git er også bevaret.
- Miniaturebilleder i katalog, kurv og administration bruger små versioner. Første produktbilleder er eager, det første har høj prioritet; øvrige billeder forbliver lazy. Dimensioner/aspektforhold reserverer plads, og kataloget reserverer plads under dataindlæsning.
- Logo og kategorigrafik er konverteret til WebP med høj kvalitet og bevaret transparens. Eksisterende SVG-ornamenter, blomster, grene, cremefarver og øvrige grafiske elementer er bevaret. Hero-baggrunde var allerede WebP og er bevaret.
- Nye uploads genererer automatisk 160/640/1600-versioner i browseren før upload. sRGB, EXIF-orientering og høj kvalitet anvendes; originalfilen sendes og gemmes uændret. Højden begrænses til 1600 px for nye versioner. Det sparer en dyr billedtjeneste eller en tung codec i Worker-runtime.
- Serveren kontrollerer ejerlogin, origin, filtype, originalens dimensioner (maks. 40 MP), filstørrelser, WebP-varianter og deres dimensioner før lagring. Manglende varianter afvises tydeligt; brugeren skal genindlæse admin ved en gammel cachet klient.
- R2 leverer nye versioner via `?size=thumb|card|large`, ETag/304, HEAD, immutable caching og Cloudflare Cache API. Ældre billeder uden varianter falder tilbage til originalen med kort cache, så eksisterende referencer fortsat virker. Originaladressen uden size forbliver originalen.
- Udskiftning sker stadig i det kendte adminflow. Nye fotos får nye adresser, så gamle browsercaches ikke viser det forrige foto. Produkt-ID og øvrige data ændres ikke af optimeringen.

## Dokumenterede målinger

Lighthouse 13.6.0, standard mobilprofil med simuleret Slow 4G og CPU-nedsættelse. De endelige kontrollerede målinger er kørt efter hinanden på samme maskine og det samme offentlige snapshot med 39 produkter. De erstatter ikke en eftermåling på produktion.

| Kontrolleret side | Før | Efter |
|---|---:|---:|
| Katalog: billedtrafik | 82,20 MB | 1,24 MB |
| Katalog: billedrequests | 31 | 41 |
| Katalog: LCP | 103,88 sek. | 4,96 sek. |
| Katalog: CLS | 0,439 | 0,0029 |
| Katalog: Lighthouse performance | 55 | 81 |
| Forside: billedtrafik | 2,94 MB | 0,45 MB |
| Forside: billedrequests | 8 | 8 |
| Forside: LCP | 9,16 sek. | 4,36 sek. |
| Forside: CLS | 0,0019 | 0,00048 |

Katalogets billedtrafik falder 98,5 % og forsidens 84,7 % i disse tests. Kataloget har flere requests, fordi små thumbnails og oversigtsbilleder nu er forskellige filer. Datamængde og decode-belastning er væsentligt mindre. Den meget høje kontrollerede før-LCP skyldes Lighthouse-modellens simulation af over 82 MB fotos på en langsom forbindelse; det er ikke et målt ventetidsløfte for alle besøgende.

Separat, faktisk audit af https://byvigga.com/se-flere-smykker før ændringen: 76,94 MB billedtrafik, 29 billedrequests, LCP 7,51 sek., CLS 0,488 og score 45. Den audit skal ikke sammenlignes direkte med lokal efter-LCP. Produktion er uændret, så der findes endnu ingen produktionseftermåling. Rå Lighthouse JSON og eksakt konfiguration ligger ved siden af rapporten.

Alle 86 produktoriginaler udgør tilsammen 157,67 MB. De tilsvarende varianter fylder 0,392 MB (thumbnails, -99,75 %), 5,664 MB (oversigt, -96,41 %) og 26,81 MB (store fotos, -82,99 %). Disse er hele billedsamlingen, ikke første sides billedtrafik. Logo: 837.137 til 158.572 bytes. Kategorigrafik: 1.961.984 til 153.414 bytes. `image-sizes.json` viser hver fil.

Cache: Integrationstesten viser, at andet identisk variantkald giver nul nye R2-læsninger; størrelsevarianter holdes adskilt, og ETag giver 304 uden body. Lighthouse rydder HTTP-cachen før navigation, også med disable-storage-reset; de forsøg måler derfor ikke reelt genbesøg. En målt hit-rate på Cloudflares produktions-CDN kan først verificeres efter en godkendt udgivelse. Det påstås ikke, at headerændringer alene dokumenterer en bestemt hit-rate.

## Test og kvalitet

- Eksisterende suite plus nye tests for varianter, originalbevarelse, ugyldige uploads, fallback, cache, ETag/304, HEAD og srcset.
- Worker/Vinext-build gennemført.
- Browserpreview: produktkatalog, billeder, galleri, næste foto, thumbnails og kurv afprøvet uden at sende bestillinger eller mails. Ingen vandret overflow i den kontrollerede viewport.
- Browserens uploadpipeline blev afprøvet med et 3.529.177-byte JPG: thumb 15.306 bytes (160×213), card 214.532 bytes (640×853), large 728.110 bytes (1200×1600). Originalen indgår uændret. Serverlagringen er dækket af integrationstests; ejerlogin, offentlige data og mailkonfiguration er bevaret.
- WebP-kvalitet 82/86/90 ved batchkonvertering og høj kvalitet ved browserupload. Orientering og sRGB-farver normaliseres. Der er ingen skærpning, farvefiltre eller redesign. Helt tabsfri lighed på pixelniveau hævdes ikke; originalerne er bevaret til fremtidige genkonverteringer.

## Fremtidig arbejdsgang og udgivelse

Upload fotos i admin som før; vent på “Billeder optimeres og uploades…”, vælg rækkefølge og gem produktet. Ingen separat komprimering er nødvendig. Brug JPG, PNG eller WebP under 6 MB/40 MP; større originaler skal eksporteres ned først. Nye uploads får alle versioner automatisk. Eksisterende galleri- og bestillingsreferencer bliver ikke omskrevet.

`pnpm install --frozen-lockfile` installerer Sharp kun som udviklingsværktøj. `pnpm images:refresh` kan genopbygge eksisterende offentlige billeder; originaler caches i den ignorerede `.image-originals/`, originaler på serveren slettes aldrig. Kør kun mod den ønskede offentlige origin. Der er ikke behov for Cloudflare Images-abonnement eller anden ekstern billedtjeneste.

Efter review bør ændringen først testes i Sites-testmiljøet med dets egne bindinger, derefter promoveres til produktion efter godkendelse. Bevar prod/test-identitet og miljøvariabler. Der kræves ingen D1-migration. Udgiv frontend og upload-endpoint sammen. Kør derefter Lighthouse igen på byvigga.com og kontroller edge-cache, mobilupload og fotos visuelt på en rigtig telefon. PR'en merges eller deployes ikke af denne opgave.

Tekniske referencer: [Lighthouse throttling](https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md), [Cloudflare R2 Cache API](https://developers.cloudflare.com/r2/examples/cache-api/).
