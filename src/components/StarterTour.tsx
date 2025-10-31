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
  Twitter,
  Globe,
  Headphones,
  MoveRight,
  Filter
} from 'lucide-react';

type Industry = 'healthcare' | 'fintech' | 'healthtech' | 'ai' | 'enterprise' | 'consumer' | 'hybrid';
type IndustryMix = { primary: Industry; secondary?: Industry };

interface SocialInsight {
  platform: 'x' | 'reddit' | 'podcast' | 'other';
  title: string;
  content: string;
  link: string;
  date: string;
  engagement: number;
  industry: Industry | IndustryMix;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface PersonalInsight {
  type: 'email' | 'call' | 'note' | 'recording';
  date: string;
  title: string;
  summary: string;
  industry: Industry | IndustryMix;
  participants: string[];
  keyPoints: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

export function StarterTour() {
  const [activeTab, setActiveTab] = useState<'market' | 'personal'>('market');
  const [selectedIndustries, setSelectedIndustries] = useState<(Industry | 'hybrid')[]>(['healthcare']);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week');
  const [showHybridOptions, setShowHybridOptions] = useState(false);
  const [hybridSelection, setHybridSelection] = useState<IndustryMix | null>(null);

  const industries: Industry[] = [
    'healthcare',
    'fintech',
    'healthtech',
    'ai',
    'enterprise',
    'consumer'
  ];

  // Mock data
  const socialInsights: SocialInsight[] = [
    {
      platform: 'x',
      title: 'AI in Healthcare Breakthrough',
      content: 'New AI model shows 99% accuracy in early disease detection...',
      link: 'https://x.com/...',
      date: '2025-09-20',
      engagement: 5200,
      industry: { primary: 'healthcare', secondary: 'ai' },
      sentiment: 'positive'
    },
    {
      platform: 'podcast',
      title: 'Future of FinTech',
      content: 'Episode 45: Revolution in Payment Systems',
      link: 'https://spotify.com/...',
      date: '2025-09-19',
      engagement: 15000,
      industry: 'fintech',
      sentiment: 'positive'
    }
  ];

  const personalInsights: PersonalInsight[] = [
    {
      type: 'call',
      date: '2025-09-18',
      title: 'AI-Powered Diagnostics Platform Discussion',
      summary: 'Deep dive into new diagnostic algorithms and healthcare integration',
      industry: { primary: 'healthcare', secondary: 'ai' },
      participants: ['Dr. Sarah Chen', 'Alex Kumar'],
      keyPoints: ['FDA approval timeline', 'Hospital pilot program', 'AI accuracy metrics'],
      sentiment: 'positive'
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Starter Tour</h1>
          <p className="text-slate-600 mt-1">Discover insights from market trends and your ecosystem</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('market')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'market'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Market Pulse
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'personal'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Personal Ecosystem
          </button>
        </div>
      </div>

      {/* Industry Filter */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Industry Focus</h2>
          <button
            onClick={() => setShowHybridOptions(!showHybridOptions)}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
          >
            {showHybridOptions ? 'Simple Select' : 'Enable Hybrid Selection'}
            <MoveRight className="h-4 w-4 ml-1" />
          </button>
        </div>
        
        {showHybridOptions ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Primary Industry</label>
              <select
                className="w-full rounded-md border-slate-200 shadow-sm"
                onChange={(e) => setHybridSelection(prev => ({
                  ...prev,
                  primary: e.target.value as Industry
                }))}
              >
                {industries.map(industry => (
                  <option key={industry} value={industry}>
                    {industry.charAt(0).toUpperCase() + industry.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Secondary Industry (Optional)</label>
              <select
                className="w-full rounded-md border-slate-200 shadow-sm"
                onChange={(e) => setHybridSelection(prev => ({
                  ...prev,
                  secondary: e.target.value as Industry
                }))}
              >
                <option value="">None</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>
                    {industry.charAt(0).toUpperCase() + industry.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {industries.map(industry => (
              <button
                key={industry}
                onClick={() => setSelectedIndustries(prev => 
                  prev.includes(industry) 
                    ? prev.filter(i => i !== industry)
                    : [...prev, industry]
                )}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedIndustries.includes(industry)
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {industry.charAt(0).toUpperCase() + industry.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeTab === 'market' && (
        <div className="space-y-6">
          {/* Social Insights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {socialInsights.map((insight, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {insight.platform === 'x' && <Twitter className="h-5 w-5 text-slate-600" />}
                    {insight.platform === 'reddit' && <Globe className="h-5 w-5 text-orange-500" />}
                    {insight.platform === 'podcast' && <Headphones className="h-5 w-5 text-purple-500" />}
                    <div>
                      <h3 className="text-sm font-medium text-slate-900">{insight.title}</h3>
                      <p className="text-xs text-slate-500">{insight.platform.toUpperCase()} • {insight.date}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    insight.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                    insight.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {insight.engagement.toLocaleString()} engagements
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">{insight.content}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {typeof insight.industry === 'string' ? (
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                        {insight.industry}
                      </span>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                          {insight.industry.primary}
                        </span>
                        <MoveRight className="h-3 w-3 text-slate-400" />
                        <span className="px-2 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700">
                          {insight.industry.secondary}
                        </span>
                      </div>
                    )}
                  </div>
                  <a
                    href={insight.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    View Source →
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Add Source Button */}
          <button className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700">
            <Plus className="h-4 w-4" />
            <span>Add Custom Source</span>
          </button>
        </div>
      )}

      {activeTab === 'personal' && (
        <div className="space-y-6">
          {personalInsights.map((insight, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow p-4">
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
                    {typeof insight.industry === 'string' ? (
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                        {insight.industry}
                      </span>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                          {insight.industry.primary}
                        </span>
                        <MoveRight className="h-3 w-3 text-slate-400" />
                        <span className="px-2 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700">
                          {insight.industry.secondary}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{insight.summary}</p>
                  <div className="mt-3">
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
