import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router';

interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (response: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user data exists in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (googleResponse: any) => {
    const userData: User = {
      id: googleResponse.sub || googleResponse.id,
      name: googleResponse.name,
      email: googleResponse.email,
      picture: googleResponse.picture,
    };
    
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    navigate('/dashboard'); // Redirect to dashboard after login
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/landing');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}