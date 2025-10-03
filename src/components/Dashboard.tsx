import { useNavigate } from 'react-router';
import { 
  Upload, 
  BarChart3, 
  BookOpen, 
  FileText,
  Target,
  Users
} from 'lucide-react';

interface DashboardProps {
  userType: 'founder' | 'vc';
}

export function Dashboard({ userType }: DashboardProps) {
  const navigate = useNavigate();
  const founderActions = [
    {
      title: 'Upload Pitch Deck',
      description: 'Get instant feedback and SSO Readiness Score™',
      icon: Upload,
      action: () => navigate('/decks'),
      color: 'blue'
    },
    {
      title: 'Benchmark Metrics',
      description: 'Compare your KPIs against industry standards',
      icon: BarChart3,
      action: () => navigate('/benchmarks'),
      color: 'teal'
    },
    {
      title: 'Check Definitions',
      description: 'Ensure consistent metric definitions',
      icon: BookOpen,
      action: () => navigate('/glossary'),
      color: 'orange'
    }
  ];

  const vcActions = [
    {
      title: 'Analyze Deals',
      description: 'Compare multiple decks side-by-side',
      icon: FileText,
      action: () => navigate('/decks'),
      color: 'blue'
    },
    {
      title: 'Due Diligence',
      description: 'Benchmark portfolio companies',
      icon: Target,
      action: () => navigate('/benchmarks'),
      color: 'teal'
    },
    {
      title: 'Check Definitions',
      description: 'Standardize metrics across portfolio',
      icon: BookOpen,
      action: () => navigate('/glossary'),
      color: 'orange'
    }
  ];

  const actions = userType === 'founder' ? founderActions : vcActions;

  const stats = [
    { label: 'Decks Analyzed', value: '2,847', icon: FileText, change: '+12%' },
    { label: 'Companies Benchmarked', value: '1,205', icon: Users, change: '+8%' },
    { label: 'Avg SSO Score™', value: '7.2/10', icon: Target, change: '+0.3' },
    { label: 'Term Consistency', value: '92%', icon: BookOpen, change: '+7%' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {userType === 'founder' ? 'Founder' : 'Investor'}
          </h1>
          <p className="text-slate-600 mt-1">
            {userType === 'founder' 
              ? 'Ready to optimize your fundraising strategy?' 
              : 'Let\'s analyze your deal flow efficiently.'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">SSO Platform v2.1</p>
          <p className="text-xs text-slate-400">by Team SSO</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1">{stat.change}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <Icon className="h-6 w-6 text-slate-600" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {actions.map((action, index) => {
          const Icon = action.icon;
          const colorClasses = {
            blue: 'from-blue-800 to-blue-600 hover:from-blue-900 hover:to-blue-700',
            teal: 'from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600',
            orange: 'from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600'
          };
          
          return (
            <button
              key={index}
              onClick={action.action}
              className={`bg-gradient-to-br ${colorClasses[action.color as keyof typeof colorClasses]} text-white rounded-xl p-6 text-left transition-all transform hover:scale-105 shadow-lg hover:shadow-xl`}
            >
              <Icon className="h-8 w-8 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
              <p className="text-sm opacity-90">{action.description}</p>
            </button>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            {
              action: 'Deck analyzed: "FinTech Series A"',
              score: 'SSO Score™: 8.2/10',
              time: '2 hours ago',
              status: 'success'
            },
            {
              action: 'Benchmark completed: SaaS metrics',
              score: '65th percentile CAC',
              time: '4 hours ago',
              status: 'info'
            },
            {
              action: 'Glossary updated: Revenue definition',
              score: 'Consistency improved',
              time: '1 day ago',
              status: 'warning'
            }
          ].map((item, index) => (
            <div key={index} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  item.status === 'success' ? 'bg-green-500' :
                  item.status === 'info' ? 'bg-blue-500' : 'bg-orange-500'
                }`}></div>
                <div>
                  <p className="font-medium text-slate-900">{item.action}</p>
                  <p className="text-sm text-slate-600">{item.score}</p>
                </div>
              </div>
              <p className="text-sm text-slate-500">{item.time}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SSO Watermark */}
      <div className="text-center py-4">
        <p className="text-xs text-slate-400">Powered by Team SSO - Startup Scout & Optioneers</p>
      </div>
    </div>
  );
}