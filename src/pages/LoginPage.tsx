import { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { jwtDecode } from 'jwt-decode';

export function LoginPage() {
  const { login, loginWithEmail, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const success = loginWithEmail(email, password);
    if (!success) {
      setError('Invalid email or password');
    }
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
          {/* Email/Password Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign in
            </button>
          </form>

          {/* Demo Credentials Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-xs text-blue-800">
            <p className="font-semibold mb-1">Demo Accounts:</p>
            <p>📧 <strong>demo@startup-scout.com</strong> / password: <strong>demo123</strong></p>
            <p>📧 <strong>admin@startup-scout.com</strong> / password: <strong>admin123</strong></p>
            <p>📧 <strong>vc@startup-scout.com</strong> / password: <strong>vc123</strong></p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Google Login */}
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