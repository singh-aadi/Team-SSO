import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, FileStack, Brain, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { VCContextManager } from './VCContextManager';
import { AdvancedVCEvaluation } from './AdvancedVCEvaluation';

export function VCMode() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasVCContext, setHasVCContext] = useState(false);
  const [hasAdvancedPreferences, setHasAdvancedPreferences] = useState(false);
  const [contextItemCount, setContextItemCount] = useState(0);

  useEffect(() => {
    checkVCContextStatus();
    checkAdvancedPreferencesStatus();
  }, [user]);

  const checkVCContextStatus = async () => {
    try {
      // Check if user has exported any context to deck intelligence
      const response = await fetch(`http://localhost:3000/api/vc-mode/check-context/${user?.id || '1'}`);
      if (response.ok) {
        const data = await response.json();
        setHasVCContext(data.hasContext || false);
        setContextItemCount(data.itemCount || 0);
      } else {
        // Fallback: assume no context
        setHasVCContext(false);
        setContextItemCount(0);
      }
    } catch (err) {
      console.log('No VC context found');
      setHasVCContext(false);
      setContextItemCount(0);
    }
  };

  const checkAdvancedPreferencesStatus = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/vc-preferences/${user?.id || '1'}`);
      if (response.ok) {
        const data = await response.json();
        setHasAdvancedPreferences(data.preferences && data.preferences.length > 0);
      } else {
        setHasAdvancedPreferences(false);
      }
    } catch (err) {
      console.log('No preferences found');
      setHasAdvancedPreferences(false);
    }
  };

  const handleContextUpdate = () => checkVCContextStatus();
  const handlePreferencesUpdate = () => checkAdvancedPreferencesStatus();
  const navigateToDeckIntelligence = () => navigate('/deck-intelligence');

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Brain className="w-8 h-8" />
              VC Mode
            </h1>
            <p className="text-purple-100 text-lg">Configure your investment criteria and context for intelligent deck analysis</p>
          </div>
          
          <div className="flex flex-col gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${ hasVCContext ? 'bg-green-500/20 border-2 border-green-300' : 'bg-white/10 border-2 border-white/30'}`}>
              {hasVCContext ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span className="font-medium">VC Context Active</span>
                  <span className="text-xs bg-green-300 text-green-900 px-2 py-0.5 rounded-full">{contextItemCount} items</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-white/50" />
                  <span className="font-medium text-white/70">No Context Yet</span>
                </>
              )}
            </div>
            
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${ hasAdvancedPreferences ? 'bg-blue-500/20 border-2 border-blue-300' : 'bg-white/10 border-2 border-white/30'}`}>
              {hasAdvancedPreferences ? (
                <>
                  <CheckCircle className="w-5 h-5 text-blue-300" />
                  <span className="font-medium">Preferences Saved</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-white/50" />
                  <span className="font-medium text-white/70">No Preferences</span>
                </>
              )}
            </div>
          </div>
        </div>

        {(hasVCContext || hasAdvancedPreferences) && (
          <div className="mt-6 pt-6 border-t border-white/20">
            <button onClick={navigateToDeckIntelligence} className="w-full bg-white text-purple-700 hover:bg-purple-50 px-6 py-4 rounded-lg font-semibold flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl">
              <Sparkles className="w-5 h-5" />
              <span>Analyze Deck with VC Intelligence</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-center text-purple-100 text-sm mt-2">
              {hasVCContext && hasAdvancedPreferences ? ' Both context and preferences will be used in analysis' : hasVCContext ? 'VC Context will enhance your analysis' : 'Saved preferences will guide the evaluation'}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200 hover:border-green-400 transition-colors">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <FileStack className="w-6 h-6 text-green-600" />
            Due Diligence Context
            {hasVCContext && (
              <span className="ml-auto flex items-center gap-1 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                <CheckCircle className="w-4 h-4" />
                Active
              </span>
            )}
          </h2>
          <p className="text-gray-600">Upload meeting transcripts, research notes, and context documents. AI will synthesize everything into actionable insights.</p>
        </div>
        <VCContextManager 
          globalMode={true} 
          embedded={true}
          onContextUpdate={handleContextUpdate} 
        />
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200 hover:border-blue-400 transition-colors">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-600" />
            Advanced VC Evaluation
            {hasAdvancedPreferences && (
              <span className="ml-auto flex items-center gap-1 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                <CheckCircle className="w-4 h-4" />
                Saved
              </span>
            )}
          </h2>
          <p className="text-gray-600">Configure your 4-layer agentic evaluation system with dealbreakers, patterns, context weights, and thesis alignment.</p>
        </div>
        <AdvancedVCEvaluation userId={user?.id || 'demo-user'} onPreferencesUpdate={handlePreferencesUpdate} />
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          How It Works
        </h3>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-xs">1</span>
            <p><strong>Add Context:</strong> Upload meeting notes, transcripts, or research. System exports to Deck Intelligence automatically.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xs">2</span>
            <p><strong>Configure Preferences:</strong> Set up your 4-layer evaluation criteria. Save preferences for reuse across decks.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-xs">3</span>
            <p><strong>Analyze Decks:</strong> Navigate to Deck Intelligence. Your context and preferences automatically enhance AI analysis!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
