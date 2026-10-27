import React, { useState, useMemo } from 'react';
import { useGarden } from '../context/GardenContext';
import {
  Plus,
  Download,
  Search,
  Trash2,
  Calendar,
  Scale,
  Sprout,
  Tag,
  Sparkles,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';
import { JournalTimelineChart } from '../components/JournalTimelineChart';
import { JournalEntry } from '../types';
import { generateHarvestCSV } from '../logic/csvExport';
import { ConfirmDeleteDialog } from '../components/dialogs/ConfirmDeleteDialog';
import { EmptyState } from '../components/common/EmptyState';
import { JournalEmptyIllustration } from '../components/common/EmptyStateIllustrations';

interface JournalScreenProps {
  onOpenAddEntry: () => void;
}

export const JournalScreen: React.FC<JournalScreenProps> = ({ onOpenAddEntry }) => {
  const { journal, plants, deleteJournalEntry, exportBackup, language } = useGarden();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<string | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);

  const exportHarvestCSV = () => {
    const csvContent = generateHarvestCSV(journal);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `kulv_saagikus_${dateStamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getCategoryInfo = (category: JournalEntry['category']) => {
    switch (category) {
      case 'harvest':
        return { label: 'Saagikoristus', color: 'var(--kulv-accent, #D97A3D)' };
      case 'problem':
        return { label: 'Kahjurid & probleemid', color: 'var(--kulv-danger, #B85C33)' };
      case 'weather':
        return { label: 'Ilmamärkmed', color: 'var(--kulv-info, #176B87)' };
      default:
        return { label: 'Vaatlus', color: 'var(--kulv-primary, #4F6B45)' };
    }
  };

  const filteredJournal = useMemo(() => {
    return journal
      .filter((entry) => {
        if (selectedCategory !== 'all' && entry.category !== selectedCategory) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = entry.title.toLowerCase().includes(q);
          const matchContent = entry.content.toLowerCase().includes(q);
          const matchPlant = entry.plantName?.toLowerCase().includes(q);
          return matchTitle || matchContent || matchPlant;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [journal, selectedCategory, searchQuery]);

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'Kõik sissekanded' },
    { id: 'harvest', label: 'Saagikoristus' },
    { id: 'observation', label: 'Vaatlused' },
    { id: 'problem', label: 'Probleemid' },
    { id: 'weather', label: 'Ilm' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 20px' }}>
      {/* Top Header & Primary Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <h1
            className="font-serif-display"
            style={{
              fontSize: '26px',
              fontWeight: 700,
              color: 'var(--kulv-text, #2A2E24)',
              margin: 0,
              letterSpacing: '-0.02em'
            }}
          >
            Aiapäevik ja saagikuse ajatelg
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--kulv-text-muted, #5F675A)', margin: '4px 0 0 0' }}>
            Visualiseeri taimede kasvuprogressi, korjatud saaki kilogrammides ja fenoloogilisi vaatlusi.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={exportBackup}
            title="Ekspordi aia ja päeviku varukoopia (JSON)"
            aria-label="Ekspordi aia ja päeviku varukoopia"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--kulv-surface, #FFFDF8)',
              color: 'var(--kulv-text, #2A2E24)',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: '44px'
            }}
          >
            <Download size={15} />
            <span>Varukoopia</span>
          </button>

          <button
            onClick={exportHarvestCSV}
            data-testid="export_csv_btn"
            title="Ekspordi saagikoristuse kirjed CSV formaadis tabelarvutusse (Excel/Google Sheets)"
            aria-label="Ekspordi saagikus CSV-na"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--kulv-surface, #FFFDF8)',
              color: 'var(--kulv-accent, #D97A3D)',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: '44px'
            }}
          >
            <FileSpreadsheet size={15} />
            <span>Saagikus (CSV)</span>
          </button>

          <button
            onClick={onOpenAddEntry}
            data-testid="fab_add_journal"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: '8px',
              backgroundColor: 'var(--kulv-primary, #4F6B45)',
              color: 'white',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
              minHeight: '44px'
            }}
          >
            <Plus size={16} />
            <span>Uus sissekanne</span>
          </button>
        </div>
      </div>

      {/* Recharts Timeline Visualization (Growth & Yield) */}
      <JournalTimelineChart entries={journal} plants={plants} />

      {/* Search & Filter Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginTop: '6px'
        }}
      >
        {/* Category Tabs */}
        <div
          role="tablist"
          aria-label="Päevikukirjete filter"
          style={{
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap'
          }}
        >
          {categories.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  border: active ? '1px solid var(--kulv-primary, #4F6B45)' : '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: active ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-surface, #FFFDF8)',
                  color: active ? 'white' : 'var(--kulv-text, #2A2E24)',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 220px', maxWidth: '360px' }}>
          <Search
            size={15}
            color="var(--kulv-text-muted, #5F675A)"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            value={searchQuery}
            placeholder="Otsi sissekannetest, taimedest..."
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px 8px 32px',
              borderRadius: '8px',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              backgroundColor: 'var(--kulv-surface, #FFFDF8)',
              color: 'var(--kulv-text, #2A2E24)',
              fontSize: '13px'
            }}
          />
        </div>
      </div>

      {/* Journal Entries List */}
      {filteredJournal.length === 0 ? (
        <EmptyState
          illustration={<JournalEmptyIllustration />}
          title={
            searchQuery
              ? language === 'en'
                ? 'No notes matched your search'
                : 'Sissekandeid ei leitud'
              : language === 'en'
              ? 'Your garden notebook is empty'
              : 'Päevikus pole veel sissekandeid'
          }
          description={
            searchQuery
              ? language === 'en'
                ? `No notes match "${searchQuery}". Try another keyword.`
                : `Otsingule "${searchQuery}" vastavaid märkmeid ei leitud. Proovi teist otsisõna.`
              : language === 'en'
              ? 'Record observations, first seed sprouts, harvest yields, or greenhouse temperatures.'
              : 'Alusta oma esimest sissekannet seemnete idanemise, kasvuhoone temperatuuri või koristatud saagi kohta.'
          }
          actionLabel={
            searchQuery
              ? language === 'en'
                ? 'Clear search'
                : 'Tühjenda otsing'
              : language === 'en'
              ? 'New Journal Entry'
              : 'Lisa esimene sissekanne'
          }
          onAction={searchQuery ? () => setSearchQuery('') : onOpenAddEntry}
          testId="journal-empty-state"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredJournal.map((entry) => {
            const cat = getCategoryInfo(entry.category);
            const plantObj = plants.find((p) => p.id === entry.plantId);

            return (
              <div
                key={entry.id}
                data-testid={`journal_card_${entry.id}`}
                style={{
                  backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: 'var(--kulv-shadow-card, 0 1px 3px rgba(0,0,0,0.05))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--kulv-text, #2A2E24)' }}>
                        {entry.title}
                      </h3>

                      {/* Plant association badge */}
                      {entry.plantName && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--kulv-primary, #4F6B45)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          <span>{plantObj?.icon || '🌱'}</span>
                          <span>{entry.plantName}</span>
                        </span>
                      )}

                      {/* Yield badge */}
                      {typeof entry.yieldAmount === 'number' && entry.yieldAmount > 0 && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--kulv-accent, #D97A3D)',
                            backgroundColor: 'rgba(217, 122, 61, 0.12)',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}
                        >
                          +{entry.yieldAmount} {entry.yieldUnit || 'kg'} saak!
                        </span>
                      )}
                    </div>

                    {/* Metadata line (anti-slop clean typography) */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        color: 'var(--kulv-text-muted, #5F675A)',
                        marginTop: '4px'
                      }}
                    >
                      <span style={{ fontWeight: 700, color: cat.color }}>{cat.label}</span>
                      <span aria-hidden="true">·</span>
                      <span>{entry.date}</span>
                      {entry.growthStage && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>
                            Staadium: {entry.growthStage} ({entry.growthProgressPct || 0}%)
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => setEntryToDelete(entry)}
                    title="Kustuta sissekanne"
                    aria-label={`Kustuta sissekanne ${entry.title}`}
                    className="touch-target"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--kulv-text-muted, #5F675A)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px',
                      minWidth: '40px',
                      minHeight: '40px'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Entry content text */}
                <p style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--kulv-text, #2A2E24)', margin: 0 }}>
                  {entry.content}
                </p>

                {/* Attached Photo Preview */}
                {entry.photoUrl && (
                  <div style={{ marginTop: '4px' }}>
                    <img
                      src={entry.photoUrl}
                      alt={entry.title}
                      onClick={() => setSelectedPhotoModal(entry.photoUrl!)}
                      style={{
                        maxHeight: '140px',
                        borderRadius: '8px',
                        border: '1px solid var(--kulv-border, #C9BFA9)',
                        cursor: 'pointer',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {selectedPhotoModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedPhotoModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px'
          }}
        >
          <img
            src={selectedPhotoModal}
            alt="Suurendatud foto"
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
            }}
          />
        </div>
      )}

      {/* In-app accessible delete confirmation modal (eliminates window.confirm) */}
      <ConfirmDeleteDialog
        isOpen={!!entryToDelete}
        title="Kustuta sissekanne"
        message={`Kas oled kindel, et soovid päeviku sissekande "${entryToDelete?.title || ''}" kustutada? Seda tegevust ei saa tagasi võtta.`}
        confirmLabel="Kustuta sissekanne"
        onConfirm={() => {
          if (entryToDelete) {
            deleteJournalEntry(entryToDelete.id);
            setEntryToDelete(null);
          }
        }}
        onCancel={() => setEntryToDelete(null)}
      />
    </div>
  );
};
