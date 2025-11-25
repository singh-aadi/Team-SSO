import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  RefreshCw,
  BarChart3,
  Building2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Target,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2,
} from 'lucide-react';

interface Sector {
  id: string;
  name: string;
  icon: string;
  companyCount: number;
}

interface Company {
  id: string;
  sector: string;
  company_name: string;
  rank: number;
  logo_url?: string;
  description: string;
  website?: string;
  founded_year?: number;
  common_metrics: any;
  sector_metrics: any;
  last_updated: string;
}

interface Deck {
  id: string;
  filename: string;
  company_name: string;
  sector: string;
}

interface BenchmarkComparison {
  common_metrics: Record<string, any>;
  sector_metrics: Record<string, any>;
}

export function BenchmarkAnalysis() {
  const [activeTab, setActiveTab] = useState<'top10' | 'benchmark'>('top10');
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedView, setExpandedView] = useState(false);

  // Benchmark Your Deck state
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<string>('');
  const [benchmarkData, setBenchmarkData] = useState<any>(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  // Fetch sectors on mount
  useEffect(() => {
    fetchSectors();
    fetchDecks();
  }, []);

  // Fetch companies when sector changes
  useEffect(() => {
    if (selectedSector) {
      fetchCompanies(selectedSector);
    }
  }, [selectedSector]);

  const fetchSectors = async () => {
    try {
      const response = await fetch(`${API_URL}/sector-benchmarks/sectors`);
      const data = await response.json();
      if (data.success) {
        setSectors(data.data);
        if (data.data.length > 0 && !selectedSector) {
          setSelectedSector(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching sectors:', error);
    }
  };

  const fetchCompanies = async (sectorId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/sector-benchmarks/sectors/${sectorId}/companies`);
      const data = await response.json();
      if (data.success) {
        setCompanies(data.data.companies);
        if (data.data.companies.length > 0) {
          setSelectedCompany(data.data.companies[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDecks = async () => {
    try {
      const response = await fetch(`${API_URL}/decks`);
      const data = await response.json();
      if (data.decks) {
        setDecks(data.decks.filter((d: any) => d.analysis_status === 'completed'));
      }
    } catch (error) {
      console.error('Error fetching decks:', error);
    }
  };

  const handleRefreshSector = async () => {
    if (!selectedSector) return;
    
    setRefreshing(true);
    try {
      const response = await fetch(
        `${API_URL}/sector-benchmarks/sectors/${selectedSector}/refresh`,
        { method: 'POST' }
      );
      const data = await response.json();
      if (data.success) {
        await fetchCompanies(selectedSector);
        alert('✅ Sector data refreshed successfully!');
      } else {
        alert(`❌ Error: ${data.error || 'Failed to refresh sector data'}\n\nThis may be due to API rate limits. Please try again in a few minutes.`);
      }
    } catch (error: any) {
      console.error('Error refreshing sector:', error);
      alert(`❌ Failed to refresh sector data\n\nError: ${error.message || 'Network error'}\n\nTip: Check if backend is running and API rate limits haven't been exceeded.`);
    } finally {
      setRefreshing(false);
    }
  };

  const handleBenchmarkDeck = async () => {
    if (!selectedDeck) return;

    setBenchmarkLoading(true);
    setBenchmarkData(null); // Clear previous data
    try {
      const response = await fetch(`${API_URL}/sector-benchmarks/decks/${selectedDeck}/benchmark`);
      const data = await response.json();
      
      if (data.success) {
        setBenchmarkData(data.data);
      } else {
        // Show error message from backend
        alert(`❌ ${data.error || 'Failed to load benchmark data'}`);
        console.error('Benchmark error:', data);
      }
    } catch (error: any) {
      console.error('Error benchmarking deck:', error);
      alert(`❌ Failed to benchmark deck\n\nError: ${error.message || 'Network error'}\n\nPlease check if the backend server is running.`);
    } finally {
      setBenchmarkLoading(false);
    }
  };

  const formatMetricValue = (metric: any) => {
    if (!metric || !metric.value) return 'N/A';
    
    const value = metric.value;
    const unit = metric.unit || '';
    const period = metric.period ? ` (${metric.period})` : '';

    if (unit === 'USD') {
      if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B${period}`;
      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M${period}`;
      if (value >= 1000) return `$${(value / 1000).toFixed(0)}K${period}`;
      return `$${value}${period}`;
    }

    if (unit === 'percent') return `${value}%${period}`;
    
    return `${value}${unit ? ` ${unit}` : ''}${period}`;
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-50';
    if (percentage >= 70) return 'text-blue-600 bg-blue-50';
    if (percentage >= 50) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (rank <= 3) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (rank <= 5) return 'bg-purple-100 text-purple-800 border-purple-300';
    return 'bg-slate-100 text-slate-800 border-slate-300';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Benchmark Analysis</h1>
                <p className="text-slate-600">Compare against top performers in your sector</p>
              </div>
            </div>
            <Sparkles className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('top10')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'top10'
                  ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Award className="h-5 w-5" />
                <span>Top 10 Startups</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('benchmark')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'benchmark'
                  ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Benchmark Your Deck</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'top10' ? (
          <div className="grid grid-cols-12 gap-6">
            {/* Sector Sidebar */}
            <div className="col-span-3">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-slate-900">Sectors</h2>
                  <button
                    onClick={handleRefreshSector}
                    disabled={refreshing || !selectedSector}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                    title="Refresh sector data with AI"
                  >
                    <RefreshCw className={`h-4 w-4 text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="space-y-2">
                  {sectors.map((sector) => (
                    <button
                      key={sector.id}
                      onClick={() => setSelectedSector(sector.id)}
                      className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                        selectedSector === sector.id
                          ? 'bg-blue-50 border-2 border-blue-200 text-blue-900'
                          : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <span className="text-lg flex-shrink-0">{sector.icon}</span>
                          <span className="text-sm font-medium truncate">{sector.name}</span>
                        </div>
                        {sector.companyCount > 0 && (
                          <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full flex-shrink-0">
                            {sector.companyCount}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Companies List */}
            <div className="col-span-4">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <h2 className="font-semibold text-slate-900 mb-4">
                  Top 10 Companies
                  {companies.length > 0 && (
                    <span className="ml-2 text-sm text-slate-500 font-normal">
                      ({companies.length} companies)
                    </span>
                  )}
                </h2>
                
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : companies.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No companies yet</p>
                    <button
                      onClick={handleRefreshSector}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Generate with AI →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {companies.map((company) => (
                      <button
                        key={company.id}
                        onClick={() => setSelectedCompany(company)}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          selectedCompany?.id === company.id
                            ? 'bg-blue-50 border-2 border-blue-300 shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getRankBadgeColor(company.rank)}`}>
                              #{company.rank}
                            </span>
                            <span className="font-medium text-slate-900 text-sm">
                              {company.company_name}
                            </span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2">{company.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-slate-500">
                            {formatMetricValue(company.common_metrics?.revenue)}
                          </span>
                          {company.founded_year && (
                            <span className="text-xs text-slate-400">
                              Est. {company.founded_year}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Company Details */}
            <div className="col-span-5">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                {selectedCompany ? (
                  <div>
                    {/* Company Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold border-2 ${getRankBadgeColor(selectedCompany.rank)}`}>
                            #{selectedCompany.rank}
                          </span>
                          <h2 className="text-2xl font-bold text-slate-900">
                            {selectedCompany.company_name}
                          </h2>
                        </div>
                        <p className="text-slate-600 text-sm mb-3">{selectedCompany.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-slate-500">
                          {selectedCompany.founded_year && (
                            <span>Founded {selectedCompany.founded_year}</span>
                          )}
                          {selectedCompany.website && (
                            <a
                              href={selectedCompany.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                            >
                              <span>Visit website</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Common Metrics */}
                    <div className="mb-6">
                      <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
                        Common Metrics
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(selectedCompany.common_metrics || {}).map(([key, value]: [string, any]) => (
                          <div key={key} className="bg-slate-50 rounded-lg p-3">
                            <div className="text-xs text-slate-500 mb-1 capitalize">
                              {key.replace(/_/g, ' ')}
                            </div>
                            <div className="text-lg font-bold text-slate-900">
                              {formatMetricValue(value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sector-Specific Metrics */}
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
                        <BarChart3 className="h-4 w-4 mr-2 text-purple-600" />
                        Sector-Specific Metrics
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(selectedCompany.sector_metrics || {}).map(([key, value]: [string, any]) => (
                          <div key={key} className="bg-purple-50 rounded-lg p-3">
                            <div className="text-xs text-purple-600 mb-1 capitalize">
                              {key.replace(/_/g, ' ')}
                            </div>
                            <div className="text-lg font-bold text-purple-900">
                              {formatMetricValue(value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Building2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Select a company to view details</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Benchmark Your Deck Tab */
          <div className="space-y-6">
            {/* Deck Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Select Your Deck</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Choose Deck to Benchmark
                  </label>
                  <select
                    value={selectedDeck}
                    onChange={(e) => setSelectedDeck(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a deck...</option>
                    {decks.map((deck) => (
                      <option key={deck.id} value={deck.id}>
                        {deck.company_name} - {deck.filename}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleBenchmarkDeck}
                    disabled={!selectedDeck || benchmarkLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {benchmarkLoading ? 'Analyzing...' : 'Show Benchmark Comparison'}
                  </button>
                </div>
              </div>
            </div>

            {/* Benchmark Results */}
            {benchmarkData && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Benchmark Comparison</h2>
                    <p className="text-sm text-slate-600">
                      {benchmarkData.deck.companyName} vs Top {benchmarkData.topCompanies.length} Companies in {benchmarkData.deck.sector}
                    </p>
                  </div>
                  <button
                    onClick={() => setExpandedView(!expandedView)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Maximize2 className="h-5 w-5 text-slate-600" />
                  </button>
                </div>

                {/* Missing Metrics Warning */}
                {benchmarkData.comparisons.missingMetrics && benchmarkData.comparisons.missingMetrics.length > 0 && (
                  <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">⚠️</span>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800">
                          Missing Metrics Detected
                        </h3>
                        <p className="mt-1 text-sm text-amber-700">
                          The following metrics could not be extracted from your pitch deck: {' '}
                          <span className="font-semibold">
                            {benchmarkData.comparisons.missingMetrics.join(', ').replace(/_/g, ' ')}
                          </span>
                        </p>
                        <p className="mt-2 text-xs text-amber-600">
                          💡 Tip: Include these metrics in your deck for a complete benchmark comparison.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comparison Grid */}
                <div className="space-y-6">
                  {/* Common Metrics Comparison */}
                  {Object.keys(benchmarkData.comparisons.common_metrics || {}).length > 0 && (
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-3">Common Metrics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(benchmarkData.comparisons.common_metrics).map(([key, comparison]: [string, any]) => (
                          <div key={key} className={`rounded-lg p-4 ${comparison.available === false ? 'bg-slate-100 border-2 border-dashed border-slate-300' : 'bg-slate-50'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-slate-700 capitalize flex items-center gap-2">
                                {key.replace(/_/g, ' ')}
                                {comparison.available === false && (
                                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-normal">
                                    ⚠️ N/A
                                  </span>
                                )}
                              </span>
                              {comparison.available !== false ? (
                                <span className={`px-3 py-1 rounded-full text-sm font-bold ${getPercentageColor(comparison.percentage)}`}>
                                  {comparison.percentage}%
                                </span>
                              ) : (
                                <span className="px-3 py-1 rounded-full text-sm font-bold bg-slate-200 text-slate-500">
                                  N/A
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-600">
                              <div>
                                <div className="text-slate-500">Your Deck</div>
                                <div className={`font-medium ${comparison.available === false ? 'text-slate-400 italic' : ''}`}>
                                  {comparison.available === false ? 'Not available' : formatMetricValue({ value: comparison.deckValue, unit: comparison.unit })}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-slate-500">#1 Company</div>
                                <div className="font-medium">{formatMetricValue({ value: comparison.firstPlaceValue, unit: comparison.unit })}</div>
                              </div>
                            </div>
                            {comparison.available !== false && (
                              <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    comparison.percentage >= 90 ? 'bg-green-500' :
                                    comparison.percentage >= 70 ? 'bg-blue-500' :
                                    comparison.percentage >= 50 ? 'bg-orange-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(comparison.percentage, 100)}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sector-Specific Metrics Comparison */}
                  {Object.keys(benchmarkData.comparisons.sector_metrics || {}).length > 0 && (
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-3">Sector-Specific Metrics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(benchmarkData.comparisons.sector_metrics).map(([key, comparison]: [string, any]) => (
                          <div key={key} className={`rounded-lg p-4 ${comparison.available === false ? 'bg-purple-100 border-2 border-dashed border-purple-300' : 'bg-purple-50'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-purple-700 capitalize flex items-center gap-2">
                                {key.replace(/_/g, ' ')}
                                {comparison.available === false && (
                                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-normal">
                                    ⚠️ N/A
                                  </span>
                                )}
                              </span>
                              {comparison.available !== false ? (
                                <span className={`px-3 py-1 rounded-full text-sm font-bold ${getPercentageColor(comparison.percentage)}`}>
                                  {comparison.percentage}%
                                </span>
                              ) : (
                                <span className="px-3 py-1 rounded-full text-sm font-bold bg-slate-200 text-slate-500">
                                  N/A
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-xs text-purple-600">
                              <div>
                                <div className="text-purple-500">Your Deck</div>
                                <div className={`font-medium ${comparison.available === false ? 'text-slate-400 italic' : ''}`}>
                                  {comparison.available === false ? 'Not available' : formatMetricValue({ value: comparison.deckValue, unit: comparison.unit })}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-purple-500">#1 Company</div>
                                <div className="font-medium">{formatMetricValue({ value: comparison.firstPlaceValue, unit: comparison.unit })}</div>
                              </div>
                            </div>
                            {comparison.available !== false && (
                              <div className="mt-2 w-full bg-purple-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full bg-purple-600 transition-all"
                                  style={{ width: `${Math.min(comparison.percentage, 100)}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No data message */}
                  {Object.keys(benchmarkData.comparisons.common_metrics || {}).length === 0 &&
                   Object.keys(benchmarkData.comparisons.sector_metrics || {}).length === 0 && (
                    <div className="text-center py-12">
                      <BarChart3 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">
                        No comparable metrics found. The deck may be missing extracted metrics or the sector doesn't have benchmark data yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
