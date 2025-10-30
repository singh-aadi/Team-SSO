import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { 
  Upload, 
  BarChart3, 
  BookOpen, 
  FileText,
  Target,
  Users,
  GitCompare,
  Download
} from 'lucide-react';
import { api } from '../services/api';

interface DashboardProps {
  userType: 'founder' | 'vc';
}

export function Dashboard({ userType }: DashboardProps) {
  const navigate = useNavigate();
  const [recentComparisons, setRecentComparisons] = useState<any[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [loadingComparisons, setLoadingComparisons] = useState(false);
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);

  // Fetch recent comparisons for VCs
  useEffect(() => {
    const fetchComparisons = async () => {
      if (userType !== 'vc') return;
      
      setLoadingComparisons(true);
      try {
        const comparisons = await api.getRecentComparisons(undefined, 5);
        setRecentComparisons(comparisons);
      } catch (error) {
        console.error('Error fetching comparisons:', error);
      } finally {
        setLoadingComparisons(false);
      }
    };

    fetchComparisons();
  }, [userType]);

  // Fetch recent analyses for Founders
  useEffect(() => {
    const fetchAnalyses = async () => {
      if (userType !== 'founder') return;
      
      setLoadingAnalyses(true);
      try {
        const analyses = await api.getRecentAnalyses(undefined, 5);
        setRecentAnalyses(analyses);
      } catch (error) {
        console.error('Error fetching analyses:', error);
      } finally {
        setLoadingAnalyses(false);
      }
    };

    fetchAnalyses();
  }, [userType]);

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
          {/* Recent Analyses for Founders */}
          {userType === 'founder' && recentAnalyses.length > 0 && (
            <>
              {recentAnalyses.map((analysis) => {
                const isCompleted = analysis.analysis_status === 'completed';
                const isProcessing = analysis.analysis_status === 'processing' || analysis.analysis_status === 'analyzing';
                const isFailed = analysis.analysis_status === 'failed';
                
                return (
                  <div key={analysis.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className={`w-3 h-3 rounded-full ${
                        isCompleted ? 'bg-green-500' :
                        isProcessing ? 'bg-blue-500 animate-pulse' : 
                        isFailed ? 'bg-red-500' : 'bg-orange-500'
                      }`}></div>
                      <FileText className="h-5 w-5 text-slate-400" />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">
                          Deck analyzed: "{analysis.filename}"
                          {analysis.company_name && <span className="text-slate-600"> - {analysis.company_name}</span>}
                        </p>
                        <p className="text-sm text-slate-600">
                          {isCompleted && analysis.sso_score 
                            ? `SSO Score™: ${analysis.sso_score}/10`
                            : isProcessing ? 'Analyzing...' :
                            isFailed ? 'Analysis failed' : 'Pending analysis'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <p className="text-sm text-slate-500">
                        {new Date(analysis.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {isCompleted && (
                        <button
                          onClick={() => navigate(`/decks/${analysis.id}`)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                        >
                          View
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Recent Comparisons for VCs */}
          {userType === 'vc' && recentComparisons.length > 0 && (
            <>
              {recentComparisons.map((comparison) => {
                const isCompleted = comparison.analysis_status === 'completed';
                const isProcessing = comparison.analysis_status === 'processing';
                const isFailed = comparison.analysis_status === 'failed';
                
                return (
                  <div key={comparison.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className={`w-3 h-3 rounded-full ${
                        isCompleted ? 'bg-green-500' :
                        isProcessing ? 'bg-blue-500 animate-pulse' : 
                        isFailed ? 'bg-red-500' : 'bg-orange-500'
                      }`}></div>
                      <GitCompare className="h-5 w-5 text-slate-400" />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">
                          Deck comparison: "{comparison.deck1_filename}" vs "{comparison.deck2_filename}"
                        </p>
                        <p className="text-sm text-slate-600">
                          {isCompleted ? 'Analysis completed' : 
                           isProcessing ? 'Processing...' :
                           isFailed ? 'Analysis failed' : 'Pending analysis'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <p className="text-sm text-slate-500">
                        {new Date(comparison.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {isCompleted && (
                        <a
                          href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/decks/compare/${comparison.id}/report/pdf`}
                          download
                          className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                        >
                          <Download className="h-4 w-4" />
                          <span>PDF</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Empty state for founders with no analyses */}
          {userType === 'founder' && !loadingAnalyses && recentAnalyses.length === 0 && (
            <div className="px-6 py-8 text-center">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-1">No recent deck analyses</p>
              <p className="text-sm text-slate-400">
                Upload your pitch deck in the{' '}
                <button 
                  onClick={() => navigate('/decks')}
                  className="text-blue-600 hover:underline"
                >
                  Upload Pitch Deck
                </button>
                {' '}section to get started
              </p>
            </div>
          )}

          {/* Empty state for VCs with no comparisons */}
          {userType === 'vc' && !loadingComparisons && recentComparisons.length === 0 && (
            <div className="px-6 py-8 text-center">
              <GitCompare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-1">No recent deck comparisons</p>
              <p className="text-sm text-slate-400">
                Upload two decks in the{' '}
                <button 
                  onClick={() => navigate('/decks')}
                  className="text-blue-600 hover:underline"
                >
                  Deck Intelligence
                </button>
                {' '}section to compare them
              </p>
            </div>
          )}

          {/* Loading states */}
          {(loadingComparisons || loadingAnalyses) && (
            <div className="px-6 py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-slate-500 mt-3">Loading recent activity...</p>
            </div>
          )}
        </div>
      </div>

      {/* SSO Watermark */}
      <div className="text-center py-4">
        <p className="text-xs text-slate-400">Powered by Team SSO - Startup Scout & Optioneers</p>
      </div>
    </div>
  );
}