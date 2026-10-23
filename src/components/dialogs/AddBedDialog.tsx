import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface AddBedDialogProps {
  isOpen: boolean;
  onDismiss: () => void;
  onConfirm: (
    name: string,
    type: 'raisedBed' | 'inGroundBed' | 'greenhouse' | 'pot',
    width: number,
    length: number,
    coverType: 'none' | 'greenhouse' | 'fleece' | 'coldFrame',
    notes: string
  ) => void;
}

export const AddBedDialog: React.FC<AddBedDialogProps> = ({ isOpen, onDismiss, onConfirm }) => {
  const [name, setName] = useState('Peenar 1');
  const [type, setType] = useState<'raisedBed' | 'inGroundBed' | 'greenhouse' | 'pot'>('raisedBed');
  const [widthStr, setWidthStr] = useState('1.2');
  const [lengthStr, setLengthStr] = useState('3.0');
  const [coverType, setCoverType] = useState<'none' | 'greenhouse' | 'fleece' | 'coldFrame'>('none');
  const [notes, setNotes] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(widthStr) || 1.2;
    const l = parseFloat(lengthStr) || 3.0;
    onConfirm(name, type, w, l, coverType, notes);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-bed-dialog-title"
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
            id="add-bed-dialog-title"
            className="font-serif-display"
            style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}
          >
            Lisa uus peenar
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
              Peenra nimetus
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="add_bed_name_input"
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
                Laius (m)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.3"
                max="10"
                value={widthStr}
                onChange={(e) => setWidthStr(e.target.value)}
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
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--kulv-text, #2A2E24)' }}>
                Pikkus (m)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="20"
                value={lengthStr}
                onChange={(e) => setLengthStr(e.target.value)}
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
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--kulv-text, #2A2E24)' }}>
              Tüüp / kate
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setCoverType('none');
                  setType('raisedBed');
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: coverType === 'none' ? 'var(--kulv-primary, #4F6B45)' : 'transparent',
                  color: coverType === 'none' ? 'white' : 'var(--kulv-text, #2A2E24)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                Avamaa / Kõrgpeenar
              </button>
              <button
                type="button"
                onClick={() => {
                  setCoverType('greenhouse');
                  setType('greenhouse');
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: coverType === 'greenhouse' ? 'var(--kulv-primary, #4F6B45)' : 'transparent',
                  color: coverType === 'greenhouse' ? 'white' : 'var(--kulv-text, #2A2E24)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                Kasvuhoone
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--kulv-text, #2A2E24)' }}>
              Märkmed mullast vms.
            </label>
            <input
              type="text"
              value={notes}
              placeholder="nt. Kompostimuld, orgaaniline väetis"
              onChange={(e) => setNotes(e.target.value)}
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
              data-testid="confirm_add_bed_btn"
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
              Lisa peenar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
