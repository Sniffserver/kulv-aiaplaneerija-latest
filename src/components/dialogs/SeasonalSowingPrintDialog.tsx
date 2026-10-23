import React, { useState } from 'react';
import { Plant, GardenBed } from '../../types';
import { generateSeasonalSowingCSV } from '../../logic/csvExport';
import { ESTONIAN_REGIONS, EstonianFrostEngine } from '../../logic/estonianFrostEngine';
import { useCropRotationStore } from '../../stores/cropRotationStore';
import { Printer, Download, X, Calendar, Sprout, ShieldCheck, Snowflake, Sun } from 'lucide-react';

interface SeasonalSowingPrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plants: Plant[];
  beds: GardenBed[];
  language?: 'et' | 'en';
}

export const SeasonalSowingPrintDialog: React.FC<SeasonalSowingPrintDialogProps> = ({
  isOpen,
  onClose,
  plants,
  beds,
  language = 'et'
}) => {
  const { selectedRegion } = useCropRotationStore();
  const regionProfile = ESTONIAN_REGIONS[selectedRegion] || ESTONIAN_REGIONS.central;
  const frostData = EstonianFrostEngine.getAdjustedFrostDates(selectedRegion, 'none');

  const [activeFilter, setActiveFilter] = useState<'all' | 'indoor' | 'direct' | 'transplant'>('all');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    const csvContent = generateSeasonalSowingCSV(plants, beds, { language });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `KULV_kulvikava_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter plants based on sowing method
  const filteredPlants = plants.filter((p) => {
    if (activeFilter === 'indoor') return !!p.weeksBeforeFrostSowIndoors;
    if (activeFilter === 'direct') return !p.weeksBeforeFrostSowIndoors && !!p.optimalSowDateStart;
    if (activeFilter === 'transplant') return !!p.optimalPlantOutDate;
    return true;
  });

  // Find beds for plant
  const getBedsForPlant = (plantId: string): string => {
    const matching = beds.filter((b) =>
      b.plantings?.some((p) => p.plantId === plantId || p.plantName?.toLowerCase() === plantId.toLowerCase())
    );
    return matching.map((b) => b.name).join(', ');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-sowing-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(20, 24, 18, 0.72)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 1100
      }}
      onClick={onClose}
    >
      {/* Print-specific stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #seasonal-sowing-printable, #seasonal-sowing-printable * {
            visibility: visible !important;
          }
          #seasonal-sowing-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #FFFFFF !important;
            color: #000000 !important;
            padding: 20px !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            overflow: visible !important;
            max-height: none !important;
          }
          .no-print {
            display: none !important;
          }
          table {
            page-break-inside: auto;
            width: 100%;
            border-collapse: collapse;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          th, td {
            border: 1px solid #CCCCCC !important;
            padding: 6px 8px !important;
            font-size: 10pt !important;
          }
        }
      `}</style>

      <div
        id="seasonal-sowing-printable"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--kulv-surface, #FFFDF8)',
          borderRadius: '16px',
          border: '1px solid var(--kulv-border, #C9BFA9)',
          boxShadow: 'var(--kulv-shadow-card, 0 12px 40px rgba(0,0,0,0.25))',
          maxWidth: '1040px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header with Actions */}
        <div
          className="no-print"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--kulv-border, #C9BFA9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            backgroundColor: 'var(--kulv-surface, #FFFDF8)'
          }}
        >
          <div>
            <h2
              id="print-sowing-title"
              className="font-serif-display"
              style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}
            >
              {language === 'en' ? 'Seasonal Sowing Schedule & Field Guide' : 'Hooajaline külvikava & aiatööde kalender'}
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--kulv-text-muted, #5F675A)', marginTop: '2px' }}>
              {language === 'en'
                ? `Region: ${regionProfile.nameEn} (${regionProfile.hardinessZone}) · Frost-free: ${frostData.springFrostMMDD} – ${frostData.autumnFrostMMDD}`
                : `Agrokliima vöönd: ${regionProfile.nameEt} (${regionProfile.hardinessZone}) · Öökülmavaba periood: ${frostData.springFrostMMDD} – ${frostData.autumnFrostMMDD} (${frostData.frostFreeDays} päeva)`}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handlePrint}
              data-testid="print_sowing_schedule_btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                minHeight: '38px',
                borderRadius: '8px',
                backgroundColor: 'var(--kulv-primary, #4F6B45)',
                color: 'white',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Printer size={15} />
              <span>{language === 'en' ? 'Print / PDF' : 'Prindi / PDF'}</span>
            </button>

            <button
              onClick={handleDownloadCsv}
              data-testid="download_sowing_csv_btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                minHeight: '38px',
                borderRadius: '8px',
                backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                color: 'var(--kulv-text, #2A2E24)',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Download size={15} />
              <span>{language === 'en' ? 'Export CSV' : 'Ekspordi CSV'}</span>
            </button>

            <button
              onClick={onClose}
              aria-label={language === 'en' ? 'Close dialog' : 'Sulge aken'}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--kulv-text-muted, #5F675A)',
                padding: '6px',
                borderRadius: '8px',
                minWidth: '38px',
                minHeight: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Method filter buttons (screen only) */}
        <div
          className="no-print"
          style={{
            padding: '8px 20px',
            backgroundColor: 'var(--kulv-surface-muted, #F4EEDF)',
            borderBottom: '1px solid var(--kulv-border, #C9BFA9)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto'
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--kulv-text-muted, #5F675A)' }}>
            {language === 'en' ? 'Method filter:' : 'Külviviis:'}
          </span>
          {[
            { id: 'all', labelEt: `Kõik kultuurid (${plants.length})`, labelEn: `All Crops (${plants.length})` },
            {
              id: 'indoor',
              labelEt: `🏠 Ettekasvatus (${plants.filter((p) => p.weeksBeforeFrostSowIndoors).length})`,
              labelEn: `🏠 Indoor Sowing (${plants.filter((p) => p.weeksBeforeFrostSowIndoors).length})`
            },
            {
              id: 'direct',
              labelEt: `🌱 Otsekülv (${plants.filter((p) => !p.weeksBeforeFrostSowIndoors && p.optimalSowDateStart).length})`,
              labelEn: `🌱 Direct Sowing (${plants.filter((p) => !p.weeksBeforeFrostSowIndoors && p.optimalSowDateStart).length})`
            },
            {
              id: 'transplant',
              labelEt: `🌿 Istutus (${plants.filter((p) => p.optimalPlantOutDate).length})`,
              labelEn: `🌿 Transplanting (${plants.filter((p) => p.optimalPlantOutDate).length})`
            }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as typeof activeFilter)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: activeFilter === f.id ? 700 : 500,
                border: activeFilter === f.id ? '1px solid var(--kulv-primary, #4F6B45)' : '1px solid var(--kulv-border, #C9BFA9)',
                backgroundColor: activeFilter === f.id ? 'var(--kulv-surface, #FFFDF8)' : 'transparent',
                color: activeFilter === f.id ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-text, #2A2E24)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {language === 'en' ? f.labelEn : f.labelEt}
            </button>
          ))}
        </div>

        {/* Printable Content Body */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            flex: 1,
            backgroundColor: 'var(--kulv-surface, #FFFDF8)'
          }}
        >
          {/* Printable Header (Visible in print only) */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '2px solid #385A40', paddingBottom: '6px', marginBottom: '8px' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#385A40' }}>
                KÜLV — {language === 'en' ? 'Seasonal Sowing Calendar' : 'Hooajaline külvikava & agrotehniline juhend'}
              </div>
              <div style={{ fontSize: '11px', color: '#555555' }}>
                {language === 'en' ? 'Generated' : 'Koostatud'}: {new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'et-EE')}
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#444444', lineHeight: 1.5 }}>
              <strong>{language === 'en' ? 'Climate Region' : 'Agrokliima vöönd'}:</strong> {regionProfile.nameEt} ({regionProfile.hardinessZone}) ·{' '}
              <strong>{language === 'en' ? 'Spring Frost Target' : 'Kevadine öökülm'}:</strong> {frostData.springFrostMMDD} ·{' '}
              <strong>{language === 'en' ? 'Autumn Frost Target' : 'Sügisene öökülm'}:</strong> {frostData.autumnFrostMMDD} ·{' '}
              <strong>{language === 'en' ? 'Frost-Free Days' : 'Öökülmavaba periood'}:</strong> {frostData.frostFreeDays} {language === 'en' ? 'days' : 'päeva'}
            </div>
          </div>

          {/* Sowing Table */}
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px',
              textAlign: 'left'
            }}
          >
            <thead>
              <tr style={{ backgroundColor: 'var(--kulv-surface-muted, #F4EEDF)', borderBottom: '1.5px solid var(--kulv-border, #C9BFA9)' }}>
                <th style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                  {language === 'en' ? 'Crop & Cultivar' : 'Kultuur & Sordid'}
                </th>
                <th style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                  {language === 'en' ? 'Family' : 'Sugukond'}
                </th>
                <th style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                  {language === 'en' ? 'Indoor Sowing' : 'Ettekasvatus toas'}
                </th>
                <th style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                  {language === 'en' ? 'Direct Sowing' : 'Otsekülv avamaale'}
                </th>
                <th style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                  {language === 'en' ? 'Plant Out' : 'Istutus avamaale'}
                </th>
                <th style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                  {language === 'en' ? 'Maturity / Harvest' : 'Valmimine & Saak'}
                </th>
                <th style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                  {language === 'en' ? 'Spacing' : 'Vahe (cm)'}
                </th>
                <th style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                  {language === 'en' ? 'Bed' : 'Peenar'}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPlants.map((plant, idx) => {
                const displayName = language === 'en' && plant.nameEn ? plant.nameEn : plant.name;
                const bedAllocation = getBedsForPlant(plant.id);
                const isEven = idx % 2 === 0;

                return (
                  <tr
                    key={plant.id}
                    style={{
                      borderBottom: '1px solid var(--kulv-border, #EAE4D5)',
                      backgroundColor: isEven ? 'var(--kulv-surface, #FFFDF8)' : 'var(--kulv-surface-muted, #FAF7EE)'
                    }}
                  >
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{plant.icon}</span>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                            {displayName}
                          </div>
                          {plant.scientificName && (
                            <div style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)', fontStyle: 'italic' }}>
                              {plant.scientificName}
                            </div>
                          )}
                          {plant.varieties && plant.varieties.length > 0 && (
                            <div style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                              {plant.varieties.slice(0, 2).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--kulv-text-muted, #5F675A)', fontSize: '11px' }}>
                      {plant.family}
                    </td>
                    <td style={{ padding: '8px 10px', fontSize: '11px' }}>
                      {plant.weeksBeforeFrostSowIndoors ? (
                        <span style={{ fontWeight: 600, color: 'var(--kulv-primary, #4F6B45)' }}>
                          {language === 'en'
                            ? `${plant.weeksBeforeFrostSowIndoors} wks before frost`
                            : `${plant.weeksBeforeFrostSowIndoors} ndl enne öökülma`}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--kulv-text-muted, #5F675A)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '8px 10px', fontSize: '11px' }}>
                      {plant.optimalSowDateStart ? (
                        <span style={{ fontWeight: 600, color: 'var(--kulv-accent, #C76D3A)' }}>
                          {plant.optimalSowDateStart}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--kulv-text-muted, #5F675A)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '8px 10px', fontSize: '11px' }}>
                      {plant.optimalPlantOutDate ? (
                        <span>{plant.optimalPlantOutDate}</span>
                      ) : (
                        <span style={{ color: 'var(--kulv-text-muted, #5F675A)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '8px 10px', fontSize: '11px' }}>
                      <div>{plant.optimalHarvestDate || '—'}</div>
                      {plant.daysToMaturity && (
                        <div style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                          ~{plant.daysToMaturity} {language === 'en' ? 'days' : 'päeva'}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '8px 10px', fontSize: '11px', fontFamily: 'monospace' }}>
                      {plant.spacingCm ? `${plant.spacingCm}×${plant.rowSpacingCm || plant.spacingCm}` : '—'}
                    </td>
                    <td style={{ padding: '8px 10px', fontSize: '11px' }}>
                      {bedAllocation ? (
                        <span style={{ fontWeight: 600, color: 'var(--kulv-primary, #4F6B45)' }}>
                          {bedAllocation}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--kulv-text-muted, #5F675A)', fontStyle: 'italic' }}>
                          {language === 'en' ? 'Unassigned' : 'Määramata'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer (Screen only) */}
        <div
          className="no-print"
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--kulv-border, #C9BFA9)',
            backgroundColor: 'var(--kulv-surface-muted, #F4EEDF)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)' }}>
            {language === 'en'
              ? `Showing ${filteredPlants.length} crops · Printable field notebook layout`
              : `Kuvatakse ${filteredPlants.length} kultuuri · Väljatrükitav aiapäeviku formaat`}
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px 18px',
              minHeight: '36px',
              borderRadius: '8px',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              backgroundColor: 'var(--kulv-surface, #FFFDF8)',
              color: 'var(--kulv-text, #2A2E24)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {language === 'en' ? 'Close' : 'Sulge'}
          </button>
        </div>
      </div>
    </div>
  );
};
