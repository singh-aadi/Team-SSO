import React from 'react';

export function RiskAnalysis() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Risk Analysis</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Risk Indicators</h2>
          <div className="space-y-4">
            {[
              {
                name: 'Metric Consistency',
                status: 'warning',
                description: 'Growth metrics show inconsistencies across quarters'
              },
              {
                name: 'Market Size',
                status: 'success',
                description: 'Market size claims align with industry research'
              },
              {
                name: 'Churn Patterns',
                status: 'error',
                description: 'Unusual spike in customer churn last quarter'
              },
              {
                name: 'Founder Background',
                status: 'success',
                description: 'Strong relevant experience and track record'
              }
            ].map((risk) => (
              <div key={risk.name} className={`border-l-4 ${
                risk.status === 'error' ? 'border-red-500' :
                risk.status === 'warning' ? 'border-yellow-500' :
                'border-green-500'
              } pl-4 py-2`}>
                <h3 className="font-semibold text-slate-800">{risk.name}</h3>
                <p className="text-sm text-slate-600">{risk.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Historical Red Flags</h2>
          <div className="space-y-4">
            <div className="border-b pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Financial Projections</span>
                <span className="text-yellow-600 text-sm">Review Required</span>
              </div>
              <p className="text-sm text-slate-600">Revenue projections exceed industry growth rates by 3x</p>
            </div>
            <div className="border-b pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Team Composition</span>
                <span className="text-red-600 text-sm">High Risk</span>
              </div>
              <p className="text-sm text-slate-600">Key technical roles remain unfilled</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
