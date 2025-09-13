import React, { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { DeckIntelligence } from './components/DeckIntelligence';
import { BenchmarkEngine } from './components/BenchmarkEngine';
import { Glossary } from './components/Glossary';
import { UserJourney } from './components/UserJourney';
import { CompetitiveAudit } from './components/CompetitiveAudit';
import { InsightHub } from './components/InsightHub';
import { Guide } from './components/Guide';

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
      case 'journeys':
        return <UserJourney userType={userType} />;
      case 'competitive':
        return <CompetitiveAudit />;
      case 'insights':
        return <InsightHub />;
      case 'guide':
        return <Guide />;
      default:
        return <Dashboard userType={userType} onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header userType={userType} onUserTypeChange={setUserType} />
      <div className="flex">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
        <main className="flex-1 p-6">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default App;