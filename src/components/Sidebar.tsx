import { NavLink, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
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
  Sliders,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  userType: 'founder' | 'vc';
}

const founderNavigation = [
  { path: '/dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { path: '/decks', name: 'Deck Intelligence', icon: FileText },
  { path: '/benchmarks', name: 'Benchmarks', icon: BarChart3 },
  { path: '/glossary', name: 'SSO Glossary™', icon: BookOpen },
  { path: '/founder-journey', name: 'Founder Journey', icon: Route },
];

const vcNavigation = [
  { path: '/dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { path: '/decks', name: 'Deck Intelligence', icon: FileText },
  { path: '/vc-journey', name: 'VC Journey', icon: Route },
  { path: '/startup-radar', name: 'Startup Radar', icon: TrendingUp },
  { path: '/benchmarks', name: 'Industry Benchmarks', icon: BarChart3 },
  { path: '/vc-mode', name: 'VC Mode', icon: Sliders },
  { path: '/glossary', name: 'SSO Glossary™', icon: BookOpen },
];

export function Sidebar({ userType }: SidebarProps) {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const navigation = userType === 'founder' ? founderNavigation : vcNavigation;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col">
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all
                ${isActive
                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }
              `}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}