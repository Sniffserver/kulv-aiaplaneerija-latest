import React, { useRef } from 'react';
import { useYardStore } from '../../stores/yardStore';
import { useCropRotationStore } from '../../stores/cropRotationStore';
import { useGarden } from '../../context/GardenContext';
import { BOTANICAL_FAMILY_DETAILS } from '../../logic/cropRotationEngine';
import {
  Printer,
  X,
  MapPin,
  Calendar,
  Compass,
  FileText,
  CheckCircle2,
  Info,
  ShieldCheck,
  Leaf
} from 'lucide-react';

interface GardenBinderPrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'et' | 'en';
}

export const GardenBinderPrintDialog: React.FC<GardenBinderPrintDialogProps> = ({
  isOpen,
  onClose,
  language = 'et'
}) => {
  const plan = useYardStore((s) => s.plan);
  const { beds, plants } = useGarden();
  const { successionSlots, selectedYear, selectedRegion } = useCropRotationStore();
  const printContentRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Calculate total cultivated bed area
  const totalCultivatedAreaM2 = beds.reduce((acc, b) => acc + (b.width * b.length), 0);
  const activeEntities = (plan.entities || []).filter((e) => !e.deletedAt);

  // Group succession slots by bed
  const slotsByBed = beds.map((b) => {
    const bSlots = successionSlots.filter((s) => s.bedId === b.id && s.year === (selectedYear || 2026));
    return {
      bed: b,
      slots: bSlots
    };
  });

  // Calculate unique plant species in the garden
  const plannedPlantIds = new Set<string>();
  successionSlots.forEach((s) => plannedPlantIds.add(s.plantId));
  beds.forEach((b) => b.plantings.forEach((p) => plannedPlantIds.add(p.plantId)));

  const activePlants = plants.filter((p) => plannedPlantIds.has(p.id));

  // Date formatted
  const printDate = new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'et-EE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // SVG Scaled Plan for Print
  const maxDim = Math.max(plan.widthM, plan.lengthM, 20);
  const svgPrintW = 520;
  const scale = (svgPrintW - 40) / maxDim;
  const yardPxW = plan.widthM * scale;
  const yardPxL = plan.lengthM * scale;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="garden_binder_dialog_title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(25, 30, 24, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #garden_binder_printable, #garden_binder_printable * {
            visibility: visible !important;
          }
          #garden_binder_printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: #1a1a1a !important;
          }
          .binder-page {
            page-break-after: always !important;
            break-after: page !important;
            min-height: 98vh !important;
            padding: 24mm 18mm !important;
            box-sizing: border-box !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 12px 48px rgba(0,0,0,0.25)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Top Control Bar (Hidden during print) */}
        <div
          className="no-print"
          style={{
            padding: '14px 20px',
            backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
            borderBottom: '1px solid var(--kulv-border, #C9BFA9)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="var(--kulv-primary, #4F6B45)" />
            <h2
              id="garden_binder_dialog_title"
              className="font-serif-display"
              style={{
                margin: 0,
                fontSize: '17px',
                fontWeight: 700,
                color: 'var(--kulv-text, #252A22)'
              }}
            >
              {language === 'en'
                ? 'Printable High-Resolution Garden Binder'
                : 'Trükitav aia täisköide ja dokumentatsioon'}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handlePrint}
              data-testid="binder_print_action_btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--kulv-primary, #4F6B45)',
                color: '#FFFDF8',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
              }}
            >
              <Printer size={16} />
              <span>{language === 'en' ? 'Print / Export PDF' : 'Trüki / Salvesta PDF'}</span>
            </button>

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
                alignItems: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div
          ref={printContentRef}
          id="garden_binder_printable"
          style={{
            overflowY: 'auto',
            padding: '24px 32px',
            backgroundColor: '#FAFAF8',
            color: '#22251F',
            fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
          }}
        >
          {/* ================= PAGE 1: COVER & CADASTRAL DOSSIER ================= */}
          <section className="binder-page" style={{ marginBottom: '40px' }}>
            {/* Header Header */}
            <div style={{ borderBottom: '2px solid #2B3A26', paddingBottom: '16px', marginBottom: '24px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#4F6B45',
                  marginBottom: '4px'
                }}
              >
                KÜLV · PÕHJAMAINE AIAPLANEERIJA · {selectedYear || 2026}
              </div>
              <h1
                className="font-serif-display"
                style={{
                  fontSize: '28px',
                  margin: 0,
                  fontWeight: 800,
                  color: '#1C2419'
                }}
              >
                {plan.name || 'Minu aia krundiplaan ja viljavahelduse köide'}
              </h1>
              <div style={{ fontSize: '13px', color: '#555C4F', marginTop: '6px' }}>
                Dokument koostatud: <strong>{printDate}</strong> · Piirkond:{' '}
                <strong>{selectedRegion === 'north_coast' ? 'Põhjarannik' : selectedRegion === 'islands' ? 'Saared' : selectedRegion === 'southeast' ? 'Kagu-Eesti' : 'Kesk-Eesti'}</strong>
              </div>
            </div>

            {/* Cadastral & Metric Dossier Box */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                backgroundColor: '#F3EFE6',
                border: '1px solid #C9BFA9',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '24px'
              }}
            >
              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: '#6A7264' }}>
                  Katastritunnus
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#2B3A26' }}>
                  {plan.cadastralCode || 'Määramata'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: '#6A7264' }}>
                  Ametlik Pindala
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#2B3A26' }}>
                  {plan.cadastralAreaM2 ? `${plan.cadastralAreaM2.toLocaleString('et-EE')} m²` : `${plan.widthM * plan.lengthM} m²`}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: '#6A7264' }}>
                  Krundi mõõtmed
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#2B3A26' }}>
                  {plan.widthM} m × {plan.lengthM} m
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: '#6A7264' }}>
                  Haritav peenrapind
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#2B3A26' }}>
                  {totalCultivatedAreaM2.toFixed(1)} m² ({beds.length} tk)
                </div>
              </div>
            </div>

            {/* SVG Parcel Map Graphic */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D5CEBE',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '24px'
              }}
            >
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#555C4F' }}>
                  KRUNDIPLAAN & OBJEKTIDE PAIGUTUS
                </span>
                <span style={{ fontSize: '11px', color: '#555C4F' }}>
                  Põhi: {plan.northAngleDeg || 0}°
                </span>
              </div>

              <svg
                width={svgPrintW}
                height={Math.round(yardPxL + 30)}
                style={{
                  backgroundColor: '#EDF2E8',
                  border: '1px solid #A8B89F',
                  borderRadius: '6px'
                }}
              >
                {/* Cadastral Polygon */}
                {plan.boundaryPolygon && plan.boundaryPolygon.length >= 3 && (
                  <polygon
                    points={plan.boundaryPolygon.map((p) => `${p.x * scale},${p.y * scale}`).join(' ')}
                    fill="rgba(79, 107, 69, 0.15)"
                    stroke="#385A40"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                  />
                )}

                {/* Entities */}
                {activeEntities.map((e) => (
                  <g
                    key={e.id}
                    transform={`translate(${e.x * scale}, ${e.y * scale}) rotate(${e.rotation || 0}, ${(e.width * scale) / 2}, ${(e.length * scale) / 2})`}
                  >
                    <rect
                      width={e.width * scale}
                      height={e.length * scale}
                      fill={e.category === 'bed' ? '#A3B899' : '#D1C7B7'}
                      stroke="#4F6B45"
                      strokeWidth={1}
                      rx={2}
                    />
                    <text
                      x={(e.width * scale) / 2}
                      y={(e.length * scale) / 2 + 3}
                      fontSize={Math.max(8, Math.min(12, e.width * scale * 0.4))}
                      textAnchor="middle"
                      fill="#252A22"
                      fontWeight={700}
                    >
                      {e.name}
                    </text>
                  </g>
                ))}

                {/* Compass Rose */}
                <g transform={`translate(${svgPrintW - 25}, 25)`}>
                  <circle r={14} fill="#FFFFFF" stroke="#C9BFA9" strokeWidth={1} />
                  <line x1={0} y1={10} x2={0} y2={-10} stroke="#B4233A" strokeWidth={1.5} />
                  <polygon points="0,-10 3,-4 -3,-4" fill="#B4233A" />
                  <text y={-11} textAnchor="middle" fontSize={7} fontWeight={800} fill="#B4233A">
                    N
                  </text>
                </g>
              </svg>

              <div style={{ marginTop: '8px', fontSize: '11px', color: '#6A7264' }}>
                Mõõtkava: 1m ≈ {Math.round(scale)}px · Kaardil on kujutatud ametlik krundipiir ja aiaplaneering
              </div>
            </div>
          </section>

          {/* ================= PAGE 2: BED INVENTORY & SUCCESSION ================= */}
          <section className="binder-page" style={{ marginBottom: '40px' }}>
            <div style={{ borderBottom: '2px solid #2B3A26', paddingBottom: '12px', marginBottom: '20px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4F6B45' }}>
                LISA 1 · TÄIELIK INVENTUUR
              </div>
              <h2 className="font-serif-display" style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1C2419' }}>
                Peenarde detailpass ja järjestikülvid ({selectedYear || 2026})
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {slotsByBed.map(({ bed, slots }) => (
                <div
                  key={bed.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #D5CEBE',
                    borderRadius: '8px',
                    padding: '12px 16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid #EFEAE0', paddingBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '15px' }}>
                        {bed.type === 'greenhouse' ? '🏡' : bed.type === 'pot' ? '🪴' : '🪵'}
                      </span>
                      <strong style={{ fontSize: '14px', color: '#252A22' }}>{bed.name}</strong>
                      <span style={{ fontSize: '12px', color: '#6A7264' }}>
                        ({bed.width}m × {bed.length}m · {bed.coverType === 'greenhouse' ? 'Kasvuhoone' : 'Avamaa'})
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#4F6B45' }}>
                      Pindala: {(bed.width * bed.length).toFixed(1)} m²
                    </span>
                  </div>

                  {slots.length > 0 ? (
                    <table style={{ width: '100%', fontSize: '12px', marginTop: '8px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ color: '#6A7264', textAlign: 'left', borderBottom: '1px solid #EAE5D9' }}>
                          <th style={{ padding: '4px 6px' }}>Faas</th>
                          <th style={{ padding: '4px 6px' }}>Kultuur ja sort</th>
                          <th style={{ padding: '4px 6px' }}>Sugukond</th>
                          <th style={{ padding: '4px 6px' }}>Külv (DOY)</th>
                          <th style={{ padding: '4px 6px' }}>Koristus</th>
                        </tr>
                      </thead>
                      <tbody>
                        {slots.map((s) => {
                          const fam = BOTANICAL_FAMILY_DETAILS[s.botanicalFamily];
                          return (
                            <tr key={s.id} style={{ borderBottom: '1px dotted #EAE5D9' }}>
                              <td style={{ padding: '4px 6px', fontWeight: 600 }}>
                                {s.seasonSlot === 'early_spring' ? 'Kevad' : s.seasonSlot === 'autumn_late' ? 'Sügis' : 'Põhikultuur'}
                              </td>
                              <td style={{ padding: '4px 6px' }}>
                                <strong>{s.plantName}</strong> {s.variety && `(${s.variety})`}
                              </td>
                              <td style={{ padding: '4px 6px', color: '#555C4F' }}>
                                {fam ? fam.nameEt : s.botanicalFamily}
                              </td>
                              <td style={{ padding: '4px 6px' }}>{s.sowDate}</td>
                              <td style={{ padding: '4px 6px' }}>{s.harvestDate}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#888F82', fontStyle: 'italic', marginTop: '6px' }}>
                      Peenrale pole veel lisatud aktiivseid järjestikülvi faase.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ================= PAGE 3: COMPANION PLANTING MATRIX ================= */}
          <section className="binder-page" style={{ marginBottom: '40px' }}>
            <div style={{ borderBottom: '2px solid #2B3A26', paddingBottom: '12px', marginBottom: '20px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4F6B45' }}>
                LISA 2 · BIOLOOGILINE KOOSTÖÖ
              </div>
              <h2 className="font-serif-display" style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1C2419' }}>
                Seltsilistaimede maatriks ja viljavahelduse reeglid
              </h2>
            </div>

            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', backgroundColor: '#FFFFFF', border: '1px solid #D5CEBE', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ backgroundColor: '#F3EFE6', color: '#2B3A26', textAlign: 'left', borderBottom: '1.5px solid #C9BFA9' }}>
                  <th style={{ padding: '8px 10px' }}>Taim / Kultuur</th>
                  <th style={{ padding: '8px 10px' }}>Sugukond</th>
                  <th style={{ padding: '8px 10px', color: '#276749' }}>Head seltsilised (Soodustavad kasvu)</th>
                  <th style={{ padding: '8px 10px', color: '#B4233A' }}>Ebasoovitavad naabrid (Väldi!)</th>
                </tr>
              </thead>
              <tbody>
                {activePlants.slice(0, 14).map((p) => {
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #EAE5D9' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 700 }}>
                        {p.icon || '🌱'} {p.name}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#555C4F' }}>
                        {p.family}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#276749' }}>
                        {p.companionsGood && p.companionsGood.length > 0 ? p.companionsGood.join(', ') : 'Sobib enamikuga'}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#B4233A' }}>
                        {p.companionsBad && p.companionsBad.length > 0 ? p.companionsBad.join(', ') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Rotation principles callout */}
            <div
              style={{
                marginTop: '20px',
                padding: '14px 18px',
                backgroundColor: '#F3EFE6',
                border: '1px solid #C9BFA9',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#252A22'
              }}
            >
              <strong style={{ display: 'block', marginBottom: '4px', color: '#2B3A26' }}>
                4-aastase viljavahelduse kuldreeglid:
              </strong>
              <span>
                1. Ära istuta maavitsalisi (tomat, kartul, paprika) samale peenrale varem kui 3-4 aasta pärast. <br />
                2. Ristõieliste (kapsad, redis, rukola) vaheaeg peab nuutrite vältimiseks olema vähemalt 4 aastat. <br />
                3. Liblikõielised (hernes, aeduba) rikastavad mulda loodusliku lämmastikuga enne toitainerikkaid kultuure.
              </span>
            </div>
          </section>

          {/* ================= PAGE 4: SOWING & HARVEST CALENDAR ================= */}
          <section className="binder-page">
            <div style={{ borderBottom: '2px solid #2B3A26', paddingBottom: '12px', marginBottom: '20px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4F6B45' }}>
                LISA 3 · TEGEVUSKAVA
              </div>
              <h2 className="font-serif-display" style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1C2419' }}>
                Hooajaline külvi- ja koristuskalender
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
              {[
                { month: 'Märts', task: 'Külva toas ette: tomat, paprika, tšilli, porrulauk. Kontrolli seemnete idanevust.' },
                { month: 'Aprill', task: 'Külva kasvuhoonesse: redis, spinat, till, salat. Pane kartulid valguse kätte idanema.' },
                { month: 'Mai', task: 'Külva avamaale: porgand, peet, hernes, sibul. Mai lõpus istuta karastatud taimed kasvuhoonesse.' },
                { month: 'Juuni', task: 'Pärast öökülmaohu möödumist (ca 10. juuni) istuta avamaale kõrvitsad, kurgid ja oad. Rohi ja multši.' },
                { month: 'Juuli', task: 'Varajase saagi koristus (küüslauk, varajane kartul). Külva teine ring: redis, aasia salatid, sügisspinat.' },
                { month: 'August - September', task: 'Põhisaagi koristus (tomat, sibul, porgand, peet). Külva tühjenevatele peenardele haljasväetis (keerispea, rukis).' }
              ].map((m) => (
                <div
                  key={m.month}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #D5CEBE',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '12px'
                  }}
                >
                  <strong style={{ display: 'block', fontSize: '14px', color: '#2B3A26', marginBottom: '4px' }}>
                    {m.month}
                  </strong>
                  <span style={{ color: '#555C4F' }}>{m.task}</span>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: '30px',
                textAlign: 'center',
                fontSize: '11px',
                color: '#888F82',
                borderTop: '1px solid #EAE5D9',
                paddingTop: '16px'
              }}
            >
              KÜLV · Põhjamaine aiaplaneerimise süsteem · Väljatrükk kehtib hooajaks {selectedYear || 2026}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
