import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Image as ImageIcon, Trash2, Sprout, Scale } from 'lucide-react';
import { JournalEntry } from '../../types';
import { useGarden } from '../../context/GardenContext';
import { compressImageFile, CompressionResult } from '../../logic/imageCompressor';

interface AddJournalDialogProps {
  isOpen: boolean;
  onDismiss: () => void;
  onConfirm: (
    title: string,
    content: string,
    category: JournalEntry['category'],
    date: string,
    photoUrl?: string | null,
    plantId?: string | null,
    plantName?: string | null,
    yieldAmount?: number | null,
    yieldUnit?: 'kg' | 'g' | 'tk' | null,
    growthStage?: string | null,
    growthProgressPct?: number | null
  ) => void;
}

export const AddJournalDialog: React.FC<AddJournalDialogProps> = ({ isOpen, onDismiss, onConfirm }) => {
  const { plants, beds } = useGarden();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<JournalEntry['category']>('observation');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedPlantId, setSelectedPlantId] = useState<string>('');
  const [yieldAmount, setYieldAmount] = useState<string>('');
  const [yieldUnit, setYieldUnit] = useState<'kg' | 'g' | 'tk'>('kg');
  const [growthStage, setGrowthStage] = useState<string>('Idanemine');
  const [growthProgressPct, setGrowthProgressPct] = useState<number>(50);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [compressionStats, setCompressionStats] = useState<CompressionResult | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive unique plants list for quick selection
  const plantOptions = React.useMemo(() => {
    const list: { id: string; name: string; icon: string }[] = [];
    const seen = new Set<string>();

    // Prioritize planted crops in beds
    for (const b of beds) {
      for (const p of b.plantings) {
        if (!seen.has(p.plantId)) {
          seen.add(p.plantId);
          list.push({ id: p.plantId, name: p.plantName, icon: p.plantIcon });
        }
      }
    }
    // Then add other catalog plants
    for (const p of plants) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        list.push({ id: p.id, name: p.name, icon: p.icon });
      }
    }
    return list;
  }, [beds, plants]);

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

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);
    try {
      setIsCompressing(true);
      const res = await compressImageFile(file, 1280, 1280, 0.82);
      setPhotoUrl(res.dataUrl);
      setCompressionStats(res);
    } catch (err: any) {
      console.error('Pildi tihendamine ebaõnnestus', err);
      setPhotoError(err?.message || 'Pildi tihendamine ebaõnnestus. Lubatud on JPEG, PNG või WebP.');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(null);
    setPhotoError(null);
    setCompressionStats(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      const selectedPlant = plantOptions.find((p) => p.id === selectedPlantId);
      const numYield = yieldAmount ? parseFloat(yieldAmount.replace(',', '.')) : null;

      onConfirm(
        title.trim(),
        content.trim(),
        category,
        date,
        photoUrl,
        selectedPlant ? selectedPlant.id : null,
        selectedPlant ? selectedPlant.name : null,
        !isNaN(numYield as number) && numYield !== null ? numYield : null,
        yieldUnit,
        growthStage,
        growthProgressPct
      );

      // Reset
      setTitle('');
      setContent('');
      setSelectedPlantId('');
      setYieldAmount('');
      setPhotoUrl(null);
      setCompressionStats(null);
    }
  };

  const categories: { id: JournalEntry['category']; label: string }[] = [
    { id: 'observation', label: 'Vaatlus' },
    { id: 'harvest', label: 'Saak' },
    { id: 'problem', label: 'Probleemid' },
    { id: 'weather', label: 'Ilm' }
  ];

  const stages = ['Idanemine', 'Lehekasv', 'Õitsemine', 'Valmimine', 'Saagikoristus'];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-journal-dialog-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
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
          boxShadow: 'var(--kulv-shadow-card, 0 8px 30px rgba(0,0,0,0.25))',
          maxWidth: '480px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '20px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3
            id="add-journal-dialog-title"
            className="font-serif-display"
            style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}
          >
            Uus sissekanne päevikusse
          </h3>
          <button
            onClick={onDismiss}
            aria-label="Sulge aken"
            className="touch-target"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--kulv-text-muted, #5F675A)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '40px',
              minHeight: '40px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '4px',
                color: 'var(--kulv-text, #2A2E24)'
              }}
            >
              Pealkiri *
            </label>
            <input
              type="text"
              value={title}
              placeholder="nt. Esimene suur tomatisaak või idanemine kasvuhoones"
              onChange={(e) => setTitle(e.target.value)}
              data-testid="add_journal_title_input"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                color: 'var(--kulv-text, #2A2E24)',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '4px',
                  color: 'var(--kulv-text, #2A2E24)'
                }}
              >
                Kuupäev *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                  color: 'var(--kulv-text, #2A2E24)',
                  fontSize: '13px'
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '4px',
                  color: 'var(--kulv-text, #2A2E24)'
                }}
              >
                Seotud taim
              </label>
              <select
                value={selectedPlantId}
                onChange={(e) => {
                  setSelectedPlantId(e.target.value);
                  const p = plantOptions.find((opt) => opt.id === e.target.value);
                  if (p && !title) {
                    setTitle(`${p.name} vaatlus`);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                  color: 'var(--kulv-text, #2A2E24)',
                  fontSize: '13px'
                }}
              >
                <option value="">-- Üldine / Seostamata --</option>
                {plantOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icon} {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '6px',
                color: 'var(--kulv-text, #2A2E24)'
              }}
            >
              Kategooria:
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    border: '1px solid var(--kulv-border, #C9BFA9)',
                    backgroundColor:
                      category === cat.id ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-surface-muted, #EFE6D4)',
                    color: category === cat.id ? 'white' : 'var(--kulv-text, #2A2E24)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Fields for Harvest */}
          {category === 'harvest' && (
            <div
              style={{
                backgroundColor: 'rgba(217, 122, 61, 0.08)',
                border: '1px solid rgba(217, 122, 61, 0.3)',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--kulv-accent, #D97A3D)'
                }}
              >
                <Scale size={16} />
                <span>Saagikuse kogus ajatelje graafikule:</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  step="0.1"
                  min="0.05"
                  value={yieldAmount}
                  placeholder="nt. 2.4"
                  onChange={(e) => setYieldAmount(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--kulv-border, #C9BFA9)',
                    backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                    color: 'var(--kulv-text, #2A2E24)',
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                />
                <select
                  value={yieldUnit}
                  onChange={(e) => setYieldUnit(e.target.value as any)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--kulv-border, #C9BFA9)',
                    backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                    color: 'var(--kulv-text, #2A2E24)',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="tk">tk</option>
                </select>
              </div>
            </div>
          )}

          {/* Growth Stage progression */}
          {(category === 'observation' || category === 'harvest') && (
            <div
              style={{
                backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                borderRadius: '10px',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--kulv-text, #2A2E24)'
                  }}
                >
                  <Sprout size={15} color="var(--kulv-primary, #4F6B45)" />
                  <span>Arengustaadium:</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--kulv-primary, #4F6B45)' }}>
                  {growthProgressPct}%
                </span>
              </div>

              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {stages.map((stg, idx) => {
                  const targetPct = Math.round(((idx + 1) / stages.length) * 100);
                  const isSel = growthStage === stg;
                  return (
                    <button
                      key={stg}
                      type="button"
                      onClick={() => {
                        setGrowthStage(stg);
                        setGrowthProgressPct(targetPct);
                      }}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: isSel ? 700 : 500,
                        border: isSel
                          ? '1px solid var(--kulv-primary, #4F6B45)'
                          : '1px solid var(--kulv-border, #C9BFA9)',
                        backgroundColor: isSel ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-surface, #FFFDF8)',
                        color: isSel ? 'white' : 'var(--kulv-text, #2A2E24)',
                        cursor: 'pointer'
                      }}
                    >
                      {stg}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '4px',
                color: 'var(--kulv-text, #2A2E24)'
              }}
            >
              Sisu ja tähelepanekud *
            </label>
            <textarea
              rows={3}
              value={content}
              placeholder="Kirjelda idanemist, taime arengut, kahjureid, maitseomadusi..."
              onChange={(e) => setContent(e.target.value)}
              data-testid="add_journal_content_input"
              required
              style={{
                width: '100%',
                padding: '9px 10px',
                borderRadius: '8px',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                color: 'var(--kulv-text, #2A2E24)',
                fontFamily: 'inherit',
                fontSize: '13px'
              }}
            />
          </div>

          {/* Photo upload attachment */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '4px',
                color: 'var(--kulv-text, #2A2E24)'
              }}
            >
              Foto (valikuline)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              style={{ display: 'none' }}
            />

            {photoUrl ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={photoUrl}
                  alt="Lisatud pilt"
                  style={{
                    width: '100%',
                    maxHeight: '160px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid var(--kulv-border, #C9BFA9)'
                  }}
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    backgroundColor: 'rgba(0,0,0,0.65)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: '1px dashed var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                  color: 'var(--kulv-text, #2A2E24)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  width: '100%',
                  justifyContent: 'center'
                }}
              >
                <Camera size={16} />
                <span>{isCompressing ? 'Tihendan pilti...' : 'Lisa foto päevikukirjele'}</span>
              </button>
            )}
            {photoError && (
              <div
                role="alert"
                style={{
                  color: 'var(--kulv-danger, #D9534F)',
                  fontSize: '12px',
                  marginTop: '6px',
                  fontWeight: 500
                }}
              >
                {photoError}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
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
              data-testid="confirm_add_journal_btn"
              style={{
                minHeight: '44px',
                padding: '10px 22px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--kulv-primary, #4F6B45)',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px'
              }}
            >
              Salvesta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
