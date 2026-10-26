# KÜLV – Aia- ja taimekasvatuse planeerija (Nordic Garden Planner)

Põhjamaine aia- ja taimekasvatuse planeerija veebirakendus (React + Vite + TypeScript). Local-first Progressive Web App (PWA) with an optional hardened Node.js API proxy.

---

## Omadused ja Funktsioonid (Features)

- **Kodu (Dashboard)**: Tänane reaalajas ilmateade (Tallinna ja Eesti koordinaatidele), öökülma hoiatused, agrotehnilised soovitused ning päeva aiatööde nimekiri.
- **Peenrad (Aia plaan)**: Interaktiivne peenarde ja kasvuhoonete planeerija, 2D ruudustiku visualiseerija, lohista-ja-aseta (drag-and-drop) taimede dokk, naabrusmõjude kontroll (head ja halvad naabrid) ning päikesetundide analüüs.
- **Taimed (Entsüklopeedia)**: Eesti kliimasse sobivate köögiviljade, ürtide ja marjade kataloog. Sordid, idanemisajad, külvisügavused ja vahekaugused. Võimalus lisada oma sorte.
- **Kalender**: Põhjamaine külvi- ja saagikalender kevadise ja sügisese öökülma kuupäevade baasil.
- **Päevik**: Aiapäevik tähelepanekute, saagikuse ja ilmamärkmete talletamiseks.
- **Ettekasvatus & Telk**: Siseruumide ja kasvuhoone mikrokliima jälgimine (temperatuur, niiskus, VPD).
- **Seaded & Värvipaletid**: Toetab palette "Päevakas aed" (Meadow), "KÜLV klassikaline", "Gruvbox" ja "Catppuccin" ning kohalikke Eesti asukohapresette.

---

## Nõuded ja Pakitihaldur (Package Manager Requirement)

**TÄHTIS / IMPORTANT**: KÜLV kasutab kanoonilise ja ainsa paketihaldurina **`npm`**-i (`package-lock.json`).
- Teised paketihaldurid (`bun`, `yarn`, `pnpm`) on repositooriumis keelatud.
- Lock-faili `bun.lock` ega `yarn.lock` ei tohi repositooriumi lisada.
- Node.js versioon: **22.x LTS** (või uuem).

---

## Kohalik arendus (Local Development Commands)

```bash
# 1. Puhas sõltuvuste paigaldus (Clean installation from package-lock.json)
npm ci

# 2. Arendusserveri käivitamine (Vite dev server)
npm run dev

# 3. Tootmisversiooni ehitamine (Production build -> dist/)
npm run build

# 4. Tootmisserveri käivitamine (Start Node.js production server)
npm run start
```

---

## Testimine ja Kontrollid (Testing Commands)

```bash
# Vitest üksustestid (Unit and component tests)
npm test

# Node.js API ja serveri testid (Server isolation, cache, security, and shutdown tests)
npm run test:server

# Testide kattuvusaruanne (Code coverage report)
npm run test:coverage

# TypeScript tüübikontroll (TypeScript typecheck)
npm run typecheck

# Koodistiili ja lindi kontroll (ESLint)
npm run lint

# Sõltuvuste turvaaudit (Dependency security audit)
npm run audit:ci

# Playwright brauseritestid (End-to-End browser tests)
npm run test:e2e
```

---

## Keskkonnamuutujate leping (Environment Variables Contract)

Kõik serveri seadistused toimuvad läbi keskkonnamuutujate. Klientrakendus (Vite SPA) ei oma ligipääsu serveri saladustele.

| Muutuja (Variable) | Tüüp / Vaikimisi | Kirjeldus / Otstarve |
| :--- | :--- | :--- |
| `PORT` | `number` (vaikimisi `3000`) | HTTP serveri kuulamisport. |
| `HOST` | `string` (vaikimisi `0.0.0.0`) | Serveri võrguliidese aadress. |
| `CORS_ORIGINS` | `string` (komaeraldusega) | Lubatud CORS päringute domeenid (nt `https://app.kulv.ee,http://localhost:3000`). |
| `OPENWEATHER_API_KEY` | `string` (valikuline) | OpenWeatherMap API võti ilmapäringute vahendamiseks (`/api/weather`). Kui puudub, tagastab API mõistliku ja ohutu lokaalse tagavaravastuse (offline/fallback). |
| `NODE_ENV` | `string` (`production` / `development`) | Tootmisrežiimi lipp. Määrab karmi CSP, HSTS päised ja staatilise `dist/` serveerimise. |

Vaata ka näidisfaili `.env.example`.

---

## Tootmisjuurutuse mudel (Production Deployment Model)

KÜLV toetab kahte tootmisjuurutuse strateegiat:

### 1. Minimalistlik staatiline PWA (Docker + Nginx)
- **Konteiner**: Mitmeetapiline Dockerfile (`node:22-alpine` build + `nginx:alpine` runtime).
- **Omadused**:
  - Töötab tavakasutaja (`nginx`) õigustes mitte-juurena (non-root unprivileged).
  - Sisaldab staatiliste failide gzip-tihendust ja vahemälu päiseid (`/assets/*`).
  - Single Page Application (SPA) marsruutimise tugi (`try_files $uri $uri/ /index.html`).
  - Integreeritud `/health` tervisekontrolli otspunkt (tagastab `200 OK`).
  - Sisseehitatud turvapäised (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`).

### 2. Node.js API ja PWA täislahendus (`server.ts`)
- **Konteiner / Node teenus**: `NODE_ENV=production tsx server.ts`
- **Omadused**:
  - Serveerib ehitatud `dist/` staatilist PWA-d.
  - Kaitseb tundlikke ilmapäringuid (`/api/weather`) kiiruspiiranguga (`express-rate-limit`: 60 päringut / 15 min IP kohta).
  - Sisaldab in-memory LRU/TTL vahemälu (kuni 500 kirjet, 10 min TTL), vältides kolmandate osapoolte API ülekoormamist.
  - Pakub `/readyz` ja `/health` valmisoleku/tervisekontrolli otspunkte orkestreerijatele (Kubernetes, Docker Swarm, Cloud Run).
  - Teostab turvalise viisaka sulgumise (graceful shutdown `SIGTERM` / `SIGINT` koos 10-sekundilise päringute lõpetamise ajapiiranguga).

---

## Turvamudel ja teadaolevad piirangud (Security Model & Limitations)

1. **Local-First andmeprivaatsus**:
   - Kõik kasutaja aiaandmed, peenrad, päevikusissekanded ja seaded salvestatakse lokaalselt seadme brauserisse (IndexedDB / Dexie.js).
   - Andmed ei leki serverisse ega kolmandatele osapooltele ilma kasutaja selgesõnalise ekspordi või sünkroonimiskäsuta.
2. **Karm Content Security Policy (CSP)**:
   - Skriptid on piiratud ainult `script-src 'self'`. Inline-skriptid on `index.html`-st eemaldatud eraldi moodulisse (`src/boot-theme.ts`).
   - Stiilide puhul lubatakse `'unsafe-inline'` ainult Tailwind/dynamiliste CSS-muutujate teematoe jaoks (vt [SECURITY.md](SECURITY.md)).
3. **Saladuste kaitse**:
   - API võtmeid ei pakita kunagi brauseri koodi sisse. Kõik välised päringud käivad läbi valikulise serveri proxy.
   - Gitleaks ja Git commit-eelsed haagid (Husky pre-commit) kontrollivad koodi repositooriumisse lisatavate saladuste vastu.
4. **Piirangud**:
   - Päikesevarjude arvutus põhineb geomeetrilisel mudelil ja eeldab lamedat maapinda ning lihtsustatud ehitiste/puude kujusid.
   - Ilmaennustus vajab internetiühendust või töötab viimati vahemällu salvestatud andmetega.
