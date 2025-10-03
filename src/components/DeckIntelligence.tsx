import { useState } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  BarChart,
  Target,
  TrendingUp,
  Download
} from 'lucide-react';

interface DeckIntelligenceProps {
  userType: 'founder' | 'vc';
}

export function DeckIntelligence({ userType }: DeckIntelligenceProps) {
  const [uploadedDeck, setUploadedDeck] = useState(false);

  const handleUpload = () => {
    setUploadedDeck(true);
  };

  const deckSections = [
    { name: 'Team', status: 'complete', score: 9, feedback: 'Strong technical background' },
    { name: 'Problem', status: 'complete', score: 8, feedback: 'Clear pain point identified' },
    { name: 'Solution', status: 'complete', score: 7, feedback: 'Could be more specific' },
    { name: 'Market (TAM)', status: 'complete', score: 8, feedback: 'Well-researched market size' },
    { name: 'Product', status: 'complete', score: 6, feedback: 'Need more product screenshots' },
    { name: 'Traction', status: 'missing', score: 0, feedback: 'Missing key metrics section' },
    { name: 'Business Model', status: 'complete', score: 7, feedback: 'Revenue model is clear' },
    { name: 'Competition', status: 'warning', score: 5, feedback: 'Competitive analysis too shallow' },
    { name: 'Financials', status: 'complete', score: 8, feedback: 'Realistic projections' },
    { name: 'Funding Ask', status: 'complete', score: 9, feedback: 'Clear use of funds' }
  ];

  const ssoScore = Math.round(deckSections.reduce((sum, section) => sum + section.score, 0) / deckSections.length * 10) / 10;

  if (!uploadedDeck) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pitch Deck & Memo Intelligence</h1>
          <p className="text-slate-600 mt-1">
            {userType === 'founder' 
              ? 'Upload your deck to get instant feedback and SSO Readiness Score™'
              : 'Analyze multiple decks and compare them side-by-side'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload New Deck */}
          <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-12 text-center hover:border-blue-400 transition-colors">
            <Upload className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Upload Pitch Deck</h3>
            <p className="text-slate-600 mb-6">
              Supported formats: PDF, PPT, PPTX, Notion links
            </p>
            <button
              onClick={handleUpload}
              className="bg-gradient-to-r from-blue-800 to-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-900 hover:to-teal-700 transition-all"
            >
              Choose File or Drag Here
            </button>
          </div>

          {/* Compare Reports */}
          <div className="bg-white rounded-xl border-2 border-slate-200 p-12 text-center hover:border-blue-200 transition-colors">
            <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Compare Reports</h3>
            <p className="text-slate-600 mb-6">
              Compare multiple decks side by side with detailed analysis
            </p>
            <button
              className="bg-white border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-all"
            >
              Select Reports to Compare
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Instant Analysis',
              description: 'Get feedback in under 30 seconds',
              icon: Target
            },
            {
              title: 'Benchmark Comparison',
              description: 'Compare against 50+ top decks',
              icon: BarChart
            },
            {
              title: 'SSO Readiness Score™',
              description: 'Proprietary scoring system',
              icon: TrendingUp
            }
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="bg-white rounded-lg border border-slate-200 p-6">
                <Icon className="h-8 w-8 text-blue-600 mb-4" />
                <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Deck Analysis Complete</h1>
          <p className="text-slate-600 mt-1">Analysis for: "FinTech Series A Pitch.pdf"</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-3xl font-bold text-blue-800">{ssoScore}/10</p>
            <p className="text-sm text-slate-600">SSO Readiness Score™</p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => window.location.href = '/benchmarks'}
              className="flex items-center space-x-2 bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors"
            >
              <BarChart className="h-4 w-4" />
              <span>View Industry Benchmarks</span>
            </button>
            <button className="flex items-center space-x-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
              <Download className="h-4 w-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section Analysis */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Section Analysis</h2>
          </div>
          <div className="p-6 space-y-4">
            {deckSections.map((section, index) => {
              const statusColors = {
                complete: 'text-green-600',
                warning: 'text-orange-600',
                missing: 'text-red-600'
              };
              
              const StatusIcon = section.status === 'complete' ? CheckCircle : 
                               section.status === 'warning' ? AlertTriangle : AlertTriangle;
              
              return (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <StatusIcon className={`h-5 w-5 ${statusColors[section.status as keyof typeof statusColors]}`} />
                    <div>
                      <h3 className="font-medium text-slate-900">{section.name}</h3>
                      <p className="text-sm text-slate-600">{section.feedback}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold text-slate-900">{section.score}/10</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Insights */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Key Insights</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-red-800">Critical: Missing Traction</p>
                  <p className="text-sm text-slate-600">Add metrics like MRR, user growth, or key partnerships</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-orange-800">Improve: Competition Analysis</p>
                  <p className="text-sm text-slate-600">Provide deeper competitive differentiation</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-green-800">Strong: Team & Vision</p>
                  <p className="text-sm text-slate-600">Excellent founder-market fit demonstrated</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-800 to-teal-600 text-white rounded-lg p-6">
            <h3 className="font-semibold mb-2">Benchmark Comparison</h3>
            <p className="text-sm text-blue-100 mb-4">vs. Top 50 Series A Decks</p>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Structure</span>
                <span className="text-sm">85th percentile</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Content Depth</span>
                <span className="text-sm">72nd percentile</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Visual Design</span>
                <span className="text-sm">68th percentile</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Next Steps</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-blue-800">1</span>
                </div>
                <p className="text-sm text-slate-700">Add traction metrics slide</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-blue-800">2</span>
                </div>
                <p className="text-sm text-slate-700">Strengthen competitive analysis</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-blue-800">3</span>
                </div>
                <p className="text-sm text-slate-700">Benchmark key metrics</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center py-4">
        <p className="text-xs text-slate-400">Analysis powered by Team SSO Intelligence Engine</p>
      </div>
    </div>
  );
}