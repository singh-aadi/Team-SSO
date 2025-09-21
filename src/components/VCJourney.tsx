import React from 'react';
import {
  Search,
  FileText,
  Target,
  Users,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

export function VCJourney() {
  const vcJourney = [
    {
      stage: 'Deal Sourcing',
      icon: Search,
      description: 'Find and qualify potential investments',
      tasks: [
        { name: 'Review inbound decks', status: 'complete' },
        { name: 'Network referrals', status: 'in-progress' },
        { name: 'Attend pitch events', status: 'pending' },
        { name: 'Screen initial fit', status: 'pending' }
      ],
      ssoPrompts: [
        'Use SSO to compare multiple decks side-by-side',
        'Flag missing sections automatically'
      ]
    },
    {
      stage: 'Investment Memo',
      icon: FileText,
      description: 'Write detailed investment analysis',
      tasks: [
        { name: 'Analyze business model', status: 'complete' },
        { name: 'Research market dynamics', status: 'in-progress' },
        { name: 'Assess team capabilities', status: 'in-progress' },
        { name: 'Draft investment memo', status: 'pending' }
      ],
      ssoPrompts: [
        'Benchmark metrics against portfolio companies',
        'Use SSO Glossary™ for consistent definitions'
      ]
    },
    {
      stage: 'Due Diligence',
      icon: Target,
      description: 'Deep dive validation and risk assessment',
      tasks: [
        { name: 'Financial audit', status: 'pending' },
        { name: 'Customer interviews', status: 'pending' },
        { name: 'Technical review', status: 'pending' },
        { name: 'Legal review', status: 'pending' }
      ],
      ssoPrompts: [
        'Validate claimed metrics against benchmarks',
        'Check competitive positioning'
      ]
    },
    {
      stage: 'Investment Committee',
      icon: Users,
      description: 'Present to partners for final decision',
      tasks: [
        { name: 'Prepare IC presentation', status: 'pending' },
        { name: 'Address partner questions', status: 'pending' },
        { name: 'Negotiate terms', status: 'pending' },
        { name: 'Close deal', status: 'pending' }
      ],
      ssoPrompts: [
        'Export SSO analysis for IC presentation',
        'Compare risk factors across portfolio'
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
          <h1 className="text-2xl font-bold text-slate-900">VC Journey</h1>
          <p className="text-slate-600 mt-1">
            Navigate your investment journey with SSO intelligence
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {vcJourney.map((stage) => {
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