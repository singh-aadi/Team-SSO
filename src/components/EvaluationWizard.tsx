import { useState, useEffect } from 'react';
import { 
  Upload, 
  CheckCircle, 
  MessageSquare, 
  Settings, 
  Sparkles,
  ArrowRight,
  ArrowLeft,
  SkipForward,
  AlertCircle,
  Loader2,
  Download
} from 'lucide-react';
import { VCContextManager } from './VCContextManager';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
import { AdvancedVCEvaluation } from './AdvancedVCEvaluation';
import { api } from '../services/api';
import { vcContextApi } from '../services/vcContextApi';

interface EvaluationWizardProps {
  onComplete: (deckId: string, hasContext: boolean, hasPreferences: boolean) => void;
  onCancel: () => void;
  userId: string;
}

type WizardStep = 'upload' | 'context' | 'preferences' | 'analyzing';

export function EvaluationWizard({ onComplete, onCancel, userId }: EvaluationWizardProps) {
  // Step navigation
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  
  // Upload step
  const [deckFile, setDeckFile] = useState<File | null>(null);
  const [checklistFile, setChecklistFile] = useState<File | null>(null);
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadedDeckId, setUploadedDeckId] = useState<string | null>(null);
  
  // Context step
  const [hasContext, setHasContext] = useState(false);
  
  // Preferences step - using full criteria structure like VCMode
  const [criteria, setCriteria] = useState<Array<{
    id: string;
    name: string;
    weight: number;
    description: string;
    subcriteria: Array<{ id: string; name: string; weight: number }>;
    customizable?: boolean;
  }>>([
    {
      id: 'team',
      name: 'Team',
      weight: 25,
      description: 'Founder backgrounds, expertise, and ability to execute. Assesses technical skills, domain knowledge, and leadership capabilities.',
      subcriteria: []
    },
    {
      id: 'market',
      name: 'Market Opportunity',
      weight: 25,
      description: 'Total addressable market size, growth rate, and competitive landscape. Evaluates market timing and expansion potential.',
      subcriteria: []
    },
    {
      id: 'product',
      name: 'Product & Technology',
      weight: 25,
      description: 'Problem-solution fit, innovation level, and technical moat. Includes product differentiation and scalability assessment.',
      subcriteria: []
    },
    {
      id: 'traction',
      name: 'Traction & Metrics',
      weight: 15,
      description: 'User growth, revenue metrics, and retention rates. Measures product-market fit through quantifiable business indicators.',
      subcriteria: []
    },
    {
      id: 'finance',
      name: 'Finance',
      weight: 10,
      description: 'Unit economics, burn rate, and path to profitability. Analyzes capital efficiency and financial sustainability.',
      subcriteria: []
    }
  ]);
  const [hasCustomPreferences, setHasCustomPreferences] = useState(false);
  
  // General
  const [error, setError] = useState<string>('');
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const data = await api.getCompanies();
      setCompanies(data);
    } catch (err) {
      console.error('Failed to load companies:', err);
    }
  };

  // Step 1: Upload Deck + Checklist
  const handleUploadStep = async () => {
    if (!deckFile || !checklistFile) {
      setError('Please select both pitch deck and checklist PDFs');
      return;
    }

    if (!selectedStage || !selectedIndustry) {
      setError('Please select funding stage and industry');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Find matching company
      let companyId = '';
      if (companies.length > 0) {
        const matchingCompany = companies.find(
          c => c.stage === selectedStage && c.industry === selectedIndustry
        );
        companyId = matchingCompany?.id || companies[0].id;
      }

      console.log('📤 Uploading dual PDFs for wizard flow...');
      
      const deck = await api.uploadDualDeck(
        deckFile,
        checklistFile,
        companyId,
        userId,
        null // No context yet
      );

      setUploadedDeckId(deck.id);
      console.log('✅ Deck uploaded:', deck.id);
      
      // Move to context step
      setCurrentStep('context');
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload decks');
    } finally {
      setUploading(false);
    }
  };

  // Step 2: Skip context or proceed
  const handleSkipContext = () => {
    console.log('⏭️ Skipping VC Context step');
    setHasContext(false);
    setCurrentStep('preferences');
  };

  const handleContextComplete = async () => {
    if (!uploadedDeckId) return;

    try {
      // Check if any context items were uploaded
      const response = await vcContextApi.getContextItems(uploadedDeckId);
      const itemsArray = response.items || [];
      setHasContext(itemsArray.length > 0);
      console.log(`✅ Context step complete: ${itemsArray.length} items uploaded`);
      
      // Move to preferences
      setCurrentStep('preferences');
    } catch (err) {
      console.error('Failed to check context:', err);
      setCurrentStep('preferences'); // Proceed anyway
    }
  };

  // Step 3: Skip preferences or save
  const handleSkipPreferences = () => {
    console.log('⏭️ Skipping VC Preferences step');
    setHasCustomPreferences(false);
    startAnalysis();
  };

  const handleExportToDeckIntelligence = async () => {
    if (!uploadedDeckId) {
      alert('❌ No deck uploaded yet!');
      return;
    }

    try {
      // First save the preferences (call the save function but don't wait for completion flow)
      await handleSavePreferences();

      // Export to deck intelligence for the current deck
      const exportResponse = await fetch(`${API_URL}/vc-agent/export-to-deck-intelligence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckId: uploadedDeckId,
          userId: userId
        })
      });

      if (!exportResponse.ok) {
        throw new Error('Failed to export to Deck Intelligence');
      }

      const result = await exportResponse.json();
      console.log('✅ VC Preferences exported to Deck Intelligence');
      alert(`✅ Preferences exported to Deck Intelligence!\n\n${result.message}`);
    } catch (err: any) {
      console.error('Failed to export preferences:', err);
      alert(`❌ Export failed: ${err.message}`);
    }
  };

  const handleSavePreferences = async () => {
    setError('');
    
    try {
      console.log('💾 Saving VC preferences with full criteria...');
      
      // Convert criteria to the format expected by backend
      const criteriaPayload = {
        mainCriteria: criteria.map(c => ({
          id: c.id,
          name: c.name,
          weight: c.weight,
          description: c.description,
          subcriteria: c.subcriteria
        })),
        customCriteria: criteria.filter(c => c.customizable).map(c => ({
          name: c.name,
          weight: c.weight,
          subCriteria: c.subcriteria.map(sc => sc.name)
        }))
      };
      
      // Trigger prompt regeneration (agentic system) via API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/vc-agent/save-preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          industry: selectedIndustry,
          criteria: criteriaPayload
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅✅✅ PREFERENCES SAVED SUCCESSFULLY! ✅✅✅');
        console.log('📊 Result:', result);
        console.log('🎯 Preference ID:', result.preferenceId);
        console.log('🤖 Prompt Version:', result.promptVersion);
        console.log('📝 Criteria sent:', criteriaPayload);
        console.log('🏭 Industry:', selectedIndustry);
        console.log('👤 User ID:', userId);
        
        // Show visual alert
        alert(`✅ VC PREFERENCES SAVED!\n\n` +
              `Preference ID: ${result.preferenceId}\n` +
              `Prompt Version: ${result.promptVersion}\n` +
              `Industry: ${selectedIndustry}\n` +
              `Criteria: ${criteria.length} evaluation areas\n\n` +
              `These preferences will be used in Premium PDF analysis!`);
        
        setHasCustomPreferences(true);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Backend error:', errorData);
        alert(`❌ FAILED TO SAVE PREFERENCES!\n\nError: ${errorData.details || errorData.error}`);
        throw new Error(errorData.details || errorData.error || 'Failed to save preferences');
      }

      console.log('✅ Preferences saved with custom criteria - continuing to analysis...');
      startAnalysis();
    } catch (err: any) {
      console.error('Failed to save preferences:', err);
      setError(`Failed to save preferences: ${err.message}. Analysis will use defaults.`);
      // Proceed anyway after showing error
      setTimeout(startAnalysis, 3000);
    }
  };

  const startAnalysis = () => {
    console.log('🚀 Starting final analysis...');
    setCurrentStep('analyzing');
    
    // Give backend time to process, then notify parent
    setTimeout(() => {
      if (uploadedDeckId) {
        onComplete(uploadedDeckId, hasContext, hasCustomPreferences);
      }
    }, 2000);
  };

  // Render different steps
  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Upload className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Upload Pitch Deck</h2>
        <p className="text-slate-600">
          Start by uploading your pitch deck and evaluation checklist
        </p>
      </div>

      {/* Deck Upload */}
      <div className="bg-white rounded-lg border-2 border-slate-200 p-6">
        <label className="block mb-4">
          <span className="text-sm font-medium text-slate-700 mb-2 block">Pitch Deck (PDF, DOCX, PPT) *</span>
          <input
            type="file"
            accept=".pdf,.docx,.doc,.pptx,.ppt"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                // Check file size (100MB limit)
                if (file.size > 100 * 1024 * 1024) {
                  setError('Pitch deck file size must be under 100MB');
                  setDeckFile(null);
                  e.target.value = '';
                  return;
                }
                setDeckFile(file);
                setError('');
              }
            }}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {deckFile && (
            <div className="mt-2 flex items-center justify-between text-sm">
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                {deckFile.name}
              </div>
              <span className="text-slate-500">{(deckFile.size / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
          )}
          <p className="mt-1 text-xs text-slate-500">Max 100MB • PDF, DOCX, or PowerPoint</p>
        </label>

        <label className="block mb-4">
          <span className="text-sm font-medium text-slate-700 mb-2 block">Evaluation Checklist (PDF, DOCX, PPT) *</span>
          <input
            type="file"
            accept=".pdf,.docx,.doc,.pptx,.ppt"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                // Check file size (100MB limit)
                if (file.size > 100 * 1024 * 1024) {
                  setError('Checklist file size must be under 100MB');
                  setChecklistFile(null);
                  e.target.value = '';
                  return;
                }
                setChecklistFile(file);
                setError('');
              }
            }}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {checklistFile && (
            <div className="mt-2 flex items-center justify-between text-sm">
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                {checklistFile.name}
              </div>
              <span className="text-slate-500">{(checklistFile.size / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
          )}
          <p className="mt-1 text-xs text-slate-500">Max 100MB • PDF, DOCX, or PowerPoint</p>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700 mb-2 block">Funding Stage *</span>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select stage...</option>
              <option value="Pre-Seed">Pre-Seed</option>
              <option value="Seed">Seed</option>
              <option value="Series A">Series A</option>
              <option value="Series B">Series B</option>
              <option value="Series C+">Series C+</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700 mb-2 block">Industry *</span>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select industry...</option>
              <option value="SaaS">SaaS</option>
              <option value="Fintech">Fintech</option>
              <option value="Healthcare">Healthcare</option>
              <option value="E-commerce">E-commerce</option>
              <option value="AI/ML">AI/ML</option>
              <option value="Other">Other</option>
            </select>
          </label>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onCancel}
          className="px-6 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleUploadStep}
          disabled={uploading || !deckFile || !checklistFile || !selectedStage || !selectedIndustry}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <span>Next: Add Context</span>
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderContextStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
          <MessageSquare className="h-8 w-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Add VC Context</h2>
        <p className="text-slate-600">
          Upload meeting notes, transcripts, or other due diligence materials (optional)
        </p>
      </div>

      {uploadedDeckId && (
        <div className="bg-white rounded-lg border-2 border-slate-200 p-6">
          <VCContextManager 
            deckId={uploadedDeckId} 
            companyName={`Deck ${uploadedDeckId.slice(0, 8)}`}
            embedded={true}
          />
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep('upload')}
          className="px-6 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>
        <div className="flex space-x-3">
          <button
            onClick={handleSkipContext}
            className="px-6 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <SkipForward className="h-5 w-5" />
            <span>Skip Context</span>
          </button>
          <button
            onClick={handleContextComplete}
            className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2 transition-colors"
          >
            <span>Next: Preferences</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderPreferencesStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
          <Settings className="h-8 w-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Evaluation Preferences</h2>
        <p className="text-slate-600">
          Customize evaluation criteria, add custom factors, and set weights
        </p>
      </div>

      <div className="bg-white rounded-lg border-2 border-slate-200 p-6">
        <AdvancedVCEvaluation
          userId={userId}
          onPreferencesUpdate={() => setHasCustomPreferences(true)}
        />
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">{error}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrentStep('context')}
          className="px-6 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>
        <div className="flex space-x-3">
          <button
            onClick={handleExportToDeckIntelligence}
            className="px-6 py-3 text-white bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center space-x-2 transition-all font-semibold shadow-md hover:shadow-lg"
            title="Export preferences to Deck Intelligence"
          >
            <Download className="h-5 w-5" />
            <span>Export to Deck Intelligence</span>
          </button>
          <button
            onClick={handleSkipPreferences}
            className="px-6 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <SkipForward className="h-5 w-5" />
            <span>Use Defaults</span>
          </button>
          <button
            onClick={handleSavePreferences}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 transition-colors"
          >
            <span>Save & Analyze</span>
            <Sparkles className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderAnalyzingStep = () => (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-6">
        <Sparkles className="h-10 w-10 text-blue-600 animate-pulse" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Analyzing Your Deck</h2>
      <p className="text-slate-600 mb-6">
        AI is processing your deck{hasContext && ' with context'}{hasCustomPreferences && ' using custom preferences'}...
      </p>
      <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        <span>This may take 1-2 minutes</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center space-x-2 ${currentStep === 'upload' ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'upload' ? 'bg-blue-600 text-white' : 'bg-slate-200'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Upload</span>
            </div>
            <div className="flex-1 h-0.5 bg-slate-200 mx-4"></div>
            <div className={`flex items-center space-x-2 ${currentStep === 'context' ? 'text-purple-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'context' ? 'bg-purple-600 text-white' : 'bg-slate-200'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Context</span>
            </div>
            <div className="flex-1 h-0.5 bg-slate-200 mx-4"></div>
            <div className={`flex items-center space-x-2 ${currentStep === 'preferences' ? 'text-indigo-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'preferences' ? 'bg-indigo-600 text-white' : 'bg-slate-200'
              }`}>
                3
              </div>
              <span className="text-sm font-medium">Preferences</span>
            </div>
            <div className="flex-1 h-0.5 bg-slate-200 mx-4"></div>
            <div className={`flex items-center space-x-2 ${currentStep === 'analyzing' ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'analyzing' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-slate-200'
              }`}>
                4
              </div>
              <span className="text-sm font-medium">Analyze</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          {currentStep === 'upload' && renderUploadStep()}
          {currentStep === 'context' && renderContextStep()}
          {currentStep === 'preferences' && renderPreferencesStep()}
          {currentStep === 'analyzing' && renderAnalyzingStep()}
        </div>
      </div>
    </div>
  );
}
