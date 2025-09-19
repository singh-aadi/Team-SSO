import React from 'react';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  BookOpen,
  Route,
  Target,
  TrendingUp,
  HelpCircle,
  AlertTriangle,
  Mail,
  Phone,
  TrendingDown,
  LineChart,
  Sliders
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  userType: 'founder' | 'vc';
}

const founderNavigation = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'decks', name: 'Deck Intelligence', icon: FileText },
  { id: 'benchmarks', name: 'Benchmarks', icon: BarChart3 },
  { id: 'glossary', name: 'SSO Glossary™', icon: BookOpen },
  { id: 'journeys', name: 'User Journeys', icon: Route },
  { id: 'guide', name: 'SSO Guide', icon: HelpCircle },
];

const vcNavigation = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'decks', name: 'Deck Intelligence', icon: FileText },
  { id: 'risk-assessment', name: 'Risk Analysis', icon: AlertTriangle },
  { id: 'communication', name: 'Communication Analysis', icon: Mail },
  { id: 'calls', name: 'Call Transcripts', icon: Phone },
  { id: 'competitive', name: 'Market Analysis', icon: Target },
  { id: 'insights', name: 'Portfolio Insights', icon: TrendingUp },
  { id: 'benchmarks', name: 'Industry Benchmarks', icon: BarChart3 },
  { id: 'growth', name: 'Growth Forecast', icon: LineChart },
  { id: 'weights', name: 'Evaluation Weights', icon: Sliders },
];

export function Sidebar({ activeView, onViewChange, userType }: SidebarProps) {
  const navigation = userType === 'founder' ? founderNavigation : vcNavigation;
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

    </aside>
  );
}