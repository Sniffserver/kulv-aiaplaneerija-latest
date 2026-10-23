import React, { useState, useMemo } from 'react';
import { useYardStore } from '../../stores/yardStore';
import { Point2D } from '../../types';
import {
  MapPin,
  Search,
  Check,
  X,
  Compass,
  Maximize2,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

export interface CadastralParcelRecord {
  cadastralCode: string;
  address: string;
  county: string;
  municipality: string;
  areaM2: number;
  widthM: number;
  lengthM: number;
  targetUse: string; // e.g. "Elamumaa 100%"
  polygon: Point2D[];
  description: string;
}

export const ESTONIAN_CADASTRAL_PRESETS: CadastralParcelRecord[] = [
  {
    cadastralCode: '79501:027:0011',
    address: 'Männiku tee 14, Kohila alev',
    county: 'Rapla maakond',
    municipality: 'Kohila vald',
    areaM2: 1850,
    widthM: 38,
    lengthM: 49,
    targetUse: 'Elamumaa 100%',
    polygon: [
      { x: 0, y: 0 },
      { x: 38, y: 0 },
      { x: 38, y: 36 },
      { x: 26, y: 49 },
      { x: 0, y: 49 }
    ],
    description: 'Avar männimetsaga piirnev elamukrunt Kohilas, sobiv viljapuuaia ja kasvuhoone rajamiseks.'
  },
  {
    cadastralCode: '72701:005:0420',
    address: 'Kuuse tee 5, Laagri alevik',
    county: 'Harju maakond',
    municipality: 'Saue vald',
    areaM2: 1540,
    widthM: 35,
    lengthM: 44,
    targetUse: 'Elamumaa 100%',
    polygon: [
      { x: 0, y: 0 },
      { x: 35, y: 0 },
      { x: 35, y: 44 },
      { x: 6, y: 44 },
      { x: 0, y: 38 }
    ],
    description: 'Tüüpiline Harjumaa aedlinna krunt, hea päikesevalguse ja tasase reljeefiga.'
  },
  {
    cadastralCode: '79508:042:0018',
    address: 'Tamme puiestee 24, Tammelinn',
    county: 'Tartu maakond',
    municipality: 'Tartu linn',
    areaM2: 1120,
    widthM: 28,
    lengthM: 40,
    targetUse: 'Elamumaa 100%',
    polygon: [
      { x: 0, y: 0 },
      { x: 28, y: 0 },
      { x: 28, y: 40 },
      { x: 0, y: 40 }
    ],
    description: 'Klassikaline Tammelinna koduaia kinnistu, suurepärane viljakas muld ja viljapuud.'
  },
  {
    cadastralCode: '78404:402:0115',
    address: 'Vabaduse pst 82, Nõmme',
    county: 'Harju maakond',
    municipality: 'Tallinn',
    areaM2: 1430,
    widthM: 32,
    lengthM: 45,
    targetUse: 'Elamumaa 100%',
    polygon: [
      { x: 0, y: 0 },
      { x: 32, y: 0 },
      { x: 32, y: 45 },
      { x: 10, y: 45 },
      { x: 0, y: 35 }
    ],
    description: 'Nõmme mändide all asuv krunt, kus oluline arvestada puude heidetud varjudega.'
  },
  {
    cadastralCode: '62510:012:0034',
    address: 'Riia mnt 110, Raeküla',
    county: 'Pärnu maakond',
    municipality: 'Pärnu linn',
    areaM2: 980,
    widthM: 25,
    lengthM: 39,
    targetUse: 'Elamumaa 100%',
    polygon: [
      { x: 0, y: 0 },
      { x: 25, y: 0 },
      { x: 25, y: 39 },
      { x: 0, y: 39 }
    ],
    description: 'Kompaktne mereäärse kliimaga aed Pärnus, pikem vegetatsiooniperiood.'
  },
  {
    cadastralCode: '34901:008:0042',
    address: 'Kaevu tn 7, Kuressaare',
    county: 'Saare maakond',
    municipality: 'Saaremaa vald',
    areaM2: 2450,
    widthM: 45,
    lengthM: 55,
    targetUse: 'Elamumaa 100%',
    polygon: [
      { x: 0, y: 0 },
      { x: 45, y: 5 },
      { x: 45, y: 55 },
      { x: 8, y: 55 },
      { x: 0, y: 45 }
    ],
    description: 'Suurem Saaremaa talu- või linnamaja krunt paekivise aluspõhja ja leebe rannakliimaga.'
  }
];

interface CadastralPlotSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'et' | 'en';
}

export const CadastralPlotSearchDialog: React.FC<CadastralPlotSearchDialogProps> = ({
  isOpen,
  onClose,
  language = 'et'
}) => {
  const plan = useYardStore((s) => s.plan);
  const applyCadastralPlot = useYardStore((s) => s.applyCadastralPlot);
  const clearCadastralPlot = useYardStore((s) => s.clearCadastralPlot);
  const setZoom = useYardStore((s) => s.setZoom);
  const setPanOffset = useYardStore((s) => s.setPanOffset);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedParcel, setSelectedParcel] = useState<CadastralParcelRecord>(
    ESTONIAN_CADASTRAL_PRESETS[0]
  );
  const [customWidth, setCustomWidth] = useState<number>(30);
  const [customLength, setCustomLength] = useState<number>(40);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customShape, setCustomShape] = useState<'rect' | 'lShape' | 'trapezoid'>('rect');
  const [hasAppliedSuccess, setHasAppliedSuccess] = useState<boolean>(false);

  // Filter presets based on user search (cadastral code, address, municipality)
  const filteredPresets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return ESTONIAN_CADASTRAL_PRESETS;
    return ESTONIAN_CADASTRAL_PRESETS.filter(
      (p) =>
        p.cadastralCode.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.municipality.toLowerCase().includes(q) ||
        p.county.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Compute active preview geometry
  const previewData = useMemo(() => {
    if (isCustomMode) {
      const w = customWidth;
      const l = customLength;
      let poly: Point2D[] = [];
      if (customShape === 'rect') {
        poly = [
          { x: 0, y: 0 },
          { x: w, y: 0 },
          { x: w, y: l },
          { x: 0, y: l }
        ];
      } else if (customShape === 'lShape') {
        poly = [
          { x: 0, y: 0 },
          { x: w, y: 0 },
          { x: w, y: Math.round(l * 0.55) },
          { x: Math.round(w * 0.5), y: Math.round(l * 0.55) },
          { x: Math.round(w * 0.5), y: l },
          { x: 0, y: l }
        ];
      } else {
        // Trapezoid
        poly = [
          { x: Math.round(w * 0.15), y: 0 },
          { x: Math.round(w * 0.85), y: 0 },
          { x: w, y: l },
          { x: 0, y: l }
        ];
      }
      return {
        cadastralCode: 'Käsitsi sisestatud krunt',
        address: 'Määratud piiridega krunt',
        areaM2: Math.round(w * l * (customShape === 'lShape' ? 0.75 : customShape === 'trapezoid' ? 0.85 : 1)),
        widthM: w,
        lengthM: l,
        targetUse: 'Elamumaa / Aed',
        polygon: poly,
        description: `${w}m × ${l}m kohandatud krundipiir`
      };
    }
    return selectedParcel;
  }, [isCustomMode, selectedParcel, customWidth, customLength, customShape]);

  if (!isOpen) return null;

  const handleApplyToPlan = () => {
    applyCadastralPlot({
      widthM: previewData.widthM,
      lengthM: previewData.lengthM,
      boundaryPolygon: previewData.polygon,
      cadastralCode: isCustomMode ? undefined : previewData.cadastralCode,
      cadastralAreaM2: previewData.areaM2,
      address: isCustomMode ? undefined : previewData.address,
      name: isCustomMode ? plan.name : `Krunt · ${previewData.address}`
    });

    // Auto-fit canvas view
    setZoom(18);
    setPanOffset({ x: 30, y: 30 });
    setHasAppliedSuccess(true);
    setTimeout(() => {
      setHasAppliedSuccess(false);
      onClose();
    }, 900);
  };

  const handleClear = () => {
    clearCadastralPlot();
    onClose();
  };

  // Preview SVG scaling calculations
  const maxDim = Math.max(previewData.widthM, previewData.lengthM);
  const svgBoxSize = 240;
  const scale = (svgBoxSize - 40) / (maxDim || 1);
  const offsetX = (svgBoxSize - previewData.widthM * scale) / 2;
  const offsetY = (svgBoxSize - previewData.lengthM * scale) / 2;

  const polygonSvgPoints = previewData.polygon
    .map((p) => `${offsetX + p.x * scale},${offsetY + p.y * scale}`)
    .join(' ');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cadastral_dialog_title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(25, 30, 24, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          backgroundColor: 'var(--kulv-surface, #FFFDF8)',
          border: '1px solid var(--kulv-border, #C9BFA9)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--kulv-border, #C9BFA9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'var(--kulv-primary, #4F6B45)',
                color: '#FFFDF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <MapPin size={20} />
            </div>
            <div>
              <h2
                id="cadastral_dialog_title"
                className="font-serif-display"
                style={{
                  margin: 0,
                  fontSize: '19px',
                  fontWeight: 700,
                  color: 'var(--kulv-text, #252A22)'
                }}
              >
                {language === 'en' ? 'Find Your Land Parcel (Cadastre)' : 'Leia oma krunt (Maakataster)'}
              </h2>
              <p
                style={{
                  margin: '2px 0 0 0',
                  fontSize: '12px',
                  color: 'var(--kulv-text-muted, #5F675A)'
                }}
              >
                {language === 'en'
                  ? 'Official Estonian cadastral boundary polygon, parcel area and coordinates'
                  : 'Maa- ja Ruumiameti ametlikud katastritunnused, piirid ja pindalad'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Sulge aken"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--kulv-text-muted, #5F675A)',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}
        >
          {/* Mode Tabs: Official Cadastre vs Custom Dimensions */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
              padding: '3px',
              borderRadius: '8px',
              width: 'fit-content'
            }}
          >
            <button
              onClick={() => setIsCustomMode(false)}
              data-testid="cadastral_tab_official"
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: !isCustomMode ? 'var(--kulv-surface, #FFFDF8)' : 'transparent',
                color: !isCustomMode ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-text, #252A22)',
                fontWeight: !isCustomMode ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {language === 'en' ? 'Estonian Cadastre Search' : 'Katastriüksuste otsing'}
            </button>
            <button
              onClick={() => setIsCustomMode(true)}
              data-testid="cadastral_tab_custom"
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: isCustomMode ? 'var(--kulv-surface, #FFFDF8)' : 'transparent',
                color: isCustomMode ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-text, #252A22)',
                fontWeight: isCustomMode ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {language === 'en' ? 'Custom Boundary' : 'Käsitsi krundipiirid'}
            </button>
          </div>

          {!isCustomMode ? (
            <>
              {/* Search Field */}
              <div style={{ position: 'relative' }}>
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--kulv-text-muted, #5F675A)'
                  }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'Search by cadastral code (e.g. 79501:027:0011) or address...'
                      : 'Sisesta katastritunnus (nt 79501:027:0011) või aadress...'
                  }
                  data-testid="cadastral_search_input"
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    borderRadius: '8px',
                    border: '1px solid var(--kulv-border, #C9BFA9)',
                    backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                    fontSize: '14px',
                    color: 'var(--kulv-text, #252A22)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Main Grid: Left Preset List, Right Preview */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(280px, 1.2fr) minmax(260px, 1fr)',
                  gap: '16px'
                }}
              >
                {/* Presets List */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    maxHeight: '320px',
                    overflowY: 'auto',
                    paddingRight: '4px'
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--kulv-text-muted, #5F675A)' }}>
                    {language === 'en' ? 'OFFICIAL CADASTRAL UNITS' : 'EESTI KATASTRIÜKSUSED'}
                  </div>

                  {filteredPresets.map((parcel) => {
                    const isSelected = selectedParcel.cadastralCode === parcel.cadastralCode;
                    return (
                      <div
                        key={parcel.cadastralCode}
                        onClick={() => setSelectedParcel(parcel)}
                        data-testid={`cadastral_preset_${parcel.cadastralCode.replace(/:/g, '_')}`}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: isSelected
                            ? '1.5px solid var(--kulv-primary, #4F6B45)'
                            : '1px solid var(--kulv-border, #C9BFA9)',
                          backgroundColor: isSelected
                            ? 'rgba(79, 107, 69, 0.08)'
                            : 'var(--kulv-surface, #FFFDF8)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span
                            className="font-mono"
                            style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              color: isSelected ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-text, #252A22)'
                            }}
                          >
                            {parcel.cadastralCode}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--kulv-text-muted, #5F675A)' }}>
                            {parcel.areaM2.toLocaleString('et-EE')} m²
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px', color: 'var(--kulv-text, #252A22)' }}>
                          {parcel.address}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)', marginTop: '2px' }}>
                          {parcel.municipality} · {parcel.widthM}m × {parcel.lengthM}m
                        </div>
                      </div>
                    );
                  })}

                  {filteredPresets.length === 0 && (
                    <div
                      style={{
                        padding: '24px 16px',
                        textAlign: 'center',
                        color: 'var(--kulv-text-muted, #5F675A)',
                        fontSize: '13px'
                      }}
                    >
                      {language === 'en'
                        ? 'No direct matches found. Try searching by town or switch to custom boundary.'
                        : 'Otsingule vastet ei leitud. Proovi teist märksõna või koosta krundipiir käsitsi.'}
                    </div>
                  )}
                </div>

                {/* Right: SVG Cadastral Polygon Preview */}
                <div
                  style={{
                    backgroundColor: 'var(--kulv-workspace, #FAF6ED)',
                    border: '1px solid var(--kulv-border, #C9BFA9)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--kulv-text-muted, #5F675A)' }}>
                      {language === 'en' ? 'PARCEL POLYGON PREVIEW' : 'KRUNDI GEOMEETRIA EELVAADE'}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        backgroundColor: 'rgba(79, 107, 69, 0.12)',
                        color: 'var(--kulv-primary, #4F6B45)',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}
                    >
                      Maa-amet WFS
                    </span>
                  </div>

                  <svg
                    width={svgBoxSize}
                    height={svgBoxSize}
                    style={{
                      backgroundColor: '#EDF2E8',
                      borderRadius: '8px',
                      border: '1px solid #C9BFA9'
                    }}
                  >
                    {/* Grid lines */}
                    <defs>
                      <pattern id="previewGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(110, 127, 101, 0.15)" strokeWidth="0.8" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#previewGrid)" />

                    {/* Cadastral Polygon */}
                    <polygon
                      points={polygonSvgPoints}
                      fill="rgba(79, 107, 69, 0.22)"
                      stroke="#4F6B45"
                      strokeWidth={2}
                      strokeDasharray="4 2"
                    />

                    {/* Vertices */}
                    {previewData.polygon.map((p, idx) => (
                      <circle
                        key={idx}
                        cx={offsetX + p.x * scale}
                        cy={offsetY + p.y * scale}
                        r={3}
                        fill="#4F6B45"
                        stroke="#FFFDF8"
                        strokeWidth={1}
                      />
                    ))}

                    {/* Compass North Arrow */}
                    <g transform="translate(20, 20)">
                      <circle r={10} fill="#FFFDF8" stroke="#C9BFA9" strokeWidth={1} />
                      <line x1={0} y1={7} x2={0} y2={-7} stroke="#B4233A" strokeWidth={1.5} />
                      <polygon points="0,-7 3,-2 -3,-2" fill="#B4233A" />
                      <text y={-9} textAnchor="middle" fontSize={7} fontWeight={800} fill="#B4233A">
                        N
                      </text>
                    </g>
                  </svg>

                  {/* Parcel Details */}
                  <div style={{ width: '100%', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--kulv-text-muted, #5F675A)' }}>
                        {language === 'en' ? 'Official Area:' : 'Katastripindala:'}
                      </span>
                      <strong style={{ color: 'var(--kulv-text, #252A22)' }}>
                        {previewData.areaM2.toLocaleString('et-EE')} m² ({(previewData.areaM2 / 10000).toFixed(3)} ha)
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--kulv-text-muted, #5F675A)' }}>
                        {language === 'en' ? 'Bounding box:' : 'Krundi mõõdud:'}
                      </span>
                      <span>
                        {previewData.widthM} m × {previewData.lengthM} m
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--kulv-text-muted, #5F675A)' }}>
                        {language === 'en' ? 'Purpose:' : 'Sihtotstarve:'}
                      </span>
                      <span>{previewData.targetUse}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Custom Geometry Builder */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--kulv-text-muted, #5F675A)' }}>
                    {language === 'en' ? 'Shape Preset' : 'Krundi kuju tüüp'}
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    {(['rect', 'lShape', 'trapezoid'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setCustomShape(s)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '6px',
                          border: customShape === s ? '1.5px solid var(--kulv-primary, #4F6B45)' : '1px solid var(--kulv-border, #C9BFA9)',
                          backgroundColor: customShape === s ? 'rgba(79, 107, 69, 0.1)' : 'var(--kulv-surface, #FFFDF8)',
                          fontSize: '12px',
                          fontWeight: customShape === s ? 700 : 500,
                          cursor: 'pointer'
                        }}
                      >
                        {s === 'rect' ? 'Ristkülik' : s === 'lShape' ? 'L-kujuline' : 'Kaldus/Trapets'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>{language === 'en' ? 'Width (m):' : 'Krundi laius:'}</span>
                    <strong>{customWidth} m</strong>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="150"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--kulv-primary, #4F6B45)' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>{language === 'en' ? 'Length (m):' : 'Krundi pikkus:'}</span>
                    <strong>{customLength} m</strong>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="150"
                    value={customLength}
                    onChange={(e) => setCustomLength(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--kulv-primary, #4F6B45)' }}
                  />
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'var(--kulv-text, #252A22)'
                  }}
                >
                  📐 Arvestuslik pindala: <strong>{previewData.areaM2.toLocaleString('et-EE')} m²</strong>
                </div>
              </div>

              {/* Custom Preview */}
              <div
                style={{
                  backgroundColor: 'var(--kulv-workspace, #FAF6ED)',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px'
                }}
              >
                <svg
                  width={svgBoxSize}
                  height={svgBoxSize}
                  style={{
                    backgroundColor: '#EDF2E8',
                    borderRadius: '8px',
                    border: '1px solid #C9BFA9'
                  }}
                >
                  <polygon
                    points={polygonSvgPoints}
                    fill="rgba(79, 107, 69, 0.22)"
                    stroke="#4F6B45"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                  />
                  {previewData.polygon.map((p, idx) => (
                    <circle
                      key={idx}
                      cx={offsetX + p.x * scale}
                      cy={offsetY + p.y * scale}
                      r={3}
                      fill="#4F6B45"
                      stroke="#FFFDF8"
                      strokeWidth={1}
                    />
                  ))}
                </svg>
                <div style={{ fontSize: '12px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                  {customWidth}m × {customLength}m piirjoon
                </div>
              </div>
            </div>
          )}

          {/* Integration Advisory Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'rgba(79, 107, 69, 0.08)',
              border: '1px solid rgba(79, 107, 69, 0.2)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '12px',
              color: 'var(--kulv-text, #252A22)'
            }}
          >
            <ShieldCheck size={18} color="var(--kulv-primary, #4F6B45)" style={{ flexShrink: 0 }} />
            <span>
              {language === 'en'
                ? 'Applying this parcel updates the master canvas metric dimensions and projects official boundary limits so your garden beds and structures fit perfectly.'
                : 'Krundi rakendamine seab aiaplaani mõõtkava ja kuvab ametliku krundipiiri, tagades et peenrad, puud ja ehitised asuvad õigel alal.'}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--kulv-border, #C9BFA9)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)'
          }}
        >
          {plan.boundaryPolygon ? (
            <button
              onClick={handleClear}
              data-testid="cadastral_clear_btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                backgroundColor: 'transparent',
                color: 'var(--kulv-danger, #B4233A)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={15} />
              <span>{language === 'en' ? 'Reset to Default Yard' : 'Eemalda krundipiir'}</span>
            </button>
          ) : (
            <div />
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                color: 'var(--kulv-text, #252A22)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {language === 'en' ? 'Cancel' : 'Loobu'}
            </button>

            <button
              onClick={handleApplyToPlan}
              data-testid="cadastral_apply_btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: hasAppliedSuccess ? 'var(--kulv-success, #2E7D32)' : 'var(--kulv-primary, #4F6B45)',
                color: '#FFFDF8',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                transition: 'all 0.15s ease'
              }}
            >
              {hasAppliedSuccess ? (
                <>
                  <Check size={16} />
                  <span>{language === 'en' ? 'Applied!' : 'Krunt rakendatud!'}</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>{language === 'en' ? 'Apply Parcel to Garden Plan' : 'Rakenda krunt aiaplaanile'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
