import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  role?: 'founder' | 'vc' | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: 'founder' | 'vc' | null;
  needsRoleSelection: boolean;
  login: (response: any) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<boolean>;
  quickLoginAs: (role: 'founder' | 'vc') => void;
  logout: () => void;
  updateUserRole: (role: 'founder' | 'vc') => Promise<void>;
  fetchUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'founder' | 'vc' | null>(null);
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Dummy test accounts - ONLY FOR DEVELOPMENT
  // Pre-configured with roles to skip role selection modal
  const testAccounts = [
    {
      email: 'vc@startup-scout.com',
      password: 'vc123',
      name: 'VC Partner',
      id: 'vc-001',
      role: 'vc' as const
    },
    {
      email: 'founder@startup-scout.com',
      password: 'founder123',
      name: 'Founder',
      id: 'founder-001',
      role: 'founder' as const
    },
    {
      email: 'demo@startup-scout.com',
      password: 'demo123',
      name: 'Demo User',
      id: 'demo-001',
      role: 'vc' as const
    },
    {
      email: 'admin@startup-scout.com',
      password: 'admin123',
      name: 'Admin User',
      id: 'admin-001',
      role: 'founder' as const
    }
  ];

  // Fetch user role from backend
  const fetchUserRole = async () => {
    if (!user?.email) return;

    try {
      const response = await fetch(`${API_URL}/auth/role?email=${encodeURIComponent(user.email)}`);
      const data = await response.json();

      if (data.success) {
        const role = data.data.role;
        setUserRole(role);
        setNeedsRoleSelection(!role); // If role is null, user needs to select

        // Update user object with role
        const updatedUser = { ...user, role };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setNeedsRoleSelection(true); // Assume needs selection on error
    }
  };

  // Update user role
  const updateUserRole = async (role: 'founder' | 'vc') => {
    if (!user?.email) return;

    try {
      const response = await fetch(`${API_URL}/auth/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          role,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUserRole(role);
        setNeedsRoleSelection(false);

        // Update user object with role
        const updatedUser = { ...user, role };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));

        // Navigate to dashboard after role selection
        navigate('/dashboard');
      } else {
        throw new Error(data.error || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Check if user data exists in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setUserRole(parsedUser.role || null);
      
      // If user exists but no role, they need to select
      if (!parsedUser.role) {
        setNeedsRoleSelection(true);
      }
    }
    setIsLoading(false);
  }, []);

  // Fetch role when user changes
  useEffect(() => {
    if (user && !userRole) {
      fetchUserRole();
    }
  }, [user]);

  const login = async (googleResponse: any) => {
    const userData: User = {
      id: googleResponse.sub || googleResponse.id,
      name: googleResponse.name,
      email: googleResponse.email,
      picture: googleResponse.picture,
      role: 'vc', // Default to VC role for Google sign-in (you can change this)
    };
    
    // Set role immediately (bypass role selection modal)
    setUserRole('vc');
    setNeedsRoleSelection(false);
    
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    navigate('/dashboard'); // Redirect to dashboard after login
  };

  const loginWithEmail = async (email: string, password: string): Promise<boolean> => {
    // Check if credentials match any test account
    const account = testAccounts.find(
      acc => acc.email.toLowerCase() === email.toLowerCase() && acc.password === password
    );

    if (account) {
      const userData: User = {
        id: account.id,
        name: account.name,
        email: account.email,
        role: account.role, // Pre-assign role from test account
      };
      
      // Set role immediately from test account (bypass backend check)
      setUserRole(account.role);
      setNeedsRoleSelection(false); // Skip role selection modal
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      navigate('/dashboard');
      return true;
    }
    
    return false;
  };

  // Quick login helper - sets a demo user with the requested role (for testing)
  const quickLoginAs = (role: 'founder' | 'vc') => {
    const account = testAccounts.find(acc => acc.role === role);
    const userData: User = {
      id: account?.id || `demo-${role}`,
      name: account?.name || (role === 'vc' ? 'VC Demo' : 'Founder Demo'),
      email: account?.email || `${role}@startup-scout.com`,
      role: role,
    };

    setUserRole(role);
    setNeedsRoleSelection(false);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    navigate('/dashboard');
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
        userRole,
        needsRoleSelection,
        login,
        loginWithEmail,
        quickLoginAs,
        logout,
        updateUserRole,
        fetchUserRole,
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