
import React, { useState, useMemo } from 'react';
import { searchLiterature, captureArticleDetails, composeAcademicText } from '../services/geminiService';
import { Paper, CapturedDetails, ReviewType, ResearchContext } from '../types';

interface StructuredReport {
  tajuk: string;
  abstrak: string;
  pengenalan: string;
  metodologi: string;
  hasilKajian: string;
  perbincangan: string;
  rumusan: string;
  rujukan: string;
}

interface LiteratureReviewProps {
  onTransfer?: (context: ResearchContext) => void;
}

const LiteratureReview: React.FC<LiteratureReviewProps> = ({ onTransfer }) => {
  const [query, setQuery] = useState('');
  const [userReferences, setUserReferences] = useState('');
  const [reviewType, setReviewType] = useState<ReviewType>(ReviewType.SLR);
  const [loading, setLoading] = useState(false);
  const [capturing, setCapturing] = useState<string | null>(null);
  const [results, setResults] = useState<{ papers: Paper[], summary: string } | null>(null);
  const [selectedCapture, setSelectedCapture] = useState<{ paper: Paper, details: CapturedDetails } | null>(null);
  
  // Advanced stage states
  const [finalSynthesis, setFinalSynthesis] = useState<string>('');
  const [reportDraft, setReportDraft] = useState<string>('');
  const [viewMode, setViewMode] = useState<'text' | 'table'>('text');
  
  const [stage, setStage] = useState(1);
  const [metrics, setMetrics] = useState({ identified: 0, screened: 0, excluded: 0, included: 0 });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    setStage(2);
    try {
      const data = await searchLiterature(query + (userReferences ? ` (Consider also: ${userReferences})` : ""), reviewType);
      setResults({ papers: data.papers, summary: data.text });
      setMetrics({ 
        identified: data.papers.length, 
        screened: data.papers.length, 
        excluded: Math.floor(data.papers.length * 0.2), 
        included: Math.floor(data.papers.length * 0.8) 
      });
      setStage(3);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeepCapture = async (paper: Paper) => {
    setCapturing(paper.id);
    try {
      const details = await captureArticleDetails(paper.url, paper.title);
      if (results) {
        const updatedPapers = results.papers.map(p => 
          p.id === paper.id ? { ...p, capturedData: details } : p
        );
        setResults({ ...results, papers: updatedPapers });
      }
      setSelectedCapture({ paper, details });
    } catch (error) {
      console.error(error);
    } finally {
      setCapturing(null);
    }
  };

  const handleSynthesize = async () => {
    if (!results) return;
    setLoading(true);
    try {
      const context = `
        Research Question: ${query}
        Review Type: ${reviewType}
        Gemini Search Summary: ${results.summary}
        Gemini Search Articles: ${results.papers.slice(0, 10).map(p => p.title).join(', ')}
        USER PROVIDED REFERENCES:
        ${userReferences}
      `;
      const prompt = `Create a high-level critical synthesis for a ${reviewType}. 
      Integrate all sources. Ensure you identify themes and contradictions. 
      DO NOT use markdown symbols. Use plain text with clear line breaks between paragraphs.`;
      
      const synthesis = await composeAcademicText(prompt, context);
      setFinalSynthesis(synthesis);
      setStage(4);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleWrite = async () => {
    setLoading(true);
    try {
      const context = `Synthesis: ${finalSynthesis}\nQuery: ${query}\nUser References: ${userReferences}\nReview Type: ${reviewType}`;
      const prompt = `Generate a full academic report draft for a ${reviewType}. 
      STRICTLY structure the output with the following labels for easy parsing:
      [TAJUK]
      [ABSTRAK]
      [PENGENALAN]
      [METODOLOGI]
      [HASIL KAJIAN]
      [PERBINCANGAN]
      [RUMUSAN]
      [RUJUKAN]
      
      Under each label, write the full content. Focus on critical reasoning and proper citation. DO NOT use markdown.`;
      
      const draft = await composeAcademicText(prompt, context);
      setReportDraft(draft);
      setStage(5);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => setStage(6);

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadText = () => {
    const content = `Topic: ${query}\nReview Type: ${reviewType}\n\n${reportDraft}`;
    downloadFile(content, `Report_${query.replace(/\s+/g, '_')}.txt`, 'text/plain');
  };

  const downloadWord = () => {
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Research Report</title><style>body{font-family:'Times New Roman',serif; line-height:1.5; padding: 40px;} h1{color:#1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px;} h2{color:#4338ca; margin-top: 30px;} .section{margin-bottom:20px; text-align: justify;} table{width:100%; border-collapse:collapse; margin-top:20px;} th, td{border:1px solid #ccc; padding:10px; text-align:left; vertical-align: top;}</style></head><body>`;
    const footer = `</body></html>`;
    
    const sections = parseReport(reportDraft);
    
    const content = `
      <h1>ScholarPulse AI Research Report</h1>
      <p><b>Research Topic:</b> ${query}</p>
      <p><b>Review Methodology:</b> ${reviewType}</p>
      <hr/>
      
      <div class="section">
        <h2>Report Matrix</h2>
        <table>
          <thead>
            <tr style="background:#f3f4f6;"><th>BAHAGIAN</th><th>KANDUNGAN LAPORAN</th></tr>
          </thead>
          <tbody>
            <tr><td><b>TAJUK</b></td><td>${sections.tajuk}</td></tr>
            <tr><td><b>ABSTRAK</b></td><td>${sections.abstrak}</td></tr>
            <tr><td><b>PENGENALAN</b></td><td>${sections.pengenalan}</td></tr>
            <tr><td><b>METODOLOGI</b></td><td>${sections.metodologi}</td></tr>
            <tr><td><b>HASIL KAJIAN</b></td><td>${sections.hasilKajian}</td></tr>
            <tr><td><b>PERBINCANGAN</b></td><td>${sections.perbincangan}</td></tr>
            <tr><td><b>RUMUSAN</b></td><td>${sections.rumusan}</td></tr>
            <tr><td><b>RUJUKAN</b></td><td>${sections.rujukan}</td></tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>Full Text Draft</h2>
        <p>${reportDraft.replace(/\n/g, '<br/>')}</p>
      </div>
    `;
    downloadFile(header + content + footer, `Report_${query.replace(/\s+/g, '_')}.doc`, 'application/msword');
  };

  const parseReport = (text: string): StructuredReport => {
    const getSection = (label: string) => {
      const regex = new RegExp(`\\[${label}\\]([\\s\\S]*?)(?=\\[|$)`, 'i');
      const match = text.match(regex);
      return match ? match[1].trim() : 'Content not generated.';
    };

    return {
      tajuk: getSection('TAJUK'),
      abstrak: getSection('ABSTRAK'),
      pengenalan: getSection('PENGENALAN'),
      metodologi: getSection('METODOLOGI'),
      hasilKajian: getSection('HASIL KAJIAN'),
      perbincangan: getSection('PERBINCANGAN'),
      rumusan: getSection('RUMUSAN'),
      rujukan: getSection('RUJUKAN'),
    };
  };

  const structuredReport = useMemo(() => parseReport(reportDraft), [reportDraft]);

  const stages = [
    { id: 1, label: 'PLAN', sub: 'Plan research', icon: '🧊' },
    { id: 2, label: 'SEARCH', sub: 'Gather sources', icon: '🔍' },
    { id: 3, label: 'EXTRACT', sub: 'Extract key data', icon: '📖' },
    { id: 4, label: 'SYNTHESIZE', sub: 'Analyze findings', icon: '📄' },
    { id: 5, label: 'WRITE', sub: 'Draft report', icon: '⭐' },
    { id: 6, label: 'FINISH', sub: 'Finalize output', icon: '📅' },
  ];

  const progressPercent = Math.round((stage / 6) * 100);

  const handleTransferClick = () => {
    if (onTransfer) {
      onTransfer({
        topic: query,
        reviewType: reviewType,
        synthesis: finalSynthesis,
        draft: reportDraft,
        references: userReferences
      });
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pr-2">
      <div className="max-w-[1400px] mx-auto space-y-12 pb-20 px-4 pt-4">
        {/* Progress Tracker */}
        <div className="space-y-10 animate-in fade-in duration-1000">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 rounded-full bg-indigo-400"></div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Literature Review Progress</h2>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-indigo-500 uppercase tracking-widest">Stage: {stage}/6</span>
              <div className="bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full font-black text-sm">{progressPercent}%</div>
            </div>
            <div className="flex-1 max-w-md w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>

          {/* Stepper */}
          <div className="relative flex justify-between items-start max-w-5xl mx-auto px-10">
            <div className="absolute top-8 left-10 right-10 h-0.5 bg-slate-100 -z-10"></div>
            {stages.map((s) => (
              <div key={s.id} className="flex flex-col items-center gap-4">
                <div className={`relative w-16 h-16 flex items-center justify-center transition-all duration-500 ${stage >= s.id ? 'scale-110' : 'opacity-30 grayscale'}`}>
                  <svg className={`absolute inset-0 w-full h-full ${stage >= s.id ? 'text-indigo-600' : 'text-slate-200'}`} viewBox="0 0 100 100">
                    <path fill="currentColor" d="M25,10 L75,10 L95,50 L75,90 L25,90 L5,50 Z" />
                  </svg>
                  <span className="relative z-10 text-xl text-white">{s.icon}</span>
                </div>
                <div className="text-center">
                  <p className={`text-[10px] font-black tracking-widest ${stage >= s.id ? 'text-slate-800' : 'text-slate-300'}`}>{s.label}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Action Bar */}
          {results && stage >= 3 && stage < 6 && (
            <div className="bg-indigo-600 rounded-3xl p-8 shadow-xl text-white flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h3 className="text-xl font-bold">Current phase: {stages[stage-1].label}</h3>
                <p className="text-indigo-100 text-sm">{stages[stage-1].sub}</p>
              </div>
              <div className="flex gap-4">
                {stage === 3 && <button onClick={handleSynthesize} disabled={loading} className="bg-white text-indigo-600 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-50 transition-all">{loading ? 'Synthesizing...' : 'Synthesize All Findings'}</button>}
                {stage === 4 && <button onClick={handleWrite} disabled={loading} className="bg-white text-indigo-600 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-50 transition-all">{loading ? 'Generating Draft...' : 'Write Full Report'}</button>}
                {stage === 5 && <button onClick={handleFinish} className="bg-white text-indigo-600 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-50 transition-all">Finalize & Export</button>}
              </div>
            </div>
          )}
        </div>

        {stage === 1 && (
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 max-w-4xl mx-auto space-y-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-slate-900 serif mb-2">Academic Research Initializer</h3>
              <p className="text-slate-500 text-sm">Select method, topic, and optional references.</p>
            </div>
            <div className="flex justify-center gap-4">
              {[ReviewType.SLR, ReviewType.SCOPING, ReviewType.NARRATIVE].map(t => (
                <button key={t} onClick={() => setReviewType(t)} className={`px-6 py-2 rounded-xl text-[10px] font-black border transition-all ${reviewType === t ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}>{t}</button>
              ))}
            </div>
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Research Question</label>
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="E.g. The impact of blockchain on digital privacy..." className="w-full px-8 py-5 rounded-2xl border-2 border-slate-50 focus:border-indigo-400 outline-none text-lg bg-slate-50/50" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Own References (Optional)</label>
                <textarea value={userReferences} onChange={(e) => setUserReferences(e.target.value)} placeholder="Paste citations or reference lists..." className="w-full h-40 px-8 py-5 rounded-2xl border-2 border-slate-50 focus:border-indigo-400 outline-none text-base bg-slate-50/50 resize-none font-serif" />
              </div>
              <div className="flex justify-center"><button disabled={loading} className="bg-indigo-600 text-white px-16 py-5 rounded-2xl font-black hover:bg-indigo-700 disabled:bg-slate-300 uppercase tracking-widest text-sm shadow-xl shadow-indigo-100">{loading ? 'Searching...' : 'Start Search'}</button></div>
            </form>
          </div>
        )}

        {results && stage >= 3 && (
          <div className="space-y-12">
            {stage === 3 && (
              <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="px-10 py-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                   <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Article Evidence Matrix</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/20 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-8 py-5 w-16">No</th>
                        <th className="px-8 py-5">Article Reference</th>
                        <th className="px-8 py-5 w-24">Year</th>
                        <th className="px-8 py-5">Journal</th>
                        <th className="px-8 py-5 w-40">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm">
                      {results.papers.map((paper, idx) => (
                        <tr key={paper.id} className="hover:bg-indigo-50/20 transition-all">
                          <td className="px-8 py-6 text-slate-300 font-black">{(idx + 1).toString().padStart(2, '0')}</td>
                          <td className="px-8 py-6 font-bold text-slate-800">{paper.title}</td>
                          <td className="px-8 py-6 font-bold text-slate-500">{paper.year}</td>
                          <td className="px-8 py-6 italic text-slate-400 serif">{paper.journal}</td>
                          <td className="px-8 py-6">
                            <button onClick={() => handleDeepCapture(paper)} disabled={!!capturing} className={`text-[10px] font-black px-4 py-2 rounded-xl border transition-all ${paper.capturedData ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'border-slate-100 text-slate-400 hover:bg-indigo-600 hover:text-white'}`}>{paper.capturedData ? 'View' : 'Extract'}</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(stage === 4 || stage === 5) && (
              <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-slate-100 animate-in fade-in duration-500">
                <div className="flex justify-between items-center mb-8 border-b pb-6">
                  <h3 className="text-2xl font-bold serif text-slate-900">
                    {stage === 4 ? 'Research Synthesis' : 'Full Report Draft'}
                  </h3>
                  <div className="flex bg-slate-50 p-1 rounded-xl">
                      <button onClick={() => setViewMode('text')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${viewMode === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>PENULISAN</button>
                      <button onClick={() => setViewMode('table')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>JADUAL TEMPLATE</button>
                  </div>
                </div>
                
                {viewMode === 'text' ? (
                  <div className="space-y-6">
                    {(stage === 4 ? finalSynthesis : reportDraft).split('\n\n').map((block, idx) => (
                      <p key={idx} className="text-lg serif leading-relaxed text-slate-700 text-justify">{block}</p>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-[2rem] border border-slate-200 shadow-sm">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                          <th className="p-6 w-48 border-r border-slate-200">BAHAGIAN</th>
                          <th className="p-6">HASIL ANALISIS / PENULISAN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 serif">
                        {[
                          { label: 'TAJUK', content: structuredReport.tajuk },
                          { label: 'ABSTRAK', content: structuredReport.abstrak },
                          { label: 'PENGENALAN', content: structuredReport.pengenalan },
                          { label: 'METODOLOGI', content: structuredReport.metodologi },
                          { label: 'HASIL KAJIAN', content: structuredReport.hasilKajian },
                          { label: 'PERBINCANGAN', content: structuredReport.perbincangan },
                          { label: 'RUMUSAN', content: structuredReport.rumusan },
                          { label: 'RUJUKAN', content: structuredReport.rujukan },
                        ].map((row, i) => (
                          <tr key={i} className="hover:bg-indigo-50/20 transition-colors">
                            <td className="p-6 font-black text-indigo-600 bg-slate-50/30 border-r border-slate-100 text-xs tracking-widest">{row.label}</td>
                            <td className="p-6 text-base leading-relaxed whitespace-pre-wrap">{row.content}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {stage === 6 && (
              <div className="bg-emerald-50 rounded-[3rem] p-20 shadow-2xl border border-emerald-100 text-center space-y-8">
                <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center text-4xl mx-auto shadow-xl">✓</div>
                <h3 className="text-4xl font-bold text-emerald-900 serif">Review Successfully Finalized</h3>
                <p className="text-emerald-800 text-xl max-w-2xl mx-auto">All stages completed. Your ${reviewType} is ready for export or further writing assistant.</p>
                <div className="flex flex-wrap justify-center gap-4 pt-8">
                  <button onClick={handleTransferClick} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center gap-2">
                     Pindah ke Academic Writing ✍️
                  </button>
                  <button onClick={downloadWord} className="bg-white text-indigo-600 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm border border-indigo-200 hover:bg-indigo-50">Download Report (.doc)</button>
                  <button onClick={downloadText} className="bg-white text-slate-600 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm border border-slate-200 hover:bg-slate-50">Download Text (.txt)</button>
                  <button onClick={() => { setStage(1); setResults(null); setFinalSynthesis(''); setReportDraft(''); }} className="bg-white text-emerald-600 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm border border-emerald-200 hover:bg-emerald-100 transition-all">Start New Project</button>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedCapture && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
            <div className="bg-white w-full max-w-6xl rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-10 bg-indigo-600 text-white flex justify-between items-center">
                <h3 className="text-2xl font-bold leading-tight pr-12">{selectedCapture.paper.title}</h3>
                <button onClick={() => setSelectedCapture(null)} className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">✕</button>
              </div>
              <div className="p-10 overflow-y-auto space-y-10 bg-slate-50/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <h4 className="text-indigo-600 font-black text-[10px] uppercase mb-6 tracking-widest">Findings Matrix</h4>
                    <ul className="space-y-4">
                      {selectedCapture.details.findings.map((f, i) => (
                        <li key={i} className="flex gap-4 items-start text-sm text-slate-700 serif">
                          <span className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                    <h4 className="text-indigo-600 font-black text-[10px] uppercase mb-4 tracking-widest">Academic Citation</h4>
                    <p className="text-sm italic serif text-slate-600 leading-relaxed mb-auto">{selectedCapture.details.citation}</p>
                    <div className="flex gap-3 mt-8">
                      <button onClick={() => navigator.clipboard.writeText(selectedCapture.details.citation)} className="flex-1 text-[10px] font-black bg-slate-900 text-white px-5 py-3 rounded-xl uppercase hover:bg-slate-800 transition-all">Copy</button>
                      <a href={selectedCapture.paper.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-center text-[10px] font-black bg-indigo-50 text-indigo-600 px-5 py-3 rounded-xl uppercase">Source</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiteratureReview;
