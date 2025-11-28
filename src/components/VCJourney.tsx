import { useState } from 'react';
import { Eye, MessageSquare } from 'lucide-react';
import VCLens from './VCLens';
import VCChat from '../pages/VCChat';

type View = 'vc-lens' | 'vc-chat';

export function VCJourney() {
  const [activeView, setActiveView] = useState<View>('vc-lens');

  return (
    <div className="p-1.5 space-y-1.5">
      {/* Tab Navigation - Similar to Deck Intelligence */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200">
          <div className="flex">
            <button
              onClick={() => setActiveView('vc-lens')}
              className={`flex-1 px-6 py-4 font-medium transition-all relative ${
                activeView === 'vc-lens'
                  ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>VC Lens</span>
              </div>
            </button>
            <button
              onClick={() => setActiveView('vc-chat')}
              className={`flex-1 px-6 py-4 font-medium transition-all relative ${
                activeView === 'vc-chat'
                  ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>VC Chat</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div>
          {activeView === 'vc-lens' && <VCLens />}
          {activeView === 'vc-chat' && <VCChat />}
        </div>
      </div>
    </div>
  );
}