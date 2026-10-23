import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, Eye } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onFallbackTo2D?: () => void;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ThreeErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || 'Tundmatu viga 3D stseeni renderdamisel'
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ThreeErrorBoundary caught 3D render error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          data-testid="three-error-fallback"
          className="flex flex-col items-center justify-center p-8 text-center bg-slate-900 rounded-xl border border-amber-600/40 text-slate-300 min-h-[450px]"
        >
          <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">3D vaate kuvamisel tekkis tõrge</h3>
          <p className="text-sm text-slate-400 max-w-md mb-2 leading-relaxed">
            Graafikakiirenduse või stseeni initsialiseerimisel tekkis tõrge ({this.state.errorMessage}).
          </p>
          <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
            Sinu 2D krundiplaan ja andmed on täiesti terved ja kaitstud.
          </p>
          {this.props.onFallbackTo2D && (
            <button
              onClick={this.props.onFallbackTo2D}
              data-testid="return-to-2d-btn"
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-sm transition-colors shadow-lg shadow-emerald-900/30 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Naase 2D krundiplaanile</span>
            </button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
