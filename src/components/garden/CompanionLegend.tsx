import React, { useState } from 'react';
import { Leaf, Info, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

interface CompanionLegendProps {
  language: 'et' | 'en';
  visible: boolean;
}

export const CompanionLegend: React.FC<CompanionLegendProps> = ({ language, visible }) => {
  const [collapsed, setCollapsed] = useState(false);

  if (!visible) return null;

  return (
    <div
      className="companion-legend-widget absolute left-3 bottom-3 bg-[var(--kulv-surface,#FFFDF8)]/95 backdrop-blur-md rounded-xl border border-[var(--kulv-border,#C9BFA9)] shadow-lg z-15 flex flex-col p-3 text-[var(--kulv-text,#2A2E24)] max-w-[320px] transition-all"
      data-testid="companion_legend_widget"
      role="region"
      aria-label={language === 'en' ? 'Companion Intelligence Legend' : 'Kaaslastaimede legend'}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--kulv-border,#C9BFA9)]/60 cursor-pointer" onClick={() => setCollapsed(!collapsed)}>
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-[var(--kulv-primary,#4F6B45)]/15 text-[var(--kulv-primary,#4F6B45)]">
            <Leaf size={14} />
          </span>
          <span className="text-xs font-bold">
            {language === 'en' ? 'Companion Legend & Guide' : 'Sünergia legend ja teatmik'}
          </span>
        </div>
        <button
          type="button"
          className="p-1 text-[var(--kulv-text-muted,#5F675A)] hover:text-[var(--kulv-text,#2A2E24)] rounded"
          aria-label={collapsed ? 'Expand legend' : 'Collapse legend'}
        >
          {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {!collapsed && (
        <div className="flex flex-col gap-2.5 pt-2.5 text-[11px] text-[var(--kulv-text,#2A2E24)]">
          {/* Bed Floating Badges */}
          <div className="flex flex-col gap-1">
            <span className="font-bold text-[10px] text-[var(--kulv-text-muted,#5F675A)] uppercase tracking-wider">
              {language === 'en' ? 'Bed Harmony Badges' : 'Peenra harmoonia märgid'}
            </span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#EBF4E8] text-[#2F4F24] border border-[#4F6B45]">
                🌿 80%+
              </span>
              <span className="text-[10.5vpx] text-[var(--kulv-text-muted,#5F675A)]">
                {language === 'en' ? 'High beneficial harmony' : 'Kõrge kasulik sünergia'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#FFF8E6] text-[#8F5800] border border-[#D9A03D]">
                ⚖️ 50-79%
              </span>
              <span className="text-[10.5px] text-[var(--kulv-text-muted,#5F675A)]">
                {language === 'en' ? 'Neutral or mixed pairings' : 'Neutraalsed või segatud seosed'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#FDF0E9] text-[#9E3C12] border border-[#D97A3D]">
                ⚠️ &lt;50%
              </span>
              <span className="text-[10.5px] text-[var(--kulv-text-muted,#5F675A)]">
                {language === 'en' ? 'Incompatible conflict risk' : 'Ebasobivate seoste risk'}
              </span>
            </div>
          </div>

          {/* Connection Lines */}
          <div className="flex flex-col gap-1 pt-1 border-t border-[var(--kulv-border,#C9BFA9)]/50">
            <span className="font-bold text-[10px] text-[var(--kulv-text-muted,#5F675A)] uppercase tracking-wider">
              {language === 'en' ? 'Proximity Links (≤1.5m)' : 'Naabrusseosed (≤1.5m)'}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-[#4F6B45]" />
              <span className="text-[10.5px]">
                {language === 'en' ? 'Solid green: Beneficial companion' : 'Täisjoon: Soodne kaaslane (+)'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 border-t border-dashed border-[#D97A3D]" />
              <span className="text-[10.5px]">
                {language === 'en' ? 'Dashed orange: Incompatible conflict (!)' : 'Katkendlik oranž: Ebasoodne seos (!)'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 border-t border-dotted border-stone-400" />
              <span className="text-[10.5px]">
                {language === 'en' ? 'Dotted grey: Neutral / Uncertain (?)' : 'Punktirikas hall: Neutraalne (?)'}
              </span>
            </div>
          </div>

          {/* Source footer */}
          <div className="pt-1.5 border-t border-[var(--kulv-border,#C9BFA9)]/50 text-[10px] text-[var(--kulv-text-muted,#5F675A)] flex items-center gap-1">
            <ShieldCheck size={12} className="text-[var(--kulv-primary,#4F6B45)] shrink-0" />
            <span>{language === 'en' ? 'Grounded in METK & RHS agronomy' : 'Põhineb METK ja RHS teadusuuringutel'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
