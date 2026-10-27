import React, { useState } from 'react';

// Uploaded high-fidelity botanical illustrations
const YARD_EMPTY_IMG = './assets/aistudio/t_hi-aiaplaan_255327f6.jpeg';
const PLANTS_EMPTY_IMG = './assets/aistudio/minimalist-empty-state-illustration-for-the_plant-catalog-screen_fc45c689.jpeg';
const CALENDAR_EMPTY_IMG = './assets/aistudio/minimalistlik-empty-state-illustratioon-kalender_d9b9513f.jpeg';
const JOURNAL_EMPTY_IMG = './assets/aistudio/empty-state-p_evik_600dc83a.jpeg';

interface BotanicalImageProps {
  src: string;
  fallback: React.ReactNode;
  alt?: string;
}

function BotanicalArtwork({ src, fallback, alt = '' }: BotanicalImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <>{fallback}</>;
  }

  return (
    <div className="flex items-center justify-center p-2">
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className="max-h-[140px] w-auto max-w-[200px] object-contain rounded-xl shadow-xs border border-[var(--kulv-border,#C9BFA9)] bg-[var(--kulv-surface,#FFFDF8)] transition-transform hover:scale-[1.02]"
      />
    </div>
  );
}

export function GardenEmptyIllustration() {
  const svgFallback = (
    <svg viewBox="0 0 240 160" role="presentation" aria-hidden="true" className="w-full h-full max-h-[140px]">
      <rect x="60" y="80" width="120" height="48" rx="12" fill="var(--kulv-surface-muted)" />
      <rect x="72" y="92" width="96" height="24" rx="6" fill="#79634F" />
      <path d="M120 92V76" stroke="var(--kulv-primary)" strokeWidth="3" strokeLinecap="round" />
      <path d="M120 76c-8-4-14-2-16 2 5 3 11 2 16-2Z" fill="var(--kulv-primary)" />
      <path d="M120 76c8-4 14-2 16 2-5 3-11 2-16-2Z" fill="var(--kulv-primary)" />
      <circle cx="96" cy="112" r="4" fill="var(--kulv-accent)" />
      <circle cx="144" cy="112" r="4" fill="var(--kulv-accent)" />
    </svg>
  );

  return <BotanicalArtwork src={YARD_EMPTY_IMG} fallback={svgFallback} alt="" />;
}

export function PlantsEmptyIllustration() {
  const svgFallback = (
    <svg viewBox="0 0 240 160" role="presentation" aria-hidden="true" className="w-full h-full max-h-[140px]">
      <rect x="70" y="80" width="100" height="40" rx="12" fill="var(--kulv-surface-muted)" />
      <rect x="82" y="90" width="24" height="20" rx="6" fill="var(--kulv-bg)" />
      <rect x="112" y="90" width="24" height="20" rx="6" fill="var(--kulv-bg)" />
      <rect x="142" y="90" width="24" height="20" rx="6" fill="var(--kulv-bg)" />
      <path d="M94 90V78" stroke="var(--kulv-primary)" strokeWidth="3" strokeLinecap="round" />
      <path d="M94 78c-6-3-10-1-11 2 3 2 8 1 11-2Z" fill="var(--kulv-primary)" />
      <circle cx="166" cy="72" r="5" fill="var(--kulv-accent)" />
    </svg>
  );

  return <BotanicalArtwork src={PLANTS_EMPTY_IMG} fallback={svgFallback} alt="" />;
}

export function CalendarEmptyIllustration() {
  const svgFallback = (
    <svg viewBox="0 0 240 160" role="presentation" aria-hidden="true" className="w-full h-full max-h-[140px]">
      <rect x="70" y="50" width="100" height="70" rx="14" fill="var(--kulv-surface)" />
      <rect x="70" y="50" width="100" height="20" rx="14" fill="var(--kulv-primary-soft)" />
      {[0, 1, 2, 3].map((row) =>
        [0, 1, 2, 3].map((column) => (
          <rect
            key={`${row}-${column}`}
            x={82 + column * 22}
            y={80 + row * 10}
            width="16"
            height="6"
            rx="3"
            fill="var(--kulv-surface-muted)"
          />
        ))
      )}
      <circle cx="170" cy="90" r="6" fill="var(--kulv-accent)" />
    </svg>
  );

  return <BotanicalArtwork src={CALENDAR_EMPTY_IMG} fallback={svgFallback} alt="" />;
}

export function JournalEmptyIllustration() {
  const svgFallback = (
    <svg viewBox="0 0 240 160" role="presentation" aria-hidden="true" className="w-full h-full max-h-[140px]">
      <rect x="75" y="55" width="90" height="60" rx="12" fill="var(--kulv-surface)" />
      <path d="M120 55v60" stroke="var(--kulv-border)" strokeWidth="2" />
      <path
        d="M90 75h20M90 90h20M130 75h20M130 90h20"
        stroke="var(--kulv-border)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M170 90c10-10 20-8 22 0-8 5-17 4-22 0Z" fill="var(--kulv-primary)" />
      <rect x="158" y="55" width="8" height="24" rx="4" fill="var(--kulv-accent)" />
    </svg>
  );

  return <BotanicalArtwork src={JOURNAL_EMPTY_IMG} fallback={svgFallback} alt="" />;
}

export function OfflineIllustration() {
  return (
    <svg viewBox="0 0 240 160" role="presentation" aria-hidden="true" className="w-full h-full max-h-[140px]">
      <path
        d="M90 50c0-12 10-22 22-22s22 10 22 22"
        stroke="var(--kulv-border)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M120 100V70" stroke="var(--kulv-primary)" strokeWidth="3" strokeLinecap="round" />
      <path d="M120 70c-9-5-16-2-18 3 6 4 13 2 18-3Z" fill="var(--kulv-primary)" />
      <path d="M120 70c9-5 16-2 18 3-6 4-13 2-18-3Z" fill="var(--kulv-primary)" />
      <rect x="100" y="100" width="40" height="28" rx="10" fill="var(--kulv-surface-muted)" />
      <rect x="150" y="88" width="36" height="30" rx="8" fill="var(--kulv-surface)" />
      <rect x="158" y="84" width="6" height="18" rx="3" fill="var(--kulv-accent)" />
    </svg>
  );
}
