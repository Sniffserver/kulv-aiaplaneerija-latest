# Kaastöö juhend (Contributing Guidelines) – KÜLV 🌱

Täname huvi eest KÜLV aia- ja taimekasvatuse planeerijasse panustamise vastu!

## Arenduskeskkonna seadistamine

### Nõuded
- **Node.js**: 22.x
- **npm**: ≥ 10.0.0 (Projekt kasutab rangelt ja ainult `npm`-i; `bun` ja `yarn` pole lubatud)

### Alustamine
```bash
# 1. Klooni repositoorium
git clone https://github.com/Sniffserver/kulv-aiaplaneerija.git
cd kulv-aiaplaneerija

# 2. Paigalda täpselt lock-failiga määratud sõltuvused
npm ci

# 3. Käivita lokaalne arendusserver (ainult selles arvutis)
npm run dev

# Valikuline: ligipääs teisest seadmest ainult usaldatud võrgus
HOST=0.0.0.0 npm run dev

# 4. Käivita testid ja tüübikontroll
npm run lint
npm run test
npm run test:coverage
```

## Koodistandardid ja reeglid

1. **TypeScript ja ranged tüübid**:
   - Väldi `any` tüüpi, kasuta `src/types/index.ts` ja `src/data/schema.ts` liideseid.
   - Enne PR-i esitamist veendu, et `npm run lint` (`tsc --noEmit`) läbib puhtalt.

2. **Andmed ja valideerimine**:
   - Uute taimesortide või ilmaregioonide lisamisel uuenda vastavaid JSON-faile kaustas `src/data/`.
   - Igal taimel peab olema määratud:
     - `spacingCm` (vahekaugus peenras sentimeetrites > 0)
     - `sunNeed` (`full` | `partial` | `shade`) ja `sunHoursMin`
     - `waterNeed` (`low` | `medium` | `high`)
     - Botaaniline nimetus ja eestikeelne nimi

3. **Uue aiaobjekti lisamine (Entity Presets & Geomeetria)**:
   - Krundiobjekti lisamisel tuleb uuendada nelja kihti:
     1. **Tüübid & Zod**: Kui lisandub uus kategooria või alamtüüp, lisa see `src/types/index.ts` enumisse `EntityCategory` ja `src/lib/validation/yardPlanSchema.ts`.
     2. **Preset definitsioon**: Lisa uus objekt faili `src/data/gardenEntityPresets.ts` koos vaikekõrguse (`defaultHeight`), mõõtmete, materjali (`materialType`), varju omaduste (`shadowCasting`, `foliageOpacity`) ja sobiva ikooniga.
     3. **2D Canvas**: Veendu, et objekt renderdub `src/components/garden/YardMasterPlanCanvas.tsx` failis (`rectangle`, `circle`, `polygon` või `polyline`).
     4. **3D Mesh**: Järgi `docs/3D_MAPPING.md` reegleid (1:1 meetriline suhe, pööramise teisendus `rotation.y = - (deg * PI / 180)`).

4. **Komponentide disain ja ligipääsetavus**:
   - Järgi ATH-sõbralikku rahulikku disaini, minimaalselt 44px puutealasid ja selget kontrastitaset.
   - Väldi horisontaalse kerimise tekkimist mobiilivaates (375px laiusel ekraanil).

5. **Testid**:
   - Uue funktsiooni või arvutuse lisamisel lisa vastav test `src/logic/*.test.ts` või `src/lib/validation/*.test.ts`.

6. **Turvanõuded uutele funktsioonidele (Security Requirements)**:
   - **CSV Eksport ja Injection kaitse**: Iga genereeritav CSV väljund (saagikus, päevik, varukoopiad) peab puhastama lahtrid funktsiooniga `sanitizeCsvCell` (`src/logic/csvExport.ts`). Sümbolitega `=`, `+`, `-`, `@`, `\t`, `\r` algavad väljad peavad saama ülakoma (`'`) eesliite, et välistada valemi- ja makrorünnakuid tabelarvutustarkvaras.
   - **Pildifailid ja Magic Bytes**: Ära kunagi usalda kliendipoolset `file.type` päist (see on võltsitav). Kõik üleslaaditavad fotod peavad läbima binaarse signatuurikontrolli `sniffImageType` (`src/logic/imageCompressor.ts`), mis aktsepteerib ainult JPEG, PNG ja WebP päiseid. **SVG on rangelt keelatud**, kuna SVG XML-puu võib sisaldada pahatahtlikke `<script>` elemente (XSS rünnakud).
   - **Impordi ja valideerimise järjekord**: Välise plaani või varukoopia importimisel tuleb alati rakendada järjekorda **`migrate → validate`** (`src/lib/import/importPlan.ts`). Andmed migreeritakse esmalt kehtiva kanoonilise versiooni tasemele (`CURRENT_SCHEMA_VERSION`) ja seejärel valideeritakse Zod skeemiga.
   - **Olekuhaldus ja Persistence**: Undo/Redo ajalugu (Zundo temporal) ei tohi sattuda IndexedDB salvestusse. Persist peab alati kasutama `partialize: (s) => ({ plan: s.plan })`.

## Pull Request protsess ja harude haldus (Release Governance)

Põhiharu (`main`) on kaitstud: otsesed tõukamised (`direct push`) põhiharusse on keelatud. Kõik muudatused peavad läbima järgmise elutsükli:

1. **Lühiealised funktsiooniharud**: Loo alati funktsiooniharu (`feat/...` või `fix/...`) värskeimast `main` harust:
   ```bash
   git checkout -b feat/minu-uuendus
   ```
2. **Korratav paigaldus**: Hoia `package-lock.json` alati sünkroonis `package.json` failiga. Enne PR avamist veendu, et puhas `npm ci` töötab tõrgeteta.
3. **Lokaalsed kvaliteedikontrollid**:
   ```bash
   npm run lint        # TypeScript tüübikontroll
   npm run test        # Vitest üksustestid
   npm run test:coverage # Testide kattuvus
   npm run build       # Tootmisversiooni ehitus
   ```
4. **Pull Request ja liitmisvärav (Merge Gate)**:
   - Ava Pull Request `main` haru suunas.
   - GitHub Actions CI käivitab 3 paralleelset kontrolli:
     - `build-and-test`: Node.js 24, puhas `npm ci`, turvaaudit, lint, testid ja build.
     - `server-test-and-docker`: Python 3.11, pytest ja serveri Docker konteineri ehitus.
     - `e2e-browser-test`: Playwright Chromium brauseritestid.
   - PR saab liita alles siis, kui kõik 3 kontrolli on rohelised ning kood on üle vaadatud.
5. **Juurutamine**: GitHub Pagesi automaatne juurutus on ajutiselt pausil, kuni repositooriumi Settings → Pages all on Actions allikana lubatud. Kui see on seadistatud, saab juurutuse käsitsi käivitada töövooga `deploy.yml`; töövoog kontrollib enne ehitamist, et valitud `main`-i commitil oleks edukas CI.

