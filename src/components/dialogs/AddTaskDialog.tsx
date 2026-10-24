import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Task } from '../../types';

interface AddTaskDialogProps {
  isOpen: boolean;
  onDismiss: () => void;
  onConfirm: (title: string, dueDate: string, category: Task['category']) => void;
}

export const AddTaskDialog: React.FC<AddTaskDialogProps> = ({ isOpen, onDismiss, onConfirm }) => {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('2026-05-15');
  const [category, setCategory] = useState<Task['category']>('sow');

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
    if (title.trim()) {
      onConfirm(title.trim(), dueDate, category);
      setTitle('');
    }
  };

  const categories: { id: Task['category']; label: string }[] = [
    { id: 'sow', label: 'Külv' },
    { id: 'water', label: 'Kastmine' },
    { id: 'plant', label: 'Istutus' },
    { id: 'feed', label: 'Väetamine' },
    { id: 'harvest', label: 'Koristus' }
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-task-dialog-title"
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
          maxWidth: '420px',
          width: '100%',
          padding: '20px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3
            id="add-task-dialog-title"
            className="font-serif-display"
            style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}
          >
            Lisa aiatöö / ülesanne
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
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
              Ülesande kirjeldus
            </label>
            <input
              type="text"
              value={title}
              placeholder="nt. Kasta kasvuhoonet"
              onChange={(e) => setTitle(e.target.value)}
              data-testid="add_task_title_input"
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
              Tähtaeg (AAAA-KK-PP)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
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
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: '1px solid var(--kulv-border, #C9BFA9)',
                    backgroundColor:
                      category === cat.id ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-surface-muted, #EFE6D4)',
                    color: category === cat.id ? 'white' : 'var(--kulv-text, #2A2E24)',
                    cursor: 'pointer'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
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
              data-testid="confirm_add_task_btn"
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
              Salvesta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
