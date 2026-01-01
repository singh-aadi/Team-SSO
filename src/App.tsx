import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GeminiModelProvider } from './context/GeminiModelContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { DeckIntelligence } from './components/DeckIntelligence';
import { BenchmarkEngine } from './components/BenchmarkEngine';
import { BenchmarkAnalysis } from './components/BenchmarkAnalysis';
import { Glossary } from './components/Glossary';
import { FounderJourney } from './components/FounderJourney';
import { VCJourney } from './components/VCJourney';
import { CompetitiveAudit } from './components/CompetitiveAudit';
import { RiskAnalysis } from './components/RiskAnalysis';
import { CommunicationAnalysis } from './components/CommunicationAnalysis';
import { VCMode } from './components/VCMode';
import { StartupRadar } from './components/StartupRadar';
import { RoleSelectionModal } from './components/RoleSelectionModal';
import VCLens from './components/VCLens';
import VCChat from './pages/VCChat';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function App() {
  return (
    <Router>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <GeminiModelProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </GeminiModelProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </Router>
  );
}

function MainLayout() {
  const { userRole, needsRoleSelection, updateUserRole } = useAuth();
  const [isRoleLoading, setIsRoleLoading] = useState(false);

  const handleRoleSelection = async (role: 'founder' | 'vc') => {
    setIsRoleLoading(true);
    try {
      await updateUserRole(role);
    } catch (error) {
      console.error('Failed to set role:', error);
    } finally {
      setIsRoleLoading(false);
    }
  };

  // Show role selection modal if user hasn't selected a role
  if (needsRoleSelection) {
    return (
      <div className="flex h-screen bg-slate-50">
        <RoleSelectionModal 
          onSelectRole={handleRoleSelection}
          isLoading={isRoleLoading}
        />
      </div>
    );
  }

  // Use the persisted user role
  const userType = userRole || 'founder';

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar userType={userType} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/dashboard" element={<Dashboard userType={userType} />} />
            <Route path="/decks" element={<DeckIntelligence userType={userType} />} />
            <Route path="/benchmarks" element={<BenchmarkEngine userType={userType} />} />
            <Route path="/sector-benchmarks" element={<BenchmarkAnalysis />} />
            <Route path="/glossary" element={<Glossary />} />
            <Route path="/founder-journey" element={<FounderJourney />} />
            <Route path="/vc-journey" element={<VCJourney />} />
            <Route path="/competitive" element={<CompetitiveAudit />} />
            <Route path="/startup-radar" element={<StartupRadar />} />
            <Route path="/risk-assessment" element={<RiskAnalysis />} />
            <Route path="/communication" element={<CommunicationAnalysis />} />
            <Route path="/vc-mode" element={<VCMode />} />
            <Route path="/vc-lens" element={<VCLens />} />
            <Route path="/vc-chat" element={<VCChat />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
