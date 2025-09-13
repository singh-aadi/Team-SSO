import React, { useState } from 'react';
import {
  TrendingUp,
  MessageSquare,
  BookOpen,
  Twitter,
  Youtube,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter
} from 'lucide-react';

export function InsightHub() {
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');

  const sources = [
    { id: 'all', name: 'All Sources', icon: TrendingUp },
    { id: 'reddit', name: 'Reddit', icon: MessageSquare },
    { id: 'twitter', name: 'Twitter', icon: Twitter },
    { id: 'youtube', name: 'YouTube', icon: Youtube },
    { id: 'books', name: 'VC Books', icon: BookOpen }
  ];

  const topics = [
    { id: 'all', name: 'All Topics' },
    { id: 'fundraising', name: 'Fundraising' },
    { id: 'metrics', name: 'Metrics' },
    { id: 'valuation', name: 'Valuation' },
    { id: 'market-trends', name: 'Market Trends' }
  ];

  const insights = [
    {
      id: 1,
      title: 'SaaS CAC Inflation: 20% Increase in 2025',
      source: 'reddit',
      topic: 'metrics',
      content: 'Multiple founders reporting customer acquisition costs rising significantly across B2B SaaS. iOS privacy changes and increased competition cited as primary factors.',
      author: 'r/startups community',
      date: '2 hours ago',
      engagement: '247 comments',
      trend: 'up',
      credibility: 'high',
      bookReference: null
    },
    {
      id: 2,
      title: 'Series A Bar Continues to Rise',
      source: 'twitter',
      topic: 'fundraising',
      content: 'VCs now expecting $2M+ ARR for Series A, up from $1M in 2022. Founders need stronger traction metrics to secure institutional funding.',
      author: '@jason (Jason Calacanis)',
      date: '4 hours ago',
      engagement: '1.2K retweets',
      trend: 'up',
      credibility: 'high',
      bookReference: null
    },
    {
      id: 3,
      title: 'The Importance of Unit Economics',
      source: 'books',
      topic: 'metrics',
      content: 'From "Venture Deals": Focus on LTV:CAC ratio above 3:1 and payback period under 12 months. These metrics are fundamental for sustainable growth.',
      author: 'Brad Feld & Jason Mendelson',
      date: '1 day ago',
      engagement: 'Chapter 12',
      trend: 'neutral',
      credibility: 'very-high',
      bookReference: 'Venture Deals, 4th Edition'
    },
    {
      id: 4,
      title: 'AI Startup Valuation Metrics Evolving',
      source: 'youtube',
      topic: 'valuation',
      content: 'Traditional SaaS metrics may not apply to AI companies. Investors looking at training data quality, model performance, and inference costs as key metrics.',
      author: 'All-In Podcast',
      date: '1 day ago',
      engagement: '45K views',
      trend: 'up',
      credibility: 'medium',
      bookReference: null
    },
    {
      id: 5,
      title: 'Common Pitch Deck Mistakes to Avoid',
      source: 'reddit',
      topic: 'fundraising',
      content: 'VCs sharing biggest red flags: unrealistic market size claims, lack of competitive analysis, and missing key metrics. Transparency beats perfection.',
      author: 'r/entrepreneur',
      date: '2 days ago',
      engagement: '156 upvotes',
      trend: 'neutral',
      credibility: 'medium',
      bookReference: null
    },
    {
      id: 6,
      title: 'Market Timing and Technology Adoption',
      source: 'books',
      topic: 'market-trends',
      content: 'From "Secrets of Sand Hill Road": The best investments occur when technology capability meets market readiness. Timing is often more important than team or product.',
      author: 'Scott Kupor',
      date: '3 days ago',
      engagement: 'Chapter 8',
      trend: 'neutral',
      credibility: 'very-high',
      bookReference: 'Secrets of Sand Hill Road'
    }
  ];

  const filteredInsights = insights.filter(insight => {
    const sourceMatch = selectedSource === 'all' || insight.source === selectedSource;
    const topicMatch = selectedTopic === 'all' || insight.topic === selectedTopic;
    return sourceMatch && topicMatch;
  });

  const getSourceIcon = (source: string) => {
    const sourceObj = sources.find(s => s.id === source);
    return sourceObj ? sourceObj.icon : TrendingUp;
  };

  const getCredibilityColor = (credibility: string) => {
    switch (credibility) {
      case 'very-high': return 'text-green-700 bg-green-100';
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-orange-600 bg-orange-50';
      case 'low': return 'text-red-600 bg-red-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'down': return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      default: return <div className="w-4 h-4"></div>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Insight Hub</h1>
        <p className="text-slate-600 mt-1">
          Real-time market intelligence from across the startup ecosystem
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center space-x-4 mb-4">
          <Filter className="h-5 w-5 text-slate-400" />
          <h2 className="font-medium text-slate-900">Filter Insights</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Source</label>
            <div className="flex flex-wrap gap-2">
              {sources.map((source) => {
                const Icon = source.icon;
                return (
                  <button
                    key={source.id}
                    onClick={() => setSelectedSource(source.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedSource === source.id
                        ? 'bg-blue-800 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{source.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Topic</label>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedTopic === topic.id
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {topic.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Insights Feed */}
      <div className="space-y-4">
        {filteredInsights.map((insight) => {
          const SourceIcon = getSourceIcon(insight.source);
          
          return (
            <div key={insight.id} className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <SourceIcon className="h-5 w-5 text-slate-600" />
                    <span className="text-sm font-medium text-slate-700 capitalize">{insight.source}</span>
                  </div>
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded">
                    {insight.topic.replace('-', ' ')}
                  </span>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${getCredibilityColor(insight.credibility)}`}>
                    {insight.credibility.replace('-', ' ')} credibility
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(insight.trend)}
                  <span className="text-sm text-slate-500">{insight.date}</span>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-slate-900 mb-3">{insight.title}</h3>
              <p className="text-slate-700 mb-4">{insight.content}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-slate-600">by {insight.author}</span>
                  {insight.bookReference && (
                    <span className="text-sm text-blue-600 font-medium">{insight.bookReference}</span>
                  )}
                  <span className="text-sm text-slate-500">{insight.engagement}</span>
                </div>
                <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium">
                  <span>View Source</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trending Topics */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Trending Topics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { topic: 'AI Valuations', mentions: 127, change: '+45%' },
            { topic: 'SaaS Metrics', mentions: 89, change: '+12%' },
            { topic: 'Series A Requirements', mentions: 67, change: '+8%' },
            { topic: 'Market Timing', mentions: 43, change: '+23%' }
          ].map((trend, index) => (
            <div key={index} className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="font-medium text-slate-900">{trend.topic}</p>
              <p className="text-sm text-slate-600">{trend.mentions} mentions</p>
              <p className="text-sm text-green-600 font-medium">{trend.change}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Market Data Layer */}
      <div className="bg-gradient-to-br from-blue-800 to-teal-600 text-white rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Market Intelligence Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium mb-3">Key Trends</h3>
            <ul className="space-y-2 text-sm text-blue-100">
              <li>• CAC inflation affecting 67% of SaaS companies</li>
              <li>• Series A requirements up 2x from 2022</li>
              <li>• AI metrics still being standardized</li>
              <li>• Market timing becoming critical factor</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Benchmark Changes</h3>
            <ul className="space-y-2 text-sm text-blue-100">
              <li>• Median SaaS CAC: $145 (+20%)</li>
              <li>• Series A ARR req: $2M+ (+100%)</li>
              <li>• LTV:CAC ratio: 3:1 (stable)</li>
              <li>• Payback period: &lt;12mo (stable)</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Expert Insights</h3>
            <ul className="space-y-2 text-sm text-blue-100">
              <li>• Focus on unit economics clarity</li>
              <li>• Transparency beats perfection</li>
              <li>• Competitive analysis crucial</li>
              <li>• Technology-market fit timing</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Intelligence Sources</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Reddit Communities', posts: '2.3K', quality: 'Medium' },
            { name: 'Twitter/X', posts: '5.7K', quality: 'High' },
            { name: 'YouTube Podcasts', posts: '234', quality: 'High' },
            { name: 'VC Books & Blogs', posts: '156', quality: 'Very High' }
          ].map((source, index) => (
            <div key={index} className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="font-medium text-slate-900">{source.name}</p>
              <p className="text-sm text-slate-600">{source.posts} analyzed</p>
              <p className="text-xs text-slate-500">{source.quality} quality</p>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center py-4">
        <p className="text-xs text-slate-400">Market intelligence aggregated by Team SSO</p>
      </div>
    </div>
  );
}