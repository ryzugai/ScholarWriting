
import React, { useState } from 'react';
import { AppView, ResearchContext, AnalysisResult } from './types';
import Sidebar from './components/Sidebar';
import LiteratureReview from './components/LiteratureReview';
import Composition from './components/Composition';
import DataAnalysis from './components/DataAnalysis';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LITERATURE_REVIEW);
  const [sharedContext, setSharedContext] = useState<ResearchContext | null>(null);

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
  };

  return (
    <div className="h-screen w-screen bg-slate-50 flex overflow-hidden">
      <Sidebar currentView={view} setView={setView} />
      
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Header Tetap */}
        <header className="shrink-0 flex justify-between items-center p-6 bg-white border-b border-slate-100 z-10 shadow-sm">
          <div>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">ScholarPulse v1.0</span>
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

        {/* Area Konten Utama */}
        <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col px-4 md:px-6 lg:px-8 py-2">
          <div className="flex-1 min-h-0 w-full max-w-[1800px] mx-auto">
            {renderContent()}
          </div>
        </div>

        {/* Footer Kecil */}
        <footer className="shrink-0 p-3 border-t border-slate-100 bg-white flex justify-between items-center px-10 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          <span>Powered by Google Gemini 3 · Academic AI Engine</span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            <span>System Online</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
