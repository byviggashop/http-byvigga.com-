# Lager og bestillingsvarer

## Fejl og afgrænsning

Den tidligere `workflowUpdate` og admin-endpoint gemte kun betalings- og udleveringsdatoer. Ingen kode reducerede `products.quantity`, og der fandtes ingen reservationstabel. Ordrelinjer har stabile produkt-ID'er; selvstændige variant-ID'er eller variantlager findes ikke (mål/varianter er beskrivende tekst).

Ved en read-only kontrol 1. november 2026 havde BV-3A7B-3E02-91BA en `fulfilled_at`-dato, mens `armbaand-04` og `bv-42232b36` begge stadig havde quantity=1. Det stemmer med den manglende lagerkode. Data er ikke rettet. En konkret efterregulering kræver fysisk optælling af begge produkter og kontrol af andre salg/manuel genopfyldning. Hvis begge eksemplarer faktisk er udleveret og ikke erstattet, er konsekvensen 1→0 på hvert produkt. Der køres ingen automatisk historisk regulering.

## Drift

- Produkter → vælg Unikt eller Kan laves på bestilling; angiv fysisk antal. Eksisterende numeriske lagre tolkes som unikke og eksisterende tomme lagre som bestillingsvarer uden data-backfill.
- Bekræft ordre reserverer fysisk lager. Den eksisterende Betalingsmail sendt-knap bekræfter/reserverer også, så den normale arbejdsgang bevares. Ingen knap sender mail.
- Vare afhentet/sendt reducerer kun det fysisk reserverede antal. Fremstillede bestillingsvarer registreres særskilt og skaber aldrig negativt lager.
- Annullér frigiver reservationer før udlevering; udleverede ordrer kan ikke annulleres via denne handling. Sletning af en reserveret ordre kræver annullering først.
- Fysisk antal kan ikke sættes under reserveret antal. Manuelle ændringer gemmes med dato, ejeridentitet, før/efter, ændring og valgfri begrundelse i produkthistorikken.
- Fremstilles en vare direkte til en allerede reserveret bestillingsordre, må den ikke også registreres som ekstra lager. Ekstra fremstillede varer registreres som fysisk beholdning. Ordren beholder sin oprindelige fordeling mellem fysisk og fremstilling.

Reservationer og lagertræk håndhæves af SQLite/D1-triggers i samme transaktion som ordrestatus. En mangel ruller hele bekræftelsen tilbage. Primærnøglen (ordre, produkt) og statusovergange beskytter mod dobbelte træk. Lagerbevægelser henviser til ordrenummeret. Produktkort, nyeste designs, detaljer og kurv viser tilgængelighed; ordre-endpoint validerer serverens friske lager. Der reserveres først ved ejerens bekræftelse, ikke ved kundens bestillingsønske.

## Miljø og test

GitHub main er stadig den oprindelige statiske hjemmeside. Denne branch er derfor baseret på `fix/homepage-copy-latest-designs`, som indeholder den aktuelle server-app. PR'en er rettet mod den branch og skal senere koordineres med dens integration til main.

Test-Site: appgprj_6ad4c0cfec848191af43a5d4c0456c61. Produktion: appgprj_6ad49aaf1ccc819191d1b0ba3ff79c9b. Read-only kontrol viste tom order_workflow i test og syv rækker i produktion. Identiske lokale placeholder database-id'er i build-konfigurationen er ikke de hostede database-id'er. Kopiér aldrig produktionsdatabase, secrets eller hosting-identitet til test.

Migration 0004 er additiv, uden lagernedskrivning eller replay af ordrer. Eksisterende afsluttede ordrer bevares uden inventory-rækker. Ældre åbne ordrer skal kontrolleres og eksplicit bekræftes før udlevering. Migration skal kun afprøves på test-Site; produktion kræver manuel godkendelse. Skema, SQL-triggers og Drizzle-snapshot/journal er committed sammen.

`node --test --test-timeout=15000 tests/*.test.mjs`: 65 tests, herunder A–G, rollback, genopfyldning og to samtidige separate SQLite-forbindelser. `tsc --noEmit` og Vinext-build verificerer kode og bundle. Lokale tests bruger udelukkende isolerede SQLite-databaser og sender ingen mails. Gmail-automatiseringen er ikke ændret.
