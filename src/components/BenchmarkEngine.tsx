import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Target
} from 'lucide-react';
import { VerticalBenchmarks } from './VerticalBenchmarks';

interface BenchmarkEngineProps {
  userType: 'founder' | 'vc';
}

export function BenchmarkEngine({ userType }: BenchmarkEngineProps) {
  const [selectedStage, setSelectedStage] = useState('seed');
  const [selectedSector, setSelectedSector] = useState('saas');
  const [view, setView] = useState<'overview' | 'vertical'>('overview');

  const stages = [
    { id: 'pre-seed', name: 'Pre-Seed' },
    { id: 'seed', name: 'Seed' },
    { id: 'series-a', name: 'Series A' },
    { id: 'series-b', name: 'Series B' }
  ];

  const sectors = [
    { id: 'saas', name: 'SaaS' },
    { id: 'fintech', name: 'FinTech' },
    { id: 'consumer', name: 'Consumer' },
    { id: 'deeptech', name: 'DeepTech' }
  ];

  const benchmarkData = {
    seed: {
      saas: {
        cac: { value: 127, percentile: 65, benchmark: 145, trend: 'down' },
        ltv: { value: 1840, percentile: 72, benchmark: 1650, trend: 'up' },
        mrr: { value: 45000, percentile: 58, benchmark: 52000, trend: 'down' },
        churn: { value: 3.2, percentile: 68, benchmark: 4.1, trend: 'up' },
        nps: { value: 42, percentile: 75, benchmark: 38, trend: 'up' }
      }
    }
  };

  const currentBenchmarks = benchmarkData[selectedStage as keyof typeof benchmarkData]?.[selectedSector as keyof typeof benchmarkData.seed] || benchmarkData.seed.saas;

  const metrics = [
    {
      key: 'cac',
      name: 'Customer Acquisition Cost',
      icon: DollarSign,
      format: (val: number) => `$${val}`,
      description: 'Cost to acquire one customer'
    },
    {
      key: 'ltv',
      name: 'Lifetime Value',
      icon: TrendingUp,
      format: (val: number) => `$${val.toLocaleString()}`,
      description: 'Revenue from average customer'
    },
    {
      key: 'mrr',
      name: 'Monthly Recurring Revenue',
      icon: BarChart3,
      format: (val: number) => `$${val.toLocaleString()}`,
      description: 'Predictable monthly revenue'
    },
    {
      key: 'churn',
      name: 'Monthly Churn Rate',
      icon: Activity,
      format: (val: number) => `${val}%`,
      description: 'Customers lost per month'
    },
    {
      key: 'nps',
      name: 'Net Promoter Score',
      icon: Users,
      format: (val: number) => `${val}`,
      description: 'Customer satisfaction score'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Market & Metrics Benchmark Engine</h1>
          <p className="text-slate-600 mt-1">
            {userType === 'founder' 
              ? 'Compare your metrics against industry benchmarks'
              : 'Validate portfolio company performance against market standards'}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setView('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              view === 'overview'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setView('vertical')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              view === 'vertical'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Vertical Metrics
          </button>
        </div>
      </div>

      {view === 'overview' ? (
        <>
            {/* Filters */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Select Benchmark Parameters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Stage</label>
                <div className="grid grid-cols-2 gap-2">
                  {stages.map((stage) => (
                    <button
                      key={stage.id}
                      onClick={() => setSelectedStage(stage.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedStage === stage.id
                          ? 'bg-blue-800 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {stage.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Sector</label>
                <div className="grid grid-cols-2 gap-2">
                  {sectors.map((sector) => (
                    <button
                      key={sector.id}
                      onClick={() => setSelectedSector(sector.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedSector === sector.id
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {sector.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {metrics.map((metric) => {
              const data = currentBenchmarks[metric.key as keyof typeof currentBenchmarks];
              const Icon = metric.icon;
              const TrendIcon = data.trend === 'up' ? ArrowUpRight : ArrowDownRight;
              const percentileColor = data.percentile >= 75 ? 'text-green-600' : 
                                   data.percentile >= 50 ? 'text-orange-600' : 'text-red-600';
              const percentileBg = data.percentile >= 75 ? 'bg-green-50' : 
                                  data.percentile >= 50 ? 'bg-orange-50' : 'bg-red-50';

              return (
                <div key={metric.key} className="bg-white rounded-lg border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="h-8 w-8 text-slate-600" />
                    <TrendIcon className={`h-5 w-5 ${data.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                  </div>
                  
                  <h3 className="font-semibold text-slate-900 mb-1">{metric.name}</h3>
                  <p className="text-xs text-slate-500 mb-4">{metric.description}</p>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600">Your Value</span>
                        <span className="text-xl font-bold text-slate-900">{metric.format(data.value)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Market Median</span>
                        <span className="text-sm text-slate-700">{metric.format(data.benchmark)}</span>
                      </div>
                    </div>
                    
                    <div className={`${percentileBg} rounded-lg p-3`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Percentile Ranking</span>
                        <span className={`text-lg font-bold ${percentileColor}`}>{data.percentile}th</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                        <div
                          className={`h-2 rounded-full ${
                            data.percentile >= 75 ? 'bg-green-500' :
                            data.percentile >= 50 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${data.percentile}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Insights Panel */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Benchmark Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Target className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h3 className="font-medium text-green-800">Strong Performers</h3>
                    <p className="text-sm text-slate-600">LTV and NPS are above market median, indicating strong product-market fit</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Target className="h-5 w-5 text-orange-600 mt-1" />
                  <div>
                    <h3 className="font-medium text-orange-800">Areas for Improvement</h3>
                    <p className="text-sm text-slate-600">CAC and MRR below benchmark - focus on growth efficiency</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-800 to-teal-600 text-white rounded-lg p-6">
                <h3 className="font-semibold mb-2">SSO Recommendations</h3>
                <ul className="text-sm text-blue-100 space-y-2">
                  <li>• Optimize acquisition channels to reduce CAC by 15%</li>
                  <li>• Implement usage-based pricing to increase LTV</li>
                  <li>• Focus on product stickiness to maintain low churn</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center py-4">
            <p className="text-xs text-slate-400">Benchmarks powered by Team SSO Market Intelligence</p>
          </div>
        </>
      ) : (
        <VerticalBenchmarks />
      )}
    </div>
  );
}