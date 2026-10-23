import React, { Suspense, useState, useEffect } from 'react';
import { isWebGL2Available } from '../../lib/three/webglCheck';
import { AlertCircle, Eye, Loader2 } from 'lucide-react';
import { ThreeErrorBoundary } from './ThreeErrorBoundary';

const LazyYard3DCanvas = React.lazy(() => import('./Yard3DCanvas'));

interface Yard3DViewWrapperProps {
  onBackTo2D: () => void;
}

export const Yard3DViewWrapper: React.FC<Yard3DViewWrapperProps> = ({ onBackTo2D }) => {
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);

  useEffect(() => {
    setWebglSupported(isWebGL2Available());
  }, []);

  if (webglSupported === null) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-slate-900 rounded-xl border border-slate-700 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
        <p className="text-sm">Kontrollin 3D riistvarakiirenduse tuge...</p>
      </div>
    );
  }

  if (!webglSupported) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-900 rounded-xl border border-amber-600/40 text-slate-300 min-h-[450px]">
        <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Sinu brauser ei toeta 3D-vaadet</h3>
        <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
          WebGL2 riistvaraline kiirendus ei ole Sinu seadmes või brauseris saadaval. KÜLV 2D krundiplaan on täielikult funktsionaalne ja jätkab tööd.
        </p>
        <button
          onClick={onBackTo2D}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-sm transition-colors shadow-lg shadow-emerald-900/30 cursor-pointer"
        >
          <Eye className="w-4 h-4" />
          <span>Ava 2D Krundiplaan</span>
        </button>
      </div>
    );
  }

  return (
    <ThreeErrorBoundary onFallbackTo2D={onBackTo2D}>
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] min-h-[500px] bg-slate-900 rounded-xl border border-slate-700 text-slate-400">
            <Loader2 className="w-9 h-9 animate-spin text-emerald-400 mb-3" />
            <p className="text-sm font-medium text-slate-200">Laadin 3D aiamootorit...</p>
            <p className="text-xs text-slate-500 mt-1">Eraldi kerglaetav Three.js moodul</p>
          </div>
        }
      >
        <LazyYard3DCanvas onBackTo2D={onBackTo2D} />
      </Suspense>
    </ThreeErrorBoundary>
  );
};

