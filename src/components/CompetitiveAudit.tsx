import React, { useState } from 'react';
import {
  Target,
  Search,
  ExternalLink,
  DollarSign,
  Users,
  Star,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Shield
} from 'lucide-react';

export function CompetitiveAudit() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Tools' },
    { id: 'deck-tools', name: 'Deck Tools' },
    { id: 'deal-management', name: 'Deal Management' },
    { id: 'data-analytics', name: 'Data & Analytics' },
    { id: 'communication', name: 'Communication' }
  ];

  const competitors = [
    {
      name: 'DocSend',
      category: 'deck-tools',
      description: 'Document sharing and analytics platform',
      pricing: '$15-45/month',
      users: '30,000+',
      rating: 4.2,
      strengths: ['Document tracking', 'Analytics', 'Investor CRM'],
      weaknesses: ['No content analysis', 'Limited benchmarking'],
      marketShare: 'High',
      threat: 'Medium',
      url: 'docsend.com'
    },
    {
      name: 'Decktopus',
      category: 'deck-tools',
      description: 'AI-powered presentation builder',
      pricing: '$10-30/month',
      users: '50,000+',
      rating: 4.1,
      strengths: ['Templates', 'AI assistance', 'Easy design'],
      weaknesses: ['Shallow content feedback', 'No benchmarking'],
      marketShare: 'Medium',
      threat: 'Low',
      url: 'decktopus.com'
    },
    {
      name: 'PitchBook',
      category: 'data-analytics',
      description: 'Private market data and research platform',
      pricing: '$3,000+/year',
      users: '70,000+',
      rating: 4.0,
      strengths: ['Comprehensive data', 'Market intelligence', 'Deal tracking'],
      weaknesses: ['Expensive', 'Complex interface', 'No deck analysis'],
      marketShare: 'Very High',
      threat: 'High',
      url: 'pitchbook.com'
    },
    {
      name: 'Affinity',
      category: 'deal-management',
      description: 'Relationship intelligence CRM for VCs',
      pricing: '$1,000+/month',
      users: '3,000+',
      rating: 4.3,
      strengths: ['Network mapping', 'Deal flow', 'Team collaboration'],
      weaknesses: ['No content analysis', 'Expensive', 'Complex setup'],
      marketShare: 'High',
      threat: 'Medium',
      url: 'affinity.co'
    },
    {
      name: 'AngelList',
      category: 'deal-management',
      description: 'Startup fundraising and investment platform',
      pricing: 'Commission-based',
      users: '4M+',
      rating: 3.8,
      strengths: ['Large network', 'Fundraising tools', 'Syndicates'],
      weaknesses: ['No analysis tools', 'Quality varies', 'Limited benchmarking'],
      marketShare: 'Very High',
      threat: 'Medium',
      url: 'angellist.com'
    },
    {
      name: 'Slidebean',
      category: 'deck-tools',
      description: 'Presentation design and pitch deck service',
      pricing: '$25-100/month',
      users: '200,000+',
      rating: 4.0,
      strengths: ['Professional design', 'Templates', 'Content feedback'],
      weaknesses: ['Limited analytics', 'No benchmarking', 'Service-heavy'],
      marketShare: 'Medium',
      threat: 'Low',
      url: 'slidebean.com'
    }
  ];

  const filteredCompetitors = selectedCategory === 'all' 
    ? competitors 
    : competitors.filter(comp => comp.category === selectedCategory);

  const getThreatColor = (threat: string) => {
    switch (threat.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-orange-600 bg-orange-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const getMarketShareColor = (share: string) => {
    switch (share.toLowerCase()) {
      case 'very high': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-blue-600';
      case 'low': return 'text-green-600';
      default: return 'text-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Competitive Landscape Audit</h1>
        <p className="text-slate-600 mt-1">
          Analysis of existing tools and Team SSO's competitive positioning
        </p>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-800 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Competitive Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCompetitors.map((competitor, index) => (
          <div key={index} className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-slate-900">{competitor.name}</h3>
                  <a
                    href={`https://${competitor.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                <p className="text-slate-600 text-sm mb-3">{competitor.description}</p>
                
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">{competitor.pricing}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">{competitor.users}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-slate-600">{competitor.rating}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getThreatColor(competitor.threat)}`}>
                  {competitor.threat} Threat
                </div>
                <p className={`text-sm font-medium mt-1 ${getMarketShareColor(competitor.marketShare)}`}>
                  {competitor.marketShare} Share
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-green-800 mb-2 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Strengths
                </h4>
                <ul className="space-y-1">
                  {competitor.strengths.map((strength, i) => (
                    <li key={i} className="text-sm text-slate-600">• {strength}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-red-800 mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Weaknesses
                </h4>
                <ul className="space-y-1">
                  {competitor.weaknesses.map((weakness, i) => (
                    <li key={i} className="text-sm text-slate-600">• {weakness}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SSO Differentiation */}
      <div className="bg-gradient-to-br from-blue-800 to-teal-600 text-white rounded-lg p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Team SSO Competitive Advantage</h2>
          <p className="text-blue-100">Why we're uniquely positioned to win this market</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <Target className="h-8 w-8 mx-auto text-white" />
            </div>
            <h3 className="font-semibold mb-2">Dual-Sided Platform</h3>
            <p className="text-sm text-blue-100">
              First platform built for both founders AND VCs, bridging communication gaps
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <TrendingUp className="h-8 w-8 mx-auto text-white" />
            </div>
            <h3 className="font-semibold mb-2">Benchmark-Driven Intelligence</h3>
            <p className="text-sm text-blue-100">
              Deep market data layer with SSO Readiness Score™ and percentile rankings
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <Shield className="h-8 w-8 mx-auto text-white" />
            </div>
            <h3 className="font-semibold mb-2">Integrated Workflow</h3>
            <p className="text-sm text-blue-100">
              End-to-end solution from deck analysis to benchmarking to standardization
            </p>
          </div>
        </div>
      </div>

      {/* Competitive Gaps Analysis */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Market Gaps & Opportunities</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-slate-900 mb-3">Unaddressed Pain Points</h3>
            <div className="space-y-3">
              {[
                {
                  gap: 'No unified metric definitions',
                  impact: 'Founders and VCs speak different languages'
                },
                {
                  gap: 'Limited benchmark context',
                  impact: 'Metrics shared without meaningful comparison'
                },
                {
                  gap: 'Fragmented toolchain',
                  impact: 'Teams use 5+ tools for fundraising process'
                },
                {
                  gap: 'No intelligent content analysis',
                  impact: 'Manual deck review takes hours per investor'
                }
              ].map((item, index) => (
                <div key={index} className="bg-slate-50 rounded-lg p-4">
                  <h4 className="font-medium text-slate-900">{item.gap}</h4>
                  <p className="text-sm text-slate-600 mt-1">{item.impact}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-slate-900 mb-3">SSO Solutions</h3>
            <div className="space-y-3">
              {[
                {
                  solution: 'SSO Glossary™',
                  benefit: 'Standardized definitions across ecosystem'
                },
                {
                  solution: 'Real-time benchmarking',
                  benefit: 'Instant percentile rankings for all metrics'
                },
                {
                  solution: 'Integrated platform',
                  benefit: 'Single source of truth for fundraising'
                },
                {
                  solution: 'AI-powered analysis',
                  benefit: 'Instant feedback with SSO Readiness Score™'
                }
              ].map((item, index) => (
                <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900">{item.solution}</h4>
                  <p className="text-sm text-blue-700 mt-1">{item.benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Strategy */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Competitive Pricing Analysis</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 text-sm font-medium text-slate-700">Tool</th>
                <th className="text-left py-2 text-sm font-medium text-slate-700">Pricing</th>
                <th className="text-left py-2 text-sm font-medium text-slate-700">Target User</th>
                <th className="text-left py-2 text-sm font-medium text-slate-700">Value Prop</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {competitors.slice(0, 4).map((comp, index) => (
                <tr key={index}>
                  <td className="py-3 text-sm font-medium text-slate-900">{comp.name}</td>
                  <td className="py-3 text-sm text-slate-600">{comp.pricing}</td>
                  <td className="py-3 text-sm text-slate-600">
                    {comp.category === 'deck-tools' ? 'Founders' : 'VCs'}
                  </td>
                  <td className="py-3 text-sm text-slate-600">{comp.strengths[0]}</td>
                </tr>
              ))}
              <tr className="bg-blue-50">
                <td className="py-3 text-sm font-bold text-blue-900">Team SSO</td>
                <td className="py-3 text-sm font-medium text-blue-800">$49-199/month</td>
                <td className="py-3 text-sm text-blue-700">Both</td>
                <td className="py-3 text-sm text-blue-700">Dual-sided intelligence platform</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">Pricing Strategy Insight</h4>
          <p className="text-sm text-green-800">
            SSO is positioned at premium pricing tier, justified by unique dual-sided value proposition 
            and integrated benchmarking capabilities that no competitor offers.
          </p>
        </div>
      </div>

      <div className="text-center py-4">
        <p className="text-xs text-slate-400">Competitive analysis by Team SSO Intelligence</p>
      </div>
    </div>
  );
}