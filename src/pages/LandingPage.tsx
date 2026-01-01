import { useNavigate } from 'react-router';
import { ArrowRight, Sparkles, Brain, FileText, TrendingUp, Wand2, MessageSquare, BarChart3, Shield } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Wand2,
      title: 'Guided Evaluation Wizard',
      description: 'Step-by-step pitch deck analysis with context collection, custom criteria, and VC preferences in one seamless flow'
    },
    {
      icon: Brain,
      title: 'AI-Powered Dual Analysis',
      description: 'Gemini 2.0 Flash analyzes both pitch deck and checklist together for comprehensive, context-aware insights'
    },
    {
      icon: Sparkles,
      title: 'Agentic VC Mode',
      description: 'Customize evaluation criteria with unlimited subcriteria and weights. AI generates adaptive prompts tailored to your investment thesis'
    },
    {
      icon: MessageSquare,
      title: 'VC Context Intelligence',
      description: 'Upload meeting notes, transcripts, and due diligence docs. AI synthesizes context to influence analysis outcomes'
    },
    {
      icon: FileText,
      title: 'Enhanced PDF Reports',
      description: 'Professional reports with industry benchmarks, stage-specific insights, and comparative analysis across competitors'
    },
    {
      icon: BarChart3,
      title: 'SSO Readiness Score™',
      description: 'Proprietary scoring algorithm evaluating decks across Problem, Solution, Market, Traction, Team, Financials, and Ask'
    },
    {
      icon: TrendingUp,
      title: 'Competitive Benchmarking',
      description: 'Compare startups against industry standards and stage-specific metrics (Seed, Series A/B/C, Growth)'
    },
    {
      icon: Shield,
      title: 'Risk & Founder Journey Analysis',
      description: 'Deep-dive into risk factors, founder backgrounds, and competitive positioning with actionable recommendations'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-teal-600">
      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <nav className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-col space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-blue-800 font-bold text-lg">SS</span>
              </div>
              <div>
                <div className="text-white font-bold text-xl">Startup Scout & Optioneers</div>
                <div className="text-blue-200 text-xs">A premium product by LVx</div>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="bg-white text-blue-800 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            Sign In
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-teal-400 to-purple-400 text-white text-sm font-semibold mb-6 px-4 py-2 rounded-full">
            <Sparkles className="h-4 w-4" />
            <span>INTELLIGENT DEAL ANALYSIS FOR VCs</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Smart Pitch Deck
            <br />
            <span className="bg-gradient-to-r from-teal-300 to-purple-300 bg-clip-text text-transparent">Analysis Platform</span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto">
            Evaluate startup decks with <strong>agentic AI agents</strong>, custom VC criteria, 
            context-aware analysis, and industry benchmarks—all in minutes, not days.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="bg-gradient-to-r from-teal-500 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-teal-400 hover:to-purple-500 transition-all shadow-xl hover:shadow-2xl flex items-center justify-center space-x-2"
            >
              <Wand2 className="h-5 w-5" />
              <span>Start Analyzing Decks</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-800 transition-colors"
            >
              View Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 px-6 py-20 bg-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-teal-300 text-sm font-semibold mb-4 tracking-wide">WHAT WE BUILT</div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything You Need to Evaluate Decks
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              From guided evaluation flows to agentic AI customization—built for VCs who demand precision and speed
            </p>
          </div>

          {/* Core Analysis Tools */}
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <div className="h-1 w-12 bg-gradient-to-r from-teal-400 to-purple-400 rounded mr-3"></div>
              <h3 className="text-2xl font-bold text-white">Core Analysis Tools</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-teal-300/50 hover:shadow-xl hover:shadow-teal-500/20 transition-all group">
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Dashboard</h4>
                <p className="text-blue-200 text-sm mb-3">Centralized Overview</p>
                <p className="text-blue-300 text-xs leading-relaxed">Pipeline analytics and key metrics at a glance</p>
              </div>
              
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-teal-300/50 hover:shadow-xl hover:shadow-teal-500/20 transition-all group">
                <div className="bg-gradient-to-br from-indigo-400 to-indigo-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Deck Intelligence</h4>
                <p className="text-blue-200 text-sm mb-3">AI-Powered Analysis</p>
                <p className="text-blue-300 text-xs leading-relaxed">Dual PDF comparison and comprehensive scoring</p>
              </div>
              
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-teal-300/50 hover:shadow-xl hover:shadow-teal-500/20 transition-all group">
                <div className="bg-gradient-to-br from-purple-400 to-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">VC Journey</h4>
                <p className="text-blue-200 text-sm mb-3">Deck Evolution Tracking</p>
                <p className="text-blue-300 text-xs leading-relaxed">Tracking the progress and numbers of startups</p>
              </div>
            </div>
          </div>

          {/* Configuration & Preferences */}
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <div className="h-1 w-12 bg-gradient-to-r from-teal-400 to-cyan-400 rounded mr-3"></div>
              <h3 className="text-2xl font-bold text-white">Configuration & Preferences</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-teal-300/50 hover:shadow-xl hover:shadow-teal-500/20 transition-all group">
                <div className="bg-gradient-to-br from-teal-400 to-teal-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Wand2 className="h-6 w-6 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">VC Mode</h4>
                <p className="text-blue-200 text-sm mb-3">Custom Criteria</p>
                <p className="text-blue-300 text-xs leading-relaxed">Unlimited subcriteria with adaptive AI prompts</p>
              </div>
            </div>
          </div>

          {/* Market Intelligence */}
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <div className="h-1 w-12 bg-gradient-to-r from-cyan-400 to-sky-400 rounded mr-3"></div>
              <h3 className="text-2xl font-bold text-white">Market Intelligence</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-teal-300/50 hover:shadow-xl hover:shadow-teal-500/20 transition-all group">
                <div className="bg-gradient-to-br from-cyan-400 to-cyan-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Startup Radar</h4>
                <p className="text-blue-200 text-sm mb-3">Market Tracking</p>
                <p className="text-blue-300 text-xs leading-relaxed">Flag companies for VC Lens when decks arrive</p>
              </div>
              
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-teal-300/50 hover:shadow-xl hover:shadow-teal-500/20 transition-all group">
                <div className="bg-gradient-to-br from-sky-400 to-sky-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Sector Benchmarking</h4>
                <p className="text-blue-200 text-sm mb-3">Competitive Analysis</p>
                <p className="text-blue-300 text-xs leading-relaxed">Compare against industry standards</p>
              </div>
            </div>
          </div>

          {/* Knowledge Base */}
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <div className="h-1 w-12 bg-gradient-to-r from-violet-400 to-purple-400 rounded mr-3"></div>
              <h3 className="text-2xl font-bold text-white">Knowledge Base</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-teal-300/50 hover:shadow-xl hover:shadow-teal-500/20 transition-all group">
                <div className="bg-gradient-to-br from-violet-400 to-violet-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">SSO Glossary</h4>
                <p className="text-blue-200 text-sm mb-3">AI Knowledge Agent</p>
                <p className="text-blue-300 text-xs leading-relaxed">Startup metrics and VC terminology</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-purple-300 text-sm font-semibold mb-4 tracking-wide">HOW IT WORKS</div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              From Upload to Insights in 5 Steps
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 text-center">
              <div className="bg-gradient-to-br from-teal-400 to-teal-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">1</div>
              <h3 className="text-white font-semibold mb-2">Upload Deck</h3>
              <p className="text-blue-200 text-sm">Upload pitch deck & checklist (PDF, DOCX, PPT up to 100MB)</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 text-center">
              <div className="bg-gradient-to-br from-purple-400 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">2</div>
              <h3 className="text-white font-semibold mb-2">Add Context</h3>
              <p className="text-blue-200 text-sm">Upload meeting notes, transcripts, and due diligence docs (optional)</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 text-center">
              <div className="bg-gradient-to-br from-teal-400 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">3</div>
              <h3 className="text-white font-semibold mb-2">Customize Criteria</h3>
              <p className="text-blue-200 text-sm">Set evaluation weights, add custom criteria with unlimited subcriteria</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 text-center">
              <div className="bg-gradient-to-br from-purple-400 to-teal-400 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">4</div>
              <h3 className="text-white font-semibold mb-2">Get Insights</h3>
              <p className="text-blue-200 text-sm">Receive SSO Score, section analysis, and enhanced PDF reports</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 text-center">
              <div className="bg-gradient-to-br from-sky-400 to-cyan-400 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">5</div>
              <h3 className="text-white font-semibold mb-2">Sector Benchmarking</h3>
              <p className="text-blue-200 text-sm">Compare against industry standards and competitive landscape</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-teal-500/20 to-purple-600/20 backdrop-blur-lg rounded-2xl p-12 border border-white/30 text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Deal Evaluation?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join VCs using AI-powered analysis to make <strong>faster, data-driven</strong> investment decisions
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-teal-500 to-purple-600 text-white px-10 py-4 rounded-lg font-semibold text-lg hover:from-teal-400 hover:to-purple-500 transition-all shadow-xl hover:shadow-2xl inline-flex items-center justify-center space-x-2"
              >
                <Wand2 className="h-6 w-6" />
                <span>Start Analyzing Now</span>
                <ArrowRight className="h-6 w-6" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="bg-white/10 backdrop-blur-lg text-white px-10 py-4 rounded-lg font-semibold text-lg hover:bg-white/20 transition-all border border-white/30 inline-flex items-center justify-center space-x-2"
              >
                <Brain className="h-6 w-6" />
                <span>Explore Features</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>
    </div>
  );
}