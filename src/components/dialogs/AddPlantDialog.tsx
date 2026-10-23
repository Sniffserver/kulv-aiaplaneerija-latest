import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface AddPlantDialogProps {
  isOpen: boolean;
  onDismiss: () => void;
  onConfirm: (
    name: string,
    family: string,
    icon: string,
    daysToMaturity: number,
    spacingCm: number,
    depthCm: number,
    description: string
  ) => void;
}

export const AddPlantDialog: React.FC<AddPlantDialogProps> = ({ isOpen, onDismiss, onConfirm }) => {
  const [name, setName] = useState('');
  const [family, setFamily] = useState('Köögivili');
  const [icon, setIcon] = useState('🌱');
  const [daysStr, setDaysStr] = useState('60');
  const [spacingStr, setSpacingStr] = useState('25');
  const [depthStr, setDepthStr] = useState('1.5');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onDismiss]);

  if (!isOpen) return null;

  const emojiChoices = ['🌱', '🍅', '🥒', '🥕', '🧅', '🧄', '🥬', '🌿', '🍓', '🌸', '🌻', '🥔', '🫑', '🎃'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      const days = parseInt(daysStr, 10) || 60;
      const spacing = parseInt(spacingStr, 10) || 25;
      const depth = parseFloat(depthStr) || 1.5;
      onConfirm(name.trim(), family, icon, days, spacing, depth, description);
      setName('');
      setDescription('');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-plant-dialog-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 1000
      }}
      onClick={onDismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--kulv-surface, #FFFDF8)',
          borderRadius: '16px',
          border: '1px solid var(--kulv-border, #C9BFA9)',
          boxShadow: 'var(--kulv-shadow-card, 0 4px 16px rgba(0,0,0,0.2))',
          maxWidth: '440px',
          width: '100%',
          padding: '20px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3
            id="add-plant-dialog-title"
            className="font-serif-display"
            style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}
          >
            Lisa oma kohandatud taim
          </h3>
          <button
            onClick={onDismiss}
            aria-label="Sulge aken"
            className="touch-target"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--kulv-text-muted, #5F675A)', borderRadius: '8px' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--kulv-text, #2A2E24)' }}>
              Taime nimetus
            </label>
            <input
              type="text"
              value={name}
              placeholder="nt. Magus paprika"
              onChange={(e) => setName(e.target.value)}
              data-testid="add_custom_plant_name_input"
              required
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                color: 'var(--kulv-text, #2A2E24)'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--kulv-text, #2A2E24)' }}>
                Sugukond / kategooria
              </label>
              <input
                type="text"
                value={family}
                onChange={(e) => setFamily(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                  color: 'var(--kulv-text, #2A2E24)'
                }}
              />
            </div>
            <div style={{ width: '80px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--kulv-text, #2A2E24)' }}>
                Ikoon
              </label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                  color: 'var(--kulv-text, #2A2E24)',
                  textAlign: 'center',
                  fontSize: '18px'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)', marginBottom: '4px' }}>
              Vali ikoon:
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {emojiChoices.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setIcon(em)}
                  style={{
                    fontSize: '18px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--kulv-border, #C9BFA9)',
                    backgroundColor: icon === em ? 'var(--kulv-accent-soft, #F3D8C2)' : 'var(--kulv-surface, #FFFDF8)',
                    cursor: 'pointer'
                  }}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--kulv-text, #2A2E24)' }}>
                Saagini (päeva)
              </label>
              <input
                type="number"
                value={daysStr}
                onChange={(e) => setDaysStr(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                  color: 'var(--kulv-text, #2A2E24)'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--kulv-text, #2A2E24)' }}>
                Vahekaugus (cm)
              </label>
              <input
                type="number"
                value={spacingStr}
                onChange={(e) => setSpacingStr(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                  color: 'var(--kulv-text, #2A2E24)'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--kulv-text, #2A2E24)' }}>
              Kirjeldus ja hooldusjuhis
            </label>
            <textarea
              rows={2}
              value={description}
              placeholder="nt. Kasta regulaarselt, vajab päikeselist kasvukohta"
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                color: 'var(--kulv-text, #2A2E24)',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
            <button
              type="button"
              onClick={onDismiss}
              style={{
                minHeight: '44px',
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                backgroundColor: 'transparent',
                color: 'var(--kulv-text, #2A2E24)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px'
              }}
            >
              Loobu
            </button>
            <button
              type="submit"
              data-testid="confirm_add_custom_plant_btn"
              style={{
                minHeight: '44px',
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--kulv-primary, #4F6B45)',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px'
              }}
            >
              Salvesta taim
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
