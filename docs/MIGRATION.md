# KÜLV Krundiplaani Andmemigratsiooni Juhend (MIGRATION.md)

See dokument sätestab KÜLV aia- ja krundiplaanide skeemiversioonid, andmestruktuuri arengu ning automaatse migratsiooniahela reeglid.

---

## 1. Versioonide Ajalugu

### Skeemiversioon 1 (v1 — Legacy)
- **Struktuur:** Kas lihtne `GardenBed[]` massiiv või JSON objekt kujul `{ beds: GardenBed[], ... }`.
- **Piirangud:**
  - Ainult ristkülikukujulised peenrad ilma 3D kõrguste ja füüsikaliste optiliste parameetriteta.
  - Puudusid krundiobjektide kategooriad (elamu, kasvuhoone, viljapuud, hekid, teed, veesilmad).
  - Puudusid kihid (`layers`), ruumiline indeks (`rbush`), tagasivõtmise ajalugu (`zundo`) ja pehme kustutamine (`deletedAt`).

### Skeemiversioon 2 (v2 — Canonical YardPlan)
- **Täiustused:**
  - Range tüübistatud ja Zod-iga valideeritav `GardenEntity` (finite koordinaadid, positiivsed mõõtmed, `shapeType: 'rectangle' | 'circle' | 'polygon' | 'polyline'`).
  - 3D füüsikalised parameetrid: `heightM` (päikesevarjude ja 3D renderduse jaoks), `shadowCasting`, `foliageOpacity`, `materialType`.
  - Kihid: vaikimisi kihid (`structures`, `beds`, `plants`, `infrastructure`, `furniture`).

### Skeemiversioon 3 (v3 — Praegune kanooniline versioon)
- **Struktuur:**
  ```typescript
  interface YardPlan {
    id: string;
    name: string;
    schemaVersion: 3;
    units: 'metric';
    widthM: number;       // Positiivne finite number, max 500m
    lengthM: number;      // Positiivne finite number, max 500m
    northAngleDeg: number;// 0 - 360° (0° = plaanil üleval on Põhi)
    boundaryPolygon?: Point2D[];
    entities: GardenEntity[]; // max 2000 aktiivset objekti
    trash: GardenEntity[];    // Soft-delete prügikast (Variant B)
    layers: YardLayer[];
    createdAt?: string;
    updatedAt?: string;
  }
  ```
- **Täiustused:**
  - **Soft delete — Variant B (Üks kindel tõeallikas):**
    Valitud ja rakendatud on Variant B. Kustutamisel liigutatakse objekt `entities` massiivist eraldiseisvasse `trash: GardenEntity[]` massiivi. `entities` sisaldab ainult aktiivseid objekte.
    **Undo ei puutu `trash`-i:** Kui kasutaja vajutab Undo (Ctrl+Z), võetakse tagasi aktiivsete objektide muudatused, kuid prügikast säilib puutumatuna. Taastamine käib läbi kasutajaliidese prügikasti sahtli (`restoreEntity`).
  - **Geomeetria puhtus (`dedupePoints`):** Enne polügooni lihtsuse kontrolli (`isSimplePolygon`) eemaldatakse kõik punktid, mis asuvad teineteisest lähemal kui $\epsilon = 0.01$ m.

---

## 2. Automaatne Migratsiooni- ja Impordiahel (`src/lib/import/importPlan.ts`)

Kõik sissetulevad andmed (IndexedDB, JSON varukoopia import) läbivad range järjekorra:
**`migrate → validate`** (Mitte kunagi vastupidi!)

```typescript
// src/lib/import/importPlan.ts
export function importPlan(raw: unknown): YardPlan {
  const migrated = migratePlan(raw);       // 1. Viib andmed CURRENT_SCHEMA_VERSION (v3) tasemele
  return yardPlanSchema.parse(migrated);   // 2. Valideerib AINULT praegust kehtivat skeemi
}
```

### Migratsioonireeglid:
1. **Andmekadu on rangelt keelatud:** Kõik varasemad peenrad ja külvid teisendatakse `GardenEntity` objektideks (`category: 'bed'`), säilitades taimede identifikaatorid ja külviruudustiku (`bedData.plantings`).
2. **Puhtad funktsioonid:** Iga `migrateVxToVy` funktsioon on puhas (side-effect free) ning seda testitakse eraldi Vitest testiga failis `src/lib/migrations/migrations.test.ts`.
3. **Zod valideerimine:** Pärast migratsiooni peab tulemus vastama täielikult skeemile `yardPlanSchema`.

---

## 3. Turvalisus ja Andmekaitse

### A. CSV Injection (Formula Injection) Kaitse
Kõik CSV väljundid (saagikuse eksport, päeviku eksport, varukoopiad) filtreeritakse funktsiooniga `sanitizeCsvCell`:
```typescript
export function sanitizeCsvCell(value: unknown): string {
  const s = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(s)) {
    return `'${s.replace(/"/g, '""')}`;
  }
  return s.replace(/"/g, '""');
}
```
Mistahes lahter, mis algab sümbolitega `=`, `+`, `-`, `@`, tabulaator või reavahetus, saab eesliiteks `'`, mis takistab Excelis ja Google Sheetsis DDE makrode ja valemite käivitumist (nt `=cmd|'/c calc'!A1`).

### B. Piltide Magic Bytes Kontroll
Kuna `file.type` on brauseris lihtsasti võltsitav, loeb `sniffImageType` (`src/logic/imageCompressor.ts`) faili esimesed 12 baiti ja tuvastab reaalse binaarstruktuuri:
- **JPEG:** `0xFF, 0xD8, 0xFF`
- **PNG:** `0x89, 0x50, 0x4E, 0x47`
- **WebP:** `RIFF....WEBP`
- **SVG on rangelt keelatud:** SVG võib sisaldada pahatahtlikke `<script>` elemente (XSS rünnakud). Kõik failid, mis pole JPEG, PNG või WebP, lükatakse koheselt tagasi.
