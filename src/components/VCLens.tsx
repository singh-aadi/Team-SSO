import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calendar, 
  BarChart3, 
  ArrowLeft,
  Activity
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface Company {
  filename: string;
  displayName: string;
  versionCount: number;
  firstAnalysis: string | null;
  lastAnalysis: string;
  scoreHistory: number[];
  minScore: number | null;
  maxScore: number | null;
  scoreChange: number;
  trend: 'improving' | 'declining' | 'stable';
  hasHistory: boolean;
  source?: 'pitch_deck' | 'radar';
  needsDeck?: boolean;
  radarId?: string;
  headline?: string;
  description?: string;
  category?: string;
  fundingStage?: string;
}

interface Version {
  id: string;
  version: number;
  analyzedAt: string;
  overallScore: number;
  sections: {
    name: string;
    score: number;
    strengths: string[];
    improvements: string[];
  }[];
  extractedMetrics: any;
}

interface VersionHistory {
  filename: string;
  displayName: string;
  versionCount: number;
  versions: Version[];
  summary: {
    firstAnalysis: string;
    lastAnalysis: string;
    overallChange: number;
    overallChangePercent: number;
    trend: string;
    sectionChanges: {
      name: string;
      firstScore: number;
      lastScore: number;
      change: number;
      changePercent: string;
      trend: string;
    }[];
  };
}

export default function VCLens() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [versionHistory, setVersionHistory] = useState<VersionHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getVCLensCompanies();
      setCompanies(response.companies || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load VC Lens data');
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVersionHistory = async (filename: string) => {
    try {
      setError(null);
      const response = await api.getVCLensHistory(filename);
      setVersionHistory(response);
      setSelectedCompany(filename);
    } catch (err: any) {
      setError(err.message || 'Failed to load version history');
      console.error('Error fetching version history:', err);
    }
  };

  const handleBack = () => {
    setSelectedCompany(null);
    setVersionHistory(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatScore = (score: number) => {
    return (score * 100).toFixed(0);
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (trend === 'declining') return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <Minus className="w-5 h-5 text-gray-400" />;
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'improving') return 'text-green-600 bg-green-50';
    if (trend === 'declining') return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  // Company List View
  if (!selectedCompany) {
    return (
      <div className="min-h-screen bg-gray-50 p-3">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600" />
              VC Lens
            </h1>
            <p className="text-gray-600 mt-2">
              Track how pitch deck scores evolve over time. Analyze multiple versions to see improvements and trends.
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Companies Grid */}
          {!loading && companies.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map((company) => (
                <div
                  key={company.filename}
                  onClick={() => !company.needsDeck && fetchVersionHistory(company.filename)}
                  className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 ${
                    company.needsDeck ? 'border-2 border-amber-300 cursor-default' : 'cursor-pointer'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-lg line-clamp-2">
                          {company.displayName}
                        </h3>
                        {company.needsDeck && (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 whitespace-nowrap">
                            Pitch Deck Needed
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {company.needsDeck 
                          ? `From Startup Radar • ${company.category || 'N/A'}` 
                          : `${company.versionCount} version${company.versionCount > 1 ? 's' : ''}`
                        }
                      </p>
                    </div>
                    {!company.needsDeck && getTrendIcon(company.trend)}
                  </div>

                  {/* Radar Company Info */}
                  {company.needsDeck && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {company.headline || company.description}
                      </p>
                      {company.fundingStage && (
                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-purple-50 text-purple-700">
                          {company.fundingStage}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Score History Sparkline */}
                  {company.hasHistory && !company.needsDeck && (
                    <div className="mb-4">
                      <ResponsiveContainer width="100%" height={60}>
                        <LineChart data={company.scoreHistory.map((score, idx) => ({ score: score * 100, version: idx + 1 }))}>
                          <Line 
                            type="monotone" 
                            dataKey="score" 
                            stroke={company.trend === 'improving' ? '#10b981' : company.trend === 'declining' ? '#ef4444' : '#6b7280'} 
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {!company.needsDeck && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Score Range</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatScore(company.minScore)} - {formatScore(company.maxScore)}
                        </p>
                      </div>

                      {company.hasHistory && (
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getTrendColor(company.trend)}`}>
                          {company.scoreChange > 0 ? '+' : ''}{company.scoreChange.toFixed(1)}%
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      {company.needsDeck 
                        ? `Added: ${formatDate(company.lastAnalysis)}`
                        : `Last: ${formatDate(company.lastAnalysis)}`
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && companies.length === 0 && (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Analyzed Decks Yet</h3>
              <p className="text-gray-600">
                Upload and analyze pitch decks to start tracking their evolution over time.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Version History View
  if (!versionHistory) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const formatMonthYear = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  const scoreChartData = versionHistory.versions.map((v) => ({
    version: `v${v.version}`,
    monthYear: formatMonthYear(v.analyzedAt),
    score: v.overallScore * 100,
    date: formatDate(v.analyzedAt)
  }));

  const sectionComparisonData = versionHistory.summary.sectionChanges.map(section => ({
    section: section.name.replace(/ & /g, ' &\n'),
    first: section.firstScore * 100,
    last: section.lastScore * 100,
    change: parseFloat(section.changePercent)
  }));

  // Radar chart data for first vs last version
  const radarData = versionHistory.summary.sectionChanges.map(section => ({
    subject: section.name.split(' ')[0], // First word only for compact display
    'First Version': section.firstScore * 100,
    'Latest Version': section.lastScore * 100,
    fullMark: 100
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-3">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Companies
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {versionHistory.displayName}
          </h1>
          <p className="text-gray-600">
            {versionHistory.versionCount} version{versionHistory.versionCount > 1 ? 's' : ''} analyzed •
            {' '}{formatDate(versionHistory.summary.firstAnalysis)} - {formatDate(versionHistory.summary.lastAnalysis)}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Overall Change</h3>
              {getTrendIcon(versionHistory.summary.trend)}
            </div>
            <p className={`text-3xl font-bold ${
              versionHistory.summary.overallChange > 0 ? 'text-green-600' : 
              versionHistory.summary.overallChange < 0 ? 'text-red-600' : 
              'text-gray-900'
            }`}>
              {versionHistory.summary.overallChange > 0 ? '+' : ''}
              {versionHistory.summary.overallChangePercent.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {formatScore(versionHistory.versions[0].overallScore)} → {formatScore(versionHistory.versions[versionHistory.versions.length - 1].overallScore)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Improved Sections</h3>
            <p className="text-3xl font-bold text-green-600">
              {versionHistory.summary.sectionChanges.filter(s => s.trend === 'improved').length}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              of {versionHistory.summary.sectionChanges.length} total sections
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Versions Tracked</h3>
            <p className="text-3xl font-bold text-blue-600">
              {versionHistory.versionCount}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {Math.ceil((new Date(versionHistory.summary.lastAnalysis).getTime() - new Date(versionHistory.summary.firstAnalysis).getTime()) / (1000 * 60 * 60 * 24))} days span
            </p>
          </div>
        </div>

        {/* Score Timeline Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
            SSO Score Evolution
          </h2>
          <ResponsiveContainer width="100%" height={450}>
            <LineChart data={scoreChartData} margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="monthYear" 
                label={{ value: 'Month - Year', position: 'insideBottom', offset: -10 }}
                height={60}
              />
              <YAxis 
                domain={[0, 100]} 
                label={{ value: 'SSO Score', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                        <p className="font-semibold text-gray-900">{payload[0].payload.version}</p>
                        <p className="text-blue-600 font-bold text-lg">Score: {payload[0].value}/100</p>
                        <p className="text-sm text-gray-500 mt-1">{payload[0].payload.date}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                wrapperStyle={{ paddingTop: '20px' }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 7, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 9 }}
                name="SSO Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Section Changes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Bar Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Section Comparison</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={sectionComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="section" angle={-45} textAnchor="end" height={100} fontSize={12} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="first" fill="#9ca3af" name="First Version" />
                <Bar dataKey="last" fill="#3b82f6" name="Latest Version" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Performance Radar</h2>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="First Version" dataKey="First Version" stroke="#9ca3af" fill="#9ca3af" fillOpacity={0.5} />
                <Radar name="Latest Version" dataKey="Latest Version" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Version Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Version Details</h2>
          <div className="space-y-6">
            {versionHistory.versions.map((version) => (
              <div key={version.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Version {version.version}</h3>
                    <p className="text-sm text-gray-500">{formatDate(version.analyzedAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Overall Score</p>
                    <p className="text-2xl font-bold text-blue-600">{formatScore(version.overallScore)}/100</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {version.sections.map((section, idx) => (
                    <div key={idx} className="bg-gray-50 rounded p-3">
                      <p className="text-xs text-gray-600 mb-1">{section.name}</p>
                      <p className="text-lg font-semibold text-gray-900">{formatScore(section.score)}/100</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
