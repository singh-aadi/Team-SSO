import { useState } from 'react';
import { 
  Mail, 
  Phone, 
  FileText, 
  MessageSquare, 
  Star, 
  Tag,
  Zap,
  Users,
  AlertCircle,
  Settings,
  Filter,
  PieChart,
  BarChart,
  TrendingUp,
  Globe,
  Building,
  DollarSign
} from 'lucide-react';

interface Communication {
  id: string;
  type: 'email' | 'call' | 'note' | 'recording';
  date: string;
  title: string;
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  tags: string[];
  participants: string[];
  keyPoints: string[];
}

interface InsightCard {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
  source: string[];
}

interface FilterOptions {
  industry: string[];
  stage: string[];
  dealSize: string[];
  location: string[];
}

export function DealFlowHub() {
  const [activeTab, setActiveTab] = useState<'overview' | 'ecosystem' | 'analytics'>('ecosystem');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [showCustomization, setShowCustomization] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    industry: [],
    stage: [],
    dealSize: [],
    location: []
  });
  
  // Mock data for demonstration
  const recentCommunications = [
    {
      id: '1',
      type: 'call',
      date: '2025-09-18',
      title: 'Technical Deep Dive - AI Platform',
      summary: 'Discussed scalability plans and AI model architecture',
      sentiment: 'positive',
      tags: ['technical', 'AI', 'architecture'],
      participants: ['Sarah Chen', 'Dr. James Miller'],
      keyPoints: ['Proprietary AI models', 'Cloud-native architecture', 'GPT-5 integration']
    },
    {
      id: '2',
      type: 'email',
      date: '2025-09-19',
      title: 'Market Expansion Strategy',
      summary: 'Outlined European market entry plan',
      sentiment: 'positive',
      tags: ['strategy', 'expansion', 'market-entry'],
      participants: ['Marcus Wong'],
      keyPoints: ['EU regulations compliance', 'Local partnerships', 'Q2 2026 timeline']
    }
  ];

  const generatedInsights = [
    {
      title: 'Strong Technical Foundation',
      description: 'Multiple discussions highlight sophisticated AI architecture and scalable infrastructure',
      impact: 'high',
      category: 'Technology',
      source: ['Technical Deep Dive Call', 'Architecture Review']
    },
    {
      title: 'Market Expansion Readiness',
      description: 'Clear strategy for European market entry with regulatory compliance planning',
      impact: 'high',
      category: 'Strategy',
      source: ['Strategy Email', 'Compliance Meeting']
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Startup Radar</h1>
          <p className="text-slate-600 mt-1">Your intelligent startup tracking and analysis hub</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'overview'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('ecosystem')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'ecosystem'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Personal Ecosystem
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'analytics'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {activeTab === 'ecosystem' && (
        <div className="space-y-6">
          {/* Time Filter */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setSelectedTimeframe('week')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedTimeframe === 'week'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setSelectedTimeframe('month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedTimeframe === 'month'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setSelectedTimeframe('quarter')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedTimeframe === 'quarter'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              This Quarter
            </button>
          </div>

          {/* Communication Stream */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Communication Stream</h2>
            </div>
            <div className="divide-y divide-slate-200">
              {recentCommunications.map((comm) => (
                <div key={comm.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className={`mt-1 p-2 rounded-lg ${
                      comm.type === 'call' ? 'bg-green-100' : 
                      comm.type === 'email' ? 'bg-blue-100' : 
                      comm.type === 'note' ? 'bg-yellow-100' : 'bg-purple-100'
                    }`}>
                      {comm.type === 'call' ? <Phone className="h-5 w-5 text-green-600" /> :
                       comm.type === 'email' ? <Mail className="h-5 w-5 text-blue-600" /> :
                       comm.type === 'note' ? <FileText className="h-5 w-5 text-yellow-600" /> :
                       <MessageSquare className="h-5 w-5 text-purple-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-slate-900">{comm.title}</h3>
                        <span className="text-xs text-slate-500">{comm.date}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{comm.summary}</p>
                      <div className="mt-2 flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-slate-400" />
                          <span className="text-xs text-slate-600">{comm.participants.join(', ')}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {comm.tags.map((tag) => (
                            <span key={tag} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI-Generated Insights */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">AI-Generated Insights</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              {generatedInsights.map((insight, index) => (
                <div key={index} className="border rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      <h3 className="text-sm font-medium text-slate-900">{insight.title}</h3>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      insight.impact === 'high' ? 'bg-red-100 text-red-700' :
                      insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {insight.impact.charAt(0).toUpperCase() + insight.impact.slice(1)} Impact
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">{insight.description}</p>
                  <div className="mt-3 flex items-center space-x-2">
                    <span className="text-xs text-slate-500">Sources:</span>
                    {insight.source.map((src, idx) => (
                      <span key={idx} className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer">
                        {src}{idx < insight.source.length - 1 ? ',' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customization and Filters */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-slate-600" />
                <h2 className="text-lg font-semibold text-slate-900">Filters & Customization</h2>
              </div>
              <button
                onClick={() => setShowCustomization(!showCustomization)}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                <Settings className="h-4 w-4" />
                <span>Customize View</span>
              </button>
            </div>
            <div className={`p-4 space-y-4 ${showCustomization ? '' : 'hidden'}`}>
              {/* Industry Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Industry</label>
                <div className="flex flex-wrap gap-2">
                  {['AI/ML', 'SaaS', 'Fintech', 'Healthcare', 'Enterprise'].map((industry) => (
                    <button
                      key={industry}
                      onClick={() => setFilters(prev => ({
                        ...prev,
                        industry: prev.industry.includes(industry)
                          ? prev.industry.filter(i => i !== industry)
                          : [...prev.industry, industry]
                      }))}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                        filters.industry.includes(industry)
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Building className="h-4 w-4 mr-1" />
                      {industry}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Stage Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Stage</label>
                <div className="flex flex-wrap gap-2">
                  {['Seed', 'Series A', 'Series B', 'Growth', 'Late Stage'].map((stage) => (
                    <button
                      key={stage}
                      onClick={() => setFilters(prev => ({
                        ...prev,
                        stage: prev.stage.includes(stage)
                          ? prev.stage.filter(s => s !== stage)
                          : [...prev.stage, stage]
                      }))}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                        filters.stage.includes(stage)
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      {stage}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deal Size Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Deal Size</label>
                <div className="flex flex-wrap gap-2">
                  {['< $1M', '$1M-$5M', '$5M-$20M', '$20M+'].map((size) => (
                    <button
                      key={size}
                      onClick={() => setFilters(prev => ({
                        ...prev,
                        dealSize: prev.dealSize.includes(size)
                          ? prev.dealSize.filter(s => s !== size)
                          : [...prev.dealSize, size]
                      }))}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                        filters.dealSize.includes(size)
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                <div className="flex flex-wrap gap-2">
                  {['North America', 'Europe', 'Asia', 'Other'].map((location) => (
                    <button
                      key={location}
                      onClick={() => setFilters(prev => ({
                        ...prev,
                        location: prev.location.includes(location)
                          ? prev.location.filter(l => l !== location)
                          : [...prev.location, location]
                      }))}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                        filters.location.includes(location)
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Globe className="h-4 w-4 mr-1" />
                      {location}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex space-x-4">
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Star className="h-4 w-4" />
              <span>Save Insights</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
              <AlertCircle className="h-4 w-4" />
              <span>Generate Report</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Analytics Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total Deal Flow</p>
                  <h3 className="text-2xl font-bold text-slate-900">247</h3>
                  <p className="text-sm text-green-600">↑ 12% vs last month</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Building className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Active Industries</p>
                  <h3 className="text-2xl font-bold text-slate-900">8</h3>
                  <p className="text-xs text-slate-600 mt-1">Most active: AI/ML</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Avg Deal Size</p>
                  <h3 className="text-2xl font-bold text-slate-900">$5.2M</h3>
                  <p className="text-sm text-blue-600">↑ 8% vs last quarter</p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Industry Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Industry Distribution</h3>
              <div className="space-y-4">
                {[
                  { name: 'AI/ML', percentage: 35, count: 86 },
                  { name: 'SaaS', percentage: 25, count: 62 },
                  { name: 'Fintech', percentage: 20, count: 49 },
                  { name: 'Healthcare', percentage: 15, count: 37 },
                  { name: 'Enterprise', percentage: 5, count: 13 }
                ].map((industry) => (
                  <div key={industry.name}>
                    <div className="flex justify-between text-sm text-slate-600 mb-1">
                      <span>{industry.name}</span>
                      <span>{industry.count} deals</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${industry.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deal Stage Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Deal Stage Distribution</h3>
              <div className="space-y-4">
                {[
                  { name: 'Seed', percentage: 40, count: 99 },
                  { name: 'Series A', percentage: 30, count: 74 },
                  { name: 'Series B', percentage: 20, count: 49 },
                  { name: 'Growth', percentage: 7, count: 17 },
                  { name: 'Late Stage', percentage: 3, count: 8 }
                ].map((stage) => (
                  <div key={stage.name}>
                    <div className="flex justify-between text-sm text-slate-600 mb-1">
                      <span>{stage.name}</span>
                      <span>{stage.count} deals</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${stage.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Geographic Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Geographic Distribution</h3>
              <div className="space-y-4">
                {[
                  { name: 'North America', percentage: 45, count: 111 },
                  { name: 'Europe', percentage: 30, count: 74 },
                  { name: 'Asia', percentage: 20, count: 49 },
                  { name: 'Other', percentage: 5, count: 13 }
                ].map((region) => (
                  <div key={region.name}>
                    <div className="flex justify-between text-sm text-slate-600 mb-1">
                      <span>{region.name}</span>
                      <span>{region.count} deals</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${region.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deal Size Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Deal Size Distribution</h3>
              <div className="space-y-4">
                {[
                  { name: '< $1M', percentage: 30, count: 74 },
                  { name: '$1M-$5M', percentage: 40, count: 99 },
                  { name: '$5M-$20M', percentage: 20, count: 49 },
                  { name: '$20M+', percentage: 10, count: 25 }
                ].map((size) => (
                  <div key={size.name}>
                    <div className="flex justify-between text-sm text-slate-600 mb-1">
                      <span>{size.name}</span>
                      <span>{size.count} deals</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-yellow-600 h-2 rounded-full"
                        style={{ width: `${size.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Deal Flow Overview</h2>
          {/* Overview content will be added here */}
        </div>
      )}
    </div>
  );
}
