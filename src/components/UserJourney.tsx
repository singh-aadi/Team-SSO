import React, { useState } from 'react';
import {
  Route,
  Users,
  Lightbulb,
  Target,
  TrendingUp,
  FileText,
  Search,
  MessageSquare,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

interface UserJourneyProps {
  userType: 'founder' | 'vc';
}

export function UserJourney({ userType }: UserJourneyProps) {
  const [selectedJourney, setSelectedJourney] = useState(userType);

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

  const currentJourney = selectedJourney === 'founder' ? founderJourney : vcJourney;

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
          <h1 className="text-2xl font-bold text-slate-900">User Journey Copilot</h1>
          <p className="text-slate-600 mt-1">
            Navigate the {selectedJourney} journey with SSO intelligence
          </p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setSelectedJourney('founder')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              selectedJourney === 'founder'
                ? 'bg-white text-blue-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Founder Journey
          </button>
          <button
            onClick={() => setSelectedJourney('vc')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              selectedJourney === 'vc'
                ? 'bg-white text-blue-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            VC Journey
          </button>
        </div>
      </div>

      {/* Journey Timeline */}
      <div className="space-y-6">
        {currentJourney.map((stage, index) => {
          const Icon = stage.icon;
          const isLast = index === currentJourney.length - 1;
          
          return (
            <div key={index} className="relative">
              {!isLast && (
                <div className="absolute left-6 top-16 w-0.5 h-full bg-slate-200"></div>
              )}
              
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-800 to-teal-600 rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{stage.stage}</h3>
                        <p className="text-slate-600">{stage.description}</p>
                      </div>
                      <span className="text-sm font-medium text-slate-500">Stage {index + 1}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Tasks */}
                      <div>
                        <h4 className="font-medium text-slate-900 mb-3">Tasks</h4>
                        <div className="space-y-2">
                          {stage.tasks.map((task, taskIndex) => {
                            const StatusIcon = getStatusIcon(task.status);
                            return (
                              <div key={taskIndex} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50">
                                <StatusIcon className={`h-4 w-4 ${getStatusColor(task.status).split(' ')[0]}`} />
                                <span className="text-sm text-slate-700">{task.name}</span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                                  {task.status}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* SSO Prompts */}
                      <div>
                        <h4 className="font-medium text-slate-900 mb-3">SSO Intelligence Prompts</h4>
                        <div className="space-y-3">
                          {stage.ssoPrompts.map((prompt, promptIndex) => (
                            <div key={promptIndex} className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-lg p-3">
                              <div className="flex items-start space-x-2">
                                <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-blue-800">{prompt}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Journey Progress Summary */}
      <div className="bg-gradient-to-br from-blue-800 to-teal-600 text-white rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Journey Progress</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {currentJourney.map((stage, index) => {
            const completedTasks = stage.tasks.filter(task => task.status === 'complete').length;
            const totalTasks = stage.tasks.length;
            const progress = Math.round((completedTasks / totalTasks) * 100);
            
            return (
              <div key={index} className="text-center">
                <p className="text-2xl font-bold">{progress}%</p>
                <p className="text-sm text-blue-100">{stage.stage}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Friction Points */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Common Friction Points</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-slate-900 mb-3">Founder Challenges</h3>
            <div className="space-y-2">
              {[
                'Inconsistent metric definitions confuse investors',
                'Lack of benchmark context for metrics',
                'Missing key sections in pitch decks',
                'Unclear competitive positioning'
              ].map((challenge, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                  <p className="text-sm text-slate-700">{challenge}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-slate-900 mb-3">VC Challenges</h3>
            <div className="space-y-2">
              {[
                'Time-consuming deck comparison process',
                'Inconsistent memo formats across team',
                'Difficulty validating claimed metrics',
                'Lack of standardized evaluation criteria'
              ].map((challenge, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                  <p className="text-sm text-slate-700">{challenge}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">How SSO Helps</h4>
              <p className="text-sm text-blue-800 mt-1">
                Our platform addresses these friction points by standardizing definitions, providing benchmark context, 
                and offering intelligent prompts at each stage of the journey.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center py-4">
        <p className="text-xs text-slate-400">Journey intelligence powered by Team SSO</p>
      </div>
    </div>
  );
}