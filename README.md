# KÜLV – Aia- ja taimekasvatuse planeerija (React SPA)

Põhjamaine aia- ja taimekasvatuse planeerija veebirakendus (React + Vite + TypeScript).

## Funktsioonid

- **Kodu (Dashboard)**: Tänane reaalajas ilmateade (Tallinna ja Eesti koordinaatidele), öökülma hoiatused, agrotehnilised soovitused ning päeva aiatööde nimekiri.
- **Peenrad (Aia plaan)**: Interaktiivne peenarde ja kasvuhoonete planeerija, 2D ruudustiku visualiseerija, interaktiivne lohista-ja-aseta (drag-and-drop) taimede dokk, naabrusmõjude kontroll (head ja halvad naabrid) ning päikesetundide analüüs.
- **Taimed (Entsüklopeedia)**: Eesti kliimasse sobivate köögiviljade, ürtide ja marjade kataloog. Sordid, idanemisajad, külvisügavused ja vahekaugused. Võimalus lisada oma sorte.
- **Kalender**: Põhjamaine külvi- ja saagikalender kevadise ja sügisese öökülma kuupäevade baasil.
- **Päevik**: Aiapäevik tähelepanekute, saagikuse ja ilmamärkmete talletamiseks.
- **Ettekasvatus & Telk**: Siseruumide ja kasvuhoone mikrokliima jälgimine (temperatuur, niiskus, VPD).
- **Seaded & Värvipaletid**: Toetab palette "Päevakas aed" (Meadow), "KÜLV klassikaline", "Gruvbox" ja "Catppuccin" ning kohalikke Eesti asukohapresette.

## Tehnoloogia

- **Raamistik**: React 18, Vite, TypeScript
- **Ikoonid**: Lucide React
- **Oleku haldus**: React Context + kohalik andmesalvestus (localStorage)
- **Stiilid**: Kohandatud teemad ja CSS-muutujad (Meadow, KÜLV, Gruvbox, Catppuccin)
- **Päikesearvutused**: Spetsiaalne põhjamaine päikesetrajektoori ja varjude mootor (Eesti laiuskraadid ~58.5°N - 59.5°N)
