# Produktionsudgivelse – 29. oktober 2026

Udgivet på byvigga.com efter brugerens godkendelse af testmiljøet.

- Sites version 35; produktionscommit `3264ffef3e0b8e231b8284e11cb0dec294344544`.
- 41 tests består og Worker-build er gennemført.
- Offentlig produktliste før/efter er identisk: 39 produkter.
- Originalfoto svarer 200; optimeret foto svarer 200 som WebP; If-None-Match giver 304; anonym admin-API-adgang giver 403.
- Browserkontrol på byvigga.com: 39 produktkort, indlæste WebP-kortbilleder, galleri og næste store foto fungerer. Ingen bestillinger eller mails er sendt.

Lighthouse standard mobilprofil på den faktiske katalogside:

| Måling | Før | Efter udgivelse |
|---|---:|---:|
| Billedtrafik | 76,94 MB | 1,24 MB |
| Billedrequests | 29 | 41 |
| LCP | 7,51 sek. | 4,86 sek. |
| CLS | 0,488 | 0 |
| Performance-score | 45 | 78 |

En enkelt før- og eftermåling; netværk, cache og timing kan variere. De tidligere kontrollerede lokale tests er dokumenteret separat og er ikke brugt som produktionens førværdi.

Cachekontrollen fandt, at den faktiske Sites-levering af statiske filer bruger `public, max-age=0, must-revalidate`, selv om public/_headers anmoder om immutable caching. ETag/304 er verificeret, så genvalidering kan undgå genoverførsel af billedindhold, men lang browser-cachetid for disse statiske varianter er ikke aktiveret af _headers på denne hosting. R2-billedruten har sin egen cache-/ETag-logik. En produktions-CDN-hit-rate påstås ikke målt.

Rå eftermåling: `performance/images-production-after.json`; smoke-kontrol: `performance/production-smoke.json`.
