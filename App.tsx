import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { AppView, ResearchContext, AnalysisResult } from './types';
import Sidebar from './components/Sidebar';
import LiteratureReview from './components/LiteratureReview';
import Composition from './components/Composition';
import DataAnalysis from './components/DataAnalysis';

// --- Error Boundary Component to prevent White Screen ---
interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ScholarPulse Uncaught Error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 p-10 text-center">
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-red-100 max-w-lg">
            <span className="text-6xl mb-6 block">⚠️</span>
            <h1 className="text-2xl font-bold text-slate-900 mb-4 serif">Sistem Mengalami Gangguan</h1>
            <p className="text-slate-600 mb-8 text-sm leading-relaxed">
              ScholarPulse mengesan ralat teknikal. Jangan risau, draf anda mungkin telah disimpan secara automatik.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-lg"
            >
              Pulihkan Paparan
            </button>
            <button 
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              className="mt-4 block w-full text-[10px] font-bold text-slate-400 hover:text-red-500 transition-all"
            >
              Reset Cache & Mulakan Semula
            </button>
          </div>
        </div>
      );
    }
    // Fix: Access children via this.props.children in a class component
    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const [view, setView] = useState<AppView>(() => {
    const saved = localStorage.getItem('scholar_pulse_view');
    return (saved as AppView) || AppView.LITERATURE_REVIEW;
  });
  
  const [sharedContext, setSharedContext] = useState<ResearchContext | null>(null);

  useEffect(() => {
    localStorage.setItem('scholar_pulse_view', view);
  }, [view]);

  const handleTransferLR = (context: ResearchContext) => {
    setSharedContext(prev => ({
      ...prev,
      ...context,
      topic: context.topic || prev?.topic || '',
    }));
    setView(AppView.COMPOSITION);
  };

  const handleTransferAnalysis = (result: AnalysisResult) => {
    setSharedContext(prev => ({
      ...prev,
      topic: prev?.topic || 'Research Data Analysis',
      analysisResult: result,
      reviewType: prev?.reviewType || '',
      synthesis: prev?.synthesis || '',
      draft: prev?.draft || '',
      references: prev?.references || '',
    }));
    setView(AppView.COMPOSITION);
  };

  const renderContent = () => {
    try {
      switch (view) {
        case AppView.LITERATURE_REVIEW:
          return <LiteratureReview onTransfer={handleTransferLR} />;
        case AppView.COMPOSITION:
          return <Composition initialContext={sharedContext} />;
        case AppView.DATA_ANALYSIS:
          return <DataAnalysis onTransfer={handleTransferAnalysis} />;
        default:
          return <LiteratureReview onTransfer={handleTransferLR} />;
      }
    } catch (e) {
      console.error("Render Error:", e);
      return <div className="p-10 text-red-500">Gagal memuatkan modul. Sila muat semula.</div>;
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-50 flex overflow-hidden">
      <Sidebar currentView={view} setView={setView} />
      
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <header className="shrink-0 flex justify-between items-center p-6 bg-white border-b border-slate-100 z-10 shadow-sm">
          <div>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">ScholarPulse v1.1 - Secured</span>
            <h2 className="text-xl font-bold text-slate-800 serif leading-tight">
              {view === AppView.LITERATURE_REVIEW ? 'Literature Review Workspace' : 
               view === AppView.COMPOSITION ? 'Academic Writing Studio' : 'Intelligent Data Analysis'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-inner"></div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-700">Scopus Researcher</span>
                <span className="text-[9px] text-indigo-500 font-black uppercase">Gemini 3 Pro</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col px-4 md:px-6 lg:px-8 py-2">
          <div className="flex-1 min-h-0 w-full max-w-[1800px] mx-auto">
            {renderContent()}
          </div>
        </div>

        <footer className="shrink-0 p-3 border-t border-slate-100 bg-white flex justify-between items-center px-10 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          <span>Protected by ScholarGuard · Powered by Google Gemini 3</span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            <span>System Locked & Secure</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <AppContent />
  </ErrorBoundary>
);

export default App;