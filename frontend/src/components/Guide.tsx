import React from 'react';

export function Guide() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">SSO Guide</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">Understanding SSO Readiness Score™</h2>
        <p className="text-slate-600 mb-4">
          The SSO Readiness Score™ is our proprietary scoring system that evaluates your startup's pitch deck across ten crucial dimensions. Each dimension is scored on a scale of 0-10, with the final score being the weighted average.
        </p>
        
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Scoring Dimensions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { name: 'Team', description: 'Experience, track record, and complementary skills' },
              { name: 'Problem', description: 'Clear pain point identification and market need' },
              { name: 'Solution', description: 'Value proposition and unique approach' },
              { name: 'Market (TAM)', description: 'Market size and growth potential' },
              { name: 'Product', description: 'Product maturity, features, and roadmap' },
              { name: 'Traction', description: 'Current metrics, growth, and milestones' },
              { name: 'Business Model', description: 'Revenue strategy and unit economics' },
              { name: 'Competition', description: 'Competitive landscape and differentiation' },
              { name: 'Financials', description: 'Financial projections and metrics' },
              { name: 'Funding Ask', description: 'Investment requirements and use of funds' }
            ].map((dimension) => (
              <div key={dimension.name} className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-slate-800">{dimension.name}</h4>
                <p className="text-sm text-slate-600">{dimension.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Score Interpretation</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center mb-2">
                <div className="w-16 h-2 bg-red-500 rounded mr-3"></div>
                <span className="font-medium">1-4: Needs Work</span>
              </div>
              <p className="text-sm text-slate-600 ml-19">Major improvements needed in multiple areas</p>
            </div>
            <div>
              <div className="flex items-center mb-2">
                <div className="w-16 h-2 bg-yellow-500 rounded mr-3"></div>
                <span className="font-medium">5-7: Good</span>
              </div>
              <p className="text-sm text-slate-600 ml-19">Solid foundation with room for enhancement</p>
            </div>
            <div>
              <div className="flex items-center mb-2">
                <div className="w-16 h-2 bg-green-500 rounded mr-3"></div>
                <span className="font-medium">8-10: Excellent</span>
              </div>
              <p className="text-sm text-slate-600 ml-19">Investment-ready with strong potential</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">Feature Guide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: 'Deck Intelligence',
              description: 'AI-powered analysis of your pitch deck with section-by-section feedback and scoring'
            },
            {
              title: 'Benchmarks',
              description: 'Compare your metrics against industry standards and successful startups'
            },
            {
              title: 'SSO Glossary™',
              description: 'Comprehensive dictionary of startup and investment terms'
            },
            {
              title: 'User Journeys',
              description: "Map and optimize your startup's customer experience"
            },
            {
              title: 'Competitive Audit',
              description: 'Analyze your competition and identify market opportunities'
            },
            {
              title: 'Insight Hub',
              description: 'Data-driven insights and recommendations for your startup'
            }
          ].map((feature) => (
            <div key={feature.title} className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">{feature.title}</h3>
              <p className="text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
