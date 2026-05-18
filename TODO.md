# TODO · By Vigga

## Næste bedste skridt

1. Læg rigtige produktbilleder ind i `assets/` med de filnavne, som siden allerede bruger:
   - `armbaand.jpg`
   - `halskaeder.jpg`
   - `ringe.jpg`
   - `oreringe.jpg`

2. Opdater `data/smykker.json` med rigtige smykkedesigns, priser, kategorier og billedstier.

3. Beslut om katalogsiden skal bruge konkrete designnavne eller mere kategori-baseret tekst. Forsidens produktkort skal fortsat være generelle kategorier.

4. Flyt eventuelt inline styling fra `index.html` over i `styles.css`, så al CSS ligger samlet.

5. Test visuelt på mobil, tablet og desktop efter næste større ændring.

## Tekniske beslutninger

- Projektet er statisk HTML/CSS/JS og skal forblive enkelt til GitHub Pages.
- Ingen checkout, kurv, QR-kode eller telefonnummer som primær løsning.
- Bestilling sker via mailto-link til `byviggashop@gmail.com`.
- `data/smykker.json` fungerer som enkel datafil for kataloget. Det er ikke en rigtig server-backend, men kan fungere som en enkel GitHub Pages-venlig “backend”.
- SVG-fallbacks skal være rene vektor-SVG'er, ikke base64/indlejrede JPG'er.

## Indhold der skal holdes øje med

- Brug `farve og størrelse`, ikke `farve eller størrelse`.
- Brug `smykket laves og pakkes`, ikke `smykket laves eller pakkes`.
- Brug ikke teksten: `tak for din støtte til håndlavede smykker og naturens små vidundere`.
- Husk at priser altid beskrives som vejledende startpriser + fragt.
- Betaling aftales først efter bekræftelse.

## Mulige forbedringer senere

- Bedre billedadministration via Decap CMS eller anden let GitHub-baseret løsning.
- Separat side for kontakt, hvis siden vokser.
- Mere detaljeret produktdata: materialer, størrelsesmuligheder, farvevalg og status.
- Billedguide i `assets/README.md` med anbefalet format og beskæring.
- Bedre SEO metadata og sociale preview-billeder.