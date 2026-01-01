import { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  Construction, 
  ArrowRight, 
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

interface WIPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: () => void;
  featureName: string;
  description: string;
  upcomingFeatures?: string[];
}

export function WIPModal({ 
  isOpen, 
  onClose, 
  onUnlock, 
  featureName, 
  description,
  upcomingFeatures = []
}: WIPModalProps) {
  const [isUnlocking, setIsUnlocking] = useState(false);

  if (!isOpen) return null;

  const handleUnlock = () => {
    setIsUnlocking(true);
    setTimeout(() => {
      onUnlock();
      setIsUnlocking(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4 backdrop-blur-sm">
              <Construction className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2 flex items-center">
              <Lock className="h-7 w-7 mr-3" />
              {featureName}
            </h2>
            <div className="flex items-center space-x-2 text-amber-100">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Work in Progress</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Description */}
          <div className="mb-6">
            <p className="text-slate-700 text-lg leading-relaxed">
              {description}
            </p>
          </div>

          {/* Upcoming Features */}
          {upcomingFeatures.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-6 mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Coming Soon</h3>
              </div>
              <ul className="space-y-3">
                {upcomingFeatures.map((feature, idx) => (
                  <li key={idx} className="flex items-start space-x-3 text-sm text-blue-900">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warning Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex space-x-3">
              <div className="flex-shrink-0">
                <Construction className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-900 mb-1">
                  Early Preview
                </h4>
                <p className="text-sm text-amber-700">
                  This feature is still under development. Some functionality may be limited or change in future updates.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-all"
            >
              Go Back
            </button>
            <button
              onClick={handleUnlock}
              disabled={isUnlocking}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-teal-700 transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isUnlocking ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Unlocking...</span>
                </>
              ) : (
                <>
                  <Unlock className="h-5 w-5" />
                  <span>Try Anyway</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
