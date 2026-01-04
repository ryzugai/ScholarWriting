
import React from 'react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const navItems = [
    { id: AppView.LITERATURE_REVIEW, label: 'Literature Review', icon: '📚' },
    { id: AppView.COMPOSITION, label: 'Academic Writing', icon: '✍️' },
    { id: AppView.DATA_ANALYSIS, label: 'Data Analysis', icon: '📊' },
  ];

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-full flex flex-col shrink-0">
      <div className="p-6 border-b border-slate-100">
        <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
          <span className="text-2xl">⚡</span> ScholarPulse
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentView === item.id
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm font-bold tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 p-4 rounded-xl">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Power Source</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-slate-700">Gemini 3 Pro Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
