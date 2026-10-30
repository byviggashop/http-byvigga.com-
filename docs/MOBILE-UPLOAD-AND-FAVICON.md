# Mobilupload og favicon

## Problem og løsning

Den tidligere upload krævede WebP fra canvas. En browser, der returnerer PNG i stedet for den ønskede WebP, blev derfor afvist. HEIC og fotos over 6 MB blev også afvist. Fejlbeskeden stod øverst på administrationssiden og kunne være uden for skærmen ved uploadfeltet. Dette er konstateret i koden; fejlen er ikke diagnosticeret på ejerens fysiske telefon.

Uploadfeltet viser nu lokal forhåndsvisning, fremdriftsbesked, annullering og synlig fejl eller succes. WebP foretrækkes, med JPEG som reserve ved manglende encoder. Der genereres 160, 640 og 1600 px varianter uden opskalering. Originalen bevares. Produktet gemmes stadig med **Gem produkt** efter upload; gem og slet er deaktiveret under upload. Skift af produkt afbryder en igangværende upload, så billeder ikke tilknyttes det forkerte produkt.

JPEG, PNG og WebP understøttes; HEIC/HEIF konverteres kun, når browseren selv kan afkode formatet. Ellers vises en konkret vejledning om at eksportere eller vælge JPEG. Der installeres ingen ekstern konverteringstjeneste. Maksimum er 20 MB pr. original og 40 megapixel ved klientafkodning. Serveren begrænser hele requesten til 32 MB, også uden Content-Length, og validerer billedformat og variantdimensioner før lagring. HEIC-originaler opbevares uændret; serveren afkoder dem ikke.

Timeout, netværksfejl, udløbet login, ugyldige serversvar og lagerfejl giver lokale fejlbeskeder. Eksisterende billeder og produktdata bevares.

## Favicon og SEO

Et cremefarvet V med et lille gyldent blad på skovgrøn baggrund er leveret som SVG, ICO (16/32/48), PNG (32/96), Apple Touch Icon (180) og Android-ikoner (192/512), samt webmanifest. Kilden ligger i `assets/brand/favicon.svg`; `npm run icons:build` gendanner rasterfilerne med Sharp.

Forside og kollektion har beskrivende titler, beskrivelser, canonical-adresser og ikonlinks. Offentlige robots.txt og sitemap.xml er tilføjet. Administrationen har noindex/nofollow; produktbilled-API'et må crawles. Google bestemmer selv, hvornår favicon opdateres i søgeresultater.

## Verifikation

- 53 automatiske tests samt framework/Worker-build består.
- Lokal browser med mobil viewport: faktisk AdminClient, upload-handler og isoleret hukommelseslager. JPEG blev valgt, optimeret med simuleret manglende WebP-encoder, uploadet, valgt som forside, gemt og bevaret efter genindlæsning.
- Samme browser viser en tydelig fejl ved udløbet login og korrekt JPEG-vejledning ved et reelt HEIC-foto, som browseren ikke kan afkode.
- Automatiske tests dækker WebP, JPEG-reserve, større originaler, originalbevaring, auth/origin, størrelsesgrænser, annullering, timeout, netværksfejl og lagerfejl.
- Alle offentlige ikon-, manifest-, robots- og sitemap-filer svarede lokalt med HTTP 200 og forventet MIME-type.

En fysisk iPhone/Safari eller Android-enhed er **ikke** testet. Før udrulning bør ejeren på testmiljøet vælge et HEIC-foto og et stort JPEG fra Fotos, kontrollere preview/fejl, gemme produktet og genåbne det. Safari-simuleringen tester encoder-reserven, ikke hele Safari-motoren.

Den lokale UI-fixture startes med `node node_modules/vite/bin/vite.js --config tests/fixtures/vite.admin.mjs` på port 4191. Brug `/tests/fixtures/admin-upload.html?simulate=safari` eller `?scenario=expired`. Fixture bruger kun lokale hukommelsesdata og sender ingen mails eller ændringer til produktion.

## Leverance

Ingen produktionsudrulning eller ændring af main er foretaget. Denne PR baseres på `perf/optimize-product-images`, fordi den eksisterende PR #1 indeholder den aktuelle driftssource, mens main stadig indeholder den ældre hjemmeside. Det holder denne ændring gennemgåelig uden at gentage hele den tidligere synkronisering.

## Tekniske referencer

- [HTML canvas: outputformat og PNG-reserve](https://html.spec.whatwg.org/multipage/canvas.html)
- [WebKit: HEIC-understøttelse i Safari 17](https://webkit.org/blog/14445/webkit-features-in-safari-17-0/)
- [Google: favicon i søgeresultater](https://developers.google.com/search/docs/appearance/favicon-in-search)
