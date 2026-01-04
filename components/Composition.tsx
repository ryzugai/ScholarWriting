
import React, { useState, useEffect, useRef } from 'react';
import { composeAcademicText, humanizeText, paraphraseText, getSuggestions, findCitations } from '../services/geminiService';
import { ResearchContext, ScopusQuartile, SectionType } from '../types';

interface CompositionProps {
  initialContext?: ResearchContext | null;
}

const Composition: React.FC<CompositionProps> = ({ initialContext }) => {
  const [activeSection, setActiveSection] = useState<SectionType>('intro');
  const [sections, setSections] = useState<Record<SectionType, string>>({
    intro: '',
    lr: '',
    method: '',
    analysis: '',
    disc: '',
    conc: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [quartile, setQuartile] = useState<ScopusQuartile>('Q1');
  const [prompt, setPrompt] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [citations, setCitations] = useState<string[]>([]);
  const [citationSearchVisible, setCitationSearchVisible] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialContext) {
      setSections(prev => ({
        ...prev,
        lr: initialContext.draft || initialContext.synthesis || prev.lr,
        analysis: initialContext.analysisResult ? 
          `HASIL ANALISIS DATA:\n\nRingkasan:\n${initialContext.analysisResult.summary}\n\nPenemuan Utama:\n${initialContext.analysisResult.insights.map(i => `• ${i}`).join('\n')}\n\nCadangan Strategik:\n${initialContext.analysisResult.recommendations.map(r => `• ${r}`).join('\n')}` : prev.analysis
      }));
    }
  }, [initialContext]);

  const handleUpdateSection = (val: string) => {
    setSections(prev => ({ ...prev, [activeSection]: val }));
  };

  const currentContent = sections[activeSection];

  const handleCompose = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const contextStr = `
        Section: ${sectionLabels[activeSection]}
        Current Text: ${currentContent}
        Quartile: ${quartile}
        Research Topic: ${initialContext?.topic || 'Research Article'}
      `;
      const response = await composeAcademicText(`[TARGET: Scopus ${quartile}] ${prompt}`, contextStr);
      handleUpdateSection(currentContent + (currentContent ? '\n\n' : '') + response);
      setPrompt('');
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleToolAction = async (action: 'humanize' | 'paraphrase') => {
    if (!currentContent) return;
    setLoading(true);
    try {
      const result = action === 'humanize' ? await humanizeText(currentContent) : await paraphraseText(currentContent);
      handleUpdateSection(result);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await getSuggestions(activeSection, currentContent);
      setSuggestions(res);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSearchCitation = async () => {
    const selection = window.getSelection()?.toString();
    const keyword = selection || prompt || initialContext?.topic || "";
    if (!keyword) return;
    setLoading(true);
    setCitationSearchVisible(true);
    try {
      const res = await findCitations(keyword);
      setCitations(res);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const useSuggestion = (s: string) => {
    handleUpdateSection(currentContent + (currentContent ? ' ' : '') + s);
  };

  const sectionLabels: Record<SectionType, string> = {
    intro: '1. Pengenalan',
    lr: '2. Sorotan Literatur',
    method: '3. Metodologi Kajian',
    analysis: '4. Hasil & Analisis',
    disc: '5. Perbincangan',
    conc: '6. Kesimpulan'
  };

  return (
    <div className="h-full w-full flex flex-col gap-4 overflow-hidden">
      
      {/* Navigasi Bab Tetap */}
      <div className="shrink-0 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
        {(Object.keys(sectionLabels) as SectionType[]).map(key => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              activeSection === key 
              ? 'bg-indigo-600 text-white shadow-lg' 
              : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
            }`}
          >
            {sectionLabels[key]}
          </button>
        ))}
      </div>

      {/* Editor & Sidebar Layout - Mengisi sisa ruang */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden">
        
        {/* AREA EDITOR UTAMA - Mengisi secara fleksibel */}
        <div className="flex-[3] bg-white rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col min-h-0 overflow-hidden relative border-t-4 border-t-indigo-600">
          
          {/* Toolbar Internal */}
          <div className="shrink-0 px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center backdrop-blur-sm">
            <div className="flex gap-2">
              <button onClick={() => handleToolAction('humanize')} disabled={loading} className="px-4 py-2 rounded-xl text-[10px] font-black bg-white border border-slate-200 text-indigo-600 hover:shadow-md transition-all">✨ HUMANIZER</button>
              <button onClick={() => handleToolAction('paraphrase')} disabled={loading} className="px-4 py-2 rounded-xl text-[10px] font-black bg-white border border-slate-200 text-indigo-600 hover:shadow-md transition-all">🔄 PARAPHRASER</button>
              <button onClick={handleSearchCitation} disabled={loading} className="px-4 py-2 rounded-xl text-[10px] font-black bg-white border border-slate-200 text-indigo-600 hover:shadow-md transition-all">🔎 CITATION</button>
            </div>
            <div className="hidden md:block text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
              Bab: {activeSection.toUpperCase()}
            </div>
          </div>

          {/* TEXTAREA EDITOR - Ruang Terbesar */}
          <div className="flex-1 w-full relative min-h-0">
            <textarea
              ref={textareaRef}
              value={currentContent}
              onChange={(e) => handleUpdateSection(e.target.value)}
              className="absolute inset-0 w-full h-full p-10 md:p-14 lg:p-20 text-xl lg:text-2xl font-serif leading-[2] outline-none resize-none bg-white text-slate-800 placeholder:text-slate-200"
              placeholder={`Sila mula menulis bahagian ${sectionLabels[activeSection]} di sini...`}
            />
          </div>

          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-20">
              <div className="bg-white p-8 rounded-[2rem] shadow-2xl border border-slate-100 flex items-center gap-6">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-black text-slate-900 uppercase tracking-widest">ScholarPulse AI Generating...</span>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR ASISTEN */}
        <div className="flex-[1] flex flex-col gap-6 min-h-0 overflow-hidden min-w-[360px]">
          
          {/* Box Generator Prompt */}
          <div className="shrink-0 bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-2xl space-y-4">
            <h4 className="font-black text-[10px] uppercase tracking-widest opacity-80 flex items-center gap-2">
              <span>✍️</span> Asisten Penulisan
            </h4>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g. Terangkan kelebihan kaedah yang digunakan secara mendalam..."
              className="w-full bg-indigo-700/50 border border-indigo-400/30 rounded-2xl p-4 text-sm placeholder:text-indigo-300/50 outline-none h-32 resize-none leading-relaxed"
            />
            <button
              onClick={handleCompose}
              disabled={loading || !prompt}
              className="w-full bg-white text-indigo-600 font-black py-4 rounded-2xl hover:bg-indigo-50 active:scale-[0.98] transition-all uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-900/20"
            >
              Jana Teks Scopus {quartile}
            </button>
          </div>

          {/* Scopus Target & Suggestions Area - Boleh Scroll Sendiri */}
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1 pb-4 custom-scrollbar">
            
            {/* Target Quality */}
            <div className="shrink-0 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Target Ranking</h4>
              <div className="grid grid-cols-4 gap-2">
                {(['Q1', 'Q2', 'Q3', 'Q4'] as ScopusQuartile[]).map(q => (
                  <button
                    key={q}
                    onClick={() => setQuartile(q)}
                    className={`py-3 rounded-xl text-xs font-black transition-all border ${
                      quartile === q ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-50 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg flex flex-col gap-4 min-h-[250px]">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cadangan Kalimat</h4>
                <button onClick={fetchSuggestions} className="text-[10px] font-bold text-indigo-600 hover:underline">🔄 Refresh</button>
              </div>
              <div className="space-y-3">
                {suggestions.length > 0 ? suggestions.map((s, i) => (
                  <button 
                    key={i} 
                    onClick={() => useSuggestion(s)}
                    className="w-full text-left p-4 text-xs serif bg-slate-50 border border-slate-100 rounded-xl hover:bg-indigo-50/50 hover:border-indigo-200 transition-all text-slate-600 leading-relaxed"
                  >
                    "{s}..."
                  </button>
                )) : (
                  <div className="text-center py-10">
                    <p className="text-[10px] text-slate-300 italic mb-4">Klik 'Refresh' untuk mendapatkan bantuan kalimat pembuka bab ini.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Final Export */}
            <button className="shrink-0 w-full bg-emerald-500 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all">
               Eksport Manuskrip (.doc)
            </button>
          </div>
        </div>
      </div>

      {/* Citation Modal - Z-Index tertinggi */}
      {citationSearchVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-md">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold serif">Academic Citation Finder</h3>
              <button onClick={() => setCitationSearchVisible(false)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-xl font-bold">✕</button>
            </div>
            <div className="p-10 overflow-y-auto space-y-4 bg-slate-50 flex-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Mencari Artikel Jurnal...</p>
                </div>
              ) : citations.length > 0 ? citations.map((cite, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4 group hover:border-indigo-300 transition-all">
                   <p className="text-base serif text-slate-700 leading-relaxed italic">"{cite}"</p>
                   <button 
                    onClick={() => {
                      const authorYear = `(${cite.split(',')[0].trim()}, ${cite.match(/\d{4}/)?.[0] || 'n.d.'})`;
                      handleUpdateSection(currentContent + (currentContent ? ' ' : '') + authorYear);
                      setCitationSearchVisible(false);
                    }}
                    className="self-end text-[10px] font-black bg-indigo-600 text-white px-8 py-3 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all uppercase tracking-widest"
                  >
                    Masukkan Sitasi In-Text
                  </button>
                </div>
              )) : (
                <div className="text-center py-24">
                   <p className="text-lg serif text-slate-400">Tiada hasil ditemui. Cuba highlight kata kunci di editor dahulu.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Composition;
