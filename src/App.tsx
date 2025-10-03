import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router';
// TEMPORARILY DISABLED FOR DEMO - UNCOMMENT TO RE-ENABLE AUTH
// import { GoogleOAuthProvider } from '@react-oauth/google';
// import { AuthProvider } from './context/AuthContext';
// import { ProtectedRoute } from './components/ProtectedRoute';
// import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { DeckIntelligence } from './components/DeckIntelligence';
import { BenchmarkEngine } from './components/BenchmarkEngine';
import { Glossary } from './components/Glossary';
import { FounderJourney } from './components/FounderJourney';
import { VCJourney } from './components/VCJourney';
import { CompetitiveAudit } from './components/CompetitiveAudit';
import { RiskAnalysis } from './components/RiskAnalysis';
import { CommunicationAnalysis } from './components/CommunicationAnalysis';
import { VCMode } from './components/VCMode';
import { StartupRadar } from './components/StartupRadar';

// TEMPORARILY DISABLED FOR DEMO - UNCOMMENT TO RE-ENABLE AUTH
// const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function App() {
  return (
    <Router>
      {/* TEMPORARILY DISABLED FOR DEMO - UNCOMMENT TO RE-ENABLE AUTH */}
      {/* <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider> */}
          <Routes>
            <Route path="/" element={<LandingPage />} />
            {/* TEMPORARILY DISABLED FOR DEMO - UNCOMMENT TO RE-ENABLE AUTH */}
            {/* <Route path="/login" element={<LoginPage />} /> */}
            <Route
              path="/*"
              element={
                // TEMPORARILY DISABLED FOR DEMO - UNCOMMENT TO RE-ENABLE AUTH
                // <ProtectedRoute>
                  <MainLayout />
                // </ProtectedRoute>
              }
            />
          </Routes>
        {/* TEMPORARILY DISABLED FOR DEMO - UNCOMMENT TO RE-ENABLE AUTH */}
        {/* </AuthProvider>
      </GoogleOAuthProvider> */}
    </Router>
  );
}

function MainLayout() {
  const [userType, setUserType] = useState<'founder' | 'vc'>('founder');

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar userType={userType} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userType={userType} onUserTypeChange={setUserType} />
        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/dashboard" element={<Dashboard userType={userType} />} />
            <Route path="/decks" element={<DeckIntelligence userType={userType} />} />
            <Route path="/benchmarks" element={<BenchmarkEngine userType={userType} />} />
            <Route path="/glossary" element={<Glossary />} />
            <Route path="/founder-journey" element={<FounderJourney />} />
            <Route path="/vc-journey" element={<VCJourney />} />
            <Route path="/competitive" element={<CompetitiveAudit />} />
            <Route path="/startup-radar" element={<StartupRadar />} />
            <Route path="/risk-assessment" element={<RiskAnalysis />} />
            <Route path="/communication" element={<CommunicationAnalysis />} />
            <Route path="/vc-mode" element={<VCMode />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
