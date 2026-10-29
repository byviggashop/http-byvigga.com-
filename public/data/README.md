# Enkel smykke-backend

Undersiden `se-flere-smykker.html` læser alle smykker fra `data/smykker.json`.

For at tilføje et nyt smykke:

1. Upload billedet til `assets/products/` eller `assets/`.
2. Tilføj et nyt objekt i `data/smykker.json`.
3. Brug samme felter som de eksisterende smykker.

Eksempel:

```json
{
  "id": "mit-nye-smykke",
  "navn": "Mit Nye Smykke",
  "kategori": "Armbånd",
  "pris": 325,
  "billede": "assets/products/mit-nye-smykke.jpg",
  "fallback": "assets/armbaand.svg",
  "beskrivelse": "Kort tekst om smykket.",
  "maal": "Send håndledsmål i beskeden.",
  "dato": "2026-05-18"
}
```

Kategorierne skal være en af disse, hvis filtrene skal virke:

- `Armbånd`
- `Øreringe`
- `Halskæder`
- `Ringe`

GitHub Pages kan ikke køre en server-backend, men denne datafil fungerer som et enkelt redigerbart katalog.
