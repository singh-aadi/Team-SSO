import React from 'react';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  BookOpen,
  Route,
  Target,
  TrendingUp
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const navigation = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'decks', name: 'Deck Intelligence', icon: FileText },
  { id: 'benchmarks', name: 'Benchmarks', icon: BarChart3 },
  { id: 'glossary', name: 'SSO Glossary™', icon: BookOpen },
  { id: 'journeys', name: 'User Journeys', icon: Route },
  { id: 'competitive', name: 'Competitive Audit', icon: Target },
  { id: 'insights', name: 'Insight Hub', icon: TrendingUp },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen">
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="font-medium">{item.name}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-gradient-to-r from-blue-800 to-teal-600 rounded-lg p-4 text-white">
          <h3 className="font-semibold text-sm">SSO Pro</h3>
          <p className="text-xs text-blue-100 mt-1">Unlock advanced analytics</p>
          <button className="mt-2 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1 rounded transition-colors">
            Upgrade
          </button>
        </div>
      </div>
    </aside>
  );
}