import React, { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { DeckIntelligence } from './components/DeckIntelligence';
import { BenchmarkEngine } from './components/BenchmarkEngine';
import { Glossary } from './components/Glossary';
import { FounderJourney } from './components/FounderJourney';
import { VCJourney } from './components/VCJourney';
import { VCGuide } from './components/VCGuide';
import { CompetitiveAudit } from './components/CompetitiveAudit';
import { InsightHub } from './components/InsightHub';
import { RiskAnalysis } from './components/RiskAnalysis';
import { CommunicationAnalysis } from './components/CommunicationAnalysis';
import { VCMode } from './components/VCMode';
import { StartupRadar } from './components/StartupRadar';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [userType, setUserType] = useState<'founder' | 'vc'>('founder');

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard userType={userType} onNavigate={setActiveView} />;
      case 'decks':
        return <DeckIntelligence userType={userType} />;
      case 'benchmarks':
        return <BenchmarkEngine userType={userType} />;
      case 'glossary':
        return <Glossary />;
      case 'founder-journey':
        return <FounderJourney />;
      case 'vc-journey':
        return <VCJourney />;
      case 'competitive':
        return <CompetitiveAudit />;
      case 'startup-radar':
        return <StartupRadar />;
      case 'risk-assessment':
        return <RiskAnalysis />;
      case 'communication':
        return <CommunicationAnalysis />;
      case 'vc-mode':
        return <VCMode />;
      default:
        return <Dashboard userType={userType} onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header userType={userType} onUserTypeChange={setUserType} />
      <div className="flex">
        <Sidebar activeView={activeView} onViewChange={setActiveView} userType={userType} />
        <main className="flex-1 p-6">
          {userType === 'vc' && <VCGuide onNavigate={setActiveView} />}
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default App;