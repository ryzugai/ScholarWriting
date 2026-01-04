
import React, { useState, useEffect, useRef } from 'react';
import { composeAcademicText, humanizeText, paraphraseText, getSuggestions, findCitations, translateText } from '../services/geminiService';
import { ResearchContext, ScopusQuartile, SectionType } from '../types';

interface CompositionProps {
  initialContext?: ResearchContext | null;
}

const Composition: React.FC<CompositionProps> = ({ initialContext }) => {
  const [activeSection, setActiveSection] = useState<SectionType>('intro');
  const [sections, setSections] = useState<Record<SectionType, string>>({
    intro: '', lr: '', method: '', analysis: '', disc: '', conc: '', refs: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [quartile, setQuartile] = useState<ScopusQuartile>('Q1');
  const [prompt, setPrompt] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [citations, setCitations] = useState<string[]>([]);
  const [citationSearchVisible, setCitationSearchVisible] = useState(false);
  
  // Editor States
  const [fontSize, setFontSize] = useState(18);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const [targetLang, setTargetLang] = useState('English');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialContext) {
      setSections(prev => ({
        ...prev,
        lr: initialContext.draft || initialContext.synthesis || prev.lr,
        refs: initialContext.references || prev.refs,
        analysis: initialContext.analysisResult ? 
          `ANALISIS DATA:\nSummary: ${initialContext.analysisResult.summary}\nInsights: ${initialContext.analysisResult.insights.join(', ')}` : prev.analysis
      }));
    }
  }, [initialContext]);

  const handleUpdateSection = (val: string) => {
    setSections(prev => ({ ...prev, [activeSection]: val }));
  };

  const getTargetText = () => {
    const start = textareaRef.current?.selectionStart || 0;
    const end = textareaRef.current?.selectionEnd || 0;
    const selected = sections[activeSection].substring(start, end);
    return { text: selected || sections[activeSection], isSelection: !!selected, start, end };
  };

  const replaceTargetText = (newText: string, meta: any) => {
    if (meta.isSelection) {
      const full = sections[activeSection];
      const updated = full.substring(0, meta.start) + newText + full.substring(meta.end);
      handleUpdateSection(updated);
    } else {
      handleUpdateSection(newText);
    }
  };

  const handleCompose = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const contextStr = `Section: ${sectionLabels[activeSection]}\nCurrent: ${sections[activeSection]}\nTopic: ${initialContext?.topic || 'Research'}`;
      const response = await composeAcademicText(`[TARGET: Scopus ${quartile}] ${prompt}`, contextStr);
      handleUpdateSection(sections[activeSection] + "\n\n" + response);
      setPrompt('');
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleToolAction = async (action: 'humanize' | 'paraphrase' | 'translate') => {
    const meta = getTargetText();
    if (!meta.text) return;
    setLoading(true);
    try {
      let result = "";
      if (action === 'humanize') result = await humanizeText(meta.text);
      else if (action === 'paraphrase') result = await paraphraseText(meta.text);
      else if (action === 'translate') result = await translateText(meta.text, targetLang);
      replaceTargetText(result, meta);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSearchCitation = async () => {
    const meta = getTargetText();
    const keyword = meta.text || prompt || initialContext?.topic || "";
    if (!keyword) return;
    setLoading(true);
    setCitationSearchVisible(true);
    try {
      const res = await findCitations(keyword);
      setCitations(res);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const sectionLabels: Record<SectionType, string> = {
    intro: '1. Pengenalan', lr: '2. Sorotan Literatur', method: '3. Metodologi',
    analysis: '4. Hasil & Analisis', disc: '5. Perbincangan', conc: '6. Kesimpulan', refs: '7. Rujukan'
  };

  return (
    <div className="h-full w-full flex flex-col gap-4 overflow-hidden">
      
      {/* Tabs */}
      <div className="shrink-0 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
        {(Object.keys(sectionLabels) as SectionType[]).map(key => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
              activeSection === key ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            {sectionLabels[key]}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden">
        
        {/* Editor */}
        <div className="flex-[3] bg-white rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col min-h-0 overflow-hidden relative border-t-4 border-t-indigo-600">
          
          {/* Main Toolbar */}
          <div className="shrink-0 px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <button onClick={() => handleToolAction('humanize')} disabled={loading} className="px-3 py-1.5 rounded-lg text-[9px] font-black bg-white border border-slate-200 text-indigo-600 hover:shadow-sm">✨ HUMANIZE</button>
              <button onClick={() => handleToolAction('paraphrase')} disabled={loading} className="px-3 py-1.5 rounded-lg text-[9px] font-black bg-white border border-slate-200 text-indigo-600 hover:shadow-sm">🔄 PARAPHRASE</button>
              <button onClick={handleSearchCitation} disabled={loading} className="px-3 py-1.5 rounded-lg text-[9px] font-black bg-white border border-slate-200 text-indigo-600 hover:shadow-sm">🔎 CITATION</button>
              <div className="h-6 w-px bg-slate-200 mx-1"></div>
              <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
                <select 
                  value={targetLang} 
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="text-[9px] font-bold px-2 py-1 outline-none bg-transparent"
                >
                  <option>English</option>
                  <option>Malay</option>
                  <option>Arabic</option>
                  <option>Mandarin</option>
                </select>
                <button onClick={() => handleToolAction('translate')} disabled={loading} className="px-3 py-1.5 text-[9px] font-black bg-indigo-600 text-white">TRANSLATE</button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Font Size */}
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black text-slate-400">SIZE</span>
                <select 
                  value={fontSize} 
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="text-[10px] font-bold border border-slate-200 rounded px-1 py-0.5 outline-none"
                >
                  {[14, 16, 18, 20, 24, 28, 32].map(s => <option key={s} value={s}>{s}px</option>)}
                </select>
              </div>
              {/* Alignment */}
              <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
                {(['left', 'center', 'right', 'justify'] as const).map(align => (
                  <button 
                    key={align}
                    onClick={() => setTextAlign(align)}
                    className={`p-1.5 text-[10px] transition-all ${textAlign === align ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}
                    title={align.toUpperCase()}
                  >
                    {align === 'left' && '⫷'}
                    {align === 'center' && '〓'}
                    {align === 'right' && '⫸'}
                    {align === 'justify' && '≡'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 w-full relative min-h-0">
            <textarea
              ref={textareaRef}
              value={sections[activeSection]}
              onChange={(e) => handleUpdateSection(e.target.value)}
              style={{ fontSize: `${fontSize}px`, textAlign: textAlign }}
              className="absolute inset-0 w-full h-full p-10 md:p-14 lg:p-16 font-serif leading-[1.8] outline-none resize-none bg-white text-slate-800 placeholder:text-slate-200 transition-all"
              placeholder={`Mula menulis bahagian ${sectionLabels[activeSection]}...`}
            />
          </div>

          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-20">
              <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">ScholarPulse Processing...</span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex-[1] flex flex-col gap-6 min-h-0 overflow-hidden min-w-[320px]">
          <div className="shrink-0 bg-indigo-600 p-6 rounded-[2rem] text-white shadow-lg space-y-4">
            <h4 className="font-black text-[9px] uppercase tracking-widest opacity-80 flex items-center gap-2"><span>✍️</span> Writing Assistant</h4>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g. Huraikan jurang kajian (research gap) berdasarkan context di atas..."
              className="w-full bg-indigo-700/50 border border-indigo-400/30 rounded-xl p-3 text-xs placeholder:text-indigo-300/50 outline-none h-24 resize-none"
            />
            <button
              onClick={handleCompose}
              disabled={loading || !prompt}
              className="w-full bg-white text-indigo-600 font-black py-3 rounded-xl hover:bg-indigo-50 transition-all uppercase tracking-widest text-[9px]"
            >
              Jana Teks Scopus {quartile}
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Target Journal</h4>
              <div className="grid grid-cols-4 gap-2">
                {(['Q1', 'Q2', 'Q3', 'Q4'] as ScopusQuartile[]).map(q => (
                  <button key={q} onClick={() => setQuartile(q)} className={`py-2 rounded-lg text-[9px] font-black border transition-all ${quartile === q ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>{q}</button>
                ))}
              </div>
            </div>

            <button onClick={async () => {
              setLoading(true);
              const res = await getSuggestions(activeSection, sections[activeSection]);
              setSuggestions(res);
              setLoading(false);
            }} className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-[9px] font-black uppercase hover:border-indigo-400 hover:text-indigo-600 transition-all">
               Generate Sentence Starters
            </button>

            {suggestions.length > 0 && (
              <div className="space-y-2">
                {suggestions.map((s, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleUpdateSection(sections[activeSection] + (sections[activeSection] ? " " : "") + s)}
                    className="w-full text-left p-3 text-[10px] serif bg-white border border-slate-100 rounded-xl hover:bg-indigo-50 transition-all text-slate-600"
                  >
                    "{s}..."
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Citation Modal */}
      {citationSearchVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold serif">Find Real Citations</h3>
              <button onClick={() => setCitationSearchVisible(false)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">✕</button>
            </div>
            <div className="p-6 overflow-y-auto space-y-3 bg-slate-50 flex-1 custom-scrollbar">
              {citations.map((cite, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3 group hover:border-indigo-300">
                  <p className="text-[11px] serif text-slate-700 leading-relaxed italic">{cite}</p>
                  <button 
                    onClick={() => {
                      const updated = sections[activeSection] + (sections[activeSection] ? " " : "") + cite;
                      handleUpdateSection(updated);
                      setCitationSearchVisible(false);
                    }}
                    className="self-end text-[8px] font-black bg-indigo-600 text-white px-4 py-2 rounded-lg uppercase"
                  >
                    Insert to Text
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Composition;
