import { useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, Target, TrendingUp, Users, Shield, Zap, LineChart, Search } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Search,
      title: 'Deal Flow Intelligence',
      description: 'Advanced screening and scoring for deal sourcing with AI-powered insights'
    },
    {
      icon: BarChart3,
      title: 'Portfolio Analytics',
      description: 'Real-time portfolio performance tracking and benchmarking against market standards'
    },
    {
      icon: Shield,
      title: 'Due Diligence Automation',
      description: 'Comprehensive risk assessment and validation tools for faster decision-making'
    },
    {
      icon: TrendingUp,
      title: 'Market Intelligence',
      description: 'Track trends, valuations, and competitive landscapes across sectors'
    },
    {
      icon: LineChart,
      title: 'Predictive Analytics',
      description: 'Data-driven forecasting for startup performance and exit potential'
    },
    {
      icon: Users,
      title: 'Founder-VC Alignment',
      description: 'Bridge the gap between VCs and founders with shared intelligence and insights'
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
          <div className="text-teal-300 text-sm font-semibold mb-4 tracking-wide">POWERED BY LETSVENTURE</div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Intelligent Deal Flow
            <br />
            <span className="text-teal-300">For Modern VCs</span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto">
            Advanced scouting, due diligence automation, and portfolio intelligence platform 
            designed to help VCs make faster, smarter investment decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="bg-white text-blue-800 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Get Started</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-800 transition-colors">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
            Your Complete VC Intelligence Platform
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 hover:bg-white/20 transition-colors"
                >
                  <Icon className="h-8 w-8 text-teal-300 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-blue-100">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to elevate your investment strategy?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join leading VCs leveraging Startup Scout & Optioneers for superior deal intelligence.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-teal-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-teal-400 transition-colors inline-flex items-center space-x-2"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="h-5 w-5" />
          </button>
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