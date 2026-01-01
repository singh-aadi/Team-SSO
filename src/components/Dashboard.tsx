import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { 
  FileText,
  ArrowRight,
  Radar,
  Clock,
  Activity,
  TrendingUp,
  TrendingDown,
  GitCompare
} from 'lucide-react';
import { api } from '../services/api';

interface DashboardProps {
  userType: 'founder' | 'vc';
}

export function Dashboard({ userType }: DashboardProps) {
  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-4xl font-bold mb-2">
          Welcome back, LVX! 👋
        </h1>
      </div>

      {/* Startup Radar Preview - VC Only */}
      {userType === 'vc' && <StartupRadarPreview />}

      {/* Deck Intelligence Summary - VC Only */}
      {userType === 'vc' && <DeckIntelligenceSummary />}

      {/* VC Lens Stats - VC Only */}
      {userType === 'vc' && <VCLensStats />}

      {/* SSO Watermark */}
      <div className="text-center py-4">
        <p className="text-xs text-slate-400">Powered by Team SSO - Startup Scout & Optioneers</p>
      </div>
    </div>
  );
}

// Deck Intelligence Summary Component
function DeckIntelligenceSummary() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<{
    totalAnalyzed: number;
    totalComparisons: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/decks/stats/intelligence`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setStats({
            totalAnalyzed: data.totalAnalyzed || 0,
            totalComparisons: data.totalComparisons || 0
          });
        } else {
          setStats({
            totalAnalyzed: 0,
            totalComparisons: 0
          });
        }
      } catch (error) {
        console.error('Error fetching deck intelligence stats:', error);
        // Set fallback data on error
        setStats({
          totalAnalyzed: 0,
          totalComparisons: 0
        });
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Always show component, even with no stats
  const safeStats = stats || {
    totalAnalyzed: 0,
    totalComparisons: 0
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Deck Intelligence
          </h2>
          <p className="text-sm text-slate-600 mt-1">AI-powered pitch deck analysis & comparison</p>
        </div>
        <button
          onClick={() => navigate('/decks')}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
        >
          Analyze Deck
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {safeStats.totalAnalyzed === 0 && safeStats.totalComparisons === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No decks analyzed yet. Upload your first pitch deck!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Decks Analyzed</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{safeStats.totalAnalyzed}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600 opacity-80" />
          </div>
          <p className="text-xs text-blue-600 mt-3">
            {safeStats.totalAnalyzed === 1 ? '1 pitch deck evaluated' : `${safeStats.totalAnalyzed} pitch decks evaluated`}
          </p>
        </div>

        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-teal-700 font-medium">Decks Compared</p>
              <p className="text-3xl font-bold text-teal-900 mt-1">{safeStats.totalComparisons}</p>
            </div>
            <GitCompare className="w-8 h-8 text-teal-600 opacity-80" />
          </div>
          <p className="text-xs text-teal-600 mt-3">
            {safeStats.totalComparisons === 1 ? '1 comparison made' : `${safeStats.totalComparisons} comparisons made`}
          </p>
        </div>
        </div>
      )}
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
        // Set fallback data on error
        setStats({
          totalCompanies: 0,
          withHistory: 0,
          improving: 0,
          declining: 0
        });
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

  // Always show component with safe fallback values
  const safeStats = stats || {
    totalCompanies: 0,
    withHistory: 0,
    improving: 0,
    declining: 0
  };

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

      {safeStats.totalCompanies === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No pitch deck versions tracked yet. Upload multiple versions of the same deck to track evolution!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Total Companies</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{safeStats.totalCompanies}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">With History</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">{safeStats.withHistory}</p>
            </div>
            <Clock className="w-8 h-8 text-purple-600 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Improving</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{safeStats.improving}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">Declining</p>
              <p className="text-3xl font-bold text-red-900 mt-1">{safeStats.declining}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600 opacity-80" />
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

// Startup Radar Preview Component - Top 4 Sectors
function StartupRadarPreview() {
  const navigate = useNavigate();
  const [sectors, setSectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSectors = async () => {
      try {
        // Fetch top 4 sectors with most startups
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/decks/stats/sectors?limit=4`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 [StartupRadar] Received sectors data:', data);
          console.log('📊 [StartupRadar] Number of sectors:', data?.length);
          setSectors(data || []);
        } else {
          console.error('📊 [StartupRadar] Response not ok:', response.status);
          setSectors([]);
        }
      } catch (error) {
        console.error('📊 [StartupRadar] Error fetching sectors:', error);
        setSectors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSectors();
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

  // Color schemes for top sectors
  const sectorColors = [
    { from: 'from-purple-50', to: 'to-purple-100', text: 'text-purple-900', icon: 'text-purple-600', border: 'border-purple-200' },
    { from: 'from-blue-50', to: 'to-blue-100', text: 'text-blue-900', icon: 'text-blue-600', border: 'border-blue-200' },
    { from: 'from-teal-50', to: 'to-teal-100', text: 'text-teal-900', icon: 'text-teal-600', border: 'border-teal-200' },
    { from: 'from-pink-50', to: 'to-pink-100', text: 'text-pink-900', icon: 'text-pink-600', border: 'border-pink-200' }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Radar className="w-6 h-6 text-purple-600" />
            Startup Radar
          </h2>
          <p className="text-sm text-slate-600 mt-1">Top sectors by startup count</p>
        </div>
        <button
          onClick={() => navigate('/startup-radar')}
          className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {sectors.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <Radar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No startups analyzed yet. Upload a deck to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {sectors.map((sector, index) => {
          const colors = sectorColors[index] || sectorColors[0];
          const startupCount = parseInt(sector.startup_count) || 0;
          
          console.log('🎯 [Sector Card]', {
            sector: sector.sector,
            count: sector.startup_count,
            parsedCount: startupCount,
            index
          });
          
          return (
            <div
              key={`${sector.sector}-${index}`}
              className={`bg-gradient-to-br ${colors.from} ${colors.to} rounded-lg p-5 border-2 ${colors.border} hover:shadow-md transition-all`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center ${colors.icon}`}>
                  <Radar className="w-5 h-5" />
                </div>
                <div className={`text-3xl font-bold ${colors.text}`}>
                  {startupCount}
                </div>
              </div>
              
              <h3 className={`font-semibold ${colors.text} text-base line-clamp-2 min-h-[2.5rem]`}>
                {sector.sector || 'Unknown Sector'}
              </h3>
              
              <p className="text-xs text-slate-600 mt-2">
                {startupCount === 1 ? '1 startup' : `${startupCount} startups`}
              </p>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}