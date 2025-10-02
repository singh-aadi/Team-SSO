import { useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleSuccess = (response: any) => {
    const decoded = jwtDecode(response.credential);
    login(decoded);
  };

  const handleGoogleError = () => {
    console.error('Google Sign In was unsuccessful');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-800 to-teal-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-800 to-teal-600 rounded-lg flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">SS</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Startup Scout & Optioneers
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            A premium LVx product for VCs and founders
          </p>
          <p className="mt-1 text-center text-xs text-gray-500">
            Sign in to access your intelligence dashboard
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
            />
          </div>
          
          <div className="text-center text-sm text-gray-500">
            By signing in, you agree to our{' '}
            <a href="/terms" className="font-medium text-blue-600 hover:text-blue-500">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="font-medium text-blue-600 hover:text-blue-500">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}