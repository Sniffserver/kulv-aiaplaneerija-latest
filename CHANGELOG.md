# KÜLV – Muudatuste logi (Changelog)

Kõik märkimisväärsed muudatused KÜLV projektis dokumenteeritakse siin failis.
Formaat põhineb [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardil ja projekt järgib [Semantic Versioning](https://semver.org/) reegleid.

---

## [Unreleased]

### Parandatud (Fixed)
- Taastamine eristab puuduvaid varukoopia jaotisi selgesõnaliselt tühjadest loenditest; kõik taastamised jäävad ühe IndexedDB tehingu piiresse.
- Aia piirjoon normaliseeritakse kanoonilisse maailmakoordinaatide süsteemi ning rakenduse vaade laetakse kanoonilisest yardPlans-tabelist.
- Päikeseekspositsioon arvutatakse sama geomeetrilise mootori kaudu ülevaates, peenra detailvaates ja stsenaariumide võrdluses; taimeandmete puudumine ei peida päikesetundide arvutust.
- Istutusrakud ja nende ajalookirjed salvestatakse aatomiliselt; asendatud või eemaldatud istutuse ajalugu säilib koos kuupäeva ja taime botaanilise sugukonna hetkepildiga.
- **Geomeetria sisendite valideerimine (PR #23):** Lõpmatute, NaN või vigaste koordinaatide ja dimensioonidega objektid lükatakse tagasi andmeterviklikkuse reeglitega (RULE-GEO-001, RULE-GEO-002, RULE-GEO-003) enne SAT-kattuvuse ja piirikontrolli teostamist.
- **Aia tühjendamise ja taastamise võidujooksud (PR #24):** Tühjendatud aia olek püsib üle laadimiste; pooleliolevad kirjutused katkestatakse ja autoriteetne tühjendus ei lase vanadel asünkroonsetel salvestustel objekte taaselustada.
- **Tallinna tsiviilaasta ja istutuskuupäevad (PR #22):** Istutusaeg ja kalendriaasta tuletatakse Europe/Tallinn ajavööndis (`getTallinnCivilYear`), vältides UTC ja aastavahetuse piirinihkeid.
- **SQLite-põhine tervisekontroll ja valmisolek (PR #25):** `/api/health` kontrollib esmasena SQLite snapshot'e, mitte pärand-JSON faili, ning `/api/ready` kinnitab andmebaasi ühenduse toimivust.
- **Telemeetria säilitamise piirangud (PR #26):** Telemeetria säilitamisele seatud 365 päeva lagi ning SQLite andmebaasiprobleemide turvaline tõrkeveateade.

### Lisatud (Added)
- PlantsModule-i D3-põhine interaktiivne kasvugraafik (`PlantGrowthChart`), mis visualiseerib taime eeldatavat kasvuperioodi, arenguetappe (ettekülv, istutus, vegetatiivne kasv, õitsemine, saak, puhkeperiood) ning optimaalseid ja kriitilisi temperatuurivahemikke Eesti kliimas koos avamaa, kasvuhoone ja katteloori simulatsiooniga.
- Terviklik regressioonitestide komplekt `gardenClearRestoreLifecycle.test.ts` aia tühjendamise, näidisaia taastamise, võidujooksude ja korduskatsete elutsükli jaoks.
- IndexedDB skeem v9 taastab kanoonilise aiaplaani ja täiendab stsenaariume; skeem v10 lisab eraldi püsiva külvikorra-erandite tabeli ning säilitab istutusajaloo päritolu.
- Regressioonitestid varukoopia jaotiste, aia geomeetria, skeemide v9/v10 migratsiooni, külvikorra ajaloo, ajavööndi/polaarpäeva ja istutuse elutsükli jaoks.
- CI logib jõudluse baasnäidud 50, 200, 500, 1 000 ja 2 000 aiaobjektiga stseenidele.

## [0.1.0] - 2026-10-08

### Lisatud (Added)
- **KÜLV identiteet ja bränding:** Eesti aia- ja kasvuplaneerija (Põhjamaine fookus, Tallinn 59.4°N).
- **Aia 2D plaanija (meetriline lõuend):**
  - Ruudustik (0.25 m snap-to-grid) ja meetriline mõõtkava.
  - 50-sammuline tagasivõtmise (undo/redo) mälu (`Ctrl+Z`, `Ctrl+Y`).
  - Puutetundlikkus: kahe sõrmega suumimine ja nihutamine (pinch-to-zoom/pan), pika vajutuse valik ja alla libistatav detailipaneel.
  - `requestAnimationFrame` tsükkel, mis renderdab ainult muudatuste korral.
  - 300 ms puhverdatud (debounced) IndexedDB kirjutamine.
- **Täpne päikesesimulatsioon:**
  - SunCalc arvutused 15-minutilise sammuga.
  - Madala päikesenurga toetus kevadel ja sügisel (kuni 0.8°).
  - Puude pehmed ovaalvarjud (soft ellipses).
  - Reaalajas päikesetõusu ja -loojangu ajad Tallinnas.
- **Ilmamoodul & Open-Meteo offline tugi:**
  - Hetkeilm, 3 päeva prognoos, sademed, tuul ja õhuniiskus.
  - Öökülmahoiatuse banner (temperatuur ≤ 1°C).
  - Täielik võrguühenduseta tugi: viimane ilmateade salvestatakse Dexie `weatherCache` tabelisse ja kuvatakse võrgu puudumisel.
  - Open-Meteo litsentsiviide mitteäriliseks tasuta kasutamiseks.
- **Taimede entsüklopeedia & Peenra ruutmeetri planeerija:**
  - 60+ kultuuri koos Eesti kohalike sortidega (*Maike, Terma, Peipsi sibul, Aamisepp* jne).
  - Virtualiseeritud loend sujuvaks kerimiseks.
  - Külvikorra analüüs (3-aastane sugukonna jälgimine) ja seltsiliste analüüs (head/halvad naabrid).
  - "Peenar täis 🌱" meeleolukas märguanne täitmise lõpetamisel.
- **Külvikalender & Külmaliugur:**
  - Interaktiivne liugur *"Mis juhtub, kui külm tuleb varem?"*, mis tõstab esile ohus olevad hilised viljad.
  - iCalendar (.ics) ekspordi tugi.
- **Aedniku märkmik & retseptid (Raamat):**
  - Markdown redaktor ja eelvaade.
  - Mallid: elav muld (*Living Soil 1:1:1*), väetisetee leotis (*1:10*), hooaja kokkuvõte.
  - Globaalne otsing üle pealkirjade ja sisu.
  - Interaktiivsed märkeruudud `- [ ]`.
  - Ohutusjuhised väetisteede kasutamisel (kätepesu, 14-päevane ooteaeg enne saaki, 1:10 lahjendus).
- **Kasvukapp & Mullalabor:**
  - Väetisetee doseerija liitrites.
  - Mulla mahu arvutaja liitrites ja 50L kottides.
  - Home Assistant otsene ja serveripõhine anduriliides.
- **Valikuline FastAPI + Docker taustaserver (`server/`):**
  - Hoiab Home Assistant tokenit turvaliselt serveri `.env` failis (ei leki veebibrauserisse).
  - 30-sekundilise vahemäluga `/api/sensors` otspunkt.
  - `/api/sync` aia JSON-plaani sünkroonimiseks seadmete vahel.
  - Täielik `docker-compose.yml` ja eestikeelne paigaldusjuhend `server/JUHEND.md`.
- **Progressive Web App (PWA) & Teenustöötaja:**
  - Mitmetasandiline eraldatud vahemälustrateegia (`public/sw.js`):
    - **App Shell & Navigeerimine**: NetworkFirst koos `index.html` võrguühenduseta tagavaraga.
    - **Räsitud staatilised varad (`/assets/*`)**: CacheFirst muutumatutele failidele.
    - **Ikoonid ja fondid**: CacheFirst.
    - **Ilma API (Open-Meteo)**: NetworkFirst koos võrguühenduseta vahemäluga.
    - **Serveri API (`/api/*`) ja Home Assistant**: NetworkOnly (välistab vahemälu, tagades reaalajas andmed).
  - PWA versiooniuuenduste elutsükkel (`usePWAUpdate.ts`) koos rahuliku ja kasutajasõbraliku uuendusteatega (`UpdateBanner.tsx`) ja `SKIP_WAITING` koordineerimisega.
  - In-app paigaldusnupp (`PWAInstallButton`) koos iOS Safari juhisega.
  - Täielik offline-first töökindlus.
- **Arhitektuur ja skaleeruvus:**
  - `App.tsx` dekomponeeritud puhtaks peakomponendiks spetsialiseeritud hookidega:
    - `useGardenState.ts` (lõuendi peenrad, istutused, debounced persistence)
    - `useTasksState.ts` (ülesanded, lõpetamine, kustutamine koos tagasivõtmisega)
    - `useJournalState.ts` (päeviku lehed, kasvukapi logid, debounced persistence)
    - `useAppSettings.ts` (seaded, teemad, rahulik režiim)
    - `usePWAUpdate.ts` (teenustöötaja registreerimine, uuenduste tuvastamine ja rakendamine)
- **Kvaliteet ja testid:**
  - TypeScript `strict: true` režiimis ja Zod skeemivalideerimine (`PlantSchema`, `ClimatePresetSchema`, `GardenBackupSchema`).
  - Dexie v2 skeemiversioonimine ja automaatne andmete migreerimine (`.upgrade()`).
  - Täiustatud iCalendar (.ics) tugi standardse `VTIMEZONE Europe/Tallinn`, RFC 5545 `DTSTAMP` ja `UID` kirjetega.
  - Päikesesimulatsiooni astronoomilised kontrolltestid (kevadine pööripäev, jaanipäev, sügisene pööripäev) võrrelduna Tallinna ametlike andmetega.
  - DOMPurify HTML-i puhastamine aiapäeviku Markdowni renderdamisel kasutaja sisu turvalisuse tagamiseks.
  - Suitsutest ja 375 px mobiilivaate test (horisontaalse kerimiseta).
  - FastAPI serveri uuendused: `/api/metrics` Prometheus eksport, puhas `/api/health` ilma saladuste lekketa, aatomi failikirjutus `uuid4()` abil, mitte-root kasutaja Dockeris ja konteineri tervisekontroll (`HEALTHCHECK`).
  - Vitest testipakett ja testide kattuvuse (`test:coverage`) skript.
  - Kogukonna ja turvalisuse dokumentatsioon: `SECURITY.md`, `CONTRIBUTING.md`, Issue ja Pull Request mallid.
  - GitHub Actions CI ja CD töövood (Node.js testid, kattuvus, Python pytest ja serveri Docker ehituse verifitseerimine).
