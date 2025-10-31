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
  Twitter as XIcon,
  Globe,
  Headphones,
  MoveRight,
  Filter,
  Plus,
  TrendingUp,
  AlertTriangle,
  LineChart
} from 'lucide-react';

type Industry = 'healthcare' | 'fintech' | 'healthtech' | 'ai' | 'enterprise' | 'consumer' | 'climate';
type SubIndustry = Industry | 'biotech' | 'medtech' | 'insurtech' | 'edtech' | 'web3' | 'robotics';

interface MarketInsight {
  id: string;
  source: 'x' | 'reddit' | 'podcast' | 'news' | 'research';
  title: string;
  summary: string;
  link: string;
  date: string;
  industry: Industry;
  subIndustry?: SubIndustry;
  engagement: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  trendScore: number;
  relevanceScore: number;
}

interface EcosystemInsight {
  id: string;
  type: 'email' | 'call' | 'note' | 'meeting';
  title: string;
  summary: string;
  date: string;
  industry: Industry;
  subIndustry?: SubIndustry;
  participants: string[];
  keyPoints: string[];
  nextSteps?: string[];
  attachments?: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

export function StartupRadar() {
  const [activeView, setActiveView] = useState<'market' | 'ecosystem'>('market');
  const [selectedIndustry, setSelectedIndustry] = useState<Industry>('healthcare');
  const [selectedSubIndustry, setSelectedSubIndustry] = useState<SubIndustry | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [showSourcePopup, setShowSourcePopup] = useState(false);
  const [showAnalyticsPopup, setShowAnalyticsPopup] = useState(false);
  const [showInteractionPopup, setShowInteractionPopup] = useState(false);
  const [newSource, setNewSource] = useState({
    link: '',
    type: 'x' as MarketInsight['source'],
    notes: ''
  });
  const [newInteraction, setNewInteraction] = useState({
    type: 'figma' as 'figma' | 'notion' | 'miro' | 'confluence' | 'other',
    title: '',
    link: '',
    description: '',
    participants: '',
    nextSteps: ''
  });

  // Mock data
  const marketInsights: MarketInsight[] = [
    {
      id: '1',
      source: 'x',
      title: 'Revolutionary AI-Powered Healthcare Diagnostics',
      summary: 'New startup leverages advanced ML models for early disease detection with 99.9% accuracy',
      link: 'https://x.com/healthtech/status/123',
      date: '2025-09-20',
      industry: 'healthcare',
      subIndustry: 'ai',
      engagement: 12500,
      sentiment: 'positive',
      trendScore: 92,
      relevanceScore: 95
    },
    {
      id: '2',
      source: 'podcast',
      title: 'The Future of Digital Health - Episode 45',
      summary: 'Interview with leading healthtech founders about AI integration in healthcare',
      link: 'https://healthpodcast.com/ep45',
      date: '2025-09-19',
      industry: 'healthcare',
      subIndustry: 'healthtech',
      engagement: 8900,
      sentiment: 'positive',
      trendScore: 88,
      relevanceScore: 90
    }
  ];

  const ecosystemInsights: EcosystemInsight[] = [
    {
      id: '1',
      type: 'call',
      title: 'AI Diagnostics Platform Discussion',
      summary: 'Deep dive into new diagnostic algorithms and regulatory compliance',
      date: '2025-09-18',
      industry: 'healthcare',
      subIndustry: 'ai',
      participants: ['Dr. Sarah Chen', 'Alex Kumar', 'Dr. Mike Ross'],
      keyPoints: [
        'Novel ML approach for diagnostic accuracy',
        'FDA approval pathway discussed',
        'Clinical trial planning initiated'
      ],
      nextSteps: [
        'Schedule follow-up with regulatory team',
        'Review technical documentation'
      ],
      sentiment: 'positive'
    }
  ];

  const industries: Industry[] = [
    'healthcare',
    'fintech',
    'healthtech',
    'ai',
    'enterprise',
    'consumer',
    'climate'
  ];

  const getSubIndustries = (industry: Industry): SubIndustry[] => {
    const subIndustryMap: Record<Industry, SubIndustry[]> = {
      healthcare: ['biotech', 'medtech', 'ai'],
      fintech: ['insurtech', 'web3'],
      healthtech: ['ai', 'biotech'],
      ai: ['healthtech', 'robotics'],
      enterprise: ['ai', 'fintech'],
      consumer: ['fintech', 'healthtech'],
      climate: ['ai', 'enterprise']
    };
    return subIndustryMap[industry] || [];
  };

  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Startup Radar</h1>
          <p className="text-slate-600 mt-1">Track, analyze, and discover startup opportunities</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex rounded-lg border border-slate-200 p-1">
            <button
              onClick={() => setActiveView('market')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeView === 'market'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Market Intel
            </button>
            <button
              onClick={() => setActiveView('ecosystem')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeView === 'ecosystem'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Ecosystem
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Quick Filters</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700">
              Advanced Filters
            </button>
          </div>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-1/2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Industry
                </label>
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value as Industry)}
                  className="w-full rounded-md border-slate-200 shadow-sm"
                >
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry.charAt(0).toUpperCase() + industry.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-1/2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Sub-Industry
                </label>
                <select
                  value={selectedSubIndustry || ''}
                  onChange={(e) => setSelectedSubIndustry(e.target.value as SubIndustry)}
                  className="w-full rounded-md border-slate-200 shadow-sm"
                >
                  <option value="">All</option>
                  {getSubIndustries(selectedIndustry).map((sub) => (
                    <option key={sub} value={sub}>
                      {sub.charAt(0).toUpperCase() + sub.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {['day', 'week', 'month'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range as typeof timeRange)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    timeRange === range
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {activeView === 'market' && (
        <div className="space-y-6">
          {/* Market Insights Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {marketInsights.map((insight) => (
              <div key={insight.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {insight.source === 'x' && <XIcon className="h-5 w-5 text-slate-600" />}
                      {insight.source === 'reddit' && <Globe className="h-5 w-5 text-orange-500" />}
                      {insight.source === 'podcast' && <Headphones className="h-5 w-5 text-purple-500" />}
                      <div>
                        <h3 className="text-sm font-medium text-slate-900">{insight.title}</h3>
                        <p className="text-xs text-slate-500">{insight.source.toUpperCase()} • {insight.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        insight.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                        insight.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {insight.engagement.toLocaleString()} interactions
                      </span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{insight.summary}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                        {insight.industry}
                      </span>
                      {insight.subIndustry && (
                        <>
                          <MoveRight className="h-3 w-3 text-slate-400" />
                          <span className="px-2 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700">
                            {insight.subIndustry}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-xs font-medium text-green-700">{insight.trendScore}%</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-xs font-medium text-yellow-700">{insight.relevanceScore}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-100 p-4">
                  <a
                    href={insight.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center justify-between"
                  >
                    <span>View Full Content</span>
                    <MoveRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Add Source */}
          <button 
            onClick={() => setShowSourcePopup(true)}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Custom Source</span>
          </button>
        </div>
      )}

      {activeView === 'ecosystem' && (
        <div className="space-y-6">
          {/* Ecosystem Insights */}
          {ecosystemInsights.map((insight) => (
            <div key={insight.id} className="bg-white rounded-lg shadow">
              <div className="p-4">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg ${
                    insight.type === 'call' ? 'bg-green-100' :
                    insight.type === 'email' ? 'bg-blue-100' :
                    insight.type === 'note' ? 'bg-yellow-100' :
                    'bg-purple-100'
                  }`}>
                    {insight.type === 'call' ? <Phone className="h-5 w-5 text-green-600" /> :
                     insight.type === 'email' ? <Mail className="h-5 w-5 text-blue-600" /> :
                     insight.type === 'note' ? <FileText className="h-5 w-5 text-yellow-600" /> :
                     <MessageSquare className="h-5 w-5 text-purple-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-slate-900">{insight.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {insight.date} • {insight.participants.join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                          {insight.industry}
                        </span>
                        {insight.subIndustry && (
                          <>
                            <MoveRight className="h-3 w-3 text-slate-400" />
                            <span className="px-2 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700">
                              {insight.subIndustry}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{insight.summary}</p>
                    
                    {/* Key Points */}
                    <div className="mt-4">
                      <h4 className="text-xs font-medium text-slate-700 mb-2">Key Points</h4>
                      <ul className="space-y-1">
                        {insight.keyPoints.map((point, i) => (
                          <li key={i} className="text-sm text-slate-600 flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Next Steps */}
                    {insight.nextSteps && (
                      <div className="mt-4">
                        <h4 className="text-xs font-medium text-slate-700 mb-2">Next Steps</h4>
                        <ul className="space-y-1">
                          {insight.nextSteps.map((step, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-center space-x-2">
                              <AlertCircle className="h-4 w-4 text-blue-500" />
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Quick Actions */}
          <div className="flex space-x-4">
            <button 
              onClick={() => setShowInteractionPopup(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add Interaction</span>
            </button>
            <button 
              onClick={() => setShowAnalyticsPopup(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              <LineChart className="h-4 w-4" />
              <span>View Analytics</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Interaction Popup */}
      {showInteractionPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add New Interaction</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Integration Type</label>
                <select
                  value={newInteraction.type}
                  onChange={(e) => setNewInteraction(prev => ({ ...prev, type: e.target.value as typeof newInteraction.type }))}
                  className="w-full rounded-md border-slate-200 shadow-sm"
                >
                  <option value="figma">Figma Board</option>
                  <option value="notion">Notion Page</option>
                  <option value="miro">Miro Board</option>
                  <option value="confluence">Confluence Page</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newInteraction.title}
                  onChange={(e) => setNewInteraction(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter a descriptive title"
                  className="w-full rounded-md border-slate-200 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Link</label>
                <input
                  type="text"
                  value={newInteraction.link}
                  onChange={(e) => setNewInteraction(prev => ({ ...prev, link: e.target.value }))}
                  placeholder="https://"
                  className="w-full rounded-md border-slate-200 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={newInteraction.description}
                  onChange={(e) => setNewInteraction(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the content and key insights..."
                  rows={3}
                  className="w-full rounded-md border-slate-200 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Participants</label>
                <input
                  type="text"
                  value={newInteraction.participants}
                  onChange={(e) => setNewInteraction(prev => ({ ...prev, participants: e.target.value }))}
                  placeholder="Enter participant names (comma separated)"
                  className="w-full rounded-md border-slate-200 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Next Steps</label>
                <textarea
                  value={newInteraction.nextSteps}
                  onChange={(e) => setNewInteraction(prev => ({ ...prev, nextSteps: e.target.value }))}
                  placeholder="List any action items or follow-ups..."
                  rows={2}
                  className="w-full rounded-md border-slate-200 shadow-sm"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowInteractionPopup(false);
                  setNewInteraction({
                    type: 'figma',
                    title: '',
                    link: '',
                    description: '',
                    participants: '',
                    nextSteps: ''
                  });
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle interaction addition here
                  setShowInteractionPopup(false);
                  setNewInteraction({
                    type: 'figma',
                    title: '',
                    link: '',
                    description: '',
                    participants: '',
                    nextSteps: ''
                  });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Add Interaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Source Popup */}
      {showSourcePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add New Source</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Source Type</label>
                <select
                  value={newSource.type}
                  onChange={(e) => setNewSource(prev => ({ ...prev, type: e.target.value as MarketInsight['source'] }))}
                  className="w-full rounded-md border-slate-200 shadow-sm"
                >
                  <option value="x">X (Twitter)</option>
                  <option value="reddit">Reddit</option>
                  <option value="podcast">Podcast</option>
                  <option value="news">News</option>
                  <option value="research">Research</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Source Link</label>
                <input
                  type="text"
                  value={newSource.link}
                  onChange={(e) => setNewSource(prev => ({ ...prev, link: e.target.value }))}
                  placeholder="https://"
                  className="w-full rounded-md border-slate-200 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={newSource.notes}
                  onChange={(e) => setNewSource(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional context or notes..."
                  rows={3}
                  className="w-full rounded-md border-slate-200 shadow-sm"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowSourcePopup(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle source addition here
                  setShowSourcePopup(false);
                  setNewSource({ link: '', type: 'x', notes: '' });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Add Source
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Popup */}
      {showAnalyticsPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Startup Analytics</h3>
              <button
                onClick={() => setShowAnalyticsPopup(false)}
                className="text-slate-400 hover:text-slate-500"
              >
                <AlertTriangle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Growth Metrics */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Growth Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">MRR Growth</span>
                    <span className="text-sm font-medium text-green-600">+42%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">User Growth</span>
                    <span className="text-sm font-medium text-green-600">+28%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Team Growth</span>
                    <span className="text-sm font-medium text-blue-600">+15%</span>
                  </div>
                </div>
              </div>

              {/* Market Position */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Market Position</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Market Share</span>
                    <span className="text-sm font-medium text-blue-600">12%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Competitor Count</span>
                    <span className="text-sm font-medium text-slate-900">8</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Market Position</span>
                    <span className="text-sm font-medium text-green-600">Top 3</span>
                  </div>
                </div>
              </div>

              {/* Key Performance */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Key Performance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">CAC</span>
                    <span className="text-sm font-medium text-slate-900">$450</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">LTV</span>
                    <span className="text-sm font-medium text-slate-900">$2,800</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Burn Rate</span>
                    <span className="text-sm font-medium text-yellow-600">$85k/mo</span>
                  </div>
                </div>
              </div>

              {/* Funding Status */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Funding Status</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Last Round</span>
                    <span className="text-sm font-medium text-slate-900">Series A</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Amount Raised</span>
                    <span className="text-sm font-medium text-slate-900">$12M</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Runway</span>
                    <span className="text-sm font-medium text-green-600">18 months</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
