import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';
import { getNavigationForRole } from '../config/navigation';
import { WIPModal } from './WIPModal';

interface SidebarProps {
  userType: 'founder' | 'vc';
}

export function Sidebar({ userType }: SidebarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const navigation = getNavigationForRole(userType);
  
  const [wipModal, setWipModal] = useState<{
    isOpen: boolean;
    feature: string;
    description: string;
    path: string;
    upcomingFeatures: string[];
  }>({
    isOpen: false,
    feature: '',
    description: '',
    path: '',
    upcomingFeatures: [],
  });

  const handleWIPClick = (item: any) => {
    setWipModal({
      isOpen: true,
      feature: item.label,
      description: item.description || 'This feature is currently under development.',
      path: item.path,
      upcomingFeatures: item.upcomingFeatures || [],
    });
  };

  const handleUnlock = () => {
    navigate(wipModal.path);
    setWipModal({ ...wipModal, isOpen: false });
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col">
      <WIPModal
        isOpen={wipModal.isOpen}
        onClose={() => setWipModal({ ...wipModal, isOpen: false })}
        onUnlock={handleUnlock}
        featureName={wipModal.feature}
        description={wipModal.description}
        upcomingFeatures={wipModal.upcomingFeatures}
      />
      
      <nav className="flex-1 p-4">
        {navigation.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          const isWIP = item.isWIP;
          
          // Check if we need a divider before this item
          const prevItem = index > 0 ? navigation[index - 1] : null;
          const needsDivider = prevItem && prevItem.section !== item.section;
          
          return (
            <div key={item.path}>
              {/* Add divider between sections */}
              {needsDivider && (
                <div className="border-t border-slate-200 my-3"></div>
              )}
              
              {isWIP ? (
                // WIP items show modal on click
                <button
                  onClick={() => handleWIPClick(item)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-amber-50 transition-all mb-2"
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5 text-slate-400" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                    WIP
                  </span>
                </button>
              ) : (
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `
                    w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all mb-2
                    ${isActive
                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}