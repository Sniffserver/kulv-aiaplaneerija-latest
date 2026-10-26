# Turvapoliitika (Security Policy) – KÜLV 🌱

## Toetatud versioonid (Supported Versions)

KÜLV projekti arendatakse aktiivselt. Turvauuendusi pakutakse uusimale stabiilsele versioonile.

| Versioon | Toetatud |
| :--- | :--- |
| 1.1.x    | Jah (Yes) |
| 1.0.x    | Jah (Yes) |
| < 1.0.0  | Ei (No)   |

---

## Turvanõrkustest teavitamine (Reporting Vulnerabilities)

Kui avastate projektis turvaprobleemi (nt andmelekke, autentimise puuduse, XSS nõrkuse jms):

1. **Ärge avage avalikku GitHubi Issue'd**.
2. Saatke raport privaatselt meiliaadressile: **waveestonia@gmail.com** või esitage GitHub Security Advisory.
3. Kirjeldage raportis:
   - Nõrkuse olemust ja tehnilist mõju.
   - Samm-sammulist reprodutseerimise juhendit (PoC).
   - Mõjutatud komponente (nt veebirakendus, Node.js proxy server, Docker konteiner).
4. **Vastamise SLA ja parandustsükkel**:
   - Kinnitame teate kättesaamist 24–48 tunni jooksul.
   - Esialgne hinnang ja leevendusmeetmed 72 tunni jooksul.
   - Paranduse väljastamine ja turvaväljalaske avaldamine tagatakse kriitiliste vigade puhul 7 päeva jooksul.

---

## Turvalisuse arhitektuur ja reeglid (Security Model & Policies)

### 1. Sisuturvalisuse poliitika (Content Security Policy - CSP)
Toodangukeskkonnas (nii Node.js Helmet kui ka Nginx pöördproxy tasemel) rakendatakse ranget CSP-d:
- `default-src 'self'`
- `script-src 'self'` — **Kõik inline-skriptid on eemaldatud**. Skriptid peavad laaduma ainult kompileeritud ja hashitud moodulitena (`boot-theme.ts`, `main.tsx`).
- `style-src 'self' 'unsafe-inline'` — Lubatud ajutiselt aialõuendi ja teemade dünaamiliste CSS muutujate jaoks. Jälgitakse piletiga `KULV-CSP-2026` inline-stiilide asendamiseks CSS klassidega.
- `img-src 'self' data: blob: https:` — Lubatud kohalikud fotod, kaardimaterjal ja taimede ikoonid.
- `font-src 'self' data:` — Lubatud kohalikud fondid (Fraunces, Plus Jakarta Sans).
- `connect-src 'self' https: data: blob:` — Lubatud lokaalsed API-d ja offline teenused.
- `frame-ancestors 'self' https:` — Kaitseb klikkide kaaperdamise (clickjacking) eest, lubades iframe pesastamist ainult usaldatud keskkondades.

### 2. Päringupiirangud (Rate Limiting Policy)
Serveri `/api/weather` otspunktil on rakendatud IP-põhine päringulagi:
- **Limiit**: 30 päringut minutis kliendi IP-aadressi kohta.
- **Päised**: Standardiseeritud IETF Draft-7 päised (`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`).
- **Ületamisel**: Tagastatakse HTTP 429 Too Many Requests ja logitakse struktureeritud turvahoiatus (`rate_limit_exceeded`), ilma kliendi koordinaate või žetoone logimata.

### 3. Saladuste ja võtmete käsitlemine (Secrets & Token Handling)
- **Local-First eraldatus**: Kliendipoolne PWA ei oma ligipääsu kolmandate osapoolte API võtmetele.
- **Välistatud failid**: `.env`, `.env.local` ja `.env.production` on lisatud `.gitignore` ja `.dockerignore` failidesse.
- **Automaatne kontroll**:
  - **Gitleaks** kontrollib iga koodihaagi (`.husky/pre-commit`) ja GitHub Actions CI ehitust.
  - Toodangukeskkonna telemeetria logib sündmusi ainult struktureeritud JSON-ina ilma API võtmeid, täispikki URL-e või kasutaja täpseid koordinaate sisaldamata.

### 4. Konteinerite turvalisus (Container Security)
- Nginx konteiner töötab minimaalsel Alpine baasil.
- CI torujuhe sisaldab **Trivy** haavatavuste skaneerimist `CRITICAL` ja `HIGH` rangusastmega, blokeerides nõrkustega tõmmiste levitamise.
