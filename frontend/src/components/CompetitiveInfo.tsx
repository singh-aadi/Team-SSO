import { useState } from 'react';
import { Target, X } from 'lucide-react';

export function CompetitiveInfo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200"
      >
        <Target className="h-5 w-5" />
        <span className="text-sm font-medium">USP Radar</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900">USP Radar</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="border-b pb-3">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Competitive Landscape</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    Direct competitors analysis
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    Market positioning
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    Differentiation factors
                  </li>
                </ul>
              </div>

              <div className="border-b pb-3">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Market Dynamics</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                    Market size & growth
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                    Industry trends
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                    Regulatory environment
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">Key Insights</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                    Market opportunities
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                    Potential risks
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                    Growth strategies
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t">
              <button
                onClick={() => {
                  // Add logic to show detailed analysis in a modal or new page
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View Full Analysis →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
