# KÜLV 2D → 3D Koordinaatide Teisendus ja Ruumileping (3D_MAPPING.md)

See dokument määratleb matemaatilise ja geomeetrilise lepingu 2D SVG krundiplaanilt Three.js 3D stseenile üleminekuks.

---

## 1. Mõõtühikud ja Teljestik

KÜLV kasutab ranget **meetrilist süsteemi (1:1 skaala: 1 ühik Three.js maailmas = 1.0 meeter reaalsuses)**.

| Telg | 2D Plaan (SVG / Ekraan) | 3D Stseen (Three.js / WebGL) | Märkused |
|---|---|---|---|
| **X** | Horisontaalne (0 -> krundi laius `widthM`) | X (0 -> `widthM`) | Positiivne X suunatud paremale (Ida, kui nurk 0°) |
| **Y** | Vertikaalne ülevalt alla (0 -> `lengthM`) | **Z** (0 -> `lengthM`) | 2D Y teisendub 3D Z-teljeks (Lõuna, kui nurk 0°) |
| **Z (Kõrgus)** | Puudub (simuleeritud parameetriga `heightM`) | **Y** (0 -> `heightM`) | 3D-s tähistab Y vertikaalset kõrgust maapinnast |

### Koordinaatide teisendusvalem:
```typescript
const position3D = {
  x: entity.x + entity.width / 2,
  y: (entity.elevationM || 0) + entity.heightM / 2,
  z: entity.y + entity.length / 2
};
```

---

## 2. Pööramise Suund ja Asimuut

### 2D Pööramine:
- 2D plaanil pööratakse objekte kraadides **päripäeva (clockwise)** ümber objekti geomeetrilise keskpunkti (0° - 360°).

### 3D Pööramine (Three.js):
- Three.js kasutab paremakäelist teljestikku (Right-Handed Coordinate System), kus vaadates ülalt alla mööda positiivset Y-telge tähendab positiivne nurk **vastupäeva** pööramist.
- Seetõttu teisendatakse 2D rotatsioon 3D Y-telje pööramiseks radiaani miinusmärgiga:
```typescript
mesh.rotation.y = - (entity.rotation * Math.PI) / 180.0;
```

---

## 3. Kompass ja Põhjasuund (`northAngleDeg`)

- `northAngleDeg = 0°`: Põhi on otse üles (2D negatiivne Y / 3D negatiivne Z).
- `northAngleDeg = 90°`: Põhi on paremal (positiivne X).
- Päikese asimuut arvutatakse suhtena põhjasuunaga. Päikesekiired langevad vastasnurga suunast, tekitades maapinnale varjud vastavalt valemile:
```typescript
const shadowAngleRad = ((solarAzimuth + 180 - northAngleDeg) * Math.PI) / 180;
```

---

## 4. Kujundite Ekstrusioon ja Geomeetriad

1. **Ristkülikud (`rectangle`):**
   - Three.js: `THREE.BoxGeometry(entity.width, entity.heightM, entity.length)`.
2. **Ringid (`circle` - puud, kaevud, tiigid):**
   - Tüvi/korpus: `THREE.CylinderGeometry(radius, radius, trunkHeight, 24)`.
   - Võra (lehestik): `THREE.SphereGeometry(canopyRadius, 20, 16)`.
3. **Vabakujulised polügoonid (`polygon`):**
   - `THREE.Shape()` tippudest `customPolygon`, ekstrudeeritakse käsuga `THREE.ExtrudeGeometry(shape, { depth: entity.heightM, bevelEnabled: false })`.
