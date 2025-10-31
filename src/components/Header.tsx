import React from 'react';
import { Compass, TrendingUp } from 'lucide-react';
import { CompetitiveInfo } from './CompetitiveInfo';

interface HeaderProps {
  userType: 'founder' | 'vc';
  onUserTypeChange: (type: 'founder' | 'vc') => void;
}

export function Header({ userType, onUserTypeChange }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Compass className="h-8 w-8 text-blue-800" />
              <TrendingUp className="h-4 w-4 text-teal-600 absolute -bottom-1 -right-1" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Team SSO</h1>
              <p className="text-xs text-slate-600">Startup Scout & Optioneers</p>
            </div>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm text-slate-600 ml-6">Smarter Decisions, Stronger Startups.</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {userType === 'vc' && <CompetitiveInfo />}
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => onUserTypeChange('founder')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                userType === 'founder'
                  ? 'bg-white text-blue-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Founder
            </button>
            <button
              onClick={() => onUserTypeChange('vc')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                userType === 'vc'
                  ? 'bg-white text-blue-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              VC
            </button>
          </div>
          
          <div className="w-10 h-10 bg-gradient-to-br from-blue-800 to-teal-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">SSO</span>
          </div>
        </div>
      </div>
    </header>
  );
}