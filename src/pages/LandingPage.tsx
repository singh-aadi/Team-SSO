import { useNavigate } from 'react-router';
import { useEffect } from 'react';

export function LandingPage() {
  const navigate = useNavigate();

  // TEMPORARILY DISABLED FOR DEMO - REDIRECT TO DASHBOARD
  // To re-enable the full landing page, restore the original LandingPage.tsx content
  useEffect(() => {
    navigate('/dashboard');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p>Redirecting to dashboard...</p>
      </div>
    </div>
  );
}