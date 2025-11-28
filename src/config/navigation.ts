// Navigation configuration for role-based access control

import { 
  LayoutDashboard, 
  FileText, 
  BookOpen, 
  Rocket,
  Briefcase,
  Sliders,
  Radar,
  BarChart3
} from 'lucide-react';

export interface NavItem {
  path: string;
  label: string;
  icon: any;
  description?: string;
  isWIP?: boolean;
  upcomingFeatures?: string[];
  section?: 'core' | 'config' | 'intelligence' | 'knowledge';
}

// Founder Navigation - 5 tabs
export const FOUNDER_NAV: NavItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Overview & your fundraising journey'
  },
  {
    path: '/decks',
    label: 'Deck Intelligence',
    icon: FileText,
    description: 'Upload & analyze your pitch deck'
  },
  {
    path: '/glossary',
    label: 'SSO Glossary',
    icon: BookOpen,
    description: 'AI-powered knowledge agent'
  },
  {
    path: '/founder-journey',
    label: 'Founder Journey',
    icon: Rocket,
    description: 'Track your startup milestones'
  },
  {
    path: '/sector-benchmarks',
    label: 'Sector Benchmarking',
    icon: BarChart3,
    description: 'Compare against top 10 companies in your sector with AI-powered insights'
  }
];

// VC Navigation - Grouped by function
// Core Analysis → Configuration → Market Intelligence → Knowledge Base
export const VC_NAV: NavItem[] = [
  // Core Analysis Tools
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Your deal flow & analytics hub',
    section: 'core'
  },
  {
    path: '/decks',
    label: 'Deck Intelligence',
    icon: FileText,
    description: 'Analyze & compare pitch decks',
    section: 'core'
  },
  {
    path: '/vc-journey',
    label: 'VC Journey',
    icon: Briefcase,
    description: 'Track pitch deck evolution and analyze companies with AI',
    section: 'core'
  },
  
  // Configuration & Preferences
  {
    path: '/vc-mode',
    label: 'VC Mode',
    icon: Sliders,
    description: 'Advanced tools & VC context',
    section: 'config'
  },
  
  // Market Intelligence
  {
    path: '/startup-radar',
    label: 'Startup Radar',
    icon: Radar,
    description: 'Track startups & market intelligence',
    section: 'intelligence'
  },
  {
    path: '/sector-benchmarks',
    label: 'Sector Benchmarking',
    icon: BarChart3,
    description: 'Compare against top 10 companies per sector with AI-powered insights',
    section: 'intelligence'
  },
  
  // Knowledge Base
  {
    path: '/glossary',
    label: 'SSO Glossary',
    icon: BookOpen,
    description: 'AI-powered knowledge agent',
    section: 'knowledge'
  }
];

// Get navigation based on user role
export function getNavigationForRole(role: 'founder' | 'vc' | null): NavItem[] {
  if (role === 'founder') {
    return FOUNDER_NAV;
  } else if (role === 'vc') {
    return VC_NAV;
  }
  // Default to founder nav if no role (shouldn't happen, but safe fallback)
  return FOUNDER_NAV;
}

// Check if a path is accessible for a given role
export function canAccessPath(path: string, role: 'founder' | 'vc' | null): boolean {
  const nav = getNavigationForRole(role);
  return nav.some(item => path.startsWith(item.path));
}
