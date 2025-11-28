import { useState, useRef, useEffect } from 'react';
import { Compass, TrendingUp, User, LogOut, RefreshCw, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CompetitiveInfo } from './CompetitiveInfo';

export function Header() {
  const { user, userRole, logout, updateUserRole } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isChangingRole, setIsChangingRole] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleChange = async (newRole: 'founder' | 'vc') => {
    if (newRole === userRole) return;

    setIsChangingRole(true);
    try {
      await updateUserRole(newRole);
      setShowProfileMenu(false);
    } catch (error) {
      console.error('Failed to change role:', error);
      alert('Failed to change role. Please try again.');
    } finally {
      setIsChangingRole(false);
    }
  };

  const getRoleBadgeColor = () => {
    if (userRole === 'founder') return 'bg-blue-100 text-blue-700';
    if (userRole === 'vc') return 'bg-teal-100 text-teal-700';
    return 'bg-slate-100 text-slate-700';
  };

  const getRoleLabel = () => {
    if (userRole === 'founder') return 'Founder';
    if (userRole === 'vc') return 'VC';
    return 'User';
  };

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
        </div>
        
        <div className="flex items-center space-x-4">
          {userRole === 'vc' && <CompetitiveInfo />}
          
          {/* User Profile Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {user?.picture ? (
                <img 
                  src={user.picture} 
                  alt={user.name} 
                  className="w-9 h-9 rounded-full"
                />
              ) : (
                <div className="w-9 h-9 bg-gradient-to-br from-blue-800 to-teal-600 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
              )}
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                <p className={`text-xs px-2 py-0.5 rounded-full inline-block ${getRoleBadgeColor()}`}>
                  {getRoleLabel()}
                </p>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>

                {/* Role Switcher */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Switch Role
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleRoleChange('founder')}
                      disabled={isChangingRole || userRole === 'founder'}
                      className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${
                        userRole === 'founder'
                          ? 'bg-blue-100 text-blue-700 cursor-default'
                          : 'bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                      } ${isChangingRole ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Founder
                    </button>
                    <button
                      onClick={() => handleRoleChange('vc')}
                      disabled={isChangingRole || userRole === 'vc'}
                      className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${
                        userRole === 'vc'
                          ? 'bg-teal-100 text-teal-700 cursor-default'
                          : 'bg-slate-50 text-slate-700 hover:bg-teal-50 hover:text-teal-700'
                      } ${isChangingRole ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      VC
                    </button>
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={logout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}