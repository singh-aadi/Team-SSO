import { useState } from 'react';
import {
  FileText,
  Route,
  Search,
  BarChart3,
  Sliders,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CheckCircle
} from 'lucide-react';

export function VCGuide({ onNavigate }: { onNavigate: (view: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const steps = [
    {
      id: 'vc-journey',
      name: 'VC Journey Overview',
      icon: Route,
      description: 'Start here to understand the complete investment workflow and best practices',
      action: () => onNavigate('vc-journey')
    },
    {
      id: 'decks',
      name: 'Deck Intelligence',
      icon: FileText,
      description: 'Analyze pitch decks with AI-powered insights and standardized scoring',
      action: () => onNavigate('decks')
    },
    {
      id: 'startup-radar',
      name: 'Startup Radar',
      icon: Search,
      description: 'Discover and track promising startups in your target sectors',
      action: () => onNavigate('startup-radar')
    },
    {
      id: 'benchmarks',
      name: 'Industry Benchmarks',
      icon: BarChart3,
      description: 'Compare metrics across industries and stages for due diligence',
      action: () => onNavigate('benchmarks')
    },
    {
      id: 'vc-mode',
      name: 'VC Mode',
      icon: Sliders,
      description: 'Customize your investment thesis and scoring criteria',
      action: () => onNavigate('vc-mode')
    },
    {
      id: 'glossary',
      name: 'SSO Glossary™',
      icon: BookOpen,
      description: 'Ensure consistent metric definitions across your portfolio',
      action: () => onNavigate('glossary')
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-6">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-900">
            Recommended VC Workflow
          </h2>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-slate-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400" />
        )}
      </div>

      {isExpanded && (
        <div className="p-4 pt-0">
          <div className="border-l-2 border-blue-200 ml-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className="relative ml-6 pb-4 last:pb-0"
                >
                  {/* Connection line */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-0 top-8 bottom-0 w-0.5 -ml-4 bg-blue-200" />
                  )}
                  
                  {/* Step content */}
                  <button
                    onClick={step.action}
                    className="group flex items-start hover:bg-slate-50 p-2 rounded-lg -ml-2 transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="ml-3 text-left">
                      <h3 className="text-sm font-medium text-slate-900">
                        {step.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {step.description}
                      </p>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}