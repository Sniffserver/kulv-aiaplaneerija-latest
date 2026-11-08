import React, { useState } from 'react';

export interface BotanicalImageProps {
  src: string;
  alt?: string;
  aspectRatio?: '16/9' | '4/3' | '1/1' | '21/9' | '3/2' | 'auto';
  className?: string;
  imageClassName?: string;
  fallback?: React.ReactNode;
  objectFit?: 'cover' | 'contain';
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  onClick?: () => void;
}

const ASPECT_RATIO_CLASSES: Record<string, string> = {
  '16/9': 'aspect-[16/9]',
  '4/3': 'aspect-[4/3]',
  '1/1': 'aspect-square',
  '21/9': 'aspect-[21/9]',
  '3/2': 'aspect-[3/2]',
  'auto': ''
};

export const BotanicalImage: React.FC<BotanicalImageProps> = ({
  src,
  alt = '',
  aspectRatio = '4/3',
  className = '',
  imageClassName = '',
  fallback,
  objectFit = 'cover',
  loading = 'lazy',
  decoding = 'async',
  onClick
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const aspectClass = ASPECT_RATIO_CLASSES[aspectRatio] || '';
  const fitClass = objectFit === 'contain' ? 'object-contain' : 'object-cover';

  if (hasError) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div
        className={`w-full ${aspectClass} rounded-xl bg-[var(--kulv-surface-muted,#EFE6D4)] border border-[var(--kulv-border,#C9BFA9)] flex items-center justify-center p-3 text-[var(--kulv-text-muted,#5F675A)] ${className}`}
        role="img"
        aria-label={alt || 'Botanical illustration'}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-8 h-8 opacity-60"
          aria-hidden="true"
        >
          <path d="M24 42V18" />
          <path d="M24 28C20 24 14 24 10 26C10 32 16 36 24 34" />
          <path d="M24 22C28 18 34 18 38 20C38 26 32 30 24 28" />
          <circle cx="24" cy="10" r="4" />
        </svg>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden ${aspectClass} ${className} ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Loading shimmer placeholder */}
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-[var(--kulv-surface-muted,#EFE6D4)] animate-pulse"
          aria-hidden="true"
        />
      )}
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full ${fitClass} ${aspectClass} transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${imageClassName}`}
      />
    </div>
  );
};
