import React from 'react';
import { Task } from '../types';
import { Trash2 } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onToggle: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, onDelete }) => {
  const getBadgeInfo = (category: Task['category']) => {
    switch (category) {
      case 'sow':
        return { label: 'Külvamine', color: 'var(--kulv-primary, #4F6B45)' };
      case 'water':
        return { label: 'Kastmine', color: 'var(--kulv-info, #4F6B45)' };
      case 'feed':
        return { label: 'Väetamine', color: 'var(--kulv-accent, #D97A3D)' };
      case 'plant':
        return { label: 'Istutamine', color: 'var(--kulv-primary, #4F6B45)' };
      case 'harvest':
        return { label: 'Koristus', color: 'var(--kulv-warning, #B8761B)' };
      default:
        return { label: 'Üldine', color: 'var(--kulv-text-muted, #5F675A)' };
    }
  };

  const badge = getBadgeInfo(task.category);

  return (
    <div
      data-testid={`task_card_${task.id}`}
      style={{
        backgroundColor: 'var(--kulv-surface, #FFFDF8)',
        border: '1px solid var(--kulv-border, #C9BFA9)',
        borderRadius: '12px',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: 'var(--kulv-shadow-card, 0 1px 2px rgba(0,0,0,0.05))'
      }}
    >
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        data-testid={`task_checkbox_${task.id}`}
        style={{
          width: '18px',
          height: '18px',
          accentColor: 'var(--kulv-primary, #4F6B45)',
          cursor: 'pointer'
        }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: task.completed ? 'var(--kulv-text-muted, #5F675A)' : 'var(--kulv-text, #2A2E24)',
            textDecoration: task.completed ? 'line-through' : 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {task.title}
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px', fontSize: '11px' }}>
          <span style={{ fontWeight: 600, color: badge.color }}>{badge.label}</span>
          <span aria-hidden="true" style={{ color: 'var(--kulv-text-muted, #5F675A)' }}>
            ·
          </span>
          <span style={{ color: 'var(--kulv-text-muted, #5F675A)' }}>Tähtaeg: {task.dueDate}</span>
        </div>
      </div>

      <button
        onClick={() => onDelete(task.id)}
        data-testid={`task_delete_${task.id}`}
        title="Kustuta ülesanne"
        aria-label={`Kustuta ülesanne ${task.title}`}
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
  );
};
