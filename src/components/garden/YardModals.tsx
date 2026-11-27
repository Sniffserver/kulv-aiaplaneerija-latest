import React from 'react';
import { YardPlan } from '../../types';
import { YARD_PLAN_PRESETS, YardPlanPreset } from '../../data/gardenEntityPresets';

interface YardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'et' | 'en';
}

export const YardShortcutsModal: React.FC<YardShortcutsModalProps> = ({ isOpen, onClose, language }) => {
  if (!isOpen) return null;

  const kbdStyle: React.CSSProperties = {
    backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: 700
  };

  const shortcuts = [
    { key: 'V', et: 'Vali tööriist', en: 'Select tool' },
    { key: 'P', et: 'Polügoon-peenar', en: 'Polygon bed' },
    { key: 'R', et: 'Pööra 45°', en: 'Rotate 45°' },
    { key: 'Del / Backspace', et: 'Kustuta', en: 'Delete' },
    { key: 'Ctrl+Shift+D', et: 'Duplikeeri', en: 'Duplicate' },
    { key: 'Cmd+D', et: 'Duplikeeri (Mac)', en: 'Duplicate (Mac)' },
    { key: 'Ctrl+Z', et: 'Tagasi (Undo)', en: 'Undo' },
    { key: 'Ctrl+Y', et: 'Uuesti (Redo)', en: 'Redo' },
    { key: language === 'en' ? 'Arrow keys' : 'Noolenupud', et: 'Nihuta 0.1m', en: 'Nudge 0.1m' },
    { key: language === 'en' ? 'Shift+Arrow' : 'Shift+Nool', et: 'Nihuta 1.0m', en: 'Nudge 1.0m' },
    { key: 'Esc', et: 'Tühista valik', en: 'Clear selection' },
    { key: '?', et: 'Otseteede spikker', en: 'Shortcuts sheet' }
  ];

  return (
    <div
      data-testid="shortcuts_modal_overlay"
      role="dialog"
      aria-modal="true"
      aria-label={language === 'en' ? 'Keyboard Shortcuts' : 'Klaviatuuri kiirklahvid'}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--kulv-surface, #FFFDF8)',
          border: '1px solid var(--kulv-border, #C9BFA9)',
          borderRadius: '12px',
          padding: '20px 24px',
          maxWidth: '460px',
          width: '90%',
          boxShadow: 'var(--kulv-shadow-card, 0 8px 32px rgba(0,0,0,0.18))'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
            {language === 'en' ? 'Keyboard Shortcuts' : 'Klaviatuuri kiirklahvid'}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={language === 'en' ? 'Close' : 'Sulge'}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: 'var(--kulv-text-muted, #5F675A)',
              minWidth: '36px',
              minHeight: '36px'
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
          {shortcuts.map((s) => (
            <div key={s.key}>
              <kbd style={kbdStyle}>{s.key}</kbd> {language === 'en' ? s.en : s.et}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface YardPresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: YardPlan;
  presetToConfirm: YardPlanPreset | null;
  onRequestConfirm: (preset: YardPlanPreset | null) => void;
  onApplyPreset: (preset: YardPlanPreset, title: string) => void;
  language: 'et' | 'en';
  t: (key: string) => string;
}

export const YardPresetsModal: React.FC<YardPresetsModalProps> = ({
  isOpen,
  onClose,
  plan,
  presetToConfirm,
  onRequestConfirm,
  onApplyPreset,
  language,
  t
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('template_modal_title')}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--kulv-surface, #FFFDF8)',
          border: '1px solid var(--kulv-border, #C9BFA9)',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '760px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--kulv-shadow-card, 0 10px 36px rgba(0,0,0,0.22))',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3
              className="font-serif-display"
              style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}
            >
              {t('template_modal_title')}
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--kulv-text-muted, #5F675A)', marginTop: '2px' }}>
              {t('template_modal_desc')}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('btn_close')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: 'var(--kulv-text-muted, #5F675A)',
              padding: '4px 8px',
              minWidth: '40px',
              minHeight: '40px'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          {YARD_PLAN_PRESETS.map((preset) => {
            const title = language === 'en' ? preset.nameEn : preset.name;
            const desc = language === 'en' ? preset.descriptionEn : preset.description;
            const bedCount = preset.entities.filter((e) => e.category === 'bed').length;
            const treeCount = preset.entities.filter((e) => e.category === 'tree' || e.category === 'shrub').length;
            const structCount = preset.entities.filter((e) => e.category === 'structure').length;

            return (
              <div
                key={preset.id}
                style={{
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  borderRadius: '12px',
                  padding: '16px',
                  backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '24px' }}>{preset.icon}</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                        {title}
                      </h4>
                      <span
                        className="font-mono tabular-nums"
                        style={{ fontSize: '11px', color: 'var(--kulv-primary, #4F6B45)', fontWeight: 600 }}
                      >
                        {preset.widthM}m × {preset.lengthM}m ({preset.widthM * preset.lengthM} m²)
                      </span>
                    </div>
                  </div>

                  <p
                    style={{
                      margin: '6px 0',
                      fontSize: '12px',
                      color: 'var(--kulv-text-muted, #5F675A)',
                      lineHeight: 1.4
                    }}
                  >
                    {desc}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap',
                      fontSize: '11px',
                      marginTop: '8px',
                      color: 'var(--kulv-text, #2A2E24)'
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid var(--kulv-border, #C9BFA9)'
                      }}
                    >
                      🪵 {bedCount} {language === 'en' ? 'beds' : 'peenart'}
                    </span>
                    <span
                      style={{
                        backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid var(--kulv-border, #C9BFA9)'
                      }}
                    >
                      🌳 {treeCount} {language === 'en' ? 'trees' : 'puud/põõsast'}
                    </span>
                    <span
                      style={{
                        backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid var(--kulv-border, #C9BFA9)'
                      }}
                    >
                      🏠 {structCount} {language === 'en' ? 'structures' : 'hoonet'}
                    </span>
                  </div>
                </div>

                {presetToConfirm?.id === preset.id ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      backgroundColor: 'rgba(184, 92, 51, 0.1)',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--kulv-danger, #B85C33)'
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--kulv-danger, #B85C33)' }}>
                      {language === 'en' ? 'Replace current plan and entities?' : 'Asenda praegune plaan ja objektid?'}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => onApplyPreset(preset, title)}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: 'var(--kulv-danger, #B85C33)',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        {language === 'en' ? 'Yes, Replace' : 'Jah, asenda'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onRequestConfirm(null)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--kulv-border, #C9BFA9)',
                          backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                          color: 'var(--kulv-text, #2A2E24)',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        {language === 'en' ? 'Cancel' : 'Loobu'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (plan.entities.length === 0) {
                        onApplyPreset(preset, title);
                      } else {
                        onRequestConfirm(preset);
                      }
                    }}
                    style={{
                      padding: '8px 12px',
                      minHeight: '38px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'var(--kulv-primary, #4F6B45)',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    {t('template_apply_btn')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
