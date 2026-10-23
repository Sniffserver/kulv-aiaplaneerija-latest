# Turvapoliitika (Security Policy) – KÜLV 🌱

## Toetatud versioonid

KÜLV projekti arendatakse aktiivselt. Turvauuendusi pakutakse uusimale stabiilsele versioonile.

| Versioon | Toetatud |
| -------- | -------- |
| 0.1.x    | Jah (Jah) |
| < 0.1.0  | Ei (Ei)  |

## Turvanõrkustest teavitamine

Kui avastate projektis turvaprobleemi (nt andmelekke, autentimise puuduse, XSS nõrkuse jms):

1. **Ärge avage avalikku GitHubi Issue'd**.
2. Saatke raport privaatselt meiliaadressile: **waveestonia@gmail.com**.
3. Kirjeldage raportis:
   - Nõrkuse olemust ja mõju
   - Samm-sammulist reprodutseerimise juhendit (PoC)
   - Mõjutatud komponente (nt veebirakendus, FastAPI server, Docker konteiner)
4. Vastame raportile 48 tunni jooksul ning väljastame paranduse võimalikult kiiresti.

## Turvalisuse põhimõtted

- **Lokaalne privaatsus (Local-First)**: Kogu aia plaan ja märkmed salvestatakse vaikimisi kasutaja brauseri lokaalsesse IndexedDB andmebaasi.
- **API võtmed ja saladused**: Home Assistanti pikaajaline token ja serveri `API_KEY` ei tohi sattuda brauserisse ega Git repositooriumisse. Need asuvad ainult serveri `.env` failis.
- **Sisendi puhastamine**: Kasutaja loodud aiapäeviku Markdown-tekst puhastatakse DOMPurify abil võimaliku XSS ohu välistamiseks.
- **Võrgu turvalisus**: Kui arendusserver töötab `--host=0.0.0.0`, veenduge, et kohalik WiFi võrk on usaldusväärne.
