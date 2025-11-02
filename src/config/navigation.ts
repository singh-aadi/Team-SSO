// Navigation configuration for role-based access control

import { 
  LayoutDashboard, 
  FileText, 
  TrendingUp, 
  BookOpen, 
  Rocket,
  Briefcase,
  Sliders,
  Construction,
  Radar
} from 'lucide-react';

export interface NavItem {
  path: string;
  label: string;
  icon: any;
  description?: string;
  isWIP?: boolean;
  upcomingFeatures?: string[];
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
    path: '/benchmarks',
    label: 'Industry Benchmarks',
    icon: TrendingUp,
    description: 'Compare your startup against industry standards and competitors. Benchmark your metrics, growth rates, and unit economics against similar companies in your sector.',
    isWIP: true,
    upcomingFeatures: [
      'Real-time industry metrics comparison',
      'Competitor performance tracking',
      'Stage-specific benchmark ranges',
      'Custom peer group selection',
      'Market positioning insights'
    ]
  }
];

// VC Navigation - Reordered per requirements
// Dashboard → Deck Intelligence → VC Mode → SSO Glossary → VC Journey → Industry Benchmarks (WIP)
export const VC_NAV: NavItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Your deal flow & analytics hub'
  },
  {
    path: '/decks',
    label: 'Deck Intelligence',
    icon: FileText,
    description: 'Analyze & compare pitch decks'
  },
  {
    path: '/vc-mode',
    label: 'VC Mode',
    icon: Sliders,
    description: 'Advanced tools & VC context'
  },
  {
    path: '/startup-radar',
    label: 'Startup Radar',
    icon: Radar,
    description: 'Track startups & market intelligence'
  },
  {
    path: '/glossary',
    label: 'SSO Glossary',
    icon: BookOpen,
    description: 'AI-powered knowledge agent'
  },
  {
    path: '/vc-journey',
    label: 'VC Journey',
    icon: Briefcase,
    description: 'Track your entire deal flow from sourcing to investment. Manage pipeline stages, communicate with founders, and collaborate with your team on investment decisions.',
    isWIP: true,
    upcomingFeatures: [
      'Visual deal pipeline with drag-and-drop',
      'Founder communication hub',
      'Investment committee workflows',
      'Portfolio company tracking',
      'Automated follow-up reminders'
    ]
  },
  {
    path: '/benchmarks',
    label: 'Industry Benchmarks',
    icon: Construction,
    description: 'Compare startups against industry standards and competitors. Access real-time market data, growth benchmarks, and positioning insights for informed investment decisions.',
    isWIP: true,
    upcomingFeatures: [
      'Real-time industry metrics comparison',
      'Competitor performance tracking',
      'Stage-specific benchmark ranges',
      'Market trend analysis',
      'Investment thesis validation'
    ]
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
