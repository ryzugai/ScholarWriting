
import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { analyzeData } from '../services/geminiService';
import { AnalysisResult } from '../types';

interface DataAnalysisProps {
  onTransfer?: (result: AnalysisResult) => void;
}

const DataAnalysis: React.FC<DataAnalysisProps> = ({ onTransfer }) => {
  const [rawData, setRawData] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setRawData(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleAnalyze = async () => {
    if (!rawData) return;
    setLoading(true);
    try {
      const analysis = await analyzeData(rawData);
      setResult(analysis);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = () => {
    if (result && onTransfer) {
      onTransfer(result);
    }
  };

  const renderChart = () => {
    if (!result) return null;
    const data = result.chartData;

    switch (result.chartType) {
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
            <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5' }} />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="#4f46e5" fill="#e0e7ff" />
          </AreaChart>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pr-2">
      <div className="max-w-5xl mx-auto space-y-8 pb-20 pt-4 px-4">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold text-slate-900 serif">Intelligent Data Analytics</h2>
          <p className="text-slate-600">Upload CSV or paste data to uncover trends, patterns, and visual insights.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Input Data</label>
              <textarea
                value={rawData}
                onChange={(e) => setRawData(e.target.value)}
                placeholder="Paste CSV data or your dataset here..."
                className="w-full h-64 p-4 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-mono text-xs"
              />
            </div>
            
            <div className="flex gap-4">
              <label className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl transition-colors cursor-pointer text-center font-semibold">
                <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
                Upload File
              </label>
              <button
                onClick={handleAnalyze}
                disabled={loading || !rawData}
                className="flex-[2] bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 transition-colors"
              >
                {loading ? 'Processing...' : 'Run Analysis'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {result ? (
              <>
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm h-80">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Visualization</h4>
                    <button onClick={handleTransfer} className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg uppercase">Pindah ke Writing ✍️</button>
                  </div>
                  <div className="w-full h-full pb-8">
                    <ResponsiveContainer width="100%" height="100%">
                      {renderChart() || <div>No data to visualize</div>}
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-indigo-900 text-white p-8 rounded-2xl shadow-xl space-y-4">
                  <h4 className="font-bold text-indigo-300 uppercase tracking-widest text-xs">AI Insights</h4>
                  <p className="text-indigo-50 leading-relaxed italic">"{result.summary}"</p>
                  <ul className="space-y-2">
                    {result.insights.map((insight, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="text-indigo-400">✦</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                <span className="text-5xl mb-4">📈</span>
                <p>Upload data to see insights</p>
              </div>
            )}
          </div>
        </div>

        {result && result.recommendations.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-2xl">
            <h4 className="text-emerald-800 font-bold mb-4">Strategic Recommendations</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.recommendations.map((rec, i) => (
                <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-emerald-50 text-emerald-900 text-sm">
                  {rec}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataAnalysis;
