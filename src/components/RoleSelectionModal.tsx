import { useState } from 'react';
import { Briefcase, Rocket, CheckCircle2, TrendingUp, Target, Users, BarChart3 } from 'lucide-react';

interface RoleSelectionModalProps {
  onSelectRole: (role: 'founder' | 'vc') => void;
  isLoading?: boolean;
}

export function RoleSelectionModal({ onSelectRole, isLoading = false }: RoleSelectionModalProps) {
  const [selectedRole, setSelectedRole] = useState<'founder' | 'vc' | null>(null);

  const handleConfirm = () => {
    if (selectedRole) {
      onSelectRole(selectedRole);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-8 animate-fadeIn">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-teal-600 rounded-full mb-4">
            <Target className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome to Startup Scout!
          </h2>
          <p className="text-slate-600 text-lg">
            Choose your role to get started with a personalized experience
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Founder Card */}
          <button
            onClick={() => setSelectedRole('founder')}
            disabled={isLoading}
            className={`relative p-6 rounded-xl border-2 transition-all text-left group hover:shadow-lg ${
              selectedRole === 'founder'
                ? 'border-blue-600 bg-blue-50 shadow-lg'
                : 'border-slate-200 hover:border-blue-300'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {/* Selected Indicator */}
            {selectedRole === 'founder' && (
              <div className="absolute top-4 right-4">
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
              </div>
            )}

            {/* Icon */}
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
              selectedRole === 'founder' ? 'bg-blue-600' : 'bg-blue-100 group-hover:bg-blue-200'
            }`}>
              <Rocket className={`h-6 w-6 ${
                selectedRole === 'founder' ? 'text-white' : 'text-blue-600'
              }`} />
            </div>

            {/* Content */}
            <h3 className="text-xl font-bold text-slate-900 mb-2">Founder</h3>
            <p className="text-slate-600 text-sm mb-4">
              Build your startup with AI-powered insights and benchmarks
            </p>

            {/* Features */}
            <ul className="space-y-2">
              <li className="flex items-start text-sm text-slate-700">
                <BarChart3 className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>Dashboard & Analytics</span>
              </li>
              <li className="flex items-start text-sm text-slate-700">
                <Target className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>Deck Intelligence & Scoring</span>
              </li>
              <li className="flex items-start text-sm text-slate-700">
                <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>Industry Benchmarks</span>
              </li>
              <li className="flex items-start text-sm text-slate-700">
                <Rocket className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>Founder Journey & Milestones</span>
              </li>
              <li className="flex items-start text-sm text-slate-700">
                <Briefcase className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>SSO Knowledge Agent</span>
              </li>
            </ul>
          </button>

          {/* VC Card */}
          <button
            onClick={() => setSelectedRole('vc')}
            disabled={isLoading}
            className={`relative p-6 rounded-xl border-2 transition-all text-left group hover:shadow-lg ${
              selectedRole === 'vc'
                ? 'border-teal-600 bg-teal-50 shadow-lg'
                : 'border-slate-200 hover:border-teal-300'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {/* Selected Indicator */}
            {selectedRole === 'vc' && (
              <div className="absolute top-4 right-4">
                <CheckCircle2 className="h-6 w-6 text-teal-600" />
              </div>
            )}

            {/* Icon */}
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
              selectedRole === 'vc' ? 'bg-teal-600' : 'bg-teal-100 group-hover:bg-teal-200'
            }`}>
              <Briefcase className={`h-6 w-6 ${
                selectedRole === 'vc' ? 'text-white' : 'text-teal-600'
              }`} />
            </div>

            {/* Content */}
            <h3 className="text-xl font-bold text-slate-900 mb-2">Venture Capitalist</h3>
            <p className="text-slate-600 text-sm mb-4">
              Discover, analyze, and track promising startups with AI
            </p>

            {/* Features */}
            <ul className="space-y-2">
              <li className="flex items-start text-sm text-slate-700">
                <BarChart3 className="h-4 w-4 text-teal-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>VC Dashboard & Analytics</span>
              </li>
              <li className="flex items-start text-sm text-slate-700">
                <Target className="h-4 w-4 text-teal-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>Deck Intelligence & Due Diligence</span>
              </li>
              <li className="flex items-start text-sm text-slate-700">
                <Users className="h-4 w-4 text-teal-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>VC Journey & Deal Flow</span>
              </li>
              <li className="flex items-start text-sm text-slate-700">
                <TrendingUp className="h-4 w-4 text-teal-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>Startup Radar & Discovery</span>
              </li>
              <li className="flex items-start text-sm text-slate-700">
                <BarChart3 className="h-4 w-4 text-teal-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>Industry Benchmarks & Trends</span>
              </li>
              <li className="flex items-start text-sm text-slate-700">
                <Briefcase className="h-4 w-4 text-teal-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>SSO Knowledge Agent</span>
              </li>
            </ul>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleConfirm}
            disabled={!selectedRole || isLoading}
            className={`px-8 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2 ${
              selectedRole && !isLoading
                ? selectedRole === 'founder'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg'
                  : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Setting up...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <CheckCircle2 className="h-5 w-5" />
              </>
            )}
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Don't worry, you can change your role later in settings
        </p>
      </div>
    </div>
  );
}
