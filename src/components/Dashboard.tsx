import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { 
  Upload, 
  FileText,
  Target,
  GitCompare,
  Download,
  ArrowRight,
  Radar,
  Sliders,
  ChevronRight,
  Sparkles,
  Clock,
  Construction,
  BookOpen,
  Activity,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { api } from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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

  // VC Dashboard Journey Steps
  const vcJourneySteps = [
    {
      number: 1,
      title: 'Analyze Pitch Deck',
      description: 'Upload startup pitch deck and get AI-powered analysis with SSO Score™',
      icon: FileText,
      action: () => navigate('/decks'),
      color: 'blue',
      status: 'ready'
    },
    {
      number: 2,
      title: 'Compare Reports',
      description: 'Side-by-side comparison of multiple startup analyses',
      icon: GitCompare,
      action: () => navigate('/decks'),
      color: 'teal',
      status: 'ready',
      subtext: 'Compare deal opportunities'
    },
    {
      number: 3,
      title: 'Discover Startups',
      description: 'Browse curated startups and track emerging opportunities',
      icon: Radar,
      action: () => navigate('/startup-radar'),
      color: 'purple',
      status: 'ready'
    },
    {
      number: 4,
      title: 'VC Context & Mode',
      description: 'Deep-dive analysis and custom evaluation frameworks',
      icon: Sliders,
      action: () => navigate('/vc-mode'),
      color: 'indigo',
      status: 'ready'
    }
  ];

  // Founder Dashboard Journey Steps
  const founderJourneySteps = [
    {
      number: 1,
      title: 'Upload Pitch Deck',
      description: 'Get instant AI feedback and SSO Readiness Score™',
      icon: Upload,
      action: () => navigate('/decks'),
      color: 'blue',
      status: 'ready'
    },
    {
      number: 2,
      title: 'View Report',
      description: 'Detailed analysis with strengths, gaps, and recommendations',
      icon: FileText,
      action: () => navigate('/decks'),
      color: 'teal',
      status: 'ready'
    },
    {
      number: 3,
      title: 'Track Your Journey',
      description: 'Monitor fundraising milestones and progress',
      icon: Target,
      action: () => navigate('/founder-journey'),
      color: 'purple',
      status: 'ready'
    }
  ];

  const journeySteps = userType === 'vc' ? vcJourneySteps : founderJourneySteps;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {userType === 'vc' ? 'VC Dashboard' : 'Founder Dashboard'}
          </h1>
          <p className="text-slate-600 mt-1 text-lg">
            {userType === 'founder' 
              ? 'Your journey to successful fundraising starts here' 
              : 'Your deal flow analysis and portfolio management hub'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-700">SSO Platform v2.1</p>
            <p className="text-xs text-slate-500">by Team SSO</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-teal-600 rounded-lg flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      {/* Your Journey Section */}
      <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl p-8 border border-blue-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-600 rounded-lg flex items-center justify-center">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {userType === 'vc' ? 'Your Deal Flow Journey' : 'Your Fundraising Journey'}
            </h2>
            <p className="text-slate-600">
              {userType === 'vc' 
                ? 'Follow this workflow to analyze and compare startup opportunities' 
                : 'Follow these steps to prepare and improve your pitch'}
            </p>
          </div>
        </div>

        {/* Journey Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {journeySteps.map((step, index) => {
            const Icon = step.icon;
            const colorClasses: any = {
              blue: 'from-blue-600 to-blue-700',
              teal: 'from-teal-600 to-teal-700',
              purple: 'from-purple-600 to-purple-700',
              indigo: 'from-indigo-600 to-indigo-700'
            };
            
            return (
              <button
                key={index}
                onClick={step.action}
                className="group bg-white rounded-xl p-6 text-left transition-all hover:shadow-xl border-2 border-transparent hover:border-blue-200"
              >
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${colorClasses[step.color]} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Step {step.number}
                      </span>
                      <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* VC Lens Stats - VC Only */}
      {userType === 'vc' && <VCLensStats />}

      {/* Supporting Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SSO Glossary */}
        <button
          onClick={() => navigate('/glossary')}
          className="group bg-white rounded-xl p-6 text-left border-2 border-slate-200 hover:border-orange-300 hover:shadow-lg transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">
                  SSO Glossary™
                </h3>
                <p className="text-xs text-slate-500">AI-Powered Knowledge Agent</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            AI-powered glossary with PhD-level insights on 200+ startup metrics, benchmarks, and investment frameworks. Get instant clarification on terminology.
          </p>
        </button>

        {/* Industry Benchmarks - WIP */}
        <div className="relative bg-slate-50 rounded-xl p-6 border-2 border-dashed border-slate-300">
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full flex items-center space-x-1">
              <Construction className="h-3 w-3" />
              <span>WIP</span>
            </span>
          </div>
          <div className="flex items-start space-x-3 mb-4">
            <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center">
              <Construction className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-500">
                Industry Benchmarks
              </h3>
              <p className="text-xs text-slate-400">Coming Soon</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">
            Compare startup metrics against industry standards and competitors. Deep market analysis and competitive positioning insights.
          </p>
        </div>
      </div>

      {/* Recent Activity - Moved to Bottom */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
            </div>
            <span className="text-xs text-slate-500">Last 7 days</span>
          </div>
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
                            isFailed ? (analysis.error_message || 'Analysis failed') : 'Pending analysis'}
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
                           isFailed ? (comparison.error_message || 'Analysis failed') : 'Pending analysis'}
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
                          href={`${API_URL}/decks/compare/${comparison.id}/report/pdf`}
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

// VC Lens Stats Component
function VCLensStats() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<{
    totalCompanies: number;
    withHistory: number;
    improving: number;
    declining: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.getVCLensCompanies();
        const companies = response.companies || [];
        
        setStats({
          totalCompanies: companies.length,
          withHistory: companies.filter((c: any) => c.hasHistory).length,
          improving: companies.filter((c: any) => c.trend === 'improving').length,
          declining: companies.filter((c: any) => c.trend === 'declining').length,
        });
      } catch (error) {
        console.error('Error fetching VC Lens stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats || stats.totalCompanies === 0) {
    return null; // Don't show if no data
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            VC Lens
          </h2>
          <p className="text-sm text-slate-600 mt-1">Track pitch deck evolution over time</p>
        </div>
        <button
          onClick={() => navigate('/vc-lens')}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Total Companies</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{stats.totalCompanies}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">With History</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">{stats.withHistory}</p>
            </div>
            <Clock className="w-8 h-8 text-purple-600 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Improving</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{stats.improving}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">Declining</p>
              <p className="text-3xl font-bold text-red-900 mt-1">{stats.declining}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600 opacity-80" />
          </div>
        </div>
      </div>
    </div>
  );
}