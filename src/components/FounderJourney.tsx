import React from 'react';
import {
  Lightbulb,
  Target,
  TrendingUp,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

export function FounderJourney() {
  const founderJourney = [
    {
      stage: 'Ideation',
      icon: Lightbulb,
      description: 'Validate problem-solution fit',
      tasks: [
        { name: 'Define problem statement', status: 'complete' },
        { name: 'Research market size', status: 'complete' },
        { name: 'Interview potential customers', status: 'in-progress' },
        { name: 'Create initial wireframes', status: 'pending' }
      ],
      ssoPrompts: [
        'Use SSO Glossary™ to define "TAM" consistently',
        'Benchmark problem urgency against similar startups'
      ]
    },
    {
      stage: 'MVP Development',
      icon: Target,
      description: 'Build and test minimum viable product',
      tasks: [
        { name: 'Define core features', status: 'complete' },
        { name: 'Build MVP', status: 'in-progress' },
        { name: 'User testing', status: 'pending' },
        { name: 'Iterate based on feedback', status: 'pending' }
      ],
      ssoPrompts: [
        'Track early user metrics (DAU, retention)',
        'Compare feature adoption vs benchmarks'
      ]
    },
    {
      stage: 'Fundraising Prep',
      icon: FileText,
      description: 'Prepare pitch deck and metrics',
      tasks: [
        { name: 'Create pitch deck', status: 'in-progress' },
        { name: 'Gather financial data', status: 'complete' },
        { name: 'Practice pitch', status: 'pending' },
        { name: 'Identify target investors', status: 'pending' }
      ],
      ssoPrompts: [
        'Upload deck for SSO Readiness Score™',
        'Benchmark metrics against stage/sector'
      ]
    },
    {
      stage: 'Growth & Scale',
      icon: TrendingUp,
      description: 'Scale operations and team',
      tasks: [
        { name: 'Hire key team members', status: 'pending' },
        { name: 'Implement growth strategies', status: 'pending' },
        { name: 'Monitor key metrics', status: 'pending' },
        { name: 'Prepare for next round', status: 'pending' }
      ],
      ssoPrompts: [
        'Track CAC, LTV, and churn benchmarks',
        'Prepare Series A deck with updated metrics'
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'text-green-600 bg-green-50';
      case 'in-progress': return 'text-orange-600 bg-orange-50';
      case 'pending': return 'text-slate-600 bg-slate-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return CheckCircle;
      case 'in-progress': return Clock;
      case 'pending': return AlertCircle;
      default: return AlertCircle;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Founder Journey</h1>
          <p className="text-slate-600 mt-1">
            Navigate your startup journey with SSO intelligence
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {founderJourney.map((stage) => {
          const Icon = stage.icon;
          return (
            <div
              key={stage.stage}
              className="p-6 bg-white rounded-xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{stage.stage}</h3>
                  <p className="text-sm text-slate-600">{stage.description}</p>
                </div>
              </div>

              <div className="space-y-3">
                {stage.tasks.map((task) => {
                  const StatusIcon = getStatusIcon(task.status);
                  return (
                    <div
                      key={task.name}
                      className="flex items-center space-x-3"
                    >
                      <StatusIcon
                        className={`h-5 w-5 ${getStatusColor(task.status)}`}
                      />
                      <span className="text-sm text-slate-600">{task.name}</span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2">
                {stage.ssoPrompts.map((prompt, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-2 text-sm text-blue-600"
                  >
                    <span>→</span>
                    <span>{prompt}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}